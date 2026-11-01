import { Container } from "@/components/Container";
import type { Locale } from "@/i18n/config";
import { legalDoc } from "@/lib/legal";
import type { LegalKey } from "@/content/copy/legal.nl";

/** A legal page (cookie policy, terms, cancellation, review policy). */
export function LegalPage({ locale, k }: { locale: Locale; k: LegalKey }) {
  const d = legalDoc(locale, k);
  return (
    <section className="pt-header pb-[var(--space-section)]">
      <Container className="max-w-3xl">
        <p className="eyebrow">Glow by Dilek</p>
        <h1 className="display mt-4 text-[2.6rem] sm:text-6xl">{d.title}</h1>
        {d.effectiveDate && <p className="mt-4 text-sm text-muted">{locale === "nl" ? "Geldig vanaf" : "Effective from"} {d.effectiveDate}</p>}
        {d.intro && <p className="lead mt-8">{d.intro}</p>}
        <div className="mt-10 space-y-9">
          {d.sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-serif text-[1.75rem] text-ink sm:text-3xl">{s.title}</h2>
              {s.paragraphs.map((p) => (
                <p key={p} className="mt-3 text-lg leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
