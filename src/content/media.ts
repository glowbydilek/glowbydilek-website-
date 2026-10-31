import type { Locale } from "@/i18n/config";

/**
 * Photography registry.
 *
 * Each slot maps to optimised WebP files in public/images/photos/
 * (`<file>-<width>.webp`). Originals live in assets/photos/ and are converted
 * with `npm run photos`. Every photo records its source and license in
 * `credit` and in docs/PHOTOGRAPHY.md.
 *
 * Rules: licensed photos (or original AI images) only; people in stock or AI
 * photos are models — never presented as Dilek, staff or clients; nothing
 * explicit; no before/after claims.
 */
export type PhotoId =
  | "hero"
  | "editorial-portrait"
  | "zone-face"
  | "zone-body"
  | "zone-intimate"
  | "botanical"
  | "materials"
  | "aftercare"
  | "experience"
  | "contact"
  | "interior";

export type Photo = {
  id: PhotoId;
  /** Base file name in public/images/photos (set once the photo is added). */
  file?: string;
  /** Intrinsic width / height. */
  aspect: number;
  alt: Record<Locale, string>;
  brief: string;
  credit?: string;
  /** CSS object-position, e.g. "50% 30%". */
  focus?: string;
};

export const photoWidths = [640, 1024, 1600, 2200] as const;

export const photos: Record<PhotoId, Photo> = {
  hero: {
    id: "hero",
    aspect: 4 / 5,
    alt: {
      nl: "Portret van een vrouw met een stralende, natuurlijke huid in zacht daglicht",
      en: "Portrait of a woman with radiant, natural skin in soft daylight",
    },
    brief: "Premium editorial beauty portrait, adult woman, natural skin texture, soft daylight, neutral/green-toned setting.",
  },
  "editorial-portrait": {
    id: "editorial-portrait",
    aspect: 4 / 5,
    alt: {
      nl: "Vrouw met een verzorgde huid en natuurlijke make-up",
      en: "Woman with cared-for skin and natural makeup",
    },
    brief: "Second editorial portrait, different model and skin tone, calm and natural.",
  },
  "zone-face": {
    id: "zone-face",
    aspect: 4 / 5,
    alt: { nl: "Close-up van verzorgde wenkbrauwen en een gladde gezichtshuid", en: "Close-up of groomed brows and smooth facial skin" },
    brief: "Face close-up with natural brows; facial waxing category.",
  },
  "zone-body": {
    id: "zone-body",
    aspect: 4 / 5,
    alt: { nl: "Gladde huid van benen in warm daglicht", en: "Smooth skin on legs in warm daylight" },
    brief: "Tasteful crop of smooth legs or arms; body waxing category.",
  },
  "zone-intimate": {
    id: "zone-intimate",
    aspect: 4 / 5,
    alt: { nl: "Zachte handdoeken en natuurlijke verzorgingsproducten", en: "Soft towels and natural care products" },
    brief: "Discreet still life (no body) for the bikini & intimate category.",
  },
  botanical: {
    id: "botanical",
    aspect: 3 / 2,
    alt: { nl: "Botanisch stilleven met groene bladeren en verzorgingsproducten", en: "Botanical still life with green leaves and care products" },
    brief: "Luxury botanical beauty still life.",
  },
  materials: {
    id: "materials",
    aspect: 4 / 5,
    alt: { nl: "Schone behandelmaterialen klaar voor een waxbehandeling", en: "Clean treatment materials ready for a waxing treatment" },
    brief: "Waxing materials/treatment setup, clean and orderly.",
  },
  aftercare: {
    id: "aftercare",
    aspect: 4 / 5,
    alt: { nl: "Verzorgende huidolie en crème voor de nazorg", en: "Soothing skin oil and cream for aftercare" },
    brief: "Preparation & aftercare products.",
  },
  experience: {
    id: "experience",
    aspect: 3 / 2,
    alt: { nl: "Een rustige, lichte behandelruimte met natuurlijke materialen", en: "A calm, light treatment space with natural materials" },
    brief: "Appointment experience: calm treatment room/towels.",
  },
  contact: {
    id: "contact",
    aspect: 4 / 5,
    alt: { nl: "Bloemen en natuurlijke materialen in zacht licht", en: "Flowers and natural materials in soft light" },
    brief: "Editorial image for the contact page.",
  },
  interior: {
    id: "interior",
    aspect: 4 / 5,
    alt: { nl: "Detail van een sereen interieur met groen en natuurlijk licht", en: "Detail of a serene interior with greenery and natural light" },
    brief: "Interior/nature detail.",
  },
};

export function photoSrcSet(photo: Photo): string | undefined {
  if (!photo.file) return undefined;
  return photoWidths.map((w) => `/images/photos/${photo.file}-${w}.webp ${w}w`).join(", ");
}

export function hasPhoto(id: PhotoId): boolean {
  return Boolean(photos[id].file);
}
