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
    // Screenshot of the page at the moment of failure (set E2E_SHOTS to a folder).
    if (process.env.E2E_SHOTS && globalThis.__page) {
      await globalThis.__page.screenshot({ path: path.join(process.env.E2E_SHOTS, `failed-${Date.now()}.png`), fullPage: true }).catch(() => {});
      results.push(`    at ${globalThis.__page.url()}`);
    }
    throw e;
  }
}
const stub = `window.turnstile={render(el,o){window.__ts=o;setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){setTimeout(()=>window.__ts&&window.__ts.callback('XXXX.DUMMY.TOKEN.XXXX'),50)},remove(){}};`;

function latestResetLink(since) {
  const files = fs.readdirSync(MAIL_DIR).map((f) => path.join(MAIL_DIR, f)).filter((f) => fs.statSync(f).mtimeMs >= since);
  for (const f of files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)) {
    const raw = fs.readFileSync(f, "utf8").replace(/=\r?\n/g, "").replace(/=3D/g, "=");
    const m = raw.match(/https?:\/\/[^\s"<]+\/(admin|agenda)\/wachtwoord-herstellen\?token=[A-Za-z0-9_-]+/);
    if (m) return m[0];
  }
  return null;
}

/** Emails written by the local SMTP sink since a timestamp: decoded subject, recipient and attachment names. */
function mailsSince(since) {
  const decode = (v) =>
    v.replace(/=\?utf-8\?([qb])\?([^?]*)\?=/gi, (_, enc, txt) =>
      enc.toLowerCase() === "b" ? Buffer.from(txt, "base64").toString("utf8") : Buffer.from(txt.replace(/_/g, " ").replace(/=([0-9a-f]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))), "latin1").toString("utf8"),
    ).replace(/\?=\s+=\?/g, "");
  return fs
    .readdirSync(MAIL_DIR)
    .map((f) => path.join(MAIL_DIR, f))
    .filter((f) => fs.statSync(f).mtimeMs >= since)
    .map((f) => {
      const raw = fs.readFileSync(f, "utf8");
      const head = raw.split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g, " ");
      const subject = decode((head.match(/^Subject: (.*)$/im) || [])[1] || "");
      const to = (head.match(/^To: (.*)$/im) || [])[1] || "";
      const attachments = [...raw.matchAll(/filename="?([^";\r\n]+)"?/g)].map((m) => m[1]);
      return { subject, to, attachments, raw };
    });
}

(async () => {
  assert.ok(MAIL_DIR, "set MAIL_DIR to the local SMTP sink folder");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  globalThis.__browser = browser;
  await ctx.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
  const p = await ctx.newPage();
  globalThis.__page = p;
  try {
    await step("private pages require login and are noindex", async () => {
      for (const url of ["/admin", "/agenda", "/agenda/klanten", "/admin/beveiliging"]) {
        const r = await p.goto(BASE + url);
        assert.match(p.url(), /\/(admin|agenda)\/login/, url);
        assert.match(r.headers()["x-robots-tag"] ?? "", /noindex/);
      }
      const api = await fetch(`${BASE}/agenda/klanten/1/export`);
      assert.equal(api.status, 401);
    });

    await step("forgot password (neutral message) → email link → new password", async () => {
      const since = Date.now() - 1000;
      await p.goto(`${BASE}/agenda/login`);
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
      await p.waitForURL(/\/agenda\/login\?reset=1/);
      // the link is single-use
      await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
      await p.getByText("verlopen of al gebruikt").waitFor();
    });

    await step("wrong password is refused with a neutral message", async () => {
      await p.goto(`${BASE}/agenda/login`);
      await p.fill("#password", "definitely-wrong-123");
      await p.waitForTimeout(400);
      await p.getByRole("button", { name: "Inloggen" }).click();
      await p.getByText("Onjuist e-mailadres of wachtwoord.").waitFor();
    });

    await step("login opens the agenda on Today", async () => {
      await p.fill("#password", PASSWORD);
      await p.waitForTimeout(400);
      await p.getByRole("button", { name: "Inloggen" }).click();
      await p.waitForURL(`${BASE}/agenda`);
      await p.getByRole("heading", { name: "Vandaag", exact: true }).waitFor();
    });

    await step("set weekly working hours (Mon–Fri 09:00–12:00)", async () => {
      await p.goto(`${BASE}/agenda/werktijden`);
      for (const day of ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"]) {
        const box = p.locator("label", { hasText: day }).locator('input[type="checkbox"]');
        if (!(await box.isChecked())) await box.check();
      }
      await p.getByRole("button", { name: "Werktijden opslaan" }).click();
      await p.getByText("Werktijden opgeslagen").waitFor();
    });

    let appointmentUrl = "";
    await step("create an appointment with first/last name, phone, email and time", async () => {
      await p.goto(`${BASE}/agenda/afspraak/nieuw`);
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
      await p.waitForURL(/\/agenda\/afspraak\/\d+\?opgeslagen=1/);
      appointmentUrl = p.url().split("?")[0];
      await p.getByText("Bevestigd").first().waitFor();
      await p.goto(`${BASE}/agenda/kalender?view=day&d=${iso}`);
      await p.getByText("Test Klant").waitFor();
    });

    await step("double booking the same time is refused", async () => {
      const day = await p.locator('input[type="date"]').first().inputValue().catch(() => "");
      await p.goto(appointmentUrl);
      const iso = await p.locator('input[name="day"]').first().inputValue();
      await p.goto(`${BASE}/agenda/afspraak/nieuw?d=${iso}`);
      await p.locator("label", { hasText: "Bovenlip" }).click();
      await p.fill("#time", "10:15");
      await p.fill("#duration", "30");
      await p.fill("#firstName", "Tweede");
      await p.getByRole("button", { name: "Afspraak opslaan" }).click();
      await p.getByText("niet (meer) beschikbaar").waitFor();
      void day;
    });

    await step("reschedule and cancel always email the customer (material changes)", async () => {
      const since = Date.now() - 1000;
      await p.goto(appointmentUrl);
      await p.locator('input[name="time"]').first().fill("11:00");
      await p.getByRole("button", { name: "Wijziging opslaan" }).click();
      await p.getByText("Wijziging opgeslagen.").waitFor();
      p.once("dialog", (d) => d.accept());
      await p.locator("summary", { hasText: "Annuleren" }).click();
      await p.getByRole("button", { name: "Afspraak annuleren" }).click();
      await p.getByText("Afspraak geannuleerd. Het tijdstip is weer vrij.").waitFor();
      let subjects = [];
      for (let i = 0; i < 30 && subjects.length < 2; i++) {
        await new Promise((r) => setTimeout(r, 300));
        subjects = mailsSince(since).map((m) => m.subject).filter((s) => /verplaatst|geannuleerd/i.test(s));
      }
      assert.equal(subjects.length, 2, `rescheduled + cancelled emails received (${subjects.join(" | ")})`);
    });

    await step("customer search by phone", async () => {
      await p.goto(`${BASE}/agenda/klanten?q=0612345678`);
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
      await row.locator('select[name="pricingMode"]').selectOption("fixed");
      await row.locator('input[name="price"]').fill("45");
      await row.locator('input[name="duration"]').fill("45");
      await row.locator('input[name="buffer"]').fill("15");
      await row.locator('input[name="bookableOnline"]').check();
      await row.getByRole("button", { name: "Opslaan" }).click();
      await row.getByText("Opgeslagen").waitFor();
      const prices = (await (await fetch(`${BASE}/prijzen`)).text()).replace(/\u00a0|&nbsp;|&#160;/g, " ");
      assert.match(prices, /€ ?45\b/, "price € 45 not shown on /prijzen");
    });

    await step("Online booking: enable, customer chooses an exact time, request appears in Agenda, approve sends confirmation", async () => {
      await p.goto(`${BASE}/agenda/instellingen`);
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
      await p.goto(`${BASE}/agenda/aanvragen`);
      await p.getByText("Online Klant").first().click();
      await p.getByRole("button", { name: /Afspraak bevestigen/ }).click();
      await p.getByText("Afspraak bevestigd. De klant krijgt een bevestiging").waitFor();
    });

    await step("Contact messages appear in the inbox", async () => {
      const marker = `Inboxtest ${Date.now()}`;
      const r = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: BASE, "x-real-ip": `198.51.100.${(Date.now() % 200) + 20}` },
        body: JSON.stringify({ name: "Inbox Test", email: `inbox.${Date.now()}@example.com`, topic: "question", message: `${marker}: komt dit bericht in Agenda aan?`, privacy: true, locale: "nl", company: "", elapsedMs: 5000, turnstileToken: `e2e-inbox-${Date.now()}` }),
      });
      assert.equal(r.status, 200, `contact form → ${r.status}`);
      await p.goto(`${BASE}/agenda/berichten`);
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

    let repeatUrl;
    await step("CRM: a returning customer is recognised by phone in another notation and reused", async () => {
      const before = (await (await p.request.get(`${BASE}/agenda/klanten`)).text()).match(/Test Klant/g)?.length ?? 0;
      const day = new Date(Date.now() + 10 * 864e5);
      while ([0, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
      await p.goto(`${BASE}/agenda/afspraak/nieuw?d=${day.toISOString().slice(0, 10)}`);
      await p.fill("#phone", "+31 6 1234 5678");
      await p.getByText("Bestaande klant gevonden").waitFor();
      await p.getByText("zelfde telefoonnummer").waitFor();
      await p.getByRole("button", { name: "Deze klant gebruiken" }).click();
      await p.getByText("Bestaande klant: de afspraak komt in dit klantprofiel.").waitFor();
      await p.locator("label", { hasText: "Wenkbrauwen" }).click();
      await p.fill("#time", "09:00");
      await p.fill("#duration", "30");
      await p.fill("#price", "45,00");
      await p.getByRole("button", { name: "Afspraak opslaan" }).click();
      await p.waitForURL(/\/agenda\/afspraak\/\d+\?opgeslagen=1/);
      repeatUrl = p.url().split("?")[0];
      await p.getByText("€ 45,00").first().waitFor();
      const after = (await (await p.request.get(`${BASE}/agenda/klanten`)).text()).match(/Test Klant/g)?.length ?? 0;
      assert.equal(after, before, "no duplicate customer profile");
    });

    await step("Invoices: blocked until business details exist; issue, PDF and email with the PDF attached", async () => {
      await p.goto(repeatUrl);
      await p.locator("summary", { hasText: "Status" }).click();
      await p.getByRole("button", { name: "✓ Afgerond" }).click();
      await p.waitForURL(/melding=complete/);
      await p.getByRole("button", { name: "＋ Factuur maken" }).first().click();
      await p.waitForURL(/\/agenda\/facturen\/\d+$/);
      const invoiceUrl = p.url();
      await p.getByText("Nog niet mogelijk").waitFor();
      // Business details (test values in the development database only).
      await p.goto(`${BASE}/admin/bedrijf`);
      await p.fill('input[name="legalName"]', "Testonderneming (alleen test)");
      await p.fill('input[name="kvk"]', "12345678");
      await p.fill('input[name="street"]', "Teststraat 1");
      await p.fill('input[name="postcode"]', "1234 AB");
      await p.fill('input[name="city"]', "Teststad");
      await p.selectOption('select[name="vatMode"]', "exempt");
      await p.fill('textarea[name="exemptionText"]', "Testtekst vrijstelling (geen echte gegevens).");
      await p.getByRole("button", { name: "Opslaan" }).click();
      await p.getByText("Je kunt nu facturen uitgeven").waitFor();
      await p.goto(invoiceUrl);
      await p.getByText("Totaal: € 45,00").waitFor();
      await p.locator('input[name="paidNow"]').check();
      p.once("dialog", (d) => d.accept());
      await p.getByRole("button", { name: "Factuur uitgeven" }).click();
      await p.waitForURL(/melding=uitgegeven/);
      await p.getByText(/Factuur GBD-\d{4}-\d{4} is uitgegeven/).waitFor();
      await p.reload({ waitUntil: "networkidle" });
      const pdf = await p.request.get(`${invoiceUrl}/pdf`);
      assert.equal(pdf.headers()["content-type"], "application/pdf");
      assert.equal((await pdf.body()).subarray(0, 5).toString(), "%PDF-");
      const since = Date.now() - 1000;
      await p.waitForTimeout(800); // hydration after the reload
      const mailButton = p.getByRole("button", { name: /PDF mailen naar test\.klant@example\.com/ });
      await mailButton.scrollIntoViewIfNeeded();
      await mailButton.click();
      const notice = p.locator("form", { has: mailButton }).locator('[role="alert"], [role="status"]').first();
      await notice.waitFor();
      assert.match(await notice.innerText(), /verzendwachtrij/);
      let mail;
      for (let i = 0; i < 30 && !mail; i++) {
        await new Promise((r) => setTimeout(r, 300));
        mail = mailsSince(since).find((m) => m.attachments.some((a) => /^factuur-GBD-\d{4}-\d{4}\.pdf$/.test(a)));
      }
      assert.ok(mail, "invoice email with PDF attachment received");
      assert.match(mail.to, /test\.klant@example\.com/);
      await p.reload();
      await p.getByText("verstuurd").first().waitFor();
    });

    await step("Finance shows recorded revenue only; customer profile shows visits and payments", async () => {
      await p.goto(`${BASE}/agenda/financien?p=year`);
      await p.getByText("Omzet (ontvangen)").waitFor();
      assert.match(await p.locator("main").innerText(), /€ 45,00/);
      const pdf = await p.request.get(`${BASE}/agenda/financien/rapport?p=year`);
      assert.equal((await pdf.body()).subarray(0, 5).toString(), "%PDF-");
      await p.goto(`${BASE}/agenda/klanten?q=Test`);
      await p.getByRole("link", { name: /Test Klant/ }).first().click();
      await p.getByText("Betaald (vastgelegd)").waitFor();
      await p.getByText("Wenkbrauwen × 1").waitFor();
      await p.getByText("Het consultatieformulier staat uit").waitFor();
    });

    await step("Reviews: a submitted review is only public after moderation", async () => {
      const body = `Rustige en duidelijke behandeling, test ${Date.now()}.`;
      const r = await fetch(`${BASE}/api/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: BASE, "x-real-ip": `198.51.100.${(Date.now() % 150) + 60}` },
        body: JSON.stringify({ rating: 5, body, displayName: "Testklant", displayMode: "name", privacy: true, locale: "nl", company: "", elapsedMs: 5000, turnstileToken: `e2e-review-${Date.now()}` }),
      });
      assert.equal(r.status, 200);
      assert.ok(!(await (await fetch(`${BASE}/beoordelingen`)).text()).includes(body), "not public before moderation");
      await p.goto(`${BASE}/admin/beoordelingen`);
      await p.getByText(body).waitFor();
      await p.getByRole("button", { name: "Publiceren", exact: true }).first().click();
      await p.getByText("Gepubliceerd op de website").waitFor();
      assert.ok((await (await fetch(`${BASE}/beoordelingen`)).text()).includes(body), "public after moderation");
    });

    await step("Social media: a link appears in the footer only after it is set and enabled", async () => {
      assert.ok(!(await (await fetch(`${BASE}/`)).text()).includes("instagram.com/glowtest"));
      await p.goto(`${BASE}/admin/social`);
      const ig = p.locator("li", { hasText: "Instagram" });
      await ig.locator('input[type="url"]').fill("https://www.instagram.com/glowtest");
      await ig.locator('input[type="checkbox"]').check();
      await p.getByRole("button", { name: "Publiceren", exact: true }).click();
      await p.getByText("Gepubliceerd (versie").waitFor();
      assert.ok((await (await fetch(`${BASE}/`)).text()).includes("https://www.instagram.com/glowtest"));
      await ig.locator('input[type="checkbox"]').uncheck();
      await p.getByRole("button", { name: "Publiceren", exact: true }).click();
      await p.getByText("Gepubliceerd (versie").waitFor();
    });

    await step("central /login: a signed-in owner chooses Websitebeheer or Agenda; /ajanda redirects", async () => {
      await p.goto(`${BASE}/login`);
      await p.getByRole("heading", { name: "Waar wil je naartoe?" }).waitFor();
      await p.getByRole("link", { name: /Agenda/ }).first().click();
      await p.waitForURL(/\/agenda$/);
      const r = await fetch(`${BASE}/ajanda/klanten`, { redirect: "manual" });
      assert.equal(r.status, 308);
      assert.match(r.headers.get("location") || "", /\/agenda\/klanten$/);
      const home = await (await fetch(`${BASE}/`)).text();
      assert.match(home, /href="\/login"[^>]*>Inloggen</, "discreet footer login link");
    });

    await step("catalogue: a draft is published only after confirmation, and unpublishing hides it again", async () => {
      await p.goto(`${BASE}/admin/behandelingen`);
      const sec = p
        .locator("details", { has: p.locator('input[name="id"][value="facial"]') })
        .filter({ has: p.locator(":scope > summary", { hasText: "Categorie-instellingen" }) })
        .first();
      await sec.locator(":scope > summary").click();
      await sec.locator('select[name="status"]').selectOption("published");
      await sec.locator('input[name="confirm"]').check();
      await sec.getByRole("button", { name: "Categorie opslaan" }).click();
      await sec.getByText("Gepubliceerde behandelingen in deze categorie").waitFor();
      const item = p.locator("details").filter({ has: p.locator(":scope > summary").filter({ hasText: "Gezichtspeeling" }) }).first();
      await item.locator(":scope > summary").click();
      await item.locator('select[name="pricingMode"]').selectOption("fixed");
      await item.locator('input[name="price"]').fill("55");
      await item.locator('input[name="duration"]').fill("50");
      await item.locator('select[name="status"]').selectOption("published");
      await item.getByRole("button", { name: "Opslaan" }).click();
      await item.getByText("Bevestig dat je deze behandeling echt aanbiedt").waitFor();
      await item.locator('input[name="confirm"]').check();
      await item.getByRole("button", { name: "Opslaan" }).click();
      await item.getByText("Opgeslagen en gepubliceerd").waitFor();
      const page = await fetch(`${BASE}/gezichtsbehandelingen/gezichtspeeling`);
      assert.equal(page.status, 200);
      const html = (await page.text()).replace(/\u00a0|&nbsp;|&#160;/g, " ");
      assert.match(html, /€ ?55/);
      assert.equal((await fetch(`${BASE}/gezichtsbehandelingen/gezichtsmasker`)).status, 404, "other drafts stay hidden");
      await p.reload();
      const again = p.locator("details").filter({ has: p.locator(":scope > summary").filter({ hasText: "Gezichtspeeling" }) }).first();
      await again.locator(":scope > summary").click();
      await again.locator('select[name="status"]').selectOption("draft");
      await again.getByRole("button", { name: "Opslaan" }).click();
      await again.getByText("Opgeslagen.").waitFor();
      assert.equal((await fetch(`${BASE}/gezichtsbehandelingen/gezichtspeeling`)).status, 404);
    });

    await step("price on request: proposal email, customer accepts via the personal link, agreed price recorded", async () => {
      const email = `offerte.${Date.now()}@example.com`;
      await p.goto(`${BASE}/agenda/afspraak/nieuw`);
      const day = new Date(Date.now() + 12 * 864e5);
      while ([0, 6].includes(day.getUTCDay())) day.setUTCDate(day.getUTCDate() + 1);
      await p.locator("label", { hasText: "Complete gezichtsbehandeling" }).click();
      await p.fill("#day", day.toISOString().slice(0, 10));
      await p.fill("#time", "11:00");
      await p.fill("#duration", "60");
      await p.fill("#firstName", "Offerte");
      await p.fill("#lastName", `Klant${Date.now() % 10000}`);
      await p.fill("#email", email);
      await p.getByRole("button", { name: "Afspraak opslaan" }).click();
      await p.waitForURL(/\/agenda\/afspraak\/\d+\?opgeslagen=1/);
      const apptUrl = p.url().split("?")[0];
      const since = Date.now() - 1000;
      await p.fill('input[name="amount"]', "65");
      await p.getByRole("button", { name: "Prijsvoorstel versturen" }).click();
      await p.getByText("Prijsvoorstel verstuurd").waitFor();
      let link = null;
      for (let i = 0; i < 40 && !link; i++) {
        const m = mailsSince(since).find((x) => /prijsvoorstel/i.test(x.subject) && x.to.includes(email));
        if (m) {
          const body = m.raw.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_x, h) => String.fromCharCode(parseInt(h, 16)));
          link = (body.match(/\/offerte\/([A-Za-z0-9_-]{40,60})/) || [])[0] || null;
        }
        if (!link) await new Promise((r) => setTimeout(r, 500));
      }
      assert.ok(link, "proposal email with personal link received");
      const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const v = await c.newPage();
      const res = await v.goto(`${BASE}${link}`);
      assert.match(res.headers()["x-robots-tag"] || "", /noindex/);
      await v.getByText("€ 65,00").first().waitFor();
      await v.getByRole("button", { name: "Ik ga akkoord" }).click();
      await v.getByText("Je hebt het voorstel geaccepteerd").waitFor();
      await v.reload();
      await v.getByText("Dit voorstel is al geaccepteerd.").waitFor();
      await c.close();
      await p.goto(apptUrl);
      await p.getByText("Geaccepteerd").first().waitFor();
      const txt = (await p.locator("main").innerText()).replace(/\u00a0/g, " ");
      assert.match(txt, /Prijs\s*€ 65,00/);
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
      await p.goto(`${BASE}/agenda`);
      assert.match(p.url(), /\/agenda\/login/);
    });
  } catch {
    /* reported below */
  } finally {
    await browser.close();
    console.log(results.join("\n"));
    if (results.some((r) => r.startsWith("✗"))) process.exit(1);
  }
})();
