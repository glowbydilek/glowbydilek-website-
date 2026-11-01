import Link from "next/link";
import { Card, PageHeader, Stat } from "@/components/private/ui";
import { customerMetrics } from "@/lib/crm/service";
import { getDb } from "@/lib/db/client";
import { formatCents } from "@/lib/finance/money";
import { financeReport, METHODS, periodFor } from "@/lib/finance/service";
import { dayBoundsUtc, todayLocal } from "@/lib/time";

export const metadata = { title: "Financiën" };

const TABS = [
  ["day", "Vandaag"],
  ["week", "Week"],
  ["month", "Maand"],
  ["year", "Jaar"],
  ["custom", "Periode"],
] as const;

const dateNl = (d: string) => d.split("-").reverse().join("-");

export default async function Finance({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const kind = TABS.some(([k]) => k === sp.p) ? sp.p! : "month";
  const today = todayLocal();
  const period = periodFor(kind, today, { from: sp.van, to: sp.tot });
  const db = getDb();
  const [r, m] = await Promise.all([financeReport(db, period), customerMetrics(db, dayBoundsUtc(period.from).start, dayBoundsUtc(period.to).end)]);
  const q = new URLSearchParams({ p: kind, ...(kind === "custom" ? { van: period.from, tot: period.to } : {}) });
  return (
    <>
      <PageHeader
        title="Financiën"
        subtitle="Alleen bedragen die je echt hebt vastgelegd. Er wordt nooit een omzet geschat of verzonnen."
        actions={
          <a href={`/agenda/financien/rapport?${q}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">
            PDF-rapport
          </a>
        }
      />
      <nav aria-label="Periode" className="mb-4 flex flex-wrap gap-1 rounded-full bg-white p-1 text-sm shadow-sm">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/agenda/financien?p=${k}`} aria-current={k === kind ? "page" : undefined} className={`rounded-full px-4 py-2 ${k === kind ? "bg-ink text-paper" : "hover:bg-ink/6"}`}>
            {l}
          </Link>
        ))}
      </nav>
      {kind === "custom" && (
        <form className="mb-4 flex flex-wrap items-end gap-2" action="/agenda/financien">
          <input type="hidden" name="p" value="custom" />
          <label className="text-sm">
            Van
            <input type="date" name="van" defaultValue={period.from} className="ml-2 min-h-11 rounded-xl border border-ink/20 bg-white px-3" />
          </label>
          <label className="text-sm">
            Tot en met
            <input type="date" name="tot" defaultValue={period.to} className="ml-2 min-h-11 rounded-xl border border-ink/20 bg-white px-3" />
          </label>
          <button className="min-h-11 rounded-full bg-ink px-5 text-sm text-paper">Toon</button>
        </form>
      )}
      <p className="mb-4 text-sm text-muted">
        {period.label}: {dateNl(period.from)}
        {period.to !== period.from ? ` t/m ${dateNl(period.to)}` : ""}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Omzet (ontvangen)" value={formatCents(r.netCents)} hint={r.refundedCents ? `${formatCents(r.receivedCents)} ontvangen − ${formatCents(r.refundedCents)} terugbetaald` : "Ontvangen betalingen"} />
        <Stat label="Afgeronde behandelingen" value={r.completed} hint={`${r.cancelled} geannuleerd · ${r.noShows} niet verschenen`} />
        <Stat label="Betalende klanten" value={r.payingCustomers} hint={r.perCustomerCents != null ? `Gemiddeld ${formatCents(r.perCustomerCents)} per klant` : "Nog geen betalingen"} />
        <Stat label="Gefactureerd" value={formatCents(r.invoicedCents)} hint="Uitgegeven facturen (credit negatief)" />
        <Stat label="Klanten totaal" value={m.total} />
        <Stat label="Nieuwe klanten" value={m.newCustomers} hint="Eerste afgeronde behandeling in deze periode" />
        <Stat label="Terugkerende klanten" value={m.returning} hint="Kwamen eerder ook al" />
        <Stat label="Nog niet betaald" value={formatCents(r.unpaidAppointments.reduce((s, u) => s + u.agreedCents, 0))} hint={`${r.unpaidAppointments.length} afgeronde afspraak/afspraken met afgesproken prijs`} />
      </div>

      <div className="mt-5 grid [&>*]:min-w-0 gap-5 lg:grid-cols-2">
        <Card title="Per behandeling">
          {r.byTreatment.length ? (
            <ul className="divide-y divide-line text-sm">
              {r.byTreatment.map((t) => (
                <li key={t.name} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 break-words">
                    {t.name} <span className="text-muted">({t.appointments}×)</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatCents(t.cents)}</span>
                </li>
              ))}
              {r.unlinkedCents !== 0 && (
                <li className="flex justify-between gap-3 py-2 text-muted">
                  <span>Niet aan een afspraak gekoppeld</span>
                  <span>{formatCents(r.unlinkedCents)}</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted">Geen betalingen in deze periode.</p>
          )}
          <p className="mt-3 text-xs text-muted">Een betaling telt bij één behandeling als de afspraak één behandeling had; anders staat hij onder &quot;Combinatie&quot;. Er wordt niets verdeeld of geschat.</p>
        </Card>
        <Card title="Per betaalmethode">
          {r.byMethod.length ? (
            <ul className="divide-y divide-line text-sm">
              {r.byMethod.map((x) => (
                <li key={x.method} className="flex justify-between gap-3 py-2">
                  <span>
                    {METHODS[x.method as keyof typeof METHODS] ?? x.method} <span className="text-muted">({x.count}×)</span>
                  </span>
                  <span className="font-medium">{formatCents(x.cents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Geen betalingen in deze periode.</p>
          )}
        </Card>
        <Card title="Openstaande facturen">
          {r.openInvoices.length ? (
            <ul className="divide-y divide-line text-sm">
              {r.openInvoices.map((i) => (
                <li key={i.id}>
                  <Link href={`/agenda/facturen/${i.id}`} className="flex min-h-11 justify-between gap-3 py-2">
                    <span className="min-w-0">
                      {i.number} · {i.customer}
                    </span>
                    <span className="shrink-0">{formatCents(i.totalCents - i.paidCents)} open</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Geen openstaande facturen.</p>
          )}
        </Card>
        <Card title="Afgerond, nog geen betaling vastgelegd">
          {r.unpaidAppointments.length ? (
            <ul className="divide-y divide-line text-sm">
              {r.unpaidAppointments.map((u) => (
                <li key={u.id}>
                  <Link href={`/agenda/afspraak/${u.id}`} className="flex min-h-11 justify-between gap-3 py-2">
                    <span className="min-w-0">
                      {dateNl(u.day)} · {u.customer}
                    </span>
                    <span className="shrink-0">{formatCents(u.agreedCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Alles met een afgesproken prijs is betaald of gefactureerd.</p>
          )}
          {r.completedWithoutPrice > 0 && <p className="mt-3 text-xs text-muted">{r.completedWithoutPrice} afgeronde afspraak/afspraken zonder afgesproken prijs: die tellen nergens mee tot je een betaling vastlegt.</p>}
        </Card>
      </div>
      {r.byDay.length > 1 && (
        <Card title="Per dag" className="mt-5">
          <ul className="grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {r.byDay.map((d) => (
              <li key={d.day} className="flex justify-between gap-3 rounded-lg px-2 py-1 odd:bg-surface">
                <span>{dateNl(d.day)}</span>
                <span className="font-medium">{formatCents(d.cents)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
