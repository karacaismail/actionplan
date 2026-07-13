# Commerce Operating System — Ürün Kapsamı (Product Scope)

**Durum:** ACCEPTED PRODUCT SCOPE — 2026-07-13 · **Kaynak yetki:** [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md) + [`adr-0031-commerce-os-vibecoder-handoff-decisions.md`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md)
**Kapsam:** Yalnız dokümantasyon. Bu dosya kod/şema/JSON üretmez; app/module düğümü açmaz ([`AGENTS.md`](../AGENTS.md) §0, §4.4).
**Taksonomi:** `app`=ada, `module`/bounded-context=dağ, `archetype`=kaya, `feature`=taş ([`task-to-code-contract.md`](./task-to-code-contract.md) §1).

> **Bu belge implementasyon kanıtı DEĞİLDİR.** Aşağıdaki hiçbir cümle "yapıldı", "hazır" veya "düğüm açıldı" anlamına gelmez. Kapsam niyet ve sınır beyanıdır; herhangi bir queue/node/kod ancak item-level triyaj + requirements + test-önce kapılarından sonra üretilir ([`ready-for-dev-gate.md`](./ready-for-dev-gate.md), [`task-to-code-contract.md`](./task-to-code-contract.md) §2–3). Feature sayısı hedef veya tamamlanma ölçütü değildir.

---

## 1. Tez (Thesis)

Dağınık commerce parçaları (`s-commerce` archetype, `s-ecommerce-models`, `s-marketplace`, `s-pim`, `s-cpq`, `s-billing`, `s-channel-hub` …) tek üründe değil, stack içinde dağınık yaşıyor. **Commerce Operating System** (slug `commerce-operating-system`, kısa kod `commerce-os`), mevcut kernel/SDK primitifleri üzerinde çalışan, bağımsız satılabilir **jenerik ürün-ailesi/app'tir (ada)**.

Tez: Ticaret iş modellerinin ortak omurgası (katalog, fiyat, sipariş, ödeme-orchestrasyonu, kanal, uyum) tek bir kompozisyon yüzeyinde toplanır; her iş modeli (B2C, B2B, marketplace, subscription, rental, auction, DTC) bu omurga üzerinde **edition + mode bileşimi** olarak ambalajlanır. Ürün, düzenlenmiş yürütmeyi kendisi üstlenmez; **orchestrate eder**.

---

## 2. Hedef kullanıcılar (Target users)

- **Platform tenant operatörü:** Tek omurga üstünde birden çok satış modelini yöneten işletme.
- **Merchant / seller:** Katalog, fiyat, sipariş ve fulfilment'ı yöneten satıcı (B2C/B2B/marketplace seller).
- **Marketplace operatörü:** Çok-satıcılı pazar yeri; komisyon, payout-orchestrasyonu, seller yaşam döngüsü.
- **Commerce ops / revenue ops:** Abonelik, faturalama, uzlaştırma, uyum akışlarını işleten ekip.
- **Entegrasyon geliştiricisi:** Extension runtime üzerinden kanal/sağlayıcı bağlayan geliştirici.
- **Shopper / son tüketici:** Meşru bir hedef son-kullanıcıdır. Storefront ayrı bir yüzey (surface) olsa da, sepet/checkout/sipariş/iade akışlarının nihai öznesi shopper'dır; kapsam kararları onun deneyimini gözetir.

Storefront/shopper UI'ı ayrı bir kanal yüzeyidir (Commerce OS onu doğrudan üretmez, §4), ancak shopper persona kapsam dışı **değildir**.

---

## 3. Minimum ticari dilim (Minimum commercial slice)

İlk dilim **dar ve bilinçli** tutulur (ADR-0030 §8) ama **satılabilir** olmak zorundadır: yalnız katalog/fiyat/sepet/sipariş/ödeme ile tutarlı bir ticaret dilimi kurulamaz — stok/uygunluk ve fulfilment/iade sınırı olmadan sipariş sözü verilemez. Aday minimum çekirdek (kesin kapsam item-level triyaj + requirements kapısında sabitlenir):

1. **Catalog Governance** — ürün/variant/taksonomi otoritesi + yaşam döngüsü/governance.
2. **Offer & Pricing** — teklif/fiyat + CPQ/sözleşme-fiyat değerlendirmesi.
3. **Cart & Checkout** — sepet → sipariş dönüşümü.
4. **Order Orchestration** — sipariş yaşam döngüsü + durum makinesi.
5. **Inventory & Availability** — stok/uygunluk + order-promise otoritesi.
6. **Fulfillment & Returns** — fulfilment + iade/ters-lojistik sınırı.
7. **Payment & Adjustment Orchestration** — dış lisanslı PSP + fee/adjustment (yürütücü değil, orchestrator).

Bu yedi BC, tek tenant'ta tek mode (B2C) ile satılabilir en küçük tutarlı dilimi verir. **Promotions/Merchandising zorunlu core değildir**; opsiyonel edition'dır. Envanter/fulfilment yerine gerekçelendirilmiş **sağlayıcı-destekli eşdeğer** (ör. 3PL/dropship-only) seçilebilir; bu durumda ilgili BC'nin yerini sağlayıcı orchestrasyonu alır ve bu bilinçli kapsam kararı belgelenir. Diğer her şey opsiyonel edition veya advanced-network katmanıdır ([`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)).

---

## 4. Non-goals (Kapsam dışı)

- **Düzenlenmiş yürütücü olmak.** Ödeme/escrow/MoR/kredi/sigorta/vergi-hesaplama/noter Commerce OS içinde inşa edilmez; dış lisanslı sağlayıcıya delege edilir (ADR-0030 §7).
- **Platform primitifini yeniden yazmak.** Tenancy, identity/authz, PDP, entitlement, event bus, audit, ledger, search, storage, extension runtime kopyalanmaz; tüketilir (§5).
- **Drupal/Magento'yu runtime bağımlılık yapmak.** `DRC`/`MAG` provenanstır, import değil (ADR-0030 §5; [`adr-K1-kernel-kimlik.md`](./adr-K1-kernel-kimlik.md)).
- **Storefront/shopper UI üretmek.** Tüketici deneyimi kanal katmanının işidir.
- **Feature-sayısı hedefi kovalamak.** N özellik → N düğüm akışı geçersiz (ADR-0030 §4).
- **Mevcut `s-*` düğümlerini bu belgeyle değiştirmek.** Eşleme ayrı, insan-onaylı triyaj işidir.
- **Yeni app/module düğümü açmak** ([`AGENTS.md`](../AGENTS.md) §4.4).

---

## 5. Tüketilen platform capability'leri (Consumed platform capabilities)

Commerce OS aşağıdaki primitifleri **tüketir, kopyalamaz** (ADR-0030 §6):

| Primitif | Kaynak sözleşme | Commerce OS kullanımı |
|---|---|---|
| Tenancy / izolasyon | platform kernel | Her BC tenant-scoped; app her tenant'a her capability'yi vermez |
| Identity / authz / PDP | [`capability-entitlement-contract.md`](./capability-entitlement-contract.md) | Rol/policy kararı; BC kendi authz'unu yazmaz |
| Capability / entitlement | [`capability-entitlement-contract.md`](./capability-entitlement-contract.md) | Edition/mode → capability açma/kapama |
| Workflow / mode | [`mode-profile-contract.md`](./mode-profile-contract.md), [`adr-A3-mode-profile.md`](./adr-A3-mode-profile.md) | İş modeli runtime bileşimi |
| Audit | platform kernel | Değişmez denetim izi; BC audit'i yeniden yazmaz |
| Ledger | platform kernel | Finansal defter; faturalama/uzlaştırma buraya yazar |
| Search | platform kernel | Katalog/sipariş indeksleme |
| Storage / object | platform kernel | Medya/asset saklama |
| Event bus | platform kernel | BC'ler arası domain event yayını (async, tek yönlü) |
| Extension runtime | [`app-distribution-contract.md`](./app-distribution-contract.md) §3.4 | Kanal/sağlayıcı eklentileri |

Stack kilidi değişmez: FastAPI + SQLAlchemy 2.0 + PostgreSQL ([`adr-K1-kernel-kimlik.md`](./adr-K1-kernel-kimlik.md)); Next/Prisma/Supabase yasak.

---

## 6. Modlar ve edition'lar (Modes & editions)

**Ayrım (ADR-0030):** Edition = ticari ambalaj; Mode = runtime davranış bileşimi; Tenant = izolasyon birimi. Karıştırılmaz.

- **İlk edition:** *Core* = yalnız BC-01…BC-07.
- **Opsiyonel paket adayları:** *Marketplace* ve *Subscription* ancak ilgili provisional authority testini geçerse ayrı module/BC açabilir. *Enterprise-B2B*, *Channel/Omnichannel* ve *Classifieds/Lead-Gen* bağımsız BC değildir; mevcut authority'ler üzerinde entitlement + policy/workflow/integration/configuration paketidir. Classifieds paketi REOC Property Registry veya Listing Supply authority'sini kopyalayamaz.
- **Daha sonraki, core tarafından bloklanan adaylar:** *Auction* ve *Recommerce*. Recommerce yalnız bağımsız asset/provenance owner, lifecycle ve policy kanıtıyla provisional module adayı kalır; ilk dilime girmez.
- **Mode:** B2C, B2B, Marketplace, Subscription, Rental, Auction, DTC/Omnichannel ve Classifieds/Lead-Gen birer capability bileşimidir; mode kendi başına module/BC yaratmaz ([`mode-profile-contract.md`](./mode-profile-contract.md)).

Kompozisyon kuralı: Bir tenant bir edition satın alır; edition yalnız kanıtlanmış BC ve capability'leri entitlement/policy ile açar; mode bu capability'lerin davranışını seçer. Hiçbir mode/edition platform primitifini bypass etmez veya yeni authority icat etmez.

---

## 7. Drupal/Magento türevi farklılaştırıcı fikirler (lock-in olmadan)

**Ad provenanstır; davranış değildir.** `DRC`/`MAG` isimleri Drupal/Magento kökenini işaretler (runtime bağımlılık değil, ADR-0030 §5), ancak türetilen **davranış setleri atılmaz** — platform/SDK/business-feature/workflow/archetype/BC eksenlerinde sınıflandırılır ([`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md) §2.1–2.2). Item-level kabul beklemededir.

- **Drupal-türevi (DRC) farklılaştırıcılar:** capability commerce, nesne-kapsamlı ücretli erişim/mutasyon/pay-to-publish, form-to-commerce, aktör-bağlamı/grup-sahipliği, operatör iş-tezgahı, görsel otomasyon, atomik deneyim yayını/layout, imzalı sepet reçeteleri/satın-alma niyetleri, fiyat gözlemi/UBL — **davranış olarak** sınıflandırılır (bir kısmı platform primitifine REUSE, bir kısmı Cart/Offer feature'ına FOLD). **Not:** atomik deneyim yayını/layout **kanıtlanmış primitif değildir** → DEFER-HUMAN paylaşılan-yetenek adayı (classification §2.1, gap §3-23).
- **Magento-eklenti-türevi (MAG) farklılaştırıcılar:** SEO Ops, kanal feed derleyici, veri eşleme/import-export, çevrimdışı POS uç, destek talebi, fee/adjustment, Q&A/bilgi, rozet, affiliate atıf/uzlaştırma, federe kimlik, beden/uygunluk bilgisi, satın-alma-sonrası akış, fiyat şeffaflığı, review zekası, editoryal graf, katalog projeksiyon/drift — modül-terfi kriterini geçmedikçe feature/archetype/SDK yüzeyi kalır.
- **Lock-in yok:** Davranışlar kernel/SDK primitifleri (search projection, PDP, workflow/ECA, event) üzerine oturur; PHP/MySQL/EAV veya Drupal/Magento modül sistemi ithal edilmez ([`adr-K1-kernel-kimlik.md`](./adr-K1-kernel-kimlik.md)). Köken fikir kaynağıdır, teknoloji zorunluluğu değil.

---

## 8. Sağlayıcı sınırı (Provider boundary)

Düzenlenmiş yürütme = **dış lisanslı sağlayıcı entegrasyonu** (ADR-0030 §7):

- Ödeme, escrow, Merchant-of-Record, kredi/BNPL, sigorta, vergi-hesaplama, KYC/AML, noter/e-imza.
- Commerce OS bu akışları **orchestrate eder** (durum, retry, uzlaştırma tetiği); lisanslı işlemi kendisi yürütmez.
- Sağlayıcı entegrasyonları extension runtime üzerinden bağlanır; BC'ler sağlayıcıyı doğrudan değil, orchestration BC'si üzerinden çağırır.
- Aksi yönde bir **insan kararı** olmadan hiçbir BC lisanslı yürütücüye terfi etmez.

---

## 9. DoR / DoD (Bu kapsam belgesi için)

**Definition of Ready (kapsamın item'a dönüşmesi için):**
- İlgili feature-ID ailesi [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md)'de item-level disposition almış.
- Hedef BC ve owner belirli ([`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)); provisional işareti çözülmüş.
- Tüketilen platform primitifi sözleşmeyle bağlanmış (kopya yok).
- İnsan onayı: slug/kısa-kod + BC ayrımı kabul edilmiş (ADR-0030 §Sonraki kapılar).

**Definition of Done (bu belge için — implementasyon DoD'u değil):**
- Tez, persona, minimum dilim, non-goal, tüketilen primitifler, mode/edition, sağlayıcı sınırı belgelenmiş.
- Her iddia ADR-0030 ve kanonik sözleşmelere geri bağlanmış.
- Hiçbir app/module düğümü açılmamış; hiçbir kod/JSON üretilmemiş.

---

## İlgili doküman

- [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md)
- [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md), [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md)
- [`capability-entitlement-contract.md`](./capability-entitlement-contract.md), [`mode-profile-contract.md`](./mode-profile-contract.md), [`app-distribution-contract.md`](./app-distribution-contract.md)
- [`task-to-code-contract.md`](./task-to-code-contract.md), [`ready-for-dev-gate.md`](./ready-for-dev-gate.md), [`adr-K1-kernel-kimlik.md`](./adr-K1-kernel-kimlik.md), [`adr-A3-mode-profile.md`](./adr-A3-mode-profile.md)
