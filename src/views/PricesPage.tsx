import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mailto } from "@/content/site";
import { anyPricePublished, formatPrice, liveTreatment, treatmentGroups } from "@/content/treatments";
import { categoryHref, treatmentHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function PricesPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.prices;

  return (
    <>
      <PageHero locale={locale} photo="aftercare" {...t.hero}>
        <ButtonLink href={mailto(t.notice.subject)} arrow>
          {t.notice.cta}
        </ButtonLink>
      </PageHero>

      <section className="section-tight">
        <Container className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-start lg:gap-14">
          <div className="space-y-10">
            {treatmentGroups.map((g) => (
              <div key={g.id} data-reveal>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-charcoal pb-4">
                  <h2 className="display min-w-0 break-words text-[2.2rem] sm:text-5xl">{g.name[locale]}</h2>
                  <Link
                    href={categoryHref(locale, g.id)}
                    className="link-underline shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-gold-deep"
                  >
                    {dict.service.viewTreatment}
                    <span className="sr-only">: {g.name[locale]}</span>
                  </Link>
                </div>
                <table className="w-full text-left">
                  <caption className="sr-only">{g.name[locale]}</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">{t.columns.treatment}</th>
                      <th scope="col" className="hidden sm:table-cell">{t.columns.duration}</th>
                      <th scope="col">{t.columns.price}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.treatments.filter((tr) => liveTreatment(tr.id).visible).map((tr) => (
                      <tr key={tr.id} className="border-b border-charcoal/10">
                        <th scope="row" className="py-5 pr-4 align-top font-normal">
                          <Link href={treatmentHref(locale, tr.id)} className="block font-serif text-2xl text-charcoal underline-offset-4 hover:text-gold-deep hover:underline">
                            {liveTreatment(tr.id).name[locale]}
                          </Link>
                          <span className="mt-1 block text-sm leading-relaxed text-muted">{liveTreatment(tr.id).description[locale]}</span>
                          {liveTreatment(tr.id).durationMinutes ? (
                            <span className="mt-1 block text-sm text-muted sm:hidden">
                              {liveTreatment(tr.id).durationMinutes} {t.minutes}
                            </span>
                          ) : null}
                        </th>
                        <td className="hidden whitespace-nowrap py-5 pr-4 text-right align-top text-sm text-muted sm:table-cell">
                          {liveTreatment(tr.id).durationMinutes ? `${liveTreatment(tr.id).durationMinutes} ${t.minutes}` : ""}
                        </td>
                        <td className="whitespace-nowrap py-5 text-right align-top">
                          {liveTreatment(tr.id).price ? (
                            <span className="font-serif text-2xl text-charcoal">
                              {liveTreatment(tr.id).price!.from && <span className="mr-1 font-sans text-sm text-muted">{t.from}</span>}
                              {formatPrice(liveTreatment(tr.id).price!.amount, locale)}
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-nude-light px-3 py-1 text-xs uppercase tracking-[0.14em] text-charcoal-soft">
                              {dict.common.onRequest}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="space-y-5 lg:sticky lg:top-[calc(var(--header-safe)+1.5rem)]">
            {!anyPricePublished() && (
              <div className="on-dark rounded-[1.75rem] bg-charcoal p-7 text-ivory sm:p-9" data-reveal>
                <Icon name="mail" className="h-6 w-6 text-gold" />
                <h2 className="mt-5 font-serif text-3xl text-ivory">{t.notice.title}</h2>
                <p className="mt-4 leading-relaxed text-ivory/75">{t.notice.body}</p>
                <ButtonLink href={mailto(t.notice.subject)} variant="gold" className="mt-8 w-full" arrow>
                  {t.notice.cta}
                </ButtonLink>
              </div>
            )}
            <ul className="space-y-3 rounded-[1.75rem] bg-nude-light p-7" data-reveal>
              {t.notes.map((n) => (
                <li key={n} className="flex gap-3 leading-relaxed text-charcoal-soft">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-gold-deep" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}
