import { AppointmentCta } from "@/components/AppointmentCta";
import { CareTabs } from "@/components/CareTabs";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
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
  const faqs = [...dict.faq.treatments, dict.faq.general[0], dict.faq.general[1], dict.faq.general[2], dict.faq.general[3]];

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
      <nav aria-label={t.zonesLabel} className="sticky top-[5.25rem] z-30 lg:top-[6rem]">
        <Container className="flex justify-center py-3">
          <div className="glass flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5">
            {treatmentGroups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="shrink-0 rounded-full px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-forest transition-colors hover:bg-forest hover:text-ivory"
              >
                {g.name[locale]}
              </a>
            ))}
          </div>
        </Container>
      </nav>

      {/* About waxing */}
      <section className="py-16 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} />
            {t.about.paragraphs.map((p) => (
              <p key={p} className="lead mt-6" data-reveal>
                {p}
              </p>
            ))}
          </div>
          <dl className="grid grid-cols-3 overflow-hidden rounded-[2rem] bg-forest text-ivory" data-reveal>
            {t.about.facts.map((f, i) => (
              <div key={f.label} className={`flex flex-col items-center px-3 py-12 text-center sm:py-16 ${i > 0 ? "border-l border-ivory/12" : ""}`}>
                <dt className="order-2 mt-3 text-[0.68rem] uppercase tracking-[0.16em] text-sage-light">{f.label}</dt>
                <dd className="order-1 font-serif text-3xl text-gold-light sm:text-5xl">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Zones */}
      {treatmentGroups.map((g, idx) => {
        const reverse = idx % 2 === 1;
        return (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className={`scroll-mt-40 py-16 sm:py-24 ${reverse ? "bg-ivory-50" : ""}`}>
            <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div className={reverse ? "lg:order-2" : ""}>
                <div className="overflow-hidden rounded-[2rem] lg:sticky lg:top-44" data-reveal="mask">
                  <Photo id={g.photo} locale={locale} sizes="(min-width: 1024px) 42vw, 100vw" />
                </div>
              </div>
              <div>
                <p className="eyebrow" data-reveal>
                  {String(idx + 1).padStart(2, "0")} · {dict.nav.treatments}
                </p>
                <h2 id={`${g.id}-title`} className="display mt-5 text-5xl text-forest sm:text-6xl" data-reveal>
                  {g.name[locale]}
                </h2>
                <p className="lead mt-6" data-reveal>
                  {g.intro[locale]}
                </p>
                <ul className="mt-10 divide-y divide-forest/12 border-y border-forest/12">
                  {g.treatments.map((tr) => (
                    <li key={tr.id} className="group grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8" data-reveal>
                      <div>
                        <h3 className="font-serif text-2xl text-forest sm:text-[1.75rem]">{tr.name[locale]}</h3>
                        <p className="mt-2 leading-relaxed text-charcoal-soft">{tr.description[locale]}</p>
                      </div>
                      <a
                        href={href(locale, "booking")}
                        className="inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-gold-deep transition-colors hover:text-forest"
                      >
                        {dict.cta.request}
                        <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex gap-4 rounded-2xl bg-sage/12 p-6" data-reveal>
                  <Icon name="leaf" className="mt-0.5 h-5 w-5 shrink-0 text-sage-deep" />
                  <p className="leading-relaxed text-charcoal-soft">
                    <strong className="font-medium text-forest">{dict.common.goodToKnow}: </strong>
                    {g.note[locale]}
                  </p>
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      {/* What to expect */}
      <section className="on-dark bg-forest py-16 text-ivory sm:py-24">
        <Container>
          <SectionHeading eyebrow={t.expect.eyebrow} title={t.expect.title} />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[2rem] bg-ivory/12 sm:grid-cols-2 lg:grid-cols-4">
            {t.expect.items.map((s, i) => (
              <li key={s.title} className="bg-forest p-8" data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                <span className="font-serif text-4xl italic text-gold">0{i + 1}</span>
                <h3 className="mt-5 font-serif text-2xl text-ivory">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-ivory/72">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Safety + care */}
      <section className="py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="rounded-[2rem] border border-gold/40 bg-ivory-50 p-8 sm:p-12" data-reveal>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold-light">
              <Icon name="privacy" />
            </span>
            <h2 className="display mt-6 text-4xl text-forest sm:text-5xl">{t.contra.title}</h2>
            <p className="mt-4 leading-relaxed text-charcoal-soft">{t.contra.intro}</p>
            <ul className="mt-6 space-y-3">
              {t.contra.items.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed text-charcoal-soft">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">{t.contra.outro}</p>
          </div>
          <div data-reveal>
            <p className="eyebrow">{dict.home.care.eyebrow}</p>
            <h2 className="display mb-8 mt-5 text-4xl text-forest sm:text-5xl">{dict.home.care.title}</h2>
            <CareTabs care={dict.care} />
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 bg-ivory-50 py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading eyebrow={dict.home.faq.eyebrow} title={t.faqTitle} intro={dict.home.faq.intro} />
          <div data-reveal>
            <Faq items={faqs} />
          </div>
        </Container>
        <JsonLd data={faqJsonLd(faqs)} />
      </section>

      <JsonLd data={serviceJsonLd(locale)} />
      <AppointmentCta locale={locale} dict={dict} />
    </>
  );
}
