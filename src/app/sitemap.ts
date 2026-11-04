import type { MetadataRoute } from "next";
import { localeLabels, locales, routeKeys, routes, type Locale, type RouteKey } from "@/i18n/config";
import { groupHref, itemHref, publicGroups, publicItems, publicSections, sectionHref, translated } from "@/lib/catalogue";
import { currentSnapshot } from "@/lib/cms/current";
import { ensureContent } from "@/lib/cms/store";
import { isLegalOnline, LEGAL_KEYS, LEGAL_PATHS } from "@/lib/legal";
import { absoluteUrl, BUILTIN_CONTENT_DATE, isIndexedLocale, seoOverride } from "@/lib/seo";

export const revalidate = 3600;

type Entry = {
  seoKey: string;
  path: (l: Locale) => string;
  priority: number;
  /** Languages in which this page exists (default: all). */
  langs?: Locale[];
  /** Owner-edited documents that make up the page (for last-modified). */
  docs?: string[];
  /** Database row dates of the page (catalogue items). */
  dates?: (Date | null | undefined)[];
};

/** Languages in which a catalogue entry is published (Turkish only once translated). */
const langsOf = (e: { name: { tr: string } }) => locales.filter((l) => translated(e, l));

/**
 * Every public, indexable page in every indexable language, with reciprocal
 * hreflang alternates: static pages plus the PUBLISHED catalogue (sections,
 * zones, treatments, packages) and published legal pages.
 *
 * Left out: drafts and archived items (not public), pages set to noindex
 * (per language — one noindex language does not drop the others), languages
 * that are not indexed (Turkish), and every private route (they are not in
 * these lists at all).
 *
 * lastModified is a real date: the newest of the built-in content release,
 * the owner's saved edits for that page and the catalogue row — never "now".
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureContent();
  const snap = currentSnapshot();
  const sections = publicSections();
  const rows = snap.catalogue;
  const rowDate = (list: { id: string; updatedAt?: Date | null }[] | undefined, id: string) => list?.find((r) => r.id === id)?.updatedAt ?? null;
  const staticKeys = routeKeys.filter((k) => k !== "services" || sections.length > 1);
  const entries: Entry[] = [
    ...staticKeys.map((key: RouteKey) => ({ seoKey: key, path: (l: Locale) => routes[key][l], priority: key === "home" ? 1 : key === "privacy" ? 0.3 : 0.8, docs: [`dict:${key}`, `guide:${key}`] })),
    ...sections
      .filter((s) => s.id !== "waxing")
      .map((s) => ({ seoKey: `section-${s.id}`, path: (l: Locale) => sectionHref(l, s), priority: 0.8, langs: langsOf(s), docs: [`section:${s.id}`], dates: [rowDate(rows?.sections as never, s.id)] })),
    ...sections
      .flatMap((s) => publicGroups(s.id))
      .map((g) => ({ seoKey: `category-${g.id}`, path: (l: Locale) => groupHref(l, g), priority: 0.8, langs: langsOf(g), docs: [`category:${g.id}`], dates: [rowDate(rows?.groups as never, g.id)] })),
    ...publicItems().map((i) => ({ seoKey: `treatment-${i.id}`, path: (l: Locale) => itemHref(l, i), priority: 0.7, langs: langsOf(i), docs: [`treatment:${i.id}`], dates: [snap.treatments.get(i.id)?.updatedAt] })),
    ...LEGAL_KEYS.map((k) => ({ seoKey: `legal-${k}`, path: (l: Locale) => LEGAL_PATHS[k][l], priority: 0.3, langs: locales.filter((l) => isLegalOnline(l, k)), docs: [`legal:${k}`] })),
  ];
  const now = Date.now();
  return entries.flatMap((e) => {
    // Per-language indexability; hreflang only between the indexable versions.
    const langs = (e.langs ?? [...locales]).filter((l) => isIndexedLocale(l) && !seoOverride(e.seoKey, l).noindex);
    if (!langs.length) return [];
    const alternates = { languages: Object.fromEntries(langs.map((l) => [localeLabels[l].hrefLang, absoluteUrl(e.path(l))])) };
    return langs.map((locale) => {
      const candidates = [
        BUILTIN_CONTENT_DATE,
        ...(e.dates ?? []),
        ...[...(e.docs ?? []), `seo:${e.seoKey}`].flatMap((d) => [snap.docDates?.get(`${d}|${locale}`), snap.docDates?.get(`${d}|all`)]),
      ].filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()) && d.getTime() <= now);
      const lastModified = new Date(Math.max(...candidates.map((d) => d.getTime())));
      return { url: absoluteUrl(e.path(locale)), lastModified, changeFrequency: "monthly" as const, priority: e.priority, alternates };
    });
  });
}
