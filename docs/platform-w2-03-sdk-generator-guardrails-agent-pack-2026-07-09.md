# W2-03 SDK Generator Guardrails Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `W2-03`
Branch: `task/sdk-generator-guardrails`
WBS node'ları: `be-sdk`, `dx-cli`, `dx-workflow`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W2-02`

Bu belge product code üretmez. Amaç, W2-02 SDK Module Template kanıtı kapandıktan sonra açılacak W2-03 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W2-03 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- W2-01 SDK app-core template verified evidence
- W2-02 SDK module template verified evidence
- `be-sdk`, `dx-cli` ve template evidence actionplan writeback'leri

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W2-03'ün tek amacı generator guardrail setini fail-closed hale getirmektir:

- Generated output manual edit guard negatif testle kanıtlanır.
- Forbidden stack guard SDK templates ve generated output üzerinde çalışır.
- Missing test no-go guard test dosyası olmayan generated module'ü reddeder.
- Aynı input ile byte-stable generator output kanıtlanır.
- Guardrail sonuçları developer workflow'e makine-okunur rapor olarak bağlanır.
- `dx-cli` yalnız guardrail/dry-run enforcement bağıyla trace edilir; domain feature generation başlatılmaz.

## Non-Goal

W2-03 şunları yapmaz:

- Customer, OrderOps, Inventory veya herhangi bir domain vertical slice üretmez.
- App-core/module template kapsamını yeni feature davranışıyla genişletmez.
- Marketplace publication, module signing, app-store packaging veya runtime plugin loading başlatmaz.
- Guardrail fail'lerini warning'e çevirmez veya override ile yeşile boyamaz.
- Generated output'a nondeterministic timestamp/random/order-dependent içerik eklemez.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız W2-02 evidence kapandıktan sonra kullanır:

```text
Görev: W2-03 SDK Generator Guardrails.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/sdk-generator-guardrails
WBS nodes: be-sdk, dx-cli, dx-workflow
Prerequisite: W2-02 verified evidence in actionplan.

Amaç:
1. Generated output manual edit guard'ını fail-closed yap ve negatif testle kanıtla.
2. Forbidden stack guard'ını SDK templates ve generated output fixture üzerinde çalıştır.
3. Missing test no-go guard'ını test dosyası olmayan generated module için kırmızı yap.
4. Generator output'unun aynı input ile byte-stable olduğunu kanıtla.
5. Guardrail sonuçlarını developer workflow'e makine-okunur rapor/dry-run output olarak bağla.
6. dx-cli için yalnız guardrail enforcement ve dry-run diff bağlantısını ekle; domain feature generation üretme.
7. PR/CI/test evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W2-02 evidence yoksa kod yazma; blocker raporu üret.
- Customer/OrderOps/Inventory domain code, API, UI, seed veya e2e başlatma.
- Guardrail fail'lerini warning, skip, allowlist bypass veya manual override ile geçirme.
- Missing-test no-go guard'ını yalnız happy path snapshot'a bağlama; negatif test şart.
- Forbidden stack guard kapsamını yalnız package.json taramasına indirgeme; template/generated fixture da taranır.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W2-01 ve W2-02 evidence referansları
- mevcut generator/manual-edit guard/forbidden-stack/missing-test guard durumu
- packages/sdk/templates/app-core ve packages/sdk/templates/module verified writeback durumu
- dx-cli dry-run diff veya guardrail report var/yok durumu
- Customer/OrderOps/Inventory domain code'a dokunulmadığını gösteren diff note

Beklenen minimum değişiklikler:
- packages/sdk/src/generator.ts
- packages/sdk/src/guardrails/manual-edit.ts
- packages/sdk/src/guardrails/forbidden-stack.ts
- packages/sdk/src/guardrails/test-contract.ts
- packages/sdk/src/guardrails/report.ts
- packages/sdk/tests/generator-guardrails.test.ts
- packages/sdk/tests/generated-output-guard.test.ts
- packages/sdk/tests/forbidden-stack.test.ts
- packages/sdk/tests/missing-test-no-go.test.ts
- packages/sdk/tests/byte-stable-output.test.ts
- packages/sdk/tests/fixtures/generator-guardrails/

Test-first sıra:
1. Manual edit guard negatif testi önce kırmızı olur.
2. Forbidden stack negatif testi template ve generated fixture üzerinde kırmızıdan yeşile döner.
3. Missing test no-go testi test dosyası olmayan generated module'ü reddeder.
4. Byte-stable output testi aynı input iki kez çalışınca aynı dosya ağacını üretir.
5. Guardrail report/dry-run output makine-okunur ve deterministik olur.
6. Guardrail happy path app-core + module template output'unu kabul eder.
7. Domain code eklenmediği diff note ile kanıtlanır.

Zorunlu doğrulama:
pnpm --filter @platform/sdk run test -- generator-guardrails
pnpm --filter @platform/sdk run test -- generated-output-guard forbidden-stack missing-test-no-go

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- manual-edit guard negative test logu
- forbidden stack negative test logu
- missing-test no-go test logu
- byte-stable output test logu
- guardrail report/dry-run output ref'i
- domain non-goal diff note
- rollback/smoke note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] W2-02 evidence actionplan'da doğrulandı.
- [ ] Branch `task/sdk-generator-guardrails` olarak açıldı.
- [ ] İlk commit kırmızı manual-edit, forbidden-stack veya missing-test no-go testi taşıyor.
- [ ] Manual edit guard fail-closed ve negatif testli.
- [ ] Forbidden stack guard template + generated fixture üzerinde çalışıyor.
- [ ] Missing test no-go guard test dosyası olmayan generated module'ü reddediyor.
- [ ] Byte-stable output testi var.
- [ ] Guardrail report/dry-run output deterministik.
- [ ] Domain feature, marketplace ve runtime plugin diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Manual edit guard negative test logu alındı.
- [ ] Forbidden stack negative test logu alındı.
- [ ] Missing test no-go test logu alındı.
- [ ] Byte-stable output test logu alındı.
- [ ] Guardrail report/dry-run output ref'i alındı.
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
      "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<generator-guardrails-test-log-ref>"
    ],
    "evidence": [
      "W2-03 SDK Generator Guardrails geçti: <github-actions-run-url>",
      "Manual edit guard negative testleri geçti: <test-log-ref>",
      "Forbidden stack negative testleri geçti: <test-log-ref>",
      "Missing test no-go testleri geçti: <test-log-ref>",
      "Byte-stable output testleri geçti: <test-log-ref>",
      "Rollback note: packages/sdk guardrail değişiklikleri revert edilebilir; domain feature, marketplace ve runtime plugin eklenmedi"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "generatorGuardrailEvidenceStatus": "verified",
      "queueStatus": "verified:W2-03"
    }
  },
  {
    "id": "dx-cli",
    "refs": [
      "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<dx-cli-guardrail-dry-run-log-ref>"
    ],
    "evidence": [
      "W2-03 dx-cli guardrail/dry-run enforcement geçti: <test-log-ref>",
      "Domain feature generation başlatılmadı: <diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "guardrailStatus": "verified",
      "queueStatus": "verified:W2-03"
    }
  },
  {
    "id": "dx-workflow",
    "refs": [
      "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "report:<guardrail-report-ref>"
    ],
    "evidence": [
      "W2-03 guardrail report developer workflow'e bağlandı: <guardrail-report-ref>",
      "Manual-edit, forbidden-stack ve missing-test no-go sonuçları makine-okunur raporda görünüyor"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "workflowEvidenceStatus": "verified:guardrails",
      "queueStatus": "verified:W2-03"
    }
  }
]
```

## W2-03 Done Kapısı

W2-03 ancak şu koşullarla kapanır:

- W2-02 evidence daha önce verified durumdadır.
- Manual edit guard fail-closed ve negatif testlidir.
- Forbidden stack guard SDK templates ve generated output fixture üzerinde geçer.
- Missing test no-go guard test dosyası olmayan generated module'ü reddeder.
- Generator output aynı input ile byte-stable olur.
- Guardrail report/dry-run output deterministik ve developer workflow'e bağlıdır.
- Customer, OrderOps, Inventory, marketplace runtime veya plugin loading code eklenmemiştir.
- `be-sdk`, `dx-cli` ve `dx-workflow` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W2-04 OrderOps Vertical Slice başlamaz.
