/**
 * Cloudflare Turnstile — server-side Siteverify.
 *
 * Environment (set in Hostinger, never in code or chat):
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   public widget key (build time)
 *   TURNSTILE_SECRET_KEY             secret key (runtime, server only)
 *   TURNSTILE_ALLOWED_HOSTNAMES      optional, comma separated; defaults to the
 *                                    host of NEXT_PUBLIC_SITE_URL (+ www.)
 *
 * Without a secret key the official Cloudflare TEST keys are used: the
 * widget and the full verification flow work, but every token passes. That
 * is "pending production" — see docs/SECURITY.md.
 *
 * Pure module (no Next.js imports) so it can be unit-tested with a fake fetch.
 */
import { createHash } from "node:crypto";

export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";
/** Token issued by the test site key. */
export const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * live    = real keys configured
 * test    = Cloudflare test keys (development, CI, or explicitly allowed previews)
 * missing = production without live keys: public forms refuse submissions
 */
export type TurnstileMode = "live" | "test" | "missing";
export type TurnstileConfig = { secret: string; mode: TurnstileMode; hostnames: string[]; verifyUrl: string };

export type TurnstileFailure = "missing" | "invalid" | "expired" | "replayed" | "hostname" | "action" | "unavailable";
export type TurnstileResult = { ok: true } | { ok: false; reason: TurnstileFailure; codes?: string[] };

/** Tokens are valid for 300 s; remember used ones a little longer. */
const TOKEN_TTL_MS = 300_000;
const REPLAY_TTL_MS = 10 * 60_000;
const MAX_TOKEN_LENGTH = 2048;

export function turnstileConfig(env: Record<string, string | undefined> = process.env): TurnstileConfig {
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  const site = (env.NEXT_PUBLIC_SITE_URL || "https://glowbydilek.nl").trim();
  let host = "glowbydilek.nl";
  try {
    host = new URL(site).hostname;
  } catch {
    /* keep default */
  }
  const fromEnv = env.TURNSTILE_ALLOWED_HOSTNAMES?.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const bare = host.replace(/^www\./, "");
  const hostnames = fromEnv?.length ? fromEnv : [bare, `www.${bare}`];
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (secret) {
    // A live secret with the public TEST site key (or no site key) can never verify.
    if (!siteKey || siteKey === TURNSTILE_TEST_SITE_KEY) return { secret, mode: "missing", hostnames, verifyUrl: SITEVERIFY_URL };
    return { secret, mode: "live", hostnames, verifyUrl: SITEVERIFY_URL };
  }
  // Production must never silently fall back to the always-passing test keys.
  const production = env.NODE_ENV === "production" && env.TURNSTILE_ALLOW_TEST_KEYS !== "true";
  if (production) return { secret: "", mode: "missing", hostnames, verifyUrl: SITEVERIFY_URL };
  // Test mode only: allow a local mock endpoint for offline end-to-end tests.
  // Never honoured once a real secret is configured.
  const verifyUrl = env.TURNSTILE_SITEVERIFY_URL?.trim() || SITEVERIFY_URL;
  return { secret: TURNSTILE_TEST_SECRET, mode: "test", hostnames, verifyUrl };
}

/** Human-readable configuration status for the admin dashboard (no secrets). */
export function turnstileStatus(env: Record<string, string | undefined> = process.env): {
  mode: TurnstileMode;
  siteKeySet: boolean;
  secretSet: boolean;
  problem?: string;
} {
  const cfg = turnstileConfig(env);
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secretSet = Boolean(env.TURNSTILE_SECRET_KEY?.trim());
  let problem: string | undefined;
  if (cfg.mode === "missing") {
    problem = secretSet
      ? "TURNSTILE_SECRET_KEY is set, but NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing or is the Cloudflare test key."
      : "Live Turnstile keys are missing: public forms refuse submissions until they are set.";
  }
  return { mode: cfg.mode, siteKeySet: Boolean(siteKey && siteKey !== TURNSTILE_TEST_SITE_KEY), secretSet, problem };
}

/** Public site key for the widget (test key until the live key is configured). */
export function turnstileSiteKey(env: Record<string, string | undefined> = process.env): string {
  return env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || TURNSTILE_TEST_SITE_KEY;
}

/** Used-token memory (hashes only), so a token can never be accepted twice by this server. */
const used = new Map<string, number>();

function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function remember(token: string, now: number): boolean {
  for (const [k, exp] of used) if (exp <= now) used.delete(k);
  const key = hash(token);
  if (used.has(key)) return false;
  used.set(key, now + REPLAY_TTL_MS);
  return true;
}

export function resetTurnstileMemory() {
  used.clear();
}

type SiteverifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
  challenge_ts?: string;
};

export async function verifyTurnstile(opts: {
  token: unknown;
  action: string;
  ip?: string;
  config?: TurnstileConfig;
  fetchImpl?: typeof fetch;
  now?: number;
  timeoutMs?: number;
  /**
   * Login and password reset: when Turnstile is not configured in production
   * these still work (protected by lockout and rate limits) instead of
   * locking the owner out. Public forms never pass this.
   */
  optional?: boolean;
}): Promise<TurnstileResult> {
  const config = opts.config ?? turnstileConfig();
  const now = opts.now ?? Date.now();
  const token = opts.token;

  if (config.mode === "missing") {
    if (opts.optional) return { ok: true };
    console.error("[turnstile] live keys missing or mismatched — submission refused");
    return { ok: false, reason: "unavailable", codes: ["config-missing"] };
  }

  if (typeof token !== "string" || token.trim() === "") return { ok: false, reason: "missing" };
  if (token.length > MAX_TOKEN_LENGTH || /\s/.test(token)) return { ok: false, reason: "invalid" };

  // Reject reuse locally before asking Cloudflare (Cloudflare also rejects
  // duplicates with "timeout-or-duplicate"). The shared test token is exempt
  // so the test keys keep working in development.
  const exempt = config.mode === "test" && token === TURNSTILE_DUMMY_TOKEN;
  if (!exempt && !remember(token, now)) return { ok: false, reason: "replayed" };

  const body = new URLSearchParams({ secret: config.secret, response: token });
  if (opts.ip && opts.ip !== "unknown") body.set("remoteip", opts.ip);
  body.set("idempotency_key", crypto.randomUUID());

  let data: SiteverifyResponse;
  try {
    const res = await (opts.fetchImpl ?? fetch)(config.verifyUrl, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(opts.timeoutMs ?? 6000),
    });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    data = (await res.json()) as SiteverifyResponse;
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const codes = data["error-codes"] ?? [];
  if (!data.success) {
    if (codes.includes("timeout-or-duplicate")) return { ok: false, reason: "expired", codes };
    if (codes.some((c) => c.startsWith("missing-input-secret") || c.startsWith("invalid-input-secret") || c === "internal-error")) {
      return { ok: false, reason: "unavailable", codes };
    }
    return { ok: false, reason: "invalid", codes };
  }

  if (config.mode === "live") {
    const host = (data.hostname ?? "").toLowerCase();
    if (!config.hostnames.includes(host)) return { ok: false, reason: "hostname" };
    if (data.action && data.action !== opts.action) return { ok: false, reason: "action" };
    const ts = data.challenge_ts ? Date.parse(data.challenge_ts) : NaN;
    if (Number.isFinite(ts) && now - ts > TOKEN_TTL_MS) return { ok: false, reason: "expired" };
  }
  return { ok: true };
}
