# Commerce Operating System — Stack → App Kompozisyonu (Aday Manifest Profili)

**Durum:** DRAFT — 2026-07-13 · **Kaynak yetki:** [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md), [`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md) §Commerce OS Profili
**Kapsam:** Yalnız dokümantasyon. Bu dosya makine-okunur manifest/kod/şema/JSON **üretmez**, app/module düğümü **açmaz veya değiştirmez** ([`AGENTS.md`](../AGENTS.md) §0, §4.4).
**Taksonomi:** `app`=ada, `module`/bounded-context=dağ, `archetype`=kaya, `feature`=taş, `component`=kum ([`task-to-code-contract.md`](./task-to-code-contract.md) §1).

> **Bu belge implementasyon kanıtı DEĞİLDİR.** Hiçbir satır "yapıldı/hazır/düğüm açıldı" demez. Aşağıdaki manifest **profil taslağıdır**, çalışan artefakt değil. Mevcut `s-*`/`stack-*` düğümlerinin her eşlemesi **gelecekte insan-onaylı changeset önerisidir**; bu fazda hiçbir düğüm mutasyona uğramaz (ADR-0030 §Migration). Dokümanlar implementasyon kanıtı sayılmaz.

## 1. Aday app manifest profili (makine-okunur değil)

`commerce-operating-system` app'i (ada, kısa kod `commerce-os`) için **kavramsal manifest profili**. Bu, JSON/YAML manifest değildir; hangi katmanların hangi sorumlulukla paketleneceğini beyan eden sözleşme taslağıdır ([`app-distribution-contract.md`](./app-distribution-contract.md) §1.3, `kernel-sdk-app-delivery-sequence.md` §App-core sorumluluğu).

| Manifest alanı (aday) | İçerik | Not / kaynak |
|---|---|---|
| `app.slug` | `commerce-operating-system` | ADR-0030 §Karar-1 |
| `app.shortCode` | `commerce-os` | ADR-0030 §Karar-1 |
| `app.moduleNamespace` | `commerce_os_*` | sequence §Namespace |
| `app.eventNamespace` | `commerce-os.*` | sequence §Namespace |
| `app.appCore` | BC listesi, edition/mode kompozisyon kuralı, ortak sözlük, app-level policy varsayılanı, tüketilen primitif bağı (**iş mantığı yazmaz**) | sequence Kapı 2 |
| `app.businessModules[]` | Core 7 BC (§2) + opsiyonel/advanced BC (§3) — her biri `module` (dağ) | BC-map |
| `app.archetypes[]` | Domain model + projeksiyon birimleri (order/line-item, inventory-stock, ledger, messaging-thread) | [`archetype-order-line-item-directive.md`](./archetype-order-line-item-directive.md) vb. |
| `app.features[]` | Tek kullanıcı hikayesi/servis metodu (BC içi taş) | classification FOLD hedefleri |
| `app.workflows[]` | ECA/state-machine bileşimi (**tüketilir**) | [`workflow-directive.md`](./workflow-directive.md) |
| `app.policies[]` | PDP/entitlement varsayılanı (**tüketilir**) | [`capability-entitlement-contract.md`](./capability-entitlement-contract.md) |
| `app.integrations[]` | Provider/extension bağı (PSP/vergi/KYC/kanal API) | §7, [`k-provider-adapter-directive.md`](./k-provider-adapter-directive.md) |
| `app.reporting[]` | Analitik/search projeksiyonu (**tüketilir**, kendi veri gölü yok) | [`k-search-directive.md`](./k-search-directive.md), classification DAT2=REUSE |
| `app.ai[]` | Agentic akış — AI yetki sınırına tabi, DEFER | [`AGENTS.md`](../AGENTS.md) §4.4, classification AGT2=DEFER |
| `app.configPacks[]` | Mode/edition capability profili | [`mode-profile-contract.md`](./mode-profile-contract.md) |
| `app.editions[]` | Ticari ambalaj (§4) | [`stack-editions.json`](../src/data/generated/nodes/stack-editions.json) |
| `app.modes[]` | Runtime davranış bileşimi (§4) | ADR-A3 |

**Kural:** `app` düğümü kod yazma yeri değildir; manifest hangi module'ün hangi sürüm+capability sınırıyla satılacağını tanımlar (sequence §Karar). App-core generic kernel değildir; kernel herkesindir, app-core yalnız Commerce OS'a aittir.

## 2. Core yedi BC (satılabilir en küçük dilim)

[`commerce-os-product-scope.md`](./commerce-os-product-scope.md) §3 + [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md) §2. Her satır bir `module` (dağ), app değil.

| BC | Sorumluluk | Ana archetype/feature | Tüketilen primitif |
|---|---|---|---|
| BC-01 Catalog Governance | ürün/variant/taksonomi + yaşam döngüsü | variant-attribute-family, taxonomy | search, storage, MDM/provenance |
| BC-02 Offer & Pricing | teklif/fiyat/CPQ/sözleşme-fiyat | pricing-rule, quote (CFG/PRM2 FOLD) | computation, policy |
| BC-03 Cart & Checkout | sepet → sipariş dönüşümü | cart-session, checkout-intent | identity, tenancy |
| BC-04 Order Orchestration | sipariş state-machine | order/line-item | event bus, audit |
| BC-05 Inventory & Availability | stok/rezervasyon/ATP | inventory-stock | event bus |
| BC-06 Fulfillment & Returns | sevkiyat + RMA/ters-lojistik | shipment, rma | audit, event bus |
| BC-07 Payment & Adjustment | ödeme-orchestrasyonu + fee/adjustment | payment-intent, adjustment | ledger, provider port |

## 3. Core dışı yüzeylerin kararı

[`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) D11 sonucu bağlayıcıdır. Bu bölüm yeni module/BC yaratmaz.

- **KEEP PROVISIONAL:** Marketplace governance, Subscription, Auction ve Recommerce. Yalnız Marketplace/Subscription yakın dönem paket adayıdır; Auction/Recommerce core evidence'a kadar blocked'dır. Her biri owner + data authority + lifecycle authority + independent policy testini geçmeden module değildir.
- **DEMOTE:** B2B, Service/Booking/Rental, Channel/Omnichannel, Promotions/Merchandising, Supplier, Settlement, Compliance ve Classifieds/Lead-Gen. Bunlar feature, workflow, policy, integration, reporting surface veya configuration pack olarak mevcut core/platform authority'lerini tüketir.
- **Classifieds sınırı:** Commerce OS bağımsız listing/property authority'si kurmaz ve REOC Property Registry/Listing Supply authority'sini kopyalamaz.

## 4. Edition/Mode matrisi — her tenant her şeyi almaz

Edition = ticari ambalaj; Mode = runtime davranış; Tenant = izolasyon (ADR-0030). Bir tenant bir edition satın alır → edition BC setini açar → mode capability davranışını seçer; hiçbir mode/edition platform primitifini bypass etmez.

| Edition (aday) | Açılan BC seti | Tipik mode(lar) |
|---|---|---|
| Core | BC-01…BC-07 | B2C |
| Marketplace* | Core + kanıtlanmış marketplace-governance capability/BC | Marketplace |
| Subscription* | Core + kanıtlanmış subscription-contract capability/BC | Subscription |
| Enterprise-B2B | Core + policy/workflow/configuration pack | B2B |
| Channel/Omnichannel | Core + projection/integration/configuration pack | DTC/Omnichannel |
| Classifieds/Lead-Gen | Core + Catalog/Offer/CRM/Entitlement workflow/configuration pack | Classifieds/Lead-Gen |
| Auction/Recommerce* | Core + daha sonraki kanıtlanmış provisional capability/BC | Auction/Recommerce |

`*` = core evidence ve module-terfi testleri kapanmadan satılamaz/açılamaz.

Kompozisyon otoritesi mevcut edition düğümünden **tüketilir** ([`stack-editions.json`](../src/data/generated/nodes/stack-editions.json)); Commerce OS yeni edition motoru yazmaz.

## 5. Mevcut `s-*` / `stack-*` artefakt eşlemesi (öneri — mutasyon değil)

Disposition sözlüğü: **KEEP/REUSE** (tüket/koru) · **RECLASSIFY** (seviye/hedef değişir) · **SPLIT** (böl) · **SUPERSEDE-CAND** (Commerce OS BC'lerince kuşatılır, geçersizleşme adayı) · **DUPLICATE** (örtüşür, konsolide) · **UNRELATED** (kapsam dışı). Her satır **öneridir**; bu fazda düğüm **değişmez** (ADR-0030 §Migration, `AGENTS.md` §4.4).

| Artefakt (kanıt path) | Bugünkü seviye | Disposition | Önerilen hedef / gerekçe |
|---|---|---|---|
| [`s-commerce.json`](../src/data/generated/nodes/s-commerce.json) | archetype | **SUPERSEDE-CAND** | Archetype (kaya) **tüm app olamaz** (ADR-0030 §Alternatifler); yetenekleri BC-01…BC-07'ye dağılır. Geçersizleşme insan onaylı changeset'te. |
| [`s-ecommerce-models.json`](../src/data/generated/nodes/s-ecommerce-models.json) | module (geniş) | **RECLASSIFY** | Bir geniş modül; ama B2C/B2B/C2C… model etiketleri **mode/capability profiline** dönüşmeli, mega-modül kalmamalı. Öneri: gelecekteki insan-onaylı changeset (§6, §8). |
| [`s-marketplace.json`](../src/data/generated/nodes/s-marketplace.json) | archetype | **RECLASSIFY** | → BC-08 Marketplace & Trust module adayı (MKT+TRS2). |
| [`s-billing.json`](../src/data/generated/nodes/s-billing.json) | archetype | **RECLASSIFY/SPLIT** | Abonelik faturalama → BC-10; ledger yazımı platform ledger primitifine (REUSE). |
| [`s-subscription-commerce.json`](../src/data/generated/nodes/s-subscription-commerce.json) | feature | **FOLD→BC-10** | Subscription & Membership içinde feature. |
| [`s-dropshipping.json`](../src/data/generated/nodes/s-dropshipping.json) | feature | **FOLD** | → BC-15 Supplier / BC-06 Fulfillment (provider-destekli); stoksuz akış. |
| [`s-social-commerce.json`](../src/data/generated/nodes/s-social-commerce.json) | feature | **FOLD** | Channel/Omnichannel projection/integration/configuration feature'ı; bağımsız BC değil. |
| [`s-payment-methods.json`](../src/data/generated/nodes/s-payment-methods.json) | feature | **FOLD→BC-07** | Yerel ödeme yöntemleri = provider entegrasyonu (§7). |
| [`s-channel-hub.json`](../src/data/generated/nodes/s-channel-hub.json) | module | **DEMOTE-CAND** | Channel projection/integration/configuration surface; `stack-channel` ile **DUPLICATE** riski. Gerçek node değişikliği ayrı insan-onaylı dalgadır. |
| [`stack-channel.json`](../src/data/generated/nodes/stack-channel.json) | module | **DUPLICATE/DEMOTE-CAND** | `s-channel-hub` ile örtüşür; bağımsız Commerce OS BC authority'si yoktur. |
| [`s-product-feed.json`](../src/data/generated/nodes/s-product-feed.json) | module | **FOLD** | Kanal feed derleyici; Catalog/extension runtime üzerinde integration feature'ı, kendi authority'si yok. |
| [`s-inventory.json`](../src/data/generated/nodes/s-inventory.json) | archetype | **RECLASSIFY→BC-05** | Inventory & Availability domain modeli ([`archetype-inventory-stock-directive.md`](./archetype-inventory-stock-directive.md)). |
| [`stack-service.json`](../src/data/generated/nodes/stack-service.json) | module | **DEMOTE-CAND** | Service/Booking/Rental workflow/configuration pack; bağımsız Commerce OS authority'si kanıtlanmadı. |
| [`stack-messaging.json`](../src/data/generated/nodes/stack-messaging.json) | module | **SPLIT** | Kanal-ticaret → BC-12; messaging-thread **yeniden-kullanılabilir archetype sözleşmesi** (REUSE archetype — platform primitifi **değil**, [`archetype-messaging-thread-directive.md`](./archetype-messaging-thread-directive.md)); WhatsApp API = provider. |
| [`stack-compliance.json`](../src/data/generated/nodes/stack-compliance.json) | module | **DEMOTE-CAND** | Jurisdiction policy/configuration pack + audit/evidence primitifi (REUSE); regulated execution değil. |
| [`stack-editions.json`](../src/data/generated/nodes/stack-editions.json) | module | **REUSE** | Edition kompozisyon otoritesi tüketilir (§4). |
| [`s-classifieds.json`](../src/data/generated/nodes/s-classifieds.json) | module | **DEMOTE-CAND** | Classifieds/lead-gen ticari bir mode/pakettir; Catalog/Offer/generic CRM/Entitlement üzerinde workflow/policy/configuration olarak kalır. REOC Property/Listing authority'sini alamaz. |
| [`stack-workspace.json`](../src/data/generated/nodes/stack-workspace.json) | module | **UNRELATED** | Verimlilik paketi (mail/takvim/drive); commerce değil. |
| [`app-customer-revenue.json`](../src/data/generated/nodes/app-customer-revenue.json) | app | **UNRELATED (konteyner)** | Mevcut WBS app-kümesi; Commerce OS **ayrı yeni ada**dır, bu kümeyi kuşatmaz/geçersizleştirmez. |

**Kritik not (bağlayıcı):** `s-commerce` bugün archetype olduğu için **tek başına app muamelesi göremez**; `s-ecommerce-models` tek geniş modüldür ama model etiketleri **mode/capability profiline** dönüşmeli, mega-modül olarak kalmamalıdır. Bu iki dönüşüm **gelecekteki insan-onaylı changeset'tir**, bu fazda **uygulanmaz**.

## 6. Drupal/Magento-türevi yeteneklerin katman eşlemesi (feature başına düğüm YOK)

Ad provenanstır, davranış değil (ADR-0030 §5). Davranışlar **uygun katmana** eşlenir; "her feature'a bir node" akışı geçersizdir (ADR-0030 §4). Detay: [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md) §2.1–2.2.

- **Platform primitifine REUSE:** acting-context/group ownership, görsel otomasyon (ECA), federe kimlik, katalog projeksiyon/drift.
- **BC feature'ına FOLD:** capability commerce (Entitlement+Offer), object-scoped ücretli erişim (PDP+Cart), form-to-commerce (Cart), SEO Ops/kanal feed (Channel/Catalog), fee/adjustment (Payment), Q&A/rozet/fit/review/editorial (Merchandising/Trust), post-purchase (Order/Aftermarket), price transparency (Offer).
- **DEFER (insan kararı — primitif iddia edilmez):** atomik deneyim yayını/layout (**REUSE değil**; sözleşme kanıtlanmamış → DEFER-HUMAN, gap §3-23), veri-eşleme/import-export (**REUSE değil**; mevcut migration/worker deseni yeniden kullanılabilir ama public tipli mapping port'u kanıtlanmamış → SDK-PORT/DEFER, gap §3-16), imzalı sepet reçetesi/satın-alma niyeti, offline POS edge, affiliate settlement.

**Kural:** Modül-terfi kriterini (classification §6) geçmedikçe hiçbir DRC/MAG alt-ailesi BC üretmez; feature/archetype/SDK/workflow yüzeyinde kalır. Lock-in yok: PHP/MySQL/EAV veya Drupal/Magento modül sistemi ithal edilmez (ADR-K1).

## 7. Provider / entegrasyon sınırı

Düzenlenmiş yürütme = **dış lisanslı sağlayıcı** (ADR-0030 §7, scope §8). Commerce OS **orchestrate eder, yürütmez**.

- **Provider (dış):** PSP/escrow/MoR, kredi/BNPL, sigorta, vergi-hesaplama, KYC/AML, noter/e-imza, kargo/3PL, WMS/ERP, kanal/pazar-yeri/POS API.
- **Bağlanma noktası:** extension runtime + `k-provider-adapter` port sınıfları ([`app-distribution-contract.md`](./app-distribution-contract.md) §3.4). Ödeme/vergi port sınıfı **eksik** → EXTEND-CONTRACT adayı, yeni primitif değil ([`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md) §3-15, §8-Q2).
- BC'ler sağlayıcıyı **doğrudan çağırmaz**; orchestration BC'si (BC-07/BC-17) üzerinden geçer. İnsan kararı olmadan hiçbir BC lisanslı yürütücüye terfi etmez.

## 8. Gelecek generated-node dönüşüm planı (bu fazda mutasyon YOK)

Herhangi bir `src/data/generated/nodes/*.json` üretimi/değişimi **implementasyon/insan rolüne** aittir ve şu kapılardan geçmeden başlamaz. **Bu doküman hiçbir düğümü değiştirmez veya açmaz.**

| Adım | Önkoşul | İzinli dosya sınıfı (öneri) | Stop-gate (üretmeden DUR) |
|---|---|---|---|
| T1: ADR-0030 slug/BC insan onayı | — | (yok; karar) | Onay yoksa DUR |
| T2: Item-level triyaj (§5 satırları tek tek) | T1 | doküman-only | classification §4 kapısı geçilmeden DUR |
| T3: `s-ecommerce-models` model-etiketi → mode/config profili changeset | T2 | `docs/*` changeset önerisi + (onaylıysa) `src/data/generated/nodes/s-ecommerce-models.json` tek dosya | İnsan onayı + test-önce yoksa DUR |
| T4: `s-commerce` supersede eşleme changeset | T2 | ilgili `s-*` düğümleri (izole, tek-shard) | ADR-0030 §Sonraki-kapı onayı yoksa DUR |
| T5: BC module düğümü açma | T1–T4 | app/module düğümü (**yalnız insan onayı**) | `AGENTS.md` §4.4 — AI app/module üretemez → DUR |

Her changeset ≤400 net satır, ≤20 dosya (`AGENTS.md` §4.3); izole dosya yazımı, tek-amaç (§6). Migration/toplu-yeniden-yazma yasak; default'lu lazy migration korunur (`AGENTS.md` §6).

## 9. App bağımsızlığı ve cross-app import yasağı

- Commerce OS **ayrı, bağımsız satılabilir ada**dır; başka app'in iç module'ünü import etmez, başka app onun module'ünü import etmez (sequence §3).
- App-to-app haberleşme yalnız **kernel sözleşmesi / public API / event bus** üzerinden olur; kernel internals sızdırılmaz.
- BC'ler arası cross-context write yasaktır; ihtiyaç event/orchestration ile karşılanır (BC-map §1).
- Tüketilen platform primitifi kopyalanmaz; kopyalayan BC sözleşme ihlali sayılır (gap §5).

## İlgili doküman

- [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md), [`commerce-os-product-scope.md`](./commerce-os-product-scope.md), [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md), [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md), [`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md)
- [`commerce-os-test-first-parallel-handoff.md`](./commerce-os-test-first-parallel-handoff.md), [`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md), [`app-distribution-contract.md`](./app-distribution-contract.md), [`task-to-code-contract.md`](./task-to-code-contract.md), [`mode-profile-contract.md`](./mode-profile-contract.md)
