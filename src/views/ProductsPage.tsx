import { Container } from "@/components/Container";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export type PublicProduct = { id: number; name: string; brand: string; variant: string; description: string | null; professionalOnly: boolean; mediaId: number | null };

/** Optional information page about the products used (no prices, no shop). */
export function ProductsPage({ locale, products }: { locale: Locale; products: PublicProduct[] }) {
  const t = getDictionary(locale).products;
  return (
    <section className="pt-header section">
      <Container>
        <p className="eyebrow">Glow by Dilek</p>
        <h1 className="display mt-4 text-[2.6rem] sm:text-6xl">{t.title}</h1>
        <p className="lead mt-6 max-w-2xl">{t.intro}</p>
        {products.length ? (
          <ul className="mt-block grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
                {p.mediaId && (
                  // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded product photo served by /media
                  <img src={`/media/${p.mediaId}/640`} alt="" className="mb-4 aspect-square w-full rounded-2xl object-cover" loading="lazy" />
                )}
                {p.brand && <p className="text-xs uppercase tracking-[0.16em] text-accent-deep">{p.brand}</p>}
                <h2 className="mt-1 font-serif text-2xl text-ink">{p.name}</h2>
                {p.variant && <p className="text-sm text-muted">{p.variant}</p>}
                {p.description && <p className="mt-3 leading-relaxed text-ink-soft">{p.description}</p>}
                {p.professionalOnly && <p className="mt-3 text-xs text-muted">{t.professional}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-muted">{t.empty}</p>
        )}
      </Container>
    </section>
  );
}
