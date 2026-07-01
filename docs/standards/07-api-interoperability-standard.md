# 07 — API & Birlikte-Çalışabilirlik Standardı (i14y)

Sürüm: 1.0 — 2026-07-01
Durum: Anlatı standardı. `docs/standards/00-standards-index.md` §3'teki `i14y (interoperability)` satırının insan-okur karşılığı.
Makine kontratı (YENİ, hedef): `src/data/standards/i14y.json` — `plan-02` PROMPT 3/11 ile üretilir; bu anlatı ile birlikte merge edilir.
İlişkili mevcut kontrat: `src/data/standards/data-api-contract.json` (GraphQL codegen, cursor pagination, idempotency-key, hata zarfı, RLS burada TANIMLI ve zorlanır).
Aile: `data` · Öncelik: P1 · CI kapısı (hedef): `check-core-contract`.

---

## 0. Bu Standart Neyi Kapsar, Neyi Kapsamaz

Bu anlatı, i14y'nin (interoperability — sistemlerin birbiriyle sözleşmeli konuşması) reponun mevcut sözleşme sistemine nasıl oturduğunu açıklar; kural değerlerini yeniden yazmaz, `src/data/standards/*.json` sözleşmelerine referans verir. i14y bir *çatı* standardıdır: mevcut `data-api-contract` içindeki API/veri kuralları (GraphQL SDL + codegen, cursor pagination, idempotency-key, standart hata zarfı, RLS izolasyonu) i14y'nin *tabanıdır* ve orada tanımlıdır. Bu doküman o tabanı tekrar etmez; onun *üstüne* i14y'ye özgü sistem-arası entegrasyon katmanını (stable versioning, imzalı/retry'li webhook, import/export sözleşmesi, SDK-generation hazırlığı, REST tutarlılığı, rate-limit görünürlüğü, GraphQL depth/complexity/DataLoader) ekler.

Aşağıdaki tablo bu standardın hangi konuyu *tanımladığını* (i14y sözleşmesi) ve hangisini *devraldığını* (mevcut sözleşmeye referans) net ayırır.

| Konu | Sahibi | Bu dokümanda |
|---|---|---|
| GraphQL SDL + typed codegen | `data-api-contract` (`data-graphql-schema-codegen`) | Referans — §5'te DataLoader/depth ile tamamlanır |
| Cursor pagination + first/last sınırı | `data-api-contract` (`data-cursor-pagination`) | Referans — §7'de filter/sort ile tamamlanır |
| Idempotency-Key temeli | `data-api-contract` (`data-idempotency-key`) | Referans — §8'de retry-safe kapsamla genişletilir |
| Standart hata zarfı (errors[].extensions.code) | `data-api-contract` (`data-error-envelope`) | Referans — §10'da REST/HTTP tarafına genişletilir |
| Sınırda Zod/Pydantic doğrulama | `data-api-contract` (`data-zod-boundary-validation`) | Referans — webhook gövdesi §3'te aynı sınıra girer |
| OpenAPI-first REST sözleşmesi | i14y (YENİ) | §2, §6 — tanımlanır |
| Stable API versioning + deprecation | i14y (YENİ) | §4 — tanımlanır |
| İmzalı + retry'li webhook | i14y (YENİ) | §3 — tanımlanır |
| Import/export sözleşmesi | i14y (YENİ) | §9 — tanımlanır |
| SDK-generation hazırlığı | i14y (YENİ) | §6 — tanımlanır |
| Rate-limit header görünürlüğü | i14y (YENİ) + `edge-security` (enforcement) | §11 — sözleşme yüzeyi burada |

---

## 1. Neden i14y Ayrı Bir Standart

i14y, ürünün *dışarıyla* konuştuğu her yüzeyin (public/partner API, webhook, import/export, SDK) tek bir tutarlı sözleşmeye uymasını garanti eder. `data-api-contract` ürünün *iç* veri/API disiplinini (şema, ORM, migration, izolasyon) kilitler; i14y ise bu iç sözleşmenin *dışa açılan* biçimini standartlaştırır. İkisi ayrı olmalıdır çünkü iç şema değişebilir ama dış sözleşme (bir partner'ın entegre olduğu API sürümü, bir webhook imza formatı) geriye-uyumluluk taahhüdü taşır. Bu ayrım olmadan, iç refactor bir partner entegrasyonunu sessizce kırar.

Bu standart 50+ enterprise app fabrikasında tek bir entegrasyon dili kurar: her app aynı versioning kuralına, aynı webhook imza şemasına, aynı cursor pagination biçimine ve aynı hata zarfına uyar; böylece bir müşteri bir app için yazdığı entegrasyon kodunu diğerine taşıyabilir.

---

## 2. OpenAPI-First REST Sözleşmesi

REST yüzeyi (webhook alıcıları, import/export uçları, GraphQL dışı servis-servis çağrıları) OpenAPI 3.1 sözleşmesinden türetilir; sözleşme koddan *önce* yazılır ve tek doğruluk kaynağıdır. FastAPI'nin ürettiği OpenAPI şeması repoda `openapi.json` olarak sürümlenir; her endpoint request/response modeli Pydantic ile tanımlı olduğundan şema koddan otomatik türer, elle yazılmaz. İstemci tarafı (typed SDK) bu şemadan codegen ile üretilir; elle yazılmış REST istemci tipi yasaktır.

Aşağıdaki tablo OpenAPI-first akışının hangi katmanda ne ürettiğini gösterir.

| Katman | Kaynak | Üretilen | Zorlama |
|---|---|---|---|
| Sözleşme | FastAPI route + Pydantic model | `openapi.json` (3.1, sürümlü) | `check-core-contract`: şema diff temiz |
| İstemci | `openapi.json` | typed SDK (generated/) | codegen `--check` temiz, elle düzenleme yasak |
| Doğrulama | Pydantic (BE) + Zod (FE sınırı) | request/response parse | `data-zod-boundary-validation` (referans) |

Uygulama şu şekilde yapılır: yeni bir REST ucu önce Pydantic request/response modeliyle FastAPI route olarak tanımlanır, `openapi.json` yeniden üretilir, ardından istemci codegen koşar. Şema kırıcı değişiklik taşıyorsa (§4) build bloklanır.

---

## 3. Webhook Mimarisi — İmzalı ve Retry'li

Ürün dışa olay yayınladığında (kaynak oluşturuldu/güncellendi/silindi, ödeme tamamlandı) webhook gönderir; her webhook imzalı ve teslim garantili bir sözleşmeye uyar. Webhook gövdesi, gelen tarafta `data-zod-boundary-validation` (referans) ile aynı sınır-doğrulamasına tabidir; imza doğrulanmadan gövde iş katmanına geçemez.

İmza şu şekilde uygulanır: her webhook payload'ı bir HMAC-SHA256 imzasıyla (`X-Signature` header, `sha256=...` biçimi) ve bir timestamp header'ıyla (`X-Timestamp`, replay penceresi ≤ 5 dk) gönderilir; alıcı imzayı paylaşılan secret ile yeniden hesaplayıp sabit-zamanlı karşılaştırır. Teslimat şu şekilde uygulanır: başarısız teslimat (2xx dışı yanıt veya timeout) üstel geri-çekilmeyle (exponential backoff: 1s, 2s, 4s, ... azami N deneme) yeniden denenir; her webhook bir olay-id taşır ve alıcı bu id ile idempotent tüketir (§8). Teslim edilemeyen olaylar bir dead-letter kaydına düşer ve manuel yeniden-gönderim yolu vardır.

Aşağıdaki tablo webhook sözleşmesinin zorunlu alanlarını verir.

| Alan | Amaç | Zorunluluk |
|---|---|---|
| `event_id` (UUID) | Idempotent tüketim anahtarı | must |
| `event_type` (kebab, ör. `order.created`) | Olay dallanması | must |
| `X-Signature` (HMAC-SHA256) | Kaynak doğrulama | must |
| `X-Timestamp` (ISO8601) | Replay koruması | must |
| `delivery_attempt` (int) | Retry görünürlüğü | should |
| dead-letter + manuel replay | Teslim garantisi | must |

---

## 4. Stable API Versioning ve Deprecation

Dışa açılan her API sürümlenir ve kırıcı (breaking) değişiklik geriye-uyumluluk penceresi olmadan yayınlanmaz. REST için sürüm URL-prefix ile (`/api/v1/...`) taşınır; GraphQL için alan-bazlı `@deprecated` direktifi ve şema evrimi (alan ekleme geriye-uyumlu, alan kaldırma deprecation sonrası) kullanılır. Kırıcı değişiklik CI'da şema diffing (REST için `openapi.json` diff, GraphQL için schema diff) ile yakalanır ve deprecation notu olmadan build'i bloklar.

Uygulama şu şekilde yapılır: kırıcı bir değişiklik gerektiğinde önce yeni sürüm/alan geriye-uyumlu eklenir (expand), eski sürüm `@deprecated` işaretlenir ve bir kaldırma tarihi/penceresi ilan edilir; tüketiciler taşındıktan sonra ayrı bir değişiklikte eski yol kaldırılır (contract). Bu, `data-api-contract`'ın `data-migration-expand-contract` kuralının API yüzeyine yansımasıdır.

Aşağıdaki tablo değişiklik türlerini sınıflandırır.

| Değişiklik türü | Örnek | Politika |
|---|---|---|
| Uyumlu (additive) | Yeni opsiyonel alan, yeni endpoint | Anında yayınlanır |
| Deprecation | Alan `@deprecated`, kaldırma tarihi ilan | Pencere ≥ 1 sürüm/duyuru |
| Kırıcı (breaking) | Alan kaldırma, tip daraltma, zorunlu alan ekleme | Yeni sürüm + expand-contract; diff kapısı bloklar |

---

## 5. GraphQL — Depth, Complexity ve DataLoader

GraphQL yüzeyi (Strawberry resolver, `data-graphql-schema-codegen`'e referans) kötü-niyetli veya kazara pahalı sorgulara karşı sınırlanır. Sorgu derinliği (query depth) ≤ 10 ile sınırlıdır; her sorgu bir complexity puanı taşır ve tavanı aşan sorgu yürütülmeden reddedilir. N+1 sorgu problemi DataLoader (batch + cache, istek-kapsamlı) ile engellenir; bir resolver ilişkili kayıtları tek tek değil batch ile çeker.

Uygulama şu şekilde yapılır: Strawberry şemasına depth-limit ve complexity-limit extension'ları eklenir; ilişkili alanlar (ör. `order.lineItems`) DataLoader üzerinden çözülür, doğrudan per-node ORM sorgusu yasaktır. Depth/complexity ihlali standart hata zarfıyla (`data-error-envelope`'a referans, `code: query-too-complex`) döner.

Aşağıdaki tablo GraphQL koruma sınırlarını verir.

| Sınır | Değer | Aşımda |
|---|---|---|
| Query depth | ≤ 10 | Reddedilir (`code: query-too-deep`) |
| Query complexity | Tanımlı tavan | Reddedilir (`code: query-too-complex`) |
| İlişki çözümü | DataLoader (batch) | Per-node ORM sorgusu yasak (N+1) |
| Introspection | Yalnız staging | Production'da kapalı |

---

## 6. SDK-Generation Hazırlığı

Ürün, tüketicilerin entegrasyonunu kolaylaştırmak için typed SDK üretimine hazır tutulur; SDK elle yazılmaz, sözleşmeden (OpenAPI 3.1 REST için, GraphQL SDL GraphQL için) codegen ile türetilir. Bu, i14y'nin "araç değil hazırlık" kuralıdır: SDK'nın kendisi bir araçtır (bkz. `numeronym-siniflandirma.md` §4, SDK standart-değil), ancak *SDK üretilebilir olma* koşulu (temiz, sürümlü, tam-tipli sözleşme) i14y sözleşmesinin bir kuralıdır.

Uygulama şu şekilde yapılır: her public yüzey için sözleşme (OpenAPI/SDL) sürümlü ve tam-tipli tutulur; codegen CI'da `--check` ile koşar ve üretilmiş çıktı ile sözleşme arasındaki drift build'i bloklar. Üretilmiş SDK kodu (generated/) elle düzenlenmez; değişiklik sözleşmede yapılır ve üretici yeniden çalıştırılır.

---

## 7. REST Tutarlılığı — Pagination, Filter, Sort

REST liste uçları GraphQL ile aynı sayfalama felsefesini paylaşır: cursor-tabanlı sayfalama (`data-cursor-pagination`'a referans; OFFSET/LIMIT yasak), stabil bileşik sıralama anahtarı (ör. `created_at + id`) ve her liste ucunun varsayılan + azami sayfa boyutu vardır. Filtreleme ve sıralama sözleşmeli parametrelerle yapılır; serbest-form / SQL-sızdıran filtre yasaktır.

Uygulama şu şekilde yapılır: liste uçları `?cursor=...&limit=...&sort=field:asc&filter[field]=value` biçiminde sözleşmeli query parametreleri kabul eder; `sort` ve `filter` yalnız allowlist'teki alanlara izin verir, bilinmeyen alan 400 döner. Yanıt `{ data: [...], page_info: { next_cursor, has_next } }` zarfıyla döner.

Aşağıdaki tablo REST liste sözleşmesini verir.

| Parametre | Biçim | Kural |
|---|---|---|
| `cursor` | opak string | OFFSET yasak (referans: `data-cursor-pagination`) |
| `limit` | int | Varsayılan + azami tanımlı; sınırsız yasak |
| `sort` | `field:asc\|desc` | Yalnız allowlist alan |
| `filter[field]` | tip-doğrulanmış | Yalnız allowlist alan; bilinmeyen → 400 |

---

## 8. Idempotency ve Retry-Safe Yazma

Yan-etkili tüm yazma uçları (REST POST/PUT, GraphQL mutation, webhook tüketimi) idempotent'tir; `data-idempotency-key` kuralına (referans) uyar ve bir `Idempotency-Key` (REST header) veya webhook `event_id` (§3) ile tekrar çağrı yeni etki üretmez, ilk sonucu döner. i14y bunu retry-safe entegrasyona genişletir: istemci yeniden denemeleri (retry) yalnız idempotent operasyonlarda otomatik yapılır ve her retry aynı anahtarı taşır.

Uygulama şu şekilde yapılır: yazma ucu `Idempotency-Key`'i (istemci-üretimli UUID) alır, anahtar+sonuç en az 24 saat saklanır; aynı anahtarla tekrar gelen istek saklanan sonucu döner (yeni kayıt/çift-tahsilat üretmez). Webhook tüketicisi `event_id` ile aynı garantiyi sağlar.

---

## 9. Import / Export Sözleşmesi

Veri taşınabilirliği (GDPR data portability + müşteri güveni) bir sözleşmeye uyar: en az bir standart format (CSV/JSON/XLSX, domain'e göre), idempotent import (aynı dosya iki kez yüklenince duplicate yok), kısmi başarı raporlaması ve büyük veri için async export + bildirim akışı. Export dosyaları geçici, süreli (≤ 15 dk) ve HTTPS ile indirilir.

Uygulama şu şekilde yapılır: import ucu dosyayı satır-satır sınır-doğrulamasından (Pydantic/Zod) geçirir; her satır bir doğal-anahtar veya idempotency anahtarıyla eşleştirilir, geçersiz satırlar tüm import'u düşürmeden bir hata-raporunda toplanır (kısmi başarı). Büyük export bir background job (bkz. §08 observability, background-job görünürlüğü) olarak koşar, tamamlanınca webhook/e-posta ile bildirilir ve süreli imzalı URL üretir.

Aşağıdaki tablo import/export sözleşmesini verir.

| Yön | Kural | Zorlama |
|---|---|---|
| Import | Idempotent (duplicate yok), satır-bazlı validation, kısmi başarı raporu | integration test (5k+ satır) |
| Export (küçük) | HTTPS, süreli imzalı URL (≤ 15 dk) | URL-expire testi |
| Export (büyük) | Async job + bildirim + süreli URL | background-job görünürlüğü (o11y) |

---

## 10. Standart Hata Şeması (REST + GraphQL)

Tüm dış yüzeyler tek bir hata zarfı diline uyar. GraphQL tarafı `data-error-envelope` (referans) ile zaten tanımlıdır: `errors[].extensions.code` (stabil kebab makine kodu), `correlationId`, gerekirse `issues[]`. i14y bunu REST tarafına genişletir: REST hataları aynı `code` taksonomisini bir JSON gövdesiyle döner ve HTTP durum koduyla hizalanır. İstemciye ham exception/stack/DB mesajı sızdırılmaz.

Aşağıdaki tablo REST↔GraphQL hata hizalamasını verir; `code` değerleri her iki yüzeyde aynıdır.

| Durum | HTTP (REST) | `code` (ortak) | GraphQL |
|---|---|---|---|
| Doğrulama hatası | 400/422 | `validation-failed` | `errors[].extensions.code` |
| Yetkisiz | 401 | `unauthorized` | aynı |
| Yasak | 403 | `forbidden` | aynı |
| Bulunamadı | 404 | `not-found` | aynı |
| Çakışma / idempotency | 409 | `conflict` | aynı |
| Rate-limit | 429 | `rate-limited` | aynı |
| Sorgu-pahalı | 400 | `query-too-complex` | aynı |

Bu tablo `code` alanının tek doğruluk kaynağının hangi yüzeyde olduğunu değiştirmez; makine kodları `data-error-envelope`'ta tanımlı olan kümeyle uyumludur ve i14y yalnızca REST/HTTP eşlemesini ve entegrasyon-özgü kodları (`rate-limited`, `query-too-complex`) ekler.

---

## 11. Rate-Limit Header Görünürlüğü

Dışa açılan uçlar rate-limit durumunu tüketiciye görünür kılar; enforcement (WAF/DDoS/throttle) `edge-security` standardının sorumluluğudur, ancak *sözleşme yüzeyi* (hangi header'lar döner, 429 nasıl görünür) i14y'de tanımlıdır. Bu, `numeronym-siniflandirma.md`'deki "DDoS → rate-limit header + 429 döner" kabul kriterinin i14y-tarafı karşılığıdır.

Uygulama şu şekilde yapılır: her hız-sınırlı yanıt `X-RateLimit-Limit`, `X-RateLimit-Remaining` ve `X-RateLimit-Reset` header'larını taşır; sınır aşıldığında yanıt 429 + `Retry-After` header'ı + standart hata zarfı (`code: rate-limited`, §10) döner. İstemci `Retry-After`'a uyarak yeniden dener (§8 retry-safe).

---

## 12. Bounded-Context ve Sözleşme Sahipliği

i14y yüzeyleri de `data-bounded-context-ownership` (referans) kuralına uyar: her dış API/webhook/export tek bir bounded-context'e aittir ve yalnız o context'in verisini yayınlar. Bir context başka context'in tablosunu dış API'sinde doğrudan sunmaz; cross-context veri yalnız açık read-model/projection olarak sunulur. Bu, dış sözleşmelerin de iç sahiplik sınırlarını ihlal etmemesini garanti eder.

---

## 13. FastAPI + React + SQLAlchemy Karşılıkları

Aşağıdaki tablo bu standardın somut stack karşılıklarını verir; Next.js/Supabase/Prisma referansı yasaktır (bkz. `plan-02` ORTAK-GUARDRAIL).

| i14y kuralı | FastAPI (BE) | React (FE) | SQLAlchemy / PostgreSQL |
|---|---|---|---|
| OpenAPI-first | FastAPI route + Pydantic → `openapi.json` | codegen'li typed client | — |
| Webhook (imzalı/retry) | HMAC middleware + background retry (Celery/RQ) | — | `webhook_deliveries` + dead-letter tablo |
| Versioning | `/api/v1` router + schema diff | sürüm-farkında client | — (stateless) |
| GraphQL depth/complexity | Strawberry extension + DataLoader | TanStack Query + typed-document-node | resolver → `select()` batch |
| Idempotency | `Idempotency-Key` dependency | retry aynı anahtarı taşır | `idempotency_keys` tablo (24s TTL) |
| Import/export | streaming parse + async job | upload + progress UI | staging + `export_jobs` tablo |
| Rate-limit header | throttle middleware (header set) | `Retry-After`'a uyan retry | — |

---

## 14. İlgili Kanonik Dokümanlar

| Doküman | Yol | Rolü |
|---|---|---|
| Veri & API Sözleşmesi (makine) | `src/data/standards/data-api-contract.json` | i14y'nin tabanı: GraphQL codegen, cursor pagination, idempotency, hata zarfı, RLS |
| Observability standardı | `docs/standards/08-observability-standard.md` | Webhook/import background-job görünürlüğü + trace_id |
| Numeronym sınıflandırması | `docs/standards/numeronym-siniflandirma.md` | i14y `data`/should/P1 sınıfı; SDK/REST/RPC "standart-değil" ayrımı |
| Mühendislik Standartları Dizini | `docs/engineering-standards-index.md` | `data-api-contract` kanonik hub'ı + `standardRefs` |
| Standart şeması | `src/schemas/standard.ts` | `i14y.json` sözleşmesinin uyacağı `StandardContractSchema` |

---

## 15. Requirement-ID Tablosu

Aşağıdaki tablo i14y kurallarını izlenebilir Requirement-ID'lere döker; her satır bir kuralı, katmanını, önceliğini, test tipini, kabul kriterini (acceptance criteria) ve sahibini taşır. `data-api-contract`'a referanslı kurallar "Layer" sütununda kaynağıyla işaretlidir. Öncelik P0 (sistemsiz çalışmaz) → P3 (opsiyonel).

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| I14Y-01 | OpenAPI 3.1 sözleşmesi koddan türer, `openapi.json` sürümlü ve tek-kaynak | api-contract | P0 | contract | Şema diff temiz; elle-yazılmış REST tip yok | api-platform |
| I14Y-02 | REST istemci OpenAPI'den codegen ile üretilir; generated/ elle düzenlenmez | api-contract | P1 | contract | codegen `--check` temiz | api-platform |
| I14Y-03 | Webhook HMAC-SHA256 imzalı + timestamp (replay ≤ 5 dk) | backend | P1 | integration | Geçersiz imza reddedilir; replay penceresi dışı 401 | api-platform |
| I14Y-04 | Webhook üstel backoff retry + dead-letter + manuel replay | backend | P1 | integration | Başarısız teslimat N kez denenir; teslim edilemeyen dead-letter'a düşer | api-platform |
| I14Y-05 | Webhook tüketimi `event_id` ile idempotent | backend | P1 | integration | Aynı `event_id` tekrarı tek etki | api-platform |
| I14Y-06 | Stable versioning: kırıcı değişiklik expand-contract + deprecation penceresi | api-contract | P0 | contract | Schema diff kapısı deprecation'sız kırıcı değişiklikte bloklar | api-platform |
| I14Y-07 | GraphQL query depth ≤ 10 | api-contract | P1 | integration | Depth > 10 sorgu `query-too-deep` ile reddedilir | api-platform |
| I14Y-08 | GraphQL complexity tavanı + aşımda red | api-contract | P1 | integration | Tavan-aşan sorgu `query-too-complex` ile reddedilir | api-platform |
| I14Y-09 | DataLoader ile N+1 engelleme (batch + istek-kapsamlı cache) | backend | P1 | integration | İlişki çözümü tek batch sorgu; per-node ORM sorgusu yok | api-platform |
| I14Y-10 | SDK-generation hazır: sözleşme sürümlü + tam-tipli, codegen `--check` yeşil | api-contract | P2 | contract | Sözleşme↔SDK drift build'i bloklar | api-platform |
| I14Y-11 | REST cursor pagination (OFFSET yasak) + varsayılan/azami limit | api-contract | P0 | integration | Boş/son sayfa doğru; OFFSET kullanımı yok (referans: data-api-contract) | api-platform |
| I14Y-12 | REST filter/sort yalnız allowlist alan; bilinmeyen alan 400 | api-contract | P1 | integration | Allowlist-dışı `sort`/`filter` 400 döner | api-platform |
| I14Y-13 | Idempotency-Key (REST yazma) 24s saklama, retry-safe | backend | P0 | integration | Aynı anahtar tek kayıt; retry aynı anahtarı taşır (referans: data-api-contract) | api-platform |
| I14Y-14 | Import idempotent + satır-bazlı validation + kısmi başarı raporu | backend | P1 | integration | 5k+ satır; duplicate yok; geçersiz satır raporda | data-platform |
| I14Y-15 | Export süreli imzalı URL (≤ 15 dk) + async büyük-export bildirimi | backend | P2 | integration | URL-expire testi yeşil; büyük export job + bildirim | data-platform |
| I14Y-16 | Standart hata şeması REST↔GraphQL `code` hizalı (ham exception sızmaz) | api-contract | P0 | contract | REST 4xx `code` = GraphQL `extensions.code`; stack sızmaz (referans: data-api-contract) | api-platform |
| I14Y-17 | Rate-limit header (`X-RateLimit-*`) + 429 + `Retry-After` | api-contract | P1 | integration | Sınır aşımında 429 + header'lar + `rate-limited` code | api-platform |
| I14Y-18 | Dış yüzey bounded-context sahipliğine uyar (cross-context yalnız projection) | api-contract | P1 | review | Dış API başka context tablosunu doğrudan sunmaz (referans: data-api-contract) | api-platform |

Bu dosya bir anlatı standardıdır; kural değerlerini `src/data/standards/data-api-contract.json` (mevcut) ve `src/data/standards/i14y.json` (hedef) sözleşmelerinden devralır veya onlara referans verir, kopyalamaz.
