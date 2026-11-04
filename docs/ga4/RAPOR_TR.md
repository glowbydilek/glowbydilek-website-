# Glow by Dilek — Google Analytics / GTM bağlantı raporu

Tarih: 4 Kasım 2026 · Hazır dal: `claude/happy-feynman-ars6eb` · Canlı sürüm: `main` @ `81afde3`.

**Sizin onayınız olmadan yayın yapılmadı.**

## 1. Mevcut durum (gerçek verilerle kontrol edildi)

| Kontrol | Sonuç |
| --- | --- |
| Canlı sürüm | `main` @ `81afde3`. PR #15'i GitHub'da siz birleştirdiniz; Master V2 kodu canlıda. Hostinger build'i 11:51–11:53 UTC'de tamamlandı. |
| Canlı build | 4 build işçisi, 0 CMS hatası. Önceki build düzeltmesi canlıda çalışıyor. |
| GA4 verisi | Windsor.ai üzerinden GA4 mülkü "Glow by Dilek" (562355887): son 30 günde **0 olay**. GA4 gerçekten bağlı değil. |
| Neden | V2'de GA4, ancak Admin → Analytics & cookies'te istatistik açılınca yükleniyordu. Kapalıyken çerez bandı da çıkmıyordu, Google betiği de yüklenmiyordu. |
| Canlı siteyi tarayıcıyla görme | **ENGELLİ.** Bu oturumun ağ politikası `glowbydilek.nl` ve `googletagmanager.com` adreslerini reddediyor (`connect_rejected`). |

## 2. Kurulan (bu dalda, yayında değil)

- **Varsayılan ayar:** Admin'de bir ayar kaydedilmemişse GA4 artık **açık**.
  - Mod: **GA4 doğrudan**, ID `G-77V0DM6Y7B`.
  - Admin'de kaydedilmiş bir ayar her zaman önceliklidir ("kapalı" dahil).
- **Kod değişikliği:** `src/lib/cms/menu.ts` (`DEFAULT_ANALYTICS`, `liveAnalytics`), `src/components/SiteShell.tsx`. Yeni birim testi eklendi.
- **GTM (`GTM-W9VRJF9X`):** ID admin'de hazır, ama **bilinçli olarak yüklenmiyor**.
  - Konteynerin içinde GA4 etiketi olup olmadığını göremiyorum (aşağıda, ENGELLİ).
  - GTM'i GA4'ün yanında yüklemek çift sayıma yol açabilirdi.
  - Konteyner hazır olduğunda Admin → Analytics'te "Via Google Tag Manager" seçilir; o zaman yalnızca GTM yüklenir.
- **GDPR uyumu (V2'den, değişmedi):**
  - Onaydan önce hiçbir Google isteği yok.
  - "Alles accepteren / Alles weigeren / Voorkeuren instellen" düğmeleri eşit ağırlıkta.
  - Consent Mode v2: önce `default=denied`, sonra seçime göre `update`; reklam izinleri her zaman `denied`.
  - Google Signals ve reklam kişiselleştirmesi kapalı.
  - Özel sayfalar ve teklif bağlantıları ölçülmüyor.

## 3. Test edilenler (yerel production build, kayıtlı analytics ayarı **olmayan** test veritabanı; canlıyla aynı durum)

| Test | Sonuç |
| --- | --- |
| Sayfa HTML'inde Google betiği (onaydan önce) | 0. ID yalnızca yapılandırmada var. |
| Çerez / Consent Mode senaryoları | 9/9 (`docs/review/ga4/consent.txt`): ilk ziyaret, reddet, kabul, geri çekme, tercihler, EN, gizli mod, telefon, özel sayfa. |
| **Çift sayım testi** | **Geçti.** 5 sayfa (sayfa yenilemeden gezinme): toplam **1** Google yükleyici (`gtag/js?id=G-77V0DM6Y7B`), **0** GTM, **1** `gtag config` (`send_page_view=false`, Signals kapalı), sayfa başına tam 1 `page_view`, sayfada 1 Google `<script>`. Kayıt: `docs/review/ga4/duplicate-tracking.txt`. |
| Kritik randevu ve güvenlik kontrolleri (temiz test veritabanı) | Kurulum/giriş 8/8, ajanda/randevu/e-posta/fatura 28/28, saatler/kapanış/personel 5/5, intake 9/9, navigasyon 13/13, birim testleri 120/120, TypeScript, lint ve build temiz. Kayıtlar `docs/review/ga4/`. |

**Not:** İlk çalıştırmada setup/private/roles testleri düştü. Nedeni kodda değil, konteyner yeniden başladığı için yerel posta yakalayıcının ve Turnstile taklidinin durmasıydı. İkisi yeniden başlatıldı ve temiz bir veritabanında tüm testler geçti.

## 4. Hâlâ ENGELLİ olanlar ve tam olarak gereken izinler

| Konu | Gereken |
| --- | --- |
| GTM konteynerini incelemek, GA4 etiketini kurmak, Preview / Tag Assistant, yayınlamak | Google Tag Manager API erişimi: `tagmanager.readonly`, `tagmanager.edit.containers`, `tagmanager.edit.containerversions`, `tagmanager.publish`. Bu oturumda bunu sağlayan bir bağlayıcı **yok** (claude.ai bağlayıcı dizininde ve Windsor.ai'de GTM yazma yok). |
| GA4 yönetimi: anahtar olaylar (`booking_submitted`, `contact_submitted`), veri saklama, Signals kapalı, DebugView | GA4 Admin API, `analytics.edit` yetkisi. Windsor.ai GA4 bağlantısı yalnızca rapor okuyor; yazma eylemi yok. |
| `G-77V0DM6Y7B`'nin 562355887 mülkünün web akışı olduğunu doğrulamak | Mülkte henüz veri yok. Yayından sonraki ilk olaylarla Windsor üzerinden doğrulanabilir (`stream_id`, `hostname`). |
| Search Console (site haritası gönderimi, dizin durumu) | Yazma yetkisi (`webmasters`) olan bir bağlayıcı yok. Windsor `searchconsole` yalnızca okuma; bağlantı denemesi Windsor sunucu hatası (Bad Gateway) verdi. |
| Canlı siteyi test etmek | Claude Code ortamında izin verilen alan adlarına `glowbydilek.nl` (isteğe bağlı olarak `www.googletagmanager.com`) eklenmesi. |

## 5. Yayın ve sonrası (onayınızla)

1. **Yayın:** Bu dalı `main`'e birleştirmem için onay verin. Hostinger otomatik derler.
2. **Admin kontrolü:** Admin → Analytics & cookies'te "Statistieken aanzetten" **kapalı** kaydedildiyse açın. Hiç kaydedilmediyse varsayılan açık ayar geçerli olur.
3. **İlk veri:** Telefonunuzda siteyi açın, "Alles accepteren"e basın, 2–3 sayfa gezin. GA4 → Realtime'da görünmeli. 24–48 saat sonra Windsor üzerinden hostname, stream ve olayları ben doğrularım.
4. **GA4'te sizin yapmanız gerekenler** (Admin API erişimi yok):
   - `booking_submitted` ve `contact_submitted` olaylarını anahtar olay yapın.
   - Veri saklama sürelerini ayarlayın.
   - Google Signals'ı kapalı tutun.
5. **GTM'e geçiş:** Kapsamlı kurulum talimatı `docs/x/RAPOR_TR.md` bölüm 9'da. Konteyner yayınlanmadan GTM moduna geçmeyin.
