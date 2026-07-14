# PR-07 Capability Registry Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `PR-07`
Branch: `task/k-capability-registry`
WBS node'u: `k-capability`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-06`

Bu belge product code üretmez. Amaç, PR-06 Audit Envelope kanıtı kapandıktan sonra açılacak PR-07 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-07 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-04 event/outbox durability verified evidence
- PR-05 ECA runtime guard verified evidence
- PR-06 append-only audit + tamper detection verified evidence
- `l1-audit` actionplan writeback'i

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-07'nin tek amacı module registry + manifest validation + capability/entitlement contract kurmaktır:

- Valid module manifest register olur.
- Duplicate slug deterministik hata üretir.
- Invalid manifest ve forbidden permission diff reddedilir.
- Capability/entitlement resolver fail-closed davranır.
- Module healthz platform `/healthz`'den ayrı raporlanır.
- Entitlement decision audit-compatible fields taşır.

## Non-Goal

PR-07 şunları yapmaz:

- Marketplace security, signing, SBOM veya sandbox guardrail başlatmaz.
- App store UI veya marketplace UI yazmaz.
- Customer app-core veya domain route/menu üretmez.
- SDK generator/template tüketimi veya app/module generation başlatmaz.
- Billing/pricing/plan management ürünü yazmaz.
- Module code execution veya dynamic plugin runtime açmaz.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-06 evidence kapandıktan sonra kullanır:

```text
Görev: PR-07 Capability Registry.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/k-capability-registry
WBS nodes: k-capability
Prerequisite: PR-01 CI baseline, PR-02 tenant context, PR-03 Authz/PDP, PR-04 Event/Outbox, PR-05 ECA Runtime, PR-06 Audit Envelope evidence verified in actionplan.

Amaç:
1. Module registry register/list/health contract kur.
2. Module manifest schema, slug ve permission declarations tanımla.
3. Duplicate slug, invalid manifest ve forbidden permission diff negatif testlerini kur.
4. Capability/entitlement resolver fail-closed davranışını test et.
5. Capability olmadan route/menu/API visibility kapalı kalacak contract üret.
6. Entitlement decision audit-compatible fields taşısın.

Mutlak sınırlar:
- PR-06 evidence yoksa kod yazma; blocker raporu üret.
- Marketplace security, signing, SBOM, sandbox veya app-store UI yazma.
- Customer app-core/domain route/menu başlatma.
- SDK generator/template veya app/module generation başlatma.
- Billing/pricing/plan management ürünü yazma.
- Dynamic plugin runtime veya module code execution açma.
- Registry/capability negatif testlerini silme, zayıflatma veya yalnız happy-path register ile geçirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-06 evidence referansları
- registry/module_manifest/capability/entitlement/module health arama sonucu
- mevcut /healthz endpoint'inin module registry healthz kanıtı olmadığını not et
- tenancy/authz/PDP/audit dependency referanslarını göster

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/registry.py veya repo yapısına uygun AppModule registry modülü
- apps/api/src/meta_api/module_manifest.py veya repo yapısına uygun manifest schema modülü
- apps/api/src/meta_api/capabilities.py veya repo yapısına uygun capability/entitlement resolver modülü
- apps/api/tests/test_module_manifest.py
- apps/api/tests/test_module_registry.py
- apps/api/tests/test_entitlement_gate.py
- apps/api/tests/test_capability_entitlements.py

Test-first sıra:
1. Valid module manifest registers.
2. Duplicate module slug is rejected deterministically.
3. Invalid manifest is rejected.
4. Forbidden permission diff is rejected.
5. Capability/entitlement resolver fails closed.
6. Module healthz is separate from platform /healthz.
7. Entitlement decision includes audit-compatible fields.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_module_manifest.py tests/test_module_registry.py tests/test_entitlement_gate.py tests/test_capability_entitlements.py

Çıkış:
- PR URL
- CI run URL
- manifest validation test logu
- duplicate slug negative test logu
- entitlement gate test logu
- module healthz test logu
- rollback note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-06 evidence actionplan'da doğrulandı.
- [ ] Branch `task/k-capability-registry` olarak açıldı.
- [ ] İlk commit kırmızı duplicate slug veya invalid manifest testi taşıyor.
- [ ] Valid manifest register testi var.
- [ ] Duplicate slug negatif testi var.
- [ ] Invalid manifest ve forbidden permission diff testleri var.
- [ ] Entitlement resolver fail-closed testi var.
- [ ] Module healthz platform `/healthz`'den ayrı testleniyor.
- [ ] Entitlement decision audit-compatible fields taşıyor.
- [ ] Marketplace, Customer app-core, SDK generator ve dynamic plugin runtime diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Manifest validation test logu alındı.
- [ ] Duplicate slug negative test logu alındı.
- [ ] Entitlement gate test logu alındı.
- [ ] Module healthz test logu alındı.
- [ ] Merge commit SHA alındı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "k-capability",
  "refs": [
    "docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<capability-registry-test-log-ref>"
  ],
  "evidence": [
    "PR-07 Capability Registry geçti: <github-actions-run-url>",
    "Valid manifest register ve duplicate slug negative testleri geçti: <test-log-ref>",
    "Invalid manifest ve forbidden permission diff testleri geçti: <test-log-ref>",
    "Entitlement resolver fail-closed testi geçti: <test-log-ref>",
    "Module healthz platform /healthz'den ayrı kanıtlandı: <test-log-ref>",
    "Rollback note: registry/capability wiring revert edilebilir; marketplace/Customer/SDK generator kodu eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "queueStatus": "verified:PR-07"
  }
}
```

## PR-07 Done Kapısı

PR-07 ancak şu koşullarla kapanır:

- PR-01..PR-06 evidence daha önce verified durumdadır.
- Valid module manifest register olur.
- Duplicate slug, invalid manifest ve forbidden permission diff reddedilir.
- Capability/entitlement resolver fail-closed davranır.
- Module healthz platform `/healthz`'den ayrı raporlanır.
- Entitlement decision audit-compatible fields taşır.
- `k-capability` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-08 DB Schema/Migrations başlamaz.
