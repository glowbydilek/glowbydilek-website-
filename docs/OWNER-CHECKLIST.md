# Owner input checklist

These items cannot be completed from the codebase without the owner's facts, assets, credentials or decisions. Most text, photos and prices can now be changed by the owner in `/admin` without a developer. Nothing below has been invented on the website. Nothing on this list is shown publicly.

## Location policy (privacy)

The website never names or hints at where treatments take place. Everywhere (pages, footer, FAQs, emails, metadata, structured data) it uses only:

- NL: "Behandelingen zijn uitsluitend op afspraak. Praktische locatiegegevens worden na bevestiging persoonlijk gedeeld."
- EN: "Treatments are available by appointment only. Practical location details are shared personally after confirmation."

There is no address, city, district, service area, map or walk-in information. `tests/content.test.ts` fails the build checks if location wording that suggests a home setting is reintroduced. Keep `siteConfig.contact.address` and `region` empty unless you decide otherwise.

## Required before publishing

- [ ] **Hostinger setup** (`docs/DEPLOYMENT.md`): production database, environment variables (database, `AUTH_SECRET`, `CRON_SECRET`, SMTP), cron job.
- [ ] **Rotate the Turnstile secret** (it appeared in a screenshot) and set the production keys **before** the build (`docs/SECURITY.md`). Without them the public forms show "temporarily unavailable" in production.
- [ ] **First login** via "Wachtwoord vergeten?", then enable **two-step verification** and store the recovery codes offline.
- [ ] **Working hours, breaks and days off** in Ajanda → Werktijden.
- [ ] **Private location details** for confirmation emails in Ajanda → Instellingen (never shown on the website).
- [ ] **Retention period** in the privacy statement: the text now proposes "no longer than 24 months after the last appointment or contact". Confirm or change it. Anonymising old customers is a manual action in Ajanda → Klanten.
- [ ] **Approval: statements about Dilek and her way of working.** Written in good faith but **not verified**. Please confirm, edit or remove (files: `src/i18n/dictionaries/*.ts`):

  | # | Statement (NL) | Where |
  | --- | --- | --- |
  | 1 | "Ik heb Glow by Dilek opgericht omdat ik geloof dat waxen meer aandacht verdient…" | Home |
  | 2 | Quote: "Jouw comfort en vertrouwen gaan bij mij voor alles." | Home |
  | 3 | Quote: "Ik werk liever met minder klanten en meer aandacht." | About |
  | 4 | About story: "met één wens…", "een werkwijze die elke keer hetzelfde is" | About |
  | 5 | "Eén klant tegelijk", "Geen drukte en geen haast" | Home, standards, intimate pages |
  | 6 | "Verse materialen voor iedere klant" | Standards |
  | 7 | "Afspraken worden ruim ingepland." | About |
  | 8 | "Dilek vertelt wat ze gaat doen voordat ze het doet" / "leest elk bericht zelf" | Standards, Contact, process |
  | 9 | "Is waxen niet verstandig voor je huid, dan zeg ik dat" | About |
  | 10 | Tagline "Professional Waxing" (English in the logo) | Logo |

- [ ] **Approval: treatment and category page details** (`src/content/copy/*.ts`). These describe common professional practice; please confirm they match how Dilek works, or tell us what to change:

  | # | Detail | Pages |
  | --- | --- | --- |
  | T1 | Stray hairs are tidied with tweezers where needed | Face, eyebrows, chin |
  | T2 | Skin is "lightly powdered where needed" before body waxing | Body |
  | T3 | The client receives a mirror at the end of a brow treatment | Eyebrows |
  | T4 | Which zones are included: full face includes cheeks and sides of the face (not nose/ears); half arms up to just above the elbow; full legs exclude the bikini line; back = lower back to shoulders | Treatment pages |
  | T5 | Hollywood includes the area between the buttocks; for Brazilian it is "agreed beforehand" | Brazilian, Hollywood |
  | T6 | Feet/toes and backs of hands "on request" | Half legs, half arms |
  | T7 | Period policy: "let us know; you can choose to reschedule" | Intimate pages, FAQ |
  | T8 | Suggested rhythms (every 3–5 / 4–6 weeks) and "smooth for 3–5 weeks" | Several |
  | T9 | Cancellation: "let us know as soon as possible" (no formal policy published) | Process |
  | T10 | Who the treatments are for (no gender restrictions stated) | All |
  | T11 | Wax type is deliberately not named (warm/hard/strip) | All |

- [ ] **Privacy statement review** (Admin → Pagina's → Privacy, or `privacy` in both dictionaries), including storage at Hostinger, appointment emails and reminders, retention, Cloudflare Turnstile and abuse prevention. A legal review is recommended; the text is written in good faith and does not guarantee legal compliance.

## Optional / when available

- [ ] Confirmed **prices and durations**: Admin → Behandelingen (price, duration, buffer, visible, bookable online). Nothing is invented: until a price is entered the site shows "op aanvraag". Online booking only works for treatments with a confirmed duration.
- [ ] Decide whether to switch on **online booking** (Ajanda → Instellingen). Requests always stay "pending" until you approve them.
- [ ] Review the **email texts** in Admin → E-mails (NL and EN).
- [ ] A **real portrait of Dilek** (never a stock or AI person).
- [ ] **WhatsApp number**: `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- [ ] **Instagram handle**: `siteConfig.contact.instagram`.
- [ ] **Google Search Console:** verify `https://glowbydilek.nl`, then submit `https://glowbydilek.nl/sitemap.xml`.
- [ ] **Google Business Profile** (optional): only as a service-area business with the address hidden — consistent with the location policy above.
- [ ] **Tagline language.** If an all-Dutch tagline is preferred, change `TAGLINE` in `scripts/brand/generate-logos.py` and run `npm run brand:logos`.
