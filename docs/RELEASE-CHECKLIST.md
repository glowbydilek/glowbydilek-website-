# Production release checklist

Work through this in order. Do **not** merge or deploy without the owner's approval.

## A. Before merging the pull request

- [ ] GitHub CI is green on the PR (both jobs: Node 22 checks, and the Node 20 Hostinger-style build).
- [ ] The owner has reviewed the screenshots (desktop and mobile) and approved the design.
- [ ] The owner has approved the first-person and process statements (see `docs/OWNER-CHECKLIST.md` § Approval).
- [ ] The owner has reviewed the privacy statement.

## B. Hostinger configuration (owner, in hPanel; never in chat or Git)

- [ ] Node.js Web App → **Environment variables**:
  - `NEXT_PUBLIC_SITE_URL=https://glowbydilek.nl`
  - `SMTP_HOST=smtp.hostinger.com`
  - `SMTP_PORT=465`
  - `SMTP_SECURE=true`
  - `SMTP_USER=hello@glowbydilek.nl`
  - `SMTP_PASS=<mailbox password>`
  - optional: `MAIL_TO=hello@glowbydilek.nl`, `MAIL_FROM_NAME=Glow by Dilek`, `NEXT_PUBLIC_WHATSAPP_NUMBER=<digits>`
- [ ] Build settings unchanged: Node 20 or 22, `npm run build`, `npm start`, branch `main`.

## C. Merge and deploy

- [ ] Merge the PR into `main`, then let Hostinger rebuild (or click **Redeploy**). Environment variables only take effect after a rebuild.
- [ ] The build log shows `[prepare-swc-wasm] … installed` and `Next.js … (webpack)`. GLIBC warnings about the native SWC binary are expected and harmless.

## D. Post-deploy verification (live site)

- [ ] `https://glowbydilek.nl` and `https://glowbydilek.nl/en` load; the photos display; there are no console errors.
- [ ] Contact form (NL): submit a test message from a personal address. The notification arrives at hello@glowbydilek.nl, **Reply-To** is the test address, and the acknowledgement arrives at the test address.
- [ ] Appointment form (EN): the same test. The acknowledgement says the request is **not yet confirmed**.
- [ ] Reply to the notification, and check that the reply reaches the customer address.
- [ ] `https://glowbydilek.nl/sitemap.xml` and `/robots.txt` load.
- [ ] Optional: verify in Google Search Console and submit the sitemap.
- [ ] Record the email test results in `docs/EMAIL.md` (§ Verification status).

## E. Rollback

- [ ] If anything fails: in Hostinger, redeploy the previous successful deployment, or revert the merge commit on `main`.
