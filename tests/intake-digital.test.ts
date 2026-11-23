import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, beforeEach, describe, test } from "node:test";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { saveConsultationSettings } from "../src/lib/consultation/service.ts";
import { customers, intakeDocuments, intakeRequests, outbox } from "../src/lib/db/schema.ts";
import { approveAndSendIntake, openCopy, openRequest, sendIntakeRequest, submitIntake, validateSubmission, type IntakeSubmission } from "../src/lib/intake/digital.ts";
import { decryptFile } from "../src/lib/intake/service.ts";
import type { ParsedIntake } from "../src/lib/intake/template.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

// A drawn signature: a small PNG with a stroke, well above the minimum size.
async function signaturePng() {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140"><path d="M10 100 C 80 10, 160 130, 240 40 S 360 120, 390 30" stroke="#2b202b" stroke-width="3" fill="none"/></svg>');
  return `data:image/png;base64,${(await sharp(svg).png().toBuffer()).toString("base64")}`;
}

function answersFor(p: ParsedIntake) {
  const a: Record<string, string> = {};
  p.blocks.forEach((b, bi) => {
    if (b.type === "questions") b.items.forEach((_, ii) => (a[`q.${bi}.${ii}`] = p.answers[1]));
    if (b.type === "statements") b.items.forEach((_, ii) => (a[`s.${bi}.${ii}`] = "yes"));
  });
  return a;
}

describe("digital intake against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  let customerId: number;
  const owner = { userId: 1, mfa: true };

  beforeEach(async () => {
    db = await resetDb();
    process.env.INTAKE_DOCUMENT_KEY = randomBytes(32).toString("base64");
    await saveConsultationSettings(db, { consentConfirmed: true, noticeConfirmed: true, assessmentConfirmed: true, retentionMonths: 24, confirmedAt: null }, 1);
    const [r] = (await db.insert(customers).values({ firstName: "Sara", lastName: "Test", email: "sara@example.com", locale: "tr" })) as unknown as [{ insertId: number }];
    customerId = r.insertId;
  });

  async function sendAndToken() {
    await sendIntakeRequest(db, customerId, owner);
    const [m] = await db.select().from(outbox).where(eq(outbox.kind, "intake_request"));
    const token = /\/intake\/([A-Za-z0-9_-]+)/.exec(m.textBody)?.[1];
    assert.ok(token, "link in the e-mail");
    return { token: token!, mail: m };
  }

  test("the owner sends a link in the customer's language; only a hash of the token is stored", async () => {
    const { token, mail } = await sendAndToken();
    assert.equal(mail.toEmail, "sara@example.com");
    assert.match(mail.subject, /Ön bilgi formun/);
    const [r] = await db.select().from(intakeRequests);
    assert.notEqual(r.tokenHash, token);
    assert.equal(r.tokenHash.length, 64);
    const open = await openRequest(db, token);
    assert.equal(open?.locale, "tr");
    assert.equal(await openRequest(db, "x".repeat(32)), null);
  });

  test("a new link cancels the previous one", async () => {
    const first = await sendAndToken();
    await db.delete(outbox);
    const second = await sendAndToken();
    assert.equal(await openRequest(db, first.token), null);
    assert.ok(await openRequest(db, second.token));
  });

  test("submitting stores an encrypted PDF once; the link then stops working; the owner can mark it checked", async () => {
    const { token } = await sendAndToken();
    const req = (await openRequest(db, token))!;
    const s: IntakeSubmission = { answers: answersFor(req.parsed), name: "Sara Test", consent: true, signature: await signaturePng() };
    const r = await submitIntake(db, token, s);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.pdf.subarray(0, 5).toString(), "%PDF-");
    const [d] = await db.select().from(intakeDocuments);
    assert.equal(d.source, "digital");
    assert.equal(d.status, "current");
    assert.equal(d.reviewedAt, null);
    const plain = decryptFile(Buffer.from(d.dataEnc!), Buffer.from(process.env.INTAKE_DOCUMENT_KEY!, "base64"));
    assert.deepEqual(plain, r.pdf);
    assert.equal((await submitIntake(db, token, s)).ok, false, "single use");
    assert.equal(await openRequest(db, token), null);
    await db.delete(outbox);
    assert.deepEqual(await approveAndSendIntake(db, customerId, d.id, { userId: 1 }), { sent: true });
    const [u] = await db.select().from(intakeDocuments);
    assert.ok(u.reviewedAt);
    const [mail] = await db.select().from(outbox).where(eq(outbox.kind, "intake_copy"));
    assert.equal(mail.toEmail, "sara@example.com");
    assert.equal(mail.attachmentKind, null, "no health data attached to the e-mail");
    const copyToken = /\/intake\/kopie\/([A-Za-z0-9_-]+)/.exec(mail.textBody)?.[1];
    assert.ok(copyToken);
    assert.notEqual(u.copyTokenHash, copyToken);
    const copy = await openCopy(db, copyToken!);
    assert.deepEqual(copy?.data, r.pdf);
    assert.equal(copy?.mime, "application/pdf");
    assert.equal(await openCopy(db, "y".repeat(32)), null);
    await db.update(intakeDocuments).set({ copyExpiresAt: new Date(Date.now() - 1000) });
    assert.equal(await openCopy(db, copyToken!), null, "expired link");
  });

  test("incomplete answers, missing consent or a missing signature are refused and nothing is stored", async () => {
    const { token } = await sendAndToken();
    const req = (await openRequest(db, token))!;
    const good = { answers: answersFor(req.parsed), name: "Sara Test", consent: true, signature: await signaturePng() };
    assert.equal(validateSubmission(req.parsed, good).ok, true);
    assert.deepEqual(validateSubmission(req.parsed, { ...good, consent: false }), { ok: false, error: "consent" });
    assert.deepEqual(validateSubmission(req.parsed, { ...good, signature: "data:image/png;base64,AAAA" }), { ok: false, error: "signature" });
    assert.deepEqual(validateSubmission(req.parsed, { ...good, answers: {} }), { ok: false, error: "questions" });
    assert.deepEqual(validateSubmission(req.parsed, { ...good, name: "" }), { ok: false, error: "name" });
    assert.equal((await submitIntake(db, token, { ...good, consent: false })).ok, false);
    assert.equal((await db.select().from(intakeDocuments)).length, 0);
    assert.ok(await openRequest(db, token), "link still open after a refused attempt");
  });

  test("approving a form of a customer without e-mail marks it approved and sends nothing", async () => {
    const { token } = await sendAndToken();
    const req = (await openRequest(db, token))!;
    const r = await submitIntake(db, token, { answers: answersFor(req.parsed), name: "Sara Test", consent: true, signature: await signaturePng() });
    assert.equal(r.ok, true);
    await db.update(customers).set({ email: null }).where(eq(customers.id, customerId));
    await db.delete(outbox);
    const [d] = await db.select().from(intakeDocuments);
    assert.deepEqual(await approveAndSendIntake(db, customerId, d.id, { userId: 1 }), { sent: false });
    assert.equal((await db.select().from(outbox)).length, 0);
    assert.ok((await db.select().from(intakeDocuments))[0].reviewedAt);
  });

  test("without the encryption key no link can be sent", async () => {
    delete process.env.INTAKE_DOCUMENT_KEY;
    await assert.rejects(sendIntakeRequest(db, customerId, owner), /INTAKE_DOCUMENT_KEY/);
  });
});
