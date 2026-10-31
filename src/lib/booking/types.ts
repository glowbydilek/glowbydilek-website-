/**
 * Domain model for the future appointment system and admin dashboard.
 *
 * Type definitions only — there is NO runtime implementation, database or
 * API yet. See docs/ARCHITECTURE.md for the planned design.
 */

/** Matches `Treatment.id` in src/content/treatments.ts */
export type TreatmentId = string;

/**
 * Request-and-approve flow:
 *   requested → approved | rejected | expired
 *   approved  → cancelled | completed | no_show
 */
export type AppointmentStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled"
  | "completed"
  | "no_show";

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
  /** Set when the owner approves/rejects. */
  decidedAt?: string;
  decisionReason?: string;
  /** Set when the 24-hour reminder has been sent (idempotency). */
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Customer data is stored only after explicit, GDPR (AVG) compliant consent,
 * in an EU-hosted database, minimised, and deletable on request.
 */
export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferredLocale: "nl" | "en";
  marketingConsent: boolean;
  privacyConsentAt: string;
  createdAt: string;
};

export type AvailabilityRule = {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** "HH:mm" in Europe/Amsterdam */
  opens: string;
  closes: string;
};

export type BlockedPeriod = { start: string; end: string; reason?: string };

export type EmailTemplate =
  | "request_received"
  | "request_approved"
  | "request_rejected"
  | "reminder_24h"
  | "appointment_cancelled";

export type AdminRole = "owner" | "staff";

/** Contract the future booking backend must implement. */
export interface BookingService {
  /** Only returns slots that do not overlap existing approved/requested appointments. */
  getAvailableSlots(treatmentIds: TreatmentId[], date: string): Promise<TimeSlot[]>;
  requestAppointment(input: {
    treatmentIds: TreatmentId[];
    slot: TimeSlot;
    customer: Omit<Customer, "id" | "createdAt">;
    note?: string;
  }): Promise<Appointment>;
  approve(appointmentId: string): Promise<Appointment>;
  reject(appointmentId: string, reason?: string): Promise<Appointment>;
  cancel(appointmentId: string, reason?: string): Promise<void>;
  /** Called by a scheduled job; sends reminders for appointments starting in ~24h. */
  sendDueReminders(now: Date): Promise<number>;
}
