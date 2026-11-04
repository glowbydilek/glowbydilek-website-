# Glow by Dilek — Canlı yayın, güvenlik denetimi ve kabul testi (son rapor)

Tarih: 4 Kasım 2026.

**Sonuç özeti**
- Yeni sürüm **canlıda** ve çalışıyor.
- GA4 ilk gerçek verisini aldı.
- **Bir kritik sorun açık:** Turnstile site key'i hatalı. Bu yüzden giriş ve formlar canlıda çalışmıyor. Düzeltme yalnızca sizin yapabileceğiniz bir işlem (bölüm 14).
- Bu sorun çözülmeden proje "bitti" sayılmaz.

Durum etiketleri: **PASS** (doğrulandı), **FAIL** (doğrulanmış hata), **BLOCKED** (erişim yok), **NOT TESTED** (gerekçeli).

## 1. GitHub

| Konu | Değer |
| --- | --- |
| Depo | `glowbydilek/glowbydilek-website-` |
| Yayın PR'ı | [glowbydilek/glowbydilek-website-#16](https://github.com/glowbydilek/glowbydilek-website-/pull/16): CI iki iş de **PASS** (Node 22 testleri ve MariaDB, Node 20 production build) |
| `main` üzerindeki birleştirme commit'i | **`b2b92e59c6ab2c49915f951c24be019758786e8e`** |
| Önceki canlı sürüm (geri alma noktası) | `81afde36a7f9b7f134377c43be68f634797dfcc0` |
| Geliştirme dalı | `claude/happy-feynman-ars6eb` (bu rapor ve canlı test betiği burada) |

**Commit edilmeyen dosya ve gizli bilgi taraması: PASS**
- secretlint tüm depoda çalıştı. Bulunanların hepsi yerel test parolaları (`devpass`) veya örnekler (`USER:PASSWORD`).
- CI'daki geçici test veritabanı parolası production değildir.
- Commit edilmiş `.env` dosyası yok. Gerçek müşteri verisi yok; testlerde yalnızca `example.com` ve uydurma numaralar kullanıldı.

## 2. Canlı yayın: PASS

**Derleme**
- Hostinger, `b2b92e5`'i derledi: 19:22:40 → 19:25:00 UTC.
- Hostinger'ın kendi `npm install` taramasında **found 0 vulnerabilities**.
- Migrasyon: "database schema is up to date". Bu sürümde veritabanı değişikliği yok.

**Yeni sürümün gerçekten canlıda olduğu ayrıca doğrulandı**
- Canlı JavaScript'te yeni olay adı `booking_started` var.
- Eski `booking_start` yok.

**Çalışma durumu**
- Sunucu günlükleri: 19:24:55'te "Ready"; hata yok.
- Durum sayfası (`/login/status`): veritabanı, migrasyonlar ve cron "In orde".

## 3. Yayınlanan değişiklikler

- **GTM varsayılan yükleyici.** GA4 ayarları GTM'in içinde. **GTM sürüm 5 yayınlandı.** Önceden canlıda boş sürüm 1 vardı.
- **Consent Mode v2.**
  - Sıra: önce `default` (her şey reddedilmiş), sonra kullanıcının seçimine göre `update`, en son GTM.
  - Reklam izinleri her zaman kapalı.
- **Ölçülmeyen sayfalar.** `/admin`, `/agenda`, `/login` ve teklif bağlantıları onay verilmiş olsa bile ölçülmez.
- **Olaylar:** `page_view`, `view_treatment`, `booking_started`, `booking_submitted`, `contact_submitted`. Son ikisi yalnızca başarılı gönderimden sonra gider. Kişisel veri gönderilmez.
- **Olay adı düzeltmesi.** İsteğinize uygun olarak `booking_start` → **`booking_started`** oldu; kod ve GTM birlikte güncellendi.
- **Yeni test.** 24 saat hatırlatması: tek sefer, NL/EN dilinde. Durum sayfası artık saatlik cron'u kabul ediyor.
- **Geliştirme bağımlılığı uyarıları kapatıldı.** `npm audit`: 0.
- **Erişilebilirlik.** Animasyonla açılan bölümler klavye odağıyla hemen görünür.

## 4. Google Analytics 4 ve GTM (gerçek veri)

| Test (canlı, gerçek GTM ve GA4) | Sonuç |
| --- | --- |
| İlk ziyaret: çerez bandı var; onaydan önce **0** Google isteği, 0 `_ga` çerezi | **PASS** |
| "Alles weigeren": bant kapanıyor; sonraki sayfada 0 Google isteği | **PASS** |
| "Alles accepteren": sıra `consent default → update → gtm.js → glow_page_view`; tek GTM yükleyici; gtag'i yalnızca GTM yüklüyor | **PASS** |
| GA4 isteği: `page_view@G-77V0DM6Y7B`, `gcs=G101` (analitik izinli, reklam reddedilmiş); sayfa başına tek `page_view` | **PASS** |
| **GA4 Realtime API:** `first_visit` 1, `session_start` 1, `page_view` 1 | **PASS**: GA4 gerçek veri alıyor |
| Onay sonrası `/login` ve `/offerte/…`: 0 Google isteği | **PASS** |
| Onayı geri çekme ("Cookie-instellingen" → reddet): `analytics:false` kaydediliyor; sonraki sayfada 0 Google isteği | **PASS** |
| `booking_started` ve `booking_submitted` (yerel production build, test veritabanı): her biri 1 kez, kişisel veri yok | **PASS** |
| `contact_submitted` ve `booking_submitted` canlıda | **BLOCKED**: canlı formlar Turnstile hatası yüzünden gönderilemiyor |
| GA4 anahtar olaylar (dönüşümler) | **BLOCKED**: GA4 bağlayıcısı yalnızca okuyabiliyor; işaretlemeyi siz yapmalısınız |
| Çift GA4 kurulumu | **PASS**: tek Google etiketi; GTM'in otomatik GA etiketi kaldırıldı |

Not: Headless test tarayıcısının ziyaretlerini GA4 bot olarak filtreliyor. Bu yüzden Realtime doğrulaması normal bir Chrome kimliğiyle yapıldı.

## 5. Search Console, sitemap ve SEO

| Konu | Sonuç |
| --- | --- |
| robots.txt: `/admin`, `/agenda`, `/login`, `/api` kapalı; sitemap adresi var | **PASS** |
| sitemap.xml | **PASS**: 76 adres. Özel, teklif, API ve Türkçe adres yok. Yeni yayınlanan bir behandeling veritabanından **otomatik** eklenir (`src/app/sitemap.ts`). |
| Ana sayfa Google'da | **PASS**: "Submitted and indexed"; Google'ın seçtiği canonical = `https://glowbydilek.nl/` |
| `/en` Google'da | Henüz bilinmiyor (dizine alınmış **denemez**). Sitemap gönderilince taranacak. |
| Sitemap'i Search Console'a gönderme | **BLOCKED**: yazma izni yok; Search Console'da kayıtlı sitemap: **0** |
| Canonical, hreflang (`nl-NL`, `en`, `x-default`); `/tr`, `/login`, `/agenda` noindex | **PASS** |
| Yapılandırılmış veri | **PASS**: BeautySalon, Service, BreadcrumbList, FAQPage. Şehir Amsterdam; sokak adresi yok. |
| Mobil performans (PageSpeed, `/en`) | **PASS**: 86/100, CLS 0, TBT 30 ms, LCP 3,7 sn (iyileştirilebilir) |

## 6. SMTP, e-posta ve hatırlatmalar

| Konu | Sonuç |
| --- | --- |
| SMTP bağlantısı ve girişi (`hello@glowbydilek.nl`) | **PASS** (canlı durum sayfası ve Hostinger posta kaydı) |
| SPF, DKIM, DMARC | **PASS**: SPF `include:_spf.mail.hostinger.com`, 3 DKIM kaydı, DMARC var. Öneri: DMARC şu an `p=none` (yalnızca izleme); birkaç hafta sonra `p=quarantine`. |
| Cron `0 * * * *` → `/api/cron/tick` | **PASS**: son çıktı `{"ok":true,…}`. Anahtar olmadan, yanlış anahtarla veya URL parametresiyle istek → 401. Gizli anahtar URL'de değil, başlıkta. |
| 24 saat hatırlatması: tek sefer, çift cron çalışmasında tekrar yok, NL/EN dilinde | **PASS** (otomatik test) |
| İptal veya taşıma sonrası eski hatırlatma gitmiyor | **PASS** (otomatik test) |
| Europe/Amsterdam saati ve yaz/kış saati geçişi (29 Mart, 25 Ekim) | **PASS** (otomatik testler) |
| Onay, iptal, taşıma, iletişim, şifre sıfırlama ve sahibe bildirim e-postaları | **PASS** yerelde, posta yakalayıcıyla (28/28). **BLOCKED** canlıda: formlar Turnstile yüzünden kapalı. Gerçek müşteriye e-posta gönderilmedi. |
| Gönderim hatasında tekrar deneme; hiçbir e-posta kaybolmuyor veya iki kez gitmiyor | **PASS** (otomatik test) |

## 7. Cloudflare Turnstile

| Konu | Sonuç |
| --- | --- |
| Sunucu doğrulaması: token yok veya sahte token → 403; test token'ı canlıda reddediliyor | **PASS** |
| **Tarayıcı widget'ı** | **FAIL, kritik.** Cloudflare hata 400020 (invalid sitekey) veriyor. Sayfadaki site key **25 karakter**; Cloudflare site key'leri normalde **24** karakter. Büyük olasılıkla kopyalarken fazladan bir karakter eklenmiş. |
| Etkisi | Admin ve agenda girişi, şifre sıfırlama, iletişim ve randevu formları canlıda gönderilemiyor |
| Turnstile secret'ını yenileme | **BLOCKED**. Cloudflare bağlantısında Turnstile izni yok (403). Hostinger yalnızca tüm ortam değişkenlerini birden değiştirmeye izin veriyor ve değerler okunamıyor; bu yolla değiştirmek diğer gizli bilgileri silerdi. |

## 8. API güvenlik testleri (canlı, yıkıcı olmayan)

| Test | Sonuç |
| --- | --- |
| Giriş yapmadan özel sayfalar (`/admin`, `/agenda`, müşteri, fatura, intake, finans, yedek, gider fişi; 12 adres) | **PASS**: 307 (girişe yönlendirme) veya 401 |
| Rastgele kimliklerle nesne erişimi (IDOR/BOLA; örn. `/agenda/klanten/1/export`) | **PASS**: 401 |
| Yanlış HTTP metodu | **PASS**: 405 |
| Başka siteden gönderim (same-origin kontrolü) | **PASS**: 403 |
| CORS | **PASS**: başka kaynağa izin başlığı yok |
| SQL benzeri girdi (`/media/1' OR 1=1--`) | **PASS**: 404 |
| Geçersiz girdi | **PASS**: 400/403. Spam tuzağı (honeypot) botlara sahte "ok" döndürüyor; hiçbir şey kaydedilmiyor veya gönderilmiyor. |
| Sahte teklif token'ı | **PASS**: "link geçersiz" sayfası, noindex, veri yok |
| Güvenlik başlıkları | **PASS**: HSTS (preload), CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| TLS | **PASS**: TLS 1.3, Let's Encrypt, 29 Ocak 2027'ye kadar geçerli |
| Yerel güvenlik testleri: giriş, oturum, MFA, rate limit, rol yetkileri, dosya yükleme ve indirme | **PASS**: 171/171 birim ve veritabanı testi, kurulum 8/8, özel bölüm 28/28 |
| Yük, kaba kuvvet ve DoS testleri | **NOT TESTED**: canlıya yıkıcı test yapılmadı (talimat). Rate limit yerelde test edildi. |

## 9. Rol ve yetki testleri

| Konu | Sonuç |
| --- | --- |
| Sahip, yönetici, personel ve editör yetkileri sunucuda zorunlu | **PASS** (yerel, birim ve e2e) |
| Personel finans, intake, ayarlar, web sitesi yönetimi ve personel yönetimine erişemiyor | **PASS** (e2e 5/5) |
| Hesap kapatılınca oturum anında sonlanıyor | **PASS** |
| Canlıda giriş yaparak rol testi | **BLOCKED**: Turnstile hatası ve test hesabı yok |

## 10. Bağımlılık güvenliği

- `npm audit` ve Hostinger derlemesi: **0 açık**.
- Hostinger tarayıcısı yeniden taradı: 5 uyarı → **2**. Kalan ikisi gerçek değil, güvenle yok sayılabilir:
  - **esbuild GHSA-gv7w-rqvm-qjhr:** GitHub danışmayı 17 Haziran 2026'da geri çekti.
  - **minimatch 3.1.5:** etkilenen aralığın (`>=7.0.0 <11.0.1`) dışında; yanlış alarm.
- İkisi de yalnızca geliştirme araçlarında. Ayrıntılar: `docs/security/RAPOR_TR.md`.

## 11. Mobil, PDF ve site QA

| Konu | Sonuç |
| --- | --- |
| Canlı: 15 NL/EN sayfa × iPhone 13, Pixel 7, iPad Mini, masaüstü | **PASS**: hata sayfası 0, yatay kayma 0, sunucuda 4xx/5xx 0, çerez bandı NL/EN |
| İnceleme notu | Bu test ortamının tarayıcısı, adında `[ ]` olan JS dosyalarında sahte bir 404 alıyor; curl, Python ve aynı ağdaki aracı sunucu aynı dosyalarda 200 alıyor. Site doğru sunuyor. Sorun bu ortamın bağlantısında; ziyaretçileri etkilemiyor. |
| Intake ve fatura PDF'leri (Unicode, NL/EN, KDV) | **PASS** yerelde: intake e2e 9/9, KDV/fatura testleri. Canlıda **BLOCKED** (giriş yok). |
| **Canlıda intake belge yükleme** | **FAIL (yapılandırma).** `INTAKE_DOCUMENT_KEY` ve `CONSULTATION_KEY` Hostinger'da tanımlı değil; şifreli belge yükleme ve görüntüleme kapalı. |
| Online slot rezervasyonu | Kapalı: canlıda çalışma saati girilmemiş. Randevu talep formu (Turnstile düzelince) çalışır. |
| AVG/GDPR | Teknik önlemler doğrulandı: onaydan önce takip yok, veri dışa aktarma ve anonimleştirme testleri var. **Hukuki uygunluk iddia edilmiyor.** Gizlilik, çerez ve şartlar metinleri ile sağlık verisi (intake) işlemenin bir hukukçu tarafından gözden geçirilmesi önerilir. |

## 12. Test özeti ve kanıt

| Test | Sonuç |
| --- | --- |
| Birim ve veritabanı testleri | 171/171 |
| TypeScript, ESLint, `npm ci`, build (0 CMS/DB hatası) | temiz |
| e2e (yeni test veritabanı): kurulum, özel bölüm, roller ve saatler, intake, navigasyon | 8/8, 28/28, 5/5, 9/9, 13/13 |
| Çerez onayı (GTM modu), GTM, randevu olayı | 9/9, 4/4, 1/1 |
| Canlı smoke testi (onay ve GA4) | 11/11 + Realtime |
| Canlı çok cihazlı QA | yukarıdaki tabloda |
| CI ([glowbydilek/glowbydilek-website-#16](https://github.com/glowbydilek/glowbydilek-website-/pull/16)) | PASS |

Kayıtlar: `docs/review/release/`. Canlı test betiği: `scripts/analytics/live-smoke.cjs`.

## 13. Açık engeller ve riskler

1. **Kritik: Turnstile site key'i hatalı.** Giriş ve tüm formlar kapalı; müşteriler randevu veya iletişim talebi gönderemiyor.
2. **Gizli anahtarlar henüz yenilenmedi** (cron, Turnstile secret). Ekran görüntülerinde göründükleri için ele geçirilmiş sayılmalılar.
3. **Intake anahtarları eksik.** Şifreli intake belgeleri canlıda kullanılamıyor.
4. **Güncel üretim veritabanı yedeği alınamadı.**
   - Hostinger API'sinde yedekleme işlemi yok.
   - Uygulamanın kendi yedeği giriş gerektiriyor; giriş de Turnstile yüzünden kapalı.
   - Bu yayın veritabanını değiştirmedi (migrasyon yok); veri riski oluşmadı.
5. `OWNER_SETUP_TOKEN` hâlâ tanımlı.
6. Stape GTM bağlayıcısının adresi 1 Aralık 2026'da kapanıyor.

## 14. Yalnızca sizin yapmanız gerekenler (öncelik sırasıyla)

1. **Turnstile, birlikte yapın:**
   1. Cloudflare → Turnstile → widget → **Hostname** listesinde `glowbydilek.nl` olsun.
   2. **Site Key**'i yeniden kopyalayın (24 karakter, `0x4AAAA…`).
   3. Aynı ekranda **Rotate secret key** ile yeni bir secret üretin.
   4. hPanel → Node.js → Environment variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ve `TURNSTILE_SECRET_KEY`'i tek tek düzenleyin.
   5. **Redeploy** yapın; site key derleme sırasında koda gömülüyor. Ardından bana "Turnstile tamam" yazın, girişi ve formları ben test ederim.
2. **Cron anahtarını yenileyin:**
   1. Parola yöneticinizle en az 40 karakterlik yeni bir değer üretin.
   2. hPanel'de yalnızca `CRON_SECRET`'i değiştirin.
   3. Cron Jobs → saatlik işin komutundaki `Bearer` değerini **aynı** yeni değerle güncelleyin.
   4. Uygulamayı yeniden başlatın. Değeri bana göndermeyin; sonraki saatteki çalışmayı ben doğrularım.
3. **Intake anahtarlarını ekleyin.**
   - `INTAKE_DOCUMENT_KEY` ve `CONSULTATION_KEY` için ayrı ayrı şu komutu çalıştırın ve çıktıyı yeni bir değişken olarak hPanel'e girin:

     ```bash
     openssl rand -base64 32
     ```
   - **Anahtarları güvenli bir yere de kaydedin.** Kaybolursa şifreli belgeler açılamaz.
4. **`OWNER_SETUP_TOKEN`'ı silin** (hPanel → Environment variables).
5. **Yedek:** hPanel → Backups'tan güncel veritabanı yedeğini indirin. Turnstile düzelince ayrıca Admin → Systeem → **Back-up downloaden**.
6. **Search Console:**
   - Sitemaps → `https://glowbydilek.nl/sitemap.xml` → Gönder.
   - Ya da bağlayıcıya yazma izni verin: https://mcpsearchconsole.com/connect/write
7. **GA4:**
   - Olaylar ilk kez geldikten sonra Yönetici → Olaylar'da `booking_submitted` ve `contact_submitted`'ı **anahtar olay** yapın.
   - Veri saklamayı 14 ay yapın.
   - Google Signals kapalı kalsın.
8. **İsteğe bağlı:**
   - Online saat seçimi için Agenda → Werktijden'e çalışma saatlerini girin.
   - Birkaç hafta sonra DMARC'ı `p=quarantine` yapın.
   - Stape GTM bağlayıcı adresini `https://gtm-mcp.stape.io/mcp` olarak değiştirin.

## 15. Geri alma hazırlığı: hazır

1. GitHub'da birleştirme commit'i `b2b92e5`'i geri alın (revert); Hostinger `main`'i otomatik derler (yaklaşık 2 dakika).
2. Gerekirse GTM'de **sürüm 1**'i yeniden yayınlayın; GA4 ölçümü durur.
3. Veritabanı değişmediği için veri geri alma gerekmez.
4. Yayın sonrası smoke testlerinde kritik bir gerileme bulunmadı; geri alma gerekmedi.
