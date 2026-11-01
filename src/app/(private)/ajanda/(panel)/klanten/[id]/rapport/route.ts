import { getDb } from "@/lib/db/client";
import { customerHistoryPdf } from "@/lib/finance/reports";
import { ownerPdf } from "@/lib/private/pdfResponse";
import { isLocalDate, todayLocal } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const q = new URL(req.url).searchParams;
  const to = isLocalDate(q.get("tot") ?? "") ? q.get("tot")! : todayLocal();
  const from = isLocalDate(q.get("van") ?? "") ? q.get("van")! : "2000-01-01";
  return ownerPdf(
    async () => {
      const r = await customerHistoryPdf(getDb(), id, from, to);
      return r ? { pdf: r.pdf, filename: `behandeloverzicht-${r.name}.pdf` } : null;
    },
    "customer.history_pdf",
    { type: "customer", id },
  );
}
