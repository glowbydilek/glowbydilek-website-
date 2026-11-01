export type FaqItem = { q: string; a: string };

/**
 * Accessible accordion built on <details>; works without JavaScript.
 * Each question carries a quiet serif index; the marker is a hairline cross
 * that folds into a single line when open (no circle-and-plus cliché). The
 * answer eases open where the browser supports animating <details>.
 */
export function Faq({ items, tone = "light" }: { items: FaqItem[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div className={`faq divide-y border-y ${dark ? "divide-paper/12 border-paper/12" : "divide-ink/12 border-ink/12"}`}>
      {items.map((item, i) => (
        <details key={item.q} className="group">
          <summary className="faq-summary flex cursor-pointer items-baseline gap-4 py-6 text-left sm:gap-6">
            <span className={`w-7 shrink-0 font-serif text-sm tabular-nums ${dark ? "text-glow/80" : "text-accent-deep"}`} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={`flex-1 font-serif text-xl leading-snug transition-colors duration-300 sm:text-[1.65rem] ${dark ? "text-paper group-hover:text-glow" : "text-ink group-hover:text-accent-deep"}`}>{item.q}</span>
            <span className={`faq-mark relative top-[-0.15em] h-5 w-5 shrink-0 self-center ${dark ? "text-glow" : "text-accent-deep"}`} aria-hidden="true">
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
              <span className="faq-mark-v absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-500 ease-[var(--ease-luxe)] group-open:scale-y-0" />
            </span>
          </summary>
          <div className="faq-answer">
            <p className={`max-w-3xl pb-7 pl-11 pr-8 leading-relaxed sm:pl-[3.25rem] ${dark ? "text-paper/75" : "text-ink-soft"}`}>{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}
