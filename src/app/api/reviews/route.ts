import { NextResponse, type NextRequest } from "next/server";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { claimOnce, hitLimit } from "@/lib/db/limits";
import { clientIp } from "@/lib/forms/ip";
import { fingerprint, LIMITS } from "@/lib/forms/rateLimit";
import { verifyTurnstile } from "@/lib/forms/turnstile";
import { isLikelySpam } from "@/lib/forms/validation";
import { submitReview, validateReview } from "@/lib/reviews/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

/** Review submission: stored as pending, published only after the owner's moderation. */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return json(403, { ok: false, error: "forbidden" });
  if (!req.headers.get("content-type")?.includes("application/json")) return json(415, { ok: false, error: "unsupported" });
  if (!databaseConfigured()) return json(503, { ok: false, error: "unavailable" });
  const body = await req.text();
  if (body.length > 6000) return json(413, { ok: false, error: "tooLarge" });
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(body);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("bad");
  } catch {
    return json(400, { ok: false, error: "badRequest" });
  }
  if (isLikelySpam({ ...raw, message: raw.body, name: raw.displayName })) return json(200, { ok: true });
  const db = getDb();
  const ip = clientIp(req);
  const tooMany = () => json(429, { ok: false, error: "rateLimited" }, { "Retry-After": "600" });
  if (!(await hitLimit(db, `form:ip:review:${fingerprint(ip)}`, 3, 60 * 60_000))) return tooMany();
  const v = validateReview(raw);
  if (!v.ok) return json(422, { ok: false, error: "validation", fields: v.errors });
  const check = await verifyTurnstile({ token: raw.turnstileToken, action: "review", ip, claim: (h) => claimOnce(db, `turnstile:${h}`, 10 * 60_000) });
  if (!check.ok) return check.reason === "unavailable" ? json(503, { ok: false, error: "unavailable" }) : json(403, { ok: false, error: "challenge", reason: check.reason });
  if (!(await hitLimit(db, "form:global", LIMITS.global.limit, LIMITS.global.windowMs))) return tooMany();
  if (v.data.email && !(await hitLimit(db, `form:email:review:${fingerprint(v.data.email)}`, 2, 24 * 60 * 60_000))) return tooMany();
  if (!(await claimOnce(db, `dup:review:${fingerprint(v.data.body.toLowerCase().replace(/\s+/g, " "))}`, LIMITS.duplicateMs))) return json(409, { ok: false, error: "duplicate" });
  const r = await submitReview(db, v.data);
  return json(200, { ok: true, verified: r.verified });
}
