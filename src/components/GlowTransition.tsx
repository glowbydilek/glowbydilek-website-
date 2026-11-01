"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Glow signature page transition: the diamond glint.
 *
 * On a click on an internal link a four-point diamond sparkle opens in the
 * centre of the screen — fine light rays, a soft amber bloom — and fades as
 * the new page settles in. It never delays navigation (Next.js routes as
 * usual underneath), ignores new tabs, downloads, hash links, modifier clicks
 * and the private areas, and is disabled for prefers-reduced-motion. Browser
 * back/forward keep their native, instant behaviour and scroll restoration.
 * A safety timer guarantees the overlay can never stay on screen.
 */
export function GlowTransition() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "in" | "out">("idle");
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPop = () => {
      // Back/forward: no animation, and never leave an overlay behind.
      pending.current = null;
      clearTimers();
      setState("idle");
      document.documentElement.classList.remove("glow-nav");
    };
    const onClick = (e: MouseEvent) => {
      if (reduced.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page (incl. hash links)
      if (/^\/(admin|agenda|ajanda|login|api|media)(\/|$)/.test(url.pathname) || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      clearTimers();
      pending.current = url.pathname;
      setState("in");
      // Safety net: never leave the veil on screen.
      timers.current.push(window.setTimeout(() => setState("idle"), 2000));
    };
    // Capture phase: Next.js <Link> calls preventDefault() in its own handler.
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!pending.current) return;
    pending.current = null;
    clearTimers();
    const html = document.documentElement;
    html.classList.add("glow-nav");
    setState("out");
    timers.current.push(
      window.setTimeout(() => {
        setState("idle");
        html.classList.remove("glow-nav");
      }, 520),
    );
  }, [pathname]);

  if (state === "idle") return null;
  return (
    <div className="glow-veil" data-state={state} aria-hidden="true">
      <svg className="glow-diamond" viewBox="-100 -100 200 200">
        <defs>
          <radialGradient id="glow-bloom">
            <stop offset="0" stopColor="#eee3f2" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#f0d3b4" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f0d3b4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="glow-ray" x1="0" x2="1">
            <stop offset="0" stopColor="#c69b73" stopOpacity="0.7" />
            <stop offset="1" stopColor="#c69b73" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle className="glow-bloom" r="90" fill="url(#glow-bloom)" />
        <g className="glow-rays">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect key={a} x="8" y={a % 90 ? -0.35 : -0.6} width={a % 90 ? 46 : 78} height={a % 90 ? 0.7 : 1.2} fill="url(#glow-ray)" transform={`rotate(${a})`} />
          ))}
        </g>
        <path className="glow-star" d="M0-46C2.6-14 6.5-5 30 0 6.5 5 2.6 14 0 46-2.6 14-6.5 5-30 0-6.5-5-2.6-14 0-46Z" />
        <path className="glow-star-inner" d="M0-12C.8-3 2-1.6 9 0 2 1.6.8 3 0 12-.8 3-2 1.6-9 0-2-1.6-.8-3 0-12Z" />
      </svg>
    </div>
  );
}
