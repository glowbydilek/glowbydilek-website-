import { ContactSection } from "@/components/ContactSection";
import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function ContactPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.contact;

  return (
    <>
      <section className="relative overflow-hidden bg-ivory pt-28 sm:pt-32">
        <div className="relative mx-3 h-[18rem] overflow-hidden rounded-[2rem] sm:mx-5 sm:h-[24rem] lg:h-[28rem] lg:rounded-[2.5rem]" data-reveal="mask">
          <Photo id="contact" locale={locale} fill priority parallax={0.08} sizes="100vw" />
        </div>
        <div className="py-14 sm:py-20">
          <ContactSection
            locale={locale}
            dict={dict}
            as="h1"
            eyebrow={t.hero.eyebrow}
            title={`${t.hero.title} ${t.hero.titleEm}`}
            body={t.hero.subtitle}
          />
        </div>
      </section>

      <section className="bg-ivory-50 py-16 sm:py-24">
        <Container className="grid gap-6 md:grid-cols-3">
          <div className="on-dark rounded-[2rem] bg-forest p-8 text-ivory md:col-span-2 sm:p-10" data-reveal>
            <Icon name="calendar" className="h-6 w-6 text-gold" />
            <h2 className="mt-5 font-serif text-3xl text-ivory sm:text-4xl">{dict.booking.hero.title} {dict.booking.hero.titleEm}</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ivory/75">{t.appointmentHint}</p>
            <div className="mt-8">
              <ButtonLink href={href(locale, "booking")} variant="gold" arrow>
                {dict.cta.request}
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-[2rem] bg-stone-light/70 p-8 sm:p-10" data-reveal>
            <Icon name="clock" className="h-6 w-6 text-gold-deep" />
            <h2 className="mt-5 font-serif text-3xl text-forest">{t.hoursTitle}</h2>
            <p className="mt-3 leading-relaxed text-charcoal-soft">{t.hoursBody}</p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={dict.home.faq.title} />
          <div data-reveal>
            <Faq items={[dict.faq.general[4], dict.faq.general[5], dict.faq.general[0], dict.faq.general[6]]} />
          </div>
        </Container>
      </section>
    </>
  );
}
