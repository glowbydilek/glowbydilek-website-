/**
 * Internationalisation configuration.
 *
 * Dutch (nl) is the default language and is served without a URL prefix.
 * English (en) is served under /en. Every page has a localised slug so that
 * both languages are fully indexable and linked through hreflang.
 */
export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";

export const localeLabels: Record<Locale, { short: string; long: string; hrefLang: string; ogLocale: string }> = {
  nl: { short: "NL", long: "Nederlands", hrefLang: "nl-NL", ogLocale: "nl_NL" },
  en: { short: "EN", long: "English", hrefLang: "en", ogLocale: "en_GB" },
};

export const routeKeys = ["home", "treatments", "prices", "about", "contact", "booking", "privacy"] as const;
export type RouteKey = (typeof routeKeys)[number];

export const routes: Record<RouteKey, Record<Locale, string>> = {
  home: { nl: "/", en: "/en" },
  treatments: { nl: "/waxbehandelingen", en: "/en/waxing-treatments" },
  prices: { nl: "/prijzen", en: "/en/prices" },
  about: { nl: "/over-dilek", en: "/en/about-dilek" },
  contact: { nl: "/contact", en: "/en/contact" },
  booking: { nl: "/afspraak-maken", en: "/en/book-appointment" },
  privacy: { nl: "/privacy", en: "/en/privacy" },
};

export function href(locale: Locale, key: RouteKey): string {
  return routes[key][locale];
}

/** Find which route (and locale) a pathname belongs to. */
export function matchRoute(pathname: string): { key: RouteKey; locale: Locale } | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const key of routeKeys) {
    for (const locale of locales) {
      if (routes[key][locale] === clean) return { key, locale };
    }
  }
  return null;
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nl";
}
