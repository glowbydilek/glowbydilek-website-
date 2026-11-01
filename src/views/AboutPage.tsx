import type { ReactNode } from "react";
import { Ornament } from "@/components/BrandVisual";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hasPhoto } from "@/content/media";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { arrangeSections } from "@/lib/cms/sections";
import { publicProfile } from "@/lib/profile";

/**
 * About Dilek. Stock or AI images of people are never presented as Dilek:
 * only mood/interior photography is used until a real portrait is supplied.
 */
export function AboutPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.about;

  const profile = publicProfile();
  const showDiploma = Boolean(profile?.verified && profile.diplomaTitle);
  const background = profile ? (locale === "nl" ? profile.backgroundNl : profile.backgroundEn || profile.backgroundNl) : "";

  const sections: Record<string, ReactNode> = {
    education:
      profile && (showDiploma || profile.certificates.length || background) ? (
        <section className="section-tight border-t border-line/70 bg-surface">
          <Container className="grid items-start gap-10 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div data-reveal>
              <p className="eyebrow">{t.education.eyebrow}</p>
              <h2 className="display mt-4 text-[2.1rem] sm:text-[2.8rem]">{t.education.title}</h2>
              {profile.photoMediaId && profile.photoIsReal && (
                // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded portrait served by /media
                <img src={`/media/${profile.photoMediaId}/1024`} alt={t.education.photoAlt} className="mt-8 aspect-[4/5] w-full max-w-xs rounded-[var(--radius-media)] object-cover" loading="lazy" />
              )}
            </div>
            <div data-reveal>
              {background && <p className="lead">{background}</p>}
              <dl className="mt-6 divide-y divide-line border-y border-line">
                {showDiploma && (
                  <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
                    <dt className="text-sm text-muted">{t.education.diploma}</dt>
                    <dd className="text-ink">
                      {profile.diplomaTitle}
                      {profile.level && ` · ${profile.level}`}
                      {(profile.institution || profile.year) && <span className="block text-sm text-muted">{[profile.institution, profile.year].filter(Boolean).join(", ")}</span>}
                    </dd>
                  </div>
                )}
                {profile.certificates.map((c) => (
                  <div key={c.name} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
                    <dt className="text-sm text-muted">{t.education.certificate}</dt>
                    <dd className="text-ink">
                      {c.name}
                      {(c.issuer || c.year) && <span className="block text-sm text-muted">{[c.issuer, c.year].filter(Boolean).join(", ")}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Container>
        </section>
      ) : null,
    hero: (
      <>
        <PageHero locale={locale} photo="interior" {...t.hero}>
          <ButtonLink href={href(locale, "booking")} arrow>
            {dict.cta.request}
          </ButtonLink>
        </PageHero>
      </>
    ),
    story: (
      <>
        {/* Story */}
        <section className="section">
          <Container className="grid items-start gap-10 md:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            {/* Hidden on phones: the hero photo sits directly above, two photos in a row would break the rhythm. */}
            <div className={`md:sticky md:top-[calc(var(--header-safe)+1.5rem)] ${hasPhoto("botanical") ? "hidden md:block" : ""}`}>
              {hasPhoto("botanical") ? (
                <div className="overflow-hidden rounded-[var(--radius-media)]" data-reveal="mask">
                  <Photo id="botanical" locale={locale} ratio={4 / 5} sizes="(min-width: 768px) 38vw, 92vw" />
                </div>
              ) : (
                <figure className="rounded-[var(--radius-media)] bg-glow-soft px-8 py-12 text-center sm:px-12" data-reveal>
                  <Ornament className="h-8 w-auto" />
                  <blockquote className="display mt-7 text-[1.9rem] italic text-ink sm:text-[2.4rem]">“{t.quote}”</blockquote>
                  <figcaption className="script mt-6 text-5xl text-accent-deep">Dilek</figcaption>
                </figure>
              )}
            </div>
            <div>
              <SectionHeading eyebrow={t.story.eyebrow} title={t.story.title} />
              {t.story.paragraphs.map((p) => (
                <p key={p} className="lead mt-5" data-reveal>
                  {p}
                </p>
              ))}
              {hasPhoto("botanical") && (
                <blockquote className="mt-7 border-l-2 border-accent pl-5" data-reveal>
                  <p className="font-serif text-2xl italic leading-snug text-ink sm:text-3xl">“{t.quote}”</p>
                </blockquote>
              )}
            </div>
          </Container>
        </section>
      </>
    ),
    approach: (
      <>
        {/* Approach */}
        <section className="section bg-sand">
          <Container>
            <SectionHeading eyebrow={t.approach.eyebrow} title={t.approach.title} />
            <ul className="mt-block grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {t.approach.items.map((v, i) => (
                <li key={v.title} className="border-t border-accent/50 pt-5" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                  <span className="font-serif text-3xl italic text-accent-deep">0{i + 1}</span>
                  <h3 className="mt-3 font-serif text-[1.7rem] text-ink">{v.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{v.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </>
    ),
    vision: (
      <>
        {/* Vision */}
        <section className="section">
          <Container className={`grid items-center gap-10 lg:gap-16 ${hasPhoto("contact") ? "md:grid-cols-[1.1fr_0.9fr]" : ""}`}>
            <div className={hasPhoto("contact") ? "" : "mx-auto max-w-3xl text-center"}>
              <SectionHeading eyebrow={t.vision.eyebrow} title={t.vision.title} intro={t.vision.body} align={hasPhoto("contact") ? "left" : "center"} />
              <div className={`mt-8 flex flex-wrap items-center gap-3 ${hasPhoto("contact") ? "" : "sm:justify-center"}`} data-reveal>
                <ButtonLink href={href(locale, "treatments")} arrow>
                  {dict.cta.viewTreatments}
                </ButtonLink>
                <ButtonLink href={href(locale, "contact")} variant="outline">
                  {dict.cta.contact}
                </ButtonLink>
              </div>
            </div>
            {hasPhoto("contact") && (
              <div className="overflow-hidden rounded-[var(--radius-media)]" data-reveal="mask">
                <Photo id="contact" locale={locale} sizes="(min-width: 768px) 36vw, 92vw" />
              </div>
            )}
          </Container>
        </section>
      </>
    ),
    closing: (
      <>
        <ClosingCta locale={locale} dict={dict} />
      </>
    ),
  };

  return <>{arrangeSections("about", sections)}</>;
}
