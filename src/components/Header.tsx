"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

const navKeys: RouteKey[] = ["treatments", "prices", "about", "contact"];

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const isActive = (key: RouteKey) => pathname === href(locale, key);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-champagne/20 bg-ivory/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-charcoal focus:px-5 focus:py-2 focus:text-ivory"
      >
        {dict.nav.skipToContent}
      </a>
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo locale={locale} onNavigate={close} />

        <nav aria-label={dict.nav.main} className="hidden items-center gap-8 lg:flex">
          {navKeys.map((key) => (
            <Link
              key={key}
              href={href(locale, key)}
              aria-current={isActive(key) ? "page" : undefined}
              className={`relative text-[0.78rem] font-medium uppercase tracking-[0.18em] transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-champagne after:transition-all after:duration-300 hover:text-champagne-deep ${
                isActive(key) ? "text-champagne-deep after:w-full" : "text-charcoal after:w-0 hover:after:w-full"
              }`}
            >
              {dict.nav[key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <Link
            href={href(locale, "booking")}
            className="rounded-full border border-charcoal px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-charcoal transition-colors hover:border-champagne-deep hover:bg-champagne-deep hover:text-ivory"
          >
            {dict.nav.booking}
          </Link>
        </div>

        <button
          type="button"
          className="relative -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`absolute h-px w-6 bg-charcoal transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`}
          />
          <span className={`absolute h-px w-6 bg-charcoal transition-opacity duration-300 ${open ? "opacity-0" : ""}`} />
          <span
            className={`absolute h-px w-6 bg-charcoal transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`}
          />
        </button>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="h-[calc(100dvh-5rem)] overflow-y-auto border-t border-champagne/20 bg-ivory lg:hidden"
      >
        <nav aria-label={dict.nav.main} className="mx-auto flex max-w-6xl flex-col px-5 py-8 sm:px-8">
          {(["home", ...navKeys] as RouteKey[]).map((key) => (
            <Link
              key={key}
              href={href(locale, key)}
              onClick={close}
              aria-current={isActive(key) ? "page" : undefined}
              className={`border-b border-champagne/15 py-4 font-serif text-3xl transition-colors hover:text-champagne-deep ${
                isActive(key) ? "text-champagne-deep" : "text-charcoal"
              }`}
            >
              {dict.nav[key]}
            </Link>
          ))}
          <Link
            href={href(locale, "booking")}
            onClick={close}
            className="mt-10 rounded-full bg-charcoal px-7 py-4 text-center text-[0.78rem] font-medium uppercase tracking-[0.2em] text-ivory"
          >
            {dict.nav.booking}
          </Link>
          <LanguageSwitcher locale={locale} label={dict.nav.language} onNavigate={close} className="mt-8 justify-center" />
        </nav>
      </div>
    </header>
  );
}
