import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/ui/Icon";
import { postCopy } from "@/content/copy/blog";
import { postDates, postIds } from "@/content/slugs";
import { intlTag, postHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/** Blog overview: every article, newest first. */
export function BlogIndexPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const fmt = new Intl.DateTimeFormat(intlTag(locale), { day: "numeric", month: "long", year: "numeric" });
  const posts = [...postIds].sort((a, b) => postDates[b].localeCompare(postDates[a]));
  return (
    <>
      <PageHero
        locale={locale}
        photo="botanical"
        ratio={5 / 4}
        tone="orchid"
        photoLabel={dict.common.moodImage}
        crumbs={[{ name: dict.nav.blog }]}
        eyebrow={dict.blog.eyebrow}
        title={dict.blog.title}
        titleEm={dict.blog.titleEm}
        subtitle={dict.blog.intro}
      />
      <section className="section-tight border-t border-line">
        <Container>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((id) => {
              const p = postCopy(locale, id);
              return (
                <li key={id}>
                  <Link
                    href={postHref(locale, id)}
                    className="star-glint group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-colors hover:border-ink/40"
                  >
                    <time dateTime={postDates[id]} className="text-sm text-muted">
                      {fmt.format(new Date(`${postDates[id]}T12:00:00Z`))}
                    </time>
                    <h2 className="mt-3 font-serif text-[1.6rem] leading-tight text-ink">{p.seoTitle}</h2>
                    <p className="mt-3 flex-1 leading-relaxed text-ink-soft">{p.hero.subtitle}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-accent-deep">
                      {dict.blog.readMore}
                      <Icon name="arrow" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                    </span>
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
