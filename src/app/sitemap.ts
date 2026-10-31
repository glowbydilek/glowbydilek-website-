import type { MetadataRoute } from "next";
import { localeLabels, locales, routeKeys, routes } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routeKeys.flatMap((key) =>
    locales.map((locale) => ({
      url: absoluteUrl(routes[key][locale]),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: key === "home" ? 1 : key === "booking" ? 0.6 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [localeLabels[l].hrefLang, absoluteUrl(routes[key][l])]),
        ),
      },
    })),
  );
}
