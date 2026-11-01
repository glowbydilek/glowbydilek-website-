/**
 * Authentication service (database logic, framework-free so it can be
 * tested against a real MariaDB). Cookies and redirects live in session.ts.
 *
 * Security properties
 * - No self-registration. The owner account is provisioned without a
 *   password; the owner sets one through the emailed reset link.
 * - Neutral answers: login and reset never reveal whether an email exists.
 * - Brute force: per-IP and per-account limits (MySQL-backed) plus a
 *   temporary account lock after repeated failures.
 * - Reset tokens: 256-bit, stored as SHA-256, valid 15 minutes, single use
 *   (atomic conditional update); using one revokes every session.
 * - MFA: TOTP (RFC 6238) with replay protection, 10 single-use recovery codes.
 */
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { Secret, TOTP } from "otpauth";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { claimOnce, clearLimit, hitLimit } from "../db/limits";
import { mfaRecoveryCodes, passwordResetTokens, sessions, users } from "../db/schema";
import {
  checkPasswordPolicy,
  decryptSecret,
  encryptSecret,
  hashIp,
  hashPassword,
  randomToken,
  recoveryCode,
  sha256,
  verifyPassword,
} from "./crypto";

export const SESSION_ABSOLUTE_MS = 30 * 24 * 3600_000; // 30 days
export const SESSION_IDLE_MS = 14 * 24 * 3600_000; // 14 days without use
export const RESET_TTL_MS = 15 * 60_000; // 15 minutes
const LOCK_AFTER = 8;
const LOCK_MS = 15 * 60_000;

export type User = typeof users.$inferSelect;
export type Ctx = { ip?: string | null; userAgent?: string | null; now?: Date };

const normEmail = (e: string) => e.trim().toLowerCase();

export function ownerEmail(): string {
  return normEmail(process.env.OWNER_EMAIL || "hello@glowbydilek.nl");
}

/** Creates the owner account (without a password) if no user exists yet. Idempotent. */
export async function ensureOwner(db: DB): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return;
  await db.insert(users).ignore().values({ email: ownerEmail(), name: "Dilek", role: "owner" });
  await audit(db, { action: "auth.owner_provisioned", details: { email: ownerEmail() } });
}

// ───────────────────────────────────────────────────────────── Sessions

export async function createSession(db: DB, user: User, ctx: Ctx, mfaPassed: boolean): Promise<string> {
  const now = ctx.now ?? new Date();
  const token = randomToken();
  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: sha256(token),
    mfaPassed,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
    userAgent: ctx.userAgent?.slice(0, 250) ?? null,
    ipHash: hashIp(ctx.ip),
  });
  return token;
}

export type SessionInfo = { sessionId: number; user: User; mfaPassed: boolean; mfaRequired: boolean };

export async function getSession(db: DB, token: string | undefined | null, now = new Date()): Promise<SessionInfo | null> {
  if (!token || token.length > 100) return null;
  const rows = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, sha256(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const { sessions: s, users: u } = row;
  if (u.disabled) return null;
  if (now.getTime() - s.lastSeenAt.getTime() > SESSION_IDLE_MS) return null;
  if (u.passwordChangedAt && u.passwordChangedAt.getTime() > s.createdAt.getTime() + 1000) return null;
  if (now.getTime() - s.lastSeenAt.getTime() > 5 * 60_000) {
    await db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, s.id));
  }
  return { sessionId: s.id, user: u, mfaPassed: s.mfaPassed, mfaRequired: u.mfaEnabled };
}

export async function revokeSession(db: DB, token: string, now = new Date()) {
  await db.update(sessions).set({ revokedAt: now }).where(eq(sessions.tokenHash, sha256(token)));
}

export async function revokeAllSessions(db: DB, userId: number, now = new Date(), exceptSessionId?: number) {
  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt), exceptSessionId ? sql`${sessions.id} <> ${exceptSessionId}` : undefined));
}

// ─────────────────────────────────────────────────────────────── Login

export type LoginResult =
  | { ok: true; token: string; mfaRequired: boolean; user: User }
  | { ok: false; reason: "invalid" | "rateLimited" };

export async function login(db: DB, emailRaw: string, password: string, ctx: Ctx): Promise<LoginResult> {
  const now = ctx.now ?? new Date();
  const email = normEmail(emailRaw).slice(0, 190);
  const ipKey = hashIp(ctx.ip) ?? "unknown";
  const okIp = await hitLimit(db, `login:ip:${ipKey}`, 20, 15 * 60_000, now);
  const okAcct = await hitLimit(db, `login:acct:${sha256(email)}`, 10, 15 * 60_000, now);
  if (!okIp || !okAcct) {
    await audit(db, { action: "auth.login_rate_limited", ipHash: hashIp(ctx.ip) });
    return { ok: false, reason: "rateLimited" };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const locked = user?.lockedUntil && user.lockedUntil > now;
  const valid = await verifyPassword(password, user && !user.disabled && !locked ? user.passwordHash : null);

  if (!user || !valid) {
    if (user) {
      const failed = user.failedLogins + 1;
      await db
        .update(users)
        .set({ failedLogins: failed, lockedUntil: failed >= LOCK_AFTER ? new Date(now.getTime() + LOCK_MS) : user.lockedUntil })
        .where(eq(users.id, user.id));
      if (failed === LOCK_AFTER) await audit(db, { userId: user.id, action: "auth.account_locked", ipHash: hashIp(ctx.ip) });
    }
    await audit(db, { userId: user?.id ?? null, action: "auth.login_failed", ipHash: hashIp(ctx.ip) });
    return { ok: false, reason: "invalid" };
  }

  await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: now }).where(eq(users.id, user.id));
  await clearLimit(db, `login:acct:${sha256(email)}`);
  const token = await createSession(db, user, ctx, !user.mfaEnabled);
  await audit(db, { userId: user.id, action: user.mfaEnabled ? "auth.password_ok_mfa_pending" : "auth.login", ipHash: hashIp(ctx.ip) });
  return { ok: true, token, mfaRequired: user.mfaEnabled, user };
}

// ───────────────────────────────────────────────────────── Password reset

/**
 * Creates a reset token for the account, if it exists. The caller emails
 * the link; the token is NEVER stored in plain text or logged.
 * Always returns the same shape to the caller's UI (neutral message).
 */
export async function createPasswordReset(
  db: DB,
  emailRaw: string,
  ctx: Ctx,
): Promise<{ status: "created"; token: string; user: User } | { status: "neutral" }> {
  const now = ctx.now ?? new Date();
  const email = normEmail(emailRaw).slice(0, 190);
  const okIp = await hitLimit(db, `reset:ip:${hashIp(ctx.ip) ?? "unknown"}`, 5, 3600_000, now);
  const okAcct = await hitLimit(db, `reset:acct:${sha256(email)}`, 3, 3600_000, now);
  if (!okIp || !okAcct) {
    await audit(db, { action: "auth.reset_rate_limited", ipHash: hashIp(ctx.ip) });
    return { status: "neutral" };
  }
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.disabled) {
    await audit(db, { action: "auth.reset_requested_unknown", ipHash: hashIp(ctx.ip) });
    return { status: "neutral" };
  }
  // Only the newest link works.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
  const token = randomToken();
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(now.getTime() + RESET_TTL_MS),
    createdAt: now,
  });
  await audit(db, { userId: user.id, action: "auth.reset_requested", ipHash: hashIp(ctx.ip) });
  return { status: "created", token, user };
}

export type ResetResult = { ok: true; user: User } | { ok: false; reason: "invalidToken" | "tooShort" | "tooLong" | "weak" };

/** Checks a token without consuming it (to show the form or an "expired" message). */
export async function checkResetToken(db: DB, token: string, now = new Date()): Promise<boolean> {
  if (!token || token.length > 100) return false;
  const rows = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, sha256(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)))
    .limit(1);
  return rows.length === 1;
}

export async function resetPassword(db: DB, token: string, newPassword: string, ctx: Ctx): Promise<ResetResult> {
  const now = ctx.now ?? new Date();
  if (!token || token.length > 100) return { ok: false, reason: "invalidToken" };
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(eq(passwordResetTokens.tokenHash, sha256(token)))
    .limit(1);
  if (!row || row.password_reset_tokens.usedAt || row.password_reset_tokens.expiresAt <= now || row.users.disabled) {
    await audit(db, { action: "auth.reset_invalid_token", ipHash: hashIp(ctx.ip) });
    return { ok: false, reason: "invalidToken" };
  }
  const policy = checkPasswordPolicy(newPassword, row.users.email);
  if (policy) return { ok: false, reason: policy };

  const hash = await hashPassword(newPassword);
  const user = row.users;
  const consumed = await db.transaction(async (tx) => {
    // Atomic single use: only one request can flip used_at from NULL.
    const [res] = (await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.id, row.password_reset_tokens.id), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)))) as unknown as [
      { affectedRows: number },
    ];
    if (res.affectedRows !== 1) return false;
    await tx
      .update(users)
      .set({ passwordHash: hash, passwordChangedAt: now, failedLogins: 0, lockedUntil: null })
      .where(eq(users.id, user.id));
    await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt)));
    return true;
  });
  if (!consumed) return { ok: false, reason: "invalidToken" };
  await clearLimit(db, `login:acct:${sha256(user.email)}`);
  await audit(db, { userId: user.id, action: "auth.password_reset", ipHash: hashIp(ctx.ip) });
  return { ok: true, user };
}

export async function changePassword(
  db: DB,
  info: SessionInfo,
  current: string,
  next: string,
  ctx: Ctx,
): Promise<{ ok: true } | { ok: false; reason: "wrongPassword" | "tooShort" | "tooLong" | "weak" }> {
  const now = ctx.now ?? new Date();
  if (!(await verifyPassword(current, info.user.passwordHash))) {
    await audit(db, { userId: info.user.id, action: "auth.change_password_failed", ipHash: hashIp(ctx.ip) });
    return { ok: false, reason: "wrongPassword" };
  }
  const policy = checkPasswordPolicy(next, info.user.email);
  if (policy) return { ok: false, reason: policy };
  await db.update(users).set({ passwordHash: await hashPassword(next), passwordChangedAt: now }).where(eq(users.id, info.user.id));
  // Keep this device signed in with a fresh session; every other session ends.
  await revokeAllSessions(db, info.user.id, now);
  await audit(db, { userId: info.user.id, action: "auth.password_changed", ipHash: hashIp(ctx.ip) });
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────── MFA

const ISSUER = "Glow by Dilek";

function totpFor(secretB32: string, label: string) {
  return new TOTP({ issuer: ISSUER, label, algorithm: "SHA1", digits: 6, period: 30, secret: Secret.fromBase32(secretB32) });
}

/** Starts enrolment: stores a new (not yet active) secret and returns the otpauth URI. */
export async function startMfaEnrolment(db: DB, user: User): Promise<{ uri: string; secret: string }> {
  if (user.mfaEnabled) throw new Error("MFA already enabled");
  const secret = new Secret({ size: 20 }).base32;
  await db.update(users).set({ mfaSecretEnc: encryptSecret(secret) }).where(eq(users.id, user.id));
  return { uri: totpFor(secret, user.email).toString(), secret };
}

async function checkTotp(db: DB, user: User, code: string, now: Date): Promise<boolean> {
  if (!user.mfaSecretEnc || !/^\d{6}$/.test(code)) return false;
  const totp = totpFor(decryptSecret(user.mfaSecretEnc), user.email);
  const delta = totp.validate({ token: code, timestamp: now.getTime(), window: 1 });
  if (delta === null) return false;
  const counter = Math.floor(now.getTime() / 30_000) + delta;
  // Each code may be used once (replay protection).
  return claimOnce(db, `totp:${user.id}:${counter}`, 3 * 60_000, now);
}

export async function confirmMfaEnrolment(db: DB, user: User, code: string, ctx: Ctx): Promise<{ ok: true; recoveryCodes: string[] } | { ok: false }> {
  const now = ctx.now ?? new Date();
  const [fresh] = await db.select().from(users).where(eq(users.id, user.id));
  if (!fresh || fresh.mfaEnabled || !(await checkTotp(db, fresh, code, now))) return { ok: false };
  const codes = Array.from({ length: 10 }, recoveryCode);
  const hashes = await Promise.all(codes.map((c) => hashPassword(c)));
  await db.transaction(async (tx) => {
    await tx.update(users).set({ mfaEnabled: true }).where(eq(users.id, user.id));
    await tx.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, user.id));
    await tx.insert(mfaRecoveryCodes).values(hashes.map((codeHash) => ({ userId: user.id, codeHash })));
  });
  await audit(db, { userId: user.id, action: "auth.mfa_enabled", ipHash: hashIp(ctx.ip) });
  return { ok: true, recoveryCodes: codes };
}

/** Completes the second step of login with a TOTP code or a recovery code. */
export async function verifyMfa(db: DB, info: SessionInfo, input: string, ctx: Ctx): Promise<{ ok: true; usedRecovery: boolean } | { ok: false; reason: "invalid" | "rateLimited" }> {
  const now = ctx.now ?? new Date();
  if (!(await hitLimit(db, `mfa:${info.user.id}`, 8, 15 * 60_000, now))) return { ok: false, reason: "rateLimited" };
  const code = input.trim().toLowerCase().replace(/\s+/g, "");
  let usedRecovery = false;
  let ok = await checkTotp(db, info.user, code, now);
  if (!ok && /^[a-z0-9]{5}-?[a-z0-9]{5}$/.test(code)) {
    const normalized = code.includes("-") ? code : `${code.slice(0, 5)}-${code.slice(5)}`;
    const candidates = await db
      .select()
      .from(mfaRecoveryCodes)
      .where(and(eq(mfaRecoveryCodes.userId, info.user.id), isNull(mfaRecoveryCodes.usedAt)));
    for (const c of candidates) {
      if (await verifyPassword(normalized, c.codeHash)) {
        const [res] = (await db
          .update(mfaRecoveryCodes)
          .set({ usedAt: now })
          .where(and(eq(mfaRecoveryCodes.id, c.id), isNull(mfaRecoveryCodes.usedAt)))) as unknown as [{ affectedRows: number }];
        ok = res.affectedRows === 1;
        usedRecovery = ok;
        break;
      }
    }
  }
  if (!ok) {
    await audit(db, { userId: info.user.id, action: "auth.mfa_failed", ipHash: hashIp(ctx.ip) });
    return { ok: false, reason: "invalid" };
  }
  await db.update(sessions).set({ mfaPassed: true }).where(eq(sessions.id, info.sessionId));
  await clearLimit(db, `mfa:${info.user.id}`);
  await audit(db, { userId: info.user.id, action: usedRecovery ? "auth.login_recovery_code" : "auth.login", ipHash: hashIp(ctx.ip) });
  return { ok: true, usedRecovery };
}

export async function remainingRecoveryCodes(db: DB, userId: number): Promise<number> {
  const rows = await db
    .select({ id: mfaRecoveryCodes.id })
    .from(mfaRecoveryCodes)
    .where(and(eq(mfaRecoveryCodes.userId, userId), isNull(mfaRecoveryCodes.usedAt)));
  return rows.length;
}

export async function disableMfa(db: DB, info: SessionInfo, password: string, ctx: Ctx): Promise<boolean> {
  if (!(await verifyPassword(password, info.user.passwordHash))) return false;
  await db.update(users).set({ mfaEnabled: false, mfaSecretEnc: null }).where(eq(users.id, info.user.id));
  await db.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, info.user.id));
  await audit(db, { userId: info.user.id, action: "auth.mfa_disabled", ipHash: hashIp(ctx.ip) });
  return true;
}

/** Housekeeping for the cron job. */
export async function purgeAuthData(db: DB, now = new Date()) {
  await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date(now.getTime() - 24 * 3600_000)));
  await db
    .delete(sessions)
    .where(or(lt(sessions.expiresAt, now), lt(sessions.revokedAt, new Date(now.getTime() - 7 * 24 * 3600_000))));
}
