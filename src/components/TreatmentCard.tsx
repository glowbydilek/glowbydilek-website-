import Link from "next/link";
import { itemCopy } from "@/content/copy";
import { hasPhoto } from "@/content/media";
import { bookingHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { itemById, itemHref } from "@/lib/catalogue";
import { PriceTag } from "./PriceTag";
import { Icon } from "./ui/Icon";
import { Photo } from "./ui/Photo";

/**
 * Treatment or package card: photo, name, one line, price + duration, and two
 * clear actions. The whole card opens the treatment's own page; the button
 * opens the booking form with the treatment already selected.
 */
export function TreatmentCard({ locale, id, withPhoto = true }: { locale: Locale; id: string; withPhoto?: boolean }) {
  const dict = getDictionary(locale);
  const item = itemById(id);
  if (!item) return null;
  const copy = itemCopy(locale, id, item);
  const photo = withPhoto && hasPhoto(item.photo);
  return (
    <article className="star-glint group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper transition-shadow duration-500 hover:shadow-card">
      {photo && (
        <div className="zoom-frame overflow-hidden">
          <Photo id={item.photo} locale={locale} ratio={3 / 2} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-serif text-[1.5rem] leading-tight text-ink transition-colors group-hover:text-accent-deep">
          <Link href={itemHref(locale, item)} className="after:absolute after:inset-0 after:content-['']">
            {item.name[locale]}
          </Link>
        </h3>
        {copy.teaser && <p className="mt-2 flex-1 text-[0.97rem] leading-relaxed text-ink-soft">{copy.teaser}</p>}
        <div className="mt-4 border-t border-line pt-4">
          <PriceTag locale={locale} item={item} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
            {dict.service.viewTreatment}
            <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
          </span>
          <Link
            href={bookingHref(locale, id)}
            className="relative z-10 inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-accent-deep"
          >
            {dict.cta.requestShort}
            <span className="sr-only">: {item.name[locale]}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
