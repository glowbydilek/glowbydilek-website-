import { NextResponse, type NextRequest } from "next/server";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { hitLimit } from "@/lib/db/limits";
import { clientIp } from "@/lib/forms/ip";
import { fingerprint } from "@/lib/forms/rateLimit";
import { openCopy } from "@/lib/intake/digital";

export const dynamic = "force-dynamic";

const GONE = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glow by Dilek</title></head><body style="font-family:Georgia,serif;background:#f4f1ea;color:#2b202b;padding:48px 20px;max-width:560px;margin:auto"><h1 style="font-weight:400">Deze link werkt niet meer</h1><p>De downloadlink is verlopen of vervangen. Vraag Dilek gerust om een nieuwe: 020 550 0400.</p><h2 style="font-weight:400;margin-top:32px">This link no longer works</h2><p>The download link has expired or was replaced. Please ask Dilek for a new one: 020 550 0400.</p></body></html>`;

/** The customer's own approved, signed intake copy. Never cached, never indexed. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const headers = { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
  if (!databaseConfigured()) return new NextResponse(GONE, { status: 404, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  const db = getDb();
  if (!(await hitLimit(db, `intake-copy:${fingerprint(clientIp(req))}`, 20, 10 * 60_000))) return new NextResponse("Too many requests", { status: 429, headers });
  const { token } = await params;
  const f = await openCopy(db, token).catch(() => null);
  if (!f) return new NextResponse(GONE, { status: 404, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  return new NextResponse(new Uint8Array(f.data), {
    headers: { ...headers, "Content-Type": f.mime, "Content-Disposition": `attachment; filename="${f.filename}"`, "X-Content-Type-Options": "nosniff" },
  });
}
