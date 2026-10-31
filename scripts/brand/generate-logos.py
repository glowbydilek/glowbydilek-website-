"""
Generates the Glow by Dilek logo system as pure-path SVGs (no font dependency).

Run from the repository root:  python3 scripts/brand/generate-logos.py
Requires: pip install fonttools brotli

Fonts (SIL Open Font License, which permits use in logos):
  Cormorant Garamond (display), Jost (tagline) via @fontsource-variable.
Outputs:
  public/brand/**.svg              final + concept artwork
  src/components/brand/logoData.ts path data used by the React <Logo> components
"""
import json, math, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.getcwd()
FS = os.path.join(ROOT, "node_modules/@fontsource-variable")
ESPRESSO, GOLD, IVORY, GOLD_DEEP = "#20382F", "#B99C6B", "#F4F0E8", "#7A6034"

def load(path, wght):
    f = TTFont(path)
    return instancer.instantiateVariableFont(f, {"wght": wght})

FONTS = {
    "serif": load(f"{FS}/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2", 500),
    "serif-medium": load(f"{FS}/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2", 600),
    "italic": load(f"{FS}/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2", 400),
    "sans": load(f"{FS}/jost/files/jost-latin-wght-normal.woff2", 400),
}

def text_path(font_key, text, size, x=0.0, baseline=0.0, tracking=0.0):
    """Returns (svg path d, advance width) for text at font size `size`."""
    font = FONTS[font_key]
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    s = size / upm
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    cx = x
    for ch in text:
        if ch == " ":
            cx += font["hmtx"]["space"][0] * s + tracking
            continue
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (s, 0, 0, -s, cx, baseline))
        gs[g].draw(tp)
        cx += font["hmtx"][g][0] * s + tracking
    return pen.getCommands(), cx - x - tracking

def text_bounds(font_key, text, size, tracking=0.0):
    font = FONTS[font_key]; gs = font.getGlyphSet(); cmap = font.getBestCmap()
    s = size / font["head"].unitsPerEm
    bp = BoundsPen(gs); cx = 0
    for ch in text:
        if ch == " ":
            cx += font["hmtx"]["space"][0] * s + tracking; continue
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(bp, (s, 0, 0, -s, cx, 0)))
        cx += font["hmtx"][g][0] * s + tracking
    return bp.bounds  # xmin, ymin, xmax, ymax (y-down because of flip)

def f2(v): return f"{v:.2f}".rstrip("0").rstrip(".")

# ---------------------------------------------------------------- Concept A
# "Lumen G": a calligraphic G (thick-thin crescent) with a pearl of light
# resting in its opening — the glow. Works from 16px favicon to signage.
def lumen_mark():
    cx, cy, R = 50.0, 50.0, 44.0
    icx, ir = 54.0, 35.0           # offset inner circle -> thick left, thin right
    a0, a1 = 52.0, 0.0             # gap between 0deg and 52deg (upper right)
    def outer(t): return (cx + R*math.cos(math.radians(t)), cy - R*math.sin(math.radians(t)))
    def inner(t):
        ux, uy = math.cos(math.radians(t)), -math.sin(math.radians(t))
        # intersect ray from (cx,cy) with inner circle
        dx, dy = cx - icx, cy - cy
        b = 2*(ux*dx + uy*dy); c = dx*dx + dy*dy - ir*ir
        tt = (-b + math.sqrt(b*b - 4*c)) / 2
        return (cx + ux*tt, cy + uy*tt)
    po0, po1, pi0, pi1 = outer(a0), outer(a1), inner(a0), inner(a1)
    ring = (f"M{f2(po0[0])} {f2(po0[1])}A{R} {R} 0 1 0 {f2(po1[0])} {f2(po1[1])}"
            f"L{f2(pi1[0])} {f2(pi1[1])}A{ir} {ir} 0 1 1 {f2(pi0[0])} {f2(pi0[1])}Z")
    # crossbar (drawn with the same winding so nonzero fill unions it)
    by0, by1, bx0 = 50.0, 57.0, 58.0
    bx1 = cx + math.sqrt(R*R - (by1-cy)**2)
    bar = f"M{f2(bx0)} {f2(by0)}H{f2(po1[0])}A{R} {R} 0 0 1 {f2(bx1)} {f2(by1)}H{f2(bx0)}Z"
    # pearl of light
    pt = 26.0; pr = 39.5; prad = 6.2
    px, py = cx + pr*math.cos(math.radians(pt)), cy - pr*math.sin(math.radians(pt))
    pearl = (f"M{f2(px-prad)} {f2(py)}a{prad} {prad} 0 1 0 {f2(2*prad)} 0"
             f"a{prad} {prad} 0 1 0 {f2(-2*prad)} 0Z")
    return {"viewBox": "0 0 100 100", "body": ring + bar, "accent": pearl}

# ---------------------------------------------------------------- Concept B
# "Atelier GD": an interlaced G/D monogram inside a slim arch (a mirror /
# doorway — a nod to a future studio).
def atelier_mark():
    g, gw = text_path("italic", "G", 58, 0, 0)
    gb = text_bounds("italic", "G", 58)
    d, dw = text_path("serif", "D", 58, 0, 0)
    db = text_bounds("serif", "D", 58)
    # place D right of centre, G overlapping from the left
    gx, dx, base = 21 - gb[0], 43 - db[0], 72
    g, _ = text_path("italic", "G", 58, gx, base)
    d, _ = text_path("serif", "D", 58, dx, base)
    arch = ("M14 96V44A36 36 0 0 1 86 44V96Z"
            "M16.5 93.5V44A33.5 33.5 0 0 1 83.5 44V93.5Z")  # evenodd frame
    return {"viewBox": "0 0 100 100", "frame": arch, "g": g, "d": d}

# ---------------------------------------------------------------- Concept C
# "Halo": a radiant ring with an off-centre core of light, paired with a
# spaced GLOW wordmark whose O becomes the halo.
def halo_mark():
    outer = "M50 4a46 46 0 1 0 0.01 0Z M50 7.5a42.5 42.5 0 1 1 -0.01 0Z"
    inner = "M50 20a30 30 0 1 0 0.01 0Z M50 30a20 20 0 1 1 -0.01 0Z"
    core = "M58 42a8 8 0 1 0 0.01 0Z"
    return {"viewBox": "0 0 100 100", "outer": outer, "inner": inner, "core": core}

def svg(w, h, inner, bg=None, title="Glow by Dilek"):
    rect = f'<rect width="{f2(w)}" height="{f2(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f2(w)} {f2(h)}" '
            f'width="{f2(w)}" height="{f2(h)}" role="img" aria-label="{title}">'
            f"<title>{title}</title>{rect}{inner}</svg>\n")

def write(rel, content):
    p = os.path.join(ROOT, "public/brand", rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w").write(content)

# ---------------------------------------------------------------- Wordmark
def wordmark(size=40, x=0, baseline=0):
    """'Glow by Dilek' with an italic 'by'. Returns (paths list, width)."""
    parts = []; cx = x
    d, w = text_path("serif", "Glow", size, cx, baseline, tracking=size*0.01); parts.append(d); cx += w + size*0.20
    d, w = text_path("italic", "by", size*0.86, cx, baseline); parts.append(d); cx += w + size*0.20
    d, w = text_path("serif", "Dilek", size, cx, baseline, tracking=size*0.01); parts.append(d); cx += w
    return " ".join(parts), cx - x

def tagline(text, size, x, baseline, tracking_em=0.42):
    return text_path("sans", text.upper(), size, x, baseline, tracking=size*tracking_em)

TAG = "Beauty Studio"
A = lumen_mark()

def lumen_group(x, y, scale, body, accent):
    return (f'<g transform="translate({f2(x)} {f2(y)}) scale({f2(scale)})">'
            f'<path d="{A["body"]}" fill="{body}"/><path d="{A["accent"]}" fill="{accent}"/></g>')

def horizontal(fg, accent, sub, bg=None):
    mark_h = 64; pad = 8
    wm, ww = wordmark(40, mark_h + 22, 44)
    tg, tw = tagline(TAG, 9.2, mark_h + 23, 64)
    W = mark_h + 22 + max(ww, tw) + pad; H = mark_h + 2*pad
    inner = (lumen_group(0, pad, mark_h/100, fg, accent) +
             f'<g transform="translate(0 {pad})"><path d="{wm}" fill="{fg}"/><path d="{tg}" fill="{sub}"/></g>')
    return svg(W, H, inner, bg)

def stacked(fg, accent, sub, bg=None):
    mark = 110
    wm, ww = wordmark(46, 0, 0)
    tg, tw = tagline(TAG, 10.5, 0, 0)
    W = max(ww, tw, mark) + 40
    inner = (lumen_group((W-mark)/2, 16, mark/100, fg, accent) +
             f'<path d="{wm}" fill="{fg}" transform="translate({f2((W-ww)/2)} {f2(16+mark+52)})"/>'
             f'<path d="{tg}" fill="{sub}" transform="translate({f2((W-tw)/2)} {f2(16+mark+80)})"/>')
    return svg(W, 16 + mark + 98, inner, bg)

def icon(fg, accent, bg=None, pad=10, rounded=False):
    s = 100 + 2*pad
    rect = ""
    if bg:
        rect = f'<rect width="{s}" height="{s}" rx="{s*0.22 if rounded else 0}" fill="{bg}"/>'
    return svg(s, s, rect + lumen_group(pad, pad, 1, fg, accent))

# Final (Concept A) system --------------------------------------------------
write("logo-horizontal.svg", horizontal(ESPRESSO, GOLD, "#5F6661"))
write("logo-horizontal-light.svg", horizontal(IVORY, GOLD, "#C9CFC4"))
write("logo-stacked.svg", stacked(ESPRESSO, GOLD, "#5F6661"))
write("logo-stacked-light.svg", stacked(IVORY, GOLD, "#C9CFC4"))
write("logo-icon.svg", icon(ESPRESSO, GOLD))
write("logo-icon-light.svg", icon(IVORY, GOLD))
write("logo-icon-gold.svg", icon(GOLD_DEEP, GOLD_DEEP))
write("profile-icon.svg", svg(1080, 1080,
      f'<rect width="1080" height="1080" fill="{ESPRESSO}"/>' + lumen_group(290, 290, 5, IVORY, GOLD)))
write("favicon.svg", icon(GOLD, IVORY, bg=ESPRESSO, pad=14, rounded=True))
open(os.path.join(ROOT, "src/app/icon.svg"), "w").write(icon(GOLD, IVORY, bg=ESPRESSO, pad=14, rounded=True))

# Concept presentation artwork ----------------------------------------------
write("concepts/concept-a-lumen.svg", horizontal(ESPRESSO, GOLD, "#5F6661"))
write("concepts/concept-a-lumen-icon.svg", icon(ESPRESSO, GOLD))

B = atelier_mark()
def atelier(fg, accent, sub, bg=None):
    mark = 72; pad = 6
    inner_mark = (f'<g transform="translate(0 {pad}) scale({mark/100})">'
                  f'<path d="{B["frame"]}" fill="{accent}" fill-rule="evenodd"/>'
                  f'<path d="{B["d"]}" fill="{fg}"/><path d="{B["g"]}" fill="{accent}"/></g>')
    wm, ww = text_path("serif", "GLOW BY DILEK", 26, mark + 20, pad + 44, tracking=26*0.16)
    tg, tw = tagline(TAG, 8.5, mark + 21, pad + 64)
    W = mark + 20 + max(ww, tw) + 6
    return svg(W, mark + 2*pad, inner_mark + f'<path d="{wm}" fill="{fg}"/><path d="{tg}" fill="{sub}"/>', bg)
write("concepts/concept-b-atelier.svg", atelier(ESPRESSO, GOLD, "#5F6661"))
write("concepts/concept-b-atelier-icon.svg", svg(120, 120,
      f'<g transform="translate(10 10)"><path d="{B["frame"]}" fill="{GOLD}" fill-rule="evenodd"/>'
      f'<path d="{B["d"]}" fill="{ESPRESSO}"/><path d="{B["g"]}" fill="{GOLD}"/></g>'))

C = halo_mark()
def halo_icon_group(x, y, scale, fg, accent):
    return (f'<g transform="translate({f2(x)} {f2(y)}) scale({f2(scale)})">'
            f'<path d="{C["outer"]}" fill="{accent}" fill-rule="evenodd"/>'
            f'<path d="{C["inner"]}" fill="{fg}" fill-rule="evenodd"/>'
            f'<path d="{C["core"]}" fill="{accent}"/></g>')
def halo(fg, accent, sub, bg=None):
    size = 54; tr = size*0.22
    gl, gw = text_path("serif-medium", "GL", size, 0, 52, tracking=tr)
    ow = size*0.78
    w_, ww = text_path("serif-medium", "W", size, gw + tr + ow + tr, 52)
    by, bw = text_path("italic", "by Dilek", 24, 0, 0)
    total = gw + tr + ow + tr + ww
    inner = (f'<path d="{gl}" fill="{fg}"/>' + halo_icon_group(gw + tr, 52 - size*0.68, ow/100, fg, accent) +
             f'<path d="{w_}" fill="{fg}"/>'
             f'<path d="{by}" fill="{accent}" transform="translate({f2((total-bw)/2)} 90)"/>')
    return svg(total + 4, 100, inner, bg)
write("concepts/concept-c-halo.svg", halo(ESPRESSO, GOLD, "#5F6661"))
write("concepts/concept-c-halo-icon.svg", svg(120, 120, halo_icon_group(10, 10, 1, ESPRESSO, GOLD)))

# Path data for React components ---------------------------------------------
wm, ww = wordmark(40, 0, 0)
wb = text_bounds("serif", "Glow", 40)
tg, tw = tagline(TAG, 9.2, 0, 0)
data = {
    "mark": {"viewBox": A["viewBox"], "body": A["body"], "accent": A["accent"]},
    "wordmark": {"d": wm, "width": round(ww, 2), "ascent": round(-wb[1], 2), "descent": 12},
    "tagline": {"d": tg, "width": round(tw, 2), "text": TAG},
}
ts = ("// Generated by scripts/brand/generate-logos.py — do not edit by hand.\n"
      f"export const logoData = {json.dumps(data, indent=2)} as const;\n")
os.makedirs(os.path.join(ROOT, "src/components/brand"), exist_ok=True)
open(os.path.join(ROOT, "src/components/brand/logoData.ts"), "w").write(ts)
print("ok", ww, tw)
