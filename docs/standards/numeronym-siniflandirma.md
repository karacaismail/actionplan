# Numeronym & Kısaltma Sınıflandırması — Reponun 7-Aile Şemasına Eşleme

Sürüm: 1.0 — 2026-07-01
Durum: PROMPT 1 çıktısı (`plan-02` §4). Bağlam: `standard.ts` + `src/data/standards/*.json` + `engineering-standards-index.md`.
Amaç: i18n/a11y/o11y gibi numeronym'leri (sayı-kısaltma; ör. i18n = "i" + 18 harf + "n" = internationalization) reponun MEVCUT 15-standart sistemine sınıflandırmak — yeni taksonomi kurmadan.

---

## 1. Yöntem ve En Kritik Ayrım

Bu doküman yeni bir sınıf ağacı kurmaz; her kısaltmayı reponun mevcut şemasına eşler: `family` (`engineering | design | testing | devops | ai | data | governance`), `severity` (`must | should | may`) ve `priority` (P0 sistemsiz çalışmaz / P1 enterprise müşteride zorunlu / P2 global ölçekte zorunlu / P3 opsiyonel). Her kısaltma otomatik "feature" sayılmaz; üç ayrık niteliğe düşer.

Sınıflandırmadan önce üç niteliğin ne demek olduğunu tek cümlede veriyoruz.

| Nitelik | Anlamı | Örnek |
|---|---|---|
| Standart | Her ürünün uyması gereken sistem-kuralı; `src/data/standards/<id>.json` sözleşmesine bağlanır | i18n, a11y, o11y |
| Mode-Profile capability | Ürünün açıp kapatabildiği iş-modeli yeteneği; standart değildir, `plan-01` Mode-Profile primitifidir | B2B, B2C, M2M |
| Araç / domain (standart-DEĞİL) | Bir API-stili, protokol, araç ya da ürün-kavramı; kural değil *uygulama* seçimidir | CRUD, REST, CMS, ERP |

En kritik düzeltme (`plan-02` §1): iş modelleri (B2B/B2C/C2C/B2G/M2M/S2S/D2D) "mühendislik standardı" değildir. i18n bir sistem-standardıdır (her ürün ona uymalı); B2B bir *yetenektir* (ürün açıp kapatabilir). Aynı sınıfa konursa ajan hepsini "feature" sanıp `if b2b else` çorbası üretir. Repo bunu zaten doğru ayırmış: iş modelleri `standards-applicability-matrix`'te "Mode-Profile primitifi" olarak 15 standarttan ayrı listeli.

---

## 2. Ana Sınıflandırma Tablosu

Aşağıdaki tablo her kısaltmayı açılımı, ailesi, zorunluluğu, önceliği, repoda zaten karşılığı olup olmadığı ve üç stack karşılığıyla (FastAPI / React / DB) birlikte listeler. "Zaten var" sütunundaki referans mevcut bir standart veya boyuttur; "Test AC" (acceptance criteria) o kuralın yeşil sayılma koşuludur. `family` sütunundaki `capability` ve `tool/domain` değerleri standart-DEĞİL işaretidir (reponun 7 ailesinden biri değildir; bilinçli olarak dışarıda tutulur).

| Kısaltma | Açılım | family | severity | priority | Zaten var mı (ref) | FastAPI karşılığı | React karşılığı | DB karşılığı | Test AC |
|---|---|---|---|---|---|---|---|---|---|
| i18n | internationalization | engineering | must | P2 | VAR — `i18n-standards` | ICU MessageFormat + Accept-Language middleware | i18n hook + message catalog | i18n-text çevrilebilir kolon | Pseudo-locale render + fallback zinciri çalışır |
| l10n | localization | engineering | must | P2 | VAR — `i18n-standards` (kapsar) | CLDR number/date format | Intl API + locale switch | locale-aware sort/collation | tr/ar/de locale formatları doğru |
| g11n | globalization | governance | should | P2 | EKSİK | residency/jurisdiction config katmanı | — (çatı beyanı) | data-residency shard/region kolonu | locale≠currency≠tax≠residency ortogonal test |
| m17n | multilingualization | engineering | may | P3 | VAR — `i18n-standards` (alt-kavram) | çoklu-script encoding | font/script fallback | UTF-8/NFC kolon | çok-script metin bozulmadan tur atar |
| t9n | translation | engineering | should | P2 | VAR — `i18n-standards` (iş-akışı) | çeviri anahtarı export/import | eksik-anahtar uyarısı | translation table + status | eksik çeviri CI'da yakalanır |
| a11y | accessibility | design | must | P1 | VAR — `dimensions.wcag` + `ui-components` + `check-ui-standards` | — (API hata mesajı metni) | semantic HTML + ARIA + focus trap | — | axe-core WCAG 2.2 AA 0 ihlal |
| i14y | interoperability | data | should | P1 | EKSİK | OpenAPI-first + webhook (imzalı/retry) | typed SDK client | idempotency-key kolonu | idempotency tekrarı tek etki; webhook retry |
| c12n | customization | design | should | P1 | EKSİK | tenant customization config API | tema token + feature-flag render | tenant_settings + feature_flags tablo | flag çözümü tenant sonra user sırasıyla |
| c13n | canonicalization | data | must | P1 | EKSİK | normalize service (slug/URL/email) | input mask/normalize | unique/check constraint + NFC | her normalize fonksiyonu idempotent |
| o11y | observability | devops | must | P0 | VAR — `observability` | structured JSON log + trace_id | frontend error tracking | audit_events tablo | hata → doğru taxonomy + trace_id yayılır |
| v12n | virtualization | devops | should | P2 | EKSİK | Docker Compose baz imaj | — | — (container-ready) | container reproducible build |
| p13n | personalization | design | may | P2 | EKSİK | per-user preference API | saved views + dashboard | user_preferences tablo | görünüm değişimi kullanıcı bazında izole |
| n6n | normalization | data | must | P1 | EKSİK | E.164 phone / SKU normalize | form validation (zod) | 3NF şema + unique constraint | duplicate DB constraint yakalanır |
| d10n | denormalization | data | may | P3 | EKSİK | read-model projeksiyon | — | okuma-yoğun rapor tablo | denormalize kaynak tetikleyiciyle senkron |
| AuthN | authentication | engineering | must | P0 | VAR — `enterprise-dod` + `dimensions.security` | OAuth2/OIDC dependency | login/session akışı | sessions + credential tablo | geçersiz kimlikte 401 |
| AuthZ | authorization | engineering | must | P0 | VAR — `dimensions.security` + PDP primitifi | @RequirePermission dependency | permission-aware render | permission tablo | yetkisiz kullanıcı 403 alır |
| RBAC | role-based access control | engineering | must | P0 | VAR — `enterprise-dod` (dimension) | role→permission resolver | rol-bazlı UI | roles/role_permissions tablo | rol çözümü doğru permission seti verir |
| ABAC | attribute-based access control | engineering | should | P1 | VAR — `dimensions.security` (dimension) | policy attribute evaluator (PDP) | attribute-koşullu render | policy attributes tablo | attribute değişimi kararı değiştirir |
| IAM | identity & access management | engineering | must | P0 | VAR — WBS 13.5 `s-iam` | kimlik+yetki servis sınırı | auth context provider | identity/tenant/role tablo | tenant izolasyonu bypass edilemez |
| SSO | single sign-on | engineering | should | P1 | EKSİK | OIDC/SAML IdP entegrasyonu | redirect + callback akışı | idp_config tablo | IdP login → yerel session |
| MFA | multi-factor authentication | engineering | should | P1 | EKSİK | TOTP/WebAuthn doğrulayıcı | MFA challenge UI | mfa_factors tablo | 2. faktör olmadan giriş reddedilir |
| JWT | JSON Web Token | engineering | should | P1 | VAR — `dimensions.security` (AuthN altında) | token encode/verify (RS256) | token storage (httpOnly) | — (stateless) | süresi geçmiş/imzasız token reddedilir |
| OAuth | open authorization | engineering | should | P1 | VAR — AuthN altında | authorization code flow | OAuth redirect | oauth_clients tablo | code→token değişimi doğrulanır |
| OIDC | OpenID Connect | engineering | should | P1 | EKSİK (SSO altında) | OIDC discovery + id_token | OIDC client | oidc_sessions tablo | id_token claim doğrulaması |
| E2E | end-to-end (test) | testing | must | P1 | VAR — `testing-strategy` + `quality-gates` | — | Playwright e2e senaryo | seed/fixture veri | kritik akış e2e yeşil |
| E2EE | end-to-end encryption | engineering | may | P2 | EKSİK | envelope encryption servis | client-side crypto | encrypted blob kolon | plaintext DB'de asla yok |
| B2B | business-to-business | capability | — | P1 | Mode-Profile — STANDART DEĞİL | business_model_config | mode-aware checkout | tenant account_type | mod geçişi capability seti değiştirir |
| B2C | business-to-consumer | capability | — | P1 | Mode-Profile — STANDART DEĞİL | business_model_config | consumer checkout | account_type=consumer | B2C→B2B rollback canlı veri korur |
| C2C | consumer-to-consumer | capability | — | P2 | Mode-Profile — STANDART DEĞİL | marketplace config | peer-listing UI | listing/escrow tablo | peer işlem akışı config ile açılır |
| B2G | business-to-government | capability | — | P2 | Mode-Profile — STANDART DEĞİL | tender/RFQ config | RFQ akışı | tender tablo | ihale akışı config ile açılır |
| M2M | machine-to-machine | capability | — | P2 | Mode-Profile — STANDART DEĞİL | service credential + scope | — | api_clients tablo | M2M token insan-akışından izole |
| S2S | server-to-server | capability | — | P2 | Mode-Profile — STANDART DEĞİL | mTLS/service token | — | service_registry | S2S çağrı yetkisi doğrulanır |
| D2D | device-to-device | capability | — | P3 | Mode-Profile — STANDART DEĞİL | device pairing config | — | device tablo | eşleşme akışı config ile açılır |
| CRUD | create-read-update-delete | tool/domain | — | — | STANDART DEĞİL (araç/pattern) | router CRUD imzası | TanStack Query mutation | tablo satır işlemi | (kural değil — `data-api-contract` kapsar) |
| REST | representational state transfer | tool/domain | — | — | STANDART DEĞİL (API-stili) | APIRouter REST endpoint | fetch/axios | — | (stil — `data-api-contract` + `i14y` kapsar) |
| GraphQL | graph query language | data | must | P1 | VAR — `data-api-contract` | Strawberry schema + resolver | TanStack Query + codegen | resolver→ORM | şema-codegen uyumu; depth ≤10 |
| RPC | remote procedure call | tool/domain | — | — | STANDART DEĞİL (araç/stil) | RPC-tarzı endpoint | typed client çağrı | — | (stil — `i14y` kapsar) |
| gRPC | gRPC remote procedure call | tool/domain | — | — | STANDART DEĞİL (araç) | grpc servicer (gerekirse) | — | — | (araç — `i14y` kapsar) |
| JWT | (bkz. yukarı) | — | — | — | (tekrar — AuthN altında) | — | — | — | — |
| OAuth | (bkz. yukarı) | — | — | — | (tekrar — AuthN altında) | — | — | — | — |
| RBAC | (bkz. yukarı) | — | — | — | (tekrar — AuthZ altında) | — | — | — | — |
| ABAC | (bkz. yukarı) | — | — | — | (tekrar — AuthZ altında) | — | — | — | — |
| SDK | software development kit | tool/domain | — | — | STANDART DEĞİL (araç, `i14y` üretir) | OpenAPI→client codegen | typed SDK paketi | — | (araç — `i14y` "SDK-hazırlık" kuralı) |
| API | application programming interface | data | must | P0 | VAR — `data-api-contract` | OpenAPI-first router | typed client | — | şema kontrat testi yeşil |
| CLI | command-line interface | tool/domain | — | — | STANDART DEĞİL (araç/yüzey) | Typer/Click komut | — | — | (araç — yüzey seçimi) |
| GUI | graphical user interface | design | must | P1 | VAR — `ui-components` + `ux-interaction` | — | Radix + tasarım tokenları | — | UI standart kapısı yeşil |
| TUI | text user interface | tool/domain | — | — | STANDART DEĞİL (araç/yüzey) | — | — | — | (araç — yüzey seçimi) |
| CI/CD | continuous integration/delivery | devops | must | P0 | VAR — `quality-gates` + `release-versioning` | pytest + coverage kapısı | vitest + build kapısı | migration dry-run | tüm bloklayıcı kapı yeşil, merge açılır |
| IaC | infrastructure as code | devops | should | P1 | EKSİK | Docker Compose + env-validation | — | — | infra reproducible; secret düz-metin yok |
| CDN | content delivery network | devops | should | P2 | KISMİ — `plan-01` D4 kenar | cache-control header | static asset build | — | statik asset cache header doğru |
| DNS | domain name system | devops | may | P3 | KISMİ — `plan-01` D4 | — | — | — | (altyapı — edge katmanı) |
| WAF | web application firewall | devops | should | P1 | KISMİ — `plan-01` D4 | WAF-ready request logging | — | — | kötü-niyetli istek loglanır |
| DDoS | distributed denial of service | devops | should | P1 | KISMİ — `plan-01` D4 | rate-limit + throttle | — | — | rate-limit header + 429 döner |
| ORM | object-relational mapping | data | must | P1 | VAR — `data-api-contract` (SQLAlchemy) | SQLAlchemy 2.0 model | — | model↔tablo eşleme | N+1 yok; migration expand-contract |
| CMS | content management system | tool/domain | — | — | STANDART DEĞİL (domain/ürün) | içerik modülü | içerik editörü | content tablo | (domain — *uygulama*, kural değil) |
| CRM | customer relationship management | tool/domain | — | — | STANDART DEĞİL (domain/ürün) | CRM modülü | — | contact/deal tablo | (domain — *uygulama*) |
| ERP | enterprise resource planning | tool/domain | — | — | STANDART DEĞİL (domain/ürün) | ERP modülü | — | ledger/inventory tablo | (domain — *uygulama*) |
| ETL | extract-transform-load | tool/domain | — | — | STANDART DEĞİL (domain/pipeline) | batch pipeline job | — | staging tablo | (domain — *uygulama*) |
| ELT | extract-load-transform | tool/domain | — | — | STANDART DEĞİL (domain/pipeline) | warehouse transform | — | raw+transform tablo | (domain — *uygulama*) |
| BI | business intelligence | tool/domain | — | — | STANDART DEĞİL (domain/ürün) | rapor API | dashboard grafik | OLAP view | (domain — *uygulama*) |
| OLAP | online analytical processing | tool/domain | — | — | STANDART DEĞİL (domain/DB-modu) | analitik sorgu | — | kolon-tabanlı/aggregate | (domain — DB kullanım deseni) |
| OLTP | online transaction processing | tool/domain | — | — | STANDART DEĞİL (domain/DB-modu) | transactional endpoint | — | satır-tabanlı OLTP şema | (domain — DB kullanım deseni) |

---

## 3. WBS Eşlemesi — Zaten Ağaçta Olanlar

Aşağıdaki kısaltmaların bir kısmı yalnız standart değil, WBS ağacında da (`src/data/generated/navigation.json`, `wbsCode` 13.x) mevcut düğümlerdir. Bu düğümlere yeni bir paralel standart kurmak yerine mevcut düğüm genişletilir. İşaretli olanlar WBS'te zaten vardır.

| Kısaltma | WBS kodu | WBS düğüm id | WBS başlık | Durum |
|---|---|---|---|---|
| IAM | 13.5 | `s-iam` | Identity & Access (IAM) | WBS'te VAR — genişlet, kurma |
| i18n / l10n / t9n | 13.7 | `s-i18n` | i18n / Localization | WBS'te VAR + `i18n-standards` sözleşmesi var |
| AI-Governance | 13.1 | `s-ai-governance` | AI Governance / Model Risk | WBS'te VAR + `ai-governance` sözleşmesi var |
| Audit (AuthZ/RBAC kanıt izi) | 13.2 | `s-audit` | Audit / Compliance | WBS'te VAR — o11y audit_events buraya bağlanır |
| Workflow / BPM (Mode-Profile, approval) | 13.10 | `s-bpm` | Workflow / BPM Engine | WBS'te VAR — Mode-Profile approval akışı buraya bağlanır |

Not: `g11n`, `c12n`, `c13n`, `i14y`, `p13n`, `n6n/d10n`, `v12n`, `SSO`, `MFA`, `E2EE`, `IaC` için WBS'te ayrı düğüm yoktur; bunlar çapraz-kesen standart olarak `src/data/standards/*.json`'a eklenir ve düğümler `standardRefs` ile bağlanır (drift üretmemek için — bkz. `plan-02` PROMPT 3).

---

## 4. Önceliklendirilmiş MUST / SHOULD / COULD / NOT-FEATURE Listesi

Aşağıdaki liste yukarıdaki tabloyu eyleme çevirir: hangi kısaltma zorunlu standarttır, hangisi olması-iyi, hangisi opsiyonel ve hangisi bilinçli olarak standart-DIŞIdır. NOT-FEATURE bölümü en kritik guardrail'dir — bu maddeler için asla yeni standart JSON'u üretilmez.

### MUST (P0-P1 — enterprise için zorunlu)

- o11y (P0) — `observability` var, çalışan altyapı kurulmalı.
- AuthN / AuthZ / RBAC / IAM (P0) — dimension + WBS 13.5 var, PDP tüketilmeli.
- API / GraphQL / ORM (P0-P1) — `data-api-contract` var.
- CI/CD (P0) — `quality-gates` + `release-versioning` var.
- i18n / l10n (P2 ama enterprise-taban) — `i18n-standards` var.
- a11y (P1) — WCAG 2.2 AA taban, `check-ui-standards`.
- c13n / n6n (P1) — YENİ standart: kanonikleştirme + normalizasyon.
- i14y (P1) — YENİ standart: webhook/idempotency/SDK-hazırlık.
- E2E (P1) — `testing-strategy` var.

### SHOULD (P1-P2 — enterprise/global müşteride beklenir)

- SSO / MFA / OIDC (P1) — YENİ standart: AuthN alt-uzmanlıkları.
- c12n (P1) — YENİ standart: tenant özelleştirme.
- ABAC / JWT / OAuth (P1) — dimension var, sözleşmeleştirilebilir.
- g11n (P2) — YENİ standart: globalizasyon çatısı.
- IaC / WAF / DDoS / CDN (P1-P2) — YENİ standart(lar): kenar-güvenlik, `plan-01` D4.
- v12n (P2) — YENİ standart: sanallaştırma/konteyner.

### COULD (P2-P3 — opsiyonel/ölçek-bağlı)

- p13n (P2) — kullanıcı-bazlı kişiselleştirme.
- d10n (P3) — kontrollü denormalizasyon kuralı.
- E2EE (P2) — uçtan-uca şifreleme (hassas veri gerektiğinde).
- m17n (P3) — çoklu-script (i18n kapsar).
- DNS (P3) — altyapı edge.

### NOT-FEATURE (standart-DEĞİL — asla yeni standart JSON'u üretme)

- İş modelleri → Mode-Profile capability: B2B, B2C, C2C, B2G, M2M, S2S, D2D. Bunlar `business_model_config` ile açılıp kapanır (kod `if/else` DEĞİL); bkz. `plan-02` PROMPT 13.
- API-stili / araç → standart değil: CRUD, REST, RPC, gRPC, SDK, CLI, TUI. Bunlar `data-api-contract` / `i14y` kapsamındaki *seçimlerdir*, ayrı kural değildir.
- Domain / ürün kavramı → standart değil, *uygulama*: CMS, CRM, ERP, ETL, ELT, BI, OLAP, OLTP. Bunlar ürünün ne yaptığıdır; nasıl üretildiğinin kuralı değildir.

Sonuç: prompt zinciri (bkz. `plan-02` §5) yalnız MUST/SHOULD/COULD listesindeki "EKSİK" satırlarına yeni standart üretir; "VAR" olanları genişletir; NOT-FEATURE olanları açıkça standart-DIŞI bırakır.
