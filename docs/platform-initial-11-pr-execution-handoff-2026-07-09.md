# Platform Initial 11 PR Execution Handoff — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM ardıl koordinasyon yetkilisidir. AI erişimi
> `read-only-audit`, platform yürütücüsü `human-developer-only`dır. Claude yalnız Codex'in
> sınırlandırılmış çağrısıyla çalışır; aksi durum fail-closed durur.

Durum: docs-only implementation handoff
Kapsam: `/Users/karaca/DEV/mimari/platform`
Kaynak plan: `docs/meta-framework-implementation-development-plan.md`

Bu belge product code üretmez. Amaç, Wave 0 başlangıç kuyruğundaki ilk 11 implementation PR'ını soru sormadan, sırayla ve kanıta bağlı şekilde geliştiriciye devredilebilir hale getirmektir.

## Sıra Kilidi

PR sırası değiştirilemez:

1. PR-01 remote + CI baseline
2. PR-02 tenancy context
3. PR-03 authz/PDP
4. PR-04 event/outbox
5. PR-05 ECA runtime
6. PR-06 audit envelope
7. PR-07 capability registry
8. PR-08 DB schema/migrations
9. PR-09 observability
10. PR-10 SDK public contract
11. PR-11 hello platform boot smoke

PR-01 merge + CI evidence olmadan PR-02 başlamaz. PR-11 merge + smoke evidence olmadan Customer vertical slice başlamaz.

## Ortak PR Kuralları

Her PR şu kurallarla açılır:

- Branch adı `task/<wbs-node-id>-<slug>` formatındadır.
- PR açıklamasında WBS node id, scope, non-goal, tests, rollback ve evidence patch bulunur.
- İlk commit kırmızı test veya doğrulama guardrail'i taşır.
- `status`, `phase`, `progress` ve `evidence` actionplan tarafında gerçek PR/CI/deploy kanıtı gelmeden ilerletilmez.
- Forbidden stack kullanımı yasaktır: Next.js, Supabase, Prisma, Redux, Flowbite.
- Actionplan doc-maintainer bu PR'ların product code'unu yazmaz; yalnız handoff/evidence sözleşmesini günceller.

## PR-01 — Remote + CI Baseline

| Alan | Değer |
|---|---|
| Branch | `task/platform-cicd-ci-baseline` |
| WBS node | `platform-cicd`, `platform-factory` |
| Önkoşul | `platform` checkout'u okunur; remote/branch protection yokluğu doğrulanır |
| Amaç | GitHub remote, default branch hizası, CI baseline, ilk CI run URL'si |
| Non-goal | Ürün özelliği, tenant/authz/domain kodu |

Minimum implementation hedefleri:

- `.github/workflows/ci.yml` gerçek remote branch üzerinde çalışır.
- Default branch (`main` veya `master`) tekil olarak kilitlenir ve deploy workflow trigger'ı buna hizalanır.
- Branch protection ve required checks evidence üretilir.
- CI run URL'si actionplan'a geri yazılabilir hale gelir.

Minimum doğrulama:

```bash
git status --short --branch
git remote -v
gh run list --workflow ci.yml --limit 5
gh api repos/<owner>/<repo>/branches/<default-branch>/protection
```

Çıkış evidence:

- `pr:<url>`
- `ci:<actions-run-url>`
- `branch-protection:<api-or-screenshot>`
- `default-branch:<main-or-master>`
- `manual-review:<reviewer/date>`

## PR-02 — Tenant Context

| Alan | Değer |
|---|---|
| Branch | `task/platform-tenancy-context` |
| WBS node | `platform-tenancy`, `k-tenancy` |
| Önkoşul | PR-01 merge + CI evidence |
| Amaç | Tenant context, fail-closed request handling, tenant test harness |
| Non-goal | Authz/PDP, Customer domain, UI |

Minimum implementation hedefleri:

- Request/job/event yolları tek `TenantContext` zarfına bağlanır.
- Tenant header/body güveni yasaklanır; trusted context boundary açık olur.
- Tenant yoksa fail-closed davranış test edilir.
- Cross-tenant access negative testleri eklenir.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_tenant_context.py tests/test_tenant_isolation.py
```

Çıkış evidence:

- tenant yokken 401/403 test logu
- cross-tenant negative test logu
- CI run URL
- rollback note

## PR-03 — Authn/AuthZ/PDP

| Alan | Değer |
|---|---|
| Branch | `task/platform-authz-pdp` |
| WBS node | `platform-authn-authz`, `k-authz`, `k-policy-pdp` |
| Önkoşul | PR-02 tenant context merge + evidence |
| Amaç | Minimal identity envelope, deny-by-default authz, PDP decision contract |
| Non-goal | Customer domain, billing, UI feature work |

Minimum implementation hedefleri:

- `ActorContext` ve `PolicyContext` tenant zarfıyla birlikte çalışır.
- Policy decision sonucu allow/deny/reason/audit fields taşır.
- Default deny davranışı endpoint/resolver seviyesinde test edilir.
- Step-up veya admin override yoksa explicit no-go olarak kalır.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_actor_context.py tests/test_policy_decision.py tests/test_authz_deny_default.py
```

Çıkış evidence:

- deny-by-default test logu
- PDP golden decision fixture
- CI run URL
- audit deny trace note

## PR-04 — Event/Outbox

| Alan | Değer |
|---|---|
| Branch | `task/k-bus-outbox-events` |
| WBS node | `k-bus` |
| Önkoşul | PR-03 authz/PDP merge + evidence |
| Amaç | Transactional outbox, event envelope, idempotent consumer contract |
| Non-goal | ECA action library, workflow designer |

Minimum implementation hedefleri:

- Event envelope tenant/actor/correlation/idempotency fields taşır.
- Outbox write aynı transaction boundary içinde test edilir.
- Consumer idempotency ve replay behavior test edilir.
- "Exactly once" iddiası kullanılmaz; at-least-once + idempotency kabul edilir.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_event_envelope.py tests/test_outbox.py tests/test_idempotent_consumer.py
```

Çıkış evidence:

- outbox transactional test logu
- duplicate event idempotency test logu
- replay/DLQ note
- CI run URL

## PR-05 — ECA Runtime

| Alan | Değer |
|---|---|
| Branch | `task/l1-workflow-eca-runtime` |
| WBS node | `l1-workflow` |
| Önkoşul | PR-04 event/outbox merge + evidence |
| Amaç | ECA runtime skeleton, safe action allowlist, max-chain guard |
| Non-goal | Visual workflow designer, customer-specific workflow |

Minimum implementation hedefleri:

- ECA trigger yalnız event/outbox envelope üzerinden çalışır.
- Safe action allowlist yoksa action deny edilir.
- Max chain depth test edilir.
- Human approval gereken action'lar otomatik koşmaz.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_eca_runtime.py tests/test_eca_action_allowlist.py tests/test_eca_chain_guard.py
```

Çıkış evidence:

- unauthorized action deny test logu
- max-chain guard test logu
- safe action allowlist fixture
- CI run URL

## PR-06 — Audit Envelope

| Alan | Değer |
|---|---|
| Branch | `task/l1-audit-envelope` |
| WBS node | `l1-audit` |
| Önkoşul | PR-05 ECA runtime merge + evidence |
| Amaç | Append-only audit envelope, tamper detection, actor/tenant audit fields |
| Non-goal | Reporting UI, analytics dashboard |

Minimum implementation hedefleri:

- Mutations audit envelope üretir.
- Audit record append-only davranır.
- Tamper detection veya hash chain strategy test edilir.
- Deny kararları audit'e düşer.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_audit_envelope.py tests/test_audit_immutability.py tests/test_audit_tamper_detection.py
```

Çıkış evidence:

- immutable audit test logu
- tamper detection test logu
- deny-audit fixture
- CI run URL

## PR-07 — Capability Registry

| Alan | Değer |
|---|---|
| Branch | `task/k-capability-registry` |
| WBS node | `k-capability` |
| Önkoşul | PR-06 audit envelope merge + evidence |
| Amaç | Module registry, manifest validation, capability/entitlement contract |
| Non-goal | Marketplace security, app store UI |

Minimum implementation hedefleri:

- Module manifest schema validate edilir.
- Duplicate slug ve invalid capability deny edilir.
- Capability olmadan route/menu/API görünürlüğü kapalıdır.
- Entitlement decision audit'e bağlanır.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_module_manifest.py tests/test_capability_registry.py tests/test_entitlement_gate.py
```

Çıkış evidence:

- manifest validation test logu
- duplicate slug negative test logu
- entitlement gate test logu
- CI run URL

## PR-08 — DB Schema + Migrations

| Alan | Değer |
|---|---|
| Branch | `task/platform-db-schema-migrations` |
| WBS node | `platform-db-schema` |
| Önkoşul | PR-07 capability registry merge + evidence |
| Amaç | SQLAlchemy/SQLModel/Alembic baseline, expand-contract policy, rollback drill |
| Non-goal | Customer schema, domain tables |

Minimum implementation hedefleri:

- API DB layer tek PostgreSQL hedefiyle bağlanır.
- Alembic baseline migration vardır.
- `upgrade()` ve `downgrade()` doludur.
- Empty DB ve existing DB migration path test edilir.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_db_connection.py tests/test_migration_baseline.py tests/test_migration_rollback.py
```

Çıkış evidence:

- migration upgrade logu
- migration downgrade logu
- DB connection test logu
- snapshot/rollback note

## PR-09 — Observability

| Alan | Değer |
|---|---|
| Branch | `task/platform-observability` |
| WBS node | `platform-observability` |
| Önkoşul | PR-08 DB/migration baseline merge + evidence |
| Amaç | Health/ready/metrics/trace/structured logging skeleton |
| Non-goal | Dashboard product UI |

Minimum implementation hedefleri:

- `/healthz` ve `/readyz` ayrı anlam taşır.
- Metrics endpoint veya exporter contract oluşur.
- Trace/correlation id request boyunca taşınır.
- Logs tenant/actor/correlation fields taşır ve PII maskelenir.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_readiness.py tests/test_observability_metrics.py tests/test_trace_propagation.py tests/test_structured_logging.py
```

Çıkış evidence:

- readiness test logu
- metrics smoke
- trace propagation test logu
- structured log masking test logu

## PR-10 — SDK Public Contract

| Alan | Değer |
|---|---|
| Branch | `task/be-sdk-public-contract` |
| WBS node | `be-sdk`, `dx-cli` |
| Önkoşul | PR-09 observability merge + evidence |
| Amaç | SDK public ports, deterministic codegen, generated-output guard |
| Non-goal | Full generator CLI, app templates, Customer CRUD |

Minimum implementation hedefleri:

- `packages/sdk` workspace'e eklenir.
- Public contract source tek ve versiyonludur.
- Codegen deterministic ve byte-stable çalışır.
- Generated output manual edit guard ve forbidden stack tests vardır.

Minimum doğrulama:

```bash
pnpm --filter @platform/sdk run test
pnpm --filter @platform/sdk run test -- codegen public-api
```

Çıkış evidence:

- SDK public API snapshot test logu
- deterministic codegen test logu
- manual-edit guard test logu
- forbidden stack guard test logu

## PR-11 — Hello Platform Boot Smoke

| Alan | Değer |
|---|---|
| Branch | `task/platform-factory-hello-platform` |
| WBS node | `platform-factory` |
| Önkoşul | PR-10 SDK public contract merge + evidence |
| Amaç | API + UI minimal boot smoke, tenant/request/SDK path smoke |
| Non-goal | Customer CRUD, OrderOps, Inventory |

Minimum implementation hedefleri:

- API boot + GraphQL ping + tenant request smoke geçer.
- UI shell boot smoke geçer.
- SDK public path minimal call veya fixture ile doğrulanır.
- Local smoke ve CI smoke evidence aynı PR'da toplanır.

Minimum doğrulama:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_hello_platform.py tests/test_tenant_request_smoke.py
pnpm --filter @platform/web run test -- hello-platform
pnpm --filter @platform/web run e2e -- hello-platform.spec.ts
```

Çıkış evidence:

- API boot smoke test logu
- UI boot smoke test logu
- SDK path smoke note
- CI run URL
- manual-review note

## PR-11 Sonrası Kapı

PR-11 tamamlanınca Customer vertical slice için ayrı PR kuyruğu açılır. Customer PR'ları şunlar tamamlanmadan başlamaz:

- PR-01 ile remote/CI baseline kanıtlandı.
- PR-02 ile tenant context fail-closed kanıtlandı.
- PR-03 ile deny-by-default authz/PDP kanıtlandı.
- PR-04 ile event/outbox/idempotency kanıtlandı.
- PR-05 ile ECA safe-action sınırı kanıtlandı.
- PR-06 ile audit append-only kanıtlandı.
- PR-07 ile capability registry kanıtlandı.
- PR-08 ile DB migration/rollback kanıtlandı.
- PR-09 ile observability skeleton kanıtlandı.
- PR-10 ile SDK public contract kanıtlandı.
- PR-11 ile hello-platform boot smoke kanıtlandı.

## Actionplan Geri Yazım

Her PR merge sonrası ilgili node için:

```json
{
  "refs": [
    "pr:<url>",
    "commit:<sha>",
    "ci:<url>"
  ],
  "evidence": [
    "AC geçti: <test-path>::<test-name>; ci:<url>",
    "rollback geçti: <log-or-note>"
  ],
  "traceability": {
    "implementationStatus": "verified"
  }
}
```

Kanıt yoksa `done` yoktur.
