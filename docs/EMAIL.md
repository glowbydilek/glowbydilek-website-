# Contact and appointment forms: email setup

Both forms post to server-side endpoints (`/api/contact` and `/api/appointment`). These validate the input, send a notification to the studio mailbox with the customer as **Reply-To**, and send the customer an acknowledgement in their language. Nothing is stored in a database.

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

## Spam and abuse protection

- Server-side validation (shared with the browser): length limits, email and phone formats, allowed treatments, and a date from today up to one year ahead.
- A hidden **honeypot** field, plus a **minimum fill time** (3 seconds). Bots get a fake success and no email is sent.
- **Same-origin** check, JSON-only requests and a 12 KB body limit.
- **Rate limit:** 5 submissions per 10 minutes per IP and form (in memory, per server instance).
- Newlines are stripped from single-line fields (no header injection), and all values are HTML-escaped in emails.

## Verification status

- Tested end to end against a local SMTP server that requires authentication: the notification, acknowledgement, Reply-To, Dutch/English content, the failure paths and the spam protections all behave as described.
- **Not yet tested against the real Hostinger mailbox.** This needs the variables above to be configured. After deploying, send one test message through each form and check that it arrives at hello@glowbydilek.nl and that the acknowledgement reaches the sender.
