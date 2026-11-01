"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, type MouseEvent } from "react";
import { alternatePath, localeLabels, locales, matchPage, type Locale } from "@/i18n/config";

/** Re-read when Next.js swaps the head metadata after a client navigation. */
const subscribeHead = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.head, { childList: true, subtree: true, attributes: true });
  return () => mo.disconnect();
};

/** hreflang alternate from the page head (catalogue pages defined in the database). */
function headAlternate(target: Locale): string | null {
  const el = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${localeLabels[target].hrefLang}"]`);
  if (!el) return null;
  try {
    return new URL(el.href, window.location.href).pathname;
  } catch {
    return null;
  }
}

/**
 * NL / EN switch that always lands on the equivalent page (including
 * category and treatment pages). A preselected treatment on the booking page
 * is carried over to the other language.
 */
export function LanguageSwitcher({
  locale,
  label,
  onNavigate,
  className = "",
  tone = "light",
}: {
  locale: Locale;
  label: string;
  onNavigate?: () => void;
  className?: string;
  tone?: "light" | "dark";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const other = locales.find((l) => l !== locale)!;
  const known = matchPage(pathname) !== null;
  const fromHead = useSyncExternalStore(
    subscribeHead,
    () => (known ? null : headAlternate(other)),
    () => null,
  );
  const dark = tone === "dark";

  const go = (e: MouseEvent<HTMLAnchorElement>, target: string) => {
    onNavigate?.();
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (!search) return;
    // Keep the preselected treatment when switching language on the booking page.
    const params = new URLSearchParams(search);
    const treatment = params.get("behandeling") ?? params.get("treatment");
    if (!treatment) return;
    e.preventDefault();
    const key = target.startsWith("/en") ? "treatment" : "behandeling";
    router.push(`${target}?${key}=${encodeURIComponent(treatment)}`);
  };

  return (
    <nav aria-label={label} className={`flex items-center gap-1 text-[0.72rem] font-medium tracking-[0.2em] ${className}`}>
      {locales.map((l, i) => {
        const target = l === other && fromHead ? fromHead : alternatePath(pathname, l);
        return (
          <span key={l} className="flex items-center gap-1">
            {i > 0 && (
              <span className={dark ? "text-paper/30" : "text-ink/25"} aria-hidden="true">
                /
              </span>
            )}
            {l === locale ? (
              <span aria-current="true" className={`px-1.5 py-2 ${dark ? "text-paper" : "text-ink"}`}>
                {localeLabels[l].short}
              </span>
            ) : (
              <Link
                href={target}
                hrefLang={localeLabels[l].hrefLang}
                lang={l}
                onClick={(e) => go(e, target)}
                className={`px-1.5 py-2 transition-colors ${dark ? "text-paper/60 hover:text-glow" : "text-muted hover:text-accent-deep"}`}
                title={localeLabels[l].long}
              >
                {localeLabels[l].short}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
