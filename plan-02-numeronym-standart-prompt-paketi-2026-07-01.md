# Dosya 2 — Numeronym Standart → Prompt Paketi

**Tarih:** 2026-07-01 · **Bağlam:** `plan-01` Dalga 3 bu paketi çalıştırır. · **Amaç:** i18n/a11y/o11y gibi numeronym'leri (sayı-kısaltma; ör. i18n = "i" + 18 harf + "n" = internationalization) reponun mevcut 15-standart sistemine ekleyen, kopyala-yapıştır bir prompt zinciri.

**Bu paket nedir:** Sizin verdiğiniz PROMPT 1-14 setinin, repo gerçeğine göre düzeltilmiş ve guardrail'lenmiş hâli.
**Ne yapar:** Numeronym listesini sınıflandırır → mevcut kodu denetler → eksik standartları sözleşmeye bağlar → sırayla uygular.
**Ne yapmaz:** Yeni bir paralel standart taksonomisi kurmaz (repo zaten `standard.ts` + `src/data/standards/*.json` + `engineering-standards-index.md`'e sahip); bunları *genişletir*.

---

## 1. En kritik düzeltme — iş modeli standart değildir

Sizin de vurguladığınız gibi: **B2B/B2C/C2C/B2G/M2M/S2S/D2D "mühendislik standardı" değil, "iş-modeli capability'sidir".** i18n bir sistem-standardıdır (her ürün ona uymalı); B2B ise bir *yetenektir* (ürün açıp kapatabilir). Aynı listeye koyabilirsiniz ama **aynı sınıfa koyarsanız** mimari çorbaya döner: ajan hepsini "feature" sanıp `if b2b else` çorbası üretir.

İyi haber: repo bunu **zaten doğru ayırmış.** `standards-applicability-matrix`'te iş modelleri "Mode-Profile primitifi" (mimari/capability katmanı) olarak listeli, 15 mühendislik-standardından ayrı. Bu yüzden bu paketteki 13. prompt bir "standart" değil, **Mode-Profile primitifini** (bkz. `plan-01` Dalga 1-2, `plan-03` §Mode-Profile) hedefler.

---

## 2. Kapsama haritası — neyi tekrar üretme

Prompt zincirine başlamadan önce şunu bilin: numeronym listesinin yarısı **zaten var.** Tekrar üretmek drift (kopya-sürüklenme; aynı kuralın iki yerde farklılaşması) yaratır. Tablodan önce sade özet: yeşil olanlar mevcut, kırmızı olanlar gerçek boşluk, gri olanlar "standart değil, araç/domain".

| Numeronym | Durum | Nerede / neden |
|---|---|---|
| i18n, l10n, t9n | Var | `i18n-standard.md` (15. standart) — yalnız Surface i18n alanı eksikti, `plan-01` D0'da eklendi |
| a11y | Var | `dimensions.wcag` + `check-ui-standards`; yalnız AAA→AA düzeltmesi (D0) |
| o11y | Var | `observability` standardı (devops ailesi) |
| API, GraphQL, GUI | Var | `data-api-contract`, `ui-components`, `ux-interaction` standartları |
| E2E, AuthN, AuthZ, RBAC, ABAC | Var (dimension) | `enterprise-dod` + `dimensions.security/testing/owasp` |
| **g11n** | Eksik | Globalizasyon *stratejisi* (i18n taktik; g11n çatı) yok |
| **c12n** (özelleştirme) | Eksik | Tenant/tema/feature-flag özelleştirme standardı yok |
| **c13n** (kanonikleştirme) | Eksik | Slug/URL/Unicode/e-posta/SKU kanonikleştirme standardı yok |
| **i14y** (birlikte-çalışabilirlik) | Eksik | Webhook/idempotency/versiyonlama/SDK-hazırlık çatı standardı yok |
| **p13n** (kişiselleştirme) | Eksik | Kullanıcı-bazlı tercih/kayıtlı-görünüm/dashboard standardı yok |
| **n6n / d10n** | Eksik | Veri normalizasyon/denormalizasyon disiplini standardı yok |
| **v12n** | Eksik | Sanallaştırma/konteyner standardı (deployment içinde kısmi) yok |
| **SSO, MFA, E2EE** | Eksik | AuthN alt-uzmanlıkları ayrı sözleşme değil |
| **IaC** | Eksik | Altyapı-kod standardı yok (deployment içinde ima) |
| **CDN, DNS, WAF, DDoS** | Kısmi | Kenar-güvenlik; `plan-01` D4'te ele alınır |
| **CRUD, REST, RPC, gRPC, SDK, CLI, TUI** | Standart değil | API-stili/araç; standart-değil olarak işaretlenir |
| **CMS, CRM, ERP, ETL, ELT, BI, OLAP, OLTP** | Standart değil | Domain/ürün kavramı; standart değil, *uygulama* |
| **B2B/B2C/C2C/B2G/M2M/S2S/D2D** | Standart değil → capability | Mode-Profile primitifi (bkz. §1) |

**Sonuç:** Prompt zinciri yalnız "Eksik" satırlarına yeni standart üretir; "Var" olanları genişletir; "Standart değil" olanları açıkça standart-DIŞI işaretler.

---

## 3. Reponun sınıflandırma şeması (yeni taksonomi kurma)

Sizin prompt'unuz 11 sınıf öneriyordu. Repo zaten daha sıkı bir şemaya sahip; ona uyun:

- **Aile (`family`):** `engineering | design | testing | devops | ai | data | governance` (`standard.ts`).
- **Kapsam:** WBS seviyesi (app/module/archetype/stone/molecule/element/atom) × yüzey sınıfı (backend/frontend-ui/api-contract/data-schema/infra-ops/doc-governance) (`standards-applicability-matrix`).
- **Zorunluluk (`severity`):** `must | should | may` + `check` alanı (CI kapısı adı).
- **Öncelik:** P0 (sistemsiz çalışmaz) / P1 (enterprise müşteride zorunlu) / P2 (global ölçekte zorunlu) / P3 (opsiyonel).

Prompt çıktıları bu şemaya map edilir; MUST/SHOULD/COULD/NOT-FEATURE listesi `severity` + "standart değil" işaretiyle karşılanır.

---

## 4. Prompt zinciri (kopyala-yapıştır)

Sırayla verin. Her prompt reponun guardrail'lerini taşır: app/module üretme yok, PR-only, test-önce, stack yasakları (Next.js/Supabase/Prisma), emoji yok, Türkçe çıktı, `standardRefs` ile referans (kopya değil).

---

### PROMPT 1 — Numeronym'leri reponun standart sistemine sınıflandır

```
ROL: Sen Staff Software Architect + Enterprise QA Gatekeeper'sın. Bu repo (actionplan) plan+sözleşme katmanıdır; ürün kodu ayrı "platform" monoreposundadır.

GÖREV: Aşağıdaki numeronym/kısaltma listesini, reponun MEVCUT standart sistemine göre sınıflandır. YENİ taksonomi kurma; şu şemaya map et: family (engineering|design|testing|devops|ai|data|governance), severity (must|should|may), priority (P0|P1|P2|P3), ve "standart-DEĞİL" (araç/domain/capability) işareti.

LİSTE: i18n, l10n, g11n, m17n, t9n, a11y, i14y, c12n, c13n, o11y, v12n, p13n, n6n, d10n, AuthN, AuthZ, RBAC, ABAC, IAM, SSO, MFA, JWT, OAuth, OIDC, E2E, E2EE, B2B, B2C, C2C, B2G, M2M, S2S, D2D, CRUD, REST, GraphQL, RPC, gRPC, SDK, API, CLI, GUI, TUI, CI/CD, IaC, CDN, DNS, WAF, DDoS, ORM, CMS, CRM, ERP, ETL, ELT, BI, OLAP, OLTP.

KRİTİK KURALLAR:
- Her kısaltmayı otomatik "feature" sayma. Bazıları standart, bazısı capability, bazısı sadece araç/domain.
- İş modelleri (B2B/B2C/C2C/B2G/M2M/S2S/D2D) STANDART DEĞİL -> "Mode-Profile capability" olarak işaretle.
- CRUD/REST/RPC/gRPC/SDK/CLI/TUI -> "API-stili/araç, standart değil".
- CMS/CRM/ERP/ETL/ELT/BI/OLAP/OLTP -> "domain/uygulama, standart değil".
- Mevcut standartla ÇAKIŞANI (i18n, a11y, o11y, API, E2E, AuthN/Z, RBAC, ABAC) "ZATEN VAR" işaretle; ref: hangi standart/dimension.

ÇIKTI (tablo): Kısaltma | Açılım | family | severity | priority | Zaten var mı (ref) | FastAPI karşılığı | React karşılığı | DB karşılığı | Test kabul kriteri. Sonda MUST/SHOULD/COULD/NOT-FEATURE önceliklendirilmiş liste.

SINIRLAR: Kod yazma. Emoji yok. Türkçe. Sadece analiz + tablo.
```

---

### PROMPT 2 — Mevcut kodu bu standartlara göre denetle

```
ROL: Principal Software Auditor + Enterprise Architecture Reviewer.

GÖREV: platform monoreposunu ve actionplan sözleşmelerini, PROMPT 1'in sınıflandırmasına göre denetle. Kod YAZMA; önce rapor üret.

DENETLE: i18n/l10n/g11n, a11y, AuthN/AuthZ/RBAC/ABAC/IAM/SSO/MFA, c13n/n6n/d10n, c12n/p13n, i14y/API/SDK/webhook, o11y, E2E/E2EE, CI-CD/IaC, WAF/DDoS/rate-limit, iş-modeli-geçişi (Mode-Profile), modüler app mimarisi.

MEVCUT KAPILARI KULLAN (kanıt için): check-standards-coverage, check-dimension-applicability, check-ui-standards, check-i18n, check-core-contract, check-data-quality, check-execution-readiness (tools/agents/*.mjs). Bunların çıktısını kanıt olarak göster.

HER STANDART İÇİN: var mı/yok mu; varsa yüzeysel mi gerçek-enterprise mi; kanıt (dosya yolu/fonksiyon/endpoint/config) — kanıt yoksa "not found" yaz, TAHMİN ETME.

ÇIKTI: "Enterprise Standards Audit Report":
1. Executive Summary
2. Coverage Matrix: Standard | Beklenen | Mevcut durum | Kanıt | Risk (P0/P1/P2) | Eksik parça | Düzeltme | Test kriteri
3. Critical Gaps (P0/P1/P2 sıralı)
4. Architecture Conflicts (ör. AGENTS.md hâlâ Prisma diyor mu? bayat doküman var mı? — plan-00 §4 ile karşılaştır)
5. Implementation Roadmap (Core/Enterprise/Global/Security/DevOps/Observability katmanları)
6. Do Not Implement Yet (gereksiz/yanlış-öncelikli/standart-değil olanlar)

SINIRLAR: Kod yazma. Her iddiaya dosya-yolu kanıtı. Kanıtsız iddia yasak. Emoji yok. Türkçe.
```

---

### PROMPT 3 — Eksik standartları reponun sözleşme sistemine ekle (yeni tree KURMA)

```
ROL: Enterprise Software Architect + Technical Documentation Engineer.

KRİTİK: Yeni bir /docs/standards/00-14 ağacı KURMA. Repo zaten iki-kaynaklı standart sistemine sahip: (1) makine-okur sözleşmeler src/data/standards/*.json (standard.ts şemasına uyar, conformance-test edilir), (2) çatı indeks docs/engineering-standards-index.md. Eksik standartları BUNLARA ekle; drift yaratma.

GÖREV: PROMPT 2'nin "eksik" bulduğu standartlar için (g11n, c12n, c13n, i14y, p13n, n6n/d10n, v12n, SSO, MFA, E2EE, IaC, kenar-güvenlik) src/data/standards/<id>.json sözleşmeleri üret ve engineering-standards-index.md'ye kaydet.

HER STANDART JSON'U (standard.ts şeması): id, name, version, family, basedOnAdr[], summary, appliesTo[], rules[] (>=3: id/rule/rationale/severity/check), banned[], allowed[], references[]. severity: must|should|may. check: ilgili CI kapısı adı.

TEST-ÖNCE:
1. Kırmızı: check-standards-coverage yeni ref'leri çözemiyor (henüz yok).
2. StandardRefsSchema'ya yeni opsiyonel ref anahtarları ekle (geriye-uyumlu).
3. Yeşil: her JSON şemaya uyar, index'e kayıtlı, ref çözülür.

İZİNLİ: src/data/standards/**, src/schemas/standard.ts (ref anahtarı ekleme), docs/engineering-standards-index.md, tests/**.
YASAK: mevcut standart JSON'larının İÇERİĞİNİ değiştirme (yalnız yeni ekle), AGENTS.md, adr-0026/0027, main branch.

İÇERİK KURALLARI: "olmalı" deme, "şu şekilde uygulanır" de. Her standart FastAPI+SQLAlchemy+React karşılığı verir. Next.js/Supabase/Prisma referansı YASAK. Teknik terim İngilizce, açıklama Türkçe. Emoji yok.

ÇIKTI: PR + yeni standart JSON'ları + genişletilmiş StandardRefsSchema + index güncellemesi + kırmızı->yeşil kanıtı + her standart için Requirement-ID tablosu (ID|Requirement|Layer|Priority|TestType|AcceptanceCriteria|Owner).
```

---

Not — 6-14 arası promptlar **uygulama** promptlarıdır ve hepsi ortak bir guardrail taşır. Tekrarı azaltmak için ortak bloğu bir kez veriyorum; her prompt sonunda `[ORTAK-GUARDRAIL]` ile ona atıf var.

**[ORTAK-GUARDRAIL] (her uygulama promptunun sonuna eklenir):**
```
STACK: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL (BE); Vite + React + TanStack Router/Query/Table + RHF/Zod (FE); Strawberry GraphQL + REST (API). YASAK: Next.js, Supabase, Prisma.
TEST-ÖNCE: önce kırmızı test yaz -> çalıştır -> kodu yaz -> yeşile getir. Testi "geçsin diye" zayıflatmak YASAK (gate'i kandırmak = standardı düşürmek).
MUTLAK SINIRLAR: app/module WBS düğümü üretme YOK; ruleset override YOK; main'e doğrudan push YOK; kanıtsız "bitti" YOK; canon doküman (AGENTS.md, adr-0026/0027) düzenleme YOK. Sadece PR aç, insan merge eder.
BİÇİM: emoji YOK; teknik terim İngilizce, açıklama/commit Türkçe; standartları KOPYALAMA, standardRefs ile REFERANS ver.
ÇIKTI: PR + kırmızı->yeşil kanıtı + etkilenen dosyalar + regresyon-risk notu.
```

---

### PROMPT 4 — P0/P1 implementation backlog çıkar (kod yok)

```
ROL: Enterprise delivery planner.
GÖREV: PROMPT 3'teki standard-contract-pack'e göre SADECE P0 ve P1 maddeleri için implementation backlog çıkar. Kod YAZMA.
HER BACKLOG ITEM: dosya yolu, etkilenen modül (platform/<modül>), test tipi (unit/integration/e2e/a11y), acceptance criteria, bağımlılık (dependsOn), tahmini seviye (archetype+ mı, yoksa kernel primitif mi).
ÇIKTI: önceliklendirilmiş backlog tablosu (P0 önce). Emoji yok. Türkçe. Kod yok.
```

---

### PROMPT 5 — P0'dan başla, her seferinde tek standart

```
ROL: Disiplinli geliştirme ajanı.
GÖREV: PROMPT 4 backlog'undaki P0 maddelerden başla. HER SEFERİNDE SADECE BİR standardı uygula. Sıra: (1) dosya planını göster, (2) kod değişikliğini yap, (3) test ekle, (4) testi çalıştır, (5) regresyon-risk raporu ver. Bir standart yeşil olmadan diğerine geçme.
İZİNLİ: yalnız o standardın etkilediği platform modülü + testleri. YASAK: diğer modüller, main.
[ORTAK-GUARDRAIL]
```

---

### PROMPT 6 — i18n / l10n / g11n uygula

```
ROL: i18n/globalizasyon ajanı.
BAĞLAM: i18n zaten 15. standart; Surface i18n alanı plan-01 D0'da eklendi. Bu görevde ÇALIŞAN altyapıyı kur ve g11n çatısını ekle.
İZİNLİ: platform/kernel/i18n/**, frontend/src/i18n/**, ilgili testler, src/data/standards/g11n.json (yeni).
GÖREV: dil dosyaları (ICU MessageFormat), locale resolution (tenant-default -> user-preference sırası), timezone, currency, date/number formatting (CLDR), RTL layout hazırlığı, API hata mesajı çevirisi, frontend translation hook. g11n = i18n+l10n+residency+jurisdiction çatı beyanı (locale != currency != tax != residency ortogonal).
TEST-ÖNCE: unit (formatlama), integration (locale çözümü + fallback), e2e (RTL render + dil değişimi). Pseudo-locale testi ekle.
[ORTAK-GUARDRAIL]
```

---

### PROMPT 7 — a11y uygula (WCAG 2.2 AA taban)

```
ROL: Erişilebilirlik ajanı.
BAĞLAM: WCAG varsayılanı plan-01 D0'da AAA->AA düşürüldü. Taban AA zorunlu; AAA yüzey-bazlı hedef.
İZİNLİ: frontend/src/components/**, frontend/src/**/a11y, testler, eslint-a11y config.
GÖREV: React component seviyesinde semantic HTML, keyboard navigation, focus trap, aria-label/aria-describedby, form error announcement (screen reader), color contrast (AA: normal 4.5:1), screen reader uyumu, mobil min tap-target 44px. Eksik componentleri düzelt; her düzeltmeye test veya lint kuralı ekle.
TEST-ÖNCE: axe-core otomatik tarama (WCAG 2.2 AA) kırmızı -> yeşil; keyboard-only navigasyon e2e.
[ORTAK-GUARDRAIL]
```

---

### PROMPT 8 — AuthN / AuthZ / RBAC / ABAC / IAM (+ SSO / MFA) uygula

```
ROL: Kimlik/yetki ajanı.
BAĞLAM: PDP primitifi (plan-01 D1) HAZIR; bu görev onu TÜKETİR, yeniden yazmaz. SSO/MFA yeni standart olarak eklenir.
İZİNLİ: platform/kernel/authn/**, platform/kernel/authz/** (PDP çağrısı), frontend/src/auth/**, src/data/standards/sso.json + mfa.json (yeni), testler.
GÖREV: tenant-aware permission model, role group, PDP'ye policy sorusu (policy engine yeniden yazma - PDP'yi çağır), route guard, API permission dependency (@RequirePermission), audit log, admin permission matrix, frontend permission-aware rendering. GÜVENLİK: optimistic frontend yetki kontrollerini BACKEND enforcement ile kapat (frontend gizleme != güvenlik). SSO (OIDC/SAML) + MFA (TOTP/WebAuthn) sözleşmesi.
TEST-ÖNCE: unit (rol çözümü), integration (PDP allow/deny + karar-logu), e2e (yetkisiz kullanıcı UI'da göremiyor VE API'da 403 alıyor), security (yetki-bypass denemesi).
[ORTAK-GUARDRAIL]
```

---

### PROMPT 9 — c13n / n6n / d10n (kanonikleştirme + normalizasyon) uygula

```
ROL: Veri-bütünlüğü ajanı.
İZİNLİ: platform/kernel/canonical/**, ilgili modül normalize katmanları, src/data/standards/c13n.json + n6n.json (yeni), migration'lar, testler.
GÖREV: slug canonicalization, URL canonicalization, input normalization, Unicode normalization (NFC), email/phone normalization (E.164), SKU normalization, ürün varyant normalization, duplicate detection, DB constraint (unique/check) + migration stratejisi (expand-contract). d10n: performans için kontrollü denormalizasyon nerede caiz (okuma-yoğun rapor) — kural olarak yaz.
TEST-ÖNCE: unit (her normalize fonksiyonu: idempotent mi?), integration (duplicate DB constraint yakalıyor), migration downgrade testi.
[ORTAK-GUARDRAIL]
```

---

### PROMPT 10 — o11y (gözlemlenebilirlik) uygula

```
ROL: Observability ajanı.
BAĞLAM: observability zaten standart; bu görev ÇALIŞAN altyapıyı kurar.
İZİNLİ: platform/kernel/observability/**, tüm modüllere logger enjeksiyonu, frontend error tracking, testler.
GÖREV: structured logging (JSON), request_id + correlation_id + trace_id yayılımı, audit events, metrics (RED/USE), healthcheck + readiness check, background job görünürlüğü (Celery), API error taxonomy ({code,message,trace_id,details}), admin observability ekranı temel yapısı. print() YASAK -> get_logger().
TEST-ÖNCE: unit (log formatı + trace_id yayılımı), integration (hata -> doğru taxonomy + trace_id), healthcheck/readiness e2e.
[ORTAK-GUARDRAIL]
```

---

### PROMPT 11 — i14y / API birlikte-çalışabilirlik uygula

```
ROL: API interoperability ajanı.
İZİNLİ: platform/apps/*/api/**, platform/kernel/webhook/**, src/data/standards/i14y.json (yeni), OpenAPI/GraphQL şema, testler.
GÖREV: OpenAPI-first contract, stable API versioning, webhook mimarisi (imzalı, retry'li), import/export contract, SDK generation hazırlığı (typed client), REST tutarlılığı, pagination (cursor-based) + filtering + sorting, idempotency key (yazma uçlarında), rate limit header, standart API error schema. GraphQL depth <=10 + complexity limit + DataLoader (N+1 engelle).
TEST-ÖNCE: contract test (OpenAPI/GraphQL şema uyumu), integration (idempotency key tekrarı tek etki; webhook retry), pagination edge (boş/son sayfa).
[ORTAK-GUARDRAIL]
```

---

### PROMPT 12 — c12n / p13n (özelleştirme + kişiselleştirme) uygula

```
ROL: Özelleştirme/kişiselleştirme ajanı.
BAĞLAM: Capability + Mode-Profile primitifleri (plan-01 D1) HAZIR; bu görev onları TÜKETİR.
İZİNLİ: platform/kernel/customization/**, frontend/src/personalization/**, src/data/standards/c12n.json + p13n.json (yeni), testler.
GÖREV: tenant-level customization (tema token, layout preference, feature flags, field visibility rules), saved views, dashboard personalization, per-user preferences, admin configurable modules. c12n = tenant seviyesi (yönetici ayarı); p13n = kullanıcı seviyesi (kişisel tercih) — ikisini AYIR.
TEST-ÖNCE: unit (feature-flag çözümü tenant+user sırası), integration (saved view kalıcılığı), e2e (tema/görünüm değişimi kullanıcı bazında izole).
[ORTAK-GUARDRAIL]
```

---

### PROMPT 13 — İş-modeli geçişi (STANDART DEĞİL — Mode-Profile primitifi)

```
ROL: Mode-Profile ajanı. DİKKAT: Bu bir "standart" değildir; iş modelleri bir CAPABILITY'dir. Yeni standart JSON'u ÜRETME. Bunun yerine Mode-Profile primitifini (plan-01 D1) + Commerce mod anahtarını (plan-01 D2) uygula/genişlet.
İZİNLİ: platform/kernel/mode/**, platform/apps/commerce/mode/**, testler.
GÖREV: B2B, B2C, B2B2B, C2C, B2G, M2M, S2S, D2D modellerinin tek-tıkla-KONTROLLÜ değişimi için business_model_config. Config-driven: fiyatlandırma, checkout, sipariş akışı, teklif akışı (RFQ), min order quantity, approval workflow, account type, tax/invoice logic, permission model DEĞİŞİMİ config ile (kod if/else DEĞİL). Geçiş: preview(dry-run) -> validate -> eksik alan raporu -> insan onayı -> apply-staging -> test -> publish -> rollback. Versiyonlu config + canlı-veri korunumu ZORUNLU.
TEST-ÖNCE: integration (mod geçişi capability setini değiştiriyor; canlı sipariş korunuyor), e2e (B2C->B2B tam senaryo + rollback).
[ORTAK-GUARDRAIL]
```

---

### PROMPT 14 — DevOps / kenar-güvenlik (IaC, WAF, DDoS, secrets) uygula

```
ROL: DevOps/kenar-güvenlik ajanı.
BAĞLAM: plan-01 D4 ile örtüşür; oradaki scale-invariant + audit ile çakışma yaratma, tamamla.
İZİNLİ: .github/workflows/**, infra/** (IaC), platform/kernel/security-edge/**, src/data/standards/iac.json + edge-security.json (yeni), testler.
GÖREV: CI/CD, IaC hazırlığı (Hetzner/Debian/AMD EPYC, Docker Compose baz), env validation, secret management (Vault/env; repoda düz-metin secret YOK), security headers, CORS policy, rate limiting, WAF-ready logging, DDoS mitigation kancaları, backup/restore hazırlığı, deployment checklist. Kod değişikliği KÜÇÜK ve test edilebilir parçalar halinde.
TEST-ÖNCE: secrets taraması (gitleaks) yeşil, rate-limit header testi, env-validation testi, deploy dry-run.
[ORTAK-GUARDRAIL]
```

---

## 5. Zinciri koşarken

Sıra: PROMPT 1 (sınıflandır) → 2 (denetle) → 3 (sözleşmeye ekle) → 4 (backlog) → 5 (tek-tek başla) → 6-14 (uygula). 6-14 birbirinden **büyük ölçüde bağımsız** olduğu için paralel ajanla koşulabilir (bkz. `plan-04`); tek istisna: 8, 12, 13 primitiflere (PDP, Capability, Mode-Profile) bağlı olduğundan `plan-01` Dalga 1 bitmeden başlamaz. Her prompt ayrı küçük PR üretir; insan her standart sözleşmesini önceliğiyle onaylar.

