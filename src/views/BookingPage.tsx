import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { AppointmentFormBlock } from "@/components/FormSections";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
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
            <li key={s.title} className="border-t border-forest/15 pt-4">
              <span className="font-serif text-xl italic text-gold-deep">0{i + 1}</span>
              <p className="mt-1 text-sm font-medium text-forest">{s.title}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </PageHero>

      <section id="aanvraag" className="scroll-mt-24 bg-ivory-50 py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:gap-12">
          <div className="rounded-[2rem] bg-ivory p-6 shadow-card sm:p-10 lg:p-12" data-reveal>
            <h2 className="display text-4xl text-forest sm:text-5xl">{t.formTitle}</h2>
            <div className="mt-10">
              <AppointmentFormBlock locale={locale} dict={dict} />
            </div>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-[2rem]" data-reveal="mask">
              <Photo id="materials" locale={locale} ratio={4 / 5} sizes="(min-width: 1024px) 28vw, 90vw" />
            </div>
            <div className="on-dark rounded-[2rem] bg-forest p-8 text-ivory" data-reveal>
              <Icon name="calendar" className="h-6 w-6 text-gold" />
              <h3 className="mt-5 font-serif text-2xl text-ivory">{t.future.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory/72">{t.future.body}</p>
            </div>
          </aside>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={dict.home.faq.title} />
          <div data-reveal>
            <Faq items={[dict.faq.general[5], dict.faq.general[4], dict.faq.general[0], dict.faq.treatments[0]]} />
          </div>
        </Container>
      </section>
    </>
  );
}
