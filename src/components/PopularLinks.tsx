import Link from "next/link";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isPublicItem, itemById, itemHref, publicSections, sectionHref } from "@/lib/catalogue";

const ITEMS = ["brazilian", "hollywood", "bikini-line", "eyebrows"] as const;
const SECTIONS = ["massage", "facial"] as const;

/**
 * Descriptive internal links to the most searched treatment pages
 * ("Brazilian wax in Amsterdam", …). Only published pages are linked.
 */
export function PopularLinks({ locale, className = "" }: { locale: Locale; className?: string }) {
  const dict = getDictionary(locale).hub;
  const live = new Set(publicSections(locale).map((s) => s.id));
  const links = [
    { href: href(locale, "noord"), label: dict.popular.noord },
    ...ITEMS.flatMap((id) => {
      const it = itemById(id);
      return it && isPublicItem(it) && (locale !== "tr" || it.name.tr.trim()) ? [{ href: itemHref(locale, it), label: dict.popular[id] }] : [];
    }),
    ...SECTIONS.filter((id) => live.has(id)).map((id) => ({ href: sectionHref(locale, id), label: dict.popular[id] })),
  ];
  return (
    <nav aria-label={dict.popularTitle} className={className}>
      <p className="eyebrow">{dict.popularTitle}</p>
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="star-glint inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-4 text-[0.92rem] text-ink transition-colors hover:border-accent hover:text-accent-deep">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
