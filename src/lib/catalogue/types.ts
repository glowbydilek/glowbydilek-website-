/**
 * Service catalogue model (pure, client-safe types).
 *
 * Section  → top-level service area with its own URL root
 *            (/waxbehandelingen, /gezichtsbehandelingen, /pakketten …)
 * Group    → optional sub-category inside a section (waxing: face/body/bikini)
 * Item     → a bookable treatment or a package (kind = "package")
 *
 * Built-in entries (src/lib/catalogue/builtin.ts) are the defaults; rows in
 * the database (owner edits and owner-created entries) override and extend
 * them. Only `published` entries are public.
 */
import type { PhotoId } from "@/content/media";

export type L = { nl: string; en: string };
export type Status = "draft" | "published" | "archived";
export type PricingMode = "fixed" | "from" | "on_request";
export type VatCategory = "standard" | "reduced" | "zero" | "exempt";

export const STATUSES: Status[] = ["draft", "published", "archived"];
export const PRICING_MODES: PricingMode[] = ["fixed", "from", "on_request"];
export const VAT_CATEGORIES: VatCategory[] = ["standard", "reduced", "zero", "exempt"];

export type Section = {
  id: string;
  kind: "treatments" | "packages";
  slug: L;
  name: L;
  status: Status;
  sort: number;
  photo: PhotoId;
  mediaId: number | null;
  builtin: boolean;
};

export type Group = {
  id: string;
  sectionId: string;
  slug: L;
  name: L;
  status: Status;
  sort: number;
  photo: PhotoId;
  mediaId: number | null;
  builtin: boolean;
};

export type PackagePart = { treatmentId: string; quantity: number };

export type Item = {
  id: string;
  kind: "treatment" | "package";
  sectionId: string;
  groupId: string | null;
  slug: L;
  name: L;
  description: L;
  photo: PhotoId;
  mediaId: number | null;
  status: Status;
  /** Owner switches from the pre-0002 admin (kept for compatibility). */
  active: boolean;
  visible: boolean;
  featured: boolean;
  bookableOnline: boolean;
  sort: number;
  pricing: { mode: PricingMode; cents: number | null };
  durationMinutes: number | null;
  bufferMinutes: number;
  vat: VatCategory;
  related: string[];
  parts: PackagePart[];
  builtin: boolean;
};

export type Catalogue = { sections: Section[]; groups: Group[]; items: Item[] };

/** Raw database rows as loaded into the content snapshot. */
export type CatalogueRows = {
  sections: {
    id: string;
    kind: string;
    slugNl: string;
    slugEn: string;
    nameNl: string;
    nameEn: string;
    status: string;
    mediaId: number | null;
    sort: number;
  }[];
  groups: {
    id: string;
    sectionId: string;
    slugNl: string;
    slugEn: string;
    nameNl: string;
    nameEn: string;
    status: string;
    mediaId: number | null;
    sort: number;
  }[];
  parts: { packageId: string; treatmentId: string; quantity: number; sort: number }[];
};

/** Slug rule shared by admin validation and the router. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
