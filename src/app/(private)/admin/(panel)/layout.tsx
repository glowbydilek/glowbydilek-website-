import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PanelShell } from "@/components/private/PanelShell";
import { currentPermissions, requireSignedIn } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { ensureSeeded } from "@/lib/db/seed";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin Glow by Dilek" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Every admin page checks its own permission; the layout only needs a signed-in person.
  const s = await requireSignedIn("admin");
  const perms = await currentPermissions();
  const owner = s.user.role === "owner";
  await ensureSeeded(getDb());
  const allNav = [
    { href: "/admin", label: "Overzicht", icon: "overview" },
    { href: "/admin/paginas", label: "Pagina's", icon: "pages" },
    { href: "/admin/thema", label: "Thema & Design", icon: "palette" },
    { href: "/admin/navigatie", label: "Menu & footer", icon: "navigation" },
    { href: "/admin/media", label: "Media", icon: "image" },
    { href: "/admin/behandelingen", label: "Behandelingen & prijzen", icon: "tag" },
    { href: "/admin/over-dilek", label: "Over Dilek (opleiding)", icon: "users" },
    { href: "/admin/producten", label: "Producten & materialen", icon: "invoice" },
    { href: "/admin/acties", label: "Acties & kortingen", icon: "percent" },
    { href: "/admin/beoordelingen", label: "Beoordelingen", icon: "star" },
    { href: "/admin/social", label: "Social media", icon: "share" },
    { href: "/admin/seo", label: "SEO & doorverwijzingen", icon: "search" },
    { href: "/admin/analytics", label: "Analytics & cookies", icon: "chart" },
    { href: "/admin/e-mails", label: "E-mailteksten", icon: "mail" },
    { href: "/admin/bedrijf", label: "Bedrijf & facturen", icon: "building" },
    { href: "/admin/privacy", label: "Privacy & consultatie", icon: "consult" },
    { href: "/admin/juridisch", label: "Juridische pagina's", icon: "pages" },
    { href: "/admin/beveiliging", label: "Beveiliging", icon: "shield" },
    { href: "/admin/medewerkers", label: "Medewerkers & rechten", icon: "users" },
    { href: "/admin/systeem", label: "Systeem & logboek", icon: "server" },
  ];
  const NON_OWNER: Record<string, boolean> = {
    "/admin/paginas": perms.has("cms.edit"),
    "/admin/behandelingen": perms.has("cms.publish"),
    "/admin/beveiliging": true,
  };
  const nav = [
    ...allNav.filter((n) => owner || NON_OWNER[n.href]),
    ...(!owner && perms.has("agenda.view") ? [{ href: "/agenda", label: "Naar de agenda", icon: "calendar" }] : []),
  ];
  const banner = !s.user.mfaEnabled ? (
    <div className="mb-5 rounded-xl border border-accent/60 bg-[#fbf3e4] px-4 py-3 text-sm text-[#5a4320]">
      Beveilig je account met tweestapsverificatie.{" "}
      <Link href="/admin/beveiliging" className="font-medium underline">
        Nu instellen
      </Link>
    </div>
  ) : null;
  return (
    <PanelShell area="admin" nav={nav} banner={banner}>
      {children}
    </PanelShell>
  );
}
