"""
Glow by Dilek — logo system generator (pure vector paths, no font dependency).

Recreates the owner-approved concept (champagne-gold "Glow", script "by Dilek",
lotus-and-leaf symbol, "PROFESSIONAL WAXING" tagline) as clean, scalable
artwork. All lettering is converted to outlines from SIL Open Font License
fonts (permitted for logo use):
  - Cormorant Garamond (wordmark "Glow")       @fontsource-variable/cormorant-garamond
  - Parisienne (script "by Dilek")            @fontsource/parisienne
  - Jost (tagline)                            @fontsource-variable/jost
The lotus symbol is original geometry (scripts/brand/lotus.py).

Run from the repository root:  npm run brand:logos
Requires: pip install fonttools brotli   (and Playwright for the PNG step)
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from lotus import lotus

ROOT = os.getcwd()
NM = os.path.join(ROOT, "node_modules")

# Brand colours
CHAMPAGNE = "#C4A16F"   # symbol leaf, accents
GOLD_RICH = "#A8834C"   # wordmark/petals on light backgrounds (legible at small sizes)
GOLD_ON_DARK = "#D6B98A"
CHARCOAL = "#292724"
CHARCOAL_SOFT = "#5A524B"
IVORY = "#F8F5EF"

TAGLINE = "Professional Waxing"

def load_var(path, wght):
    return instancer.instantiateVariableFont(TTFont(path), {"wght": wght})

FONTS = {
    "serif": load_var(f"{NM}/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2", 600),
    "script": TTFont(f"{NM}/@fontsource/parisienne/files/parisienne-latin-400-normal.woff2"),
    "sans": load_var(f"{NM}/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2", 420),
}

def f2(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")

def kern_pairs(font):
    """Very small GPOS-free kerning: rely on advances (fonts are well spaced)."""
    return {}

def text(font_key, s, size, x=0.0, baseline=0.0, tracking=0.0):
    font = FONTS[font_key]; gs = font.getGlyphSet(); cmap = font.getBestCmap()
    sc = size / font["head"].unitsPerEm
    pen = SVGPathPen(gs, ntos=f2)
    bp = BoundsPen(gs)
    cx = x
    for ch in s:
        if ch == " ":
            cx += font["hmtx"]["space"][0] * sc + tracking
            continue
        g = cmap[ord(ch)]
        t = (sc, 0, 0, -sc, cx, baseline)
        gs[g].draw(TransformPen(pen, t))
        gs[g].draw(TransformPen(bp, t))
        cx += font["hmtx"][g][0] * sc + tracking
    return pen.getCommands(), cx - x - tracking, bp.bounds  # bounds: xmin, ymin(top), xmax, ymax(bottom)

L = lotus()

def symbol_group(x, y, scale, petal, leaf, drop):
    petals = "".join(f'<path d="{p}" fill="{petal}" fill-rule="evenodd"/>' for p in L["petals"])
    return (f'<g transform="translate({f2(x)} {f2(y)}) scale({f2(scale)})">{petals}'
            f'<path d="{L["swoosh"]}" fill="{leaf}"/><path d="{L["drop"]}" fill="{drop}"/></g>')

def svg(w, h, inner, title="Glow by Dilek", bg=None):
    rect = f'<rect width="{f2(w)}" height="{f2(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f2(w)} {f2(h)}" width="{f2(w)}" height="{f2(h)}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{rect}{inner}</svg>\n')

def write(rel, content):
    p = os.path.join(ROOT, "public/brand", rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w").write(content)

# ---------------------------------------------------------------- wordmark
def wordmark(x, baseline, size, glow_col, script_col):
    """'Glow' (serif) + 'by Dilek' (script). Returns (svg, width, top, bottom)."""
    gd, gw, gb = text("serif", "Glow", size, x, baseline, tracking=-size * 0.01)
    sx = x + gw + size * 0.2
    sd, sw, sb = text("script", "by Dilek", size * 0.86, sx, baseline + size * 0.02)
    out = f'<path d="{gd}" fill="{glow_col}"/><path d="{sd}" fill="{script_col}"/>'
    top = min(gb[1], sb[1]); bottom = max(gb[3], sb[3])
    return out, (sx + sw) - x, top, bottom

# ------------------------------------------------------- horizontal (header)
def horizontal(dark=False, with_tagline=True):
    petal = GOLD_ON_DARK if dark else GOLD_RICH
    leaf = GOLD_ON_DARK if dark else CHAMPAGNE
    glow = GOLD_ON_DARK if dark else GOLD_RICH
    ink = IVORY if dark else CHARCOAL
    sub = "#CFC5B9" if dark else CHARCOAL_SOFT
    sym_scale = 0.74
    sym_w = 120 * sym_scale
    pad = 4
    wx = pad + sym_w + 12
    wm, ww, top, bottom = wordmark(wx, 50, 46, glow, ink)
    parts = [symbol_group(pad, 2, sym_scale, petal, leaf, petal), wm]
    width = wx + ww + pad
    if with_tagline:
        td, tw, _ = text("sans", TAGLINE.upper(), 8.6, wx + 2, 80, tracking=8.6 * 0.36)
        parts.append(f'<path d="{td}" fill="{sub}"/>')
        width = max(width, wx + tw + pad)
    return svg(width, 86 if with_tagline else 70, "".join(parts)), width

# -------------------------------------------------------- stacked (emblem)
def stacked(dark=False):
    import math
    petal = GOLD_ON_DARK if dark else GOLD_RICH
    leaf = GOLD_ON_DARK if dark else CHAMPAGNE
    ink = IVORY if dark else CHARCOAL
    W, H = 560, 440
    cx, cy, r = W / 2, 222, 168
    def pt(deg):
        a = math.radians(deg)
        return cx + r * math.cos(a), cy - r * math.sin(a)
    parts = []
    # Upper arc frames the lotus (from lower-left, over the top, to the right);
    # lower arc cradles the tagline — both open, as in the approved concept.
    (x1, y1), (x2, y2) = pt(200), pt(28)
    parts.append(f'<path d="M{f2(x1)} {f2(y1)}A{r} {r} 0 0 1 {f2(x2)} {f2(y2)}" fill="none" stroke="{leaf}" stroke-width="2.2" stroke-linecap="round"/>')
    (x3, y3), (x4, y4) = pt(236), pt(304)
    parts.append(f'<path d="M{f2(x3)} {f2(y3)}A{r} {r} 0 0 0 {f2(x4)} {f2(y4)}" fill="none" stroke="{leaf}" stroke-width="2" stroke-linecap="round"/>')
    sym_scale = 1.15
    parts.append(symbol_group(cx - 120 * sym_scale / 2 + 4, 74, sym_scale, petal, leaf, petal))
    wm, ww, top, bottom = wordmark(0, 0, 96, petal, ink)
    parts.append(f'<g transform="translate({f2(cx - ww / 2)} 262)">{wm}</g>')
    td, tw, _ = text("sans", TAGLINE.upper(), 15.5, 0, 0, tracking=15.5 * 0.34)
    parts.append(f'<path d="{td}" fill="{ink}" transform="translate({f2(cx - tw / 2)} 330)"/>')
    ly = 324.5
    parts.append(f'<path d="M{f2(cx - tw/2 - 78)} {ly}H{f2(cx - tw/2 - 20)}M{f2(cx + tw/2 + 20)} {ly}H{f2(cx + tw/2 + 78)}" stroke="{leaf}" stroke-width="1.6"/>')
    parts.append(symbol_group(cx - 120 * 0.3 / 2, cy + r - 34, 0.3, petal, leaf, petal))
    return svg(W, H, "".join(parts))

# ----------------------------------------------------------------- symbol
def symbol(dark=False, pad=6, bg=None, rounded=False, solid=False):
    petal = GOLD_ON_DARK if dark else GOLD_RICH
    leaf = GOLD_ON_DARK if dark else CHAMPAGNE
    s = 120 + pad * 2
    rect = f'<rect width="{s}" height="{s}" rx="{s * 0.22 if rounded else 0}" fill="{bg}"/>' if bg else ""
    if solid:
        # simplified, heavier symbol for 16–32 px favicons: filled petals
        from lotus import lotus as lt
        LL = lt(outline=False)
        petals = "".join(f'<path d="{p}" fill="{petal}"/>' for p in LL["petals"])
        g = (f'<g transform="translate({pad} {pad + 21})">{petals}<path d="{LL["swoosh"]}" fill="{leaf}"/>'
             f'<path d="{LL["drop"]}" fill="{petal}"/></g>')
        return svg(s, s, rect + g)
    return svg(s, s, rect + symbol_group(pad, pad + 18, 1, petal, leaf, petal))

# ---------------------------------------------------------------- outputs
os.makedirs(os.path.join(ROOT, "public/brand"), exist_ok=True)
for name in os.listdir(os.path.join(ROOT, "public/brand")):
    if name.endswith(".svg"):
        os.remove(os.path.join(ROOT, "public/brand", name))
h_light, h_w = horizontal(False)
write("logo-horizontal.svg", h_light)
write("logo-horizontal-dark.svg", horizontal(True)[0])
write("logo-wordmark.svg", horizontal(False, with_tagline=False)[0])
write("logo-stacked.svg", stacked(False))
write("logo-stacked-dark.svg", stacked(True))
write("logo-symbol.svg", symbol(False))
write("logo-symbol-dark.svg", symbol(True))
write("favicon.svg", symbol(True, pad=10, bg=CHARCOAL, rounded=True, solid=True))
open(os.path.join(ROOT, "src/app/icon.svg"), "w").write(symbol(True, pad=10, bg=CHARCOAL, rounded=True, solid=True))
write("profile-icon.svg", svg(1080, 1080, f'<rect width="1080" height="1080" fill="{IVORY}"/>'
      f'<g transform="translate(36 160) scale(1.8)">{stacked(False).split("</title>")[1].replace("</svg>", "")}</g>'))

# Path data for the React <Logo>: symbol + wordmark + tagline, light & dark tones
wm_d, wm_w, _t, _b = wordmark(0, 0, 46, "G", "S")
import re
glow_d = re.search(r'd="([^"]+)" fill="G"', wm_d).group(1)
script_d = re.search(r'd="([^"]+)" fill="S"', wm_d).group(1)
tag_d, tag_w, _ = text("sans", TAGLINE.upper(), 8.6, 0, 0, tracking=8.6 * 0.36)
data = {
    "symbol": {"viewBox": L["viewBox"], "petals": L["petals"], "leaf": L["swoosh"], "drop": L["drop"]},
    "glow": glow_d,
    "script": script_d,
    "wordmarkWidth": round(wm_w, 2),
    "tagline": {"d": tag_d, "width": round(tag_w, 2), "text": TAGLINE},
    "colors": {"goldRich": GOLD_RICH, "champagne": CHAMPAGNE, "goldOnDark": GOLD_ON_DARK, "charcoal": CHARCOAL, "charcoalSoft": CHARCOAL_SOFT, "ivory": IVORY},
}
os.makedirs(os.path.join(ROOT, "src/components/brand"), exist_ok=True)
open(os.path.join(ROOT, "src/components/brand/logoData.ts"), "w").write(
    "// Generated by scripts/brand/generate-logos.py — do not edit by hand.\n"
    f"export const logoData = {json.dumps(data, indent=2)} as const;\n")
print("ok horizontal width", round(h_w, 1))
