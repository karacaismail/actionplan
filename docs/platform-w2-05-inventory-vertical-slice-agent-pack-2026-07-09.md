# W2-05 Inventory Vertical Slice Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W2-05`
Branch: `task/inventory-vertical-slice`
WBS node'ları: `build-referans-uygulama`
İlgili node: `s-inventory`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W2-04`

Bu belge product code üretmez. Amaç, W2-04 OrderOps Vertical Slice kanıtı kapandıktan sonra açılacak W2-05 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W2-05 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- W2-01 SDK app-core template verified evidence
- W2-02 SDK module template verified evidence
- W2-03 generator guardrails verified evidence
- W2-04 OrderOps vertical slice verified evidence
- `build-ilk-dikey-dilim` ve `build-referans-uygulama` OrderOps actionplan writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W2-05'in tek amacı Inventory üçüncü vertical slice'ını farklı data shape ile aynı SDK/app-core sözleşmesinde kanıtlamaktır:

- Inventory app/module SDK generator ve app-core pattern üzerinden üretilir.
- Inventory model/migration tenant-aware, stock/warehouse/lot veya reservation gibi OrderOps'ten farklı veri şekliyle test edilir.
- Inventory GraphQL/API authz, tenant isolation, audit ve event/outbox sözleşmelerine bağlıdır.
- Inventory UI route/list/detail/form capability gate ile çalışır.
- Inventory e2e smoke Customer + OrderOps sonrası üçüncü domain repeatability kanıtı üretir.
- W2-06 repeatability diff report için Customer/OrderOps/Inventory karşılaştırma girdisi hazırlanır.

## Non-Goal

W2-05 şunları yapmaz:

- W2-06 repeatability diff report'u tamamlamaz; yalnız Inventory evidence girdisini hazırlar.
- Marketplace, module signing, plugin runtime veya app-store publication başlatmaz.
- OrderOps veya Customer implementation'ını yeniden yazmaz.
- Dördüncü domain veya portfolio regression matrix başlatmaz.
- Tenant/authz/audit/event/outbox guard'larını happy path'e indirgemez.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W2-04 evidence kapandıktan sonra kullanır:

```text
Görev: W2-05 Inventory Vertical Slice.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/inventory-vertical-slice
WBS nodes: build-referans-uygulama
Related node: s-inventory
Prerequisite: W2-04 verified evidence in actionplan.

Amaç:
1. Inventory app/module'ünü SDK app-core/module template ve generator guardrails üzerinden üret.
2. Tenant-aware Inventory model ve migration'ı OrderOps'ten farklı veri şekliyle test-first ekle.
3. Inventory GraphQL/API query/mutation, authz deny, tenant isolation, audit append ve outbox event testlerini kur.
4. Inventory UI route/list/detail/form yüzeylerini capability gate ile ekle.
5. Inventory e2e smoke ve tenant negative testlerini Customer/OrderOps pattern'iyle aynı sözleşmede çalıştır.
6. W2-06 Customer/OrderOps/Inventory diff report için evidence input dosyasını hazırla.

Mutlak sınırlar:
- W2-04 evidence yoksa kod yazma; blocker raporu üret.
- Marketplace, plugin runtime, dördüncü domain veya W2-06 diff report tamamlaması başlatma.
- Customer veya OrderOps kodunu Inventory için yeniden düzenleyerek shortcut alma.
- Tenant isolation, authz deny, audit append veya outbox event testlerini atlama.
- Generated output guardrails'i bypass etme veya elle düzenlenmiş generated dosya kabul etme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W2-01, W2-02, W2-03 ve W2-04 evidence referansları
- Customer CUST-06 ve OrderOps W2-04 evidence referansları
- SDK generator guardrail report sonucu
- mevcut Inventory files var/yok durumu
- marketplace/dördüncü domain code'a dokunulmadığını gösteren diff note

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/inventory_core.py
- apps/api/src/meta_api/inventory_models.py
- apps/api/src/meta_api/inventory_graphql.py
- apps/api/migrations/versions/*inventory*.py
- apps/api/tests/test_inventory_model.py
- apps/api/tests/test_inventory_graphql.py
- apps/api/tests/test_inventory_e2e_contract.py
- apps/web/src/apps/inventory/routes.tsx
- apps/web/src/apps/inventory/inventory-ui.test.tsx
- apps/web/e2e/inventory.spec.ts
- reports/inventory-evidence.md
- reports/repeatability/customer-orderops-inventory-input.md

Test-first sıra:
1. Inventory model tenant-aware migration testi önce kırmızı olur.
2. Warehouse/sku/lot veya reservation uniqueness/invariant testi kırmızıdan yeşile döner.
3. Stock adjustment veya reservation negative testleri domain farkını kanıtlar.
4. GraphQL query/mutation authz deny ve tenant negative testleri geçer.
5. Audit append ve inventory.adjusted/inventory.reserved outbox event testleri geçer.
6. Inventory UI capability olmadan gizli, capability ile görünür testleri geçer.
7. Inventory e2e create/list/read/update veya stock-adjust smoke ve cross-tenant negative testi geçer.
8. Marketplace ve dördüncü domain eklenmediği diff note ile kanıtlanır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_inventory_model.py tests/test_inventory_graphql.py tests/test_inventory_e2e_contract.py
pnpm --filter @platform/web run test -- inventory
pnpm --filter @platform/web run e2e -- inventory.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- inventory model/migration test logu
- inventory GraphQL/authz/audit/outbox test logu
- inventory UI test logu
- inventory e2e smoke ve tenant negative test logu
- Customer/OrderOps/Inventory diff input ref'i
- marketplace/dördüncü-domain non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W2-04 evidence actionplan'da doğrulandı.
- [ ] Branch `task/inventory-vertical-slice` olarak açıldı.
- [ ] İlk commit kırmızı Inventory model, GraphQL veya UI/e2e testi taşıyor.
- [ ] Inventory SDK/app-core/module template pattern üzerinden üretildi.
- [ ] Inventory model/migration tenant-aware ve rollback testli.
- [ ] Inventory data shape OrderOps'ten farklı invariant ile kanıtlandı.
- [ ] GraphQL/API authz deny, tenant negative, audit append ve outbox event testleri var.
- [ ] UI route/list/detail/form capability gate ile bağlı.
- [ ] Inventory e2e smoke ve tenant negative testleri var.
- [ ] Marketplace, dördüncü domain ve W2-06 final diff report diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Inventory model/migration test logu alındı.
- [ ] Inventory GraphQL/authz/audit/outbox test logu alındı.
- [ ] Inventory UI test logu alındı.
- [ ] Inventory e2e smoke ve tenant negative test logu alındı.
- [ ] Customer/OrderOps/Inventory diff input ref'i yazıldı.
- [ ] Marketplace/dördüncü-domain non-goal diff note yazıldı.
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
      "docs/platform-w2-05-inventory-vertical-slice-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<inventory-test-log-ref>"
    ],
    "evidence": [
      "W2-05 Inventory Vertical Slice geçti: <github-actions-run-url>",
      "Inventory model/migration testleri geçti: <test-log-ref>",
      "Inventory GraphQL/authz/audit/outbox testleri geçti: <test-log-ref>",
      "Inventory UI ve e2e smoke testleri geçti: <test-log-ref>",
      "Customer/OrderOps/Inventory diff input hazırlandı: <report-ref>",
      "Rollback note: Inventory app/module, migration ve UI değişiklikleri revert edilebilir; marketplace ve dördüncü domain başlatılmadı"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "inventoryVerticalSliceStatus": "verified",
      "referenceAppRepeatabilityStatus": "partial:customer-orderops-inventory",
      "queueStatus": "verified:W2-05"
    }
  },
  {
    "id": "s-inventory",
    "refs": [
      "docs/platform-w2-05-inventory-vertical-slice-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<inventory-e2e-log-ref>"
    ],
    "evidence": [
      "Inventory surface/API contract aynı SDK/app-core sözleşmesinde doğrulandı: <test-log-ref>",
      "Inventory farklı data shape ve tenant negative evidence taşıyor: <test-log-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "inventoryEvidenceStatus": "verified",
      "queueStatus": "verified:W2-05"
    }
  }
]
```

## W2-05 Done Kapısı

W2-05 ancak şu koşullarla kapanır:

- W2-04 evidence daha önce verified durumdadır.
- Inventory SDK/app-core/module template pattern üzerinden üretilmiştir.
- Inventory model/migration tenant-aware, rollback testli ve OrderOps'ten farklı data shape kanıtlıdır.
- Inventory GraphQL/API authz deny, tenant negative, audit append ve outbox event testleri geçmiştir.
- Inventory UI capability gate, form state ve e2e smoke geçmiştir.
- Customer/OrderOps/Inventory diff input dosyası W2-06 için hazırdır.
- Marketplace runtime, plugin loading veya dördüncü domain code eklenmemiştir.
- `build-referans-uygulama` ve `s-inventory` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W2-06 SDK Repeatability Diff Report başlamaz.
