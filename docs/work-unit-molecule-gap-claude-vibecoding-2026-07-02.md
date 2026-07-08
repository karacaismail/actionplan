# Work Unit / Molekül Gap Analizi ve Claude Vibecoding Raporu

Tarih: 2026-07-02  
Kapsam: `actionplan` WBS/sözleşme deposu, özellikle `level = work_unit` olan molekül görevleri.  
Kullanım: Tarihsel gap raporu ve iyileştirme backlog'u olarak okunur; doğrudan kodlama promptu değildir. Güncel kodlama/handoff kaynağı `docs/developer-guide.md`, `docs/task-export-contract.md`, `docs/implementation-workspace-manifest.md` ve görev detay ekranındaki Developer Brief / Agent Prompt / Vobecoder Card exportlarıdır.
Amaç: Kernel geliştirildikten sonra `work_unit / molekül` seviyesindeki görev tanımlarında ne eksik, hangi work_unit görevleri eksik, hangi bilinmeyen-bilinmeyenler var ve Claude hangi fazlarla ilerlemeli sorularını tek raporda kapatmak.

---

## Güncel Statü Notu — 2026-07-08

Bu rapor 2026-07-02 anlık denetimidir. 2026-07-08 itibarıyla actionplan'da vibecoding handoff yüzeyi eklendi: Developer Brief, Agent Prompt, Evidence Patch, Vobecoder Card, implementation workspace manifesti ve `qa:vibecoding` kapısı yayındadır. Bu, rapordaki "hangi alan eksik" teşhisini tarihsel backlog olarak bırakır; ancak hiçbir work_unit/molekül düğümünü otomatik code-start `GO` yapmaz. Güncel kural: `phase=development` + dolu `traceability.repoPath` + dolu `traceability.testCommand` + `implementationStatus != not-started` olmadan kod yazılmaz.

---

## 0. Tek Hüküm

Mevcut WBS'de `work_unit / molekül` seviyesi kanonik olarak tanımlı, fakat gerçek kernel vibecoding yürütmesi için bu seviye de hazır değil. Veri setinde 467 düğüm var, yalnız 18 tanesi `work_unit`. Bu 18 work_unit'in 16'sı "Molekül - ... örnek kırılımı" başlığı taşıyor; başlık kanonik terminolojiyle uyumlu olsa da içerik hâlâ üretim işi değil, granülerlik demonstrasyonu niteliğinde. 18/18 `phase = requirements`, 18/18 `status = backlog`, 17/18 `traceability` yok, 18/18 `standardRefs` boş/null, 18/18 `dependsOn = []`. Yani work_unit seviyesi bugün gerçek tekil fonksiyon/test backlog'u değil; büyük ölçüde örnek kırılım olarak üretilmiş granülerlik demonstrasyonu.

Kanonik gerçek: `work_unit = molekül`. Teknik level adı her zaman `work_unit` olmalıdır. Claude'a verilecek işlerde başlık/metafor değil `level` alanı esas alınır; metafor gerekiyorsa yalnız `molekül` kullanılır.

En kritik ayrım: `work_unit`, micro_step gibi tek satır değildir. Bir işlev/test birimidir: validator, formatter, policy predicate, parser, mapper, pure function, hook, small service method, unit-test pack. Bu seviye parent `component` içinde yaşar ve altındaki `micro_step` atomlarının evidence'ını toplayıp parent'a roll-up eder. Bugünkü work_unit tanımları bu sorumluluğu taşımıyor.

---

## 1. Ölçülmüş Mevcut Durum

Kaynak veri: `public/data/nodes.json`, `src/data/generated/nodes/*.json`, `src/schemas/task.ts`, `src/data/strings.json`, `docs/task-to-code-contract.md`, `docs/ready-for-dev-gate.md`.

### 1.1 Seviye dağılımı

| Seviye | Sayı |
|---|---:|
| app | 28 |
| module | 178 |
| archetype | 105 |
| feature | 101 |
| component | 18 |
| work_unit | 18 |
| micro_step | 19 |

Yorum: Work_unit sayısı component sayısıyla neredeyse bire bir. Bu gerçek ürün planı için düşük. Bir component normalde birden fazla work_unit'e ayrılmalı: validator, parser, policy, service, test helper, error mapper, audit wrapper gibi.

### 1.2 Work_unit kalite ölçümü

| Ölçüt | Sonuç |
|---|---:|
| Toplam `work_unit` | 18 |
| `status = backlog` | 18/18 |
| `phase = requirements` | 18/18 |
| Başlığı "örnek kırılımı" olan | 16/18 |
| Başlığı "Molekül - ... örnek kırılımı" olan | 16/18 |
| `traceability` olmayan | 17/18 |
| `traceability.repoPath` olmayan | 17/18 |
| `traceability.testCommand` olmayan | 17/18 |
| `standardRefs` boş/null | 18/18 |
| `dependsOn` boş | 18/18 |
| `evidence` boş | 17/18 |
| AC içinde test/kanıt eşlemesi geçen | 1/18 |
| 17 üretim boyutu dolu | 18/18 |
| İnsan kaynaklı/review işaretli boyut | 2/18 |

Yorum: 17 üretim boyutu dolu olsa bile work_unit yürütülebilir sayılmaz. Work_unit seviyesinde asıl değer `repoPath`, `testCommand`, concrete function/class name, positive/negative test, parent component bağı ve child micro_step roll-up'ıdır.

### 1.3 Mevcut work_unit envanteri

Gerçek üretime yakın olanlar yalnız CRM pilot zincirindeki iki work_unit'tir:

| Work unit id | Başlık | Durum |
|---|---|---|
| `molekul-crm-score-weight-config` | Skor Ağırlık Yapılandırması | Daha somut; traceability var, evidence yok |
| `molekul-crm-score-field-validator` | Skor Alanı Doğrulayıcı | Daha somut; evidence var, traceability yok |

Eksik somut work_unit:

| Component id | Başlık | Eksik |
|---|---|---|
| `kum-crm-lead-dedup` | Lead Tekilleştirme Kuralı | Hiç work_unit child yok |

Örnek niteliğindeki work_unit'ler:

- `app-kernel-x-molekul`
- `app-scale-x-molekul`
- `app-layer1-x-molekul`
- `app-backend-x-molekul`
- `app-frontend-x-molekul`
- `app-build-x-molekul`
- `app-sus-x-molekul`
- `app-crosscut-x-molekul`
- `app-data-intelligence-x-molekul`
- `app-platform-horizontal-x-molekul`
- `app-customer-revenue-x-molekul`
- `app-finance-x-molekul`
- `app-supply-chain-x-molekul`
- `app-hr-x-molekul`
- `app-content-collaboration-x-molekul`
- `app-vertical-x-molekul`

Bu 16 kayıt production work_unit değildir. Eğitim/granülerlik örneği olarak kalmalı veya gerçek work_unit'lere bölünmelidir.

---

## 2. Work_unit Görev Tanımlarında Eksik Olanlar

Her `work_unit / molekül` görev tanımı aşağıdaki alanları taşımalı. Bugün bunların çoğu eksik veya jenerik.

| Eksik alan | Bugünkü durum | Gerekli düzeltme |
|---|---|---|
| Kanonik başlık | 16/18 başlık örnek kırılımı diyor | Başlık doğrudan işlev adı olmalı; metafor gerekiyorsa yalnız `molekül` |
| Tekil işlev sınırı | Çoğu soyut "örnek kırılımı" | Bir fonksiyon/class/test pack sınırı: validator, mapper, policy, parser |
| Kod hedefi | 17/18 `repoPath` yok | Platform/kernel path ve dosya adı zorunlu |
| Test komutu | 17/18 `testCommand` yok | Unit test komutu zorunlu |
| Test-first eşleme | AC test adına bağlı değil | Her AC bir test fonksiyonuna veya test dosyasına bağlı |
| Child atom roll-up | Çocuk atomlar parent evidence'a bağlanmıyor | Work_unit, micro_step kanıtlarını toplayan evidence paketi olmalı |
| Parent component sözleşmesi | Component ile net input/output yok | Work_unit hangi component fonksiyonunu tamamlıyor açık olmalı |
| API/fonksiyon imzası | Yok | Function/class/method signature açık olmalı |
| Error contract | Yok veya jenerik | Hangi hata, hangi durumda, hangi code/message açık |
| Determinism/purity | Yok | Pure function mı, DB side-effect mi, external effect mi açık |
| Mock politikası | Yok | Mock yasak/izinli sınırı; high-risk'te gerçek adapter/testcontainer |
| Standard refs | 18/18 boş | Testing, architecture, data-api, authz, observability refleri |
| DependsOn | 18/18 boş | Önce hangi validator/model/migration/action tamamlanmalı açık |
| Risk tier | Yok | High-risk work_unit: tenant, authz, secret, payment, inventory, financial, migration |
| Rollback ilişkisi | Jenerik | Work_unit ayrı rollback yapmazsa parent rollback'e nasıl bağlanır |
| Human review | 16/18 yok | AI/swarm içerik insan onayıyla kilitlenmeli |

### 2.1 Work_unit Definition of Ready

Bir work_unit geliştirmeye alınmadan önce:

1. `level = work_unit`.
2. Parent `component` net.
3. Başlık eski "Element" terimini kullanmıyor.
4. Tekil işlev veya test paketi adı açık.
5. `traceability.repoPath` dolu.
6. `traceability.testCommand` dolu.
7. En az 3 kabul kriteri var: pozitif, negatif, entegrasyon/roll-up.
8. En az 1 child `micro_step` var veya "atomlaştırmaya gerek yok" gerekçesi yazılı.
9. `dependsOn` varsa dolu; yoksa bağımsızlık gerekçesi var.
10. `standardRefs` minimum seti dolu veya waiver var.
11. High-risk ise negatif test vektörü ve evidence beklentisi açık.

### 2.2 Work_unit Definition of Done

Bir work_unit tamam sayılmadan önce:

1. Unit test önce kırmızı görülmüş.
2. Child micro_step testleri yeşil.
3. Work_unit test komutu yeşil.
4. Parent component acceptance criteria'ına hangi maddeyi kapattığı yazılmış.
5. Evidence parent component'e roll-up edilmiş.
6. High-risk ise negatif test ve audit/decision/outbox evidence var.
7. `traceability.implementationStatus` en az `implemented`; verification sonrası `verified`.
8. Work_unit boyutu büyüdüyse alt work_unit'e veya micro_step'e bölünmüş.

---

## 3. Hangi Work_unit Görevleri Eksik?

Bu bölümdeki id'ler öneridir. Bunlar bugünkü WBS'de yoktur veya yalnız üst seviye node olarak vardır. Gerçek kernel vibecoding için `work_unit` seviyesinde açılmalıdır.

### Faz A - WBS/work_unit aktivasyon görevleri

Önce WBS'nin kendisi work_unit kodlamaya hazır hale getirilmeli.

| Önerilen work_unit id | Eksik görev | Neden gerekli |
|---|---|---|
| `wu-wbs-work-unit-dor-contract` | Work_unit DoR/DoD sözleşmesi | Molekül seviyesinde kodlanabilirlik netleşsin |
| `wu-wbs-work-unit-traceability-ratchet` | Work_unit için repoPath/testCommand uyarı/fail kapısı | 17/18 eksik |
| `wu-wbs-work-unit-test-map` | AC -> test fonksiyonu eşleme standardı | Claude test-first çalışmalı |
| `wu-wbs-work-unit-child-atom-rollup` | Child micro_step evidence roll-up standardı | Atom kanıtı work_unit'te toplanmalı |
| `wu-wbs-example-work-unit-quarantine` | Kanonik olmayan örnek work_unit kayıtlarını kodlanamaz işaretle | Örnekler üretim işi sanılmasın |
| `wu-wbs-old-element-title-normalize` | Eski work_unit başlıklarını kanonikleştir | `work_unit = molekül`; eski seviye adı kalkmalı |
| `wu-wbs-component-child-coverage` | Her real component için en az bir work_unit child denetimi | `kum-crm-lead-dedup` gibi boşlukları yakalar |
| `wu-wbs-standardrefs-ratchet-work-unit` | Work_unit standardRefs minimum seti | 18/18 boş |

### Faz B - Kernel v1 work_unit backlog'u

#### Tenant Context

| Önerilen work_unit id | Sorumluluk | Child atom örnekleri |
|---|---|---|
| `wu-tenancy-context-accessor` | `get_tenant_id/set_tenant_id` fail-closed context erişimi | missing tenant error, UUID context, nested context isolation |
| `wu-tenancy-fastapi-require-tenant` | FastAPI tenant dependency | missing header 401, invalid UUID 422, context set |
| `wu-tenancy-sqlalchemy-session-scope` | SQLAlchemy session tenant ayarı | RLS setting, schema search_path, cleanup |
| `wu-tenancy-cross-tenant-negative-tests` | Cross-tenant leakage test pack | >=10 negative cases, audit violation |
| `wu-tenancy-no-direct-header-read-lint` | Tenant'ı raw header'dan okuma yasağı | static scan, failure message |

#### Identity / AuthZ / PDP

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-authn-jwt-verify-rs256` | JWT verify, RS256-only, exp/jti kontrolü |
| `wu-authn-refresh-rotation` | refresh rotation ve replay reddi |
| `wu-authz-require-permission` | resolver/endpoint permission guard |
| `wu-authz-permission-cache` | Redis izin cache'i, invalidation ve TTL |
| `wu-pdp-decision-engine` | policy-as-data evaluate, default-deny, deny-overrides |
| `wu-pdp-decision-log` | tamper-evident decision log |
| `wu-pdp-batch-evaluate` | UI permission-aware rendering için batch evaluate |
| `wu-pdp-eca-separation-tests` | ECA yetki yerine geçemez testleri |

#### Event Bus / Outbox / Idempotency

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-outbox-publisher` | Domain write + outbox same transaction |
| `wu-outbox-relay-worker` | pending outbox -> stream/queue relay |
| `wu-outbox-retry-dlq` | retry, backoff, DLQ |
| `wu-idempotency-store` | `(tenant_id, idempotency_key)` store |
| `wu-idempotency-result-replay` | duplicate request returns stored result |
| `wu-event-consumer-idempotent-handler` | at-least-once tüketimde tek etki |
| `wu-event-contract-linter` | event_type/payload/version contract lint |

#### ECA Runtime

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-eca-condition-evaluator` | condition op seti ve safe evaluation |
| `wu-eca-action-dispatcher` | action allowlist, serbest JS/SQL/shell yok |
| `wu-eca-chain-depth-guard` | max chain depth 6 |
| `wu-eca-idempotent-fire` | aynı olayda tekrar tetik tek etki |
| `wu-eca-audit-fire-log` | her fire audit/event log |
| `wu-eca-pdp-before-action` | tetiklenen aksiyon PDP'den geçer |

#### Audit

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-audit-logger` | tek AuditLogger API'si |
| `wu-audit-append-only-db-guard` | UPDATE/DELETE revoke/test |
| `wu-audit-hash-chain` | prev_hash/hash tamper-evident zincir |
| `wu-audit-redaction` | secret/PII redaction |
| `wu-audit-correlation-context` | trace_id/request_id bağlama |
| `wu-audit-agent-human-system-actor` | actor_type ayrımı |

#### Archetype / Workflow Registry

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-archetype-register-get-list` | register/get/list_available API |
| `wu-archetype-tenant-resolution` | tenant archetype resolve fail-safe |
| `wu-archetype-direct-config-read-forbidden` | app tenant config'i direkt okuyamaz |
| `wu-workflow-start-instance` | workflow start ve state yazma |
| `wu-workflow-advance-state` | state transition validator |
| `wu-workflow-direct-state-write-forbidden` | direct DB state write yasağı |

#### Migration Policy

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-migration-downgrade-lint` | boş `downgrade()` fail |
| `wu-migration-expand-contract-lint` | destructive migration guard |
| `wu-migration-tenant-index-lint` | tenant_id + created_at index |
| `wu-migration-large-table-pattern` | concurrent index / nullable add column |
| `wu-migration-rollback-test-runner` | `upgrade -> downgrade -> upgrade` test |

#### Observability

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-o11y-request-context` | request/trace id context |
| `wu-o11y-structured-logger` | structlog JSON wrapper |
| `wu-o11y-metric-labels` | tenant/user labels, p95 histogram |
| `wu-o11y-trace-sanitizer` | db.statement/PII sanitize |
| `wu-o11y-no-print-lint` | print/raw logging yasağı |

#### Module SDK

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-sdk-appmodule-abc` | AppModule abstract interface |
| `wu-sdk-module-registry` | register/get_all duplicate guard |
| `wu-sdk-healthz` | default healthz contract |
| `wu-sdk-module-lifecycle` | startup/shutdown hooks |
| `wu-sdk-plugin-boundary-tests` | module core boundary tests |

### Faz C - Kernel Execution Contract work_units

| Önerilen work_unit id | Sorumluluk |
|---|---|
| `wu-xc-execution-envelope-validator` | actor/tenant/policy/audit/idempotency/rollback envelope validation |
| `wu-xc-generated-crud-write-detector` | generated CRUD write path static/dynamic detector |
| `wu-xc-typed-action-router` | mutation -> typed action/command route |
| `wu-xc-pdp-callpath-lint` | typed action PDP evaluate çağırıyor mu |
| `wu-xc-audit-callpath-lint` | mutation AuditLogger.log çağırıyor mu |
| `wu-xc-scaled-write-guard` | financial/order/inventory action scaled_write taşıyor mu |
| `wu-xc-surface-action-filter` | PDP + workflow-state izinli aksiyon render |
| `wu-xc-ai-approval-ref-guard` | AI draft apply approval_ref zorunlu |
| `wu-xc-high-risk-evidence-check` | high-risk negatif test/evidence check |

### Faz D - Kernel v2 work_units

| Primitif | Eksik work_unit görevleri |
|---|---|
| Actor/Party | `wu-actor-party-model`, `wu-actor-role-binding`, `wu-actor-effective-role-resolver`, `wu-actor-role-audit` |
| Capability | `wu-capability-resolver`, `wu-capability-plan-matrix`, `wu-capability-hidden-404`, `wu-capability-entitlement-audit` |
| Mode Profile | `wu-mode-profile-preview`, `wu-mode-profile-dry-run`, `wu-mode-profile-apply`, `wu-mode-profile-rollback` |
| Computation | `wu-computation-graph-parser`, `wu-computation-operator-allowlist`, `wu-computation-deterministic-evaluator`, `wu-computation-versioned-replay` |
| Field Types | `wu-fieldtypes-money`, `wu-fieldtypes-measure`, `wu-fieldtypes-i18n-text`, `wu-fieldtypes-email-phone-canonical` |
| Scale Invariant | `wu-scale-write-policy`, `wu-scale-waiver-validator`, `wu-scale-idempotency-race-test`, `wu-scale-audit-tamper-test` |
| Sequence | `wu-sequence-reserve`, `wu-sequence-commit`, `wu-sequence-void`, `wu-sequence-no-max-plus-one-lint` |
| Calendar/Capacity | `wu-calendar-business-time`, `wu-calendar-holiday-overlay`, `wu-capacity-exception`, `wu-calendar-timezone-edge` |
| Genealogy | `wu-genealogy-edge-create`, `wu-genealogy-cycle-reject`, `wu-genealogy-recall-traversal`, `wu-genealogy-immutable-edge` |
| Edge Gateway | `wu-edge-offline-buffer`, `wu-edge-command-approval`, `wu-edge-idempotent-sync`, `wu-edge-device-tenant-binding` |
| KPI Registry | `wu-kpi-formula-registry`, `wu-kpi-version-resolver`, `wu-kpi-system-tenant-boundary`, `wu-kpi-computation-binding` |
| APS Solver | `wu-aps-proposal-runner`, `wu-aps-capacity-input-builder`, `wu-aps-approval-apply`, `wu-aps-deterministic-seed` |
| Surface Runtime | `wu-surface-render-strategy`, `wu-surface-cache-key-policy`, `wu-surface-permission-actions`, `wu-surface-custom-render-audit` |
| Jurisdiction | `wu-jurisdiction-context-resolver`, `wu-jurisdiction-residency-guard`, `wu-jurisdiction-locale-currency-tax-separation`, `wu-jurisdiction-audit-violation` |

### Faz E - Eksik P0/P1 kernel primitif work_units

Bu görevler bugünkü kernel gap raporlarının söylediği eksik alanlardır; work_unit seviyesine indirilmeden Claude kod üretimine verilmemeli.

| Eksik primitif/alan | Work_unit görevleri |
|---|---|
| KMS / secret management | `wu-kms-secret-binding-model`, `wu-kms-secret-ref-resolver`, `wu-kms-no-inline-secret-scan`, `wu-kms-rotation-runner`, `wu-kms-access-audit` |
| Tenant lifecycle | `wu-tenant-lifecycle-state-machine`, `wu-tenant-provision-runner`, `wu-tenant-suspend-guard`, `wu-tenant-export-runner`, `wu-tenant-offboard-delete-guard` |
| Metering | `wu-metering-usage-event-collector`, `wu-metering-idempotent-aggregation`, `wu-metering-quota-enforcer`, `wu-metering-billing-export` |
| Payment/PSP | `wu-payment-provider-adapter`, `wu-payment-webhook-signature`, `wu-payment-idempotent-callback`, `wu-payment-refund-command`, `wu-payment-audit-ledger-link` |
| Inbound webhook | `wu-webhook-signature-verify`, `wu-webhook-replay-window`, `wu-webhook-payload-zod-pydantic`, `wu-webhook-dlq`, `wu-webhook-idempotency` |
| Realtime | `wu-realtime-channel-auth`, `wu-realtime-tenant-room`, `wu-realtime-backpressure`, `wu-realtime-reconnect-replay` |
| Media pipeline | `wu-media-upload-virus-scan`, `wu-media-image-variant`, `wu-media-transcode-job`, `wu-media-publish-after-scan` |
| DR/backup/PITR | `wu-backup-schedule-runner`, `wu-pitr-restore-drill`, `wu-tenant-scoped-restore`, `wu-backup-evidence-pack` |
| API versioning/deprecation | `wu-api-version-router`, `wu-api-deprecation-header`, `wu-api-compat-contract-test`, `wu-api-changelog-gate` |

### Faz F - CRM pilot work_unit eksikleri

Bugünkü gerçekçi pilot tarafında eksik work_unit'ler:

| Parent component | Önerilen work_unit id | Eksik görev |
|---|---|---|
| `kum-crm-lead-scoring` | `wu-crm-score-weight-config-tests` | Weight config test/evidence boşluğunu kapat |
| `kum-crm-lead-scoring` | `wu-crm-score-weight-versioning` | rule_version üretimi ve geçmiş skor koruma |
| `kum-crm-lead-scoring` | `wu-crm-score-field-validator-traceability` | validator repoPath/testCommand doldur |
| `kum-crm-lead-scoring` | `wu-crm-score-audit-change` | weight değişikliği audit |
| `kum-crm-lead-dedup` | `wu-crm-dedup-email-normalizer` | normalized email key |
| `kum-crm-lead-dedup` | `wu-crm-dedup-phone-normalizer` | E.164 phone key |
| `kum-crm-lead-dedup` | `wu-crm-dedup-candidate-finder` | duplicate candidate finder |
| `kum-crm-lead-dedup` | `wu-crm-dedup-merge-proposal` | otomatik apply yok; öneri üret |
| `kum-crm-lead-dedup` | `wu-crm-dedup-merge-approval` | insan onayı ve audit |
| `kum-crm-lead-dedup` | `wu-crm-dedup-false-positive-tests` | yanlış pozitif negatif testleri |

---

## 4. Eksiklik Analizi

### 4.1 Terminoloji eksikliği

Şema ve strings: `work_unit = molekül`. Veri başlıkları artık kanonik `molekül` adını kullanıyor; kalan sorun 16/18 work_unit'in hâlâ örnek kırılımı düzeyinde olmasıdır. Geçmiş prompt metinlerinden kalan karışık metaforlar yeniden girerse Claude yanlış seviyede iş üretebilir.

Düzeltme: Teknik level her zaman kazanır. Başlık/metafor kayarsa migration/normalization yapılmalı. `component = kum`, `work_unit = molekül`, `micro_step = atom`.

### 4.2 Yürütme eksikliği

Work_unit kodlanabilir seviyedir. Fakat 17/18'inde repoPath/testCommand yok. Bu, Claude'a verilecek net çalışma alanı olmadığı anlamına gelir. Work_unit, doğrudan "şu function/class/test pack" demelidir.

### 4.3 Test-first eksikliği

Work_unit seviyesinde asıl evidence unit testtir. Mevcut AC'ler genellikle test fonksiyonu adı vermez. "Doğrulama birim test paketi" yazmak yeterli değildir; `pytest ... -k test_invalid_email_rejected` gibi yürütülebilir test komutu gerekir.

### 4.4 Child atom eksikliği

`molekul-crm-score-weight-config` gerçekçi bir work_unit, ama child micro_step yok. Bir weight config work_unit'i en az şu atomlara inmeli: negatif ağırlık reddi, toplam ağırlık toleransı, rule_version increment, yetkisiz değişiklik deny. Bu atomlar olmadan work_unit "tekil işlev" olarak test edilemez.

### 4.5 Parent component eksikliği

`kum-crm-lead-dedup` component seviyesinde var, ama hiç work_unit child'ı yok. Bu, component'in kodlanabilir alt işlere bölünmediğini gösterir. Claude'a component verilirse kapsam fazla büyük olur.

### 4.6 Standard/güvenlik eksikliği

18/18 work_unit standardRefs boş. Özellikle kernel work_unit'leri authz, audit, data-api, testing, observability, release/migration standartlarına bağlanmalı. Bağ yoksa Claude hangi invariantın kırılmaması gerektiğini bilmez.

### 4.7 Kapı eksikliği

`check-ready-for-dev` yalnız `phase = development` düğümleri kontrol ediyor. Tüm work_unit'ler requirements fazında olduğu için bu eksiklik görünmez. Ayrı bir "work_unit activation audit" gereklidir: production candidate work_unit'lerde traceability/test eksikse WARN, development'a alınırsa FAIL.

---

## 5. Unknown Unknowns Analizi

| Unknown unknown | Neden tehlikeli | Claude'un yapacağı probe |
|---|---|---|
| Gerçek platform repo path bilinmiyor | Work_unit kodlanamaz | Platform repo path ve modül yapısı doğrulanmalı |
| Work_unit sınırı fazla büyük | Claude component/feature kadar büyük diff üretir | Her work_unit tek function/class/test pack sınırına indirilmeli |
| Work_unit sınırı fazla küçük | Atom ile work_unit karışır, WBS şişer | Tek assertion atom, tek validator function work_unit kuralı |
| Mock sahte-yeşili | Unit test mock'un kendi dönüşünü test eder | High-risk'te gerçek adapter/testcontainer veya fake değil in-memory domain store |
| Parent-child evidence kopar | Atomlar geçer, component hâlâ çalışmaz | Work_unit evidence parent component AC'ye bağlanmalı |
| Generated CRUD bypass | Work_unit küçük diye mutation guard atlanır | Typed-action route testleri |
| Tenant context kaçakları | Tek helper eksikliği tüm app'leri sızdırır | Cross-tenant work_unit test pack |
| Migration helper sessiz data loss | Unit küçük görünür, prod data kaybı üretir | downgrade + rollback test pack |
| PDP/ECA sınırı belirsiz | ECA yetki kararı gibi davranabilir | PDP/ECA separation work_unit |
| Secret scan kapsamı düşük | Work_unit test fixture'ında gerçek secret kalır | gitleaks/secret_ref work_unit |
| Terminoloji drift devam eder | Claude `work_unit/component` sınırını karıştırır | level-based normalization kapısı |
| Work_unit'lerin sayısı yönetilemez | Her helper node olur, plan okunmaz | Sadece reusable/high-risk/shared work_unit node, sıradan helper parent içinde |
| İnsan onayı yorgunluğu | Her küçük work_unit onayı rubber-stamp olur | risk-tier approval policy |

---

## 6. Claude İçin Faz Faz Çalışma Emri

Aşağıdaki bölüm doğrudan Claude'a prompt olarak verilebilir.

### Rol

Sen kıdemli platform mimarı ve vibecoding denetçisisin. Görevin hemen kod yazmak değil; önce `work_unit / molekül` seviyesindeki WBS görevlerini gerçek kernel geliştirme işine çevirmek. Work_unit, parent component içinde yaşayan tekil fonksiyon/test birimidir. Work_unit'i feature veya component kadar büyütme; atom kadar da küçültme.

### Mutlak kurallar

1. `app` ve `module` seviyesinde kod yazma.
2. `work_unit` ayrı branch açmak zorunda değildir; parent component/feature branch'i içinde yaşayabilir.
3. Başlık "Element" veya "örnek kırılımı" ise production code task sayma.
4. `level` alanı başlıktan/metafordan üstündür.
5. `traceability.repoPath` ve `traceability.testCommand` yoksa kod yazmaya başlama.
6. Work_unit en az bir unit test ve bir negatif test taşır.
7. High-risk work_unit'lerde audit/PDP/outbox/idempotency/rollback evidence bekle.
8. Next.js, Supabase, Prisma kullanma.
9. AI ruleset/PDP/ECA/KMS/tenant guard override edemez.
10. Mock sahte-yeşili üretme; test gerçek davranışı yakalamalı.

### Faz 0 - Gerçeklik Kilidi

Çıktı: work_unit envanter tablosu.

Yap:

1. `public/data/nodes.json` içindeki tüm `level = work_unit` düğümlerini çıkar.
2. Sayı 18 olmalı.
3. Her biri için `id`, `title`, `parentId`, parent chain, child micro_step count, `phase`, `status`, `traceability`, `testCommand`, `evidence`, `standardRefs`, `dependsOn` alanlarını tabloya koy.
4. Başlığı "Element" veya "örnek kırılımı" olanları `CODE-NOT-READY` yap.
5. CRM work_unit'lerini `PARTIAL-READY` yap, ama eksik traceability/evidence durumunu açık yaz.

Kabul:

- 18 work_unit doğrulanır.
- 16 eski/örnek work_unit ayrılır.
- 17/18 traceability eksikliği raporlanır.
- 18/18 standardRefs boşluğu raporlanır.

### Faz 1 - Work_unit Sözleşmesi

Çıktı: Work_unit Definition of Ready ve Definition of Done.

Yap:

1. Work_unit'in tekil işlev/test pack sınırını yaz.
2. Work_unit ile component ve micro_step arasındaki farkı yaz.
3. Work_unit için minimum alanları belirle: function/class signature, repoPath, testCommand, child atoms, parent AC, standardRefs, negative tests.
4. Work_unit çok büyürse component'e; çok küçülürse micro_step'e taşınma kuralını yaz.

Kabul:

- Claude bir work_unit'i okuyunca hangi dosya ve hangi test üzerinde çalışacağını bilir.

### Faz 2 - Mevcut Work_unit'leri Sınıflandır

Çıktı: 18 work_unit için karar listesi.

Her work_unit için üç karardan birini ver:

1. `KEEP-AS-EXAMPLE`: granülerlik eğitimi, kod işi değil.
2. `PROMOTE-TO-REAL-WORK-UNIT`: gerçek function/class/test path ile üretim işine dönüştür.
3. `MERGE-INTO-PARENT`: work_unit node olarak gereksiz; parent component içinde test case olarak kalsın.

Özel kararlar:

- 16 `app-*-x-molekul` kaydı production work_unit sayılmamalı.
- `molekul-crm-score-weight-config` gerçek work_unit'e en yakın kayıt; evidence ve child micro_step eksik.
- `molekul-crm-score-field-validator` gerçek work_unit'e yakın; traceability eksik.
- `kum-crm-lead-dedup` için work_unit child'ları açılmalı.

### Faz 3 - Eksik Work_unit Backlog'unu Üret

Çıktı: kernel work_unit backlog taslağı.

Yukarıdaki Faz B, C, D, E, F tablolarını kullan. Her önerilen work_unit için şu formatta task taslağı üret:

```json
{
  "id": "wu-tenancy-fastapi-require-tenant",
  "level": "work_unit",
  "title": "FastAPI require_tenant dependency",
  "parentId": "<component_id>",
  "phase": "test-plan",
  "status": "todo",
  "summary": "X-Tenant-ID header'ını doğrulayan, tenant context'i set eden ve eksikte fail-closed dönen FastAPI dependency.",
  "acceptanceCriteria": [
    "Header yoksa 401 döner",
    "UUID formatı geçersizse 422 döner",
    "Geçerli tenant id context'e set edilir",
    "Testler guard yokken kırmızı, guard eklendikten sonra yeşil olur"
  ],
  "deliverables": [
    "backend/platform_tenancy/context.py",
    "backend/platform_tenancy/tests/test_require_tenant.py"
  ],
  "dependsOn": ["wu-tenancy-context-accessor"],
  "traceability": {
    "repoPath": ["platform/backend/platform_tenancy"],
    "testCommand": ["pytest backend/platform_tenancy/tests/test_require_tenant.py -v"],
    "implementationStatus": "not-started"
  }
}
```

Kabul:

- Her work_unit tek function/class/test pack sınırında.
- Her work_unit'in parent component'i var.
- Her work_unit'in en az iki child micro_step önerisi var.
- Her high-risk work_unit'in negatif test vektörü var.

### Faz 4 - Kapıları Work_unit Seviyesine Yaklaştır

Çıktı: kapı önerileri, önce WARN sonra FAIL ratchet.

Yap:

1. `work_unit` başlığı "Element" içerirse WARN.
2. `work_unit` phase `test-plan/development` olduğunda repoPath/testCommand yoksa FAIL.
3. Real component'in hiç work_unit child'ı yoksa WARN; production candidate ise FAIL.
4. Work_unit'in hiç child micro_step'i yoksa WARN; high-risk ise FAIL.
5. High-risk work_unit negatif test evidence olmadan parent done olursa FAIL.
6. `standardRefs` boşsa önce WARN, seçili kernel parents altında FAIL.

Kabul:

- Boş-yeşil kapı üretme.
- Denetleyecek kayıt yoksa "0 scoped" açık yazılsın.

### Faz 5 - İlk Golden Work_unit Slice

Çıktı: 1 component + 3-5 work_unit + her work_unit için 3-6 atom + PR/evidence paketi.

Önerilen ilk slice: Tenant Context.

Parent component önerisi: `cmp-tenancy-runtime-guard` veya mevcut uygun component altında.

Work_unit seti:

1. `wu-tenancy-context-accessor`
2. `wu-tenancy-fastapi-require-tenant`
3. `wu-tenancy-sqlalchemy-session-scope`
4. `wu-tenancy-cross-tenant-negative-tests`
5. `wu-tenancy-no-direct-header-read-lint`

Kabul:

- Her work_unit test-first.
- Unit tests yeşil.
- Cross-tenant negatif pack yeşil.
- Evidence parent component'e roll-up edildi.
- actionplan traceability geri yazma patch'i hazır.

### Faz 6 - Unknown Unknown Probes

Çıktı: risk defteri ve deney planı.

Yap:

1. Gerçek platform repo var mı netleştir.
2. Work_unit granülerliği için 5 örnek doğru, 5 örnek yanlış sınıflandırma üret.
3. Mock sahte-yeşilini yakalayan test politikası yaz.
4. Generated CRUD write bypass probe'u yaz.
5. Tenant leak probe'u yaz.
6. Work_unit sayısı yönetilebilirlik eşiğini yaz: hangi helper node olur, hangisi olmaz?
7. Approval fatigue için risk-tier approval öner.

---

## 7. Claude'a Verilecek Kısa Prompt

Aşağıdaki metin tek başına yapıştırılabilir:

```text
Bu repo actionplan WBS/sözleşme deposudur. Amacın hemen kod yazmak değil, work_unit / molekül seviyesindeki görevleri gerçek kernel vibecoding için kodlanabilir hale getirmektir.

Önce public/data/nodes.json içindeki tüm level=work_unit düğümlerini çıkar. Sayı 18 olmalı. Bunların 16'sı "Molekül - ... örnek kırılımı" ve production work_unit değildir. 18/18 requirements/backlog, 17/18 traceability yok, 18/18 standardRefs yok, 18/18 dependsOn boş. Bu bulguyu doğrula.

Sonra şu raporu üret:
1. Mevcut work_unit'lerin hangileri KEEP-AS-EXAMPLE, PROMOTE-TO-REAL-WORK-UNIT, MERGE-INTO-PARENT?
2. Work_unit Definition of Ready ve Definition of Done nedir?
3. Kernel v1, execution contract, kernel v2, KMS/tenant-lifecycle/metering/payment/realtime/DR eksikleri için hangi yeni work_unit'ler açılmalı?
4. Her önerilen work_unit için parentId, function/class/test sınırı, repoPath, testCommand, pozitif AC, negatif AC, child micro_step önerileri, high-risk flag ve evidence roll-up belirt.
5. Boş-yeşil kapı üretme. Denetlenecek kayıt yoksa bunu açıkça yaz.
6. Kod yazmaya ancak bir component için 3-5 work_unit'lik golden slice, her work_unit için test-first komutları ve traceability hazır olduğunda başla.

Mutlak kurallar: app/module seviyesinde kod yazma. work_unit ayrı branch açmak zorunda değildir; parent component/feature branch'i içinde yaşar. Başlık/metafor değil level alanı kanoniktir. Next.js/Supabase/Prisma kullanma. AI ruleset/PDP/ECA/KMS/tenant guard override edemez. High-risk work_unit'lerde negatif test önce kırmızı görülmeden "bitti" deme. Mock sahte-yeşili üretme.
```

---

## 8. Nihai Kabul Kriterleri

Bu raporun sonucunda Claude/ajan şu çıktıları üretmeden iş tamam sayılmaz:

1. Mevcut 18 work_unit için sınıflandırma tablosu.
2. Work_unit DoR/DoD sözleşmesi.
3. En az 60 yeni önerilen kernel work_unit'i, parent ve test komutlarıyla.
4. İlk golden slice için 3-5 uygulanabilir work_unit paketi.
5. Her work_unit için child micro_step önerileri.
6. `traceability.repoPath` ve `traceability.testCommand` doldurma planı.
7. Negative test vektörü olmayan high-risk work_unit kalmaması.
8. Terminoloji drift düzeltme planı: `work_unit = molekül`; eski seviye başlıkları production işlerde kullanılmaz.
9. Unknown unknown probes listesi.

Son cümle: Bugünkü work_unit seviyesi kernel vibecoding yürütmesi için zayıf halka. Eksik olan şey daha fazla genel açıklama değil; her work_unit'in tek function/class/test pack sınırıyla, child atomlarıyla, test-first komutuyla ve parent component evidence bağıyla gerçek koda bağlanmasıdır.
