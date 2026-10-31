# Glow by Dilek — website

The official website for **Glow by Dilek**, a premium waxing and beauty business in the Netherlands.

Built with **Next.js 16 (App Router)**, **TypeScript** and **Tailwind CSS 4**. The pages are prerendered as static HTML and served by `next start`, which works with **Hostinger Node.js Web Apps**.

## Features

- Dutch is the default language (no URL prefix). English lives under `/en`.
- Each page has a translated URL slug, plus `hreflang` alternates and a language switcher that keeps you on the same page.
- Pages: Home, Waxing Treatments, Prices, About Dilek, Contact, Book Appointment.
- Brand palette: ivory, champagne gold, soft nude and charcoal. Fonts: Cormorant Garamond (headings) and Jost (body text), both self-hosted through `@fontsource`, so the build needs no network access.
- SEO: per-page metadata, canonical URLs, Open Graph and Twitter cards, `sitemap.xml` with language alternates, `robots.txt`, a web manifest, and Schema.org `BeautySalon` JSON-LD.
- Accessibility: semantic landmarks, a skip link, a keyboard-friendly mobile menu, visible focus styles and `prefers-reduced-motion` support.
- Security headers are set in `next.config.ts`.

| Page | Dutch (default) | English |
| --- | --- | --- |
| Home | `/` | `/en` |
| Waxing treatments | `/waxbehandelingen` | `/en/waxing-treatments` |
| Prices | `/prijzen` | `/en/prices` |
| About Dilek | `/over-dilek` | `/en/about-dilek` |
| Contact | `/contact` | `/en/contact` |
| Book appointment | `/afspraak-maken` | `/en/book-appointment` |

## Not implemented yet (on purpose)

Online booking, payments and customer data storage are **not** implemented. The booking page tells visitors this and points them to direct contact. The site has no forms and collects no personal data. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the future appointment system and admin dashboard will fit in.

## Content to complete before launch

| What | Where |
| --- | --- |
| Contact details (email, phone, WhatsApp, Instagram, address or region) | `src/content/site.ts` (empty fields are hidden automatically) |
| Final prices and durations, then set `pricesConfirmed = true` | `src/content/treatments.ts` |
| Dilek's personal story and copy edits | `src/i18n/dictionaries/nl.ts` and `en.ts` |
| Production domain | `NEXT_PUBLIC_SITE_URL` environment variable |
| Photos (optional) | `public/images/` (the About page has a decorative frame ready to swap) |

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

## Project structure

```
src/
  app/
    (nl)/            Dutch root layout and pages (default language, no prefix)
    (en)/en/         English root layout and pages
    sitemap.ts, robots.ts, manifest.ts, icon.svg, globals.css
  components/        Header, footer, buttons and other shared UI
  views/             Page content shared by both languages
  content/           Business details and the treatment/price catalogue
  i18n/              Locale config, localised routes, dictionaries
  lib/seo.ts         Metadata and structured-data helpers
  lib/booking/       Types and feature flag for the future booking system
docs/ARCHITECTURE.md
```
