import { test } from "node:test";
import assert from "node:assert/strict";
import { isClosedDay, isoWeekday, isSelectable, monthGrid, shiftMonths } from "../src/lib/booking/calendar.ts";

test("calendar grid is Monday-first with blanks around the month", () => {
  // November 2026 starts on a Sunday: six blanks, then the 1st.
  const g = monthGrid("2026-11-15");
  assert.deepEqual(g[0], [null, null, null, null, null, null, "2026-11-01"]);
  assert.equal(g.flat().filter(Boolean).length, 30);
  assert.ok(g.every((w) => w.length === 7));
  // February 2027 (28 days) starts on a Monday: exactly four rows.
  assert.equal(monthGrid("2027-02-10").length, 4);
  assert.equal(isoWeekday("2026-11-02"), 1);
  assert.equal(isoWeekday("2026-11-01"), 7);
});

test("month steps clamp to the last day of shorter months, across years", () => {
  assert.equal(shiftMonths("2027-01-31", 1), "2027-02-28");
  assert.equal(shiftMonths("2026-12-15", 1), "2027-01-15");
  assert.equal(shiftMonths("2026-03-31", -1), "2026-02-28");
});

test("closed weekdays, closed dates and the range are not selectable", () => {
  const cal = { closedWeekdays: [7], closedDates: ["2026-12-25"] };
  assert.equal(isClosedDay(cal, "2026-11-08"), true, "Sunday");
  assert.equal(isClosedDay(cal, "2026-12-25"), true, "closed date");
  assert.equal(isSelectable(cal, "2026-11-09", "2026-11-02", "2027-11-02"), true);
  assert.equal(isSelectable(cal, "2026-11-01", "2026-11-02", "2027-11-02"), false, "before today");
  assert.equal(isSelectable(cal, "2027-11-03", "2026-11-02", "2027-11-02"), false, "after the maximum");
  // Without working hours nothing is closed by weekday.
  assert.equal(isClosedDay({ closedWeekdays: [], closedDates: [] }, "2026-11-08"), false);
});
