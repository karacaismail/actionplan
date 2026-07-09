# W2-02 SDK Module Template Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W2-02`
Branch: `task/sdk-module-template`
WBS node'ları: `be-sdk`, `dx-cli`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W2-01`

Bu belge product code üretmez. Amaç, W2-01 SDK App-Core Template kanıtı kapandıktan sonra açılacak W2-02 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W2-02 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- W2-01 SDK app-core template verified evidence
- `packages/sdk/templates/app-core` deterministic render, generated-header/manual-edit guard ve forbidden-stack evidence
- `be-sdk` ve `dx-cli` W2-01 actionplan writeback'leri

Bu kanıtlar yoksa W2-02 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W2-02'nin tek amacı SDK module template sözleşmesini üretmektir:

- `packages/sdk/templates/module/` deterministik module template'i eklenir.
- Module manifest, healthz endpoint fixture, permission fixture ve test harness skeleton üretir.
- Template manifest validation fail-closed çalışır.
- Permission fixture capability/authz sözleşmesine bağlanır, public-by-default olmaz.
- Healthz fixture tenant/domain state'e sızmadan minimal module readiness verir.
- `dx-cli` yalnız module template render/dry-run harness bağıyla trace edilir; full marketplace veya full generator CLI başlatılmaz.

## Non-Goal

W2-02 şunları yapmaz:

- Generator guardrails, missing-test no-go veya generated-output manual edit enforcement genişletmesini başlatmaz; bunlar W2-03 kapsamıdır.
- OrderOps, Inventory veya herhangi bir domain model/API/UI/seed üretmez.
- Marketplace publication, module signing, module registry runtime veya app-store packaging başlatmaz.
- App-core template sözleşmesini kıracak public API genişletmesi yapmaz.
- Permission fixture'ı allow-all veya tenantless hale getirmez.
- Generated output'u nondeterministic timestamp/random/order-dependent içerikle üretmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W2-01 evidence kapandıktan sonra kullanır:

```text
Görev: W2-02 SDK Module Template.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/sdk-module-template
WBS nodes: be-sdk, dx-cli
Prerequisite: W2-01 verified evidence in actionplan.

Amaç:
1. packages/sdk/templates/module/ altında module template manifestini ekle.
2. Module healthz fixture, permission fixture ve test harness skeleton üretimini test-first kanıtla.
3. Manifest validation testini fail-closed kur; eksik id/name/permission tanımını reddet.
4. Permission fixture'ı capability/authz sözleşmesine bağla ve public-by-default olmadığını negatif testle kanıtla.
5. Healthz fixture'ın tenant/domain state veya PII sızdırmadığını test et.
6. dx-cli için yalnız module template dry-run/render harness bağlantısını ekle; full marketplace veya full generator CLI üretme.
7. PR/CI/test evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W2-01 evidence yoksa kod yazma; blocker raporu üret.
- Generator guardrails, OrderOps, Inventory veya marketplace runtime başlatma.
- Module template'i capability/authz/tenant guard olmadan public çalıştırma.
- Healthz fixture'a tenant data, domain payload veya PII koyma.
- Template output'una timestamp, random id veya environment-dependent ordering koyma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W2-01 evidence referansları
- packages/sdk/templates/app-core verified writeback durumu
- packages/sdk/templates/module var/yok durumu
- manifest validator ve template renderer durumu
- module permission fixture var/yok durumu
- marketplace/generator/domain code'a dokunulmadığını gösteren diff note

Beklenen minimum değişiklikler:
- packages/sdk/templates/module/manifest.json
- packages/sdk/templates/module/README.md
- packages/sdk/templates/module/healthz.ts.hbs
- packages/sdk/templates/module/permissions.ts.hbs
- packages/sdk/templates/module/module.ts.hbs
- packages/sdk/src/templates/module.ts
- packages/sdk/tests/module-template.test.ts
- packages/sdk/tests/fixtures/module-template/input.json
- packages/sdk/tests/fixtures/module-template/output-snapshot/
- packages/sdk/tests/module-permission-fixture.test.ts

Test-first sıra:
1. Module template manifest validation testi önce kırmızı olur.
2. Healthz fixture snapshot testi kırmızıdan yeşile döner.
3. Permission fixture capability/authz negatif testi geçer.
4. Missing manifest field testi fail-closed geçer.
5. Aynı input iki kez render edildiğinde byte-stable output testi geçer.
6. Healthz fixture tenant/domain state veya PII sızdırmıyor testi geçer.
7. Marketplace/generator/domain code eklenmediği diff note ile kanıtlanır.

Zorunlu doğrulama:
pnpm --filter @platform/sdk run test -- module-template
pnpm --filter @platform/sdk run test -- module-permission-fixture

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- module template manifest/snapshot test logu
- healthz fixture test logu
- permission fixture negatif test logu
- deterministic render byte-stable test logu
- marketplace/generator/domain non-goal diff note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W2-01 evidence actionplan'da doğrulandı.
- [ ] Branch `task/sdk-module-template` olarak açıldı.
- [ ] İlk commit kırmızı module template, manifest validation veya permission fixture testi taşıyor.
- [ ] `packages/sdk/templates/module/` manifest ve skeleton dosyaları var.
- [ ] Healthz fixture tenant/domain state sızdırmadan üretiliyor.
- [ ] Permission fixture capability/authz sözleşmesine bağlı ve public-by-default değil.
- [ ] Render output aynı input ile byte-stable.
- [ ] Marketplace, generator guardrails ve domain scaffold diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Module template snapshot test logu alındı.
- [ ] Manifest validation test logu alındı.
- [ ] Healthz fixture test logu alındı.
- [ ] Permission fixture negatif test logu alındı.
- [ ] Domain/generator/marketplace non-goal diff note yazıldı.
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
      "docs/platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<module-template-test-log-ref>"
    ],
    "evidence": [
      "W2-02 SDK Module Template geçti: <github-actions-run-url>",
      "Module template manifest/snapshot testleri geçti: <test-log-ref>",
      "Healthz fixture testleri geçti: <test-log-ref>",
      "Permission fixture capability/authz negatif testleri geçti: <test-log-ref>",
      "Deterministic render byte-stable testleri geçti: <test-log-ref>",
      "Rollback note: packages/sdk/templates/module ve module template renderer değişiklikleri revert edilebilir; generator guardrails, marketplace ve domain scaffold eklenmedi"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "moduleTemplateEvidenceStatus": "verified",
      "queueStatus": "verified:W2-02"
    }
  },
  {
    "id": "dx-cli",
    "refs": [
      "docs/platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<module-template-dry-run-log-ref>"
    ],
    "evidence": [
      "W2-02 dx-cli kapsamı yalnız module template render/dry-run harness bağı olarak doğrulandı: <test-log-ref>",
      "Marketplace publication ve full create-module generator başlatılmadı: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "moduleTemplateHarnessStatus": "verified",
      "queueStatus": "verified:W2-02"
    }
  }
]
```

## W2-02 Done Kapısı

W2-02 ancak şu koşullarla kapanır:

- W2-01 evidence daha önce verified durumdadır.
- `packages/sdk/templates/module/` template manifest ve skeleton dosyaları vardır.
- Manifest validation fail-closed çalışır.
- Healthz fixture tenant/domain state veya PII sızdırmaz.
- Permission fixture capability/authz sözleşmesine bağlıdır ve public-by-default değildir.
- Deterministic render aynı input ile byte-stable output üretir.
- Generator guardrails, marketplace runtime, OrderOps ve Inventory code eklenmemiştir.
- `be-sdk` ve `dx-cli` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W2-03 Generator Guardrails başlamaz.
