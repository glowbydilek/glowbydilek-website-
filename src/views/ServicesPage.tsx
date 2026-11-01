import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { hasPhoto } from "@/content/media";
import { sectionCopy } from "@/content/copy";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicItems, publicSections, sectionHref } from "@/lib/catalogue";

/** Overview of every published service section. */
export function ServicesPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const sections = publicSections();
  const meta = dict.meta.pages.services;
  return (
    <>
      <PageHero locale={locale} photo="treatments-hero" ratio={5 / 4} eyebrow={dict.nav.treatments} title={meta.title} subtitle={meta.description}>
        <ButtonLink href={href(locale, "booking")} arrow>
          {dict.cta.request}
        </ButtonLink>
      </PageHero>
      <section className="section border-t border-line/70 bg-surface">
        <Container>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s, i) => {
              const link = s.id === "waxing" ? href(locale, "treatments") : sectionHref(locale, s);
              const teaser = s.id === "waxing" ? dict.nav.waxingTeaser : sectionCopy(locale, s.id, s.name[locale]).teaser;
              const count = publicItems({ sectionId: s.id }).length;
              return (
                <li key={s.id} data-reveal style={{ ["--reveal-delay" as string]: `${(i % 3) * 70}ms` }}>
                  <Link href={link} className="group block">
                    {hasPhoto(s.photo) && (
                      <div className="zoom-frame overflow-hidden rounded-[var(--radius-media)]">
                        <Photo id={s.photo} locale={locale} ratio={4 / 5} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
                      </div>
                    )}
                    <h2 className="mt-5 flex items-center gap-2 font-serif text-[1.9rem] leading-tight text-ink group-hover:text-accent-deep">
                      {s.name[locale]}
                      <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                    </h2>
                    {teaser && <p className="mt-2 leading-relaxed text-ink-soft">{teaser}</p>}
                    <p className="mt-2 text-sm text-muted">{dict.treatments.count.replace("{n}", String(count))}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}
