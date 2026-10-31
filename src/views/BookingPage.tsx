import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { AppointmentFormBlock } from "@/components/FormSections";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hasPhoto } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Appointment request page. Requests are emailed to the studio; nothing is
 * confirmed automatically and no availability is shown (no scheduling system
 * yet — see docs/ARCHITECTURE.md).
 */
export function BookingPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.booking;

  return (
    <>
      <PageHero locale={locale} photo="experience" {...t.hero}>
        <ol className="grid gap-4 sm:grid-cols-3">
          {t.steps.map((s, i) => (
            <li key={s.title} className="border-t border-charcoal/15 pt-3">
              <span className="font-serif text-xl italic text-gold-deep">0{i + 1}</span>
              <p className="mt-1 text-sm font-medium text-charcoal">{s.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </PageHero>

      <section id="aanvraag" className="section-tight scroll-mt-[var(--header-safe)] bg-ivory-50">
        <Container className="grid gap-8 lg:grid-cols-[1.45fr_0.55fr] lg:gap-10">
          <div className="rounded-[1.75rem] bg-ivory p-6 shadow-card sm:p-9 lg:p-11" data-reveal>
            <h2 className="display text-[2.2rem] sm:text-5xl">{t.formTitle}</h2>
            <div className="mt-8">
              <AppointmentFormBlock locale={locale} dict={dict} />
            </div>
          </div>
          <aside className="grid gap-5 sm:grid-cols-2 lg:sticky lg:top-[calc(var(--header-safe)+1.5rem)] lg:grid-cols-1 lg:self-start">
            {hasPhoto("materials") && (
              <div className="overflow-hidden rounded-[var(--radius-media)]" data-reveal="mask">
                <Photo id="materials" locale={locale} ratio={4 / 5} sizes="(min-width: 1024px) 28vw, 90vw" />
              </div>
            )}
            <div className="rounded-[1.75rem] bg-nude-light p-7" data-reveal>
              <Icon name="calendar" className="h-6 w-6 text-gold-deep" />
              <h3 className="mt-4 font-serif text-2xl text-charcoal">{t.future.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{t.future.body}</p>
            </div>
          </aside>
        </Container>
      </section>

      <section className="section">
        <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={dict.home.faq.title} />
          <div data-reveal>
            <Faq items={[dict.faq.general[5], dict.faq.general[4], dict.faq.general[0], dict.faq.treatments[0]]} />
          </div>
        </Container>
      </section>
    </>
  );
}
