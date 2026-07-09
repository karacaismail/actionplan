# W4-01 Ready-To-Code Queue Export Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W4-01`
Branch: `task/ready-to-code-queue-export`
WBS node'ları: `dx-workflow`, `platform-factory`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W3-07`

Bu belge product code üretmez. Amaç, W3-07 Enterprise DoD Evidence Pack kanıtı kapandıktan sonra açılacak W4-01 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W4-01 yalnız şu kanıtlar geldikten sonra başlar:

- W3-07 enterprise DoD evidence pack verified
- Customer, OrderOps ve Inventory enterprise DoD matrix verified
- Security/performance/a11y/reliability/observability/release/governance evidence actionplan'a geri yazılmış

Bu kanıtlar yoksa W4-01 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W4-01'in tek amacı ready-to-code queue artifact üretimini kanıtlamaktır:

- `reports/ready-to-code-queue.json` machine-readable queue artifact olarak üretilir.
- Her item blocker, evidence status, branch, WBS node ve test command bilgisi taşır.
- Queue validator blocker/evidence status tutarlılığını fail-closed doğrular.
- `dx-workflow` ve `platform-factory` için portfolio-scale başlangıç kapısı görünür olur.

## Non-Goal

W4-01 şunları yapmaz:

- Product feature, domain davranışı veya UI redesign işi başlatmaz.
- W4-02 app factory release train veya app assembly manifest işini başlatmaz.
- W4-05 evidence dashboard UI/blocker işini başlatmaz.
- Ready queue artifact'i gerçek W3 evidence olmadan portfolio-scale done gibi sunmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W3-07 evidence kapandıktan sonra kullanır:

```text
Görev: W4-01 Ready-To-Code Queue Export.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/ready-to-code-queue-export
WBS nodes: dx-workflow, platform-factory
Prerequisite: W3-07 verified evidence in actionplan.

Amaç:
1. Ready-to-code queue export komutunu üret veya mevcutsa tamamla.
2. reports/ready-to-code-queue.json içinde blocker/evidence status, branch, WBS node ve test command alanlarını doldur.
3. Queue validator ile artifact'i fail-closed doğrula.
4. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.
5. W4-02 ve W4-05 kapsamına taşmadan queue export kanıtı üret.

Mutlak sınırlar:
- W3-07 evidence yoksa kod yazma; blocker raporu üret.
- Product feature, app assembly manifest, evidence dashboard UI veya new app work başlatma.
- Queue item'larını kanıtsız done/verified yazma.
- Eksik blocker/evidence status alanını null/placeholder ile geçirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W3-07 enterprise DoD evidence referansları
- mevcut tools/export-ready-to-code-queue.mjs var/yok durumu
- mevcut tools/check-ready-to-code-queue.mjs var/yok durumu
- mevcut reports/ready-to-code-queue.json var/yok durumu
- queue item count ve blocker/evidence status coverage
- W4-02/W4-05 kapsamına taşma olmadığını gösteren note

Beklenen minimum değişiklikler:
- tools/export-ready-to-code-queue.mjs
- tools/check-ready-to-code-queue.mjs
- reports/ready-to-code-queue.json
- reports/ready-to-code-queue-validation.md
- reports/ready-to-code-queue-summary.md

Test/evidence-first sıra:
1. Eksik ready-to-code queue export önce kırmızı olur.
2. Export tüm queue item'larını blocker/evidence status ile üretir.
3. Validator eksik status, eksik branch, eksik WBS node ve eksik test command durumunda fail-closed olur.
4. Reports artifact CI'da deterministic üretilir.
5. Product feature, app factory release train veya evidence dashboard kapsamına taşma olmadığı kanıtlanır.

Zorunlu doğrulama:
node tools/export-ready-to-code-queue.mjs
node tools/check-ready-to-code-queue.mjs

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- reports/ready-to-code-queue.json
- blocker/evidence status validation log
- W4-02/W4-05 non-goal diff note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W3-07 evidence actionplan'da doğrulandı.
- [ ] Branch `task/ready-to-code-queue-export` olarak açıldı.
- [ ] Queue export komutu var.
- [ ] Queue validator komutu var.
- [ ] `reports/ready-to-code-queue.json` tüm item'larda blocker/evidence status taşıyor.
- [ ] Validator eksik status senaryosunda fail-closed.
- [ ] W4-02 app factory veya W4-05 evidence dashboard işi yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Queue export logu alındı.
- [ ] Queue validation logu alındı.
- [ ] Ready-to-code queue artifact alındı.
- [ ] W4-02/W4-05 non-goal diff note yazıldı.
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
      "docs/platform-w4-01-ready-to-code-queue-export-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<ready-to-code-queue-ref>"
    ],
    "evidence": [
      "W4-01 Ready-To-Code Queue Export geçti: <github-actions-run-url>",
      "Queue artifact üretildi: <ready-to-code-queue-ref>",
      "Blocker/evidence status validation geçti: <validation-log-ref>",
      "W4-02/W4-05 kapsamına taşma yok: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "readyQueueStatus": "verified",
      "queueStatus": "verified:W4-01"
    }
  },
  {
    "id": "platform-factory",
    "refs": [
      "docs/platform-w4-01-ready-to-code-queue-export-agent-pack-2026-07-09.md",
      "report:<ready-to-code-queue-ref>"
    ],
    "evidence": [
      "Portfolio ready-to-code queue platform factory kapısı olarak üretildi: <ready-to-code-queue-ref>"
    ],
    "traceability": {
      "readyQueueStatus": "verified"
    }
  }
]
```

## W4-01 Done Kapısı

W4-01 ancak şu koşullarla kapanır:

- W3-07 evidence daha önce verified durumdadır.
- `reports/ready-to-code-queue.json` üretilmiştir.
- Queue validator blocker/evidence status coverage için geçmiştir.
- Product feature, W4-02 app factory veya W4-05 evidence dashboard işi eklenmemiştir.
- `dx-workflow` ve `platform-factory` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W4-02 App Factory Release Train başlamaz.
