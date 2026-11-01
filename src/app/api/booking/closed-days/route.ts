import { NextResponse, type NextRequest } from "next/server";
import { requestCalendar } from "@/lib/booking/public";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { hitLimit } from "@/lib/db/limits";
import { clientIp } from "@/lib/forms/ip";
import { fingerprint } from "@/lib/forms/rateLimit";
import { todayLocal } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Closed weekdays and closed dates for the appointment request calendar.
 * The booking page itself is cached, so the calendar asks for these live.
 * Contains no customer or appointment data.
 */
export async function GET(req: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!databaseConfigured()) return NextResponse.json({ ok: true, closedWeekdays: [], closedDates: [] }, { headers });
  const db = getDb();
  if (!(await hitLimit(db, `closed:${fingerprint(clientIp(req))}`, 60, 60_000))) return NextResponse.json({ ok: false, error: "rateLimited" }, { status: 429, headers });
  const cal = await requestCalendar(db, todayLocal());
  return NextResponse.json({ ok: true, ...cal }, { headers });
}
