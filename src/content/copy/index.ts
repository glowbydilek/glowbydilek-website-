import type { Locale } from "@/i18n/config";
import type { CategoryId, TreatmentId } from "../slugs";
import { categoriesEn } from "./categories.en";
import { categoriesNl } from "./categories.nl";
import { faqPageEn, guidesEn } from "./guides.en";
import { faqPageNl, guidesNl } from "./guides.nl";
import { treatmentsEn } from "./treatments.en";
import { treatmentsNl } from "./treatments.nl";
import type { CategoryCopy, FaqPageCopy, GuideCopy, GuideKey, TreatmentCopy } from "./types";

const categories = { nl: categoriesNl, en: categoriesEn };
const treatments = { nl: treatmentsNl, en: treatmentsEn };
const guides = { nl: guidesNl, en: guidesEn };
const faqPages = { nl: faqPageNl, en: faqPageEn };

export function categoryCopy(locale: Locale, id: CategoryId): CategoryCopy {
  return categories[locale][id];
}

export function treatmentCopy(locale: Locale, id: TreatmentId): TreatmentCopy {
  return treatments[locale][id];
}

export function guideCopy(locale: Locale, key: GuideKey): GuideCopy {
  return guides[locale][key];
}

export function faqPageCopy(locale: Locale): FaqPageCopy {
  return faqPages[locale];
}

export type { CategoryCopy, FaqPageCopy, GuideCopy, GuideKey, TreatmentCopy };
