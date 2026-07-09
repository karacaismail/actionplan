# Platform Wave 3 Enterprise PR Handoff — 2026-07-09

Durum: docs-only implementation handoff
Kapsam: `/Users/karaca/DEV/mimari/platform`
Kaynak readiness kaydı: `docs/wave3-enterprise-readiness-gap-2026-07-09.md`

Bu belge product code üretmez. Amaç, Wave 2 repeatability verified olduktan sonra enterprise readiness kanıtlarını hangi PR sırasıyla toplayacağımızı kilitlemektir.

## Başlama Kapısı

Wave 3 PR kuyruğu ancak şu koşullar birlikte sağlandığında başlar:

- İlk 11 PR tamamlandı.
- Customer CUST-06 verified.
- Wave 2 W2-06 repeatability diff report verified.
- Customer, OrderOps ve Inventory için PR/CI/test evidence actionplan'a geri yazıldı.

Bu koşullar sağlanmadan enterprise-ready veya release-ready iddiası yazılmaz.

## Wave 3 PR Sırası

| PR | Branch | WBS node | Amaç | Non-goal |
|---|---|---|---|---|
| W3-01 | `task/enterprise-security-gates` | `cc-security`, `k-authz`, `k-tenancy`, `l1-audit` | OWASP/security CI, authz bypass, tenant escape, secret scan evidence | Feature work |
| W3-02 | `task/enterprise-performance-gates` | `build-enterprise-readiness` | p95 load report, N+1 detection, cache policy | New domain |
| W3-03 | `task/enterprise-a11y-gates` | `build-enterprise-readiness` | Customer/OrderOps/Inventory keyboard/focus/contrast/axe report | UI redesign |
| W3-04 | `task/enterprise-reliability-gates` | `build-enterprise-readiness`, `deploy-yap` | retry/idempotency/DLQ, migration rollback, failure injection | New workflow designer |
| W3-05 | `task/enterprise-observability-gates` | `platform-observability` | trace, metrics, structured logs, dashboard smoke | Analytics product |
| W3-06 | `task/enterprise-release-governance` | `std-ci-gates`, `deploy-yap`, `build-risk-defteri` | staging/prod separation, rollback drill, CODEOWNERS, PR template, branch protection evidence | Product feature |
| W3-07 | `task/enterprise-dod-evidence-pack` | `build-enterprise-readiness` | Enterprise DoD evidence bundle and actionplan writeback | Portfolio scale |

W3-07 geçmeden Wave 4 portfolio scale başlatılmaz.

## W3-01 — Security Gates

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/security tests/test_policy_decision.py tests/test_audit_immutability.py
node tools/agents/check-secrets.mjs
```

Evidence:

- OWASP/ZAP veya eşdeğer security report
- authz bypass negative test logu
- tenant escape negative test logu
- audit deny evidence
- secret scan logu
- CI run URL

## W3-02 — Performance Gates

Minimum doğrulama:

```bash
k6 run tests/perf/k6-smoke.js
cd apps/api && uv run --python 3.12 pytest -q tests/test_n_plus_one.py tests/test_cache_policy.py
```

Evidence:

- p95 load report
- N+1 detection logu
- cache policy note
- CI run URL

## W3-03 — Accessibility Gates

Minimum doğrulama:

```bash
pnpm --filter @platform/web run e2e -- a11y-enterprise.spec.ts
```

Evidence:

- Customer axe/keyboard/focus report
- OrderOps axe/keyboard/focus report
- Inventory axe/keyboard/focus report
- CI run URL

## W3-04 — Reliability Gates

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/failure_injection tests/test_migration_rollback.py tests/test_idempotent_consumer.py
```

Evidence:

- retry/idempotency test logu
- DLQ/failure injection logu
- migration rollback logu
- CI run URL

## W3-05 — Observability Gates

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_observability_metrics.py tests/test_trace_propagation.py tests/test_structured_logging.py
curl -fsS <staging-url>/metrics
```

Evidence:

- metrics smoke
- trace propagation test logu
- structured log PII masking test logu
- dashboard smoke note
- CI run URL

## W3-06 — Release + Governance

Minimum doğrulama:

```bash
gh api repos/<owner>/<repo>/branches/<default-branch>/protection
gh run list --workflow ci.yml --limit 5
gh run list --workflow deploy-backend.yml --limit 5
curl -fsS <staging-url>/healthz
curl -fsS <production-url>/healthz
```

Evidence:

- staging/prod separation note
- deploy logu
- rollback drill logu
- CODEOWNERS file reference
- PR template reference
- branch protection evidence
- CI run URL

## W3-07 — Enterprise DoD Evidence Pack

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/security tests/failure_injection tests/test_customer_e2e_contract.py tests/test_order_e2e_contract.py tests/test_inventory_e2e_contract.py
pnpm --filter @platform/web run e2e -- customer.spec.ts order.spec.ts inventory.spec.ts a11y-enterprise.spec.ts
```

Evidence:

- `reports/enterprise-readiness.md`
- Customer/OrderOps/Inventory enterprise DoD matrix
- security/performance/a11y/reliability/observability/release/governance evidence links
- actionplan evidence patch
- manual-review note

## W3 Sonrası Kapı

Wave 3 verified sayılmadan Wave 4 portfolio scale başlamaz. W3 verified için security, performance, accessibility, reliability, observability, release ve governance evidence setinin tamamı gerçek PR/CI/deploy/test loglarıyla actionplan'a geri yazılmalıdır.
