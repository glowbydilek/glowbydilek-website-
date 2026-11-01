# Architecture and roadmap

## Current state

- A Next.js App Router application served with `next start` on Hostinger Node.js Web Apps, backed by **MySQL/MariaDB** (Hostinger) through Drizzle ORM.
- Three areas share one codebase and one owner identity:
  - **Public website** (NL/EN): pages are rendered from built-in content plus owner edits published in the admin. Root layouts revalidate every 5 minutes, and publishing invalidates the cache immediately.
  - **`/admin`** ("Admin Glow by Dilek"): content management (pages and sections, theme, header/footer, media, treatments and prices, SEO and redirects, email templates, security, audit log, backup).
  - **`/agenda`** ("Glow by Dilek — Agenda"): mobile-first calendar and CRM (today, agenda day/week/month/list, requests, appointments, customers, inbox, working hours, settings), installable on the iPhone home screen.
- No analytics and no tracking cookies. The only cookie is the owner's session cookie in the private areas. The only third-party script is Cloudflare Turnstile on form pages.
- **Hostinger compatibility:** the build uses the WebAssembly SWC compiler with webpack (see README). Keep `next`, `@next/swc-wasm-nodejs` and `eslint-config-next` on the same exact version. `sharp` (image processing) is the only native module and is optional at build time.

### Code map

| Path | Purpose |
| --- | --- |
| `src/lib/db/` | Schema (`schema.ts`), connection pool, settings, audit log, database-backed rate limits, seed. Migrations live in `drizzle/` and run with `npm run db:migrate` or during the build (`DB_MIGRATE_ON_BUILD=true`). |
| `src/lib/auth/` | Password hashing, sessions, password reset, MFA (TOTP + recovery codes), lockout. See `docs/SECURITY.md`. |
| `src/lib/booking/` | `engine.ts`: pure availability calculation (weekly intervals, breaks, date overrides, blocks, capacity, max per day, notice, advance window, buffers). `service.ts`: every appointment mutation inside a transaction. `public.ts`: whether online booking is actually operational. |
| `src/lib/time.ts` | Europe/Amsterdam conversions. Stored times are UTC. A local time in the spring DST gap moves forward; an ambiguous autumn time resolves to its first occurrence. |
| `src/lib/notifications/` | Templates (NL/EN, placeholder validation), transactional outbox, SMTP delivery and the cron tick. See `docs/EMAIL.md`. |
| `src/lib/cms/` | Content registry, draft/publish/versions, theme tokens, menu, media processing, custom pages, section ordering, and the per-request snapshot used while rendering. |
| `src/lib/private/` | Server actions for the admin and Agenda. Every action re-checks the owner session. |
| `src/lib/forms/` | Public form handling: validation, Turnstile, rate limits, duplicate detection. |

### Double-booking prevention

Every booking mutation runs in a transaction (READ COMMITTED) that first takes an exclusive per-day row lock in `schedule_locks` (`INSERT … ON DUPLICATE KEY UPDATE`), then re-reads the existing appointments and blocks for that day and re-checks availability, including capacity, buffers and max per day. Concurrent requests for the same day are therefore serialised in the database, not only in the UI; deadlocks and lock timeouts are retried. A concurrency test fires parallel requests for the same slot and asserts that exactly one succeeds.

### Content model

Built-in content (`src/content/`, `src/i18n/dictionaries/`) is the default. Owner edits are stored per document and language in `content_entries` (draft and published rows) and deep-merged over the defaults, so an empty or missing field always falls back to the approved text. Every publish stores a version in `content_versions` (restorable). Drafts are visible only to the signed-in owner through preview mode.

## Content and service architecture

| File | Purpose |
| --- | --- |
| `src/content/services.ts` | Service categories. Waxing is `published`; laser, skin care and other beauty treatments are planned and **unpublished**. |
| `src/content/treatments.ts` | Treatment groups and treatments with stable ids. Built-in prices and durations stay empty; the owner enters confirmed ones in Admin → Behandelingen (stored in the `treatments` table). |
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

## Appointments: how they flow

| Step | How it works |
| --- | --- |
| Request | Website form (preferred moment) or, when online booking is enabled **and** working hours plus at least one bookable treatment with a confirmed duration exist, an exact free time. Stored as `requested`; the customer is told it is **not yet confirmed** |
| Review | Agenda → Aanvragen: approve, propose another time, or decline |
| Manual appointments | Agenda → Nieuwe afspraak (phone or Instagram bookings), with the same collision checks |
| Changes | Reschedule, cancel, completed, no-show, archive; every change is recorded in the appointment history |
| Emails | Queued in the outbox with the change; retried by the cron job |
| Reminder | Queued by the cron job before each confirmed appointment (default 24 h) |
| Location details | Stored privately in Agenda → Instellingen and inserted only into confirmation, reschedule and reminder emails |
| Privacy | Customer export (JSON) and anonymisation in Agenda → Klanten |

No payments are taken online.

## Possible next steps (not built)

- Optional customer self-service links (cancel/reschedule from the email).
- Automatic retention clean-up (for example anonymising customers without appointments for 24 months) once the owner has decided on the retention period; today this is a manual action.
- Calendar feed (iCal) for Dilek's phone calendar.
