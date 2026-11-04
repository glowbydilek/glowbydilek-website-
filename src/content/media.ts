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
  | "portrait"
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
  | "linen"
  | "dropper"
  | "vase"
  | "facial"
  | "massage"
  | "bodycare"
  | "massage-body"
  | "massage-head"
  | "massage-face"
  | "massage-hand"
  | "massage-foot"
  | "facial-steam"
  | "wax-legs"
  | "wax-underarm"
  | "wax-lip"
  | "wax-arms"
  | "wax-back";

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
    aspect: 2356 / 1571,
    focus: { mobile: "66% 46%", desktop: "66% 46%" },
    alt: {
      nl: "Een vrouw ligt ontspannen onder een witte handdoek terwijl handen zacht haar schouders masseren",
      en: "A woman lies relaxed under a white towel while hands gently massage her shoulders",
      tr: "Beyaz bir havlunun altında rahatça uzanan bir kadının omuzlarına eller nazikçe masaj yapıyor",
    },
    brief: "Homepage opening image: calm, bright, draped massage (models, not Dilek or a client). Service-led, not a face portrait.",
    credit: "Adobe Stock #361106012 — Adobe Stock (free collection), Standard License",
  },
  portrait: {
    id: "portrait",
    file: "portrait",
    aspect: 1571 / 1963,
    focus: { mobile: "50% 30%", desktop: "50% 30%" },
    alt: {
      nl: "Portret van een vrouw met een stralende, verzorgde huid tegen een lichte achtergrond",
      en: "Portrait of a woman with radiant, well-cared-for skin against a light background",
      tr: "Açık bir arka planın önünde, ışıltılı ve bakımlı cilde sahip bir kadın portresi",
    },
    brief: "Beauty portrait (model) — only on the full-face waxing page; no longer the homepage hero (v14).",
    credit: "Adobe Stock #810843299 — Adobe Stock (free collection), Standard License",
  },
  "zone-face": {
    id: "zone-face",
    file: "zone-face",
    aspect: 2356 / 1571,
    focus: { mobile: "62% 40%", desktop: "60% 40%" },
    alt: {
      nl: "Een waxstrip wordt zacht langs de wenkbrauw van een ontspannen vrouw met gesloten ogen aangebracht",
      en: "A wax strip being gently applied along the eyebrow of a relaxed woman with closed eyes",
      tr: "Gözleri kapalı, rahat bir kadının kaşı boyunca nazikçe ağda bandı uygulanıyor",
    },
    brief: "Facial waxing (brows): bright and soft, no gloves (v14; replaces the darker #473675468). Model, not Dilek or a client.",
    credit: "Adobe Stock #251752039 — Adobe Stock (free collection), Standard License",
  },
  "zone-body": {
    id: "zone-body",
    file: "zone-body",
    aspect: 2356 / 1571,
    focus: { mobile: "68% 55%", desktop: "62% 55%" },
    alt: {
      nl: "Gladde benen op een behandelbank met wit laken",
      en: "Smooth legs on a treatment couch with a white sheet", tr: "Beyaz çarşaflı bakım yatağında pürüzsüz bacaklar",
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
      en: "Rolled white towels, a lit candle and eucalyptus", tr: "Rulo yapılmış beyaz havlular, yanan bir mum ve okaliptüs",
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
      en: "Care products between eucalyptus branches in soft light", tr: "Yumuşak ışıkta okaliptüs dalları arasında bakım ürünleri",
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
      en: "Warm wax dripping from a wooden spatula into a wax heater", tr: "Ahşap spatuladan ağda ısıtıcısına damlayan ılık ağda",
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
      en: "Amber dropper bottle beside dried pampas grass", tr: "Kurutulmuş pampas otunun yanında kehribar renkli damlalıklı şişe",
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
      en: "Light treatment room with a made-up treatment couch by the window", tr: "Pencere kenarında hazırlanmış bir bakım yatağı bulunan aydınlık bir oda",
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
      en: "Ceramic vase with dried flowers and soft shadows", tr: "Kuru çiçekli seramik vazo ve yumuşak gölgeler",
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
      en: "Dried flowers in an amber vase against a warm wall", tr: "Sıcak tonlu bir duvarın önünde kehribar vazoda kuru çiçekler",
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
      en: "Woman in a white robe brushing a feather over her smooth legs", tr: "Beyaz bornozlu bir kadının pürüzsüz bacaklarında tüy gezdirmesi",
    },
    brief: "Treatments page hero (model).",
    credit: "Adobe Stock #513816117 — Adobe Stock (free collection), Standard License",
  },
  linen: {
    id: "linen",
    file: "linen",
    aspect: 3041 / 1217,
    focus: { mobile: "45% 50%", desktop: "50% 50%" },
    alt: {
      nl: "Linnen handdoeken en een houten ladder in zacht daglicht",
      en: "Linen towels and a wooden ladder in soft daylight", tr: "Yumuşak gün ışığında keten havlular ve ahşap merdiven",
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
      en: "Amber dropper bottle next to a blade of grass on a light background", tr: "Açık arka planda bir ot sapının yanında kehribar damlalıklı şişe",
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
      en: "Ceramic vase with dried flowers on a light table", tr: "Açık renkli bir masada kuru çiçekli seramik vazo",
    },
    brief: "Quiet still life for FAQ and info pages.",
    credit: "Adobe Stock #468279647 — Adobe Stock (free collection), Standard License",
  },
  facial: {
    id: "facial",
    file: "facial",
    aspect: 2356 / 1571,
    focus: { mobile: "62% 45%", desktop: "60% 45%" },
    alt: {
      nl: "Kleipoeder in een houten schaaltje op een snijplank, naast een spons en een handdoek",
      en: "Clay powder in a wooden bowl on a board, next to a sponge and a towel", tr: "Tahta kâsede kil tozu, yanında sünger ve havlu",
    },
    brief: "Facial treatments: calm skincare still life (no faces).",
    credit: "Adobe Stock #434690877 — Adobe Stock (free collection), Standard License",
  },
  massage: {
    id: "massage",
    file: "massage",
    aspect: 1571 / 2356,
    focus: { mobile: "40% 70%", desktop: "40% 70%" },
    alt: {
      nl: "Flesje olie naast gestapelde stenen en droog gras op een lichte achtergrond",
      en: "Bottle of oil beside stacked stones and dried grass on a light background", tr: "Açık arka planda üst üste taşlar ve kuru otların yanında yağ şişesi",
    },
    brief: "Massages: quiet oil-and-stone still life (no bodies).",
    credit: "Adobe Stock #468953240 — Adobe Stock (free collection), Standard License",
  },
  bodycare: {
    id: "bodycare",
    file: "bodycare",
    aspect: 2364 / 1565,
    focus: { mobile: "45% 55%", desktop: "45% 55%" },
    alt: {
      nl: "Lichaamsborstel op opgevouwen handdoeken met schaaltjes zout en klei en een aloëplant",
      en: "Body brush on folded towels with bowls of salt and clay and an aloe plant", tr: "Katlanmış havlular üzerinde vücut fırçası, tuz ve kil kâseleri ile aloe bitkisi",
    },
    brief: "Body treatments: towels, brush and bowls (no bodies).",
    credit: "Adobe Stock #242641713 — Adobe Stock (free collection), Standard License",
  },
  "massage-body": {
    id: "massage-body",
    file: "massage-body",
    aspect: 3080 / 2054,
    focus: { mobile: "62% 55%", desktop: "60% 55%" },
    alt: {
      nl: "Vrouw ligt ontspannen op een massagetafel met een handdoek over haar onderrug terwijl haar rug wordt gemasseerd, in daglicht",
      en: "Woman lying relaxed on a massage table with a towel over her lower back while her back is massaged, in daylight",
      tr: "Gün ışığında, belinin altı havluyla örtülü, masaj masasında rahatça uzanan bir kadının sırtına masaj yapılıyor",
    },
    brief: "Full-body relaxation massage: bright daylight, modestly draped (v14; replaces the darker #453749067). Models, not Dilek or a client.",
    credit: "Adobe Stock #645035977 — Adobe Stock (free collection), Standard License",
  },
  "massage-head": {
    id: "massage-head",
    file: "massage-head",
    aspect: 2356 / 1571,
    focus: { mobile: "45% 40%", desktop: "50% 40%" },
    alt: {
      nl: "Handen masseren zacht het hoofd van een vrouw die met gesloten ogen op een handdoek ligt",
      en: "Hands gently massaging the head of a woman lying with closed eyes on a towel",
      tr: "Gözleri kapalı, havlu üzerinde uzanan bir kadının başına nazikçe masaj yapan eller",
    },
    brief: "Head massage: scalp massage, bright and calm. Model, not Dilek or a client.",
    credit: "Adobe Stock #461978663 — Adobe Stock (free collection), Standard License",
  },
  "massage-face": {
    id: "massage-face",
    file: "massage-face",
    aspect: 2356 / 1571,
    focus: { mobile: "45% 45%", desktop: "45% 45%" },
    alt: {
      nl: "Handen van een masseuse masseren het voorhoofd van een vrouw met gesloten ogen",
      en: "A masseuse's hands massaging the forehead of a woman with closed eyes",
      tr: "Bir masözün elleri, gözleri kapalı bir kadının alnına masaj yapıyor",
    },
    brief: "Face massage: gentle hands on the face. Model, not Dilek or a client.",
    credit: "Adobe Stock #626852054 — Adobe Stock (free collection), Standard License",
  },
  "massage-hand": {
    id: "massage-hand",
    file: "massage-hand",
    aspect: 2356 / 1571,
    focus: { mobile: "55% 45%", desktop: "55% 45%" },
    alt: {
      nl: "Close-up van handen die de vingers en hand van een vrouw masseren",
      en: "Close-up of hands massaging a woman's fingers and hand",
      tr: "Bir kadının parmaklarına ve eline masaj yapan ellerin yakın çekimi",
    },
    brief: "Hand massage: close-up of hands (no face).",
    credit: "Adobe Stock #382951621 — Adobe Stock (free collection), Standard License",
  },
  "massage-foot": {
    id: "massage-foot",
    file: "massage-foot",
    aspect: 2356 / 1571,
    focus: { mobile: "55% 60%", desktop: "55% 60%" },
    alt: {
      nl: "Handen masseren een voet die op een opgerolde handdoek rust, in een lichte ruimte met kaarsen",
      en: "Hands massaging a foot resting on a rolled towel, in a bright room with candles",
      tr: "Mumlarla aydınlık bir odada, rulo havlu üzerinde duran bir ayağa masaj yapan eller",
    },
    brief: "Foot massage: feet and hands only (no face).",
    credit: "Adobe Stock #214559198 — Adobe Stock (free collection), Standard License",
  },
  "facial-steam": {
    id: "facial-steam",
    file: "facial-steam",
    aspect: 2500 / 1480,
    focus: { mobile: "62% 55%", desktop: "60% 55%" },
    alt: {
      nl: "Vrouw met haarband en oogpads ligt op een behandelstoel onder een gezichtsstomer",
      en: "Woman with a headband and eye pads lying on a treatment bed under a facial steamer",
      tr: "Saç bandı ve göz pedleriyle bir bakım koltuğunda, yüz buhar makinesinin altında uzanan kadın",
    },
    brief: "Facial care with steam: shows the type of equipment only (not the studio's own device). Model, not Dilek or a client. No ozone or device claims.",
    credit: "Adobe Stock #1218786696 — Adobe Stock (free collection), Standard License",
  },  "wax-legs": {
    id: "wax-legs",
    file: "wax-legs",
    aspect: 2246 / 1647,
    focus: { mobile: "40% 55%", desktop: "40% 55%" },
    alt: {
      nl: "Schoonheidsspecialiste brengt roze wax aan op het onderbeen van een vrouw op een behandeltafel",
      en: "Beautician applying pink wax to the lower leg of a woman on a treatment bed",
      tr: "Bir güzellik uzmanı, bakım masasındaki bir kadının alt bacağına pembe ağda uyguluyor",
    },
    brief: "Leg waxing: wax on the lower leg in a bright room. Models, not Dilek or a client.",
    credit: "Adobe Stock #490022317 — Adobe Stock (free collection), Standard License",
  },
  "wax-underarm": {
    id: "wax-underarm",
    file: "wax-underarm",
    aspect: 2355 / 1571,
    focus: { mobile: "55% 45%", desktop: "55% 45%" },
    alt: {
      nl: "Vrouw ligt ontspannen met een opgeheven arm terwijl er warme wax op de oksel wordt aangebracht",
      en: "Woman lying relaxed with a raised arm while warm wax is applied to the underarm",
      tr: "Kolu yukarıda rahatça uzanan bir kadının koltuk altına ılık ağda sürülüyor",
    },
    brief: "Underarm waxing: bright, calm. Models, not Dilek or a client.",
    credit: "Adobe Stock #486751786 — Adobe Stock (free collection), Standard License",
  },
  "wax-lip": {
    id: "wax-lip",
    file: "wax-lip",
    aspect: 2355 / 1571,
    focus: { mobile: "50% 45%", desktop: "50% 45%" },
    alt: {
      nl: "Wax wordt met een spatel op de bovenlip van een vrouw met gesloten ogen aangebracht",
      en: "Wax being applied with a spatula to the upper lip of a woman with closed eyes",
      tr: "Gözleri kapalı bir kadının üst dudağına spatula ile ağda sürülüyor",
    },
    brief: "Upper lip and chin waxing. Model, not Dilek or a client.",
    credit: "Adobe Stock #624353393 — Adobe Stock (free collection), Standard License",
  },
  "wax-arms": {
    id: "wax-arms",
    file: "wax-arms",
    aspect: 2355 / 1571,
    focus: { mobile: "55% 55%", desktop: "55% 55%" },
    alt: {
      nl: "Schoonheidsspecialiste drukt een waxstrip op de arm van een cliënte, met rozen op de achtergrond",
      en: "Beautician pressing a wax strip onto a client's arm, with roses in the background",
      tr: "Arka planda güllerle, bir güzellik uzmanı müşterisinin koluna ağda bandı bastırıyor",
    },
    brief: "Arm waxing: wax strip on the forearm. Models, not Dilek or a client.",
    credit: "Adobe Stock #231285152 — Adobe Stock (free collection), Standard License",
  },
  "wax-back": {
    id: "wax-back",
    file: "wax-back",
    aspect: 2356 / 1571,
    focus: { mobile: "40% 40%", desktop: "40% 40%" },
    alt: {
      nl: "Waxstrip wordt van de schouder van een vrouw met een handdoek om haar haar verwijderd",
      en: "Wax strip being removed from the shoulder of a woman with a towel in her hair",
      tr: "Saçında havlu olan bir kadının omzundan ağda bandı çekiliyor",
    },
    brief: "Back waxing: shoulder and upper back. Model, not Dilek or a client.",
    credit: "Adobe Stock #115961544 — Adobe Stock (free collection), Standard License",
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
      src: `/media/${o.mediaId}/1600?v=${o.version}`,
      srcSet: MEDIA_WIDTHS.map((w) => `/media/${o.mediaId}/${w}?v=${o.version} ${w}w`).join(", "),
      aspect: o.width / o.height,
      alt: { nl: o.altNl, en: o.altEn, tr: o.altTr || o.altEn },
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
