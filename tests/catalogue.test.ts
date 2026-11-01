import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { EMPTY_SNAPSHOT, setSnapshotResolver, type Snapshot, type TreatmentLive } from "../src/lib/cms/current.ts";
import {
  alternateCataloguePath,
  isPublicItem,
  itemById,
  itemDuration,
  itemHref,
  priceLabel,
  pricingOf,
  publicItems,
  publicSections,
  resolveCatalogue,
} from "../src/lib/catalogue/index.ts";
import { BUILTIN_ITEMS } from "../src/lib/catalogue/builtin.ts";
import { RESERVED_ROOTS, slugError, slugify, validateParts, validatePricing } from "../src/lib/catalogue/validate.ts";
import { itemCopy } from "../src/content/copy/index.ts";
import { createManual } from "../src/lib/booking/service.ts";
import { quoteByToken, respondQuote, sendQuote } from "../src/lib/booking/quotes.ts";
import { seedTreatments } from "../src/lib/db/seed.ts";
import { appointments, outbox, packageItems, serviceSections, treatments, weeklyHours } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

const words = { from: "vanaf", onRequest: "Op aanvraag" };

function withSnapshot(s: Partial<Snapshot>) {
  const snap: Snapshot = { ...EMPTY_SNAPSHOT, ...s };
  setSnapshotResolver(() => snap);
  return snap;
}

function row(id: string, o: Partial<TreatmentLive> = {}): TreatmentLive {
  const b = BUILTIN_ITEMS.find((x) => x.id === id)!;
  return {
    id,
    priceCents: null,
    priceFrom: false,
    durationMinutes: null,
    active: true,
    visible: true,
    featured: false,
    bookableOnline: false,
    nameNl: b?.name.nl ?? id,
    nameEn: b?.name.en ?? id,
    descriptionNl: "",
    descriptionEn: "",
    mediaId: null,
    category: b?.groupId ?? b?.sectionId ?? "waxing",
    sort: 0,
    bufferMinutes: 0,
    status: b?.status ?? "draft",
    ...o,
  };
}

const section = (id: string, status: string) => {
  const map: Record<string, [string, string, string]> = { facial: ["gezichtsbehandelingen", "facial-treatments", "treatments"], packages: ["pakketten", "packages", "packages"] };
  const [nl, en, kind] = map[id];
  return { id, kind, slugNl: nl, slugEn: en, nameNl: id, nameEn: id, status, mediaId: null, sort: 1 };
};

after(() => setSnapshotResolver(() => null));

// ───────────────────────────────────────────────────────── pure

test("without a database the site shows massage and the 13 waxing treatments; the other new entries are drafts", () => {
  withSnapshot({});
  assert.deepEqual(publicSections().map((s) => s.id), ["massage", "waxing"]);
  assert.equal(publicItems().length, 14);
  const m = itemById("massage-relaxation")!;
  assert.equal(isPublicItem(m), true);
  assert.equal(m.pricing.mode, "on_request", "massage has no invented price");
  assert.equal(m.durationMinutes, null, "massage has no invented duration");
  for (const id of ["facial-manual-cleansing", "facial-brush-cleansing", "facial-exfoliation", "facial-mask", "facial-complete", "body-wrap", "pkg-glow-face-trio", "pkg-smooth-essentials", "pkg-glow-complete", "pkg-bikini-smooth"]) {
    const i = itemById(id)!;
    assert.equal(i.status, "draft", id);
    assert.equal(isPublicItem(i), false, id);
    assert.equal(i.pricing.mode, "on_request", `${id} has no invented price`);
    assert.equal(i.durationMinutes, null, `${id} has no invented duration`);
  }
  assert.equal(resolveCatalogue("nl", ["gezichtsbehandelingen"]), null);
  assert.equal(resolveCatalogue("nl", ["pakketten", "glow-face-trio"]), null);
  assert.equal(resolveCatalogue("nl", ["waxbehandelingen", "gezicht", "wenkbrauwen-waxen"])?.type, "item");
});

test("an item is public only when it, its section and (for packages) every part are published", () => {
  withSnapshot({
    catalogue: { sections: [section("facial", "draft"), section("packages", "published")], groups: [], parts: [] },
    treatments: new Map([
      ["facial-exfoliation", row("facial-exfoliation", { status: "published" })],
      ["pkg-glow-face-trio", row("pkg-glow-face-trio", { status: "published", kind: "package" })],
    ]),
  });
  assert.equal(isPublicItem(itemById("facial-exfoliation")!), false, "section still draft");
  assert.equal(isPublicItem(itemById("pkg-glow-face-trio")!), false, "parts are not public");

  withSnapshot({
    catalogue: { sections: [section("facial", "published"), section("packages", "published")], groups: [], parts: [] },
    treatments: new Map(
      ["facial-manual-cleansing", "facial-exfoliation", "facial-mask"].map((id) => [id, row(id, { status: "published", priceCents: 4500, durationMinutes: 45, pricingMode: "fixed" })] as const).concat([["pkg-glow-face-trio", row("pkg-glow-face-trio", { status: "published", kind: "package" })]]),
    ),
  });
  const pkg = itemById("pkg-glow-face-trio")!;
  assert.equal(isPublicItem(pkg), true);
  assert.equal(itemDuration(pkg), 135, "package duration is the sum of its parts");
  assert.equal(itemHref("nl", pkg), "/pakketten/glow-face-trio");
  assert.equal(itemHref("en", itemById("facial-exfoliation")!), "/en/facial-treatments/facial-exfoliation");
  assert.equal(resolveCatalogue("nl", ["gezichtsbehandelingen", "gezichtspeeling"])?.type, "item");
  assert.equal(alternateCataloguePath("/gezichtsbehandelingen/gezichtspeeling", "en"), "/en/facial-treatments/facial-exfoliation");
  assert.deepEqual(publicSections().map((s) => s.id), ["massage", "waxing", "facial", "packages"]);
});

test("archived or hidden items disappear, owner-created items resolve by their own slugs", () => {
  withSnapshot({
    catalogue: { sections: [section("facial", "published")], groups: [], parts: [] },
    treatments: new Map([
      ["eyebrows", row("eyebrows", { status: "archived", active: false })],
      ["facial-led", row("facial-led", { status: "published", sectionId: "facial", slugNl: "led-masker", slugEn: "led-mask", nameNl: "LED-masker", nameEn: "LED mask", priceCents: 3000, pricingMode: "fixed" })],
    ]),
  });
  assert.equal(publicItems().some((i) => i.id === "eyebrows"), false);
  assert.equal(resolveCatalogue("nl", ["waxbehandelingen", "gezicht", "wenkbrauwen-waxen"]), null);
  const r = resolveCatalogue("en", ["facial-treatments", "led-mask"]);
  assert.equal(r?.type === "item" && r.item.id, "facial-led");
  // Owner-created items get generated default copy (no built-in texts needed).
  const c = itemCopy("nl", "facial-led", itemById("facial-led")!);
  assert.equal(c.title, "LED-masker");
  assert.deepEqual(c.faqs, [], "blank template entries are not rendered");
});

test("prices: never € 0, 'from' prefix, on-request label", () => {
  assert.deepEqual(pricingOf({ priceCents: null, priceFrom: false }), { mode: "on_request", cents: null });
  assert.deepEqual(pricingOf({ priceCents: 0, priceFrom: false, pricingMode: "fixed" }), { mode: "on_request", cents: null });
  assert.deepEqual(pricingOf({ priceCents: 4500, priceFrom: true }), { mode: "from", cents: 4500 });
  withSnapshot({});
  const i = { ...itemById("eyebrows")! };
  assert.equal(priceLabel(i, "nl", words), "Op aanvraag");
  assert.equal(priceLabel({ ...i, pricing: { mode: "from", cents: 2500 } }, "nl", words).replace(/\s/g, " "), "vanaf € 25");
  assert.equal(priceLabel({ ...i, pricing: { mode: "fixed", cents: 4250 } }, "en", words), "€42.50");
});

test("admin validation: slugs, reserved paths, pricing and package contents", () => {
  assert.equal(slugify("Wimpers & Wenkbrauwen"), "wimpers-en-wenkbrauwen");
  assert.equal(slugify("Gezichtsbehandeling Één"), "gezichtsbehandeling-een");
  for (const r of ["prijzen", "contact", "admin", "agenda", "login", "waxbehandelingen", "behandelingen", "offerte"]) assert.ok(RESERVED_ROOTS.has(r), r);
  assert.match(slugError("prijzen", { root: true })!, /vaste pagina/);
  assert.match(slugError("Hoofdletters")!, /kleine letters/);
  assert.match(slugError("peeling", { taken: ["peeling"] })!, /al in gebruik/);
  assert.equal(slugError("led-masker", { root: true }), null);

  assert.equal(validatePricing({ mode: "fixed", price: "", duration: "", buffer: "", vat: "standard" }).ok, false);
  assert.equal(validatePricing({ mode: "fixed", price: "0", duration: "", buffer: "", vat: "standard" }).ok, false);
  const ok = validatePricing({ mode: "from", price: "42,50", duration: "45", buffer: "10", vat: "reduced" });
  assert.ok(ok.ok && ok.value.priceCents === 4250 && ok.value.priceFrom && ok.value.vatCategory === "reduced");
  const req = validatePricing({ mode: "on_request", price: "99", duration: "", buffer: "", vat: "x" });
  assert.ok(req.ok && req.value.priceCents === null && req.value.vatCategory === "standard");
  assert.equal(validatePricing({ mode: "fixed", price: "40", duration: "3", buffer: "", vat: "standard" }).ok, false);

  const ids = ["a", "b", "c"];
  assert.match(validateParts([{ treatmentId: "a", quantity: 1 }], ids)!, /minimaal twee/);
  assert.match(validateParts([{ treatmentId: "a", quantity: 1 }, { treatmentId: "a", quantity: 1 }], ids)!, /één keer/);
  assert.match(validateParts([{ treatmentId: "a", quantity: 1 }, { treatmentId: "z", quantity: 1 }], ids)!, /bestaat niet/);
  assert.equal(validateParts([{ treatmentId: "a", quantity: 2 }, { treatmentId: "b", quantity: 1 }], ids), null);
});

// ───────────────────────────────────────────────────────── database

describe("catalogue seed and price proposals (database)", { skip: skipDb }, () => {
  let db: Awaited<ReturnType<typeof resetDb>>;
  beforeEach(async () => {
    db = await resetDb();
    setSnapshotResolver(() => null);
  });
  after(closeDb);

  test("seeding adds sections and drafts once and never overwrites the owner's edits", async () => {
    await seedTreatments(db);
    await db.update(treatments).set({ priceCents: 5500, status: "published" }).where(eq(treatments.id, "facial-mask"));
    await seedTreatments(db);
    const rows = await db.select().from(treatments);
    assert.equal(rows.length, BUILTIN_ITEMS.length);
    const mask = rows.find((r) => r.id === "facial-mask")!;
    assert.equal(mask.priceCents, 5500);
    assert.equal(mask.status, "published");
    assert.equal(rows.find((r) => r.id === "body-wrap")!.status, "draft");
    assert.equal((await db.select().from(serviceSections)).length, 5);
    assert.equal((await db.select().from(packageItems).where(eq(packageItems.packageId, "pkg-glow-face-trio"))).length, 3);
  });

  test("price proposal: email with personal link, single-use acceptance sets the agreed price", async () => {
    await seedTreatments(db);
    await db.insert(weeklyHours).values([1, 2, 3, 4, 5].map((weekday) => ({ weekday, kind: "open", startMinute: 540, endMinute: 1020 })));
    const id = await createManual(db, { firstName: "Noor", lastName: "Jansen", email: "noor@example.com", phone: null, treatmentIds: ["facial-complete"], day: "2027-03-02", minute: 600, durationMinutes: 60 }, { userId: 1, ownerEmail: "" });
    const [a0] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a0.priceCents, null, "on-request treatment has no snapshot price");

    const { token } = await sendQuote(db, id, { amountCents: 6500, message: "Inclusief masker", validDays: 7 }, { userId: 1 });
    const mail = (await db.select().from(outbox)).find((m) => m.kind === "price_proposal")!;
    assert.ok(mail.textBody.includes("€ 65,00"));
    assert.ok(mail.textBody.includes(`/offerte/${token}`));
    assert.ok(!(await db.select().from(outbox)).some((m) => m.textBody.includes(token) && m.kind !== "price_proposal"));

    const view = await quoteByToken(db, token);
    assert.equal(view?.status, "sent");
    assert.equal(view?.firstName, "Noor");
    assert.equal(await quoteByToken(db, "x".repeat(43)), null);

    await respondQuote(db, token, true, "iphash", "owner@example.com");
    const [a1] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a1.priceCents, 6500);
    const kinds = (await db.select().from(outbox)).map((m) => m.kind);
    assert.ok(kinds.includes("price_accepted") && kinds.includes("owner_quote"));
    await assert.rejects(respondQuote(db, token, false, null), /accepted/);

    // A new proposal replaces the open one; expired proposals cannot be accepted.
    const q2 = await sendQuote(db, id, { amountCents: 7000, validDays: 1 }, { userId: 1, now: new Date(Date.now() - 3 * 86_400_000) });
    assert.equal((await quoteByToken(db, q2.token))?.status, "expired");
    await assert.rejects(respondQuote(db, q2.token, true, null), /expired/);
  });
});
