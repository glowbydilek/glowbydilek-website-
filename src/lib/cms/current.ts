import type { CatalogueRows } from "../catalogue/types";
import type { Promotion } from "../promotions/core";

export type MarketingSnapshot = {
  /** Running promotions the owner chose to show on the website. */
  promotions: Promotion[];
  campaigns: { id: number; title: { nl: string; en: string }; text: { nl: string; en: string }; cta: { nl: string; en: string }; href: string; mediaId: number | null }[];
  /** True while at least one running promotion uses a code (the booking forms then show a code field). */
  hasCodes: boolean;
  /** Price history per item id (for the 30-day reference price next to an offer). */
  history: Record<string, { createdAt: Date; priceCents: number | null; pricingMode: string }[]>;
};

/**
 * The content snapshot used while rendering. Pure module: the server-only
 * store registers a resolver (per request, published or draft preview);
 * without it (tests, build without a database) every getter falls back to
 * the built-in content.
 */
export type TreatmentLive = {
  id: string;
  priceCents: number | null;
  priceFrom: boolean;
  durationMinutes: number | null;
  active: boolean;
  visible: boolean;
  featured: boolean;
  bookableOnline: boolean;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
  descriptionEn: string;
  mediaId: number | null;
  category: string;
  sort: number;
  bufferMinutes: number;
  /** Catalogue columns (migration 0002; optional so pre-0002 snapshots still type-check). */
  kind?: string;
  sectionId?: string | null;
  groupId?: string | null;
  slugNl?: string | null;
  slugEn?: string | null;
  status?: string;
  pricingMode?: string | null;
  vatCategory?: string;
  related?: unknown;
};

export type PhotoOverride = { mediaId: number; version: number; width: number; height: number; altNl: string; altEn: string; focusMobile: string; focusDesktop: string };

export type Snapshot = {
  /** `${docKey}|${locale}` → owner override */
  docs: Map<string, unknown>;
  treatments: Map<string, TreatmentLive>;
  /** Sections, groups and package contents (null without a database). */
  catalogue: CatalogueRows | null;
  marketing: MarketingSnapshot | null;
  photos: Map<string, PhotoOverride>;
  preview: boolean;
  version: number;
};

export const EMPTY_SNAPSHOT: Snapshot = { docs: new Map(), treatments: new Map(), catalogue: null, marketing: null, photos: new Map(), preview: false, version: 0 };

let resolver: () => Snapshot | null = () => null;

export function setSnapshotResolver(fn: () => Snapshot | null) {
  resolver = fn;
}

export function currentSnapshot(): Snapshot {
  try {
    return resolver() ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function override(docKey: string, locale: string): unknown {
  return currentSnapshot().docs.get(`${docKey}|${locale}`);
}
