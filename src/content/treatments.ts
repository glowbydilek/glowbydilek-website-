import { intlTag } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import type { PhotoId } from "./media";
import type { ServiceCategoryId } from "./services";
import type { CategoryId, TreatmentId } from "./slugs";
import { currentSnapshot } from "../lib/cms/current";

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
  id: TreatmentId;
  /** Image used on the treatment's own page. */
  photo: PhotoId;
  name: Localised;
  description: Localised;
  /** Confirmed duration in minutes. */
  durationMinutes?: number;
  /** Confirmed price in euros. */
  price?: { amount: number; from?: boolean };
};

export type TreatmentGroup = {
  id: CategoryId;
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
    name: { nl: "Gezicht", en: "Face", tr: "Yüz" },
    intro: {
      nl: "Gezichtshuid is dun en reageert sneller dan de huid op je lichaam. Daarom wordt hier in kleine delen gewerkt, met een rustige hand en extra oog voor symmetrie en een natuurlijk resultaat.",
      en: "Facial skin is thinner and more reactive than the skin on your body. So we work in small sections, with a steady hand and close attention to symmetry and a natural finish.", tr: "Yüz cildi, vücut cildine göre daha ince ve daha hassastır. Bu yüzden küçük bölümler halinde, sakin bir elle ve simetriye, doğal bir sonuca özen gösterilerek çalışılır.",
    },
    suitable: {
      nl: "Voor wie strakke, natuurlijke wenkbrauwen wil of fijne haartjes op bovenlip, kin of wangen liever kwijt is dan ze te scheren of te epileren.",
      en: "For anyone who wants clean, natural-looking brows, or would rather remove fine hair on the upper lip, chin or cheeks than shave or tweeze it.", tr: "Düzgün ve doğal görünen kaşlar isteyenler ya da üst dudak, çene veya yanaklardaki ince tüyleri tıraş etmek ya da cımbızla almak yerine ağdayla aldırmak isteyenler için.",
    },
    note: {
      nl: "Gebruik je producten met retinol, AHA of BHA? Stop daar minimaal een week van tevoren mee en meld het altijd vooraf.",
      en: "Using products with retinol, AHA or BHA? Stop at least one week beforehand and always mention it in advance.", tr: "Retinol, AHA veya BHA içeren ürünler mi kullanıyorsun? En az bir hafta önceden kullanmayı bırak ve mutlaka önceden belirt.",
    },
    treatments: [
      {
        id: "eyebrows",
        photo: "zone-face",
        name: { nl: "Wenkbrauwen", en: "Eyebrows", tr: "Kaşlar" },
        description: {
          nl: "Wenkbrauwen in een natuurlijke vorm die past bij jouw gezicht en gelaatstrekken.",
          en: "Brows shaped into a natural form that suits your face and features.", tr: "Yüzüne ve yüz hatlarına uyan doğal bir kaş şekli.",
        },
      },
      {
        id: "upper-lip",
        photo: "wax-lip",
        name: { nl: "Bovenlip", en: "Upper lip", tr: "Üst dudak" },
        description: {
          nl: "Snel en nauwkeurig verwijderen van haartjes op de bovenlip, voor een gladde, verzorgde huid.",
          en: "Quick, precise removal of upper lip hair for smooth, polished skin.", tr: "Üst dudaktaki tüylerin hızlı ve özenli şekilde alınması; pürüzsüz, bakımlı bir cilt için.",
        },
      },
      {
        id: "chin",
        photo: "wax-lip",
        name: { nl: "Kin", en: "Chin", tr: "Çene" },
        description: {
          nl: "Een gladde kinpartij, met aandacht voor de gevoelige huid rond de kaaklijn.",
          en: "A smooth chin area, with care for the sensitive skin along the jawline.", tr: "Çene hattındaki hassas cilde özen gösterilerek pürüzsüz bir çene bölgesi.",
        },
      },
      {
        id: "full-face",
        photo: "hero",
        name: { nl: "Volledig gezicht", en: "Full face", tr: "Tüm yüz" },
        description: {
          nl: "Wenkbrauwen, bovenlip, kin en wangen in één rustige, verzorgende behandeling.",
          en: "Brows, upper lip, chin and cheeks in one calm, caring treatment.", tr: "Kaşlar, üst dudak, çene ve yanaklar; tek ve sakin, özenli bir uygulamada.",
        },
      },
    ],
  },
  {
    id: "body",
    category: "waxing",
    photo: "zone-body",
    name: { nl: "Lichaam", en: "Body", tr: "Vücut" },
    intro: {
      nl: "Armen, benen, oksels en rug. Omdat het haar met wortel en al wordt verwijderd, blijft je huid weken glad — zonder de stoppels en scheerirritatie die je van een scheermes kent.",
      en: "Arms, legs, underarms and back. Because the hair is removed from the root, your skin stays smooth for weeks — without the stubble and razor irritation you know from shaving.", tr: "Kollar, bacaklar, koltuk altı ve sırt. Tüyler kökünden alındığı için cildin haftalarca pürüzsüz kalır; tıraştan bildiğin batma ve tahriş olmadan.",
    },
    suitable: {
      nl: "Voor wie het dagelijks of wekelijks scheren beu is, voor een vakantie of speciale gelegenheid, of voor wie gewoon langer een gladde huid wil.",
      en: "For anyone tired of shaving every day or week, ahead of a holiday or special occasion, or simply for longer-lasting smooth skin.", tr: "Her gün ya da her hafta tıraş olmaktan yorulanlar için; tatilden veya özel bir günden önce ya da sadece daha uzun süre pürüzsüz bir cilt için.",
    },
    note: {
      nl: "Scrub de huid een dag van tevoren licht, en kom bij voorkeur zonder bodylotion of olie op de te behandelen zone.",
      en: "Lightly exfoliate the day before, and preferably come without body lotion or oil on the area to be treated.", tr: "Bir gün önce cildini hafifçe peelingle; uygulama yapılacak bölgeye tercihen losyon veya yağ sürmeden gel.",
    },
    treatments: [
      {
        id: "underarms",
        photo: "wax-underarm",
        name: { nl: "Oksels", en: "Underarms", tr: "Koltuk altı" },
        description: {
          nl: "Een frisse, gladde huid onder de armen, zonder de stoppels die scheren achterlaat.",
          en: "Fresh, smooth underarms, without the stubble that shaving leaves behind.", tr: "Tıraşın bıraktığı batma olmadan, ferah ve pürüzsüz koltuk altları.",
        },
      },
      {
        id: "half-arms",
        photo: "wax-arms",
        name: { nl: "Onderarmen", en: "Half arms", tr: "Kol (dirsek altı)" },
        description: {
          nl: "Van pols tot elleboog, voor zachte en verzorgde armen.",
          en: "From wrist to elbow, for soft and polished arms.", tr: "Bilekten dirseğe; yumuşak ve bakımlı kollar için.",
        },
      },
      {
        id: "full-arms",
        photo: "wax-arms",
        name: { nl: "Hele armen", en: "Full arms", tr: "Tüm kol" },
        description: {
          nl: "De volledige armen, van pols tot schouder.",
          en: "The complete arms, from wrist to shoulder.", tr: "Bilekten omuza kadar kolların tamamı.",
        },
      },
      {
        id: "half-legs",
        photo: "wax-legs",
        name: { nl: "Onderbenen", en: "Half legs", tr: "Diz altı" },
        description: {
          nl: "Van enkel tot knie, voor zijdezachte benen.",
          en: "From ankle to knee, for silky smooth legs.", tr: "Ayak bileğinden dize; ipeksi pürüzsüz bacaklar için.",
        },
      },
      {
        id: "full-legs",
        photo: "treatments-hero",
        name: { nl: "Hele benen", en: "Full legs", tr: "Tüm bacak" },
        description: {
          nl: "De volledige benen, van enkel tot bovenbeen.",
          en: "The complete legs, from ankle to upper thigh.", tr: "Ayak bileğinden üst bacağa kadar bacakların tamamı.",
        },
      },
      {
        id: "back",
        photo: "wax-back",
        name: { nl: "Rug", en: "Back", tr: "Sırt" },
        description: {
          nl: "Een gladde rug met een grondige en comfortabele behandeling.",
          en: "A smooth back with a thorough and comfortable treatment.", tr: "Özenli ve rahat bir uygulamayla pürüzsüz bir sırt.",
        },
      },
    ],
  },
  {
    id: "intimate",
    category: "waxing",
    photo: "zone-intimate",
    name: { nl: "Bikini & intiem", en: "Bikini & intimate", tr: "Bikini bölgesi" },
    intro: {
      nl: "De meest persoonlijke behandeling vraagt de meeste zorg. Jij bepaalt wat er blijft en wat er weg mag; Dilek werkt discreet, legt vooraf uit wat ze doet en houdt het tempo dat voor jou prettig is.",
      en: "The most personal treatment asks for the most care. You decide what stays and what goes; Dilek works discreetly, explains each step beforehand and keeps a pace that feels right for you.", tr: "En kişisel uygulama en fazla özeni ister. Neyin kalıp neyin alınacağına sen karar verirsin; Dilek gizliliğe saygıyla çalışır, her adımı önceden anlatır ve sana uygun bir tempoda ilerler.",
    },
    suitable: {
      nl: "Voor wie voor het eerst een bikini- of intieme wax overweegt én voor wie dat al jaren doet. Twijfel je tussen bikinilijn, Brazilian of Hollywood? Dat bespreken jullie gewoon vooraf.",
      en: "For first-timers considering a bikini or intimate wax, and for those who have done it for years. Unsure between bikini line, Brazilian or Hollywood? You simply discuss it beforehand.", tr: "Bikini bölgesi ağdasını ilk kez düşünenler için de, yıllardır yaptıranlar için de. Bikini çizgisi, Brezilya ve Hollywood arasında kararsız mısın? Önceden konuşmanız yeterli.",
    },
    note: {
      nl: "Twijfel je welke behandeling bij je past? Bespreek het gerust vooraf of tijdens de afspraak — er is geen vraag te gek.",
      en: "Not sure which treatment suits you? Feel free to discuss it beforehand or during the appointment — no question is too awkward.", tr: "Hangi uygulamanın sana uygun olduğundan emin değil misin? Randevudan önce ya da randevu sırasında rahatça sorabilirsin; hiçbir soru tuhaf değildir.",
    },
    treatments: [
      {
        id: "bikini-line",
        photo: "zone-intimate",
        name: { nl: "Bikinilijn", en: "Bikini line", tr: "Bikini çizgisi" },
        description: {
          nl: "Een nette lijn langs de randen van je bikini of ondergoed.",
          en: "A neat line along the edges of your bikini or underwear.", tr: "Bikinin veya iç çamaşırının kenarları boyunca düzgün bir hat.",
        },
      },
      {
        id: "brazilian",
        photo: "linen",
        name: { nl: "Brazilian", en: "Brazilian", tr: "Brezilya ağdası" },
        description: {
          nl: "Bijna alles verwijderd, met een smal strookje of klein driehoekje naar wens.",
          en: "Almost everything removed, leaving a small strip or triangle as you prefer.", tr: "Neredeyse tamamı alınır; isteğine göre ince bir şerit ya da küçük bir üçgen bırakılır.",
        },
      },
      {
        id: "hollywood",
        photo: "contact",
        name: { nl: "Hollywood", en: "Hollywood", tr: "Hollywood ağdası" },
        description: {
          nl: "Volledig glad, voor een frisse en verzorgde look.",
          en: "Completely smooth, for a fresh and polished feel.", tr: "Tamamen pürüzsüz; ferah ve bakımlı bir his için.",
        },
      },
    ],
  },
];

export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-IE" : intlTag(locale), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function allTreatments(): Treatment[] {
  return treatmentGroups.flatMap((g) => g.treatments);
}

export function findGroup(id: CategoryId): TreatmentGroup {
  return treatmentGroups.find((g) => g.id === id)!;
}

export function findTreatmentById(id: TreatmentId): { treatment: Treatment; group: TreatmentGroup } {
  for (const group of treatmentGroups) {
    const treatment = group.treatments.find((t) => t.id === id);
    if (treatment) return { treatment, group };
  }
  throw new Error(`Unknown treatment ${id}`);
}

/**
 * Treatment data as the owner manages it in the admin (prices, durations,
 * visibility, names), falling back to the built-in catalogue. Prices and
 * durations only appear once the owner has entered them.
 */
export function liveTreatment(id: TreatmentId): {
  name: Localised;
  description: Localised;
  price: { amount: number; from: boolean } | null;
  durationMinutes: number | null;
  visible: boolean;
  featured: boolean;
} {
  const base = findTreatmentById(id).treatment;
  const t = currentSnapshot().treatments.get(id);
  if (!t) {
    return {
      name: base.name,
      description: base.description,
      price: pricesPublished && base.price ? { amount: base.price.amount, from: Boolean(base.price.from) } : null,
      durationMinutes: pricesPublished ? (base.durationMinutes ?? null) : null,
      visible: true,
      featured: false,
    };
  }
  return {
    name: { nl: t.nameNl || base.name.nl, en: t.nameEn || base.name.en, tr: t.nameTr || base.name.tr },
    description: { nl: t.descriptionNl || base.description.nl, en: t.descriptionEn || base.description.en, tr: t.descriptionTr || base.description.tr },
    price: t.priceCents != null ? { amount: t.priceCents / 100, from: t.priceFrom } : null,
    durationMinutes: t.durationMinutes,
    visible: t.visible && t.active,
    featured: t.featured,
  };
}

/** True when at least one visible treatment has a confirmed price. */
export function anyPricePublished(): boolean {
  return allTreatments().some((t) => {
    const l = liveTreatment(t.id);
    return l.visible && l.price !== null;
  });
}
