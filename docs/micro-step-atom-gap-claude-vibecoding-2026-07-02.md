# Micro Step / Atom Gap Analizi ve Claude Vibecoding Raporu

Tarih: 2026-07-02  
Kapsam: `actionplan` WBS/sözleşme deposu, özellikle `level = micro_step` olan atom görevleri.  
Kullanım: Tarihsel gap raporu ve iyileştirme backlog'u olarak okunur; doğrudan kodlama promptu değildir. Güncel kodlama/handoff kaynağı `docs/developer-guide.md`, `docs/task-export-contract.md`, `docs/implementation-workspace-manifest.md` ve görev detay ekranındaki Developer Brief / Agent Prompt / Vobecoder Card exportlarıdır.
Amaç: Kernel geliştirildikten sonra atom seviyesindeki görev tanımlarında ne eksik, hangi atom görevleri eksik, hangi bilinmeyen-bilinmeyenler var ve Claude hangi fazlarla ilerlemeli sorularını tek raporda kapatmak.

---

## Güncel Statü Notu — 2026-07-08

Bu rapor 2026-07-02 anlık denetimidir. 2026-07-08 itibarıyla actionplan'da vibecoding handoff yüzeyi eklendi: Developer Brief, Agent Prompt, Evidence Patch, Vobecoder Card, implementation workspace manifesti ve `qa:vibecoding` kapısı yayındadır. Bu, rapordaki "hangi alan eksik" teşhisini tarihsel backlog olarak bırakır; ancak hiçbir micro_step/atom düğümünü otomatik code-start `GO` yapmaz. Güncel kural: `phase=development` + dolu `traceability.repoPath` + dolu `traceability.testCommand` + `implementationStatus != not-started` olmadan kod yazılmaz.

---

## 0. Tek Hüküm

Mevcut WBS'de `micro_step / atom` seviyesi kanonik olarak tanımlı, fakat gerçek kernel vibecoding yürütmesi için atom backlog'u yok denecek kadar zayıf. Veri setinde 467 düğüm var, yalnız 19 tanesi `micro_step`. Bu 19 atomun 16'sı "örnek kırılımı" niteliğinde, 19'unun tamamı `phase = requirements`, `status = backlog`, `traceability = null`, `standardRefs = null`, `dependsOn = []`. Yani atom seviyesi bugün "granülerlik demonstrasyonu" olarak var, "Claude'a ver, kodlasın" seviyesinde hazır değil.

En kritik ayrım: `micro_step` ayrı branch/PR açılacak iş değildir; üst `work_unit` veya `component` branch'i içinde yaşayan en küçük değişikliktir. Buna rağmen her atom tanımı, hangi dosyada hangi tek değişikliği yapacağını, hangi testin önce kırmızı sonra yeşil olacağını, hangi üst kanıta bağlanacağını ve hangi kernel invariantını koruduğunu açıkça taşımalıdır. Bugünkü atomlar bunu taşımıyor.

---

## 1. Ölçülmüş Mevcut Durum

Kaynak veri: `public/data/nodes.json`, `src/data/generated/nodes/*.json`, `src/schemas/task.ts`, `docs/task-to-code-contract.md`, `docs/ready-for-dev-gate.md`, `docs/gap-2026-07-02-01-kernel.md`.

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

Bu dağılımın sonucu: WBS yukarı seviye plan ve sözleşme açısından zengin, fakat atom seviyesinde gerçek iş kırılımı henüz yapılmamış.

### 1.2 Micro_step kalite ölçümü

| Ölçüt | Sonuç |
|---|---:|
| Toplam `micro_step` | 19 |
| `status = backlog` | 19/19 |
| `phase = requirements` | 19/19 |
| Başlığı "örnek kırılımı" olan | 16/19 |
| `traceability` olmayan | 19/19 |
| `traceability.repoPath` olmayan | 19/19 |
| `traceability.testCommand` olmayan | 19/19 |
| `standardRefs` boş/null | 19/19 |
| `dependsOn` boş | 19/19 |
| `evidence` boş | 17/19 |
| AC içinde test/kanıt eşlemesi geçen | 0/19 |
| 14 boyutu dolu | 19/19 |
| İnsan kaynaklı/review işaretli boyut | 3/19 |

Yorum: 14 boyutun dolu olması yanıltıcı. Çoğu swarm içerik üretimi. Atomun gerçek kod hedefi, test komutu, kabul kriteri-test eşlemesi ve platform dosya yolu yoksa `filled dimension` bir geliştirme hazır sinyali değildir.

### 1.3 Mevcut atom envanteri

Gerçek üretime yakın olanlar yalnız CRM pilot zincirindeki üç atomdur:

| Atom id | Başlık | Durum |
|---|---|---|
| `atom-crm-domain-blocklist` | Alan Adı Blok Listesi | Daha somut, ama traceability/test yok |
| `atom-crm-email-regex` | E-posta Format Regex | Daha somut, evidence var ama traceability/test yok |
| `atom-crm-score-range-check` | Skor Aralık Kontrolü | Daha somut, evidence var ama traceability/test yok |

Diğer 16 atom "Atom - ... örnek kırılımı" biçiminde. Bunlar üretim atom görevi sayılmamalı; yalnız granülerlik örneği olarak kalmalı ya da gerçek atomlara dönüştürülmeli.

Örnek niteliğindeki atomlar:

- `app-kernel-x-atom`
- `app-scale-x-atom`
- `app-layer1-x-atom`
- `app-backend-x-atom`
- `app-frontend-x-atom`
- `app-build-x-atom`
- `app-sus-x-atom`
- `app-crosscut-x-atom`
- `app-data-intelligence-x-atom`
- `app-platform-horizontal-x-atom`
- `app-customer-revenue-x-atom`
- `app-finance-x-atom`
- `app-supply-chain-x-atom`
- `app-hr-x-atom`
- `app-content-collaboration-x-atom`
- `app-vertical-x-atom`

---

## 2. Atom Görev Tanımlarında Eksik Olanlar

Her `micro_step / atom` görev tanımı aşağıdaki alanları taşımalı. Bugün bu alanların çoğu eksik veya jenerik.

| Eksik alan | Bugünkü durum | Gerekli düzeltme |
|---|---|---|
| Tek değişiklik tarifi | Başlıklar soyut: "Atom - Kernel örnek kırılımı" | "Şu dosyada şu tek invariantı ekle" düzeyinde netlik |
| Kod hedefi | `traceability.repoPath` yok | Platform/kernel repo yolu ve dosya deseni zorunlu |
| Test komutu | `traceability.testCommand` yok | Atomun bağlı olduğu parent test komutu veya doğrudan unit test komutu |
| AC-test eşlemesi | AC var ama test adı yok | Her kabul kriteri bir test fonksiyonuna veya test dosyasına bağlanmalı |
| Kırmızı-önce kanıtı | Yok | Negatif test önce kırmızı, implementasyon sonra yeşil olmalı |
| Parent roll-up | Parent iş kanıtı açık değil | Atom evidence üst `work_unit/component` evidence paketine bağlanmalı |
| Standard refs | 19/19 boş | En az architecture/testing/security/data-api/observability ref seti |
| DependsOn | 19/19 boş | Kod sırası, migration sırası, contract sırası belirtilmeli |
| Execution envelope | Yok veya boyut metninde soyut | `actor`, `tenant`, `policy`, `audit`, `idempotency`, `rollback`, `side_effect` eksenleri uygulanabilirliğe göre net |
| High-risk işaretleme | Yok | Para, stok, sipariş, yetki, sır, dış komut, migration atomları high-risk olmalı |
| Negatif test vektörü | Yok | Cross-tenant, missing tenant, duplicate idempotency, unauthorized actor, invalid signature vb. |
| Rollback ilişkisi | Jenerik | Atom ayrı rollback yapmazsa parent rollback yolu açıkça gösterilmeli |
| Human review | 16 atomda yok | Swarm çıktısı insan onayıyla kilitlenmeli veya `lastReviewed` yazılmalı |
| Terminoloji drift | Parent node başlıklarında eski seviye/metafor izleri var | Teknik level adı `component/work_unit/micro_step`; metafor kanonik Türkçe adlarla tooltip/metin olarak kalmalı |

Atom Definition of Ready:

1. `level = micro_step`.
2. Parent `work_unit` veya `component` net.
3. Başlık tek davranışı anlatıyor, "örnek kırılımı" içermiyor.
4. `traceability.repoPath` dolu.
5. `traceability.testCommand` dolu.
6. En az 2 acceptance criterion: biri pozitif, biri negatif.
7. En az 1 negatif test vektörü açık.
8. `dependsOn` gerekiyorsa dolu; gerekmiyorsa "bağımsız" gerekçesi notes/AC içinde var.
9. İlgili standardRefs dolu veya bilinçli `waiver` var.
10. Atomun evidence'ı üst work_unit/component evidence paketine nasıl roll-up olacak açık.

Atom Definition of Done:

1. İlgili test önce kırmızı görülmüş.
2. Tek değişiklik yapılmış veya atom baştan fazla büyükse iki atoma bölünmüş.
3. Test yeşil.
4. Negatif test yeşil.
5. Lint/typecheck yeşil.
6. Parent work_unit evidence güncellenmiş.
7. `traceability.implementationStatus` parent'ta en az `in-progress`, tamamlandıysa `implemented/verified`.

---

## 3. Hangi Atom Görevleri Eksik?

Bu bölümdeki id'ler öneridir. Bunlar bugünkü WBS'de yoktur veya yalnız üst seviye node olarak vardır; `micro_step` seviyesinde açılmalıdır. Hepsi ayrı branch olmak zorunda değildir; parent `work_unit/component/feature` branch'i içinde uygulanır.

### Faz A - Atom backlog aktivasyon görevleri

Önce WBS'nin kendisi atom kodlamaya hazır hale getirilmeli.

| Önerilen atom id | Eksik görev | Neden gerekli |
|---|---|---|
| `at-wbs-micro-step-dor-schema` | Atom DoR alanlarını TaskNode/kapı düzeyinde tanımla | "Atom hazır mı?" makinece anlaşılmalı |
| `at-wbs-micro-step-traceability-required` | `micro_step` için repoPath/testCommand uyarı kapısı | Bugün 19/19 eksik |
| `at-wbs-micro-step-ac-test-map` | AC maddesini test adıyla eşleştiren alan/konvansiyon | Claude promptu test-first çalışmalı |
| `at-wbs-example-atom-quarantine` | "örnek kırılımı" atomlarını kodlanamaz işaretle | Örnek atom yanlışlıkla geliştirme işi sanılmasın |
| `at-wbs-old-term-title-normalize` | Eski seviye/metafor başlık drift'ini temizle | Kanonik teknik ad ile metafor ayrılmalı |
| `at-wbs-standardrefs-ratchet-micro` | Atomlarda minimum standardRef setini kademeli zorla | 19/19 standardRefs boş |
| `at-wbs-parent-evidence-rollup` | Atom evidence üst work_unit/component'a nasıl yazılır tanımla | micro_step evidence opsiyonel olsa da parent kanıt zorunlu |

### Faz B - Kernel v1 zorunlu atomları

Core Contract Pack v1'in gerçek kod iskeleti için minimum atom seti.

#### Tenant Context

| Önerilen atom id | Eksik görev |
|---|---|
| `at-tenancy-contextvar-default-none` | `tenant_id` contextvar varsayılanı `None` ve fail-closed |
| `at-tenancy-get-tenant-missing-error` | `get_tenant_id()` tenant yoksa `TenantContextMissingError` fırlatır |
| `at-tenancy-require-tenant-header-missing-401` | `X-Tenant-ID` yoksa 401 testini yaz |
| `at-tenancy-require-tenant-invalid-422` | UUID formatı geçersizse 422 testini yaz |
| `at-tenancy-sqlalchemy-session-rls-setting` | SQLAlchemy session açılışında `app.current_tenant` set edilir |
| `at-tenancy-cross-tenant-negative-10` | En az 10 cross-tenant negatif test case |
| `at-tenancy-raw-tenant-header-forbidden` | Uygulama kodunun tenant header'ı doğrudan okumasını yasaklayan lint/test |

#### Identity/AuthZ/PDP

| Önerilen atom id | Eksik görev |
|---|---|
| `at-authn-jwt-rs256-only` | HS256 reddi, RS256 zorunluluğu testi |
| `at-authn-token-expiry-15m` | access token ömrü sınırı testi |
| `at-authz-require-permission-default-deny` | eşleşme yoksa deny |
| `at-authz-resolver-permission-required` | her GraphQL resolver permission taşımalı |
| `at-pdp-decision-shape` | `Decision{allow,reason,matched_policy_id}` tipini sabitle |
| `at-pdp-deny-overrides` | çatışmada deny kazanır testi |
| `at-pdp-decision-log-append-only` | decision_log UPDATE/DELETE reddi |
| `at-pdp-client-side-authz-forbidden` | frontend yetki hesaplayamaz, backend decision yansıtır |

#### Event Bus, Outbox, Idempotency

| Önerilen atom id | Eksik görev |
|---|---|
| `at-outbox-table-required-columns` | outbox tablo kolonları ve status enum |
| `at-outbox-publish-same-transaction` | domain write + outbox aynı transaction |
| `at-outbox-direct-redis-forbidden` | doğrudan Redis/Kafka publish yasağı |
| `at-idempotency-key-tenant-unique-index` | `(tenant_id, idempotency_key)` unique |
| `at-idempotency-replay-returns-same-result` | tekrar istek tek etki üretir |
| `at-outbox-worker-retry-backoff` | worker retry/backoff davranışı |
| `at-outbox-dlq-visible` | başarısız olay dead-letter kaydı |
| `at-event-no-exactly-once-claim` | exactly-once iddiası yasak, at-least-once/idempotent tüketim açık |

#### ECA Runtime

| Önerilen atom id | Eksik görev |
|---|---|
| `at-eca-rule-schema-typed` | event/condition/action şeması tipli |
| `at-eca-action-allowlist` | serbest JS/SQL/shell action yok |
| `at-eca-chain-depth-max-6` | zincir derinliği en fazla 6 |
| `at-eca-rule-fire-idempotent` | aynı olayda tekrar tetik tek etki |
| `at-eca-pdp-before-action` | ECA tetiklediği aksiyonda PDP'ye sorar |
| `at-eca-audit-every-fire` | her kural tetiklenmesi auditlenir |

#### Audit Log

| Önerilen atom id | Eksik görev |
|---|---|
| `at-audit-table-required-columns` | actor_id, actor_type, resource, action, trace_id vb. |
| `at-audit-revoke-update-delete` | audit_log update/delete DB seviyesinde yasak |
| `at-audit-hash-chain-prev-hash` | tamper-evident hash-chain alanı |
| `at-audit-actor-type-agent-user-system` | `agent/user/system` ayrımı |
| `at-audit-secret-redaction` | sır/PII loglanmaz |
| `at-audit-correlation-id-required` | her mutation auditinde trace/correlation id |

#### Migration Policy

| Önerilen atom id | Eksik görev |
|---|---|
| `at-migration-downgrade-non-empty` | `downgrade()` boş olamaz |
| `at-migration-expand-contract-lint` | aynı migration'da destructive contract yok |
| `at-migration-tenant-created-index` | `(tenant_id, created_at DESC)` index zorunlu |
| `at-migration-create-index-concurrently-large-table` | büyük tablo index pattern testi |
| `at-migration-rollback-test-command` | `alembic downgrade -1` CI komutu |

#### Observability

| Önerilen atom id | Eksik görev |
|---|---|
| `at-o11y-request-id-generate-or-propagate` | `X-Request-ID` yoksa üret, varsa taşı |
| `at-o11y-structured-log-required-fields` | log: trace_id, tenant_id, user_id, event |
| `at-o11y-no-print-logging` | `print()` ve raw logging yasağı |
| `at-o11y-metric-tenant-label` | metriklerde tenant label |
| `at-o11y-trace-sanitize-db-statement` | trace içinde PII/secret yok |

#### Module SDK

| Önerilen atom id | Eksik görev |
|---|---|
| `at-sdk-appmodule-abstract-methods` | slug/version/register_routes/register_graphql/on_startup/on_shutdown |
| `at-sdk-duplicate-module-error` | aynı slug ikinci kayıt reddedilir |
| `at-sdk-healthz-contract` | default healthz çıktı sözleşmesi |
| `at-sdk-no-direct-registry-mutation` | registry iç state'i dışarıdan değiştirilemez |

### Faz C - Execution Contract atomları

Kernel execution matrix kağıt üstünde güçlü, ama atom seviyesinde call-path görevleri eksik.

| Önerilen atom id | Eksik görev |
|---|---|
| `at-xc-envelope-actor-required` | her mutation actor taşır |
| `at-xc-envelope-tenant-required` | her mutation tenant taşır |
| `at-xc-envelope-policy-required` | her mutation PDP policy decision taşır |
| `at-xc-envelope-audit-required` | her mutation audit çağırır |
| `at-xc-labeled-write-idempotency-required` | financial/order/inventory yazmada idempotency zorunlu |
| `at-xc-labeled-write-rollback-required` | high-risk yazmada rollback/void/compensate zorunlu |
| `at-xc-generated-crud-write-forbidden` | generated CRUD INSERT/UPDATE/DELETE tanımlayamaz |
| `at-xc-typed-action-only-mutation` | mutasyon yalnız typed action/command üzerinden |
| `at-xc-surface-denied-button-not-rendered` | PDP deny ise buton render edilmez |
| `at-xc-ai-draft-approval-ref-required` | AI draft apply için `approval_ref` zorunlu |
| `at-xc-high-risk-negative-evidence-required` | yüksek riskli action negatif test + evidence olmadan merge edilemez |

### Faz D - Kernel v2 ve scale atomları

| Primitif | Eksik atom görevleri |
|---|---|
| Actor/Party | party kind enum, role binding effective date, revoke audit, relation depth limit |
| Capability | capability key uniqueness, plan-capability mapping, disabled capability 404, entitlement audit |
| Mode Profile | preview, dry-run, diff, apply approval, rollback previous profile |
| Computation | pure operator allowlist, no side-effect, versioned formula, deterministic replay |
| Field Types | Money Decimal/HALF_UP, Measure dimension check, I18nText fallback, Email/Phone canonicalization |
| Scale Invariant | WritePolicy default-on, waiver expiry, outbox required, idempotency required, audit hash-chain |
| Sequence | reserve, commit, void, no MAX+1, idempotent commit |
| Calendar/Capacity | business day arithmetic, holiday overlay, capacity exception, timezone edge case |
| Genealogy | immutable edge, recall traversal, cycle reject, tenant-scoped graph |
| Edge Gateway | offline buffer, command approval_ref, idempotent sync, device tenant binding |
| KPI Registry | formula version, tenant cannot mutate system KPI, computation engine use |
| APS Solver | proposal only, no onaysız apply, capacity constraints, deterministic seed |
| Surface Runtime | render_strategy enum, cache key tenant/policy aware, custom escape audit |
| Jurisdiction | six axes independent, data residency fail-closed, locale/currency/tax not conflated |

### Faz E - Bugünkü gap raporlarının söylediği eksik kernel primitifleri

Bu görevler sadece module/feature olarak değil, atom seviyesinde de açılmalı.

| Önerilen atom id | Eksik görev |
|---|---|
| `at-kms-secret-ref-shape` | `secret_ref` formatı ve scope |
| `at-kms-no-inline-secret` | inline secret reddi ve secret scan |
| `at-kms-runtime-resolve-only` | sır yalnız runtime bellek içinde çözülür |
| `at-kms-rotation-policy` | rotation schedule + old/new overlap |
| `at-kms-envelope-encryption` | envelope encryption sözleşmesi |
| `at-kms-access-audit` | her secret resolve auditlenir |
| `at-tenant-lifecycle-state-machine` | provision/suspend/offboard/export/delete states |
| `at-tenant-export-portability` | tenant export kanıtı |
| `at-tenant-hard-delete-legal-hold-check` | legal hold varsa silme reddi |
| `at-metering-usage-event-schema` | usage_event şeması |
| `at-metering-idempotent-usage-collection` | tekrar kullanım olayı tek sayılır |
| `at-metering-quota-enforcement` | quota aşımı fail-closed |
| `at-payment-provider-type` | PSP provider enum/adaptör tipi |
| `at-payment-webhook-signature` | PSP callback signature doğrulama |
| `at-payment-idempotent-callback` | aynı callback tek işlem |
| `at-inbound-webhook-replay-window` | timestamp/replay penceresi |
| `at-inbound-webhook-dlq` | doğrulanamayan callback DLQ |
| `at-realtime-tenant-channel-auth` | WebSocket/SSE tenant kanal yetkisi |
| `at-realtime-backpressure-policy` | fanout backpressure davranışı |
| `at-media-virus-scan-before-publish` | dosya/medya publish öncesi tarama |
| `at-media-image-variant-contract` | image variant üretim sözleşmesi |
| `at-dr-pitr-restore-drill` | PITR restore test kanıtı |
| `at-backup-tenant-restore-scope` | tek tenant restore sınırı |

### Faz F - Golden evidence pack atomları

İlk gerçek vibecoding dikey dilimi için WBS'de bu atomlar olmadan "kernel geliştirildi" denmemeli.

| Önerilen atom id | Eksik görev |
|---|---|
| `at-golden-repo-path-bind` | actionplan node -> gerçek platform repo path doğrulama |
| `at-golden-test-command-bind` | actionplan node -> çalışan test command doğrulama |
| `at-golden-red-green-log` | kırmızı-yeşil test log formatı |
| `at-golden-pr-url-evidence` | PR URL evidence formatı |
| `at-golden-ci-url-evidence` | CI run URL evidence formatı |
| `at-golden-deploy-target-evidence` | staging/prod deployTarget evidence |
| `at-golden-rollback-log-evidence` | rollback test log evidence |
| `at-golden-audit-ref-evidence` | audit event id evidence |
| `at-golden-cross-tenant-evidence` | cross-tenant negatif test evidence |

---

## 4. Eksiklik Analizi

### 4.1 İçerik eksikliği

Atomların çoğu şunu söylüyor: "bu seviye atom seviyesidir." Bu bir iş tanımı değildir. Claude için atom tanımı şunu söylemeli: "şu invariantı şu dosyada uygula, şu test önce kırmızı sonra yeşil olmalı." Bugün bu yok.

### 4.2 Yürütme eksikliği

`task-to-code-contract.md` micro_step'i kodlanabilir sayıyor, fakat ayrı branch açılmayacağını belirtiyor. Bu yüzden atom görevleri üst parent evidence'a bağlanmalı. Bugünkü micro_step node'larında parent evidence roll-up yok.

### 4.3 Kapı eksikliği

`check-ready-for-dev` yalnız `phase = development` düğümleri kontrol ediyor. Mevcut atomların tamamı `requirements` olduğu için kapı boş geçiyor. Bu tasarım doğru olabilir, ama atom backlog'unun "geliştirmeye hazırlanmadığını" görünür kılan ayrı bir audit gerekiyor.

### 4.4 Semantik eksikliği

Teknik seviye adları kanonik: `component`, `work_unit`, `micro_step`. Veri başlıklarında hâlâ kanonik olmayan eski seviye/metafor izleri var. Bu, Claude promptlarında seviye/metafor karışıklığı yaratır.

### 4.5 Güvenlik eksikliği

Atom seviyesinde high-risk sınıflandırması yok. Halbuki sır, para, stok, sipariş, tenant, PDP, audit, outbox, migration, external command atomları aynı atom büyüklüğünde olsa da riskleri farklıdır. Risk sinyali yoksa Claude basit refactor gibi davranır.

### 4.6 Test eksikliği

Kabul kriterleri test fonksiyonlarına bağlı değil. "tenant izolasyonu geçti" yazıyor, ama hangi test? Kaç cross-tenant case? Hangi command? Hangi log? Yok.

---

## 5. Unknown Unknowns Analizi

| Unknown unknown | Neden tehlikeli | Claude'un yapacağı probe |
|---|---|---|
| Gerçek kernel/platform kod reposu nerede? | Bu repo plan/sözleşme; gerçek kod görülmeden implementation gap ölçülemez | Local ve GitHub repo path'ini bul, `traceability.repoPath` ile bağla |
| Atom sayısı patlaması | Her line-item atom yapılırsa WBS yönetilemez | Atomları parent work_unit altında test-vektörü olarak grupla; yalnız kritik invariantlar node olsun |
| Test sahte-yeşil riski | AI mock/assert-true ile kanıt üretir | Her high-risk atom için kırmızı-önce negatif test zorunlu |
| Tenant izolasyonu default leak | Tek eksik guard tüm ürünlere sızar | En az 10 cross-tenant negatif case |
| Migration rollback sahte | `downgrade()` var ama veri geri alınmıyor olabilir | Gerçek `upgrade -> downgrade -> upgrade` smoke |
| PDP ile ECA karışması | Otomasyon yetki yerine geçerse bypass açılır | ECA action öncesi PDP atom testi |
| Generated CRUD mutasyon yolu | En büyük güvenlik bypassı | CRUD write path static/dynamic test |
| Secret handling drift | Her app kendi `.env`/secret yaklaşımını üretir | `k-kms` secret_ref ve gitleaks atomları |
| İnsan onayı rubber-stamp olur | 3 kişilik ekip yüzlerce AI diffini okuyamaz | Approval UI/engine ve risk-tier atomları |
| Legal hold ve retention çatışması | Silinemez veri ile saklama limiti çakışır | conflict resolver test atomu |
| Shared hosting iddiası | FastAPI/Postgres/Docker klasik cPanel ile uyumsuz olabilir | deployment topology decision atomu |
| StandardRefs boşluğu | Düğüm hangi standarda tabi bilinmez | ratchet: önce app/module, sonra atom |
| Evidence geri-yazma unutulur | Kod biter ama actionplan gerçeği bilmez | evidence patch atomları |

---

## 6. Claude İçin Faz Faz Çalışma Emri

Aşağıdaki bölüm doğrudan Claude'a prompt olarak verilebilir.

### Rol

Sen kıdemli platform mimarı ve vibecoding denetçisisin. Görevin kodu hemen yazmak değil; önce atom seviyesindeki WBS görevlerini gerçek kernel geliştirme işine çevirmek. `actionplan` plan/sözleşme deposudur. Gerçek kod `platform` veya kernel monorepo'da yaşar. Bu iki dünya arasında izlenebilirlik kurulmadan hiçbir atomu "kodlanabilir" sayma.

### Mutlak kurallar

1. `app` ve `module` seviyesinde kod yazma.
2. `micro_step` ayrı branch değildir; parent `work_unit/component/feature` içinde yaşar.
3. Atom başlığı "örnek kırılımı" ise onu üretim işi sayma.
4. `traceability.repoPath` ve `traceability.testCommand` yoksa Claude kod yazmaya başlamaz.
5. High-risk atomlarda negatif test önce kırmızı görülmeden "bitti" denmez.
6. Next.js, Supabase, Prisma kullanma.
7. Ruleset, CI, PDP, ECA, KMS, tenant guard override edilemez.
8. AI sadece draft önerir; insan onayı ve CI kanıtı olmadan production state değişmez.

### Faz 0 - Gerçeklik Kilidi

Çıktı: `micro_step` envanter tablosu.

Yap:

1. `public/data/nodes.json` üzerinden tüm `level = micro_step` düğümlerini listele.
2. Her biri için şu alanları tabloya koy: `id`, `title`, `parentId`, parent chain, `phase`, `status`, `traceability`, `testCommand`, `evidence`, `standardRefs`, `dependsOn`.
3. "Örnek kırılımı" olanları `CODE-NOT-READY` olarak işaretle.
4. CRM atomlarını `PARTIAL-READY` olarak işaretle, çünkü daha somutlar ama traceability yok.
5. Gerçek platform/kernel repo path'ini bulamıyorsan raporu durdurma; "CODE-REPO-UNKNOWN" olarak açık risk yaz.

Kabul:

- Sayı 19 micro_step olarak doğrulanır.
- 19/19 traceability eksikliği raporlanır.
- 16 örnek atom ayrı sınıflanır.

### Faz 1 - Atom Görev Sözleşmesi

Çıktı: Atom Definition of Ready ve Atom Definition of Done.

Yap:

1. Atom task için minimum alanları tanımla: exact change, file path, test function, negative vector, parent roll-up, standardRefs, high-risk flag.
2. `task-to-code-contract.md` ile çelişme: atom evidence doğrudan zorunlu olmasa bile parent evidence roll-up zorunlu olsun.
3. "Bir atom ne zaman iki atoma bölünür?" kuralını yaz: tek testten fazla bağımsız invariant varsa böl.
4. "Atom bağımsız PR açmaz" kuralını açık tut.

Kabul:

- Claude bir atomu okuyunca hangi dosyaya dokunacağını ve hangi testi çalıştıracağını bilir.
- Atom scope'u tek değişiklik sınırında kalır.

### Faz 2 - Mevcut Atomları Temizle

Çıktı: mevcut 19 atom için karar listesi.

Her atom için üç karardan birini ver:

1. `KEEP-AS-EXAMPLE`: granülerlik eğitimi, kod işi değil.
2. `PROMOTE-TO-REAL-ATOM`: gerçek code path ve test ile üretim atomuna dönüştür.
3. `MERGE-INTO-PARENT`: atom node olarak fazla zayıf, parent work_unit içinde test case olarak yaşasın.

Özel karar:

- `app-kernel-x-atom` gerçek kernel işi değildir; örnek olarak kalır veya gerçek atomlara bölünür.
- CRM atomları gerçek atom olmaya en yakın olanlardır; önce traceability ve testCommand eklenmeli.

Kabul:

- "Örnek kırılımı" atomlarından hiçbiri Claude'a kod görevi olarak verilmez.

### Faz 3 - Eksik Atom Backlog'unu Üret

Çıktı: kernel atom backlog taslağı.

Yukarıdaki Faz B, C, D, E, F tablolarını kullan. Her önerilen atom için şu formatta task taslağı üret:

```json
{
  "id": "at-tenancy-require-tenant-header-missing-401",
  "level": "micro_step",
  "title": "Tenant header yoksa require_tenant 401 döner",
  "parentId": "<work_unit_id>",
  "phase": "test-plan",
  "status": "todo",
  "acceptanceCriteria": [
    "X-Tenant-ID header yokken endpoint 401 döner",
    "Test önce require_tenant guard yokken kırmızı, guard eklendikten sonra yeşil olur"
  ],
  "deliverables": [
    "backend/platform_tenancy/context.py",
    "backend/platform_tenancy/tests/test_require_tenant.py"
  ],
  "traceability": {
    "repoPath": ["platform/backend/platform_tenancy"],
    "testCommand": ["pytest backend/platform_tenancy/tests/test_require_tenant.py -k missing_header -v"],
    "implementationStatus": "not-started"
  }
}
```

Kabul:

- Her atomda en az bir pozitif ve bir negatif test kriteri var.
- Her atom parent work_unit/component'a bağlı.
- Her high-risk atomda explicit negative vector var.

### Faz 4 - Kapıları Atom Seviyesine Yaklaştır

Çıktı: kapı önerileri, önce warn sonra fail ratchet.

Yap:

1. `micro_step` için "örnek atom kodlanamaz" uyarı kapısı.
2. `micro_step` phase `test-plan/development` olduğunda repoPath/testCommand zorunlu.
3. `micro_step` title "örnek kırılımı" içerip phase `development` olursa fail.
4. High-risk atomlarda negative test evidence olmadan parent done olursa fail.
5. `standardRefs` boşluğunu önce WARN, sonra selected parentlarda FAIL yap.

Kabul:

- Boş-yeşil kapı üretme.
- Denetleyecek kayıt yoksa rapor "0 scoped" diye açık yazsın.

### Faz 5 - İlk Golden Slice

Çıktı: 1 parent work_unit + 5-10 gerçek atom + PR/evidence paketi.

Önerilen ilk slice: Tenant Context veya Money atomu. Tenant Context daha kernel-kritik, Money daha kolay testlenir.

Tenant Context slice örneği:

1. `at-tenancy-contextvar-default-none`
2. `at-tenancy-get-tenant-missing-error`
3. `at-tenancy-require-tenant-header-missing-401`
4. `at-tenancy-require-tenant-invalid-422`
5. `at-tenancy-sqlalchemy-session-rls-setting`
6. `at-tenancy-cross-tenant-negative-10`

Kabul:

- Testler önce kırmızı.
- Kod sonrası yeşil.
- CI URL veya local test log evidence var.
- actionplan parent node evidence güncellendi.

### Faz 6 - Unknown Unknown Probes

Çıktı: risk defteri ve deney planı.

Yap:

1. Gerçek platform repo var mı, yok mu netleştir.
2. Shared hosting iddiası hangi deploy topolojisini kastediyor, karar yaz.
3. Legal hold vs retention conflict için test senaryosu yaz.
4. Generated CRUD write bypass için statik/dinamik test yaz.
5. Approval fatigue için risk-tier approval motoru öner.
6. Atom sayısı yönetilebilir mi, parent grouping stratejisi yaz.

Kabul:

- Her unknown unknown için en az bir "probe test" veya "insan kararı" var.

---

## 7. Claude'a Verilecek Kısa Prompt

Aşağıdaki metin tek başına yapıştırılabilir:

```text
Bu repo actionplan WBS/sözleşme deposudur. Amacın hemen kod yazmak değil, micro_step / atom seviyesindeki görevleri gerçek kernel vibecoding için kodlanabilir hale getirmektir.

Önce public/data/nodes.json içindeki tüm level=micro_step düğümlerini çıkar. Sayı 19 olmalı. Bunların 16'sı "örnek kırılımı" ve production atom görevi değildir. 19/19 traceability yok, 19/19 standardRefs yok, 19/19 requirements/backlog durumundadır. Bu bulguyu doğrula.

Sonra şu raporu üret:
1. Mevcut atomların hangileri KEEP-AS-EXAMPLE, PROMOTE-TO-REAL-ATOM, MERGE-INTO-PARENT?
2. Atom Definition of Ready ve Definition of Done nedir?
3. Kernel v1, execution contract, scale/v2 primitives, KMS/tenant-lifecycle/metering/payment eksikleri için hangi yeni micro_step atomları açılmalı?
4. Her önerilen atom için parentId, exact change, repoPath, testCommand, pozitif AC, negatif AC, high-risk flag ve evidence roll-up belirt.
5. Boş-yeşil kapı üretme. Denetlenecek kayıt yoksa bunu açıkça yaz.
6. Kod yazmaya ancak bir parent work_unit için 5-10 atomluk golden slice, test-first komutları ve traceability hazır olduğunda başla.

Mutlak kurallar: app/module seviyesinde kod yazma. micro_step ayrı branch açmaz, parent branch içinde yaşar. Next.js/Supabase/Prisma kullanma. AI ruleset/PDP/ECA/KMS/tenant guard override edemez. High-risk atomlarda negatif test önce kırmızı görülmeden "bitti" deme.
```

---

## 8. Nihai Kabul Kriterleri

Bu raporun sonucunda Claude/ajan şu çıktıları üretmeden iş tamam sayılmaz:

1. Mevcut 19 atom için sınıflandırma tablosu.
2. Atom DoR/DoD sözleşmesi.
3. En az 50 yeni önerilen kernel atomu, parent ve test komutlarıyla.
4. İlk golden slice için 5-10 atomluk uygulanabilir paket.
5. `traceability.repoPath` ve `traceability.testCommand` doldurma planı.
6. Negative test vektörü olmayan high-risk atom kalmaması.
7. Unknown unknown probes listesi.
8. Hangi atomların sadece eğitim/örnek olduğu ve kodlanmayacağı açık karar.

Son cümle: Bugünkü atom seviyesi "ada'dan atom'a metafor zinciri" olarak doğru, fakat kernel vibecoding yürütmesi için eksik. Eksik olan şey daha fazla genel açıklama değil; her atomun tek dosya/tek invariant/tek negatif test/tek parent evidence bağıyla gerçek koda bağlanmasıdır.
