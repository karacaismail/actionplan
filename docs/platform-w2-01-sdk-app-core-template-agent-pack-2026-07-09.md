# W2-01 SDK App-Core Template Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W2-01`
Branch: `task/sdk-app-core-template`
WBS node'ları: `be-sdk`, `dx-cli`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-CUST-06`

Bu belge product code üretmez. Amaç, Customer CUST-06 evidence writeback kanıtı kapandıktan sonra açılacak W2-01 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W2-01 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- PR-10 `packages/sdk` public contract, deterministic codegen ve generated-output guard evidence
- CUST-06 Customer e2e/evidence writeback PR URL, CI run URL, merge commit SHA ve test logları
- `be-sdk`, `dx-cli`, `customer`, `platform-customer-*` actionplan writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W2-01'in tek amacı SDK app-core template sözleşmesini üretmektir:

- `packages/sdk/templates/app-core/` deterministik app boundary template'i eklenir.
- Template manifest, route/menu shell, capability binding ve event namespace skeleton üretir.
- Aynı input ile byte-stable output veren render testi vardır.
- Generated output public SDK contract'a bağlı kalır; elle düzenlenebilir veya rastgele çıktı üretmez.
- Forbidden stack scan app-core template ve generated output fixture üzerinde çalışır.
- `dx-cli` yalnız app-core template render/dry-run harness bağıyla trace edilir; full generator CLI başlatılmaz.

## Non-Goal

W2-01 şunları yapmaz:

- SDK module template, manifest healthz veya permission fixture üretmez; bunlar W2-02 kapsamıdır.
- Full `create-module` generator, missing-test no-go veya geniş guardrail seti üretmez; bunlar W2-03 kapsamıdır.
- Customer, OrderOps, Inventory veya herhangi bir domain model/API/UI/seed üretmez.
- Marketplace, module registry publication veya app-store packaging başlatmaz.
- Public SDK contract'ı geriye dönük uyumluluk gerekçesi olmadan genişletmez.
- Generated output'u elle düzenlenebilir bırakmaz veya nondeterministic timestamp/random içermez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız CUST-06 evidence kapandıktan sonra kullanır:

```text
Görev: W2-01 SDK App-Core Template.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/sdk-app-core-template
WBS nodes: be-sdk, dx-cli
Prerequisite: PR-01..PR-11 and CUST-01..CUST-06 verified evidence in actionplan.

Amaç:
1. packages/sdk/templates/app-core/ altında app boundary template manifestini ekle.
2. Template'in route/menu shell, capability binding ve event namespace skeleton ürettiğini test-first kanıtla.
3. Aynı input ile byte-stable output üreten deterministic render testi kur.
4. Generated output'un public SDK contract ve generated-header guard ile uyumlu olduğunu kanıtla.
5. Forbidden stack scan'i app-core template ve generated fixture üzerinde çalıştır.
6. dx-cli için yalnız app-core template dry-run/render harness bağlantısını ekle; full generator CLI üretme.
7. PR/CI/test evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- CUST-06 evidence yoksa kod yazma; blocker raporu üret.
- SDK module template, full create-module CLI, generator guardrails veya domain scaffold başlatma.
- Customer/OrderOps/Inventory model, API, UI, seed veya e2e kodu üretme.
- Template output'una timestamp, random id, environment-dependent ordering veya nondeterministic content koyma.
- Public API snapshot kırılımını gerekçesiz güncelleme.
- Yasak stack paketlerini template fixture veya generated output içine ekleme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-11 ve CUST-01..CUST-06 evidence referansları
- packages/sdk public contract ve codegen guard durumu
- packages/sdk/templates/app-core var/yok durumu
- mevcut template renderer/dry-run harness var/yok durumu
- forbidden-stack testlerinin template/generated fixture kapsamı
- Customer/OrderOps/Inventory domain code'a dokunulmadığını gösteren diff note

Beklenen minimum değişiklikler:
- packages/sdk/templates/app-core/manifest.json
- packages/sdk/templates/app-core/README.md
- packages/sdk/templates/app-core/routes.ts.hbs
- packages/sdk/templates/app-core/capabilities.ts.hbs
- packages/sdk/templates/app-core/events.ts.hbs
- packages/sdk/src/templates/app-core.ts
- packages/sdk/tests/app-core-template.test.ts
- packages/sdk/tests/fixtures/app-core-template/input.json
- packages/sdk/tests/fixtures/app-core-template/output-snapshot/
- packages/sdk/tests/forbidden-stack-template.test.ts veya mevcut forbidden-stack testine app-core fixture kapsamı

Test-first sıra:
1. App-core template manifest validation testi önce kırmızı olur.
2. Route/menu shell ve capability binding snapshot testi kırmızıdan yeşile döner.
3. Event namespace skeleton collision testi geçer.
4. Aynı input iki kez render edildiğinde byte-stable output testi geçer.
5. Generated header/manual-edit guard uyum testi geçer.
6. Forbidden stack scan app-core template ve generated fixture için geçer.
7. Domain code eklenmediği diff note ile kanıtlanır.

Zorunlu doğrulama:
pnpm --filter @platform/sdk run test -- app-core-template
pnpm --filter @platform/sdk run test -- forbidden-stack

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- app-core template manifest/snapshot test logu
- deterministic render byte-stable test logu
- forbidden stack scan logu
- generated-header/manual-edit guard uyum logu
- Customer/OrderOps/Inventory non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-11 ve CUST-01..CUST-06 evidence actionplan'da doğrulandı.
- [ ] Branch `task/sdk-app-core-template` olarak açıldı.
- [ ] İlk commit kırmızı app-core template veya deterministic render testi taşıyor.
- [ ] `packages/sdk/templates/app-core/` manifest ve skeleton dosyaları var.
- [ ] Template route/menu shell, capability binding ve event namespace skeleton üretiyor.
- [ ] Render output aynı input ile byte-stable.
- [ ] Generated-header/manual-edit guard uyumu korunuyor.
- [ ] Forbidden stack scan app-core template ve generated fixture üzerinde yeşil.
- [ ] SDK module template, full generator CLI ve domain scaffold diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] App-core template snapshot test logu alındı.
- [ ] Deterministic render test logu alındı.
- [ ] Forbidden stack scan logu alındı.
- [ ] Generated-header/manual-edit guard uyum logu alındı.
- [ ] Domain non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "be-sdk",
    "refs": [
      "docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<app-core-template-test-log-ref>"
    ],
    "evidence": [
      "W2-01 SDK App-Core Template geçti: <github-actions-run-url>",
      "App-core template manifest/snapshot testleri geçti: <test-log-ref>",
      "Deterministic render byte-stable testleri geçti: <test-log-ref>",
      "Generated-header/manual-edit guard uyumu geçti: <test-log-ref>",
      "Forbidden stack scan app-core template ve generated fixture için geçti: <test-log-ref>",
      "Rollback note: packages/sdk/templates/app-core ve template renderer değişiklikleri revert edilebilir; module template, full generator CLI ve domain scaffold eklenmedi"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "appCoreTemplateEvidenceStatus": "verified",
      "queueStatus": "verified:W2-01"
    }
  },
  {
    "id": "dx-cli",
    "refs": [
      "docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<app-core-template-dry-run-log-ref>"
    ],
    "evidence": [
      "W2-01 dx-cli kapsamı yalnız app-core template render/dry-run harness bağı olarak doğrulandı: <test-log-ref>",
      "Full create-module generator ve module template başlatılmadı: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "appCoreTemplateHarnessStatus": "verified",
      "queueStatus": "verified:W2-01"
    }
  }
]
```

## W2-01 Done Kapısı

W2-01 ancak şu koşullarla kapanır:

- PR-01..PR-11 ve CUST-01..CUST-06 evidence daha önce verified durumdadır.
- `packages/sdk/templates/app-core/` template manifest ve skeleton dosyaları vardır.
- Template route/menu shell, capability binding ve event namespace skeleton üretir.
- Deterministic render aynı input ile byte-stable output üretir.
- Generated-header/manual-edit guard uyumu korunur.
- Forbidden stack scan app-core template ve generated fixture için geçer.
- SDK module template, full generator CLI, Customer, OrderOps ve Inventory code eklenmemiştir.
- `be-sdk` ve `dx-cli` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W2-02 SDK Module Template başlamaz.
