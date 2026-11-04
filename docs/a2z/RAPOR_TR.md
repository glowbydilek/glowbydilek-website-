# Glow by Dilek — A–Z üretim denetimi ve onarım raporu

Tarih: 4 Kasım 2026 · Dal: `claude/happy-feynman-ars6eb` (origin/main 3f456e2 üzerine) · Canlı sürüm: v14, build `01a1a59c`.

**Bu rapor neye dayanıyor?**

- **Canlı sistem:** yalnızca Hostinger API'si üzerinden okuma yapıldı (build, ortam değişkenlerinin adları, cron, güvenlik taraması, e-posta günlükleri). Canlı sitede hiçbir şey değiştirilmedi, yayınlanmadı, silinmedi. Veritabanına, şifrenize ve müşteri kayıtlarına dokunulmadı.
- **Tarayıcı testleri:** yerel kopya üzerinde yapıldı (aynı kod, ayrı ve boş bir test veritabanı `glow_a2z`, yerel e-posta yakalayıcı). Bu oturumun ağ politikası `glowbydilek.nl` adresini engelliyor (curl → `000`). Bu yüzden canlı sitede tarayıcı testi yapılamadı.
- **Gerçek cihaz:** gerçek iPhone/Android testi **yapılmadı**.

Sonuçlar **PASS / FAIL / BLOCKED** olarak verildi.

---

## 1. Çalışanlar

| Alan | Durum | Kanıt |
| --- | --- | --- |
| Canlı build ve otomatik yayın (GitHub `main`) | PASS | `hosting_get-deployment`: build `01a1a59c` tamamlandı, commit 3f456e2, auto-deploy açık |
| Veritabanı bağlantısı ve 5/5 migrasyon | PASS | Build günlüğü: `[db-migrate] database schema is up to date` |
| Sahip hesabı ile giriş (canlı) | PASS (sizin beyanınız + build durumu) | Siz giriş yaptınız; şifre sıfırlanmadı |
| Giriş, oturum, httpOnly `__Host-` çerezi, yanlış şifre, kod tekrar kullanımı | PASS (yerel) | `docs/review/a2z/test-logs/a2z-e2e-setup.txt` (8/8) |
| Ajanda ve admin: çalışma saatleri, randevu oluşturma, çakışma engeli, taşıma/iptal e-postası, online randevu → onay e-postası, müşteri arama/profil/ziyaretler, fatura (PDF + e-posta eki), gelir ve giderler, fiyat/süre yönetimi, fiyat teklifi bağlantısı, CMS/tema/medya, yorum moderasyonu, şifre sıfırlama e-postası, her cihazdan çıkış | PASS (yerel) | `a2z-e2e-private.txt` (28/28); KDV hesapları birim testlerinde |
| Intake formu, şifreli belge yükleme/görüntüleme, A4 baskı/PDF | PASS (yerel) | `a2z-e2e-intake.txt` (9/9) |
| Menü, mega menü, mobil menü, dil değişimi (NL/EN/TR), tüm header/footer bağlantıları, önseçili randevu bağlantıları, Turnstile reddi | PASS (yerel) | `a2z-e2e-nav2.txt` (13/13) |
| Birim testleri (randevu motoru, KDV, yetki, e-posta kuyruğu vb.) | PASS | 114/114 |
| TypeScript, ESLint, üretim build'i | PASS | `tsc`, `eslint .` temiz; `next build` başarılı |
| Mobil / tablet / masaüstü yatay taşma (ana sayfa, tüm bakımlar, randevu, TR, giriş) | PASS (yerel) | 15 ekranda yatay taşma 0 px |

## 2. Bozuk olanlar

1. **Build sırasında CMS içeriği yüklenemiyordu (FAIL → düzeltildi).** Hostinger build'i 63 paralel işçi açıyor ve her işçi 5'e kadar veritabanı bağlantısı kuruyordu. Bu, paylaşımlı MySQL'in kullanıcı başına bağlantı sınırını aşıyordu. Canlı build günlüğünde 40'tan fazla `[cms] content could not be loaded` satırı var. Sonuç: her yayından sonra ilk 5 dakika boyunca sayfalar, admin panelindeki metinler yerine yerleşik metinleri gösterebiliyordu.
2. **E-posta hiç gönderilmiyor (BLOCKED).** Hostinger'da `SMTP_*`, `MAIL_TO` ve `CRON_SECRET` yok. Posta sunucusunun SMTP erişim günlüğünde hiç oturum yok (0 kayıt). Yani onay, iptal, şifre sıfırlama ve 24 saat hatırlatma e-postaları şu an canlıda çıkmıyor.
3. **Cron görevi yok (BLOCKED).** `hosting_cron-jobs_list` boş döndü. Hatırlatmalar ve e-posta kuyruğu çalışmıyor.
4. **Herkese açık formlar kapalı (BLOCKED).** Turnstile anahtarları olmadığı için iletişim ve randevu formu “tijdelijk niet beschikbaar” gösteriyor. Bu bir güvenlik kararı; kontrol kapatılmadı.
5. **Intake belge yükleme canlıda kapalı (BLOCKED).** `INTAKE_DOCUMENT_KEY` yok. Uygulama yüklemeyi güvenli şekilde reddediyor ve nedenini gösteriyor.
6. **`OWNER_SETUP_TOKEN` hâlâ tanımlı.** İlk kurulum tamamlandığı için artık etkisiz, ama kaldırılmalı.

## 3. Düzeltilenler (bu dalda, henüz canlıda değil)

| Dosya | Değişiklik |
| --- | --- |
| `src/lib/db/client.ts` | `next build` sırasında (`NEXT_PHASE=phase-production-build`) işçi başına 1 bağlantı; çalışma zamanında değişiklik yok (5). Hata günlükleri artık sürücü kodunu da yazıyor; şifre veya bağlantı adresi yazılmıyor. |
| `next.config.mjs` | `experimental.cpus` build işçilerini 4 ile sınırlıyor (`BUILD_WORKERS` ile değiştirilebilir). Yalnızca build'i etkiler. |
| `src/lib/cms/store.ts` | Aynı, daha açıklayıcı hata günlüğü. |
| `.env.example` | `BUILD_WORKERS` açıklaması. |

**Kanıt:** Bağlantı sınırı 6 olan bir test kullanıcısıyla build alındı. Düzeltmeden önce 326 CMS hatası, sonra 0 (`test-logs/build-cms-errors-before-after.txt`).

Tasarım, metin, fiyat, hizmet ve veritabanı yapısı değişmedi. Yeni migrasyon yok.

## 4. Test sonuçları

| Test | Sonuç |
| --- | --- |
| Birim testleri | PASS 114/114 |
| TypeScript / ESLint / build | PASS |
| E2E ilk kurulum + giriş + oturum | PASS 8/8 |
| E2E ajanda / müşteri / fatura / PDF / şifre sıfırlama / e-posta (yerel posta yakalayıcı) | PASS 28/28 |
| E2E intake + şifreli belgeler | PASS 9/9 |
| E2E navigasyon ve dil | PASS 13/13 (ilk çalıştırmada dil menüsü testi zamanlama yüzünden 1 kez FAIL; tekrarında geçti, kod değişikliğiyle ilgisi yok: `a2z-e2e-nav-run1-flaky.txt`) |
| Her bakım için ayrı randevu akışı (wax, 5 masaj, buharlı yüz bakımı) | Kısmi: online randevu akışı ve önseçili randevu bağlantıları test edildi; her bakım tek tek uçtan uca gönderilmedi |
| Canlı sitede tarayıcı testi | BLOCKED (oturum ağı alan adını engelliyor) |
| Gerçek iPhone / Android / Safari / Firefox / Edge | BLOCKED (yapılmadı) |
| Canlı e-posta teslimi | BLOCKED (SMTP ayarı yok) |
| Erişilebilirlik (axe) | v14'te yapıldı (`docs/review/v14/test-logs/v14-axe.txt`); bu düzeltme arayüzü değiştirmiyor, tekrar çalıştırılmadı |

**Test kayıtları:** testler ayrı `glow_a2z` veritabanında, “e2e/test” işaretli sahte müşterilerle çalıştı; canlı veriye hiç dokunmadı. Bu veritabanı yalnızca bu konteynerde var ve oturum bitince silinir.

## 5. Kalan sorunlar ve engeller (sizin yapmanız gerekenler)

Hostinger API'si ortam değişkenlerini yalnızca **tamamen değiştirerek** yazabiliyor ve mevcut değerleri gizli gösteriyor. Ben yazarsam `DATABASE_URL` ve `AUTH_SECRET` silinir. Bu yüzden aşağıdakileri **hPanel'de tek tek eklemeniz** gerekiyor. Sırları sohbete yapıştırmayın.

**hPanel → Websites → glowbydilek.nl → Node.js → Environment variables**

1. Ekleyin (sır değil):
   - `SMTP_HOST=smtp.hostinger.com`
   - `SMTP_PORT=465`
   - `SMTP_SECURE=true`
   - `SMTP_USER=hello@glowbydilek.nl`
   - `MAIL_TO=hello@glowbydilek.nl`
2. Ekleyin (sır): `SMTP_PASS` = hello@glowbydilek.nl posta kutusunun şifresi. **Bağlayıcı üzerinden erişemediğim tek ayar budur.**
3. Ekleyin (sır): `CRON_SECRET` = en az 40 rastgele karakter. Bir şifre yöneticisinde üretin.
4. Ekleyin (sır): `INTAKE_DOCUMENT_KEY` = 32 bayt base64 (`openssl rand -base64 32`). Bunu yalnızca intake belgeleri kullanılacaksa ekleyin. **Kaybederseniz şifreli belgeler açılamaz**, bu yüzden yedeğini saklayın.
5. Silin: `OWNER_SETUP_TOKEN`.
6. Kaydettikten sonra bana “kaydettim” deyin. Yeni build'i ben başlatırım ve e-posta teslimini Hostinger Mail'de doğrularım.

**Cron (hPanel → Advanced → Cron Jobs):**

- Zamanlama: her 10 dakikada bir (`*/10 * * * *`).
- Komut (`CRON_SECRET_VALUE` yerine 3. adımdaki değeri yazın):

```bash
curl -fsS -m 120 -H "Authorization: Bearer CRON_SECRET_VALUE" https://glowbydilek.nl/api/cron/tick
```

**Turnstile:** Cloudflare bağlantısında “Turnstile Sites: Edit” izni yok (HTTP 403). Cloudflare bağlayıcısını bu izinle yeniden bağlarsanız widget'ı ben oluştururum. Anahtarlar sonra yine hPanel'e eklenmeli: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

**Canlı test:** Claude Code ortam ayarlarında **Allowed domains** listesine `glowbydilek.nl` eklenirse canlı siteyi tarayıcıyla test edebilirim.

**Diğer kalan maddeler:**

- Sunucu günlüğündeki `failed to get redirect response TypeError: fetch failed` uyarısı zararsız. Next.js form yönlendirmesinden sonra sunucu kendi alan adına önceden istek atmayı deniyor; tarayıcı yönlendirmeyi yine izliyor. Kodda düzeltme gerekmiyor.
- 200% metin boyutunda bazı sayfalar 20–40 px yana kaydırılabiliyor. v14'ten kalan, kısmi bir sorun.
- Logo için sahibinin onayı hâlâ bekleniyor.

## 6. Güvenlik bulguları

| Konu | Bulgu |
| --- | --- |
| Gizli bilgiler | Hiçbir sır bu rapora, commit'e veya günlüğe yazılmadı. Commit edilen test kayıtları sır taramasından geçti. |
| `AUTH_SECRET`, `DATABASE_URL` | Tanımlı (değerler maskeli). DB host'u `127.0.0.1`. |
| `OWNER_SETUP_TOKEN` | Tanımlı, artık etkisiz (şifre var; tekrar kullanım test edildi ve şifreyi değiştirmiyor). **Silinmeli.** |
| Korumalı sayfalar | `/admin`, `/agenda`, `/login`, `/offerte` sayfaları giriş istiyor ve `noindex` + `no-store` dönüyor. E2E testi bunu doğruluyor. |
| Çerezler | `__Host-glow_session`, httpOnly, Secure, SameSite=Lax |
| 2FA | Ajanda ve admin'de mevcut. **Öneri:** Agenda → Instellingen'de hemen açın. |
| Sağlık verisi | Intake belgeleri AES-256-GCM ile, anahtar ayrı. Anahtar yoksa yükleme reddediliyor. |
| Hostinger güvenlik taraması | 5 kayıt: `esbuild` ve `minimatch`. İkisi de yalnızca geliştirme/build araçlarında, çalışan siteye dahil değil. `esbuild` uyarısı GitHub tarafından geri çekilmiş. Çalışma zamanı bağımlılık denetimi (`npm audit --omit=dev`) v14'te 0 açık. |
| Yedekler | Hostinger API'sinde web hosting yedeklerini listeleyen bir işlem yok; doğrulanamadı (BLOCKED). hPanel → Files → Backups bölümünde son günlük yedeğe bakın. Uygulamanın kendi yedeği: `/admin/systeem/backup`. |

## 7. Ekran görüntüleri

`docs/review/a2z/` klasöründe: `mobiel-*`, `tablet-*`, `desktop-*` × ana sayfa, tüm bakımlar, randevu, Türkçe ana sayfa, giriş. Yerel build'den alındı; canlı siteden değil.

## 8. Veritabanı ve e-posta doğrulaması

- **Veritabanı (canlı):** bağlı, migrasyonlar güncel, boyut yaklaşık 5 MB. Yeniden oluşturulmadı, değiştirilmedi.
- **Veritabanı (yerel):** okuma/yazma, çakışma koruması ve migrasyon tam test edildi (PASS).
- **E-posta (canlı):** BLOCKED. SMTP değişkenleri yok ve posta sunucusunda SMTP oturumu yok (`mail_logs_list-access`, 0 kayıt).
- **E-posta (yerel):** şifre sıfırlama, randevu onay/taşıma/iptal ve fatura e-postaları yerel yakalayıcıya ulaştı ve testte bağlantılar takip edildi (PASS).

## 9. Üretime hazırlık kontrol listesi

| Madde | Durum |
| --- | --- |
| Build + otomatik yayın | PASS |
| DB + migrasyonlar | PASS |
| Sahip girişi | PASS |
| Build sırasında CMS içeriği | FAIL canlıda; bu dalda düzeltildi, yayın sizin onayınızı bekliyor |
| SMTP + e-posta teslimi | BLOCKED (siz: `SMTP_*` + `SMTP_PASS`) |
| Cron + 24 saat hatırlatma | BLOCKED (siz: `CRON_SECRET` + cron görevi) |
| Turnstile, yani açık formlar | BLOCKED (Cloudflare izni + anahtarlar) |
| Intake belge yükleme | BLOCKED (siz: `INTAKE_DOCUMENT_KEY`) |
| `OWNER_SETUP_TOKEN` kaldırma | BLOCKED (siz: hPanel'de silin) |
| 2FA açık | Kontrol edilmedi; siz açın |
| Yedek doğrulaması | BLOCKED |
| Canlı tarayıcı testi | BLOCKED (Allowed domains) |
| Gerçek cihaz testi | BLOCKED |

**Proje tamamlandı olarak işaretlenmedi.** E-posta, cron ve formlar canlıda bağımsız olarak doğrulanana kadar kritik özellikler açık kalıyor.
