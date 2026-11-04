# Glow by Dilek — Hostinger bağımlılık güvenlik uyarıları

Tarih: 4 Kasım 2026 · Dal: `claude/happy-feynman-ars6eb` · Canlı sürüm: `main` @ `81afde3` (değişmedi).

**Yayın yapılmadı.** Canlı siteye ve canlı veritabanına dokunulmadı. Hostinger'ın otomatik düzeltme (patch) PR'ı da açılmadı.

## Kaynaklar

- **Hostinger:** `hosting_nodejs_list-vulnerabilities` (glowbydilek.nl) ile 5 uyarı alındı.
- **GitHub Advisory Database:** iki şekilde kontrol edildi.
  - Danışma (advisory) sayfası.
  - npm registry'nin güvenlik akışı. Bu akış GitHub Advisory Database'den beslenir ve geri çekilmiş danışmaları içermez.
- **Proje bağımlılıkları:** `npm ls` ve `npm explain`.
- **Production build:** Next.js'in sunucu için izlediği dosyalar (`.next/**/*.nft.json`).

## Önemli bulgu: 5 uyarının hiçbiri canlı sitede çalışan kodda değil

| Kontrol | Sonuç |
| --- | --- |
| `npm ls --omit=dev esbuild minimatch` | **boş**. Production bağımlılıklarında bu paketler yok. |
| Production build'in izlediği 157 dosya | esbuild, minimatch, drizzle-kit ve eslint **hiç geçmiyor** |

**Hangi araçlardan geliyor**
- **esbuild:** yalnızca `drizzle-kit`'ten. Bu, geliştiricinin bilgisayarında şema dosyası üreten araç (`npm run db:generate`).
- **minimatch:** yalnızca `eslint` / `eslint-config-next`'ten (kod denetimi).

**Neden canlıyla ilgisi yok**
- Canlıda veritabanı migrasyonları kendi betiğimizle (`scripts/db-migrate.mjs`, drizzle-orm) yapılıyor; drizzle-kit kullanılmıyor.
- Hostinger bu araçları derleme sırasında kurar, ama derleme bunları çalıştırmaz.
- Ziyaretçi bu araçlara hiçbir yoldan ulaşamaz.

## Uyarı uyarı sonuç

| # | Hostinger uyarısı | Paket ve kurulu sürüm | GitHub Advisory DB | Ortam | Karar |
| --- | --- | --- | --- | --- | --- |
| 1 | **High** GHSA-gv7w-rqvm-qjhr: esbuild Deno modülü | esbuild **0.18.20** (drizzle-kit → @esbuild-kit/core-utils) | **Geri çekildi** (17 Haziran 2026). Gerekçe: etkilenen paket yanlış tanımlanmış; asıl paket `esbuild/deno-esbuild`, npm değil. | Geliştirme | **Yok sayılabilir.** Gerçek açık değil. Ayrıca proje Deno kullanmıyor. Yine de güncellendi (#5). |
| 2 | **High** GHSA-gv7w-rqvm-qjhr (aynı) | esbuild **0.25.12** (drizzle-kit) | **Geri çekildi** (aynı) | Geliştirme | **Yok sayılabilir.** Hostinger geri çekilmiş danışmayı hâlâ gösteriyor. |
| 3 | **Medium** GHSA-g3hv-75wg-m249: minimatch DoS | minimatch **10.2.6** (eslint-config-next → typescript-eslint → typescript-estree) | **Gerçek, etkiliyor** (aralık `>=7.0.0 <11.0.1`) | Geliştirme | **Düzeltildi** (dalda). Risk düşüktü: saldırı için saldırganın glob deseni vermesi gerekir; ESLint yalnızca bizim yapılandırmamızdaki desenleri kullanır. |
| 4 | **Medium** GHSA-g3hv-75wg-m249 (aynı) | minimatch **3.1.5** (eslint ve eklentileri) | **Bu sürümü etkilemiyor**: 3.x aralığın dışında; npm akışı 3.1.5 için kayıt döndürmüyor. | Geliştirme | **Yanlış alarm.** Yok sayılabilir. |
| 5 | **Medium** GHSA-67mh-4wv8-2f99: esbuild geliştirme sunucusu CORS | esbuild **0.18.20** (drizzle-kit → @esbuild-kit/core-utils) | **Gerçek, etkiliyor** (`<=0.24.2`) | Geliştirme | **Düzeltildi** (dalda). Risk pratikte yoktu: açık yalnızca `esbuild serve` geliştirme sunucusunda; drizzle-kit bunu hiç başlatmıyor. |

**Özet**
- Gerçek ve etkileyen danışma: **2** (#3, #5). İkisi de yalnızca geliştirme araçlarında, düşük riskli; **dalda düzeltildi**.
- Geri çekilmiş: **2** (#1, #2).
- Yanlış alarm: **1** (#4).
- Canlı siteyi etkileyen açık: **0**.

## Yapılan güvenli güncelleme (dalda, yayında değil)

`package.json`'a yalnızca ilgili üst pakete sınırlı iki `overrides` eklendi:

```json
"overrides": {
  "@typescript-eslint/typescript-estree": { "minimatch": "^11.0.4" },
  "@esbuild-kit/core-utils": { "esbuild": "^0.25.12" }
}
```

**Kilit dosyası (`package-lock.json`)**
- Kaldırılan: eski esbuild 0.18.20 ve platform ikilileri.
- Eklenen: minimatch 11'in küçük bağımlılığı `@isaacs/nonrecursive-glob-match`.
- Başka paket değişmedi.
- Production bağımlılıkları (next, react, mysql2, nodemailer, pdfkit, drizzle-orm…) **aynı**.

**Neden böyle**
- **`npm audit fix --force` kullanılmadı.** drizzle-kit'i 0.18'e, eslint-config-next'i 15'e düşürüyordu; bozucu bir geri adım.
- **Kalan esbuild 0.25.12 ve 0.28.2 değiştirilmedi.** Tek uyarıları geri çekilmiş danışma (#1–2). drizzle-kit `^0.25` istiyor; 0.28'e zorlamak gereksiz risk olurdu.

**Sonuç**
- `npm audit`: önce 12 orta düzey bulgu, sonra **0**.
- Hostinger'ın bir sonraki taramasında #3 ve #5'in kaybolması beklenir.
- #1 ve #2, Hostinger geri çekilmiş danışmayı listeden çıkarana kadar görünmeye devam edebilir. Bunlar güvenle yok sayılabilir.

## Testler (yerel production build, yeni ve boş test veritabanı)

| Test | Sonuç |
| --- | --- |
| `npm ci` (kilit dosyasından temiz kurulum) | OK, 0 açık |
| Build | OK, 0 CMS/DB hatası |
| TypeScript, ESLint | temiz. Bilerek hatalı bir dosyayla ESLint'in TypeScript'i hâlâ denetlediği doğrulandı. |
| `drizzle-kit generate` (esbuild 0.25 ile) | çalışıyor, "No schema changes" |
| Birim ve veritabanı testleri (randevu, hatırlatma, e-posta kuyruğu, fatura, güvenlik) | 171/171 |
| Kurulum ve giriş (güvenlik) | 8/8 |
| Ajanda, randevu, e-posta, fatura (admin) | 28/28 |
| Saatler, kapanış, personel ve rol yetkileri | 5/5 |
| Intake ve onam belgeleri | 9/9 |
| Navigasyon | 13/13 |

Kayıtlar: `docs/review/deps/`.

Veri:
- Testler yalnızca yerel `glow_dep` test veritabanında çalıştı.
- Canlı veritabanında hiçbir şey okunmadı, değiştirilmedi veya silinmedi.

## Sizden gereken

1. **Yayın onayı (isteğe bağlı, acil değil).** Bu değişiklik yalnızca geliştirme araçlarını etkiler, canlı sitenin çalışmasını değiştirmez. Diğer dal değişiklikleriyle (GTM vb.) birlikte yayınlanabilir.
2. **Hostinger'da:** #1 ve #2 (esbuild GHSA-gv7w-rqvm-qjhr) için bir "yok say" (dismiss) seçeneği varsa kullanabilirsiniz; gerekçe "withdrawn advisory". Hostinger'ın "otomatik düzelt" düğmesini kullanmayın: bu uyarılar zaten "patchable değil" olarak işaretli.
