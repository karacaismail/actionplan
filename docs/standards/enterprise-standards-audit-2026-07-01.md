# Enterprise Standards Audit Report — actionplan (plan+sözleşme katmanı)

**Tarih:** 2026-07-01 · **Denetim türü:** Standart kapsam denetimi (audit; kod yazılmadı) · **Denetleyen rol:** Principal Software Auditor + Enterprise Architecture Reviewer
**Format:** `plan-02` PROMPT 2 · **Çıktı hedefi:** `docs/standards/enterprise-standards-audit-2026-07-01.md`

**KAPSAM SINIRI (bağlayıcı):** Bu denetim yalnızca `actionplan` deposunu (plan + sözleşme + şema katmanı) kapsar. 2026-07-01 snapshot'ında gerçek ürün kodu mount'lu değildi; bu yüzden her kod-seviyesi (runtime/endpoint/servis) iddiası için "platform repo mount'lu değil — doğrulanamadı" yazılmıştı. 2026-07-08 itibarıyla yerel implementation checkout'u `/Users/karaca/DEV/mimari/platform`, branch `master`, remote yok olarak ayrıca belgelenmiştir; bu audit yine de platform kodunu incelemiş sayılmaz. Değerlendirilen katman: `src/schemas/*.ts` (şema), `src/data/standards/*.json` (standart sözleşmeleri), `tools/agents/check-*.mjs` (CI kapıları), `.github/workflows/deploy.yml` (bloklayıcı kapı listesi), `docs/*` (kanonik dokümanlar), `AGENTS.md` (ajan sözleşmesi).

Güncel kullanım notu (2026-07-08): Bu rapor tarihsel standart-kapsam denetimidir. 2026-07-08 itibarıyla `src/data/standards/` altında 30 JSON standart sözleşmesi vardır; `g11n`, `c12n`, `c13n`, `i14y`, `p13n`, `data-normalization`, `sso`, `mfa`, `edge-security` ve `iac` sözleşmeleri eklenmiştir. `check-i18n.mjs` ve `check-core-contract.mjs` de artık vardır ve CI zincirindedir. Aşağıdaki "eksik" teşhisleri bu güncel not ve güncellenmiş satırlarla birlikte okunur.

---

## 1. Executive Summary

Aşağıdaki paragraf denetimin ana bulgusunu özetler; sonrasında kanıt tabloları gelir.

`actionplan`'ın **standart işletim katmanı olgun ve tutarlıdır**: 2026-07-08 itibarıyla 30 mühendislik standardı `src/data/standards/*.json` altında tek-kaynak sözleşme olarak yaşıyor, `src/schemas/standard.ts` (`StandardContractSchema`) ile şemaya bağlı, `src/schemas/task.ts` (`StandardRefsSchema`) ile düğüme referanslanıyor ve bloklayıcı CI kapıları `deploy.yml` içinde koşuyor. 2026-07-01 snapshot'ında eksik görünen numeronym ve güvenlik standartlarının çoğu artık sözleşme düzeyinde vardır. Kalan yapısal boşluklar farklıdır: (1) beş iş-evreni primitifi (Actor/Capability/PDP/Mode-Profile/Computation) hâlâ plan/sözleşme düzeyi ile sınırlı, platform runtime kanıtı bu repoda yok; (2) platform kodu audit edilmemiştir; (3) bazı kapılar gerçek platform davranışını değil plan/sözleşme beyanını doğrular; (4) Surface i18n/a11y gibi alanlarda şema-veri-kapı kapsamının ayrıca ratchet edilmesi gerekir.

**Güncel skor (sözleşme/şema katmanı):** Denetimin eski 12 hedef standart-kümesinde artık sözleşme dosyası olmayan ana başlık kalmadı; eksik olarak izlenen alanların çoğu `src/data/standards/*.json` ve `StandardRefsSchema` içinde karşılık buldu. Kod-seviyesi (platform) kabiliyet iddiaları hâlâ **doğrulanmadı**; bu repo ürün kodu değil, sözleşme/handoff deposudur.

---

## 2. Standards Coverage Matrix

Aşağıdaki tablo, istenen numeronym kümelerini bu depodaki (plan/sözleşme/şema) mevcut durumla eşler. "Mevcut durum" yalnızca `actionplan` katmanına bakar; platform kodu değerlendirilmemiştir. Risk P0 = sistemsiz/yanlış-üretim, P1 = enterprise müşteride zorunlu, P2 = global ölçekte zorunlu.

| Standart | Beklenen enterprise kabiliyet | Mevcut durum (plan/sözleşme katmanı) | Kanıt (dosya yolu / şema alanı / kapı) | Risk | Eksik parça | Gerekli düzeltme | Test kriteri |
|---|---|---|---|---|---|---|---|
| **i18n / l10n** | ICU MessageFormat, CLDR biçimleme, RTL, çevrilebilir alan, fallback, locale-resolution | VAR (güçlü). 6-eksen ortogonal model sözleşmede: Locale≠Jurisdiction≠Currency≠Tax≠Timezone≠Residency; `check-i18n` artık CI kapısıdır. | `src/data/standards/i18n-standards.json`; `standardRefs.i18nRef`; `tools/agents/check-i18n.mjs`; `.github/workflows/deploy.yml` | P1 | Surface i18n şeması/ratchet kapsamı ayrı izlenir | Surface i18n alanını ve veri kapsamını ratchet et | Kapı ham-string/eksik-anahtar/logical-property taramasında kırmızı→yeşil |
| **g11n (globalizasyon)** | i18n+l10n+residency+jurisdiction'ı kapsayan çatı strateji beyanı | VAR. g11n çatı standardı ve `g11nRef` şema bağı eklendi. | `src/data/standards/g11n.json`; `src/schemas/task.ts` `g11nRef` | P2 | Platform policy resolver kanıtı bu repoda yok | Implementation görevi `repoPath/testCommand/evidence` ile açılır | Conformance: g11n eksen-kombinasyon çakışma testi yeşil |
| **a11y (WCAG 2.2)** | AA taban, klavye, focus, kontrast, tap-target, axe 0 ihlal | VAR. `dimensions.wcag` boyutu + axe E2E kapısı; Surface tabanı `"2.2-AA"`; AAA opsiyonel hedef olarak kalır. | `src/schemas/task.ts` `DIMENSION_KEYS[wcag]`; `src/schemas/surface.ts` `wcag.default("2.2-AA")`; `deploy.yml` "E2E + axe" | P1 | Ürün-yüzeyi özel AAA hedefleri evidence ister | AA tabanı koru, AAA'yı yüzey-bazlı hedef bırak | Axe WCAG 2.2 AA taramasında kritik/serious ihlal = 0 |
| **AuthN / AuthZ / RBAC / ABAC / IAM** | Kimlik doğrulama + yetki modeli + endpoint koruması + audit | VAR/KISMİ. AuthZ/RBAC/ABAC, SSO, OIDC ve MFA standartları sözleşme düzeyinde var; endpoint-enforcement platform kodunda doğrulanmadı. | `src/data/standards/authz-rbac-abac.json`; `sso.json`; `oidc.json`; `mfa.json`; `src/schemas/archetype.ts` `AccessPolicySchema` | P1 | Platform endpoint enforcement kanıtı yok | Platform denetimini ayrı implementation görevi yap | RBAC matris + yetkisiz istek 403 (platform) |
| **SSO / MFA** | OIDC/SAML SSO, TOTP/WebAuthn MFA sözleşmesi | VAR. SSO ve MFA ayrı standart sözleşmeleri olarak eklendi. | `src/data/standards/sso.json`; `src/data/standards/mfa.json`; `src/schemas/task.ts` `ssoRef`/`mfaRef` | P1 | Runtime callback/step-up test kanıtı platform işidir | Implementation görevi `repoPath/testCommand/evidence` ile açılır | Integration: SSO callback + MFA step-up karar-logu (platform) |
| **c13n (kanonikleştirme)** | Slug/URL/Unicode-NFC/e-posta(E.164)/SKU kanonikleştirme | VAR. c13n kanonikleştirme standardı ve `c13nRef` eklendi. | `src/data/standards/c13n.json`; `src/schemas/task.ts` `c13nRef` | P1 | Fonksiyon/test uygulaması platform işidir | Platform implementation görevi açılır | Unit: her normalize fonksiyonu idempotent; DB unique constraint yakalıyor |
| **n6n / d10n (normalizasyon/denormalizasyon)** | Veri normalizasyon disiplini + kontrollü denormalizasyon kuralı | VAR. Standart dosyası `data-normalization.json` olarak yaşıyor; şema bağı `dataNormalizationRef`. | `src/data/standards/data-normalization.json`; `src/schemas/task.ts` `dataNormalizationRef` | P2 | Migration/runtime kanıtı platform işidir | Platform implementation görevi açılır | Migration downgrade testi + duplicate-detection integration |
| **c12n (özelleştirme)** | Tenant tema token + layout + feature-flag + field-visibility | VAR. Tenant-seviyesi özelleştirme standardı ve `c12nRef` eklendi. | `src/data/standards/c12n.json`; `src/schemas/task.ts` `c12nRef` | P1 | Feature-flag resolver runtime kanıtı platform işidir | Platform implementation görevi açılır | Feature-flag çözümü tenant sırası unit + saved-view kalıcılık |
| **p13n (kişiselleştirme)** | Kullanıcı-bazlı tercih + kayıtlı-görünüm + dashboard | VAR. Kullanıcı-seviyesi kişiselleştirme standardı ve `p13nRef` eklendi. | `src/data/standards/p13n.json`; `src/schemas/task.ts` `p13nRef` | P2 | Kullanıcı izolasyonu runtime kanıtı platform işidir | Platform implementation görevi açılır | e2e: tema/görünüm kullanıcı bazında izole |
| **i14y / API / SDK / webhook** | OpenAPI-first, versiyonlama, imzalı+retry'li webhook, idempotency, cursor pagination, SDK-hazırlık | VAR. i14y çatı standardı data-api-contract'ı kopyalamadan dış entegrasyon katmanını tamamlar. | `src/data/standards/i14y.json`; `src/data/standards/data-api-contract.json`; `src/schemas/task.ts` `i14yRef` | P1 | Public API/webhook runtime kanıtı platform işidir | Platform implementation görevi açılır | Contract test + idempotency-key tekrar tek-etki integration |
| **o11y (observability)** | Structured JSON log, correlation/request/trace id, RED/USE metrik, SLO, dashboard, alert | VAR (güçlü). RED/USE + SLO + trace + correlation + dashboard sözleşmede | `src/data/standards/observability.json` (RED×4, USE×3, SLO×4, correlation×11, trace×10, dashboard×7); `standardRefs.observabilityRef` | P2 | Kapı `check-observability` ayrı yok; kanıt `evidence[]`'a bırakılmış | (Opsiyonel) log-format lint kapısı; şimdilik review+test yeterli | Log formatı + trace_id yayılımı unit (platform) |
| **E2E / E2EE** | E2E: uçtan-uca kullanıcı akışı testi. E2EE: uçtan-uca şifreleme | KISMI. E2E VAR (Playwright kapısı); hedefli-kapsam E2EE beyanı `edge-security` içinde var, ürün-özel kripto implementation kanıtı yok. | E2E: `deploy.yml` "E2E + axe" + `dimensions.testing` + `enterprise-dod §2.11`; `src/data/standards/edge-security.json` | P2 | E2EE gerekiyorsa ürün-özel kanıt gerekir | E2EE gerekmeyen ürünlerde kapsam-dışı beyanı, gerekenlerde implementation görevi | E2E: Playwright happy+sad path yeşil; E2EE: platform kanıtı |
| **CI-CD / IaC** | Otomatik build/test/deploy, IaC, secret yönetimi, zero-downtime | VAR/KISMİ. CI/CD VAR; IaC standardı, secret-management ve env-validation sözleşme düzeyinde var. | `.github/workflows/deploy.yml`; `release-versioning.json`; `src/data/standards/iac.json`; `tools/agents/check-secrets.mjs` | P1 | Product deploy dry-run platform işidir | Platform deploy runbook/evidence görevi açılır | secrets kapısı yeşil + env-validation testi + deploy dry-run |
| **WAF / DDoS / rate-limit** | Kenar güvenlik: WAF-ready log, DDoS mitigation, rate-limit header, CORS, security headers | VAR. Kenar-güvenlik standardı ve `edgeSecurityRef` eklendi. | `src/data/standards/edge-security.json`; `src/schemas/task.ts` `edgeSecurityRef` | P1 | Edge runtime/config kanıtı platform işidir | Platform implementation görevi açılır | rate-limit header testi + CORS policy testi (platform) |
| **İş-modeli-geçişi (Mode-Profile)** | B2B/B2C/C2C/B2G/M2M/S2S/D2D config-driven geçiş (if/else değil) | KISMI (doğru sınıflanmış). Standart-DEĞİL, capability olarak matriste; ama Mode-Profile **primitifi şemada yok** | `standards-applicability-matrix §2.1` (Mode-Profile primitifi listeli); `src/schemas/archetype.ts` içinde ModeProfile schema **not found** (C6) | P0 | Mode-Profile primitif şeması + versiyonlu business_model_config | ADR ile kilitle + şemaya al (`plan-01` D1); `plan-02 PROMPT 13` | Integration: mod geçişi capability setini değiştiriyor, canlı sipariş korunuyor |
| **Modüler app mimarisi** | 7-seviye WBS + bounded-context + engine↔UI ayrımı + app/module kapsam kilidi | VAR (güçlü). 7-seviye hiyerarşi + faz kapıları + AI yetki sınırı | `src/schemas/task.ts` `WBS_LEVELS` (app→atom), `WATERFALL_PHASES`, `AgentPolicySchema.forbiddenTargets=["app","module"]`; `architecture.json` | P2 | (Yapısal boşluk yok) — beş primitif eklenince tamamlanır | Primitifleri (Actor/Capability/PDP) ekleyerek domain-modelleme tamamla | check-standards-coverage yeşil + architecture conformance |

---

## 3. Critical Gaps (P0 / P1 / P2)

Aşağıdaki liste boşlukları öncelik sırasına dizer; her madde kanıt ve etkiyi taşır.

**P0 — sistemsiz/yanlış-üretim (önce bunlar):**
- **G-P0-1 — Beş iş-evreni primitifi kodda yok (C6).** Actor / Capability / PDP (Policy Decision Point) / Mode-Profile / Computation `src/schemas/archetype.ts` içinde first-class schema olarak **bulunamadı** (yalnız `AccessPolicySchema` deklaratif model taşıyor; `ModeProfile`/`Capability`/`PDP` schema yok). Portföyün yarısı (B2B↔C2C mod geçişi, lisans/yetenek, fiyat/BOM hesabı) bu primitifler olmadan modellenemez. Kaynak: `plan-00 §4 C6`, `standards-applicability-matrix §2.1` (primitifler "eklenecek" olarak listeli).
- **G-P0-2 — `AGENTS.md:82` bayat stack (Prisma) (C1) kapandı.** Güncel stack FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL olarak hizalıdır. Kalan P0 risk, platform implementation kanıtının bu audit kapsamında olmamasıdır.

**P1 — enterprise müşteride zorunlu:**
- **G-P1-1 — `check-i18n` kapısı yoktu; kapandı.** 2026-07-08 itibarıyla `tools/agents/check-i18n.mjs` vardır ve deploy CI zincirinde koşar. Kalan risk: surface i18n alanının ve veri kapsamının ratchet edilmesi.
- **G-P1-2 — AuthN/IAM/SSO/MFA ayrı sözleşme değildi; kapandı.** `authz-rbac-abac.json`, `sso.json`, `oidc.json` ve `mfa.json` vardır. Kalan risk: platform endpoint enforcement ve step-up MFA runtime kanıtı.
- **G-P1-3 — Kenar-güvenlik sözleşmesi yoktu; kapandı.** `edge-security.json` vardır. Kalan risk: WAF/rate-limit/CORS/security-header uygulama kanıtı platform reposundadır.
- **G-P1-4 — c12n / c13n / i14y / IaC standartları eksikti; kapandı.** `c12n.json`, `c13n.json`, `i14y.json` ve `iac.json` vardır. Kalan risk: bu standartları tüketen gerçek implementation görevlerinin kanıt paketi.
- **G-P1-5 — Surface a11y/i18n çelişkileri kapandı.** `SurfaceA11ySchema.wcag` tabanı `"2.2-AA"` ve `SurfaceContractSchema.i18n` alanı vardır. Kalan iş: gerçek surface kayıtlarında kapsam ratchet'i.

**P2 — global ölçekte zorunlu:**
- **G-P2-1 — g11n / p13n / n6n-d10n standartları eksikti; kapandı.** `g11n.json`, `p13n.json` ve `data-normalization.json` vardır.
- **G-P2-2 — E2EE sözleşmesi hedefli kapsama taşındı.** `edge-security.json` hedefli E2EE beyanını taşır; uçtan-uca şifreleme gereken ürünlerde yine implementation kanıtı gerekir.
- **G-P2-3 — v12n (sanallaştırma/konteyner) ayrı standart değil** (deployment içinde kısmi).

**Kod-seviyesi (platform/kernel) boşlukları:** Bu denetimde **değerlendirilemedi**. 2026-07-08 itibarıyla local implementation checkout'u `/Users/karaca/DEV/mimari/platform` olarak belgelenmiştir; ancak bu audit o kodu incelememiştir. Auth endpoint enforcement, gerçek i18n runtime, webhook imzalama, rate-limit middleware gibi iddialar için ayrı implementation denetimi gerekir.

---

## 4. Architecture Conflicts — plan-00 §4 (C1–C6) Doğrulaması

Aşağıdaki tablo `plan-00 §4`'teki altı çelişkinin her birini bu depodaki dosya kanıtıyla doğrular (veya durumunu günceller).

| # | Çelişki (plan-00 iddiası) | Denetim sonucu | Kanıt (dosya:satır / şema alanı) |
|---|---|---|---|
| **C1** | `AGENTS.md` eski backend kilidi beyanı SQLAlchemy 2.0 kararıyla çelişiyordu | **KAPATILDI.** Güncel stack: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL; yasak ORM/stack ifadeleri aktif dokümanlardan çıkarıldı. | `AGENTS.md` güncel stack satırı; `enterprise-dod.md:5`, `plan-02` guardrail |
| **C2** | Seed script'lerinde Prisma/PostgreSQL kalıntısı | **KAPATILDI / yanlış-pozitif ayrıldı.** Güncel grep'te Prisma geçen seed satırı yasak-stack invariantıdır: "Supabase ve Prisma YASAK; backend veri katmanı FastAPI + SQLAlchemy/SQLModel + Alembic + PostgreSQL". Bu aktif yanlış stack önerisi değildir. | `tools/agents/seed-frontend.mjs` yasak-stack notu; `check-vibecoding-ready.mjs` stack drift taraması |
| **C3** | Surface şeması `wcag` varsayılanı `"2.2-AAA"`; oysa AA zorunlu, AAA yüzey-bazlı | **KAPATILDI.** `SurfaceA11ySchema.wcag = z.string().default("2.2-AA")`; AAA opsiyonel hedef olarak dokümanda kalır. | `src/schemas/surface.ts` `wcag.default("2.2-AA")` |
| **C4** | Surface şemasında **i18n alanı yok** | **KAPATILDI.** `SurfaceContractSchema.i18n` artık `locales`, `defaultLocale`, `rtl`, `messagesRef` taşır. | `src/schemas/surface.ts` `i18n` alanı |
| **C5** | Ölçek primitifleri (outbox/idempotency/tenant-rate-limit) "opt-in bayrak"; bazıları zorunlu-invariant olmalı | **KISMEN KAPATILDI.** `scale-invariant-directive.md` ve `check-scale-invariant.mjs` vardır; bu kapı plan/sözleşme beyanını zorlar. Kalan risk: platform runtime'da outbox/idempotency davranışı bu audit kapsamında doğrulanmadı. | `docs/scale-invariant-directive.md`; `tools/agents/check-scale-invariant.mjs`; `.github/workflows/deploy.yml` |
| **C6** | Beş primitif sözleşmede taslak, kodda yok | **DOĞRULANDI.** `src/schemas/archetype.ts` içinde `grep` ile Actor/Capability/PolicyDecisionPoint/ModeProfile/Computation first-class schema **bulunamadı** (yalnız audit-log alanında "actor" string'i geçiyor). `AccessPolicySchema` yetki modelini deklare ediyor ama PDP karar-motoru primitifi yok. | `src/schemas/archetype.ts` (primitif schema **not found**); yalnız `archetype.ts:190` "actor" audit alanı |

Ek çelişki (denetimde saptanan, plan-00 listesinde olmayan):
- **C7 (güncel: kapandı) — `check-i18n` ve `check-core-contract` hayalet kapıydı.** 2026-07-08 itibarıyla `tools/agents/check-i18n.mjs` ve `tools/agents/check-core-contract.mjs` vardır, `.github/workflows/deploy.yml` içinde koşar ve `package.json` `qa:ci` zincirine bağlıdır. Kalan risk: `check-core-contract` platform kodunu değil sözleşme paketindeki zorunlu referansları denetler.

Kritik not (güncel): C1/C3/C4/C7 artık repo gerçekliğinde kapalıdır. Bu rapor tarihsel akışı korur; güncel implementation riskleri platform runtime kanıtı ve surface kayıtlarının ratchet edilmesidir.

---

## 5. Implementation Roadmap

Aşağıdaki yol haritası boşlukları katmana göre sıralar; her katman "önce sözleşme, sonra platform-kod" ilkesini izler (platform işi bu depoda yapılmaz, ayrı repo görevine devredilir).

**Katman 0 — Bayat/çelişki temizliği (Dalga 0, kod yok, önce bu):**
- C1: `AGENTS.md` stack satırı FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL olarak güncel.
- C3: `surface.ts` `wcag` default `"2.2-AA"` yapıldı.
- C4: `SurfaceContractSchema`'ya `i18n{locales,defaultLocale,rtl,messagesRef}` eklendi.
- C7: `check-i18n.mjs` + `check-core-contract.mjs` yazıldı ve CI'a bağlandı; artık platform runtime kapsamı ayrı implementation kanıtıyla izlenir.

**Katman Core (Domain primitifleri — P0):**
- Actor / Capability / PDP / Mode-Profile / Computation için ADR + `src/schemas/archetype.ts` (veya yeni `primitives.ts`) şeması. Kaynak: `plan-01` Dalga 1. Bu, matris §2.1'i koddan doğrular hâle getirir.

**Katman Enterprise (P1 sözleşmeler):**
- `c12n.json` (tenant özelleştirme), `c13n.json` (kanonikleştirme), `i14y.json` (API-interop/webhook/idempotency/SDK) sözleşmeleri ve `StandardRefsSchema` anahtarları eklendi. Kalan iş: bu standartları gerçek implementation düğümlerine kanıtla bağlamak.

**Katman Global (P2 sözleşmeler):**
- `g11n.json` (globalizasyon çatısı), `p13n.json` (kişiselleştirme), `data-normalization.json` (n6n/d10n) sözleşmeleri eklendi. Kalan iş: platform resolver/migration kanıtı.

**Katman Security (P1):**
- `sso.json` + `mfa.json` (AuthN alt-uzmanlıkları), `oidc.json` ve `edge-security.json` (WAF/DDoS/rate-limit/CORS/headers) eklendi. Kalan iş: platform enforcement kanıtı.

**Katman DevOps (P1):**
- `iac.json` (Hetzner/Debian/Docker Compose baz, secret-management), `check-i18n.mjs`, `check-core-contract.mjs` ve ilgili CI bağlantıları eklendi. Kalan iş: product deployment dry-run/evidence paketi.

**Katman Observability (P2, olgun):**
- o11y sözleşmesi güçlü; yalnız (opsiyonel) log-format lint kapısı ve dashboard/alert kanıtının `evidence[]`'a bağlanması. Yeni sözleşme gerekmez.

**Katman BusinessModel (P0 primitif-bağımlı):**
- Mode-Profile primitifi (Core katmanı) kilitlendikten sonra business_model_config (B2B/B2C/C2C/B2G/M2M/S2S/D2D) versiyonlu geçiş. Standart DEĞİL; capability. Kaynak: `plan-02 PROMPT 13`.

Sıra bağımlılığı: Katman 0 → Core → (Enterprise ∥ Global ∥ Security ∥ DevOps paralel) → BusinessModel. Security PROMPT 8/12/13 primitiflere bağlı olduğundan Core bitmeden başlamaz (`plan-02 §5`).

---

## 6. Do Not Implement Yet

Aşağıdaki maddeler gereksiz, yanlış-öncelikli veya standart-değildir; şimdi uygulanırsa mimari çorbası veya drift üretir.

- **İş modellerini (B2B/B2C/C2C/B2G/M2M/S2S/D2D) "standart" olarak modelleme.** Bunlar **capability**'dir, mühendislik standardı değil. `plan-02 §1` ve `matris §2.1` doğru ayırmış: Mode-Profile primitifi olarak modellenir, `standards/*.json`'a **eklenmez**. Yeni `b2b.json` gibi bir standart dosyası üretmek yasaktır.
- **CRUD / REST / RPC / gRPC / SDK / CLI / TUI için standart sözleşmesi.** Bunlar API-stili/araçtır; `i14y.json` içinde kural olarak geçer ama ayrı standart dosyası olmaz (`plan-02 §2` "Standart değil").
- **CMS / CRM / ERP / ETL / ELT / BI / OLAP / OLTP standardı.** Domain/uygulama kavramı; standart değil (`plan-02 §2`).
- **Yeni `/docs/standards/00-14` numaralı ağaç kurma.** Repo iki-kaynaklı sisteme sahip (`src/data/standards/*.json` + `engineering-standards-index.md`); paralel ağaç drift üretir (`plan-02 PROMPT 3` KRİTİK uyarısı).
- **v12n (sanallaştırma) için ayrı standart — şimdilik.** `iac.json` içinde container/IaC kapsamı vardır; ayrı v12n standardı ancak ürün deploy topolojileri bunu gerektirirse açılır.
- **E2EE'yi varsayılan zorunlu yapma.** Portföyün çoğu için gereksiz; yalnız gerçekten uçtan-uca şifreleme gereken ürün (ör. mesajlaşma) için hedefli sözleşme; aksi halde "kapsam-dışı" beyanı yeterli.
- **platform kodu iddialarını bu depoda "kanıtlanmış" sayma.** Implementation workspace artık belgelenmiş olsa bile bu audit platform runtime'ını incelemez; kod-seviyesi denetim ayrı görev + `repoPath/testCommand/evidence` ister.

---

## Ek — Doğrulanan CI Kapıları (deploy.yml, bloklayıcı)

Şu adımlar `deploy.yml`/`qa:ci` zincirinde bloklayıcı olarak koşuyor (kanıt olarak listelendi): `typecheck`, `lint`, `check-content`, `test:content`, `check-ruleset`, `check-surface`, `check-tech-profile`, `check-standards-coverage`, `check-dimension-applicability`, `check-waivers`, `check-short-code`, `check-dependency-policy`, `check-ui-standards`, `check-i18n`, `check-core-contract`, `qa:delivery-sequence`, `quality-lint`, `check-data-quality`, `check-execution-readiness`, `check-ready-for-dev`, `qa:vibecoding`, `qa:waterfall`, `check-scale-invariant`, `check-atomic-types`, `check-fragments`, `check-execution-contract`, `qa:flow`, `check-secrets`, testler, E2E + axe ve build. Ayrı `check-observability` yoktur; observability bugün standart/evidence/review kanalıyla izlenir.

*Bu dosya bir denetim raporudur; tarihsel snapshot niteliği korunur. 2026-07-08 güncellemesi, raporun bugünkü repo gerçekliğiyle çelişen standart/kapı satırlarını düzeltmiştir; doğrulanamayan platform katmanı hâlâ ayrı implementation denetimi ister.*
