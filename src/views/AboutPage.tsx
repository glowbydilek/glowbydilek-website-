import { Container } from "@/components/Container";
import { FinalCta } from "@/components/FinalCta";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { photos } from "@/content/media";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function AboutPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.about;
  const hasPortrait = Boolean(photos["dilek-portrait"].file);

  return (
    <>
      <PageHero locale={locale} photo="atmosphere" {...t.hero} />

      <section className="py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          {/* Only a REAL photo of Dilek may be used here (never AI-generated). */}
          <Photo
            id="dilek-portrait"
            locale={locale}
            className="mx-auto w-full max-w-md shadow-soft"
            rounded="rounded-t-[999px] rounded-b-[2rem]"
            caption={hasPortrait ? undefined : t.story.portraitCaption}
            sizes="(min-width: 1024px) 40vw, 90vw"
          />
          <div>
            <SectionHeading eyebrow={t.story.eyebrow} title={t.story.title} />
            {t.story.paragraphs.map((p) => (
              <p key={p} className="mt-6 text-lg leading-relaxed text-espresso-soft">
                {p}
              </p>
            ))}
            <blockquote className="mt-10 border-l-2 border-champagne pl-6">
              <p className="font-serif text-3xl italic leading-snug sm:text-4xl">“{t.quote}”</p>
              <footer className="mt-4 text-sm uppercase tracking-[0.2em] text-champagne-deep">— Dilek</footer>
            </blockquote>
          </div>
        </Container>
      </section>

      <section className="bg-ivory-100 py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow={t.values.eyebrow} title={t.values.title} align="center" />
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.values.items.map((v, i) => (
              <li key={v.title} className="rounded-[1.75rem] bg-ivory p-8 shadow-card">
                <span className="font-serif text-5xl italic text-champagne">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-3xl">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-espresso-soft">{v.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Photo id="hero-detail" locale={locale} className="w-full max-w-md shadow-soft" sizes="(min-width: 1024px) 40vw, 90vw" />
          <div>
            <SectionHeading eyebrow={t.vision.eyebrow} title={t.vision.title} intro={t.vision.body} />
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <ButtonLink href={href(locale, "treatments")} arrow>
                {dict.cta.viewTreatments}
              </ButtonLink>
              <ButtonLink href={href(locale, "contact")} variant="outline">
                {dict.cta.contact}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
