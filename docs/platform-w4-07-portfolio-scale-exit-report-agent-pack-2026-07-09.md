# W4-07 Portfolio Scale Exit Report Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W4-07`
Branch: `task/portfolio-scale-exit-report`
WBS node'ları: `platform-factory`, `build-enterprise-readiness`, `product`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W4-06`

Bu belge product code üretmez. Amaç, W4-06 Operations Runbook Drills kanıtı kapandıktan sonra açılacak W4-07 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W4-07 yalnız şu kanıtlar geldikten sonra başlar:

- W3-07 enterprise DoD evidence pack verified
- W4-01 ready-to-code queue export verified
- W4-02 app factory release train verified
- W4-03 module marketplace guardrails verified
- W4-04 portfolio regression matrix verified
- W4-05 evidence dashboard blockers verified
- W4-06 operations runbook drills verified

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W4-07'nin tek amacı portfolio scale exit report kanıtını üretmektir:

- `reports/portfolio-scale-exit-report.md` içinde W4-01..W4-06 gerçek evidence linkleri toplanır.
- App factory release train proof bağlanır.
- Marketplace guardrail proof bağlanır.
- Regression matrix proof bağlanır.
- Evidence dashboard proof bağlanır.
- Operations drill proof bağlanır.
- Actionplan evidence patch ve manual-review note hazırlanır.

## Non-Goal

W4-07 şunları yapmaz:

- Product/meta-framework yazılımının tamamlandığını iddia etmez.
- Gerçek PR/CI/test/deploy/drill evidence olmadan portfolio scale verified yazmaz.
- Yeni app, yeni module, yeni domain veya yeni product feature geliştirmez.
- W4-01..W4-06 işlerindeki kanıtları taklit etmez veya placeholder ile kapatmaz.
- Canlı deploy, production launch veya public marketplace launch yapmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W4-06 evidence kapandıktan sonra kullanır:

```text
Görev: W4-07 Portfolio Scale Exit Report.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/portfolio-scale-exit-report
WBS nodes: platform-factory, build-enterprise-readiness, product
Prerequisite: W4-06 verified evidence in actionplan.

Amaç:
1. W4-01..W4-06 gerçek evidence linklerini portfolio scale exit report altında topla.
2. App factory release train proof, marketplace guardrail proof, regression matrix proof, evidence dashboard proof ve operations drill proof dosyalarını bağla.
3. Actionplan evidence patch taslağını gerçek PR/CI/test/deploy/drill kanıtlarıyla hazırla.
4. Manual-review note üret.
5. Meta-framework bitti iddiası kurmadan portfolio-scale exit report'u kanıta bağla.

Mutlak sınırlar:
- W4-06 evidence yoksa kod yazma; blocker raporu üret.
- Gerçek PR/CI/test/deploy/drill evidence olmadan portfolioScaleStatus=verified yazma.
- Product/meta-framework software complete, done, finished veya bitti iddiası yazma.
- Yeni app/module/domain/product feature başlatma.
- Public marketplace launch veya production deploy başlatma.
- Placeholder, local-only veya elle yazılmış sahte URL'leri evidence kabul etme.
- Actionplan'da status/progress/evidence alanlarını gerçek kanıt olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W4-01 ready-to-code queue evidence var/yok
- W4-02 app factory release train evidence var/yok
- W4-03 marketplace guardrail evidence var/yok
- W4-04 regression matrix evidence var/yok
- W4-05 evidence dashboard blocker evidence var/yok
- W4-06 operations drill evidence var/yok
- placeholder/stale/local-only evidence blocker durumu
- meta-framework bitti iddiası yazılmadığını gösteren note

Beklenen minimum değişiklikler:
- reports/portfolio-scale-exit-report.md
- reports/portfolio-scale/app-factory-proof.md
- reports/portfolio-scale/marketplace-guardrail-proof.md
- reports/portfolio-scale/regression-matrix-proof.md
- reports/portfolio-scale/evidence-dashboard-proof.md
- reports/portfolio-scale/operations-drill-proof.md
- reports/portfolio-scale/actionplan-evidence-patch.json
- reports/portfolio-scale/manual-review-note.md
- reports/portfolio-scale/meta-framework-not-done-note.md

Test/evidence-first sıra:
1. W4-01..W4-06 evidence eksikse exit report kırmızı/no-go olur.
2. Ready-to-code queue gate geçer.
3. App manifest/release train gate geçer.
4. Module marketplace security gate geçer.
5. Evidence dashboard gate geçer.
6. Regression matrix API ve web e2e geçer.
7. Operations drill proof linkleri ve owner/review date kontrol edilir.
8. Meta-framework/software complete iddiası bulunmadığı manuel note ile kanıtlanır.

Zorunlu doğrulama:
node tools/check-ready-to-code-queue.mjs
node tools/check-app-manifest.mjs
node tools/check-module-marketplace-security.mjs
node tools/check-evidence-dashboard.mjs
cd apps/api && uv run --python 3.12 pytest -q tests/test_regression_matrix.py
pnpm --filter @platform/web run e2e -- regression-matrix.spec.ts evidence-dashboard.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- reports/portfolio-scale-exit-report.md
- app factory release train proof
- marketplace guardrail proof
- regression matrix proof
- evidence dashboard proof
- operations drill proof
- actionplan evidence patch
- manual-review note
- meta-framework-not-done note
- rollback/smoke note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W4-06 evidence actionplan'da doğrulandı.
- [ ] Branch `task/portfolio-scale-exit-report` olarak açıldı.
- [ ] W4-01 evidence linkleri gerçek.
- [ ] W4-02 evidence linkleri gerçek.
- [ ] W4-03 evidence linkleri gerçek.
- [ ] W4-04 evidence linkleri gerçek.
- [ ] W4-05 evidence linkleri gerçek.
- [ ] W4-06 evidence linkleri gerçek.
- [ ] Placeholder/stale/local-only evidence yok.
- [ ] Meta-framework/software complete veya bitti iddiası yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Ready-to-code queue gate logu alındı.
- [ ] App manifest gate logu alındı.
- [ ] Module marketplace security gate logu alındı.
- [ ] Evidence dashboard gate logu alındı.
- [ ] Regression matrix API logu alındı.
- [ ] Regression matrix/evidence dashboard web e2e logu alındı.
- [ ] Operations drill proof linkleri alındı.
- [ ] Manual-review note alındı.
- [ ] Meta-framework-not-done note alındı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "platform-factory",
    "refs": [
      "docs/platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<portfolio-scale-exit-report-ref>"
    ],
    "evidence": [
      "W4-07 Portfolio Scale Exit Report geçti: <github-actions-run-url>",
      "Ready-to-code queue ve app factory release train proof exit report'a bağlandı: <app-factory-proof-ref>",
      "Yeni app/module üretimi tekrarlanabilirlik kanıtına bağlandı: <portfolio-scale-exit-report-ref>",
      "Meta-framework bitti iddiası yazılmadı: <meta-framework-not-done-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "portfolioScaleStatus": "verified",
      "portfolioScaleExitReportStatus": "verified",
      "queueStatus": "verified:W4-07"
    }
  },
  {
    "id": "build-enterprise-readiness",
    "refs": [
      "docs/platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md",
      "report:<regression-matrix-proof-ref>",
      "report:<evidence-dashboard-proof-ref>",
      "report:<operations-drill-proof-ref>"
    ],
    "evidence": [
      "Regression matrix, evidence dashboard ve operations drill proof exit report'a bağlandı: <portfolio-scale-exit-report-ref>",
      "Done-without-evidence mümkün değil; dashboard blocker ve manual review note doğrulandı: <manual-review-note-ref>"
    ],
    "traceability": {
      "enterpriseEvidenceStatus": "verified",
      "portfolioScaleExitReportStatus": "verified",
      "queueStatus": "verified:W4-07"
    }
  },
  {
    "id": "product",
    "refs": [
      "docs/platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md",
      "report:<portfolio-scale-exit-report-ref>",
      "report:<manual-review-note-ref>"
    ],
    "evidence": [
      "Product portfolio capability/entitlement ve app factory evidence exit report'a bağlandı: <portfolio-scale-exit-report-ref>",
      "Yeni Product CRUD veya product feature diff'i yok: <manual-review-note-ref>"
    ],
    "traceability": {
      "productPortfolioStatus": "verified",
      "portfolioScaleExitReportStatus": "verified",
      "queueStatus": "verified:W4-07"
    }
  }
]
```

## W4-07 Done Kapısı

W4-07 ancak şu koşullarla kapanır:

- W4-06 evidence daha önce verified durumdadır.
- W4-01..W4-06 gerçek PR/CI/test/deploy/drill evidence linkleri exit report'a bağlanmıştır.
- Ready-to-code queue, app manifest, module marketplace security, evidence dashboard ve regression matrix doğrulamaları geçer.
- Operations drill proof ve owner/review date kanıtı vardır.
- Actionplan evidence patch ve manual-review note vardır.
- Meta-framework/product software complete veya "bitti" iddiası yazılmamıştır.
- Yeni app/module/domain/product feature işi eklenmemiştir.
- `platform-factory`, `build-enterprise-readiness` ve `product` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan portfolio scale verified iddiası yazılmaz. Gerçek platform PR/CI/deploy/test kanıtı gelmeden "meta-framework tamamlandı" denmez.
