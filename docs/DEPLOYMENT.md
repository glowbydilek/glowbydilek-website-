# Deployment, data safety and rollback (Hostinger)

This guide covers putting the platform (public website + `/admin` + `/ajanda`) live on the existing Hostinger **Node.js Web App** for `glowbydilek.nl`, and keeping the data safe afterwards.

> **Nothing here has been done on the live site yet.** The live website is only changed after the owner approves the pull request and starts the deploy. DNS, MX records, nameservers and domain settings do **not** need to change.

## 0. Important: merging = deploying

Checked read-only on 1 November 2026: Hostinger **auto-deploys every push to `main`** (Node.js 20, Next.js, `npm run build`, output `.next`). The live site runs commit `23e38dd` (PR #7). Its only environment variable is `NEXT_PUBLIC_SITE_URL`.

So **merging the platform pull request deploys it at once.** Configure sections 1 and 2 **before** merging. Without them the public pages keep working on the built-in content, but `/admin` and `/ajanda` cannot be used, the forms cannot send email, and the public forms show "temporarily unavailable" (no Turnstile keys).

Hostinger also builds a **preview** for open pull requests (a `*.hostingersite.com` address in the PR comments). Give a preview its own test database and test keys, or none. A preview must never receive the production `DATABASE_URL`, `AUTH_SECRET` or SMTP password, so it can never send real customer emails or touch real data.

## 1. What is needed in Hostinger

| Item | Where in hPanel | Notes |
| --- | --- | --- |
| Node.js Web App for glowbydilek.nl | Websites → glowbydilek.nl | Already exists (Node.js type, confirmed read-only on 1 Nov 2026) |
| MySQL database (MariaDB) + user | Websites → glowbydilek.nl → Databases → **Management** | Create one database for **production only**, e.g. `u…_glow`. Use a long generated password |
| Environment variables | Websites → glowbydilek.nl → Node.js app → **Environment variables** | See section 2. Values are stored encrypted by Hostinger |
| Cron job | Websites → glowbydilek.nl → Advanced → **Cron Jobs** | See section 4 |

No extra paid service or subscription is required: database, cron and email are included in the existing hosting plan.

## 2. Environment variables (production)

Enter these **only in Hostinger's environment-variable screen**. Never paste them into chat, email, GitHub or a committed file. Generate secrets locally, e.g. `openssl rand -base64 48`, a password manager, or hPanel's password generator.

| Name | Value | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://glowbydilek.nl` | no |
| `DATABASE_URL` | `mysql://USER:PASSWORD@127.0.0.1:3306/DATABASE` | **yes** |
| `DB_MIGRATE_ON_BUILD` | `true`, so database migrations run during every build; a failed migration fails the build, so a broken schema is never deployed | no |
| `AUTH_SECRET` | at least 32 random characters (sessions, MFA encryption, IP hashing) | **yes** |
| `CRON_SECRET` | at least 24 random characters, different from `AUTH_SECRET` | **yes** |
| `CONSULTATION_KEY` | *(only if you use the consultation form)* `openssl rand -base64 32` — see `docs/CONSULTATION.md` | **yes** |
| `OWNER_EMAIL` | `hello@glowbydilek.nl` (default) | no |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | `smtp.hostinger.com` / `465` / `true` | no |
| `SMTP_USER` | `hello@glowbydilek.nl` | no |
| `SMTP_PASS` | mailbox password of hello@glowbydilek.nl | **yes** |
| `MAIL_TO` / `MAIL_FROM_NAME` | `hello@glowbydilek.nl` / `Glow by Dilek` (optional) | no |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **new** production site key (see `docs/SECURITY.md`) | public, but baked in at **build** time |
| `TURNSTILE_SECRET_KEY` | **new, rotated** production secret | **yes** |
| `TURNSTILE_ALLOWED_HOSTNAMES` | `glowbydilek.nl,www.glowbydilek.nl` (optional; this is the default) | no |

Notes:

- **Database host `127.0.0.1`**, not `localhost` (which can resolve to IPv6) and not the `srvNNNN.hstgr.io` host (that one is only for remote connections).
- `NEXT_PUBLIC_*` values are compiled into the site: set them **before** the build, and rebuild after changing them.
- **Never** set `TURNSTILE_ALLOW_TEST_KEYS`, `INSECURE_COOKIES`, `ALLOW_INSECURE_DEV_SECRET` or `TURNSTILE_SITEVERIFY_URL` in production. They exist only for local tests.
- The Turnstile secret that appeared in an earlier screenshot must be **rotated** in Cloudflare (Turnstile → widget → *Rotate secret key*) before it is used in production.
- Without Turnstile keys in production, the public forms deliberately refuse submissions and show an "unavailable" notice with the email address; test keys are never used silently.

## 2b. Database migrations in this release

Migration `0001_platform_crm_finance` is **additive only** (new tables and nullable columns: payments, invoices, invoice counters, reviews, review invites, consultations, customer merges, price snapshots, normalised contact fields, outbox attachments). It does not change or delete existing data. Existing customers get their normalised email/phone filled in lazily by the app. Still: **make a database backup before deploying** (section 5).

## 3. First deploy, step by step

1. Approve and merge the platform pull request (owner).
2. Create the production database and user in hPanel (section 1).
3. Set all environment variables (section 2).
4. Start the build/deploy in hPanel. The build runs `db-migrate --on-build`, which creates all tables, then `next build`.
5. Open `https://glowbydilek.nl/admin/login` → **Wachtwoord vergeten?** → enter `hello@glowbydilek.nl`. The owner account is created automatically **without a password**; the reset email (valid for 15 minutes, single use) sets the first password. There is no default password and no public registration.
6. After signing in: **Admin → Beveiliging** → set up two-step verification (MFA) and store the 10 recovery codes offline.
7. Add the cron job (section 4) and check the **admin overview** (`/admin`) a few minutes later: "Automatische taak (cron)" should be green with a recent time (also shown in Ajanda → Instellingen).
8. Send one test message through the contact form and one appointment request with your own email address. Check that both appear in Ajanda and that the emails arrive.
9. Only then: enter real working hours, confirmed prices/durations, and, if wanted, switch on online booking in **Ajanda → Instellingen**.

Production only ever contains real data: do not create test appointments or test customers there (use your own name if you want a test, then anonymise it).

## 4. Cron job (reminders, email retries, clean-up)

Hostinger cron runs in **UTC** and does **not** load the app's environment variables, so the command contains the cron secret itself. The command is visible only inside your hPanel account.

- Schedule: every 10 minutes (`*/10 * * * *`)
- Command (replace `CRON_SECRET_VALUE` with the value of `CRON_SECRET`):

```bash
curl -fsS -m 120 -H "Authorization: Bearer CRON_SECRET_VALUE" https://glowbydilek.nl/api/cron/tick
```

Each run sends due emails from the outbox (with retries), queues reminders for appointments 24 hours ahead (setting in Ajanda), and removes expired sessions, reset links and rate-limit entries. Running it twice never sends an email twice. Reminders are re-checked against the appointment's current time and status before sending, so cancelled or moved appointments never get a stale reminder.

**Status:** tested locally (idempotency, retries, reminder timing including DST). A **real scheduled run on Hostinger has not happened yet**; reminders count as operational only after the first real run has been seen on the admin overview.

## 5. Backups

| What | How | When |
| --- | --- | --- |
| Full database (incl. photos uploaded in the admin) | Hostinger's automatic backups (Websites → Backups), plus a manual export: Databases → **phpMyAdmin** → Export → SQL | Before every deploy and monthly |
| Content export (JSON: content, settings, treatments, customers, appointments; **no** passwords or keys) | Admin → Systeem → **Back-up downloaden** | Monthly, and before large edits |
| Code | GitHub repository (every version) | Automatic |

Backup files contain **personal data** (customer names, contact details, appointments). Store them encrypted (for example in an encrypted folder or password-protected archive) and delete old ones in line with the privacy statement.

### Restore

- **Whole database:** phpMyAdmin → select the database → Import → the `.sql` export. Do this only when the site is quiet, then reload `/admin`.
- **A single page text:** Admin → Pagina's → the page → **Geschiedenis** → restore a version (no database access needed).
- **Theme:** Admin → Thema → **Goedgekeurd thema herstellen**.

A test restore into a separate, empty database is recommended once, so you know the backup is usable.

## 6. Rollback

- **Code:** in hPanel, redeploy the previous successful deployment, or revert the merge commit on GitHub and redeploy. Database migrations are additive (new tables/columns), so the previous code version keeps working with the newer schema in normal cases.
- **Database:** restore the export made before the deploy (section 5).
- **Content mistake:** use page history or "Oorspronkelijke tekst" in the admin; no deploy needed.

## 7. Keep production separate from development and tests

- Separate databases: production on Hostinger; development and tests use their own local databases (`glow_dev`, `glow_test`). The automated tests **empty every table** of the database they are given, so `TEST_DATABASE_URL` must **never** point to production.
- Separate secrets: production `AUTH_SECRET`, `CRON_SECRET`, SMTP password and Turnstile keys exist only in Hostinger. Development uses throwaway values and the Cloudflare test keys.
- Test systems never send real customer email: local tests use a local SMTP sink, and CI has no SMTP settings.
- Preview/test deployments, if any, need their own database and their own Turnstile widget, and must never use production data.

## 8. Health checks after a deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://glowbydilek.nl/
```

```bash
curl -sI https://glowbydilek.nl/admin/login
```

The first should print `200`. The second should show `x-robots-tag: noindex` and `cache-control: no-store`. Then check the **admin overview** (`/admin`): database, email (SMTP), Cloudflare Turnstile ("Live sleutels ingesteld"), automatic task (cron), session key and working hours, plus any failed emails.
