import assert from "node:assert/strict";
import { test } from "node:test";
import { allPages, alternatePath, bookingHref, categoryHref, href, locales, matchPage, pagePath, routes, treatmentHref } from "@/i18n/config";
import { bookingParam, categoryIds, relatedTreatments, treatmentIds, treatmentSlugs } from "@/content/slugs";
import { allTreatments, treatmentGroups } from "@/content/treatments";
import sitemap from "@/app/sitemap";

test("every page has a unique path per language", () => {
  const seen = new Set<string>();
  for (const page of allPages()) {
    for (const l of locales) {
      const p = pagePath(l, page);
      assert.ok(!seen.has(p), `duplicate path ${p}`);
      seen.add(p);
      if (l === "en") assert.ok(p === "/en" || p.startsWith("/en/"), `EN path ${p}`);
      else assert.ok(!p.startsWith("/en"), `NL path ${p}`);
      assert.match(p, /^\/[a-z0-9/-]*$/, `clean slug ${p}`);
    }
  }
  // static pages + categories + treatments, in two languages
  assert.equal(seen.size, (12 + 3 + 13) * 2); // 12 static (incl. reviews) + 3 categories + 13 treatments
});

test("category routes match the agreed URLs", () => {
  assert.deepEqual(
    categoryIds.map((id) => categoryHref("nl", id)),
    ["/waxbehandelingen/gezicht", "/waxbehandelingen/lichaam", "/waxbehandelingen/bikini-intiem"],
  );
  assert.deepEqual(
    categoryIds.map((id) => categoryHref("en", id)),
    ["/en/waxing-treatments/face", "/en/waxing-treatments/body", "/en/waxing-treatments/bikini-intimate"],
  );
});

test("13 treatment pages per language, nested under their category", () => {
  assert.equal(treatmentIds.length, 13);
  for (const id of treatmentIds) {
    const cat = treatmentSlugs[id].category;
    for (const l of locales) {
      assert.ok(treatmentHref(l, id).startsWith(categoryHref(l, cat) + "/"), id);
    }
  }
  assert.equal(treatmentHref("nl", "brazilian"), "/waxbehandelingen/bikini-intiem/brazilian-wax");
  assert.equal(treatmentHref("en", "eyebrows"), "/en/waxing-treatments/face/eyebrow-waxing");
});

test("catalogue and slug registry describe the same treatments", () => {
  assert.deepEqual(allTreatments().map((t) => t.id).sort(), [...treatmentIds].sort());
  for (const g of treatmentGroups) for (const t of g.treatments) assert.equal(treatmentSlugs[t.id].category, g.id);
  for (const id of treatmentIds) {
    assert.equal(relatedTreatments[id].length, 3);
    assert.ok(!relatedTreatments[id].includes(id), `${id} relates to itself`);
  }
});

test("language switch lands on the equivalent page for every page", () => {
  for (const page of allPages()) {
    const nl = pagePath("nl", page);
    const en = pagePath("en", page);
    assert.equal(alternatePath(nl, "en"), en);
    assert.equal(alternatePath(en, "nl"), nl);
    assert.equal(alternatePath(`${nl}/`, "en"), en, "trailing slash");
    assert.deepEqual(matchPage(en)?.page, page);
  }
  assert.equal(alternatePath("/does-not-exist", "en"), "/en");
  assert.equal(alternatePath("/afspraak-maken?behandeling=brazilian", "en"), "/en/book-appointment");
});

test("booking links preselect the treatment and never carry a hash (page opens at the top)", () => {
  for (const id of treatmentIds) {
    assert.equal(bookingHref("nl", id), `/afspraak-maken?${bookingParam.nl}=${id}`);
    assert.equal(bookingHref("en", id), `/en/book-appointment?${bookingParam.en}=${id}`);
  }
  assert.equal(bookingHref("nl"), "/afspraak-maken");
});

test("educational pages exist in both languages", () => {
  assert.equal(href("nl", "preparation"), "/voorbereiding");
  assert.equal(href("nl", "aftercare"), "/nazorg");
  assert.equal(href("nl", "faq"), "/veelgestelde-vragen");
  assert.equal(href("nl", "process"), "/hoe-werkt-een-afspraak");
  assert.equal(routes.process.en, "/en/appointment-process");
});

test("sitemap lists every page in both languages with hreflang alternates", async () => {
  const entries = await sitemap();
  assert.equal(entries.length, allPages().length * 2);
  for (const e of entries) {
    assert.ok(e.url.startsWith("https://"), e.url);
    const langs = e.alternates?.languages as Record<string, string>;
    assert.ok(langs["nl-NL"] && langs.en, `alternates for ${e.url}`);
  }
});
