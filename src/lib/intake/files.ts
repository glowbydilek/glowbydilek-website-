/**
 * Content checks for uploaded signed intake forms (pure, testable).
 *
 * Quarantine strategy: an upload is held only in memory while it is
 * checked. It is stored (encrypted) only after every check passes; a file
 * that fails is rejected and never written anywhere.
 */
import { receiptKind } from "../expenses/core";

export const INTAKE_MAX_BYTES = 10 * 1024 * 1024;
export const INTAKE_MAX_PIXELS = 40_000_000;
export const INTAKE_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export type FileCheck = { ok: true; mime: string } | { ok: false; error: string };

/** Active content a scanned or photographed form never needs. */
const PDF_FORBIDDEN = [/\/JavaScript\b/, /\/JS\b/, /\/Launch\b/, /\/EmbeddedFile\b/, /\/RichMedia\b/, /\/XFA\b/, /\/SubmitForm\b/, /\/ImportData\b/, /\/Encrypt\b/];

export function checkIntakeFile(bytes: Uint8Array, declared: string): FileCheck {
  if (bytes.length === 0) return { ok: false, error: "Het bestand is leeg." };
  if (bytes.length > INTAKE_MAX_BYTES) return { ok: false, error: "Een formulier mag maximaal 10 MB zijn." };
  const mime = receiptKind(bytes, declared);
  if (!mime) return { ok: false, error: "Alleen PDF, JPG, PNG of WebP. Het bestand moet ook echt dat type zijn." };
  if (mime === "application/pdf") {
    // latin1 keeps every byte, so PDF keywords can be searched safely.
    const text = Buffer.from(bytes).toString("latin1");
    if (!/%%EOF\s*$/.test(text.slice(-1024))) return { ok: false, error: "Deze PDF lijkt onvolledig of beschadigd." };
    if (PDF_FORBIDDEN.some((re) => re.test(text))) return { ok: false, error: "Deze PDF bevat scripts, bijlagen of beveiliging. Sla het formulier opnieuw op als gewone PDF of maak een foto." };
  }
  return { ok: true, mime };
}

export const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
