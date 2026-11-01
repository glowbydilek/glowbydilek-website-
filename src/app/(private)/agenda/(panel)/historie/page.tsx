import Link from "next/link";
import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { Card, PageHeader } from "@/components/private/ui";
import { addDays, listByStatus, listHistory, listRange, listUpcoming } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { todayLocal } from "@/lib/time";

export const metadata = { title: "Overzichten" };

const TABS = [
  ["morgen", "Morgen"],
  ["komend", "Komend"],
  ["afgerond", "Afgerond"],
  ["geannuleerd", "Geannuleerd"],
  ["niet-verschenen", "Niet verschenen"],
  ["afgewezen", "Afgewezen"],
  ["alles", "Alle geschiedenis"],
] as const;

export default async function Overviews({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const tab = (await searchParams).lijst ?? "komend";
  const db = getDb();
  const tomorrow = addDays(todayLocal(), 1);
  const items =
    tab === "morgen"
      ? await listRange(db, tomorrow, tomorrow)
      : tab === "afgerond"
        ? await listByStatus(db, ["completed"])
        : tab === "geannuleerd"
          ? await listByStatus(db, ["cancelled"])
          : tab === "niet-verschenen"
            ? await listByStatus(db, ["no_show"])
            : tab === "afgewezen"
              ? await listByStatus(db, ["declined"])
              : tab === "alles"
                ? await listHistory(db)
                : await listUpcoming(db);
  const current = TABS.find(([k]) => k === tab) ?? TABS[1];
  return (
    <>
      <PageHeader
        title="Overzichten"
        subtitle="Komende, afgeronde, geannuleerde en eerdere afspraken."
        actions={
          // PDF download from a route handler, not a page: a plain link is intended.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/agenda/historie/rapport?p=month" className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">
            Activiteiten (PDF)
          </a>
        }
      />
      <nav aria-label="Lijst" className="mb-4 flex flex-wrap gap-1 rounded-2xl bg-white p-1 text-sm shadow-sm">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/agenda/historie?lijst=${k}`} aria-current={k === current[0] ? "page" : undefined} className={`rounded-full px-4 py-2 ${k === current[0] ? "bg-ink text-paper" : "hover:bg-ink/6"}`}>
            {l}
          </Link>
        ))}
      </nav>
      <Card title={`${current[1]} (${items.length})`}>
        {items.length ? (
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.appt.id}>
                <AppointmentCard item={i} showDate />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Niets in deze lijst.</p>
        )}
      </Card>
    </>
  );
}
