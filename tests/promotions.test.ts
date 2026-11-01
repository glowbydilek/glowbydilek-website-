import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { choosePromotion, discountFor, isRunning, lowestPrice30, normalizeCode, validatePromotion, type Promotion } from "../src/lib/promotions/core.ts";
import { parseEuroToCents } from "../src/lib/finance/money.ts";
import { localToUtc } from "../src/lib/time.ts";
import { createManual } from "../src/lib/booking/service.ts";
import { applyPromotion, checkCode, removePromotion } from "../src/lib/promotions/service.ts";
import { seedTreatments } from "../src/lib/db/seed.ts";
import { appointments, promotionRedemptions, promotions, treatments, weeklyHours } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

const base: Promotion = { id: 1, nameNl: "x", nameEn: "x", kind: "percent", value: 1500, scope: "all", scopeIds: [], code: null, startsAt: null, endsAt: null, maxUses: null, usedCount: 0, minSpendCents: null, status: "active", showPublic: false, noteNl: null, noteEn: null };
const lines = [
  { itemId: "eyebrows", sectionId: "waxing", cents: 2500 },
  { itemId: "facial-mask", sectionId: "facial", cents: 4000 },
];

test("discounts: percentage rounds half-up on cents, fixed never exceeds the price, scope is respected", () => {
  assert.equal(discountFor(base, lines), 975); // 15% of 65,00
  assert.equal(discountFor({ ...base, value: 1250 }, [{ itemId: "a", sectionId: "s", cents: 4500 }]), 563); // 562,5 → 563
  assert.equal(discountFor({ ...base, kind: "fixed", value: 10_000 }, lines), 6500);
  assert.equal(discountFor({ ...base, scope: "section", scopeIds: ["facial"] }, lines), 600);
  assert.equal(discountFor({ ...base, scope: "items", scopeIds: ["eyebrows"] }, lines), 375);
  assert.equal(discountFor({ ...base, minSpendCents: 10_000 }, lines), 0);
  assert.equal(discountFor(base, [{ itemId: "x", sectionId: "s", cents: 0 }]), 0, "no discount on 'price on request'");
});

test("one promotion per appointment: the best valid one; code promotions only with the code", () => {
  const auto = { ...base, id: 1, value: 1000 };
  const coded = { ...base, id: 2, value: 2500, code: "LENTE25" };
  assert.equal(choosePromotion([auto, coded], lines, null)?.promotion.id, 1);
  assert.equal(choosePromotion([auto, coded], lines, " lente25 ")?.promotion.id, 2);
  assert.equal(choosePromotion([auto, coded], lines, "WRONG")?.promotion.id, 1);
  assert.equal(choosePromotion([coded], lines, null), null);
  assert.equal(normalizeCode(" ab c "), "ABC");
});

test("running window, status and usage limit", () => {
  const now = new Date("2027-03-10T12:00:00Z");
  assert.equal(isRunning({ ...base, status: "draft" }, now), false);
  assert.equal(isRunning({ ...base, startsAt: new Date("2027-03-11T00:00:00Z") }, now), false);
  assert.equal(isRunning({ ...base, endsAt: new Date("2027-03-09T23:59:59Z") }, now), false);
  assert.equal(isRunning({ ...base, maxUses: 3, usedCount: 3 }, now), false);
  assert.equal(isRunning({ ...base, maxUses: 3, usedCount: 2 }, now), true);
});

test("honest reference price: lowest price of the past 30 days, only when history covers the period", () => {
  const now = new Date("2027-03-31T12:00:00Z");
  const d = (s: string) => new Date(s);
  assert.equal(lowestPrice30([], 4500, now), null, "no history → no 'was' price");
  assert.equal(lowestPrice30([{ createdAt: d("2027-03-20T00:00:00Z"), priceCents: 4500, pricingMode: "fixed" }], 4500, now), null, "price set within the window");
  const h = [
    { createdAt: d("2027-01-01T00:00:00Z"), priceCents: 5000, pricingMode: "fixed" },
    { createdAt: d("2027-03-15T00:00:00Z"), priceCents: 3500, pricingMode: "fixed" },
    { createdAt: d("2027-03-25T00:00:00Z"), priceCents: 4500, pricingMode: "fixed" },
  ];
  assert.equal(lowestPrice30(h, 4500, now), 3500, "a recent temporary low price is the reference");
});

test("admin validation of a promotion", () => {
  const ds = (d: string) => localToUtc(d, 0);
  const de = (d: string) => localToUtc(d, 1439);
  const ok = validatePromotion({ nameNl: "Lente", nameEn: "", kind: "percent", value: "15", scope: "all", scopeIds: [], code: "lente15", startsAt: "2027-04-01", endsAt: "2027-04-30", maxUses: "20", minSpend: "", status: "active", showPublic: true, noteNl: "", noteEn: "" }, parseEuroToCents, ds, de);
  assert.ok(ok.ok && ok.value.value === 1500 && ok.value.code === "LENTE15" && ok.value.nameEn === "Lente");
  const bad = (o: object) => validatePromotion({ nameNl: "x", nameEn: "", kind: "percent", value: "10", scope: "all", scopeIds: [], code: "", startsAt: "", endsAt: "", maxUses: "", minSpend: "", status: "draft", showPublic: false, noteNl: "", noteEn: "", ...o }, parseEuroToCents, ds, de);
  assert.equal(bad({ value: "95" }).ok, false);
  assert.equal(bad({ kind: "fixed", value: "0" }).ok, false);
  assert.equal(bad({ scope: "items" }).ok, false);
  assert.equal(bad({ code: "a b!" }).ok, false);
  assert.equal(bad({ startsAt: "2027-05-01", endsAt: "2027-04-01" }).ok, false);
  assert.equal(bad({ status: "anything" }).ok && bad({ status: "anything" }).ok === true, true, "unknown status falls back to draft");
});

describe("promotions on appointments (database)", { skip: skipDb }, () => {
  let db: Awaited<ReturnType<typeof resetDb>>;
  beforeEach(async () => {
    db = await resetDb();
    await seedTreatments(db);
    await db.update(treatments).set({ priceCents: 4500, pricingMode: "fixed", durationMinutes: 45 }).where(eq(treatments.id, "brazilian"));
    await db.insert(weeklyHours).values([1, 2, 3, 4, 5].map((weekday) => ({ weekday, kind: "open", startMinute: 540, endMinute: 1020 })));
  });
  after(closeDb);

  const book = (n: number) =>
    createManual(db, { firstName: "Lot", lastName: `K${n}`, email: `lot${n}@example.com`, phone: null, treatmentIds: ["brazilian"], day: "2027-03-02", minute: 540 + n * 60 }, { userId: 1, ownerEmail: "" });

  test("code promotion applies once per appointment, honours its limit, and can be removed", async () => {
    await db.insert(promotions).values({ nameNl: "Lente", nameEn: "Spring", kind: "percent", value: 2000, scope: "all", code: "LENTE20", maxUses: 1, status: "active" });
    assert.equal(await checkCode(db, "lente20"), null);
    assert.equal(await checkCode(db, "NOPE"), "invalid");
    const a = await book(1);
    const r = await applyPromotion(db, a, "LENTE20");
    assert.deepEqual(r && { d: r.discountCents, p: r.priceCents }, { d: 900, p: 3600 });
    assert.equal(await applyPromotion(db, a, "LENTE20"), null, "never twice on one appointment");
    const b = await book(2);
    assert.equal(await applyPromotion(db, b, "LENTE20"), null, "limit reached");
    const [row] = await db.select().from(appointments).where(eq(appointments.id, a));
    assert.equal(row.priceCents, 3600);
    assert.equal(row.discountCents, 900);
    await removePromotion(db, a);
    const [after1] = await db.select().from(appointments).where(eq(appointments.id, a));
    assert.equal(after1.priceCents, 4500);
    assert.equal(after1.promotionId, null);
    assert.equal((await db.select().from(promotionRedemptions)).length, 0);
    assert.equal((await db.select().from(promotions))[0].usedCount, 0);
  });

  test("a draft or expired promotion is never applied", async () => {
    await db.insert(promotions).values([
      { nameNl: "Concept", nameEn: "Draft", kind: "percent", value: 5000, scope: "all", status: "draft" },
      { nameNl: "Oud", nameEn: "Old", kind: "percent", value: 5000, scope: "all", status: "active", endsAt: new Date(Date.now() - 86_400_000) },
    ]);
    const a = await book(3);
    assert.equal(await applyPromotion(db, a, null), null);
  });
});
