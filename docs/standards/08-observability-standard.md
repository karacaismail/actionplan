# 08 — Gözlemlenebilirlik Standardı (o11y)

Sürüm: 1.0 — 2026-07-01
Durum: Anlatı standardı. Mevcut makine kontratı `src/data/standards/observability.json`'ı *tamamlar*, yerini almaz.
Makine kontratı (MEVCUT, zorlanır): `src/data/standards/observability.json` — 10 kural (structured-logging, correlation-id, RED/USE, tracing, dashboards, SLO-alert, audit-events, log-levels, PII-safe, prod-error-evidence).
Aile: `devops` · Öncelik: P0 · `standardRefs.observabilityRef` · CI kapısı: `check-standards-coverage` (referans bütünlüğü).

---

## 0. Bu Standart Neyi Tamamlar

o11y reponun *en olgun* sözleşmelerinden biridir: `observability.json` yapısal JSON log, correlation/request id, RED/USE metrik, dağıtık trace, dashboard-as-code, SLO/error-budget alert, değişmez audit event, log seviyesi disiplini, PII-güvenli loglama ve production hata kanıtı formatını **zaten tanımlar ve zorlar**. Bu anlatı o kuralların değerlerini yeniden yazmaz; onların *anlamını*, stack karşılığını (FastAPI/React/SQLAlchemy) ve makine kontratında ayrıntısı verilmeyen üç operasyonel yüzeyi ekler: healthcheck/readiness, background-job görünürlüğü ve admin observability ekranı. Ayrıca API error taxonomy'nin `data-api-contract` hata zarfıyla nasıl köprülendiğini gösterir.

Aşağıdaki tablo bu dokümandaki her konunun sahibini ve rolünü ayırır.

| Konu | Sahibi | Bu dokümanda |
|---|---|---|
| Yapısal JSON log + merkezî logger | `observability.json` (`obs-structured-logging`) | Referans — §2, print() yasağı vurgulanır |
| request_id / correlation_id / trace_id | `observability.json` (`obs-correlation-id`, `obs-distributed-tracing`) | Referans — §3, üç-id ayrımı netleştirilir |
| RED / USE metrik + kardinalite kuralı | `observability.json` (`obs-red-use-metrics`) | Referans — §5 |
| Değişmez audit event | `observability.json` (`obs-audit-events`) | Referans — §6, WBS 13.2 `s-audit` bağı |
| SLO / error-budget alert + runbook | `observability.json` (`obs-alerting-slo-error-budget`) | Referans — §8 |
| Log seviyesi disiplini | `observability.json` (`obs-log-levels`) | Referans — §2 |
| PII-güvenli loglama | `observability.json` (`obs-pii-safe-logging`) | Referans — §2 |
| Production hata kanıtı | `observability.json` (`obs-prod-error-evidence`) | Referans — §9 |
| Healthcheck / readiness | o11y anlatı (tamamlar) | §4 — tanımlanır |
| Background-job görünürlüğü | o11y anlatı (tamamlar) | §7 — tanımlanır |
| API error taxonomy köprüsü | o11y + `data-api-contract` | §10 — köprü tanımlanır |
| Admin observability ekranı | o11y anlatı (tamamlar) | §11 — tanımlanır |

---

## 1. Neden o11y P0

Bir sistemin production'da ne yaptığını bilmeden destek verilemez, olay çözülemez ve regresyon yakalanamaz. o11y bu yüzden P0'dır (sistemsiz çalışmaz): üç sütun — structured log, metrik, distributed trace — bir kullanıcı işlemini uçtan uca izlenebilir kılar. `numeronym-siniflandirma.md` o11y'yi `devops`/must/P0 olarak sınıflar ve kabul kriterini "hata → doğru taxonomy + trace_id yayılır" olarak verir; bu doküman o kriteri operasyonel yüzeylere genişletir. Enterprise DoD (`enterprise-dod.md` §2.8) da observability'yi bir teslim katmanı olarak zorunlu kılar.

---

## 2. Yapısal Loglama ve print() Yasağı

Tüm loglar yapısal JSON'dur ve merkezî bir logger üzerinden yazılır; bu `obs-structured-logging` (referans) kuralının tanımıdır. Bu standardın en somut backend yaptırımı: `print()` yasaktır — her log `get_logger()` (structured logger) üzerinden geçer. Serbest-metin log, string-birleştirmeli mesaj ve çağrı-yerinde elle JSON kurma yasaktır. Log seviyeleri `obs-log-levels` (referans) disiplinine, PII redaksiyonu `obs-pii-safe-logging` (referans) kuralına uyar.

Uygulama şu şekilde yapılır: backend'de `print()`/serbest `logging` yerine merkezî `get_logger()` çağrılır; her log kaydı en az `timestamp` (ISO8601), `level`, `message`, `service`, `env` ve bağlam alanları (§3) taşır. Frontend'de `console.log` ile serbest-metin loglama yerine merkezî error/telemetry client kullanılır. PII (parola, token, ham e-posta/telefon, kimlik no) merkezî logger'da allowlist/denylist ile redakte edilir.

Aşağıdaki tablo yasak ve zorunlu loglama pratiklerini verir.

| Yasak | Zorunlu | Zorlama |
|---|---|---|
| `print(...)` (BE) | `get_logger().info(...)` | review + `print(` grep taraması |
| `console.log` serbest-metin (FE) | merkezî telemetry client | `biome (noConsoleLog)` (referans) |
| String-birleştirmeli mesaj | yapısal alan (key/value) | review |
| Ham request body/header log | redakte edilmiş allowlist | logger redaksiyon testi (referans) |

---

## 3. Üç Kimlik — request_id, correlation_id, trace_id

Her istek üç kimlikle izlenir ve bu kimlikler tüm loglara, hata zarfına ve aşağı-akış çağrılarına yayılır. Bu, `obs-correlation-id` (log/hata zarfı yayılımı) ve `obs-distributed-tracing` (traceparent yayılımı) kurallarının (referans) birleşik anlamıdır. Bu doküman üç kimliğin ayrımını netleştirir çünkü karıştırılmaları izlenebilirliği bozar.

Aşağıdaki tablo üç kimliğin rolünü ayırır.

| Kimlik | Kapsam | Kaynak | Nereye taşınır |
|---|---|---|---|
| `request_id` | Tek HTTP isteği | Gelen istekte yoksa üretilir | O isteğin tüm logları |
| `correlation_id` | Bir kullanıcı işlemi (çok istek) | İlk istekte üretilir, zincir boyu taşınır | Loglar + GraphQL `extensions.correlationId` + aşağı-akış header |
| `trace_id` | Dağıtık trace (OpenTelemetry) | traceparent header | Span'lar + log'a köprü (correlation ile) |

Uygulama şu şekilde yapılır: FastAPI middleware her istekte `request_id` üretir/okur ve bir istek-bağlamına (ContextVar) koyar; `correlation_id` gelen header'dan alınır veya üretilir ve aynı bağlama yazılır; OpenTelemetry `trace_id`'yi traceparent'tan çıkarır. Merkezî logger bu üç alanı her log kaydına otomatik ekler; correlation taşımayan istek-kapsamlı log yasaktır (`obs-correlation-id`, referans).

---

## 4. Healthcheck ve Readiness

Servis iki ayrı sağlık ucu sunar: liveness (`/health` — süreç ayakta mı) ve readiness (`/ready` — trafiği kabul etmeye hazır mı, bağımlılıkları erişilebilir mi). Bu ayrım load balancer ve orkestratörün (Docker Compose/Swarm) doğru davranması için gereklidir: liveness başarısız olursa süreç yeniden başlatılır, readiness başarısız olursa trafik yönlendirilmez ama süreç öldürülmez.

Uygulama şu şekilde yapılır: `/health` süreç-içi kontrol döner (JSON, `status: "ok"`); `/ready` kritik bağımlılıkları (PostgreSQL bağlantısı, kuyruk, kritik dış servis) yoklar ve biri erişilemezse `status: "degraded"` + hangi bağımlılığın düştüğünü döner. Sağlık uçları PII/sır sızdırmaz ve hafiftir (ağır sorgu koşturmaz).

Aşağıdaki tablo iki sağlık ucunu ayırır.

| Uç | Sorusu | Başarısızlıkta | Yanıt |
|---|---|---|---|
| `/health` (liveness) | Süreç ayakta mı? | Orkestratör yeniden başlatır | `{status: "ok"}` |
| `/ready` (readiness) | Trafiğe hazır mı? | LB trafiği kesme; süreç yaşar | `{status, dependencies: {db, queue, ...}}` |

---

## 5. RED / USE Metrikleri

Servisler RED metriklerini (Rate, Errors, Duration) her endpoint/resolver için, kaynaklar USE metriklerini (Utilization, Saturation, Errors) yayınlar; bu `obs-red-use-metrics` (referans) kuralının tanımıdır. Kritik kural: yüksek-kardinaliteli etiket (ham id, e-posta, serbest metin) metrik label'ı olarak yasaktır (metrik sistemini şişirir). Bu doküman değeri tekrar etmez; yalnızca RED/USE'un neyi ölçtüğünü ve dashboard/alert ile nasıl köprülendiğini (§8, §11) bağlamlar.

Uygulama şu şekilde yapılır: FastAPI middleware/instrumentation her endpoint için istek sayısı, hata sayısı (stabil error-code etiketiyle) ve süre histogramı (p50/p95/p99 türetilebilir) yayınlar; kaynak metrikleri (CPU/mem/bağlantı havuzu doygunluğu) USE ekseninde toplanır. Label kardinalitesi allowlist ile sınırlanır.

---

## 6. Değişmez Audit Event

Güvenlik/iş açısından önemli eylemler (yetki değişimi, silme, dışa aktarım, tenant geçişi, ödeme) değişmez (append-only) audit event olarak kaydedilir; bu `obs-audit-events` (referans) kuralının tanımıdır. Audit kaydı normal uygulama loguna karışmaz, ayrı ve değiştirilemez bir akışa yazılır. Bu, `numeronym-siniflandirma.md` §3 ve `00-standards-index.md` §5'te WBS 13.2 `s-audit` düğümüne bağlanan izin-kanıt izidir: o11y'nin `audit_events` tablosu `s-audit` düğümünün veri temelidir.

Uygulama şu şekilde yapılır: kritik eylem bir audit event üretir (`actor`, `action`, `resource`, `tenant_id`, `timestamp`, `correlation_id`, `result`); kayıt SQLAlchemy append-only tabloya (UPDATE/DELETE yetkisi olmayan) yazılır ve uygulama kodu tarafından değiştirilemez. Audit sorgusu (belirli zaman aralığı için rapor) admin observability ekranından (§11) veya API'den erişilebilir.

Aşağıdaki tablo audit event zorunlu alanlarını verir.

| Alan | Anlamı |
|---|---|
| `actor` | Eylemi yapan kimlik |
| `action` | Yapılan işlem (kebab, ör. `permission.granted`) |
| `resource` + `resource_id` | Etkilenen kaynak |
| `tenant_id` | Kiracı bağlamı |
| `timestamp` | ISO8601 |
| `correlation_id` | İşlem izleme köprüsü |
| `result` | Başarı/başarısızlık |

---

## 7. Background-Job Görünürlüğü

Asenkron işler (Celery/RQ görevleri: import/export, e-posta, webhook teslimatı, rapor üretimi) görünür ve izlenebilir olmalıdır; senkron istek görünürlüğü kadar zorunludur. Bu, makine kontratında ayrıntısı verilmeyen ve bu anlatının eklediği operasyonel yüzeydir: bir background job'ın başladığı, ilerlediği, başarıldığı/başarısız olduğu ve hangi correlation_id'ye ait olduğu gözlemlenebilir olmalıdır.

Uygulama şu şekilde yapılır: her background job tetikleyen isteğin `correlation_id`'sini devralır ve job başlangıç/bitiş/hata'sını yapısal log + RED-benzeri metrik (job sayısı, hata sayısı, süre) ile yayınlar; başarısız job üstel backoff ile yeniden denenir ve tükenince dead-letter'a düşer (i14y §3 webhook retry ile aynı desen). Job durumu (queued/running/succeeded/failed) sorgulanabilir tutulur.

Aşağıdaki tablo background-job görünürlük gereksinimini verir.

| Sinyal | Kaynak | Amaç |
|---|---|---|
| Job start/end log | structured log + correlation_id | İşi tetikleyen isteğe bağlama |
| Job RED metrik | job sayısı/hata/süre | Kuyruk sağlığı |
| Job durumu | queued/running/succeeded/failed | Admin ekran + retry kararı |
| Dead-letter | tükenmiş retry | Manuel müdahale görünürlüğü |

---

## 8. Alerting — SLO ve Error-Budget

Uyarılar ham eşik yerine belge halindeki SLO'lara ve error-budget tüketim hızına (burn-rate) bağlanır ve her alert bir runbook + owner + önem derecesi taşır; bu `obs-alerting-slo-error-budget` (referans) kuralının tanımıdır. Runbook'suz veya gürültülü (sürekli tetikleyen) alert yasaktır. Bu doküman değeri tekrar etmez; alert'in RED metriği (§5) ve dashboard (§11) ile nasıl köprülendiğini bağlamlar: alert kullanıcı-etkili bir SLI (ör. p99 latency, hata oranı) üzerinden tanımlanır, panelde error-budget tüketimi görünür.

---

## 9. Production Hata Kanıtı

Bir production hatası ancak kanıtla "çözüldü" sayılır: ilgili log/trace/metrik bağlantısı, `correlation_id`, etki penceresi ve düzeltmeyi doğrulayan sinyal (hata oranı normale döndü) bir kanıt formatında kaydedilir; bu `obs-prod-error-evidence` (referans) kuralının tanımıdır. Kanıtsız "düzeltildi" kabul edilmez ve tekrar etmemesi için bir alert veya regresyon testi eklenir. Bu, `quality-gates` ve `testing-strategy`'deki test-önce/regresyon disiplininin operasyon tarafındaki karşılığıdır.

---

## 10. API Error Taxonomy Köprüsü

o11y'nin gözlemlediği hatalar `data-api-contract`'ın standart hata zarfıyla (`data-error-envelope`, referans) ve i14y'nin REST/HTTP eşlemesiyle (`07-api-interoperability-standard.md` §10) aynı taksonomiyi paylaşır. Kritik köprü: her hata zarfı `correlationId` taşır, böylece istemciye dönen bir hata koduyla (`code`) sunucudaki log/trace/metrik tek `correlation_id` üzerinden eşleşir. Bu, "hata → doğru taxonomy + trace_id yayılır" (`numeronym-siniflandirma.md` kabul kriteri) koşulunun tam karşılığıdır.

Uygulama şu şekilde yapılır: bir resolver/endpoint hata döndürdüğünde standart zarf (`code`, `correlationId`) üretilir; aynı `correlation_id` ile bir yapısal ERROR log ve (mümkünse) bir trace span kaydedilir; hata metriği stabil `code` etiketiyle sayılır. İstemci `code` ile dallanır, destek ekibi `correlationId` ile log/trace'e iner.

Aşağıdaki tablo köprünün üç ucunu hizalar.

| Uç | Alan | Ortak anahtar |
|---|---|---|
| İstemci yanıtı | `errors[].extensions.code` (referans: `data-error-envelope`) | `correlationId` |
| Sunucu logu | yapısal ERROR log (`level: error`, `code`) | `correlation_id` |
| Trace | span (hata işaretli) | `trace_id` ↔ correlation köprüsü |

---

## 11. Admin Observability Ekranı

Operasyon ekibinin sisteme bakabildiği bir admin observability ekranının temel yapısı bulunur: canlı sağlık (§4), RED grafikleri + SLO/error-budget tüketimi (§5, §8), background-job kuyruğu ve dead-letter (§7), audit event sorgusu (§6) ve bir `correlation_id`/`trace_id` ile istekten-yanıta akışı çözme. Bu ekran, makine kontratının `obs-dashboards` (dashboard-as-code, referans) kuralını bir ürün-içi operasyon yüzeyine genişletir.

Uygulama şu şekilde yapılır: admin ekranı React (TanStack Query + Table) ile kurulur ve gözlemlenebilirlik verisini yalnız yetkili (admin permission, `dimensions.security`) kullanıcılara sunar; ham metrik/log altyapısı (Prometheus/OpenMetrics, trace store) dashboard-as-code ile repoda tanımlıdır, admin ekranı onun ürün-içi görünümüdür. Ekran PII sızdırmaz (redakte edilmiş loga bakar).

Aşağıdaki tablo admin ekranının panellerini verir.

| Panel | Kaynak | Erişim |
|---|---|---|
| Sağlık (liveness/readiness) | `/health`, `/ready` (§4) | admin |
| RED + SLO/error-budget | metrik + alert (§5, §8) | admin |
| Background-job + dead-letter | job durumu (§7) | admin |
| Audit event sorgusu | `audit_events` tablo (§6) | admin (yetki-korumalı) |
| İşlem izleme | correlation_id/trace_id akışı (§3, §10) | admin |

---

## 12. FastAPI + React + SQLAlchemy Karşılıkları

Aşağıdaki tablo bu standardın somut stack karşılıklarını verir; Next.js/Supabase/Prisma referansı yasaktır.

| o11y kuralı | FastAPI (BE) | React (FE) | SQLAlchemy / PostgreSQL |
|---|---|---|---|
| Yapısal log + print() yasağı | `get_logger()` (structlog/JSON) | merkezî telemetry client | — |
| Üç kimlik yayılımı | ContextVar + OTel middleware | `correlationId` header ekle | — |
| Healthcheck/readiness | `/health`, `/ready` route | durum göstergesi | `SELECT 1` bağlantı yoklaması |
| RED/USE metrik | Prometheus instrumentation | Web Vitals telemetry | havuz doygunluğu metriği |
| Audit event | append-only servis | admin audit görünümü | `audit_events` (UPDATE/DELETE yok) tablo |
| Background-job görünürlüğü | Celery/RQ + job log/metrik | job durumu paneli | `job_runs` durum tablosu |
| API error taxonomy köprüsü | hata zarfı + correlation log | `code` ile dallanma | — |
| Admin observability ekranı | metrik/log API (yetki-korumalı) | TanStack Query + Table | audit/job sorguları |

---

## 13. İlgili Kanonik Dokümanlar

| Doküman | Yol | Rolü |
|---|---|---|
| Gözlemlenebilirlik (makine) | `src/data/standards/observability.json` | Bu anlatının *tek doğruluk kaynağı*: 10 zorlanabilir kural |
| API & Interoperability | `docs/standards/07-api-interoperability-standard.md` | Webhook/import background-job + hata zarfı köprüsü |
| Veri & API Sözleşmesi (makine) | `src/data/standards/data-api-contract.json` | `data-error-envelope` — API error taxonomy kaynağı |
| Numeronym sınıflandırması | `docs/standards/numeronym-siniflandirma.md` | o11y `devops`/must/P0; audit → WBS 13.2 `s-audit` bağı |
| Enterprise DoD | `docs/enterprise-dod.md` | §2.8 observability teslim katmanı kriterleri |

---

## 14. Doküman-Kontrat Drift Notu (check-observability)

`enterprise-standards-audit-2026-07-01.md` §Ek'te saptandığı gibi `check-observability` kapısı `deploy.yml`'de henüz koşmuyor; observability referans bütünlüğü bugün `check-standards-coverage` (observabilityRef çözülür) ile, kuralların davranışı ise review + test ile zorlanır. Bu anlatı yeni bir kapı ilan etmez; mevcut `observabilityRef` bağını ve `observability.json` kurallarını *anlatır*. Bir log-format lint kapısı ileride eklenirse `observability.json` kurallarının `check` alanları güncellenir; anlatı otomatik olarak aynı sözleşmeyi işaret ettiği için tutarlı kalır.

---

## 15. Requirement-ID Tablosu

Aşağıdaki tablo o11y kurallarını izlenebilir Requirement-ID'lere döker; `observability.json`'a referanslı satırlar "Layer" sütununda kaynak kural-id'siyle işaretlidir, bu anlatının eklediği operasyonel yüzeyler (healthcheck, background-job, admin ekran) yeni satırlardır. Öncelik P0 (sistemsiz çalışmaz) → P3 (opsiyonel).

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| O11Y-01 | Tüm loglar yapısal JSON; `print()`/serbest-metin log yasak, merkezî `get_logger()` | backend | P0 | unit | `print(` grep temiz; log JSON şemasına uyar (ref: obs-structured-logging) | platform-ops |
| O11Y-02 | Frontend `console.log` serbest-metin yasak; merkezî telemetry client | frontend | P1 | unit | biome noConsoleLog yeşil (ref: obs-structured-logging) | frontend-platform |
| O11Y-03 | `request_id` her istekte üretilir/okunur ve o isteğin tüm loglarına eklenir | backend | P0 | integration | request_id taşımayan istek-log yok | platform-ops |
| O11Y-04 | `correlation_id` işlem boyu taşınır (log + GraphQL extensions + aşağı-akış header) | backend | P0 | integration | Middleware testi: correlation her log + hata zarfında (ref: obs-correlation-id) | platform-ops |
| O11Y-05 | `trace_id` OpenTelemetry ile yayılır; span → log köprüsü | backend | P1 | integration | traceparent dış çağrıda mevcut (ref: obs-distributed-tracing) | platform-ops |
| O11Y-06 | `/health` (liveness) süreç sağlığı döner | infra-ops | P0 | e2e | `/health` `{status:"ok"}` döner | platform-ops |
| O11Y-07 | `/ready` (readiness) kritik bağımlılıkları yoklar; düşükte degraded | infra-ops | P0 | integration | Bağımlılık düşünce `/ready` degraded + hangi bağımlılık | platform-ops |
| O11Y-08 | RED metrik her endpoint/resolver; USE kaynak metrikleri; kardinalite sınırı | backend | P1 | integration | Yüksek-kardinalite label yok; p95/p99 türetilebilir (ref: obs-red-use-metrics) | platform-ops |
| O11Y-09 | Kritik eylemler değişmez audit event (zorunlu alanlar) olarak kaydedilir | backend | P0 | integration | Kritik eylem → append-only kayıt + tüm alanlar (ref: obs-audit-events) | security-platform |
| O11Y-10 | Audit event WBS 13.2 `s-audit` veri temeli; `correlation_id` taşır | backend | P1 | integration | Audit kaydı correlation_id ile işleme bağlanır | security-platform |
| O11Y-11 | Background-job start/end/hata görünür (log + metrik + correlation devralır) | backend | P1 | integration | Job logu tetikleyen correlation_id'yi taşır; durum sorgulanabilir | platform-ops |
| O11Y-12 | Background-job retry + dead-letter görünürlüğü | backend | P2 | integration | Tükenmiş retry dead-letter'a düşer ve görünür | platform-ops |
| O11Y-13 | Alert SLO/error-budget burn-rate'e bağlı + runbook + owner | infra-ops | P1 | review | Ham-eşik alert yok; her alert runbook+owner (ref: obs-alerting-slo-error-budget) | platform-ops |
| O11Y-14 | Log seviyeleri disiplinli (ERROR/WARN/INFO/DEBUG doğru kullanılır) | backend | P2 | review | Beklenen iş-hatası ERROR loglanmaz (ref: obs-log-levels) | platform-ops |
| O11Y-15 | PII/sır loglara/metriklere yazılmaz; merkezî redaksiyon | backend | P0 | unit | PII alanları maskeli; ham body log yok (ref: obs-pii-safe-logging) | security-platform |
| O11Y-16 | API error taxonomy köprüsü: hata `code` + `correlation_id` log/trace ile eşleşir | api-contract | P0 | integration | İstemci `code` ↔ sunucu log correlation_id aynı (ref: data-error-envelope) | api-platform |
| O11Y-17 | Production hata "çözüldü" ancak kanıt (correlation/sinyal/regresyon) ile | devops | P1 | review | Kanıtsız kapanış reddedilir; regresyon test/alert eklenir (ref: obs-prod-error-evidence) | platform-ops |
| O11Y-18 | Admin observability ekranı (sağlık/RED/SLO/job/audit/izleme, yetki-korumalı) | frontend | P2 | e2e | Ekran yalnız admin'e görünür; PII sızmaz; correlation ile akış çözülür | frontend-platform |
| O11Y-19 | Dashboard-as-code: panel tanımı repoda sürümlü (elle-kurulan sayılmaz) | devops | P2 | review | Repoda dashboard tanım dosyası var (ref: obs-dashboards) | platform-ops |

Bu dosya bir anlatı standardıdır; kural değerlerini `src/data/standards/observability.json` sözleşmesinden devralır veya ona referans verir, kopyalamaz. Kural değişince yalnız JSON güncellenir; anlatı aynı sözleşmeyi işaret ettiği için tutarlı kalır.
