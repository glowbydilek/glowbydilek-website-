import type { MetadataRoute } from "next";
import { allPages, localeLabels, locales, pagePath } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";

/** Every public page in both languages, with hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return allPages().flatMap((page) =>
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
