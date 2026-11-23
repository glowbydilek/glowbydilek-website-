import Link from "next/link";
import { itemCopy } from "@/content/copy";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { itemById, itemHref, priceLabel } from "@/lib/catalogue";
import { Icon } from "./ui/Icon";

/**
 * Compact price-list row for the overview page: name, one short line, duration
 * and price. The whole row opens the treatment page (booking happens there or
 * via the one booking button of the page), so the list stays short on a phone.
 */
export function TreatmentRow({ locale, id }: { locale: Locale; id: string }) {
  const dict = getDictionary(locale);
  const item = itemById(id);
  if (!item) return null;
  const copy = itemCopy(locale, id, item);
  const price = priceLabel(item, locale, { from: dict.prices.from, onRequest: dict.service.priceOnRequest });
  const duration = item.durationMinutes ? `${item.durationMinutes} ${dict.prices.minutes}` : null;
  return (
    <Link href={itemHref(locale, item)} data-treatment-row="" className="group flex min-h-16 items-center gap-4 border-b border-line py-4 transition-colors hover:bg-paper/60">
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[1.25rem] leading-snug text-ink transition-colors group-hover:text-accent-deep">{item.name[locale]}</span>
        {copy.teaser && <span className="mt-0.5 line-clamp-1 block text-sm text-ink-soft">{copy.teaser}</span>}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[0.95rem] font-medium text-ink">{price}</span>
        {duration && <span className="block text-xs text-muted">{duration}</span>}
      </span>
      <Icon name="arrow" className="h-3.5 w-3.5 shrink-0 text-accent-deep transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
