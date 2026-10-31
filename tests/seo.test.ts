import assert from "node:assert/strict";
import { test } from "node:test";
import type { Metadata } from "next";
import { allPages, locales, pagePath, type Locale, type PageRef } from "@/i18n/config";
import { businessJsonLd, categoryMetadata, pageMetadata, treatmentMetadata } from "@/lib/seo";

function meta(locale: Locale, page: PageRef): Metadata {
  if (page.type === "static") return pageMetadata(locale, page.key);
  if (page.type === "category") return categoryMetadata(locale, page.id);
  return treatmentMetadata(locale, page.id);
}

const titleOf = (m: Metadata) => (typeof m.title === "string" ? m.title : (m.title as { absolute: string }).absolute);

test("canonical and hreflang are correct on every page", () => {
  for (const page of allPages()) {
    for (const l of locales) {
      const m = meta(l, page);
      assert.equal(m.alternates?.canonical, pagePath(l, page));
      const langs = m.alternates?.languages as Record<string, string>;
      assert.equal(langs["nl-NL"], pagePath("nl", page));
      assert.equal(langs.en, pagePath("en", page));
      assert.equal(langs["x-default"], pagePath("nl", page));
    }
  }
});

test("titles and descriptions are unique and well-sized per language", () => {
  for (const l of locales) {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const page of allPages()) {
      const m = meta(l, page);
      const title = titleOf(m);
      const d = String(m.description);
      assert.ok(!titles.has(title), `duplicate title (${l}): ${title}`);
      assert.ok(!descriptions.has(d), `duplicate description (${l}): ${d}`);
      titles.add(title);
      descriptions.add(d);
      assert.ok(title.length >= 3 && title.length <= 60, `title length (${l}) ${title}`);
      assert.ok(d.length >= 70 && d.length <= 175, `description length ${d.length} (${l}): ${d}`);
    }
  }
});

test("structured data never publishes an address, area or location", () => {
  for (const l of locales) {
    const json = JSON.stringify(businessJsonLd(l));
    for (const key of ["address", "geo", "areaServed", "hasMap", "latitude", "PostalAddress"]) {
      assert.ok(!json.includes(key), `${key} in business JSON-LD`);
    }
  }
});
