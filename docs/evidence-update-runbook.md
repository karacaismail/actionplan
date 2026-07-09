# Kanıt Güncelleme Runbook — evidence-update-runbook

Durum: Kanonik
Şema uyumu: `src/schemas/task.ts`

Bu runbook, bir geliştirme görevi tamamlandıktan sonra kanıtın actionplan'a geri yazılması için izlenecek tek prosedürdür.
actionplan'daki Done Evidence kapısı, bu runbook tamamlanmadan bir görevi `done` saymaz.

## Ne Zaman Uygulanır

Bu runbook yalnızca şu iki koşul birlikte karşılandıktan sonra başlatılır:

1. Implementation PR'ı main branch'e merge edildi.
2. Deploy veya staging doğrulaması tamamlandı; kritik akış çalışıyor.

Merge sonrası ancak deploy/doğrulama öncesi kanıt yazma. Deploy doğrulanmadan yazılan kanıt gerçeği yansıtmaz.

## Kim Yapar

Birincil sorumlu: görevi yürüten insan geliştirici.

AI ajan kanıt taslağı ve JSON patch önerebilir. İnsan incelemesi olmadan actionplan verisi güncellenmez.

## Hangi Dosya Güncellenir

Kanonik node dosyası:

```text
src/data/generated/nodes/<task-id>.json
```

Güncellemeden sonra reindex çalıştırılır:

```bash
npm run gen:reindex
```

Bu komut `public/data/nodes.json`, `src/data/generated/index.json`, `navigation.json` ve ilgili aggregate dosyaları günceller.

## Ne Yazılır

Gerçek şema alanları şunlardır:

- `refs`: `string[]`
- `evidence`: `string[]`
- `traceability.repoPath`: `string[]`
- `traceability.testCommand`: `string[]`
- `traceability.deployTarget`: `string | null`
- `traceability.implementationStatus`: `not-started | scaffolded | in-progress | implemented | verified`
- `schedule.actualStart`, `schedule.actualEnd`: `YYYY-MM-DD`

### refs

PR, merge commit, CI run ve rapor URL'leri string olarak yazılır.

```json
"refs": [
  "docs/task-to-code-contract.md",
  "pr:https://github.com/<org>/<repo>/pull/<pr-number>",
  "commit:<merge-commit-sha>",
  "ci:https://github.com/<org>/<repo>/actions/runs/<run-id>",
  "test-report:https://github.com/<org>/<repo>/actions/runs/<run-id>#artifacts"
]
```

Mevcut kanonik doküman referanslarını silme; yeni kanıt referanslarını sona ekle.

### evidence

Her acceptance criterion için doğrulanabilir kanıt string'i yazılır. "Geçti" tek başına yeterli değildir; test dosyası, test adı, CI URL'si veya rapor yolu olmalıdır.

```json
"evidence": [
  "AC-1 geçti: tests/unit/test_customer_graphql.py::test_customer_list_returns_paginated; ci:https://github.com/<org>/<repo>/actions/runs/<run-id>",
  "AC-2 geçti: tests/unit/test_customer_graphql.py::test_tenant_isolation_enforced; ci:https://github.com/<org>/<repo>/actions/runs/<run-id>",
  "rollback geçti: alembic downgrade head-1 + re-upgrade; log:artifacts/rollback-customer-graphql.txt"
]
```

### traceability

Kodun implementation reposundaki konumu, test komutu ve deploy hedefi yazılır.

```json
"traceability": {
  "repoPath": [
    "apps/customer/src/graphql/resolvers/customer_resolver.py",
    "tests/unit/test_customer_graphql.py"
  ],
  "testCommand": [
    "pytest tests/unit/test_customer_graphql.py tests/integration/test_customer_create.py -v --tb=short"
  ],
  "deployTarget": "staging/customer",
  "implementationStatus": "verified"
}
```

`repoPath` URL değil, implementation reposu içindeki yoldur. Repo URL'si onboarding/org kurulumundan gelir.

### schedule

Gerçek başlangıç ve bitiş tarihleri yazılır.

```json
"schedule": {
  "start": "2026-10-12",
  "end": "2026-10-26",
  "actualStart": "2026-10-13",
  "actualEnd": "2026-10-24",
  "baselineStart": "2026-10-12",
  "baselineEnd": "2026-10-26"
}
```

`actualEnd`, doğrulamanın bittiği tarihtir; yalnız merge tarihi değildir.

## Faz ve Status Güncellemesi

Kod merge edildi ama deploy/kanıt tamamlanmadıysa:

- `traceability.implementationStatus = "implemented"`
- `status` hâlâ `in-progress` veya `review` kalabilir.
- `evidence[]` eksikse `done` yapma.

Deploy/doğrulama ve kanıt tamamlandıysa:

- `traceability.implementationStatus = "verified"`
- `phases.verification.status = "passed"`
- `phases.verification.passed = true`
- `status = "done"` yalnız bu koşullardan sonra yazılır.

## Nasıl Yazılır

1. actionplan reposunda branch aç.
2. `src/data/generated/nodes/<task-id>.json` dosyasını düzenle.
3. `refs[]`, `evidence[]`, `traceability`, `schedule.actualStart/actualEnd` alanlarını gerçek kanıtla güncelle.
4. `npm run gen:reindex` çalıştır.
5. Evidence writeback doğrulama zincirini çalıştır:
   `npm run qa:data`, `npm run qa:exec`, `npm run qa:ready`, `npm run qa:waterfall`,
   `npm run qa:content`, `npm run qa:dimensions`, `npm run qa:vibecoding`,
   `node tools/agents/check-secrets.mjs`, `npm run qa:ci`.
6. Commit ve PR aç.
7. CI yeşil + insan onayı sonrası merge et.

Main'e doğrudan push normal akışta yasaktır. Yalnız repo sahibi bilinçli bypass kararı verirse yapılır.

## Örnek JSON Patch

```json
{
  "id": "platform-customer-graphql",
  "refs": [
    "docs/task-to-code-contract.md",
    "docs/core-contract-pack.md",
    "pr:https://github.com/org/platform/pull/47",
    "commit:a3f9c2d1b8e4f0123456789abcdef0123456789a",
    "ci:https://github.com/org/platform/actions/runs/11234567890"
  ],
  "evidence": [
    "AC-1 geçti: tests/unit/test_customer_graphql.py::test_customer_list_tenant_filter; ci:https://github.com/org/platform/actions/runs/11234567890",
    "AC-2 geçti: tests/unit/test_customer_graphql.py::test_customer_list_cross_tenant_forbidden; ci:https://github.com/org/platform/actions/runs/11234567890",
    "AC-3 geçti: tests/integration/test_customer_create.py::test_idempotency_key_dedup; ci:https://github.com/org/platform/actions/runs/11234567890",
    "rollback geçti: alembic downgrade head-1 + re-upgrade; log:artifacts/rollback-customer-graphql.txt"
  ],
  "traceability": {
    "repoPath": [
      "apps/customer/src/graphql/resolvers/customer_resolver.py",
      "tests/unit/test_customer_graphql.py"
    ],
    "testCommand": [
      "pytest tests/unit/test_customer_graphql.py tests/integration/test_customer_create.py -v --tb=short"
    ],
    "deployTarget": "staging/customer",
    "implementationStatus": "verified"
  },
  "schedule": {
    "actualStart": "2026-10-13",
    "actualEnd": "2026-10-24"
  }
}
```

## Kontrol Listesi

- [ ] PR merge edildi.
- [ ] CI/deploy/doğrulama çıktı URL veya dosya yolu olarak mevcut.
- [ ] `refs[]` içine PR, commit ve CI referansı eklendi.
- [ ] `evidence[]` içinde her AC için test/rapor/log referansı var.
- [ ] Rollback kanıtı yazıldı.
- [ ] `traceability.repoPath[]`, `testCommand[]`, `deployTarget`, `implementationStatus` güncellendi.
- [ ] `schedule.actualStart` ve `schedule.actualEnd` gerçek tarihlerle doldu.
- [ ] `npm run gen:reindex` çalıştı.
- [ ] Evidence writeback doğrulama zinciri yeşil: `qa:data`, `qa:exec`, `qa:ready`, `qa:waterfall`, `qa:content`, `qa:dimensions`, `qa:vibecoding`, `check-secrets`, `qa:ci`.
- [ ] Meta-framework implementation işleri için `docs/meta-framework-implementation-development-plan.md` içindeki `pr`, `commit`, `ci`, `test-log`, `deploy/smoke`, `rollback`, `manual-review` kanıt seti tamamlandı.

## Sık Hatalar

**Object yazmak:** `refs` ve `evidence` object değildir; string array'dir.

**Top-level implementationStatus yazmak:** Durum `traceability.implementationStatus` altındadır.

**Kanıtsız done yapmak:** `evidence[]` boşsa `status=done` yazma.

**public/data'yı elle düzenlemek:** Kanonik node dosyası `src/data/generated/nodes/<task-id>.json` altındadır; aggregate dosyalar `npm run gen:reindex` ile üretilir.
