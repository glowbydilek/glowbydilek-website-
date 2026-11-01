import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { intakePdf } from "@/lib/intake/pdf";
import { getTemplate } from "@/lib/intake/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Blank A4 PDF of a form version (no customer data). Owner only. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const t = await getTemplate(getDb(), Number((await params).id));
  if (!t) return new NextResponse("Not found", { status: 404 });
  const pdf = await intakePdf(t.source, t.version, t.locale === "en" ? "en" : "nl");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${t.version}-${t.locale}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
