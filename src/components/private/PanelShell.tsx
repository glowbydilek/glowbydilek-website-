"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoSymbol } from "@/components/brand/Logo";
import { logoutAction } from "@/lib/private/authActions";

export type NavItem = { href: string; label: string; icon?: string; badge?: number };

/**
 * Shared shell for /admin and /ajanda. Desktop: sidebar. Mobile: compact top
 * bar; the agenda additionally shows a bottom tab bar for one-tap access.
 */
export function PanelShell({
  area,
  nav,
  tabs,
  children,
  banner,
}: {
  area: "admin" | "ajanda";
  nav: NavItem[];
  tabs?: NavItem[];
  children: ReactNode;
  banner?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === `/${area}` ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const title = area === "admin" ? "Admin Glow by Dilek" : "Glow by Dilek — Ajanda";
  const other = area === "admin" ? { href: "/ajanda", label: "Naar Ajanda" } : { href: "/admin", label: "Naar Admin" };

  const links = (
    <ul className="space-y-0.5">
      {nav.map((n) => (
        <li key={n.href}>
          <Link
            href={n.href}
            onClick={() => setOpen(false)}
            aria-current={active(n.href) ? "page" : undefined}
            className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-[0.95rem] transition-colors ${
              active(n.href) ? "bg-charcoal text-ivory" : "text-charcoal hover:bg-charcoal/6"
            }`}
          >
            <span>{n.label}</span>
            {n.badge ? <span className="rounded-full bg-gold px-2 text-xs font-semibold text-charcoal">{n.badge}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );

  const footer = (
    <div className="space-y-2 border-t border-stone pt-3 text-sm">
      <Link href={other.href} className="flex min-h-11 items-center rounded-xl px-3 text-gold-deep hover:bg-charcoal/6">
        {other.label} →
      </Link>
      <a href="/" target="_blank" rel="noopener" className="flex min-h-11 items-center rounded-xl px-3 text-muted hover:bg-charcoal/6">
        Website bekijken ↗
      </a>
      <form action={logoutAction}>
        <input type="hidden" name="area" value={area} />
        <button className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-muted hover:bg-charcoal/6">Uitloggen</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-stone bg-white p-4 lg:flex lg:min-h-dvh lg:flex-col lg:justify-between">
        <div>
          <Link href={`/${area}`} className="mb-6 flex items-center gap-3 px-2">
            <LogoSymbol className="h-10 w-auto" />
            <span className="font-serif text-lg leading-tight text-charcoal">{title}</span>
          </Link>
          <nav aria-label={title}>{links}</nav>
        </div>
        {footer}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <Link href={`/${area}`} className="flex min-h-14 items-center gap-2">
            <LogoSymbol className="h-8 w-auto" />
            <span className="font-serif text-lg text-charcoal">{area === "admin" ? "Admin" : "Ajanda"}</span>
          </Link>
          <button
            type="button"
            className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium text-charcoal"
            aria-expanded={open}
            aria-controls="panel-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Sluiten" : "Menu"}
          </button>
        </header>
        {open && (
          <div id="panel-menu" className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top)+1px)] z-30 overflow-y-auto bg-white p-4 lg:hidden">
            <nav aria-label={title}>{links}</nav>
            <div className="mt-4">{footer}</div>
          </div>
        )}

        <main className={`mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-8 ${tabs ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8" : ""}`}>
          {banner}
          {children}
        </main>

        {tabs && (
          <nav aria-label="Snelmenu" className="fixed inset-x-0 bottom-0 z-30 border-t border-stone bg-white/97 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
            <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
              {tabs.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active(t.href) ? "page" : undefined}
                    className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.72rem] font-medium ${active(t.href) ? "text-charcoal" : "text-muted"}`}
                  >
                    <span aria-hidden="true" className="text-lg leading-none">{`${t.icon}\uFE0E`}</span>
                    {t.label}
                    {t.badge ? <span className="absolute right-[22%] top-1.5 min-w-5 rounded-full bg-gold px-1 text-center text-[0.65rem] font-semibold text-charcoal">{t.badge}</span> : null}
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
