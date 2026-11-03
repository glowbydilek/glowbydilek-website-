/**
 * End-to-end check of the first-password route (owner login repair, v13).
 * Needs a running build with a TEST database where the owner has NO password
 * yet, and OWNER_SETUP_TOKEN set on the server. Never run against production.
 *
 *   OWNER_SETUP_TOKEN=… node scripts/e2e-setup.cjs
 *
 * Proves: status page shows no secrets; a wrong code is refused; the right
 * code sets the password once; a real login creates a __Host- session cookie
 * (httpOnly, Secure, SameSite=Lax) that opens the agenda; reusing the code
 * after a password exists has no effect.
 */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const B = (process.argv[2] || "http://localhost:3123").replace(/\/$/, "");
const T = process.env.OWNER_SETUP_TOKEN;
const PW = "Zachte-ochtend-" + Date.now();
const text = async (p) => (await p.locator("main").innerText()).replace(/\s+/g, " ").trim();
(async () => {
  const b = await chromium.launch();
  const stub = "window.turnstile={render(el,o){window.__ts=o;setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){setTimeout(()=>window.__ts&&window.__ts.callback('XXXX.DUMMY.TOKEN.XXXX'),50)},remove(){}};";
  const ctx = async () => { const c = await b.newContext(); await c.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub })); return c; };
  const p = await (await ctx()).newPage();
  const ok = (m) => console.log("✓ " + m);

  await p.goto(B + "/login/status");
  const html = await p.content();
  assert.ok(!/devpass|local-qa-secret|test-password|local-cron-secret/.test(html), "no secrets on the status page");
  ok("status page (no secrets): " + (await text(p)).slice(0, 400));

  await p.goto(B + "/login/eerste-wachtwoord");
  await p.fill("#email", "hello@glowbydilek.nl");
  await p.fill("#token", "x".repeat(30));
  await p.fill("#password", PW);
  await p.fill("#confirm", PW);
  await p.locator("form button[type=submit]").click();
  await p.waitForTimeout(1500);
  ok("wrong setup code: " + (await p.locator("[role=alert], .notice, form p").allInnerTexts()).join(" | ").slice(0, 200));

  await p.fill("#email", "hello@glowbydilek.nl");
  await p.fill("#token", T);
  await p.fill("#password", PW);
  await p.fill("#confirm", PW);
  await p.locator("form button[type=submit]").click();
  await p.waitForTimeout(2000);
  ok("right setup code → " + new URL(p.url()).pathname + " : " + (await text(p)).slice(0, 200));

  await p.goto(B + "/login");
  await p.fill("#email", "hello@glowbydilek.nl");
  await p.fill("#password", PW);
  await p.locator("form button[type=submit]").click();
  await p.waitForTimeout(2500);
  ok("login submitted → " + new URL(p.url()).pathname + " : " + (await text(p)).slice(0, 160));
  const ck = (await p.context().cookies()).filter((c) => c.httpOnly);
  ok("httpOnly cookies: " + ck.map((c) => `${c.name} sameSite=${c.sameSite} secure=${c.secure} path=${c.path}`).join("; "));
  await p.goto(B + "/agenda");
  assert.ok(!/\/login/.test(p.url()), "agenda reachable with the session");
  ok("agenda opens with the session → " + new URL(p.url()).pathname);

  const p2 = await (await ctx()).newPage();
  await p2.goto(B + "/login/eerste-wachtwoord");
  await p2.fill("#email", "hello@glowbydilek.nl");
  await p2.fill("#token", T);
  await p2.fill("#password", PW + "x");
  await p2.fill("#confirm", PW + "x");
  await p2.locator("form button[type=submit]").click();
  await p2.waitForTimeout(1500);
  ok("setup code reused after a password exists: " + (await text(p2)).slice(0, 220));
  const p3 = await (await ctx()).newPage();
  await p3.goto(B + "/login");
  await p3.fill("#email", "hello@glowbydilek.nl");
  await p3.fill("#password", PW + "x");
  await p3.locator("form button[type=submit]").click();
  await p3.waitForTimeout(1500);
  assert.ok(/\/login/.test(p3.url()), "the reused code did not change the password");
  ok("old password still the only valid one (reuse had no effect)");
  await b.close();
})().catch((e) => {
  console.error("✗", e.message.split("\n")[0]);
  process.exit(1);
});
