import { getDb } from "@/lib/db/client";
import { appointmentSummaryPdf } from "@/lib/finance/reports";
import { ownerPdf } from "@/lib/private/pdfResponse";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return ownerPdf(
    async () => {
      const pdf = await appointmentSummaryPdf(getDb(), id);
      return pdf ? { pdf, filename: `behandeling-${id}.pdf` } : null;
    },
    "appointment.summary_pdf",
    { type: "appointment", id },
  );
}
