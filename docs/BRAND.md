# Brand identity

## Logo

This is a vector recreation of the **owner-approved concept**: a champagne-gold "Glow" in a classical serif, a handwritten "by Dilek", a lotus symbol with a sweeping leaf and a drop of light, and the tagline "Professional Waxing".

- **Construction.** The lotus is original vector geometry (`scripts/brand/lotus.py`). All lettering is converted to outlines from SIL Open Font License fonts, which permit logo use: Cormorant Garamond for "Glow", Parisienne for "by Dilek" and Jost for the tagline. The SVGs contain only `<path>` elements, with no embedded raster images and no font dependency.
- **What was left out of the reference.** The photographic backdrop, lighting, metallic bevels and shadows were presentation effects only. The production logo uses flat brand colours.
- **Regenerating.** Run `npm run brand:logos` (needs Python `fonttools` + `brotli`, and Playwright for the PNGs).

### Files (`public/brand/`)

| File | Use |
| --- | --- |
| `logo-horizontal.svg` | Light backgrounds: documents, email signature, wide placements |
| `logo-horizontal-dark.svg` | Dark backgrounds: the website footer |
| `logo-wordmark.svg` | Without tagline; the website header uses this form, because the tagline is not legible at header size |
| `logo-stacked.svg` / `logo-stacked-dark.svg` | Emblem with arcs: signage, social posts, cards, hero brand art |
| `logo-symbol.svg` / `logo-symbol-dark.svg` | Symbol alone: decorative accents, watermark |
| `favicon.svg`, `src/app/icon.svg`, `src/app/apple-icon.png`, `icon-512.png` | Browser and home-screen icons (filled symbol for small sizes) |
| `profile-icon.svg` / `profile-icon.png` (1080×1080) | Instagram, Google Business Profile, WhatsApp |

The React components `Logo` and `LogoSymbol` (`src/components/brand/Logo.tsx`) render the same generated path data (`logoData.ts`).

**Minimum sizes:** the horizontal logo 120 px wide without tagline (240 px with tagline); the favicon symbol 16 px. **Clear space:** at least the height of the "G" around the logo.

## Colours

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `ivory` (Warm Ivory) | `#F8F5EF` | Main canvas | — |
| `ivory-50` | `#FCFAF6` | Raised surfaces, form fields | — |
| `nude` (Soft Nude) | `#E9D5C7` | Accent surfaces | — |
| `nude-light` | `#F4E9E1` | Tinted sections | — |
| `stone` (Stone Beige) | `#DDD2C4` | Rules, dividers | — |
| `stone-light` | `#ECE5DC` | Quiet sections | — |
| `gold` (Champagne Gold) | `#C4A16F` | Symbol, rules, accents (not body text) | decorative |
| `gold-deep` | `#765930` | Small gold text and italic headline accents | 5.9:1 on ivory, ≥ 4.5:1 on nude, stone and nude-light |
| `charcoal` (Elegant Charcoal) | `#292724` | Headings, buttons, the single dark band | 14.6:1 |
| `charcoal-soft` | `#4A443F` | Body copy | 8.9:1 |
| `muted` | `#635B54` | Secondary text | ≥ 4.6:1 on every light surface |

The previous deep-green palette has been removed entirely.

## Typography

- **Cormorant Garamond:** display headings, with italic accents in `gold-deep`.
- **Jost:** body text. Labels and buttons are set in uppercase with wide tracking.
- **Parisienne:** used only as Dilek's handwritten signature (matching "by Dilek" in the logo).

## Design system

| Area | Approach |
| --- | --- |
| Spacing | CSS variables: `--space-section` (3.5–6.5 rem), `--space-section-tight`, `--space-block`, plus `--header-safe` so content and images never sit under the fixed header |
| Radii | `--radius-card` (1.5 rem) and `--radius-media` (1.75 rem) |
| Surfaces | Ivory, then ivory-50 / nude-light / stone-light for rhythm; one charcoal band per page |
| Motion | Subtle reveals and image unmasking, no parallax on heroes, all disabled under `prefers-reduced-motion` |

## Voice

Calm, precise and personal; Dutch first, with independently written English. Use "waxen" and "harsen" in Dutch. No superlatives, no invented claims.
