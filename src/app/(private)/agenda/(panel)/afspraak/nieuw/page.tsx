import { asc, eq } from "drizzle-orm";
import { NewAppointmentForm } from "@/components/private/agenda/NewAppointmentForm";
import { Card, PageHeader } from "@/components/private/ui";
import { getDb } from "@/lib/db/client";
import { customers, treatments } from "@/lib/db/schema";
import { hhmmToMinutes, isLocalDate, todayLocal } from "@/lib/time";

export const metadata = { title: "Nieuwe afspraak" };

export default async function NewAppointment({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const db = getDb();
  const rows = await db.select().from(treatments).where(eq(treatments.active, true)).orderBy(asc(treatments.sort));
  const customerId = Number(sp.klant);
  const [customer] = customerId ? await db.select().from(customers).where(eq(customers.id, customerId)) : [];
  return (
    <>
      <PageHeader title="Nieuwe afspraak" subtitle="Wordt direct als bevestigde afspraak in je agenda gezet." />
      <Card>
        <NewAppointmentForm
          treatments={rows.map((t) => ({ id: t.id, name: t.nameNl, category: t.category, duration: t.durationMinutes, buffer: t.bufferMinutes, priceCents: t.priceCents }))}
          day={sp.d && isLocalDate(sp.d) ? sp.d : todayLocal()}
          timeValue={sp.t && hhmmToMinutes(sp.t) != null ? sp.t : undefined}
          customer={customer && !customer.anonymizedAt ? { id: customer.id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone, locale: customer.locale } : undefined}
        />
      </Card>
    </>
  );
}
