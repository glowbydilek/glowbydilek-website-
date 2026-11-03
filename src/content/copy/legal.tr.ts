import type { LegalDoc, LegalKey } from "./legal.nl";

/** Yasal sayfalar (TR). Kurallar için legal.nl.ts'ye bak; Hollandaca metin esastır. */
export const legalTr: Record<LegalKey, LegalDoc> = {
  cookies: {
    title: "Çerez politikası",
    effectiveDate: "1 Kasım 2026",
    intro: "Bu sayfa, web sitesinin hangi çerezleri ve benzeri teknikleri ne için kullandığını ve tercihini nasıl değiştirebileceğini açıklar. Hollandaca metin esastır.",
    sections: [
      {
        title: "Onay olmadan: yalnızca gerekli olan",
        paragraphs: [
          "Ziyaretçi olarak sana reklam veya profil oluşturma amaçlı çerez yerleştirmeyiz. İstatistiklerle ilgili tercihin (evet veya hayır), her ziyarette yeniden sormamak için kendi tarayıcında saklanır (yerel depolama, 'glow-consent-v1' anahtarı).",
          "Sahibin yönetim alanı, oturumun açık kalması için gerekli tek bir oturum çerezi kullanır. Bu yalnızca sahip için geçerlidir, ziyaretçiler için değil.",
        ],
      },
      {
        title: "İstatistikler (yalnızca onayınla)",
        paragraphs: [
          "Sahip istatistikleri açtıysa ve sen onay verirsen, web sitesi sitenin nasıl kullanıldığını görmek için Google Analytics 4 kullanır. Google bu durumda '_ga' ve '_ga_…' gibi çerezler yerleştirir. Reklam özellikleri kapalıdır ve Google'a ad, e-posta adresi, telefon numarası veya randevu ayrıntısı gönderilmez.",
          "Onayın olmadan Google Analytics yüklenmez.",
        ],
      },
      {
        title: "Form güvenliği",
        paragraphs: ["İletişim, randevu ve yorum formları, botların kötüye kullanımını önlemek için Cloudflare Turnstile kullanır. Cloudflare bunun için tarayıcın ve bağlantınla ilgili teknik verileri işler. Ayrıntılar için Cloudflare'in gizlilik politikasına bak."],
      },
      {
        title: "Tercihini değiştirmek",
        paragraphs: ["Tercihini istediğin zaman değiştirmek veya geri almak için her sayfanın altındaki 'Çerez ayarları'nı kullan. Çerezleri tarayıcı ayarlarından da silebilirsin."],
      },
    ],
  },
  terms: {
    title: "Genel koşullar",
    effectiveDate: "[INVULLEN: yürürlük tarihi]",
    intro: "Bu koşullar Glow by Dilek'teki randevular için geçerlidir. Hollandaca metin esastır. [INVULLEN: yayımlamadan önce metni kontrol ettir.]",
    sections: [
      { title: "Randevular", paragraphs: ["Bir randevu ancak e-postayla kişisel onaydan sonra kesinleşir.", "[INVULLEN: randevuların ne kadar önceden alınabileceği ve kapora olup olmadığı — ya da bu satırı kaldır.]"] },
      { title: "Fiyatlar ve ödeme", paragraphs: ["Fiyatlara KDV dahildir. 'Talep üzerine' fiyatlarda önce kendin kabul ettiğin bir fiyat teklifi alırsın.", "[INVULLEN: kabul edilen ödeme yöntemleri.]"] },
      { title: "Sağlık ve güvenlik", paragraphs: ["Lütfen ilaçları, cilt rahatsızlıklarını, alerjileri veya hamileliği önceden belirt. Emin olunamadığında bir bakım yapılmayabilir; bu senin yararınadır.", "Güzellik bakımı tıbbi bir uygulama değildir."] },
      { title: "Şikâyetler", paragraphs: ["Bir şeyden memnun kalmadın mı? Lütfen mümkün olan en kısa sürede hello@glowbydilek.nl adresinden bildir; birlikte bir çözüm ararız.", "[INVULLEN: şikâyetin bildirilebileceği süre.]"] },
      { title: "Sorumluluk", paragraphs: ["[INVULLEN: sorumluluk maddesini bir avukata veya meslek kuruluşuna hazırlat ya da kontrol ettir.]"] },
    ],
  },
  cancellation: {
    title: "İptal politikası",
    effectiveDate: "[INVULLEN: yürürlük tarihi]",
    intro: "Gelemeyecek misin? Yerin başka birine verilebilmesi için lütfen mümkün olan en kısa sürede haber ver.",
    sections: [
      { title: "İptal veya erteleme", paragraphs: ["Onay e-postanı yanıtlayarak ya da hello@glowbydilek.nl adresine yazarak iptal et veya ertele.", "[INVULLEN: kaç saat öncesine kadar iptal veya ertelemenin ücretsiz olduğu.]"] },
      { title: "Geç iptal veya gelmeme", paragraphs: ["[INVULLEN: geç iptal veya randevuya gelinmemesi durumunda ne olacağı — örneğin ücret alınmaz ya da sabit bir tutar. Yalnızca gerçekten uyguladığın ücretleri belirt.]"] },
      { title: "Glow by Dilek iptal etmek zorunda kalırsa", paragraphs: ["Bir randevu hastalık veya elde olmayan nedenlerle iptal edilmek zorunda kalırsa en kısa sürede haber alırsın ve birlikte yeni bir zaman planlarız. Herhangi bir ücret alınmaz."] },
    ],
  },
  reviews: {
    title: "Yorum politikası",
    effectiveDate: "[INVULLEN: yürürlük tarihi]",
    intro: "Bu web sitesindeki yorumları nasıl ele aldığımız.",
    sections: [
      { title: "Kimler yorum yapabilir", paragraphs: ["Herkes web sitesi üzerinden yorum gönderebilir. Tamamlanan bir randevudan sonra Dilek kişisel bir davet de gönderebilir; böyle bir yorum gerçek bir randevuyla ilişkilidir."] },
      { title: "Yayımlanmadan önce kontrol", paragraphs: ["Her yorum yayına girmeden önce okunur. Başkalarının kişisel verilerini, saldırgan içerik, reklam veya tıbbi iddialar içeren ya da yazarın kendi deneyimiyle ilgili olmayan yorumlar yayımlanmaz. Yorumlar asla düzenlenmez; Dilek herkese açık bir yanıt yazabilir."] },
      { title: "Ödül yok", paragraphs: ["Yorum karşılığında indirim, hediye veya başka bir ödül verilmez."] },
      { title: "Bildirme", paragraphs: ["Yayımlanmış bir yorumda bir sorun mu var? 'Bildir' düğmesini kullan. Birkaç bildirimden sonra yorum yeniden incelenir."] },
    ],
  },
};
