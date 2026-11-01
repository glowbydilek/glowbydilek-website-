import type { Metadata } from "next";
import type { ReactNode } from "react";
import { and, eq, inArray, sql } from "drizzle-orm";
import { PanelShell } from "@/components/private/PanelShell";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { appointments, inquiries } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/db/seed";

export const metadata: Metadata = {
  title: { default: "Ajanda", template: "%s · Ajanda" },
  manifest: "/ajanda/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Ajanda", statusBarStyle: "default" },
  icons: { apple: "/apple-icon.png" },
};

export default async function AgendaLayout({ children }: { children: ReactNode }) {
  await requireOwner("ajanda");
  const db = getDb();
  await ensureSeeded(db);
  const [[p], [m]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(appointments).where(inArray(appointments.status, ["requested"])),
    db.select({ n: sql<number>`count(*)` }).from(inquiries).where(and(eq(inquiries.status, "new"))),
  ]);
  const pending = Number(p.n);
  const unread = Number(m.n);
  const nav = [
    { href: "/ajanda", label: "Vandaag" },
    { href: "/ajanda/agenda", label: "Agenda" },
    { href: "/ajanda/aanvragen", label: "Aanvragen", badge: pending },
    { href: "/ajanda/afspraak/nieuw", label: "Nieuwe afspraak" },
    { href: "/ajanda/klanten", label: "Klanten" },
    { href: "/ajanda/berichten", label: "Berichten", badge: unread },
    { href: "/ajanda/historie", label: "Geschiedenis" },
    { href: "/ajanda/werktijden", label: "Werktijden" },
    { href: "/ajanda/instellingen", label: "Instellingen" },
  ];
  const tabs = [
    { href: "/ajanda", label: "Vandaag", icon: "☀" },
    { href: "/ajanda/agenda", label: "Agenda", icon: "▦" },
    { href: "/ajanda/afspraak/nieuw", label: "Nieuw", icon: "＋" },
    { href: "/ajanda/aanvragen", label: "Aanvragen", icon: "✉", badge: pending },
    { href: "/ajanda/klanten", label: "Klanten", icon: "☺" },
  ];
  return (
    <PanelShell area="ajanda" nav={nav} tabs={tabs}>
      {children}
    </PanelShell>
  );
}
