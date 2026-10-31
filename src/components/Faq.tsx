import { Icon } from "./ui/Icon";

export type FaqItem = { q: string; a: string };

/** Accessible accordion built on <details>; works without JavaScript. */
export function Faq({ items, tone = "light" }: { items: FaqItem[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div className={`divide-y border-y ${dark ? "divide-ivory/12 border-ivory/12" : "divide-charcoal/12 border-charcoal/12"}`}>
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-left">
            <span className={`font-serif text-xl leading-snug sm:text-[1.65rem] ${dark ? "text-ivory" : "text-charcoal"}`}>{item.q}</span>
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 group-open:rotate-45 ${
                dark ? "border-ivory/25 text-gold group-open:bg-ivory group-open:text-charcoal" : "border-charcoal/20 text-gold-deep group-open:bg-charcoal group-open:text-ivory"
              }`}
            >
              <Icon name="plus" className="h-4 w-4" />
            </span>
          </summary>
          <p className={`max-w-3xl pb-7 pr-14 leading-relaxed ${dark ? "text-ivory/75" : "text-charcoal-soft"}`}>{item.a}</p>
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
