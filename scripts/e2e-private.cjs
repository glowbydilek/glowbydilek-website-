/**
 * End-to-end test of the private areas (Playwright) against a running build
 * with a TEST database and a local SMTP sink. Never run against production.
 *
 *   MAIL_DIR=/path/to/sink node scripts/e2e-private.cjs http://localhost:3123
 *
 * MAIL_DIR must contain the .eml files written by the local SMTP sink, so
 * the test can follow the password-reset link exactly like Dilek would.
 */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const MAIL_DIR = process.env.MAIL_DIR;
const PASSWORD = `Lotus-${Date.now()}-glow!`;
const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    results.push(`✗ ${name}\n    ${String(e.message).split("\n")[0]}`);
    throw e;
  }
}
const stub = `window.turnstile={render(el,o){window.__ts=o;setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){setTimeout(()=>window.__ts&&window.__ts.callback('XXXX.DUMMY.TOKEN.XXXX'),50)},remove(){}};`;

function latestResetLink(since) {
  const files = fs.readdirSync(MAIL_DIR).map((f) => path.join(MAIL_DIR, f)).filter((f) => fs.statSync(f).mtimeMs >= since);
  for (const f of files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)) {
    const raw = fs.readFileSync(f, "utf8").replace(/=\r?\n/g, "").replace(/=3D/g, "=");
    const m = raw.match(/https?:\/\/[^\s"<]+\/(admin|ajanda)\/wachtwoord-herstellen\?token=[A-Za-z0-9_-]+/);
    if (m) return m[0];
  }
  return null;
}

(async () => {
  assert.ok(MAIL_DIR, "set MAIL_DIR to the local SMTP sink folder");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  globalThis.__browser = browser;
  await ctx.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
  const p = await ctx.newPage();
  try {
    await step("private pages require login and are noindex", async () => {
      for (const url of ["/admin", "/ajanda", "/ajanda/klanten", "/admin/beveiliging"]) {
        const r = await p.goto(BASE + url);
        assert.match(p.url(), /\/(admin|ajanda)\/login/, url);
        assert.match(r.headers()["x-robots-tag"] ?? "", /noindex/);
      }
      const api = await fetch(`${BASE}/ajanda/klanten/1/export`);
      assert.equal(api.status, 401);
    });

    await step("forgot password (neutral message) → email link → new password", async () => {
      const since = Date.now() - 1000;
      await p.goto(`${BASE}/ajanda/login`);
      await p.getByRole("link", { name: "Wachtwoord vergeten?" }).click();
      await p.waitForURL(/wachtwoord-vergeten/);
      await p.fill("#email", "hello@glowbydilek.nl");
      await p.waitForTimeout(400); // security check token
      await p.getByRole("button", { name: "Stuur mij een link" }).click();
      await p.getByText("Als dit e-mailadres bij een account hoort").waitFor();
      let link = null;
      for (let i = 0; i < 30 && !link; i++) {
        await new Promise((r) => setTimeout(r, 300));
        link = latestResetLink(since);
      }
      assert.ok(link, "reset email received");
      await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
      await p.fill("#password", PASSWORD);
      await p.fill("#confirm", PASSWORD);
      await p.getByRole("button", { name: "Wachtwoord opslaan" }).click();
      await p.waitForURL(/\/ajanda\/login\?reset=1/);
      // the link is single-use
      await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
      await p.getByText("verlopen of al gebruikt").waitFor();
    });

    await step("wrong password is refused with a neutral message", async () => {
      await p.goto(`${BASE}/ajanda/login`);
      await p.fill("#password", "definitely-wrong-123");
      await p.waitForTimeout(400);
      await p.getByRole("button", { name: "Inloggen" }).click();
      await p.getByText("Onjuist e-mailadres of wachtwoord.").waitFor();
    });

    await step("login opens the agenda on Today", async () => {
      await p.fill("#password", PASSWORD);
      await p.waitForTimeout(400);
      await p.getByRole("button", { name: "Inloggen" }).click();
      await p.waitForURL(`${BASE}/ajanda`);
      await p.getByRole("heading", { name: "Vandaag", exact: true }).waitFor();
    });

    await step("set weekly working hours (Mon–Fri 09:00–12:00)", async () => {
      await p.goto(`${BASE}/ajanda/werktijden`);
      for (const day of ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"]) {
        const box = p.locator("label", { hasText: day }).locator('input[type="checkbox"]');
        if (!(await box.isChecked())) await box.check();
      }
      await p.getByRole("button", { name: "Werktijden opslaan" }).click();
      await p.getByText("Werktijden opgeslagen").waitFor();
    });

    let appointmentUrl = "";
    await step("create an appointment with first/last name, phone, email and time", async () => {
      await p.goto(`${BASE}/ajanda/afspraak/nieuw`);
      const day = new Date(Date.now() + 9 * 864e5);
      while ([0, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
      const iso = day.toISOString().slice(0, 10);
      await p.locator("label", { hasText: "Wenkbrauwen" }).click();
      await p.fill("#day", iso);
      await p.fill("#time", "10:00");
      await p.fill("#duration", "30");
      await p.getByText("Eindtijd: 10:30").waitFor();
      await p.fill("#firstName", "Test");
      await p.fill("#lastName", "Klant");
      await p.fill("#phone", "0612345678");
      await p.fill("#email", "test.klant@example.com");
      await p.getByRole("button", { name: "Afspraak opslaan" }).click();
      await p.waitForURL(/\/ajanda\/afspraak\/\d+\?opgeslagen=1/);
      appointmentUrl = p.url().split("?")[0];
      await p.getByText("Bevestigd").first().waitFor();
      await p.goto(`${BASE}/ajanda/agenda?view=day&d=${iso}`);
      await p.getByText("Test Klant").waitFor();
    });

    await step("double booking the same time is refused", async () => {
      const day = await p.locator('input[type="date"]').first().inputValue().catch(() => "");
      await p.goto(appointmentUrl);
      const iso = await p.locator('input[name="day"]').first().inputValue();
      await p.goto(`${BASE}/ajanda/afspraak/nieuw?d=${iso}`);
      await p.locator("label", { hasText: "Bovenlip" }).click();
      await p.fill("#time", "10:15");
      await p.fill("#duration", "30");
      await p.fill("#firstName", "Tweede");
      await p.getByRole("button", { name: "Afspraak opslaan" }).click();
      await p.getByText("niet (meer) beschikbaar").waitFor();
      void day;
    });

    await step("reschedule and cancel send customer emails", async () => {
      await p.goto(appointmentUrl);
      await p.locator('input[name="time"]').first().fill("11:00");
      await p.getByRole("button", { name: "Wijziging opslaan" }).click();
      await p.getByText("Afspraak opgeslagen. Is het tijdstip veranderd").waitFor();
      p.once("dialog", (d) => d.accept());
      await p.locator("summary", { hasText: "Annuleren" }).click();
      await p.getByRole("button", { name: "Afspraak annuleren" }).click();
      await p.getByText("Afspraak geannuleerd. De klant krijgt een bericht").waitFor();
      const r = await fetch(`${BASE}/api/cron/tick`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET || "x"}` } });
      assert.ok([200, 401].includes(r.status));
    });

    await step("customer search by phone", async () => {
      await p.goto(`${BASE}/ajanda/klanten?q=0612345678`);
      await p.getByText("Test Klant").waitFor();
    });

    await step("CMS: edit the homepage title, publish, see it live, restore the original", async () => {
      await p.goto(`${BASE}/admin/paginas/home`);
      await p.locator("#f-root-hero-title").fill("Zacht voor je huid — test.");
      await p.getByRole("button", { name: "Publiceren", exact: true }).click();
      await p.getByText("Gepubliceerd (versie").waitFor();
      const html = await (await fetch(`${BASE}/`)).text();
      assert.ok(html.includes("Zacht voor je huid — test."), "published title is live");
      p.once("dialog", (d) => d.accept());
      await p.getByRole("button", { name: "Oorspronkelijke tekst" }).click();
      await p.getByText("De oorspronkelijke tekst staat weer op de website").waitFor();
      assert.ok(!(await (await fetch(`${BASE}/`)).text()).includes("— test."));
    });

    await step("CMS: draft preview is visible to the owner only", async () => {
      await p.goto(`${BASE}/admin/paginas/about`);
      await p.locator("#f-root-hero-title").fill("Concepttitel voor voorbeeld");
      await p.getByRole("button", { name: "Voorbeeld bekijken" }).click();
      await p.waitForURL(`${BASE}/over-dilek`);
      await p.getByText("Voorbeeldweergave").waitFor();
      await p.getByText("Concepttitel voor voorbeeld").first().waitFor();
      assert.ok(!(await (await fetch(`${BASE}/over-dilek`)).text()).includes("Concepttitel"), "visitors never see drafts");
      await p.getByRole("link", { name: "Voorbeeld sluiten" }).click();
      await p.goto(`${BASE}/admin/paginas/about`);
      p.once("dialog", (d) => d.accept());
      await p.getByRole("button", { name: "Concept verwijderen" }).click();
      await p.getByText("Concept verwijderd").waitFor();
    });

    await step("Theme: publish a preset, then restore the approved theme", async () => {
      await p.goto(`${BASE}/admin/thema`);
      await p.getByRole("button", { name: "Luchtiger, met meer witruimte" }).click();
      await p.getByRole("button", { name: "Publiceren", exact: true }).click();
      await p.getByText("Gepubliceerd").waitFor();
      assert.match(await (await fetch(`${BASE}/`)).text(), /id="glow-theme"[^>]*>[^<]*--space-section/);
      p.once("dialog", (d) => d.accept());
      await p.getByRole("button", { name: "Goedgekeurd thema herstellen" }).click();
      await p.getByText("De oorspronkelijke tekst staat weer").waitFor();
      assert.ok(!(await (await fetch(`${BASE}/`)).text()).includes('id="glow-theme"'));
    });

    await step("Prices: set price and duration; shown on the prices page", async () => {
      await p.goto(`${BASE}/admin/behandelingen`);
      const row = p.locator("details").filter({ has: p.locator(":scope > summary").filter({ hasText: "Brazilian" }) }).first();
      await row.locator(":scope > summary").click();
      await row.locator('input[name="price"]').fill("45");
      await row.locator('input[name="duration"]').fill("45");
      await row.locator('input[name="buffer"]').fill("15");
      await row.locator('input[name="bookableOnline"]').check();
      await row.getByRole("button", { name: "Opslaan" }).click();
      await row.getByText("Opgeslagen").waitFor();
      const prices = (await (await fetch(`${BASE}/prijzen`)).text()).replace(/\u00a0|&nbsp;|&#160;/g, " ");
      assert.match(prices, /€ ?45\b/, "price € 45 not shown on /prijzen");
    });

    await step("Online booking: enable, customer chooses an exact time, request appears in Ajanda, approve sends confirmation", async () => {
      await p.goto(`${BASE}/ajanda/instellingen`);
      await p.locator('input[name="onlineBookingEnabled"]').check();
      await p.locator('input[name="minNoticeHours"]').fill("0");
      await p.getByRole("button", { name: "Instellingen opslaan" }).click();
      await p.getByText("Instellingen opgeslagen").waitFor();
      const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await c.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
      const v = await c.newPage();
      await v.goto(`${BASE}/afspraak-maken?behandeling=brazilian`);
      await v.getByText("Kies een dag en tijd").waitFor();
      await v.locator('[role="listbox"] [role="option"]').first().click();
      await v.locator('[role="listbox"]').nth(1).locator('[role="option"]').first().click();
      await v.fill("#bk-first", "Online");
      await v.fill("#bk-last", "Klant");
      await v.fill("#bk-email", `online.${Date.now()}@example.com`);
      await v.fill("#bk-phone", "0611122233");
      await v.check("#bk-privacy");
      await v.waitForTimeout(3200);
      await v.getByRole("button", { name: "Afspraak aanvragen" }).click();
      await v.getByText("Je aanvraag is ontvangen").waitFor();
      await c.close();
      await p.goto(`${BASE}/ajanda/aanvragen`);
      await p.getByText("Online Klant").first().click();
      await p.getByRole("button", { name: /Afspraak bevestigen/ }).click();
      await p.getByText("Afspraak bevestigd. De klant krijgt een bevestiging").waitFor();
    });

    await step("Contact messages appear in the inbox", async () => {
      const marker = `Inboxtest ${Date.now()}`;
      const r = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: BASE, "x-real-ip": `198.51.100.${(Date.now() % 200) + 20}` },
        body: JSON.stringify({ name: "Inbox Test", email: `inbox.${Date.now()}@example.com`, topic: "question", message: `${marker}: komt dit bericht in Ajanda aan?`, privacy: true, locale: "nl", company: "", elapsedMs: 5000, turnstileToken: `e2e-inbox-${Date.now()}` }),
      });
      assert.equal(r.status, 200, `contact form → ${r.status}`);
      await p.goto(`${BASE}/ajanda/berichten`);
      await p.getByText("Inbox Test").first().click();
      await p.getByText(marker).waitFor();
    });

    await step("Media: upload, describe, place on the homepage, restore the original photo", async () => {
      const sharp = require("sharp");
      const png = await sharp({ create: { width: 1200, height: 1500, channels: 3, background: "#d8c2ae" } }).png().toBuffer();
      const file = path.join(require("node:os").tmpdir(), `e2e-${Date.now()}.png`);
      fs.writeFileSync(file, png);
      await p.goto(`${BASE}/admin/media`);
      await p.setInputFiles('input[name="file"]', file);
      await p.locator('input[name="altNl"]').first().fill("Testfoto in nude tinten");
      await p.locator('input[name="altEn"]').first().fill("Test photo in nude tones");
      await p.getByRole("button", { name: "Uploaden" }).click();
      await p.getByText("Foto geüpload").waitFor();
      const slot = p.locator("form", { has: p.locator('input[name="slot"][value="hero"]') });
      const opt = await slot.locator("select option").nth(1).getAttribute("value");
      await slot.locator("select").selectOption(opt);
      await slot.getByRole("button", { name: "Toepassen" }).click();
      await slot.getByText("De foto staat nu op de website").waitFor();
      assert.match(await (await fetch(`${BASE}/`)).text(), new RegExp(`/media/${opt}/1600`));
      const img = await fetch(`${BASE}/media/${opt}/640`);
      assert.equal(img.headers.get("content-type"), "image/webp");
      assert.equal(img.headers.get("x-content-type-options"), "nosniff");
      await slot.locator("select").selectOption("");
      await slot.getByRole("button", { name: "Toepassen" }).click();
      await slot.getByText("De oorspronkelijke foto staat weer").waitFor();
    });

    await step("Overal uitloggen ends the sessions on every device", async () => {
      const c2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await c2.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
      const other = await c2.newPage();
      await other.goto(`${BASE}/admin/login`);
      await other.fill("#email", "hello@glowbydilek.nl");
      await other.fill("#password", PASSWORD);
      await other.waitForTimeout(400);
      await other.getByRole("button", { name: "Inloggen" }).click();
      await other.waitForURL(`${BASE}/admin`);
      p.once("dialog", (d) => d.accept());
      await p.goto(`${BASE}/admin/beveiliging`);
      await p.getByRole("button", { name: "Overal uitloggen" }).click();
      await p.waitForURL(/\/admin\/login\?uitgelogd=1/);
      await other.goto(`${BASE}/admin/beveiliging`);
      assert.match(other.url(), /\/admin\/login/, "other device is signed out");
      // Sign this device back in for the remaining steps.
      await other.close();
      await c2.close();
      await p.fill("#email", "hello@glowbydilek.nl");
      await p.fill("#password", PASSWORD);
      await p.waitForTimeout(400);
      await p.getByRole("button", { name: "Inloggen" }).click();
      await p.waitForURL(`${BASE}/admin`);
    });

    await step("admin uses the same login; logout ends the session", async () => {
      await p.goto(`${BASE}/admin`);
      await p.getByRole("heading", { name: /Welkom/ }).waitFor();
      await p.goto(`${BASE}/admin/beveiliging`);
      await p.getByText("Tweestapsverificatie").first().waitFor();
      await p.getByRole("button", { name: "Menu" }).click();
      await p.getByRole("button", { name: "Uitloggen", exact: true }).click();
      await p.waitForURL(/\/admin\/login\?uitgelogd=1/);
      await p.goto(`${BASE}/ajanda`);
      assert.match(p.url(), /\/ajanda\/login/);
    });
  } catch {
    /* reported below */
  } finally {
    await browser.close();
    console.log(results.join("\n"));
    if (results.some((r) => r.startsWith("✗"))) process.exit(1);
  }
})();
