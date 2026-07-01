# Kernel Geliştirmeye Başlamadan Önce — Doküman Gap ve Güncelleme/Ekleme Planı

**Soru:** Kernel geliştirmeye başlıyorum. Kernel dökümanlarında ne eksik? [kernel, surface, archetype] ekseninde hangi dökümanları güncellemeliyim, hangi kümelere yeni doküman eklemeliyim?
**Bağlam:** ~50 app'in önce **core**, sonra **enterprise-grade** sürümü bu kernel ile geliştirilecek; hepsi **bağımsız satılabilir/dağıtılabilir** olacak; **global** olduğu için **i18n** kritik.
**Tarih:** 2026-07-01 · **Kaynak:** `docs/` (34 doküman) envanteri + içerik taraması, `core-contract-pack.md`, `engineering-standards-index.md`, `enterprise-dod.md`.

---

## 0. Tek cümlelik teşhis

> Dökümanlar meta-sistem/yönetişim ve **kernel runtime sözleşmesi** (`core-contract-pack.md` — Python/FastAPI/SQLAlchemy ile tenant/authz/outbox/ECA/audit/archetype-registry/workflow/migration/observability/module-SDK) tarafında güçlü. Ama üç şey "başlamayı" ve "50 bağımsız global app"i bloke ediyor: **(1) i18n bir mühendislik standardı değil** (global ürün için zorunlu), **(2) app-dağıtım/paketleme/entitlement sözleşmesi yok** (bağımsız satılabilirlik bunsuz olmaz), **(3) core→enterprise olgunluk merdiveni yok** (sadece enterprise bitiş-DoD'si var). Ayrıca birkaç doküman **bayat** (örn. `data-api-contract` hâlâ "Prisma" diyor; stack Python/SQLAlchemy).

---

## 1. Adil değerlendirme — dökümanlar zaten neyi iyi karşılıyor

Haksızlık etmemek için: kernel'e başlamak için gereken çekirdeğin çoğu var.

`core-contract-pack.md` gerçek bir **kernel build sözleşmesi**: `platform` monorepo iskeleti + 10 kernel sözleşmesi (Tenant Context, Identity/AuthZ, Event Bus+Outbox, ECA Runtime, Audit, Archetype Registry, Workflow Registry, Migration Policy, Observability, Module SDK) — hepsi somut Python/FastAPI/SQLAlchemy/Alembic imzalarıyla. `developer-guide.md` Gün-1 90 dakikayı (klonla→Python/Node ortamı→Docker DB→test-önce) adım-adım veriyor. `engineering-standards-index.md` 14 tek-kaynak standardı + CI kapılarını tanımlıyor. `enterprise-dod.md` 18 katmanlı enterprise bitiş kriterini veriyor. `archetype-uretim-spec.md` ArcheType üretim/güvenlik akışını. Yani "sıfırdan" değilsiniz.

Sorun "doküman yok" değil; sorun **üç yapısal boşluk + birkaç bayat sözleşme + yeni primitiflerin sözleşmesizliği**.

---

## 2. GÜNCELLENECEK mevcut dökümanlar (öncelikli)

Sade özet: önce bayat/eksik olanları düzeltin — yanlış doküman, yanlış kod ürettirir.

| Doküman | Ne eksik/yanlış | Öncelik | Aksiyon |
|---|---|---|---|
| `core-contract-pack.md` | v1 yalnız 10 eski kernel sözleşmesini içerir; bu oturumda eklenen **14 yeni primitifin sözleşmesi yok** (Actor, Capability, PDP, Mode-Profile, Computation, field-types, scale-invariant, sequence, calendar-capacity, genealogy, edge-gateway, kpi-registry, aps) | P0 | **v2**: her yeni primitife kernel sözleşmesi (Python imzası + tenant/authz/audit bağı) ekle |
| `engineering-standards-index.md` + `data-api-contract` standardı | `data-api-contract` **"Prisma model konvansiyonu"** diyor — stack **Python/SQLAlchemy 2.0** kararıyla çelişir (bayat TS/Prisma kalıntısı) | P0 | Prisma→SQLAlchemy/SQLModel + Alembic; GraphQL codegen tarafını Strawberry/schema-first'e hizala |
| `enterprise-dod.md` | Yalnız **enterprise bitiş-DoD'si** (18 katman); **core-DoD** ve **core→enterprise merdiveni** yok — oysa iş modeliniz "önce core, sonra enterprise" | P0 | Core-DoD (min. bağımsız-satılabilir) + graduation kapıları ekle (bkz. §4) |
| `standards-applicability-matrix.md` | Yeni primitif seviyeleri + **i18n standardı** satırı yok | P1 | i18n + yeni primitifleri matrise ekle |
| `adr-0026-tech-profiles.md` | Frontend tech-profile'da **i18n/RTL** profili yok (global) | P1 | i18n/RTL/locale-format frontend profilini ekle |
| `claude-ai-archetype-eca-directive.md` | Yeni primitiflerin AI-sınırı (Actor/Capability/PDP mutasyonu) örneklenmemiş | P2 | Yeni primitif AI-deny örnekleri ekle |

---

## 3. EKLENECEK yeni dökümanlar + hangi kümeye

Sade özet: üç P0 doküman "başlamayı" doğrudan açar; ikisi global/dağıtım vaadinizi mümkün kılar.

| Yeni doküman | Neden (bloke ettiği) | Öncelik | Küme (WBS düğümü) |
|---|---|---|---|
| **i18n/l10n Standardı** (15. mühendislik standardı) | Global ürün; şu an 14 standartta i18n **yok** → çok-dil/RTL/locale disiplini referanssız | P0 | `crosscut` (cc-i18n-standards node'unu standarda terfi et) |
| **App-Distribution & Packaging Sözleşmesi** | "50 bağımsız satılabilir app" — manifest/izolasyon/entitlement/standalone-deploy/marketplace bunsuz olmaz | P0 | `platform-horizontal` veya yeni `distribution` kümesi |
| **Core-DoD + Olgunluk Merdiveni** | "Önce core, sonra enterprise" — core'un ne olduğu ve graduation kapıları tanımsız | P0 | `sus` (Platform Yetenekleri) veya `build` |
| **Kernel Runtime Build Spec** | ArcheType/DocType engine'in metadata→DB→API çözümleme **algoritması** + engine-node test-vektörü (MRP raporu ADR-M-K5) | P0 | `kernel` |
| **Deployment/Ops Topolojisi** | Hetzner/Debian/Docker/K8s + tenant onboarding + DR; enterprise-dod'da "deployment" var ama topoloji doc'u yok | P1 | `sus` |
| **SDK/Codegen Runbook** | OpenAPI/GraphQL→typed client üretimi; standartta değinilmiş ama runbook yok | P2 | `dx` (Geliştirici Deneyimi) |

---

## 4. Core → Enterprise olgunluk merdiveni (en çok istediğiniz ayrım)

`enterprise-dod.md` sadece bitiş çizgisini veriyor. "Önce core geliştir, sonra enterprise'a genişlet" için **üç kademeli DoD** doküman olmalı:

- **L1 — Core (bağımsız satılabilir MVP):** tek-tenant veya basit multi-tenant (RLS), CRUD + temel workflow, temel authz (RBAC), i18n-hazır (metin dışarıda), temel audit, Docker-compose deploy, temel testler. *Bağımsız satılabilir minimum budur.*
- **L2 — Growth:** capability/entitlement gate (bağımsız paketleme), gelişmiş authz (ReBAC/ABAC via PDP), SSO, gözlemlenebilirlik (SLO), yedek/restore, i18n çok-dil aktif + RTL, marketplace-listelenebilir.
- **L3 — Enterprise:** `enterprise-dod.md`'nin 18 katmanı + veri-residency (bölge), DR-tatbikatı, tam SDK, çok-bölge, compliance (KVKK/GDPR/SOC2).

**Aktör açıklığı:** *geliştirici* L1'i ship eder; *CI* her kademenin kapısını (L1-DoD/L2-DoD/L3-DoD) ayrı denetler; *insan* graduation'ı onaylar. Her app bağımsız olduğu için **her app kendi kademesinde** olabilir (biri L1 satılırken diğeri L3).

---

## 5. i18n — neden 15. standart olmalı (global vurgunuz)

**Bu nedir?** i18n = ürünü çok-dile/bölgeye hazırlama; l10n = belirli bölgeye uyarlama. Terminoloji: **BCP 47** = dil-etiketi (tr-TR); **CLDR** = Unicode yerel-veri; **ICU MessageFormat** = çoğul/cinsiyet-duyarlı çeviri; **RTL** = sağdan-sola (Arapça/İbranice).

**Neden standart olmalı, boyut değil?** Şu an i18n 14 standartta yok ve WCAG gibi bir "boyut" da değil. Global ürün için i18n bir **çapraz-kesen sözleşme**dir: her katmana dokunur. Standart olursa her düğüm `standardRefs.i18nRef` ile bağlanır, CI referans bütünlüğünü zorlar, drift imkânsızlaşır.

**Ne kapsamalı (üç katmana dokunuş):**
- **Archetype**: `i18n-text` alan tipi (bu oturumda `k-archetype-fieldtypes`'te eklendi) zorunlu; enum/etiket yerelleştirme; hangi alan çevrilebilir beyanı.
- **Surface**: locale-farkında biçimlendirme (tarih/para/sayı), **RTL**, çoğul-kuralı, pseudo-localization testi; `k-surface-consumer`'ın `factoryContext`/render sözleşmesine `i18n` bloğu.
- **Kernel**: çeviri deposu (translation store) + fallback zinciri + çeviri-iş-akışı (kim çevirir, onay); **veri-residency** (bölgeye göre veri konumu — KVKK/GDPR).

**Ne yapmaz:** i18n makine-çevirisi yapmaz; sözleşme çeviri *altyapısını* tanımlar, içeriği değil (AI çeviri önerebilir, insan onaylar).

---

## 6. App-Distribution — "50 bağımsız satılabilir app" bunsuz olmaz

ChatGPT'nin doğru uyarısı: Workflow Automation + Low-Code Builder + Integration Hub olmadan "ekosistem değil, modül yığını" olur. Ama daha temelde, **bağımsız satılabilirlik bir dağıtım sözleşmesi ister**:

- **App manifest**: app'in hangi kernel primitiflerini + hangi module'leri + hangi capability'leri tükettiği (k-mod-l/k-plugin üstünde).
- **Bağımlılık izolasyonu**: App A, App B'yi **doğrudan değil, kernel sözleşmesi/olay üzerinden** tüketir (monorepo içinde ama satışta ayrık). Kural: app'ler arası doğrudan import yasak (architecture standardı zorlar).
- **Per-app entitlement/lisans**: `k-capability` (bu oturumda eklendi) + lisans-anahtarı → bir müşteri yalnız aldığı app'i çalıştırır.
- **Standalone deploy**: her app tek-başına `docker compose up` ile ayağa kalkabilmeli (paylaşılan kernel + o app'in module'leri).
- **Marketplace + sürüm uyumu**: app X kernel v2 ister, app Y kernel v1 — uyumluluk matrisi.

**Doküman şunu netleştirmeli:** "bağımsız satılabilir" = *ayrı paketlenebilir + ayrı lisanslanabilir + ayrı deploy edilebilir + kernel'i paylaşır ama diğer app'lere doğrudan bağımlı değil."

---

## 7. Üç katman × kernel bağlantısı (sizin çerçevenizle)

- **Kernel**: `core-contract-pack.md` v2 (14 yeni primitif sözleşmesi) + Kernel Runtime Build Spec + i18n çeviri-deposu + distribution manifest. *En kritik: core-contract-pack v2.*
- **Surface**: surface dökümanları i18n/RTL/locale sözleşmesini zorunlu kılmalı; `k-surface-consumer` + Shop-Surface (MRP raporu) + WCAG-AA taban; render/perf sözleşmesi.
- **Archetype**: `archetype-uretim-spec.md` yeni primitifleri kapsayacak şekilde güncellenmeli (Actor/Capability/Computation/field-types + MRP'den effectivity/BOM/routing); `i18n-text` alanı zorunlu beyan.

---

## 8. Kilitlenecek ADR taslakları

- **ADR-D1 — i18n 15. standart.** `i18n-standards` sözleşmesi + `standardRefs.i18nRef` + `check-i18n` CI kapısı. Öneri: evet (global blocker).
- **ADR-D2 — App-Distribution sözleşmesi.** Manifest + izolasyon + entitlement + standalone. Öneri: yeni kanonik sözleşme + `distribution` kümesi.
- **ADR-D3 — Core/Growth/Enterprise olgunluk merdiveni.** Üç-kademe DoD + graduation kapıları. Öneri: `enterprise-dod.md`'yi 3-kademeli yap.
- **ADR-D4 — core-contract-pack v2.** Yeni 14 primitif kernel sözleşmesi. Öneri: evet (kernel build blocker).
- **ADR-D5 — data-api-contract stack düzeltmesi.** Prisma→SQLAlchemy. Öneri: acil (bayat, yanıltıcı).

---

## 9. Öncelikli sıra (kernel'e başlamadan)

1. **`data-api-contract` bayat düzeltmesi (ADR-D5)** — 1 günlük iş, yanlış-kod üretimini durdurur.
2. **`core-contract-pack.md` v2 (ADR-D4)** — kernel build'in fiili sözleşmesi; yeni primitifler olmadan başlarsanız onları sonra yamamak pahalı.
3. **i18n 15. standart (ADR-D1)** — global vurgunuz; alan/surface/kernel üçünü birden bağlar, sonradan eklenmesi en zor.
4. **App-Distribution sözleşmesi (ADR-D2)** — bağımsız satılabilirlik vaadinizin sözleşmesi.
5. **Core/Growth/Enterprise merdiveni (ADR-D3)** — "önce core sonra enterprise" iş modelinizin kapıları.
6. Kernel Runtime Build Spec + Deployment topolojisi + SDK runbook (ikincil).

---

*İsterseniz sıradaki adım: (a) i18n standardını (doküman + `standard.ts` şeması + CI kapısı + WBS düğümü) uçtan uca ekleyeyim; (b) `core-contract-pack.md` v2'yi 14 yeni primitif sözleşmesiyle yazayım; (c) App-Distribution sözleşmesini + Core/Growth/Enterprise merdivenini yazayım. Her biri geçen turlardaki gibi testler yeşil kalacak şekilde.*
