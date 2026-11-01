import "server-only";
import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "../auth/session";
import { audit } from "../db/audit";
import { getDb } from "../db/client";

/**
 * Owner-only PDF download: checks the session, renders, writes an audit
 * entry and returns the file with no-store/noindex headers.
 */
export async function ownerPdf(render: () => Promise<{ pdf: Buffer; filename: string } | null>, auditAction: string, entity?: { type: string; id: number }) {
  let s;
  try {
    s = await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const out = await render();
  if (!out) return new NextResponse("Not found", { status: 404 });
  await audit(getDb(), { userId: s.user.id, action: auditAction, entity: entity?.type, entityId: entity?.id });
  return new NextResponse(new Uint8Array(out.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${out.filename.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
