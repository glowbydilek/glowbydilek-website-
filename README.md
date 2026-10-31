# Glow by Dilek — website

The official website for **Glow by Dilek**, a premium waxing and beauty business in the Netherlands.

Built with **Next.js 16 (App Router)**, **TypeScript** and **Tailwind CSS 4**. The pages are prerendered as static HTML and served by `next start`, which works with **Hostinger Node.js Web Apps**.

## Features

- Dutch is the default language (no URL prefix). English lives under `/en`. Pages have translated slugs, `hreflang` alternates and a language switcher that keeps you on the same page.
- Pages: Home, Waxing Treatments, Prices, About Dilek, Contact, Request Appointment, Privacy, plus an internal brand page at `/merkidentiteit` (not indexed).
- Brand identity based on the approved logo (champagne-gold "Glow", script "by Dilek", lotus symbol) as pure-vector SVGs. Palette: ivory, nude, stone, champagne gold and charcoal. Type: Cormorant Garamond, Jost and Parisienne (signature only). Responsive spacing tokens and a header safe-zone; subtle reveals with no hero parallax, respecting reduced motion. See [`docs/BRAND.md`](docs/BRAND.md) and [`docs/RESEARCH.md`](docs/RESEARCH.md).
- **Contact form** and **appointment-request form**, sent server-side to `hello@glowbydilek.nl` (Reply-To set to the customer) with a customer acknowledgement in Dutch or English. Protected by Cloudflare Turnstile (server-side Siteverify), a honeypot, timing and link-spam checks, rate limits per IP/email/site, duplicate detection and validation. See [`docs/EMAIL.md`](docs/EMAIL.md) and [`docs/SECURITY.md`](docs/SECURITY.md).
- **Service pages:** 3 category pages and 13 treatment pages per language, generated from `src/content/` with localised slugs; treatment CTAs preselect the treatment in the request form. Plus preparation, aftercare, FAQ and appointment-process pages.
- **Location privacy:** no address or location is published anywhere; only "Treatments are available by appointment only. Practical location details are shared personally after confirmation." (enforced by `tests/content.test.ts`).
- **WhatsApp** button: hidden until `NEXT_PUBLIC_WHATSAPP_NUMBER` is set.
- Expandable service architecture: laser, skin care, beauty and retail are prepared but **unpublished**. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- SEO: per-page metadata, canonical and hreflang tags, Open Graph images, `sitemap.xml`, `robots.txt`, and JSON-LD (Organization, Service, FAQPage, BreadcrumbList), using only confirmed business information.
- Performance: static pages (except the two form endpoints), self-hosted fonts, no third-party scripts except Turnstile on the form pages, and pre-optimised responsive WebP photos (`npm run photos`).

| Page | Dutch (default) | English |
| --- | --- | --- |
| Home | `/` | `/en` |
| Waxing treatments | `/waxbehandelingen` | `/en/waxing-treatments` |
| Categories | `/waxbehandelingen/gezicht`, `/lichaam`, `/bikini-intiem` | `/en/waxing-treatments/face`, `/body`, `/bikini-intimate` |
| Treatments (13) | `/waxbehandelingen/{category}/{treatment}` | `/en/waxing-treatments/{category}/{treatment}` |
| Appointment process | `/hoe-werkt-een-afspraak` | `/en/appointment-process` |
| Preparation | `/voorbereiding` | `/en/preparation` |
| Aftercare | `/nazorg` | `/en/aftercare` |
| FAQ | `/veelgestelde-vragen` | `/en/faq` |
| Prices | `/prijzen` | `/en/prices` |
| About Dilek | `/over-dilek` | `/en/about-dilek` |
| Contact | `/contact` | `/en/contact` |
| Request appointment | `/afspraak-maken` | `/en/book-appointment` |
| Privacy | `/privacy` | `/en/privacy` |

## Owner checklist

| What | Where |
| --- | --- |
| **SMTP environment variables** (required for the forms) | Hostinger → Environment variables; see [`docs/EMAIL.md`](docs/EMAIL.md) |
| **Turnstile keys** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) — production pending | [`docs/SECURITY.md`](docs/SECURITY.md) |
| Photography: 16 licensed Adobe Stock photos in place; real portrait of Dilek optional | [`docs/PHOTOGRAPHY.md`](docs/PHOTOGRAPHY.md) |
| Production release steps | [`docs/RELEASE-CHECKLIST.md`](docs/RELEASE-CHECKLIST.md) |
| Review of first-person copy, and the full list of open items | [`docs/OWNER-CHECKLIST.md`](docs/OWNER-CHECKLIST.md) |
| WhatsApp number (optional) | `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| Confirmed prices and durations | `src/content/treatments.ts`, then set `pricesPublished = true` |
| Real portrait of Dilek, personal story, city/region | `src/content/media.ts`, dictionaries, `src/content/site.ts` |
| Review of the privacy statement | `src/i18n/dictionaries/*.ts` → `privacy` |

## Development

```bash
npm install
```

```bash
npm run dev
```

Checks:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

CI (`.github/workflows/ci.yml`) runs the same checks on every pull request (Node 22), then crawls the built site with `npm run check:site` (every page, internal link, canonical, hreflang and location wording), plus a production build on Node 20, as used on Hostinger.

Browser navigation tests (menus, language switch, booking preselection, Turnstile and duplicate handling) run locally against a started build. They need Playwright with Chromium, which is deliberately not a project dependency:

```bash
npm run build && npm start
```

```bash
npm run test:e2e -- http://localhost:3000
```

Without SMTP configured, the two mail-sending steps are skipped; set `E2E_EXPECT_MAIL=1` when a (test) SMTP server is configured. The server's own abuse limits apply, so run it only a few times per 10 minutes against the same server process.

```bash
# optional: re-optimise photos after replacing originals
npm run photos
```

## Deploying to Hostinger (Node.js Web Apps)

1. Connect this GitHub repository (branch `main`) in hPanel → Websites → Node.js Web App.
2. Framework: **Next.js**. Node.js version: **20 or 22**.
3. Build command: `npm run build`. Start command: `npm start`. Output directory: `.next` (Hostinger's default for Next.js).
4. Environment variables: `NEXT_PUBLIC_SITE_URL=https://glowbydilek.nl`, plus the SMTP variables from [`docs/EMAIL.md`](docs/EMAIL.md) and the Turnstile keys from [`docs/SECURITY.md`](docs/SECURITY.md).

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
    sitemap.ts, robots.ts, manifest.ts, icon.svg, globals.css
  components/        Header, footer, logo, UI kit, request composer
  views/             Page content shared by both languages
  content/           Business details, services, treatments, photo manifest
  i18n/              Locale config, localised routes, dictionaries
  lib/seo.ts         Metadata and structured-data helpers
  views/BrandPage    Internal brand review page
  lib/booking/       Types and feature flag for the future booking system
scripts/prepare-swc-wasm.mjs   Offline SWC WebAssembly fallback for Hostinger builds
scripts/optimize-photos.mjs    Converts assets/photos/* to responsive WebP
scripts/brand/                 Logo generator (SVG) and PNG renderer
public/brand/                  Logo system (SVG/PNG)
docs/ARCHITECTURE.md
```
