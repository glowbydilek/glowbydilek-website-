# Photography

**Status: 29 photo slots, all filled** (v14 audit of every slot on 4 November 2026, see the first section) (3 added on 1 November 2026 for the new facial, body and massage categories) with licensed photos from the **Adobe Stock free collection** (licensed on 31 October 2026 through the connected Adobe account, downloaded at ~2400 px).

**Review for the service-page rebuild (October 2026).** The existing 12 slots and their 48 WebP files were reviewed again: none were weak enough to replace (no watermarks, no bad crops at the current focal points, all on-palette). Instead, **4 slots were added** for the new category, treatment and guide pages so the same image is not repeated on every page. They come from assets that had already been licensed in the same session but were not used yet — no new licences or paid services were needed. Unsplash could not be used (the connected account's email is unconfirmed); Firefly / Figma image generation was not used (no AI people, and paid credits would be required).



## v14 slot-by-slot audit (4 November 2026)

Every slot was reviewed at all four sizes (640/1024/1600/2200 WebP, 5.2 MB in total) on a contact sheet and in the live pages at 320–1440 px. Criteria: relevance to the real service on that page, natural anatomy, white/rose/champagne light, crop at every breakpoint, alt text in NL/EN/TR, licence. Nothing implies a person is Dilek, a client or her studio.

| Slot | Shows | Used on (published unless marked) | Verdict |
| --- | --- | --- | --- |
| `hero` | Draped shoulder massage, bright (#361106012) | Homepage opening image | **Replaced v14** — was a large face portrait that filled the phone screen |
| `portrait` | Beauty portrait (model, #810843299) | Volledig gezicht (full-face waxing) only | Moved from `hero`; kept for one face page |
| `massage-body` | Back massage, daylight, towel over lower back (#645035977) | Massages section, Ontspanningsmassage | **Replaced v14** — #453749067 was dark/warm and off-palette |
| `massage-face` / `-head` / `-hand` / `-foot` | The specific massage | The four massage pages | Keep — service-specific, on palette |
| `facial-steam` | Facial steamer, eye pads (#1218786696) | Gezichtsbehandeling met stoom; **now also the Gezichtsbehandelingen section card** | Keep; equipment type only, not the studio's device, no ozone claim |
| `facial` | Clay powder still life | Draft facial items only | Kept for drafts; no longer the published section card |
| `zone-face` | Wax strip on a brow, bright, no gloves (#251752039) | Gezicht zone card, Wenkbrauwen | **Replaced v14** — #473675468 had black gloves on a dark background |
| `wax-lip` | Wax on the upper lip (close-up) | Bovenlip, Kin (detail pages only) | Keep on detail pages; the zone card now uses the softer `zone-face` |
| `wax-underarm` / `wax-arms` / `wax-legs` / `wax-back` | The specific zone | Oksels; Onderarmen, Hele armen; Onderbenen; Rug | Keep |
| `zone-body` | Legs on a couch | Lichaam zone card | Keep |
| `treatments-hero` | Smooth legs with a feather | Waxing section/overview hero, Hele benen | Keep |
| `zone-intimate` | Towels and candle still life | Bikini & intiem zone, Bikinilijn | Keep — intimate pages deliberately show no bodies |
| `linen` | Linen towels still life | Brazilian; Voorbereiding guide | Keep (no bodies) |
| `materials` | Warm wax pot and spatula | Home standards, booking aside; **now Hollywood** | Hollywood moved from the unrelated vase (`contact`) to the wax pot |
| `experience` | Treatment room (labelled "Sfeerbeeld") | Closing band, booking hero, guides | Keep, always with the mood-image label |
| `interior`, `contact`, `vase` | Dried flowers / vases | About, Contact, FAQ (decorative, not treatment pages) | Keep as page atmosphere only; no treatment uses them any more |
| `botanical`, `dropper`, `aftercare`, `bodycare` | Product still lifes | About, aftercare guide, prices hero; drafts | Keep (guides and drafts) |
| `massage` | Oil and stones still life | Not referenced by the built-in catalogue | Unused; files kept (licensed, CMS can still select it). Candidate for removal after owner OK |

**Licensed on 3–4 November 2026, not used** (free collection, no cost; kept out of the site after review): #160905856, #123114656, #198178896 (facial masks — would suggest mask treatments that are still drafts), #210392565, #226351954 (undraped / looking into the camera), #329588113 (dark), #279766205 (black gloves). These are **alternative options** for the owner, e.g. #160905856 as a facial-care opening image once facial treatments are confirmed.

## v13 service-specific photos (3 November 2026)

The v13 brief asked for images that show the actual service instead of repeated bottles, stones and vases. Eleven assets were licensed from the **Adobe Stock free collection** (Standard License, no cost; the licence call returned no price quote). Every person is a stock model — never Dilek, staff or a client. The facial-steamer photo shows the type of equipment only: it is not the studio's own device and makes no ozone or device claim.

| Slot | Adobe Stock ID | Shows | Used on |
| --- | --- | --- | --- |
| `massage-body` | ~~453749067~~ → 645035977 (v14) | Back massage, woman relaxing | Massages section, Ontspanningsmassage (hele lichaam) |
| `massage-head` | 461978663 | Scalp massage | Hoofdmassage |
| `massage-face` | 626852054 | Female masseuse's hands on the forehead | Gezichtsmassage |
| `massage-hand` | 382951621 | Hand and finger massage (no face) | Handmassage |
| `massage-foot` | 214559198 | Foot massage on a towel (no face) | Voetmassage |
| `facial-steam` | 1218786696 | Woman with eye pads under a facial steamer | Gezichtsbehandeling met stoom |
| `wax-legs` | 490022317 | Wax on the lower leg | Onderbenen |
| `wax-underarm` | 486751786 | Warm wax on the underarm | Oksels |
| `wax-lip` | 624353393 | Wax on the upper lip | Bovenlip, Kin |
| `wax-arms` | 231285152 | Wax strip on the arm | Onderarmen, Hele armen |
| `wax-back` | 115961544 | Wax strip on the shoulder | Rug |

Bikini, Brazilian and Hollywood pages deliberately keep still lifes (no bodies). The `massage` still life (#468953240) is no longer referenced by the built-in catalogue but stays available in Admin → Media. Originals are in `assets/photos/` (not committed).

## Licence

- Adobe Stock **Standard License**, which covers free-collection assets. It allows commercial use on websites and social media without attribution. (Adobe Stock licence terms: unlimited web views; no resale of the image as a stand-alone file; no use in trademarks or logos; no sensitive or defamatory use of the models.)
- **Models are not Dilek, staff or clients.** No stock person is presented as Dilek. The About page uses interiors and still lifes only.
- **Interiors are not the actual studio.** The treatment-room photo (`experience`) carries a visible "Sfeerbeeld / Mood image" label.
- No watermarked previews, no Unsplash+ content and no AI-generated people are used.
- Licences are recorded in the Adobe account that performed them, for the asset IDs below.

## Inventory

| Slot | Adobe Stock ID | Original title (Adobe) | Used on | Edits |
| --- | --- | --- | --- | --- |
| `hero` | ~~810843299~~ → 361106012 (v14) | v14: draped shoulder massage (the portrait moved to `portrait`) | Home hero | 3:2 on phones, arched 4:5 from tablet |
| `portrait` | 810843299 | Beautiful young woman with flawless skin and elegant pose… | Volledig gezicht | 4:5 crop from the top |
| `zone-face` | ~~473675468~~ → 251752039 (v14) | Wax strip on the brow, bright | Home index (Gezicht), Waxing: face, Wenkbrauwen | 3:2 |
| `zone-body` | 461751709 | Beautiful legs of a woman on a couch in a cosmetology salon | Home index (Lichaam), Waxing: body | — |
| `treatments-hero` | 513816117 | Young Black Woman Touching Her Smooth Skin On Legs With Feather | Waxing hero | — |
| `zone-intimate` | 1883849843 | Spa still life | Home index (Bikini), Waxing: bikini | — |
| `botanical` | 487138394 | Cosmetic bottle containers… with green herbal leaves | About: story | — |
| `materials` | 410407763 | Yellow hot liquid wax for depilation on a wooden stick | Home: standards, Booking aside | — |
| `aftercare` | 470172095 | Essential oil or serum and dry pampas herbs on a natural white podium | Prices hero | — |
| `experience` | 475998587 | Interior of new modern beautician's office… | Closing band, Booking hero (labelled "Sfeerbeeld") | — |
| `contact` | 423935121 | Round stylish ceramic vase with dried flower lagurus casting shadows | Contact hero, About: vision | — |
| `interior` | 402582095 | Composition of dried flowers and herbs in a glass vase on a beige wall background | About hero, Home: meet Dilek | — |
| `linen` | 471323214 | Linen towels on a wooden ladder, bathroom still life | Preparation page (labelled "Sfeerbeeld"), Brazilian page | — |
| `dropper` | 350923403 | Amber dropper bottle with a grass stem on white | Aftercare page | — |
| `vase` | 468279647 | Ceramic vase with dried flowers on a table | FAQ page, Back page | — |
| `facial` | 434690877 | Ghassoul in wooden bowl on chopping board with sponge and towel | Gezichtsbehandelingen (hero), Gezichtsmasker, Gezichtspeeling, Glow Face Trio | — |
| `massage` | 468953240 | Spa composition with bottle of organic cosmetic oil | Massages (hero), Ontspanningsmassage | — |
| `bodycare` | 242641713 | Closeup of salt and clay for bath. Towels and body brush | Lichaamsbehandelingen (hero), Lichaamspakking | — |

**Licensed on 1 November 2026 but not used** (free collection; off-palette or off-subject after review): #479834634 (green clay on mint), #793954787 (rice water on pink), #266751135 (mostly empty white spa set), #1880475900 (alum stones). They are not on the site.

The new categories are still drafts; their photos only appear once the owner publishes them. Real photos of the owner's own products and room would be even better and can replace these slots in Admin → Media.

### Where each treatment page takes its image

Eyebrows `zone-face` · Upper lip `wax-lip` · Chin `wax-lip` · Full face `portrait` · Underarms `wax-underarm` · Half arms `wax-arms` · Full arms `wax-arms` · Half legs `wax-legs` · Full legs `treatments-hero` · Back `wax-back` · Bikini line `zone-intimate` · Brazilian `linen` · Hollywood `materials`. Intimate pages deliberately use still lifes only — no bodies.

**Direction (2026 identity):** one portrait (the calm `hero` image) on the homepage; everywhere else still lifes, textures and materials in warm natural light. The two additional model portraits were removed (November 2026) so that no page suggests a person is Dilek or a client, and the image style stays consistent.

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
