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
  assert.equal(LATE_PRICES.find((p) => p.id === "brazilian")?.cents, 5000);
  assert.equal(LATE_PRICES.find((p) => p.id === "eyebrows")?.cents, 1750);
});
