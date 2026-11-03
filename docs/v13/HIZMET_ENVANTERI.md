# Hizmet envanteri (v13, 3 Kasım 2026)

Kaynak: `src/lib/catalogue/builtin.ts` (yerleşik varsayılanlar). Sahibin Admin → Behandelingen'de girdiği fiyat, süre ve durum veritabanında saklanır ve bunların önüne geçer. Tabloda fiyat/süre yoksa site "Op aanvraag / On request / Talep üzerine" gösterir — asla € 0.

**Yayında: 19** (13 ağda + 5 masaj + buhar destekli yüz bakımı). **Taslak: 10** (sahip onayı bekleyen yüz bakımları, vücut sargısı, 4 paket).

Her yayındaki hizmet şuralarda doğrudan bağlantılıdır: "Alle behandelingen / All treatments / Tüm bakımlar" sayfası, masaüstü mega menü, mobil "Behandelingen per categorie" akordeonu, footer, fiyatlar sayfası, randevu formu (talep), XML sitemap (3 dil).

| Kategori | NL | EN | TR | Durum | Fiyat | Süre (dk) | Fotoğraf |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Waxbehandelingen | Wenkbrauwen | Eyebrows | Kaşlar | **Yayında** | Talep üzerine | — | `zone-face` |
| Waxbehandelingen | Bovenlip | Upper lip | Üst dudak | **Yayında** | Talep üzerine | — | `wax-lip` |
| Waxbehandelingen | Kin | Chin | Çene | **Yayında** | Talep üzerine | — | `wax-lip` |
| Waxbehandelingen | Volledig gezicht | Full face | Tüm yüz | **Yayında** | Talep üzerine | — | `hero` |
| Waxbehandelingen | Oksels | Underarms | Koltuk altı | **Yayında** | Talep üzerine | — | `wax-underarm` |
| Waxbehandelingen | Onderarmen | Half arms | Kol (dirsek altı) | **Yayında** | Talep üzerine | — | `wax-arms` |
| Waxbehandelingen | Hele armen | Full arms | Tüm kol | **Yayında** | Talep üzerine | — | `wax-arms` |
| Waxbehandelingen | Onderbenen | Half legs | Diz altı | **Yayında** | Talep üzerine | — | `wax-legs` |
| Waxbehandelingen | Hele benen | Full legs | Tüm bacak | **Yayında** | Talep üzerine | — | `treatments-hero` |
| Waxbehandelingen | Rug | Back | Sırt | **Yayında** | Talep üzerine | — | `wax-back` |
| Waxbehandelingen | Bikinilijn | Bikini line | Bikini çizgisi | **Yayında** | Talep üzerine | — | `zone-intimate` |
| Waxbehandelingen | Brazilian | Brazilian | Brezilya ağdası | **Yayında** | Talep üzerine | — | `linen` |
| Waxbehandelingen | Hollywood | Hollywood | Hollywood ağdası | **Yayında** | Talep üzerine | — | `contact` |
| Gezichtsbehandelingen | Gezichtsbehandeling met stoom | Facial care with steam | Buhar destekli yüz bakımı | **Yayında** | Talep üzerine | — | `facial-steam` |
| Gezichtsbehandelingen | Manuele gezichtsreiniging | Manual facial cleansing | Elle yüz temizliği | Taslak | Talep üzerine | — | `botanical` |
| Gezichtsbehandelingen | Gezichtsreiniging met borstelapparaat | Facial cleansing with a brush device | Fırça cihazıyla yüz temizliği | Taslak | Talep üzerine | — | `aftercare` |
| Gezichtsbehandelingen | Gezichtspeeling | Facial exfoliation | Yüz peelingi | Taslak | Talep üzerine | — | `facial` |
| Gezichtsbehandelingen | Gezichtsmasker | Face mask | Yüz maskesi | Taslak | Talep üzerine | — | `facial` |
| Gezichtsbehandelingen | Complete gezichtsbehandeling | Complete facial | Kapsamlı yüz bakımı | Taslak | Talep üzerine | — | `dropper` |
| Lichaamsbehandelingen | Lichaamspakking | Body wrap | Vücut sargısı | Taslak | Talep üzerine | — | `bodycare` |
| Massages | Ontspanningsmassage (hele lichaam) | Full-body relaxation massage | Tüm vücut rahatlama masajı | **Yayında** | Talep üzerine | — | `massage-body` |
| Massages | Gezichtsmassage | Facial massage | Yüz masajı | **Yayında** | Talep üzerine | — | `massage-face` |
| Massages | Hoofdmassage | Head massage | Baş masajı | **Yayında** | Talep üzerine | — | `massage-head` |
| Massages | Handmassage | Hand massage | El masajı | **Yayında** | Talep üzerine | — | `massage-hand` |
| Massages | Voetmassage | Foot massage | Ayak masajı | **Yayında** | Talep üzerine | — | `massage-foot` |
| Pakketten | Glow Face Trio | Glow Face Trio | Glow Face Trio | Taslak | Talep üzerine | — | `facial` |
| Pakketten | Smooth Essentials | Smooth Essentials | Smooth Essentials | Taslak | Talep üzerine | — | `zone-body` |
| Pakketten | Glow Complete | Glow Complete | Glow Complete | Taslak | Talep üzerine | — | `contact` |
| Pakketten | Bikini & Smooth | Bikini & Smooth | Bikini & Smooth | Taslak | Talep üzerine | — | `zone-intimate` |

Notlar
- `massage-relaxation` kimliği ve NL/EN adresleri korunmuştur (eski bağlantılar ve randevular çalışır); artık "tüm vücut" masajıdır.
- Masajlar için teknik, baskı türü, süre, fiyat veya sağlık faydası iddia edilmez. Buhar: "olası bir adım" olarak anlatılır; ozon/cihaz iddiası yoktur.
- Kadınlara özel konumlandırma ve "gediplomeerd schoonheidsspecialiste (niveau 3)" ifadesi üç dilde kullanılır; tam diploma adı sahip onayı bekliyor.
