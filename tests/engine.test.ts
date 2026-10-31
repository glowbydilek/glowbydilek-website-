import assert from "node:assert/strict";
import { test } from "node:test";
import { availableSlots, defaultRules, peakLoad, subtract, type Override, type WeeklyRule } from "../src/lib/booking/engine.ts";
import { localToUtc } from "../src/lib/time.ts";

// Monday–Friday 09:00–12:00 (example from the brief), break Wednesday 10:00–10:30
const weekly: WeeklyRule[] = [1, 2, 3, 4, 5].map((weekday) => ({ weekday, kind: "open" as const, start: 540, end: 720 }));
weekly.push({ weekday: 3, kind: "break", start: 600, end: 630 });
const rules = { ...defaultRules, minNoticeMinutes: 0, slotStepMinutes: 30, maxAdvanceDays: 400 };
const now = new Date("2026-11-01T12:00:00Z"); // Sunday
const base = { durationMinutes: 60, bufferMinutes: 0, weekly, overrides: [] as Override[], busy: [], rules, now };

test("weekly template: open days, closed weekend, end-of-day fit", () => {
  const s = availableSlots({ ...base, from: "2026-11-02", to: "2026-11-08" });
  assert.deepEqual(Object.keys(s), ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
  assert.deepEqual(s["2026-11-02"], [540, 570, 600, 630, 660]); // last start 11:00 for 60 min
});

test("breaks are respected", () => {
  const s = availableSlots({ ...base, from: "2026-11-04", to: "2026-11-04" });
  // 09:00 (ends 10:00), 10:30, 11:00 — nothing overlapping 10:00–10:30
  assert.deepEqual(s["2026-11-04"], [540, 630, 660]);
});

test("date overrides: closed day, opened Saturday, custom hours, extra break, capacity", () => {
  const overrides: Override[] = [
    { day: "2026-11-02", closed: true, customHours: false, capacity: null, maxAppointments: null, intervals: [] },
    { day: "2026-11-07", closed: false, customHours: true, capacity: null, maxAppointments: null, intervals: [{ kind: "open", start: 540, end: 780 }] },
    { day: "2026-11-03", closed: false, customHours: false, capacity: null, maxAppointments: null, intervals: [{ kind: "break", start: 540, end: 600 }] },
  ];
  const s = availableSlots({ ...base, overrides, from: "2026-11-02", to: "2026-11-08" });
  assert.equal(s["2026-11-02"], undefined, "closed");
  assert.deepEqual(s["2026-11-07"], [540, 570, 600, 630, 660, 690, 720], "Saturday 09:00–13:00");
  assert.deepEqual(s["2026-11-03"], [600, 630, 660], "extra break only on that date");
  // the following Monday is unaffected by the override
  assert.deepEqual(availableSlots({ ...base, overrides, from: "2026-11-09", to: "2026-11-09" })["2026-11-09"], [540, 570, 600, 630, 660]);
});

test("existing appointments + cleanup buffer block overlapping starts (capacity 1)", () => {
  const busy = [{ start: localToUtc("2026-11-05", 600), end: localToUtc("2026-11-05", 600 + 45 + 15), kind: "appointment" as const }];
  const s = availableSlots({ ...base, busy, durationMinutes: 30, bufferMinutes: 10, from: "2026-11-05", to: "2026-11-05" });
  // 09:00(+40→09:40) ok, 09:30(→10:10) overlaps 10:00, 10:00/10:30 overlap until 11:00, 11:00 ok, 11:30 ok
  assert.deepEqual(s["2026-11-05"], [540, 660, 690]);
});

test("capacity 2 allows one parallel booking; blocks remove everything", () => {
  const busy = [{ start: localToUtc("2026-11-05", 540), end: localToUtc("2026-11-05", 600), kind: "appointment" as const }];
  const two = availableSlots({ ...base, busy, rules: { ...rules, capacity: 2 }, from: "2026-11-05", to: "2026-11-05" });
  assert.ok(two["2026-11-05"].includes(540));
  const blocks = [{ start: localToUtc("2026-11-05", 0), end: localToUtc("2026-11-06", 0), kind: "block" as const }];
  assert.equal(availableSlots({ ...base, busy: blocks, rules: { ...rules, capacity: 2 }, from: "2026-11-05", to: "2026-11-05" })["2026-11-05"], undefined);
  // two non-overlapping appointments are not "simultaneous"
  const seq = [
    { start: localToUtc("2026-11-05", 540), end: localToUtc("2026-11-05", 570), kind: "appointment" as const },
    { start: localToUtc("2026-11-05", 570), end: localToUtc("2026-11-05", 600), kind: "appointment" as const },
  ];
  assert.equal(peakLoad(localToUtc("2026-11-05", 540), localToUtc("2026-11-05", 600), seq, 2), 1);
});

test("minimum notice, maximum advance and max per day", () => {
  const nowMon = new Date("2026-11-02T08:20:00Z"); // 09:20 Amsterdam
  const s = availableSlots({ ...base, now: nowMon, rules: { ...rules, minNoticeMinutes: 60, maxAdvanceDays: 2 }, from: "2026-11-02", to: "2026-11-10" });
  assert.deepEqual(s["2026-11-02"], [630, 660], "starts from 10:20 → 10:30");
  assert.deepEqual(Object.keys(s), ["2026-11-02", "2026-11-03", "2026-11-04"]);
  const full = availableSlots({ ...base, rules: { ...rules, maxPerDay: 2 }, countsPerDay: { "2026-11-03": 2 }, from: "2026-11-03", to: "2026-11-03" });
  assert.equal(full["2026-11-03"], undefined);
});

test("DST: slots are correct on the transition Sundays when opened", () => {
  const ov = (day: string): Override => ({ day, closed: false, customHours: true, capacity: null, maxAppointments: null, intervals: [{ kind: "open", start: 60, end: 240 }] });
  const march = availableSlots({ ...base, now: new Date("2026-03-01T00:00:00Z"), overrides: [ov("2026-03-29")], from: "2026-03-29", to: "2026-03-29" });
  // 02:00–03:00 does not exist: no 02:00 or 02:30 start
  assert.ok(!march["2026-03-29"].includes(120) && !march["2026-03-29"].includes(150));
  const oct = availableSlots({ ...base, now: new Date("2026-10-01T00:00:00Z"), overrides: [ov("2026-10-25")], from: "2026-10-25", to: "2026-10-25" });
  assert.deepEqual(oct["2026-10-25"], [60, 90, 120, 150, 180]);
  assert.equal(localToUtc("2026-10-25", 180).toISOString(), "2026-10-25T02:00:00.000Z");
});

test("subtract helper", () => {
  assert.deepEqual(subtract([{ start: 0, end: 100 }], [{ start: 20, end: 30 }, { start: 90, end: 120 }]), [
    { start: 0, end: 20 },
    { start: 30, end: 90 },
  ]);
});
