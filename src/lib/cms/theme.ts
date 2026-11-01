/**
 * Theme & Design settings (pure, unit-tested). The owner edits tokens; the
 * site renders them as CSS custom properties that override the approved
 * defaults in globals.css. No free CSS: only validated colours and presets.
 */
export type Theme = {
  colors: {
    paper: string;
    surface: string;
    sand: string;
    line: string;
    ink: string;
    inkSoft: string;
    muted: string;
    accent: string;
    accentDeep: string;
    glow: string;
    glowSoft: string;
  };
  buttonShape: "pill" | "rounded" | "square";
  headingFont: "bodoni" | "newsreader" | "instrument";
  headingWeight: 340 | 380 | 460;
  logoHeight: "small" | "medium" | "large";
  headerStyle: "frosted" | "solid";
  footerTone: "ink" | "sand";
  spacing: "compact" | "normal" | "airy";
  radius: "editorial" | "soft" | "none";
};

/** The approved identity "Luminous Beauty Atelier": pearl, soft rose, deep plum and rosewood. */
export const APPROVED_THEME: Theme = {
  colors: {
    paper: "#fffcfb",
    surface: "#fcf7f6",
    sand: "#f5e6e7",
    line: "#e6d0d6",
    ink: "#2b202b",
    inkSoft: "#4a3a48",
    muted: "#6b5867",
    accent: "#8e4759",
    accentDeep: "#743749",
    glow: "#e9c9a8",
    glowSoft: "#eee3f2",
  },
  buttonShape: "pill",
  headingFont: "bodoni",
  headingWeight: 380,
  logoHeight: "medium",
  headerStyle: "frosted",
  footerTone: "ink",
  spacing: "normal",
  radius: "editorial",
};

export const COLOR_LABELS: Record<keyof Theme["colors"], string> = {
  paper: "Achtergrond (parel)",
  surface: "Kaarten en invoervelden",
  sand: "Rustige secties (zacht roze)",
  line: "Lijnen",
  ink: "Diep pruim (koppen, knoppen, donkere secties)",
  inkSoft: "Lopende tekst",
  muted: "Gedempte tekst",
  accent: "Rozenhout (accentkleur, links, glinstering)",
  accentDeep: "Donker rozenhout (kleine accenttekst)",
  glow: "Champagne (accent op donker)",
  glowSoft: "Orchidee (gekleurde blokken)",
};

const HEX = /^#[0-9a-f]{6}$/i;

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

/** Text/background pairs used on the site that must stay readable (WCAG AA 4.5:1). */
export const PAIRS: [keyof Theme["colors"], keyof Theme["colors"], string][] = [
  ["ink", "paper", "Tekst op achtergrond"],
  ["inkSoft", "paper", "Lopende tekst"],
  ["muted", "paper", "Gedempte tekst"],
  ["muted", "sand", "Gedempte tekst op zand"],
  ["accent", "paper", "Accentkleur op achtergrond"],
  ["accentDeep", "glowSoft", "Accenttekst op zachte gloed"],
  ["paper", "ink", "Lichte tekst op knoppen en footer"],
  ["paper", "accent", "Tekst op accentknop"],
  ["glow", "ink", "Gloed op donker"],
];

/** Validates and normalises a theme. Errors are Dutch messages for the owner. */
export function validateTheme(input: unknown): { theme: Theme; errors: string[] } {
  const t = (input ?? {}) as Partial<Theme>;
  const errors: string[] = [];
  const colors = { ...APPROVED_THEME.colors };
  for (const k of Object.keys(colors) as (keyof Theme["colors"])[]) {
    const v = t.colors?.[k];
    if (v === undefined) continue;
    if (typeof v !== "string" || !HEX.test(v)) errors.push(`${COLOR_LABELS[k]}: gebruik een kleurcode zoals #a0461e.`);
    else colors[k] = v.toLowerCase();
  }
  const pick = <K extends keyof Theme>(k: K, allowed: readonly Theme[K][]): Theme[K] => (allowed.includes(t[k] as Theme[K]) ? (t[k] as Theme[K]) : APPROVED_THEME[k]);
  const theme: Theme = {
    colors,
    buttonShape: pick("buttonShape", ["pill", "rounded", "square"]),
    headingFont: pick("headingFont", ["bodoni", "newsreader", "instrument"]),
    headingWeight: pick("headingWeight", [340, 380, 460]),
    logoHeight: pick("logoHeight", ["small", "medium", "large"]),
    headerStyle: pick("headerStyle", ["frosted", "solid"]),
    footerTone: pick("footerTone", ["ink", "sand"]),
    spacing: pick("spacing", ["compact", "normal", "airy"]),
    radius: pick("radius", ["editorial", "soft", "none"]),
  };
  for (const [fg, bg, label] of PAIRS) {
    const c = contrast(theme.colors[fg], theme.colors[bg]);
    if (c < 4.5) errors.push(`${label} is slecht leesbaar (contrast ${c}:1, minimaal 4,5:1 nodig).`);
  }
  return { theme, errors };
}

const VAR: Record<keyof Theme["colors"], string> = {
  paper: "--color-paper",
  surface: "--color-surface",
  sand: "--color-sand",
  line: "--color-line",
  ink: "--color-ink",
  inkSoft: "--color-ink-soft",
  muted: "--color-muted",
  accent: "--color-accent",
  accentDeep: "--color-accent-deep",
  glow: "--color-glow",
  glowSoft: "--color-glow-soft",
};

/** CSS custom properties for the theme (only differences from the approved theme). */
export function themeCss(theme: Theme): string {
  const vars: string[] = [];
  for (const k of Object.keys(VAR) as (keyof Theme["colors"])[]) {
    if (HEX.test(theme.colors[k]) && theme.colors[k] !== APPROVED_THEME.colors[k]) vars.push(`${VAR[k]}:${theme.colors[k]}`);
  }
  const radius = { editorial: null, soft: ["1.25rem", "1.25rem"], none: ["0", "0"] }[theme.radius];
  if (radius) vars.push(`--radius-card:${radius[0]}`, `--radius-media:${radius[1]}`);
  const spacing = { compact: ["clamp(2.5rem,1.75rem + 3vw,4.5rem)", "clamp(2rem,1.5rem + 2vw,3.25rem)"], normal: null, airy: ["clamp(4.5rem,3rem + 5vw,8.5rem)", "clamp(3rem,2rem + 3.5vw,5.5rem)"] }[theme.spacing];
  if (spacing) vars.push(`--space-section:${spacing[0]}`, `--space-section-tight:${spacing[1]}`);
  if (theme.headingFont === "newsreader") vars.push(`--font-serif:"Newsreader Variable","Newsreader",Georgia,serif`);
  if (theme.headingFont === "instrument") vars.push(`--font-serif:var(--font-instrument),ui-sans-serif,system-ui,sans-serif`);
  if (theme.headingWeight !== 380) vars.push(`--heading-weight:${theme.headingWeight}`);
  if (theme.buttonShape !== "pill") vars.push(`--radius-button:${theme.buttonShape === "rounded" ? "0.5rem" : "0.125rem"}`);
  const rules: string[] = [];
  if (vars.length) rules.push(`:root{${vars.join(";")}}`);
  if (theme.logoHeight !== "medium") rules.push(`header [data-logo] svg{height:${theme.logoHeight === "small" ? "1.75rem" : "2.75rem"}}`);
  if (theme.headerStyle === "solid") rules.push(`header [data-header-bg]{background:var(--color-paper);backdrop-filter:none;-webkit-backdrop-filter:none}`);
  if (theme.footerTone === "sand")
    rules.push(`footer.on-dark{background:var(--color-sand);color:var(--color-ink)}footer.on-dark [class*="text-paper"]{color:var(--color-ink-soft)}footer.on-dark .text-glow,footer.on-dark .text-accent{color:var(--color-accent-deep)}footer.on-dark [data-logo-light]{display:none}footer.on-dark [data-logo-dark]{display:block}`);
  return rules.join("\n");
}

export const THEME_PRESETS: { id: string; label: string; theme: Theme }[] = [
  { id: "approved", label: "Goedgekeurd thema: Luminous Beauty Atelier (standaard)", theme: APPROVED_THEME },
  { id: "warm", label: "Vorige stijl: porselein en hars", theme: { ...APPROVED_THEME, headingFont: "newsreader", colors: { paper: "#f5f0e8", surface: "#fbf8f3", sand: "#eae1d5", line: "#d9cbba", ink: "#221a17", inkSoft: "#45392f", muted: "#6b5d52", accent: "#a0461e", accentDeep: "#86391a", glow: "#f0d3b4", glowSoft: "#f7e8d8" } } },
  {
    id: "lighter",
    label: "Lichter en zachter",
    theme: { ...APPROVED_THEME, colors: { ...APPROVED_THEME.colors, sand: "#f9eeef", glowSoft: "#f4ecf6" } },
  },
  { id: "airy", label: "Luchtiger, met meer witruimte", theme: { ...APPROVED_THEME, spacing: "airy" } },
  { id: "compact", label: "Compacter", theme: { ...APPROVED_THEME, spacing: "compact" } },
  { id: "soft", label: "Zachtere vormen (afgeronde hoeken)", theme: { ...APPROVED_THEME, radius: "soft", buttonShape: "rounded" } },
];
