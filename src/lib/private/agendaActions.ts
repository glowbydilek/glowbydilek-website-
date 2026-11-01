"use server";

import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertOwner } from "../auth/session";
import {
  anonymizeCustomer,
  approve,
  BookingError,
  cancel,
  createManual,
  decline,
  markCompleted,
  markNoShow,
  propose,
  reschedule,
  setArchived,
  updateCustomer,
  updateNotes,
} from "../booking/service";
import { getDb } from "../db/client";
import { audit } from "../db/audit";
import { blocks, dateOverrides, inquiries, overrideIntervals, weeklyHours } from "../db/schema";
import { setSetting, type BookingSettings } from "../db/settings";
import { deliverSoon } from "../notifications/deliver";
import { resend } from "../notifications/outbox";
import { hhmmToMinutes, isLocalDate, localToUtc } from "../time";
import { parseEuroToCents } from "../finance/money";
import { CrmError, mergeCustomers } from "../crm/service";
import type { FormState } from "./authActions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v === "" ? null : Number(v);
};

function fail(err: unknown): FormState {
  if (err instanceof BookingError) return { error: err.message, code: err.code };
  if (err instanceof CrmError) return { error: err.message };
  console.error("[agenda] action failed:", err instanceof Error ? err.message.slice(0, 200) : err);
  return { error: "Er ging iets mis. Probeer het opnieuw." };
}

function dayAndTime(f: FormData): { day: string; minute: number } | null {
  const day = str(f, "day");
  const minute = hhmmToMinutes(str(f, "time"));
  return isLocalDate(day) && minute != null ? { day, minute } : null;
}

function refresh() {
  revalidatePath("/agenda", "layout");
}

// ───────────────────────────────────────────────────────── Appointments

export async function createAppointmentAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const when = dayAndTime(f);
  const treatmentIds = f.getAll("treatments").map(String).filter(Boolean);
  const firstName = str(f, "firstName");
  if (!when) return { error: "Kies een geldige datum en begintijd." };
  if (!firstName) return { error: "Vul de voornaam van de klant in." };
  if (!treatmentIds.length) return { error: "Kies minimaal één behandeling." };
  const email = str(f, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return { error: "Controleer het e-mailadres." };
  const priceRaw = str(f, "price");
  const price = priceRaw ? parseEuroToCents(priceRaw) : undefined;
  if (price === null || (price != null && price < 0)) return { error: "Controleer het bedrag (bijvoorbeeld 45 of 45,50)." };
  let id: number;
  try {
    id = await createManual(
      getDb(),
      {
        customerId: num(f, "customerId") ?? undefined,
        firstName,
        lastName: str(f, "lastName"),
        email: email || null,
        phone: str(f, "phone") || null,
        locale: str(f, "locale") === "en" ? "en" : "nl",
        treatmentIds,
        day: when.day,
        minute: when.minute,
        forceNew: f.get("forceNew") === "on",
        durationMinutes: num(f, "duration") ?? undefined,
        priceCents: price,
        internalNote: str(f, "internalNote"),
        allowOutsideHours: f.get("allowOutsideHours") === "on",
      },
      { userId: s.user.id },
    );
  } catch (err) {
    return fail(err);
  }
  await deliverSoon(getDb());
  refresh();
  redirect(`/agenda/afspraak/${id}?opgeslagen=1`);
}

export async function appointmentAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const db = getDb();
  const id = Number(f.get("id"));
  const op = str(f, "op");
  const ctx = { userId: s.user.id };
  const message = str(f, "message");
  let mail: boolean | null = null;
  try {
    switch (op) {
      case "approve": {
        const when = str(f, "day") ? dayAndTime(f) : null;
        if (str(f, "day") && !when) return { error: "Kies een geldige datum en tijd." };
        await approve(db, id, ctx, { ...(when ?? {}), durationMinutes: num(f, "duration") ?? undefined, message, allowOutsideHours: f.get("allowOutsideHours") === "on" });
        break;
      }
      case "propose": {
        const when = dayAndTime(f);
        if (!when) return { error: "Kies een geldige datum en tijd voor je voorstel." };
        await propose(db, id, ctx, { ...when, durationMinutes: num(f, "duration") ?? undefined, message });
        break;
      }
      case "decline":
        mail = (await decline(db, id, ctx, { message })).notified ?? false;
        break;
      case "reschedule": {
        const when = dayAndTime(f);
        if (!when) return { error: "Kies een geldige datum en tijd." };
        const treatmentIds = f.getAll("treatments").map(String).filter(Boolean);
        const priceRaw = str(f, "price");
        const priceCents = f.has("price") ? (priceRaw ? parseEuroToCents(priceRaw) : null) : undefined;
        if (priceRaw && priceCents === null) return { error: "Controleer het bedrag (bijvoorbeeld 45 of 45,50)." };
        const r = await reschedule(db, id, ctx, {
          ...when,
          durationMinutes: num(f, "duration") ?? undefined,
          treatmentIds: treatmentIds.length ? treatmentIds : undefined,
          priceCents,
          message,
          allowOutsideHours: f.get("allowOutsideHours") === "on",
        });
        mail = r.material ? (r.notified ?? false) : null;
        break;
      }
      case "cancel":
        mail = (await cancel(db, id, ctx, { message })).notified ?? false;
        break;
      case "complete":
        await markCompleted(db, id, ctx);
        break;
      case "noshow":
        await markNoShow(db, id, ctx);
        break;
      case "archive":
        await setArchived(db, id, true, ctx);
        break;
      case "unarchive":
        await setArchived(db, id, false, ctx);
        break;
      case "notes":
        await updateNotes(db, id, str(f, "internalNote"), ctx);
        break;
      default:
        return { error: "Onbekende actie." };
    }
  } catch (err) {
    return fail(err);
  }
  await deliverSoon(db);
  refresh();
  if (op === "notes") return { ok: true, message: "Notitie opgeslagen." };
  // Status changes re-render the page with other actions; show the result at the top.
  // mail=0 → the change was material but the customer has no email address: shown prominently.
  redirect(`/agenda/afspraak/${id}?melding=${op}${mail === false ? "&mail=0" : ""}`);
}

// ─────────────────────────────────────────────────────────── Customers

export async function customerAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = Number(f.get("id"));
  const op = str(f, "op");
  try {
    if (op === "anonymize") {
      await anonymizeCustomer(getDb(), id, { userId: s.user.id });
      refresh();
      return { ok: true, message: "De persoonsgegevens zijn verwijderd. De anonieme afspraakgeschiedenis blijft bewaard." };
    }
    const email = str(f, "email");
    if (email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return { error: "Controleer het e-mailadres." };
    await updateCustomer(
      getDb(),
      id,
      { firstName: str(f, "firstName"), lastName: str(f, "lastName"), email: email || null, phone: str(f, "phone") || null, locale: str(f, "locale") === "en" ? "en" : "nl", notes: str(f, "notes") },
      { userId: s.user.id },
    );
  } catch (err) {
    return fail(err);
  }
  refresh();
  return { ok: true, message: "Klantgegevens opgeslagen." };
}

// ────────────────────────────────────────────────────────── Working hours

export async function saveWeeklyHoursAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const rows: { weekday: number; kind: string; startMinute: number; endMinute: number }[] = [];
  const days = ["", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
  try {
  for (let wd = 1; wd <= 7; wd++) {
    if (f.get(`open-${wd}`) !== "on") continue;
    for (const kind of ["open", "break"] as const) {
      const starts = f.getAll(`${kind}-start-${wd}`).map(String);
      const ends = f.getAll(`${kind}-end-${wd}`).map(String);
      starts.forEach((st, i) => {
        if (!st && !ends[i]) return;
        const a = hhmmToMinutes(st);
        const b = hhmmToMinutes(ends[i] ?? "");
        if (a == null || b == null || b <= a) throw new Error(`invalid:${wd}`);
        rows.push({ weekday: wd, kind, startMinute: a, endMinute: b });
      });
    }
    if (!rows.some((r) => r.weekday === wd && r.kind === "open")) return { error: `Vul voor ${days[wd]} minimaal één tijdvak in, of zet de dag op gesloten.` };
  }
  } catch (err) {
    const wd = Number(String((err as Error).message).split(":")[1]);
    return { error: `Controleer de tijden op ${days[wd] || "een dag"}: de eindtijd moet na de begintijd liggen.` };
  }
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(weeklyHours);
    if (rows.length) await tx.insert(weeklyHours).values(rows);
  });
  await audit(db, { userId: s.user.id, action: "schedule.weekly_saved", details: { intervals: rows.length } });
  refresh();
  // Whether online booking is operational depends on working hours.
  revalidatePath("/afspraak-maken");
  revalidatePath("/en/book-appointment");
  return { ok: true, message: "Werktijden opgeslagen. De beschikbaarheid is direct bijgewerkt." };
}

export async function saveOverrideAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const day = str(f, "day");
  if (!isLocalDate(day)) return { error: "Kies een geldige datum." };
  const mode = str(f, "mode"); // closed | hours | breaks
  const intervals: { kind: string; startMinute: number; endMinute: number }[] = [];
  for (const kind of ["open", "break"] as const) {
    const starts = f.getAll(`${kind}-start`).map(String);
    const ends = f.getAll(`${kind}-end`).map(String);
    for (let i = 0; i < starts.length; i++) {
      if (!starts[i] && !ends[i]) continue;
      const a = hhmmToMinutes(starts[i]);
      const b = hhmmToMinutes(ends[i] ?? "");
      if (a == null || b == null || b <= a) return { error: "Controleer de tijden: de eindtijd moet na de begintijd liggen." };
      intervals.push({ kind, startMinute: a, endMinute: b });
    }
  }
  if (mode === "hours" && !intervals.some((i) => i.kind === "open")) return { error: "Vul minimaal één tijdvak in waarop je open bent." };
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(overrideIntervals).where(eq(overrideIntervals.day, day));
    await tx
      .insert(dateOverrides)
      .values({
        day,
        closed: mode === "closed",
        customHours: mode === "hours",
        capacity: num(f, "capacity"),
        maxAppointments: num(f, "maxAppointments"),
        note: str(f, "note").slice(0, 200) || null,
      })
      .onDuplicateKeyUpdate({
        set: { closed: mode === "closed", customHours: mode === "hours", capacity: num(f, "capacity"), maxAppointments: num(f, "maxAppointments"), note: str(f, "note").slice(0, 200) || null },
      });
    if (intervals.length && mode !== "closed") await tx.insert(overrideIntervals).values(intervals.map((i) => ({ ...i, day })));
  });
  await audit(db, { userId: s.user.id, action: "schedule.override_saved", entityId: day, details: { mode } });
  refresh();
  return { ok: true, message: "Uitzondering opgeslagen." };
}

export async function deleteOverrideAction(f: FormData) {
  const s = await assertOwner();
  const day = str(f, "day");
  if (!isLocalDate(day)) return;
  const db = getDb();
  await db.delete(overrideIntervals).where(eq(overrideIntervals.day, day));
  await db.delete(dateOverrides).where(eq(dateOverrides.day, day));
  await audit(db, { userId: s.user.id, action: "schedule.override_deleted", entityId: day });
  refresh();
}

export async function saveBlockAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const fromDay = str(f, "fromDay");
  const toDay = str(f, "toDay") || fromDay;
  const fromT = hhmmToMinutes(str(f, "fromTime") || "00:00");
  const toT = hhmmToMinutes(str(f, "toTime") || "23:59");
  if (!isLocalDate(fromDay) || !isLocalDate(toDay) || fromT == null || toT == null) return { error: "Controleer de datums en tijden." };
  const start = localToUtc(fromDay, fromT);
  const end = localToUtc(toDay, toT === 23 * 60 + 59 ? 24 * 60 - 1 : toT);
  if (end <= start) return { error: "Het einde moet na het begin liggen." };
  const db = getDb();
  await db.insert(blocks).values({ startAt: start, endAt: str(f, "toTime") ? end : new Date(end.getTime() + 60_000), reason: str(f, "reason").slice(0, 200) });
  await audit(db, { userId: s.user.id, action: "schedule.block_added" });
  refresh();
  return { ok: true, message: "Blokkade toegevoegd. In deze periode kunnen geen afspraken worden aangevraagd." };
}

export async function deleteBlockAction(f: FormData) {
  const s = await assertOwner();
  const db = getDb();
  await db.delete(blocks).where(eq(blocks.id, Number(f.get("id"))));
  await audit(db, { userId: s.user.id, action: "schedule.block_deleted", entityId: Number(f.get("id")) });
  refresh();
}

export async function saveBookingSettingsAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const n = (k: string, min: number, max: number, def: number) => {
    const v = Number(str(f, k));
    return Number.isFinite(v) && str(f, k) !== "" ? Math.min(max, Math.max(min, Math.round(v))) : def;
  };
  const value: BookingSettings = {
    onlineBookingEnabled: f.get("onlineBookingEnabled") === "on",
    capacity: n("capacity", 1, 10, 1),
    maxPerDay: str(f, "maxPerDay") ? n("maxPerDay", 1, 50, 8) : null,
    minNoticeHours: n("minNoticeHours", 0, 24 * 14, 24),
    maxAdvanceDays: n("maxAdvanceDays", 1, 365, 60),
    slotStepMinutes: [5, 10, 15, 20, 30, 60].includes(Number(str(f, "slotStepMinutes"))) ? Number(str(f, "slotStepMinutes")) : 15,
    remindersEnabled: f.get("remindersEnabled") === "on",
    reminderHoursBefore: n("reminderHoursBefore", 2, 72, 24),
  };
  await setSetting(getDb(), "booking", value, s.user.id);
  await setSetting(getDb(), "private", { locationDetails: str(f, "locationDetails").slice(0, 1000), ownerNotifyEmail: str(f, "ownerNotifyEmail").slice(0, 190) }, s.user.id);
  await audit(getDb(), { userId: s.user.id, action: "settings.booking_saved" });
  refresh();
  revalidatePath("/afspraak-maken");
  revalidatePath("/en/book-appointment");
  return { ok: true, message: "Instellingen opgeslagen." };
}

// ─────────────────────────────────────────────────────────── Inbox & mail

export async function inquiryAction(f: FormData) {
  const s = await assertOwner();
  const id = Number(f.get("id"));
  const status = str(f, "status");
  const db = getDb();
  if (status === "delete") {
    await db.delete(inquiries).where(eq(inquiries.id, id));
    await audit(db, { userId: s.user.id, action: "inquiry.deleted", entityId: id });
    refresh();
    redirect("/agenda/berichten");
  }
  if (["new", "read", "replied", "closed"].includes(status)) {
    await db.update(inquiries).set({ status, readAt: status === "new" ? null : new Date() }).where(eq(inquiries.id, id));
  }
  refresh();
}

export async function resendEmailAction(f: FormData) {
  const s = await assertOwner();
  const db = getDb();
  await resend(db, Number(f.get("id")));
  await audit(db, { userId: s.user.id, action: "email.resend", entityId: Number(f.get("id")) });
  await deliverSoon(db);
  refresh();
  revalidatePath("/admin", "layout");
}

export async function bulkInquiryAction(f: FormData) {
  await assertOwner();
  const ids = f.getAll("ids").map(Number).filter(Boolean);
  if (ids.length) await getDb().update(inquiries).set({ status: "closed" }).where(and(inArray(inquiries.id, ids)));
  refresh();
}

export async function mergeCustomersAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const fromId = Number(f.get("fromId"));
  const intoId = Number(f.get("intoId"));
  if (!Number.isInteger(fromId) || !Number.isInteger(intoId)) return { error: "Kies twee klanten." };
  try {
    await mergeCustomers(getDb(), fromId, intoId, { userId: s.user.id });
  } catch (err) {
    return fail(err);
  }
  refresh();
  redirect(`/agenda/klanten/${intoId}?samengevoegd=1`);
}

// ───────────────────────────────────────────── Price proposals ("op aanvraag")

export async function sendQuoteAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await assertOwner();
  const id = Number(str(f, "appointmentId"));
  const amountCents = parseEuroToCents(str(f, "amount"));
  if (amountCents === null || amountCents <= 0) return { error: "Vul een geldig bedrag in (bijv. 65 of 72,50)." };
  const { QuoteError, sendQuote } = await import("../booking/quotes");
  try {
    await sendQuote(getDb(), id, { amountCents, message: str(f, "message"), validDays: Number(str(f, "days") || 7) }, { userId: s.user.id });
  } catch (err) {
    if (err instanceof QuoteError) return { error: err.message };
    return fail(err);
  }
  await audit(getDb(), { userId: s.user.id, action: "quote.sent", entity: "appointment", entityId: String(id), details: { amountCents } });
  await deliverSoon(getDb());
  refresh();
  redirect(`/agenda/afspraak/${id}?melding=offerte`);
}

export async function withdrawQuoteAction(f: FormData) {
  const s = await assertOwner();
  const id = Number(str(f, "appointmentId"));
  const { withdrawQuote } = await import("../booking/quotes");
  await withdrawQuote(getDb(), id, s.user.id);
  refresh();
  redirect(`/agenda/afspraak/${id}?melding=ingetrokken`);
}
