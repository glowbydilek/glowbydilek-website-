import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { CtaBanner } from "@/components/CtaBanner";
import { Monogram } from "@/components/Logo";
import { SectionHeading } from "@/components/SectionHeading";
import { treatmentCategories } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.home;

  return (
    <>
      {/* Hero */}
      <section className="bg-silk relative overflow-hidden">
        <Container className="grid items-center gap-14 pb-20 pt-36 sm:pt-44 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28">
          <div>
            <p className="eyebrow animate-fade-up">{t.hero.eyebrow}</p>
            <h1 className="animate-fade-up mt-6 whitespace-pre-line text-[2.9rem] leading-[1.02] [animation-delay:80ms] sm:text-7xl">
              {t.hero.title}
            </h1>
            <span className="gold-rule mt-8" />
            <p className="animate-fade-up mt-8 max-w-lg text-base leading-relaxed text-charcoal-soft [animation-delay:160ms] sm:text-lg">
              {t.hero.subtitle}
            </p>
            <div className="animate-fade-up mt-10 flex flex-col gap-4 [animation-delay:240ms] sm:flex-row">
              <ButtonLink href={href(locale, "booking")}>{dict.cta.book}</ButtonLink>
              <ButtonLink href={href(locale, "treatments")} variant="outline">
                {dict.cta.viewTreatments}
              </ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none" aria-hidden="true">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-gradient-to-b from-champagne-light via-nude to-nude-deep shadow-soft">
              <div className="absolute inset-4 rounded-t-[999px] rounded-b-[1.5rem] border border-ivory/60" />
              <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_30%,rgb(251_248_243/0.65),transparent)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-ivory">
                <Monogram className="h-28 w-28 text-ivory" />
                <span className="mt-6 font-serif text-3xl italic">Glow</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-2 rounded-2xl bg-ivory/95 px-6 py-5 shadow-card backdrop-blur sm:-left-8">
              <p className="font-serif text-2xl">Glow by Dilek</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-charcoal-muted">{dict.meta.tagline}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Intro & pillars */}
      <section className="py-24 sm:py-32">
        <Container>
          <SectionHeading eyebrow={t.intro.eyebrow} title={t.intro.title} intro={t.intro.body} />
          <ul className="mt-16 grid gap-6 md:grid-cols-3">
            {t.pillars.map((p, i) => (
              <li key={p.title} className="rounded-[1.5rem] border border-champagne/25 bg-ivory-100/60 p-8 text-center">
                <span className="font-serif text-2xl italic text-champagne-deep">0{i + 1}</span>
                <h3 className="mt-4 text-2xl">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-charcoal-soft">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Categories */}
      <section className="bg-ivory-100 py-24 sm:py-32">
        <Container>
          <SectionHeading eyebrow={t.categories.eyebrow} title={t.categories.title} intro={t.categories.intro} />
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {treatmentCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`${href(locale, "treatments")}#${cat.id}`}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-ivory p-8 shadow-card transition-transform duration-500 hover:-translate-y-1"
              >
                <span className="h-px w-10 bg-champagne transition-all duration-500 group-hover:w-20" />
                <h3 className="mt-8 text-3xl">{cat.name[locale]}</h3>
                <p className="mt-4 flex-1 leading-relaxed text-charcoal-soft">{cat.intro[locale]}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {cat.treatments.slice(0, 4).map((tr) => (
                    <li key={tr.id} className="rounded-full bg-nude-light px-3 py-1 text-xs text-charcoal-soft">
                      {tr.name[locale]}
                    </li>
                  ))}
                </ul>
                <span className="mt-8 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-champagne-deep">
                  {dict.cta.viewTreatments} →
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <ButtonLink href={href(locale, "prices")} variant="outline">
              {dict.cta.viewPrices}
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Experience */}
      <section className="py-24 sm:py-32">
        <Container>
          <SectionHeading eyebrow={t.experience.eyebrow} title={t.experience.title} />
          <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {t.experience.steps.map((s, i) => (
              <li key={s.title} className="relative border-t border-champagne/40 pt-8">
                <span className="absolute -top-3 left-0 bg-ivory pr-3 font-serif text-lg italic text-champagne-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-2xl">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-charcoal-soft">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-16 text-center">
            <ButtonLink href={href(locale, "about")} variant="ghost">
              {dict.cta.aboutDilek} →
            </ButtonLink>
          </div>
        </Container>
      </section>

      <CtaBanner locale={locale} dict={dict} />
    </>
  );
}
