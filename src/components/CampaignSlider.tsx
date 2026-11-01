"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui/Icon";

export type Slide = { id: number; title: string; text: string; cta: string; href: string; image: string | null };

/**
 * Homepage campaign slider (owner-managed in Admin → Acties & kortingen).
 * Accessible carousel: labelled region, previous/next and pause controls,
 * keyboard operable, autoplay only without prefers-reduced-motion and paused
 * on hover or focus. Not rendered at all when there is no active slide.
 */
export function CampaignSlider({ slides, labels }: { slides: Slide[]; labels: { region: string; prev: string; next: string; pause: string; play: string; slide: string } }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const reduced = useRef(false);
  const n = slides.length;
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => {
    if (n < 2 || !playing || hold || reduced.current) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % n), 7000);
    return () => window.clearTimeout(t);
  }, [i, n, playing, hold]);
  if (!n) return null;
  const s = slides[Math.min(i, n - 1)];
  const go = (d: number) => setI((x) => (x + d + n) % n);
  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="campaign relative overflow-hidden bg-ink text-paper on-dark"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div
        key={s.id}
        role="group"
        aria-roledescription="slide"
        aria-label={labels.slide.replace("{n}", String(i + 1)).replace("{total}", String(n))}
        className="campaign-slide mx-auto grid max-w-[88rem] items-center gap-6 px-5 py-10 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:py-14 lg:px-12"
      >
        <div>
          <h2 className="display text-[2rem] text-paper sm:text-5xl">{s.title}</h2>
          {s.text && <p className="mt-4 max-w-xl leading-relaxed text-paper/80">{s.text}</p>}
          {s.cta && s.href && (
            <Link href={s.href} className="btn btn-accent mt-6">
              {s.cta}
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          )}
        </div>
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded media served by /media (pre-sized WebP)
          <img src={s.image} alt="" className="aspect-[4/3] w-full rounded-[var(--radius-media)] object-cover" loading="lazy" />
        )}
      </div>
      {n > 1 && (
        <div className="mx-auto flex max-w-[88rem] items-center gap-2 px-5 pb-6 sm:px-8 lg:px-12">
          <button type="button" onClick={() => go(-1)} aria-label={labels.prev} className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 hover:border-glow">
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label={labels.next} className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/30 hover:border-glow">
            <Icon name="arrow" className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setPlaying((v) => !v)} className="min-h-11 px-3 text-sm text-paper/75 underline-offset-4 hover:underline" aria-pressed={!playing}>
            {playing ? labels.pause : labels.play}
          </button>
          <span className="ml-auto text-sm tabular-nums text-paper/60" aria-live="polite">
            {i + 1} / {n}
          </span>
        </div>
      )}
    </section>
  );
}
