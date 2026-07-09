# Platform DB Schema Readiness Gap — 2026-07-09

Durum: W0.9 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-db-schema`

Bu rapor implementation kodu üretmez. Amaç, W0.9 PostgreSQL schema/migration adımının gerçek checkout'taki durumunu belgelemek ve Alembic/tenant-aware migration başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` checkout'unda PostgreSQL `infra/docker-compose.yml` içinde vardır ve API container'a `DATABASE_URL` verilir. Ancak API kodu DB'ye bağlanmaz; `apps/api/pyproject.toml` içinde SQLAlchemy, SQLModel veya Alembic bağımlılığı yoktur. Alembic config, migration klasörü, model base ve upgrade/downgrade testleri yoktur.

Bu nedenle W0.9 için doğru durum "migration policy geliştirildi" değil, "DB/migration hedefleri ve reversible testleri belirlendi"dir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| PostgreSQL service | `infra/docker-compose.yml` içinde mevcut |
| API `DATABASE_URL` | Compose environment içinde mevcut |
| API DB bağlantısı | Yok |
| ORM bağımlılığı | SQLAlchemy/SQLModel yok |
| Migration bağımlılığı | Alembic yok |
| Migration klasörü/config | Yok |
| Upgrade/downgrade testi | Yok |
| Tenant-aware tablo testi | Yok |
| `platform-db-schema` durumu | `status=backlog`, `phase=requirements`, `implementationStatus=not-started` |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.9 product code başlatılamaz.
- W0.3 tenancy strategy netleşmeden tenant-aware schema üretilemez.
- `k-schema` dependency done değildir.
- Alembic dependency, migration config ve model base yoktur.
- Expand-contract ve downgrade testleri yoktur.
- RLS veya schema-per-tenant kararının migration etkisi kanıtlanmamıştır.
- Snapshot/rollback drill evidence formatı yazılmamıştır.

## W0.9 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/db.py` | DB engine/session boundary |
| `apps/api/src/meta_api/models/base.py` | SQLAlchemy/SQLModel base ve tenant-aware conventions |
| `apps/api/alembic.ini` | Alembic config |
| `apps/api/migrations/env.py` | Migration env, metadata ve DATABASE_URL wiring |
| `apps/api/tests/test_migrations.py` | upgrade/downgrade round-trip tests |
| `apps/api/tests/test_tenant_schema.py` | tenant_id/index/RLS veya schema strategy tests |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_migrations.py tests/test_tenant_schema.py
```

## Çıkış Eşiği

W0.9 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- Alembic upgrade/downgrade round-trip testleri geçer.
- Tenant-kapsamlı tablolarda tenant id ve uygun indeksler vardır.
- RLS veya schema-per-tenant stratejisi migration ile kanıtlanır.
- Expand-contract migration policy uygulanır.
- Rollback drill veya downgrade smoke evidence üretilir.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `platform-db-schema` refs listesine bu rapor eklenir.
- `platform-db-schema` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- `platform-tenancy` ve `k-schema` readiness tamamlanmadan migration development fazına alınmaz.
