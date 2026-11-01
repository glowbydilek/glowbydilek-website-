import Link from "next/link";
import { itemCopy } from "@/content/copy";
import { hasPhoto } from "@/content/media";
import { bookingHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { itemById, itemHref, priceLabel } from "@/lib/catalogue";
import { Icon } from "./ui/Icon";
import { Photo } from "./ui/Photo";

/**
 * Treatment or package card: the whole card links to its page; a secondary
 * link requests it with the item preselected in the booking form.
 */
export function TreatmentCard({ locale, id, withPhoto = false }: { locale: Locale; id: string; withPhoto?: boolean }) {
  const dict = getDictionary(locale);
  const item = itemById(id);
  if (!item) return null;
  const copy = itemCopy(locale, id, item);
  const price = item.pricing.mode === "on_request" ? null : priceLabel(item, locale, { from: dict.prices.from, onRequest: dict.service.priceOnRequest });
  return (
    <article className="group relative flex h-full flex-col">
      {withPhoto && hasPhoto(item.photo) && (
        <div className="zoom-frame mb-5 overflow-hidden rounded-[var(--radius-media)]">
          <Photo id={item.photo} locale={locale} ratio={3 / 2} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw" />
        </div>
      )}
      <div className={`flex flex-1 flex-col ${withPhoto ? "" : "border-t border-line pt-5"}`}>
        <h3 className="font-serif text-[1.65rem] leading-tight text-ink transition-colors group-hover:text-accent">
          <Link href={itemHref(locale, item)} className="after:absolute after:inset-0 after:content-['']">
            {item.name[locale]}
          </Link>
        </h3>
        <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{copy.teaser}</p>
        {price && <p className="mt-3 text-sm text-muted">{price}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
            {dict.service.viewTreatment}
            <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
          </span>
          <Link
            href={bookingHref(locale, id)}
            className="relative z-10 inline-flex min-h-11 items-center text-sm font-medium text-accent-deep underline-offset-4 hover:text-ink hover:underline"
          >
            {dict.cta.requestShort}
            <span className="sr-only">: {item.name[locale]}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
