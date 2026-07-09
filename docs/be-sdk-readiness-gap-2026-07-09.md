# BE SDK Readiness Gap — 2026-07-09

Durum: W0.11 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `be-sdk`

Bu rapor implementation kodu üretmez. Amaç, W0.11 Module SDK contract adımının gerçek checkout'taki durumunu belgelemek ve SDK/codegen başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` checkout'unda `packages/sdk` yoktur; yalnız `packages/ui` paketi vardır. API tarafında Strawberry runtime schema vardır, ancak public SDK contract, codegen, generated client, app-core/module template veya SDK test paketi yoktur. Bu nedenle W0.11 için doğru durum "SDK geliştirildi" değil, "SDK public contract ve deterministik codegen hedefleri belirlendi"dir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| `packages/sdk` | Yok |
| SDK package manifest | Yok |
| Codegen script | Yok |
| Generated typed client | Yok |
| App-core/module templates | Yok |
| SDK testleri | Yok |
| Mevcut contract izi | `apps/api/src/meta_api/app.py` içinde runtime Strawberry schema; SDK contract değil |
| `be-sdk` durumu | `status=backlog`, `phase=requirements` |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.11 product code başlatılamaz.
- Kernel public contracts W0.3-W0.10 boyunca kanıtlanmadan SDK üretilemez.
- `k-capability` registry/manifest sözleşmesi hazır değildir.
- Public contract kaynağı net değildir: GraphQL introspection, OpenAPI, JSON schema veya explicit contract dosyası seçilmemiştir.
- Deterministic codegen snapshot testi yoktur.
- Generated output manual edit guard yoktur.
- Forbidden stack taraması SDK template'lerine bağlanmamıştır.

## W0.11 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `packages/sdk/package.json` | SDK package scripts ve public exports |
| `packages/sdk/src/contracts.ts` | Kernel public contract source binding |
| `packages/sdk/src/codegen.ts` | Deterministic typed client generation |
| `packages/sdk/src/index.ts` | Narrow public SDK API |
| `packages/sdk/templates/app-core/manifest.json` | App-core scaffold manifest |
| `packages/sdk/tests/codegen.test.ts` | deterministic output, no manual edit, forbidden-stack tests |
| `packages/sdk/tests/public-api.test.ts` | public API snapshot ve backward compatibility tests |

Minimum test komutu:

```bash
pnpm --filter @platform/sdk run test
```

## Çıkış Eşiği

W0.11 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- SDK package workspace'e eklenir.
- Public contract kaynağı tek ve deterministiktir.
- Codegen aynı input ile byte-stable output üretir.
- Generated output elle editlenemez; guard testi geçer.
- Forbidden stack template/codegen içinde reddedilir.
- SDK public API snapshot testi geçer.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `be-sdk` refs listesine bu rapor eklenir.
- `be-sdk` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- Kernel W0.3-W0.10 evidence tamamlanmadan SDK development fazına alınmaz.
