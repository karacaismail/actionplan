# W3-04 Enterprise Reliability Gates Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W3-04`
Branch: `task/enterprise-reliability-gates`
WBS node'ları: `build-enterprise-readiness`, `deploy-yap`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W3-03`

Bu belge product code üretmez. Amaç, W3-03 Enterprise Accessibility Gates kanıtı kapandıktan sonra açılacak W3-04 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W3-04 yalnız şu kanıtlar geldikten sonra başlar:

- W2-06 repeatability verified evidence
- W3-01 security gates verified evidence
- W3-02 performance gates verified evidence
- W3-03 accessibility gates verified evidence
- Customer, OrderOps ve Inventory temel e2e/smoke evidence

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W3-04'ün tek amacı enterprise reliability gate kanıtını üretmektir:

- Retry policy ve idempotent consumer davranışı negatif/pozitif testlerle kanıtlanır.
- DLQ ve failure injection senaryoları loglanır.
- Migration rollback drill `alembic downgrade -1` veya platformdaki eşdeğer komutla doğrulanır.
- Event/outbox/worker failure path'leri fail-closed ve observable hale gelir.
- `deploy-yap` etkisi yalnız migration/rollback drill evidence ile sınırlıdır; staging/prod release governance W3-06'ya kalır.

## Non-Goal

W3-04 şunları yapmaz:

- New workflow designer, scheduler UI veya görsel workflow işi başlatmaz.
- W3-05 observability dashboard/smoke işini başlatmaz.
- W3-06 staging/prod release governance, CODEOWNERS, PR template veya branch protection işini başlatmaz.
- Customer/OrderOps/Inventory business davranışını değiştirmez.
- Failure injection, DLQ veya rollback testlerini skip/xfail ile sahte yeşil yapmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W3-03 evidence kapandıktan sonra kullanır:

```text
Görev: W3-04 Enterprise Reliability Gates.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/enterprise-reliability-gates
WBS nodes: build-enterprise-readiness, deploy-yap
Prerequisite: W3-03 verified evidence in actionplan.

Amaç:
1. Retry policy, idempotent consumer ve DLQ davranışını test-first kanıtla.
2. Event/outbox/worker failure injection senaryoları ve loglarını üret.
3. Migration rollback drill'i gerçek komut/test loguyla doğrula.
4. deploy-yap kapsamını yalnız rollback/migration drill evidence ile sınırla; W3-06 release governance'a atlama.
5. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W3-03 evidence yoksa kod yazma; blocker raporu üret.
- New workflow designer, observability dashboard, release governance veya domain feature işi başlatma.
- Retry/DLQ/failure injection testlerini skip, xfail veya mock-only evidence ile gizleme.
- Migration rollback'i gerçek downgrade/rollback logu olmadan passed yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W3-03 accessibility evidence referansları
- mevcut retry/idempotency/DLQ test var/yok durumu
- mevcut failure injection fixture var/yok durumu
- mevcut migration rollback drill/log var/yok durumu
- W3-06 release governance diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- apps/api/tests/failure_injection/test_enterprise_reliability.py
- apps/api/tests/failure_injection/test_dlq.py
- apps/api/tests/test_migration_rollback.py
- apps/api/tests/test_idempotent_consumer.py
- apps/api/tests/test_retry_policy.py
- reports/reliability/failure-injection.md
- reports/reliability/dlq-log.md
- reports/reliability/migration-rollback.md
- reports/reliability/reliability-gate-summary.md
- infra/runbooks/migration.md
- infra/runbooks/rollback.md

Test-first sıra:
1. Retry policy failure/timeout senaryosu önce kırmızı olur.
2. Idempotent consumer duplicate delivery testi yeşile döner.
3. DLQ threshold ve poison-message testi yeşile döner.
4. Failure injection event/outbox/worker path'lerinde log üretir.
5. Migration rollback drill downgrade/upgrade round-trip loguyla geçer.
6. W3-05/W3-06 kapsamına taşma olmadığını diff note kanıtlar.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/failure_injection tests/test_migration_rollback.py tests/test_idempotent_consumer.py
cd apps/api && uv run --python 3.12 pytest -q tests/test_retry_policy.py

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- retry/idempotency test logu
- DLQ/failure injection logu
- migration rollback logu
- W3-05/W3-06 non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W3-03 evidence actionplan'da doğrulandı.
- [ ] Branch `task/enterprise-reliability-gates` olarak açıldı.
- [ ] İlk commit kırmızı retry/idempotency/failure injection testi taşıyor.
- [ ] Retry policy ve idempotent consumer testleri var.
- [ ] DLQ ve poison-message/failure injection logları var.
- [ ] Migration rollback drill logu var.
- [ ] Release governance, observability dashboard veya workflow designer diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Retry/idempotency test logu alındı.
- [ ] DLQ/failure injection logu alındı.
- [ ] Migration rollback logu alındı.
- [ ] W3-05/W3-06 non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "build-enterprise-readiness",
    "refs": [
      "docs/platform-w3-04-enterprise-reliability-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<reliability-gate-summary-ref>"
    ],
    "evidence": [
      "W3-04 Enterprise Reliability Gates geçti: <github-actions-run-url>",
      "Retry/idempotency testleri geçti: <retry-idempotency-log-ref>",
      "DLQ/failure injection logu geçti: <dlq-failure-injection-log-ref>",
      "Migration rollback drill geçti: <migration-rollback-log-ref>",
      "W3-05/W3-06 kapsamına taşma yok: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "reliabilityEvidenceStatus": "verified",
      "queueStatus": "verified:W3-04"
    }
  },
  {
    "id": "deploy-yap",
    "refs": [
      "docs/platform-w3-04-enterprise-reliability-gates-agent-pack-2026-07-09.md",
      "report:<migration-rollback-log-ref>"
    ],
    "evidence": [
      "W3-04 migration rollback drill evidence alındı: <migration-rollback-log-ref>",
      "Tam staging/prod release governance W3-06'ya bırakıldı: <diff-note-ref>"
    ],
    "traceability": {
      "rollbackDrillEvidenceStatus": "verified"
    }
  }
]
```

## W3-04 Done Kapısı

W3-04 ancak şu koşullarla kapanır:

- W3-03 evidence daha önce verified durumdadır.
- Retry policy ve idempotent consumer testleri geçer.
- DLQ/failure injection logları geçer.
- Migration rollback drill gerçek logla geçer.
- Workflow designer, observability dashboard, release governance veya domain feature işi eklenmemiştir.
- `build-enterprise-readiness` ve rollback drill kapsamıyla `deploy-yap` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W3-05 Observability Gates başlamaz.
