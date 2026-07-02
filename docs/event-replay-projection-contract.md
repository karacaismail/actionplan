# Event / Outbox / Projection Replay Yönergesi — Üretim Semantiği Sözleşmesi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-E1)
**Kaynak/bağlam:** `core-contract-pack.md §2.3` (Event Bus + Outbox), `core-contract-pack.md §2.4` (ECA Runtime), `core-contract-pack.md §2.5` (Audit Log), `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `scale-invariant-directive.md` (outbox/idempotency/rate-limit zarfı — REFERANS), `k-storage-dam-directive.md` (kardeş primitif 17-bölüm deseni), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `scale-invariant-directive.md`'nin **tüketicisidir**, tekrarı değil. Scale-invariant "para/sipariş/stok yazan akış transactional outbox + idempotency + tamper-evident audit taşır" der ve olayın **yazma tarafını** (producer) bağlar. Bu sözleşme aynı olayın **okuma/tüketme tarafını** (consumer + projection + replay) bağlar: outbox'a düşen olay, bir tüketici tarafından *nasıl* güvenli, tekrara-dayanıklı, sıra-bilinçli ve yeniden-oynatılabilir biçimde işlenir. Producer semantiği (outbox atomikliği, idempotency-key) için scale-invariant §5–§8 normatiftir; burada tekrarlanmaz, **atıf verilir**. Bu doküman **kod yazmaz**; olay/outbox/projection tüketim ve replay davranışının sözleşmesini normatif tanımlar. Makine-okunur karşılığı (consumer runtime, projection handler, DLQ tablosu, replay orkestratörü) ADR-E1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, outbox'a yazılmış her olayın tüketilmesini ve projeksiyona dönüşmesini **gerçekçi bir teslim modeline** oturtur: *at-least-once teslim + idempotent consumer*. Hedef: 50 uygulamanın hiçbirinin kendi kırılgan tüketicisini yazmaması; her tüketicinin duplicate olay, sıra-dışı (out-of-order) olay, commit-sonrası-çökme (crash-after-commit) ve worker retry karşısında **projeksiyonu bozmadan** deterministik çalışması; bir projeksiyonun sıfırdan yeniden inşa edilebilmesi (rebuild); geçmiş bir olayın bugünün değil **kendi zamanının politikasıyla** yeniden oynatılabilmesi (replay). Aktör-açık ifade: *ajan* tüketici/projeksiyon taslağı önerir (draft); *insan* onaylar; *motor* onaylı tüketiciyi deterministik, idempotent ve sıra-bilinçli uygular. Kritik dil kuralı: bu sözleşme "exactly-once teslim" veya "garanti teslim" **vaat etmez** (bkz. §14 anti-pattern); vaat ettiği tek şey, tekrar/sıra-dışı/çökme karşısında *sonucun* tek ve doğru olmasıdır (effective-once), teslimin kendisi değil.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) gerçekçi teslim modeli (at-least-once + idempotent consumer) ve terim disiplini; (2) olayların taşıması zorunlu sıralama/izlenebilirlik alanları (`aggregate_id`, `aggregate_version`, `event_id`, `causation_id`, `correlation_id`, `occurred_at`, `tenant_id`, `policy_version`); (3) duplicate / out-of-order / crash-after-commit karşısında bozulmayan projeksiyon (idempotent upsert + `aggregate_version` guard); (4) DLQ (dead-letter queue) + retry + backoff + poison-message yönetimi; (5) projeksiyon rebuild ve event store retention/archive/replay sözleşmesi; (6) replay policy kararı (olay kendi `policy_version`'ını taşır; replay o versiyonla deterministik); (7) ECA runtime'ın external side-effect kuralı (doğrudan notification/HTTP yasak; her yan-etki outbox üzerinden); (8) zorunlu negatif testler; (9) `check-event-semantics` CI kapısı önerisi. Consumer/projection/DLQ/replay gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Producer-tarafı yazma zarfı (transactional outbox atomikliği, idempotency-key üretimi, tamper-evident audit) — bu `scale-invariant-directive.md` §5–§8'in işidir; burada yalnız **tüketim ve replay** ele alınır, producer'a REFERANS verilir. (2) Mesajlaşma altyapısının kendisi (Redis Streams / RabbitMQ / Kafka seçimi) — bu `core-contract-pack.md §2.3` notudur; sözleşme transport-agnostik kalır, tek transport'a bağlanmaz. (3) İş mantığı (fiyat/vergi/stok hesabı) — o `platform_computation`/`platform_pdp` işidir; projeksiyon yalnız olayı *okunur duruma* yansıtır, kural hesaplamaz. (4) "Exactly-once teslim" garantisi — bu bir anti-pattern'dır (§14); dağıtık sistemde teslim en iyi ihtimalle at-least-once'tır, tekillik consumer idempotency'sinde sağlanır. (5) Serbest kodla olay tüketme — hiçbir app doğrudan kuyruk istemcisini (`redis.xreadgroup`, Kafka consumer) açamaz; tüketim yalnız bu sözleşmenin consumer runtime'ından geçer. (6) Snapshot/event-sourcing aggregate rekonstrüksiyonu — bu sözleşme *projeksiyon* (read-model) tarafını bağlar; write-model event-sourcing ayrı bir eksendir, buraya sızdırılmaz.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Bu sözleşme, outbox'a düşmüş olayları tüketip okunabilir projeksiyonlara (read-model) dönüştüren, tüketimi at-least-once teslim varsayımı altında idempotent + sıra-bilinçli kılan ve olayların yeniden oynatılmasını (replay) ile projeksiyonların sıfırdan inşasını (rebuild) deterministik biçimde tanımlayan tüketim-katmanı davranış sözleşmesidir.

**Ne yapar:** At-least-once teslim varsayar (aynı olay birden çok kez gelebilir — bu normaldir, hata değil). Her olayı `event_id` ile tekilleştirir (idempotent consumer). Projeksiyonu `aggregate_id` + `aggregate_version` ile sıraya sokar; eski version'lı olay yeni projeksiyon durumunun üzerine **yazamaz** (out-of-order koruması). Projeksiyon güncellemesini idempotent upsert ile yapar (aynı olay iki kez uygulanırsa aynı sonuç). İşlenemeyen olayı retry + exponential backoff ile dener; kalıcı başarısız (poison) olayı DLQ'ya taşır. Bir projeksiyonu event store'dan sıfırdan yeniden inşa eder (rebuild). Bir olay penceresini yeniden oynatır (replay), olayın **kendi** `policy_version`'ıyla (bugünün policy'siyle değil). ECA yan-etkilerini outbox üzerinden yayar (doğrudan HTTP/notification değil).

**Ne yapmaz:** "Exactly-once teslim" **iddia etmez** (kanıtsız iddia CI'da reddedilir, §10/§14); tekillik teslimin değil consumer idempotency'sinin özelliğidir. Duplicate olayı hata saymaz (at-least-once'ın doğal sonucudur; idempotent tüketilir). Eski version'lı olayı projeksiyona **uygulamaz** (guard reddeder, sessizce üzerine yazmaz). Olayı DLQ'ya taşımadan sonsuz retry yapmaz (poison-message kuyruğu tıkayamaz). Replay'i bugünün policy'siyle çalıştırmaz (geçmiş yeniden yazılamaz; `policy_version` sabittir). ECA'da doğrudan e-posta/webhook/HTTP çağrısı yapmaz (yan-etki outbox'tan geçer, at-least-once + idempotent). Producer'ın outbox atomikliğini tekrar tanımlamaz (scale-invariant'a REFERANS). Projeksiyonu write-model olarak kullanmaz (read-model tek yönlüdür).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki üç tablo, olay zarfının, projeksiyon offset/checkpoint kaydının ve DLQ kaydının veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. Olay gövdesi (`payload`) domain'e özgüdür; buradaki alanlar her olayın taşıması **zorunlu** olan zarf alanlarıdır. Zarf, `core-contract-pack.md §2.3` `platform_outbox` tablosunu genişletir (o tabloya `event_type`, `payload`, `tenant_id` zaten vardır; burada sıralama/izlenebilirlik alanları normatif kılınır).

Bu tablo, olay zarfının (event envelope) her olayın taşıması zorunlu alanlarını tanımlar. Bu alanlar duplicate tekilleştirme, sıra-koruması, nedensellik izleme ve deterministik replay için **hepsi birlikte** gereklidir; eksik alan CI'da (§14, `check-event-semantics`) bloklanır.

| Alan | Tip | Amaç |
|---|---|---|
| `event_id` | UUID (PK) | Olayın **global benzersiz** kimliği; idempotent consumer bununla tekilleştirir (duplicate aynı `event_id`'yi taşır) |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed; tüketim/projeksiyon tenant-kapsamlı |
| `aggregate_id` | UUID (indexed, NOT NULL) | Olayın ait olduğu aggregate (sipariş, fatura, stok kalemi); sıralama bu eksende yapılır |
| `aggregate_version` | BigInteger (NOT NULL) | Aggregate içi **monotonik** sıra numarası; out-of-order guard'ın anahtarı (eski version yazamaz) |
| `event_type` | Text (NOT NULL) | Olay türü (`order.placed`, `invoice.issued`, …); tüketici yönlendirmesi ve replay filtresi |
| `causation_id` | UUID (nullable) | Bu olayı **doğrudan tetikleyen** olayın/komutun `event_id`'si; nedensellik zinciri (neyin sonucu) |
| `correlation_id` | UUID (NOT NULL) | Aynı iş-akışına ait tüm olayları birbirine bağlayan kimlik; v1 §2.9 `trace_id` ile hizalı (uçtan-uca izleme) |
| `occurred_at` | TIMESTAMPTZ (NOT NULL) | Olayın **domain zamanı** (üretildiği an); replay'de sıralama ve zaman-pencere filtresi (işlenme zamanıyla karıştırılmaz) |
| `policy_version` | Text (NOT NULL) | Olay üretildiğinde geçerli olan politika/şema versiyonu; replay bu versiyonla deterministik çalışır (§6/§7) |
| `payload` | JSONB (NOT NULL) | Domain olay gövdesi; şeması `event_type` + `policy_version` ile belirlenir |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Olayın outbox'a **yazılma** zamanı (audit/retention; `occurred_at`'tan ayrıdır) |

Bu tablo, bir projeksiyonun tüketim ilerlemesini (offset/checkpoint) ve son gördüğü aggregate version'ı tanımlar; out-of-order guard ve rebuild devam noktası bu kayda dayanır.

| Alan | Tip | Amaç |
|---|---|---|
| `projection_name` | Text (PK bileşeni) | Projeksiyonun kimliği (hangi read-model); rebuild/replay hedefi |
| `tenant_id` | UUID (PK bileşeni, NOT NULL) | Kiracı kapsamı; her projeksiyon tenant-kapsamlı ilerler |
| `aggregate_id` | UUID (PK bileşeni) | Sıra-koruması aggregate bazında tutulur (her aggregate kendi monotonik akışı) |
| `last_applied_version` | BigInteger (NOT NULL) | Bu aggregate için projeksiyona **uygulanmış son** `aggregate_version`; guard bunun ≥ gelen version olduğu olayı reddeder |
| `last_event_id` | UUID (nullable) | En son uygulanan olayın `event_id`'si (denetim/hata ayıklama) |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son ilerleme zamanı; durağan (stuck) projeksiyon tespiti |

Bu tablo, kalıcı başarısız (poison) olayların taşındığı dead-letter kaydını tanımlar; DLQ olay kaybını önler ve manuel/otomatik yeniden-işlemeyi mümkün kılar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | DLQ kaydının kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı kapsamı |
| `event_id` | UUID (NOT NULL) | Başarısız olan olayın kimliği (kaynağa geri izlenir) |
| `projection_name` | Text (nullable) | Hangi tüketici/projeksiyon başarısız oldu |
| `failure_reason` | Text (NOT NULL) | Hata sınıfı/gerekçesi (poison teşhisi) |
| `retry_count` | Integer (NOT NULL) | DLQ'ya düşmeden önce yapılan deneme sayısı |
| `first_failed_at` | TIMESTAMPTZ (NOT NULL) | İlk başarısızlık zamanı |
| `moved_to_dlq_at` | TIMESTAMPTZ (NOT NULL) | DLQ'ya taşınma zamanı |
| `status` | Enum(dead, reprocessing, resolved) | DLQ kaydının yaşam döngüsü; yeniden-işleme takibi |
| `approval_ref` | UUID (nullable) | Toplu reprocess/replay insan onayı (AI tek başına reprocess tetikleyemez) |

## 6. Teslim modeli — gerçekçi semantik (at-least-once + idempotent consumer)

Bu bölüm sözleşmenin çekirdek felsefesidir ve dil disiplini burada sabitlenir. Aktör-açık ifade: *transport* olayı **en az bir kez** teslim eder (kopya olabilir); *consumer runtime* olayı `event_id` ile tekilleştirir; *projeksiyon* idempotent upsert + version guard ile *sonucu* tek ve doğru kılar.

**Neden at-least-once, exactly-once değil:** Dağıtık bir sistemde bir mesaj "işlendi" ile "işlendi-olarak-işaretlendi (ack)" arasında worker çökebilir. Bu iki adım tek bir atomik işlem olamadığından, sistem ya en az bir kez (ack kaybolursa yeniden gönder) ya da en çok bir kez (gönder, ack'i bekleme) teslim edebilir; ikisi birden — teslim düzeyinde "tam bir kez" — dağıtık ortamda **elde edilemez**. Bu sözleşme at-least-once'ı seçer (olay kaybını önlemek olay-kopyasını önlemekten önemlidir) ve tekilliği **consumer tarafına** taşır. Sonuç: kullanıcı-görünür davranış "effective-once" (etki bir kez) olur — ama bu teslimin değil, idempotent consumer + version guard'ın özelliğidir.

Aşağıdaki tablo, teslim düzeyinde ne garanti edildiğini ve ne edilmediğini netleştirir; "exactly-once teslim" satırı bilerek YASAK olarak işaretlidir (§14 anti-pattern, §10 AI-guardrail).

| İfade | Durum | Gerekçe |
|---|---|---|
| At-least-once teslim (olay en az bir kez gelir) | GARANTİ | Olay kaybı kabul edilemez; ack kaybında yeniden gönderilir |
| Duplicate olay gelebilir | KABUL | At-least-once'ın doğal sonucu; hata değil, idempotent tüketilir |
| Sıra-dışı (out-of-order) olay gelebilir | KABUL | Retry/paralel worker sırayı bozabilir; version guard korur (§7) |
| Effective-once sonuç (etki tek ve doğru) | GARANTİ | `event_id` tekilleştirme + `aggregate_version` guard + idempotent upsert ile |
| "Exactly-once teslim" | **YASAK** | Dağıtık teslimde elde edilemez; kanıtsız iddia CI'da reddedilir (§14) |
| "Garanti teslim / mesaj asla kaybolmaz+asla tekrarlanmaz" | **YASAK** | Aynı anti-pattern'ın pazarlama dili; sözleşmeye giremez |

Uygulama kuralı: her tüketici, "aynı olay iki kez gelirse ne olur?" sorusuna **idempotent** cevabı tasarımda vermek zorundadır; "bu asla olmaz" cevabı geçersizdir ve `check-event-semantics` tarafından reddedilir.

## 7. Projeksiyon dayanıklılığı — duplicate / out-of-order / crash-after-commit

Bu bölüm, üç bozulma senaryosunun projeksiyonu **nasıl bozmadığını** normatif tanımlar. Aktör-açık: *consumer runtime* guard'ı uygular; *projeksiyon handler* yalnız idempotent upsert yazar; *CI* guard'sız handler'ı bloklar.

**Duplicate olay (aynı `event_id` tekrar):** Consumer, olayı uygulamadan önce `event_id`'yi kontrol eder; bu olay bu projeksiyona zaten uygulanmışsa (offset kaydında `last_event_id` veya işlenmiş-olay kümesinde), yeniden uygulamaz — no-op. Ek olarak projeksiyon yazımı **idempotent upsert**'tir: `INSERT ... ON CONFLICT (tenant_id, primary_key) DO UPDATE` deterministiktir; aynı olayın iki kez uygulanması aynı satır durumunu üretir. Yan-etki (§8) da idempotency-key ile korunur.

**Sıra-dışı (out-of-order) olay:** Aynı `aggregate_id` için olaylar `aggregate_version` ile monotonik sıralıdır. Consumer, gelen olayın `aggregate_version`'ını offset kaydındaki `last_applied_version` ile karşılaştırır: gelen version ≤ uygulanmış version ise olay **eskidir**, projeksiyona **uygulanmaz** (guard reddeder — ama olay kaybolmaz; ack'lenir çünkü daha yeni durum zaten yansımıştır). Gelen version = uygulanmış + 1 ise sırayla uygulanır. Gelen version > uygulanmış + 1 ise (arada olay eksik) tüketici **bekler/geri-diz** (gap toleransı transport'a göre; Kafka partition sırası korurken, at-least-once kuyruk gap'e izin verebilir — bu durumda replay/rebuild ile boşluk kapatılır). Kritik invariant: **eski version yeni durumun üzerine asla yazamaz.**

**Crash-after-commit (projeksiyon yazıldı, ack düşmeden çökme):** Consumer projeksiyonu güncelledi (ve offset'i `last_applied_version`'a yazdı) ama transport'a ack göndermeden çöktü. Transport, ack görmediği için olayı **yeniden teslim eder** (at-least-once). Yeniden gelişte consumer, olayın `aggregate_version`'ının `last_applied_version` ile eşit/küçük olduğunu görür → duplicate/eski olarak reddeder → projeksiyon **ikinci kez değişmez**. Böylece "yazdım ama ack edemedim" durumu veri bozulmasına dönüşmez. Kritik tasarım: **projeksiyon güncellemesi ile offset ilerlemesi aynı transaction'da** yazılır (tek `session.commit()`); ikisi ayrı commit olursa "projeksiyon ilerledi ama offset ilerlemedi" (yeniden uygular) veya tersi (olay atlar) hatası doğar.

Aşağıdaki tablo üç senaryonun koruma mekanizmasını özetler; her satır bir bozulma girişimini ve onu nötrleyen invariantı verir.

| Senaryo | Ne olur | Koruyan invariant |
|---|---|---|
| Duplicate (`event_id` tekrar) | Aynı olay ikinci kez gelir | `event_id` tekilleştirme + idempotent upsert → no-op |
| Out-of-order (eski version sonra gelir) | Version N uygulanmışken N-1 gelir | `aggregate_version` guard: eski version yazamaz → reddedilir |
| Crash-after-commit (ack düşmeden çökme) | Projeksiyon yazıldı, olay yeniden teslim edilir | Projeksiyon+offset tek transaction + version guard → ikinci uygulama no-op |
| Concurrent aynı olay (yarış) | İki worker aynı olayı paralel işler | Upsert `ON CONFLICT` + version guard → yalnız biri etki, diğeri no-op |

## 8. ECA external side-effect — outbox üzerinden yan-etki

Bu bölüm `core-contract-pack.md §2.4` ECA runtime'ının teslim semantiğini bağlar. Aktör-açık: *ECA runtime* bir olayı değerlendirip aksiyon üretir; ama aksiyonu **doğrudan icra etmez** — aksiyonu bir yan-etki olayı olarak outbox'a yazar; *yan-etki worker'ı* onu at-least-once + idempotent icra eder.

**Kural:** ECA aksiyonu (e-posta gönder, webhook çağır, SMS, dış HTTP) **doğrudan** çağrılamaz. `send_email`/webhook gibi her external side-effect, ECA değerlendirmesi içinde domain işlemiyle **aynı transaction'da** bir outbox olayı olarak yazılır (`event_type: "eca.side_effect.email"` vb., scale-invariant §7 outbox deseni). Bir yan-etki worker'ı bu olayı okur ve gerçek çağrıyı yapar. Bu iki nedenle zorunludur: (1) **Atomiklik** — "kural tetiklendi ama e-posta gönderilmedi (ya da tersi)" dual-write hatasını önler (olay ve domain yazımı birlikte commit olur veya birlikte geri alınır). (2) **Teslim** — yan-etki de at-least-once'tır (worker çökerse tekrar dener), bu yüzden **idempotent** olmak zorundadır: her yan-etki bir idempotency-key taşır (`correlation_id` + aksiyon türü), böylece worker retry aynı e-postayı iki kez göndermez.

Aşağıdaki tablo yasak (doğrudan) ve zorunlu (outbox'lu) yan-etki desenini karşılaştırır.

| Desen | Durum | Sonuç |
|---|---|---|
| ECA aksiyonu doğrudan `httpx.post(...)` / `smtp.send(...)` çağırır | **YASAK** | Domain commit olur ama HTTP düşerse kural "yarım" tetiklenir (dual-write) |
| ECA aksiyonu outbox olayı yazar; worker at-least-once icra eder | ZORUNLU | Atomik + yeniden-denenebilir |
| Yan-etki worker'ı idempotency-key olmadan retry yapar | **YASAK** | Retry aynı e-postayı/webhook'u iki kez gönderir |
| Yan-etki idempotency-key (`correlation_id`+aksiyon) taşır | ZORUNLU | Retry tek etki üretir (effective-once) |

Not: Yan-etkinin *kendisi* (e-posta içeriği, webhook payload'ı) `policy_version` taşır; bir kural değerlendirmesi replay edildiğinde (§9), yan-etki olayın **kendi** versiyonuyla yeniden üretilir — ama replay yan-etkileri varsayılan olarak **bastırılır** (replay'de gerçek e-posta tekrar gönderilmez; §9 replay modu `side_effects=suppressed`).

## 9. Rebuild + Replay — event store retention/archive/replay sözleşmesi

Bu bölüm projeksiyonun sıfırdan inşasını (rebuild), geçmiş olayların yeniden oynatılmasını (replay) ve bunların dayandığı retention/archive sözleşmesini normatif tanımlar. Aktör-açık: *ajan* rebuild/replay planı önerir (draft); *insan* onaylar (`approval_ref`); *motor* deterministik yürütür.

**Event store retention/archive:** Olaylar projeksiyona yansıdıktan sonra da **silinmez**; rebuild ve denetim için saklanır. Sıcak (hot) event store son N gün/versiyonu tutar; daha eski olaylar arşive (cold storage, ör. object storage — `k-storage`) taşınır ama **erişilebilir** kalır. Retention politikası tenant-kapsamlı ve KVKK-uyumludur (v1 §2.5 min. 2 yıl audit ile hizalı). Bir projeksiyon rebuild edilebilmesi için, o projeksiyonu besleyen olay türlerinin tümü retention penceresinde (hot+cold) bulunmak zorundadır; retention bu bağımlılığı bilmeden olay budayamaz.

**Rebuild (projeksiyonu sıfırdan inşa):** Bir read-model şeması değişince veya bozulunca, projeksiyon sıfırlanır (offset kaydı `last_applied_version=0`) ve ilgili tüm olaylar `aggregate_id` + `aggregate_version` sırasıyla baştan uygulanır. Rebuild **idempotent** olduğundan (upsert + version guard), yarıda kesilip devam edebilir. Rebuild sırasında yeni gelen canlı olaylar ya kuyrukta bekletilir ya da rebuild bittikten sonra sıradan devam eder (offset son işlenen version'ı bildiği için çakışma olmaz).

**Replay (olay penceresini yeniden oynatma) — POLICY KARARI:** Bir zaman/version penceresindeki olaylar yeniden işlenir (ör. bir hata düzeltildikten sonra etkilenen aggregate'ler). **Karar:** Replay, her olayın **kendi `policy_version`'ıyla** deterministik çalışır — *bugünün* policy'siyle değil. Gerekçe: geçmiş, bugünün kurallarıyla yeniden yazılamaz. 2025'te %18 KDV ile kesilmiş bir faturayı 2026'da %20 ile replay etmek geçmişi bozar; olay `policy_version: "vat-2025"` taşıdığı için replay o versiyonun kuralıyla aynı sonucu üretir. Bu yüzden `policy_version` olay zarfında (§5) **zorunlu** ve **değişmez**dir; motor replay'de `policy_version`'a bakıp o versiyonun kural/şema setini yükler (`platform_pdp`/`platform_computation` versiyonlu politika). Replay varsayılan olarak yan-etkileri **bastırır** (`side_effects=suppressed`): gerçek e-posta/webhook yeniden tetiklenmez (§8); yalnız projeksiyon yeniden hesaplanır. Yan-etki de dahil tam replay ("gerçekten yeniden gönder") ayrı, açık, insan-onaylı bir moddur.

Aşağıdaki tablo rebuild ile replay'i ayırır; ikisi karıştırılmamalıdır (biri projeksiyonu yeniden kurar, diğeri olay etkisini yeniden çalıştırır).

| Boyut | Rebuild | Replay |
|---|---|---|
| Amaç | Projeksiyonu sıfırdan yeniden inşa (şema değişti/bozuldu) | Geçmiş olay penceresini yeniden işle (hata düzeltildi) |
| Kapsam | Bir projeksiyonun tüm geçmişi | Seçili zaman/version/aggregate penceresi |
| Policy | Her olay kendi `policy_version`'ıyla | Her olay kendi `policy_version`'ıyla (bugünün policy'si DEĞİL) |
| Yan-etki | Yok (yalnız read-model yazılır) | Varsayılan bastırılır; tam replay ayrı+onaylı mod |
| İdempotenlik | Upsert + version guard (yarıda kesilebilir) | Aynı; tekrar aynı sonuç |
| Onay | `approval_ref` (insan) | `approval_ref` (insan); tam-replay ekstra onay |

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`)

Bu tablo, olay/projeksiyon/replay üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Consumer / projeksiyon handler *önerme* | `draft` | AI yeni tüketici/projeksiyon taslağı önerir (`ProjectionDraft`); doğrudan devreye alamaz |
| Idempotency / `aggregate_version` guard kaldırma | `none` | AI, tüketiciden idempotency veya version guard'ını **çıkaramaz**; guard'sız handler CI'da reddedilir |
| "Exactly-once teslim" iddiası | `none` (reddedilir) | Kanıtsız "exactly-once"/"garanti teslim" ifadesi içeren taslak/PR `check-event-semantics` tarafından reddedilir |
| Replay policy'sini "bugünün policy'si" yapma | `none` | AI, replay'i olayın `policy_version`'ı yerine güncel policy ile çalıştıran yol öneremez (geçmişi bozar) |
| DLQ reprocess / tam-replay tetikleme | onay-zorunlu | Toplu reprocess veya yan-etkili tam-replay `approval_ref` olmadan `ApprovalRequiredError` |
| Retention/archive budama politikası değişimi | onay-zorunlu | Olay budama insan onayı ister; rebuild bağımlılığı olan olay silinemez |
| Transport / partition anahtarı politikası | `none` | Mesajlaşma altyapısı kararı çekirdek ekip PR'ı; AI değiştiremez |
| Audit / event store append-only değişimi | `none` | Append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; kanıtsız "exactly-once"/"garanti teslim" **diyemez**; idempotency/ordering guard'ını kaldıramaz; replay'i geçmişi bozacak biçimde bugünün policy'sine bağlayamaz; prod projeksiyonu doğrudan yeniden yazamaz (yalnız draft + onaylı rebuild/replay). Consumer AI-draft ise, idempotency + `aggregate_version` guard + `policy_version`-bilinçli replay taşıması zorunludur; taşımayan draft reddedilir.

## 11. Bağlama (scale-invariant producer; core §2.3/§2.4; k-storage archive)

**Scale-invariant bağlama (REFERANS — tekrar değil):** `scale-invariant-directive.md` olayın **producer** tarafını bağlar: domain kaydı + `platform_outbox` satırı aynı `session.commit()` (§7 transactional outbox), idempotency-key ile yazma tekilleştirme (§7), tamper-evident audit (§7). Bu sözleşme o zarfı **varsayar** ve olayın **consumer** tarafını ekler. Sınır nettir: outbox'a **yazma** → scale-invariant; outbox'tan **okuma/tüketme/projeksiyon/replay** → bu doküman. Bir yazma akışı hem `financial|order|inventory` etiketli (scale-invariant §2) hem de projeksiyon besleyen olay üretiyorsa, iki sözleşmeye de uyar; çelişki yoktur (biri yazma zarfı, diğeri tüketim zarfı).

**core-contract-pack §2.3 bağlama:** `platform_outbox` tablosu (`id`, `tenant_id`, `event_type`, `payload`, `status`) bu sözleşmenin olay zarfının (§5) tabanıdır; §5 ona sıralama/izlenebilirlik alanlarını (`aggregate_id`, `aggregate_version`, `event_id`, `causation_id`, `correlation_id`, `occurred_at`, `policy_version`) normatif ekler. `EventConsumer.subscribe` (§2.3) bu sözleşmenin idempotent consumer runtime'ıyla uygulanır; ham `redis.xreadgroup` app'te yasaktır (§3 non-goal).

**core-contract-pack §2.4 bağlama:** ECA runtime aksiyonları (§8) doğrudan icra edilmez; outbox üzerinden at-least-once + idempotent yan-etki olur. ECA kural değerlendirmesi replay edildiğinde olayın `policy_version`'ıyla çalışır (§9).

**k-storage bağlama (archive):** Event store'un cold/arşiv katmanı (§9 retention) fiziksel olarak object storage'da (`k-storage-dam-directive.md`) tutulabilir; arşivlenen olaylar erişilebilir kalır (rebuild bağımlılığı). Bu bir *related* bağdır: k-storage binary saklar, event store olay saklar; arşiv backend'i paylaşılabilir ama semantik ayrıdır.

**core §2.9 bağlama:** `correlation_id` (§5), v1 §2.9 Observability `trace_id`/`X-Request-ID` akışıyla hizalıdır; bir olayın nedensellik zinciri (`causation_id`) ve korelasyonu (`correlation_id`) uçtan-uca izlemeye bağlanır.

## 12. WBS / kernel yerleşimi

`k-event-projection`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; olayın consumer/projection/replay katmanını sahiplenir. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü (consumer runtime + projection handler + DLQ + replay orkestratörü) durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-event-projection` düğümünün WBS yerleşimini ve bağımlılığını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-event-projection` | module | `k-tenancy`, `platform_outbox` (scale-invariant/§2.3) | kernel/layer0 |

`dependsOn` gerekçesi: tüketim tenant bağlamına (`k-tenancy`) ve olayın yazıldığı outbox/producer zarfına (scale-invariant `platform_outbox`) teknik olarak bağlıdır; outbox'a olay yazılmadan tüketilecek olay yoktur. `related` ile (karar üretmeden) `platform_eca` (yan-etki bağı), `platform_pdp`/`platform_computation` (versiyonlu policy — replay), `k-storage` (arşiv backend) ve v1 §2.9 Observability (correlation) düğümlerine bağlanır. Producer akış düğümleri kendi `dependsOn`'unda outbox'ı listeler; bu düğüm outbox'tan **sonra** gelir (yazma önce, tüketim sonra).

## 13. Test stratejisi

Aşağıdaki testler `core-contract-pack` DoD'unu ve §3.5 test piramidini karşılar; her senaryo **zorunludur** ve test-önce (önce kırmızı) yazılır. Negatif senaryolar (duplicate/out-of-order/crash/poison) pozitifler kadar zorunludur (v1 §3.5).

Bu tablo `k-event-projection` için zorunlu (negatif dahil) test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Duplicate olay: aynı `event_id` iki kez → projeksiyon tek etki (idempotent upsert no-op) | Entegrasyon (negatif) |
| 2 | Out-of-order: version N uygulanmışken N-1 gelir → reddedilir, eski durum yazılmaz | Entegrasyon (negatif) |
| 3 | Crash-after-commit: projeksiyon yazıldı, ack düşmeden çökme → yeniden teslimde ikinci etki yok | Entegrasyon (negatif) |
| 4 | Concurrent yarış: N eşzamanlı özdeş olay → yalnız biri etki, diğerleri no-op | Entegrasyon (negatif) |
| 5 | DLQ + poison: kalıcı başarısız olay retry+backoff sonrası DLQ'ya taşınır, kuyruk tıkanmaz | Entegrasyon |
| 6 | Replay: bir olay penceresi kendi `policy_version`'ıyla yeniden işlenir (bugünün policy'si DEĞİL) | Entegrasyon |
| 7 | Rebuild: projeksiyon sıfırdan inşa edilir, yarıda kesilip devam eder (idempotent) | Entegrasyon |
| 8 | ECA yan-etki: aksiyon doğrudan HTTP değil outbox üzerinden; worker retry idempotent (tek e-posta) | Entegrasyon |
| 9 | Retention/archive: arşive taşınan olayla rebuild hâlâ çalışır (olay erişilebilir) | Entegrasyon |
| 10 | Guard bütünlüğü: idempotency/`aggregate_version` guard'sız consumer CI'da reddedilir | Contract |
| 11 | Tenant izolasyonu: bir tenant'ın olayı diğerinin projeksiyonuna düşmez (≥10 negatif case) | Entegrasyon (negatif) |
| 12 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |

## 14. Anti-patterns

- **"Exactly-once teslim" iddiası:** Teslim düzeyinde "tam bir kez" garantisi vaat etmek — YASAK; dağıtık teslimde elde edilemez, tekillik consumer idempotency'sindedir (§6). Kanıtsız iddia `check-event-semantics` tarafından reddedilir.
- **"Garanti teslim / mesaj asla kaybolmaz+asla tekrarlanmaz":** Aynı yanılgının pazarlama dili — YASAK; at-least-once + idempotent consumer doğru modeldir.
- **Duplicate'i hata sayma:** Aynı olayın iki kez gelmesini exception'a çevirmek — YASAK; at-least-once'ın doğal sonucudur, idempotent tüketilir.
- **Version guard'sız projeksiyon:** `aggregate_version` kontrolü olmadan olayı uygulamak — YASAK; eski version yeni durumun üzerine yazar (bozulma).
- **Ayrı transaction'da projeksiyon+offset:** Projeksiyon yazımı ile offset ilerlemesini farklı commit'te yapmak — YASAK; crash-after-commit'te ya çift-uygular ya atlar. Tek `session.commit()`.
- **Non-idempotent upsert:** Projeksiyonu düz `INSERT` veya koşulsuz `UPDATE` ile yazmak — YASAK; duplicate/replay bozar. `ON CONFLICT DO UPDATE` deterministik.
- **Sonsuz retry / DLQ'suz poison:** Başarısız olayı DLQ'ya taşımadan sonsuz denemek — YASAK; poison-message kuyruğu tıkar, tüm tüketim durur.
- **Bugünün policy'siyle replay:** Geçmiş olayı güncel `policy_version` ile yeniden işlemek — YASAK; geçmişi bozar. Olay kendi `policy_version`'ını taşır ve replay onunla çalışır (§9).
- **ECA doğrudan yan-etki:** Kural aksiyonunda doğrudan e-posta/webhook/HTTP çağırmak — YASAK; yan-etki outbox üzerinden at-least-once + idempotent (§8).
- **Ham kuyruk istemcisi:** App'te doğrudan `redis.xreadgroup`/Kafka consumer açmak — YASAK; tüketim yalnız sözleşmeli consumer runtime'ından.
- **Replay'de yan-etki patlaması:** Replay'de gerçek e-posta/webhook'ları yeniden tetiklemek — YASAK (varsayılan); yan-etki bastırılır, tam-replay ayrı+onaylı mod.
- **Olayı erken budama:** Rebuild bağımlılığı olan olayı retention penceresinden silmek — YASAK; projeksiyon bir daha inşa edilemez.

## 15. Definition of Done

- §13'teki 12 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli), negatif senaryolar (duplicate/out-of-order/crash/poison/DLQ) dahil.
- Olay zarfı (§5) `core-contract-pack §2.3` `platform_outbox`'ı geriye-uyumlu genişletiyor; `event_id`, `aggregate_id`, `aggregate_version`, `causation_id`, `correlation_id`, `occurred_at`, `policy_version`, `tenant_id` alanları mevcut; Alembic migration expand-contract ve `downgrade()` veri kaybetmeden çalışıyor.
- Consumer runtime idempotent (`event_id` tekilleştirme) + sıra-bilinçli (`aggregate_version` guard); projeksiyon+offset tek transaction'da yazılıyor (crash-after-commit kanıtı).
- DLQ + retry + exponential backoff + poison-message yolu çalışıyor; poison olay kuyruğu tıkamıyor.
- Rebuild ve replay çalışıyor; replay her olayın **kendi** `policy_version`'ıyla deterministik (bugünün policy'si değil); replay yan-etkileri varsayılan bastırılıyor.
- ECA yan-etkisi outbox üzerinden at-least-once + idempotent (doğrudan HTTP/notification yok).
- `check-event-semantics` CI kapısı (§16) yeşil: guard'sız consumer, kanıtsız "exactly-once"/"garanti teslim" iddiası, zarf-alan eksikliği bloklanıyor.
- AI-guardrail testli: AI consumer/projeksiyon yalnız `draft` öneriyor; idempotency/ordering guard'ını kaldıran ya da kanıtsız "exactly-once" iddia eden taslak/PR reddediliyor; `approval_ref`'siz reprocess/tam-replay reddediliyor.
- ADR-E1 "Kilitli" statüsünde (insan onayı); `k-event-projection` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, outbox) ile mevcut.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. CI kapısı — `check-event-semantics.mjs` (öneri)

Tüketim semantiği makine-zorlamalıdır: kanıtsız teslim iddiası veya guard'sız consumer merge edilemez. Kapı bloklayıcıdır ve `.github/workflows/deploy.yml` `build` job'ında `node tools/agents/check-event-semantics.mjs` olarak çalışır (`scale-invariant-directive.md §6` `check-scale-invariant` ve `docs/ci-conformance-gates.md` desenine paralel).

Bu tablo `check-event-semantics` kapısının neyi zorladığını ve yeşil koşulunu tanımlar.

| Ne zorlar | Yeşil koşul |
|---|---|
| Her consumer/projeksiyon handler idempotent (`event_id` tekilleştirme) taşır | Guard'sız (tekilleştirmesiz) consumer tanımlanmamış |
| Her projeksiyon `aggregate_version` guard uygular (eski version yazamaz) | Version-guard'sız projeksiyon yazımı yok |
| Olay zarfı zorunlu alanları taşır (`event_id`, `aggregate_id`, `aggregate_version`, `causation_id`, `correlation_id`, `occurred_at`, `policy_version`, `tenant_id`) | Eksik-zarf olay tipi yok |
| Kod/doküman/PR "exactly-once"/"garanti teslim" iddiası içermiyor (kanıtsız) | `exactly[- ]once` / `guaranteed delivery` / "garanti teslim" pattern'ı bulunmuyor (anti-pattern §14) |
| Projeksiyon+offset aynı transaction'da yazılıyor | Ayrı-commit projeksiyon/offset deseni yok |
| ECA aksiyonu doğrudan HTTP/SMTP çağırmıyor (outbox üzerinden) | ECA handler'ında doğrudan `httpx`/`smtp` çağrısı yok |
| Replay `policy_version`-bilinçli (bugünün policy'si değil) | Replay yolunda "aktif/güncel policy ile" deseni yok |
| DLQ yolu mevcut (poison olay için) | Retry-limit + DLQ taşıma tanımlı; sonsuz-retry deseni yok |

Reddetme mesajı örneği: `consumer 'order_projection' aggregate_version guard olmadan tanımlanamaz` / `kanıtsız 'exactly-once' iddiası reddedildi: at-least-once + idempotent consumer kullanın`. Kapı sıfırdan farklı çıkış koduyla build'i durdurur; deploy yapılmaz.

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| EP-01 | Gerçekçi teslim modeli: at-least-once + idempotent consumer (exactly-once dili yasak) | Backend/Data | P0 | Integration | Duplicate/crash'te tek etki; "exactly-once" iddiası yok | kernel-team |
| EP-02 | Olay zarfı zorunlu sıralama/izlenebilirlik alanları (§5) | Backend/Data | P0 | Contract | Eksik-zarf olay reddedilir | kernel-team |
| EP-03 | `event_id` ile idempotent consumer (duplicate → no-op) | Backend | P0 | Integration(neg) | Aynı `event_id` iki kez → tek etki | kernel-team |
| EP-04 | `aggregate_version` guard (out-of-order: eski version yazamaz) | Backend | P0 | Integration(neg) | Eski version reddedilir, durum bozulmaz | kernel-team |
| EP-05 | Crash-after-commit güvenliği (projeksiyon+offset tek transaction) | Backend | P0 | Integration(neg) | Yeniden teslimde ikinci etki yok | kernel-team |
| EP-06 | İdempotent upsert projeksiyon yazımı (`ON CONFLICT DO UPDATE`) | Backend/Data | P1 | Integration | Aynı olay iki kez → aynı satır durumu | kernel-team |
| EP-07 | DLQ + retry + exponential backoff + poison-message | Backend | P1 | Integration | Poison olay DLQ'ya taşınır, kuyruk tıkanmaz | kernel-team |
| EP-08 | Rebuild: projeksiyon sıfırdan inşa (idempotent, yarıda-devam) | Backend | P1 | Integration | Rebuild kesilip devam eder, sonuç tutarlı | kernel-team |
| EP-09 | Replay olayın kendi `policy_version`'ıyla (bugünün policy'si değil) | Backend/Governance | P0 | Integration | Geçmiş olay eski versiyonla aynı sonuç üretir | kernel-team |
| EP-10 | Event store retention/archive (rebuild bağımlılığı korunur) | Backend/Data | P2 | Integration | Arşivli olayla rebuild çalışır | kernel-team |
| EP-11 | ECA yan-etki outbox üzerinden (at-least-once + idempotent) | Backend | P0 | Integration | Doğrudan HTTP yok; retry tek e-posta | kernel-team |
| EP-12 | Replay yan-etki varsayılan bastırma; tam-replay ayrı+onaylı | Backend/Governance | P1 | Integration | Replay'de gerçek e-posta yeniden gitmez | governance |
| EP-13 | Tenant izolasyonu tüketim/projeksiyonda (≥10 negatif case) | Security | P0 | Integration(neg) | Cross-tenant olay projeksiyona düşmez | security-team |
| EP-14 | `check-event-semantics` CI kapısı (guard/zarf/exactly-once iddiası) | Backend/DevOps | P0 | CI | Guard'sız/kanıtsız-iddia bloklanır | kernel-team |
| EP-15 | Alembic expand-contract + dolu downgrade (zarf genişletme) | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| EP-16 | AI consumer/projeksiyon `draft`; guard kaldıramaz | AI-Governance | P0 | Integration | Guard'sız/exactly-once draft reddedilir | governance |
| EP-17 | AI reprocess/tam-replay `approval_ref` zorunlu | AI-Governance | P0 | Integration | approval_ref'siz reprocess reddedilir | governance |
| EP-18 | Scale-invariant producer bağı (outbox yazma REFERANS, tekrar yok) | Governance/WBS | P1 | CI(data-quality) | İki sözleşme çelişmiyor; sınır net | pmo |
| EP-19 | `k-event-projection` WBS düğümü doğru dependsOn (k-tenancy, outbox) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
