import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PanelShell } from "@/components/private/PanelShell";
import { currentPermissions, requireSignedIn } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { ensureSeeded } from "@/lib/db/seed";
import { pt } from "@/lib/private/panelLang";
import { getPanelLang } from "@/lib/private/panelLangServer";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin Glow by Dilek" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Every admin page checks its own permission; the layout only needs a signed-in person.
  const s = await requireSignedIn("admin");
  const perms = await currentPermissions();
  const owner = s.user.role === "owner";
  await ensureSeeded(getDb());
  const lang = await getPanelLang();
  // A. Agenda & bedrijfsbeheer — what the owner uses every day.
  // B. Websitebeheer & technisch — folded away under one heading (PanelShell), nothing removed.
  const allNav = [
    { href: "/admin", label: "Overzicht", icon: "overview" },
    { href: "/agenda", label: "Agenda", icon: "calendar" },
    { href: "/agenda/klanten", label: "Klanten", icon: "users" },
    { href: "/admin/behandelingen", label: "Behandelingen", icon: "tag" },
    { href: "/admin/prijzen", label: "Prijzen beheren", icon: "euro" },
    { href: "/agenda/intake", label: "Intakeformulieren & PDF", icon: "consult" },
    { href: "/agenda/facturen", label: "Facturen", icon: "invoice" },
    { href: "/agenda/werktijden", label: "Openingstijden & beschikbaarheid", icon: "clock" },
    { href: "/admin/bedrijf", label: "Bedrijfsgegevens", icon: "building" },
    { href: "/admin/beveiliging", label: "Mijn account & beveiliging", icon: "shield" },
    { href: "/admin/paginas", label: "Pagina's", icon: "pages", technical: true },
    { href: "/admin/media", label: "Media", icon: "image", technical: true },
    { href: "/admin/over-dilek", label: "Over Dilek (opleiding)", icon: "users", technical: true },
    { href: "/admin/producten", label: "Producten & materialen", icon: "invoice", technical: true },
    { href: "/admin/acties", label: "Acties & kortingen", icon: "percent", technical: true },
    { href: "/admin/beoordelingen", label: "Beoordelingen", icon: "star", technical: true },
    { href: "/admin/social", label: "Social media", icon: "share", technical: true },
    { href: "/admin/juridisch", label: "Juridische pagina's", icon: "pages", technical: true },
    { href: "/admin/privacy", label: "Privacy & consultatie", icon: "consult", technical: true },
    { href: "/admin/thema", label: "Thema & Design", icon: "palette", technical: true },
    { href: "/admin/navigatie", label: "Menu & footer", icon: "navigation", technical: true },
    { href: "/admin/seo", label: "SEO & doorverwijzingen", icon: "search", technical: true },
    { href: "/admin/analytics", label: "Analytics & cookies", icon: "chart", technical: true },
    { href: "/admin/e-mails", label: "E-mailteksten", icon: "mail", technical: true },
    { href: "/admin/medewerkers", label: "Medewerkers & rechten", icon: "users", technical: true },
    { href: "/admin/systeem", label: "Systeem & logboek", icon: "server", technical: true },
  ];
  const NON_OWNER: Record<string, boolean> = {
    "/admin/paginas": perms.has("cms.edit"),
    "/admin/behandelingen": perms.has("cms.publish"),
    "/admin/prijzen": perms.has("cms.publish"),
    "/admin/beveiliging": true,
    "/agenda": perms.has("agenda.view"),
    "/agenda/klanten": perms.has("customers.view"),
    "/agenda/intake": perms.has("health.view"),
    "/agenda/facturen": perms.has("finance"),
    "/agenda/werktijden": perms.has("hours.manage"),
  };
  const nav = [
    ...allNav.filter((n) => owner || NON_OWNER[n.href]).map((n) => ({ ...n, label: lang === "nl" ? n.label : pt(lang, `admin:${n.href}`, pt(lang, n.href, n.label)) })),
  ];
  // Same bottom bar as the Agenda, for the owner's daily tasks.
  const tabsNl = [
    { href: "/admin", label: "Overzicht", tr: "Genel", icon: "overview" },
    { href: "/agenda", label: "Agenda", tr: "Ajanda", icon: "calendar" },
    { href: "/agenda/klanten", label: "Klanten", tr: "Müşteriler", icon: "users" },
    { href: "/admin/prijzen", label: "Prijzen", tr: "Fiyatlar", icon: "euro" },
    { href: "/agenda/facturen", label: "Facturen", tr: "Faturalar", icon: "invoice" },
  ];
  const tabs = tabsNl.filter((t) => owner || NON_OWNER[t.href]).map((t) => ({ href: t.href, icon: t.icon, label: lang === "tr" ? t.tr : t.label }));
  const banner = !s.user.mfaEnabled ? (
    <div className="mb-5 rounded-xl border border-accent/60 bg-[#fbf3e4] px-4 py-3 text-sm text-[#5a4320]">
      {lang === "tr" ? "Hesabını iki adımlı doğrulamayla koru." : "Beveilig je account met tweestapsverificatie."}{" "}
      <Link href="/admin/beveiliging" className="font-medium underline">
        {lang === "tr" ? "Şimdi ayarla" : "Nu instellen"}
      </Link>
    </div>
  ) : null;
  return (
    <PanelShell area="admin" nav={nav} tabs={tabs.length > 1 ? tabs : undefined} banner={banner} lang={lang}>
      {children}
    </PanelShell>
  );
}
