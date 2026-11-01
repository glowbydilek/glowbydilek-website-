/**
 * Abuse limits. Stored in MySQL when a database is configured (see
 * src/lib/forms/handler.ts); these in-memory maps are the fallback.
 * Keys are keyed HMAC-SHA-256 fingerprints (secret: AUTH_SECRET), so no raw
 * IP or email address is stored, and an IP cannot be recovered by hashing
 * every possible address.
 *
 * - per IP and form:     5 submissions / 10 min
 * - per email address:   3 submissions / hour (both forms)
 * - global (all forms): 40 submissions / 10 min — caps distributed floods so
 *   the mailbox can never be overwhelmed
 * - duplicates:          the same submission content is accepted once / 24 h
 *
 */
import { createHmac } from "node:crypto";

const windows = new Map<string, number[]>();
const seen = new Map<string, number>();

export const LIMITS = {
  ip: { limit: 5, windowMs: 10 * 60_000 },
  email: { limit: 3, windowMs: 60 * 60_000 },
  global: { limit: 40, windowMs: 10 * 60_000 },
  duplicateMs: 24 * 60 * 60_000,
} as const;

export function fingerprint(...parts: string[]): string {
  const key = process.env.AUTH_SECRET || "glowbydilek-fingerprint-fallback";
  return createHmac("sha256", key).update(parts.join("\u0000")).digest("hex").slice(0, 32);
}

/** Sliding-window limiter. Returns false when the limit is reached. */
export function rateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000, now = Date.now()): boolean {
  const recent = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    windows.set(key, recent);
    return false;
  }
  recent.push(now);
  windows.set(key, recent);
  if (windows.size > 5000) {
    for (const [k, v] of windows) if (v.every((t) => now - t >= windowMs)) windows.delete(k);
  }
  return true;
}

/** True when this exact submission was already accepted recently. */
export function isDuplicate(key: string, now = Date.now()): boolean {
  for (const [k, exp] of seen) if (exp <= now) seen.delete(k);
  return seen.has(key);
}

export function markSubmitted(key: string, now = Date.now()) {
  seen.set(key, now + LIMITS.duplicateMs);
}

export function forgetSubmission(key: string) {
  seen.delete(key);
}

export function resetLimits() {
  windows.clear();
  seen.clear();
}
