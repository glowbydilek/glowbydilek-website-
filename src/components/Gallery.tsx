"use client";

import { useRef } from "react";
import type { PhotoId } from "@/content/media";
import type { Locale } from "@/i18n/config";
import { Icon } from "./ui/Icon";
import { Photo } from "./ui/Photo";

/** Editorial carousel: native scroll-snap (touch/trackpad friendly) + arrow buttons. */
export function Gallery({
  locale,
  items,
  labels,
}: {
  locale: Locale;
  items: { id: PhotoId; caption: string }[];
  labels: { prev: string; next: string; region: string };
}) {
  const track = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 20), behavior: "smooth" });
  };
  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={labels.region}>
      <ul
        ref={track}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            className={`group w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[30%] ${i % 2 === 1 ? "lg:mt-16" : ""}`}
          >
            <div className="zoom-frame overflow-hidden rounded-[1.5rem]">
              <Photo id={item.id} locale={locale} sizes="(min-width: 1024px) 30vw, 78vw" />
            </div>
            <p className="mt-4 flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-muted">
              <span className="font-serif text-lg normal-case italic tracking-normal text-gold-deep">0{i + 1}</span>
              {item.caption}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex gap-3">
        {([-1, 1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => scroll(dir)}
            aria-label={dir < 0 ? labels.prev : labels.next}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-forest/20 text-forest transition-colors duration-500 hover:bg-forest hover:text-ivory"
          >
            <Icon name="arrow" className={`h-4 w-4 ${dir < 0 ? "rotate-180" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
