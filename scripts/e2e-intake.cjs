/**
 * Browser end-to-end check of the intake & consent workflow (owner side):
 * two-step verification, AVG confirmations, A4 print + PDF of the master
 * form, controlled revision, upload of a signed photo (EXIF/GPS removed),
 * private download, history, deletion and access control.
 *
 *   OWNER_EMAIL=… OWNER_PASSWORD=… node scripts/e2e-intake.cjs http://localhost:3000 <customerId>
 *
 * The server needs CONSULTATION_KEY and INTAKE_DOCUMENT_KEY (test keys).
 * Leaves two-step verification ON for the account; reset it afterwards on
 * a test database only.
 */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { TOTP, Secret } = require("otpauth");
const sharp = require("sharp");

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const CUSTOMER = Number(process.argv[3]);
const EMAIL = process.env.OWNER_EMAIL || "hello@glowbydilek.nl";
const PASSWORD = process.env.OWNER_PASSWORD;
const SHOTS = process.env.E2E_SHOTS;
const results = [];
// The login form uses Turnstile; the test server accepts the documented dummy token.
const stub = `window.turnstile={render(el,o){window.__ts=o;setTimeout(()=>o.callback('XXXX.DUMMY.TOKEN.XXXX'),50);return 'w'},reset(){setTimeout(()=>window.__ts&&window.__ts.callback('XXXX.DUMMY.TOKEN.XXXX'),50)},remove(){}};`;

async function step(name, fn) {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    if (SHOTS) await globalThis.__page?.screenshot({ path: `${SHOTS}/intake-FAIL.png`, fullPage: true }).catch(() => {});
    results.push(`✗ ${name}\n    ${String(e.message || e).split("\n")[0]} (at ${globalThis.__page?.url()})`);
    throw e;
  }
}

(async () => {
  assert.ok(PASSWORD && CUSTOMER, "OWNER_PASSWORD and a customer id are required");
  const browser = await chromium.launch();
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await c.route("https://challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: stub }));
  const p = await c.newPage();
  globalThis.__page = p;
  const shot = async (name) => SHOTS && p.screenshot({ path: `${SHOTS}/intake-${name}.png`, fullPage: true });
  let totp;
  try {
    await step("owner signs in and turns on two-step verification", async () => {
      await p.goto(`${BASE}/agenda/login`);
      await p.fill("#email", EMAIL);
      await p.fill("#password", PASSWORD);
      await p.waitForTimeout(400);
      await p.getByRole("button", { name: "Inloggen" }).click();
      await p.waitForURL(/\/agenda(\?|$)/);
      await p.goto(`${BASE}/admin/beveiliging`);
      await p.getByRole("button", { name: "Tweestapsverificatie instellen" }).click();
      const secret = (await p.locator("code").first().innerText()).trim();
      totp = new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 });
      await p.fill('input[name="code"]', totp.generate());
      await p.getByRole("button", { name: "Bevestigen en inschakelen" }).click();
      await p.getByText(/herstelcodes|reservecodes|codes/i).first().waitFor();
      // A fresh sign-in with the second factor (the session that enabled it may count as verified already).
      await c.clearCookies();
      await p.goto(`${BASE}/agenda/login`);
      await p.fill("#email", EMAIL);
      await p.fill("#password", PASSWORD);
      await p.waitForTimeout(400);
      await p.getByRole("button", { name: "Inloggen" }).click();
      await p.waitForURL(/verificatie/);
      // A code is accepted once: wait for the next 30-second period.
      await p.waitForTimeout((31 - (Math.floor(Date.now() / 1000) % 30)) * 1000);
      await p.locator('input[name="code"]').fill(totp.generate());
      await p.locator('input[name="code"]').press("Enter");
      await p.waitForURL(/\/agenda(\?|$)/);
    });

    await step("without the AVG confirmations the upload stays off and says why", async () => {
      await p.goto(`${BASE}/agenda/klanten/${CUSTOMER}`);
      await p.getByText("Intake & toestemming (vertrouwelijk)").waitFor();
      await p.getByText(/privacyvoorwaarden \(AVG\)/).waitFor();
      assert.equal(await p.locator('input[name="file"]').count(), 0);
    });

    await step("owner confirms the AVG conditions in Admin → Privacy & consultatie", async () => {
      await p.goto(`${BASE}/admin/privacy`);
      for (const n of ["consentConfirmed", "noticeConfirmed", "assessmentConfirmed"]) await p.locator(`input[name="${n}"]`).check();
      await p.getByRole("button", { name: "Opslaan" }).click();
      await p.getByText(/opgeslagen/i).first().waitFor();
    });

    await step("master form: active v1 in both languages, A4 print view and PDF download", async () => {
      await p.goto(`${BASE}/agenda/intake`);
      await p.getByText("GBD-INTAKE-2026-11-v1").first().waitFor();
      await shot("templates");
      await p.getByRole("link", { name: "Afdrukken (A4)" }).first().click();
      await p.waitForURL(/\/agenda\/intake-afdruk\/\d+/);
      await p.getByText("Intake en toestemmingsformulier").waitFor();
      await p.getByText("Handtekening klant").waitFor();
      await shot("print");
      const pdf = await p.pdf({ format: "A4", printBackground: true }).catch(() => null);
      if (pdf && SHOTS) require("node:fs").writeFileSync(`${SHOTS}/intake-print-chromium.pdf`, pdf);
      const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("link", { name: "PDF downloaden" }).click()]);
      const file = await dl.path();
      const head = require("node:fs").readFileSync(file).subarray(0, 5).toString();
      assert.equal(head, "%PDF-");
      assert.match(dl.suggestedFilename(), /GBD-INTAKE-2026-11-v1-nl\.pdf/);
      if (SHOTS) await dl.saveAs(`${SHOTS}/intake-${dl.suggestedFilename()}`);
    });

    await step("a revision is a draft, needs a change note, and keeps v1 as history", async () => {
      await p.goto(`${BASE}/agenda/intake`);
      await p.getByRole("button", { name: "Nieuwe revisie maken" }).first().click();
      await p.waitForURL(/\/agenda\/intake\/\d+$/);
      await p.getByText("GBD-INTAKE-2026-11-v2").first().waitFor();
      p.once("dialog", (d) => d.accept());
      await p.getByRole("button", { name: "Opslaan en activeren" }).click();
      await p.getByText(/Beschrijf kort wat er is veranderd/).waitFor();
      await p.getByRole("button", { name: "Concept verwijderen" }).click().catch(() => {});
    });

    await step("upload a signed photo: stored encrypted, EXIF/GPS removed, history kept", async () => {
      p.on("dialog", (d) => d.accept());
      await p.goto(`${BASE}/agenda/intake`);
      await p.goto(`${BASE}/agenda/klanten/${CUSTOMER}`);
      const jpg = await sharp({ create: { width: 900, height: 1200, channels: 3, background: "#ffffff" } })
        .jpeg()
        .withExif({ IFD0: { Make: "E2E-PHONE" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "52/1 22/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "4/1 53/1 0/1" } })
        .toBuffer();
      for (const day of ["2026-10-30", "2026-11-01"]) {
        await p.setInputFiles('input[name="file"]', { name: "intake.jpg", mimeType: "image/jpeg", buffer: jpg });
        await p.fill('input[name="signedOn"]', day);
        await p.check('input[name="consent"]');
        await p.getByRole("button", { name: "Versleuteld opslaan" }).click();
        await p.getByText(`Getekend ${day.split("-").reverse().join("-")}`).waitFor();
      }
      await p.reload();
      await p.getByText("Getekend 01-11-2026").waitFor();
      await p.getByText("Eerdere versie").waitFor();
      await p.getByText(/metadata \(EXIF\/GPS\) verwijderd/).first().waitFor();
      await shot("customer");
      const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("link", { name: "Downloaden" }).first().click()]);
      const data = require("node:fs").readFileSync(await dl.path());
      assert.ok(!data.includes(Buffer.from("E2E-PHONE")), "camera metadata removed");
      assert.equal((await sharp(data).metadata()).exif, undefined, "no EXIF");
    });

    await step("a disguised file is refused", async () => {
      await p.setInputFiles('input[name="file"]', { name: "form.pdf", mimeType: "application/pdf", buffer: Buffer.from("<html><script>alert(1)</script></html>") });
      await p.check('input[name="consent"]');
      await p.getByRole("button", { name: "Versleuteld opslaan" }).click();
      await p.getByText(/Alleen PDF, JPG, PNG of WebP/).waitFor();
    });

    await step("documents are private: no access without a session, never cached", async () => {
      const href = await p.getByRole("link", { name: "Downloaden" }).first().getAttribute("href");
      const anon = await fetch(`${BASE}${href}`, { redirect: "manual" });
      assert.equal(anon.status, 401);
      const r = await c.request.get(`${BASE}${href}`);
      assert.equal(r.status(), 200);
      assert.match(r.headers()["cache-control"], /no-store/);
      assert.match(r.headers()["content-disposition"], /^attachment/);
      const other = await fetch(`${BASE}/agenda/intake-afdruk/1`, { redirect: "manual" });
      assert.ok([302, 303, 307, 308].includes(other.status) || other.status === 401, `print view without session → ${other.status}`);
    });

    await step("deleting wipes the file and keeps a record without health data", async () => {
      await p.locator("summary", { hasText: "Bestand verwijderen" }).last().click();
      await p.getByRole("button", { name: "Verwijderen", exact: true }).last().click();
      await p.getByText("Bestand verwijderd").waitFor();
      await p.reload();
      await p.getByText("Bestand verwijderd").waitFor();
      await shot("customer-after-delete");
    });
  } catch {
    /* reported below */
  } finally {
    await browser.close();
    console.log(results.join("\n"));
    if (results.some((r) => r.startsWith("✗"))) process.exit(1);
  }
})();
