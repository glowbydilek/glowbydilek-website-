import { logoData } from "./logoData";

type Tone = "light" | "dark";

/** Colours per background: `light` = on ivory, `dark` = on charcoal. */
function palette(tone: Tone) {
  const c = logoData.colors;
  return tone === "dark"
    ? { petal: c.goldOnDark, leaf: c.goldOnDark, glow: c.goldOnDark, ink: c.ivory, sub: "#CFC5B9" }
    : { petal: c.goldRich, leaf: c.champagne, glow: c.goldRich, ink: c.charcoal, sub: c.charcoalSoft };
}

function SymbolPaths({ tone }: { tone: Tone }) {
  const p = palette(tone);
  return (
    <>
      {logoData.symbol.petals.map((d, i) => (
        <path key={i} d={d} fill={p.petal} fillRule="evenodd" />
      ))}
      <path d={logoData.symbol.leaf} fill={p.leaf} />
      <path d={logoData.symbol.drop} fill={p.petal} />
    </>
  );
}

/** Lotus-and-leaf brand symbol (decorative). */
export function LogoSymbol({ tone = "light", className = "h-8 w-auto" }: { tone?: Tone; className?: string }) {
  return (
    <svg viewBox={logoData.symbol.viewBox} className={className} aria-hidden="true" focusable="false">
      <SymbolPaths tone={tone} />
    </svg>
  );
}

/** Horizontal logo: symbol + "Glow by Dilek" wordmark (+ tagline). Same geometry as public/brand/logo-horizontal.svg. */
export function Logo({
  tone = "light",
  withTagline = true,
  className = "h-11 w-auto",
}: {
  tone?: Tone;
  withTagline?: boolean;
  className?: string;
}) {
  const p = palette(tone);
  const symScale = 0.74;
  const wx = 4 + 120 * symScale + 12;
  const width = Math.max(wx + logoData.wordmarkWidth, wx + 2 + logoData.tagline.width) + 4;
  const height = withTagline ? 86 : 70;
  return (
    <svg viewBox={`0 0 ${width.toFixed(1)} ${height}`} className={className} role="img" aria-label="Glow by Dilek">
      <g transform={`translate(4 2) scale(${symScale})`}>
        <SymbolPaths tone={tone} />
      </g>
      <g transform={`translate(${wx} 50)`}>
        <path d={logoData.glow} fill={p.glow} />
        <path d={logoData.script} fill={p.ink} />
      </g>
      {withTagline && <path d={logoData.tagline.d} fill={p.sub} transform={`translate(${wx + 2} 80)`} />}
    </svg>
  );
}

/** @deprecated kept for compatibility — use LogoSymbol. */
export const LogoMark = LogoSymbol;
