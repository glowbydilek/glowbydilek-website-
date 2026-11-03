import { groupCopy, sectionCopy } from "@/content/copy";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { groupHref, itemHref, publicGroups, publicItems, publicSections, sectionHref } from "@/lib/catalogue";
import { override } from "@/lib/cms/current";
import { validateMenu } from "@/lib/cms/menu";

export type NavLink = { label: string; href: string };
/** A sub-category (waxing: face, body, bikini) or, for sections without groups, one unnamed group. */
export type NavGroup = { label: string | null; href: string | null; items: NavLink[] };
export type NavCategory = NavLink & {
  teaser: string;
  groups: NavGroup[];
  /** Every published treatment in this category (flattened). */
  treatments: NavLink[];
};
export type NavModel = {
  categories: NavCategory[];
  /** "All treatments": the overview once several sections are published, else the waxing page. */
  allHref: string;
  info: NavLink[];
  primary: (NavLink & { key: RouteKey })[];
  studio: (NavLink & { key: RouteKey })[];
};

/**
 * Small, serialisable navigation model passed to the client header and the
 * footer. Built from the live catalogue: every published, translated
 * treatment appears, grouped by category and sub-category, so the mega
 * menu, the mobile category menu, the footer and the all-treatments page
 * always show the same complete list. Nothing is truncated.
 */
export function navModel(locale: Locale): NavModel {
  const dict = getDictionary(locale);
  const menu = validateMenu(override("menu", "all"));
  const link = (key: RouteKey) => ({ key, label: dict.nav[key], href: href(locale, key) });
  const sections = publicSections(locale);
  const item = (t: ReturnType<typeof publicItems>[number]): NavLink => ({ label: t.name[locale], href: itemHref(locale, t) });

  const categories: NavCategory[] = sections.map((s) => {
    const groups = publicGroups(s.id, locale).map((g) => ({
      label: groupCopy(locale, g.id, g.name[locale]).label,
      href: groupHref(locale, g),
      items: publicItems({ sectionId: s.id, groupId: g.id, locale }).map(item),
    }));
    const loose = publicItems({ sectionId: s.id, groupId: null, locale }).map(item);
    const all: NavGroup[] = [...groups, ...(loose.length ? [{ label: groups.length ? s.name[locale] : null, href: null, items: loose }] : [])];
    const teaser = s.id === "waxing" ? dict.nav.waxingTeaser : sectionCopy(locale, s.id, s.name[locale]).teaser;
    return {
      label: s.name[locale],
      href: s.id === "waxing" ? href(locale, "treatments") : sectionHref(locale, s),
      teaser,
      groups: all,
      treatments: all.flatMap((g) => g.items),
    };
  });
  const allHref = sections.length > 1 ? href(locale, "services") : href(locale, "treatments");
  return {
    categories,
    allHref,
    info: menu.footerInfo.map(link),
    // "Behandelingen" always leads to the overview of every published section.
    primary: menu.header.map((k) => (k === "treatments" ? { ...link(k), href: allHref } : link(k))),
    studio: menu.footerStudio.map(link),
  };
}
