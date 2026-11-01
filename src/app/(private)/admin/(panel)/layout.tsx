import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PanelShell } from "@/components/private/PanelShell";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { ensureSeeded } from "@/lib/db/seed";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin Glow by Dilek" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const s = await requireOwner("admin");
  await ensureSeeded(getDb());
  const nav = [
    { href: "/admin", label: "Overzicht" },
    { href: "/admin/paginas", label: "Pagina's" },
    { href: "/admin/thema", label: "Thema & Design" },
    { href: "/admin/navigatie", label: "Menu & footer" },
    { href: "/admin/media", label: "Media" },
    { href: "/admin/behandelingen", label: "Behandelingen & prijzen" },
    { href: "/admin/seo", label: "SEO & doorverwijzingen" },
    { href: "/admin/e-mails", label: "E-mailteksten" },
    { href: "/admin/beveiliging", label: "Beveiliging" },
    { href: "/admin/systeem", label: "Systeem & logboek" },
  ];
  const banner = !s.user.mfaEnabled ? (
    <div className="mb-5 rounded-xl border border-gold/60 bg-[#fbf3e4] px-4 py-3 text-sm text-[#5a4320]">
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
