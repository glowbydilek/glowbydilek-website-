import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { categoryCopy, faqPageCopy, guideCopy, treatmentCopy } from "@/content/copy";
import { categoryIds, treatmentIds } from "@/content/slugs";
import { getDictionary } from "@/i18n/dictionaries";

const ROOT = new URL("..", import.meta.url).pathname;

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(tsx?|mjs|json|md|txt|webmanifest)$/.test(name)) out.push(p);
  }
  return out;
}

/** Any public wording that would reveal a home-based location. */
const FORBIDDEN = [
  /vanuit\s+huis/i,
  /thuisstudio/i,
  /aan\s+huis/i,
  /\bthuis\b/i,
  /\bwoonhuis\b/i,
  /home[-\s]?based/i,
  /home\s+studio/i,
  /home\s+treatment/i,
  /from\s+home/i,
  /\bat\s+home\b/i,
  /\bwaiting room\b/i,
  /\bwachtkamer\b/i,
];

test("no public source mentions a home-based location", () => {
  const scanned = [...files(join(ROOT, "src")), ...files(join(ROOT, "public"))];
  for (const f of scanned) {
    const text = readFileSync(f, "utf8");
    for (const re of FORBIDDEN) assert.ok(!re.test(text), `${re} found in ${f.replace(ROOT, "")}`);
  }
});

test("the approved location sentence is used in both languages", () => {
  assert.equal(
    getDictionary("nl").common.location,
    "Behandelingen zijn uitsluitend op afspraak. Praktische locatiegegevens worden na bevestiging persoonlijk gedeeld.",
  );
  assert.equal(
    getDictionary("en").common.location,
    "Treatments are available by appointment only. Practical location details are shared personally after confirmation.",
  );
});

/** All visible copy of the service and guide pages, per language. */
function allCopy(l: "nl" | "en"): string {
  return JSON.stringify([
    categoryIds.map((id) => categoryCopy(l, id)),
    treatmentIds.map((id) => treatmentCopy(l, id)),
    (["process", "preparation", "aftercare"] as const).map((k) => guideCopy(l, k)),
    faqPageCopy(l),
    getDictionary(l),
  ]);
}

test("no invented prices, guarantees or pain-free claims", () => {
  for (const l of ["nl", "en"] as const) {
    const text = allCopy(l);
    assert.ok(!/€\s?\d|\d\s?euro/i.test(text), `price in ${l}`);
    assert.ok(!/pijnloos|pijnvrij|pain[-\s]?free|painless/i.test(text), `pain claim in ${l}`);
    assert.ok(!/gegarandeerd|garantie|guarantee/i.test(text), `guarantee in ${l}`);
    assert.ok(!/\b\d+\s?(min|minuten|minutes)\b/i.test(text), `duration in ${l}`);
    assert.ok(!/(postcode|straat|street|wijk|district)\b/i.test(text), `address hint in ${l}`);
  }
});

test("every treatment and category page has substantial, distinct copy", () => {
  for (const l of ["nl", "en"] as const) {
    const leads = new Set<string>();
    for (const id of treatmentIds) {
      const t = treatmentCopy(l, id);
      const words = JSON.stringify(t).split(/\s+/).length;
      assert.ok(words >= 250, `${id} (${l}) is thin: ${words} words`);
      assert.ok(t.faqs.length >= 2 && t.know.length >= 3 && t.aftercare.length >= 3, `${id} (${l}) sections`);
      assert.ok(!leads.has(t.lead), `duplicate lead ${id}`);
      leads.add(t.lead);
    }
    const intros = new Set(categoryIds.map((id) => categoryCopy(l, id).intro.paragraphs[0]));
    assert.equal(intros.size, categoryIds.length, `category intros duplicated (${l})`);
  }
});

test("English and Dutch copy have the same structure", () => {
  for (const id of treatmentIds) {
    const nl = treatmentCopy("nl", id);
    const en = treatmentCopy("en", id);
    for (const k of ["appointment", "know", "reactions", "aftercare", "faqs"] as const) {
      assert.equal(nl[k].length, en[k].length, `${id}.${k}`);
    }
  }
});
