# Platform Customer Seed Readiness Gap — 2026-07-09

Durum: W1.6 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-customer-seed`

Bu rapor implementation kodu üretmez. Amaç, Customer seed/demo data adımının gerçek checkout'taki durumunu belgelemek ve deterministic fixture hedeflerini netleştirmektir.

## Özet

`platform` checkout'unda Customer seed veya golden fixture yoktur. Mevcut `apps/api/seed/seed.py` yalnız Faz 0 placeholder'dır ve DB eklenene kadar bilgilendirici mesaj basar; Customer seed evidence değildir.

## Handoff Hedefi

| Hedef | Beklenti |
|---|---|
| `apps/api/seed/customer_seed.py` | deterministic tenant-aware Customer seed |
| `apps/api/seed/fixtures/customers.json` | golden fixture |
| `apps/api/tests/test_customer_seed.py` | idempotency, schema compatibility, rollback clean |

Minimum test komutu:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_seed.py
```

## Çıkış Eşiği

- Seed tekrar çalıştırıldığında duplicate üretmez.
- Fixture Customer model schema ile uyumludur.
- Seed rollback/clean komutu testlidir.
- E2E testleri bu altın veriye dayanır.
- PR/commit/CI/test evidence geri yazılmadan done yazılmaz.
