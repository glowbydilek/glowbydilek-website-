import { CareGuide } from "@/components/CareGuide";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { treatmentGroups } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { serviceJsonLd } from "@/lib/seo";

export function TreatmentsPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.treatments;
  const faqs = [...dict.faq.treatments, ...dict.faq.general.slice(0, 3)];

  return (
    <>
      <PageHero locale={locale} photo="zone-body" {...t.hero}>
        <div className="flex flex-col gap-4 sm:flex-row">
          <ButtonLink href={href(locale, "booking")} arrow>
            {dict.cta.request}
          </ButtonLink>
          <ButtonLink href={href(locale, "prices")} variant="outline">
            {dict.cta.viewPrices}
          </ButtonLink>
        </div>
      </PageHero>

      {/* Zone navigation */}
      <nav aria-label={t.zonesLabel} className="sticky top-[4.5rem] z-30 border-b border-espresso/8 bg-ivory/92 backdrop-blur-md lg:top-20">
        <Container className="flex items-center gap-3 overflow-x-auto py-4">
          <span className="mr-2 hidden shrink-0 text-xs uppercase tracking-[0.2em] text-espresso-muted sm:block">{t.zonesLabel}</span>
          {treatmentGroups.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="shrink-0 rounded-full border border-espresso/15 px-5 py-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors hover:border-espresso hover:bg-espresso hover:text-ivory"
            >
              {g.name[locale]}
            </a>
          ))}
        </Container>
      </nav>

      {/* About waxing */}
      <section className="py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} />
            {t.about.paragraphs.map((p) => (
              <p key={p} className="mt-6 text-lg leading-relaxed text-espresso-soft">
                {p}
              </p>
            ))}
          </div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[1.75rem] bg-champagne/30">
            {t.about.facts.map((f) => (
              <div key={f.label} className="flex flex-col items-center bg-ivory-100 px-3 py-10 text-center sm:py-14">
                <dt className="order-2 mt-3 text-xs uppercase tracking-[0.16em] text-espresso-muted">{f.label}</dt>
                <dd className="order-1 font-serif text-3xl text-champagne-deep sm:text-5xl">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Zones */}
      {treatmentGroups.map((g, idx) => {
        const reverse = idx % 2 === 1;
        return (
          <section
            key={g.id}
            id={g.id}
            aria-labelledby={`${g.id}-title`}
            className={`scroll-mt-40 py-20 sm:py-24 ${reverse ? "bg-ivory-100" : ""}`}
          >
            <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div className={reverse ? "lg:order-2" : ""}>
                <div className="lg:sticky lg:top-44">
                  <Photo id={g.photo} locale={locale} className="w-full shadow-soft" sizes="(min-width: 1024px) 40vw, 100vw" />
                </div>
              </div>
              <div>
                <p className="eyebrow">
                  {String(idx + 1).padStart(2, "0")} · {dict.nav.treatments}
                </p>
                <h2 id={`${g.id}-title`} className="display mt-5 text-5xl sm:text-6xl">
                  {g.name[locale]}
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-espresso-soft">{g.intro[locale]}</p>

                <ul className="mt-10 divide-y divide-espresso/10 border-y border-espresso/10">
                  {g.treatments.map((tr) => (
                    <li key={tr.id} className="grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8">
                      <div>
                        <h3 className="text-2xl sm:text-[1.7rem]">{tr.name[locale]}</h3>
                        <p className="mt-2 leading-relaxed text-espresso-soft">{tr.description[locale]}</p>
                      </div>
                      <a
                        href={href(locale, "booking")}
                        className="inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-champagne-deep hover:text-espresso"
                      >
                        {dict.cta.request}
                        <Icon name="arrow" className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex gap-4 rounded-2xl bg-blush-light/70 p-6">
                  <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-champagne-deep" />
                  <p className="leading-relaxed text-espresso-soft">
                    <strong className="font-medium text-espresso">{dict.common.goodToKnow}: </strong>
                    {g.note[locale]}
                  </p>
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      {/* Safety */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-10 rounded-[2rem] border border-champagne/40 bg-ivory-100 p-8 sm:p-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-espresso text-champagne-light">
                <Icon name="privacy" />
              </span>
              <h2 className="display mt-6 text-4xl sm:text-5xl">{t.contra.title}</h2>
              <p className="mt-4 leading-relaxed text-espresso-soft">{t.contra.intro}</p>
            </div>
            <div>
              <ul className="grid gap-4 sm:grid-cols-2">
                {t.contra.items.map((item) => (
                  <li key={item} className="flex gap-3 rounded-2xl bg-ivory p-5 leading-relaxed text-espresso-soft">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne-deep" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-espresso-muted">{t.contra.outro}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Care */}
      <section className="bg-blush-light/60 py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow={dict.home.care.eyebrow} title={dict.home.care.title} intro={dict.home.care.intro} align="center" />
          <div className="mt-14">
            <CareGuide dict={dict} />
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-32 py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={t.faqTitle} />
          <Faq items={faqs} />
        </Container>
        <JsonLd data={faqJsonLd(faqs)} />
      </section>

      <JsonLd data={serviceJsonLd(locale)} />
      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
