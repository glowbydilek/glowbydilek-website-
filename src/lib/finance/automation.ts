import "server-only";
import { and, eq } from "drizzle-orm";
import type { DB } from "../db/client";
import { appointments, customers, invoices } from "../db/schema";
import { defaultAftercare, defaultInvoiceAutomation, getSetting, type AftercareSettings, type InvoiceAutomation } from "../db/settings";
import { queueAppointmentEmail } from "../booking/service";
import { createDraft, emailInvoice, getInvoiceSettings, InvoiceError, issueInvoice } from "./invoices";
import { invoiceReadiness } from "./invoice-core";

export type AfterCompletion = { invoice: "none" | "draft" | "issued" | "emailed" | "blocked" | "skipped"; detail?: string; aftercare: boolean };

/**
 * Runs after an appointment is marked completed: optional invoice automation
 * (draft → issue → email, each only when switched on) and the optional
 * aftercare email. Never creates a second invoice for the same appointment
 * and never invents a price: without an agreed price no invoice is made.
 */
export async function afterCompletion(db: DB, appointmentId: number, ctx: { userId?: number | null }): Promise<AfterCompletion> {
  const [auto, care] = await Promise.all([
    getSetting<InvoiceAutomation>(db, "invoice_automation", defaultInvoiceAutomation),
    getSetting<AftercareSettings>(db, "aftercare", defaultAftercare),
  ]);
  const [row] = await db.select().from(appointments).innerJoin(customers, eq(appointments.customerId, customers.id)).where(eq(appointments.id, appointmentId));
  if (!row || row.appointments.status !== "completed") return { invoice: "none", aftercare: false };
  const a = row.appointments;

  let aftercare = false;
  if (care.enabled && row.customers.email) {
    const sendAfter = new Date(Date.now() + Math.min(72, Math.max(0, care.delayHours)) * 3_600_000);
    aftercare = await db.transaction((tx) => queueAppointmentEmail(tx, appointmentId, "aftercare", `aftercare:${appointmentId}`, { sendAfter, kind: "aftercare" }));
  }

  if (!auto.autoDraft || a.invoiceMode === "manual" || a.invoiceMode === "none") return { invoice: "skipped", aftercare };
  const [existing] = await db.select({ id: invoices.id }).from(invoices).where(and(eq(invoices.appointmentId, appointmentId), eq(invoices.kind, "invoice")));
  if (existing) return { invoice: "skipped", detail: "Er bestaat al een factuur voor deze afspraak.", aftercare };
  if (a.priceCents == null) return { invoice: "blocked", detail: "Geen afgesproken prijs: er is geen factuur gemaakt.", aftercare };
  const id = await createDraft(db, { customerId: a.customerId, appointmentId }, ctx);
  if (!auto.autoIssue) return { invoice: "draft", aftercare };
  const missing = invoiceReadiness(await getInvoiceSettings(db));
  if (missing.length) return { invoice: "draft", detail: "Concept gemaakt; uitgeven kan pas als de bedrijfsgegevens compleet zijn.", aftercare };
  try {
    await issueInvoice(db, id, ctx);
  } catch (err) {
    if (err instanceof InvoiceError) return { invoice: "draft", detail: `Concept gemaakt, niet uitgegeven: ${err.message}`, aftercare };
    throw err;
  }
  if (!auto.autoEmail || !row.customers.email) return { invoice: "issued", aftercare };
  await emailInvoice(db, id, ctx);
  return { invoice: "emailed", aftercare };
}
