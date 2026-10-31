# Photography: shot list and rules

The redesign is built around **9 photo slots**. Until a real photo is added, each slot shows a designed brand panel (warm gradient + logo watermark). These panels are **not** finished photography.

> **Status: no photos have been added yet.** The build environment used for the redesign could not reach image libraries or generate images. All 9 slots below still need images.

## How to add a photo

1. Save the original (JPG/PNG, at least 2400 px on the long side) as `assets/photos/<slot-id>.jpg`.
2. Run `npm run photos`. This creates WebP files at 640, 960, 1440 and 1920 px in `public/images/photos/`.
3. In `src/content/media.ts`, set `file: "<slot-id>"` and fill in `credit` (license, photographer or AI tool).
4. Run `npm run build`, check the page and commit.

## Rules

- Use only properly licensed photos (your own shoot, a paid stock license, or a free license that allows commercial use such as the Unsplash or Pexels license), or original AI-generated images whose terms allow commercial use.
- **AI-generated people must never be presented as Dilek, staff or real clients.**
- **`dilek-portrait` must be a real photo of Dilek.** Until one exists, the About page shows "Portret van Dilek volgt binnenkort".
- No before/after results, nothing sexualised, no distorted hands or faces, no plastic-looking skin.
- Use a different model for each slot where people appear, with diverse adult skin tones.
- Palette: warm ivory, champagne, beige and soft nude. Light: warm, natural, soft.

## Shot list

| Slot id | Used on | Ratio | Brief |
| --- | --- | --- | --- |
| `hero-portrait` | Home hero | 4:5 | Editorial beauty portrait, adult woman (25–40), shoulders up, bare shoulders with an ivory towel or linen, natural makeup, real skin texture, warm window light, ivory/champagne background. Calm and confident. |
| `hero-detail` | Home hero (inset), Contact, About | 1:1 | Close-up of shoulder, collarbone or forearm with smooth skin, a hand gently touching the skin, warm nude tones. Different model. |
| `zone-face` | Home, Waxing (face) | 4:5 | Three-quarter close-up of a face with defined natural brows, eyes relaxed or closed, soft makeup. Deeper skin tone. |
| `zone-body` | Home, Waxing hero and body section | 4:5 | Elegant crop of smooth legs or arms on ivory linen, natural light, non-sexual. |
| `zone-intimate` | Home, Waxing (bikini) | 4:5 | Still life with **no body**: folded towels, robe, wooden spatulas, soft plant shadow. Discretion and calm. |
| `hygiene` | Home (why us), Booking hero | 4:5 | Clean treatment setup: wax heater, disposable spatulas, gloves, cleanser bottles without readable brands. |
| `aftercare` | Home (care), Prices hero | 1:1 | Unbranded amber/glass bottles, cream texture, soft shadows, champagne tones. |
| `atmosphere` | Home (Dilek section), About hero | 16:9 | Calm treatment-space detail: linen, daylight, vase or candle, ivory/blush. No people. |
| `dilek-portrait` | About | 4:5 | **Real** portrait of Dilek, natural and warm, soft daylight, ivory or beige background. |

## Example prompt for AI-generated slots (not for `dilek-portrait`)

> Photorealistic editorial beauty photograph, adult woman in her thirties with natural visible skin texture and subtle makeup, bare shoulders wrapped in an ivory linen towel, soft warm window light, ivory and champagne background, calm confident expression, shallow depth of field, shot on 85mm, high-end skincare campaign aesthetic, no text, no logos.

Change the age, skin tone and framing per slot, and always check hands, eyes, ears and skin for artefacts before use.
