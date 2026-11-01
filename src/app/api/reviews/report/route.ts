import { NextResponse, type NextRequest } from "next/server";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { claimOnce, hitLimit } from "@/lib/db/limits";
import { clientIp } from "@/lib/forms/ip";
import { fingerprint } from "@/lib/forms/rateLimit";
import { reportReview } from "@/lib/reviews/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Report this review" — one report per visitor and review; three reports send it back to moderation. */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return NextResponse.json({ ok: false }, { status: 403 });
  if (!databaseConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  let id = 0;
  try {
    id = Number((await req.json()).id);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ ok: false }, { status: 400 });
  const db = getDb();
  const ip = clientIp(req);
  if (!(await hitLimit(db, `form:ip:report:${fingerprint(ip)}`, 10, 60 * 60_000))) return NextResponse.json({ ok: false }, { status: 429 });
  if (await claimOnce(db, `report:${id}:${fingerprint(ip)}`, 30 * 86_400_000)) await reportReview(db, id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
