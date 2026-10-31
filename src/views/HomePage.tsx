import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { AppointmentCta } from "@/components/AppointmentCta";
import { CareTabs } from "@/components/CareTabs";
import { ContactSection } from "@/components/ContactSection";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { Gallery } from "@/components/Gallery";
import { JsonLd } from "@/components/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { PhotoId } from "@/content/media";
import { treatmentGroups } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.home;
  const faqs = dict.faq.general.slice(0, 6);
  const gallery: PhotoId[] = ["interior", "aftercare", "materials", "contact", "botanical"];

  return (
    <>
      {/* 1 ─ Hero */}
      <section className="relative overflow-hidden bg-ivory">
        <div className="mx-auto grid max-w-[100rem] lg:min-h-[min(100svh,58rem)] lg:grid-cols-[1fr_1.05fr]">
          <div className="relative z-10 flex flex-col justify-center px-5 pb-10 pt-32 sm:px-8 lg:py-32 lg:pl-12 lg:pr-14 xl:pl-[max(3rem,calc((100vw-88rem)/2+3rem))]">
            <p className="eyebrow rise">{t.hero.eyebrow}</p>
            <h1 className="display rise mt-7 text-[3.4rem] [--rise-delay:80ms] sm:text-7xl lg:text-[6.2rem]">
              {t.hero.title}
              <br />
              <em>{t.hero.titleEm}</em>
            </h1>
            <p className="lead rise mt-8 max-w-lg [--rise-delay:160ms]">{t.hero.subtitle}</p>
            <div className="rise mt-10 flex flex-col gap-4 [--rise-delay:240ms] sm:flex-row">
              <ButtonLink href={href(locale, "booking")} arrow>
                {dict.cta.request}
              </ButtonLink>
              <ButtonLink href={href(locale, "treatments")} variant="outline">
                {dict.cta.explore}
              </ButtonLink>
            </div>
            <ul className="rise mt-12 hidden max-w-xl grid-cols-3 gap-6 border-t border-forest/12 pt-7 [--rise-delay:320ms] sm:grid">
              {dict.trust.slice(0, 3).map((item) => (
                <li key={item.title} className="flex flex-col gap-2 text-sm leading-snug text-charcoal-soft">
                  <Icon name={item.icon as IconName} className="h-5 w-5 text-gold-deep" />
                  {item.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-3 h-[30rem] overflow-hidden rounded-[2rem] sm:mx-5 sm:h-[38rem] lg:m-0 lg:h-auto lg:rounded-none lg:rounded-bl-[8rem]" data-reveal="mask">
            <Photo id="hero" locale={locale} fill priority parallax={0.07} sizes="(min-width: 1024px) 52vw, 100vw" />
            <div className="glass absolute bottom-5 left-5 right-5 rounded-[1.5rem] p-5 sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-xs lg:bottom-12 lg:left-12">
              <div className="flex items-center gap-3">
                <LogoMark className="h-9 w-9" />
                <p className="font-serif text-2xl leading-tight text-forest">{t.hero.glassTitle}</p>
              </div>
              <p className="mt-2 text-sm leading-snug text-charcoal-soft">{t.hero.glassBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Keyword band */}
      <div className="overflow-hidden bg-forest py-5 text-gold-light" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-14 whitespace-nowrap motion-reduce:animate-none">
          {Array.from({ length: 4 }).flatMap((_, n) =>
            [...treatmentGroups.map((g) => g.name[locale]), ...dict.trust.map((x) => x.title)].map((s, i) => (
              <span key={`${n}-${i}`} className="flex items-center gap-14 font-serif text-2xl italic">
                {s}
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
            )),
          )}
        </div>
      </div>

      {/* 2 ─ Brand introduction */}
      <section className="py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow={t.intro.eyebrow} title={t.intro.title} />
            {t.intro.body.map((p) => (
              <p key={p} className="lead mt-6" data-reveal>
                {p}
              </p>
            ))}
            <div className="mt-10" data-reveal>
              <ButtonLink href={href(locale, "about")} variant="link" arrow>
                {dict.cta.aboutDilek}
              </ButtonLink>
            </div>
          </div>
          <div className="relative pb-16 pl-10 sm:pl-20">
            <div className="overflow-hidden rounded-[2rem] shadow-soft" data-reveal="mask">
              <Photo id="editorial-portrait" locale={locale} sizes="(min-width: 1024px) 40vw, 85vw" />
            </div>
            <div
              className="absolute bottom-0 left-0 w-[46%] overflow-hidden rounded-[1.5rem] border-[6px] border-ivory shadow-card"
              data-reveal
              style={{ ["--reveal-delay" as string]: "200ms" }}
            >
              <Photo id="botanical" locale={locale} ratio={1} sizes="20vw" />
            </div>
          </div>
        </Container>
      </section>

      {/* 3 ─ Treatment categories */}
      <section className="bg-ivory-50 py-20 sm:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeading eyebrow={t.treatments.eyebrow} title={t.treatments.title} intro={t.treatments.intro} />
            <div data-reveal>
              <ButtonLink href={href(locale, "treatments")} variant="outline" arrow>
                {dict.cta.viewTreatments}
              </ButtonLink>
            </div>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3 lg:gap-8">
            {treatmentGroups.map((g, i) => (
              <Link
                key={g.id}
                href={`${href(locale, "treatments")}#${g.id}`}
                className={`group flex flex-col ${i === 1 ? "md:mt-16" : ""}`}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}
              >
                <div className="zoom-frame relative overflow-hidden rounded-[1.75rem]">
                  <Photo id={g.photo} locale={locale} sizes="(min-width: 768px) 32vw, 100vw" />
                  <span className="glass absolute left-5 top-5 rounded-full px-3 py-1 text-xs tracking-[0.18em] text-forest">
                    0{i + 1}
                  </span>
                </div>
                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-3xl text-forest">{g.name[locale]}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
                      {g.treatments.length} {t.treatments.count}
                    </p>
                  </div>
                  <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-forest/20 text-forest transition-all duration-500 group-hover:border-forest group-hover:bg-forest group-hover:text-ivory">
                    <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-45" />
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-charcoal-soft">{g.intro[locale]}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 4 ─ Why Glow by Dilek */}
      <section className="on-dark relative overflow-hidden bg-forest py-20 text-ivory sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative order-2 pb-14 pr-10 lg:order-1 lg:pr-16">
            <div className="overflow-hidden rounded-[2rem]" data-reveal="mask">
              <Photo id="materials" locale={locale} sizes="(min-width: 1024px) 38vw, 90vw" />
            </div>
            <div className="absolute bottom-0 right-0 w-[45%] overflow-hidden rounded-[1.5rem] border-[6px] border-forest" data-reveal>
              <Photo id="aftercare" locale={locale} sizes="18vw" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading eyebrow={t.why.eyebrow} title={t.why.title} intro={t.why.intro} />
            <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {dict.trust.map((item, i) => (
                <li key={item.title} data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold">
                      <Icon name={item.icon as IconName} />
                    </span>
                    <span className="font-serif text-lg italic text-gold-light">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-serif text-2xl text-ivory">{item.title}</h3>
                  <p className="mt-3 leading-relaxed text-ivory/72">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* 5 ─ Editorial feature */}
      <section className="relative">
        <div className="relative h-[34rem] overflow-hidden sm:h-[40rem] lg:h-[46rem]">
          <Photo id="botanical" locale={locale} fill parallax={0.1} sizes="100vw" />
        </div>
        <Container className="relative -mt-40 pb-20 sm:-mt-56 sm:pb-28">
          <div className="glass max-w-2xl rounded-[2rem] p-8 sm:p-12" data-reveal>
            <p className="eyebrow">{t.feature.eyebrow}</p>
            <h2 className="display mt-5 text-4xl text-forest sm:text-5xl">{t.feature.title}</h2>
            <p className="lead mt-5">{t.feature.body}</p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2">
              {t.feature.points.map((p, i) => (
                <li key={p} className="flex items-center gap-3 text-sm text-charcoal">
                  <span className="font-serif text-lg italic text-gold-deep">0{i + 1}</span>
                  {p}
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Gallery */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <div className="mb-10">
            <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.title} size="md" />
          </div>
          <Gallery
            locale={locale}
            items={gallery.map((id, i) => ({ id, caption: t.gallery.captions[i] }))}
            labels={{ prev: dict.common.prev, next: dict.common.next, region: t.gallery.title }}
          />
        </Container>
      </section>

      {/* 6 ─ About Dilek */}
      <section className="bg-stone-light/60 py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <figure data-reveal="mask" className="overflow-hidden rounded-[2rem] lg:rounded-t-[999px]">
            <Photo id="interior" locale={locale} sizes="(min-width: 1024px) 40vw, 90vw" />
            <figcaption className="sr-only">{t.dilek.imageNote}</figcaption>
          </figure>
          <div>
            <SectionHeading eyebrow={t.dilek.eyebrow} title={t.dilek.title} />
            <p className="lead mt-6" data-reveal>
              {t.dilek.body}
            </p>
            <blockquote className="mt-10 border-l-2 border-gold pl-6" data-reveal>
              <p className="font-serif text-3xl italic leading-snug text-forest sm:text-4xl">“{t.dilek.quote}”</p>
              <footer className="mt-4 text-xs uppercase tracking-[0.24em] text-gold-deep">— Dilek</footer>
            </blockquote>
            <div className="mt-10" data-reveal>
              <ButtonLink href={href(locale, "about")} arrow>
                {dict.cta.aboutDilek}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* 7 ─ Appointment experience */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow={t.experience.eyebrow} title={t.experience.title} intro={t.experience.intro} align="center" />
          <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <span className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent lg:block" aria-hidden="true" />
            {t.experience.steps.map((s, i) => (
              <li key={s.title} className="relative" data-reveal style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-forest font-serif text-lg italic text-gold-light">
                  {i + 1}
                </span>
                <h3 className="mt-6 font-serif text-2xl text-forest">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-charcoal-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* 8 ─ Preparation & aftercare */}
      <section className="bg-ivory-50 py-20 sm:py-28">
        <Container className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <SectionHeading eyebrow={t.care.eyebrow} title={t.care.title} intro={t.care.intro} />
            <div className="mt-10 hidden overflow-hidden rounded-[2rem] lg:block" data-reveal="mask">
              <Photo id="aftercare" locale={locale} ratio={4 / 3} sizes="38vw" />
            </div>
          </div>
          <div data-reveal>
            <CareTabs care={dict.care} />
          </div>
        </Container>
      </section>

      {/* 9 ─ FAQ */}
      <section className="on-dark bg-forest-deep py-20 text-ivory sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} intro={t.faq.intro} />
            <div className="mt-8" data-reveal>
              <ButtonLink href={`${href(locale, "treatments")}#faq`} variant="link-light" arrow>
                {dict.cta.allFaqs}
              </ButtonLink>
            </div>
          </div>
          <div data-reveal>
            <Faq items={faqs} tone="dark" />
          </div>
        </Container>
        <JsonLd data={faqJsonLd(faqs)} />
      </section>

      {/* 10 ─ Appointment */}
      <AppointmentCta locale={locale} dict={dict} />

      {/* 11 ─ Contact */}
      <section className="py-20 sm:py-28">
        <ContactSection locale={locale} dict={dict} eyebrow={t.contact.eyebrow} title={t.contact.title} body={t.contact.body} />
      </section>
    </>
  );
}
