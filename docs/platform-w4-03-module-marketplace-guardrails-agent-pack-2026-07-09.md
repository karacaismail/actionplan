# W4-03 Module Marketplace Guardrails Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W4-03`
Branch: `task/module-marketplace-guardrails`
WBS node'ları: `dx-marketplace`, `std-ci-gates`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W4-02`

Bu belge product code üretmez. Amaç, W4-02 App Factory Release Train kanıtı kapandıktan sonra açılacak W4-03 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W4-03 yalnız şu kanıtlar geldikten sonra başlar:

- W3-07 enterprise DoD evidence pack verified
- W4-01 ready-to-code queue export verified
- W4-02 app factory release train verified
- Customer/OrderOps/Inventory manifest, capability/entitlement list ve compose config smoke evidence actionplan'a geri yazıldı

Bu kanıtlar yoksa W4-03 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W4-03'ün tek amacı module marketplace güvenlik kapılarını kanıtlamaktır:

- Module signing verification fail-closed çalışır.
- SBOM/provenance artifact zorunlu hale gelir.
- Permission diff report genişleyen izinleri insan onayına bağlar.
- Sandbox/no-egress testleri ağ/dosya/process default-deny sınırlarını kanıtlar.
- `tools/check-module-marketplace-security.mjs` CI gate olarak imza, SBOM, permission diff ve sandbox invariantlarını bloklar.

## Non-Goal

W4-03 şunları yapmaz:

- Public marketplace launch, ticari app store, ödeme, komisyon veya storefront işi başlatmaz.
- Sandbox default-deny politikasını gevşetmez.
- AI'ın module yüklemesine, izin onaylamasına, karantina kaldırmasına veya sandbox policy değiştirmesine izin vermez.
- Customer/OrderOps/Inventory regression matrix işini başlatmaz; bu W4-04 kapsamıdır.
- Evidence dashboard veya done-without-evidence blocker işini başlatmaz; bu W4-05 kapsamıdır.
- Operations runbook drill veya portfolio exit report üretmez.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W4-02 evidence kapandıktan sonra kullanır:

```text
Görev: W4-03 Module Marketplace Guardrails.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/module-marketplace-guardrails
WBS nodes: dx-marketplace, std-ci-gates
Prerequisite: W4-02 verified evidence in actionplan.

Amaç:
1. Module signing verification kapısını fail-closed hale getir.
2. SBOM/provenance artifact üretimini ve kontrolünü zorunlu kıl.
3. Permission diff report ile genişleyen izinleri ayrı insan onayına bağla.
4. Sandbox/no-egress testleriyle ağ/dosya/process default-deny politikasını kanıtla.
5. tools/check-module-marketplace-security.mjs CI gate'ini imza, SBOM, permission diff ve sandbox invariantlarını bloklayacak şekilde tamamla.
6. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W4-02 evidence yoksa kod yazma; blocker raporu üret.
- Public marketplace launch, commercial storefront, payment veya commission işi başlatma.
- AI module yükleyemez, izin veremez, karantina kaldıramaz, sandbox whitelist genişletemez.
- Sandbox default-deny politikasını gevşetme; yalnız onaylı whitelist test fixture'ı kullan.
- Regression matrix, evidence dashboard, operations drill veya portfolio exit report işi başlatma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W4-02 app factory release train evidence referansları
- mevcut packages/marketplace var/yok durumu
- mevcut signing verification var/yok durumu
- mevcut SBOM/provenance artifact var/yok durumu
- mevcut permission diff report var/yok durumu
- mevcut sandbox/no-egress testleri var/yok durumu
- AI approval/quarantine/sandbox-loosen path olmadığını gösteren note

Beklenen minimum değişiklikler:
- packages/marketplace/package.json
- packages/marketplace/src/signing.ts
- packages/marketplace/src/sbom-provenance.ts
- packages/marketplace/src/permission-diff.ts
- packages/marketplace/src/sandbox-policy.ts
- packages/marketplace/tests/module-security.test.ts
- packages/marketplace/tests/permission-diff.test.ts
- packages/marketplace/tests/sandbox-policy.test.ts
- tools/check-module-marketplace-security.mjs
- reports/marketplace/signing-verification.md
- reports/marketplace/sbom-provenance.md
- reports/marketplace/permission-diff.md
- reports/marketplace/sandbox-no-egress.md
- reports/marketplace/module-marketplace-guardrails-summary.md

Test/evidence-first sıra:
1. İmzasız/geçersiz imzalı module install/update önce kırmızı negatif testle reddedilir.
2. SBOM/provenance eksikliği CI gate'i kırar.
3. Permission diff yeni/genişleyen izinleri insan onayı olmadan geçirmez.
4. Sandbox ağ/dosya/process default-deny no-egress negatif testleri geçer.
5. AI approval/quarantine-lift/sandbox-loosen path'i olmadığını test veya static gate kanıtlar.
6. Public marketplace launch veya commercial storefront diff'i olmadığını diff note ile kanıtla.

Zorunlu doğrulama:
node tools/check-module-marketplace-security.mjs
pnpm --filter @platform/marketplace run test -- module-security permission-diff sandbox-policy

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- signing verification log
- SBOM/provenance artifact
- permission diff report
- sandbox/no-egress test log
- module marketplace security gate log
- public marketplace/commercial storefront non-goal diff note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W4-02 evidence actionplan'da doğrulandı.
- [ ] Branch `task/module-marketplace-guardrails` olarak açıldı.
- [ ] Module signing verification fail-closed negatif testleri var.
- [ ] SBOM/provenance artifact zorunlu.
- [ ] Permission diff genişleyen izinleri insan onayına bağlıyor.
- [ ] Sandbox/no-egress testleri ağ/dosya/process default-deny politikasını kanıtlıyor.
- [ ] `tools/check-module-marketplace-security.mjs` imza, SBOM, permission diff ve sandbox invariantlarını blokluyor.
- [ ] AI module load/permission approve/quarantine lift/sandbox loosen path'i yok.
- [ ] Public marketplace launch veya commercial storefront diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Signing verification logu alındı.
- [ ] SBOM/provenance artifact alındı.
- [ ] Permission diff report alındı.
- [ ] Sandbox/no-egress test logu alındı.
- [ ] Module marketplace security gate logu alındı.
- [ ] Public marketplace/commercial storefront non-goal diff note yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "dx-marketplace",
    "refs": [
      "docs/platform-w4-03-module-marketplace-guardrails-agent-pack-2026-07-09.md",
      "docs/marketplace-module-security-directive.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<module-marketplace-guardrails-summary-ref>"
    ],
    "evidence": [
      "W4-03 Module Marketplace Guardrails geçti: <github-actions-run-url>",
      "Signing verification fail-closed kanıtlandı: <signing-verification-log-ref>",
      "SBOM/provenance artifact alındı: <sbom-provenance-ref>",
      "Permission diff genişleyen izinleri onaya bağladı: <permission-diff-report-ref>",
      "Sandbox/no-egress negatif testleri geçti: <sandbox-no-egress-log-ref>",
      "AI module load/permission approve/quarantine lift/sandbox loosen path'i yok: <non-goal-diff-note-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "marketplaceGuardrailStatus": "verified",
      "moduleSigningEvidenceStatus": "verified",
      "sbomProvenanceStatus": "verified",
      "permissionDiffStatus": "verified",
      "sandboxNoEgressStatus": "verified",
      "queueStatus": "verified:W4-03"
    }
  },
  {
    "id": "std-ci-gates",
    "refs": [
      "docs/platform-w4-03-module-marketplace-guardrails-agent-pack-2026-07-09.md",
      "tools/check-module-marketplace-security.mjs",
      "report:<module-marketplace-security-gate-log-ref>"
    ],
    "evidence": [
      "tools/check-module-marketplace-security.mjs signing/SBOM/permission-diff/sandbox invariantlarını blokluyor: <gate-log-ref>"
    ],
    "traceability": {
      "marketplaceSecurityGateStatus": "verified",
      "queueStatus": "verified:W4-03"
    }
  }
]
```

## W4-03 Done Kapısı

W4-03 ancak şu koşullarla kapanır:

- W4-02 evidence daha önce verified durumdadır.
- Module signing verification fail-closed çalışır.
- SBOM/provenance artifact zorunludur.
- Permission diff report genişleyen izinleri insan onayına bağlar.
- Sandbox/no-egress testleri default-deny politikasını kanıtlar.
- `node tools/check-module-marketplace-security.mjs` geçer.
- `pnpm --filter @platform/marketplace run test -- module-security permission-diff sandbox-policy` geçer.
- Public marketplace launch, commercial storefront, payment veya sandbox gevşetme işi eklenmemiştir.
- `dx-marketplace` ve `std-ci-gates` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W4-04 Portfolio Regression Matrix başlamaz.
