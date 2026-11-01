import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, beforeEach, describe, test } from "node:test";
import sharp from "sharp";
import { saveConsultationSettings } from "../src/lib/consultation/service.ts";
import { auditLogs, customers, intakeDocuments, intakeTemplates } from "../src/lib/db/schema.ts";
import { checkIntakeFile } from "../src/lib/intake/files.ts";
import { BUILTIN_INTAKE, checkIntakeSource, INITIAL_VERSION, nextVersion, parseIntake } from "../src/lib/intake/template.ts";
import {
  activateDraft,
  activeTemplate,
  createRevision,
  decryptFile,
  deleteIntakeDocument,
  encryptFile,
  intakeDocumentsFor,
  intakeStorageStatus,
  readIntakeDocument,
  saveDraft,
  uploadSignedIntake,
} from "../src/lib/intake/service.ts";
import { anonymizeCustomer } from "../src/lib/booking/service.ts";
import { closeDb, resetDb, skipDb } from "./helpers/db.ts";

// ───────────────────────────────────────────────────────────────── pure

test("the supplied v1 forms parse into the same structure in Dutch and English", () => {
  for (const locale of ["nl", "en"] as const) {
    const p = parseIntake(BUILTIN_INTAKE[locale], INITIAL_VERSION);
    const count = (t: string) => p.blocks.filter((b) => b.type === t).length;
    const questions = p.blocks.flatMap((b) => (b.type === "questions" ? b.items : []));
    assert.equal(questions.length, 12, `${locale}: 6 general + 6 treatment-specific questions`);
    assert.equal(p.blocks.flatMap((b) => (b.type === "statements" ? b.items : [])).length, 3, `${locale}: three consent boxes`);
    assert.equal(count("signature"), 2);
    assert.equal(p.blocks.flatMap((b) => (b.type === "options" ? b.items : [])).length, 6);
    assert.ok(p.blocks.some((b) => b.type === "signature" && b.parts.some((x) => x.includes(INITIAL_VERSION))), "version printed on the form");
    assert.equal(checkIntakeSource(BUILTIN_INTAKE[locale], INITIAL_VERSION).ok, true);
  }
  assert.deepEqual(parseIntake(BUILTIN_INTAKE.en, INITIAL_VERSION).answers, ["Yes", "No", "Not sure"]);
});

test("revisions get a new version and must keep title, consent, signature and version", () => {
  assert.equal(nextVersion("GBD-INTAKE-2026-11-v1", new Date("2026-11-20T12:00:00Z")), "GBD-INTAKE-2026-11-v2");
  assert.equal(nextVersion("GBD-INTAKE-2026-11-v3", new Date("2027-01-05T12:00:00Z")), "GBD-INTAKE-2027-01-v1");
  assert.equal(checkIntakeSource("# Kop\n~ Handtekening | Datum\n* Ja\n{version}", "GBD-INTAKE-2026-11-v2").ok, false, "no title");
  assert.equal(checkIntakeSource("= T\n* Ja\n{version}", "GBD-INTAKE-2026-11-v2").ok, false, "no signature");
  assert.equal(checkIntakeSource("= T\n~ H | D\n* Ja", "GBD-INTAKE-2026-11-v2").ok, false, "no version");
  assert.equal(checkIntakeSource("= T\n~ H | D\n* Ja\n{version}", "v2").ok, false, "bad version format");
  assert.equal(checkIntakeSource("= T\n~ H | D\n* Ja\n{version}\n> <script>x</script>", "GBD-INTAKE-2026-11-v2").ok, false);
});

const pdf = (body: string) => new TextEncoder().encode(`%PDF-1.7\n${body}\n%%EOF\n`);

test("uploads are checked by content, not by name or declared type", () => {
  assert.equal(checkIntakeFile(pdf("1 0 obj << /Type /Catalog >> endobj"), "application/pdf").ok, true);
  for (const bad of ["/JavaScript (app.alert(1))", "/JS (x)", "/Launch", "/EmbeddedFile", "/Encrypt 5 0 R"]) {
    assert.equal(checkIntakeFile(pdf(`1 0 obj << ${bad} >> endobj`), "application/pdf").ok, false, bad);
  }
  assert.equal(checkIntakeFile(new TextEncoder().encode("%PDF-1.7 truncated"), "application/pdf").ok, false, "incomplete PDF");
  assert.equal(checkIntakeFile(new TextEncoder().encode("<html><script>alert(1)</script>"), "image/jpeg").ok, false, "HTML renamed to .jpg");
  assert.equal(checkIntakeFile(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/png").ok, false, "declared type must match");
  assert.equal(checkIntakeFile(new Uint8Array(0), "").ok, false);
  assert.equal(checkIntakeFile(new Uint8Array(10 * 1024 * 1024 + 1).fill(0x25), "application/pdf").ok, false, "over 10 MB");
});

test("files are encrypted with AES-256-GCM; a wrong key or tampering fails", () => {
  const key = randomBytes(32);
  const data = Buffer.from("signed form contents");
  const enc = encryptFile(data, key);
  assert.ok(!enc.includes(data));
  assert.deepEqual(decryptFile(enc, key), data);
  assert.throws(() => decryptFile(enc, randomBytes(32)));
  const t = Buffer.from(enc);
  t[t.length - 1] ^= 1;
  assert.throws(() => decryptFile(t, key));
});

// ───────────────────────────────────────────────────────────── database

async function jpegWithGps(): Promise<File> {
  const buf = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#f5e6e7" } })
    .jpeg()
    .withExif({ IFD0: { Make: "TestPhone", Model: "X" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "52/1 22/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "4/1 53/1 0/1" } })
    .toBuffer();
  const meta = await sharp(buf).metadata();
  assert.ok(meta.exif && meta.exif.length > 0, "test image carries EXIF");
  return new File([new Uint8Array(buf)], "form.jpg", { type: "image/jpeg" });
}

describe("intake & consent against MariaDB", { skip: skipDb }, () => {
  after(closeDb);
  let db: Awaited<ReturnType<typeof resetDb>>;
  let customerId: number;
  const owner = { userId: 1, mfa: true };
  const confirm = () => saveConsultationSettings(db, { consentConfirmed: true, noticeConfirmed: true, assessmentConfirmed: true, retentionMonths: 24, confirmedAt: null }, 1);
  const input = async (over: Partial<Parameters<typeof uploadSignedIntake>[1]> = {}) => ({
    customerId,
    file: await jpegWithGps(),
    signedOn: "2026-11-01",
    templateVersion: INITIAL_VERSION,
    locale: "nl" as const,
    note: "",
    consentGiven: true,
    ...over,
  });

  beforeEach(async () => {
    db = await resetDb();
    process.env.INTAKE_DOCUMENT_KEY = randomBytes(32).toString("base64");
    const [r] = (await db.insert(customers).values({ firstName: "Sara", lastName: "Test", email: "sara@example.com" })) as unknown as [{ insertId: number }];
    customerId = r.insertId;
  });

  test("templates: v1 is created once per language; a revision is a draft until activated; old versions are kept", async () => {
    assert.equal((await activeTemplate(db, "nl"))?.version, INITIAL_VERSION);
    assert.equal((await activeTemplate(db, "en"))?.version, INITIAL_VERSION);
    const id = await createRevision(db, "nl", 1);
    assert.equal(await createRevision(db, "nl", 1), id, "one draft at a time");
    const changed = BUILTIN_INTAKE.nl.replace("Wensen en aandachtspunten", "Wensen en voorkeuren");
    await assert.rejects(activateDraft(db, id, 1), /veranderd/, "a change note is required");
    await saveDraft(db, id, changed, "Kop 4 verduidelijkt", 1);
    await activateDraft(db, id, 1);
    const rows = await db.select().from(intakeTemplates);
    const nl = rows.filter((r) => r.locale === "nl");
    assert.equal(nl.find((r) => r.status === "active")?.id, id);
    assert.equal(nl.find((r) => r.version === INITIAL_VERSION)?.status, "retired");
    assert.equal(nl.find((r) => r.version === INITIAL_VERSION)?.source, BUILTIN_INTAKE.nl, "retired wording unchanged");
    await assert.rejects(saveDraft(db, id, changed, "x", 1), /concept/, "an active version cannot be edited");
  });

  test("uploads are refused until the key, the AVG confirmations, MFA and the client's consent are in place", async () => {
    await assert.rejects(uploadSignedIntake(db, await input(), owner), /AVG/);
    await confirm();
    await assert.rejects(uploadSignedIntake(db, await input(), { userId: 1, mfa: false }), /tweestapsverificatie/);
    await assert.rejects(uploadSignedIntake(db, await input({ consentGiven: false }), owner), /toestemming/);
    await assert.rejects(uploadSignedIntake(db, await input({ templateVersion: "GBD-INTAKE-1999-01-v1" }), owner), /versie/);
    delete process.env.INTAKE_DOCUMENT_KEY;
    assert.equal((await intakeStorageStatus(db, true)).enabled, false);
    await assert.rejects(uploadSignedIntake(db, await input(), owner), /INTAKE_DOCUMENT_KEY/);
    assert.equal((await db.select().from(intakeDocuments)).length, 0, "nothing stored after a refusal");
  });

  test("a photo is stored encrypted without EXIF/GPS; history is kept; download is audited; delete wipes the file", async () => {
    await confirm();
    const first = await uploadSignedIntake(db, await input(), owner);
    const [row] = await db.select().from(intakeDocuments);
    assert.ok(row.dataEnc && !row.dataEnc.includes(Buffer.from("TestPhone")), "encrypted at rest");
    assert.equal(row.metadataStripped, true);
    assert.notEqual(row.sha256, row.originalSha256, "re-encoded copy differs from the original");
    const doc = await readIntakeDocument(db, customerId, first, owner);
    assert.ok(doc);
    const meta = await sharp(doc.data).metadata();
    assert.equal(meta.exif, undefined, "EXIF (incl. GPS) removed");
    assert.equal(meta.width, 64);

    const second = await uploadSignedIntake(db, await input({ signedOn: "2026-11-02" }), owner);
    const list = await intakeDocumentsFor(db, customerId);
    assert.deepEqual(list.map((d) => [d.id, d.status]), [[second, "current"], [first, "superseded"]]);
    assert.equal(await readIntakeDocument(db, customerId + 999, first, owner), null, "bound to its customer");

    await deleteIntakeDocument(db, customerId, first, "Toestemming ingetrokken", owner);
    const [gone] = (await db.select().from(intakeDocuments)).filter((d) => d.id === first);
    assert.equal(gone.status, "deleted");
    assert.equal(gone.dataEnc, null, "file wiped");
    assert.equal(await readIntakeDocument(db, customerId, first, owner), null);

    const actions = (await db.select().from(auditLogs)).map((a) => a.action);
    for (const a of ["intake.document.upload", "intake.document.view", "intake.document.delete"]) assert.ok(actions.includes(a), a);
    assert.ok(!JSON.stringify(await db.select().from(auditLogs)).includes("TestPhone"), "no file contents in the audit log");

    await anonymizeCustomer(db, customerId, { userId: 1 });
    assert.ok((await db.select().from(intakeDocuments)).every((d) => d.dataEnc === null && d.status === "deleted"), "anonymising wipes every signed form");
  });
});
