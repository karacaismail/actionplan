# Platform Tenancy Readiness Gap — 2026-07-09

Durum: W0.3 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-tenancy`
Kaynak sözleşme node'u: `k-tenancy`

Bu rapor implementation kodu üretmez. Amaç, W0.3 tenant context adımının gerçek checkout'taki durumunu belgelemek ve tenant izolasyonu başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` API şu anda Faz 0 seviyesindedir: `/healthz` ve GraphQL `{ ping }` çalışır, DB bağlantısı yoktur. PostgreSQL `infra/docker-compose.yml` içinde tanımlıdır, ancak API kodu `DATABASE_URL` kullanmaz ve tenant bağlamı taşımaz. Kaynak kodda `tenant`, `tenancy`, `tenant_id`, `x-tenant` veya `rls` izine rastlanmadı.

Bu nedenle W0.3 için doğru durum "tenant altyapısı başladı" değil, "tenant fail-closed sözleşmesi ve negatif test hedefleri belirlenmiş, implementation başlamamış"tır.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| API entrypoint | `apps/api/src/meta_api/app.py` |
| Mevcut API davranışı | `/healthz` ve GraphQL `{ ping }` |
| DB kullanımı | API README "DB'siz" diyor; kodda DB bağlantısı yok |
| PostgreSQL | `infra/docker-compose.yml` içinde var |
| ORM/migration bağımlılığı | `apps/api/pyproject.toml` içinde SQLAlchemy, SQLModel veya Alembic yok |
| Tenant kaynak kodu | Kaynak dizinlerinde tenant/tenancy/tenant_id/RLS eşleşmesi yok |
| Testler | `apps/api/tests/test_health.py` yalnız health ve ping test ediyor |
| `platform-tenancy` durumu | `status=backlog`, `phase=requirements`, `implementationStatus=not-started` |
| `k-tenancy` durumu | `status=backlog`, `phase=requirements`; dependency henüz done değil |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.3 product code başlatılamaz.
- `platform-tenancy` node'u `k-tenancy` node'una bağlıdır; kernel tenancy sözleşmesi done değildir.
- Tenant context extraction sözleşmesi yok: header, token claim veya server-side session kaynağı belirlenmemiş.
- Fail-closed davranış testleri yok: missing tenant, invalid tenant, cross-tenant read/write negative tests.
- DB katmanı yok: SQLAlchemy/SQLModel/Alembic bağımlılıkları ve migration politikası eklenmemiş.
- RLS veya schema-per-tenant kararı henüz implementation seviyesinde kanıtlanmamış.
- Audit envelope yok; tenant kararının audit kaydı nereye yazılacak belli değil.

## W0.3 Handoff Hedefi

Implementation PR'ı başladığında hedef ürün kodu değil, önce kırmızı test setidir. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/tenancy.py` | Tenant context modeli, parser ve fail-closed hata tipi |
| `apps/api/src/meta_api/app.py` | FastAPI dependency veya middleware wiring |
| `apps/api/tests/test_tenancy.py` | missing tenant, invalid tenant ve cross-tenant negative tests |
| `apps/api/pyproject.toml` | DB/migration bağımlılığı gerekiyorsa açık ekleme |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_tenancy.py
```

## Çıkış Eşiği

W0.3 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- Tenant context olmayan istekler fail-closed reddedilir.
- Geçersiz tenant claim/header reddedilir.
- Tenant A, Tenant B verisini okuyamaz veya yazamaz; negatif test kırmızıdan yeşile döner.
- DB sorguları tenant scope dışında çalışamaz; RLS veya eşdeğer isolation kararı testle kanıtlanır.
- Tenant strategy `schema-per-tenant`, `RLS` veya hibrit olarak actionplan'a gerekçesiyle yazılır.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `platform-tenancy` refs listesine bu rapor eklenir.
- `platform-tenancy` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- `k-tenancy` done olmadan `platform-tenancy` development fazına alınmaz.
