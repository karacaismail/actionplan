# Platform Wave 2 Repeatability PR Handoff — 2026-07-09

Durum: docs-only implementation handoff
Kapsam: `/Users/karaca/DEV/mimari/platform`
Kaynak readiness kaydı: `docs/wave2-sdk-repeatability-readiness-gap-2026-07-09.md`

Bu belge product code üretmez. Amaç, Customer vertical slice verified olduktan sonra SDK/app-core deseninin OrderOps ve Inventory üzerinde tekrar üretilebilirliğini kanıtlayacak PR sırasını kilitlemektir.

## Başlama Kapısı

Wave 2 PR kuyruğu ancak şu koşullar birlikte sağlandığında başlar:

- İlk 11 PR tamamlandı.
- Customer CUST-06 e2e/evidence writeback tamamlandı.
- `packages/sdk` public contract ve codegen guard evidence var.
- Customer app-core/model/API/UI/seed/e2e evidence actionplan'a geri yazıldı.

Bu koşullar sağlanmadan OrderOps veya Inventory product code başlatılmaz.

## Wave 2 PR Sırası

| PR | Branch | WBS node | Amaç | Non-goal |
|---|---|---|---|---|
| W2-01 | `task/sdk-app-core-template` | `be-sdk`, `dx-cli` | SDK app-core template + deterministic template test | OrderOps/Inventory domain |
| W2-02 | `task/sdk-module-template` | `be-sdk`, `dx-cli` | SDK module template + manifest/healthz/permission fixture | Full marketplace |
| W2-03 | `task/sdk-generator-guardrails` | `be-sdk`, `dx-cli`, `dx-workflow` | Generator guardrails: forbidden stack, manual edit, missing test no-go | Domain features |
| W2-04 | `task/orderops-vertical-slice` | `build-ilk-dikey-dilim`, `build-referans-uygulama` | OrderOps second vertical slice with same SDK/app-core contract | Inventory |
| W2-05 | `task/inventory-vertical-slice` | `build-referans-uygulama` | Inventory third vertical slice with different data shape | Marketplace |
| W2-06 | `task/sdk-repeatability-diff-report` | `be-sdk`, `dx-workflow`, `build-referans-uygulama` | Customer/OrderOps/Inventory diff report and copy-code threshold | New domain |

W2-06 geçmeden Wave 3 enterprise readiness claim başlatılmaz.

## W2-01 — SDK App-Core Template

| Alan | Değer |
|---|---|
| Branch | `task/sdk-app-core-template` |
| WBS node | `be-sdk`, `dx-cli` |
| Önkoşul | Customer CUST-06 verified |
| Amaç | App-core template manifest, route/menu/capability/event namespace skeleton |
| Non-goal | OrderOps/Inventory domain code |

Minimum doğrulama:

```bash
pnpm --filter @platform/sdk run test -- app-core-template
```

Evidence:

- app-core template snapshot
- deterministic output test
- forbidden stack scan
- CI run URL

## W2-02 — SDK Module Template

| Alan | Değer |
|---|---|
| Branch | `task/sdk-module-template` |
| WBS node | `be-sdk`, `dx-cli` |
| Önkoşul | W2-01 merge + evidence |
| Amaç | Module template manifest, healthz, permission fixture, test harness |
| Non-goal | Full marketplace publication |

Minimum doğrulama:

```bash
pnpm --filter @platform/sdk run test -- module-template
```

Evidence:

- module template snapshot
- manifest validation test
- healthz fixture test
- permission fixture test
- CI run URL

## W2-03 — Generator Guardrails

| Alan | Değer |
|---|---|
| Branch | `task/sdk-generator-guardrails` |
| WBS node | `be-sdk`, `dx-cli`, `dx-workflow` |
| Önkoşul | W2-02 merge + evidence |
| Amaç | Generated output manual edit guard, forbidden stack guard, missing test no-go |
| Non-goal | Domain feature generation |

Minimum doğrulama:

```bash
pnpm --filter @platform/sdk run test -- generator-guardrails
```

Evidence:

- manual-edit guard negative test
- forbidden stack negative test
- missing test no-go test
- byte-stable output test
- CI run URL

## W2-04 — OrderOps Vertical Slice

| Alan | Değer |
|---|---|
| Branch | `task/orderops-vertical-slice` |
| WBS node | `build-ilk-dikey-dilim`, `build-referans-uygulama` |
| Önkoşul | W2-03 merge + evidence |
| Amaç | OrderOps app/module generated through SDK/app-core pattern |
| Non-goal | Inventory, marketplace |

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_order_model.py tests/test_order_graphql.py tests/test_order_e2e_contract.py
pnpm --filter @platform/web run test -- order
pnpm --filter @platform/web run e2e -- order.spec.ts
```

Evidence:

- order model/migration test logu
- order GraphQL/authz/audit test logu
- order UI/e2e smoke
- tenant negative test
- CI run URL

## W2-05 — Inventory Vertical Slice

| Alan | Değer |
|---|---|
| Branch | `task/inventory-vertical-slice` |
| WBS node | `build-referans-uygulama` |
| Önkoşul | W2-04 merge + evidence |
| Amaç | Inventory vertical slice with different data shape and same SDK/app-core contract |
| Non-goal | Marketplace, fourth domain |

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_inventory_model.py tests/test_inventory_graphql.py tests/test_inventory_e2e_contract.py
pnpm --filter @platform/web run test -- inventory
pnpm --filter @platform/web run e2e -- inventory.spec.ts
```

Evidence:

- inventory model/migration test logu
- inventory GraphQL/authz/audit test logu
- inventory UI/e2e smoke
- tenant negative test
- CI run URL

## W2-06 — Repeatability Diff Report

| Alan | Değer |
|---|---|
| Branch | `task/sdk-repeatability-diff-report` |
| WBS node | `be-sdk`, `dx-workflow`, `build-referans-uygulama` |
| Önkoşul | W2-05 merge + evidence |
| Amaç | Customer/OrderOps/Inventory diff report, copy-code threshold, pattern extraction |
| Non-goal | New domain implementation |

Minimum doğrulama:

```bash
pnpm --filter @platform/sdk run test
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_e2e_contract.py tests/test_order_e2e_contract.py tests/test_inventory_e2e_contract.py
pnpm --filter @platform/web run e2e -- customer.spec.ts order.spec.ts inventory.spec.ts
```

Evidence:

- `packages/sdk/docs/repeatability-report.md`
- copy-code threshold report
- Customer/OrderOps/Inventory regression log
- CI run URL
- manual-review note

## W2 Sonrası Kapı

Wave 2 verified sayılmadan Wave 3 enterprise readiness başlamaz. W2 verified için:

- SDK app-core template evidence var.
- SDK module template evidence var.
- Generator guardrails evidence var.
- Customer, OrderOps ve Inventory aynı SDK/app-core sözleşmesiyle çalışıyor.
- Diff report kopya domain logic eşiğini belgeler.
- Evidence actionplan'a geri yazılmıştır.
