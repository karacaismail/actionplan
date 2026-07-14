# W4-04 Portfolio Regression Matrix Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W4-04`
Branch: `task/portfolio-regression-matrix`
WBS node'ları: `build-referans-uygulama`, `build-enterprise-readiness`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W4-03`

Bu belge product code üretmez. Amaç, W4-03 Module Marketplace Guardrails kanıtı kapandıktan sonra açılacak W4-04 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W4-04 yalnız şu kanıtlar geldikten sonra başlar:

- W3-07 enterprise DoD evidence pack verified
- W4-01 ready-to-code queue export verified
- W4-02 app factory release train verified
- W4-03 module marketplace guardrails verified
- Customer, OrderOps ve Inventory vertical slice evidence daha önce actionplan'a geri yazıldı

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W4-04'ün tek amacı portfolio regression matrix kanıtını üretmektir:

- Customer smoke regression çalışır.
- OrderOps smoke regression çalışır.
- Inventory smoke regression çalışır.
- Tenant/authz/audit regression matrix üç app için geçer.
- API regression matrix ve web e2e regression matrix aynı PR/CI evidence setine bağlanır.

## Non-Goal

W4-04 şunları yapmaz:

- Dördüncü domain, yeni app veya yeni module geliştirmez.
- Customer/OrderOps/Inventory feature kapsamını büyütmez.
- Marketplace guardrail, evidence dashboard, operations drill veya portfolio exit report işi başlatmaz.
- Enterprise DoD kanıtlarını yeniden yazmaz; yalnız regression matrix tüketir.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W4-03 evidence kapandıktan sonra kullanır:

```text
Görev: W4-04 Portfolio Regression Matrix.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/portfolio-regression-matrix
WBS nodes: build-referans-uygulama, build-enterprise-readiness
Prerequisite: W4-03 verified evidence in actionplan.

Amaç:
1. Customer, OrderOps ve Inventory için portfolio regression matrix oluştur.
2. API seviyesinde tenant/authz/audit regression testini tek matrix altında koştur.
3. Web seviyesinde regression-matrix.spec.ts ile üç app smoke yolunu koştur.
4. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.
5. Dördüncü domain veya yeni feature kapsamına taşmadan mevcut üç app için regression kırılmalarını yakala.

Mutlak sınırlar:
- W4-03 evidence yoksa kod yazma; blocker raporu üret.
- Dördüncü domain, yeni app, yeni module veya yeni product feature başlatma.
- Marketplace, evidence dashboard, operations drill veya portfolio exit report işi başlatma.
- Mevcut app behavior'ını regression testi geçsin diye gevşetme.
- Tenant/authz/audit negatif kontrollerini silme veya skip etme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W4-03 module marketplace guardrails evidence referansları
- mevcut Customer smoke test var/yok durumu
- mevcut OrderOps smoke test var/yok durumu
- mevcut Inventory smoke test var/yok durumu
- tenant/authz/audit regression matrix var/yok durumu
- regression-matrix.spec.ts var/yok durumu
- dördüncü domain veya feature diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- apps/api/tests/test_regression_matrix.py
- apps/web/e2e/regression-matrix.spec.ts
- reports/regression/customer-smoke.md
- reports/regression/orderops-smoke.md
- reports/regression/inventory-smoke.md
- reports/regression/tenant-authz-audit-matrix.md
- reports/regression/customer-order-inventory.md
- reports/regression/portfolio-regression-matrix-summary.md

Test/evidence-first sıra:
1. Eksik Customer/OrderOps/Inventory smoke önce matrix'te kırmızı görünür.
2. Tenant izolasyon negatif case'i üç app için geçer.
3. Authz deny case'i üç app için geçer.
4. Audit append evidence üç app için geçer.
5. Web e2e smoke üç app için geçer.
6. Dördüncü domain veya feature kapsamına taşma olmadığı diff note ile kanıtlanır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_regression_matrix.py
pnpm --filter @platform/web run e2e -- regression-matrix.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- Customer smoke logu
- OrderOps smoke logu
- Inventory smoke logu
- tenant/authz/audit regression matrix
- web regression-matrix e2e logu
- fourth-domain/product-feature non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W4-03 evidence actionplan'da doğrulandı.
- [ ] Branch `task/portfolio-regression-matrix` olarak açıldı.
- [ ] Customer smoke matrix'e bağlı.
- [ ] OrderOps smoke matrix'e bağlı.
- [ ] Inventory smoke matrix'e bağlı.
- [ ] Tenant/authz/audit negatif kontrolleri üç app için var.
- [ ] Web e2e `regression-matrix.spec.ts` üç app smoke yolunu koşturuyor.
- [ ] Dördüncü domain, yeni app veya feature diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] API regression matrix logu alındı.
- [ ] Web e2e regression matrix logu alındı.
- [ ] Customer/OrderOps/Inventory smoke evidence alındı.
- [ ] Tenant/authz/audit matrix evidence alındı.
- [ ] Fourth-domain/product-feature non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "build-referans-uygulama",
    "refs": [
      "docs/platform-w4-04-portfolio-regression-matrix-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<portfolio-regression-matrix-summary-ref>"
    ],
    "evidence": [
      "W4-04 Portfolio Regression Matrix geçti: <github-actions-run-url>",
      "Customer smoke regression geçti: <customer-smoke-ref>",
      "OrderOps smoke regression geçti: <orderops-smoke-ref>",
      "Inventory smoke regression geçti: <inventory-smoke-ref>",
      "Dördüncü domain veya feature kapsamına taşma yok: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "regressionMatrixStatus": "verified",
      "customerSmokeStatus": "verified",
      "orderOpsSmokeStatus": "verified",
      "inventorySmokeStatus": "verified",
      "queueStatus": "verified:W4-04"
    }
  },
  {
    "id": "build-enterprise-readiness",
    "refs": [
      "docs/platform-w4-04-portfolio-regression-matrix-agent-pack-2026-07-09.md",
      "report:<tenant-authz-audit-matrix-ref>",
      "report:<web-regression-e2e-log-ref>"
    ],
    "evidence": [
      "Tenant/authz/audit regression matrix üç app için geçti: <tenant-authz-audit-matrix-ref>",
      "Web regression-matrix e2e üç app için geçti: <web-regression-e2e-log-ref>"
    ],
    "traceability": {
      "portfolioRegressionMatrixStatus": "verified",
      "tenantAuthzAuditMatrixStatus": "verified",
      "queueStatus": "verified:W4-04"
    }
  }
]
```

## W4-04 Done Kapısı

W4-04 ancak şu koşullarla kapanır:

- W4-03 evidence daha önce verified durumdadır.
- Customer smoke regression geçer.
- OrderOps smoke regression geçer.
- Inventory smoke regression geçer.
- Tenant/authz/audit regression matrix üç app için geçer.
- `cd apps/api && uv run --python 3.12 pytest -q tests/test_regression_matrix.py` geçer.
- `pnpm --filter @platform/web run e2e -- regression-matrix.spec.ts` geçer.
- Dördüncü domain, yeni app veya feature işi eklenmemiştir.
- `build-referans-uygulama` ve `build-enterprise-readiness` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W4-05 Evidence Dashboard Blockers başlamaz.
