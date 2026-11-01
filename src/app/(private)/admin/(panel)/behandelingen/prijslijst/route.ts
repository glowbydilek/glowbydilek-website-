import { getDb } from "@/lib/db/client";
import { priceListPdf } from "@/lib/finance/reports";
import { ownerPdf } from "@/lib/private/pdfResponse";

export const dynamic = "force-dynamic";

/** Price list PDF; 404 while no treatment has a confirmed price. */
export async function GET() {
  return ownerPdf(async () => {
    const pdf = await priceListPdf(getDb());
    return pdf ? { pdf, filename: "prijslijst-glow-by-dilek.pdf" } : null;
  }, "report.price_list_pdf");
}
