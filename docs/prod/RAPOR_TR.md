# Glow by Dilek — Canlı entegrasyon ve doğrulama raporu

Tarih: 4 Kasım 2026 · Canlı sürüm: `main` @ `81afde3` · Geliştirme dalı: `claude/happy-feynman-ars6eb` @ `5811f64`.

**Yapmadıklarım:**
- `main`'e birleştirme yapılmadı; canlıda hiçbir değişiklik yok.
- GTM yayınlanmadı.
- Müşteriye e-posta gönderilmedi.
- Hiçbir kayıt silinmedi.
- Hiçbir gizli değer bu raporda yer almıyor.

## Özet

| Konu | Sonuç |
| --- | --- |
| Yeni sürüm ortam değişkenlerinden sonra derlendi | **PASS** |
| Ortam değişkenleri tanınıyor | **PASS** |
| SMTP bağlantısı ve girişi | **PASS** |
| Cron uç noktası ve saatlik çalışma | **PASS** |
| Hatırlatma: tek sefer, 24 saat önce, NL/EN | **PASS** (otomatik test) |
| Turnstile sunucu doğrulaması | **PASS** |
| **Turnstile widget'ı (site key)** | **FAIL, kritik** |
| Giriş, şifre sıfırlama, iletişim ve randevu formları canlıda | **FAIL** (Turnstile nedeniyle) |
| Gerçek e-posta teslimi (randevu, iptal, iletişim) | **BLOCKED** |
| robots.txt ve sitemap | **PASS** |
| Search Console mülkü ve dizine ekleme | **PASS** |
| Sitemap'i Search Console'a göndermek | **BLOCKED** |
| GA4 ve GTM canlıda | **FAIL** (henüz bağlı değil; hazır, onay bekliyor) |
| Çerez onayı ve Consent Mode | **PASS** (yerel), canlıda bant henüz kapalı |
| Mobil görünüm | **PASS** |
| Regresyon testleri | **PASS**: 171/171 |
| Cron gizli anahtarı | Değiştirilmeli (aşağıdaki prosedür) |

## 1. Yayın ve ortam değişkenleri: PASS

**Yayın**
- Hostinger, değişkenler eklendikten sonra `main` @ `81afde3`'ü yeniden derledi (17:53–17:56 UTC).
- Derlemede 0 CMS hatası oldu.
- Uygulama 17:59 ve 18:00'de yeniden başladı.

**Değişken adları**

Aşağıdaki adların hepsi var. Değerler gösterilmedi.

| Grup | Değişkenler |
| --- | --- |
| Cron | `CRON_SECRET` |
| E-posta | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` |
| Turnstile | `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Diğer | `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `DB_MIGRATE_ON_BUILD` |

**Durum sayfası** (`/login/status`, canlı)
- Veritabanı, saat ve oturum anahtarı OK.
- Migrasyonlar 5/5, sahip hesabı OK.
- SMTP: "Verbinding en inloggen bij de mailserver lukken."
- CRON_SECRET ve Turnstile anahtarları "ingesteld". Site adresi eşleşiyor.

**Uyarı**
- `OWNER_SETUP_TOKEN` hâlâ tanımlı. Durum sayfası "Aandacht nodig" diyor.
- Kurulum bittiği için silinmeli (bölüm 8).

## 2. Cron ve hatırlatmalar: PASS

**Cron işi**
- Zamanlama: `0 * * * *` (saatlik).
- Hedef: `https://glowbydilek.nl/api/cron/tick`.
- Son çıktı: `{"ok":true,"sent":0,"failed":0,"skipped":0}`. Gizli anahtar kabul ediliyor; çalışma hatasız.
- Gönderilen 0 e-posta beklenen durum: kuyrukta e-posta yoktu.

**Kodda doğrulanan hatırlatma kuralları**
- Hatırlatma, randevudan **tam 24 saat önce** kuyruğa girer.
- Randevu 12 saatten yakınsa hatırlatma gönderilmez.
- Randevu taşınır veya iptal edilirse eski hatırlatma **gönderilmez**.
- Aynı randevu ve saat için tek kayıt vardır (tekrarlama anahtarı).
- Paralel iki cron çalışması bile tek e-posta gönderir.

**Yeni otomatik test** (`tests/booking.test.ts`)
- Saatlik cron, randevudan 25 saat önce başlayıp 1 saat sonrasına kadar, her saat **iki kez** çalıştırıldı.
- Sonuçlar:
  - NL müşteri tam 1 Hollandaca hatırlatma aldı ("Herinnering: …").
  - EN müşteri tam 1 İngilizce hatırlatma aldı ("Reminder: …").
  - 24 saatten önce hiçbir hatırlatma gitmedi.
  - Türkçe dili seçen müşteri Hollandaca e-posta alır. E-postalar yalnızca NL/EN.

**Düzeltme (dalda)**
- Durum sayfası "cronjob elke 5 minuten" diyordu. Artık "minstens elk uur" diyor; saatlik ayarınız doğru.

## 3. SMTP ve e-postalar

- **PASS, bağlantı:**
  - Canlı sunucu `hello@glowbydilek.nl` ile SMTP'ye bağlanıp giriş yapabiliyor.
  - Hostinger posta kaydında 18:01 UTC'de başarılı giriş var.
- **BLOCKED, gerçek teslim testi:**
  - Şifre sıfırlama, iletişim formu ve randevu talebi canlıda Turnstile hatası yüzünden gönderilemiyor (bölüm 4).
  - Gerçek müşteriye e-posta göndermedim.
- **PASS, yerel:**
  - Randevu onayı, iptal, taşıma, hatırlatma ve iletişim e-postaları yerel posta yakalayıcıyla test edildi.
  - Sonuç: 28/28 ve birim testleri.

## 4. Turnstile

**PASS: sunucu tarafı**
- Token olmadan gönderim → 403 ("missing").
- Sahte token → 403 ("invalid"). Bu, Cloudflare'ın gizli anahtarınızı **kabul ettiğini** gösterir.
- Cloudflare test token'ı canlıda reddediliyor.

**FAIL: tarayıcı widget'ı, kritik**
- Cloudflare canlı sitede **hata 400020 (invalid sitekey)** veriyor.
- Yani `NEXT_PUBLIC_TURNSTILE_SITE_KEY` değeri Cloudflare'da tanımlı bir site key değil. Muhtemelen secret key ile karıştırılmış, eksik kopyalanmış ya da başka bir widget'a ait.
- Sonuç olarak şu an canlıda:
  - **admin ve agenda girişi,**
  - **şifre sıfırlama,**
  - **iletişim formu,**
  - **randevu talebi**
  
  hepsi "Rond de beveiligingscontrole af…" uyarısında kalıyor.
- Cloudflare API ile kontrol edemedim: bağlantıda "Turnstile Sites" izni yok.

## 5. Google: GA4, GTM, Search Console, robots, sitemap

**PASS**
- **robots.txt:** doğru; özel bölümler taranmaya kapalı, sitemap adresi var.
- **Sitemap:**
  - 76 adres, hepsi HTTP 200.
  - Türkçe adres yok (noindex).
  - Gerçek `lastmod` tarihleri var.
- **Search Console:**
  - `sc-domain:glowbydilek.nl` mülkü doğrulanmış (sahip).
  - Ana sayfa "Submitted and indexed".
  - `/tr` Google'da yok, beklendiği gibi.
- **Çerez onayı, yerel testler:**
  - 9/9 senaryo geçti.
  - Onaydan önce 0 Google isteği.
  - Consent Mode v2 sırası doğru.
  - Sayfa başına tam 1 `page_view`.
  - Formlarda kişisel veri gönderilmiyor.

**FAIL: GA4/GTM canlıda bağlı değil**
- Canlı GTM sürümü hâlâ boş (v1).
- Canlı site GA4 yüklemiyor. GA4 Realtime: 0 olay.
- Hazır olanlar:
  - GTM **sürüm 4** (Google tag, `page_view` ve dönüşüm olayları, Consent Mode). Derlendi, **yayınlanmadı**.
  - Dalda GTM varsayılanlı site kodu.
- İkisi onayınızla birlikte yayınlanmalı. Ayrıntılar: `docs/gtm/RAPOR_TR.md`.

**BLOCKED**
- **Sitemap gönderimi:** Search Console bağlayıcısında yazma izni yok.
- **GA4 anahtar olayları:** GA4 bağlayıcısı yalnızca okuyor.

## 6. Canlı site, admin, agenda, mobil

- **PASS, sayfalar:**
  - Kontrol edilen tüm public sayfalar 200.
  - Telefon genişliğinde yatay kayma yok.
  - Onaydan önce Google isteği yok.
- **PASS, admin ve agenda:**
  - Var olmayan bir test e-postasıyla giriş denendi.
  - İçerideki ekranlar canlıda test edilemedi (giriş engelli).
  - Müşteri verisine dokunulmadı.
- **FAIL, giriş:** Giriş, Turnstile site key düzelene kadar mümkün değil (bölüm 4).

## 7. Regresyon ve güvenlik testleri: PASS

| Kapsam | Sonuç |
| --- | --- |
| Birim ve veritabanı testleri (ayrı test veritabanında) | 171/171 |
| TypeScript, lint | temiz |
| Önceki e2e testleri: kurulum ve giriş, randevu/ajanda/e-posta/fatura, saatler ve personel, navigasyon, çerez | 8/8, 28/28, 5/5, 13/13, 9/9 |

Müşteri verisi korunuyor: testler yalnızca yerel test veritabanında çalıştı, canlı veritabanına dokunulmadı.

## 8. Yalnızca sizin yapmanız gerekenler

1. **Turnstile site key'i düzeltin (acil).**
   1. Cloudflare → Turnstile → widget'ınızı açın.
   2. **Hostname** listesinde `glowbydilek.nl` olduğunu kontrol edin.
   3. **Site Key**'i (secret değil) kopyalayın.
   4. hPanel → Node.js → Environment variables → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`'e yapıştırın.
   5. Yeniden derleme (redeploy) başlatın; bu değer derleme sırasında koda gömülüyor. İsterseniz derlemeyi onayınızla ben başlatırım.
   6. Ardından giriş ve formları doğrularım.
2. **Cron gizli anahtarını değiştirin.** Ekran görüntülerinde göründü.
   1. Parola yöneticinizle en az 40 karakterlik yeni, rastgele bir değer üretin.
   2. hPanel → Node.js → Environment variables → **yalnızca** `CRON_SECRET`'i düzenleyip yeni değeri girin.
   3. hPanel → Cron Jobs → mevcut saatlik işi düzenleyin. Komuttaki `Authorization: Bearer …` kısmına **aynı** yeni değeri yazın. Zamanlama `0 * * * *` kalsın.
   4. Uygulamayı yeniden başlatın (Restart). Bu değişken derlemeye gömülmüyor; yeniden derleme gerekmez.
   5. Bana "döndürdüm" yazın. Bir sonraki saatlik çalışmanın `ok:true` döndüğünü ve yanlış bir anahtarın reddedildiğini doğrularım. Yeni değeri bana göndermeyin.
   6. Eski değeri hiçbir yerde tekrar kullanmayın.
3. **`OWNER_SETUP_TOKEN`'ı silin** (hPanel → Environment variables), sonra yeniden başlatın.
4. **Sitemap:** Search Console'da Sitemaps → `https://glowbydilek.nl/sitemap.xml` → Gönder. Ya da bağlayıcıya yazma izni verin: https://mcpsearchconsole.com/connect/write
5. **GTM ve GA4 yayınına onay verin.** Onay verirseniz önce GTM sürüm 4'ü yayınlarım, hemen ardından dalı `main`'e birleştiririm.
6. **GA4'te**, ilk olaylar geldikten sonra, Yönetici → Olaylar'da `booking_submitted` ve `contact_submitted`'ı "anahtar olay" yapın.
7. **İsteğe bağlı:** Cloudflare bağlantısına "Turnstile Sites: Read" izni verin. Böylece site key'i bundan sonra ben de kontrol edebilirim.
