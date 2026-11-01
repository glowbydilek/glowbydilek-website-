import "server-only";
import { BUILTIN_ITEMS } from "../catalogue/builtin";
import { expenseSummary } from "../expenses/service";
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { appointments, appointmentTreatments, customers, invoices, payments, treatments, serviceSections } from "../db/schema";
import { dayBoundsUtc, isLocalDate, toLocalParts, type LocalDate } from "../time";

/**
 * Finance: only RECORDED money. Four separate notions, never mixed:
 *  - list price      → treatments.price_cents (what the price list says)
 *  - agreed price    → appointments.price_cents (snapshot per appointment)
 *  - invoiced        → issued invoices (credit invoices negative)
 *  - received        → payments (refunds negative), the basis of "revenue"
 * Health/consultation data is never read here.
 */

export const METHODS = { cash: "Contant", pin: "Pin", transfer: "Overboeking", tikkie: "Betaalverzoek", other: "Anders" } as const;
export type Method = keyof typeof METHODS;

export class FinanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceError";
  }
}

type Ctx = { userId?: number | null };

export async function recordPayment(
  db: DB,
  p: { customerId: number; appointmentId?: number | null; invoiceId?: number | null; amountCents: number; method: string; paidOn: string; note?: string; kind: "payment" | "refund" },
  ctx: Ctx,
): Promise<number> {
  if (!Number.isInteger(p.amountCents) || p.amountCents <= 0 || p.amountCents > 10_000_000) throw new FinanceError("Vul een geldig bedrag in.");
  if (!(p.method in METHODS)) throw new FinanceError("Kies een betaalmethode.");
  if (!isLocalDate(p.paidOn)) throw new FinanceError("Kies een geldige datum.");
  const [c] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, p.customerId));
  if (!c) throw new FinanceError("Klant niet gevonden.");
  if (p.appointmentId) {
    const [a] = await db.select({ customerId: appointments.customerId }).from(appointments).where(eq(appointments.id, p.appointmentId));
    if (!a || a.customerId !== p.customerId) throw new FinanceError("Deze afspraak hoort niet bij deze klant.");
  }
  let appointmentId = p.appointmentId ?? null;
  if (p.invoiceId) {
    const [i] = await db.select({ customerId: invoices.customerId, status: invoices.status, appointmentId: invoices.appointmentId }).from(invoices).where(eq(invoices.id, p.invoiceId));
    if (!i || i.customerId !== p.customerId || i.status !== "issued") throw new FinanceError("Deze factuur hoort niet bij deze klant of is nog niet uitgegeven.");
    appointmentId = appointmentId ?? i.appointmentId;
  }
  const amount = p.kind === "refund" ? -p.amountCents : p.amountCents;
  const [res] = (await db.insert(payments).values({
    customerId: p.customerId,
    appointmentId,
    invoiceId: p.invoiceId ?? null,
    amountCents: amount,
    method: p.method,
    kind: p.kind,
    paidOn: p.paidOn,
    note: p.note?.slice(0, 300) || null,
    userId: ctx.userId ?? null,
  })) as unknown as [{ insertId: number }];
  await audit(db, { userId: ctx.userId, action: `payment.${p.kind}`, entity: "payment", entityId: res.insertId, details: { amountCents: amount, method: p.method } });
  return res.insertId;
}

/** Payments are never deleted: a mistake is voided with a reason (kept for the audit trail). */
export async function voidPayment(db: DB, id: number, reason: string, ctx: Ctx) {
  if (reason.trim().length < 3) throw new FinanceError("Geef een reden op.");
  const [res] = (await db
    .update(payments)
    .set({ voidedAt: new Date(), voidReason: reason.slice(0, 200) })
    .where(and(eq(payments.id, id), isNull(payments.voidedAt)))) as unknown as [{ affectedRows: number }];
  if (res.affectedRows !== 1) throw new FinanceError("Deze betaling is al ongedaan gemaakt.");
  await audit(db, { userId: ctx.userId, action: "payment.voided", entity: "payment", entityId: id, details: { reason: reason.slice(0, 200) } });
}

export async function customerPayments(db: DB, customerId: number) {
  return db.select().from(payments).where(eq(payments.customerId, customerId)).orderBy(desc(payments.paidOn), desc(payments.id));
}

/** Sum of valid payments per invoice id. */
export async function paidByInvoice(db: DB, invoiceIds: number[]): Promise<Map<number, number>> {
  if (!invoiceIds.length) return new Map();
  const rows = await db
    .select({ id: payments.invoiceId, s: sql<string>`SUM(${payments.amountCents})` })
    .from(payments)
    .where(and(inArray(payments.invoiceId, invoiceIds), isNull(payments.voidedAt)))
    .groupBy(payments.invoiceId);
  return new Map(rows.map((r) => [Number(r.id), Number(r.s)]));
}

// ───────────────────────────────────────────────────────── Periods

export type Period = { from: LocalDate; to: LocalDate; label: string };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function shift(day: LocalDate, days: number): LocalDate {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

/** Inclusive local-date ranges (Europe/Amsterdam calendar days). */
export function periodFor(kind: string, today: LocalDate, custom?: { from?: string; to?: string }): Period {
  const d = new Date(`${today}T12:00:00Z`);
  if (kind === "week") {
    const dow = (d.getUTCDay() + 6) % 7;
    const from = shift(today, -dow);
    return { from, to: shift(from, 6), label: "Deze week" };
  }
  if (kind === "month") {
    const from = `${today.slice(0, 7)}-01`;
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 12));
    return { from, to: shift(iso(next), -1), label: "Deze maand" };
  }
  if (kind === "year") return { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31`, label: `Jaar ${today.slice(0, 4)}` };
  if (kind === "custom" && custom?.from && custom?.to && isLocalDate(custom.from) && isLocalDate(custom.to) && custom.from <= custom.to)
    return { from: custom.from, to: custom.to, label: `${custom.from} t/m ${custom.to}` };
  return { from: today, to: today, label: "Vandaag" };
}

// ───────────────────────────────────────────────────────── Report

export type FinanceReport = {
  period: Period;
  receivedCents: number;
  refundedCents: number;
  netCents: number;
  payingCustomers: number;
  perCustomerCents: number | null;
  byMethod: { method: string; cents: number; count: number }[];
  byDay: { day: LocalDate; cents: number }[];
  byTreatment: { name: string; cents: number; appointments: number }[];
  unlinkedCents: number;
  completed: number;
  cancelled: number;
  noShows: number;
  invoicedCents: number;
  openInvoices: { id: number; number: string; customer: string; totalCents: number; paidCents: number; issueDate: string | null }[];
  /** Completed appointments in the period with an agreed price but no payment recorded. */
  unpaidAppointments: { id: number; customer: string; day: string; agreedCents: number }[];
  completedWithoutPrice: number;
  /** Received money per service section (exact only when an appointment stays within one section). */
  bySection: { name: string; cents: number }[];
  /** Discounts granted on completed appointments in the period (promotions). */
  discountsCents: number;
  /** VAT on invoices issued in the period, per rate (from the frozen invoice lines). */
  vatSummary: { label: string; baseCents: number; vatCents: number }[];
  expenses: { totalCents: number; vatCents: number; openCents: number; withoutVat: number; byCategory: { category: string; label: string; cents: number; vatCents: number; count: number }[] };
  /** Net received minus expenses: a cash balance, NOT a profit calculation. */
  balanceCents: number;
};

export async function financeReport(db: DB, period: Period): Promise<FinanceReport> {
  const pays = await db
    .select()
    .from(payments)
    .where(and(gte(payments.paidOn, period.from), lte(payments.paidOn, period.to), isNull(payments.voidedAt)));
  const receivedCents = pays.filter((p) => p.amountCents > 0).reduce((s, p) => s + p.amountCents, 0);
  const refundedCents = -pays.filter((p) => p.amountCents < 0).reduce((s, p) => s + p.amountCents, 0);
  const netCents = receivedCents - refundedCents;
  const payers = new Set(pays.filter((p) => p.amountCents > 0).map((p) => p.customerId));
  const methodMap = new Map<string, { cents: number; count: number }>();
  for (const p of pays) {
    const m = methodMap.get(p.method) ?? { cents: 0, count: 0 };
    m.cents += p.amountCents;
    m.count++;
    methodMap.set(p.method, m);
  }
  const dayMap = new Map<string, number>();
  for (const p of pays) dayMap.set(p.paidOn, (dayMap.get(p.paidOn) ?? 0) + p.amountCents);

  // Revenue per treatment: exact attribution only for single-treatment appointments.
  const apptIds = [...new Set(pays.map((p) => p.appointmentId).filter((x): x is number => x != null))];
  const items = apptIds.length ? await db.select().from(appointmentTreatments).where(inArray(appointmentTreatments.appointmentId, apptIds)) : [];
  const byAppt = new Map<number, string[]>();
  for (const i of items) byAppt.set(i.appointmentId, [...(byAppt.get(i.appointmentId) ?? []), i.nameNl]);
  const treatMap = new Map<string, { cents: number; appts: Set<number> }>();
  let unlinkedCents = 0;
  for (const p of pays) {
    if (!p.appointmentId) {
      unlinkedCents += p.amountCents;
      continue;
    }
    const names = byAppt.get(p.appointmentId) ?? [];
    const key = names.length === 1 ? names[0] : names.length ? `Combinatie: ${names.join(" + ")}` : "Onbekend";
    const t = treatMap.get(key) ?? { cents: 0, appts: new Set<number>() };
    t.cents += p.amountCents;
    t.appts.add(p.appointmentId);
    treatMap.set(key, t);
  }

  const start = dayBoundsUtc(period.from).start;
  const end = dayBoundsUtc(period.to).end;
  const appts = await db
    .select({ id: appointments.id, status: appointments.status, priceCents: appointments.priceCents, startAt: appointments.startAt, first: customers.firstName, last: customers.lastName })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(and(gte(appointments.startAt, start), lt(appointments.startAt, end), inArray(appointments.status, ["completed", "cancelled", "no_show"])));
  const completed = appts.filter((a) => a.status === "completed");
  const paidAppt = completed.length
    ? new Set(
        (await db.select({ id: payments.appointmentId }).from(payments).where(and(inArray(payments.appointmentId, completed.map((a) => a.id)), isNull(payments.voidedAt)))).map((r) => r.id),
      )
    : new Set<number | null>();
  // Appointments paid through an invoice also count as paid.
  const invoicedAppt = completed.length
    ? new Set(
        (await db.select({ id: invoices.appointmentId }).from(invoices).where(and(inArray(invoices.appointmentId, completed.map((a) => a.id)), eq(invoices.status, "issued")))).map((r) => r.id),
      )
    : new Set<number | null>();

  const issued = await db
    .select({ id: invoices.id, number: invoices.number, totalCents: invoices.totalCents, issueDate: invoices.issueDate, kind: invoices.kind, first: customers.firstName, last: customers.lastName })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.status, "issued"))
    .orderBy(asc(invoices.issueDate));
  const invoicedCents = issued.filter((i) => i.issueDate && i.issueDate >= period.from && i.issueDate <= period.to).reduce((s, i) => s + i.totalCents, 0);
  const paidMap = await paidByInvoice(db, issued.filter((i) => i.kind === "invoice").map((i) => i.id));
  const credited = new Map<number, number>();
  const credits = await db.select({ corrects: invoices.correctsInvoiceId, total: invoices.totalCents }).from(invoices).where(and(eq(invoices.kind, "credit"), eq(invoices.status, "issued")));
  for (const c of credits) if (c.corrects) credited.set(c.corrects, (credited.get(c.corrects) ?? 0) + c.total);
  const openInvoices = issued
    .filter((i) => i.kind === "invoice")
    .map((i) => ({ id: i.id, number: i.number ?? "", customer: `${i.first} ${i.last}`.trim(), totalCents: i.totalCents + (credited.get(i.id) ?? 0), paidCents: paidMap.get(i.id) ?? 0, issueDate: i.issueDate }))
    .filter((i) => i.totalCents > 0 && i.paidCents < i.totalCents);

  // Received per section (catalogue), from the treatment rows of each paid appointment.
  const tRows = apptIds.length ? await db.select({ id: treatments.id, sectionId: treatments.sectionId }).from(treatments) : [];
  const sections = apptIds.length ? await db.select({ id: serviceSections.id, name: serviceSections.nameNl }).from(serviceSections) : [];
  const secOf = (tid: string) => tRows.find((t) => t.id === tid)?.sectionId ?? BUILTIN_ITEMS.find((b) => b.id === tid)?.sectionId ?? "waxing";
  const apptSec = new Map<number, Set<string>>();
  for (const i of items) apptSec.set(i.appointmentId, (apptSec.get(i.appointmentId) ?? new Set()).add(secOf(i.treatmentId)));
  const secMap = new Map<string, number>();
  for (const p of pays) {
    if (!p.appointmentId) continue;
    const set = apptSec.get(p.appointmentId);
    const key = !set || !set.size ? "Onbekend" : set.size === 1 ? (sections.find((x) => x.id === [...set][0])?.name ?? [...set][0]) : "Combinatie van categorieën";
    secMap.set(key, (secMap.get(key) ?? 0) + p.amountCents);
  }
  const discounts = completed.length ? await db.select({ d: appointments.discountCents }).from(appointments).where(inArray(appointments.id, completed.map((a) => a.id))) : [];
  const discountsCents = discounts.reduce((sum, r) => sum + (r.d ?? 0), 0);
  const inPeriod = await db.select({ lines: invoices.lines }).from(invoices).where(and(eq(invoices.status, "issued"), gte(invoices.issueDate, period.from), lte(invoices.issueDate, period.to)));
  const vatMap = new Map<string, { baseCents: number; vatCents: number }>();
  for (const inv of inPeriod) {
    for (const l of inv.lines as { vat?: string; vatRateBp?: number; vatCents?: number; totalCents?: number }[]) {
      const label = l.vat === "exempt" ? "Vrijgesteld" : `Btw ${((l.vatRateBp ?? 0) / 100).toLocaleString("nl-NL")}%`;
      const r = vatMap.get(label) ?? { baseCents: 0, vatCents: 0 };
      r.baseCents += (l.totalCents ?? 0) - (l.vatCents ?? 0);
      r.vatCents += l.vatCents ?? 0;
      vatMap.set(label, r);
    }
  }
  const exp = await expenseSummary(db, period.from, period.to);

  return {
    period,
    bySection: [...secMap.entries()].map(([name, cents]) => ({ name, cents })).sort((a, b) => b.cents - a.cents),
    discountsCents,
    vatSummary: [...vatMap.entries()].map(([label, v]) => ({ label, ...v })),
    expenses: exp,
    balanceCents: netCents - exp.totalCents,
    receivedCents,
    refundedCents,
    netCents,
    payingCustomers: payers.size,
    perCustomerCents: payers.size ? Math.round(netCents / payers.size) : null,
    byMethod: [...methodMap.entries()].map(([method, v]) => ({ method, ...v })).sort((a, b) => b.cents - a.cents),
    byDay: [...dayMap.entries()].map(([day, cents]) => ({ day, cents })).sort((a, b) => a.day.localeCompare(b.day)),
    byTreatment: [...treatMap.entries()].map(([name, v]) => ({ name, cents: v.cents, appointments: v.appts.size })).sort((a, b) => b.cents - a.cents),
    unlinkedCents,
    completed: completed.length,
    cancelled: appts.filter((a) => a.status === "cancelled").length,
    noShows: appts.filter((a) => a.status === "no_show").length,
    invoicedCents,
    openInvoices,
    unpaidAppointments: completed
      .filter((a) => a.priceCents != null && !paidAppt.has(a.id) && !invoicedAppt.has(a.id))
      .map((a) => ({ id: a.id, customer: `${a.first} ${a.last}`.trim(), day: a.startAt ? toLocalParts(a.startAt).date : "", agreedCents: a.priceCents! })),
    completedWithoutPrice: completed.filter((a) => a.priceCents == null).length,
  };
}
