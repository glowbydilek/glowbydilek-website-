import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { Secret, TOTP } from "otpauth";
import { checkPasswordPolicy, decryptSecret, encryptSecret, hashPassword, verifyPassword } from "../src/lib/auth/crypto.ts";
import {
  changePassword,
  checkResetToken,
  confirmMfaEnrolment,
  createPasswordReset,
  ensureOwner,
  getSession,
  login,
  resetPassword,
  startMfaEnrolment,
  verifyMfa,
} from "../src/lib/auth/service.ts";
import { passwordResetTokens, sessions, users } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

const PW = "Lotus-glow-2026!";
const ctx = { ip: "203.0.113.5", userAgent: "test" };

test("password hashing and policy", async () => {
  const h = await hashPassword(PW);
  assert.match(h, /^scrypt\$32768\$8\$1\$/);
  assert.ok(!h.includes(PW));
  assert.equal(await verifyPassword(PW, h), true);
  assert.equal(await verifyPassword("wrong-password-123", h), false);
  assert.equal(await verifyPassword(PW, null), false);
  assert.equal(checkPasswordPolicy("short"), "tooShort");
  assert.equal(checkPasswordPolicy("mijnwachtwoord123"), "weak");
  assert.equal(checkPasswordPolicy("aaaaaaaaaaaaaa"), "weak");
  assert.equal(checkPasswordPolicy(PW), null);
  const enc = encryptSecret("JBSWY3DPEHPK3PXP");
  assert.notEqual(enc, "JBSWY3DPEHPK3PXP");
  assert.equal(decryptSecret(enc), "JBSWY3DPEHPK3PXP");
});

describe("auth against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;

  async function ownerWithPassword() {
    await ensureOwner(db);
    const r = await createPasswordReset(db, "hello@glowbydilek.nl", ctx);
    assert.equal(r.status, "created");
    const done = await resetPassword(db, (r as { token: string }).token, PW, ctx);
    assert.equal(done.ok, true);
  }

  beforeEach(async () => {
    db = await resetDb();
  });

  test("owner is provisioned without a password; no default password exists", async () => {
    await ensureOwner(db);
    await ensureOwner(db);
    const all = await db.select().from(users);
    assert.equal(all.length, 1);
    assert.equal(all[0].email, "hello@glowbydilek.nl");
    assert.equal(all[0].passwordHash, null);
    const r = await login(db, "hello@glowbydilek.nl", "", ctx);
    assert.equal(r.ok, false);
  });

  test("reset token: hashed at rest, 15-minute expiry, single use, revokes sessions", async () => {
    await ownerWithPassword();
    const logged = await login(db, "Hello@GlowByDilek.nl", PW, ctx);
    assert.ok(logged.ok);
    const sessionToken = (logged as { token: string }).token;
    assert.ok(await getSession(db, sessionToken));

    const r = (await createPasswordReset(db, "hello@glowbydilek.nl", ctx)) as { status: "created"; token: string };
    const stored = await db.select().from(passwordResetTokens);
    assert.ok(stored.every((t) => t.tokenHash !== r.token && t.tokenHash.length === 64), "only the SHA-256 is stored");

    // expired after 15 minutes
    const later = new Date(Date.now() + 15 * 60_000 + 1000);
    assert.equal(await checkResetToken(db, r.token, later), false);
    assert.equal((await resetPassword(db, r.token, "Another-strong-pass-9", { ...ctx, now: later })).ok, false);

    // valid within the window; weak passwords rejected without consuming the token
    assert.deepEqual(await resetPassword(db, r.token, "short", ctx), { ok: false, reason: "tooShort" });
    assert.equal((await resetPassword(db, r.token, "Another-strong-pass-9", ctx)).ok, true);
    // single use
    assert.deepEqual(await resetPassword(db, r.token, "Third-strong-pass-77", ctx), { ok: false, reason: "invalidToken" });
    // previous sessions are invalid
    assert.equal(await getSession(db, sessionToken), null);
    assert.equal((await login(db, "hello@glowbydilek.nl", PW, ctx)).ok, false);
    assert.equal((await login(db, "hello@glowbydilek.nl", "Another-strong-pass-9", ctx)).ok, true);
  });

  test("only the newest reset link works", async () => {
    await ensureOwner(db);
    const a = (await createPasswordReset(db, "hello@glowbydilek.nl", ctx)) as { token: string };
    const b = (await createPasswordReset(db, "hello@glowbydilek.nl", ctx)) as { token: string };
    assert.equal(await checkResetToken(db, a.token), false);
    assert.equal(await checkResetToken(db, b.token), true);
  });

  test("reset requests are neutral for unknown emails and rate-limited", async () => {
    await ensureOwner(db);
    assert.deepEqual(await createPasswordReset(db, "someone@example.com", ctx), { status: "neutral" });
    const ip = { ...ctx, ip: "198.51.100.77" };
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await createPasswordReset(db, "hello@glowbydilek.nl", ip)).status);
    assert.deepEqual(results, ["created", "created", "created", "neutral"]);
  });

  test("failed logins lock the account temporarily and are rate-limited", async () => {
    await ownerWithPassword();
    for (let i = 0; i < 8; i++) assert.equal((await login(db, "hello@glowbydilek.nl", "wrong-guess-123", { ...ctx, ip: `192.0.2.${i}` })).ok, false);
    const [u] = await db.select().from(users);
    assert.ok(u.lockedUntil && u.lockedUntil > new Date(), "locked");
    // even the right password is refused while locked
    assert.equal((await login(db, "hello@glowbydilek.nl", PW, { ...ctx, ip: "192.0.2.50" })).ok, false);
    // per-account limiter
    const r = await login(db, "hello@glowbydilek.nl", PW, { ...ctx, ip: "192.0.2.51" });
    assert.ok(!r.ok);
    // unlocked after 15 minutes
    const later = new Date(Date.now() + 16 * 60_000);
    assert.equal((await login(db, "hello@glowbydilek.nl", PW, { ...ctx, ip: "192.0.2.60", now: later })).ok, true);
  });

  test("MFA: enrolment, login requires the code, replay rejected, recovery code single use", async () => {
    await ownerWithPassword();
    const first = (await login(db, "hello@glowbydilek.nl", PW, ctx)) as { token: string; user: typeof users.$inferSelect };
    const info = (await getSession(db, first.token))!;
    const { secret, uri } = await startMfaEnrolment(db, info.user);
    assert.match(uri, /^otpauth:\/\/totp\/Glow%20by%20Dilek/);
    const totp = new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 });
    assert.equal((await confirmMfaEnrolment(db, info.user, "000000", ctx)).ok, false);
    const enrolled = await confirmMfaEnrolment(db, info.user, totp.generate(), ctx);
    assert.ok(enrolled.ok);
    const codes = (enrolled as { recoveryCodes: string[] }).recoveryCodes;
    assert.equal(codes.length, 10);

    const second = (await login(db, "hello@glowbydilek.nl", PW, { ...ctx, ip: "203.0.113.6" })) as { token: string; mfaRequired: boolean };
    assert.equal(second.mfaRequired, true);
    const pending = (await getSession(db, second.token))!;
    assert.equal(pending.mfaPassed, false);
    // the code used during enrolment cannot be replayed
    const code = totp.generate();
    const replay = await verifyMfa(db, pending, code, ctx);
    assert.equal(replay.ok, false);
    // a recovery code works once
    assert.deepEqual(await verifyMfa(db, pending, codes[0], ctx), { ok: true, usedRecovery: true });
    assert.equal((await getSession(db, second.token))!.mfaPassed, true);
    const third = (await login(db, "hello@glowbydilek.nl", PW, { ...ctx, ip: "203.0.113.7" })) as { token: string };
    const p3 = (await getSession(db, third.token))!;
    assert.equal((await verifyMfa(db, p3, codes[0], ctx)).ok, false);
    assert.equal((await verifyMfa(db, p3, codes[1].replace("-", ""), ctx)).ok, true);
  });

  test("changing the password ends every session", async () => {
    await ownerWithPassword();
    const a = (await login(db, "hello@glowbydilek.nl", PW, ctx)) as { token: string };
    const b = (await login(db, "hello@glowbydilek.nl", PW, ctx)) as { token: string };
    const info = (await getSession(db, a.token))!;
    assert.deepEqual(await changePassword(db, info, "nope-nope-nope-1", "New-strong-pass-42", ctx), { ok: false, reason: "wrongPassword" });
    assert.deepEqual(await changePassword(db, info, PW, "New-strong-pass-42", ctx), { ok: true });
    assert.equal(await getSession(db, b.token), null);
    const all = await db.select().from(sessions).where(eq(sessions.userId, info.user.id));
    assert.ok(all.every((s) => s.revokedAt));
  });
});
