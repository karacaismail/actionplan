# CUST-05 Customer Seed Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `CUST-05`
Branch: `task/platform-customer-seed`
WBS node'u: `platform-customer-seed`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-CUST-04`

Bu belge product code üretmez. Amaç, CUST-04 Customer UI kanıtı kapandıktan sonra açılacak CUST-05 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

CUST-05 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01 Customer app-core verified evidence
- CUST-02 Customer model + migration verified evidence
- CUST-03 Customer GraphQL/API verified evidence
- CUST-04 Customer UI verified evidence
- `platform-customer-seed` actionplan writeback'i

Bu kanıtlar yoksa CUST-05 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

CUST-05'in tek amacı deterministic Customer seed ve golden fixture evidence üretmektir:

- Customer seed tekrar çalıştırıldığında duplicate üretmez.
- Golden fixture Customer model schema ile uyumludur.
- Seed tenant-separated çalışır.
- Rollback/clean komutu testlidir.
- CUST-06 e2e testlerinin dayanacağı fixture snapshot üretilir.

## Non-Goal

CUST-05 şunları yapmaz:

- Yeni Customer UI feature, route veya form davranışı üretmez.
- GraphQL/API resolver, model veya migration değişikliği yapmaz.
- Full e2e evidence writeback başlatmaz.
- Gerçek müşteri verisi, production PII veya canlı tenant datası eklemez.
- OrderOps, Inventory veya başka domain seed üretmez.
- Seed idempotency testini atlayarak demo verisini elle çoğaltmaz.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız CUST-04 evidence kapandıktan sonra kullanır:

```text
Görev: CUST-05 Customer Seed.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-customer-seed
WBS nodes: platform-customer-seed
Prerequisite: PR-01..PR-11 and CUST-01..CUST-04 verified evidence in actionplan.

Amaç:
1. deterministic tenant-aware Customer seed script'i ekle.
2. Golden fixture snapshot'i Customer model schema ile uyumlu tut.
3. Seed idempotency testini kırmızıdan yeşile taşı.
4. Tenant-separated seed testini ekle.
5. Seed rollback/clean komutunu ve testini ekle.
6. CUST-06 e2e senaryolarının dayanacağı fixture evidence üret.

Mutlak sınırlar:
- CUST-04 evidence yoksa kod yazma; blocker raporu üret.
- Gerçek müşteri verisi, production PII, canlı tenant id veya dış sistemden alınmış data ekleme.
- Customer UI, GraphQL/API, model veya migration değişikliği yapma.
- OrderOps, Inventory veya başka domain seed başlatma.
- Seed tekrarında duplicate üreten fixture kabul etme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-11 ve CUST-01..CUST-04 evidence referansları
- mevcut apps/api/seed/seed.py placeholder durumunu not et
- customer_seed.py ve fixtures/customers.json var/yok
- model/schema compatibility referansları
- UI/API/model dosyalarının değişmediğini diff ile doğrula

Beklenen minimum değişiklikler:
- apps/api/seed/customer_seed.py
- apps/api/seed/fixtures/customers.json
- apps/api/tests/test_customer_seed.py

Test-first sıra:
1. Seed idempotency testi önce kırmızı olur.
2. Golden fixture snapshot schema compatibility testi geçer.
3. Tenant-separated seed testi geçer.
4. Rollback/clean komutu testi geçer.
5. UI/API/model/migration diff'i olmadığını non-goal note ile kanıtla.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_seed.py

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- seed idempotency test logu
- golden fixture snapshot ref
- tenant-separated seed test logu
- rollback/clean test logu
- UI/API/model non-goal diff note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] PR-01..PR-11 ve CUST-01..CUST-04 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-customer-seed` olarak açıldı.
- [ ] İlk commit kırmızı seed idempotency veya fixture compatibility testi taşıyor.
- [ ] Golden fixture sentetik ve production PII içermiyor.
- [ ] Seed tekrarında duplicate üretmiyor.
- [ ] Tenant-separated seed testi var.
- [ ] Rollback/clean testi var.
- [ ] UI/API/model/migration diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Seed idempotency test logu alındı.
- [ ] Golden fixture snapshot ref alındı.
- [ ] Tenant-separated seed test logu alındı.
- [ ] Rollback/clean test logu alındı.
- [ ] UI/API/model non-goal diff note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-customer-seed",
  "refs": [
    "docs/platform-cust05-customer-seed-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<customer-seed-test-log-ref>",
    "fixture:<customer-golden-fixture-ref>"
  ],
  "evidence": [
    "CUST-05 Customer Seed geçti: <github-actions-run-url>",
    "Seed idempotency testleri geçti: <test-log-ref>",
    "Golden fixture snapshot schema-compatible: <fixture-ref>",
    "Tenant-separated seed testleri geçti: <test-log-ref>",
    "Rollback/clean testleri geçti: <test-log-ref>",
    "UI/API/model non-goal diff note: <ref>",
    "Rollback note: Customer seed/fixture revert edilebilir; gerçek müşteri verisi eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "customerSeedEvidenceStatus": "verified",
    "queueStatus": "verified:CUST-05"
  }
}
```

## CUST-05 Done Kapısı

CUST-05 ancak şu koşullarla kapanır:

- PR-01..PR-11 ve CUST-01..CUST-04 evidence daha önce verified durumdadır.
- Seed idempotency testleri geçer.
- Golden fixture schema-compatible ve sentetiktir.
- Tenant-separated seed testleri geçer.
- Rollback/clean testleri geçer.
- UI/API/model/migration, OrderOps ve Inventory code eklenmemiştir.
- `platform-customer-seed` node'una PR/CI/test/fixture evidence geri yazılmıştır.

Bu done kapısı kapanmadan CUST-06 Customer E2E + Evidence Writeback başlamaz.
