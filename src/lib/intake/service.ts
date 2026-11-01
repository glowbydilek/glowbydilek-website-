import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { customers, intakeDocuments, intakeTemplates } from "../db/schema";
import { consultationEnabled } from "../consultation/service";
import { stripMetadata } from "../cms/strip";
import { checkIntakeFile, INTAKE_MAX_PIXELS } from "./files";
import { BUILTIN_INTAKE, checkIntakeSource, INITIAL_VERSION, nextVersion, parseIntake } from "./template";

/**
 * Intake & consent: master templates (versioned) and signed copies per
 * customer. Signed copies contain health information (GDPR art. 9):
 *
 * - Upload and viewing need: INTAKE_DOCUMENT_KEY (32 bytes, base64, separate
 *   from AUTH_SECRET and CONSULTATION_KEY), the owner signed in with
 *   two-step verification, and the privacy confirmations in
 *   Admin → Privacy & consultatie (the AVG sign-off).
 * - Files are re-encoded (images, removes EXIF/GPS) and encrypted with
 *   AES-256-GCM before they reach the database; never stored on disk.
 * - Never part of exports, emails, invoices, reports or analytics.
 * - Every upload, view, download and deletion is audited.
 */

export class IntakeError extends Error {}
type Locale = "nl" | "en";
type Who = { userId: number; mfa: boolean };

// ─────────────────────────────────────────────────────────────── templates

/** Creates the supplied v1 forms on first use (idempotent). */
export async function ensureIntakeTemplates(db: DB) {
  const rows = await db.select({ locale: intakeTemplates.locale }).from(intakeTemplates);
  for (const locale of ["nl", "en"] as const) {
    if (rows.some((r) => r.locale === locale)) continue;
    const p = parseIntake(BUILTIN_INTAKE[locale], INITIAL_VERSION);
    await db
      .insert(intakeTemplates)
      .values({ locale, version: INITIAL_VERSION, status: "active", title: p.title, source: BUILTIN_INTAKE[locale], changeNote: "Eerste versie (aangeleverd concept)", activatedAt: new Date() })
      .catch(() => {}); // a parallel request created it
  }
}

export async function listTemplates(db: DB) {
  await ensureIntakeTemplates(db);
  return db.select().from(intakeTemplates).orderBy(asc(intakeTemplates.locale), desc(intakeTemplates.id));
}

export async function getTemplate(db: DB, id: number) {
  const [t] = await db.select().from(intakeTemplates).where(eq(intakeTemplates.id, id));
  return t ?? null;
}

export async function activeTemplate(db: DB, locale: Locale) {
  await ensureIntakeTemplates(db);
  const [t] = await db.select().from(intakeTemplates).where(and(eq(intakeTemplates.locale, locale), eq(intakeTemplates.status, "active")));
  return t ?? null;
}

/** New draft revision, copied from the active version. */
export async function createRevision(db: DB, locale: Locale, userId: number) {
  const base = await activeTemplate(db, locale);
  if (!base) throw new IntakeError("Er is geen actieve versie.");
  const existing = await db.select({ id: intakeTemplates.id }).from(intakeTemplates).where(and(eq(intakeTemplates.locale, locale), eq(intakeTemplates.status, "draft")));
  if (existing.length) return existing[0].id;
  const all = await db.select({ version: intakeTemplates.version }).from(intakeTemplates).where(eq(intakeTemplates.locale, locale));
  let version = nextVersion(base.version);
  while (all.some((a) => a.version === version)) version = nextVersion(version);
  const [r] = await db.insert(intakeTemplates).values({ locale, version, status: "draft", title: base.title, source: base.source, createdBy: userId }).$returningId();
  await audit(db, { userId, action: "intake.template.draft", entity: "intake_template", entityId: r.id, details: { locale, version } });
  return r.id;
}

export async function saveDraft(db: DB, id: number, source: string, changeNote: string, userId: number) {
  const t = await getTemplate(db, id);
  if (!t || t.status !== "draft") throw new IntakeError("Alleen een concept kan worden aangepast. Maak eerst een nieuwe revisie.");
  const check = checkIntakeSource(source, t.version);
  if (!check.ok) throw new IntakeError(check.error);
  const title = parseIntake(source, t.version).title.slice(0, 200);
  await db.update(intakeTemplates).set({ source, title, changeNote: changeNote.slice(0, 300) || null }).where(eq(intakeTemplates.id, id));
  await audit(db, { userId, action: "intake.template.save", entity: "intake_template", entityId: id, details: { version: t.version } });
}

/** Makes a draft the active version; the previous active one is retired (kept, read-only). */
export async function activateDraft(db: DB, id: number, userId: number) {
  const t = await getTemplate(db, id);
  if (!t || t.status !== "draft") throw new IntakeError("Alleen een concept kan worden geactiveerd.");
  const check = checkIntakeSource(t.source, t.version);
  if (!check.ok) throw new IntakeError(check.error);
  if (!t.changeNote) throw new IntakeError("Beschrijf kort wat er is veranderd voordat je deze versie activeert.");
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(intakeTemplates).set({ status: "retired", retiredAt: now }).where(and(eq(intakeTemplates.locale, t.locale), eq(intakeTemplates.status, "active")));
    await tx.update(intakeTemplates).set({ status: "active", activatedAt: now }).where(eq(intakeTemplates.id, id));
  });
  await audit(db, { userId, action: "intake.template.activate", entity: "intake_template", entityId: id, details: { locale: t.locale, version: t.version } });
}

export async function deleteDraft(db: DB, id: number, userId: number) {
  const t = await getTemplate(db, id);
  if (!t || t.status !== "draft") throw new IntakeError("Alleen een concept kan worden verwijderd.");
  await db.delete(intakeTemplates).where(eq(intakeTemplates.id, id));
  await audit(db, { userId, action: "intake.template.delete_draft", entity: "intake_template", entityId: id, details: { version: t.version } });
}

// ──────────────────────────────────────────────────────── signed documents

function keyBytes(): Buffer | null {
  const raw = process.env.INTAKE_DOCUMENT_KEY ?? "";
  if (!raw) return null;
  try {
    const b = Buffer.from(raw, "base64");
    return b.length === 32 ? b : null;
  } catch {
    return null;
  }
}

/** Format: 12-byte IV | 16-byte tag | ciphertext. */
export function encryptFile(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(data), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]);
}

export function decryptFile(blob: Buffer, key: Buffer): Buffer {
  const d = createDecipheriv("aes-256-gcm", key, blob.subarray(0, 12));
  d.setAuthTag(blob.subarray(12, 28));
  return Buffer.concat([d.update(blob.subarray(28)), d.final()]);
}

/** Why uploads are unavailable (empty when everything is in place). */
export async function intakeStorageStatus(db: DB, mfa: boolean): Promise<{ enabled: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  if (!keyBytes()) reasons.push("De versleutelingssleutel INTAKE_DOCUMENT_KEY is nog niet ingesteld in Hostinger.");
  const consult = await consultationEnabled(db);
  const s = consult.settings;
  if (!(s.consentConfirmed && s.noticeConfirmed && s.assessmentConfirmed)) reasons.push("De privacyvoorwaarden (AVG) zijn nog niet bevestigd in Admin → Privacy & consultatie.");
  if (!mfa) reasons.push("Zet tweestapsverificatie aan voor je account (Admin → Beveiliging) en log opnieuw in.");
  return { enabled: reasons.length === 0, reasons };
}

async function assertStorage(db: DB, who: Who) {
  const st = await intakeStorageStatus(db, who.mfa);
  if (!st.enabled) throw new IntakeError(st.reasons[0]);
  return keyBytes()!;
}

/** Re-encodes images: removes EXIF/GPS and other metadata, keeps orientation. */
async function sanitiseImage(bytes: Buffer, mime: string): Promise<Buffer> {
  let sharp: typeof import("sharp").default | null = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    sharp = null;
  }
  // Without the native image library (older glibc on the host): keep the
  // pixels, remove EXIF/XMP/IPTC (incl. GPS) with the pure-JS stripper.
  if (!sharp) return stripMetadata(bytes, mime as "image/jpeg" | "image/png" | "image/webp").data;
  const img = sharp(bytes, { limitInputPixels: INTAKE_MAX_PIXELS, failOn: "error" }).rotate();
  if (mime === "image/png") return img.png({ compressionLevel: 9 }).toBuffer();
  if (mime === "image/webp") return img.webp({ quality: 88 }).toBuffer();
  return img.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}

export type UploadInput = { customerId: number; file: File; signedOn: string; templateVersion: string; locale: Locale; note: string; consentGiven: boolean };

export async function uploadSignedIntake(db: DB, input: UploadInput, who: Who) {
  const key = await assertStorage(db, who);
  if (!input.consentGiven) throw new IntakeError("Bewaar het formulier alleen als de klant het vakje voor toestemming tot opslag heeft aangekruist. Zonder toestemming: bespreek de veiligheid mondeling en bewaar het gezondheidsdeel niet.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.signedOn)) throw new IntakeError("Vul de datum van ondertekening in.");
  const [c] = await db.select({ id: customers.id, anonymizedAt: customers.anonymizedAt }).from(customers).where(eq(customers.id, input.customerId));
  if (!c || c.anonymizedAt) throw new IntakeError("Klant niet gevonden.");
  await ensureIntakeTemplates(db);
  const tpl = await db.select({ version: intakeTemplates.version }).from(intakeTemplates).where(and(eq(intakeTemplates.locale, input.locale), eq(intakeTemplates.version, input.templateVersion), ne(intakeTemplates.status, "draft")));
  if (!tpl.length) throw new IntakeError("Kies de versie die op het ondertekende formulier staat.");

  const original = Buffer.from(await input.file.arrayBuffer());
  const check = checkIntakeFile(original, input.file.type);
  if (!check.ok) throw new IntakeError(check.error);
  let stored: Buffer = original;
  let stripped = false;
  if (check.mime !== "application/pdf") {
    try {
      stored = await sanitiseImage(original, check.mime);
      stripped = true;
    } catch {
      throw new IntakeError("De foto kon niet worden gelezen. Maak een nieuwe foto of upload een PDF.");
    }
  }
  const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
  const now = new Date();
  const id = await db.transaction(async (tx) => {
    await tx.update(intakeDocuments).set({ status: "superseded", supersededAt: now }).where(and(eq(intakeDocuments.customerId, input.customerId), eq(intakeDocuments.status, "current")));
    const [r] = await tx
      .insert(intakeDocuments)
      .values({
        customerId: input.customerId,
        templateVersion: input.templateVersion,
        locale: input.locale,
        signedOn: input.signedOn,
        status: "current",
        mime: check.mime,
        size: stored.length,
        sha256: sha(stored),
        originalSha256: sha(original),
        metadataStripped: stripped,
        dataEnc: encryptFile(stored, key),
        note: input.note.trim().slice(0, 300) || null,
        uploadedBy: who.userId,
      })
      .$returningId();
    return r.id;
  });
  await audit(db, { userId: who.userId, action: "intake.document.upload", entity: "customer", entityId: input.customerId, details: { documentId: id, version: input.templateVersion, mime: check.mime, size: stored.length } });
  return id;
}

/** Metadata only (no file contents) for the customer page. */
export async function intakeDocumentsFor(db: DB, customerId: number) {
  return db
    .select({
      id: intakeDocuments.id,
      templateVersion: intakeDocuments.templateVersion,
      locale: intakeDocuments.locale,
      signedOn: intakeDocuments.signedOn,
      status: intakeDocuments.status,
      mime: intakeDocuments.mime,
      size: intakeDocuments.size,
      sha256: intakeDocuments.sha256,
      metadataStripped: intakeDocuments.metadataStripped,
      note: intakeDocuments.note,
      uploadedBy: intakeDocuments.uploadedBy,
      createdAt: intakeDocuments.createdAt,
      supersededAt: intakeDocuments.supersededAt,
      deletedAt: intakeDocuments.deletedAt,
      deleteReason: intakeDocuments.deleteReason,
    })
    .from(intakeDocuments)
    .where(eq(intakeDocuments.customerId, customerId))
    .orderBy(desc(intakeDocuments.id));
}

export async function readIntakeDocument(db: DB, customerId: number, id: number, who: Who) {
  const key = await assertStorage(db, who);
  const [d] = await db.select().from(intakeDocuments).where(and(eq(intakeDocuments.id, id), eq(intakeDocuments.customerId, customerId)));
  if (!d || !d.dataEnc) return null;
  const data = decryptFile(d.dataEnc, key);
  if (createHash("sha256").update(data).digest("hex") !== d.sha256) throw new IntakeError("Het bestand is beschadigd (controlesom klopt niet).");
  await audit(db, { userId: who.userId, action: "intake.document.view", entity: "customer", entityId: customerId, details: { documentId: id } });
  return { data, mime: d.mime, filename: `intake-${customerId}-${d.signedOn}-${d.templateVersion}` };
}

/** Wipes the file (consent withdrawn, retention ended, wrong upload); keeps non-health metadata. */
export async function deleteIntakeDocument(db: DB, customerId: number, id: number, reason: string, who: Who) {
  if (!who.mfa) throw new IntakeError("Zet tweestapsverificatie aan voor je account.");
  if (reason.trim().length < 3) throw new IntakeError("Geef een korte reden op.");
  const [d] = await db.select({ id: intakeDocuments.id }).from(intakeDocuments).where(and(eq(intakeDocuments.id, id), eq(intakeDocuments.customerId, customerId)));
  if (!d) throw new IntakeError("Document niet gevonden.");
  await db
    .update(intakeDocuments)
    .set({ status: "deleted", dataEnc: null, deletedAt: new Date(), deletedBy: who.userId, deleteReason: reason.trim().slice(0, 200), note: null })
    .where(eq(intakeDocuments.id, id));
  await audit(db, { userId: who.userId, action: "intake.document.delete", entity: "customer", entityId: customerId, details: { documentId: id } });
}
