/**
 * Money helpers. All amounts are integer cents; no floating-point
 * arithmetic is ever used for money (parsing works on the digits).
 */

/** "45" · "45,5" · "45,50" · "€ 1.234,56" · "45.50" → cents. Null when empty or invalid. */
export function parseEuroToCents(raw: string | null | undefined): number | null {
  let v = (raw ?? "").replace(/€|\s|eur/gi, "");
  if (!v) return null;
  const negative = v.startsWith("-");
  if (negative) v = v.slice(1);
  // Dutch input: "." groups thousands, "," (or a "." followed by 1–2 digits) is the decimal mark.
  // Ambiguous input such as "12,345" is rejected rather than guessed.
  const m = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:[.,](\d{1,2}))?$/.exec(v);
  if (!m) return null;
  const whole = m[1].replace(/[.,]/g, "");
  const frac = (m[2] ?? "").padEnd(2, "0");
  if (whole.length > 7) return null; // > € 9.999.999 is never a treatment amount
  const cents = Number(whole) * 100 + Number(frac || "0");
  return negative ? -cents : cents;
}

/** 4550 → "€ 45,50" (nl) / "€45.50" (en). */
export function formatCents(cents: number, locale: "nl" | "en" = "nl"): string {
  const neg = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const euros = Math.floor(abs / 100).toString();
  const rest = String(abs % 100).padStart(2, "0");
  const grouped = euros.replace(/\B(?=(\d{3})+(?!\d))/g, locale === "nl" ? "." : ",");
  const body = locale === "nl" ? `€ ${grouped},${rest}` : `€${grouped}.${rest}`;
  return neg ? `-${body}` : body;
}

/** "45,50" for form inputs. */
export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  const abs = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/**
 * VAT on a line, rates in basis points (2100 = 21%). Prices are entered
 * INCLUDING VAT (consumer prices); the VAT part is derived with
 * round-half-up on integer cents: vat = round(gross × rate / (10000 + rate)).
 */
export function vatFromGross(grossCents: number, rateBp: number): number {
  if (!rateBp) return 0;
  const num = grossCents * rateBp;
  const den = 10000 + rateBp;
  const q = Math.trunc(num / den);
  const r = num - q * den;
  return 2 * Math.abs(r) >= den ? q + Math.sign(num) : q;
}

export function sumCents(values: number[]): number {
  return values.reduce((s, v) => s + Math.trunc(v), 0);
}
