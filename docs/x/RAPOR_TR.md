# Glow by Dilek — Master Command V2 uygulama raporu

Tarih: 4 Kasım 2026 · Dal: `claude/happy-feynman-ars6eb` · Canlı sürüm: hâlâ v14 (bu değişiklikler **yayında değil**, onayınızı bekliyor).

## Bu rapor neye dayanıyor?

- **Testler:** Bütün testler bu konteynerdeki yerel üretim build'i (`next build` + `next start`) üzerinde yapıldı. Ayrı ve boş test veritabanları kullanıldı (`glow_a2z`, `glow_a2z3`), ayrıca yerel e-posta yakalayıcı ve Turnstile taklidi.
- **Canlı sistem:** Canlı siteye, canlı veritabanına ve müşteri verisine dokunulmadı. Canlı site bu oturumdan açılamıyor; ağ politikası `glowbydilek.nl` adresini engelliyor.
- **Gerçek cihaz:** Gerçek iPhone/Android ve Safari/Firefox/Edge testi **yapılmadı**. Telefon testleri Chromium'da telefon görünümüyle yapıldı.
- **Durum etiketleri:**
  - **TAMAMLANDI VE DOĞRULANDI**
  - **UYGULANDI, DOĞRULANMADI**
  - **ENGELLİ** (gerekçeyle)
  - **SAHİP ONAYI GEREKLİ**
  - **UYGULANAMAZ**

## Sizden alınan kararlar (4 Kasım)

| Konu | Karar |
| --- | --- |
| Türkçe | Sayfalar dil menüsünde kalıyor. `noindex` alıyor, site haritasından çıkarıldı. E-postalar yalnızca NL/EN. |
| Konum | Amsterdam herkese açık şehir olarak geçiyor. Sokak adresi gizli kalıyor. Amstelveen, Diemen, Haarlem, Hoofddorp, Zaandam ve Zaanstad yalnızca doğal metinde ve `areaServed` içinde geçiyor; ayrı şehir sayfası yok. |
| Google | Kurulumu benim yapmamı istediniz. Bu oturumda Google'a bağlanan hiçbir araç yok (aşağıda, ENGELLİ). |

---

## 1. Kaynak kodu denetimi ve bulunan gerçek sorunlar

| # | Sorun (önce) | Kanıt | Durum |
| --- | --- | --- | --- |
| 1 | Çerez bandında yalnızca 2 düğme vardı; kategori ve tercih ekranı yoktu; ayar bağlantısı yalnızca Analytics açıkken görünüyordu. | `Analytics.tsx` (v1) | Düzeltildi |
| 2 | GTM desteği yoktu; Consent Mode yalnızca `default` olarak yazılıyordu. | aynı | Düzeltildi |
| 3 | Kişisel teklif sayfalarının (`/offerte/<token>`) yolu GA4'e gidebiliyordu; token yolun içinde. | `isTrackablePath` | Düzeltildi |
| 4 | Site haritası her sayfaya `lastModified = şimdi` veriyordu. | `sitemap.ts` | Düzeltildi |
| 5 | Bir dilde `noindex` verilince sayfanın **bütün dilleri** site haritasından çıkıyordu. | aynı | Düzeltildi |
| 6 | Hukuki sayfalar ancak her dilde yayındaysa site haritasına giriyordu. | aynı | Düzeltildi |
| 7 | PDF'lerde Türkçe karakterler bozuktu (Helvetica/WinAnsi). Faturada müşteri adı da bozuluyordu. | `docs/review/x/pdf-before-*.png` | Düzeltildi |
| 8 | Intake PDF'inde uzun cevap başlığı onay kutusunun üstüne biniyordu. | aynı | Düzeltildi |
| 9 | Admin dil sekmeleri "Nederlands / Engels / Engels" gösteriyordu (TR "Engels" yazıyordu). | `paginas/[id]/page.tsx` | Düzeltildi |
| 10 | Admin'deki Kaydet/Yayınla çubuğu telefonda alt menünün altında kalıyordu; iki satır, yaklaşık 120 px yer kaplıyordu. | `ContentEditor.tsx` | Düzeltildi |
| 11 | Numaralı listelerde "01" iki satıra bölünebiliyordu: `0{i+1}` iki ayrı metin düğümüydü, `overflow-wrap:anywhere` ile birlikte. | `TreatmentsPage`, `CategoryPage`, `AboutPage`, `CareTabs`, `BookingPage` | Düzeltildi (aşağıdaki nota bakın) |
| 12 | Türkçe randevu/teklif e-postaları gönderiliyordu. | `booking/service.ts`, `forms/handler.ts` | Düzeltildi (artık NL/EN) |
| 13 | Rol sistemi yoktu; her şey yalnızca sahibe açıktı ve personele hesap verilemiyordu. | `session.ts` | Uygulandı |
| 14 | Build sırasında CMS bağlantı sınırı aşılıyordu (önceki A–Z raporu). | `client.ts`, `next.config.mjs` | Bu dalda düzeltilmişti, korunuyor |

**11 numaralı hata için not:** Bozulma Chromium'da yeniden üretilemedi. Muhtemelen Safari'ye özgü. Düzeltme önleyici niteliktedir (tek metin düğümü + `nowrap`). Durum: **UYGULANDI, iPhone'da DOĞRULANMADI.**

## 2. Dosya dosya değişiklikler

**Çerez onayı ve ölçüm**

- `src/lib/analytics/consent.ts` (yeni):
  - Sürümlü onay kaydı: `glow-consent-v2` = {analytics, marketing, tarih, politika sürümü}. 12 ay geçerli.
  - Consent Mode durumu.
  - Özel sayfa filtresi.
  - Geri çekmede `_ga` çerezlerinin silinmesi.
- `src/components/analytics/Analytics.tsx`:
  - Üç eşit düğme: Alles accepteren / Alles weigeren / Voorkeuren instellen.
  - Tercih ekranı: erişilebilir `<dialog>`, Esc ile kapanıyor.
  - Tek yükleyici: GTM **veya** GA4 doğrudan, asla ikisi birden.
  - Consent Mode v2: önce `default=denied`, sonra seçime göre `update`; reklam izinleri her zaman `denied`.
  - Onaydan önce hiçbir Google isteği yapılmıyor.
- `TrackView.tsx` (yeni): `view_treatment` olayı.
- `AppointmentForm.tsx`: `booking_start` olayı. `booking_submitted` olayı yalnızca başarılı gönderimde.
- `src/lib/cms/menu.ts`: Analytics ayarı genişletildi:
  - `gtmId` ve `mode` (gtm | gtag) eklendi.
  - Varsayılan ID'ler `G-77V0DM6Y7B` ve `GTM-W9VRJF9X`; kapalı başlıyor.
- `SocialAnalyticsForms.tsx`: Admin'de mod seçimi ve GTM-ID alanı.
- `Footer.tsx`: "Cookie-instellingen" bağlantısı artık her zaman görünüyor.
- Sözlükler NL/EN/TR: bant ve tercih metinleri.
- `legal.nl/en.ts`: çerez politikası gerçek envantere göre yeniden yazıldı (her çerez için ad, sağlayıcı, amaç ve süre).
- Gizlilik metni yeni düğme adlarına uyarlandı.

**SEO**

- `src/app/sitemap.ts`:
  - Gerçek tarihler: yerleşik içerik sürüm tarihi, sizin kaydettiğiniz düzenleme ve katalog satırı; hangisi en yeniyse.
  - Dil başına `noindex`.
  - Karşılıklı hreflang.
  - TR ve özel sayfalar hariç.
- `src/lib/seo.ts`:
  - `INDEXED_LOCALES = [nl, en]`; TR sayfalarına `noindex,follow`.
  - hreflang yalnızca indekslenebilir sürümler arasında.
  - `BeautySalon` türü, yalnızca şehir (Amsterdam), `areaServed`.
- `site.ts`: `region` ve `welcomesFrom` alanları.
- `cms/store.ts`, `cms/current.ts`: içerik kayıt tarihleri (`docDates`).
- Sözlükler: ana sayfa, bakımlar, wax ve randevu başlıklarına "Amsterdam" eklendi.

**PDF**

- `src/lib/pdf/fonts.ts` (yeni):
  - Gömülü Liberation Sans/Serif fontları, SIL OFL 1.1 lisanslı (`assets/pdf-fonts/OFL.txt`).
  - Yalnızca kullanılan karakterler PDF'e gömülüyor.
- `intake/pdf.ts`:
  - Unicode font.
  - Cevap sütunu genişliği etikete göre ayarlanıyor; başlıklar kutuların üstüne binmiyor.
  - Uzun seçenekler satır kırıyor.
  - Form NL, EN ve TR'de 2 A4 sayfaya sığıyor.
- `finance/pdf.ts`: Unicode font; başlık serif.
- `next.config.mjs`: fontlar sunucu çıktısına dahil ediliyor (`outputFileTracingIncludes`).

**Roller ve güvenlik**

- `src/lib/auth/permissions.ts` (yeni): rol/izin matrisi (bölüm 14).
- `session.ts`: `requireCan`, `assertCan`, `requireSignedIn`, `currentPermissions`. İzin verilmeyen sayfa döngüsüz bir sayfaya yönlendiriyor.
- `src/lib/auth/staff.ts`, `staffActions.ts`, `StaffForms.tsx`, `admin/medewerkers` (yeni):
  - Davet (48 saatlik tek kullanımlık bağlantı).
  - Rol ve ek haklar.
  - Hesabı kapatma (anında çıkış).
  - Her yerde çıkış.
  - Denetim günlüğü.
- Bütün admin ve ajanda sayfalarına sayfa düzeyinde koruma; eşlenmemiş her şey yalnızca sahibe açık.
- Eylemler:
  - Randevu işlemleri → `agenda.manage`.
  - Saatler ve kapanışlar → `hours.manage`.
  - Finans → `finance`.
  - Intake belgeleri → `health.view`.
  - Katalog → `cms.publish`.
  - Sayfa metni taslak → `cms.edit`, yayınlama → `cms.publish`.
  - SEO, menü, tema, analytics, hukuki metinler → yalnızca sahip.
- Müşteri profili: finans, sağlık ve dışa aktarma bölümleri yalnızca ilgili izinle yükleniyor ve gösteriliyor.
- `auth/mail.ts`: sıfırlama e-postası artık "Hallo Dilek" değil, "Hallo,"; davet e-postası eklendi.

**E-posta dili ve mobil**

- `i18n/config.ts`: `mailLocale()` yalnızca nl/en döndürüyor; booking, quotes ve form işleyici bunu kullanıyor.
- `globals.css`:
  - `overflow-wrap: break-word`: uzun kelimeleri yine kırıyor ama esnek kutuları tek harf genişliğine sıkıştırmıyor.
  - Yapışkan admin çubuğu için `.sticky-actions`.
- `PanelShell.tsx`, `ContentEditor.tsx`, `ThemeEditor.tsx`: telefonda tek satırlık çubuk, alt menünün üstünde.

**Testler**

- `tests/permissions.test.ts` (yeni).
- `tests/marketing.test.ts`: onay kaydı, Consent Mode, özel yollar.
- `tests/seo.test.ts`, `tests/routes.test.ts`: kararlar uygulandı.
- `scripts/e2e-roles-hours.cjs` (yeni).
- `scripts/e2e-navigation.cjs`: çerez seçimi önceden kaydediliyor (bant ayrı test ediliyor).

## 3. Test sonuçları

| Test | Sonuç | Kayıt |
| --- | --- | --- |
| TypeScript, ESLint, production build | TAMAMLANDI VE DOĞRULANDI | build 0 hata. 6 bağlantı sınırlı DB kullanıcısıyla 0 CMS hatası. |
| Birim testleri | 119/119 | `npm test` |
| E2E ilk kurulum / giriş / oturum | 8/8 | `docs/review/x/test-logs/e2e-setup.txt` |
| E2E ajanda / müşteri / fatura / PDF / e-posta / CMS / fiyat / teklif / ödeme | 28/28 | `e2e-private.txt` |
| E2E saatler, kapanış, personel güvenliği (Testler C, D, F) | 5/5 | `e2e-roles-hours.txt` |
| E2E intake + şifreli belgeler + PDF indirme (sunucu üzerinden) | 9/9 | `e2e-intake.txt` |
| E2E navigasyon ve dil | 13/13 | `e2e-navigation.txt`. Not: dil menüsü testi zaman zaman zamanlama yüzünden bir kez düşüyor. Art arda çalıştırmada form hız sınırı (429) beklendiği gibi devreye giriyor. |
| Çerez / Consent Mode ağ testi | 9/9 | `consent.txt` |
| Erişilebilirlik (axe, WCAG 2.1 AA + best practice) | 0 ihlal | Site haritasındaki 76 sayfa × 390 ve 1440 px, bant açıkken; tercih ekranı 0 ihlal (WCAG 2.2 AA kuralları dahil). |
| Genişlik testi | 0 taşma | 19 sayfa × 320, 375, 390, 430, 768, 1024, 1440 px: HTTP 200, yatay taşma yok, numaralar tek satırda. |
| Lighthouse (yerel) | bkz. bölüm 19 | `lighthouse-local.txt` |
| PDF görsel kontrolü | TAMAMLANDI VE DOĞRULANDI | `docs/review/x/pdf-before-*` ve `pdf-after-*` |
| Gerçek iPhone Safari / Android Chrome / Firefox / Edge | ENGELLİ | Bu ortamda yalnızca Chromium var; gerçek cihaz yok. |
| Canlı ortam smoke testi | ENGELLİ | Ağ politikası alan adını engelliyor; yayın da yapılmadı. |

## 4. SEO sayfa envanteri

- **İndekslenebilir sayfalar (76 URL):**
  - **Sabit sayfalar** (her biri NL ve EN): ana sayfa, tüm bakımlar, wax, fiyatlar, hakkında, iletişim, randevu, yorumlar, gizlilik, SSS, hazırlık, bakım sonrası, randevu süreci, ürünler.
  - **Katalog:** masaj ve yüz bakımı bölümleri, wax kategorileri (yüz, vücut, bikini) ve 13 wax hizmeti, 5 masaj, buharlı yüz bakımı.
  - **Hukuki sayfa:** çerez politikası (yalnızca yayındaki hukuki sayfa).
- **Her sayfada:** benzersiz başlık (≤60) ve açıklama (70–175); test bunu her dilde kontrol ediyor. Ayrıca canonical, karşılıklı hreflang + x-default, OG/Twitter, breadcrumb, Service JSON-LD.
- **İndekslenmeyen:**
  - Tüm `/tr` sayfaları (`noindex,follow`).
  - Admin, agenda, login, teklif bağlantıları (`X-Robots-Tag: noindex` + giriş zorunlu).
  - API'ler.
  - Taslak, arşivlenmiş ve yayında olmayan hukuki sayfalar.
- **robots.txt:** `/admin`, `/agenda`, `/login`, `/api/` engelli. Teklif bağlantıları bilinçli olarak engellenmedi, böylece `noindex` okunabiliyor. Asıl koruma giriş ve sunucu tarafı yetkilendirme.
- **Otomatik güncelleme:** Bir hizmet yayınlandığında, değiştirildiğinde veya arşivlendiğinde katalog eylemleri `/`, `/en`, `/tr` düzenlerini ve `/sitemap.xml`'i yeniden doğruluyor. Dilek'in GitHub'a dokunmasına gerek yok. Yeni bir hizmet 2 doğrulama ve `noindex` olmadan geçerse otomatik olarak site haritasına giriyor (yerel test: Test E, `e2e-private` "catalogue …" adımı).
- **`meta keywords`:** kullanılmıyor (bilinçli).

## 5. Anahtar kelime araştırması — kaynak ve tarih

**Arama hacmi verisi: ENGELLİ.** Google Keyword Planner, Search Console veya bir SEO aracına (Ahrefs, Similarweb) erişim yok; bu bağlayıcılar bu oturumda bağlanamadı. **Hiçbir hacim veya zorluk değeri uydurulmadı.**

4 Kasım 2026 tarihli SERP kontrolü (web araması):

| Anahtar kelime | Niyet | Coğrafya | Dil | SERP gözlemi | Hedef sayfa | Öncelik |
| --- | --- | --- | --- | --- | --- | --- |
| waxen / harsen Amsterdam | işlem, randevu | Amsterdam | NL | İlk sonuçlar ağırlıkla Treatwell/Fresha listeleri; bağımsız salonlar azınlıkta | `/waxbehandelingen` (birincil) | Yüksek |
| wenkbrauwen harsen / epileren Amsterdam | işlem | Amsterdam | NL | Treatwell semt sayfaları baskın. Fiyatlar listelerde yaklaşık €20–31 (yalnızca gözlem, doğrulanmadı) | `/waxbehandelingen/gezicht/wenkbrauwen-waxen` | Yüksek |
| schoonheidssalon Amsterdam | genel | Amsterdam | NL | Treatwell "539 salon" listeleri | ana sayfa | Orta (çok rekabetçi) |
| ontspanningsmassage Amsterdam (vrouwen) | işlem | Amsterdam | NL | Treatwell; "yalnızca kadınlar" vurgusu yapan küçük salonlar var | `/massages`, `/massages/ontspanningsmassage` | Yüksek: "alleen voor vrouwen" farklılaştırıcı |
| gezichtsmassage / hoofdmassage / voetmassage | işlem | Amsterdam | NL | Treatwell alt kategorileri | ilgili masaj sayfaları | Orta |
| gezichtsbehandeling Amsterdam | işlem | Amsterdam | NL | Treatwell | `/gezichtsbehandelingen` | Orta |
| waxing / facial / relaxation massage Amsterdam | işlem | Amsterdam | EN | Treatwell EN sayfaları | EN karşılıklar | Orta |

**Sonuç:**

- **Strateji:** SERP'leri aracı platformlar domine ediyor. Gerçekçi strateji, yerel niyetli hizmet sayfaları ve Google İşletme Profili; ayrıca isterseniz Treatwell/Fresha gibi platformlarda görünürlük (bu bir iş kararı).
- **Uygulanan:** Amsterdam başlıklara ve açıklamalara doğal biçimde eklendi.
- **Uygulanmayan:** Şehir başına ince sayfa oluşturulmadı.

Kaynaklar:

- [Treatwell — gezicht Amsterdam](https://www.treatwell.nl/salons/behandeling-type-gezicht/in-amsterdam-nl)
- [Treatwell — wenkbrauwen harsen Amsterdam](https://www.treatwell.nl/salons/behandeling-wenkbrauwen-harsen/aanbod-type-lokaal/in-amsterdam-nl)
- [Treatwell — ontspanningsmassage Amsterdam](https://www.treatwell.nl/salons/behandeling-ontspanningsmassage/aanbod-type-lokaal/in-amsterdam-nl/pagina-2/)
- [Treatwell — head massage Amsterdam](https://www.treatwell.nl/en/places/treatment-head-massage/offer-type-local/in-amsterdam-nl)

## 6. Site haritası doğrulaması — TAMAMLANDI VE DOĞRULANDI (yerel)

- **Kapsam:** 76 URL, hepsi HTTP 200.
- **Temizlik:** Tekrarlanan URL yok; TR veya özel URL yok.
- **hreflang:** Her URL'de kendisine dönen ve karşılıklı nl-NL/en hreflang var.
- **lastmod:** Gerçek tarih (en erken 2026-11-04 yerleşik içerik sürümü), gelecek tarih yok.
- **Kanıt:** `tests/routes.test.ts`.
- **Canlı:** Canlı `https://glowbydilek.nl/sitemap.xml` yayından sonra kontrol edilmeli.

## 7. Google Search Console — ENGELLİ

- **Engel:** Bu oturumda Search Console bağlantısı yok. MCP kayıt defterinde de Google Search Console, Analytics veya Tag Manager bağlayıcısı bulunamadı.
- **Yapılamayanlar:** Dizin durumu, kapsam, Core Web Vitals ve site haritası gönderimi.
- **Doğrulama:** DNS doğrulaması yeniden yapılmadı (gerek yok).
- **Gereken tek erişim:** claude.ai'de Google Search Console'a bağlanan resmi bir bağlayıcı; ya da yayından sonra Search Console → Sitemaps → `sitemap.xml` girişini kendiniz yapmanız (1 adım).

## 8. Bing Webmaster Tools — ENGELLİ

- **Engel:** Bağlantı yok.
- **Önerilen:** Bing Webmaster → "Import from Google Search Console" (GSC doğrulamasını devralır) → site haritası.
- **IndexNow:** Uygulanmadı. Sunucuda gizli bir anahtar dosyası gerektiriyor; ancak Bing hesabı bağlanınca anlamlı. **SAHİP ONAYI GEREKLİ.**

## 9. GTM ve GA4 doğrulaması

| Madde | Durum |
| --- | --- |
| Web sitesi tarafı (GTM ve GA4 modu, tek yükleyici, olaylar, özel sayfa hariç tutma) | **TAMAMLANDI VE DOĞRULANDI (yerel, ağ testi)** |
| GTM konteyner içeriği (GA4 Google tag, tetikleyiciler), yayınlama, GTM Preview, Tag Assistant, DebugView, GA4 anahtar olayları, saklama süresi, Signals kapalı | **ENGELLİ.** GTM ve GA4 hesaplarına erişim yok. Test edilmemiş konteyner yayınlanmadı. |

**Admin'de önerilen kurulum:**

1. Admin → Analytics & cookies → **"Google Analytics direct"**, ID `G-77V0DM6Y7B`, aç → Yayınla. Bu hemen çalışır ve tek bir GA4 örneği yükler.
2. GTM'e ancak konteyner hazırsa geçin. GTM'de:
   - Google tag `G-77V0DM6Y7B`, `send_page_view=false`.
   - GA4 olay etiketi `page_view`, tetikleyici: Custom Event `glow_page_view` (`page_path`, `page_location`, `page_title` dataLayer değişkenlerinden).
   - GA4 olay etiketi `{{Event}}`, tetikleyici: Custom Event regex `^(view_treatment|booking_start|booking_submitted|contact_submitted|cta_booking_click|review_submitted)$`.
   - Consent ayarı "Require additional consent: analytics_storage".
   - Preview ile test → Yayınla.
   - Ardından admin'de modu "Via Google Tag Manager" yapın.
3. GA4'te:
   - `booking_submitted` ve `contact_submitted` olaylarını **anahtar olay** olarak işaretleyin.
   - Veri saklama: 2 ay ya da ihtiyaca göre 14 ay.
   - Google Signals ve reklam kişiselleştirmesi kapalı.

## 10. Çerez bandı ve Consent Mode v2 — TAMAMLANDI VE DOĞRULANDI (yerel Chromium)

Ağ testinde Google'a giden her istek yakalandı (`consent.txt`). Senaryolar:

- **İlk ziyaret:** Bant ve 3 düğme görünüyor. Düğmelerin hesaplanmış stili aynı (yönlendirme yok). Google isteği 0, `_ga` çerezi 0.
- **Tümünü reddet:** Seçim yenilemeden sonra da hatırlanıyor; randevu formu çalışıyor; Google isteği 0.
- **Tümünü kabul et:**
  - Tek yükleyici yükleniyor (`gtag/js?id=G-77V0DM6Y7B`).
  - Önce `consent default`: hepsi `denied`. Sonra `update`: `analytics_storage=granted`, reklam izinleri `denied`.
  - Yol başına tek `page_view`.
- **Bakım sayfası:** `view_treatment` olayı. dataLayer'da e-posta, telefon veya token yok.
- **`/agenda/login`:** Google betiği yok, istek yok, bant yok.
- **Geri çekme:** Footer → Cookie-instellingen → Alles weigeren. `_ga` ve `_ga_*` siliniyor, sayfa Google betiği olmadan yeniden yükleniyor.
- **İngilizce ve Voorkeuren instellen:**
  - Düğmeler: Accept all / Reject all / Customise preferences.
  - Statistik varsayılan olarak kapalı; pazarlama "Not in use".
  - Kapalıyken kaydetmek 0 istek; sonradan açınca 1 yükleyici.
- **Engellenmiş depolama (gizli mod):** Hata yok, Google isteği 0.
- **Telefon (390 × 844):** Bant 299 px (önce 424); taşma yok; tercih ekranı açılıyor.

**Doğrulanamayan:**

- **Gerçek iPhone Safari ve gizli pencere:** ENGELLİ.
- **AP ve Google güncel kılavuzu:** Yalnızca ikincil kaynaklarla kontrol edildi. "Weigeren even makkelijk als accepteren" kuralına uyuluyor ve çerez duvarı yok. Kaynaklar: [Consumentenbond 2025](https://www.consumentenbond.nl/acties-claims/nieuws/2025/onderzoek-cookies-nog-steeds-teveel-opgedrongen), [NOS](https://nos.nl/l/2563725), [Mondaq — AP guidance](https://www.mondaq.com/unitedstates/data-protection/1716426/is-your-websites-cookie-banner-up-to-date-new-guidance-from-dutch-dpa).

**Dikkat:** Admin'de çerez politikasını daha önce kendiniz düzenleyip yayınladıysanız, o veritabanı sürümü yeni metnin önüne geçer. Admin → Juridische pagina's'ta kontrol edin.

## 11. Önce/sonra ekran görüntüleri

`docs/review/x/` klasöründe:

- **Çerez bandı:** `mobile-banner-nl.png`, `desktop-banner-nl.png`.
- **Tercih ekranı:** `mobile-preferences-nl.png`, `desktop-preferences-nl.png`.
- **Admin:**
  - `after-390-admin-taaltabs.png` (dil sekmeleri).
  - `after-390-admin-opslaanbalk.png` (Kaydet çubuğu; bu görüntü son tek satır düzeltmesinden önce alındı).
  - `after-390-admin-medewerkers.png`.
- **Numaralı liste:** `after-390-voorbereiding*.png`.
- **PDF:** `pdf-before-*.png` ve `pdf-after-*.png`.

Tümü yerel Chromium görüntüsü.

## 12. Sahip paneli

- **Mevcut:** Ajanda, Werktijden (haftalık saatler, çoklu aralık, molalar, istisnalar, kapanışlar), Klanten, Behandelingen & prijzen, Pagina's.
- **Yeni:** Medewerkers & rechten.
- **Onay mesajları:** Mevcut ("Werktijden opgeslagen", "Wijzigingen opgeslagen" vb.).
- **Büyük düğmeli tek "Openingstijden / Prijzen / Behandelingen / Agenda / Vrije dagen / Klanten / Medewerkers" panosu:** **UYGULANMADI.** Mevcut menüler bu bölümleri zaten içeriyor; tasarım değişikliği onayınız olmadan yapılmadı. **SAHİP ONAYI GEREKLİ.**

## 13. Fiyat ve çalışma saati iş akışları

| Test | Sonuç |
| --- | --- |
| A — Fiyat değiştir → fiyat listesi ve randevu formu | TAMAMLANDI VE DOĞRULANDI (`e2e-private` "Prices") |
| B — Op aanvraag | TAMAMLANDI VE DOĞRULANDI ("price on request …") |
| C — Salı saatleri 13–15 → yalnızca o saatler | TAMAMLANDI VE DOĞRULANDI |
| D — Kapalı gün → slot yok; kaldırınca geri geliyor | TAMAMLANDI VE DOĞRULANDI |
| E — Yeni hizmet → liste ve site haritası | TAMAMLANDI VE DOĞRULANDI ("catalogue …" + site haritası mantığı) |
| Saat değişince onaylı randevu sessizce iptal edilmiyor | Kodda böyle (randevular silinmiyor). Çakışma uyarısı için ayrı bir test yok: UYGULANDI, DOĞRULANMADI. |

## 14. Personel izin matrisi — TAMAMLANDI VE DOĞRULANDI (birim + E2E)

| İzin | Sahip | Manager | Medewerker | Tekstschrijver |
| --- | --- | --- | --- | --- |
| Ajanda görme / randevu yönetme | ✓ | ✓ | ✓ | – |
| Müşteri iletişim bilgisi görme | ✓ | ✓ | ✓ | – |
| Müşteri düzenleme / birleştirme | ✓ | ✓ | – | – |
| Saatler ve kapalı günler | ✓ | devredilebilir | devredilebilir | – |
| Intake / sağlık bilgisi | ✓ | devredilebilir + 2FA | devredilebilir + 2FA | – |
| Finans, fatura, gider | ✓ | devredilebilir + 2FA | – | – |
| Müşteri dışa aktarma / AVG silme | ✓ | devredilebilir + 2FA | – | – |
| Sayfa metni taslağı | ✓ | devredilebilir | – | ✓ |
| Yayınlama, katalog, fiyat | ✓ | devredilebilir + 2FA | – | – |
| SEO, menü, tema, analytics, hukuki metinler, e-posta metinleri, yedek, sistem, personel, fatura ayarları | ✓ | – | – | – |

- **Kanıt (E2E):** Medewerker hesabı finans, fatura, gider, intake, ayarlar, werktijden, admin, SEO, katalog, tema ve personel sayfalarına giremiyor. Finans dışa aktarma ve yedek indirme reddediliyor. Hesap kapatılınca anında çıkış yapılıyor.
- **Bilinen sınır:** Randevu detay sayfasında ödeme formu personele görünebilir. Sunucu eylemi reddeder (`finance`), ancak arayüzde gizlenmedi.

## 15. Intake ve fatura PDF'leri — TAMAMLANDI VE DOĞRULANDI

- **Gömülü Unicode fontlar:**
  - **NL/EN/TR intake:** Her biri 2 A4 sayfa; Türkçe karakterler doğru.
  - **Fatura:** "Şükrü Çağlayan" doğru görünüyor.
- **Üst üste binme:** Kutuların üstüne binen başlık yok.
- **Sunucu üzerinden indirme:** E2E testte geçti.
- **Hukuki metin:**
  - **AVG madde 9 metinleri:** Mevcut ("açık onay" kutusu ayrı, pazarlama onayı ayrı).
  - **Hukuki inceleme:** Metinler yetkili bir Hollandalı uzman tarafından incelenmedi. **SAHİP ONAYI / UZMAN İNCELEMESİ GEREKLİ.**

## 16. E-posta ve randevu testleri

| Madde | Durum |
| --- | --- |
| Yerelde (yerel posta yakalayıcı) | TAMAMLANDI VE DOĞRULANDI: onay, taşıma/iptal, fiyat teklifi, fatura eki, şifre sıfırlama ve personel daveti. Dil NL/EN; TR ziyaretçiye NL. |
| Canlıda teslimat | **ENGELLİ.** Hostinger'da `SMTP_*`, `SMTP_PASS` ve `CRON_SECRET` hâlâ yok (önceki rapor). Değişkenleri kendiniz eklemelisiniz. |
| Turnstile | **ENGELLİ.** Cloudflare bağlantısında **"Turnstile Sites: Edit"** (`challenge-widgets.write`) izni yok. Anahtarlar olmadan açık formlar kapalı kalıyor; güvenlik kontrolü kapatılmadı. |

## 17. Finans

- **Mevcut testler:** Fatura, kredi notu, ödeme, gelir ve PDF test edildi ve geçti.
- **KDV:** KDV oranları değiştirilmedi.
- **Geçmiş faturalar:** Verilmiş faturaların tutarları ve numaraları değişmez (anlık görüntü). PDF yeniden üretilirse yalnızca font **görünümü** değişir; içerik aynı kalır.
- **Erişim:** Finans artık yalnızca sahibe ve 2FA'lı, finans izni devredilmiş manager'a açık.

## 18. Hukuk, gizlilik ve güvenlik

- **Yapıldı:**
  - Çerez politikası gerçek envantere göre yazıldı.
  - Çerez duvarı yok.
  - Reddetme eşit derecede kolay.
  - Özel sayfalar ölçülmüyor.
  - Sağlık verisi AES-256-GCM ile şifreli ve izinle korunuyor.
  - Roller en az ayrıcalık ilkesine göre; davet bağlantısı 48 saat ve tek kullanımlık.
  - Rol değişince oturumlar kapanıyor.
- **Gizli bilgiler:** Bu rapora, commit'lere veya test kayıtlarına hiçbir sır yazılmadı; test kayıtları taramadan geçti.
- **Bağımlılık açıkları:** Hostinger taraması yalnızca build araçlarında (esbuild, minimatch) açık gösteriyor; çalışma zamanında yok.
- **Uzman incelemesi gerekenler** (genel şartlar, iptal koşulları, intake onay metni, işleyici sözleşmeleri):
  - Hostinger.
  - Google; yalnızca onay verilirse.
  - Cloudflare.

## 19. Performans ve erişilebilirlik (ölçülen değerler, yerel)

| Görünüm | Performans | Diğer kategoriler | LCP | CLS |
| --- | --- | --- | --- | --- |
| Masaüstü | 99–100 | Erişilebilirlik 100, SEO 100, Best Practices 96–100 | 0,7–0,9 s | 0 |
| Telefon | 74–86 | Erişilebilirlik 100, SEO 100 | 2,6–4,2 s | 0 |

- **Telefon LCP'si:** Ana sayfa LCP'si **hedefin altında**. Görsel hemen yükleniyor ama 3,7 s geç çiziliyor; nedeni ana iş parçacığı (stil/yerleşim 1,3 s, bir 690 ms JS parçası). Riskli bir değişiklik yapılmadı; ayrı bir optimizasyon işi olarak önerilir.
- **axe:** 0 ihlal.

## 20. Veritabanı yedeği ve geri alma

- **Migrasyon:** Bu sürümde **yeni bir veritabanı migrasyonu yok.**
- **Yeni ayarlar:** Yalnızca iki ayar anahtarı kullanılıyor: `settings.user_permissions`, ayrıca admin'den kaydedilen `analytics` alanları (`gtmId`, `mode`). Eski analytics kaydı "GA4 direct" olarak okunur.
- **Yayından önce yedek:**
  - **Uygulama:** Admin → Systeem → Back-up indirme.
  - **Hostinger:** hPanel → Files → Backups'tan günlük yedeğin varlığını kontrol edin.
- **Geri alma:** GitHub'da birleştirme commit'ini `main` üzerinde geri alın (revert). Hostinger otomatik olarak önceki sürümü derler. Veri kaybı olmaz; yeni personel hesapları `users` tablosunda kalır ama eski sürüm onları sahip olmadıkları için reddeder.

## 21. Yayına hazırlık kontrol listesi

| Madde | Durum |
| --- | --- |
| Kod, build ve testler | TAMAMLANDI VE DOĞRULANDI (yerel) |
| Yayın (`main`'e birleştirme) | **SAHİP ONAYI GEREKLİ** |
| SMTP + CRON_SECRET + cron görevi | ENGELLİ (siz, hPanel) |
| `OWNER_SETUP_TOKEN` silme | ENGELLİ (siz, hPanel) |
| Turnstile anahtarları | ENGELLİ (Cloudflare izni) |
| GA4/GTM hesap tarafı, GSC ve Bing | ENGELLİ (Google/Bing bağlantısı yok) |
| Yayından sonra canlı smoke testi (sitemap, robots, çerez bandı, giriş, PDF) | ENGELLİ (izin verilen alan adları + yayın) |
| Gerçek iPhone/Android testi | ENGELLİ |
| Hukuki metinlerin uzman incelemesi | SAHİP ONAYI GEREKLİ |
| Basitleştirilmiş büyük düğmeli pano | SAHİP ONAYI GEREKLİ (tasarım) |
| Telefon LCP optimizasyonu | Açık iş |

## 22. Dilek için Felemenkçe kılavuz

`docs/x/HANDLEIDING_NL.md`

## 23. Kalan sınırlamalar ve sahip eylemleri

1. **Yayın onayı:** Bu dalı (`claude/happy-feynman-ars6eb`) `main`'e birleştirip yayınlamam için onay verin.
2. **hPanel ortam değişkenleri:**
   - `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=hello@glowbydilek.nl`, `MAIL_TO=hello@glowbydilek.nl`.
   - `SMTP_PASS` (posta kutusu şifresi).
   - `CRON_SECRET` (40+ rastgele karakter).
   - `OWNER_SETUP_TOKEN`'ı silin.
   - Ardından cron görevini ekleyin (önceki rapor, `docs/a2z/RAPOR_TR.md`).
3. **Cloudflare:** "Turnstile Sites: Edit" izniyle yeniden bağlayın.
4. **Google ve Bing:**
   - Google Search Console / Analytics / Tag Manager için bir bağlayıcı yoksa: yayından sonra Admin → Analytics'te GA4'ü açın, GSC'de `sitemap.xml`'i gönderin.
   - GTM konteynerini bölüm 9'daki gibi kurun ya da bana erişim verin.
5. **Ağ erişimi:** Claude Code ortamında `glowbydilek.nl` adresini izin verilen alan adlarına ekleyin; canlı testleri ben yaparım.
6. **Uzman incelemesi:** Genel şartlar, iptal koşulları ve intake onay metni.
