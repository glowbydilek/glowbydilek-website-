import Link from "next/link";
import { Card, PageHeader } from "@/components/private/ui";
import { requireOwner } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { systemStatus } from "@/lib/private/status";

export const metadata = { title: "Overzicht" };

const tiles = [
  { href: "/admin/paginas", title: "Pagina's", body: "Teksten, koppen, knoppen en afbeeldingen per pagina (NL/EN)." },
  { href: "/admin/thema", title: "Thema & Design", body: "Kleuren, knoppen, lettertypes, header en footer." },
  { href: "/admin/navigatie", title: "Menu & footer", body: "Menu-items, volgorde, footertekst en contactgegevens." },
  { href: "/admin/media", title: "Media", body: "Foto's uploaden, vervangen, alt-teksten en uitsnede." },
  { href: "/admin/behandelingen", title: "Behandelingen & prijzen", body: "Prijzen, duur, opruimtijd en online boekbaar." },
  { href: "/admin/seo", title: "SEO", body: "Titels, omschrijvingen, indexering en doorverwijzingen." },
];

export default async function AdminHome() {
  const s = await requireOwner("admin");
  const { checks, counts } = await systemStatus(getDb());
  return (
    <>
      <PageHeader title={`Welkom, ${s.user.name || "Dilek"}`} subtitle="Beheer hier de website. Afspraken en klanten vind je in Ajanda." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Link href="/ajanda/aanvragen" className="rounded-2xl border border-stone bg-white p-4"><span className="block text-3xl font-semibold">{counts.pending}</span><span className="text-sm text-muted">open aanvragen</span></Link>
        <Link href="/ajanda/berichten" className="rounded-2xl border border-stone bg-white p-4"><span className="block text-3xl font-semibold">{counts.unread}</span><span className="text-sm text-muted">nieuwe berichten</span></Link>
        <Link href="/ajanda/instellingen#emails" className="rounded-2xl border border-stone bg-white p-4"><span className={`block text-3xl font-semibold ${counts.failedMail ? "text-[#8e2f24]" : ""}`}>{counts.failedMail}</span><span className="text-sm text-muted">mislukte e-mails</span></Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-2xl border border-stone bg-white p-4 transition hover:border-charcoal/30">
              <span className="block font-serif text-2xl">{t.title}</span>
              <span className="mt-1 block text-sm text-muted">{t.body}</span>
            </Link>
          ))}
        </div>
        <Card title="Systeemstatus">
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
