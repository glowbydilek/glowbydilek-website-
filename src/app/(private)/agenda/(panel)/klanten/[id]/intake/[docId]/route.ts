import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { EXT } from "@/lib/intake/files";
import { IntakeError, readIntakeDocument } from "@/lib/intake/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A signed intake form (health data). Owner with two-step verification only;
 * decrypted per request, never cached, always a download, audited.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  let s;
  try {
    s = await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const p = await params;
  try {
    const doc = await readIntakeDocument(getDb(), Number(p.id), Number(p.docId), { userId: s.user.id, mfa: s.user.mfaEnabled && s.mfaPassed });
    if (!doc) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(doc.data), {
      headers: {
        "Content-Type": doc.mime,
        "Content-Disposition": `attachment; filename="${doc.filename.replace(/[^\w.-]/g, "_")}.${EXT[doc.mime] ?? "bin"}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (e) {
    if (e instanceof IntakeError) return new NextResponse(e.message, { status: 403 });
    throw e;
  }
}
