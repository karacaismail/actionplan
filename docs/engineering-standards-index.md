# Mühendislik Standartları Dizini — Üç-Grup Modeli ve 16 Çekirdek Standart Hub'ı

Sürüm: 1.0 — 2026-06-29
Durum: Kanonik hub. Mühendislik standardı işletim katmanının (ADR-0027) tek giriş noktası.

---

## Önsöz — Bu Dizin Neden Var

actionplan'da her WBS düğümü 17 üretim boyutu (`featureDefs`, `security`, `wcag`, `testing`, `dataLifecycle`, `observability`, `reliability` ...) taşır. Bu boyutların neredeyse tamamı "**çalışma-zamanı/ürün/operasyon**" eksenindedir: ürünün ne yaptığını ve çalışırken hangi kaliteyi sağladığını tarif eder. Eksik olan eksen şudur: "**bu düğüm hangi mühendislik standardıyla üretilecek?**" — kodlama disiplini, SOLID, kısa-kod, tasarım sistemi, UI/UX sözleşmesi, veri/API kontratı, state, kalite kapısı, gözlemlenebilirlik, sürümleme, AI yönetişimi, çok-dil/yerelleştirme.

ADR-0027 bu boşluğu **kart ekleyerek değil, işletim katmanı kurarak** kapatır. 12+ yeni serbest-metin boyut kartı eklemek UI'ı şişirir ve drift üretir (bir düğüm "Tailwind", diğeri "SCSS" der). Bunun yerine her standart **tek-kaynak makine-okunur bir sözleşmedir**; düğüm o sözleşmeye yalnızca **referans** verir. Bu dizin o sözleşmelerin haritasıdır.

Temel ilke: **standardı yeniden yazma, referans ver.** Bir düğümde "kodlama kuralı şudur" diye metin yazılmaz; düğüm `standardRefs.codingStandardRef = "coding-standards"` der ve tek-kaynak sözleşmeye bağlanır. Böylece standart drift'i imkânsızlaşır ve CI referans bütünlüğünü zorlar.

---

## 1. Üç-Grup Modeli

ADR-0027'nin getirdiği ayrım, her düğümün taşıdığı bilgiyi üç ayrık gruba böler. Bu gruplar birbirini dışlar; bir alan yalnızca bir gruba aittir.

| Grup | Ne içerir | Düğümdeki karşılığı | Niteliği |
|---|---|---|---|
| (1) Product/Runtime/Operations | Mevcut 17 üretim boyutu — ürün ne yapar, çalışırken hangi kaliteyi sağlar | `dimensions[<key>]` (17 anahtar) | Boyut (serbest-metin + prompt) |
| (2) Engineering Standards | 16 çekirdek tek-kaynak standart sözleşmesi — düğüm hangi mühendislik kuralıyla üretilir | `standardRefs.<...>Ref` | Referans (boyut değil) |
| (3) Governance & Evidence | Uygulanabilirlik, sapma kayıtları, kanıt — kural bu düğüme uygulanıyor mu, kanıtı ne | `applicability`, `waivers[]`, `evidence[]` | Yönetişim katmanı |

Grup (1) içeriği düğümün kendisinde yaşar ve düğüme özgüdür. Grup (2) içeriği `src/data/standards/<id>.json` dosyalarında **tek kez** yaşar; düğüm yalnızca anahtarla bağlanır. Grup (3) düğüm ile standart arasındaki ilişkiyi yönetir: bir boyut uygulanmıyorsa gerekçesini (`applicability`), bir standarttan bilinçli sapılıyorsa onaylı+süreli kaydını (`waivers`), bir faz kapısının kanıtını (`evidence`) taşır.

Bu üç-grup ayrımı `src/schemas/task.ts` (`TaskNodeSchema`) içinde kodlanmıştır: `dimensions` (grup 1), `standardRefs` (grup 2), `applicability` + `waivers` + `evidence` (grup 3). Üç alanın tümü default'ludur; güncel generated data sayısı `src/data/generated/meta.json` kaynağından okunur ve dosya yalnız değer atanınca yazılır (**lazy migration**).

---

## 2. 16 Çekirdek Standart Sözleşmesi Kataloğu

Aşağıdaki 16 çekirdek standart, `src/schemas/standard.ts` içindeki tek paylaşılan şemaya (`StandardContractSchema`) uyar ve `src/data/standards/<id>.json` olarak saklanır. Her satır bir standardı, ailesini, özetini, düğümün bağlandığı `standardRefs` anahtarını ve standardı zorlayan bloklayıcı CI kapısını listeler.

Tablo okunuşu: "standardRef anahtarı" sütunu, bir düğümde o standarda referans vermek için doldurulan alanın adıdır. "Zorlayan CI kapısı" sütunu, `.github/workflows/deploy.yml` içinde o standardı (veya referans bütünlüğünü) bloklayıcı olarak denetleyen adımdır.

| id | Aile | Özet | standardRef anahtarı | Zorlayan CI kapısı |
|---|---|---|---|---|
| `architecture` | engineering | Katman sınırları, import yönü, bounded-context kapanımı, kernel dokunma kuralı, engine↔UI ayrımı | `architectureRef` | check-standards-coverage |
| `coding-standards` | engineering | İsimlendirme, dosya düzeni, import sırası, tip disiplini, hata yönetimi, biome lint/format | `codingStandardRef` | check-standards-coverage |
| `short-code` | engineering | Küçük PR, dosya/fonksiyon boyut tavanı, döngüsel ve bilişsel karmaşıklık eşikleri | `shortCodeRef` | check-short-code |
| `quality-gates` | testing | Merge öncesi bloklayıcı kapılar: typecheck 0, biome 0, kapsam eşiği, e2e + axe 0 ihlal | `qualityGateRef` | check-standards-coverage |
| `design-system` | design | Tek-kaynak tasarım token taksonomisi (color/space/type-scale/radius/elevation/motion), SCSS | `designSystemRef` | check-ui-standards |
| `ui-components` | design | Headless Radix tabanlı bileşen API'si (props), controlled/uncontrolled davranış, zorunlu a11y | `uiComponentRef` | check-ui-standards |
| `ux-interaction` | design | Klavye akışı + mantıksal odak sırası, satır-içi form doğrulama (RHF + zod), erişilebilirlik | `uxStandardRef` | check-ui-standards |
| `data-api-contract` | data | GraphQL şema + typed codegen, SQLAlchemy 2.0 + Alembic model konvansiyonu (PostgreSQL), expand-contract migrasyon | `dataApiContractRef` | check-standards-coverage |
| `state-management` | engineering | Hangi durumun nerede yaşadığı (sunucu=TanStack Query, URL=TanStack Router, yerel UI=useState) | `stateContractRef` | check-standards-coverage |
| `observability` | devops | Yapısal JSON log + correlation/request id, RED/USE metrikleri, dağıtık trace, dashboard, SLO | `observabilityRef` | check-standards-coverage |
| `testing-strategy` | testing | Test piramidi (unit/integration/contract/e2e/visual/load/mutation), seviye başına kapsam | `testingStandardRef` | check-standards-coverage |
| `release-versioning` | devops | Semantik sürümleme (SemVer), Conventional Commits, otomatik changelog, feature flag ile dağıtım | `releasePolicyRef` | check-standards-coverage |
| `ai-governance` | ai | Prompt registry, eval/validation ve platformda AI ürün-kodu yazma yasağı: `read-only-audit`, `human-developer-only`, `DIRECTIVE-ONLY` | `aiGovernanceRef` | check-standards-coverage + check-platform-write-boundary |
| `i18n-standards` | engineering | Çok-dil/locale/RTL/currency/timezone/tax-legal-localization/data-residency + çeviri-iş-akışı + fallback | `i18nRef` | check-i18n |
| `url-policy` | engineering | `k-route-policy`, typed public ID, canonical/alias, tenant/custom-domain topolojileri ve Ada→Atom URL sorumlulukları | `urlPolicyRef` (merkezi default) | qa:url-policy |
| `dependency-policy` | governance | Paket allowlist, lisans politikası (lisans-katman federasyonu), SBOM üretimi, lockfile commit | (politika; düğüm ref'i yok) | check-dependency-policy |
| `global-market-readiness` | governance | Pazar/dil canlıya alma kapısı: 14 launch sorusu, pazar-başına ödeme/destek/moderasyon beyanı, IP-geolocation kimlik-değildir kuralı, kill switch | `globalMarketReadinessRef` | check-market-readiness |
| `finance-money-model` | data | Para modeli: decimal+ISO 4217+ölçek+yuvarlama politikası, minor-unit varsayım yasağı, üç para birimi ayrımı, kur-dönüşüm-tarihi beyanı, altı finansal durum | `financeModelRef` | check-finance-model |
| `identity-data` | data | Kişi/kuruluş kimlik verisi: serbest displayName + yapılandırılmış hukuki isim, isim-regex yasağı, ülke-şablonlu adres (UPU S42), E.164 çift saklama, SMS-varsayımı yasağı | `identityDataRef` | check-standards-coverage |
| `search-quality` | data | Arama kalitesi: collation/ICU sürüm sabitleme, transliteration/diakritik tolerans beyanı, alan-bazlı tolerans sınıfları, dil-bağımlı case kuralları | `searchQualityRef` | check-standards-coverage |
| `decision-grade-data` | data | Karar-verisi zinciri: kaynak→onay→mutabakat→dönem kilidi→formül-sürüm, 11 analitik boyut, event-adı-çevrilmez, orijinal/normalize para ayrımı | `decisionGradeRef` | check-standards-coverage |

Notlar:

- 16 çekirdek standarttan 15'i düğümde bir `standardRefs.<...>Ref` anahtarına karşılık gelir. `urlPolicyRef`, her JSON'a kopyalanmak yerine `TaskNodeSchema` tarafından merkezi `url-policy` default'u olarak miras verilir. `dependency-policy` repo bazlıdır ve ayrı ref taşımaz.
- `standardRefs` içinde ek olarak bir `techProfileRef` anahtarı vardır (ADR-0026). Bu anahtar `src/data/standards/<id>.json`'a değil, `src/data/tech-profiles.json` içindeki bir tech-profile id'sine çözülür ve `check-tech-profile` kapısıyla zorlanır. Tech-profile bir standart sözleşmesi değil, frontend stack manifestidir; bu nedenle yukarıdaki 16'lık çekirdek katalogda ayrı satır olarak yer almaz ama `standardRefs` ailesinin bir parçasıdır.
- Aile değerleri `src/schemas/standard.ts` içindeki `StandardFamilySchema` enum'undan gelir: `engineering | design | testing | devops | ai | data | governance`.

---

## 3. standardRef → Standart Eşlemesi

`StandardRefsSchema` (src/schemas/task.ts) içindeki her anahtar, çözüldüğü hedefe aşağıdaki gibi bağlanır. `techProfileRef` dışındaki tüm anahtarlar `src/data/standards/<id>.json` dosyasına çözülür.

| standardRef anahtarı | Çözüldüğü hedef |
|---|---|
| `techProfileRef` | `src/data/tech-profiles.json` içindeki profil id'si |
| `globalMarketReadinessRef` | `src/data/standards/global-market-readiness.json` |
| `financeModelRef` | `src/data/standards/finance-money-model.json` |
| `identityDataRef` | `src/data/standards/identity-data.json` |
| `searchQualityRef` | `src/data/standards/search-quality.json` |
| `decisionGradeRef` | `src/data/standards/decision-grade-data.json` |
| `i18nRef` | `src/data/standards/i18n-standards.json` |
| `urlPolicyRef` | `src/data/standards/url-policy.json` + `src/data/url-policy/registry.json` |
| `architectureRef` | `src/data/standards/architecture.json` |
| `codingStandardRef` | `src/data/standards/coding-standards.json` |
| `shortCodeRef` | `src/data/standards/short-code.json` |
| `designSystemRef` | `src/data/standards/design-system.json` |
| `uiComponentRef` | `src/data/standards/ui-components.json` |
| `uxStandardRef` | `src/data/standards/ux-interaction.json` |
| `dataApiContractRef` | `src/data/standards/data-api-contract.json` |
| `stateContractRef` | `src/data/standards/state-management.json` |
| `testingStandardRef` | `src/data/standards/testing-strategy.json` |
| `qualityGateRef` | `src/data/standards/quality-gates.json` |
| `observabilityRef` | `src/data/standards/observability.json` |
| `releasePolicyRef` | `src/data/standards/release-versioning.json` |
| `aiGovernanceRef` | `src/data/standards/ai-governance.json` |

Bir referansın çözülememesi (boş olmayan bir değer hedefte yoksa) `check-standards-coverage` kapısını bloklar.

---

## 4. Standart Sözleşmesinin Anatomisi

Her standart `StandardContractSchema`'ya uyar. Bir standardı okurken veya yeni kural eklerken alan anlamları şunlardır:

| Alan | Anlamı |
|---|---|
| `id` | Kebab-case kimlik; dosya adı (`<id>.json`) ile aynı; `standardRef` bunu işaret eder |
| `name` | İnsan-okunur başlık |
| `version` | Sözleşme sürümü (SemVer; default `1.0.0`) |
| `family` | `engineering | design | testing | devops | ai | data | governance` |
| `basedOnAdr` | Dayandığı ADR id listesi (ör. `adr-0027`) |
| `summary` | Tek paragraf özet |
| `appliesTo` | Hangi yüzey sınıfı/seviyeye uygulanır (boş = hepsi) |
| `rules[]` | `{id, rule, rationale, severity(must/should/may), check}` — en az 3 kural |
| `banned` | Yasak liste (paket, desen, uygulama) |
| `allowed` | İzinli liste |
| `references` | Dış kaynak/standart bağlantıları |

`rules[].check` alanı kritiktir: bir kuralın nasıl zorlandığını (CI kapısı / lint kuralı / review / test) söyler. Boş `check`, kuralın henüz otomatik zorlanmadığını gösterir — bu, verinin dolmasıyla dişlenecek bir uçtur.

---

## 5. İlgili ADR ve Kanonik Dokümanlar

Bu dizin aşağıdaki kararlardan türemiştir ve onlarla birlikte okunmalıdır.

| Doküman | Yol | Rolü |
|---|---|---|
| ADR-0027 | `docs/adr-0027-engineering-standards.md` | Mühendislik standardı işletim katmanı kararı: sözleşme + referans + uygulanabilirlik + kapı |
| ADR-0026 | `docs/adr-0026-tech-profiles.md` | Tech-profile manifesti; ADR-0027 bunu genelleştirir; `techProfileRef` buradan gelir |
| CI Kapı Kataloğu | `docs/ci-conformance-gates.md` | Her bloklayıcı kapının ne zorladığı, yeşil koşulu ve dişlenme yolu |
| Waiver Politikası | `docs/waiver-policy.md` | Sapma yaşam döngüsü; `waivers[]` alan sözleşmesi; `check-waivers` reddetme kuralları |
| Task-to-Code Sözleşmesi | `docs/task-to-code-contract.md` | WBS düğümünün yazılım-teslimat karşılığı; seviye/faz → eylem |
| Definition of Ready | `docs/ready-for-dev-gate.md` | `development` fazı kapısı; `check-ready-for-dev` ile zorlanır |
| Storybook Implementation | `docs/storybook-implementation.md` | Storybook'un zorunlu Master Component sözleşme/evidence yüzeyi kararı; normatif kurallar `ui-components.json` v1.1 + `design-system.json` v1.1'de, test kapıları `13-testing-quality-standard` + `ci-conformance-gates` (storybook-ci), a11y bağı `02-a11y-accessibility-standard` §11'de yaşar — bu rapor uygulama/entegrasyon haritasıdır |
| Storybook Governance Pack | `docs/storybook-governance-pack.md` | İkinci seviye Storybook yönetişimi: risk-temelli coverage budget, fixture fidelity, baseline governance, güvenlik/publishing, federation ve 8 ek CI sinyali; kaynak risk analizi `docs/storybook-unknown-unknowns-gap-report.md` |
| Storybook Root-Integration Gap | `docs/storybook-root-integration-gap-report.md` | Kök-entegrasyon denetimi: rol modeli (uiArtifactRole), registry/foreign-key katmanı (`src/data/storybook/`), dürüst migration sonucu (MIGRATION_INCOMPLETE) ve ratchet tamper-guard |

Şema kaynakları: standart sözleşmesi `src/schemas/standard.ts` (`StandardContractSchema`), düğüm bağı `src/schemas/task.ts` (`StandardRefsSchema`, `ApplicabilitySchema`, `WaiverSchema`).

---

## 5.1 Reference-only Ek — Kernel Delivery Sınırı (§2 kataloğunun DIŞINDA)

Aşağıdaki giriş §2'deki çekirdek katalogda **yer almaz** ve §3'te bir `standardRef` anahtarına **çözülmez**: sınıfı **reference-only**'dir. Bir düğüm buna bağlanmaz; katalog girişi ile anlatı yalnız kanonik karar zincirine işaret eder ve hiçbir bağlayıcı değeri ikinci kez yazmaz.

| Katman | Yol | Rolü |
|---|---|---|
| Anlatı standardı | `docs/standards/15-kernel-delivery-boundary-standard.md` | **reference-only** insan-okur anlatı; kural üretmez, kararın sade anlamını verir |
| Katalog girişi | `src/data/standards/kernel-delivery-boundary.json` | reference-only katalog girişi; bağlayıcı değer kopyası taşımaz |
| Kanonik karar (sahip) | `reports/kernel-asgi-core-profile-decision-2026-08-11.json` | Bağlayıcı değerlerin tek sahibi |
| Doğrulayıcı (fail-closed) | `tools/lib/kernel-asgi-core-profile.mjs` | `accepted=true` + boş hata listesi vermeden karar tüketilemez |

Kapılar: `tests/kernelAsgiCoreProfileDecision.test.ts`, `tests/kernelDeliveryBoundaryStandard.test.ts`, `tests/kernelDeliveryBoundaryDocumentation.test.ts`. Bu ek çalışan bir runtime, endpoint veya form iddia etmez: `capability delta = NONE`.

Aynı DIŞ bölümün kapsamına, aynı H2 altında, M6 Constitutional Freeze kaydı da işaret olarak eklenir: `reports/kernel-constitutional-freeze-2026-08-21.json` (doğrulayıcı `tools/lib/kernel-constitutional-freeze.mjs`, kapı `tests/kernelConstitutionalFreeze.test.ts`) P01 (`PARTIAL_ADDITIVE`/`RCPT-01`, alınmamış) ve PKG11/12/13 (`invalid-or-superseded`/etkisiz) durumunu, Actionplan/Kernel taban pinlerini ve authority zincirinin sealed-live seq4 + projected-not-live seq5 pointer'larını taşır; yukarıdaki ASGI/authority değerlerini ikinci kez yazmaz, yalnız işaret eder ve çalışan bir runtime, endpoint veya form iddia etmez.

Aynı DIŞ bölümün kapsamına, aynı H2 altında, M7 GJ01 Roadmap Resolution kaydı da işaret olarak eklenir: `reports/gj01-roadmap-resolution-2026-08-21.json` (doğrulayıcı `tools/lib/gj01-roadmap-resolution.mjs`, kapı `tests/gj01RoadmapResolution.test.ts`). Bu kayıt `ActionGateway.execute(ActionSpec) -> ActionOutcome | CommitReceipt` sözleşmesini dondurur, `businessPersistenceOwner=APPLICATION` ve tipli SDK köprüsünü (`typedBridge.owner=GENERATED_SDK_PACKAGE_FROM_KERNEL_CONTRACTS`, `artifactStatus=ABSENT_CLOSED`) sahiplendirir, framework seçimini `DEFERRED_UNTIL_V4` erteler, Delivery'yi yalnız ASGI'ya kilitler (Uvicorn referans, Hypercorn conformance, FastAPI yalnız opsiyonel adaptör — asla geliştirme tabanı değil), dirty legacy platform kökünü `ARCHIVE_EVIDENCE`, Django'yu `DELETED_ABSENT_NO_CARRYOVER` ve PKG14-19 dallarını (taban 60568) `HISTORICAL_NO_CARRYOVER` sınıflar, ilk özellik paketini `GJ01-V0-FAILURE-ARCHAEOLOGY` seçer ve Actionplan/Kernel taban pinlerini + `src/data/standards-applicability.json` sourceCommit pointer'ını taşır; hiçbir değeri ikinci kez yazmaz ve `capability delta = NONE`.

Aynı DIŞ bölümün kapsamına, aynı H2 altında, M8 GJ01 V0 Failure Archaeology kaydı da işaret olarak eklenir: `reports/gj01-v0-failure-archaeology-2026-08-21.json` (doğrulayıcı `tools/lib/gj01-v0-failure-archaeology.mjs`, kapı `tests/gj01V0FailureArchaeology.test.ts`). Bu kayıt platform commit `930c09b` (51 dosya, 4860 satır ekleme, FastAPI+Strawberry+Uvicorn+httpx, yalnız DB-less `/healthz` ve GraphQL ping testleri, SQLAlchemy/Alembic/PostgreSQL kanıtı yok, 11 dokunulmamış branding dosyası) ve her V0-dönemi yapıyı kapalı bir `reuse|archive|reject` enum'una sınıflar: legacy platform scaffold/health-ping `archive` (`ARCHIVE_EVIDENCE_ZERO_BYTE`), FastAPI/GraphQL geliştirme tabanı `reject` (`REJECT_NO_CARRYOVER`, kalıcılık kanıtı yok), Django `reject` (`REJECT_ABSENT_DELETED_NO_CARRYOVER`, absent/deleted), M7'nin ASGI Delivery sınırı + V4 framework ertelemesi `reuse` (`REUSE_POINTER_ONLY_ZERO_BYTE`, sıfır byte kopya) ve legacy web/UI/infra yatay scaffold `archive` (`ARCHIVE_OUT_OF_SCOPE_NO_CARRYOVER`). M7 kaydını `sourceCommit` pointer'ıyla tüketir, hiçbir sahip değerini ikinci kez yazmaz; `capabilityDelta=NONE`, `runnableProduct=false`.

---

## 6. İlke — "Yeniden Yazma, Referans Ver"

Bu hub'ın taşıdığı tek davranış kuralı: **bir düğümde standardın içeriğini tekrarlama.** Standardın kuralları, yasakları ve gerekçeleri yalnızca `src/data/standards/<id>.json` içinde yaşar. Düğüm o sözleşmeye `standardRefs` ile bağlanır; içeriği kopyalamaz.

Bunun üç sonucu vardır:

- **Drift imkânsız.** Standart tek yerde değiştiğinde, ona referans veren tüm düğümler otomatik olarak yeni sürümü işaret eder; çelişen iki kopya oluşamaz.
- **UI şişmez.** Çekirdek standartlar için serbest-metin kartları eklenmez; düğüm yalnızca tipli referans anahtarları taşır.
- **CI zorlayabilir.** Referans makine-okunur olduğundan `check-standards-coverage` her referansın gerçek bir sözleşmeye çözüldüğünü doğrulayabilir; serbest metin bu denetimi mümkün kılmazdı.

Standardın kendisini değiştirmek isteyen, ilgili `src/data/standards/<id>.json` sözleşmesini ve gerekiyorsa dayandığı ADR'yi günceller — düğümleri değil.
