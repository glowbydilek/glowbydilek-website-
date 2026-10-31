import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { exportCustomer } from "@/lib/booking/service";
import { audit } from "@/lib/db/audit";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** GDPR access request: all personal data of one customer as JSON. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let s;
  try {
    s = await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const id = Number((await params).id);
  const data = await exportCustomer(getDb(), id);
  await audit(getDb(), { userId: s.user.id, action: "customer.exported", entity: "customer", entityId: id });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="klant-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
