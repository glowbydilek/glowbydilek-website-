import Link from "next/link";
import { treatmentCopy } from "@/content/copy";
import { hasPhoto } from "@/content/media";
import type { TreatmentId } from "@/content/slugs";
import { findTreatmentById, formatPrice, liveTreatment } from "@/content/treatments";
import { bookingHref, treatmentHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Icon } from "./ui/Icon";
import { Photo } from "./ui/Photo";

/**
 * Treatment card: the whole card links to the treatment page; a secondary
 * link requests the treatment with it preselected in the booking form.
 */
export function TreatmentCard({ locale, id, withPhoto = false }: { locale: Locale; id: TreatmentId; withPhoto?: boolean }) {
  const dict = getDictionary(locale);
  const { treatment } = findTreatmentById(id);
  const copy = treatmentCopy(locale, id);
  const live = liveTreatment(id);
  const price = live.price ? `${live.price.from ? `${dict.prices.from} ` : ""}${formatPrice(live.price.amount, locale)}` : null;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-stone bg-ivory-50 transition-shadow duration-500 hover:shadow-card">
      {withPhoto && hasPhoto(treatment.photo) && (
        <div className="zoom-frame">
          <Photo id={treatment.photo} locale={locale} ratio={3 / 2} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-serif text-[1.6rem] leading-tight text-charcoal">
          <Link href={treatmentHref(locale, id)} className="after:absolute after:inset-0 after:content-['']">
            {live.name[locale]}
          </Link>
        </h3>
        <p className="mt-2 flex-1 leading-relaxed text-charcoal-soft">{copy.teaser}</p>
        {price && <p className="mt-3 text-sm text-muted">{price}</p>}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone pt-3">
          <span className="inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-charcoal">
            {dict.service.viewTreatment}
            <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
          </span>
          <Link
            href={bookingHref(locale, id)}
            className="relative z-10 inline-flex min-h-11 items-center text-[0.7rem] font-medium uppercase tracking-[0.18em] text-gold-deep underline-offset-4 hover:text-charcoal hover:underline"
          >
            {dict.cta.requestShort}
            <span className="sr-only">: {treatment.name[locale]}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
