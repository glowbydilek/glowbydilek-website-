import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Embedded Unicode fonts for every generated PDF (intake forms, invoices,
 * reports). The built-in PDF fonts (Helvetica) only cover WinAnsi, so
 * Turkish letters (ş, ğ, ı, İ) and other Latin-Extended characters came out
 * garbled. Liberation Sans / Serif (SIL Open Font License 1.1, see
 * assets/pdf-fonts/OFL.txt) cover Latin, Latin-1 and Latin Extended-A, plus €.
 * pdfkit embeds only the glyphs used (subset), so the PDFs stay small.
 */
export const PDF_FONT = { body: "Body", bold: "Body-Bold", italic: "Body-Italic", heading: "Heading" } as const;

const FILES: Record<(typeof PDF_FONT)[keyof typeof PDF_FONT], string> = {
  Body: "LiberationSans-Regular.ttf",
  "Body-Bold": "LiberationSans-Bold.ttf",
  "Body-Italic": "LiberationSans-Italic.ttf",
  Heading: "LiberationSerif-Bold.ttf",
};

function fontDir(): string {
  // process.cwd() is the project (dev/test) or the standalone server folder (production);
  // next.config.mjs traces assets/pdf-fonts into the server output.
  const candidates = [path.join(process.cwd(), "assets", "pdf-fonts"), path.join(process.cwd(), "..", "assets", "pdf-fonts")];
  const dir = candidates.find((d) => existsSync(path.join(d, FILES.Body)));
  if (!dir) throw new Error("PDF fonts missing (assets/pdf-fonts)");
  return dir;
}

type Doc = { registerFont: (name: string, src: string) => unknown };

/** Registers the embedded fonts on a pdfkit document. */
export function registerPdfFonts(doc: Doc) {
  const dir = fontDir();
  for (const [name, file] of Object.entries(FILES)) doc.registerFont(name, path.join(dir, file));
}
