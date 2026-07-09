# K-Bus Event/Outbox Readiness Gap — 2026-07-09

Durum: W0.5 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `k-bus`

Bu rapor implementation kodu üretmez. Amaç, W0.5 event/outbox adımının gerçek checkout'taki durumunu belgelemek ve event kaybı, idempotency ve tenant envelope boşluklarını code-start öncesi netleştirmektir.

## Özet

`platform` checkout'unda event bus, transactional outbox, consumer, retry veya DLQ kodu yoktur. Yalnız `apps/api/seed/seed.py` ve API README içinde seed script'in idempotent placeholder olduğu belirtilmiştir; bu uygulama event idempotency kanıtı değildir. Infra tarafında Redis/S3/object-storage bilinçli olarak eklenmemiştir. Mevcut ilk handoff bu yüzden harici broker varsaymadan PostgreSQL transactional outbox ve idempotent consumer testleriyle başlamalıdır.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| API event/outbox kodu | Yok |
| Consumer/producer kodu | Yok |
| Idempotent event consumer testi | Yok |
| DB outbox migration | Yok |
| Broker | `infra/docker-compose.yml` Redis/S3/object-storage bilinçli kapalı diyor |
| Mevcut idempotency izi | Yalnız seed placeholder açıklaması |
| `k-bus` durumu | `status=backlog`, `phase=requirements` |
| Bağımlılık | `k-bus.dependsOn = scale-outbox`; bu node done değil |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.5 product code başlatılamaz.
- W0.3 tenant envelope hazır değilken event payload tenant-safe sayılamaz.
- W0.4 authz/PDP hazır değilken event publish/subscribe yetkisi doğrulanamaz.
- `scale-outbox` dependency done değildir.
- Transactional outbox şeması, idempotency key ve event envelope sürümü tanımlı değildir.
- Consumer retry/backoff ve dead-letter davranışı test edilebilir sözleşmeye çevrilmemiştir.
- Outbox publish ile domain write aynı transaction içinde kanıtlanmamıştır.

## W0.5 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/events.py` | Event envelope, type/version, tenant ve actor alanları |
| `apps/api/src/meta_api/outbox.py` | Transactional outbox write/read contract |
| `apps/api/src/meta_api/consumers.py` | Idempotent consumer ve retry policy |
| `apps/api/tests/test_events_outbox.py` | transaction + outbox persistence, duplicate delivery, retry/DLQ negative tests |
| `apps/api/pyproject.toml` | DB/migration bağımlılığı gerekiyorsa açık ekleme |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_events_outbox.py
```

## Çıkış Eşiği

W0.5 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- Domain write ve outbox append aynı transaction içinde gerçekleşir.
- Publish başarısızlığı domain write'ı kaybettirmez; outbox replay ile toparlanır.
- Duplicate delivery idempotency key ile tek kez işlenir.
- Event envelope tenant, actor, event type, version ve correlation id taşır.
- Consumer retry/backoff ve dead-letter davranışı testle doğrulanır.
- Event kaybı negatif testi kırmızıdan yeşile döner.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `k-bus` refs listesine bu rapor eklenir.
- `k-bus` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- Platform-specific event node olmadığı için implementation PR'ı `k-bus` ve ilgili platform API node'larına evidence geri yazmalıdır.
