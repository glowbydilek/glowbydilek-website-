import Link from "next/link";
import { MergeForm } from "@/components/private/agenda/MergeForm";
import { Card, PageHeader } from "@/components/private/ui";
import { findDuplicates } from "@/lib/crm/service";
import { matchLabel } from "@/lib/crm/normalize";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Dubbele klanten" };

export default async function Duplicates({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const focus = Number((await searchParams).a) || null;
  const all = await findDuplicates(getDb(), 100);
  const pairs = focus ? all.filter((p) => p.a.id === focus || p.b.id === focus) : all;
  const label = (c: { firstName: string; lastName: string; id: number }) => `${c.firstName} ${c.lastName}`.trim() + ` (#${c.id})`;
  return (
    <>
      <PageHeader title="Mogelijk dubbele klanten" subtitle="Profielen met hetzelfde telefoonnummer, e-mailadres of dezelfde naam. Samenvoegen gebeurt alleen als jij dat kiest." />
      {pairs.length ? (
        <ul className="space-y-4">
          {pairs.map((p) => (
            <li key={`${p.a.id}-${p.b.id}`}>
              <Card>
                <p className="mb-3 text-sm text-muted">Overeenkomst: {matchLabel(p.reasons)}{p.reasons.length === 1 && p.reasons[0] === "name" ? " — let op: alleen de naam is gelijk, controleer goed of het dezelfde persoon is." : ""}</p>
                <div className="mb-4 grid [&>*]:min-w-0 gap-3 sm:grid-cols-2">
                  {[p.a, p.b].map((c) => (
                    <Link key={c.id} href={`/ajanda/klanten/${c.id}`} className="rounded-xl bg-ivory-50 p-3 text-sm">
                      <span className="block font-medium">{label(c)}</span>
                      <span className="block break-words text-muted">{[c.phone, c.email].filter(Boolean).join(" · ") || "—"}</span>
                    </Link>
                  ))}
                </div>
                <MergeForm a={{ id: p.a.id, label: label(p.a) }} b={{ id: p.b.id, label: label(p.b) }} />
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <p className="text-sm text-muted">Geen dubbele profielen gevonden.</p>
        </Card>
      )}
    </>
  );
}
