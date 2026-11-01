/**
 * Business expenses — pure rules (unit-tested). Amounts are gross (incl.
 * VAT) in cents; the VAT part is derived from the rate the owner enters,
 * or entered exactly as printed on the receipt.
 */
import { vatFromGross } from "../finance/money";

export const EXPENSE_CATEGORIES: Record<string, string> = {
  products: "Producten & wax",
  disposables: "Wegwerpmaterialen",
  equipment: "Apparatuur & inventaris",
  rent: "Huur & ruimte",
  utilities: "Energie & water",
  insurance: "Verzekeringen",
  education: "Opleiding & cursussen",
  marketing: "Marketing & website",
  software: "Software & abonnementen",
  phone: "Telefoon & internet",
  travel: "Reiskosten",
  bank: "Bankkosten",
  accountant: "Boekhouder & administratie",
  other: "Overig",
};

export type ExpenseInput = { spentOn: string; category: string; vendor: string; description: string; amount: string; vatRate: string; vatAmount: string; status: string; notes: string };
export type ExpenseValue = { spentOn: string; category: string; vendor: string; description: string; amountCents: number; vatRateBp: number | null; vatCents: number | null; status: "paid" | "open" | "void"; notes: string | null };

export function validateExpense(i: ExpenseInput, parseCents: (v: string) => number | null): { ok: true; value: ExpenseValue } | { ok: false; error: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.spentOn)) return { ok: false, error: "Vul de datum van de uitgave in." };
  const amountCents = parseCents(i.amount);
  if (amountCents === null || amountCents <= 0) return { ok: false, error: "Vul het bedrag inclusief btw in (bijv. 24,95)." };
  if (amountCents > 10_000_000) return { ok: false, error: "Controleer het bedrag." };
  const category = EXPENSE_CATEGORIES[i.category] ? i.category : "other";
  let vatRateBp: number | null = null;
  let vatCents: number | null = null;
  if (i.vatAmount.trim()) {
    vatCents = parseCents(i.vatAmount);
    if (vatCents === null || vatCents < 0 || vatCents >= amountCents) return { ok: false, error: "Het btw-bedrag moet kleiner zijn dan het totaalbedrag." };
  } else if (i.vatRate.trim()) {
    const pct = Number(i.vatRate.replace(",", "."));
    if (!Number.isFinite(pct) || pct < 0 || pct > 50) return { ok: false, error: "Controleer het btw-percentage." };
    vatRateBp = Math.round(pct * 100);
    vatCents = vatFromGross(amountCents, vatRateBp);
  }
  const status = i.status === "open" ? "open" : i.status === "void" ? "void" : "paid";
  return {
    ok: true,
    value: { spentOn: i.spentOn, category, vendor: i.vendor.trim().slice(0, 160), description: i.description.trim().slice(0, 300), amountCents, vatRateBp, vatCents, status, notes: i.notes.trim().slice(0, 2000) || null },
  };
}

export const RECEIPT_TYPES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const RECEIPT_MAX = 10 * 1024 * 1024;

/** Checks the file signature, not just the declared type. */
export function receiptKind(bytes: Uint8Array, declared: string): string | null {
  const b = bytes;
  const sig =
    b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 ? "application/pdf"
    : b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? "image/jpeg"
    : b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 ? "image/png"
    : b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 ? "image/webp"
    : null;
  if (!sig || (declared && RECEIPT_TYPES[declared] && declared !== sig)) return null;
  return sig;
}

export function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formulas and quote everything.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}
