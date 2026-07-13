# workflow — Birinci Sınıf İş Akışı Motoru (TASLAK — kilitlenmeyi bekliyor)

Durum: taslak iskelet. CI'a bağlı değil. İnsan onayı gerekir.
Gerekçe: `archetype-uretim-spec §2` Workflow'u Surface'in kardeşi, "ayrı versiyonlanır" birinci sınıf kavram olarak adlandırır; `linkedWorkflows` her yerde referanslanır — ama bir `workflow-directive.md` HİÇ YOKTUR. Onay zinciri/paralel branch/SLA timer/escalation gereken her ürün (PMS, HRMS, accounting, CLM) bugün boşta referansa güvenir (P0, bkz. gap-2026-07-02-02-archetype §4 G-A1).

## 1. Amaç / Kapsam / Non-goals

- Amaç: durum makinesini + geçiş kurallarını + onay/eskalasyon/SLA'yı VERİ olarak modellemek; ArcheType ve Surface ile ayrı versiyonlanan tek motor.
- Kapsam: durumlar, geçişler (guard/action/event), paralel branch (fork/join), SLA timer, escalation, onay adımları (approverRole), ECA bağı.
- Non-goals: UI çizimi (Surface işi); iş hesaplaması (Computation işi); kalıcı olay saklama (event-replay işi).

## 2. Nedir / ne yapar / ne yapmaz

- Nedir: `LifecycleSchema`'yı aşan genel iş akışı sözleşmesi (basit doğrusal durum makinesi yetmez).
- Ne yapar: çok-adımlı süreçleri, paralel dalları, zaman-aşımı/eskalasyonu, ayrık görev-onayını yönetir.
- Ne yapmaz: generated CRUD'un durum alanını doğrudan yazmasına izin vermez (geçiş yalnız typed transition ile).

## 3. Sözleşme şekli (backend — SQLAlchemy 2.0 / FastAPI)

TODO: `workflow_def` (id, states[], initial, terminal[], transitions[]), `workflow_transition` (from, to, on, guard, action, requiresApproval, sla), `workflow_instance` (def_ref, current_state, tenant_id, aggregate_ref), `workflow_task` (assignee, dueAt, escalationRule). RLS zorunlu. Bkz. mevcut `WorkflowContractSchema` (src/schemas/surface.ts) — bu, o şemayı archetype-bağımsız hale getirir.

## 4. WBS / bağımlılık

TODO: `k-workflow` (level=module, parent=app-kernel). `dependsOn`: k-policy-pdp (onay yetkisi), k-worker (SLA timer job), ECA ruleset. ArcheType.linkedWorkflows bu düğüme çözülür.

## 5. Multi-tenant / AI guardrail

- Tenant: her instance tenant-scoped; def paylaşılabilir, instance izole.
- AI: workflow tanımını taslak üretebilir (draft-only); insan onayı olmadan aktive edilemez; main'e doğrudan yazamaz.

## 6. Test stratejisi (test-önce)

TODO: durum tutarlılığı (initial/terminal/transition üyeliği — mevcut check-surface mantığı genişletilir); döngü/ölü-durum tespiti; SLA timer tetikleme; onay ayrımı (separation-of-duties, örn. payroll approve≠close); paralel branch join doğruluğu.

## 7. Kabul kriterleri / DoD

TODO: her ürün için en az 1 gerçek workflow instance; state-machine kapısı yeşil; onay adımları PDP'ye bağlı; insan onayı (kilit).
