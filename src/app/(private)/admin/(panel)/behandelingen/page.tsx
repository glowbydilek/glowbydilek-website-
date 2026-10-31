import Link from "next/link";
import { asc } from "drizzle-orm";
import { TreatmentForm } from "@/components/private/cms/TreatmentForm";
import { Card, Notice, PageHeader } from "@/components/private/ui";
import { treatmentHref } from "@/i18n/config";
import { getDb } from "@/lib/db/client";
import { treatments } from "@/lib/db/schema";
import type { TreatmentId } from "@/content/slugs";

export const metadata = { title: "Behandelingen & prijzen" };
const CAT: Record<string, string> = { face: "Gezicht", body: "Lichaam", intimate: "Bikini & intiem" };

export default async function TreatmentsAdmin() {
  const rows = await getDb().select().from(treatments).orderBy(asc(treatments.sort));
  return (
    <>
      <PageHeader title="Behandelingen & prijzen" subtitle="Prijs, duur, opruimtijd en zichtbaarheid per behandeling. Uitgebreide pagina-teksten bewerk je onder Pagina's." />
      <div className="mb-4"><Notice tone="info">Prijzen en duur staan pas op de website als je ze hier invult. Zonder prijs toont de site &lsquo;Op aanvraag&rsquo;. Zonder duur kan een behandeling niet online op tijdstip worden gekozen.</Notice></div>
      <div className="space-y-5">
        {Object.entries(CAT).map(([cat, label]) => (
          <Card key={cat} title={label}>
            <div className="space-y-4">
              {rows.filter((r) => r.category === cat).map((t) => (
                <details key={t.id} className="rounded-2xl border border-stone p-3">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{t.nameNl}</span>
                    <span className="text-sm text-muted">
                      {t.priceCents != null ? `€ ${(t.priceCents / 100).toFixed(2).replace(".", ",")}` : "op aanvraag"} · {t.durationMinutes ? `${t.durationMinutes} min` : "duur?"}
                      {!t.visible || !t.active ? " · verborgen" : ""}
                      {t.bookableOnline ? " · online" : ""}
                    </span>
                  </summary>
                  <div className="mt-3">
                    <TreatmentForm t={t} />
                    <Link href={treatmentHref("nl", t.id as TreatmentId)} target="_blank" className="mt-2 inline-block text-sm text-gold-deep underline">Bekijk pagina ↗</Link>
                  </div>
                </details>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
