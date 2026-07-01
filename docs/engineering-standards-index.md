# Mühendislik Standartları Dizini — Üç-Grup Modeli ve 15 Standart Hub'ı

Sürüm: 1.0 — 2026-06-29
Durum: Kanonik hub. Mühendislik standardı işletim katmanının (ADR-0027) tek giriş noktası.

---

## Önsöz — Bu Dizin Neden Var

actionplan'da her WBS düğümü 14 üretim boyutu (`featureDefs`, `security`, `wcag`, `testing` ...) taşır. Bu boyutların neredeyse tamamı "**çalışma-zamanı/ürün/operasyon**" eksenindedir: ürünün ne yaptığını ve çalışırken hangi kaliteyi sağladığını tarif eder. Eksik olan eksen şudur: "**bu düğüm hangi mühendislik standardıyla üretilecek?**" — kodlama disiplini, SOLID, kısa-kod, tasarım sistemi, UI/UX sözleşmesi, veri/API kontratı, state, kalite kapısı, gözlemlenebilirlik, sürümleme, AI yönetişimi, çok-dil/yerelleştirme.

ADR-0027 bu boşluğu **kart ekleyerek değil, işletim katmanı kurarak** kapatır. 12+ yeni serbest-metin boyut kartı eklemek UI'ı şişirir ve drift üretir (bir düğüm "Tailwind", diğeri "SCSS" der). Bunun yerine her standart **tek-kaynak makine-okunur bir sözleşmedir**; düğüm o sözleşmeye yalnızca **referans** verir. Bu dizin o sözleşmelerin haritasıdır.

Temel ilke: **standardı yeniden yazma, referans ver.** Bir düğümde "kodlama kuralı şudur" diye metin yazılmaz; düğüm `standardRefs.codingStandardRef = "coding-standards"` der ve tek-kaynak sözleşmeye bağlanır. Böylece standart drift'i imkânsızlaşır ve CI referans bütünlüğünü zorlar.

---

## 1. Üç-Grup Modeli

ADR-0027'nin getirdiği ayrım, her düğümün taşıdığı bilgiyi üç ayrık gruba böler. Bu gruplar birbirini dışlar; bir alan yalnızca bir gruba aittir.

| Grup | Ne içerir | Düğümdeki karşılığı | Niteliği |
|---|---|---|---|
| (1) Product/Runtime | Mevcut 14 üretim boyutu — ürün ne yapar, çalışırken hangi kaliteyi sağlar | `dimensions[<key>]` (14 anahtar) | Boyut (serbest-metin + prompt) |
| (2) Engineering Standards | 15 tek-kaynak standart sözleşmesi — düğüm hangi mühendislik kuralıyla üretilir | `standardRefs.<...>Ref` (15 ref) | Referans (boyut değil) |
| (3) Governance & Evidence | Uygulanabilirlik, sapma kayıtları, kanıt — kural bu düğüme uygulanıyor mu, kanıtı ne | `applicability`, `waivers[]`, `evidence[]` | Yönetişim katmanı |

Grup (1) içeriği düğümün kendisinde yaşar ve düğüme özgüdür. Grup (2) içeriği `src/data/standards/<id>.json` dosyalarında **tek kez** yaşar; düğüm yalnızca anahtarla bağlanır. Grup (3) düğüm ile standart arasındaki ilişkiyi yönetir: bir boyut uygulanmıyorsa gerekçesini (`applicability`), bir standarttan bilinçli sapılıyorsa onaylı+süreli kaydını (`waivers`), bir faz kapısının kanıtını (`evidence`) taşır.

Bu üç-grup ayrımı `src/schemas/task.ts` (`TaskNodeSchema`) içinde kodlanmıştır: `dimensions` (grup 1), `standardRefs` (grup 2), `applicability` + `waivers` + `evidence` (grup 3). Üç alanın tümü default'ludur; bu nedenle 445 düğüm dosyaya dokunulmadan parse olur (**lazy migration** — dosya yalnız değer atanınca yazılır).

---

## 2. 15 Standart Sözleşmesi Kataloğu

Aşağıdaki 15 standart, `src/schemas/standard.ts` içindeki tek paylaşılan şemaya (`StandardContractSchema`) uyar ve `src/data/standards/<id>.json` olarak saklanır. Her satır bir standardı, ailesini, özetini, düğümün bağlandığı `standardRefs` anahtarını ve standardı zorlayan bloklayıcı CI kapısını listeler.

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
| `ai-governance` | ai | Prompt registry + sürümleme, model/araç allowlist, eval seti + regresyon kapısı, halüsinasyon | `aiGovernanceRef` | check-standards-coverage |
| `i18n-standards` | engineering | Çok-dil/locale/RTL/currency/timezone/tax-legal-localization/data-residency + çeviri-iş-akışı + fallback | `i18nRef` | check-i18n |
| `dependency-policy` | governance | Paket allowlist, lisans politikası (lisans-katman federasyonu), SBOM üretimi, lockfile commit | (politika; düğüm ref'i yok) | check-dependency-policy |

Notlar:

- 15 standartdan 14'ü düğümde bir `standardRefs.<...>Ref` anahtarına karşılık gelir. `dependency-policy` standardı düğüm bazlı değil **repo bazlı** bir politikadır; `standardRefs` içinde ayrı bir anahtarı yoktur, doğrudan `check-dependency-policy` kapısıyla repoda taranır.
- `standardRefs` içinde ek olarak bir `techProfileRef` anahtarı vardır (ADR-0026). Bu anahtar `src/data/standards/<id>.json`'a değil, `src/data/tech-profiles.json` içindeki bir tech-profile id'sine çözülür ve `check-tech-profile` kapısıyla zorlanır. Tech-profile bir standart sözleşmesi değil, frontend stack manifestidir; bu nedenle yukarıdaki 15'lik katalogda ayrı satır olarak yer almaz ama `standardRefs` ailesinin bir parçasıdır.
- Aile değerleri `src/schemas/standard.ts` içindeki `StandardFamilySchema` enum'undan gelir: `engineering | design | testing | devops | ai | data | governance`.

---

## 3. standardRef → Standart Eşlemesi

`StandardRefsSchema` (src/schemas/task.ts) içindeki her anahtar, çözüldüğü hedefe aşağıdaki gibi bağlanır. `techProfileRef` dışındaki tüm anahtarlar `src/data/standards/<id>.json` dosyasına çözülür.

| standardRef anahtarı | Çözüldüğü hedef |
|---|---|
| `techProfileRef` | `src/data/tech-profiles.json` içindeki profil id'si |
| `i18nRef` | `src/data/standards/i18n-standards.json` |
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

Şema kaynakları: standart sözleşmesi `src/schemas/standard.ts` (`StandardContractSchema`), düğüm bağı `src/schemas/task.ts` (`StandardRefsSchema`, `ApplicabilitySchema`, `WaiverSchema`).

---

## 6. İlke — "Yeniden Yazma, Referans Ver"

Bu hub'ın taşıdığı tek davranış kuralı: **bir düğümde standardın içeriğini tekrarlama.** Standardın kuralları, yasakları ve gerekçeleri yalnızca `src/data/standards/<id>.json` içinde yaşar. Düğüm o sözleşmeye `standardRefs` ile bağlanır; içeriği kopyalamaz.

Bunun üç sonucu vardır:

- **Drift imkânsız.** Standart tek yerde değiştiğinde, ona referans veren tüm düğümler otomatik olarak yeni sürümü işaret eder; çelişen iki kopya oluşamaz.
- **UI şişmez.** 15 standart için 15 serbest-metin kartı eklenmez; düğüm yalnızca 15 referans anahtarı taşır.
- **CI zorlayabilir.** Referans makine-okunur olduğundan `check-standards-coverage` her referansın gerçek bir sözleşmeye çözüldüğünü doğrulayabilir; serbest metin bu denetimi mümkün kılmazdı.

Standardın kendisini değiştirmek isteyen, ilgili `src/data/standards/<id>.json` sözleşmesini ve gerekiyorsa dayandığı ADR'yi günceller — düğümleri değil.
