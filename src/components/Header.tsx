"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { href, type Locale, type RouteKey } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Logo } from "./brand/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Icon } from "./ui/Icon";

const navKeys: RouteKey[] = ["treatments", "prices", "about", "contact"];

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
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
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-espresso focus:px-5 focus:py-2 focus:text-ivory"
      >
        {dict.nav.skipToContent}
      </a>

      <div className="bg-espresso text-ivory/85">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-5 py-2.5 text-center text-[0.7rem] tracking-[0.12em] sm:px-8 lg:px-12">
          <Icon name="sparkle" className="hidden h-3.5 w-3.5 text-champagne sm:block" />
          <span className="hidden sm:inline">{dict.announcement.text}</span>
          <Link
            href={href(locale, "booking")}
            className="font-medium uppercase tracking-[0.2em] text-champagne-light underline-offset-4 hover:underline sm:ml-2"
          >
            {dict.announcement.link} →
          </Link>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled || open
            ? "border-b border-espresso/8 bg-ivory/92 shadow-[0_10px_30px_-25px_rgb(48_39_37/0.5)] backdrop-blur-md"
            : "bg-ivory-100"
        }`}
      >
        <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12">
          <Link href={href(locale, "home")} onClick={close} aria-label={`Glow by Dilek — ${dict.nav.home}`}>
            <Logo className="h-10 w-auto lg:h-11" />
          </Link>

          <nav aria-label={dict.nav.main} className="hidden items-center gap-9 lg:flex">
            {navKeys.map((key) => (
              <Link
                key={key}
                href={href(locale, key)}
                aria-current={isActive(key) ? "page" : undefined}
                className={`relative py-2 text-[0.74rem] font-medium uppercase tracking-[0.18em] transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:bg-champagne-deep after:transition-all after:duration-500 hover:text-champagne-deep ${
                  isActive(key) ? "text-champagne-deep after:w-full" : "text-espresso after:w-0 hover:after:w-full"
                }`}
              >
                {dict.nav[key]}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-7 lg:flex">
            <LanguageSwitcher locale={locale} label={dict.nav.language} />
            <Link
              href={href(locale, "booking")}
              className="rounded-full bg-espresso px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ivory transition-colors duration-500 hover:bg-champagne-deep"
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
            <span className={`absolute h-px w-6 bg-espresso transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-[5px]"}`} />
            <span className={`absolute h-px w-6 bg-espresso transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-[5px]"}`} />
          </button>
        </div>

        <div
          id="mobile-menu"
          hidden={!open}
          className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-espresso/8 bg-ivory lg:hidden"
        >
          <nav aria-label={dict.nav.main} className="flex min-h-full flex-col px-5 pb-10 pt-6 sm:px-8">
            {(["home", ...navKeys] as RouteKey[]).map((key, i) => (
              <Link
                key={key}
                href={href(locale, key)}
                onClick={close}
                aria-current={isActive(key) ? "page" : undefined}
                className={`flex items-baseline gap-4 border-b border-espresso/8 py-4 font-serif text-[2rem] leading-tight transition-colors hover:text-champagne-deep ${
                  isActive(key) ? "text-champagne-deep" : "text-espresso"
                }`}
              >
                <span className="font-sans text-xs tracking-[0.2em] text-espresso-muted">0{i + 1}</span>
                {dict.nav[key]}
              </Link>
            ))}
            <Link
              href={href(locale, "booking")}
              onClick={close}
              className="mt-10 rounded-full bg-espresso px-7 py-4 text-center text-[0.74rem] font-medium uppercase tracking-[0.2em] text-ivory"
            >
              {dict.nav.booking}
            </Link>
            <LanguageSwitcher
              locale={locale}
              label={dict.nav.language}
              onNavigate={close}
              className="mt-8 justify-center"
            />
          </nav>
        </div>
      </header>
    </>
  );
}
