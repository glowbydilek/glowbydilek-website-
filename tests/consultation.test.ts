import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import {
  consultationEnabled,
  decryptAnswers,
  encryptAnswers,
  exportConsultation,
  purgeExpiredConsultations,
  readConsultation,
  saveConsultation,
  saveConsultationSettings,
  type ConsultationAnswers,
} from "../src/lib/consultation/service.ts";
import { anonymizeCustomer, exportCustomer } from "../src/lib/booking/service.ts";
import { auditLogs, consultations, customers } from "../src/lib/db/schema.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

const answers: ConsultationAnswers = {
  allergy: "yes",
  allergyNote: "colofonium",
  skinThinning: "no",
  skinThinningNote: "",
  bloodThinners: "no",
  skinCondition: "unknown",
  skinConditionNote: "",
  healing: "no",
  precautions: "hypoallergene wax",
};

test("answers are encrypted with AES-GCM and cannot be read or altered without the key", () => {
  const key = randomBytes(32);
  const enc = encryptAnswers(answers, key);
  assert.ok(!enc.includes("colofonium"));
  assert.deepEqual(decryptAnswers(enc, key), answers);
  assert.throws(() => decryptAnswers(enc, randomBytes(32)));
  const tampered = enc.slice(0, -2) + (enc.endsWith("A") ? "BB" : "AA");
  assert.throws(() => decryptAnswers(tampered, key));
});

describe("consultation against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  let customerId: number;
  const owner = { userId: 1, mfa: true };
  beforeEach(async () => {
    db = await resetDb();
    process.env.CONSULTATION_KEY = randomBytes(32).toString("base64");
    const [r] = (await db.insert(customers).values({ firstName: "Sara", lastName: "Test", email: "sara@example.com" })) as unknown as [{ insertId: number }];
    customerId = r.insertId;
  });

  test("stays off until the key, the legal confirmations and MFA are all in place", async () => {
    assert.equal((await consultationEnabled(db)).enabled, false);
    await assert.rejects(saveConsultation(db, customerId, { answers, consentMethod: "in_person", consentGiven: true }, owner), /voorwaarden/);
    await saveConsultationSettings(db, { consentConfirmed: true, noticeConfirmed: true, assessmentConfirmed: true, retentionMonths: 24, confirmedAt: null }, 1);
    assert.equal((await consultationEnabled(db)).enabled, true);
    await assert.rejects(saveConsultation(db, customerId, { answers, consentMethod: "in_person", consentGiven: true }, { userId: 1, mfa: false }), /tweestapsverificatie/);
    await assert.rejects(saveConsultation(db, customerId, { answers, consentMethod: "in_person", consentGiven: false }, owner), /toestemming/);
    delete process.env.CONSULTATION_KEY;
    assert.equal((await consultationEnabled(db)).enabled, false);
  });

  test("stored encrypted, every access audited, excluded from the general export, removed on anonymisation", async () => {
    await saveConsultationSettings(db, { consentConfirmed: true, noticeConfirmed: true, assessmentConfirmed: true, retentionMonths: 24, confirmedAt: null }, 1);
    await saveConsultation(db, customerId, { answers, consentMethod: "written", consentGiven: true }, owner);
    const [row] = await db.select().from(consultations);
    assert.ok(!row.dataEnc.includes("colofonium"));
    const read = await readConsultation(db, customerId, owner);
    assert.equal(read?.answers.allergyNote, "colofonium");
    const ex = await exportConsultation(db, customerId, owner);
    assert.equal(ex?.answers.precautions, "hypoallergene wax");
    const actions = (await db.select().from(auditLogs)).map((a) => a.action);
    for (const a of ["consultation.updated", "consultation.viewed", "consultation.exported"]) assert.ok(actions.includes(a), a);
    const general = JSON.stringify(await exportCustomer(db, customerId));
    assert.ok(!general.includes("colofonium") && !general.includes("data_enc") && !general.includes("dataEnc"));
    await anonymizeCustomer(db, customerId, { userId: 1 });
    assert.equal((await db.select().from(consultations)).length, 0);
  });

  test("retention: answers not reviewed within the period are deleted automatically", async () => {
    await saveConsultationSettings(db, { consentConfirmed: true, noticeConfirmed: true, assessmentConfirmed: true, retentionMonths: 12, confirmedAt: null }, 1);
    await saveConsultation(db, customerId, { answers, consentMethod: "in_person", consentGiven: true }, owner);
    await db.update(consultations).set({ reviewedAt: new Date("2020-01-01") }).where(eq(consultations.customerId, customerId));
    assert.equal(await purgeExpiredConsultations(db), 1);
    assert.equal((await db.select().from(consultations)).length, 0);
  });
});
