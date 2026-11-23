import type { Metadata } from "next";
import type { ReactNode } from "react";
import { and, eq, inArray, sql } from "drizzle-orm";
import { BadgeSync } from "@/components/private/BadgeSync";
import { PanelShell } from "@/components/private/PanelShell";
import { badgeCount, syncNotifications } from "@/lib/notify/service";
import { currentPermissions, requireCan } from "@/lib/auth/session";
import { AGENDA_PAGE_PERM } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db/client";
import { appointments, inquiries } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";
import { pt } from "@/lib/private/panelLang";
import { getPanelLang } from "@/lib/private/panelLangServer";

export const metadata: Metadata = {
  title: { default: "Agenda", template: "%s · Agenda" },
  manifest: "/agenda/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Agenda", statusBarStyle: "default" },
  icons: { icon: "/brand/agenda-icon.svg", apple: "/brand/agenda-apple-icon.png" },
};

const FIN_TR: Record<string, string> = { Overzicht: "Genel bakış", Facturen: "Faturalar", "Op rekening": "Veresiye", Uitgaven: "Giderler", Rapporten: "Raporlar" };

export default async function AgendaLayout({ children }: { children: ReactNode }) {
  const session = await requireCan("agenda", "agenda.view");
  const perms = await currentPermissions();
  const allowed = (href: string) => {
    const need = AGENDA_PAGE_PERM[href] ?? "owner";
    return need === "owner" ? session.user.role === "owner" : perms.has(need);
  };
  const db = getDb();
  await ensureSeeded(db);
  const [[p], [m]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(appointments).where(inArray(appointments.status, ["requested"])),
    db.select({ n: sql<number>`count(*)` }).from(inquiries).where(and(eq(inquiries.status, "new"))),
  ]);
  const pending = Number(p.n);
  const unread = Number(m.n);
  const owner = session.user.role === "owner";
  // Open actions for the bell, the menu and the app-icon badge (owner only; one rule everywhere).
  let actions = 0;
  if (owner) {
    await syncNotifications(db).catch(() => null);
    actions = await badgeCount(db).catch(() => 0);
  }
  const lang = await getPanelLang();
  // One short menu: the daily work first. Finance pages share one entry (with tabs on the page);
  // the bell and "New appointment" live in the top bar and the bottom bar, so they are not repeated here.
  const financeGroup = [
    { href: "/agenda/financien", label: "Overzicht" },
    { href: "/agenda/facturen", label: "Facturen" },
    { href: "/agenda/openstaand", label: "Op rekening" },
    { href: "/agenda/uitgaven", label: "Uitgaven" },
    { href: "/agenda/historie", label: "Rapporten" },
  ].filter((n) => allowed(n.href));
  const financeHome = financeGroup[0]?.href;
  const allNav = [
    { href: "/agenda", label: "Vandaag", icon: "today" },
    { href: "/agenda/kalender", label: "Kalender", icon: "calendar" },
    { href: "/agenda/aanvragen", label: "Aanvragen", icon: "requests", badge: pending },
    { href: "/agenda/klanten", label: "Klanten", icon: "users" },
    ...(financeHome ? [{ href: financeHome, label: "Financiën", icon: "euro", match: financeGroup.map((n) => n.href) }] : []),
    { href: "/agenda/berichten", label: "Berichten", icon: "messages", badge: unread },
    { href: "/agenda/intake", label: "Intakeformulier", icon: "invoice" },
    { href: "/agenda/werktijden", label: "Openingstijden & beschikbaarheid", icon: "clock", technical: true },
    { href: "/admin/prijzen", label: "Prijzen beheren", icon: "tag", technical: true },
    { href: "/admin/behandelingen", label: "Behandelingen", icon: "tag", technical: true },
    { href: "/admin/bedrijf", label: "Bedrijfsgegevens & facturen", icon: "building", technical: true },
    { href: "/agenda/instellingen", label: "Instellingen", icon: "settings", technical: true },
    ...(session.user.role !== "owner" ? [{ href: "/admin/beveiliging", label: "Mijn account", icon: "settings", technical: true }] : []),
  ];
  const nav = allNav.filter((n) => n.match || allowed(n.href)).map((n) => ({ ...n, label: n.href === financeHome ? pt(lang, "/agenda/financien", "Financiën") : pt(lang, n.href, n.label) }));
  const subnav = [financeGroup.map((n) => ({ ...n, label: lang === "tr" ? FIN_TR[n.label] ?? n.label : n.label }))];
  const allTabs = [
    { href: "/agenda", label: "Vandaag", icon: "today" },
    { href: "/agenda/kalender", label: "Kalender", icon: "calendar" },
    { href: "/agenda/afspraak/nieuw", label: "Nieuw", icon: "plus" },
    { href: "/agenda/aanvragen", label: "Aanvragen", icon: "requests", badge: pending },
    { href: "/agenda/klanten", label: "Klanten", icon: "users" },
  ];
  const tabs = allTabs.filter((t) => allowed(t.href)).map((t) => ({ ...t, label: pt(lang, `tab:${t.href}`, pt(lang, t.href, t.label)) }));
  return (
    <PanelShell area="agenda" nav={nav} tabs={tabs} subnav={subnav} moreLabel={lang === "tr" ? "Ayarlar ve yönetim" : "Instellingen & beheer"} lang={lang} alerts={owner ? { href: "/agenda/meldingen", count: actions, label: pt(lang, "/agenda/meldingen", "Meldingen") } : undefined}>
      {owner && <BadgeSync initial={actions} />}
      {children}
    </PanelShell>
  );
}
