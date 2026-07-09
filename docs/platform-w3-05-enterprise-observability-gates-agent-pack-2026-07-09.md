# W3-05 Enterprise Observability Gates Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W3-05`
Branch: `task/enterprise-observability-gates`
WBS node'ları: `platform-observability`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W3-04`

Bu belge product code üretmez. Amaç, W3-04 Enterprise Reliability Gates kanıtı kapandıktan sonra açılacak W3-05 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W3-05 yalnız şu kanıtlar geldikten sonra başlar:

- W2-06 repeatability verified evidence
- W3-01 security gates verified evidence
- W3-02 performance gates verified evidence
- W3-03 accessibility gates verified evidence
- W3-04 reliability gates verified evidence
- PR-09 observability skeleton evidence

Bu kanıtlar yoksa W3-05 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W3-05'in tek amacı enterprise observability gate kanıtını üretmektir:

- Metrics endpoint staging smoke ile doğrulanır.
- Trace/correlation id propagation test logu üretilir.
- Structured logging ve PII masking test logu üretilir.
- Dashboard artifact veya dashboard smoke note üretilir.
- Observability gate kırmızıysa PR çıkışı fail-closed olur.

## Non-Goal

W3-05 şunları yapmaz:

- Analytics product, BI yüzeyi veya müşteri raporlama ürünü başlatmaz.
- W3-06 staging/prod release governance, CODEOWNERS, PR template veya branch protection işini başlatmaz.
- Incident management/on-call platformu veya alert routing ürünü üretmez.
- Domain feature, Customer/OrderOps/Inventory davranışı veya UI redesign işi yapmaz.
- Metrics/trace/log testlerini skip/xfail ile sahte yeşil yapmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W3-04 evidence kapandıktan sonra kullanır:

```text
Görev: W3-05 Enterprise Observability Gates.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/enterprise-observability-gates
WBS nodes: platform-observability
Prerequisite: W3-04 verified evidence in actionplan.

Amaç:
1. Metrics endpoint ve staging metrics smoke evidence üret.
2. Trace/correlation id propagation testlerini kanıtla.
3. Structured logging ve PII masking testlerini kanıtla.
4. Dashboard artifact veya dashboard smoke note üret.
5. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W3-04 evidence yoksa kod yazma; blocker raporu üret.
- Analytics product, BI/reporting UI, release governance veya incident platform işi başlatma.
- Metrics endpoint smoke'u gerçek staging URL/CI artifact olmadan passed yazma.
- PII masking testini log örneği veya test logu olmadan passed yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W3-04 reliability evidence referansları
- mevcut metrics endpoint var/yok durumu
- mevcut trace propagation test var/yok durumu
- mevcut structured logging + PII masking test var/yok durumu
- mevcut dashboard artifact/smoke note var/yok durumu
- analytics product veya release governance diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/observability.py
- apps/api/src/meta_api/logging.py
- apps/api/tests/test_observability_metrics.py
- apps/api/tests/test_trace_propagation.py
- apps/api/tests/test_structured_logging.py
- infra/observability/dashboard-smoke.md
- reports/observability/metrics-smoke.md
- reports/observability/trace-propagation.md
- reports/observability/structured-log-pii-masking.md
- reports/observability/dashboard-smoke.md
- reports/observability/observability-gate-summary.md

Test-first sıra:
1. Metrics endpoint contract/smoke testi önce kırmızı olur.
2. Trace propagation testleri correlation id'yi uçtan uca doğrular.
3. Structured log testi gerekli alanları doğrular.
4. PII masking testi hassas veri sızıntısını fail-closed yakalar.
5. Dashboard smoke artifact/note gerçek metrikleri referanslar.
6. Analytics product ve W3-06 release governance kapsamına taşma olmadığı kanıtlanır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_observability_metrics.py tests/test_trace_propagation.py tests/test_structured_logging.py
curl -fsS <staging-url>/metrics

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- metrics smoke logu
- trace propagation test logu
- structured log PII masking test logu
- dashboard smoke note
- analytics/release-governance non-goal diff note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W3-04 evidence actionplan'da doğrulandı.
- [ ] Branch `task/enterprise-observability-gates` olarak açıldı.
- [ ] İlk commit kırmızı metrics/trace/log testleri taşıyor.
- [ ] Metrics endpoint staging smoke evidence var.
- [ ] Trace propagation test logu var.
- [ ] Structured logging + PII masking test logu var.
- [ ] Dashboard artifact veya dashboard smoke note var.
- [ ] Analytics product, incident platform veya W3-06 release governance diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Metrics smoke logu alındı.
- [ ] Trace propagation test logu alındı.
- [ ] Structured log PII masking test logu alındı.
- [ ] Dashboard smoke note alındı.
- [ ] Analytics/release-governance non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "platform-observability",
    "refs": [
      "docs/platform-w3-05-enterprise-observability-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<observability-gate-summary-ref>"
    ],
    "evidence": [
      "W3-05 Enterprise Observability Gates geçti: <github-actions-run-url>",
      "Metrics smoke geçti: <metrics-smoke-log-ref>",
      "Trace propagation testleri geçti: <trace-propagation-log-ref>",
      "Structured log PII masking testleri geçti: <structured-log-pii-log-ref>",
      "Dashboard smoke note alındı: <dashboard-smoke-note-ref>",
      "Analytics product veya W3-06 release governance kapsamına taşma yok: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "observabilityEvidenceStatus": "verified",
      "dashboardSmokeEvidenceStatus": "verified",
      "queueStatus": "verified:W3-05"
    }
  }
]
```

## W3-05 Done Kapısı

W3-05 ancak şu koşullarla kapanır:

- W3-04 evidence daha önce verified durumdadır.
- Metrics endpoint smoke geçer.
- Trace propagation testleri geçer.
- Structured log ve PII masking testleri geçer.
- Dashboard artifact veya dashboard smoke note gerçek evidence olarak kaydedilir.
- Analytics product, incident platform, W3-06 release governance veya domain feature işi eklenmemiştir.
- `platform-observability` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W3-06 Release + Governance başlamaz.
