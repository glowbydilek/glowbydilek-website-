/**
 * Cryptographic primitives for authentication. Node's built-in `crypto`
 * only (no native add-ons, so it builds and runs on Hostinger).
 *
 * - Passwords and recovery codes: scrypt (N=2^15, r=8, p=1, 64-byte key,
 *   16-byte salt), compared in constant time.
 * - Session and reset tokens: 32 random bytes (base64url) given to the
 *   browser; only their SHA-256 hash is stored.
 * - MFA secrets: AES-256-GCM, key derived from AUTH_SECRET with HKDF.
 */
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT = { N: 32768, r: 8, p: 1, keyLen: 64, maxmem: 64 * 1024 * 1024 };

function scryptAsync(password: string, salt: Buffer, keyLen: number, opts: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, keyLen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.keyLen, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    // Spend comparable time so missing accounts cannot be detected by timing.
    await scryptAsync(password, randomBytes(16), SCRYPT.keyLen, SCRYPT);
    return false;
  }
  const [alg, N, r, p, saltB64, keyB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64url");
  const key = await scryptAsync(password, Buffer.from(saltB64, "base64url"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Random URL-safe token (default 32 bytes = 256 bits). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Keyed hash for IPs in logs (not reversible without AUTH_SECRET). */
export function hashIp(ip: string | undefined | null): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256").update(`${authSecret()}:ip:${ip}`).digest("hex").slice(0, 32);
}

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_DEV_SECRET) {
    throw new Error("AUTH_SECRET must be set (at least 32 characters) in production");
  }
  return "development-only-secret-do-not-use-in-production-0000";
}

function aesKey(): Buffer {
  return Buffer.from(hkdfSync("sha256", authSecret(), "glowbydilek", "mfa-secret-v1", 32));
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", aesKey(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

export function decryptSecret(payload: string): string {
  const [v, ivB, tagB, encB] = payload.split(".");
  if (v !== "v1") throw new Error("unknown secret format");
  const d = createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivB, "base64url"));
  d.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([d.update(Buffer.from(encB, "base64url")), d.final()]).toString("utf8");
}

/** Password policy: 12+ characters, not trivially weak. Returns an error code or null. */
export function checkPasswordPolicy(password: string, email?: string): "tooShort" | "tooLong" | "weak" | null {
  if (password.length < 12) return "tooShort";
  if (password.length > 200) return "tooLong";
  const lower = password.toLowerCase();
  const weak = ["password", "wachtwoord", "glowbydilek", "123456", "qwerty", "welkom"];
  if (weak.some((w) => lower.includes(w))) return "weak";
  if (email && lower.includes(email.split("@")[0].toLowerCase())) return "weak";
  if (new Set(password).size < 6) return "weak";
  return null;
}

/** Human-friendly recovery code: 10 chars in two groups, e.g. "k7mq2-x9tv4". */
export function recoveryCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}
