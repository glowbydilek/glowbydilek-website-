import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { CtaBanner } from "@/components/CtaBanner";
import { Monogram } from "@/components/Logo";
import { PageHero } from "@/components/PageHero";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function AboutPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.about;

  return (
    <>
      <PageHero {...t.hero} />

      <section className="py-20 sm:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Decorative portrait frame — replace with a real photo of Dilek (next/image) when available. */}
          <div
            aria-hidden="true"
            className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-nude via-nude-light to-champagne-light shadow-soft"
          >
            <div className="absolute inset-5 rounded-[1.5rem] border border-ivory/70" />
            <div className="absolute inset-0 flex items-center justify-center text-ivory">
              <Monogram className="h-28 w-28" />
            </div>
          </div>

          <div>
            {t.story.map((p) => (
              <p key={p} className="mt-5 first:mt-0 text-lg leading-relaxed text-charcoal-soft">
                {p}
              </p>
            ))}
            <blockquote className="mt-10 border-l-2 border-champagne pl-6">
              <p className="font-serif text-3xl italic leading-snug">“{t.quote}”</p>
              <footer className="eyebrow mt-4">— Dilek</footer>
            </blockquote>
            <div className="mt-10">
              <ButtonLink href={href(locale, "treatments")} variant="outline">
                {dict.cta.viewTreatments}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-ivory-100 py-20 sm:py-28">
        <Container>
          <h2 className="text-center text-4xl sm:text-5xl">{t.valuesTitle}</h2>
          <span className="gold-rule mx-auto mt-6" />
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {t.values.map((v) => (
              <li key={v.title} className="rounded-[1.5rem] bg-ivory p-8 text-center shadow-card">
                <h3 className="text-3xl italic text-champagne-deep">{v.title}</h3>
                <p className="mt-4 leading-relaxed text-charcoal-soft">{v.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <CtaBanner locale={locale} dict={dict} />
    </>
  );
}
