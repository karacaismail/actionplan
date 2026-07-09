# Platform Customer GraphQL Readiness Gap — 2026-07-09

Durum: W1.3 + W1.5 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-customer-graphql`

Bu rapor implementation kodu üretmez. Amaç, Customer GraphQL/API ve audit/event integration adımlarının gerçek checkout'taki durumunu belgelemektir.

## Özet

`platform` checkout'unda Customer query, mutation, resolver, dataloader veya permission/tenant guard kodu yoktur. Mevcut GraphQL schema yalnız `{ ping }` alanını sunar. Audit/event integration da yoktur; çünkü W0.5 outbox ve W0.7 audit katmanları done değildir.

## Handoff Hedefi

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/customer_graphql.py` | Customer query/mutation/resolver contract |
| `apps/api/src/meta_api/customer_events.py` | `customer.created` / `customer.updated` event bridge |
| `apps/api/tests/test_customer_graphql.py` | create/read/update resolver tests |
| `apps/api/tests/test_customer_permissions.py` | unauthorized/forbidden/cross-tenant negative tests |
| `apps/api/tests/test_customer_audit_events.py` | audit append + outbox event tests |

Minimum test komutu:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_graphql.py tests/test_customer_permissions.py tests/test_customer_audit_events.py
```

## Çıkış Eşiği

- `customer(id)`, `customers`, `createCustomer`, `updateCustomer` çalışır.
- Yetkisiz ve tenant-dışı erişim reddedilir.
- `customer.created/updated` outbox event üretir.
- Kritik mutation audit append üretir.
- PR/commit/CI/test/deploy evidence geri yazılmadan done yazılmaz.
