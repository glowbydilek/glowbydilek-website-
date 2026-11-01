import Link from "next/link";
import { CareTabs } from "@/components/CareTabs";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hasPhoto } from "@/content/media";
import { treatmentGroups } from "@/content/treatments";
import { groupCopy } from "@/content/copy";
import { bookingHref, href, type Locale } from "@/i18n/config";
import { groupHref, itemHref, publicGroups, publicItems } from "@/lib/catalogue";
import { getDictionary } from "@/i18n/dictionaries";
import { serviceJsonLd } from "@/lib/seo";

export function TreatmentsPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.treatments;
  // Published waxing zones (built-in or added by the owner) with their published treatments.
  const zones = publicGroups("waxing").map((g) => {
    const b = treatmentGroups.find((x) => x.id === g.id);
    const c = groupCopy(locale, g.id, g.name[locale]);
    return {
      id: g.id,
      photo: g.photo,
      label: c.label,
      teaser: c.teaser,
      name: g.name,
      intro: b?.intro[locale] ?? c.hero.subtitle,
      suitable: b?.suitable[locale] ?? "",
      note: b?.note[locale] ?? "",
      href: groupHref(locale, g),
      items: publicItems({ sectionId: "waxing", groupId: g.id }),
    };
  });
  const faqs = [dict.faq.treatments[0], dict.faq.treatments[3], dict.faq.general[1], dict.faq.general[2]];

  return (
    <>
      <PageHero locale={locale} photo="treatments-hero" ratio={5 / 4} {...t.hero}>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={href(locale, "booking")} arrow>
            {dict.cta.request}
          </ButtonLink>
          <ButtonLink href={href(locale, "prices")} variant="outline">
            {dict.cta.viewPrices}
          </ButtonLink>
        </div>
      </PageHero>

      {/* Choose an area */}
      <section aria-labelledby="zones-title" className="section-tight border-t border-line/70 bg-surface">
        <Container>
          <h2 id="zones-title" className="eyebrow">
            {dict.hub.title}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {zones.map((g) => (
              <li key={g.id}>
                <Link
                  href={g.href}
                  className="group grid h-full grid-cols-[5.5rem_1fr] items-center gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-3 pr-4 transition-shadow duration-500 hover:shadow-card md:grid-cols-1 md:p-4"
                >
                  {hasPhoto(g.photo) && (
                    <div className="zoom-frame overflow-hidden rounded-2xl">
                      <Photo id={g.photo} locale={locale} ratio={4 / 3} sizes="(min-width: 768px) 28vw, 96px" />
                    </div>
                  )}
                  <span className="md:px-1 md:pb-1">
                    <span className="flex items-center justify-between gap-3 font-serif text-[1.6rem] leading-tight text-ink">
                      {g.label}
                      <Icon name="arrow" className="h-4 w-4 shrink-0 text-accent-deep transition-transform duration-500 group-hover:translate-x-1" />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{g.teaser}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Why waxing */}
      <section className="section-tight">
        <Container className="grid items-center gap-10 md:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} />
            {t.about.paragraphs.map((p) => (
              <p key={p} className="lead mt-5" data-reveal>
                {p}
              </p>
            ))}
          </div>
          <dl className="grid grid-cols-3 border-y border-accent/50" data-reveal>
            {t.about.facts.map((f, i) => (
              <div key={f.label} className={`flex flex-col items-center px-2 py-8 text-center ${i > 0 ? "border-l border-line" : ""}`}>
                <dt className="order-2 mt-2 text-[0.66rem] uppercase tracking-[0.14em] text-muted">{f.label}</dt>
                <dd className="order-1 whitespace-nowrap font-serif text-[1.4rem] text-ink min-[400px]:text-[1.7rem] sm:text-[2.6rem]">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Zones */}
      {zones.map((g, idx) => {
        const photo = hasPhoto(g.photo);
        const tint = idx % 2 === 0 ? "bg-surface" : "";
        return (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className={`section scroll-mt-[var(--header-safe)] ${tint}`}>
            <Container className={`grid items-start gap-10 lg:gap-16 ${photo ? "md:grid-cols-[0.85fr_1.15fr]" : "lg:grid-cols-[0.9fr_1.1fr]"}`}>
              <div className={photo && idx % 2 === 1 ? "md:order-2" : ""}>
                {photo && (
                  <div className="mb-8 overflow-hidden rounded-[var(--radius-media)] md:sticky md:top-[calc(var(--header-safe)+2rem)] md:mb-0" data-reveal="mask">
                    <Photo id={g.photo} locale={locale} sizes="(min-width: 768px) 40vw, 92vw" />
                  </div>
                )}
                {!photo && (
                  <div className="lg:sticky lg:top-[calc(var(--header-safe)+2rem)]">
                    <p className="eyebrow" data-reveal>
                      0{idx + 1} · {dict.nav.treatments}
                    </p>
                    <h2 id={`${g.id}-title`} className="display mt-4 text-[2.7rem] sm:text-6xl" data-reveal>
                      {g.name[locale]}
                    </h2>
                    <p className="lead mt-4" data-reveal>
                      {g.intro}
                    </p>
                    {g.suitable && (
                      <div className="mt-6 rounded-[var(--radius-card)] bg-glow-soft p-5" data-reveal>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">{dict.common.suitableFor}</p>
                        <p className="mt-2 leading-relaxed text-ink-soft">{g.suitable}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                {photo && (
                  <>
                    <p className="eyebrow" data-reveal>
                      0{idx + 1} · {dict.nav.treatments}
                    </p>
                    <h2 id={`${g.id}-title`} className="display mt-4 text-[2.7rem] sm:text-6xl" data-reveal>
                      {g.name[locale]}
                    </h2>
                    <p className="lead mt-4" data-reveal>
                      {g.intro}
                    </p>
                    {g.suitable && (
                      <div className="mt-6 rounded-[var(--radius-card)] bg-glow-soft p-5" data-reveal>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-deep">{dict.common.suitableFor}</p>
                        <p className="mt-2 leading-relaxed text-ink-soft">{g.suitable}</p>
                      </div>
                    )}
                  </>
                )}
                <ul className={`${photo ? "mt-7" : ""} divide-y divide-line border-y border-line`}>
                  {g.items.map((tr) => (
                    <li key={tr.id} className="group relative grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8" data-reveal>
                      <div>
                        <h3 className="font-serif text-[1.65rem] leading-tight text-ink">
                          <Link href={itemHref(locale, tr)} className="underline-offset-4 hover:text-accent-deep hover:underline">
                            {tr.name[locale]}
                          </Link>
                        </h3>
                        <p className="mt-1.5 leading-relaxed text-ink-soft">{tr.description[locale]}</p>
                      </div>
                      <Link
                        href={bookingHref(locale, tr.id)}
                        className="inline-flex min-h-11 items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-accent-deep transition-colors hover:text-ink"
                      >
                        {dict.cta.request}
                        <span className="sr-only">: {tr.name[locale]}</span>
                        <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {g.note && (
                  <p className="mt-6 flex gap-3 leading-relaxed text-ink-soft" data-reveal>
                    <Icon name="leaf" className="mt-1 h-5 w-5 shrink-0 text-accent-deep" />
                    <span>
                      <strong className="font-medium text-ink">{dict.common.goodToKnow}: </strong>
                      {g.note}
                    </span>
                  </p>
                )}
                <div className="mt-6" data-reveal>
                  <ButtonLink href={g.href} variant="outline" arrow>
                    {dict.service.categoryPage}
                  </ButtonLink>
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      {/* What to expect */}
      <section className="section bg-sand">
        <Container>
          <SectionHeading eyebrow={t.expect.eyebrow} title={t.expect.title} />
          <ol className="mt-block grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-line sm:grid-cols-2 lg:grid-cols-4">
            {t.expect.items.map((s, i) => (
              <li key={s.title} className="bg-surface p-6 sm:p-7" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                <span className="font-serif text-4xl italic text-accent-deep">0{i + 1}</span>
                <h3 className="mt-3 font-serif text-[1.6rem] text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Safety + care */}
      <section className="section">
        <Container className="grid items-start gap-10 md:grid-cols-2 lg:gap-16">
          <div className="rounded-[var(--radius-card)] border border-accent/45 p-7 sm:p-9" data-reveal>
            <Icon name="privacy" className="h-7 w-7 text-accent-deep" />
            <h2 className="display mt-4 text-[2.2rem] sm:text-5xl">{t.contra.title}</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{t.contra.intro}</p>
            <ul className="mt-5 space-y-3">
              {t.contra.items.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed text-ink-soft">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted">{t.contra.outro}</p>
          </div>
          <div data-reveal>
            <p className="eyebrow">{dict.home.care.eyebrow}</p>
            <h2 className="display mb-7 mt-4 text-[2.2rem] sm:text-5xl">{dict.home.care.title}</h2>
            <CareTabs care={dict.care} />
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className="section scroll-mt-[var(--header-safe)] bg-surface">
        <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow={dict.home.faq.eyebrow} title={t.faqTitle} intro={dict.home.faq.intro} />
            <div className="mt-6" data-reveal>
              <ButtonLink href={href(locale, "faq")} variant="link" arrow>
                {dict.cta.allFaqs}
              </ButtonLink>
            </div>
          </div>
          <div data-reveal>
            <Faq items={faqs} />
          </div>
        </Container>
        <JsonLd data={faqJsonLd(faqs)} />
      </section>

      <JsonLd data={serviceJsonLd(locale)} />
      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}
