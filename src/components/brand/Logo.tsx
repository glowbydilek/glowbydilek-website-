import { logoData } from "./logoData";

type Tone = "light" | "dark";

/**
 * Glow by Dilek logo (2026). `light` = for light backgrounds (espresso ink,
 * resin glint); `dark` = for dark backgrounds (porcelain, glow glint).
 * Uses CSS variables so an owner-adjusted theme carries through.
 */
const ink = (t: Tone) => (t === "dark" ? "var(--color-paper)" : "var(--color-ink)");
const spark = (t: Tone) => (t === "dark" ? "var(--color-glow)" : "var(--color-accent)");

export function Logo({ tone = "light", className = "h-10 w-auto", title = "Glow by Dilek" }: { tone?: Tone; className?: string; title?: string }) {
  const d = logoData;
  return (
    <svg viewBox={d.horizontal.viewBox} className={className} role="img" aria-label={title}>
      <path d={d.word} fill={ink(tone)} />
      <path d={d.glint} fill={spark(tone)} />
      <path d={d.by} fill={ink(tone)} transform={`translate(${d.horizontal.byX} 0)`} />
    </svg>
  );
}

/** Inline lockup for the header: "Glow ✦ by Dilek" with a legible italic signature. */
export function LogoInline({ tone = "light", className = "h-9 w-auto", title = "Glow by Dilek" }: { tone?: Tone; className?: string; title?: string }) {
  const d = logoData;
  return (
    <svg viewBox={d.inline.viewBox} className={className} role="img" aria-label={title}>
      <path d={d.word} fill={ink(tone)} />
      <path d={d.glint} fill={spark(tone)} />
      <path d={d.inline.by} fill={ink(tone)} transform={`translate(${d.inline.x} 0)`} />
    </svg>
  );
}

export function LogoStacked({ tone = "light", className = "h-16 w-auto", title = "Glow by Dilek" }: { tone?: Tone; className?: string; title?: string }) {
  const d = logoData;
  return (
    <svg viewBox={d.stacked.viewBox} className={className} role="img" aria-label={title}>
      <path d={d.word} fill={ink(tone)} />
      <path d={d.glint} fill={spark(tone)} />
      <path d={d.byStacked} fill={ink(tone)} transform={`translate(${d.stacked.bx} 34)`} />
    </svg>
  );
}

/** "G" monogram with the glint (decorative unless a title is given). */
export function LogoSymbol({ tone = "light", className = "h-8 w-auto", title }: { tone?: Tone; className?: string; title?: string }) {
  const s = logoData.symbol;
  return (
    <svg viewBox={s.viewBox} className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      <path d={s.G} fill={ink(tone)} transform={`translate(${s.ox} ${s.oy})`} />
      <path d={s.glint} fill={spark(tone)} />
    </svg>
  );
}

/** The glint alone, for small decorative accents. */
export function Glint({ className = "h-3 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 14" className={className} aria-hidden="true" focusable="false">
      <path d="M5 0Q5.8 5.1 10 7Q5.8 8.9 5 14Q4.2 8.9 0 7Q4.2 5.1 5 0Z" fill="currentColor" />
    </svg>
  );
}
