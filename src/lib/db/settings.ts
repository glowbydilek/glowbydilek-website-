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

/**
 * Seller details for invoices. Entered and verified by the owner in Admin →
 * Bedrijf & facturen; nothing is pre-filled or guessed (no KVK, VAT number,
 * VAT rate or exemption is assumed). Never shown on public pages.
 */
export type InvoiceSettings = {
  legalName: string;
  tradeName: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
  kvk: string;
  /**
   * "standard": VAT charged per line (category standard/reduced/zero/exempt) ·
   * "exempt": no VAT, with the legal exemption text · "kor": small-business
   * scheme (kleineondernemersregeling), no VAT, with the KOR text.
   */
  vatMode: "" | "standard" | "exempt" | "kor";
  vatNumber: string;
  /** Basis points (2100 = 21%); only used with vatMode "standard". Entered by the owner. */
  vatRateBp: number | null;
  /** Reduced rate in basis points (900 = 9%) — only for lines the accountant confirmed as eligible. */
  reducedRateBp: number | null;
  /** Exact exemption wording the owner's accountant confirmed (vatMode "exempt"). */
  exemptionText: string;
  iban: string;
  accountHolder: string;
  email: string;
  phone: string;
  prefix: string;
  paymentTermDays: number;
  footer: string;
};

export const defaultInvoiceSettings: InvoiceSettings = {
  legalName: "",
  tradeName: "Glow by Dilek",
  street: "",
  postcode: "",
  city: "",
  country: "Nederland",
  kvk: "",
  vatMode: "",
  vatNumber: "",
  vatRateBp: null,
  reducedRateBp: null,
  exemptionText: "",
  iban: "",
  accountHolder: "",
  email: "hello@glowbydilek.nl",
  phone: "",
  prefix: "GBD",
  paymentTermDays: 14,
  footer: "",
};

/**
 * Invoice automation after an appointment is marked completed. Conservative
 * defaults: everything OFF. Issuing still requires complete business details;
 * per appointment the owner can choose "manual" or "no invoice".
 */
export type InvoiceAutomation = { autoDraft: boolean; autoIssue: boolean; autoEmail: boolean };
export const defaultInvoiceAutomation: InvoiceAutomation = { autoDraft: false, autoIssue: false, autoEmail: false };

/** Optional aftercare email some hours after a completed appointment (off by default). */
export type AftercareSettings = { enabled: boolean; delayHours: number };
export const defaultAftercare: AftercareSettings = { enabled: false, delayHours: 3 };
