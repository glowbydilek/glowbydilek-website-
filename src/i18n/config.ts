import {
  bookingParam,
  categoryIds,
  categorySlugs,
  treatmentIds,
  treatmentSlugs,
  type CategoryId,
  type TreatmentId,
} from "@/content/slugs";

/**
 * Internationalisation and URL model.
 *
 * Dutch (nl) is the default language and is served without a URL prefix.
 * English (en) is served under /en. Every page has a localised slug so both
 * languages are fully indexable and linked through hreflang, and the
 * language switcher always lands on the equivalent page.
 *
 * Page types:
 * - static pages (`routes`)
 * - category pages:  /waxbehandelingen/{gezicht|lichaam|bikini-intiem}
 *                    /en/waxing-treatments/{face|body|bikini-intimate}
 * - treatment pages: /waxbehandelingen/{category}/{treatment}
 *                    /en/waxing-treatments/{category}/{treatment}
 */
export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";

export const localeLabels: Record<Locale, { short: string; long: string; hrefLang: string; ogLocale: string }> = {
  nl: { short: "NL", long: "Nederlands", hrefLang: "nl-NL", ogLocale: "nl_NL" },
  en: { short: "EN", long: "English", hrefLang: "en", ogLocale: "en_GB" },
};

export const routeKeys = [
  "home",
  "treatments",
  "prices",
  "about",
  "contact",
  "booking",
  "process",
  "preparation",
  "aftercare",
  "faq",
  "privacy",
] as const;
export type RouteKey = (typeof routeKeys)[number];

export const routes: Record<RouteKey, Record<Locale, string>> = {
  home: { nl: "/", en: "/en" },
  treatments: { nl: "/waxbehandelingen", en: "/en/waxing-treatments" },
  prices: { nl: "/prijzen", en: "/en/prices" },
  about: { nl: "/over-dilek", en: "/en/about-dilek" },
  contact: { nl: "/contact", en: "/en/contact" },
  booking: { nl: "/afspraak-maken", en: "/en/book-appointment" },
  process: { nl: "/hoe-werkt-een-afspraak", en: "/en/appointment-process" },
  preparation: { nl: "/voorbereiding", en: "/en/preparation" },
  aftercare: { nl: "/nazorg", en: "/en/aftercare" },
  faq: { nl: "/veelgestelde-vragen", en: "/en/faq" },
  privacy: { nl: "/privacy", en: "/en/privacy" },
};

/**
 * Anchor of the request form on the booking page. Only used for explicit
 * same-page links ("go to the form"); links from other pages never carry a
 * hash, so a new page always opens at the top.
 */
export const bookingAnchor = "aanvraag";

export function href(locale: Locale, key: RouteKey): string {
  return routes[key][locale];
}

export function categoryHref(locale: Locale, id: CategoryId): string {
  return `${routes.treatments[locale]}/${categorySlugs[id][locale]}`;
}

export function treatmentHref(locale: Locale, id: TreatmentId): string {
  const s = treatmentSlugs[id];
  return `${categoryHref(locale, s.category)}/${s[locale]}`;
}

/**
 * Booking page with the treatment preselected in the request form. No hash:
 * the page opens at the top and the selection is shown in the hero.
 */
export function bookingHref(locale: Locale, treatment?: TreatmentId): string {
  const base = routes.booking[locale];
  return treatment ? `${base}?${bookingParam[locale]}=${encodeURIComponent(treatment)}` : base;
}

export type PageRef =
  | { type: "static"; key: RouteKey }
  | { type: "category"; id: CategoryId }
  | { type: "treatment"; id: TreatmentId };

export function pagePath(locale: Locale, page: PageRef): string {
  if (page.type === "static") return href(locale, page.key);
  if (page.type === "category") return categoryHref(locale, page.id);
  return treatmentHref(locale, page.id);
}

/** Every public, indexable page (used by the sitemap and the link tests). */
export function allPages(): PageRef[] {
  return [
    ...routeKeys.map((key) => ({ type: "static" as const, key })),
    ...categoryIds.map((id) => ({ type: "category" as const, id })),
    ...treatmentIds.map((id) => ({ type: "treatment" as const, id })),
  ];
}

function clean(pathname: string): string {
  const p = pathname.split(/[?#]/)[0] || "/";
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

/** Find which page (and locale) a pathname belongs to. */
export function matchPage(pathname: string): { page: PageRef; locale: Locale } | null {
  const path = clean(pathname);
  for (const page of allPages()) {
    for (const locale of locales) {
      if (pagePath(locale, page) === path) return { page, locale };
    }
  }
  return null;
}

/** Kept for backwards compatibility: static routes only. */
export function matchRoute(pathname: string): { key: RouteKey; locale: Locale } | null {
  const m = matchPage(pathname);
  return m && m.page.type === "static" ? { key: m.page.key, locale: m.locale } : null;
}

/** The equivalent page in another language (home when unknown). */
export function alternatePath(pathname: string, target: Locale): string {
  const m = matchPage(pathname);
  return m ? pagePath(target, m.page) : routes.home[target];
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nl";
}

export function findCategory(locale: Locale, slug: string): CategoryId | undefined {
  return categoryIds.find((id) => categorySlugs[id][locale] === slug);
}

export function findTreatment(locale: Locale, category: CategoryId, slug: string): TreatmentId | undefined {
  return treatmentIds.find((id) => treatmentSlugs[id].category === category && treatmentSlugs[id][locale] === slug);
}
