import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { formatPrice, pricesConfirmed, treatmentCategories } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function PricesPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.prices;

  return (
    <>
      <PageHero {...t.hero} />
      <section className="py-20 sm:py-24">
        <Container className="max-w-4xl">
          {!pricesConfirmed && (
            <p
              role="note"
              className="mb-12 rounded-2xl border border-champagne/50 bg-champagne-light/25 px-6 py-4 text-center text-sm leading-relaxed text-charcoal-soft"
            >
              {t.indicative}
            </p>
          )}

          <div className="space-y-14">
            {treatmentCategories.map((cat) => (
              <div key={cat.id}>
                <h2 className="text-3xl sm:text-4xl">{cat.name[locale]}</h2>
                <span className="gold-rule mt-4" />
                <table className="mt-6 w-full text-left">
                  <caption className="sr-only">{cat.name[locale]}</caption>
                  <thead>
                    <tr className="eyebrow border-b border-champagne/30">
                      <th scope="col" className="py-3 font-medium">{t.columns.treatment}</th>
                      <th scope="col" className="py-3 text-right font-medium">{t.columns.duration}</th>
                      <th scope="col" className="w-28 py-3 text-right font-medium">{t.columns.price}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.treatments.map((tr) => (
                      <tr key={tr.id} className="border-b border-champagne/15">
                        <th scope="row" className="py-4 pr-4 font-serif text-xl font-medium">
                          {tr.name[locale]}
                        </th>
                        <td className="whitespace-nowrap py-4 text-right text-sm text-charcoal-muted">
                          {tr.durationMinutes} {dict.treatments.minutes}
                        </td>
                        <td className="whitespace-nowrap py-4 text-right font-serif text-xl">
                          {tr.fromPrice && <span className="mr-1 text-sm font-sans text-charcoal-muted">{t.from}</span>}
                          {formatPrice(tr.priceEuro, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <ul className="mt-14 space-y-2 text-sm text-charcoal-muted">
            {t.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <ButtonLink href={href(locale, "booking")}>{dict.cta.book}</ButtonLink>
            <ButtonLink href={href(locale, "contact")} variant="outline">
              {dict.cta.contact}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
