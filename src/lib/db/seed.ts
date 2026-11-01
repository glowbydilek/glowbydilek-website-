import { sql } from "drizzle-orm";
import { BUILTIN_GROUPS, BUILTIN_ITEMS, BUILTIN_SECTIONS } from "../catalogue/builtin";
import type { DB } from "./client";
import { packageItems, serviceGroups, serviceSections, treatments } from "./schema";

/**
 * Seeds the catalogue from the approved site content: sections, waxing zones,
 * the 13 waxing treatments (published) and the planned facial, body, massage
 * and package entries (DRAFT — never public until the owner publishes them).
 * INSERT IGNORE: rows the owner already edited (prices, durations, texts,
 * status) are never overwritten by a deployment. No prices or durations are
 * invented — those start empty and are filled in by the owner.
 */
export async function seedTreatments(db: DB): Promise<void> {
  await db.insert(serviceSections).ignore().values(
    BUILTIN_SECTIONS.map((s) => ({ id: s.id, kind: s.kind, slugNl: s.slug.nl, slugEn: s.slug.en, nameNl: s.name.nl, nameEn: s.name.en, status: s.status, sort: s.sort })),
  );
  await db.insert(serviceGroups).ignore().values(
    BUILTIN_GROUPS.map((g) => ({ id: g.id, sectionId: g.sectionId, slugNl: g.slug.nl, slugEn: g.slug.en, nameNl: g.name.nl, nameEn: g.name.en, status: g.status, sort: g.sort })),
  );
  await db.insert(treatments).ignore().values(
    BUILTIN_ITEMS.map((t) => ({
      id: t.id,
      kind: t.kind,
      category: t.groupId ?? t.sectionId,
      sectionId: t.sectionId,
      groupId: t.groupId,
      slugNl: t.slug.nl,
      slugEn: t.slug.en,
      status: t.status,
      nameNl: t.name.nl,
      nameEn: t.name.en,
      descriptionNl: t.description.nl,
      descriptionEn: t.description.en,
      pricingMode: t.pricing.mode,
      priceCents: t.pricing.cents,
      priceFrom: t.pricing.mode === "from",
      durationMinutes: t.durationMinutes,
      related: t.related,
      sort: t.sort,
    })),
  );
  const parts = BUILTIN_ITEMS.flatMap((p) => p.parts.map((x, i) => ({ packageId: p.id, treatmentId: x.treatmentId, quantity: x.quantity, sort: i })));
  if (parts.length) await db.insert(packageItems).ignore().values(parts);
}

let seeded = false;
export async function ensureSeeded(db: DB) {
  if (seeded) return;
  const [{ n }] = (await db.select({ n: sql<number>`count(*)` }).from(serviceSections)) as { n: number }[];
  if (Number(n) < BUILTIN_SECTIONS.length) await seedTreatments(db);
  // Customers created before migration 0001 get their normalised email/phone (idempotent, batched).
  try {
    const { backfillNorms } = await import("../crm/service");
    while ((await backfillNorms(db)) === 500);
  } catch (err) {
    console.error("[seed] could not backfill customer contact fields:", err instanceof Error ? err.message.slice(0, 120) : err);
  }
  seeded = true;
}
