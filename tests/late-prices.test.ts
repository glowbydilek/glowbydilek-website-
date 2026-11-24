import assert from "node:assert/strict";
import { test } from "node:test";
import { BUILTIN_ITEMS, LATE_PRICES } from "@/lib/catalogue/builtin";

test("owner price list (24 Nov 2026) refers to existing treatments with sane values", () => {
  const ids = new Set<string>();
  for (const p of LATE_PRICES) {
    assert.ok(BUILTIN_ITEMS.some((i) => i.id === p.id), `unknown treatment ${p.id}`);
    assert.ok(!ids.has(p.id), `duplicate ${p.id}`);
    ids.add(p.id);
    assert.ok(Number.isInteger(p.cents) && p.cents > 0 && p.cents < 50000, `${p.id} price`);
    assert.ok(Number.isInteger(p.minutes) && p.minutes >= 5 && p.minutes <= 240, `${p.id} duration`);
  }
  assert.equal(LATE_PRICES.find((p) => p.id === "hollywood")?.cents, 5000);
  assert.equal(LATE_PRICES.find((p) => p.id === "brazilian"), undefined, "Brazilian is no longer offered");
  assert.equal(LATE_PRICES.find((p) => p.id === "eyebrows")?.cents, 1750);
});

test("new waxing zones from the price list are published with price, duration and copy in three languages", async () => {
  const { itemCopy } = await import("@/content/copy");
  for (const id of ["cheeks-jaw", "neck", "upper-arms", "upper-legs", "belly", "chest", "decollete", "buttocks"]) {
    const it = BUILTIN_ITEMS.find((i) => i.id === id)!;
    assert.ok(it, id);
    assert.equal(it.status, "published", id);
    assert.equal(it.sectionId, "waxing", id);
    assert.ok(it.pricing.mode === "fixed" && (it.pricing.cents ?? 0) > 0, `${id} price`);
    assert.ok((it.durationMinutes ?? 0) > 0, `${id} duration`);
    for (const l of ["nl", "en", "tr"] as const) {
      assert.ok(it.name[l] && it.slug[l], `${id} ${l} name/slug`);
      const c = itemCopy(l, id, it);
      assert.ok(c.seoTitle.length <= 60 && c.seoDescription.length >= 70 && c.seoDescription.length <= 175, `${id} ${l} meta`);
      assert.ok(c.faqs.length >= 2 && c.know.length >= 3 && c.aftercare.length >= 3, `${id} ${l} copy`);
    }
  }
  assert.equal(BUILTIN_ITEMS.find((i) => i.id === "facial-steam")?.status, "archived");
});
