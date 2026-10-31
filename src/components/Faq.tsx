import { Icon } from "./ui/Icon";

export type FaqItem = { q: string; a: string };

/** Accessible accordion built on <details>, works without JavaScript. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-espresso/10 border-y border-espresso/10">
      {items.map((item) => (
        <details key={item.q} className="group py-1">
          <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-left">
            <span className="font-serif text-xl leading-snug sm:text-2xl">{item.q}</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-espresso/15 text-champagne-deep transition-transform duration-500 group-open:rotate-45">
              <Icon name="plus" className="h-4 w-4" />
            </span>
          </summary>
          <p className="max-w-3xl pb-6 pr-12 leading-relaxed text-espresso-soft">{item.a}</p>
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
