import type { Locale } from "@/i18n/config";
import type { TreatmentCopy } from "./types";

/**
 * Waxing zones added from the owner's price list (24 Nov 2026): cheeks and
 * jawline, neck, upper arms, upper legs, belly, chest, décolletage and
 * buttocks. Same facts as the other waxing pages (hair length, preparation,
 * aftercare); no claims beyond them. Prices and durations live in the
 * catalogue (builtin.ts), not in this copy.
 */

type Zone = {
  name: Record<Locale, string>;
  /** Lower-case zone for use inside sentences. */
  lower: Record<Locale, string>;
  area: Record<Locale, string>;
  teaser: Record<Locale, string>;
  faq: Record<Locale, { q: string; a: string }>;
  face?: boolean;
};

export const ZONES: Record<string, Zone> = {
  "cheeks-jaw": {
    face: true,
    name: { nl: "Wangen en kaaklijn waxen", en: "Cheek and jawline waxing", tr: "Yanak ve çene hattı ağdası" },
    lower: { nl: "wangen en kaaklijn", en: "cheeks and jawline", tr: "yanak ve çene hattı" },
    area: {
      nl: "De fijne haartjes op de wangen en langs de kaaklijn, tot onder de oren. Hoe ver het loopt, bespreek je vooraf.",
      en: "The fine hairs on the cheeks and along the jawline, up to below the ears. You agree beforehand how far it goes.",
      tr: "Yanaklardaki ve çene hattı boyunca, kulak altına kadar uzanan ince tüyler. Ne kadar alanın alınacağını önceden konuşursunuz.",
    },
    teaser: {
      nl: "Een gladde, egale huid op wangen en kaaklijn.",
      en: "Smooth, even skin on cheeks and jawline.",
      tr: "Yanak ve çene hattında pürüzsüz, düzgün bir cilt.",
    },
    faq: {
      nl: { q: "Kan ik dit combineren met bovenlip of kin?", a: "Ja. Wil je je hele gezicht laten doen, dan is ‘volledig gezicht’ handig; vermeld je wensen gerust bij je aanvraag." },
      en: { q: "Can I combine this with upper lip or chin?", a: "Yes. If you want your whole face done, ‘full face’ is convenient; just mention your wishes in your request." },
      tr: { q: "Üst dudak veya çeneyle birleştirebilir miyim?", a: "Evet. Tüm yüzünü yaptırmak istiyorsan ‘tüm yüz’ pratik olur; isteklerini talebinde belirtmen yeterli." },
    },
  },
  neck: {
    face: true,
    name: { nl: "Hals waxen", en: "Neck waxing", tr: "Boyun ağdası" },
    lower: { nl: "hals", en: "neck", tr: "boyun" },
    area: {
      nl: "De haartjes aan de voorkant of in de nek, onder de haarlijn. Welke kant en hoe ver, bepaal je samen vooraf.",
      en: "The hairs at the front of the neck or at the nape, below the hairline. You decide together which side and how far.",
      tr: "Boynun ön kısmındaki ya da ense tarafında saç çizgisinin altındaki tüyler. Hangi taraf ve ne kadar olacağına birlikte karar verirsiniz.",
    },
    teaser: { nl: "Een nette, gladde hals of nek.", en: "A neat, smooth neck or nape.", tr: "Düzgün ve pürüzsüz bir boyun ya da ense." },
    faq: {
      nl: { q: "Wordt de haarlijn in de nek netjes gemaakt?", a: "Ja, als je dat wilt. Vooraf spreek je af waar de lijn komt, zodat het natuurlijk blijft." },
      en: { q: "Is the hairline at the nape tidied?", a: "Yes, if you like. You agree beforehand where the line goes, so it stays natural." },
      tr: { q: "Ensedeki saç çizgisi düzeltilir mi?", a: "İstersen evet. Doğal kalması için çizginin nereden geçeceğini önceden konuşursunuz." },
    },
  },
  "upper-arms": {
    name: { nl: "Bovenarmen waxen", en: "Upper arm waxing", tr: "Üst kol ağdası" },
    lower: { nl: "bovenarmen", en: "upper arms", tr: "üst kollar" },
    area: {
      nl: "Van net boven de elleboog tot aan de schouder, rondom de arm. Samen met de onderarmen is het ‘hele armen’.",
      en: "From just above the elbow up to the shoulder, all around the arm. Together with the forearms this is ‘full arms’.",
      tr: "Dirseğin hemen üstünden omza kadar, kolun her tarafı. Ön kollarla birlikte ‘tüm kol’ olur.",
    },
    teaser: { nl: "Zachte bovenarmen, van elleboog tot schouder.", en: "Soft upper arms, from elbow to shoulder.", tr: "Dirsekten omza yumuşak üst kollar." },
    faq: {
      nl: { q: "Wat is het verschil met hele armen?", a: "Bovenarmen loopt van elleboog tot schouder. Bij hele armen worden ook de onderarmen meegenomen." },
      en: { q: "What is the difference with full arms?", a: "Upper arms runs from elbow to shoulder. Full arms includes the forearms as well." },
      tr: { q: "Tüm koldan farkı nedir?", a: "Üst kol dirsekten omza kadardır. Tüm kolda ön kollar da yapılır." },
    },
  },
  "upper-legs": {
    name: { nl: "Bovenbenen waxen", en: "Upper leg waxing", tr: "Üst bacak ağdası" },
    lower: { nl: "bovenbenen", en: "upper legs", tr: "üst bacaklar" },
    area: {
      nl: "Van de knie tot de bikinilijn, aan de voor-, achter- en binnenkant van het been. Samen met de onderbenen is het ‘hele benen’.",
      en: "From the knee up to the bikini line, at the front, back and inside of the leg. Together with the lower legs this is ‘full legs’.",
      tr: "Dizden bikini çizgisine kadar, bacağın ön, arka ve iç tarafı. Alt bacaklarla birlikte ‘tüm bacak’ olur.",
    },
    teaser: { nl: "Gladde bovenbenen, van knie tot bikinilijn.", en: "Smooth upper legs, from knee to bikini line.", tr: "Dizden bikini çizgisine pürüzsüz üst bacaklar." },
    faq: {
      nl: { q: "Kan ik bovenbenen combineren met onderbenen?", a: "Ja, dat is ‘hele benen’ en staat apart op de pagina Tarieven." },
      en: { q: "Can I combine upper legs with lower legs?", a: "Yes, that is ‘full legs’ and is listed separately on the Prices page." },
      tr: { q: "Üst bacağı alt bacakla birleştirebilir miyim?", a: "Evet, bu ‘tüm bacak’ olur ve Fiyatlar sayfasında ayrıca yer alır." },
    },
  },
  belly: {
    name: { nl: "Buik waxen", en: "Belly waxing", tr: "Karın ağdası" },
    lower: { nl: "buik", en: "belly", tr: "karın" },
    area: {
      nl: "Het haar op de buik, bijvoorbeeld het lijntje onder de navel. Hoe breed en hoe ver, bespreek je vooraf.",
      en: "The hair on the belly, for example the line below the navel. You agree beforehand how wide and how far.",
      tr: "Karındaki tüyler, örneğin göbek altındaki çizgi. Ne kadar geniş ve ne kadar uzun olacağını önceden konuşursunuz.",
    },
    teaser: { nl: "Een gladde buik, ook het lijntje onder de navel.", en: "A smooth belly, including the line below the navel.", tr: "Göbek altındaki çizgi dahil pürüzsüz bir karın." },
    faq: {
      nl: { q: "Kan dit samen met een bikinibehandeling?", a: "Ja. Vermeld het bij je aanvraag, dan wordt er rekening mee gehouden in de planning." },
      en: { q: "Can this be combined with a bikini treatment?", a: "Yes. Mention it in your request so it is taken into account in the planning." },
      tr: { q: "Bikini bakımıyla birlikte yapılabilir mi?", a: "Evet. Talebinde belirtirsen planlamada dikkate alınır." },
    },
  },
  chest: {
    name: { nl: "Borst waxen", en: "Chest waxing", tr: "Göğüs ağdası" },
    lower: { nl: "borst", en: "chest", tr: "göğüs" },
    area: {
      nl: "Losse haartjes op en rond de borst, bijvoorbeeld tussen de borsten of rond de tepel. Precies welke plekken, bespreek je discreet vooraf.",
      en: "Stray hairs on and around the chest, for example between the breasts or around the nipple. You discuss discreetly beforehand exactly which spots.",
      tr: "Göğüs üzerindeki ve çevresindeki tek tük tüyler, örneğin göğüslerin arası ya da meme ucu çevresi. Tam olarak hangi noktaların yapılacağını önceden gizlilik içinde konuşursunuz.",
    },
    teaser: { nl: "Losse haartjes op de borst, discreet verwijderd.", en: "Stray hairs on the chest, discreetly removed.", tr: "Göğüsteki tek tük tüyler, gizlilik içinde alınır." },
    faq: {
      nl: { q: "Is dit gevoelig?", a: "De huid op de borst is dun, dus er wordt in kleine stukjes en rustig gewerkt. Je kunt altijd aangeven als je even wilt pauzeren." },
      en: { q: "Is this sensitive?", a: "The skin on the chest is thin, so the work is done calmly in small sections. You can always ask for a pause." },
      tr: { q: "Hassas bir bölge mi?", a: "Göğüs cildi incedir; bu yüzden küçük parçalar halinde ve sakince çalışılır. Ara vermek istediğinde her zaman söyleyebilirsin." },
    },
  },
  decollete: {
    name: { nl: "Decolleté waxen", en: "Décolletage waxing", tr: "Dekolte ağdası" },
    lower: { nl: "decolleté", en: "décolletage", tr: "dekolte" },
    area: {
      nl: "Het gebied van de hals tot boven de borst, inclusief de fijne haartjes op het borstbeen. Hoe ver het loopt, bespreek je vooraf.",
      en: "The area from the neck to above the chest, including the fine hairs on the breastbone. You agree beforehand how far it goes.",
      tr: "Boyundan göğsün üstüne kadar olan alan, göğüs kemiği üzerindeki ince tüyler dahil. Ne kadar alanın alınacağını önceden konuşursunuz.",
    },
    teaser: { nl: "Een gladde huid van hals tot decolleté.", en: "Smooth skin from neck to décolletage.", tr: "Boyundan dekolteye pürüzsüz bir cilt." },
    faq: {
      nl: { q: "Wat is het verschil met borst?", a: "Bij decolleté wordt het hele gebied van hals tot boven de borst behandeld; bij borst gaat het om losse haartjes op en rond de borst." },
      en: { q: "What is the difference with chest?", a: "Décolletage covers the whole area from neck to above the chest; chest is about stray hairs on and around the breasts." },
      tr: { q: "Göğüsten farkı nedir?", a: "Dekoltede boyundan göğsün üstüne kadar tüm alan yapılır; göğüste ise göğüs üzerindeki ve çevresindeki tek tük tüyler alınır." },
    },
  },
  buttocks: {
    name: { nl: "Billen waxen", en: "Buttock waxing", tr: "Kalça ağdası" },
    lower: { nl: "billen", en: "buttocks", tr: "kalça" },
    area: {
      nl: "Het haar op de billen. Wil je ook de bilnaad laten meenemen, bespreek het dan vooraf; dat kan ook samen met een Hollywood (full Brazilian).",
      en: "The hair on the buttocks. If you would also like the cleft included, discuss it beforehand; this can also be combined with a Hollywood (full Brazilian).",
      tr: "Kalçadaki tüyler. Kalça arasının da yapılmasını istiyorsan önceden konuş; bu, Hollywood (full Brazilian) ağdasıyla birlikte de yapılabilir.",
    },
    teaser: { nl: "Gladde billen, discreet en rustig.", en: "Smooth buttocks, discreetly and calmly.", tr: "Gizlilik ve sakinlik içinde pürüzsüz kalça." },
    faq: {
      nl: { q: "Is dit net zo discreet als een intieme behandeling?", a: "Ja. Je krijgt de tijd om je klaar te maken en ontbloot alleen wat nodig is." },
      en: { q: "Is this as discreet as an intimate treatment?", a: "Yes. You get time to get ready and only uncover what is needed." },
      tr: { q: "İntim bir bakım kadar gizli mi?", a: "Evet. Hazırlanman için zaman tanınır ve yalnızca gereken kısım açılır." },
    },
  },
};

const t = {
  seoTitle: { nl: (n: string) => `${n} in Amsterdam`, en: (n: string) => `${n} in Amsterdam`, tr: (n: string) => `Amsterdam'da ${n.toLocaleLowerCase("tr")}` },
  seoDescription: {
    nl: (z: string) => `${z[0].toUpperCase()}${z.slice(1)} waxen in Amsterdam-Noord, uitsluitend voor vrouwen en op afspraak. Lees hoe het gaat, hoe je je voorbereidt en wat je daarna doet.`,
    en: (z: string) => `${z[0].toUpperCase()}${z.slice(1)} waxing in Amsterdam-Noord, for women only and by appointment. Find out how it works, how to prepare and what to do afterwards.`,
    tr: (z: string) => `Amsterdam-Noord'da ${z} ağdası; yalnızca kadınlara ve randevuyla. Nasıl yapıldığını, nasıl hazırlanacağını ve sonrasında ne yapacağını oku.`,
  },
  lead: {
    nl: (z: string) => `Verzorgde, gladde ${z} — rustig gewaxt, met aandacht voor je huid. Bij Glow by Dilek in Amsterdam, uitsluitend voor vrouwen.`,
    en: (z: string) => `Neat, smooth ${z} — waxed calmly, with care for your skin. At Glow by Dilek in Amsterdam, women only.`,
    tr: (z: string) => `Bakımlı, pürüzsüz ${z} — cildine özen gösterilerek sakince ağda yapılır. Amsterdam'daki Glow by Dilek'te, yalnızca kadınlara.`,
  },
};

const common: Record<Locale, Pick<TreatmentCopy, "appointment" | "know" | "reactions" | "aftercare" | "recovery"> & { faceKnow: string; faceReaction: string; priceQ: { q: string; a: string }; women: { q: string; a: string } }> = {
  nl: {
    appointment: [
      "Vooraf bespreek je kort welke plekken je wilt laten doen en of je huid ergens gevoelig is. Je ontbloot alleen wat nodig is.",
      "De huid wordt gereinigd en de wax wordt in kleine stukken aangebracht en verwijderd, terwijl de huid goed strak wordt gehouden. Daarna worden losse haartjes nagelopen en wordt de huid gekalmeerd.",
    ],
    know: [
      "Laat het haar twee tot vier weken groeien, tot minimaal 0,5 cm — ongeveer de lengte van een rijstkorrel.",
      "Kom zonder bodylotion, olie of zelfbruiner op de zone.",
      "Ga 48 uur van tevoren niet zonnebaden; een verbrande of net gebruinde huid is gevoeliger.",
    ],
    reactions: [
      "Lichte roodheid en kleine bultjes rond de haarzakjes zijn normaal en trekken meestal binnen een à twee dagen weg.",
      "Over wondjes, eczeem of een zonverbrande huid wordt niet gewaxt.",
    ],
    aftercare: [
      "Vermijd 24 uur lang zon, zonnebank, sauna, hete douches en strakke kleding op de zone.",
      "Houd de huid soepel met een milde, ongeparfumeerde crème.",
      "Begin na twee dagen met af en toe mild scrubben tegen ingegroeide haartjes.",
    ],
    recovery: "Je kunt direct verder met je dag. Het resultaat blijft meestal drie tot vijf weken; een ritme van vier tot zes weken is prettig.",
    faceKnow: "Gebruik je retinol of zuren op de zone, stop daar dan minimaal een week van tevoren mee.",
    faceReaction: "Bij retinoïden op recept of na een kuur met isotretinoïne is waxen in het gezicht niet geschikt; overleg met je arts.",
    priceQ: { q: "Wat kost het en hoe lang duurt het?", a: "Het tarief en de duur staan op de pagina Tarieven." },
    women: { q: "Is dit alleen voor vrouwen?", a: "Ja. Glow by Dilek ontvangt uitsluitend vrouwen, op afspraak." },
  },
  en: {
    appointment: [
      "Beforehand you briefly discuss which spots you want done and whether your skin is sensitive anywhere. You only uncover what is needed.",
      "The skin is cleansed and the wax is applied and removed in small sections while the skin is held taut. Stray hairs are then tidied and the skin is soothed.",
    ],
    know: [
      "Let the hair grow for two to four weeks, to at least 0.5 cm — about the length of a grain of rice.",
      "Come without body lotion, oil or self-tanner on the area.",
      "Avoid sunbathing for 48 hours beforehand; burnt or freshly tanned skin is more sensitive.",
    ],
    reactions: [
      "Slight redness and small bumps around the follicles are normal and usually fade within one or two days.",
      "Waxing is not done over cuts, eczema or sunburnt skin.",
    ],
    aftercare: [
      "Avoid sun, sunbeds, sauna, hot showers and tight clothing on the area for 24 hours.",
      "Keep the skin supple with a mild, unscented cream.",
      "Start gentle exfoliation now and then after two days to prevent ingrown hairs.",
    ],
    recovery: "You can carry on with your day straight away. The result usually lasts three to five weeks; a rhythm of four to six weeks is comfortable.",
    faceKnow: "If you use retinol or acids on the area, stop at least a week before.",
    faceReaction: "With prescription retinoids or after a course of isotretinoin, facial waxing is not suitable; consult your doctor.",
    priceQ: { q: "What does it cost and how long does it take?", a: "The price and duration are listed on the Prices page." },
    women: { q: "Is this for women only?", a: "Yes. Glow by Dilek welcomes women only, by appointment." },
  },
  tr: {
    appointment: [
      "Önce hangi bölgelerin yapılmasını istediğini ve cildinin hassas bir yeri olup olmadığını kısaca konuşursunuz. Yalnızca gereken kısım açılır.",
      "Cilt temizlenir; ağda, cilt gergin tutularak küçük parçalar halinde sürülür ve alınır. Ardından tek tük kalan tüyler düzeltilir ve cilt yatıştırılır.",
    ],
    know: [
      "Kılları iki ila dört hafta, en az 0,5 cm (yaklaşık bir pirinç tanesi) olana kadar uzat.",
      "Bölgeye vücut losyonu, yağ veya bronzlaştırıcı sürmeden gel.",
      "48 saat önceden güneşlenme; yanmış veya yeni bronzlaşmış cilt daha hassastır.",
    ],
    reactions: [
      "Kıl dipleri çevresinde hafif kızarıklık ve küçük kabarıklıklar normaldir, genellikle bir iki gün içinde geçer.",
      "Yara, egzama veya güneş yanığı olan cilde ağda yapılmaz.",
    ],
    aftercare: [
      "24 saat boyunca güneş, solaryum, sauna, sıcak duş ve bölgeyi sıkan giysilerden kaçın.",
      "Cildini hafif, kokusuz bir kremle yumuşak tut.",
      "Batık kıllara karşı iki gün sonra ara sıra hafif peelinge başla.",
    ],
    recovery: "Hemen gününe devam edebilirsin. Sonuç genellikle üç ila beş hafta kalır; dört ila altı haftada bir rahat bir aralıktır.",
    faceKnow: "Bölgede retinol veya asit kullanıyorsan en az bir hafta önce bırak.",
    faceReaction: "Reçeteli retinoid kullanıyorsan ya da izotretinoin kürü aldıysan yüze ağda uygun değildir; doktoruna danış.",
    priceQ: { q: "Fiyatı nedir, ne kadar sürer?", a: "Fiyat ve süre Fiyatlar sayfasında yer alır." },
    women: { q: "Bu yalnızca kadınlar için mi?", a: "Evet. Glow by Dilek yalnızca kadınlara, randevuyla hizmet verir." },
  },
};

function copyFor(z: Zone, l: Locale): TreatmentCopy {
  const c = common[l];
  return {
    seoTitle: t.seoTitle[l](z.name[l]),
    seoDescription: t.seoDescription[l](z.lower[l]),
    title: z.name[l],
    lead: t.lead[l](z.lower[l]),
    teaser: z.teaser[l],
    area: z.area[l],
    appointment: c.appointment,
    know: z.face ? [...c.know, c.faceKnow] : c.know,
    reactions: z.face ? [...c.reactions, c.faceReaction] : c.reactions,
    aftercare: c.aftercare,
    recovery: c.recovery,
    faqs: [z.faq[l], c.priceQ, c.women],
  };
}

export const waxZoneTreatments: Record<string, Record<Locale, TreatmentCopy>> = Object.fromEntries(
  Object.entries(ZONES).map(([id, z]) => [id, { nl: copyFor(z, "nl"), en: copyFor(z, "en"), tr: copyFor(z, "tr") }]),
);
