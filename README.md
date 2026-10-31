# Glow by Dilek — website

The official website for **Glow by Dilek**, a premium waxing and beauty business in the Netherlands.

Built with **Next.js 16 (App Router)**, **TypeScript** and **Tailwind CSS 4**. The pages are prerendered as static HTML and served by `next start`, which works with **Hostinger Node.js Web Apps**.

## Features

- Dutch is the default language (no URL prefix). English lives under `/en`. Each page has a translated slug, `hreflang` alternates and a language switcher that keeps you on the same page.
- Pages: Home, Waxing Treatments, Prices, About Dilek, Contact, Request Appointment, plus an internal brand review page at `/merkidentiteit` (not indexed).
- Brand identity: a custom logo system (concept "Lumen"), an ivory, champagne, blush, nude and espresso palette, and Cormorant Garamond with Jost. See [`docs/BRAND.md`](docs/BRAND.md).
- Expandable service architecture: future categories (laser, skin care, beauty) are prepared but **unpublished**. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- Appointment requests run through a pre-filled email (`hello@glowbydilek.nl`). No data is stored on the website.
- SEO: per-page metadata, canonical and hreflang tags, Open Graph images, `sitemap.xml`, `robots.txt`, and JSON-LD (BeautySalon, Service catalogue, FAQPage, BreadcrumbList). No invented address or prices.
- Performance: static pages, self-hosted fonts and no third-party scripts. Photos are pre-optimised to responsive WebP (`npm run photos`), so no runtime image processing is needed.
- Accessibility: semantic landmarks, a skip link, a keyboard-friendly menu and FAQ (`<details>`), visible focus styles, AA-contrast gold for text, and `prefers-reduced-motion` support.

| Page | Dutch (default) | English |
| --- | --- | --- |
| Home | `/` | `/en` |
| Waxing treatments | `/waxbehandelingen` | `/en/waxing-treatments` |
| Prices | `/prijzen` | `/en/prices` |
| About Dilek | `/over-dilek` | `/en/about-dilek` |
| Contact | `/contact` | `/en/contact` |
| Request appointment | `/afspraak-maken` | `/en/book-appointment` |

## Still needed from the owner

| What | Where |
| --- | --- |
| **Photography** (9 slots; brand panels are shown until then) | [`docs/PHOTOGRAPHY.md`](docs/PHOTOGRAPHY.md) |
| **A real portrait of Dilek** (never AI-generated) | `dilek-portrait` slot |
| Confirmed prices and durations | `src/content/treatments.ts`, then set `pricesPublished = true` |
| Optional: phone, WhatsApp, Instagram, city/region for local SEO | `src/content/site.ts` |
| Personal story and edits to the About text | `src/i18n/dictionaries/nl.ts` and `en.ts` |

## Development

```bash
npm install
```

```bash
npm run dev
```

Checks:

```bash
npm run lint && npm run typecheck && npm run build
```

## Deploying to Hostinger (Node.js Web Apps)

1. Connect this GitHub repository (branch `main`) in hPanel → Websites → Node.js Web App.
2. Framework: **Next.js**. Node.js version: **20 or 22**.
3. Build command: `npm run build`. Start command: `npm start`. Output directory: `.next` (Hostinger's default for Next.js).
4. Environment variable: `NEXT_PUBLIC_SITE_URL=https://your-domain.nl`.

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
