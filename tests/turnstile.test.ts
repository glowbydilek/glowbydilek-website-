import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  resetTurnstileMemory,
  TURNSTILE_DUMMY_TOKEN,
  TURNSTILE_TEST_SECRET,
  TURNSTILE_TEST_SITE_KEY,
  turnstileConfig,
  turnstileSiteKey,
  verifyTurnstile,
  type TurnstileConfig,
} from "../src/lib/forms/turnstile.ts";

const live: TurnstileConfig = {
  secret: "live-secret",
  mode: "live",
  hostnames: ["glowbydilek.nl", "www.glowbydilek.nl"],
  verifyUrl: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
};
const NOW = Date.parse("2026-11-01T12:00:00Z");

function cf(body: Record<string, unknown>, status = 200) {
  const calls: URLSearchParams[] = [];
  const fetchImpl = (async (_url: string, init: { body: URLSearchParams }) => {
    calls.push(init.body);
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const ok = { success: true, hostname: "glowbydilek.nl", action: "contact", challenge_ts: "2026-11-01T11:59:00Z" };

beforeEach(() => resetTurnstileMemory());

test("valid token passes and is verified server-side with secret and IP", async () => {
  const { fetchImpl, calls } = cf(ok);
  const r = await verifyTurnstile({ token: "tok-valid", action: "contact", ip: "203.0.113.9", config: live, fetchImpl, now: NOW });
  assert.deepEqual(r, { ok: true });
  assert.equal(calls[0].get("secret"), "live-secret");
  assert.equal(calls[0].get("response"), "tok-valid");
  assert.equal(calls[0].get("remoteip"), "203.0.113.9");
  assert.ok(calls[0].get("idempotency_key"));
});

test("missing token is rejected without calling Cloudflare", async () => {
  const { fetchImpl, calls } = cf(ok);
  for (const token of [undefined, "", "   ", 42]) {
    const r = await verifyTurnstile({ token, action: "contact", config: live, fetchImpl, now: NOW });
    assert.deepEqual(r, { ok: false, reason: "missing" });
  }
  assert.equal(calls.length, 0);
});

test("malformed or oversized token is invalid", async () => {
  const { fetchImpl } = cf(ok);
  assert.equal((await verifyTurnstile({ token: "a b", action: "contact", config: live, fetchImpl })).ok, false);
  const r = await verifyTurnstile({ token: "x".repeat(3000), action: "contact", config: live, fetchImpl });
  assert.deepEqual(r, { ok: false, reason: "invalid" });
});

test("token rejected by Cloudflare is invalid", async () => {
  const { fetchImpl } = cf({ success: false, "error-codes": ["invalid-input-response"] });
  const r = await verifyTurnstile({ token: "tok-bad", action: "contact", config: live, fetchImpl, now: NOW });
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.reason, "invalid");
});

test("expired or already-spent token (timeout-or-duplicate) is rejected", async () => {
  const { fetchImpl } = cf({ success: false, "error-codes": ["timeout-or-duplicate"] });
  const r = await verifyTurnstile({ token: "tok-old", action: "contact", config: live, fetchImpl, now: NOW });
  assert.equal(!r.ok && r.reason, "expired");
});

test("challenge older than 5 minutes is rejected", async () => {
  const { fetchImpl } = cf({ ...ok, challenge_ts: "2026-11-01T11:50:00Z" });
  const r = await verifyTurnstile({ token: "tok-stale", action: "contact", config: live, fetchImpl, now: NOW });
  assert.equal(!r.ok && r.reason, "expired");
});

test("replayed token is rejected locally, even if Cloudflare would accept it", async () => {
  const { fetchImpl, calls } = cf(ok);
  assert.deepEqual(await verifyTurnstile({ token: "tok-once", action: "contact", config: live, fetchImpl, now: NOW }), { ok: true });
  const again = await verifyTurnstile({ token: "tok-once", action: "contact", config: live, fetchImpl, now: NOW + 1000 });
  assert.deepEqual(again, { ok: false, reason: "replayed" });
  assert.equal(calls.length, 1);
});

test("wrong hostname and wrong action are rejected in production", async () => {
  const other = cf({ ...ok, hostname: "evil.example" });
  assert.equal((await verifyTurnstile({ token: "t1", action: "contact", config: live, fetchImpl: other.fetchImpl, now: NOW })).ok, false);
  const action = cf({ ...ok, action: "appointment" });
  const r = await verifyTurnstile({ token: "t2", action: "contact", config: live, fetchImpl: action.fetchImpl, now: NOW });
  assert.equal(!r.ok && r.reason, "action");
});

test("network failure or timeout fails closed as unavailable", async () => {
  const fetchImpl = (async () => {
    throw new Error("timeout");
  }) as unknown as typeof fetch;
  const r = await verifyTurnstile({ token: "t3", action: "contact", config: live, fetchImpl, now: NOW });
  assert.deepEqual(r, { ok: false, reason: "unavailable" });
  const bad = cf({}, 500);
  assert.equal((await verifyTurnstile({ token: "t4", action: "contact", config: live, fetchImpl: bad.fetchImpl })).ok, false);
});

test("without keys the official Cloudflare test keys are used (production pending)", () => {
  const cfg = turnstileConfig({});
  assert.equal(cfg.mode, "test");
  assert.equal(cfg.secret, TURNSTILE_TEST_SECRET);
  assert.equal(turnstileSiteKey({}), TURNSTILE_TEST_SITE_KEY);
  assert.deepEqual(cfg.hostnames, ["glowbydilek.nl", "www.glowbydilek.nl"]);
});

test("live keys come from the environment; mock endpoint is ignored in live mode", () => {
  const cfg = turnstileConfig({
    TURNSTILE_SECRET_KEY: "s",
    NEXT_PUBLIC_SITE_URL: "https://www.glowbydilek.nl",
    TURNSTILE_SITEVERIFY_URL: "http://127.0.0.1:1/",
  });
  assert.equal(cfg.mode, "live");
  assert.equal(cfg.verifyUrl, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.deepEqual(cfg.hostnames, ["glowbydilek.nl", "www.glowbydilek.nl"]);
  assert.deepEqual(turnstileConfig({ TURNSTILE_SECRET_KEY: "s", TURNSTILE_ALLOWED_HOSTNAMES: "a.nl, B.nl" }).hostnames, ["a.nl", "b.nl"]);
});

test("the shared test token may be reused in test mode only", async () => {
  const testCfg = { ...turnstileConfig({}), verifyUrl: "x" };
  const { fetchImpl } = cf({ success: true });
  assert.equal((await verifyTurnstile({ token: TURNSTILE_DUMMY_TOKEN, action: "contact", config: testCfg, fetchImpl })).ok, true);
  assert.equal((await verifyTurnstile({ token: TURNSTILE_DUMMY_TOKEN, action: "contact", config: testCfg, fetchImpl })).ok, true);
  const liveOk = cf(ok);
  await verifyTurnstile({ token: TURNSTILE_DUMMY_TOKEN, action: "contact", config: live, fetchImpl: liveOk.fetchImpl, now: NOW });
  const r = await verifyTurnstile({ token: TURNSTILE_DUMMY_TOKEN, action: "contact", config: live, fetchImpl: liveOk.fetchImpl, now: NOW });
  assert.equal(!r.ok && r.reason, "replayed");
});
