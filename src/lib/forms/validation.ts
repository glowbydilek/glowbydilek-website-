/**
 * Server-side validation for the contact and appointment-request forms.
 *
 * Pure functions without framework imports so they can be unit-tested
 * (tests/validation.test.ts). Error values are stable codes; the UI maps them
 * to localised messages.
 */

export type Locale = "nl" | "en";
export type ErrorCode = "required" | "invalid" | "tooShort" | "tooLong" | "pastDate" | "tooFar" | "closedDay" | "consent";
export type FieldErrors = Record<string, ErrorCode>;
export type Result<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

export const CONTACT_TOPICS = ["question", "treatment", "appointment", "other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const TIME_RANGES = ["morning", "afternoon", "evening", "flexible"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

export type ContactInput = {
  locale: Locale;
  name: string;
  email: string;
  phone?: string;
  topic: ContactTopic;
  message: string;
};

export type AppointmentInput = {
  locale: Locale;
  treatments: string[];
  preferredDate: string;
  timeRange: TimeRange;
  alternative?: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  /** Optional promotion code (normalised upper case); checked against the database on the server. */
  promoCode?: string;
};

/** Optional promotion code: letters, digits and dashes (3–30), case-insensitive. */
function promo(raw: unknown, errors: FieldErrors): string | undefined {
  const v = text(raw, 40).toUpperCase().replace(/\s+/g, "");
  if (!v) return undefined;
  if (!/^[A-Z0-9-]{3,30}$/.test(v)) errors.promoCode = "invalid";
  return v;
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE = /^\+?[0-9][0-9 ()-]{5,19}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Trims, collapses control characters and limits length. */
function text(v: unknown, max: number, singleLine = true): string {
  if (typeof v !== "string") return "";
  let s = v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if (singleLine) s = s.replace(/\s+/g, " ");
  return s.trim().slice(0, max + 1);
}

function locale(v: unknown): Locale {
  return v === "en" ? "en" : "nl";
}

function checkName(name: string, errors: FieldErrors) {
  if (!name) errors.name = "required";
  else if (name.length < 2) errors.name = "tooShort";
  else if (name.length > 80) errors.name = "tooLong";
}

function checkEmail(email: string, errors: FieldErrors) {
  if (!email) errors.email = "required";
  else if (email.length > 160 || !EMAIL.test(email)) errors.email = "invalid";
}

function checkPhone(phone: string, errors: FieldErrors) {
  if (phone && !PHONE.test(phone)) errors.phone = "invalid";
}

export function validateContact(raw: Record<string, unknown>): Result<ContactInput> {
  const errors: FieldErrors = {};
  const name = text(raw.name, 80);
  const email = text(raw.email, 160).toLowerCase();
  const phone = text(raw.phone, 20);
  const topic = CONTACT_TOPICS.includes(raw.topic as ContactTopic) ? (raw.topic as ContactTopic) : null;
  const message = text(raw.message, 3000, false);

  checkName(name, errors);
  checkEmail(email, errors);
  checkPhone(phone, errors);
  if (!topic) errors.topic = "required";
  if (!message) errors.message = "required";
  else if (message.length < 10) errors.message = "tooShort";
  else if (message.length > 3000) errors.message = "tooLong";
  if (raw.privacy !== true) errors.privacy = "consent";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: { locale: locale(raw.locale), name, email, phone: phone || undefined, topic: topic!, message },
  };
}

/** Today's date (YYYY-MM-DD) in the studio's time zone, Europe/Amsterdam. */
export function amsterdamToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Adds whole days to a YYYY-MM-DD date string. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function validateAppointment(
  raw: Record<string, unknown>,
  allowedTreatments: readonly string[],
  today: string = amsterdamToday(),
): Result<AppointmentInput> {
  const errors: FieldErrors = {};
  const treatments = Array.isArray(raw.treatments)
    ? [...new Set(raw.treatments.filter((t): t is string => typeof t === "string" && allowedTreatments.includes(t)))]
    : [];
  const preferredDate = text(raw.preferredDate, 10);
  const timeRange = TIME_RANGES.includes(raw.timeRange as TimeRange) ? (raw.timeRange as TimeRange) : null;
  const alternative = text(raw.alternative, 200);
  const name = text(raw.name, 80);
  const email = text(raw.email, 160).toLowerCase();
  const phone = text(raw.phone, 20);
  const notes = text(raw.notes, 1500, false);
  const promoCode = promo(raw.promoCode, errors);

  if (treatments.length === 0) errors.treatments = "required";
  if (!preferredDate) errors.preferredDate = "required";
  else if (!DATE.test(preferredDate) || addDays(preferredDate, 0) !== preferredDate) {
    // Rejects malformed and impossible dates such as 2026-02-30.
    errors.preferredDate = "invalid";
  } else if (preferredDate < today) {
    errors.preferredDate = "pastDate";
  } else if (preferredDate > addDays(today, 366)) {
    errors.preferredDate = "tooFar";
  }
  if (!timeRange) errors.timeRange = "required";
  if (alternative.length > 200) errors.alternative = "tooLong";
  checkName(name, errors);
  checkEmail(email, errors);
  checkPhone(phone, errors);
  if (notes.length > 1500) errors.notes = "tooLong";
  if (raw.privacy !== true) errors.privacy = "consent";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      locale: locale(raw.locale),
      treatments,
      preferredDate,
      timeRange: timeRange!,
      alternative: alternative || undefined,
      name,
      email,
      phone: phone || undefined,
      notes: notes || undefined,
      promoCode,
    },
  };
}

/**
 * Anti-spam checks: an invisible honeypot field must stay empty, and the form
 * must have been open for a few seconds (bots submit instantly).
 *
 * `elapsedMs` is measured entirely in the visitor's browser (time since the
 * form became interactive), so a wrong device clock can never cause a real
 * message to be silently discarded.
 */
export function isLikelySpam(raw: Record<string, unknown>): boolean {
  if (typeof raw.company === "string" && raw.company.trim() !== "") return true;
  // Link spam: real questions rarely contain more than a couple of URLs.
  const free = [raw.message, raw.notes, raw.name].filter((v): v is string => typeof v === "string").join(" ");
  if ((free.match(/https?:\/\/|www\./gi) ?? []).length > 3) return true;
  const elapsed = typeof raw.elapsedMs === "number" ? raw.elapsedMs : NaN;
  if (!Number.isFinite(elapsed)) return true;
  return elapsed < 3000 || elapsed > 12 * 60 * 60 * 1000;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export type BookingRequestInput = {
  locale: Locale;
  treatments: string[];
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note?: string;
  promoCode?: string;
};

/** Availability-aware booking request (exact time). First/last name, email and phone are required. */
export function validateBookingRequest(raw: Record<string, unknown>, allowedTreatments: readonly string[], today: string = amsterdamToday()): Result<BookingRequestInput> {
  const errors: FieldErrors = {};
  const treatments = Array.isArray(raw.treatments)
    ? [...new Set(raw.treatments.filter((t): t is string => typeof t === "string" && allowedTreatments.includes(t)))]
    : [];
  const date = text(raw.date, 10);
  const time = text(raw.time, 5);
  const firstName = text(raw.firstName, 60);
  const lastName = text(raw.lastName, 80);
  const email = text(raw.email, 160).toLowerCase();
  const phone = text(raw.phone, 20);
  const note = text(raw.note, 1000, false);
  const promoCode = promo(raw.promoCode, errors);
  if (!treatments.length) errors.treatments = "required";
  if (!DATE.test(date) || addDays(date, 0) !== date) errors.date = "invalid";
  else if (date < today) errors.date = "pastDate";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.time = "invalid";
  if (!firstName) errors.firstName = "required";
  else if (firstName.length > 60) errors.firstName = "tooLong";
  if (!lastName) errors.lastName = "required";
  else if (lastName.length > 80) errors.lastName = "tooLong";
  checkEmail(email, errors);
  if (!phone) errors.phone = "required";
  else checkPhone(phone, errors);
  if (note.length > 1000) errors.note = "tooLong";
  if (raw.privacy !== true) errors.privacy = "consent";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { locale: locale(raw.locale), treatments, date, time, firstName, lastName, email, phone, note: note || undefined, promoCode } };
}
