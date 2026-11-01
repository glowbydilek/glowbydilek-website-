import type { Locale } from "@/i18n/config";
import type { CategoryId, TreatmentId } from "../slugs";
import { categoriesEn } from "./categories.en";
import { categoriesNl } from "./categories.nl";
import { faqPageEn, guidesEn } from "./guides.en";
import { faqPageNl, guidesNl } from "./guides.nl";
import { treatmentsEn } from "./treatments.en";
import { treatmentsNl } from "./treatments.nl";
import { extraSectionsEn, extraTreatmentsEn } from "./extra.en";
import { extraSectionsNl, extraTreatmentsNl } from "./extra.nl";
import type { CategoryCopy, FaqPageCopy, GuideCopy, GuideKey, SectionCopy, TreatmentCopy } from "./types";
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

const extraTreatments = { nl: extraTreatmentsNl, en: extraTreatmentsEn };
const extraSections = { nl: extraSectionsNl, en: extraSectionsEn };

type Basic = { name: Record<Locale, string>; description: Record<Locale, string> };

/** Generated default copy for an owner-created treatment (all fields editable in Admin). */
export function defaultTreatmentCopy(locale: Locale, b: Basic): TreatmentCopy {
  const name = b.name[locale] || b.name.nl;
  const desc = b.description[locale] || b.description.nl;
  return {
    seoTitle: name,
    seoDescription: desc,
    title: name,
    lead: desc,
    teaser: desc,
    areaTitle: locale === "nl" ? "Wat houdt de behandeling in?" : "What does the treatment involve?",
    area: desc,
    // One blank entry per list gives the admin editor a template to add to.
    appointment: [""],
    know: [""],
    reactions: [""],
    aftercare: [""],
    recovery: "",
    faqs: [{ q: "", a: "" }],
  };
}

/** Drop blank list entries (templates the owner has not filled in) before rendering. */
function tidy<T>(v: T): T {
  if (Array.isArray(v)) {
    return v
      .map((x) => tidy(x))
      .filter((x) => (typeof x === "string" ? x.trim() !== "" : x && typeof x === "object" && "q" in (x as object) ? String((x as { q: string }).q).trim() !== "" : true)) as T;
  }
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tidy(x)])) as T;
  return v;
}

/** Long-form copy of any catalogue item: built-in, draft or owner-created, plus owner edits. */
export function itemCopy(locale: Locale, id: string, basic: Basic): TreatmentCopy {
  const builtin = (treatments[locale] as Record<string, TreatmentCopy>)[id] ?? extraTreatments[locale][id];
  return tidy(withOverride(builtin ?? defaultTreatmentCopy(locale, basic), `treatment:${id}`, locale));
}

export function defaultSectionCopy(locale: Locale, name: string): SectionCopy {
  return {
    seoTitle: name,
    seoDescription: name,
    hero: { eyebrow: name, title: name, titleEm: "", subtitle: "" },
    intro: { title: "", paragraphs: [""] },
    listTitle: name,
    listIntro: locale === "nl" ? "Kies een behandeling voor alle details." : "Choose a treatment for all the details.",
    teaser: "",
    faqs: [{ q: "", a: "" }],
  };
}

export function sectionCopy(locale: Locale, id: string, name: string): SectionCopy {
  return tidy(withOverride(extraSections[locale][id] ?? defaultSectionCopy(locale, name), `section:${id}`, locale));
}

/** Copy of a waxing zone or an owner-created group. */
export function groupCopy(locale: Locale, id: string, name: string): CategoryCopy {
  const builtin = (categories[locale] as Record<string, CategoryCopy>)[id];
  const def: CategoryCopy = builtin ?? {
    seoTitle: name,
    seoDescription: name,
    label: name,
    hero: { eyebrow: name, title: name, titleEm: "", subtitle: "" },
    intro: { title: "", paragraphs: [""] },
    involves: { title: "", paragraphs: [""] },
    expect: { title: "", steps: [{ title: "", body: "" }] },
    suitable: { title: "", items: [""] },
    preparation: [""],
    aftercare: [""],
    precautions: [""],
    faqs: [{ q: "", a: "" }],
    teaser: "",
  };
  const c = tidy(withOverride(def, `category:${id}`, locale));
  return { ...c, expect: { ...c.expect, steps: c.expect.steps.filter((x) => x.title.trim()) } };
}

export function guideCopy(locale: Locale, key: GuideKey): GuideCopy {
  return withOverride(guides[locale][key], `guide:${key}`, locale);
}

export function faqPageCopy(locale: Locale): FaqPageCopy {
  return withOverride(faqPages[locale], "faqpage", locale);
}

export type { CategoryCopy, FaqPageCopy, GuideCopy, GuideKey, SectionCopy, TreatmentCopy };
