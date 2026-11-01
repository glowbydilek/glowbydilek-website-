/**
 * Analytics events (GA4). Only non-personal, whitelisted parameters are ever
 * sent: never names, email addresses, phone numbers, appointment details or
 * health information. Calls are no-ops unless GA4 is enabled by the owner
 * AND the visitor consented.
 */
export type TrackEvent = "view_treatment" | "booking_start" | "booking_submitted" | "contact_submitted" | "cta_booking_click" | "review_submitted";
type Params = { treatment_id?: string; category_id?: string; form?: "online" | "request" | "contact"; source?: string; locale?: "nl" | "en" };

const SAFE = /^[a-z0-9_/-]{1,80}$/i;

export function track(name: TrackEvent, params: Params = {}) {
  if (typeof window === "undefined") return;
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (typeof v === "string" && SAFE.test(v)) clean[k] = v;
  (window as unknown as { glowTrack?: (n: string, p: Record<string, string>) => void }).glowTrack?.(name, clean);
}
