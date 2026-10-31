"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, matchRoute, routes, type Locale } from "@/i18n/config";

export function LanguageSwitcher({
  locale,
  label,
  onNavigate,
  className = "",
}: {
  locale: Locale;
  label: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const match = matchRoute(pathname);
  const key = match?.key ?? "home";

  return (
    <nav aria-label={label} className={`flex items-center gap-1 text-[0.72rem] font-medium tracking-[0.2em] ${className}`}>
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-forest/25" aria-hidden="true">/</span>}
          {l === locale ? (
            <span aria-current="true" className="px-1 text-forest">
              {localeLabels[l].short}
            </span>
          ) : (
            <Link
              href={routes[key][l]}
              hrefLang={localeLabels[l].hrefLang}
              lang={l}
              onClick={onNavigate}
              className="px-1 text-muted transition-colors hover:text-gold-deep"
              title={localeLabels[l].long}
            >
              {localeLabels[l].short}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
