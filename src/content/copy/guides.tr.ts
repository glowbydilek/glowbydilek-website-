import type { FaqPageCopy, GuideCopy, GuideKey } from "./types";

/** Rehber sayfaları — Türkçe. */
export const guidesTr: Record<GuideKey, GuideCopy> = {
  process: {
    seoTitle: "Randevu nasıl işler?",
    seoDescription:
      "Talepten onaya: Glow by Dilek'ten nasıl randevu talep edeceğin, ardından neler olacağı ve bakımın kendisinin nasıl geçtiği. Yalnızca kadınlara, randevuyla.",
    hero: {
      eyebrow: "Randevu süreci",
      title: "Kişisel planlama,",
      titleEm: "adım adım.",
      subtitle:
        "Otomatik bir rezervasyon sistemi yok. Her talebi Dilek kendisi okur ve kişisel olarak onaylar. İlk mesajından bakımından sonrasına kadar süreç şöyle işler.",
    },
    sections: [
      {
        title: "1. Randevu talep edersin",
        paragraphs: [
          "Randevu formunda bir veya birden fazla bakım, tercih ettiğin bir tarih ve günün bir zaman dilimini (sabah, öğleden sonra, akşam veya esnek) seçersin. Başka bir zaman da uygunsa hemen ekleyebilirsin.",
          "Gönderdikten hemen sonra e-postayla otomatik bir alındı bilgisi alırsın. Bu henüz bir randevu değildir: yalnızca talebinin güvenle ulaştığı anlamına gelir.",
        ],
      },
      {
        title: "2. Dilek talebini inceler",
        paragraphs: [
          "Dilek talebini kendisi okur ve takvimine bakar. Tercih ettiğin zaman uygun değilse başka bir zaman önerir. Cildin veya bakım hakkında bir sorusu olursa bunu da öğrenirsin.",
        ],
      },
      {
        title: "3. Kişisel bir onay alırsın",
        paragraphs: [
          "Randevun ancak Dilek kişisel olarak onayladığında kesinleşir. Bu onayda tarih, saat ve ihtiyacın olan pratik bilgiler yer alır.",
          "Bakımlar yalnızca randevuyla yapılır. Konumla ilgili pratik bilgiler onaydan sonra kişisel olarak paylaşılır.",
        ],
      },
      {
        title: "4. Hazırlanırsın",
        paragraphs: [
          "Ağda için tüylerin iki ila dört hafta uzamasını bekle, bir iki gün önce hafifçe peeling yap ve bölgeye losyon veya yağ sürmeden gel. Masaj veya yüz bakımı için rahat giysilerle gel ve varsa hassasiyetlerini önceden paylaş. Hazırlık sayfasında her şey tek yerde.",
        ],
      },
      {
        title: "5. Bakım",
        paragraphs: [
          "Her randevu kısa bir sohbetle başlar: ne istiyorsun, cildin nasıl tepki veriyor ve dikkat edilmesi gereken bir şey var mı? Ardından bakım sakin bir tempoda yapılır. Dilek ne yapacağını yapmadan önce anlatır.",
        ],
      },
      {
        title: "6. Bakım sonrası",
        paragraphs: [
          "Bakımdan sonra sonraki günler için tavsiyelerle ayrılırsın. Sonrasında bir sorun olursa her zaman e-posta gönderebilirsin.",
        ],
      },
      {
        title: "Gelemeyecek misin?",
        paragraphs: [
          "Zamanın başka birine verilebilmesi için lütfen mümkün olan en kısa sürede onay e-postanı yanıtlayarak ya da hello@glowbydilek.nl adresine yazarak haber ver.",
        ],
      },
    ],
    faqs: [
      {
        q: "Formu gönderdiğimde randevum kesinleşir mi?",
        a: "Hayır. Önce otomatik bir alındı bilgisi alırsın. Randevun ancak Dilek kişisel olarak onayladığında kesinleşir.",
      },
      {
        q: "Bakımlar nerede yapılıyor?",
        a: "Bakımlar yalnızca randevuyla yapılır. Konumla ilgili pratik bilgiler onaydan sonra kişisel olarak paylaşılır.",
      },
      {
        q: "Önce bir soru sorabilir miyim?",
        a: "Elbette. İletişim formunu kullan ya da hello@glowbydilek.nl adresine yaz. Dilek kişisel olarak yanıtlar.",
      },
    ],
  },

  preparation: {
    seoTitle: "Randevuna nasıl hazırlanırsın?",
    seoDescription:
      "Ağdaya, masaja ve yüz bakımına hazırlık: tüy uzunluğu, peeling, cilt bakımı, güneş ve ilaçlar. Konforlu bir bakım için önceden bilmen gereken her şey.",
    hero: {
      eyebrow: "Hazırlık",
      title: "İyi hazırlan,",
      titleEm: "daha konforlu olsun.",
      subtitle:
        "Randevundan önceki günlerde atacağın birkaç basit adım bakımı daha konforlu yapar; daha sakin bir cilt ve daha iyi bir sonuca yardımcı olur.",
    },
    sections: [
      {
        title: "Ağda için tüy uzunluğu",
        paragraphs: [
          "Tüylerin en az 0,5 cm uzunluğunda olması gerekir; yaklaşık bir pirinç tanesi kadar. Bu genellikle tıraştan iki ila dört hafta sonradır. Daha kısaysa ağda tüyleri iyi tutamaz; bir santimetreden çok daha uzunsa önce kısaltılır.",
        ],
      },
      {
        title: "Peeling",
        paragraphs: [
          "Ağdadan bir veya iki gün önce hafifçe peeling yap. Bu, ölü deri hücrelerini uzaklaştırır; böylece ağda tüyleri daha iyi tutar ve batık tüy olasılığı azalır. Randevu günü peeling yapma; cildin o gün daha hassastır.",
        ],
      },
      {
        title: "Randevu günü",
        items: [
          "Uygulama yapılacak bölgeye vücut losyonu, yağ, deodorant ve bronzlaştırıcı sürme.",
          "Yüz bakımı veya yüz masajı için mümkünse makyajsız gel.",
          "Rahat ve bol giysiler giy; bikini bölgesi uygulaması için temiz pamuklu iç çamaşırı.",
          "Masajdan önce mümkünse tok karnına gelme.",
        ],
      },
      {
        title: "Güneş ve solaryum",
        paragraphs: [
          "Randevundan önceki 48 saat güneşlenme ve solaryuma girme. Yanmış veya yeni bronzlaşmış cilt daha hassastır ve daha kolay tahriş olur.",
        ],
      },
      {
        title: "Cilt bakımı ve diğer uygulamalar",
        items: [
          "Retinol, AHA, BHA ve diğer peeling ürünlerini bölgede en az bir hafta önceden bırak.",
          "Yakın zamanda peeling, mikro iğneleme, lazer ya da başka yoğun bir cilt uygulaması mı yaptırdın? Önceden belirt.",
        ],
      },
      {
        title: "İlaçlar ve sağlık",
        items: [
          "Reçeteli retinoid kullanıyorsan ya da yakın zamanda izotretinoin tedavisini bitirdiysen ağda uygun değildir.",
          "Kan sulandırıcı mı kullanıyorsun, diyabetin, varisin veya bölgede bir cilt rahatsızlığın mı var? Önce doktoruna danış ve talebinde belirt.",
          "Bir masaj için şikâyetlerini, sakatlıkları veya bir rahatsızlığı önceden paylaş.",
          "Hamileysen cildin ve bedenin daha hassas tepki verebilir. Emin değilsen ebene veya doktoruna danış.",
        ],
      },
      {
        title: "İlk kez mi?",
        paragraphs: [
          "Göründüğünden daha az ürkütücü. Tüm sorularını önceden sor; bakım sırasında sakin ve anlaşılır bir açıklama bekleyebilirsin.",
        ],
      },
    ],
    caveat:
      "Bu bilgiler geneldir ve tıbbi tavsiyenin yerini tutmaz. Bir cilt veya sağlık sorunun varsa, ilaç kullanıyorsan ya da bir bakımın senin için uygun olup olmadığından emin değilsen önce aile hekimine, dermatoloğa veya ebene danış.",
  },

  aftercare: {
    seoTitle: "Bakım sonrası öneriler",
    seoDescription:
      "Ağdadan, masajdan ve yüz bakımından sonra: ilk 24 saat ve sonraki günler için öneriler, batık tüylerin önlenmesi ve ne zaman aile hekimine başvurmanın akıllıca olduğu.",
    hero: {
      eyebrow: "Bakım sonrası",
      title: "Bakımdan sonra,",
      titleEm: "cildine dinlenme ver.",
      subtitle:
        "Ağdadan sonra hafif kızarıklık normaldir ve genellikle bir gün içinde geçer. Birkaç basit alışkanlık cildini sakin tutar ve sonucun daha uzun süre güzel görünmesini sağlar.",
    },
    sections: [
      {
        title: "Ağdadan sonraki ilk 24 saat",
        items: [
          "Sauna, buhar odası, solaryum, havuz, sıcak duş ve yoğun spordan kaçın.",
          "Uygulama yapılan cildin üzerine bol ve nefes alan giysiler giy.",
          "Cilde olabildiğince az dokun ve parfümlü ürünlerden kaçın.",
          "Koltuk altı ağdasından sonra deodorant, yüz uygulamasından sonra makyaj kullanma.",
          "Bikini bölgesi uygulamasından sonra: bol pamuklu iç çamaşırı ve cinsel temastan kaçınma.",
        ],
      },
      {
        title: "Sonraki günler",
        items: [
          "İki gün sonra haftada iki üç kez düzenli ve nazik peelinge başla.",
          "Cildini hafif, parfümsüz bir kremle yumuşak tut.",
          "Bronzlaştırıcıyı ancak 48 saat sonra sür.",
          "Tüylenmen aynı ritimde kalsın diye randevular arasında tıraş olmamaya çalış.",
        ],
      },
      {
        title: "Masaj ve yüz bakımından sonra",
        items: [
          "Gününe devam etmeden önce kendine biraz zaman tanı ve bir miktar su iç.",
          "Yüz bakımından sonra o gün cildine olabildiğince dokunma ve sauna ile doğrudan güneşten kaçın.",
        ],
      },
      {
        title: "Batık tüylerin önlenmesi",
        paragraphs: [
          "Batık tüy, bir tüy deri altında yeniden çıkmaya çalıştığında oluşur. En çok düzenli ve nazik peeling, yumuşak bir cilt ve uygulamadan hemen sonra dar giysilerden kaçınmak yardımcı olur. Sıkma veya koparma; bu, iltihap ya da iz riskini artırır.",
        ],
      },
      {
        title: "Ne normaldir?",
        items: [
          "Kıl köklerinin çevresinde bir iki gün içinde geçen kızarıklık ve küçük kabarcıklar.",
          "Uygulama günü hafif sıcaklık veya gerginlik hissi.",
          "Kalın tüylerde ara sıra nokta şeklinde küçük bir kanama.",
        ],
      },
      {
        title: "Ne zaman aile hekimine başvurmalı",
        paragraphs: [
          "Bir nokta sakinleşmek yerine daha ağrılı, daha sıcak veya daha şiş hale gelirse, iltihap görürsen ya da ateşin çıkarsa lütfen aile hekiminle iletişime geç. Dilek'e de haber verebilirsin.",
        ],
      },
      {
        title: "Düzenli bir ritim",
        paragraphs: [
          "Çoğu bölge için dört ila altı haftada bir rahat bir aralıktır; yüz ve koltuk altı için bazen biraz daha sık. Düzenli ağdayla tüyler çoğu zaman daha ince ve eşit çıkar.",
        ],
      },
    ],
    caveat:
      "Bu öneriler geneldir ve tıbbi tavsiyenin yerini tutmaz. Süren şikâyetlerde, enfeksiyon belirtilerinde veya herhangi bir şüphede lütfen aile hekiminle veya dermatoloğla iletişime geç.",
  },
};

export const faqPageTr: FaqPageCopy = {
  seoTitle: "Sık sorulan sorular",
  seoDescription:
    "Glow by Dilek hakkında en sık sorulan soruların yanıtları: masajlar, yüz bakımı, ağda, hazırlık, randevular ve gizlilik.",
  hero: {
    eyebrow: "Sık sorulan sorular",
    title: "Dürüst yanıtlar,",
    titleEm: "dolambaçsız.",
    subtitle:
      "En sık sorulan sorular, kısa ve açık yanıtlarıyla. Sorunu bulamadın mı? Mesaj göndermekten çekinme.",
  },
  groups: [
    {
      title: "Masajlar ve yüz bakımı",
      items: [
        {
          q: "Hangi masajları sunuyorsunuz?",
          a: "Tüm vücut rahatlama masajı, yüz masajı, baş masajı, el masajı ve ayak masajı. Her birinin ayrıntıları anlatan kendi sayfası var.",
        },
        {
          q: "Masaj tıbbi bir uygulama mı?",
          a: "Hayır. Glow by Dilek'teki masajlar rahatlamak içindir. Şikâyetlerin, bir sakatlığın veya bir rahatsızlığın varsa önce aile hekimine danış.",
        },
        {
          q: "Buhar destekli yüz bakımında neler yapılıyor?",
          a: "Dilek önce cildini ve buharın sana uygun olup olmadığını seninle konuşur. Buhar rahat bir mesafeden uygulanır ve zorunlu değildir; diğer adımlar önceden belirlenir.",
        },
      ],
    },
    {
      title: "Ağda hakkında",
      items: [
        {
          q: "Ağda için tüylerim ne kadar uzun olmalı?",
          a: "En az 0,5 cm, yaklaşık bir pirinç tanesi uzunluğunda. Bu genellikle tıraştan iki ila dört hafta sonradır. Tüyler çok daha uzunsa önce kısaltılır.",
        },
        {
          q: "Ağda acıtır mı?",
          a: "Kısa ve keskin bir his duyarsın, hızla geçer. Nasıl hissettirdiği kişiye ve bölgeye göre değişir; ilk sefer genellikle en hassas olanıdır. Düzenli ağdayla tüyler çoğu zaman daha ince çıkar ve birçok kişi sonrasında daha az hisseder.",
        },
        {
          q: "Cildim ne kadar süre pürüzsüz kalır?",
          a: "Tüylenmene ve bölgeye bağlı olarak genellikle üç ila beş hafta. Tüy kökünden alındığı için tıraştan sonrasına göre daha yavaş ve yumuşak çıkar.",
        },
        {
          q: "Ne sıklıkla ağda yaptırmalıyım?",
          a: "Çoğu bölge için dört ila altı haftada bir rahat bir aralıktır. Arada tıraş olmamaya çalış: düzenli ağda tüylerini aynı evrede tutar ve çoğu zaman daha eşit bir sonuç verir.",
        },
      ],
    },
    {
      title: "Cilt ve güvenlik",
      items: [
        {
          q: "Ne zaman ağda yaptırmamalıyım?",
          a: "Yanmış, tahrişli veya hasarlı ciltte, kesik veya iltihap varken ve peeling ya da lazer uygulamasından kısa süre sonra yapılmaz. Reçeteli retinoid kullanıyorsan ya da yakın zamanda izotretinoin tedavisini bitirdiysen ağda uygun değildir. Emin değil misin? Önce doktoruna danış ve mutlaka önceden belirt.",
        },
        {
          q: "Batık tüyleri nasıl önlerim?",
          a: "Uygulamadan iki gün sonra düzenli ve nazik peeling yap ve cildini yumuşak tut. İlk birkaç gün bol giysiler giymek de yardımcı olur.",
        },
        {
          q: "Hamileyim. Bakım yaptırabilir miyim?",
          a: "Çoğu zaman evet, ama bu dönemde cildin ve bedenin daha hassas olabilir. Emin değilsen önce ebene veya doktoruna danış ve talebinde belirt.",
        },
      ],
    },
    {
      title: "Bikini bölgesi uygulamaları",
      items: [
        {
          q: "Bikini çizgisi, Brezilya ve Hollywood arasındaki fark nedir?",
          a: "Bikini çizgisinde yalnızca bikininin veya iç çamaşırının dışında görünen tüyler alınır. Brezilya ağdasında neredeyse tamamı alınır; istersen ince bir şerit veya küçük bir üçgen bırakılır. Hollywood ağdasında bölge tamamen pürüzsüzdür.",
        },
        {
          q: "Bikini bölgesi uygulaması beni geriyor. Bu normal mi?",
          a: "Tamamen normal. Dilek gizliliğe ve sana saygıyla çalışır, her adımı önceden anlatır ve tempoyu sen belirlersin. Randevundan önce tüm sorularını e-postayla da sorabilirsin.",
        },
        {
          q: "Regl dönemimde ağda yaptırabilir miyim?",
          a: "Önceden belirtmekten çekinme. O dönemde cildin daha hassas olabilir; randevuyu erteleyip ertelememeyi sen seçebilirsin.",
        },
      ],
    },
    {
      title: "Randevular ve pratik bilgiler",
      items: [
        {
          q: "Nasıl randevu talep ederim?",
          a: "'Randevu talep et' sayfasında bakımını, tercih ettiğin bir tarihi ve günün zaman dilimini seçersin. Hemen bir alındı bilgisi alırsın. Randevun ancak Dilek kişisel olarak onayladığında kesinleşir.",
        },
        {
          q: "Glow by Dilek yalnızca kadınlara mı hizmet veriyor?",
          a: "Evet. Glow by Dilek yalnızca kadınlara, randevuyla hizmet verir.",
        },
        {
          q: "Bakımlar nerede yapılıyor?",
          a: "Bakımlar yalnızca randevuyla yapılır. Konumla ilgili pratik bilgiler onaydan sonra kişisel olarak paylaşılır.",
        },
        {
          q: "Bir bakım ne kadar tutuyor?",
          a: "Güncel fiyatları e-postayla kişisel olarak alırsın. Hangi bakımlarla ilgilendiğini belirtmekten çekinme.",
        },
        {
          q: "Lazer epilasyon veya başka bakımlar da sunuyor musunuz?",
          a: "Lazer epilasyon sunulmuyor. Yeni bakımlar ancak gerçekten sunulmaya başladığında duyurulur.",
        },
      ],
    },
    {
      title: "Gizlilik",
      items: [
        {
          q: "Girdiğim bilgilere ne oluyor?",
          a: "Yalnızca sorunu yanıtlamak ve randevunu düzenlemek için kullanılır ve web sitesinin güvenli veritabanında saklanır; yalnızca Dilek erişebilir. Ayrıntılar gizlilik bildiriminde.",
        },
        {
          q: "Forma tıbbi bilgi yazmalı mıyım?",
          a: "Hayır, tercihen yazma. Dikkat edilmesi gereken bir şey olduğunu belirtmen yeterli; ayrıntıları yüz yüze konuşabilirsiniz.",
        },
      ],
    },
  ],
};
