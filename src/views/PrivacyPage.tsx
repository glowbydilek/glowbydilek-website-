import { Container } from "@/components/Container";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function PrivacyPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).privacy;
  return (
    <section className="pt-header pb-[var(--space-section)]">
      <Container className="max-w-3xl">
        <p className="eyebrow">Glow by Dilek</p>
        <h1 className="display mt-4 text-[2.6rem] sm:text-6xl">{t.title}</h1>
        <p className="mt-4 text-sm text-muted">{t.updated}</p>
        <div className="mt-10 space-y-8">
          {t.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-serif text-[1.75rem] text-charcoal sm:text-3xl">{s.h}</h2>
              <p className="mt-3 text-lg leading-relaxed text-charcoal-soft">{s.p}</p>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
