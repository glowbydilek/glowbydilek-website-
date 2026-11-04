/**
 * End-to-end: opening hours, holiday closure and staff permissions, against a
 * running build with a TEST database and a local SMTP sink (never production).
 *
 *   OWNER_EMAIL=… OWNER_PASSWORD=… MAIL_DIR=/path/to/sink node scripts/e2e-roles-hours.cjs http://localhost:3123
 *
 * Owner acceptance tests C (Tuesday hours → availability), D (closed day →
 * no slots) and F (a staff account only reaches its own functions).
 */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.OWNER_EMAIL || "hello@glowbydilek.nl";
const PASSWORD = process.env.OWNER_PASSWORD;
const MAIL_DIR = process.env.MAIL_DIR;
const TREATMENT = process.env.E2E_TREATMENT || "brazilian";
const STAFF_EMAIL = `e2e-staff-${Date.now()}@example.invalid`;
const STAFF_PW = `Rustig-ochtend-${Date.now()}`;
const stub = "window.turnstile={render(el,o){window.__ts=o;setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){setTimeout(()=>window.__ts&&window.__ts.callback('XXXX.DUMMY.TOKEN.XXXX'),50)},remove(){}};";
const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    results.push(`✗ ${name}\n    ${String(e.message || e).split("\n")[0]}`);
    throw e;
  }
}
const ymd = (d) => d.toISOString().slice(0, 10);
/** Next given ISO weekday (1 = Monday) at least `min` days ahead. */
function next(weekday, min = 2) {
  const d = new Date(Date.now() + min * 864e5);
  while (((d.getUTCDay() + 6) % 7) + 1 !== weekday) d.setUTCDate(d.getUTCDate() + 1);
  return ymd(d);
}
async function login(page, email, password) {
  await page.goto(`${BASE}/agenda/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.waitForTimeout(400);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 15000 });
}
async function slots(day) {
  const r = await fetch(`${BASE}/api/booking/availability?treatments=${TREATMENT}&from=${day}&to=${day}`);
  const j = await r.json();
  return (j.days || []).find((d) => d.date === day)?.times ?? [];
}
function latestMailTo(to) {
  const files = fs.readdirSync(MAIL_DIR).map((f) => path.join(MAIL_DIR, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    if (raw.includes(to)) return raw.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
  }
  return null;
}

(async () => {
  assert.ok(PASSWORD && MAIL_DIR, "OWNER_PASSWORD and MAIL_DIR are required");
  const browser = await chromium.launch();
  const ctx = async () => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await c.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
    return c;
  };
  const owner = await (await ctx()).newPage();
  const tuesday = next(2);
  const wednesday = next(3);
  try {
    await login(owner, EMAIL, PASSWORD);

    await step("C. Tuesday hours changed to 13:00–15:00 → the booking calendar offers only those times", async () => {
      await owner.goto(`${BASE}/agenda/werktijden`);
      const box = owner.locator("label", { hasText: "Dinsdag" }).locator('input[type="checkbox"]');
      if (!(await box.isChecked())) await box.check();
      await owner.locator('input[name="open-start-2"]').first().fill("13:00");
      await owner.locator('input[name="open-end-2"]').first().fill("15:00");
      await owner.getByRole("button", { name: "Werktijden opslaan" }).click();
      await owner.getByText("Werktijden opgeslagen").waitFor();
      const t = await slots(tuesday);
      assert.ok(t.length > 0, "slots on Tuesday");
      assert.ok(t.every((x) => x >= "13:00" && x < "15:00"), `Tuesday slots ${t.join(",")}`);
      assert.ok(!t.includes("09:00"), "old morning hours gone");
    });

    await step("D. A blocked date (whole day) offers no times; removing the block restores them", async () => {
      const before = await slots(wednesday);
      assert.ok(before.length > 0, "Wednesday open before the block");
      await owner.goto(`${BASE}/agenda/werktijden`);
      await owner.locator('input[name="fromDay"]').fill(wednesday);
      await owner.locator('input[name="toDay"]').fill(wednesday);
      await owner.locator('input[name="reason"]').fill("E2E vakantie (test)");
      await owner.getByRole("button", { name: "Blokkade toevoegen" }).click();
      await owner.waitForTimeout(1200);
      assert.equal((await slots(wednesday)).length, 0, "no times on the blocked day");
      await owner.reload();
      const row = owner.locator("li").filter({ hasText: "E2E vakantie (test)" }).first();
      owner.once("dialog", (d) => d.accept());
      await row.getByRole("button", { name: "Verwijderen" }).click();
      await owner.waitForTimeout(1200);
      assert.ok((await slots(wednesday)).length > 0, "times back after removing the block");
    });

    await step("F1. Owner invites a staff member (role: Medewerker); the invitation email contains a one-time link", async () => {
      await owner.goto(`${BASE}/admin/medewerkers`);
      await owner.fill('input[name="name"]', "E2E Medewerker (test)");
      await owner.fill('input[name="email"]', STAFF_EMAIL);
      await owner.getByRole("button", { name: "Uitnodiging versturen" }).click();
      await owner.getByText(/Uitnodiging verstuurd/).waitFor();
      let mail = null;
      for (let i = 0; i < 20 && !mail; i++) {
        await new Promise((r) => setTimeout(r, 300));
        mail = latestMailTo(STAFF_EMAIL);
      }
      assert.ok(mail, "invitation email");
      const link = mail.match(/https?:\/\/[^\s"<>]+wachtwoord-herstellen\?token=[\w%-]+/)[0].replace(/^https?:\/\/[^/]+/, BASE);
      const staff = await (await ctx()).newPage();
      await staff.goto(link);
      await staff.fill("#password", STAFF_PW);
      await staff.fill("#confirm", STAFF_PW);
      await staff.locator("form button[type=submit]").click();
      await staff.waitForTimeout(1500);
      globalThis.staff = staff;
    });

    await step("F2. Staff can use the calendar, but not finance, intake, settings, website management or staff admin", async () => {
      const s = globalThis.staff;
      await login(s, STAFF_EMAIL, STAFF_PW);
      await s.goto(`${BASE}/agenda/kalender`);
      assert.match(new URL(s.url()).pathname, /^\/agenda\/kalender/);
      const menu = await s.locator("nav").allInnerTexts();
      assert.ok(!menu.join(" ").includes("Financiën") && !menu.join(" ").includes("Facturen"), "no finance in the menu");
      for (const p of ["/agenda/financien", "/agenda/facturen", "/agenda/uitgaven", "/agenda/intake", "/agenda/instellingen", "/agenda/werktijden", "/admin", "/admin/seo", "/admin/behandelingen", "/admin/medewerkers", "/admin/thema"]) {
        await s.goto(`${BASE}${p}`);
        assert.ok(!new URL(s.url()).pathname.startsWith(p) || p === "/agenda", `staff must not open ${p} (got ${s.url()})`);
      }
      const r = await s.request.get(`${BASE}/agenda/financien/export`);
      assert.ok(r.status() >= 400 || !(await r.text()).includes(";"), `finance export refused (${r.status()})`);
      const sm = await s.request.get(`${BASE}/admin/systeem/backup`);
      assert.ok(sm.status() >= 400 || !(sm.headers()["content-disposition"] || "").includes("attachment"), `backup refused (${sm.status()})`);
    });

    await step("F3. Disabling the account signs the staff member out immediately", async () => {
      await owner.goto(`${BASE}/admin/medewerkers`);
      const card = owner.locator("section, div").filter({ hasText: STAFF_EMAIL }).last();
      owner.once("dialog", (d) => d.accept());
      await card.getByRole("button", { name: "Account uitzetten" }).click();
      await owner.getByText(/Account uitgezet/).waitFor();
      const s = globalThis.staff;
      await s.goto(`${BASE}/agenda/kalender`);
      assert.match(new URL(s.url()).pathname, /login/, "signed out");
    });
  } finally {
    console.log(results.join("\n"));
    await browser.close();
  }
})().catch(() => process.exit(1));
