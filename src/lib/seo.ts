import type { Metadata } from "next";
import { siteConfig } from "@/content/site";
import { publicItems, publicSections } from "@/lib/catalogue";
import { categoryCopy, faqPageCopy, guideCopy, treatmentCopy } from "@/content/copy";
import { override } from "@/lib/cms/current";
import { noordCopy, postCopy } from "@/content/copy/blog";
import { postDates, type CategoryId, type PostId, type TreatmentId } from "@/content/slugs";
import { categoryHref, localeLabels, locales, postHref, routes, treatmentHref, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Languages that search engines may index. Turkish stays reachable for
 * visitors (language menu) but is noindex and not in the sitemap until the
 * owner approves it for search (decision 4 Nov 2026).
 */
export const INDEXED_LOCALES: readonly Locale[] = ["nl", "en"];
export const isIndexedLocale = (l: Locale) => INDEXED_LOCALES.includes(l);

/**
 * Date of the last release that changed the built-in (code) content. Used as
 * the sitemap's last-modified date for pages without a newer owner edit —
 * a real date, never "now". Update it when built-in page copy changes.
 */
export const BUILTIN_CONTENT_DATE = new Date("2026-11-24T00:00:00Z");

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === "/" ? "" : path}`;
}

type MetaInput = {
  locale: Locale;
  /** Key of the owner's SEO overrides ("seo:<key>" content document). */
  seoKey?: string;
  /** Path of this page per language (canonical + hreflang). A language without a path has no version (no hreflang). */
  paths: { nl: string } & Partial<Record<Locale, string>>;
  title: string;
  description: string;
  /** Use the title as-is (no " | Glow by Dilek" suffix). */
  absolute?: boolean;
  noindex?: boolean;
};

/** Localised metadata with canonical URL, hreflang alternates and Open Graph. */
export type SeoOverride = { title?: string; description?: string; noindex?: boolean; ogTitle?: string; ogDescription?: string; ogImage?: number | null };

export function seoOverride(seoKey: string | undefined, locale: Locale): SeoOverride {
  if (!seoKey) return {};
  const o = override(`seo:${seoKey}`, locale);
  return o && typeof o === "object" ? (o as SeoOverride) : {};
}

export function buildMetadata(input: MetaInput): Metadata {
  const o = seoOverride(input.seoKey, input.locale);
  const { locale, paths, absolute } = input;
  const title = o.title?.trim() || input.title;
  const description = o.description?.trim() || input.description;
  const noindex = Boolean(o.noindex ?? input.noindex) || !isIndexedLocale(locale);
  const dict = getDictionary(locale);
  const path = paths[locale];
  // hreflang only between indexable versions of this page (reciprocal, same set on every version).
  const indexable = locales.filter((l) => paths[l] && isIndexedLocale(l) && !(seoOverride(input.seoKey, l).noindex ?? input.noindex));
  const languages: Record<string, string> = {};
  for (const l of indexable) languages[localeLabels[l].hrefLang] = paths[l]!;
  if (indexable.includes("nl")) languages["x-default"] = paths.nl;

  const fullTitle = absolute ? title : `${title} | ${siteConfig.name}`;
  const ogImage = o.ogImage
    ? { url: `/media/${o.ogImage}/1600`, width: 1600, height: 900, alt: o.ogTitle || title }
    : { url: `/images/og-${locale}.png`, width: 1200, height: 630, alt: `${siteConfig.name} — ${dict.meta.tagline}` };
  const ogTitle = o.ogTitle?.trim() || fullTitle;
  const ogDescription = o.ogDescription?.trim() || description;

  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path, languages },
    ...(noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: ogTitle,
      description: ogDescription,
      url: path,
      locale: localeLabels[locale].ogLocale,
      alternateLocale: indexable.filter((l) => l !== locale).map((l) => localeLabels[l].ogLocale),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
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
  if (key === "noord") {
    const n = noordCopy(locale);
    return { title: n.seoTitle, description: n.seoDescription };
  }
  return getDictionary(locale).meta.pages[key];
}

export function pageMetadata(locale: Locale, key: RouteKey): Metadata {
  const page = staticPageMeta(locale, key);
  return buildMetadata({ locale, paths: routes[key], ...page, absolute: key === "home", seoKey: key });
}

export function postMetadata(locale: Locale, id: PostId): Metadata {
  const p = postCopy(locale, id);
  return buildMetadata({
    locale,
    paths: { nl: postHref("nl", id), en: postHref("en", id), tr: postHref("tr", id) },
    title: p.seoTitle,
    description: p.seoDescription,
    seoKey: `post-${id}`,
  });
}

/** BlogPosting structured data for an article (no invented author credentials or ratings). */
export function postJsonLd(locale: Locale, id: PostId) {
  const p = postCopy(locale, id);
  const url = absoluteUrl(postHref(locale, id));
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.seoTitle,
    description: p.seoDescription,
    inLanguage: localeLabels[locale].hrefLang,
    datePublished: postDates[id],
    dateModified: postDates[id],
    mainEntityOfPage: url,
    url,
    image: `${siteConfig.url}/images/og-${locale}.png`,
    author: { "@type": "Person", name: siteConfig.owner, worksFor: { "@id": `${siteConfig.url}/#business` } },
    publisher: { "@id": `${siteConfig.url}/#business` },
  };
}

export function categoryMetadata(locale: Locale, id: CategoryId): Metadata {
  const c = categoryCopy(locale, id);
  return buildMetadata({
    locale,
    paths: { nl: categoryHref("nl", id), en: categoryHref("en", id), tr: categoryHref("tr", id) },
    title: c.seoTitle,
    description: c.seoDescription,
    seoKey: `category-${id}`,
  });
}

export function treatmentMetadata(locale: Locale, id: TreatmentId): Metadata {
  const t = treatmentCopy(locale, id);
  return buildMetadata({
    locale,
    paths: { nl: treatmentHref("nl", id), en: treatmentHref("en", id), tr: treatmentHref("tr", id) },
    title: t.seoTitle,
    description: t.seoDescription,
    seoKey: `treatment-${id}`,
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
    robots: isIndexedLocale(locale) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

/**
 * Schema.org business data. Only confirmed details are included: the city
 * (Amsterdam) but never the street address, no geo coordinates, no opening
 * hours (treatments are by appointment only), no ratings — see
 * src/content/site.ts.
 */
export function businessJsonLd(locale: Locale) {
  const dict = getDictionary(locale);
  const c = siteConfig.contact;
  const sameAs = c.instagram ? [`https://www.instagram.com/${c.instagram.replace(/^@/, "")}`] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": c.region ? "BeautySalon" : "Organization",
    "@id": `${siteConfig.url}/#business`,
    name: siteConfig.name,
    url: absoluteUrl(routes.home[locale]),
    logo: `${siteConfig.url}/brand/icon-512.png`,
    image: `${siteConfig.url}/images/og-${locale}.png`,
    description: dict.meta.pages.home.description,
    ...(c.phone && { telephone: c.phone }),
    ...(c.welcomesFrom?.length && {
      areaServed: [
        ...(c.district ? [{ "@type": "Place", name: `${c.district}, ${c.region ?? "Amsterdam"}` }] : []),
        ...c.welcomesFrom.map((name) => ({ "@type": "City", name })),
      ],
    }),
    ...(c.region && !c.address && { address: { "@type": "PostalAddress", addressLocality: c.region, addressCountry: siteConfig.country } }),
    ...(c.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: c.address.street,
        postalCode: c.address.postalCode,
        addressLocality: c.address.city,
        addressCountry: siteConfig.country,
      },
    }),
    knowsLanguage: ["nl", "en", "tr"],
    ...(sameAs && { sameAs }),
  };
}

/** Where the services are offered: the business district and city (no street address). */
const AREA = [
  ...(siteConfig.contact.district ? [{ "@type": "Place", name: `${siteConfig.contact.district}, ${siteConfig.contact.region ?? "Amsterdam"}` }] : []),
  { "@type": "City", name: siteConfig.contact.region ?? "Amsterdam" },
];

/** Service + catalogue of published treatments (prices only when confirmed). */
export function serviceJsonLd(locale: Locale) {
  const sections = publicSections(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: sections.map((c) => c.name[locale]).join(", "),
    provider: { "@id": `${siteConfig.url}/#business` },
    areaServed: AREA,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: sections.map((c) => c.name[locale]).join(", "),
      itemListElement: sections.map((sec) => ({
        "@type": "OfferCatalog",
        name: sec.name[locale],
        itemListElement: publicItems({ sectionId: sec.id, locale }).map((t) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: t.name[locale], description: t.description[locale] },
          ...(t.pricing.mode === "fixed" && t.pricing.cents != null ? { price: (t.pricing.cents / 100).toFixed(2), priceCurrency: "EUR" } : {}),
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
    areaServed: AREA,
    inLanguage: localeLabels[locale].hrefLang,
  };
}
