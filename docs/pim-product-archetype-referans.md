# PIM Product ArcheType Referans Spesifikasyonu — Yeni Yönergeler PIM-v2'yi Karşılıyor mu?

Sürüm: 1.0 — 2026-07-01
Durum: Referans (kanıt dokümanı). Bağlayıcı sözleşme değil; **PIM-v2 gereksiniminin repo mimarisine eşlendiğini gösteren delil**.
Kaynak: `docs/reference/PIM-v2-Gereksinim-Analizi.md` (41 özellik), `docs/archetype-uretim-spec.md` §12 (v2 aileleri), `plan-03-yeni-yonergeler-2026-07-01.md` §3 (5 kernel primitifi), `src/data/archetypes/product.json`, `src/data/generated/nodes/s-pim.json`, `docs/core-contract-pack.md` v2, `docs/surface-spec.md`.

## 1. Amaç

**Bu nedir:** PIM-v2'nin Product / Variant / Family / Attribute domaininin, reponun **ArcheType çok-parçalı sözleşmesi** + yeni yönergeleriyle (variant-attribute-family grafiği, EAV/attribute-set, tree-relation, taxonomy) **nasıl ifade edileceğinin** referans tarifi.
**Ne yapar:** Her PIM domain kavramını bir yönerge/primitife bağlar; "yeni yönergeler PIM-v2 gereksinimini karşılıyor mu?" sorusuna Requirement-ID düzeyinde kanıt üretir.
**Ne yapmaz:** İmplementasyon kodu yazmaz (kod `platform` reposunda), mock veri üretmez, yeni yönerge icat etmez — mevcut yönergelerin PIM-v2'yi kapsadığını **eşleme** olarak gösterir.

Stack sınırı (mutlak): FastAPI + SQLAlchemy 2.0 + PostgreSQL / Vite + React + TanStack. **Next.js / Supabase / Prisma yasak.** Ürün verisi PIM-v2'nin kendi `products` tablosunda tutulur (virtual DocType kaldırıldı — PIM-v2 §2.1.3 kararı).

## 2. PIM domain → ArcheType/primitif eşlemesi

PIM-v2 §4 domain modeli 11 varlık grubu tanımlar. Aşağıdaki tablo çekirdek 8 kavramı **hangi yönerge/primitif** ile ifade edildiğini verir; sol taraf PIM-v2 kavramı, sağ taraf reponun karşılığıdır. Tablo, "her PIM varlığı ya bir ArcheType ya bir yan-sözleşme ya bir kernel primitifidir" ilkesini gösterir.

| PIM-v2 kavramı | Repo karşılığı | Hangi yönerge/primitif |
|---|---|---|
| Product (ana kayıt) | **Product ArcheType** (`src/data/archetypes/product.json` genişletilmiş) | `archetype-uretim-spec` §2 sözleşme ailesi |
| ProductVariant (SKU düzeyi) | Product ArcheType'ın **variant-axis** kesimi + `attribute-set` varyant grafiği | archetype-spec §12.B attribute-set/EAV |
| ProductFamily (ağaç + öznitelik şablonu) | **tree-relation** + öznitelik **miras zinciri** (family→product→variant) | archetype-spec §12.C `tree` + §12.B EAV |
| Attribute / AttributeType / Option | `attribute-set` (EAV) FieldType + `i18n-text` tipli değer | `k-archetype-fieldtypes` (§12.B), `platform_fieldtypes` §3.6 |
| Category (ağaç, ETIM/UNSPSC bağlı) | **tree-relation** (`ltree`) + ayrı taxonomy ArcheType | archetype-spec §12.C `tree`; taxonomy ayrı düğüm |
| Taxonomy / TaxonomyNode | Ayrı **Taxonomy ArcheType** (ETIM/UNSPSC/GPC) + node-başına önerilen öznitelik | archetype-spec §2 + `tree` relation |
| Brand / Manufacturer | **Party** (organization) + RoleBinding(role=manufacturer/brand) | ADR-A1 Actor/Party, `platform_actor` §3.1 |
| Channel / MarketplaceListing | **Capability**-gate'li kanal + i14y/webhook yayın | ADR-A2 Capability + `k-bus` outbox |

Not: Product ArcheType Customer/Supplier/Brand tablosu **yazmaz**; `party` + `party_role`'e referans verir (plan-03 §3.1 kuralı). Marka/üretici böylece kernel-seviyesi Party primitifinden gelir, PIM'e gömülmez.

## 3. Ürün ArcheType sözleşme şekli (alan | tip | amaç)

Aşağıdaki tablo PIM-v2 ürününün ArcheType `fields`/`fragments` şeklini verir — **alan adı + tip + amaç**, mock değer yok. Yeni FieldType'lar (§12.B) burada tip güvenli karşılık bulur; string'e sıkıştırılan PIM verisi tiplenir.

| Alan | Tip | Amaç |
|---|---|---|
| `sku` | string (unique, protected) | Kimlik; SKU düzeyi kayıt anahtarı |
| `family_id` | relation → ProductFamily | Aile-miras zincirinin köküne bağ |
| `name` | **i18n-text** | Çok-dilli ürün adı; locale→değer (§12.B, §12.E zorunlu beyan) |
| `description` | **i18n-text** | Çok-dilli açıklama; AI-enrichment çıktısı buraya iliştirilir |
| `price` | **money** | değer+kur+kesinlik+yuvarlama; float yasak (§12.B) |
| `weight` / `dimensions` | **measure** | birim+dönüşüm; kanal görsel/lojistik hesabı için (§12.B) |
| `attributes` | **attribute-set / EAV** | Runtime tanımlı, ayrı-indeksli varyant nitelikleri (renk/beden) |
| `variant_axes[]` | enum-list (max 3) | Varyant üretim eksenleri; PIM-v2 §Faz1 "max 3 seviye" |
| `category_id` | relation → Category (tree) | Taksonomi ağacına bağ; ETIM node önerisini tetikler |
| `completeness_score` | **computed** (derived) | Tamlık yüzdesi; Computation grafiğinden türetilir (§12.A.4) |
| `channel_readiness` | **computed** (derived) | Kanal-başına yayın hazırlığı; publish-öncesi kalite kapısı girdisi |
| `status` | enum + lifecycle | draft→review→published yaşam durumu (PIM-v2 completeness gate) |

Aile-miras (family inheritance): `attribute_resolver` öznitelik değerini **family → product → variant** sırasıyla çözer; alt seviye üst seviyeyi ezer. Bu bir Computation-benzeri türetmedir ama assertion değildir (§12.A.4 doğrular-vs-üretir ayrımı). i18n: `name`/`description` i18n-text; enum etiketleri (status) **alias** ile yerelleşir (§12.E) — dil eklemek veriyi değiştirmez.

## 4. Kernel primitif tüketimi

PIM ArcheType kendi başına çalışmaz; kernel primitiflerini tüketir. Tablo, hangi PIM davranışının hangi primitife dayandığını verir — bu, PIM-v2'nin NFR'lerinin (multi-tenancy, kalite kapısı, DAM, AI) primitiflerle karşılandığının kanıtıdır.

| Primitif (düğüm) | PIM'de ne sağlar | PIM-v2 karşılığı |
|---|---|---|
| **Tenant Context** (`k-tenancy`) | Satır-düzeyi izolasyon; her katalog tablosunda `tenant_id` + RLS | PIM-v2 §6 multi-tenancy (F2) |
| **PDP** (`k-policy-pdp`) | Fiyat/maliyet alanı rol-bazlı; kategori-scoped ABAC; yayın yetkisi | PIM-v2 NFR RBAC+ABAC (F41) |
| **Capability** (`k-capability`) | `pim.variant_matrix`, `enable_ai`, `enable_channels` feature-flag'leri | PIM-v2 §6 feature flags (F10) |
| **Computation** (`k-computation`) | Tamlık skoru + kanal hazırlığı + fiyat türetme (saf ifade grafiği) | PIM-v2 Faz4 quality-score (F15) |
| **Field-Types** (`k-archetype-fieldtypes`) | money/measure/i18n-text/attribute-set(EAV) tip güvenliği | PIM-v2 Faz1 EAV (F5), i18n (NFR) |
| **Storage/DAM** (`k-archetype-storage` + `file` surface) | Medya imzalı-URL; S3/MinIO; PIM dosya depolamayı yeniden yazmaz | PIM-v2 Faz8 DAM (F28) |
| **Event Bus + Outbox** (`k-bus`) | Enrichment worker + kanal yayını + webhook (async, idempotent) | PIM-v2 Faz5/6 worker (F18/F22) |
| **Search** (`k-schema` PG-FTS + ArcheType `searchIndex`) | Ürün/öznitelik arama; attribute-set ayrı indeks | PIM-v2 §3 Postgres FTS |
| **MDM/Genealogy** (`k-genealogy-graph` + Computation) | Golden record lineage; provenance; survivorship türetme | PIM-v2 Faz7 MDM (F25/F27) |

Değerlendirme: **tenant / PDP / capability / computation / field-types / storage / bus** birebir primitif karşılığı taşır. **Search / MDM** kısmî: arama ayrı primitif değil, `k-schema` + ArcheType `searchIndex` birleşimidir; MDM dedup algoritması (fuzzy/phonetic) primitifte yok, ArcheType-seviyesi Computation + Genealogy lineage ile ifade edilir (bkz. §7 boşluk).

## 5. Surface eşlemesi

PIM ekranları `surface-spec` tipleriyle projekte edilir. Tablo, PIM-v2 frontend gereksinimini (metadata-form, ağaç, tamlık rozeti, AI paneli) hangi Surface tipine bağladığını verir.

| PIM-v2 ekran gereksinimi | Surface tipi | renderStrategy |
|---|---|---|
| Metadata-driven dinamik form (sunucu şemasından) | `form` (`projected`) | SDUI; ArcheType `fields`'tan türer |
| Ürün listesi (filtre/facet/tamlık rozeti) | `list` + `storefront-plp` | projected / custom |
| Kategori & aile ağaç görünümü | `detail` + tree-widget | projected |
| Tamlık (completeness) rozeti/gauge | `dashboard` gauge + `list` badge | projected |
| Taksonomi ağaç gezgini | `detail` (tree) | projected |
| AI öneri paneli (enrichment onay/red) | `assistant` + `generative-view` | custom |
| Ürün detay (varyant seçimi, PDP) | `storefront-pdp` | custom |

AI-first yüzeyler (`assistant`, `generative-view`) **PDP-gated + insan-onaylı** olmak zorundadır (surface-spec §12): AI enrichment önerir → önizleme → insan onaylar → motor uygular. Tamlık skoru renk-bağımsız metinle de gösterilir (WCAG AA, s-pim `wcag` boyutu).

## 6. Onboarding, kanal yayını, mode eşlemesi

**12-adım onboarding → Mode-Profile + Capability:** PIM-v2 §Faz2'nin 12 adımı (company_info … summary_launch) bir kurulum akışıdır; sonucu **capability seti + mode seçimi**dir. Onboarding'in "industry template" çıktısı (fashion/food/electronics) hangi ArcheType/attribute/family/category'nin **açılacağını** belirler — bu Capability'nin `unlocks_*` alanıdır (§3.2). B2C↔B2B iş modeli seçimi Mode-Profile'a girer (§3.4); mod geçişi `preview→dry-run→approval→apply→rollback` ile veri yıkmadan olur.

**Kanal yayın → i14y/webhook:** Ürün-yayınlandı olayı `k-bus` outbox'ına yazılır; channel-hub tüketir (s-pim `integration` boyutu). Webhook teslimi HMAC-imzalı, circuit-breaker'lı, idempotent (PIM-v2 Faz10 F32). Kanal capability kapalıysa yayın yolu **hiç sunulmaz** (capability 404).

## 7. Kapsama boşluğu (hâlâ eksik)

Dürüst değerlendirme: aşağıdakiler yönergelerle **tam** karşılanmıyor, ArcheType-seviyesi ek iş veya yeni primitif gerektiriyor.

- **MDM dedup algoritması** (exact/fuzzy Levenshtein-JaroWinkler/phonetic/ML): Genealogy lineage + Computation *türetmeyi* verir ama benzerlik-skorlama algoritması bir kernel primitifi değil; PIM ArcheType servis-seviyesi (`merge_survive` portu) olarak kalır. Boşluk: skorlama saf-ifade-grafiğine sığmaz (ML), Computation §12.A.4 "serbest kod yok" ilkesiyle gerilimde.
- **Kanal-özel görsel varyant üretimi** (30+ pazaryeri, PIL resize/crop): Storage primitifi depolamayı verir; varyant *üretim* pipeline'ı worker (`k-bus`) + ArcheType typed-action'dır, primitif değil.
- **Arama ölçeği**: PG-FTS Faz1 için yeterli; OpenSearch'e geçiş primitif sözleşmesinde yok (PIM-v2 §10 kapsam-dışı ile uyumlu).
- **Print katalog / analitik** (fiyat pariteti, rank tracking): Bunlar PIM-v2 P3; ArcheType + Surface `report`/`dashboard` ile ifade edilebilir ama özel primitif yoktur.

## 8. Requirement-ID kapsama tablosu

Aşağıdaki tablo PIM-v2 §8 özellik matrisindeki 41 özelliği (F1–F41) yönerge karşılığına eşler. "Kapsam" sütunu: **Tam** = birebir primitif/yönerge; **Kısmî** = ArcheType-seviyesi ek iş gerekir; **Yeni-primitif** = bugün eksik.

| ID | Özellik | Kapsam | Yönerge/primitif |
|---|---|---|---|
| F1 | Kimlik doğrulama (JWT+RBAC) | Tam | core-pack §2.2 Identity |
| F2 | Multi-tenant izolasyon (RLS) | Tam | `k-tenancy`, core-pack §2.1 |
| F3 | Ürün CRUD + liste/filtre | Tam | Product ArcheType + `list` surface |
| F4 | Varyant yönetimi (çok seviyeli) | Tam | attribute-set + variant-axis (§12.B) |
| F5 | EAV öznitelik sistemi | Tam | `k-archetype-fieldtypes` attribute-set |
| F6 | Kategori & aile ağaçları | Tam | tree-relation (§12.C) |
| F7 | Metadata-driven dinamik form | Tam | `form` surface SDUI |
| F8 | 12 adımlı onboarding wizard | Tam | `wizard` surface + Mode-Profile |
| F9 | Industry template motoru | Tam | Capability `unlocks_*` (§3.2) |
| F10 | Feature flags (tenant) | Tam | `k-capability` |
| F11 | Ayarlar/konfigürasyon | Tam | Mode-Profile + tenant config |
| F12 | Öznitelik şablonları | Tam | AttributeTemplate ArcheType |
| F13 | Taksonomi (ETIM/UNSPSC/GPC) | Tam | Taxonomy ArcheType + tree |
| F14 | Öznitelik önerisi | Kısmî | AI enrichment (öneri→onay) |
| F15 | Kalite skorlama & completeness | Tam | `k-computation` derived field |
| F16 | Veri kalitesi politikaları | Tam | PDP policy-as-data (§3.3) |
| F17 | Publish-öncesi kalite kapısı | Tam | Computation + ECA (s-pim ecaRules) |
| F18 | AI enrichment | Tam | AI-policy draft + `k-bus` worker |
| F19 | AI kategorizasyon | Kısmî | AI öneri + Taxonomy; güven-skoru servis |
| F20 | AI çeviri (glossary+TM) | Kısmî | i18n-text + AI öneri; TM servis-seviyesi |
| F21 | AI onay kuyruğu | Tam | ADMIN_FLOW approval_ref (§3.0.1) |
| F22 | Kanal adapterleri (16 pazaryeri) | Kısmî | Capability-gate + `k-bus`; adapter servis |
| F23 | Marketplace listing | Tam | ProductChannel ArcheType |
| F24 | Export profilleri & formatları | Kısmî | typed-action; format kodu servis |
| F25 | MDM golden record & survivorship | Kısmî | Genealogy + Computation türetme |
| F26 | Deduplication | Yeni-primitif | fuzzy/phonetic skorlama primitifte yok |
| F27 | Event sourcing / audit | Tam | core-pack §2.5 audit (immutable) |
| F28 | DAM & S3 depolama | Tam | `k-archetype-storage` + file surface |
| F29 | Kanal-özel görsel varyantları | Kısmî | Storage + worker; PIL pipeline servis |
| F30 | Fiyat kuralları & sözleşme fiyatı | Tam | Computation (pricing) + money type |
| F31 | Bundle & paketleme | Tam | Bundle ArcheType + relation |
| F32 | Webhook + delivery engine | Tam | `k-bus` outbox + HMAC + circuit-breaker |
| F33 | GS1 / GDSN | Kısmî | ArcheType + measure; GDSN adapter servis |
| F34 | Sektörel uyumluluk (nutrition/chemical) | Tam | Fragment + validation/semantic rule |
| F35 | ERP opsiyonel entegrasyon | Tam | `k-bus` adapter (opsiyonel bağlayıcı) |
| F36 | Fiyat pariteti & MAP | Kısmî | Computation + `dashboard`; parite servis |
| F37 | Arama sıralama takibi | Kısmî | `report` surface; rank-tracker servis |
| F38 | Rakip/pazar analizi | Kısmî | ArcheType + `dashboard`; analitik servis |
| F39 | Baskı katalog (PDF) | Kısmî | typed-action; PDF render servis |
| F40 | Marka portalı & partner submission | Tam | Party + PDP + Workflow |
| F41 | Kategori-scoped izinler | Tam | PDP ABAC (kategori-scoped) |

## 9. Sonuç — PIM-v2 41 özelliğinden kaçı ifade edilebiliyor

41 özelliğin **26'sı Tam** (birebir primitif/yönerge karşılığı), **14'ü Kısmî** (ArcheType/Surface iskeleti yönergelerle kurulur; iş-özel algoritma servis-seviyesi kod olarak yaşar — bu beklenen; primitif *sözleşme* verir, *algoritma* değil), **1'i (F26 deduplication) yeni primitif** gerektirir (fuzzy/phonetic/ML skorlama saf-ifade-grafiğine sığmaz). Yani **40/41 özellik mevcut yönergelerle ifade edilebilir** (26 tam + 14 iskelet-tam); yalnız MDM benzerlik-skorlama motoru yeni bir sözleşme (ör. `k-similarity`) veya Computation'ın "serbest kod yok" ilkesine denetlenebilir bir ML-istisnası ister. Kritik PIM çekirdeği (Product/Variant/Family/Attribute/Category/Taxonomy — F1–F13) **tamamen** karşılanır.

AI-güvenlik invariantı bu spec'in her satırında korunur: AI ürün açıklaması/öznitelik/taksonomi **önerir**, insan onaylar, motor uygular; geçmiş üretim/fiyat transaction'ı immutable; kanal yayınını her zaman insan onaylar (s-pim `aiAgents` boyutu + product.json `aiPolicy`).
