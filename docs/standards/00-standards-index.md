# Standartlar İndeksi — Makine-Sözleşmeleri + Anlatı Standartları

Sürüm: 1.0 — 2026-07-01
Durum: `docs/standards/` klasörünün giriş noktası. Kanonik hub `docs/engineering-standards-index.md`'yi *tamamlar*, yerini almaz.
Amaç: Tüm standartları — makine-sözleşmeleri (`src/data/standards/*.json`; çekirdek 15 + eklenen 9 = **24 sözleşme**, 2026-07-01 RECONCILE) ve bu klasördeki anlatı standartları (01-14) — tek yerde listelemek.

---

## 1. İlke — "Reference, Don't Duplicate"

Bu klasör iki standart biçimini birbirine bağlar; hiçbirini kopyalamaz. Kural şudur: bir standardın *tek doğruluk kaynağı* vardır ve diğer her yer ona referans verir.

- Makine-sözleşmesi (`src/data/standards/<id>.json`): CI-zorlamalı, `standard.ts` şemasına uyan, düğümlerin `standardRefs` ile bağlandığı tek-kaynak. Bir kuralın *zorlanabilir* biçimi burada yaşar.
- Anlatı standardı (`docs/standards/NN-*.md`): aynı standardın insan-okur açıklaması, gerekçesi ve stack karşılığı (FastAPI/React/DB). Anlatı, makine-sözleşmesini *anlatır*; kuralı yeniden tanımlamaz.

Bir anlatı dokümanı bir kural içeriğini tekrar yazarsa drift (aynı kuralın iki yerde farklılaşması) doğar. Bu yüzden her anlatı standardı başında "Makine kontratı: `src/data/standards/<id>.json`" satırı taşır ve kuralın *değerini* değil *anlamını* verir. Kural değişince yalnız JSON güncellenir; anlatı otomatik olarak aynı sözleşmeyi işaret ettiği için tutarlı kalır. Bu, `docs/engineering-standards-index.md` §6'daki "yeniden yazma, referans ver" ilkesinin klasör-içi uygulamasıdır.

---

## 2. Çekirdek 15 Makine-Standardı (`src/data/standards/*.json`)

Aşağıdaki 15 standart bugün repoda makine-okunur sözleşme olarak vardır; hepsi `StandardContractSchema`'ya uyar ve bir CI kapısıyla zorlanır. "Makine kontratı" sütunu tümü için "VAR"dır (tanım gereği). Kaynak: `docs/engineering-standards-index.md` §2. (2026-07-01 RECONCILE, güncellendi: §3'te listelenen **13 sözleşmenin tamamı** eklendi; toplam **28 makine-sözleşmesi**. Eksik üç CI kapısı — `check-i18n`, `check-core-contract`, `check-scale-invariant` — de yazıldı ve `deploy.yml`'e eklendi, bkz. §3 sonu.)

| standart (id) | family | priority | makine-kontratı var mı | CI kapısı |
|---|---|---|---|---|
| architecture | engineering | P0 | VAR | check-standards-coverage |
| coding-standards | engineering | P0 | VAR | check-standards-coverage |
| short-code | engineering | P1 | VAR | check-short-code |
| quality-gates | testing | P0 | VAR | check-standards-coverage |
| design-system | design | P1 | VAR | check-ui-standards |
| ui-components | design | P1 | VAR | check-ui-standards |
| ux-interaction | design | P1 | VAR | check-ui-standards |
| data-api-contract | data | P0 | VAR | check-standards-coverage |
| state-management | engineering | P1 | VAR | check-standards-coverage |
| observability | devops | P0 | VAR | check-standards-coverage |
| testing-strategy | testing | P1 | VAR | check-standards-coverage |
| release-versioning | devops | P1 | VAR | check-standards-coverage |
| ai-governance | ai | P1 | VAR | check-standards-coverage |
| i18n-standards | engineering | P2 | VAR | check-i18n |
| dependency-policy | governance | P1 | VAR (repo-bazlı politika) | check-dependency-policy |

---

## 3. Eklenen Anlatı Standartları (`docs/standards/01-14`)

Aşağıdaki anlatı standartları `numeronym-siniflandirma.md` §4 MUST/SHOULD listesindeki "EKSİK" satırlarından türer. Her biri bir *yeni* makine-sözleşmesi (`src/data/standards/<id>.json`) hedefler; sözleşme `plan-02` PROMPT 3 ile üretilir. "Makine kontratı var mı" sütunu 2026-07-01 itibarıyla RECONCILE edilmiştir (güncellendi): on üç sözleşmenin **tamamı** (`g11n`, `a11y`, `authz-rbac-abac`, `c13n`, `data-normalization`, `i14y`, `c12n`, `p13n`, `sso`, `mfa`, `oidc`, `edge-security`, `iac`) artık `src/data/standards/*.json` altında **VAR**. Anlatı ile sözleşme birlikte merge edilir.

| standart (id) | family | priority | makine-kontratı var mı | CI kapısı (hedef) |
|---|---|---|---|---|
| 01 g11n (globalization) | governance | P2 | VAR (`g11n.json`) | check-i18n (yazıldı) |
| 02 c13n (canonicalization) | data | P1 | VAR (`c13n.json`) | check-data-quality |
| 03 n6n (normalization) | data | P1 | VAR (`data-normalization.json`) | check-data-quality |
| 04 d10n (denormalization) | data | P3 | VAR (`data-normalization.json` içinde) | check-data-quality |
| 05 i14y (interoperability) | data | P1 | VAR (`i14y.json`) | check-core-contract (yazıldı) |
| 06 c12n (customization) | design | P1 | VAR (`c12n.json`) | check-standards-coverage |
| 07 p13n (personalization) | design | P2 | VAR (`p13n.json`) | check-standards-coverage |
| 08 sso (single sign-on) | engineering | P1 | VAR (`sso.json`) | check-standards-coverage |
| 09 mfa (multi-factor auth) | engineering | P1 | VAR (`mfa.json`) | check-standards-coverage |
| — oidc (OpenID Connect, sso altı) | engineering | P1 | VAR (`oidc.json`) | check-standards-coverage |
| — authz-rbac-abac (yetki/PDP) | engineering | P0 | VAR (`authz-rbac-abac.json`) | check-standards-coverage |
| — a11y (accessibility) | design | P1 | VAR (`a11y.json`) | check-ui-standards |
| 10 e2ee (end-to-end encryption) | engineering | P2 | VAR (`edge-security.json` içinde) | check-standards-coverage |
| 11 v12n (virtualization) | devops | P2 | VAR (`iac.json` içinde) | check-execution-readiness |
| 12 iac (infrastructure as code) | devops | P1 | VAR (`iac.json`) | check-execution-readiness |
| 13 edge-security (WAF/DDoS/CDN/DNS) | devops | P1 | VAR (`edge-security.json`) | check-execution-readiness |
| 14 numeronym-siniflandirma (bu paketin sınıflandırma referansı) | governance | P0 | YOK (referans dokümanı) | — |

Not: `AuthN/AuthZ/RBAC/ABAC/IAM/o11y/i18n/l10n/API/GraphQL/E2E` için ayrı yeni anlatı standardı üretilmez — bunlar mevcut sözleşmeler veya boyut (`dimensions.security/wcag`) tarafından kapsanır; `authz-rbac-abac` ve `a11y` ise ayrı makine-sözleşmesine bağlandı (yukarıda VAR). Sınıflandırma detayı `numeronym-siniflandirma.md` §2'dedir.

RECONCILE notu (2026-07-01, güncellendi): CI kapıları `check-i18n`, `check-core-contract` ve `check-scale-invariant` **yazıldı** — `tools/agents/` altında mevcut, `deploy.yml`'e eklendi; her biri boş/uyumlu durumda exit 0, ihlalde exit 1 verecek şekilde doğrulandı. Böylece g11n/i14y/scale-invariant sözleşmeleri artık CI ile zorlanır. Ayrıntı: `14-enterprise-readiness-checklist.md` ve `enterprise-standards-audit-2026-07-01.md`.

---

## 4. Standart-DIŞI (İndekste Yer Almaz)

Aşağıdakiler bilinçli olarak bu indekste standart satırı DEĞİLDİR; ne makine-sözleşmesi ne anlatı standardı üretilir. Ayrıntı ve gerekçe `numeronym-siniflandirma.md` §4 NOT-FEATURE bölümündedir.

- Mode-Profile capability (iş modeli): B2B, B2C, C2C, B2G, M2M, S2S, D2D → `plan-01` Mode-Profile primitifi, `business_model_config`.
- Araç / API-stili: CRUD, REST, RPC, gRPC, SDK, CLI, TUI → `data-api-contract` / `i14y` kapsamındaki seçimler.
- Domain / ürün: CMS, CRM, ERP, ETL, ELT, BI, OLAP, OLTP → *uygulama*, kural değil.

---

## 5. WBS'te Zaten Olan Düğümler

Aşağıdaki standart-adayları WBS ağacında (`navigation.json`, `wbsCode` 13.x) zaten düğümdür; yeni ağaç kurulmaz, mevcut düğüm `standardRefs` ile bağlanır. Ayrıntı: `numeronym-siniflandirma.md` §3.

| Konu | WBS kodu | WBS düğüm id |
|---|---|---|
| IAM | 13.5 | s-iam |
| i18n / Localization | 13.7 | s-i18n |
| AI Governance | 13.1 | s-ai-governance |
| Audit / Compliance | 13.2 | s-audit |
| Workflow / BPM | 13.10 | s-bpm |

---

## 6. İlgili Kanonik Dokümanlar

| Doküman | Yol | Rolü |
|---|---|---|
| Mühendislik Standartları Dizini | `docs/engineering-standards-index.md` | 15 makine-standardının kanonik hub'ı; bu indeks onu tamamlar |
| Numeronym Sınıflandırması | `docs/standards/numeronym-siniflandirma.md` | Tüm kısaltmaların 7-aile şemasına eşlemesi + MUST/SHOULD/NOT-FEATURE |
| Standart Şeması | `src/schemas/standard.ts` | `StandardContractSchema` — her JSON sözleşmenin biçimi |
| Prompt Paketi | `plan-02-numeronym-standart-prompt-paketi-2026-07-01.md` | Bu klasörü üreten prompt zinciri (PROMPT 1-14) |
| ADR-0027 | `docs/adr-0027-engineering-standards.md` | Sözleşme + referans + uygulanabilirlik + kapı kararı |
