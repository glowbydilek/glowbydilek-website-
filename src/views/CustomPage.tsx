import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { override } from "@/lib/cms/current";
import { BLANK_CUSTOM, paragraphs, type CustomPageContent } from "@/lib/cms/custom";
import { mergeContent } from "@/lib/cms/registry";
import { ensureContent } from "@/lib/cms/store";
import { withDbOrFallback } from "@/lib/db/client";
import { customPages } from "@/lib/db/schema";
import { buildMetadata } from "@/lib/seo";

async function load(locale: Locale, slug: string) {
  await ensureContent();
  const page = await withDbOrFallback(async (db) => {
    const [p] = await db
      .select()
      .from(customPages)
      .where(and(locale === "nl" ? eq(customPages.slugNl, slug) : eq(customPages.slugEn, slug)))
      .limit(1);
    return p ?? null;
  }, null);
  if (!page) return null;
  const content = override(`custom:${page.id}`, locale);
  // Offline pages are only visible in the owner's preview.
  if (!content || (!page.published && !(await ensureContent()).preview)) return null;
  return { page, c: mergeContent(BLANK_CUSTOM, content) as CustomPageContent };
}

export async function customPageMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const r = await load(locale, slug);
  if (!r) return {};
  return buildMetadata({
    locale,
    paths: { nl: `/info/${r.page.slugNl}`, en: `/en/info/${r.page.slugEn}` },
    title: r.c.seoTitle || r.c.title,
    description: r.c.seoDescription || r.c.intro.slice(0, 160),
    noindex: r.page.noindex,
  });
}

/** Owner-created information page: plain text only (rendered escaped). */
export async function CustomPageView({ locale, slug }: { locale: Locale; slug: string }) {
  const r = await load(locale, slug);
  if (!r) notFound();
  const dict = getDictionary(locale);
  return (
    <>
      <section className="pt-header border-b border-stone/70 bg-ivory pb-[var(--space-section-tight)]">
        <Container>
          <div className="max-w-3xl">
            <div className="mb-6"><Breadcrumbs label={dict.nav.breadcrumb} items={[{ name: dict.nav.home, href: locale === "nl" ? "/" : "/en" }, { name: r.c.title }]} /></div>
            <h1 className="display text-[2.5rem] sm:text-6xl">{r.c.title}</h1>
            {r.c.intro && <p className="lead mt-5">{r.c.intro}</p>}
          </div>
        </Container>
      </section>
      <section className="section-tight">
        <Container>
          <div className="max-w-3xl space-y-10">
            {r.c.sections.filter((s) => s.heading || s.text).map((s, i) => (
              <section key={i}>
                {s.heading && <h2 className="display text-[1.9rem] sm:text-[2.4rem]">{s.heading}</h2>}
                {paragraphs(s.text).map((p, j) => (
                  <p key={j} className="mt-4 whitespace-pre-line text-[1.05rem] leading-relaxed text-charcoal-soft">{p}</p>
                ))}
              </section>
            ))}
          </div>
        </Container>
      </section>
      <ClosingCta locale={locale} dict={dict} />
    </>
  );
}
