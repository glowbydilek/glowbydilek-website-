"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PanelMonogram } from "./PanelMonogram";
import { logoutAction } from "@/lib/private/authActions";
import { PanelIcon } from "./PanelIcon";
import { pt, type PanelLang } from "@/lib/private/panelLang";
import { setPanelLangAction } from "@/lib/private/panelLangActions";

export type NavItem = { href: string; label: string; icon?: string; badge?: number; technical?: boolean };

/**
 * Shared shell for /admin and /agenda. Desktop: sidebar. Mobile: compact top
 * bar plus a bottom tab bar for one-tap access to the daily tasks.
 */
export function PanelShell({
  area,
  nav,
  tabs,
  children,
  banner,
  lang = "nl",
  alerts,
}: {
  /** Bell in the mobile top bar: link to Meldingen with the number of open actions. */
  alerts?: { href: string; count: number; label: string };
  lang?: PanelLang;
  area: "admin" | "agenda";
  nav: NavItem[];
  tabs?: NavItem[];
  children: ReactNode;
  banner?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // While typing (on-screen keyboard open) the bottom tab bar steps aside, so it
  // never covers a field or a Save button on iPhone.
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.isContentEditable || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && !["checkbox", "radio", "button", "submit", "reset", "file", "range", "color"].includes((el as HTMLInputElement).type)));
    const onIn = (e: FocusEvent) => setTyping(isField(e.target));
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  const active = (href: string) => (href === `/${area}` ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const t = (k: string) => pt(lang, k);
  const title = area === "admin" ? t("titleAdmin") : t("titleAgenda");
  const other = area === "admin" ? { href: "/agenda", label: t("toAgenda") } : { href: "/admin", label: t("toAdmin") };

  /* NL / TR switch: a small form per option, so it also works before JavaScript loads. */
  const langSwitch = (compact: boolean) => (
    <div role="group" aria-label={t("language")} className={`flex items-center gap-1 ${compact ? "" : "px-3"}`}>
      {(["nl", "tr"] as const).map((l) => (
        <form key={l} action={setPanelLangAction}>
          <input type="hidden" name="lang" value={l} />
          <button
            type="submit"
            aria-pressed={lang === l}
            lang={l}
            className={`min-h-9 min-w-11 rounded-full px-3 text-xs font-semibold tracking-wide transition-colors ${
              lang === l ? "bg-ink text-paper" : "text-muted hover:bg-ink/6 hover:text-ink"
            }`}
          >
            {l === "nl" ? "NL" : "TR"}
          </button>
        </form>
      ))}
    </div>
  );

  const item = (n: NavItem) => (
    <li key={n.href}>
      <Link
        href={n.href}
        onClick={() => setOpen(false)}
        aria-current={active(n.href) ? "page" : undefined}
        className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-[0.95rem] transition-colors ${
          active(n.href) ? "bg-ink text-paper" : "text-ink hover:bg-ink/6"
        }`}
      >
        <span className="flex items-center gap-3">
          {n.icon && <PanelIcon name={n.icon} className={`h-5 w-5 ${active(n.href) ? "text-paper" : "text-muted"}`} />}
          {n.label}
        </span>
        {n.badge ? <span className="rounded-full bg-accent px-2 text-xs font-semibold text-ink">{n.badge}</span> : null}
      </Link>
    </li>
  );
  const business = nav.filter((n) => !n.technical);
  const technical = nav.filter((n) => n.technical);
  const technicalOpen = technical.some((n) => active(n.href));
  // Daily business items first; technical configuration (analytics, SEO, theme, system) folded away underneath.
  const links = (
    <>
      <ul className="space-y-0.5">{business.map(item)}</ul>
      {technical.length > 0 && (
        <details className="mt-3 border-t border-line pt-2" open={technicalOpen}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:bg-ink/6 [&::-webkit-details-marker]:hidden">
            {lang === "tr" ? "Web sitesi ve teknik yönetim" : "Websitebeheer & technisch"}
            <span aria-hidden="true">›</span>
          </summary>
          <ul className="mt-1 space-y-0.5">{technical.map(item)}</ul>
        </details>
      )}
    </>
  );

  const footer = (
    <div className="space-y-2 border-t border-line pt-3 text-sm">
      {langSwitch(false)}
      <Link href={other.href} className="flex min-h-11 items-center rounded-xl px-3 text-accent-deep hover:bg-ink/6">
        {other.label} →
      </Link>
      <a href="/" target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-xl px-3 text-muted hover:bg-ink/6">
        {t("viewSite")} ↗
      </a>
      <form action={logoutAction}>
        <input type="hidden" name="area" value={area} />
        <button className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-muted hover:bg-ink/6">{t("logout")}</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-line bg-white p-4 lg:flex lg:min-h-dvh lg:flex-col lg:justify-between">
        <div>
          <Link href={`/${area}`} className="mb-6 flex items-center gap-3 px-2">
            <PanelMonogram className="h-10 w-10" />
            <span className="font-serif text-lg leading-tight text-ink">{title}</span>
          </Link>
          <nav aria-label={title}>{links}</nav>
        </div>
        {footer}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <Link href={`/${area}`} className="flex min-h-14 items-center gap-2">
            <PanelMonogram className="h-8 w-8" />
            <span className="font-serif text-lg text-ink">{area === "admin" ? "Admin" : lang === "tr" ? "Ajanda" : "Agenda"}</span>
          </Link>
          <div className="ml-auto mr-1">{langSwitch(true)}</div>
          {alerts && (
            <Link href={alerts.href} aria-label={alerts.count ? `${alerts.label}: ${alerts.count}` : alerts.label} className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink">
              <PanelIcon name="bell" className="h-6 w-6" />
              {alerts.count ? <span className="absolute right-0.5 top-1 min-w-5 rounded-full bg-accent px-1 text-center text-[0.65rem] font-semibold text-ink">{alerts.count}</span> : null}
            </Link>
          )}
          <button
            type="button"
            className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium text-ink"
            aria-expanded={open}
            aria-controls="panel-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t("close") : t("menu")}
          </button>
        </header>
        {open && (
          <div id="panel-menu" className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top)+1px)] z-30 overflow-y-auto bg-white p-4 lg:hidden">
            <nav aria-label={title}>{links}</nav>
            <div className="mt-4">{footer}</div>
          </div>
        )}

        <main className={`mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-8 ${tabs ? "panel-has-tabs pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8" : ""}`}>
          {banner}
          {children}
        </main>

        {tabs && (
          <nav
            aria-label={t("quickMenu")}
            aria-hidden={typing || undefined}
            className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/97 pb-[env(safe-area-inset-bottom)] backdrop-blur motion-safe:transition-transform motion-safe:duration-200 lg:hidden ${typing ? "pointer-events-none translate-y-full" : ""}`}
          >
            <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
              {tabs.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active(t.href) ? "page" : undefined}
                    className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.72rem] font-medium ${active(t.href) ? "text-ink" : "text-muted"}`}
                  >
                    {t.icon && <PanelIcon name={t.icon} className="h-6 w-6" />}
                    {t.label}
                    {t.badge ? <span className="absolute right-[22%] top-1.5 min-w-5 rounded-full bg-accent px-1 text-center text-[0.65rem] font-semibold text-ink">{t.badge}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
