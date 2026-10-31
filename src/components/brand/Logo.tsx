import { logoData } from "./logoData";

type Tone = "dark" | "light";

const tones: Record<Tone, { ink: string; accent: string; sub: string }> = {
  dark: { ink: "var(--color-espresso)", accent: "var(--color-champagne)", sub: "var(--color-espresso-muted)" },
  light: { ink: "var(--color-ivory)", accent: "var(--color-champagne)", sub: "#d9cbbf" },
};

/** The Glow by Dilek symbol: a calligraphic G holding a pearl of light. */
export function LogoMark({
  className = "h-10 w-10",
  tone = "dark",
  ink,
  accent,
}: {
  className?: string;
  tone?: Tone;
  ink?: string;
  accent?: string;
}) {
  const t = tones[tone];
  return (
    <svg viewBox={logoData.mark.viewBox} className={className} aria-hidden="true" focusable="false">
      <path d={logoData.mark.body} fill={ink ?? t.ink} />
      <path d={logoData.mark.accent} fill={accent ?? t.accent} />
    </svg>
  );
}

/** Horizontal logo: symbol + wordmark (+ optional tagline). */
export function Logo({
  tone = "dark",
  withTagline = true,
  className = "h-11",
}: {
  tone?: Tone;
  withTagline?: boolean;
  className?: string;
}) {
  const t = tones[tone];
  const { wordmark, tagline } = logoData;
  const gap = 22;
  const markSize = 64;
  const width = markSize + gap + Math.max(wordmark.width, tagline.width);
  return (
    <svg
      viewBox={`0 0 ${width.toFixed(1)} ${markSize}`}
      className={className}
      role="img"
      aria-label="Glow by Dilek"
    >
      <g transform={`scale(${markSize / 100})`}>
        <path d={logoData.mark.body} fill={t.ink} />
        <path d={logoData.mark.accent} fill={t.accent} />
      </g>
      <path d={wordmark.d} fill={t.ink} transform={`translate(${markSize + gap} ${withTagline ? 37 : 45})`} />
      {withTagline && <path d={tagline.d} fill={t.sub} transform={`translate(${markSize + gap + 1} 57)`} />}
    </svg>
  );
}
