import { getDb } from "@/lib/db/client";
import { activityPdf } from "@/lib/finance/reports";
import { periodFor } from "@/lib/finance/service";
import { ownerPdf } from "@/lib/private/pdfResponse";
import { todayLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  return ownerPdf(async () => {
    const p = periodFor(q.get("p") ?? "month", todayLocal(), { from: q.get("van") ?? undefined, to: q.get("tot") ?? undefined });
    return { pdf: await activityPdf(getDb(), p.from, p.to), filename: `activiteiten-${p.from}-${p.to}.pdf` };
  }, "report.activity_pdf");
}
