"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Glow signature page transition.
 *
 * On a click on an internal link, a soft amber light blooms from the click
 * point with a small glint; when the new page is in place the light fades
 * and the content settles in. It never delays navigation (Next.js routes
 * as usual underneath), ignores new tabs, downloads, hash links and
 * modifier clicks, and is disabled for prefers-reduced-motion. Browser
 * back/forward keep their native, instant behaviour.
 */
export function GlowTransition() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "in" | "out">("idle");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onClick = (e: MouseEvent) => {
      if (reduced.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page (incl. hash links)
      if (/^\/(admin|ajanda|api|media)(\/|$)/.test(url.pathname) || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      clearTimers();
      pending.current = url.pathname;
      setPos({ x: e.clientX, y: e.clientY });
      setState("in");
      // Safety net: never leave the veil on screen.
      timers.current.push(window.setTimeout(() => setState("idle"), 2500));
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
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
      }, 600),
    );
  }, [pathname]);

  if (state === "idle") return null;
  const style = { "--gx": `${pos.x}px`, "--gy": `${pos.y}px` } as React.CSSProperties;
  return (
    <>
      <div className="glow-veil" data-state={state} style={style} aria-hidden="true" />
      {state === "in" && (
        <svg className="glow-spark" data-state="in" style={{ left: pos.x, top: pos.y }} viewBox="0 0 10 14" aria-hidden="true">
          <path d="M5 0Q5.8 5.1 10 7Q5.8 8.9 5 14Q4.2 8.9 0 7Q4.2 5.1 5 0Z" fill="currentColor" />
        </svg>
      )}
    </>
  );
}
