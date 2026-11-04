// Run against a local production build (next start on :3123) with a TEST database. Never production.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const B = "http://localhost:3123";
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const hits = [];
  await c.route(/googletagmanager\.com|google-analytics\.com/, (r) => { hits.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body: "" }); });
  await c.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: "window.turnstile={render(e,o){setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){},remove(){}};" }));
  await c.addInitScript(() => localStorage.setItem("glow-consent-v2", JSON.stringify({ v: 2, analytics: true, marketing: false, at: new Date().toISOString(), policy: "2026-11-04" })));
  const p = await c.newPage();
  await p.goto(B + "/afspraak-maken?behandeling=brazilian", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const layer = () => p.evaluate(() => (window.dataLayer || []).filter((e) => e && e.event).map((e) => ({ ...e })));
  // With opening hours set, "Direct een tijd kiezen" is the default tab: switch to the request form.
  if (!(await p.locator("#appt-date").isVisible())) {
    const tab = p.getByRole("tab", { name: /Afspraak aanvragen/ });
    if (await tab.count()) await tab.click();
  }
  // The form sits below the fold and fades in on scroll, as for a real visitor.
  await p.evaluate(() => document.querySelector("#appt-date").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1000);
  await p.locator("#appt-date").click();
  await p.locator("[role=grid] button:not([disabled])").nth(8).click();
  await p.locator('input[name=timeRange][value=morning]').check({ force: true });
  let L = await layer();
  assert.equal(L.filter((e) => e.event === "booking_started").length, 1, "booking_started once on first interaction");
  assert.equal(L.filter((e) => e.event === "booking_submitted").length, 0, "no conversion before submitting");
  await p.fill("#appt-name", "E2E Boeking Test");
  await p.fill("#appt-email", "e2e-booking@example.invalid");
  await p.locator("#appt-privacy").check({ force: true });
  await p.waitForTimeout(6000);
  await p.getByRole("button", { name: "Verstuur aanvraag" }).click();
  await p.waitForTimeout(3000);
  L = await layer();
  const sub = L.filter((e) => e.event === "booking_submitted");
  assert.equal(sub.length, 1, "booking_submitted once after success: " + (await p.locator("[role=status],[role=alert]").allInnerTexts()).join("|").slice(0, 200));
  assert.ok(!JSON.stringify(L).includes("e2e-booking@") && !JSON.stringify(L).includes("Boeking Test"), "no personal data in the dataLayer");
  assert.equal(hits.filter((h) => /gtm\.js/.test(h)).length, 1);
  console.log(`✓ request form: booking_started ×1 (${JSON.stringify(L.find((e) => e.event === "booking_started"))}) → after successful submit booking_submitted ×1 (${JSON.stringify(sub[0])}); no name/e-mail in the dataLayer; GTM loaded once`);
  // a second, failed submission (rate limit / validation) must not count
  await b.close();
})().catch((e) => { console.error("✗", e.message.split("\n")[0]); process.exit(1); });
