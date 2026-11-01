# Handover — "Luminous Beauty Atelier" release (November 2026)

Branch `claude/happy-feynman-ars6eb`, based on `main` at `f01ecbe` (PR #11, merged). **Nothing in this release is merged or deployed.** Hostinger deploys every push to `main` automatically, so merging = deploying. The previous release's handover is in git history (`git show f01ecbe:docs/HANDOVER.md`).

Legend: **PASS** verified here with evidence · **FAIL** checked and not met · **BLOCKED — ACCESS/OWNER APPROVAL REQUIRED** cannot be verified from this environment or needs an owner decision. Environments: *unit* (Node test runner), *local* (production build `next start` on this container with a local MariaDB, a local SMTP sink and a Turnstile mock), *staging/production* (not reachable from here).

## 1. Audit findings (brief § 2) and what changed

| Observed problem | Now |
| --- | --- |
| Home eyebrow `WAXSTUDIO`, waxing-studio positioning | "Glow by Dilek · Beauty & relaxation", NL H1 "Jouw moment om te stralen.", EN "A little moment, just for you."; all NL/EN copy repositioned (no "waxstudio" anywhere in `src/`) |
| Massage not public | *Massages* section and *Ontspanningsmassage* published (price on request, no invented duration); homepage card, Treatments menu, prices, request form, sitemap. "Drein" **not** published — owner question |
| Social preview showed the old "Professional Waxing / Waxstudio" card | New NL/EN social images (`public/images/og-*.png`, generator `scripts/brand/build-og.cjs`); icons and logo files regenerated in the new palette |
| Production "Nog niet gekoppeld" (no database) | Unchanged — **BLOCKED** (owner must create the database and secrets in Hostinger) |
| iPhone native blue date picker overlay | Replaced by an accessible custom calendar (bottom sheet on phones, safe-area aware) |
| Empty beige sections, weak hierarchy | New palette (pearl, soft rose, orchid mist, rosewood, champagne, deep plum, ivory), Bodoni Moda display type, luminous hero with arched portrait, image discovery cards, deep-plum appointment band |
| Customer photos | No photo field exists; generic silhouette avatar in the customer list and record |
| 5-question consultation ≠ signed intake requirement | Versioned NL/EN "Intake & toestemming" master (A4 print + PDF), signed photo/PDF per customer, encrypted, audited (`docs/INTAKE.md`) |

## 2. What was built

1. **Design system** — tokens in `src/app/globals.css` (contrast checked: ink on pearl 15.3:1, rosewood on pearl 6.4:1), self-hosted Bodoni Moda (OFL) + Instrument Sans, approved theme + "Vorige stijl" preset in Admin → Thema & Design.
2. **Homepage** in the brief's order: hero → *Ontdek jouw behandeling* → *Even helemaal voor jezelf* → *Met aandacht voor elk detail* → *Zo werkt een afspraak* → journeys (featured, preparation/aftercare) → reviews (only when real ones are published) → FAQ → CTA. Owner can still reorder/hide sections.
3. **Navigation** — NL: Home · Behandelingen · Tarieven · Over Dilek · Veelgestelde vragen · Contact · Afspraak aanvragen; EN equivalent. Massage, prices and booking are one step from the homepage.
4. **Date picker** — Monday-first, NL/EN, Europe/Amsterdam "today", closed weekdays/dates disabled (live from working hours, also refused by the API), 44 px targets, full keyboard support, Escape returns focus.
5. **Selection feedback** — ~420 ms light sweep on CTAs, cards and chosen dates; "request received" glint burst (never a checkmark, copy says "not yet confirmed"); all off with reduced motion.
6. **Intake & consent** — see `docs/INTAKE.md`; migration `0003` (additive).
7. **Fixes found during QA** — upload before first template view (fresh database), PDF page overflow, old palette in invoice PDF, page-transition colours, brand page.

## 3. Acceptance criteria (brief § 11)

| # | Criterion | Result | Evidence (environment) |
| --- | --- | --- | --- |
| 1 | Positioning: no waxing-studio homepage, NL/EN copy | **PASS** | `grep -ri waxstudio src` → none; screenshots `home-*` (local) |
| 2 | Massage page + card + nav, reachable within 2 steps | **PASS** | `/massages`, `/massages/ontspanningsmassage`, EN equivalents; nav e2e "mega menu lists Massages" (local) |
| 3 | No invented prices, durations, techniques, credentials, reviews, addresses | **PASS** | massage "op aanvraag", duration empty (unit test `catalogue.test.ts`); reviews only when published |
| 4 | Responsive 320 / 375 / 390 / 430 / 768 / 1024 / 1440 / 1920 | **PASS** | 64 pages × 8 widths: no overflow, no content under header, no console errors/4xx (`qa3b`, local); re-checked after the final font change at 320/390/768/1440/1920 |
| 5 | WCAG 2.2 AA (automated) | **PASS** (automated only) | axe-core `wcag2a/2aa/21aa/22aa` + best practice: 0 violations, 64 public pages at 390 + 1440, intake/CRM screens at 390 + 1280; Lighthouse accessibility 100. Manual screen-reader test: **BLOCKED — needs a real device** |
| 6 | Custom date picker (Monday-first, NL/EN, Amsterdam, closed days, 44 px, keyboard, Escape) | **PASS** | `calendar.test.ts`; picker check at 320/390/1280: 44 px cells, sheet fits 320×640, closed days disabled, axe 0; nav e2e picks a date and checks focus return (local) |
| 7 | Request-first booking, "received" ≠ confirmed | **PASS** | e2e "appointment request … sent successfully" (local SMTP sink); success copy says not yet confirmed |
| 8 | Intake master NL/EN, versioned, A4 print + PDF | **PASS** | `intake.test.ts`; PDF 2 pages per language; e2e-intake (local) |
| 9 | Signed upload: private, MFA, allowlist, content check, EXIF/GPS strip, encryption, audit, history, delete | **PASS** | `intake.test.ts` (MariaDB) + `e2e-intake.cjs` 9/9 (anonymous download → 401, no-store, EXIF removed) |
| 10 | Generic avatar, no customer photos | **PASS** | customer list + record screenshots (local) |
| 11 | Existing features preserved | **PASS** | 157/157 unit+DB tests; owner journey e2e 28/28; navigation e2e 13/13; crawl 64 pages / 93 links (local) |
| 12 | Lighthouse LCP ≤ 2.5 s (mobile) | **FAIL (lab, simulated)** | Simulated slow-4G mobile LCP 2.87–3.84 s (home 3.2–3.8 s, massages 2.9–3.3 s, booking 3.1 s). Observed LCP in the same runs 0.12–0.22 s. Improved this release: FCP 2.2 → 1.07 s, fonts preloaded. Needs a real-host and field measurement |
| 13 | CLS ≤ 0.1 | **PASS** (lab) | 0.000 on all measured pages |
| 14 | INP ≤ 200 ms | **BLOCKED — needs field data** | INP cannot be measured in a lab run; proxy TBT 63–117 ms |
| 15 | iPhone Safari (real device) | **BLOCKED — ACCESS REQUIRED** | Only Chromium with mobile emulation available here |
| 16 | Staging / production DB, SMTP, Turnstile, cron | **BLOCKED — ACCESS/OWNER APPROVAL REQUIRED** | Production has only `NEXT_PUBLIC_SITE_URL`; nothing configured or deployed |
| 17 | AVG sign-off for health data | **BLOCKED — OWNER APPROVAL REQUIRED** | Upload stays off until confirmed (`docs/INTAKE.md`) |
| 18 | Social preview / icons in the new brand | **PASS** | `public/images/og-nl.png`, `og-en.png`, icons regenerated |

Lighthouse other categories (mobile, 3 runs each): Performance 88–95, Accessibility 100, SEO 100, Best practices 100 (96 on the booking page only because this sandbox blocks the Cloudflare Turnstile script).

**Cleanup inventory** (tracked files): before this release (`f01ecbe`) 509 files / 8.10 MB → after 537 files / 8.52 MB (+28 files: intake module, migration 0003, date picker, tests, fonts, docs; +0.42 MB mostly the migration snapshot, the two self-hosted font files and the new social images). No unused photos; no `100vh` on public pages; the old "Professional Waxing" social images were replaced.

## 4. Data safety, migrations, rollback

- `0003_intake_documents` is additive (two new tables). Tested: fresh database (0000→0003, used by the test suite) and upgrade of the local development database that already held customers and appointments.
- **Before the first deploy:** database backup (`docs/DEPLOYMENT.md` § 5). Rollback: redeploy the previous build; the old code runs on the new schema.
- The catalogue change (massage published) applies to new databases; an existing database keeps the owner's own status.

## 5. Configuration the owner must do (never paste secrets in chat or GitHub)

Hostinger → Environment variables: database (`DATABASE_URL`, `DB_MIGRATE_ON_BUILD=true`), `AUTH_SECRET`, `CRON_SECRET`, SMTP, **rotated** Turnstile keys, optional `CONSULTATION_KEY` and `INTAKE_DOCUMENT_KEY`; cron job; first login + two-step verification. Details: `docs/DEPLOYMENT.md`, `docs/OWNER-CHECKLIST.md`.

## 6. Owner decisions needed

1. **"Drein"** — exact name and scope (no drainage/health claims are published).
2. Massage price/duration/techniques (now "op aanvraag", no techniques named).
3. Which drafts to publish (facials, body care, packages).
4. **AVG sign-off** for the intake form (legal review of wording + retention) before storing signed forms.
5. Production access/approval: database, secrets, SMTP test, Turnstile rotation, then merge (= deploy).

## 7. Recommendation

**NO-GO for production today** (no database/SMTP/Turnstile in production; AVG sign-off for intake pending). **GO for review**: the code, tests and local verification are complete for everything that can be verified here.
