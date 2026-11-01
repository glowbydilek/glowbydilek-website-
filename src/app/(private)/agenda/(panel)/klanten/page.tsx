import Link from "next/link";
import { Card, Input, LinkButton, Notice, PageHeader, Stat } from "@/components/private/ui";
import { searchCustomers } from "@/lib/booking/service";
import { customerMetrics, findDuplicates } from "@/lib/crm/service";
import { getDb } from "@/lib/db/client";
import { dayBoundsUtc, todayLocal } from "@/lib/time";

export const metadata = { title: "Klanten" };

export default async function Customers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const db = getDb();
  const today = todayLocal();
  const monthStart = dayBoundsUtc(`${today.slice(0, 7)}-01`).start;
  const [rows, m, dups] = await Promise.all([searchCustomers(db, q, 50), customerMetrics(db, monthStart, dayBoundsUtc(today).end), findDuplicates(db, 20)]);
  return (
    <>
      <PageHeader title="Klanten" subtitle="Zoek op voornaam, achternaam, telefoonnummer of e-mailadres." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Klanten" value={m.total} />
        <Stat label="Nieuw deze maand" value={m.newCustomers} hint="Eerste afgeronde behandeling" />
        <Stat label="Terugkerend deze maand" value={m.returning} hint="Kwamen eerder ook al" />
      </div>
      {dups.length > 0 && (
        <div className="mb-4">
          <Notice tone="warning">
            {dups.length} mogelijk dubbel{dups.length === 1 ? " profiel" : "e profielen"} gevonden. <Link href="/agenda/klanten/dubbel" className="underline">Bekijken</Link>
          </Notice>
        </div>
      )}
      <form action="/agenda/klanten" role="search" className="mb-4 flex gap-2">
        <Input name="q" type="search" defaultValue={q} placeholder="Naam, telefoon of e-mail" aria-label="Zoek klant" autoComplete="off" />
        <button className="min-h-11 rounded-full bg-ink px-5 text-sm text-paper">Zoeken</button>
      </form>
      <Card>
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/agenda/klanten/${c.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2">
                  <span>
                    <span className="block font-medium">{c.firstName} {c.lastName}</span>
                    <span className="block text-sm text-muted">{[c.phone, c.email].filter(Boolean).join(" · ") || "—"}</span>
                  </span>
                  <span aria-hidden="true" className="text-muted">›</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{q ? "Geen klant gevonden." : "Nog geen klanten."}</p>
        )}
      </Card>
      <div className="mt-4"><LinkButton href="/agenda/afspraak/nieuw">＋ Nieuwe afspraak met nieuwe klant</LinkButton></div>
    </>
  );
}
