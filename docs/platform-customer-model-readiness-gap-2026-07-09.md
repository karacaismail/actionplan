# Platform Customer Model Readiness Gap — 2026-07-09

Durum: W1.2 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-customer-model`

Bu rapor implementation kodu üretmez. Amaç, Customer model adımının gerçek checkout'taki durumunu belgelemek ve tenant-aware model/migration test hedeflerini netleştirmektir.

## Özet

`platform` checkout'unda Customer modeli, SQLAlchemy/SQLModel base'i, Alembic migration'ı veya tenant-aware Customer tablo testi yoktur. W0.9 DB/migration katmanı da henüz implementation evidence taşımadığı için Customer model code-start yapılamaz.

## Handoff Hedefi

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/models/customer.py` | tenant-aware Customer model |
| `apps/api/migrations/versions/*_customer.py` | reversible Customer migration |
| `apps/api/tests/test_customer_model.py` | field constraints, tenant+email uniqueness |
| `apps/api/tests/test_customer_migration.py` | upgrade/downgrade round-trip |

Minimum test komutu:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_model.py tests/test_customer_migration.py
```

## Çıkış Eşiği

- Customer table tenant id ve uygun indeks taşır.
- `tenant_id + email` uniqueness testle kanıtlanır.
- Migration upgrade/downgrade geçer.
- Cross-tenant model query negatif testi geçer.
- PR/commit/CI/test evidence geri yazılmadan done yazılmaz.
