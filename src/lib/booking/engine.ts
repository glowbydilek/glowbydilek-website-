/**
 * Availability engine (pure, unit-tested).
 *
 * Inputs: the weekly template, date overrides, existing occupancy
 * (confirmed/proposed appointments incl. their cleanup buffer, and blocked
 * periods), booking rules and the requested duration. Output: exact start
 * times per local date (Europe/Amsterdam).
 *
 * The database re-checks capacity atomically when a booking is confirmed
 * (see service.ts); this engine decides what is *offered*.
 */
import { addDays, isoWeekday, localToUtc, toLocalParts, type LocalDate } from "../time";

export type Interval = { start: number; end: number }; // minutes from local midnight
export type WeeklyRule = { weekday: number; kind: "open" | "break"; start: number; end: number };
export type Override = {
  day: LocalDate;
  closed: boolean;
  customHours: boolean;
  capacity: number | null;
  maxAppointments: number | null;
  intervals: { kind: "open" | "break"; start: number; end: number }[];
};
export type Busy = { start: Date; end: Date; kind: "appointment" | "block" };
export type BookingRules = {
  capacity: number; // simultaneous appointments (default 1)
  maxPerDay: number | null;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  slotStepMinutes: number;
};

export const defaultRules: BookingRules = {
  capacity: 1,
  maxPerDay: null,
  minNoticeMinutes: 24 * 60,
  maxAdvanceDays: 60,
  slotStepMinutes: 15,
};

/** Subtracts `cuts` from `base` intervals. */
export function subtract(base: Interval[], cuts: Interval[]): Interval[] {
  let out = base.map((b) => ({ ...b }));
  for (const c of cuts) {
    const next: Interval[] = [];
    for (const b of out) {
      if (c.end <= b.start || c.start >= b.end) next.push(b);
      else {
        if (c.start > b.start) next.push({ start: b.start, end: c.start });
        if (c.end < b.end) next.push({ start: c.end, end: b.end });
      }
    }
    out = next;
  }
  return out.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
}

function merge(list: Interval[]): Interval[] {
  const s = [...list].sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of s) {
    const last = out[out.length - 1];
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
    else out.push({ ...i });
  }
  return out;
}

/** Working intervals (breaks removed) and capacity for one local date. */
export function dayPlan(day: LocalDate, weekly: WeeklyRule[], override: Override | undefined, rules: BookingRules) {
  const wd = isoWeekday(day);
  if (override?.closed) return { open: [] as Interval[], capacity: 0, maxPerDay: 0 };
  const weeklyOpen = weekly.filter((r) => r.weekday === wd && r.kind === "open");
  const weeklyBreaks = weekly.filter((r) => r.weekday === wd && r.kind === "break");
  const ovOpen = override?.intervals.filter((i) => i.kind === "open") ?? [];
  const ovBreaks = override?.intervals.filter((i) => i.kind === "break") ?? [];
  const opens = override?.customHours ? ovOpen : weeklyOpen;
  const breaks = [...(override?.customHours ? [] : weeklyBreaks), ...ovBreaks];
  const open = subtract(merge(opens.map(({ start, end }) => ({ start, end }))), breaks.map(({ start, end }) => ({ start, end })));
  return {
    open,
    capacity: override?.capacity ?? rules.capacity,
    maxPerDay: override?.maxAppointments ?? rules.maxPerDay,
  };
}

/** How many occupying items overlap [start, end). Blocks use the full capacity. */
export function overlapLoad(start: Date, end: Date, busy: Busy[], capacity: number): number {
  let load = 0;
  for (const b of busy) {
    if (b.start < end && b.end > start) load += b.kind === "block" ? capacity : 1;
  }
  return load;
}

/**
 * Peak concurrent load inside [start, end) — needed when capacity > 1, so two
 * non-overlapping existing appointments are not counted as simultaneous.
 */
export function peakLoad(start: Date, end: Date, busy: Busy[], capacity: number): number {
  const relevant = busy.filter((b) => b.start < end && b.end > start);
  if (relevant.some((b) => b.kind === "block")) return capacity;
  const points = [start.getTime(), ...relevant.map((b) => Math.max(b.start.getTime(), start.getTime()))];
  let peak = 0;
  for (const p of points) {
    const n = relevant.filter((b) => b.start.getTime() <= p && b.end.getTime() > p).length;
    peak = Math.max(peak, n);
  }
  return peak;
}

export type SlotQuery = {
  from: LocalDate;
  to: LocalDate; // inclusive
  durationMinutes: number;
  bufferMinutes: number;
  weekly: WeeklyRule[];
  overrides: Override[];
  busy: Busy[];
  /** Number of occupying appointments per local date (for maxPerDay). */
  countsPerDay?: Record<LocalDate, number>;
  rules: BookingRules;
  now: Date;
};

export function availableSlots(q: SlotQuery): Record<LocalDate, number[]> {
  const out: Record<LocalDate, number[]> = {};
  const earliest = new Date(q.now.getTime() + q.rules.minNoticeMinutes * 60_000);
  const lastDay = addDays(toLocalParts(q.now).date, q.rules.maxAdvanceDays);
  const byDay = new Map(q.overrides.map((o) => [o.day, o]));
  const step = Math.max(5, q.rules.slotStepMinutes);
  if (q.durationMinutes <= 0) return out;

  for (let day = q.from; day <= q.to && day <= lastDay; day = addDays(day, 1)) {
    const plan = dayPlan(day, q.weekly, byDay.get(day), q.rules);
    if (!plan.open.length || plan.capacity <= 0) continue;
    if (plan.maxPerDay != null && (q.countsPerDay?.[day] ?? 0) >= plan.maxPerDay) continue;
    const slots: number[] = [];
    for (const seg of plan.open) {
      // Align to the step grid from the segment start (e.g. 09:00, 09:15 …).
      for (let m = seg.start; m + q.durationMinutes <= seg.end; m += step) {
        const start = localToUtc(day, m);
        if (start < earliest) continue;
        // Skip wall-clock times that do not exist (DST gap).
        if (toLocalParts(start).minutes !== m) continue;
        const end = new Date(start.getTime() + (q.durationMinutes + q.bufferMinutes) * 60_000);
        if (peakLoad(start, end, q.busy, plan.capacity) < plan.capacity) slots.push(m);
      }
    }
    if (slots.length) out[day] = slots;
  }
  return out;
}

/** Whether one specific start time is offered (used to validate public requests). */
export function isSlotAvailable(q: Omit<SlotQuery, "from" | "to">, day: LocalDate, minute: number): boolean {
  return (availableSlots({ ...q, from: day, to: day })[day] ?? []).includes(minute);
}
