# CUST-03 Customer GraphQL/API Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `CUST-03`
Branch: `task/platform-customer-graphql`
WBS node'u: `platform-customer-graphql`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-CUST-02`

Bu belge product code üretmez. Amaç, CUST-02 Customer Model kanıtı kapandıktan sonra açılacak CUST-03 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

CUST-03 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01 Customer app-core verified evidence
- CUST-02 Customer model + migration verified evidence
- PR-03 authz/PDP, PR-04 event/outbox, PR-06 audit envelope ve PR-09 observability evidence
- `platform-customer-model` ve `platform-customer-graphql` actionplan writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

CUST-03'ün tek amacı Customer GraphQL/API contract ve integration evidence üretmektir:

- `customer(id)` ve `customers` tenant-filtered query contract'ı testlidir.
- `createCustomer` ve `updateCustomer` mutation contract'ı testlidir.
- Unauthorized, forbidden ve cross-tenant access negatif testleri geçer.
- Permission denied audit append evidence üretilir.
- `customer.created` / `customer.updated` outbox event evidence üretilir.
- UI implementation başlamadan API contract CUST-04'e devredilebilir hale gelir.

## Non-Goal

CUST-03 şunları yapmaz:

- Customer list/detail/form UI veya frontend route implementation üretmez.
- Customer seed/golden fixture veya full e2e workflow başlatmaz.
- Customer model/migration kapsamını genişletmez.
- OrderOps, Inventory veya başka domain API eklemez.
- Authz, audit veya event/outbox temel katmanlarını yeniden tasarlamaz.
- Tenant guard veya permission negative testlerini zayıflatmaz.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız CUST-02 evidence kapandıktan sonra kullanır:

```text
Görev: CUST-03 Customer GraphQL/API.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-customer-graphql
WBS nodes: platform-customer-graphql
Prerequisite: PR-01..PR-11, CUST-01 and CUST-02 verified evidence in actionplan.

Amaç:
1. Customer GraphQL query/mutation contract'ını ekle.
2. customer(id), customers, createCustomer ve updateCustomer resolver testlerini kırmızıdan yeşile taşı.
3. Tenant-filtered query ve cross-tenant forbidden negative testlerini ekle.
4. Authz/PDP permission gate ve unauthorized/forbidden testlerini bağla.
5. Kritik mutation için audit append evidence testini ekle.
6. customer.created/customer.updated outbox event evidence testini ekle.
7. UI implementation'a atlamadan CUST-04'e devredilebilir API contract evidence üret.

Mutlak sınırlar:
- CUST-02 evidence yoksa kod yazma; blocker raporu üret.
- Frontend UI, route, form, data fetching veya Playwright e2e başlatma.
- Customer model/migration değişikliğini bu PR'da genişletme; gerekiyorsa blocker raporu üret.
- Authz/PDP, audit envelope veya outbox temel sözleşmesini gevşetme.
- Tenant guard olmadan resolver açma.
- Permission denied audit ve event outbox testleri olmadan done iddiası yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-11, CUST-01 ve CUST-02 evidence referansları
- mevcut GraphQL schema ve ping-only durumu
- Customer resolver/dataloader/event/audit dosyaları var/yok
- authz/audit/outbox integration dependency evidence referansları
- UI dosyalarının değişmediğini diff ile doğrula

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/customer_graphql.py
- apps/api/src/meta_api/customer_events.py
- apps/api/tests/test_customer_graphql.py
- apps/api/tests/test_customer_permissions.py
- apps/api/tests/test_customer_audit_events.py

Test-first sıra:
1. Customer GraphQL query/mutation contract testi önce kırmızı olur.
2. tenant-filtered query ve cross-tenant forbidden testleri geçer.
3. unauthorized/forbidden permission tests geçer.
4. permission denied audit append testi geçer.
5. customer.created/customer.updated outbox event testleri geçer.
6. UI implementation diff'i olmadığını non-goal note ile kanıtla.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_graphql.py tests/test_customer_permissions.py tests/test_customer_audit_events.py

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- tenant-filtered query test logu
- cross-tenant forbidden test logu
- permission denied audit logu
- customer created/updated event test logu
- UI non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-11, CUST-01 ve CUST-02 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-customer-graphql` olarak açıldı.
- [ ] İlk commit kırmızı GraphQL contract veya permission testi taşıyor.
- [ ] `customer(id)` ve `customers` tenant-filtered query testleri var.
- [ ] `createCustomer` ve `updateCustomer` mutation testleri var.
- [ ] Unauthorized/forbidden/cross-tenant negative tests var.
- [ ] Permission denied audit append testi var.
- [ ] `customer.created/updated` outbox event testleri var.
- [ ] UI, seed ve e2e diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Tenant-filtered query test logu alındı.
- [ ] Cross-tenant forbidden test logu alındı.
- [ ] Permission denied audit logu alındı.
- [ ] Customer created/updated event test logu alındı.
- [ ] UI non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-customer-graphql",
  "refs": [
    "docs/platform-cust03-customer-graphql-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<customer-graphql-test-log-ref>",
    "audit:<customer-audit-test-log-ref>",
    "event:<customer-event-test-log-ref>"
  ],
  "evidence": [
    "CUST-03 Customer GraphQL/API geçti: <github-actions-run-url>",
    "Tenant-filtered query testleri geçti: <test-log-ref>",
    "Cross-tenant forbidden ve permission tests geçti: <test-log-ref>",
    "Permission denied audit append testi geçti: <audit-log-ref>",
    "customer.created/updated outbox event testleri geçti: <event-log-ref>",
    "UI non-goal diff note: <ref>",
    "Rollback note: Customer GraphQL/API revert edilebilir; UI/seed/e2e eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "customerGraphqlEvidenceStatus": "verified",
    "queueStatus": "verified:CUST-03"
  }
}
```

## CUST-03 Done Kapısı

CUST-03 ancak şu koşullarla kapanır:

- PR-01..PR-11, CUST-01 ve CUST-02 evidence daha önce verified durumdadır.
- Customer query/mutation contract testleri geçer.
- Tenant-filtered query ve cross-tenant forbidden testleri geçer.
- Unauthorized/forbidden permission tests geçer.
- Permission denied audit append ve customer outbox event testleri geçer.
- UI/seed/e2e, OrderOps ve Inventory code eklenmemiştir.
- `platform-customer-graphql` node'una PR/CI/test/audit/event evidence geri yazılmıştır.

Bu done kapısı kapanmadan CUST-04 Customer UI başlamaz.
