# Production release checklist

Work through this in order. Do **not** merge or deploy without the owner's approval.

## A. Before merging the pull request

- [ ] GitHub CI is green on the PR (both jobs: Node 22 checks, and the Node 20 Hostinger-style build).
- [ ] The owner has reviewed the screenshots (desktop and mobile) and approved the design.
- [ ] The owner has approved the first-person and process statements (see `docs/OWNER-CHECKLIST.md` § Approval).
- [ ] The owner has reviewed the privacy statement.

## B. Hostinger configuration (owner, in hPanel; never in chat or Git)

> Hostinger auto-deploys `main`: complete this section **before** merging (`docs/DEPLOYMENT.md` § 0).

- [ ] Production database and user created (Databases → Management).
- [ ] All environment variables from `docs/DEPLOYMENT.md` § 2 set, including `DATABASE_URL` (host `127.0.0.1`), `DB_MIGRATE_ON_BUILD=true`, `AUTH_SECRET`, `CRON_SECRET`, the SMTP settings, and the **rotated** Turnstile keys. None of the test-only variables are set.
- [ ] Build settings unchanged: Node 20 or 22, `npm run build`, `npm start`, branch `main`.
- [ ] Backup of the current site taken (Hostinger → Backups).

## C. Merge and deploy

- [ ] Merge the PR into `main`, then let Hostinger rebuild (or click **Redeploy**). Environment variables only take effect after a rebuild.
- [ ] The build log shows `[db-migrate] database schema is up to date`, `[prepare-swc-wasm] … installed` and `Next.js … (webpack)`. GLIBC warnings about the native SWC binary are expected and harmless.

## D. Post-deploy verification (live site)

- [ ] First login: `/admin/login` → **Wachtwoord vergeten?** → the reset email arrives at hello@glowbydilek.nl → new password works. (Only after this does password recovery count as operational.)
- [ ] Two-step verification enabled in Admin → Beveiliging; recovery codes stored offline.
- [ ] Cron job added (`docs/DEPLOYMENT.md` § 4); after 10–20 minutes the admin overview shows the automatic task as green. (Only then do reminders count as operational.)
- [ ] The admin overview shows Turnstile "Live sleutels ingesteld" and SMTP configured.
- [ ] `/admin` and `/ajanda` are not in `sitemap.xml` and respond with `x-robots-tag: noindex`.

- [ ] `https://glowbydilek.nl` and `https://glowbydilek.nl/en` load; the photos display; there are no console errors.
- [ ] Contact form (NL): submit a test message from a personal address. The notification arrives at hello@glowbydilek.nl, **Reply-To** is the test address, the acknowledgement arrives, and the message appears in Ajanda → Berichten.
- [ ] Appointment form (EN): the same test. The acknowledgement says the request is **not yet confirmed** and the request appears in Ajanda → Aanvragen. Decline or cancel it afterwards (and anonymise the test customer), so no test data stays in production.
- [ ] Reply to the notification, and check that the reply reaches the customer address.
- [ ] The Turnstile check appears on both forms; a submission without completing it is refused, and the form keeps its values.
- [ ] Open a treatment page (e.g. `/waxbehandelingen/bikini-intiem/brazilian-wax`), click "Vraag deze behandeling aan" and check the treatment is preselected.
- [ ] Switch NL ⇄ EN on a treatment page and land on the same treatment.
- [ ] No page shows an address or location other than the approved sentence.
- [ ] `https://glowbydilek.nl/sitemap.xml` (54 URLs) and `/robots.txt` load.
- [ ] Optional: verify in Google Search Console and submit the sitemap.
- [ ] Record the email, reset and cron test results in `docs/EMAIL.md` (§ Verification status).

## E. Rollback

- [ ] If anything fails: in Hostinger, redeploy the previous successful deployment, or revert the merge commit on `main`. Database restore: `docs/DEPLOYMENT.md` § 5–6.
