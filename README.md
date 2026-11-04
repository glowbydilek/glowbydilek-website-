# Glow by Dilek — website, admin and agenda

The website of **Glow by Dilek**: personal beauty and relaxation treatments for **women only**, by appointment, in the Netherlands. Dilek is a qualified *schoonheidsspecialiste* (level 3; exact diploma wording pending the owner's confirmation).

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS 4** and **MySQL/MariaDB** (Drizzle ORM), served by `next start` on **Hostinger Node.js Web Apps**.

- **Public website in three languages**: Dutch (default, no prefix), English (`/en`) and Turkish (`/tr`), with translated URLs, `hreflang`, and an accessible language menu that keeps you on the same page and treatment.
- **`/admin`**: pages and sections with drafts, preview and history; theme; header/footer; media; treatments, categories and prices (NL/EN/TR names, "Vertaling nodig (TR)" marker); SEO and redirects; email templates; promotions; legal pages; security, audit log and backup.
- **`/agenda`**: mobile calendar and CRM (day/week/month/list, requests, appointments, returning customers, profiles with generic avatars, duplicates), working hours and closures, finance with VAT 0/9/21, invoices with PDF, expenses, versioned intake & consent form with an encrypted document vault, inbox.
- **`/login/status`**: non-secret system check (database, migrations, session key, clock, owner account, SMTP). **`/login/eerste-wachtwoord`**: one-time first password with `OWNER_SETUP_TOKEN`.

More: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (Hostinger, owner-login repair, migrations, backups, rollback), [`docs/SECURITY.md`](docs/SECURITY.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/BRAND.md`](docs/BRAND.md), [`docs/PHOTOGRAPHY.md`](docs/PHOTOGRAPHY.md), [`docs/INTAKE.md`](docs/INTAKE.md), [`docs/FINANCE.md`](docs/FINANCE.md), [`docs/EMAIL.md`](docs/EMAIL.md). Latest status report (Turkish): [`docs/v14/RAPOR_TR.md`](docs/v14/RAPOR_TR.md) (previous: [`docs/v13/RAPOR_TR.md`](docs/v13/RAPOR_TR.md)); service list: [`docs/v13/HIZMET_ENVANTERI.md`](docs/v13/HIZMET_ENVANTERI.md).

## Services (built-in catalogue)

**19 published**: 13 waxing treatments (face: eyebrows, upper lip, chin, full face; body: underarms, half arms, full arms, half legs, full legs, back; bikini & intimate: bikini line, Brazilian, Hollywood), 5 massages (full-body relaxation, face, head, hands, feet) and facial care with steam. **10 drafts** (facial cleansing/exfoliation/mask/complete facial, brush cleansing, body wrap, four packages) stay hidden until the owner confirms them in Admin → Behandelingen. Prices and durations show "op aanvraag" until the owner enters them; nothing is invented. Every published treatment is linked from the mega menu, the mobile category menu, the footer, "Alle behandelingen", the prices page, the booking form and the sitemap.

## Features

- Brand "Luminous Beauty Atelier": pearl, soft rose, deep plum, rosewood and champagne; headings in Newsreader Medium, text in Instrument Sans (self-hosted, with Latin Extended files for Turkish İ ğ ş); vector logo. Restrained glow interactions (selection sheen, calendar-day and time-slot glints, confirmation sparkle) that switch off with reduced motion.
- **Booking**: one page with "choose a time" (online-bookable treatments, when switched on) and "send a request" (every published treatment, including massages and anything on request). Treatment links preselect the treatment in all three languages. Dilek confirms every appointment personally; the engine prevents double bookings and handles Europe/Amsterdam DST.
- **Forms** stored in the database and emailed server-side (Reply-To the customer), with acknowledgements in NL/EN/TR. Protected by Cloudflare Turnstile (server-side Siteverify), honeypot, timing, rate limits, duplicate detection and validation.
- **Location privacy**: no address is published; practical details are shared personally after confirmation (enforced by `tests/content.test.ts`).
- SEO: per-page metadata, canonical and `hreflang` (nl-NL, en, tr-TR, x-default), Open Graph images, `sitemap.xml` in three languages (untranslated items are left out of `/tr`), `robots.txt`, JSON-LD with confirmed facts only.
- Performance: cached pages regenerated after a publish, self-hosted fonts, pre-optimised responsive WebP photos (`npm run photos`; 29 licensed slots, see `docs/PHOTOGRAPHY.md`).

| Page | Dutch (default) | English | Turkish |
| --- | --- | --- | --- |
| Home | `/` | `/en` | `/tr` |
| All treatments | `/behandelingen` | `/en/treatments` | `/tr/bakimlar` |
| Waxing | `/waxbehandelingen` (+ `/gezicht`, `/lichaam`, `/bikini-intiem`) | `/en/waxing-treatments` | `/tr/agda` |
| Massages | `/massages` | `/en/massages` | `/tr/masajlar` |
| Facial treatments | `/gezichtsbehandelingen` | `/en/facial-treatments` | `/tr/yuz-bakimlari` |
| Prices | `/prijzen` | `/en/prices` | `/tr/fiyatlar` |
| About Dilek | `/over-dilek` | `/en/about-dilek` | `/tr/dilek-hakkinda` |
| Contact | `/contact` | `/en/contact` | `/tr/iletisim` |
| Book / request | `/afspraak-maken` | `/en/book-appointment` | `/tr/randevu` |
| Process, preparation, aftercare, FAQ | `/hoe-werkt-een-afspraak`, `/voorbereiding`, `/nazorg`, `/veelgestelde-vragen` | `/en/appointment-process`, `/en/preparation`, `/en/aftercare`, `/en/faq` | `/tr/randevu-sureci`, `/tr/hazirlik`, `/tr/bakim-sonrasi`, `/tr/sss` |
| Privacy | `/privacy` | `/en/privacy` | `/tr/gizlilik` |

## Owner checklist

The current list of owner actions and open questions is in [`docs/OWNER-CHECKLIST.md`](docs/OWNER-CHECKLIST.md). The production login needs a database and environment variables first: [`docs/DEPLOYMENT.md` §2e](docs/DEPLOYMENT.md).

## Development

```bash
npm install
```

```bash
npm run dev
```

Local database (MariaDB or MySQL 8). Use a **separate** development database; never point development or tests at production:

```bash
cp .env.example .env.local
```

```bash
npm run db:migrate
```

Checks (the test suite needs Node ≥ 22.6; production runs on Node 20):

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Database tests (booking concurrency, auth, outbox) run when `TEST_DATABASE_URL` points to an **empty, throwaway** database; they empty every table in it:

```bash
TEST_DATABASE_URL=mysql://glow:devpass@127.0.0.1:3306/glow_test npm test
```

CI (`.github/workflows/ci.yml`) runs the same checks on every pull request (Node 22, with a throwaway MariaDB service for the database tests), then crawls the built site with `npm run check:site` (every page, internal link, canonical, hreflang and location wording), plus a production build on Node 20, as used on Hostinger.

Browser navigation tests (menus, language switch, booking preselection, Turnstile and duplicate handling) run locally against a started build. They need Playwright with Chromium, which is deliberately not a project dependency:

```bash
npm run build && npm start
```

```bash
npm run test:e2e -- http://localhost:3000
```

Without SMTP configured, the two mail-sending steps are skipped; set `E2E_EXPECT_MAIL=1` when a (test) SMTP server is configured. The server's own abuse limits apply, so run it only a few times per 10 minutes against the same server process.

The full owner journey (login, password reset by email, agenda, double-booking refusal, CMS publish and preview, theme, prices, online booking, inbox, media) runs against a build connected to a development database and a local SMTP sink that writes `.eml` files:

```bash
CRON_SECRET=<dev value> MAIL_DIR=/path/to/sink npm run test:e2e:private -- http://localhost:3000
```

First-password route (owner without a password, `OWNER_SETUP_TOKEN` set on the test server) and intake/two-step verification:

```bash
OWNER_SETUP_TOKEN=<test value> node scripts/e2e-setup.cjs http://localhost:3000
```

```bash
OWNER_PASSWORD=<test value> node scripts/e2e-intake.cjs http://localhost:3000 <customerId>
```

Re-optimise photos after replacing originals in `assets/photos/` (originals are not committed; re-download them by the Adobe Stock IDs in `docs/PHOTOGRAPHY.md`):

```bash
npm run photos
```

## Deploying to Hostinger (Node.js Web Apps)

1. Connect this GitHub repository (branch `main`) in hPanel → Websites → Node.js Web App.
2. Framework: **Next.js**. Node.js version: **20 or 22**.
3. Build command: `npm run build`. Start command: `npm start`. Output directory: `.next` (Hostinger's default for Next.js).
4. Database, environment variables and cron job: follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

`next start` listens on the `PORT` that Hostinger provides.

### Why the build is set up this way

Hostinger's build environment has an older glibc (below 2.29). Next.js's native SWC compiler (`@next/swc-linux-x64-gnu`) needs a newer one, so it cannot load there. The project is therefore set up to build without it:

- `@next/swc-wasm-nodejs` is installed as a dependency, pinned to the exact `next` version. This is the WebAssembly version of the compiler.
- `scripts/prepare-swc-wasm.mjs` runs automatically before every `npm run build` (`prebuild`). It copies the WebAssembly compiler to where Next.js looks for it, so nothing has to be downloaded during the build.
- `npm run build` uses `next build --webpack`, because Turbopack only works with the native compiler.
- The config file is `next.config.mjs` (plain JavaScript), so it can be loaded without compiling.

On computers where the native compiler works, Next.js keeps using it, so local builds stay fast. When upgrading Next.js, always upgrade `next`, `@next/swc-wasm-nodejs` and `eslint-config-next` together to the **same exact version**. The prebuild script stops the build if `next` and `@next/swc-wasm-nodejs` don't match.

## Project structure

```
src/
  app/
    (nl)/            Dutch root layout and pages (default language, no prefix)
    (en)/en/         English root layout and pages
    (tr)/tr/         Turkish root layout and pages
    (private)/       /login, /admin, /agenda
    sitemap.ts, robots.ts, manifest.ts, icon.svg, globals.css
  components/        Header, footer, logo, UI kit, request composer
  views/             Page content shared by all languages
  content/           Business details, treatments, copy (NL/EN/TR), photo manifest
  i18n/              Locale config, localised routes, dictionaries
  lib/seo.ts         Metadata and structured-data helpers
  views/BrandPage    Internal brand review page
  lib/               Catalogue, booking engine, auth, CMS, finance, intake, notifications, db (Drizzle)
drizzle/                       SQL migrations 0000–0004 (additive)
scripts/prepare-swc-wasm.mjs   Offline SWC WebAssembly fallback for Hostinger builds
scripts/optimize-photos.mjs    Converts assets/photos/* to responsive WebP
scripts/brand/                 Logo generator (SVG) and PNG renderer
public/brand/                  Logo system (SVG/PNG)
docs/ARCHITECTURE.md
```
