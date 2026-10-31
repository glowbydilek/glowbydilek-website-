"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { alternatePath, localeLabels, locales, type Locale } from "@/i18n/config";

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
    router.push(`${target}?${key}=${encodeURIComponent(treatment)}${window.location.hash}`);
  };

  return (
    <nav aria-label={label} className={`flex items-center gap-1 text-[0.72rem] font-medium tracking-[0.2em] ${className}`}>
      {locales.map((l, i) => {
        const target = alternatePath(pathname, l);
        return (
          <span key={l} className="flex items-center gap-1">
            {i > 0 && (
              <span className={dark ? "text-ivory/30" : "text-charcoal/25"} aria-hidden="true">
                /
              </span>
            )}
            {l === locale ? (
              <span aria-current="true" className={`px-1.5 py-2 ${dark ? "text-ivory" : "text-charcoal"}`}>
                {localeLabels[l].short}
              </span>
            ) : (
              <Link
                href={target}
                hrefLang={localeLabels[l].hrefLang}
                lang={l}
                onClick={(e) => go(e, target)}
                className={`px-1.5 py-2 transition-colors ${dark ? "text-ivory/60 hover:text-gold-light" : "text-muted hover:text-gold-deep"}`}
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
