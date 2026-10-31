import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { CheckList } from "@/components/ui/CheckList";
import { Icon } from "@/components/ui/Icon";
import { guideCopy, type GuideKey } from "@/content/copy";
import type { PhotoId } from "@/content/media";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const photos: Record<GuideKey, { id: PhotoId; ratio: number; mood?: boolean }> = {
  process: { id: "experience", ratio: 5 / 4, mood: true },
  preparation: { id: "linen", ratio: 5 / 4, mood: true },
  aftercare: { id: "dropper", ratio: 5 / 4 },
};

const related: Record<GuideKey, RouteKey[]> = {
  process: ["preparation", "aftercare", "faq"],
  preparation: ["aftercare", "process", "faq"],
  aftercare: ["preparation", "process", "faq"],
};

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Educational page: appointment process, preparation or aftercare. */
export function GuidePage({ locale, page }: { locale: Locale; page: GuideKey }) {
  const dict = getDictionary(locale);
  const g = guideCopy(locale, page);
  const photo = photos[page];

  return (
    <>
      <PageHero
        locale={locale}
        photo={photo.id}
        ratio={photo.ratio}
        photoLabel={photo.mood ? dict.common.moodImage : undefined}
        crumbs={[{ name: dict.nav[page] }]}
        {...g.hero}
      >
        <ButtonLink href={href(locale, "booking")} arrow>
          {dict.cta.request}
        </ButtonLink>
      </PageHero>

      <section className="section-tight border-t border-stone/70">
        <Container className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
          <nav aria-label={g.hero.eyebrow} className="hidden lg:block">
            <ol className="sticky top-[calc(var(--header-safe)+2rem)] space-y-1 border-l border-stone">
              {g.sections.map((sec) => (
                <li key={sec.title}>
                  <a href={`#${slug(sec.title)}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted transition-colors hover:border-gold-deep hover:text-charcoal">
                    {sec.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-3xl">
            {g.sections.map((sec, i) => (
              <section
                key={sec.title}
                id={slug(sec.title)}
                aria-labelledby={`${slug(sec.title)}-h`}
                className={`scroll-mt-[calc(var(--header-safe)+1.5rem)] ${i > 0 ? "mt-10 border-t border-stone pt-10" : ""}`}
              >
                <h2 id={`${slug(sec.title)}-h`} className="display text-[1.9rem] sm:text-[2.4rem]">
                  {sec.title}
                </h2>
                {sec.paragraphs?.map((p) => (
                  <p key={p} className="mt-4 text-[1.05rem] leading-relaxed text-charcoal-soft">
                    {p}
                  </p>
                ))}
                {sec.items && <CheckList items={sec.items} className="mt-5" />}
              </section>
            ))}
            {g.caveat && (
              <aside className="mt-12 flex gap-4 rounded-[var(--radius-card)] border border-gold/50 bg-nude-light p-6">
                <Icon name="info" className="mt-0.5 h-6 w-6 shrink-0 text-gold-deep" />
                <div>
                  <h2 className="font-serif text-2xl text-charcoal">{dict.guide.caveat}</h2>
                  <p className="mt-2 leading-relaxed text-charcoal-soft">{g.caveat}</p>
                </div>
              </aside>
            )}
          </div>
        </Container>
      </section>

      {g.faqs && (
        <section className="section-tight bg-ivory-50">
          <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <h2 className="display text-[2rem] sm:text-[2.6rem]">{dict.guide.faqTitle}</h2>
            <Faq items={g.faqs} />
          </Container>
          <JsonLd data={faqJsonLd(g.faqs)} />
        </section>
      )}

      <section className="section-tight">
        <Container>
          <h2 className="eyebrow">{dict.guide.readMore}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {related[page].map((key) => (
              <li key={key}>
                <Link
                  href={href(locale, key)}
                  className="group flex h-full items-center justify-between gap-4 rounded-[var(--radius-card)] border border-stone bg-ivory-50 p-5 font-serif text-[1.45rem] leading-tight text-charcoal transition-colors hover:border-charcoal/40"
                >
                  {dict.nav[key]}
                  <Icon name="arrow" className="h-4 w-4 shrink-0 text-gold-deep transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}
