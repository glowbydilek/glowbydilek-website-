import localFont from "next/font/local";

/**
 * Brand fonts, self-hosted through next/font: preloaded, with size-adjusted
 * fallbacks so text paints immediately without layout shift.
 * Bodoni Moda and Instrument Sans are licensed under the SIL Open Font
 * License 1.1 (files from @fontsource-variable, Latin subset).
 */
export const bodoni = localFont({
  src: [
    { path: "./fonts/bodoni-moda-latin-opsz-normal.woff2", style: "normal", weight: "400 900" },
    { path: "./fonts/bodoni-moda-latin-opsz-italic.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--font-bodoni",
  display: "swap",
  // next/font writes these unquoted: no names that start with a digit (e.g. "Bodoni 72").
  fallback: ["Didot", "Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const instrument = localFont({
  src: [{ path: "./fonts/instrument-sans-latin-wght-normal.woff2", style: "normal", weight: "400 700" }],
  variable: "--font-instrument",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

export const fontVariables = `${bodoni.variable} ${instrument.variable}`;
