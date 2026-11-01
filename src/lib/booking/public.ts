import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { treatments, weeklyHours } from "../db/schema";
import { defaultBookingSettings, getSetting } from "../db/settings";

/**
 * The availability-aware journey is offered only when it is genuinely
 * operational: enabled by the owner, working hours set, and at least one
 * active treatment with a confirmed duration marked "online bookable".
 */
export async function onlineBookingStatus(db: DB) {
  const settings = await getSetting(db, "booking", defaultBookingSettings);
  const bookable = await db
    .select({ id: treatments.id, nameNl: treatments.nameNl, nameEn: treatments.nameEn, category: treatments.category, duration: treatments.durationMinutes, priceCents: treatments.priceCents, priceFrom: treatments.priceFrom })
    .from(treatments)
    .where(and(eq(treatments.active, true), eq(treatments.visible, true), eq(treatments.bookableOnline, true), sql`${treatments.durationMinutes} IS NOT NULL`));
  const [{ n }] = (await db.select({ n: sql<number>`count(*)` }).from(weeklyHours)) as { n: number }[];
  return { enabled: settings.onlineBookingEnabled && bookable.length > 0 && Number(n) > 0, bookable, settings };
}
