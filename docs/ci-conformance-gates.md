# CI Conformance Kapıları — Kapı Kataloğu

Sürüm: 1.0 — 2026-06-29
Durum: Kanonik. `.github/workflows/deploy.yml` içindeki bloklayıcı kapıların referans kataloğu.

---

## Önsöz

Mühendislik standardı yazılı ama uygulanmıyorsa "ölü metin"dir; sahte güven üretir. ADR-0027 bu nedenle her standardı bir CI kapısına bağlar: standart yalnızca makine-okunur sözleşme olduğu için kapı onu denetleyebilir. Bu doküman, `.github/workflows/deploy.yml` içinde tanımlı bloklayıcı kapıların tam kataloğudur.

Tüm kapılar `deploy` iş akışının `build` job'ında, `node tools/agents/<kapı>.mjs` olarak çalışır. Herhangi biri sıfırdan farklı çıkış kodu döndürürse build durur ve GitHub Pages dağıtımı yapılmaz. Bu nedenle her kapı **bloklayıcı**dır.

Bu katalog iki gruba ayrılır: ADR-0026/0027 ile gelen yeni standart/yönetişim kapıları ve daha önce var olan içerik/veri/yürütme kapıları. evidence ve Definition of Ready (DoR) için **ayrı yeni kapı yoktur**; bunlar mevcut kapılarca kapsanır (bkz. Bölüm 3).

---

## 1. Standart ve Yönetişim Kapıları (ADR-0026 / ADR-0027)

Bu yedi kapı, standardRefs / applicability / waivers / kısa-kod / bağımlılık / UI standartları / tech-profile katmanını zorlar. Her kapı `.github/workflows/deploy.yml` içinde ayrı bir adım olarak tanımlıdır.

### check-tech-profile

- Ne zorlar: Frontend stack manifesti (ADR-0026). Headless kilidi (stillenmiş bileşen kiti yasak), global yasak-lib listesi (next, redux, flowbite, antd, MUI, Chakra, Mantine ...) ve her yüzeyin geçerli bir `techProfileRef` taşıması. Yasak-lib üç repoda taranır.
- Dosya yolu: `tools/agents/check-tech-profile.mjs`
- Yeşil koşul: Hiçbir yasak-lib bağımlılığı yok; hiçbir headless ihlali yok; her `techProfileRef` değeri `src/data/tech-profiles.json` içinde çözülüyor.
- Veri doldukça nasıl dişlenir: Yasak-lib listesi genişledikçe (ör. yeni stillenmiş kit) tarama sertleşir; yeni yüzeyler eklendikçe her biri zorunlu `techProfileRef` taşır.

### check-standards-coverage

- Ne zorlar: `standardRefs` referans bütünlüğü. Boş olmayan her `<...>Ref` değerinin gerçek bir hedefe çözüldüğünü doğrular (standart anahtarları → `src/data/standards/<id>.json`, `techProfileRef` → tech-profiles).
- Dosya yolu: `tools/agents/check-standards-coverage.mjs`
- Yeşil koşul: Hiçbir düğümde çözülemeyen (dangling) standart referansı yok.
- Veri doldukça nasıl dişlenir: Başlangıçta yalnız boş olmayan referanslar denetlenir (default `""` muaf). Düğümler standart referanslarını doldurdukça kapsam genişler; ileride seviye/yüzey başına zorunlu referans kümesi tanımlanarak "eksik referans" da bloklayıcı yapılabilir.

### check-dimension-applicability

- Ne zorlar: Boyut uygulanabilirliği. Bir boyut bir düğüme uygulanmıyorsa (`applicability[dimKey].applies = false`) gerekçe (`reason`) zorunludur. Gerekçesiz `applies=false` jenerik dolguyu/sessiz atlamayı engeller.
- Dosya yolu: `tools/agents/check-dimension-applicability.mjs`
- Yeşil koşul: `applies=false` olan her boyut girişinde boş olmayan bir `reason` var.
- Veri doldukça nasıl dişlenir: `applicability` haritası genişledikçe daha çok boyut "N/A + gerekçe" olarak işaretlenir; jenerik çöp içerik yerine açık "uygulanmıyor, çünkü..." kaydı çoğalır.

### check-waivers

- Ne zorlar: Waiver yaşam döngüsü. `waivers[]` içindeki her kayıt gerekçeli (`reason`), onaylı (`approvedBy`) ve süreli (`expires`) olmalıdır. Gerekçesiz / süresiz / süresi dolmuş waiver geçersizdir.
- Dosya yolu: `tools/agents/check-waivers.mjs`
- Yeşil koşul: Her waiver kaydında `reason`, `approvedBy` ve gelecek tarihli `expires` dolu; süresi geçmiş hiçbir waiver aktif değil.
- Veri doldukça nasıl dişlenir: Süre alanı sayesinde waiver'lar zamanla otomatik geçersizleşir; kalıcı bypass oluşamaz. Standartlardan sapma kayıt altına alındıkça bu kapı sürekli temizlik baskısı uygular. Ayrıntı: `docs/waiver-policy.md`.

### check-short-code

- Ne zorlar: Kısa-kod / kapsam frenleri. Dosya satır tavanı, fonksiyon boyutu, döngüsel ve bilişsel karmaşıklık eşikleri, gereksiz büyümeye karşı bütçe (`short-code` standardı).
- Dosya yolu: `tools/agents/check-short-code.mjs`
- Yeşil koşul: Hiçbir dosya/fonksiyon tanımlı tavanı aşmıyor; karmaşıklık eşikleri aşılmıyor.
- Veri doldukça nasıl dişlenir: Tavanlar `short-code.json` sözleşmesinde tek yerden ayarlanır; kod tabanı olgunlaştıkça eşikler düşürülerek kapı sıkılaştırılabilir.

### check-dependency-policy

- Ne zorlar: Bağımlılık politikası. Paket allowlist, yasak paketler, güvensiz/yasaklı sürümler, lisans politikası, lockfile commit zorunluluğu (`dependency-policy` standardı).
- Dosya yolu: `tools/agents/check-dependency-policy.mjs`
- Yeşil koşul: Yasak paket yok; güvensiz sürüm yok; lisans politikasına aykırı bağımlılık yok; lockfile tutarlı.
- Veri doldukça nasıl dişlenir: Allowlist/lisans kuralları `dependency-policy.json` içinde genişledikçe denetim kapsamı büyür; SBOM ve lisans-katman federasyonu olgunlaştıkça kapı daha çok sapmayı yakalar.

### check-ui-standards

- Ne zorlar: UI standartları. Tasarım sistemi, UI bileşen sözleşmesi ve UX etkileşim kurallarının ihlal edilmemesi; ör. emoji kullanımı ve stillenmiş kit (styled-kit) izleri yok.
- Dosya yolu: `tools/agents/check-ui-standards.mjs`
- Yeşil koşul: Emoji yok; yasaklı styled-kit deseni yok; tasarım/bileşen sözleşmesine aykırı işaret yok.
- Veri doldukça nasıl dişlenir: `design-system.json`, `ui-components.json` ve `ux-interaction.json` sözleşmelerine yeni ölçülebilir kural (token zorunluluğu, a11y bayrağı) eklendikçe kapı dişlenir.

### check-ui-delivery

- Ne zorlar: Makine-okunur UI teslimat sözleşmesi (`uiDelivery` — `src/schemas/ui-delivery.ts`; `docs/storybook-master-component-integration-directive.md` §2/§3). UI etkisi içerik sinyallerinden makinece sınıflandırılır (`tools/lib/ui-impact.mjs`); UI-impact adayı düğüm sözleşme taşımadan geçemez; backend-only düğüm somut gerekçeyle N/A kalır ve zorlanmaz.
- Dosya yolu: `tools/agents/check-ui-delivery.mjs` (+ ratchet baseline: `tools/agents/ui-delivery-baseline.json`)
- Sonuç sınıfları: **PASS** · **FAIL** (aday sözleşmesiz veya sözleşme kural ihlali) · **NO_CANDIDATES** (UI-impact adayı yok — backend PR'ı başarısız olmaz) · **REVIEW_REQUIRED** (`reviewStatus=in-review`; insan kabulü bekler, bloklar) · **MIGRATION_INCOMPLETE** (ihlal yok ama corpus'ta açık-kararsız düğüm veya legacy warning var — dürüst ara durum, exit 0, asla 'PASS' yazmaz; PASS yalnız tüm düğümler açık kararlı + 0 warning).
- Ek sinyaller (v2 — docs/storybook-governance-pack.md §13): içerik tarafında üretilen BUDGET_EXCEEDED (coverage bütçe aşımı), SECURITY_REVIEW_REQUIRED (permission story'li critical/high düğümde backend authz test ref'i yok), MANUAL_A11Y_REQUIRED (critical/high'ta manuel a11y review kaydı yok), OWNER_MISSING (approved baseline'da owner yok) ihlal/uyarı olarak raporlanır; BASELINE_STALE, FIXTURE_DRIFT (çalışma-zamanı), VERSION_MISMATCH, FLAKY_QUARANTINED sinyalleri implementation reposunun storybook-ci kapısında üretilir.
- Yeşil koşul: PASS veya NO_CANDIDATES; baseline'daki legacy ihlaller warning kalır, baseline DIŞI her ihlal kırar. Baseline'a yeni id eklemek yasaktır (yalnız çıkarılır); liste boşalınca ratchet hard-fail olur (R4).
- Tamper-guard: baseline dosyası originChecksum + originAllowedWarnings taşır; allowedWarnings yalnız origin'in alt kümesi olabilir (monotonic azalma), ihlalde RATCHET_TAMPERED ile kapı kırılır; adaylık uiArtifactRole modeline bağlıdır (yalnız produces-ui/changes-ui-contract).
- Veri doldukça nasıl dişlenir: Ratchet dalgaları (R1 yeni/değişen → R2 Master Component kritik yolu → R3 Surface zinciri → R4 legacy kapanış) ilerledikçe baseline küçülür ve kapı sertleşir; classifier sinyal listesi genişledikçe aday yakalama hassasiyeti artar.

### check-url-policy

- Ne zorlar: Kanonik URL sözleşmesi koruması dört katmanlıdır: (1) scope'lu yasak-desen/mutation taraması, (2) zorunlu doküman karar probe'ları, (3) `src/data/url-policy/registry.json` için Zod + duplicate/FK/parity testleri, (4) `src/data/standards/url-policy.json` ve bütün WBS/content düğümlerindeki merkezi `urlPolicyRef` mirası. `url-policy.md` ve `node.md` DAHİL bütün docs taranır; bütün-dosya muafiyeti yoktur.
- Dosya yolu: `tools/agents/check-url-policy.mjs`
- Yeşil koşul: Doküman taraması temiz; registry şemaya uyuyor; route/projection/host/slug referansları çözülüyor; 11 prefix ve yedi doğa seviyesi tam; private/public/GraphQL gramerleri doküman-registry paritesinde; URL standardı çözülüyor; generated corpus'un tamamı `urlPolicyRef=url-policy` miras alıyor.
- Veri doldukça nasıl dişlenir: Yeni tarihsel karar reddedildikçe yasak desen listesi genişler; prefix ailesine üye eklendikçe probe listesi üye-bazlı büyür; url-policy implementation fazları ilerledikçe zorunlu karar listesi genişler ve kapı sözleşme driftini daha erken yakalar.
- URLP-M1 — **TAMAMLANDI:** RouteDefinition, HostBindingProfile, RouteProjection, SlugProfile, resource-kind/prefix ailesi ve Ada→Atom yükümlülükleri `src/data/url-policy/registry.json` içinde; Zod şeması `src/schemas/url-policy-registry.ts`; standardı `src/data/standards/url-policy.json`; parity/content yayılım testi `tests/urlPolicyRegistry.test.ts`.

### check-url-policy-implementation

- Ne zorlar: `URLP-00`–`URLP-16` için tam/sıralı program, yalnız doğrudan predecessor bağı, exact platform branch ve allowed-files/non-goals, test-first redTests, acceptance/evidence/rollback/security/stopConditions alanları, execution directive parity'si ve 17 ayrı WBS atomu.
- Dosya yolu: `tools/agents/check-url-policy-implementation.mjs`; Zod şeması `src/schemas/url-policy-implementation-program.ts`; veri `src/data/url-policy/implementation-program.json`; test `tests/urlPolicyImplementationProgram.test.ts`.
- Yeşil koşul: 17/17 faz ve WBS atomu bulunur; WBS bağımlılıkları programla aynıdır; directive bütün faz/alanları kapsar; node'lar `urlPolicyRef=url-policy`, boş evidence ve `status!=done` taşır; hiçbir faz geniş `**` wildcard veya uydurma evidence ile gevşetilmez.
- Sonuç semantiği: Bu kapının yeşili **execution-ready actionplan handoff** demektir; platform runtime implemented/verified/done demek değildir. Runtime statüsü yalnız gerçek PR/CI/test/staging/drill evidence writeback ile ilerler.

### check-platform-write-boundary

- Ne zorlar: Codex, Claude, Cursor, Aider ve Windsurf için platform erişimi `read-only-audit`; ürün kodu yazarı `human-developer-only`; AI çıktısı yalnız actionplan içinde `DIRECTIVE-ONLY` handoff'tur.
- Dosya yolu: `tools/agents/check-platform-write-boundary.mjs`; makine policy `src/data/platform-product-code-write-policy.json`; Zod şeması `src/schemas/platform-write-boundary.ts`; test `tests/platformProductCodeWriteProhibition.test.ts`.
- Yeşil koşul: `AGENTS.md`, `CLAUDE.md`, `CURSOR-RULES.md`, developer/export/workspace belgeleri kanonik directive'e bağlıdır; export motoru coding-agent, platform patch, branch/commit/PR veya minimum-code uygulama komutu üretmez.
- Yasak: AI platform ürün kodu, test, migration, Storybook/config veya generated output yazamaz; platform branch, commit, push, PR veya runtime evidence üretemez.
- Kanonik directive: `docs/platform-product-code-write-prohibition-directive.md`.

### check-market-readiness

- Ne zorlar: `global-market-readiness` makine sözleşmesinin bütünlüğü (J2 — `docs/json-standards-integration-gap-report-2026-07-13.md`): sözleşme dosyası geçerli JSON + doğru id/family; altı zorunlu kural id'si (`gmr-launch-gate-14`, `gmr-ip-geolocation-not-identity`, `gmr-market-kill-switch`, `gmr-payment-market-matrix`, `gmr-support-language-commitment`, `gmr-moderation-per-locale`) mevcut ve rule/rationale dolu; iki indeks kaydı + applicability matris ref anahtarı + anlatı çapası (`docs/global-market-readiness-directive.md`) yerinde.
- Dosya yolu: `tools/agents/check-market-readiness.mjs`; sözleşme `src/data/standards/global-market-readiness.json`; test `tests/jsonStandardsIntegration.test.ts`.
- Yeşil koşul: Sözleşme + 4 indeks/çapa probe'u tam; hiçbir zorunlu kural eksik değil.
- Veri doldukça nasıl dişlenir: `marketReadinessRef` J4'te `StandardRefsSchema`'ya eklenince (KARAR BEKLİYOR — CPO) app düğümlerinde ref zorunluluğu ve pazar-başına evidence denetimi bu kapıya bağlanır; launch-gate 14 sorusunun evidence writeback'i release akışına bağlandıkça kapı pazar/dil başına graduation'ı bloklar.

### check-finance-model

- Ne zorlar: `finance-money-model` makine sözleşmesinin bütünlüğü (J2): geçerli JSON + doğru id/family; altı zorunlu kural id'si (`fin-money-decimal-iso4217`, `fin-no-two-decimal-assumption`, `fin-three-currency-separation`, `fin-fx-date-declaration`, `fin-rounding-policy`, `fin-financial-state-six`) mevcut ve dolu; indeks/matris/çapa (`docs/financial-state-model-contract.md`) kayıtları yerinde.
- Dosya yolu: `tools/agents/check-finance-model.mjs`; sözleşme `src/data/standards/finance-money-model.json`; test `tests/jsonStandardsIntegration.test.ts`.
- Yeşil koşul: Sözleşme + 4 indeks/çapa probe'u tam.
- Veri doldukça nasıl dişlenir: `financeModelRef` J4'te şemaya eklenince para dokunan archetype/feature düğümlerinde Z uygulanabilirliği denetlenir; para taşıyan alan beyanları (ölçek/yuvarlama politikası) generated corpus'a girdikçe kapı alan-bazlı doğrulamaya terfi eder.

### check-storybook-registry

- Ne zorlar: `src/data/storybook/` altındaki registry ailelerinin şema geçerliliği (`src/schemas/storybook-registry.ts`) ve referans bütünlüğü: `story-catalog` içindeki `componentRef` → `master-components`, `deprecation-migrations` eski/yeni component referansları, `component-consumers` referansları; duplicate id reddi ve orphan tespiti.
- Dosya yolu: `tools/agents/check-storybook-registry.mjs`
- Yeşil koşul: Tüm registry dosyaları şemaya uyar; kırık referans ve duplicate id yok; boş registry geçerlidir (iskelet dönemi).
- Veri doldukça nasıl dişlenir: Kayıt sayısı arttıkça foreign-key denetimi genişler; `master-components` dolmaya başlayınca `uiDelivery.masterComponentRefs` FK'sı da bu registry'ye bağlanır.

### storybook-ci (implementation-repo kapısı — sözleşmesi burada, koşusu `platform/` reposunda)

- Ne zorlar: Storybook'un zorunlu Master Component sözleşme/evidence yüzeyi olması (`ui-components.json` v1.1, `design-system.json` v1.1, `docs/storybook-implementation.md`). UI/Master Component kapsamına giren her PR için bloklayıcı sıra: `typecheck → lint → component unit tests → Storybook static build → story interaction tests → story a11y tests → visual regression diff → product E2E + axe → publish preview`.
- Dosya yolu: implementation reposunda `.github/workflows/storybook-ci.*` (bu repo yalnız sözleşmeyi tanımlar; kurulum Wave SB-1/SB-2 teslimatıdır).
- Sonuç sınıfları: **PASS** (kapsamda story var, tüm bloklayıcı testler geçti) · **FAIL** (story/build/test/diff ihlali) · **NO_CANDIDATES** (PR UI/Master Component kapsamına girmiyor) · **REVIEW_REQUIRED** (kasıtlı visual diff insan kabulü bekliyor).
- v2 sinyal taksonomisi: PASS/FAIL/NO_CANDIDATES/REVIEW_REQUIRED çekirdek sonuçlarına ek olarak BASELINE_STALE, FIXTURE_DRIFT, VERSION_MISMATCH, OWNER_MISSING, SECURITY_REVIEW_REQUIRED, BUDGET_EXCEEDED, FLAKY_QUARANTINED, MANUAL_A11Y_REQUIRED rapor sinyalleri üretilir; hangilerinin blokladığı risk politikasında tanımlıdır (docs/storybook-governance-pack.md §13).
- Yeşil koşul: PASS veya NO_CANDIDATES; REVIEW_REQUIRED yalnız gerekçe + ilişkili task/PR + reviewer onayıyla PASS'a düşer. Visual baseline, diff nedeni ve reviewer onayı olmadan güncellenemez; story a11y ihlali uyarı olarak bırakılamaz (bloklar). Story testleri ürün E2E'sinin yerine geçmez — E2E ayrıca yeşil olmalıdır.
- Veri doldukça nasıl dişlenir: Story matrisi kapsamı (`uic-story-matrix-required`) ve Master Component sayısı arttıkça kapı daha çok senaryoyu (theme/locale/RTL/density/permission/failure) bloklayıcı yapar; component coverage raporu eşiği Wave SB-3+ ile yükselir.

---

## 2. Mevcut İçerik, Veri ve Yürütme Kapıları

Aşağıdaki kapılar ADR-0026/0027'den önce de vardı ve standart katmanıyla birlikte çalışmaya devam eder. Bunlar standart referans bütünlüğünü değil, içerik kalitesi / veri tutarlılığı / yürütme hazırlığı eksenini zorlar.

### check-content

- Ne zorlar: İçerik kalite kapısı (node checker — güncel sayı `src/data/generated/meta.json`, exact-17 üretim boyutu). Düğüm içeriğinin kalıp/golden ölçütlerini karşılaması.
- Dosya yolu: `tools/agents/check-content.mjs`
- Yeşil koşul: Tüm düğümler içerik kalite eşiğini geçer.
- Veri doldukça nasıl dişlenir: Düğüm sayısı ve içerik beklentileri arttıkça eşik yükselir.

### check-ruleset

- Ne zorlar: ECA ruleset kataloğu bütünlüğü ve yapısal geçerliliği.
- Dosya yolu: `tools/agents/check-ruleset.mjs`
- Yeşil koşul: ECA kuralları şemaya uyar; zincir derinliği sınırı aşılmaz.
- Veri doldukça nasıl dişlenir: Yeni ECA kuralları eklendikçe yapısal denetim kapsamı genişler.

### check-surface

- Ne zorlar: Surface / Workflow kataloğu geçerliliği (yüzey sözleşmeleri).
- Dosya yolu: `tools/agents/check-surface.mjs`
- Yeşil koşul: Tüm Surface kayıtları şemaya uyar ve gerekli alanları taşır.
- Veri doldukça nasıl dişlenir: Yeni yüzeyler eklendikçe `techProfileRef` ve sözleşme alanları zorunlu kalır.

### check-data-quality

- Ne zorlar: Veri kalitesi — `owner` doluluğu, referans bütünlüğü ve `dependsOn` grafiğinin DAG (döngüsüz) olması. Faz kapısı sıralaması da burada zorlanır.
- Dosya yolu: `tools/agents/check-data-quality.mjs`
- Yeşil koşul: Dairesel bağımlılık yok; kırık referans yok; sahipsiz düğüm kuralları karşılanıyor.
- Veri doldukça nasıl dişlenir: Düğüm grafiği büyüdükçe DAG ve referans denetimi daha çok ilişkiyi kapsar.

### check-execution-readiness

- Ne zorlar: Yürütme hazırlığı — done kapısı için done-evidence, execution-readiness ve platform-traceability. **evidence bu kapıyla kapsanır.**
- Dosya yolu: `tools/agents/check-execution-readiness.mjs`
- Yeşil koşul: `done` statüsüne geçen düğümlerde gerekli evidence ve traceability kayıtları mevcut; `implementationStatus` tutarlı.
- Veri doldukça nasıl dişlenir: Düğümler ilerledikçe evidence beklentisi her faz kapısı için doğrulanır.

### check-ready-for-dev

- Ne zorlar: Definition of Ready — bir düğümün `development` fazına alınabilmesi için 10/10 hazırlık skoru. **DoR bu kapıyla kapsanır.**
- Dosya yolu: `tools/agents/check-ready-for-dev.mjs`
- Yeşil koşul: `phase = development` olan her düğüm `docs/ready-for-dev-gate.md` Bölüm 2'deki 10 alan kontrolünü 10/10 geçer.
- Veri doldukça nasıl dişlenir: Daha çok düğüm development fazına aktıkça kapı her birini tek tek 10/10 zorunlu tutar.

### check-delivery-sequence

- Ne zorlar: Kernel → SDK → app-core → app module → app assembly teknik teslim sırasının kanonik dokümanda, developer handoff dokümanlarında, workspace manifestte, export promptta ve CI zincirinde aynı kalması.
- Dosya yolu: `tools/agents/check-delivery-sequence.mjs`
- Yeşil koşul: `docs/kernel-sdk-app-delivery-sequence.md` mevcut; task-to-code, developer-guide, waterfall handoff, core contract, app distribution, workspace manifest ve docs index bu sözleşmeye bağlı; SDK kökü `packages/sdk`; eski `backend/` / `frontend/apps/` kök dili core/app dağıtım belgelerinde kalmamış.
- Veri doldukça nasıl dişlenir: SDK veya app-core sözleşmesi genişledikçe bu kapıya yeni zorunlu referans ve path denetimi eklenir; böylece app/module geliştiricisi sırayı tersinden başlatamaz.

---

## 3. evidence ve DoR İçin Ayrı Kapı Yoktur

ADR-0027, yeni standart/yönetişim kapıları sayarken evidence ve DoR'u **kasıtlı olarak yeni kapı listesine almaz**, çünkü ikisi de mevcut kapılarca zaten kapsanır:

- **evidence** → `check-execution-readiness`. Faz kapılarının kanıtı (`evidence[]`) done-evidence denetimiyle bu kapıda zorlanır. Ayrı bir `check-evidence` kapısı yoktur ve gerekmez.
- **Definition of Ready (DoR)** → `check-ready-for-dev`. `development` fazına geçiş için 10/10 hazırlık koşulu bu kapıyla zorlanır. Ayrı bir DoR kapısı yoktur; `ready-for-dev` kapısı DoR'un tamamını kapsar.

Bu nedenle yeni eklenen kapılar yalnızca standart referansı, uygulanabilirlik, waiver, kısa-kod, bağımlılık, UI standartları ve tech-profile eksenlerini hedefler; evidence/DoR çift kapı oluşturulmaz.

---

## 4. Tüm Kapıların Özet Matrisi

| Kapı | Eksen | Dosya yolu | Grup |
|---|---|---|---|
| check-content | İçerik kalitesi | `tools/agents/check-content.mjs` | Mevcut |
| check-ruleset | ECA kataloğu | `tools/agents/check-ruleset.mjs` | Mevcut |
| check-surface | Yüzey sözleşmesi | `tools/agents/check-surface.mjs` | Mevcut |
| check-tech-profile | Tech-profile + headless | `tools/agents/check-tech-profile.mjs` | ADR-0026 |
| check-standards-coverage | standardRefs bütünlüğü | `tools/agents/check-standards-coverage.mjs` | ADR-0027 |
| check-dimension-applicability | Boyut uygulanabilirliği | `tools/agents/check-dimension-applicability.mjs` | ADR-0027 |
| check-waivers | Waiver yaşam döngüsü | `tools/agents/check-waivers.mjs` | ADR-0027 |
| check-short-code | Kısa-kod / kapsam freni | `tools/agents/check-short-code.mjs` | ADR-0027 |
| check-dependency-policy | Bağımlılık politikası | `tools/agents/check-dependency-policy.mjs` | ADR-0027 |
| check-ui-standards | UI / tasarım standartları | `tools/agents/check-ui-standards.mjs` | ADR-0027 |
| check-data-quality | Veri tutarlılığı (DAG) | `tools/agents/check-data-quality.mjs` | Mevcut |
| check-execution-readiness | evidence + yürütme | `tools/agents/check-execution-readiness.mjs` | Mevcut (evidence kapsar) |
| check-ready-for-dev | Definition of Ready | `tools/agents/check-ready-for-dev.mjs` | Mevcut (DoR kapsar) |
| check-delivery-sequence | Kernel/SDK/app-core teslim sırası | `tools/agents/check-delivery-sequence.mjs` | Mevcut |

Kaynaklar: kapı tanımları `.github/workflows/deploy.yml`; standart sözleşmeleri `src/data/standards/*.json`; düğüm bağı `src/schemas/task.ts`; standart şema `src/schemas/standard.ts`. İlgili kararlar: `docs/adr-0026-tech-profiles.md`, `docs/adr-0027-engineering-standards.md`. Hub: `docs/engineering-standards-index.md`.
