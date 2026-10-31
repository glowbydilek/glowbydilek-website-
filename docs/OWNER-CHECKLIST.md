# Owner input checklist

These items cannot be completed from the codebase without the owner's facts, assets or credentials. Nothing below has been invented on the website.

## Required before publishing the redesign

- [ ] **Photography.** No photos are in the project yet, because image sources were blocked in the build environment. The site uses deliberate photo-free layouts until photos are added. See `docs/PHOTOGRAPHY.md`.
- [ ] **SMTP environment variables in Hostinger** (see `docs/EMAIL.md`), followed by one live test of each form.
- [ ] **Review the copy written in Dilek's voice.** These texts are phrased in the first person and must be approved or edited by Dilek:
  - Homepage "Hoi, ik ben Dilek" paragraph and quote
  - About page story, quote and "Wat je van mij mag verwachten"
  - Process statements: "één klant tegelijk", "geen wachtkamer", "afspraken worden niet tussendoor gepland", "verse materialen voor iedere klant"
  - File: `src/i18n/dictionaries/nl.ts` and `en.ts`
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
