import { NextResponse, type NextRequest } from "next/server";
import { getAvailability } from "@/lib/booking/service";
import { onlineBookingStatus } from "@/lib/booking/public";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { hitLimit } from "@/lib/db/limits";
import { clientIp } from "@/lib/forms/ip";
import { fingerprint } from "@/lib/forms/rateLimit";
import { addDays, isLocalDate, minutesToHHMM, todayLocal } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Free start times for the chosen treatments. Contains no customer data. */
export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!databaseConfigured()) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503, headers });
  const db = getDb();
  if (!(await hitLimit(db, `avail:${fingerprint(clientIp(req))}`, 120, 60_000))) return NextResponse.json({ ok: false, error: "rateLimited" }, { status: 429, headers });
  const status = await onlineBookingStatus(db);
  if (!status.enabled) return NextResponse.json({ ok: false, error: "disabled" }, { status: 404, headers });
  const url = new URL(req.url);
  const ids = (url.searchParams.get("treatments") ?? "").split(",").filter((id) => status.bookable.some((b) => b.id === id)).slice(0, 5);
  const today = todayLocal();
  const from = isLocalDate(url.searchParams.get("from") ?? "") && url.searchParams.get("from")! >= today ? url.searchParams.get("from")! : today;
  const to = isLocalDate(url.searchParams.get("to") ?? "") && url.searchParams.get("to")! >= from ? url.searchParams.get("to")! : addDays(from, 13);
  if (!ids.length) return NextResponse.json({ ok: false, error: "treatments" }, { status: 400, headers });
  const end = to > addDays(from, 31) ? addDays(from, 31) : to;
  const r = await getAvailability(db, ids, from, end);
  return NextResponse.json(
    { ok: true, duration: r.duration, days: Object.entries(r.slots).map(([date, mins]) => ({ date, times: mins.map(minutesToHHMM) })) },
    { headers },
  );
}
