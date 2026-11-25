"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Tiny motion engine (no dependencies):
 *  - [data-reveal]      fades/rises in when scrolled into view
 *  - [data-reveal=mask] unmasks an image with an expanding clip-path
 *  - [data-parallax=N]  moves an element at N × scroll offset (subtle)
 *  - cards, list rows and section headings in <main> reveal automatically,
 *    siblings one after another (stagger), so every page moves the same way
 *  - a thin progress line at the top follows the scroll
 * Disabled entirely for prefers-reduced-motion. Content is visible without JS.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Auto-reveal: cards, rows and section headings that were not marked by hand.
    const auto = "main section:not(:first-child) h2, main article, main li > a[data-treatment-row], main ul > li";
    document.querySelectorAll<HTMLElement>(auto).forEach((el) => {
      if (el.closest("[data-reveal], header, nav, footer, form, details, [data-no-reveal]")) return;
      el.setAttribute("data-reveal", "");
    });
    // Stagger siblings: each next card in a row starts a little later.
    document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-visible])").forEach((el) => {
      if (el.style.getPropertyValue("--reveal-delay")) return;
      const parent = el.parentElement;
      if (!parent) return;
      const sibs = Array.from(parent.children).filter((c) => c.hasAttribute("data-reveal"));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty("--reveal-delay", `${Math.min(i, 5) * 80}ms`);
    });

    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-visible])"));
    let io: IntersectionObserver | null = null;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.setAttribute("data-visible", ""));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.setAttribute("data-visible", "");
              io?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      items.forEach((el) => io!.observe(el));
    }

    // Scroll progress line.
    let bar = document.querySelector<HTMLElement>(".scroll-progress");
    if (!reduce && !bar) {
      bar = document.createElement("div");
      bar.className = "scroll-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
    }
    let barFrame = 0;
    const paintBar = () => {
      barFrame = 0;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0})`;
    };
    const onBar = () => {
      if (!barFrame) barFrame = requestAnimationFrame(paintBar);
    };
    if (!reduce) {
      paintBar();
      window.addEventListener("scroll", onBar, { passive: true });
      window.addEventListener("resize", onBar);
    }

    const layers = reduce ? [] : Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of layers) {
        const rect = el.parentElement!.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) continue;
        const speed = Number(el.dataset.parallax) || 0.08;
        // Clamp the travel so the scaled image never reveals its edges.
        const offset = Math.max(-28, Math.min(28, (rect.top + rect.height / 2 - vh / 2) * -speed));
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.06)`;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    if (layers.length) {
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onBar);
      window.removeEventListener("resize", onBar);
      if (barFrame) cancelAnimationFrame(barFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
