import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { ensureOwner, login, setInitialPassword, setupTokenEnabled } from "../src/lib/auth/service.ts";
import { auditLogs, users } from "../src/lib/db/schema.ts";
import { DB_HINT, dbErrorKind } from "../src/lib/ops/errors.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

test("database errors are classified without echoing host names", () => {
  assert.equal(dbErrorKind({ code: "ER_ACCESS_DENIED_ERROR", message: "Access denied for user 'u1'@'srv1.hstgr.io'" }), "auth");
  assert.equal(dbErrorKind({ code: "ECONNREFUSED" }), "unreachable");
  assert.equal(dbErrorKind({ code: "ER_BAD_DB_ERROR" }), "unknownDb");
  assert.equal(dbErrorKind({ code: "ER_NO_SUCH_TABLE" }), "noTables");
  assert.equal(dbErrorKind(new Error("boom")), "other");
  for (const h of Object.values(DB_HINT)) assert.ok(!/password=|@|u\d{6,}/.test(h), "no credentials or account names");
});

describe("first password with OWNER_SETUP_TOKEN (no email needed)", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  const TOKEN = "setup-token-0123456789abcdefghij";
  const env = { OWNER_SETUP_TOKEN: TOKEN, OWNER_EMAIL: "hello@glowbydilek.nl" } as unknown as NodeJS.ProcessEnv;
  const ctx = { ip: "203.0.113.9" };
  beforeEach(async () => {
    db = await resetDb();
    process.env.OWNER_EMAIL = "hello@glowbydilek.nl";
  });

  test("off unless a long token is set", async () => {
    assert.equal(setupTokenEnabled({} as NodeJS.ProcessEnv), false);
    assert.equal(setupTokenEnabled({ OWNER_SETUP_TOKEN: "short" } as unknown as NodeJS.ProcessEnv), false);
    assert.deepEqual(await setInitialPassword(db, { token: TOKEN, email: "hello@glowbydilek.nl", password: "Rustig-lavendel-2026-glow" }, ctx, {} as NodeJS.ProcessEnv), { ok: false, reason: "disabled" });
  });

  test("wrong token or email is refused; the right one sets the password once, then the route closes", async () => {
    await ensureOwner(db);
    assert.deepEqual(await setInitialPassword(db, { token: "x".repeat(30), email: "hello@glowbydilek.nl", password: "Rustig-lavendel-2026-glow" }, ctx, env), { ok: false, reason: "invalid" });
    assert.deepEqual(await setInitialPassword(db, { token: TOKEN, email: "someone@example.com", password: "Rustig-lavendel-2026-glow" }, ctx, env), { ok: false, reason: "invalid" });
    assert.deepEqual(await setInitialPassword(db, { token: TOKEN, email: "HELLO@glowbydilek.nl ", password: "kort" }, ctx, env), { ok: false, reason: "tooShort" });
    assert.deepEqual(await setInitialPassword(db, { token: TOKEN, email: "HELLO@glowbydilek.nl ", password: "Rustig-lavendel-2026-glow" }, ctx, env), { ok: true });
    const r = await login(db, "hello@glowbydilek.nl", "Rustig-lavendel-2026-glow", ctx);
    assert.equal(r.ok, true, "owner can now log in");
    assert.deepEqual(await setInitialPassword(db, { token: TOKEN, email: "hello@glowbydilek.nl", password: "Ander-wachtwoord-2026-x" }, { ip: "203.0.113.10" }, env), { ok: false, reason: "invalid" }, "cannot overwrite an existing password");
    const [u] = await db.select().from(users).where(eq(users.email, "hello@glowbydilek.nl"));
    assert.ok(u.passwordHash && !u.passwordHash.includes("Rustig"));
    const actions = (await db.select().from(auditLogs)).map((a) => a.action);
    assert.ok(actions.includes("auth.initial_password_set") && actions.includes("auth.setup_refused"));
  });

  test("rate limited per IP", async () => {
    await ensureOwner(db);
    for (let i = 0; i < 5; i++) await setInitialPassword(db, { token: "y".repeat(30), email: "hello@glowbydilek.nl", password: "Rustig-lavendel-2026-glow" }, { ip: "198.51.100.1" }, env);
    assert.deepEqual(await setInitialPassword(db, { token: TOKEN, email: "hello@glowbydilek.nl", password: "Rustig-lavendel-2026-glow" }, { ip: "198.51.100.1" }, env), { ok: false, reason: "rateLimited" });
  });
});
