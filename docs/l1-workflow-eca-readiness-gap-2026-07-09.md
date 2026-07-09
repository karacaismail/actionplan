# L1 Workflow/ECA Readiness Gap — 2026-07-09

Durum: W0.6 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `l1-workflow`

Bu rapor implementation kodu üretmez. Amaç, W0.6 ECA runtime adımının gerçek checkout'taki durumunu belgelemek ve workflow/rules engine başlamadan önce kapatılması gereken boşlukları netleştirmektir.

## Özet

`platform` checkout'unda workflow engine, ECA ruleset, state machine runtime, scheduler veya approval chain kodu yoktur. `workflow` kelimesi yalnız GitHub Actions deploy dokümantasyonunda geçmektedir; bu CI workflow anlamındadır, ürün içi ECA runtime değildir. Kaynak kodda ECA, ruleset, trigger, condition, scheduler veya engine davranışı bulunmadı.

Bu nedenle W0.6 için doğru durum "ECA runtime geliştirildi" değil, "ECA runtime için güvenli backend-only sözleşme ve kırmızı test hedefleri belirlendi"dir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Workflow/ECA backend kodu | Yok |
| Ruleset storage/runtime | Yok |
| State machine transition kodu | Yok |
| Scheduler/timeout/approval chain | Yok |
| ECA testleri | Yok |
| Mevcut workflow izi | Sadece GitHub Actions deploy dokümanları |
| `l1-workflow` durumu | `status=backlog`, `phase=requirements` |
| Bağımlılıklar | `scale-idempotency`, `scale-outbox`, `k-bus`, `platform-tenancy` readiness bekliyor |

## Code-Start Blocker'ları

- W0.2 remote/CI baseline kanıtı yokken W0.6 product code başlatılamaz.
- W0.3 tenant context ve W0.5 outbox olmadan ECA trigger tenant-safe ve durable sayılamaz.
- ECA action allowlist sözleşmesi yoktur.
- Ruleset yetki katmanları net değildir: system locked, platform owner, tenant-safe parametre ayrımı yapılmamıştır.
- Serbest JS/SQL/shell çalıştırmanın açık deny testi yoktur.
- Max chain depth, idempotency key, disabled rule ve loop-breaker testleri yoktur.
- Audit envelope hazır olmadığı için rule execution kararları izlenebilir değildir.

## W0.6 Handoff Hedefi

Implementation PR'ı başladığında önce kırmızı test yazılmalıdır. Minimum path/test eşlemesi:

| Hedef | Beklenti |
|---|---|
| `apps/api/src/meta_api/eca.py` | Event-condition-action evaluator ve action allowlist |
| `apps/api/src/meta_api/workflow.py` | State machine transition contract |
| `apps/api/src/meta_api/rulesets.py` | Ruleset schema, disabled flag, scope/owner katmanı |
| `apps/api/tests/test_eca_runtime.py` | rule match/no-match, disabled rule, max chain, forbidden action tests |
| `apps/api/tests/test_workflow_state.py` | valid/invalid transition ve idempotency tests |

Minimum test komutu:

```bash
cd apps/api
uv run --python 3.12 pytest -q tests/test_eca_runtime.py tests/test_workflow_state.py
```

## Çıkış Eşiği

W0.6 done sayılmaz; aşağıdakilerin tamamı kanıtlanmalıdır:

- Rule match/no-match deterministik çalışır.
- Disabled rule hiçbir action üretmez.
- Max chain depth 6 eşiğinde loop-breaker devreye girer.
- Serbest JS, SQL ve shell action denemeleri deny edilir.
- ECA evaluation tenant scoped çalışır.
- Action allowlist ve step-up gerektiren action ayrımı testle doğrulanır.
- PR, commit, CI run, test log ve rollback/smoke evidence geri yazılır.

## Actionplan Etkisi

- `l1-workflow` refs listesine bu rapor eklenir.
- `l1-workflow` handoff hedefleri `traceability.repoPath` ve `traceability.testCommand` içine yazılır.
- `status`, `phase`, `evidence` ve `implementationStatus` ilerletilmez.
- `k-bus`, `platform-tenancy` ve audit envelope hazır olmadan ECA runtime development fazına alınmaz.
