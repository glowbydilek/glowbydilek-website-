import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { allocateDiscount, computeTotals, invoiceReadiness, lineErrors, vatLineErrors, type InvoiceLine } from "../src/lib/finance/invoice-core.ts";
import { defaultInvoiceSettings, setSetting, type InvoiceSettings } from "../src/lib/db/settings.ts";
import { parseEuroToCents } from "../src/lib/finance/money.ts";
import { csvCell, receiptKind, validateExpense } from "../src/lib/expenses/core.ts";
import { createManual, markCompleted } from "../src/lib/booking/service.ts";
import { afterCompletion } from "../src/lib/finance/automation.ts";
import { seedTreatments } from "../src/lib/db/seed.ts";
import { appointments, invoices, outbox, treatments, weeklyHours } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

const lines: InvoiceLine[] = [
  { description: "Brazilian", quantity: 1, unitCents: 4500, vat: "standard" },
  { description: "Gezichtsmasker", quantity: 1, unitCents: 3270, vat: "reduced" },
  { description: "Product (vrij)", quantity: 1, unitCents: 1000, vat: "exempt" },
];

test("mixed-rate invoice: VAT per line and a breakdown per rate; totals add up exactly", () => {
  const t = computeTotals(lines, "standard", 2100, 900);
  assert.deepEqual(t.lines.map((l) => [l.vatRateBp, l.vatCents, l.vatLabel]), [[2100, 781, "21%"], [900, 270, "9%"], [0, 0, "vrij"]]);
  assert.equal(t.totalCents, 8770);
  assert.equal(t.vatCents, 1051);
  assert.equal(t.subtotalCents + t.vatCents, t.totalCents);
  assert.deepEqual(t.breakdown.map((r) => [r.label, r.baseCents, r.vatCents]), [["Btw 21%", 3719, 781], ["Btw 9%", 3000, 270], ["Vrijgesteld", 1000, 0]]);
  // KOR or an exemption: no VAT on any line.
  assert.equal(computeTotals(lines, "kor", 2100, 900).vatCents, 0);
  assert.equal(computeTotals(lines, "exempt", 2100, 900).breakdown.length, 0);
  // Old invoices without a category are treated as standard.
  assert.equal(computeTotals([{ description: "x", quantity: 1, unitCents: 12100 }], "standard", 2100).vatCents, 2100);
});

test("a reduced line needs a reduced rate set; KOR needs its invoice text", () => {
  assert.equal(vatLineErrors(lines, { vatMode: "standard", vatRateBp: 2100, reducedRateBp: null }).length, 1);
  assert.equal(vatLineErrors(lines, { vatMode: "standard", vatRateBp: 2100, reducedRateBp: 900 }).length, 0);
  assert.equal(vatLineErrors(lines, { vatMode: "kor", vatRateBp: null }).length, 0);
  const base: InvoiceSettings = { ...defaultInvoiceSettings, legalName: "Glow", street: "Straat 1", postcode: "1234 AB", city: "Plaats", kvk: "12345678" };
  assert.ok(invoiceReadiness({ ...base, vatMode: "kor" }).some((m) => /KOR/.test(m)));
  assert.equal(invoiceReadiness({ ...base, vatMode: "kor", exemptionText: "Vrijgesteld van btw op grond van de KOR." }).length, 0);
});

test("a discount is split over the VAT rates in proportion, to the cent", () => {
  const d = allocateDiscount(lines.slice(0, 2), 1000);
  assert.equal(d.reduce((s, l) => s + l.unitCents, 0), -1000);
  assert.deepEqual(d.map((l) => [l.vat, l.unitCents]), [["standard", -579], ["reduced", -421]]);
  assert.ok(d.every((l) => /Korting/.test(l.description)));
  assert.deepEqual(lineErrors([...lines, ...d], "invoice"), []);
  assert.ok(lineErrors([{ description: "Iets", quantity: 1, unitCents: -500 }], "invoice").length > 0, "negative only as a discount line");
  assert.equal(allocateDiscount(lines, 0).length, 0);
  assert.equal(allocateDiscount([{ description: "a", quantity: 1, unitCents: 500 }], 9999)[0].unitCents, -500, "never more than the total");
});

test("expenses: amounts, VAT from rate or receipt, receipt file signatures, safe CSV", () => {
  const v = validateExpense({ spentOn: "2026-11-01", category: "products", vendor: "Groothandel", description: "Wax", amount: "121,00", vatRate: "21", vatAmount: "", status: "paid", notes: "" }, parseEuroToCents);
  assert.ok(v.ok && v.value.amountCents === 12100 && v.value.vatCents === 2100 && v.value.vatRateBp === 2100);
  const exact = validateExpense({ spentOn: "2026-11-01", category: "x", vendor: "", description: "", amount: "10", vatRate: "21", vatAmount: "1,50", status: "open", notes: "" }, parseEuroToCents);
  assert.ok(exact.ok && exact.value.vatCents === 150 && exact.value.vatRateBp === null && exact.value.category === "other" && exact.value.status === "open");
  assert.equal(validateExpense({ spentOn: "", category: "x", vendor: "", description: "", amount: "10", vatRate: "", vatAmount: "", status: "", notes: "" }, parseEuroToCents).ok, false);
  assert.equal(validateExpense({ spentOn: "2026-11-01", category: "x", vendor: "", description: "", amount: "10", vatRate: "", vatAmount: "12", status: "", notes: "" }, parseEuroToCents).ok, false);
  assert.equal(receiptKind(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), "application/pdf"), "application/pdf");
  assert.equal(receiptKind(new Uint8Array([0x3c, 0x73, 0x76, 0x67]), "image/png"), null, "SVG/HTML disguised as image is refused");
  assert.equal(receiptKind(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/png"), null, "declared type must match");
  assert.equal(csvCell("=HYPERLINK(1)"), `"'=HYPERLINK(1)"`);
  assert.equal(csvCell('a "b"'), `"a ""b"""`);
});

describe("after completion: invoice automation and aftercare (database)", { skip: skipDb }, () => {
  let db: Awaited<ReturnType<typeof resetDb>>;
  beforeEach(async () => {
    db = await resetDb();
    await seedTreatments(db);
    await db.update(treatments).set({ priceCents: 4500, pricingMode: "fixed", durationMinutes: 45 }).where(eq(treatments.id, "brazilian"));
    await db.insert(weeklyHours).values([1, 2, 3, 4, 5].map((weekday) => ({ weekday, kind: "open", startMinute: 540, endMinute: 1020 })));
  });
  after(closeDb);

  const ctx = { userId: 1, ownerEmail: "" };
  const done = async (n: number) => {
    const id = await createManual(db, { firstName: "Iris", lastName: `V${n}`, email: `iris${n}@example.com`, phone: null, treatmentIds: ["brazilian"], day: "2026-03-02", minute: 540 + n * 60, allowOutsideHours: true }, ctx);
    await markCompleted(db, id, ctx);
    return id;
  };

  test("everything is off by default: no invoice, no aftercare", async () => {
    const id = await done(1);
    const r = await afterCompletion(db, id, ctx);
    assert.deepEqual(r, { invoice: "skipped", aftercare: false });
    assert.equal((await db.select().from(invoices)).length, 0);
  });

  test("auto-draft makes exactly one draft; 'no invoice' per appointment is respected; aftercare is scheduled", async () => {
    await setSetting(db, "invoice_automation", { autoDraft: true, autoIssue: true, autoEmail: true });
    await setSetting(db, "aftercare", { enabled: true, delayHours: 2 });
    const id = await done(2);
    const r = await afterCompletion(db, id, ctx);
    assert.equal(r.invoice, "draft", "business details incomplete → stays a draft");
    assert.equal(r.aftercare, true);
    assert.equal((await afterCompletion(db, id, ctx)).invoice, "skipped", "never a second invoice");
    assert.equal((await db.select().from(invoices)).length, 1);
    const mail = (await db.select().from(outbox)).find((m) => m.kind === "aftercare")!;
    assert.ok(mail.sendAfter && mail.sendAfter.getTime() > Date.now() + 3_500_000);
    const id2 = await done(3);
    await db.update(appointments).set({ invoiceMode: "none" }).where(eq(appointments.id, id2));
    assert.equal((await afterCompletion(db, id2, ctx)).invoice, "skipped");
  });
});
