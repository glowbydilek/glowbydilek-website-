import { categoryCopy } from "@/content/copy";
import { treatmentGroups } from "@/content/treatments";
import { categoryHref, href, treatmentHref, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { override } from "@/lib/cms/current";
import { validateMenu } from "@/lib/cms/menu";

export type NavLink = { label: string; href: string };
export type NavCategory = NavLink & { teaser: string; treatments: NavLink[] };
export type NavModel = {
  categories: NavCategory[];
  info: NavLink[];
  primary: (NavLink & { key: RouteKey })[];
  studio: (NavLink & { key: RouteKey })[];
};

/** Small, serialisable navigation model passed to the client header. */
export function navModel(locale: Locale): NavModel {
  const dict = getDictionary(locale);
  const menu = validateMenu(override("menu", "all"));
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
    info: menu.footerInfo.map(link),
    primary: menu.header.map(link),
    studio: menu.footerStudio.map(link),
  };
}
