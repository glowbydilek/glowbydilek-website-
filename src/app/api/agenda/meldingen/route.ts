import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { badgeCount, syncNotifications, unreadCount } from "@/lib/notify/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current counts for the app-icon badge and the menu (owner only, never cached). */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await assertOwner();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ ok: false }, { status: 401, headers });
    throw err;
  }
  if (!databaseConfigured()) return NextResponse.json({ ok: false }, { status: 503, headers });
  const db = getDb();
  await syncNotifications(db);
  const [pending, unread] = await Promise.all([badgeCount(db), unreadCount(db)]);
  return NextResponse.json({ ok: true, pending, unread }, { headers });
}
