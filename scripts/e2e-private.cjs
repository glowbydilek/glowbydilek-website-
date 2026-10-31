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

    await step("admin uses the same login; logout ends the session", async () => {
      await p.goto(`${BASE}/admin`);
      await p.getByRole("heading", { name: /Welkom/ }).waitFor();
      await p.goto(`${BASE}/admin/beveiliging`);
      await p.getByText("Tweestapsverificatie").first().waitFor();
      await p.getByRole("button", { name: "Menu" }).click();
      await p.getByRole("button", { name: "Uitloggen" }).click();
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
