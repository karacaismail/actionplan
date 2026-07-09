# PR-02 Tenancy Context Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `PR-02`
Branch: `task/platform-tenancy-context`
WBS node'ları: `platform-tenancy`, `k-tenancy`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-01`

Bu belge product code üretmez. Amaç, PR-01 remote/CI baseline kanıtı kapandıktan sonra açılacak PR-02 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-02 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 merged PR URL
- PR-01 merge commit SHA
- PR-01 CI run URL
- Default branch evidence
- Branch protection / required checks evidence
- `platform-cicd` ve `platform-factory` actionplan writeback'i

Bu kanıtlar yoksa PR-02 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-02'nin tek amacı trusted tenant context tabanını kurmaktır:

- Request/job/event yolları tek `TenantContext` zarfına bağlanır.
- Client-provided tenant id'ye ham güven yasaklanır.
- Tenant yoksa veya geçersizse fail-closed davranış kanıtlanır.
- Cross-tenant read/write negatif testleri eklenir.
- Tenant strategy kararı `schema-per-tenant`, `RLS` veya hibrit olarak gerekçelendirilir.

## Non-Goal

PR-02 şunları yapmaz:

- Authz/PDP veya role/permission engine yazmaz.
- Customer domain, CRUD, GraphQL resolver veya UI başlatmaz.
- Event/outbox, ECA runtime, audit envelope veya capability registry işine atlamaz.
- DB migration mimarisini PR-08 kapsamı dışında büyütmez.
- Tenant testlerini sadece mock başarı senaryosuyla yeşile boyamaz.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-01 evidence kapandıktan sonra kullanır:

```text
Görev: PR-02 Tenancy Context.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-tenancy-context
WBS nodes: platform-tenancy, k-tenancy
Prerequisite: PR-01 merged + CI run URL + branch protection evidence verified in actionplan.

Amaç:
1. Trusted TenantContext sözleşmesini kur.
2. Request/job/event giriş yolları için tek context envelope tanımla.
3. Header/body tenant_id değerine ham güvenme; trusted boundary'yi açık kodla.
4. Missing/invalid tenant durumlarını fail-closed reddet.
5. Cross-tenant read/write negative testlerini kırmızıdan yeşile taşı.
6. Tenant strategy kararını RLS, schema-per-tenant veya hibrit olarak evidence note'a yaz.

Mutlak sınırlar:
- PR-01 evidence yoksa kod yazma; blocker raporu üret.
- Authz/PDP yazma; role/permission engine PR-03 kapsamıdır.
- Customer/domain/UI/GraphQL CRUD başlatma.
- Event/outbox, ECA, audit, capability registry veya SDK koduna dokunma.
- Next.js, Supabase, Prisma, Redux, Flowbite ekleme.
- Tenant isolation testlerini silme, zayıflatma veya yalnız happy-path mock ile geçirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01 evidence referansları
- mevcut API entrypoint ve test dosyaları
- tenant/tenancy/tenant_id/RLS arama sonucu
- mevcut DB/migration bağımlılığı durumu

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/tenancy.py veya repo yapısına uygun eşdeğer modül
- apps/api/src/meta_api/app.py içinde request path wiring
- apps/api/tests/test_tenant_context.py
- apps/api/tests/test_tenant_isolation.py
- Gerekiyorsa küçük test fixture/helper; domain modeli başlatmadan izolasyon kanıtı

Test-first sıra:
1. Missing tenant fails closed.
2. Invalid tenant fails closed.
3. Client-supplied raw tenant id cannot override trusted context.
4. Tenant A cannot read Tenant B data fixture.
5. Tenant A cannot write/update Tenant B data fixture.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_tenant_context.py tests/test_tenant_isolation.py

Çıkış:
- PR URL
- CI run URL
- test log
- tenant strategy note
- cross-tenant negative evidence
- rollback note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] PR-01 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-tenancy-context` olarak açıldı.
- [ ] İlk commit kırmızı tenant context/isolasyon testi taşıyor.
- [ ] Missing tenant fail-closed testi var.
- [ ] Invalid tenant fail-closed testi var.
- [ ] Client-supplied tenant override negatif testi var.
- [ ] Cross-tenant read/write negatif testi var.
- [ ] Authz/PDP, Customer, UI ve SDK diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Tenant strategy note alındı.
- [ ] Cross-tenant negative test logu alındı.
- [ ] Merge commit SHA alındı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-tenancy",
  "refs": [
    "docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<tenant-context-test-log-ref>"
  ],
  "evidence": [
    "PR-02 tenant context geçti: <github-actions-run-url>",
    "Missing/invalid tenant fail-closed testleri geçti: <test-log-ref>",
    "Cross-tenant read/write negatif testleri geçti: <test-log-ref>",
    "Tenant strategy: <RLS|schema-per-tenant|hybrid>; gerekçe:<ref>",
    "Rollback note: tenant context wiring revert edilebilir; Customer/domain/UI kodu eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "queueStatus": "verified:PR-02"
  }
}
```

```json
{
  "id": "k-tenancy",
  "refs": [
    "docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "ci:<github-actions-run-url>",
    "test:<tenant-isolation-test-log-ref>"
  ],
  "evidence": [
    "Trusted TenantContext zarfı request path üzerinde kanıtlandı: <test-log-ref>",
    "Client tenant override reddedildi: <test-log-ref>",
    "Tenant isolation negatif testleri geçti: <test-log-ref>"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "tenantEvidenceStatus": "verified"
  }
}
```

## PR-02 Done Kapısı

PR-02 ancak şu koşullarla kapanır:

- PR-01 evidence daha önce verified durumdadır.
- Tenant context olmayan istekler fail-closed reddedilir.
- Geçersiz tenant context reddedilir.
- Client-provided tenant id trusted boundary'yi override edemez.
- Cross-tenant read/write negatif testleri geçer.
- Tenant strategy gerekçesi actionplan'a yazılabilir durumdadır.
- `platform-tenancy` ve `k-tenancy` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-03 Authz/PDP başlamaz.
