# Platform Wave 4 Portfolio PR Handoff — 2026-07-09

Durum: docs-only implementation handoff
Kapsam: `/Users/karaca/DEV/mimari/platform`
Kaynak readiness kaydı: `docs/wave4-portfolio-scale-readiness-gap-2026-07-09.md`

Bu belge product code üretmez. Amaç, Wave 3 enterprise readiness verified olduktan sonra 50+ app vizyonunu portföy ölçeğinde işletecek PR sırasını kilitlemektir.

## Başlama Kapısı

Wave 4 PR kuyruğu ancak şu koşullar birlikte sağlandığında başlar:

- Wave 3 W3-07 enterprise DoD evidence pack verified.
- Customer, OrderOps ve Inventory regression matrix çalışıyor.
- Security/performance/a11y/reliability/observability/release/governance evidence actionplan'a geri yazıldı.

Bu koşullar sağlanmadan portfolio-scale veya app factory claim yazılmaz.

## Wave 4 PR Sırası

| PR | Branch | WBS node | Amaç | Non-goal |
|---|---|---|---|---|
| W4-01 | `task/ready-to-code-queue-export` | `dx-workflow`, `platform-factory` | Ready-to-code queue artifact with blocker/evidence status | Product feature |
| W4-02 | `task/app-factory-release-train` | `platform-factory`, `deploy-yap`, `product` | App assembly manifests and capability/entitlement release train | Marketplace |
| W4-03 | `task/module-marketplace-guardrails` | `dx-marketplace`, `std-ci-gates` | Signing, SBOM, permission diff, sandbox/no-egress tests | Public marketplace launch |
| W4-04 | `task/portfolio-regression-matrix` | `build-referans-uygulama`, `build-enterprise-readiness` | Customer/OrderOps/Inventory smoke matrix | Fourth domain |
| W4-05 | `task/evidence-dashboard-blockers` | `dx-workflow`, `build-enterprise-readiness` | Evidence dashboard and done-without-evidence blocker | New app work |
| W4-06 | `task/operations-runbook-drills` | `deploy-yap`, `build-risk-defteri` | Incident, rollback, migration, tenant support drill logs | New domain |
| W4-07 | `task/portfolio-scale-exit-report` | `platform-factory`, `build-enterprise-readiness`, `product` | Portfolio scale exit report and actionplan evidence writeback | Product code |

W4-07 geçmeden "meta-framework portfolio scale tamamlandı" iddiası yazılmaz.

## W4-01 — Ready-To-Code Queue Export

Minimum doğrulama:

```bash
node tools/export-ready-to-code-queue.mjs
node tools/check-ready-to-code-queue.mjs
```

Evidence:

- `reports/ready-to-code-queue.json`
- blocker/evidence status validation log
- CI run URL

## W4-02 — App Factory Release Train

Minimum doğrulama:

```bash
node tools/check-app-manifest.mjs
docker compose -f infra/app-assembly/docker-compose.customer.yml config
docker compose -f infra/app-assembly/docker-compose.order.yml config
docker compose -f infra/app-assembly/docker-compose.inventory.yml config
```

Evidence:

- Customer app manifest
- OrderOps app manifest
- Inventory app manifest
- capability/entitlement list
- compose config smoke
- CI run URL

## W4-03 — Module Marketplace Guardrails

Minimum doğrulama:

```bash
node tools/check-module-marketplace-security.mjs
pnpm --filter @platform/marketplace run test -- module-security permission-diff sandbox-policy
```

Evidence:

- signing verification log
- SBOM/provenance artifact
- permission diff report
- sandbox/no-egress test log
- CI run URL

## W4-04 — Portfolio Regression Matrix

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_regression_matrix.py
pnpm --filter @platform/web run e2e -- regression-matrix.spec.ts
```

Evidence:

- Customer smoke
- OrderOps smoke
- Inventory smoke
- tenant/authz/audit regression matrix
- CI run URL

## W4-05 — Evidence Dashboard Blockers

Minimum doğrulama:

```bash
node tools/check-evidence-dashboard.mjs
pnpm --filter @platform/web run e2e -- evidence-dashboard.spec.ts
```

Evidence:

- `reports/evidence-dashboard.json`
- done-without-evidence blocker test
- dashboard smoke
- CI run URL

## W4-06 — Operations Runbook Drills

Minimum doğrulama:

```bash
test -f infra/runbooks/incident.md
test -f infra/runbooks/rollback.md
test -f infra/runbooks/migration.md
test -f infra/runbooks/tenant-support.md
```

Evidence:

- incident drill log
- rollback drill log
- migration drill log
- tenant support drill log
- owner/review date for each runbook

## W4-07 — Portfolio Scale Exit Report

Minimum doğrulama:

```bash
node tools/check-ready-to-code-queue.mjs
node tools/check-app-manifest.mjs
node tools/check-module-marketplace-security.mjs
node tools/check-evidence-dashboard.mjs
cd apps/api && uv run --python 3.12 pytest -q tests/test_regression_matrix.py
pnpm --filter @platform/web run e2e -- regression-matrix.spec.ts evidence-dashboard.spec.ts
```

Evidence:

- `reports/portfolio-scale-exit-report.md`
- app factory release train proof
- marketplace guardrail proof
- regression matrix proof
- evidence dashboard proof
- operations drill proof
- actionplan evidence patch
- manual-review note

## W4 Sonrası Kapı

Portfolio scale verified sayılmadan "meta-framework bitti" iddiası yoktur. W4 verified için yeni app/module üretimi tekrarlanabilir olmalı, evidence'sız done mümkün olmamalı, regression suite framework kırılmalarını yakalamalı ve operasyon runbook drill'leri kanıtlanmalıdır.
