import Link from "next/link";
import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { dayLabel } from "@/components/private/agenda/format";
import { Card, LinkButton, Notice, PageHeader } from "@/components/private/ui";
import { listPending, listRange } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { outboxCounts } from "@/lib/notifications/outbox";
import { addDays, localToUtc, todayLocal } from "@/lib/time";

export const metadata = { title: "Vandaag" };

export default async function Today() {
  const db = getDb();
  const today = todayLocal();
  const tomorrow = addDays(today, 1);
  const [todayItems, tomorrowItems, pending, mail] = await Promise.all([
    listRange(db, today, today, ["confirmed", "proposed", "completed", "no_show"]),
    listRange(db, tomorrow, tomorrow, ["confirmed", "proposed"]),
    listPending(db),
    outboxCounts(db),
  ]);
  return (
    <>
      <PageHeader
        title="Vandaag"
        subtitle={dayLabel(localToUtc(today, 720))}
        actions={
          <LinkButton href="/ajanda/afspraak/nieuw" variant="primary">
            ＋ Nieuwe afspraak
          </LinkButton>
        }
      />
      <div className="space-y-5">
        {mail.failed > 0 && (
          <Notice tone="error">
            {mail.failed} e-mail(s) konden niet worden verstuurd.{" "}
            <Link href="/ajanda/instellingen#emails" className="font-medium underline">
              Bekijk en verstuur opnieuw
            </Link>
          </Notice>
        )}
        {pending.length > 0 && (
          <Link href="/ajanda/aanvragen" className="flex items-center justify-between rounded-2xl border border-gold/60 bg-[#fbf3e4] px-4 py-3 text-[#5a4320]">
            <span>
              <strong>{pending.length}</strong> {pending.length === 1 ? "aanvraag wacht" : "aanvragen wachten"} op je reactie
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        )}
        <Card title={`Afspraken vandaag (${todayItems.length})`}>
          {todayItems.length ? (
            <ul className="space-y-2">
              {todayItems.map((i) => (
                <li key={i.appt.id}>
                  <AppointmentCard item={i} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Geen afspraken vandaag.</p>
          )}
        </Card>
        <Card title={`Morgen (${tomorrowItems.length})`} actions={<Link href={`/ajanda/agenda?view=day&d=${tomorrow}`} className="text-sm text-gold-deep underline">Bekijk dag</Link>}>
          {tomorrowItems.length ? (
            <ul className="space-y-2">
              {tomorrowItems.map((i) => (
                <li key={i.appt.id}>
                  <AppointmentCard item={i} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Nog geen afspraken voor morgen.</p>
          )}
        </Card>
      </div>
    </>
  );
}
