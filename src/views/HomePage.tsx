import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { CareGuide } from "@/components/CareGuide";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { JsonLd } from "@/components/JsonLd";
import { TrustGrid } from "@/components/TrustGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { treatmentGroups } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.home;
  const faqs = dict.faq.general;

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-ivory-100">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-blush-light lg:block" aria-hidden="true" />
        <Container className="relative grid items-center gap-12 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-24 lg:pt-14">
          <div className="animate-fade-up lg:pr-6">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1 className="display mt-7 text-[3.3rem] sm:text-7xl lg:text-[5.6rem]">
              {t.hero.title}
              <br />
              <em>{t.hero.titleEm}</em>
            </h1>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-espresso-soft sm:text-lg">{t.hero.subtitle}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <ButtonLink href={href(locale, "booking")} arrow>
                {dict.cta.request}
              </ButtonLink>
              <ButtonLink href={href(locale, "treatments")} variant="outline">
                {dict.cta.viewTreatments}
              </ButtonLink>
            </div>
            <ul className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-espresso/10 pt-7">
              {dict.trust.slice(0, 3).map((item) => (
                <li key={item.title} className="flex flex-col gap-2 text-sm leading-snug text-espresso-soft">
                  <Icon name={item.icon as IconName} className="h-5 w-5 text-champagne-deep" />
                  {item.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up relative [animation-delay:150ms]">
            <div className="relative mx-auto max-w-md lg:ml-auto lg:mr-0 lg:max-w-[33rem]">
              <Photo id="hero-portrait" locale={locale} priority className="w-full shadow-soft" rounded="rounded-t-[999px] rounded-b-[2rem]" sizes="(min-width: 1024px) 40vw, 90vw" />
              <Photo
                id="hero-detail"
                locale={locale}
                className="absolute -bottom-10 -left-6 w-[38%] border-[6px] border-ivory-100 shadow-card sm:-left-14"
                rounded="rounded-[1.5rem]"
                sizes="20vw"
              />
              <div className="absolute -right-2 top-10 max-w-[13.5rem] rounded-2xl bg-ivory/95 p-5 shadow-card backdrop-blur sm:-right-8">
                <div className="flex items-center gap-3">
                  <LogoMark className="h-8 w-8" />
                  <p className="font-serif text-xl leading-tight">{t.hero.cardTitle}</p>
                </div>
                <p className="mt-2 text-sm leading-snug text-espresso-muted">{t.hero.cardBody}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* -------------------------------------------------------------- Strip */}
      <div className="overflow-hidden border-y border-espresso/8 bg-ivory py-5" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
          {[...t.strip, ...t.strip, ...t.strip, ...t.strip].map((s, i) => (
            <span key={i} className="flex items-center gap-12 font-serif text-2xl italic text-espresso-soft">
              {s}
              <LogoMark className="h-4 w-4" ink="var(--color-champagne)" accent="var(--color-champagne)" />
            </span>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------- Treatments */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeading eyebrow={t.featured.eyebrow} title={t.featured.title} intro={t.featured.intro} />
            <ButtonLink href={href(locale, "treatments")} variant="link" arrow className="self-start lg:self-auto">
              {dict.cta.viewTreatments}
            </ButtonLink>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {treatmentGroups.map((g, i) => (
              <Link
                key={g.id}
                href={`${href(locale, "treatments")}#${g.id}`}
                className="group flex flex-col"
              >
                <div className="relative overflow-hidden rounded-[1.75rem]">
                  <Photo
                    id={g.photo}
                    locale={locale}
                    rounded="rounded-[1.75rem]"
                    className="w-full transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <span className="absolute left-5 top-5 rounded-full bg-ivory/90 px-3 py-1 text-xs tracking-[0.18em] text-espresso backdrop-blur">
                    0{i + 1}
                  </span>
                </div>
                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl">{g.name[locale]}</h3>
                    <p className="mt-1 text-sm uppercase tracking-[0.16em] text-espresso-muted">
                      {g.treatments.length} {t.featured.treatmentsCount}
                    </p>
                  </div>
                  <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-espresso/15 transition-colors duration-500 group-hover:border-espresso group-hover:bg-espresso group-hover:text-ivory">
                    <Icon name="arrow" className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-espresso-soft">{g.intro[locale]}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- Why */}
      <section className="bg-ivory-100 py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionHeading eyebrow={t.why.eyebrow} title={t.why.title} intro={t.why.intro} />
            <Photo id="hygiene" locale={locale} className="mt-10 hidden w-full max-w-md shadow-soft lg:block" sizes="35vw" />
          </div>
          <TrustGrid dict={dict} />
        </Container>
      </section>

      {/* --------------------------------------------------------------- Dilek */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="on-dark grain relative grid overflow-hidden rounded-[2rem] bg-espresso text-ivory lg:grid-cols-2">
            <div className="relative min-h-[22rem] lg:min-h-full">
              <Photo id="atmosphere" locale={locale} rounded="rounded-none" className="absolute inset-0 h-full w-full" fill sizes="50vw" />
            </div>
            <div className="relative p-8 sm:p-14 lg:p-16">
              <p className="eyebrow">{t.dilek.eyebrow}</p>
              <h2 className="display mt-6 text-5xl text-ivory sm:text-6xl">{t.dilek.title}</h2>
              <p className="mt-7 text-lg leading-relaxed text-ivory/75">{t.dilek.body}</p>
              <p className="mt-8 font-serif text-4xl italic text-champagne">— {t.dilek.signature}</p>
              <div className="mt-10">
                <ButtonLink href={href(locale, "about")} variant="outline-light" arrow>
                  {dict.cta.aboutDilek}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* --------------------------------------------------------------- Visit */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <SectionHeading eyebrow={t.visit.eyebrow} title={t.visit.title} align="center" />
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.visit.steps.map((s, i) => (
              <li key={s.title} className="relative rounded-[1.75rem] border border-espresso/8 bg-ivory p-7 shadow-card">
                <span className="font-serif text-5xl italic text-champagne">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-2xl">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-espresso-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- Care */}
      <section className="bg-blush-light/60 py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionHeading eyebrow={t.care.eyebrow} title={t.care.title} intro={t.care.intro} />
              <Photo id="aftercare" locale={locale} className="mt-10 hidden w-full max-w-sm shadow-soft lg:block" sizes="30vw" />
            </div>
            <CareGuide dict={dict} />
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------------- FAQ */}
      <section className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} />
            <div className="mt-8 flex flex-col items-start gap-3">
              <ButtonLink href={`${href(locale, "treatments")}#faq`} variant="link" arrow>
                {dict.cta.allFaqs}
              </ButtonLink>
              <ButtonLink href={href(locale, "contact")} variant="link" arrow>
                {dict.cta.contact}
              </ButtonLink>
            </div>
          </div>
          <Faq items={faqs} />
        </Container>
        <JsonLd data={faqJsonLd(faqs)} />
      </section>

      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
