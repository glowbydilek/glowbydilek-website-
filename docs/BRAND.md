# Glow by Dilek — brand identity (2026)

The previous ivory / nude / champagne-gold identity with the lotus symbol and script signature was retired in November 2026 at the owner's request. This document describes its replacement. The live reference page is `/merkidentiteit` (not indexed).

## Direction

**Warm, editorial, quietly confident.** A small European skin studio rather than a "luxury" template: generous but purposeful white space, a strong typographic voice, one signature colour, one ornament, and photography in a single style.

What to avoid (and why the old site felt assembled): rows of identical rounded cards, decorative lines everywhere, gold as a luxury shorthand, a script signature, several different stock models, and sections that all share the same layout.

## Logo

| Variant | File (`public/brand/`) | Use |
| --- | --- | --- |
| Inline | `glow-by-dilek-logo-inline(.svg / -light.svg)` | Header and small sizes: "by Dilek" in italic, readable on a phone |
| Horizontal | `glow-by-dilek-logo(-light).svg` | Documents, signatures (BY DILEK in tracked caps) |
| Stacked | `glow-by-dilek-logo-stacked(-light).svg` | Footer, social cover, print |
| Monogram | `glow-by-dilek-symbol(-light).svg` | Private areas, small marks |
| App icon | `glow-by-dilek-app-icon.svg`, `icon-192/512.png`, `src/app/icon.svg`, `src/app/apple-icon.png` | Favicon, iPhone home screen |
| Social | `profile-icon.png` (1080²), `og-default.png` (1200×630) | Profile picture, link previews |

- The wordmark "Glow" is set in Newsreader (opsz 72, weight 340) and converted to **vector outlines**: the logo never depends on an installed font.
- **The glint** (a four-point star of light, long vertical rays) sits at the top right of the "w". It is the only ornament of the brand.
- Regenerate everything with `npm run brand:logos` (`scripts/brand/build-logos.cjs`, fonts in `scripts/brand/fonts/` under the SIL Open Font License). Never edit the generated files by hand.
- Clear space: at least the height of the "o" around the logo. Minimum height: 24 px for the inline logo, 40 px for the stacked one.
- Do not recolour outside the palette, stretch, add effects, or place the dark logo on photos without a calm area.

## Colour

| Name | Hex | Token | Use | Contrast |
| --- | --- | --- | --- | --- |
| Porselein | `#F5F0E8` | `paper` | Page background | — |
| Surface | `#FBF8F3` | `surface` | Fields, raised blocks | — |
| Zand | `#EAE1D5` | `sand` | Quiet sections | muted text 4.9:1 |
| Lijn | `#D9CBBA` | `line` | Hairlines | — |
| Espresso | `#221A17` | `ink` | Text, primary buttons, dark sections | 15.1:1 on paper |
| Ink soft | `#45392F` | `ink-soft` | Body copy | 9.9:1 |
| Muted | `#6B5D52` | `muted` | Secondary text | 5.6:1 |
| Hars (Resin) | `#A0461E` | `accent` | Accent, links, glint, accent buttons | 5.5:1 (both ways) |
| Donkere hars | `#86391A` | `accent-deep` | Small accent text | 7.1:1 |
| Gloed (Glow) | `#F0D3B4` | `glow` | Accent on dark backgrounds | 12:1 on ink |
| Zachte gloed | `#F7E8D8` | `glow-soft` | Tinted blocks | — |

On dark backgrounds the accent always switches to **Gloed** (`.on-dark` does this automatically): Resin on Espresso is only 2.8:1.

The owner can adjust every colour in **Admin → Thema & Design**. Changes are validated against these contrast pairs (WCAG AA 4.5:1) and **"Goedgekeurd thema herstellen"** restores this identity in one click.

## Typography

- **Newsreader** (variable, optical size) for headings and display text; italic for the single emphasised phrase in a heading.
- **Instrument Sans** (variable) for text, navigation, buttons and labels.
- Labels ("eyebrows") are tracked caps preceded by a small glint. Buttons and navigation use **sentence case**, never spaced capitals.
- Both fonts are self-hosted via `@fontsource-variable` (no request to Google Fonts).

## Components and layout

- Buttons: `.btn` + `.btn-primary` (espresso), `.btn-accent` (resin), `.btn-outline`; shape follows the theme setting (pill by default).
- Radii are small and editorial (`--radius-media` 6 px, `--radius-card` 12 px); photos are not rounded into blobs.
- Section rhythm via `--space-section` / `--space-section-tight`; owner presets "compact" and "airy".
- Lists and steps use hairlines and the glint, not boxed card grids.
- Icons: thin line icons (1.6 stroke) in the private areas; social icons only when the owner configured a profile.

## Motion — the Glow transition

When a visitor clicks an internal link, a soft amber light blooms from the click point with a small glint, and the next page settles in (≈0.5 s). Navigation is never delayed; new tabs, downloads, hash links, modifier clicks and browser back/forward behave natively; the effect is off for `prefers-reduced-motion` (`src/components/GlowTransition.tsx`).

## Photography

See `docs/PHOTOGRAPHY.md`. One portrait (homepage hero); otherwise still lifes, textures and materials in warm natural light. Never images that suggest Dilek, her workplace, real clients or a home setting.
