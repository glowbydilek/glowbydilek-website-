/**
 * Logo candidates for owner approval (v13). Does NOT change the live logo:
 * writes docs/review/v13/logo-candidates/*.svg and an overview page.
 *
 *   node scripts/brand/logo-candidates.cjs
 *
 * A — current "Atelier" lockup (reference).
 * B — "Helder": same idea, heavier strokes and a larger italic signature,
 *     so it stays crisp at 28–36 px on a phone.
 * C — "Signatuur": sturdier wordmark with a tracked BY DILEK line under it
 *     and a larger glint; reads well on dark and at small sizes.
 * All are vector outlines from the OFL fonts in ./fonts.
 */
const fs = require("node:fs");
const path = require("node:path");
const fontkit = require("fontkit");

const ROOT = path.join(__dirname, "..", "..");
const FONTS = path.join(__dirname, "fonts");
const OUT = path.join(ROOT, "docs", "review", "v13", "logo-candidates");
const C = { ink: "#2B202B", paper: "#FFFCFB", accent: "#8E4759", glow: "#E9C9A8" };
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
function glint(cx, cy, rad) {
  const w = rad * 0.62;
  const s = rad * 0.13;
  return `M${r(cx)} ${r(cy - rad)}Q${r(cx + s)} ${r(cy - s)} ${r(cx + w)} ${r(cy)}Q${r(cx + s)} ${r(cy + s)} ${r(cx)} ${r(cy + rad)}Q${r(cx - s)} ${r(cy + s)} ${r(cx - w)} ${r(cy)}Q${r(cx - s)} ${r(cy - s)} ${r(cx)} ${r(cy - rad)}Z`;
}
const SERIF = "Newsreader-opsz-wght.ttf";
const ITALIC = "Newsreader-Italic-opsz-wght.ttf";
const SANS = "InstrumentSans-wdth-wght.ttf";
const CAP = 70;

function inline(name, wWord, wBy, bySize, glintR) {
  const word = text(SERIF, "Glow", { opsz: 72, wght: wWord }, 100, -1.2);
  const by = text(ITALIC, "by Dilek", { opsz: 36, wght: wBy }, bySize, 0);
  const x = word.width + 28;
  const vb = `0 ${-CAP - 16} ${r(x + by.width + 6)} ${CAP + 16 + 26}`;
  return (ink, accent) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="Glow by Dilek — ${name}"><path fill="${ink}" d="${word.d}"/><path fill="${accent}" d="${glint(word.width + 9, -CAP + 4, glintR)}"/><path fill="${ink}" transform="translate(${r(x)} 0)" d="${by.d}"/></svg>\n`;
}
function signature() {
  const word = text(SERIF, "Glow", { opsz: 72, wght: 470 }, 100, -0.6);
  const by = text(SANS, "BY DILEK", { wght: 600, wdth: 100 }, 14.5, 6.4);
  const bx = r((word.width - by.width) / 2);
  const vb = `0 ${-CAP - 18} ${r(word.width + 30)} ${CAP + 18 + 46}`;
  return (ink, accent) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="Glow by Dilek — Signatuur"><path fill="${ink}" d="${word.d}"/><path fill="${accent}" d="${glint(word.width + 11, -CAP + 2, 16)}"/><path fill="${ink}" transform="translate(${bx} 36)" d="${by.d}"/></svg>\n`;
}

const candidates = [
  { id: "A", name: "Atelier (huidig)", note: "Huidige lockup: fijne letter, cursieve signatuur.", make: inline("Atelier", 340, 380, 44, 13) },
  { id: "B", name: "Helder", note: "Zelfde stijl, krachtiger lijnen en grotere signatuur: scherp op 28–36 px op een iPhone.", make: inline("Helder", 450, 470, 50, 14) },
  { id: "C", name: "Signatuur", note: "Steviger woordmerk, BY DILEK in gespatieerde kapitalen eronder, grotere glint. Rustig en goed leesbaar op donker.", make: signature() },
];

fs.mkdirSync(OUT, { recursive: true });
let cards = "";
for (const c of candidates) {
  const light = c.make(C.ink, C.accent);
  const dark = c.make(C.paper, C.glow);
  fs.writeFileSync(path.join(OUT, `logo-${c.id}-light-bg.svg`), light);
  fs.writeFileSync(path.join(OUT, `logo-${c.id}-dark-bg.svg`), dark);
  const img = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  cards += `<section><h2>${c.id} · ${c.name}</h2><p>${c.note}</p>
<div class="row light"><img src="${img(light)}" style="height:96px" alt=""><img src="${img(light)}" style="height:36px" alt=""><img src="${img(light)}" style="height:28px" alt=""></div>
<div class="row dark"><img src="${img(dark)}" style="height:96px" alt=""><img src="${img(dark)}" style="height:36px" alt=""><img src="${img(dark)}" style="height:28px" alt=""></div></section>`;
}
fs.writeFileSync(
  path.join(OUT, "index.html"),
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Logo-kandidaten</title>
<style>body{margin:0;padding:24px 16px;background:#fffcfb;color:#2b202b;font:16px/1.5 system-ui}h1{font-weight:500}section{margin:0 0 40px}h2{font-weight:600;font-size:18px;margin:0}p{margin:4px 0 12px;color:#6b5867}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:32px;padding:24px;border-radius:12px}.light{background:#fcf7f6;border:1px solid #e6d0d6}.dark{background:#2b202b;margin-top:8px}img{max-width:100%}</style>
<h1>Glow by Dilek — logo-kandidaten (ter goedkeuring)</h1><p>Elk logo op 96, 36 en 28 px hoogte, op licht en donker. De live website gebruikt nog steeds A tot je een keuze maakt.</p>${cards}`,
);
console.log("written", OUT);
