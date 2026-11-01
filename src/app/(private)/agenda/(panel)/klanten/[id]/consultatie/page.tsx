import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ConsultationForm, DeleteConsultation } from "@/components/private/agenda/ConsultationForm";
import { Card, Notice, PageHeader } from "@/components/private/ui";
import { requireOwner } from "@/lib/auth/session";
import { CONSENT_TEXT_NL, ConsultationError, QUESTIONS, readConsultation } from "@/lib/consultation/service";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Consultatie" };
export const dynamic = "force-dynamic";

export default async function Consultation({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await requireOwner("agenda");
  const id = Number((await params).id);
  const sp = await searchParams;
  const db = getDb();
  const [c] = await db.select().from(customers).where(eq(customers.id, id));
  if (!c || c.anonymizedAt) notFound();
  let data: Awaited<ReturnType<typeof readConsultation>> = null;
  let blocked: string | null = null;
  try {
    data = await readConsultation(db, id, { userId: s.user.id, mfa: s.user.mfaEnabled && s.mfaPassed });
  } catch (e) {
    if (e instanceof ConsultationError) blocked = e.message;
    else throw e;
  }
  return (
    <>
      <PageHeader title="Consultatie (vertrouwelijk)" subtitle={`${c.firstName} ${c.lastName}`.trim()} />
      <p className="mb-4 text-sm"><Link href={`/agenda/klanten/${id}`} className="text-accent-deep underline">← Terug naar het klantprofiel</Link></p>
      {sp.verwijderd && <div className="mb-4"><Notice tone="success">✓ De consultatiegegevens zijn verwijderd.</Notice></div>}
      {blocked ? (
        <Notice tone="warning">{blocked} <Link href="/admin/privacy" className="underline">Meer informatie</Link></Notice>
      ) : (
        <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card title={data ? "Bijwerken" : "Nieuw formulier"}>
            <ConsultationForm customerId={id} questions={QUESTIONS} answers={data?.answers ?? null} consentText={CONSENT_TEXT_NL} />
          </Card>
          <div className="space-y-5">
            <Card title="Status">
              {data ? (
                <dl className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] [&>dd]:break-words gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted">Toestemming</dt>
                  <dd>{formatLocal(data.row.consentAt, "nl", { dateStyle: "medium" })} ({data.row.consentMethod === "written" ? "schriftelijk" : data.row.consentMethod === "digital" ? "digitaal" : "in persoon"})</dd>
                  <dt className="text-muted">Laatst gecontroleerd</dt>
                  <dd>{formatLocal(data.row.reviewedAt, "nl", { dateStyle: "medium" })}</dd>
                  <dt className="text-muted">Opnieuw vragen vóór</dt>
                  <dd>{formatLocal(data.row.nextReviewAt, "nl", { dateStyle: "medium" })}</dd>
                </dl>
              ) : (
                <p className="text-sm text-muted">Nog niets vastgelegd.</p>
              )}
              <p className="mt-3 text-xs text-muted">Versleuteld opgeslagen. Elke keer dat je dit opent of wijzigt, wordt dat vastgelegd in het logboek. Niet zichtbaar in exports, e-mails, facturen of rapporten.</p>
            </Card>
            {data && (
              <>
                <Card title="Inzageverzoek">
                  <a href={`/agenda/klanten/${id}/consultatie/export`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">Exporteren (JSON)</a>
                  <p className="mt-2 text-xs text-muted">Alleen gebruiken als de klant zelf om deze gegevens vraagt. Wordt gelogd.</p>
                </Card>
                <Card title="Verwijderen">
                  <DeleteConsultation customerId={id} />
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
