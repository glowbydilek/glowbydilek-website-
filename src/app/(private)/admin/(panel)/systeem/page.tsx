import { desc } from "drizzle-orm";
import { Card, PageHeader } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Systeem & logboek" };

export default async function SystemPage() {
  const log = await getDb().select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(150);
  return (
    <>
      <PageHeader title="Systeem & logboek" subtitle="Wie heeft wat gewijzigd, en een back-up van je gegevens." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Back-up">
          <p className="text-sm text-muted">Download een kopie van je inhoud, instellingen, behandelingen, klanten en afspraken (JSON, zonder wachtwoorden of sleutels). Bewaar dit bestand veilig: het bevat persoonsgegevens.</p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page */}
          <a href="/admin/systeem/backup" download className="mt-4 inline-flex min-h-11 items-center rounded-full bg-charcoal px-5 text-sm text-ivory">Back-up downloaden</a>
          <p className="mt-4 text-xs text-muted">De volledige database-back-up (inclusief afbeeldingen) maak je in Hostinger → Databases → phpMyAdmin → Exporteren, of via de automatische back-ups van Hostinger. Zie docs/DEPLOYMENT.md.</p>
        </Card>
        <Card title="Logboek (laatste 150)">
          <ul className="max-h-[32rem] space-y-1 overflow-y-auto text-sm">
            {log.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 border-b border-stone/60 py-1">
                <span className="min-w-0 truncate">{l.action}{l.entityId ? ` #${l.entityId}` : ""}</span>
                <span className="shrink-0 text-xs text-muted">{formatLocal(l.createdAt, "nl", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
