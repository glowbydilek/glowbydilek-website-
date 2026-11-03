"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { alternatePath, localeLabels, locales, matchPage, type Locale } from "@/i18n/config";
import { bookingParam } from "@/content/slugs";

/** Re-read when Next.js swaps the head metadata after a client navigation. */
const subscribeHead = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.head, { childList: true, subtree: true, attributes: true });
  return () => mo.disconnect();
};

/** hreflang alternates from the page head (catalogue pages defined in the database), as "nl|/x;en|/y". */
function headAlternates(): string {
  return locales
    .map((l) => {
      const el = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${localeLabels[l].hrefLang}"]`);
      if (!el) return "";
      try {
        return `${l}|${new URL(el.href, window.location.href).pathname}`;
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join(";");
}

/**
 * Language menu (Nederlands · English · Türkçe). A button opens a small
 * animated list; every entry lands on the equivalent page in that language
 * (including catalogue pages) and keeps a preselected treatment on the
 * booking page. Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Escape
 * closes and returns focus. Motion is removed with prefers-reduced-motion.
 */
export function LanguageSwitcher({
  locale,
  label,
  onNavigate,
  className = "",
  tone = "light",
  placement = "down",
}: {
  locale: Locale;
  label: string;
  onNavigate?: () => void;
  className?: string;
  tone?: "light" | "dark";
  placement?: "down" | "up";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const known = matchPage(pathname) !== null;
  const fromHead = useSyncExternalStore(subscribeHead, () => (known ? "" : headAlternates()), () => "");
  const dark = tone === "dark";

  const targetFor = (l: Locale): string => {
    const hit = fromHead.split(";").find((x) => x.startsWith(`${l}|`));
    return hit ? hit.slice(3) : alternatePath(pathname, l);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const items = () => [...(wrap.current?.querySelectorAll<HTMLAnchorElement>("[data-lang-item]") ?? [])];
  const openAndFocus = (which: "first" | "current" | "last") => {
    setOpen(true);
    requestAnimationFrame(() => {
      const list = items();
      const el = which === "first" ? list[0] : which === "last" ? list[list.length - 1] : (list.find((a) => a.getAttribute("aria-current")) ?? list[0]);
      el?.focus();
    });
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAndFocus("current");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAndFocus("last");
    }
  };
  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "Escape") {
      e.preventDefault();
      // Only close this menu, not the mobile menu around it.
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      close(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list[list.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const go = (e: MouseEvent<HTMLAnchorElement>, target: string, l: Locale) => {
    setOpen(false);
    onNavigate?.();
    try {
      window.localStorage.setItem("glow-lang", l);
    } catch {
      /* private mode */
    }
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (!search) return;
    // Keep the preselected treatment when switching language on the booking page.
    const params = new URLSearchParams(search);
    const treatment = params.get("behandeling") ?? params.get("treatment") ?? params.get("bakim");
    if (!treatment) return;
    e.preventDefault();
    router.push(`${target}?${bookingParam[l]}=${encodeURIComponent(treatment)}`);
  };

  return (
    <div ref={wrap} className={`lang-menu relative ${className}`} data-open={open || undefined}>
      <button
        ref={button}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${localeLabels[locale].long}`}
        onClick={() => (open ? close(false) : openAndFocus("current"))}
        onKeyDown={onButtonKey}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-[0.78rem] font-medium tracking-[0.14em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
          dark ? "border-paper/25 text-paper hover:border-paper/60 focus-visible:outline-glow" : "border-ink/15 text-ink hover:border-ink/40 focus-visible:outline-accent-deep"
        }`}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 opacity-70">
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M1.9 8h12.2M8 1.75c1.9 1.7 2.8 3.8 2.8 6.25S9.9 12.55 8 14.25C6.1 12.55 5.2 10.45 5.2 8S6.1 3.45 8 1.75z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        {localeLabels[locale].short}
        <svg viewBox="0 0 12 12" aria-hidden="true" className="lang-chevron h-3 w-3">
          <path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        id={listId}
        role="list"
        aria-label={label}
        hidden={!open}
        onKeyDown={onListKey}
        className={`lang-panel absolute right-0 z-[60] min-w-[11.5rem] overflow-hidden rounded-2xl border p-1.5 shadow-[var(--shadow-soft)] ${
          placement === "up" ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
        } ${dark ? "border-paper/15 bg-[#3a2c39] text-paper" : "border-line bg-paper text-ink"}`}
      >
        {locales.map((l) => {
          const current = l === locale;
          const target = targetFor(l);
          return (
            <li key={l}>
              <Link
                data-lang-item
                href={target}
                hrefLang={localeLabels[l].hrefLang}
                lang={l}
                aria-current={current ? "true" : undefined}
                onClick={(e) => (current ? (e.preventDefault(), close(true)) : go(e, target, l))}
                className={`lang-item group flex min-h-11 items-center justify-between gap-4 rounded-xl px-3 text-[0.95rem] outline-none transition-colors duration-200 ${
                  dark ? "hover:bg-paper/10 focus-visible:bg-paper/10" : "hover:bg-sand focus-visible:bg-sand"
                } ${current ? "font-medium" : ""}`}
              >
                <span className="flex items-baseline gap-2">
                  {localeLabels[l].long}
                  <span className={`text-[0.7rem] tracking-[0.16em] ${dark ? "text-paper/60" : "text-muted"}`}>{localeLabels[l].short}</span>
                </span>
                {current && (
                  <svg viewBox="0 0 20 20" aria-hidden="true" className={`lang-glint h-3.5 w-3.5 ${dark ? "text-glow" : "text-accent"}`}>
                    <path d="M10 0c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" fill="currentColor" />
                  </svg>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
