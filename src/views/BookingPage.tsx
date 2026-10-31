import { ButtonLink } from "@/components/Button";
import { ContactChannels } from "@/components/ContactChannels";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Booking landing page.
 *
 * Online booking is intentionally NOT implemented (see
 * src/lib/booking/config.ts). This page only informs visitors and points them
 * to direct contact. It contains no form and collects no data.
 */
export function BookingPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.booking;

  return (
    <>
      <PageHero {...t.hero} />

      <section className="py-20 sm:py-24">
        <Container className="max-w-4xl">
          <div
            role="status"
            className="flex flex-col gap-4 rounded-[1.75rem] border border-champagne/50 bg-champagne-light/25 p-8 sm:flex-row sm:items-start sm:gap-6"
          >
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-champagne-deep font-serif text-xl italic text-champagne-deep"
            >
              i
            </span>
            <div>
              <h2 className="text-3xl">{t.notice.title}</h2>
              <p className="mt-3 leading-relaxed text-charcoal-soft">{t.notice.body}</p>
            </div>
          </div>

          <div className="mt-20">
            <h2 className="text-center text-4xl sm:text-5xl">{t.future.title}</h2>
            <span className="gold-rule mx-auto mt-6" />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {t.future.steps.map((s, i) => (
                <li key={s.title} className="rounded-[1.5rem] border border-champagne/25 bg-ivory-100/60 p-7">
                  <span className="font-serif text-2xl italic text-champagne-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-2xl">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-20 rounded-[2rem] bg-nude-light p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl">{t.meanwhile.title}</h2>
            <span className="gold-rule mt-5" />
            <p className="mt-5 max-w-xl leading-relaxed text-charcoal-soft">{t.meanwhile.body}</p>
            <div className="mt-8">
              <ContactChannels dict={dict} />
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <ButtonLink href={href(locale, "contact")}>{dict.cta.contact}</ButtonLink>
              <ButtonLink href={href(locale, "prices")} variant="outline">
                {dict.cta.viewPrices}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
