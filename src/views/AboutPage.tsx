import { AppointmentCta } from "@/components/AppointmentCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * About page. Only mood/interior imagery is used here: stock or AI images of
 * people are never presented as Dilek. Add her real portrait as a new photo
 * slot when available.
 */
export function AboutPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.about;

  return (
    <>
      <PageHero locale={locale} photo="interior" {...t.hero} />

      <section className="py-16 sm:py-24">
        <Container className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <figure>
            <div className="overflow-hidden rounded-[2rem] lg:rounded-t-[999px]" data-reveal="mask">
              <Photo id="botanical" locale={locale} ratio={4 / 5} sizes="(min-width: 1024px) 40vw, 90vw" />
            </div>
            <figcaption className="mt-4 text-xs uppercase tracking-[0.2em] text-muted">{t.story.imageNote}</figcaption>
          </figure>
          <div>
            <SectionHeading eyebrow={t.story.eyebrow} title={t.story.title} />
            {t.story.paragraphs.map((p) => (
              <p key={p} className="lead mt-6" data-reveal>
                {p}
              </p>
            ))}
            <blockquote className="mt-10 border-l-2 border-gold pl-6" data-reveal>
              <p className="font-serif text-3xl italic leading-snug text-forest sm:text-4xl">“{t.quote}”</p>
              <footer className="mt-4 text-xs uppercase tracking-[0.24em] text-gold-deep">— Dilek</footer>
            </blockquote>
          </div>
        </Container>
      </section>

      <section className="on-dark bg-forest py-16 text-ivory sm:py-24">
        <Container>
          <SectionHeading eyebrow={t.values.eyebrow} title={t.values.title} />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[2rem] bg-ivory/12 sm:grid-cols-2 lg:grid-cols-4">
            {t.values.items.map((v, i) => (
              <li key={v.title} className="bg-forest p-8 sm:p-10" data-reveal style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                <span className="font-serif text-4xl italic text-gold">0{i + 1}</span>
                <h3 className="mt-5 font-serif text-3xl text-ivory">{v.title}</h3>
                <p className="mt-3 leading-relaxed text-ivory/72">{v.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow={t.vision.eyebrow} title={t.vision.title} intro={t.vision.body} />
            <div className="mt-10 flex flex-col gap-4 sm:flex-row" data-reveal>
              <ButtonLink href={href(locale, "treatments")} arrow>
                {dict.cta.viewTreatments}
              </ButtonLink>
              <ButtonLink href={href(locale, "contact")} variant="outline">
                {dict.cta.contact}
              </ButtonLink>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem]" data-reveal="mask">
            <Photo id="contact" locale={locale} sizes="(min-width: 1024px) 38vw, 90vw" />
          </div>
        </Container>
      </section>

      <AppointmentCta locale={locale} dict={dict} />
    </>
  );
}
