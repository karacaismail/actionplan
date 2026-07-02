# k-provider-adapter Yönergesi — Sağlayıcı-Agnostik Port/Adapter Kernel Primitifi (Bring Your Own Provider)

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §13 DoD, ADR-PA1)
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `k-storage-dam-directive.md §7` (sağlayıcı-agnostik `StorageBackend` deseni — bu doküman onu genelleştirir), `k-signature` (imza sağlayıcı tüketicisi), `AI-governance` (AI/LLM sağlayıcı yönetişimi), `k-worker` (workflow/iş çalıştırma tüketicisi), `actor-party-contract.md` (kardeş primitif deseni), `scale-invariant-directive.md` (ölçek-değişmez sağlayıcı çağrıları), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `k-storage`'ın kardeşidir ve onu **genelleştirir**: `k-storage` yalnız *object storage* için tek bir `StorageBackend` portu tanımlar; `k-provider-adapter` bu deseni tüm dış sağlayıcı sınıflarına (imza, AI/LLM, storage, workflow, OCR, notification, timestamp) taşır. `k-storage`, `k-provider-adapter`'ın *storage yeteneği* için özel bir tüketicisidir; kendi provider seçimini bu primitife devreder. Bu doküman `k-policy-pdp` (yetki kararı) ile karıştırılmamalıdır — o "kim erişebilir?" der, `k-provider-adapter` "bu yetenek hangi somut sağlayıcıyla, hangi config/secret-ref ile karşılanır?" der. Bu doküman **kod yazmaz**; `k-provider-adapter` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0 modeli, Alembic migration, port arayüzleri, Strawberry tipi) ADR-PA1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir. Sağlayıcı implementasyonlarının kendisi (DocuSign SDK sarmalayıcısı, OpenAI istemcisi vb.) bu sözleşmenin **non-goal**'üdür (bkz. §3).

---

## 1. Amaç

Bu sözleşme, platformun dışa bağımlı her yeteneğinin (belge imzalama, AI/LLM çıkarımı, object storage, iş akışı/workflow, OCR, bildirim, zaman damgası) tek bir **port/adapter** kernel soyutlamasında tutulmasını sabitler. Hedef: 50 uygulamanın hiçbirinin belirli bir satıcıya (DocuSign, OpenAI, AWS, Temporal) doğrudan bağlanmaması; her uygulamanın bir yeteneği **somut sağlayıcıya değil, standart PORT'a** çağırması; hangi somut sağlayıcının o portu karşılayacağının **config-driven** (`provider_binding` kaydı) seçilmesi; sağlayıcı değişiminin kod değişmeden (yalnız binding kaydı) yapılabilmesi. Bu, "Bring Your Own Provider" (BYO) ilkesidir: bir tenant kendi DocuSign hesabını, kendi Azure OpenAI dağıtımını, kendi MinIO kümesini bağlar; app kodu aynı kalır. Aktör-açık ifade: *ajan* sağlayıcı sağlığı/maliyet/uyum sinyaline dayanarak binding değişikliği *önerir* (draft); *insan* onaylar (özellikle secret ve AI-provider için zorunlu); *motor* onaylı binding'i deterministik ve geri-alınabilir uygular. AI/LLM sağlayıcı binding'i AI'ın **kendisi tarafından değiştirilemez** (autonomy `none`) — bu, self-modifying AI riskini keser.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `provider_binding` çekirdek kaydı (bir yeteneğin hangi somut sağlayıcıya, hangi config/secret-ref, öncelik, sağlık ve statü ile bağlandığı), (2) `provider_capability_map` ile yetenek pazarlığı (capability negotiation — bir sağlayıcının hangi yetenek alt-kümesini gerçekten desteklediği), (3) standart **port arayüzü** deseni (her yetenek sınıfı için tek imza; sağlayıcı adaptörleri bu imzayı gerçekler), (4) config-driven sağlayıcı seçimi (binding çözümleme), (5) fallback zinciri (birincil sağlayıcı düşerse `priority` sırasına göre ikincil), (6) circuit breaker (art arda hata sağlayıcıyı geçici devre-dışı bırakır), (7) sağlık kontrolü (`health` alanı + periyodik prob), (8) tenant-kapsamlı binding izolasyonu, (9) `k-provider-adapter` düğümünün WBS yerleşimi, (10) secret'ın **inline saklanmaması** — yalnız KMS referansı (`secret_ref`) taşınması. Backend (async port çağrıları), frontend (binding yönetim yüzeyi), test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Sağlayıcı implementasyonlarının kendisi — DocuSign/Adobe/Zoho adaptör kodu, OpenAI/Azure/Anthropic istemci sarmalayıcısı, S3/MinIO/GCS backend'i, Temporal/BPMN workflow motoru: bunlar portu *gerçekleyen* ayrı teslimat düğümleridir; `k-provider-adapter` yalnız portu ve seçim/dayanıklılık sözleşmesini tanımlar. (2) Secret'ın kendisinin saklanması/rotasyonu — API anahtarı, özel anahtar, OAuth token bu primitifte **tutulmaz**; onları `k-kms`/secret-manager tutar, `provider_binding` yalnız `secret_ref` (KMS-ref) taşır. (3) Yetki/izin kararı — bir aktörün bir sağlayıcıyı çağırıp çağıramayacağı PDP'nindir (`k-policy-pdp`); `k-provider-adapter` yalnız *hangi* sağlayıcının çağrılacağını çözer, *kimin* çağırabileceğini değil. (4) Yeteneğin iş anlamı — imzanın hukuki geçerliliği `k-signature`'ın, üretilen içeriğin governance'ı `AI-governance`'ın, iş akışının adımları `k-worker`'ın sözleşmesidir; `k-provider-adapter` yalnız sağlayıcı-bağımsız *çağrı yüzeyini* sunar. (5) Serbest kodla sağlayıcı erişimi — hiçbir app doğrudan `docusign_client`, `openai.ChatCompletion`, `boto3.client("s3")` veya `TemporalClient` çağıramaz; erişim yalnız bu primitifin çözdüğü port üzerinden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-provider-adapter`, platformun her dış-bağımlı yeteneğini (imza/AI-LLM/storage/workflow/OCR/notification/timestamp) tek bir **standart port** arkasında temsil eden, o portu karşılayacak somut sağlayıcının seçimini `provider_binding` kaydıyla config-driven yapan ve sağlayıcı düşünce fallback/circuit-breaker ile dayanıklılık sağlayan kernel port/adapter kayıt defteridir. `k-storage`'ın `StorageBackend` soyutlamasının tüm yetenek sınıflarına genelleştirilmiş halidir.

**Ne yapar:** Bir yeteneği bir port arayüzüyle tanımlar (örn. `SignaturePort.request_signature()`, `AiPort.complete()`, `StoragePort.put()`); bir tenant/kapsam için o portu karşılayacak somut sağlayıcıyı `provider_binding` çözerek belirler (öncelik + sağlık + statüye göre); sağlayıcı config'ini `config` JSONB'den, secret'ı ise `secret_ref` üzerinden KMS'ten çözer (inline değil); sağlayıcı negotiate ettiği yetenek alt-kümesini `provider_capability_map`'ten doğrular; birincil sağlayıcı hata verirse `priority` sırasına göre fallback yapar; art arda hatada circuit breaker'ı açar (sağlayıcıyı geçici izole eder); periyodik sağlık probu ile `health` alanını günceller; her binding çözümleme/değişimini audit'ler; App'in **somut sağlayıcıyı hiç bilmemesini** sağlar (App yalnız porta çağırır).

**Ne yapmaz:** Sağlayıcıyı *implemente etmez* — DocuSign/OpenAI/S3/Temporal adaptörü ayrı teslimattır; `k-provider-adapter` portu tanımlar ve çözer, sağlayıcı davranışını gerçeklemez. Secret'ı *saklamaz* — yalnız `secret_ref` taşır; ham anahtar `config`'e yazılırsa sözleşme ihlalidir. Yetki kararı vermez — bunu PDP yapar. Sağlayıcıyı App'e sızdırmaz (App somut istemciyi doğrudan çağıramaz; erişim port üzerinden). Sağlayıcı-özel bir özelliği ortak porta gömmez — port yalnız yetenek sınıfının *ortak alt kümesini* sunar, satıcı-spesifik ekstra `config` üzerinden opt-in kalır. AI/LLM sağlayıcı binding'ini AI'ın kendisine değiştirtmez — provider/secret değişimi insan + KMS iznine bağlıdır (autonomy `none`).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki iki tablo, `k-provider-adapter` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. Kritik invariant: secret **hiçbir zaman** bu tabloda inline tutulmaz; `config` yalnız KMS referansı (`secret_ref`) barındırır, ham API anahtarı/özel anahtar/token içermez.

Bu tablo `provider_binding` çekirdek kaydının alanlarını tanımlar; bir kayıt "hangi yetenek, hangi somut sağlayıcıya, hangi config/secret-ref, hangi öncelik/sağlık/statü ile bağlı?" sorusunu yanıtlar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Binding'in benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu (BYO: her tenant kendi sağlayıcısı) |
| `capability` | Enum(signature, ai_llm, storage, workflow, ocr, notification, timestamp) | Bağlanan yetenek sınıfı; portu ayırır |
| `provider_key` | Text | Somut sağlayıcı anahtarı (docusign, adobe_sign, zoho_sign, dropbox_sign, qtsp_local, openai, azure_openai, anthropic, llm_local, s3, minio, azure_blob, gcs, temporal, bpmn, webhook, …) |
| `config` | JSONB | Sağlayıcı-spesifik konfigürasyon (endpoint, region, model, deployment, `secret_ref`); **ham secret yasak**, yalnız KMS-ref inline |
| `secret_ref` | Text (nullable) | KMS/secret-manager referansı (anahtarın kendisi değil); ham anahtar burada da tutulmaz, yalnız çözümleme adresi |
| `priority` | Integer | Fallback sırası; küçük değer önce denenir (birincil=0); aynı capability için sıralı zincir |
| `health` | Enum(healthy, degraded, down, unknown) | Son sağlık probu sonucu; circuit breaker ve fallback kararını besler |
| `status` | Enum(active, standby, disabled, draft) | Binding yaşam döngüsü; yalnız `active` çözümlemede kullanılır, `draft` insan onayı bekler |
| `circuit_state` | Enum(closed, open, half_open) | Circuit breaker durumu; `open` iken sağlayıcı geçici atlanır |
| `last_health_at` | TIMESTAMPTZ (nullable) | Son sağlık probu zamanı |
| `approval_ref` | UUID (nullable) | Onaylayan insan + zaman + gerekçe (provider/secret değişimi veya AI-draft binding ise zorunlu) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo `provider_capability_map`'in yetenek pazarlığını (capability negotiation) tanımlar; bir sağlayıcının bir yetenek sınıfı içinde *hangi alt-özellikleri* gerçekten desteklediğini kaydeder; port çözümleme, gereken alt-özelliği desteklemeyen sağlayıcıyı eler.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Kaydın benzersiz kimliği |
| `binding_id` | UUID (FK → provider_binding.id) | Hangi binding'in yeteneğini tarif ettiği |
| `capability` | Enum(signature, ai_llm, storage, workflow, ocr, notification, timestamp) | Yetenek sınıfı (binding ile tutarlı, sorgu kolaylığı için denormalize) |
| `feature_key` | Text | Alt-özellik anahtarı (qes, aes, embedded_signing, multipart, presign, streaming, function_calling, vision, bpmn_2_0, saga, webhook_retry, …) |
| `supported` | Boolean | Sağlayıcı bu alt-özelliği gerçekten destekliyor mu (negotiation sonucu) |
| `limits` | JSONB (nullable) | Alt-özellik sınırları (max token, max dosya boyutu, rate limit, bölge kısıtı) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

## 6. WBS / kernel yerleşimi

`k-provider-adapter`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-party`, `k-tenancy`, `k-storage` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü (port arayüzleri + binding çözümleyici) durur. Somut sağlayıcı adaptörleri (DocuSign, OpenAI, S3, Temporal) bu primitifin *altında değil*, onu `dependsOn` ile tüketen ayrı `feature`/`archetype` düğümleridir. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-provider-adapter` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-provider-adapter` | module | `k-tenancy`, `k-kms` | kernel/layer0 |

`dependsOn` gerekçesi: `k-provider-adapter` kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır; binding tenant-kapsamlıdır (BYO: her tenant kendi sağlayıcısı) ve tenant hazır olmadan binding çözülemez. `k-kms`'e bağlıdır çünkü secret asla inline tutulmaz; `secret_ref` çözümlemesi KMS/secret-manager hazır olmadan yapılamaz (sağlayıcı çağrısı kimliksiz kalır). `related` ile (karar üretmeden) `k-storage` (bu primitifin storage-yeteneği için özel tüketicisi; StorageBackend deseninin kaynağı), `k-signature`, `AI-governance`, `k-worker` düğümlerine bağlanır. Tüketici düğümler kendi `dependsOn`'unda `k-provider-adapter`'ı listeler — yani port önce gelir, tüketici porta çağırır; somut sağlayıcı adaptörü de `k-provider-adapter`'ı `dependsOn` eder (portu gerçeklemesi için önce port tanımı gerekir).

## 7. Backend gereksinimleri (port/adapter + async + dayanıklılık)

Aşağıdaki gereksinimler `k-storage §7` `StorageBackend` desenini tüm yetenek sınıflarına genelleştirir; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **Standart port arayüzü:** Her yetenek sınıfı için tek arayüz (`SignaturePort`, `AiPort`, `StoragePort`, `WorkflowPort`, `OcrPort`, `NotificationPort`, `TimestampPort`); somut sağlayıcı bu arayüzü gerçekleyen bir adaptördür (`DocuSignAdapter`, `OpenAiAdapter`, `S3Adapter`, `TemporalAdapter`). App yalnız porta çağırır; somut adaptörü asla import etmez. Doğrudan `docusign_client`/`openai.*`/`boto3.client`/`TemporalClient` çağrısı app'te **yasak**. (`k-storage`'daki `StorageBackend` bu desenin storage-özel örneğidir.)
- **Config-driven seçim:** Port çözümleyici (`ProviderResolver`) `capability` + `tenant_id` için `provider_binding`'i sorgular; `status=active`, en düşük `priority`, `circuit_state=closed`, `health∈{healthy,degraded}` olan binding'i seçer; `provider_capability_map`'te gereken `feature_key`'i desteklemeyen adayı eler. Sağlayıcı kod değişmeden binding kaydıyla değişir.
- **Secret çözümleme (inline değil):** Adaptör kimlik bilgisini `config.secret_ref` üzerinden KMS/secret-manager'dan runtime'da çözer; ham anahtar ne `config`'te ne logda ne cevapta görünür. `secret_ref` çözümlemesi başarısızsa çağrı fail-closed reddedilir (kimliksiz sağlayıcı çağrısı yapılmaz).
- **Capability negotiation:** Port bir alt-özellik (örn. imza için `qes`, AI için `vision`, storage için `multipart`) gerektirdiğinde, çözümleyici `provider_capability_map.supported=true` olmayan sağlayıcıyı atlar ve fallback zincirine iner; hiçbiri desteklemezse `CapabilityUnavailableError` fırlatır (sessiz düşürme yasak).
- **Fallback zinciri:** Birincil sağlayıcı (`priority=0`) hata/timeout verirse çözümleyici sıradaki `priority`'ye geçer; fallback idempotent olmalı (aynı çağrı iki sağlayıcıda çift-etki üretmemeli — imza/ödeme gibi non-idempotent yeteneklerde idempotency-key zorunlu). Fallback her denemesi audit'lenir.
- **Circuit breaker:** Bir sağlayıcı art arda eşik-üstü hata verirse `circuit_state=open` olur ve süre boyunca atlanır; süre sonunda `half_open` ile tek prob denenir, başarılıysa `closed`. Açık devre fallback'i tetikler; tüm zincir açıksa `ProviderUnavailableError`.
- **Sağlık probu:** Periyodik worker her `active` binding'e hafif prob atar, `health` ve `last_health_at`'ı günceller; ağır sağlık kontrolü istek yolunda değil worker'da (scale-invariant). `down` binding çözümlemede atlanır.
- **Async I/O:** Sağlayıcı çağrıları (ağ I/O) event loop'u bloklamaz; senkron SDK'lar thread pool'a (`run_in_executor`) veya async adaptöre offload edilir; uzun-süren yetenek (workflow tetikleme, batch OCR) `k-worker`'a taşınır (senkron istek yolunda değil).
- **Audit:** Her binding çözümleme, fallback, circuit-durum değişimi, provider/secret değişimi `AuditLogger.log()` ile `actor` + `resource=provider_binding` yazılır (v1 §2.5); secret **değeri** asla audit'e yazılmaz (yalnız `secret_ref` kimliği).
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak; sağlayıcı-özel hata standart port hatasına normalize edilir (App satıcı-spesifik exception görmez).

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; sağlayıcı binding yönetim yüzeyini bağlar.

- **Binding yönetim yüzeyi:** Yönetici bir yetenek sınıfı (imza/AI/storage/workflow/…) için binding listeler, ekler, önceliklendirir; provider listesi ve capability seçenekleri **runtime endpoint'ten** gelir, hardcoded provider adı/anahtarı **yasak** (BYO: yeni sağlayıcı UI koduna dokunmadan eklenir). Binding verisi TanStack Query ile çekilir.
- **Secret girişi (write-only):** Kimlik bilgisi girişi yalnız yazma (masked); ekranda ham secret **hiçbir zaman** geri gösterilmez; kaydedilen değer KMS'e gider, UI yalnız `secret_ref` kimliğini ve "tanımlı/tanımsız" durumunu görür.
- **Sağlık/durum görünürlüğü:** Her binding'in `health`, `circuit_state`, `status` rozeti gösterilir; `down`/`open` binding uyarıyla, `draft` binding "onay bekliyor" olarak ayrışır; fallback zinciri sırası (`priority`) görselleşir.
- **Yetenek pazarlığı görünürlüğü:** Bir sağlayıcının desteklediği `feature_key` alt-kümesi (`provider_capability_map`) gösterilir; gereken özelliği desteklemeyen sağlayıcı seçilmek istenirse UI uyarır.
- **Erişilebilirlik:** WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; durum rozetleri renk-dışı işaretle (ikon/metin) de ayrışır.
- **i18n:** Yetenek/sağlayıcı/durum/hata metinleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 9. Multi-tenant / RLS (tenant-scoped binding izolasyonu)

Her `provider_binding` ve `provider_capability_map` satırı `tenant_id` taşır (map, binding üzerinden) ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). BYO ilkesinin özü budur: her tenant kendi somut sağlayıcısını bağlar; bir tenant'ın binding'i diğerinin port çözümlemesine **asla** karışamaz. İzolasyon iki katmanlıdır: (1) `ProviderResolver` yalnız aktif tenant'ın binding'lerini çözer; cross-tenant binding çözümleme girişimi `TenantViolationError` fırlatır ve audit'lenir. (2) Metadata satırında PostgreSQL RLS ikinci bariyer: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Secret izolasyonu ek katmandır: bir tenant'ın `secret_ref`'i yalnız o tenant kapsamında çözülür; KMS erişim politikası tenant sınırını uygular; bir tenant başka tenant'ın secret'ını çözemez. Circuit breaker/health durumu da tenant-kapsamlıdır (bir tenant'ın sağlayıcı arızası diğerinin devresini açmaz). Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`). Bu primitifte kritik ek invariant: **AI kendi AI/LLM sağlayıcı binding'ini değiştiremez** — self-modifying model/endpoint riski (AI'ın kendini daha az denetlenen bir sağlayıcıya yönlendirmesi) mutlak yasaktır.

Bu tablo `k-provider-adapter` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Sağlık/maliyet/uyum sinyaline dayalı binding değişimi *önerme* | `draft` | AI "birincil sağlayıcı degraded, ikincile geçiş öner" gibi `BindingChangeDraft` üretir; doğrudan uygulayamaz |
| AI/LLM sağlayıcı binding değişimi | `none` | AI kendi çalıştığı model/endpoint binding'ini **değiştiremez**; provider/secret değişimi insan + KMS; self-modifying yasak |
| Provider/secret değişimi (herhangi capability) | onay-zorunlu | `approval_ref` (insan) + KMS yetkisi olmadan `config.secret_ref`/`provider_key` değişimi `ApprovalRequiredError` fırlatır |
| Yeni sağlayıcı binding ekleme | onay-zorunlu | Yeni `provider_binding` yalnız insan onayıyla `active` olur; AI en fazla `draft` statüde önerir |
| Fallback/circuit eşiği ayarı | onay-zorunlu | Dayanıklılık parametresi (eşik, TTL) insan onayı; AI değeri tek başına değiştiremez |
| Sağlık probu çalıştırma / `health` güncelleme | `draft` (öneri) / motor (uygulama) | AI/worker prob önerir; `health` alanını deterministik motor yazar, AI ham yazamaz |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez; secret değeri audit'e yazılamaz |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; **ham secret'ı asla okuyamaz/yazamaz/loglayamaz** (yalnız `secret_ref` kimliğini görebilir); kendi AI/LLM sağlayıcı binding'ini değiştiremez; provider/secret değişimini insan + KMS onayı olmadan uygulayamaz. PDP kararı erişimi belirler; AI PDP kararını override edemez.

## 11. Bağlama (k-signature/k-storage/AI-governance/k-worker tüketir; k-storage StorageBackend'i genelleştirir)

**`k-storage` bağlama (kaynak deseni genelleştirme):** `k-storage`'ın `StorageBackend` soyutlaması (put/get/delete/presign/multipart; S3/MinIO/Spaces/Wasabi/B2/GCS) `k-provider-adapter`'ın `StoragePort`'unun *özel bir örneğidir*. `k-storage` kendi provider seçimini (`digital_asset.provider`) `k-provider-adapter`'ın `capability=storage` binding'ine devreder; storage-özel fallback (bir bucket erişilemezse ikincil) buradan gelir. Bu doküman `StorageBackend` desenini imza/AI/workflow/OCR/notification/timestamp'e taşır.

**`k-signature` bağlama:** `k-signature` belge imzalama işini yapar ve somut imza sağlayıcısını (DocuSign/Adobe Sign/Zoho Sign/Dropbox Sign/yerel QTSP) `k-provider-adapter`'ın `SignaturePort`'u üzerinden çözer; `k-signature` DocuSign SDK'sını doğrudan çağırmaz, porta çağırır. İmza türü (`qes`/`aes`/embedded) `provider_capability_map` negotiation ile doğrulanır; sağlayıcı düşerse fallback QTSP zinciri devreye girer.

**`AI-governance` bağlama:** AI/LLM çağrıları (`OpenAI/Azure OpenAI/Anthropic/yerel LLM`) `AiPort` üzerinden çözülür; `AI-governance` model çıkarımı için somut sağlayıcıyı bilmez, porta çağırır. Kritik: AI/LLM binding değişimi AI tarafından **yapılamaz** (§10 autonomy `none`); model/endpoint/deployment değişimi insan + KMS onaylı governance kararıdır. `vision`/`function_calling` gibi özellikler negotiation ile doğrulanır.

**`k-worker` bağlama:** İş akışı/workflow tetikleme (`internal/BPMN/Temporal/webhook`) `WorkflowPort` üzerinden çözülür; `k-worker` uzun-süren işleri, batch OCR, sağlık probunu çalıştırır (senkron istek yolunda değil). Sağlayıcı çağrıları ölçek-değişmez arka plan işleridir (`scale-invariant-directive.md`): tek çağrıda da, 100k çağrıda da aynı port sözleşmesi; retry+backoff, idempotency-key (non-idempotent yetenekte), dead-letter.

**Tüketim yönü:** Tüm tüketiciler (`k-signature`, `k-storage`, `AI-governance`, `k-worker`) somut sağlayıcıya değil **porta** çağırır; sağlayıcı bilgisini bu primitiften çözer. Somut adaptör düğümü (DocuSign/OpenAI/S3/Temporal) portu *gerçekler* ve `k-provider-adapter`'ı `dependsOn` eder.

## 12. Test stratejisi

Aşağıdaki testler `core-contract-pack` DoD'unu ve BYO/dayanıklılık kabul kriterlerini karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-provider-adapter` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Config-driven seçim: aynı port kodu binding değişimiyle iki sağlayıcıya çözülüyor (kod değişmeden) | Entegrasyon |
| 2 | BYO: iki tenant aynı capability'de farklı sağlayıcıya bağlı, çözümleme tenant'a göre ayrışıyor | Entegrasyon |
| 3 | Secret inline değil: `config` ham anahtar içermiyor; secret yalnız `secret_ref` ile KMS'ten çözülüyor | Contract + Birim |
| 4 | Tenant izolasyonu: A tenant B'nin binding'ini/secret'ını çözemiyor (≥10 negatif case) | Entegrasyon (negatif) |
| 5 | Fallback: birincil sağlayıcı hata verince `priority` sırasına göre ikincile geçiliyor, denemeler audit'leniyor | Entegrasyon |
| 6 | Circuit breaker: art arda hata devreyi açıyor, süre sonunda half_open prob'la kapanıyor | Entegrasyon |
| 7 | Capability negotiation: gereken `feature_key`'i desteklemeyen sağlayıcı eleniyor; hiçbiri yoksa `CapabilityUnavailableError` | Entegrasyon |
| 8 | AI guardrail: AI kendi AI/LLM binding'ini değiştiremiyor; provider/secret değişimi `approval_ref`'siz reddediliyor | Entegrasyon |
| 9 | Sağlık probu: `down` binding çözümlemede atlanıyor; `health` worker'da güncelleniyor | Entegrasyon |
| 10 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 11 | GraphQL koruması: her resolver `permission_classes` taşıyor | Contract |

## 13. Acceptance criteria

- Aynı port kodu (`SignaturePort`/`AiPort`/`StoragePort`/`WorkflowPort`/…) yalnız `provider_binding` değişimiyle farklı somut sağlayıcıya çözülüyor; app somut istemciyi (DocuSign/OpenAI/boto3/Temporal) doğrudan çağırmıyor.
- BYO çalışıyor: iki tenant aynı yeteneği farklı sağlayıcıyla karşılıyor; çözümleme tenant-kapsamlı ayrışıyor; yeni sağlayıcı UI/app koduna dokunmadan (yalnız binding + adaptör) eklenebiliyor.
- Secret hiçbir zaman inline değil: `config` ham anahtar içermiyor; secret yalnız `secret_ref` üzerinden KMS'ten runtime'da çözülüyor; log/audit/cevapta ham secret görünmüyor.
- Cross-tenant binding/secret çözümleme en az 10 negatif test case ile reddediliyor ve audit'leniyor.
- Fallback zinciri çalışıyor: birincil sağlayıcı düşünce `priority` sırasına göre ikincile geçiliyor; non-idempotent yetenekte idempotency-key ile çift-etki önleniyor.
- Circuit breaker çalışıyor: art arda hata devreyi açıyor, sağlayıcıyı geçici izole ediyor, half_open prob'la iyileşiyor.
- Capability negotiation çalışıyor: gereken alt-özelliği desteklemeyen sağlayıcı eleniyor; hiçbiri desteklemezse sessiz düşürme yerine `CapabilityUnavailableError`.
- AI kendi AI/LLM sağlayıcı binding'ini değiştiremiyor (autonomy `none`); provider/secret değişimi `approval_ref` + KMS onayı olmadan reddediliyor.
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Doğrudan sağlayıcı çağrısı:** App'te `docusign_client`/`openai.*`/`boto3.client("s3")`/`TemporalClient` çağırmak — YASAK; erişim yalnız port (`SignaturePort`/`AiPort`/`StoragePort`/`WorkflowPort`) üzerinden.
- **Somut sağlayıcı import'u:** App'in somut adaptörü (`DocuSignAdapter` vb.) import etmesi — YASAK; App yalnız port arayüzünü bilir, somut adaptörü `k-provider-adapter` çözer.
- **Secret inline:** API anahtarı/özel anahtar/token'ı `config` JSONB'ye ham yazmak — YASAK; yalnız `secret_ref` (KMS-ref); ham secret log/audit/cevaba da sızamaz.
- **Sağlayıcı-özel API sızdırma:** Satıcı-spesifik özelliği ortak porta gömmek (port imzasını bir sağlayıcıya kilitlemek) — YASAK; port ortak alt küme, ekstra özellik `config`/`capability_map` opt-in.
- **Tenant sınırı atlama:** Cross-tenant binding/secret çözmek — YASAK; çözümleme tenant-kapsamlı, ihlal `TenantViolationError`.
- **Sessiz fallback/düşürme:** Sağlayıcı düşünce hatayı yutup boş dönmek veya gereken capability yokken sessiz atlamak — YASAK; fallback audit'li, capability yoksa açık hata.
- **AI'ın kendi binding'ini değiştirmesi:** AI/LLM sağlayıcı binding'ini AI'ın uygulaması — YASAK (self-modifying); `none` autonomy, insan + KMS.
- **Onaysız provider/secret değişimi:** `approval_ref`'siz `provider_key`/`secret_ref` değişimi — YASAK; `ApprovalRequiredError`.
- **Senkron ağır sağlayıcı işi:** Uzun workflow/batch OCR/sağlık probunu istek yolunda çalıştırmak — YASAK; `k-worker`'a offload.
- **Sağlayıcı implementasyonunu kernel'e gömme:** DocuSign/OpenAI/S3 adaptör kodunu `k-provider-adapter` içine yazmak — YASAK; primitif portu tanımlar, adaptör ayrı teslimattır.

## 15. Definition of Done

- §12'deki 11 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor.
- Config-driven seçim + BYO + fallback + circuit breaker + capability negotiation entegrasyon kanıtıyla çalışıyor; aynı port kodu binding ile çoklu sağlayıcıya çözülüyor.
- Secret inline-değil invariantı contract testiyle kanıtlı: `config`'te ham secret yok; `secret_ref` yalnız KMS çözümlemesi; log/audit'te ham secret yok.
- ADR-PA1 "Kilitli" statüsünde (insan onayı); `k-provider-adapter` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, `k-kms`) ile mevcut.
- AI-guardrail testi: AI kendi AI/LLM binding'ini değiştiremiyor; `draft`-dışı doğrudan provider/secret değişimi reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama).

## 16. CLM / PIM-v2 karşılığı (BYO Signature/AI/Storage/Workflow + Integration Hub)

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) ve platform gereksinimlerini `k-provider-adapter` sözleşme öğelerine nasıl eşlediğini gösterir; her satır bir "Bring Your Own Provider" yeteneğini veya Integration Hub ihtiyacını kernel primitifine bağlar. CLM'in özü: sözleşme yaşam döngüsünde imza, AI (özet/risk çıkarımı), depolama ve iş akışı sağlayıcılarının tenant-özel değiştirilebilir olması.

| CLM / platform gereksinimi | k-provider-adapter karşılığı |
|---|---|
| BYO Signature (DocuSign/Adobe Sign/Zoho Sign/Dropbox Sign/yerel QTSP) | §5 `provider_binding capability=signature`, §7 `SignaturePort` + negotiation (`qes`/`aes`/embedded) |
| BYO AI (OpenAI/Azure OpenAI/Anthropic/yerel LLM) | §5 `capability=ai_llm`, §7 `AiPort`; §10 AI kendi binding'ini değiştiremez (autonomy none) |
| BYO Storage (S3/MinIO/Azure Blob/GCS) | §5 `capability=storage`, §7 `StoragePort`; §11 `k-storage` StorageBackend'i genelleştirir |
| BYO Workflow (internal/BPMN/Temporal/webhook) | §5 `capability=workflow`, §7 `WorkflowPort`; §11 `k-worker` tüketir |
| Integration Hub (config-driven sağlayıcı takas, tek yönetim yüzeyi) | §7 config-driven seçim + `ProviderResolver`, §8 binding yönetim yüzeyi |
| Sağlayıcı dayanıklılık (birincil düşerse ikincil) | §7 fallback zinciri (`priority`) + circuit breaker + sağlık probu |
| Yetenek pazarlığı (sağlayıcı hangi özelliği destekliyor) | §5 `provider_capability_map`, §7 capability negotiation |
| Secret yönetimi (satıcı anahtarları inline değil) | §5 `secret_ref` (KMS-ref inline değil), §9 secret izolasyonu, non-goal §3 (KMS ayrı) |
| Tenant-özel sağlayıcı (her müşteri kendi hesabı) | §9 tenant-scoped binding izolasyonu + RLS ikinci bariyer |
| OCR/Notification/Timestamp sağlayıcı takası | §5 `capability∈{ocr,notification,timestamp}`, §7 ilgili portlar |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| PA-01 | `provider_binding` çekirdek kaydı tenant-kapsamlı (capability/provider_key/config/priority/health/status) | Backend/Data | P0 | Integration | Binding tenant izolasyonlu yazılır/okunur | kernel-team |
| PA-02 | Standart port arayüzü (signature/ai_llm/storage/workflow/ocr/notification/timestamp) | Backend | P0 | Contract | App yalnız porta çağırır, somut adaptör import'u yok | kernel-team |
| PA-03 | Doğrudan somut sağlayıcı çağrısı app'te yasak; erişim port üzerinden | Backend | P0 | Contract | Korumasız sağlayıcı erişimi yok | kernel-team |
| PA-04 | Config-driven seçim (`ProviderResolver` binding çözer) | Backend | P0 | Integration | Aynı kod binding ile çoklu sağlayıcıya çözülür | kernel-team |
| PA-05 | Secret inline değil; yalnız `secret_ref` (KMS) | Backend/Security | P0 | Contract | `config`'te ham secret yok, KMS'ten çözülür | security-team |
| PA-06 | Fallback zinciri (`priority` sırası, idempotency-key) | Backend/Resilience | P1 | Integration | Birincil düşünce ikincile geçiş, çift-etki yok | kernel-team |
| PA-07 | Circuit breaker (open/half_open/closed) | Backend/Resilience | P1 | Integration | Art arda hata devreyi açar, half_open iyileşir | kernel-team |
| PA-08 | Capability negotiation (`provider_capability_map`) | Backend | P1 | Integration | Desteklenmeyen özellik sağlayıcısı elenir | kernel-team |
| PA-09 | Sağlık probu + `health` güncelleme (worker'da) | Backend/Ops | P2 | Integration | `down` binding atlanır, health worker'da yazılır | kernel-team |
| PA-10 | Tenant-scoped binding izolasyonu + RLS ikinci bariyer | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| PA-11 | Binding çözümleme/fallback/değişim audit (append-only, secret değeri yok) | Security | P0 | Integration | Değişim audit'e düşer, ham secret audit'te yok | security-team |
| PA-12 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| PA-13 | Strawberry resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| PA-14 | Async I/O + uzun sağlayıcı işi worker'da | Backend/Perf | P1 | Integration | Sağlayıcı çağrısı isteği bloklamaz | kernel-team |
| PA-15 | AI kendi AI/LLM binding'ini değiştiremez (autonomy none) | AI-Governance | P0 | Integration | AI self-modifying provider reddedilir | governance |
| PA-16 | Provider/secret değişimi `approval_ref` + KMS onayı zorunlu | AI-Governance | P0 | Integration | approval_ref'siz provider/secret değişimi reddedilir | governance |
| PA-17 | Frontend binding yönetim yüzeyi (config-driven, secret write-only) | Frontend | P1 | E2E | UI binding verisinden türetilir, hardcoded provider yok | ui-team |
| PA-18 | WCAG 2.2 AA + i18n + durum rozeti renk-dışı işaret | Frontend/A11y | P2 | A11y(axe) | axe critical=0; durum renk-dışı ayrışır | ui-team |
| PA-19 | BYO Signature/AI/Storage/Workflow + Integration Hub (CLM) | Integration | P1 | Integration | Dört yetenek tenant-özel takas edilebilir | kernel-team |
| PA-20 | `k-storage` StorageBackend genelleştirmesi (StoragePort tüketimi) | Integration | P1 | Integration | k-storage provider seçimini porta devreder | kernel-team |
| PA-21 | `k-provider-adapter` WBS düğümü doğru dependsOn (k-tenancy, k-kms) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
