import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { cronTick } from "@/lib/notifications/deliver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called by a Hostinger cron job (UTC) every 10 minutes:
 *   curl -fsS -m 120 -H "Authorization: Bearer $CRON_SECRET" https://glowbydilek.nl/api/cron/tick
 * The route runs inside the app, so it uses the app's environment variables.
 * Idempotent: running it twice never sends an email twice.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 24) return false;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!databaseConfigured()) return NextResponse.json({ ok: false, error: "database not configured" }, { status: 503 });
  const r = await cronTick(getDb());
  return NextResponse.json({ ok: true, ...r }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = handle;
export const POST = handle;
