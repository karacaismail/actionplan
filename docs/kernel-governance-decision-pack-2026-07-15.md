# Kernel Governance Decision Pack

Tarih: 2026-07-15  
Durum: DIRECTIVE-ONLY; runtime NO-GO  
Yetki zinciri: Codex → PM → uzman ajanlar → Claude workers/slaves

## Kısa Durum

Kernel hazır değildir. Actionplan içinde sözleşme, WBS ve kalite kapısı çalışması
yapılabilir; platform runtime, SDK-ready ve app-buildable iddiaları için gerçek kod,
veritabanı, PR, CI ve deploy kanıtı yoktur. Nihai karar Codex'tedir. PM ardıl
koordinatördür; mimari karar mercii değildir. Platform uygulaması human-developer-only
kapsamındadır.

## Repo Gerçeği

| Kaynak | Doğrulanan durum | Sonuç |
|---|---|---|
| actionplan | 2026-07-15 pre-D01 snapshot: 617 düğüm, 41 `k-*` kimliği, 787 SP; kernel evidence sayısı 0 | Tarihsel plan/sözleşme kanıtı; current-live toplam için authority değildir |
| platform | FastAPI health/ping ve UI SurfaceRenderer iskeleti; DB, migration, kernel paketi ve SDK yok | Runtime NO-GO |
| atonota/kernel | Yerel ve origin/main aynı committe; 2 test yeşil | Metawork/pipeline spike'ı; metaframer runtime kernel değildir ve uzak repo boş değildir |
| metaframer-kernel | Kanonik workspace manifestindeki hedefte doğrulanmış checkout yok | Ayrı bir runtime kanıtı kabul edilmez |

## Ajan Bazlı Bulgular

- PM: yalnız PR-01 sıradaki uygulanabilir queue adayıdır; KDP overlay sıralama
  yetkisine sahip değildir.
- Backend/kernel integrator: PR-02'nin kalıcı izolasyon kanıtı, PR-04 outbox'ı ve PR-06
  audit'i doğrudan DB ister; PR-07 bu kalıcı öncüller nedeniyle dolaylı bağlıdır.
- QA/QASP: readiness kapıları 0 done ve 0 development adayında boş-küme yeşili
  üretebilir; bu kernel-ready anlamına gelmez.
- Graph denetimi: 35 düğüm üzerinde 46 çelişkili kenar vardır. Bunların 5 kernel
  düğümü üzerinde 8 çelişkili kenarı bulunur.
- ADR denetimi: E1, M1, S1, X1 ve A5/ADR-0022 kimlikleri çakışır veya aynı kararı
  birden fazla otoriteyle taşır.
- WBS denetimi: direktiflerin iddia ettiği 13 hayalet WBS kimliği kanonik node
  kümesinde yoktur.
- Security/rollback: yanlış runtime readiness, yanlış ADR approval_ref ve legacy
  writer yan etkisi fail-closed ele alınmalıdır.

## Birleşik Karar Dizini

Kanonik görünürlük kaydı
`reports/kernel-governance-decision-registry-2026-07-15.json`, aşağıdaki iki kaynak
decision array'ini tekil ve sıralı biçimde keşfeder; kaynakların yerine geçmez:

- `reports/kernel-gap-inventory-2026-07-14.json`: KGA-D01..D05
- `reports/kernel-governance-gap-addendum-2026-07-15.json`: KGA-D06..D10

| Karar | Konu | Kaynak | Durum |
|---|---|---|---|
| KGA-D01 | Code-bearing descendant seçimi | Base gap inventory + kanonik handoff | approved; application state resolver-validated |
| KGA-D02 | k-surface dependency ve SDK sırası | Base gap inventory + application handoff | approved; application kaydedildi; gap açık |
| KGA-D03 | PR-07 capability / module-registry sahipliği | Base gap inventory | pending/unselected |
| KGA-D04 | Sahipsiz kernel directive kimlikleri | Base gap inventory | pending/unselected |
| KGA-D05 | PR-10 / PR-11 exit semantiği | Base gap inventory | pending/unselected |
| KGA-D06 | Kalıcı DB zemini ve queue | Governance addendum | pending/unselected |
| KGA-D07 | dependsOn / blocks semantiği | Governance addendum | pending/unselected |
| KGA-D08 | ADR kimliği ve supersession | Governance addendum | pending/unselected |
| KGA-D09 | Hayalet WBS disposition | Governance addendum | pending/unselected |
| KGA-D10 | Tenancy fiziksel stratejisi | Governance addendum | pending/unselected |

## İnsan Kararı Paketi

Bu belge D01 için GATE-01 onayını kaydeder; D02..D10 seçeneklerinin etkisini görünür
kılar ve kararlarını User/Admin'e bırakır. D01 application özeti ve pending/applied satırları
kanonik resolver ile doğrulanır; diğer seçenekler pending/unselected durumundadır.

### KGA-D01 — Code-bearing Descendant Seçimi

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

38 kernel module parent'ın yalnız beşinde archetype veya daha alt seviyede code-bearing
descendant vardır. GATE-01 onaylı exact 33-row D01 descendant ledger, kalan 33 parent
için gerçek uygulama ve test kanıtını taşıyacak kimlikleri seçer. `k-control-planes`
yalnız üç module child taşıdığı için code-bearing kapsama sayılmaz. Bu paket node
üretmez, parent seviyesini değiştirmez ve code-start açmaz.

Makine-okunur `reports/kernel-code-bearing-descendant-handoff-2026-07-15.json`, pre-D01
graph'taki 38/6/5/33 snapshot'ını ve exact 33 seçimi bağlar. Current-live application özeti,
pending/applied satırları ve beklenen node toplamı `resolveD01NodeUniverse` ile doğrulanır;
handoff `gapClosed=false` taşıdığı sürece D01 kapanmış değildir.
`codeStartAllowed=false`, `runtimeCodeAllowed=false` ve runtime verdict `NO-GO` kalır.

### KGA-D02 — k-surface Dependency ve SDK Sırası

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

`k-surface`, `be-sdk` ve `stack-editions` arasındaki sıra/döngü için dependency yönü ve
minimum provisional contract sınırı seçilmelidir. Karar gelmeden edge veya queue değişmez.

GATE-01 onaylı yön `edition-app-to-sdk-to-kernel` olarak
`reports/kernel-surface-dependency-order-handoff-2026-08-01.json` içinde application
kaydına alınmıştır: `status=approved-application-pending`, `gapClosed=false`,
`edgeMutation=false`. Kayıt yalnız semantiktir; 8 kernel çakışma kenarının ikisi olan
`k-surface` kenarlarının onarımı KGA-D07'ye aittir ve bu handoff hiçbir edge, node,
queue, registry, closure veya EPOCH-02 kaydını değiştirmez.

### KGA-D03 — PR-07 Registry Sahipliği

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

PR-07'nin `k-capability` ile `k-mod-l` arasındaki module-registry sorumluluğu
ayrıştırılmalıdır. Bu paket iki modülü birleştirmez ve owner atamaz.

Onaylanan ayrım yalnız governance kaydı olarak canonical'dır; canlı ownership
projeksiyonu henüz onarılmamıştır. `src/data/generated/nodes/capability-registry-contract.json`
hâlâ `k-capability` altında yaşayan, module registry + manifest validation + registry
health ile capability/entitlement'ı birleştiren bir descendant'tır; bu kayıt onu
çözmez, unresolved olarak işaretler. Statü:
`deferred-to-pr07-pre-execution-node-rescope`. Herhangi bir PR-07 code start'tan önce
sınırlı bir governance projection shard'ında yeniden kapsamlandırılmalıdır. Ayrıntı:
`reports/kernel-module-registry-ownership-split-handoff-2026-08-01.json`.

### KGA-D04 — Sahipsiz Kernel Directive Kimlikleri

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

Base envanterdeki yedi directive adayı için mevcut owner'a bağlama veya yeni WBS kimliği
kararı gerekir. Geniş hayalet-WBS ledger'ı D09 altında kalır; bu bölüm node oluşturmaz.

GATE-01 `D04_D09=REJECT_13_GHOSTS` token'ı D04 ile D09 arasında paylaşılır. Bu kayıt
token'ın yalnız candidate-owner-identity-rejection payını tüketir: KGA-G05'in yedi aday
kimliği (`k-evidence-seal`, `k-kms`, `k-legal-hold`, `k-migration-bridge`, `k-obligation`,
`k-provider-adapter`, `k-signature-trust`) `rejected-no-node-creation` olarak reddedilir.
Her satır kaynak hayalet id'sini ve iddiayı doğuran directive'i D09 ledger'ından türeterek
bağlar; hiçbir node üretilmez, hiçbir modül yeniden adlandırılmaz ve hiçbir
`ownerAssignment` yazılmaz — tümü null kalır. Reddetme sahiplik ataması değildir: KGA-G05
P0 açık gap olarak kalır, ownership çözümü `human-WBS-owner-decision` durumundadır ve
`gapClosed=false` sürer. On üç satırlık D09 ledger'ı yalnız salt-okunur kanıttır; bayt
kimliği, `candidate-unselected` ve `pending` durumu korunur, ledger'daki on üç hayalet
için create/alias/fold/reject dispositions'ın tamamı açık ve D09'a ertelenmiş kalır. Ayrıntı:
`reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json`.

### KGA-D05 — PR-10 / PR-11 Exit Semantiği

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

SDK port iskeletinin ve API/UI walking skeleton'ının hangi kanıtla scaffold-only durumundan
çıktığı tanımlanmalıdır. Bu iki adım kernel-ready, SDK-ready veya app-buildable kanıtı değildir.

GATE-01 `D05=SCAFFOLD_AND_WALKING_SKELETON_ONLY` token'ı ile PR-10 exit tavanı
`scaffold-only`, PR-11 exit tavanı `walking-skeleton-only` olarak kaydedilir. Tavan, exit
kanıtının kendisi değildir: `promotesReadiness=false` sürer, hiçbir PR-10 çıktısı SDK-ready,
hiçbir PR-11 çıktısı app-buildable okunamaz. Base execution queue salt-okunur kanıttır ve
bayt kimliğiyle sabitlenir (37 item, PR-01..PR-11 sırası, `nextActionable=PR-01`); PR-10
`PR-09` arkasında, PR-11 `PR-10` arkasında blocked kalır ve bu kayıt hiçbirini açmaz,
sıralamaz veya yetkilendirmez. PR execution handoff ile PR-10/PR-11 agent pack'leri
`source-evidence-only`dır; normatif DoD'ye yükseltilmez ve canonical ownership taşımaz.
Runtime, scaffold, SDK, API veya UI kodu yazılmaz. Ayrıntı:
`reports/kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01.json`.

### KGA-D06 — Kalıcı Veri Zemini ve Queue

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

1. early-minimal-db-substrate: PR-01 sonrasında küçük, açık bir DB/Alembic/transaction/RLS
   zemini eklenir; PR-02..07 gerçek kalıcılık üzerinde doğrulanır.
2. provisional-contract-only-then-replay-after-pr08: mevcut sıra korunur; DB'ye bağlı
   kanıtlar provisional kalır ve PR-08 sonrasında persistence testleri yeniden oynatılır.

İki seçenek de candidate-unselected durumundadır; bu paket öneri veya varsayılan üretmez.
Base queue insan kararı olmadan değiştirilmez. Machine-readable karar handoff'u:
`reports/kernel-db-substrate-queue-handoff-2026-07-15.json`.

### KGA-D07 — Dependency/Blocks Semantiği

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

35 düğüm, 46 çelişkili kenar ve kernel alt kümesindeki 5 kernel düğümü, 8 çelişkili
kenar için blocks yönü, reciprocity ve birleşik precedence anlamı kararlaştırılmalıdır.
Bu ölçüm yalnız aynı node içindeki dependsOn ∩ blocks kesişimidir. Karar gelmeden
otomatik edge düzeltmesi yapılmaz.

### KGA-D08 — ADR Kimlikleri

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

E1, M1, S1, X1 ve A5/ADR-0022 için tekil topic, status, owner, alias ve supersession
kararı gerekir. Bu kimlikler ambiguous kalır ve machine consumer'ları açmamalıdır.

### KGA-D09 — Hayalet WBS Kimlikleri

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

13 hayalet WBS, bu auditin doğrudan doğrulanmış eksik-node setidir; tüm aday/alias
envanteri değildir. Her biri için tek tek create / alias / fold / reject kararı gerekir.
Bu paket node üretmez, module parent değiştirmez ve DoD tamamlandı iddiası yazmaz.

### KGA-D10 — Tenancy Fiziksel Stratejisi

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

PostgreSQL RLS deny-by-default kabul edilmiş invarianttır; fakat ortak şema, tenant
başına şema veya hybrid seçiminde physicalStrategy = null durumundadır. ADR-0026
frontend teknoloji profilleridir; tenancy kararı olarak kullanılamaz.

## P0 Bağlayıcı Ledger'lar

Aşağıdaki beş P0 ledger D01'i approval-aware, D06 ve D08/D09/D10 pending/unselected
makine-okunur snapshot olarak bağlar; runtime NO-GO sürer ve bu ledger'lar kanonik ADR
topic, WBS owner/disposition veya tenancy topolojisini seçmez. D01 handoff exact 33
descendant seçimini ve current application state'i kaydeder; resolver bu state'in live node
evreniyle eşleşmesini fail-closed doğrular.

| Karar | P0 ledger | Durum |
|---|---|---|
| KGA-D01 | reports/kernel-code-bearing-descendant-handoff-2026-07-15.json | approved; application state resolver-validated; gap açık; NO-GO |
| KGA-D06 | reports/kernel-db-substrate-queue-handoff-2026-07-15.json | pending; iki seçenek candidate-unselected, queuePatch null |
| KGA-D08 | reports/kernel-adr-collision-source-bindings-2026-07-15.json | pending; ADR kimlikleri ambiguous, canonicalTopic null |
| KGA-D09 | reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json | pending; 13 hayalet binding candidate-unselected |
| KGA-D10 | reports/kernel-tenancy-authority-inventory-2026-07-15.json | pending; physicalStrategy null, mandatory RLS korunur |

## P1 Karar ve Yerleşim Handoff'ları

- `reports/kernel-crosscut-handoff-2026-07-15.json`: GraphQL otoritesi, kontrol düzlemi,
  erişilebilirlik, performans, deploy, i18n ve dependency yönü seçimlerini pending bırakır.
- `reports/kernel-missing-doc-ref-placement-2026-07-15.json`: 17 docs-ref boşluğunu
  14 candidate-unselected ve 3 canonical-source-missing olarak bağlar; ref uygulamaz.

## GATE-01 Approval Intake — Application Pending

User/Admin GATE-01 onayı `reports/kernel-governance-closure-authority-2026-07-31.json`
ile approved-application-pending olarak kaydedildi. Bu ref kanonik uygulama veya karar
kapanışı değildir: registry pending/unselected, `codeStartAllowed=false` ve
`runtimeCodeAllowed=false` kalır.

## Application State Ledger — Partial Application, NO-GO

`reports/kernel-governance-application-state-2026-08-01.json` GATE-01 intake'ini
değiştirmeden gerçek kanonik uygulama durumunu tutar. Her satır bir `applicationScope`
taşır ve bir satır yalnız kendi `applicationScope`'u içinde canonical'dır; kapsam
dışındaki hiçbir şey applied veya canonical değildir. `KGA-D01`: applied, kapsamı
approved-descendant-materialization. `KGA-D02`: applied, kapsamı yalnız
governance-semantics-record; kanonik edge application deferred-to-KGA-D07 kalır, burada
ne applied ne canonical'dır. `KGA-D03`: applied, kapsamı yalnız
ownership-split-governance-record ve kanıtı
`reports/kernel-module-registry-ownership-split-handoff-2026-08-01.json`'dır; `k-mod-l`
module registry, manifest registration, versions, dependency resolution, declared
permissions ve registry health/lifecycle'ı, `k-capability` capability catalog,
user-tenant-plan entitlement resolution ve allow/deny visibility'yi tutar; hiçbiri
diğerini soğurmaz, node/edge/owner yazılmaz ve birleşik PR-07 belgeleri
source-evidence-only kalır. Bu satır canlı graph sahipliğinin zaten ayrıştığı anlamına
gelmez: `capability-registry-contract` hâlâ `k-capability` altında birleşik kapsamla
durur, `graphProjectionApplied=false`, `nodeRescopeComplete=false` ve
`canonicalNodeApplication=deferred-to-pr07-pre-execution-node-rescope` kalır. `KGA-D04`:
applied, kapsamı yalnız unowned-directive-ownership-disposition-record ve kanıtı
`reports/kernel-unowned-directive-ownership-disposition-2026-08-01.json`'dır; KGA-G05'in
yedi aday owner kimliği reddedilir, node oluşturulmaz ve owner atanmaz. Bu satır KGA-G05
kapanışı değildir: gap P0 açık kalır, ownership çözümü `human-WBS-owner-decision`
durumundadır ve on üç satırlık D09 hayalet ledger'ı bayt-aynı, `candidate-unselected` ve
pending kalarak `ghostLedgerDisposition=deferred-to-KGA-D09` ile ertelenir. `KGA-D05`:
applied, kapsamı yalnız scaffold-walking-skeleton-exit-semantics-record ve kanıtı
`reports/kernel-scaffold-walking-skeleton-exit-semantics-2026-08-01.json`'dır; PR-10 tavanı
`scaffold-only`, PR-11 tavanı `walking-skeleton-only` kaydedilir, hiçbiri readiness
promote etmez ve `runtimeImplementation=deferred-no-code-start` kalır. Base queue
bayt-aynıdır, PR-10/PR-11 blocked ve `nextActionable=PR-01` sürer; agent pack'leri
source-evidence-only kalır. `KGA-D06`–`KGA-D10` pending'dir ve `applicationScope`
değerleri null'dır. Applied satır yalnız validator'daki kapalı attestation
sözleşmesiyle durur: birebir artifact ref'i, birebir artifact kök id'si, birebir
application summary'si, approved-application-pending kök statüsü ve 691 baytlık GATE-01
approval digest'i.
Sözleşmesi olmayan bir karar, JSON'u ne kadar applied görünürse görünsün applied
olamaz; pending satır tamamlanma iddia edemez. Ledger canlı EPOCH-03 zincir başına
bağlanır; EPOCH-02, eksik veya bayat damga fail-closed reddedilir. Kısmi uygulama gap
kapanışı değildir: `gapClosed=false`, `codeStartAllowed=false`,
`runtimeCodeAllowed=false`, `readinessAllowed=false`, release/deploy false ve
verdict NO-GO kalır; registry `KGA-D01`..`KGA-D10` sırasını pending/unselected tutar.

## Uygulanan Güvenli Sıra

1. Weak-content analizini import sırasında rapor yazmayan saf kütüphaneye ayır.
2. Üç eski platform writer'ını fail-closed karantinaya al.
3. Kernel governance sayımlarını ve runtime NO-GO sonucunu machine-readable kapıya bağla.
4. Açık insan kararlarını bu paketle görünür kıl; WBS, queue, ADR veya tenancy
   kararlarını otomatik uygulama.

## Riskler

- Docs green, runtime green değildir.
- Approved ledger ve canonical descendant application PASS, runtime readiness kanıtı değildir.
- Queue değiştirilmeden gerçek persistence beklentileri karşılanamaz.
- Çakışan graph/ADR kimlikleri yanlış işi veya yanlış approval_ref'i açabilir.
- Repo dışı ingest kaynakları olmadan tüm canonical üretim upstream'den yeniden
  üretilebilir değildir.

## Doğrulama ve Test Planı

- Saf import testi, tracked raporların hash ve içerik olarak değişmediğini doğrular.
- Legacy writer negatif testleri doğrudan çalıştırma ve import yollarının exit 2 ile
  kapandığını doğrular.
- Governance testi current-live graph/readiness durumunu canlı kanonik veriden; tarihsel
  nodeCount ile ADR/hayalet WBS envanterini denetimli snapshot'tan doğrular.
- Karar paketi testi D01 GATE-01 onayını approval-aware kaydettiğini, diğer kararları
  seçmediğini ve gap raporuyla machine-readable ek arasında bağ kurduğunu doğrular.
- Birleşik registry testi D01..D10 sırasını, kaynak parity'sini, kimlik benzersizliğini,
  seçilmemiş seçenekleri ve fail-closed code-start durumunu doğrular.
- D01 handoff testi immutable pre-D01 graph'tan 38 module parent, 6 doğrudan-child sahibi,
  5 covered ve 33 açık seçimi doğrular; current-live application state, referential integrity,
  DAG ve NO-GO sınırını kanonik resolver ile zorlar.
- D06 handoff testi canlı PR-01..11 zincirini, DB bağımlılık sınıflarını, iki tarafsız
  seçeneği, değişmemiş base queue'yu ve NO-GO yetki sınırını zorlar.
- Runtime kernel yalnız gerçek Postgres RLS, transaction/outbox/audit, PR/CI ve
  rollback drill evidence ile yeniden değerlendirilir.

## Rollback

Her tooling shard'ı ayrı commit olarak geri alınabilir. Karar paketi shard'ı belge,
classification, matrix, source-node traceability ref'i, generated/public aggregate ve
integration sayımlarını birlikte revert eder. Governance raporu yalnız checker/lib/test/
workflow/package ile tam governance shard rollback'inde geri alınır. Base queue, WBS
kimliği/parent/edge, ADR kimlikleri ve tenancy stratejisi değişmediği için semantic data
rollback gerekmez. Crosscut ve missing-doc-ref shard'ları önce tüketen governance
integration shard'ı, sonra ilgili report+test çifti geri alınarak atomik kapatılır. Runtime
safhasında veri oluşursa destructive geri alma yerine route kapatma ve additive
forward-fix uygulanır.
KGA-D01 handoff shard'ı report/test dosyaları ile registry, decision pack ve named-gate
bağlantıları tek committe geri alınarak kapatılır; generated node veya runtime veri etkisi yoktur.
KGA-D06 handoff shard'ı da aynı beş dosyalık atomik sırayla geri alınır; base queue ve
runtime hiç değişmediği için migration veya veri rollback'i yoktur.
KGA-D02 application shard'ı önce decision pack linki, package gate ve authorization audit
parent-gate aynası, sonra report+test çifti geri alınarak kapatılır; edge, node, queue,
registry, closure ve EPOCH-02 hiç değişmediği için semantic data rollback'i yoktur.
KGA-D03 application shard'ı önce decision pack bölümleri, package gate ve authorization
audit parent-gate aynası, sonra application-state satırı, attestation sözleşmesi ve
report+test çifti geri alınarak kapatılır; node, edge, owner, queue, registry, closure ve
EPOCH-03 hiç değişmediği ve `capability-registry-contract` yalnız unresolved olarak
kaydedildiği için semantic data veya projection rollback'i yoktur.
KGA-D04 application shard'ı önce decision pack bölümleri, package gate ve authorization
audit parent-gate aynası, sonra application-state satırı, attestation sözleşmesi ve
report+test çifti geri alınarak kapatılır; hiçbir aday kimlik için node, owner veya edge
yazılmadığı ve D09 hayalet ledger'ı bayt-aynı bırakıldığı için semantic data, ghost ledger
veya runtime rollback'i yoktur.
KGA-D05 application shard'ı önce decision pack bölümleri, package gate ve authorization
audit parent-gate aynası, sonra application-state satırı, attestation sözleşmesi ve
report+test çifti geri alınarak kapatılır; base queue bayt-aynı bırakıldığı, PR-10/PR-11
blocked kaldığı ve hiçbir runtime, scaffold veya SDK kodu üretilmediği için queue, semantic
data veya runtime rollback'i yoktur.

## Codex Nihai Kararı

Runtime kernel için NO-GO sürer. Actionplan tarafında yalnız fail-closed tooling,
kanıtlı gap kaydı ve insan-karar paketi uygulanabilir. Şu anda yalnız PR-01
next-actionable konumundadır. PR-01 next-actionable bir code-start izni değildir;
KGA-D01..D10 kapanmadan kernel-ready, SDK-ready veya app-buildable kararı verilmez.
