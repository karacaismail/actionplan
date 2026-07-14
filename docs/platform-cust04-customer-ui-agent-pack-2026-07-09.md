# CUST-04 Customer UI Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `CUST-04`
Branch: `task/platform-customer-ui`
WBS node'u: `platform-customer-ui`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-CUST-03`

Bu belge product code üretmez. Amaç, CUST-03 Customer GraphQL/API kanıtı kapandıktan sonra açılacak CUST-04 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

CUST-04 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01 Customer app-core verified evidence
- CUST-02 Customer model + migration verified evidence
- CUST-03 Customer GraphQL/API + authz/audit/event verified evidence
- `platform-customer-ui` actionplan writeback'i

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

CUST-04'ün tek amacı Customer UI route/surface/form evidence üretmektir:

- Customer route açılır ve capability-gated navigation ile korunur.
- Liste, detay ve form yüzeyleri CUST-03 GraphQL contract'ına bağlanır.
- Empty/loading/error state testleri vardır.
- Create/edit form validation, label/input ve ARIA hata ilişkileri testlidir.
- Axe, keyboard ve focus evidence üretilir.

## Non-Goal

CUST-04 şunları yapmaz:

- Backend schema, model, migration veya GraphQL resolver değişikliği yapmaz.
- Customer seed/golden fixture veya full e2e evidence writeback başlatmaz.
- Auth/session/token storage altyapısını yeniden yazmaz.
- OrderOps, Inventory veya başka domain UI üretmez.
- Capability-hidden navigation testini zayıflatmaz.
- Generic SurfaceRenderer/Vitrin smoke'u Customer UI done kanıtı gibi sunmaz.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız CUST-03 evidence kapandıktan sonra kullanır:

```text
Görev: CUST-04 Customer UI.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-customer-ui
WBS nodes: platform-customer-ui
Prerequisite: PR-01..PR-11, CUST-01, CUST-02 and CUST-03 verified evidence in actionplan.

Amaç:
1. Customer route tree, list/detail/form surfaces ve capability-gated navigation oluştur.
2. UI'yi CUST-03 GraphQL contract'ına bağla; doğrudan DB/ORM/ham fetch bypass yapma.
3. Empty/loading/error/form validation state testlerini kırmızıdan yeşile taşı.
4. Form label/input/ARIA error relation testlerini ekle.
5. Browser smoke, axe, keyboard ve focus evidence üret.
6. Backend schema/model/API değişikliği yapmadan evidence patch hazırla.

Mutlak sınırlar:
- CUST-03 evidence yoksa kod yazma; blocker raporu üret.
- Backend schema, model, migration, resolver veya seed değiştirme.
- Customer UI içinde token/session/auth altyapısını yeniden yazma.
- Capability guard olmadan navigation veya route açma.
- Generic Vitrin/SurfaceRenderer smoke'u Customer UI evidence diye sunma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-11, CUST-01, CUST-02 ve CUST-03 evidence referansları
- Customer route/UI dosyaları var/yok
- GraphQL contract/hook/codegen durumu
- capability-gated navigation durumu
- backend schema/model/API dosyalarının değişmediğini diff ile doğrula

Beklenen minimum değişiklikler:
- apps/web/src/apps/customer/routes.tsx
- apps/web/src/apps/customer/CustomerList.tsx
- apps/web/src/apps/customer/CustomerDetail.tsx
- apps/web/src/apps/customer/CustomerForm.tsx
- apps/web/src/apps/customer/customer-ui.test.tsx
- apps/web/e2e/customer.spec.ts

Test-first sıra:
1. Customer route render smoke testi önce kırmızı olur.
2. Capability-hidden navigation testi kırmızıdan yeşile döner.
3. Empty/loading/error state tests geçer.
4. Create/edit form validation ve ARIA relation tests geçer.
5. Browser smoke + axe/keyboard/focus evidence geçer.
6. Backend schema/model/API diff'i olmadığını non-goal note ile kanıtla.

Zorunlu doğrulama:
pnpm --filter @platform/web run test -- customer-ui
pnpm --filter @platform/web run e2e -- customer.spec.ts

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- route render smoke logu
- capability-hidden navigation test logu
- create/edit form validation test logu
- axe/keyboard/focus report
- backend schema/model/API non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-11, CUST-01, CUST-02 ve CUST-03 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-customer-ui` olarak açıldı.
- [ ] İlk commit kırmızı route, capability navigation veya form state testi taşıyor.
- [ ] Customer route/list/detail/form surfaces var.
- [ ] Capability-hidden navigation testi var.
- [ ] Empty/loading/error/form validation state tests var.
- [ ] Axe, keyboard ve focus evidence var.
- [ ] Backend schema/model/API/seed diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Route render smoke logu alındı.
- [ ] Capability-hidden navigation test logu alındı.
- [ ] Form validation test logu alındı.
- [ ] Axe/keyboard/focus report alındı.
- [ ] Backend non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-customer-ui",
  "refs": [
    "docs/platform-cust04-customer-ui-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<customer-ui-test-log-ref>",
    "a11y:<customer-ui-a11y-report-ref>"
  ],
  "evidence": [
    "CUST-04 Customer UI geçti: <github-actions-run-url>",
    "Route render smoke geçti: <test-log-ref>",
    "Capability-hidden navigation testi geçti: <test-log-ref>",
    "Create/edit form validation testleri geçti: <test-log-ref>",
    "Axe/keyboard/focus report yeşil: <a11y-report-ref>",
    "Backend schema/model/API non-goal diff note: <ref>",
    "Rollback note: Customer UI route/surface change revert edilebilir; backend schema/model/API/seed eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "customerUiEvidenceStatus": "verified",
    "queueStatus": "verified:CUST-04"
  }
}
```

## CUST-04 Done Kapısı

CUST-04 ancak şu koşullarla kapanır:

- PR-01..PR-11, CUST-01, CUST-02 ve CUST-03 evidence daha önce verified durumdadır.
- Customer route/list/detail/form surfaces testlidir.
- Capability-hidden navigation testi geçer.
- Empty/loading/error/form validation state tests geçer.
- Axe/keyboard/focus evidence yeşildir.
- Customer UI'nın tükettiği Master Component'ler story matrisi + story interaction + story a11y + visual regression evidence'ıyla Storybook'ta yayınlanmıştır; storybook-ci PASS'tır (story testleri Playwright E2E'nin yerine geçmez — bkz. `docs/storybook-implementation.md` §6, `docs/ci-conformance-gates.md` storybook-ci).
- Backend schema/model/API/seed, OrderOps ve Inventory code eklenmemiştir.
- `platform-customer-ui` node'una PR/CI/test/a11y evidence geri yazılmıştır.

Bu done kapısı kapanmadan CUST-05 Customer Seed başlamaz.
