# Architecture and roadmap

## Current state

- A Next.js App Router website, statically prerendered and served with `next start` on Hostinger Node.js Web Apps.
- No database, no cookies, no analytics. The only third-party script is Cloudflare Turnstile on the two form pages (spam protection).
- **Forms:** `/api/contact` and `/api/appointment` are server-side route handlers that validate input (`src/lib/forms/validation.ts`, shared with the browser and unit-tested), apply spam protection and rate limiting, and send email over SMTP with nodemailer (`src/lib/mail/`). Nothing is stored in a database. See `docs/EMAIL.md`.
- **Appointments are requests.** They are emailed to the studio and acknowledged to the customer as *not yet confirmed*. No availability is shown and nothing is confirmed automatically. Online booking stays off via `src/lib/booking/config.ts`.
- **WhatsApp:** one setting (`NEXT_PUBLIC_WHATSAPP_NUMBER`, or `whatsappNumberFallback` in `src/content/site.ts`). While it is empty or invalid, no WhatsApp link is rendered.
- **Hostinger compatibility:** the build uses the WebAssembly SWC compiler with webpack (see README). Keep `next`, `@next/swc-wasm-nodejs` and `eslint-config-next` on the same exact version.

## Content and service architecture

| File | Purpose |
| --- | --- |
| `src/content/services.ts` | Service categories. Waxing is `published`; laser, skin care and other beauty treatments are planned and **unpublished**. |
| `src/content/treatments.ts` | Treatment groups and treatments with stable ids. Prices and durations stay empty until confirmed (`pricesPublished`). |
| `src/content/media.ts` | Photo registry: files, NL/EN alt text, focal points and licence credits (Adobe Stock). Layouts fall back to photo-free compositions if a slot is ever emptied. |
| `src/content/site.ts` | Business details: email, and optional phone, socials and address. |
| `src/content/slugs.ts` | Category and treatment ids, localised URL slugs, related treatments. Small on purpose: the client-side language switcher uses it. |
| `src/content/copy/` | Long-form NL/EN copy for category, treatment and educational pages (`*.nl.ts`, `*.en.ts`, typed by `types.ts`). |
| `src/i18n/` | Locales, URL model (`config.ts`: static routes, category/treatment paths, `alternatePath`, `bookingHref`) and UI dictionaries. English is typed against Dutch. |

### Page map

| Type | NL | EN |
| --- | --- | --- |
| Home | `/` | `/en` |
| Treatments overview | `/waxbehandelingen` | `/en/waxing-treatments` |
| Category (3) | `/waxbehandelingen/{gezicht,lichaam,bikini-intiem}` | `/en/waxing-treatments/{face,body,bikini-intimate}` |
| Treatment (13) | `/waxbehandelingen/{category}/{slug}` e.g. `/waxbehandelingen/bikini-intiem/brazilian-wax` | `/en/waxing-treatments/{category}/{slug}` |
| Guides | `/voorbereiding`, `/nazorg`, `/veelgestelde-vragen`, `/hoe-werkt-een-afspraak` | `/en/preparation`, `/en/aftercare`, `/en/faq`, `/en/appointment-process` |
| Other | `/prijzen`, `/over-dilek`, `/contact`, `/afspraak-maken`, `/privacy` | `/en/prices`, `/en/about-dilek`, `/en/contact`, `/en/book-appointment`, `/en/privacy` |

Category and treatment pages are generated from data (`generateStaticParams`, `dynamicParams = false`), so an unknown slug is a 404. To add a treatment: add it to `treatments.ts`, `slugs.ts` (slug + related) and both `copy/treatments.*.ts` files — the type checker and `tests/content.test.ts` flag anything missing.

Appointment links from treatment pages use `bookingHref(locale, id)` → `/afspraak-maken?behandeling=<id>` (no hash, so the page always opens at the top) (`?treatment=` in English). The form preselects that treatment after hydration, so the page stays static.

### Adding a new service category later (for example laser hair removal)

Only once the owner has confirmed availability, qualifications, equipment and pricing:

1. Fill in the category in `services.ts`, add its treatments, and set `published: true`.
2. Add a route key with NL/EN slugs in `src/i18n/config.ts` (for example `/laserontharing` and `/en/laser-hair-removal`) plus page metadata in both dictionaries.
3. Add two thin page files (nl + en) that render a category view. The waxing page (`TreatmentsPage`) is the template.

The footer, structured data and sitemap use the route map and the published categories, so no redesign is needed.

## Approvals and reminders today (honest status)

There is **no** admin dashboard, calendar or automatic reminder yet, and the website never claims otherwise. The current, working process is email-based:

| Step | How it works now |
| --- | --- |
| Request | Form → notification email to Dilek + acknowledgement to the customer ("not yet confirmed") |
| Review | Dilek checks her own calendar |
| Approve / reschedule / decline | Dilek replies to the notification (Reply-To = customer) |
| Location details | Shared only in that personal confirmation |
| Reminder | Manual for now (for example a calendar reminder on Dilek's phone to send a short message the day before) |

## Planned: secure appointment system

### Functional requirements

1. The customer chooses one or more treatments; the total duration comes from confirmed treatment durations.
2. The customer picks a date and time from **live availability**.
3. The customer enters contact details: name, email, optional phone, and consent.
4. The appointment is created as a **request** (`requested`).
5. The owner **approves or rejects** it in the admin dashboard.
6. **Emails** go out for request received, approved, rejected and cancelled.
7. A **reminder** is sent **24 hours** before each approved appointment.
8. An **admin calendar** offers day, week and list views, blocked periods, availability rules and manual appointments.
9. **No double bookings**, enforced in the database and not only in the UI.
10. **GDPR (AVG):** consent, minimal data, retention limits, export and deletion.

### Proposed technical design

| Concern | Direction |
| --- | --- |
| Database | Managed PostgreSQL in the EU (for example Supabase EU or Neon EU) with Drizzle or Prisma migrations. |
| Double-booking prevention | Postgres `EXCLUDE USING gist (tstzrange(start, end) WITH &&) WHERE status IN ('requested','approved')`, so overlapping rows are rejected even under concurrent requests. Slots are re-validated inside the same transaction. |
| API | Next.js route handlers or server actions under `/api/booking/*`, with zod validation, CSRF-safe POSTs and rate limiting. |
| Abuse protection | Already in place for the request forms: Cloudflare Turnstile + server-side Siteverify, rate limits per IP, email and globally, duplicate detection (see `docs/SECURITY.md`). Move the in-memory limits to the database or Redis once there is one. |
| Email | Transactional email from an EU provider, sent from `hello@glowbydilek.nl` with SPF, DKIM and DMARC, using the templates listed in `EmailTemplate`. **The current mailbox/DNS setup must not be changed without the owner.** |
| Reminders | A scheduled job every 15 minutes calls `sendDueReminders()`. `reminderSentAt` makes it idempotent. |
| Admin auth | Owner account (plus optional staff) with strong passwords and 2FA. Sessions in HTTP-only, secure, SameSite cookies. Every request is authorised on the server. |
| Admin UI | `/admin` (already disallowed in `robots.txt`), its own layout and `noindex`. |
| Privacy | A privacy statement page (NL/EN), consent checkbox, retention policy (for example deleting inactive customers after 24 months), and data export and deletion in the admin. No medical details in free text. |
| Hosting | Hostinger Node.js (current) works if a cron/scheduler is available. Otherwise use a managed scheduler that calls a signed endpoint. |

The domain model and service contract are sketched in `src/lib/booking/types.ts`.

### Rollout steps

1. Owner confirms treatments, durations, prices, availability rules and the privacy statement.
2. Build the database schema, `BookingService` and email templates behind `onlineBookingEnabled`.
3. Build the admin dashboard (auth, calendar, approve/reject).
4. Security review, end-to-end tests (including concurrent double-booking tests) and a soft launch.
5. Switch the flag on. The appointment-request form on `/afspraak-maken` is then replaced by the booking flow. Its fields already match `BookingService.requestAppointment`, and the email templates in `src/lib/mail/templates.ts` can be reused.
