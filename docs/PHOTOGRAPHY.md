# Photography

**Status: 16 photo slots, all filled** with licensed photos from the **Adobe Stock free collection** (licensed on 31 October 2026 through the connected Adobe account, downloaded at ~2400 px).

**Review for the service-page rebuild (October 2026).** The existing 12 slots and their 48 WebP files were reviewed again: none were weak enough to replace (no watermarks, no bad crops at the current focal points, all on-palette). Instead, **4 slots were added** for the new category, treatment and guide pages so the same image is not repeated on every page. They come from assets that had already been licensed in the same session but were not used yet — no new licences or paid services were needed. Unsplash could not be used (the connected account's email is unconfirmed); Firefly / Figma image generation was not used (no AI people, and paid credits would be required).

## Licence

- Adobe Stock **Standard License**, which covers free-collection assets. It allows commercial use on websites and social media without attribution. (Adobe Stock licence terms: unlimited web views; no resale of the image as a stand-alone file; no use in trademarks or logos; no sensitive or defamatory use of the models.)
- **Models are not Dilek, staff or clients.** No stock person is presented as Dilek. The About page uses interiors and still lifes only.
- **Interiors are not the actual studio.** The treatment-room photo (`experience`) carries a visible "Sfeerbeeld / Mood image" label.
- No watermarked previews, no Unsplash+ content and no AI-generated people are used.
- Licences are recorded in the Adobe account that performed them, for the asset IDs below.

## Inventory

| Slot | Adobe Stock ID | Original title (Adobe) | Used on | Edits |
| --- | --- | --- | --- | --- |
| `hero` | 810843299 | Beautiful young woman with flawless skin and elegant pose… | Home hero | 4:5 crop from the top |
| `editorial-portrait` | 210591319 | Beauty portrait of attractive African American young woman with perfect skin and natural make up | Home: statement | — |
| `zone-face` | 473675468 | Removing eyebrows with hot wax | Home index (Gezicht), Waxing: face | 4:5 crop around the face |
| `zone-body` | 461751709 | Beautiful legs of a woman on a couch in a cosmetology salon | Home index (Lichaam), Waxing: body | — |
| `treatments-hero` | 513816117 | Young Black Woman Touching Her Smooth Skin On Legs With Feather | Waxing hero | — |
| `zone-intimate` | 1883849843 | Spa still life | Home index (Bikini), Waxing: bikini | — |
| `botanical` | 487138394 | Cosmetic bottle containers… with green herbal leaves | About: story | — |
| `materials` | 410407763 | Yellow hot liquid wax for depilation on a wooden stick | Home: standards, Booking aside | — |
| `aftercare` | 470172095 | Essential oil or serum and dry pampas herbs on a natural white podium | Prices hero | — |
| `experience` | 475998587 | Interior of new modern beautician's office… | Closing band, Booking hero (labelled "Sfeerbeeld") | — |
| `contact` | 423935121 | Round stylish ceramic vase with dried flower lagurus casting shadows | Contact hero, About: vision | — |
| `interior` | 402582095 | Composition of dried flowers and herbs in a glass vase on a beige wall background | About hero, Home: meet Dilek | — |
| `portrait-soft` | 469983189 | Beauty portrait, woman touching her jawline (model) | Upper lip page | Focal point left |
| `linen` | 471323214 | Linen towels on a wooden ladder, bathroom still life | Preparation page (labelled "Sfeerbeeld"), Brazilian page | — |
| `dropper` | 350923403 | Amber dropper bottle with a grass stem on white | Aftercare page | — |
| `vase` | 468279647 | Ceramic vase with dried flowers on a table | FAQ page, Back page | — |

### Where each treatment page takes its image

Eyebrows `zone-face` · Upper lip `portrait-soft` · Chin `editorial-portrait` · Full face `hero` · Underarms `aftercare` · Half arms `materials` · Full arms `botanical` · Half legs `zone-body` · Full legs `treatments-hero` · Back `vase` · Bikini line `zone-intimate` · Brazilian `linen` · Hollywood `contact`. Intimate pages deliberately use still lifes only — no bodies.

Alt text is written per slot in Dutch and English and describes the actual photo content (`src/content/media.ts`).

## Files

- **Optimised:** `public/images/photos/<slot>-{640,1024,1600,2200}.webp`, 64 files. Sizes are chosen via `srcset`. The hero image loads with high priority; the others are lazy-loaded.
- **Originals:** not committed (`assets/photos/*.jpg` is in `.gitignore`). Re-download them from Adobe Stock using the IDs above when needed.
- **Focal points:** set per slot and breakpoint in `src/content/media.ts` (`focus.mobile` / `focus.desktop`).

## Replacing or adding a photo

1. Save the original (≥ 2400 px) as `assets/photos/<slot>.jpg`.
2. Run `npm run photos` (creates the WebP sizes).
3. Update `src/content/media.ts`: `aspect`, `focus`, the NL/EN `alt` and `credit`.
4. Update the inventory table above.

**Recommended later:** a **real portrait of Dilek**, added as a new slot (for example `dilek-portrait`) for the About page and the "Hoi, ik ben Dilek" section. Real photos of the actual treatment space would also strengthen trust; they could replace `experience` and `interior`.
