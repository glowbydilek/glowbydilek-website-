import { Container } from "@/components/Container";
import { QuoteResponse } from "@/components/forms/QuoteResponse";
import { Glint } from "@/components/brand/Logo";
import { mailto } from "@/content/site";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { quoteByToken } from "@/lib/booking/quotes";
import { formatCents } from "@/lib/finance/money";
import { formatLongDate, formatTime, localToUtc } from "@/lib/time";

type Q = NonNullable<Awaited<ReturnType<typeof quoteByToken>>>;

/** Personal price-proposal page (reached only through the emailed link; noindex). */
export function QuotePage({ locale, q, token }: { locale: Locale; q: Q | null; token: string }) {
  const t = getDictionary(locale).quote;
  const when = q?.startAt
    ? `${formatLongDate(q.startAt, locale)} · ${formatTime(q.startAt, locale)}`
    : q?.requestedDate
      ? formatLongDate(localToUtc(q.requestedDate, 720), locale)
      : null;
  return (
    <section className="pt-header section">
      <Container className="mx-auto max-w-2xl">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="display mt-5 text-[2.6rem] sm:text-6xl">{t.title}</h1>
        {!q ? (
          <p className="lead mt-6">{t.notFound}</p>
        ) : (
          <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-9">
            <p className="text-ink-soft">{t.hello.replace("{name}", q.firstName)}</p>
            <dl className="mt-6 grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-x-4 gap-y-3 text-[0.95rem] [&>dd]:break-words">
              <dt className="text-muted">{t.treatment}</dt>
              <dd className="text-ink">{q.treatments.map((x) => x[locale]).join(", ")}</dd>
              {when && (
                <>
                  <dt className="text-muted">{t.moment}</dt>
                  <dd className="text-ink">{when}</dd>
                </>
              )}
              <dt className="text-muted">{t.price}</dt>
              <dd className="font-serif text-3xl text-ink">
                {formatCents(q.amountCents)} <span className="font-sans text-sm text-muted">{t.inclVat}</span>
              </dd>
              {q.status === "sent" && (
                <>
                  <dt className="text-muted">{t.validUntil}</dt>
                  <dd className="text-ink">{formatLongDate(q.expiresAt, locale)}</dd>
                </>
              )}
            </dl>
            {q.message && <p className="mt-6 whitespace-pre-wrap border-l-2 border-accent pl-4 leading-relaxed text-ink-soft">{q.message}</p>}
            <div className="mt-8 border-t border-line pt-6">
              {q.status === "sent" ? (
                <>
                  <p className="mb-5 text-sm leading-relaxed text-muted">{t.explain}</p>
                  <QuoteResponse token={token} t={{ accept: t.accept, decline: t.decline, pending: t.pending, accepted: t.accepted, declined: t.declined, errors: t.errors }} />
                </>
              ) : (
                <p role="status" className="flex items-center gap-3 text-ink">
                  <Glint className="h-4 w-auto text-accent" />
                  {t.state[q.status as Exclude<typeof q.status, "sent">]}
                </p>
              )}
            </div>
          </div>
        )}
        <p className="mt-8 text-sm text-muted">
          {t.questions}{" "}
          <a href={mailto(t.title)} className="underline underline-offset-4">
            hello@glowbydilek.nl
          </a>
        </p>
      </Container>
    </section>
  );
}
