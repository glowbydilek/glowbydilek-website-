import type { ReactNode } from "react";
import Link from "next/link";
import { HeroVisual, Ornament } from "@/components/BrandVisual";
import { Glint } from "@/components/brand/Logo";
import { CareTabs } from "@/components/CareTabs";
import { CampaignSlider } from "@/components/CampaignSlider";
import { currentSnapshot } from "@/lib/cms/current";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { hasPhoto } from "@/content/media";
import { mailto, siteConfig } from "@/content/site";
import { treatmentGroups } from "@/content/treatments";
import { groupHref, isPublicItem, itemById, publicGroups, publicItems, publicSections, sectionHref } from "@/lib/catalogue";
import { TreatmentCard } from "@/components/TreatmentCard";
import { groupCopy, sectionCopy } from "@/content/copy";
import { alternatePath, href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { arrangeSections } from "@/lib/cms/sections";

/** Campaign links are stored as Dutch paths; on the English site they map to the English page when known. */
function localiseHref(path: string, locale: Locale): string {
  if (locale === "nl" || path.startsWith("/en")) return path;
  return alternatePath(path, "en") !== "/en" || path === "/" ? alternatePath(path, "en") : path;
}

const defaultFeatured = ["massage-relaxation", "eyebrows", "underarms", "full-legs"];

/**
 * Service discovery rows: the published sections once there are several
 * (waxing, facial, body, massage, packages); with waxing alone, its zones.
 */
function discovery(locale: Locale) {
  const sections = publicSections();
  if (sections.length > 1) {
    return sections.map((sec) => {
      const items = publicItems({ sectionId: sec.id });
      const c = sec.id === "waxing" ? null : sectionCopy(locale, sec.id, sec.name[locale]);
      return {
        id: sec.id,
        photo: sec.photo,
        label: sec.name[locale],
        intro: c ? c.hero.subtitle : getDictionary(locale).nav.waxingTeaser,
        href: sec.id === "waxing" ? href(locale, "treatments") : sectionHref(locale, sec),
        names: items.map((i) => i.name[locale]),
      };
    });
  }
  return sections.flatMap((sec) =>
    publicGroups(sec.id).map((g) => {
      const b = treatmentGroups.find((x) => x.id === g.id);
      const c = groupCopy(locale, g.id, g.name[locale]);
      return {
        id: g.id,
        photo: g.photo,
        label: c.label,
        intro: b?.intro[locale] ?? c.teaser,
        href: groupHref(locale, g),
        names: publicItems({ sectionId: sec.id, groupId: g.id }).map((i) => i.name[locale]),
      };
    }),
  );
}

/** Owner-featured items (Admin → Behandelingen), else a calm default selection. */
function featuredIds(): string[] {
  const owner = publicItems().filter((i) => i.featured).map((i) => i.id);
  const list = owner.length ? owner : defaultFeatured.filter((id) => {
    const i = itemById(id);
    return i && isPublicItem(i);
  });
  return list.slice(0, 4);
}

export function HomePage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.home;
  const faqs = dict.faq.general.slice(0, 6);
  const rows = discovery(locale);
  const featured = featuredIds();

  const sections: Record<string, ReactNode> = {
    hero: (
      <>
        {/* 1 ─ Hero: luminous backdrop, arched mood portrait */}
        <section className="atelier-light pt-header relative overflow-hidden pb-[var(--space-section-tight)]">
          <Container className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <p className="eyebrow rise">{t.hero.eyebrow}</p>
              <h1 className="display rise mt-5 text-[2.75rem] [--rise-delay:80ms] min-[400px]:text-[3.1rem] sm:text-7xl lg:text-[5.6rem]">
                {t.hero.title}
                <br />
                <em>{t.hero.titleEm}</em>
              </h1>
              <p className="lead rise mt-6 max-w-lg [--rise-delay:160ms]">{t.hero.subtitle}</p>
              <div className="rise mt-8 flex flex-wrap items-center gap-3 [--rise-delay:240ms]">
                <ButtonLink href={href(locale, "booking")} arrow className="sheen">
                  {dict.cta.request}
                </ButtonLink>
                <ButtonLink href={rows.length > 1 ? href(locale, "services") : href(locale, "treatments")} variant="outline">
                  {dict.cta.explore}
                </ButtonLink>
              </div>
              <ul className="rise mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm text-ink-soft [--rise-delay:320ms]">
                {t.hero.facts.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Glint className="h-3 w-auto text-champagne" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rise [--rise-delay:120ms]">
              <div className={`relative mx-auto lg:ml-auto lg:mr-0 ${hasPhoto("hero") ? "hero-photo-w [--hero-max:30rem]" : "w-full max-w-[28rem]"}`}>
                <div className="arch">
                  <div className="arch-media">
                    <HeroVisual photo="hero" locale={locale} />
                  </div>
                </div>
                <div className="seal absolute -bottom-6 -left-4 sm:-left-8" aria-hidden="true">
                  <span>
                    <Glint className="mx-auto h-4 w-auto text-accent" />
                    <span className="mt-1.5 block px-3 font-serif text-[0.95rem] italic leading-tight text-ink">{dict.meta.tagline}</span>
                  </span>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </>
    ),
    campaigns: (() => {
      const camp = currentSnapshot().marketing?.campaigns ?? [];
      if (!camp.length) return null;
      return (
        <CampaignSlider
          slides={camp.map((c) => ({ id: c.id, title: c.title[locale], text: c.text[locale], cta: c.cta[locale], href: localiseHref(c.href, locale), image: c.mediaId ? `/media/${c.mediaId}/1024` : null }))}
          labels={dict.campaign}
        />
      );
    })(),
    reviews: (() => {
      const rv = currentSnapshot().marketing?.reviews;
      if (!rv?.list.length) return null;
      const r = dict.reviews;
      return (
        <section className="section-tight bg-surface">
          <Container>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <SectionHeading eyebrow={r.eyebrow} title={r.title} intro={rv.average != null ? r.average.replace("{avg}", rv.average.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB")).replace("{count}", String(rv.count)) : undefined} size="md" />
              <ButtonLink href={href(locale, "reviews")} variant="link" arrow>
                {dict.nav.reviews}
              </ButtonLink>
            </div>
            <ul className="mt-block grid gap-5 md:grid-cols-3">
              {rv.list.map((x) => (
                <li key={x.id} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-paper p-6" data-reveal>
                  <p className="text-accent" aria-label={`${x.rating} / 5`}>{"★".repeat(x.rating)}<span className="text-line">{"★".repeat(5 - x.rating)}</span></p>
                  <blockquote lang={x.locale} className="mt-3 flex-1 leading-relaxed text-ink-soft">“{x.body.length > 280 ? `${x.body.slice(0, 277)}…` : x.body}”</blockquote>
                  <p className="mt-4 text-sm text-ink">
                    {x.name === "—" ? r.anonymous : x.name}
                    {x.verified && <span className="ml-2 text-xs text-muted">· {r.verified}</span>}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      );
    })(),
    statement: (
      <>
        {/* 2 ─ Statement: a still life beside the quote (photo editable in Admin → Foto's) */}
        <section className="section atelier-wash">
          <Container className="grid items-center gap-10 md:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div data-reveal className="mx-auto w-full max-w-[22rem] md:max-w-none">
              <div className="arch"><div className="arch-media"><Photo id="botanical" locale={locale} ratio={4 / 5} sizes="(min-width: 768px) 38vw, 90vw" /></div></div>
            </div>
            <div data-reveal className="text-center md:text-left">
              <p className="eyebrow">{t.statement.eyebrow}</p>
              <blockquote className="display mt-6 text-[2.15rem] text-ink sm:text-5xl lg:text-[3.4rem]">“{t.statement.quote}”</blockquote>
              <div className="mt-8 flex justify-center md:justify-start"><Ornament className="h-4 w-auto" /></div>
              <p className="lead mt-8 max-w-2xl md:mx-0">{t.statement.body}</p>
              <p className="script mt-5 text-3xl text-accent-deep" aria-label={`— ${t.statement.signature}`}>
                — {t.statement.signature}
              </p>
            </div>
          </Container>
        </section>
      </>
    ),
    treatments: (
      <>
        {/* 3 ─ Treatments: editorial index */}
        <section className="section">
          <Container>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading eyebrow={t.treatments.eyebrow} title={t.treatments.title} intro={t.treatments.intro} />
              <div data-reveal className="shrink-0">
                <ButtonLink href={href(locale, "treatments")} variant="outline" arrow>
                  {dict.cta.viewTreatments}
                </ButtonLink>
              </div>
            </div>
            <ul className={`mt-block grid gap-5 ${rows.length === 2 ? "md:grid-cols-2" : rows.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
              {rows.map((g, i) => (
                <li key={g.id} data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                  <Link href={g.href} className="discover-card sheen group">
                    {hasPhoto(g.photo) ? (
                      <div className="zoom-frame">
                        <Photo id={g.photo} locale={locale} ratio={rows.length <= 2 ? 5 / 4 : 4 / 5} sizes={rows.length <= 2 ? "(min-width: 768px) 46vw, 92vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"} />
                      </div>
                    ) : (
                      <div className="aspect-[5/4] bg-accent-deep" />
                    )}
                    <div className="discover-copy">
                      <p className="text-xs uppercase tracking-[0.2em] text-paper/80">
                        {g.names.length} {g.names.length === 1 ? t.treatments.countOne : t.treatments.count}
                      </p>
                      <h3 className="mt-2 font-serif text-[2.1rem] leading-none text-paper sm:text-[2.6rem]">{g.label}</h3>
                      <p className="mt-3 max-w-md leading-relaxed text-paper/85">{g.intro}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-paper">
                        <span className="sr-only">{t.treatments.more}: </span>
                        {g.names.slice(0, 3).join(" · ")}
                        <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </>
    ),
    featured: (
      <>
        {/* 3b ─ Featured treatments (each links to its own page) */}
        <section className="section-tight">
          <Container>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <SectionHeading eyebrow={dict.hub.eyebrow} title={dict.hub.featuredTitle} intro={dict.hub.featuredIntro} size="md" />
            </div>
            <ul className="mt-block grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((id, i) => (
                <li key={id} data-reveal style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}>
                  <TreatmentCard locale={locale} id={id} withPhoto />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </>
    ),
    process: (
      <>
        {/* 4 ─ How it works */}
        <section className="section plum-band on-dark">
          <Container>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading eyebrow={t.experience.eyebrow} title={t.experience.title} intro={t.experience.intro} />
              <div data-reveal className="shrink-0">
                <ButtonLink href={href(locale, "process")} variant="outline-light" arrow>
                  {dict.hub.afterLink}
                </ButtonLink>
              </div>
            </div>
            <ol className="mt-block grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {t.experience.steps.map((s, i) => (
                <li key={s.title} className="relative border-t border-paper/20 pt-6" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                  <span className="font-serif text-5xl italic leading-none text-champagne">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-4 font-serif text-[1.6rem] leading-tight text-paper">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-paper/80">{s.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      </>
    ),
    standards: (
      <>
        {/* 5 ─ Standards */}
        <section className="section">
          <Container className={`grid gap-10 lg:gap-16 ${hasPhoto("materials") ? "md:grid-cols-[0.85fr_1.15fr] md:items-center" : "lg:grid-cols-[0.8fr_1.2fr]"}`}>
            <div>
              <SectionHeading eyebrow={t.standards.eyebrow} title={t.standards.title} intro={t.standards.intro} />
              {hasPhoto("materials") && (
                <div className="mt-8 overflow-hidden rounded-[var(--radius-media)]" data-reveal="mask">
                  <Photo id="materials" locale={locale} ratio={4 / 3} sizes="(min-width: 768px) 36vw, 92vw" />
                </div>
              )}
            </div>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {dict.trust.map((item, i) => (
                <li key={item.title} className="border-t border-line pt-5" data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
                  <Icon name={item.icon as IconName} className="h-6 w-6 text-accent-deep" />
                  <h3 className="mt-4 font-serif text-[1.65rem] leading-tight text-ink">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{item.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </>
    ),
    dilek: (
      <>
        {/* 6 ─ Meet Dilek */}
        <section className="section atelier-mist">
          <Container className="grid items-center gap-10 md:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            {hasPhoto("interior") ? (
              <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[var(--radius-media)] md:max-w-none" data-reveal="mask">
                <Photo id="interior" locale={locale} sizes="(min-width: 768px) 38vw, 85vw" />
              </div>
            ) : (
              <div className="rounded-[var(--radius-media)] border border-accent/40 bg-surface px-8 py-12 text-center sm:px-12" data-reveal>
                <Ornament className="h-8 w-auto" />
                <p className="display mt-7 text-[1.9rem] italic text-ink sm:text-[2.3rem]">“{t.dilek.quote}”</p>
                <p className="script mt-6 text-5xl text-accent-deep">Dilek</p>
              </div>
            )}
            <div>
              <SectionHeading eyebrow={t.dilek.eyebrow} title={t.dilek.title} />
              <p className="lead mt-5" data-reveal>
                {t.dilek.body}
              </p>
              <div className="mt-8" data-reveal>
                <ButtonLink href={href(locale, "about")} arrow>
                  {dict.cta.aboutDilek}
                </ButtonLink>
              </div>
            </div>
          </Container>
        </section>
      </>
    ),
    care: (
      <>
        {/* 7 ─ Preparation & aftercare */}
        <section className="section">
          <Container className="grid items-start gap-10 md:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="md:sticky md:top-[calc(var(--header-safe)+2rem)]">
              <SectionHeading eyebrow={t.care.eyebrow} title={t.care.title} intro={t.care.intro} />
              <div className="mt-7 rounded-[var(--radius-card)] bg-sand p-6" data-reveal>
                <h3 className="flex items-center gap-3 font-serif text-2xl text-ink">
                  <Icon name="sparkle" className="h-5 w-5 text-accent-deep" />
                  {t.care.firstTime.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{t.care.firstTime.body}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2" data-reveal>
                <ButtonLink href={href(locale, "preparation")} variant="link" arrow>
                  {dict.nav.preparation}
                </ButtonLink>
                <ButtonLink href={href(locale, "aftercare")} variant="link" arrow>
                  {dict.nav.aftercare}
                </ButtonLink>
              </div>
            </div>
            <div data-reveal>
              <CareTabs care={dict.care} />
            </div>
          </Container>
        </section>
      </>
    ),
    faq: (
      <>
        {/* 8 ─ FAQ */}
        <section className="section bg-surface">
          <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} intro={t.faq.intro} />
              <div className="mt-6" data-reveal>
                <ButtonLink href={href(locale, "faq")} variant="link" arrow>
                  {dict.cta.allFaqs}
                </ButtonLink>
              </div>
            </div>
            <div data-reveal>
              <Faq items={faqs} />
            </div>
          </Container>
          <JsonLd data={faqJsonLd(faqs)} />
        </section>
      </>
    ),
    closing: (
      <>
        {/* 9 ─ Booking invitation (single dark band) */}
        <ClosingCta locale={locale} dict={dict} />
      </>
    ),
    contact: (
      <>
        {/* 10 ─ Contact strip */}
        <section className="section-tight">
          <Container className="flex flex-col items-start justify-between gap-6 border-t border-line pt-[var(--space-section-tight)] md:flex-row md:items-center">
            <div className="max-w-xl" data-reveal>
              <h2 className="display text-[2rem] sm:text-4xl">{t.contact.eyebrow}</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{t.contact.body}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3" data-reveal>
              <ButtonLink href={href(locale, "contact")} variant="outline" arrow>
                {dict.cta.sendMessage}
              </ButtonLink>
              <ButtonLink href={mailto(dict.forms.topics.question)} variant="link">
                {siteConfig.contact.email}
              </ButtonLink>
            </div>
          </Container>
        </section>
      </>
    ),
  };

  return <>{arrangeSections("home", sections)}</>;
}
