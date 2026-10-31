import type { Metadata } from "next";
import { publishedCategories } from "@/content/services";
import { siteConfig } from "@/content/site";
import { pricesPublished, treatmentGroups } from "@/content/treatments";
import { categoryCopy, faqPageCopy, guideCopy, treatmentCopy } from "@/content/copy";
import type { CategoryId, TreatmentId } from "@/content/slugs";
import { categoryHref, localeLabels, locales, routes, treatmentHref, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}

type MetaInput = {
  locale: Locale;
  /** Path of this page per language (for canonical + hreflang). */
  paths: Record<Locale, string>;
  title: string;
  description: string;
  /** Use the title as-is (no " | Glow by Dilek" suffix). */
  absolute?: boolean;
  noindex?: boolean;
};

/** Localised metadata with canonical URL, hreflang alternates and Open Graph. */
export function buildMetadata({ locale, paths, title, description, absolute, noindex }: MetaInput): Metadata {
  const dict = getDictionary(locale);
  const path = paths[locale];
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeLabels[l].hrefLang] = paths[l];
  languages["x-default"] = paths.nl;

  const fullTitle = absolute ? title : `${title} | ${siteConfig.name}`;
  const ogImage = {
    url: `/images/og-${locale}.png`,
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} — ${dict.meta.tagline}`,
  };

  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path, languages },
    ...(noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url: path,
      locale: localeLabels[locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeLabels[l].ogLocale),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}

/** Title and description of a static page. */
export function staticPageMeta(locale: Locale, key: RouteKey): { title: string; description: string } {
  if (key === "process" || key === "preparation" || key === "aftercare") {
    const g = guideCopy(locale, key);
    return { title: g.seoTitle, description: g.seoDescription };
  }
  if (key === "faq") {
    const f = faqPageCopy(locale);
    return { title: f.seoTitle, description: f.seoDescription };
  }
  return getDictionary(locale).meta.pages[key];
}

export function pageMetadata(locale: Locale, key: RouteKey): Metadata {
  const page = staticPageMeta(locale, key);
  return buildMetadata({ locale, paths: routes[key], ...page, absolute: key === "home" });
}

export function categoryMetadata(locale: Locale, id: CategoryId): Metadata {
  const c = categoryCopy(locale, id);
  return buildMetadata({
    locale,
    paths: { nl: categoryHref("nl", id), en: categoryHref("en", id) },
    title: c.seoTitle,
    description: c.seoDescription,
  });
}

export function treatmentMetadata(locale: Locale, id: TreatmentId): Metadata {
  const t = treatmentCopy(locale, id);
  return buildMetadata({
    locale,
    paths: { nl: treatmentHref("nl", id), en: treatmentHref("en", id) },
    title: t.seoTitle,
    description: t.seoDescription,
  });
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
 * Schema.org business data. Only confirmed details are included. By policy
 * no address, city, area served or geo data is published (location details
 * are shared personally after confirmation) — see src/content/site.ts.
 */
export function businessJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const c = siteConfig.contact;
  const sameAs = c.instagram ? [`https://www.instagram.com/${c.instagram.replace(/^@/, "")}`] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#business`,
    name: siteConfig.name,
    url: absoluteUrl(routes.home[locale]),
    logo: `${siteConfig.url}/brand/icon-512.png`,
    image: `${siteConfig.url}/images/og-${locale}.png`,
    description: dict.meta.pages.home.description,
    email: c.email,
    ...(c.phone && { telephone: c.phone }),
    ...(c.region && { areaServed: { "@type": "City", name: c.region } }),
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

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** Service schema for one treatment or category page (no prices unless confirmed). */
export function singleServiceJsonLd(locale: Locale, name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: absoluteUrl(path),
    serviceType: name,
    provider: { "@id": `${siteConfig.url}/#business` },
    inLanguage: locale === "nl" ? "nl-NL" : "en",
  };
}
