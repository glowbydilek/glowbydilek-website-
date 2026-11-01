import assert from "node:assert/strict";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import { publicSocial, validateAnalytics, validateSocial } from "../src/lib/cms/menu.ts";
import { createManual, markCompleted } from "../src/lib/booking/service.ts";
import { displayName, inviteForReview, moderateReview, publishedReviews, reportReview, submitReview, validateReview } from "../src/lib/reviews/service.ts";
import { seedTreatments } from "../src/lib/db/seed.ts";
import { outbox, reviewInvites, reviews, treatments, weeklyHours } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

test("social links: only https profiles on the network's own domain; nothing shown by default", () => {
  assert.deepEqual(publicSocial(undefined), []);
  const ok = validateSocial({ links: [{ network: "tiktok", url: "https://www.tiktok.com/@glow", enabled: true }, { network: "instagram", url: "https://www.instagram.com/glow", enabled: true }] });
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.value.links.map((l) => l.network), ["tiktok", "instagram", "facebook"]);
  for (const url of ["http://instagram.com/x", "https://evil.example/instagram.com", "javascript:alert(1)", "https://user:pw@instagram.com/x", "https://www.instagram.com/"]) {
    const v = validateSocial({ links: [{ network: "instagram", url, enabled: true }] });
    assert.ok(v.errors.length, url);
    assert.equal(publicSocial({ links: [{ network: "instagram", url, enabled: true }] }).length, 0);
  }
  assert.equal(publicSocial({ links: [{ network: "facebook", url: "https://www.facebook.com/glow", enabled: false }] }).length, 0);
});

test("analytics: only a valid GA4 Measurement ID can be enabled", () => {
  assert.deepEqual(validateAnalytics({ measurementId: "g-abc123def4", enabled: true }).value, { measurementId: "G-ABC123DEF4", enabled: true });
  assert.equal(validateAnalytics({ measurementId: "UA-123", enabled: true }).value.enabled, false);
  assert.equal(validateAnalytics({ measurementId: "", enabled: true }).value.enabled, false);
  assert.equal(validateAnalytics({ measurementId: "<script>", enabled: true }).errors.length, 1);
});

test("review validation: rating, length, no links, consent required", () => {
  assert.equal(validateReview({ rating: 5, body: "Heel fijne behandeling, rustig en netjes gedaan.", displayName: "Sara", privacy: true }).ok, true);
  const bad = validateReview({ rating: 9, body: "kort http://spam.example", displayName: "", privacy: false });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["body", "displayName", "privacy", "rating"]);
  assert.equal(displayName({ displayName: "Sara de Vries", displayMode: "initials" }, "Anoniem"), "S. D. V.");
  assert.equal(displayName({ displayName: "Sara de Vries", displayMode: "anonymous" }, "Anoniem"), "Anoniem");
  assert.equal(displayName({ displayName: "Sara de Vries van Dam", displayMode: "name" }, "Anoniem"), "Sara de");
});

describe("reviews against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  beforeEach(async () => {
    db = await resetDb();
    await seedTreatments(db);
    await db.update(treatments).set({ durationMinutes: 30 }).where(eq(treatments.id, "eyebrows"));
    await db.insert(weeklyHours).values([{ weekday: 1, kind: "open", startMinute: 540, endMinute: 720 }]);
  });
  const input = { rating: 4, body: "Fijne ervaring, duidelijke uitleg vooraf.", displayName: "Sara", displayMode: "name" as const, locale: "nl" as const };

  test("nothing is public until the owner publishes; reports send a review back to moderation", async () => {
    const { id, verified } = await submitReview(db, input);
    assert.equal(verified, false);
    assert.equal((await publishedReviews(db, "Anoniem")).count, 0);
    await moderateReview(db, id, "publish", "", 1);
    const p = await publishedReviews(db, "Anoniem");
    assert.equal(p.count, 1);
    assert.equal(p.average, 4);
    for (let i = 0; i < 3; i++) await reportReview(db, id);
    assert.equal((await publishedReviews(db, "Anoniem")).count, 0);
    const [r] = await db.select().from(reviews);
    assert.equal(r.status, "pending");
  });

  test("an invitation after a completed visit marks the review verified, once", async () => {
    const appt = await createManual(db, { firstName: "Sara", lastName: "Test", email: "sara@example.com", phone: null, treatmentIds: ["eyebrows"], day: "2027-03-01", minute: 600 }, { userId: 1 });
    await assert.rejects(inviteForReview(db, appt, 1, "https://glowbydilek.nl"), /afgeronde/);
    await markCompleted(db, appt, { userId: 1 });
    await inviteForReview(db, appt, 1, "https://glowbydilek.nl");
    await assert.rejects(inviteForReview(db, appt, 1, "https://glowbydilek.nl"), /al een uitnodiging/);
    const [mail] = await db.select().from(outbox).where(eq(outbox.kind, "review_invite"));
    const token = /t=([A-Za-z0-9_-]+)/.exec(mail.textBody)![1];
    const [inv] = await db.select().from(reviewInvites);
    assert.notEqual(inv.tokenHash, token, "only the hash is stored");
    const a = await submitReview(db, { ...input, inviteToken: token });
    assert.equal(a.verified, true);
    const b = await submitReview(db, { ...input, body: "Tweede poging met dezelfde link.", inviteToken: token });
    assert.equal(b.verified, false, "single use");
  });
});
