# Security: private areas, forms, Turnstile and abuse protection

## Cloudflare Turnstile

The public forms (contact, appointment request, online booking) and the private login and password-reset forms show a Cloudflare Turnstile check. The token is verified **on the server** with Cloudflare Siteverify before anything is stored or emailed (`src/lib/forms/turnstile.ts`).

| Check | Result |
| --- | --- |
| No token | 403 `challenge` (`missing`) — Cloudflare is not called |
| Malformed / oversized token | 403 (`invalid`) |
| Cloudflare says invalid | 403 (`invalid`) |
| Token expired or already spent at Cloudflare (`timeout-or-duplicate`) | 403 (`expired`) |
| Token already used on this server (replay) | 403 (`replayed`) — checked locally before Cloudflare |
| Challenge older than 5 minutes | 403 (`expired`) |
| Hostname not `glowbydilek.nl` / `www.glowbydilek.nl` (live keys only) | 403 (`hostname`) |
| Action not `contact` / `appointment` respectively (live keys only) | 403 (`action`) |
| Cloudflare unreachable / timeout (6 s) | 503 `unavailable` — fail closed, visitor is asked to email instead |

The browser requests a fresh token after every attempt (tokens are single-use). A failed or expired check never clears the form.

### Status and modes

The server runs in one of three modes, shown on the admin overview:

| Mode | When | Behaviour |
| --- | --- | --- |
| `live` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` set to real keys | Full protection |
| `test` | Development, or `TURNSTILE_ALLOW_TEST_KEYS=true` (local/preview only) | Cloudflare's official test keys: the flow works, **every token passes** |
| `missing` | Production without keys (or with test keys and no explicit opt-in) | Public forms **refuse** submissions and show "temporarily unavailable — email hello@glowbydilek.nl". Login and password reset stay usable so the owner is never locked out; they remain protected by rate limits and lockout |

Production therefore never silently runs on test keys.

**Live keys are not configured yet.** The secret that appeared in an earlier screenshot must be **rotated** before production use. The connected Cloudflare integration can read the account, but it has **no Turnstile permission** (the widget API returns 403), so keys could not be checked or rotated from here; this is done by the owner in the Cloudflare dashboard, as described below. No Cloudflare settings, DNS or nameservers were changed.

### Setting the live keys (owner, in Cloudflare and Hostinger)

1. Cloudflare dashboard → **Turnstile** → **Add widget**. Name: *Glow by Dilek forms*. Hostnames: `glowbydilek.nl` and `www.glowbydilek.nl`. Widget mode: *Managed*. (Turnstile is free; it does not require moving DNS to Cloudflare.)
2. For the existing widget: **Rotate secret key** first (the old one was exposed). Copy the **site key** and the new **secret key**. Never paste the secret key into chat, email or GitHub.
3. Hostinger → the Node.js app → **Environment variables**:

   | Name | Value | Notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | site key | Public; baked in at build time, so **rebuild** after setting |
   | `TURNSTILE_SECRET_KEY` | secret key | Server only, secret |
   | `TURNSTILE_ALLOWED_HOSTNAMES` | *(optional)* `glowbydilek.nl,www.glowbydilek.nl` | Default is derived from `NEXT_PUBLIC_SITE_URL` |

4. Rebuild/redeploy, then send one test message through each form.
5. Keep **separate widgets** (or the test keys) for local development and previews; the production secret belongs only in Hostinger.

`TURNSTILE_SITEVERIFY_URL` exists only for offline tests and is **ignored** as soon as a real secret is set.

## Other protections

- Honeypot field, minimum fill time and link-spam check (silent fake success for bots).
- Same-origin check, JSON only, 12 KB body limit, strict field limits, newline stripping (no email header injection), HTML escaping.
- Rate limits: 5 / 10 min per IP and form, 3 / hour per email address, 40 / 10 min site-wide (protects against distributed floods), with `Retry-After`. Stored in MySQL (`rate_limits`, hashed keys), so they survive restarts; without a database they fall back to memory.
- Duplicate content accepted once per 24 hours (409), reserved atomically in the database before sending, so parallel duplicates are also rejected. Turnstile tokens are also claimed once in the database (replay protection across restarts).
- Client IP: `X-Real-IP` or the last `X-Forwarded-For` entry (set by the host's proxy). If the site is ever proxied through Cloudflare, set `TRUST_CF_CONNECTING_IP=true`.
- Logs contain codes only — no personal data, tokens or message content.
- Security headers incl. a Content-Security-Policy that only allows `challenges.cloudflare.com` as an external script/frame source.

## Private areas (`/admin`, `/ajanda`)

- One owner account (`OWNER_EMAIL`, default hello@glowbydilek.nl), created automatically **without a password**. There is no registration and no default password; the first password is set through "Wachtwoord vergeten?".
- Passwords: scrypt (N=32768, r=8, p=1) with a per-user salt; minimum 12 characters; obviously weak passwords (e.g. containing "wachtwoord", the business name or the email name) are refused.
- Sessions: random 256-bit token, stored only as a SHA-256 hash; cookie `__Host-glow_session` (HttpOnly, Secure, SameSite=Lax, path /). Idle timeout 14 days, absolute 30 days. Logout, password change and password reset end sessions; **Overal uitloggen** (all devices) is available in Admin → Beveiliging, which also lists the active sessions.
- Password reset: 15 minutes, single use, token stored hashed, ends **all** sessions; responses are neutral (no account enumeration). The reset email is sent directly (not through the outbox) and the link always uses `NEXT_PUBLIC_SITE_URL`, never the request host.
- Brute force: 8 failed attempts lock the account for 15 minutes; IP- and account-based rate limits on login, MFA and reset.
- Two-step verification (TOTP, authenticator app): secret encrypted with AES-256-GCM (key derived from `AUTH_SECRET`), replay of a used code refused, 10 single-use recovery codes stored hashed. Strongly recommended; the admin shows a banner until it is enabled.
- CSRF: server actions only accept same-origin requests (Next.js Origin check) plus an explicit same-origin check; cookies are SameSite.
- Audit log of logins, failures, resets, MFA changes, content publishes and appointment actions (Admin → Systeem). Logs never contain passwords, tokens or secrets.
- Private routes are `noindex`, `no-store`, `no-referrer`, excluded from the sitemap and disallowed in robots.txt.
- Uploads: only JPEG/PNG/WebP (checked by the file's content, not its name), max 12 MB and 40 megapixels; re-encoded to WebP (metadata stripped); served with `nosniff` and a sandbox CSP.

**Verification status:** all of the above is covered by automated tests and a browser walkthrough against a local database and a local SMTP sink. Password recovery counts as operational only after a **real reset email** has been received from the production SMTP server.

### Limits of this setup (honest)

- Rate limits, replay and duplicate memory live in MySQL and are shared by all app processes. If the database is unreachable they fall back to per-process memory until it is back.
- No protection makes spam disappear completely. Expect it to drop sharply, not to zero.

## Business data added in 2026 (CRM, finance, invoices, reviews, consultation)

- **Authorisation:** every Ajanda/Admin page, server action and file route (PDFs, exports) re-checks the owner session on the server (`assertOwner` / `requireOwner`); private route handlers return 401 without a session. All private responses are `noindex`, `no-store`, `no-referrer`.
- **Consultation (health) data:** encrypted with AES-256-GCM under `CONSULTATION_KEY`, MFA required, every view/change/export/deletion audited, excluded from exports, emails, PDFs, reports and analytics; off until the owner confirms the legal conditions. See `docs/CONSULTATION.md`.
- **Invoices:** issued invoices are immutable (status guard + frozen snapshot + PDF SHA-256); corrections only via credit invoices; numbers are allocated under a row lock. Invoice emails only go to the address frozen on the invoice while it still matches the customer.
- **Payments:** never deleted, only voided with a reason; all changes audited.
- **Customer identity:** a public form can no longer change an existing profile; matching uses normalised email/phone and the owner decides; merges are manual, snapshotted and audited.
- **Reviews:** Turnstile, per-IP/email/global limits, duplicate detection, link ban, moderation before publication, report threshold, single-use hashed invitation tokens; owner replies are plain text (React escapes all output).
- **Social and analytics settings:** strict validation (https + the network's own domain; `G-` Measurement IDs only); GA4 loads only after visitor consent; the CSP allows Google Analytics hosts, which are only contacted after consent.
- **SQL:** all queries go through Drizzle's parameterised builder or tagged `sql` templates (values are bound, never concatenated).
- **Dependency audit:** `npm audit --omit=dev` reports 0 vulnerabilities (1 November 2026).
