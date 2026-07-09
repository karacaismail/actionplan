# K-Capability Registry Readiness Gap — 2026-07-09

Durum: W0.8 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `k-capability`

Bu rapor implementation kodu üretmez. Amaç, W0.8 module registry/manifest adımının gerçek checkout'taki durumunu belgelemek ve capability/entitlement sözleşmesi başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` checkout'unda module registry, app module manifest validation, capability/entitlement resolution veya module-specific health check kodu yoktur. Mevcut `/healthz` yalnız platform API sağlık ucudur; module registry healthz veya capability readiness kanıtı değildir.

Bu nedenle W0.8 için doğru durum "registry geliştirildi" değil, "module manifest ve capability/entitlement sözleşmesi için kırmızı test hedefleri belirlendi"dir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Module registry backend kodu | Yok |
| Manifest validation kodu | Yok |
| Capability/entitlement resolver | Yok |
| Duplicate slug testi | Yok |
| Module healthz testi | Yok |
| Mevcut healthz | Yalnız platform API `/healthz` |
| `k-capability` durumu | `status=backlog`, `phase=requirements` |
| Bağımlılık | `k-party`, `k-tenancy`, `k-policy-pdp` readiness bekliyor |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.8 product code başlatılamaz.
- W0.3 tenancy ve W0.4 authz/PDP hazır olmadan entitlement tenant-safe ve policy-safe sayılamaz.
- App/module üretimi yasak sınırdadır; burada yalnız registry/manifest sözleşmesi yazılabilir.
- Manifest schema, module slug uniqueness ve capability key formatı test edilebilir sözleşmeye çevrilmemiştir.
- Module healthz, duplicate slug ve forbidden permission diff testleri yoktur.
- SDK (`be-sdk`) hazır olmadan generator/template tüketimi başlatılamaz.

## W0.8 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/registry.py` | AppModule register/list/health contract |
| `apps/api/src/meta_api/module_manifest.py` | Manifest schema, slug, permission ve surface declarations |
| `apps/api/src/meta_api/capabilities.py` | Capability/entitlement resolver interface |
| `apps/api/tests/test_module_registry.py` | register, duplicate slug, invalid manifest, module healthz tests |
| `apps/api/tests/test_capability_entitlements.py` | allow/deny, expired entitlement ve forbidden permission diff tests |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_module_registry.py tests/test_capability_entitlements.py
```

## Çıkış Eşiği

W0.8 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- Valid module manifest register olur.
- Duplicate slug deterministik hata üretir.
- Invalid manifest ve forbidden permission diff reddedilir.
- Capability/entitlement resolver fail-closed davranır.
- Module healthz platform `/healthz`'den ayrı raporlanır.
- Registry output SDK/codegen tüketimine uygun typed contract üretir.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `k-capability` refs listesine bu rapor eklenir.
- `k-capability` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- `platform-tenancy`, `platform-authn-authz`, `k-policy-pdp` ve `be-sdk` readiness tamamlanmadan app/module generation başlatılmaz.
