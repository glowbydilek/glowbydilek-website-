import type { Locale } from "@/i18n/config";
import { currentSnapshot } from "@/lib/cms/current";

/**
 * Photography registry.
 *
 * Each slot maps to optimised WebP files in public/images/photos/
 * (`<file>-<width>.webp`). Originals live in assets/photos/ and are converted
 * with `npm run photos`. Every photo records its source and license in
 * `credit` and in docs/PHOTOGRAPHY.md.
 *
 * Rules: licensed photos (or original AI images) only; people in stock or AI
 * photos are models — never presented as Dilek, staff or clients; stock
 * interiors are never presented as the actual studio; nothing explicit; no
 * before/after claims. Current set: Adobe Stock free collection, see
 * docs/PHOTOGRAPHY.md for IDs and licence details.
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
  | "interior"
  | "treatments-hero"
  | "portrait-soft"
  | "linen"
  | "dropper"
  | "vase";

export type Photo = {
  id: PhotoId;
  /** Base file name in public/images/photos (set once the photo is added). */
  file?: string;
  /** Intrinsic width / height. */
  aspect: number;
  alt: Record<Locale, string>;
  brief: string;
  credit?: string;
  /**
   * Focal point (CSS object-position) per breakpoint, so faces and products
   * are never cut off. `mobile` applies below 1024px, `desktop` from 1024px.
   * Set these per photo once the real image is added.
   */
  focus?: { mobile?: string; desktop?: string };
};

export const photoWidths = [640, 1024, 1600, 2200] as const;

export const photos: Record<PhotoId, Photo> = {
  hero: {
    id: "hero",
    file: "hero",
    aspect: 1571 / 1963,
    focus: { mobile: "50% 30%", desktop: "50% 30%" },
    alt: {
      nl: "Portret van een vrouw met een stralende, verzorgde huid tegen een lichte achtergrond",
      en: "Portrait of a woman with radiant, well-cared-for skin against a light background",
    },
    brief: "Editorial beauty portrait (model).",
    credit: "Adobe Stock #810843299 — Adobe Stock (free collection), Standard License",
  },
  "editorial-portrait": {
    id: "editorial-portrait",
    file: "editorial-portrait",
    aspect: 2356 / 1571,
    focus: { mobile: "50% 25%", desktop: "50% 25%" },
    alt: {
      nl: "Lachende vrouw met een gladde, natuurlijke huid tegen een warme bruine achtergrond",
      en: "Smiling woman with smooth, natural skin against a warm brown background",
    },
    brief: "Second editorial portrait (model), warm tones.",
    credit: "Adobe Stock #210591319 — Adobe Stock (free collection), Standard License",
  },
  "zone-face": {
    id: "zone-face",
    file: "zone-face",
    aspect: 1256 / 1571,
    focus: { mobile: "50% 35%", desktop: "50% 35%" },
    alt: {
      nl: "Schoonheidsspecialiste met handschoenen brengt wax aan op een wenkbrauw",
      en: "Beautician wearing gloves applying wax to an eyebrow",
    },
    brief: "Facial (brow) waxing in progress; cropped to the treatment.",
    credit: "Adobe Stock #473675468 — Adobe Stock (free collection), Standard License",
  },
  "zone-body": {
    id: "zone-body",
    file: "zone-body",
    aspect: 2356 / 1571,
    focus: { mobile: "68% 55%", desktop: "62% 55%" },
    alt: {
      nl: "Gladde benen op een behandelbank met wit laken",
      en: "Smooth legs on a treatment couch with a white sheet",
    },
    brief: "Body waxing category: smooth legs on a treatment couch.",
    credit: "Adobe Stock #461751709 — Adobe Stock (free collection), Standard License",
  },
  "zone-intimate": {
    id: "zone-intimate",
    file: "zone-intimate",
    aspect: 2688 / 1536,
    focus: { mobile: "52% 55%", desktop: "52% 55%" },
    alt: {
      nl: "Opgerolde witte handdoeken, een brandende kaars en eucalyptus",
      en: "Rolled white towels, a lit candle and eucalyptus",
    },
    brief: "Discreet still life (no body) for the bikini & intimate category.",
    credit: "Adobe Stock #1883849843 — Adobe Stock (free collection), Standard License",
  },
  botanical: {
    id: "botanical",
    file: "botanical",
    aspect: 2356 / 1571,
    focus: { mobile: "50% 50%", desktop: "50% 50%" },
    alt: {
      nl: "Verzorgingsproducten tussen eucalyptustakken in zacht licht",
      en: "Care products between eucalyptus branches in soft light",
    },
    brief: "Botanical beauty still life.",
    credit: "Adobe Stock #487138394 — Adobe Stock (free collection), Standard License",
  },
  materials: {
    id: "materials",
    file: "materials",
    aspect: 2355 / 1571,
    focus: { mobile: "55% 40%", desktop: "55% 40%" },
    alt: {
      nl: "Warme wax druipt van een houten spatel in een waxverwarmer",
      en: "Warm wax dripping from a wooden spatula into a wax heater",
    },
    brief: "Professional waxing materials.",
    credit: "Adobe Stock #410407763 — Adobe Stock (free collection), Standard License",
  },
  aftercare: {
    id: "aftercare",
    file: "aftercare",
    aspect: 1566 / 2363,
    focus: { mobile: "50% 50%", desktop: "50% 50%" },
    alt: {
      nl: "Amberkleurig flesje met druppelaar naast droogbloemen",
      en: "Amber dropper bottle beside dried pampas grass",
    },
    brief: "Preparation & aftercare products.",
    credit: "Adobe Stock #470172095 — Adobe Stock (free collection), Standard License",
  },
  experience: {
    id: "experience",
    file: "experience",
    aspect: 2373 / 1559,
    focus: { mobile: "55% 62%", desktop: "50% 55%" },
    alt: {
      nl: "Lichte behandelruimte met een opgemaakte behandelbank bij het raam",
      en: "Light treatment room with a made-up treatment couch by the window",
    },
    brief: "Appointment experience: calm treatment room (stock photo, not the actual studio).",
    credit: "Adobe Stock #475998587 — Adobe Stock (free collection), Standard License",
  },
  contact: {
    id: "contact",
    file: "contact",
    aspect: 1666 / 2221,
    focus: { mobile: "50% 50%", desktop: "50% 50%" },
    alt: {
      nl: "Keramische vaas met droogbloemen en zachte schaduwen",
      en: "Ceramic vase with dried flowers and soft shadows",
    },
    brief: "Editorial still life for contact.",
    credit: "Adobe Stock #423935121 — Adobe Stock (free collection), Standard License",
  },
  interior: {
    id: "interior",
    file: "interior",
    aspect: 1571 / 2355,
    focus: { mobile: "45% 45%", desktop: "45% 45%" },
    alt: {
      nl: "Droogbloemen in een amberkleurige vaas tegen een warme muur",
      en: "Dried flowers in an amber vase against a warm wall",
    },
    brief: "Interior/nature detail (stock photo, not the actual studio).",
    credit: "Adobe Stock #402582095 — Adobe Stock (free collection), Standard License",
  },
  "treatments-hero": {
    id: "treatments-hero",
    file: "treatments-hero",
    aspect: 2356 / 1571,
    focus: { mobile: "62% 55%", desktop: "58% 55%" },
    alt: {
      nl: "Vrouw in een witte badjas strijkt met een veer over haar gladde benen",
      en: "Woman in a white robe brushing a feather over her smooth legs",
    },
    brief: "Treatments page hero (model).",
    credit: "Adobe Stock #513816117 — Adobe Stock (free collection), Standard License",
  },
  "portrait-soft": {
    id: "portrait-soft",
    file: "portrait-soft",
    aspect: 2356 / 1571,
    focus: { mobile: "22% 35%", desktop: "20% 35%" },
    alt: {
      nl: "Vrouw met een gladde, verzorgde huid raakt zacht haar kaaklijn aan",
      en: "Woman with smooth, well-cared-for skin gently touching her jawline",
    },
    brief: "Soft beauty portrait (model) for facial treatment pages. Not Dilek.",
    credit: "Adobe Stock #469983189 — Adobe Stock (free collection), Standard License",
  },
  linen: {
    id: "linen",
    file: "linen",
    aspect: 3041 / 1217,
    focus: { mobile: "45% 50%", desktop: "50% 50%" },
    alt: {
      nl: "Linnen handdoeken en een houten ladder in zacht daglicht",
      en: "Linen towels and a wooden ladder in soft daylight",
    },
    brief: "Calm linen still life for preparation and intimate pages (mood image, not the actual location).",
    credit: "Adobe Stock #471323214 — Adobe Stock (free collection), Standard License",
  },
  dropper: {
    id: "dropper",
    file: "dropper",
    aspect: 2356 / 1571,
    focus: { mobile: "62% 50%", desktop: "60% 50%" },
    alt: {
      nl: "Amberkleurig flesje met druppelaar naast een grasaar op een lichte achtergrond",
      en: "Amber dropper bottle next to a blade of grass on a light background",
    },
    brief: "Aftercare still life.",
    credit: "Adobe Stock #350923403 — Adobe Stock (free collection), Standard License",
  },
  vase: {
    id: "vase",
    file: "vase",
    aspect: 2336 / 1584,
    focus: { mobile: "28% 60%", desktop: "25% 60%" },
    alt: {
      nl: "Keramische vaas met droogbloemen op een lichte tafel",
      en: "Ceramic vase with dried flowers on a light table",
    },
    brief: "Quiet still life for FAQ and info pages.",
    credit: "Adobe Stock #468279647 — Adobe Stock (free collection), Standard License",
  },
};

export function photoSrcSet(photo: Photo): string | undefined {
  if (!photo.file) return undefined;
  return photoWidths.map((w) => `/images/photos/${photo.file}-${w}.webp ${w}w`).join(", ");
}

export const MEDIA_WIDTHS = [640, 1024, 1600] as const;

/**
 * The photo actually shown for a slot: the owner's media-library choice
 * (CMS) if set, otherwise the built-in licensed photo.
 */
export function resolvePhoto(id: PhotoId): { src: string; srcSet: string; aspect: number; alt: Record<Locale, string>; focus: { mobile: string; desktop: string } } | null {
  const o = currentSnapshot().photos.get(id);
  if (o) {
    return {
      src: `/media/${o.mediaId}/1600`,
      srcSet: MEDIA_WIDTHS.map((w) => `/media/${o.mediaId}/${w} ${w}w`).join(", "),
      aspect: o.width / o.height,
      alt: { nl: o.altNl, en: o.altEn },
      focus: { mobile: o.focusMobile, desktop: o.focusDesktop },
    };
  }
  const p = photos[id];
  const srcSet = photoSrcSet(p);
  if (!p.file || !srcSet) return null;
  return {
    src: `/images/photos/${p.file}-1600.webp`,
    srcSet,
    aspect: p.aspect,
    alt: p.alt,
    focus: { mobile: p.focus?.mobile ?? "50% 40%", desktop: p.focus?.desktop ?? p.focus?.mobile ?? "50% 40%" },
  };
}

export function hasPhoto(id: PhotoId): boolean {
  return Boolean(photos[id].file) || currentSnapshot().photos.has(id);
}
