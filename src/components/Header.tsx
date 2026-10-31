"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Logo } from "./brand/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navKeys: RouteKey[] = ["treatments", "prices", "about", "contact"];

/**
 * Floating glass header. Transparent over the hero, frosted once scrolled,
 * hides while scrolling down and returns when scrolling up.
 */
export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 320 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y < 320) setHidden(false);
      lastY.current = y;
    };
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
      className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-700 ease-[var(--ease-luxe)] sm:px-5 lg:pt-4 ${
        hidden && !open ? "-translate-y-[130%]" : "translate-y-0"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-charcoal focus:px-5 focus:py-2 focus:text-ivory"
      >
        {dict.nav.skipToContent}
      </a>
      <div
        className={`mx-auto flex h-16 max-w-[88rem] items-center justify-between rounded-full px-5 transition-all duration-700 ease-[var(--ease-luxe)] sm:px-7 lg:h-[4.5rem] ${
          scrolled || open ? "glass" : "glass !shadow-none !bg-ivory-50/70"
        }`}
      >
        <Link href={href(locale, "home")} onClick={close} aria-label={`Glow by Dilek — ${dict.nav.home}`} className="shrink-0">
          <Logo withTagline={false} className="h-9 w-auto lg:h-10" />
        </Link>

        <nav aria-label={dict.nav.main} className="hidden items-center gap-1 lg:flex">
          {navKeys.map((key) => (
            <Link
              key={key}
              href={href(locale, key)}
              aria-current={isActive(key) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                isActive(key) ? "bg-nude-light text-charcoal" : "text-charcoal-soft hover:bg-charcoal/5 hover:text-charcoal"
              }`}
            >
              {dict.nav[key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <Link
            href={href(locale, "booking")}
            className="rounded-full bg-charcoal px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ivory transition-colors duration-500 hover:bg-charcoal-soft"
          >
            {dict.nav.booking}
          </Link>
        </div>

        <button
          type="button"
          className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`absolute h-px w-6 bg-charcoal transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
          <span className={`absolute h-px w-6 bg-charcoal transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
        </button>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="glass mx-auto mt-2 max-h-[calc(100dvh-6rem)] max-w-[88rem] overflow-y-auto rounded-[2rem] lg:hidden"
      >
        <nav aria-label={dict.nav.main} className="flex flex-col px-6 pb-8 pt-4">
          {(["home", ...navKeys] as RouteKey[]).map((key, i) => (
            <Link
              key={key}
              href={href(locale, key)}
              onClick={close}
              aria-current={isActive(key) ? "page" : undefined}
              className={`flex items-baseline gap-4 border-b border-charcoal/10 py-4 font-serif text-[1.9rem] leading-tight transition-colors ${
                isActive(key) ? "text-gold-deep" : "text-charcoal"
              }`}
            >
              <span className="font-sans text-xs tracking-[0.2em] text-muted">0{i + 1}</span>
              {dict.nav[key]}
            </Link>
          ))}
          <Link
            href={href(locale, "booking")}
            onClick={close}
            className="mt-8 rounded-full bg-charcoal px-7 py-4 text-center text-[0.74rem] font-medium uppercase tracking-[0.2em] text-ivory"
          >
            {dict.nav.booking}
          </Link>
          <LanguageSwitcher locale={locale} label={dict.nav.language} onNavigate={close} className="mt-6 justify-center" />
        </nav>
      </div>
    </header>
  );
}
