import type { MetadataRoute } from "next";
import { localeLabels, locales, routeKeys, routes, type Locale, type RouteKey } from "@/i18n/config";
import { groupHref, itemHref, publicGroups, publicItems, publicSections, sectionHref } from "@/lib/catalogue";
import { ensureContent } from "@/lib/cms/store";
import { isLegalOnline, LEGAL_KEYS, LEGAL_PATHS } from "@/lib/legal";
import { absoluteUrl, seoOverride } from "@/lib/seo";

export const revalidate = 3600;

type Entry = { seoKey: string; path: (l: Locale) => string; priority: number };

/**
 * Every public page in both languages, with hreflang alternates: static
 * pages plus the PUBLISHED catalogue (sections, zones, treatments, packages).
 * Drafts, archived items and pages set to noindex are left out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureContent();
  const lastModified = new Date();
  const sections = publicSections();
  const staticKeys = routeKeys.filter((k) => k !== "services" || sections.length > 1);
  const entries: Entry[] = [
    ...staticKeys.map((key: RouteKey) => ({ seoKey: key, path: (l: Locale) => routes[key][l], priority: key === "home" ? 1 : key === "privacy" ? 0.3 : 0.8 })),
    ...sections.filter((s) => s.id !== "waxing").map((s) => ({ seoKey: `section-${s.id}`, path: (l: Locale) => sectionHref(l, s), priority: 0.8 })),
    ...sections.flatMap((s) => publicGroups(s.id)).map((g) => ({ seoKey: `category-${g.id}`, path: (l: Locale) => groupHref(l, g), priority: 0.8 })),
    ...publicItems().map((i) => ({ seoKey: `treatment-${i.id}`, path: (l: Locale) => itemHref(l, i), priority: 0.7 })),
    ...LEGAL_KEYS.filter((k) => locales.every((l) => isLegalOnline(l, k))).map((k) => ({ seoKey: `legal-${k}`, path: (l: Locale) => LEGAL_PATHS[k][l], priority: 0.3 })),
  ];
  return entries
    .filter((e) => !locales.some((l) => seoOverride(e.seoKey, l).noindex))
    .flatMap((e) =>
      locales.map((locale) => ({
        url: absoluteUrl(e.path(locale)),
        lastModified,
        changeFrequency: "monthly" as const,
        priority: e.priority,
        alternates: { languages: Object.fromEntries(locales.map((l) => [localeLabels[l].hrefLang, absoluteUrl(e.path(l))])) },
      })),
    );
}
