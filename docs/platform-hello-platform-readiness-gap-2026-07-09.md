# Platform Hello Platform Readiness Gap — 2026-07-09

Durum: W0.12 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-factory`

Bu rapor implementation kodu üretmez. Amaç, W0.12 Hello Platform adımının gerçek checkout'taki durumunu belgelemek ve minimal boot kanıtı ile gerçek done kanıtını ayırmaktır.

## Özet

`platform` checkout'unda kısmi Hello Platform yüzeyi vardır: API `/healthz` ve GraphQL `{ ping }` sunar; frontend `meta-platform` shell ve public `Vitrin` landing route taşır; local smoke/e2e test dosyaları mevcuttur. Ancak remote CI run, deploy/smoke URL, tenant-aware request, full stack boot evidence ve PR/commit kanıtı yoktur.

Bu nedenle W0.12 için doğru durum "Hello Platform bitti" değil, "minimal local shell mevcut; production-grade Hello Platform evidence eksik"tir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| API liveness | `/healthz` mevcut |
| GraphQL ping | `{ ping }` mevcut |
| UI shell | `App.tsx` `meta-platform` header taşır |
| Public landing | `/` route `Vitrin` storefront gösterir |
| Backend smoke test | `apps/api/tests/test_health.py` mevcut |
| Frontend smoke test | `apps/web/src/App.smoke.test.tsx` mevcut |
| Frontend e2e | `apps/web/e2e/storefront.spec.ts` mevcut |
| Tenant request | Yok |
| Remote CI evidence | Yok |
| Deploy/smoke evidence | Yok |
| `platform-factory` durumu | `status=backlog`, `phase=requirements`, `implementationStatus=not-started` |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.12 done yazılamaz.
- W0.3 tenant context hazır değilken Hello Platform tenant request kapısı karşılanamaz.
- W0.10 readiness/metrics/trace hazır değilken boot smoke production-grade sayılmaz.
- Minimal local shell var, fakat full stack boot komutu ve evidence formatı actionplan'a geri yazılmamıştır.
- Deploy/smoke/rollback kanıtı yoktur.

## W0.12 Handoff Hedefi

Implementation PR'ı başladığında önce eksik smoke testleri kırmızı yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/app.py` | `/healthz`, GraphQL ping ve tenant-aware request smoke wiring |
| `apps/api/tests/test_health.py` | health/ping ve tenant request smoke tests |
| `apps/web/src/App.tsx` | app shell smoke |
| `apps/web/src/router.tsx` | public route + future protected route boundary |
| `apps/web/src/pages/Landing.tsx` | storefront smoke |
| `apps/web/e2e/storefront.spec.ts` | browser smoke |

Minimum test komutları:

```bash
make test
pnpm test:smoke
pnpm test:storefront
pnpm --filter @platform/web run e2e
```

## Çıkış Eşiği

W0.12 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- API health ve GraphQL ping CI içinde geçer.
- UI shell ve storefront smoke CI içinde geçer.
- Tenant-aware request smoke testi geçer.
- Local full stack boot komutu ve logu vardır.
- Remote CI run URL'si, PR, commit ve deploy/smoke evidence geri yazılır.
- Rollback veya revert smoke notu evidence setine eklenir.

## Actionplan Etkisi

- `platform-factory` refs listesine bu rapor eklenir.
- `platform-factory` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- W0.2-W0.11 evidence tamamlanmadan W0.12 done yazılmaz.
