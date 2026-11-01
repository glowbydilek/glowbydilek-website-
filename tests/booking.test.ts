import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import {
  approve,
  BookingError,
  cancel,
  createLegacyRequest,
  createManual,
  createTimedRequest,
  decline,
  getAvailability,
  propose,
  reschedule,
  anonymizeCustomer,
  exportCustomer,
  searchCustomers,
} from "../src/lib/booking/service.ts";
import { processOutbox, resend } from "../src/lib/notifications/outbox.ts";
import { seedTreatments } from "../src/lib/db/seed.ts";
import { setSetting } from "../src/lib/db/settings.ts";
import { appointments, customers, outbox, treatments, weeklyHours, blocks } from "../src/lib/db/schema.ts";
import { localToUtc } from "../src/lib/time.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

const ctx = { userId: 1, ownerEmail: "hello@glowbydilek.nl" };
// A Monday far enough ahead for every notice rule.
const DAY = "2027-03-01";

describe("booking against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;

  beforeEach(async () => {
    db = await resetDb();
    await seedTreatments(db);
    await db.update(treatments).set({ durationMinutes: 45, bufferMinutes: 15, bookableOnline: true }).where(eq(treatments.id, "brazilian"));
    await db.update(treatments).set({ durationMinutes: 30, bufferMinutes: 0, bookableOnline: true }).where(eq(treatments.id, "eyebrows"));
    await db.insert(weeklyHours).values([1, 2, 3, 4, 5].map((weekday) => ({ weekday, kind: "open", startMinute: 540, endMinute: 720 })));
    await setSetting(db, "booking", { onlineBookingEnabled: true, minNoticeHours: 0, maxAdvanceDays: 800, slotStepMinutes: 15, capacity: 1 });
    await setSetting(db, "private", { locationDetails: "Adres volgt in deze test." });
  });

  const customer = { firstName: "Sara", lastName: "de Vries", email: "sara@example.com", phone: "0612345678", locale: "nl" as const };

  test("seeding never invents prices or durations and never overwrites owner edits", async () => {
    const all = await db.select().from(treatments);
    assert.equal(all.length, 13);
    assert.ok(all.filter((t) => !["brazilian", "eyebrows"].includes(t.id)).every((t) => t.priceCents === null && t.durationMinutes === null));
    await db.update(treatments).set({ priceCents: 4500 }).where(eq(treatments.id, "chin"));
    await seedTreatments(db);
    const [chin] = await db.select().from(treatments).where(eq(treatments.id, "chin"));
    assert.equal(chin.priceCents, 4500);
  });

  test("availability follows working hours, durations and existing bookings", async () => {
    const a = await getAvailability(db, ["brazilian"], DAY, DAY, new Date("2027-02-01T00:00:00Z"));
    assert.equal(a.duration, 45);
    assert.deepEqual(a.slots[DAY].slice(0, 3), [540, 555, 570]);
    assert.equal(a.slots[DAY].at(-1), 675); // 11:15 + 45 = 12:00
    // treatment without a confirmed duration is never offered
    assert.deepEqual(await getAvailability(db, ["chin"], DAY, DAY), { duration: null, slots: {} });
    await createManual(db, { ...customer, treatmentIds: ["brazilian"], day: DAY, minute: 600 }, ctx);
    const b = await getAvailability(db, ["brazilian"], DAY, DAY, new Date("2027-02-01T00:00:00Z"));
    // 10:00–10:45 + 15 buffer occupies until 11:00
    assert.ok(!b.slots[DAY].includes(600) && !b.slots[DAY].includes(570) && b.slots[DAY].includes(660));
  });

  test("request → owner notified + customer acknowledged → approve → confirmation + reminder", async () => {
    const id = await createTimedRequest(db, { ...customer, treatmentIds: ["brazilian"], day: DAY, minute: 600, consent: true }, ctx);
    let mails = await db.select().from(outbox).where(eq(outbox.appointmentId, id));
    assert.deepEqual(mails.map((m) => m.kind).sort(), ["owner_request", "request_received"]);
    assert.ok(mails.find((m) => m.kind === "request_received")!.textBody.includes("nog geen bevestigde afspraak"));
    assert.ok(!mails.some((m) => m.textBody.includes("Adres volgt")), "no location before confirmation");
    // a pending request does not block the slot
    assert.ok((await getAvailability(db, ["brazilian"], DAY, DAY, new Date("2027-02-01"))).slots[DAY].includes(600));

    await approve(db, id, ctx);
    const [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a.status, "confirmed");
    mails = await db.select().from(outbox).where(eq(outbox.appointmentId, id));
    const confirmed = mails.find((m) => m.kind === "confirmed")!;
    assert.match(confirmed.subject, /maandag 1 maart 2027 om 10:00/);
    assert.ok(confirmed.textBody.includes("10:00 – 10:45"));
    assert.ok(confirmed.textBody.includes("Adres volgt in deze test."), "location only after confirmation");
    const reminder = mails.find((m) => m.kind === "reminder")!;
    assert.equal(reminder.sendAfter.toISOString(), new Date(localToUtc(DAY, 600).getTime() - 24 * 3600_000).toISOString());
    // approving twice is rejected; no duplicate confirmation
    await assert.rejects(approve(db, id, ctx), (e: BookingError) => e.code === "invalidState");
    assert.equal((await db.select().from(outbox).where(eq(outbox.kind, "confirmed"))).length, 1);
  });

  test("concurrent approvals for the same time never double-book", async () => {
    const ids = [];
    for (let i = 0; i < 5; i++) ids.push(await createTimedRequest(db, { ...customer, email: `c${i}@example.com`, treatmentIds: ["brazilian"], day: DAY, minute: 600, consent: true }, ctx));
    const results = await Promise.allSettled(ids.map((id) => approve(db, id, ctx)));
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1, "exactly one approval wins");
    assert.ok(results.filter((r) => r.status === "rejected").every((r) => ((r as PromiseRejectedResult).reason as BookingError).code === "conflict"));
    const confirmed = await db.select().from(appointments).where(eq(appointments.status, "confirmed"));
    assert.equal(confirmed.length, 1);
  });

  test("concurrent manual bookings respect capacity 2", async () => {
    await setSetting(db, "booking", { capacity: 2, minNoticeHours: 0, maxAdvanceDays: 800, slotStepMinutes: 15 });
    const attempts = await Promise.allSettled(
      [0, 1, 2, 3].map((i) => createManual(db, { ...customer, email: `m${i}@example.com`, phone: null, treatmentIds: ["eyebrows"], day: DAY, minute: 600 }, ctx)),
    );
    assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 2);
  });

  test("taken slot → propose another time → confirm; decline sends a polite email", async () => {
    await createManual(db, { ...customer, email: "x@example.com", phone: null, treatmentIds: ["brazilian"], day: DAY, minute: 600 }, ctx);
    const id = await createTimedRequest(db, { ...customer, treatmentIds: ["eyebrows"], day: DAY, minute: 660, consent: true }, ctx);
    await createManual(db, { ...customer, email: "y@example.com", phone: null, treatmentIds: ["eyebrows"], day: DAY, minute: 660 }, ctx);
    await assert.rejects(approve(db, id, ctx), (e: BookingError) => e.code === "conflict");
    await propose(db, id, ctx, { day: DAY, minute: 540, message: "Past 09:00 ook?" });
    let [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a.status, "proposed");
    // a proposal holds the slot
    assert.ok(!(await getAvailability(db, ["eyebrows"], DAY, DAY, new Date("2027-02-01"))).slots[DAY].includes(540));
    await approve(db, id, ctx);
    [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a.status, "confirmed");
    const other = await createTimedRequest(db, { ...customer, email: "z@example.com", treatmentIds: ["eyebrows"], day: DAY, minute: 690, consent: true }, ctx);
    await decline(db, other, ctx, { message: "Helaas vol." });
    const mails = await db.select().from(outbox).where(eq(outbox.appointmentId, other));
    assert.ok(mails.some((m) => m.kind === "declined" && m.textBody.includes("Helaas vol.")));
  });

  test("reschedule moves the reminder; cancel frees the slot and cancels the reminder", async () => {
    const id = await createManual(db, { ...customer, treatmentIds: ["brazilian"], day: DAY, minute: 600 }, ctx);
    await reschedule(db, id, ctx, { day: "2027-03-02", minute: 540 });
    let mails = await db.select().from(outbox).where(eq(outbox.appointmentId, id));
    assert.equal(mails.filter((m) => m.kind === "reminder" && m.status === "pending").length, 1);
    assert.equal(mails.filter((m) => m.kind === "reminder" && m.status === "cancelled").length, 1);
    assert.ok(mails.some((m) => m.kind === "rescheduled" && m.subject.includes("dinsdag 2 maart 2027 om 09:00")));
    await cancel(db, id, ctx, { message: "Sorry!" });
    mails = await db.select().from(outbox).where(eq(outbox.appointmentId, id));
    assert.equal(mails.filter((m) => m.kind === "reminder" && m.status === "pending").length, 0);
    assert.ok(mails.some((m) => m.kind === "cancelled"));
    assert.ok((await getAvailability(db, ["brazilian"], "2027-03-02", "2027-03-02", new Date("2027-02-01"))).slots["2027-03-02"].includes(540));
    // history is kept
    const [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a.status, "cancelled");
  });

  test("working hours and blocks are enforced; owner may explicitly book outside hours", async () => {
    await assert.rejects(createManual(db, { ...customer, treatmentIds: ["eyebrows"], day: DAY, minute: 13 * 60 }, ctx), (e: BookingError) => e.code === "outsideHours");
    await createManual(db, { ...customer, treatmentIds: ["eyebrows"], day: DAY, minute: 13 * 60, allowOutsideHours: true }, ctx);
    await db.insert(blocks).values({ startAt: localToUtc("2027-03-03", 0), endAt: localToUtc("2027-03-04", 0), reason: "Vakantie" });
    await assert.rejects(createManual(db, { ...customer, treatmentIds: ["eyebrows"], day: "2027-03-03", minute: 600 }, ctx), (e: BookingError) => e.code === "conflict");
    assert.equal((await getAvailability(db, ["eyebrows"], "2027-03-03", "2027-03-03", new Date("2027-02-01"))).slots["2027-03-03"], undefined);
  });

  test("outbox: SMTP failure is retried, never lost, never sent twice; reminders skip stale appointments", async () => {
    const id = await createManual(db, { ...customer, treatmentIds: ["brazilian"], day: DAY, minute: 600 }, ctx);
    let fail = true;
    const sent: string[] = [];
    const sender = async (m: { subject: string }) => {
      if (fail) throw Object.assign(new Error("smtp down"), { code: "ECONNECTION" });
      sent.push(m.subject);
    };
    const r1 = await processOutbox(db, sender);
    assert.equal(r1.failed, 1);
    const [row] = await db.select().from(outbox).where(eq(outbox.kind, "confirmed"));
    assert.equal(row.status, "pending");
    assert.equal(row.lastError, "ECONNECTION");
    assert.ok(row.sendAfter > new Date());
    fail = false;
    assert.equal((await processOutbox(db, sender)).sent, 0, "waits for the backoff");
    await resend(db, row.id);
    const r2 = await Promise.all([processOutbox(db, sender), processOutbox(db, sender)]);
    assert.equal(r2[0].sent + r2[1].sent, 1, "parallel runs send once");
    assert.equal(sent.length, 1);
    // the reminder becomes due; but the appointment was moved → stale reminder is not sent
    await reschedule(db, id, ctx, { day: "2027-03-02", minute: 600 });
    const due = new Date(localToUtc("2027-03-02", 600).getTime() - 3600_000);
    const r3 = await processOutbox(db, sender, { now: due });
    // The move itself is always mailed (material change), then exactly one reminder: the stale one is skipped.
    assert.equal(r3.sent, 2);
    assert.equal(sent.filter((s) => s.startsWith("Herinnering")).length, 1, "only the current reminder");
    assert.ok(sent.at(-1)!.startsWith("Herinnering"));
  });

  test("customer search, GDPR export and anonymisation", async () => {
    const id = await createManual(db, { ...customer, treatmentIds: ["brazilian"], day: DAY, minute: 600 }, ctx);
    const [c] = await db.select().from(customers);
    assert.equal((await searchCustomers(db, "sara")).length, 1);
    assert.equal((await searchCustomers(db, "06 1234")).length, 1);
    assert.equal((await searchCustomers(db, "Vries")).length, 1);
    const ex = await exportCustomer(db, c.id);
    assert.equal(ex.appointments.length, 1);
    await anonymizeCustomer(db, c.id, ctx);
    const [anon] = await db.select().from(customers);
    assert.equal(anon.email, null);
    assert.equal(anon.phone, null);
    assert.equal((await searchCustomers(db, "sara")).length, 0);
    const [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a.status, "cancelled", "future appointment cancelled, history kept");
  });

  test("legacy request form is stored as a pending request", async () => {
    const id = await createLegacyRequest(db, { ...customer, treatmentIds: ["brazilian", "eyebrows"], preferredDate: DAY, timeRange: "morning" }, ctx);
    const [a] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(a.status, "requested");
    assert.equal(a.startAt, null);
    await approve(db, id, ctx, { day: DAY, minute: 540, durationMinutes: 75 });
    const [b] = await db.select().from(appointments).where(eq(appointments.id, id));
    assert.equal(b.status, "confirmed");
    assert.equal((b.endAt!.getTime() - b.startAt!.getTime()) / 60000, 75);
  });
});
