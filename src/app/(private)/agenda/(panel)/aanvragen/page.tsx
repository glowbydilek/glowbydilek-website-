import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { Card, PageHeader } from "@/components/private/ui";
import { listPending } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { getPanelLang } from "@/lib/private/panelLangServer";

export const metadata = { title: "Aanvragen" };

export default async function Requests() {
  const items = await listPending(getDb());
  const lang = await getPanelLang();
  const tr = lang === "tr";
  const req = items.filter((i) => i.appt.status === "requested");
  const prop = items.filter((i) => i.appt.status === "proposed");
  return (
    <>
      <PageHeader title={tr ? "Talepler" : "Aanvragen"} subtitle={tr ? "Henüz onaylanmadı. Onaylamak, başka bir saat önermek veya reddetmek için bir talebi aç." : "Nog niet bevestigd. Open een aanvraag om te bevestigen, een ander tijdstip voor te stellen of af te wijzen."} />
      <div className="space-y-5">
        <Card title={`${tr ? "Yeni talepler" : "Nieuwe aanvragen"} (${req.length})`}>
          {req.length ? <ul className="space-y-2">{req.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate lang={lang} /></li>)}</ul> : <p className="text-muted">{tr ? "Bekleyen talep yok." : "Geen openstaande aanvragen."}</p>}
        </Card>
        <Card title={`${tr ? "Öneri gönderildi, müşteri bekleniyor" : "Voorstel verstuurd, wacht op klant"} (${prop.length})`}>
          {prop.length ? <ul className="space-y-2">{prop.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate lang={lang} /></li>)}</ul> : <p className="text-muted">—</p>}
        </Card>
      </div>
    </>
  );
}
