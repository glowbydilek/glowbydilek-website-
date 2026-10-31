# Architecture and roadmap

## Current state (v0.1)

- A marketing website rendered statically by Next.js (App Router) and served with `next start`.
- No database, no API routes, no forms, no cookies, no analytics, and no personal data processing.
- Online booking is switched off through `src/lib/booking/config.ts` (`onlineBookingEnabled: false`).

### Internationalisation

- `src/i18n/config.ts` defines the locales and a **route map** with translated slugs per page.
- Two route groups act as separate root layouts so each language gets the correct `<html lang>`:
  - `src/app/(nl)` → `/`, `/waxbehandelingen`, ...
  - `src/app/(en)/en` → `/en`, `/en/waxing-treatments`, ...
- Each `page.tsx` is a thin wrapper around a shared view in `src/views`, so the layout is written once.
- The English dictionary is typed against the Dutch one, so a missing translation fails the type check.

### Content

- `src/content/treatments.ts` is the single source of truth for treatments, durations and prices. Every treatment has a stable `id` that the booking system will reference.
- `src/content/site.ts` holds business and contact details. Fields left `undefined` are hidden everywhere, including structured data.

## Planned: secure appointment system

Planned building blocks (to be decided and reviewed before building):

| Concern | Direction |
| --- | --- |
| Database | Managed PostgreSQL hosted in the EU (for example Supabase EU or Neon EU) with Prisma or Drizzle |
| API | Next.js Route Handlers or Server Actions under `/api/booking/*`, with server-side validation (zod) |
| Availability | Opening hours plus blocked periods; slots computed server-side from treatment durations |
| Abuse protection | Rate limiting and a privacy-friendly CAPTCHA (for example Cloudflare Turnstile) |
| Notifications | Transactional email (EU provider) for confirmation and cancellation links |
| Payments (optional) | Mollie (iDEAL), added only after booking is stable |
| Privacy (AVG/GDPR) | Explicit consent, data minimisation (no medical details), retention policy, deletion on request, privacy statement and processor agreements |

The domain model and the service contract are already sketched in `src/lib/booking/types.ts` (`Appointment`, `Customer`, `TimeSlot`, `BookingService`).

### Rollout steps

1. Add a privacy statement page (NL/EN).
2. Implement the database schema and `BookingService` behind the `onlineBookingEnabled` flag.
3. Replace the informational content on `/afspraak-maken` and `/en/book-appointment` with the booking flow once the flag is on.
4. Security review, then end-to-end tests, then launch.

## Planned: admin dashboard

- Route: `/admin` (already disallowed in `robots.txt`). It will get its own layout outside the public route groups and will be `noindex`.
- Authentication: a single owner account (plus optional staff) with strong passwords and 2FA, using Auth.js or the database provider's auth. Sessions stored in HTTP-only, secure cookies.
- Authorisation is checked on the server for every request (in `proxy.ts` and in each route handler), never only in the UI.
- Features: today's agenda, an appointment list with status changes, opening hours and blocked periods, a treatment and price editor (moving `src/content/treatments.ts` into the database), and customer lookup with data-export and deletion tools.
