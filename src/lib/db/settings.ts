import { eq } from "drizzle-orm";
import type { DB } from "./client";
import { settings } from "./schema";

export async function getSetting<T>(db: DB, key: string, fallback: T): Promise<T> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (!row) return fallback;
  const v = row.value as T;
  if (fallback && typeof fallback === "object" && !Array.isArray(fallback) && v && typeof v === "object") return { ...fallback, ...v };
  return v;
}

export async function setSetting(db: DB, key: string, value: unknown, userId?: number) {
  await db
    .insert(settings)
    .values({ key, value, updatedBy: userId ?? null })
    .onDuplicateKeyUpdate({ set: { value, updatedBy: userId ?? null, updatedAt: new Date() } });
}

/** Business settings that only the owner sees (never rendered on public pages). */
export type PrivateBusinessSettings = {
  /** Practical location details, included only in confirmation and reminder emails. */
  locationDetails: string;
  ownerNotifyEmail: string;
};

export const defaultPrivateSettings: PrivateBusinessSettings = {
  locationDetails: "",
  ownerNotifyEmail: "",
};

export type BookingSettings = {
  onlineBookingEnabled: boolean;
  capacity: number;
  maxPerDay: number | null;
  minNoticeHours: number;
  maxAdvanceDays: number;
  slotStepMinutes: number;
  remindersEnabled: boolean;
  reminderHoursBefore: number;
};

export const defaultBookingSettings: BookingSettings = {
  onlineBookingEnabled: false,
  capacity: 1,
  maxPerDay: null,
  minNoticeHours: 24,
  maxAdvanceDays: 60,
  slotStepMinutes: 15,
  remindersEnabled: true,
  reminderHoursBefore: 24,
};
