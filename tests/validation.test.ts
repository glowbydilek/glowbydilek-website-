import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeHtml, isLikelySpam, validateAppointment, validateContact } from "../src/lib/forms/validation.ts";

const today = new Date("2026-11-02T10:00:00Z");
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
    assert.deepEqual(r.errors, {
      name: "required",
      email: "invalid",
      topic: "required",
      message: "tooShort",
      privacy: "consent",
    });
  }
});

test("contact: rejects invalid phone, strips header-injection newlines from name", () => {
  const bad = validateContact({ ...validContact, phone: "call me" });
  assert.equal(bad.ok, false);
  const r = validateContact({ ...validContact, name: "Sara\r\nBcc: evil@x.com" });
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(!/[\r\n]/.test(r.data.name));
});

test("appointment: accepts a valid request, filters unknown treatments", () => {
  const r = validateAppointment(
    {
      treatments: ["eyebrows", "laser", "eyebrows"],
      preferredDate: "2026-11-10",
      timeRange: "evening",
      name: "Amira",
      email: "amira@example.nl",
      phone: "+31 6 12345678",
      privacy: true,
    },
    ids,
    today,
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.data.treatments, ["eyebrows"]);
    assert.equal(r.data.locale, "nl");
  }
});

test("appointment: rejects past dates, far-future dates and missing choices", () => {
  const past = validateAppointment({ treatments: ["brazilian"], preferredDate: "2026-11-01", timeRange: "morning", name: "Al", email: "a@b.nl", privacy: true }, ids, today);
  assert.equal(!past.ok && past.errors.preferredDate, "pastDate");
  const far = validateAppointment({ treatments: ["brazilian"], preferredDate: "2028-01-01", timeRange: "morning", name: "Al", email: "a@b.nl", privacy: true }, ids, today);
  assert.equal(!far.ok && far.errors.preferredDate, "tooFar");
  const empty = validateAppointment({ treatments: ["laser"], preferredDate: "x", privacy: true }, ids, today);
  assert.equal(empty.ok, false);
  if (!empty.ok) {
    assert.equal(empty.errors.treatments, "required");
    assert.equal(empty.errors.preferredDate, "invalid");
    assert.equal(empty.errors.timeRange, "required");
  }
});

test("spam: honeypot and timing checks", () => {
  const now = 1_000_000;
  assert.equal(isLikelySpam({ company: "", startedAt: now - 10_000 }, now), false);
  assert.equal(isLikelySpam({ company: "Acme", startedAt: now - 10_000 }, now), true);
  assert.equal(isLikelySpam({ startedAt: now - 500 }, now), true);
  assert.equal(isLikelySpam({}, now), true);
});

test("escapeHtml escapes markup", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});
