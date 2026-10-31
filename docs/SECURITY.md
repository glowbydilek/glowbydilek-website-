# Security: forms, Turnstile and abuse protection

## Cloudflare Turnstile

Both forms (`/contact`, `/afspraak-maken` and the English equivalents) show a Cloudflare Turnstile check. The token is verified **on the server** with Cloudflare Siteverify before anything is emailed (`src/lib/forms/turnstile.ts`).

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

### Status: production keys pending

No live keys are configured yet. Without them the code uses Cloudflare's **official test keys** (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`): the widget appears and the whole flow runs, but **every token passes**, so this is not real protection yet.

### Setting the live keys (owner, in Cloudflare and Hostinger)

1. Cloudflare dashboard → **Turnstile** → **Add widget**. Name: *Glow by Dilek forms*. Hostnames: `glowbydilek.nl` and `www.glowbydilek.nl`. Widget mode: *Managed*. (Turnstile is free; it does not require moving DNS to Cloudflare.)
2. Copy the **site key** and **secret key**. Never paste the secret key into chat, email or GitHub.
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
- Rate limits: 5 / 10 min per IP and form, 3 / hour per email address, 40 / 10 min site-wide (protects against distributed floods), with `Retry-After`.
- Duplicate content accepted once per 24 hours (409), reserved before sending so parallel duplicates are also rejected.
- Client IP: `X-Real-IP` or the last `X-Forwarded-For` entry (set by the host's proxy). If the site is ever proxied through Cloudflare, set `TRUST_CF_CONNECTING_IP=true`.
- Logs contain codes only — no personal data, tokens or message content.
- Security headers incl. a Content-Security-Policy that only allows `challenges.cloudflare.com` as an external script/frame source.

### Limits of this setup (honest)

- Rate limits and replay memory are **in memory per Node.js process**. They reset when Hostinger restarts the app and are not shared between instances. Turnstile remains the main defence; if the site ever runs on several instances, move these to Redis or the booking database.
- No protection makes spam disappear completely. Expect it to drop sharply, not to zero.
