import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { ConsultationError, exportConsultation } from "@/lib/consultation/service";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** Separate, audited export of the consultation answers (never part of the general export). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let s;
  try {
    s = await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const id = Number((await params).id);
  try {
    const data = await exportConsultation(getDb(), id, { userId: s.user.id, mfa: s.user.mfaEnabled && s.mfaPassed });
    if (!data) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="consultatie-${id}.json"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof ConsultationError) return new NextResponse(e.message, { status: 403 });
    throw e;
  }
}
