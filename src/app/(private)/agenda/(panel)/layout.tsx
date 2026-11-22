import type { Metadata } from "next";
import type { ReactNode } from "react";
import { and, eq, inArray, sql } from "drizzle-orm";
import { PanelShell } from "@/components/private/PanelShell";
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
  const lang = await getPanelLang();
  const allNav = [
    { href: "/agenda", label: "Vandaag", icon: "today" },
    { href: "/agenda/kalender", label: "Kalender", icon: "calendar" },
    { href: "/agenda/aanvragen", label: "Aanvragen", icon: "requests", badge: pending },
    { href: "/agenda/afspraak/nieuw", label: "Nieuwe afspraak", icon: "plus" },
    { href: "/agenda/klanten", label: "Klanten", icon: "users" },
    { href: "/agenda/intake", label: "Intakeformulier", icon: "invoice" },
    { href: "/agenda/financien", label: "Financiën", icon: "euro" },
    { href: "/agenda/openstaand", label: "Openstaand (op rekening)", icon: "euro" },
    { href: "/agenda/facturen", label: "Facturen & PDF", icon: "invoice" },
    { href: "/agenda/uitgaven", label: "Uitgaven", icon: "euro" },
    { href: "/agenda/berichten", label: "Berichten", icon: "messages", badge: unread },
    { href: "/agenda/historie", label: "Overzichten", icon: "history" },
    { href: "/agenda/werktijden", label: "Werktijden", icon: "clock" },
    { href: "/admin/prijzen", label: "Prijzen beheren", icon: "tag" },
    { href: "/admin/behandelingen", label: "Behandelingen", icon: "tag" },
    { href: "/admin/bedrijf", label: "Bedrijfsgegevens & facturen", icon: "building" },
    { href: "/agenda/instellingen", label: "Instellingen", icon: "settings" },
    ...(session.user.role !== "owner" ? [{ href: "/admin/beveiliging", label: "Mijn account", icon: "settings" }] : []),
  ];
  const nav = allNav.filter((n) => allowed(n.href)).map((n) => ({ ...n, label: pt(lang, n.href, n.label) }));
  const allTabs = [
    { href: "/agenda", label: "Vandaag", icon: "today" },
    { href: "/agenda/kalender", label: "Kalender", icon: "calendar" },
    { href: "/agenda/afspraak/nieuw", label: "Nieuw", icon: "plus" },
    { href: "/agenda/aanvragen", label: "Aanvragen", icon: "requests", badge: pending },
    { href: "/agenda/klanten", label: "Klanten", icon: "users" },
    { href: "/agenda/intake", label: "Intake", icon: "invoice" },
  ];
  const tabs = allTabs.filter((t) => allowed(t.href)).map((t) => ({ ...t, label: pt(lang, `tab:${t.href}`, pt(lang, t.href, t.label)) }));
  return (
    <PanelShell area="agenda" nav={nav} tabs={tabs} lang={lang}>
      {children}
    </PanelShell>
  );
}
