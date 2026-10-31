/**
 * Domain types for the future appointment system and admin dashboard.
 *
 * These are type definitions only — there is no runtime implementation,
 * no database and no API yet. They document the intended data model so the
 * booking system can be built on a stable, agreed structure.
 */

/** Matches `Treatment.id` in src/content/treatments.ts */
export type TreatmentId = string;

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export type TimeSlot = {
  /** ISO 8601 date-time in UTC */
  start: string;
  /** ISO 8601 date-time in UTC */
  end: string;
};

export type Appointment = {
  id: string;
  treatmentIds: TreatmentId[];
  slot: TimeSlot;
  status: AppointmentStatus;
  customerId: string;
  /** Optional free-text note from the customer (no medical details). */
  note?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Customer data must be stored only after an explicit, GDPR (AVG) compliant
 * consent flow, in an EU-hosted database, and be deletable on request.
 */
export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferredLocale: "nl" | "en";
  marketingConsent: boolean;
  createdAt: string;
};

export type OpeningHours = {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** "HH:mm" in Europe/Amsterdam */
  opens: string;
  closes: string;
};

export type AdminRole = "owner" | "staff";

/** Contract the future booking backend must implement. */
export interface BookingService {
  getAvailableSlots(treatmentIds: TreatmentId[], date: string): Promise<TimeSlot[]>;
  createAppointment(input: {
    treatmentIds: TreatmentId[];
    slot: TimeSlot;
    customer: Omit<Customer, "id" | "createdAt">;
    note?: string;
  }): Promise<Appointment>;
  cancelAppointment(appointmentId: string, reason?: string): Promise<void>;
}
