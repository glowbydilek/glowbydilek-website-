/**
 * Pure calendar helpers for the appointment request date picker (shared by
 * the browser and the server). Dates are plain YYYY-MM-DD strings in the
 * Europe/Amsterdam calendar; no device time zone is involved.
 */

export type RequestCalendar = { closedWeekdays: number[]; closedDates: string[] };

import { addDays, isoWeekday } from "../time";

export { isoWeekday };
export const shiftDays = addDays;
const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** Same day in another month, clamped to that month's last day. */
export function shiftMonths(day: string, n: number): string {
  const [y, m, dd] = day.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12)).getUTCDate();
  first.setUTCDate(Math.min(dd, last));
  return fmt(first);
}

export function monthKey(day: string): string {
  return day.slice(0, 7);
}

/**
 * Monday-first grid for the month of `day`: weeks of seven cells, with null
 * for the blanks before the 1st and after the last day.
 */
export function monthGrid(day: string): (string | null)[][] {
  const [y, m] = day.split("-").map(Number);
  const first = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;
  const days = new Date(Date.UTC(y, m, 0, 12)).getUTCDate();
  const lead = isoWeekday(first) - 1;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 0; i < days; i++) cells.push(shiftDays(first, i));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** True when a date falls on a closed weekday or a date the owner closed. */
export function isClosedDay(cal: RequestCalendar, day: string): boolean {
  return cal.closedWeekdays.includes(isoWeekday(day)) || cal.closedDates.includes(day);
}

/** Selectable: within [min, max] and not closed. */
export function isSelectable(cal: RequestCalendar, day: string, min: string, max: string): boolean {
  return day >= min && day <= max && !isClosedDay(cal, day);
}
