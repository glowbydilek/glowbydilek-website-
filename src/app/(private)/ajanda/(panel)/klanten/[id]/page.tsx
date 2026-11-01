import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AppointmentCard } from "@/components/private/agenda/AppointmentCard";
import { CustomerForm } from "@/components/private/agenda/CustomerForm";
import { Card, LinkButton, Notice, PageHeader } from "@/components/private/ui";
import { customerAppointments } from "@/lib/booking/service";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";

export const metadata = { title: "Klant" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const db = getDb();
  const [c] = await db.select().from(customers).where(eq(customers.id, id));
  if (!c) notFound();
  const appts = await customerAppointments(db, id);
  return (
    <>
      <PageHeader
        title={`${c.firstName} ${c.lastName}`.trim()}
        subtitle={c.consentAt ? "Privacytoestemming gegeven via de website" : "Handmatig toegevoegd"}
        actions={
          c.anonymizedAt ? undefined : (
            <>
              <LinkButton href={`/ajanda/afspraak/nieuw?klant=${c.id}`} variant="primary">＋ Afspraak</LinkButton>
              <a href={`/ajanda/klanten/${c.id}/export`} className="inline-flex min-h-11 items-center rounded-full border border-charcoal/25 px-5 text-sm">Gegevens exporteren</a>
            </>
          )
        }
      />
      <div className="grid [&>*]:min-w-0 gap-5 lg:grid-cols-2">
        <Card title="Gegevens">{c.anonymizedAt ? <Notice>Deze klantgegevens zijn geanonimiseerd.</Notice> : <CustomerForm c={c} />}</Card>
        <Card title={`Afspraken (${appts.length})`}>
          {appts.length ? <ul className="space-y-2">{appts.map((i) => <li key={i.appt.id}><AppointmentCard item={i} showDate /></li>)}</ul> : <p className="text-muted">Nog geen afspraken.</p>}
        </Card>
      </div>
    </>
  );
}
