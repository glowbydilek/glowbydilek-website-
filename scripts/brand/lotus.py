"""Glow by Dilek lotus symbol — pure vector geometry (no fonts)."""

def petal(cx, base_y, tip_y, half_w, inset=0.0, lean=0.0):
    """Pointed petal from base (cx, base_y) to tip; `lean` shifts the tip sideways."""
    tx = cx + lean
    h = base_y - tip_y
    w = half_w - inset
    by = base_y - inset * 0.6
    ty = tip_y + inset * 1.6
    return (f"M{cx:.2f} {by:.2f}"
            f"C{cx - w:.2f} {by - h*0.30:.2f} {tx - w*0.85:.2f} {ty + h*0.38:.2f} {tx:.2f} {ty:.2f}"
            f"C{tx + w*0.85:.2f} {ty + h*0.38:.2f} {cx + w:.2f} {by - h*0.30:.2f} {cx:.2f} {by:.2f}Z")

def side_petal(bx, by, tx, ty, bulge, inset=0.0, mirror=False):
    """Curved side petal from base (bx,by) to tip (tx,ty)."""
    s = -1 if mirror else 1
    dx, dy = tx - bx, ty - by
    # control points pushed outward/upward to create a leaf curve
    c1 = (bx + dx*0.15 - s*inset*0.2, by - bulge*0.9 + inset)
    c2 = (bx + dx*0.65, ty - bulge*0.35 + inset)
    c3 = (bx + dx*0.80, ty + bulge*0.55 - inset)
    c4 = (bx + dx*0.30 + s*inset*0.3, by + bulge*0.05 - inset*0.2)
    ex, ey = tx - s*inset*1.4, ty + inset*0.6
    sx, sy = bx + s*inset*0.8, by - inset*0.4
    return (f"M{sx:.2f} {sy:.2f}C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {ex:.2f} {ey:.2f}"
            f"C{c3[0]:.2f} {c3[1]:.2f} {c4[0]:.2f} {c4[1]:.2f} {sx:.2f} {sy:.2f}Z")

def lotus(outline=True):
    """Returns dict of path strings in a 120x90 box: petals (evenodd outlines), swoosh, drop."""
    stroke = 2.6
    parts = []
    def add(outer, inner):
        parts.append(outer + (inner if outline else ""))
    # centre petal
    add(petal(60, 58, 6, 13), petal(60, 58, 6, 13, inset=stroke))
    # right inner petal
    add(side_petal(62, 56, 92, 22, 16), side_petal(62, 56, 92, 22, 16, inset=stroke))
    # left inner petal (mirrored)
    add(side_petal(58, 56, 28, 22, 16, mirror=True), side_petal(58, 56, 28, 22, 16, inset=stroke, mirror=True))
    # outer right petal (smaller, lower)
    add(side_petal(70, 58, 112, 40, 9), side_petal(70, 58, 112, 40, 9, inset=stroke*0.9))
    # sweeping leaf (crescent) from left to right, thick in the middle
    swoosh = ("M2 71C28 60 60 54 90 55C104 55.5 112 55 118 50.5"
              "C111 60 99 63.5 82 64C54 65 28 67.5 2 71Z")
    drop = "M108 63.5C110.2 67.8 111.4 70 111.4 71.8A3.4 3.4 0 0 1 104.6 71.8C104.6 70 105.8 67.8 108 63.5Z"
    return {"petals": parts, "swoosh": swoosh, "drop": drop, "viewBox": "0 0 120 84"}
