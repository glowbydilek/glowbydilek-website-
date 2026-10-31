import type { Metadata } from "next";
import { publishedCategories } from "@/content/services";
import { siteConfig } from "@/content/site";
import { pricesPublished, treatmentGroups } from "@/content/treatments";
import { localeLabels, locales, routes, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}

/** Localised metadata with canonical URL, hreflang alternates and Open Graph. */
export function pageMetadata(locale: Locale, key: RouteKey): Metadata {
  const dict = getDictionary(locale);
  const page = dict.meta.pages[key];
  const path = routes[key][locale];
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeLabels[l].hrefLang] = routes[key][l];
  languages["x-default"] = routes[key].nl;

  const fullTitle = key === "home" ? page.title : `${page.title} | ${siteConfig.name}`;
  const ogImage = {
    url: `/images/og-${locale}.png`,
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} — ${dict.meta.tagline}`,
  };

  return {
    title: key === "home" ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: path, languages },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description: page.description,
      url: path,
      locale: localeLabels[locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeLabels[l].ogLocale),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
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

/**
 * Schema.org business data. Only confirmed details are included: there is
 * no public address (home-based, address shared after confirmation), so no
 * PostalAddress or geo data is published.
 */
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
    logo: `${siteConfig.url}/brand/logo-icon.svg`,
    image: `${siteConfig.url}/images/og-${locale}.png`,
    description: dict.meta.pages.home.description,
    email: c.email,
    ...(c.phone && { telephone: c.phone }),
    areaServed: c.region ? { "@type": "City", name: c.region } : { "@type": "Country", name: "Netherlands" },
    ...(c.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: c.address.street,
        postalCode: c.address.postalCode,
        addressLocality: c.address.city,
        addressCountry: siteConfig.country,
      },
    }),
    knowsLanguage: ["nl", "en"],
    ...(sameAs && { sameAs }),
  };
}

/** Service + catalogue of published treatments (prices only when confirmed). */
export function serviceJsonLd(locale: Locale) {
  const categories = publishedCategories();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: categories.map((c) => c.name[locale]).join(", "),
    provider: { "@id": `${siteConfig.url}/#business` },
    areaServed: { "@type": "Country", name: "Netherlands" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: categories.map((c) => c.name[locale]).join(", "),
      itemListElement: treatmentGroups.map((g) => ({
        "@type": "OfferCatalog",
        name: g.name[locale],
        itemListElement: g.treatments.map((t) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: t.name[locale], description: t.description[locale] },
          ...(pricesPublished && t.price ? { price: t.price.amount, priceCurrency: "EUR" } : {}),
        })),
      })),
    },
  };
}

export function breadcrumbJsonLd(locale: Locale, key: RouteKey) {
  const dict = getDictionary(locale);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: dict.nav.home, item: absoluteUrl(routes.home[locale]) },
      { "@type": "ListItem", position: 2, name: dict.nav[key], item: absoluteUrl(routes[key][locale]) },
    ],
  };
}
