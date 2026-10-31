import type { Locale } from "@/i18n/config";
import type { CategoryId, TreatmentId } from "../slugs";
import { categoriesEn } from "./categories.en";
import { categoriesNl } from "./categories.nl";
import { faqPageEn, guidesEn } from "./guides.en";
import { faqPageNl, guidesNl } from "./guides.nl";
import { treatmentsEn } from "./treatments.en";
import { treatmentsNl } from "./treatments.nl";
import type { CategoryCopy, FaqPageCopy, GuideCopy, GuideKey, TreatmentCopy } from "./types";
import { override } from "../../lib/cms/current";
import { mergeContent } from "../../lib/cms/registry";

const withOverride = <T>(def: T, key: string, locale: Locale): T => {
  const o = override(key, locale);
  return o === undefined ? def : mergeContent(def, o);
};

const categories = { nl: categoriesNl, en: categoriesEn };
const treatments = { nl: treatmentsNl, en: treatmentsEn };
const guides = { nl: guidesNl, en: guidesEn };
const faqPages = { nl: faqPageNl, en: faqPageEn };

export function categoryCopy(locale: Locale, id: CategoryId): CategoryCopy {
  return withOverride(categories[locale][id], `category:${id}`, locale);
}

export function treatmentCopy(locale: Locale, id: TreatmentId): TreatmentCopy {
  return withOverride(treatments[locale][id], `treatment:${id}`, locale);
}

export function guideCopy(locale: Locale, key: GuideKey): GuideCopy {
  return withOverride(guides[locale][key], `guide:${key}`, locale);
}

export function faqPageCopy(locale: Locale): FaqPageCopy {
  return withOverride(faqPages[locale], "faqpage", locale);
}

export type { CategoryCopy, FaqPageCopy, GuideCopy, GuideKey, TreatmentCopy };
