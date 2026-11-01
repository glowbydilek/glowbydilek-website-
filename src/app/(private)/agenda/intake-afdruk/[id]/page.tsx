import { notFound } from "next/navigation";
import { IntakeSheet } from "@/components/private/intake/IntakeSheet";
import { PrintButton } from "@/components/private/intake/PrintButton";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getTemplate } from "@/lib/intake/service";

export const metadata = { title: "Intakeformulier afdrukken", robots: { index: false, follow: false } };

/** Print view without the agenda chrome; the browser prints it on A4. */
export default async function IntakePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  await requireOwner("agenda", `/agenda/intake-afdruk/${id}`);
  const t = await getTemplate(getDb(), id);
  if (!t) notFound();
  return (
    <main className="min-h-screen bg-surface px-3 py-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <a href={`/agenda/intake/${t.id}`} className="text-sm underline underline-offset-4">← Terug</a>
        <span className="flex gap-2">
          <a href={`/agenda/intake/${t.id}/pdf`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">PDF downloaden</a>
          <PrintButton />
        </span>
      </div>
      <IntakeSheet source={t.source} version={t.version} locale={t.locale === "en" ? "en" : "nl"} />
    </main>
  );
}
