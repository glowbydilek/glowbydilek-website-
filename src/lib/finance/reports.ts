import "server-only";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import type { DB } from "../db/client";
import { appointments, appointmentTreatments, customers, invoices, payments, treatments } from "../db/schema";
import { dayBoundsUtc, formatLocal, toLocalParts, type LocalDate } from "../time";
import { formatCents } from "./money";
import { renderReportPdf, type ReportBlock } from "./pdf";
import { financeReport, METHODS, type Period } from "./service";

/**
 * PDF reports. None of them ever reads consultation (health) records.
 */
const STATUS_NL: Record<string, string> = {
  requested: "Aanvraag",
  proposed: "Voorstel",
  confirmed: "Bevestigd",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
  declined: "Afgewezen",
  no_show: "Niet verschenen",
};
const dateNl = (d: string) => d.split("-").reverse().join("-");
const when = (d: Date | null) => (d ? formatLocal(d, "nl", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const generated = () => `Gemaakt op ${formatLocal(new Date(), "nl", { dateStyle: "long", timeStyle: "short" })}`;

export async function financePdf(db: DB, period: Period) {
  const r = await financeReport(db, period);
  const blocks: ReportBlock[] = [
    { type: "text", text: `Periode: ${dateNl(period.from)} t/m ${dateNl(period.to)}. Alleen vastgelegde betalingen; er is niets geschat. ${generated()}.` },
    { type: "heading", text: "Samenvatting" },
    {
      type: "pairs",
      rows: [
        ["Ontvangen", formatCents(r.receivedCents)],
        ["Terugbetaald", formatCents(-r.refundedCents)],
        ["Netto omzet (ontvangen)", formatCents(r.netCents)],
        ["Gefactureerd (uitgegeven facturen)", formatCents(r.invoicedCents)],
        ["Afgeronde behandelingen", String(r.completed)],
        ["Geannuleerd / niet verschenen", `${r.cancelled} / ${r.noShows}`],
        ["Betalende klanten", String(r.payingCustomers)],
        ["Gemiddeld per betalende klant", r.perCustomerCents != null ? formatCents(r.perCustomerCents) : "—"],
      ],
    },
    { type: "heading", text: "Per behandeling" },
    { type: "table", columns: [{ label: "Behandeling", width: 6 }, { label: "Afspraken", width: 2, align: "right" }, { label: "Ontvangen", width: 2, align: "right" }], rows: r.byTreatment.map((t) => [t.name, String(t.appointments), formatCents(t.cents)]), total: ["Totaal", "", formatCents(r.byTreatment.reduce((s, t) => s + t.cents, 0))] },
    { type: "heading", text: "Per betaalmethode" },
    { type: "table", columns: [{ label: "Methode", width: 6 }, { label: "Aantal", width: 2, align: "right" }, { label: "Bedrag", width: 2, align: "right" }], rows: r.byMethod.map((m) => [METHODS[m.method as keyof typeof METHODS] ?? m.method, String(m.count), formatCents(m.cents)]) },
    { type: "heading", text: "Openstaande facturen" },
    { type: "table", columns: [{ label: "Factuur", width: 3 }, { label: "Klant", width: 4 }, { label: "Open", width: 2, align: "right" }], rows: r.openInvoices.map((i) => [i.number, i.customer, formatCents(i.totalCents - i.paidCents)]) },
  ];
  return renderReportPdf("Financieel overzicht", `${dateNl(period.from)} – ${dateNl(period.to)}`, blocks);
}

async function itemsFor(db: DB, ids: number[]) {
  const rows = ids.length ? await db.select().from(appointmentTreatments).where(inArray(appointmentTreatments.appointmentId, ids)) : [];
  const m = new Map<number, string[]>();
  for (const r of rows) m.set(r.appointmentId, [...(m.get(r.appointmentId) ?? []), r.nameNl]);
  return m;
}

/** Treatment history of one customer in a date range (no consultation data, no internal notes). */
export async function customerHistoryPdf(db: DB, customerId: number, from: LocalDate, to: LocalDate) {
  const [c] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!c || c.anonymizedAt) return null;
  const appts = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.customerId, customerId), gte(appointments.startAt, dayBoundsUtc(from).start), lt(appointments.startAt, dayBoundsUtc(to).end)))
    .orderBy(asc(appointments.startAt));
  const items = await itemsFor(db, appts.map((a) => a.id));
  const pays = await db.select().from(payments).where(eq(payments.customerId, customerId));
  const inRange = pays.filter((p) => !p.voidedAt && p.paidOn >= from && p.paidOn <= to);
  const blocks: ReportBlock[] = [
    { type: "pairs", rows: [["Klant", `${c.firstName} ${c.lastName}`.trim()], ["Periode", `${dateNl(from)} t/m ${dateNl(to)}`], ["Telefoon", c.phone ?? "—"], ["E-mail", c.email ?? "—"]] },
    { type: "heading", text: "Behandelingen" },
    {
      type: "table",
      columns: [{ label: "Datum", width: 3 }, { label: "Behandeling", width: 5 }, { label: "Status", width: 2 }, { label: "Prijs", width: 2, align: "right" }],
      rows: appts.map((a) => [when(a.startAt), (items.get(a.id) ?? []).join(", ") || "—", STATUS_NL[a.status] ?? a.status, a.priceCents != null ? formatCents(a.priceCents) : "—"]),
    },
    { type: "heading", text: "Betalingen" },
    {
      type: "table",
      columns: [{ label: "Datum", width: 3 }, { label: "Methode", width: 3 }, { label: "Soort", width: 3 }, { label: "Bedrag", width: 2, align: "right" }],
      rows: inRange.map((p) => [dateNl(p.paidOn), METHODS[p.method as keyof typeof METHODS] ?? p.method, p.kind === "refund" ? "Terugbetaling" : "Betaling", formatCents(p.amountCents)]),
      total: ["Totaal", "", "", formatCents(inRange.reduce((s, p) => s + p.amountCents, 0))],
    },
    { type: "text", text: `${generated()}. Bevat geen gezondheids- of consultatiegegevens.` },
  ];
  return { pdf: await renderReportPdf("Behandeloverzicht klant", `${c.firstName} ${c.lastName}`.trim(), blocks), name: `${c.firstName}-${c.lastName}`.toLowerCase() };
}

/** Summary of one appointment (for the customer or the owner's records). */
export async function appointmentSummaryPdf(db: DB, id: number) {
  const [a] = await db.select().from(appointments).where(eq(appointments.id, id));
  if (!a) return null;
  const [c] = await db.select().from(customers).where(eq(customers.id, a.customerId));
  const items = await itemsFor(db, [a.id]);
  const pays = (await db.select().from(payments).where(eq(payments.appointmentId, a.id))).filter((p) => !p.voidedAt);
  const inv = await db.select({ number: invoices.number }).from(invoices).where(and(eq(invoices.appointmentId, a.id), eq(invoices.status, "issued")));
  const blocks: ReportBlock[] = [
    {
      type: "pairs",
      rows: [
        ["Klant", c ? `${c.firstName} ${c.lastName}`.trim() : "—"],
        ["Datum en tijd", a.startAt ? `${when(a.startAt)}–${a.endAt ? formatLocal(a.endAt, "nl", { hour: "2-digit", minute: "2-digit" }) : ""}` : `Voorkeur ${a.requestedDate ?? "—"}`],
        ["Behandeling", (items.get(a.id) ?? []).join(", ") || "—"],
        ["Duur", a.durationMinutes ? `${a.durationMinutes} minuten` : "—"],
        ["Status", STATUS_NL[a.status] ?? a.status],
        ["Afgesproken prijs", a.priceCents != null ? formatCents(a.priceCents) : "niet vastgelegd"],
        ["Betaald", pays.length ? formatCents(pays.reduce((s, p) => s + p.amountCents, 0)) : "—"],
        ["Factuur", inv.map((i) => i.number).join(", ") || "—"],
      ],
    },
    { type: "text", text: `${generated()}. Bevat geen gezondheids- of consultatiegegevens en geen interne notities.` },
  ];
  return renderReportPdf("Behandeling", c ? `${c.firstName} ${c.lastName}`.trim() : "", blocks);
}

/** Business activity in a range: appointments by status and treatment. */
export async function activityPdf(db: DB, from: LocalDate, to: LocalDate) {
  const appts = await db
    .select({ id: appointments.id, status: appointments.status, startAt: appointments.startAt })
    .from(appointments)
    .where(and(gte(appointments.startAt, dayBoundsUtc(from).start), lt(appointments.startAt, dayBoundsUtc(to).end)));
  const items = await itemsFor(db, appts.map((a) => a.id));
  const byStatus = new Map<string, number>();
  for (const a of appts) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
  const byTreatment = new Map<string, number>();
  for (const a of appts.filter((x) => x.status === "completed")) for (const n of items.get(a.id) ?? []) byTreatment.set(n, (byTreatment.get(n) ?? 0) + 1);
  const days = new Map<string, number>();
  for (const a of appts.filter((x) => x.status === "completed" && x.startAt)) {
    const d = toLocalParts(a.startAt!).date;
    days.set(d, (days.get(d) ?? 0) + 1);
  }
  const blocks: ReportBlock[] = [
    { type: "text", text: `Periode: ${dateNl(from)} t/m ${dateNl(to)}. ${generated()}.` },
    { type: "heading", text: "Afspraken per status" },
    { type: "table", columns: [{ label: "Status", width: 6 }, { label: "Aantal", width: 2, align: "right" }], rows: [...byStatus.entries()].map(([s, n]) => [STATUS_NL[s] ?? s, String(n)]), total: ["Totaal", String(appts.length)] },
    { type: "heading", text: "Afgeronde behandelingen" },
    { type: "table", columns: [{ label: "Behandeling", width: 6 }, { label: "Aantal", width: 2, align: "right" }], rows: [...byTreatment.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => [n, String(c)]) },
    { type: "heading", text: "Drukte per dag (afgerond)" },
    { type: "table", columns: [{ label: "Datum", width: 6 }, { label: "Behandelingen", width: 2, align: "right" }], rows: [...days.entries()].sort().map(([d, n]) => [dateNl(d), String(n)]) },
  ];
  return renderReportPdf("Activiteitenoverzicht", `${dateNl(from)} – ${dateNl(to)}`, blocks);
}

/** Price list: only treatments with a confirmed price are listed (nothing invented). */
export async function priceListPdf(db: DB) {
  const rows = await db.select().from(treatments).where(and(eq(treatments.active, true), eq(treatments.visible, true))).orderBy(asc(treatments.sort));
  const priced = rows.filter((r) => r.priceCents != null);
  if (!priced.length) return null;
  const cat: Record<string, string> = { face: "Gezicht", body: "Lichaam", intimate: "Bikini & intiem" };
  const blocks: ReportBlock[] = [];
  for (const [k, label] of Object.entries(cat)) {
    const list = priced.filter((r) => r.category === k);
    if (!list.length) continue;
    blocks.push({ type: "heading", text: label });
    blocks.push({ type: "table", columns: [{ label: "Behandeling", width: 6 }, { label: "Duur", width: 2, align: "right" }, { label: "Prijs", width: 2, align: "right" }], rows: list.map((r) => [r.nameNl, r.durationMinutes ? `${r.durationMinutes} min` : "", `${r.priceFrom ? "vanaf " : ""}${formatCents(r.priceCents!)}`]) });
  }
  blocks.push({ type: "text", text: `Behandelingen zonder vaste prijs staan niet op deze lijst; de prijs volgt op aanvraag. ${generated()}.` });
  return renderReportPdf("Prijslijst", "Glow by Dilek", blocks);
}
