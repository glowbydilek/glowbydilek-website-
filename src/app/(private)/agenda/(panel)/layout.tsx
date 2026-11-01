import type { Metadata } from "next";
import type { ReactNode } from "react";
import { and, eq, inArray, sql } from "drizzle-orm";
import { PanelShell } from "@/components/private/PanelShell";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { appointments, inquiries } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";

export const metadata: Metadata = {
  title: { default: "Agenda", template: "%s · Agenda" },
  manifest: "/agenda/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Agenda", statusBarStyle: "default" },
  icons: { apple: "/apple-icon.png" },
};

export default async function AgendaLayout({ children }: { children: ReactNode }) {
  await requireOwner("agenda");
  const db = getDb();
  await ensureSeeded(db);
  const [[p], [m]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(appointments).where(inArray(appointments.status, ["requested"])),
    db.select({ n: sql<number>`count(*)` }).from(inquiries).where(and(eq(inquiries.status, "new"))),
  ]);
  const pending = Number(p.n);
  const unread = Number(m.n);
  const nav = [
    { href: "/agenda", label: "Vandaag", icon: "today" },
    { href: "/agenda/kalender", label: "Kalender", icon: "calendar" },
    { href: "/agenda/aanvragen", label: "Aanvragen", icon: "requests", badge: pending },
    { href: "/agenda/afspraak/nieuw", label: "Nieuwe afspraak", icon: "plus" },
    { href: "/agenda/klanten", label: "Klanten", icon: "users" },
    { href: "/agenda/financien", label: "Financiën", icon: "euro" },
    { href: "/agenda/facturen", label: "Facturen & PDF", icon: "invoice" },
    { href: "/agenda/berichten", label: "Berichten", icon: "messages", badge: unread },
    { href: "/agenda/historie", label: "Overzichten", icon: "history" },
    { href: "/agenda/werktijden", label: "Werktijden", icon: "clock" },
    { href: "/agenda/instellingen", label: "Instellingen", icon: "settings" },
  ];
  const tabs = [
    { href: "/agenda", label: "Vandaag", icon: "today" },
    { href: "/agenda/kalender", label: "Kalender", icon: "calendar" },
    { href: "/agenda/afspraak/nieuw", label: "Nieuw", icon: "plus" },
    { href: "/agenda/aanvragen", label: "Aanvragen", icon: "requests", badge: pending },
    { href: "/agenda/klanten", label: "Klanten", icon: "users" },
  ];
  return (
    <PanelShell area="agenda" nav={nav} tabs={tabs}>
      {children}
    </PanelShell>
  );
}
