# Storybook + Master Component — Metaframer Bütünsel Entegrasyon Yönergesi

**Tarih:** 2026-07-12  
**Hedef uygulayıcı:** İnsan geliştirici; AI yalnız `DIRECTIVE-ONLY` handoff üretir  
**Proje:** `metaframer` · marka: meta-framer · teknik sınıf: meta-framework  
**Yetki:** İnsan tarafından verilen bütünsel Storybook entegrasyon görevi.  
**Kapsam:** `actionplan` tanım/sözleşme/QA yüzeyi ve AI için salt-okunur `platform` gerçeklik kontrolü. Platform erişimi `read-only-audit`, ürün kodu yazarı `human-developer-only`dır (`docs/platform-product-code-write-prohibition-directive.md`).

## 0. Görev emri

Metaframer'da frontend veya UI etkisi bulunan her iş, codebase ve içerik tarafından otomatik fark edilen, makine-okunur Storybook yükümlülüğüne bağlanacaktır. Bu yükümlülük yalnız `CLAUDE.md`, `TODO.md`, prompt veya ADR metni olmayacaktır.

Storybook + Master Component anlayışını aşağıdaki katmanlara birlikte entegre et:

1. ürün felsefesi ve terminoloji,
2. app→micro_step WBS/doğa metaforu zinciri,
3. Atom→Fragment→ArcheType→Surface üretim zinciri,
4. TaskNode ve ilgili şemalar,
5. standart referansları ve uygulanabilirlik,
6. task exportları ve agent promptları,
7. waterfall fazları,
8. Definition of Ready/Done,
9. evidence taksonomisi,
10. CI/conformance kapıları,
11. developer workflow,
12. release ve deprecation yönetimi.

Backend-only, veri migration-only, altyapı-only ve kullanıcı yüzeyi üretmeyen işler Storybook'a zorla bağlanmayacaktır. Ancak “backend” etiketi tek başına N/A gerekçesi değildir: API sözleşmesi UI fixture, error state, permission state veya generated Surface'i etkiliyorsa Storybook etkisi vardır.

## 1. Değişmez ilkeler

### 1.1 Storybook bir galeri değil, UI sözleşme motorudur

Storybook şu beş rolü birlikte taşır:

- Master Component kataloğu,
- çalıştırılabilir UI sözleşmesi,
- interaction/a11y/visual test fixture'ı,
- insan review yüzeyi,
- yeniden üretilebilir evidence kaynağı.

### 1.2 Kaynak kod tek doğruluk kaynağıdır

Component kodu implementation reposundaki UI paketinde yaşar. Story kaynak kodun ikinci kopyasını barındıramaz. Story, gerçek export'u tüketir. Story içinde paralel component implementation yazmak yasaktır.

### 1.3 Master Component kararı açık olmalıdır

Her UI component işi şu sınıflardan tam birini seçer:

- `master`: ürünler/Surface'ler arasında tüketilen kanonik component,
- `pattern`: birden çok Master Component'in tekrar-kullanılabilir kompozisyonu,
- `surface-composition`: belirli Surface sözleşmesinin component bileşimi,
- `local`: yalnız tek feature/Surface içinde yaşayan ve Master API sözü vermeyen component,
- `none`: UI çıktısı yok; gerekçeli N/A.

`local` seçimi Storybook'tan otomatik muafiyet değildir. Karmaşık state, a11y, permission veya data-density davranışı varsa local component de story taşır. `master` seçimi ise tam Master Component sözleşmesini zorunlu kılar.

### 1.4 Storybook E2E'nin yerine geçmez

Story interaction testi component/pattern davranışını; Playwright E2E gerçek Surface ve kullanıcı yolculuğunu kanıtlar. Biri diğerini iptal edemez.

### 1.5 İlgisiz backend pragmatik biçimde N/A kalır

UI etkisi olmayan işte Storybook alanı `applies: false` ve somut gerekçe taşır. Jenerik “backend işi” gerekçesi kabul edilmez. Doğru gerekçe örneği: “Bu micro_step yalnız append-only audit index migration'ını değiştirir; API shape, hata sözleşmesi, permission projection veya Surface çıktısı değişmez.”

## 2. UI etki sınıflandırıcısı

Her görev için önce `uiImpact` hesaplanmalıdır:

| Değer | Anlam | Storybook sonucu |
|---|---|---|
| `none` | UI, Surface, API projection veya kullanıcı mesajı etkilenmez | gerekçeli N/A |
| `indirect` | API/error/permission/schema değişimi UI fixture veya state'i etkiler | ilgili consumer story güncellenir |
| `direct` | görünür UI/pattern/Surface davranışı değişir | story + interaction/a11y zorunlu |
| `master-component` | ortak component API/state/token değişir | tam Master Component matrisi zorunlu |
| `surface` | bir Surface kompozisyonu veya kullanıcı yolculuğu değişir | composition story + E2E zorunlu |

### 2.1 Codebase sinyalleri

Sınıflandırıcı en az şu sinyalleri inceler:

- `*.tsx`, `*.jsx`, `*.scss`, token/theme dosyaları,
- component/UI package yolları,
- `*.stories.*`, component testleri ve Storybook config,
- Surface schema veya render kodu,
- form, table, grid, board, chart, dialog, navigation, permission editor,
- kullanıcıya gösterilen error/empty/loading mesajları,
- GraphQL/OpenAPI alanı veya enum değişimi,
- access policy'nin hidden/readonly/disabled projection'ı,
- i18n message, locale, RTL veya formatting değişimi,
- responsive, motion, a11y veya interaction davranışı.

### 2.2 İçerik/WBS sinyalleri

TaskNode ve doküman tarafında en az şu sinyaller incelenir:

- `level`, `tags`, `summary`, `deliverables`, `acceptanceCriteria`,
- `dimensions.mobileApps`, `dimensions.wcag`, `dimensions.featureDefs`,
- `standardRefs.designSystemRef`, `uiComponentRef`, `uxStandardRef`,
- Surface/ArcheType/Fragment/atom referansları,
- frontend tech profile veya `renderStrategy`,
- user story, form, görünüm, ekran, panel, dashboard, report, board ifadeleri,
- field type `surfaceProjection` değişiklikleri.

### 2.3 Öncelik ve çelişki kuralı

Codebase ve içerik sınıflandırması farklı sonuç verirse daha yüksek UI etkisi geçici olarak kazanır ve insan review'u ister. Örnek: görev “backend validator” etiketli fakat hata kodu/form field mapping değiştiriyorsa `indirect` kabul edilir.

## 3. Makine-okunur UI delivery sözleşmesi

TaskNode veya ona bağlı tek-kaynak registry'de aşağıdaki sözleşmeyi tanımla. Kesin şema adı repo terminolojisiyle hizalanabilir; alan anlamları korunmalıdır.

```ts
uiDelivery: {
  impact: "none" | "indirect" | "direct" | "master-component" | "surface";
  applies: boolean;
  reason: string;
  componentKind: "master" | "pattern" | "surface-composition" | "local" | "none";
  masterComponentRefs: string[];
  storyRefs: string[];
  requiredStoryStates: string[];
  requiredViewports: string[];
  requiredLocales: string[];
  requiredThemes: string[];
  interactionTestRefs: string[];
  a11yTestRefs: string[];
  visualEvidenceRefs: string[];
  e2eRefs: string[];
  storybookUrl: string | null;
  reviewStatus: "not-required" | "planned" | "in-review" | "approved" | "rejected";
  reviewer: string | null;
}
```

Kurallar:

- `applies=false` ise `impact=none`, `componentKind=none`, `reason` dolu olmalıdır.
- `impact!=none` ise story veya consumer-story bağı zorunludur.
- `master-component` ise `componentKind=master` ve tam story state matrisi zorunludur.
- `surface` ise en az bir composition story ve bir E2E ref zorunludur.
- `indirect` ise değişen API/error/permission sözleşmesini tüketen story ref zorunludur.
- `reviewStatus=approved` reviewer ve Storybook evidence olmadan geçersizdir.
- Gerçek URL/CI evidence yoksa `storybookUrl` uydurulmaz.
- Kapsam risk-temellidir: `requiredStoryStates` çekirdek davranış state'lerinde exhaustive, presentation eksenlerinde pairwise/representative okunur; kombinasyon bütçesi ve ek governance alanları (riskClass, coverageBudget, fixtureContract, baselineGovernance, securityLinkage, manualA11yReviewRef, performanceProfileRef, breakGlass, ownerRef, dataDense) docs/storybook-governance-pack.md ile tanımlanmıştır.

Geriye uyumluluk: mevcut düğümler lazy/default parse olabilir; ancak UI-impact adayları yürütmeye açıldığında tam sözleşme readiness kapısıyla zorlanır. Sıfır aday `PASS` değil `NO_CANDIDATES` olmalıdır.

## 4. Doğa metaforlarına entegrasyon

Storybook yükümlülüğü her seviyede aynı değildir. Üst seviyeye component story doldurmak, alt seviyeye ürün stratejisi kopyalamak yasaktır.

| Teknik seviye | Metafor | Storybook/Master Component sorumluluğu |
|---|---|---|
| `app` | Ada | ürün UI ilkeleri, theme/density profili, kullanılacak Master Component katalog sürümü, Surface aileleri |
| `module` | Dağ | domain UI sınırı, component/pattern sahipliği, başka modüllerden tüketilen Master Component bağı |
| `archetype` | Kaya | field→widget projection, form/list/detail Surface haritası, permission ve lifecycle state story'leri |
| `feature` | Taş | kullanıcı yolculuğu, pattern seçimi, interaction senaryosu ve composition story kapsamı |
| `component` | Kum | master/pattern/local kararı, props/state/token/a11y sözleşmesi ve story matrisi |
| `work_unit` | Molekül | tek interaction, hook, state transition veya visual davranış testi |
| `micro_step` | Atom | tek story, tek test vektörü, tek token/state düzeltmesi veya gerekçeli UI N/A |

### 4.1 Roll-up kuralı

Atom ve Molekül evidence'ı üst Kum/Taş story paketine; Kum/Taş evidence'ı Kaya Surface composition'a; Kaya evidence'ı Dağ/Ada UI release paketine roll-up olur. Aynı screenshot veya kural her seviyeye kopyalanmaz, referanslanır.

## 5. Atom altı üretim varlıklarına entegrasyon

WBS `micro_step` ile atomik değer tipi karıştırılmamalıdır. Storybook entegrasyonu iki eksende uygulanır.

### 5.1 Atomik değer tipi

Her atomik değer tipinin `surfaceProjection` boyutu şu bağı taşır:

- kullandığı Master Component/widget ref,
- valid/invalid/empty/unknown/N-A/readonly/disabled story'leri,
- locale/format örnekleri,
- maskeli/izinli güvenlik görünümü,
- backend/frontend contract fingerprint paritesi.

Örnek: `Money` atomu yalnız “MoneyInput kullanır” demez; currency mismatch, precision, zero/null, readonly, permission-masked ve locale format story'lerine bağlanır.

### 5.2 Fragment

Fragment story'si atom widget'larını kompoze eder ve cross-field davranışı gösterir:

- Address: country→postal-code doğrulaması,
- ContactPoint: kind→value widget seçimi,
- PersonName: locale'e göre alan sırası.

Fragment kendi bağımsız resource/CRUD Surface'ini uydurmaz; kimliksiz composite field story'sidir.

### 5.3 ArcheType

ArcheType aşağıdaki composition story'lerini üretir veya referanslar:

- create/edit form,
- list/table row,
- detail/read-only,
- loading/empty/error,
- lifecycle states,
- permission projections,
- validation summary,
- optimistic/conflict state,
- dense-data variant uygulanıyorsa compact görünüm.

### 5.4 Surface

Surface story'si gerçek Master Component'leri ve ArcheType fixture'larını kompoze eder. Surface story, kullanıcı yolculuğu E2E'sinin yerine geçmez; E2E'nin fixture ve review ön-yüzüdür.

## 6. Master Component yaşam döngüsü

```text
candidate
→ local proof
→ master proposal
→ API/state/a11y review
→ stories + tests
→ visual approval
→ stable
→ deprecated
→ retired
```

Kurallar:

- İlk tekrar kullanım sinyalinde component otomatik Master yapılmaz; API ve ownership review gerekir.
- Aynı davranışın ikinci/üçüncü kopyası duplicate-component uyarısı üretir.
- Master Component breaking change semver, changelog ve migration story ister.
- Deprecated component katalogda replacement ve migration örneğiyle görünmeye devam eder.
- Retire, consumer kullanım sayısı sıfır ve migration tamamlandıktan sonra yapılır.
- AI Master Component önerebilir; insan design-system owner onayı olmadan stable/publish yapamaz.

## 7. Waterfall faz entegrasyonu

| Faz | UI/Storybook zorunluluğu |
|---|---|
| requirements | UI impact ve componentKind sınıflandırması; Master/local kararı; non-goals |
| test-plan | story matrisi, interaction/a11y/visual testleri, fixture ve viewport/locale/theme seti |
| db-schema | API/field/enum değişiminin story fixture ve projection etkisi |
| development | kırmızı story/interaction testi → component → yeşil → refactor |
| test-qa | static build, interaction, axe, visual diff ve E2E parity |
| verification | yayınlanmış preview, insan review ve yeniden üretilebilir evidence |
| release-maintenance | version/changelog/deprecation/migration ve consumer adoption kontrolü |

## 8. Definition of Ready

UI etkili bir görev aşağıdakiler olmadan development'a geçemez:

1. `uiImpact` sınıflandırması,
2. master/pattern/surface/local kararı,
3. allowed-files,
4. story path/ref planı,
5. pozitif ve negatif interaction senaryosu,
6. uygulanabilir state matrisi,
7. a11y beklentisi,
8. viewport/locale/theme fixture kapsamı,
9. visual diff beklentisi,
10. owner ve bağımsız reviewer.

Backend-only görevde `uiImpact=none` ve gerekçe yeterlidir; boş Storybook alanları doldurulmaz.

## 9. Definition of Done

UI etkili görev şu kanıtlar olmadan done olamaz:

- gerçek component export'unu tüketen story,
- ilgili interaction testleri,
- story-level axe sonucu,
- kasıtlı görsel değişiklikte onaylı visual diff,
- responsive/locale/theme kapsamı,
- Surface etkisi varsa E2E,
- Storybook preview URL'i veya yerel evidence yolu,
- component/version/changelog,
- reviewer onayı,
- evidence roll-up.

`uiImpact=none` görevde Storybook DoD aranmaz; fakat sınıflandırma kapısı gerekçeyi doğrular.

## 10. Güncellenecek şema, standart ve dokümanlar

### 10.1 Normatif değişiklik yapılacaklar

| Dosya | Entegrasyon |
|---|---|
| `src/schemas/task.ts` veya kardeş UI-delivery şeması | makine-okunur `uiDelivery` sözleşmesi |
| `src/schemas/archetype.ts` | atom/Fragment/ArcheType widget ve story ref bağları |
| `src/schemas/surface.ts` | Master Component/composition story/evidence refs |
| `src/data/standards/ui-components.json` | Master Component ve zorunlu Storybook kuralları |
| `src/data/standards/design-system.json` | Foundations/theme/token visual evidence |
| `src/data/standards/testing-strategy.json` | story interaction/a11y/visual test katmanları |
| `src/data/standards/quality-gates.json` | Storybook build/test/diff merge kapıları |
| `docs/enterprise-dod.md` | opsiyonel Storybook hükmünü zorunlu hale getirme |
| `docs/standards/02-a11y-accessibility-standard.md` | story-level axe/keyboard/focus matrisi |
| `docs/standards/13-testing-quality-standard.md` | test piramidi ve CI sırası |
| `docs/task-to-code-contract.md` | WBS seviye/faz Storybook teslimatı |
| `docs/ready-for-dev-gate.md` | UI-impact DoR |
| `docs/surface-spec.md` | Surface→Master Component→story bağı |
| `docs/surface-v2-directive.md` | consumer/shop/custom story matrisi |
| `docs/evidence-taxonomy.md` | Storybook/visual/a11y evidence türleri |
| `docs/release-policy.md` | Master Component semver/deprecation/migration |
| `docs/ci-conformance-gates.md` | UI relevance ve Storybook kapısı |

### 10.2 Referans/iş akışı güncellemesi yapılacaklar

- `AGENTS.md`
- `CLAUDE.md` varsa
- `docs/developer-guide.md`
- `docs/waterfall-developer-handoff.md`
- `docs/prompt-template-library.md`
- `docs/task-export-contract.md`
- `docs/implementation-workspace-manifest.md`
- `docs/meta-framework-implementation-development-plan.md`
- ilgili UI agent pack'leri
- `docs/README.md` ve engineering standards index

Bu ikinci gruba kural metni kopyalama; kanonik kaynaklara referans ve workflow adımı ekle.

## 11. Task export ve ajan prompt entegrasyonu

Developer Brief, Agent Prompt ve Vobecoder Card UI etkili görevlerde şunları göstermelidir:

- UI impact ve gerekçesi,
- componentKind,
- Master Component refs,
- story/test/evidence beklentisi,
- story path ve allowed-files,
- backend/frontend contract parity,
- insan review gereği.

UI etkisi yoksa export açıkça `Storybook: N/A — <somut gerekçe>` yazmalıdır. Alanı sessizce boş bırakma.

Prompt üretici, “frontend”, “UI”, “Surface”, “component”, “form”, “table” kelimesi gördüğünde kör biçimde Storybook eklememelidir. §2 sınıflandırıcısını çalıştırmalı ve sonucu prompta taşımalıdır.

## 12. CI ve conformance kapısı

Yeni veya genişletilmiş kapı şu denetimleri yapmalıdır:

1. UI etkili task'ta `uiDelivery` tam mı?
2. Master Component source export'u ve story'si bire bir bağlı mı?
3. Zorunlu state story'leri var mı?
4. Story gerçek component'i import ediyor mu?
5. Interaction testleri geçiyor mu?
6. Axe ihlali var mı?
7. Visual diff onaylı mı?
8. Surface etkisinde E2E ref var mı?
9. Deprecated component replacement/migration taşıyor mu?
10. Backend-only N/A gerekçesi gerçekten UI etkisiz mi?

Sonuçlar:

- `PASS`
- `FAIL`
- `NO_CANDIDATES`
- `REVIEW_REQUIRED`

Ek sinyal taksonomisi (8 sinyal) ve bloklama/warning sınıflandırması docs/storybook-governance-pack.md §13'tedir.

Sıfır UI adayı olan backend PR'ı başarısız olmamalıdır. UI etkili aday bulunup story bulunamazsa kapı kırılmalıdır.

## 13. Migration ve ratchet stratejisi

Mevcut yüzlerce düğümü tek seferde jenerik Storybook metniyle doldurma. Aşamalı ratchet uygula:

### R0 — Şema ve sınıflandırıcı

- `uiDelivery` şeması,
- UI impact sınıflandırıcısı,
- `NO_CANDIDATES` desteği,
- negatif fixture testleri.

### R1 — Yeni ve değişen UI işleri

- Bu tarihten sonra eklenen/değişen UI-impact düğümlerinde tam sözleşme zorunlu.
- Dokunulmayan legacy düğümler warning/backlog olarak kalır.

### R2 — Master Component kritik yolu

- Token, Button, FormField, Input, Select, Dialog, DataTable/DataGrid, FilterBar.
- Duplicate component taraması ve adoption map.

### R3 — Surface zinciri

- List/table/board/dashboard/report.
- ArcheType projection ve E2E parity.

### R4 — Legacy kapanış

- UI-impact legacy düğümlerin tamamı tanımlı.
- Warning sayısı sıfır; ratchet hard-fail olur.

## 14. Test-önce zorunlu senaryolar

Önce aşağıdaki kırmızı testleri yaz:

1. UI etkili task `uiDelivery` olmadan reddedilir.
2. Backend-only task somut N/A gerekçesiyle geçer.
3. “backend” etiketli fakat error schema değiştiren task `indirect` olur.
4. Master Component state matrisi eksikse reddedilir.
5. Surface composition E2E ref olmadan reddedilir.
6. `approved` review reviewer/evidence olmadan reddedilir.
7. Story içinde sahte local implementation tespit edilir.
8. Deprecated component replacement olmadan reddedilir.
9. Sıfır UI adayı `NO_CANDIDATES` verir.
10. Legacy warning sayısı ratchet baseline'ını aşamaz.

Testler kırmızı görülmeden şema/gate implementasyonuna geçme.

## 15. Stop koşulları

Aşağıdaki durumda çalışmayı durdur ve blocker raporu ver:

- Kanonik dosya ile bu yönerge çelişiyorsa,
- UI component implementation repo/yolu doğrulanamıyorsa,
- Storybook config gerçekte yokken varmış gibi evidence isteniyorsa,
- visual regression sağlayıcısı insan kararı gerektiriyorsa,
- dirty worktree'de aynı kanonik dosyalara ait kullanıcı değişikliğiyle çakışma varsa,
- değişiklik kanonik paket bütçesini (`src/data/standards/short-code.json#changePackageBudget`) aşıyorsa atomik PR dalgalarına bölmeden ilerleme,
- platform ürün kodu actionplan repo içine yazılmak üzereyse.

Blocker olduğunda hayali URL, story, test, CI veya component üretme.

## 16. Claude için zorunlu directive üretim sırası

1. `AGENTS.md` ve kanonik standartları oku.
2. `git status` ile kullanıcı değişikliklerini ayır.
3. Storybook izlerini ve mevcut implementation checkout'unu salt-okunur doğrula.
4. Etkilenecek dosyaları normatif/referans/implementation olarak sınıflandır.
5. Küçük PR dalgalarını ve allowed-files listesini çıkar.
6. İnsan geliştiricinin yazacağı kırmızı şema/gate testlerini dosya/assertion/failure reason olarak tanımla.
7. `uiDelivery` sözleşmesi ve relevance classifier için insan implementation adımlarını yaz.
8. UI standardı/testing/DoD/Surface sözleşmesi değişikliklerini actionplan kapsamında güncelle; platforma yazma.
9. Task export ve prompt directive bağını kur.
10. İnsan geliştiricinin ekleyeceği CI kapısını tarif et; `NO_CANDIDATES` ve `REVIEW_REQUIRED` senaryolarını yaz.
11. Legacy ratchet raporu üret.
12. İlgili bütün QA kapılarını çalıştır.
13. Kapanan/açık gap'leri ve gerçek implementation blocker'larını raporla.

## 17. Beklenen teslimatlar

En az şu artefaktlar beklenir:

- makine-okunur UI delivery şeması,
- UI impact classifier,
- Storybook readiness/conformance gate,
- negatif fixture testleri,
- güncellenmiş UI/design/testing/DoD/Surface sözleşmeleri,
- güncellenmiş task export/prompt akışı,
- Storybook evidence türleri,
- legacy UI-impact audit/ratchet raporu,
- küçük PR dalga planı,
- gerçek doğrulama çıktıları.

## 18. Definition of Done

Bu entegrasyon aşağıdakilerin tamamı gerçekleşmeden bitmiş sayılmaz:

- UI etkisi codebase ve içerikten makinece sınıflanıyor.
- Backend-only iş gerekçeli N/A geçebiliyor.
- UI etkili iş Storybook sözleşmesi olmadan development'a geçemiyor.
- App→Atom zincirinde seviye-uygun Storybook sorumluluğu var.
- Atom→Fragment→ArcheType→Surface projection zinciri story refs taşıyor.
- Master/local/pattern/surface ayrımı makine-okunur.
- UI task exportları Storybook beklentisini taşıyor.
- Interaction/a11y/visual/E2E rolleri ayrılmış.
- Storybook build ve conformance kapısı CI'da çalışıyor.
- Evidence yeniden üretilebilir ve insan review'a bağlı.
- Legacy entegrasyon ratchet ile ölçülüyor.
- Storybook ilgisiz backend'e zorla uygulanmıyor.
- Doküman yeşili, çalışan Storybook varmış gibi yorumlanmıyor.

## 19. Claude'a verilecek kısa çalışma promptu

```text
AGENTS.md ve docs/storybook-master-component-integration-directive.md bağlayıcıdır.

DIRECTIVE-ONLY. Platformu yalnız read-only-audit et. Platform component/story/test/config,
branch, commit veya PR üretme. Ürün kodunu yalnız insan geliştirici yazar.

Metaframer'a Storybook + Master Component anlayışını bütünsel olarak entegre et. Bunu yalnız CLAUDE.md/TODO/ADR metni ekleyerek yapma. UI etkisini codebase ve TaskNode içeriğinden makinece sınıflandır; UI-impact işler için tipli uiDelivery sözleşmesi, app→micro_step roll-up, Atom→Fragment→ArcheType→Surface story bağı, task export entegrasyonu, readiness/DoD/evidence ve CI conformance kapısı oluştur. Backend-only işleri somut gerekçeyle N/A bırak.

Önce salt-okunur gerçeklik denetimi ve insan için küçük PR dalga planı yap. Kırmızı negatif fixture → şema/classifier → kapılar → platform QA sırasını kod olarak uygulama; dosya, assertion, acceptance ve komutları directive olarak tanımla. Kullanıcı değişikliklerine dokunma. Storybook veya platform implementation mevcut değilse varmış gibi URL/evidence üretme.

Bitişte: değişen dosyalar, testler, PASS/FAIL/NO_CANDIDATES/REVIEW_REQUIRED sonuçları, legacy ratchet sayımı, kapanan gap'ler ve gerçek implementation blocker'ları.
```

## 20. Nihai hüküm

Storybook entegrasyonu bir araç kurulumu değil, UI teslimat ontolojisidir. Metaframer'ın doğru pragmatik modeli şudur:

```text
UI etkisini fark et
→ seviyesini ve component türünü sınıflandır
→ Master Component/Pattern/Surface sözleşmesine bağla
→ story + interaction + a11y + visual evidence üret
→ E2E ile gerçek yolculuğu doğrula
→ evidence'ı WBS zincirinde roll-up et
```

UI etkisi yoksa:

```text
UI etkisi yok
→ somut N/A gerekçesi
→ Storybook yükümlülüğü yok
```

Bu ayrım korunmadığında ya Storybook formaliteye dönüşür ya da backend işlerine gereksiz yük bindirir. Entegrasyonun başarısı, UI işlerinin kaçamaması ve ilgisiz işlerin gereksiz yere zorlanmamasıyla ölçülür.
