/**
 * The live service catalogue: built-in entries merged with the owner's
 * database rows from the current content snapshot. Pure module (no database
 * access), so it works in tests and in builds without a database.
 */
import type { Locale } from "@/i18n/config";
import { currentSnapshot, type TreatmentLive } from "../cms/current";
import { BUILTIN_GROUPS, BUILTIN_ITEMS, BUILTIN_SECTIONS } from "./builtin";
import type { Catalogue, Group, Item, PricingMode, Section, Status, VatCategory } from "./types";
import { PRICING_MODES, STATUSES, VAT_CATEGORIES } from "./types";

export * from "./types";

const asStatus = (v: unknown, d: Status): Status => (STATUSES.includes(v as Status) ? (v as Status) : d);
const asVat = (v: unknown): VatCategory => (VAT_CATEGORIES.includes(v as VatCategory) ? (v as VatCategory) : "standard");
const strArr = (v: unknown): string[] | null => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : null);

export function pricingOf(t: Pick<TreatmentLive, "priceCents" | "priceFrom"> & { pricingMode?: string | null }): Item["pricing"] {
  let mode: PricingMode = PRICING_MODES.includes(t.pricingMode as PricingMode)
    ? (t.pricingMode as PricingMode)
    : t.priceCents == null
      ? "on_request"
      : t.priceFrom
        ? "from"
        : "fixed";
  // A fixed or "from" price without an amount is shown as "on request" (never €0).
  if (mode !== "on_request" && (t.priceCents == null || t.priceCents <= 0)) mode = "on_request";
  return { mode, cents: mode === "on_request" ? null : t.priceCents };
}

function mergeItem(base: Item | undefined, t: TreatmentLive, groups: Group[]): Item {
  const sectionId = t.sectionId ?? base?.sectionId ?? "waxing";
  const groupCandidate = t.groupId ?? base?.groupId ?? (groups.some((g) => g.id === t.category && g.sectionId === sectionId) ? t.category : null);
  const sectionPhoto = BUILTIN_SECTIONS.find((s) => s.id === sectionId)?.photo ?? "botanical";
  return {
    id: t.id,
    kind: t.kind === "package" ? "package" : (base?.kind ?? "treatment"),
    sectionId,
    groupId: groupCandidate ?? null,
    slug: { nl: t.slugNl || base?.slug.nl || t.id, en: t.slugEn || base?.slug.en || t.id },
    name: { nl: t.nameNl || base?.name.nl || t.id, en: t.nameEn || base?.name.en || t.nameNl || t.id },
    description: { nl: t.descriptionNl || base?.description.nl || "", en: t.descriptionEn || base?.description.en || t.descriptionNl || "" },
    photo: base?.photo ?? sectionPhoto,
    mediaId: t.mediaId,
    status: asStatus(t.status, base?.status ?? "published"),
    active: t.active,
    visible: t.visible,
    featured: t.featured,
    bookableOnline: t.bookableOnline,
    sort: t.sort,
    pricing: pricingOf(t),
    durationMinutes: t.durationMinutes,
    bufferMinutes: t.bufferMinutes ?? 0,
    vat: asVat(t.vatCategory),
    related: strArr(t.related) ?? base?.related ?? [],
    parts: base?.parts ?? [],
    builtin: Boolean(base),
  };
}

const byOrder = <T extends { sort: number; id: string }>(a: T, b: T) => a.sort - b.sort || a.id.localeCompare(b.id);

let memo: { key: unknown; cat: Catalogue } | null = null;

/** The merged catalogue for the current request (memoised per snapshot). */
export function getCatalogue(): Catalogue {
  const snap = currentSnapshot();
  if (memo && memo.key === snap) return memo.cat;
  const rows = snap.catalogue;

  const sections = new Map<string, Section>(BUILTIN_SECTIONS.map((s) => [s.id, s]));
  for (const r of rows?.sections ?? []) {
    const b = sections.get(r.id);
    sections.set(r.id, {
      id: r.id,
      kind: r.kind === "packages" ? "packages" : "treatments",
      slug: { nl: r.slugNl, en: r.slugEn },
      name: { nl: r.nameNl, en: r.nameEn || r.nameNl },
      status: asStatus(r.status, "draft"),
      sort: r.sort,
      photo: b?.photo ?? "botanical",
      mediaId: r.mediaId,
      builtin: Boolean(b),
    });
  }
  const groups = new Map<string, Group>(BUILTIN_GROUPS.map((g) => [g.id, g]));
  for (const r of rows?.groups ?? []) {
    const b = groups.get(r.id);
    groups.set(r.id, {
      id: r.id,
      sectionId: r.sectionId,
      slug: { nl: r.slugNl, en: r.slugEn },
      name: { nl: r.nameNl, en: r.nameEn || r.nameNl },
      status: asStatus(r.status, "draft"),
      sort: r.sort,
      photo: b?.photo ?? sections.get(r.sectionId)?.photo ?? "botanical",
      mediaId: r.mediaId,
      builtin: Boolean(b),
    });
  }
  const groupList = [...groups.values()];
  const items = new Map<string, Item>(BUILTIN_ITEMS.map((i) => [i.id, i]));
  for (const t of snap.treatments.values()) items.set(t.id, mergeItem(items.get(t.id), t, groupList));
  if (rows?.parts?.length) {
    const byPkg = new Map<string, Item["parts"]>();
    for (const p of [...rows.parts].sort((a, b) => a.sort - b.sort)) {
      const list = byPkg.get(p.packageId) ?? [];
      list.push({ treatmentId: p.treatmentId, quantity: Math.max(1, p.quantity) });
      byPkg.set(p.packageId, list);
    }
    for (const [id, parts] of byPkg) {
      const it = items.get(id);
      if (it) items.set(id, { ...it, parts });
    }
  }
  const cat: Catalogue = {
    sections: [...sections.values()].sort(byOrder),
    groups: groupList.sort(byOrder),
    items: [...items.values()].sort(byOrder),
  };
  memo = { key: snap, cat };
  return cat;
}

// ───────────────────────────────────────────────────────────── Visibility

/** Draft preview (signed-in owner in draft mode) shows drafts too. */
const previewing = () => currentSnapshot().preview;
const shown = (s: Status) => s === "published" || (previewing() && s === "draft");

export function sectionById(id: string): Section | undefined {
  return getCatalogue().sections.find((s) => s.id === id);
}
export function groupById(id: string): Group | undefined {
  return getCatalogue().groups.find((g) => g.id === id);
}
export function itemById(id: string): Item | undefined {
  return getCatalogue().items.find((i) => i.id === id);
}

export function isPublicItem(i: Item, seen = new Set<string>()): boolean {
  if (!shown(i.status) || !i.active || !i.visible) return false;
  const s = sectionById(i.sectionId);
  if (!s || !shown(s.status)) return false;
  if (i.groupId) {
    const g = groupById(i.groupId);
    if (!g || !shown(g.status)) return false;
  }
  if (i.kind === "package") {
    // A package is public only when every part is (never leak a draft treatment's name).
    if (!i.parts.length || seen.has(i.id)) return false;
    seen.add(i.id);
    return i.parts.every((p) => {
      const part = itemById(p.treatmentId);
      return Boolean(part && part.kind === "treatment" && isPublicItem(part, seen));
    });
  }
  return true;
}

export function publicItems(filter?: { sectionId?: string; groupId?: string | null }): Item[] {
  return getCatalogue().items.filter(
    (i) =>
      (!filter?.sectionId || i.sectionId === filter.sectionId) &&
      (filter?.groupId === undefined || i.groupId === filter.groupId) &&
      isPublicItem(i),
  );
}

export function publicGroups(sectionId: string): Group[] {
  return getCatalogue().groups.filter((g) => g.sectionId === sectionId && shown(g.status) && publicItems({ sectionId, groupId: g.id }).length > 0);
}

export function publicSections(): Section[] {
  return getCatalogue().sections.filter((s) => shown(s.status) && publicItems({ sectionId: s.id }).length > 0);
}

// ─────────────────────────────────────────────────────────────── Paths

const prefix = (locale: Locale) => (locale === "en" ? "/en" : "");

export function sectionHref(locale: Locale, s: Section | string): string {
  const sec = typeof s === "string" ? sectionById(s) : s;
  return sec ? `${prefix(locale)}/${sec.slug[locale]}` : prefix(locale) || "/";
}

export function groupHref(locale: Locale, g: Group | string): string {
  const grp = typeof g === "string" ? groupById(g) : g;
  if (!grp) return prefix(locale) || "/";
  return `${sectionHref(locale, grp.sectionId)}/${grp.slug[locale]}`;
}

export function itemHref(locale: Locale, i: Item | string): string {
  const it = typeof i === "string" ? itemById(i) : i;
  if (!it) return prefix(locale) || "/";
  return it.groupId ? `${groupHref(locale, it.groupId)}/${it.slug[locale]}` : `${sectionHref(locale, it.sectionId)}/${it.slug[locale]}`;
}

export type Resolved =
  | { type: "section"; section: Section }
  | { type: "group"; section: Section; group: Group }
  | { type: "item"; section: Section; group: Group | null; item: Item };

/** Map URL segments (after the optional /en) to a public catalogue page. */
export function resolveCatalogue(locale: Locale, segments: string[]): Resolved | null {
  const [s1, s2, s3, ...rest] = segments.map((x) => decodeURIComponent(x).toLowerCase());
  if (!s1 || rest.length) return null;
  const section = getCatalogue().sections.find((s) => s.slug[locale] === s1);
  if (!section || !shown(section.status)) return null;
  if (!s2) return publicItems({ sectionId: section.id }).length || previewing() ? { type: "section", section } : null;
  const group = getCatalogue().groups.find((g) => g.sectionId === section.id && g.slug[locale] === s2);
  if (group) {
    if (!shown(group.status)) return null;
    if (!s3) return { type: "group", section, group };
    const item = getCatalogue().items.find((i) => i.groupId === group.id && i.slug[locale] === s3);
    return item && isPublicItem(item) ? { type: "item", section, group, item } : null;
  }
  if (s3) return null;
  const item = getCatalogue().items.find((i) => i.sectionId === section.id && !i.groupId && i.slug[locale] === s2);
  return item && isPublicItem(item) ? { type: "item", section, group: null, item } : null;
}

/** Path of the same catalogue page in the other language (language switcher). */
export function alternateCataloguePath(pathname: string, target: Locale): string | null {
  const from: Locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nl";
  const segs = pathname.replace(/^\/en(?=\/|$)/, "").split(/[?#]/)[0].split("/").filter(Boolean);
  const r = resolveCatalogue(from, segs);
  if (!r) return null;
  if (r.type === "section") return sectionHref(target, r.section);
  if (r.type === "group") return groupHref(target, r.group);
  return itemHref(target, r.item);
}

// ─────────────────────────────────────────────────────────────── Prices

export function itemDuration(i: Item): number | null {
  if (i.durationMinutes) return i.durationMinutes;
  if (i.kind !== "package" || !i.parts.length) return null;
  let total = 0;
  for (const p of i.parts) {
    const part = itemById(p.treatmentId);
    if (!part?.durationMinutes) return null;
    total += part.durationMinutes * p.quantity;
  }
  return total;
}

/** Human price label; never "€0". */
export function priceLabel(i: Item, locale: Locale, words: { from: string; onRequest: string }): string {
  if (i.pricing.mode === "on_request" || i.pricing.cents == null) return words.onRequest;
  const amount = new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: i.pricing.cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(i.pricing.cents / 100);
  return i.pricing.mode === "from" ? `${words.from} ${amount}` : amount;
}
