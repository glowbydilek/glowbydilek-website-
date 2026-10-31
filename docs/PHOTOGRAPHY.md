# Photography

> **Status: blocked. No photographs are in the project.**
> The build environment cannot reach any image source: Unsplash, Pexels, Pixabay, Wikimedia and Openverse all return *403 (network policy)*, and no image-generation service is connected. No image files or licences have been invented.
>
> **How the site handles this:** every image position is *adaptive* (`hasPhoto()` in `src/content/media.ts`). Without a registered photo:
> - the homepage hero shows the stacked **logo emblem** as brand art;
> - inner-page heroes become compact **typographic heroes** with the lotus symbol;
> - feature sections switch to **photo-free compositions** (quotes with Dilek's signature, editorial lists, numbered steps).
>
> There are no empty frames and no fake "photo" panels. As soon as a photo is registered, the image-rich layout for that position switches on automatically.

## How a photo is added

1. Save the original (at least 2400 px on the long side) as `assets/photos/<slot-id>.jpg`.
2. Run `npm run photos`. This writes WebP files at 640, 1024, 1600 and 2200 px to `public/images/photos/`.
3. In `src/content/media.ts`, set `file: "<slot-id>"`, `credit: "<photographer> — <source URL> — <license>"` and optionally `focus` (CSS object-position).
4. Record the photo in the credits table below.

## Required photos (11 + generated share image)

| # | Slot id | Used on | Ratio | Direction |
| --- | --- | --- | --- | --- |
| 1 | `hero` | Home hero | 4:5 | Premium editorial beauty portrait, adult woman, natural skin texture, soft daylight, calm confident expression |
| 2 | `editorial-portrait` | Home introduction | 4:5 | Second portrait with a different model and skin tone, natural makeup |
| 3 | `zone-face` | Home + Waxing (face) | 4:5 | Face close-up with natural, groomed brows |
| 4 | `zone-body` | Home + Waxing hero/body | 4:5 | Tasteful crop of smooth legs or arms in warm light |
| 5 | `zone-intimate` | Home + Waxing (bikini) | 4:5 | **Discreet still life, no body**: towels, natural products |
| 6 | `botanical` | Home ritual feature + intro, About | 3:2 | Luxury botanical still life: leaves, natural materials, products |
| 7 | `materials` | Home (why), Booking | 4:5 | Clean waxing or treatment materials, orderly and hygienic |
| 8 | `aftercare` | Home (care), Prices hero | 4:5 | Skincare oil and cream still life |
| 9 | `experience` | Appointment band, Booking hero | 3:2 | Calm treatment room or towels and linen |
| 10 | `contact` | Contact hero, About | 4:5 | Flowers and natural materials in soft light |
| 11 | `interior` | Home (about Dilek), About hero | 4:5 | Serene interior detail with greenery |
| 12 | *(generated)* | Social share | 1200×630 | Rebuilt from the hero photo with `npm run brand:logos` |

## Rules

- Licensed photos only (Unsplash License or Pexels License: free commercial use, no attribution required but recorded here), or original AI images whose terms allow commercial use.
- **Unsplash+ / premium images are not allowed** under the free license. Check this before downloading.
- People in stock or AI photos are **models**. They must never be presented as Dilek, staff or clients. The About page uses mood images only; a **real** portrait of Dilek can be added later.
- Nothing explicit, no before/after claims, no distorted hands or faces.

## Credits

| Slot | Photographer | Source | License |
| --- | --- | --- | --- |
| *(none yet)* | | | |
