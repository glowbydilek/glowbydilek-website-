/**
 * Registry of editable content documents. Each document has a built-in
 * default (the approved copy in the codebase) per locale; owner edits are
 * stored in the database and merged over it (see store.ts).
 *
 * Pure module: no database access (used by tests and the editor).
 */
import { categoryIds, treatmentIds } from "../../content/slugs";
import { categoriesEn } from "../../content/copy/categories.en";
import { categoriesNl } from "../../content/copy/categories.nl";
import { faqPageEn, guidesEn } from "../../content/copy/guides.en";
import { faqPageNl, guidesNl } from "../../content/copy/guides.nl";
import { treatmentsEn } from "../../content/copy/treatments.en";
import { treatmentsNl } from "../../content/copy/treatments.nl";
import { extraSectionsEn, extraTreatmentsEn } from "../../content/copy/extra.en";
import { extraSectionsNl, extraTreatmentsNl } from "../../content/copy/extra.nl";
import { BUILTIN_ITEMS, BUILTIN_SECTIONS } from "../catalogue/builtin";
import { legalEn } from "../../content/copy/legal.en";
import { legalNl, type LegalKey } from "../../content/copy/legal.nl";

const LEGAL: { key: LegalKey; nl: string; en: string }[] = [
  { key: "cookies", nl: "/cookiebeleid", en: "/en/cookie-policy" },
  { key: "terms", nl: "/algemene-voorwaarden", en: "/en/terms" },
  { key: "cancellation", nl: "/annuleringsbeleid", en: "/en/cancellation-policy" },
  { key: "reviews", nl: "/beoordelingsbeleid", en: "/en/review-policy" },
];
import { en } from "../../i18n/dictionaries/en";
import { nl } from "../../i18n/dictionaries/nl";
import { pagePath, routes, type Locale, type PageRef } from "../../i18n/config";

export type DocKey = string;
export type DocDef = { key: DocKey; label: string; defaults: Record<Locale, unknown> };
export type EditorPage = { id: string; label: string; group: string; docs: { key: DocKey; label: string }[]; paths: Record<Locale, string>; sectionsPage?: string };

const dictSections = Object.keys(nl) as (keyof typeof nl)[];
const DICT_LABELS: Record<string, string> = {
  meta: "Paginatitels (SEO-basis)",
  nav: "Menulabels",
  cta: "Knopteksten",
  common: "Algemene zinnen",
  whatsapp: "WhatsApp",
  trust: "Kernwaarden (homepage)",
  home: "Homepage",
  care: "Voorbereiding & nazorg (tabbladen)",
  faq: "Algemene veelgestelde vragen",
  treatments: "Behandelingenoverzicht",
  prices: "Tarievenpagina",
  about: "Over Dilek",
  contact: "Contactpagina",
  booking: "Afspraakpagina",
  forms: "Formulierteksten en meldingen",
  privacy: "Privacyverklaring",
  footer: "Footer",
  notFound: "Pagina niet gevonden (404)",
  service: "Behandelpagina-onderdelen",
  guide: "Informatiepagina-onderdelen",
  hub: "Homepage: behandelingenblok",
  reviews: "Beoordelingenpagina",
};

export const DOCS: DocDef[] = [
  ...dictSections.map((k) => ({ key: `dict:${k}`, label: DICT_LABELS[k] ?? k, defaults: { nl: nl[k], en: en[k] } })),
  ...categoryIds.map((id) => ({ key: `category:${id}`, label: categoriesNl[id].label, defaults: { nl: categoriesNl[id], en: categoriesEn[id] } })),
  ...treatmentIds.map((id) => ({ key: `treatment:${id}`, label: treatmentsNl[id].title, defaults: { nl: treatmentsNl[id], en: treatmentsEn[id] } })),
  ...Object.keys(extraTreatmentsNl).map((id) => ({ key: `treatment:${id}`, label: extraTreatmentsNl[id].title, defaults: { nl: extraTreatmentsNl[id], en: extraTreatmentsEn[id] } })),
  ...Object.keys(extraSectionsNl).map((id) => ({ key: `section:${id}`, label: extraSectionsNl[id].seoTitle, defaults: { nl: extraSectionsNl[id], en: extraSectionsEn[id] } })),
  ...(["process", "preparation", "aftercare"] as const).map((k) => ({ key: `guide:${k}`, label: guidesNl[k].hero.eyebrow, defaults: { nl: guidesNl[k], en: guidesEn[k] } })),
  { key: "faqpage", label: "Veelgestelde vragen (pagina)", defaults: { nl: faqPageNl, en: faqPageEn } },
  ...LEGAL.map((l) => ({ key: `legal:${l.key}`, label: legalNl[l.key].title, defaults: { nl: legalNl[l.key], en: legalEn[l.key] } })),
];

export const DOC_MAP = new Map(DOCS.map((d) => [d.key, d]));

/** Copy documents of owner-created catalogue entries (no built-in default). */
export const CATALOGUE_DOC = /^(treatment|section|category):[a-z0-9][a-z0-9-]{0,59}$/;

export function isDocKey(key: string): boolean {
  return DOC_MAP.has(key) || /^custom:\d+$/.test(key) || CATALOGUE_DOC.test(key);
}

const p = (page: PageRef) => ({ nl: pagePath("nl", page), en: pagePath("en", page) });

/** Pages as the owner sees them in the editor, each with the documents it uses. */
export const EDITOR_PAGES: EditorPage[] = [
  { id: "home", label: "Homepage", group: "Hoofdpagina's", paths: { ...routes.home }, sectionsPage: "home", docs: [{ key: "dict:home", label: "Teksten" }, { key: "dict:hub", label: "Behandelingenblok" }, { key: "dict:trust", label: "Kernwaarden" }] },
  { id: "treatments", label: "Behandelingen (overzicht)", group: "Hoofdpagina's", paths: { ...routes.treatments }, docs: [{ key: "dict:treatments", label: "Teksten" }] },
  { id: "prices", label: "Tarieven", group: "Hoofdpagina's", paths: { ...routes.prices }, docs: [{ key: "dict:prices", label: "Teksten" }] },
  { id: "about", label: "Over Dilek", group: "Hoofdpagina's", paths: { ...routes.about }, sectionsPage: "about", docs: [{ key: "dict:about", label: "Teksten" }] },
  { id: "contact", label: "Contact", group: "Hoofdpagina's", paths: { ...routes.contact }, docs: [{ key: "dict:contact", label: "Teksten" }] },
  { id: "booking", label: "Afspraak aanvragen", group: "Hoofdpagina's", paths: { ...routes.booking }, docs: [{ key: "dict:booking", label: "Teksten" }] },
  { id: "privacy", label: "Privacyverklaring", group: "Hoofdpagina's", paths: { ...routes.privacy }, docs: [{ key: "dict:privacy", label: "Teksten" }] },
  { id: "faq", label: "Veelgestelde vragen", group: "Informatie", paths: { ...routes.faq }, docs: [{ key: "faqpage", label: "Vragen en antwoorden" }] },
  ...(["process", "preparation", "aftercare"] as const).map((k) => ({ id: k, label: guidesNl[k].hero.eyebrow, group: "Informatie", paths: { ...routes[k] }, docs: [{ key: `guide:${k}`, label: "Teksten" }] })),
  ...categoryIds.map((id) => ({ id: `category-${id}`, label: categoriesNl[id].label, group: "Behandelzones", paths: p({ type: "category", id }), sectionsPage: "category", docs: [{ key: `category:${id}`, label: "Teksten" }] })),
  ...treatmentIds.map((id) => ({ id: `treatment-${id}`, label: treatmentsNl[id].title, group: "Behandelingen", paths: p({ type: "treatment", id }), sectionsPage: "treatment", docs: [{ key: `treatment:${id}`, label: "Teksten" }] })),
  ...BUILTIN_SECTIONS.filter((x) => x.id !== "waxing").map((sec) => ({
    id: `section-${sec.id}`,
    label: sec.name.nl,
    group: "Nieuwe categorieën (concept tot publicatie)",
    paths: { nl: `/${sec.slug.nl}`, en: `/en/${sec.slug.en}` },
    docs: [{ key: `section:${sec.id}`, label: "Teksten" }],
  })),
  ...BUILTIN_ITEMS.filter((i) => i.sectionId !== "waxing").map((i) => {
    const sec = BUILTIN_SECTIONS.find((x) => x.id === i.sectionId)!;
    return {
      id: `treatment-${i.id}`,
      label: i.name.nl,
      group: "Nieuwe categorieën (concept tot publicatie)",
      paths: { nl: `/${sec.slug.nl}/${i.slug.nl}`, en: `/en/${sec.slug.en}/${i.slug.en}` },
      sectionsPage: "treatment",
      docs: [{ key: `treatment:${i.id}`, label: "Teksten" }],
    };
  }),
  ...LEGAL.map((l) => ({ id: `legal-${l.key}`, label: legalNl[l.key].title, group: "Juridisch", paths: { nl: l.nl, en: l.en }, docs: [{ key: `legal:${l.key}`, label: "Tekst" }] })),
  {
    id: "global",
    label: "Algemene teksten (menu, knoppen, footer, formulieren)",
    group: "Algemeen",
    paths: { ...routes.home },
    docs: ["nav", "cta", "common", "footer", "care", "faq", "service", "guide", "forms", "notFound", "whatsapp"].map((k) => ({ key: `dict:${k}`, label: DICT_LABELS[k] })),
  },
];

/** Sections that can be reordered or hidden per page type. */
export const PAGE_SECTIONS: Record<string, { id: string; label: string; locked?: boolean }[]> = {
  home: [
    { id: "hero", label: "Openingsbeeld", locked: true },
    { id: "campaigns", label: "Actieslider (alleen zichtbaar met actieve slides)" },
    { id: "treatments", label: "Ontdek jouw behandeling" },
    { id: "statement", label: "Even helemaal voor jezelf" },
    { id: "standards", label: "Met aandacht voor elk detail" },
    { id: "process", label: "Zo werkt een afspraak" },
    { id: "featured", label: "Uitgelichte behandelingen" },
    { id: "care", label: "Voorbereiding en nazorg" },
    { id: "reviews", label: "Beoordelingen (alleen zichtbaar met gepubliceerde beoordelingen)" },
    { id: "dilek", label: "Maak kennis met Dilek" },
    { id: "faq", label: "Veelgestelde vragen" },
    { id: "closing", label: "Afspraakuitnodiging" },
    { id: "contact", label: "Contactstrook" },
  ],
  about: [
    { id: "hero", label: "Openingsbeeld", locked: true },
    { id: "story", label: "Het verhaal" },
    { id: "education", label: "Opleiding & achtergrond (alleen na publicatie in Over Dilek)" },
    { id: "approach", label: "Werkwijze" },
    { id: "vision", label: "Vooruitkijken" },
    { id: "closing", label: "Afspraakuitnodiging" },
  ],
  category: [
    { id: "hero", label: "Openingsbeeld", locked: true },
    { id: "intro", label: "Introductie" },
    { id: "treatments", label: "Behandelingen in deze zone" },
    { id: "expect", label: "Zo verloopt de afspraak" },
    { id: "info", label: "Voor wie / voorbereiding / nazorg / voorzorg" },
    { id: "faq", label: "Vragen en antwoorden" },
    { id: "others", label: "Andere zones" },
    { id: "closing", label: "Afspraakuitnodiging" },
  ],
  treatment: [
    { id: "hero", label: "Openingsbeeld", locked: true },
    { id: "details", label: "Zone en verloop" },
    { id: "info", label: "Vooraf / voorzorg / nazorg" },
    { id: "request", label: "Herstel en aanvragen" },
    { id: "faq", label: "Vragen en antwoorden" },
    { id: "related", label: "Gerelateerde behandelingen" },
  ],
};

// ──────────────────────────────────────────────────────────── Merge logic

type Json = unknown;

const isObj = (v: Json): v is Record<string, Json> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Deep-merges an owner override over the default. Objects merge per key
 * (new default keys appear automatically after a deployment), arrays and
 * strings from the override win, and values of the wrong type are ignored.
 */
export function mergeContent<T>(def: T, override: Json): T {
  if (override === undefined || override === null) return def;
  if (isObj(def)) {
    if (!isObj(override)) return def;
    const out: Record<string, Json> = { ...def };
    for (const k of Object.keys(def)) if (k in override) out[k] = mergeContent((def as Record<string, Json>)[k], override[k]);
    return out as T;
  }
  if (Array.isArray(def)) {
    if (!Array.isArray(override)) return def;
    const template = def[0];
    return override.map((item, i) => (template !== undefined ? mergeContent(def[i] ?? template, item) : item)) as T;
  }
  if (typeof def === "string") return (typeof override === "string" ? override : def) as T;
  if (typeof def === "number") return (typeof override === "number" ? override : def) as T;
  if (typeof def === "boolean") return (typeof override === "boolean" ? override : def) as T;
  return def;
}

/** Strips anything that is not plain text/structure (defence against HTML/script injection). */
export function sanitizeContent(v: Json, depth = 0): Json {
  if (depth > 12) return null;
  if (typeof v === "string") return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, 8000);
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.slice(0, 200).map((x) => sanitizeContent(x, depth + 1));
  if (isObj(v)) {
    const out: Record<string, Json> = {};
    for (const [k, x] of Object.entries(v).slice(0, 200)) if (/^[\w-]{1,60}$/.test(k)) out[k] = sanitizeContent(x, depth + 1);
    return out;
  }
  return null;
}

/** Leaf strings that are empty (for translation completeness). */
export function emptyLeaves(v: Json, path = ""): string[] {
  if (typeof v === "string") return v.trim() ? [] : [path];
  if (Array.isArray(v)) return v.flatMap((x, i) => emptyLeaves(x, `${path}[${i}]`));
  if (isObj(v)) return Object.entries(v).flatMap(([k, x]) => emptyLeaves(x, path ? `${path}.${k}` : k));
  return [];
}
