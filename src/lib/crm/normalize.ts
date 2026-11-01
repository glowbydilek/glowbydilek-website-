/**
 * Normalisation for recognising returning customers. Pure functions (no
 * database), so they are shared by the server, the matching queries and the
 * tests.
 *
 * Phone numbers are reduced to an international digit string ("+316…"):
 *   06 12 34 56 78 · 0612345678 · +31 6 1234 5678 · 0031612345678 · 31612345678
 * all become "+31612345678". Dutch landlines ("020 …") become "+3120…".
 * Numbers with another country code keep it. Anything that is not
 * recognisably a phone number returns null and is never used for matching.
 */

export function normalizeEmail(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v || v.length > 190 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v)) return null;
  return v;
}

export function normalizePhone(raw: string | null | undefined): string | null {
  let v = (raw ?? "").trim();
  if (!v) return null;
  // Keep a leading "+", drop every separator.
  const plus = v.startsWith("+");
  v = v.replace(/[^\d]/g, "");
  if (!v) return null;
  if (plus) {
    // "+31 (0)6 …": drop the national trunk zero after the country code.
    if (v.startsWith("310")) v = "31" + v.slice(3);
    return v.length >= 8 && v.length <= 15 ? `+${v}` : null;
  }
  if (v.startsWith("00")) {
    v = v.slice(2);
    if (v.startsWith("310")) v = "31" + v.slice(3);
    return v.length >= 8 && v.length <= 15 ? `+${v}` : null;
  }
  // Dutch national format: 0 + 9 digits.
  if (v.startsWith("0") && v.length === 10) return `+31${v.slice(1)}`;
  // Country code without "+": 31 + 9 digits.
  if (v.startsWith("31") && v.length === 11) return `+${v}`;
  // Mobile without trunk zero: 6 + 8 digits.
  if (v.startsWith("6") && v.length === 9) return `+31${v}`;
  return null;
}

/** "Sanne de Vries" → "sanne de vries" (accents removed) for name comparisons. */
export function normalizeName(raw: string | null | undefined): string {
  return (raw ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type MatchReason = "email" | "phone" | "name";

/** Human-readable match explanation for the owner. */
export function matchLabel(reasons: MatchReason[]): string {
  const nl: Record<MatchReason, string> = { email: "zelfde e-mailadres", phone: "zelfde telefoonnummer", name: "zelfde naam" };
  return reasons.map((r) => nl[r]).join(" + ");
}
