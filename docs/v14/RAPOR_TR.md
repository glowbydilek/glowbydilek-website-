# Glow by Dilek — v14 son uygulama ve QA raporu (Türkçe)

Tarih: 4 Kasım 2026 · Dal: `claude/happy-feynman-ars6eb` (v13 = `4e95108`, v14 = bu dalın son commit'i) · Üretim: **değiştirilmedi, dağıtım yapılmadı.**

## 1. Kısa özet

Mevcut v13 teması, düzeni ve renk uyumu korundu; sıfırdan yeniden yapılmadı. Yapılanlar:

- **Mobil hero:**
  - Ekranı kaplayan anonim yüz portresi kaldırıldı. Yerine hizmete dayalı, aydınlık, örtülü bir omuz masajı fotoğrafı geldi.
  - Telefonda fotoğraf başlık ve iki butonun **altında**, kompakt 3:2 bir karede duruyor. Tablet ve masaüstünde kemerli 4:5 portre korunuyor.
  - "Randevu talep et" butonu 320×568'den itibaren ilk ekranda görünüyor (v13'te 656 px'teydi, ekranın dışında). Hizmet bölümü yaklaşık 330 px daha erken başlıyor.
  - Mühür (seal) telefonda gizli; metni ve butonları kapatmıyor.
- **Fotoğraflar:**
  - 29 slotun tamamı tek tek denetlendi.
  - Tüm vücut masajı daha aydınlık ve örtülü bir kareyle değişti.
  - Yüz ağdası kartı siyah eldivensiz, yumuşak bir kaş görseliyle değişti.
  - Hollywood sayfası ilgisiz vazo yerine ağda kabı fotoğrafını kullanıyor.
  - Yüz bakımları kategori kartı buhar fotoğrafını kullanıyor.
  - Lisanslar ve denetim tablosu `docs/PHOTOGRAPHY.md` içinde.
- **Tipografi:**
  - "hele-maal" bölünmesi düzeltildi: başlıklarda otomatik heceleme kapalı. Yalnızca 360 px altında 12+ harfli kelimeler bölünebilir.
  - Normal boyutta gövde metninde hiç heceleme yok.
  - Uzun bileşik kelimeler (Gezichtsbehandelingen, Ontspanningsmassage) telefonda sığacak şekilde boyutlandırıldı.
  - %200 metin boyutunda butonlar ve sütunlar artık taşmıyor.
- **Masaj metinleri (NL/EN/TR):**
  - Kişisel konfor bilgisi eklendi: sohbet ya da sessizlik, üşüyünce ek örtü.
  - Dürüst beklenti eklendi: sakin bir an, sonuç vaadi yok.
  - İç not gibi okunan SSS yanıtları müşteri diline çevrildi.
- **Temizlik:**
  - Önce kullanım grafiği çıkarıldı, sonra yalnızca kanıtlı kullanılmayan dosyalar kaldırıldı: 21 dosya, −606 KB.
  - README ve sahip kontrol listesi v14'e güncellendi.
- **Testler:**
  - Temiz kurulum (`npm ci`), lint, typecheck ve build geçti; `npm audit` 0 açık.
  - Birim/entegrasyon: 164/164.
  - E2E: navigasyon 13/13, yönetim alanı 28/28, intake+MFA 9/9, ilk şifre 8/8.
  - axe: 114 sayfa × 2 genişlik, ihlal yok.
  - 456 sayfa yüklemesinde (320–1920 px) taşma yok.
  - Migration'lar temiz kurulumda geçti.

**Canlı giriş hâlâ çalışmıyor; bu bir kod hatası değil.** Hostinger'da veritabanı ve gizli anahtarlar tanımlı değil. Canlı giriş yalnızca senin hPanel adımlarından ve onayından sonra doğrulanabilir (bkz. §6).

## 2. Değişiklik listesi (v13 → v14)

| Commit | İçerik |
| --- | --- |
| `f31d1b4` | Hero: hizmete dayalı fotoğraf, telefon düzeni, genişliğe göre başlık boyutları, yatay telefon; portre ayrı `portrait` slotuna taşındı; massage-body ve zone-face değişti; başlıklarda `hyphens: manual` |
| `1576d97` | Fotoğraf denetimi: Hollywood → `materials`, Yüz bakımları kartı → `facial-steam`, PHOTOGRAPHY.md denetim tablosu ve lisanslar |
| `7987475` | %200 metin: butonlar kaydırılabilir, grid sütunları küçülebilir, sabit boyutlu header, FAQ/footer/zone etiketleri |
| `e5d7c1d` | Masaj sayfaları: konfor ve beklenti cümleleri (3 dil), müşteri dilinde SSS |
| `a63c3ef` | Temizlik + README + OWNER-CHECKLIST |
| `44b5f05` | Gövde metninde heceleme yok, detay sayfası başlıkları, Agenda "Intake" sekmesi, önce/sonra kanıtları |
| (son) | Bu rapor, kanıt logları |

Veritabanı şeması değişmedi; yeni migration yok (0000–0004 aynı). Hizmet kimlikleri, URL'ler, açıklamalar ve randevular korundu.

## 3. Silinen dosyalar ve boyut

Silmeden önce kurtarma kopyası alındı: `git bundle` (scratchpad) ve yerel etiket `backup/pre-v14-cleanup`. Git geçmişi de tam.

| Dosya | Neden |
| --- | --- |
| `src/components/private/cms/TreatmentForm.tsx` | Hiçbir yerden import edilmiyor (CatalogueForms ile değiştirilmiş, TR alanları da yoktu) |
| `docs/review/*.jpg` (20 dosya, v12 dönemi) | Hiçbir belgede referans yok; `docs/review/v13` korundu |
| `extra.nl.ts` / `extra.en.ts` içindeki massage-relaxation ile facial/massage bölüm metinleri | `wellness.ts` önce okunduğu için erişilemez; CMS kayıt listesi bunları kullanmıyor |

Takip edilen dosyalar: önce 662 dosya / 13,71 MB, sonra 641 dosya / 13,09 MB. `public/` içindeki her dosyanın kullanıldığı doğrulandı.

**Bilerek korunanlar:**
- Lisans kayıtları.
- Görsel orijinalleri (`assets/photos/`, git'e alınmaz).
- `massage` slotu (artık kullanılmıyor ama CMS'te seçilebilir; silinmesi senin onayına bağlı).
- Müşteri verisi, randevular, belgeler, faturalar, yedekler. Hiçbirine dokunulmadı.

## 4. Kabul kontrol listesi (CLAUDE_ACCEPTANCE_CHECKLIST)

**Test ortamı:** bulut konteyner, Node 22.23, MariaDB 10.11 yerel test/dev DB, `next build --webpack` + `next start`, yerel SMTP alıcısı, Turnstile sahte doğrulayıcısı, Chromium (Playwright). Gerçek cihaz veya canlı ortam yok.

| Alan | Durum | Kanıt / not |
| --- | --- | --- |
| Temel durum ve veri | PASS | Dosya envanteri §3. Şema değişmedi. Bundle + etiket yedek. ID ve rotalar korundu (E2E). |
| Hero | PASS (emülasyon) | 320/360/375/390/414/430, yatay 844, tablet 768/1024 ve masaüstü 1440 için önce/sonra (ilk ekran ve bir kaydırma): `docs/review/v14/hero/`. Ölçümler: `metrics-v13.txt` / `metrics-v14.txt`. Not: yatay telefonda (844×390) butonlar ilk ekranın hemen altında. |
| Görsel QA | PASS | 29 slot × 4 boyut incelendi; tablo, lisans, ALT metin (3 dil): `docs/PHOTOGRAPHY.md`. Sahte kişi ya da stüdyo iddiası yok. |
| Tipografi | PASS / KISMEN | Kelime bölünmesi dedektörü 360–430 px'te gövde metninde 0 bölünme buldu (`docs/review/v14/test-logs/wordbreak-3.txt`). Kalan 3 durum: dar fiyat sütunu ve bir `dd` etiketi. %200 metin boyutunda içerik ekranda kalıyor, ancak 55 sayfa 20–40 px yana kaydırılabiliyor (görünmeyen bir dekoratif öğe; `docs/review/v14/test-logs/zoom200.txt`). Tarayıcı yakınlaştırması (reflow) 320 px'te sorunsuz. |
| Görsel tutarlılık | PASS | Palet korundu. Gün, saat, sekme parıltıları ve onay kıvılcımı v13'teki gibi; reduced-motion'da kapanıyor. |
| Tam navigasyon | PASS | E2E navigasyon 13/13: mega menü, mobil akordeon, dil menüsü NL→EN→TR, footer, tüm bağlantılar. |
| Envanter | PASS | 13 ağda + 5 masaj + 1 buharlı yüz bakımı yayında; 10 taslak taslak kaldı (`docs/v13/HIZMET_ENVANTERI.md`). |
| Randevu | PASS (test ortamı) | Talep ve saat seçimi akışları, ön seçim (3 dil), çift randevu engeli, DST testleri, bekleyen/onaylı ayrımı, iptal/erteleme e-postaları (`docs/review/v14/test-logs/v14-e2e-private.txt`). |
| Sahip girişi | PASS (test ortamı) / BLOCKED (canlı) | İlk şifre, gerçek giriş, `__Host-` oturum çerezi, sıfırlama e-postası, çıkış, MFA (`docs/review/v14/test-logs/v14-e2e-setup.txt`, `-private`, `-intake`). Canlı: veritabanı ve ortam değişkenleri yok. |
| CRM ve finans | PASS (test ortamı) | Müşteri arama, genel avatarlar, geçmiş, fiyat düzenleme, KDV, fatura PDF ve e-posta, raporlar, gider CSV (E2E). |
| Intake | PASS (test ortamı) | v2 master form 3 dilde, A4/PDF, revizyon, şifreli yükleme, EXIF silme, erişim kontrolü, silme kaydı (`docs/review/v14/test-logs/v14-e2e-intake.txt`). |
| E-posta teslimi | PASS (yerel SMTP) / BLOCKED (gerçek posta kutusu) | Gerçek SMTP şifresi ve DNS (SPF/DKIM) erişimi yok. |
| Güvenlik ve gizlilik | PASS | Turnstile, oran sınırları, CSRF (server actions), gizli bilgi göstermeyen durum sayfası, belge erişim logu, `npm audit` 0. Logda gizli bilgi taraması temiz. |
| Erişilebilirlik | PASS | axe WCAG 2.2 AA: 0 ihlal (`docs/review/v14/test-logs/v14-axe.txt`); Lighthouse erişilebilirlik 100. |
| SEO ve içerik | PASS | Sitemap 3 dilde, hreflang/canonical, uydurma fiyat veya iddia yok. Lighthouse SEO 100. |
| Responsive QA | PASS (emülasyon) / BLOCKED (gerçek cihaz) | 320–1920 px, 456 yüklemede taşma 0 (`docs/review/v14/test-logs/widths-v14.txt`). Gerçek iPhone Safari, Android Chrome, Firefox/Edge/Safari matrisi için cihaz veya cihaz çiftliği erişimi yok. |
| Temizlik | PASS | Kullanım grafiği → yalnızca kanıtlı kullanılmayanlar → önce/sonra boyut (§3). |
| Teslim | PASS / BLOCKED (staging URL) | Commit + ZIP, kurulum, migration/geri alma, ekran görüntüleri, loglar. Staging URL için Hostinger erişimi gerekiyor. |

**Lighthouse (mobil, yerel):**
- `/`: Perf 90 (tekrarlanan ölçüm; ilk ölçüm 81), A11y 100, BP 100, SEO 100, CLS 0, LCP 3,2 s.
- `/massages`: 91/100/100/100.
- `/tr/masajlar`: 87/100/100/100.
- `/afspraak-maken`: 85/100/96/100. BP 96, çünkü Turnstile bu ortamda yüklenemiyor.

## 5. Kurulum, staging, migration ve geri alma

```bash
npm ci && npm run lint && npm run typecheck && npm run build
```
```bash
TEST_DATABASE_URL=mysql://USER:PASS@127.0.0.1:3306/glow_test npm test
```
```bash
DATABASE_URL=mysql://USER:PASS@127.0.0.1:3306/BOS_DB node scripts/db-migrate.mjs
```

- **Staging:** ayrı bir veritabanı ve test anahtarları kullanılmalı; üretim `DATABASE_URL`'i asla staging'e verilmemeli. Ortam değişkenleri adlarıyla `.env.example` ve `docs/DEPLOYMENT.md` §2'de.
- **Migration:** v14 yeni migration getirmiyor. 0004 yalnızca ekleme yapıyor.
- **Geri alma:** Hostinger'da bir önceki commit'i yeniden dağıtın. Veritabanı geri alması gerekmez. Ayrıntılar: `docs/DEPLOYMENT.md` §5–6.
- **Yerel test komutları:** `README.md` → Development (e2e-navigation, e2e-private, e2e-intake, e2e-setup).

## 6. Engeller — elde edilemeyen kanıtlar ve gereken asgari erişim

| Eksik kanıt | Gereken asgari erişim |
| --- | --- |
| Canlı sahip girişi, admin/agenda | Senin hPanel'de MySQL veritabanı ve ortam değişkenleri oluşturman (değerleri sohbete yazmadan), ardından dağıtım onayı. Adımlar: `docs/DEPLOYMENT.md` §2e |
| Gerçek posta kutusuna sıfırlama, onay, hatırlatma ve iptal e-postaları | SMTP posta kutusu şifresi (yalnızca hPanel'e) ve alan adı DNS'inin SPF/DKIM kontrolü |
| Cron ve 24 saat hatırlatma, canlı yedek/geri yükleme provası | hPanel cron işi ve veritabanı |
| Gerçek iPhone Safari, Android Chrome, Firefox/Edge/Safari | Kendi cihazların ya da BrowserStack benzeri bir cihaz çiftliği (ücretli; onayın olmadan kullanılmadı) |
| Staging URL | Hostinger önizleme sitesi ve test veritabanı |

## 7. Sahip işlemleri (kısa liste)

1. hPanel → MySQL veritabanı oluştur → Node.js ortam değişkenlerini gir → dağıtımı onayla → `/login/status` → ilk şifre → iki adımlı doğrulama → `OWNER_SETUP_TOKEN`'ı sil.
2. Diplomanın tam adını onayla.
3. Masajların ve buharlı yüz bakımının fiyat ve sürelerini belirle; hangilerinin online saat seçimine açılacağını söyle.
4. 10 taslaktan hangilerini gerçekten sunduğunu söyle.
5. Yeni açılış fotoğrafını ve yeni masaj/kaş görsellerini onayla, ya da kendi stüdyo fotoğraflarını gönder. Alternatifler: `docs/PHOTOGRAPHY.md`.
6. Logo: A, B (önerim) ya da C (`docs/review/v13/logo-candidates.png`). Canlı logo değişmedi; **onay alınmış sayılmadı.**
7. Türkçe metinleri ana dili Türkçe olan biri okusun.
8. Dağıtımdan sonra kendi iPhone ve Android telefonunda dene.

Onayın olmadan şunlar yapılmayacak: üretim dağıtımı (`main`'e merge), canlı veritabanında silme veya değişiklik, ücretli görsel/araç, yeni hizmet yayınlama, DNS.
