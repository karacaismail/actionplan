# Enterprise Standards Audit Report — actionplan (plan+sözleşme katmanı)

**Tarih:** 2026-07-01 · **Denetim türü:** Standart kapsam denetimi (audit; kod yazılmadı) · **Denetleyen rol:** Principal Software Auditor + Enterprise Architecture Reviewer
**Format:** `plan-02` PROMPT 2 · **Çıktı hedefi:** `docs/standards/enterprise-standards-audit-2026-07-01.md`

**KAPSAM SINIRI (bağlayıcı):** Bu denetim yalnızca `actionplan` deposunu (plan + sözleşme + şema katmanı) kapsar. Gerçek ürün kodu `platform` monoreposunda ve `atonota/kernel` reposundadır; bu repolar bu oturumda **mount'lu değildir, erişilemez**. Bu yüzden her kod-seviyesi (runtime/endpoint/servis) iddiası için "platform repo mount'lu değil — doğrulanamadı" yazılmıştır. Kanıt bulunamayan yer için "not found" denmiş, tahmin yürütülmemiştir. Değerlendirilen katman: `src/schemas/*.ts` (şema), `src/data/standards/*.json` (15 standart sözleşmesi), `tools/agents/check-*.mjs` (CI kapıları), `.github/workflows/deploy.yml` (bloklayıcı kapı listesi), `docs/*` (kanonik dokümanlar), `AGENTS.md` (ajan sözleşmesi).

---

## 1. Executive Summary

Aşağıdaki paragraf denetimin ana bulgusunu özetler; sonrasında kanıt tabloları gelir.

`actionplan`'ın **standart işletim katmanı olgun ve tutarlıdır**: 15 mühendislik standardı `src/data/standards/*.json` altında tek-kaynak sözleşme olarak yaşıyor, `src/schemas/standard.ts` (`StandardContractSchema`) ile şemaya bağlı, `src/schemas/task.ts` (`StandardRefsSchema`) ile düğüme referanslanıyor ve 17 bloklayıcı CI kapısı `deploy.yml` içinde koşuyor. Sözleşme katmanında i18n/l10n (6-eksen ortogonal model), o11y (RED/USE + SLO + trace), ai-governance (prompt registry + eval kapısı + kill-switch), release-versioning (SemVer + feature-flag + blue-green/canary) ve RBAC/ABAC/ReBAC (ArcheType `AccessPolicySchema`) **beklenen enterprise kabiliyeti sözleşme düzeyinde karşılıyor**. Ancak beş yapısal boşluk var: (1) beş iş-evreni primitifi (Actor/Capability/PDP/Mode-Profile/Computation) **sözleşmede taslak, şemada yok** (`src/schemas/archetype.ts` içinde first-class schema bulunamadı) — C6 doğrulandı; (2) altı numeronym standardı (g11n, c12n, c13n, i14y, p13n, n6n/d10n) **eksik**; (3) AuthN/AuthZ/IAM/SSO/MFA için **ayrı standart sözleşmesi yok** (auth yalnız `dimensions.security/owasp` + `enterprise-dod` DoD'unda yaşıyor); (4) i18n standardının kuralları **`check-i18n` kapısına atıf yapıyor ama o kapı `tools/agents/` altında yok ve `deploy.yml`'de koşmuyor** — deklare ama zorlanmıyor; (5) `AGENTS.md:82` hâlâ **yasak olan Prisma'yı "backend kilidi" diye gösteriyor** (C1) — bu, her ajanın ilk okuduğu dosya olduğu için en yüksek-öncelikli çelişki.

**Kaba skor (sözleşme/şema katmanı):** 12 hedef standart-kümesinden **7'si kapsanan** (i18n/l10n, a11y, AuthN/AuthZ/RBAC/ABAC, o11y, E2E, CI-CD, modüler-app-mimarisi — tam veya güçlü kısmi), **5'i eksik/kısmi** (g11n, c12n/p13n, c13n/n6n/d10n, i14y/webhook/SDK, WAF/DDoS/rate-limit). Mode-Profile ve modüler-app matriste doğru sınıflanmış ama primitif kodda yok. Kod-seviyesi (platform) kabiliyet iddiaları **doğrulanamadı** (repo mount'lu değil).

---

## 2. Standards Coverage Matrix

Aşağıdaki tablo, istenen numeronym kümelerini bu depodaki (plan/sözleşme/şema) mevcut durumla eşler. "Mevcut durum" yalnızca `actionplan` katmanına bakar; platform kodu değerlendirilmemiştir. Risk P0 = sistemsiz/yanlış-üretim, P1 = enterprise müşteride zorunlu, P2 = global ölçekte zorunlu.

| Standart | Beklenen enterprise kabiliyet | Mevcut durum (plan/sözleşme katmanı) | Kanıt (dosya yolu / şema alanı / kapı) | Risk | Eksik parça | Gerekli düzeltme | Test kriteri |
|---|---|---|---|---|---|---|---|
| **i18n / l10n** | ICU MessageFormat, CLDR biçimleme, RTL, çevrilebilir alan, fallback, locale-resolution | VAR (güçlü). 6-eksen ortogonal model sözleşmede: Locale≠Jurisdiction≠Currency≠Tax≠Timezone≠Residency | `src/data/standards/i18n-standards.json` (8 rule: message-format, locale-formatting, rtl, translatable-fields, jurisdiction-orthogonal, data-residency, workflow); `standardRefs.i18nRef` | P1 | Kural `check-i18n`'e atıf yapıyor ama kapı yok | `check-i18n.mjs` yaz + `deploy.yml`'e ekle | Kapı ham-string/eksik-anahtar/logical-property taramasında kırmızı→yeşil |
| **g11n (globalizasyon)** | i18n+l10n+residency+jurisdiction'ı kapsayan çatı strateji beyanı | EKSİK (kısmi). Eksenler i18n içinde var ama ayrı g11n çatı sözleşmesi yok | `src/data/standards/g11n.json` → **not found**; `plan-02 §2` "g11n Eksik" | P2 | Çatı standart + `g11nRef` anahtarı | `g11n.json` üret (locale/currency/tax/residency ortogonal beyan), `StandardRefsSchema`'ya opsiyonel `g11nRef` ekle | Conformance: g11n eksen-kombinasyon çakışma testi yeşil |
| **a11y (WCAG 2.2)** | AA taban, klavye, focus, kontrast, tap-target, axe 0 ihlal | VAR. `dimensions.wcag` boyutu + axe E2E kapısı; UI kilidi AAA hedefi | `src/schemas/task.ts` `DIMENSION_KEYS[wcag]`; `deploy.yml` "E2E + axe"; `AGENTS.md:87` (kontrast ≥7:1, tap ≥44px) | P1 | Surface `a11y.wcag` varsayılanı `"2.2-AAA"` — tüketici yüzeyde geçilemez (C3) | Varsayılanı `"2.2-AA"` yap, AAA'yı yüzey-bazlı hedef bırak | Axe WCAG 2.2 AA taramasında kritik/serious ihlal = 0 |
| **AuthN / AuthZ / RBAC / ABAC / IAM** | Kimlik doğrulama + yetki modeli + endpoint koruması + audit | KISMI. RBAC/ReBAC/ABAC ArcheType sözleşmesinde **deklaratif alan** olarak var; ama ayrı AuthN/IAM standart sözleşmesi yok | `src/schemas/archetype.ts` `AccessPolicySchema` (`model: RBAC\|ReBAC\|ABAC\|hybrid`), `PermissionSchema`, ABAC attribute conditions; auth ayrıca `dimensions.security/owasp` + `enterprise-dod §2.2` | P1 | Ayrı mühendislik-standart sözleşmesi yok; endpoint-enforcement platform kodunda — doğrulanamadı | AuthZ standart sözleşmesi (opsiyonel) + platform denetimini ayrı görevle yap | RBAC matris (rol×işlem) unit testi + yetkisiz istek 403 (platform) |
| **SSO / MFA** | OIDC/SAML SSO, TOTP/WebAuthn MFA sözleşmesi | EKSİK. AuthN alt-uzmanlığı ayrı sözleşme değil | `src/data/standards/sso.json`/`mfa.json` → **not found**; `plan-02 §2` "SSO/MFA Eksik" | P1 | `sso.json` + `mfa.json` sözleşmeleri | `plan-02 PROMPT 8` ile SSO (OIDC/SAML) + MFA (TOTP/WebAuthn) sözleşmesi üret | Integration: SSO callback + MFA step-up karar-logu (platform) |
| **c13n (kanonikleştirme)** | Slug/URL/Unicode-NFC/e-posta(E.164)/SKU kanonikleştirme | EKSİK | `src/data/standards/c13n.json` → **not found**; `plan-02 §2` "c13n Eksik" | P1 | Kanonikleştirme sözleşmesi + `c13nRef` | `c13n.json` üret (NFC, E.164, slug/URL/SKU idempotent kanonik) | Unit: her normalize fonksiyonu idempotent; DB unique constraint yakalıyor |
| **n6n / d10n (normalizasyon/denormalizasyon)** | Veri normalizasyon disiplini + kontrollü denormalizasyon kuralı | EKSİK | `src/data/standards/n6n.json` → **not found**; `plan-02 §2` "n6n/d10n Eksik" | P2 | Normalizasyon standardı | `n6n.json` üret (denorm yalnız okuma-yoğun rapor; expand-contract migration) | Migration downgrade testi + duplicate-detection integration |
| **c12n (özelleştirme)** | Tenant tema token + layout + feature-flag + field-visibility | EKSİK. Tenant/feature-flag özelleştirme standardı yok | `src/data/standards/c12n.json` → **not found**; `plan-02 §2` "c12n Eksik" | P1 | Tenant-seviyesi özelleştirme sözleşmesi | `c12n.json` üret (Capability + Mode-Profile primitifini tüketir) | Feature-flag çözümü tenant sırası unit + saved-view kalıcılık |
| **p13n (kişiselleştirme)** | Kullanıcı-bazlı tercih + kayıtlı-görünüm + dashboard | EKSİK | `src/data/standards/p13n.json` → **not found**; `plan-02 §2` "p13n Eksik" | P2 | Kullanıcı-seviyesi kişiselleştirme sözleşmesi (c12n'den ayrı) | `p13n.json` üret; c12n=tenant, p13n=user ayrımı net | e2e: tema/görünüm kullanıcı bazında izole |
| **i14y / API / SDK / webhook** | OpenAPI-first, versiyonlama, imzalı+retry'li webhook, idempotency, cursor pagination, SDK-hazırlık | KISMI. API/GraphQL sözleşmesi var; ama i14y çatı (webhook/idempotency/SDK) ayrı standart değil | `src/data/standards/data-api-contract.json` (GraphQL+codegen+expand-contract); i14y çatı `i14y.json` → **not found** | P1 | Webhook imzalama, idempotency-key, SDK generation, rate-limit header sözleşmesi | `i14y.json` üret (OpenAPI-first, webhook retry, idempotency, GraphQL depth≤10) | Contract test (şema uyumu) + idempotency-key tekrar tek-etki integration |
| **o11y (observability)** | Structured JSON log, correlation/request/trace id, RED/USE metrik, SLO, dashboard, alert | VAR (güçlü). RED/USE + SLO + trace + correlation + dashboard sözleşmede | `src/data/standards/observability.json` (RED×4, USE×3, SLO×4, correlation×11, trace×10, dashboard×7); `standardRefs.observabilityRef` | P2 | Kapı `check-observability` ayrı yok; kanıt `evidence[]`'a bırakılmış | (Opsiyonel) log-format lint kapısı; şimdilik review+test yeterli | Log formatı + trace_id yayılımı unit (platform) |
| **E2E / E2EE** | E2E: uçtan-uca kullanıcı akışı testi. E2EE: uçtan-uca şifreleme | KISMI. E2E VAR (Playwright kapısı); E2EE (şifreleme) sözleşmede yok | E2E: `deploy.yml` "E2E + axe" + `dimensions.testing` + `enterprise-dod §2.11`. E2EE: **not found** | P2 | E2EE (mesaj/veri uçtan-uca şifreleme) sözleşmesi yok | E2EE gerekiyorsa ayrı güvenlik-standardı; aksi halde "kapsam-dışı" işaretle | E2E: Playwright happy+sad path yeşil; E2EE: platform — doğrulanamadı |
| **CI-CD / IaC** | Otomatik build/test/deploy, IaC, secret yönetimi, zero-downtime | KISMI. CI/CD VAR (deploy.yml pipeline + release-versioning); IaC ayrı standart değil | `.github/workflows/deploy.yml` (17 bloklayıcı kapı + build); `release-versioning.json` (blue-green×3, canary×3, feature-flag); IaC `iac.json` → **not found** | P1 | IaC standardı (Hetzner/Debian/Docker Compose), secret-management, env-validation | `iac.json` üret; secret düz-metin yasağı + gitleaks kapısı | gitleaks yeşil + env-validation testi + deploy dry-run |
| **WAF / DDoS / rate-limit** | Kenar güvenlik: WAF-ready log, DDoS mitigation, rate-limit header, CORS, security headers | EKSİK/KISMI. Kenar-güvenlik sözleşmesi yok | `src/data/standards/edge-security.json` → **not found**; `plan-02 §2` "CDN/DNS/WAF/DDoS Kısmi (D4)" | P1 | `edge-security.json` (WAF/DDoS/rate-limit/CORS/security-headers) | `plan-02 PROMPT 14` ile üret; rate-limit header + WAF-ready logging | rate-limit header testi + CORS policy testi (platform) |
| **İş-modeli-geçişi (Mode-Profile)** | B2B/B2C/C2C/B2G/M2M/S2S/D2D config-driven geçiş (if/else değil) | KISMI (doğru sınıflanmış). Standart-DEĞİL, capability olarak matriste; ama Mode-Profile **primitifi şemada yok** | `standards-applicability-matrix §2.1` (Mode-Profile primitifi listeli); `src/schemas/archetype.ts` içinde ModeProfile schema **not found** (C6) | P0 | Mode-Profile primitif şeması + versiyonlu business_model_config | ADR ile kilitle + şemaya al (`plan-01` D1); `plan-02 PROMPT 13` | Integration: mod geçişi capability setini değiştiriyor, canlı sipariş korunuyor |
| **Modüler app mimarisi** | 7-seviye WBS + bounded-context + engine↔UI ayrımı + app/module kapsam kilidi | VAR (güçlü). 7-seviye hiyerarşi + faz kapıları + AI yetki sınırı | `src/schemas/task.ts` `WBS_LEVELS` (app→atom), `WATERFALL_PHASES`, `AgentPolicySchema.forbiddenTargets=["app","module"]`; `architecture.json` | P2 | (Yapısal boşluk yok) — beş primitif eklenince tamamlanır | Primitifleri (Actor/Capability/PDP) ekleyerek domain-modelleme tamamla | check-standards-coverage yeşil + architecture conformance |

---

## 3. Critical Gaps (P0 / P1 / P2)

Aşağıdaki liste boşlukları öncelik sırasına dizer; her madde kanıt ve etkiyi taşır.

**P0 — sistemsiz/yanlış-üretim (önce bunlar):**
- **G-P0-1 — Beş iş-evreni primitifi kodda yok (C6).** Actor / Capability / PDP (Policy Decision Point) / Mode-Profile / Computation `src/schemas/archetype.ts` içinde first-class schema olarak **bulunamadı** (yalnız `AccessPolicySchema` deklaratif model taşıyor; `ModeProfile`/`Capability`/`PDP` schema yok). Portföyün yarısı (B2B↔C2C mod geçişi, lisans/yetenek, fiyat/BOM hesabı) bu primitifler olmadan modellenemez. Kaynak: `plan-00 §4 C6`, `standards-applicability-matrix §2.1` (primitifler "eklenecek" olarak listeli).
- **G-P0-2 — `AGENTS.md:82` bayat stack (Prisma) (C1).** Aşağıda §4'te ayrıntılı; ajan-yanlış-üretim riski nedeniyle P0.

**P1 — enterprise müşteride zorunlu:**
- **G-P1-1 — `check-i18n` kapısı yok.** `i18n-standards.json`'ın 7 kuralının 5'i `check-i18n` gate'ine atıf yapıyor; `engineering-standards-index.md:55` de bu kapıyı adlandırıyor; ama `tools/agents/check-i18n.mjs` **not found** ve `deploy.yml`'de koşmuyor. Sonuç: i18n standardı deklare edilmiş ama **CI-zorlaması yok** — drift ve eksik-anahtar sessizce geçer.
- **G-P1-2 — AuthN/IAM/SSO/MFA ayrı sözleşme değil.** RBAC/ABAC ArcheType alanı olarak var ama kimlik-doğrulama akışı (token rotasyonu, SSO, MFA) standart sözleşmesi yok; yalnız `enterprise-dod §2.2` DoD metninde. `sso.json`/`mfa.json` **not found**.
- **G-P1-3 — Kenar-güvenlik (WAF/DDoS/rate-limit) sözleşmesi yok.** `edge-security.json` **not found**; rate-limit/CORS/security-headers sözleşme düzeyinde tanımsız.
- **G-P1-4 — c12n / c13n / i14y / IaC standartları eksik.** Dört enterprise çatı standardı (özelleştirme, kanonikleştirme, API-interop, altyapı-kod) **not found**.
- **G-P1-5 — Surface a11y varsayılanı AAA (C3)** ve **Surface i18n alanı yok (C4).** Aşağıda §4.

**P2 — global ölçekte zorunlu:**
- **G-P2-1 — g11n / p13n / n6n-d10n standartları eksik** (`plan-02 §2` "Eksik").
- **G-P2-2 — E2EE (uçtan-uca şifreleme) sözleşmede yok**; gerekiyorsa ayrı güvenlik-standardı, gerekmiyorsa kapsam-dışı beyanı.
- **G-P2-3 — v12n (sanallaştırma/konteyner) ayrı standart değil** (deployment içinde kısmi).

**Kod-seviyesi (platform/kernel) boşlukları:** Bu denetimde **değerlendirilemedi** — `platform` monoreposu ve `atonota/kernel` reposu mount'lu değil. Auth endpoint enforcement, gerçek i18n runtime, webhook imzalama, rate-limit middleware gibi iddialar için ayrı bir denetim (platform repo erişimiyle) gereklidir.

---

## 4. Architecture Conflicts — plan-00 §4 (C1–C6) Doğrulaması

Aşağıdaki tablo `plan-00 §4`'teki altı çelişkinin her birini bu depodaki dosya kanıtıyla doğrular (veya durumunu günceller).

| # | Çelişki (plan-00 iddiası) | Denetim sonucu | Kanıt (dosya:satır / şema alanı) |
|---|---|---|---|
| **C1** | `AGENTS.md` "Backend kilidi: **Prisma + PostgreSQL**" diyor; karar SQLAlchemy 2.0 | **DOĞRULANDI (açık çelişki).** Satır aynen "Veri/form/durum ekosistemi: TanStack … Backend kilidi: **Prisma + PostgreSQL**." Oysa `enterprise-dod.md:5` ve `plan-02` ORTAK-GUARDRAIL "FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL; YASAK: Prisma" diyor. Prisma hem yasak listesinde hem "backend kilidi" olarak geçiyor — doğrudan öz-çelişki. | `AGENTS.md:82` (Prisma "backend kilidi"); çelişen: `AGENTS.md:81` (yasak paket listesi ürün-BE değil ama stack çelişkisi), `enterprise-dod.md:5`, `plan-02` guardrail `Prisma YASAK` |
| **C2** | Seed script'lerinde Prisma/PostgreSQL kalıntısı | **DOĞRULANAMADI (bu denetimde satır-doğrulaması yapılmadı).** `tools/agents/` altında 30+ `seed-*.mjs` var; plan-00 `seed-layer0.mjs:114,163` ve `seed-frontend.mjs:828,879`'u işaret ediyor. Dosyalar mevcut; içerik-satır taraması bu görevin kapsamı dışında bırakıldı (audit odağı şema/sözleşme). Ayrı görevle grep önerilir. | `tools/agents/seed-layer0.mjs`, `tools/agents/seed-frontend.mjs` (dosyalar VAR; satır-kanıtı bu raporda üretilmedi) |
| **C3** | Surface şeması `wcag` varsayılanı `"2.2-AAA"`; oysa AA zorunlu, AAA yüzey-bazlı | **DOĞRULANDI.** `SurfaceA11ySchema.wcag = z.string().default("2.2-AAA")`. CI axe kapısı (`deploy.yml` "E2E + axe") tüketici yüzeyde AAA'yı geçemez → sürekli kırmızı veya sahte-waiver riski. | `src/schemas/surface.ts:34` (`wcag: z.string().default("2.2-AAA")`) |
| **C4** | Surface şemasında **i18n alanı yok** | **DOĞRULANDI.** `SurfaceContractSchema` (satır 40–62) `elements/actions/filters/layout/responsive/a11y/permissions/techProfileRef` taşıyor ama `i18n`/`locales`/`defaultLocale`/`rtl`/`messagesRef` alanı **yok**. Global 16 ürün için yüzey i18n'i sözleşmede görünmez. | `src/schemas/surface.ts:40-62` (i18n alanı **not found**); çelişen: `i18n-standards.json` "her yüzey locale/RTL beyan etmeli" |
| **C5** | Ölçek primitifleri (outbox/idempotency/tenant-rate-limit) "opt-in bayrak"; bazıları zorunlu-invariant olmalı | **KISMEN DOĞRULANABİLİR (kaynak platform).** `plan-00` bunu `elestiri-02-kernel §3.3`'e dayandırıyor; ilgili kernel kodu bu depoda değil (mount'lu değil). `actionplan` tarafında outbox/idempotency zorunlu-invariant sözleşmesi (`scale-invariant.json` benzeri) **not found**. | `src/data/standards/` altında scale-invariant sözleşmesi **not found**; kernel kanıtı — platform mount'lu değil, doğrulanamadı |
| **C6** | Beş primitif sözleşmede taslak, kodda yok | **DOĞRULANDI.** `src/schemas/archetype.ts` içinde `grep` ile Actor/Capability/PolicyDecisionPoint/ModeProfile/Computation first-class schema **bulunamadı** (yalnız audit-log alanında "actor" string'i geçiyor). `AccessPolicySchema` yetki modelini deklare ediyor ama PDP karar-motoru primitifi yok. | `src/schemas/archetype.ts` (primitif schema **not found**); yalnız `archetype.ts:190` "actor" audit alanı |

Ek çelişki (denetimde saptanan, plan-00 listesinde olmayan):
- **C7 (yeni) — `check-i18n` ve `check-core-contract` hayalet kapı.** `i18n-standards.json` ve `engineering-standards-index.md:55` `check-i18n`'i, `plan-02 PROMPT 2` ise `check-core-contract`'ı adlandırıyor; ikisinin de `.mjs` implementasyonu `tools/agents/` altında **yok** ve `deploy.yml`'de koşmuyorlar. Sonuç: dokümantasyon var-olmayan kapıya atıf yapıyor (doküman-drift). Kanıt: `grep check-i18n tools/` → boş; `grep check-core-contract tools/` → boş.

Kritik not (plan-00 §4 ile uyumlu): C1 **insan tarafından** düzeltilmelidir — `AGENTS.md` kanonik dosyadır ve kendi Bölüm 7'sinde "AI canon dokümanları düzenleyemez, yalnız changeset önerir" der. Ajan yalnız tam diff önerir: satır 82 → "Backend: FastAPI + SQLAlchemy 2.0 / SQLModel + Alembic + PostgreSQL". C3/C4 şema+test değişikliği olduğundan ajan PR açabilir, insan merge eder.

---

## 5. Implementation Roadmap

Aşağıdaki yol haritası boşlukları katmana göre sıralar; her katman "önce sözleşme, sonra platform-kod" ilkesini izler (platform işi bu depoda yapılmaz, ayrı repo görevine devredilir).

**Katman 0 — Bayat/çelişki temizliği (Dalga 0, kod yok, önce bu):**
- C1: `AGENTS.md:82` Prisma → SQLAlchemy 2.0 (insan elle; ajan diff önerir).
- C3: `surface.ts:34` `wcag` default `"2.2-AA"` (ajan şema+test PR).
- C4: `SurfaceContractSchema`'ya `i18n{locales,defaultLocale,rtl,messagesRef}` ekle (ajan şema+test PR).
- C7: `check-i18n.mjs` + `check-core-contract.mjs` ya yaz ya doküman atıflarını düzelt.

**Katman Core (Domain primitifleri — P0):**
- Actor / Capability / PDP / Mode-Profile / Computation için ADR + `src/schemas/archetype.ts` (veya yeni `primitives.ts`) şeması. Kaynak: `plan-01` Dalga 1. Bu, matris §2.1'i koddan doğrular hâle getirir.

**Katman Enterprise (P1 sözleşmeler):**
- `c12n.json` (tenant özelleştirme), `c13n.json` (kanonikleştirme), `i14y.json` (API-interop/webhook/idempotency/SDK) sözleşmeleri; her biri `StandardRefsSchema`'ya opsiyonel ref anahtarı + `engineering-standards-index.md` kaydı ekler. Kaynak: `plan-02 PROMPT 3/9/11/12`.

**Katman Global (P2 sözleşmeler):**
- `g11n.json` (globalizasyon çatısı), `p13n.json` (kişiselleştirme), `n6n.json` (normalizasyon). i18n zaten güçlü; g11n onu çatı-beyanla tamamlar. Kaynak: `plan-02 PROMPT 6/9/12`.

**Katman Security (P1):**
- `sso.json` + `mfa.json` (AuthN alt-uzmanlıkları), `edge-security.json` (WAF/DDoS/rate-limit/CORS/headers). Bunlar `plan-01` D1 PDP primitifini tüketir. Kaynak: `plan-02 PROMPT 8/14`.

**Katman DevOps (P1):**
- `iac.json` (Hetzner/Debian/Docker Compose baz, secret-management), `check-i18n.mjs` dahil eksik CI kapılarının yazımı, `deploy.yml` genişletmesi. Kaynak: `plan-02 PROMPT 14`.

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
- **v12n (sanallaştırma) için ayrı standart — şimdilik.** deployment/IaC içinde kısmen karşılanır; `iac.json` yazıldıktan sonra tekrar değerlendir.
- **E2EE'yi varsayılan zorunlu yapma.** Portföyün çoğu için gereksiz; yalnız gerçekten uçtan-uca şifreleme gereken ürün (ör. mesajlaşma) için hedefli sözleşme; aksi halde "kapsam-dışı" beyanı yeterli.
- **platform kodu iddialarını bu depoda "kanıtlanmış" sayma.** `platform`/`kernel` mount'lu olmadan hiçbir runtime/endpoint iddiası doğrulanamaz; kod-seviyesi denetim ayrı görev + ayrı repo erişimi ister.

---

## Ek — Doğrulanan CI Kapıları (deploy.yml, bloklayıcı)

Şu 17+ adım `deploy.yml`'de bloklayıcı olarak koşuyor (kanıt olarak listelendi): `typecheck`, `lint (biome)`, `check-content`, `test:content (vitest)`, `check-ruleset`, `check-surface`, `check-tech-profile`, `check-standards-coverage`, `check-dimension-applicability`, `check-waivers`, `check-short-code`, `check-dependency-policy`, `check-ui-standards`, `quality-lint`, `check-data-quality`, `check-execution-readiness`, `check-ready-for-dev`, `E2E + axe (WCAG 2.2)`, `build`. **Koşmayan/olmayan:** `check-i18n`, `check-core-contract`, `check-observability` (doküman atıf yapsa da implementasyon **not found**).

*Bu dosya bir denetim raporudur; hiçbir kod veya veri dosyasına dokunulmamıştır. Şemadan/dosyadan okunan tüm alan adları ve satır numaraları gerçek içerikle doğrulanmıştır; doğrulanamayan (platform) katman açıkça "mount'lu değil — doğrulanamadı" olarak işaretlenmiştir.*
