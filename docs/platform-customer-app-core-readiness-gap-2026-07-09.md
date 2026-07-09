# Platform Customer App-Core Readiness Gap — 2026-07-09

Durum: W1.1 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node'ları: `platform-factory`, `k-capability`

Bu rapor implementation kodu üretmez. Amaç, Customer app-core adımının gerçek checkout'taki durumunu belgelemek ve app slug/capability/route/menu/event namespace sözleşmelerini code-start öncesi netleştirmektir.

## Özet

`platform` checkout'unda Customer app-core yoktur. `apps/web/src/apps/customer` veya `apps/api` altında Customer module/core kaydı bulunmadı. Mevcut frontend yalnız public `Vitrin` storefront route taşır; bu Customer app-core kanıtı değildir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Customer app-core backend | Yok |
| Customer app route/menu | Yok |
| Customer capability binding | Yok |
| Customer event namespace | Yok |
| `apps/web/src/apps/customer` | Yok |
| Registry dependency | W0.8 `k-capability` done değil |

## Handoff Hedefi

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/customer_core.py` | Customer app slug, capability ve event namespace sözleşmesi |
| `apps/web/src/apps/customer/index.tsx` | Customer app route/menu entry |
| `apps/api/tests/test_customer_app_core.py` | app slug, capability ve event namespace testleri |
| `apps/web/src/apps/customer/customer-route.test.tsx` | route/menu smoke |

Minimum test komutları:

```bash
cd apps/api && uv run --python 3.12 pytest -q tests/test_customer_app_core.py
pnpm --filter @platform/web run test -- customer-route
```

## Çıkış Eşiği

- Customer app slug registry'ye deterministik bağlanır.
- Capability olmadan route/menu görünmez.
- Event namespace `customer.*` olarak çakışmasız ayrılır.
- App-core Customer domain CRUD implement etmez; yalnız app boundary ve registration sağlar.
- PR/commit/CI/test evidence geri yazılmadan done yazılmaz.
