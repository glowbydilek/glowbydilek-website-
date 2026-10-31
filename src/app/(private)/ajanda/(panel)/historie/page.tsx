import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { Card, PageHeader } from "@/components/private/ui";
import { listHistory } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";

export const metadata = { title: "Geschiedenis" };

export default async function History() {
  const items = await listHistory(getDb());
  return (
    <>
      <PageHeader title="Geschiedenis" subtitle="Afgelopen, afgeronde, geannuleerde en afgewezen afspraken (laatste 100)." />
      <Card>{items.length ? <ul className="space-y-2">{items.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate /></li>)}</ul> : <p className="text-muted">Nog geen geschiedenis.</p>}</Card>
    </>
  );
}
