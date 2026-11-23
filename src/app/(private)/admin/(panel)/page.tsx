import Link from "next/link";
import { Card, PageHeader } from "@/components/private/ui";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { systemStatus } from "@/lib/private/status";
import { panelT } from "@/lib/private/panelLangServer";

export const metadata = { title: "Overzicht" };

// Everyday business first: one tap to each daily task.
const tiles = [
  { href: "/agenda", title: "Agenda", body: "Afspraken van vandaag en de kalender." },
  { href: "/agenda/afspraak/nieuw", title: "Nieuwe afspraak", body: "Snel een afspraak inplannen." },
  { href: "/agenda/klanten", title: "Klanten", body: "Gegevens, afspraken en documenten per klant." },
  { href: "/admin/prijzen", title: "Prijzen beheren", body: "Prijs of ‘Op aanvraag’ — tik op OK, klaar." },
  { href: "/agenda/facturen", title: "Facturen", body: "Factuur maken met je behandelingen en prijzen." },
  { href: "/agenda/intake", title: "Intakeformulieren & PDF", body: "Formulieren vinden, bekijken en printen." },
  { href: "/agenda/werktijden", title: "Openingstijden", body: "Dagen, tijden, pauzes, vakantie en uitzonderingen." },
  { href: "/admin/behandelingen", title: "Behandelingen", body: "Teksten, duur en publicatie van behandelingen." },
  { href: "/admin/bedrijf", title: "Bedrijfsgegevens", body: "Bedrijfs- en factuurgegevens." },
];

export default async function AdminHome() {
  const t = await panelT();
  const s = await requireOwner("admin");
  const { checks, counts } = await systemStatus(getDb());
  return (
    <>
      <PageHeader title={`Welkom, ${s.user.name || "Dilek"}`} subtitle="Alles voor je dagelijkse werk op één plek. Website- en technische instellingen staan onderaan het menu." />
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <Link href="/agenda/aanvragen" className="rounded-2xl border border-line bg-white p-3 sm:p-4"><span className="block text-2xl font-semibold sm:text-3xl">{counts.pending}</span><span className="text-xs text-muted sm:text-sm">{t("open aanvragen")}</span></Link>
        <Link href="/agenda/berichten" className="rounded-2xl border border-line bg-white p-3 sm:p-4"><span className="block text-2xl font-semibold sm:text-3xl">{counts.unread}</span><span className="text-xs text-muted sm:text-sm">{t("nieuwe berichten")}</span></Link>
        <Link href="/agenda/instellingen#emails" className="rounded-2xl border border-line bg-white p-3 sm:p-4"><span className={`block text-2xl font-semibold sm:text-3xl ${counts.failedMail ? "text-[#8e2f24]" : ""}`}>{counts.failedMail}</span><span className="text-xs text-muted sm:text-sm">{t("mislukte e-mails")}</span></Link>
      </div>
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid [&>*]:min-w-0 grid-cols-2 gap-3">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-2xl border border-line bg-white p-3.5 transition hover:border-ink/30 sm:p-4">
              <span className="block font-serif text-xl">{t.title}</span>
              <span className="mt-1 block text-xs text-muted sm:text-sm">{t.body}</span>
            </Link>
          ))}
        </div>
        <Card title={t("Systeemstatus")} className="hidden lg:block">
          <ul className="space-y-2.5 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex gap-3">
                <span aria-hidden="true" className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${c.ok ? "bg-[#5c7f5a]" : "bg-[#d98a41]"}`} />
                <span>
                  <span className="block font-medium">{c.label}</span>
                  <span className="text-muted">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
