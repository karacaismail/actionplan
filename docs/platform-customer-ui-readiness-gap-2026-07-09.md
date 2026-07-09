# Platform Customer UI Readiness Gap — 2026-07-09

Durum: W1.4 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-customer-ui`

Bu rapor implementation kodu üretmez. Amaç, Customer UI projection adımının gerçek checkout'taki durumunu belgelemek ve route/surface/form/a11y hedeflerini netleştirmektir.

## Özet

`platform` checkout'unda Customer liste, detay veya form UI yoktur. Mevcut `SurfaceRenderer` ve public `Vitrin` storefront generic yüzeydir; Customer route veya canlı GraphQL bağlantısı değildir.

## Handoff Hedefi

| Hedef | Beklenti |
|---|---|
| `apps/web/src/apps/customer/routes.tsx` | Customer route tree |
| `apps/web/src/apps/customer/CustomerList.tsx` | list projection |
| `apps/web/src/apps/customer/CustomerDetail.tsx` | detail projection |
| `apps/web/src/apps/customer/CustomerForm.tsx` | create/update form |
| `apps/web/src/apps/customer/customer-ui.test.tsx` | empty/loading/error/form states |
| `apps/web/e2e/customer.spec.ts` | browser smoke + a11y |

Minimum test komutları:

```bash
pnpm --filter @platform/web run test -- customer-ui
pnpm --filter @platform/web run e2e -- customer.spec.ts
```

## Çıkış Eşiği

- Customer route açılır.
- Empty/loading/error states testlidir.
- Form label/input/ARIA hata ilişkileri geçer.
- UI canlı Customer GraphQL contract'ına bağlanır.
- PR/commit/CI/test evidence geri yazılmadan done yazılmaz.
