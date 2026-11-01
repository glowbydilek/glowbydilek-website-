import type { MetadataRoute } from "next";
import { liveTreatment } from "@/content/treatments";
import { allPages, localeLabels, locales, pagePath, type PageRef } from "@/i18n/config";
import { ensureContent } from "@/lib/cms/store";
import { absoluteUrl, seoOverride } from "@/lib/seo";

export const revalidate = 3600;

const seoKey = (p: PageRef) => (p.type === "static" ? p.key : p.type === "category" ? `category-${p.id}` : `treatment-${p.id}`);

/** Every public page in both languages, with hreflang alternates. Pages set to noindex or hidden treatments are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureContent();
  const lastModified = new Date();
  const pages = allPages().filter((page) => {
    if (page.type === "treatment" && !liveTreatment(page.id).visible) return false;
    return !locales.some((l) => seoOverride(seoKey(page), l).noindex);
  });
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: absoluteUrl(pagePath(locale, page)),
      lastModified,
      changeFrequency: "monthly" as const,
      priority:
        page.type === "static" && page.key === "home"
          ? 1
          : page.type === "static" && page.key === "privacy"
            ? 0.3
            : page.type === "treatment"
              ? 0.7
              : 0.8,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [localeLabels[l].hrefLang, absoluteUrl(pagePath(l, page))])),
      },
    })),
  );
}
