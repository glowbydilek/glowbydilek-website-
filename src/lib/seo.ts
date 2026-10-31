import type { Metadata } from "next";
import { siteConfig } from "@/content/site";
import { localeLabels, locales, routes, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === "/" ? "" : path}` || siteConfig.url;
}

/** Builds localised metadata with canonical URL, hreflang alternates and Open Graph. */
export function pageMetadata(locale: Locale, key: RouteKey): Metadata {
  const dict = getDictionary(locale);
  const page = dict.meta.pages[key];
  const path = routes[key][locale];
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeLabels[l].hrefLang] = routes[key][l];
  languages["x-default"] = routes[key].nl;

  const title = key === "home" ? { absolute: page.title } : page.title;
  const ogImage = { url: `/images/og-${locale}.png`, width: 1200, height: 630, alt: `${siteConfig.name} — ${dict.meta.tagline}` };

  return {
    title,
    description: page.description,
    alternates: { canonical: path, languages },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: key === "home" ? page.title : `${page.title} | ${siteConfig.name}`,
      description: page.description,
      url: path,
      locale: localeLabels[locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeLabels[l].ogLocale),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: key === "home" ? page.title : `${page.title} | ${siteConfig.name}`,
      description: page.description,
      images: [ogImage.url],
    },
  };
}

/** Shared metadata for the root layout of each language. */
export function rootMetadata(locale: Locale): Metadata {
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: dict.meta.pages.home.title, template: `%s | ${siteConfig.name}` },
    description: dict.meta.pages.home.description,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name }],
    formatDetection: { telephone: false, email: false, address: false },
    robots: { index: true, follow: true },
  };
}

/** Schema.org structured data. Only includes details that are actually configured. */
export function businessJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const c = siteConfig.contact;
  const sameAs = c.instagram ? [`https://www.instagram.com/${c.instagram.replace(/^@/, "")}`] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${siteConfig.url}/#business`,
    name: siteConfig.name,
    url: absoluteUrl(routes.home[locale]),
    description: dict.meta.pages.home.description,
    image: `${siteConfig.url}/images/og-${locale}.png`,
    areaServed: { "@type": "Country", name: "Netherlands" },
    ...(c.email && { email: c.email }),
    ...(c.phone && { telephone: c.phone }),
    ...(c.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: c.address.street,
        postalCode: c.address.postalCode,
        addressLocality: c.address.city,
        addressCountry: siteConfig.country,
      },
    }),
    ...(sameAs && { sameAs }),
    knowsLanguage: ["nl", "en"],
  };
}
