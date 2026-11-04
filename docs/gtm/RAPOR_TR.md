# Glow by Dilek — Resmi Google Tag Manager entegrasyonu

Tarih: 4 Kasım 2026 · Web sitesi dalı: `claude/happy-feynman-ars6eb` · GTM: `GTM-W9VRJF9X` (hesap 6402347939, konteyner 285094047) · GA4: `G-77V0DM6Y7B` (mülk 562355887).

**Hiçbir şey canlıya yayınlanmadı.** GTM'de canlı sürüm hâlâ **sürüm 1 "Empty Container"**. Web sitesi değişiklikleri yalnızca dalda duruyor.

## 1. Tamamlanan

### Web sitesi (bizim projede, Next.js)

- **Mevcut kod incelendi.** Tek yükleyici mantığı var (`src/components/analytics/Analytics.tsx`): ya GTM ya GA4 doğrudan, **asla ikisi birden**. Başka Google betiği yok.
- **Varsayılan artık GTM** (`src/lib/cms/menu.ts`). GA4 doğrudan yükleme yalnızca admin'de bir seçenek olarak kalıyor; GTM ile birlikte hiçbir zaman çalışmıyor. Admin'de kaydedilmiş bir ayar her zaman öncelikli.
- **GTM önyükleme kodu Google'ın resmi snippet'iyle aynı** (`dataLayer.push({'gtm.start',event:'gtm.js'})` + async `gtm.js?id=GTM-W9VRJF9X`). Tek fark: yalnızca **çerez onayından sonra** çalışıyor.
- **Consent Mode v2:** `gtm.js`'ten önce `consent default` (her şey `denied`), ardından seçime göre `consent update` (`analytics_storage=granted`, reklam izinleri her zaman `denied`), en son `gtm.js`.
- **Özel ve kişisel bağlantılı sayfalar:** `/offerte/<token>`, `/agenda`, `/admin` ve `/login` sayfalarında GTM onay verilmiş olsa bile **hiç başlatılmıyor**.
- **noscript yedeği bilinçli olarak eklenmedi.** JavaScript olmadan ziyaretçi çerez onayı veremez; `<noscript><iframe ns.html>` her ziyarette onaysız bir Google isteği yapardı. Bu AVG ve Telecommunicatiewet ile çelişir. GDPR'a uygun "uygun yedek" yedeksiz olmaktır.
- **dataLayer olayları** (yalnızca kişisel olmayan parametreler):
  - `glow_page_view` (sayfa başına 1).
  - `view_treatment`.
  - `booking_start` (ilk etkileşimde 1).
  - `booking_submitted` ve `contact_submitted` (**yalnızca başarılı gönderimde**).
  - `cta_booking_click`, `review_submitted`.

### GTM konteyneri (Tag Manager API, glowbydilek@gmail.com yetkisiyle)

- **Konteynerin önceki durumu:** Tamamen boştu (yalnızca v1 "Empty Container" yayınlıydı).
- **Etiketler:**
  - **Google tag** `G-77V0DM6Y7B`, Initialization tetikleyicisinde: `send_page_view=false`, `allow_google_signals=false`, `allow_ad_personalization_signals=false`; Google'ın yerleşik onay kontrolleri geçerli.
  - **GA4 olayı `page_view`:** Custom Event `glow_page_view` tetikleyicisiyle; `page_location`, `page_path`, `page_title`, `locale` parametreleriyle; `analytics_storage` gerekli.
  - **GA4 olayı `{{Event}}`:** regex tetikleyicisiyle (`view_treatment|booking_start|booking_submitted|contact_submitted|cta_booking_click|review_submitted`); `treatment_id`, `category_id`, `form`, `source`, `locale`; `analytics_storage` gerekli.
- **Değişkenler:** 8 Data Layer değişkeni; 2 tetikleyici.
- **Google'ın otomatik eklediği ayarlar düzeltildi:**
  - **"Kullanıcı tarafından sağlanan veri toplama" (user-provided data):** e-posta, telefon ve adres otomatik toplama **açıktı**; kapatıldı (otomatik ve manuel: off). Aksi halde müşteri iletişim bilgileri Google'a gidecekti.
  - **Gelişmiş ölçüm otomatik olayları:** history, form, video, scroll, outbound ve download **kapatıldı**. Bunlar çift `page_view` üretebilir ve token sayfalarının adresini gönderebilirdi.
  - **GTM'in otomatik oluşturduğu "Google Analytics" hedef etiketi:** Elle oluşturulan Google etiketiyle derleme hatası verdi. Kaldırıldı; tek Google etiketi kaldı.
- **Derlendi ve kaydedildi:** **Sürüm 4, "v4 GA4 via GTM + Consent Mode v2 — RELEASE CANDIDATE (NOT published)".** Sürüm 2 ve 3 ara denemelerdi; hiçbiri yayınlanmadı.

## 2. Doğrulanan (yerel production build, test veritabanı)

| Test | Sonuç | Kayıt |
| --- | --- | --- |
| HTML'de onaydan önce Google betiği, noscript iframe | 0 / 0 | `docs/review/gtm/gtm-integration.txt` |
| Consent Mode sırası | `default(denied)` → `update` → `gtm.js` ✓ | aynı |
| Yükleyici sayısı (3 sayfa gezinme) | 1 × `gtm.js?id=GTM-W9VRJF9X`, 0 × `gtag/js`, sitenin kendisinden 0 `gtag config` | aynı |
| `glow_page_view` | Sayfa başına tam 1 (`/` → `/waxbehandelingen` → `/prijzen`) | aynı |
| İletişim formu | Başarılı gönderimden sonra `contact_submitted` ×1; ad ve e-posta dataLayer'da yok. Form "kullanılamıyor" durumundayken olay **gönderilmedi**. | aynı |
| Randevu talebi | İlk etkileşimde `booking_start` ×1; gönderimden önce dönüşüm yok; başarılı gönderimden sonra `booking_submitted` ×1; kişisel veri yok | `gtm-booking.txt` |
| Token sayfası `/offerte/<token>` (onay kayıtlıyken) | 0 Google isteği | `gtm-integration.txt` |
| Çerez senaryoları, GTM modu (ilk ziyaret, reddet, kabul, geri çekme, tercihler, EN, gizli mod, telefon, özel sayfa) | 9/9 | `consent-gtm-mode.txt` |
| Kritik kontroller | Birim 120/120, kurulum 8/8, randevu/ajanda/e-posta/fatura 28/28, saatler/personel 5/5, navigasyon 13/13; build 0 CMS hatası | `docs/review/gtm/e2e-*.txt` |

**Not:** Testlerde Google sunucuları taklitle (stub) değiştirildi. Bu oturum `googletagmanager.com` adresine bağlanamıyor. Yani gerçek konteynerin tarayıcıda çalışması **henüz test edilmedi** (bölüm 3).

## 3. Hâlâ erişim veya işlem gerektirenler

| Konu | Durum ve gereken |
| --- | --- |
| **Google Tag Assistant / GTM Preview** | **ENGELLİ.** Tarayıcının `tagassistant.google.com` ve `googletagmanager.com` adreslerine erişmesi gerekiyor; bu oturumun ağı engelliyor. Çözüm: Claude Code ortamında izin verilen alan adlarına `glowbydilek.nl`, `www.googletagmanager.com`, `tagassistant.google.com`, `www.google-analytics.com` eklenmesi; ya da Tag Assistant testini sizin yapmanız. |
| **GTM sürüm 4'ü yayınlamak** | **SAHİP ONAYI GEREKLİ.** Yetkim var (`tagmanager.publish`), ama onayınızı bekliyorum. Web sitesiyle **birlikte** yayınlanmalı: önce GTM v4, hemen ardından web sitesi. |
| **Web sitesini yayınlamak** (dalı `main`'e birleştirmek) | **SAHİP ONAYI GEREKLİ.** |
| **GA4: anahtar olaylar** (`booking_submitted`, `contact_submitted`), veri saklama, Signals | **ENGELLİ.** Bağlı GA4 aracı (Stape GA4) yalnızca okuyor; GA4 Admin API `analytics.edit` yazma izni yok. GA4 → Yönetici → Olaylar'da 2 olayı "anahtar olay" olarak işaretlemeniz gerekiyor. Olaylar ilk kez geldikten sonra görünürler. |
| **GA4'te gerçek veri** | Gerçek zamanlı rapor şu an **0 olay**. Beklenen durum: canlı GTM sürümü boş. Yayından sonra GA4 Realtime API ile ben doğrulayabilirim. |
| **Canlı formlar** (`contact_submitted` ve `booking_submitted` canlıda) | Turnstile anahtarları eksik olduğu sürece canlı formlar kapalı. Cloudflare bağlantısında "Turnstile Sites: Edit" izni gerekiyor (önceki rapor). |
| **Stape GTM bağlayıcısı** | `gtm-mcp.stape.ai` 1 Aralık 2026'da kapanıyor. Bağlayıcı URL'sini `https://gtm-mcp.stape.io/mcp` olarak değiştirip Google ile yeniden giriş yapın. |

## 4. Onay sonrası yayın sırası (önerilen)

1. **GTM sürüm 4'ü yayınlarım** (`gtm_version publish`). Tek başına canlı trafiği etkilemez, çünkü canlı site henüz GTM yüklemiyor.
2. **Dalı `main`'e birleştiririm**; Hostinger derler (yaklaşık 2 dakika).
3. **Canlı kontrol:** Siz (ya da izin verilen alan adlarıyla ben) siteyi açar, "Alles accepteren"e basar, 2–3 sayfa gezersiniz. Ben GA4 Realtime'da `page_view` ve olayları kontrol ederim; çift sayım varsa bulurum.
4. **Geri alma:** GTM'de sürüm 1'i yeniden yayınlamak ve web sitesinde birleştirmeyi geri almak (revert).
