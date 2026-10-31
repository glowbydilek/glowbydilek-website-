import { categoryCopy } from "@/content/copy";
import { treatmentGroups } from "@/content/treatments";
import { categoryHref, href, treatmentHref, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export type NavLink = { label: string; href: string };
export type NavCategory = NavLink & { teaser: string; treatments: NavLink[] };
export type NavModel = {
  categories: NavCategory[];
  info: NavLink[];
  primary: (NavLink & { key: RouteKey })[];
};

/** Small, serialisable navigation model passed to the client header. */
export function navModel(locale: Locale): NavModel {
  const dict = getDictionary(locale);
  const link = (key: RouteKey) => ({ key, label: dict.nav[key], href: href(locale, key) });
  return {
    categories: treatmentGroups.map((g) => {
      const c = categoryCopy(locale, g.id);
      return {
        label: c.label,
        href: categoryHref(locale, g.id),
        teaser: c.teaser,
        treatments: g.treatments.map((t) => ({ label: t.name[locale], href: treatmentHref(locale, t.id) })),
      };
    }),
    info: (["process", "preparation", "aftercare", "faq"] as RouteKey[]).map(link),
    primary: (["treatments", "prices", "about", "contact"] as RouteKey[]).map(link),
  };
}
