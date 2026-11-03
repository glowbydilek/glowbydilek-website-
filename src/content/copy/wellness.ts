import type { Locale } from "@/i18n/config";
import type { SectionCopy, TreatmentCopy } from "./types";

/**
 * Massages and facial care with steam — the services the owner confirmed in
 * November 2026 — in Dutch, English and Turkish side by side, so the three
 * languages stay equivalent. Based on the owner's draft service copy.
 *
 * Deliberately NOT stated: techniques, pressure styles, oils or brands,
 * durations, prices, devices or models, and any health, therapeutic,
 * circulation, drainage or anti-ageing effect. A beauty/relaxation
 * treatment is not a medical treatment. Owner review before final launch.
 */

type T = Record<Locale, TreatmentCopy>;

const notMedical: Record<Locale, string> = {
  nl: "Twijfel je of een massage bij je past, bijvoorbeeld door klachten, een blessure, een aandoening of zwangerschap? Overleg dan eerst met je huisarts of verloskundige. Een ontspanningsmassage is geen medische of therapeutische behandeling.",
  en: "Unsure whether a massage suits you, for example because of complaints, an injury, a condition or pregnancy? Check with your GP or midwife first. A relaxation massage is not a medical or therapeutic treatment.",
  tr: "Bir şikâyet, sakatlık, rahatsızlık ya da hamilelik nedeniyle masajın sana uygun olup olmadığından emin değil misin? Önce aile hekimine veya ebene danış. Rahatlama masajı tıbbi veya terapötik bir uygulama değildir.",
};
const stopAnyTime: Record<Locale, string> = {
  nl: "Je kunt tijdens de behandeling altijd aangeven of je meer of minder druk wilt, even wilt pauzeren of wilt stoppen.",
  en: "During the treatment you can always ask for more or less pressure, a pause or to stop.",
  tr: "Uygulama sırasında baskının artırılmasını veya azaltılmasını, ara verilmesini ya da işlemin durdurulmasını istediğin zaman söyleyebilirsin.",
};
const takeItEasy: Record<Locale, string> = {
  nl: "Neem na afloop even de tijd voordat je verdergaat met je dag, en drink wat water.",
  en: "Take a moment afterwards before you carry on with your day, and drink some water.",
  tr: "Sonrasında gününe devam etmeden önce biraz zaman tanı ve bir miktar su iç.",
};
const priceQ: Record<Locale, { q: string; a: string }> = {
  nl: { q: "Wat kost het en hoe lang duurt het?", a: "Het tarief en de duur hoor je persoonlijk bij je aanvraag. Zodra ze vastliggen, staan ze ook op de pagina Tarieven." },
  en: { q: "What does it cost and how long does it take?", a: "You hear the price and duration personally when you send your request. Once they are fixed, they also appear on the Prices page." },
  tr: { q: "Fiyatı nedir, ne kadar sürer?", a: "Fiyatı ve süreyi talebini gönderdiğinde kişisel olarak öğrenirsin. Kesinleştiklerinde Fiyatlar sayfasında da yer alırlar." },
};
const womenOnly: Record<Locale, { q: string; a: string }> = {
  nl: { q: "Is dit alleen voor vrouwen?", a: "Ja. Glow by Dilek ontvangt uitsluitend vrouwen, op afspraak." },
  en: { q: "Is this for women only?", a: "Yes. Glow by Dilek welcomes women only, by appointment." },
  tr: { q: "Bu yalnızca kadınlar için mi?", a: "Evet. Glow by Dilek yalnızca kadınlara, randevuyla hizmet verir." },
};

function massage(
  l: Locale,
  c: { seoTitle: string; seoDescription: string; title: string; lead: string; teaser: string; area: string; appointment: string[]; know: string[]; faq: { q: string; a: string } },
): TreatmentCopy {
  return {
    seoTitle: c.seoTitle,
    seoDescription: c.seoDescription,
    title: c.title,
    lead: c.lead,
    teaser: c.teaser,
    areaTitle: { nl: "Wat houdt de massage in?", en: "What does the massage involve?", tr: "Masaj neleri kapsar?" }[l],
    area: c.area,
    appointment: [...c.appointment, stopAnyTime[l]],
    know: c.know,
    reactions: [notMedical[l]],
    aftercare: [takeItEasy[l]],
    recovery: {
      nl: "Je kunt na de massage gewoon verder met je dag. Plan er bij voorkeur geen haast direct achteraan, zodat je de rust nog even kunt vasthouden.",
      en: "You can carry on with your day after the massage. Preferably don't plan anything rushed straight afterwards, so you can hold on to the calm a little longer.",
      tr: "Masajdan sonra gününe normal şekilde devam edebilirsin. Huzuru biraz daha koruyabilmen için hemen ardından aceleli bir şey planlamamaya çalış.",
    }[l],
    faqs: [c.faq, priceQ[l], womenOnly[l]],
  };
}

export const wellnessTreatments: Record<string, T> = {
  "massage-relaxation": {
    nl: massage("nl", {
      seoTitle: "Ontspanningsmassage voor het hele lichaam",
      seoDescription: "Een ontspanningsmassage voor het hele lichaam, uitsluitend voor vrouwen en op afspraak. Lees hoe de afspraak verloopt en vraag je afspraak aan.",
      title: "Ontspanningsmassage (hele lichaam)",
      lead: "Een ontspannen moment met aandacht voor het hele lichaam, zodat je de drukte van de dag even achter je kunt laten.",
      teaser: "Aandacht voor het hele lichaam, op jouw tempo.",
      area: "Een ontspannende massage voor het lichaam. Welke gebieden aandacht krijgen en welke je liever overslaat, bespreek je vooraf samen.",
      appointment: [
        "Je begint met een kort gesprek: wat vind je prettig, zijn er plekken die je liever overslaat en is er iets waar Dilek rekening mee moet houden?",
        "Daarna lig je comfortabel en toegedekt; alleen het deel dat gemasseerd wordt, is onbedekt.",
      ],
      know: [
        "Meld vooraf klachten, blessures, een aandoening of zwangerschap.",
        "Kom bij voorkeur niet met een volle maag, en geef het aan als je het snel koud hebt.",
      ],
      faq: { q: "Welke massagetechniek wordt gebruikt?", a: "Dat stem je vooraf samen af op wat jij prettig vindt. Op deze pagina worden geen technieken genoemd die (nog) niet bevestigd zijn." },
    }),
    en: massage("en", {
      seoTitle: "Full-body relaxation massage",
      seoDescription: "A full-body relaxation massage, for women only and by appointment. Read how the appointment goes and request your appointment.",
      title: "Full-body relaxation massage",
      lead: "A relaxed moment with attention for the whole body, so you can leave the rush of the day behind for a while.",
      teaser: "Attention for the whole body, at your pace.",
      area: "A relaxing massage for the body. Which areas receive attention, and which you would rather skip, you discuss together beforehand.",
      appointment: [
        "You start with a short conversation: what do you enjoy, are there areas you would rather skip and is there anything Dilek should take into account?",
        "You then lie comfortably and covered; only the part being massaged is uncovered.",
      ],
      know: ["Mention complaints, injuries, a condition or pregnancy beforehand.", "Preferably don't come on a full stomach, and say so if you get cold easily."],
      faq: { q: "Which massage technique is used?", a: "That is agreed together beforehand, based on what you enjoy. This page names no techniques that have not (yet) been confirmed." },
    }),
    tr: massage("tr", {
      seoTitle: "Tüm vücut rahatlama masajı",
      seoDescription: "Kadınlara özel, randevuyla tüm vücut rahatlama masajı. Randevunun nasıl geçtiğini oku ve randevunu talep et.",
      title: "Tüm vücut rahatlama masajı",
      lead: "Tüm bedenine özen gösterilen rahat bir an; günün koşturmacasını bir süreliğine geride bırakabilmen için.",
      teaser: "Tüm bedenine özen, senin temponda.",
      area: "Beden için rahatlatıcı bir masaj. Hangi bölgelere odaklanılacağını ve hangilerinin atlanmasını istediğini önceden birlikte konuşursunuz.",
      appointment: [
        "Kısa bir sohbetle başlarsınız: neyi seversin, atlanmasını istediğin bölgeler var mı ve Dilek'in dikkat etmesi gereken bir şey var mı?",
        "Ardından rahat ve üzeri örtülü şekilde uzanırsın; yalnızca masaj yapılan bölüm açıktır.",
      ],
      know: ["Şikâyet, sakatlık, bir rahatsızlık ya da hamileliği önceden belirt.", "Mümkünse tok karnına gelme; kolay üşüyorsan bunu da söyle."],
      faq: { q: "Hangi masaj tekniği kullanılıyor?", a: "Bu, neyi sevdiğine göre önceden birlikte belirlenir. Bu sayfada henüz onaylanmamış teknikler anılmaz." },
    }),
  },
  "massage-face": {
    nl: massage("nl", {
      seoTitle: "Gezichtsmassage",
      seoDescription: "Een zachte gezichtsmassage als rustig verzorgingsmoment, uitsluitend voor vrouwen en op afspraak. Lees hoe de afspraak verloopt.",
      title: "Gezichtsmassage",
      lead: "Een zachte verzorging met de aandacht op je gezicht: een rustig, persoonlijk moment.",
      teaser: "Een zachte verzorging met de aandacht op je gezicht.",
      area: "Een ontspannende massage van het gezicht. Of hals en decolleté erbij horen, en wat voor jou prettig voelt, bespreek je vooraf.",
      appointment: [
        "Vooraf vertel je hoe je huid zich voelt, welke producten je gebruikt en of je ergens gevoelig voor bent.",
        "Je ligt comfortabel; make-up wordt eerst verwijderd, zodat de massage rustig kan beginnen.",
      ],
      know: ["Kom bij voorkeur zonder make-up, of meld het zodat die eerst verwijderd kan worden.", "Meld allergieën of gevoeligheid voor producten, en een recente huidbehandeling."],
      faq: { q: "Is een gezichtsmassage hetzelfde als een gezichtsbehandeling?", a: "Nee. De massage is een ontspannend verzorgingsmoment. Wil je ook stoom of verzorging voor je huid, kijk dan bij de gezichtsbehandeling met stoom of vraag het in je aanvraag." },
    }),
    en: massage("en", {
      seoTitle: "Facial massage",
      seoDescription: "A gentle facial massage as a calm moment of care, for women only and by appointment. Read how the appointment goes.",
      title: "Facial massage",
      lead: "Gentle care focused on your face: a calm, personal moment.",
      teaser: "Gentle care focused on your face.",
      area: "A relaxing massage of the face. Whether the neck and décolleté are included, and what feels comfortable for you, you discuss beforehand.",
      appointment: ["Beforehand you share how your skin feels, which products you use and whether you are sensitive to anything.", "You lie comfortably; make-up is removed first so the massage can begin calmly."],
      know: ["Preferably come without make-up, or mention it so it can be removed first.", "Mention allergies or sensitivity to products, and any recent skin treatment."],
      faq: { q: "Is a facial massage the same as a facial?", a: "No. The massage is a relaxing moment of care. Would you also like steam or care for your skin? See the facial care with steam, or mention it in your request." },
    }),
    tr: massage("tr", {
      seoTitle: "Yüz masajı",
      seoDescription: "Sakin bir bakım anı olarak nazik bir yüz masajı; kadınlara özel ve randevuyla. Randevunun nasıl geçtiğini oku.",
      title: "Yüz masajı",
      lead: "Yüzüne odaklanan nazik bir bakım: sakin ve kişisel bir an.",
      teaser: "Yüzüne odaklanan nazik bir bakım.",
      area: "Yüz için rahatlatıcı bir masaj. Boyun ve dekoltenin dahil olup olmayacağını ve senin için neyin rahat olduğunu önceden konuşursunuz.",
      appointment: ["Öncesinde cildinin nasıl hissettiğini, hangi ürünleri kullandığını ve bir şeye hassasiyetin olup olmadığını anlatırsın.", "Rahatça uzanırsın; masaj sakin bir şekilde başlayabilsin diye önce makyaj temizlenir."],
      know: ["Mümkünse makyajsız gel ya da önce temizlenebilmesi için belirt.", "Ürünlere alerjini veya hassasiyetini ve yakın zamanda yapılan bir cilt uygulamasını belirt."],
      faq: { q: "Yüz masajı yüz bakımıyla aynı şey mi?", a: "Hayır. Masaj rahatlatıcı bir bakım anıdır. Cildin için buhar veya bakım da istiyorsan buhar destekli yüz bakımına bak ya da talebinde belirt." },
    }),
  },
  "massage-head": {
    nl: massage("nl", {
      seoTitle: "Hoofdmassage",
      seoDescription: "Een ontspannende hoofdmassage, uitsluitend voor vrouwen en op afspraak. Lees hoe de afspraak verloopt en wat je vooraf bespreekt.",
      title: "Hoofdmassage",
      lead: "Even een moment voor je hoofd en jezelf, met een aanraking die voor jou prettig voelt.",
      teaser: "Even een moment voor je hoofd en jezelf.",
      area: "Een ontspannende massage van het hoofd. Vooraf bespreek je of de hoofdhuid erbij hoort en of nek en schouders aandacht mogen krijgen.",
      appointment: ["Je vertelt vooraf wat je prettig vindt en of je haar daarna nog ergens netjes voor moet zitten.", "Je zit of ligt comfortabel, zoals jullie samen afspreken."],
      know: ["Meld vooraf een gevoelige hoofdhuid, wondjes of een recente haarbehandeling.", "Gebruik je haarproducten? Dan kan het prettig zijn om je haar die dag later te wassen."],
      faq: { q: "Wordt mijn haar ook behandeld?", a: "Nee, het is een ontspannende massage en geen haarbehandeling. Of de hoofdhuid wordt meegenomen, bespreek je vooraf." },
    }),
    en: massage("en", {
      seoTitle: "Head massage",
      seoDescription: "A relaxing head massage, for women only and by appointment. Read how the appointment goes and what you discuss beforehand.",
      title: "Head massage",
      lead: "A moment for your head and yourself, with a touch that feels comfortable to you.",
      teaser: "A moment for your head and yourself.",
      area: "A relaxing massage of the head. Beforehand you discuss whether the scalp is included and whether the neck and shoulders may receive attention.",
      appointment: ["Beforehand you say what you enjoy and whether your hair needs to look neat for something afterwards.", "You sit or lie comfortably, as you agree together."],
      know: ["Mention a sensitive scalp, small wounds or a recent hair treatment beforehand.", "Using hair products? It can be nice to wash your hair later that day."],
      faq: { q: "Is my hair treated too?", a: "No, it is a relaxing massage, not a hair treatment. Whether the scalp is included, you discuss beforehand." },
    }),
    tr: massage("tr", {
      seoTitle: "Baş masajı",
      seoDescription: "Kadınlara özel, randevuyla rahatlatıcı baş masajı. Randevunun nasıl geçtiğini ve önceden neleri konuşacağınızı oku.",
      title: "Baş masajı",
      lead: "Başına ve kendine ayırdığın bir an; senin için rahat olan bir dokunuşla.",
      teaser: "Başına ve kendine ayırdığın bir an.",
      area: "Baş için rahatlatıcı bir masaj. Saç derisinin dahil olup olmayacağını ve boyun ile omuzlara da özen gösterilip gösterilmeyeceğini önceden konuşursunuz.",
      appointment: ["Önceden neyi sevdiğini ve sonrasında saçının bir yer için düzgün olması gerekip gerekmediğini söylersin.", "Birlikte anlaştığınız gibi rahatça oturur ya da uzanırsın."],
      know: ["Hassas saç derisini, küçük yaraları veya yakın zamanda yapılan bir saç işlemini önceden belirt.", "Saç ürünü mü kullanıyorsun? O gün saçını daha sonra yıkamak hoş olabilir."],
      faq: { q: "Saçıma da işlem yapılıyor mu?", a: "Hayır; bu rahatlatıcı bir masajdır, saç bakımı değildir. Saç derisinin dahil olup olmayacağını önceden konuşursunuz." },
    }),
  },
  "massage-hand": {
    nl: massage("nl", {
      seoTitle: "Handmassage",
      seoDescription: "Een rustige handmassage als verzorgend moment, uitsluitend voor vrouwen en op afspraak. Lees hoe de afspraak verloopt.",
      title: "Handmassage",
      lead: "Je handen zijn de hele dag bezig. Gun ze een rustige massage, afgestemd op wat voor jou prettig voelt.",
      teaser: "Een rustig moment voor je handen.",
      area: "Een ontspannende massage van de handen en, als je dat wilt, de onderarmen. Je bespreekt vooraf waar rekening mee moet worden gehouden.",
      appointment: ["Vooraf vertel je wat je prettig vindt en of er plekken gevoelig zijn.", "Je zit comfortabel, met je handen ontspannen op een zachte ondergrond."],
      know: ["Meld vooraf wondjes, eczeem of andere huidklachten aan je handen.", "Draag je ringen of een horloge? Die kun je vooraf even afdoen."],
      faq: { q: "Is dit een manicure?", a: "Nee. Het is een ontspannende massage; er wordt niets aan je nagels gedaan." },
    }),
    en: massage("en", {
      seoTitle: "Hand massage",
      seoDescription: "A calm hand massage as a moment of care, for women only and by appointment. Read how the appointment goes.",
      title: "Hand massage",
      lead: "Your hands are busy all day. Give them a calm massage, tuned to what feels comfortable for you.",
      teaser: "A calm moment for your hands.",
      area: "A relaxing massage of the hands and, if you like, the forearms. Beforehand you discuss anything that should be taken into account.",
      appointment: ["Beforehand you say what you enjoy and whether any areas are sensitive.", "You sit comfortably, with your hands resting on a soft surface."],
      know: ["Mention small wounds, eczema or other skin complaints on your hands beforehand.", "Wearing rings or a watch? You can take them off first."],
      faq: { q: "Is this a manicure?", a: "No. It is a relaxing massage; nothing is done to your nails." },
    }),
    tr: massage("tr", {
      seoTitle: "El masajı",
      seoDescription: "Bir bakım anı olarak sakin bir el masajı; kadınlara özel ve randevuyla. Randevunun nasıl geçtiğini oku.",
      title: "El masajı",
      lead: "Ellerin gün boyu çalışıyor. Onlara, senin için rahat olana göre ayarlanan sakin bir masaj armağan et.",
      teaser: "Ellerin için sakin bir an.",
      area: "Eller ve istersen ön kollar için rahatlatıcı bir masaj. Dikkat edilmesi gereken bir şey varsa önceden konuşursunuz.",
      appointment: ["Önceden neyi sevdiğini ve hassas bölgeler olup olmadığını söylersin.", "Ellerin yumuşak bir yüzeyde dinlenirken rahatça oturursun."],
      know: ["Ellerindeki küçük yaraları, egzamayı veya başka cilt şikâyetlerini önceden belirt.", "Yüzük veya saat mi takıyorsun? Önceden çıkarabilirsin."],
      faq: { q: "Bu bir manikür mü?", a: "Hayır. Bu rahatlatıcı bir masajdır; tırnaklarına herhangi bir işlem yapılmaz." },
    }),
  },
  "massage-foot": {
    nl: massage("nl", {
      seoTitle: "Voetmassage",
      seoDescription: "Een rustige voetmassage als verzorgend moment, uitsluitend voor vrouwen en op afspraak. Lees hoe de afspraak verloopt.",
      title: "Voetmassage",
      lead: "Een rustig verzorgingsmoment voor je voeten, met jouw comfort voorop.",
      teaser: "Een rustig verzorgingsmoment voor je voeten.",
      area: "Een ontspannende massage van de voeten en, als je dat wilt, de onderbenen. Je deelt vooraf je wensen en eventuele gevoeligheden.",
      appointment: ["Vooraf vertel je wat je prettig vindt en of er plekken gevoelig of kietelig zijn.", "Je zit of ligt comfortabel, met je voeten warm en ondersteund."],
      know: ["Meld vooraf wondjes, blaren, een voetschimmel of andere klachten aan je voeten.", "Dit is geen pedicure of medische voetzorg."],
      faq: { q: "Is dit voetreflexologie?", a: "Nee. Het is een ontspannende voetmassage. Er worden geen reflexzones of gezondheidseffecten genoemd." },
    }),
    en: massage("en", {
      seoTitle: "Foot massage",
      seoDescription: "A calm foot massage as a moment of care, for women only and by appointment. Read how the appointment goes.",
      title: "Foot massage",
      lead: "A calm moment of care for your feet, with your comfort first.",
      teaser: "A calm moment of care for your feet.",
      area: "A relaxing massage of the feet and, if you like, the lower legs. Beforehand you share your wishes and any sensitivities.",
      appointment: ["Beforehand you say what you enjoy and whether any areas are sensitive or ticklish.", "You sit or lie comfortably, with your feet warm and supported."],
      know: ["Mention small wounds, blisters, athlete's foot or other foot complaints beforehand.", "This is not a pedicure or medical foot care."],
      faq: { q: "Is this reflexology?", a: "No. It is a relaxing foot massage. No reflex zones or health effects are claimed." },
    }),
    tr: massage("tr", {
      seoTitle: "Ayak masajı",
      seoDescription: "Bir bakım anı olarak sakin bir ayak masajı; kadınlara özel ve randevuyla. Randevunun nasıl geçtiğini oku.",
      title: "Ayak masajı",
      lead: "Ayakların için, rahatlığının ön planda olduğu sakin bir bakım anı.",
      teaser: "Ayakların için sakin bir bakım anı.",
      area: "Ayaklar ve istersen bacakların alt kısmı için rahatlatıcı bir masaj. Tercihlerini ve varsa hassasiyetlerini önceden paylaşırsın.",
      appointment: ["Önceden neyi sevdiğini ve hassas ya da gıdıklanan bölgeler olup olmadığını söylersin.", "Ayakların sıcak ve desteklenmiş şekilde rahatça oturur ya da uzanırsın."],
      know: ["Ayaklarındaki küçük yaraları, su toplamalarını, mantarı veya başka şikâyetleri önceden belirt.", "Bu bir pedikür veya tıbbi ayak bakımı değildir."],
      faq: { q: "Bu refleksoloji mi?", a: "Hayır. Bu rahatlatıcı bir ayak masajıdır. Refleks bölgeleri veya sağlık etkileri iddia edilmez." },
    }),
  },
  "facial-steam": {
    nl: {
      seoTitle: "Gezichtsbehandeling met stoom",
      seoDescription: "Een verzorgende gezichtsbehandeling waarin stoom een van de stappen kan zijn, uitsluitend voor vrouwen en op afspraak. Lees hoe de afspraak verloopt.",
      title: "Gezichtsbehandeling met stoom",
      lead: "Een verzorgend moment voor je gezicht, waarbij stoom een van de stappen kan zijn. Wat er precies gebeurt, stem je vooraf samen af.",
      teaser: "Verzorging voor je gezicht, met stoom als mogelijke stap.",
      areaTitle: "Wat houdt de behandeling in?",
      area: "Dilek bespreekt eerst je huid, je wensen en of stoom voor jou geschikt is. Stoom wordt op een comfortabele afstand gebruikt en is nooit verplicht. Welke stappen verder worden uitgevoerd, hoor je vooraf.",
      appointment: [
        "Je begint met een kort gesprek: hoe voelt je huid, welke producten gebruik je en ben je ergens gevoelig voor, bijvoorbeeld voor warmte?",
        "Je ligt comfortabel. Je huid wordt gereinigd en, als stoom voor jou geschikt is, krijgt je gezicht een moment met zachte, warme stoom op afstand.",
        "Je kunt altijd aangeven als het te warm voelt; de stap wordt dan aangepast of overgeslagen.",
      ],
      know: [
        "Kom bij voorkeur zonder make-up, of meld het zodat die eerst verwijderd kan worden.",
        "Meld vooraf een gevoelige of geïrriteerde huid, een recente huidbehandeling, rosacea of gevoeligheid voor warmte.",
      ],
      reactions: [
        "Je huid kan na stoom even warm of wat rozig aanvoelen; dat trekt meestal snel weg.",
        "Twijfel je over je huid of een aandoening? Overleg dan eerst met je huisarts of dermatoloog. Dit is een verzorgende, geen medische behandeling.",
      ],
      aftercare: ["Laat je huid die dag zoveel mogelijk met rust en gebruik milde verzorging.", "Vermijd die dag sauna en direct zonlicht."],
      recovery: "Je kunt direct verder met je dag. Plan de behandeling bij voorkeur niet vlak voor een belangrijk moment, zodat een eventuele blos kan wegtrekken.",
      faqs: [
        { q: "Is stoom altijd onderdeel van de behandeling?", a: "Nee. Dilek bespreekt eerst met je of stoom geschikt is voor jouw huid. Is het dat niet, dan wordt die stap overgeslagen." },
        { q: "Kan ik dit als losse afspraak boeken?", a: "Vermeld in je aanvraag wat je zoekt. Of stoom een losse afspraak is of onderdeel van een langere gezichtsbehandeling, en het tarief, hoor je persoonlijk." },
        womenOnly.nl,
      ],
    },
    en: {
      seoTitle: "Facial care with steam",
      seoDescription: "A caring facial in which steam can be one of the steps, for women only and by appointment. Read how the appointment goes.",
      title: "Facial care with steam",
      lead: "A caring moment for your face, in which steam can be one of the steps. What exactly happens, you agree together beforehand.",
      teaser: "Care for your face, with steam as a possible step.",
      areaTitle: "What does the treatment involve?",
      area: "Dilek first discusses your skin, your wishes and whether steam is suitable for you. Steam is used at a comfortable distance and is never required. You hear beforehand which other steps are included.",
      appointment: [
        "You start with a short conversation: how does your skin feel, which products do you use, and are you sensitive to anything, such as warmth?",
        "You lie comfortably. Your skin is cleansed and, if steam suits you, your face is given a moment of soft, warm steam at a distance.",
        "You can always say if it feels too warm; the step is then adjusted or skipped.",
      ],
      know: ["Preferably come without make-up, or mention it so it can be removed first.", "Mention sensitive or irritated skin, a recent skin treatment, rosacea or sensitivity to warmth beforehand."],
      reactions: [
        "After steam your skin may feel warm or a little rosy for a while; this usually fades quickly.",
        "Unsure about your skin or a condition? Check with your GP or dermatologist first. This is a caring, not a medical treatment.",
      ],
      aftercare: ["Leave your skin alone as much as possible that day and use mild skincare.", "Avoid sauna and direct sun that day."],
      recovery: "You can carry on with your day straight away. Preferably don't book it right before an important moment, so any flush can settle.",
      faqs: [
        { q: "Is steam always part of the treatment?", a: "No. Dilek first discusses with you whether steam suits your skin. If it doesn't, that step is skipped." },
        { q: "Can I book this as a separate appointment?", a: "Mention in your request what you are looking for. Whether steam is a separate appointment or part of a longer facial, and the price, you hear personally." },
        womenOnly.en,
      ],
    },
    tr: {
      seoTitle: "Buhar destekli yüz bakımı",
      seoDescription: "Buharın adımlardan biri olabildiği bir yüz bakımı; kadınlara özel ve randevuyla. Randevunun nasıl geçtiğini oku.",
      title: "Buhar destekli yüz bakımı",
      lead: "Buharın adımlardan biri olabildiği, yüzüne ayrılmış bir bakım anı. Tam olarak neler yapılacağını önceden birlikte belirlersiniz.",
      teaser: "Yüzün için bakım; buhar olası bir adım olarak.",
      areaTitle: "Bakım neleri kapsar?",
      area: "Dilek önce cildini, beklentilerini ve buharın sana uygun olup olmadığını seninle konuşur. Buhar rahat bir mesafeden uygulanır ve asla zorunlu değildir. Diğer hangi adımların uygulanacağını önceden öğrenirsin.",
      appointment: [
        "Kısa bir sohbetle başlarsınız: cildin nasıl hissediyor, hangi ürünleri kullanıyorsun ve örneğin sıcaklığa karşı bir hassasiyetin var mı?",
        "Rahatça uzanırsın. Cildin temizlenir ve buhar sana uygunsa yüzün mesafeli, yumuşak ve ılık buharla bir an dinlenir.",
        "Çok sıcak hissettirirse her zaman söyleyebilirsin; o adım ayarlanır ya da atlanır.",
      ],
      know: ["Mümkünse makyajsız gel ya da önce temizlenebilmesi için belirt.", "Hassas veya tahrişli cildi, yakın zamanda yapılan bir cilt uygulamasını, rozaseayı ya da sıcaklığa hassasiyeti önceden belirt."],
      reactions: [
        "Buhardan sonra cildin bir süre sıcak ya da hafif pembe hissedilebilir; bu genellikle hızla geçer.",
        "Cildin veya bir rahatsızlığın konusunda emin değil misin? Önce aile hekimine veya dermatoloğa danış. Bu tıbbi değil, bir bakım uygulamasıdır.",
      ],
      aftercare: ["O gün cildine olabildiğince az dokun ve hafif bakım ürünleri kullan.", "O gün sauna ve doğrudan güneşten kaçın."],
      recovery: "Hemen gününe devam edebilirsin. Olası bir kızarıklığın geçmesi için mümkünse önemli bir andan hemen önceye planlama.",
      faqs: [
        { q: "Buhar her zaman bakımın bir parçası mı?", a: "Hayır. Dilek önce buharın cildine uygun olup olmadığını seninle konuşur. Uygun değilse o adım atlanır." },
        { q: "Bunu ayrı bir randevu olarak alabilir miyim?", a: "Talebinde ne istediğini belirt. Buharın ayrı bir randevu mu yoksa daha uzun bir yüz bakımının parçası mı olduğunu ve fiyatı kişisel olarak öğrenirsin." },
        womenOnly.tr,
      ],
    },
  },
};

export const wellnessSections: Record<string, Record<Locale, SectionCopy>> = {
  massage: {
    nl: {
      seoTitle: "Massages voor vrouwen — hele lichaam, gezicht, hoofd, handen en voeten",
      seoDescription: "Ontspanningsmassage voor het hele lichaam, gezichtsmassage, hoofdmassage, handmassage en voetmassage bij Glow by Dilek. Uitsluitend voor vrouwen, op afspraak.",
      hero: { eyebrow: "Massages", title: "Even stilstaan,", titleEm: "helemaal voor jezelf.", subtitle: "Een massage is een uitnodiging om even stil te staan. Kies het hele lichaam, of geef je gezicht, hoofd, handen of voeten de aandacht." },
      intro: { title: "Ontspanning, op jouw voorwaarden", paragraphs: ["Je bespreekt vooraf je voorkeuren en welke delen van het lichaam aandacht mogen krijgen. Tijdens de massage kun je altijd aangeven wat je prettig vindt.", "Een massage bij Glow by Dilek is bedoeld om te ontspannen. Het is geen medische of therapeutische behandeling."] },
      listTitle: "Kies je massage",
      listIntro: "Elke massage heeft een eigen pagina met uitleg. Het tarief en de duur hoor je persoonlijk bij je aanvraag.",
      teaser: "Hele lichaam, gezicht, hoofd, handen of voeten.",
      faqs: [{ q: "Welke massage past bij mij?", a: "Dat hangt af van waar je behoefte aan hebt. Twijfel je? Vermeld het in je aanvraag; Dilek denkt graag met je mee." }],
    },
    en: {
      seoTitle: "Massages for women — full body, face, head, hands and feet",
      seoDescription: "Full-body relaxation massage, facial massage, head massage, hand massage and foot massage at Glow by Dilek. For women only, by appointment.",
      hero: { eyebrow: "Massages", title: "Slow down,", titleEm: "entirely for yourself.", subtitle: "A massage is an invitation to slow down. Choose the whole body, or give your face, head, hands or feet some attention." },
      intro: { title: "Relaxation, on your terms", paragraphs: ["Beforehand you discuss your preferences and which areas of the body may receive attention. During the massage you can always say what feels good.", "A massage at Glow by Dilek is meant to help you relax. It is not a medical or therapeutic treatment."] },
      listTitle: "Choose your massage",
      listIntro: "Each massage has its own page with details. You hear the price and duration personally when you send your request.",
      teaser: "Full body, face, head, hands or feet.",
      faqs: [{ q: "Which massage suits me?", a: "That depends on what you need. Unsure? Mention it in your request; Dilek is happy to help you choose." }],
    },
    tr: {
      seoTitle: "Kadınlara özel masajlar — tüm vücut, yüz, baş, el ve ayak",
      seoDescription: "Glow by Dilek'te tüm vücut rahatlama masajı, yüz masajı, baş masajı, el masajı ve ayak masajı. Yalnızca kadınlara, randevuyla.",
      hero: { eyebrow: "Masajlar", title: "Bir an dur,", titleEm: "tamamen kendin için.", subtitle: "Masaj, günlük tempoya kısa bir ara verme davetidir. Tüm vücudu seç ya da yüzüne, başına, ellerine veya ayaklarına özen göster." },
      intro: { title: "Rahatlama, senin koşullarında", paragraphs: ["Tercihlerini ve bedeninin hangi bölgelerine odaklanılacağını önceden konuşursunuz. Masaj sırasında neyin iyi geldiğini her zaman söyleyebilirsin.", "Glow by Dilek'teki masaj rahatlamak içindir. Tıbbi veya terapötik bir uygulama değildir."] },
      listTitle: "Masajını seç",
      listIntro: "Her masajın ayrıntıları anlatan kendi sayfası var. Fiyatı ve süreyi talebini gönderdiğinde kişisel olarak öğrenirsin.",
      teaser: "Tüm vücut, yüz, baş, eller veya ayaklar.",
      faqs: [{ q: "Hangi masaj bana uygun?", a: "Neye ihtiyaç duyduğuna bağlı. Kararsız mısın? Talebinde belirt; Dilek seçmene seve seve yardımcı olur." }],
    },
  },
  facial: {
    nl: {
      seoTitle: "Gezichtsbehandelingen voor vrouwen",
      seoDescription: "Gezichtsbehandelingen bij Glow by Dilek, waaronder een gezichtsbehandeling met stoom. Rustig en persoonlijk afgestemd, uitsluitend voor vrouwen en op afspraak.",
      hero: { eyebrow: "Gezichtsbehandelingen", title: "Tijd voor", titleEm: "je huid.", subtitle: "Verzorging voor je gezicht in een rustig tempo, afgestemd op hoe je huid zich voelt." },
      intro: { title: "Rustig en persoonlijk", paragraphs: ["Elke gezichtsbehandeling begint met een kort gesprek over je huid en de producten die je dagelijks gebruikt. Daarop wordt de behandeling afgestemd.", "Een gezichtsbehandeling is een verzorgende behandeling, geen medische. Bij huidaandoeningen of twijfel overleg je eerst met je huisarts of dermatoloog."] },
      listTitle: "Gezichtsbehandelingen",
      listIntro: "Kies een behandeling voor alle details, of vraag direct een afspraak aan.",
      teaser: "Verzorging voor je gezicht, met stoom als mogelijke stap.",
      faqs: [{ q: "Welke behandeling past bij mijn huid?", a: "Dat bespreek je vooraf. Twijfel je, vraag dan in je aanvraag om advies." }],
      note: "Er worden geen diagnoses gesteld en geen medische resultaten beloofd.",
    },
    en: {
      seoTitle: "Facial treatments for women",
      seoDescription: "Facial treatments at Glow by Dilek, including facial care with steam. Calm and personally adjusted, for women only and by appointment.",
      hero: { eyebrow: "Facial treatments", title: "Time for", titleEm: "your skin.", subtitle: "Care for your face at a calm pace, adjusted to how your skin feels." },
      intro: { title: "Calm and personal", paragraphs: ["Every facial starts with a short conversation about your skin and the products you use day to day. The treatment is adjusted to that.", "A facial is a caring treatment, not a medical one. With skin conditions or doubts, check with your GP or dermatologist first."] },
      listTitle: "Facial treatments",
      listIntro: "Choose a treatment for all the details, or request an appointment straight away.",
      teaser: "Care for your face, with steam as a possible step.",
      faqs: [{ q: "Which treatment suits my skin?", a: "That is discussed beforehand. If in doubt, ask for advice in your request." }],
      note: "No diagnoses are made and no medical results are promised.",
    },
    tr: {
      seoTitle: "Kadınlara özel yüz bakımları",
      seoDescription: "Glow by Dilek'te buhar destekli yüz bakımı dahil yüz bakımları. Sakin ve kişiye özel; yalnızca kadınlara, randevuyla.",
      hero: { eyebrow: "Yüz bakımları", title: "Cildine", titleEm: "zaman ayır.", subtitle: "Cildinin nasıl hissettiğine göre ayarlanan, sakin bir tempoda yüz bakımı." },
      intro: { title: "Sakin ve kişisel", paragraphs: ["Her yüz bakımı, cildin ve günlük kullandığın ürünler hakkında kısa bir sohbetle başlar. Bakım buna göre ayarlanır.", "Yüz bakımı tıbbi değil, bir bakım uygulamasıdır. Cilt rahatsızlıklarında veya emin olmadığında önce aile hekimine veya dermatoloğa danış."] },
      listTitle: "Yüz bakımları",
      listIntro: "Tüm ayrıntılar için bir bakım seç ya da hemen randevu talep et.",
      teaser: "Yüzün için bakım; buhar olası bir adım olarak.",
      faqs: [{ q: "Cildime hangi bakım uygun?", a: "Bu önceden konuşulur. Emin değilsen talebinde tavsiye iste." }],
      note: "Teşhis konulmaz ve tıbbi sonuç vaat edilmez.",
    },
  },
};
