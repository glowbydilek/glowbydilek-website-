import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { mailConfigured, ownerAddress, sendMail } from "../mail/send";
import { fingerprint, forgetSubmission, isDuplicate, LIMITS, markSubmitted, rateLimit } from "./rateLimit";
import { clientIp } from "./ip";
import { verifyTurnstile } from "./turnstile";
import { isLikelySpam, type FieldErrors } from "./validation";

type Outcome<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

type Handler<T extends { email: string; name: string }> = {
  kind: "contact" | "appointment";
  validate: (raw: Record<string, unknown>) => Outcome<T>;
  /** Stable content used to detect duplicate submissions. */
  signature: (data: T) => string;
  ownerMail: (data: T) => { subject: string; text: string; html: string };
  customerMail: (data: T) => { subject: string; text: string; html: string };
};

const MAX_BODY = 12_000;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Log-safe error description: codes only, never addresses or message content. */
function errorCode(err: unknown): string {
  const e = err as { code?: unknown; responseCode?: unknown } | null;
  return [e?.code, e?.responseCode].filter((v) => typeof v === "string" || typeof v === "number").join(" ") || "unknown error";
}

function tooMany() {
  return NextResponse.json(
    { ok: false, error: "rateLimited" },
    { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "600" } },
  );
}

/** Same-origin check (basic CSRF protection for a cookie-less JSON endpoint). */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function handleForm<T extends { email: string; name: string }>(req: NextRequest, h: Handler<T>) {
  if (!sameOrigin(req)) return json(403, { ok: false, error: "forbidden" });
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return json(415, { ok: false, error: "unsupported" });
  }
  const length = Number(req.headers.get("content-length") || 0);
  if (length > MAX_BODY) return json(413, { ok: false, error: "tooLarge" });

  let raw: Record<string, unknown>;
  try {
    const body = await req.text();
    if (body.length > MAX_BODY) return json(413, { ok: false, error: "tooLarge" });
    raw = JSON.parse(body);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("bad body");
  } catch {
    return json(400, { ok: false, error: "badRequest" });
  }

  // Bots get a fake success so they learn nothing.
  if (isLikelySpam(raw)) return json(200, { ok: true });

  const ip = clientIp(req);
  if (!rateLimit(`ip:${h.kind}:${fingerprint(ip)}`, LIMITS.ip.limit, LIMITS.ip.windowMs)) return tooMany();

  const result = h.validate(raw);
  if (!result.ok) return json(422, { ok: false, error: "validation", fields: result.errors });
  const data = result.data;

  // Human verification (Cloudflare Turnstile, server-side Siteverify).
  const check = await verifyTurnstile({ token: raw.turnstileToken, action: h.kind, ip });
  if (!check.ok) {
    if (check.reason === "unavailable") {
      console.error(`[${h.kind}] Turnstile verification unavailable`, check.codes ?? "");
      return json(503, { ok: false, error: "unavailable" });
    }
    console.warn(`[${h.kind}] Turnstile rejected: ${check.reason}`);
    return json(403, { ok: false, error: "challenge", reason: check.reason });
  }

  // Duplicate content (double submits, retries, copy-paste floods).
  const dupKey = `dup:${h.kind}:${fingerprint(data.email, h.signature(data))}`;
  if (isDuplicate(dupKey)) return json(409, { ok: false, error: "duplicate" });

  if (!rateLimit(`email:${fingerprint(data.email)}`, LIMITS.email.limit, LIMITS.email.windowMs)) return tooMany();
  if (!rateLimit("global", LIMITS.global.limit, LIMITS.global.windowMs)) {
    console.warn(`[${h.kind}] Global form limit reached`);
    return tooMany();
  }

  if (!mailConfigured()) {
    console.error(`[${h.kind}] SMTP is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASS.`);
    return json(503, { ok: false, error: "unavailable" });
  }

  // Reserve the submission first so a parallel duplicate is rejected too.
  markSubmitted(dupKey);
  try {
    const owner = h.ownerMail(data);
    await sendMail({ to: ownerAddress(), replyTo: { name: data.name, address: data.email }, ...owner });
  } catch (err) {
    forgetSubmission(dupKey);
    console.error(`[${h.kind}] Failed to send notification: ${errorCode(err)}`);
    return json(502, { ok: false, error: "sendFailed" });
  }

  // The acknowledgement is best-effort: the inquiry itself has been delivered.
  let acknowledged = true;
  try {
    await sendMail({ to: data.email, replyTo: ownerAddress(), ...h.customerMail(data) });
  } catch (err) {
    acknowledged = false;
    console.error(`[${h.kind}] Failed to send acknowledgement: ${errorCode(err)}`);
  }

  return json(200, { ok: true, acknowledged });
}
