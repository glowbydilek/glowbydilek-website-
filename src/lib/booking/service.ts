/**
 * Booking service: every change to an appointment runs in ONE database
 * transaction that (1) locks the local day (schedule_locks row, SELECT …
 * FOR UPDATE), (2) re-checks capacity against confirmed/proposed
 * appointments and blocks, (3) writes the appointment, its history event
 * and the outbox emails. Concurrent requests for the same day are
 * serialised, so capacity can never be exceeded.
 *
 * Pending requests do NOT block availability; approval does the atomic
 * check. If the requested time is gone, the owner proposes another time.
 */
import { and, asc, desc, eq, gt, gte, inArray, isNull, like, lt, or, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import {
  appointmentEvents,
  appointments,
  appointmentTreatments,
  blocks,
  consultations,
  customers,
  dateOverrides,
  overrideIntervals,
  treatments,
  weeklyHours,
} from "../db/schema";
import { getSetting, defaultBookingSettings, defaultPrivateSettings, type BookingSettings, type PrivateBusinessSettings } from "../db/settings";
import { cancelPending, enqueue } from "../notifications/outbox";
import { DEFAULT_TEMPLATES, paragraphsToHtml, renderTemplate, type TemplateKey, type TLocale } from "../notifications/templates";
import { notificationTemplates } from "../db/schema";
import { addDays, dayBoundsUtc, formatLongDate, formatTime, localToUtc, toLocalParts, type LocalDate } from "../time";
import { normalizeEmail, normalizeName, normalizePhone } from "../crm/normalize";
import { availableSlots, dayPlan, peakLoad, type Busy, type BookingRules, type Override, type WeeklyRule } from "./engine";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Appointment = typeof appointments.$inferSelect;
export type Customer = typeof customers.$inferSelect;

export const OCCUPYING = ["confirmed", "proposed"] as const;
export const OPEN_STATUSES = ["requested", "proposed", "confirmed"] as const;

export type BookingErrorCode = "conflict" | "notFound" | "invalidState" | "invalidInput" | "outsideHours" | "noDuration" | "customerMatch";

export class BookingError extends Error {
  code: BookingErrorCode;
  constructor(code: BookingErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "BookingError";
  }
}

/**
 * Booking transactions use READ COMMITTED: the per-day lock serialises
 * writers, and every capacity check must see bookings committed by the
 * transaction that held the lock before us. (Under the default REPEATABLE
 * READ a snapshot taken before acquiring the lock would hide them — a
 * double-booking bug caught by tests/booking.test.ts.)
 */
async function bookingTx<T>(db: DB, fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.transaction(fn, { isolationLevel: "read committed" });
    } catch (err) {
      // 1213 deadlock / 1205 lock wait timeout: safe to retry the whole transaction.
      const errno = (err as { errno?: number; cause?: { errno?: number } })?.cause?.errno ?? (err as { errno?: number })?.errno;
      if ((errno === 1213 || errno === 1205) && attempt < 4) {
        await new Promise((r) => setTimeout(r, 25 * attempt + Math.random() * 25));
        continue;
      }
      throw err;
    }
  }
}

// ──────────────────────────────────────────────────────────── Rules & data

export async function loadRules(db: DB | Tx): Promise<{ rules: BookingRules; settings: BookingSettings; weekly: WeeklyRule[] }> {
  const settings = await getSetting(db as DB, "booking", defaultBookingSettings);
  const weekly = (await db.select().from(weeklyHours)).map((w) => ({
    weekday: w.weekday,
    kind: w.kind as "open" | "break",
    start: w.startMinute,
    end: w.endMinute,
  }));
  return {
    settings,
    weekly,
    rules: {
      capacity: Math.max(1, settings.capacity),
      maxPerDay: settings.maxPerDay,
      minNoticeMinutes: Math.max(0, settings.minNoticeHours * 60),
      maxAdvanceDays: Math.max(1, settings.maxAdvanceDays),
      slotStepMinutes: settings.slotStepMinutes,
    },
  };
}

export async function loadOverrides(db: DB | Tx, from: LocalDate, to: LocalDate): Promise<Override[]> {
  const ovs = await db.select().from(dateOverrides).where(and(gte(dateOverrides.day, from), sql`${dateOverrides.day} <= ${to}`));
  if (!ovs.length) return [];
  const ints = await db.select().from(overrideIntervals).where(inArray(overrideIntervals.day, ovs.map((o) => o.day)));
  return ovs.map((o) => ({
    day: o.day,
    closed: o.closed,
    customHours: o.customHours,
    capacity: o.capacity,
    maxAppointments: o.maxAppointments,
    note: o.note,
    intervals: ints.filter((i) => i.day === o.day).map((i) => ({ kind: i.kind as "open" | "break", start: i.startMinute, end: i.endMinute })),
  }));
}

/** Occupancy (confirmed/proposed appointments incl. buffer, and blocks) in a UTC range. */
export async function loadBusy(db: DB | Tx, from: Date, to: Date, excludeId?: number): Promise<Busy[]> {
  const appts = await db
    .select({ id: appointments.id, startAt: appointments.startAt, blockedUntil: appointments.blockedUntil })
    .from(appointments)
    .where(
      and(
        inArray(appointments.status, [...OCCUPYING]),
        lt(appointments.startAt, to),
        gt(appointments.blockedUntil, from),
        excludeId ? sql`${appointments.id} <> ${excludeId}` : undefined,
      ),
    );
  const bl = await db.select().from(blocks).where(and(lt(blocks.startAt, to), gt(blocks.endAt, from)));
  return [
    ...appts.filter((a) => a.startAt && a.blockedUntil).map((a) => ({ start: a.startAt!, end: a.blockedUntil!, kind: "appointment" as const })),
    ...bl.map((b) => ({ start: b.startAt, end: b.endAt, kind: "block" as const })),
  ];
}

export type TreatmentRow = typeof treatments.$inferSelect;

export async function loadTreatments(db: DB | Tx, ids: string[]): Promise<TreatmentRow[]> {
  if (!ids.length) return [];
  const rows = await db.select().from(treatments).where(inArray(treatments.id, ids));
  return ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is TreatmentRow => Boolean(r));
}

export function totalDuration(rows: TreatmentRow[]): { duration: number | null; buffer: number } {
  if (!rows.length || rows.some((r) => !r.durationMinutes)) return { duration: null, buffer: Math.max(0, ...rows.map((r) => r.bufferMinutes)) };
  return { duration: rows.reduce((s, r) => s + (r.durationMinutes ?? 0), 0), buffer: Math.max(0, ...rows.map((r) => r.bufferMinutes)) };
}

/** Public availability for the chosen treatments (no customer data). */
export async function getAvailability(
  db: DB,
  treatmentIds: string[],
  from: LocalDate,
  to: LocalDate,
  now = new Date(),
): Promise<{ duration: number | null; slots: Record<LocalDate, number[]> }> {
  const rows = await loadTreatments(db, treatmentIds);
  if (rows.length !== treatmentIds.length || rows.some((r) => !r.active || !r.bookableOnline)) return { duration: null, slots: {} };
  const { duration, buffer } = totalDuration(rows);
  if (!duration) return { duration: null, slots: {} };
  const { rules, weekly } = await loadRules(db);
  const overrides = await loadOverrides(db, from, to);
  const busy = await loadBusy(db, dayBoundsUtc(from).start, dayBoundsUtc(to).end);
  const countsPerDay = await countsByDay(db, from, to);
  return { duration, slots: availableSlots({ from, to, durationMinutes: duration, bufferMinutes: buffer, weekly, overrides, busy, countsPerDay, rules, now }) };
}

async function countsByDay(db: DB | Tx, from: LocalDate, to: LocalDate): Promise<Record<LocalDate, number>> {
  const rows = await db
    .select({ startAt: appointments.startAt })
    .from(appointments)
    .where(and(inArray(appointments.status, [...OCCUPYING]), gte(appointments.startAt, dayBoundsUtc(from).start), lt(appointments.startAt, dayBoundsUtc(to).end)));
  const out: Record<LocalDate, number> = {};
  for (const r of rows) if (r.startAt) out[toLocalParts(r.startAt).date] = (out[toLocalParts(r.startAt).date] ?? 0) + 1;
  return out;
}

// ─────────────────────────────────────────────────────── Atomic slot check

/** Locks the local day and verifies capacity. Throws BookingError("conflict"). */
async function lockAndCheck(tx: Tx, start: Date, blockedUntil: Date, opts: { excludeId?: number; enforceHours: boolean; durationMinutes: number }) {
  const day = toLocalParts(start).date;
  // Takes an exclusive row lock directly (no shared→exclusive upgrade, which
  // would deadlock concurrent first bookings of a new day).
  await tx.execute(sql`INSERT INTO schedule_locks (day) VALUES (${day}) ON DUPLICATE KEY UPDATE day = day`);
  const { rules, weekly } = await loadRules(tx);
  const [override] = await loadOverrides(tx, day, day);
  const plan = dayPlan(day, weekly, override, rules);
  const capacity = Math.max(1, override?.capacity ?? rules.capacity);
  if (opts.enforceHours) {
    const startMin = toLocalParts(start).minutes;
    const fits = plan.open.some((seg) => startMin >= seg.start && startMin + opts.durationMinutes <= seg.end);
    if (!fits) throw new BookingError("outsideHours", "Dit tijdstip valt buiten de werktijden.");
  }
  const busy = await loadBusy(tx, start, blockedUntil, opts.excludeId);
  if (peakLoad(start, blockedUntil, busy, capacity) >= capacity) {
    throw new BookingError("conflict", "Dit tijdstip is niet (meer) beschikbaar: er staat al een afspraak of blokkade.");
  }
  if (plan.maxPerDay != null) {
    const { start: ds, end: de } = dayBoundsUtc(day);
    const [{ n }] = (await tx
      .select({ n: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          inArray(appointments.status, [...OCCUPYING]),
          gte(appointments.startAt, ds),
          lt(appointments.startAt, de),
          opts.excludeId ? sql`${appointments.id} <> ${opts.excludeId}` : undefined,
        ),
      )) as { n: number }[];
    if (Number(n) >= plan.maxPerDay && opts.enforceHours) throw new BookingError("conflict", "Het maximum aantal afspraken voor deze dag is bereikt.");
  }
}

// ───────────────────────────────────────────────────────────── Emails

export async function loadTemplate(db: DB | Tx, key: TemplateKey, locale: TLocale) {
  const [row] = await db
    .select()
    .from(notificationTemplates)
    .where(and(eq(notificationTemplates.key, key), eq(notificationTemplates.locale, locale)))
    .limit(1);
  return row ? { subject: row.subject, body: row.body } : DEFAULT_TEMPLATES[key][locale];
}

type ApptView = { appt: Appointment; customer: Customer; items: (typeof appointmentTreatments.$inferSelect)[] };

async function emailVars(tx: Tx, v: ApptView, message?: string, withLocation = false) {
  const locale = (v.appt.locale === "en" ? "en" : "nl") as TLocale;
  const priv = await getSetting(tx as unknown as DB, "private", defaultPrivateSettings);
  const names = v.items.map((i) => (locale === "en" ? i.nameEn : i.nameNl)).join(", ");
  const start = v.appt.startAt;
  const request = start
    ? `${locale === "en" ? "Requested" : "Aangevraagd"}: ${names} — ${formatLongDate(start, locale)} ${formatTime(start, locale)}`
    : `${locale === "en" ? "Requested" : "Aangevraagd"}: ${names}${v.appt.requestedDate ? ` — ${formatLongDate(localToUtc(v.appt.requestedDate, 720), locale)}` : ""}`;
  return {
    firstName: v.customer.firstName,
    treatments: names,
    date: start ? formatLongDate(start, locale) : "",
    time: start ? formatTime(start, locale) : "",
    endTime: v.appt.endAt ? formatTime(v.appt.endAt, locale) : "",
    request,
    location: withLocation && priv.locationDetails.trim() ? priv.locationDetails.trim() : "",
    message: message?.trim() ?? "",
  };
}

async function queueCustomerEmail(tx: Tx, v: ApptView, key: TemplateKey, dedupe: string, opts: { message?: string; sendAfter?: Date; kind?: string } = {}) {
  if (!v.customer.email) return false;
  const locale = (v.appt.locale === "en" ? "en" : "nl") as TLocale;
  const tpl = await loadTemplate(tx, key, locale);
  const withLocation = key === "confirmed" || key === "rescheduled" || key === "reminder";
  const r = renderTemplate(tpl, await emailVars(tx, v, opts.message, withLocation));
  return enqueue(tx, {
    dedupeKey: dedupe,
    kind: opts.kind ?? key,
    appointmentId: v.appt.id,
    to: v.customer.email,
    replyTo: process.env.MAIL_TO || process.env.SMTP_USER || null,
    subject: r.subject,
    text: r.text,
    html: paragraphsToHtml(r.paragraphs),
    sendAfter: opts.sendAfter,
  });
}

async function queueOwnerNotice(tx: Tx, v: ApptView, ownerEmail: string) {
  if (!ownerEmail) return;
  const when = v.appt.startAt
    ? `${formatLongDate(v.appt.startAt, "nl")} om ${formatTime(v.appt.startAt, "nl")}`
    : `voorkeur ${v.appt.requestedDate ?? "—"} (${v.appt.requestedTimeRange ?? "—"})${v.appt.requestedAlternative ? `, ook: ${v.appt.requestedAlternative}` : ""}`;
  const lines = [
    "Er is een nieuwe afspraakaanvraag binnengekomen. Deze is nog NIET bevestigd.",
    `Klant: ${v.customer.firstName} ${v.customer.lastName}`.trim(),
    `E-mail: ${v.customer.email ?? "—"}`,
    `Telefoon: ${v.customer.phone ?? "—"}`,
    `Behandeling: ${v.items.map((i) => i.nameNl).join(", ")}`,
    `Moment: ${when}`,
    v.appt.customerNote ? `Opmerking: ${v.appt.customerNote}` : "",
    "Bekijk en beantwoord de aanvraag in Agenda: " + `${(process.env.NEXT_PUBLIC_SITE_URL || "https://glowbydilek.nl").replace(/\/+$/, "")}/agenda/afspraak/${v.appt.id}`,
  ].filter(Boolean);
  await enqueue(tx, {
    dedupeKey: `owner_request:${v.appt.id}`,
    kind: "owner_request",
    appointmentId: v.appt.id,
    to: ownerEmail,
    replyTo: v.customer.email ?? null,
    subject: `Nieuwe aanvraag — ${v.customer.firstName} ${v.customer.lastName} — ${when}`.slice(0, 240),
    text: lines.join("\n\n"),
    html: paragraphsToHtml(lines),
  });
}

async function scheduleReminder(tx: Tx, v: ApptView) {
  const { settings } = await loadRules(tx);
  await cancelPending(tx, v.appt.id, ["reminder"]);
  if (!settings.remindersEnabled || !v.appt.startAt || v.appt.status !== "confirmed") return;
  const sendAt = new Date(v.appt.startAt.getTime() - settings.reminderHoursBefore * 3600_000);
  // Too late for a meaningful reminder (less than 12 hours before): skip.
  if (v.appt.startAt.getTime() - Date.now() < 12 * 3600_000) return;
  await queueCustomerEmail(tx, v, "reminder", `reminder:${v.appt.id}:${v.appt.startAt.toISOString()}`, { sendAfter: sendAt, kind: "reminder" });
}

async function view(tx: Tx | DB, id: number): Promise<ApptView> {
  const [row] = await tx.select().from(appointments).innerJoin(customers, eq(appointments.customerId, customers.id)).where(eq(appointments.id, id)).limit(1);
  if (!row) throw new BookingError("notFound", "Afspraak niet gevonden.");
  const items = await tx.select().from(appointmentTreatments).where(eq(appointmentTreatments.appointmentId, id));
  return { appt: row.appointments, customer: row.customers, items };
}

export const getAppointment = (db: DB, id: number) => view(db, id);

async function event(tx: Tx, appointmentId: number, type: string, from: string | null, to: string | null, userId: number | null, data?: Record<string, unknown>) {
  await tx.insert(appointmentEvents).values({ appointmentId, type, fromStatus: from, toStatus: to, userId, data: data ?? null });
}

// ───────────────────────────────────────────────────────────── Customers

export type CustomerInput = { firstName: string; lastName: string; email?: string | null; phone?: string | null; locale?: TLocale };

/**
 * Public requests: attach to an existing profile only when the normalised
 * email matches AND the surname or phone matches too; otherwise a new
 * profile is created (the owner can merge it later). A public form never
 * overwrites what is stored; it only fills empty fields.
 */
async function findOrCreatePublicCustomer(tx: Tx, c: CustomerInput): Promise<number> {
  const emailNorm = normalizeEmail(c.email);
  const phoneNorm = normalizePhone(c.phone);
  if (emailNorm) {
    const candidates = await tx
      .select()
      .from(customers)
      .where(and(eq(customers.emailNorm, emailNorm), isNull(customers.anonymizedAt), isNull(customers.mergedIntoId)))
      .limit(5);
    const existing = candidates.find(
      (x) => (normalizeName(x.lastName) && normalizeName(x.lastName) === normalizeName(c.lastName)) || (phoneNorm && x.phoneNorm === phoneNorm),
    );
    if (existing) {
      await tx
        .update(customers)
        .set({
          lastName: existing.lastName || c.lastName,
          phone: existing.phone ?? (c.phone?.trim() || null),
          phoneNorm: existing.phoneNorm ?? phoneNorm,
          consentAt: new Date(),
          privacyVersion: "2026-11",
        })
        .where(eq(customers.id, existing.id));
      return existing.id;
    }
  }
  return insertCustomer(tx, c, true);
}

async function insertCustomer(tx: Tx, c: CustomerInput, consent: boolean): Promise<number> {
  const [res] = (await tx.insert(customers).values({
    firstName: c.firstName.slice(0, 80),
    lastName: (c.lastName ?? "").slice(0, 80),
    email: c.email?.trim().toLowerCase() || null,
    emailNorm: normalizeEmail(c.email),
    phone: c.phone?.trim() || null,
    phoneNorm: normalizePhone(c.phone),
    locale: c.locale ?? "nl",
    consentAt: consent ? new Date() : null,
    privacyVersion: consent ? "2026-11" : null,
  })) as unknown as [{ insertId: number }];
  return res.insertId;
}

/**
 * Owner-entered appointment: uses the chosen profile, or creates a new one
 * only when no profile with the same email/phone exists (or the owner
 * explicitly chose "new customer"). Ambiguous identities are never merged.
 */
async function resolveManualCustomer(tx: Tx, c: CustomerInput & { customerId?: number; forceNew?: boolean }): Promise<number> {
  if (c.customerId) {
    const [existing] = await tx.select().from(customers).where(eq(customers.id, c.customerId)).limit(1);
    if (!existing || existing.anonymizedAt) throw new BookingError("notFound", "Klant niet gevonden.");
    if (existing.mergedIntoId) return existing.mergedIntoId;
    return existing.id;
  }
  if (!c.forceNew) {
    const emailNorm = normalizeEmail(c.email);
    const phoneNorm = normalizePhone(c.phone);
    const conds = [emailNorm ? eq(customers.emailNorm, emailNorm) : undefined, phoneNorm ? eq(customers.phoneNorm, phoneNorm) : undefined].filter(Boolean);
    if (conds.length) {
      const hits = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(and(isNull(customers.anonymizedAt), isNull(customers.mergedIntoId), or(...conds)))
        .limit(1);
      if (hits.length)
        throw new BookingError("customerMatch", "Er bestaat al een klant met dit e-mailadres of telefoonnummer. Kies het bestaande profiel of bevestig dat het een nieuwe klant is.");
    }
  }
  return insertCustomer(tx, c, false);
}

/** Sum of item list prices, or null when any treatment has no confirmed price. */
function snapshotPrice(rows: TreatmentRow[]): number | null {
  if (!rows.length || rows.some((r) => r.priceCents == null)) return null;
  return rows.reduce((sum, r) => sum + (r.priceCents ?? 0), 0);
}

async function writeItems(tx: Tx, appointmentId: number, rows: TreatmentRow[]) {
  await tx.delete(appointmentTreatments).where(eq(appointmentTreatments.appointmentId, appointmentId));
  if (rows.length)
    await tx.insert(appointmentTreatments).values(
      rows.map((r) => ({ appointmentId, treatmentId: r.id, nameNl: r.nameNl, nameEn: r.nameEn, durationMinutes: r.durationMinutes, priceCents: r.priceCents })),
    );
}

// ──────────────────────────────────────────────────────────── Operations

export type Ctx = { userId?: number | null; ownerEmail?: string; now?: Date };

/** Public request for an exact time (availability-aware journey). */
export async function createTimedRequest(
  db: DB,
  input: CustomerInput & { treatmentIds: string[]; day: LocalDate; minute: number; note?: string; consent: true },
  ctx: Ctx,
): Promise<number> {
  const now = ctx.now ?? new Date();
  const rows = await loadTreatments(db, input.treatmentIds);
  if (rows.length !== input.treatmentIds.length || rows.some((r) => !r.active || !r.bookableOnline)) throw new BookingError("invalidInput", "Onbekende behandeling.");
  const { duration, buffer } = totalDuration(rows);
  if (!duration) throw new BookingError("noDuration", "Voor deze behandeling is nog geen duur ingesteld.");
  const avail = await getAvailability(db, input.treatmentIds, input.day, input.day, now);
  if (!(avail.slots[input.day] ?? []).includes(input.minute)) throw new BookingError("conflict", "Dit tijdstip is niet meer beschikbaar.");
  const start = localToUtc(input.day, input.minute);
  const end = new Date(start.getTime() + duration * 60_000);
  return bookingTx(db, async (tx) => {
    const customerId = await findOrCreatePublicCustomer(tx, input);
    const [res] = (await tx.insert(appointments).values({
      customerId,
      status: "requested",
      startAt: start,
      endAt: end,
      blockedUntil: new Date(end.getTime() + buffer * 60_000),
      durationMinutes: duration,
      bufferMinutes: buffer,
      priceCents: snapshotPrice(rows),
      source: "request",
      locale: input.locale ?? "nl",
      customerNote: input.note?.slice(0, 1500) || null,
    })) as unknown as [{ insertId: number }];
    const id = res.insertId;
    await writeItems(tx, id, rows);
    await event(tx, id, "requested", null, "requested", null, { day: input.day, minute: input.minute });
    const v = await view(tx, id);
    await queueCustomerEmail(tx, v, "request_received", `request_received:${id}`);
    await queueOwnerNotice(tx, v, ctx.ownerEmail ?? "");
    return id;
  });
}

/** Legacy request form (preferred day + part of day): stored for the owner's agenda. */
export async function createLegacyRequest(
  db: DB,
  input: CustomerInput & { treatmentIds: string[]; preferredDate: LocalDate; timeRange: string; alternative?: string; note?: string },
  ctx: Ctx,
): Promise<number> {
  const rows = await loadTreatments(db, input.treatmentIds);
  return bookingTx(db, async (tx) => {
    const customerId = await findOrCreatePublicCustomer(tx, input);
    const [res] = (await tx.insert(appointments).values({
      customerId,
      status: "requested",
      requestedDate: input.preferredDate,
      requestedTimeRange: input.timeRange,
      requestedAlternative: input.alternative?.slice(0, 200) || null,
      priceCents: snapshotPrice(rows),
      source: "request",
      locale: input.locale ?? "nl",
      customerNote: input.note?.slice(0, 1500) || null,
    })) as unknown as [{ insertId: number }];
    const id = res.insertId;
    await writeItems(tx, id, rows);
    await event(tx, id, "requested", null, "requested", null, { preferredDate: input.preferredDate, timeRange: input.timeRange });
    void ctx;
    return id;
  });
}

/** Owner creates an appointment directly (confirmed). */
export async function createManual(
  db: DB,
  input: CustomerInput & {
    customerId?: number;
    /** Owner confirmed this is a new person despite a matching email/phone. */
    forceNew?: boolean;
    treatmentIds: string[];
    day: LocalDate;
    minute: number;
    durationMinutes?: number;
    /** Agreed price in cents; defaults to the sum of confirmed list prices. */
    priceCents?: number | null;
    internalNote?: string;
    allowOutsideHours?: boolean;
  },
  ctx: Ctx,
): Promise<number> {
  const rows = await loadTreatments(db, input.treatmentIds);
  if (!rows.length) throw new BookingError("invalidInput", "Kies minimaal één behandeling.");
  const totals = totalDuration(rows);
  const duration = input.durationMinutes || totals.duration;
  if (!duration || duration < 5 || duration > 600) throw new BookingError("noDuration", "Vul de duur in minuten in.");
  const start = localToUtc(input.day, input.minute);
  const end = new Date(start.getTime() + duration * 60_000);
  const blockedUntil = new Date(end.getTime() + totals.buffer * 60_000);
  const id = await bookingTx(db, async (tx) => {
    await lockAndCheck(tx, start, blockedUntil, { enforceHours: !input.allowOutsideHours, durationMinutes: duration });
    const customerId = await resolveManualCustomer(tx, input);
    const [res] = (await tx.insert(appointments).values({
      customerId,
      status: "confirmed",
      startAt: start,
      endAt: end,
      blockedUntil,
      durationMinutes: duration,
      bufferMinutes: totals.buffer,
      priceCents: input.priceCents !== undefined ? input.priceCents : snapshotPrice(rows),
      source: "manual",
      locale: input.locale ?? "nl",
      internalNote: input.internalNote?.slice(0, 2000) || null,
    })) as unknown as [{ insertId: number }];
    const newId = res.insertId;
    await writeItems(tx, newId, rows);
    const v = await view(tx, newId);
    // A confirmed appointment is always confirmed to the customer when an email address is known.
    const notified = await queueCustomerEmail(tx, v, "confirmed", `confirmed:${newId}:${start.toISOString()}`);
    await event(tx, newId, "created_manual", null, "confirmed", ctx.userId ?? null, { notified: Boolean(notified) });
    await scheduleReminder(tx, v);
    return newId;
  });
  await audit(db, { userId: ctx.userId, action: "appointment.created", entity: "appointment", entityId: id });
  return id;
}

async function transition(
  db: DB,
  id: number,
  ctx: Ctx,
  allowedFrom: string[],
  fn: (tx: Tx, v: ApptView) => Promise<{ to: string; type: string; notified?: boolean; material?: boolean; data?: Record<string, unknown> }>,
) {
  const result = await bookingTx(db, async (tx) => {
    // Lock the appointment row so two clicks cannot both change it.
    await tx.execute(sql`SELECT id FROM appointments WHERE id = ${id} FOR UPDATE`);
    const v = await view(tx, id);
    if (!allowedFrom.includes(v.appt.status)) throw new BookingError("invalidState", "Deze actie is niet mogelijk in de huidige status.");
    const r = await fn(tx, v);
    await tx.update(appointments).set({ status: r.to, version: sql`${appointments.version} + 1` }).where(eq(appointments.id, id));
    await event(tx, id, r.type, v.appt.status, r.to, ctx.userId ?? null, r.data);
    return r;
  });
  await audit(db, { userId: ctx.userId, action: `appointment.${result.type}`, entity: "appointment", entityId: id });
  return result;
}

/** Approve a request (optionally at another exact time) → confirmed + email + reminder. */
export async function approve(db: DB, id: number, ctx: Ctx, opts: { day?: LocalDate; minute?: number; durationMinutes?: number; message?: string; allowOutsideHours?: boolean } = {}) {
  return transition(db, id, ctx, ["requested", "proposed"], async (tx, v) => {
    const duration = opts.durationMinutes || v.appt.durationMinutes || totalDuration(await loadTreatments(tx, v.items.map((i) => i.treatmentId))).duration;
    if (!duration) throw new BookingError("noDuration", "Vul de duur in minuten in.");
    const start = opts.day != null && opts.minute != null ? localToUtc(opts.day, opts.minute) : v.appt.startAt;
    if (!start) throw new BookingError("invalidInput", "Kies een datum en tijd.");
    const end = new Date(start.getTime() + duration * 60_000);
    const blockedUntil = new Date(end.getTime() + v.appt.bufferMinutes * 60_000);
    await lockAndCheck(tx, start, blockedUntil, { excludeId: id, enforceHours: !opts.allowOutsideHours, durationMinutes: duration });
    await tx.update(appointments).set({ startAt: start, endAt: end, blockedUntil, durationMinutes: duration }).where(eq(appointments.id, id));
    const nv = { ...v, appt: { ...v.appt, status: "confirmed", startAt: start, endAt: end, blockedUntil, durationMinutes: duration } };
    await queueCustomerEmail(tx, nv, "confirmed", `confirmed:${id}:${start.toISOString()}`, { message: opts.message });
    await scheduleReminder(tx, nv);
    return { to: "confirmed", type: "approved", data: { start: start.toISOString() } };
  });
}

/** Propose another time for a request: holds the slot, asks the customer to reply. */
export async function propose(db: DB, id: number, ctx: Ctx, opts: { day: LocalDate; minute: number; durationMinutes?: number; message?: string }) {
  return transition(db, id, ctx, ["requested", "proposed"], async (tx, v) => {
    const duration = opts.durationMinutes || v.appt.durationMinutes || totalDuration(await loadTreatments(tx, v.items.map((i) => i.treatmentId))).duration;
    if (!duration) throw new BookingError("noDuration", "Vul de duur in minuten in.");
    const start = localToUtc(opts.day, opts.minute);
    const end = new Date(start.getTime() + duration * 60_000);
    const blockedUntil = new Date(end.getTime() + v.appt.bufferMinutes * 60_000);
    await lockAndCheck(tx, start, blockedUntil, { excludeId: id, enforceHours: true, durationMinutes: duration });
    await tx.update(appointments).set({ startAt: start, endAt: end, blockedUntil, durationMinutes: duration }).where(eq(appointments.id, id));
    const nv = { ...v, appt: { ...v.appt, startAt: start, endAt: end } };
    await queueCustomerEmail(tx, nv, "proposed", `proposed:${id}:${start.toISOString()}`, { message: opts.message });
    return { to: "proposed", type: "proposed", data: { start: start.toISOString() } };
  });
}

export async function decline(db: DB, id: number, ctx: Ctx, opts: { message?: string } = {}) {
  return transition(db, id, ctx, ["requested", "proposed"], async (tx, v) => {
    await cancelPending(tx, id, ["reminder", "confirmed", "proposed"]);
    const notified = await queueCustomerEmail(tx, v, "declined", `declined:${id}`, { message: opts.message });
    return { to: "declined", type: "declined", notified: Boolean(notified) };
  });
}

/** Move a confirmed appointment (atomic check excluding itself) + email + new reminder. */
export async function reschedule(
  db: DB,
  id: number,
  ctx: Ctx,
  opts: { day: LocalDate; minute: number; durationMinutes?: number; treatmentIds?: string[]; priceCents?: number | null; message?: string; allowOutsideHours?: boolean },
) {
  return transition(db, id, ctx, ["confirmed"], async (tx, v) => {
    let items = v.items;
    let buffer = v.appt.bufferMinutes;
    let duration = opts.durationMinutes || v.appt.durationMinutes || 0;
    if (opts.treatmentIds?.length) {
      const rows = await loadTreatments(tx, opts.treatmentIds);
      if (!rows.length) throw new BookingError("invalidInput", "Kies minimaal één behandeling.");
      const t = totalDuration(rows);
      buffer = t.buffer;
      duration = opts.durationMinutes || t.duration || duration;
      const before = v.items.map((i) => i.treatmentId).sort().join(",");
      if (before !== rows.map((r) => r.id).sort().join(",")) {
        await writeItems(tx, id, rows);
        items = await tx.select().from(appointmentTreatments).where(eq(appointmentTreatments.appointmentId, id));
        if (opts.priceCents === undefined) await tx.update(appointments).set({ priceCents: snapshotPrice(rows) }).where(eq(appointments.id, id));
      }
    }
    if (opts.priceCents !== undefined) await tx.update(appointments).set({ priceCents: opts.priceCents }).where(eq(appointments.id, id));
    if (!duration) throw new BookingError("noDuration", "Vul de duur in minuten in.");
    const start = localToUtc(opts.day, opts.minute);
    const end = new Date(start.getTime() + duration * 60_000);
    const blockedUntil = new Date(end.getTime() + buffer * 60_000);
    await lockAndCheck(tx, start, blockedUntil, { excludeId: id, enforceHours: !opts.allowOutsideHours, durationMinutes: duration });
    await tx.update(appointments).set({ startAt: start, endAt: end, blockedUntil, durationMinutes: duration, bufferMinutes: buffer }).where(eq(appointments.id, id));
    const nv = { ...v, items, appt: { ...v.appt, startAt: start, endAt: end, blockedUntil, durationMinutes: duration } };
    const moved = v.appt.startAt?.getTime() !== start.getTime();
    const itemsChanged = items !== v.items;
    const durationChanged = (v.appt.durationMinutes ?? 0) !== duration;
    // Material change (time, treatment or length) → the customer is told automatically.
    const material = moved || itemsChanged || durationChanged;
    const notified = material ? await queueCustomerEmail(tx, nv, "rescheduled", `rescheduled:${id}:${start.toISOString()}:${items.map((i) => i.treatmentId).join("+")}:${duration}`, { message: opts.message }) : false;
    await scheduleReminder(tx, nv);
    return { to: "confirmed", type: material ? "rescheduled" : "updated", notified: Boolean(notified), material, data: { from: v.appt.startAt?.toISOString(), to: start.toISOString(), notified: Boolean(notified) } };
  });
}

export async function cancel(db: DB, id: number, ctx: Ctx, opts: { message?: string } = {}) {
  return transition(db, id, ctx, ["confirmed", "proposed"], async (tx, v) => {
    await cancelPending(tx, id, ["reminder"]);
    const notified = v.appt.startAt ? await queueCustomerEmail(tx, v, "cancelled", `cancelled:${id}:${v.appt.startAt.toISOString()}`, { message: opts.message }) : false;
    // The slot is freed automatically: only confirmed/proposed rows occupy capacity.
    return { to: "cancelled", type: "cancelled", notified: Boolean(notified), data: { notified: Boolean(notified) } };
  });
}

export async function markCompleted(db: DB, id: number, ctx: Ctx) {
  return transition(db, id, ctx, ["confirmed"], async () => ({ to: "completed", type: "completed" }));
}

export async function markNoShow(db: DB, id: number, ctx: Ctx) {
  return transition(db, id, ctx, ["confirmed"], async (tx) => {
    await cancelPending(tx, id, ["reminder"]);
    return { to: "no_show", type: "no_show" };
  });
}

export async function setArchived(db: DB, id: number, archived: boolean, ctx: Ctx) {
  await db.update(appointments).set({ archivedAt: archived ? new Date() : null }).where(eq(appointments.id, id));
  await audit(db, { userId: ctx.userId, action: archived ? "appointment.archived" : "appointment.unarchived", entity: "appointment", entityId: id });
}

export async function updateNotes(db: DB, id: number, internalNote: string, ctx: Ctx) {
  await db.update(appointments).set({ internalNote: internalNote.slice(0, 2000) || null }).where(eq(appointments.id, id));
  await db.insert(appointmentEvents).values({ appointmentId: id, type: "note_updated", userId: ctx.userId ?? null });
}

export async function updateCustomer(db: DB, id: number, c: Partial<CustomerInput> & { notes?: string }, ctx: Ctx) {
  await db
    .update(customers)
    .set({
      ...(c.firstName != null && { firstName: c.firstName.slice(0, 80) }),
      ...(c.lastName != null && { lastName: c.lastName.slice(0, 80) }),
      ...(c.email !== undefined && { email: c.email?.trim().toLowerCase() || null, emailNorm: normalizeEmail(c.email) }),
      ...(c.phone !== undefined && { phone: c.phone?.trim() || null, phoneNorm: normalizePhone(c.phone) }),
      ...(c.locale && { locale: c.locale }),
      ...(c.notes !== undefined && { notes: c.notes?.slice(0, 2000) || null }),
    })
    .where(and(eq(customers.id, id), isNull(customers.anonymizedAt)));
  await audit(db, { userId: ctx.userId, action: "customer.updated", entity: "customer", entityId: id });
}

/**
 * GDPR erasure: removes personal data but keeps anonymous appointment
 * history (dates, treatments, status) for the business records.
 */
export async function anonymizeCustomer(db: DB, id: number, ctx: Ctx) {
  await bookingTx(db, async (tx) => {
    await tx
      .update(customers)
      .set({ firstName: "Geanonimiseerd", lastName: "", email: null, emailNorm: null, phone: null, phoneNorm: null, notes: null, anonymizedAt: new Date() })
      .where(eq(customers.id, id));
    const appts = await tx.select({ id: appointments.id }).from(appointments).where(eq(appointments.customerId, id));
    const ids = appts.map((a) => a.id);
    if (ids.length) {
      await tx.update(appointments).set({ customerNote: null, internalNote: null }).where(inArray(appointments.id, ids));
      await tx.update(appointments).set({ status: "cancelled" }).where(and(inArray(appointments.id, ids), inArray(appointments.status, [...OPEN_STATUSES])));
      for (const a of ids) await cancelPending(tx, a, ["reminder", "confirmed", "proposed", "rescheduled", "request_received"]);
    }
  });
  // Special category data is removed completely with the personal data.
  const [del] = (await db.delete(consultations).where(eq(consultations.customerId, id))) as unknown as [{ affectedRows: number }];
  await audit(db, { userId: ctx.userId, action: "customer.anonymized", entity: "customer", entityId: id, details: { consultationDeleted: del.affectedRows > 0 } });
}

/** All personal data of a customer (GDPR access/export). */
export async function exportCustomer(db: DB, id: number) {
  const [c] = await db.select().from(customers).where(eq(customers.id, id));
  if (!c) throw new BookingError("notFound", "Klant niet gevonden.");
  const appts = await db.select().from(appointments).where(eq(appointments.customerId, id)).orderBy(desc(appointments.startAt));
  const items = appts.length ? await db.select().from(appointmentTreatments).where(inArray(appointmentTreatments.appointmentId, appts.map((a) => a.id))) : [];
  return {
    customer: c,
    appointments: appts.map((a) => ({ ...a, treatments: items.filter((i) => i.appointmentId === a.id).map((i) => i.nameNl) })),
    exportedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────── Queries

export type ListItem = { appt: Appointment; customer: Customer; treatments: string[] };

async function withItems(db: DB, rows: { appointments: Appointment; customers: Customer }[]): Promise<ListItem[]> {
  const ids = rows.map((r) => r.appointments.id);
  const items = ids.length ? await db.select().from(appointmentTreatments).where(inArray(appointmentTreatments.appointmentId, ids)) : [];
  return rows.map((r) => ({ appt: r.appointments, customer: r.customers, treatments: items.filter((i) => i.appointmentId === r.appointments.id).map((i) => i.nameNl) }));
}

export async function listRange(db: DB, from: LocalDate, to: LocalDate, statuses: string[] = ["confirmed", "proposed", "requested", "completed", "no_show"]) {
  const rows = await db
    .select()
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(and(gte(appointments.startAt, dayBoundsUtc(from).start), lt(appointments.startAt, dayBoundsUtc(to).end), inArray(appointments.status, statuses)))
    .orderBy(asc(appointments.startAt));
  return withItems(db, rows);
}

export async function listPending(db: DB) {
  const rows = await db
    .select()
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(and(inArray(appointments.status, ["requested", "proposed"]), isNull(appointments.archivedAt)))
    .orderBy(asc(appointments.createdAt));
  return withItems(db, rows);
}

export async function listUpcoming(db: DB, now = new Date(), limit = 50) {
  const rows = await db
    .select()
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(and(eq(appointments.status, "confirmed"), gte(appointments.startAt, now)))
    .orderBy(asc(appointments.startAt))
    .limit(limit);
  return withItems(db, rows);
}

/** Appointments in one status (completed, cancelled, …), newest first. */
export async function listByStatus(db: DB, statuses: string[], limit = 100) {
  const rows = await db
    .select()
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(inArray(appointments.status, statuses))
    .orderBy(desc(appointments.startAt), desc(appointments.createdAt))
    .limit(limit);
  return withItems(db, rows);
}

export async function listHistory(db: DB, now = new Date(), limit = 100) {
  const rows = await db
    .select()
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(or(lt(appointments.startAt, now), inArray(appointments.status, ["cancelled", "declined", "completed", "no_show"])))
    .orderBy(desc(appointments.startAt))
    .limit(limit);
  return withItems(db, rows);
}

export async function searchCustomers(db: DB, q: string, limit = 30) {
  const term = q.trim();
  if (!term) return db.select().from(customers).where(and(isNull(customers.anonymizedAt), isNull(customers.mergedIntoId))).orderBy(desc(customers.updatedAt)).limit(limit);
  const phoneNorm = normalizePhone(term);
  const like_ = `%${term.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const digits = term.replace(/\D/g, "");
  return db
    .select()
    .from(customers)
    .where(
      and(
        isNull(customers.anonymizedAt),
        isNull(customers.mergedIntoId),
        or(
          phoneNorm ? eq(customers.phoneNorm, phoneNorm) : undefined,
          like(customers.firstName, like_),
          like(customers.lastName, like_),
          like(sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`, like_),
          like(customers.email, like_),
          digits.length >= 4 ? like(sql`REPLACE(REPLACE(REPLACE(${customers.phone}, ' ', ''), '-', ''), '+', '')`, `%${digits}%`) : undefined,
        ),
      ),
    )
    .orderBy(asc(customers.lastName))
    .limit(limit);
}

export async function customerAppointments(db: DB, customerId: number) {
  const rows = await db
    .select()
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(eq(appointments.customerId, customerId))
    .orderBy(desc(appointments.createdAt));
  return withItems(db, rows);
}

export async function appointmentHistory(db: DB, id: number) {
  return db.select().from(appointmentEvents).where(eq(appointmentEvents.appointmentId, id)).orderBy(asc(appointmentEvents.createdAt));
}

export { addDays, toLocalParts };
export type { BookingSettings, PrivateBusinessSettings };
