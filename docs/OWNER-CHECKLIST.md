# Owner input checklist

These items cannot be completed from the codebase without the owner's facts, assets or credentials. Nothing below has been invented on the website. Nothing on this list is shown publicly.

## Location policy (privacy)

The website never names or hints at where treatments take place. Everywhere (pages, footer, FAQs, emails, metadata, structured data) it uses only:

- NL: "Behandelingen zijn uitsluitend op afspraak. Praktische locatiegegevens worden na bevestiging persoonlijk gedeeld."
- EN: "Treatments are available by appointment only. Practical location details are shared personally after confirmation."

There is no address, city, district, service area, map or walk-in information. `tests/content.test.ts` fails the build checks if location wording that suggests a home setting is reintroduced. Keep `siteConfig.contact.address` and `region` empty unless you decide otherwise.

## Required before publishing

- [ ] **SMTP environment variables in Hostinger** (`docs/EMAIL.md`), followed by one live test of each form.
- [ ] **Cloudflare Turnstile keys** (`docs/SECURITY.md`): create the widget, set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Hostinger, rebuild. Until then the official test keys are active (no real protection).
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

- [ ] **Privacy statement review** (`privacy` in both dictionaries), including the new Cloudflare Turnstile and abuse-prevention sections.

## Optional / when available

- [ ] Confirmed **prices and durations**: `src/content/treatments.ts`, then set `pricesPublished = true` (they then appear on the prices page, treatment pages and in structured data).
- [ ] A **real portrait of Dilek** (never a stock or AI person).
- [ ] **WhatsApp number**: `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- [ ] **Instagram handle**: `siteConfig.contact.instagram`.
- [ ] **Google Search Console:** verify `https://glowbydilek.nl`, then submit `https://glowbydilek.nl/sitemap.xml`.
- [ ] **Google Business Profile** (optional): only as a service-area business with the address hidden — consistent with the location policy above.
- [ ] **Tagline language.** If an all-Dutch tagline is preferred, change `TAGLINE` in `scripts/brand/generate-logos.py` and run `npm run brand:logos`.
