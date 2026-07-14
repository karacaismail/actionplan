# CUST-02 Customer Model Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `CUST-02`
Branch: `task/platform-customer-model`
WBS node'u: `platform-customer-model`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-CUST-01`

Bu belge product code üretmez. Amaç, CUST-01 Customer App-Core kanıtı kapandıktan sonra açılacak CUST-02 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

CUST-02 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01 Customer app slug/capability/route-menu/namespace verified evidence
- PR-08 DB/Alembic migration policy verified evidence
- PR-02 tenant context ve PR-03 authz/PDP evidence
- `platform-factory`, `k-capability` ve `platform-customer-model` actionplan writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

CUST-02'nin tek amacı tenant-aware Customer data model ve reversible migration evidence üretmektir:

- Customer model `tenant_id` zorunlu ve indeksli olacak şekilde tanımlanır.
- `tenant_id + email` uniqueness constraint testle kanıtlanır.
- Customer migration `upgrade()` ve `downgrade()` round-trip testleriyle geçer.
- Invalid customer fixture rejection testleri vardır.
- Cross-tenant model query negatif testi tenant izolasyonunu kanıtlar.

## Non-Goal

CUST-02 şunları yapmaz:

- GraphQL query/mutation, resolver, permission gate veya API endpoint üretmez.
- Customer list/detail/form UI veya frontend data fetching başlatmaz.
- Customer seed/golden fixture üretmez.
- Customer app-core registration/capability kapsamını genişletmez.
- OrderOps, Inventory veya başka domain model üretmez.
- Irreversible/destructive migration veya rollback note olmayan migration eklemez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız CUST-01 evidence kapandıktan sonra kullanır:

```text
Görev: CUST-02 Customer Model.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-customer-model
WBS nodes: platform-customer-model
Prerequisite: PR-01..PR-11 and CUST-01 verified evidence in actionplan.

Amaç:
1. Tenant-aware Customer SQLAlchemy/SQLModel modelini ekle.
2. Customer table icin tenant_id zorunlu alan, uygun indeks ve tenant_id + email uniqueness constraint kur.
3. Alembic migration upgrade/downgrade round-trip testlerini ekle.
4. Invalid Customer fixture rejection testlerini kur.
5. Cross-tenant model query negatif testini ekle.
6. GraphQL/API/UI/seed kapsamına atlamadan evidence patch hazırla.

Mutlak sınırlar:
- CUST-01 evidence yoksa kod yazma; blocker raporu üret.
- GraphQL resolver, API endpoint, frontend UI, seed veya e2e workflow başlatma.
- Customer dışı domain model, OrderOps veya Inventory ekleme.
- Downgrade testlenmeyen migration üretme.
- tenant_id olmadan veya global email uniqueness ile Customer modeli kurma.
- Fake production data, raw PII sample veya gerçek müşteri verisi ekleme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-11 ve CUST-01 evidence referansları
- DB/Alembic baseline ve tenant strategy evidence referansları
- Customer model/migration/test dosyaları var/yok
- GraphQL/UI/seed dosyalarının değişmediğini diff ile doğrula

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/models/customer.py
- apps/api/migrations/versions/*_customer.py
- apps/api/tests/test_customer_model.py
- apps/api/tests/test_customer_migration.py

Test-first sıra:
1. Customer model constraints testi önce kırmızı olur.
2. tenant_id required ve indexed testleri yeşile döner.
3. tenant_id + email uniqueness testi geçer.
4. Alembic upgrade/downgrade round-trip testi geçer.
5. Invalid Customer fixture rejection testi geçer.
6. Cross-tenant model query negatif testi geçer.
7. GraphQL/UI/seed diff'i olmadığını non-goal note ile kanıtla.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_model.py tests/test_customer_migration.py

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- tenant-scoped unique constraint test logu
- migration upgrade/downgrade logu
- invalid customer fixture rejection logu
- cross-tenant model query negative test logu
- GraphQL/UI/seed non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-11 ve CUST-01 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-customer-model` olarak açıldı.
- [ ] İlk commit kırmızı model constraint veya migration testi taşıyor.
- [ ] Customer model `tenant_id` zorunlu ve indeksli.
- [ ] `tenant_id + email` uniqueness constraint testli.
- [ ] Migration upgrade/downgrade round-trip testli.
- [ ] Invalid fixture rejection testli.
- [ ] Cross-tenant model query negatif testli.
- [ ] GraphQL/API/UI/seed diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Tenant-scoped unique constraint test logu alındı.
- [ ] Migration upgrade/downgrade logu alındı.
- [ ] Invalid fixture rejection logu alındı.
- [ ] Cross-tenant negative test logu alındı.
- [ ] Non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-customer-model",
  "refs": [
    "docs/platform-cust02-customer-model-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<customer-model-test-log-ref>",
    "migration:<customer-migration-log-ref>"
  ],
  "evidence": [
    "CUST-02 Customer Model geçti: <github-actions-run-url>",
    "Tenant-scoped unique constraint testleri geçti: <test-log-ref>",
    "Migration upgrade/downgrade round-trip geçti: <migration-log-ref>",
    "Invalid customer fixture rejection geçti: <test-log-ref>",
    "Cross-tenant model query negative test geçti: <test-log-ref>",
    "GraphQL/UI/seed non-goal diff note: <ref>",
    "Rollback note: Customer migration downgrade testlidir; GraphQL/API/UI/seed eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "customerModelEvidenceStatus": "verified",
    "queueStatus": "verified:CUST-02"
  }
}
```

## CUST-02 Done Kapısı

CUST-02 ancak şu koşullarla kapanır:

- PR-01..PR-11 ve CUST-01 evidence daha önce verified durumdadır.
- Customer model `tenant_id` zorunlu ve indeksli olarak testlidir.
- `tenant_id + email` uniqueness constraint testlidir.
- Migration upgrade/downgrade round-trip geçer.
- Invalid fixture rejection ve cross-tenant negative testleri geçer.
- GraphQL/API/UI/seed, OrderOps ve Inventory code eklenmemiştir.
- `platform-customer-model` node'una PR/CI/test/migration evidence geri yazılmıştır.

Bu done kapısı kapanmadan CUST-03 Customer GraphQL/API başlamaz.
