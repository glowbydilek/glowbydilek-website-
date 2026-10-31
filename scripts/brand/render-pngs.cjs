/**
 * Renders PNG brand assets from the generated SVGs using Playwright/Chromium.
 * Run after generate-logos.py:  node scripts/brand/render-pngs.cjs
 * (Requires a local Playwright + Chromium install; not needed for the site build.)
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const fontDir = path.join(root, "node_modules/@fontsource-variable");
const svg = (f) => fs.readFileSync(path.join(root, "public/brand", f), "utf8");
const css = `
@font-face{font-family:Corm;src:url(file://${fontDir}/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2)}
@font-face{font-family:CormI;font-style:italic;src:url(file://${fontDir}/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2)}
@font-face{font-family:Jost;src:url(file://${fontDir}/jost/files/jost-latin-wght-normal.woff2)}
*{margin:0;box-sizing:border-box} body{width:var(--w);height:var(--h);overflow:hidden}`;

const og = (lang) => {
  const t = lang === "nl"
    ? { a: "Zacht voor je huid.", b: "Rustig voor jou.", c: "Waxstudio · op afspraak" }
    : { a: "Gentle on your skin.", b: "Calm for you.", c: "Waxing studio · by appointment" };
  return `<body style="--w:1200px;--h:630px;display:flex;background:#f8f5ef">
  <div style="flex:1.1;padding:70px 64px;display:flex;flex-direction:column;justify-content:space-between">
    <div style="height:64px">${svg("logo-horizontal.svg").replace(/width="[^"]*" height="[^"]*"/, 'height="64"')}</div>
    <div>
      <div style="font-family:Corm;font-weight:500;font-size:74px;line-height:1.02;color:#292724;letter-spacing:-2px">${t.a}<br><span style="font-family:CormI;font-weight:400;font-style:italic;color:#85663a">${t.b}</span></div>
      <div style="margin-top:30px;font-family:Jost;font-size:20px;letter-spacing:6px;text-transform:uppercase;color:#6b645d">${t.c}</div>
    </div>
    <div style="font-family:Jost;font-size:20px;color:#292724;letter-spacing:1px">glowbydilek.nl</div>
  </div>
  <div style="flex:0.9;position:relative;background:radial-gradient(70% 55% at 55% 35%,rgba(255,255,255,.75),rgba(255,255,255,0) 60%),linear-gradient(160deg,#f3e8e0,#e8d4c7 55%,#dcc6b6);display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:28px;border:1px solid rgba(197,164,119,.55);border-radius:999px 999px 28px 28px"></div>
    <div style="width:440px">${svg("logo-stacked.svg").replace(/width="[^"]*" height="[^"]*"/, 'width="440"')}</div>
  </div></body>`;
};

const jobs = [
  { out: "src/app/apple-icon.png", w: 180, h: 180, html: `<body style="--w:180px;--h:180px">${svg("favicon.svg").replace(/width="[^"]*" height="[^"]*"/, 'width="180" height="180"').replace(/rx="[^"]*"/, 'rx="0"')}</body>` },
  { out: "public/brand/profile-icon.png", w: 1080, h: 1080, html: `<body style="--w:1080px;--h:1080px">${svg("profile-icon.svg").replace(/width="[^"]*" height="[^"]*"/, 'width="1080" height="1080"')}</body>` },
  { out: "public/brand/icon-512.png", w: 512, h: 512, html: `<body style="--w:512px;--h:512px">${svg("favicon.svg").replace(/width="[^"]*" height="[^"]*"/, 'width="512" height="512"').replace(/rx="[^"]*"/, 'rx="0"')}</body>` },
  { out: "public/images/og-nl.png", w: 1200, h: 630, html: og("nl") },
  { out: "public/images/og-en.png", w: 1200, h: 630, html: og("en") },
];

(async () => {
  const browser = await chromium.launch();
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.w, height: j.h } });
    const file = path.join(require("os").tmpdir(), `gbd-${path.basename(j.out)}.html`);
    fs.writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${css}</style>${j.html}`);
    await page.goto("file://" + file);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(root, j.out) });
    await page.close();
    console.log("✓", j.out);
  }
  await browser.close();
})();
