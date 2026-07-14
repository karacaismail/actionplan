# PR-09 Observability Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `PR-09`
Branch: `task/platform-observability`
WBS node'u: `platform-observability`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-08`

Bu belge product code üretmez. Amaç, PR-08 DB Schema/Migrations kanıtı kapandıktan sonra açılacak PR-09 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-09 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-04 event/outbox durability verified evidence
- PR-05 ECA runtime guard verified evidence
- PR-06 append-only audit verified evidence
- PR-07 module registry/capability entitlement verified evidence
- PR-08 DB/Alembic migration + rollback verified evidence
- `platform-db-schema` actionplan writeback'i

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-09'un tek amacı API gözlemlenebilirlik iskeletini kanıtlanabilir hale getirmektir:

- `/healthz` liveness ile `/readyz` dependency readiness anlamları ayrılır.
- Metrics endpoint veya exporter contract düşük kardinalite guard'larıyla oluşur.
- Trace/correlation id request boyunca taşınır.
- Structured logs tenant, actor, correlation ve trace alanlarını taşır.
- PII masking/redaction testleri güvenlik olaylarını ve normal request loglarını kapsar.
- Security event kayıtları audit envelope sözleşmesiyle uyumlu hale gelir.

## Non-Goal

PR-09 şunları yapmaz:

- Dashboard product UI, Grafana dashboard tasarımı veya ürün içi analytics ekranı oluşturmaz.
- Wave 3 enterprise dashboard smoke kapsamını tamamlamaz.
- Customer/domain observability, Customer CRUD veya domain metrikleri başlatmaz.
- Incident/on-call platformu, alert routing veya SIEM/export entegrasyonu kurmaz.
- Tam OpenTelemetry deployment, collector operasyonu veya production scrape topology'si bitirmez.
- Logging içine PII, secret, token veya yüksek kardinalite label eklemez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-08 evidence kapandıktan sonra kullanır:

```text
Görev: PR-09 Observability.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-observability
WBS nodes: platform-observability
Prerequisite: PR-01..PR-08 verified evidence in actionplan.

Amaç:
1. /healthz liveness ile /readyz readiness anlamlarını ayır.
2. Readiness checks için DB ve temel dependency modelini fail-closed kur.
3. Metrics endpoint veya exporter contract'ını düşük kardinalite label guard'larıyla ekle.
4. Trace/correlation id middleware'ini request boyunca taşı ve response/header/log alanlarına bağla.
5. Structured JSON logging'i tenant_id, actor_id, correlation_id, trace_id ve severity alanlarıyla standartlaştır.
6. PII masking/redaction testlerini request log, security event ve error log yollarında yeşile taşı.
7. Security event kayıtlarını PR-06 audit envelope sözleşmesiyle uyumlu hale getir.

Mutlak sınırlar:
- PR-08 evidence yoksa kod yazma; blocker raporu üret.
- Dashboard product UI, Grafana tasarımı, Customer/domain metric veya incident platformu başlatma.
- Trace/log/metrics içine secret, token, raw email, TCKN, phone veya payload dump yazma.
- Metrics label'larında user_id, email, request path param value veya tenant-specific unbounded value kullanma.
- Testsiz observability middleware veya logging değişikliği yapma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-08 evidence referansları
- apps/api/src/meta_api/app.py route/middleware durumu
- apps/api/src/meta_api/observability.py ve logging.py var/yok durumu
- apps/api/tests altındaki health/readiness/metrics/trace/logging testleri
- pyproject dependency durumu: logging, metrics, tracing ve test araçları

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/observability.py
- apps/api/src/meta_api/logging.py
- apps/api/src/meta_api/app.py
- apps/api/tests/test_health_ready.py
- apps/api/tests/test_observability.py
- apps/api/tests/test_observability_metrics.py
- apps/api/tests/test_trace_propagation.py
- apps/api/tests/test_structured_logging.py

Test-first sıra:
1. /healthz dependency check yapmadan liveness döner.
2. /readyz DB/dependency readiness fail-closed döner ve healthy durumda yeşile döner.
3. Metrics endpoint/exporter düşük kardinalite metric isimleriyle smoke geçer.
4. Trace/correlation id missing olduğunda üretilir, geldiğinde korunur ve response/log içinde taşınır.
5. Structured logs tenant_id, actor_id, correlation_id, trace_id ve severity alanlarını taşır.
6. PII redaction raw email/TCKN/token/payload secret sızıntısını engeller.
7. Security event formatı audit envelope ile uyumlu alan seti taşır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_health_ready.py tests/test_observability.py tests/test_observability_metrics.py tests/test_trace_propagation.py tests/test_structured_logging.py

Çıkış:
- PR URL
- CI run URL
- health/ready test logu
- metrics smoke logu
- trace propagation test logu
- structured logging + PII masking test logu
- audit envelope compatibility note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-08 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-observability` olarak açıldı.
- [ ] İlk commit kırmızı health/ready, metrics, trace veya structured logging testi taşıyor.
- [ ] `/healthz` ve `/readyz` semantiği ayrı testlerle kanıtlandı.
- [ ] Metrics endpoint/exporter contract ve düşük kardinalite guard testleri var.
- [ ] Trace/correlation id propagation testleri var.
- [ ] Structured logging alan sözleşmesi testleri var.
- [ ] PII masking/redaction testleri var.
- [ ] Security event audit envelope uyumluluk notu var.
- [ ] Dashboard UI, Customer/domain metric, incident platformu ve SIEM/export diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Health/ready test logu alındı.
- [ ] Metrics smoke logu alındı.
- [ ] Trace propagation test logu alındı.
- [ ] Structured logging + PII masking test logu alındı.
- [ ] Audit envelope compatibility note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-observability",
  "refs": [
    "docs/platform-pr09-observability-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<observability-test-log-ref>"
  ],
  "evidence": [
    "PR-09 Observability geçti: <github-actions-run-url>",
    "Health/ready semantic testleri geçti: <test-log-ref>",
    "Metrics smoke ve kardinalite guard testleri geçti: <test-log-ref>",
    "Trace/correlation propagation testleri geçti: <test-log-ref>",
    "Structured logging ve PII masking testleri geçti: <test-log-ref>",
    "Audit envelope compatibility note: <ref>",
    "Rollback note: observability middleware/config revert edilebilir; dashboard product UI ve Customer/domain observability eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "observabilityEvidenceStatus": "verified",
    "queueStatus": "verified:PR-09"
  }
}
```

## PR-09 Done Kapısı

PR-09 ancak şu koşullarla kapanır:

- PR-01..PR-08 evidence daha önce verified durumdadır.
- `/healthz` liveness ile `/readyz` readiness semantiği testlidir.
- Metrics endpoint/exporter contract düşük kardinalite guard'larıyla testlidir.
- Trace/correlation id request, response ve log akışında taşınır.
- Structured logs tenant/actor/correlation/trace alanlarını taşır.
- PII masking/redaction negatif testleri geçer.
- Security event formatı audit envelope ile uyumludur.
- `platform-observability` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-10 SDK Public Contract başlamaz.
