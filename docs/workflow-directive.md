# Workflow Yönergesi — Birinci Sınıf İş Akışı Motoru (Durum Makinesi + Onay + SLA + Eskalasyon)

**Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor) — insan onayı ile kilitlenecek.
**Gerekçe:** `archetype-uretim-spec.md §2`, Workflow'u Surface'in kardeşi ve ArcheType'tan **ayrı versiyonlanan** birinci sınıf kavram olarak adlandırır (`src/schemas/archetype.ts` `LinkedRefSchema` + `linkedWorkflows` alanı bunu şema düzeyinde de doğrular). Ancak bugüne kadar bu referansın çözüldüğü bir motor sözleşmesi **yoktu**: `LifecycleSchema` (`src/schemas/archetype.ts` satır ~209-215) yalnız `states/initial/transitions+guard` taşıyan basit doğrusal durum makinesidir; paralel dal, SLA sayacı, eskalasyon ve ayrık görev-onayı kapsamaz. `gap-2026-07-02-02-archetype.md §4 G-A1` bunu P0 (bloklayıcı) boşluk olarak işaretler: "Workflow her yerde birinci sınıf kavram olarak adlandırılır ama yönergesi hiç yoktur." Bu doküman o boşluğu kapatır ve `src/schemas/surface.ts`'teki mevcut `WorkflowContractSchema`'yı (satır ~78-111) ArcheType-bağımsız, backend-desteli tam bir motor sözleşmesine dönüştürür.
**Etkilenen ürünler:** Onay zinciri, çok-adımlı süreç veya SLA/eskalasyon gerektiren **her** ürün bu motora bağımlıdır. Somut örnekler: PMS (rezervasyon onay/iptal/check-in-check-out durum zinciri), HRMS (izin/masraf/işe-alım onay zinciri, ayrık onaycı), accounting (fatura/ödeme onay zinciri, dönem-kapatma adımları), CLM/Agreement (sözleşme müzakere-onay-imza durum makinesi, karşı-taraf beklemesi). Bu ürünlerin hiçbiri bugün gerçek bir workflow motoruna değil, boşta bir referansa (`linkedWorkflows`) güvenmektedir.

---

## 1. Amaç

Çok-adımlı iş süreçlerini — durum + geçiş + geçiş koşulu (guard) + geçişte tetiklenen aksiyon + insan onayı + zaman-aşımı (SLA) + eskalasyon + paralel dal (fork/join) — **veri olarak** modelleyen, ArcheType ve Surface'ten **ayrı versiyonlanan** tek bir motor sabitlemek. Hedef: 18 üründen hiçbirinin kendi durum-geçiş kodunu, kendi SLA zamanlayıcısını veya kendi onay-sırası mantığını yeniden yazmaması; her çok-adımlı süreç `workflow_def` içinde bir kez tanımlanıp `workflow_instance` olarak çalıştırılması. Aktör-açık ifade: *insan* (süreç sahibi) tanımı hazırlar, *AI* taslak/iyileştirme önerir, *insan* onaylar, *motor* onaylı tanımı deterministik uygular.

## 2. Kapsam

Bu yönerge kapsar: (1) `workflow_def` (sürümlü tanım: durumlar, başlangıç, bitiş, geçişler), (2) `workflow_transition` (geçiş kuralı: kaynak/hedef durum, tetikleyici olay, guard, aksiyon, onay gereksinimi, SLA süresi), (3) `workflow_instance` (bir ArcheType kaydına bağlı, çalışan tanım örneği), (4) `workflow_task` (bir onay/iş adımının atanmış görevi: sorumlu, son tarih, eskalasyon kuralı), (5) paralel dal (fork/join) semantiği, (6) SLA sayacı ve eskalasyon zinciri, (7) onay adımlarında görev-ayrımı (separation of duties — aynı kişinin hem talep eden hem onaylayan olamaması), (8) ECA ruleset paket kataloğuna (`src/schemas/ruleset.ts`) referans bağı, (9) WBS yerleşimi ve bağımlılık, (10) çok-kiracılı izolasyon ve AI sınırları. Bir *yönerge* (mimari tarif) verir; implementasyon kodunu ajanlar ilgili plan promptlarıyla yazar.

## 3. Non-goals (kapsam dışı)

Bu yönerge şunları **yapmaz**: **(1)** UI çizimi yapmaz — bir workflow'un durumunun ekranda nasıl gösterileceği (board/timeline/liste) Surface'in işidir (`src/schemas/surface.ts` `SurfaceContractSchema`); Workflow yalnız durum/geçiş verisini sağlar. **(2)** İş hesaplaması yapmaz — bir onay tutarının hesaplanması, vergi/fiyat türetimi `platform_computation`'ın (Computation/Derivation, `core-contract-pack.md §3.5`) işidir; Workflow guard içinde bu sonucu *okur*, hesaplamaz. **(3)** Kalıcı olay-arşivi/event-replay motoru değildir — her geçiş audit'lenir (`core-contract-pack.md §2.5`) ama uzun-vadeli olay-kaynaklı (event-sourcing) yeniden-oynatma bu sözleşmenin kapsamı dışıdır. **(4)** Yetki kararı vermez — bir onaycının o eylemi yapıp yapamayacağı `k-policy-pdp`'nin işidir (`docs/pdp-policy-contract.md`); Workflow yalnız "bu geçiş onay ister" der, "kim onaylayabilir" kararını PDP'ye sorar. **(5)** Otomasyonu kendi içinde yeniden yazmaz — bildirim/hatırlatma/entegrasyon gibi yan-etkiler ECA ruleset paketlerine (`src/schemas/ruleset.ts`) referansla bağlanır, Workflow motoru içinde serbest kodla tekrarlanmaz.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Workflow, bir ArcheType kaydının çok-adımlı davranışını (durum makinesi + geçiş + onay + zaman-aşımı) tanımlayan, ArcheType'ın alan şemasından ve Surface'in görsel şemasından **ayrı sürümlenen** birinci sınıf sözleşmedir. `LifecycleSchema`'nın (basit doğrusal durum makinesi) üstünde durur; paralel dal, SLA ve eskalasyon taşıyan süreçler için `LifecycleSchema` yetmez, `workflow_def` gerekir.

**Ne yapar:** Bir sürecin durumlarını ve aralarındaki geçişleri veri olarak tanımlar; her geçişi bir olay (`on`), isteğe bağlı bir koşul (`guard`) ve isteğe bağlı bir aksiyona (`action`) bağlar; bir geçişi insan onayına zorunlu kılar (`requiresApproval`); bir durumda geçirilebilecek azami süreyi (SLA) sayar ve aşımda eskalasyon zincirini tetikler; birden çok dalın eşzamanlı yürütülmesini (fork) ve hepsinin tamamlanmasını bekleyen birleşme noktasını (join) tanımlar; her `workflow_instance`'ı belirli bir ArcheType kaydına (`aggregate_ref`) bağlar; her durum geçişini audit'ler.

**Ne yapmaz:** Generated CRUD'un (otomatik üretilen kayıt yönetimi endpoint'i) bir ArcheType kaydının durum alanını doğrudan (`PATCH`) yazmasına izin vermez — durum yalnız tanımlı `workflow_transition` üzerinden, motor tarafından değiştirilir. Bir geçişi onaysız "yürürlüğe" sokmaz — `requiresApproval=true` işaretli geçiş, `approval_ref` gelmeden `workflow_instance`'ı ilerletemez. Ölü-durum (hiçbir geçişi olmayan, terminal olmayan durum) veya döngü (bir durumdan çıkışın yine kendisine dönmesi, guard'sız) içeren tanımı sessizce kabul etmez — tanım-doğrulama aşamasında reddeder. AI'ın workflow tanımını kilitlemesine (aktive etmesine) izin vermez.

## 5. Sözleşme şekli (backend — PostgreSQL + SQLAlchemy 2.0/SQLModel + Alembic + FastAPI)

Aşağıdaki dört tablo, Workflow motorunun kalıcı veri modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek (mock) vermez. Tipler PostgreSQL / SQLAlchemy 2.0 karşılıklarıdır. `src/schemas/surface.ts` içindeki mevcut `WorkflowContractSchema` (`id/name/description/version/archetypeRef/states/initial/terminalStates/transitions/rulesetRefs/approvals/slaHours`) bu tablonun **frontend/katalog-tarafı** karşılığıdır; bu bölüm onu archetype-bağımsız, backend-şema düzeyine taşır ve çalışan örnek (`workflow_instance`) ile atanmış görev (`workflow_task`) kavramlarını ekler. Her tablo `tenant_id` taşır ve RLS zorunludur (§9).

Bu tablo `workflow_def` (sürümlü tanım) alanlarını verir; `WorkflowContractSchema.states/initial/terminalStates` alanlarının backend karşılığıdır.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Tanımın benzersiz kimliği |
| `tenant_id` | UUID (indexed, nullable) | Tanımın kapsamı; NULL = platform-genel paylaşılan tanım, dolu = tenant'a özel varyant |
| `key` | Text | İnsan-okur, sürümler-arası sabit anahtar (ör. `agreement-approval`); `WorkflowContractSchema.id`'ye karşılık gelir |
| `version` | Text (semver) | Tanım sürümü; ArcheType ve Surface'ten **ayrı** artar |
| `archetype_ref` | Text (nullable) | Hangi ArcheType'a projekte edildiği ("" = jenerik/paylaşılan şablon); `WorkflowContractSchema.archetypeRef` |
| `states` | JSONB (Text[] doğrulanmış) | Durum kümesi; en az 2 durum zorunlu |
| `initial_state` | Text | Başlangıç durumu; `states` üyesi olmalı |
| `terminal_states` | JSONB (Text[]) | Bitiş durumları; her biri `states` üyesi olmalı |
| `status` | Enum(draft, locked, deprecated) | Tanımın yaşam evresi; yalnız `locked` tanım örnek başlatabilir (§6 AI guardrail) |
| `approval_ref` | UUID (nullable) | Tanımı `locked` yapan insan onayı; `draft` iken NULL |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

Bu tablo `workflow_transition` (geçiş kuralı) alanlarını verir; `WorkflowTransitionSchema` (`from/to/on/guard/action/requiresApproval`) alanlarının backend karşılığıdır ve SLA/eskalasyon/paralel-dal alanlarıyla genişler.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Geçiş kuralının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `workflow_def_id` | UUID (FK → workflow_def.id) | Ait olduğu tanım |
| `from_state` | Text | Kaynak durum; `workflow_def.states` üyesi olmalı |
| `to_state` | Text | Hedef durum; `workflow_def.states` üyesi olmalı |
| `on_event` | Text | Geçişi tetikleyen olay adı (ör. `submitted`, `approved`); `WorkflowTransitionSchema.on` |
| `guard` | Text (nullable) | Geçiş koşulu (yapısal ifade referansı; serbest kod değil); boş = koşulsuz |
| `action_ref` | Text (nullable) | Geçişte tetiklenecek ECA ruleset paket referansı (§8); `WorkflowTransitionSchema.action`'ın backend karşılığı |
| `requires_approval` | Boolean (default false) | Bu geçiş insan onayı gerektirir mi |
| `approver_role` | Text (nullable) | `requires_approval=true` ise onaycı rolü; PDP'nin `evaluate` çağrısına girdi (§11) |
| `sla_hours` | Numeric (nullable) | Bu geçişin `from_state`'te azami bekleme süresi; NULL = SLA yok |
| `escalation_ref` | UUID (nullable, FK → escalation_rule.id) | SLA aşımında tetiklenecek eskalasyon zinciri (§7) |
| `fork_group` | Text (nullable) | Doldurulmuşsa bu geçiş bir paralel dal grubunun parçasıdır (§7 fork/join) |
| `join_policy` | Enum(all, any, quorum) (nullable) | `fork_group` bir join noktasındaysa birleşme kuralı: tüm dallar / herhangi biri / eşik sayı |

Bu tablo `workflow_instance` (çalışan örnek) alanlarını verir; bir `workflow_def`'in belirli bir ArcheType kaydına bağlı canlı durumunu taşır.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Örneğin benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; her örnek tek tenant'a aittir |
| `workflow_def_id` | UUID (FK → workflow_def.id) | Hangi tanımdan başlatıldı |
| `aggregate_type` | Text | Bağlı olduğu ArcheType kimliği (ör. `agreement`, `leave-request`) |
| `aggregate_ref` | UUID | Bağlı olduğu ArcheType kaydının id'si |
| `current_state` | Text | Örneğin şu anki durumu; yalnız motor değiştirir |
| `active_forks` | JSONB | Açık paralel dal grupları ve her dalın durumu (fork/join takibi) |
| `started_at` | TIMESTAMPTZ (NOT NULL) | Örnek başlangıcı |
| `state_entered_at` | TIMESTAMPTZ (NOT NULL) | Şu anki duruma girilen an; SLA sayacının başlangıcı |
| `completed_at` | TIMESTAMPTZ (nullable) | Terminal duruma ulaşma anı; NULL = hâlâ akışta |

Bu tablo `workflow_task` (atanmış onay/iş görevi) alanlarını verir; SLA/eskalasyon ve görev-ayrımının somutlaştığı katmandır.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Görevin benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `workflow_instance_id` | UUID (FK → workflow_instance.id) | Ait olduğu çalışan örnek |
| `transition_id` | UUID (FK → workflow_transition.id) | Görevin karşılık geldiği geçiş kuralı |
| `assignee_ref` | UUID (nullable) | Atanan aktör (`platform_actor.Party`); NULL = role-havuzu, ilk alan çözer |
| `requested_by_ref` | UUID | Talebi başlatan aktör; görev-ayrımı denetiminde `assignee_ref` ile karşılaştırılır (§10) |
| `status` | Enum(pending, approved, rejected, expired, escalated) | Görev durumu |
| `due_at` | TIMESTAMPTZ (nullable) | `sla_hours`'tan türeyen son tarih |
| `escalated_at` | TIMESTAMPTZ (nullable) | Eskalasyonun tetiklendiği an; NULL = tetiklenmedi |
| `decided_at` / `decided_by_ref` | TIMESTAMPTZ (nullable) / UUID (nullable) | Kararın verildiği an ve aktör |
| `decision_reason` | Text (nullable) | Onay/red gerekçesi |

## 6. WBS / bağımlılık

Aşağıdaki tablo, `k-workflow` düğümünün önerilen WBS yerleşimini ve bağımlılığını verir; `dependsOn` = teknik/yürütme sırası (`wbs-field-semantics.md`), `related` = yalnız gezinme.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-workflow` (yeni) | module | `k-policy-pdp`, `k-worker`, `k-tenancy` | kernel/app-layer0 |

`dependsOn` gerekçesi: (1) `k-policy-pdp` — bir geçişin `requires_approval=true` olduğu durumda "bu aktör bu onayı verebilir mi?" sorusu Workflow'un kendi işi değildir, PDP'nin `evaluate(actor, action, resource, context)` çağrısına gider (`docs/pdp-policy-contract.md §4`); PDP hazır olmadan onay adımı yetkisiz çalışır. (2) `k-worker` — SLA sayacı ve eskalasyon tetikleyicisi zamanlanmış/arka-plan iştir (`docs/k-worker-taskqueue-directive.md §2` `Schedule` + `cron/interval_s`); k-worker olmadan SLA aşımı hiçbir zaman kontrol edilmez. (3) `k-tenancy` — her `workflow_instance` ve `workflow_task` tenant bağlamı olmadan yazılamaz. `related` ile (karar üretmeden) ECA ruleset kataloğuna (`src/schemas/ruleset.ts`, geçişteki `action_ref` ve eskalasyon bildirimleri için) ve `core-contract-pack.md §2.7 Workflow Registry`'ye (bu yönergenin genişlettiği, önceki basit `register/start/advance` arayüzü) bağlanır. ArcheType `linkedWorkflows` alanı (`src/schemas/archetype.ts` `LinkedRefSchema`) bu düğüme çözülür.

## 7. Paralel dal (fork/join) ve SLA/eskalasyon semantiği

**Fork/join:** Bir `workflow_transition`, `fork_group` alanı doldurulmuşsa bir paralel dal grubunun üyesidir; aynı `fork_group` değerini taşıyan birden çok geçiş, aynı kaynak durumdan eşzamanlı olarak tetiklenebilir (ör. bir sözleşme onayında hukuk ve finans dalları aynı anda açılır). `workflow_instance.active_forks` her dalın anlık durumunu tutar. Bir birleşme (join) noktasındaki geçiş `join_policy` ile hangi kuralla ilerleyeceğini beyan eder: `all` (tüm dallar tamamlanmalı), `any` (herhangi biri yeterli), `quorum` (eşik sayıda dal). Join noktası, eksik dal beklerken `workflow_instance.current_state`'i değiştirmez; motor her dal tamamlandığında `join_policy`'yi yeniden değerlendirir.

**SLA sayacı:** Bir `workflow_instance`, `state_entered_at` anından itibaren o durumdaki geçişlerin `sla_hours` değeriyle sayılır. `workflow_task.due_at`, `state_entered_at + sla_hours` olarak türetilir. SLA denetimi `k-worker`'ın zamanlanmış işi (`Schedule`, §6) tarafından periyodik taranır; motorun kendisi bir HTTP isteği içinde SLA kontrolü yapmaz (senkron yolda SLA taraması yasak — bu, k-worker'ın "senkron istek-yanıtı arka plana zorlamaz" ilkesinin tersi değil, SLA taramasının zaten arka-plan işi olması gerektiği anlamına gelir).

**Eskalasyon:** `sla_hours` aşılan bir `workflow_task`, `escalation_ref`'in işaret ettiği eskalasyon zincirini tetikler; zincir bir sıradaki onaycıya devir, bir üst role bildirim veya ECA ruleset paketinin (`RulesetCategorySchema` içindeki `escalation` kategorisi, `src/schemas/ruleset.ts`) çağrılması olabilir. Eskalasyon, `workflow_task.status`'u `escalated` yapar ve `escalated_at`'ı damgalar; görev **kaybolmaz**, yalnız görünürlüğü ve atanmışlığı değişir. Eskalasyon zincirinin kendisi serbest kod değildir — adlandırılmış ECA ruleset paketine referanstır (§8).

## 8. Backend

SQLAlchemy 2.0 (`Mapped[...]`) modelleri dört tablo için (§5); her tabloda `tenant_id` ve tenant-scoped bileşik indeks (`(tenant_id, workflow_instance_id)` gibi) zorunludur. Alembic **expand-contract** migration; `downgrade()` dolu ve CI'da `alembic downgrade -1` ile test edilir. Bir geçiş isteği geldiğinde motor sırasıyla: (1) `from_state = workflow_instance.current_state` mi doğrular, (2) `guard` varsa değerlendirir (yapısal ifade; `platform_computation`'a benzer saf değerlendirme, serbest Python yasak), (3) `requires_approval=true` ise `approval_ref` olmadan geçişi reddeder (`ApprovalRequiredError`), (4) `requires_approval=true` ise onaycı yetkisini `k-policy-pdp.evaluate()`'e sorar, (5) geçişi uygular ve `workflow_instance.current_state`'i günceller, (6) `action_ref` doluysa ilgili ECA ruleset paketini tetikler, (7) geçişi `AuditLogger.log()` ile audit'ler (`resource=workflow_instance`). Strawberry GraphQL resolver'ları `Depends(require_tenant)` + `RequirePermission(...)` ile korunur. Hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasak. Generated CRUD'un bir ArcheType kaydının durum alanını doğrudan `PATCH` etmesi motor katmanında engellenir — durum yalnız `workflow_transition` çağrı yoluyla değişir; bu, `archetype-uretim-spec`'in "generated CRUD'un lifecycle-yönetimli alanları doğrudan yazmasını yasaklama" ilkesinin Workflow karşılığıdır. **Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL; Next.js **YASAK**, Supabase **YASAK** (`core-contract-pack.md §1`).

## 9. Frontend

Vite + React + TanStack yığını; headless (kendi UI kütüphanesini dayatmaz, `@platform/design-tokens` kullanır). Frontend workflow **hesaplamaz** — yalnız backend'in ürettiği `workflow_instance.current_state`, olası geçişler ve `workflow_task` listesini TanStack Query ile çeker ve yansıtır. Bir kullanıcının göremeyeceği/tetikleyemeyeceği geçiş düğmesi gizlenir; karar backend PDP'den gelir, frontend yetki hesaplamaz (`pdp-policy-contract.md §8` ile aynı ilke). Board/timeline/liste görünümü Surface sözleşmesinin (`src/schemas/surface.ts` `SurfaceContractSchema`, `layout: board/timeline`) işidir; Workflow yalnız veriyi sağlar, kendi ekranını çizmez. SLA yaklaşan/aşan görevler görsel olarak (renk + metin, WCAG 2.2 AA taban, yalnız renkle bildirim yasak) ayrışır.

## 10. Multi-tenant + AI guardrail

**Multi-tenant:** Her `workflow_instance` ve `workflow_task` tenant-scoped'dur ve fail-closed çalışır (`core-contract-pack.md §2.1`); `workflow_def` paylaşılabilir (tenant_id NULL = platform-genel) ama örnek daima tek tenant'a aittir. PostgreSQL RLS ikinci bariyer: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Cross-tenant örnek/görev erişimi `TenantViolationError` fırlatır ve audit'lenir.

**Görev-ayrımı (separation of duties):** Bir `workflow_task`'ta `decided_by_ref`, aynı geçişi tetikleyen `requested_by_ref` ile **aynı aktör olamaz** — bu kural motor seviyesinde zorunludur (ör. payroll'da "onaylayan ≠ kapatan", CLM'de "taslağı hazırlayan ≠ imza onaycısı"). İhlal girişimi `SeparationOfDutiesError` fırlatır ve audit'lenir. Hangi rollerin birbirini onaylayamayacağı `workflow_transition.approver_role` + PDP policy'sinin kesişimiyle çözülür; Workflow motoru kuralı **saklar ve zorlar**, kuralın kaynağı PDP policy'sidir.

**AI guardrail:** Dört-aktör iş bölümü değiştirilemezdir (`core-contract-pack.md §3.0.1` ile aynı sertlik): **AI önerir → insan onaylar → motor uygular.** AI, yeni bir `workflow_def` taslağı (durum/geçiş kümesi önerisi) veya mevcut bir tanımın iyileştirmesini (`draft` autonomy) üretebilir; SLA/eskalasyon parametresi önerebilir; DLQ/gecikme analizinden kök-neden raporu çıkarabilir. AI bir `workflow_def`'i **kilitleyemez** — yalnız `status=draft` üretebilir, `status=locked` yapmak yalnız insan onayıyla (`approval_ref`) olur; onaysız kilitleme girişimi `ApprovalRequiredError` fırlatır. AI hiçbir `workflow_instance`'ı doğrudan ilerletemez (bir geçişi kendi başına tetikleyemez); `requires_approval=true` işaretli geçişte onaycı daima insandır. AI main branch'e push edemez, `k-workflow` düğümünü veya `workflow_transition.guard`/`escalation_ref` kuralını override edemez, kanıtsız "bitti" diyemez.

## 11. Bağlama

**PDP bağlama (`k-policy-pdp`):** Bir geçişin `requires_approval=true` olduğu her durumda, onaycının yetkisi `PolicyDecisionPoint.evaluate(actor, action="workflow:approve", resource=workflow_instance, context)` ile sorulur (`docs/pdp-policy-contract.md §7`). Workflow motoru kararı kendi içinde yeniden hesaplamaz; PDP'nin `deny` kararı geçişi durdurur. `approver_role` alanı PDP'nin `target_actor` seçicisine girdi sağlar, kararı vermez.

**k-worker bağlama:** SLA taraması ve eskalasyon tetikleyicisi `k-worker`'ın `analytics` veya benzer zamanlanmış iş türü (`docs/k-worker-taskqueue-directive.md §2`) olarak çalışır; motor kendisi bir cron açmaz, `Schedule` sözleşmesini kullanır. Bu tarama işi `tenant_id`-scope'ludur (bir tenant'ın büyük SLA kuyruğu komşu tenant'ın taramasını geciktirmez).

**ECA ruleset bağlama:** `workflow_transition.action_ref` ve eskalasyon zinciri, adlandırılmış ECA ruleset paketlerine (`src/schemas/ruleset.ts` `EcaRulesetPackageSchema`, kategori `approval`/`escalation`/`notification`) referans verir; Workflow motoru otomasyonu kendi içinde yeniden yazmaz, paketi *çağırır*. `RulesetSafetySchema.aiCanModify` system-katman paketlerinde `false` zorunludur; bu, Workflow'un eskalasyon zincirinin AI tarafından sessizce değiştirilemeyeceğini garanti eder.

**core-contract-pack §2.7 ile ilişki:** `core-contract-pack.md §2.7 Workflow Registry`, bu yönergeden önce yazılmış basit bir `register/start/advance` arayüzü ve `platform_workflow_state` tablo adı taşır; bu yönerge o sözleşmeyi **genişletir ve tam bir motora çevirir** — paralel dal, SLA/eskalasyon, ayrık görev-onayı ve görev-ayrımı ekler. Çelişki halinde bu doküman (`workflow-directive.md`) daha spesifik ve güncel olduğundan önceliklidir; `core-contract-pack §2.7` bu yönergeyle uyumlu hale getirilmelidir (kilitlendiğinde).

**ArcheType bağlama (`linkedWorkflows`):** Bir ArcheType kaydı kendi durum makinesini `LifecycleSchema` (basit doğrusal) ile taşıyabilir; paralel dal/SLA/eskalasyon gereken süreç için ArcheType, `linkedWorkflows` (`LinkedRefSchema`: `ref` + `version`) ile bir `workflow_def.key`'e referans verir. ArcheType kendi çekirdek `workflow` tablosunu **açmaz**; motor tektir.

## 12. Test stratejisi (test-önce)

Test-önce zorunludur (önce kırmızı, sonra yeşil). Aşağıdaki tablo test senaryosunu türüyle eşler; negatif testler (durum tutarlılığı, döngü/ölü-durum, ayrım ihlali) pozitif testler kadar zorunludur (`core-contract-pack.md §3.5`).

| # | Senaryo | Tür |
|---|---|---|
| 1 | Durum tutarlılığı: `initial`/`terminal_states`/her `from_state`+`to_state` `states` kümesinin üyesi; üye olmayan reddediliyor | Unit |
| 2 | Döngü/ölü-durum tespiti: guard'sız kendine-dönen geçiş ve hiçbir çıkışı olmayan terminal-olmayan durum tanım-doğrulamada reddediliyor | Unit (negatif) |
| 3 | Geçiş yürütme: `on_event` + `guard` doğru eşleşince `current_state` güncelleniyor; guard sağlanmazsa geçiş reddediliyor | Integration |
| 4 | Onay zorunluluğu: `requires_approval=true` geçiş `approval_ref` olmadan `ApprovalRequiredError` fırlatıyor | Integration (negatif) |
| 5 | PDP entegrasyonu: onaycı yetkisi `evaluate()` ile sorgulanıyor; `deny` kararı geçişi durduruyor | Integration |
| 6 | Görev-ayrımı: `requested_by_ref = decided_by_ref` olan karar `SeparationOfDutiesError` ile reddediliyor (≥5 negatif case, farklı ürün senaryosu: payroll/CLM/HRMS) | Integration (negatif) |
| 7 | SLA tetikleme: `sla_hours` aşılan `workflow_task` k-worker taramasında `due_at` sonrası doğru işaretleniyor | Integration |
| 8 | Eskalasyon: SLA aşımında `escalation_ref` zinciri tetikleniyor, `status=escalated` + `escalated_at` damgalanıyor, görev kaybolmuyor | Integration |
| 9 | Paralel dal (fork): aynı `fork_group`'taki geçişler eşzamanlı açılıyor; `active_forks` her dalın durumunu doğru izliyor | Integration |
| 10 | Paralel dal (join): `join_policy=all/any/quorum` her biri doğru koşulda ilerliyor; eksik dal varken durum değişmiyor | Integration |
| 11 | Cross-tenant izolasyon: A tenant B'nin `workflow_instance`/`workflow_task`'ını göremiyor (≥10 negatif case) | Integration (negatif) |
| 12 | Generated-CRUD engeli: ArcheType kaydının durum alanına doğrudan `PATCH` reddediliyor; yalnız `workflow_transition` yoluyla değişiyor | Contract |
| 13 | AI guardrail: AI'ın `status=draft`-dışı doğrudan `locked` yapma veya geçiş tetikleme girişimi reddediliyor | Integration (negatif) |
| 14 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |

## 13. Acceptance criteria

- AC-1: `workflow_def` durum/geçiş kümesi tanım-doğrulamadan geçmeden (`status=locked` olmadan) hiçbir `workflow_instance` başlatılamıyor.
- AC-2: Döngü/ölü-durum içeren tanım reddediliyor; her durum en az bir çıkışa veya terminal işaretine sahip.
- AC-3: `requires_approval=true` geçiş `approval_ref` + PDP `allow` kararı olmadan ilerlemiyor.
- AC-4: Aynı aktör aynı geçişte hem talep eden hem onaylayan olamıyor (görev-ayrımı, ≥5 negatif case).
- AC-5: SLA aşımı k-worker taramasıyla tespit ediliyor ve eskalasyon zinciri tetikleniyor; görev kaybolmuyor.
- AC-6: Paralel dal grubu `join_policy`'ye göre doğru birleşiyor (`all/any/quorum`).
- AC-7: Cross-tenant erişim ≥10 negatif case ile reddediliyor.
- AC-8: Generated CRUD durum alanını doğrudan yazamıyor; yalnız `workflow_transition` yoluyla değişiyor.
- AC-9: AI yalnız `draft` tanım/öneri üretiyor; `approval_ref` olmadan `locked` yapma veya geçiş tetikleme reddediliyor.

## 14. Anti-patterns (yasak desenler)

- **Durumu doğrudan yazma:** Generated CRUD'un ArcheType kaydının durum alanını `PATCH` ile değiştirmesi — YASAK; yalnız `workflow_transition` motor yoluyla.
- **Guard'da serbest kod:** `guard` alanına serbest Python/JS ifadesi gömmek — YASAK; yapısal ifade referansı (Computation deseniyle tutarlı), motor yorumlar.
- **Onayı Workflow içinde karar vermek:** Onaycının yetkisini Workflow motorunun kendisinin hesaplaması — YASAK; karar `k-policy-pdp.evaluate()`'e sorulur.
- **SLA'yı senkron yolda taramak:** İstek-yanıt döngüsü içinde SLA kontrolü yapmak — YASAK; k-worker zamanlanmış işi kullanılır.
- **Aynı aktörün onaylaması:** `requested_by_ref = decided_by_ref` — YASAK; görev-ayrımı motor seviyesinde zorunlu.
- **Ölü-durum/döngü:** Guard'sız kendine-dönen geçiş veya çıkışsız terminal-olmayan durum — YASAK; tanım-doğrulama reddeder.
- **Eskalasyonda görevi kaybetmek:** SLA aşımında görevi sessizce kapatmak — YASAK; `status=escalated`, görev görünür kalır.
- **AI'ın doğrudan kilitleme/tetikleme:** `approval_ref`'siz `status=locked` yapma veya geçiş tetikleme — YASAK; `ApprovalRequiredError`.
- **ArcheType'ın kendi durum tablosunu açması:** Bir ArcheType'ın kendi `_status_history` tablosunu icat etmesi — YASAK; `linkedWorkflows` ile tek motora referans.
- **Paralel dalı sırayla simüle etmek:** Fork/join'i sıralı (sequential) geçişlerle taklit etmek — YASAK; `fork_group`/`join_policy` gerçek eşzamanlılığı temsil eder.

## 15. DoD (Definition of Done)

- §12'deki 14 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil belgeli).
- Durum tutarlılığı, onay zorunluluğu, görev-ayrımı, SLA/eskalasyon ve paralel dal (fork/join) invariant'ları kanıtlandı.
- Alembic migration downgrade CI'da çalışıyor (`alembic downgrade -1`).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; ilgili çekirdek kontrol (`check-core-contract`) yeşil.
- PDP entegrasyonu kanıtlı: onay adımı `k-policy-pdp.evaluate()`'e gerçekten sorulduğu entegrasyon testiyle gösterildi.
- k-worker entegrasyonu kanıtlı: SLA taraması gerçek zamanlanmış iş (`Schedule`) olarak çalıştığı gösterildi.
- En az bir gerçek ürün senaryosunda (PMS/HRMS/accounting/CLM'den biri) uçtan-uca `workflow_instance` akışı (başlat → paralel dal → onay → SLA aşımı → eskalasyon → tamamlan) çalışır durumda.
- AI-guardrail testi: `draft`-dışı doğrudan kilitleme/geçiş-tetikleme reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok).

## 16. CI kapısı (önerilen — henüz yürürlükte değil)

Bu bölüm yalnız **gerçek durumu** kaydeder: `docs/drafts/check-state-machine-consistency.mjs` bugün taslak halde, ana CI'a (`npm test` veya deploy hattı) **bağlı değildir** ve dosyanın kendi başlığında da "TASLAK — CI'a bağlı DEĞİL" olarak işaretlidir. Bu script bugün `traceability.implementationStatus` ile `status`/`phase` arasındaki *WBS-düğüm* semantik kaymasını denetler (görev takibi amaçlı); `workflow_def`/`workflow_transition` gibi Workflow motorunun kendi durum-makinesi verisini **doğrulamaz**. Yani "check-state-machine CI'da çalışıyor ve Workflow motorunu koruyor" ifadesi bugün **doğru değildir** — böyle bir kapı henüz mevcut değildir.

**Önerilen kapı (bu yönerge kilitlendiğinde yazılacak, adı ayrı olmalı, ör. `check-workflow-contract.mjs`):** `workflow_def` tanımlarını okuyup şu invariantları CI'da bloklayıcı biçimde denetlemesi önerilir — (a) her `from_state`/`to_state`/`initial_state`/`terminal_states` üyesi `states` kümesinde, (b) döngü/ölü-durum tespiti (guard'sız kendine-dönen geçiş, çıkışsız terminal-olmayan durum), (c) `requires_approval=true` geçişte `approver_role` dolu, (d) `fork_group` kullanan her geçişin karşılık gelen bir `join_policy`'li birleşme noktası var, (e) `status=locked` tanımın `approval_ref` taşıdığı. Bu öneri, mevcut `docs/drafts/check-state-machine-consistency.mjs`'in *genişletilmesi* değil, **ayrı ve yeni** bir kapı olarak ele alınmalıdır — ikisi farklı veri katmanını (WBS-düğüm durumu vs. Workflow motoru durumu) denetler ve karıştırılmamalıdır.

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu yönergenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| WF-01 | `workflow_def`/`workflow_transition`/`workflow_instance`/`workflow_task` şeması (§5) | Backend/Data | P0 | Unit | AC-1 | kernel-team |
| WF-02 | Durum tutarlılığı doğrulama (`states` üyeliği) | Backend | P0 | Unit | AC-1 | kernel-team |
| WF-03 | Döngü/ölü-durum tespiti tanım-doğrulamada reddi | Backend | P0 | Unit(neg) | AC-2 | kernel-team |
| WF-04 | Onay zorunluluğu: `requires_approval` + `approval_ref` + PDP `evaluate()` | Backend | P0 | Integration | AC-3 | kernel-team |
| WF-05 | Görev-ayrımı: `requested_by_ref ≠ decided_by_ref` (≥5 negatif case) | Backend/Security | P0 | Integration(neg) | AC-4 | security-team |
| WF-06 | SLA sayacı: `due_at` türetimi + k-worker taraması | Backend | P1 | Integration | AC-5 | kernel-team |
| WF-07 | Eskalasyon zinciri: SLA aşımında `escalation_ref` tetikleme, görev kaybolmaz | Backend | P1 | Integration | AC-5 | kernel-team |
| WF-08 | Paralel dal (fork): `fork_group` eşzamanlı açılma + `active_forks` izleme | Backend | P1 | Integration | AC-6 | kernel-team |
| WF-09 | Paralel dal (join): `join_policy` (all/any/quorum) doğru çözümü | Backend | P1 | Integration | AC-6 | kernel-team |
| WF-10 | Tenant izolasyonu + RLS ikinci bariyer (≥10 negatif case) | Security | P0 | Integration(neg) | AC-7 | security-team |
| WF-11 | Generated-CRUD durum-alanı doğrudan yazma engeli | Backend/Contract | P0 | Contract | AC-8 | kernel-team |
| WF-12 | AI `draft`-only tanım/öneri; `approval_ref` olmadan kilitleme/tetikleme reddi | AI-Governance | P0 | Integration(neg) | AC-9 | governance |
| WF-13 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | AC-1 | kernel-team |
| WF-14 | ECA ruleset paket referansı (`action_ref`/`escalation_ref`) motor içi serbest kod yasağı | Backend | P1 | Contract | AC-5 | kernel-team |
| WF-15 | `linkedWorkflows` çözümü: ArcheType → `workflow_def.key` bağı çalışıyor | Backend/Integration | P1 | Integration | AC-1 | kernel-team |

---

*Kaynak yönerge: `archetype-uretim-spec.md §2` (Workflow tanımı), `gap-2026-07-02-02-archetype.md §4 G-A1` (boşluk gerekçesi). Genişlettiği sözleşmeler: `src/schemas/surface.ts` `WorkflowContractSchema` (katalog/frontend tarafı), `core-contract-pack.md §2.7 Workflow Registry` (önceki basit registry arayüzü). Kardeş/bağımlı sözleşmeler: `docs/pdp-policy-contract.md` (onay yetkisi), `docs/k-worker-taskqueue-directive.md` (SLA zamanlayıcı), `src/schemas/ruleset.ts` (ECA ruleset paket kataloğu). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız yönerge metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman kilitlendiğinde `core-contract-pack §2.7` bununla uyumlu hale getirilmelidir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
