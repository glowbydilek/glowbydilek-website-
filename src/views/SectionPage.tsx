import type { ReactNode } from "react";
import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { TreatmentCard } from "@/components/TreatmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { groupCopy, sectionCopy } from "@/content/copy";
import { bookingHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { groupHref, publicGroups, publicItems, sectionHref, type Section } from "@/lib/catalogue";
import { singleServiceJsonLd } from "@/lib/seo";

/**
 * A service section page (Gezichtsbehandelingen, Lichaamsbehandelingen,
 * Massages, Pakketten or an owner-created section). Only published items
 * are listed; empty copy blocks are left out rather than shown blank.
 */
export function SectionPage({ locale, section }: { locale: Locale; section: Section }) {
  const dict = getDictionary(locale);
  const c = sectionCopy(locale, section.id, section.name[locale]);
  const groups = publicGroups(section.id);
  const loose = publicItems({ sectionId: section.id, groupId: null });

  const blocks: ReactNode[] = [];
  blocks.push(
    <PageHero
      key="hero"
      locale={locale}
      photo={section.photo}
      ratio={5 / 4}
      eyebrow={c.hero.eyebrow}
      title={c.hero.title}
      titleEm={c.hero.titleEm || undefined}
      subtitle={c.hero.subtitle}
      crumbs={[{ name: section.name[locale] }]}
    >
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="#aanbod" arrow>
          {c.listTitle}
        </ButtonLink>
        <ButtonLink href={bookingHref(locale)} variant="outline">
          {dict.cta.request}
        </ButtonLink>
      </div>
    </PageHero>,
  );

  if (c.intro.title || c.intro.paragraphs.length) {
    blocks.push(
      <section key="intro" className="section-tight border-t border-line/70">
        <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {c.intro.title && (
            <h2 className="display text-[2.1rem] sm:text-[2.8rem]" data-reveal>
              {c.intro.title}
            </h2>
          )}
          <div data-reveal>
            {c.intro.paragraphs.map((p) => (
              <p key={p} className="lead mt-4 first:mt-0">
                {p}
              </p>
            ))}
            {c.note && (
              <p className="mt-6 flex gap-3 rounded-2xl bg-glow-soft p-5 text-sm leading-relaxed text-ink-soft">
                <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-accent-deep" />
                {c.note}
              </p>
            )}
          </div>
        </Container>
      </section>,
    );
  }

  blocks.push(
    <section key="list" id="aanbod" aria-labelledby="aanbod-title" className="section scroll-mt-[var(--header-safe)] bg-surface">
      <Container>
        <div className="max-w-2xl" data-reveal>
          <p className="eyebrow">{section.name[locale]}</p>
          <h2 id="aanbod-title" className="display mt-4 text-[2.3rem] sm:text-5xl">
            {c.listTitle}
          </h2>
          {c.listIntro && <p className="lead mt-4">{c.listIntro}</p>}
        </div>
        {groups.map((g) => {
          const gc = groupCopy(locale, g.id, g.name[locale]);
          const items = publicItems({ sectionId: section.id, groupId: g.id });
          return (
            <div key={g.id} className="mt-block">
              <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
                <h3 className="font-serif text-[1.9rem] leading-tight text-ink">{gc.label}</h3>
                <Link href={groupHref(locale, g)} className="text-sm font-medium text-accent-deep underline-offset-4 hover:underline">
                  {dict.service.categoryPage}
                </Link>
              </div>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((i) => (
                  <li key={i.id} data-reveal>
                    <TreatmentCard locale={locale} id={i.id} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {loose.length > 0 && (
          <ul className="mt-block grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {loose.map((i, n) => (
              <li key={i.id} data-reveal style={{ ["--reveal-delay" as string]: `${(n % 3) * 70}ms` }}>
                <TreatmentCard locale={locale} id={i.id} withPhoto />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>,
  );

  if (c.faqs.length) {
    blocks.push(
      <section key="faq" className="section">
        <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <h2 className="display text-[2rem] sm:text-[2.6rem]" data-reveal>
            {dict.service.faq}
          </h2>
          <div data-reveal>
            <Faq items={c.faqs} />
          </div>
        </Container>
        <JsonLd data={faqJsonLd(c.faqs)} />
      </section>,
    );
  }

  blocks.push(<JsonLd key="ld" data={singleServiceJsonLd(locale, c.seoTitle, c.seoDescription, sectionHref(locale, section))} />);
  blocks.push(<ClosingCta key="closing" locale={locale} dict={dict} />);
  return <>{blocks}</>;
}
