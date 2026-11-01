# Handover — Glow by Dilek master release (November 2026)

Branch `claude/happy-feynman-ars6eb`, based on `main` at `6aebc5a` (PR #9, merged and live). **Nothing in this release is merged or deployed.** Hostinger deploys every push to `main` automatically, so merging = deploying.

## 1. Where things stood (audit, 1 November 2026)

| Finding | Status before | Now |
| --- | --- | --- |
| Production | Runs PR #9 (`6aebc5a`). Only `NEXT_PUBLIC_SITE_URL` is set: no database, no SMTP, no Turnstile keys. `/admin` and `/ajanda` show "Nog niet gekoppeld"; public forms show "temporarily unavailable". The build log confirms no migration ran. | Unchanged (read-only check, nothing configured — owner action) |
| Photo under "De gedachte achter Glow" | Removed in PR #9 | Restored as a split layout (photo + quote) |
| `/ajanda` | Owner area URL | `/agenda`; `/ajanda/*` redirects permanently (old reset links keep working) |
| Central login / footer link | Missing | `/login` (after login: Websitebeheer or Agenda); discreet "Inloggen" in the footer |
| Mobile booking CTA | Full-width, heavy | Compact buttons; CTA groups wrap |
| Scroll position | Reported | Not reproducible: e2e "pages open at the top" (mobile + desktop) passes; anchors and back/forward checked |
| Glow transition | Click-position light — **it never ran in production**: Next.js `<Link>` cancelled the click before the listener saw it | Centred four-point diamond sparkle; capture-phase listener; overlay cleared on back/forward; off with reduced motion |
| FAQ "+" icons | Round plus | Serif index + hairline cross that folds into a line; smooth open |
| Treatment categories | Hard-coded waxing only | Database-driven catalogue; owner adds categories, sub-categories, treatments, packages |
| Facial / body / massage / packages | Missing | Added as **drafts** with neutral copy, no prices or claims |
| Promotions, invoice automation | Missing | Added (all off by default) |
| Live MySQL / SMTP / Turnstile | Not verified | Still not verifiable: not configured in production |

## 2. What was built

1. **Catalogue** (Admin → Behandelingen): sections, sub-categories, treatments and packages with NL/EN names, slugs, status (draft/published/archived), price mode (fixed / from / on request), duration, buffer, VAT category, featured, online-bookable, sort; publishing a draft needs an explicit confirmation; packages are public only when all their treatments are. Public routes, mega menu, footer, prices, booking forms, sitemap, structured data and hreflang follow the catalogue.
2. **Price on request**: proposal from the agenda → personal single-use link → customer accepts/declines → agreed price stored; emails both ways.
3. **Promotions & slider** (Admin → Acties & kortingen): percentage/fixed, scope, codes, period, limits; one per appointment; honest 30-day reference price; accessible homepage slider.
4. **Legal pages**: cookie policy (online), terms, cancellation and review policy as drafts with `[INVULLEN …]`; versions and effective date.
5. **Over Dilek**: exact diploma, certificates, background, optional real portrait; shown only after confirmation.
6. **Products & materials**: product register, stock movements, expiry warnings, protocols per treatment; optional public page (off).
7. **Finance**: VAT per invoice line (21/9/0/exempt) and KOR; discounts split per rate; expenses with private receipts; finance by category, discounts, VAT summary, cash balance; CSV export.
8. **Automation**: invoice draft/issue/email after completion (off); aftercare email (off).
9. **Homepage**: service discovery across published sections, featured items chosen by the owner, latest reviews, campaign slider.
10. **Photography**: three new licensed still lifes (facial, body, massage).
11. **Fix**: admin forms no longer lose typed values after a server-side error (React 19 form reset).

## 3. Feature status

Legend: ✅ yes · — not applicable · ❌ not yet

| Feature | Implemented | Tested locally | Tested in preview | Configured in Hostinger | Verified in production |
| --- | --- | --- | --- | --- | --- |
| `/agenda`, `/login`, redirects | ✅ | ✅ unit + e2e | ❌ | — | ❌ |
| Diamond transition, FAQ, CTAs | ✅ | ✅ screenshots + e2e | ❌ | — | ❌ |
| Catalogue + drafts | ✅ | ✅ unit + e2e publish/unpublish | ❌ | ❌ (needs DB) | ❌ |
| Price proposals | ✅ | ✅ unit + e2e (mail sink) | ❌ | ❌ (needs DB + SMTP) | ❌ |
| Promotions + slider | ✅ | ✅ unit + e2e | ❌ | ❌ | ❌ |
| Legal pages | ✅ | ✅ unit + routes | ❌ | — | ❌ |
| Over Dilek profile | ✅ | ✅ unit + QA screens | ❌ | ❌ | ❌ |
| Products / stock / protocols | ✅ | ✅ unit + QA screens | ❌ | ❌ | ❌ |
| Multi-rate VAT, KOR, discounts on invoices | ✅ | ✅ unit (exact cents) | ❌ | ❌ (accountant input) | ❌ |
| Expenses + receipts + CSV | ✅ | ✅ unit + e2e | ❌ | ❌ | ❌ |
| Invoice automation, aftercare | ✅ | ✅ unit (DB) | ❌ | ❌ | ❌ |
| Real email (Hostinger SMTP) | ✅ code | local sink only | ❌ | ❌ | ❌ |
| Turnstile live keys | ✅ code | mock only | ❌ | ❌ (rotate first) | ❌ |
| Cron job | ✅ code | ✅ local | ❌ | ❌ | ❌ |

"Tested in preview": the Hostinger PR preview host cannot be reached from this environment, so preview checks are for the owner.

## 4. Test results (actual, 1 November 2026)

| Check | Result |
| --- | --- |
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` with MariaDB | **147/147** (catalogue visibility & slugs, pricing rules, packages, quotes, promotions, VAT per line, discount allocation, expenses, receipts, CSV, automation, products, profile, legal + all earlier suites) |
| Owner journey in the browser (`e2e-private`) | **28/28** — incl. `/login` chooser, `/ajanda` redirect, publish/unpublish a draft, price proposal accepted via the emailed link, promotion + slider, expense with receipt + CSV |
| Navigation (`e2e-navigation`) | 11/11 (pages open at the top on mobile and desktop) |
| Site crawl (`check-site`) | 58 pages / 85 links (default) · 90 pages / 139 links with every draft published locally — all passed |
| Accessibility (axe, WCAG 2.1 AA) | Private: 0 violations on 48 screens at 9 widths. Public: footer "Inloggen" contrast found and fixed; recheck 0 violations |
| Horizontal overflow, 320–1920 px | Two issues found (long select in Producten, Tarieven heading at 320–375 px) and fixed; recheck clean |
| Lighthouse (mobile emulation, local server) | Accessibility, Best practices, SEO **100** on home, tarieven, gezichtsbehandelingen, afspraak-maken. Performance **73–98** (LCP 2.2–4.9 s, CLS ≤ 0.001); runs vary strongly in this shared container — measure again on Hostinger |
| Migration 0002 | Upgrade of a 0001 database with data: counts, amounts and invoice PDF hash identical. Fresh database: 47 tables |
| `npm audit --omit=dev` | 0 vulnerabilities |

## 5. Data safety

- Migration `0002` is additive. Upgrade test: an existing 0001 database with customers, appointments, payments and an issued invoice was migrated; counts, amounts and the invoice PDF hash are identical. Fresh install: 47 tables.
- Rollback: redeploy the previous build or revert the merge; the old code runs on the new schema (only added tables/columns).
- Back up the database before the first deploy (`docs/DEPLOYMENT.md` § 5).

## 6. Owner actions before going live

See `docs/OWNER-CHECKLIST.md`: Hostinger database and secrets (never in chat), Turnstile secret rotation, first login + MFA, business/VAT details with the accountant, review drafts and legal placeholders, working hours, prices and durations.

## 7. Not done / not verifiable here

- Real devices (iPhone Safari, Android Chrome): not available; Chromium at mobile sizes only.
- Hostinger preview and production: unreachable from this environment; production has no database yet.
- Real SMTP delivery, live Turnstile, real cron runs.
- Official product information for Depilève/Extenso could not be verified (`docs/PRODUCTS.md`).
- Exact diploma title: to be entered by the owner.

## 8. Recommendation

**NO-GO for going live today**, **GO for review and merge once** the database, secrets (incl. rotated Turnstile secret), SMTP test, MFA and the accountant's VAT confirmation are done. The code is ready for review; the business cannot take bookings safely in production until those configuration steps are completed.
