import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { CheckList } from "@/components/ui/CheckList";
import { Icon } from "@/components/ui/Icon";
import type { ArticleCopy } from "@/content/copy/blog";
import type { PhotoId } from "@/content/media";
import { href, intlTag, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isPublicItem, itemById, itemHref } from "@/lib/catalogue";
import type { BreadcrumbItem } from "@/components/ui/Breadcrumbs";

/**
 * Long-form page: the Amsterdam-Noord page and blog articles. Sections,
 * optional FAQ (with FAQPage data) and descriptive internal links to the
 * related treatment pages and guides.
 */
export function ArticlePage({
  locale,
  copy,
  crumbs,
  photo = "linen",
  published,
}: {
  locale: Locale;
  copy: ArticleCopy;
  crumbs: BreadcrumbItem[];
  photo?: PhotoId;
  /** ISO date shown under the article (blog posts). */
  published?: string;
}) {
  const dict = getDictionary(locale);
  const treatments = copy.treatments.flatMap((id) => {
    const it = itemById(id);
    return it && isPublicItem(it) && (locale !== "tr" || it.name.tr.trim()) ? [{ id, href: itemHref(locale, it), label: it.name[locale] }] : [];
  });
  const date = published
    ? new Intl.DateTimeFormat(intlTag(locale), { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${published}T12:00:00Z`))
    : null;

  return (
    <>
      <PageHero locale={locale} tone="orchid" photo={photo} ratio={5 / 4} photoLabel={dict.common.moodImage} crumbs={crumbs} {...copy.hero}>
        <ButtonLink href={href(locale, "booking")} arrow>
          {dict.cta.request}
        </ButtonLink>
      </PageHero>

      <section className="section-tight border-t border-line/70">
        <Container>
          <article className="mx-auto max-w-3xl">
            {date && published && (
              <p className="mb-8 text-sm text-muted">
                {dict.blog.published} <time dateTime={published}>{date}</time>
              </p>
            )}
            {copy.sections.map((sec, i) => (
              <section key={sec.title} className={i > 0 ? "mt-10 border-t border-line pt-10" : ""}>
                <h2 className="display text-[1.9rem] sm:text-[2.4rem]">{sec.title}</h2>
                {sec.paragraphs?.map((p) => (
                  <p key={p} className="mt-4 text-[1.05rem] leading-relaxed text-ink-soft">
                    {p}
                  </p>
                ))}
                {sec.items && <CheckList items={sec.items} className="mt-5" />}
              </section>
            ))}
          </article>
        </Container>
      </section>

      {copy.faqs && copy.faqs.length > 0 && (
        <section className="section-tight bg-surface">
          <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <h2 className="display text-[2rem] sm:text-[2.6rem]">{dict.blog.faqTitle}</h2>
            <Faq items={copy.faqs} />
          </Container>
          <JsonLd data={faqJsonLd(copy.faqs)} />
        </section>
      )}

      <section className="section-tight">
        <Container className="space-y-10">
          {treatments.length > 0 && (
            <div>
              <h2 className="eyebrow">{dict.blog.related}</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {treatments.map((t) => (
                  <li key={t.id}>
                    <CardLink href={t.href} label={t.label} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="eyebrow">{dict.blog.readAlso}</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {copy.pages.map((key) => (
                <li key={key}>
                  <CardLink href={href(locale, key)} label={dict.nav[key]} />
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}

function CardLink({ href: to, label }: { href: string; label: string }) {
  return (
    <Link
      href={to}
      className="star-glint group flex h-full items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 font-serif text-[1.45rem] leading-tight text-ink transition-colors hover:border-ink/40"
    >
      {label}
      <Icon name="arrow" className="h-4 w-4 shrink-0 text-accent-deep transition-transform duration-500 group-hover:translate-x-1" />
    </Link>
  );
}
