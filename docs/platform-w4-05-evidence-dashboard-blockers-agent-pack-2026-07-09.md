# W4-05 Evidence Dashboard Blockers Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W4-05`
Branch: `task/evidence-dashboard-blockers`
WBS node'ları: `dx-workflow`, `build-enterprise-readiness`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W4-04`

Bu belge product code üretmez. Amaç, W4-04 Portfolio Regression Matrix kanıtı kapandıktan sonra açılacak W4-05 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W4-05 yalnız şu kanıtlar geldikten sonra başlar:

- W3-07 enterprise DoD evidence pack verified
- W4-01 ready-to-code queue export verified
- W4-02 app factory release train verified
- W4-03 module marketplace guardrails verified
- W4-04 portfolio regression matrix verified

Bu kanıtlar yoksa W4-05 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W4-05'in tek amacı evidence dashboard ve done-without-evidence blocker kanıtını üretmektir:

- `reports/evidence-dashboard.json` üretilebilir ve schema/gate kontrolünden geçer.
- Done iddiası PR/CI/test/deploy/manual-review evidence olmadan geçemez.
- Dashboard smoke üç app ve portfolio queue evidence durumunu gösterir.
- `tools/check-evidence-dashboard.mjs` CI gate olarak evidence completeness ve stale evidence durumunu bloklar.

## Non-Goal

W4-05 şunları yapmaz:

- Yeni app, yeni module veya yeni product feature geliştirmez.
- Customer/OrderOps/Inventory regression matrix'i değiştirmez; bu W4-04 kapsamındadır.
- Operations runbook drill veya portfolio exit report üretmez.
- Kanıtsız item'ları `done`, `verified` veya `complete` yapmaz.
- Dashboard görsel tasarımını genişletmez; yalnız evidence completeness ve blocker davranışı kanıtlanır.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W4-04 evidence kapandıktan sonra kullanır:

```text
Görev: W4-05 Evidence Dashboard Blockers.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/evidence-dashboard-blockers
WBS nodes: dx-workflow, build-enterprise-readiness
Prerequisite: W4-04 verified evidence in actionplan.

Amaç:
1. reports/evidence-dashboard.json artifact'ını üret veya tamamla.
2. Done-without-evidence blocker testini ekle.
3. tools/check-evidence-dashboard.mjs CI gate'ini evidence completeness, stale evidence ve required link kontrolleriyle tamamla.
4. Web dashboard smoke'u evidence-dashboard.spec.ts ile koştur.
5. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W4-04 evidence yoksa kod yazma; blocker raporu üret.
- Yeni app/module/product feature başlatma.
- Evidence dashboard'u gerçek kanıt yerine mock yeşil durum üretmek için kullanma.
- Kanıtsız item'ı done/verified/complete yapma.
- Operations runbook drill veya portfolio exit report işi başlatma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W4-04 portfolio regression matrix evidence referansları
- mevcut reports/evidence-dashboard.json var/yok durumu
- mevcut done-without-evidence blocker test var/yok durumu
- mevcut tools/check-evidence-dashboard.mjs coverage durumu
- mevcut evidence-dashboard.spec.ts var/yok durumu
- kanıtsız done/verified item olmadığını veya varsa blocker raporunu gösteren note

Beklenen minimum değişiklikler:
- reports/evidence-dashboard.json
- reports/evidence-dashboard-validation.md
- reports/evidence-dashboard-smoke.md
- reports/evidence-dashboard/done-without-evidence-blocker.md
- reports/evidence-dashboard/evidence-dashboard-blockers-summary.md
- tools/check-evidence-dashboard.mjs
- apps/web/e2e/evidence-dashboard.spec.ts

Test/evidence-first sıra:
1. Evidence eksik item önce blocker testinde kırmızı görünür.
2. PR URL, CI run URL, test log, deploy/smoke ve manual-review alanları olmadan done reddedilir.
3. Stale evidence veya placeholder evidence reddedilir.
4. Dashboard smoke üç app + queue evidence durumunu gösterir.
5. Actionplan writeback patch'i yalnız gerçek PR/CI/test evidence geldiğinde uygulanır.

Zorunlu doğrulama:
node tools/check-evidence-dashboard.mjs
pnpm --filter @platform/web run e2e -- evidence-dashboard.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- reports/evidence-dashboard.json
- done-without-evidence blocker test logu
- evidence dashboard validation logu
- dashboard smoke logu
- stale/placeholder evidence blocker note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W4-04 evidence actionplan'da doğrulandı.
- [ ] Branch `task/evidence-dashboard-blockers` olarak açıldı.
- [ ] `reports/evidence-dashboard.json` artifact var.
- [ ] Done-without-evidence blocker test var.
- [ ] `tools/check-evidence-dashboard.mjs` evidence completeness ve stale/placeholder evidence kontrol ediyor.
- [ ] `apps/web/e2e/evidence-dashboard.spec.ts` dashboard smoke koşturuyor.
- [ ] Kanıtsız done/verified/complete ilerlemesi yok.
- [ ] Yeni app/module/product feature diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Evidence dashboard JSON artifact alındı.
- [ ] Done-without-evidence blocker logu alındı.
- [ ] Evidence dashboard validation logu alındı.
- [ ] Dashboard smoke logu alındı.
- [ ] Stale/placeholder evidence blocker note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "dx-workflow",
    "refs": [
      "docs/platform-w4-05-evidence-dashboard-blockers-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<evidence-dashboard-blockers-summary-ref>"
    ],
    "evidence": [
      "W4-05 Evidence Dashboard Blockers geçti: <github-actions-run-url>",
      "reports/evidence-dashboard.json üretildi ve doğrulandı: <dashboard-json-ref>",
      "Done-without-evidence blocker testi geçti: <blocker-test-log-ref>",
      "Dashboard smoke geçti: <dashboard-smoke-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "evidenceDashboardStatus": "verified",
      "doneWithoutEvidenceBlockerStatus": "verified",
      "queueStatus": "verified:W4-05"
    }
  },
  {
    "id": "build-enterprise-readiness",
    "refs": [
      "docs/platform-w4-05-evidence-dashboard-blockers-agent-pack-2026-07-09.md",
      "report:<evidence-dashboard-validation-ref>",
      "report:<dashboard-smoke-ref>"
    ],
    "evidence": [
      "Enterprise readiness evidence dashboard required PR/CI/test/deploy/manual-review linklerini blokluyor: <validation-ref>",
      "Stale veya placeholder evidence blocker aktif: <blocker-note-ref>"
    ],
    "traceability": {
      "evidenceDashboardStatus": "verified",
      "doneWithoutEvidenceBlockerStatus": "verified",
      "queueStatus": "verified:W4-05"
    }
  }
]
```

## W4-05 Done Kapısı

W4-05 ancak şu koşullarla kapanır:

- W4-04 evidence daha önce verified durumdadır.
- `reports/evidence-dashboard.json` üretilir ve doğrulanır.
- Done-without-evidence blocker testi geçer.
- Stale/placeholder evidence blocker aktiftir.
- Dashboard smoke geçer.
- `node tools/check-evidence-dashboard.mjs` geçer.
- `pnpm --filter @platform/web run e2e -- evidence-dashboard.spec.ts` geçer.
- Yeni app/module/product feature işi eklenmemiştir.
- `dx-workflow` ve `build-enterprise-readiness` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W4-06 Operations Runbook Drills başlamaz.
