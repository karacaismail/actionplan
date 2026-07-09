# Platform Observability Readiness Gap — 2026-07-09

Durum: W0.10 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-observability`

Bu rapor implementation kodu üretmez. Amaç, W0.10 observability adımının gerçek checkout'taki durumunu belgelemek ve health/ready/metrics/trace sözleşmesi başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` checkout'unda `/healthz` endpoint'i ve testi vardır. Ancak readiness endpoint'i, metrics exporter, trace/correlation id propagation, structured logging, PII masking veya OpenTelemetry/Prometheus entegrasyonu yoktur. `ready` kelimesi yalnız frontend surface lifecycle status içinde geçer; backend readiness kanıtı değildir.

Bu nedenle W0.10 için doğru durum "observability geliştirildi" değil, "healthz mevcut; readiness/metrics/trace/logging handoff hedefleri eksik"tir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Liveness | `/healthz` mevcut |
| Readiness | Yok |
| Metrics exporter | Yok |
| Trace/correlation id | Yok |
| Structured logging | Yok |
| PII masking/log policy | Yok |
| OpenTelemetry/Prometheus bağımlılığı | Yok |
| `platform-observability` durumu | `status=backlog`, `phase=requirements`, `implementationStatus=not-started` |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.10 product code başlatılamaz.
- W0.3 tenant context ve W0.4 actor envelope hazır olmadan log/trace tenant-aware sayılamaz.
- W0.7 audit envelope hazır olmadan security event observability tamamlanamaz.
- `/readyz` dependency health model'i yoktur.
- Metrics endpoint, metric names ve cardinality guardrail yoktur.
- Correlation id propagation ve structured log redaction testleri yoktur.
- Incident/smoke evidence formatı actionplan'a bağlanmamıştır.

## W0.10 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/observability.py` | health/ready/metrics contract ve trace id helpers |
| `apps/api/src/meta_api/logging.py` | structured log, redaction ve correlation id binding |
| `apps/api/src/meta_api/app.py` | middleware wiring ve `/readyz`, `/metrics` endpoints |
| `apps/api/tests/test_health_ready.py` | liveness/readiness success/failure tests |
| `apps/api/tests/test_observability.py` | trace propagation, metrics ve PII masking tests |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_health_ready.py tests/test_observability.py
```

## Çıkış Eşiği

W0.10 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- `/healthz` liveness, `/readyz` dependency readiness olarak ayrılır.
- Her request correlation/trace id taşır.
- Metrics endpoint low-cardinality metric üretir.
- Structured logs tenant, actor ve trace id taşır; PII redaction testi geçer.
- Security events audit envelope ile ilişkilendirilebilir.
- Smoke/incident evidence formatı actionplan'a geri yazılır.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `platform-observability` refs listesine bu rapor eklenir.
- `platform-observability` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- Tenant/auth/audit evidence olmadan observability done yazılmaz.
