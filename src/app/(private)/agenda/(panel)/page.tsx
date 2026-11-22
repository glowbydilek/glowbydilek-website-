import Link from "next/link";
import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { dayLabel } from "@/components/private/agenda/format";
import { Card, LinkButton, Notice, PageHeader } from "@/components/private/ui";
import { listPending, listRange } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { outboxCounts } from "@/lib/notifications/outbox";
import { addDays, localToUtc, todayLocal } from "@/lib/time";
import { getPanelLang } from "@/lib/private/panelLangServer";

export const metadata = { title: "Vandaag" };

export default async function Today() {
  const db = getDb();
  const lang = await getPanelLang();
  const tr = lang === "tr";
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
        title={tr ? "Bugün" : "Vandaag"}
        subtitle={dayLabel(localToUtc(today, 720), lang)}
        actions={
          <LinkButton href="/agenda/afspraak/nieuw" variant="primary">
            ＋ {tr ? "Yeni randevu" : "Nieuwe afspraak"}
          </LinkButton>
        }
      />
      <div className="space-y-5">
        {mail.failed > 0 && (
          <Notice tone="error">
            {tr ? `${mail.failed} e-posta gönderilemedi.` : `${mail.failed} e-mail(s) konden niet worden verstuurd.`}{" "}
            <Link href="/agenda/instellingen#emails" className="font-medium underline">
              {tr ? "Gör ve yeniden gönder" : "Bekijk en verstuur opnieuw"}
            </Link>
          </Notice>
        )}
        {pending.length > 0 && (
          <Link href="/agenda/aanvragen" className="flex items-center justify-between rounded-2xl border border-accent/60 bg-[#fbf3e4] px-4 py-3 text-[#5a4320]">
            <span>
              <strong>{pending.length}</strong> {tr ? "talep yanıtını bekliyor" : pending.length === 1 ? "aanvraag wacht op je reactie" : "aanvragen wachten op je reactie"}
            </span>
            <span aria-hidden="true">›</span>
          </Link>
        )}
        <Card title={`${tr ? "Bugünkü randevular" : "Afspraken vandaag"} (${todayItems.length})`}>
          {todayItems.length ? (
            <ul className="space-y-2">
              {todayItems.map((i) => (
                <li key={i.appt.id}>
                  <AppointmentCard item={i} lang={lang} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">{tr ? "Bugün randevu yok." : "Geen afspraken vandaag."}</p>
          )}
        </Card>
        <Card title={`${tr ? "Yarın" : "Morgen"} (${tomorrowItems.length})`} actions={<Link href={`/agenda/kalender?view=day&d=${tomorrow}`} className="text-sm text-accent-deep underline">{tr ? "Günü gör" : "Bekijk dag"}</Link>}>
          {tomorrowItems.length ? (
            <ul className="space-y-2">
              {tomorrowItems.map((i) => (
                <li key={i.appt.id}>
                  <AppointmentCard item={i} lang={lang} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">{tr ? "Yarın için henüz randevu yok." : "Nog geen afspraken voor morgen."}</p>
          )}
        </Card>
      </div>
    </>
  );
}
