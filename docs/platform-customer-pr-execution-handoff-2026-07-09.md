# Platform Customer PR Execution Handoff — 2026-07-09

Durum: docs-only implementation handoff
Kapsam: `/Users/karaca/DEV/mimari/platform`
Kaynak readiness kayıtları:

- `docs/platform-customer-app-core-readiness-gap-2026-07-09.md`
- `docs/platform-customer-model-readiness-gap-2026-07-09.md`
- `docs/platform-customer-graphql-readiness-gap-2026-07-09.md`
- `docs/platform-customer-ui-readiness-gap-2026-07-09.md`
- `docs/platform-customer-seed-readiness-gap-2026-07-09.md`
- `docs/platform-customer-e2e-evidence-readiness-gap-2026-07-09.md`

Bu belge product code üretmez. Amaç, PR-11 hello-platform boot smoke tamamlandıktan sonra Customer vertical slice'ın hangi PR sırasıyla, hangi test ve evidence kapılarıyla geliştirileceğini kilitlemektir.

## Başlama Kapısı

Customer PR kuyruğu ancak şu koşullar birlikte sağlandığında başlar:

- İlk 11 PR tamamlandı.
- PR-11 `task/platform-factory-hello-platform` merge edildi.
- Remote CI run URL'si ve hello-platform smoke evidence actionplan'a geri yazıldı.
- `be-sdk` public contract ve codegen guard evidence var.
- Tenant, authz, event/outbox, ECA, audit, capability, DB migration ve observability temel evidence seti var.

Bu koşullar sağlanmadan Customer product code başlatılmaz.

## Customer PR Sırası

| PR | Branch | WBS node | Amaç | Non-goal |
|---|---|---|---|---|
| CUST-01 | `task/platform-customer-app-core` | `platform-factory` + `k-capability` | Customer app slug, capability, event namespace, route/menu shell | Customer CRUD |
| CUST-02 | `task/platform-customer-model` | `platform-customer-model` | Tenant-aware Customer model + migration + constraints | GraphQL/UI |
| CUST-03 | `task/platform-customer-graphql` | `platform-customer-graphql` | Customer GraphQL query/mutation + authz/audit/event integration | UI |
| CUST-04 | `task/platform-customer-ui` | `platform-customer-ui` | Customer list/detail/form route + capability-gated navigation | Backend model changes |
| CUST-05 | `task/platform-customer-seed` | `platform-customer-seed` | Deterministic Customer seed + golden fixtures | New UI features |
| CUST-06 | `task/platform-customer-e2e-evidence` | `customer` + Customer nodes | End-to-end Customer smoke, tenant negative tests, evidence writeback | OrderOps/Inventory |

CUST-06 geçmeden Wave 2 OrderOps/Inventory repeatability başlamaz.

## CUST-01 — Customer App-Core

| Alan | Değer |
|---|---|
| Branch | `task/platform-customer-app-core` |
| WBS node | `platform-factory`, `k-capability` |
| Önkoşul | PR-11 hello-platform evidence |
| Amaç | App slug, capability binding, route/menu shell, event namespace |
| Non-goal | Customer CRUD/model/API |

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_app_core.py
pnpm --filter @platform/web run test -- customer-route
```

Evidence:

- app slug registry test logu
- capability olmadan route/menu gizli test logu
- `customer.*` event namespace collision test logu
- CI run URL

## CUST-02 — Customer Model

| Alan | Değer |
|---|---|
| Branch | `task/platform-customer-model` |
| WBS node | `platform-customer-model` |
| Önkoşul | CUST-01 merge + evidence |
| Amaç | Tenant-aware Customer aggregate, migration, constraints |
| Non-goal | GraphQL resolver, UI |

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_model.py tests/test_customer_migration.py
```

Evidence:

- tenant-scoped unique constraint test logu
- migration upgrade/downgrade logu
- invalid customer fixture rejection logu
- CI run URL

## CUST-03 — Customer GraphQL/API

| Alan | Değer |
|---|---|
| Branch | `task/platform-customer-graphql` |
| WBS node | `platform-customer-graphql` |
| Önkoşul | CUST-02 merge + evidence |
| Amaç | Customer query/mutation, permission gate, audit/event integration |
| Non-goal | UI implementation |

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_graphql.py tests/test_customer_permissions.py tests/test_customer_audit_events.py
```

Evidence:

- tenant-filtered query test logu
- cross-tenant forbidden test logu
- permission denied audit logu
- customer created event test logu
- CI run URL

## CUST-04 — Customer UI

| Alan | Değer |
|---|---|
| Branch | `task/platform-customer-ui` |
| WBS node | `platform-customer-ui` |
| Önkoşul | CUST-03 merge + evidence |
| Amaç | Customer list/detail/form route, capability-gated navigation, a11y states |
| Non-goal | Backend schema changes |

Minimum doğrulama:

```bash
pnpm --filter @platform/web run test -- customer-ui
pnpm --filter @platform/web run e2e -- customer.spec.ts
```

Evidence:

- route render smoke
- capability-hidden navigation test
- create/edit form validation test
- axe/keyboard/focus report
- CI run URL

## CUST-05 — Customer Seed

| Alan | Değer |
|---|---|
| Branch | `task/platform-customer-seed` |
| WBS node | `platform-customer-seed` |
| Önkoşul | CUST-04 merge + evidence |
| Amaç | Deterministic Customer seed, golden fixture, repeatable local smoke |
| Non-goal | New Customer UI feature |

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_seed.py
```

Evidence:

- seed idempotency test logu
- golden fixture snapshot
- tenant-separated seed test logu
- CI run URL

## CUST-06 — Customer E2E + Evidence Writeback

| Alan | Değer |
|---|---|
| Branch | `task/platform-customer-e2e-evidence` |
| WBS node | `customer`, `platform-customer-graphql`, `platform-customer-ui`, `platform-customer-seed` |
| Önkoşul | CUST-05 merge + evidence |
| Amaç | Full Customer vertical slice smoke, tenant negative suite, actionplan evidence patch |
| Non-goal | OrderOps/Inventory |

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_e2e_contract.py tests/test_customer_permissions.py
pnpm --filter @platform/web run e2e -- customer.spec.ts
```

Evidence:

- create/list/detail/update Customer smoke
- cross-tenant negative e2e test
- authz denial e2e test
- audit/event evidence
- actionplan evidence patch
- CI run URL
- manual-review note

## CUST-06 Sonrası Kapı

Customer vertical slice ancak CUST-06 evidence actionplan'a geri yazıldığında `verified` sayılır. Bundan sonra Wave 2 sırası açılır:

1. OrderOps second vertical slice.
2. Inventory third vertical slice.
3. Customer/OrderOps/Inventory repeatability diff report.

Customer evidence yoksa Wave 2 başlatılmaz.
