import type { ReactNode } from "react";
import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { TreatmentCard } from "@/components/TreatmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { CheckList } from "@/components/ui/CheckList";
import { Icon } from "@/components/ui/Icon";
import { groupCopy, itemCopy } from "@/content/copy";
import { bookingHref, href, type Locale } from "@/i18n/config";
import {
  groupById,
  groupHref,
  isPublicItem,
  itemById,
  itemDuration,
  itemHref,
  priceLabel,
  sectionById,
  sectionHref,
  type Item,
} from "@/lib/catalogue";
import { getDictionary } from "@/i18n/dictionaries";
import { arrangeSections } from "@/lib/cms/sections";
import { singleServiceJsonLd } from "@/lib/seo";

/**
 * Service detail page for any catalogue item (waxing treatment, facial, body,
 * massage, owner-created treatment or package). Copy: built-in or generated
 * defaults, merged with the owner's edits (Admin → Pagina's).
 */
export function TreatmentDetailPage({
  locale,
  item,
}: {
  locale: Locale;
  item: Item;
}) {
  const dict = getDictionary(locale);
  const s = dict.service;
  const id = item.id;
  const t = itemCopy(locale, id, item);
  const section = sectionById(item.sectionId)!;
  const group = item.groupId ? groupById(item.groupId) : undefined;
  const parent = group
    ? {
        label: groupCopy(locale, group.id, group.name[locale]).label,
        href: groupHref(locale, group),
      }
    : { label: section.name[locale], href: sectionHref(locale, section) };
  const sectionLink =
    section.id === "waxing"
      ? href(locale, "treatments")
      : sectionHref(locale, section);
  const price = priceLabel(item, locale, {
    from: dict.prices.from,
    onRequest: s.priceOnRequest,
  });
  const duration = itemDuration(item);
  const portrait = ["zone-face", "hero", "aftercare", "contact"].includes(
    item.photo,
  );
  const parts =
    item.kind === "package"
      ? item.parts
          .map((p) => ({ ...p, item: itemById(p.treatmentId) }))
          .filter((p) => p.item)
      : [];
  const related = item.related
    .map((r) => itemById(r))
    .filter((r): r is Item => Boolean(r && isPublicItem(r)))
    .slice(0, 3);

  const sections: Record<string, ReactNode> = {
    hero: (
      <>
        <PageHero
          locale={locale}
          photo={item.photo}
          ratio={portrait ? 4 / 5 : 5 / 4}
          eyebrow={parent.label}
          title={t.title}
          subtitle={t.lead}
          crumbs={[
            { name: section.name[locale], href: sectionLink },
            ...(group ? [{ name: parent.label, href: parent.href }] : []),
            { name: item.name[locale] },
          ]}
        >
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href={bookingHref(locale, id)} arrow>
              {s.requestThis}
            </ButtonLink>
            <ButtonLink href={href(locale, "process")} variant="outline">
              {s.readProcess}
            </ButtonLink>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[0.66rem] uppercase tracking-[0.16em] text-muted">
                {s.areaLabel}
              </dt>
              <dd className="mt-1 text-ink">{parent.label}</dd>
            </div>
            <div>
              <dt className="text-[0.66rem] uppercase tracking-[0.16em] text-muted">
                {s.price}
              </dt>
              <dd className="mt-1 text-ink">{price}</dd>
            </div>
            {duration && (
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.16em] text-muted">
                  {s.duration}
                </dt>
                <dd className="mt-1 text-ink">
                  {s.minutes.replace("{n}", String(duration))}
                </dd>
              </div>
            )}
            <div className="col-span-2 sm:col-span-1">
              <dt className="sr-only">{dict.contact.hoursTitle}</dt>
              <dd className="flex items-center gap-2 text-ink">
                <Icon name="clock" className="h-4 w-4 text-accent-deep" />
                {dict.common.byAppointment}
              </dd>
            </div>
          </dl>
        </PageHero>
      </>
    ),
    details: (
      <>
        {/* Area + how the appointment goes */}
        <section className="section-tight border-t border-line/70">
          <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div data-reveal>
              <h2 className="display text-[2rem] sm:text-[2.6rem]">
                {t.areaTitle || s.area}
              </h2>
              <p className="lead mt-5">{t.area}</p>
              {parts.length > 0 && (
                <div className="mt-8">
                  <h3 className="eyebrow">{s.included}</h3>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {parts.map((p) => (
                      <li
                        key={p.treatmentId}
                        className="flex items-baseline justify-between gap-4 py-3"
                      >
                        <a
                          href={itemHref(locale, p.item!)}
                          className="font-serif text-xl text-ink underline-offset-4 hover:text-accent-deep hover:underline"
                        >
                          {p.item!.name[locale]}
                        </a>
                        {p.quantity > 1 && (
                          <span className="text-sm text-muted">
                            × {p.quantity}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {t.appointment.length > 0 && (
              <div
                data-reveal
                style={{ ["--reveal-delay" as string]: "100ms" }}
              >
                <h2 className="display text-[2rem] sm:text-[2.6rem]">
                  {s.appointment}
                </h2>
                {t.appointment.map((p) => (
                  <p key={p} className="mt-5 leading-relaxed text-ink-soft">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </Container>
        </section>
      </>
    ),
    info:
      !t.know.length && !t.reactions.length && !t.aftercare.length ? null : (
        <>
          {/* Before, reactions, aftercare */}
          <section className="section bg-sand">
            <Container className="grid gap-5 lg:grid-cols-3">
              <article
                className="rounded-[var(--radius-card)] bg-paper p-6 sm:p-8"
                data-reveal
              >
                <Icon name="info" className="h-6 w-6 text-accent-deep" />
                <h2 className="mt-4 font-serif text-[1.8rem] leading-tight text-ink">
                  {s.know}
                </h2>
                <CheckList items={t.know} className="mt-5" />
              </article>
              <article
                className="rounded-[var(--radius-card)] border border-accent/50 bg-paper p-6 sm:p-8"
                data-reveal
                style={{ ["--reveal-delay" as string]: "80ms" }}
              >
                <Icon name="privacy" className="h-6 w-6 text-accent-deep" />
                <h2 className="mt-4 font-serif text-[1.8rem] leading-tight text-ink">
                  {s.reactions}
                </h2>
                <CheckList items={t.reactions} icon="info" className="mt-5" />
              </article>
              <article
                className="rounded-[var(--radius-card)] bg-paper p-6 sm:p-8"
                data-reveal
                style={{ ["--reveal-delay" as string]: "160ms" }}
              >
                <Icon name="leaf" className="h-6 w-6 text-accent-deep" />
                <h2 className="mt-4 font-serif text-[1.8rem] leading-tight text-ink">
                  {s.aftercare}
                </h2>
                <CheckList items={t.aftercare} className="mt-5" />
                <ButtonLink
                  href={href(locale, "aftercare")}
                  variant="link"
                  arrow
                  className="mt-5"
                >
                  {s.readAftercare}
                </ButtonLink>
              </article>
            </Container>
          </section>
        </>
      ),
    request: (
      <>
        {/* Recovery + request */}
        <section className="section">
          <Container className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div data-reveal>
              <h2 className="display text-[2rem] sm:text-[2.6rem]">
                {s.recovery}
              </h2>
              <p className="lead mt-5">{t.recovery}</p>
              <p className="mt-6 flex gap-3 rounded-2xl bg-glow-soft p-5 text-sm leading-relaxed text-ink-soft">
                <Icon
                  name="info"
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent-deep"
                />
                {s.medical}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
                <ButtonLink
                  href={href(locale, "preparation")}
                  variant="link"
                  arrow
                >
                  {s.readPreparation}
                </ButtonLink>
                <ButtonLink href={href(locale, "faq")} variant="link" arrow>
                  {dict.cta.allFaqs}
                </ButtonLink>
              </div>
            </div>
            <div
              className="on-dark rounded-[var(--radius-media)] bg-ink p-7 text-paper sm:p-9"
              data-reveal
              style={{ ["--reveal-delay" as string]: "100ms" }}
            >
              <Icon name="calendar" className="h-6 w-6 text-accent" />
              <h2 className="display mt-4 text-[2rem] text-paper sm:text-[2.4rem]">
                {s.request.title}
              </h2>
              <p className="mt-3 leading-relaxed text-paper/80">
                {s.request.body}
              </p>
              <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-paper/70">
                <Icon
                  name="pin"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                />
                {dict.common.location}
              </p>
              <ButtonLink
                href={bookingHref(locale, id)}
                variant="gold"
                arrow
                className="mt-7 w-full sm:w-auto"
              >
                {s.requestThis}
              </ButtonLink>
            </div>
          </Container>
        </section>
      </>
    ),
    faq: !t.faqs.length ? null : (
      <>
        {/* FAQ */}
        <section className="section-tight bg-surface">
          <Container className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <h2 className="display text-[2rem] sm:text-[2.6rem]" data-reveal>
              {s.faq}
            </h2>
            <div data-reveal>
              <Faq items={t.faqs} />
            </div>
          </Container>
          <JsonLd data={faqJsonLd(t.faqs)} />
        </section>
      </>
    ),
    related: (
      <>
        {/* Related */}
        {related.length > 0 && (
          <section className="section">
            <Container>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <h2
                  className="display text-[2rem] sm:text-[2.6rem]"
                  data-reveal
                >
                  {s.related}
                </h2>
                <ButtonLink href={parent.href} variant="link" arrow>
                  {parent.label}
                </ButtonLink>
              </div>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r, i) => (
                  <li
                    key={r.id}
                    data-reveal
                    style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}
                  >
                    <TreatmentCard locale={locale} id={r.id} />
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        )}

        <JsonLd
          data={singleServiceJsonLd(
            locale,
            t.title,
            t.seoDescription,
            itemHref(locale, item),
          )}
        />
      </>
    ),
  };

  return <>{arrangeSections("treatment", sections)}</>;
}
