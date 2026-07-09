# L1 Audit Readiness Gap — 2026-07-09

Durum: W0.7 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `l1-audit`

Bu rapor implementation kodu üretmez. Amaç, W0.7 audit log adımının gerçek checkout'taki durumunu belgelemek ve append-only audit/activity ayrımı başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` checkout'unda compliance audit, activity feed, immutable append log, hash chain veya actor/tenant audit envelope kodu yoktur. Bulunan log izleri yalnız deploy runbook'larındaki container log izleme komutlarıdır; bunlar audit trail kanıtı değildir.

Bu nedenle W0.7 için doğru durum "audit geliştirildi" değil, "append-only audit sözleşmesi ve actor/tenant envelope test hedefleri belirlendi"dir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Audit backend kodu | Yok |
| Activity feed kodu | Yok |
| Append-only log storage | Yok |
| Hash chain / tamper detection | Yok |
| Actor/tenant audit envelope | Yok |
| Audit testleri | Yok |
| Mevcut log izi | Sadece Docker/API log izleme runbook komutları |
| `l1-audit` durumu | `status=backlog`, `phase=requirements` |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.7 product code başlatılamaz.
- W0.3 tenant context ve W0.4 actor/authn envelope hazır değilken audit kaydı anlamlı değildir.
- W0.5 event/outbox olmadan audit ingest durability kanıtlanamaz.
- Audit ve activity feed okuma modeli ayrımı implementation sözleşmesine çevrilmemiştir.
- Append-only storage, hash chain ve tamper detection testleri yoktur.
- Audit erişiminin de audit'lenmesi için meta-audit davranışı yoktur.

## W0.7 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/audit.py` | AuditEvent envelope, append-only writer, hash chain |
| `apps/api/src/meta_api/activity.py` | UX activity feed projection; audit kaydını değiştirmez |
| `apps/api/tests/test_audit_log.py` | append-only, tamper detection, actor/tenant envelope tests |
| `apps/api/tests/test_activity_feed.py` | feed projection ve audit/activity separation tests |
| `apps/api/pyproject.toml` | DB/migration bağımlılığı gerekiyorsa açık ekleme |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_audit_log.py tests/test_activity_feed.py
```

## Çıkış Eşiği

W0.7 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- AuditEvent actor, tenant, action, resource, before/after hash ve correlation id taşır.
- Audit log append-only çalışır; update/delete denemesi reddedilir.
- Hash chain bozulursa tamper detection testi yakalar.
- Activity feed audit log'dan türetilir; compliance log'u mutasyona uğratmaz.
- Audit erişimi meta-audit kaydı üretir.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `l1-audit` refs listesine bu rapor eklenir.
- `l1-audit` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- Tenant, authn/authz ve outbox evidence olmadan audit development fazına alınmaz.
