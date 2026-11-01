import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import {
  appointments,
  appointmentTreatments,
  consultations,
  customerMerges,
  customers,
  invoices,
  outbox,
  payments,
  reviewInvites,
  reviews,
} from "../db/schema";
import { normalizeEmail, normalizeName, normalizePhone, type MatchReason } from "./normalize";

export type Customer = typeof customers.$inferSelect;
type Ctx = { userId?: number | null };

/** Profiles that can receive new appointments: not anonymised, not merged away. */
export const activeCustomer = and(isNull(customers.anonymizedAt), isNull(customers.mergedIntoId));

export class CrmError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "CrmError";
  }
}

// ──────────────────────────────────────────────────────── Matching

export type Match = { customer: Customer; reasons: MatchReason[]; strong: boolean };

/**
 * Existing profiles that look like the person being entered. Email and phone
 * are compared normalised; a name alone is only a weak hint. Nothing is
 * attached or merged automatically: the owner chooses.
 */
export async function findMatches(
  db: DB,
  input: { email?: string | null; phone?: string | null; firstName?: string | null; lastName?: string | null },
  opts: { excludeId?: number; limit?: number } = {},
): Promise<Match[]> {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const first = normalizeName(input.firstName);
  const last = normalizeName(input.lastName);
  const conds = [];
  if (email) conds.push(eq(customers.emailNorm, email));
  if (phone) conds.push(eq(customers.phoneNorm, phone));
  if (first && last) conds.push(and(sql`LOWER(${customers.firstName}) = ${first}`, sql`LOWER(${customers.lastName}) = ${last}`));
  if (!conds.length) return [];
  const rows = await db
    .select()
    .from(customers)
    .where(and(activeCustomer, or(...conds), opts.excludeId ? ne(customers.id, opts.excludeId) : undefined))
    .limit(opts.limit ?? 10);
  return rows
    .map((c) => {
      const reasons: MatchReason[] = [];
      if (email && c.emailNorm === email) reasons.push("email");
      if (phone && c.phoneNorm === phone) reasons.push("phone");
      if (first && last && normalizeName(c.firstName) === first && normalizeName(c.lastName) === last) reasons.push("name");
      return { customer: c, reasons, strong: reasons.includes("email") || reasons.includes("phone") };
    })
    .filter((m) => m.reasons.length)
    .sort((a, b) => Number(b.strong) - Number(a.strong) || b.reasons.length - a.reasons.length);
}

/** Fills email_norm / phone_norm for rows created before normalisation existed. Idempotent. */
export async function backfillNorms(db: DB): Promise<number> {
  const rows = await db
    .select({ id: customers.id, email: customers.email, phone: customers.phone })
    .from(customers)
    .where(and(isNull(customers.mergedIntoId), isNull(customers.anonymizedAt), or(and(isNotNull(customers.email), isNull(customers.emailNorm)), and(isNotNull(customers.phone), isNull(customers.phoneNorm)))))
    .limit(500);
  for (const r of rows) await db.update(customers).set({ emailNorm: normalizeEmail(r.email), phoneNorm: normalizePhone(r.phone) }).where(eq(customers.id, r.id));
  return rows.length;
}

// ──────────────────────────────────────────────────────── Profile statistics

export type CustomerStats = {
  firstVisit: Date | null;
  lastVisit: Date | null;
  total: number;
  completed: number;
  cancelled: number;
  noShows: number;
  upcoming: number;
  treatments: { name: string; count: number }[];
  /** Received payments minus refunds (cents). Only recorded money, never estimates. */
  receivedCents: number;
  invoicedCents: number;
};

export async function customerStats(db: DB, customerId: number, now = new Date()): Promise<CustomerStats> {
  const appts = await db.select().from(appointments).where(eq(appointments.customerId, customerId));
  const done = appts.filter((a) => a.status === "completed" && a.startAt);
  const times = done.map((a) => a.startAt!.getTime());
  const ids = done.map((a) => a.id);
  const items = ids.length ? await db.select().from(appointmentTreatments).where(inArray(appointmentTreatments.appointmentId, ids)) : [];
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i.nameNl, (counts.get(i.nameNl) ?? 0) + 1);
  const [paid] = await db
    .select({ s: sql<string>`COALESCE(SUM(${payments.amountCents}), 0)` })
    .from(payments)
    .where(and(eq(payments.customerId, customerId), isNull(payments.voidedAt)));
  const [inv] = await db
    .select({ s: sql<string>`COALESCE(SUM(${invoices.totalCents}), 0)` })
    .from(invoices)
    .where(and(eq(invoices.customerId, customerId), eq(invoices.status, "issued")));
  return {
    firstVisit: times.length ? new Date(Math.min(...times)) : null,
    lastVisit: times.length ? new Date(Math.max(...times)) : null,
    total: appts.length,
    completed: done.length,
    cancelled: appts.filter((a) => a.status === "cancelled").length,
    noShows: appts.filter((a) => a.status === "no_show").length,
    upcoming: appts.filter((a) => a.status === "confirmed" && a.startAt && a.startAt >= now).length,
    treatments: [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    receivedCents: Number(paid?.s ?? 0),
    invoicedCents: Number(inv?.s ?? 0),
  };
}

/**
 * Customer counts for a period (UTC bounds): total active profiles, new
 * customers (first completed visit inside the period) and returning
 * customers (completed visit inside the period and an earlier one before).
 */
export async function customerMetrics(db: DB, from: Date, to: Date) {
  const [total] = await db.select({ n: sql<string>`COUNT(*)` }).from(customers).where(activeCustomer);
  const firstVisits = db
    .select({ customerId: appointments.customerId, first: sql<Date>`MIN(${appointments.startAt})`.as("first") })
    .from(appointments)
    .where(eq(appointments.status, "completed"))
    .groupBy(appointments.customerId)
    .as("fv");
  const [news] = await db.select({ n: sql<string>`COUNT(*)` }).from(firstVisits).where(and(gte(firstVisits.first, from), lt(firstVisits.first, to)));
  const visited = await db
    .selectDistinct({ customerId: appointments.customerId })
    .from(appointments)
    .where(and(eq(appointments.status, "completed"), gte(appointments.startAt, from), lt(appointments.startAt, to)));
  let returning = 0;
  if (visited.length) {
    const [r] = await db
      .select({ n: sql<string>`COUNT(DISTINCT ${appointments.customerId})` })
      .from(appointments)
      .where(and(eq(appointments.status, "completed"), lt(appointments.startAt, from), inArray(appointments.customerId, visited.map((v) => v.customerId))));
    returning = Number(r?.n ?? 0);
  }
  return { total: Number(total?.n ?? 0), newCustomers: Number(news?.n ?? 0), returning, visitedInPeriod: visited.length };
}

// ──────────────────────────────────────────────────────── Duplicates & merge

export type DuplicatePair = { a: Customer; b: Customer; reasons: MatchReason[] };

/** Profiles sharing a normalised email or phone, or an identical full name. */
export async function findDuplicates(db: DB, limit = 50): Promise<DuplicatePair[]> {
  const list = await db.select().from(customers).where(activeCustomer).orderBy(asc(customers.id)).limit(5000);
  const pairs = new Map<string, DuplicatePair>();
  const add = (a: Customer, b: Customer, r: MatchReason) => {
    const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
    const p = pairs.get(key) ?? { a: a.id < b.id ? a : b, b: a.id < b.id ? b : a, reasons: [] };
    if (!p.reasons.includes(r)) p.reasons.push(r);
    pairs.set(key, p);
  };
  const group = (keyOf: (c: Customer) => string | null, r: MatchReason) => {
    const m = new Map<string, Customer[]>();
    for (const c of list) {
      const k = keyOf(c);
      if (!k) continue;
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    for (const g of m.values()) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) add(g[i], g[j], r);
  };
  group((c) => c.emailNorm, "email");
  group((c) => c.phoneNorm, "phone");
  group((c) => {
    const n = `${normalizeName(c.firstName)} ${normalizeName(c.lastName)}`.trim();
    return normalizeName(c.lastName) ? n : null;
  }, "name");
  return [...pairs.values()].sort((x, y) => y.reasons.length - x.reasons.length).slice(0, limit);
}

/**
 * Merges `fromId` into `intoId` (owner action, never automatic). All
 * appointments, payments, invoices, reviews and emails move to the kept
 * profile; empty fields of the kept profile are filled in; the merged
 * profile stays as an audit record pointing to the kept one. Issued
 * invoices keep their frozen buyer details.
 */
export async function mergeCustomers(db: DB, fromId: number, intoId: number, ctx: Ctx) {
  if (fromId === intoId) throw new CrmError("same", "Kies twee verschillende klanten.");
  await db.transaction(async (tx) => {
    const rows = await tx.select().from(customers).where(inArray(customers.id, [fromId, intoId])).for("update");
    const from = rows.find((r) => r.id === fromId);
    const into = rows.find((r) => r.id === intoId);
    if (!from || !into) throw new CrmError("notFound", "Klant niet gevonden.");
    if (from.mergedIntoId || into.mergedIntoId || from.anonymizedAt || into.anonymizedAt) throw new CrmError("state", "Een van deze profielen is al samengevoegd of geanonimiseerd.");
    const cons = await tx.select({ id: consultations.id, customerId: consultations.customerId }).from(consultations).where(inArray(consultations.customerId, [fromId, intoId]));
    if (cons.length === 2) throw new CrmError("consultation", "Beide profielen hebben een consultatieformulier. Verwijder er eerst één in het consultatiegedeelte.");
    await tx.update(appointments).set({ customerId: intoId }).where(eq(appointments.customerId, fromId));
    await tx.update(payments).set({ customerId: intoId }).where(eq(payments.customerId, fromId));
    await tx.update(invoices).set({ customerId: intoId }).where(eq(invoices.customerId, fromId));
    await tx.update(reviews).set({ customerId: intoId }).where(eq(reviews.customerId, fromId));
    await tx.update(reviewInvites).set({ customerId: intoId }).where(eq(reviewInvites.customerId, fromId));
    await tx.update(outbox).set({ customerId: intoId }).where(eq(outbox.customerId, fromId));
    await tx.update(consultations).set({ customerId: intoId }).where(eq(consultations.customerId, fromId));
    const notes = [into.notes, from.notes].filter(Boolean).join("\n— samengevoegd —\n").slice(0, 2000) || null;
    await tx
      .update(customers)
      .set({
        lastName: into.lastName || from.lastName,
        email: into.email ?? from.email,
        emailNorm: into.emailNorm ?? from.emailNorm,
        phone: into.phone ?? from.phone,
        phoneNorm: into.phoneNorm ?? from.phoneNorm,
        notes,
        consentAt: into.consentAt ?? from.consentAt,
        privacyVersion: into.privacyVersion ?? from.privacyVersion,
      })
      .where(eq(customers.id, intoId));
    await tx.update(customers).set({ mergedIntoId: intoId, emailNorm: null, phoneNorm: null }).where(eq(customers.id, fromId));
    await tx.insert(customerMerges).values({ fromCustomerId: fromId, intoCustomerId: intoId, snapshot: { from, into }, userId: ctx.userId ?? null });
  });
  await audit(db, { userId: ctx.userId, action: "customer.merged", entity: "customer", entityId: intoId, details: { from: fromId } });
}

/** Most recent profiles with their next appointment, for the customer list. */
export async function recentCustomers(db: DB, limit = 40) {
  return db.select().from(customers).where(activeCustomer).orderBy(desc(customers.updatedAt)).limit(limit);
}
