# PR-03 Authz/PDP Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `PR-03`
Branch: `task/platform-authz-pdp`
WBS node'ları: `platform-authn-authz`, `k-authz`, `k-policy-pdp`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-02`

Bu belge product code üretmez. Amaç, PR-02 tenant context kanıtı kapandıktan sonra açılacak PR-03 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-03 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 merged PR URL
- PR-02 merge commit SHA
- PR-02 CI run URL
- PR-02 tenant context test logu
- PR-02 cross-tenant negative test evidence
- `platform-tenancy` ve `k-tenancy` actionplan writeback'i

Bu kanıtlar yoksa PR-03 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-03'ün tek amacı minimal identity + authorization decision contract kurmaktır:

- `ActorContext` tenant zarfıyla birlikte çalışır.
- `PolicyContext` request/resolver guard kararına taşınır.
- PDP decision sonucu `allow`, `deny`, `reason`, `policyRef`, `auditFields` taşır.
- Default-deny davranışı endpoint/resolver seviyesinde test edilir.
- Missing guard veya unknown permission merge'i bloklayan negatif testle yakalanır.

## Non-Goal

PR-03 şunları yapmaz:

- Customer domain, billing veya UI feature work başlatmaz.
- Event/outbox, ECA runtime veya audit log implementation yazmaz.
- Admin override, step-up approval veya delegated admin workflow'u başlatmaz.
- Full IAM ürünü, user management ekranı veya login UI üretmez.
- Authorization testlerini yalnız happy-path allow senaryosuyla yeşile boyamaz.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-02 evidence kapandıktan sonra kullanır:

```text
Görev: PR-03 Authz/PDP.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-authz-pdp
WBS nodes: platform-authn-authz, k-authz, k-policy-pdp
Prerequisite: PR-01 CI baseline verified; PR-02 tenant context merged + tenant isolation evidence verified in actionplan.

Amaç:
1. ActorContext sözleşmesini TenantContext ile birlikte kur.
2. PolicyContext ve PDP decision contract tanımla.
3. allow/deny/reason/policyRef/auditFields alanlarını deterministik yap.
4. Endpoint/resolver seviyesinde deny-by-default guard davranışını test et.
5. Missing guard, unknown permission ve cross-tenant permission bypass denemelerini negatif testle yakala.
6. Audit implementation yazmadan audit-compatible decision fields üret.

Mutlak sınırlar:
- PR-02 evidence yoksa kod yazma; blocker raporu üret.
- Customer/domain/billing/UI/login ekranı başlatma.
- Event/outbox, ECA runtime, audit log implementation veya capability registry koduna dokunma.
- Admin override, step-up approval veya delegated admin workflow başlatma.
- Next.js, Supabase, Prisma, Redux, Flowbite ekleme.
- Authz/PDP negatif testlerini silme, zayıflatma veya yalnız allow happy-path ile geçirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01 ve PR-02 evidence referansları
- mevcut API entrypoint ve GraphQL resolver durumu
- authn/authz/pdp/token/permission/guard arama sonucu
- mevcut test dosyaları ve eksik negative-suite listesi

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/authn.py veya repo yapısına uygun ActorContext modülü
- apps/api/src/meta_api/authz.py veya repo yapısına uygun guard/default-deny modülü
- apps/api/src/meta_api/pdp.py veya repo yapısına uygun PDP decision contract modülü
- apps/api/src/meta_api/app.py içinde endpoint/resolver guard wiring
- apps/api/tests/test_actor_context.py
- apps/api/tests/test_policy_decision.py
- apps/api/tests/test_authz_deny_default.py

Test-first sıra:
1. Anonymous request is rejected.
2. Authenticated actor without permission is denied.
3. Unknown permission is denied by default.
4. Missing resolver/endpoint guard fails a test.
5. Policy decision includes allow/deny/reason/policyRef/auditFields.
6. Actor cannot use permission outside tenant scope.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_actor_context.py tests/test_policy_decision.py tests/test_authz_deny_default.py

Çıkış:
- PR URL
- CI run URL
- deny-by-default test logu
- PDP golden decision fixture
- audit-compatible deny trace note
- rollback note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] PR-01 ve PR-02 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-authz-pdp` olarak açıldı.
- [ ] İlk commit kırmızı default-deny veya missing-guard testi taşıyor.
- [ ] Anonymous request 401/403 testleniyor.
- [ ] Permission yoksa deny testleniyor.
- [ ] Unknown permission default-deny testleniyor.
- [ ] Missing guard negatif testi var.
- [ ] PDP decision fixture `allow/deny/reason/policyRef/auditFields` taşıyor.
- [ ] Customer, billing, UI, event/outbox, ECA ve audit implementation diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Deny-by-default test logu alındı.
- [ ] PDP golden decision fixture alındı.
- [ ] Audit-compatible deny trace note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-authn-authz",
  "refs": [
    "docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<authz-pdp-test-log-ref>"
  ],
  "evidence": [
    "PR-03 Authz/PDP geçti: <github-actions-run-url>",
    "Anonymous/unauthorized/default-deny testleri geçti: <test-log-ref>",
    "Missing guard negative test geçti: <test-log-ref>",
    "PDP golden decision fixture üretildi: <fixture-ref>",
    "Rollback note: authz/PDP wiring revert edilebilir; Customer/domain/UI kodu eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "queueStatus": "verified:PR-03"
  }
}
```

```json
{
  "id": "k-authz",
  "refs": [
    "docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "ci:<github-actions-run-url>",
    "test:<deny-by-default-test-log-ref>"
  ],
  "evidence": [
    "Deny-by-default authorization matrix kanıtlandı: <test-log-ref>",
    "Permission yokken deny ve unknown permission deny testleri geçti: <test-log-ref>",
    "Tenant scope dışı permission bypass reddedildi: <test-log-ref>"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "authzEvidenceStatus": "verified"
  }
}
```

```json
{
  "id": "k-policy-pdp",
  "refs": [
    "docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "ci:<github-actions-run-url>",
    "fixture:<pdp-golden-decision-ref>"
  ],
  "evidence": [
    "PDP decision contract allow/deny/reason/policyRef/auditFields alanlarıyla kanıtlandı: <fixture-ref>",
    "Deterministik policy decision testleri geçti: <test-log-ref>",
    "Audit-compatible deny trace note yazıldı: <ref>"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "pdpEvidenceStatus": "verified"
  }
}
```

## PR-03 Done Kapısı

PR-03 ancak şu koşullarla kapanır:

- PR-01 ve PR-02 evidence daha önce verified durumdadır.
- Anonymous/unauthorized request deny edilir.
- Unknown permission default-deny davranır.
- Missing guard negatif testle yakalanır.
- PDP decision sonucu deterministik ve audit-compatible alanlar taşır.
- Actor tenant scope dışındaki permission'ı kullanamaz.
- `platform-authn-authz`, `k-authz` ve `k-policy-pdp` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-04 Event/Outbox başlamaz.
