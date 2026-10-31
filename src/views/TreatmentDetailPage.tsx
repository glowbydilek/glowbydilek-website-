import { Container } from "@/components/Container";
import { Faq, faqJsonLd } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { TreatmentCard } from "@/components/TreatmentCard";
import { ButtonLink } from "@/components/ui/Button";
import { CheckList } from "@/components/ui/CheckList";
import { Icon } from "@/components/ui/Icon";
import { categoryCopy, treatmentCopy } from "@/content/copy";
import { relatedTreatments, type TreatmentId } from "@/content/slugs";
import { findTreatmentById, formatPrice, pricesPublished } from "@/content/treatments";
import { bookingHref, categoryHref, href, treatmentHref, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { singleServiceJsonLd } from "@/lib/seo";

/** Treatment detail page, rendered from src/content/copy/treatments.*.ts. */
export function TreatmentDetailPage({ locale, id }: { locale: Locale; id: TreatmentId }) {
  const dict = getDictionary(locale);
  const s = dict.service;
  const { treatment, group } = findTreatmentById(id);
  const t = treatmentCopy(locale, id);
  const cat = categoryCopy(locale, group.id);
  const price = pricesPublished && treatment.price ? formatPrice(treatment.price.amount, locale) : s.priceOnRequest;
  const portrait = ["zone-face", "hero", "aftercare", "contact"].includes(treatment.photo);

  return (
    <>
      <PageHero
        locale={locale}
        photo={treatment.photo}
        ratio={portrait ? 4 / 5 : 5 / 4}
        eyebrow={cat.label}
        title={t.title}
        subtitle={t.lead}
        crumbs={[
          { name: dict.nav.treatments, href: href(locale, "treatments") },
          { name: cat.label, href: categoryHref(locale, group.id) },
          { name: treatment.name[locale] },
        ]}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={bookingHref(locale, id)} arrow>
            {s.requestThis}
          </ButtonLink>
          <ButtonLink href={href(locale, "process")} variant="outline">
            {s.readProcess}
          </ButtonLink>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-stone pt-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[0.66rem] uppercase tracking-[0.16em] text-muted">{dict.nav.categories}</dt>
            <dd className="mt-1 text-charcoal">{cat.label}</dd>
          </div>
          <div>
            <dt className="text-[0.66rem] uppercase tracking-[0.16em] text-muted">{s.price}</dt>
            <dd className="mt-1 text-charcoal">{price}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="sr-only">{dict.contact.hoursTitle}</dt>
            <dd className="flex items-center gap-2 text-charcoal">
              <Icon name="clock" className="h-4 w-4 text-gold-deep" />
              {dict.common.byAppointment}
            </dd>
          </div>
        </dl>
      </PageHero>

      {/* Area + how the appointment goes */}
      <section className="section-tight border-t border-stone/70">
        <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div data-reveal>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">{s.area}</h2>
            <p className="lead mt-5">{t.area}</p>
          </div>
          <div data-reveal style={{ ["--reveal-delay" as string]: "100ms" }}>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">{s.appointment}</h2>
            {t.appointment.map((p) => (
              <p key={p} className="mt-5 leading-relaxed text-charcoal-soft">
                {p}
              </p>
            ))}
          </div>
        </Container>
      </section>

      {/* Before, reactions, aftercare */}
      <section className="section bg-stone-light">
        <Container className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[var(--radius-card)] bg-ivory p-6 sm:p-8" data-reveal>
            <Icon name="info" className="h-6 w-6 text-gold-deep" />
            <h2 className="mt-4 font-serif text-[1.8rem] leading-tight text-charcoal">{s.know}</h2>
            <CheckList items={t.know} className="mt-5" />
          </article>
          <article className="rounded-[var(--radius-card)] border border-gold/50 bg-ivory p-6 sm:p-8" data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
            <Icon name="privacy" className="h-6 w-6 text-gold-deep" />
            <h2 className="mt-4 font-serif text-[1.8rem] leading-tight text-charcoal">{s.reactions}</h2>
            <CheckList items={t.reactions} icon="info" className="mt-5" />
          </article>
          <article className="rounded-[var(--radius-card)] bg-ivory p-6 sm:p-8" data-reveal style={{ ["--reveal-delay" as string]: "160ms" }}>
            <Icon name="leaf" className="h-6 w-6 text-gold-deep" />
            <h2 className="mt-4 font-serif text-[1.8rem] leading-tight text-charcoal">{s.aftercare}</h2>
            <CheckList items={t.aftercare} className="mt-5" />
            <ButtonLink href={href(locale, "aftercare")} variant="link" arrow className="mt-5">
              {s.readAftercare}
            </ButtonLink>
          </article>
        </Container>
      </section>

      {/* Recovery + request */}
      <section className="section">
        <Container className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div data-reveal>
            <h2 className="display text-[2rem] sm:text-[2.6rem]">{s.recovery}</h2>
            <p className="lead mt-5">{t.recovery}</p>
            <p className="mt-6 flex gap-3 rounded-2xl bg-nude-light p-5 text-sm leading-relaxed text-charcoal-soft">
              <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
              {s.medical}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              <ButtonLink href={href(locale, "preparation")} variant="link" arrow>
                {s.readPreparation}
              </ButtonLink>
              <ButtonLink href={href(locale, "faq")} variant="link" arrow>
                {dict.cta.allFaqs}
              </ButtonLink>
            </div>
          </div>
          <aside className="on-dark rounded-[var(--radius-media)] bg-charcoal p-7 text-ivory sm:p-9" data-reveal style={{ ["--reveal-delay" as string]: "100ms" }}>
            <Icon name="calendar" className="h-6 w-6 text-gold" />
            <h2 className="display mt-4 text-[2rem] text-ivory sm:text-[2.4rem]">{s.request.title}</h2>
            <p className="mt-3 leading-relaxed text-ivory/80">{s.request.body}</p>
            <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-ivory/70">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {dict.common.location}
            </p>
            <ButtonLink href={bookingHref(locale, id)} variant="gold" arrow className="mt-7 w-full sm:w-auto">
              {s.requestThis}
            </ButtonLink>
          </aside>
        </Container>
      </section>

      {/* FAQ */}
      <section className="section-tight bg-ivory-50">
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

      {/* Related */}
      <section className="section">
        <Container>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="display text-[2rem] sm:text-[2.6rem]" data-reveal>
              {s.related}
            </h2>
            <ButtonLink href={categoryHref(locale, group.id)} variant="link" arrow>
              {cat.label}
            </ButtonLink>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTreatments[id].map((r, i) => (
              <li key={r} data-reveal style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}>
                <TreatmentCard locale={locale} id={r} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <JsonLd data={singleServiceJsonLd(locale, t.title, t.seoDescription, treatmentHref(locale, id))} />
    </>
  );
}
