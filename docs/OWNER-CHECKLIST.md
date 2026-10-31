# Owner input checklist

These items cannot be completed from the codebase without the owner's facts, assets or credentials. Nothing below has been invented on the website.

## Required before publishing the redesign

- [x] **Photography.** 11 licensed Adobe Stock photos are in place (see `docs/PHOTOGRAPHY.md`). Optional later: a real portrait of Dilek and real photos of the studio.
- [ ] **SMTP environment variables in Hostinger** (see `docs/EMAIL.md`), followed by one live test of each form.
- [ ] **Approval: statements that describe Dilek or her way of working.** These are written in good faith but are **not verified facts**. Please confirm, edit or remove each one (files: `src/i18n/dictionaries/nl.ts` and `en.ts`):

  | # | Statement (NL) | Where |
  | --- | --- | --- |
  | 1 | "Ik heb Glow by Dilek opgericht omdat ik geloof dat waxen meer aandacht verdient…" | Home, "Hoi, ik ben Dilek" |
  | 2 | Quote: "Jouw comfort en vertrouwen gaan bij mij voor alles." | Home |
  | 3 | Quote: "Ik werk liever met minder klanten en meer aandacht." | About |
  | 4 | About story: "met één wens…", "een werkwijze die elke keer hetzelfde is" | About |
  | 5 | "Eén klant tegelijk" / "Geen wachtkamer" | Home hero, standards, FAQ |
  | 6 | "Verse materialen voor iedere klant" | Standards |
  | 7 | "Afspraken worden ruim ingepland. Je hoeft je nooit gehaast te voelen." | About, approach |
  | 8 | "Dilek vertelt wat ze gaat doen voordat ze het doet" / "leest elk bericht zelf" | Standards, Contact |
  | 9 | "Is waxen niet verstandig voor je huid, dan zeg ik dat — ook als we moeten verzetten" | About |
  | 10 | "Behandelingen vinden plaats op afspraak, vanuit huis" | Site-wide |
  | 11 | Tagline "Professional Waxing" (English in the logo) | Logo |
- [ ] **Privacy statement review** (`privacy` in both dictionaries). Have it checked if needed. The site does not claim formal GDPR certification.

## Optional / when available

- [ ] Confirmed **prices and durations**: `src/content/treatments.ts`, then set `pricesPublished = true`.
- [ ] A **real portrait of Dilek** (never a stock or AI person).
- [ ] **WhatsApp number**: `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- [ ] **City or region** for local SEO: `siteConfig.contact.region` in `src/content/site.ts`. Do not publish the home address.
- [ ] **Instagram handle**: `siteConfig.contact.instagram`.
- [ ] **Google Search Console:** verify `https://glowbydilek.nl` (DNS TXT or HTML tag), then submit `https://glowbydilek.nl/sitemap.xml`.
- [ ] **Google Business Profile** (optional): only possible as a "service-area business" with the address hidden, given the home-based studio.
- [ ] **Tagline language.** The approved logo says "Professional Waxing". If an all-Dutch tagline is preferred, change `TAGLINE` in `scripts/brand/generate-logos.py` and run `npm run brand:logos`.
