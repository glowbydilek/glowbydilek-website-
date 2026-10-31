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
  face: { nl: "gezicht", en: "face" },
  body: { nl: "lichaam", en: "body" },
  intimate: { nl: "bikini-intiem", en: "bikini-intimate" },
};

export const treatmentSlugs: Record<TreatmentId, { category: CategoryId } & Record<Locale, string>> = {
  eyebrows: { category: "face", nl: "wenkbrauwen-waxen", en: "eyebrow-waxing" },
  "upper-lip": { category: "face", nl: "bovenlip-waxen", en: "upper-lip-waxing" },
  chin: { category: "face", nl: "kin-waxen", en: "chin-waxing" },
  "full-face": { category: "face", nl: "volledig-gezicht-waxen", en: "full-face-waxing" },
  underarms: { category: "body", nl: "oksels-waxen", en: "underarm-waxing" },
  "half-arms": { category: "body", nl: "onderarmen-waxen", en: "half-arm-waxing" },
  "full-arms": { category: "body", nl: "hele-armen-waxen", en: "full-arm-waxing" },
  "half-legs": { category: "body", nl: "onderbenen-waxen", en: "half-leg-waxing" },
  "full-legs": { category: "body", nl: "hele-benen-waxen", en: "full-leg-waxing" },
  back: { category: "body", nl: "rug-waxen", en: "back-waxing" },
  "bikini-line": { category: "intimate", nl: "bikinilijn-waxen", en: "bikini-line-waxing" },
  brazilian: { category: "intimate", nl: "brazilian-wax", en: "brazilian-wax" },
  hollywood: { category: "intimate", nl: "hollywood-wax", en: "hollywood-wax" },
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
export const bookingParam: Record<Locale, string> = { nl: "behandeling", en: "treatment" };
