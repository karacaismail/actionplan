# Platform Customer E2E Evidence Readiness Gap — 2026-07-09

Durum: W1.7 + W1.8 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node'ları: `platform-customer-ui`, `platform-customer-graphql`

Bu rapor implementation kodu üretmez. Amaç, Customer end-to-end proof ve evidence writeback adımlarının gerçek checkout'taki durumunu belgelemektir.

## Özet

`platform` checkout'unda Customer E2E yoktur. Mevcut Playwright testi public storefront'u açar; login, customer create/read, cross-tenant denied veya evidence writeback akışı yoktur.

## Handoff Hedefi

| Hedef | Beklenti |
|---|---|
| `apps/web/e2e/customer.spec.ts` | login -> customer create -> read -> cross-tenant denied |
| `apps/api/tests/test_customer_e2e_contract.py` | API-side E2E contract |
| `reports/customer-e2e-evidence.md` | CI/test/deploy evidence summary |

Minimum test komutları:

```bash
pnpm --filter @platform/web run e2e -- customer.spec.ts
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_e2e_contract.py
```

## Çıkış Eşiği

- E2E login, create, read ve cross-tenant denied akışı geçer.
- UI/API/audit/outbox evidence aynı PR'da bağlanır.
- Evidence Patch actionplan'a gerçek PR/commit/CI/test/deploy/smoke/rollback kanıtlarıyla geri yazılır.
- Kanıt yoksa Customer node'larında `status=done` yazılmaz.
