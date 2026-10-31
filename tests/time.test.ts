import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dayBoundsUtc, isoWeekday, localToUtc, offsetMinutes, startOfWeek, toLocalParts } from "../src/lib/time.ts";

test("winter and summer offsets", () => {
  assert.equal(localToUtc("2026-01-15", 9 * 60).toISOString(), "2026-01-15T08:00:00.000Z");
  assert.equal(localToUtc("2026-07-15", 9 * 60).toISOString(), "2026-07-15T07:00:00.000Z");
});

test("March DST transition (29 March 2026): 02:00–03:00 does not exist", () => {
  assert.equal(localToUtc("2026-03-29", 1 * 60 + 30).toISOString(), "2026-03-29T00:30:00.000Z");
  assert.equal(localToUtc("2026-03-29", 3 * 60).toISOString(), "2026-03-29T01:00:00.000Z");
  assert.equal(localToUtc("2026-03-29", 9 * 60).toISOString(), "2026-03-29T07:00:00.000Z");
  // a non-existent time is moved forward, never backwards
  assert.equal(localToUtc("2026-03-29", 2 * 60 + 30).toISOString(), "2026-03-29T01:30:00.000Z");
  const { start, end } = dayBoundsUtc("2026-03-29");
  assert.equal((end.getTime() - start.getTime()) / 3600000, 23, "the March day has 23 hours");
});

test("October DST transition (25 October 2026): 02:00–03:00 happens twice", () => {
  assert.equal(localToUtc("2026-10-25", 9 * 60).toISOString(), "2026-10-25T08:00:00.000Z");
  assert.equal(localToUtc("2026-10-24", 9 * 60).toISOString(), "2026-10-24T07:00:00.000Z");
  // ambiguous 02:30 resolves to the first occurrence (CEST)
  assert.equal(localToUtc("2026-10-25", 2 * 60 + 30).toISOString(), "2026-10-25T00:30:00.000Z");
  const { start, end } = dayBoundsUtc("2026-10-25");
  assert.equal((end.getTime() - start.getTime()) / 3600000, 25, "the October day has 25 hours");
});

test("round trip and helpers", () => {
  for (const [d, m] of [["2026-03-28", 600], ["2026-03-30", 600], ["2026-10-26", 75], ["2027-02-28", 1439]] as const) {
    const l = toLocalParts(localToUtc(d, m));
    assert.deepEqual([l.date, l.minutes], [d, m]);
  }
  assert.equal(offsetMinutes(new Date("2026-07-01T12:00:00Z")), 120);
  assert.equal(offsetMinutes(new Date("2026-12-01T12:00:00Z")), 60);
  assert.equal(isoWeekday("2026-11-02"), 1);
  assert.equal(isoWeekday("2026-11-08"), 7);
  assert.equal(startOfWeek("2026-11-05"), "2026-11-02");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});
