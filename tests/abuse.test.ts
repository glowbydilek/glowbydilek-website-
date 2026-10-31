import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { clientIp } from "../src/lib/forms/ip.ts";
import { fingerprint, forgetSubmission, isDuplicate, LIMITS, markSubmitted, rateLimit, resetLimits } from "../src/lib/forms/rateLimit.ts";
import { isLikelySpam } from "../src/lib/forms/validation.ts";

const req = (h: Record<string, string>) => ({ headers: { get: (n: string) => h[n.toLowerCase()] ?? null } });

beforeEach(() => resetLimits());

test("rate limit: 5 per IP per 10 minutes, then blocked, then released", () => {
  const t0 = 1_000_000;
  for (let i = 0; i < LIMITS.ip.limit; i++) assert.equal(rateLimit("ip:a", LIMITS.ip.limit, LIMITS.ip.windowMs, t0 + i), true);
  assert.equal(rateLimit("ip:a", LIMITS.ip.limit, LIMITS.ip.windowMs, t0 + 10), false);
  assert.equal(rateLimit("ip:b", LIMITS.ip.limit, LIMITS.ip.windowMs, t0 + 10), true, "other IPs unaffected");
  assert.equal(rateLimit("ip:a", LIMITS.ip.limit, LIMITS.ip.windowMs, t0 + LIMITS.ip.windowMs + 10), true);
});

test("global limit caps distributed floods across many IPs", () => {
  let accepted = 0;
  for (let i = 0; i < 100; i++) if (rateLimit("global", LIMITS.global.limit, LIMITS.global.windowMs, 5000 + i)) accepted++;
  assert.equal(accepted, LIMITS.global.limit);
});

test("duplicate submissions are detected for 24 hours and can be released after a failed send", () => {
  const key = `dup:${fingerprint("a@b.nl", "same message")}`;
  assert.equal(isDuplicate(key, 0), false);
  markSubmitted(key, 0);
  assert.equal(isDuplicate(key, 60_000), true);
  assert.equal(isDuplicate(key, LIMITS.duplicateMs + 1), false);
  markSubmitted(key, 0);
  forgetSubmission(key);
  assert.equal(isDuplicate(key, 1), false);
});

test("fingerprints are hashes, never the raw value", () => {
  const f = fingerprint("someone@example.com");
  assert.ok(!f.includes("example"));
  assert.match(f, /^[0-9a-f]{32}$/);
});

test("client IP only trusts proxy-set headers", () => {
  assert.equal(clientIp(req({ "x-real-ip": "198.51.100.7", "x-forwarded-for": "1.2.3.4" }), {}), "198.51.100.7");
  // A client can prepend fake entries; only the last (proxy-appended) one counts.
  assert.equal(clientIp(req({ "x-forwarded-for": "6.6.6.6, 198.51.100.8" }), {}), "198.51.100.8");
  assert.equal(clientIp(req({ "cf-connecting-ip": "6.6.6.6" }), {}), "unknown");
  assert.equal(clientIp(req({ "cf-connecting-ip": "203.0.113.1" }), { TRUST_CF_CONNECTING_IP: "true" }), "203.0.113.1");
});

test("link spam is treated as spam", () => {
  const base = { elapsedMs: 10_000, company: "" };
  assert.equal(isLikelySpam({ ...base, message: "see https://a.x https://b.x http://c.x www.d.x" }), true);
  assert.equal(isLikelySpam({ ...base, message: "Is https://glowbydilek.nl/prijzen up to date?" }), false);
});
