import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { AppointmentActions } from "@/components/private/agenda/AppointmentActions";
import { STATUS, TIME_RANGE_NL, time } from "@/components/private/agenda/format";
import { Badge, Card, Notice, PageHeader } from "@/components/private/ui";
import { appointmentHistory, BookingError, getAppointment } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { invoices, outbox, payments } from "@/lib/db/schema";
import { NewInvoiceButton, PaymentForm } from "@/components/private/finance/FinanceForms";
import { InviteButton } from "@/components/private/cms/ReviewForms";
import { QuoteForm } from "@/components/private/agenda/QuoteForm";
import { ownerTreatments } from "@/lib/catalogue/owner";
import { quotesForAppointment } from "@/lib/booking/quotes";
import { applyPromotionAction, invoiceModeAction, removePromotionAction, withdrawQuoteAction } from "@/lib/private/agendaActions";
import { runningPromotions } from "@/lib/promotions/service";
import { promotions } from "@/lib/db/schema";
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
  offerte: "Prijsvoorstel verstuurd. Zodra de klant accepteert, wordt het bedrag de afgesproken prijs.",
  ingetrokken: "Openstaand prijsvoorstel ingetrokken.",
  actie: "Actie toegepast: de afgesproken prijs is aangepast.",
  "actie-niet": "Deze actie kon niet worden toegepast (geen vaste prijs, buiten de periode, minimumbedrag of limiet bereikt).",
  "actie-weg": "Actie verwijderd: de oorspronkelijke prijs geldt weer.",
};
const INVOICE_RESULT: Record<string, string> = {
  draft: "Er is automatisch een factuurconcept gemaakt.",
  issued: "Er is automatisch een factuur uitgegeven.",
  emailed: "Er is automatisch een factuur uitgegeven en gemaild.",
  blocked: "Er is geen factuur gemaakt: deze afspraak heeft geen afgesproken prijs.",
  fout: "De automatische factuur kon niet worden gemaakt. Maak hem handmatig.",
};
const QUOTE_STATUS: Record<string, { label: string; tone: "pending" | "done" | "cancelled" | "neutral" }> = {
  sent: { label: "Wacht op klant", tone: "pending" },
  accepted: { label: "Geaccepteerd", tone: "done" },
  declined: { label: "Afgewezen", tone: "cancelled" },
  withdrawn: { label: "Ingetrokken", tone: "neutral" },
  expired: { label: "Verlopen", tone: "neutral" },
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
    ownerTreatments(db),
  ]);
  const { appt, customer, items } = v;
  const [apptPayments, apptInvoices] = await Promise.all([
    db.select().from(payments).where(and(eq(payments.appointmentId, id), isNull(payments.voidedAt))),
    db.select({ id: invoices.id, number: invoices.number }).from(invoices).where(eq(invoices.appointmentId, id)),
  ]);
  const paidHere = apptPayments.reduce((s, p) => s + p.amountCents, 0);
  const reviewSettings = await getReviewSettings(db);
  const quotes = await quotesForAppointment(db, id);
  const openQuote = quotes.find((q) => q.status === "sent");
  const [running, appliedPromo] = await Promise.all([
    runningPromotions(db),
    appt.promotionId ? db.select().from(promotions).where(eq(promotions.id, appt.promotionId)).then((r) => r[0]) : Promise.resolve(undefined),
  ]);
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
      {sp.factuur && INVOICE_RESULT[sp.factuur] && <div className="mb-4"><Notice tone={sp.factuur === "blocked" || sp.factuur === "fout" ? "warning" : "info"}>{INVOICE_RESULT[sp.factuur]}{sp.nazorg ? " Het nazorgbericht staat klaar." : ""}</Notice></div>}
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
          {["requested", "proposed", "confirmed"].includes(appt.status) && !customer.anonymizedAt && (appt.priceCents == null || quotes.length > 0) && (
            <Card title="Prijsvoorstel">
              {quotes.length > 0 && (
                <ul className="mb-4 divide-y divide-line text-sm">
                  {quotes.map((q) => (
                    <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>
                        <strong>{formatCents(q.amountCents)}</strong> · verstuurd {formatLocal(q.createdAt, "nl", { dateStyle: "medium" })}
                        {q.status === "sent" && ` · geldig t/m ${formatLocal(q.expiresAt, "nl", { dateStyle: "medium" })}`}
                      </span>
                      <Badge tone={QUOTE_STATUS[q.status]?.tone}>{QUOTE_STATUS[q.status]?.label ?? q.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {openQuote && (
                <form action={withdrawQuoteAction} className="mb-4">
                  <input type="hidden" name="appointmentId" value={appt.id} />
                  <button className="min-h-11 text-sm text-[#8e2f24] underline">Openstaand voorstel intrekken</button>
                </form>
              )}
              {customer.email ? (
                <QuoteForm appointmentId={appt.id} hasOpen={Boolean(openQuote)} />
              ) : (
                <Notice tone="warning">Deze klant heeft geen e-mailadres. Bespreek de prijs persoonlijk en leg hem vast bij de afspraak (Wijzigen → Afgesproken prijs).</Notice>
              )}
            </Card>
          )}
          {!customer.anonymizedAt && (appliedPromo || (running.length > 0 && appt.priceCents != null && ["requested", "proposed", "confirmed"].includes(appt.status))) && (
            <Card title="Actie">
              {appliedPromo ? (
                <form action={removePromotionAction} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <input type="hidden" name="appointmentId" value={appt.id} />
                  <span>
                    <strong>{appliedPromo.nameNl}</strong> · korting {formatCents(appt.discountCents ?? 0)}
                  </span>
                  <button className="min-h-11 text-[#8e2f24] underline">Actie verwijderen</button>
                </form>
              ) : (
                <form action={applyPromotionAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="appointmentId" value={appt.id} />
                  <label className="w-full min-w-0 text-sm sm:w-auto">
                    <span className="mb-1 block text-muted">Lopende actie</span>
                    <select name="promotionId" className="min-h-11 w-full max-w-full rounded-xl border border-ink/20 bg-white px-3 sm:w-auto">
                      {running.map((p) => (
                        <option key={p.id} value={p.id}>{p.nameNl}{p.code ? ` (${p.code})` : ""}</option>
                      ))}
                    </select>
                  </label>
                  <button className="min-h-11 rounded-full border border-ink/25 px-5 text-sm">Toepassen</button>
                </form>
              )}
            </Card>
          )}
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
              <form action={invoiceModeAction} className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="appointmentId" value={appt.id} />
                <label htmlFor="invoiceMode" className="text-muted">Factuur bij afronden:</label>
                <select id="invoiceMode" name="invoiceMode" defaultValue={appt.invoiceMode ?? ""} className="min-h-11 rounded-xl border border-ink/20 bg-white px-3">
                  <option value="">Volg instellingen</option>
                  <option value="manual">Handmatig</option>
                  <option value="none">Geen factuur</option>
                </select>
                <button className="min-h-11 rounded-full border border-ink/25 px-4">Opslaan</button>
              </form>
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
          treatments={allTreatments.map((t) => ({ id: t.id, name: t.name }))}
          currentTreatments={items.map((i) => i.treatmentId)}
        />
      </div>
    </>
  );
}
