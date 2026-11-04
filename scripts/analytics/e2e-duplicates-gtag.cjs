// Run against a local production build (next start on :3123) with a TEST database. Never production.
// Duplicate-tracking test: accept once, navigate client-side through several pages.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const B = "http://localhost:3123";
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 860 } });
  const hits = [];
  await c.route(/googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net/, (r) => { hits.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body: "" }); });
  const p = await c.newPage();
  await p.goto(B + "/");
  await p.locator(".consent-banner").getByRole("button", { name: "Alles accepteren" }).click();
  await p.waitForTimeout(800);
  const visited = ["/"];
  for (const href of ["/waxbehandelingen", "/prijzen", "/contact", "/afspraak-maken"]) {
    await p.evaluate((h) => { const a = document.querySelector(`a[href="${h}"]`); if (a) a.click(); else throw new Error("no link " + h); }, href);
    await p.waitForURL(B + href); await p.waitForTimeout(900);
    visited.push(href);
  }
  // Same tab, no full reload: the data layer kept everything.
  const layer = await p.evaluate(() => (window.dataLayer || []).map((e) => (e && typeof e.length === "number" ? Array.from(e) : e)));
  const configs = layer.filter((e) => Array.isArray(e) && e[0] === "config");
  const pvs = layer.filter((e) => Array.isArray(e) && e[0] === "event" && e[1] === "page_view").map((e) => e[2].page_path);
  const loaders = hits.filter((h) => /gtag\/js|gtm\.js/.test(h));
  const gtm = hits.filter((h) => /gtm\.js/.test(h));
  assert.equal(loaders.length, 1, "one Google loader in total: " + loaders.join(","));
  assert.equal(gtm.length, 0, "GTM not loaded next to GA4 direct");
  assert.equal(configs.length, 1, "gtag config called once");
  assert.equal(configs[0][2].send_page_view, false, "automatic page_view off (no double count)");
  assert.equal(configs[0][2].allow_google_signals, false);
  assert.deepEqual(pvs, visited, "exactly one page_view per page");
  const scripts = await p.evaluate(() => [...document.scripts].filter((s) => /googletagmanager/.test(s.src)).length);
  assert.equal(scripts, 1, "one Google <script> element in the page");
  console.log(`✓ ${visited.length} pages client-side: 1 loader (${loaders[0].replace("https://", "")}), 0 GTM, 1 gtag config (send_page_view=false, signals off), page_view per page: ${pvs.join(" → ")}, 1 script element`);
  await b.close();
})().catch((e) => { console.error("✗", e.message.split("\n")[0]); process.exit(1); });
