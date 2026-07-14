# W4-06 Operations Runbook Drills Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W4-06`
Branch: `task/operations-runbook-drills`
WBS node'ları: `deploy-yap`, `build-risk-defteri`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W4-05`

Bu belge product code üretmez. Amaç, W4-05 Evidence Dashboard Blockers kanıtı kapandıktan sonra açılacak W4-06 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W4-06 yalnız şu kanıtlar geldikten sonra başlar:

- W3-07 enterprise DoD evidence pack verified
- W4-01 ready-to-code queue export verified
- W4-02 app factory release train verified
- W4-03 module marketplace guardrails verified
- W4-04 portfolio regression matrix verified
- W4-05 evidence dashboard blockers verified

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W4-06'nın tek amacı operations runbook drill kanıtını üretmektir:

- Incident runbook dosyası ve drill logu vardır.
- Rollback runbook dosyası ve drill logu vardır.
- Migration runbook dosyası ve drill logu vardır.
- Tenant support runbook dosyası ve drill logu vardır.
- Her runbook owner ve review date taşır.

## Non-Goal

W4-06 şunları yapmaz:

- Yeni domain, yeni app, yeni module veya product feature geliştirmez.
- Deploy altyapısını production'a taşımayı veya canlı release yapmayı hedeflemez.
- Evidence dashboard veya portfolio exit report üretmez; bunlar W4-05 ve W4-07 kapsamıdır.
- Runbook dosyası olmadan drill evidence uydurmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test/drill kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W4-05 evidence kapandıktan sonra kullanır:

```text
Görev: W4-06 Operations Runbook Drills.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/operations-runbook-drills
WBS nodes: deploy-yap, build-risk-defteri
Prerequisite: W4-05 verified evidence in actionplan.

Amaç:
1. Incident, rollback, migration ve tenant-support runbook dosyalarını tamamla.
2. Her runbook için drill log üret.
3. Her runbook için owner ve review date alanlarını kanıtla.
4. Risk register ile runbook drill sonuçlarını bağla.
5. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W4-05 evidence yoksa kod yazma; blocker raporu üret.
- Canlı deploy, production release veya infrastructure provisioning başlatma.
- Yeni app/module/domain/product feature başlatma.
- Runbook olmayan konuya drill geçmiş gibi evidence yazma.
- Evidence dashboard veya W4-07 exit report işi başlatma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test/drill kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W4-05 evidence dashboard blockers evidence referansları
- infra/runbooks/incident.md var/yok durumu
- infra/runbooks/rollback.md var/yok durumu
- infra/runbooks/migration.md var/yok durumu
- infra/runbooks/tenant-support.md var/yok durumu
- her runbook owner/review date var/yok durumu
- mevcut drill log var/yok durumu
- canlı deploy veya yeni product feature diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- infra/runbooks/incident.md
- infra/runbooks/rollback.md
- infra/runbooks/migration.md
- infra/runbooks/tenant-support.md
- reports/runbooks/incident-drill.md
- reports/runbooks/rollback-drill.md
- reports/runbooks/migration-drill.md
- reports/runbooks/tenant-support-drill.md
- reports/runbooks/owner-review-dates.md
- reports/runbooks/operations-runbook-drills-summary.md
- reports/portfolio-risk-register.md

Test/evidence-first sıra:
1. Eksik runbook dosyaları önce doğrulamada kırmızı görünür.
2. Her runbook owner ve review date taşır.
3. Incident drill logu gerçek adım/sonuç içerir.
4. Rollback drill logu geri alma adım/sonuç içerir.
5. Migration drill logu migrate/rollback veya dry-run adım/sonuç içerir.
6. Tenant support drill logu tenant isolation/support adım/sonuç içerir.
7. Canlı deploy veya yeni feature kapsamına taşma olmadığı diff note ile kanıtlanır.

Zorunlu doğrulama:
test -f infra/runbooks/incident.md
test -f infra/runbooks/rollback.md
test -f infra/runbooks/migration.md
test -f infra/runbooks/tenant-support.md

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- incident drill log
- rollback drill log
- migration drill log
- tenant support drill log
- owner/review date evidence
- risk register update evidence
- live-deploy/product-feature non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W4-05 evidence actionplan'da doğrulandı.
- [ ] Branch `task/operations-runbook-drills` olarak açıldı.
- [ ] `infra/runbooks/incident.md` var.
- [ ] `infra/runbooks/rollback.md` var.
- [ ] `infra/runbooks/migration.md` var.
- [ ] `infra/runbooks/tenant-support.md` var.
- [ ] Her runbook owner ve review date taşıyor.
- [ ] Dört drill log var.
- [ ] Risk register drill sonuçlarına bağlandı.
- [ ] Canlı deploy veya yeni product feature diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Runbook file existence validation logu alındı.
- [ ] Incident drill logu alındı.
- [ ] Rollback drill logu alındı.
- [ ] Migration drill logu alındı.
- [ ] Tenant support drill logu alındı.
- [ ] Owner/review date evidence alındı.
- [ ] Risk register update evidence alındı.
- [ ] Live-deploy/product-feature non-goal diff note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "deploy-yap",
    "refs": [
      "docs/platform-w4-06-operations-runbook-drills-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<operations-runbook-drills-summary-ref>"
    ],
    "evidence": [
      "W4-06 Operations Runbook Drills geçti: <github-actions-run-url>",
      "Incident/rollback/migration/tenant-support runbook dosyaları doğrulandı: <validation-log-ref>",
      "Incident drill logu alındı: <incident-drill-ref>",
      "Rollback drill logu alındı: <rollback-drill-ref>",
      "Migration drill logu alındı: <migration-drill-ref>",
      "Tenant support drill logu alındı: <tenant-support-drill-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "operationsRunbookStatus": "verified",
      "incidentDrillStatus": "verified",
      "rollbackDrillStatus": "verified",
      "migrationDrillStatus": "verified",
      "tenantSupportDrillStatus": "verified",
      "queueStatus": "verified:W4-06"
    }
  },
  {
    "id": "build-risk-defteri",
    "refs": [
      "docs/platform-w4-06-operations-runbook-drills-agent-pack-2026-07-09.md",
      "report:<portfolio-risk-register-ref>",
      "report:<owner-review-dates-ref>"
    ],
    "evidence": [
      "Runbook drill sonuçları portfolio risk register'a bağlandı: <portfolio-risk-register-ref>",
      "Her runbook owner ve review date taşıyor: <owner-review-dates-ref>"
    ],
    "traceability": {
      "portfolioRiskStatus": "verified",
      "runbookOwnerReviewStatus": "verified",
      "queueStatus": "verified:W4-06"
    }
  }
]
```

## W4-06 Done Kapısı

W4-06 ancak şu koşullarla kapanır:

- W4-05 evidence daha önce verified durumdadır.
- Incident, rollback, migration ve tenant-support runbook dosyaları vardır.
- Her runbook owner ve review date taşır.
- Dört drill log vardır.
- Portfolio risk register drill sonuçlarını taşır.
- Dört `test -f infra/runbooks/*.md` doğrulaması geçer.
- Canlı deploy, infrastructure provisioning veya yeni product feature işi eklenmemiştir.
- `deploy-yap` ve `build-risk-defteri` node'larına PR/CI/test/drill evidence geri yazılmıştır.

Bu done kapısı kapanmadan W4-07 Portfolio Scale Exit Report başlamaz.
