import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { Card, PageHeader } from "@/components/private/ui";
import { listPending } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Aanvragen" };

export default async function Requests() {
  const items = await listPending(getDb());
  const req = items.filter((i) => i.appt.status === "requested");
  const prop = items.filter((i) => i.appt.status === "proposed");
  return (
    <>
      <PageHeader title="Aanvragen" subtitle="Nog niet bevestigd. Open een aanvraag om te bevestigen, een ander tijdstip voor te stellen of af te wijzen." />
      <div className="space-y-5">
        <Card title={`Nieuwe aanvragen (${req.length})`}>
          {req.length ? <ul className="space-y-2">{req.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate /></li>)}</ul> : <p className="text-muted">Geen openstaande aanvragen.</p>}
        </Card>
        <Card title={`Voorstel verstuurd, wacht op klant (${prop.length})`}>
          {prop.length ? <ul className="space-y-2">{prop.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate /></li>)}</ul> : <p className="text-muted">—</p>}
        </Card>
      </div>
    </>
  );
}
