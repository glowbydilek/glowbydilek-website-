import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { invoices } from "@/lib/db/schema";
import { previewPdf } from "@/lib/finance/invoices";
import { ownerPdf } from "@/lib/private/pdfResponse";

export const dynamic = "force-dynamic";

/** Issued invoice: the stored, immutable PDF. Draft: a preview marked "CONCEPT". */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return ownerPdf(
    async () => {
      const [inv] = await getDb().select({ number: invoices.number, kind: invoices.kind }).from(invoices).where(eq(invoices.id, id));
      if (!inv) return null;
      return { pdf: await previewPdf(getDb(), id), filename: `${inv.kind === "credit" ? "creditfactuur" : "factuur"}-${inv.number ?? `concept-${id}`}.pdf` };
    },
    "invoice.pdf_viewed",
    { type: "invoice", id },
  );
}
