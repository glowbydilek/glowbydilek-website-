/**
 * "Over Dilek" — education and background, as entered by the owner
 * (Admin → Over Dilek). Pure module. Nothing is shown publicly until the
 * owner publishes the profile AND confirms the diploma wording is exact.
 * No qualification, registration or authorisation is ever inferred.
 */
import { override } from "./cms/current";

export type Certificate = { name: string; issuer: string; year: string };
export type Profile = {
  published: boolean;
  /** The owner confirmed the diploma title/level/institution match the diploma exactly. */
  verified: boolean;
  diplomaTitle: string;
  level: string;
  institution: string;
  year: string;
  certificates: Certificate[];
  backgroundNl: string;
  backgroundEn: string;
  /** Uploaded photo of Dilek herself (never a stock model). */
  photoMediaId: number | null;
  photoIsReal: boolean;
};

export const EMPTY_PROFILE: Profile = {
  published: false,
  verified: false,
  diplomaTitle: "",
  level: "",
  institution: "",
  year: "",
  certificates: [],
  backgroundNl: "",
  backgroundEn: "",
  photoMediaId: null,
  photoIsReal: false,
};

const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function parseProfile(raw: unknown): Profile {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const certs = Array.isArray(o.certificates) ? o.certificates : [];
  return {
    published: o.published === true,
    verified: o.verified === true,
    diplomaTitle: s(o.diplomaTitle, 160),
    level: s(o.level, 60),
    institution: s(o.institution, 160),
    year: s(o.year, 9),
    certificates: certs
      .slice(0, 12)
      .map((c) => (c && typeof c === "object" ? (c as Record<string, unknown>) : {}))
      .map((c) => ({ name: s(c.name, 160), issuer: s(c.issuer, 160), year: s(c.year, 9) }))
      .filter((c) => c.name),
    backgroundNl: s(o.backgroundNl, 1500),
    backgroundEn: s(o.backgroundEn, 1500),
    photoMediaId: Number.isInteger(o.photoMediaId) ? (o.photoMediaId as number) : null,
    photoIsReal: o.photoIsReal === true,
  };
}

/** "Name — issuer — year" lines from the admin textarea. */
export function parseCertificateLines(text: string): Certificate[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.split(/\s+[—–-]\s+/).map((x) => x.trim()))
    .filter((p) => p[0])
    .slice(0, 12)
    .map(([name, issuer = "", year = ""]) => ({ name: name.slice(0, 160), issuer: issuer.slice(0, 160), year: year.slice(0, 9) }));
}

/** Claims that must never be implied without explicit proof (shown as a warning in the admin). */
export const SENSITIVE_CLAIMS = /\b(BIG[- ]?regist|fysiotherap|medisch bevoegd|arts\b|dermatoloog|btw[- ]?vrij|vrijgesteld van btw)/i;

export function publicProfile(): Profile | null {
  const p = parseProfile(override("profile", "all"));
  return p.published ? p : null;
}
