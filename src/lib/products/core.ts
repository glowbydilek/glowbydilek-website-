/**
 * Products & materials — pure helpers (unit-tested).
 * Usage notes are only what the owner verified; nothing is pre-filled.
 */
export const PRODUCT_CATEGORIES: Record<string, string> = {
  wax: "Wax",
  pre: "Voorbereiding (reiniging, pre-wax)",
  post: "Nazorg (na-wax, kalmerend)",
  skincare: "Huidverzorging",
  mask: "Maskers",
  peel: "Peeling",
  massage: "Massage-olie / -crème",
  body: "Lichaamsverzorging",
  hygiene: "Hygiëne & desinfectie",
  disposables: "Wegwerpmaterialen",
  equipment: "Apparatuur",
  other: "Overig",
};

export const MOVEMENT_REASONS: Record<string, string> = { purchase: "Inkoop", used: "Verbruikt", correction: "Correctie / telling", expired: "Over datum / afgevoerd" };

export type ProtocolStep = { title: string; body: string; productIds: number[] };

export function parseSteps(raw: unknown): ProtocolStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 20)
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({
      title: typeof x.title === "string" ? x.title.trim().slice(0, 120) : "",
      body: typeof x.body === "string" ? x.body.trim().slice(0, 1000) : "",
      productIds: Array.isArray(x.productIds) ? x.productIds.filter((n): n is number => Number.isInteger(n)).slice(0, 10) : [],
    }))
    .filter((x) => x.title);
}

/** Signed stock change for a movement (purchase adds; used/expired subtract; correction is signed as entered). */
export function movementDelta(reason: string, qty: number): number {
  if (!Number.isInteger(qty) || qty === 0) return 0;
  if (reason === "purchase") return Math.abs(qty);
  if (reason === "used" || reason === "expired") return -Math.abs(qty);
  return qty;
}

export type StockFlag = "low" | "out" | "expired" | "expiring" | null;

/** Warnings for the admin overview: out of stock, at/below reorder level, expired or expiring within 30 days. */
export function stockFlags(p: { stockQty: number | null; reorderLevel: number | null; expiresOn: string | null; status: string }, today: string): StockFlag[] {
  if (p.status !== "active") return [];
  const flags: StockFlag[] = [];
  if (p.stockQty != null && p.stockQty <= 0) flags.push("out");
  else if (p.stockQty != null && p.reorderLevel != null && p.stockQty <= p.reorderLevel) flags.push("low");
  if (p.expiresOn) {
    if (p.expiresOn < today) flags.push("expired");
    else {
      const d = new Date(`${today}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 30);
      if (p.expiresOn <= d.toISOString().slice(0, 10)) flags.push("expiring");
    }
  }
  return flags;
}
