import Link from "next/link";
import { HeroVisual, Ornament } from "@/components/BrandVisual";
import { CareTabs } from "@/components/CareTabs";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hasPhoto } from "@/content/media";
import { mailto, siteConfig } from "@/content/site";
import { treatmentGroups } from "@/content/treatments";
import { TreatmentCard } from "@/components/TreatmentCard";
import { categoryCopy } from "@/content/copy";
import type { TreatmentId } from "@/content/slugs";
import { categoryHref, href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const featured: TreatmentId[] = ["eyebrows", "underarms", "full-legs", "brazilian"];

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.home;
  const faqs = dict.faq.general.slice(0, 6);

  return (
    <>
      {/* 1 ─ Hero */}
      <section className="pt-header bg-ivory pb-[var(--space-section-tight)]">
        <Container className="grid items-center gap-10 md:grid-cols-[1.08fr_0.92fr] lg:gap-20">
          <div>
            <p className="eyebrow rise">{t.hero.eyebrow}</p>
            <h1 className="display rise mt-5 text-[2.9rem] [--rise-delay:80ms] sm:text-7xl lg:text-[5.4rem]">
              {t.hero.title}
              <br />
              <em>{t.hero.titleEm}</em>
            </h1>
            <p className="lead rise mt-6 max-w-lg [--rise-delay:160ms]">{t.hero.subtitle}</p>
            <div className="rise mt-8 flex flex-col gap-3 [--rise-delay:240ms] sm:flex-row">
              <ButtonLink href={href(locale, "booking")} arrow>
                {dict.cta.request}
              </ButtonLink>
              <ButtonLink href={href(locale, "treatments")} variant="outline">
                {dict.cta.explore}
              </ButtonLink>
            </div>
            <ul className="rise mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone pt-5 text-sm text-charcoal-soft [--rise-delay:320ms]">
              {t.hero.facts.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rise [--rise-delay:120ms]">
            <div className={`mx-auto lg:ml-auto lg:mr-0 ${hasPhoto("hero") ? "hero-photo-w [--hero-max:32rem]" : "w-full max-w-[30rem]"}`}>
              <HeroVisual photo="hero" locale={locale} />
            </div>
          </div>
        </Container>
      </section>

      {/* 2 ─ Statement */}
      <section className="section bg-nude-light">
        <Container className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div data-reveal>
            <p className="eyebrow">{t.statement.eyebrow}</p>
            <blockquote className="display mt-5 text-[2.2rem] sm:text-5xl lg:text-[3.5rem]">
              “{t.statement.quote}”
            </blockquote>
          </div>
          <div data-reveal style={{ ["--reveal-delay" as string]: "120ms" }}>
            {hasPhoto("editorial-portrait") && (
              <div className="mb-7 overflow-hidden rounded-[var(--radius-media)]">
                <Photo id="editorial-portrait" locale={locale} ratio={5 / 4} sizes="(min-width: 768px) 38vw, 92vw" />
              </div>
            )}
            <p className="lead">{t.statement.body}</p>
            <p className="script mt-5 text-4xl text-gold-deep" aria-label={`— ${t.statement.signature}`}>
              {t.statement.signature}
            </p>
          </div>
        </Container>
      </section>

      {/* 3 ─ Treatments: editorial index */}
      <section className="section">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow={t.treatments.eyebrow} title={t.treatments.title} intro={t.treatments.intro} />
            <div data-reveal className="shrink-0">
              <ButtonLink href={href(locale, "treatments")} variant="outline" arrow>
                {dict.cta.viewTreatments}
              </ButtonLink>
            </div>
          </div>
          <ol className="mt-block border-t border-stone">
            {treatmentGroups.map((g, i) => (
              <li key={g.id} className="border-b border-stone" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                <Link
                  href={categoryHref(locale, g.id)}
                  className="group grid gap-4 py-7 transition-colors duration-500 hover:bg-ivory-50 sm:px-4 md:grid-cols-[4rem_1fr_1.3fr_auto] md:items-center md:gap-8 md:py-8"
                >
                  {hasPhoto(g.photo) ? (
                    <div className="zoom-frame w-24 overflow-hidden rounded-xl md:w-16">
                      <Photo id={g.photo} locale={locale} ratio={1} sizes="96px" />
                    </div>
                  ) : (
                    <span className="font-serif text-4xl italic text-gold-deep">0{i + 1}</span>
                  )}
                  <div>
                    <h3 className="font-serif text-[2rem] leading-none text-charcoal sm:text-[2.4rem]">{categoryCopy(locale, g.id).label}</h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">
                      {g.treatments.length} {t.treatments.count}
                    </p>
                  </div>
                  <div>
                    <p className="leading-relaxed text-charcoal-soft">{g.intro[locale]}</p>
                    <p className="mt-3 text-sm text-muted">{g.treatments.map((tr) => tr.name[locale]).join(" · ")}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center justify-self-start rounded-full border border-charcoal/20 text-charcoal transition-all duration-500 group-hover:border-charcoal group-hover:bg-charcoal group-hover:text-ivory md:justify-self-end">
                    <span className="sr-only">
                      {t.treatments.more}: {categoryCopy(locale, g.id).label}
                    </span>
                    <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-45" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* 3b ─ Featured treatments (each links to its own page) */}
      <section className="section-tight bg-ivory-50">
        <Container>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading eyebrow={dict.hub.eyebrow} title={dict.hub.featuredTitle} intro={dict.hub.featuredIntro} size="md" />
          </div>
          <ul className="mt-block grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((id, i) => (
              <li key={id} data-reveal style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}>
                <TreatmentCard locale={locale} id={id} withPhoto />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 4 ─ How it works */}
      <section className="section bg-stone-light">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow={t.experience.eyebrow} title={dict.hub.afterTitle} intro={t.experience.intro} />
            <div data-reveal className="shrink-0">
              <ButtonLink href={href(locale, "process")} variant="outline" arrow>
                {dict.hub.afterLink}
              </ButtonLink>
            </div>
          </div>
          <ol className="mt-block grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-stone sm:grid-cols-2 lg:grid-cols-4">
            {t.experience.steps.map((s, i) => (
              <li key={s.title} className="bg-ivory-50 p-6 sm:p-7" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 font-serif text-lg italic text-gold-deep">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-serif text-[1.6rem] leading-tight text-charcoal">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-charcoal-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* 5 ─ Standards */}
      <section className="section">
        <Container className={`grid gap-10 lg:gap-16 ${hasPhoto("materials") ? "md:grid-cols-[0.85fr_1.15fr] md:items-center" : "lg:grid-cols-[0.8fr_1.2fr]"}`}>
          <div>
            <SectionHeading eyebrow={t.standards.eyebrow} title={t.standards.title} intro={t.standards.intro} />
            {hasPhoto("materials") && (
              <div className="mt-8 overflow-hidden rounded-[var(--radius-media)]" data-reveal="mask">
                <Photo id="materials" locale={locale} ratio={4 / 3} sizes="(min-width: 768px) 36vw, 92vw" />
              </div>
            )}
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {dict.trust.map((item, i) => (
              <li key={item.title} className="border-t border-gold/50 pt-5" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                <Icon name={item.icon as IconName} className="h-6 w-6 text-gold-deep" />
                <h3 className="mt-4 font-serif text-[1.65rem] leading-tight text-charcoal">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-charcoal-soft">{item.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 6 ─ Meet Dilek */}
      <section className="section bg-nude-light">
        <Container className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {hasPhoto("interior") ? (
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[var(--radius-media)] md:max-w-none" data-reveal="mask">
              <Photo id="interior" locale={locale} sizes="(min-width: 768px) 38vw, 85vw" />
            </div>
          ) : (
            <div className="rounded-[var(--radius-media)] border border-gold/40 bg-ivory-50 px-8 py-12 text-center sm:px-12" data-reveal>
              <Ornament className="h-8 w-auto" />
              <p className="display mt-7 text-[1.9rem] italic text-charcoal sm:text-[2.3rem]">“{t.dilek.quote}”</p>
              <p className="script mt-6 text-5xl text-gold-deep">Dilek</p>
            </div>
          )}
          <div>
            <SectionHeading eyebrow={t.dilek.eyebrow} title={t.dilek.title} />
            <p className="lead mt-5" data-reveal>
              {t.dilek.body}
            </p>
            <div className="mt-8" data-reveal>
              <ButtonLink href={href(locale, "about")} arrow>
                {dict.cta.aboutDilek}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* 7 ─ Preparation & aftercare */}
      <section className="section">
        <Container className="grid items-start gap-10 md:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="md:sticky md:top-[calc(var(--header-safe)+2rem)]">
            <SectionHeading eyebrow={t.care.eyebrow} title={t.care.title} intro={t.care.intro} />
            <aside className="mt-7 rounded-[var(--radius-card)] bg-stone-light p-6" data-reveal>
              <h3 className="flex items-center gap-3 font-serif text-2xl text-charcoal">
                <Icon name="sparkle" className="h-5 w-5 text-gold-deep" />
                {t.care.firstTime.title}
              </h3>
              <p className="mt-2 leading-relaxed text-charcoal-soft">{t.care.firstTime.body}</p>
            </aside>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2" data-reveal>
              <ButtonLink href={href(locale, "preparation")} variant="link" arrow>
                {dict.nav.preparation}
              </ButtonLink>
              <ButtonLink href={href(locale, "aftercare")} variant="link" arrow>
                {dict.nav.aftercare}
              </ButtonLink>
            </div>
          </div>
          <div data-reveal>
            <CareTabs care={dict.care} />
          </div>
        </Container>
      </section>

      {/* 8 ─ FAQ */}
      <section className="section bg-ivory-50">
        <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} intro={t.faq.intro} />
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

      {/* 9 ─ Booking invitation (single dark band) */}
      <ClosingCta locale={locale} dict={dict} />

      {/* 10 ─ Contact strip */}
      <section className="section-tight">
        <Container className="flex flex-col items-start justify-between gap-6 border-t border-stone pt-[var(--space-section-tight)] md:flex-row md:items-center">
          <div className="max-w-xl" data-reveal>
            <h2 className="display text-[2rem] sm:text-4xl">{t.contact.eyebrow}</h2>
            <p className="mt-3 leading-relaxed text-charcoal-soft">{t.contact.body}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row" data-reveal>
            <ButtonLink href={href(locale, "contact")} variant="outline" arrow>
              {dict.cta.sendMessage}
            </ButtonLink>
            <ButtonLink href={mailto(dict.forms.topics.question)} variant="link">
              {siteConfig.contact.email}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
