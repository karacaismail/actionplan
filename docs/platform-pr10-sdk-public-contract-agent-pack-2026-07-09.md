# PR-10 SDK Public Contract Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `PR-10`
Branch: `task/be-sdk-public-contract`
WBS node'ları: `be-sdk`, `dx-cli`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-09`

Bu belge product code üretmez. Amaç, PR-09 Observability kanıtı kapandıktan sonra açılacak PR-10 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-10 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-04 event/outbox durability verified evidence
- PR-05 ECA runtime guard verified evidence
- PR-06 append-only audit verified evidence
- PR-07 module registry/capability entitlement verified evidence
- PR-08 DB/Alembic migration + rollback verified evidence
- PR-09 health/ready/metrics/trace/logging verified evidence
- `platform-observability` actionplan writeback'i

Bu kanıtlar yoksa PR-10 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-10'un tek amacı SDK public contract ve deterministik codegen guard tabanını kurmaktır:

- `packages/sdk` workspace'e eklenir.
- Public contract kaynağı tek, versiyonlu ve geriye dönük uyumluluk testlidir.
- Public SDK API dar, açık export'lu ve snapshot testlidir.
- Codegen aynı input ile byte-stable output üretir.
- Generated output dosyaları manual edit guard ile korunur.
- Forbidden stack policy SDK contract/codegen/templates yolunda test edilir.
- `dx-cli` yalnız bu public contract/codegen guard bağıyla trace edilir; full CLI işi başlatılmaz.

## Non-Goal

PR-10 şunları yapmaz:

- Full generator CLI veya `create-module` komutu üretmez.
- App-core/module production template, app scaffold veya domain template başlatmaz.
- Customer CRUD, OrderOps, Inventory veya herhangi bir domain slice üretmez.
- Marketplace/app-store packaging, plugin runtime veya dynamic module loading başlatmaz.
- GraphQL/API runtime davranışını PR-03..PR-09 sınırları dışında genişletmez.
- Generated output guard testini zayıflatıp elle düzenlenen dosyaları kabul etmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-09 evidence kapandıktan sonra kullanır:

```text
Görev: PR-10 SDK Public Contract.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/be-sdk-public-contract
WBS nodes: be-sdk, dx-cli
Prerequisite: PR-01..PR-09 verified evidence in actionplan.

Amaç:
1. packages/sdk workspace paketini dar public API ile ekle.
2. SDK public contract source'u tek ve versiyonlu hale getir.
3. Contract compatibility ve public API snapshot testlerini kırmızıdan yeşile taşı.
4. Deterministic codegen'i aynı input ile byte-stable output üretecek şekilde kur.
5. Generated output header/manual-edit guard testlerini ekle.
6. Forbidden stack policy testlerini SDK/codegen yüzeyine bağla.
7. dx-cli için yalnız public contract/codegen guard bağlantısını kaydet; full CLI üretme.

Mutlak sınırlar:
- PR-09 evidence yoksa kod yazma; blocker raporu üret.
- Full generator CLI, create-module komutu, app/module production template veya Customer/domain CRUD başlatma.
- Generated dosyaları elle düzenlenebilir bırakma.
- Nondeterministic timestamp/random/order-dependent codegen output üretme.
- Public API snapshot testini güncelleyerek kırılımı gizleme; önce backward compatibility gerekçesi yaz.
- Yasak stack paketlerini SDK package veya template fixture içine ekleme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-09 evidence referansları
- workspace package manager ve package.json/pnpm workspace durumu
- packages/sdk var/yok durumu
- mevcut API contract kaynağı arama sonucu
- codegen/manual-edit guard/forbidden-stack testlerinin yokluğu

Beklenen minimum değişiklikler:
- packages/sdk/package.json
- packages/sdk/src/contracts.ts
- packages/sdk/src/codegen.ts
- packages/sdk/src/index.ts
- packages/sdk/src/generated-header.ts
- packages/sdk/tests/public-api.test.ts
- packages/sdk/tests/codegen.test.ts
- packages/sdk/tests/generated-output-guard.test.ts
- packages/sdk/tests/forbidden-stack.test.ts

Test-first sıra:
1. Public API snapshot testi önce kırmızı olur.
2. Contract source version ve compatibility testi kırmızıdan yeşile döner.
3. Codegen deterministic output testi aynı input ile byte-stable sonucu kanıtlar.
4. Manual-edit guard generated header olmayan output'u reddeder.
5. Forbidden stack guard yasak paketleri SDK/codegen/template fixture içinde reddeder.
6. Public export yüzeyi narrow kalır ve internal dosyaları export etmez.
7. dx-cli bağlantısı yalnız contract/guard evidence olarak kalır; CLI generator üretilmez.

Zorunlu doğrulama:
pnpm --filter @platform/sdk run test
pnpm --filter @platform/sdk run test -- codegen public-api

Çıkış:
- PR URL
- CI run URL
- SDK public API snapshot test logu
- deterministic codegen test logu
- generated output manual-edit guard test logu
- forbidden stack guard test logu
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] PR-01..PR-09 evidence actionplan'da doğrulandı.
- [ ] Branch `task/be-sdk-public-contract` olarak açıldı.
- [ ] İlk commit kırmızı public API snapshot, codegen veya guard testi taşıyor.
- [ ] `packages/sdk` workspace paketi dar public exports ile eklendi.
- [ ] Public contract source tek ve versiyonlu.
- [ ] Deterministic codegen byte-stable testleri var.
- [ ] Generated output manual-edit guard testleri var.
- [ ] Forbidden stack guard SDK/codegen yüzeyine bağlı.
- [ ] `dx-cli` için yalnız public contract/codegen guard bağlantısı var.
- [ ] Full generator CLI, app/module production template ve Customer/domain diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] SDK public API snapshot test logu alındı.
- [ ] Deterministic codegen test logu alındı.
- [ ] Generated output manual-edit guard test logu alındı.
- [ ] Forbidden stack guard test logu alındı.
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
      "docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "test:<sdk-test-log-ref>"
    ],
    "evidence": [
      "PR-10 SDK Public Contract geçti: <github-actions-run-url>",
      "SDK public API snapshot testleri geçti: <test-log-ref>",
      "Deterministic codegen byte-stable testleri geçti: <test-log-ref>",
      "Generated output manual-edit guard testleri geçti: <test-log-ref>",
      "Forbidden stack guard testleri geçti: <test-log-ref>",
      "Rollback note: packages/sdk public contract/codegen change revert edilebilir; full generator CLI ve app templates eklenmedi"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "sdkEvidenceStatus": "verified",
      "queueStatus": "verified:PR-10"
    }
  },
  {
    "id": "dx-cli",
    "refs": [
      "docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>"
    ],
    "evidence": [
      "PR-10 dx-cli kapsamı yalnız SDK public contract/codegen guard bağı olarak doğrulandı; full CLI generator Wave 2'ye bırakıldı"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "guardrailStatus": "verified:contract-only",
      "queueStatus": "verified:PR-10"
    }
  }
]
```

## PR-10 Done Kapısı

PR-10 ancak şu koşullarla kapanır:

- PR-01..PR-09 evidence daha önce verified durumdadır.
- `packages/sdk` workspace paketi vardır.
- Public contract source tek, versiyonlu ve snapshot/compatibility testlidir.
- Codegen aynı input ile byte-stable output üretir.
- Generated output manual-edit guard geçer.
- Forbidden stack guard SDK/codegen yüzeyinde geçer.
- Full generator CLI, app/module production template ve Customer/domain code eklenmemiştir.
- `be-sdk` ve `dx-cli` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-11 Hello Platform Boot Smoke başlamaz.
