# Storybook Implementation — Master Component ve Tam Kapsamlı UI Yaşam Döngüsü

**Proje:** `metaframer` · marka: meta-framer · teknik sınıf: meta-framework  
**Tarih:** 2026-07-12  
**Durum:** İnsan kararıyla kabul edilmiş hedef yaklaşım; implementation ve kanonik doküman güncelleme raporu.  
**Kapsam:** Metaframer ile üretilecek bütün ürün UI'ları, ortak UI paketi, Master Component kataloğu, Storybook review/test/evidence süreci.  
**Non-goal:** Bu belge Storybook kurulumu yapmaz, ürün bileşeni geliştirmez ve mevcut kanonik UI kurallarını kopyalamaz. Hangi kuralın hangi kaynakta yaşaması gerektiğini ve implementation ekibinin teslimatını tanımlar.

## 1. Karar

Storybook, Metaframer UI sürecinde opsiyonel vitrin değildir. Aşağıdaki işlevler için zorunlu platform yüzeyidir:

1. Master Component sözleşme kataloğu,
2. component API ve durum dokümantasyonu,
3. tasarım token/theme doğrulaması,
4. izole component geliştirme,
5. interaction ve erişilebilirlik testleri,
6. responsive, locale, RTL ve yoğun-veri durumlarının doğrulanması,
7. görsel regresyon review'u,
8. designer–developer–QA–product ortak kabul yüzeyi,
9. release öncesi component evidence kaynağı,
10. deprecated component ve migration görünürlüğü.

Kaynak-kural ayrımı:

- Component kaynak kodu ve tipli API'si implementation reposundaki ortak UI paketinde yaşar.
- Story dosyaları component sözleşmesinin çalıştırılabilir örnekleri ve test fixture'larıdır.
- Storybook bu kaynakları kataloglar, çalıştırır ve review kanıtı üretir.
- Storybook içinde elle tanımlanıp kaynak koda bağlanmayan “sahte component” Master Component sayılmaz.

## 2. Master Component tanımı

**Master Component**, bir ürün ekranına özel kopya değil; bütün ürün, theme, Surface ve tenant varyantlarının tükettiği kanonik, versiyonlu ve erişilebilir component sözleşmesidir.

Bir component ancak aşağıdaki sözleşme tamamlandığında Master Component olabilir:

| Sözleşme | Zorunlu içerik |
|---|---|
| Kimlik | sabit component adı, kategori, owner, reviewer |
| API | tipli props, controlled/uncontrolled davranış, event sözleşmesi |
| Token | yalnız semantik design token; ham renk/ölçü yok |
| Variant | kapalı variant ve size kümeleri; ad-hoc stil varyantı yok |
| State | default, hover, focus-visible, disabled, loading, empty, error |
| Composition | slot/asChild/compound component örnekleri |
| A11y | semantic HTML, ARIA, klavye, focus, screen-reader davranışı |
| Responsive | sm/md/lg ve dar/geniş container davranışı |
| Localization | uzun metin, pseudo-locale, RTL, sayı/tarih/para örnekleri |
| Data density | compact/comfortable yoğunluk, overflow, truncation, virtualized senaryo |
| Permissions | hidden/readonly/disabled/denied durumlarının güvenli sunumu |
| Testing | interaction, a11y, visual regression ve ilgili unit test bağı |
| Versioning | semver etkisi, changelog, deprecation ve replacement |
| Evidence | yayınlanmış Storybook URL'i, CI sonucu ve review kaydı |

Master Component olmayanlar:

- yalnız bir sayfada kullanılan ve tekrar-kullanım sözleşmesi bulunmayan local component,
- yalnız Figma'da bulunan, çalışan koda bağlanmamış component,
- yalnız default story'si bulunan component,
- accessibility ve interaction testi olmayan görsel örnek,
- token yerine ham CSS değeri kullanan varyant,
- Storybook içinde çalışan fakat ürün paketinden import edilemeyen demo.

## 3. Önerilen Storybook bilgi mimarisi

Storybook kataloğu component ağacını ve olgunluk durumunu görünür kılmalıdır:

```text
Foundations
├── Colors
├── Typography
├── Spacing
├── Radius
├── Elevation
├── Motion
└── Density

Primitives
├── Button
├── IconButton
├── Input
├── Select
├── Checkbox
├── Dialog
└── Tooltip

Master Components
├── DataTable
├── DataGrid
├── FilterBar
├── MetricCard
├── FormField
├── MoneyInput
├── DateRangeInput
├── PermissionEditor
└── FileManager

Patterns
├── SearchAndFilter
├── BulkActions
├── ApprovalFlow
├── EmptyState
├── ErrorRecovery
└── DataImportReview

Surfaces
├── List
├── Table
├── Board
├── Dashboard
├── Report
└── Detail

Deprecated
└── replacement ve migration bağlantıları
```

Kural: `Surface` story'si Master Component'leri kompoze eder; Master Component story'si belirli bir ürün/tenant iş kuralını içine gömmez. Ürün örnekleri fixture/args üzerinden verilir.

## 4. Zorunlu story matrisi

Her Master Component için uygulanabilir story'ler aşağıdaki matristen seçilir. Uygulanmayan satır gerekçeli olarak işaretlenir; sessizce atlanmaz.

| Story grubu | Zorunlu senaryo |
|---|---|
| Baseline | default ve minimum props |
| State | hover, focus-visible, disabled, loading, empty, error |
| Variant | tüm desteklenen variant × size kombinasyonları |
| Controlled | controlled ve uncontrolled davranış |
| Interaction | click, keyboard, form submit, validation, dismiss/escape |
| Composition | slot, compound child ve gerçek pattern içinde kullanım |
| Responsive | sm/md/lg viewport ve container daralması |
| Density | compact/comfortable; çok satır, çok kolon, uzun değer |
| Overflow | uzun metin, truncate/wrap, yatay kaydırma, sticky alan |
| i18n | Türkçe, İngilizce, pseudo-long locale |
| RTL | RTL yön ve ikon/yerleşim davranışı |
| A11y | klavye-only, screen-reader adları, focus sırası, axe |
| Theme | desteklenen bütün theme/token setleri |
| Motion | normal ve prefers-reduced-motion |
| Permission | editable, readonly, disabled, hidden/denied |
| Failure | network error, retry, partial data, stale data |
| Data sense | freshness, source, confidence, drill-down ve anomaly durumu uygulanıyorsa |

Hover/focus gibi pseudo-state görselleri yalnız statik ekran görüntüsüyle değil, mümkünse story parametresi veya interaction testiyle deterministik hale getirilmelidir.

Kapsam okuma düzeltmesi (2026-07-12, unknown-unknowns raporu U0): bu matris exhaustive Cartesian ürün olarak OKUNMAZ. Yedi çekirdek davranış state'i her Master Component'te exhaustive kalır (invariant); presentation eksenleri (theme × locale × viewport × density × permission × veri hacmi) risk sınıfına göre pairwise/representative seçilir ve component'in story bütçesine (uiDelivery.coverageBudget) sığar — aksi halde tek bir DataGrid için 30.000+ kombinasyon doğar ve katalog/CI sürdürülemez olur. Risk-temelli kapsam modeli, bütçe ve sinyaller: docs/storybook-governance-pack.md §1/§13; risk keşfi: docs/storybook-unknown-unknowns-gap-report.md.

## 5. Storybook'un waterfall sürecindeki yeri

| Faz | Storybook teslimatı | Kapı |
|---|---|---|
| requirements | Master/local component kararı, component envanteri, non-goals | Eksik component sınırıyla test-plan başlamaz |
| test-plan | story matrisi, interaction/a11y/visual test listesi, viewport/locale/theme fixture'ları | Story/test planı koddan önce review edilir |
| db-schema | Doğrudan UI işi yok; veri şekli story fixture sözleşmesine yansır | API/fixture şema paritesi kontrol edilir |
| development | Component + stories birlikte geliştirilir; önce başarısız interaction/a11y testi | Story'siz Master Component merge edilemez |
| test-qa | Story test runner, axe, visual regression, responsive/i18n matrisi | Tüm bloklayıcı story testleri yeşil |
| verification | Yayınlanmış Storybook review URL'i ve insan onayı | Evidence olmadan UI doğrulanmış sayılmaz |
| release-maintenance | Version, changelog, deprecated/migration story'leri | Breaking API migration rehbersiz yayınlanmaz |

## 6. Test ve CI modeli

Storybook, mevcut unit ve Playwright testlerinin yerine geçmez. Test katmanları birlikte çalışır:

| Katman | Sorumluluk |
|---|---|
| Unit | saf fonksiyon, hook ve component mantığı |
| Story interaction | component kullanıcı etkileşimi ve state geçişi |
| Story a11y | story başına axe ve klavye sözleşmesi |
| Visual regression | token, theme, layout ve responsive görsel drift |
| Contract | props/schema/API fixture paritesi |
| Playwright E2E | gerçek Surface ve kullanıcı yolculuğu |

Önerilen bloklayıcı CI sırası:

```text
typecheck
→ lint
→ component unit tests
→ Storybook static build
→ story interaction tests
→ story a11y tests
→ visual regression diff
→ product E2E + axe
→ publish preview
```

CI sonuç sınıfları:

- `PASS`: kapsamda story var ve bütün bloklayıcı testler geçti.
- `FAIL`: story/build/test/diff ihlali var.
- `NO_CANDIDATES`: PR UI/Master Component kapsamına girmiyor.
- `REVIEW_REQUIRED`: kasıtlı visual diff insan kabulü bekliyor.

Ek rapor sinyalleri (BASELINE_STALE, FIXTURE_DRIFT, VERSION_MISMATCH, OWNER_MISSING, SECURITY_REVIEW_REQUIRED, BUDGET_EXCEEDED, FLAKY_QUARANTINED, MANUAL_A11Y_REQUIRED) docs/storybook-governance-pack.md §13'te tanımlıdır.

Visual baseline güncellemek test hatasını silme yöntemi değildir. Diff'in nedeni, ilişkili task/PR ve reviewer onayı olmadan baseline değiştirilemez.

## 7. Evidence sözleşmesi

UI component veya Surface görevinin `evidence[]` kaydı en az şunları taşımalıdır:

- yayınlanmış Storybook preview URL'i,
- story test sonucu,
- a11y sonucu,
- visual regression sonucu veya onaylı diff,
- ilgili component/version,
- reviewer/onay kaydı,
- breaking değişiklik varsa migration rehberi.

Ekran görüntüsünün tek başına eklenmesi yeterli değildir; story kimliği, viewport, theme, locale, fixture ve commit SHA yeniden üretilebilir olmalıdır.

## 8. Güncellenmesi gereken kanonik dokümanlar

Aşağıdaki dosyalarda Storybook kararı doğrudan normatif hale getirilmelidir.

| Öncelik | Dosya | Yapılacak güncelleme |
|---|---|---|
| P0 | `src/data/standards/ui-components.json` | Storybook'u tavsiye değil zorunlu Master Component sözleşme/evidence yüzeyi yap; story matrisi, master/local ayrımı, deprecated story ve visual review kural ID'leri ekle |
| P0 | `src/data/standards/design-system.json` | Token/theme/density değişikliklerinin Foundations story'leri ve visual regression ile kanıtlanmasını zorunlu yap |
| P0 | `docs/standards/13-testing-quality-standard.md` | Story interaction, a11y, static build ve visual regression katmanlarını test piramidine ve merge kapılarına ekle |
| P0 | `docs/enterprise-dod.md` | “Storybook opsiyonel” hükmünü kaldır; UI Surface ve Master Component için zorunlu evidence yap |
| P0 | `docs/standards/02-a11y-accessibility-standard.md` | Story başına axe, klavye, focus ve screen-reader test matrisi ekle; e2e'nin yerine geçmediğini belirt |
| P0 | `docs/ci-conformance-gates.md` | Storybook build/test/a11y/visual-diff kapısını; PASS/FAIL/NO_CANDIDATES/REVIEW_REQUIRED sonuçlarını ekle |
| P1 | `docs/surface-spec.md` | Her Surface'in kullandığı Master Component/story referanslarını ve Surface composition story'sini tanımla |
| P1 | `docs/surface-v2-directive.md` | Consumer/shop/custom yüzeylerin viewport, theme, i18n, reduced-motion ve fallback story zorunluluğunu ekle |
| P1 | `docs/task-to-code-contract.md` | UI component görevinde test-plan/development/test-qa/verification Storybook çıktısını ve evidence'ı tanımla |
| P1 | `docs/ready-for-dev-gate.md` | UI development adayı için story planı, component kind ve Storybook test komutu readiness alanlarını ekle |
| P1 | `docs/developer-guide.md` | Component geliştirme döngüsünü “red story test → component → Storybook review → E2E” olarak güncelle |
| P1 | `docs/release-policy.md` | Master Component semver, changelog, deprecation, baseline ve migration yayın politikasını ekle |
| P1 | `docs/evidence-taxonomy.md` | Storybook preview/test/a11y/visual diff kanıt türlerini ekle |
| P2 | `docs/panel-tier-contract.md` | Panel-tier örneklerinin doğrudan Master Component composition story'lerine bağlanmasını tanımla |
| P2 | `docs/platform-cust04-customer-ui-agent-pack-2026-07-09.md` | Customer UI teslimatına story, a11y, interaction ve visual evidence ekle |
| P2 | `docs/platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md` | Enterprise a11y kapısına component-story axe matrisi ekle |
| P2 | `docs/platform-w3-07-enterprise-dod-evidence-pack-agent-pack-2026-07-09.md` | Evidence pack'e yayınlanmış Storybook ve onaylı visual diff ekle |

## 9. Yalnız referans eklenmesi gereken dokümanlar

Bu dosyalar Storybook kurallarını tekrar yazmamalı; bu rapora ve kanonik standartlara referans vermelidir:

| Dosya | Referansın amacı |
|---|---|
| `docs/README.md` | UI/Storybook entegrasyon raporunu dizine eklemek |
| `docs/engineering-standards-index.md` | `ui-components`, `design-system`, testing ve Storybook bağını göstermek |
| `docs/waterfall-developer-handoff.md` | UI handoff evidence listesine Storybook URL'i eklemek |
| `docs/meta-framework-implementation-development-plan.md` | UI/component wave'lerinde Storybook foundation bağımlılığını göstermek |
| `docs/implementation-workspace-manifest.md` | Storybook çalışma/publish komutlarının implementation repo içinde yaşayacağını belirtmek |
| `docs/prompt-template-library.md` | UI ajan promptlarında Master Component/story/test/evidence zorunluluğuna referans vermek |

## 10. Yeni implementation artefaktları

Bu rapor dışında implementation reposunda aşağıdaki artefaktlar gerekecektir. Kesin yollar monorepo yapısına göre ADR ile kilitlenir.

```text
platform/
├── .storybook/
│   ├── main.*
│   ├── preview.*
│   ├── manager.*
│   └── test setup
├── packages/ui/
│   ├── src/components/**
│   ├── src/**/*.stories.*
│   ├── src/**/*.test.*
│   └── README.md
├── packages/tokens/
│   └── foundations stories
├── apps/storybook/ veya eşdeğer workspace
└── .github/workflows/
    └── storybook-ci.*
```

Gerekli komut aileleri:

- yerel Storybook geliştirme,
- statik Storybook build,
- story interaction testleri,
- story a11y testleri,
- visual regression upload/compare,
- preview publish,
- component coverage raporu.

Araç sürümleri bu belgede sabitlenmez; implementation lockfile ve ayrı toolchain ADR'si tek kaynak olur.

## 11. Sahiplik ve review

| Rol | Sorumluluk |
|---|---|
| Design-system owner | Master/local kararı, token ve variant sözleşmesi |
| Component owner | kaynak kod, stories, tests, changelog |
| Product designer | görsel/interaction review; yeni baseline gerekçesi |
| Accessibility reviewer | klavye, screen-reader, axe ve focus review |
| QA | interaction, visual ve E2E kapsam paritesi |
| Product/Surface owner | gerçek kullanım senaryosu ve acceptance criteria |
| Release owner | preview evidence, semver ve migration kontrolü |

AI ajan platformda story, component, test, config veya visual baseline üretemez. AI yalnız actionplan içinde insan geliştirici için Master/local kararı, story matrisi, test planı ve evidence handoff'u yazar; ürün kodu `human-developer-only`dır (`docs/platform-product-code-write-prohibition-directive.md`).

## 12. Anti-patterns

- Storybook'u yalnız component galerisi olarak kullanmak.
- Kaynak component yerine story içinde ikinci bir implementation yazmak.
- Yalnız happy-path/default story üretmek.
- Visual diff'i incelemeden baseline güncellemek.
- Story fixture'ında gerçek PII, finansal sır veya production verisi kullanmak.
- Story pass ettiği için Surface E2E testini atlamak.
- Product-specific kuralı ortak Master Component içine gömmek.
- Her local component'i zorla Master Component yapmak.
- Theme ve tenant farklarını hardcoded story kopyalarıyla çoğaltmak.
- Accessibility addon sonucunu uyarı olarak bırakmak.
- Deprecated component'i katalogdan sessizce silmek.

## 13. Sıralı uygulama planı

### Wave SB-0 — Karar ve sınır

- Master Component tanımını insan onayıyla kilitle.
- Storybook'un zorunlu evidence yüzeyi olduğunu kanonik standartlara işle.
- Master/local/Pattern/Surface taksonomisini kilitle.

### Wave SB-1 — Toolchain foundation

- Implementation reposunda Storybook workspace/config kur.
- Token, theme, viewport, locale ve RTL decorator'larını tanımla.
- Static build ve preview publish CI'ını kur.

### Wave SB-2 — Test kapıları

- Interaction ve a11y runner'ı bloklayıcı yap.
- Visual regression sağlayıcısını vendor-neutral sözleşmeyle bağla.
- PASS/FAIL/NO_CANDIDATES/REVIEW_REQUIRED durumlarını CI'a ekle.

### Wave SB-3 — İlk Master Components

- Button, IconButton, FormField, Input, Select, Dialog gibi primitives.
- Ardından data-yoğun ürün için DataTable/DataGrid, FilterBar, MoneyInput ve MetricCard.
- Her biri tam story matrisi ve evidence ile kapanır.

### Wave SB-4 — Pattern ve Surface composition

- Search/filter, bulk actions, approval, import review, error recovery pattern'leri.
- List/table/board/dashboard/report Surface story'leri.
- Gerçek E2E ile story coverage parity kontrolü.

### Wave SB-5 — Release governance

- Semver/changelog/deprecation/migration akışı.
- Component adoption ve duplicate component denetimi.
- Story coverage ve visual drift dashboard'u.

## 14. Kabul kriterleri

Bu karar aşağıdaki koşullar birlikte sağlandığında uygulanmış sayılır:

1. `ui-components` ve `design-system` standartları Storybook zorunluluğunu normatif olarak taşır.
2. Enterprise DoD içindeki “opsiyonel Storybook” hükmü kaldırılmıştır.
3. Her Master Component tipli API, zorunlu state matrisi ve owner/reviewer taşır.
4. Storybook static build CI'da bloklayıcıdır.
5. Interaction ve story-level a11y testleri bloklayıcıdır.
6. Visual diff ya geçer ya da insan tarafından gerekçeli onaylanır.
7. Responsive, theme, locale, RTL ve reduced-motion fixture'ları merkezi decorator'lardan gelir.
8. UI task evidence'ında Storybook preview/test/a11y/visual kayıtları bulunur.
9. Storybook testleri E2E yerine kullanılmaz; Surface yolculukları ayrıca geçer.
10. Deprecated Master Component replacement ve migration story'si olmadan silinmez.

## 15. Nihai hüküm

Mevcut dokümanlarda Storybook izleri vardır fakat yönetişim seviyesi yetersizdir: `ui-components` bazı state ve viewport kontrollerini Storybook'a bağlar, `enterprise-dod` ise Storybook'u opsiyonel sayar. Yeni karar bu çelişkiyi kapatmalıdır.

Kuralın tek-kaynak yerleşimi şöyle olmalıdır:

- Component davranışı: `src/data/standards/ui-components.json`
- Token/theme davranışı: `src/data/standards/design-system.json`
- Test kapıları: `docs/standards/13-testing-quality-standard.md` ve `docs/ci-conformance-gates.md`
- A11y: `docs/standards/02-a11y-accessibility-standard.md`
- Enterprise tamamlanma: `docs/enterprise-dod.md`
- Surface composition: `docs/surface-spec.md` ve `docs/surface-v2-directive.md`
- Uygulama/entegrasyon haritası: bu `docs/storybook-implementation.md` raporu

Storybook bütün UI sürecinin zorunlu çalışma ve kanıt yüzeyi olmalıdır; fakat component kaynak kodunun, ürün E2E testinin veya insan review'unun yerine geçmemelidir.
