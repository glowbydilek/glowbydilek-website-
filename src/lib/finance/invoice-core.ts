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

export type VatCat = "standard" | "reduced" | "zero" | "exempt";
export const VAT_CATS: VatCat[] = ["standard", "reduced", "zero", "exempt"];
export const VAT_LABELS: Record<VatCat, string> = { standard: "Standaard", reduced: "Verlaagd", zero: "0%", exempt: "Vrijgesteld" };

/** A line; amounts INCLUDING VAT. `vat` defaults to "standard" (lines from before multi-rate support). */
export type InvoiceLine = { description: string; quantity: number; unitCents: number; vat?: VatCat };
export type ComputedLine = InvoiceLine & { totalCents: number; vatCents: number; vatRateBp: number; vatLabel: string };
export type VatRow = { rateBp: number; label: string; baseCents: number; vatCents: number };
export type Totals = { lines: ComputedLine[]; subtotalCents: number; vatCents: number; totalCents: number; vatRateBp: number; breakdown: VatRow[] };

type RateSettings = Pick<InvoiceSettings, "vatMode" | "vatRateBp"> & { reducedRateBp?: number | null };

/** Rate for a line category; null when the needed rate has not been set (blocks issuing). */
export function rateFor(cat: VatCat, s: RateSettings): number | null {
  if (s.vatMode !== "standard") return 0;
  if (cat === "standard") return s.vatRateBp ?? null;
  if (cat === "reduced") return s.reducedRateBp ?? null;
  return 0;
}

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
  if (s.vatMode === "kor" && s.exemptionText.trim().length < 10) missing.push("Tekst voor de kleineondernemersregeling (KOR) op de factuur, zoals je boekhouder die heeft bevestigd");
  if (s.reducedRateBp != null && (s.reducedRateBp < 0 || s.reducedRateBp > 5000)) missing.push("Verlaagd btw-tarief is ongeldig");
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
    if (kind === "invoice" && l.unitCents < 0 && !/korting|discount/i.test(l.description)) errors.push(`Regel ${n}: een negatief bedrag mag alleen als kortingsregel (omschrijving met ‘Korting’). Corrigeren doe je met een creditfactuur.`);
    if (kind === "credit" && l.unitCents > 0) errors.push(`Regel ${n}: op een creditfactuur zijn de bedragen negatief.`);
  });
  if (kind === "invoice" && lines.reduce((t, l) => t + l.quantity * l.unitCents, 0) < 0) errors.push("Het totaal van een factuur kan niet negatief zijn.");
  return errors;
}

/** Lines whose VAT category needs a rate that is not set (only relevant with vatMode "standard"). */
export function vatLineErrors(lines: InvoiceLine[], s: RateSettings): string[] {
  if (s.vatMode !== "standard") return [];
  const out: string[] = [];
  lines.forEach((l, i) => {
    if (rateFor(l.vat ?? "standard", s) === null) out.push(`Regel ${i + 1}: het ${l.vat === "reduced" ? "verlaagde" : "standaard"} btw-tarief is nog niet ingesteld (Admin → Bedrijf & facturen).`);
  });
  return out;
}

/**
 * Splits a discount over the lines in proportion to their amounts and
 * returns one negative line per VAT category (largest remainder rounding),
 * so the VAT per rate stays correct on a mixed-rate invoice.
 */
export function allocateDiscount(lines: InvoiceLine[], discountCents: number, label = "Korting"): InvoiceLine[] {
  if (discountCents <= 0) return [];
  const byCat = new Map<VatCat, number>();
  for (const l of lines) byCat.set(l.vat ?? "standard", (byCat.get(l.vat ?? "standard") ?? 0) + l.quantity * l.unitCents);
  const total = [...byCat.values()].reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  const capped = Math.min(discountCents, total);
  const parts = [...byCat.entries()].map(([cat, amount]) => {
    const exact = (capped * amount) / total;
    return { cat, cents: Math.floor(exact), rest: exact - Math.floor(exact) };
  });
  let left = capped - parts.reduce((a, p) => a + p.cents, 0);
  for (const p of [...parts].sort((a, b) => b.rest - a.rest)) {
    if (left <= 0) break;
    p.cents += 1;
    left -= 1;
  }
  const multi = parts.filter((p) => p.cents > 0).length > 1;
  return parts.filter((p) => p.cents > 0).map((p) => ({ description: multi ? `${label} (${VAT_LABELS[p.cat].toLowerCase()})` : label, quantity: 1, unitCents: -p.cents, vat: p.cat }));
}

export function computeTotals(lines: InvoiceLine[], vatMode: InvoiceSettings["vatMode"], rateBp: number | null, reducedRateBp: number | null = null): Totals {
  const st: RateSettings = { vatMode, vatRateBp: rateBp, reducedRateBp };
  const computed: ComputedLine[] = lines.map((l) => {
    const cat = l.vat ?? "standard";
    const rate = rateFor(cat, st) ?? 0;
    const totalCents = l.quantity * l.unitCents;
    const vatLabel = vatMode !== "standard" ? "" : cat === "exempt" ? "vrij" : formatRate(rate);
    return { ...l, totalCents, vatCents: vatFromGross(totalCents, rate), vatRateBp: rate, vatLabel };
  });
  const totalCents = computed.reduce((s, l) => s + l.totalCents, 0);
  const vatCents = computed.reduce((s, l) => s + l.vatCents, 0);
  const rows = new Map<string, VatRow>();
  if (vatMode === "standard") {
    for (const l of computed) {
      const key = l.vat === "exempt" ? "exempt" : String(l.vatRateBp);
      const r = rows.get(key) ?? { rateBp: l.vatRateBp, label: l.vat === "exempt" ? "Vrijgesteld" : `Btw ${formatRate(l.vatRateBp)}`, baseCents: 0, vatCents: 0 };
      r.baseCents += l.totalCents - l.vatCents;
      r.vatCents += l.vatCents;
      rows.set(key, r);
    }
  }
  const breakdown = [...rows.values()].sort((a, b) => b.rateBp - a.rateBp);
  const single = breakdown.length === 1 ? breakdown[0].rateBp : vatMode === "standard" ? (rateBp ?? 0) : 0;
  return { lines: computed, subtotalCents: totalCents - vatCents, vatCents, totalCents, vatRateBp: single, breakdown };
}

export function formatInvoiceNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export function formatRate(bp: number): string {
  return `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 2).replace(".", ",")}%`;
}
