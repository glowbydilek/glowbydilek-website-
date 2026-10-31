import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { RequestSection } from "@/components/RequestSection";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Appointment request page.
 *
 * Online booking is intentionally NOT active (see src/lib/booking/config.ts).
 * Visitors compose an email request in their own mail app; this page has no
 * backend, stores nothing and does not confirm appointments.
 */
export function BookingPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.booking;

  return (
    <>
      <PageHero locale={locale} photo="hygiene" {...t.hero} />

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading title={t.steps.title} align="center" />
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {t.steps.items.map((s, i) => (
              <li key={s.title} className="relative rounded-[1.75rem] border border-espresso/8 bg-ivory p-8 shadow-card">
                <span className="font-serif text-5xl italic text-champagne">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-2xl">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-espresso-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="aanvraag" className="bg-ivory-100 py-20 sm:py-24">
        <Container className="grid max-w-6xl gap-8 lg:grid-cols-[1.5fr_0.5fr]">
          <RequestSection locale={locale} dict={dict} />
          <aside className="on-dark self-start rounded-[2rem] bg-espresso p-8 text-ivory lg:sticky lg:top-28">
            <Icon name="calendar" className="h-6 w-6 text-champagne" />
            <h2 className="mt-5 text-3xl text-ivory">{t.online.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ivory/70">{t.online.body}</p>
            <ul className="mt-6 space-y-3 border-t border-ivory/15 pt-6">
              {t.online.features.map((f) => (
                <li key={f} className="flex gap-3 text-sm text-ivory/80">
                  <Icon name="sparkle" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
                  {f}
                </li>
              ))}
            </ul>
          </aside>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={dict.home.faq.title} />
          <Faq items={[dict.faq.general[3], dict.faq.general[4], dict.faq.general[0], dict.faq.treatments[0]]} />
        </Container>
      </section>

      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
