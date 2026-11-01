import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ModerateButtons, ReplyForm, ReviewSettingsForm } from "@/components/private/cms/ReviewForms";
import { Badge, Card, PageHeader } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { reviews } from "@/lib/db/schema";
import { displayName, getReviewSettings } from "@/lib/reviews/service";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Beoordelingen" };

const TABS = [
  ["pending", "Te beoordelen"],
  ["published", "Gepubliceerd"],
  ["rejected", "Afgewezen"],
  ["removed", "Offline gehaald"],
] as const;

export default async function Reviews({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const requested = (await searchParams).s;
  const tab = TABS.some(([k]) => k === requested) ? requested! : "pending";
  const db = getDb();
  const [rows, settings] = await Promise.all([db.select().from(reviews).where(eq(reviews.status, tab)).orderBy(desc(reviews.createdAt)).limit(200), getReviewSettings(db)]);
  return (
    <>
      <PageHeader title="Beoordelingen" subtitle="Elke beoordeling verschijnt pas na jouw controle. Plaats positieve én kritische beoordelingen over echte behandelingen; wijs alleen spam, beledigingen of persoonsgegevens af." />
      <nav aria-label="Status" className="mb-4 flex flex-wrap gap-1 rounded-full bg-white p-1 text-sm shadow-sm">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/beoordelingen?s=${k}`} aria-current={k === tab ? "page" : undefined} className={`rounded-full px-4 py-2 ${k === tab ? "bg-ink text-paper" : "hover:bg-ink/6"}`}>
            {l}
          </Link>
        ))}
      </nav>
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {rows.length ? (
            rows.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg tracking-[0.1em] text-accent" aria-label={`${r.rating} van 5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                  </p>
                  <span className="flex gap-2">
                    {r.verified && <Badge tone="confirmed">Na een behandeling</Badge>}
                    {r.reportCount > 0 && <Badge tone="warning">{r.reportCount}× gemeld</Badge>}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                <p className="mt-2 text-sm text-muted">
                  Getoond als: {displayName(r, "Anonieme klant")} · {r.locale.toUpperCase()} · {formatLocal(r.createdAt, "nl", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {r.moderationNote && <p className="mt-1 text-xs text-muted">Notitie: {r.moderationNote}</p>}
                <div className="mt-4 space-y-3">
                  <ModerateButtons id={r.id} status={r.status} />
                  {r.status === "published" && <ReplyForm id={r.id} reply={r.ownerReply} />}
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-sm text-muted">Niets in deze lijst.</p>
            </Card>
          )}
        </div>
        <div className="space-y-5">
          <Card title="Instellingen">
            <ReviewSettingsForm googleReviewUrl={settings.googleReviewUrl} invitesEnabled={settings.invitesEnabled} />
          </Card>
          <Card title="Regels (Google en eerlijkheid)">
            <ul className="list-disc space-y-2 pl-5 text-sm text-ink-soft">
              <li>Geen nep-, gekochte of beloonde beoordelingen, en geen korting in ruil voor een beoordeling.</li>
              <li>Kritische beoordelingen over een echte behandeling blijven staan; reageer liever vriendelijk.</li>
              <li>Op de website worden geen sterren-‘rich results’ aangevraagd: Google toont die niet voor beoordelingen die een bedrijf over zichzelf plaatst.</li>
              <li>Uitnodigingen gaan alleen na een afgeronde afspraak, één keer, via de knop bij de afspraak.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
