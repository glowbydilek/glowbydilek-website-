import Link from "next/link";
import { desc, ne } from "drizzle-orm";
import { Badge, Card, PageHeader } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { inquiries } from "@/lib/db/schema";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Berichten" };
const ST: Record<string, { label: string; tone: "pending" | "neutral" | "confirmed" | "done" }> = {
  new: { label: "Nieuw", tone: "pending" },
  read: { label: "Gelezen", tone: "neutral" },
  replied: { label: "Beantwoord", tone: "confirmed" },
  closed: { label: "Afgehandeld", tone: "done" },
};

export default async function Inbox({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const all = (await searchParams).alle === "1";
  const rows = await getDb().select().from(inquiries).where(all ? undefined : ne(inquiries.status, "closed")).orderBy(desc(inquiries.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Berichten" subtitle="Vragen via het contactformulier. Je ontvangt ze ook per e-mail." actions={<Link href={all ? "/ajanda/berichten" : "/ajanda/berichten?alle=1"} className="text-sm text-gold-deep underline">{all ? "Alleen open berichten" : "Toon ook afgehandeld"}</Link>} />
      <Card>
        {rows.length ? (
          <ul className="divide-y divide-stone">
            {rows.map((m) => (
              <li key={m.id}>
                <Link href={`/ajanda/berichten/${m.id}`} className="flex min-h-14 items-start justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className={`block ${m.status === "new" ? "font-semibold" : ""}`}>{m.name}</span>
                    <span className="block truncate text-sm text-muted">{m.message.slice(0, 120)}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <Badge tone={ST[m.status]?.tone}>{ST[m.status]?.label ?? m.status}</Badge>
                    <span className="mt-1 block text-xs text-muted">{formatLocal(m.createdAt, "nl", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Geen berichten.</p>
        )}
      </Card>
    </>
  );
}
