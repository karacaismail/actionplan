# W4-02 App Factory Release Train Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W4-02`
Branch: `task/app-factory-release-train`
WBS node'ları: `platform-factory`, `deploy-yap`, `product`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W4-01`

Bu belge product code üretmez. Amaç, W4-01 Ready-To-Code Queue Export kanıtı kapandıktan sonra açılacak W4-02 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W4-02 yalnız şu kanıtlar geldikten sonra başlar:

- W3-07 enterprise DoD evidence pack verified
- W4-01 ready-to-code queue export verified
- `reports/ready-to-code-queue.json` blocker/evidence status validation passed

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W4-02'nin tek amacı app factory release train kanıtını üretmektir:

- Customer, OrderOps ve Inventory app manifestleri üretilir.
- Capability/entitlement listesi bu üç app için machine-readable hale gelir.
- App assembly compose config smoke üç app için geçer.
- `platform-factory`, `deploy-yap` ve `product` portfolio release train kanıtına bağlanır.

## Non-Goal

W4-02 şunları yapmaz:

- Marketplace, module signing, SBOM/provenance veya sandbox/no-egress işini başlatmaz; bunlar W4-03 kapsamıdır.
- Dördüncü domain, product feature veya Product archetype CRUD geliştirmesi başlatmaz.
- Regression matrix, evidence dashboard veya operations drill işini başlatmaz.
- App manifest/compose smoke olmadan portfolio release train done yazmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W4-01 evidence kapandıktan sonra kullanır:

```text
Görev: W4-02 App Factory Release Train.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/app-factory-release-train
WBS nodes: platform-factory, deploy-yap, product
Prerequisite: W4-01 verified evidence in actionplan.

Amaç:
1. Customer, OrderOps ve Inventory app manifestlerini üret veya tamamla.
2. Capability/entitlement release train listesini üret.
3. Üç app assembly compose config smoke doğrulamasını koştur.
4. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.
5. Marketplace, fourth domain veya product CRUD kapsamına taşmadan release train kanıtı üret.

Mutlak sınırlar:
- W4-01 evidence yoksa kod yazma; blocker raporu üret.
- Marketplace signing/SBOM/sandbox, regression matrix, evidence dashboard veya operations drill işi başlatma.
- Product archetype CRUD, pricing, inventory veya domain behavior geliştirme.
- Compose config smoke olmadan release train passed yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W4-01 ready-to-code queue evidence referansları
- mevcut Customer/OrderOps/Inventory app manifest var/yok durumu
- mevcut capability/entitlement list var/yok durumu
- mevcut compose config smoke sonucu
- marketplace veya product feature diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- apps/manifests/customer.app.json
- apps/manifests/order.app.json
- apps/manifests/inventory.app.json
- apps/manifests/capability-entitlement-list.json
- infra/app-assembly/docker-compose.customer.yml
- infra/app-assembly/docker-compose.order.yml
- infra/app-assembly/docker-compose.inventory.yml
- reports/release/release-train.md
- reports/release/app-factory-compose-smoke.md
- reports/release/capability-entitlement-list.md
- reports/release/app-factory-release-train-summary.md

Test/evidence-first sıra:
1. Eksik app manifest ve entitlement list önce blocker olarak görünür.
2. Manifest schema validator üç app için geçer.
3. Compose config smoke Customer için geçer.
4. Compose config smoke OrderOps için geçer.
5. Compose config smoke Inventory için geçer.
6. Marketplace/product-feature kapsamına taşma olmadığı diff note ile kanıtlanır.

Zorunlu doğrulama:
node tools/check-app-manifest.mjs
docker compose -f infra/app-assembly/docker-compose.customer.yml config
docker compose -f infra/app-assembly/docker-compose.order.yml config
docker compose -f infra/app-assembly/docker-compose.inventory.yml config

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- Customer app manifest
- OrderOps app manifest
- Inventory app manifest
- capability/entitlement list
- compose config smoke logu
- marketplace/product-feature non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W4-01 evidence actionplan'da doğrulandı.
- [ ] Branch `task/app-factory-release-train` olarak açıldı.
- [ ] Customer app manifest var.
- [ ] OrderOps app manifest var.
- [ ] Inventory app manifest var.
- [ ] Capability/entitlement list var.
- [ ] Üç compose config smoke geçti.
- [ ] Marketplace, fourth domain veya Product CRUD diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Manifest validation logu alındı.
- [ ] Compose config smoke logu alındı.
- [ ] Capability/entitlement list alındı.
- [ ] Marketplace/product-feature non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "platform-factory",
    "refs": [
      "docs/platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<app-factory-release-train-summary-ref>"
    ],
    "evidence": [
      "W4-02 App Factory Release Train geçti: <github-actions-run-url>",
      "Customer/OrderOps/Inventory app manifestleri doğrulandı: <manifest-report-ref>",
      "Capability/entitlement list alındı: <capability-entitlement-ref>",
      "Marketplace veya product feature kapsamına taşma yok: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "appFactoryReleaseTrainStatus": "verified",
      "manifestEvidenceStatus": "verified",
      "queueStatus": "verified:W4-02"
    }
  },
  {
    "id": "deploy-yap",
    "refs": [
      "docs/platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md",
      "report:<compose-smoke-log-ref>"
    ],
    "evidence": [
      "Customer/OrderOps/Inventory compose config smoke geçti: <compose-smoke-log-ref>"
    ],
    "traceability": {
      "releaseTrainStatus": "verified"
    }
  },
  {
    "id": "product",
    "refs": [
      "docs/platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md",
      "report:<capability-entitlement-ref>"
    ],
    "evidence": [
      "Product catalog capability/entitlement list release train icinde referanslandi: <capability-entitlement-ref>",
      "Product CRUD veya domain feature degisikligi yok: <diff-note-ref>"
    ],
    "traceability": {
      "productPortfolioStatus": "verified"
    }
  }
]
```

## W4-02 Done Kapısı

W4-02 ancak şu koşullarla kapanır:

- W4-01 evidence daha önce verified durumdadır.
- Customer, OrderOps ve Inventory app manifestleri vardır.
- Capability/entitlement list vardır.
- Üç app assembly compose config smoke geçer.
- Marketplace, fourth domain, product feature veya Product CRUD işi eklenmemiştir.
- `platform-factory`, `deploy-yap` ve `product` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W4-03 Module Marketplace Guardrails başlamaz.
