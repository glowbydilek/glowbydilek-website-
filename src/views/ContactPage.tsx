import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { ContactFormBlock } from "@/components/FormSections";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { mailto, siteConfig, whatsappLink } from "@/content/site";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function ContactPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.contact;
  const wa = whatsappLink(dict.whatsapp.message);

  return (
    <>
      <PageHero locale={locale} photo="contact" {...t.hero}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="#bericht" arrow>
            {dict.cta.sendMessage}
          </ButtonLink>
          <ButtonLink href={mailto(dict.forms.topics.question)} variant="outline">
            {siteConfig.contact.email}
          </ButtonLink>
        </div>
      </PageHero>

      <section id="bericht" className="section-tight scroll-mt-[var(--header-safe)] bg-ivory-50">
        <Container className="grid items-start gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12">
          <div className="rounded-[1.75rem] bg-ivory p-6 shadow-card sm:p-9" data-reveal>
            <h2 className="display text-[2.2rem] sm:text-5xl">{t.formTitle}</h2>
            <p className="mt-3 text-muted">{t.formIntro}</p>
            <div className="mt-8">
              <ContactFormBlock locale={locale} dict={dict} />
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-[calc(var(--header-safe)+1.5rem)]">
            <a
              href={mailto(dict.forms.topics.question)}
              className="group block rounded-[1.75rem] bg-nude-light p-7 transition-colors duration-500 hover:bg-nude"
              data-reveal
            >
              <Icon name="mail" className="h-6 w-6 text-gold-deep" />
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">{t.emailLabel}</p>
              <p className="mt-1 break-all font-serif text-2xl text-charcoal">{siteConfig.contact.email}</p>
              <p className="mt-2 text-sm text-charcoal-soft">{t.emailNote}</p>
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="block rounded-[1.75rem] bg-nude-light p-7" data-reveal>
                <Icon name="whatsapp" className="h-6 w-6 text-gold-deep" />
                <p className="mt-4 font-serif text-2xl text-charcoal">{dict.whatsapp.label}</p>
              </a>
            )}
            <div className="rounded-[1.75rem] border border-charcoal/10 p-7" data-reveal>
              <Icon name="pin" className="h-6 w-6 text-gold-deep" />
              <h3 className="mt-4 font-serif text-2xl text-charcoal">{t.locationTitle}</h3>
              <p className="mt-2 leading-relaxed text-charcoal-soft">{dict.common.location}</p>
              <h3 className="mt-6 font-serif text-2xl text-charcoal">{t.hoursTitle}</h3>
              <p className="mt-2 leading-relaxed text-charcoal-soft">{t.hoursBody}</p>
            </div>
            <div className="on-dark rounded-[1.75rem] bg-charcoal p-7 text-ivory" data-reveal>
              <Icon name="calendar" className="h-6 w-6 text-gold" />
              <p className="mt-4 leading-relaxed text-ivory/80">{t.appointmentHint}</p>
              <ButtonLink href={href(locale, "booking")} variant="gold" className="mt-6 w-full" arrow>
                {dict.cta.request}
              </ButtonLink>
            </div>
          </aside>
        </Container>
      </section>

      <section className="section">
        <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={dict.home.faq.title} />
          <div data-reveal>
            <Faq items={[dict.faq.general[4], dict.faq.general[5], dict.faq.general[0], dict.faq.general[6]]} />
          </div>
        </Container>
      </section>
    </>
  );
}
