import { AppointmentCta } from "@/components/AppointmentCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { mailto } from "@/content/site";
import { formatPrice, pricesPublished, treatmentGroups } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
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

      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-start lg:gap-16">
          <div className="space-y-14">
            {treatmentGroups.map((g) => (
              <div key={g.id} data-reveal>
                <div className="flex items-baseline justify-between gap-4 border-b border-forest pb-4">
                  <h2 className="display text-4xl text-forest sm:text-5xl">{g.name[locale]}</h2>
                  <a
                    href={`${href(locale, "treatments")}#${g.id}`}
                    className="link-underline shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-gold-deep"
                  >
                    {dict.cta.viewTreatments}
                  </a>
                </div>
                <table className="w-full text-left">
                  <caption className="sr-only">{g.name[locale]}</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">{t.columns.treatment}</th>
                      <th scope="col">{t.columns.duration}</th>
                      <th scope="col">{t.columns.price}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.treatments.map((tr) => (
                      <tr key={tr.id} className="border-b border-forest/10">
                        <th scope="row" className="py-5 pr-4 align-top font-normal">
                          <span className="block font-serif text-2xl text-forest">{tr.name[locale]}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-muted">{tr.description[locale]}</span>
                        </th>
                        <td className="whitespace-nowrap py-5 pr-4 text-right align-top text-sm text-muted">
                          {pricesPublished && tr.durationMinutes ? `${tr.durationMinutes} ${t.minutes}` : ""}
                        </td>
                        <td className="whitespace-nowrap py-5 text-right align-top">
                          {pricesPublished && tr.price ? (
                            <span className="font-serif text-2xl text-forest">
                              {tr.price.from && <span className="mr-1 font-sans text-sm text-muted">{t.from}</span>}
                              {formatPrice(tr.price.amount, locale)}
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-sage/15 px-3 py-1 text-xs uppercase tracking-[0.14em] text-sage-deep">
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

          <aside className="space-y-5 lg:sticky lg:top-28">
            {!pricesPublished && (
              <div className="on-dark rounded-[2rem] bg-forest p-8 text-ivory sm:p-10" data-reveal>
                <Icon name="mail" className="h-6 w-6 text-gold" />
                <h2 className="mt-5 font-serif text-3xl text-ivory">{t.notice.title}</h2>
                <p className="mt-4 leading-relaxed text-ivory/75">{t.notice.body}</p>
                <ButtonLink href={mailto(t.notice.subject)} variant="gold" className="mt-8 w-full" arrow>
                  {t.notice.cta}
                </ButtonLink>
              </div>
            )}
            <ul className="space-y-4 rounded-[2rem] bg-ivory-50 p-8" data-reveal>
              {t.notes.map((n) => (
                <li key={n} className="flex gap-3 leading-relaxed text-charcoal-soft">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-gold-deep" />
                  {n}
                </li>
              ))}
            </ul>
          </aside>
        </Container>
      </section>

      <AppointmentCta locale={locale} dict={dict} />
    </>
  );
}
