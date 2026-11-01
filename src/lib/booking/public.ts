import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import type { DB } from "../db/client";
import { dateOverrides, treatments, weeklyHours } from "../db/schema";
import { defaultBookingSettings, getSetting } from "../db/settings";
import { isPublicItem, itemById } from "../catalogue";
import { ensureContent } from "../cms/store";
import type { RequestCalendar } from "./calendar";

export { isClosedDay, type RequestCalendar } from "./calendar";

/**
 * The availability-aware journey is offered only when it is genuinely
 * operational: enabled by the owner, working hours set, and at least one
 * active treatment with a confirmed duration marked "online bookable".
 *
 * Only PUBLISHED catalogue items with a fixed or "from" price get real time
 * slots; "price on request" items go through the request + quote flow.
 */
export async function onlineBookingStatus(db: DB) {
  const settings = await getSetting(db, "booking", defaultBookingSettings);
  await ensureContent();
  const rows = await db
    .select({ id: treatments.id, nameNl: treatments.nameNl, nameEn: treatments.nameEn, category: treatments.category, duration: treatments.durationMinutes, priceCents: treatments.priceCents, priceFrom: treatments.priceFrom })
    .from(treatments)
    .where(and(eq(treatments.active, true), eq(treatments.visible, true), eq(treatments.bookableOnline, true), sql`${treatments.durationMinutes} IS NOT NULL`));
  const bookable = rows.filter((r) => {
    const item = itemById(r.id);
    return Boolean(item && isPublicItem(item) && item.pricing.mode !== "on_request");
  });
  const [{ n }] = (await db.select({ n: sql<number>`count(*)` }).from(weeklyHours)) as { n: number }[];
  return { enabled: settings.onlineBookingEnabled && bookable.length > 0 && Number(n) > 0, bookable, settings };
}

/**
 * Days on which no appointment can be requested: weekdays without opening
 * hours (only once working hours are set) and dates the owner closed.
 * ISO weekdays: 1 = Monday … 7 = Sunday.
 */
export async function requestCalendar(db: DB, today: string): Promise<RequestCalendar> {
  const [hours, closed] = await Promise.all([
    db.select({ weekday: weeklyHours.weekday, kind: weeklyHours.kind }).from(weeklyHours),
    db.select({ day: dateOverrides.day }).from(dateOverrides).where(and(eq(dateOverrides.closed, true), gte(dateOverrides.day, today))),
  ]);
  const open = new Set(hours.filter((h) => h.kind === "open").map((h) => Number(h.weekday)));
  const closedWeekdays = open.size ? [1, 2, 3, 4, 5, 6, 7].filter((d) => !open.has(d)) : [];
  return { closedWeekdays, closedDates: closed.map((c) => c.day).sort() };
}
