import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { mailConfigured, ownerAddress, sendMail } from "../mail/send";
import { rateLimit } from "./rateLimit";
import { isLikelySpam, type FieldErrors } from "./validation";

type Outcome<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

type Handler<T extends { email: string; name: string }> = {
  kind: "contact" | "appointment";
  validate: (raw: Record<string, unknown>) => Outcome<T>;
  ownerMail: (data: T) => { subject: string; text: string; html: string };
  customerMail: (data: T) => { subject: string; text: string; html: string };
};

const MAX_BODY = 12_000;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
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

  if (!rateLimit(`${h.kind}:${clientIp(req)}`)) return json(429, { ok: false, error: "rateLimited" });

  const result = h.validate(raw);
  if (!result.ok) return json(422, { ok: false, error: "validation", fields: result.errors });

  if (!mailConfigured()) {
    console.error(`[${h.kind}] SMTP is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASS.`);
    return json(503, { ok: false, error: "unavailable" });
  }

  const data = result.data;
  try {
    const owner = h.ownerMail(data);
    await sendMail({ to: ownerAddress(), replyTo: `"${data.name.replace(/"/g, "")}" <${data.email}>`, ...owner });
  } catch (err) {
    console.error(`[${h.kind}] Failed to send notification:`, err instanceof Error ? err.message : err);
    return json(502, { ok: false, error: "sendFailed" });
  }

  // The acknowledgement is best-effort: the inquiry itself has been delivered.
  let acknowledged = true;
  try {
    await sendMail({ to: data.email, replyTo: ownerAddress(), ...h.customerMail(data) });
  } catch (err) {
    acknowledged = false;
    console.error(`[${h.kind}] Failed to send acknowledgement:`, err instanceof Error ? err.message : err);
  }

  return json(200, { ok: true, acknowledged });
}
