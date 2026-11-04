// Run against a local production build (next start on :3123) with a TEST database. Never production.
// GTM integration test: order of Consent Mode vs gtm.js, one loader, events, token pages, noscript.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const B = "http://localhost:3123";
const stubTs = "window.turnstile={render(el,o){setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){},remove(){}};";
const out = (m) => console.log("✓ " + m);
(async () => {
  const b = await chromium.launch();
  const mk = async () => {
    const c = await b.newContext({ viewport: { width: 1280, height: 860 } });
    const hits = [];
    await c.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net/, (r) => { hits.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body: "" }); });
    await c.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stubTs }));
    return { c, hits };
  };
  const layer = (p) => p.evaluate(() => (window.dataLayer || []).map((e) => (e && typeof e.length === "number" && typeof e !== "string" ? { gtag: Array.from(e) } : e)));
  const accept = async (p) => { await p.locator(".consent-banner").getByRole("button", { name: "Alles accepteren" }).click(); await p.waitForTimeout(700); };

  // 1. Order + single loader + page views across client-side navigation.
  let { c, hits } = await mk();
  let p = await c.newPage();
  await p.goto(B + "/");
  assert.equal(await p.locator("noscript iframe").count(), 0, "no noscript GTM iframe");
  assert.equal(hits.length, 0);
  await accept(p);
  const visited = ["/"];
  for (const h of ["/waxbehandelingen", "/prijzen"]) { await p.evaluate((h) => document.querySelector(`a[href="${h}"]`).click(), h); await p.waitForURL(B + h); await p.waitForTimeout(800); visited.push(h); }
  let L = await layer(p);
  const idxDefault = L.findIndex((e) => e.gtag && e.gtag[0] === "consent" && e.gtag[1] === "default");
  const idxUpdate = L.findIndex((e) => e.gtag && e.gtag[0] === "consent" && e.gtag[1] === "update");
  const idxGtm = L.findIndex((e) => e.event === "gtm.js");
  assert.ok(idxDefault >= 0 && idxDefault < idxUpdate && idxUpdate < idxGtm, `order default(${idxDefault}) < update(${idxUpdate}) < gtm.js(${idxGtm})`);
  assert.equal(L[idxDefault].gtag[2].analytics_storage, "denied");
  assert.deepEqual(L[idxUpdate].gtag[2], { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  assert.equal(L.filter((e) => e.gtag && e.gtag[0] === "config").length, 0, "site itself never calls gtag config in GTM mode");
  const pvs = L.filter((e) => e.event === "glow_page_view").map((e) => e.page_path);
  assert.deepEqual(pvs, visited, "exactly one glow_page_view per page");
  const loaders = hits.filter((h) => /gtm\.js|gtag\/js/.test(h));
  assert.equal(loaders.length, 1); assert.match(loaders[0], /gtm\.js\?id=GTM-W9VRJF9X/);
  out(`Consent Mode order: default(denied) → update(analytics granted, ads denied) → gtm.js; 1 loader (gtm.js?id=GTM-W9VRJF9X), 0 gtag/js, 0 site-side config; glow_page_view: ${pvs.join(" → ")}`);

  // 2. Contact form: contact_submitted only after a successful submission.
  await p.goto(B + "/contact"); await p.waitForTimeout(600);
  await p.fill("#contact-name", "E2E Test"); await p.fill("#contact-email", "e2e-contact@example.invalid");
  await p.locator("#contact-topic").selectOption({ index: 1 });
  await p.fill("#contact-message", "Testbericht voor de GTM-test, geen echte vraag.");
  await p.locator("#contact-privacy").check();
  await p.waitForTimeout(6000); // the form refuses submissions faster than a human (anti-spam)
  await p.locator("form button[type=submit]").first().click();
  await p.waitForTimeout(2500);
  const status = (await p.locator("[role=status], [role=alert]").allInnerTexts()).join(" | ").slice(0, 160);
  L = await layer(p);
  if (!L.some((e) => e.event === "contact_submitted")) console.log("  form status:", status);
  const contact = L.filter((e) => e.event === "contact_submitted");
  assert.equal(contact.length, 1, "contact_submitted once after success");
  assert.ok(!JSON.stringify(L).includes("e2e-contact@"), "no e-mail in the dataLayer");
  out(`contact form sent → contact_submitted ×1 (params: ${JSON.stringify(contact[0])}); no e-mail/name in the dataLayer`);
  await c.close();

  // 3. Personal token page: GTM never starts there, even with stored consent.
  ({ c, hits } = await mk());
  await c.addInitScript(() => localStorage.setItem("glow-consent-v2", JSON.stringify({ v: 2, analytics: true, marketing: false, at: new Date().toISOString(), policy: "2026-11-04" })));
  p = await c.newPage();
  await p.goto(B + "/offerte/abcdefabcdefabcdefabcdefabcdef12");
  await p.waitForTimeout(1200);
  assert.equal(hits.length, 0, "no Google request on a token page");
  out("token page /offerte/<token> with stored consent: 0 Google requests, GTM not started");
  await p.goto(B + "/");
  await p.waitForTimeout(1000);
  assert.equal(hits.filter((h) => /gtm\.js/.test(h)).length, 1);
  out("returning visitor with consent on a normal page: GTM loads once without asking again");
  await b.close();
})().catch((e) => { console.error("✗", e.message.split("\n")[0]); process.exit(1); });
