# k-worker — Arka-Plan İş / Görev-Kuyruğu Kernel Primitifi

**Statü:** kanonik yönerge (`k-worker` — WBS `app-layer0` kümesi). **Kod karşılığı:** `backend/platform_worker/` + CI kapısı `check-worker-contract`.
**Neden var:** AI enrichment 20 saniye sürer, Trendyol'a 5000 ürün push'u dakikalar alır, gece analitiği saatler; bunları HTTP isteği içinde çalıştırmak isteği kilitler, kullanıcıyı bekletir, timeout'ta veriyi yarım bırakır. Her app kendi thread'ini/cron'unu yazarsa retry, dead-letter, tenant-adalet ve görünürlük her app'te farklı ve hatalı olur. `k-worker`, "işi kuyruğa al, güvenilir ve izlenebilir çalıştır" sözünü tek primitife bağlar. Stack: FastAPI + SQLAlchemy 2.0 + PostgreSQL; kuyruk Celery/ARQ + Redis; deploy Hetzner/Debian/Docker.

---

## 1. Amaç

Uzun süren, tekrar denenebilir veya zamanlanmış **her** işin — HTTP istek-yanıt döngüsünden ayrılıp, tenant-izole, retry+backoff'lu, dead-letter'lı, devre-kesicili ve gözlemlenebilir biçimde — arka planda çalışmasını garanti altına almak. Ana kural: bir işin arka plana taşınması bir *tercih* değil; belirtilen kategorilerde (AI enrichment, sync, medya, export, analitik) bir *sözleşme*dir. İş kaybolmaz, iki kez etki etmez, sessizce ölmez: her iş görünürdür ve son durumu (`succeeded|failed|dead`) bilinir.

## 2. Kapsam — hangi işler

Yönerge, senkron istek-yanıt penceresine sığmayan veya zamanlanmış çalışması gereken işleri bağlar. Aşağıdaki tablo PIM-v2'nin fiili iş türlerini kapsama eşler; her iş türü `Job.job_type` alanında beyan edilir.

| İş türü | Kapsar | Örnek görev |
|---|---|---|
| `ai_enrichment` | AI içerik üretimi/kategorizasyon/çeviri, batch onay | `process_pending_enrichments`, `refresh_translation_memory`, `expire_old_approvals` |
| `sync` | ERP/GDSN/kanal çift-yönlü senkronizasyon, dakikalık kuyruk | `queue_processor`, `item_sync`, `gdsn_sync` |
| `media` | Kanal-özel görsel varyant üretimi, yetim medya temizliği | `generate_pending_variants`, `cleanup_orphan_media` |
| `export` | BMEcat/UBL/cXML/GS1/XLSX üretimi, baskı PDF katalog | `build_export`, `print_catalog` |
| `analytics` | Fiyat pariteti, dijital raf, arama sıralaması, haftalık özet | `monitor_price_parity`, `capture_shelf_snapshots`, `track_search_rankings`, `generate_weekly_summary` |

Bir iş bu beş türden birini taşıyorsa yönerge zorunludur. Tür `ai_enrichment|sync|media|export|analytics` enum'ından seçilir.

## 3. Non-goals — neyi yapmaz

Yönerge her fonksiyona dayatılmaz; aşağıdakiler kasıtlı kapsam dışıdır.

| Yapmaz | Neden |
|---|---|
| Senkron istek-yanıtı arka plana zorlamaz | p95 < 300ms hedefli okuma/CRUD kuyruğa girmez; gereksiz gecikme olur |
| İş mantığını (fiyat/vergi hesabı) tanımlamaz | O `platform_computation` işidir; k-worker yalnız *yürütme zarfı* |
| Event Bus'ı (§2.3 outbox) ikame etmez | Outbox olay-yayımını atomikler; k-worker o olayı tüketip *iş* koşar |
| Sıralı iş akışı (saga/BPMN) tanımlamaz | O `platform_workflow` (§2.7) işidir; k-worker tek-adım iş yürütür |
| Kendi retry/dead-letter'ını app'e yazdırmaz | Tekrarlanan hata yüzeyi; motor merkezî sağlar, app yalnız görev yazar |

## 4. Tanım — nedir / ne yapar / ne yapmaz

**Nedir:** Uzun/tekrarlı/zamanlanmış işi HTTP döngüsünden ayıran, kuyruğa alan ve dayanıklı biçimde çalıştıran arka-plan yürütme primitifidir. Celery/ARQ + Redis üzerine oturur; her iş `tenant_id` taşır.
**Ne yapar:** İşi tenant-izole kuyruğa alır (`enqueue`); geçici hatada retry+exponential backoff uygular; kalıcı hatada dead-letter kuyruğuna taşır (kaybolmaz, incelenir); bağımlı servis çökünce circuit breaker ile boğulmayı keser; zamanlanmış işi (cron/interval) tetikler; her işin durumunu ve metriğini o11y'ye yansıtır (background-job görünürlüğü).
**Ne yapmaz:** İşi HTTP isteği içinde çalıştırmaz. Yan-etkiyi idempotency-key olmadan tekrar uygulamaz (aynı işi iki kez koşma tek etkiye iner). Başarısız işi sessizce yutmaz — dead-letter'a yazar ve alarm üretir. AI'ın bir işi insan onayı olmadan prod'a yazmasına yol açmaz.

## 5. Sözleşme şekli — alan | tip | amaç

Aşağıdaki üç yapı, arka-plan işinin sözleşmesini sabitler. Tablolar alan+tip+amaç verir; dolu örnek veri (mock) vermez.

**5.1 Job (`platform_worker/models.py`).** Kuyruğa alınan tek bir iş örneği.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID | İşin kimliği; o11y ve dead-letter bu id'yi izler |
| `tenant_id` | UUID | İş tenant kapsamında çalışır (§2.1 fail-closed); komşu-tenant görünmez |
| `job_type` | enum(`ai_enrichment\|sync\|media\|export\|analytics`) | İş türü; kuyruk/oran/öncelik seçimini belirler |
| `task_name` | str | Çalıştırılacak kayıtlı görev (`process_pending_enrichments` vb.) |
| `payload` | JSONB | Görev girdisi (ör. `product_id`, `channel`); serbest kod değil veri |
| `idempotency_key` | str \| null | Aynı işin tekrarını tek etkiye indirger (§scale-invariant `platform_idempotency`) |
| `status` | enum(`queued\|running\|succeeded\|failed\|dead`) | İş durum makinesi; her geçiş o11y'ye yansır |
| `attempt` / `max_attempts` | int / int | Deneme sayacı ve tavanı; retry politikasının girdisi |
| `run_after` | timestamptz | Backoff/zamanlama gecikmesi; bu ana dek kuyruğa alınmaz |
| `result_ref` / `error` | UUID \| null / str \| null | Başarı çıktısının referansı / son hata gerekçesi |

**5.2 Task (`platform_worker/registry.py`).** Kayıtlı görev tanımı (davranış + dayanıklılık politikası).

| Alan | Tip | Amaç |
|---|---|---|
| `name` | str (birincil) | Görev kimliği; `Job.task_name` buna eşlenir |
| `queue` | str (default `tenant`) | Hangi kuyrukta koşar; rate-limit tenant kapsamlıdır (noisy-neighbor) |
| `retry_policy` | dict | `{max_attempts, backoff: exponential, base_s, jitter}` — geçici hata tekrarı |
| `dead_letter` | bool (default `true`) | Tavana varan iş DLQ'ya taşınır (silinmez, incelenir) |
| `circuit_breaker` | dict | `{failure_threshold, open_secs, half_open_probe}` — çöken bağımlılıkta boğulmayı keser |
| `idempotent` | bool (default `true`) | Görevin tekrar-güvenli olduğunu beyan eder; değilse retry engellenir |
| `visibility_timeout_s` | int | Görevin "asılı kaldı" sayılma süresi; aşımda yeniden kuyruğa alınır |
| `ai_cost_scope` | str \| null | AI çağrısı yapan görevin maliyet/kota kancası (kill-switch bağı) |

**5.3 Schedule (`platform_worker/schedule.py`).** Zamanlanmış iş tanımı.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID | Zamanlama kimliği |
| `tenant_id` | UUID \| null | Tenant kapsamı; NULL = platform-genel sistem işi |
| `task_name` | str | Tetiklenecek kayıtlı görev |
| `cron` / `interval_s` | str \| null / int \| null | Cron ifadesi veya periyot; biri dolu olmalı |
| `enabled` | bool (default `true`) | Zamanlamanın aktifliği; kapatma audit'lenir |
| `next_run_at` / `last_run_at` | timestamptz / timestamptz \| null | Sıradaki/son tetiklenme; o11y görünürlüğü |
| `overlap_policy` | enum(`skip\|queue\|replace`) | Önceki çalışma bitmeden tetiklenirse davranış |

## 6. WBS / kernel yerleşimi (k-worker)

`k-worker`, `app-layer0` (Layer 0 — Atomik Tipler) kümesinde bir **module/kaya** düğümüdür; `k-sequence`, `k-calendar-capacity`, `k-edge-gateway` ile aynı hizada bir kernel primitifidir. `dependsOn=[k-tenancy]`: her iş tenant bağlamı olmadan kuyruğa alınamaz. Tüketiciler (AI enrichment, sync, medya, export, analitik ArcheType'ları) k-worker'ı doğrudan thread/cron açmadan, `enqueue` sözleşmesi üzerinden kullanır. WBS düğümü: `src/data/generated/nodes/k-worker.json`.

## 7. Backend deseni

Aktör-açık desen: *geliştirici* görevi kayıt eder ve `enqueue` ile kuyruğa alır; *motor* (Celery/ARQ worker) dayanıklılık politikasını (retry/DLQ/breaker) deterministik uygular; *CI* eksik zarfı bloklar; *insan* AI'ın önerdiği prod-yazan işi onaylar.

- **Kuyruğa alma:** Handler `worker.enqueue(job_type, task_name, payload, tenant_id, idempotency_key)` çağırır. İş `platform_outbox` (§2.3) ile **aynı** `session.commit()` içinde yazılabilir — böylece "sipariş yazıldı ama enrichment işi kuyruklanmadı" dual-write hatası imkânsızlaşır. Worker outbox'ı okuyup Redis kuyruğuna iletir.
- **Retry + backoff:** Geçici hata (ör. kanal 503, AI rate-limit) `retry_policy` ile yeniden denenir: exponential backoff + jitter, `max_attempts`'e dek. `run_after` gecikmeyi taşır. Görev `idempotent=false` ise retry yapılmaz (çift-etki riski) — bunun yerine dead-letter.
- **Dead-letter queue:** `max_attempts` tükenince iş `status=dead` olur ve DLQ'ya taşınır; **silinmez**. DLQ görünürdür (ops paneli), elle veya politikayla yeniden-sürülebilir (replay). Kalıcı hata sessizce kaybolmaz.
- **Circuit breaker:** Bir bağımlı servise (kanal API, AI sağlayıcı) art arda `failure_threshold` hata olursa devre *açılır*; `open_secs` boyunca o hedefe iş sürülmez (hızlı-başarısızlık, boğulma yok). `half_open_probe` ile tek deneme yapılır; başarılıysa devre kapanır.
- **Zamanlanmış iş:** `Schedule` cron/interval ile tetiklenir; `overlap_policy` çakışmayı yönetir (dakikalık sync `skip`, gece export `queue`). Tetiklenme `next_run_at`/`last_run_at` ile izlenir.
- **İş görünürlüğü (o11y):** Her iş durum geçişi structlog + Prometheus + OpenTelemetry'ye yansır: `trace_id`, `tenant_id`, `job_type`, `status`, kuyruk-derinliği, deneme sayısı, süre (p95/p99). Background-job dashboard'u kuyruk sağlığını ve DLQ birikimini gösterir.

## 8. Multi-tenant (tenant-scoped job)

Her `Job` ve `Schedule` `tenant_id` taşır (§2.1 fail-closed). Rate-limit ve kuyruk **varsayılan `tenant` kapsamlıdır**: bir tenant'ın 5000 ürünlük export'u komşu tenant'ın enrichment'ını boğamaz (noisy-neighbor koruması). Worker, işi çalıştırmadan önce tenant bağlamını set eder; görev içindeki her sorgu tenant-izole çalışır. Platform-genel sistem işleri (`tenant_id=NULL`) yalnız işletmeci tarafından tanımlanır. Bir tenant'ın kotası (eşzamanlı iş, günlük AI çağrısı) aşılırsa iş reddedilir/ertelenir ve audit'lenir.

## 9. AI guardrail (ajan maliyeti / kill-switch bağı)

Dört-aktör iş bölümü değiştirilemez biçimde uygulanır: **AI önerir → insan onaylar → motor uygular.**

- **AI önerir:** AI, hangi işlerin çalışması gerektiğini (ör. "şu 200 ürün için enrichment kuyruğa alınmalı") ve zamanlama parametresi **önerebilir**; ayrıca DLQ birikimini analiz edip kök-neden raporlar.
- **AI yapamaz:** AI, prod veriye yazan bir işi (enrichment sonucu uygulama, sequence commit) insan onayı (`approval_ref`) olmadan tetikleyemez; onaysız apply `ApprovalRequiredError` fırlatır. AI, `retry_policy`/`circuit_breaker`/`dead_letter` politikasını doğrudan override edemez (ruleset backend-only, `canOverride:false`).
- **Ajan maliyeti / kill-switch:** `ai_enrichment` işleri `ai_cost_scope` üzerinden token/maliyet muhasebesine kancalıdır. Tenant kotası veya platform kill-switch tetiklenirse (`agentPolicy.killSwitch`), kuyruğa yeni AI işi alınmaz ve koşan iş güvenli durdurulur — AI maliyeti önemsizdir, güvenlik ve bütçe koruması önceliklidir. Ajanın onaysız prod-write kod yolu yoktur; CI, `enqueue`'suz thread/cron açan görevi reddeder.

## 10. Bağlama (context)

- **PIM-v2 iş türleri:** k-worker, PIM-v2'nin Celery görev katmanının (`app/tasks/`) sözleşmesidir; `ai_enrichment`, `sync`, `media`, `export`, `analytics` türlerinin hepsini tek dayanıklılık zarfında koşar (bkz. §2 tablosu).
- **scale-invariant bağı:** k-worker idempotency-key'i `platform_idempotency`'den alır; retry ve worker-replay'de aynı işin tek etkiye inmesi buradan gelir. Outbox (§2.3) ile birlikte dual-write hatasını kapatır. Worker retry, scale-invariant Test-1/Test-2'nin (çift-tahsilat, idempotency yarışı) simülasyon aktörüdür.
- **o11y background-job görünürlüğü:** Kuyruk-derinliği, iş gecikmesi, retry oranı, DLQ birikimi, breaker durumu Prometheus'a `tenant_id` label'ıyla yazılır; her iş `trace_id` ile uçtan uca izlenir (§2.9). "Hangi iş neden asılı kaldı / öldü" sorusunun tek kaynağı budur.

## 11. Test stratejisi

Aşağıdaki testler dayanıklılığın gerçekten çalıştığını kanıtlar; k-worker DoD'sinin parçasıdır.

1. **Retry tek-etki:** Geçici hata veren bir `idempotent` görev N kez retry edilir (worker-replay simülasyonu) → görev N kez *çalışır* ama yan-etki (stok düşümü, para) **bir kez** oluşur; `idempotency_key` aynı `result_ref`'e düşürür.
2. **Dead-letter:** `max_attempts` tükenen bir görev → `status=dead`, DLQ'ya taşınır, **silinmez**, alarm üretir; replay elle tetiklenince kaldığı yerden tek-etkiyle koşar.
3. **Circuit breaker:** Bir hedefe art arda hata → devre açılır, sonraki işler hızlı-başarısızlık ile o hedefe sürülmez; `open_secs` sonrası half-open probe başarılıysa devre kapanır.
4. **Tenant izolasyon / adalet:** Tenant-A'nın büyük kuyruğu Tenant-B'nin işini geciktirmez (rate-limit tenant-scope); Tenant-A'nın işi Tenant-B verisini göremez.
5. **AI-guardrail:** `enqueue`'suz thread/cron açan görev CI'da reddedilir; AI onaysız prod-yazan iş tetikleyince `ApprovalRequiredError`.

## 12. Acceptance criteria

- Beş iş türünün (`ai_enrichment|sync|media|export|analytics`) her biri için en az bir referans görev kayıtlı, `enqueue` ile kuyruklanıyor ve `check-worker-contract` yeşil.
- Bölüm 11'deki beş test yeşil (retry tek-etki, dead-letter, breaker, tenant-adalet, AI-guardrail).
- Her `Job`/`Schedule` `tenant_id` taşıyor; rate-limit tenant kapsamlı ("gürültülü komşu" örneği yok).
- Her iş durum geçişi o11y'ye yansıyor; DLQ ve breaker durumu dashboard'da görünür.
- AI hiçbir prod-yazan işi onaysız tetikleyemiyor; kill-switch AI işlerini durduruyor.

## 13. Anti-patterns

| Anti-pattern | Neden yanlış | Doğrusu |
|---|---|---|
| İşi HTTP handler'ında `time.sleep`/blocking çalıştırmak | İsteği kilitler, timeout'ta veri yarım kalır | `worker.enqueue` ile arka plana taşı |
| App'in kendi `threading`/`cron`'unu yazması | Retry/DLQ/adalet her app'te farklı ve hatalı | k-worker `Task` kaydı + `Schedule` |
| Retry'ı `idempotent` olmayan göreve uygulamak | Çift-tahsilat/çift-stok; sessiz hasar | `idempotent=false` ise DLQ'ya at, retry yapma |
| Başarısız işi `except: pass` ile yutmak | İş kaybolur, kimse fark etmez | `dead_letter=true`; DLQ görünür + alarm |
| Kuyruğu global (tenant'sız) yapmak | Bir tenant komşusunu boğar | Rate-limit/queue default `tenant`-scope |
| İşi outbox'tan ayrı transaction'da kuyruklamak | Yazma commit olur, iş kuyruklanmazsa dual-write | Domain kaydı + enqueue aynı `session.commit()` |
| AI'ın işi onaysız prod'a uygulaması | Denetim/guardrail kaybolur | `approval_ref` zorunlu; AI yalnız *önerir* |

## 14. Definition of Done

- `platform_worker` (`Job`/`Task`/`Schedule`) §5 tablolarıyla uyumlu; Celery/ARQ + Redis entegrasyonu ayakta; Alembic migration expand-contract ve downgrade çalışıyor.
- `check-worker-contract.mjs` yazıldı, `deploy.yml`'a bloklayıcı adım olarak eklendi: `enqueue`'suz thread/cron açan görev, `idempotent` beyansız yazan görev reddediliyor.
- Bölüm 11 beş testi yeşil; Bölüm 12 acceptance criteria karşılandı.
- Retry+backoff, dead-letter, circuit breaker, tenant-scope rate-limit, zamanlanmış iş ve background-job o11y çalışır durumda.
- AI-guardrail testli: AI onaysız prod-write işi tetikleyemiyor (`approval_ref` insan); kill-switch AI işlerini durduruyor; ruleset override edilemiyor (`backendOnly`).
- `core-contract-pack.md` §2.3 (outbox) / §2.9 (o11y) ve `scale-invariant-directive.md` idempotency ilişkisi bu yönergeyle çelişmiyor.

## 15. Requirement-ID tablosu

Her kural bir izlenebilir kimliğe bağlanır; kapı/test bu kimliği referans alır.

| ID | Gereksinim | Zorlayan |
|---|---|---|
| KW-1 | Uzun/tekrarlı/zamanlanmış iş HTTP döngüsünden ayrılıp `enqueue` ile kuyruklanır | `check-worker-contract` |
| KW-2 | Her `Job`/`Schedule` `tenant_id` taşır; iş tenant-izole çalışır | `check-worker-contract` + Test-4 |
| KW-3 | Geçici hata retry+exponential backoff ile tekrar denenir | `check-worker-contract` + Test-1 |
| KW-4 | `idempotent` görevde retry tek etkiye iner (idempotency-key) | Test-1 + scale-invariant |
| KW-5 | Tavana varan iş dead-letter'a taşınır (silinmez, görünür, replay'lenir) | `check-worker-contract` + Test-2 |
| KW-6 | Çöken bağımlılıkta circuit breaker boğulmayı keser | Test-3 |
| KW-7 | Zamanlanmış iş cron/interval + overlap-policy ile tetiklenir | `check-worker-contract` |
| KW-8 | Rate-limit/queue varsayılan tenant kapsamlıdır (noisy-neighbor) | `check-worker-contract` + Test-4 |
| KW-9 | Her iş durumu/metrigi o11y'ye yansır (background-job görünürlüğü) | `check-worker-contract` |
| KW-10 | AI prod-yazan işi onaysız tetikleyemez; kill-switch AI işini durdurur | CI + AI-guardrail testi |

## 16. PIM-v2 karşılığı

PIM-v2 Gereksinim Analizi'nde k-worker'ın somut karşılıkları:

| PIM-v2 konumu | k-worker karşılığı |
|---|---|
| §3.1 Görev kuyruğu: **Celery + Redis (veya ARQ)** — "AI enrichment, sync, medya, export gibi arka plan işleri" | k-worker'ın tam gerekçesi; motor budur |
| §5 NFR Dayanıklılık: "Retry+backoff, circuit breaker (webhook/kanal), dead-letter queue" | §7 backend deseni (retry/breaker/DLQ) ve KW-3/KW-5/KW-6 |
| §5 NFR Ölçeklenebilirlik: "arka plan işleri worker'lara offload" | §1 amaç + KW-1 |
| Faz 5 AI: `process_pending_enrichments`, `expire_old_approvals`, `refresh_translation_memory`, batch job | `ai_enrichment` türü (§2) |
| Faz 6-7 Sync/MDM: kuyruk tabanlı ERP/GDSN sync, `scan_for_duplicates`; retry/dead-letter | `sync` türü (§2) |
| Faz 8 Medya: `generate_pending_variants`, `cleanup_orphan_media` (batch + async) | `media` türü (§2) |
| Faz 6/11 Export: XLSX/BMEcat/UBL/GS1 + `print_catalog` (baskıya hazır PDF) | `export` türü (§2) |
| Faz 11 Analitik: `monitor_price_parity`, `capture_shelf_snapshots`, `track_search_rankings`, `generate_weekly_summary` | `analytics` türü (§2) |
| §5 NFR Gözlemlenebilirlik: structlog + OpenTelemetry + Prometheus | §7/§10 background-job görünürlüğü ve KW-9 |
| Faz 5 AI maliyet: "token & maliyet tahmini", onay kuyruğu, Mock provider | §9 ajan maliyeti / kill-switch bağı |

---

*Bağlı: `docs/core-contract-pack.md` §2.3 (outbox) / §2.7 (workflow ayrımı) / §2.9 (o11y) — kod karşılığı; `docs/scale-invariant-directive.md` — idempotency/outbox ilişkisi; `docs/reference/PIM-v2-Gereksinim-Analizi.md` §3.1/§5/Faz 5-11 — iş türleri; WBS düğümü: `src/data/generated/nodes/k-worker.json`.*
