import { Container } from "@/components/Container";
import { CtaBanner } from "@/components/CtaBanner";
import { PageHero } from "@/components/PageHero";
import { treatmentCategories } from "@/content/treatments";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function TreatmentsPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.treatments;

  return (
    <>
      <PageHero {...t.hero} />

      <nav aria-label={t.hero.eyebrow} className="border-b border-champagne/20 bg-ivory">
        <Container className="flex flex-wrap justify-center gap-3 py-6">
          {treatmentCategories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="rounded-full border border-champagne/40 px-5 py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-champagne-deep hover:text-champagne-deep"
            >
              {cat.name[locale]}
            </a>
          ))}
        </Container>
      </nav>

      {treatmentCategories.map((cat, idx) => (
        <section
          key={cat.id}
          id={cat.id}
          aria-labelledby={`${cat.id}-title`}
          className={`scroll-mt-24 py-20 sm:py-24 ${idx % 2 === 1 ? "bg-ivory-100" : ""}`}
        >
          <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">{String(idx + 1).padStart(2, "0")}</p>
              <h2 id={`${cat.id}-title`} className="mt-4 text-4xl sm:text-5xl">
                {cat.name[locale]}
              </h2>
              <span className="gold-rule mt-6" />
              <p className="mt-6 max-w-sm leading-relaxed text-charcoal-soft">{cat.intro[locale]}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {cat.treatments.map((tr) => (
                <li key={tr.id} className="rounded-[1.25rem] border border-champagne/25 bg-ivory p-6">
                  <h3 className="text-2xl">{tr.name[locale]}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{tr.description[locale]}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-charcoal-muted">
                    {t.approx} {tr.durationMinutes} {t.minutes}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ))}

      <section className="border-t border-champagne/20 py-20 sm:py-24">
        <Container className="grid gap-8 md:grid-cols-2">
          {[t.before, t.after].map((block) => (
            <div key={block.title} className="rounded-[1.75rem] bg-nude-light p-8 sm:p-10">
              <h2 className="text-3xl">{block.title}</h2>
              <span className="gold-rule mt-5" />
              <ul className="mt-6 space-y-4">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-charcoal-soft">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne-deep" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Container>
      </section>

      <CtaBanner locale={locale} dict={dict} />
    </>
  );
}
