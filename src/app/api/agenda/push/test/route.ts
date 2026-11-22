import { NextResponse } from "next/server";
import { assertOwner, assertSameOrigin, UnauthorizedError } from "@/lib/auth/session";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { hitLimit } from "@/lib/db/limits";
import { sendTestPush } from "@/lib/notify/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store" };

/** "Testmelding sturen": one test push to the signed-in owner's own devices. */
export async function POST() {
  let s;
  try {
    await assertSameOrigin();
    s = await assertOwner();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ ok: false }, { status: 401, headers: H });
    throw err;
  }
  if (!databaseConfigured()) return NextResponse.json({ ok: false }, { status: 503, headers: H });
  const db = getDb();
  if (!(await hitLimit(db, `push:test:${s.user.id}`, 10, 10 * 60_000))) return NextResponse.json({ ok: false, error: "rateLimited" }, { status: 429, headers: H });
  const r = await sendTestPush(db, s.user.id);
  return NextResponse.json({ ok: true, ...r }, { headers: H });
}
