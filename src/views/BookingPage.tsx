import { Container } from "@/components/Container";
import { Faq } from "@/components/Faq";
import { AppointmentFormBlock } from "@/components/FormSections";
import { PreselectedNotice } from "@/components/forms/PreselectedNotice";
import { allTreatments, formatPrice, treatmentGroups } from "@/content/treatments";
import { BookingJourney } from "@/components/forms/BookingJourney";
import { siteConfig } from "@/content/site";
import { onlineBookingStatus } from "@/lib/booking/public";
import { withDbOrFallback } from "@/lib/db/client";
import { turnstileSiteKey } from "@/lib/forms/turnstile";
import { bookingAnchor, href } from "@/i18n/config";
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
export async function BookingPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.booking;
  // The availability-aware journey only when it is genuinely operational.
  const online = await withDbOrFallback(async (db) => {
    const st = await onlineBookingStatus(db);
    return st.enabled ? st.bookable : null;
  }, null);

  return (
    <>
      <PageHero locale={locale} photo="experience" photoLabel={dict.common.moodImage} {...t.hero}>
        <PreselectedNotice
          names={Object.fromEntries(allTreatments().map((x) => [x.id, x.name[locale]]))}
          label={t.preselected}
          cta={t.toForm}
          anchor={bookingAnchor}
        />
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

      <section id={bookingAnchor} className="section-tight scroll-mt-[var(--header-safe)] bg-ivory-50">
        <Container className="grid gap-8 lg:grid-cols-[1.45fr_0.55fr] lg:gap-10">
          <div className="rounded-[1.75rem] bg-ivory p-6 shadow-card sm:p-9 lg:p-11" data-reveal>
            <h2 className="display text-[2.2rem] sm:text-5xl">{t.formTitle}</h2>
            <div className="mt-8">
              {online ? (
                <BookingJourney
                  locale={locale}
                  t={t.journey}
                  forms={dict.forms}
                  categories={Object.fromEntries(treatmentGroups.map((g) => [g.id, g.name[locale]]))}
                  treatments={online.map((b) => ({
                    id: b.id,
                    name: locale === "nl" ? b.nameNl : b.nameEn,
                    category: b.category,
                    duration: b.duration!,
                    price: b.priceCents != null ? `${b.priceFrom ? `${t.journey.from} ` : ""}${formatPrice(b.priceCents / 100, locale)}` : null,
                  }))}
                  privacyHref={href(locale, "privacy")}
                  email={siteConfig.contact.email}
                  turnstileSiteKey={turnstileSiteKey()}
                />
              ) : (
                <AppointmentFormBlock locale={locale} dict={dict} />
              )}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:sticky lg:top-[calc(var(--header-safe)+1.5rem)] lg:grid-cols-1 lg:self-start">
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
          </div>
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
