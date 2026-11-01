# Analytics, consent and Search Console

## Google Analytics 4 (off until configured)

- Admin → **Analytics & cookies**: enter the GA4 Measurement ID (`G-…`) and switch it on. Without a valid ID nothing is loaded.
- Every visitor first gets a question with two equal choices ("Akkoord" / "Liever niet"). Google Analytics is **only loaded after "Akkoord"**. The choice is stored in the browser and can be changed through "Cookie-instellingen" in the footer.
- Consent Mode: `ad_storage`, `ad_user_data`, `ad_personalization` always denied; Google Signals and ad personalisation off.
- Only whitelisted, non-personal events are sent (`src/lib/analytics/track.ts`):

| Event | When |
| --- | --- |
| `page_view` | Each page (path only, never query strings: those can contain invitation tokens) |
| `view_treatment` | Treatment page viewed |
| `booking_start` | First date chosen in the online booking |
| `booking_submitted` | Booking request (online or request form) accepted |
| `contact_submitted` | Contact message accepted |
| `review_submitted` | Review submitted |
| `cta_booking_click` | Click on any "make an appointment" link (with the page it was on) |

Never sent: names, email addresses, phone numbers, appointment details, health information, invoice data, or anything from `/admin` and `/ajanda`.

**Owner to do in Google Analytics:** accept the data processing terms, set data retention to 2 or 14 months, keep Google Signals off. The privacy statement already describes analytics-with-consent.

## Google Search Console

1. Go to search.google.com/search-console and add the **domain property** `glowbydilek.nl` (DNS verification: Google gives a TXT record; adding it is a DNS change the owner makes — nothing in this project changes DNS), or the **URL-prefix property** `https://glowbydilek.nl/` with the HTML-tag method (ask a developer to add the meta tag; it can be added without other changes).
2. Submit the sitemap: `https://glowbydilek.nl/sitemap.xml`.
3. Check "Pages" after a few days: private routes (`/admin`, `/ajanda`, `/api`) are excluded by robots.txt, `noindex` headers and the sitemap.

## SEO notes

- Canonical and hreflang on every public page (NL default, EN under `/en`), per-page titles/descriptions editable in Admin → SEO, redirects manageable there.
- Reviews are crawlable HTML on `/beoordelingen` and `/en/reviews`. No review structured data is emitted: Google does not show star snippets for reviews a business publishes about itself.
