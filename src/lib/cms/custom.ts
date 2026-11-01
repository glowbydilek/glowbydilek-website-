/** Owner-created information pages (pure helpers). */
export type CustomPageContent = {
  title: string;
  intro: string;
  sections: { heading: string; text: string }[];
  seoTitle: string;
  seoDescription: string;
};

export const BLANK_CUSTOM: CustomPageContent = {
  title: "",
  intro: "",
  sections: [{ heading: "", text: "" }],
  seoTitle: "",
  seoDescription: "",
};

const RESERVED = new Set(["admin", "ajanda", "api", "media", "en", "info", "_next"]);

export function validSlug(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) && s.length <= 80 && !RESERVED.has(s);
}

/** Splits plain text into paragraphs; text is rendered escaped (no HTML). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
