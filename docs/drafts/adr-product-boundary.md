# ADR — Ürün Sınırı: Enterprise Venture Management (EVM) × Arsam Marketplace

**Durum:** AI-DRAFT / PROPOSED — insan (Kullanıcı/Admin) onayı bekler; `AGENTS.md §7` gereği ADR'yi yalnız insan kilitleyebilir. Bu taslak U4 kararını kapsar ve `kapsama-matrisi-arsam-panel-2026-07-12.md` U4/U5 açık maddelerini adresler.
**Tarih:** 2026-07-12 · **Karar sahibi:** CPO (ismail) · **Hazırlayan:** AI (öneri)

## Bağlam

İlk analiz turu (matris v0.2 + probe v1) ürünü `arsam-consumer` + `arsam-company-os` olarak ikiye bölmüş ve satılabilir ürünü Arsam markasına bağlamıştı. Dış inceleme bunun ürün sınırı hatası olduğunu tespit etti: CPO'nun beyanı "Arsam yalnız örnek model; geliştirilecek şey birçok girişimin kullanabileceği satılabilir bir ürün" idi. Ürün adı bir girişime bağlanırsa generic SaaS vaadi (çok-girişim, tenant-başına konfigürasyon) mimari düzeyde zayıflar. CPO 2026-07-12 oturumunda üç kararı verdi: (1) marketplace de bu kapsamda Metaframer ile geliştirilecek ("birlikte, tek kapsam"), (2) satılabilir ürünün adı `enterprise-venture-management`, (3) çekirdek sözleşmeler önce.

## Karar (önerilen)

Üç katman + iki ürün modeli kilitlenir:

| Katman | Rol | Metaframer karşılığı |
|---|---|---|
| **Metaframer** | Ürün üretme meta-framework'ü (kernel + archetype + surface + 17 boyut) | Çerçevenin kendisi |
| **enterprise-venture-management (EVM)** | Satılabilir, generic girişim yönetim SaaS'ı. Not: bu belgelerde EVM = Enterprise Venture Management; earned-value-management ile karıştırılmamalı | `app` (Ada #1) |
| **Arsam Venture** | EVM'in ilk tenant'ı: workspace + venture kaydı + örnek konfigürasyon (probe) | Tenant verisi — app DEĞİL |

İkinci ürün ve ilişkisi:

| Ürün | Rol | Bağlantı |
|---|---|---|
| **arsam-marketplace** | Gayrimenkul dikeyinde ilan platformu (sahibinden.com rakibi); Arsam Venture'ın operasyon sistemi; kendi backlog'u olan ayrı ürün | `app` (Ada #2). EVM'e **managed system** olarak veri sağlar: event bus (aynı Metaframer altyapısında olduğu için birinci-sınıf yol) + connector/import/API/webhook (EVM'in genel sözleşmesi — marketplace'i olmayan tenant'lar da aynı sözleşmeyle dış sistem bağlar) |

Bağlayıcı sonuçlar: (1) `arsam-company-os` adı tüm dokümanlardan kaldırılır → `EVM`; `arsam-consumer` → `arsam-marketplace`. (2) EVM hiçbir modülünde Arsam'a özgü varsayım taşıyamaz; Arsam'a özgü her şey tenant konfigürasyonu/sektör paketidir. (3) İki app `app-distribution-contract` gereği modül import etmez. (4) EVM'in veri alım sözleşmesi kaynak-tipi-bağımsızdır: manuel giriş = import = API = event aynı doğrulama/mutabakat hattından geçer (`decision-grade-data-contract`). (5) İki ürün tek yatırım dilimini paylaştığından faz önceliği çakışması CPO kararına eskale edilir (U5 sıra kararı bu ADR'yle birlikte onaylanmalı).

## Reddedilen alternatifler

- **Tek şişkin app (panel+marketplace tek Ada):** modül sınırı erimesi; satılabilirlik ölür.
- **Ürün = arsam-company-os (ilk turdaki model):** ürünü ilk müşteriye bağlar; generic vaat mimariden silinir — bu ADR'nin varlık sebebi.
- **Marketplace harici/ertelenmiş:** CPO "birlikte, tek kapsam" kararıyla reddetti (2026-07-12).

## Sonuçlar

Pozitif: ürün kimliği yatırımdan bağımsız satılabilir; Arsam gerçek-veri probu olarak kalır; ikinci tenant ilk günden test edilebilir (çok-tenant CI senaryosu). Negatif/maliyet: iki backlog yönetimi; adlandırma migrasyonu (bir defalık, bu turda yapıldı); EVM'in "kaynak-bağımsız veri alımı" sözleşmesi event-yalnız modelden daha fazla iş.

## Onay

- [ ] CPO onayı (bu kutu insan tarafından işaretlenir; işaretlenince Durum: ACCEPTED yapılır ve dosya `docs/adr-XXXX-product-boundary.md` olarak numaralandırılıp taşınır)
