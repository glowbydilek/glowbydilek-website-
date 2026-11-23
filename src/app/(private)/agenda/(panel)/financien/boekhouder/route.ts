import { NextResponse } from "next/server";
import { assertOwner, UnauthorizedError } from "@/lib/auth/session";
import { audit } from "@/lib/db/audit";
import { getDb } from "@/lib/db/client";
import { accountantZip } from "@/lib/finance/accountant";
import { periodFor } from "@/lib/finance/service";
import { todayLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Monthly (or chosen period) package for the accountant as one ZIP. Owner only. */
export async function GET(req: Request) {
  let s;
  try {
    s = await assertOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return new NextResponse("Unauthorized", { status: 401 });
    throw e;
  }
  const q = new URL(req.url).searchParams;
  const p = periodFor(q.get("p") ?? "month", todayLocal(), { from: q.get("van") ?? undefined, to: q.get("tot") ?? undefined });
  const db = getDb();
  const { zip, counts } = await accountantZip(db, p);
  await audit(db, { userId: s.user.id, action: "report.accountant_zip", entity: "finance", details: { from: p.from, to: p.to, ...counts } });
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="administratie-glow-by-dilek-${p.from}-${p.to}.zip"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
