/**
 * Browser interaction tests (Playwright) against a running build.
 *
 *   node scripts/e2e-navigation.cjs [baseUrl]
 *
 * Requires the `playwright` package and a Chromium browser (not a project
 * dependency, so Hostinger never installs it). Cloudflare's widget script is
 * replaced by a local stub that issues the official dummy test token; this
 * needs the server to run WITHOUT a live TURNSTILE_SECRET_KEY.
 *
 * Set E2E_EXPECT_MAIL=1 when the server has a (test) SMTP server configured,
 * to also assert successful form submissions.
 */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const EXPECT_MAIL = process.env.E2E_EXPECT_MAIL === "1";

const stub = (autoSolve) => `window.turnstile = {
  render(el, o) { window.__ts = o; const d = document.createElement('div'); d.style.height = '65px'; el.appendChild(d);
    ${autoSolve ? "setTimeout(() => o.callback('XXXX.DUMMY.TOKEN.XXXX'), 100);" : ""} return 'w'; },
  reset() { ${autoSolve ? "setTimeout(() => window.__ts.callback('XXXX.DUMMY.TOKEN.XXXX'), 100);" : ""} },
  remove() {},
};`;

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    results.push(`✗ ${name}\n    ${String(e.message).split("\n")[0]}`);
  }
}

(async () => {
  const browser = await chromium.launch();
  const ctx = async (width, autoSolve = true) => {
    const c = await browser.newContext({ viewport: { width, height: 860 } });
    await c.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub(autoSolve) }));
    return c;
  };
  const checked = (page) =>
    page.$$eval("form input[type=checkbox]:checked", (els) => els.map((e) => e.closest("label")?.textContent?.trim()).filter(Boolean));

  const desktop = await ctx(1440);
  const mobile = await ctx(390);

  await step("treatment page CTA preselects the treatment (NL)", async () => {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/waxbehandelingen/bikini-intiem/brazilian-wax`);
    await p.getByRole("link", { name: "Vraag deze behandeling aan" }).first().click();
    await p.waitForURL(/\/afspraak-maken\?behandeling=brazilian#aanvraag$/);
    await p.waitForFunction(() => document.querySelectorAll("form input[type=checkbox]:checked").length === 1);
    assert.deepEqual(await checked(p), ["Brazilian"]);
    await p.close();
  });

  await step("treatment card 'request' link preselects (EN)", async () => {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/en/waxing-treatments/face`);
    await p.locator('a[href="/en/book-appointment?treatment=eyebrows#aanvraag"]').first().click();
    await p.waitForURL(/treatment=eyebrows/);
    await p.waitForFunction(() => document.querySelectorAll("form input[type=checkbox]:checked").length === 1);
    assert.deepEqual(await checked(p), ["Eyebrows"]);
    await p.close();
  });

  await step("unknown treatment id is ignored", async () => {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/afspraak-maken?behandeling=nope#aanvraag`);
    await p.waitForTimeout(400);
    assert.equal((await checked(p)).length, 0);
    await p.close();
  });

  await step("language switch keeps the page and the preselected treatment", async () => {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/waxbehandelingen/lichaam/oksels-waxen`);
    await p.locator('header a[hreflang="en"]').click();
    await p.waitForURL(`${BASE}/en/waxing-treatments/body/underarm-waxing`);
    await p.locator('header a[hreflang="nl-NL"]').click();
    await p.waitForURL(`${BASE}/waxbehandelingen/lichaam/oksels-waxen`);
    await p.goto(`${BASE}/afspraak-maken?behandeling=hollywood#aanvraag`);
    await p.locator('header a[hreflang="en"]').click();
    await p.waitForURL(/\/en\/book-appointment\?treatment=hollywood/);
    await p.waitForFunction(() => document.querySelectorAll("form input[type=checkbox]:checked").length === 1);
    assert.deepEqual(await checked(p), ["Hollywood"]);
    await p.close();
  });

  await step("desktop mega menu opens, lists all categories and navigates", async () => {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/`);
    await p.getByRole("button", { name: "Behandelingen" }).click();
    const menu = p.locator("#mega-menu");
    await menu.waitFor();
    for (const name of ["Gezicht", "Lichaam", "Bikini & intiem", "Wenkbrauwen", "Hollywood", "Nazorg"]) {
      assert.ok(await menu.getByRole("link", { name, exact: true }).count(), `missing ${name}`);
    }
    await p.keyboard.press("Escape");
    await menu.waitFor({ state: "detached" });
    await p.getByRole("button", { name: "Behandelingen" }).click();
    await menu.getByRole("link", { name: "Bikini & intiem", exact: true }).click();
    await p.waitForURL(`${BASE}/waxbehandelingen/bikini-intiem`);
    assert.equal(await p.locator("#mega-menu").count(), 0, "menu closes after navigation");
    await p.close();
  });

  await step("mobile menu: opens, locks scroll, Escape closes, links navigate", async () => {
    const p = await mobile.newPage();
    await p.goto(`${BASE}/en`);
    const toggle = p.locator('button[aria-controls="mobile-menu"]');
    await toggle.click();
    await p.locator("#mobile-menu").waitFor();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    assert.equal(await p.evaluate(() => document.documentElement.style.overflow), "hidden");
    await p.keyboard.press("Escape");
    await p.locator("#mobile-menu").waitFor({ state: "detached" });
    assert.equal(await p.evaluate(() => document.documentElement.style.overflow), "");
    await toggle.click();
    await p.locator("#mobile-menu").getByRole("link", { name: /^Body/ }).click();
    await p.waitForURL(`${BASE}/en/waxing-treatments/body`);
    assert.equal(await p.locator("#mobile-menu").count(), 0);
    await p.close();
  });

  await step("every header and footer link resolves", async () => {
    const p = await desktop.newPage();
    await p.goto(`${BASE}/`);
    const hrefs = await p.$$eval("header a[href], footer a[href]", (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
    for (const h of hrefs.filter((h) => h.startsWith("/"))) {
      const r = await fetch(new URL(h, BASE));
      assert.ok(r.status < 400, `${h} → ${r.status}`);
    }
    await p.close();
  });

  await step("form without a completed security check is refused and keeps its values", async () => {
    const c = await ctx(1280, false);
    const p = await c.newPage();
    await p.goto(`${BASE}/contact#bericht`);
    await p.fill("#contact-name", "Test Persoon");
    await p.fill("#contact-email", "test@example.com");
    await p.selectOption("#contact-topic", "question");
    await p.fill("#contact-message", "Dit is een testbericht zonder beveiligingscontrole.");
    await p.check("#contact-privacy");
    await p.waitForTimeout(3200);
    await p.getByRole("button", { name: "Verstuur bericht" }).click();
    await p.locator("#contact-challenge-error").waitFor();
    assert.equal(await p.inputValue("#contact-name"), "Test Persoon");
    assert.equal(await p.inputValue("#contact-message"), "Dit is een testbericht zonder beveiligingscontrole.");
    await c.close();
  });

  await step("API rejects missing and replayed Turnstile tokens", async () => {
    const body = (token, n) =>
      JSON.stringify({
        name: "Api Test",
        email: `api${n}@example.com`,
        topic: "question",
        message: `Replay test message number ${n}.`,
        privacy: true,
        locale: "nl",
        company: "",
        elapsedMs: 5000,
        ...(token ? { turnstileToken: token } : {}),
      });
    const post = (b, ip) =>
      fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: BASE, "x-real-ip": ip },
        body: b,
      });
    const missing = await post(body(null, 1), "198.51.100.1");
    assert.equal(missing.status, 403);
    assert.equal((await missing.json()).error, "challenge");
    const token = `e2e-${Date.now()}`;
    const first = await post(body(token, 2), "198.51.100.2");
    assert.notEqual(first.status, 403, "first use accepted by the challenge check");
    const replay = await post(body(token, 3), "198.51.100.3");
    assert.equal(replay.status, 403);
    assert.equal((await replay.json()).reason, "replayed");
  });

  if (EXPECT_MAIL) {
    await step("appointment request from a treatment page is sent successfully", async () => {
      const p = await desktop.newPage();
      await p.goto(`${BASE}/en/book-appointment?treatment=half-legs#aanvraag`);
      await p.waitForFunction(() => document.querySelectorAll("form input[type=checkbox]:checked").length === 1);
      const date = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
      const fill = async () => {
        await p.fill("#appt-date", date);
        await p.getByText("Afternoon", { exact: true }).click();
        await p.fill("#appt-name", "E2E Visitor");
        await p.fill("#appt-email", `e2e-${Date.now() % 100000}@example.com`);
        await p.fill("#appt-notes", "Automated end-to-end test, please ignore.");
        await p.check("#appt-privacy");
      };
      await fill();
      await p.waitForTimeout(3200);
      await p.getByRole("button", { name: "Send request" }).click();
      await p.getByText("Your request has been received").waitFor({ timeout: 15000 });
      await p.close();
    });
  }

  if (EXPECT_MAIL) {
    await step("identical resubmission is reported as duplicate (409), nothing sent twice", async () => {
      const payload = (token) =>
        JSON.stringify({
          name: "Dup Test",
          email: "dup-test@example.com",
          topic: "treatment",
          message: `Duplicate check ${new Date().toISOString().slice(0, 13)}`,
          privacy: true,
          locale: "en",
          company: "",
          elapsedMs: 6000,
          turnstileToken: token,
        });
      const post = (token, ip) =>
        fetch(`${BASE}/api/contact`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: BASE, "x-real-ip": ip },
          body: payload(token),
        });
      const first = await post(`dup-a-${Date.now()}`, "198.51.100.20");
      assert.equal(first.status, 200);
      const second = await post(`dup-b-${Date.now()}`, "198.51.100.21");
      assert.equal(second.status, 409);
      assert.equal((await second.json()).error, "duplicate");
    });
  }

  await browser.close();
  console.log(results.join("\n"));
  if (results.some((r) => r.startsWith("✗"))) process.exit(1);
})();
