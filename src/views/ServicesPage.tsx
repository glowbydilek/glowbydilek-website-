import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { TreatmentCard } from "@/components/TreatmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { hasPhoto } from "@/content/media";
import { groupCopy, sectionCopy } from "@/content/copy";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { groupHref, publicGroups, publicItems, publicSections, sectionHref } from "@/lib/catalogue";

/**
 * "Alle behandelingen": every published, translated treatment on one page,
 * grouped by category and sub-category. Each card links to its detail page
 * and to the booking page with the treatment preselected.
 */
export function ServicesPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const meta = dict.meta.pages.services;
  const sections = publicSections(locale).map((s) => {
    const groups = publicGroups(s.id, locale)
      .map((g) => ({ id: g.id, label: groupCopy(locale, g.id, g.name[locale]).label, href: groupHref(locale, g), items: publicItems({ sectionId: s.id, groupId: g.id, locale }) }))
      .filter((g) => g.items.length);
    const loose = publicItems({ sectionId: s.id, groupId: null, locale });
    return {
      s,
      anchor: `cat-${s.id}`,
      link: s.id === "waxing" ? href(locale, "treatments") : sectionHref(locale, s),
      teaser: s.id === "waxing" ? dict.nav.waxingTeaser : sectionCopy(locale, s.id, s.name[locale]).teaser,
      groups: [...groups, ...(loose.length ? [{ id: "_", label: groups.length ? s.name[locale] : null, href: null, items: loose }] : [])],
      count: groups.reduce((n, g) => n + g.items.length, 0) + loose.length,
    };
  });

  return (
    <>
      <PageHero locale={locale} photo="treatments-hero" ratio={5 / 4} eyebrow={dict.nav.allTreatments} title={meta.title} subtitle={meta.description}>
        <ButtonLink href={href(locale, "booking")} arrow>
          {dict.cta.request}
        </ButtonLink>
      </PageHero>

      <nav aria-label={dict.nav.categories} className="sticky top-16 lg:top-[4.75rem] z-20 border-y border-line/70 bg-paper/90 backdrop-blur">
        <Container>
          <ul className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
            {sections.map(({ s, anchor, count }) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${anchor}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm text-ink transition-colors hover:border-accent hover:text-accent-deep">
                  {s.name[locale]}
                  <span className="text-xs text-muted">{count}</span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </nav>

      {sections.map(({ s, anchor, link, teaser, groups }, i) => (
        <section key={s.id} id={anchor} aria-labelledby={`${anchor}-h`} className={`section scroll-mt-32 ${i % 2 ? "bg-paper" : "bg-surface"}`}>
          <Container>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
              <div>
                <h2 id={`${anchor}-h`} className="font-serif text-[clamp(1.6rem,1.1rem+2.6vw,2.9rem)] leading-tight text-ink">
                  {s.name[locale]}
                </h2>
                {teaser && <p className="mt-3 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">{teaser}</p>}
                <Link href={link} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent-deep underline-offset-4 hover:underline">
                  {dict.service.viewCategory.replace("{name}", s.name[locale])}
                  <Icon name="arrow" className="h-3.5 w-3.5" />
                </Link>
              </div>
              {hasPhoto(s.photo) && (
                <div className="hidden overflow-hidden rounded-[var(--radius-media)] lg:block">
                  <Photo id={s.photo} locale={locale} ratio={21 / 9} sizes="55vw" />
                </div>
              )}
            </div>
            {groups.map((g) => (
              <div key={g.id} className="mt-12">
                {g.label && (
                  <h3 className="mb-6 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-muted">
                    {g.href ? (
                      <Link href={g.href} className="hover:text-accent-deep">
                        {g.label}
                      </Link>
                    ) : (
                      g.label
                    )}
                  </h3>
                )}
                <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((t) => (
                    <li key={t.id}>
                      <TreatmentCard locale={locale} id={t.id} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Container>
        </section>
      ))}
      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}
