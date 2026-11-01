import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { DB } from "../db/client";
import { appointments, appointmentTreatments, campaigns, priceHistory, promotionRedemptions, promotions, treatments } from "../db/schema";
import { BUILTIN_ITEMS } from "../catalogue/builtin";
import { choosePromotion, isRunning, normalizeCode, type PromoLine, type Promotion } from "./core";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

export function toPromotion(r: typeof promotions.$inferSelect): Promotion {
  return {
    id: r.id,
    nameNl: r.nameNl,
    nameEn: r.nameEn,
    kind: r.kind === "fixed" ? "fixed" : "percent",
    value: r.value,
    scope: r.scope === "section" ? "section" : r.scope === "items" ? "items" : "all",
    scopeIds: Array.isArray(r.scopeIds) ? (r.scopeIds as unknown[]).filter((x): x is string => typeof x === "string") : [],
    code: r.code,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    maxUses: r.maxUses,
    usedCount: r.usedCount,
    minSpendCents: r.minSpendCents,
    status: r.status === "active" ? "active" : r.status === "archived" ? "archived" : "draft",
    showPublic: r.showPublic,
    noteNl: r.noteNl,
    noteEn: r.noteEn,
  };
}

export async function runningPromotions(db: DB | Tx, now = new Date()): Promise<Promotion[]> {
  const rows = await db.select().from(promotions).where(eq(promotions.status, "active"));
  return rows.map(toPromotion).filter((p) => isRunning(p, now));
}

/** Priced lines of an appointment (section from the catalogue row or the built-in default). */
async function linesFor(db: DB | Tx, appointmentId: number): Promise<PromoLine[]> {
  const items = await db.select().from(appointmentTreatments).where(eq(appointmentTreatments.appointmentId, appointmentId));
  if (!items.length) return [];
  const rows = await db.select({ id: treatments.id, sectionId: treatments.sectionId }).from(treatments).where(inArray(treatments.id, items.map((i) => i.treatmentId)));
  return items.map((i) => ({
    itemId: i.treatmentId,
    sectionId: rows.find((r) => r.id === i.treatmentId)?.sectionId ?? BUILTIN_ITEMS.find((b) => b.id === i.treatmentId)?.sectionId ?? "waxing",
    cents: i.priceCents ?? 0,
  }));
}

/** Pre-check of a code typed by a customer: null = fine (or no code), else a reason. */
export async function checkCode(db: DB, code: string | null | undefined, now = new Date()): Promise<"invalid" | null> {
  const c = normalizeCode(code);
  if (!c) return null;
  const [p] = await db.select().from(promotions).where(eq(promotions.code, c)).limit(1);
  return p && isRunning(toPromotion(p), now) ? null : "invalid";
}

/**
 * Applies the best promotion (or the one matching `code`) to an appointment:
 * agreed price = list total − discount; the redemption is recorded once and
 * the usage counter is raised under a row lock so a limit is never exceeded.
 * Lines without a list price ("on request") are never discounted here.
 */
export async function applyPromotion(db: DB, appointmentId: number, code: string | null, opts: { promotionId?: number; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  return db.transaction(async (tx) => {
    const [appt] = await tx.select().from(appointments).where(eq(appointments.id, appointmentId)).for("update");
    if (!appt || appt.promotionId) return null;
    const lines = await linesFor(tx, appointmentId);
    if (!lines.length || lines.some((l) => l.cents <= 0)) return null;
    let promos = await runningPromotions(tx, now);
    if (opts.promotionId) promos = promos.filter((p) => p.id === opts.promotionId).map((p) => ({ ...p, code: null }));
    const best = choosePromotion(promos, lines, code, now);
    if (!best) return null;
    const [locked] = await tx.select().from(promotions).where(eq(promotions.id, best.promotion.id)).for("update");
    if (!locked || (locked.maxUses != null && locked.usedCount >= locked.maxUses)) return null;
    const list = lines.reduce((s, l) => s + l.cents, 0);
    await tx.update(promotions).set({ usedCount: locked.usedCount + 1 }).where(eq(promotions.id, locked.id));
    await tx.insert(promotionRedemptions).values({ promotionId: locked.id, appointmentId, discountCents: best.discountCents });
    await tx.update(appointments).set({ priceCents: list - best.discountCents, discountCents: best.discountCents, promotionId: locked.id }).where(eq(appointments.id, appointmentId));
    return { promotionId: locked.id, discountCents: best.discountCents, priceCents: list - best.discountCents };
  });
}

/** Undo a promotion on an appointment (owner): restores the list price and frees the usage. */
export async function removePromotion(db: DB, appointmentId: number) {
  await db.transaction(async (tx) => {
    const [appt] = await tx.select().from(appointments).where(eq(appointments.id, appointmentId)).for("update");
    if (!appt?.promotionId) return;
    const [p] = await tx.select().from(promotions).where(eq(promotions.id, appt.promotionId)).for("update");
    if (p && p.usedCount > 0) await tx.update(promotions).set({ usedCount: p.usedCount - 1 }).where(eq(promotions.id, p.id));
    await tx.delete(promotionRedemptions).where(eq(promotionRedemptions.appointmentId, appointmentId));
    await tx.update(appointments).set({ priceCents: (appt.priceCents ?? 0) + (appt.discountCents ?? 0), discountCents: null, promotionId: null }).where(eq(appointments.id, appointmentId));
  });
}

export type CampaignView = {
  id: number;
  title: { nl: string; en: string };
  text: { nl: string; en: string };
  cta: { nl: string; en: string };
  href: string;
  mediaId: number | null;
};

export async function activeCampaigns(db: DB, now = new Date()): Promise<CampaignView[]> {
  const rows = await db.select().from(campaigns).where(eq(campaigns.status, "active")).orderBy(asc(campaigns.sort), asc(campaigns.id));
  return rows
    .filter((c) => (!c.startsAt || c.startsAt <= now) && (!c.endsAt || c.endsAt >= now))
    .map((c) => ({ id: c.id, title: { nl: c.titleNl, en: c.titleEn || c.titleNl }, text: { nl: c.textNl, en: c.textEn || c.textNl }, cta: { nl: c.ctaNl, en: c.ctaEn || c.ctaNl }, href: c.href, mediaId: c.mediaId }));
}

/** Price history rows for the given items (for the 30-day reference price). */
export async function historyFor(db: DB, itemIds: string[]) {
  if (!itemIds.length) return [];
  return db.select().from(priceHistory).where(and(inArray(priceHistory.itemId, itemIds)));
}
