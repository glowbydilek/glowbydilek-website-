import Link from "next/link";
import { itemCopy } from "@/content/copy";
import type { Locale } from "@/i18n/config";
import { itemById, itemHref } from "@/lib/catalogue";
import { PriceTag } from "./PriceTag";
import { Icon } from "./ui/Icon";

/**
 * Compact price-list row for the overview page: name, one short line, duration
 * and price. The whole row opens the treatment page (booking happens there or
 * via the one booking button of the page), so the list stays short on a phone.
 */
export function TreatmentRow({ locale, id }: { locale: Locale; id: string }) {
  const item = itemById(id);
  if (!item) return null;
  const copy = itemCopy(locale, id, item);
  return (
    <Link href={itemHref(locale, item)} data-treatment-row="" className="star-glint group relative flex min-h-16 items-center gap-4 border-b border-line py-4 pr-3 transition-colors hover:bg-paper/60">
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[1.25rem] leading-snug text-ink transition-colors group-hover:text-accent-deep">{item.name[locale]}</span>
        {copy.teaser && <span className="mt-0.5 line-clamp-1 block text-sm text-ink-soft">{copy.teaser}</span>}
      </span>
      <span className="max-w-[45%] shrink-0">
        <PriceTag locale={locale} item={item} size="sm" align="right" />
      </span>
      <Icon name="arrow" className="h-3.5 w-3.5 shrink-0 text-accent-deep transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
