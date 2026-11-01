import Link from "next/link";
import { Card, Input, LinkButton, PageHeader } from "@/components/private/ui";
import { searchCustomers } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Klanten" };

export default async function Customers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const rows = await searchCustomers(getDb(), q, 50);
  return (
    <>
      <PageHeader title="Klanten" subtitle="Zoek op naam, telefoonnummer of e-mailadres." />
      <form action="/ajanda/klanten" role="search" className="mb-4 flex gap-2">
        <Input name="q" type="search" defaultValue={q} placeholder="Naam of telefoonnummer" aria-label="Zoek klant" autoComplete="off" />
        <button className="min-h-11 rounded-full bg-charcoal px-5 text-sm text-ivory">Zoeken</button>
      </form>
      <Card>
        {rows.length ? (
          <ul className="divide-y divide-stone">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/ajanda/klanten/${c.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2">
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
      <div className="mt-4"><LinkButton href="/ajanda/afspraak/nieuw">＋ Nieuwe afspraak met nieuwe klant</LinkButton></div>
    </>
  );
}
