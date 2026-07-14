# W2-06 SDK Repeatability Diff Report Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W2-06`
Branch: `task/sdk-repeatability-diff-report`
WBS node'ları: `be-sdk`, `dx-workflow`, `build-referans-uygulama`
İlgili node'lar: `customer`, `build-ilk-dikey-dilim`, `s-inventory`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W2-05`

Bu belge product code üretmez. Amaç, W2-05 Inventory Vertical Slice kanıtı kapandıktan sonra açılacak W2-06 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W2-06 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- W2-01 SDK app-core template verified evidence
- W2-02 SDK module template verified evidence
- W2-03 generator guardrails verified evidence
- W2-04 OrderOps vertical slice verified evidence
- W2-05 Inventory vertical slice verified evidence
- Customer, OrderOps ve Inventory PR/CI/test/e2e evidence writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W2-06'nın tek amacı Wave 2 repeatability çıkış kanıtını üretmektir:

- `packages/sdk/docs/repeatability-report.md` Customer, OrderOps ve Inventory karşılaştırmasını taşır.
- Copy-code threshold raporu domain-specific kopya logic ile SDK/template ortak kodunu ayırır.
- Customer/OrderOps/Inventory backend e2e ve web e2e regresyon logları birlikte koşulur.
- Generator guardrails ve template contract kanıtları diff report'a bağlanır.
- Manual review note "meta-framework tekrar üretilebilir mi?" sorusuna kanıtlı cevap verir.
- Wave 3 yalnız bu rapor gerçek PR/CI/test evidence ile kapandıktan sonra başlar.

## Non-Goal

W2-06 şunları yapmaz:

- Yeni domain, dördüncü app veya enterprise feature üretmez.
- Wave 3 security/performance/a11y/reliability çalışmalarını başlatmaz.
- Customer, OrderOps veya Inventory davranışını yeniden yazmaz.
- Copy-code threshold'u sahte metrikle veya elle düzenlenmiş sayı ile geçirmez.
- Eksik PR/CI/test kanıtını "varsayılmış verified" olarak yazmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W2-05 evidence kapandıktan sonra kullanır:

```text
Görev: W2-06 SDK Repeatability Diff Report.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/sdk-repeatability-diff-report
WBS nodes: be-sdk, dx-workflow, build-referans-uygulama
Related nodes: customer, build-ilk-dikey-dilim, s-inventory
Prerequisite: W2-05 verified evidence in actionplan.

Amaç:
1. packages/sdk/docs/repeatability-report.md dosyasını Customer/OrderOps/Inventory kanıtlarıyla üret.
2. Copy-code threshold raporunu domain-specific logic ve template/shared SDK kodu ayrımıyla hesapla.
3. Customer, OrderOps ve Inventory backend e2e contract testlerini birlikte çalıştır.
4. Customer, OrderOps ve Inventory web e2e smoke testlerini birlikte çalıştır.
5. Generator guardrails, app-core template ve module template evidence'ini diff report'a bağla.
6. Manual review note ile repeatability kararını açık yaz: hangi pattern tekrar kullanılabilir, hangi kısımlar domain-specific.
7. Actionplan evidence patch'ini gerçek PR/CI/test/report ref'leriyle hazırla.

Mutlak sınırlar:
- W2-05 evidence yoksa kod yazma; blocker raporu üret.
- Yeni domain, Wave 3 enterprise feature, marketplace runtime veya plugin loading başlatma.
- Customer/OrderOps/Inventory davranışını refactor ederek diff metriklerini yapay düşürme.
- Copy-code threshold veya report metriklerini elle uydurma.
- Eksik test logunu "geçti" gibi yazma; kırmızı test varsa blocker olarak raporla.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- CUST-06, W2-04 ve W2-05 evidence referansları
- W2-01, W2-02 ve W2-03 SDK/template/guardrail evidence referansları
- mevcut repeatability-report var/yok durumu
- Customer/OrderOps/Inventory generated/shared/domain diff input dosyaları
- yeni domain veya Wave 3 code'a dokunulmadığını gösteren diff note

Beklenen minimum değişiklikler:
- packages/sdk/docs/repeatability-report.md
- packages/sdk/tests/repeatability-report.test.ts
- packages/sdk/src/repeatability/copy-code-threshold.ts
- packages/sdk/tests/copy-code-threshold.test.ts
- reports/repeatability/customer-order-inventory.md
- reports/repeatability/copy-code-threshold.json
- reports/repeatability/regression-log.md
- reports/repeatability/manual-review.md

Test-first sıra:
1. Repeatability report required-section testi önce kırmızı olur.
2. Copy-code threshold testleri generated/shared/domain ayrımını kanıtlar.
3. Customer/OrderOps/Inventory e2e contract testleri birlikte geçer.
4. Customer/OrderOps/Inventory web e2e smoke testleri birlikte geçer.
5. Generator guardrail ve template evidence ref'leri report içinde doğrulanır.
6. Manual review note eksikse report gate kırmızı kalır.
7. Yeni domain veya Wave 3 code eklenmediği diff note ile kanıtlanır.

Zorunlu doğrulama:
pnpm --filter @platform/sdk run test
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_e2e_contract.py tests/test_order_e2e_contract.py tests/test_inventory_e2e_contract.py
pnpm --filter @platform/web run e2e -- customer.spec.ts order.spec.ts inventory.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- packages/sdk/docs/repeatability-report.md ref'i
- copy-code threshold report ref'i
- Customer/OrderOps/Inventory backend e2e logu
- Customer/OrderOps/Inventory web e2e logu
- generator/template evidence refs
- manual-review note
- rollback/smoke note
- Wave 3 start/no-go kararı
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W2-05 evidence actionplan'da doğrulandı.
- [ ] Branch `task/sdk-repeatability-diff-report` olarak açıldı.
- [ ] İlk commit kırmızı repeatability report veya copy-code threshold testi taşıyor.
- [ ] Customer/OrderOps/Inventory evidence input ref'leri hazır.
- [ ] Copy-code threshold domain-specific ve shared/template ayrımını yapıyor.
- [ ] Backend e2e üç domain için birlikte koşuyor.
- [ ] Web e2e üç domain için birlikte koşuyor.
- [ ] Manual review note report gate'in parçası.
- [ ] Yeni domain, Wave 3 feature, marketplace ve plugin runtime diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Repeatability report ref'i alındı.
- [ ] Copy-code threshold report ref'i alındı.
- [ ] Customer/OrderOps/Inventory backend e2e logu alındı.
- [ ] Customer/OrderOps/Inventory web e2e logu alındı.
- [ ] Manual review note yazıldı.
- [ ] Wave 3 start/no-go kararı yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "be-sdk",
    "refs": [
      "docs/platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<repeatability-report-ref>"
    ],
    "evidence": [
      "W2-06 SDK Repeatability Diff Report geçti: <github-actions-run-url>",
      "Repeatability report hazırlandı: <repeatability-report-ref>",
      "Copy-code threshold report geçti: <copy-code-threshold-ref>",
      "SDK template/guardrail evidence refs report içinde doğrulandı: <report-ref>",
      "Rollback note: repeatability report ve threshold tooling revert edilebilir; yeni domain veya Wave 3 feature eklenmedi"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "repeatabilityReportStatus": "verified",
      "queueStatus": "verified:W2-06"
    }
  },
  {
    "id": "dx-workflow",
    "refs": [
      "docs/platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "manual-review:<manual-review-ref>"
    ],
    "evidence": [
      "Customer/OrderOps/Inventory repeatability developer workflow manual review geçti: <manual-review-ref>",
      "Wave 3 start/no-go kararı yazıldı: <decision-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "workflowEvidenceStatus": "verified:repeatability",
      "queueStatus": "verified:W2-06"
    }
  },
  {
    "id": "build-referans-uygulama",
    "refs": [
      "docs/platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<customer-order-inventory-regression-log-ref>"
    ],
    "evidence": [
      "Customer/OrderOps/Inventory backend e2e regression geçti: <test-log-ref>",
      "Customer/OrderOps/Inventory web e2e regression geçti: <test-log-ref>",
      "Reference app repeatability W2-06 diff report ile kapandı: <report-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "referenceAppRepeatabilityStatus": "verified",
      "queueStatus": "verified:W2-06"
    }
  }
]
```

## W2-06 Done Kapısı

W2-06 ancak şu koşullarla kapanır:

- W2-05 evidence daha önce verified durumdadır.
- `packages/sdk/docs/repeatability-report.md` Customer, OrderOps ve Inventory karşılaştırmasını taşır.
- Copy-code threshold report generated/shared/domain ayrımını belgeler.
- Customer/OrderOps/Inventory backend e2e ve web e2e regresyonları geçer.
- Generator guardrail ve template evidence refs report içinde doğrulanır.
- Manual review note repeatability kararını açık yazar.
- Yeni domain, Wave 3 feature, marketplace runtime veya plugin loading code eklenmemiştir.
- `be-sdk`, `dx-workflow` ve `build-referans-uygulama` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan Wave 3 Enterprise PR zinciri başlamaz.
