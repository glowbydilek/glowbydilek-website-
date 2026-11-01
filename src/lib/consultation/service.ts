import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { consultations, customers } from "../db/schema";
import { getSetting, setSetting } from "../db/settings";

/**
 * Treatment-safety consultation (special category data, GDPR art. 9).
 *
 * - Off by default. It only works when (1) CONSULTATION_KEY is configured,
 *   (2) the owner confirmed the legal conditions in Admin → Privacy &
 *   consultatie, and (3) the owner's account uses two-step verification.
 * - Only questions needed to wax safely are asked (data minimisation).
 * - Answers are encrypted at rest with AES-256-GCM under CONSULTATION_KEY,
 *   a key separate from AUTH_SECRET, stored only in Hostinger.
 * - Never included in customer exports, emails, invoices, reports or
 *   analytics. Every view, change, export and deletion is audited.
 * - Explicit consent (art. 9(2)(a)) is recorded per customer; withdrawing
 *   consent deletes the answers.
 */

export const FORM_VERSION = "2026-11-v1";
export const CONSENT_TEXT_VERSION = "2026-11-v1";

export type ConsultationAnswers = {
  allergy: "yes" | "no" | "unknown";
  allergyNote: string;
  skinThinning: "yes" | "no" | "unknown";
  skinThinningNote: string;
  bloodThinners: "yes" | "no" | "unknown";
  skinCondition: "yes" | "no" | "unknown";
  skinConditionNote: string;
  healing: "yes" | "no" | "unknown";
  precautions: string;
};

export const QUESTIONS: { key: keyof ConsultationAnswers; note?: keyof ConsultationAnswers; nl: string; why: string }[] = [
  { key: "allergy", note: "allergyNote", nl: "Bekende allergie of overgevoeligheid voor hars/wax (colofonium), latex of verzorgingsproducten?", why: "Om een reactie op de gebruikte producten te voorkomen." },
  { key: "skinThinning", note: "skinThinningNote", nl: "Gebruik nu of in de afgelopen maanden van huidverdunnende middelen (bijv. isotretinoïne, retinol, zuren of peelings) in het te behandelen gebied?", why: "Waxen op verdunde huid kan de huid beschadigen." },
  { key: "bloodThinners", nl: "Gebruik van bloedverdunners?", why: "Om kneuzingen en bloedingen te voorkomen." },
  { key: "skinCondition", note: "skinConditionNote", nl: "Wondjes, ontsteking, zonnebrand, eczeem/psoriasis of een recente laser- of peelingbehandeling in het te behandelen gebied?", why: "Op die plekken wordt niet gewaxt." },
  { key: "healing", nl: "Een aandoening waardoor de huid minder goed geneest of de bloedsomloop is verminderd?", why: "Om extra voorzichtig te zijn of de behandeling aan te passen." },
];

export type ConsultationSettings = {
  /** Owner confirmed: explicit consent (art. 9(2)(a)) is asked and documented for every customer. */
  consentConfirmed: boolean;
  /** Owner confirmed: the customer-facing explanation is shown before consent. */
  noticeConfirmed: boolean;
  /** Owner confirmed: a DPIA/legal review was done or explicitly judged not required. */
  assessmentConfirmed: boolean;
  /** Months after the last review after which answers are deleted automatically. */
  retentionMonths: number;
  confirmedAt: string | null;
};

export const defaultConsultationSettings: ConsultationSettings = {
  consentConfirmed: false,
  noticeConfirmed: false,
  assessmentConfirmed: false,
  retentionMonths: 24,
  confirmedAt: null,
};

export const CONSENT_TEXT_NL =
  "Ik geef Glow by Dilek uitdrukkelijk toestemming om de antwoorden op deze vragen over mijn huid en gezondheid vast te leggen, uitsluitend om mijn waxbehandeling veilig uit te voeren. De gegevens worden versleuteld bewaard, alleen door Dilek ingezien, niet gedeeld en uiterlijk na de bewaartermijn verwijderd. Ik kan mijn toestemming altijd intrekken; de antwoorden worden dan verwijderd.";

function keyBytes(): Buffer | null {
  const raw = process.env.CONSULTATION_KEY ?? "";
  if (!raw) return null;
  try {
    const b = Buffer.from(raw, "base64");
    return b.length === 32 ? b : null;
  } catch {
    return null;
  }
}

export function encryptAnswers(a: ConsultationAnswers, key = keyBytes()): string {
  if (!key) throw new Error("CONSULTATION_KEY missing");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([c.update(JSON.stringify(a), "utf8"), c.final()]);
  return `v1:${iv.toString("base64url")}:${c.getAuthTag().toString("base64url")}:${body.toString("base64url")}`;
}

export function decryptAnswers(enc: string, key = keyBytes()): ConsultationAnswers {
  if (!key) throw new Error("CONSULTATION_KEY missing");
  const [v, iv, tag, body] = enc.split(":");
  if (v !== "v1") throw new Error("unknown format");
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(body, "base64url")), d.final()]).toString("utf8"));
}

export async function getConsultationSettings(db: DB) {
  return getSetting(db, "consultation", defaultConsultationSettings);
}

/** Why the module is (not) available, in plain Dutch for the owner. */
export async function consultationEnabled(db: DB): Promise<{ enabled: boolean; reasons: string[]; settings: ConsultationSettings }> {
  const s = await getConsultationSettings(db);
  const reasons: string[] = [];
  if (!keyBytes()) reasons.push("De versleutelingssleutel CONSULTATION_KEY is niet ingesteld in Hostinger.");
  if (!s.consentConfirmed || !s.noticeConfirmed || !s.assessmentConfirmed) reasons.push("De wettelijke voorwaarden zijn nog niet bevestigd.");
  return { enabled: reasons.length === 0, reasons, settings: s };
}

export async function saveConsultationSettings(db: DB, s: ConsultationSettings, userId: number) {
  await setSetting(db, "consultation", { ...s, confirmedAt: s.consentConfirmed && s.noticeConfirmed && s.assessmentConfirmed ? new Date().toISOString() : null }, userId);
  await audit(db, { userId, action: "consultation.settings_saved", details: { consent: s.consentConfirmed, notice: s.noticeConfirmed, assessment: s.assessmentConfirmed, retentionMonths: s.retentionMonths } });
}

export class ConsultationError extends Error {}

async function assertAllowed(db: DB, mfa: boolean) {
  const st = await consultationEnabled(db);
  if (!st.enabled) throw new ConsultationError(st.reasons.join(" "));
  if (!mfa) throw new ConsultationError("Zet eerst tweestapsverificatie aan voor je account (Admin → Beveiliging).");
  return st.settings;
}

/** Reads (and audits) the consultation of a customer. */
export async function readConsultation(db: DB, customerId: number, who: { userId: number; mfa: boolean }) {
  await assertAllowed(db, who.mfa);
  const [row] = await db.select().from(consultations).where(eq(consultations.customerId, customerId));
  await audit(db, { userId: who.userId, action: "consultation.viewed", entity: "customer", entityId: customerId });
  if (!row) return null;
  return { row, answers: decryptAnswers(row.dataEnc) };
}

export async function saveConsultation(
  db: DB,
  customerId: number,
  input: { answers: ConsultationAnswers; consentMethod: "in_person" | "written" | "digital"; consentGiven: boolean },
  who: { userId: number; mfa: boolean },
) {
  const s = await assertAllowed(db, who.mfa);
  if (!input.consentGiven) throw new ConsultationError("Zonder uitdrukkelijke toestemming van de klant wordt niets vastgelegd.");
  const [c] = await db.select({ id: customers.id, anonymizedAt: customers.anonymizedAt }).from(customers).where(eq(customers.id, customerId));
  if (!c || c.anonymizedAt) throw new ConsultationError("Klant niet gevonden.");
  const clean: ConsultationAnswers = {
    allergy: input.answers.allergy,
    allergyNote: input.answers.allergyNote.slice(0, 300),
    skinThinning: input.answers.skinThinning,
    skinThinningNote: input.answers.skinThinningNote.slice(0, 300),
    bloodThinners: input.answers.bloodThinners,
    skinCondition: input.answers.skinCondition,
    skinConditionNote: input.answers.skinConditionNote.slice(0, 300),
    healing: input.answers.healing,
    precautions: input.answers.precautions.slice(0, 600),
  };
  const now = new Date();
  const next = new Date(now);
  next.setMonth(next.getMonth() + 12);
  const values = {
    customerId,
    dataEnc: encryptAnswers(clean),
    formVersion: FORM_VERSION,
    consentAt: now,
    consentMethod: input.consentMethod,
    consentTextVersion: CONSENT_TEXT_VERSION,
    reviewedAt: now,
    nextReviewAt: next,
    userId: who.userId,
  };
  await db.insert(consultations).values(values).onDuplicateKeyUpdate({ set: { ...values, withdrawnAt: null } });
  await audit(db, { userId: who.userId, action: "consultation.updated", entity: "customer", entityId: customerId, details: { formVersion: FORM_VERSION, retentionMonths: s.retentionMonths } });
}

/** Deletes the answers (consent withdrawn, end of retention, or owner decision). */
export async function deleteConsultation(db: DB, customerId: number, userId: number | null, reason: string) {
  const [res] = (await db.delete(consultations).where(eq(consultations.customerId, customerId))) as unknown as [{ affectedRows: number }];
  if (res.affectedRows) await audit(db, { userId, action: "consultation.deleted", entity: "customer", entityId: customerId, details: { reason } });
}

/** Retention: deletes consultations not reviewed within the retention period. Run by the cron tick. */
export async function purgeExpiredConsultations(db: DB, now = new Date()) {
  const s = await getConsultationSettings(db);
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - Math.max(1, s.retentionMonths || 24));
  const old = await db.select({ customerId: consultations.customerId }).from(consultations).where(lt(consultations.reviewedAt, cutoff));
  for (const o of old) await deleteConsultation(db, o.customerId, null, "retention");
  return old.length;
}

/** Explicit, audited export for a justified access request (separate from the general customer export). */
export async function exportConsultation(db: DB, customerId: number, who: { userId: number; mfa: boolean }) {
  await assertAllowed(db, who.mfa);
  const [row] = await db.select().from(consultations).where(and(eq(consultations.customerId, customerId)));
  if (!row) return null;
  await audit(db, { userId: who.userId, action: "consultation.exported", entity: "customer", entityId: customerId });
  return { customerId, formVersion: row.formVersion, consentAt: row.consentAt, consentMethod: row.consentMethod, reviewedAt: row.reviewedAt, answers: decryptAnswers(row.dataEnc), exportedAt: new Date().toISOString() };
}
