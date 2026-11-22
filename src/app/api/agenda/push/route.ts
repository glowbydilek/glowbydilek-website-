import { NextResponse, type NextRequest } from "next/server";
import { assertOwner, assertSameOrigin, UnauthorizedError } from "@/lib/auth/session";
import { audit } from "@/lib/db/audit";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { parseSubscription, removeSubscription, saveSubscription, vapidKeys } from "@/lib/notify/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store" };

/** Short, non-identifying device label for the list in Instellingen. */
function deviceLabel(ua: string): string {
  const os = /iPad|Macintosh.*Mobile/.test(ua) ? "iPad" : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Apparaat";
  const br = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return br ? `${os} · ${br}` : os;
}

async function guard() {
  await assertSameOrigin();
  return assertOwner();
}

/** Public VAPID key (needed by the browser to subscribe). */
export async function GET() {
  try {
    await assertOwner();
  } catch {
    return NextResponse.json({ ok: false }, { status: 401, headers: H });
  }
  const k = vapidKeys();
  return NextResponse.json({ ok: true, publicKey: k?.publicKey ?? null }, { headers: H });
}

export async function POST(req: NextRequest) {
  let s;
  try {
    s = await guard();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ ok: false }, { status: 401, headers: H });
    throw err;
  }
  if (!databaseConfigured() || !vapidKeys()) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503, headers: H });
  const sub = parseSubscription(await req.json().catch(() => null));
  if (!sub) return NextResponse.json({ ok: false, error: "invalid" }, { status: 422, headers: H });
  const db = getDb();
  const device = deviceLabel(req.headers.get("user-agent") ?? "");
  await saveSubscription(db, s.user.id, sub, device);
  await audit(db, { action: "push.subscribed", userId: s.user.id, details: { device } });
  return NextResponse.json({ ok: true }, { headers: H });
}

export async function DELETE(req: NextRequest) {
  let s;
  try {
    s = await guard();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ ok: false }, { status: 401, headers: H });
    throw err;
  }
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!databaseConfigured() || typeof body?.endpoint !== "string") return NextResponse.json({ ok: false }, { status: 422, headers: H });
  const db = getDb();
  await removeSubscription(db, s.user.id, body.endpoint);
  await audit(db, { action: "push.unsubscribed", userId: s.user.id });
  return NextResponse.json({ ok: true }, { headers: H });
}
