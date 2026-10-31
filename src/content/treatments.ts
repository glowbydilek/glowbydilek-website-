import type { Locale } from "@/i18n/config";
import type { PhotoId } from "./media";
import type { ServiceCategoryId } from "./services";

/**
 * Treatment catalogue (currently: waxing).
 *
 * Single source of truth for the treatments page, the prices page, the
 * appointment request and (later) the booking system. Every treatment has a
 * stable `id` that the future booking backend will reference.
 *
 * PRICES & DURATIONS: intentionally left empty. Only fill in `price` and
 * `durationMinutes` with figures confirmed by the owner, then set
 * `pricesPublished = true`. Until then the site shows "op aanvraag".
 */
export const pricesPublished: boolean = false;

type Localised = Record<Locale, string>;

export type Treatment = {
  id: string;
  name: Localised;
  description: Localised;
  /** Confirmed duration in minutes. */
  durationMinutes?: number;
  /** Confirmed price in euros. */
  price?: { amount: number; from?: boolean };
};

export type TreatmentGroup = {
  id: "face" | "body" | "intimate";
  category: ServiceCategoryId;
  photo: PhotoId;
  name: Localised;
  intro: Localised;
  /** Who this zone is suitable for (shown on the treatments page). */
  suitable: Localised;
  note: Localised;
  treatments: Treatment[];
};

export const treatmentGroups: TreatmentGroup[] = [
  {
    id: "face",
    category: "waxing",
    photo: "zone-face",
    name: { nl: "Gezicht", en: "Face" },
    intro: {
      nl: "Gezichtshuid is dun en reageert sneller dan de huid op je lichaam. Daarom wordt hier in kleine delen gewerkt, met een rustige hand en extra oog voor symmetrie en een natuurlijk resultaat.",
      en: "Facial skin is thinner and more reactive than the skin on your body. So we work in small sections, with a steady hand and close attention to symmetry and a natural finish.",
    },
    suitable: {
      nl: "Voor wie strakke, natuurlijke wenkbrauwen wil of fijne haartjes op bovenlip, kin of wangen liever kwijt is dan ze te scheren of te epileren.",
      en: "For anyone who wants clean, natural-looking brows, or would rather remove fine hair on the upper lip, chin or cheeks than shave or tweeze it.",
    },
    note: {
      nl: "Gebruik je producten met retinol, AHA of BHA? Stop daar minimaal een week van tevoren mee en meld het altijd vooraf.",
      en: "Using products with retinol, AHA or BHA? Stop at least one week beforehand and always mention it in advance.",
    },
    treatments: [
      {
        id: "eyebrows",
        name: { nl: "Wenkbrauwen", en: "Eyebrows" },
        description: {
          nl: "Wenkbrauwen in een natuurlijke vorm die past bij jouw gezicht en gelaatstrekken.",
          en: "Brows shaped into a natural form that suits your face and features.",
        },
      },
      {
        id: "upper-lip",
        name: { nl: "Bovenlip", en: "Upper lip" },
        description: {
          nl: "Snel en nauwkeurig verwijderen van haartjes op de bovenlip, voor een gladde, verzorgde huid.",
          en: "Quick, precise removal of upper lip hair for smooth, polished skin.",
        },
      },
      {
        id: "chin",
        name: { nl: "Kin", en: "Chin" },
        description: {
          nl: "Een gladde kinpartij, met aandacht voor de gevoelige huid rond de kaaklijn.",
          en: "A smooth chin area, with care for the sensitive skin along the jawline.",
        },
      },
      {
        id: "full-face",
        name: { nl: "Volledig gezicht", en: "Full face" },
        description: {
          nl: "Wenkbrauwen, bovenlip, kin en wangen in één rustige, verzorgende behandeling.",
          en: "Brows, upper lip, chin and cheeks in one calm, caring treatment.",
        },
      },
    ],
  },
  {
    id: "body",
    category: "waxing",
    photo: "zone-body",
    name: { nl: "Lichaam", en: "Body" },
    intro: {
      nl: "Armen, benen, oksels en rug. Omdat het haar met wortel en al wordt verwijderd, blijft je huid weken glad — zonder de stoppels en scheerirritatie die je van een scheermes kent.",
      en: "Arms, legs, underarms and back. Because the hair is removed from the root, your skin stays smooth for weeks — without the stubble and razor irritation you know from shaving.",
    },
    suitable: {
      nl: "Voor wie het dagelijks of wekelijks scheren beu is, voor een vakantie of speciale gelegenheid, of voor wie gewoon langer een gladde huid wil.",
      en: "For anyone tired of shaving every day or week, ahead of a holiday or special occasion, or simply for longer-lasting smooth skin.",
    },
    note: {
      nl: "Scrub de huid een dag van tevoren licht, en kom bij voorkeur zonder bodylotion of olie op de te behandelen zone.",
      en: "Lightly exfoliate the day before, and preferably come without body lotion or oil on the area to be treated.",
    },
    treatments: [
      {
        id: "underarms",
        name: { nl: "Oksels", en: "Underarms" },
        description: {
          nl: "Een frisse, gladde huid onder de armen, zonder de stoppels die scheren achterlaat.",
          en: "Fresh, smooth underarms, without the stubble that shaving leaves behind.",
        },
      },
      {
        id: "half-arms",
        name: { nl: "Onderarmen", en: "Half arms" },
        description: {
          nl: "Van pols tot elleboog, voor zachte en verzorgde armen.",
          en: "From wrist to elbow, for soft and polished arms.",
        },
      },
      {
        id: "full-arms",
        name: { nl: "Hele armen", en: "Full arms" },
        description: {
          nl: "De volledige armen, van pols tot schouder.",
          en: "The complete arms, from wrist to shoulder.",
        },
      },
      {
        id: "half-legs",
        name: { nl: "Onderbenen", en: "Half legs" },
        description: {
          nl: "Van enkel tot knie, voor zijdezachte benen.",
          en: "From ankle to knee, for silky smooth legs.",
        },
      },
      {
        id: "full-legs",
        name: { nl: "Hele benen", en: "Full legs" },
        description: {
          nl: "De volledige benen, van enkel tot bovenbeen.",
          en: "The complete legs, from ankle to upper thigh.",
        },
      },
      {
        id: "back",
        name: { nl: "Rug", en: "Back" },
        description: {
          nl: "Een gladde rug met een grondige en comfortabele behandeling.",
          en: "A smooth back with a thorough and comfortable treatment.",
        },
      },
    ],
  },
  {
    id: "intimate",
    category: "waxing",
    photo: "zone-intimate",
    name: { nl: "Bikini & intiem", en: "Bikini & intimate" },
    intro: {
      nl: "De meest persoonlijke behandeling vraagt de meeste zorg. Jij bepaalt wat er blijft en wat er weg mag; Dilek werkt discreet, legt vooraf uit wat ze doet en houdt het tempo dat voor jou prettig is.",
      en: "The most personal treatment asks for the most care. You decide what stays and what goes; Dilek works discreetly, explains each step beforehand and keeps a pace that feels right for you.",
    },
    suitable: {
      nl: "Voor wie voor het eerst een bikini- of intieme wax overweegt én voor wie dat al jaren doet. Twijfel je tussen bikinilijn, Brazilian of Hollywood? Dat bespreken jullie gewoon vooraf.",
      en: "For first-timers considering a bikini or intimate wax, and for those who have done it for years. Unsure between bikini line, Brazilian or Hollywood? You simply discuss it beforehand.",
    },
    note: {
      nl: "Twijfel je welke behandeling bij je past? Bespreek het gerust vooraf of tijdens de afspraak — er is geen vraag te gek.",
      en: "Not sure which treatment suits you? Feel free to discuss it beforehand or during the appointment — no question is too awkward.",
    },
    treatments: [
      {
        id: "bikini-line",
        name: { nl: "Bikinilijn", en: "Bikini line" },
        description: {
          nl: "Een nette lijn langs de randen van je bikini of ondergoed.",
          en: "A neat line along the edges of your bikini or underwear.",
        },
      },
      {
        id: "brazilian",
        name: { nl: "Brazilian", en: "Brazilian" },
        description: {
          nl: "Bijna alles verwijderd, met een smal strookje of klein driehoekje naar wens.",
          en: "Almost everything removed, leaving a small strip or triangle as you prefer.",
        },
      },
      {
        id: "hollywood",
        name: { nl: "Hollywood", en: "Hollywood" },
        description: {
          nl: "Volledig glad, voor een frisse en verzorgde look.",
          en: "Completely smooth, for a fresh and polished feel.",
        },
      },
    ],
  },
];

export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function allTreatments(): Treatment[] {
  return treatmentGroups.flatMap((g) => g.treatments);
}
