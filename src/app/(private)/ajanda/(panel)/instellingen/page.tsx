import { and, desc, eq, inArray } from "drizzle-orm";
import { SettingsForm } from "@/components/private/agenda/SettingsForm";
import { Card, PageHeader, SubmitButton } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { outbox, treatments } from "@/lib/db/schema";
import { defaultBookingSettings, defaultPrivateSettings, getSetting } from "@/lib/db/settings";
import { mailConfigured } from "@/lib/mail/send";
import { lastCronRun } from "@/lib/notifications/deliver";
import { resendEmailAction } from "@/lib/private/agendaActions";
import { formatLocal } from "@/lib/time";

export const metadata = { title: "Instellingen" };

export default async function Settings() {
  const db = getDb();
  const [b, p, bookable, problems, cron] = await Promise.all([
    getSetting(db, "booking", defaultBookingSettings),
    getSetting(db, "private", defaultPrivateSettings),
    db.select({ id: treatments.id }).from(treatments).where(and(eq(treatments.bookableOnline, true), eq(treatments.active, true))),
    db.select().from(outbox).where(inArray(outbox.status, ["failed", "pending"])).orderBy(desc(outbox.createdAt)).limit(50),
    lastCronRun(db),
  ]);
  const failed = problems.filter((m) => m.status === "failed" || (m.status === "pending" && m.attempts > 0));
  return (
    <>
      <PageHeader title="Instellingen" subtitle="Boekingsregels, herinneringen en e-mailstatus." />
      <div className="space-y-5">
        <Card title="Boekingsregels">
          <SettingsForm b={b} p={p} bookableCount={bookable.length} />
        </Card>
        <Card title="E-mails" >
          <div id="emails" className="space-y-2 text-sm">
            <p>SMTP: {mailConfigured() ? "ingesteld" : <strong className="text-[#8e2f24]">niet ingesteld — e-mails blijven in de wachtrij</strong>}</p>
            <p>Laatste automatische verwerking: {cron ? `${formatLocal(cron.startedAt, "nl", { dateStyle: "medium", timeStyle: "short" })}${cron.error ? ` (${cron.error})` : ` · ${cron.sent} verstuurd`}` : <strong>nog nooit — stel de cron-taak in (zie handleiding)</strong>}</p>
            <p>Geplande herinneringen en wachtende berichten: {problems.filter((m) => m.status === "pending").length}</p>
          </div>
          {failed.length > 0 && (
            <ul className="mt-4 divide-y divide-line border-t border-line text-sm">
              {failed.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="block truncate">{m.subject}</span>
                    <span className="text-xs text-muted">{m.status === "failed" ? "Mislukt" : "Opnieuw proberen gepland"} na {m.attempts} poging(en){m.lastError ? ` · ${m.lastError}` : ""}</span>
                  </span>
                  <form action={resendEmailAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <SubmitButton variant="outline">Opnieuw versturen</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
