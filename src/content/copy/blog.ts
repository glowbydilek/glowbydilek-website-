/**
 * Long-form local content: the Amsterdam-Noord page and the blog articles.
 *
 * Truthfulness (same rules as the rest of the copy): no prices, durations,
 * reviews, addresses or promises. Facts come from the treatment and guide
 * copy (hair length, preparation, aftercare) and from the owner:
 * the salon is in Amsterdam-Noord (24 Nov 2026), women only, by appointment,
 * and Dilek also comes to the client's own address on request.
 */
import type { Locale, RouteKey } from "../../i18n/config";
import type { PostId } from "../slugs";
import type { QA } from "./types";

export type ArticleSection = { title: string; paragraphs?: string[]; items?: string[] };

export type ArticleCopy = {
  seoTitle: string;
  seoDescription: string;
  hero: { eyebrow: string; title: string; titleEm: string; subtitle: string };
  sections: ArticleSection[];
  faqs?: QA[];
  /** Catalogue items (treatments) linked at the end; unpublished ones are skipped. */
  treatments: string[];
  /** Static pages linked at the end. */
  pages: RouteKey[];
};

// ─────────────────────────────────────────────────────────── Amsterdam-Noord

const noord: Record<Locale, ArticleCopy> = {
  nl: {
    seoTitle: "Schoonheidssalon voor vrouwen in Amsterdam-Noord",
    seoDescription:
      "Waxen, gezichtsbehandelingen en massages in Amsterdam-Noord, uitsluitend voor vrouwen en op afspraak. Ook welkom uit de rest van Amsterdam en de regio.",
    hero: {
      eyebrow: "Amsterdam-Noord",
      title: "Schoonheidssalon voor vrouwen",
      titleEm: "in Amsterdam-Noord.",
      subtitle:
        "Glow by Dilek zit in Amsterdam-Noord: waxen, gezichtsbehandelingen en massages, uitsluitend voor vrouwen en altijd op afspraak. Dilek ontvangt je persoonlijk; waxen kan op afspraak ook op je eigen adres.",
    },
    sections: [
      {
        title: "Uitsluitend voor vrouwen",
        paragraphs: [
          "Bij Glow by Dilek in Amsterdam-Noord zijn alle behandelingen alleen voor vrouwen. Je wordt persoonlijk geholpen door Dilek zelf, in alle rust en zonder haast. Zo voelt ook een eerste afspraak of een intieme behandeling vertrouwd.",
          "Er is geen automatisch boekingssysteem: Dilek leest elke aanvraag zelf en bevestigt je afspraak persoonlijk.",
        ],
      },
      {
        title: "Wat je kunt laten doen",
        items: [
          "Waxen van gezicht, lichaam en bikinizone: van wenkbrauwen en bovenlip tot benen en Hollywood (full Brazilian).",
          "Gezichtsbehandelingen, afgestemd op wat jouw huid nodig heeft.",
          "Ontspannende massages en lichaamsbehandelingen.",
        ],
      },
      {
        title: "Welkom uit heel Amsterdam en de regio",
        paragraphs: [
          "Woon je in Noord, dan is Glow by Dilek dichtbij. Maar ook vanuit andere delen van Amsterdam en uit de regio, zoals Amstelveen, Diemen, Zaandam en Haarlem, ben je van harte welkom.",
          "Het exacte adres en praktische informatie over de route ontvang je persoonlijk zodra je afspraak is bevestigd.",
        ],
      },
      {
        title: "Ook bij jou langs",
        paragraphs: [
          "Liever waxen op je eigen adres? Op afspraak komt Dilek ook naar je eigen adres, in Amsterdam en omgeving. Kies bij je aanvraag ‘Op mijn eigen adres’; Dilek stemt de afspraak persoonlijk met je af.",
        ],
      },
      {
        title: "Zo vraag je een afspraak aan",
        paragraphs: [
          "Kies op de pagina ‘Afspraak aanvragen’ je behandeling en een voorkeursmoment. Je ontvangt meteen een ontvangstbevestiging; de afspraak is definitief zodra Dilek hem persoonlijk heeft bevestigd.",
        ],
      },
    ],
    faqs: [
      {
        q: "Waar in Amsterdam-Noord zit Glow by Dilek?",
        a: "Glow by Dilek werkt uitsluitend op afspraak. Het exacte adres deelt Dilek persoonlijk na bevestiging van je afspraak.",
      },
      {
        q: "Is Glow by Dilek echt alleen voor vrouwen?",
        a: "Ja. Alle behandelingen, van waxen tot massage en gezichtsbehandelingen, zijn uitsluitend voor vrouwelijke klanten.",
      },
      {
        q: "Kan ik ook komen als ik niet in Noord woon?",
        a: "Natuurlijk. Klanten komen uit heel Amsterdam en de regio. Je bent overal vandaan welkom.",
      },
    ],
    treatments: ["hollywood", "eyebrows", "full-legs"],
    pages: ["prices", "process", "faq"],
  },
  en: {
    seoTitle: "Women-only beauty salon in Amsterdam-Noord",
    seoDescription:
      "Waxing, facials and massages in Amsterdam-Noord, for women only and by appointment. Clients from the rest of Amsterdam and the region are welcome too.",
    hero: {
      eyebrow: "Amsterdam-Noord",
      title: "Women-only beauty salon",
      titleEm: "in Amsterdam-Noord.",
      subtitle:
        "Glow by Dilek is in Amsterdam-Noord: waxing, facials and massages, for women only and always by appointment. Dilek welcomes you personally; waxing can also be done at your own address by appointment.",
    },
    sections: [
      {
        title: "For women only",
        paragraphs: [
          "At Glow by Dilek in Amsterdam-Noord, every treatment is for women only. You are looked after personally by Dilek herself, calmly and without rushing. That makes even a first appointment or an intimate treatment feel familiar.",
          "There is no automatic booking system: Dilek reads every request herself and confirms your appointment personally.",
        ],
      },
      {
        title: "What you can book",
        items: [
          "Waxing for face, body and bikini area: from eyebrows and upper lip to legs and Hollywood (full Brazilian).",
          "Facials, tailored to what your skin needs.",
          "Relaxing massages and body treatments.",
        ],
      },
      {
        title: "Welcome from all over Amsterdam and the region",
        paragraphs: [
          "If you live in Noord, Glow by Dilek is close by. Clients from other parts of Amsterdam and the region, such as Amstelveen, Diemen, Zaandam and Haarlem, are just as welcome.",
          "You receive the exact address and practical directions personally once your appointment is confirmed.",
        ],
      },
      {
        title: "Dilek can also come to you",
        paragraphs: [
          "Prefer waxing at your own address? By appointment, Dilek can also come to your own address in Amsterdam and the surrounding area. Choose ‘At my own address’ in your request; Dilek arranges it with you personally.",
        ],
      },
      {
        title: "How to request an appointment",
        paragraphs: [
          "On the ‘Book an appointment’ page, choose your treatment and a preferred time. You receive an acknowledgement straight away; the appointment is final once Dilek has confirmed it personally.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where in Amsterdam-Noord is Glow by Dilek?",
        a: "Glow by Dilek works by appointment only. Dilek shares the exact address personally once your appointment is confirmed.",
      },
      {
        q: "Is Glow by Dilek really for women only?",
        a: "Yes. Every treatment, from waxing to massage and facials, is for female clients only.",
      },
      {
        q: "Can I come if I don’t live in Noord?",
        a: "Of course. Clients come from all over Amsterdam and the region. You are welcome wherever you live.",
      },
    ],
    treatments: ["hollywood", "eyebrows", "full-legs"],
    pages: ["prices", "process", "faq"],
  },
  tr: {
    seoTitle: "Amsterdam-Noord'da kadınlara özel güzellik salonu",
    seoDescription:
      "Amsterdam-Noord'da ağda, yüz bakımı ve masaj; yalnızca kadınlara ve randevuyla. Amsterdam'ın diğer semtlerinden ve çevreden gelenler de hoş geldiniz.",
    hero: {
      eyebrow: "Amsterdam-Noord",
      title: "Kadınlara özel güzellik salonu",
      titleEm: "Amsterdam-Noord'da.",
      subtitle:
        "Glow by Dilek Amsterdam-Noord'dadır: ağda, yüz bakımı ve masaj; yalnızca kadınlara ve her zaman randevuyla. Dilek seni kişisel olarak karşılar; ağda randevuyla evinde de yapılabilir.",
    },
    sections: [
      {
        title: "Yalnızca kadınlara",
        paragraphs: [
          "Amsterdam-Noord'daki Glow by Dilek'te tüm bakımlar yalnızca kadınlara yöneliktir. Seninle Dilek bizzat, sakin ve acele etmeden ilgilenir. Böylece ilk randevu ya da intim bir bakım bile güven verir.",
          "Otomatik bir rezervasyon sistemi yoktur: Dilek her talebi kendisi okur ve randevunu kişisel olarak onaylar.",
        ],
      },
      {
        title: "Neler yaptırabilirsin",
        items: [
          "Yüz, vücut ve bikini bölgesi ağdası: kaş ve üst dudaktan bacaklara ve Hollywood (full Brazilian) ağdasına kadar.",
          "Cildinin ihtiyacına göre şekillenen yüz bakımları.",
          "Rahatlatıcı masajlar ve vücut bakımları.",
        ],
      },
      {
        title: "Tüm Amsterdam'dan ve çevreden hoş geldin",
        paragraphs: [
          "Noord'da oturuyorsan Glow by Dilek sana yakın. Amsterdam'ın diğer bölgelerinden ve Amstelveen, Diemen, Zaandam ve Haarlem gibi çevre yerlerden gelen müşteriler de aynı şekilde hoş karşılanır.",
          "Tam adresi ve yol tarifini randevun onaylandığında kişisel olarak alırsın.",
        ],
      },
      {
        title: "Dilek sana da gelebilir",
        paragraphs: [
          "Ağdayı kendi adresinde mi tercih edersin? Randevuyla Dilek Amsterdam ve çevresinde evine de gelir. Talebinde ‘Kendi adresimde’ seçeneğini işaretle; Dilek randevuyu seninle kişisel olarak ayarlar.",
        ],
      },
      {
        title: "Nasıl randevu talep edilir",
        paragraphs: [
          "'Randevu talep et' sayfasında bakımını ve tercih ettiğin zamanı seç. Hemen bir alındı bilgisi alırsın; randevu, Dilek kişisel olarak onayladığında kesinleşir.",
        ],
      },
    ],
    faqs: [
      {
        q: "Glow by Dilek Amsterdam-Noord'da tam olarak nerede?",
        a: "Glow by Dilek yalnızca randevuyla çalışır. Tam adresi Dilek randevun onaylandıktan sonra kişisel olarak paylaşır.",
      },
      {
        q: "Glow by Dilek gerçekten yalnızca kadınlara mı hizmet veriyor?",
        a: "Evet. Ağdadan masaja ve yüz bakımına kadar tüm bakımlar yalnızca kadın müşterilere yöneliktir.",
      },
      {
        q: "Noord'da oturmuyorsam da gelebilir miyim?",
        a: "Elbette. Müşteriler tüm Amsterdam'dan ve çevreden gelir. Nerede oturursan otur, hoş geldin.",
      },
    ],
    treatments: ["hollywood", "eyebrows", "full-legs"],
    pages: ["prices", "process", "faq"],
  },
};

// ─────────────────────────────────────────────────────────────── Blog posts

const posts: Record<PostId, Record<Locale, ArticleCopy>> = {
  "intimate-waxing-guide": {
    nl: {
      seoTitle: "Bikinilijn of Hollywood (full Brazilian)?",
      seoDescription:
        "Bikinilijn of full Brazilian (Hollywood) waxen? Lees het verschil, wat bij jou past en hoe je je voorbereidt. Uitleg van Glow by Dilek in Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Intiem waxen",
        title: "Bikinilijn of full Brazilian:",
        titleEm: "wat is het verschil?",
        subtitle:
          "Twee intieme waxbehandelingen, twee resultaten. Zo zie je in één oogopslag wat er verdwijnt, wat bij jou past en hoe je je voorbereidt.",
      },
      sections: [
        {
          title: "Bikinilijn: een nette lijn",
          paragraphs: [
            "Bij de bikinilijn verdwijnt alleen het haar dat buiten je bikinibroekje of ondergoed zichtbaar is, langs de liezen en de bovenkant. Hoe hoog of breed de lijn loopt, bepaal je zelf. Het is de meest ingetogen intieme behandeling en een rustige eerste stap als je nog nooit intiem hebt gewaxt.",
          ],
        },
        {
          title: "Full Brazilian (Hollywood): volledig glad",
          paragraphs: [
            "Een Hollywood wax wordt ook wel full Brazilian genoemd: het is dezelfde behandeling. Al het haar in de intieme zone wordt verwijderd, ook tussen de billen, zodat je helemaal glad bent. Met dezelfde discretie, uitleg en rust als bij elke intieme behandeling.",
          ],
        },
        {
          title: "Welke past bij jou?",
          items: [
            "Voor het eerst intiem waxen? Begin gerust met de bikinilijn; later kun je altijd kiezen voor een full Brazilian (Hollywood).",
            "Wil je helemaal glad? Kies een full Brazilian (Hollywood).",
            "Twijfel je? Vraag het gerust bij je aanvraag; Dilek denkt eerlijk met je mee.",
          ],
        },
        {
          title: "Zo bereid je je voor",
          items: [
            "Laat het haar twee tot vier weken groeien, tot minimaal 0,5 cm — ongeveer de lengte van een rijstkorrel.",
            "Scrub een of twee dagen van tevoren licht, niet op de dag zelf.",
            "Gebruik op de dag van je afspraak geen olie of lotion in de zone en draag schoon katoenen ondergoed.",
          ],
        },
        {
          title: "Na het waxen",
          items: [
            "Draag 24 uur lang ruim katoenen ondergoed en geen strakke broek.",
            "Vermijd de eerste dag zwembad, sauna, zon en intensief sporten.",
            "Begin na twee dagen met een milde scrub tegen ingegroeide haartjes.",
            "Elke vier tot zes weken is een prettig ritme.",
          ],
        },
      ],
      faqs: [
        { q: "Is een full Brazilian hetzelfde als een Hollywood?", a: "Ja. Beide namen worden gebruikt voor dezelfde behandeling: de intieme zone wordt volledig glad gewaxt." },
        { q: "Is een bikinilijn een goede eerste keer?", a: "Voor veel vrouwen wel: het is de kleinste intieme zone en je ervaart rustig hoe waxen voelt." },
      ],
      treatments: ["bikini-line", "hollywood", "buttocks"],
      pages: ["preparation", "aftercare", "noord"],
    },
    en: {
      seoTitle: "Bikini line or full Brazilian (Hollywood)?",
      seoDescription:
        "Bikini line or full Brazilian (Hollywood) wax? Learn the difference, which one suits you and how to prepare. A guide by Glow by Dilek in Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Intimate waxing",
        title: "Bikini line or full Brazilian:",
        titleEm: "what’s the difference?",
        subtitle: "Two intimate wax treatments, two results. See at a glance what is removed, which one suits you and how to prepare.",
      },
      sections: [
        {
          title: "Bikini line: a neat line",
          paragraphs: [
            "A bikini line wax only removes the hair that shows outside your bikini bottoms or underwear, along the groin and the top. You decide how high or wide the line goes. It is the most modest intimate treatment and a calm first step if you have never had intimate waxing before.",
          ],
        },
        {
          title: "Full Brazilian (Hollywood): completely smooth",
          paragraphs: [
            "A Hollywood wax is also called a full Brazilian: it is the same treatment. All hair in the intimate area is removed, including between the buttocks, so you are completely smooth — with the same discretion, explanation and calm as every intimate treatment.",
          ],
        },
        {
          title: "Which one suits you?",
          items: [
            "First intimate wax? Start with the bikini line; you can always choose a full Brazilian (Hollywood) later.",
            "Want to be completely smooth? Choose a full Brazilian (Hollywood).",
            "Not sure? Ask in your request; Dilek will give you honest advice.",
          ],
        },
        {
          title: "How to prepare",
          items: [
            "Let the hair grow for two to four weeks, to at least 0.5 cm — about the length of a grain of rice.",
            "Exfoliate lightly one or two days before, not on the day itself.",
            "On the day of your appointment, use no oil or lotion on the area and wear clean cotton underwear.",
          ],
        },
        {
          title: "After waxing",
          items: [
            "Wear loose cotton underwear and no tight trousers for 24 hours.",
            "Avoid swimming pools, sauna, sun and intensive exercise on the first day.",
            "Start gentle exfoliation after two days to prevent ingrown hairs.",
            "Every four to six weeks is a comfortable rhythm.",
          ],
        },
      ],
      faqs: [
        { q: "Is a full Brazilian the same as a Hollywood?", a: "Yes. Both names are used for the same treatment: the intimate area is waxed completely smooth." },
        { q: "Is a bikini line a good first time?", a: "For many women it is: it is the smallest intimate area and you calmly experience what waxing feels like." },
      ],
      treatments: ["bikini-line", "hollywood", "buttocks"],
      pages: ["preparation", "aftercare", "noord"],
    },
    tr: {
      seoTitle: "Bikini çizgisi mi full Brazilian (Hollywood) mı?",
      seoDescription:
        "Bikini çizgisi mi, full Brazilian (Hollywood) ağdası mı? Farkı, sana hangisinin uygun olduğunu ve nasıl hazırlanacağını oku. Amsterdam-Noord'dan Glow by Dilek.",
      hero: {
        eyebrow: "Blog · İntim ağda",
        title: "Bikini çizgisi mi full Brazilian mı:",
        titleEm: "farkı ne?",
        subtitle: "İki intim ağda, iki farklı sonuç. Nelerin alındığını, hangisinin sana uyduğunu ve nasıl hazırlanacağını bir bakışta gör.",
      },
      sections: [
        {
          title: "Bikini çizgisi: düzgün bir hat",
          paragraphs: [
            "Bikini çizgisi ağdasında yalnızca bikini altının ya da iç çamaşırının dışında kalan kıllar, kasık kenarı ve üst kısım boyunca alınır. Hattın ne kadar yüksek veya geniş olacağına sen karar verirsin. En sade intim bakımdır ve daha önce hiç intim ağda yaptırmadıysan sakin bir ilk adımdır.",
          ],
        },
        {
          title: "Full Brazilian (Hollywood): tamamen pürüzsüz",
          paragraphs: [
            "Hollywood ağdasına full Brazilian da denir: ikisi aynı bakımdır. İntim bölgedeki kılların tamamı, kalça arası dahil alınır; tamamen pürüzsüz olursun. Her intim bakımda olduğu gibi aynı gizlilik, açıklama ve sakinlikle.",
          ],
        },
        {
          title: "Hangisi sana uygun?",
          items: [
            "İlk kez intim ağda mı? Bikini çizgisiyle başla; daha sonra her zaman full Brazilian (Hollywood) seçebilirsin.",
            "Tamamen pürüzsüz mü olmak istiyorsun? Full Brazilian (Hollywood) seç.",
            "Emin değil misin? Talebinde sor; Dilek seninle dürüstçe düşünür.",
          ],
        },
        {
          title: "Nasıl hazırlanırsın",
          items: [
            "Kılları iki ila dört hafta, en az 0,5 cm (yaklaşık bir pirinç tanesi) olana kadar uzat.",
            "Bir iki gün önce hafifçe peeling yap, aynı gün yapma.",
            "Randevu günü bölgeye yağ veya losyon sürme ve temiz pamuklu iç çamaşırı giy.",
          ],
        },
        {
          title: "Ağdadan sonra",
          items: [
            "24 saat boyunca bol, pamuklu iç çamaşırı giy; dar pantolon giyme.",
            "İlk gün havuz, sauna, güneş ve yoğun spordan kaçın.",
            "Batık kıllara karşı iki gün sonra hafif peelinge başla.",
            "Dört ila altı haftada bir rahat bir aralıktır.",
          ],
        },
      ],
      faqs: [
        { q: "Full Brazilian ile Hollywood aynı şey mi?", a: "Evet. İki ad da aynı bakım için kullanılır: intim bölge tamamen pürüzsüz olacak şekilde ağdayla alınır." },
        { q: "Bikini çizgisi ilk kez için uygun mu?", a: "Birçok kadın için evet: en küçük intim bölgedir ve ağdanın nasıl hissettirdiğini sakince deneyimlersin." },
      ],
      treatments: ["bikini-line", "hollywood", "buttocks"],
      pages: ["preparation", "aftercare", "noord"],
    },
  },

  "eyebrows-wax-or-pluck": {
    nl: {
      seoTitle: "Wenkbrauwen waxen of epileren: wat past bij jou?",
      seoDescription:
        "Wenkbrauwen waxen of epileren? Lees de verschillen, waarom ze vaak samen worden gebruikt en hoe je je wenkbrauwen mooi in vorm houdt. Glow by Dilek, Amsterdam.",
      hero: {
        eyebrow: "Blog · Wenkbrauwen",
        title: "Wenkbrauwen waxen of epileren:",
        titleEm: "wat past bij jou?",
        subtitle:
          "Wax en pincet doen elk iets anders. Zo werken ze, waarom ze vaak worden gecombineerd en hoe je de vorm tussen twee afspraken behoudt.",
      },
      sections: [
        {
          title: "Waxen: snel een gelijkmatige lijn",
          paragraphs: [
            "Met wax gaan meerdere haartjes in één keer weg, ook de fijne donshaartjes rond de wenkbrauw. Daardoor wordt de lijn snel en gelijkmatig. Omdat het haar met wortel en al wordt verwijderd, groeit het langzamer terug dan na scheren.",
          ],
        },
        {
          title: "Epileren: precies per haartje",
          paragraphs: [
            "Met een pincet haal je haartje voor haartje weg. Dat is precies, maar kost meer tijd, en het is makkelijk om — zeker voor de spiegel — net te veel weg te halen.",
          ],
        },
        {
          title: "Het beste van beide",
          paragraphs: [
            "Daarom worden ze bij Glow by Dilek gecombineerd: eerst wordt de lijn met wax gezet, daarna worden losse haartjes die de wax laat zitten met een pincet bijgewerkt. De vorm wordt rustig opgebouwd vanuit je natuurlijke wenkbrauw, zonder te veel weg te halen, en je kijkt aan het eind zelf mee in de spiegel.",
          ],
        },
        {
          title: "Tips voor mooie wenkbrauwen",
          items: [
            "Laat je wenkbrauwen voor je afspraak twee à drie weken ongemoeid; hoe meer haar er is, hoe beter de vorm kan worden bepaald.",
            "Epileer tussen twee afspraken bij voorkeur niet zelf, zodat de lijn rustig kan teruggroeien.",
            "Elke drie tot vijf weken is een prettig ritme om de vorm bij te werken.",
            "Gebruik je retinol of zuren rond je ogen? Stop daar minimaal een week van tevoren mee.",
          ],
        },
        {
          title: "Wanneer niet waxen?",
          paragraphs: [
            "Gebruik je retinoïden op recept of heb je recent een kuur met isotretinoïne gevolgd, dan is waxen rond de ogen niet geschikt. Overleg bij twijfel met je arts en vermeld het bij je aanvraag.",
          ],
        },
      ],
      faqs: [
        {
          q: "Wat is beter: wenkbrauwen epileren of waxen?",
          a: "Met wax wordt de lijn snel en gelijkmatig; met een pincet werk je losse haartjes bij. Samen geven ze het mooiste resultaat.",
        },
        {
          q: "Hoe vaak moet je je wenkbrauwen laten waxen?",
          a: "Meestal elke drie tot vijf weken. Dan is er genoeg teruggegroeid om de vorm netjes bij te werken.",
        },
      ],
      treatments: ["eyebrows", "upper-lip", "full-face"],
      pages: ["preparation", "aftercare", "noord"],
    },
    en: {
      seoTitle: "Eyebrow waxing or plucking: which suits you?",
      seoDescription:
        "Eyebrow waxing or plucking? Learn the differences, why they are often combined and how to keep your brows in shape. Glow by Dilek, Amsterdam.",
      hero: {
        eyebrow: "Blog · Eyebrows",
        title: "Eyebrow waxing or plucking:",
        titleEm: "which suits you?",
        subtitle:
          "Wax and tweezers each do something different. Here is how they work, why they are often combined and how to keep the shape between appointments.",
      },
      sections: [
        {
          title: "Waxing: an even line, quickly",
          paragraphs: [
            "Wax removes several hairs at once, including the fine downy hairs around the brow. That makes the line quick and even. Because the hair is removed from the root, it grows back more slowly than after shaving.",
          ],
        },
        {
          title: "Plucking: precise, hair by hair",
          paragraphs: [
            "With tweezers you remove one hair at a time. That is precise but takes longer, and it is easy — especially in front of a mirror — to take away just a little too much.",
          ],
        },
        {
          title: "The best of both",
          paragraphs: [
            "That is why Glow by Dilek combines them: first the line is set with wax, then stray hairs the wax leaves behind are tidied with tweezers. The shape is built calmly from your natural brow without removing too much, and at the end you check the result in the mirror yourself.",
          ],
        },
        {
          title: "Tips for beautiful brows",
          items: [
            "Leave your brows alone for two to three weeks before your appointment; the more hair there is, the better the shape can be defined.",
            "Preferably don’t pluck yourself between appointments, so the line can grow back evenly.",
            "Every three to five weeks is a comfortable rhythm to maintain the shape.",
            "Using retinol or acids around your eyes? Stop at least a week before.",
          ],
        },
        {
          title: "When not to wax",
          paragraphs: [
            "If you use prescription retinoids or have recently taken a course of isotretinoin, waxing around the eyes is not suitable. If in doubt, consult your doctor and mention it in your request.",
          ],
        },
      ],
      faqs: [
        {
          q: "Which is better: plucking or waxing eyebrows?",
          a: "Wax makes the line quick and even; tweezers tidy up stray hairs. Together they give the best result.",
        },
        {
          q: "How often should you have your eyebrows waxed?",
          a: "Usually every three to five weeks. By then enough has grown back to neatly maintain the shape.",
        },
      ],
      treatments: ["eyebrows", "upper-lip", "full-face"],
      pages: ["preparation", "aftercare", "noord"],
    },
    tr: {
      seoTitle: "Kaş ağdası mı cımbız mı: hangisi sana uygun?",
      seoDescription:
        "Kaş ağdası mı cımbız mı? Farkları, neden sık sık birlikte kullanıldıklarını ve kaşlarının şeklini nasıl koruyacağını oku. Glow by Dilek, Amsterdam.",
      hero: {
        eyebrow: "Blog · Kaşlar",
        title: "Kaş ağdası mı cımbız mı:",
        titleEm: "hangisi sana uygun?",
        subtitle:
          "Ağda ve cımbız farklı işler yapar. Nasıl çalıştıklarını, neden birlikte kullanıldıklarını ve iki randevu arasında şekli nasıl koruyacağını öğren.",
      },
      sections: [
        {
          title: "Ağda: hızlı ve düzgün bir hat",
          paragraphs: [
            "Ağda, kaşın çevresindeki ince tüyler dahil birçok kılı tek seferde alır. Böylece hat hızlı ve düzgün olur. Kıl kökünden alındığı için tıraştan sonra olduğundan daha yavaş çıkar.",
          ],
        },
        {
          title: "Cımbız: kıl kıl, hassas",
          paragraphs: [
            "Cımbızla kılları tek tek alırsın. Hassastır ama daha uzun sürer ve özellikle aynanın karşısında gereğinden biraz fazlasını almak kolaydır.",
          ],
        },
        {
          title: "İkisinin en iyisi",
          paragraphs: [
            "Bu yüzden Glow by Dilek'te ikisi birlikte kullanılır: önce hat ağdayla belirlenir, sonra ağdanın bıraktığı tek tük kıllar cımbızla düzeltilir. Şekil, doğal kaşından yola çıkarak ve fazla almadan sakince oluşturulur; sonunda aynadan sen de bakarsın.",
          ],
        },
        {
          title: "Güzel kaşlar için ipuçları",
          items: [
            "Randevundan önce kaşlarına iki üç hafta dokunma; ne kadar çok kıl olursa şekil o kadar iyi belirlenir.",
            "İki randevu arasında mümkünse kendin cımbız kullanma, böylece hat düzgün çıkar.",
            "Şekli korumak için üç ila beş haftada bir rahat bir aralıktır.",
            "Göz çevrende retinol veya asit mi kullanıyorsun? En az bir hafta önce bırak.",
          ],
        },
        {
          title: "Ne zaman ağda yapılmaz?",
          paragraphs: [
            "Reçeteli retinoid kullanıyorsan ya da yakın zamanda izotretinoin kürü aldıysan göz çevresine ağda uygun değildir. Emin değilsen doktoruna danış ve talebinde belirt.",
          ],
        },
      ],
      faqs: [
        {
          q: "Hangisi daha iyi: kaş ağdası mı cımbız mı?",
          a: "Ağda hattı hızlı ve düzgün yapar; cımbız tek tük kılları düzeltir. Birlikte en güzel sonucu verirler.",
        },
        {
          q: "Kaşlar ne sıklıkla ağdayla alınmalı?",
          a: "Genellikle üç ila beş haftada bir. O zamana kadar şekli düzgünce yenilemeye yetecek kadar kıl çıkar.",
        },
      ],
      treatments: ["eyebrows", "upper-lip", "full-face"],
      pages: ["preparation", "aftercare", "noord"],
    },
  },

  "first-time-waxing": {
    nl: {
      seoTitle: "Voor het eerst waxen: zo bereid je je voor",
      seoDescription:
        "Voor het eerst waxen? Lees hoe lang je haar moet zijn, hoe je je voorbereidt, wat je kunt verwachten en wat je daarna doet. Glow by Dilek, alleen voor vrouwen.",
      hero: {
        eyebrow: "Blog · Eerste keer",
        title: "Voor het eerst waxen:",
        titleEm: "zo bereid je je voor.",
        subtitle:
          "Spannend? Dat hoeft niet. Met een paar eenvoudige stappen vooraf wordt je eerste waxafspraak rustiger, comfortabeler en mooier.",
      },
      sections: [
        {
          title: "Hoe lang moet je haar zijn?",
          paragraphs: [
            "Het haar moet minimaal 0,5 cm lang zijn — ongeveer de lengte van een rijstkorrel. Dat is meestal twee tot vier weken na het scheren. Is het korter, dan pakt de wax het haar niet goed vast; is het veel langer dan een centimeter, dan wordt het vooraf iets ingekort.",
          ],
        },
        {
          title: "De dagen ervoor",
          items: [
            "Scrub de huid een of twee dagen van tevoren licht, niet op de dag zelf.",
            "Ga in de 48 uur voor je afspraak niet zonnebaden en sla de zonnebank over.",
            "Stop minimaal een week van tevoren met retinol, AHA, BHA en andere exfoliërende producten op de zone.",
          ],
        },
        {
          title: "Op de dag zelf",
          items: [
            "Gebruik geen bodylotion, olie, deodorant of zelfbruiner op de zone die wordt behandeld.",
            "Draag comfortabele, losse kleding; bij een intieme behandeling schoon katoenen ondergoed.",
            "Stel gerust al je vragen vooraf: je krijgt een rustige, duidelijke uitleg tijdens de behandeling.",
          ],
        },
        {
          title: "Hoe voelt het?",
          paragraphs: [
            "Je voelt een korte, felle prikkel die snel wegtrekt. Hoe dat voelt, verschilt per persoon en per zone; de eerste keer is meestal het gevoeligst. Bij regelmatig waxen groeit het haar vaak fijner terug, waardoor veel vrouwen het daarna minder intens vinden.",
          ],
        },
        {
          title: "Na je afspraak",
          items: [
            "Roodheid en kleine bultjes rond de haarzakjes trekken meestal binnen een à twee dagen weg.",
            "Vermijd de eerste dag zon, sauna en intensief sporten.",
            "Scheer liever niet tussen twee afspraken; zo blijft je haargroei in hetzelfde ritme.",
          ],
        },
        {
          title: "Goed om te weten",
          paragraphs: [
            "Gebruik je retinoïden op recept of heb je recent een kuur met isotretinoïne gevolgd, dan is waxen niet geschikt. Gebruik je bloedverdunners, heb je diabetes of een huidaandoening op de zone, overleg dan vooraf met je arts en vermeld het bij je aanvraag.",
          ],
        },
      ],
      faqs: [
        {
          q: "Welke behandeling is fijn voor de eerste keer?",
          a: "Dat hangt af van wat je wilt. Voor intiem waxen is de bikinilijn een rustige eerste stap; voor het gezicht beginnen veel vrouwen met de wenkbrauwen of bovenlip.",
        },
        {
          q: "Hoe lang blijft het resultaat?",
          a: "Meestal drie tot vijf weken, afhankelijk van je haargroei en de zone.",
        },
      ],
      treatments: ["bikini-line", "eyebrows", "half-legs"],
      pages: ["preparation", "aftercare", "noord"],
    },
    en: {
      seoTitle: "First time waxing: how to prepare",
      seoDescription:
        "Waxing for the first time? Learn how long your hair should be, how to prepare, what to expect and what to do afterwards. Glow by Dilek, women only.",
      hero: {
        eyebrow: "Blog · First time",
        title: "Waxing for the first time:",
        titleEm: "how to prepare.",
        subtitle:
          "Nervous? No need. A few simple steps beforehand make your first waxing appointment calmer, more comfortable and more beautiful.",
      },
      sections: [
        {
          title: "How long should your hair be?",
          paragraphs: [
            "Hair needs to be at least 0.5 cm long — about the length of a grain of rice. That is usually two to four weeks after shaving. If it is shorter, the wax can’t grip it properly; if it is much longer than a centimetre, it is trimmed a little first.",
          ],
        },
        {
          title: "The days before",
          items: [
            "Exfoliate lightly one or two days before, not on the day itself.",
            "Avoid sunbathing and sunbeds in the 48 hours before your appointment.",
            "Stop retinol, AHA, BHA and other exfoliating products on the area at least a week before.",
          ],
        },
        {
          title: "On the day",
          items: [
            "Use no body lotion, oil, deodorant or self-tanner on the area being treated.",
            "Wear comfortable, loose clothing; for an intimate treatment, clean cotton underwear.",
            "Ask all your questions beforehand: you get a calm, clear explanation during the treatment.",
          ],
        },
        {
          title: "What does it feel like?",
          paragraphs: [
            "You feel a short, sharp sting that fades quickly. How it feels differs per person and per area; the first time is usually the most sensitive. With regular waxing, hair often grows back finer, so many women find it less intense afterwards.",
          ],
        },
        {
          title: "After your appointment",
          items: [
            "Redness and small bumps around the follicles usually fade within one or two days.",
            "Avoid sun, sauna and intensive exercise on the first day.",
            "Preferably don’t shave between appointments, so your hair growth stays in the same rhythm.",
          ],
        },
        {
          title: "Good to know",
          paragraphs: [
            "If you use prescription retinoids or have recently taken a course of isotretinoin, waxing is not suitable. If you use blood thinners, have diabetes or a skin condition on the area, consult your doctor beforehand and mention it in your request.",
          ],
        },
      ],
      faqs: [
        {
          q: "Which treatment is nice for a first time?",
          a: "It depends on what you want. For intimate waxing the bikini line is a calm first step; for the face many women start with eyebrows or upper lip.",
        },
        {
          q: "How long does the result last?",
          a: "Usually three to five weeks, depending on your hair growth and the area.",
        },
      ],
      treatments: ["bikini-line", "eyebrows", "half-legs"],
      pages: ["preparation", "aftercare", "noord"],
    },
    tr: {
      seoTitle: "İlk kez ağda: nasıl hazırlanılır",
      seoDescription:
        "İlk kez mi ağda yaptıracaksın? Kılların ne uzunlukta olmalı, nasıl hazırlanmalısın, neler beklemelisin ve sonrasında ne yapmalısın, oku. Glow by Dilek, kadınlara özel.",
      hero: {
        eyebrow: "Blog · İlk kez",
        title: "İlk kez ağda:",
        titleEm: "nasıl hazırlanılır.",
        subtitle:
          "Heyecanlı mısın? Gerek yok. Önceden atacağın birkaç basit adım ilk ağda randevunu daha sakin, daha rahat ve daha güzel yapar.",
      },
      sections: [
        {
          title: "Kılların ne uzunlukta olmalı?",
          paragraphs: [
            "Kıllar en az 0,5 cm, yani yaklaşık bir pirinç tanesi uzunluğunda olmalı. Bu genellikle tıraştan iki ila dört hafta sonradır. Daha kısaysa ağda kılı iyi tutamaz; bir santimden çok daha uzunsa önce biraz kısaltılır.",
          ],
        },
        {
          title: "Önceki günler",
          items: [
            "Bir iki gün önce cildine hafif peeling yap, aynı gün yapma.",
            "Randevundan önceki 48 saat güneşlenme ve solaryuma girme.",
            "Bölgede retinol, AHA, BHA ve diğer peeling ürünlerini en az bir hafta önce bırak.",
          ],
        },
        {
          title: "Randevu günü",
          items: [
            "Bakım yapılacak bölgeye vücut losyonu, yağ, deodorant veya bronzlaştırıcı sürme.",
            "Rahat, bol giysiler giy; intim bakımda temiz pamuklu iç çamaşırı.",
            "Tüm sorularını önceden sor: bakım sırasında sakin ve net açıklamalar alırsın.",
          ],
        },
        {
          title: "Nasıl hissettirir?",
          paragraphs: [
            "Kısa, keskin ve çabuk geçen bir acı hissedersin. Bu his kişiden kişiye ve bölgeden bölgeye değişir; ilk sefer genellikle en hassas olanıdır. Düzenli ağdayla kıllar çoğu zaman daha ince çıkar, bu yüzden birçok kadın sonrasında daha az yoğun bulur.",
          ],
        },
        {
          title: "Randevundan sonra",
          items: [
            "Kıl dipleri çevresindeki kızarıklık ve küçük kabarıklıklar genellikle bir iki gün içinde geçer.",
            "İlk gün güneş, sauna ve yoğun spordan kaçın.",
            "İki randevu arasında mümkünse tıraş olma; böylece kıl çıkışın aynı ritimde kalır.",
          ],
        },
        {
          title: "Bilmekte fayda var",
          paragraphs: [
            "Reçeteli retinoid kullanıyorsan ya da yakın zamanda izotretinoin kürü aldıysan ağda uygun değildir. Kan sulandırıcı kullanıyorsan, diyabetin ya da bölgede bir cilt rahatsızlığın varsa önceden doktoruna danış ve talebinde belirt.",
          ],
        },
      ],
      faqs: [
        {
          q: "İlk kez için hangi bakım uygun?",
          a: "Ne istediğine bağlı. İntim ağdada bikini çizgisi sakin bir ilk adımdır; yüzde birçok kadın kaş veya üst dudakla başlar.",
        },
        {
          q: "Sonuç ne kadar kalıcı?",
          a: "Kıl çıkışına ve bölgeye bağlı olarak genellikle üç ila beş hafta.",
        },
      ],
      treatments: ["bikini-line", "eyebrows", "half-legs"],
      pages: ["preparation", "aftercare", "noord"],
    },
  },
  "waxing-or-harsen": {
    nl: {
      seoTitle: "Waxen of harsen: is er een verschil?",
      seoDescription: "Waxen of harsen: twee woorden voor hetzelfde? Lees wat het betekent, hoe lang het resultaat blijft en hoe je je voorbereidt. Glow by Dilek, Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Waxen",
        title: "Waxen of harsen:",
        titleEm: "is er een verschil?",
        subtitle: "In Nederland hoor je allebei. Zo zit het, en dit wil je weten voordat je je eerste afspraak maakt.",
      },
      sections: [
        {
          title: "Twee woorden, één behandeling",
          paragraphs: [
            "In Nederland worden ‘waxen’ en ‘harsen’ allebei gebruikt voor het verwijderen van haar met wax. Bij beide wordt het haar met wortel en al verwijderd, waardoor het resultaat weken meegaat. Bij Glow by Dilek heet het waxen, maar zoek je op harsen, dan bedoel je hetzelfde.",
          ],
        },
        {
          title: "Waarom waxen in plaats van scheren?",
          items: [
            "Het haar wordt met wortel en al verwijderd, dus het groeit langzamer en zachter terug dan na scheren.",
            "Het resultaat blijft meestal drie tot vijf weken, afhankelijk van je haargroei en de zone.",
            "Bij regelmatig waxen groeit het haar vaak fijner en egaler terug.",
            "Geen stugge stoppels die na een paar dagen alweer voelbaar zijn.",
          ],
        },
        {
          title: "Welke zones kun je laten waxen?",
          paragraphs: [
            "Bij Glow by Dilek kun je terecht voor het gezicht (wenkbrauwen, bovenlip, kin, wangen en kaaklijn, hals, volledig gezicht), het lichaam (oksels, armen, benen, rug, buik, borst, decolleté, billen) en de bikinizone (bikinilijn, Hollywood / full Brazilian). Alles uitsluitend voor vrouwen en op afspraak.",
          ],
        },
        {
          title: "Zo bereid je je voor",
          items: [
            "Laat het haar twee tot vier weken groeien, tot minimaal 0,5 cm.",
            "Scrub een of twee dagen van tevoren licht, niet op de dag zelf.",
            "Kom zonder bodylotion, olie of deodorant op de zone.",
          ],
        },
      ],
      faqs: [
        { q: "Is harsen hetzelfde als waxen?", a: "Ja. In Nederland worden beide woorden gebruikt voor het verwijderen van haar met wax." },
        { q: "Hoe vaak moet je harsen of waxen?", a: "Voor de meeste zones is elke vier tot zes weken een prettig ritme." },
      ],
      treatments: ["half-legs", "underarms", "bikini-line"],
      pages: ["treatments", "prices", "preparation"],
    },
    en: {
      seoTitle: "Waxen or harsen: what do the Dutch words mean?",
      seoDescription: "Waxen or harsen? Both Dutch words mean hair removal with wax. Learn how long results last and how to prepare. Glow by Dilek, women-only, Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Waxing",
        title: "Waxen or harsen:",
        titleEm: "what’s the difference?",
        subtitle: "In the Netherlands you hear both words. Here is what they mean, and what to know before your first appointment.",
      },
      sections: [
        {
          title: "Two words, one treatment",
          paragraphs: [
            "In Dutch, ‘waxen’ and ‘harsen’ are both used for hair removal with wax. In both cases the hair is removed from the root, so the result lasts for weeks. At Glow by Dilek it is called waxing, but if you search for harsen, you mean the same thing.",
          ],
        },
        {
          title: "Why wax instead of shaving?",
          items: [
            "Hair is removed from the root, so it grows back more slowly and softer than after shaving.",
            "The result usually lasts three to five weeks, depending on your hair growth and the area.",
            "With regular waxing, hair often grows back finer and more even.",
            "No stubble that you can feel again after a few days.",
          ],
        },
        {
          title: "Which areas can you have waxed?",
          paragraphs: [
            "At Glow by Dilek you can book the face (eyebrows, upper lip, chin, cheeks and jawline, neck, full face), the body (underarms, arms, legs, back, belly, chest, décolletage, buttocks) and the bikini area (bikini line, Hollywood / full Brazilian). All for women only and by appointment.",
          ],
        },
        {
          title: "How to prepare",
          items: [
            "Let the hair grow for two to four weeks, to at least 0.5 cm.",
            "Exfoliate lightly one or two days before, not on the day itself.",
            "Come without body lotion, oil or deodorant on the area.",
          ],
        },
      ],
      faqs: [
        { q: "Is harsen the same as waxing?", a: "Yes. In Dutch both words are used for hair removal with wax." },
        { q: "How often should you wax?", a: "For most areas, every four to six weeks is a comfortable rhythm." },
      ],
      treatments: ["half-legs", "underarms", "bikini-line"],
      pages: ["treatments", "prices", "preparation"],
    },
    tr: {
      seoTitle: "Waxen mi harsen mi: fark var mı?",
      seoDescription: "Hollanda'da waxen ve harsen aynı anlama gelir: ağdayla tüy alma. Sonucun ne kadar kaldığını ve nasıl hazırlanacağını oku. Amsterdam-Noord'dan Glow by Dilek.",
      hero: {
        eyebrow: "Blog · Ağda",
        title: "Waxen mi harsen mi:",
        titleEm: "fark var mı?",
        subtitle: "Hollanda'da iki kelimeyi de duyarsın. Ne anlama geldiklerini ve ilk randevundan önce bilmen gerekenleri oku.",
      },
      sections: [
        {
          title: "İki kelime, tek bakım",
          paragraphs: [
            "Felemenkçede ‘waxen’ ve ‘harsen’ ikisi de ağdayla tüy almayı anlatır. İkisinde de kıl kökünden alınır, bu yüzden sonuç haftalarca sürer. Glow by Dilek'te buna waxen denir; harsen diye arıyorsan aynı şeyi kastediyorsun.",
          ],
        },
        {
          title: "Neden tıraş yerine ağda?",
          items: [
            "Kıl kökünden alınır; tıraştan sonra olduğundan daha yavaş ve daha yumuşak çıkar.",
            "Sonuç kıl çıkışına ve bölgeye göre genellikle üç ila beş hafta kalır.",
            "Düzenli ağdayla kıllar çoğu zaman daha ince ve düzgün çıkar.",
          ],
        },
        {
          title: "Hangi bölgeler yapılır?",
          paragraphs: [
            "Glow by Dilek'te yüz (kaş, üst dudak, çene, yanak ve çene hattı, boyun, tüm yüz), vücut (koltuk altı, kollar, bacaklar, sırt, karın, göğüs, dekolte, kalça) ve bikini bölgesi (bikini çizgisi, Hollywood / full Brazilian) yapılır. Hepsi yalnızca kadınlara ve randevuyla.",
          ],
        },
        {
          title: "Nasıl hazırlanırsın",
          items: [
            "Kılları iki ila dört hafta, en az 0,5 cm olana kadar uzat.",
            "Bir iki gün önce hafif peeling yap, aynı gün yapma.",
            "Bölgeye losyon, yağ veya deodorant sürmeden gel.",
          ],
        },
      ],
      faqs: [
        { q: "Harsen ile waxen aynı mı?", a: "Evet. Felemenkçede iki kelime de ağdayla tüy almayı anlatır." },
        { q: "Ne sıklıkla ağda yapılmalı?", a: "Çoğu bölge için dört ila altı haftada bir rahat bir aralıktır." },
      ],
      treatments: ["half-legs", "underarms", "bikini-line"],
      pages: ["treatments", "prices", "preparation"],
    },
  },

  "leg-waxing": {
    nl: {
      seoTitle: "Benen waxen: onderbenen of hele benen?",
      seoDescription: "Onderbenen, bovenbenen of hele benen waxen? Lees wat het verschil is, hoe je je voorbereidt en hoe je je huid daarna verzorgt. Alleen voor vrouwen, Amsterdam.",
      hero: {
        eyebrow: "Blog · Benen waxen",
        title: "Onderbenen, bovenbenen",
        titleEm: "of hele benen?",
        subtitle: "Gladde benen voor weken, zonder stoppels. Zo kies je de juiste zone en bereid je je goed voor.",
      },
      sections: [
        {
          title: "Welke zone kies je?",
          items: [
            "Onderbenen: van enkel tot net boven de knie. Een goede keuze als je vooral je onderbenen bloot draagt.",
            "Bovenbenen: van de knie tot de bikinilijn, aan de voor-, achter- en binnenkant.",
            "Hele benen: onder- en bovenbenen samen, voor helemaal gladde benen.",
          ],
        },
        {
          title: "Zo verloopt de afspraak",
          paragraphs: [
            "De huid wordt gereinigd en de wax wordt baan voor baan aangebracht, met de haargroei mee. Rond de knie, waar de huid beweegt, wordt extra rustig gewerkt. Daarna worden losse haartjes nagelopen en krijgt je huid een verzachtende verzorging.",
          ],
        },
        {
          title: "Zo bereid je je voor",
          items: [
            "Laat het haar twee tot vier weken groeien, tot minimaal 0,5 cm.",
            "Scrub een of twee dagen van tevoren licht.",
            "Ga 48 uur van tevoren niet zonnebaden en kom zonder bodylotion of olie.",
            "Draag ruime kleding, zodat er na de behandeling niets schuurt.",
          ],
        },
        {
          title: "Na het waxen",
          items: [
            "Vermijd 24 uur lang zon, zonnebank, sauna, hete douches en strakke broeken.",
            "Houd de huid soepel met een milde, ongeparfumeerde crème.",
            "Begin na twee dagen met af en toe mild scrubben tegen ingegroeide haartjes.",
            "Scheer liever niet tussen twee afspraken; zo blijft je haargroei in hetzelfde ritme.",
          ],
        },
      ],
      faqs: [
        { q: "Hoe lang blijven mijn benen glad?", a: "Meestal drie tot vijf weken, afhankelijk van je haargroei." },
        { q: "Kan ik benen combineren met een bikinibehandeling?", a: "Ja. Kies in je aanvraag beide behandelingen; Dilek plant ze samen in." },
      ],
      treatments: ["half-legs", "upper-legs", "full-legs"],
      pages: ["prices", "aftercare", "noord"],
    },
    en: {
      seoTitle: "Leg waxing: lower legs, upper legs or full legs?",
      seoDescription: "Lower legs, upper legs or full legs? Learn the difference, how to prepare and how to care for your skin afterwards. Women-only leg waxing in Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Leg waxing",
        title: "Lower legs, upper legs",
        titleEm: "or full legs?",
        subtitle: "Smooth legs for weeks, without stubble. Here is how to choose the right area and prepare well.",
      },
      sections: [
        {
          title: "Which area do you choose?",
          items: [
            "Lower legs: from ankle to just above the knee. A good choice if it is mainly your lower legs that show.",
            "Upper legs: from the knee to the bikini line, at the front, back and inside.",
            "Full legs: lower and upper legs together, for completely smooth legs.",
          ],
        },
        {
          title: "How the appointment goes",
          paragraphs: [
            "The skin is cleansed and the wax is applied strip by strip, with the direction of hair growth. Around the knee, where the skin moves, the work is done extra calmly. Stray hairs are then tidied and your skin receives a soothing finish.",
          ],
        },
        {
          title: "How to prepare",
          items: [
            "Let the hair grow for two to four weeks, to at least 0.5 cm.",
            "Exfoliate lightly one or two days before.",
            "Avoid sunbathing for 48 hours before and come without body lotion or oil.",
            "Wear loose clothing so nothing rubs after the treatment.",
          ],
        },
        {
          title: "After waxing",
          items: [
            "Avoid sun, sunbeds, sauna, hot showers and tight trousers for 24 hours.",
            "Keep the skin supple with a mild, unscented cream.",
            "Start gentle exfoliation now and then after two days to prevent ingrown hairs.",
            "Preferably don’t shave between appointments, so your hair growth stays in the same rhythm.",
          ],
        },
      ],
      faqs: [
        { q: "How long do my legs stay smooth?", a: "Usually three to five weeks, depending on your hair growth." },
        { q: "Can I combine legs with a bikini treatment?", a: "Yes. Choose both treatments in your request; Dilek schedules them together." },
      ],
      treatments: ["half-legs", "upper-legs", "full-legs"],
      pages: ["prices", "aftercare", "noord"],
    },
    tr: {
      seoTitle: "Bacak ağdası: alt bacak, üst bacak mı tüm bacak mı?",
      seoDescription: "Alt bacak, üst bacak ya da tüm bacak ağdası? Farkı, nasıl hazırlanacağını ve sonrasında cildine nasıl bakacağını oku. Amsterdam'da kadınlara özel.",
      hero: {
        eyebrow: "Blog · Bacak ağdası",
        title: "Alt bacak, üst bacak",
        titleEm: "mı tüm bacak mı?",
        subtitle: "Haftalarca pürüzsüz bacaklar. Doğru bölgeyi seçmek ve iyi hazırlanmak için ipuçları.",
      },
      sections: [
        {
          title: "Hangi bölgeyi seçmeli?",
          items: [
            "Alt bacak: bilekten dizin hemen üstüne kadar.",
            "Üst bacak: dizden bikini çizgisine kadar; ön, arka ve iç taraf.",
            "Tüm bacak: alt ve üst bacak birlikte, tamamen pürüzsüz bacaklar için.",
          ],
        },
        {
          title: "Randevu nasıl geçer",
          paragraphs: [
            "Cilt temizlenir ve ağda kıl yönünde şerit şerit sürülür. Dizin çevresinde, cildin hareket ettiği yerde daha da sakin çalışılır. Ardından tek tük kıllar düzeltilir ve cilt yatıştırılır.",
          ],
        },
        {
          title: "Hazırlık ve sonrası",
          items: [
            "Kılları iki ila dört hafta, en az 0,5 cm olana kadar uzat; bir iki gün önce hafif peeling yap.",
            "48 saat önce güneşlenme; losyon veya yağ sürmeden gel.",
            "24 saat güneş, sauna, sıcak duş ve dar pantolondan kaçın.",
            "İki gün sonra batık kıllara karşı hafif peelinge başla; aralarda tıraş olmamaya çalış.",
          ],
        },
      ],
      faqs: [
        { q: "Bacaklarım ne kadar pürüzsüz kalır?", a: "Kıl çıkışına göre genellikle üç ila beş hafta." },
        { q: "Bacak ağdasını bikini bakımıyla birleştirebilir miyim?", a: "Evet. Talebinde ikisini seç; Dilek birlikte planlar." },
      ],
      treatments: ["half-legs", "upper-legs", "full-legs"],
      pages: ["prices", "aftercare", "noord"],
    },
  },

  "arm-back-waxing": {
    nl: {
      seoTitle: "Armen en rug waxen voor vrouwen: zo werkt het",
      seoDescription: "Onderarmen, bovenarmen, hele armen of rug laten waxen? Lees wat er gebeurt, hoe je je voorbereidt en wat je daarna doet. Alleen voor vrouwen, Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Armen en rug",
        title: "Armen en rug waxen",
        titleEm: "voor vrouwen.",
        subtitle: "Ook fijn of licht haar op armen en rug kan prima worden gewaxt. Zo werkt het, rustig en discreet.",
      },
      sections: [
        {
          title: "Armen: welke zone?",
          items: [
            "Onderarmen: van pols tot net boven de elleboog.",
            "Bovenarmen: van elleboog tot schouder.",
            "Hele armen: onder- en bovenarmen samen.",
            "Licht of fijn armhaar kan ook worden gewaxt, zolang het lang genoeg is.",
          ],
        },
        {
          title: "Rug waxen voor vrouwen",
          paragraphs: [
            "Veel vrouwen hebben fijne haartjes op de rug, bijvoorbeeld onderaan de rug of tussen de schouderbladen. Op de rug kun je zelf moeilijk bij, dus waxen is een praktische oplossing. Je bespreekt vooraf welk deel van de rug je wilt laten doen.",
          ],
        },
        {
          title: "Voorbereiding",
          items: [
            "Laat het haar twee tot vier weken groeien, tot minimaal 0,5 cm.",
            "Ga 48 uur van tevoren niet zonnebaden; kom zonder bodylotion of olie.",
            "Draag een top of shirt dat je makkelijk uit en aan doet.",
          ],
        },
        {
          title: "Nazorg",
          items: [
            "Vermijd 24 uur lang zon, zonnebank, sauna en hete douches.",
            "Draag ruime kleding op de behandelde huid.",
            "Begin na twee dagen met af en toe mild scrubben.",
          ],
        },
      ],
      faqs: [
        { q: "Wordt armhaar dikker als ik ermee begin?", a: "Nee. Bij regelmatig waxen groeit het haar vaak juist fijner en egaler terug." },
        { q: "Kan ik mijn rug laten waxen als vrouw?", a: "Ja, natuurlijk. Glow by Dilek is uitsluitend voor vrouwen; je bespreekt vooraf welk deel van de rug je wilt laten doen." },
      ],
      treatments: ["half-arms", "upper-arms", "back"],
      pages: ["prices", "preparation", "noord"],
    },
    en: {
      seoTitle: "Arm and back waxing for women: how it works",
      seoDescription: "Forearms, upper arms, full arms or back waxing? Learn what happens, how to prepare and what to do afterwards. Women-only waxing in Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Arms and back",
        title: "Arm and back waxing",
        titleEm: "for women.",
        subtitle: "Fine or light hair on arms and back can be waxed too. Here is how it works, calmly and discreetly.",
      },
      sections: [
        {
          title: "Arms: which area?",
          items: [
            "Forearms: from wrist to just above the elbow.",
            "Upper arms: from elbow to shoulder.",
            "Full arms: forearms and upper arms together.",
            "Light or fine arm hair can be waxed too, as long as it is long enough.",
          ],
        },
        {
          title: "Back waxing for women",
          paragraphs: [
            "Many women have fine hairs on the back, for example on the lower back or between the shoulder blades. You can hardly reach your own back, so waxing is a practical solution. You agree beforehand which part of the back you want done.",
          ],
        },
        {
          title: "Preparation",
          items: [
            "Let the hair grow for two to four weeks, to at least 0.5 cm.",
            "Avoid sunbathing for 48 hours before; come without body lotion or oil.",
            "Wear a top that is easy to take off and put on.",
          ],
        },
        {
          title: "Aftercare",
          items: [
            "Avoid sun, sunbeds, sauna and hot showers for 24 hours.",
            "Wear loose clothing on the treated skin.",
            "Start gentle exfoliation now and then after two days.",
          ],
        },
      ],
      faqs: [
        { q: "Does arm hair get thicker once I start waxing?", a: "No. With regular waxing, hair often grows back finer and more even." },
        { q: "Can I have my back waxed as a woman?", a: "Yes, of course. Glow by Dilek is for women only; you agree beforehand which part of the back you want done." },
      ],
      treatments: ["half-arms", "upper-arms", "back"],
      pages: ["prices", "preparation", "noord"],
    },
    tr: {
      seoTitle: "Kadınlar için kol ve sırt ağdası: nasıl yapılır",
      seoDescription: "Ön kol, üst kol, tüm kol ya da sırt ağdası? Ne yapıldığını, nasıl hazırlanacağını ve sonrasında ne yapacağını oku. Amsterdam-Noord'da kadınlara özel.",
      hero: {
        eyebrow: "Blog · Kol ve sırt",
        title: "Kadınlar için",
        titleEm: "kol ve sırt ağdası.",
        subtitle: "Kollardaki ve sırttaki ince ya da açık renkli tüyler de ağdayla alınabilir. Sakin ve gizlilik içinde nasıl yapıldığını oku.",
      },
      sections: [
        {
          title: "Kollar: hangi bölge?",
          items: [
            "Ön kol: bilekten dirseğin hemen üstüne kadar.",
            "Üst kol: dirsekten omza kadar.",
            "Tüm kol: ön ve üst kol birlikte.",
            "Açık renkli veya ince kol tüyleri de yeterince uzunsa ağdayla alınabilir.",
          ],
        },
        {
          title: "Kadınlar için sırt ağdası",
          paragraphs: [
            "Birçok kadının sırtında, örneğin bel kısmında veya kürek kemiklerinin arasında ince tüyler olur. Kendi sırtına ulaşmak zor olduğundan ağda pratik bir çözümdür. Sırtın hangi kısmının yapılacağını önceden konuşursunuz.",
          ],
        },
        {
          title: "Hazırlık ve sonrası",
          items: [
            "Kılları iki ila dört hafta, en az 0,5 cm olana kadar uzat.",
            "48 saat önce güneşlenme; losyon veya yağ sürmeden gel.",
            "24 saat güneş, solaryum, sauna ve sıcak duştan kaçın; bol giysiler giy.",
            "İki gün sonra ara sıra hafif peeling yap.",
          ],
        },
      ],
      faqs: [
        { q: "Ağdaya başlayınca kol tüyleri kalınlaşır mı?", a: "Hayır. Düzenli ağdayla kıllar çoğu zaman daha ince ve düzgün çıkar." },
        { q: "Kadın olarak sırt ağdası yaptırabilir miyim?", a: "Elbette. Glow by Dilek yalnızca kadınlara hizmet verir; sırtın hangi kısmının yapılacağını önceden konuşursunuz." },
      ],
      treatments: ["half-arms", "upper-arms", "back"],
      pages: ["prices", "preparation", "noord"],
    },
  },

  "facial-and-head-massage": {
    nl: {
      seoTitle: "Gezichtsmassage en hoofdmassage: zo werkt het",
      seoDescription: "Wat is een gezichtsmassage of hoofdmassage en wat kun je verwachten? Lees hoe de afspraak verloopt en wat je vooraf bespreekt. Alleen voor vrouwen, Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Massage",
        title: "Gezichtsmassage en hoofdmassage:",
        titleEm: "wat kun je verwachten?",
        subtitle: "Een rustig moment voor jezelf, met een aanraking die voor jou prettig voelt. Zo verloopt het.",
      },
      sections: [
        {
          title: "Gezichtsmassage",
          paragraphs: [
            "Een gezichtsmassage is een zachte, ontspannende verzorging met de aandacht op je gezicht. Vooraf vertel je hoe je huid zich voelt en of je ergens gevoelig voor bent, en bespreek je of hals en decolleté erbij horen. Make-up wordt eerst verwijderd, zodat de massage rustig kan beginnen.",
          ],
        },
        {
          title: "Hoofdmassage",
          paragraphs: [
            "Een hoofdmassage is een ontspannende massage van het hoofd. Vooraf bespreek je of de hoofdhuid erbij hoort en of nek en schouders aandacht mogen krijgen. Het is een ontspanningsmoment, geen haarbehandeling.",
          ],
        },
        {
          title: "Massage of gezichtsbehandeling?",
          paragraphs: [
            "Wil je naast ontspanning ook dat je huid grondig wordt gereinigd? Kies dan de dieptereinigende gezichtsbehandeling: daarin zitten onder meer stoom, een masker en ook een gezichtsmassage.",
          ],
        },
        {
          title: "Goed om te weten",
          items: [
            "Praten mag, stil zijn ook: jij bepaalt de sfeer.",
            "Je kunt altijd aangeven of je meer of minder druk wilt, of wilt pauzeren.",
            "Meld vooraf een gevoelige huid of hoofdhuid, allergieën of een recente behandeling.",
            "Een ontspanningsmassage is geen medische of therapeutische behandeling; er worden geen resultaten beloofd.",
          ],
        },
      ],
      faqs: [
        { q: "Is een gezichtsmassage hetzelfde als een gezichtsbehandeling?", a: "Nee. De massage is een ontspannend verzorgingsmoment; de dieptereinigende gezichtsbehandeling reinigt en verzorgt je huid in tien stappen." },
        { q: "Wordt bij een hoofdmassage mijn haar behandeld?", a: "Nee, het is een ontspannende massage en geen haarbehandeling." },
      ],
      treatments: ["massage-face", "massage-head", "facial-deep-cleansing"],
      pages: ["prices", "booking", "noord"],
    },
    en: {
      seoTitle: "Facial massage and head massage: what to expect",
      seoDescription: "What is a facial massage or head massage and what can you expect? Read how the appointment goes and what you discuss beforehand. Women only, Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Massage",
        title: "Facial and head massage:",
        titleEm: "what to expect.",
        subtitle: "A calm moment for yourself, with a touch that feels comfortable to you. Here is how it goes.",
      },
      sections: [
        {
          title: "Facial massage",
          paragraphs: [
            "A facial massage is gentle, relaxing care focused on your face. Beforehand you share how your skin feels and whether you are sensitive to anything, and you discuss whether the neck and décolleté are included. Make-up is removed first so the massage can begin calmly.",
          ],
        },
        {
          title: "Head massage",
          paragraphs: [
            "A head massage is a relaxing massage of the head. Beforehand you discuss whether the scalp is included and whether the neck and shoulders may receive attention. It is a moment of relaxation, not a hair treatment.",
          ],
        },
        {
          title: "Massage or facial?",
          paragraphs: [
            "Would you like your skin to be thoroughly cleansed as well as relaxing? Then choose the deep cleansing facial: it includes steam, a mask and a facial massage, among other steps.",
          ],
        },
        {
          title: "Good to know",
          items: [
            "Talking is fine, and so is silence: you set the mood.",
            "You can always ask for more or less pressure, or a pause.",
            "Mention sensitive skin or scalp, allergies or a recent treatment beforehand.",
            "A relaxation massage is not a medical or therapeutic treatment; no results are promised.",
          ],
        },
      ],
      faqs: [
        { q: "Is a facial massage the same as a facial?", a: "No. The massage is a relaxing moment of care; the deep cleansing facial cleanses and cares for your skin in ten steps." },
        { q: "Is my hair treated during a head massage?", a: "No, it is a relaxing massage, not a hair treatment." },
      ],
      treatments: ["massage-face", "massage-head", "facial-deep-cleansing"],
      pages: ["prices", "booking", "noord"],
    },
    tr: {
      seoTitle: "Yüz masajı ve baş masajı: neler beklemelisin?",
      seoDescription: "Yüz masajı ya da baş masajı nedir, neler beklemelisin? Randevunun nasıl geçtiğini ve önceden neleri konuştuğunu oku. Kadınlara özel, Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Masaj",
        title: "Yüz ve baş masajı:",
        titleEm: "neler beklemelisin?",
        subtitle: "Kendin için sakin bir an; sana iyi gelen bir dokunuşla. Nasıl geçtiğini oku.",
      },
      sections: [
        {
          title: "Yüz masajı",
          paragraphs: [
            "Yüz masajı, yüzüne odaklanan nazik ve rahatlatıcı bir bakımdır. Önceden cildinin nasıl hissettiğini ve hassasiyetlerini anlatır, boyun ve dekoltenin dahil olup olmayacağını konuşursunuz. Masaj sakince başlayabilsin diye önce makyaj temizlenir.",
          ],
        },
        {
          title: "Baş masajı",
          paragraphs: [
            "Baş masajı, başa yapılan rahatlatıcı bir masajdır. Saçlı derinin dahil olup olmayacağını ve boyun ile omuzlara da ilgi gösterilip gösterilmeyeceğini önceden konuşursunuz. Bu bir saç bakımı değil, bir rahatlama anıdır.",
          ],
        },
        {
          title: "Masaj mı yüz bakımı mı?",
          paragraphs: [
            "Rahatlamanın yanında cildinin de derinlemesine temizlenmesini istiyorsan derin temizleyici yüz bakımını seç: buhar, maske ve yüz masajı da dahil olmak üzere on adımdan oluşur.",
          ],
        },
        {
          title: "Bilmekte fayda var",
          items: [
            "Sohbet edebilirsin, sessiz de kalabilirsin: ortamı sen belirlersin.",
            "Baskının artırılmasını veya azaltılmasını ya da ara verilmesini her zaman isteyebilirsin.",
            "Hassas cilt veya saçlı deri, alerji ya da yakın zamanda yapılan bir uygulamayı önceden belirt.",
            "Rahatlama masajı tıbbi veya terapötik bir uygulama değildir; sonuç vaat edilmez.",
          ],
        },
      ],
      faqs: [
        { q: "Yüz masajı yüz bakımıyla aynı mı?", a: "Hayır. Masaj rahatlatıcı bir bakım anıdır; derin temizleyici yüz bakımı cildini on adımda temizler ve besler." },
        { q: "Baş masajında saçıma bir işlem yapılır mı?", a: "Hayır, bu rahatlatıcı bir masajdır, saç bakımı değildir." },
      ],
      treatments: ["massage-face", "massage-head", "facial-deep-cleansing"],
      pages: ["prices", "booking", "noord"],
    },
  },

  "deep-cleansing-facial-steps": {
    nl: {
      seoTitle: "Dieptereinigende gezichtsbehandeling: 10 stappen",
      seoDescription: "Wat gebeurt er bij een dieptereinigende gezichtsbehandeling? De tien stappen, de voordelen en je voorbereiding. Alleen voor vrouwen, Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Gezichtsbehandeling",
        title: "Dieptereinigende gezichtsbehandeling:",
        titleEm: "de tien stappen.",
        subtitle: "Van huidanalyse en stoom tot masker, massage en zonbescherming: zo verloopt een dieptereiniging bij Glow by Dilek.",
      },
      sections: [
        {
          title: "De tien stappen",
          items: [
            "Huidanalyse en de keuze van de verzorging die past bij jouw huidtype.",
            "Make-up, dagelijks vuil en onzuiverheden worden verwijderd.",
            "Een peeling verwijdert dode huidcellen.",
            "Stoom maakt de poriën zachter en bereidt de huid voor op de reiniging.",
            "Mee-eters en milia (gerstekorrels) worden verwijderd.",
            "Passende serums en verzorgingsproducten worden aangebracht.",
            "Een ontspannend en hydraterend gezichtsmasker.",
            "Een gezichtsmassage, voor ontspanning en verzorging.",
            "Intensieve hydraterende en voedende verzorging.",
            "Je huid wordt afgesloten met een zonnebescherming.",
          ],
        },
        {
          title: "De voordelen",
          items: [
            "Een schonere en gezuiverde huid.",
            "Een zachtere en gladdere uitstraling.",
            "Een gehydrateerde, frisse en stralende huid.",
            "Verzorging die helpt je poriën te reinigen.",
            "Een heerlijk ontspannen moment voor jezelf.",
          ],
        },
        {
          title: "Goed om te weten",
          items: [
            "Kom gerust met make-up: die wordt aan het begin verwijderd.",
            "Meld vooraf een gevoelige huid, allergieën, een recente huidbehandeling of gevoeligheid voor warmte.",
            "Na stoom en het verwijderen van mee-eters kan je huid even rood of warm aanvoelen; dat trekt meestal snel weg.",
            "Dit is een verzorgende, geen medische behandeling; resultaten verschillen per huid.",
          ],
        },
      ],
      faqs: [
        { q: "Is stoom onderdeel van de behandeling?", a: "Ja. Stoom maakt de poriën zachter en bereidt de huid voor op de reiniging. Ben je gevoelig voor warmte, meld het dan vooraf." },
        { q: "Is de behandeling geschikt voor mijn huidtype?", a: "De behandeling begint met een huidanalyse en wordt afgestemd op jouw huidtype en wat je huid nodig heeft." },
      ],
      treatments: ["facial-deep-cleansing", "brow-lash-tint", "massage-face"],
      pages: ["prices", "booking", "noord"],
    },
    en: {
      seoTitle: "Deep cleansing facial: the 10 steps",
      seoDescription: "What happens during a deep cleansing facial with steam? Read the ten steps, the benefits and how to prepare. Women-only beauty salon in Amsterdam-Noord.",
      hero: {
        eyebrow: "Blog · Facial",
        title: "Deep cleansing facial:",
        titleEm: "the ten steps.",
        subtitle: "From skin analysis and steam to mask, massage and sun protection: this is how a deep cleanse goes at Glow by Dilek.",
      },
      sections: [
        {
          title: "The ten steps",
          items: [
            "Skin analysis and a choice of care that suits your skin type.",
            "Make-up, everyday dirt and impurities are removed.",
            "An exfoliation removes dead skin cells.",
            "Steam softens the pores and prepares the skin for cleansing.",
            "Blackheads and milia are removed.",
            "Suitable serums and skincare products are applied.",
            "A relaxing, hydrating face mask.",
            "A facial massage, for relaxation and care.",
            "Intensive hydrating and nourishing care.",
            "Your skin is finished with sun protection.",
          ],
        },
        {
          title: "The benefits",
          items: [
            "Cleaner, purified skin.",
            "A softer, smoother appearance.",
            "Hydrated, fresh and radiant-looking skin.",
            "Care that helps cleanse your pores.",
            "A lovely relaxing moment for yourself.",
          ],
        },
        {
          title: "Good to know",
          items: [
            "Feel free to come with make-up: it is removed at the start.",
            "Mention sensitive skin, allergies, a recent skin treatment or sensitivity to heat beforehand.",
            "After steam and blackhead removal your skin may feel a little red or warm; this usually fades quickly.",
            "This is a caring, not a medical treatment; results differ per skin.",
          ],
        },
      ],
      faqs: [
        { q: "Is steam part of the treatment?", a: "Yes. Steam softens the pores and prepares the skin for cleansing. If you are sensitive to heat, mention it beforehand." },
        { q: "Is the treatment suitable for my skin type?", a: "The treatment starts with a skin analysis and is tailored to your skin type and what your skin needs." },
      ],
      treatments: ["facial-deep-cleansing", "brow-lash-tint", "massage-face"],
      pages: ["prices", "booking", "noord"],
    },
    tr: {
      seoTitle: "Derin temizleyici yüz bakımı: 10 adım",
      seoDescription: "Buharlı derin temizleyici yüz bakımında neler yapılır? On adımı, faydalarını ve nasıl hazırlanacağını oku. Amsterdam-Noord'da kadınlara özel güzellik salonu.",
      hero: {
        eyebrow: "Blog · Yüz bakımı",
        title: "Derin temizleyici yüz bakımı:",
        titleEm: "on adım.",
        subtitle: "Cilt analizinden ve buhardan maskeye, masaja ve güneş korumasına: Glow by Dilek'te derin temizlik böyle yapılır.",
      },
      sections: [
        {
          title: "On adım",
          items: [
            "Cilt analizi ve cilt tipine uygun bakımın seçilmesi.",
            "Makyaj, günlük kir ve kirliliklerin temizlenmesi.",
            "Peeling ile ölü hücrelerin arındırılması.",
            "Buharla gözeneklerin yumuşatılması ve cildin temizliğe hazırlanması.",
            "Siyah nokta ve milia (yağ bezecikleri) temizliği.",
            "Uygun serum ve bakım ürünlerinin uygulanması.",
            "Rahatlatıcı ve nemlendirici yüz maskesi.",
            "Rahatlama ve bakım için yüz masajı.",
            "Yoğun nemlendirici ve besleyici bakım.",
            "Güneş koruyucu ile bakımın tamamlanması.",
          ],
        },
        {
          title: "Faydaları",
          items: [
            "Daha temiz ve arınmış bir cilt.",
            "Daha yumuşak ve pürüzsüz bir görünüm.",
            "Nemlenmiş, taze ve ışıltılı bir cilt.",
            "Gözeneklerin temizlenmesine yardımcı bakım.",
            "Kendine ayırdığın keyifli ve rahatlatıcı bir an.",
          ],
        },
        {
          title: "Bilmekte fayda var",
          items: [
            "Makyajlı gelebilirsin: başta temizlenir.",
            "Hassas cilt, alerji, yakın zamanda yapılan bir cilt uygulaması veya sıcağa hassasiyetini önceden belirt.",
            "Buhar ve siyah nokta temizliğinden sonra cildin biraz kızarık veya sıcak hissedebilir; genellikle çabuk geçer.",
            "Bu tıbbi değil, bakım amaçlı bir uygulamadır; sonuçlar cilde göre değişir.",
          ],
        },
      ],
      faqs: [
        { q: "Buhar bakımın bir parçası mı?", a: "Evet. Buhar gözenekleri yumuşatır ve cildi temizliğe hazırlar. Sıcağa hassassan önceden belirt." },
        { q: "Bakım cilt tipime uygun mu?", a: "Bakım cilt analiziyle başlar ve cilt tipine ve cildinin ihtiyacına göre ayarlanır." },
      ],
      treatments: ["facial-deep-cleansing", "brow-lash-tint", "massage-face"],
      pages: ["prices", "booking", "noord"],
    },
  },
};

export function noordCopy(locale: Locale): ArticleCopy {
  return noord[locale];
}

export function postCopy(locale: Locale, id: PostId): ArticleCopy {
  return posts[id][locale];
}
