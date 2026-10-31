/**
 * Feature flag for the future appointment system.
 *
 * Online booking is intentionally DISABLED. While this flag is false the
 * website must never render forms or buttons that appear to accept a real
 * booking, payment or personal data. Flip it only once the secure backend
 * (see docs/ARCHITECTURE.md) is implemented, reviewed and tested.
 */
export const bookingConfig = {
  onlineBookingEnabled: false,
  paymentsEnabled: false,
} as const;
