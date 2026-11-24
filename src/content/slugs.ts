import type { Locale } from "@/i18n/config";

/**
 * URL slugs for service pages — kept separate from the long-form copy so the
 * client-side language switcher can map every page to its translation
 * without shipping the page content to the browser.
 */
export const categoryIds = ["face", "body", "intimate"] as const;
export type CategoryId = (typeof categoryIds)[number];

export const treatmentIds = [
  "eyebrows",
  "upper-lip",
  "chin",
  "full-face",
  "underarms",
  "half-arms",
  "full-arms",
  "half-legs",
  "full-legs",
  "back",
  "bikini-line",
  "brazilian",
  "hollywood",
] as const;
export type TreatmentId = (typeof treatmentIds)[number];

export const categorySlugs: Record<CategoryId, Record<Locale, string>> = {
  face: { nl: "gezicht", en: "face", tr: "yuz" },
  body: { nl: "lichaam", en: "body", tr: "vucut" },
  intimate: { nl: "bikini-intiem", en: "bikini-intimate", tr: "bikini-bolgesi" },
};

export const treatmentSlugs: Record<TreatmentId, { category: CategoryId } & Record<Locale, string>> = {
  eyebrows: { category: "face", nl: "wenkbrauwen-waxen", en: "eyebrow-waxing", tr: "kas-agdasi" },
  "upper-lip": { category: "face", nl: "bovenlip-waxen", en: "upper-lip-waxing", tr: "ust-dudak-agdasi" },
  chin: { category: "face", nl: "kin-waxen", en: "chin-waxing", tr: "cene-agdasi" },
  "full-face": { category: "face", nl: "volledig-gezicht-waxen", en: "full-face-waxing", tr: "tum-yuz-agdasi" },
  underarms: { category: "body", nl: "oksels-waxen", en: "underarm-waxing", tr: "koltuk-alti-agdasi" },
  "half-arms": { category: "body", nl: "onderarmen-waxen", en: "half-arm-waxing", tr: "kol-alt-yarisi-agdasi" },
  "full-arms": { category: "body", nl: "hele-armen-waxen", en: "full-arm-waxing", tr: "tum-kol-agdasi" },
  "half-legs": { category: "body", nl: "onderbenen-waxen", en: "half-leg-waxing", tr: "diz-alti-agdasi" },
  "full-legs": { category: "body", nl: "hele-benen-waxen", en: "full-leg-waxing", tr: "tum-bacak-agdasi" },
  back: { category: "body", nl: "rug-waxen", en: "back-waxing", tr: "sirt-agdasi" },
  "bikini-line": { category: "intimate", nl: "bikinilijn-waxen", en: "bikini-line-waxing", tr: "bikini-cizgisi-agdasi" },
  brazilian: { category: "intimate", nl: "brazilian-wax", en: "brazilian-wax", tr: "brezilya-agdasi" },
  hollywood: { category: "intimate", nl: "hollywood-wax", en: "hollywood-wax", tr: "hollywood-agdasi" },
};

/** Related treatments shown at the bottom of each treatment page. */
export const relatedTreatments: Record<TreatmentId, TreatmentId[]> = {
  eyebrows: ["upper-lip", "full-face", "chin"],
  "upper-lip": ["chin", "eyebrows", "full-face"],
  chin: ["upper-lip", "full-face", "eyebrows"],
  "full-face": ["eyebrows", "upper-lip", "chin"],
  underarms: ["half-arms", "full-arms", "bikini-line"],
  "half-arms": ["full-arms", "underarms", "half-legs"],
  "full-arms": ["half-arms", "underarms", "back"],
  "half-legs": ["full-legs", "bikini-line", "underarms"],
  "full-legs": ["half-legs", "bikini-line", "brazilian"],
  back: ["full-arms", "underarms", "full-legs"],
  "bikini-line": ["brazilian", "hollywood", "half-legs"],
  brazilian: ["bikini-line", "hollywood", "full-legs"],
  hollywood: ["brazilian", "bikini-line", "full-legs"],
};

/** Query parameter that preselects a treatment in the appointment form. */
export const bookingParam: Record<Locale, string> = { nl: "behandeling", en: "treatment", tr: "bakim" };

/** Blog articles (code-based content, see src/content/copy/blog.ts). */
export const postIds = ["intimate-waxing-guide", "eyebrows-wax-or-pluck", "first-time-waxing"] as const;
export type PostId = (typeof postIds)[number];

export const postSlugs: Record<PostId, Record<Locale, string>> = {
  "intimate-waxing-guide": {
    nl: "verschil-brazilian-hollywood-bikinilijn",
    en: "brazilian-hollywood-bikini-line-difference",
    tr: "brezilya-hollywood-bikini-cizgisi-farki",
  },
  "eyebrows-wax-or-pluck": { nl: "wenkbrauwen-waxen-of-epileren", en: "eyebrow-waxing-or-plucking", tr: "kas-agdasi-mi-cimbiz-mi" },
  "first-time-waxing": { nl: "voor-het-eerst-waxen", en: "first-time-waxing", tr: "ilk-kez-agda" },
};

/** Publication date per article (ISO date). */
export const postDates: Record<PostId, string> = {
  "intimate-waxing-guide": "2026-11-24",
  "eyebrows-wax-or-pluck": "2026-11-24",
  "first-time-waxing": "2026-11-24",
};
