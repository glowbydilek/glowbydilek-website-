import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { DB } from "../db/client";
import { appointments, appointmentTreatments, customers, priceQuotes } from "../db/schema";
import { audit } from "../db/audit";
import { formatCents } from "../finance/money";
import { enqueue } from "../notifications/outbox";
import { paragraphsToHtml } from "../notifications/templates";
import { formatLongDate } from "../time";
import { queueAppointmentEmail, recordAppointmentEvent, type Tx } from "./service";

/**
 * Price proposals ("prijs op aanvraag").
 *
 * The owner proposes an amount for an appointment; the customer receives a
 * personal, single-use link (token stored as SHA-256 only) and accepts or
 * declines it. On acceptance the amount becomes the appointment's agreed
 * price snapshot, and both sides get an email. Nothing is charged online.
 */
export class QuoteError extends Error {
  code: "notFound" | "noEmail" | "invalidState" | "invalidInput" | "expired";
  constructor(code: QuoteError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "QuoteError";
  }
}

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://glowbydilek.nl").replace(/\/+$/, "");
export const quotePath = (locale: string, token: string) => (locale === "en" ? `/en/quote/${token}` : `/offerte/${token}`);

export type QuoteStatus = "sent" | "accepted" | "declined" | "withdrawn" | "expired";

export async function sendQuote(
  db: DB,
  appointmentId: number,
  input: { amountCents: number; message?: string; validDays?: number },
  ctx: { userId: number | null; now?: Date },
): Promise<{ token: string; quoteId: number }> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0 || input.amountCents > 1_000_000) throw new QuoteError("invalidInput", "Vul een geldig bedrag in.");
  const days = Math.min(30, Math.max(1, Math.round(input.validDays ?? 7)));
  const now = ctx.now ?? new Date();
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(appointments).innerJoin(customers, eq(appointments.customerId, customers.id)).where(eq(appointments.id, appointmentId)).for("update");
    if (!row) throw new QuoteError("notFound", "Afspraak niet gevonden.");
    if (!["requested", "proposed", "confirmed"].includes(row.appointments.status)) throw new QuoteError("invalidState", "Voor deze afspraak kan geen prijsvoorstel meer worden gestuurd.");
    if (!row.customers.email) throw new QuoteError("noEmail", "Deze klant heeft geen e-mailadres. Bespreek de prijs persoonlijk en vul hem in bij ‘Afgesproken prijs’.");
    await tx.update(priceQuotes).set({ status: "withdrawn" }).where(and(eq(priceQuotes.appointmentId, appointmentId), eq(priceQuotes.status, "sent")));
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now.getTime() + days * 86_400_000);
    const [res] = await tx.insert(priceQuotes).values({ appointmentId, amountCents: input.amountCents, message: input.message?.trim().slice(0, 1000) || null, tokenHash: hash(token), status: "sent", expiresAt, userId: ctx.userId });
    const quoteId = Number((res as { insertId: number }).insertId);
    const locale = row.appointments.locale === "en" ? "en" : "nl";
    await queueAppointmentEmail(tx as Tx, appointmentId, "price_proposal", `price_proposal:${quoteId}`, {
      message: input.message,
      vars: { amount: formatCents(input.amountCents), link: `${site()}${quotePath(locale, token)}`, validUntil: formatLongDate(expiresAt, locale) },
    });
    await recordAppointmentEvent(tx as Tx, appointmentId, "quote_sent", ctx.userId, { quoteId, amountCents: input.amountCents, validDays: days });
    return { token, quoteId };
  });
}

export async function withdrawQuote(db: DB, appointmentId: number, userId: number | null) {
  await db.update(priceQuotes).set({ status: "withdrawn" }).where(and(eq(priceQuotes.appointmentId, appointmentId), eq(priceQuotes.status, "sent")));
  await audit(db, { userId, action: "quote.withdrawn", entity: "appointment", entityId: String(appointmentId) });
}

export function effectiveStatus(q: { status: string; expiresAt: Date }, now = new Date()): QuoteStatus {
  return q.status === "sent" && q.expiresAt.getTime() < now.getTime() ? "expired" : (q.status as QuoteStatus);
}

/** Public view of a quote by its token (minimal data: first name, treatments, amount, date). */
export async function quoteByToken(db: DB, token: string, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const [q] = await db.select().from(priceQuotes).where(eq(priceQuotes.tokenHash, hash(token))).limit(1);
  if (!q) return null;
  const [row] = await db.select().from(appointments).innerJoin(customers, eq(appointments.customerId, customers.id)).where(eq(appointments.id, q.appointmentId)).limit(1);
  if (!row) return null;
  const items = await db.select().from(appointmentTreatments).where(eq(appointmentTreatments.appointmentId, q.appointmentId));
  return {
    id: q.id,
    status: effectiveStatus(q, now),
    amountCents: q.amountCents,
    message: q.message,
    expiresAt: q.expiresAt,
    locale: row.appointments.locale === "en" ? ("en" as const) : ("nl" as const),
    firstName: row.customers.firstName,
    startAt: row.appointments.startAt,
    requestedDate: row.appointments.requestedDate,
    treatments: items.map((i) => ({ nl: i.nameNl, en: i.nameEn })),
  };
}

/** Accept or decline. Single use; refuses expired, withdrawn or already-answered quotes. */
export async function respondQuote(db: DB, token: string, accept: boolean, ipHash: string | null, ownerEmail?: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const [q] = await tx.select().from(priceQuotes).where(eq(priceQuotes.tokenHash, hash(token))).for("update");
    if (!q) throw new QuoteError("notFound", "notFound");
    const st = effectiveStatus(q, now);
    if (st === "expired") throw new QuoteError("expired", "expired");
    if (st !== "sent") throw new QuoteError("invalidState", st);
    await tx.update(priceQuotes).set({ status: accept ? "accepted" : "declined", respondedAt: now, responseIpHash: ipHash }).where(eq(priceQuotes.id, q.id));
    if (accept) {
      await tx.update(appointments).set({ priceCents: q.amountCents }).where(eq(appointments.id, q.appointmentId));
      await queueAppointmentEmail(tx as Tx, q.appointmentId, "price_accepted", `price_accepted:${q.id}`, { vars: { amount: formatCents(q.amountCents) } });
    }
    await recordAppointmentEvent(tx as Tx, q.appointmentId, accept ? "quote_accepted" : "quote_declined", null, { quoteId: q.id, amountCents: q.amountCents });
    if (ownerEmail) {
      const lines = [
        accept ? `Het prijsvoorstel van ${formatCents(q.amountCents)} is GEACCEPTEERD.` : `Het prijsvoorstel van ${formatCents(q.amountCents)} is afgewezen.`,
        accept ? "Het bedrag staat nu als afgesproken prijs bij de afspraak." : "Neem eventueel persoonlijk contact op.",
        `Bekijk de afspraak: ${site()}/agenda/afspraak/${q.appointmentId}`,
      ];
      await enqueue(tx as Tx, {
        dedupeKey: `owner_quote:${q.id}`,
        kind: "owner_quote",
        appointmentId: q.appointmentId,
        to: ownerEmail,
        replyTo: null,
        subject: accept ? `Prijsvoorstel geaccepteerd — afspraak #${q.appointmentId}` : `Prijsvoorstel afgewezen — afspraak #${q.appointmentId}`,
        text: lines.join("\n\n"),
        html: paragraphsToHtml(lines),
      });
    }
    return { appointmentId: q.appointmentId, amountCents: q.amountCents, accepted: accept };
  });
}

export async function quotesForAppointment(db: DB, appointmentId: number) {
  const rows = await db.select().from(priceQuotes).where(eq(priceQuotes.appointmentId, appointmentId)).orderBy(desc(priceQuotes.createdAt));
  return rows.map((r) => ({ id: r.id, amountCents: r.amountCents, message: r.message, status: effectiveStatus(r), createdAt: r.createdAt, expiresAt: r.expiresAt, respondedAt: r.respondedAt }));
}

export async function openQuotes(db: DB, appointmentIds: number[]) {
  if (!appointmentIds.length) return [];
  return db.select().from(priceQuotes).where(and(inArray(priceQuotes.appointmentId, appointmentIds), eq(priceQuotes.status, "sent")));
}
