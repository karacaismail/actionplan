# **PIM Gereksinim Analizi ve Özellik Seti**

**Amaç:** Mevcut custom tabanlı PIM sistemini sıfırdan, **FastAPI (backend)** \+ **React (frontend)** mimarisiyle yeniden inşa etmek için faz faz gereksinim analizi, özellik seti ve mimari yol haritası.

**Hazırlanma tarihi:** 2026-07-01 **Kaynak:** Mevcut `custom_pim` uygulaması (\~120 DocType, 13 servis, 16 kanal adapteri) \+ `pim-ui` custom SPA analizi **Durum:** Taslak v1 — planlama dokümanı

---

## **İçindekiler**

1. [Yönetici Özeti](#1-yönetici-özeti)  
2. [Mevcut Sistem Analizi](#2-mevcut-sistem-analizi)  
3. [Hedef Mimari ve Teknoloji Yığını](#3-hedef-mimari-ve-teknoloji-yığını)  
4. [Domain Modeli (Kavramsal)](#4-domain-modeli-kavramsal)  
5. [Fonksiyonel Olmayan Gereksinimler (NFR)](#5-fonksiyonel-olmayan-gereksinimler-nfr)  
6. [Multi-Tenancy Stratejisi](#6-multi-tenancy-stratejisi)  
7. [Faz Faz Yol Haritası](#7-faz-faz-yol-haritası)  
8. [Özellik Seti Matrisi (Full)](#8-özellik-seti-matrisi-full)  
9. [Risk ve Bağımlılıklar](#9-risk-ve-bağımlılıklar)  
10. [Kapsam Dışı / Sonraki Sürüm](#10-kapsam-dışı--sonraki-sürüm)

---

## **1\. Yönetici Özeti**

Mevcut sistem, custom Framework üzerine kurulu **kurumsal düzeyde bir PIM (Product Information Management)** platformudur. Drupal-tarzı "entity/bundle" desenini, EAV (Entity-Attribute-Value) tabanlı esnek öznitelik modelini, ERP ile çift yönlü senkronizasyonu, 16 pazaryeri entegrasyonunu, çok sağlayıcılı AI zenginleştirmeyi ve MDM (Master Data Management) yeteneklerini bir araya getiriyor.

Yeni sürüm (**PIM v2**) aynı iş yeteneklerini korurken:

- FastAPI \+ SQLAlchemy \+ PostgreSQL  
- **custom yerine React** kullanacak (TypeScript)  
- **Gerçek çok-kiracılı (multi-tenant)** bir SaaS mimarisine geçecek (satır düzeyi tenant izolasyonu)  
- ERP senkronizasyonunu **zorunlu bağımlılık olmaktan çıkarıp opsiyonel bir entegrasyona** dönüştürecek

**İyi haber:** Mevcut backend'in `services/`, `channels/` ve `utils/ai_providers/` paketleri, `custom` importlarını fonksiyon seviyesine ertelediği için iş mantığı çekirdeği büyük ölçüde framework'ten bağımsız. Bu kod tabanının **algoritmik çekirdeği** (kanal adapterleri, AI sağlayıcı soyutlaması, kalite skorlama, survivorship kuralları) FastAPI'ye minimum değişiklikle taşınabilir — yalnızca `custom.get_doc` / `custom.db` / `custom.enqueue` / `PIM Settings` çağrılarının kendi persistence, config ve task-queue katmanınızla değiştirilmesi gerekir.

---

## **2\. Mevcut Sistem Analizi**

### **2.1 Backend (custom `custom_pim`)**

| Alan | Envanter |
| :---- | :---- |
| **DocType sayısı** | \~120 (içerik varlıkları, konfigürasyon, child table, ayar, operasyonel) |
| **Servisler** | 13 iş mantığı modülü (`services/`) |
| **Kanal entegrasyonları** | 16 pazaryeri adapteri (`channels/`) |
| **AI sağlayıcıları** | Anthropic, OpenAI, Azure OpenAI, Google Gemini, AWS Bedrock, Mock \+ çeviri için DeepL & Google Translate |
| **Ağaç yapıları** | 3 nested-set (Category, Product Family, Taxonomy Node) |
| **ERP entegrasyonu** | ERP Item ile çift yönlü sync (`Product Master` \= virtual DocType) |
| **Export formatları** | BMEcat, EDIFACT, UBL, cXML, GS1 XML, XLSX |
| **Zamanlanmış işler** | Sync queue (dakikalık), kalite tarama, analitik, medya, MDM, GDSN |

#### **2.1.1 Servisler (`services/`)**

| Servis | Yetenek |
| :---- | :---- |
| `onboarding_service` | 12 adımlı SaaS kurulum sihirbazı orkestrasyonu, industry template uygulama, feature-flag hesaplama |
| `ai_categorization` | AI ile otomatik kategori atama, çoklu taksonomi (GPC/UNSPSC/özel), güven skoru, human-in-the-loop |
| `ai_enrichment` | AI içerik üretimi (kısa/uzun açıklama, SEO başlık, madde işaretli özellikler, anahtar kelime, öznitelik çıkarımı) |
| `ai_translation` | Bağlam farkında çeviri, glossary zorlaması, translation memory, kalite skoru |
| `s3_storage` | boto3 ile S3/MinIO/Spaces/Wasabi/B2/GCS, multipart, pre-signed URL, CloudFront CDN |
| `gdsn_sync` | GDSN veri havuzu senkronizasyonu (CIN/CIP/RCI), GLN/GTIN |
| `image_variants` | 30+ pazaryeri için kanal-özel görsel varyant üretimi (PIL) |
| `merge_survive` | MDM dedup (exact/fuzzy/phonetic/ML), golden record, survivorship kuralları |
| `price_parity` | Kanallar arası fiyat pariteti, MAP ihlali tespiti, rekabetçi fiyat takibi |
| `print_catalog` | Baskıya hazır PDF katalog üretimi |
| `quality_scorer` | Birleşik kalite skorlama (completeness \+ boyut skorları \+ kanal hazırlığı) |
| `search_rank_tracker` | Dijital raf arama görünürlüğü, keyword rank takibi |
| `template_engine` | Sektör arketip şablonu yükleme/uygulama (idempotent) |

#### **2.1.2 Kanal Adapterleri (`channels/`)**

Tümü `ChannelAdapter` ABC'sinden türer, global registry'ye kendini kaydeder. Ortak akış: `validate_product → map_attributes → generate_payload → publish → get_status` \+ rate-limit yönetimi.

**Uluslararası:** Amazon (SP-API 1P+3P), Shopify, WooCommerce, eBay, Walmart, Target Plus, Etsy, Google Merchant, Meta Commerce, TikTok Shop **Türkiye:** Trendyol, Hepsiburada, N11, GittiGidiyor

#### **2.1.3 ERP Sync**

Çift yönlü: `sync/item_sync.py` (ERP→PIM), `utils/erp_sync.py` (PIM→ERP), `sync/queue_processor.py` (kuyruk tabanlı, çakışma çözümü, retry/dead-letter). Sonsuz döngü koruması flag'lerle (`_from_pim_sync`, `from_pim` vb.).

**PIM v2 kararı:** ERP, temel bağımlılık değil **opsiyonel bir dış entegrasyon** olacak. Ürün verisi PIM v2'nin kendi `products` tablosunda tutulacak (mevcut sistemdeki virtual DocType yaklaşımı kaldırılıyor).

### **2.2 Frontend (custom `pim-ui`)**

| Alan | Envanter |
| :---- | :---- |
| **Framework** | custom 3 \+ Vite \+ TypeScript \+ Pinia \+ custom Router 4 \+ custom-i18n \+ Tailwind (Flowbite) |
| **Store** | 4 Pinia store (app, onboarding \~1460 satır, product, settings) |
| **Ana ekranlar** | Dashboard, ProductList, generic DocTypeList/DocTypeDetail, Settings, 12-step Onboarding Wizard |
| **Öne çıkan** | Metadata-driven dinamik form motoru, canlı önizlemeli onboarding wizard, dark mode, retry/backoff |
| **API katmanı** | Tek axios instance, CSRF, cookie-based session, custom REST/method API |
| **i18n** | custom-i18n hazır ama şu an sadece EN \+ birkaç TR literal |

**PIM v2'ye taşınması en kritik parçalar:**

1. **Metadata-driven form motoru** (`DocTypeDetail.custom`) — herhangi bir varlığı sunucu şemasından render eder  
2. **12 adımlı onboarding wizard** \+ canlı önizleme  
3. **API \+ auth foundation** (v2'de JWT \+ token store olacak)  
4. **Navigasyon/IA** (`pimNav.ts` — 13 sidebar grubu, \~60 varlık)

---

## **3\. Hedef Mimari ve Teknoloji Yığını**

### **3.1 Backend**

| Katman | Teknoloji | Gerekçe |
| :---- | :---- | :---- |
| Web framework | **FastAPI** (Python 3.12+) | Async, otomatik OpenAPI, Pydantic validasyon |
| ORM | **SQLAlchemy 2.0** (async) | Olgun, esnek; EAV \+ tree yapıları için uygun |
| Migrasyon | **Alembic** | Şema versiyonlama |
| Veritabanı | **PostgreSQL 16** | JSONB (EAV/attribute), `ltree` (ağaç), RLS (tenant izolasyonu), tam metin arama |
| Validasyon/Şema | **Pydantic v2** | Request/response, ayar yönetimi |
| Auth | **JWT** (access+refresh) \+ OAuth2 password flow | Stateless, SaaS-uyumlu; `python-jose` / `passlib[bcrypt]` |
| Görev kuyruğu | **Celery \+ Redis** (veya **ARQ**) | AI enrichment, sync, medya, export gibi arka plan işleri |
| Cache | **Redis** | Session/rate-limit/query cache |
| Nesne depolama | **S3/MinIO** (boto3) | Medya/DAM |
| Arama | **PostgreSQL FTS** (Faz 1\) → **OpenSearch/Elasticsearch** (ölçekte) | Ürün/öznitelik arama |
| Test | **pytest** \+ **pytest-asyncio** \+ **httpx** | Birim \+ entegrasyon |
| Gözlemlenebilirlik | **structlog** \+ **OpenTelemetry** \+ Prometheus | Log/trace/metrik |

### **3.2 Frontend**

| Katman | Teknoloji | Gerekçe |
| :---- | :---- | :---- |
| Framework | **React 18+** \+ **TypeScript** | Talep edilen yığın |
| Build | **Vite** | Hızlı HMR |
| Routing | **React Router v6** | SPA rota \+ guard |
| Sunucu-durum | **TanStack Query (React Query)** | Cache, retry/backoff, invalidation (mevcut Pinia retry mantığının yerine) |
| İstemci-durum | **Zustand** (veya Redux Toolkit) | UI/wizard state (Pinia karşılığı) |
| Form | **React Hook Form** \+ **Zod** | Metadata-driven dinamik form motoru |
| UI | **Tailwind CSS** \+ **shadcn/ui** (veya MUI) | Mevcut Flowbite deneyimine yakın, dark mode |
| Tablo | **TanStack Table** | Generic DataTable (liste/grid, seçim, sayfalama) |
| i18n | **react-i18next** | TR \+ EN (mevcut sistemin eksiğini kapat) |
| HTTP | **axios** \+ interceptor | JWT header, 401 refresh, hata parse |
| Test | **Vitest** \+ **React Testing Library** \+ **Playwright** (E2E) |  |

### **3.3 Altyapı / DevOps**

- **Docker Compose** (dev) → **Kubernetes** (prod, opsiyonel)  
- **CI/CD:** GitHub Actions (lint → test → build → deploy)  
- **Ortamlar:** dev / staging / prod ayrımı, `.env` \+ secret yönetimi  
- **API tasarımı:** REST (OpenAPI 3.1), versiyonlu (`/api/v1/...`)

### **3.4 Mono-repo Önerisi**

pim-v2/

├── backend/           \# FastAPI

│   ├── app/

│   │   ├── api/v1/     \# router'lar (endpoint'ler)

│   │   ├── core/       \# config, security, db, deps

│   │   ├── models/     \# SQLAlchemy modelleri

│   │   ├── schemas/    \# Pydantic şemaları

│   │   ├── services/   \# iş mantığı (mevcut services/ portu)

│   │   ├── channels/   \# kanal adapterleri (mevcut channels/ portu)

│   │   ├── ai/         \# AI sağlayıcı soyutlaması

│   │   ├── tasks/      \# Celery görevleri

│   │   └── main.py

│   ├── alembic/

│   └── tests/

├── frontend/          \# React

│   ├── src/

│   │   ├── api/        \# axios \+ query hooks

│   │   ├── components/ \# DataTable, Layout, Sidebar, dynamic form

│   │   ├── features/   \# products, onboarding, settings, taxonomy...

│   │   ├── stores/     \# Zustand

│   │   ├── routes/

│   │   └── i18n/

│   └── tests/

├── docker-compose.yml

└── docs/

---

## **4\. Domain Modeli (Kavramsal)**

### **4.1 Çekirdek Varlıklar**

                         ┌──────────────┐

                         │   Tenant     │  (organizasyon \= kiracı)

                         └──────┬───────┘

                                │ tenant\_id (her tabloda)

        ┌───────────────────────┼───────────────────────┐

        ▼                       ▼                        ▼

┌───────────────┐      ┌────────────────┐       ┌────────────────┐

│  Product      │──────│ Product Variant│       │ Product Family │ (ağaç)

│  (ana kayıt)  │      │ (SKU düzeyi)   │       │ \+ öznitelik    │

└───────┬───────┘      └────────────────┘       │   şablonu      │

        │                                        └────────────────┘

        │ EAV

        ▼

┌──────────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐

│ ProductAttribute │───│ Attribute    │───│ AttributeType│   │ Attribute    │

│ Value (değer)    │   │ (tanım)      │   │ (veri tipi)  │   │ Option       │

└──────────────────┘   └──────────────┘   └──────────────┘   └──────────────┘

Category (ağaç) · Taxonomy/TaxonomyNode (ETIM/UNSPSC) · Brand · Manufacturer

Channel · MarketplaceListing · PriceRule · Bundle · DigitalAsset · GoldenRecord

### **4.2 Varlık Grupları (Kaynak sistemdeki \~120 DocType'ın domain haritası)**

| Grup | Varlıklar |
| :---- | :---- |
| **Ürün grafiği** | Product, ProductVariant, ProductFamily (ağaç), ProductSeries, ProductCollection, PackageVariant, Bundle, DigitalAsset |
| **Öznitelik/taksonomi** | Attribute, AttributeGroup, AttributeOption, AttributeType, AttributeTemplate, Category (ağaç), Taxonomy, TaxonomyNode (ağaç) |
| **Konfigürasyon/referans** | Brand, Manufacturer, ProductType, IndustryTemplate, Locale, Channel, SalesChannel, CustomerSegment, TargetSegment |
| **Fiyatlandırma** | PriceItem, PriceRule, ContractPrice (+tier), PackageVariant fiyatları |
| **Kalite/veri yönetişimi** | DataQualityPolicy (+rule), ProductScore, SurvivorshipRule, GoldenRecord, SourceSystem, DataSteward |
| **Kanal/yayınlama** | ProductChannel, MarketplaceListing, ExportProfile, WebhookConfiguration, DigitalShelfSnapshot |
| **AI/otomasyon** | AIEnrichmentJob, AIApprovalQueue, AIPromptTemplate, NodeAttributeSuggestion |
| **Uyumluluk/sektörel** | NutritionFacts (+allergen), GS1PackagingHierarchy, ChemicalUsageInstruction |
| **Analitik** | CompetitorAnalysis, MarketInsight, ProductFeedback, QANote |
| **Portal/izin** | BrandPortalUser, PartnerSubmission, CategoryPermission |
| **Sistem** | TenantConfig, Settings, PIMEvent (event sourcing), SyncQueue, OnboardingState, StepLog |

**Not:** Mevcut sistemdeki child table'lar (product\_media, product\_attribute\_value, price\_item vb.) PIM v2'de ilişkili tablolar veya JSONB alanlar olarak modellenecek.

---

## **5\. Fonksiyonel Olmayan Gereksinimler (NFR)**

| Kategori | Gereksinim |
| :---- | :---- |
| **Performans** | Ürün listesi API'si p95 \< 300ms; 100k+ ürünle sayfalama/filtreleme; N+1 sorgu yasak |
| **Ölçeklenebilirlik** | Yatay ölçeklenebilir stateless API; arka plan işleri worker'lara offload |
| **Güvenlik** | JWT \+ refresh rotation, RBAC \+ kategori-scoped ABAC, OWASP Top 10, rate limiting, secret şifreleme (API key'ler at-rest şifreli) |
| **Multi-tenancy** | Tam satır-düzeyi tenant izolasyonu (bkz. §6) |
| **Erişilebilirlik** | WCAG 2.1 AA, klavye navigasyonu, alt-text |
| **Uluslararasılaşma** | TR \+ EN (i18n), locale-aware öznitelikler, çoklu para birimi |
| **Gözlemlenebilirlik** | Yapısal log, dağıtık trace, iş metrikleri, hata izleme (Sentry) |
| **Denetim** | Event sourcing / audit log (kim, ne, ne zaman); onboarding step log |
| **Dayanıklılık** | Retry+backoff, circuit breaker (webhook/kanal), dead-letter queue |
| **Veri kalitesi** | Completeness skorlama, publish-öncesi kalite kapısı |
| **Test kapsamı** | Backend ≥ %80 birim; kritik akışlarda E2E |
| **Dokümantasyon** | OpenAPI otomatik; ADR (Architecture Decision Records) |

---

## **6\. Multi-Tenancy Stratejisi**

**Mevcut sistemin sınırı:** custom'de tenant izolasyonu **site düzeyinde** (her kiracı \= ayrı MySQL veritabanı). Hiçbir tabloda `tenant_id` yok; satır-düzeyi filtreleme yok. Sadece `Tenant Config` kullanıcı-başına.

**PIM v2 hedefi — Tek DB, satır-düzeyi izolasyon:**

1. Her tabloya zorunlu **`tenant_id` (FK → tenants)** kolonu.  
2. **PostgreSQL Row-Level Security (RLS)** politikaları — DB seviyesinde sızıntıya karşı ikinci savunma hattı.  
3. Uygulama katmanında **repository/dependency** ile otomatik tenant filtresi (her sorgu `WHERE tenant_id = :current_tenant`).  
4. JWT içinde `tenant_id` claim; her istekte `get_current_tenant` dependency.  
5. **Feature flags** tenant düzeyinde (`enable_variants`, `enable_ai`, `enable_channels`, `enable_workflow`, `enable_translations`, `enable_bundling`, `enable_quality_scoring`, `enable_competitor_tracking`).  
6. **Ölçek seçeneği:** İleride büyük kiracılar için schema-per-tenant veya DB-per-tenant'a geçiş yolu açık tutulur.

---

## **7\. Faz Faz Yol Haritası**

Her faz: **kapsam → gereksinimler → teslim edilebilirler → kabul kriterleri**. Fazlar üst üste inşa edilir; MVP \= Faz 0–2.

---

### **FAZ 0 — Temel & İskele (Foundation)**

**Kapsam:** Geliştirme altyapısı, kimlik doğrulama, multi-tenant temeli, boş ama çalışan uçtan uca iskelet.

**Gereksinimler**

- Mono-repo, Docker Compose (Postgres \+ Redis \+ MinIO \+ backend \+ frontend)  
- FastAPI iskeleti, health-check, OpenAPI, CORS, structlog  
- SQLAlchemy async \+ Alembic; `Tenant`, `User`, `Role` modelleri  
- JWT auth (login/refresh/logout), bcrypt parola, RBAC temel  
- RLS \+ `tenant_id` deseni (base model mixin)  
- React iskeleti (Vite+TS), Router, axios interceptor (JWT+401 refresh), Login sayfası, temel Layout/Sidebar/TopBar, dark mode  
- CI (lint+test), pre-commit hook'ları

**Teslim edilebilirler:** Çalışan login → korumalı boş dashboard; `docker compose up` ile ayağa kalkan sistem. **Kabul kriterleri:** Kullanıcı giriş yapıp JWT ile korumalı endpoint'e erişebilir; iki farklı tenant'ın verisi birbirini göremez (RLS testi geçer).

---

### **FAZ 1 — Çekirdek Veri Modeli & Ürün Yönetimi (MVP çekirdeği)**

**Kapsam:** Ürün, varyant, marka/üretici, kategori ağacı, EAV öznitelik sistemi ve dinamik form motoru.

**Gereksinimler**

- Modeller: `Product`, `ProductVariant`, `Brand`, `Manufacturer`, `Category` (ağaç, `ltree`), `ProductFamily` (ağaç), `Attribute`, `AttributeType`, `AttributeGroup`, `AttributeOption`, `ProductAttributeValue` (EAV, locale-aware, tipli değer)  
- Ürün CRUD API'si: liste (filtre/arama/sayfalama/sıralama), detay, oluştur/güncelle/sil, toplu işlem  
- Varyant üretimi (axis kombinasyonları), varyant eksen doğrulama (max 3 seviye)  
- Öznitelik miras zinciri (family → product → variant)  
- **Metadata endpoint'i** (`/api/v1/meta/{entity}`) — dinamik form için şema  
- Frontend: ProductList (tablo+grid, filtre, bulk, tamlık skoru rozetleri), generic DataTable, **dinamik form motoru** (React Hook Form \+ Zod, sunucu şemasından üretim), kategori/family ağaç görünümü

**Teslim edilebilirler:** Uçtan uca ürün yönetimi; öznitelikli ürün oluşturma/düzenleme. **Kabul kriterleri:** Kullanıcı bir aile+tip seçip zorunlu öznitelikleri doldurarak ürün ve varyantlarını oluşturabilir; liste 100k üründe p95 \< 300ms.

---

### **FAZ 2 — Onboarding, Ayarlar & Feature Flags**

**Kapsam:** SaaS kurulum deneyimi, sektör şablonları, tenant konfigürasyonu.

**Gereksinimler**

- `TenantConfig` modeli (şirket bilgisi, sektör, feature flags, onboarding durumu/adımı)  
- **12 adımlı onboarding wizard** backend orkestrasyonu: company\_info, industry\_selection, product\_structure, attribute\_config, taxonomy, channel\_setup, localization, workflow\_preferences, quality\_scoring\*, integrations\*, compliance\*, summary\_launch (\*skippable)  
- Adım başına validasyon, kısmi/taslak kayıt, adımdan devam, audit log (`OnboardingStepLog`)  
- **Industry Template** motoru (fashion, industrial, food, electronics, health\_beauty, automotive, custom) — idempotent şekilde Product Type / Attribute / Family / Category üretir; `extends` desteği  
- Onboarding guard (frontend router): tamamlanmamışsa wizard'a yönlendir  
- Frontend: canlı önizlemeli wizard (adım ↔ preview eşleşmesi), non-dismissible modal, adım geçiş animasyonları; Settings hub \+ Onboarding Configuration (adım bileşenlerini post-onboarding yeniden kullan)

**Teslim edilebilirler:** Yeni kiracı için sıfırdan kurulum akışı \+ sektör şablonuyla önyükleme. **Kabul kriterleri:** Yeni tenant wizard'ı tamamlayınca sektöre uygun kategoriler/öznitelikler/kanallar önceden dolu gelir; feature flag'ler uygulanır.

---

### **FAZ 3 — Gelişmiş Öznitelik & Taksonomi**

**Kapsam:** Öznitelik şablonları, uluslararası taksonomi standartları, öznitelik önerisi.

**Gereksinimler**

- `AttributeTemplate` (+ TemplateAttribute), product-type başına şablon  
- `Taxonomy` (ETIM/UNSPSC/GPC) \+ `TaxonomyNode` (ağaç, ETIM özellikleri, düğüm başına önerilen öznitelik)  
- Öznitelik miras & çözümleme (`attribute_resolver` portu)  
- Çoklu-seçim/birimli/lokalize öznitelik tipleri, validation regex/min-max  
- Frontend: taksonomi ağaç gezgini, öznitelik grubu düzenleyici, şablon yönetimi

**Kabul kriterleri:** Bir ürün ETIM düğümüne bağlanınca önerilen öznitelikler otomatik listelenir.

---

### **FAZ 4 — Veri Kalitesi & Completeness Skorlama**

**Kapsam:** Kalite skorlama motoru, veri kalitesi politikaları, kanal hazırlığı.

**Gereksinimler**

- `quality_scorer` \+ `completeness` \+ `scoring` util portları  
- Boyutlar: içerik, medya, SEO, çeviri, öznitelik, pazar  
- `DataQualityPolicy` (+ `DataQualityRule`), scope (marka/kanal/aile), enforcement mode  
- `ProductScore` kart (alt-skorlar, ağırlık, yüzdelik, tarihçe)  
- Publish-öncesi kalite kapısı (min skor altında yayın engeli)  
- Frontend: kalite gösterge paneli (gauge), eksik alan raporu, remediation önerileri, dashboard entegrasyonu

**Kabul kriterleri:** Ürün detayında canlı tamlık skoru \+ eksik zorunlu öznitelik listesi; politika ihlali yayını engeller.

---

### **FAZ 5 — AI & Otomasyon**

**Kapsam:** AI zenginleştirme, kategorizasyon, çeviri; human-in-the-loop onay.

**Gereksinimler**

- **AI sağlayıcı soyutlaması** (`ai_providers` portu): Anthropic, OpenAI, Azure OpenAI, Gemini, Bedrock, Mock; retry/backoff, token & maliyet tahmini, health-check, at-rest şifreli API key  
- **Enrichment:** açıklama/başlık/bullet/keyword/öznitelik çıkarımı; `AIPromptTemplate`  
- **Categorization:** çoklu taksonomi, güven skoru, öğrenme  
- **Translation:** glossary, translation memory, kalite skoru, DeepL/Google Translate  
- **Onay kuyruğu:** `AIApprovalQueue`, `AIEnrichmentJob` (batch), auto-approval eşiği  
- Celery görevleri: `process_pending_enrichments`, `expire_old_approvals`, `refresh_translation_memory`, batch job işleme  
- Frontend: AI öneri paneli, onay/red akışı, batch enrichment başlatma, maliyet göstergesi

**Kabul kriterleri:** Bir ürün için AI açıklama üretilir → onay kuyruğuna düşer → onaylanınca uygulanır; maliyet ve token izlenir.

---

### **FAZ 6 — Kanal Entegrasyonları & Yayınlama**

**Kapsam:** Pazaryeri adapterleri, marketplace listing, export profilleri.

**Gereksinimler**

- **ChannelAdapter** temel sınıfı portu (rate-limit state machine, kimlik şifre çözümü, `_make_request`, sonuç dataclass'ları, registry)  
- Adapter portları (öncelik sırasıyla): Trendyol, Hepsiburada, N11, Shopify, Amazon, WooCommerce → sonra eBay, Etsy, Google Merchant, Meta, TikTok, Walmart, Target, GittiGidiyor  
- `Channel`, `ProductChannel`, `ChannelLocale`, `ChannelAttributeRequirement`, `ChannelReadinessStatus`, `MarketplaceListing`  
- Yayın akışı: validate → map → publish → status polling; unmapped alan raporu  
- `ExportProfile` \+ export formatları (XLSX önce; BMEcat/UBL/cXML/GS1 XML/EDIFACT sonra)  
- Frontend: kanal panosu, ürün-kanal yayın durumu, listing yönetimi, kanal hazırlık göstergesi

**Kabul kriterleri:** Bir ürün Trendyol'a validate edilip yayınlanabilir; hatalar/eksik alanlar kullanıcıya raporlanır.

---

### **FAZ 7 — MDM & Veri Yönetişimi**

**Kapsam:** Golden record, survivorship, kaynak sistem yönetimi, deduplication.

**Gereksinimler**

- `merge_survive` portu: dedup (exact/fuzzy Levenshtein-JaroWinkler/phonetic/ML), benzerlik skoru  
- `SurvivorshipRule`, `GoldenRecord` (+ `GoldenRecordSource`), `SourceSystem`, `DataSteward`  
- Alan-düzeyi provenance, merge audit trail  
- `PIMEvent` (event sourcing) — değişiklikler event olarak yayınlanır  
- Celery: `scan_for_duplicates`  
- Frontend: dedup inceleme ekranı, golden record çözümleme UI, steward atama

**Kabul kriterleri:** İki benzer ürün tespit edilip survivorship kurallarına göre golden record'a birleştirilebilir; provenance izlenir.

---

### **FAZ 8 — Medya / DAM & Depolama**

**Kapsam:** Dijital varlık yönetimi, kanal-özel görsel varyantları, CDN.

**Gereksinimler**

- `s3_storage` portu (S3/MinIO/Spaces/Wasabi/B2/GCS, multipart, pre-signed URL, CloudFront)  
- `DigitalAsset` (+ `AssetRendition`), EXIF/IPTC/XMP metadata  
- `image_variants` portu — 30+ pazaryeri spesifikasyonu, resize/crop/WebP, batch \+ async  
- Celery: `generate_pending_variants`, `cleanup_orphan_media`  
- Frontend: medya galerisi, sürükle-bırak yükleme, varyant önizleme, primary/rol atama

**Kabul kriterleri:** Görsel yüklenir → kanal spesifikasyonlarına göre varyantları arka planda üretilir → CDN URL'i döner.

---

### **FAZ 9 — Fiyatlandırma & Bundling**

**Kapsam:** Fiyat kuralları, sözleşme fiyatları, ürün paketleri.

**Gereksinimler**

- `PriceItem` (liste fiyatları), `PriceRule` (promosyon motoru), `ContractPrice` (+tier), `CustomerSegment`  
- `Bundle` (+ slot, tier, kanal), `PackageVariant` (paketleme SKU, GTIN, boyut)  
- `price_resolver` \+ `bundle` util portları  
- Frontend: fiyat kural editörü, sözleşme fiyat yönetimi, bundle kurulumu

**Kabul kriterleri:** Segment+miktar bazlı efektif fiyat çözümlenebilir; bundle fiyatı hesaplanır.

---

### **FAZ 10 — Entegrasyon, Uyumluluk & GS1/GDSN**

**Kapsam:** Webhook, event sourcing, GS1, GDSN, sektörel uyumluluk.

**Gereksinimler**

- `WebhookConfiguration` \+ delivery engine (HMAC imza, circuit breaker, retry, delivery log)  
- `webhook_triggers` portu — varlık create/update/delete olaylarında tetikleme  
- GS1: `GS1PackagingHierarchy`, GTIN/GLN validasyonu, barkod üretimi  
- GDSN: `gdsn_sync` portu (CIN/CIP/RCI, veri havuzu bağlantısı)  
- Sektörel: `NutritionFacts` (+allergen), `ChemicalUsageInstruction`  
- Uyumluluk export'ları (compliance report)  
- ERP opsiyonel entegrasyonu (bağlayıcı adapter — zorunlu değil)  
- Frontend: webhook yönetimi, GS1 paketleme hiyerarşisi editörü, uyumluluk formları

**Kabul kriterleri:** Ürün değişikliği webhook'u imzalı olarak teslim edilir; GTIN validasyonu çalışır.

---

### **FAZ 11 — Analitik, Dijital Raf & Raporlama**

**Kapsam:** Fiyat pariteti, arama sıralaması, rakip analizi, baskı katalog.

**Gereksinimler**

- `price_parity` portu (parite skoru, MAP ihlali, fiyat tarihçesi/trend, uyarı)  
- `search_rank_tracker` portu (keyword rank, share-of-search, trend)  
- `DigitalShelfSnapshot`, `CompetitorAnalysis`, `MarketInsight`, `ProductFeedback`, `QANote`  
- `print_catalog` portu (PDF katalog, çoklu layout/dil)  
- Celery analitik görevleri: `monitor_price_parity`, `capture_shelf_snapshots`, `track_search_rankings`, `generate_weekly_summary`  
- Frontend: analitik dashboard'ları, rakip karşılaştırma, katalog üretim ekranı

**Kabul kriterleri:** Fiyat parite uyarıları üretilir; PDF katalog oluşturulup indirilebilir.

---

### **FAZ 12 — Portal, İzinler & İnce Ayar (Hardening)**

**Kapsam:** Marka portalı, ince taneli izinler, üretim sertleştirmesi.

**Gereksinimler**

- `BrandPortalUser`, `PartnerSubmission` (dış marka ürün gönderimi → onay → ürün oluştur)  
- `CategoryPermission` (kategori-scoped ABAC/RACI)  
- İzin sorgu koşulları (row-level permission), kota yönetimi  
- Performans profilleme, yük testi, güvenlik denetimi, dokümantasyon tamamlama  
- Frontend: portal kullanıcı yönetimi, submission inceleme, izin matrisi

**Kabul kriterleri:** Dış marka kullanıcısı ürün gönderir → iç ekip onaylar → ürün oluşur; kategori izinleri uygulanır.

---

## **8\. Özellik Seti Matrisi (Full)**

| \# | Özellik | Faz | Öncelik |
| :---- | :---- | :---- | :---- |
| 1 | Kimlik doğrulama (JWT+refresh, RBAC) | 0 | P0 |
| 2 | Multi-tenant izolasyon (RLS \+ tenant\_id) | 0 | P0 |
| 3 | Ürün CRUD \+ liste/filtre/arama | 1 | P0 |
| 4 | Varyant yönetimi (çok seviyeli) | 1 | P0 |
| 5 | EAV öznitelik sistemi | 1 | P0 |
| 6 | Kategori & aile ağaçları | 1 | P0 |
| 7 | Metadata-driven dinamik form motoru | 1 | P0 |
| 8 | 12 adımlı onboarding wizard | 2 | P0 |
| 9 | Industry template motoru | 2 | P1 |
| 10 | Feature flags (tenant) | 2 | P1 |
| 11 | Ayarlar / konfigürasyon | 2 | P1 |
| 12 | Öznitelik şablonları | 3 | P1 |
| 13 | Taksonomi (ETIM/UNSPSC/GPC) | 3 | P1 |
| 14 | Öznitelik önerisi | 3 | P2 |
| 15 | Kalite skorlama & completeness | 4 | P1 |
| 16 | Veri kalitesi politikaları | 4 | P1 |
| 17 | Publish-öncesi kalite kapısı | 4 | P1 |
| 18 | AI enrichment | 5 | P1 |
| 19 | AI kategorizasyon | 5 | P2 |
| 20 | AI çeviri (glossary+TM) | 5 | P2 |
| 21 | AI onay kuyruğu | 5 | P1 |
| 22 | Kanal adapterleri (16 pazaryeri) | 6 | P1 |
| 23 | Marketplace listing | 6 | P1 |
| 24 | Export profilleri & formatları | 6 | P2 |
| 25 | MDM golden record & survivorship | 7 | P2 |
| 26 | Deduplication | 7 | P2 |
| 27 | Event sourcing / audit | 7 | P1 |
| 28 | DAM & S3 depolama | 8 | P1 |
| 29 | Kanal-özel görsel varyantları | 8 | P2 |
| 30 | Fiyat kuralları & sözleşme fiyatı | 9 | P2 |
| 31 | Bundle & paketleme | 9 | P2 |
| 32 | Webhook \+ delivery engine | 10 | P2 |
| 33 | GS1 / GDSN | 10 | P3 |
| 34 | Sektörel uyumluluk (nutrition/chemical) | 10 | P3 |
| 35 | ERP opsiyonel entegrasyon | 10 | P3 |
| 36 | Fiyat pariteti & MAP | 11 | P3 |
| 37 | Arama sıralama takibi | 11 | P3 |
| 38 | Rakip/pazar analizi | 11 | P3 |
| 39 | Baskı katalog (PDF) | 11 | P3 |
| 40 | Marka portalı & partner submission | 12 | P3 |
| 41 | Kategori-scoped izinler | 12 | P2 |

**Öncelik:** P0 \= MVP zorunlu · P1 \= erken sürüm · P2 \= orta vade · P3 \= uzun vade

---

## **9\. Risk ve Bağımlılıklar**

| Risk | Etki | Azaltma |
| :---- | :---- | :---- |
| Virtual DocType → gerçek tablo geçişi (veri modeli farkı) | Yüksek | Faz 1'de net şema; mevcut alan haritalarını referans al |
| 16 kanal adapterinin API'lerinin değişmiş olması | Orta | Faz 6'da mock \+ sandbox ile doğrula; öncelikli 4-6 kanal |
| AI sağlayıcı maliyeti/kotası | Orta | Maliyet tahmini, translation memory, onay kuyruğu, Mock provider |
| Multi-tenant izolasyon açığı | Yüksek | RLS \+ repository filtresi \+ otomatik izolasyon testleri (Faz 0\) |
| Veri migrasyonu (mevcut custom DB'den) | Orta | Ayrı ETL script'i; PIM v2 tablo şemasına eşleme |
| EAV performansı (büyük veri) | Orta | JSONB \+ uygun index (GIN), gerekirse materialized view |
| Kapsam genişliği (\~120 varlık) | Yüksek | Katı fazlama; P0/P1 önce, P3 sona |

**Dış bağımlılıklar:** Kanal API kimlik bilgileri, AI sağlayıcı anahtarları, S3/CDN, (opsiyonel) ERP instance.

---

## **10\. Kapsam Dışı / Sonraki Sürüm**

- ERP'e **tam** çift yönlü sync (v2'de yalnızca opsiyonel tek yön/adapter)  
- OpenSearch/Elasticsearch'e geçiş (başlangıçta Postgres FTS yeterli)  
- Mobil uygulama  
- Gelişmiş BI/veri ambarı entegrasyonu  
- Schema-per-tenant / DB-per-tenant fiziksel izolasyon (mimari hazır, uygulama sonraya)

---

### **Ek: MVP Tanımı**

**MVP \= Faz 0 \+ Faz 1 \+ Faz 2** → Multi-tenant, kimlik doğrulamalı, ürün/varyant/öznitelik yönetimi yapabilen, sektör şablonuyla onboarding sunan çalışan bir PIM. Bu, ilk kullanıcı testleri ve demo için yeterli çekirdektir; Faz 3+ değer katmanlarıdır.

---

*Bu doküman mevcut `custom_pim` kod tabanının otomatik analizinden üretilmiştir. Her fazın başında detaylı teknik tasarım (API sözleşmeleri, DB şeması, ekran tasarımları) ayrıca çıkarılmalıdır.*  
