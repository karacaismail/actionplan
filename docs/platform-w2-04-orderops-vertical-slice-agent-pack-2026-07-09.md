# W2-04 OrderOps Vertical Slice Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W2-04`
Branch: `task/orderops-vertical-slice`
WBS node'ları: `build-ilk-dikey-dilim`, `build-referans-uygulama`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W2-03`

Bu belge product code üretmez. Amaç, W2-03 SDK Generator Guardrails kanıtı kapandıktan sonra açılacak W2-04 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W2-04 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- W2-01 SDK app-core template verified evidence
- W2-02 SDK module template verified evidence
- W2-03 generator guardrails verified evidence
- `be-sdk`, `dx-cli`, `dx-workflow`, `customer` ve Customer node writeback'leri

Bu kanıtlar yoksa W2-04 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W2-04'ün tek amacı OrderOps ikinci vertical slice'ını aynı SDK/app-core sözleşmesiyle kanıtlamaktır:

- OrderOps app/module SDK generator ve app-core pattern üzerinden üretilir.
- Order model/migration tenant-aware ve rollback testlidir.
- Order GraphQL/API authz, tenant isolation, audit ve event/outbox sözleşmelerine bağlıdır.
- Order UI route/list/detail/form capability gate ile çalışır.
- Order e2e smoke Customer sonrası ikinci domain repeatability kanıtı üretir.
- Evidence actionplan'a geri yazılacak PR/CI/test/smoke/rollback/manual-review patch'iyle hazırlanır.

## Non-Goal

W2-04 şunları yapmaz:

- Inventory vertical slice üretmez; bu W2-05 kapsamıdır.
- Marketplace, module signing, plugin runtime veya app-store publication başlatmaz.
- Customer implementation'ını yeniden yazmaz veya Customer evidence status'ünü değiştirmez.
- SDK template/guardrail sözleşmelerini domain'e özel bypass ile zayıflatmaz.
- Tenant/authz/audit/event/outbox guard'larını happy path'e indirgemez.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W2-03 evidence kapandıktan sonra kullanır:

```text
Görev: W2-04 OrderOps Vertical Slice.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/orderops-vertical-slice
WBS nodes: build-ilk-dikey-dilim, build-referans-uygulama
Prerequisite: W2-03 verified evidence in actionplan.

Amaç:
1. OrderOps app/module'ünü SDK app-core/module template ve generator guardrails üzerinden üret.
2. Tenant-aware Order model ve migration'ı test-first ekle.
3. Order GraphQL/API query/mutation, authz deny, tenant isolation, audit append ve outbox event testlerini kur.
4. Order UI route/list/detail/form yüzeylerini capability gate ile ekle.
5. Order e2e smoke ve tenant negative testlerini Customer pattern'iyle aynı sözleşmede çalıştır.
6. Customer ve SDK evidence'i bozmadan OrderOps repeatability evidence patch'ini hazırla.

Mutlak sınırlar:
- W2-03 evidence yoksa kod yazma; blocker raporu üret.
- Inventory, marketplace, plugin runtime veya üçüncü domain başlatma.
- Customer kodunu yeniden düzenleyerek OrderOps için shortcut alma.
- Tenant isolation, authz deny, audit append veya outbox event testlerini atlama.
- Generated output guardrails'i bypass etme veya elle düzenlenmiş generated dosya kabul etme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W2-01, W2-02, W2-03 evidence referansları
- Customer CUST-06 evidence referansları
- SDK generator guardrail report sonucu
- mevcut OrderOps files var/yok durumu
- Inventory code'a dokunulmadığını gösteren diff note

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/order_core.py
- apps/api/src/meta_api/order_models.py
- apps/api/src/meta_api/order_graphql.py
- apps/api/migrations/versions/*order*.py
- apps/api/tests/test_order_model.py
- apps/api/tests/test_order_graphql.py
- apps/api/tests/test_order_e2e_contract.py
- apps/web/src/apps/order/routes.tsx
- apps/web/src/apps/order/order-ui.test.tsx
- apps/web/e2e/order.spec.ts
- reports/orderops-evidence.md

Test-first sıra:
1. Order model tenant-aware migration testi önce kırmızı olur.
2. `tenant_id + order_number` veya seçilen canonical uniqueness constraint testi kırmızıdan yeşile döner.
3. GraphQL query/mutation authz deny ve tenant negative testleri geçer.
4. Audit append ve order.created/order.updated outbox event testleri geçer.
5. Order UI capability olmadan gizli, capability ile görünür testleri geçer.
6. Order e2e create/list/read/update smoke ve cross-tenant negative testi geçer.
7. Inventory code eklenmediği diff note ile kanıtlanır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_order_model.py tests/test_order_graphql.py tests/test_order_e2e_contract.py
pnpm --filter @platform/web run test -- order
pnpm --filter @platform/web run e2e -- order.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- order model/migration test logu
- order GraphQL/authz/audit/outbox test logu
- order UI test logu
- order e2e smoke ve tenant negative test logu
- Inventory non-goal diff note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W2-03 evidence actionplan'da doğrulandı.
- [ ] Branch `task/orderops-vertical-slice` olarak açıldı.
- [ ] İlk commit kırmızı Order model, GraphQL veya UI/e2e testi taşıyor.
- [ ] OrderOps SDK/app-core/module template pattern üzerinden üretildi.
- [ ] Order model/migration tenant-aware ve rollback testli.
- [ ] GraphQL/API authz deny, tenant negative, audit append ve outbox event testleri var.
- [ ] UI route/list/detail/form capability gate ile bağlı.
- [ ] Order e2e smoke ve tenant negative testleri var.
- [ ] Inventory, marketplace ve plugin runtime diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Order model/migration test logu alındı.
- [ ] Order GraphQL/authz/audit/outbox test logu alındı.
- [ ] Order UI test logu alındı.
- [ ] Order e2e smoke ve tenant negative test logu alındı.
- [ ] Inventory non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "build-ilk-dikey-dilim",
    "refs": [
      "docs/platform-w2-04-orderops-vertical-slice-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<orderops-test-log-ref>"
    ],
    "evidence": [
      "W2-04 OrderOps Vertical Slice geçti: <github-actions-run-url>",
      "Order model/migration testleri geçti: <test-log-ref>",
      "Order GraphQL/authz/audit/outbox testleri geçti: <test-log-ref>",
      "Order UI ve e2e smoke testleri geçti: <test-log-ref>",
      "Inventory non-goal diff note: <diff-note-ref>",
      "Rollback note: OrderOps app/module, migration ve UI değişiklikleri revert edilebilir; Inventory başlatılmadı"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "orderOpsVerticalSliceStatus": "verified",
      "queueStatus": "verified:W2-04"
    }
  },
  {
    "id": "build-referans-uygulama",
    "refs": [
      "docs/platform-w2-04-orderops-vertical-slice-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<orderops-e2e-log-ref>"
    ],
    "evidence": [
      "OrderOps ikinci vertical slice Customer pattern'iyle aynı SDK/app-core sözleşmesinde çalıştı: <test-log-ref>",
      "Customer/OrderOps repeatability evidence W2-06 diff raporuna girdi olarak hazırlandı: <report-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "referenceAppRepeatabilityStatus": "partial:customer-orderops",
      "queueStatus": "verified:W2-04"
    }
  }
]
```

## W2-04 Done Kapısı

W2-04 ancak şu koşullarla kapanır:

- W2-03 evidence daha önce verified durumdadır.
- OrderOps SDK/app-core/module template pattern üzerinden üretilmiştir.
- Order model/migration tenant-aware ve rollback testlidir.
- Order GraphQL/API authz deny, tenant negative, audit append ve outbox event testleri geçmiştir.
- Order UI capability gate, form state ve e2e smoke geçmiştir.
- Inventory, marketplace runtime veya plugin loading code eklenmemiştir.
- `build-ilk-dikey-dilim` ve `build-referans-uygulama` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W2-05 Inventory Vertical Slice başlamaz.
