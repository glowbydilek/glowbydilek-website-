# Brand identity

## Logo

Three original concepts were made. All artwork lives in `public/brand/`, and the internal review page is at **`/merkidentiteit`** (not indexed, not linked).

| Concept | Idea | Verdict |
| --- | --- | --- |
| **A — Lumen** (recommended, implemented) | A calligraphic G with thick-thin contrast holding a pearl of light (the "glow"). | Most distinctive and recognisable down to 16 px. Not tied to waxing, so it grows with the business. |
| B — Atelier | An interlaced G/D monogram inside a slim arch (mirror or studio doorway). | Elegant, but fine lines lose strength at small sizes. |
| C — Halo | A radiant ring with a core of light replacing the O in GLOW. | Modern, but abstract and less tied to the name. |

### Files (concept A)

| File | Use |
| --- | --- |
| `logo-horizontal.svg` / `-light.svg` | Website header, documents, email signature |
| `logo-stacked.svg` / `-light.svg` | Social posts, signage, cards |
| `logo-icon.svg` / `-light.svg` / `-gold.svg` | Small spaces, watermarks |
| `favicon.svg`, `src/app/icon.svg`, `src/app/apple-icon.png`, `icon-512.png` | Browser tab, home screen |
| `profile-icon.svg` / `profile-icon.png` (1080×1080) | Instagram, Google Business, WhatsApp |

All logos are pure vector paths (no font needed). To regenerate them after a design change, run `npm run brand:logos`. This needs Python with `fonttools` and `brotli`, plus Playwright for the PNGs.

Clear space: at least the height of the pearl around the logo. Minimum size: icon 16 px, horizontal logo 120 px wide.

## Colours

| Name | Hex | Use |
| --- | --- | --- |
| Warm ivory | `#FAF7F2` | Main background |
| Champagne gold | `#C7A477` | Accents, pearl, details (not for small text) |
| Gold (text) | `#84623A` | Small gold text (meets WCAG AA on ivory) |
| Soft blush | `#EEDCD6` | Soft surfaces |
| Warm nude | `#D8B8A9` | Imagery tones, panels |
| Deep espresso | `#302725` | Text, dark sections, buttons |

## Typography

- **Cormorant Garamond**: headlines, with italic for emphasis ("*en stralend.*").
- **Jost**: body text; buttons and labels in uppercase with wide letter spacing.

Both fonts are self-hosted under the SIL Open Font License, which permits use in logos.

## Tone of voice

Warm, calm, personal and honest. Use "je/jij" in Dutch and "you" in English. Don't make claims that can't be backed up: no invented prices, certifications, reviews or addresses.
