/**
 * Promotions & discounts — pure rules (unit-tested).
 *
 * - One promotion per appointment (no stacking): the best valid one wins.
 * - Percentage (basis points) or fixed amount (cents), never below € 0.
 * - Scope: everything, whole sections, or specific treatments/packages.
 * - Automatic promotions apply by themselves; code promotions need the code.
 * - Honest pricing: a "from" reference price is the LOWEST price of the past
 *   30 days (EU price indication rules), never an invented "was" price.
 */
export type PromoKind = "percent" | "fixed";
export type PromoScope = "all" | "section" | "items";
export type PromoStatus = "draft" | "active" | "archived";

export type Promotion = {
  id: number;
  nameNl: string;
  nameEn: string;
  kind: PromoKind;
  /** percent: basis points (1500 = 15%); fixed: cents. */
  value: number;
  scope: PromoScope;
  scopeIds: string[];
  code: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  minSpendCents: number | null;
  status: PromoStatus;
  showPublic: boolean;
  noteNl: string | null;
  noteEn: string | null;
};

export type PromoLine = { itemId: string; sectionId: string; cents: number };

export function normalizeCode(v: string | null | undefined): string | null {
  const c = (v ?? "").trim().toUpperCase().replace(/\s+/g, "");
  return c ? c : null;
}

export function isRunning(p: Promotion, now = new Date()): boolean {
  if (p.status !== "active") return false;
  if (p.startsAt && now < p.startsAt) return false;
  if (p.endsAt && now > p.endsAt) return false;
  if (p.maxUses != null && p.usedCount >= p.maxUses) return false;
  return true;
}

export function appliesTo(p: Promotion, line: Pick<PromoLine, "itemId" | "sectionId">): boolean {
  if (p.scope === "all") return true;
  if (p.scope === "section") return p.scopeIds.includes(line.sectionId);
  return p.scopeIds.includes(line.itemId);
}

/** Discount in cents for a set of priced lines (lines without a price are ignored). */
export function discountFor(p: Promotion, lines: PromoLine[]): number {
  const eligible = lines.filter((l) => l.cents > 0 && appliesTo(p, l));
  const base = eligible.reduce((s, l) => s + l.cents, 0);
  if (!base) return 0;
  const total = lines.reduce((s, l) => s + Math.max(0, l.cents), 0);
  if (p.minSpendCents != null && total < p.minSpendCents) return 0;
  const raw = p.kind === "percent" ? Math.floor((base * p.value + 5000) / 10000) : p.value;
  return Math.max(0, Math.min(base, raw));
}

/**
 * The promotion to apply: the code promotion when a valid code is given,
 * else the best running automatic one. Returns null when nothing applies.
 */
export function choosePromotion(promos: Promotion[], lines: PromoLine[], code: string | null, now = new Date()): { promotion: Promotion; discountCents: number } | null {
  const c = normalizeCode(code);
  const candidates = promos.filter((p) => isRunning(p, now) && (p.code ? c !== null && p.code === c : true));
  let best: { promotion: Promotion; discountCents: number } | null = null;
  for (const p of candidates) {
    const d = discountFor(p, lines);
    if (d > 0 && (!best || d > best.discountCents)) best = { promotion: p, discountCents: d };
  }
  return best;
}

export type PromoInput = {
  nameNl: string;
  nameEn: string;
  kind: string;
  value: string;
  scope: string;
  scopeIds: string[];
  code: string;
  startsAt: string;
  endsAt: string;
  maxUses: string;
  minSpend: string;
  status: string;
  showPublic: boolean;
  noteNl: string;
  noteEn: string;
};

export type PromoValid = Omit<Promotion, "id" | "usedCount">;

/** Validates the admin form. Dates are YYYY-MM-DD (Europe/Amsterdam days; end inclusive). */
export function validatePromotion(i: PromoInput, parseCents: (v: string) => number | null, dayStart: (d: string) => Date, dayEnd: (d: string) => Date): { ok: true; value: PromoValid } | { ok: false; error: string } {
  const nameNl = i.nameNl.trim().slice(0, 120);
  const nameEn = (i.nameEn.trim() || nameNl).slice(0, 120);
  if (!nameNl) return { ok: false, error: "Geef de actie een naam." };
  const kind = i.kind === "fixed" ? "fixed" : i.kind === "percent" ? "percent" : null;
  if (!kind) return { ok: false, error: "Kies percentage of vast bedrag." };
  let value: number;
  if (kind === "percent") {
    const pct = Number(i.value.replace(",", "."));
    if (!Number.isFinite(pct) || pct <= 0 || pct > 90) return { ok: false, error: "Een percentage ligt tussen 0 en 90." };
    value = Math.round(pct * 100);
  } else {
    const c = parseCents(i.value);
    if (c === null || c <= 0) return { ok: false, error: "Vul een geldig kortingsbedrag in." };
    value = c;
  }
  const scope = (["all", "section", "items"] as const).find((s) => s === i.scope) ?? "all";
  const scopeIds = scope === "all" ? [] : [...new Set(i.scopeIds.filter(Boolean))].slice(0, 100);
  if (scope !== "all" && !scopeIds.length) return { ok: false, error: "Kies voor welke categorieën of behandelingen de actie geldt." };
  const code = normalizeCode(i.code);
  if (code && !/^[A-Z0-9-]{3,30}$/.test(code)) return { ok: false, error: "Een actiecode bestaat uit 3–30 letters, cijfers of streepjes." };
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if ((i.startsAt && !re.test(i.startsAt)) || (i.endsAt && !re.test(i.endsAt))) return { ok: false, error: "Controleer de datums." };
  const startsAt = i.startsAt ? dayStart(i.startsAt) : null;
  const endsAt = i.endsAt ? dayEnd(i.endsAt) : null;
  if (startsAt && endsAt && endsAt < startsAt) return { ok: false, error: "De einddatum ligt vóór de begindatum." };
  const maxUses = i.maxUses.trim() ? Number(i.maxUses) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100000)) return { ok: false, error: "Het maximum aantal keer is een heel getal vanaf 1." };
  const minSpendCents = i.minSpend.trim() ? parseCents(i.minSpend) : null;
  if (i.minSpend.trim() && (minSpendCents === null || minSpendCents < 0)) return { ok: false, error: "Controleer het minimale bedrag." };
  const status = (["draft", "active", "archived"] as const).find((s) => s === i.status) ?? "draft";
  return {
    ok: true,
    value: { nameNl, nameEn, kind, value, scope, scopeIds, code, startsAt, endsAt, maxUses, minSpendCents, status, showPublic: i.showPublic, noteNl: i.noteNl.trim().slice(0, 300) || null, noteEn: i.noteEn.trim().slice(0, 300) || null },
  };
}

/**
 * Lowest list price in the 30 days before `now` (EU price-reduction rule),
 * from the recorded price history plus the current price. Null when the
 * history does not cover the full 30 days (then no reference price is shown).
 */
export function lowestPrice30(history: { createdAt: Date; priceCents: number | null; pricingMode: string }[], current: number, now = new Date()): number | null {
  const from = new Date(now.getTime() - 30 * 86_400_000);
  const sorted = [...history].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  // Price in effect at the start of the window: the last change before it.
  const before = sorted.filter((h) => h.createdAt <= from).pop();
  if (!before) return null;
  const inWindow = sorted.filter((h) => h.createdAt > from);
  const prices = [before, ...inWindow].filter((h) => h.pricingMode !== "on_request" && h.priceCents != null).map((h) => h.priceCents as number);
  if (!prices.length) return null;
  return Math.min(current, ...prices);
}
