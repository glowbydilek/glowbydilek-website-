import { requireCan } from "@/lib/auth/session";
import Link from "next/link";
import { Card, PageHeader, Stat } from "@/components/private/ui";
import { customerMetrics } from "@/lib/crm/service";
import { getDb } from "@/lib/db/client";
import { formatCents } from "@/lib/finance/money";
import { financeReport, METHODS, periodFor } from "@/lib/finance/service";
import { dayBoundsUtc, todayLocal } from "@/lib/time";
import { panelT } from "@/lib/private/panelLangServer";

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
  const t = await panelT();
  await requireCan("agenda", "finance");
  const sp = await searchParams;
  const kind = TABS.some(([k]) => k === sp.p) ? sp.p! : "month";
  const today = todayLocal();
  const period = periodFor(kind, today, { from: sp.van, to: sp.tot });
  const db = getDb();
  const [r, m] = await Promise.all([financeReport(db, period), customerMetrics(db, dayBoundsUtc(period.from).start, dayBoundsUtc(period.to).end)]);
  const q = new URLSearchParams({ p: kind, ...(kind === "custom" ? { van: period.from, tot: period.to } : {}) });
  // Previous calendar month (the usual package for the accountant).
  const firstOfMonth = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  const prevEnd = new Date(firstOfMonth.getTime() - 86_400_000).toISOString().slice(0, 10);
  const prevMonth = { from: `${prevEnd.slice(0, 7)}-01`, to: prevEnd };
  return (
    <>
      <PageHeader
        title={t("Financiën")}
        subtitle="Alleen bedragen die je echt hebt vastgelegd. Er wordt nooit een omzet geschat of verzonnen."
        actions={
          <div className="flex flex-wrap gap-2">
            <a href={`/agenda/financien/export?${q}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">
              CSV
            </a>
            <a href={`/agenda/financien/rapport?${q}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">
              {t("PDF-rapport")}
            </a>
          </div>
        }
      />
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{t("Voor de boekhouder")}</p>
          <p className="text-sm text-muted">{t("Eén ZIP met het overzicht (CSV), het financiële rapport (PDF), alle facturen en alle bonnen.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/agenda/financien/boekhouder?p=custom&van=${prevMonth.from}&tot=${prevMonth.to}`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-paper">
            {t("Vorige maand downloaden")}
          </a>
          <a href={`/agenda/financien/boekhouder?${q}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">
            {t("Gekozen periode")}
          </a>
        </div>
      </div>
      <nav aria-label={t("Periode")} className="mb-4 flex flex-wrap gap-1 rounded-full bg-white p-1 text-sm shadow-sm">
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
            {t("Van")}
            <input type="date" name="van" defaultValue={period.from} className="ml-2 min-h-11 rounded-xl border border-ink/20 bg-white px-3" />
          </label>
          <label className="text-sm">
            {t("Tot en met")}
            <input type="date" name="tot" defaultValue={period.to} className="ml-2 min-h-11 rounded-xl border border-ink/20 bg-white px-3" />
          </label>
          <button className="min-h-11 rounded-full bg-ink px-5 text-sm text-paper">{t("Toon")}</button>
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
        <Card title={t("Per behandeling")}>
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
                  <span>{t("Niet aan een afspraak gekoppeld")}</span>
                  <span>{formatCents(r.unlinkedCents)}</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("Geen betalingen in deze periode.")}</p>
          )}
          <p className="mt-3 text-xs text-muted">{t("Een betaling telt bij één behandeling als de afspraak één behandeling had; anders staat hij onder \"Combinatie\". Er wordt niets verdeeld of geschat.")}</p>
        </Card>
        <Card title={t("Per categorie")}>
          {r.bySection.length ? (
            <ul className="divide-y divide-line text-sm">
              {r.bySection.map((x) => (
                <li key={x.name} className="flex justify-between gap-3 py-2"><span>{x.name}</span><strong>{formatCents(x.cents)}</strong></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("Nog geen betalingen in deze periode.")}</p>
          )}
          {r.discountsCents > 0 && <p className="mt-3 text-sm text-muted">Verleende kortingen (acties): {formatCents(r.discountsCents)}</p>}
        </Card>
        <Card title={t("Uitgaven & btw")}>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted">{t("Uitgaven (incl. btw)")}</dt>
            <dd className="text-right font-medium">{formatCents(r.expenses.totalCents)}</dd>
            <dt className="text-muted">{t("Btw op uitgaven (volgens bonnen)")}</dt>
            <dd className="text-right">{formatCents(r.expenses.vatCents)}</dd>
            {r.vatSummary.flatMap((v) => [
              <dt key={`${v.label}-t`} className="text-muted">{v.label} op facturen (grondslag {formatCents(v.baseCents)})</dt>,
              <dd key={`${v.label}-d`} className="text-right">{formatCents(v.vatCents)}</dd>,
            ])}
            <dt className="text-muted">Saldo ontvangen − uitgaven</dt>
            <dd className="text-right font-medium">{formatCents(r.balanceCents)}</dd>
          </dl>
          <p className="mt-3 text-xs text-muted">Geen winstberekening en geen aangifte: laat btw en resultaat controleren door je boekhouder.{r.expenses.withoutVat ? ` ${r.expenses.withoutVat} uitgave(n) zonder btw-bedrag.` : ""}</p>
          <Link href={`/agenda/uitgaven?${q}`} className="mt-3 inline-block text-sm text-accent-deep underline">{t("Uitgaven bekijken en toevoegen")}</Link>
        </Card>
        <Card title={t("Per betaalmethode")}>
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
            <p className="text-sm text-muted">{t("Geen betalingen in deze periode.")}</p>
          )}
        </Card>
        <Card title={t("Openstaande facturen")}>
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
            <p className="text-sm text-muted">{t("Geen openstaande facturen.")}</p>
          )}
        </Card>
        <Card title={t("Afgerond, nog geen betaling vastgelegd")}>
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
            <p className="text-sm text-muted">{t("Alles met een afgesproken prijs is betaald of gefactureerd.")}</p>
          )}
          {r.completedWithoutPrice > 0 && <p className="mt-3 text-xs text-muted">{r.completedWithoutPrice} afgeronde afspraak/afspraken zonder afgesproken prijs: die tellen nergens mee tot je een betaling vastlegt.</p>}
        </Card>
      </div>
      {r.byDay.length > 1 && (
        <Card title={t("Per dag")} className="mt-5">
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
