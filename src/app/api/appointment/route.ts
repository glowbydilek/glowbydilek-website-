import type { NextRequest } from "next/server";
import { allTreatments } from "@/content/treatments";
import { handleForm } from "@/lib/forms/handler";
import { validateAppointment, type AppointmentInput } from "@/lib/forms/validation";
import { appointmentCustomerMail, appointmentOwnerMail } from "@/lib/mail/templates";
import { createLegacyRequest } from "@/lib/booking/service";
import { databaseConfigured, getDb } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const treatments = allTreatments();
const ids = treatments.map((t) => t.id);

function names(d: AppointmentInput, locale: "nl" | "en" = d.locale): string[] {
  return d.treatments.map((id) => {
    const t = treatments.find((x) => x.id === id);
    return t ? t.name[locale] : id;
  });
}

/**
 * Appointment REQUEST: emails the owner and acknowledges receipt to the
 * customer. It does not reserve or confirm anything — there is no scheduling
 * system yet (see docs/ARCHITECTURE.md).
 */
export function POST(req: NextRequest) {
  return handleForm(req, {
    kind: "appointment",
    validate: (raw) => validateAppointment(raw, ids),
    // Also appears in Agenda → Aanvragen, where Dilek confirms it at an exact time.
    store: async (d) => {
      if (!databaseConfigured()) return;
      const [firstName, ...rest] = d.name.trim().split(/\s+/);
      await createLegacyRequest(
        getDb(),
        { firstName, lastName: rest.join(" "), email: d.email, phone: d.phone ?? null, locale: d.locale, treatmentIds: d.treatments, preferredDate: d.preferredDate, timeRange: d.timeRange, alternative: d.alternative, note: d.notes },
        {},
      );
    },
    signature: (d) => [[...d.treatments].sort().join(","), d.preferredDate, d.timeRange, d.notes ?? ""].join("|"),
    ownerMail: (d) => appointmentOwnerMail(d, names(d, "nl")),
    customerMail: (d) => appointmentCustomerMail(d, names(d)),
  });
}
