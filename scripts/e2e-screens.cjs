/**
 * Owner preview: logs in on a TEST build (CI test database + local SMTP sink,
 * never production) and saves iPhone-size and desktop screenshots of the
 * Agenda / Admin screens, plus a few public pages. The screenshots are
 * uploaded by the CI "e2e" workflow as a downloadable artifact.
 *
 *   MAIL_DIR=/tmp/mail SHOTS=/tmp/shots node scripts/e2e-screens.cjs http://localhost:3123
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const BASE = (process.argv[2] || "http://localhost:3123").replace(/\/$/, "");
const MAIL_DIR = process.env.MAIL_DIR || "/tmp/mail";
const SHOTS = process.env.SHOTS || "/tmp/shots";
const EMAIL = process.env.OWNER_EMAIL || "hello@glowbydilek.nl";
const PASSWORD = `Preview-${Date.now()}-glow!`;
const stub = `window.turnstile={render(el,o){window.__ts=o;setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){setTimeout(()=>window.__ts&&window.__ts.callback('XXXX.DUMMY.TOKEN.XXXX'),50)},remove(){}};`;
fs.mkdirSync(SHOTS, { recursive: true });

function latestResetLink(since) {
  if (!fs.existsSync(MAIL_DIR)) return null;
  const files = fs.readdirSync(MAIL_DIR).map((f) => path.join(MAIL_DIR, f)).filter((f) => fs.statSync(f).mtimeMs >= since);
  for (const f of files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)) {
    const raw = fs.readFileSync(f, "utf8").replace(/=\r?\n/g, "").replace(/=3D/g, "=");
    const m = raw.match(/https?:\/\/[^\s"<]+\/(admin|agenda)\/wachtwoord-herstellen\?token=[A-Za-z0-9_-]+/);
    if (m) return m[0];
  }
  return null;
}

const PRIVATE = [
  "/agenda",
  "/agenda/meldingen",
  "/agenda/kalender",
  "/agenda/aanvragen",
  "/agenda/afspraak/nieuw",
  "/agenda/klanten",
  "/agenda/intake",
  "/agenda/financien",
  "/agenda/openstaand",
  "/agenda/facturen",
  "/agenda/uitgaven",
  "/agenda/werktijden",
  "/agenda/instellingen",
  "/admin",
  "/admin/prijzen",
  "/admin/behandelingen",
  "/admin/bedrijf",
  "/admin/e-mails",
  "/admin/privacy",
];
const PUBLIC = ["/", "/contact", "/afspraak-maken", "/gezichtsbehandelingen/dieptereinigende-gezichtsbehandeling"];
const name = (u) => (u === "/" ? "home" : u.replace(/^\//, "").replace(/\//g, "_"));

(async () => {
  const browser = await chromium.launch();
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await phone.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
  const p = await phone.newPage();
  const log = [];
  try {
    // Owner sets a password through the normal reset email (as Dilek would).
    const since = Date.now() - 1000;
    await p.goto(`${BASE}/agenda/login`);
    await p.getByRole("link", { name: "Wachtwoord vergeten?" }).click();
    await p.waitForURL(/wachtwoord-vergeten/);
    await p.fill("#email", EMAIL);
    await p.waitForTimeout(500); // security check token
    await p.getByRole("button", { name: "Stuur mij een link" }).click();
    await p.getByText("Als dit e-mailadres bij een account hoort").waitFor();
    let link = null;
    for (let i = 0; i < 40 && !link; i++) {
      await new Promise((r) => setTimeout(r, 300));
      link = latestResetLink(since);
    }
    if (!link) throw new Error("no reset email in the SMTP sink");
    await p.goto(link.replace(/^https?:\/\/[^/]+/, BASE));
    await p.fill("#password", PASSWORD);
    await p.fill("#confirm", PASSWORD);
    await p.getByRole("button", { name: "Wachtwoord opslaan" }).click();
    await p.waitForURL(/\/agenda\/login\?reset=1/);
    await p.fill("#email", EMAIL);
    await p.fill("#password", PASSWORD);
    await p.waitForTimeout(500);
    await p.getByRole("button", { name: "Inloggen" }).click();
    await p.waitForURL(`${BASE}/agenda`);
    log.push("✓ owner login");
  } catch (e) {
    log.push(`✗ login: ${String(e.message).split("\n")[0]}`);
    await p.screenshot({ path: path.join(SHOTS, "login-failed.png"), fullPage: true });
  }

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 860 }, storageState: await phone.storageState() });
  await desktop.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
  const d = await desktop.newPage();
  for (const u of [...PRIVATE, ...PUBLIC]) {
    for (const [label, page] of [["iphone", p], ["desktop", d]]) {
      try {
        const r = await page.goto(BASE + u, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SHOTS, `${label}-${name(u)}.png`), fullPage: true });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        log.push(`${r && r.ok() ? "✓" : "✗"} ${label} ${u} (${r ? r.status() : "?"})${overflow > 1 ? ` horizontal overflow ${overflow}px` : ""}`);
      } catch (e) {
        log.push(`✗ ${label} ${u}: ${String(e.message).split("\n")[0]}`);
      }
    }
  }
  // NL/TR switch: Turkish versions of a few daily screens.
  try {
    await p.goto(`${BASE}/agenda`);
    await p.getByRole("button", { name: "TR" }).first().click();
    await p.waitForTimeout(800);
    for (const u of ["/agenda", "/admin/prijzen", "/agenda/klanten"]) {
      await p.goto(BASE + u, { waitUntil: "networkidle" });
      await p.screenshot({ path: path.join(SHOTS, `iphone-tr-${name(u)}.png`), fullPage: true });
    }
    log.push("✓ Turkish screenshots");
  } catch (e) {
    log.push(`✗ Turkish: ${String(e.message).split("\n")[0]}`);
  }
  fs.writeFileSync(path.join(SHOTS, "report.txt"), log.join("\n") + "\n");
  console.log(log.join("\n"));
  await browser.close();
})();
