import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { AppointmentActions } from "@/components/private/agenda/AppointmentActions";
import { STATUS, TIME_RANGE_NL, time } from "@/components/private/agenda/format";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { appointmentHistory, BookingError, getAppointment } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { invoices, outbox, payments, treatments } from "@/lib/db/schema";
import { NewInvoiceButton, PaymentForm } from "@/components/private/finance/FinanceForms";
import { InviteButton } from "@/components/private/cms/ReviewForms";
import { getReviewSettings } from "@/lib/reviews/service";
import { centsToInput, formatCents } from "@/lib/finance/money";
import { formatLocal, formatLongDate, minutesToHHMM, todayLocal, toLocalParts } from "@/lib/time";

export const metadata = { title: "Afspraak" };

const EVENT_NL: Record<string, string> = {
  requested: "Aanvraag ontvangen",
  created_manual: "Handmatig aangemaakt",
  approved: "Bevestigd",
  proposed: "Ander tijdstip voorgesteld",
  declined: "Afgewezen",
  rescheduled: "Verplaatst",
  updated: "Gewijzigd",
  cancelled: "Geannuleerd",
  completed: "Afgerond",
  no_show: "Niet verschenen",
  note_updated: "Notitie bijgewerkt",
};
const MAIL_NL: Record<string, string> = { pending: "wacht", sending: "bezig", sent: "verstuurd", failed: "mislukt", cancelled: "vervallen" };

const DONE: Record<string, string> = {
  approve: "Afspraak bevestigd. De klant krijgt een bevestiging per e-mail.",
  propose: "Voorstel verstuurd. Het tijdstip is voorlopig voor deze klant vastgehouden.",
  decline: "Aanvraag afgewezen.",
  reschedule: "Wijziging opgeslagen.",
  cancel: "Afspraak geannuleerd. Het tijdstip is weer vrij.",
  complete: "Gemarkeerd als afgerond.",
  noshow: "Gemarkeerd als niet verschenen.",
  archive: "Gearchiveerd.",
  unarchive: "Uit het archief gehaald.",
};

export default async function AppointmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const db = getDb();
  let v;
  try {
    v = await getAppointment(db, id);
  } catch (e) {
    if (e instanceof BookingError) notFound();
    throw e;
  }
  const [events, mails, allTreatments] = await Promise.all([
    appointmentHistory(db, id),
    db.select().from(outbox).where(eq(outbox.appointmentId, id)).orderBy(desc(outbox.createdAt)),
    db.select({ id: treatments.id, nameNl: treatments.nameNl }).from(treatments).where(eq(treatments.active, true)).orderBy(asc(treatments.sort)),
  ]);
  const { appt, customer, items } = v;
  const [apptPayments, apptInvoices] = await Promise.all([
    db.select().from(payments).where(and(eq(payments.appointmentId, id), isNull(payments.voidedAt))),
    db.select({ id: invoices.id, number: invoices.number }).from(invoices).where(eq(invoices.appointmentId, id)),
  ]);
  const paidHere = apptPayments.reduce((s, p) => s + p.amountCents, 0);
  const reviewSettings = await getReviewSettings(db);
  const st = STATUS[appt.status];
  const local = appt.startAt ? toLocalParts(appt.startAt) : null;
  return (
    <>
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`.trim()}
        subtitle={appt.startAt ? `${formatLongDate(appt.startAt, "nl")} · ${time(appt.startAt)}–${time(appt.endAt)}` : `Voorkeur: ${appt.requestedDate ?? "—"} (${TIME_RANGE_NL[appt.requestedTimeRange ?? ""] ?? "—"})`}
        actions={<Badge tone={st?.tone}>{st?.label ?? appt.status}</Badge>}
      />
      {sp.opgeslagen && <div className="mb-4"><Notice tone="success">✓ Afspraak opgeslagen.</Notice></div>}
      {sp.melding && DONE[sp.melding] && <div className="mb-4"><Notice tone="success">✓ {DONE[sp.melding]}</Notice></div>}
      {sp.mail === "0" && (
        <div className="mb-4">
          <Notice tone="warning">
            <strong>De klant is niet gemaild:</strong> er is geen e-mailadres bekend. Laat de wijziging de klant zelf weten
            {customer.phone ? (
              <>
                {" "}
                (<a className="underline" href={`tel:${customer.phone.replace(/\s/g, "")}`}>{customer.phone}</a>)
              </>
            ) : null}
            .
          </Notice>
        </div>
      )}
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Card title="Gegevens">
            <dl className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] [&>dd]:break-words gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted">Behandeling</dt>
              <dd>{items.map((i) => i.nameNl).join(", ") || "—"}</dd>
              <dt className="text-muted">Duur</dt>
              <dd>{appt.durationMinutes ? `${appt.durationMinutes} min${appt.bufferMinutes ? ` (+${appt.bufferMinutes} min opruimen)` : ""}` : "nog niet vastgesteld"}</dd>
              <dt className="text-muted">Prijs</dt>
              <dd>{appt.priceCents != null ? formatCents(appt.priceCents) : "niet vastgelegd"}</dd>
              <dt className="text-muted">Telefoon</dt>
              <dd>{customer.phone ? <a className="underline" href={`tel:${customer.phone.replace(/\s/g, "")}`}>{customer.phone}</a> : "—"}</dd>
              <dt className="text-muted">E-mail</dt>
              <dd className="break-all">{customer.email ? <a className="underline" href={`mailto:${customer.email}`}>{customer.email}</a> : "—"}</dd>
              <dt className="text-muted">Bron</dt>
              <dd>{appt.source === "manual" ? "Door jou ingevoerd" : "Aanvraag via de website"}</dd>
              {appt.requestedAlternative && (
                <>
                  <dt className="text-muted">Ook mogelijk</dt>
                  <dd>{appt.requestedAlternative}</dd>
                </>
              )}
              {appt.customerNote && (
                <>
                  <dt className="text-muted">Opmerking klant</dt>
                  <dd className="whitespace-pre-wrap">{appt.customerNote}</dd>
                </>
              )}
              <dt className="text-muted">Aangemaakt</dt>
              <dd>{formatLocal(appt.createdAt, "nl", { dateStyle: "medium", timeStyle: "short" })}</dd>
            </dl>
            <Link href={`/agenda/klanten/${customer.id}`} className="mt-4 inline-block text-sm text-accent-deep underline">Klantkaart openen</Link>
          </Card>
          {["completed", "confirmed"].includes(appt.status) && !customer.anonymizedAt && (
            <Card title="Betaling & factuur">
              <p className="mb-3 text-sm">
                Betaald: <strong>{formatCents(paidHere)}</strong>
                {appt.priceCents != null ? ` van ${formatCents(appt.priceCents)} afgesproken` : ""}
              </p>
              {apptInvoices.length > 0 && (
                <ul className="mb-3 text-sm">
                  {apptInvoices.map((i) => (
                    <li key={i.id}>
                      <Link href={`/agenda/facturen/${i.id}`} className="underline">
                        {i.number ?? "Factuurconcept"}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mb-4 flex flex-wrap gap-2">
                <NewInvoiceButton customerId={customer.id} appointmentId={appt.id} />
                {appt.status === "completed" && customer.email && reviewSettings.invitesEnabled && <InviteButton appointmentId={appt.id} />}
                <a href={`/agenda/afspraak/${appt.id}/pdf`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">
                  Behandeloverzicht (PDF)
                </a>
              </div>
              <details>
                <summary className="cursor-pointer text-sm font-medium">Betaling vastleggen</summary>
                <div className="mt-3">
                  <PaymentForm customerId={customer.id} appointments={[{ id: appt.id, label: "Deze afspraak" }]} defaultAppointmentId={appt.id} defaultAmount={appt.priceCents != null ? Math.max(0, appt.priceCents - paidHere) || null : null} today={todayLocal()} />
                </div>
              </details>
            </Card>
          )}
          <Card title="E-mails">
            {mails.length ? (
              <ul className="divide-y divide-line text-sm">
                {mails.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0 flex-1 basis-56 break-words">{m.subject}</span>
                    <span className="text-xs text-muted">
                      {MAIL_NL[m.status] ?? m.status}
                      {m.status === "sent" && m.sentAt ? ` · ${formatLocal(m.sentAt, "nl", { dateStyle: "short", timeStyle: "short" })}` : ""}
                      {m.status === "pending" && m.kind === "reminder" ? ` · gepland ${formatLocal(m.sendAfter, "nl", { dateStyle: "short", timeStyle: "short" })}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nog geen e-mails.</p>
            )}
          </Card>
          <Card title="Geschiedenis">
            <ol className="space-y-1.5 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span>{EVENT_NL[e.type] ?? e.type}</span>
                  <span className="text-xs text-muted">{formatLocal(e.createdAt, "nl", { dateStyle: "short", timeStyle: "short" })}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <AppointmentActions
          id={appt.id}
          status={appt.status}
          day={local?.date ?? appt.requestedDate ?? todayLocal()}
          time={local ? minutesToHHMM(local.minutes) : appt.requestedTimeRange === "afternoon" ? "13:00" : appt.requestedTimeRange === "evening" ? "18:00" : "09:00"}
          duration={appt.durationMinutes}
          hasEmail={Boolean(customer.email)}
          archived={Boolean(appt.archivedAt)}
          internalNote={appt.internalNote ?? ""}
          hasExactTime={Boolean(appt.startAt)}
          priceInput={centsToInput(appt.priceCents)}
          treatments={allTreatments.map((t) => ({ id: t.id, name: t.nameNl }))}
          currentTreatments={items.map((i) => i.treatmentId)}
        />
      </div>
    </>
  );
}
