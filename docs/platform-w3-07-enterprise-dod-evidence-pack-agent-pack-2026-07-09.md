# W3-07 Enterprise DoD Evidence Pack Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W3-07`
Branch: `task/enterprise-dod-evidence-pack`
WBS node'ları: `build-enterprise-readiness`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W3-06`

Bu belge product code üretmez. Amaç, W3-06 Enterprise Release + Governance kanıtı kapandıktan sonra açılacak W3-07 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W3-07 yalnız şu kanıtlar geldikten sonra başlar:

- W2-06 repeatability verified evidence
- W3-01 security gates verified evidence
- W3-02 performance gates verified evidence
- W3-03 accessibility gates verified evidence
- W3-04 reliability gates verified evidence
- W3-05 observability gates verified evidence
- W3-06 release/governance verified evidence

Bu kanıtlar yoksa W3-07 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W3-07'nin tek amacı Enterprise DoD evidence bundle ve actionplan writeback patch'ini üretmektir:

- `reports/enterprise-readiness.md` tüm W3 evidence linklerini taşır.
- Customer, OrderOps ve Inventory için Enterprise DoD matrix yazılır.
- Security, performance, accessibility, reliability, observability, release ve governance evidence linkleri tek bundle içinde çapraz kontrol edilir.
- Actionplan evidence patch taslağı gerçek PR/CI/deploy/test kanıtlarına bağlanır.
- W3-07 kapanmadan Wave 4 portfolio scale açılmaz.

## Non-Goal

W3-07 şunları yapmaz:

- Portfolio scale, app factory, marketplace, regression matrix veya W4 evidence dashboard işini başlatmaz.
- Eksik W3-01..W3-06 evidence setini tamamlanmış gibi göstermez.
- Product feature, domain davranışı veya UI redesign işi başlatmaz.
- Evidence linklerini local placeholder veya sözlü beyanla doldurmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/deploy/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W3-06 evidence kapandıktan sonra kullanır:

```text
Görev: W3-07 Enterprise DoD Evidence Pack.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/enterprise-dod-evidence-pack
WBS nodes: build-enterprise-readiness
Prerequisite: W3-06 verified evidence in actionplan.

Amaç:
1. Enterprise DoD evidence bundle üret: security, performance, a11y, reliability, observability, release, governance.
2. Customer, OrderOps ve Inventory Enterprise DoD matrix üret.
3. API ve web enterprise regression doğrulamasını koştur.
4. Actionplan evidence writeback patch'ini gerçek PR/CI/deploy/test linkleriyle hazırla.
5. Wave 4'ün yalnız W3-07 verified olduktan sonra açılacağını kanıtlayan no-go note üret.

Mutlak sınırlar:
- W3-06 evidence yoksa kod yazma; blocker raporu üret.
- W4 portfolio scale, app factory, marketplace veya evidence dashboard işine başlama.
- Eksik W3 evidence linkini placeholder, local-only log veya sözlü beyanla doldurma.
- Product feature veya domain davranışı değiştirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/deploy/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W3-01 security evidence referansları
- W3-02 performance evidence referansları
- W3-03 accessibility evidence referansları
- W3-04 reliability evidence referansları
- W3-05 observability evidence referansları
- W3-06 release/governance evidence referansları
- Customer/OrderOps/Inventory DoD matrix var/yok durumu
- Wave 4 kapsamına taşma olmadığını gösteren note

Beklenen minimum değişiklikler:
- reports/enterprise-readiness.md
- reports/enterprise-dod/customer-matrix.md
- reports/enterprise-dod/orderops-matrix.md
- reports/enterprise-dod/inventory-matrix.md
- reports/enterprise-dod/evidence-links.md
- reports/enterprise-dod/actionplan-evidence-patch.json
- reports/enterprise-dod/manual-review-note.md
- reports/enterprise-dod/wave4-no-go-note.md

Test/evidence-first sıra:
1. Eksik W3-01..W3-06 evidence linkleri önce blocker olarak görünür.
2. API enterprise regression komutu gerçek test logu üretir.
3. Web enterprise e2e komutu gerçek test logu üretir.
4. Üç domain DoD matrix her evidence linkini PR/CI/test/deploy kaynağına bağlar.
5. Actionplan evidence patch yalnız gerçek değerlerle doldurulur.
6. W4 kapsamına taşma olmadığı diff note ile kanıtlanır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/security tests/failure_injection tests/test_customer_e2e_contract.py tests/test_order_e2e_contract.py tests/test_inventory_e2e_contract.py
pnpm --filter @platform/web run e2e -- customer.spec.ts order.spec.ts inventory.spec.ts a11y-enterprise.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- reports/enterprise-readiness.md
- Customer Enterprise DoD matrix
- OrderOps Enterprise DoD matrix
- Inventory Enterprise DoD matrix
- security/performance/a11y/reliability/observability/release/governance evidence links
- actionplan evidence patch
- Wave 4 no-go note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W3-06 evidence actionplan'da doğrulandı.
- [ ] Branch `task/enterprise-dod-evidence-pack` olarak açıldı.
- [ ] W3-01..W3-06 evidence linkleri eksiksiz veya blocker olarak raporlandı.
- [ ] API enterprise regression logu var.
- [ ] Web enterprise e2e logu var.
- [ ] Customer/OrderOps/Inventory DoD matrix var.
- [ ] `reports/enterprise-readiness.md` tüm evidence linklerini taşıyor.
- [ ] Actionplan evidence patch gerçek PR/CI/deploy/test linkleriyle hazır.
- [ ] W4 portfolio scale kapsamına taşma yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] API enterprise regression logu alındı.
- [ ] Web enterprise e2e logu alındı.
- [ ] Enterprise readiness report alındı.
- [ ] Üç domain DoD matrix alındı.
- [ ] W3 evidence links bundle alındı.
- [ ] Actionplan evidence patch hazırlandı.
- [ ] Wave 4 no-go note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Manual-review note yazıldı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "build-enterprise-readiness",
    "refs": [
      "docs/platform-w3-07-enterprise-dod-evidence-pack-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<enterprise-readiness-ref>"
    ],
    "evidence": [
      "W3-07 Enterprise DoD Evidence Pack geçti: <github-actions-run-url>",
      "Enterprise readiness report alındı: <enterprise-readiness-ref>",
      "Customer/OrderOps/Inventory DoD matrix alındı: <dod-matrix-ref>",
      "Security/performance/a11y/reliability/observability/release/governance evidence linkleri doğrulandı: <evidence-links-ref>",
      "Actionplan evidence patch hazırlandı: <actionplan-evidence-patch-ref>",
      "Wave 4 no-go note: W3-07 verified olmadan portfolio scale başlamaz"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "enterpriseEvidenceStatus": "verified",
      "enterpriseDodEvidenceStatus": "verified",
      "queueStatus": "verified:W3-07"
    }
  }
]
```

## W3-07 Done Kapısı

W3-07 ancak şu koşullarla kapanır:

- W3-06 evidence daha önce verified durumdadır.
- W3-01..W3-06 evidence linkleri gerçek PR/CI/deploy/test kanıtına bağlıdır.
- API enterprise regression ve web enterprise e2e doğrulaması geçer.
- Customer/OrderOps/Inventory Enterprise DoD matrix vardır.
- `reports/enterprise-readiness.md` ve actionplan evidence patch gerçek değerler taşır.
- W4 portfolio scale, app factory, marketplace veya evidence dashboard işi eklenmemiştir.
- `build-enterprise-readiness` node'una PR/CI/deploy/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan Wave 4 Portfolio Scale başlamaz.
