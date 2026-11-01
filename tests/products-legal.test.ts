import assert from "node:assert/strict";
import { test } from "node:test";
import { movementDelta, parseSteps, stockFlags } from "../src/lib/products/core.ts";
import { parseCertificateLines, parseProfile, SENSITIVE_CLAIMS } from "../src/lib/profile.ts";
import { DEFAULT_LEGAL_STATUS, hasPlaceholder, LEGAL_KEYS } from "../src/lib/legal.ts";
import { legalNl } from "../src/content/copy/legal.nl.ts";
import { legalEn } from "../src/content/copy/legal.en.ts";

test("stock movements are signed by reason; flags for low, out, expired and expiring stock", () => {
  assert.equal(movementDelta("purchase", -5), 5);
  assert.equal(movementDelta("used", 2), -2);
  assert.equal(movementDelta("expired", 3), -3);
  assert.equal(movementDelta("correction", -4), -4);
  assert.equal(movementDelta("used", 0), 0);
  const p = { stockQty: 2, reorderLevel: 2, expiresOn: "2026-11-20", status: "active" };
  assert.deepEqual(stockFlags(p, "2026-11-01"), ["low", "expiring"]);
  assert.deepEqual(stockFlags({ ...p, stockQty: 0, expiresOn: "2026-10-01" }, "2026-11-01"), ["out", "expired"]);
  assert.deepEqual(stockFlags({ ...p, status: "archived" }, "2026-11-01"), []);
});

test("protocol steps are sanitised", () => {
  const s = parseSteps([{ title: " Reinigen ", body: "x", productIds: [1, "2", 3.5] }, { title: "" }, "bad"]);
  assert.deepEqual(s, [{ title: "Reinigen", body: "x", productIds: [1] }]);
});

test("profile: nothing is shown unless published; certificates parse from lines; sensitive claims are detected", () => {
  assert.equal(parseProfile(undefined).published, false);
  assert.equal(parseProfile({ published: "yes" }).published, false);
  assert.deepEqual(parseCertificateLines("Waxen gevorderd — Academie X — 2024\n\nHygiëne"), [
    { name: "Waxen gevorderd", issuer: "Academie X", year: "2024" },
    { name: "Hygiëne", issuer: "", year: "" },
  ]);
  for (const t of ["BIG-registratie", "fysiotherapeut", "btw-vrij"]) assert.ok(SENSITIVE_CLAIMS.test(t), t);
  assert.ok(!SENSITIVE_CLAIMS.test("MBO niveau 3 schoonheidsverzorging"));
});

test("legal pages: only the factual cookie policy is online by default; drafts carry placeholders in both languages", () => {
  assert.deepEqual(DEFAULT_LEGAL_STATUS, { cookies: true, terms: false, cancellation: false, reviews: false });
  assert.equal(hasPlaceholder(legalNl.cookies) || hasPlaceholder(legalEn.cookies), false);
  for (const k of LEGAL_KEYS.filter((x) => x !== "cookies")) {
    assert.ok(hasPlaceholder(legalNl[k]) && hasPlaceholder(legalEn[k]), k);
    assert.equal(legalNl[k].sections.length, legalEn[k].sections.length, k);
  }
  // No invented fees or periods in the defaults.
  assert.doesNotMatch(JSON.stringify(legalNl.cancellation), /€|\d+\s*uur/);
});
