/**
 * Invoice rules without database access (shared by the server and tests).
 *
 * Amounts are integer cents. Treatment prices are consumer prices, so line
 * amounts are entered INCLUDING VAT; the VAT part is derived per line
 * (round half up). With vatMode "exempt" no VAT is charged and the
 * exemption text confirmed by the owner's accountant is printed instead.
 *
 * Nothing here decides which VAT rate or exemption applies: that is
 * entered by the owner and verified with an accountant.
 */
import type { InvoiceSettings } from "../db/settings";
import { vatFromGross } from "./money";

export type InvoiceLine = { description: string; quantity: number; unitCents: number };
export type ComputedLine = InvoiceLine & { totalCents: number; vatCents: number; vatRateBp: number };
export type Totals = { lines: ComputedLine[]; subtotalCents: number; vatCents: number; totalCents: number; vatRateBp: number };

export function validKvk(v: string): boolean {
  return /^\d{8}$/.test(v.replace(/\s/g, ""));
}

/** Dutch VAT identification number (btw-id), e.g. NL123456789B01. Format check only. */
export function validVatNumber(v: string): boolean {
  return /^NL\d{9}B\d{2}$/.test(v.replace(/[\s.]/g, "").toUpperCase());
}

/** IBAN checksum (ISO 13616 mod 97). */
export function validIban(v: string): boolean {
  const s = v.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const moved = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of moved) {
    const d = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const c of d) rem = (rem * 10 + Number(c)) % 97;
  }
  return rem === 1;
}

/** Missing or invalid seller details that block issuing an invoice (Dutch, for the owner). */
export function invoiceReadiness(s: InvoiceSettings): string[] {
  const missing: string[] = [];
  if (!s.legalName.trim()) missing.push("Naam van de onderneming (zoals ingeschreven bij de KVK)");
  if (!s.street.trim() || !s.postcode.trim() || !s.city.trim()) missing.push("Adres van de onderneming (straat, postcode en plaats)");
  if (!validKvk(s.kvk)) missing.push("KVK-nummer (8 cijfers)");
  if (s.vatMode === "") missing.push("Btw-situatie (btw rekenen of vrijgesteld), na overleg met je boekhouder");
  if (s.vatMode === "standard") {
    if (!validVatNumber(s.vatNumber)) missing.push("Btw-identificatienummer (NL…B..)");
    if (!s.vatRateBp || s.vatRateBp <= 0 || s.vatRateBp > 5000) missing.push("Btw-tarief");
  }
  if (s.vatMode === "exempt" && s.exemptionText.trim().length < 10) missing.push("Tekst van de btw-vrijstelling (zoals je boekhouder die heeft bevestigd)");
  if (s.iban && !validIban(s.iban)) missing.push("IBAN is niet geldig");
  if (!/^[A-Z0-9]{1,8}$/.test(s.prefix)) missing.push("Factuurvoorvoegsel (1–8 hoofdletters of cijfers)");
  return missing;
}

export function lineErrors(lines: InvoiceLine[], kind: "invoice" | "credit"): string[] {
  const errors: string[] = [];
  if (!lines.length) errors.push("Voeg minimaal één regel toe.");
  lines.forEach((l, i) => {
    const n = i + 1;
    if (!l.description.trim()) errors.push(`Regel ${n}: omschrijving ontbreekt.`);
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 99) errors.push(`Regel ${n}: aantal moet tussen 1 en 99 liggen.`);
    if (!Number.isInteger(l.unitCents) || l.unitCents === 0) errors.push(`Regel ${n}: bedrag ontbreekt.`);
    if (kind === "invoice" && l.unitCents < 0) errors.push(`Regel ${n}: een factuur heeft geen negatieve bedragen. Gebruik een creditfactuur.`);
    if (kind === "credit" && l.unitCents > 0) errors.push(`Regel ${n}: op een creditfactuur zijn de bedragen negatief.`);
  });
  return errors;
}

export function computeTotals(lines: InvoiceLine[], vatMode: InvoiceSettings["vatMode"], rateBp: number | null): Totals {
  const rate = vatMode === "standard" ? (rateBp ?? 0) : 0;
  const computed = lines.map((l) => {
    const totalCents = l.quantity * l.unitCents;
    return { ...l, totalCents, vatCents: vatFromGross(totalCents, rate), vatRateBp: rate };
  });
  const totalCents = computed.reduce((s, l) => s + l.totalCents, 0);
  const vatCents = computed.reduce((s, l) => s + l.vatCents, 0);
  return { lines: computed, subtotalCents: totalCents - vatCents, vatCents, totalCents, vatRateBp: rate };
}

export function formatInvoiceNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export function formatRate(bp: number): string {
  return `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 2).replace(".", ",")}%`;
}
