import { getDb } from "@/lib/db/client";
import { financePdf } from "@/lib/finance/reports";
import { periodFor } from "@/lib/finance/service";
import { ownerPdf } from "@/lib/private/pdfResponse";
import { todayLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  return ownerPdf(async () => {
    const p = periodFor(q.get("p") ?? "month", todayLocal(), { from: q.get("van") ?? undefined, to: q.get("tot") ?? undefined });
    return { pdf: await financePdf(getDb(), p), filename: `financieel-overzicht-${p.from}-${p.to}.pdf` };
  }, "report.finance_pdf");
}
