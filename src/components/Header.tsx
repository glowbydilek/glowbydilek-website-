"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Glint, LogoInline } from "./brand/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { NavModel } from "./navModel";
import { Icon } from "./ui/Icon";

/**
 * Sticky header that is part of the document flow (it never overlaps page
 * content). Desktop: a treatments mega menu. Mobile: a full-height menu
 * below the bar with scroll lock, focus trap and Escape to close.
 */
export function Header({
  locale,
  dict,
  nav,
}: {
  locale: Locale;
  dict: Dictionary;
  nav: NavModel;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Scroll lock + Escape + focus trap for the mobile menu.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !headerRef.current) return;
      const items = [
        ...headerRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ),
      ].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close the mega menu with Escape or a click outside.
  useEffect(() => {
    if (!mega) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMega(false);
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node))
        setMega(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [mega]);

  const close = () => {
    setOpen(false);
    setMega(false);
  };
  const treatmentsBase = href(locale, "treatments");
  const isActive = (target: string) =>
    target === treatmentsBase
      ? pathname === target || pathname.startsWith(`${target}/`)
      : pathname === target;
  const navLinkCls = (active: boolean) =>
    `relative inline-flex min-h-11 items-center gap-1.5 px-3 text-[0.95rem] transition-colors duration-300 ${
      active ? "text-ink" : "text-ink-soft hover:text-ink"
    }`;
  const activeMark = (active: boolean) =>
    active ? <Glint className="absolute -top-0.5 left-1/2 h-2.5 w-auto -translate-x-1/2 text-accent" /> : null;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-line/80 pt-[env(safe-area-inset-top)]"
    >
      {/* Frosted background on its own layer: a backdrop-filter on the header
          itself would trap the fixed mobile menu inside the header box. */}
      <div
        aria-hidden="true"
        data-header-bg
        className="absolute inset-0 -z-10 bg-paper/90 backdrop-blur-xl"
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2 focus:text-paper"
      >
        {dict.nav.skipToContent}
      </a>

      <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-4 px-4 sm:px-8 lg:h-[4.75rem] lg:px-12">
        <Link
          href={href(locale, "home")}
          onClick={close}
          aria-label={`Glow by Dilek — ${dict.nav.home}`}
          className="shrink-0"
          data-logo
        >
          <LogoInline className="h-8 w-auto sm:h-9 lg:h-10" />
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label={dict.nav.main}
          className="hidden items-center gap-1 lg:flex"
        >
          <div className="relative">
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega-menu"
              onClick={() => setMega((v) => !v)}
              className={navLinkCls(isActive(treatmentsBase))}
            >
              {activeMark(isActive(treatmentsBase))}
              {dict.nav.treatments}
              <Icon
                name="chevron"
                className={`h-3 w-3 transition-transform duration-300 ${mega ? "-rotate-90" : "rotate-90"}`}
              />
            </button>
          </div>
          {nav.primary
            .filter((l) => l.key !== "treatments")
            .map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={close}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={navLinkCls(isActive(l.href))}
              >
                {activeMark(isActive(l.href))}
                {l.label}
              </Link>
            ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher
            locale={locale}
            label={dict.nav.language}
            onNavigate={close}
          />
          <Link
            href={href(locale, "booking")}
            onClick={close}
            className="btn btn-primary min-h-11 px-5 py-2.5 text-[0.875rem]"
          >
            {dict.nav.booking}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href={href(locale, "booking")}
            onClick={close}
            className="btn btn-primary hidden min-h-10 px-4 py-2 text-[0.8125rem] min-[400px]:inline-flex"
          >
            {dict.cta.request}
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-full"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={`absolute h-px w-6 bg-ink transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-[4px]"}`}
            />
            <span
              className={`absolute h-px w-6 bg-ink transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-[4px]"}`}
            />
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      {mega && (
        <div
          id="mega-menu"
          className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[var(--shadow-soft)] lg:block"
        >
          <div className="mx-auto grid max-w-[88rem] grid-cols-[repeat(3,1fr)_0.9fr] gap-10 px-12 py-10">
            {nav.categories.map((c) => (
              <div key={c.href}>
                <Link
                  href={c.href}
                  onClick={close}
                  className="group inline-flex items-center gap-2 font-serif text-[1.65rem] leading-tight text-ink hover:text-accent"
                >
                  {c.label}
                  <Icon
                    name="arrow"
                    className="h-4 w-4 text-accent-deep transition-transform duration-500 group-hover:translate-x-1"
                  />
                </Link>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {c.teaser}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {c.treatments.map((t) => (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        onClick={close}
                        aria-current={pathname === t.href ? "page" : undefined}
                        className="link-underline text-ink-soft hover:text-ink"
                      >
                        {t.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="border-l border-line pl-8">
              <p className="eyebrow">{dict.nav.info}</p>
              <ul className="mt-4 space-y-2">
                {nav.info.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={close}
                      className="link-underline text-ink-soft hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={treatmentsBase}
                onClick={close}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-deep hover:text-ink"
              >
                {dict.nav.allTreatments}
                <Icon name="arrow" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={dict.nav.menu}
          className="fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top)+1px)] overflow-y-auto overscroll-contain bg-paper lg:hidden"
        >
          <nav
            aria-label={dict.nav.main}
            className="mx-auto flex min-h-full max-w-xl flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 sm:px-8"
          >
            <ul>
              {[
                {
                  key: "home",
                  label: dict.nav.home,
                  href: href(locale, "home"),
                },
                ...nav.primary,
              ].map((l) => (
                <li key={l.href} className="border-b border-line">
                  <Link
                    href={l.href}
                    onClick={close}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className={`flex items-center justify-between py-3.5 font-serif text-[1.85rem] leading-tight ${pathname === l.href ? "text-accent" : "text-ink"}`}
                  >
                    {l.label}
                    {pathname === l.href ? <Glint className="h-4 w-auto text-accent" /> : <Icon name="arrow" className="h-4 w-4 text-muted" />}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="eyebrow mt-8">{dict.nav.categories}</p>
            <ul className="mt-3 grid gap-2">
              {nav.categories.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    onClick={close}
                    aria-current={pathname === c.href ? "page" : undefined}
                    className="block border-b border-line py-3"
                  >
                    <span className="block font-serif text-[1.4rem] leading-tight text-ink">
                      {c.label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">
                      {c.teaser}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="eyebrow mt-8">{dict.nav.info}</p>
            <ul className="mt-3 grid grid-cols-1 gap-x-4 min-[400px]:grid-cols-2">
              {nav.info.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    className="flex min-h-11 items-center text-ink-soft"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Link
                href={href(locale, "booking")}
                onClick={close}
                className="btn btn-primary w-full"
              >
                {dict.nav.booking}
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <div className="mt-5 flex items-center justify-between">
                <LanguageSwitcher
                  locale={locale}
                  label={dict.nav.language}
                  onNavigate={close}
                />
                <a
                  href="mailto:hello@glowbydilek.nl"
                  className="text-sm text-muted"
                >
                  hello@glowbydilek.nl
                </a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
