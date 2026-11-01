import { sql } from "drizzle-orm";
import { treatmentGroups } from "../../content/treatments";
import type { DB } from "./client";
import { treatments } from "./schema";

/**
 * Seeds the treatment catalogue from the approved site content. INSERT
 * IGNORE: rows the owner already edited (prices, durations, texts) are never
 * overwritten by a deployment. No prices, durations or working hours are
 * invented — those start empty and are filled in by the owner.
 */
export async function seedTreatments(db: DB): Promise<void> {
  let sort = 0;
  const rows = treatmentGroups.flatMap((g) =>
    g.treatments.map((t) => ({
      id: t.id,
      category: g.id,
      nameNl: t.name.nl,
      nameEn: t.name.en,
      descriptionNl: t.description.nl,
      descriptionEn: t.description.en,
      priceCents: t.price ? Math.round(t.price.amount * 100) : null,
      priceFrom: Boolean(t.price?.from),
      durationMinutes: t.durationMinutes ?? null,
      sort: sort++,
    })),
  );
  await db.insert(treatments).ignore().values(rows);
}

let seeded = false;
export async function ensureSeeded(db: DB) {
  if (seeded) return;
  const [{ n }] = (await db.select({ n: sql<number>`count(*)` }).from(treatments)) as { n: number }[];
  if (Number(n) < 13) await seedTreatments(db);
  seeded = true;
}
