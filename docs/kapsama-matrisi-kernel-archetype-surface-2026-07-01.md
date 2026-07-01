# Kapsama Matrisi — Numeronym Standartları + PIM-v2 Özellikleri × Kernel / ArcheType / Surface Yönergeleri

Sürüm: 1.0 — 2026-07-01
Durum: AI-DRAFT (insan onayı bekler). Kapsam analizi; kod yazmaz, yalnız matris + boşluk teşhisi.
Amaç: Tek soruyu cevaplamak — "numeronym standartları ve PIM-v2 özellikleri, kernel / archetype / surface YÖNERGELERİNDE doğru yerde tanımlı mı?"
Kaynaklar: `docs/standards/numeronym-siniflandirma.md`, `docs/standards/00-standards-index.md`, `docs/core-contract-pack.md` (v1 §2 + v2 §3), `docs/archetype-uretim-spec.md` (§12), `docs/surface-v2-directive.md`, `plan-03-yeni-yonergeler-2026-07-01.md` §3-5, `docs/reference/PIM-v2-Gereksinim-Analizi.md` (§4 domain, §5 NFR, §8 41-özellik matrisi).

Okuma kuralı: her tabloda "Durum" sütunu üç değer alır — **VAR** (yönergede birinci-sınıf tanımlı), **KISMİ** (bir yönerge onu ima eder/kapsar ama ayrı sözleşme yoktur ya da yalnız bir katmanda vardır), **EKSİK** (hiçbir yönergede birinci-sınıf tanımlı değil). Üç katman: KERNEL = `core-contract-pack` primitifleri + `k-*` WBS düğümleri; ARCHETYPE = `archetype-uretim-spec` sözleşme aileleri; SURFACE = `surface-v2-directive` tip/blok kataloğu.

---

## Bölüm 0 — Yöntem ve Kapsam Sınırı (1 cümle)

Bu doküman "sözleşme var mı" sorusunu sorar, "kod var mı" sorusunu değil; hepsi `actionplan/` planlama katmanındadır ve gerçek implementasyon `platform/` reposunda ayrıca yazılacaktır.

İş modelleri (B2B/B2C/C2C/B2G/M2M/S2S/D2D) bilinçli olarak standart değildir; `numeronym-siniflandirma.md` §1'in en kritik ayrımına göre bunlar Mode-Profile **capability**'sidir (ürünün açıp kapatabildiği iş-modeli yeteneği). Bu yüzden aşağıda ayrı bir alt-bölümde (§1.1) capability olarak listelenir, standart tablosuna karıştırılmaz.

---

## Bölüm 1 — Numeronym Standartları × 3 Katman

Aşağıdaki tablo `numeronym-siniflandirma.md` §2'deki her standardı üç katmanın **yönergesine** eşler: her hücre "hangi primitif / hangi doküman onu tanımlıyor" sorusunu cevaplar. Standart bir katmanda anlamlı değilse (ör. o11y'nin doğrudan Surface karşılığı sınırlıdır) hücre "—" veya kapsamı belirtir. Durum sütunu üç katmanın bileşimine bakar: standart *bir yerde* tam tanımlıysa ve gereken her katmanda karşılığı varsa VAR; kritik bir katman boşsa KISMİ.

| Standart (numeronym) | KERNEL yönergesi (primitif/doküman) | ARCHETYPE yönergesi | SURFACE yönergesi | Durum |
|---|---|---|---|---|
| **i18n** (internationalization) | `platform_fieldtypes.I18nText` (v2 §3.6) + `platform_jurisdiction.locale` (§3.15); `i18n-standards.json` | §12.B `i18n-text` FieldType + §12.E i18n zorunluluğu beyanı + enum alias | `surface.i18n{locales,defaultLocale,rtl,messagesRef}` (§9) | VAR |
| **l10n** (localization) | `platform_jurisdiction` locale/currency/tax/timezone ortogonal eksenleri (§3.15); `i18n-standards` kapsar | §12.B `i18n-text` + §12.E enum alias (dil eklemek veriyi değiştirmez) | `i18n.rtl` + CLDR tarih/para/sayı biçimi (§9) | VAR |
| **g11n** (globalization) | `platform_jurisdiction` altı ortogonal eksen (locale≠jurisdiction≠currency≠tax≠tz≠residency) (§3.15); `g11n.json` | §12.B/§12.E i18n + money/measure FieldType (currency/unit ayrı) | `i18n` bloğu + `perf.renderMode` (bölge-farkında SSR) | VAR |
| **a11y** (accessibility) | `dimensions.wcag` + `a11y.json`; v1 §3.4 (44px hedef, 4.5:1 kontrast, focus-visible) | (ArcheType a11y taşımaz; Surface'e devreder) | `surface.a11y.wcag=2.2-AA` + `wcagAspirational` + §8 HMI ergonomisi + WebGL/WebRTC erişilebilir eşdeğer | VAR |
| **o11y** (observability) | v1 §2.9 `platform_observability` (structlog + OTel + Prometheus, trace_id/tenant_id zorunlu); `observability.json` | ArcheType `audit policy` parçası (§2) → v1 §2.5 audit_log'a bağlanır | `perf.cwvBudget` (frontend RUM/CWV ölçümü) + §11 test-4 | VAR |
| **authn** (authentication) | v1 §2.2 Identity/AuthZ (JWT RS256, refresh rotation); `enterprise-dod` | ArcheType `permissions` parçası (§2); Party kimliği doğrulamaz, modeller (§12.A.1) | `aiSurface.pdpGated` (yetkisiz veri gösterilmez) | VAR |
| **authz** (authorization) | `platform_pdp` (v2 §3.3, policy-as-data) + v1 §2.2 RequirePermission; `authz-rbac-abac.json` | ArcheType `permissions` + `ReBAC/ABAC policies` parçaları (§2); `accessPolicy` → PDP girdisi | `permissions` alanı (custom yüzeyde de zorunlu, §5) | VAR |
| **rbac** (role-based access control) | v1 §2.2 RBAC (rol→izin, Redis cache); `authz-rbac-abac.json`; WBS `k-policy-pdp` | ArcheType `permissions` rol atıfları; `k-party` RoleBinding rol→PDP girdisi | (yüzey rol-bazlı gösterir; PDP'ye devreder) | VAR |
| **abac** (attribute-based access control) | `platform_pdp` attribute/condition ifadesi (§3.3); `dimensions.security`; `authz-rbac-abac.json` | ArcheType `ReBAC/ABAC policies` parçası (§2, §12.A.1 ReBAC) | (PDP kararına devreder) | VAR |
| **iam** (identity & access management) | v1 §2.2 + `platform_actor` Party/RoleBinding (§3.1) + `platform_pdp`; WBS 13.5 `s-iam`, `k-party` | §12.A.1 Actor/Party yan-sözleşmesi (kim + bağlam + rol + zaman) | (yüzey kapsamı dışı; kimlik context provider) | VAR |
| **sso** (single sign-on) | `sso.json` + `oidc.json` (00-index §3, standart 08 + oidc); v1 §2.2 üstünde IdP entegrasyonu | (ArcheType kapsamı dışı — kimlik altyapısı) | (yüzey redirect/callback akışı; ayrı yönerge yok) | KISMİ |
| **mfa** (multi-factor authentication) | `mfa.json` (00-index §3, standart 09); v1 §2.2 üstünde TOTP/WebAuthn | (ArcheType kapsamı dışı) | (MFA challenge UI; Surface tipi/blok yok) | KISMİ |
| **c13n** (canonicalization) | `c13n.json` (00-index §3, standart 02); v1 §2.8 migration + normalize service | §12.B FieldType doğrulama davranışı (money/measure canonical dönüşüm) kısmen | (yüzey input mask/normalize; ayrı blok yok) | KISMİ |
| **n6n** (normalization) | `data-normalization.json` (00-index §3, standart 03); 3NF + unique constraint | ArcheType `validation rules` + `fields` tip kısıtları (§2) | (form validation zod; devreder) | KISMİ |
| **d10n** (denormalization) | `data-normalization.json` içinde (00-index §3, standart 04); read-model projeksiyon | (ArcheType ayrı beyan etmez) | `surface.renderStrategy=projected` (veriden read-model türetme) yakın karşılık | KISMİ |
| **i14y** (interoperability) | `i14y.json` (00-index §3, standart 05); OpenAPI-first + webhook + idempotency; v1 §2.3 outbox | (ArcheType `external ruleset bindings` + typed actions kısmen) | (yüzey typed SDK client; devreder) | KISMİ |
| **c12n** (customization) | `c12n.json` (00-index §3, standart 06); `platform_capability` (§3.2) tenant feature-gate | §12.A.2 Capability yan-sözleşmesi (feature-gate + lisans) | (yüzey tema token + feature-flag render; capability-gate) | VAR |
| **p13n** (personalization) | `p13n.json` (00-index §3, standart 07); per-user preference (kernel primitifi ayrı yok) | (ArcheType kapsamı dışı) | (yüzey saved views/dashboard; Surface bloğu yok) | KISMİ |
| **e2ee** (end-to-end encryption) | `edge-security.json` içinde (00-index §3, standart 10); envelope encryption (ayrı primitif yok) | ArcheType `data retention policy` + PII alan işaretleme (§9 Customer) kısmen | (client-side crypto; Surface kapsamı dışı) | KISMİ |
| **iac** (infrastructure as code) | `iac.json` (00-index §3, standart 12); Docker Compose + env-validation; v1 §3.7 deploy | (ArcheType kapsamı dışı — altyapı) | (yüzey kapsamı dışı) | VAR |
| **edge-security** (WAF/DDoS/CDN/DNS) | `edge-security.json` (00-index §3, standart 13); rate-limit + WAF-ready log; v1 §3.6 OWASP | §3.7 `scale_invariant` tenant-rate-limit (bir kısmı) | `perf.cachePolicy` (edge-cache/CDN invalidation) | VAR |
| **CI/CD** (continuous integration/delivery) | `quality-gates` + `release-versioning`; v1 §3.5 test piramidi + §3.7 deploy; `check-*` kapıları | ArcheType `conformance tests` parçası (§2, CI-bloklayıcı) | `check-surface` CI kapısı (§14) | VAR |

Not (KISMİ standartlar): SSO/MFA/OIDC/c13n/n6n/d10n/i14y/p13n/e2ee'nin "makine-sözleşmesi" 00-index §3'e göre VAR (`*.json`), ama **archetype/surface YÖNERGELERİNDE ayrı sözleşme parçası olarak zayıf/yok**. Bu dokümanın sorusu "yönergede doğru yerde mi" olduğundan bunlar KISMİ işaretlidir: kernel/standart katmanında tanımlı, ama archetype/surface projeksiyonu eksik. Bu bilinçli bir tasarım tercihi olabilir (kimlik/altyapı standartları archetype gövdesine girmez) — teşhis, boşluk değil "katman-uyumsuzluğu" işaretidir.

### 1.1 İş Modelleri — Capability (Standart DEĞİL, Ayrı Belirtildi)

Aşağıdakiler `numeronym-siniflandirma.md` §1 gereği standart değil, Mode-Profile capability'sidir; standart tablosundan ayrı tutulmuştur. Kernel'de `platform_mode_profile` (v2 §3.4) + `k-mode` (plan-03 §3.3) tam tanımlıdır; archetype'ta §12.A.3 Mode-Profile yan-sözleşmesi vardır; surface `renderStrategy` + config-driven okuma ile mod-farkındadır (kodda `if b2b else` yasak, §13 anti-pattern).

| Capability (iş modeli) | KERNEL | ARCHETYPE | SURFACE | Durum |
|---|---|---|---|---|
| B2B / B2C / C2C / B2G / D2C / hybrid | `platform_mode_profile` (§3.4) + `k-mode` (dependsOn: k-capability, k-party, k-policy-pdp) | §12.A.3 Mode-Profile (runtime recomposition, veri yıkmadan) | `business_model_config` okuyan mode-aware surface; `if b2b else` yasak | VAR (capability) |
| M2M / S2S / D2D | `platform_capability` (§3.2) service credential/scope kapsamı | §12.A.2 Capability yan-sözleşmesi (feature-gate) | (yüzey yok; makine-akışı) | KISMİ (capability) |

---

## Bölüm 2 — PIM-v2 41-Özellik × 3 Katman

Aşağıdaki tablo `PIM-v2-Gereksinim-Analizi.md` §8'in 41 özelliğini üç katmanın yönergesine eşler: her özellik hangi kernel primitifine, hangi archetype yönergesine, hangi surface tipine dayanır. "Surface tipi" `surface-v2-directive.md` §4 kataloğundan seçilir. Durum sütunu: özelliği üretmek için gereken *yönerge zemini* üç katmanda da varsa VAR; bir katmanda (özellikle archetype veri-modeli veya kernel primitifi) boşluk varsa KISMİ; hiçbir yönergede zemin yoksa EKSİK.

| # | PIM-v2 Özelliği (Faz/Öncelik) | KERNEL primitifi | ARCHETYPE yönergesi | SURFACE tipi | Durum |
|---|---|---|---|---|---|
| 1 | Kimlik doğrulama JWT+refresh, RBAC (F0/P0) | v1 §2.2 Identity/AuthZ; `authn`/`rbac` | ArcheType `permissions` | `form` (login) | VAR |
| 2 | Multi-tenant izolasyon RLS+tenant_id (F0/P0) | v1 §2.1 Tenant Context (fail-closed, RLS) | ArcheType `tenant isolation policy` (§2) | — (yatay) | VAR |
| 3 | Ürün CRUD + liste/filtre/arama (F1/P0) | `k-schema` + v1 §2.10 Module SDK | Product ArcheType (§9 fixture) | `list` + `detail` + `form` | VAR |
| 4 | Varyant yönetimi (çok seviyeli) (F1/P0) | (variant/attribute-family primitifi yok) | §12.B `attribute-set/EAV` (Akeneo aile/varyant grafiği ima) — **ayrı variant-family sözleşmesi yok** | `data-grid` + `detail` | KISMİ |
| 5 | EAV öznitelik sistemi (F1/P0) | `platform_fieldtypes.AttributeSet` (§3.6) | §12.B `attribute-set/EAV` FieldType (runtime + ayrı indeks) | `form` (dinamik) + `data-grid` | KISMİ |
| 6 | Kategori & aile ağaçları (F1/P0) | (tree-relation kernel primitifi yok; Postgres `ltree` ima) | §12.C `tree` (recursive relation) + `polymorphic` | `list` (ağaç) + `detail` | KISMİ |
| 7 | Metadata-driven dinamik form motoru (F1/P0) | — (surface projeksiyon runtime) | ArcheType `fields` + `fragments` → form projeksiyonu | `form` (`renderStrategy=projected`) | VAR |
| 8 | 12 adımlı onboarding wizard (F2/P0) | v1 §2.7 Workflow Registry | ArcheType `lifecycle` + `linked workflows` | `wizard` | VAR |
| 9 | Industry template motoru (F2/P1) | `platform_capability` (§3.2) capability-gate | §12.A.2 Capability + ArcheType `fragments` (şablon) | `wizard` + `form` | KISMİ |
| 10 | Feature flags (tenant) (F2/P1) | `platform_capability` (§3.2) entitlement | §12.A.2 Capability/Entitlement yan-sözleşmesi | — (config) | VAR |
| 11 | Ayarlar / konfigürasyon (F2/P1) | v1 §2.6 Archetype Registry + TenantConfig | ArcheType `identity/meta` | `form` + `detail` | VAR |
| 12 | Öznitelik şablonları (F3/P1) | `platform_fieldtypes.AttributeSet` | §12.B attribute-set + §12.E enum alias; **AttributeTemplate ayrı ArcheType yönergesi yok** | `form` + `data-grid` | KISMİ |
| 13 | Taksonomi (ETIM/UNSPSC/GPC) (F3/P1) | (taxonomy kernel primitifi yok) | §12.C `tree`; **ETIM/UNSPSC taxonomy sözleşmesi (standart taksonomi import/eşleme) yok** | `list` (ağaç) + `detail` | EKSİK |
| 14 | Öznitelik önerisi (AI) (F3/P2) | AI guardrail (draft→onay); `platform_computation` değil | ArcheType `AI policy` + §12 AI-invariant (öneri→onay) | `aiSurface.kind=assistant` + `form` | KISMİ |
| 15 | Kalite skorlama & completeness (F4/P1) | (completeness/scoring primitifi yok; `platform_computation` türetme kısmen) | ArcheType `semantic rules` + `validation rules`; **completeness-score sözleşmesi ayrı değil** | `dashboard` + `report` | KISMİ |
| 16 | Veri kalitesi politikaları (F4/P1) | (DataQualityPolicy primitifi yok); `c13n`/`n6n` standardı kısmen | ArcheType `validation rules` + `semantic rules` (§2) | `form` (policy editor) | KISMİ |
| 17 | Publish-öncesi kalite kapısı (F4/P1) | v1 §2.7 Workflow (gate) + `scale_invariant` desen | ArcheType `lifecycle` + `conformance tests` (§2) | `wizard` (publish flow) | KISMİ |
| 18 | AI enrichment (F5/P1) | v1 §2.4 ECA Runtime + AI guardrail; `k-worker` (task-queue) **primitif yok** | ArcheType `AI policy` + `ECA bindings` (§2) | `aiSurface.kind=generative-view` | KISMİ |
| 19 | AI kategorizasyon (F5/P2) | AI guardrail + (taxonomy hedefi eksik, bkz. #13) | ArcheType `AI policy` + §12.C tree | `aiSurface` + `list` | KISMİ |
| 20 | AI çeviri (glossary+TM) (F5/P2) | i18n/l10n standardı + AI guardrail | §12.B `i18n-text` + §12.E; ArcheType `AI policy` | `aiSurface` + `form` | KISMİ |
| 21 | AI onay kuyruğu (F5/P1) | v2 AI-güvenlik invariantı (§3.0.1, approval_ref); `k-worker` **yok** | §12 AI-invariant (AIApprovalQueue) — ArcheType `AI policy` | `board` (approval queue) | KISMİ |
| 22 | Kanal adapterleri (16 pazaryeri) (F6/P1) | `i14y.json` (webhook/idempotency); v1 §2.3 outbox; `k-worker` **yok** | ArcheType `external ruleset bindings` (kanal) | `list` + `detail` (channel config) | KISMİ |
| 23 | Marketplace listing (F6/P1) | `i14y` + v1 §2.3 event bus | Product ArcheType `linked` (MarketplaceListing) | `list` + `form` | KISMİ |
| 24 | Export profilleri & formatları (F6/P2) | `i14y` (typed export); `k-worker` **yok** | ArcheType `typed actions` (export) | `report` + `form` | KISMİ |
| 25 | MDM golden record & survivorship (F7/P2) | **k-mdm (golden-record/survivorship/provenance) primitifi YOK** | **golden-record/survivorship ArcheType yönergesi YOK** | `detail` + `board` (resolve) | EKSİK |
| 26 | Deduplication (F7/P2) | **k-mdm dedup (exact/fuzzy/phonetic) primitifi YOK**; `c13n` canonical_key kısmen | ArcheType `search/index rules` kısmen; dedup sözleşmesi yok | `board` (dedup review) | EKSİK |
| 27 | Event sourcing / audit (F7/P1) | v1 §2.5 Audit Log (append-only) + §2.3 outbox | ArcheType `audit policy` parçası (§2) | `timeline` | VAR |
| 28 | DAM & S3 depolama (F8/P1) | **k-storage (DAM/object-storage/rendition) primitifi YOK** (v1 sadece Celery mention) | **DigitalAsset/rendition ArcheType yönergesi YOK**; §12.B `geo` var ama medya-asset tipi yok | `data-grid` + `detail` (media gallery) | EKSİK |
| 29 | Kanal-özel görsel varyantları (F8/P2) | **k-storage image-variant + k-worker (async batch) YOK** | (AssetRendition ArcheType yönergesi yok) | `data-grid` (variant preview) | EKSİK |
| 30 | Fiyat kuralları & sözleşme fiyatı (F9/P2) | `platform_computation` (§3.5, pricing graph) + `Money` FieldType | §12.A.4 Computation + §12.B money; ContractPrice ArcheType | `form` (rule editor) + `data-grid` | VAR |
| 31 | Bundle & paketleme (F9/P2) | `platform_computation` (bundle fiyat) + §12.C tree | §12.C `tree`/`polymorphic` (bundle slot); Bundle ArcheType | `detail` + `form` | KISMİ |
| 32 | Webhook + delivery engine (F10/P2) | `i14y.json` (webhook, HMAC, retry, circuit breaker); v1 §2.3 outbox | ArcheType `external ruleset bindings` + `ECA bindings` | `list` + `detail` (webhook mgmt) | VAR |
| 33 | GS1 / GDSN (F10/P3) | `platform_sequence` (GTIN/GLN gap-free kısmen); genel taksonomi/standart-şema yok | ArcheType `validation rules` (GTIN); GS1PackagingHierarchy §12.C tree | `form` + `detail` | KISMİ |
| 34 | Sektörel uyumluluk (nutrition/chemical) (F10/P3) | (compliance-attribute primitifi yok); `platform_jurisdiction` (§3.15) tax/residency kısmen | ArcheType `fields` + `validation rules` (NutritionFacts/allergen) | `form` + `detail` | KISMİ |
| 35 | ERP opsiyonel entegrasyon (F10/P3) | `i14y` + v1 §2.3 event bus | ArcheType `external ruleset bindings` | `list` + `detail` | KISMİ |
| 36 | Fiyat pariteti & MAP (F11/P3) | `platform_computation` + (rakip-veri toplama/worker eksik) | §12.A.4 Computation (parite hesabı) | `dashboard` + `report` | KISMİ |
| 37 | Arama sıralama takibi (F11/P3) | **k-search (arama/index) primitifi YOK** (Postgres FTS/OpenSearch ima) | ArcheType `search/index rules` parçası (§2) — motor yok | `dashboard` + `report` | KISMİ |
| 38 | Rakip/pazar analizi (F11/P3) | (rakip-veri toplama primitifi yok); `k-worker` **yok** | ArcheType `AI policy` (analiz) kısmen | `dashboard` + `report` | KISMİ |
| 39 | Baskı katalog (PDF) (F11/P3) | (doküman/print render primitifi yok); `k-worker` **yok** | ArcheType `typed actions` (export) | (Surface: doküman/print tipi YOK — surface-v2 §3 non-goal) | EKSİK |
| 40 | Marka portalı & partner submission (F12/P3) | `platform_actor` (§3.1, external party) + `platform_capability` | §12.A.1 Actor/Party (BrandPortalUser) + §12.A.2 Capability | `form` + `list` (portal) | KISMİ |
| 41 | Kategori-scoped izinler (F12/P2) | `platform_pdp` (§3.3, ABAC condition) | ArcheType `ReBAC/ABAC policies` (§2, kategori-scope) | (PDP'ye devreder) + `list` | VAR |

Not (arama, #3 vs #37): Ürün liste/filtre/arama (#3) Postgres FTS ile v1 zemininde "VAR" sayılır (basit arama), ama gelişmiş arama-sıralama-takibi ve ölçekli index (#37) için ayrı bir `k-search` primitifi yoktur — ArcheType `search/index rules` **parçası** kuralı beyan eder ama onu çalıştıracak kernel motoru yönergede tanımlı değildir. Bu yüzden #37 KISMİ.

Not (worker teması): #18, #21, #22, #24, #29, #36, #38, #39 hepsi arka-plan işine (AI enrichment, batch variant, sync, export, dedup scan) dayanır. `core-contract-pack` v1 §2.3'te "arka plan worker outbox'ı okur" cümlesi ve §1'de "Celery task'ları" **ima** vardır, ama `k-worker` / task-queue **birinci-sınıf primitif sözleşmesi değildir** (idempotency/retry/DLQ/cost-limit invariantı olan bir primitif yoktur). Bu, tek başına özellikleri EKSİK yapmaz (çoğu KISMİ) ama tekrar eden bir boşluktur; bkz. §3.

---

## Bölüm 3 — EKSİK Listesi + Doldurma Planı

Aşağıdaki tablo yalnız **EKSİK** ve **tekrar-eden KISMİ** boşlukları toplar ve her birini kapatacak yeni yönergeye bağlar. Kolon anlamı: "Boşluk" = ne eksik; "Katman" = hangi katmanda; "Kapatan yeni yönerge" = önerilen doküman + WBS düğümü; "Kapsadığı PIM özellikleri" = bu boşluğun bloke ettiği §8 satırları. Her yeni yönerge mevcut deseni izler (normatif başlık → tanım/jargon → sözleşme şekli → WBS yerleşimi → AI guardrail → test → DoD), plan-03 §6 ile aynı.

### 3.1 KERNEL boşlukları (yeni `k-*` primitifleri)

| Boşluk | Kapatan yeni yönerge (doküman + WBS düğüm) | Kapsadığı PIM özellikleri | Öncelik |
|---|---|---|---|
| **k-storage (DAM / object-storage)** — S3/MinIO köprüsü, pre-signed URL, EXIF/IPTC/XMP metadata, AssetRendition, image-variant (30+ pazaryeri spec) | `docs/adr-K2-storage-dam.md` + `docs/storage-dam-contract.md`; WBS `k-storage` (dependsOn: k-schema, k-tenancy) | 28, 29 (+ medya-bağımlı 3, 23) | P1 |
| **k-worker (task-queue / job runtime)** — Celery/ARQ soyutlaması, idempotent job, retry+backoff, dead-letter queue, cost/abuse limit, schedule | `docs/adr-K3-worker.md` + `docs/worker-taskqueue-contract.md`; WBS `k-worker` (dependsOn: k-schema, v1 §2.3 outbox) | 18, 21, 22, 24, 29, 36, 38, 39 | P1 |
| **k-search (arama / index runtime)** — Postgres FTS → OpenSearch köprüsü, index tanımı, facet, sıralama/relevance, EAV-farkında index; ArcheType `search/index rules`'u **çalıştıran** motor | `docs/adr-K4-search.md` + `docs/search-index-contract.md`; WBS `k-search` (dependsOn: k-schema) | 3 (gelişmiş), 37 (+ EAV filtre 5) | P1 |
| **k-mdm (master data / golden-record)** — golden-record, survivorship rule, alan-düzeyi provenance, dedup (exact/fuzzy Levenshtein-JaroWinkler/phonetic/ML), merge audit trail, SourceSystem/DataSteward | `docs/adr-K5-mdm.md` + `docs/mdm-golden-record-contract.md`; WBS `k-mdm` (dependsOn: k-schema, k-computation, v1 §2.5 audit) | 25, 26 (+ kalite 15, 16) | P2 |

### 3.2 ARCHETYPE boşlukları (yeni sözleşme aileleri / §12 genişletmesi)

| Boşluk | Kapatan yeni yönerge (§12 genişletme) | Kapsadığı PIM özellikleri | Öncelik |
|---|---|---|---|
| **variant / attribute-family sözleşmesi** — aile→varyant grafiği (Akeneo-sınıfı); §12.B EAV FieldType'ı *ima* eder ama aile/varyant/matris ayrı yan-sözleşme değil; variant-eksen, varyant-matris, aile-attribute kalıtımı | `archetype-uretim-spec §12.G Variant/Attribute-Family` (yeni alt-bölüm) + `docs/archetype-variant-family-contract.md` | 4, 5 (matris), 12 | P0 (PIM MVP çekirdeği) |
| **EAV attribute-set birinci-sınıf sözleşme** — §12.B FieldType olarak var, ama attribute definition/group/option/type + AttributeTemplate ayrı ArcheType-parçası olarak yönerge zayıf | Yukarıdaki §12.G ile birleşik (attribute-set + template) | 5, 12 | P0 |
| **tree-relation (ağaç) olgunlaştırma** — §12.C `tree` var (recursive relation) ama kategori/taksonomi ağacı için derinlik-sorgu, materialized-path/ltree, taşıma/yeniden-ebeveynleme, döngü-tespiti ayrı beyan yok | `archetype-uretim-spec §12.C` genişletme (tree operasyon sözleşmesi) + k-search index bağı | 6, 13, 31 (bundle), 33 (GS1 hiyerarşi) | P1 |
| **taxonomy (ETIM/UNSPSC/GPC) sözleşmesi** — standart taksonomi *import*, dış-kod↔iç-kategori eşleme, sürüm (ETIM 8/9), çok-şema (ETIM+UNSPSC birlikte) | `archetype-uretim-spec §12.H Taxonomy` (yeni) + `docs/archetype-taxonomy-contract.md` | 13, 19 (AI kategorizasyon), 33 | P1 |

### 3.3 SURFACE boşlukları

| Boşluk | Kapatan yeni yönerge | Kapsadığı PIM özellikleri | Öncelik |
|---|---|---|---|
| **doküman / print (PDF) + e-posta-HTML yüzey tipi** — `surface-v2 §3` bunu açıkça **non-goal** bırakmış (açık soru, §14 risk); baskı-katalog ve compliance-export için yüzey tipi yok | `surface-v2-directive §16 Document/Print Surface` (yeni tip: `document`/`print`) — plan-03 §4 açık-soru kapatma | 39 (+ export 24, 34 uyumluluk export) | P2 |
| **AI-surface tipleri PIM'e bağlama** — `aiSurface` bloğu VAR ama PIM'in AI-önerisi/enrichment/onay-kuyruğu senaryolarına özel referans spec yok | (yeni tip gerekmez; `docs/pim-product-referans-spec.md`'de örneklenir — Görev #21) | 14, 18, 19, 20, 21 | P2 |

### 3.4 Doldurma Sırası (bağımlılık-farkında)

Aşağıdaki sıra `wbs-field-semantics` dependsOn mantığına uyar: veri-modeli zemini (variant/EAV/tree/taxonomy) önce; onları besleyen kernel motorları (search) sonra; değer-katmanı (storage/worker/mdm) en son. Sade özet: PIM MVP (Faz 0-2) için P0 archetype boşlukları kritik yoldadır; storage/worker/mdm değer-fazlarını (Faz 7-11) açar.

1. **P0 — ARCHETYPE variant/attribute-family + EAV** (§12.G): PIM Faz 1 MVP çekirdeği (#4, #5, #12); hiçbir kernel motoru gerektirmez, ArcheType şema genişletmesidir.
2. **P1 — ARCHETYPE tree + taxonomy** (§12.C genişletme + §12.H): Faz 1/3 (#6, #13); k-search'e girdi.
3. **P1 — KERNEL k-search + k-worker + k-storage**: Faz 6/8 kanal + medya (#22, #28, #29, #37); k-worker en çok özelliği (8 satır) açar → en yüksek kaldıraç.
4. **P2 — KERNEL k-mdm + SURFACE document/print**: Faz 7/11 (#25, #26, #39); değer-katmanı, MVP-sonrası.

---

## Bölüm 4 — Özet Sayım

Aşağıdaki tablo iki matristeki durum dağılımını verir. Numeronym tablosu 22 standart (iş-modeli capability'leri hariç); PIM tablosu 41 özellik.

| Matris | VAR | KISMİ | EKSİK | Toplam |
|---|---|---|---|---|
| Bölüm 1 — Numeronym standartları | 14 | 8 | 0 | 22 |
| Bölüm 2 — PIM-v2 özellikleri | 11 | 24 | 6 | 41 |
| **Toplam** | **25** | **32** | **6** | **63** |

EKSİK-6 (PIM): #13 taxonomy (ETIM/UNSPSC), #25 MDM golden-record, #26 deduplication, #28 DAM/S3 storage, #29 kanal-özel görsel varyantları, #39 baskı katalog (PDF). Bunların kernel kökü dört yeni primitiftir (k-storage, k-worker, k-search, k-mdm) + iki archetype ailesi (variant/attribute-family, taxonomy) + bir surface tipi (document/print).

---

## Teşhis (tek cümle)

Numeronym standartları kernel/standart katmanında tam kapsanmış (0 EKSİK, ama SSO/MFA/i14y/c13n gibi 8'i archetype/surface projeksiyonunda KISMİ), buna karşılık PIM-v2'nin kurumsal değer-fazları (MDM, DAM, taksonomi, arama, arka-plan işleri, baskı) sistematik olarak boştur; boşluk "standart eksik" değil, **dört yeni kernel primitifi (k-storage, k-worker, k-search, k-mdm) + iki archetype ailesi (variant/attribute-family, taxonomy) + bir surface tipi (document/print)** eksikliğidir.
