# PR-11 Hello Platform Boot Smoke Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `PR-11`
Branch: `task/platform-factory-hello-platform`
WBS node'u: `platform-factory`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-10`

Bu belge product code üretmez. Amaç, PR-10 SDK Public Contract kanıtı kapandıktan sonra açılacak PR-11 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-11 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-04 event/outbox durability verified evidence
- PR-05 ECA runtime guard verified evidence
- PR-06 append-only audit verified evidence
- PR-07 module registry/capability entitlement verified evidence
- PR-08 DB/Alembic migration + rollback verified evidence
- PR-09 health/ready/metrics/trace/logging verified evidence
- PR-10 SDK public contract + deterministic codegen verified evidence
- `be-sdk` ve `dx-cli` actionplan writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-11'in tek amacı Foundation zincirini Hello Platform boot smoke evidence ile kapatmaktır:

- API boot, `/healthz`, GraphQL ping ve tenant-aware request smoke testleri geçer.
- UI shell boot smoke ve storefront smoke testleri geçer.
- SDK public path minimal call veya fixture ile doğrulanır.
- Local full-stack boot logu üretilir.
- CI smoke ve varsa deploy/staging smoke evidence aynı PR'da toplanır.
- PR-11 sonrası Customer vertical slice kuyruğuna geçiş için evidence writeback hazırlanır.

## Non-Goal

PR-11 şunları yapmaz:

- Customer CRUD, Customer model/API/UI veya Customer seed başlatmaz.
- OrderOps, Inventory veya Wave 2 repeatability işi başlatmaz.
- App marketplace, portfolio release train veya Wave 4 app assembly başlatmaz.
- Production feature setini genişletmez; yalnız boot/smoke kanıtı üretir.
- Remote/deploy URL uydurmaz veya local smoke'u remote CI evidence yerine koymaz.
- PR-01..PR-10 evidence eksikken Foundation complete iddiası yazmaz.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-10 evidence kapandıktan sonra kullanır:

```text
Görev: PR-11 Hello Platform Boot Smoke.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-factory-hello-platform
WBS nodes: platform-factory
Prerequisite: PR-01..PR-10 verified evidence in actionplan.

Amaç:
1. API boot, /healthz ve GraphQL ping smoke testlerini CI içinde kanıtla.
2. Tenant-aware request smoke testini fail-closed tenant context ile ekle/yeşile taşı.
3. UI shell boot smoke ve storefront/browser smoke testlerini yeşile taşı.
4. PR-10 SDK public path'ini minimal call veya fixture smoke ile doğrula.
5. Local full-stack boot komutunu ve log formatını kaydet.
6. CI run URL, PR URL, commit SHA, smoke logları ve rollback note evidence setini hazırla.
7. Customer vertical slice başlamadan önce Foundation complete evidence patch'ini hazırla.

Mutlak sınırlar:
- PR-10 evidence yoksa kod yazma; blocker raporu üret.
- Customer CRUD/model/API/UI/seed, OrderOps veya Inventory başlatma.
- Local smoke'u remote CI/deploy evidence gibi sunma.
- Remote/deploy URL, PR URL veya CI run URL uydurma.
- Tenant-aware request smoke olmadan Hello Platform done yazma.
- SDK path smoke olmadan Foundation complete iddiası yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-10 evidence referansları
- apps/api route/test durumu: health, GraphQL ping, tenant request smoke
- apps/web route/test/e2e durumu: shell, storefront, browser smoke
- SDK public path smoke durumu
- local full-stack boot komutu var/yok
- CI/deploy smoke evidence var/yok

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/app.py
- apps/api/tests/test_hello_platform.py
- apps/api/tests/test_tenant_request_smoke.py
- apps/web/src/App.tsx
- apps/web/src/router.tsx
- apps/web/src/pages/Landing.tsx
- apps/web/src/App.smoke.test.tsx
- apps/web/e2e/hello-platform.spec.ts
- apps/web/e2e/storefront.spec.ts
- docs/hello-platform-smoke.md veya reports/hello-platform-smoke.md

Test-first sıra:
1. API hello-platform boot smoke testi önce kırmızı olur.
2. Tenant-aware request smoke testi tenant context yoksa fail-closed döner.
3. GraphQL ping smoke CI içinde geçer.
4. UI shell ve storefront smoke testleri geçer.
5. SDK public path minimal call veya fixture test edilir.
6. Local full-stack boot komutu log üretir.
7. CI smoke ve varsa deploy/staging smoke URL evidence setine bağlanır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_hello_platform.py tests/test_tenant_request_smoke.py
pnpm --filter @platform/web run test -- hello-platform
pnpm --filter @platform/web run e2e -- hello-platform.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- API boot smoke test logu
- tenant request smoke test logu
- UI boot/storefront smoke test logu
- SDK path smoke note
- local full-stack boot logu
- deploy/staging smoke URL veya "not available" gerekçesi
- rollback/revert smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-10 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-factory-hello-platform` olarak açıldı.
- [ ] İlk commit kırmızı API/UI/tenant/SDK smoke testi taşıyor.
- [ ] API boot, `/healthz` ve GraphQL ping smoke testleri var.
- [ ] Tenant-aware request smoke testi var.
- [ ] UI shell boot ve storefront/browser smoke testleri var.
- [ ] SDK public path minimal call veya fixture smoke var.
- [ ] Local full-stack boot log formatı var.
- [ ] Customer CRUD/model/API/UI, OrderOps ve Inventory diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] API boot smoke test logu alındı.
- [ ] Tenant request smoke test logu alındı.
- [ ] UI boot/storefront smoke test logu alındı.
- [ ] SDK path smoke note alındı.
- [ ] Local full-stack boot logu alındı.
- [ ] Deploy/staging smoke URL veya yokluk gerekçesi yazıldı.
- [ ] Rollback/revert smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-factory",
  "refs": [
    "docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<hello-platform-test-log-ref>",
    "smoke:<local-or-staging-smoke-ref>"
  ],
  "evidence": [
    "PR-11 Hello Platform Boot Smoke geçti: <github-actions-run-url>",
    "API boot, health ve GraphQL ping smoke testleri geçti: <test-log-ref>",
    "Tenant-aware request smoke testi geçti: <test-log-ref>",
    "UI shell/storefront smoke testleri geçti: <test-log-ref>",
    "SDK public path smoke doğrulandı: <ref>",
    "Local full-stack boot logu: <ref>",
    "Deploy/staging smoke: <url-or-not-available-reason>",
    "Rollback note: hello-platform smoke change revert edilebilir; Customer CRUD, OrderOps ve Inventory eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "helloPlatformEvidenceStatus": "verified",
    "queueStatus": "verified:PR-11",
    "nextQueueStage": "customer"
  }
}
```

## PR-11 Done Kapısı

PR-11 ancak şu koşullarla kapanır:

- PR-01..PR-10 evidence daha önce verified durumdadır.
- API boot, `/healthz`, GraphQL ping ve tenant-aware request smoke CI içinde geçer.
- UI shell boot ve storefront/browser smoke CI içinde geçer.
- SDK public path minimal call veya fixture ile kanıtlanır.
- Local full-stack boot logu vardır.
- PR URL, CI run URL, merge commit SHA ve smoke/test evidence geri yazılır.
- Customer CRUD/model/API/UI, OrderOps ve Inventory code eklenmemiştir.
- `platform-factory` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan Customer CUST-01 app-core başlamaz.
