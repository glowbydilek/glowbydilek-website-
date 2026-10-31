/**
 * Europe/Amsterdam time helpers. All business scheduling happens in
 * Amsterdam local time; the database stores UTC instants.
 *
 * Pure functions (no framework imports) so they are unit-tested, including
 * the March (CET→CEST, 02:00 skipped) and October (CEST→CET, 02:00–03:00
 * repeated) transitions.
 */
export const TZ = "Europe/Amsterdam";

export type LocalDate = string; // YYYY-MM-DD

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Amsterdam wall-clock parts for an instant. */
export function toLocalParts(d: Date): { date: LocalDate; minutes: number; weekday: number } {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  const minutes = Number(p.hour) * 60 + Number(p.minute);
  return { date, minutes, weekday: isoWeekday(date) };
}

/** Offset of Amsterdam from UTC at an instant, in minutes (60 or 120). */
export function offsetMinutes(d: Date): number {
  const { date, minutes } = toLocalParts(d);
  const [y, m, dd] = date.split("-").map(Number);
  const asUtc = Date.UTC(y, m - 1, dd, Math.floor(minutes / 60), minutes % 60);
  const actual = Math.floor(d.getTime() / 60000) * 60000;
  return Math.round((asUtc - actual) / 60000);
}

/**
 * Converts an Amsterdam wall-clock time to a UTC instant.
 * - Non-existent times (spring-forward gap) move forward by the gap.
 * - Ambiguous times (fall-back overlap) resolve to the FIRST occurrence (CEST).
 */
export function localToUtc(date: LocalDate, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  // Try both possible offsets; prefer the earlier instant that round-trips.
  const candidates = [120, 60]
    .map((off) => new Date(naive - off * 60000))
    .filter((c) => {
      const l = toLocalParts(c);
      return l.date === date && l.minutes === minutes;
    });
  if (candidates.length) return candidates.sort((a, b) => a.getTime() - b.getTime())[0];
  // Gap: the local time does not exist; use the standard-time interpretation (moves it forward).
  return new Date(naive - 60 * 60000);
}

/** ISO weekday for a local date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: LocalDate): number {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days, 12));
  return t.toISOString().slice(0, 10);
}

export function todayLocal(now: Date = new Date()): LocalDate {
  return toLocalParts(now).date;
}

/** Start (00:00) and end (next day 00:00) of a local day as UTC instants. */
export function dayBoundsUtc(date: LocalDate): { start: Date; end: Date } {
  return { start: localToUtc(date, 0), end: localToUtc(addDays(date, 1), 0) };
}

export function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function hhmmToMinutes(s: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function isLocalDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return addDays(s, 0) === s;
}

export function formatLocal(d: Date, locale: "nl" | "en", opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", { timeZone: TZ, ...opts }).format(d);
}

/** "dinsdag 3 november 2026" / "Tuesday 3 November 2026". */
export function formatLongDate(d: Date, locale: "nl" | "en"): string {
  return formatLocal(d, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(d: Date, locale: "nl" | "en" = "nl"): string {
  return formatLocal(d, locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

/** First day (Monday) of the ISO week containing `date`. */
export function startOfWeek(date: LocalDate): LocalDate {
  return addDays(date, 1 - isoWeekday(date));
}

export function startOfMonth(date: LocalDate): LocalDate {
  return `${date.slice(0, 8)}01`;
}

export function daysInMonth(date: LocalDate): number {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
