/**
 * Public offers (pure, reads the content snapshot): which visible promotion
 * applies to a catalogue item, its action price and the honest reference
 * price (lowest price of the past 30 days). Nothing is shown for items
 * without a fixed list price.
 */
import type { Locale } from "@/i18n/config";
import { currentSnapshot } from "../cms/current";
import type { Item } from "../catalogue/types";
import { appliesTo, discountFor, lowestPrice30, type Promotion } from "./core";

export type Offer = {
  promotion: Promotion;
  label: string;
  note: string | null;
  /** Action price in cents (fixed-price items only). */
  actionCents: number | null;
  /** Lowest price of the past 30 days, when the history covers that period. */
  referenceCents: number | null;
  until: Date | null;
  code: string | null;
};

const pct = (bp: number) => `${(bp / 100).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%`;

export function offerFor(item: Item, locale: Locale, now = new Date()): Offer | null {
  const m = currentSnapshot().marketing;
  if (!m?.promotions.length) return null;
  const line = { itemId: item.id, sectionId: item.sectionId, cents: item.pricing.mode === "fixed" ? (item.pricing.cents ?? 0) : 0 };
  const candidates = m.promotions.filter((p) => appliesTo(p, line));
  if (!candidates.length) return null;
  const scored = candidates.map((p) => ({ p, d: line.cents ? discountFor({ ...p, minSpendCents: null }, [line]) : 0 })).sort((a, b) => b.d - a.d);
  const { p, d } = scored[0];
  const label =
    p.kind === "percent"
      ? locale === "nl" ? `${pct(p.value)} korting` : `${pct(p.value)} off`
      : locale === "nl" ? `€ ${(p.value / 100).toFixed(2).replace(".", ",")} korting` : `€${(p.value / 100).toFixed(2)} off`;
  return {
    promotion: p,
    label,
    note: (locale === "nl" ? p.noteNl : p.noteEn || p.noteNl) ?? null,
    actionCents: d > 0 && !p.code && !p.minSpendCents ? line.cents - d : null,
    referenceCents: line.cents ? lowestPrice30(m.history[item.id] ?? [], line.cents, now) : null,
    until: p.endsAt,
    code: p.code,
  };
}
