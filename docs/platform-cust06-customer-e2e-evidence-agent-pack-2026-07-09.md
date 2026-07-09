# CUST-06 Customer E2E + Evidence Writeback Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `CUST-06`
Branch: `task/platform-customer-e2e-evidence`
WBS node'ları: `customer`, `platform-customer-graphql`, `platform-customer-ui`, `platform-customer-seed`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-CUST-05`

Bu belge product code üretmez. Amaç, CUST-05 Customer Seed kanıtı kapandıktan sonra açılacak CUST-06 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

CUST-06 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01 app-core, CUST-02 model, CUST-03 GraphQL/API, CUST-04 UI ve CUST-05 seed verified evidence
- Customer seed golden fixture ve GraphQL/UI contract evidence
- Authz, tenant isolation, audit, outbox, observability ve CI evidence writeback'leri

Bu kanıtlar yoksa CUST-06 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

CUST-06'nın tek amacı Customer vertical slice için full e2e ve actionplan evidence writeback kapısını kapatmaktır:

- Login -> Customer create -> list/read/detail -> update smoke geçer.
- Cross-tenant negative e2e testi geçer.
- Authz denial e2e testi geçer.
- UI/API/audit/outbox evidence aynı PR'da bağlanır.
- Actionplan evidence patch gerçek PR/commit/CI/test/deploy/smoke/rollback kanıtlarıyla hazırlanır.
- Customer verified olmadan Wave 2 OrderOps/Inventory başlatılmaz.

## Non-Goal

CUST-06 şunları yapmaz:

- OrderOps, Inventory veya Wave 2 repeatability işi başlatmaz.
- Yeni Customer feature, schema, resolver, UI form alanı veya seed kapsamı eklemez.
- Actionplan node'larını gerçek evidence olmadan `done` veya `verified` yapmaz.
- Storefront smoke'u Customer e2e yerine koymaz.
- Fake PR URL, fake CI URL, fake deploy URL veya uydurma test logu yazmaz.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız CUST-05 evidence kapandıktan sonra kullanır:

```text
Görev: CUST-06 Customer E2E + Evidence Writeback.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-customer-e2e-evidence
WBS nodes: customer, platform-customer-graphql, platform-customer-ui, platform-customer-seed
Prerequisite: PR-01..PR-11 and CUST-01..CUST-05 verified evidence in actionplan.

Amaç:
1. Customer full vertical slice smoke'u login -> create -> list/read/detail -> update akışıyla kanıtla.
2. Cross-tenant denied ve authz denial e2e testlerini ekle/yeşile taşı.
3. API-side e2e contract testini UI e2e ile aynı evidence setine bağla.
4. Audit append ve outbox event evidence'i CUST-03 ile tutarlı şekilde doğrula.
5. reports/customer-e2e-evidence.md içinde PR/commit/CI/test/deploy/smoke/rollback summary üret.
6. Actionplan evidence patch'i gerçek kanıtlarla hazırla; gerçek kanıt olmadan uygulama.
7. Customer verified olmadan Wave 2'nin başlamayacağını PR body ve evidence note içinde açık yaz.

Mutlak sınırlar:
- CUST-05 evidence yoksa kod yazma; blocker raporu üret.
- OrderOps, Inventory, SDK repeatability veya Wave 2 işi başlatma.
- Yeni Customer feature/schema/API/UI/seed kapsamı ekleme; eksikse blocker raporu üret.
- Fake URL, fake log, fake deploy evidence veya local-only sonucu remote CI gibi sunma.
- Storefront smoke'u Customer e2e evidence yerine koyma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test/deploy kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-11 ve CUST-01..CUST-05 evidence referansları
- apps/web/e2e/customer.spec.ts var/yok ve senaryo kapsamı
- apps/api/tests/test_customer_e2e_contract.py var/yok
- audit/outbox evidence referansları
- reports/customer-e2e-evidence.md var/yok
- OrderOps/Inventory/Wave 2 diff'i olmadığını doğrula

Beklenen minimum değişiklikler:
- apps/web/e2e/customer.spec.ts
- apps/api/tests/test_customer_e2e_contract.py
- reports/customer-e2e-evidence.md
- actionplan evidence patch taslağı veya PR body patch bloğu

Test-first sıra:
1. Customer e2e create/read/update smoke testi önce kırmızı olur.
2. Cross-tenant denied e2e testi geçer.
3. Authz denial e2e testi geçer.
4. API-side e2e contract testi geçer.
5. Audit/outbox evidence summary gerçek test loglarına bağlanır.
6. reports/customer-e2e-evidence.md gerçek PR/CI/test/deploy/rollback referanslarıyla üretilir.
7. Actionplan evidence patch gerçek değerler gelmeden uygulanmaz.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_e2e_contract.py tests/test_customer_permissions.py
pnpm --filter @platform/web run e2e -- customer.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- create/list/detail/update Customer smoke logu
- cross-tenant negative e2e test logu
- authz denial e2e test logu
- audit/event evidence refs
- reports/customer-e2e-evidence.md
- actionplan evidence patch
- deploy/smoke URL veya yokluk gerekçesi
- rollback note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] PR-01..PR-11 ve CUST-01..CUST-05 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-customer-e2e-evidence` olarak açıldı.
- [ ] İlk commit kırmızı Customer e2e veya API e2e contract testi taşıyor.
- [ ] Create/list/detail/update smoke geçiyor.
- [ ] Cross-tenant negative e2e testi var.
- [ ] Authz denial e2e testi var.
- [ ] Audit/outbox evidence refs gerçek test loglarına bağlı.
- [ ] `reports/customer-e2e-evidence.md` gerçek evidence summary taşıyor.
- [ ] Actionplan evidence patch gerçek PR/CI/test değerleri gelmeden uygulanmadı.
- [ ] OrderOps/Inventory/Wave 2 diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Customer e2e smoke logu alındı.
- [ ] Cross-tenant negative test logu alındı.
- [ ] Authz denial e2e test logu alındı.
- [ ] Audit/event evidence refs alındı.
- [ ] Deploy/smoke URL veya yokluk gerekçesi yazıldı.
- [ ] Rollback note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "customer",
    "refs": [
      "docs/platform-cust06-customer-e2e-evidence-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<customer-e2e-test-log-ref>",
      "report:reports/customer-e2e-evidence.md"
    ],
    "evidence": [
      "CUST-06 Customer E2E + Evidence Writeback geçti: <github-actions-run-url>",
      "Create/list/detail/update Customer smoke geçti: <test-log-ref>",
      "Cross-tenant negative e2e geçti: <test-log-ref>",
      "Authz denial e2e geçti: <test-log-ref>",
      "Audit/event evidence refs: <refs>",
      "Deploy/smoke evidence: <url-or-not-available-reason>",
      "Rollback note: Customer vertical slice revert edilebilir; OrderOps/Inventory başlatılmadı"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "customerVerticalSliceEvidenceStatus": "verified",
      "queueStatus": "verified:CUST-06",
      "nextQueueStage": "wave2"
    }
  },
  {
    "id": "platform-customer-graphql",
    "traceability": {
      "customerE2eEvidenceStatus": "verified",
      "queueStatus": "verified:CUST-06"
    }
  },
  {
    "id": "platform-customer-ui",
    "traceability": {
      "customerE2eEvidenceStatus": "verified",
      "queueStatus": "verified:CUST-06"
    }
  },
  {
    "id": "platform-customer-seed",
    "traceability": {
      "customerE2eEvidenceStatus": "verified",
      "queueStatus": "verified:CUST-06"
    }
  }
]
```

## CUST-06 Done Kapısı

CUST-06 ancak şu koşullarla kapanır:

- PR-01..PR-11 ve CUST-01..CUST-05 evidence daha önce verified durumdadır.
- Customer create/list/detail/update smoke geçer.
- Cross-tenant negative ve authz denial e2e testleri geçer.
- API-side e2e contract testi geçer.
- Audit/outbox evidence gerçek refs ile bağlıdır.
- `reports/customer-e2e-evidence.md` gerçek PR/CI/test/deploy/smoke/rollback summary taşır.
- Actionplan evidence patch gerçek değerlerle hazırlanır.
- OrderOps, Inventory veya Wave 2 code eklenmemiştir.
- `customer`, `platform-customer-graphql`, `platform-customer-ui` ve `platform-customer-seed` node'larına evidence geri yazılmıştır.

Bu done kapısı kapanmadan Wave 2 OrderOps/Inventory repeatability başlamaz.
