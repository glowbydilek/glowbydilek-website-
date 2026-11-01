import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { appointments, appointmentTreatments, customers, invoiceCounters, invoices, payments, treatments } from "../db/schema";
import { defaultInvoiceSettings, getSetting, type InvoiceSettings } from "../db/settings";
import { enqueue } from "../notifications/outbox";
import { todayLocal, toLocalParts } from "../time";
import { allocateDiscount, computeTotals, formatInvoiceNumber, invoiceReadiness, lineErrors, VAT_CATS, vatLineErrors, type ComputedLine, type InvoiceLine, type VatCat } from "./invoice-core";
import { formatCents } from "./money";
import { renderInvoicePdf, type InvoiceSnapshot } from "./pdf";
import { METHODS } from "./service";

export class InvoiceError extends Error {
  details: string[];
  constructor(message: string, details: string[] = []) {
    super(message);
    this.details = details;
    this.name = "InvoiceError";
  }
}

type Ctx = { userId?: number | null };
export type Invoice = typeof invoices.$inferSelect;
export type Buyer = { name: string; email: string | null; address: string | null };

export async function getInvoiceSettings(db: DB): Promise<InvoiceSettings> {
  return getSetting(db, "invoice_settings", defaultInvoiceSettings);
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Draft invoice for a customer, optionally pre-filled from an appointment:
 * the agreed price snapshot is used; without a known price the line amount
 * stays empty for the owner to fill in (nothing is invented).
 */
export async function createDraft(db: DB, input: { customerId: number; appointmentId?: number | null }, ctx: Ctx): Promise<number> {
  const [c] = await db.select().from(customers).where(eq(customers.id, input.customerId));
  if (!c || c.anonymizedAt || c.mergedIntoId) throw new InvoiceError("Klant niet gevonden.");
  let lines: InvoiceLine[] = [];
  let supplyDate: string | null = null;
  if (input.appointmentId) {
    const [a] = await db.select().from(appointments).where(eq(appointments.id, input.appointmentId));
    if (!a || a.customerId !== c.id) throw new InvoiceError("Deze afspraak hoort niet bij deze klant.");
    const items = await db.select().from(appointmentTreatments).where(eq(appointmentTreatments.appointmentId, a.id));
    supplyDate = a.startAt ? toLocalParts(a.startAt).date : null;
    // VAT category per treatment as set in the catalogue (default: standard).
    const cats = items.length ? await db.select({ id: treatments.id, vat: treatments.vatCategory }).from(treatments) : [];
    const vatOf = (id: string): VatCat => (VAT_CATS.find((c) => c === cats.find((x) => x.id === id)?.vat) ?? "standard");
    const allPriced = items.length > 0 && items.every((i) => i.priceCents != null);
    const itemSum = items.reduce((s, i) => s + (i.priceCents ?? 0), 0);
    const discount = a.discountCents ?? 0;
    if (allPriced && (a.priceCents == null || a.priceCents === itemSum || a.priceCents === itemSum - discount)) {
      lines = items.map((i) => ({ description: i.nameNl, quantity: 1, unitCents: i.priceCents!, vat: vatOf(i.treatmentId) }));
      // A promotion is shown as discount line(s), split over the VAT rates in proportion.
      if (discount > 0 && a.priceCents === itemSum - discount) lines.push(...allocateDiscount(lines, discount));
    } else {
      const cat = new Set(items.map((i) => vatOf(i.treatmentId))).size === 1 && items.length ? vatOf(items[0].treatmentId) : "standard";
      lines = [{ description: items.map((i) => i.nameNl).join(" + ") || "Behandeling", quantity: 1, unitCents: a.priceCents ?? 0, vat: cat }];
    }
  }
  const buyer: Buyer = { name: `${c.firstName} ${c.lastName}`.trim(), email: c.email, address: null };
  const [res] = (await db.insert(invoices).values({
    customerId: c.id,
    appointmentId: input.appointmentId ?? null,
    buyer,
    lines,
    supplyDate,
    locale: c.locale === "en" ? "en" : "nl",
    userId: ctx.userId ?? null,
  })) as unknown as [{ insertId: number }];
  await audit(db, { userId: ctx.userId, action: "invoice.draft_created", entity: "invoice", entityId: res.insertId });
  return res.insertId;
}

async function loadDraft(db: DB, id: number): Promise<Invoice> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv) throw new InvoiceError("Factuur niet gevonden.");
  if (inv.status !== "draft") throw new InvoiceError("Een uitgegeven factuur kan niet meer worden gewijzigd. Maak een creditfactuur om te corrigeren.");
  return inv;
}

export async function updateDraft(db: DB, id: number, input: { lines: InvoiceLine[]; buyer: Buyer; supplyDate: string | null; note: string }, ctx: Ctx) {
  const inv = await loadDraft(db, id);
  const errs = lineErrors(input.lines, inv.kind === "credit" ? "credit" : "invoice");
  if (!input.buyer.name.trim()) errs.push("Naam van de klant ontbreekt.");
  if (errs.length) throw new InvoiceError("Controleer de factuur.", errs);
  await db
    .update(invoices)
    .set({ lines: input.lines, buyer: input.buyer, supplyDate: input.supplyDate, note: input.note.slice(0, 500) || null })
    .where(and(eq(invoices.id, id), eq(invoices.status, "draft")));
  await audit(db, { userId: ctx.userId, action: "invoice.draft_saved", entity: "invoice", entityId: id });
}

export async function deleteDraft(db: DB, id: number, ctx: Ctx) {
  await loadDraft(db, id);
  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.status, "draft")));
  await audit(db, { userId: ctx.userId, action: "invoice.draft_deleted", entity: "invoice", entityId: id });
}

/** Snapshot used for the PDF (and for re-rendering a preview of a draft). */
async function snapshotOf(db: DB, inv: Invoice, settings: InvoiceSettings, number: string, issueDate: string): Promise<InvoiceSnapshot> {
  const lines = inv.lines as InvoiceLine[];
  const totals = computeTotals(lines, settings.vatMode, settings.vatRateBp, settings.reducedRateBp ?? null);
  let correctsNumber: string | null = null;
  if (inv.correctsInvoiceId) {
    const [o] = await db.select({ number: invoices.number }).from(invoices).where(eq(invoices.id, inv.correctsInvoiceId));
    correctsNumber = o?.number ?? null;
  }
  return {
    number,
    kind: inv.kind === "credit" ? "credit" : "invoice",
    correctsNumber,
    issueDate,
    supplyDate: inv.supplyDate,
    dueDate: inv.kind === "invoice" ? addDays(issueDate, settings.paymentTermDays || 14) : null,
    seller: settings,
    buyer: inv.buyer as Buyer,
    lines: totals.lines,
    subtotalCents: totals.subtotalCents,
    vatCents: totals.vatCents,
    totalCents: totals.totalCents,
    vatRateBp: totals.vatRateBp,
    vatMode: settings.vatMode,
    breakdown: totals.breakdown,
    note: inv.note,
  };
}

/** PDF preview of a draft (watermarked number "CONCEPT"); nothing is stored or numbered. */
export async function previewPdf(db: DB, id: number): Promise<Buffer> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv) throw new InvoiceError("Factuur niet gevonden.");
  if (inv.status === "issued" && inv.pdf) return Buffer.from(inv.pdf);
  const settings = await getInvoiceSettings(db);
  return renderInvoicePdf(await snapshotOf(db, inv, settings, "CONCEPT", todayLocal()));
}

/**
 * Issues a draft: checks the seller details and lines, allocates the next
 * sequential number under a row lock (no gaps, no duplicates), freezes the
 * seller/buyer details, lines and totals, and stores the PDF with its hash.
 */
export async function issueInvoice(db: DB, id: number, ctx: Ctx, opts: { paid?: { method: string; paidOn: string } } = {}): Promise<string> {
  if (opts.paid && !(opts.paid.method in METHODS)) throw new InvoiceError("Kies een betaalmethode.");
  const settings = await getInvoiceSettings(db);
  const missing = invoiceReadiness(settings);
  if (missing.length) throw new InvoiceError("De factuur kan nog niet worden uitgegeven: vul eerst je bedrijfsgegevens aan (Admin → Bedrijf & facturen).", missing);
  const number = await db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invoices).where(eq(invoices.id, id)).for("update");
    if (!inv) throw new InvoiceError("Factuur niet gevonden.");
    if (inv.status !== "draft") throw new InvoiceError("Deze factuur is al uitgegeven.");
    const errs = [...lineErrors(inv.lines as InvoiceLine[], inv.kind === "credit" ? "credit" : "invoice"), ...vatLineErrors(inv.lines as InvoiceLine[], settings)];
    if (errs.length) throw new InvoiceError("Controleer de factuurregels.", errs);
    const issueDate = todayLocal();
    const year = Number(issueDate.slice(0, 4));
    await tx.execute(sql`INSERT INTO invoice_counters (year, last) VALUES (${year}, 0) ON DUPLICATE KEY UPDATE year = year`);
    await tx.execute(sql`SELECT last FROM invoice_counters WHERE year = ${year} FOR UPDATE`);
    await tx.update(invoiceCounters).set({ last: sql`${invoiceCounters.last} + 1` }).where(eq(invoiceCounters.year, year));
    const [counter] = await tx.select().from(invoiceCounters).where(eq(invoiceCounters.year, year));
    const num = formatInvoiceNumber(settings.prefix, year, counter.last);
    const snap = await snapshotOf(db, inv, settings, num, issueDate);
    if (opts.paid && inv.kind === "invoice" && snap.totalCents > 0) {
      // Paid on the spot: record the payment with the invoice so the PDF says "Voldaan".
      await tx.insert(payments).values({
        customerId: inv.customerId,
        appointmentId: inv.appointmentId,
        invoiceId: inv.id,
        amountCents: snap.totalCents,
        method: opts.paid.method,
        kind: "payment",
        paidOn: opts.paid.paidOn,
        note: `Betaald bij factuur ${num}`,
        userId: ctx.userId ?? null,
      });
      snap.paid = { cents: snap.totalCents, date: opts.paid.paidOn, method: METHODS[opts.paid.method as keyof typeof METHODS] };
    }
    const pdf = await renderInvoicePdf(snap);
    await tx
      .update(invoices)
      .set({
        number: num,
        status: "issued",
        issueDate,
        dueDate: snap.dueDate ?? null,
        seller: settings,
        lines: snap.lines,
        vatMode: settings.vatMode,
        subtotalCents: snap.subtotalCents,
        vatCents: snap.vatCents,
        totalCents: snap.totalCents,
        pdf,
        pdfSha256: createHash("sha256").update(pdf).digest("hex"),
        issuedAt: new Date(),
      })
      .where(and(eq(invoices.id, id), eq(invoices.status, "draft")));
    return num;
  });
  await audit(db, { userId: ctx.userId, action: "invoice.issued", entity: "invoice", entityId: id, details: { number } });
  return number;
}

/** Credit invoice (correction) for an issued invoice: a draft with the lines negated. */
export async function createCredit(db: DB, invoiceId: number, ctx: Ctx): Promise<number> {
  const [orig] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!orig || orig.status !== "issued" || orig.kind !== "invoice") throw new InvoiceError("Alleen een uitgegeven factuur kan worden gecrediteerd.");
  // Credit lines mirror the original (discount lines flip to positive), keeping each VAT category.
  const lines = (orig.lines as ComputedLine[]).map((l) => ({ description: l.description, quantity: l.quantity, unitCents: -l.unitCents, vat: l.vat ?? "standard" }));
  const [res] = (await db.insert(invoices).values({
    kind: "credit",
    correctsInvoiceId: orig.id,
    customerId: orig.customerId,
    appointmentId: orig.appointmentId,
    buyer: orig.buyer,
    lines,
    supplyDate: orig.supplyDate,
    locale: orig.locale,
    note: `Correctie op factuur ${orig.number}.`,
    userId: ctx.userId ?? null,
  })) as unknown as [{ insertId: number }];
  await audit(db, { userId: ctx.userId, action: "invoice.credit_draft_created", entity: "invoice", entityId: res.insertId, details: { corrects: orig.number } });
  return res.insertId;
}

/**
 * Emails an issued invoice PDF to the email address frozen on the invoice
 * (the customer's own address at the time of issue) — never to any other
 * address. Delivery status is visible on the invoice.
 */
export async function emailInvoice(db: DB, id: number, ctx: Ctx): Promise<void> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv || inv.status !== "issued" || !inv.number) throw new InvoiceError("Alleen een uitgegeven factuur kan worden gemaild.");
  const buyer = inv.buyer as Buyer;
  const [c] = await db.select({ email: customers.email }).from(customers).where(eq(customers.id, inv.customerId));
  if (!buyer.email || !c?.email || c.email.toLowerCase() !== buyer.email.toLowerCase())
    throw new InvoiceError("Er is geen (actueel) e-mailadres van deze klant bekend dat overeenkomt met de factuur. Pas het e-mailadres aan in het klantprofiel of maak een nieuwe factuur.");
  const en = inv.locale === "en";
  const credit = inv.kind === "credit";
  const subject = en ? `${credit ? "Credit note" : "Invoice"} ${inv.number} — Glow by Dilek` : `${credit ? "Creditfactuur" : "Factuur"} ${inv.number} — Glow by Dilek`;
  const first = buyer.name.split(" ")[0];
  const paragraphs = en
    ? [`Dear ${first},`, `Please find attached ${credit ? "credit note" : "invoice"} ${inv.number} for ${formatCents(inv.totalCents, "en")}.`, "Do you have a question about it? Simply reply to this email.", "Kind regards,\nDilek — Glow by Dilek"]
    : [`Beste ${first},`, `In de bijlage vind je ${credit ? "creditfactuur" : "factuur"} ${inv.number} van ${formatCents(inv.totalCents)}.`, "Heb je er een vraag over? Beantwoord dan gewoon deze e-mail.", "Hartelijke groet,\nDilek — Glow by Dilek"];
  const html = paragraphs.map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`).join("");
  // Per-minute key: a double click sends once; a deliberate resend later is allowed.
  const bucket = Math.floor(Date.now() / 60_000);
  const queued = await enqueue(db, {
    dedupeKey: `invoice:${inv.id}:${bucket}`,
    kind: "invoice",
    appointmentId: inv.appointmentId,
    customerId: inv.customerId,
    to: buyer.email,
    replyTo: process.env.MAIL_TO || process.env.SMTP_USER || null,
    subject,
    text: paragraphs.join("\n\n"),
    html,
    attachment: { kind: "invoice", ref: inv.id },
  });
  if (!queued) throw new InvoiceError("Deze factuur is zojuist al in de wachtrij gezet.");
  await audit(db, { userId: ctx.userId, action: "invoice.emailed", entity: "invoice", entityId: id });
}

export async function invoicesForCustomer(db: DB, customerId: number) {
  return db.select({ id: invoices.id, number: invoices.number, kind: invoices.kind, status: invoices.status, issueDate: invoices.issueDate, totalCents: invoices.totalCents, createdAt: invoices.createdAt }).from(invoices).where(eq(invoices.customerId, customerId)).orderBy(desc(invoices.createdAt));
}

export async function invoicePaid(db: DB, id: number) {
  const rows = await db.select().from(payments).where(and(eq(payments.invoiceId, id), sql`${payments.voidedAt} IS NULL`)).orderBy(desc(payments.paidOn));
  const cents = rows.reduce((s, p) => s + p.amountCents, 0);
  return { cents, last: rows[0] ? { date: rows[0].paidOn, method: METHODS[rows[0].method as keyof typeof METHODS] ?? rows[0].method } : null, rows };
}
