# Metaframer Kayıt Mimarisi — “Node” Sonrası Kanonik Model

**Tarih:** 2026-07-12 · **Revizyon:** v1.3 — ürün-katmanı URL kararları bu dosyadan çıkarılmış ve tek kanonik otorite `docs/url-policy.md` olarak kilitlenmiştir  
**Durum:** Codebase + JSON content-base üzerinden doğrulanmış mimari rapor  
**İncelenen kapsam:** `src/data`, 467 generated JSON, Zod şemaları, ingest/reindex zinciri, runtime store, route/export sistemi, standalone cataloglar, docs/reports ve Storybook registry taslakları; §14 için ayrıca `l1-redirect`/`l1-seo`/`l1-pseo` düğümleri ve `c13n` standardı

---

## 0. Nihai karar

Metaframer, Drupal'ın “her şey node” modelini kopyalamamalıdır. Bugünkü `TaskNode` da yalnız yeniden adlandırılmamalı; önce içerdiği birbirinden farklı kayıt türlerine ayrılmalıdır.

Kanonik sözlük:

```text
Ortak protokol        AddressableRecord
WBS/teslimat kaydı    PlanRecord
Mimari karar          DecisionRecord
Tek-kaynak sözleşme   DefinitionRecord alt türleri
Eğitim içeriği        GuideRecord
Öneri/aday içerik      ProposalRecord
Örnek/demonstrasyon   ExampleRecord
Kanıt                 EvidenceRecord
Graph algoritması     GraphVertex
GraphQL Relay         RelayNode
DOM                   DomNode
Node.js               NodeRuntime
```

Kullanıcıya ve LLM'e en sık gösterilecek keyword:

> **`record`**, bağlam biliniyorsa daima tipli biçimi: `planRecord`, `decisionRecord`, `surfaceDefinition`, `evidenceRecord`.

`MetaRecord` önceki raporda önerilmişti. Codebase incelemesinden sonra ortak tip için **`AddressableRecord` daha güvenli** bulunmuştur: “meta” kelimesi metadata kaydı veya recursive meta-model sanılabilir; `AddressableRecord` ise neden ortak zarf bulunduğunu açık söyler. Marka dili gerekiyorsa UI'da “Metaframer Kaydı” denebilir, fakat kod tipi `AddressableRecord` olmalıdır.

URL kararı:

```text
/plans/<stable-id>
/decisions/<stable-id>
/standards/<stable-id>
/definitions/archetypes/<stable-id>
/definitions/surfaces/<stable-id>
/guides/<stable-id>
/evidence/<stable-id>

# universal resolver; paylaşım/foreign reference için
/records/<record-kind>/<stable-id>
```

Yasak biçim:

```text
/node/1
/node/2
```

Numeric primary key URL'de kanonik kimlik değildir. Mevcut `/task/<id>` rotası migration süresince alias/redirect olarak korunmalıdır.

---

## 1. Repo gerçekliği: “node” bugün ne demek?

### 1.1 Çalışan veri zinciri

Bugünkü ana zincir şöyledir:

```text
projector/content-source + oldatas
              ↓ tools/ingest/index.mjs
src/data/generated/nodes/<id>.json
              ↓ tools/reindex.mjs
 ┌──────────────────────┬────────────────────────┬────────────────────┐
 │ generated/index.json │ generated/navigation   │ generated/meta.json│
 └──────────────────────┴────────────────────────┴────────────────────┘
              ↓
public/data/nodes.json
              ↓ fetch + TaskNodeSchema.safeParse
taskStore.nodes / taskStore.index / WBS tree / graph / board / table
              ↓
/task/<taskId> + export artefact'ları
```

Bu zincirde “node” üç rolü aynı anda taşır:

1. WBS ağacındaki vertex,
2. planlama uygulamasının düzenlenebilir satırı,
3. geliştirici/ajan için doküman ve uygulama sözleşmesi.

Bu üç rol aynı değildir. Ortak JSON kabında bulunmaları bugünkü terminoloji borcunun kaynağıdır.

### 1.2 Codebase bağımlılık yüzeyi

Ölçülen kullanım:

| Bağımlılık | Ölçüm |
|---|---:|
| `TaskNode` kullanan source/test/tool dosyası | 48 |
| `TaskNodeSchema` kullanan dosya | 23 |
| TS/TSX içinde yaklaşık `node/nodes/nodeId` kullanımı | 411 satır |
| `/task` veya `taskId` kullanımı | 172 satır |
| `nodes.json` / `generated/nodes` kullanımı | 86 satır |

Bu nedenle isim değişikliği basit search/replace değildir. Engine fonksiyonları kritik yol, workload, gantt, bulk edit, persistence, import/export ve graph işlemleri yapıyor. Her biri yalnız `PlanRecord` kabul etmelidir; Standard veya Archetype Definition yanlışlıkla bu engine'e verilmemelidir.

### 1.3 Şema sürümü drift'i

Gerçek bir migration problemi de vardır:

- `src/schemas/task.ts`: `SCHEMA_VERSION = 1.1.0`
- 467 JSON'un tamamı: `schemaVersion = 1.0.0`
- ingest: `1.0.0`
- reindex/meta: `1.0.0`

Şema alanları default ile parse edildiği için test geçebilir; ancak dosya sürümü ile runtime kontratı aynı değildir. Yeni kayıt mimarisi bu drift'i miras almamalıdır.

---

## 2. 467 JSON gerçekte tek tür değil

### 2.1 Seviye dağılımı

| Level | Sayı |
|---|---:|
| `app` | 28 |
| `module` | 178 |
| `archetype` | 105 |
| `feature` | 101 |
| `component` | 18 |
| `work_unit` | 18 |
| `micro_step` | 19 |
| **Toplam** | **467** |

Bu tablo tek başına gerçek WBS olduğunu kanıtlamaz. Semantik dağılım daha önemlidir.

### 2.2 Köken dağılımı

| `source.corpus` | Sayı | Yorum |
|---|---:|---|
| `content-source` | 336 | Eski sayfa/içerik corpusundan dönüştürülmüş |
| `synthetic` | 118 | Generator veya sonraki araçlarla sentezlenmiş |
| `oldatas` | 13 | Eski veri corpusundan kalmış |

Ingest'in ilk yaklaşımı bir sayfanın `granularity` değerini doğrudan WBS `level`ına çevirir. Bir dokümanın “dağ” etiketli olması onu otomatik olarak yürütülebilir Module planı yapmaz.

### 2.3 Aynı kabın içindeki semantik aileler

Doğrudan ölçülebilen cohortlar:

| Cohort | Sayı | Doğru hedef tür |
|---|---:|---|
| `adr-*` mimari kararları | 25 | `DecisionRecord` |
| Başlığı açıkça örnek olan doğa kırılımları | 59 | `ExampleRecord` |
| `edu` + `egitim` cluster'ı | 37 | `GuideRecord` veya doküman |
| `aday` cluster'ı | 36 | `ProposalRecord` |
| `platform-factory` cluster'ı | 13 | Büyük ölçüde gerçek `PlanRecord` |
| Traceability taşıyan kayıt | 41 | PlanRecord adayı; yine insan sınıflaması gerekir |
| App kökleri | 28 | `PlanScopeRecord`; yürütülebilir task değildir |

Bu cohortlar kısmen çakışabilir; toplam olarak kullanılmamalıdır. Fakat tek `TaskNode` tipinin semantik olarak yanlış olduğunu kesin gösterir.

Örnekler:

- `adr-0001`, bir karar kaydı olduğu halde Module seviyesinde ve “uygulaması + testler” deliverable'ı taşıyor.
- `edu-baslangic-rotasi`, eğitim/rehber sayfası olduğu halde Module görev olarak işleniyor.
- `app-kernel-x-atom`, açıkça “örnek kırılım” ve non-executable demonstrasyon olduğu halde bütün normal görev alanlarını taşıyor.
- `board`, doküman/sayfa kökenli olduğu halde Module planına dönüşmüş.
- `customer`, gerçekten uygulanabilir Archetype plan kaydıdır ve ayrıca standalone Archetype contract'ına bağlanır.

### 2.4 Her kayıt backlog görünerek bilgi kaybediyor

467/467 kayıt `status = backlog` durumundadır. Bu şunları aynı kategoriye sokar:

- kabul edilmiş ADR,
- yayınlanmış eğitim rehberi,
- örnek Atom,
- gerçek implementation işi,
- aday/proposal,
- yaşayan standard veya contract.

`status` tek alanı içerik lifecycle'ı ile execution lifecycle'ını karıştırmaktadır. Yeni modelde ayrılmalıdır:

```text
lifecycleStatus: draft | active | deprecated | archived
executionStatus: proposed | backlog | ready | in-progress | blocked | done
decisionStatus: proposed | accepted | superseded | rejected
publicationStatus: private | review | published | withdrawn
```

Her tür yalnız kendi anlamlı status alanını taşımalıdır.

### 2.5 WBS ağacı katı Ada→Atom ağacı değil

439 kaydın parent'ı vardır; fakat 200 parent-child bağı beklenen bir-alt-seviye sırasına uymaz.

Gerçek parent-level çiftleri:

| İlişki | Sayı |
|---|---:|
| app → module | 152 |
| app → archetype | 86 |
| app → feature | 72 |
| module → module | 21 |
| module → archetype | 19 |
| module → feature | 8 |
| archetype → feature | 13 |
| archetype → module | 5 |
| feature → feature | 8 |
| feature → component | 18 |
| component → work_unit | 18 |
| work_unit → micro_step | 19 |

Bu veri bugün bir **outline/content tree ile WBS tree karışımıdır**. `parentId` tek başına hem “bu dokümanın altında göster” hem “bu iş bunun WBS kırılımıdır” anlamını taşıyamaz.

Yeni ilişkiler ayrılmalıdır:

```text
outlineParentRef     # içerik/navigasyon hiyerarşisi
decomposesRef        # gerçek WBS parçalama ilişkisi
dependsOnRefs        # yürütme sırası
implementsRef        # plan → definition
governsRefs          # decision/standard → hedefler
evidenceForRefs      # evidence → plan/definition
supersedesRef        # karar/sürüm yaşam döngüsü
relatedRefs          # karar üretmeyen gevşek ilişki
```

`parentId`in bütün bu anlamları üstlenmesi LLM'in yanlış graph ve yanlış iş planı üretmesine yol açar.

---

## 3. 467 dosyanın dışında zaten başka kayıt türleri var

Repo yalnız generated node'lardan oluşmuyor.

### 3.1 JSON yüzeyi

İlk taraf, dependency/build çıktıları hariç ölçüm:

| Alan | Dosya/kayıt ölçümü |
|---|---:|
| Bütün first-party JSON dosyaları | 560 |
| `src/data` JSON dosyaları | 527 |
| Generated TaskNode dosyaları | 467 |
| Standart kontratları | 30 |
| Archetype kontratları | 3 |
| Atom definition registry girdileri | 19 |
| ECA ruleset paketleri | 12 |
| Surface kontratları | 6 |
| Workflow kontratları | 5 |
| People kayıtları | 9 |
| Tech profile | 4 |
| Workspace manifest kaydı | 1 |
| Storybook registry JSON dosyaları | değişmekte; çoğu boş taslak |
| Docs markdown | 246 |
| Report JSON | 10 |
| Platform content seed/handoff JSON | 13 |

Yaklaşık 556 gerçek veri girdisi/record adayı vardır; fakat bunların hepsi aynı lifecycle, URL veya persistence modeline ait değildir.

### 3.2 Mevcut ayrı şemalar doğru yönü gösteriyor

Repo zaten aşağıdaki özel şemalara sahiptir:

- `ArchetypeContractSchema`
- `SurfaceContractSchema`
- `WorkflowContractSchema`
- `StandardContractSchema`
- `EcaRulesetPackageSchema`
- `ValueAtomDefinitionSchema`
- `TechProfileSchema`
- `PersonSchema`
- `SavedViewSchema`
- Storybook registry şemaları

Bu mimari Drupal tarzı tek node şemasına dönülmemesi gerektiğinin doğrudan kanıtıdır. Ortak zarf küçük olmalı, payload özel şemada kalmalıdır.

### 3.3 Aynı ID, farklı namespace problemi

Bugün:

```text
task/customer
archetype/customer

task/product
archetype/product
```

Bu her zaman hata değildir. Plan kaydı ile ürettiği contract'ın aynı okunabilir anahtarı kullanması anlaşılır. Hata, referansın yalnız `customer` string'i olmasıdır.

Tipli kimlik gereklidir:

```json
{ "kind": "plan", "id": "customer" }
{ "kind": "archetype-definition", "id": "customer", "version": "1.0.0" }
```

Kanonik URI/ref:

```text
mf://plan/customer
mf://archetype/customer@1.0.0
mf://standard/ui-components@1.2.0
mf://surface/sf-generic-form@1.0.0
```

Bu URI web URL'si değildir; JSON içi foreign reference formatıdır. Web resolver bunu `/records/<kind>/<id>` adresine çevirir.

### 3.4 Cross-registry referans bütünlüğü eksik

Standalone Archetype contract'larında ölçülen çözülmeyen referanslar:

- 6 Surface ref: `customer-form`, `customer-360`, `order-form`, `product-form`, `product-table` vb.
- 3 Workflow ref: `customer-onboarding`, `order-fulfillment`, `product-approval`
- 9 Ruleset binding ref

Mevcut `check-data-quality` yalnız generated TaskNode içindeki `dependsOn/blocks/related/parentId` referanslarını doğrular. Registry'ler arası tek global resolver yoktur.

Bu nedenle yeni mimarinin ilk işi “daha çok şeyi record yapmak” değil, **tipli global referans çözümleyici** kurmaktır.

### 3.5 Bazı kataloglar runtime'da görünmez

Standartların yalnız bir bölümü engine tarafından doğrudan import ediliyor; Storybook registry'lerinin çoğu boş ve runtime consumer'ı yok; Archetype contract'ları çoğunlukla test/tool/traceability üzerinden bağlıdır. Bir JSON dosyasının varlığı onun ürün içinde adreslenebilir veya yönetilebilir olduğu anlamına gelmez.

“Record oldu” demek için asgari kanıt:

1. şema,
2. registry/index,
3. referential integrity,
4. resolver,
5. lifecycle/ownership,
6. gerekiyorsa route/view,
7. version/revision politikası,
8. authorization/publish politikası.

---

## 4. Neler AddressableRecord olmalı?

Bir varlık aşağıdaki kriterlerden **en az ikisini**, güvenlik/yetki kriterlerinden biri varsa tek başına karşılıyorsa adreslenebilir kayıt olmalıdır:

- Başka kayıtların kalıcı referans hedefidir.
- Bağımsız lifecycle taşır.
- Bağımsız owner/reviewer taşır.
- Version veya revision gerekir.
- Ayrı authorization/publish kararı gerekir.
- Audit/evidence geçmişi gerekir.
- Ayrı URL'de paylaşılmalıdır.
- Search/catalog içinde bulunmalıdır.

### 4.1 Olması gereken record türleri

| Mevcut varlık | Kanonik tür | Addressable? | Açıklama |
|---|---|---:|---|
| Gerçek WBS işi/kapsamı | `PlanRecord` | Evet | Board/Gantt/workload/execution motorunun girdisi |
| ADR | `DecisionRecord` | Evet | Accepted/superseded lifecycle'ı vardır |
| Standard JSON | `StandardDefinition` | Evet | Version, applicability ve waiver hedefidir |
| Archetype JSON | `ArchetypeDefinition` | Evet | Yaşayan reusable contract'tır |
| Fragment | `FragmentDefinition` | Koşullu | Birden çok archetype kullanıyorsa veya versionlanıyorsa |
| Value atom | `ValueTypeDefinition` | Evet | Field/widget/validation referans hedefidir |
| Surface | `SurfaceDefinition` | Evet | Archetype ve Storybook composition hedefidir |
| Workflow | `WorkflowDefinition` | Evet | State machine/ruleset referans hedefidir |
| Ruleset | `PolicyDefinition` | Evet | Katmanlı, versiyonlu ve audit edilirdir |
| Tech profile | `TechnologyProfile` | Evet | Standard ve Surface foreign ref hedefidir |
| Master Component | `UiComponentDefinition` | Evet | Owner/version/deprecation/consumer taşır |
| Storybook story | `UiScenarioDefinition` | Koşullu | Ayrı stable ID/evidence hedefiyse; her CSF export record olmak zorunda değil |
| Guide/eğitim | `GuideRecord` | Evet | Publish/search/URL lifecycle'ı vardır; execution motoruna girmez |
| Proposal/adayı | `ProposalRecord` | Evet | İnsan kabulünden sonra başka türe promote edilir |
| Example/demo | `ExampleRecord` | Evet veya embedded | Eğitimde referans hedefiyse; gerçek backlog değildir |
| Kanıt manifesti | `EvidenceRecord` | Evet | Immutable provenance ve hedef bağı taşır |
| Rapor tanımı | `ReportDefinition` | Evet | Schedule, query, audience ve publish policy taşır |
| Üretilmiş rapor çıktısı | `ReportArtifact` | Koşullu | Retention/audit/paylaşım gerekiyorsa |
| Workspace | `WorkspaceDefinition` | Evet | Repo/command/evidence sınırının hedefidir |
| Person/team | Ayrı identity directory kaydı | Evet | Genel content registry'ye değil identity/organization registry'ye aittir |

### 4.2 PlanRecord alt türleri

Doğa metaforları kaldırılmamalıdır; fakat `level` ile kaydın davranışı ayrılmalıdır:

```text
PlanScopeRecord       app, module, bazı archetype/feature kayıtları
PlanDeliverableRecord feature, component
PlanWorkRecord        work_unit
PlanStepRecord        micro_step
```

Tek şema kullanılacaksa discriminant gerekir:

```json
{
  "recordKind": "plan",
  "planKind": "scope | deliverable | work | step",
  "level": "app | module | archetype | feature | component | work_unit | micro_step"
}
```

`level` boyutu/büyüklüğü, `planKind` davranışı söyler.

### 4.3 Record olmaması gerekenler

- Component'in tek prop'u
- UI local state veya filter state
- Tek tablo hücresi
- Her acceptance criterion
- Her dimension item
- Her relation edge
- Her function/helper/CSS selector
- Log satırı, metric sample, trace span
- Rebuild edilebilir index/navigation/meta
- Cache
- Story args içindeki tek fixture alanı
- Her revision snapshot'ı

`generated/index.json`, `navigation.json`, `meta.json` ve `public/data/nodes.json` **record değildir**; kanonik kayıtlardan türetilen projection/materialized view'dır.

### 4.4 Ürün domain entity'leri bu registry'ye konulmamalı

Metaframer ile üretilen ürünlerde:

```text
Listing, Invoice, Employee, Campaign, BudgetPlan
```

kendi bounded context'lerinin entity/aggregate'larıdır. `AddressableRecord` zarfını implement etmek zorunda değillerdir. CMS/publishing gerekiyorsa ortak protocol adaptörü kullanılabilir; fakat mimari definition registry ile aynı storage/table/index'e atılmamalıdır.

Bu ürün-tarafı kayıtların kendi kimlik/URL sözleşmesi §14'te ayrıca tanımlanır (Drupal'ın node/1 + pathauto modelinin runtime karşılığı ve düzeltilmiş hali).

---

## 5. Keyword kararı ve LLM hata analizi

### 5.1 `node` neden tehlikeli?

| LLM çağrışımı | Beklenen yanlış kodlama |
|---|---|
| Drupal node | Tek content tablosu, field bag, numeric nid, `/node/{nid}` |
| Node.js | Runtime/package/backend nesnesi sanma |
| Graph node | Bütün domain'i generic vertices/edges'e indirgeme |
| DOM Node | UI/ref/element API'siyle karıştırma |
| GraphQL Relay Node | Global opaque ID ve `edges.node`u domain modeline dayatma |
| AST node | Parser/visitor patternini gereksiz yere taşıma |

Repo zaten GraphQL Relay için `edges/node/cursor` terimini kullanıyor. Aynı codebase'de plan içeriğine de `node` denmesi prompt bağlamını kırar.

### 5.2 Aday isimlerin değerlendirilmesi

| Keyword | Güçlü yanı | Risk | Hüküm |
|---|---|---|---|
| `AddressableRecord` | Ortaklığın nedenini açıklar; storage türünü dayatmaz | Uzun | **Ortak interface/protocol** |
| `Record` | LLM için stabil, basit | Tek başına fazla genel | Yerel değişkende yalnız tür açıksa |
| `PlanRecord` | 467 corpusun gerçek yürütülebilir alt kümesini doğru tanımlar | ADR/guide/example'ı kapsamaz | **Plan engine tipi** |
| `Definition` | Standards/archetype/surface için doğru | Plan/evidence için yanlış | **Contract türleri** |
| `DecisionRecord` | ADR için kesin | Dar | **ADR tipi** |
| `GuideRecord` | Eğitim/publish içeriği için kesin | Dar | **Rehber tipi** |
| `Artifact` | Build/report/evidence çıktısı için doğru | Yaşayan definition değildir | Yalnız üretilmiş çıktı |
| `Entity` | İş domain'inde güçlü | ORM/DDD persistence çağrışımı | Ürün domain'i için, meta kayıt için değil |
| `Resource` | REST URL dilinde doğal | Transport ile domain'i karıştırır | API katmanıyla sınırlı |
| `Blueprint` | Tasarım niyeti güçlü | Status/execution/evidence'i kapsamaz | UI etiketi olabilir, ana tip değil |
| `FrameRecord` | Markaya yakın | iframe/dataframe/UI frame çağrışımı | Önerilmez |
| `MetaRecord` | Markaya yakın ve kısa | Metadata/metamodel belirsizliği | UI dilinde olabilir; kod üst tipi değil |
| `ContentItem` | CMS'lerde bilinir | Drupal benzeri content modeline geri döner | Önerilmez |
| `Unit` | Kısa | `work_unit` ile çakışır | Yasak |

### 5.3 İdeal kullanım

Kötü:

```ts
function processNode(node: any) {}
```

Yetersiz:

```ts
function processRecord(record: AddressableRecord) {}
```

Doğru:

```ts
function calculateCriticalPath(records: PlanRecord[]) {}
function resolveStandard(record: StandardDefinition) {}
function publishGuide(record: GuideRecord) {}
function attachEvidence(target: RecordRef, evidence: EvidenceRecord) {}
```

LLM en özel domain adını gördüğünde yanlış framework çağrışımı belirgin biçimde azalır.

---

## 6. Önerilen ortak protokol

### 6.1 Zarf minimal olmalı

```ts
interface AddressableRecordEnvelope<K extends RecordKind> {
  recordKind: K;
  id: string;                 // kind namespace içinde stabil
  schemaVersion: string;
  title: string;
  slug: string;
  aliases: string[];
  lifecycleStatus: LifecycleStatus;
  ownerRef?: RecordRef;
  createdAt: string;
  updatedAt: string;
}
```

Şunlar ortak zarfa konulmamalıdır:

- `phase`
- `progress`
- `dependsOn`
- `acceptanceCriteria`
- `dimensions`
- `ecaRules`
- `agentPolicy`
- `uiDelivery`

Bunlar yalnız ilgili record türlerinde veya ayrı bağlı contract'ta yaşamalıdır. Aksi halde yeniden Drupal field-bag oluşur.

### 6.2 Discriminated union

```ts
type AddressableRecord =
  | PlanRecord
  | DecisionRecord
  | GuideRecord
  | ProposalRecord
  | ExampleRecord
  | DefinitionRecord
  | EvidenceRecord;

type DefinitionRecord =
  | StandardDefinition
  | ArchetypeDefinition
  | FragmentDefinition
  | ValueTypeDefinition
  | SurfaceDefinition
  | WorkflowDefinition
  | PolicyDefinition
  | UiComponentDefinition
  | TechnologyProfile;
```

Bir universal store olabilir; ancak plan engine yalnız `recordKind === "plan"` projection'ını tüketmelidir.

### 6.3 Tipli referans

Bugünkü serbest string ID'ler yerine:

```ts
interface RecordRef {
  kind: RecordKind;
  id: string;
  version?: string;
}
```

Örnek:

```json
{
  "implementsRefs": [
    { "kind": "archetype-definition", "id": "customer", "version": "1.0.0" }
  ],
  "governedByRefs": [
    { "kind": "standard", "id": "ui-components", "version": "1.2.0" }
  ]
}
```

### 6.4 Kimlik kuralları

- DB integer primary key dışarı sızmaz.
- `id` kind namespace içinde immutable'dır.
- `slug` değişebilir; alias/redirect tutulur.
- `kind + id` global unique key'dir.
- Versionlanan definition için `kind + id + version` immutable revision target'ıdır.
- Record rename, reference rewrite değil alias ekler.
- ID title'dan runtime'da tekrar türetilmez.

---

## 7. URL ve resolver tasarımı

### 7.1 Neden `/node/1` değil?

- Türü gizler.
- Ortamlar arası stabil değildir.
- Import/export çakışması üretir.
- Enumeration kolaylaştırır.
- İnsan ve LLM'e bağlam vermez.
- Drupal mimarisini çağırır.
- Versionlı definition ile yaşayan plan kaydını ayıramaz.

### 7.2 Önerilen URL'ler

```text
/plans/customer-archetype-implementation
/decisions/adr-0027-engineering-standards
/standards/ui-components
/definitions/archetypes/customer
/definitions/archetypes/customer/versions/1.0.0
/definitions/surfaces/sf-generic-form
/guides/edu-baslangic-rotasi
/examples/kernel-atom-breakdown
/evidence/ev-pr01-ci-baseline
```

Universal resolver:

```text
/records/archetype-definition/customer
```

UI burada canonical tipe yönlendirir; asıl SEO/share URL tipli route olabilir.

### 7.3 Mevcut SPA gerçeği

Bugünkü TanStack route yalnız `/task/$taskId` tanımlar. Export kodu da mutlak ve göreli bütün linkleri `/task/<id>` olarak üretir. `dist` içinde her task için fiziksel `index.html` üretilmez; SPA fallback kullanılır. Migration şu yüzeyleri birlikte değiştirmelidir:

- router,
- TaskDetail view parametresi,
- bütün Link bileşenleri,
- header search,
- board/table/gantt/graph linkleri,
- export `TaskRef`, Developer Brief, Agent Prompt ve evidence patch,
- SPA 404/deep-link doğrulaması,
- public aggregate,
- docs içindeki hard-coded URL'ler.

Yalnız route'u rename etmek eski export artefact'larını kırar.

---

## 8. 467 kayıt için gerçek migration sınıflaması

### Wave 0 — Envanter ve tür kararı

Her generated kayıt için insan-reviewable bir classification manifest üret:

```json
{
  "sourceId": "adr-0001",
  "currentLevel": "module",
  "proposedRecordKind": "decision",
  "confidence": "high",
  "reason": "id ve source cluster ADR olduğunu doğruluyor",
  "targetId": "adr-0001",
  "action": "extract"
}
```

İzinli action:

```text
keep-as-plan
extract
split-plan-and-definition
convert-to-guide
convert-to-example
convert-to-proposal
embed-in-parent
archive
human-review
```

### Wave 1 — Kesin cohortları ayır

1. 25 ADR → `DecisionRecord`.
2. 59 açık örnek → `ExampleRecord`; backlog ve critical path'ten çıkar.
3. 37 eğitim kaydı → `GuideRecord`.
4. 36 aday kaydı → `ProposalRecord`.
5. Generated index/navigation projection'larını record sayma.

### Wave 2 — Plan/definition çiftlerini böl

Özellikle:

```text
PlanRecord: customer archetype implementation
implements → ArchetypeDefinition: customer@1.0.0
```

`customer` ve `product` çakışmaları typed ref ile çözülür. `order` için eksik plan/definition bağı karara bağlanır.

### Wave 3 — WBS ağacını temizle

- `outlineParentRef` ile `decomposesRef` ayrılır.
- 200 seviye-atlayan/aynı-seviye parent ilişkisi tek tek sınıflanır.
- Gerçek PlanRecordlar Ada→Atom invariantına göre doğrulanır.
- Eğitim/ADR/proposal navigasyonu ayrı tree/index olur.

### Wave 4 — Code migration

1. `TaskNodeSchema` → `PlanRecordSchema` compatibility alias.
2. `taskStore` → `planStore`; `nodes` → `planRecords`.
3. Engine fonksiyonları `PlanRecord[]` kabul eder.
4. `NavNode` → `NavigationEntry`; bu yalnız projection'dır.
5. Graph görselleştirmesindeki veri tipi `PlanGraphVertex` olur.
6. `nodes.json` → `plan-records.json`.
7. `/plans/<id>` eklenir; `/task/<id>` redirect edilir.

### Wave 5 — Global registry/resolver

- Bütün addressable türler için index.
- `(kind,id,version)` uniqueness.
- Typed foreign-key çözümleme.
- Orphan reference gate.
- Alias collision gate.
- Lifecycle/version compatibility gate.

### Wave 6 — Eski terminolojiyi kaldır

- Bare `TaskNode`, `node`, `nodes`, `nodeId` deprecated edilir.
- İzinli teknik bağlamlar allowlist'te kalır.
- Docs, prompt, JSON keys, exports ve UI strings aynı sözlüğe geçirilir.

---

## 9. Zorunlu conformance kapıları

### 9.1 Terminoloji kapısı

Yeni domain tipi veya route içinde şu desenler fail:

```text
*NodeSchema
interface *Node
/node/
processNode(node)
```

Allowlist:

- `node:*` Node.js import prefix'i
- GraphQL Relay `edges.node`
- DOM `Node` tipi
- AST parser node'u
- açıkça `GraphVertex` olarak normalize edilen graph kodu
- migration compatibility alias'ı, expiry tarihiyle

### 9.2 Record schema parity

- Her `recordKind` tek Zod schema'ya çözülür.
- Bütün JSON'lar kendi schema'sıyla parse edilir.
- File `schemaVersion` runtime schema sürümüyle uyumludur.
- Bilinmeyen kind/alan fail eder.

### 9.3 Global referans kapısı

- Her `RecordRef` registry'de çözülür.
- Version belirtilmişse o immutable revision vardır.
- Cross-kind illegal ref fail eder.
- `implements`, `governs`, `evidenceFor`, `supersedes` yönleri şemaya uyar.
- Bugünkü dangling Archetype→Surface/Workflow/Ruleset ref'leri görünür fail olur.

### 9.4 Projection kapısı

- `navigation`, `index`, `meta`, public aggregate yalnız kanonik kaynaklardan üretilir.
- Projection elle edit edilemez.
- İki ardışık generation checksum'ı aynıdır.
- Projection sayımı kanonik registry sayımıyla eşleşir.

### 9.5 URL/alias kapısı

- Canonical URL type-aware'dır.
- Eski `/task/<id>` doğru tipe redirect olur.
- Alias zinciri döngüsüzdür.
- Deep link hem görünür render hem HTTP/fallback davranışıyla doğrulanır.
- Export edilen URL gerçek route resolver ile aynı fonksiyondan üretilir.

---

## 10. LLM/vibe-coding bağlayıcı yönergesi

Repo agent sözleşmesine şu metin tek-kaynak olarak eklenmelidir:

> Metaframer domain dilinde çıplak `node` kullanılmaz. Ortak adreslenebilir protokol `AddressableRecord`dır; uygulama kodunda daima en özel tür (`PlanRecord`, `DecisionRecord`, `ArchetypeDefinition`, `SurfaceDefinition`, `GuideRecord`, `EvidenceRecord`) kullanılır. Drupal node/content-type/Field API ve `/node/{nid}` modeli yasaktır. Node.js, DOM Node, GraphQL Relay Node, AST node ve graph vertex yalnız kendi teknik bağlamında açık niteleyiciyle yazılır. Generated index/navigation/meta record değildir; kanonik kayıtlardan türetilen projection'dır. Bir PlanRecord ile ürettiği DefinitionRecord aynı nesne değildir; `implementsRef` ile bağlanır. Domain entity'leri AddressableRecord registry'sine zorla sokulmaz.

Bir coding ajanı yeni varlık eklemeden önce şu soruları cevaplamalıdır:

1. Bu execution planı mı, yaşayan definition mı, karar mı, rehber mi, kanıt mı?
2. Bağımsız stable ID/lifecycle/owner/version/authorization gerekiyor mu?
3. Parent ilişkisi outline mı, WBS decomposition mı?
4. Hangi typed ref'leri üretir ve tüketir?
5. Bu kanonik kayıt mı yoksa projection/cache/artifact mı?
6. URL gerekli mi; gerekliyse canonical kind route hangisi?

Bu sorular cevaplanmadan yeni JSON family veya `*Node` tipi üretilemez.

---

## 11. Ölümcül anti-patternler

1. **Yalnız rename:** `TaskNode`u `PlanRecord` yapıp ADR/guide/example'ı aynı kabın içinde bırakmak.
2. **Universal field bag:** Bütün türlere `phase`, `progress`, `uiDelivery`, `ecaRules` eklemek.
3. **Numeric public ID:** DB sıra numarasını `/node/1` olarak dışarı vermek.
4. **String-only refs:** `customer`ın plan mı archetype mı olduğunu bağlamdan tahmin etmek.
5. **Projection'ı kaynak sanmak:** `public/data/nodes.json`u edit etmek.
6. **Doc = task varsayımı:** Her markdown veya corpus sayfasını backlog girdisine çevirmek.
7. **Definition = implementation task:** Yaşayan contract tamamlandı diye kapanan task nesnesi yapmak.
8. **Tek parent semantiği:** İçerik outline'ı ile WBS decomposition'ı aynı `parentId`de tutmak.
9. **Route-only migration:** Export, store, tests, SPA fallback ve aliases güncellenmeden `/task`ı değiştirmek.
10. **Global resolver olmadan registry çoğaltmak:** Çok JSON family üretip foreign-key bütünlüğü kurmamak.

---

## 12. Tamamlanma tanımı

Bu terminoloji/mimari değişikliği ancak aşağıdakilerin tamamı sağlanınca bitmiştir:

- 467 kaydın her biri bir migration action ve hedef `recordKind` taşır.
- ADR, guide, proposal ve example kayıtları plan execution motorundan ayrılmıştır.
- Gerçek PlanRecord corpusu ayrıca sayılmış ve raporlanmıştır.
- `TaskNodeSchema` kanonik tip değildir; yalnız süreli compatibility alias olabilir.
- `AddressableRecord` minimal ve discriminated union'dır.
- Plan ile Definition ayrı lifecycle taşır ve typed ref ile bağlanır.
- `kind + id + version` global resolver çalışır.
- Bugünkü Archetype→Surface/Workflow/Ruleset dangling ref'leri çözülmüş veya gerekçeli kaldırılmıştır.
- 200 düzensiz parent bağı outline/decomposition olarak sınıflanmıştır.
- `1.0.0`/`1.1.0` schema drift'i kapanmıştır.
- Generated projections deterministik ve read-only'dir.
- `/plans`, `/decisions`, `/definitions`, `/guides`, `/evidence` rotaları vardır.
- Eski `/task/<id>` linkleri redirect/alias ile çalışır.
- `/node/<number>` hiçbir yerde kanonik route değildir.
- Bare `Node` domain adları allowlist dışındaysa CI fail eder.
- Export ve agent promptları type-aware URL ve RecordRef üretir.

---

## 13. Son hüküm

Önceki raporun doğru kısmı “node adını bırak” kararıydı; eksik kısmı 467 kaydın tamamını yeterince sorgulamadan `PlanRecord` saymasıydı.

Codebase ve JSON content-base şunu gösteriyor:

> Metaframer'ın tek bir yeni “node” ismine değil, küçük bir adreslenebilir-kayıt protokolüne ve kesin ayrılmış record türlerine ihtiyacı vardır.

En güvenli keyword **`record`**, ortak teknik protokol **`AddressableRecord`**, mevcut engine'in gerçek girdisi **`PlanRecord`**dır. Ancak `PlanRecord`, bugünkü 467 dosyanın yeni etiketi değildir; ADR, eğitim, aday, örnek ve yaşayan definition kayıtları ayrıldıktan sonra geriye kalan gerçek plan corpusudur.

Doğru sıra:

```text
önce classify → sonra split → sonra typed refs → sonra resolver → en son rename/route migration
```

Yanlış sıra:

```text
TaskNode → PlanRecord search/replace
```

Bu ayrım yapılmazsa Drupal çağrışımından kaçarken Drupal'ın asıl mimari hatası — birbirinden farklı her şeyi tek içerik kabına koymak — Metaframer içinde yeniden üretilmiş olur.

---

## 14. Ek — Ürün Katmanı Kimlik ve URL Mimarisi → `docs/url-policy.md`

Bu bölüm kendi tek kanonik dokümanına taşındı: **[url-policy.md](url-policy.md)**. Güncel model; `k-route-policy`, bounded-context public ID sahipliği, private PII için ID-only canonical, public `/{locale}/.../{typedId}/{asciiSlug}`, tenant/custom-domain RouteProjection ve çok fazlı maturity programıdır. Bu dosya (`node.md`) yalnız planlama-katmanı record mimarisini anlatır; ürün URL policy'si burada tekrar edilmez.
