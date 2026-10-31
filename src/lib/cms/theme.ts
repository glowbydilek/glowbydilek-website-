/**
 * Theme & Design settings (pure, unit-tested). The owner edits tokens; the
 * site renders them as CSS custom properties that override the approved
 * defaults in globals.css. No free CSS: only validated colours and presets.
 */
export type Theme = {
  colors: {
    ivory: string;
    ivory50: string;
    nude: string;
    nudeLight: string;
    stone: string;
    stoneLight: string;
    gold: string;
    goldLight: string;
    goldDeep: string;
    charcoal: string;
    charcoalSoft: string;
    muted: string;
  };
  buttonShape: "pill" | "rounded" | "square";
  headingFont: "cormorant" | "jost";
  headingWeight: 400 | 500 | 600;
  logoHeight: "small" | "medium" | "large";
  headerStyle: "frosted" | "solid";
  footerTone: "charcoal" | "ivory";
  spacing: "compact" | "normal" | "airy";
  radius: "soft" | "subtle" | "none";
};

export const APPROVED_THEME: Theme = {
  colors: {
    ivory: "#f8f5ef",
    ivory50: "#fcfaf6",
    nude: "#e9d5c7",
    nudeLight: "#f4e9e1",
    stone: "#ddd2c4",
    stoneLight: "#ece5dc",
    gold: "#c4a16f",
    goldLight: "#e2cda8",
    goldDeep: "#765930",
    charcoal: "#292724",
    charcoalSoft: "#4a443f",
    muted: "#635b54",
  },
  buttonShape: "pill",
  headingFont: "cormorant",
  headingWeight: 500,
  logoHeight: "medium",
  headerStyle: "frosted",
  footerTone: "charcoal",
  spacing: "normal",
  radius: "soft",
};

export const COLOR_LABELS: Record<keyof Theme["colors"], string> = {
  ivory: "Achtergrond (ivoor)",
  ivory50: "Kaarten en invoervelden",
  nude: "Nude",
  nudeLight: "Lichte nude (secties)",
  stone: "Steen (lijnen)",
  stoneLight: "Lichte steen (secties)",
  gold: "Champagnegoud (accenten)",
  goldLight: "Licht goud",
  goldDeep: "Donker goud (kleine tekst, accenten in koppen)",
  charcoal: "Antraciet (tekst, knoppen, footer)",
  charcoalSoft: "Zachte antraciet (lopende tekst)",
  muted: "Gedempte tekst",
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
  ["charcoal", "ivory", "Tekst op achtergrond"],
  ["charcoalSoft", "ivory", "Lopende tekst"],
  ["muted", "ivory", "Gedempte tekst"],
  ["muted", "stoneLight", "Gedempte tekst op lichte steen"],
  ["goldDeep", "ivory", "Donker goud op achtergrond"],
  ["goldDeep", "nudeLight", "Donker goud op lichte nude"],
  ["ivory", "charcoal", "Lichte tekst op knoppen/footer"],
  ["charcoal", "gold", "Tekst op gouden knop"],
  ["gold", "charcoal", "Goud op antraciet (footer)"],
];

/** Validates and normalises a theme. Errors are Dutch messages for the owner. */
export function validateTheme(input: unknown): { theme: Theme; errors: string[] } {
  const t = (input ?? {}) as Partial<Theme>;
  const errors: string[] = [];
  const colors = { ...APPROVED_THEME.colors };
  for (const k of Object.keys(colors) as (keyof Theme["colors"])[]) {
    const v = t.colors?.[k];
    if (v === undefined) continue;
    if (typeof v !== "string" || !HEX.test(v)) errors.push(`${COLOR_LABELS[k]}: gebruik een kleurcode zoals #c4a16f.`);
    else colors[k] = v.toLowerCase();
  }
  const pick = <K extends keyof Theme>(k: K, allowed: readonly Theme[K][]): Theme[K] => (allowed.includes(t[k] as Theme[K]) ? (t[k] as Theme[K]) : APPROVED_THEME[k]);
  const theme: Theme = {
    colors,
    buttonShape: pick("buttonShape", ["pill", "rounded", "square"]),
    headingFont: pick("headingFont", ["cormorant", "jost"]),
    headingWeight: pick("headingWeight", [400, 500, 600]),
    logoHeight: pick("logoHeight", ["small", "medium", "large"]),
    headerStyle: pick("headerStyle", ["frosted", "solid"]),
    footerTone: pick("footerTone", ["charcoal", "ivory"]),
    spacing: pick("spacing", ["compact", "normal", "airy"]),
    radius: pick("radius", ["soft", "subtle", "none"]),
  };
  for (const [fg, bg, label] of PAIRS) {
    const c = contrast(theme.colors[fg], theme.colors[bg]);
    if (c < 4.5) errors.push(`${label} is slecht leesbaar (contrast ${c}:1, minimaal 4,5:1 nodig).`);
  }
  return { theme, errors };
}

/** CSS custom properties for the theme (only differences from the approved theme). */
export function themeCss(theme: Theme): string {
  const map: Record<keyof Theme["colors"], string> = {
    ivory: "--color-ivory",
    ivory50: "--color-ivory-50",
    nude: "--color-nude",
    nudeLight: "--color-nude-light",
    stone: "--color-stone",
    stoneLight: "--color-stone-light",
    gold: "--color-gold",
    goldLight: "--color-gold-light",
    goldDeep: "--color-gold-deep",
    charcoal: "--color-charcoal",
    charcoalSoft: "--color-charcoal-soft",
    muted: "--color-muted",
  };
  const vars: string[] = [];
  for (const k of Object.keys(map) as (keyof Theme["colors"])[]) {
    if (HEX.test(theme.colors[k]) && theme.colors[k] !== APPROVED_THEME.colors[k]) vars.push(`${map[k]}:${theme.colors[k]}`);
  }
  const radius = { soft: ["1.5rem", "1.75rem"], subtle: ["0.75rem", "0.9rem"], none: ["0.25rem", "0.25rem"] }[theme.radius];
  if (theme.radius !== "soft") vars.push(`--radius-card:${radius[0]}`, `--radius-media:${radius[1]}`);
  const spacing = { compact: ["clamp(2.5rem,1.75rem + 3vw,4.5rem)", "clamp(2rem,1.5rem + 2vw,3.25rem)"], normal: null, airy: ["clamp(4.5rem,3rem + 5vw,8rem)", "clamp(3rem,2rem + 3.5vw,5.5rem)"] }[theme.spacing];
  if (spacing) vars.push(`--space-section:${spacing[0]}`, `--space-section-tight:${spacing[1]}`);
  if (theme.headingFont === "jost") vars.push(`--font-serif:"Jost Variable","Jost",ui-sans-serif,system-ui,sans-serif`);
  const rules: string[] = [];
  if (vars.length) rules.push(`:root{${vars.join(";")}}`);
  if (theme.headingWeight !== 500) rules.push(`h1,h2,h3,h4{font-weight:${theme.headingWeight}}`);
  if (theme.buttonShape !== "pill") rules.push(`.rounded-full.uppercase{border-radius:${theme.buttonShape === "rounded" ? "0.75rem" : "0.2rem"}}`);
  if (theme.logoHeight !== "medium") rules.push(`header a[aria-label^="Glow by Dilek"] svg{height:${theme.logoHeight === "small" ? "2rem" : "3.25rem"}}`);
  if (theme.headerStyle === "solid") rules.push(`header>div[aria-hidden="true"]:first-child{background:var(--color-ivory);backdrop-filter:none}`);
  if (theme.footerTone === "ivory") rules.push(`footer.on-dark{background:var(--color-stone-light);color:var(--color-charcoal)}footer.on-dark .text-ivory,footer.on-dark [class*="text-ivory/"]{color:var(--color-charcoal-soft)}footer.on-dark .text-gold{color:var(--color-gold-deep)}`);
  return rules.join("\n");
}

export const THEME_PRESETS: { id: string; label: string; theme: Theme }[] = [
  { id: "approved", label: "Goedgekeurd Glow-thema (standaard)", theme: APPROVED_THEME },
  {
    id: "warm",
    label: "Warmer nude",
    theme: { ...APPROVED_THEME, colors: { ...APPROVED_THEME.colors, ivory: "#faf4ee", nudeLight: "#f3e3d8", stoneLight: "#efe4da" } },
  },
  { id: "airy", label: "Luchtiger, met meer witruimte", theme: { ...APPROVED_THEME, spacing: "airy" } },
  { id: "compact", label: "Compacter", theme: { ...APPROVED_THEME, spacing: "compact", radius: "subtle" } },
];
