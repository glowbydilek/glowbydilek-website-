# Glow by Dilek — v13 uygulama raporu (Türkçe)

Tarih: 3 Kasım 2026 · Dal: `claude/happy-feynman-ars6eb` (v12 = `832147f`, v13 = bu dalın son commit'i) · Üretim: **değiştirilmedi**.

## 1. Kısa özet

- **Sahip girişi neden çalışmıyor?** Hostinger'da veritabanı yok ve gizli anahtarlar tanımlı değil. Tek ortam değişkeni `NEXT_PUBLIC_SITE_URL`. Bu yüzden sahip hesabı, oturum anahtarı ve şifre sıfırlama e-postası da yok. Bu bir kod hatası değil, eksik kurulum. Kod tarafında yapılanlar: hassas bilgi göstermeyen bir durum sayfası (`/login/status`), tek kullanımlık ilk şifre yolu (`/login/eerste-wachtwoord` + `OWNER_SETUP_TOKEN`) ve genel hata yerine dürüst veritabanı mesajları eklendi. Sorunu kalıcı çözmek için Dilek'in hPanel'de veritabanı oluşturup ortam değişkenlerini girmesi ve dağıtımı onaylaması gerekiyor (bkz. §6).
- **Siteye eklenenler:**
  - **Türkçe (`/tr`):** tüm sayfalar, e-postalar, intake ve SEO.
  - **Hizmetler:** 5 masaj ve buhar destekli yüz bakımı. 13 ağda hizmeti korundu.
  - **Navigasyon:** "Tüm bakımlar" sayfası, eksiksiz mega menü, mobil kategori akordeonu ve eksiksiz footer.
  - **Randevu:** tek sayfada "saat seç" ve "talep gönder" seçenekleri. Masaj artık kaybolmuyor.
  - **Görünüm:** daha okunur başlık fontu, Türkçe glifler, hizmete özel fotoğraflar, 3 logo adayı.
- **Testler:**
  - 164/164 birim/entegrasyon testi geçti.
  - Tarayıcı E2E: navigasyon 13/13, özel alan 28/28, intake+MFA 9/9, ilk şifre 7/7.
  - Axe: 114 sayfa × 2 genişlikte ihlal yok.
  - 320–1920 px genişliklerde 456 sayfa yüklemesinin hiçbirinde taşma yok.
  - Migration: sıfırdan kurulum ve 0003→0004 yükseltme testleri geçti.

## 2. Yapılan değişiklikler (commit'ler)

| Commit | İçerik |
| --- | --- |
| `c9ee108` | V1 — durum sayfası, ilk şifre yolu, dürüst DB hataları, oturum DB hatasında kapalı kalır |
| `bc5f16e` | V2/V3 — Türkçe dil (rotalar, sözlük, içerik, e-postalar, intake v2), 5 masaj + buhar bakımı, kadınlara özel + diploma, animasyonlu dil menüsü, migration 0004 |
| `4451f3e`, `1953491` | V4 — "Tüm bakımlar" sayfası, tam mega menü, mobil akordeon (üst öğe bağlantı + ayrı aç/kapa), gruplu footer |
| `3938b51` | TR sayfalar ve sitemap yalnızca çevrilmiş öğeleri gösterir |
| `0fb7e9f` | Admin: Türkçe ad/açıklama/adres alanları + "Vertaling nodig (TR)" etiketi |
| `8dc1454` | V5 — birleşik randevu sayfası, `?bakim=` ön seçimi, seçilen gün/saat/seçenekte parıltı |
| `7331b3a` | TR iletişim/talep e-postaları, TR hizmet adları e-postalarda, **TR metin düzenlemesinin NL'yi ezmesi hatası** düzeltildi |
| `bab19f6` | Newsreader Medium başlıklar, Latin Extended font dosyaları, logo adayları |
| `fff6f4f` | 11 hizmete özel fotoğraf |
| `d507bd8` | Intake yükseltme hatası, mobil taşma hatası, ilk şifre E2E |
| `c638b06` + rapor commit'i | sharp'sız yükleme testi ortamdan bağımsız hale getirildi; raporlar |

Ayrıntılı dosya listesi: `docs/v13/DEGISIKLIKLER.md`. Toplam (v12 → v13): 215 dosya, +10 820 / −766 satır.

**Bu çalışmada bulunup düzeltilen gerçek hatalar:**

1. Online randevu açıkken randevu sayfası yalnızca saat seçilebilen hizmetleri gösteriyordu. Masajlar ve talep üzerine yapılan hizmetler kayboluyordu (kanıt: `docs/review/v13/before-after/iphone-booking-form.jpg`).
2. `?bakim=` (Türkçe) ön seçim bağlantısı yok sayılıyordu.
3. Admin sayfa editöründe "TR" sekmesinden kaydedilen metin **Felemenkçe** sürümün üzerine yazılıyordu.
4. Türk müşteriler talep/iletişim onay e-postalarını Felemenkçe alıyordu.
5. Dilek'in v12'de bir "v2" revizyon taslağı varsa yeni master intake formu NL için hiç kurulmuyordu.
6. Mobilde bir saat seçildiğinde gün şeridi sayfayı 345 px'e kadar taşırıyordu.
7. Fontlarda Türkçe İ ğ Ğ ş Ş yoktu; bu harfler yedek fontla görünüyordu.

## 3. QA kabul matrisi

Durum kodları:
- **PASS:** kanıtlı.
- **FAIL:** bilinen hata.
- **BLOCKED:** erişim veya donanım gerekiyor.
- **SAHİP:** sahibin onayı gerekiyor.

Test ortamı: bulut konteyner, Node 22.23, MariaDB yerel test/dev DB, `next build --webpack` + `next start`, yerel SMTP alıcısı, Turnstile sahte doğrulayıcısı, Chromium (Playwright).

### 1. Kaynak, dağıtım, veri

| Madde | Durum | Kanıt / not |
| --- | --- | --- |
| Paket ve kaynak envanteri | PASS | v13 ZIP okundu. v12 = bu dal (`832147f`); ikinci ZIP yüklenmedi. |
| Temel revizyon, yedek planı, müşteri verisinin korunması | PASS | Üretimde DB yok, yani silinecek müşteri verisi de yok. Yedek ve geri alma: `docs/DEPLOYMENT.md` §5–6. Yalnızca eklemeli migration. |
| Yerleşik ve DB hizmetlerinin uzlaştırılması | PASS | Taslaklar taslak kaldı. Yayındaki 19 hizmet `docs/v13/HIZMET_ENVANTERI.md` içinde. |
| Ölü kod ve varlık temizliği | SAHİP | Silme işlemi açık izin gerektirir. Yalnızca bu oturumda üretilen geçici dosyalar silindi. Taş/şişe fotoğrafı (`massage`) artık katalogda kullanılmıyor ama Admin → Media'da duruyor. |
| Build, typecheck, lint, test, `npm audit` | PASS | build ✓, `tsc` 0 hata, eslint temiz, 164/164 test, `npm audit --omit=dev`: 0 açık. |
| Temiz kurulum, yükseltme, bütünlük | PASS | 0000→0004 sıfırdan (50 tablo, 5 migration). 0003→0004 yükseltmede mevcut müşteri ve hizmet satırları korundu. |
| Üretim işlemleri onaya bağlı | PASS | Üretime, DNS'e ve canlı anahtarlara dokunulmadı. |

### 2. Kimlik doğrulama (yayın engeli)

| Madde | Durum | Kanıt / not |
| --- | --- | --- |
| Sahip hesabı oluşturma, sıfırlama, SMTP, hash, oturum, çıkış akışlarının izlenmesi | PASS | Kök neden: üretimde DB ve anahtar yok (salt okunur Hostinger kontrolü). |
| İlk giriş, doğru/yanlış şifre, sıfırlama linki, tekrarlı deneme, çıkış, korumalı yönlendirme | PASS (test ortamı) | `scripts/e2e-private.cjs` 28/28 ve `scripts/e2e-setup.cjs` 7/7. Oturum çerezi `__Host-glow_session`: httpOnly, Secure, SameSite=Lax. |
| Mobil Safari çerezleri | BLOCKED | Gerçek iPhone yok. Chromium iPhone emülasyonunda giriş çalışıyor. |
| Admin, oturum açmış sahiple gerçekten kullanılabiliyor mu | PASS (test ortamı) | CMS, katalog, fatura, intake, medya adımları E2E'de oturum açılmış olarak çalıştı. |
| Rol kontrolleri, intake erişimi, belge indirme, denetim kaydı | PASS | e2e-intake 9/9: oturumsuz erişim yok, önbellek yok, indirme denetleniyor. |
| Güvenli hata mesajları; yanlış "DB bağlantısı yok" uyarısı yok | PASS | `dbErrorKind` hataları ayırt ediyor. Durum sayfasında gizli bilgi bulunmadığı otomatik olarak doğrulandı. |
| Gerçek posta kutusunda e-posta teslimi | BLOCKED | Üretim SMTP şifresi yok. Yerel SMTP alıcısında sıfırlama, onay, erteleme, iptal ve fatura e-postaları alındı. |
| Staging/üretimde sahip girişi | BLOCKED | Önce DB ve ortam değişkenleri (§6), sonra sahibin onayıyla dağıtım. |

### 3. Hizmetler ve doğruluk

| Madde | Durum | Kanıt / not |
| --- | --- | --- |
| Seviye 3 diploma ifadesi | SAHİP | "gediplomeerd schoonheidsspecialiste (niveau 3)". Diplomanın tam adı ve kanıtı sahipten bekleniyor. Başka unvan veya sertifika iddiası yok. |
| Kadınlara özel konumlandırma (3 dil) | PASS | Hero, SSS, olgular, footer. |
| Yüz bakımı taslakları otomatik yayınlanmıyor | PASS | Temizleme, peeling, maske, kapsamlı yüz bakımı ve fırça cihazı taslak. |
| Buhar doğru anlatılıyor; ürün fotoğrafı kullanılmadı | PASS | "Olası bir adım". Ozon veya tıbbi iddia yok. bol.com görseli kullanılmadı; stok fotoğraf yalnızca cihaz türünü gösteriyor. |
| 13 ağda hizmeti ve mevcut masaj korunuyor | PASS | `massage-relaxation` kimliği ve URL'leri korundu. |
| 5 masaj sahip bildirimi olarak yayında; fiyat/süre bekleniyor | PASS / SAHİP | Fiyat ve süre "talep üzerine". |
| Lenf drenajı, derin doku, hamilelik gibi iddialar yok | PASS | — |
| Tüm hizmetler tek kaynaktan, her yerde doğrudan bağlantılı | PASS | `navModel` + `publicItems`. E2E mega menüde 27 öğeyi kontrol ediyor. Sitemap 3 dilde. |
| NL/EN/TR metin kalitesi | PASS / SAHİP | Otomatik tarama 38 TR sayfasında NL/EN kalıntısı bulmadı. Türkçe metni ana dili Türkçe olan biri okumalı. |
| Her hizmette süreç, hazırlık, bakım sonrası, fiyat durumu ve CTA | PASS | Hizmet sayfaları ve "Tüm bakımlar" kartları. |

### 4. Görsel, içerik, navigasyon, erişilebilirlik

| Madde | Durum | Kanıt / not |
| --- | --- | --- |
| İnci/gül/erik paleti korunarak başlıklar iyileştirildi | PASS | Newsreader 500. Karşılaştırma: `docs/review/v13/type-specimen-iphone.png`. |
| Ekran görüntüsü denetimi, taşma | PASS | 456 yükleme, taşma 0. Önce/sonra: `docs/review/v13/before-after/`. |
| Logo seçenekleri | SAHİP | A/B/C: `docs/review/v13/logo-candidates.png`. Öneri B. Canlı logo değişmedi. |
| Hizmete özel fotoğraflar | PASS | 11 yeni slot: 5 masaj, buhar, 5 ağda bölgesi. |
| Stok kişi Dilek, müşteri veya salon olarak sunulmuyor | PASS | Alt metinler "model"; iç mekân görselinde "Sfeerbeeld" etiketi. |
| Tekrarlayan dekor görselleri değiştirildi; lisans kaydı tutuldu | PASS | `docs/PHOTOGRAPHY.md` (Adobe Stock ID'leri). Bikini bölgesinde bilinçli olarak natürmort kaldı. |
| Menüler ve dil menüsü (klavye, Escape, odak) | PASS | E2E: dil menüsü NL→EN→TR→NL, Escape odağı geri veriyor, mobil menüde kaydırma kilidi var. |
| "Alle behandelingen" ve "Behandelingen per categorie" | PASS | 19 kart; mobil akordeon tüm öğeleri listeliyor. |
| Footer | PASS | Kategori başına tüm hizmetler (mobilde açılır), bilgi, iletişim, yasal sayfalar, dil seçimi. |
| 404 yok; tüm header ve footer bağlantıları | PASS | E2E "every header and footer link resolves". |
| Kontrast, odak, dokunma hedefleri | PASS | Axe WCAG 2.2 AA: 0 ihlal. Lighthouse erişilebilirlik 100. |
| Gün, saat, CTA, menü, onay ve dil animasyonları | PASS | Seçilen gün, saat ve sekmede parıltı; dil menüsü; onay kıvılcımı. |
| Azaltılmış hareket | PASS | `prefers-reduced-motion` ile animasyonlar kapanıyor, işlev kalıyor. |
| Gerçek iPhone Safari/Chrome, Android, tablet | BLOCKED | Yalnızca Chromium emülasyonu yapıldı (iPhone 13, 320–1920 px). |

### 5. Randevu, gizlilik, intake

| Madde | Durum | Kanıt / not |
| --- | --- | --- |
| Tüm hizmetler seçilebilir; talep yolu kaybolmuyor | PASS | E2E: masaj ön seçimi talep sekmesini açıyor; "Staat je behandeling er niet bij?" bağlantısı var. |
| Saat dilimi, DST, kapasite, tampon, çakışma | PASS | `tests/engine.test.ts`, `tests/time.test.ts`; çift randevu reddediliyor (E2E). |
| Gönderme, iptal, onay durumları | PASS | E2E: online randevu → Agenda → onay e-postası; iptal ve ertelemede e-posta gidiyor. |
| Çift gönderim, yarış durumu, DB yok, eksik alanlar | PASS | Testler: abuse, turnstile, validation, booking. |
| E-postalar NL/EN/TR ve gerçek durumu yansıtıyor | PASS | `tests/templates.test.ts`: 10 şablon × 3 dil; "talep" ile "onaylandı" ayrımı yapılıyor. |
| Intake NL/EN/TR, koşullu modüller | PASS | Master v2 (`GBD-INTAKE-2026-11-v2`); A4 yazdırma ve PDF. |
| Hassas belgeler şifreli ve erişim kontrollü | PASS | AES-256-GCM, EXIF/GPS siliniyor, oturumsuz erişim yok, silme kaydı tutuluyor. |
| Müşteri fotoğrafı istenmiyor | PASS | Genel avatarlar kullanılıyor. |
| Loglarda ve test verisinde gerçek kişisel veri yok | PASS | Yalnızca `example.com` test adresleri. |
| Çerez, gizlilik ve yasal metinler | SAHİP | Çerez politikası olgulara dayanıyor. Diğer yasal sayfalar sahip/hukuk onayı bekleyen taslaklar. |

### 6. Dil, SEO, performans, kanıt

| Madde | Durum | Kanıt / not |
| --- | --- | --- |
| Tüm metinler 3 dilde | PASS | Admin arayüzü NL (bilinçli). Faturalar NL/EN (TR müşteriye NL fatura). |
| Dil değişince aynı sayfa ve ön seçim korunuyor | PASS | E2E; tercih `localStorage`'da tutuluyor. |
| hreflang, canonical, OG, sitemap, `lang` | PASS | `nl-NL` / `en` / `tr-TR` / `x-default`. Çevrilmemiş öğe TR sitemap'e girmiyor. |
| Uydurma fiyat, yorum, adres, unvan yok | PASS | Fiyatlar talep üzerine; adres yok; yorumlar moderasyondan geçiyor. |
| Lighthouse (mobil) | PASS | `/`: Perf 86, A11y 100, BP 100, SEO 100, CLS 0. `/tr/masajlar`: 92/100/100/100. Randevu: 91/100/96/100 (Turnstile scripti bu ortamda engelli). |
| Dosya listesi, migration'lar, test komutları ve sonuçları | PASS | §4 ve `docs/v13/DEGISIKLIKLER.md`. |
| Masaüstü ve mobil ekran görüntüleri | PASS | `docs/review/v13/` (müşteri verisi yok). |
| Yerel ve canlı doğrulama ayrımı | PASS | Bu rapordaki tüm PASS'ler test ortamına ait; canlı ortam BLOCKED. |
| Sahip sorularının listesi | PASS | §5. |

**v12 notu, "sharp olmadan yükleme" testi:** Burada yeniden üretildi ve geçti (4/4, temiz ortamda da). Testteki argv/stdout bağımlılığı kaldırıldı: girdi ve çıktı artık geçici dosyalardan geçiyor ve hata mesajı exit kodunu, sinyali, stderr ve stdout'u gösteriyor. Not: test paketi Node ≥ 22.6 ister (`--experimental-strip-types`). Node 20 bu bayrağı tanımaz; büyük olasılıkla raporlanan farkın kaynağı ortamdı. Üretim çalışma zamanı (Hostinger Node 20) bundan etkilenmez.

## 4. Test komutları

```bash
npm run lint && npx tsc --noEmit -p . && npm run build
```
```bash
TEST_DATABASE_URL=mysql://USER:PASS@127.0.0.1:3306/glow_test npm test
```
```bash
DATABASE_URL=mysql://USER:PASS@127.0.0.1:3306/BOS_DB node scripts/db-migrate.mjs
```
```bash
node scripts/e2e-navigation.cjs http://localhost:3123
```
```bash
MAIL_DIR=/yol/smtp-alici node scripts/e2e-private.cjs http://localhost:3123
```
```bash
OWNER_PASSWORD=… node scripts/e2e-intake.cjs http://localhost:3123 <musteriId>
```
```bash
OWNER_SETUP_TOKEN=… node scripts/e2e-setup.cjs http://localhost:3123
```

Sonuçlar:
- Birim/entegrasyon: 164/164.
- e2e-navigation: 13/13 (online randevu hem açık hem kapalıyken).
- e2e-private: 28/28.
- e2e-intake: 9/9.
- e2e-setup: 7/7.

## 5. Dilek'e sorular (onay gerekiyor)

1. Diplomanın tam adı nedir? Belgede yazan şekliyle "Schoonheidsspecialiste niveau 3" mü? Gösterebileceğimiz bir kanıt var mı?
2. Masaj ve yüz bakımlarının fiyatları ve süreleri nedir? Hangileri online saat seçimine açılsın?
3. Buharlı yüz bakımı ayrı bir hizmet mi, yoksa yalnızca başka bir bakımın adımı mı?
4. Taslaktaki yüz bakımları (temizleme, peeling, maske, kapsamlı, fırça cihazı), vücut sargısı ve paketlerden hangilerini gerçekten sunuyorsun?
5. Logo: A, B (öneri) ya da C?
6. Yeni fotoğraflar uygun mu? Kendi stüdyo veya ürün fotoğrafların varsa onları tercih ederiz.
7. Türkçe metinleri ana dili Türkçe olan biri okuyabilir mi?
8. Yasal sayfalar (genel koşullar, iptal politikası, yorum politikası) yayınlanmadan önce kontrol edilecek mi?

## 6. Üretime geçiş — onayınız olmadan yapılmayacaklar

Şunların hiçbiri yapılmadı; her biri ayrı izin gerektirir: veritabanı oluşturma, ortam değişkenleri, `main` dalına merge (Hostinger her merge'de otomatik dağıtır), DNS değişikliği, ücretli hizmet.

Adımlar (`docs/DEPLOYMENT.md` §2e):
1. **Sen:** hPanel → MySQL veritabanı ve kullanıcısı oluştur.
2. **Sen:** hPanel → Node.js → ortam değişkenlerini gir. Yalnızca adlar: `DATABASE_URL`, `DB_MIGRATE_ON_BUILD`, `AUTH_SECRET`, `CRON_SECRET`, `SMTP_*`, `MAIL_TO`, Turnstile anahtarları, `INTAKE_DOCUMENT_KEY`, `CONSULTATION_KEY`, geçici `OWNER_SETUP_TOKEN`. Değerleri sohbete yazma.
3. **Onayınla:** PR'ı `main`'e merge et (dağıtım ve migration'lar çalışır).
4. `/login/status` sayfasında her satır "In orde" olmalı.
5. İlk şifreyi belirle ("Wachtwoord vergeten?" ya da `/login/eerste-wachtwoord`), iki adımlı doğrulamayı aç, sonra `OWNER_SETUP_TOKEN`'ı sil.
6. Canlı ortamda kontrol: gerçek posta kutusunda sıfırlama ve randevu e-postaları, gerçek iPhone'da giriş ve randevu.

Ben de bu adımları Hostinger API üzerinden yapabilirim (veritabanı oluşturma ve ortam değişkenleri). Bunun için açık iznin gerekir; SMTP şifresini ise yalnızca sen hPanel'e girebilirsin.

## 7. Teslim

- Kaynak: `claude/happy-feynman-ars6eb` dalı (taslak PR glowbydilek/glowbydilek-website-#12).
- ZIP: kaynak kodu (node_modules, .next ve orijinal fotoğraflar hariç) ve bu rapor.
- İnceleme klasörü: `docs/review/v13/` (önce/sonra, logo adayları, tipografi, masaj sayfası).
