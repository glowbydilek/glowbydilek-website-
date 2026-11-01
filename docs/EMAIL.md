# Email: forms, appointment emails and reminders

The public forms post to server-side endpoints (`/api/contact`, `/api/appointment` and, when online booking is switched on, `/api/booking/request`). These validate the input, **store** the message or request in the database (visible in Agenda → Berichten / Aanvragen), send a notification to the studio mailbox with the customer as **Reply-To**, and send the customer an acknowledgement in their language.

Appointment emails sent from Agenda (confirmation, proposal, decline, reschedule, cancellation, reminder) go through a **transactional outbox** (`outbox` table): the email is queued in the same database transaction as the appointment change, then delivered immediately and, if that fails, retried by the cron job. Production setup: `docs/DEPLOYMENT.md`.

## Hostinger environment variables (set by the owner, never committed)

In hPanel go to **Websites → glowbydilek.nl → (Node.js app) → Environment variables** (or *Deployments → Settings*), add the following, then **rebuild/redeploy**. Hostinger injects these at build and runtime and stores them encrypted.

| Name | Value |
| --- | --- |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `hello@glowbydilek.nl` |
| `SMTP_PASS` | *the mailbox password of hello@glowbydilek.nl* (secret) |
| `MAIL_TO` | `hello@glowbydilek.nl` (optional; defaults to `SMTP_USER`) |
| `MAIL_FROM_NAME` | `Glow by Dilek` (optional) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | *(optional, later)* e.g. `31612345678`: digits only, country code, no leading 0 |

- These values follow Hostinger's documented Hostinger Email settings: outgoing server `smtp.hostinger.com`, SSL on port **465**. If encryption problems occur, use port **587** with `SMTP_SECURE=false` (STARTTLS). Log in with the **full email address** and mailbox password. Check *Emails → Configuration settings* in hPanel for your account's exact server, because it can differ by location.
- Do **not** paste the password into chat, email or GitHub. Enter it only in Hostinger's environment-variable screen.
- The mailbox, MX/SPF/DKIM records and DNS do **not** need to change. Mail is sent *from* `hello@glowbydilek.nl` through its own SMTP server, so existing SPF/DKIM records apply.

## Behaviour

| Situation | Visitor sees | Server |
| --- | --- | --- |
| Success | Thank-you message; appointment requests say they are **not yet confirmed** | Notification to `MAIL_TO` (Reply-To = customer) plus acknowledgement to the customer |
| SMTP variables missing | "Form temporarily unavailable — email hello@glowbydilek.nl" | Logs a configuration error (503) |
| SMTP login/send fails | "Something went wrong — email hello@glowbydilek.nl" | Logs the error without credentials (502) |
| Acknowledgement fails | Success, plus a note that the confirmation email could not be sent | Inquiry still delivered |
| Invalid input | Inline field errors; focus moves to the first error | 422 with field codes |
| Security check missing / failed / expired | Message to redo the check; the typed data is kept | 403 `challenge` (nothing sent) |
| Same request sent twice | "This request has already been received" | 409 `duplicate` (nothing sent) |
| Too many requests | "Please try again in a few minutes" | 429 with `Retry-After` |

## Spam and abuse protection

Full details and Hostinger settings: `docs/SECURITY.md`.

- **Cloudflare Turnstile** on every public form, verified **server-side** (Siteverify) before any email is sent. Missing, invalid, expired, reused, wrong-hostname and wrong-action tokens are rejected. On a failed or expired check the visitor keeps everything they typed and can simply retry.
- Server-side validation (shared with the browser): length limits, email and phone formats, allowed treatments, and a date from today up to one year ahead.
- A hidden **honeypot** field, a **minimum fill time** (3 seconds, measured in the browser) and a link-spam check. Bots get a fake success and no email is sent.
- **Same-origin** check, JSON-only requests and a 12 KB body limit.
- **Rate limits** (stored in the database, hashed keys): 5 per 10 minutes per IP and form, 3 per hour per email address, 40 per 10 minutes for the whole site.
- **Duplicate detection:** the same submission is accepted once per 24 hours (409 "already received"); the button is also locked while a request is in flight.
- Newlines are stripped from single-line fields (no header injection), all values are HTML-escaped in emails, Reply-To is set as a structured address.
- Logs contain error codes only — never names, email addresses, messages, IPs or tokens.

## The request workflow (no automatic confirmation)

1. The visitor sends a request (preferred date/time, or an exact free time when online booking is on). It is stored as **"aanvraag" (pending approval)**; the visitor's acknowledgement clearly says it is **not yet confirmed**. Dilek also gets an email.
2. In **Agenda → Aanvragen**, Dilek approves, proposes another time, or declines, optionally with a personal note.
3. The customer receives the matching email. Practical location details (Agenda → Instellingen, private) are only inserted in **confirmation, reschedule and reminder** emails, never on the website or in the request acknowledgement.
4. Before an approved appointment, a **reminder** is sent (default 24 hours before; setting in Agenda). Cancelled or moved appointments never receive a stale reminder.

### Outbox behaviour

| State | Meaning |
| --- | --- |
| `pending` | Queued, will be sent now or by the next cron run |
| `sending` | Being sent (claimed atomically, so two processes never send the same email) |
| `sent` | Accepted by the SMTP server |
| `failed` | Gave up after 6 attempts (retries after 1, 5, 15, 60, 240 and 720 minutes) — visible on the appointment and the admin overview, with **Opnieuw versturen** |
| `cancelled` | No longer relevant (e.g. reminder of a cancelled appointment) |

Every email has a deduplication key, so retries, double clicks and repeated cron runs never send the same email twice.

### Editable templates

**Admin → E-mails** holds the Dutch and English text of each customer email (request received, confirmed, proposed, declined, rescheduled, cancelled, reminder). Placeholders such as `{{firstName}}`, `{{date}}` and `{{time}}` are filled in automatically. Saving is refused when a required placeholder is missing, an unknown placeholder is used, or braces are unbalanced, so a broken template can never be sent. Customer input is always HTML-escaped. The original text can be restored at any time.

Password-reset emails are deliberately **not** editable and **not** queued: they are sent directly and expire after 15 minutes.

## Verification status

- **Mailbox:** `hello@glowbydilek.nl` exists and is active. This was confirmed read-only through the connected Hostinger Mail integration on 31 October 2026. That integration can also be used to confirm that a live test message has arrived.

- Tested end to end against a local SMTP server that requires authentication: notifications, acknowledgements, Reply-To, Dutch/English content, appointment emails from Agenda, outbox retries and deduplication, reminders, the password-reset email, the failure paths and the spam protections all behave as described.
- **Not yet tested against the real Hostinger SMTP server.** This needs `SMTP_PASS` and the other variables to be configured in Hostinger. Until then, **live email delivery, password recovery and reminders are unverified.** After deploying: request a password reset for hello@glowbydilek.nl, send one test message through each form with your own address, and check that everything arrives.
