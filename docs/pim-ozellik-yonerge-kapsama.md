# PIM-v2 Özellik → Yönerge Kapsama Matrisi

Statü: AI-DRAFT · Tarih: 2026-07-01 · Kapsam: planlama (`actionplan/`). Bu belge kod üretmez; kapsama analizidir.
Kaynak: `docs/reference/PIM-v2-Gereksinim-Analizi.md` §8 (41-özellik matrisi) + §7 fazlar · `docs/core-contract-pack.md` (v1 10 + v2 15 primitif) · `plan-03-yeni-yonergeler-2026-07-01.md §3` (5 kernel primitifi) · `docs/surface-v2-directive.md` (22 tip) · `docs/archetype-uretim-spec.md` §12 (yan-sözleşme aileleri).

## 1. Amaç ve okuma yönergesi

Bu belge, PIM-v2 gereksinim analizindeki 41 özelliğin her birini platformun üç katmanına — **kernel primitifi/yönergesi**, **archetype yönergesi**, **surface tipi** — eşler ve her satırın kapsama durumunu işaretler. Amaç, "PIM-v2'yi bu platform üstünde inşa etmek için hangi çekirdek sözleşme hazır, hangisi yeni yönerge ister, hangisi hâlâ boş?" sorusuna tek tabloda cevap vermektir. Bir dikey dilim (PIM) mevcut kernel/archetype/surface sözleşmelerinin üstüne oturur; bu matris o oturmanın boşluk haritasıdır.

Durum sözlüğü: **VAR** = ilgili kernel/archetype/surface düğümü veya sözleşmesi repoda mevcut (ör. `k-tenancy`, `scale-workers`, `k-archetype-fieldtypes`); PIM yalnız tüketir. **YENİ-yönerge** = temel primitif/tip mevcut ama PIM'e özgü bir archetype yan-sözleşmesi veya yeni kernel düğümü yazılmalı (ör. `archetype-variant-attribute-family`, `k-mdm`, `k-storage`). **EKSİK** = ne çekirdekte ne archetype'ta bir karşılığı yok; sıfırdan yönerge + düğüm gerekir. Not: 41 özelliğin büyük çoğunluğu ya VAR ya YENİ-yönergedir; PIM domaini mevcut çekirdeğin üstüne büyük ölçüde oturur, sıfır-boşluk (saf EKSİK) yalnız birkaç kalemdir.

Sütun anlamları: **Kernel primitifi/yönergesi** = çekirdekten tüketilen sözleşme(ler) (v1/v2 `core-contract-pack` düğümleri veya `plan-03 §3` primitifleri). **Archetype yönergesi** = ArcheType gövdesine bağlı, ayrı versiyonlanan yan-sözleşme (`archetype-uretim-spec §12` deseni). **Surface tipi** = 22-tip taksonomisinden ilgili yüzey(ler). **Öncelik** PIM-v2 §8'den birebir alınır (P0=MVP zorunlu, P1=erken, P2=orta, P3=uzun vade).

## 2. Kapsama matrisi (41 özellik)

| # | Özellik | PIM Faz | Öncelik | Kernel primitifi/yönergesi | Archetype yönergesi | Surface tipi | Durum |
|---|---|---|---|---|---|---|---|
| 1 | Kimlik doğrulama (JWT+refresh, RBAC) | 0 | P0 | `k-identity` + `k-authz` | archetype-user-role (bağlar) | `form` (login), `detail` | VAR |
| 2 | Multi-tenant izolasyon (RLS + tenant_id) | 0 | P0 | `k-tenancy` (RLS + tenant ctx) | archetype base-mixin (tenant_id zorunlu) | — (çapraz-kesen) | VAR |
| 3 | Ürün CRUD + liste/filtre/arama | 1 | P0 | `k-schema` + `k-archetype-storage` (JSONB) | archetype-product (Product gövdesi) | `list`, `detail`, `form` | YENİ-yönerge |
| 4 | Varyant yönetimi (çok seviyeli) | 1 | P0 | `k-archetype-fieldtypes` (attribute-set) | archetype-variant-attribute-family | `detail`, `data-grid` (varyant matris) | YENİ-yönerge |
| 5 | EAV öznitelik sistemi | 1 | P0 | `k-archetype-fieldtypes` (attribute-set/EAV, `Fieldtypes.AttributeSet`) | archetype-eav | `form`, `data-grid` | YENİ-yönerge |
| 6 | Kategori & aile ağaçları | 1 | P0 | `k-schema` (ltree/recursive) | archetype-tree-relation (`relations.tree`) | `detail` (ağaç gezgini) | YENİ-yönerge |
| 7 | Metadata-driven dinamik form motoru | 1 | P0 | `k-schema` (meta endpoint) + `k-surface` | archetype fields→surface projeksiyon | `form` (`renderStrategy: projected`) | VAR |
| 8 | 12 adımlı onboarding wizard | 2 | P0 | `k-workflow` (Workflow Registry) | archetype-onboarding-state | `wizard` | VAR |
| 9 | Industry template motoru | 2 | P1 | `k-archetype-bayraklari` + `k-capability` | archetype-industry-template (idempotent seed) | `wizard`, `form` | YENİ-yönerge |
| 10 | Feature flags (tenant) | 2 | P1 | `k-capability` (Capability/Entitlement) | archetype capability-gate bağı | `dashboard` (ayar), `form` | VAR |
| 11 | Ayarlar / konfigürasyon | 2 | P1 | `k-mode` (Mode-Profile) + `k-tenancy` | archetype-tenant-config | `form`, `dashboard` | VAR |
| 12 | Öznitelik şablonları | 3 | P1 | `k-schema` + `k-archetype-fieldtypes` | archetype-attribute-template | `form`, `list` | YENİ-yönerge |
| 13 | Taksonomi (ETIM/UNSPSC/GPC) | 3 | P1 | `k-schema` (tree) + `k-jurisdiction` (locale) | archetype-taxonomy (`TaxonomyNode` ağaç) | `detail` (taksonomi gezgini) | YENİ-yönerge |
| 14 | Öznitelik önerisi | 3 | P2 | `k-agent-runtime` (AI öneri) + `k-policy-pdp` | archetype-node-attribute-suggestion | `detail`, `form` (öneri paneli) | YENİ-yönerge |
| 15 | Kalite skorlama & completeness | 4 | P1 | `k-computation` (derivation grafiği) | archetype-product-score (computed field) | `dashboard` (gauge/KPI kartı) | VAR/YENİ |
| 16 | Veri kalitesi politikaları | 4 | P1 | `k-policy-pdp` (policy-as-data) | archetype-data-quality-policy | `form`, `list` | VAR/YENİ |
| 17 | Publish-öncesi kalite kapısı | 4 | P1 | `k-policy-pdp` (obligation) + `k-workflow` | archetype lifecycle publish-gate | `detail` (kapı uyarısı) | VAR/YENİ |
| 18 | AI enrichment | 5 | P1 | `scale-workers` (arka plan) + `s-ai-governance` | archetype-ai-enrichment-job | `detail`, `form` (öneri paneli) | VAR/YENİ |
| 19 | AI kategorizasyon | 5 | P2 | `k-agent-runtime` + `s-ai-governance` | archetype-ai-categorization | `detail`, `list` | VAR/YENİ |
| 20 | AI çeviri (glossary+TM) | 5 | P2 | `s-ai-governance` + `k-jurisdiction` (locale) | archetype i18n-text + translation-memory | `form`, `detail` | VAR/YENİ |
| 21 | AI onay kuyruğu | 5 | P1 | `k-agent-runtime` (AI-güvenlik invariant, `approval_ref`) | archetype-ai-approval-queue | `board`, `list` (onay/red) | VAR |
| 22 | Kanal adapterleri (16 pazaryeri) | 6 | P1 | `i14y` (entegrasyon yönergesi) + `scale-workers` | archetype-channel-adapter (registry) | `dashboard` (kanal panosu), `list` | VAR/YENİ |
| 23 | Marketplace listing | 6 | P1 | `i14y` + `scale-webhook` + `l1-webhook-in` | archetype-marketplace-listing | `board`, `detail` (yayın durumu) | VAR/YENİ |
| 24 | Export profilleri & formatları | 6 | P2 | `scale-workers` + `l1-export` | archetype-export-profile | `form`, `report` | VAR/YENİ |
| 25 | MDM golden record & survivorship | 7 | P2 | `k-mdm` (golden-record + survivorship) | archetype-golden-record | `detail`, `board` (çözümleme UI) | YENİ-yönerge |
| 26 | Deduplication | 7 | P2 | `k-mdm` (dedup: exact/fuzzy/phonetic/ML) | archetype-dedup-candidate | `board`, `list` (inceleme) | YENİ-yönerge |
| 27 | Event sourcing / audit | 7 | P1 | `k-audit` (append-only) + `k-bus` (outbox/Event Bus) | archetype audit-policy bağı | `timeline`, `report` | VAR |
| 28 | DAM & S3 depolama | 8 | P1 | `k-storage` (S3/MinIO + pre-signed + CDN) | archetype-digital-asset | `detail` (medya galerisi), `data-grid` | YENİ-yönerge |
| 29 | Kanal-özel görsel varyantları | 8 | P2 | `k-storage` + `scale-workers` (batch üretim) | archetype-asset-rendition | `detail` (varyant önizleme) | YENİ-yönerge |
| 30 | Fiyat kuralları & sözleşme fiyatı | 9 | P2 | `k-computation` (fiyat derivation) + `k-actor` (segment) | archetype-price-rule (`Fieldtypes.Money`) | `form`, `detail` (kural editörü) | VAR/YENİ |
| 31 | Bundle & paketleme | 9 | P2 | `k-computation` (bundle fiyat) + `k-sequence` (paket GTIN) | archetype-bundle (slot/tier) | `form`, `detail` | YENİ-yönerge |
| 32 | Webhook + delivery engine | 10 | P2 | `l1-webhook-in` + `k-bus` (outbox) + `scale-webhook` (HMAC, circuit breaker) | archetype-webhook-configuration | `list`, `form` (webhook yönetimi) | VAR |
| 33 | GS1 / GDSN | 10 | P3 | `k-sequence` (GTIN/GLN) + `i14y` (GDSN havuzu) | archetype-gs1-packaging-hierarchy | `detail`, `form` (hiyerarşi editörü) | VAR/YENİ |
| 34 | Sektörel uyumluluk (nutrition/chemical) | 10 | P3 | `k-jurisdiction` (bölge/uyum) + `k-schema` | archetype-nutrition-facts / chemical-usage | `form`, `detail` | YENİ-yönerge |
| 35 | ERP opsiyonel entegrasyon | 10 | P3 | `i14y` (bağlayıcı adapter) + `k-bus` | archetype-source-system (ERP bağlama) | `dashboard`, `form` | VAR/YENİ |
| 36 | Fiyat pariteti & MAP | 11 | P3 | `k-computation` (parite skoru) + `scale-workers` (izleme) | archetype-price-parity (analitik) | `dashboard`, `report` | VAR/YENİ |
| 37 | Arama sıralama takibi | 11 | P3 | `scale-workers` (rank izleme) + `k-kpi-registry` | archetype-digital-shelf-snapshot | `dashboard`, `report` | VAR/YENİ |
| 38 | Rakip/pazar analizi | 11 | P3 | `scale-workers` + `k-computation` (skorlama) | archetype-competitor-analysis | `dashboard`, `report` | YENİ-yönerge |
| 39 | Baskı katalog (PDF) | 11 | P3 | `scale-workers` (PDF üretimi, batch) | archetype-print-catalog | `report` (yazdırılabilir düzen) | YENİ-yönerge |
| 40 | Marka portalı & partner submission | 12 | P3 | `k-actor` (Party/RoleBinding) + `k-policy-pdp` | archetype-partner-submission | `form`, `board` (submission inceleme) | VAR/YENİ |
| 41 | Kategori-scoped izinler | 12 | P2 | `k-policy-pdp` (ReBAC/ABAC) + `k-actor` | archetype category-permission (accessPolicy) | `detail` (izin matrisi), `form` | VAR |

## 3. Katman-bazlı kapsama analizi

Aşağıdaki üç alt-bölüm, aynı 41 özelliği katman ekseninde okur: "PIM'i inşa ederken her katmanda ne hazır, ne yazılacak?" Tablodan çıkan mühendislik sırası bu bölümde netleşir.

### 3.1 Kernel katmanı (çekirdek primitifler)

PIM domaini çekirdeğin üstüne büyük ölçüde oturur; kullanılan kernel primitiflerinin hemen tamamı repoda mevcut düğümdür (`core-contract-pack` v1/v2 + `plan-03 §3`):

- **Tam VAR ve doğrudan tüketilen:** `k-tenancy` (RLS + tenant_id — her satırın tabanı), `k-identity`+`k-authz` (JWT/RBAC), `k-schema` (ArcheType motoru + meta endpoint + ltree/tree), `k-capability` (feature flag/entitlement), `k-mode` (tenant konfigürasyon/iş-modeli), `k-computation` (fiyat/vergi/kalite derivation grafiği), `k-policy-pdp` (veri kalitesi politikası, publish kapısı, kategori-scoped izin), `k-actor` (segment/Party/RoleBinding — portal), `k-workflow` (onboarding + lifecycle), `k-audit`+`k-bus` (event sourcing + outbox), `scale-workers` (AI/enrichment/export/PDF/rank arka plan işleri), `scale-webhook`+`l1-webhook-in` (delivery engine), `k-sequence` (GTIN/GLN/paket SKU), `k-jurisdiction` (locale/çeviri/uyum), `k-kpi-registry` (dijital raf metriği), `s-ai-governance` (AI-güvenlik çatısı).
- **Kapatılacak kernel boşluğu — yalnız 3 düğüm:** **`k-storage`** (DAM/S3/MinIO + pre-signed URL + CDN — #28/#29; şu an `scale-gis`/`k-archetype-storage` benzeri bir nesne-depolama kernel düğümü yok), **`k-mdm`** (golden-record + survivorship + dedup exact/fuzzy/phonetic/ML — #25/#26; MDM için özel bir çekirdek düğümü yok), ve **`i14y`** entegrasyon yönergesi (#22/#23/#33/#35 — kanal adapter/GDSN/ERP; `l1-webhook-in`+`scale-webhook`+`scale-workers` VAR ama bunları saran normatif bir entegrasyon çatı-yönergesi henüz formelleştirilmedi).

### 3.2 Archetype katmanı (PIM yan-sözleşmeleri)

En yoğun iş bu katmandadır: PIM'in domain zenginliği (ürün grafiği, EAV, taksonomi, MDM) `archetype-uretim-spec §12` desenindeki yan-sözleşmeler olarak yazılır. Kritik gözlem: **temel field-type ve ilişki primitifleri zaten VAR** — `k-archetype-fieldtypes` (money/measure/i18n-text/geo/**attribute-set/EAV**) ve `k-schema` (`relations.tree`/effectivity/polymorphic). Bu yüzden varyant, EAV, ağaç ve taksonomi archetype'ları **sıfırdan primitif icat etmez**; mevcut tip kümesinin üstüne PIM ArcheType gövdesi + yan-sözleşme olarak eklenir (bu nedenle çoğu "YENİ-yönerge", "EKSİK" değil). Öne çıkan yeni archetype yan-sözleşmeleri: `archetype-variant-attribute-family`, `archetype-eav`, `archetype-tree-relation`, `archetype-taxonomy`, `archetype-attribute-template`, `archetype-golden-record`, `archetype-dedup-candidate`, `archetype-digital-asset`, `archetype-asset-rendition`, `archetype-bundle`, `archetype-industry-template`, `archetype-price-rule`, `archetype-nutrition-facts`, `archetype-print-catalog`. Hepsi ADMIN_FLOW + migration güvenliği + AI-güvenlik invariant'ına (AI önerir → insan onaylar) tabidir.

### 3.3 Surface katmanı (yüzey tipleri)

Surface tarafında **boşluk yoktur**: 41 özelliğin gerektirdiği her yüzey, 22-tip taksonomisinde hazırdır (`surface-v2-directive`). PIM ağırlıklı olarak **Admin-Surface** kullanır: `list`/`detail`/`form` (ürün/öznitelik CRUD), `wizard` (onboarding), `board` (AI onay kuyruğu, dedup/golden-record çözümleme, kanal yayın durumu), `dashboard` (kalite gösterge paneli — gauge/KPI kartı, kanal panosu, analitik), `report` (export, katalog, rakip analizi), `timeline` (event/audit akışı). Consumer-Surface'ten yalnız `data-grid` (EAV/varyant matris, hücre-düzenleme) devreye girer. Not: PIM analizindeki "gauge" ayrı bir tip değildir — `dashboard` tipinin bir bileşenidir (metrik/KPI kartı); kalite skoru bu yüzden `dashboard` altında projekte edilir. Tüm PIM yüzeyleri `renderStrategy: projected` ile SDUI'dan üretilebilir; marka-özel bespoke render (`custom`) PIM için gerekli değildir.

## 4. Sonuç ve boşluk özeti

Sayım (Durum sütununa göre, toplam 41): **VAR (tam kapsanan): 10** — #1 kimlik, #2 tenancy, #7 dinamik form, #8 onboarding wizard, #10 feature flags, #11 ayarlar, #21 AI onay kuyruğu, #27 event sourcing/audit, #32 webhook, #41 kategori-scoped izin (kernel + surface tam hazır, PIM yalnız tüketir). **VAR/YENİ (temel primitif VAR, üstüne PIM-özel yan-sözleşme yazılacak): 15** — #15 kalite skorlama, #16 veri kalitesi politikaları, #17 publish kapısı, #18 AI enrichment, #19 AI kategorizasyon, #20 AI çeviri, #22 kanal adapter, #23 marketplace listing, #24 export, #30 fiyat kuralı, #33 GS1/GDSN, #35 ERP, #36 fiyat pariteti, #37 arama sıralama (computation/worker/i14y/ai-governance primitifleri hazır). **YENİ-yönerge (yeni archetype veya kernel düğümü gerektiren): 16** — #3 ürün CRUD archetype, #4 varyant, #5 EAV, #6 ağaç, #9 industry template, #12 öznitelik şablonu, #13 taksonomi, #14 öznitelik önerisi, #25 MDM golden-record, #26 deduplication, #28 DAM (`k-storage`), #29 asset-rendition, #31 bundle, #34 nutrition/chemical, #38 rakip analizi, #39 print katalog, #40 marka portalı. **Saf EKSİK: 0** — her özelliğin en az bir çekirdek dayanağı var; sıfırdan-boşluk kalemi yoktur.

Mühendislik önceliği: kapatılması gereken üç gerçek kernel boşluğu **`k-storage`** (DAM/S3 — #28/#29), **`k-mdm`** (golden-record/dedup — #25/#26) ve **`i14y`** entegrasyon çatı-yönergesidir (#22/#23/#33/#35). Bu üçü dışındaki tüm YENİ-yönerge kalemleri mevcut `k-archetype-fieldtypes` (attribute-set/EAV/measure) + `k-schema` (tree) primitifleri üstüne PIM ArcheType yan-sözleşmesi olarak eklenir; yeni kernel primitifi gerektirmez.

**Tek-cümle sonuç:** PIM-v2'nin 41 özelliğinin tamamı mevcut kernel/archetype/surface çekirdeğine oturur (0 saf-EKSİK) — 10'u doğrudan VAR, 15'i mevcut primitif üstüne PIM-özel archetype yan-sözleşmesiyle (VAR/YENİ), 16'sı yeni archetype/kernel yönergesiyle karşılanır; kapatılması gereken tek gerçek kernel boşluğu üç düğümdür: `k-storage` (DAM), `k-mdm` (golden-record) ve `i14y` (kanal/ERP entegrasyon çatısı).
