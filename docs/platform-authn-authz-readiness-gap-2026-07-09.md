# Platform Authn/AuthZ Readiness Gap — 2026-07-09

Durum: W0.4 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-authn-authz`
Kaynak sözleşme node'ları: `k-authz`, `k-policy-pdp`

Bu rapor implementation kodu üretmez. Amaç, W0.4 authn/authz/PDP adımının gerçek checkout'taki durumunu belgelemek ve yetkilendirme başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` checkout'unda backend authn/authz/PDP kodu yoktur. API hâlâ `/healthz` ve GraphQL `{ ping }` seviyesindedir. Frontend tarafında tek rota public storefront olarak tanımlıdır ve kaynak yorumları açıkça "no auth" / "anonymous public landing" demektedir.

Bu nedenle W0.4 için doğru durum "auth katmanı geliştirildi" değil, "authn/authz/PDP implementation için bağımlılıklar ve kırmızı test hedefleri belirlendi"dir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| API entrypoint | `apps/api/src/meta_api/app.py` |
| Mevcut backend davranışı | `/healthz` ve GraphQL `{ ping }` |
| Authn/AuthZ backend kodu | Yok |
| JWT/Bearer/token doğrulama | Yok |
| Resolver guard/directive | Yok |
| PDP/policy engine | Yok |
| Frontend route | `apps/web/src/router.tsx` yalnız public `/` route |
| Frontend auth durumu | `Landing.tsx` anonymous public landing olarak yazılmış |
| Testler | Authn/AuthZ/PDP testi yok |
| `platform-authn-authz` durumu | `status=backlog`, `phase=requirements`, `implementationStatus=not-started` |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.4 product code başlatılamaz.
- W0.3 `platform-tenancy` fail-closed davranışı kanıtlanmadan authz tenant-safe sayılamaz.
- `k-authz` ve `k-policy-pdp` kernel sözleşmeleri done değildir.
- Identity kaynağı belli değildir: JWT issuer, JWKS, session veya internal actor kaynağı seçilmemiştir.
- Default-deny resolver guard yoktur.
- Rol/izin matrisi ve policy karar formatı test edilebilir sözleşmeye çevrilmemiştir.
- Auth karar audit'i için `l1-audit` bağı henüz hazır değildir.

## W0.4 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/authn.py` | Token/session doğrulama ve actor envelope |
| `apps/api/src/meta_api/authz.py` | Role/permission guard ve default-deny hata tipi |
| `apps/api/src/meta_api/pdp.py` | Policy decision point arayüzü ve karar sonucu |
| `apps/api/src/meta_api/app.py` | GraphQL/FastAPI guard wiring |
| `apps/api/tests/test_authn_authz.py` | unauthorized, forbidden, allow, missing guard ve tenant-aware negative tests |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_authn_authz.py
```

## Çıkış Eşiği

W0.4 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- Kimliksiz istekler 401 ile reddedilir.
- Kimliği var ama yetkisi yok istekler 403 ile reddedilir.
- İzinli actor yalnız kendi tenant scope'unda allow alır.
- Resolver/endpoint yetki guard'ı olmadan merge edilemez.
- PDP kararları deterministik ve audit'e bağlanabilir formattadır.
- Rol/izin matrisi tablo-temelli testlerle doğrulanır.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `platform-authn-authz` refs listesine bu rapor eklenir.
- `platform-authn-authz` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- `platform-tenancy`, `k-authz` ve `k-policy-pdp` hazır olmadan `platform-authn-authz` development fazına alınmaz.
