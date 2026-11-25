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
import { ProtectedEmail } from "./ProtectedEmail";

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
  // Mobile menu: "Behandelingen" opens as a short list of categories (never
  // the whole catalogue). It starts open when the current page is a treatment page.
  const [treatOpen, setTreatOpen] = useState(false);
  const toggleMenu = () => {
    if (!open) {
      const inCatalogue = pathname === nav.allHref || nav.categories.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`) || c.treatments.some((t) => t.href === pathname));
      setTreatOpen(inCatalogue);
    }
    setOpen((v) => !v);
  };
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
  const catalogueRoots = [treatmentsBase, nav.allHref, ...nav.categories.map((c) => c.href)];
  const isActive = (target: string) =>
    target === treatmentsBase
      ? catalogueRoots.some((r) => pathname === r || pathname.startsWith(`${r}/`))
      : pathname === target;
  const navLinkCls = (active: boolean) =>
    `nav-link star-glint star-glint-text relative inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap px-2.5 text-[0.875rem] xl:px-3 xl:text-[0.95rem] transition-colors duration-300 ${
      active ? "text-ink" : "text-ink-soft hover:text-ink"
    }`;
  const activeMark = (active: boolean) =>
    active ? <Glint className="absolute -top-0.5 left-1/2 h-2.5 w-auto -translate-x-1/2 text-accent" /> : null;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-line pt-[env(safe-area-inset-top)]"
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

      <div className="mx-auto flex h-[64px] max-w-[88rem] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[76px] lg:px-8 xl:gap-4 xl:px-12">
        <Link
          href={href(locale, "home")}
          onClick={close}
          aria-label={`Glow by Dilek — ${dict.nav.home}`}
          className="shrink-0"
          data-logo
        >
          <LogoInline className="h-[32px] w-auto sm:h-[36px] xl:h-[40px]" />
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label={dict.nav.main}
          className="hidden items-center gap-0.5 lg:flex xl:gap-1"
        >
          <Link
            href={href(locale, "home")}
            onClick={close}
            aria-current={pathname === href(locale, "home") ? "page" : undefined}
            className={`${navLinkCls(pathname === href(locale, "home"))} hidden xl:inline-flex`}
          >
            {activeMark(pathname === href(locale, "home"))}
            {dict.nav.home}
          </Link>
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

        <div className="hidden items-center gap-3 lg:flex xl:gap-4">
          <LanguageSwitcher
            locale={locale}
            label={dict.nav.language}
            onNavigate={close}
          />
          <Link
            href={href(locale, "booking")}
            onClick={close}
            className="btn btn-primary min-h-11 whitespace-nowrap px-4 py-2.5 text-[0.8125rem] xl:px-5 xl:text-[0.875rem]"
          >
            {dict.nav.booking}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 lg:hidden">
          {!open && (
            <Link
              href={href(locale, "booking")}
              onClick={close}
              className="btn btn-primary hidden min-h-10 whitespace-nowrap px-4 py-2 text-[0.8125rem] min-[400px]:inline-flex"
            >
              {dict.cta.request}
            </Link>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            onClick={toggleMenu}
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

      {/* Desktop mega menu: the categories (with waxing zones), never the full list */}
      {mega && (
        <div
          id="mega-menu"
          className="mega-panel absolute inset-x-0 top-full hidden max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-line bg-paper shadow-[var(--shadow-soft)] lg:block"
        >
          <div className="mx-auto grid max-w-[88rem] grid-cols-[1fr_15rem] gap-10 px-12 py-9">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-1 xl:grid-cols-3">
              {nav.categories.map((c) => (
                <li key={c.href} className="border-b border-line py-4">
                  <Link
                    href={c.href}
                    onClick={close}
                    aria-current={pathname === c.href ? "page" : undefined}
                    className="group flex items-baseline justify-between gap-3"
                  >
                    <span className="font-serif text-[1.45rem] leading-tight text-ink group-hover:text-accent-deep">{c.label}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{c.treatments.length}</span>
                  </Link>
                  {c.teaser && <p className="mt-1 text-sm leading-snug text-muted">{c.teaser}</p>}
                  {c.groups.some((g) => g.href && g.label) && (
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {c.groups
                        .filter((g) => g.href && g.label)
                        .map((g) => (
                          <Link key={g.href} href={g.href!} onClick={close} className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-accent-deep hover:text-ink">
                            {g.label}
                          </Link>
                        ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <div className="border-l border-line pl-8">
              <Link href={nav.allHref} onClick={close} className="btn btn-outline min-h-11 w-full px-4 py-2 text-sm">
                {dict.nav.allTreatments}
                <Icon name="arrow" className="h-3.5 w-3.5" />
              </Link>
              <p className="eyebrow mt-7">{dict.nav.info}</p>
              <ul className="mt-3 space-y-2">
                {nav.info.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={close} className="link-underline text-ink-soft hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
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
            className="mobile-nav mx-auto flex min-h-full max-w-xl flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 sm:px-8"
          >
            <ul>
              <li className="border-b border-line">
                <Link
                  href={href(locale, "home")}
                  onClick={close}
                  aria-current={pathname === href(locale, "home") ? "page" : undefined}
                  className={`star-glint flex min-h-14 items-center justify-between font-serif text-[1.7rem] leading-tight ${pathname === href(locale, "home") ? "text-accent" : "text-ink"}`}
                >
                  {dict.nav.home}
                </Link>
              </li>
              {nav.primary.map((l) =>
                l.key === "treatments" ? (
                  <li key={l.key} className="border-b border-line">
                    <button
                      type="button"
                      aria-expanded={treatOpen}
                      aria-controls="mobile-treatments"
                      onClick={() => setTreatOpen((v) => !v)}
                      className={`flex min-h-14 w-full items-center justify-between text-left font-serif text-[1.7rem] leading-tight ${isActive(treatmentsBase) ? "text-accent" : "text-ink"}`}
                    >
                      {l.label}
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/15">
                        <Icon name="chevron" className={`h-3.5 w-3.5 text-ink transition-transform duration-300 ${treatOpen ? "-rotate-90" : "rotate-90"}`} />
                      </span>
                    </button>
                    <ul id="mobile-treatments" hidden={!treatOpen} className="pb-3">
                      {nav.categories.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            onClick={close}
                            aria-current={pathname === c.href ? "page" : undefined}
                            className={`star-glint flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 text-[1.05rem] ${pathname === c.href ? "bg-glow-soft text-accent-deep" : "text-ink-soft"}`}
                          >
                            {c.label}
                            <span className="text-xs tabular-nums text-muted">{c.treatments.length}</span>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link href={nav.allHref} onClick={close} className="flex min-h-12 items-center gap-2 px-3 text-[0.95rem] font-medium text-accent-deep">
                          {dict.nav.allTreatments}
                          <Icon name="arrow" className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    </ul>
                  </li>
                ) : (
                  <li key={l.key} className="border-b border-line">
                    <Link
                      href={l.href}
                      onClick={close}
                      aria-current={pathname === l.href ? "page" : undefined}
                      className={`star-glint flex min-h-14 items-center justify-between font-serif text-[1.7rem] leading-tight ${pathname === l.href ? "text-accent" : "text-ink"}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>

            {nav.info.some((l) => !nav.primary.some((p) => p.href === l.href)) && (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1">
                {nav.info
                  .filter((l) => !nav.primary.some((p) => p.href === l.href))
                  .map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={close} className="inline-flex min-h-11 items-center text-[0.95rem] text-ink-soft">
                        {l.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}

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
                  placement="up"
                />
                <ProtectedEmail className="text-sm text-muted" />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
