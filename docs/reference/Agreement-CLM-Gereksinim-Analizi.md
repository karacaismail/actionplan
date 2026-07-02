# **Agreement OS / CLM Gereksinim Analizi ve Özellik Seti**

**Amaç:** Bir sözleşmeyi statik bir PDF ve tek bir imzadan çıkarıp; üreten, riskini okuyan, müzakere eden, onaylatan, imzalatan, arşivleyen, yenilemelerini takip eden, yükümlülüklerini ERP/CRM/HR/procurement'a bağlayan ve sözleşmeyi **işletilebilir bir veri varlığına** çeviren bir **Agreement OS / CLM (Contract Lifecycle Management)** ürününü faz faz gereksinim analizi, domain modeli, özellik seti ve mimari yol haritasıyla tanımlamak.

**Hazırlanma tarihi:** 2026-07-01 · **Kaynak:** actionplan kernel/archetype/surface yönergeleri (`k-signature`, `k-evidence`, `k-obligation`, `k-provider-adapter`, `k-migration-bridge`, `k-legal-hold-retention`, `archetype-agreement`, `archetype-document-composition`, `surface-spec`) + `atom-archetype-bagi-clm-ornegi-2026-07-01.md` (agreement graph atom eşlemesi) · **Durum:** Referans / gereksinim analizi — planlama dokümanı, implementasyon kodu değil.

**Konum:** Bu doküman, kernel/archetype/surface yönergelerinin **karşılaması gereken hedef ürünü** tanımlar. Yönergeler "her primitif ne yapmalı" sorusunu; bu doküman "ürün bir bütün olarak ne olmalı ve hangi primitife düşer" sorusunu yanıtlar. Çelişkide kernel runtime sözleşmesi (`core-contract-pack.md`) önceliklidir.

---

## **İçindekiler**

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [Konumlandırma: "Agreement OS", "Contract + Signature" Değil](#2-konumlandırma-agreement-os-contract--signature-değil)
3. [Domain Modeli — Agreement Graph](#3-domain-modeli--agreement-graph)
4. [Fonksiyonel Olmayan Gereksinimler (NFR)](#4-fonksiyonel-olmayan-gereksinimler-nfr)
5. [Uygulama / Modül Matrisi (12 Modül)](#5-uygulama--modül-matrisi-12-modül)
6. [E-İmza Seviyeleri ve Güven Hizmetleri](#6-e-imza-seviyeleri-ve-güven-hizmetleri)
7. [AI-First: Intake, Drafting, Negotiation, Policy Engine](#7-ai-first-intake-drafting-negotiation-policy-engine)
8. [Geliştirme Fazları (Faz 1 → Faz 7)](#8-geliştirme-fazları-faz-1--faz-7)
9. [Deployment Modları](#9-deployment-modları)
10. [Kernel / Archetype / Surface Eşlemesi](#10-kernel--archetype--surface-eşlemesi)
11. [Özellik Seti Matrisi (Full)](#11-özellik-seti-matrisi-full)
12. [Risk ve Bağımlılıklar](#12-risk-ve-bağımlılıklar)
13. [Kapsam Dışı / Sonraki Sürüm](#13-kapsam-dışı--sonraki-sürüm)

---

## **1\. Yönetici Özeti**

Hedef ürün, sözleşmenin tüm yaşam döngüsünü tek bir platformda yöneten bir **Agreement OS / CLM**'dir. Piyasadaki çoğu çözüm iki uçtan birine yaslanır: ya bir **e-imza aracıdır** (DocuSign, PandaDoc, Dropbox Sign; "PDF'i imzalat"), ya bir **kurumsal CLM'dir** (Ironclad, DocuSign CLM, Conga; "repository + workflow + raporlama"). Bu ürün ikisini de kapsayıp bir adım öteye geçer: sözleşmeyi **işletilebilir veri varlığına** çevirir. Yani bir sözleşme yalnız imzalanan bir belge değil; içinden yükümlülüklerin (ödeme vadesi, teslim, yenileme, ihbar, SLA, ceza), tarafların, maddelerin, risklerin, tarihlerin ve kanıtların çıkarılabildiği, sorgulanabildiği ve ERP/CRM/HR/procurement'a bağlanabildiği yapılandırılmış bir grafiktir.

Ürünün ayırt edici üç ekseni vardır. **Birincisi, yükümlülük ekseni:** sözleşme metninde gömülü kalan taahhütler birinci-sınıf, durumlu, uyarı üreten nesnelere dönüşür; kaçan bir yenileme veya ihbar penceresi doğrudan **gelir kaçağıdır (revenue leakage)** ve bu ürünün en somut değeri onu erkenden yakalamaktır. **İkincisi, kanıt ekseni:** her imza, onam ve mühür kurcalanamaz (tamper-evident), hash-zincirli, RFC 3161 zaman-damgalı ve LTV (uzun-dönem doğrulanabilir) bir delil kaydına düşer; sözleşme yalnız imzalanmaz, hukuki delil değeri taşıyacak biçimde **mühürlenir**. **Üçüncüsü, AI ekseni:** AI sözleşmeyi okur (sınıflandırma, taraf/madde/yükümlülük/tarih çıkarımı, risk skorlama), taslak üretir ve müzakere copilot'u olarak redline/fallback önerir — ama daima **öneri** seviyesinde kalır: kullanıcı niyet söyler, AI önerir/önizler, insan onaylar, motor uygular.

Aktör-açık ifadeyle bu ürün, hukuk/finans/satış/procurement ekiplerinin sözleşmeyi *ürettiği*, karşı tarafın *müzakere ettiği ve imzaladığı*, sistemin *yükümlülükleri izleyip uyardığı*, AI'ın *okuyup önerdiği* ve tüm sürecin *denetlenebilir kanıta bağlandığı* bir işletim katmanıdır. Teknik olarak headless-first (her yetenek API-önce), provider-agnostik (imza/AI/depolama/iş-akışı sağlayıcısı tenant-özel değiştirilebilir), multi-tenant, migration-first (rakip sistemden audit'i koruyarak taşınabilir) ve compliance-gömülü (eIDAS/KVKK/GDPR/5070/ESIGN) kurulur.

---

## **2\. Konumlandırma: "Agreement OS", "Contract + Signature" Değil**

Bu bölüm ürünün neden bir e-imza aracı veya klasik CLM olmadığını, aktör ve yetenek düzeyinde ayrıştırır. Ayrım önemlidir çünkü her yaklaşım farklı bir domain modeli ve farklı bir değer vaadi doğurur.

Aşağıdaki tablo üç yaklaşımın kapsamını ve bu ürünün nerede durduğunu karşılaştırır; satırlar bir sözleşmenin yaşam döngüsündeki aşamaları, sütunlar yaklaşımın o aşamayı nasıl ele aldığını gösterir.

| Yaşam döngüsü aşaması | E-imza aracı (DocuSign/PandaDoc) | Klasik CLM (Ironclad/Conga) | Agreement OS (bu ürün) |
|---|---|---|---|
| Üretim (drafting) | Şablon + alan doldurma | Şablon kütüphanesi + clause library | Doküman kompozisyonu + AI drafting + playbook |
| Risk okuma | Yok | Sınırlı (manuel review) | AI risk skorlama + missing-clause + policy engine |
| Müzakere | Yok (yalnız gönder-imzala) | Redline + versiyon | Negotiation copilot (redline/fallback/stance/battlecard) |
| Onay | Yok / basit | Çok-adımlı approval workflow | Policy-as-code PDP + onay akışı |
| İmza | Ana yetenek (SES/AES) | Dış imza entegrasyonu | Provider-agnostik SES/AES/QES + PAdES/XAdES/CAdES |
| Arşiv + kanıt | İmza sertifikası | Repository + audit log | Tamper-evident evidence vault + LTV + legal hold |
| Yükümlülük | Yok | Sınırlı hatırlatma | Birinci-sınıf obligation graph + revenue-leakage önleme |
| Entegrasyon | Sınırlı | Orta | Integration Hub + ERP/CRM/HR/procurement + migration bridge |
| Veri varlığı | Belge (blob) | Metadata + belge | İşletilebilir agreement graph (sorgulanabilir) |

Kritik konumlandırma cümlesi: **sözleşme bir çıktı değil, bir veri varlığıdır.** Bir sözleşme imzalanınca iş bitmez; asıl değer o andan sonra başlar — yükümlülükler devreye girer, yenileme penceresi işler, riskler izlenir, kanıt saklanır. E-imza aracı imzada durur; klasik CLM belgede durur; Agreement OS sözleşmeyi işletilebilir kılıp değeri yaşam döngüsünün tamamına yayar.

---

## **3\. Domain Modeli — Agreement Graph**

### **3.1 Merkezi kavram: Contract düz tablo değil, grafiktir**

Domain modelinin çekirdeği, sözleşmeyi "PDF" veya "birkaç metadata alanı" olmaktan çıkarıp bir **agreement graph**'a çeviren `archetype-agreement`'tır. Bir sözleşme; tarafları, maddeleri, yükümlülükleri, riskleri, tarihleri, ödemeleri, onayları, imzaları, kanıtları, ekleri ve bağlı dış kayıtları (CRM/ERP) olan bir varlık kümesinin köküdür. Bu grafiğin her düğümü kendi archetype/fragment'ine ve her alanı atomik bir tipe (`Money`, `DateRange`, `Term`, `Recurrence`, `PartyRef`, `ClauseRef`, `AssetRef`, `Percentage`, `EnumType`) oturur; grafiğin gücü, altındaki atomların sözleşmesinden gelir (bkz. `atom-archetype-bagi-clm-ornegi-2026-07-01.md`).

Aşağıdaki şema agreement grafiğin ana düğümlerini ve bağlarını gösterir; Contract kök düğümdür, altındaki her düğüm ayrı bir archetype/fragment'tir.

```
                              ┌──────────────┐
                              │   Tenant     │  (organizasyon = kiracı)
                              └──────┬───────┘
                                     │ tenant_id (her tabloda) + RLS
                                     ▼
                            ┌─────────────────┐
                            │    Contract     │  = archetype-agreement (kök)
                            │  (agreement)    │
                            └────────┬────────┘
        ┌───────────────┬───────────┼───────────┬───────────────┐
        ▼               ▼           ▼           ▼               ▼
   ┌─────────┐    ┌──────────┐ ┌──────────┐ ┌─────────┐   ┌──────────┐
   │ Parties │    │ Clauses  │ │Obligation│ │  Risks  │   │  Dates   │
   │(PartyRef│    │(ClauseRef│ │(k-oblig.)│ │(score % │   │(DateRange│
   │ + rol)  │    │ +sürüm)  │ │          │ │ + PDP)  │   │ /Term)   │
   └─────────┘    └──────────┘ └──────────┘ └─────────┘   └──────────┘
        ▼               ▼           ▼           ▼               ▼
   ┌─────────┐    ┌──────────┐ ┌──────────┐ ┌─────────┐   ┌──────────┐
   │Payments │    │Approvals │ │Signatures│ │Evidence │   │Attachments│
   │(Money + │    │(PDP/     │ │(k-signat.│ │(k-evid. │   │(AssetRef  │
   │ Duration│    │ workflow)│ │ SES/AES/ │ │ hash-   │   │ +checksum │
   │ +%)     │    │          │ │ QES)     │ │ chain)  │   │ k-storage)│
   └─────────┘    └──────────┘ └──────────┘ └─────────┘   └──────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │     Linked      │  (ExternalId / EntityRef)
                            │ CRM deal / ERP  │  → i14y idempotent kimlik
                            │ vendor / HR / PO│
                            └─────────────────┘
```

### **3.2 Contract (kök) — agreement grafiğin alanları**

`archetype-agreement`, CLM'in merkezi archetype'ıdır: sözleşmeyi işletilebilir veri grafiğine çevirir. Aktör-açık ifadeyle, sözleşme sahibi (hukuk/satış/procurement) alanları tanımlar veya AI çıkarımını onaylar; motor atom sözleşmesinden projeksiyonu (DB kolonu, doğrulama, API tipi, form widget'ı, arama indeksi) türetir.

Aşağıdaki tablo Contract kök düğümünün alanlarını, taşıyıcı atomik tipini ve motorun ondan ne türettiğini tanımlar; örnek/mock değer verilmez, yalnız alan→tip→amaç yapısı gösterilir.

| Alan | Atomik tip | Amaç (motor türetimi) |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik + kiracı izolasyonu (RLS); string'e sıkıştırma yasak |
| `title` | `I18nText` | Çok-dilli sözleşme başlığı; fallback + şema değişmeden dil ekleme |
| `contract_type` | `EnumType` | Sözleşme türü (NDA/satış/kira/tedarik/iş/hizmet); teknik-kimlik + dile-özel alias |
| `status` | `EnumType` | Yaşam döngüsü: draft→review→negotiation→approval→signature→active→renewal→terminated |
| `parties` | `PartyRef[]` | Taraflar; `k-party`'ye tipli referans (müşteri/tedarikçi/iç) + rol bağlamı |
| `effective_range` | `DateRange` | Yürürlük penceresi (başlangıç-bitiş); çakışma/kapsama sorgusu; açık/kapalı uç |
| `term` | `Term` | Sözleşme süresi ("2 yıl münhasırlık"); yenileme hesabının tabanı |
| `notice_period` | `Duration` | İhbar süresi ("60 gün"); iş-günü farkındalığı |
| `renewal_rule` | `Recurrence` (RRULE) | Yenileme kuralı (yıllık auto-renew); sonraki tarih üretimi |
| `total_value` | `Money` | Sözleşme değeri (değer+kur+precision+rounding); float yasağı; empty≠zero |
| `payment_terms` | `Duration` + `Money` + `Percentage` | Ödeme vadesi (net-60) + tutar + gecikme cezası oranı |
| `governing_law` | `EnumType` (jurisdiction) | Uygulanacak hukuk; çok-yargı kuralı; eIDAS/5070 çerçeve seçimi |
| `risk_score` | `Percentage` | Politika-bazlı risk skoru; 0-100 taban; Computation'dan türetilir |
| `clauses` | `ClauseRef[]` | Maddeler; clause-library'ye referans; sürüm; standart/alternatif/yasak |
| `obligations` | `EntityRef` → `k-obligation` | Yükümlülük grafiğine bağ (m2m); taahhüt yaşam döngüsü orada |
| `signatures` | `EntityRef` → `k-signature` | İmza akışına bağ (SES/AES/QES) |
| `evidence` | `EntityRef` → `k-evidence` | Kanıt kasasına bağ (append-only, hash-chain) |
| `attachments` | `AssetRef[]` | Ekler; `k-storage` `digital_asset.id`+checksum; binary DB'de değil |
| `linked_records` | `ExternalId` / `EntityRef` | CRM fırsatı / ERP tedarikçi / HR / PO idempotent kimlik eşlemesi |
| `created_at`, `updated_at` | `timestamptz` | Tz-aware instant; audit |

### **3.3 Grafiğin alt-varlıkları — kendi archetype/fragment'leri**

Agreement grafiği düz bir tablo değildir; her alt-varlık kendi archetype/fragment'idir ve kendi atomlarına dayanır. Aşağıdaki tablo her alt-varlığı taşıyıcı atomlarına ve o varlığın CLM'deki rolüne bağlar.

| Alt-varlık | Kritik atomik/referans tipler | CLM'deki rolü |
|---|---|---|
| **Party** (taraf) | `PartyRef`, `PersonName`, `Address`, `TaxId`, `NationalId` (PII), `Email`, `PhoneNumber` | Taraf kimliği + KVKK/GDPR field-level şifreleme (NationalId PII-yüksek) |
| **Clause** (madde) | `ClauseRef`, `I18nText`, `EnumType` (standart/alternatif/yasak) | Madde kütüphanesi + playbook (PDP) kontrolü; kopyalama değil referans |
| **Obligation** (yükümlülük) | → `k-obligation` (Duration/Recurrence/Money/Percentage/PartyRef) | Ödeme/teslim/yenileme/ihbar/SLA/ceza; birinci-sınıf durumlu nesne |
| **Risk** | `Percentage`, `EnumType`, `ClauseRef` | Risk skoru + eksik-madde + politika ihlali; PDP ile denetlenir |
| **Date** (tarih) | `DateRange`, `Term`, `Duration`, `timestamptz` | Yürürlük/yenileme/ihbar/fesih penceresi hesabı |
| **Payment** (ödeme) | `Money`, `DateRange`, `Duration`, `Percentage` | Vade + tutar + gecikme cezası; empty≠zero; kur karışımı reddi |
| **Approval** (onay) | `EnumType`, `PartyRef`, PDP referansı | Çok-adımlı onay akışı; policy-as-code karar noktası |
| **Signature** (imza) | → `k-signature` (`SignatureField`, `AssetRef`, `EnumType` SES/AES/QES) | İmza alanı yerleşimi + hukuki seviye + render edilen doküman referansı |
| **Evidence** (kanıt) | → `k-evidence` (`bytea-ref` hash, RFC 3161 timestamp, cert chain) | Tamper-evidence + LTV; hukuki delil değeri |
| **Attachment** (ek) | `AssetRef` | Binary `k-storage`'da; DB'de yalnız referans+checksum |
| **Linked** (bağlı kayıt) | `ExternalId`, `EntityRef` | CRM/ERP/HR/procurement bağı; idempotent kimlik eşleme |

### **3.4 Neden grafik: atom zayıfsa ne kırılır**

Grafik modelinin gerekçesi somuttur: sözleşmeyi düz metin/blob olarak tutan bir sistem yükümlülük izleyemez, yenileme hesaplayamaz, riski sorgulayamaz. Her alan yanlış atoma sıkıştırıldığında belirli bir ürün işlevi sessizce çöker. Aşağıdaki tablo bu bağı kanıtlar; bu, "sözleşme = veri varlığı" iddiasının domain modelinden başladığını gösterir.

| Zayıf/yanlış modelleme | CLM'de ne kırılır (somut) | Kimin parası/riski |
|---|---|---|
| `total_value` düz `currency` | 60.000 EUR + 60.000 TRY toplanır; yanlış sözleşme değeri/ceza | Finans — sessiz para kaybı |
| `DateRange`/`Term` yok | Yenileme/fesih penceresi hesaplanamaz → auto-renew kaçar veya istenmeden yenilenir | Gelir kaçağı — ürünün ana vaadi |
| `Duration` yok (düz `integer` gün) | "60 gün ihbar" iş-günü mü takvim mi belirsiz → ihbar süresi kaçar | Hukuki — sözleşme istenmeden uzar |
| `Recurrence` (RRULE) yok | Yıllık yenileme/aylık rapor el ile → ölçekte kaçar | Operasyon — yükümlülük düşer |
| `ClauseRef`/`PartyRef` yok | Madde/taraf kopyalanır, kütüphaneye bağlanmaz → playbook (PDP) kontrol edemez | Hukuk — risk politikası çalışmaz |
| `AssetRef` düz `file` | Binary DB'ye gömülür veya URL sızar; imzalanan doküman referansı çözülmez | Güvenlik + maliyet |
| `bytea-ref`/`timestamp` yok | İmza hash'i/zaman-damgası tipsiz → tamper-evidence ve LTV yok | Hukuki — delil değeri taşımaz (eIDAS kaçar) |
| `NationalId`/`TaxId` PII sınıfı yok | Kimlik düz `string`; alan-düzeyi şifreleme/maskeleme yok | KVKK/GDPR ihlali — PII sızıntısı |

---

## **4\. Fonksiyonel Olmayan Gereksinimler (NFR)**

Bu bölüm ürünün kalite ve mimari sınırlarını sabitler. NFR'ler ürünün kurumsal (enterprise) ve hukuki-delil taşıyan doğası gereği pazarlık konusu değildir; her biri bir CI kapısına veya test-zorunlu invariant'a bağlanır.

Aşağıdaki tablo kategori başına gereksinimi ve neden zorunlu olduğunu tanımlar; belirsiz sıfat yerine ölçülebilir kriter verilir.

| Kategori | Gereksinim |
|---|---|
| **Multi-tenancy** | Tam satır-düzeyi tenant izolasyonu: her tabloda zorunlu `tenant_id`; uygulama katmanında otomatik tenant filtresi; fail-closed (bağlam yoksa istek reddedilir) |
| **RLS** | PostgreSQL Row-Level Security ikinci savunma hattı: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`; DB seviyesinde sızıntıya karşı bariyer |
| **Yetkilendirme** | RBAC (rol) + ABAC (öznitelik; kategori/matter-scoped) + ReBAC (ilişki; "bu sözleşmenin karşı tarafı") üç model; erişim kararı PDP'de (policy-as-code), app'te dağınık değil |
| **Kimlik ve güvenlik** | MFA (çok-faktör) + SSO/SAML (kurumsal oturum) + SCIM (otomatik kullanıcı sağlama/kaldırma); OWASP Top 10; rate limiting; parola bcrypt |
| **Compliance** | eIDAS (AB e-imza/güven), KVKK (Türkiye kişisel veri), GDPR (AB veri koruma), 5070 (Türkiye Elektronik İmza Kanunu) + BTK-yetkili ESHS, ESIGN/UETA (ABD e-imza) — gömülü, sonradan-eklenti değil |
| **Provider-agnostic** | İmza/AI/depolama/iş-akışı/OCR/bildirim/zaman-damgası sağlayıcısı `k-provider-adapter` port'undan çözülür; tenant kendi hesabını bağlar (Bring Your Own Provider); sağlayıcı değişimi kod değişmeden |
| **Headless-first** | Her yetenek önce API (GraphQL/REST); UI bir tüketicidir. Counterparty portal, embedded imza, developer platform hep aynı API'yi tüketir |
| **Migration-first** | Rakip sistemden (DocuSign/Adobe Sign/PandaDoc/Zoho/legacy CLM) sözleşme + imza + kanıt + audit **kaybetmeden** taşınabilir (`k-migration-bridge`); idempotent, dry-run, rollback |
| **Data-residency** | Veri ikamet bölgesi tenant/jurisdiction başına seçilebilir (AB verisi AB'de, TR verisi TR'de); depolama ve KMS bölge-farkında |
| **KMS** | Secret (imza sağlayıcı anahtarı, API key, özel anahtar) asla inline saklanmaz; yalnız KMS referansı (`secret_ref`) taşınır; ham secret log/audit/cevaba sızamaz |
| **Audit (append-only)** | Her mutasyon (oluştur/gönder/imzala/onayla/void) append-only audit'e düşer (kim/ne/ne zaman); ayrıca hukuki delil `k-evidence`'a WORM olarak yazılır — ikisi ayrı eksen |
| **Performans** | Sözleşme listesi API p95 < 300ms; 100k+ sözleşmeyle sayfalama/filtreleme (cursor-based); N+1 sorgu yasak; ağır iş (imza akışı, batch import, AI çıkarımı) worker'a offload |
| **Dayanıklılık** | Sağlayıcı çağrısında fallback zinciri + circuit breaker; retry+backoff; idempotency-key (non-idempotent yetenekte); dead-letter queue |
| **Uluslararasılaşma** | TR + EN taban (i18n); locale-aware tarih/para/sayı (CLDR); RTL desteği; çoklu para birimi; hukuki terim çeviri tutarlılığı |
| **Erişilebilirlik** | WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); klavye navigasyonu; kontrast ≥ 4.5:1; dokunmatik hedef ≥ 44px |
| **AI güvenlik** | Değiştirilemez invariant: AI önerir → insan onaylar → motor uygular. AI imza gönderemez, QES seçemez, yükümlülük kapatamaz, kanıt yazamaz, kendi AI-sağlayıcı binding'ini değiştiremez |
| **Gözlemlenebilirlik** | Yapısal log (structlog), dağıtık trace (OpenTelemetry), iş metrikleri; hata formatı `{code, message, trace_id, details}`; `print()` yasak |
| **Test kapsamı** | Backend ≥ %80 birim; kritik akışlar (imza, yükümlülük, kanıt, tenant izolasyon) E2E + ≥10 negatif tenant/guardrail case; test-önce (kırmızı→yeşil) |

**Stack sınırı (mutlak):** Backend FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL; frontend Vite + React + TanStack Router/Query; stil SCSS + token; ikon Phosphor. **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

---

## **5\. Uygulama / Modül Matrisi (12 Modül)**

Ürün, ortak kernel/archetype/surface katmanı üstünde 12 uygulama modülüne ayrılır. Her modül bağımsız değer üretir ama aynı agreement grafiği ve aynı kernel primitiflerini paylaşır — bu, "her modül kendi imza motorunu/kanıt defterini yeniden yazmaz" ilkesinin sonucudur. Aktör-açık ifadeyle her modülün bir birincil kullanıcısı (hukuk/finans/satış/procurement/IT/geliştirici) ve bir rakip karşılığı vardır.

Aşağıdaki tablo 12 modülü, ne işe yaradığını, birincil aktörünü ve rakip karşılığını listeler; sıralama yaklaşık yaşam-döngüsü akışını izler.

| # | Modül | Ne işe yarar | Birincil aktör | Rakip karşılığı |
|---|---|---|---|---|
| 1 | **CLM Core** | Sözleşme yaşam döngüsü orkestrasyonu: draft→review→negotiation→approval→signature→active→renewal→terminated; agreement graph CRUD; durum makinesi | Hukuk / sözleşme yöneticisi | DocuSign CLM, Ironclad, Conga çekirdeği |
| 2 | **E-Signature** | Provider-agnostik imza orkestrasyonu: çok-taraflı sıralı/paralel imza, alan yerleşimi, SES/AES/QES, PAdES/XAdES/CAdES, RFC 3161, e-Seal | İmzalayan / sözleşme sahibi | DocuSign eSignature, PandaDoc, Dropbox Sign |
| 3 | **Document Automation** | Şablon + clause library'den sözleşme üretimi; koşullu blok; veri-birleştirme (merge); versiyonlama; standart/alternatif madde | Hukuk / satış | PandaDoc, Conga Composer, DocuSign Gen |
| 4 | **AI Contract Review** | Intake: sınıflandırma, taraf/madde/yükümlülük/tarih çıkarımı, risk skorlama, eksik-madde (missing-clause) tespiti | Hukuk / risk | Ironclad AI, Evisort, LinkSquares, Kira |
| 5 | **Obligation Management** | Sözleşme taahhütlerini birinci-sınıf, durumlu nesneye çevirme; vade + lead-time hatırlatma; ihlal eskalasyonu; iş-günü farkında vade | Finans / operasyon | Ironclad obligations, SirionLabs |
| 6 | **Renewal & Revenue Leakage** | Yenileme/fesih penceresi yönetimi; ihbar vadesi geri-sayımı; sessiz auto-renew / kaçan fesih erken-uyarı; gelir kaçağı önleme | Finans / satış | Ironclad renewals, LinkSquares |
| 7 | **Counterparty Portal** | Karşı tarafın dış-kullanıcı olarak sözleşmeyi görüntülediği, müzakere ettiği, imzaladığı, ek yüklediği güvenli portal | Karşı taraf (dış) | DocuSign Rooms, PandaDoc portal, Juro |
| 8 | **Legal Knowledge Base** | Clause library + playbook + fallback pozisyonları + standart şablon deposu; hukuki bilgi tek-kaynak | Hukuk | Ironclad clause library, LexCheck |
| 9 | **Agreement Analytics** | Portföy geneli sözleşme metrikleri: değer, risk dağılımı, yenileme takvimi, döngü süresi (cycle time), yükümlülük durumu | Yönetim / hukuk ops | Ironclad Insights, Conga analytics |
| 10 | **Integration Hub** | ERP/CRM/HR/procurement bağı; yükümlülük ve sözleşme verisini dış sistemlere itme/çekme; provider binding yönetimi | IT / entegrasyon | Ironclad integrations, Workato konnektörleri |
| 11 | **Migration Bridge** | Rakip/legacy sistemden sözleşme + imza + kanıt + audit'i koruyarak içe-aktarım; idempotent, dry-run, rollback | IT / geçiş ekibi | (çoğu rakipte zayıf/manuel — ayrışma noktası) |
| 12 | **Developer Platform** | Headless API (GraphQL/REST), webhook, embedded imza SDK, custom archetype/surface; ürünü platform olarak tüketme | Geliştirici (iç/dış) | DocuSign API/Connect, PandaDoc API |

**Ortak katman notu:** 12 modülün hiçbiri kendi imza motorunu (`k-signature`), kanıt defterini (`k-evidence`), yükümlülük yaşam-döngüsünü (`k-obligation`), sağlayıcı erişimini (`k-provider-adapter`), içe-aktarımını (`k-migration-bridge`) veya legal hold'unu (`k-legal-hold`) yeniden yazmaz; hepsi kernel primitiflerini tüketir. Modül = iş yeteneği; kernel = ortak altyapı sözleşmesi.

---

## **6\. E-İmza Seviyeleri ve Güven Hizmetleri**

E-imza, sözleşmeyi hukuki bağlayıcılığa taşıyan adımdır ve `k-signature` primitifi tarafından provider-agnostik orkestre edilir. Kritik sınır: ürün bir QTSP (Qualified Trust Service Provider) **değildir** ve olmayacaktır — nitelikli sertifika ve nitelikli zaman-damgası dış yetkili sağlayıcıdan (BTK-yetkili ESHS / eIDAS QTSP) `k-provider-adapter` üzerinden tüketilir. Aktör-açık ifadeyle: AI imza işini (alan yerleşimi, özet) önerir; insan imzaya-gönderme/sıra/QES-seviye kararını onaylar ve nitelikli imzayı bizzat atar; motor onaylı akışı deterministik yürütür.

### **6.1 eIDAS üç seviye**

Aşağıdaki tablo eIDAS'ın üç hukuki imza seviyesini, teknik karşılığını ve tipik kullanımını tanımlar; seviye yükseldikçe hukuki güç ve sağlayıcı gereksinimi artar.

| Seviye | Açılım | Teknik karşılık | Tipik kullanım |
|---|---|---|---|
| **SES** | Simple Electronic Signature | Email/SMS-OTP doğrulama + niyet kaydı | Düşük-risk onay, iç doküman |
| **AES** | Advanced Electronic Signature | Sertifika-tabanlı, imzalayana benzersiz bağlı, değişiklik-tespitli | Ticari sözleşme, orta-risk |
| **QES** | Qualified Electronic Signature | Nitelikli sertifika (QTSP/ESHS) + güvenli imza aracı; el-imzası eşdeğeri | Yüksek-değer, yasal-zorunlu, kamu |

**Seviye kapısı (test-zorunlu):** `level=qes` yalnız nitelikli sertifika sunan (BTK-yetkili ESHS / eIDAS QTSP) sağlayıcıyla ilerleyebilir; nitelikli-olmayan sağlayıcıya QES istemek `LevelNotSupportedError` fırlatır. QES seçimi (el-imzası eşdeğeri, hukuki sonuç) yalnız insan onayına bağlıdır; AI tek başına QES seçemez.

### **6.2 İmza formatları, zaman-damgası ve uzun-dönem doğrulama**

İmza yalnız atılmaz; doğru formatta gömülür, zaman-damgalanır ve ileride sertifika süresi dolsa bile doğrulanabilir kılınır. Aşağıdaki tablo format ve güven-hizmeti bileşenlerini tanımlar.

| Bileşen | Açılım / standart | Ne yapar |
|---|---|---|
| **PAdES** | PDF Advanced Electronic Signatures | İmzayı PDF içine gömer (sözleşme tipik) |
| **XAdES** | XML Advanced Electronic Signatures | İmzayı XML üzerine gömer (e-fatura, yapılandırılmış) |
| **CAdES** | CMS Advanced Electronic Signatures | İmzayı CMS/genel binary'ye gömer |
| **RFC 3161** | Time-Stamp Protocol | Nitelikli zaman-damgası (TSA): "bu hash bu andan önce vardı" kanıtı |
| **LTV** | Long-Term Validation | Sertifika zinciri + iptal kanıtı (CRL/OCSP) + zaman-damgası birlikte gömülür; sertifika süresi geçse bile "imza anında geçerliydi" doğrulanabilir |
| **LTA** | Long-Term Archival | LTV + arşiv zaman-damgası; uzun-dönem arşiv doğrulanabilirliği |

**Format uyumu (test-zorunlu):** `format` doküman `content_type` ile uyumlu olmalı; PDF olmayan dokümana PAdES istemek `FormatMismatchError` fırlatır. Kanıt (imzalayan, an, IP/oturum, sertifika parmak-izi, zaman-damgası) imza tamamlanınca `k-evidence`'a append-only yazılır; `k-signature` kendi kanıt deposunu tutmaz.

### **6.3 Türkiye 5070 + BTK**

Türkiye jurisdiction'ında imza, 5070 sayılı Elektronik İmza Kanunu ve BTK-yetkili ESHS (Elektronik Sertifika Hizmet Sağlayıcısı) çerçevesine uyar. `jurisdiction=tr5070` seçildiğinde nitelikli imza yalnız BTK-yetkili ESHS ile ilerler; seviye kapısı eIDAS QES'in Türkiye karşılığını uygular. Ürün ESHS *olmaz*, yetkili ESHS'yi provider olarak tüketir.

---

## **7\. AI-First: Intake, Drafting, Negotiation, Policy Engine**

AI, ürünün #1 önceliğidir ama tek bir değiştirilemez invariant'a bağlıdır: **kullanıcı niyet söyler → AI önizler/önerir (uygulamaz) → insan onaylar → motor uygular.** AI bir sözleşmeyi imzaya gönderemez, QES seçemez, yükümlülük kapatamaz, kanıt yazamaz, main branch'e push edemez ve kendi AI-sağlayıcı binding'ini değiştiremez (self-modifying yasak). AI'ın ürettiği hiçbir metin hukuki delil sayılmaz.

### **7.1 Intake (okuma / çıkarım)**

Intake, ham bir sözleşme belgesini yapılandırılmış agreement grafiğine çeviren AI katmanıdır. Aktör-açık: AI çıkarır ve `draft` işaretler; insan onaylar; onaysız hiçbir çıkarım grafiğe yazılmaz.

Aşağıdaki tablo intake yeteneklerini ve her birinin autonomy sınırını tanımlar.

| Intake yeteneği | Ne yapar | Autonomy |
|---|---|---|
| **Classification** | Sözleşme türünü sınıflandırır (NDA/satış/kira/tedarik/iş) | `draft` (öneri) |
| **Party extraction** | Tarafları ve rollerini metinden çıkarır (`PartyRef` adayı) | `draft` |
| **Clause extraction** | Maddeleri çıkarır, clause-library'ye eşler (standart/alternatif/yasak) | `draft` |
| **Obligation extraction** | Yükümlülükleri çıkarır (`ObligationDraft`, `origin=ai_extracted`, `clause_ref`+güven skoru) | `draft`; onaysız alarm üretmez |
| **Date extraction** | Yürürlük/yenileme/ihbar/fesih tarihlerini çıkarır | `draft` |
| **Risk scoring** | Politika-bazlı risk skoru üretir (0-100); riskli maddeleri işaretler | `draft` (öneri; karar insan) |
| **Missing-clause** | Playbook'a göre eksik/beklenen maddeleri tespit eder | `draft` |

### **7.2 Drafting (üretim)**

Drafting, şablon + clause library + veri-birleştirmeyle sözleşme üreten katmandır; `archetype-document-composition` tarafından yürütülür. AI taslak metin ve madde önerir; hukuk sahibi onaylar; imzalanacak doküman `k-signature`'a `AssetRef` olarak devredilir. AI şablon derlemeyi/birleştirmeyi *önerir*, doğrudan yayınlamaz.

### **7.3 Negotiation copilot (müzakere)**

Negotiation copilot, karşı taraf redline'larına yanıt üreten AI katmanıdır. Aşağıdaki tablo copilot yeteneklerini ve autonomy'sini tanımlar; hepsi öneri seviyesindedir, kabul insan kararıdır.

| Copilot yeteneği | Ne yapar | Autonomy |
|---|---|---|
| **Redline** | Karşı taraf değişikliğine karşı-öneri (markup) üretir | `draft` |
| **Fallback** | Playbook'taki fallback pozisyonlarını sıralar ("ideal → kabul edilebilir → kırmızı çizgi") | `draft` |
| **Stance** | Bir maddenin kabul/red/müzakere duruşunu (stance) önerir | `draft` |
| **Battlecard** | Sık müzakere edilen maddeler için hazır argüman kartı sunar | `draft` |

### **7.4 Policy engine (policy-as-code → PDP)**

Policy engine, hukuki playbook'u makine-uygulanabilir politikaya (policy-as-code) çeviren ve erişim/onay/madde kararını bir PDP'de (Policy Decision Point) veren katmandır. Bir maddenin standart mı/alternatif mi/yasak mı olduğu, bir onayın gerekip gerekmediği, bir aktörün bir maddeyi değiştirip değiştiremeyeceği PDP'de karara bağlanır — app'te dağınık `if` dallarıyla değil. Aktör-açık: AI politika *önerir*; insan politikayı *kilitler*; PDP kararı deterministik *verir*; AI PDP kararını override edemez.

---

## **8\. Geliştirme Fazları (Faz 1 → Faz 7)**

Fazlar üst üste inşa edilir; her faz **kapsam → gereksinimler → teslim edilebilirler → kabul kriterleri** taşır. MVP = Faz 1 + Faz 2 (Contract Kernel + Signature/Evidence). Fazlama katıdır: kernel primitifleri önce kilitlenir, modüller sonra tüketir; atom katmanı (Money/DateRange/Term/Recurrence/PartyRef/ClauseRef/AssetRef) test-önce hazır olmadan agreement archetype "hazır" sayılmaz.

---

### **FAZ 1 — Contract Kernel (Temel + Agreement Graph)**

**Kapsam:** Multi-tenant temel, kimlik, agreement grafiğin çekirdeği, doküman kompozisyonu iskeleti.

**Gereksinimler**
- Mono-repo, Docker Compose (Postgres + Redis + MinIO + backend + frontend); FastAPI iskeleti, OpenAPI, structlog
- SQLAlchemy async + Alembic; `Tenant`, `User`, `Role`, `k-party` modelleri; RLS + `tenant_id` base mixin
- Kimlik: JWT + refresh, RBAC temel; MFA/SSO/SAML/SCIM hazırlığı (Faz 2'de tamamlanır)
- Atom katmanı kilidi (test-önce): `Money`, `DateRange`, `Term`, `Duration`, `Recurrence`, `Percentage`, `PartyRef`, `ClauseRef`, `AssetRef`, `EnumType`, `ExternalId`
- `archetype-agreement` (Contract kök) + alt-varlıklar (Party/Clause/Date/Payment); agreement graph CRUD (liste/filtre/cursor-sayfalama/detay)
- `archetype-document-composition` iskeleti (şablon + alan-birleştirme; clause library temeli)
- Frontend: React iskeleti, TanStack Router/Query, JWT interceptor, sözleşme liste/detay/form yüzeyi (config-driven)

**Teslim edilebilirler:** Çok-kiracılı, kimlik doğrulamalı sözleşme oluşturma/düzenleme; agreement grafiğin kök + temel alt-varlıkları.
**Kabul kriterleri:** Kullanıcı bir sözleşme (tür+taraf+tarih+değer) oluşturabilir; iki tenant birbirinin sözleşmesini göremez (RLS testi geçer); liste 100k sözleşmede p95 < 300ms.

---

### **FAZ 2 — Signature & Evidence (İmza + Kanıt)**

**Kapsam:** Provider-agnostik imza orkestrasyonu ve tamper-evident kanıt kasası — ürünün hukuki-bağlayıcılık çekirdeği.

**Gereksinimler**
- `k-provider-adapter` port/adapter iskeleti (`SignaturePort` + binding + `secret_ref` KMS); BYO imza sağlayıcı
- `k-signature`: `signature_request` + `signer` + `signature_field`; SES/AES/QES seviye kapısı; PAdES/XAdES/CAdES; sequential/parallel/group mod; alıcı kimlik doğrulama (email/sms-otp/mfa/sso/eid); embedded imza + bulk-send
- `k-evidence`: `evidence_record` + hash-chain + WORM append-only (DB+uygulama+politika); RFC 3161 TSA istemcisi; LTV (cert+CRL/OCSP+timestamp); `audit_certificate` (PDF + verification_url)
- MFA/SSO/SAML/SCIM tamamlanır; audit append-only her mutasyonda
- Frontend: imza akışı kurgu ekranı, alan yerleşim editörü (sürükle-bırak), embedded imza deneyimi, kanıt zaman-çizelgesi + zincir bütünlük göstergesi

**Teslim edilebilirler:** Uçtan uca imza akışı + kurcalanamaz kanıt; sözleşme imzalanır ve mühürlenir.
**Kabul kriterleri:** Doküman imzaya sokulur → sıra/mod/kimlik-doğrulama ile imzacılar eklenir → seviye-uygun sağlayıcıyla imzalanır → PAdES/XAdES/CAdES gömülür → kanıt `k-evidence`'a yazılır → `audit_certificate` üretilir; geçmiş kayıt değişimi `broken_at` ile tespit edilir; AI QES/send yapamaz (test-kanıtlı).

---

### **FAZ 3 — Obligation & Renewal (Yükümlülük + Yenileme)**

**Kapsam:** Ürünün asıl değer motoru — yükümlülük yaşam döngüsü ve gelir kaçağı önleme.

**Gereksinimler**
- `k-obligation`: `obligation` + `obligation_alert`; tür taksonomisi (payment/delivery/renewal/notice/sla/penalty/reporting/milestone); durum makinesi (draft→pending→upcoming→due→met|breached|waived)
- İş-günü farkında vade (`business_day_mode`); alarm motoru (`lead_time` + vade hatırlatma, `k-worker`'a enqueue); ihlal eskalasyonu (grace sonrası artan-şiddet)
- Yenileme yöneticisi: `effective` + `notice_period` + `renewal_mode`; sessiz auto-renew / kaçan fesih erken-uyarı (revenue leakage)
- Tekrarlı taahhüt (`recurrence` RRULE) idempotent üretimi; met/breached/waive yalnız insan onayı (`approval_ref`)
- `k-worker` (task queue): hatırlatma taşıma, retry+backoff, dead-letter, zamanlanmış tarama
- Frontend: yükümlülük panosu/takvimi, alarm/eskalasyon görünürlüğü, yenileme yöneticisi paneli (ihbar geri-sayımı)

**Teslim edilebilirler:** Sözleşmeden doğan taahhütlerin izlenmesi, hatırlatılması ve yenileme penceresinin yönetimi.
**Kabul kriterleri:** Sözleşme aktifleşir → taahhütler tanımlanır → lead-time hatırlatması üretilir → ihlalde eskalasyon → yenileme penceresi ihbarı; ihbar vadesi kaçmadan kritik uyarı üretilir; AI yükümlülük kapatamaz.

---

### **FAZ 4 — AI Contract Review (Intake + Risk)**

**Kapsam:** Sözleşmeyi okuyan AI katmanı: sınıflandırma, çıkarım, risk skorlama, eksik-madde.

**Gereksinimler**
- `k-provider-adapter` `AiPort` (BYO AI/LLM: OpenAI/Azure/Anthropic/yerel); AI kendi binding'ini değiştiremez (autonomy none)
- Intake: classification, party/clause/obligation/date extraction (hepsi `draft`, güven skorlu); risk scoring (Percentage); missing-clause (playbook karşılaştırma)
- Onay kuyruğu: AI çıkarımı `draft` → insan onayı → grafiğe yazım; auto-approval eşiği (opsiyonel, insan-tanımlı)
- Frontend: AI öneri paneli (çıkarım vurgusu + güven skoru), onay/red akışı, risk göstergesi, maliyet/token izleme

**Teslim edilebilirler:** Ham sözleşmeden yapılandırılmış grafiğe AI-destekli çıkarım + risk okuma.
**Kabul kriterleri:** Bir sözleşme yüklenir → AI türü/taraf/madde/yükümlülük/tarih çıkarır → risk skoru + eksik-madde raporu üretir → çıkarımlar onay kuyruğuna düşer; onaysız hiçbir çıkarım grafiğe yazılmaz.

---

### **FAZ 5 — Negotiation & Knowledge Base (Müzakere + Playbook)**

**Kapsam:** Müzakere copilot'u, clause library, playbook ve policy engine.

**Gereksinimler**
- `Legal Knowledge Base`: clause library (standart/alternatif/yasak), playbook, fallback pozisyonları, şablon deposu
- Negotiation copilot: redline, fallback, stance, battlecard (hepsi `draft`)
- Policy engine: policy-as-code → PDP; madde standart/alternatif/yasak kararı; onay-gerekli kararı; ReBAC (karşı-taraf ilişkisi)
- Versiyonlama: sözleşme + madde sürüm karşılaştırması (diff/redline görünümü)
- Frontend: müzakere ekranı (redline diff), clause library gezgini, playbook editörü, fallback öneri paneli

**Teslim edilebilirler:** Karşı taraf redline'larına AI-destekli yanıt + playbook-kontrollü madde yönetimi.
**Kabul kriterleri:** Karşı taraf bir maddeyi değiştirir → copilot fallback/karşı-öneri sunar → policy engine yasak maddeyi işaretler → insan kabul/red kararı verir; AI politikayı değiştiremez.

---

### **FAZ 6 — Counterparty Portal & Integration Hub (Dış Taraf + Entegrasyon)**

**Kapsam:** Karşı taraf portalı ve ERP/CRM/HR/procurement entegrasyonu.

**Gereksinimler**
- `Counterparty Portal` (`surface-counterparty`): dış-kullanıcı güvenli erişim (scoped); sözleşme görüntüleme, müzakere, imza, ek yükleme; ReBAC izin (yalnız kendi sözleşmesi)
- `Integration Hub`: ERP/CRM/HR/procurement bağı (`ExternalId` idempotent); yükümlülük/sözleşme verisi push/pull; webhook (HMAC imza, retry, delivery log); provider binding yönetim yüzeyi
- Linked-record çözümleme: CRM fırsatı ↔ sözleşme, ERP tedarikçi ↔ sözleşme, PO ↔ yükümlülük
- Frontend: counterparty portal yüzeyi (dış-tema, minimal), entegrasyon panosu, webhook yönetimi

**Teslim edilebilirler:** Karşı tarafın sözleşmeyi güvenle işlediği portal + dış sistem entegrasyonu.
**Kabul kriterleri:** Dış kullanıcı yalnız kendi sözleşmesini görür/imzalar (cross-tenant/cross-party reddedilir); sözleşme değişikliği webhook'u imzalı teslim edilir; yükümlülük ERP'ye idempotent itilir.

---

### **FAZ 7 — Ecosystem (Analytics + Migration + Developer Platform)**

**Kapsam:** Portföy analitiği, rakip/legacy migrasyonu, headless developer platform ve legal hold — ürünü ekosisteme açan katman.

**Gereksinimler**
- `Agreement Analytics`: portföy metrikleri (değer/risk/yenileme takvimi/döngü süresi/yükümlülük durumu); dashboard + report yüzeyi
- `k-migration-bridge`: `migration_job` + `migration_record` + `field_mapping`; rakip/legacy'den (DocuSign/Adobe Sign/PandaDoc/Zoho/legacy CLM) idempotent içe-aktarım; dry-run önizleme; conflict resolution (skip/overwrite/merge-to-mdm/manual); **evidence preservation** (imza/audit-certificate kaynak-provenance ile `k-evidence`'a korunur); rollback
- `k-legal-hold-retention`: dava/soruşturma kaydı; ilgili sözleşmeleri hold'a alma (WORM); retention politikası; e-discovery dışa-aktarım + custody zinciri
- `Developer Platform`: headless GraphQL/REST API, webhook, embedded imza SDK, custom archetype/surface; API dokümantasyonu (OpenAPI); rate limiting
- Frontend: analitik dashboard'ları, migrasyon sihirbazı (dry-run önizleme), legal hold yönetimi, developer portal

**Teslim edilebilirler:** Rakipten taşınabilir, analitikli, hukuki-saklamalı, API-önce bir platform.
**Kabul kriterleri:** Rakip sistemden sözleşme + imza + kanıt + audit kaybetmeden içe alınır (idempotent, dry-run doğru önizler, rollback çalışır); held sözleşme değiştirilemez/silinemez; e-discovery kilitli küme + custody zinciri üretir; dış geliştirici API'den sözleşme oluşturup imzalatabilir.

---

## **9\. Deployment Modları**

Ürün, farklı müşteri segmentlerine ve data-residency/compliance gereksinimlerine uyum için dört deployment modunda çalışır. Aktör-açık: platform ekibi mod profilini tanımlar; tenant yöneticisi kendi modunu seçer/talep eder; mod değişimi veri-güdümlü ve kontrollüdür (canlı sözleşme/imza bütünlüğü korunur), koda gömülü değildir.

Aşağıdaki tablo dört modu, izolasyon düzeyini ve tipik müşteriyi tanımlar.

| Mod | İzolasyon | Data-residency | Tipik müşteri |
|---|---|---|---|
| **SaaS (multi-tenant)** | Satır-düzeyi (`tenant_id` + RLS) | Bölge-paylaşımlı (tenant seçer) | KOBİ, hızlı başlangıç |
| **Enterprise single-tenant** | Ayrı DB/şema (tek kiracı) | Müşteri-özel bölge | Kurumsal, yüksek-hacim |
| **Self-host (Docker)** | Müşteri altyapısı (tam izolasyon) | Müşteri veri merkezi | Regülasyon-ağır, kamu, banka |
| **Shared-hosting-lite** | Kısıtlı kaynak, temel modüller | Sağlayıcı bölgesi | Küçük ölçek, minimal kurulum |

**Mod-invariant:** Tüm modlar aynı kernel/archetype/surface sözleşmesini paylaşır; mod yalnız izolasyon fiziğini ve kaynak profilini değiştirir, iş mantığını değil. SaaS'tan enterprise single-tenant'a geçiş bir migration yolu olarak açık tutulur (schema-per-tenant / DB-per-tenant); geçiş `preview → validate → publish → rollback` kontrollü zinciriyle yapılır ve canlı veri korunur.

---

## **10\. Kernel / Archetype / Surface Eşlemesi**

Bu bölüm, ürün gereksinimlerinin actionplan'ın hangi kernel primitifine, archetype'ına veya surface'ına düştüğünü sabitler. Bu eşleme, "her gereksinim bir sözleşme primitifine bağlanmalı, app-özel yeniden-yazım yasak" ilkesinin uygulanmasıdır. Her primitif kendi yönergesinde (`docs/k-*.md`, `docs/archetype-*.md`, `docs/surface-*.md`) normatif tanımlıdır; bu tablo ürün ↔ primitif haritasıdır.

Aşağıdaki tablo her CLM yeteneğini karşılayan primitife, primitifin türüne ve o primitifin ne sağladığına eşler.

| CLM yeteneği / gereksinim | Primitif | Tür | Primitif ne sağlar |
|---|---|---|---|
| Sözleşme grafiği (Contract kök + alt-varlıklar) | `archetype-agreement` | ArcheType | Agreement graph modeli; alanları atomik tiplere oturtur; işletilebilir veri |
| Sözleşme üretimi (şablon + clause + merge) | `archetype-document-composition` | ArcheType | Şablon derleme + koşullu blok + versiyonlama; imzalanacak dokümanı üretir |
| E-imza orkestrasyonu (SES/AES/QES, format, mod) | `k-signature` | Kernel | Provider-agnostik imza akışı; eIDAS seviye kapısı; PAdES/XAdES/CAdES; RFC 3161 |
| Kanıt / delil kasası (tamper-evident, LTV) | `k-evidence` | Kernel | Hash-chain WORM append-only; RFC 3161; LTV; audit_certificate |
| Yükümlülük yaşam döngüsü (vade/yenileme/eskalasyon) | `k-obligation` | Kernel | Birinci-sınıf taahhüt nesnesi; alarm kararı; renewal manager; revenue-leakage |
| Sağlayıcı erişimi (imza/AI/depolama/iş-akışı — BYO) | `k-provider-adapter` | Kernel | Port/adapter; config-driven binding; secret KMS-ref; fallback + circuit breaker |
| Rakip/legacy içe-aktarım (audit-koruyan) | `k-migration-bridge` | Kernel | Idempotent import; dry-run; conflict resolution; evidence preservation; rollback |
| Hukuki saklama + retention (legal hold, e-discovery) | `k-legal-hold-retention` | Kernel | WORM hold; retention politikası; custody zinciri; GDPR/KVKK/eIDAS uyum |
| E-imza doküman yüzeyi (imza alanı, embedded) | `surface-esign` | Surface | İmza akışı kurgu + alan yerleşim editörü + embedded imza deneyimi |
| Karşı taraf portalı (dış, scoped) | `surface-counterparty` | Surface | Dış-kullanıcı güvenli yüzey; ReBAC izin; müzakere/imza/ek yükleme |
| Ek/binary depolama (referans + checksum) | `k-storage` | Kernel | Object storage (S3/MinIO/Azure/GCS); `AssetRef`; binary DB'de değil |
| Yetki kararı (RBAC/ABAC/ReBAC, policy-as-code) | `k-policy-pdp` | Kernel | Erişim/onay/madde kararı; playbook policy-as-data; app-dağınık if yasak |
| Arka-plan iş (hatırlatma/batch/AI çıkarım taşıma) | `k-worker` | Kernel | Task queue; retry+backoff; dead-letter; zamanlanmış tarama; scale-invariant |
| Ceza/faiz/risk hesabı (deterministik para/oran) | `k-computation` | Kernel | Tip-güvenli Money/Percentage hesabı; kur/precision guard |
| Taraf kimliği (müşteri/tedarikçi/iç) | `k-party` | Kernel | Aktör kütüğü; `PartyRef`; PII sınıflı kimlik (NationalId/TaxId) |
| Ölçek modeli (SaaS↔enterprise geçiş) | `k-mode` (mode-profile) | Kernel | Deployment/iş-modeli runtime bileşimi; preview→validate→publish→rollback |

**Kritik yol notu:** Ortak en-yüksek-kaldıraçlı atomlar (`EnumType`, `Duration`, `timestamptz`, `PartyRef`, `EntityRef`, `Money`, `DateRange`) önce kilitlenirse `archetype-agreement` + `k-obligation` + `k-signature` üçlüsü hızla açılır. Atom katmanı test-önce hazır olmadan bu primitifler "hazır" sayılamaz (bkz. `atom-archetype-bagi-clm-ornegi-2026-07-01.md`).

---

## **11\. Özellik Seti Matrisi (Full)**

Aşağıdaki tablo ürünün özelliklerini faz, öncelik ve düştüğü primitifle listeler. Öncelik: P0 = MVP zorunlu · P1 = erken sürüm · P2 = orta vade · P3 = uzun vade.

| # | Özellik | Modül | Faz | Öncelik | Primitif |
|---|---|---|---|---|---|
| 1 | Multi-tenant izolasyon (RLS + tenant_id) | Core | 1 | P0 | `k-tenancy` |
| 2 | Kimlik (JWT+refresh, RBAC) | Core | 1 | P0 | `k-party`/auth |
| 3 | MFA/SSO/SAML/SCIM | Core | 2 | P0 | auth |
| 4 | Agreement graph CRUD (Contract kök) | CLM Core | 1 | P0 | `archetype-agreement` |
| 5 | Party/Clause/Date/Payment alt-varlıkları | CLM Core | 1 | P0 | `archetype-agreement` |
| 6 | Doküman kompozisyonu (şablon+merge) | Doc Automation | 1 | P0 | `archetype-document-composition` |
| 7 | Clause library (standart/alternatif/yasak) | Knowledge Base | 1 | P1 | `archetype-document-composition` |
| 8 | E-imza SES/AES/QES + seviye kapısı | E-Signature | 2 | P0 | `k-signature` |
| 9 | PAdES/XAdES/CAdES + RFC 3161 + LTV | E-Signature | 2 | P0 | `k-signature`/`k-evidence` |
| 10 | Çok-taraflı sıralı/paralel/grup imza | E-Signature | 2 | P0 | `k-signature` |
| 11 | Embedded imza + bulk-send | E-Signature | 2 | P1 | `k-signature`/`surface-esign` |
| 12 | Kanıt kasası (tamper-evident, hash-chain) | E-Signature | 2 | P0 | `k-evidence` |
| 13 | audit_certificate (PDF + verification_url) | E-Signature | 2 | P1 | `k-evidence` |
| 14 | Provider-agnostic imza (BYO) | Integration | 2 | P0 | `k-provider-adapter` |
| 15 | Obligation tracking (birinci-sınıf nesne) | Obligation | 3 | P0 | `k-obligation` |
| 16 | İş-günü farkında vade + hatırlatma | Obligation | 3 | P1 | `k-obligation` |
| 17 | İhlal eskalasyonu | Obligation | 3 | P1 | `k-obligation` |
| 18 | Renewal management + revenue-leakage | Renewal | 3 | P0 | `k-obligation` |
| 19 | Tekrarlı taahhüt (RRULE) | Obligation | 3 | P1 | `k-obligation` |
| 20 | Task queue (hatırlatma/batch taşıma) | Core | 3 | P1 | `k-worker` |
| 21 | AI intake (classification/extraction) | AI Review | 4 | P1 | `AiPort` (`k-provider-adapter`) |
| 22 | AI risk scoring + missing-clause | AI Review | 4 | P1 | AI + `k-computation` |
| 23 | AI onay kuyruğu (draft→onay) | AI Review | 4 | P1 | AI-governance |
| 24 | BYO AI/LLM (OpenAI/Azure/Anthropic/yerel) | Integration | 4 | P1 | `k-provider-adapter` |
| 25 | Negotiation copilot (redline/fallback/stance) | Knowledge Base | 5 | P2 | AI + `archetype-document-composition` |
| 26 | Playbook + policy engine (policy-as-code) | Knowledge Base | 5 | P1 | `k-policy-pdp` |
| 27 | Sözleşme/madde versiyonlama (diff/redline) | Doc Automation | 5 | P2 | `archetype-document-composition` |
| 28 | ReBAC (karşı-taraf ilişki izni) | Core | 5 | P1 | `k-policy-pdp` |
| 29 | Counterparty portal (dış, scoped) | Counterparty | 6 | P1 | `surface-counterparty` |
| 30 | Integration Hub (ERP/CRM/HR/PO) | Integration | 6 | P1 | `k-provider-adapter` + `ExternalId` |
| 31 | Webhook + delivery engine (HMAC) | Integration | 6 | P2 | `k-worker` |
| 32 | Linked-record çözümleme (CRM/ERP bağ) | Integration | 6 | P1 | `ExternalId`/`EntityRef` |
| 33 | Agreement Analytics (portföy metrikleri) | Analytics | 7 | P2 | `archetype-agreement` + `dashboard` |
| 34 | Migration bridge (audit-koruyan import) | Migration | 7 | P1 | `k-migration-bridge` |
| 35 | Evidence preservation (import'ta kanıt korunur) | Migration | 7 | P0 | `k-migration-bridge`/`k-evidence` |
| 36 | Legal hold + retention + e-discovery | Ecosystem | 7 | P1 | `k-legal-hold-retention` |
| 37 | Developer platform (headless API + SDK) | Developer | 7 | P2 | tüm primitifler (API-önce) |
| 38 | Data-residency (bölge-farkında) | Core | 7 | P2 | `k-storage`/KMS |
| 39 | KMS secret yönetimi (inline-değil) | Core | 2 | P0 | `k-provider-adapter`/`k-kms` |
| 40 | Deployment modları (SaaS/single/self-host) | Core | 7 | P2 | `k-mode` (mode-profile) |

**Öncelik dağılımı:** P0 çekirdeği (multi-tenant + agreement graph + imza + kanıt + yükümlülük + renewal + provider-agnostic + evidence preservation) MVP değeridir; P1 erken sürümde AI okuma/portal/entegrasyon; P2/P3 müzakere copilot, analitik, developer platform ve deployment esnekliği.

---

## **12\. Risk ve Bağımlılıklar**

Bu bölüm ürünün en kritik risklerini ve azaltma stratejilerini listeler. Riskler ürünün hukuki-delil taşıyan ve finansal-sonuç doğuran doğası gereği ciddidir; her biri bir test-zorunlu invariant'a veya faz bağımlılığına bağlanır.

Aşağıdaki tablo risk, etki ve azaltmayı tanımlar.

| Risk | Etki | Azaltma |
|---|---|---|
| Atom katmanı zayıf kalırsa (Money/DateRange/Term/Recurrence eksik) | Yüksek | Faz 1'de atom test-önce kilit; agreement archetype ancak sonra "hazır"; §3.4 kırılma haritası |
| İmza kanıtı hukuki delil değeri taşımazsa (LTV/timestamp eksik) | Yüksek | `k-evidence` WORM + hash-chain + RFC 3161 + LTV zorunlu; tamper-evidence testi |
| Yenileme/ihbar penceresi kaçarsa (silent auto-renew) | Yüksek | `k-obligation` renewal manager kritik erken-uyarı; revenue-leakage AC (gelir kaçağı) |
| Multi-tenant izolasyon açığı | Yüksek | RLS + repository filtresi + ≥10 negatif tenant testi (Faz 1); fail-closed |
| Sağlayıcı kilitlenmesi (tek imza/AI satıcısına bağımlılık) | Orta | `k-provider-adapter` port/BYO; fallback zinciri + circuit breaker; capability negotiation |
| Rakip sistemden geçişte kanıt/audit kaybı | Yüksek | `k-migration-bridge` evidence preservation (verbatim korur); idempotent; dry-run; rollback |
| QTSP olmaya çalışma (nitelikli sertifika üretme yanılgısı) | Yüksek | Kesin non-goal: ürün ESHS/QTSP değil; dış yetkili sağlayıcıdan tüketir (`k-provider-adapter`) |
| AI'ın autonomy sınırını aşması (imza/kanıt/yükümlülük) | Yüksek | Değiştirilemez invariant: AI önerir→insan onaylar→motor uygular; guardrail testleri |
| PII sızıntısı (NationalId/TaxId düz string) | Yüksek | PII-sınıflı atom; alan-düzeyi şifreleme/maskeleme; KVKK/GDPR uyum |
| Kapsam genişliği (12 modül × 7 faz) | Yüksek | Katı fazlama; kernel önce, modül sonra; P0/P1 önce, P3 sona |
| Compliance jurisdiction farkı (eIDAS vs 5070 vs ESIGN) | Orta | `jurisdiction` alanı + seviye kapısı; jurisdiction-başına ESHS/QTSP; data-residency |

**Dış bağımlılıklar:** İmza sağlayıcı (BTK-yetkili ESHS / eIDAS QTSP) hesabı, AI/LLM sağlayıcı anahtarları, TSA (zaman-damgası), object storage/CDN, KMS/secret-manager, (opsiyonel) ERP/CRM/HR/procurement instance'ları, rakip sistem export'ları (migration için).

---

## **13\. Kapsam Dışı / Sonraki Sürüm**

- **QTSP/ESHS olmak** — nitelikli sertifika üretimi, HSM anahtar saklama, TSA işletme: daima non-goal; dış yetkili sağlayıcıdan tüketilir.
- **Tam BPMN/saga iş-akışı motoru** — onay akışı `k-policy-pdp` + `k-worker` ile karşılanır; genel-amaçlı workflow motoru sonraki sürüm.
- **Gelişmiş sözleşme müzakere pazaryeri** (karşı-taraf ağı, ortak şablon havuzu) — sonraki sürüm.
- **Mobil native uygulama** — headless API üstünde; başlangıçta responsive web yeterli.
- **Sektörel derin uyum paketleri** (ör. ilaç/finans regülasyon şablonları) — çekirdek kilitlendikten sonra add-on.
- **Gelişmiş BI/veri ambarı** — Analytics dashboard başlangıçta yeterli; ambar entegrasyonu sonra.
- **Schema-per-tenant / DB-per-tenant fiziksel izolasyon** — mimari hazır (`k-mode`), uygulama enterprise single-tenant talebiyle.

---

### **Ek: MVP Tanımı**

**MVP = Faz 1 + Faz 2** → Multi-tenant, kimlik doğrulamalı, agreement grafiğini (Contract kök + Party/Clause/Date/Payment) yönetebilen, provider-agnostik SES/AES/QES imza atabilen ve her imzayı tamper-evident kanıta bağlayan çalışan bir Agreement OS çekirdeği. Bu, ilk kullanıcı testleri ve demo için yeterlidir; Faz 3 (yükümlülük/yenileme) ürünün asıl değer motorunu, Faz 4+ AI ve ekosistem katmanlarını ekler.

---

*Bu doküman, actionplan kernel/archetype/surface yönergelerinin karşılaması gereken hedef Agreement OS / CLM ürününü tanımlar. Kaynak primitif sözleşmeleri: `k-signature-trust-directive.md`, `k-evidence-seal-directive.md`, `k-obligation-commitment-directive.md`, `k-provider-adapter-directive.md`, `k-migration-bridge-directive.md`, `k-legal-hold-retention-directive.md`, `surface-spec.md`; atom→archetype bağı `atom-archetype-bagi-clm-ornegi-2026-07-01.md`. Her fazın başında detaylı teknik tasarım (API sözleşmeleri, DB şeması, ekran tasarımları) ayrıca çıkarılmalıdır. Bu bir gereksinim/analiz belgesidir; implementasyon kodu içermez. Çelişkide kernel runtime sözleşmesi (`core-contract-pack.md`) önceliklidir.*
