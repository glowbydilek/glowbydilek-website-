import type { NextRequest } from "next/server";
import { getCatalogue, publicItems } from "@/lib/catalogue";
import { ensureContent } from "@/lib/cms/store";
import { handleForm } from "@/lib/forms/handler";
import { amsterdamToday, validateAppointment, type AppointmentInput } from "@/lib/forms/validation";
import { isClosedDay, requestCalendar } from "@/lib/booking/public";
import { appointmentCustomerMail, appointmentOwnerMail } from "@/lib/mail/templates";
import { createLegacyRequest } from "@/lib/booking/service";
import { databaseConfigured, getDb } from "@/lib/db/client";
import { applyPromotion, checkCode } from "@/lib/promotions/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function names(d: AppointmentInput, locale: "nl" | "en" = d.locale): string[] {
  const items = getCatalogue().items;
  return d.treatments.map((id) => items.find((x) => x.id === id)?.name[locale] ?? id);
}

/**
 * Appointment REQUEST: emails the owner and acknowledges receipt to the
 * customer. It does not reserve or confirm anything — there is no scheduling
 * system yet (see docs/ARCHITECTURE.md).
 */
export async function POST(req: NextRequest) {
  await ensureContent();
  // Only published treatments and packages can be requested.
  const ids = publicItems().map((t) => t.id);
  return handleForm(req, {
    kind: "appointment",
    validate: async (raw) => {
      const v = validateAppointment(raw, ids);
      // An unknown or expired code is reported on the field; nothing is stored.
      // A closed weekday or closed date is refused (the calendar already disables them).
      if (v.ok && databaseConfigured() && isClosedDay(await requestCalendar(getDb(), amsterdamToday()), v.data.preferredDate)) return { ok: false as const, errors: { preferredDate: "closedDay" as const } };
      if (v.ok && v.data.promoCode && databaseConfigured() && (await checkCode(getDb(), v.data.promoCode))) return { ok: false as const, errors: { promoCode: "invalid" as const } };
      return v;
    },
    // Also appears in Agenda → Aanvragen, where Dilek confirms it at an exact time.
    store: async (d) => {
      if (!databaseConfigured()) return;
      const [firstName, ...rest] = d.name.trim().split(/\s+/);
      const id = await createLegacyRequest(
        getDb(),
        { firstName, lastName: rest.join(" "), email: d.email, phone: d.phone ?? null, locale: d.locale, treatmentIds: d.treatments, preferredDate: d.preferredDate, timeRange: d.timeRange, alternative: d.alternative, note: d.notes },
        {},
      );
      // Automatic promotions, or the one matching the code (only for treatments with a fixed price).
      await applyPromotion(getDb(), id, d.promoCode ?? null).catch((err) => console.error("[appointment] promotion not applied:", err instanceof Error ? err.message.slice(0, 120) : err));
    },
    signature: (d) => [[...d.treatments].sort().join(","), d.preferredDate, d.timeRange, d.notes ?? ""].join("|"),
    ownerMail: (d) => appointmentOwnerMail(d, names(d, "nl")),
    customerMail: (d) => appointmentCustomerMail(d, names(d)),
  });
}
