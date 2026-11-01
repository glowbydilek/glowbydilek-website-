import type { ReactNode } from "react";
import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { TreatmentCard } from "@/components/TreatmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { CheckList } from "@/components/ui/CheckList";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categoryCopy } from "@/content/copy";
import { hasPhoto } from "@/content/media";
import { categoryIds, type CategoryId } from "@/content/slugs";
import { findGroup } from "@/content/treatments";
import { bookingHref, categoryHref, href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { arrangeSections } from "@/lib/cms/sections";
import { singleServiceJsonLd } from "@/lib/seo";

/** Category page: face, body or bikini & intimate. */
export function CategoryPage({ locale, id }: { locale: Locale; id: CategoryId }) {
  const dict = getDictionary(locale);
  const s = dict.service;
  const c = categoryCopy(locale, id);
  const group = findGroup(id);
  const others = categoryIds.filter((x) => x !== id);
  const path = categoryHref(locale, id);

  const sections: Record<string, ReactNode> = {
    hero: (
      <>
        <PageHero
          locale={locale}
          photo={group.photo}
          ratio={id === "face" ? 4 / 5 : 5 / 4}
          crumbs={[{ name: dict.nav.treatments, href: href(locale, "treatments") }, { name: c.label }]}
          {...c.hero}
        >
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="#behandelingen" arrow>
              {s.inThisArea}
            </ButtonLink>
            <ButtonLink href={bookingHref(locale)} variant="outline">
              {dict.cta.request}
            </ButtonLink>
          </div>
        </PageHero>
      </>
    ),
    intro: (
      <>
        {/* Intro + what it involves */}
        <section className="section-tight border-t border-line/70">
          <Container className="grid gap-10 md:grid-cols-2 lg:gap-16">
            <div data-reveal>
              <h2 className="display text-[2.1rem] sm:text-[2.8rem]">{c.intro.title}</h2>
              {c.intro.paragraphs.map((p) => (
                <p key={p} className="lead mt-5">
                  {p}
                </p>
              ))}
            </div>
            <div data-reveal style={{ ["--reveal-delay" as string]: "100ms" }}>
              <h2 className="display text-[2.1rem] sm:text-[2.8rem]">{c.involves.title}</h2>
              {c.involves.paragraphs.map((p) => (
                <p key={p} className="mt-5 leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </div>
          </Container>
        </section>
      </>
    ),
    treatments: (
      <>
        {/* Treatments in this category */}
        <section id="behandelingen" aria-labelledby="behandelingen-title" className="section scroll-mt-[var(--header-safe)] bg-surface">
          <Container>
            <div className="max-w-2xl" data-reveal>
              <p className="eyebrow">{c.label}</p>
              <h2 id="behandelingen-title" className="display mt-4 text-[2.3rem] sm:text-5xl">
                {s.inThisArea}
              </h2>
              <p className="lead mt-4">{s.inThisAreaIntro}</p>
            </div>
            <ul className={`mt-block grid gap-5 sm:grid-cols-2 ${group.treatments.length === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
              {group.treatments.map((t, i) => (
                <li key={t.id} data-reveal style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}>
                  <TreatmentCard locale={locale} id={t.id} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </>
    ),
    expect: (
      <>
        {/* What to expect */}
        <section className="section">
          <Container>
            <SectionHeading eyebrow={s.appointment} title={c.expect.title} />
            <ol className="mt-block grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-line sm:grid-cols-2 lg:grid-cols-4">
              {c.expect.steps.map((step, i) => (
                <li key={step.title} className="bg-paper p-6 sm:p-7" data-reveal style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}>
                  <span className="font-serif text-4xl italic text-accent-deep">0{i + 1}</span>
                  <h3 className="mt-3 font-serif text-[1.55rem] leading-tight text-ink">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      </>
    ),
    info: (
      <>
        {/* Suitability, preparation, aftercare, precautions */}
        <section className="section bg-sand">
          <Container className="grid gap-5 md:grid-cols-2">
            <article className="rounded-[var(--radius-card)] bg-paper p-6 sm:p-8" data-reveal>
              <Icon name="sparkle" className="h-6 w-6 text-accent-deep" />
              <h2 className="mt-4 font-serif text-[1.9rem] leading-tight text-ink">{c.suitable.title}</h2>
              <CheckList items={c.suitable.items} className="mt-5" />
            </article>
            <article className="rounded-[var(--radius-card)] bg-paper p-6 sm:p-8" data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
              <Icon name="calendar" className="h-6 w-6 text-accent-deep" />
              <h2 className="mt-4 font-serif text-[1.9rem] leading-tight text-ink">{s.preparation}</h2>
              <CheckList items={c.preparation} className="mt-5" />
              <ButtonLink href={href(locale, "preparation")} variant="link" arrow className="mt-5">
                {s.readPreparation}
              </ButtonLink>
            </article>
            <article className="rounded-[var(--radius-card)] bg-paper p-6 sm:p-8" data-reveal>
              <Icon name="leaf" className="h-6 w-6 text-accent-deep" />
              <h2 className="mt-4 font-serif text-[1.9rem] leading-tight text-ink">{s.aftercare}</h2>
              <CheckList items={c.aftercare} className="mt-5" />
              <ButtonLink href={href(locale, "aftercare")} variant="link" arrow className="mt-5">
                {s.readAftercare}
              </ButtonLink>
            </article>
            <article className="rounded-[var(--radius-card)] border border-accent/50 bg-paper p-6 sm:p-8" data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
              <Icon name="privacy" className="h-6 w-6 text-accent-deep" />
              <h2 className="mt-4 font-serif text-[1.9rem] leading-tight text-ink">{s.precautions}</h2>
              <CheckList items={c.precautions} icon="info" className="mt-5" />
              <p className="mt-5 text-sm leading-relaxed text-muted">{s.medical}</p>
            </article>
          </Container>
        </section>
      </>
    ),
    faq: (
      <>
        {/* FAQ */}
        <section className="section">
          <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <SectionHeading eyebrow={c.label} title={s.faq} />
              <div className="mt-6" data-reveal>
                <ButtonLink href={href(locale, "faq")} variant="link" arrow>
                  {dict.cta.allFaqs}
                </ButtonLink>
              </div>
            </div>
            <div data-reveal>
              <Faq items={c.faqs} />
            </div>
          </Container>
          <JsonLd data={faqJsonLd(c.faqs)} />
        </section>
      </>
    ),
    others: (
      <>
        {/* Other areas */}
        <section className="section-tight bg-surface">
          <Container>
            <h2 className="eyebrow">{s.otherAreas}</h2>
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {others.map((o) => {
                const oc = categoryCopy(locale, o);
                const og = findGroup(o);
                return (
                  <li key={o} data-reveal>
                    <Link href={categoryHref(locale, o)} className="group grid grid-cols-[6rem_1fr] items-center gap-5 rounded-[var(--radius-card)] border border-line bg-paper p-3 pr-5 transition-shadow duration-500 hover:shadow-card sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] [&>dd]:break-words">
                      {hasPhoto(og.photo) && (
                        <div className="zoom-frame overflow-hidden rounded-2xl">
                          <Photo id={og.photo} locale={locale} ratio={1} sizes="128px" />
                        </div>
                      )}
                      <span>
                        <span className="block font-serif text-[1.7rem] leading-tight text-ink">{oc.label}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{oc.teaser}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      </>
    ),
    closing: (
      <>
        <JsonLd data={singleServiceJsonLd(locale, c.seoTitle, c.seoDescription, path)} />
        <ClosingCta locale={locale} dict={dict} />
      </>
    ),
  };

  return <>{arrangeSections("category", sections)}</>;
}
