"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

/** Accessible tabs (WAI-ARIA pattern) for preparation and aftercare. */
export function CareTabs({ care }: { care: Dictionary["care"] }) {
  const tabs = [care.before, care.after];
  const [active, setActive] = useState(0);
  const id = useId();

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" className="inline-flex rounded-full bg-charcoal/6 p-1.5">
        {tabs.map((t, i) => (
          <button
            key={t.title}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKey}
            className={`rounded-full px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-all duration-500 sm:px-6 ${
              active === i ? "bg-charcoal text-ivory shadow-soft" : "text-charcoal hover:bg-charcoal/8"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.title}
          id={`${id}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${i}`}
          hidden={active !== i}
          className="mt-8"
        >
          <p className="lead">{t.lead}</p>
          <ol className="mt-6 space-y-4">
            {t.items.map((item, n) => (
              <li key={item} className="flex gap-4 border-b border-charcoal/10 pb-4 leading-relaxed text-charcoal-soft last:border-0">
                <span className="font-serif text-xl italic text-gold-deep">{String(n + 1).padStart(2, "0")}</span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
