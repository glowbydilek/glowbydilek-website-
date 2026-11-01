/**
 * Validation for catalogue edits in the admin (pure; unit-tested).
 * Slugs must be lower-case, unique among their siblings and must never
 * shadow a fixed page (prijzen, contact, admin, …).
 */
import { routes } from "@/i18n/config";
import { parseEuroToCents } from "../finance/money";
import { PRICING_MODES, SLUG_RE, STATUSES, VAT_CATEGORIES, type PricingMode, type Status, type VatCategory } from "./types";

/** First path segments that belong to fixed pages or system routes. */
export const RESERVED_ROOTS = new Set<string>([
  ...Object.values(routes).flatMap((r) => [r.nl, r.en]).map((p) => p.replace(/^\/en(?=\/|$)/, "").split("/").filter(Boolean)[0]).filter((x): x is string => Boolean(x)),
  "admin", "agenda", "ajanda", "login", "api", "media", "en", "info", "_next", "brand", "images", "merkidentiteit",
  "sitemap.xml", "robots.txt", "manifest.webmanifest", "icon.svg", "apple-icon.png", "offerte", "quote",
  "cookiebeleid", "cookie-policy", "algemene-voorwaarden", "terms", "annuleringsbeleid", "cancellation-policy", "beoordelingsbeleid", "review-policy",
  "producten", "products",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " en ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function slugError(slug: string, opts: { root?: boolean; taken?: string[] } = {}): string | null {
  if (!slug) return "Vul een webadres (slug) in.";
  if (!SLUG_RE.test(slug) || slug.length > 80) return "Gebruik alleen kleine letters, cijfers en streepjes (bijv. complete-gezichtsbehandeling).";
  if (opts.root && RESERVED_ROOTS.has(slug)) return `Het adres “/${slug}” is al in gebruik door een vaste pagina.`;
  if (opts.taken?.includes(slug)) return `Het adres “${slug}” is al in gebruik.`;
  return null;
}

export type PriceInput = { mode: string; price: string; duration: string; buffer: string; vat: string };
export type PriceResult =
  | { ok: true; value: { pricingMode: PricingMode; priceCents: number | null; priceFrom: boolean; durationMinutes: number | null; bufferMinutes: number; vatCategory: VatCategory } }
  | { ok: false; error: string };

/** Price mode + amount + duration rules. A fixed or "from" price needs an amount; never €0. */
export function validatePricing(i: PriceInput): PriceResult {
  const mode = (PRICING_MODES as string[]).includes(i.mode) ? (i.mode as PricingMode) : null;
  if (!mode) return { ok: false, error: "Kies hoe de prijs wordt getoond." };
  let priceCents: number | null = null;
  if (mode !== "on_request") {
    const c = parseEuroToCents(i.price);
    if (c === null || c <= 0) return { ok: false, error: "Vul een prijs in (bijv. 35 of 42,50), of kies ‘Prijs op aanvraag’." };
    if (c > 1_000_000) return { ok: false, error: "Controleer de prijs." };
    priceCents = c;
  }
  const d = i.duration.trim();
  const durationMinutes = d === "" ? null : Number(d);
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 600)) return { ok: false, error: "De duur moet tussen 5 en 600 minuten liggen." };
  const b = i.buffer.trim();
  const bufferMinutes = b === "" ? 0 : Number(b);
  if (!Number.isInteger(bufferMinutes) || bufferMinutes < 0 || bufferMinutes > 120) return { ok: false, error: "De opruimtijd moet tussen 0 en 120 minuten liggen." };
  const vatCategory = (VAT_CATEGORIES as string[]).includes(i.vat) ? (i.vat as VatCategory) : "standard";
  return { ok: true, value: { pricingMode: mode, priceCents, priceFrom: mode === "from", durationMinutes, bufferMinutes, vatCategory } };
}

export function asStatus(v: string): Status | null {
  return (STATUSES as string[]).includes(v) ? (v as Status) : null;
}

/** Package contents: 2–12 distinct treatments, quantity 1–10, no packages inside packages. */
export function validateParts(parts: { treatmentId: string; quantity: number }[], treatmentIds: string[]): string | null {
  if (parts.length < 2) return "Een pakket bestaat uit minimaal twee behandelingen.";
  if (parts.length > 12) return "Een pakket kan maximaal 12 behandelingen bevatten.";
  const seen = new Set<string>();
  for (const p of parts) {
    if (!treatmentIds.includes(p.treatmentId)) return "Een gekozen behandeling bestaat niet (meer).";
    if (seen.has(p.treatmentId)) return "Elke behandeling kan maar één keer in een pakket staan; gebruik het aantal.";
    seen.add(p.treatmentId);
    if (!Number.isInteger(p.quantity) || p.quantity < 1 || p.quantity > 10) return "Het aantal per behandeling moet tussen 1 en 10 liggen.";
  }
  return null;
}
