import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { receiptFile } from "@/lib/expenses/service";

export const dynamic = "force-dynamic";

/** Receipts are private: owner only, never cached, never under /media. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const r = await receiptFile(getDb(), Number((await params).id));
  if (!r) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(r.data), {
    headers: {
      "Content-Type": r.mime,
      "Content-Disposition": `inline; filename="${r.filename.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; object-src 'self'; sandbox",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
