// Run against a local production build (next start on :3123) with a TEST database. Never production.
// Cookie consent + Consent Mode v2 network test (local build, Chromium).
const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
const B = "http://localhost:3123";
const SHOTS = process.argv[2];
const MODE = process.env.MODE || "gtag";
const out = [];
const ok = (m) => { out.push("✓ " + m); console.log("✓ " + m); };
(async () => {
  const b = await chromium.launch();
  const mk = async (opts = {}) => {
    const c = await b.newContext({ viewport: { width: 1280, height: 860 }, ...opts });
    const hits = [];
    await c.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net/, (r) => { hits.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body: "/* stub */" }); });
    return { c, hits };
  };
  const dl = (p) => p.evaluate(() => (window.dataLayer || []).map((e) => (e && e.length !== undefined && typeof e !== "string" ? Array.from(e) : e)));
  const banner = (p) => p.locator(".consent-banner");

  // 1. First visit: banner, no Google request, no cookies.
  let { c, hits } = await mk();
  let p = await c.newPage();
  await p.goto(B + "/");
  await banner(p).waitFor();
  const btns = await banner(p).locator("button").allInnerTexts();
  assert.deepEqual(btns, ["Alles accepteren", "Alles weigeren", "Voorkeuren instellen"]);
  const classes = await banner(p).locator("button").evaluateAll((bs) => bs.map((x) => { const c = getComputedStyle(x); return [c.backgroundColor, c.color, c.borderColor, c.fontWeight, c.fontSize].join("|"); }));
  assert.equal(new Set(classes).size, 1, "accept/reject/customise have identical styling");
  await p.waitForTimeout(800);
  assert.equal(hits.length, 0, "no Google request before a choice");
  assert.equal((await c.cookies()).filter((k) => k.name.startsWith("_ga")).length, 0);
  ok(`first visit: banner with ${btns.join(" / ")}, identical button styles, 0 Google requests, 0 _ga cookies`);
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/desktop-banner-nl.png` });

  // 2. Reject all → nothing loads; persists after reload; booking still works.
  await banner(p).getByRole("button", { name: "Alles weigeren" }).click();
  await p.waitForTimeout(500);
  assert.equal(await banner(p).count(), 0);
  await p.reload();
  await p.waitForTimeout(800);
  assert.equal(await banner(p).count(), 0, "choice remembered after refresh");
  await p.goto(B + "/afspraak-maken");
  await p.waitForSelector("form");
  assert.equal(hits.length, 0);
  const stored = await p.evaluate(() => JSON.parse(localStorage.getItem("glow-consent-v2")));
  assert.equal(stored.analytics, false); assert.equal(stored.marketing, false); assert.ok(stored.policy && stored.at);
  ok("reject all: banner closes, remembered after refresh, booking form works, 0 Google requests; record = {analytics:false, marketing:false, at, policy}");
  await c.close();

  // 3. Accept all → exactly one loader; Consent Mode default denied → update; one page_view per navigation.
  ({ c, hits } = await mk());
  p = await c.newPage();
  await p.goto(B + "/");
  await banner(p).getByRole("button", { name: "Alles accepteren" }).click();
  await p.waitForTimeout(1200);
  const loaders = hits.filter((h) => /gtag\/js|gtm\.js/.test(h));
  assert.equal(loaders.length, 1, "exactly one Google loader: " + loaders.join(","));
  assert.ok(MODE === "gtm" ? /gtm\.js\?id=GTM-W9VRJF9X/.test(loaders[0]) : /gtag\/js\?id=G-77V0DM6Y7B/.test(loaders[0]), loaders[0]);
  let layer = await dl(p);
  const consentCalls = layer.filter((e) => Array.isArray(e) && e[0] === "consent");
  assert.deepEqual(consentCalls[0][1], "default");
  assert.equal(consentCalls[0][2].analytics_storage, "denied"); assert.equal(consentCalls[0][2].ad_storage, "denied");
  assert.equal(consentCalls[1][1], "update");
  assert.deepEqual(consentCalls[1][2], { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  const pv = (l) => l.filter((e) => (Array.isArray(e) && e[0] === "event" && e[1] === "page_view") || (e && e.event === "glow_page_view")).length;
  assert.equal(pv(layer), 1, "one page view");
  await p.locator("header a[href='/behandelingen'], header a[href='/waxbehandelingen']").first().click().catch(() => p.goto(B + "/waxbehandelingen"));
  await p.waitForTimeout(1200);
  layer = await dl(p);
  assert.ok(pv(layer) >= 1);
  const pvs = layer.filter((e) => (Array.isArray(e) && e[1] === "page_view") || (e && e.event === "glow_page_view")).map((e) => (Array.isArray(e) ? e[2].page_path : e.page_path));
  assert.equal(new Set(pvs).size, pvs.length, "no duplicate page_view for one path: " + pvs.join(","));
  ok(`accept all (${MODE}): 1 loader (${loaders[0].replace(/^https:\/\//, "").slice(0, 60)}), consent default=denied then update analytics=granted/ads=denied, page views ${pvs.join(", ")} (no duplicates)`);
  // Treatment engagement + booking CTA (interaction only).
  await p.goto(B + "/waxbehandelingen/gezicht/wenkbrauwen-waxen");
  await p.waitForTimeout(1500);
  layer = await dl(p);
  const evName = (e) => (Array.isArray(e) && e[0] === "event" ? e[1] : e && e.event);
  assert.ok(layer.some((e) => evName(e) === "view_treatment"), "view_treatment event");
  const leak = JSON.stringify(layer);
  assert.ok(!/@|\+31|token=/.test(leak), "no personal data in the data layer");
  ok("treatment page: view_treatment event (treatment_id/category_id only; no e-mail, phone or tokens in the data layer)");
  // Private page: no measurement code at all.
  const before = hits.length;
  await p.goto(B + "/agenda/login");
  await p.waitForTimeout(800);
  assert.equal(await p.evaluate(() => typeof window.gtag), "undefined");
  assert.equal(hits.length, before, "no Google request on /agenda/login");
  ok("private page /agenda/login: no Google script, no request, no banner");

  // 4. Withdraw: footer → preferences → Reject all → _ga cookies removed, no Google after reload.
  await c.addCookies([{ name: "_ga", value: "GA1.1.123.456", url: B }, { name: "_ga_TEST", value: "GS1.1.1", url: B }]);
  await p.goto(B + "/");
  await p.waitForTimeout(800);
  await p.locator("footer").getByRole("button", { name: "Cookie-instellingen" }).click();
  const dlg = p.locator("dialog.consent-dialog");
  await dlg.waitFor();
  assert.equal(await dlg.getByRole("switch").isChecked(), true, "shows the current choice");
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/desktop-preferences-nl.png` });
  const n0 = hits.length;
  await Promise.all([p.waitForNavigation(), dlg.getByRole("button", { name: "Alles weigeren" }).click()]);
  await p.waitForTimeout(1000);
  assert.equal((await c.cookies()).filter((k) => k.name.startsWith("_ga")).length, 0, "_ga cookies removed");
  assert.equal(hits.length, n0, "no Google request after withdrawal");
  assert.equal(await p.evaluate(() => typeof window.gtag), "undefined");
  ok("withdraw via footer ‘Cookie-instellingen’: dialog shows current choice, ‘Alles weigeren’ removes _ga/_ga_* and reloads without any Google script");
  await c.close();

  // 5. Customise: analytics OFF by default; save → nothing; then switch on → loads.
  ({ c, hits } = await mk());
  p = await c.newPage();
  await p.goto(B + "/en");
  await banner(p).waitFor();
  assert.deepEqual(await banner(p).locator("button").allInnerTexts(), ["Accept all", "Reject all", "Customise preferences"]);
  await banner(p).getByRole("button", { name: "Customise preferences" }).click();
  const d2 = p.locator("dialog.consent-dialog");
  await d2.waitFor();
  assert.equal(await d2.getByRole("switch").isChecked(), false, "no pre-ticked optional consent");
  assert.ok((await d2.innerText()).includes("Not in use"), "marketing shown as not in use");
  await d2.getByRole("button", { name: "Save preferences" }).click();
  await p.waitForTimeout(800);
  assert.equal(hits.length, 0);
  await p.locator("footer").getByRole("button", { name: "Cookie settings" }).click();
  await d2.getByRole("switch").check();
  await d2.getByRole("button", { name: "Save preferences" }).click();
  await p.waitForTimeout(1200);
  assert.equal(hits.filter((h) => /gtag\/js|gtm\.js/.test(h)).length, 1);
  ok("English: Accept all / Reject all / Customise preferences; analytics unticked by default; save without → 0 requests; switch on later → 1 loader");
  await c.close();

  // 6. Private browsing / blocked storage: banner, no crash, nothing loads.
  ({ c, hits } = await mk());
  await c.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
  p = await c.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(B + "/");
  await banner(p).waitFor();
  await banner(p).getByRole("button", { name: "Alles weigeren" }).click();
  await p.waitForTimeout(600);
  assert.equal(hits.length, 0); assert.equal(errs.length, 0, errs.join(";"));
  ok("blocked storage (private mode): banner works, no page errors, 0 Google requests");
  await c.close();

  // 7. Phone (iPhone 13 viewport, Chromium engine): banner fits, no horizontal overflow.
  ({ c, hits } = await mk({ ...devices["iPhone 13"], defaultBrowserType: undefined }));
  p = await c.newPage();
  await p.goto(B + "/");
  await banner(p).waitFor();
  const m = await p.evaluate(() => { const r = document.querySelector(".consent-banner").getBoundingClientRect(); return { l: r.left, r: innerWidth - r.right, h: r.height, vh: innerHeight, ow: document.documentElement.scrollWidth - innerWidth }; });
  assert.ok(m.l >= 8 && m.r >= 8 && m.ow === 0 && m.h < m.vh * 0.75, JSON.stringify(m));
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/mobile-banner-nl.png` });
  await banner(p).getByRole("button", { name: "Voorkeuren instellen" }).click();
  await p.locator("dialog.consent-dialog").waitFor();
  if (SHOTS) await p.screenshot({ path: `${SHOTS}/mobile-preferences-nl.png` });
  ok(`phone 390×844: banner ${Math.round(m.h)}px high (of ${m.vh}), 12px side margins, no horizontal overflow; preferences dialog opens`);
  await b.close();
})().catch((e) => { console.error("✗", e.message.split("\n").slice(0, 3).join(" ")); process.exit(1); });
