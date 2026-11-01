import Link from "next/link";
import { ClosingCta } from "@/components/ClosingCta";
import { Container } from "@/components/Container";
import { PageHero } from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { OfferBadge } from "@/components/OfferBadge";
import { Icon } from "@/components/ui/Icon";
import { mailto } from "@/content/site";
import { groupCopy } from "@/content/copy";
import { href, type Locale } from "@/i18n/config";
import { groupHref, itemDuration, itemHref, priceLabel, publicGroups, publicItems, publicSections, sectionHref, type Item } from "@/lib/catalogue";
import { getDictionary } from "@/i18n/dictionaries";

export function PricesPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.prices;
  // One price table per waxing zone, and one per other published section.
  const tables = publicSections().flatMap((sec) => {
    const zones = publicGroups(sec.id).map((g) => ({
      id: g.id,
      title: sec.id === "waxing" ? groupCopy(locale, g.id, g.name[locale]).label : `${sec.name[locale]} · ${g.name[locale]}`,
      href: groupHref(locale, g),
      items: publicItems({ sectionId: sec.id, groupId: g.id }),
    }));
    const loose = publicItems({ sectionId: sec.id, groupId: null });
    const link = sec.id === "waxing" ? href(locale, "treatments") : sectionHref(locale, sec);
    return loose.length ? [...zones, { id: sec.id, title: sec.name[locale], href: link, items: loose }] : zones;
  });
  const anyPrice = tables.some((tb) => tb.items.some((i) => i.pricing.mode !== "on_request"));
  const price = (i: Item) => (i.pricing.mode === "on_request" ? null : priceLabel(i, locale, { from: t.from, onRequest: dict.common.onRequest }));

  return (
    <>
      <PageHero locale={locale} photo="aftercare" {...t.hero}>
        <ButtonLink href={mailto(t.notice.subject)} arrow>
          {t.notice.cta}
        </ButtonLink>
      </PageHero>

      <section className="section-tight">
        <Container className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-start lg:gap-14 [&>*]:min-w-0">
          <div className="space-y-10">
            {tables.map((g) => (
              <div key={g.id} data-reveal>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink pb-4">
                  <h2 lang={locale} className="display min-w-0 text-[1.9rem] [hyphens:auto] [overflow-wrap:anywhere] min-[400px]:text-[2.2rem] sm:text-5xl">{g.title}</h2>
                  <Link
                    href={g.href}
                    className="link-underline shrink-0 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-accent-deep"
                  >
                    {dict.service.viewTreatment}
                    <span className="sr-only">: {g.title}</span>
                  </Link>
                </div>
                <table className="w-full text-left">
                  <caption className="sr-only">{g.title}</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">{t.columns.treatment}</th>
                      <th scope="col" className="hidden sm:table-cell">{t.columns.duration}</th>
                      <th scope="col">{t.columns.price}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((tr) => {
                      const d = itemDuration(tr);
                      const p = price(tr);
                      return (
                        <tr key={tr.id} className="border-b border-ink/10">
                          <th scope="row" className="py-5 pr-4 align-top font-normal [overflow-wrap:anywhere]">
                            <Link href={itemHref(locale, tr)} className="block font-serif text-2xl text-ink underline-offset-4 hover:text-accent-deep hover:underline">
                              {tr.name[locale]}
                            </Link>
                            <span className="mt-1 block text-sm leading-relaxed text-muted">{tr.description[locale]}</span>
                            <OfferBadge item={tr} locale={locale} compact />
                            {d ? (
                              <span className="mt-1 block text-sm text-muted sm:hidden">
                                {d} {t.minutes}
                              </span>
                            ) : null}
                          </th>
                          <td className="hidden whitespace-nowrap py-5 pr-4 text-right align-top text-sm text-muted sm:table-cell">{d ? `${d} ${t.minutes}` : ""}</td>
                          <td className="whitespace-nowrap py-5 text-right align-top">
                            {p ? (
                              <span className="font-serif text-2xl text-ink">{p}</span>
                            ) : (
                              <span className="inline-block rounded-full bg-glow-soft px-3 py-1 text-xs uppercase tracking-[0.14em] text-ink-soft">{dict.common.onRequest}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="space-y-5 lg:sticky lg:top-[calc(var(--header-safe)+1.5rem)]">
            {!anyPrice && (
              <div className="on-dark rounded-[1.75rem] bg-ink p-7 text-paper sm:p-9" data-reveal>
                <Icon name="mail" className="h-6 w-6 text-accent" />
                <h2 className="mt-5 font-serif text-3xl text-paper">{t.notice.title}</h2>
                <p className="mt-4 leading-relaxed text-paper/75">{t.notice.body}</p>
                <ButtonLink href={mailto(t.notice.subject)} variant="gold" className="mt-8 w-full" arrow>
                  {t.notice.cta}
                </ButtonLink>
              </div>
            )}
            <ul className="space-y-3 rounded-[1.75rem] bg-glow-soft p-7" data-reveal>
              {t.notes.map((n) => (
                <li key={n} className="flex gap-3 leading-relaxed text-ink-soft">
                  <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-accent-deep" />
                  {n}
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
