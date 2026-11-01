import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { CustomerForm } from "@/components/private/agenda/CustomerForm";
import { NewInvoiceButton, PaymentForm, VoidPaymentForm } from "@/components/private/finance/FinanceForms";
import { Badge, Card, LinkButton, Notice, PageHeader, Stat } from "@/components/private/ui";
import { customerAppointments } from "@/lib/booking/service";
import { consultationEnabled } from "@/lib/consultation/service";
import { customerStats, findMatches } from "@/lib/crm/service";
import { matchLabel } from "@/lib/crm/normalize";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { invoicesForCustomer } from "@/lib/finance/invoices";
import { formatCents } from "@/lib/finance/money";
import { customerPayments, METHODS } from "@/lib/finance/service";
import { formatLocal, todayLocal } from "@/lib/time";

export const metadata = { title: "Klant" };

const dateNl = (d: string) => d.split("-").reverse().join("-");
const day = (d: Date | null) => (d ? formatLocal(d, "nl", { day: "numeric", month: "long", year: "numeric" }) : "—");

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const db = getDb();
  const [c] = await db.select().from(customers).where(eq(customers.id, id));
  if (!c) notFound();
  if (c.mergedIntoId) redirect(`/ajanda/klanten/${c.mergedIntoId}?samengevoegd=1`);
  const [appts, stats, pays, invs, dups, consult] = await Promise.all([
    customerAppointments(db, id),
    customerStats(db, id),
    customerPayments(db, id),
    invoicesForCustomer(db, id),
    c.anonymizedAt ? Promise.resolve([]) : findMatches(db, { email: c.email, phone: c.phone, firstName: c.firstName, lastName: c.lastName }, { excludeId: id }),
    consultationEnabled(db),
  ]);
  const now = new Date();
  const upcoming = appts.filter((a) => a.appt.status === "confirmed" && a.appt.startAt && a.appt.startAt >= now);
  const past = appts.filter((a) => !upcoming.includes(a));
  const apptOptions = appts.filter((a) => ["completed", "confirmed"].includes(a.appt.status)).map((a) => ({ id: a.appt.id, label: `${a.appt.startAt ? formatLocal(a.appt.startAt, "nl", { day: "numeric", month: "short" }) : "—"} · ${a.treatments.join(", ")}` }));
  const issued = invs.filter((i) => i.status === "issued").map((i) => ({ id: i.id, label: i.number ?? "" }));
  return (
    <>
      <PageHeader
        title={`${c.firstName} ${c.lastName}`.trim()}
        subtitle={c.consentAt ? "Klant via de website (privacytoestemming gegeven)" : "Klantprofiel"}
        actions={
          c.anonymizedAt ? undefined : (
            <>
              <LinkButton href={`/ajanda/afspraak/nieuw?klant=${c.id}`} variant="primary">
                ＋ Afspraak
              </LinkButton>
              <NewInvoiceButton customerId={c.id} />
            </>
          )
        }
      />
      {sp.samengevoegd && <div className="mb-4"><Notice tone="success">✓ De profielen zijn samengevoegd. Alle afspraken, betalingen en facturen staan nu in dit profiel.</Notice></div>}
      {dups.some((d) => d.strong) && (
        <div className="mb-4">
          <Notice tone="warning">
            Mogelijk dubbel profiel: {dups.filter((d) => d.strong).map((d) => `${d.customer.firstName} ${d.customer.lastName} (${matchLabel(d.reasons)})`).join(", ")}.{" "}
            <Link href={`/ajanda/klanten/dubbel?a=${c.id}`} className="underline">Bekijken en eventueel samenvoegen</Link>
          </Notice>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Eerste bezoek" value={<span className="text-xl">{day(stats.firstVisit)}</span>} />
        <Stat label="Laatste bezoek" value={<span className="text-xl">{day(stats.lastVisit)}</span>} />
        <Stat label="Afspraken" value={stats.total} hint={`${stats.completed} afgerond · ${stats.cancelled} geannuleerd · ${stats.noShows} niet verschenen`} />
        <Stat label="Betaald (vastgelegd)" value={formatCents(stats.receivedCents)} hint={stats.invoicedCents ? `Gefactureerd: ${formatCents(stats.invoicedCents)}` : "Alleen geregistreerde betalingen"} />
      </div>

      <div className="mt-5 grid [&>*]:min-w-0 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card title="Gegevens">{c.anonymizedAt ? <Notice>Deze klantgegevens zijn geanonimiseerd.</Notice> : <CustomerForm c={c} />}</Card>
          {!c.anonymizedAt && (
            <Card title="Consultatie (vertrouwelijk)">
              {consult.enabled ? (
                <LinkButton href={`/ajanda/klanten/${c.id}/consultatie`}>Consultatieformulier openen</LinkButton>
              ) : (
                <p className="text-sm text-muted">
                  Het consultatieformulier staat uit. Gezondheidsinformatie wordt pas vastgelegd als de wettelijke voorwaarden zijn bevestigd en de versleutelingssleutel is ingesteld (Admin → Privacy & consultatie). Zet geen gezondheidsinformatie in gewone notities.
                </p>
              )}
            </Card>
          )}
          <Card title="Behandelingen">
            {stats.treatments.length ? (
              <ul className="flex flex-wrap gap-2 text-sm">
                {stats.treatments.map((t) => (
                  <li key={t.name} className="rounded-full bg-ivory-50 px-3 py-1.5">
                    {t.name} <span className="text-muted">× {t.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nog geen afgeronde behandelingen.</p>
            )}
            <form action={`/ajanda/klanten/${c.id}/rapport`} target="_blank" className="mt-4 flex flex-wrap items-end gap-2 border-t border-stone pt-4 text-sm">
              <label>
                Van <input type="date" name="van" className="ml-1 min-h-11 rounded-xl border border-charcoal/20 bg-white px-2" />
              </label>
              <label>
                Tot en met <input type="date" name="tot" defaultValue={todayLocal()} className="ml-1 min-h-11 rounded-xl border border-charcoal/20 bg-white px-2" />
              </label>
              <button className="min-h-11 rounded-full border border-charcoal/25 px-4">Behandeloverzicht (PDF)</button>
            </form>
            {!c.anonymizedAt && (
              <a href={`/ajanda/klanten/${c.id}/export`} className="mt-3 inline-block text-xs text-muted underline">
                Alle persoonsgegevens exporteren (AVG-inzageverzoek, JSON, zonder consultatie)
              </a>
            )}
          </Card>
        </div>
        <div className="space-y-5">
          <Card title={`Komende afspraken (${upcoming.length})`}>
            {upcoming.length ? <ul className="space-y-2">{upcoming.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate /></li>)}</ul> : <p className="text-sm text-muted">Geen komende afspraken.</p>}
          </Card>
          <Card title={`Geschiedenis (${past.length})`}>
            {past.length ? <ul className="space-y-2">{past.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate /></li>)}</ul> : <p className="text-sm text-muted">Nog geen eerdere afspraken.</p>}
          </Card>
          <Card title="Betalingen">
            {pays.length > 0 && (
              <ul className="mb-4 divide-y divide-stone text-sm">
                {pays.map((p) => (
                  <li key={p.id} className={`flex flex-wrap items-center justify-between gap-2 py-2 ${p.voidedAt ? "text-muted line-through" : ""}`}>
                    <span>
                      {dateNl(p.paidOn)} · {METHODS[p.method as keyof typeof METHODS] ?? p.method}
                      {p.kind === "refund" ? " · terugbetaling" : ""}
                    </span>
                    <span className="font-medium">{formatCents(p.amountCents)}</span>
                    {p.voidedAt ? <span className="w-full text-xs no-underline">Ongedaan: {p.voidReason}</span> : <VoidPaymentForm id={p.id} />}
                  </li>
                ))}
              </ul>
            )}
            {!c.anonymizedAt && <PaymentForm customerId={c.id} appointments={apptOptions} invoices={issued} today={todayLocal()} />}
          </Card>
          <Card title={`Facturen (${invs.length})`}>
            {invs.length ? (
              <ul className="divide-y divide-stone text-sm">
                {invs.map((i) => (
                  <li key={i.id}>
                    <Link href={`/ajanda/facturen/${i.id}`} className="flex min-h-11 items-center justify-between gap-3 py-2">
                      <span>{i.number ?? "Concept"}{i.kind === "credit" ? " (credit)" : ""}</span>
                      <span className="flex items-center gap-2">
                        {i.status === "issued" ? formatCents(i.totalCents) : ""}
                        <Badge tone={i.status === "draft" ? "neutral" : "confirmed"}>{i.status === "draft" ? "Concept" : "Uitgegeven"}</Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nog geen facturen.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
