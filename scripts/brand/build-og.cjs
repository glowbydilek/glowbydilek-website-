/**
 * Social preview images (Open Graph, 1200×630) for NL and EN:
 *   public/images/og-nl.png, public/images/og-en.png
 *
 * Rendered from HTML with the site's own fonts and the licensed hero photo
 * (Adobe Stock #810843299, representative model — not Dilek, not a client).
 *
 *   node scripts/brand/build-og.cjs
 */
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "../..");
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString("base64");
const font = (p) => `url(data:font/woff2;base64,${b64(p)}) format("woff2")`;
const logo = fs.readFileSync(path.join(ROOT, "public/brand/glow-by-dilek-logo-inline.svg"), "utf8");
const photo = `data:image/webp;base64,${b64("public/images/photos/hero-1024.webp")}`;

const COPY = {
  nl: { eyebrow: "Glow by Dilek · Beauty & relaxation", title: "Jouw moment", em: "om te stralen.", line: "Massage · Waxing · Op afspraak" },
  en: { eyebrow: "Glow by Dilek · Beauty & relaxation", title: "A little moment,", em: "just for you.", line: "Massage · Waxing · By appointment" },
};

const html = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Bodoni; src: ${font("node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-opsz-normal.woff2")}; font-style: normal; font-weight: 400 900; }
@font-face { font-family: Bodoni; src: ${font("node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-opsz-italic.woff2")}; font-style: italic; font-weight: 400 900; }
@font-face { font-family: Sans; src: ${font("node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2")}; font-weight: 400 700; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Sans; color: #2b202b;
  background: radial-gradient(900px 520px at 100% 0%, #eee3f2, transparent 62%), radial-gradient(700px 420px at -10% 110%, #f5e6e7, transparent 64%), #fffcfb; }
.wrap { display: grid; grid-template-columns: 1fr 380px; gap: 64px; padding: 64px 72px 56px; height: 100%; }
.logo svg { height: 44px; width: auto; }
.eyebrow { margin-top: 68px; font-size: 15px; letter-spacing: .24em; text-transform: uppercase; color: #8e4759; font-weight: 560; }
h1 { margin-top: 20px; font-family: Bodoni; font-weight: 400; font-size: 84px; line-height: 1.02; letter-spacing: -0.02em; font-variation-settings: "opsz" 72; }
h1 em { display: block; color: #8e4759; font-style: italic; }
.line { margin-top: 30px; padding-top: 18px; border-top: 1px solid #e6d0d6; font-size: 19px; color: #4a3a48; }
.arch { position: relative; align-self: center; height: 500px; }
.arch::before { content: ""; position: absolute; inset: -12px 12px 12px -12px; border: 1px solid #c69b73; border-radius: 999px 999px 10px 10px; }
.arch img { position: relative; width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; border-radius: 999px 999px 10px 10px; }
.url { position: absolute; left: 72px; bottom: 44px; font-size: 16px; color: #6b5867; letter-spacing: .02em; }
</style></head><body><div class="wrap"><div>
<div class="logo">${logo}</div>
<p class="eyebrow">${c.eyebrow}</p>
<h1>${c.title}<em>${c.em}</em></h1>
<p class="line">${c.line}</p>
</div><div class="arch"><img src="${photo}" alt=""></div></div><p class="url">glowbydilek.nl</p></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const [locale, c] of Object.entries(COPY)) {
    await page.setContent(html(c), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(ROOT, `public/images/og-${locale}.png`), type: "png" });
  }
  await browser.close();
  console.log("[brand] social images written");
})();
