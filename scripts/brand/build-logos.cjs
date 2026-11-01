/**
 * Glow by Dilek — brand asset generator (2026 identity).
 *
 *   npm run brand:logos
 *
 * Builds every logo variant as pure vector paths (no font needed to display
 * them) from the OFL fonts in ./fonts, plus the PNG icons. Re-run after
 * changing proportions here; never edit the generated files by hand.
 *
 * Outputs
 *   public/brand/*.svg               logo variants (light/dark, horizontal, stacked, symbol, app icon)
 *   public/brand/icon-192.png, icon-512.png, profile-icon.png, og-default.png
 *   src/app/icon.svg, src/app/apple-icon.png   favicon + iOS home-screen icon
 *   src/components/brand/logoData.ts           path data for the React <Logo>
 */
const fs = require("node:fs");
const path = require("node:path");
const fontkit = require("fontkit");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..", "..");
const FONTS = path.join(__dirname, "fonts");
const C = { ink: "#2B202B", paper: "#FFFCFB", accent: "#8E4759", glow: "#C69B73", sand: "#F5E6E7" };
const r = (n) => Math.round(n * 100) / 100;

function text(file, str, vars, size, tracking = 0) {
  let f = fontkit.openSync(path.join(FONTS, file));
  if (vars) f = f.getVariation(vars);
  const run = f.layout(str, ["kern", "liga"]);
  const scale = size / f.unitsPerEm;
  let x = 0;
  let d = "";
  run.glyphs.forEach((g, i) => {
    const p = run.positions[i];
    d += g.path.scale(scale, -scale).translate(x + p.xOffset * scale, 0).toSVG();
    x += p.xAdvance * scale + tracking;
  });
  return { d: d.replace(/(\d+\.\d{3})\d+/g, "$1"), width: x - tracking };
}

/** The glint: four-point star of light, long vertical rays, concave sides. */
function glint(cx, cy, rad) {
  const w = rad * 0.62;
  const s = rad * 0.13;
  return `M${r(cx)} ${r(cy - rad)}Q${r(cx + s)} ${r(cy - s)} ${r(cx + w)} ${r(cy)}Q${r(cx + s)} ${r(cy + s)} ${r(cx)} ${r(cy + rad)}Q${r(cx - s)} ${r(cy + s)} ${r(cx - w)} ${r(cy)}Q${r(cx - s)} ${r(cy - s)} ${r(cx)} ${r(cy - rad)}Z`;
}

const SERIF = "Newsreader-opsz-wght.ttf";
const SERIF_ITALIC = "Newsreader-Italic-opsz-wght.ttf";
const SANS = "InstrumentSans-wdth-wght.ttf";
const CAP = 70; // cap height of the wordmark at size 100

const word = text(SERIF, "Glow", { opsz: 72, wght: 340 }, 100, -1.2);
const by = text(SANS, "BY DILEK", { wght: 520, wdth: 100 }, 12.5, 3.6);
const byStacked = text(SANS, "BY DILEK", { wght: 520, wdth: 100 }, 13.5, 5.2);
const G = text(SERIF, "G", { opsz: 72, wght: 380 }, 100);
// Inline lockup for small sizes (header): "by Dilek" in italic, large enough to read on a phone.
const byItalic = text(SERIF_ITALIC, "by Dilek", { opsz: 36, wght: 380 }, 44, 0);
const inlineX = word.width + 28;
const wordGlint = glint(word.width + 9, -CAP + 4, 13);
const byX = word.width + 26;

const svg = (vb, inner, title = "Glow by Dilek") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${inner}</svg>\n`;

const H = { x: 0, y: -CAP - 14, w: r(byX + by.width + 4), h: CAP + 14 + 26 };
const horizontal = (ink, accent) =>
  svg(`${H.x} ${H.y} ${H.w} ${H.h}`, `<path fill="${ink}" d="${word.d}"/><path fill="${accent}" d="${wordGlint}"/><path fill="${ink}" transform="translate(${r(byX)} 0)" d="${by.d}"/>`);
const S = { w: r(word.width + 26), y: -CAP - 14, h: CAP + 14 + 44, bx: r((word.width - byStacked.width) / 2) };
const stacked = (ink, accent) =>
  svg(`0 ${S.y} ${S.w} ${S.h}`, `<path fill="${ink}" d="${word.d}"/><path fill="${accent}" d="${wordGlint}"/><path fill="${ink}" transform="translate(${S.bx} 34)" d="${byStacked.d}"/>`);
const SYM = { size: 140, ox: r((140 - (G.width + 24)) / 2 + 1), oy: 104 };
const symGlint = glint(SYM.ox + G.width + 10, SYM.oy - CAP + 2, 15);
const symbol = (ink, accent, bg) =>
  svg(
    `0 0 ${SYM.size} ${SYM.size}`,
    `${bg ? `<rect width="${SYM.size}" height="${SYM.size}" rx="${bg.rx}" fill="${bg.fill}"/>` : ""}<path fill="${ink}" transform="translate(${SYM.ox} ${SYM.oy})" d="${G.d}"/><path fill="${accent}" d="${symGlint}"/>`,
  );

const out = (rel, content) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};

const I = { y: -CAP - 14, w: r(inlineX + byItalic.width + 2), h: CAP + 14 + 22 };
const inline = (ink, accent) =>
  svg(`0 ${I.y} ${I.w} ${I.h}`, `<path fill="${ink}" d="${word.d}"/><path fill="${accent}" d="${wordGlint}"/><path fill="${ink}" transform="translate(${r(inlineX)} 0)" d="${byItalic.d}"/>`);

const files = {
  "public/brand/glow-by-dilek-logo-inline.svg": inline(C.ink, C.accent),
  "public/brand/glow-by-dilek-logo-inline-light.svg": inline(C.paper, C.glow),
  "public/brand/glow-by-dilek-logo.svg": horizontal(C.ink, C.accent),
  "public/brand/glow-by-dilek-logo-light.svg": horizontal(C.paper, C.glow),
  "public/brand/glow-by-dilek-logo-stacked.svg": stacked(C.ink, C.accent),
  "public/brand/glow-by-dilek-logo-stacked-light.svg": stacked(C.paper, C.glow),
  "public/brand/glow-by-dilek-symbol.svg": symbol(C.ink, C.accent),
  "public/brand/glow-by-dilek-symbol-light.svg": symbol(C.paper, C.glow),
  "public/brand/glow-by-dilek-app-icon.svg": symbol(C.paper, C.glow, { fill: C.ink, rx: 30 }),
  "src/app/icon.svg": symbol(C.paper, C.glow, { fill: C.ink, rx: 30 }),
};
for (const [p, c] of Object.entries(files)) out(p, c);

out(
  "src/components/brand/logoData.ts",
  `/* Generated by scripts/brand/build-logos.cjs — do not edit by hand. */
export const logoData = ${JSON.stringify(
    {
      horizontal: { viewBox: `${H.x} ${H.y} ${H.w} ${H.h}`, byX: r(byX) },
      inline: { viewBox: `0 ${I.y} ${I.w} ${I.h}`, x: r(inlineX), by: byItalic.d },
      stacked: { viewBox: `0 ${S.y} ${S.w} ${S.h}`, bx: S.bx },
      symbol: { viewBox: `0 0 ${SYM.size} ${SYM.size}`, ox: SYM.ox, oy: SYM.oy, G: G.d, glint: symGlint },
      word: word.d,
      by: by.d,
      byStacked: byStacked.d,
      glint: wordGlint,
    },
    null,
    2,
  )} as const;
`,
);

(async () => {
  const app = Buffer.from(files["public/brand/glow-by-dilek-app-icon.svg"]);
  const square = Buffer.from(symbol(C.paper, C.glow, { fill: C.ink, rx: 0 }));
  await sharp(square, { density: 400 }).resize(512, 512).png().toFile(path.join(ROOT, "public/brand/icon-512.png"));
  await sharp(square, { density: 400 }).resize(192, 192).png().toFile(path.join(ROOT, "public/brand/icon-192.png"));
  await sharp(square, { density: 400 }).resize(180, 180).png().toFile(path.join(ROOT, "src/app/apple-icon.png"));
  await sharp(square, { density: 600 }).resize(1080, 1080).png().toFile(path.join(ROOT, "public/brand/profile-icon.png"));
  // Default social image (1200×630): stacked logo on porcelain.
  const logo = await sharp(Buffer.from(files["public/brand/glow-by-dilek-logo-stacked.svg"]), { density: 600 }).resize({ width: 560 }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: C.paper } })
    .composite([{ input: logo, left: Math.round((1200 - meta.width) / 2), top: Math.round((630 - meta.height) / 2) }])
    .png()
    .toFile(path.join(ROOT, "public/brand/og-default.png"));
  void app;
  console.log("[brand] logos and icons written");
})();
