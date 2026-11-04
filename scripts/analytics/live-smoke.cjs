// LIVE production smoke test (read-only): consent scenarios with real GTM/GA4. No form submissions, no personal data.
// LIVE production smoke test: real GTM/GA4, no form submissions, no personal data.
const { chromium, devices } = require("playwright");
const B = "https://glowbydilek.nl";
const isG = (u) => /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/.test(u);
const out = [];
const ok = (c, m) => { out.push((c ? "✓ " : "✗ ") + m); };
(async () => {
  const b = await chromium.launch();
  // 1. First visit: banner, no Google requests
  let c = await b.newContext({ viewport: { width: 1280, height: 900 } }); let p = await c.newPage(); let hits = [];
  p.on("request", (r) => isG(r.url()) && hits.push(r.url()));
  await p.goto(B + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  const banner = await p.getByRole("button", { name: "Alles accepteren" }).isVisible();
  ok(banner && hits.length === 0, `first visit: banner=${banner}, Google requests before consent=${hits.length}`);
  ok((await c.cookies()).filter((k) => k.name.startsWith("_ga")).length === 0, "no _ga cookies before consent");
  // 2. Reject
  await p.getByRole("button", { name: "Alles weigeren" }).click(); await p.waitForTimeout(1500);
  await p.goto(B + "/prijzen", { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
  ok(hits.length === 0 && !(await p.getByRole("button", { name: "Alles accepteren" }).isVisible()), `reject: banner gone, Google requests=${hits.length}`);
  await c.close();
  // 3. Accept: GTM once, GA4 collect with page_view, consent order
  c = await b.newContext({ viewport: { width: 1280, height: 900 } }); p = await c.newPage(); hits = [];
  p.on("request", (r) => isG(r.url()) && hits.push(r.url()));
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Alles accepteren" }).click(); await p.waitForTimeout(5000);
  await p.goto(B + "/waxbehandelingen", { waitUntil: "networkidle" }); await p.waitForTimeout(3000);
  await p.getByRole("link", { name: /Wenkbrauwen/i }).first().click().catch(() => {}); await p.waitForTimeout(4000);
  const gtm = hits.filter((u) => /gtm\.js\?id=GTM-W9VRJF9X/.test(u)).length;
  const gtagjs = hits.filter((u) => /gtag\/js/.test(u)).length;
  const collects = hits.filter((u) => /\/g\/collect/.test(u));
  const ev = collects.map((u) => { const q = new URL(u).searchParams; return (q.get("en") || "?") + "@" + (q.get("tid") || "") + (q.get("gcs") ? " gcs=" + q.get("gcs") : ""); });
  const layer = await p.evaluate(() => (window.dataLayer || []).map((e) => (e && e[0]) ? e[0] + ":" + e[1] : (e && e.event) || "").filter(Boolean));
  ok(gtm >= 1, `accept: gtm.js loads=${gtm} (one per full page load), gtag/js loaded by GTM=${gtagjs}`);
  ok(collects.length > 0 && ev.every((e) => e.includes("G-77V0DM6Y7B")), `GA4 collect requests: ${collects.length} → ${ev.join(", ")}`);
  ok(ev.filter((e) => e.startsWith("page_view")).length >= 2, "page_view per page (no duplicate per page)");
  ok(/consent:default/.test(layer.join("|")) && layer.findIndex((x) => x.startsWith("consent:default")) < layer.findIndex((x) => x === "gtm.js"), "consent default before gtm.js: " + layer.slice(0, 6).join(" → "));
  const cookies = (await c.cookies()).filter((k) => k.name.startsWith("_ga")).map((k) => k.name);
  ok(cookies.length > 0, "after consent: _ga cookies " + cookies.join(","));
  // 4. Private pages never load GTM even with consent
  hits = []; await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  ok(hits.length === 0, `private /login with consent: Google requests=${hits.length}`);
  hits = []; await p.goto(B + "/offerte/aaaaaaaaaaaaaaaaaaaaaaaa", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  ok(hits.length === 0, `token page /offerte/* with consent: Google requests=${hits.length}`);
  // 5. Withdraw via Cookie-instellingen
  await p.goto(B + "/", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Cookie-instellingen/ }).first().click().catch(async () => { await p.getByText("Cookie-instellingen").first().click(); });
  await p.waitForTimeout(800);
  const rej = p.getByRole("button", { name: "Alles weigeren" });
  if (await rej.count()) await rej.first().click(); await p.waitForTimeout(1500);
  const store = await p.evaluate(() => localStorage.getItem("glow-consent-v2"));
  hits = []; await p.goto(B + "/contact", { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  ok(/"analytics":false/.test(store || "") && hits.length === 0, `withdraw: stored=${(store||"").slice(0,60)}…, Google requests on next page=${hits.length}`);
  await c.close();
  // 6. EN + mobile
  c = await b.newContext({ ...devices["iPhone 13"] }); p = await c.newPage(); hits = [];
  p.on("request", (r) => isG(r.url()) && hits.push(r.url()));
  await p.goto(B + "/en", { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
  const enBtn = await p.getByRole("button", { name: /Accept all/i }).isVisible().catch(() => false);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(enBtn && hits.length === 0 && overflow <= 0, `EN iPhone: English banner=${enBtn}, Google before consent=${hits.length}, horizontal overflow=${overflow}px`);
  await c.close(); await b.close();
  console.log(out.join("\n"));
})().catch((e) => { console.log(out.join("\n")); console.log("✗ " + e.message.split("\n")[0]); process.exit(1); });
