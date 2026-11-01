import { groupCopy, sectionCopy } from "@/content/copy";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { groupHref, itemHref, publicGroups, publicItems, publicSections, sectionHref } from "@/lib/catalogue";
import { override } from "@/lib/cms/current";
import { validateMenu } from "@/lib/cms/menu";

export type NavLink = { label: string; href: string };
export type NavCategory = NavLink & { teaser: string; treatments: NavLink[] };
export type NavModel = {
  categories: NavCategory[];
  /** "All treatments": the overview once several sections are published, else the waxing page. */
  allHref: string;
  info: NavLink[];
  primary: (NavLink & { key: RouteKey })[];
  studio: (NavLink & { key: RouteKey })[];
};

/**
 * Small, serialisable navigation model passed to the client header.
 * Built from the live catalogue: with one published section (today: waxing)
 * the menu shows its zones; with several, one column per section.
 */
export function navModel(locale: Locale): NavModel {
  const dict = getDictionary(locale);
  const menu = validateMenu(override("menu", "all"));
  const link = (key: RouteKey) => ({ key, label: dict.nav[key], href: href(locale, key) });
  const sections = publicSections();
  const groupColumn = (g: ReturnType<typeof publicGroups>[number]): NavCategory => {
    const c = groupCopy(locale, g.id, g.name[locale]);
    return {
      label: c.label,
      href: groupHref(locale, g),
      teaser: c.teaser,
      treatments: publicItems({ sectionId: g.sectionId, groupId: g.id }).map((t) => ({ label: t.name[locale], href: itemHref(locale, t) })),
    };
  };
  const categories: NavCategory[] =
    sections.length <= 1
      ? sections.flatMap((s) => publicGroups(s.id).map(groupColumn))
      : sections.map((s) => {
          const groups = publicGroups(s.id);
          const sectionLink = s.id === "waxing" ? href(locale, "treatments") : sectionHref(locale, s);
          const teaser = s.id === "waxing" ? dict.nav.waxingTeaser : sectionCopy(locale, s.id, s.name[locale]).teaser;
          const links = groups.length
            ? groups.map((g) => ({ label: groupCopy(locale, g.id, g.name[locale]).label, href: groupHref(locale, g) }))
            : publicItems({ sectionId: s.id }).map((t) => ({ label: t.name[locale], href: itemHref(locale, t) }));
          return { label: s.name[locale], href: sectionLink, teaser, treatments: links.slice(0, 7) };
        });
  return {
    categories,
    allHref: sections.length > 1 ? href(locale, "services") : href(locale, "treatments"),
    info: menu.footerInfo.map(link),
    // "Behandelingen" always leads to the overview of every published section.
    primary: menu.header.map((k) => (k === "treatments" ? { ...link(k), href: sections.length > 1 ? href(locale, "services") : href(locale, "treatments") } : link(k))),
    studio: menu.footerStudio.map(link),
  };
}
