import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  amsterdamToday,
  escapeHtml,
  isLikelySpam,
  validateAppointment,
  validateContact,
} from "../src/lib/forms/validation.ts";

const today = "2026-11-02";
const ids = ["eyebrows", "brazilian"];

const validContact = {
  locale: "en",
  name: "Sara Jansen",
  email: "Sara@Example.com",
  topic: "question",
  message: "Hello, I have a question about waxing.",
  privacy: true,
};

test("contact: accepts a valid message and normalises email", () => {
  const r = validateContact(validContact);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.email, "sara@example.com");
    assert.equal(r.data.locale, "en");
    assert.equal(r.data.phone, undefined);
  }
});

test("contact: reports missing fields, bad email and missing consent", () => {
  const r = validateContact({ name: "", email: "nope", message: "short", privacy: false });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.deepEqual(r.errors, { name: "required", email: "invalid", topic: "required", message: "tooShort", privacy: "consent" });
  }
});

test("contact: consent must be literally true", () => {
  const r = validateContact({ ...validContact, privacy: "true" });
  assert.equal(!r.ok && r.errors.privacy, "consent");
});

test("contact: rejects invalid phone, strips header-injection newlines from name", () => {
  assert.equal(validateContact({ ...validContact, phone: "call me" }).ok, false);
  const r = validateContact({ ...validContact, name: "Sara\r\nBcc: evil@x.com" });
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(!/[\r\n]/.test(r.data.name));
});

test("appointment: accepts a valid request, filters unknown and duplicate treatments", () => {
  const r = validateAppointment(
    { treatments: ["eyebrows", "laser", "eyebrows"], preferredDate: "2026-11-10", timeRange: "evening", name: "Amira", email: "amira@example.nl", phone: "+31 6 12345678", privacy: true },
    ids,
    today,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.data.treatments, ["eyebrows"]);
    assert.equal(r.data.locale, "nl");
  }
});

test("appointment: today is allowed; past, far-future and impossible dates are not", () => {
  const base = { treatments: ["brazilian"], timeRange: "morning", name: "Al", email: "a@b.nl", privacy: true };
  assert.equal(validateAppointment({ ...base, preferredDate: today }, ids, today).ok, true);
  const past = validateAppointment({ ...base, preferredDate: "2026-11-01" }, ids, today);
  assert.equal(!past.ok && past.errors.preferredDate, "pastDate");
  const far = validateAppointment({ ...base, preferredDate: "2028-01-01" }, ids, today);
  assert.equal(!far.ok && far.errors.preferredDate, "tooFar");
  const impossible = validateAppointment({ ...base, preferredDate: "2027-02-30" }, ids, today);
  assert.equal(!impossible.ok && impossible.errors.preferredDate, "invalid");
});

test("appointment: reports missing choices", () => {
  const r = validateAppointment({ treatments: ["laser"], preferredDate: "x", privacy: true }, ids, today);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.errors.treatments, "required");
    assert.equal(r.errors.preferredDate, "invalid");
    assert.equal(r.errors.timeRange, "required");
  }
});

test("amsterdamToday uses Europe/Amsterdam, not UTC", () => {
  // 23:30 UTC on 1 Nov = 00:30 on 2 Nov in Amsterdam (CET, UTC+1)
  assert.equal(amsterdamToday(new Date("2026-11-01T23:30:00Z")), "2026-11-02");
  // 22:30 UTC in summer = 00:30 next day (CEST, UTC+2)
  assert.equal(amsterdamToday(new Date("2026-07-14T22:30:00Z")), "2026-07-15");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("spam: honeypot and browser-measured timing", () => {
  assert.equal(isLikelySpam({ company: "", elapsedMs: 10_000 }), false);
  assert.equal(isLikelySpam({ company: "Acme", elapsedMs: 10_000 }), true);
  assert.equal(isLikelySpam({ elapsedMs: 500 }), true);
  assert.equal(isLikelySpam({}), true);
  // a visitor's wrong device clock no longer matters: only elapsed time is used
  assert.equal(isLikelySpam({ elapsedMs: 45_000, startedAt: 0 }), false);
});

test("escapeHtml escapes markup", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});
