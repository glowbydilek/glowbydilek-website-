import { Container } from "@/components/Container";
import { FinalCta } from "@/components/FinalCta";
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

      <section className="py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div className="space-y-14">
            {treatmentGroups.map((g) => (
              <div key={g.id}>
                <div className="flex items-baseline justify-between gap-4 border-b border-espresso pb-4">
                  <h2 className="display text-4xl sm:text-5xl">{g.name[locale]}</h2>
                  <a
                    href={`${href(locale, "treatments")}#${g.id}`}
                    className="shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-champagne-deep hover:text-espresso"
                  >
                    {dict.cta.viewTreatments} →
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
                      <tr key={tr.id} className="border-b border-espresso/10">
                        <th scope="row" className="py-5 pr-4 align-top font-normal">
                          <span className="block font-serif text-2xl">{tr.name[locale]}</span>
                          <span className="mt-1 block text-sm leading-relaxed text-espresso-muted">
                            {tr.description[locale]}
                          </span>
                        </th>
                        <td className="whitespace-nowrap py-5 pr-4 text-right align-top text-sm text-espresso-muted">
                          {pricesPublished && tr.durationMinutes ? `${tr.durationMinutes} ${t.minutes}` : ""}
                        </td>
                        <td className="whitespace-nowrap py-5 text-right align-top">
                          {pricesPublished && tr.price ? (
                            <span className="font-serif text-2xl">
                              {tr.price.from && <span className="mr-1 font-sans text-sm text-espresso-muted">{t.from}</span>}
                              {formatPrice(tr.price.amount, locale)}
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-blush-light px-3 py-1 text-xs uppercase tracking-[0.14em] text-espresso-soft">
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
              <div className="on-dark rounded-[1.75rem] bg-espresso p-8 text-ivory">
                <Icon name="mail" className="h-6 w-6 text-champagne" />
                <h2 className="mt-5 text-3xl text-ivory">{t.notice.title}</h2>
                <p className="mt-4 leading-relaxed text-ivory/75">{t.notice.body}</p>
                <ButtonLink href={mailto(t.notice.subject)} variant="light" className="mt-8 w-full" arrow>
                  {t.notice.cta}
                </ButtonLink>
              </div>
            )}
            <ul className="space-y-4 rounded-[1.75rem] bg-ivory-100 p-8">
              {t.notes.map((n) => (
                <li key={n} className="flex gap-3 leading-relaxed text-espresso-soft">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-champagne-deep" />
                  {n}
                </li>
              ))}
            </ul>
          </aside>
        </Container>
      </section>

      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
