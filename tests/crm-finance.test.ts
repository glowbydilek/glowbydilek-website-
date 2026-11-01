import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { normalizeEmail, normalizePhone } from "../src/lib/crm/normalize.ts";
import { centsToInput, formatCents, parseEuroToCents, vatFromGross } from "../src/lib/finance/money.ts";
import { computeTotals, formatInvoiceNumber, invoiceReadiness, lineErrors, validIban, validKvk, validVatNumber } from "../src/lib/finance/invoice-core.ts";
import { defaultInvoiceSettings, setSetting, type InvoiceSettings } from "../src/lib/db/settings.ts";
import { BookingError, cancel, createLegacyRequest, createManual, markCompleted, reschedule, searchCustomers } from "../src/lib/booking/service.ts";
import { customerStats, findDuplicates, findMatches, mergeCustomers } from "../src/lib/crm/service.ts";
import { financeReport, recordPayment, voidPayment } from "../src/lib/finance/service.ts";
import { createCredit, createDraft, emailInvoice, InvoiceError, issueInvoice, updateDraft } from "../src/lib/finance/invoices.ts";
import { processOutbox } from "../src/lib/notifications/outbox.ts";
import { seedTreatments } from "../src/lib/db/seed.ts";
import { appointments, consultations, customers, invoices, outbox, treatments, weeklyHours } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

// ───────────────────────────────────────────────────────── pure

test("phone numbers in every common Dutch notation normalise to one value", () => {
  for (const v of ["06 12 34 56 78", "0612345678", "+31 6 1234 5678", "+31 (0)6 12345678", "0031612345678", "31612345678", "612345678", "06-12345678"])
    assert.equal(normalizePhone(v), "+31612345678", v);
  assert.equal(normalizePhone("020 123 4567"), "+31201234567");
  assert.equal(normalizePhone("+32 470 12 34 56"), "+32470123456");
  for (const v of ["", "12345", "abc", "06123"]) assert.equal(normalizePhone(v), null, v);
});

test("email normalisation is case-insensitive and rejects invalid input", () => {
  assert.equal(normalizeEmail("  Sara@Example.COM "), "sara@example.com");
  assert.equal(normalizeEmail("not-an-email"), null);
});

test("money is parsed and formatted in integer cents, never floats", () => {
  assert.equal(parseEuroToCents("45"), 4500);
  assert.equal(parseEuroToCents("45,5"), 4550);
  assert.equal(parseEuroToCents("€ 1.234,56"), 123456);
  assert.equal(parseEuroToCents("45.50"), 4550);
  assert.equal(parseEuroToCents("0,10"), 10);
  assert.equal(parseEuroToCents("12,345"), null);
  assert.equal(parseEuroToCents("abc"), null);
  assert.equal(formatCents(123456), "€ 1.234,56");
  assert.equal(formatCents(-500, "en"), "-€5.00");
  assert.equal(centsToInput(4550), "45,50");
  // 0.1 + 0.2 style errors cannot occur: 3 × € 0,10 is exactly 30 cents.
  assert.equal(3 * parseEuroToCents("0,10")!, 30);
});

test("VAT is derived from gross amounts with round-half-up on cents", () => {
  assert.equal(vatFromGross(12100, 2100), 2100);
  assert.equal(vatFromGross(4500, 2100), 781); // 45 × 21/121 = 7.8099…
  assert.equal(vatFromGross(1000, 900), 83); // 10 × 9/109 = 0.8257
  assert.equal(vatFromGross(4500, 0), 0);
  const t = computeTotals([{ description: "Brazilian", quantity: 1, unitCents: 4500 }, { description: "Wenkbrauwen", quantity: 2, unitCents: 1500 }], "standard", 2100);
  assert.equal(t.totalCents, 7500);
  assert.equal(t.vatCents, 781 + 521);
  assert.equal(t.subtotalCents + t.vatCents, t.totalCents);
  const ex = computeTotals([{ description: "x", quantity: 1, unitCents: 4500 }], "exempt", 2100);
  assert.equal(ex.vatCents, 0);
  assert.equal(ex.vatRateBp, 0);
});

test("invoices are blocked until the owner configured verified business details", () => {
  const missing = invoiceReadiness(defaultInvoiceSettings);
  assert.ok(missing.some((m) => m.includes("KVK")));
  assert.ok(missing.some((m) => m.includes("Btw-situatie")));
  const ok: InvoiceSettings = { ...defaultInvoiceSettings, legalName: "Test", street: "Straat 1", postcode: "1234 AB", city: "Plaats", kvk: "12345678", vatMode: "exempt", exemptionText: "Vrijgesteld van btw volgens test." };
  assert.deepEqual(invoiceReadiness(ok), []);
  assert.ok(invoiceReadiness({ ...ok, vatMode: "standard" }).some((m) => m.includes("Btw-identificatienummer")));
  assert.ok(validKvk("12345678") && !validKvk("1234"));
  assert.ok(validVatNumber("NL123456789B01") && !validVatNumber("NL12345678B01"));
  assert.ok(validIban("NL91ABNA0417164300") && !validIban("NL91ABNA0417164301"));
  assert.equal(formatInvoiceNumber("GBD", 2027, 7), "GBD-2027-0007");
  assert.ok(lineErrors([{ description: "x", quantity: 1, unitCents: -100 }], "invoice").length);
  assert.ok(lineErrors([{ description: "x", quantity: 1, unitCents: 100 }], "credit").length);
});

// ───────────────────────────────────────────────────────── database

const ctx = { userId: 1, ownerEmail: "" };
const DAY = "2027-03-01"; // a Monday
const verified: InvoiceSettings = {
  ...defaultInvoiceSettings,
  legalName: "Test Onderneming",
  street: "Teststraat 1",
  postcode: "1234 AB",
  city: "Teststad",
  kvk: "12345678",
  vatMode: "standard",
  vatNumber: "NL123456789B01",
  vatRateBp: 2100,
  iban: "NL91ABNA0417164300",
};

describe("CRM, finance and invoices against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  beforeEach(async () => {
    db = await resetDb();
    await seedTreatments(db);
    await db.update(treatments).set({ durationMinutes: 45, priceCents: 4500, bufferMinutes: 0 }).where(eq(treatments.id, "brazilian"));
    await db.update(treatments).set({ durationMinutes: 30, priceCents: 2000 }).where(eq(treatments.id, "eyebrows"));
    await db.insert(weeklyHours).values([1, 2, 3, 4, 5].map((weekday) => ({ weekday, kind: "open", startMinute: 540, endMinute: 1020 })));
  });

  const manual = (o: Record<string, unknown> = {}) =>
    createManual(db, { firstName: "Sara", lastName: "de Vries", email: "sara@example.com", phone: "06 12 34 56 78", treatmentIds: ["brazilian"], day: DAY, minute: 600, ...o }, ctx);

  test("a public request never overwrites an existing profile and only attaches on a strong match", async () => {
    const id = await manual();
    const [sara] = await db.select().from(appointments).where(eq(appointments.id, id));
    // Same email, different surname → a NEW profile (no takeover of Sara's data).
    await createLegacyRequest(db, { firstName: "Iemand", lastName: "Anders", email: "SARA@example.com", phone: null, treatmentIds: ["brazilian"], preferredDate: DAY, timeRange: "morning" }, ctx);
    const all = await db.select().from(customers);
    assert.equal(all.length, 2);
    const [orig] = await db.select().from(customers).where(eq(customers.id, sara.customerId));
    assert.equal(orig.firstName, "Sara");
    assert.equal(orig.lastName, "de Vries");
    // Same email + same surname → attached to Sara, name untouched.
    await createLegacyRequest(db, { firstName: "S.", lastName: "De Vries", email: "sara@example.com", phone: null, treatmentIds: ["brazilian"], preferredDate: DAY, timeRange: "morning" }, ctx);
    assert.equal((await db.select().from(customers)).length, 2);
    const [still] = await db.select().from(customers).where(eq(customers.id, sara.customerId));
    assert.equal(still.firstName, "Sara");
  });

  test("returning customers are recognised by phone or email in any notation, never merged silently", async () => {
    await manual();
    const m = await findMatches(db, { phone: "+31 6 1234 5678" });
    assert.equal(m.length, 1);
    assert.ok(m[0].strong && m[0].reasons.includes("phone"));
    assert.equal((await findMatches(db, { email: "SARA@EXAMPLE.COM" }))[0].reasons[0], "email");
    // Entering the same phone again without choosing → refused with a clear choice.
    await assert.rejects(manual({ firstName: "Sara", minute: 720 }), (e: unknown) => e instanceof BookingError && e.code === "customerMatch");
    // Explicitly new person → second profile; explicit existing → attached.
    await manual({ minute: 720, forceNew: true });
    assert.equal((await db.select().from(customers)).length, 2);
    const [first] = await db.select().from(customers).limit(1);
    await manual({ minute: 840, customerId: first.id });
    assert.equal((await db.select().from(appointments).where(eq(appointments.customerId, first.id))).length, 2);
    assert.equal((await searchCustomers(db, "0612345678")).length, 2);
  });

  test("material changes always notify the customer; without email the owner sees it", async () => {
    const id = await manual();
    const r = await reschedule(db, id, ctx, { day: DAY, minute: 660 });
    assert.equal(r.notified, true);
    const c = await cancel(db, id, ctx, {});
    assert.equal(c.notified, true);
    const kinds = (await db.select().from(outbox)).map((o) => o.kind).sort();
    assert.deepEqual(kinds.filter((k) => k !== "reminder"), ["cancelled", "confirmed", "rescheduled"]);
    const noMail = await manual({ email: null, phone: "0687654321", firstName: "Zonder", lastName: "Mail", minute: 840 });
    assert.equal((await cancel(db, noMail, ctx, {})).notified, false);
    // A price-only change is not material: no email.
    const id2 = await manual({ minute: 900, customerId: (await db.select().from(customers).limit(1))[0].id });
    const before = (await db.select().from(outbox)).length;
    const r2 = await reschedule(db, id2, ctx, { day: DAY, minute: 900, priceCents: 4000 });
    assert.equal(r2.material, false);
    assert.equal((await db.select().from(outbox)).length, before);
  });

  test("appointment prices are snapshots: later list-price changes do not rewrite history", async () => {
    const id = await manual({ treatmentIds: ["brazilian", "eyebrows"] });
    await db.update(treatments).set({ priceCents: 9900 }).where(eq(treatments.id, "brazilian"));
    const [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a.priceCents, 6500);
    // A treatment without a confirmed price → no agreed price is invented.
    const id2 = await manual({ treatmentIds: ["chin"], durationMinutes: 15, minute: 720, customerId: a.customerId });
    const [b] = await db.select().from(appointments).where(eq(appointments.id, id2));
    assert.equal(b.priceCents, null);
  });

  test("customer statistics count visits, cancellations, no-shows and recorded money only", async () => {
    const a1 = await manual();
    const [c] = await db.select().from(customers);
    const a2 = await manual({ minute: 720, customerId: c.id, treatmentIds: ["eyebrows"] });
    await manual({ minute: 840, customerId: c.id });
    await markCompleted(db, a1, ctx);
    await markCompleted(db, a2, ctx);
    const a3 = (await db.select().from(appointments)).find((a) => a.status === "confirmed")!;
    await cancel(db, a3.id, ctx, {});
    await recordPayment(db, { customerId: c.id, appointmentId: a1, amountCents: 4500, method: "pin", paidOn: DAY, kind: "payment" }, ctx);
    const s = await customerStats(db, c.id, new Date("2027-01-01"));
    assert.equal(s.total, 3);
    assert.equal(s.completed, 2);
    assert.equal(s.cancelled, 1);
    assert.equal(s.receivedCents, 4500);
    assert.deepEqual(s.treatments.map((t) => t.name).sort(), ["Brazilian", "Wenkbrauwen"].sort());
  });

  test("duplicates are detected and merged manually with the full history moved", async () => {
    const a = await manual();
    const b = await manual({ minute: 720, forceNew: true, email: "andere@example.com" });
    const [ca] = await db.select().from(appointments).where(eq(appointments.id, a));
    const [cb] = await db.select().from(appointments).where(eq(appointments.id, b));
    const dups = await findDuplicates(db);
    assert.equal(dups.length, 1);
    assert.ok(dups[0].reasons.includes("phone"));
    await recordPayment(db, { customerId: cb.customerId, amountCents: 1000, method: "cash", paidOn: DAY, kind: "payment" }, ctx);
    await mergeCustomers(db, cb.customerId, ca.customerId, ctx);
    assert.equal((await db.select().from(appointments).where(eq(appointments.customerId, ca.customerId))).length, 2);
    const s = await customerStats(db, ca.customerId);
    assert.equal(s.receivedCents, 1000);
    const [merged] = await db.select().from(customers).where(eq(customers.id, cb.customerId));
    assert.equal(merged.mergedIntoId, ca.customerId);
    assert.equal((await searchCustomers(db, "")).length, 1);
    assert.equal((await findDuplicates(db)).length, 0);
  });

  test("merging is refused when both profiles hold a consultation record", async () => {
    const a = await manual();
    const b = await manual({ minute: 720, forceNew: true });
    const [ca] = await db.select().from(appointments).where(eq(appointments.id, a));
    const [cb] = await db.select().from(appointments).where(eq(appointments.id, b));
    const row = { dataEnc: "x", formVersion: "1", consentAt: new Date(), consentMethod: "written", consentTextVersion: "1", reviewedAt: new Date(), nextReviewAt: new Date() };
    await db.insert(consultations).values([{ ...row, customerId: ca.customerId }, { ...row, customerId: cb.customerId }]);
    await assert.rejects(mergeCustomers(db, cb.customerId, ca.customerId, ctx), /consultatieformulier/);
  });

  test("finance reports use recorded payments only, with refunds, voids and exact attribution", async () => {
    const a1 = await manual();
    const [c] = await db.select().from(customers);
    const a2 = await manual({ minute: 720, customerId: c.id, treatmentIds: ["brazilian", "eyebrows"] });
    const a3 = await manual({ minute: 840, customerId: c.id, treatmentIds: ["eyebrows"] });
    for (const id of [a1, a2, a3]) await markCompleted(db, id, ctx);
    await recordPayment(db, { customerId: c.id, appointmentId: a1, amountCents: 4500, method: "pin", paidOn: DAY, kind: "payment" }, ctx);
    await recordPayment(db, { customerId: c.id, appointmentId: a2, amountCents: 6500, method: "cash", paidOn: DAY, kind: "payment" }, ctx);
    await recordPayment(db, { customerId: c.id, appointmentId: a1, amountCents: 500, method: "pin", paidOn: DAY, kind: "refund" }, ctx);
    const wrong = await recordPayment(db, { customerId: c.id, amountCents: 99900, method: "cash", paidOn: DAY, kind: "payment" }, ctx);
    await voidPayment(db, wrong, "Dubbel ingevoerd", ctx);
    const r = await financeReport(db, { from: DAY, to: DAY, label: "test" });
    assert.equal(r.receivedCents, 11000);
    assert.equal(r.refundedCents, 500);
    assert.equal(r.netCents, 10500);
    assert.equal(r.payingCustomers, 1);
    assert.equal(r.completed, 3);
    assert.deepEqual(
      r.byTreatment.map((t) => [t.name, t.cents]),
      [["Combinatie: Brazilian + Wenkbrauwen", 6500], ["Brazilian", 4000]],
    );
    // a3 has an agreed price (€ 20) but no payment → listed as unpaid, nothing invented.
    assert.deepEqual(r.unpaidAppointments.map((u) => [u.id, u.agreedCents]), [[a3, 2000]]);
    await assert.rejects(voidPayment(db, wrong, "nogmaals", ctx));
  });

  test("invoices: blocked without business details, sequential numbers under concurrency, frozen once issued", async () => {
    const a = await manual();
    const [c] = await db.select().from(customers);
    const d1 = await createDraft(db, { customerId: c.id, appointmentId: a }, ctx);
    await assert.rejects(issueInvoice(db, d1, ctx), (e: unknown) => e instanceof InvoiceError && e.details.some((m) => m.includes("KVK")));
    await setSetting(db, "invoice_settings", verified);
    const drafts = [d1];
    for (let i = 0; i < 5; i++) drafts.push(await createDraft(db, { customerId: c.id, appointmentId: a }, ctx));
    const numbers = await Promise.all(drafts.map((id) => issueInvoice(db, id, ctx)));
    const year = new Date().getFullYear();
    assert.deepEqual(numbers.slice().sort(), [1, 2, 3, 4, 5, 6].map((n) => `GBD-${year}-000${n}`));
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, d1));
    assert.equal(inv.totalCents, 4500);
    assert.equal(inv.vatCents, 781);
    assert.ok(inv.pdf && Buffer.from(inv.pdf).subarray(0, 5).toString() === "%PDF-");
    assert.equal(createHash("sha256").update(Buffer.from(inv.pdf!)).digest("hex"), inv.pdfSha256);
    // Issued invoices cannot be edited or re-issued.
    await assert.rejects(updateDraft(db, d1, { lines: [{ description: "x", quantity: 1, unitCents: 1 }], buyer: { name: "x", email: null, address: null }, supplyDate: null, note: "" }, ctx), InvoiceError);
    await assert.rejects(issueInvoice(db, d1, ctx), InvoiceError);
    // Later setting changes never alter an issued invoice.
    await setSetting(db, "invoice_settings", { ...verified, legalName: "Nieuwe naam" });
    const [again] = await db.select().from(invoices).where(eq(invoices.id, d1));
    assert.equal((again.seller as InvoiceSettings).legalName, "Test Onderneming");
    // Correction via credit invoice, numbered in the same sequence.
    const cr = await createCredit(db, d1, ctx);
    assert.equal(await issueInvoice(db, cr, ctx), `GBD-${year}-0007`);
    const [credit] = await db.select().from(invoices).where(eq(invoices.id, cr));
    assert.equal(credit.totalCents, -4500);
    const r = await financeReport(db, { from: "2000-01-01", to: "2100-01-01", label: "all" });
    assert.ok(!r.openInvoices.some((o) => o.id === d1), "a fully credited invoice is not open");
  });

  test("paid on the spot: the payment is recorded with the invoice and the PDF says paid", async () => {
    await setSetting(db, "invoice_settings", { ...verified, vatMode: "exempt", exemptionText: "Vrijgesteld van btw (testtekst).", vatNumber: "", vatRateBp: null });
    const a = await manual();
    const [c] = await db.select().from(customers);
    const d = await createDraft(db, { customerId: c.id, appointmentId: a }, ctx);
    await issueInvoice(db, d, ctx, { paid: { method: "pin", paidOn: DAY } });
    const s = await customerStats(db, c.id);
    assert.equal(s.receivedCents, 4500);
    assert.equal(s.invoicedCents, 4500);
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, d));
    assert.equal(inv.vatCents, 0);
  });

  test("invoice emails carry the PDF and only go to the customer's own address", async () => {
    await setSetting(db, "invoice_settings", verified);
    const a = await manual();
    const [c] = await db.select().from(customers);
    const d = await createDraft(db, { customerId: c.id, appointmentId: a }, ctx);
    await assert.rejects(emailInvoice(db, d, ctx), /uitgegeven/);
    const number = await issueInvoice(db, d, ctx);
    await emailInvoice(db, d, ctx);
    const sent: { to: string; attachments?: { filename: string; content: Buffer }[] }[] = [];
    await processOutbox(db, async (m) => void sent.push(m));
    const mail = sent.find((m) => m.attachments?.length)!;
    assert.equal(mail.to, "sara@example.com");
    assert.equal(mail.attachments![0].filename, `factuur-${number}.pdf`);
    assert.equal(mail.attachments![0].content.subarray(0, 5).toString(), "%PDF-");
    // Customer email changed after issue → refused (the PDF names the old address).
    await db.update(customers).set({ email: "nieuw@example.com" }).where(eq(customers.id, c.id));
    await assert.rejects(emailInvoice(db, d, ctx), /e-mailadres/);
  });
});
