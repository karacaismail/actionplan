# CUST-01 Customer App-Core Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `CUST-01`
Branch: `task/platform-customer-app-core`
WBS node'ları: `platform-factory`, `k-capability`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-11`

Bu belge product code üretmez. Amaç, PR-11 Hello Platform Boot Smoke kanıtı kapandıktan sonra açılacak CUST-01 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

CUST-01 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- PR-11 Hello Platform boot smoke PR URL, CI run URL ve merge commit SHA
- Tenant, authz, event/outbox, ECA, audit, capability, DB, observability ve SDK evidence writeback'leri
- `platform-factory`, `k-capability`, `be-sdk` ve `dx-cli` actionplan writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

CUST-01'in tek amacı Customer app boundary kaydını üretmektir:

- `customer` app slug deterministik registry/capability sistemine bağlanır.
- Customer capability olmadan route/menu görünmez.
- Customer route/menu shell oluşur; liste/form/detail veya CRUD davranışı başlamaz.
- Event namespace `customer.*` olarak çakışmasız ayrılır.
- App-core Customer domain model, DB migration, GraphQL resolver ve seed üretmez.

## Non-Goal

CUST-01 şunları yapmaz:

- Customer SQLModel/SQLAlchemy model veya Alembic migration eklemez.
- Customer CRUD, GraphQL query/mutation veya API resolver üretmez.
- Customer list/detail/form UI, validation veya data fetching başlatmaz.
- Seed/golden fixture veya e2e Customer workflow üretmez.
- OrderOps, Inventory veya Wave 2 repeatability işine geçmez.
- Capability gate testlerini zayıflatıp route/menu erişimini public yapmaz.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-11 evidence kapandıktan sonra kullanır:

```text
Görev: CUST-01 Customer App-Core.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-customer-app-core
WBS nodes: platform-factory, k-capability
Prerequisite: PR-01..PR-11 verified evidence in actionplan.

Amaç:
1. Customer app slug'ini deterministik registry/capability kaydına bağla.
2. Customer capability olmadan route/menu shell görünmeyecek şekilde fail-closed test kur.
3. apps/web tarafında Customer route/menu shell entry oluştur.
4. Event namespace'i customer.* olarak çakışmasız ayır ve collision testini ekle.
5. App-core boundary'yi Customer model/API/UI/seed işlerinden ayır.
6. PR/CI/test evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- PR-11 evidence yoksa kod yazma; blocker raporu üret.
- Customer model, DB migration, GraphQL resolver, CRUD, list/detail/form UI veya seed başlatma.
- Route/menu shell'i capability guard olmadan public gösterme.
- Event namespace'i generic veya çakışabilir isimle kurma.
- Customer domain payload, PII, sample production data veya fake tenant data ekleme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-11 evidence referansları
- capability registry/manifest ve route/menu guard durumu
- apps/api altında Customer app-core kaydı var/yok
- apps/web/src/apps/customer var/yok
- customer.* event namespace arama sonucu
- Customer model/API/UI/seed kodu olmadığını doğrula

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/customer_core.py
- apps/api/tests/test_customer_app_core.py
- apps/web/src/apps/customer/index.tsx
- apps/web/src/apps/customer/customer-route.test.tsx
- apps/web/src/router.tsx
- apps/web/src/navigation veya menu registry dosyası varsa ilgili route/menu kaydı

Test-first sıra:
1. Customer app slug registry testi önce kırmızı olur.
2. Capability olmadan Customer route/menu gizli testi kırmızıdan yeşile döner.
3. Capability ile Customer shell route/menu görünür smoke testi geçer.
4. customer.* event namespace collision testi geçer.
5. Customer model/API/UI/seed dosyası eklenmediğini guard veya diff review ile kanıtla.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_app_core.py
pnpm --filter @platform/web run test -- customer-route

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- app slug registry test logu
- capability olmadan route/menu gizli test logu
- customer.* event namespace collision test logu
- Customer CRUD/model/API/UI/seed non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-11 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-customer-app-core` olarak açıldı.
- [ ] İlk commit kırmızı app slug, capability veya namespace testi taşıyor.
- [ ] Customer app slug deterministik registry'ye bağlı.
- [ ] Customer capability olmadan route/menu görünmüyor.
- [ ] Customer route/menu shell var, ancak CRUD davranışı yok.
- [ ] Event namespace `customer.*` olarak çakışmasız.
- [ ] Customer model/API/UI/seed diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] App slug registry test logu alındı.
- [ ] Capability route/menu guard test logu alındı.
- [ ] Event namespace collision test logu alındı.
- [ ] Non-goal diff note yazıldı.
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
      "docs/platform-cust01-customer-app-core-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<customer-app-core-test-log-ref>"
    ],
    "evidence": [
      "CUST-01 Customer App-Core geçti: <github-actions-run-url>",
      "Customer route/menu shell smoke geçti: <test-log-ref>",
      "Customer CRUD/model/API/UI/seed eklenmedi: <diff-note-ref>",
      "Rollback note: Customer app-core registration revert edilebilir"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "customerAppCoreEvidenceStatus": "verified",
      "queueStatus": "verified:CUST-01"
    }
  },
  {
    "id": "k-capability",
    "refs": [
      "docs/platform-cust01-customer-app-core-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<customer-capability-test-log-ref>"
    ],
    "evidence": [
      "Customer capability binding geçti: <test-log-ref>",
      "Capability olmadan route/menu gizli testi geçti: <test-log-ref>",
      "customer.* event namespace collision testi geçti: <test-log-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "customerCapabilityStatus": "verified",
      "queueStatus": "verified:CUST-01"
    }
  }
]
```

## CUST-01 Done Kapısı

CUST-01 ancak şu koşullarla kapanır:

- PR-01..PR-11 evidence daha önce verified durumdadır.
- Customer app slug registry/capability kaydına deterministik bağlanır.
- Capability olmadan Customer route/menu görünmez.
- Customer route/menu shell smoke geçer.
- Event namespace `customer.*` collision testleri geçer.
- Customer model/API/UI/seed, OrderOps ve Inventory code eklenmemiştir.
- `platform-factory` ve `k-capability` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan CUST-02 Customer Model başlamaz.
