import Link from "next/link";
import { Glint } from "@/components/brand/Logo";
import { Container } from "@/components/Container";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { ReportReview } from "@/components/ReportReview";
import { siteConfig } from "@/content/site";
import { allTreatments } from "@/content/treatments";
import { href, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { withDbOrFallback } from "@/lib/db/client";
import { turnstileSiteKey } from "@/lib/forms/turnstile";
import { defaultReviewSettings, getReviewSettings, publishedReviews } from "@/lib/reviews/service";

/**
 * Reviews page: published reviews as crawlable HTML (no review rich-result
 * markup — Google ignores self-serving reviews) and the review form.
 */
export async function ReviewsPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.reviews;
  const data = await withDbOrFallback(async (db) => ({ ...(await publishedReviews(db, t.anonymous)), settings: await getReviewSettings(db) }), { list: [], count: 0, average: null, settings: defaultReviewSettings });
  const names = Object.fromEntries(allTreatments().map((x) => [x.id, x.name[locale]]));
  const fmt = new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", { month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });
  return (
    <>
      <section className="pt-header pb-10 sm:pb-14">
        <Container className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="rise">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="display mt-4 text-[2.75rem] text-ink sm:text-6xl lg:text-7xl">{t.title}</h1>
          </div>
          <div className="rise" style={{ ["--rise-delay" as string]: "120ms" }}>
            <p className="lead">{t.intro}</p>
            {data.count > 0 && data.average != null && (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                <span aria-hidden="true" className="text-accent">
                  {"★".repeat(Math.round(data.average))}
                </span>
                {t.average.replace("{avg}", data.average.toLocaleString(locale === "nl" ? "nl-NL" : "en-GB")).replace("{count}", String(data.count))}
              </p>
            )}
          </div>
        </Container>
      </section>

      <section className="section-tight border-t border-line">
        <Container>
          {data.list.length ? (
            <ul className="grid gap-x-12 gap-y-10 md:grid-cols-2">
              {data.list.map((r) => (
                <li key={r.id} className="border-t border-line pt-6" lang={r.locale}>
                  <article>
                    <p aria-label={`${r.rating} / 5`} className="text-lg tracking-[0.15em] text-accent">
                      {"★".repeat(r.rating)}
                      <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                    </p>
                    <blockquote className="mt-3 font-serif text-[1.35rem] leading-snug text-ink">{r.body}</blockquote>
                    <p className="mt-4 text-sm text-muted">
                      {r.name} · {fmt.format(r.date)}
                      {r.treatmentId && names[r.treatmentId] ? ` · ${names[r.treatmentId]}` : ""}
                      {r.verified ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-accent-deep">
                          <Glint className="h-2.5 w-auto" />
                          {t.verified}
                        </span>
                      ) : null}
                    </p>
                    {r.reply && (
                      <div className="mt-4 border-l-2 border-glow pl-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-deep">{t.reply}</p>
                        <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{r.reply}</p>
                      </div>
                    )}
                    <ReportReview id={r.id} label={t.report} done={t.reported} />
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">{t.empty}</p>
          )}
        </Container>
      </section>

      <section id={locale === "nl" ? "schrijven" : "write"} className="section scroll-mt-[var(--header-safe)] bg-sand">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="display text-[2.25rem] text-ink sm:text-5xl">{t.form.title}</h2>
            <p className="mt-4 leading-relaxed text-ink-soft">{t.form.intro}</p>
            {data.settings.googleReviewUrl && (
              <p className="mt-6">
                <a href={data.settings.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="link-underline text-accent-deep">
                  {t.google} ↗
                </a>
              </p>
            )}
            <p className="mt-6 text-sm text-muted">
              <Link href={href(locale, "booking")} className="link-underline">
                {dict.nav.booking}
              </Link>
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-surface p-6 sm:p-9">
            <ReviewForm locale={locale} t={t.form} forms={dict.forms} privacyHref={href(locale, "privacy")} email={siteConfig.contact.email} turnstileSiteKey={turnstileSiteKey()} />
          </div>
        </Container>
      </section>
    </>
  );
}
