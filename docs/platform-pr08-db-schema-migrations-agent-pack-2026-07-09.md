# PR-08 DB Schema/Migrations Agent Pack — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM yalnız ardıl koordinatördür. Platform erişimi
> `read-only-audit`, uygulama ise `human-developer-only`dır. Claude'u yalnız Codex
> sınırlı bir worker/slave görevi için çağırabilir.

Durum: docs-only human-developer execution handoff
Queue item: `PR-08`
Branch: `task/platform-db-schema-migrations`
WBS node'u: `platform-db-schema`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-07`

Bu belge product code üretmez. Amaç, PR-07 Capability Registry kanıtı kapandıktan sonra açılacak PR-08 işini yalnız insan geliştiriciye verilecek sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-08 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-04 event/outbox durability verified evidence
- PR-05 ECA runtime guard verified evidence
- PR-06 append-only audit verified evidence
- PR-07 module registry/capability entitlement verified evidence
- `k-capability` actionplan writeback'i

Bu kanıtlar yoksa execution paketi insan geliştirici kuyruğuna alınmaz; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-08'in tek amacı PostgreSQL DB layer + Alembic baseline + reversible migration policy kurmaktır:

- API DB layer tek PostgreSQL hedefiyle bağlanır.
- Alembic baseline config ve migration env oluşur.
- `upgrade()` ve `downgrade()` dolu ve testlidir.
- Empty DB ve existing DB migration path test edilir.
- Tenant-aware tablo convention, tenant id/index ve RLS veya schema strategy test edilir.
- Snapshot/rollback drill evidence formatı üretilir.

## Non-Goal

PR-08 şunları yapmaz:

- Customer schema, Customer domain table veya CRUD modeli başlatmaz.
- OrderOps, Inventory veya başka domain tablosu üretmez.
- Prisma, Supabase veya non-approved ORM eklemez.
- Data warehouse/reporting schema başlatmaz.
- Production data migration veya destructive migration çalıştırmaz.
- Full seed/demo data işine atlamaz.

## Human Developer Execution Packet

İnsan geliştirici aşağıdaki execution paketini `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-07 evidence kapandıktan sonra kullanır:

```text
Görev: PR-08 DB Schema/Migrations.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-db-schema-migrations
WBS nodes: platform-db-schema
Prerequisite: PR-01..PR-07 verified evidence in actionplan.

Amaç:
1. API DB engine/session boundary'yi PostgreSQL DATABASE_URL ile kur.
2. SQLAlchemy 2.0 veya SQLModel model base convention tanımla.
3. Alembic baseline config ve migrations/env.py wiring oluştur.
4. upgrade/downgrade round-trip testlerini kırmızıdan yeşile taşı.
5. Tenant-aware table convention, tenant_id/index ve RLS veya schema strategy testlerini kur.
6. Expand-contract migration policy ve rollback/snapshot note üret.

Mutlak sınırlar:
- PR-07 evidence yoksa kod yazma; blocker raporu üret.
- Customer/domain schema, CRUD model veya seed data başlatma.
- Prisma, Supabase veya yasak stack ekleme.
- Destructive production migration çalıştırma.
- Downgrade testi olmayan migration üretme.
- Tenant strategy etkisini test etmeden migration done iddiası yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01..PR-07 evidence referansları
- infra/docker-compose.yml PostgreSQL ve DATABASE_URL durumu
- apps/api/pyproject.toml DB/ORM/Alembic dependency durumu
- alembic.ini/migrations/env.py/model base arama sonucu
- mevcut API'nin DB'ye bağlanmadığını not et

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/db.py
- apps/api/src/meta_api/models/base.py
- apps/api/alembic.ini
- apps/api/migrations/env.py
- apps/api/tests/test_db_connection.py
- apps/api/tests/test_migration_baseline.py
- apps/api/tests/test_migration_rollback.py
- apps/api/tests/test_tenant_schema.py

Test-first sıra:
1. DB connection uses DATABASE_URL and fails clearly when absent.
2. Alembic baseline upgrade works on empty DB.
3. Alembic downgrade round-trip works.
4. Existing DB migration path is idempotent.
5. Tenant-aware table convention requires tenant_id and index.
6. RLS or schema-per-tenant strategy is represented in migration tests.
7. Destructive migration without rollback note is rejected by guard/test.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_db_connection.py tests/test_migration_baseline.py tests/test_migration_rollback.py tests/test_tenant_schema.py

Çıkış:
- PR URL
- CI run URL
- migration upgrade logu
- migration downgrade logu
- DB connection test logu
- tenant schema/RLS strategy test logu
- snapshot/rollback note
- manual-review note
```

## Human Developer Checklist

PR açmadan önce:

- [ ] PR-01..PR-07 evidence actionplan'da doğrulandı.
- [ ] Branch `task/platform-db-schema-migrations` olarak açıldı.
- [ ] İlk commit kırmızı migration rollback veya tenant schema testi taşıyor.
- [ ] DB connection testleri var.
- [ ] Alembic upgrade/downgrade round-trip testleri var.
- [ ] Empty DB ve existing DB migration path testleri var.
- [ ] Tenant-aware table convention testi var.
- [ ] RLS veya schema-per-tenant strategy test/gerekçe notu var.
- [ ] Customer/domain schema, Prisma/Supabase ve destructive production migration diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Migration upgrade logu alındı.
- [ ] Migration downgrade logu alındı.
- [ ] DB connection test logu alındı.
- [ ] Tenant schema/RLS strategy test logu alındı.
- [ ] Snapshot/rollback note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-db-schema",
  "refs": [
    "docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<db-migration-test-log-ref>"
  ],
  "evidence": [
    "PR-08 DB Schema/Migrations geçti: <github-actions-run-url>",
    "DB connection ve Alembic baseline upgrade testleri geçti: <test-log-ref>",
    "Alembic downgrade/rollback round-trip testleri geçti: <test-log-ref>",
    "Tenant-aware schema/RLS strategy testleri geçti: <test-log-ref>",
    "Snapshot/rollback note: <ref>",
    "Rollback note: migration baseline revert edilebilir; Customer/domain schema kodu eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "queueStatus": "verified:PR-08"
  }
}
```

## PR-08 Done Kapısı

PR-08 ancak şu koşullarla kapanır:

- PR-01..PR-07 evidence daha önce verified durumdadır.
- DB connection `DATABASE_URL` ile testlidir.
- Alembic baseline upgrade/downgrade round-trip geçer.
- Empty DB ve existing DB migration path testlidir.
- Tenant-aware table convention ve RLS/schema strategy testle kanıtlanır.
- Snapshot/rollback note vardır.
- `platform-db-schema` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-09 Observability başlamaz.
