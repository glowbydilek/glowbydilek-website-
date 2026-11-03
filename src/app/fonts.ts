import localFont from "next/font/local";

/**
 * Brand fonts, self-hosted through next/font: preloaded, with size-adjusted
 * fallbacks so text paints immediately without layout shift.
 * Newsreader, Bodoni Moda and Instrument Sans are licensed under the SIL
 * Open Font License 1.1 (files from @fontsource-variable).
 *
 * Each family comes in two subsets. The Latin file holds Dutch and English
 * plus ç ö ü ı; the Latin Extended file adds Turkish İ ğ Ğ ş Ş (and other
 * European letters). The extended face is declared with a unicode-range and
 * placed first in the font stacks (globals.css), so a browser only
 * downloads it on pages that contain those letters, and Turkish words never
 * mix in glyphs from a fallback font.
 */
// next/font needs literal options, so the Latin Extended unicode-range is repeated per family.

/** Headings: Newsreader, sturdier than Bodoni on small, high-density screens. */
export const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-latin-wght-normal.woff2", style: "normal", weight: "200 800" },
    { path: "./fonts/newsreader-latin-wght-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-newsreader",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
export const newsreaderExt = localFont({
  src: [
    { path: "./fonts/newsreader-latin-ext-wght-normal.woff2", style: "normal", weight: "200 800" },
    { path: "./fonts/newsreader-latin-ext-wght-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-newsreader-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

/** Logo wordmark and the optional "Bodoni" theme. */
export const bodoni = localFont({
  src: [
    { path: "./fonts/bodoni-moda-latin-opsz-normal.woff2", style: "normal", weight: "400 900" },
    { path: "./fonts/bodoni-moda-latin-opsz-italic.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--font-bodoni",
  display: "swap",
  preload: false,
  // next/font writes these unquoted: no names that start with a digit (e.g. "Bodoni 72").
  fallback: ["Didot", "Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
export const bodoniExt = localFont({
  src: [
    { path: "./fonts/bodoni-moda-latin-ext-opsz-normal.woff2", style: "normal", weight: "400 900" },
    { path: "./fonts/bodoni-moda-latin-ext-opsz-italic.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--font-bodoni-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

export const instrument = localFont({
  src: [{ path: "./fonts/instrument-sans-latin-wght-normal.woff2", style: "normal", weight: "400 700" }],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});
export const instrumentExt = localFont({
  src: [{ path: "./fonts/instrument-sans-latin-ext-wght-normal.woff2", style: "normal", weight: "400 700" }],
  variable: "--font-instrument-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

export const fontVariables = [newsreader, newsreaderExt, bodoni, bodoniExt, instrument, instrumentExt].map((f) => f.variable).join(" ");
