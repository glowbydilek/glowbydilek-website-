import type { Locale } from "@/i18n/config";

/**
 * Treatment & price catalogue.
 *
 * This is the single source of truth for the Treatments page, the Prices page
 * and (later) the booking system. Each treatment has a stable `id` so the
 * future appointment system can reference it.
 *
 * IMPORTANT: prices and durations below are INDICATIVE and must be confirmed
 * by Dilek before launch. While `pricesConfirmed` is false the website shows
 * a clear notice that the prices are indicative.
 */
export const pricesConfirmed = false;

type Localised = Record<Locale, string>;

export type Treatment = {
  id: string;
  name: Localised;
  description: Localised;
  /** Duration in minutes (indicative). */
  durationMinutes: number;
  /** Price in whole euros (indicative). */
  priceEuro: number;
  /** Price starts "from" this amount. */
  fromPrice?: boolean;
};

export type TreatmentCategory = {
  id: "face" | "body" | "intimate";
  name: Localised;
  intro: Localised;
  treatments: Treatment[];
};

export const treatmentCategories: TreatmentCategory[] = [
  {
    id: "face",
    name: { nl: "Gezicht", en: "Face" },
    intro: {
      nl: "Verfijnde behandelingen voor een strak en verzorgd gezicht, met extra aandacht voor de gevoelige huid.",
      en: "Refined treatments for a smooth, polished look, with extra care for delicate facial skin.",
    },
    treatments: [
      {
        id: "eyebrows",
        name: { nl: "Wenkbrauwen in model", en: "Eyebrow shaping" },
        description: {
          nl: "Wenkbrauwen worden in een natuurlijke vorm gebracht die past bij jouw gezicht.",
          en: "Brows shaped into a natural form that complements your features.",
        },
        durationMinutes: 15,
        priceEuro: 15,
      },
      {
        id: "upper-lip",
        name: { nl: "Bovenlip", en: "Upper lip" },
        description: {
          nl: "Snel, zacht en nauwkeurig verwijderen van haartjes op de bovenlip.",
          en: "Quick, gentle and precise removal of upper lip hair.",
        },
        durationMinutes: 10,
        priceEuro: 10,
      },
      {
        id: "chin",
        name: { nl: "Kin", en: "Chin" },
        description: {
          nl: "Een gladde kinpartij met een behandeling die rekening houdt met de gevoelige huid.",
          en: "A smooth chin area with a treatment that respects sensitive skin.",
        },
        durationMinutes: 10,
        priceEuro: 10,
      },
      {
        id: "full-face",
        name: { nl: "Volledig gezicht", en: "Full face" },
        description: {
          nl: "Wenkbrauwen, bovenlip, kin en wangen in één verzorgende behandeling.",
          en: "Brows, upper lip, chin and cheeks in one caring treatment.",
        },
        durationMinutes: 30,
        priceEuro: 35,
      },
    ],
  },
  {
    id: "body",
    name: { nl: "Lichaam", en: "Body" },
    intro: {
      nl: "Langdurig gladde huid op armen, benen en meer — zorgvuldig en hygiënisch uitgevoerd.",
      en: "Long-lasting smooth skin on arms, legs and more — performed carefully and hygienically.",
    },
    treatments: [
      {
        id: "underarms",
        name: { nl: "Oksels", en: "Underarms" },
        description: {
          nl: "Een frisse, gladde huid onder de armen die weken meegaat.",
          en: "Fresh, smooth underarms that last for weeks.",
        },
        durationMinutes: 15,
        priceEuro: 15,
      },
      {
        id: "half-arms",
        name: { nl: "Onderarmen", en: "Half arms" },
        description: {
          nl: "Van pols tot elleboog, voor zachte en verzorgde armen.",
          en: "From wrist to elbow, for soft and polished arms.",
        },
        durationMinutes: 20,
        priceEuro: 20,
      },
      {
        id: "full-arms",
        name: { nl: "Hele armen", en: "Full arms" },
        description: {
          nl: "De volledige armen, van pols tot schouder.",
          en: "The complete arms, from wrist to shoulder.",
        },
        durationMinutes: 30,
        priceEuro: 30,
      },
      {
        id: "half-legs",
        name: { nl: "Onderbenen", en: "Half legs" },
        description: {
          nl: "Van enkel tot knie, voor zijdezachte benen.",
          en: "From ankle to knee, for silky smooth legs.",
        },
        durationMinutes: 30,
        priceEuro: 30,
      },
      {
        id: "full-legs",
        name: { nl: "Hele benen", en: "Full legs" },
        description: {
          nl: "De volledige benen, van enkel tot bovenbeen.",
          en: "The complete legs, from ankle to upper thigh.",
        },
        durationMinutes: 50,
        priceEuro: 50,
      },
      {
        id: "back",
        name: { nl: "Rug", en: "Back" },
        description: {
          nl: "Een gladde rug met een grondige en comfortabele behandeling.",
          en: "A smooth back with a thorough and comfortable treatment.",
        },
        durationMinutes: 30,
        priceEuro: 35,
        fromPrice: true,
      },
    ],
  },
  {
    id: "intimate",
    name: { nl: "Bikini & intiem", en: "Bikini & intimate" },
    intro: {
      nl: "Discreet, respectvol en in alle rust. Jouw comfort en privacy staan altijd voorop.",
      en: "Discreet, respectful and calm. Your comfort and privacy always come first.",
    },
    treatments: [
      {
        id: "bikini-line",
        name: { nl: "Bikinilijn", en: "Bikini line" },
        description: {
          nl: "Een nette lijn langs de randen van je bikini.",
          en: "A neat line along the edges of your bikini.",
        },
        durationMinutes: 20,
        priceEuro: 25,
      },
      {
        id: "brazilian",
        name: { nl: "Brazilian", en: "Brazilian" },
        description: {
          nl: "Bijna alles verwijderd, met een smal strookje of klein driehoekje naar wens.",
          en: "Almost everything removed, leaving a small strip or triangle as you prefer.",
        },
        durationMinutes: 40,
        priceEuro: 40,
      },
      {
        id: "hollywood",
        name: { nl: "Hollywood", en: "Hollywood" },
        description: {
          nl: "Volledig glad, voor een frisse en verzorgde look.",
          en: "Completely smooth, for a fresh and polished feel.",
        },
        durationMinutes: 45,
        priceEuro: 45,
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
  return treatmentCategories.flatMap((c) => c.treatments);
}
