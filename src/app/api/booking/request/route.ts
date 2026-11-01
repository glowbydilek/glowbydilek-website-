import { NextResponse, type NextRequest } from "next/server";
import { BookingError, createTimedRequest } from "@/lib/booking/service";
import { onlineBookingStatus } from "@/lib/booking/public";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { claimOnce, hitLimit, releaseOnce } from "@/lib/db/limits";
import { defaultPrivateSettings, getSetting } from "@/lib/db/settings";
import { clientIp } from "@/lib/forms/ip";
import { fingerprint, LIMITS } from "@/lib/forms/rateLimit";
import { verifyTurnstile } from "@/lib/forms/turnstile";
import { isLikelySpam, validateBookingRequest } from "@/lib/forms/validation";
import { deliverSoon } from "@/lib/notifications/deliver";
import { hhmmToMinutes } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

/**
 * Availability-aware appointment REQUEST. Creates a pending request (never a
 * confirmed appointment), emails the owner and acknowledges to the customer.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json(403, { ok: false, error: "forbidden" });
  if (!req.headers.get("content-type")?.includes("application/json")) return json(415, { ok: false, error: "unsupported" });
  if (!databaseConfigured()) return json(503, { ok: false, error: "unavailable" });
  const body = await req.text();
  if (body.length > 8000) return json(413, { ok: false, error: "tooLarge" });
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(body);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("bad");
  } catch {
    return json(400, { ok: false, error: "badRequest" });
  }
  if (isLikelySpam({ ...raw, message: raw.note, name: `${raw.firstName ?? ""} ${raw.lastName ?? ""}` })) return json(200, { ok: true });

  const db = getDb();
  const ip = clientIp(req);
  if (!(await hitLimit(db, `form:ip:booking:${fingerprint(ip)}`, LIMITS.ip.limit, LIMITS.ip.windowMs))) return json(429, { ok: false, error: "rateLimited" }, { "Retry-After": "600" });

  const status = await onlineBookingStatus(db);
  if (!status.enabled) return json(404, { ok: false, error: "disabled" });
  const v = validateBookingRequest(raw, status.bookable.map((b) => b.id));
  if (!v.ok) return json(422, { ok: false, error: "validation", fields: v.errors });
  const d = v.data;

  const check = await verifyTurnstile({ token: raw.turnstileToken, action: "booking", ip, claim: (h) => claimOnce(db, `turnstile:${h}`, 10 * 60_000) });
  if (!check.ok) return json(check.reason === "unavailable" ? 503 : 403, { ok: false, error: check.reason === "unavailable" ? "unavailable" : "challenge" });

  if (!(await hitLimit(db, `form:email:${fingerprint(d.email)}`, LIMITS.email.limit, LIMITS.email.windowMs))) return json(429, { ok: false, error: "rateLimited" }, { "Retry-After": "600" });
  if (!(await hitLimit(db, "form:global", LIMITS.global.limit, LIMITS.global.windowMs))) return json(429, { ok: false, error: "rateLimited" }, { "Retry-After": "600" });
  const dupKey = `dup:booking:${fingerprint(d.email, d.date, d.time, d.treatments.sort().join(","))}`;
  if (!(await claimOnce(db, dupKey, LIMITS.duplicateMs))) return json(409, { ok: false, error: "duplicate" });

  const priv = await getSetting(db, "private", defaultPrivateSettings);
  try {
    await createTimedRequest(
      db,
      { firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone, locale: d.locale, treatmentIds: d.treatments, day: d.date, minute: hhmmToMinutes(d.time)!, note: d.note, consent: true },
      { ownerEmail: priv.ownerNotifyEmail || process.env.MAIL_TO || process.env.SMTP_USER || "" },
    );
  } catch (err) {
    await releaseOnce(db, dupKey);
    if (err instanceof BookingError && (err.code === "conflict" || err.code === "noDuration")) return json(409, { ok: false, error: "slotTaken" });
    console.error("[booking] request failed:", (err as { code?: string })?.code ?? "error");
    return json(500, { ok: false, error: "generic" });
  }
  await deliverSoon(db);
  return json(200, { ok: true });
}
