# Execution-Context Envelope Yönergesi — Canonical Yürütme Bağlamı Zarfı (ActorContext + TenantContext + PolicyContext)

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-X1)
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `actor-party-contract.md` (kimlik/rol — kim), `pdp-policy-contract.md` (yetki kararı/policy-version), `capability-entitlement-contract.md` (effective_permissions/yetenek kapısı), `k-storage-dam-directive.md` (kardeş kernel primitifi deseni), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `actor-party-contract.md`, `pdp-policy-contract.md` ve `capability-entitlement-contract.md`'nin uzlaştırıcısıdır: onlar sırasıyla "kim?", "hangi yetki kararı?", "hangi yeteneğe hakkı var?" sorularını *ayrı ayrı* yanıtlar; bu sözleşme o üç bağlamı **tek canonical zarfta** birleştirir ve her yürütme yolunun (sync request, background job, event consumer, webhook, import/export, AI action) **aynı** bağlamı taşımasını sabitler. Bu doküman **kod yazmaz**; `k-exec-context` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0 modeli, Alembic migration, FastAPI dependency/middleware, imza doğrulama) ADR-X1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, platformdaki her yürütme biriminin (request, job, event, webhook, import/export, AI action) tek bir zorunlu bağlam zarfı taşımasını sabitler. Bugüne kadar aktör bağlamı (`actor-party`), kiracı bağlamı (`k-tenancy`/RLS), policy bağlamı (`pdp-policy`) ve yetenek bağlamı (`capability-entitlement`) farklı katmanlarda ayrı ayrı taşınıyordu; bu dağınıklık kısmi bağlamla çalışan yollar (örneğin `tenant_id` taşıyan ama aktörü kaybeden bir background job) ve gateway header'ına körü körüne güvenen giriş noktaları yarattı. Hedef: 50 uygulamanın hiçbirinin kendi bağlam-taşıma biçimini icat etmemesi; her yürütme biriminin **tek `ExecutionContext` zarfını** (tenant + actor + policy + capability özeti + izlenebilirlik alanları) zorunlu ve doğrulanmış taşıması. Aktör-açık ifade: *motor* zarfı üretir, doğrular ve imzalar; *insan* zarf üretemez (istek/oturum bağlamından türetilir); *ajan* zarfı ne üretebilir ne değiştirebilir — ajan bir yürütme birimini *çalıştırırken* motor ajana bir zarf verir (`actor_type=agent`). Zarf tek doğruluk kaynağıdır: aktör kimliği, kiracı, karar-verecek policy sürümü ve efektif izinler burada birleşir; alt katmanlar (PDP, RLS, capability-gate, audit) girdiyi bu zarftan okur, yeniden türetmez.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `ExecutionContext` canonical zarfının alan yapısı (`§5` şema — tenant_id, actor_type, actor_id, on_behalf_of, effective_permissions, policy_version, correlation_id, causation_id, idempotency_key, request_source), (2) zarfın backend'de üretilmesi/doğrulanması/imzalanması ve gateway header'ına güvenmeme kuralı (header-trust policy-bypass yasağı, P0), (3) aktör-tipi ayrımı (human/agent/system/service) ve "actor mı executor mü?" karışıklığının çözümü (delege bağlamının `on_behalf_of` ile ayrılması), (4) module-created her tablonun schema-level tenancy sınıfı taşıması (tenant-scoped/global/system), (5) her yürütme yolunun (sync request, background job, event consumer, webhook, import/export, AI action) *aynı* zarfı taşıması ve kısmi bağlam yasağı (fail-closed), (6) `check-envelope` CI kapısı önerisi, (7) `k-exec-context` düğümünün WBS yerleşimi. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Kimlik doğrulama (authentication) — login/oturum `k-identity`'nin işidir; `ExecutionContext` yalnız "kimliği *doğrulanmış* aktörün bağlamını" taşır, kimliği kendisi doğrulamaz. (2) Yetki *kararı* — allow/deny kararı PDP'nindir (`k-policy-pdp`); zarf yalnız kararın girdisini (`actor_id`, `effective_permissions`, `policy_version`) ve izlenebilirlik bağlamını taşır, karar vermez (bkz. §11 reconcile). (3) Rol/kimlik *tanımı* — kim ve hangi rolde sorusu `actor-party-contract.md`'dedir; zarf `actor_id`'yi ve türetilmiş `on_behalf_of`'u referanslar, party/rol kaydını yönetmez. (4) Yetenek *çözümü* — `effective_permissions`'ın nasıl hesaplandığı (`is_enabled`, `effective_capabilities`, plan×capability) `capability-entitlement-contract.md`'dedir; zarf sonucun *anlık görüntüsünü* taşır, çözüm motoru değildir. (5) Kiracı izolasyon *mekanizması* — RLS/`current_setting` uygulaması `k-tenancy`'nindir; zarf `tenant_id`'yi taşır ve RLS bağlamını *besler*, RLS'i kendisi kurmaz. (6) Serbest kodla bağlam taşıma — hiçbir app kendi ad-hoc dict/parametre setiyle bağlam geçiremez; bağlam yalnız bu sözleşmeli zarftan akar. (7) İş kuyruğu altyapısı seçimi (Celery/ARQ/Kafka) — zarf altyapı-agnostiktir; hangi taşıyıcı olursa olsun *aynı* zarf serialize edilir.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-exec-context`, sistemdeki her yürütme biriminin (request/job/event/webhook/import-export/AI-action) taşımak zorunda olduğu tek canonical bağlam zarfıdır; ActorContext (kim), TenantContext (hangi kiracı) ve PolicyContext (hangi policy sürümü + efektif izinler) üç ayrı bağlamı tek `ExecutionContext` yapısında birleştiren ve izlenebilirlik alanlarıyla (correlation/causation/idempotency) zenginleştiren kernel bağlam-taşıma katmanıdır.

**Ne yapar:** Bir yürütme birimi başlarken zarfı *motor tarafında* üretir (oturum/kimlik bağlamından türetir, header'dan değil); zarfı imzalar veya bütünlük-doğrular; `tenant_id`, `actor_type`, `actor_id`, `on_behalf_of`, `effective_permissions`, `policy_version`, `correlation_id`, `causation_id`, `idempotency_key`, `request_source` alanlarını tek yapıda taşır; her yürütme yoluna (senkron istek, background job, event consumer, webhook alıcısı, import/export işi, AI action) *aynı* zarfı geçirir; alt katmanlara (PDP `evaluate`, RLS `current_setting`, capability-gate, `AuditLogger.log`) girdiyi bu zarftan besler; kısmi/eksik zarfı reddeder (fail-closed); zarf mutasyonunu izlenebilir kılar (`causation_id` ile neden-zinciri).

**Ne yapmaz:** Kimlik doğrulamaz (login `k-identity`; zarf doğrulanmış kimliği alır). Yetki kararı vermez — bunu PDP yapar (zarf yalnız girdi). Rol/party kaydı tutmaz (o `k-party`). Yetenek hesaplamaz (o `k-capability`; zarf sonuç anlık görüntüsünü taşır). RLS'i kurmaz (o `k-tenancy`; zarf `tenant_id`'yi besler). Gateway header'ına güvenmez — header yalnız *ipucu*, zarf backend'de doğrulanır/yeniden-türetilir (§9 P0). AI'ın zarf üretmesine/değiştirmesine izin vermez (§10). Kısmi bağlamla çalışmaz — eksik alanlı zarf `EnvelopeIncompleteError` ile reddedilir, "bağlamsız devam" yoktur.

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki tablolar `ExecutionContext` canonical zarfının ve zarf-imza meta-yapısının veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez (alanlar tip ve amaçla anlatılır). Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır; zarf çoğunlukla bir wire/serialize yapısıdır (request state, job payload başlığı, event zarfı, audit satırı), ancak kalıcı izler (`decision_log`, `audit_log`) bu alanların bir alt kümesini kolon olarak taşır.

Bu tablo `ExecutionContext` canonical zarfının zorunlu alanlarını tanımlar; her yürütme birimi bu alanların tümünü taşır, kısmi taşıma yasaktır (§9, fail-closed).

| Alan | Tip | Amaç |
|---|---|---|
| `tenant_id` | UUID (NOT NULL) | Kiracı bağlamı; RLS `current_setting('app.current_tenant')` bu değerden beslenir; bağlam yoksa istek reddedilir (fail-closed). `k-tenancy` reconcile (§11). |
| `actor_type` | Enum(human, agent, system, service) | Aktörün tipi; kararın ve autonomy sınırının taban ayrımı. `human`=insan oturumu, `agent`=AI aktörü, `system`=platform içi tetikleyici (scheduler/retention), `service`=makine-makine servis hesabı. |
| `actor_id` | UUID (NOT NULL) | Eylemi yürüten aktörün kimliği; `k-party.party.id`'ye çözülür (human/agent/service için) veya sistem-aktör kimliği (system için). PDP `target_actor` ve `decision_log.request_actor` bunu okur. |
| `on_behalf_of` | UUID (nullable) | Delegasyon: aktör başka bir party adına hareket ediyorsa asıl party'nin kimliği; NULL = aktör kendi adına. Delege yetki bağlamı buradan ayrışır (§8 actor-vs-executor). |
| `effective_permissions` | JSONB (list/set) | Bu bağlamda çözülmüş efektif izin/yetenek anlık görüntüsü (`capability-entitlement` `effective_capabilities` + rol-türevi izin özeti); PDP'ye ve capability-gate'e girdi. Zarf *taşır*, hesaplamaz (§11 reconcile). |
| `policy_version` | Text (semver) | Kararı verecek/veren policy kümesinin sürümü; `pdp-policy` `policy.version` ile hizalanır ve `decision_log`'a hangi sürümün karar verdiğini izlemek için akar. Karar-cache invalidasyon anahtarı. |
| `correlation_id` | UUID/ULID (NOT NULL) | Uçtan-uca izleme kimliği; bir kullanıcı-niyetinden doğan tüm alt yürütmeleri (request → job → event → webhook) tek zincirde korele eder. `pdp-policy` `trace_id` ile eşlenir. |
| `causation_id` | UUID/ULID (nullable) | Bu yürütme birimini *doğuran* birimin kimliği (neden-zinciri); NULL = zincirin kökü (kullanıcı-başlatımı). Event-sourcing/iş kuyruğunda "hangi olay bunu tetikledi" izini kurar. |
| `idempotency_key` | Text (nullable) | Aynı yürütme biriminin tekrarında yan-etkiyi bir kez uygulamak için deterministik anahtar; retry/duplicate-delivery altında at-most-once semantiği (webhook/event/import tekrarında zorunlu). |
| `request_source` | Enum(sync_request, background_job, event_consumer, webhook, import_export, ai_action) | Yürütme yolu tipi; hangi giriş yolundan geldiğini işaretler. Header-trust yasağı ve autonomy sınırı bu alana göre uygulanır (§9, §10). |

Bu tablo zarfın bütünlük/imza meta-yapısını (`envelope_signature`) tanımlar; zarf backend'de üretilip imzalandığı için tampere karşı bu meta alan zarfa eşlik eder (gateway header'ına güvenmeme, §9 P0).

| Alan | Tip | Amaç |
|---|---|---|
| `issued_by` | Enum(gateway, service, engine) | Zarfı *hangi güvenilir bileşen* üretti; header'dan gelen ham değer değil, backend imza-üreticisi. |
| `issued_at` | TIMESTAMPTZ (NOT NULL) | Zarf üretim anı; zarf-yaşı/replay penceresi denetimi için. |
| `signature` | Text | Zarf içeriğinin motor-tarafı imzası/HMAC'i; downstream tüketici (job worker, event consumer) imzayı doğrulamadan zarfa güvenmez. |
| `key_id` | Text | İmzayı üreten anahtarın kimliği (rotasyon için); doğrulayan taraf doğru anahtarı seçer. |

Bu tablo module-created her tablonun taşımak zorunda olduğu schema-level tenancy sınıfını (`tenancy_class`) tanımlar; sınıf tablo tanımının parçasıdır (kolon değil, tablo-seviyesi metadata/comment), zarfın `tenant_id`'sinin o tabloya nasıl uygulanacağını belirler (§8.4).

| Sınıf | Anlam | Zarf ilişkisi |
|---|---|---|
| `tenant_scoped` | Satır bir kiracıya aittir; `tenant_id` kolonu + RLS zorunlu | Zarfın `tenant_id`'si RLS ve `WHERE tenant_id = …` ile uygulanır (varsayılan sınıf). |
| `global` | Satır tüm kiracılarca paylaşılır (referans veri); `tenant_id` yok | Zarfın `tenant_id`'si okunur; yazma yalnız `system`/çekirdek aktör (§10). |
| `system` | Satır platform işletmeci-katmanı (kilitli); AI/tenant dokunamaz | Zarfın `actor_type`'ı `system` değilse yazma reddedilir; `pdp-policy` `system` katmanıyla hizalı (§11). |

## 6. WBS yerleşimi

`k-exec-context`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-party`, `k-tenancy`, `k-capability`, `k-policy-pdp` ile aynı kernel katmanındadır ancak onların *taşıyıcısıdır* (bağlamı birleştirip alt katmanlara besler). Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-exec-context` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-exec-context` | module | `k-tenancy`, `k-party` | kernel/layer0 |

`dependsOn` gerekçesi: `k-exec-context` kiracı bağlamına (`k-tenancy`, `tenant_id` + RLS besleme) ve aktör kimliğine (`k-party`, `actor_id`/`on_behalf_of` çözümü) teknik olarak bağlıdır; bunlar hazır olmadan zarf üretilemez (bir zarf kiracısız veya aktörsüz var olamaz). `related` ile (karar üretmeden) `k-capability` (`effective_permissions` anlık görüntüsünün kaynağı), `k-policy-pdp` (`policy_version` ve kararın tüketicisi) ve `k-identity` (kimlik doğrulamasının önceli) düğümlerine bağlanır. `k-policy-pdp`, `k-capability` ve tüm iş modülleri kendi yürütme yollarında `ExecutionContext`'i *taşır* — yani zarf sözleşmesi bu tüketicilerin girdi biçimini sabitler; PDP `evaluate`, RLS bağlamı ve capability-gate zarftan okur.

## 7. Backend gereksinimleri

Aşağıdaki gereksinimler `core-contract-pack` bağlam-taşıma invariantını bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Stack: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL.

- **Zarf üretimi (motor-tarafı):** `ExecutionContext` yalnız güvenilir bileşende üretilir — senkron istekte FastAPI dependency (`Depends(build_execution_context)`) oturum/kimlik bağlamından türetir; job/event/webhook/import yolunda zarf üretici serialize edilmiş güvenli payload'dan yeniden kurulur ve imza doğrulanır. Ham gateway header'ından zarf *inşa edilmez* (§9).
- **Zarf imzası ve doğrulama:** Zarf motor-tarafı imza/HMAC (`signature` + `key_id`) taşır; downstream tüketici (Celery/ARQ worker, event consumer, webhook alıcısı) zarfı kullanmadan önce imzayı doğrular; imza geçersiz/eksikse `EnvelopeSignatureError` ile fail-closed reddedilir. Anahtar rotasyonu `key_id` ile desteklenir.
- **Tek taşıyıcı, altı yol:** Aynı `ExecutionContext` yapısı altı yürütme yolunda birebir taşınır (§13 tablo): sync request (request.state), background job (job payload başlığı), event consumer (event zarfı), webhook (doğrulanmış çağrı bağlamı), import/export (iş bağlamı), AI action (`actor_type=agent` zarfı). Kısmi bağlam üreten yol yasak; her yol tam zarf serialize eder.
- **Alt katman besleme:** Zarf üretildikten sonra `tenant_id` → RLS `SET LOCAL app.current_tenant`; `actor_id`/`on_behalf_of`/`effective_permissions`/`policy_version` → PDP `evaluate(actor, action, resource, context)` girdisi; `effective_permissions` → capability-gate; tüm alanlar → `AuditLogger.log()` ve `decision_log`. Alt katman girdiyi *yeniden türetmez*, zarftan okur (tek doğruluk kaynağı).
- **İzlenebilirlik zinciri:** `correlation_id` bir kök yürütme biriminden doğan tüm alt birimlere kopyalanır; alt birim üretilirken `causation_id` = üst birimin kimliği set edilir; `idempotency_key` retry/duplicate teslimde at-most-once yan-etki uygular (event/webhook/import zorunlu).
- **Fail-closed eksik-bağlam:** Zorunlu alanı (`tenant_id`, `actor_type`, `actor_id`, `correlation_id`, `request_source`) eksik zarf `EnvelopeIncompleteError` fırlatır ve işlenmez; "varsayılan tenant/aktör" *asla* uydurulmaz (v1 §2.1 fail-closed).
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak. `trace_id` zarfın `correlation_id`'siyle hizalanır.

## 8. Aktör-vs-executor ayrımı ve delegasyon

Aşağıdaki kural "actor mı executor mü?" karışıklığını çözer; bu ayrım kernelin doğru kalması için normatiftir ve ihlali anti-pattern sayılır (§14).

- **Actor her zaman zarftaki `actor_id`'dir; executor bir taşıyıcı ayrımı değildir.** Bir yürütme birimini *fiilen çalıştıran* runtime (worker process, event loop, AI ajanı) "executor"dur, ancak bağlamda temsil edilen *aktör* zarftaki `actor_id`'dir. Executor kendi kimliğini aktör yerine koyamaz; worker "sistem çalıştırdı" diye `actor_type=system` uydurmaz — orijinal aktör zarfla taşınır.
- **Agent = bir `actor_type`, executor değil.** AI ajanı bir yürütme birimini çalıştırdığında iki durum ayrışır: (a) ajan *kendi kimliğiyle* hareket ediyorsa `actor_type=agent`, `actor_id`=ajanın party kimliği, `on_behalf_of=NULL`; (b) ajan *insan adına* hareket ediyorsa `actor_type=agent`, `actor_id`=ajan, `on_behalf_of`=asıl insanın party kimliği. Delege yetki bağlamı (b'de) `on_behalf_of` üzerinden ayrı çözülür; PDP kararı hem ajanı hem asıl party'yi görebilir. Ajan hiçbir durumda `actor_type=human` taşıyamaz (kimlik gizleme yasağı).
- **Delegasyon yetkiyi genişletmez, aktarır.** `on_behalf_of` set edildiğinde efektif izin, delege eden party'nin izin kesişimiyle sınırlanır — delegasyon yeni yetki *icat etmez*; asıl party'nin sahip olmadığı bir izni ajan `on_behalf_of` ile kazanamaz. `actor-party.party_relation.kind = represents` bu delegasyonun kayıtlı temelidir (§11 reconcile).
- **Module-created tablo tenancy sınıfı taşır (schema-level).** Her modül tablosu §5'teki `tenancy_class`'lardan birini (`tenant_scoped` | `global` | `system`) tablo tanımının parçası olarak (tablo comment/metadata) *zorunlu* taşır; sınıfsız tablo `check-envelope` CI kapısında (§12) reddedilir. Zarfın `tenant_id`'si bu sınıfa göre uygulanır: `tenant_scoped`'ta RLS + `WHERE tenant_id`, `global`'da paylaşımlı okuma + kısıtlı yazma, `system`'de yalnız `actor_type=system` yazma. Varsayılan sınıf `tenant_scoped`; `global`/`system` açık gerekçe ister.

## 9. Gateway header'a güvenmeme (P0 güvenlik invariantı)

Aşağıdaki invariant sözleşmenin ihlal edilemez P0 güvenlik çekirdeğidir; ihlali doğrudan yetki-bypass'tır ve `check-envelope` (§12) ile bloklanır.

- **Header yalnız ipucu, zarf backend'de doğrulanır.** Gateway/proxy'nin eklediği bağlam header'ları (`X-Tenant-Id`, `X-Actor-Id`, `X-Roles`, `X-Permissions` vb.) **güvenilmez girdidir**; backend bu header'lardan zarf *inşa etmez* ve bu header'lara dayanarak policy kararı vermez. Zarf motor-tarafı oturum/kimlik bağlamından türetilir ve imzalanır (`§5` `envelope_signature`).
- **Header-trust policy-bypass YASAĞI.** Bir isteğin `tenant_id`'sini, `actor_id`'sini, `actor_type`'ını veya `effective_permissions`'ını yalnızca gelen header'a bakarak belirlemek ve PDP/RLS/capability-gate'i bu değerle beslemek **kesinlikle yasaktır** — bu, saldırganın header enjekte ederek başka kiracıya/aktöre bürünmesine izin verir. Header ile zarf çelişirse zarf kazanır ve olay audit'lenir.
- **Downstream imza doğrulaması zorunlu.** Job/event/webhook/import yolunda taşınan zarf, tüketici tarafında imza doğrulanmadan kullanılamaz; imzasız/geçersiz-imzalı zarf reddedilir (fail-closed). Bir yürütme biriminin zarfını taşıyıcı katmanda (kuyruk mesajı, HTTP gövdesi) *değiştirmek* imzayı bozar ve doğrulamada yakalanır.
- **Webhook gelen çağrı özel-doğrulanır.** Dış webhook alıcısı, çağıranın kimliğini (imza/secret) doğrular ve ardından zarfı *motor-tarafı* kurar; dış çağrının gövdesindeki hiçbir "actor/tenant" alanına güvenilmez. Dış kaynaktan gelen `tenant_id`/`actor_id` claim'i yalnız doğrulanmış eşleme üzerinden çözülür.
- **İç servis-hesabı da zarf taşır.** Makine-makine (`actor_type=service`) çağrılar da tam zarf taşır; "iç ağ, güvenli" varsayımı yasaktır (zero-trust). Servis-hesabı kimliği `actor_id`'ye çözülür ve kendi izin kümesiyle sınırlıdır.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu invariant `pdp-policy-contract §10` ile aynı sertliktedir.

Bu tablo `k-exec-context` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Zarf *üretme* | `none` | AI `ExecutionContext` üretemez; zarf motor tarafından oturum/kimlik bağlamından üretilir. AI action çalışırken zarfı *motor verir* (`actor_type=agent`). |
| Zarf alanı *değiştirme* | `none` | AI `tenant_id`/`actor_id`/`actor_type`/`on_behalf_of`/`effective_permissions`/`policy_version` alanlarını değiştiremez; imza değişimi yakalar. |
| `actor_type` yükseltme | `none` | AI kendi `actor_type=agent`'ını `human`/`system`/`service`'e yükseltemez (kimlik/yetki gizleme yasağı). |
| `effective_permissions` genişletme | `none` | AI kendi efektif izin kümesini büyütemez; delegasyonda `on_behalf_of` yalnız kesişimle daraltır (§8). |
| Yeni yürütme birimi *önerme* | `draft` | AI bir iş/aksiyon *önerir* (draft); motor zarfı (`actor_type=agent`) üretip uygular; AI zarfsız yol açamaz. |
| Karar-logu / audit / zarf-imza değişimi | `none` | Audit ve `decision_log` append-only; imza anahtarı AI'a kapalı; AI değiştiremez. |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; zarfı üretemez/değiştiremez/imzalayamaz. **AI action da zarf taşır** — motor AI'a `actor_type=agent` zarfı verir ve her AI kaynaklı yürütme birimi bu zarfla PDP/RLS/capability-gate/audit'e tabidir; AI bağlam-dışı (zarfsız) çalışamaz. PDP kararı zarftaki `effective_permissions` + `policy_version`'a bakar; AI PDP kararını override edemez.

## 11. Reconcile — actor-party, pdp-policy, tenancy, capability bağlaması

`ExecutionContext` tek başına yeni bir doğruluk kaynağı icat etmez; üç mevcut sözleşmeyi uzlaştırıp *taşır*. Aşağıdaki bağlamalar hangi zarf alanının hangi kardeş sözleşmeden türediğini ve nereye beslendiğini sabitler (çelişme değil, referans).

- **actor-party bağlama (kimlik — kim):** Zarfın `actor_id`'si `actor-party-contract.md` `party.id`'ye çözülür; `on_behalf_of` delegasyonda asıl party'yi işaret eder ve `party_relation.kind = represents` kaydına dayanır. `effective_permissions`'ın rol-türevi kısmı `party_role` + `effective_roles(party_id, at)` çıktısından beslenir. Zarf party/rol *tanımlamaz* — `k-party` tanımlar, zarf referanslar (`actor-party §5, §11`).
- **pdp-policy bağlama (yetki kararı — policy_version/karar):** Zarf PDP'nin (`k-policy-pdp`) girdi taşıyıcısıdır: `actor_id` → `target_actor`, `effective_permissions` → capability-gate girdisi, `policy_version` → hangi policy kümesinin karar verdiği ve `decision_log`'a akan sürüm, `correlation_id` → `decision_log.trace_id`. PDP `evaluate(actor, action, resource, context)` çağrısında `context` bu zarftan kurulur. Zarf karar *vermez* — PDP verir; zarf kararın deterministik ve izlenebilir olmasını sağlar (`pdp-policy §7, §5`).
- **tenancy bağlama (RLS):** Zarfın `tenant_id`'si `k-tenancy` RLS bağlamını besler (`SET LOCAL app.current_tenant = <tenant_id>`); tüm sözleşmelerdeki `USING (tenant_id = current_setting('app.current_tenant')::uuid)` bariyeri bu değerden çalışır. Kısmi bağlam (tenant'sız zarf) fail-closed reddedilir. `tenancy_class` (§5, §8.4) her module-created tablonun bu izolasyonu nasıl uygulayacağını schema-level sabitler.
- **capability bağlama (effective_permissions):** Zarfın `effective_permissions` alanı `capability-entitlement-contract.md` `effective_capabilities(subject)` + `is_enabled(tenant_id, capability)` çıktısının anlık görüntüsüdür; capability-gate (404/403) ve PDP "yetenek yoksa deny" kuralı bu alandan okur. Zarf yeteneği *çözmez* — `k-capability` çözer; zarf sonucu taşır ki her yol (özellikle background job/event) aynı efektif izinle çalışsın (`capability-entitlement §7, §11`).

## 12. check-envelope CI kapısı (öneri)

Aşağıdaki statik kontrol, `check-core-contract` ailesine eklenmesi önerilen `check-envelope` CI kapısını tarif eder; amaç kısmi-bağlam ve header-trust ihlallerini merge öncesi bloklamaktır. Kapı öneri statüsündedir (ADR-X1 ile kilitlenir).

Bu tablo `check-envelope` CI kapısının denetlediği invariantları ve ihlal sonucunu tanımlar.

| Kontrol | Denetler | İhlalde |
|---|---|---|
| Zarf-zorunluluğu | Her yürütme giriş noktası (route handler, task, consumer, webhook, import job, AI action) `ExecutionContext` alır/taşır | Merge bloklanır (bağlamsız giriş noktası) |
| Header-trust yasağı | `request.headers`'tan doğrudan `tenant_id`/`actor_id`/`permissions` okuyup PDP/RLS'e besleyen kod yok | Merge bloklanır (P0 bypass) |
| Tam-alan | Zarf üretimi tüm zorunlu alanları (`§5`) set eder; kısmi zarf üreten yol yok | Merge bloklanır (fail-closed ihlali) |
| Tenancy-sınıfı | Her module-created tablo `tenancy_class` (`tenant_scoped`/`global`/`system`) metadata taşır | Merge bloklanır (sınıfsız tablo) |
| İmza-doğrulama | Downstream tüketici (worker/consumer/webhook) zarfı doğrulamadan kullanmıyor | Merge bloklanır (imzasız güven) |
| Actor-type bütünlüğü | AI kaynaklı yol `actor_type=agent` taşır; `human` gizlemesi yok | Merge bloklanır (kimlik gizleme) |

Kapı `plan-01` D-lint ailesiyle ve `check-core-contract.mjs` (tenant guard, resolver koruması, audit çağrısı, indeks) ile birlikte çalışır; `check-envelope` bağlam-taşıma eksenini ekler.

## 13. Test stratejisi

Aşağıdaki testler `core-contract-pack` bağlam invariantını ve bu sözleşmenin DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-exec-context` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Tek zarf altı yolda birebir taşınır (sync/job/event/webhook/import/AI); alanlar korunur | Entegrasyon |
| 2 | Kısmi bağlam reddedilir: eksik `tenant_id`/`actor_id`/`correlation_id` → `EnvelopeIncompleteError` (fail-closed) | Birim + entegrasyon (negatif) |
| 3 | Header-trust yasağı: enjekte `X-Tenant-Id`/`X-Actor-Id` zarfı değiştiremez; zarf oturumdan türer | Entegrasyon (negatif, P0) |
| 4 | İmza doğrulama: değiştirilmiş zarf downstream'de `EnvelopeSignatureError`; imzasız reddedilir | Entegrasyon (negatif) |
| 5 | Actor-vs-executor: worker `actor_type` uydurmaz; orijinal aktör zarfla taşınır | Entegrasyon |
| 6 | Delegasyon: `on_behalf_of` efektif izni kesişimle daraltır, genişletmez (`represents` temeli) | Birim + entegrasyon |
| 7 | AI action: motor `actor_type=agent` zarfı verir; AI zarf üretemez/değiştiremez; `human` gizleyemez | Entegrasyon (negatif) |
| 8 | Reconcile: zarf `tenant_id`→RLS, `actor_id`→PDP, `effective_permissions`→capability-gate, `policy_version`→decision_log besler | Entegrasyon |
| 9 | İzlenebilirlik: `correlation_id` zincirde korunur; `causation_id` neden-zincirini kurar; `idempotency_key` at-most-once uygular | Entegrasyon |
| 10 | Tenancy-sınıfı: `system` tablosuna `actor_type≠system` yazma reddedilir; sınıfsız tablo CI'da bloklanır | Entegrasyon + CI |

## 14. Acceptance criteria

- Altı yürütme yolunun (sync request, background job, event consumer, webhook, import/export, AI action) hepsi *aynı* `ExecutionContext` zarfını taşıyor; hiçbir yol kısmi bağlamla çalışmıyor.
- Zorunlu alanı eksik zarf `EnvelopeIncompleteError` ile fail-closed reddediliyor; "varsayılan tenant/aktör" uydurulmuyor.
- Gateway header'ından `tenant_id`/`actor_id`/`permissions` okuyup PDP/RLS'e besleyen kod yok; zarf backend'de üretilip imzalanıyor; header-trust bypass negatif testle reddediliyor (P0).
- Downstream tüketici (worker/consumer/webhook) zarfı imza-doğrulamadan kullanmıyor; değiştirilmiş/imzasız zarf reddediliyor.
- Actor-vs-executor ayrımı net: executor `actor_type` uydurmuyor; AI action `actor_type=agent` taşıyor ve `human` gizleyemiyor; delegasyon `on_behalf_of` ile izni kesişimle daraltıyor.
- Zarf alt katmanları besliyor: `tenant_id`→RLS, `actor_id`/`policy_version`→PDP + `decision_log`, `effective_permissions`→capability-gate; alt katman girdiyi yeniden türetmiyor (tek doğruluk kaynağı).
- Her module-created tablo `tenancy_class` (tenant_scoped/global/system) taşıyor; sınıfsız tablo ve zarfsız giriş noktası `check-envelope` ile merge öncesi bloklanıyor.
- AI zarf üretemiyor/değiştiremiyor/imzalayamıyor (`autonomy: none`); AI action motor-üretimi zarfla PDP/RLS/capability-gate/audit'e tabi.

## 15. Definition of Done

- §13'teki 10 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil; `check-envelope` (§12) öneri kapısı tanımlı ve yeşil.
- Zarf altı yürütme yolunda birebir taşınıyor; kısmi bağlam ve header-trust bypass negatif testlerle reddediliyor (P0 kanıtı).
- Zarf reconcile kanıtı: `k-party` (`actor_id`/`on_behalf_of`), `k-policy-pdp` (`policy_version`/karar), `k-tenancy` (RLS), `k-capability` (`effective_permissions`) entegrasyonu çalışıyor; alt katman girdiyi zarftan okuyor.
- ADR-X1 "Kilitli" statüsünde (insan onayı); `k-exec-context` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, `k-party`) ile mevcut.
- AI-guardrail testi: AI zarf üretemiyor/değiştiremiyor; AI action `actor_type=agent` zarfı taşıyor; kimlik gizleme reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. Reconcile-matrisi (kardeş sözleşme eşlemesi)

Aşağıdaki tablo, `ExecutionContext` zarf alanlarının hangi kardeş sözleşmeden türediğini ve nereye beslendiğini tek bakışta gösterir; her satır bir zarf alanını kaynak sözleşmeye ve tüketiciye bağlar (çelişme değil, uzlaştırma).

| Zarf alanı | Kaynak sözleşme | Türetim | Tüketici |
|---|---|---|---|
| `tenant_id` | `k-tenancy` | Oturum/kimlik bağlamı | RLS `current_setting('app.current_tenant')`; her tablo `WHERE tenant_id` |
| `actor_id` | `actor-party-contract §5` | `party.id` çözümü | PDP `target_actor`; `decision_log.request_actor`; audit `actor` |
| `on_behalf_of` | `actor-party-contract §5, §11` | `party_relation.kind=represents` | PDP delege bağlamı; efektif izin kesişimi (§8) |
| `actor_type` | Bu sözleşme (`§5`) | Kimlik-türü sınıflaması | Autonomy sınırı (§10); PDP; audit |
| `effective_permissions` | `capability-entitlement §7` | `effective_capabilities` + `is_enabled` + rol-türevi | Capability-gate (404/403); PDP "yetenek yoksa deny" |
| `policy_version` | `pdp-policy §5` | `policy.version` hizası | PDP karar; `decision_log`; karar-cache invalidasyon |
| `correlation_id` | `pdp-policy §5` (`trace_id`) | Kök yürütme kimliği | `decision_log.trace_id`; audit; dağıtık izleme |
| `causation_id` | Bu sözleşme (`§5`) | Üst yürütme birimi kimliği | Neden-zinciri; event-sourcing izi |
| `idempotency_key` | Bu sözleşme (`§5`) | Deterministik tekrar anahtarı | At-most-once yan-etki (event/webhook/import) |
| `request_source` | Bu sözleşme (`§5`) | Giriş yolu tipi | Header-trust yasağı (§9); autonomy (§10); audit |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| XC-01 | `ExecutionContext` canonical zarfı (10 zorunlu alan) tek yapıda | Backend/Data | P0 | Integration | Zarf tüm alanlarla üretilir/taşınır | kernel-team |
| XC-02 | Tek zarf altı yolda birebir taşınır (sync/job/event/webhook/import/AI) | Backend | P0 | Integration | Aynı zarf her yolda korunur | kernel-team |
| XC-03 | Kısmi bağlam fail-closed reddedilir (`EnvelopeIncompleteError`) | Backend/Security | P0 | Integration(neg) | Eksik alanlı zarf işlenmez | security-team |
| XC-04 | Gateway header-trust policy-bypass yasağı | Security | P0 | Integration(neg) | Header ile bürünme reddedilir | security-team |
| XC-05 | Zarf motor-tarafı üretilir + imzalanır (`signature`/`key_id`) | Security | P0 | Integration | Zarf header'dan inşa edilmez, imzalı | security-team |
| XC-06 | Downstream imza doğrulaması zorunlu (worker/consumer/webhook) | Security | P0 | Integration(neg) | İmzasız/değişik zarf reddedilir | security-team |
| XC-07 | Actor-vs-executor ayrımı: executor `actor_type` uydurmaz | Backend | P0 | Integration | Orijinal aktör zarfla taşınır | kernel-team |
| XC-08 | Agent = `actor_type`; delegasyon `on_behalf_of` ile ayrık | Backend/Data | P0 | Unit+Integration | Ajan `human` gizleyemez; delege ayrı | kernel-team |
| XC-09 | Delegasyon izni kesişimle daraltır, genişletemez | Security | P0 | Unit | `on_behalf_of` yeni yetki icat etmez | security-team |
| XC-10 | Module-created tablo `tenancy_class` (schema-level) zorunlu | Backend/Data | P0 | CI | Sınıfsız tablo bloklanır | kernel-team |
| XC-11 | `system` sınıfı yalnız `actor_type=system` yazma | Security | P0 | Integration(neg) | Yetkisiz yazma reddedilir | security-team |
| XC-12 | Zarf RLS'i besler (`tenant_id`→`current_setting`) | Backend/Integration | P0 | Integration | RLS zarftan çalışır | kernel-team |
| XC-13 | Zarf PDP'yi besler (`actor_id`/`policy_version`→`evaluate`/`decision_log`) | Backend/Integration | P0 | Integration | PDP context zarftan kurulur | kernel-team |
| XC-14 | Zarf capability-gate'i besler (`effective_permissions`) | Backend/Integration | P0 | Integration | Gate zarftan okur | kernel-team |
| XC-15 | İzlenebilirlik: `correlation_id`/`causation_id`/`idempotency_key` | Backend | P1 | Integration | Zincir + at-most-once çalışır | kernel-team |
| XC-16 | AI zarf üretemez/değiştiremez/imzalayamaz (`autonomy: none`) | AI-Governance | P0 | Integration(neg) | AI bağlam-dışı çalışamaz | governance |
| XC-17 | AI action `actor_type=agent` zarfı taşır | AI-Governance | P0 | Integration | AI action PDP/RLS/audit'e tabi | governance |
| XC-18 | `check-envelope` CI kapısı (zarf-zorunluluk, header-trust, tam-alan, sınıf) | Governance/CI | P1 | CI | Zarfsız/bypass merge bloklanır | pmo |
| XC-19 | Reconcile: actor-party/pdp/tenancy/capability zarftan beslenir (tek doğruluk kaynağı) | Integration | P0 | Integration | Alt katman girdiyi yeniden türetmez | kernel-team |
| XC-20 | `k-exec-context` WBS düğümü doğru dependsOn (k-tenancy, k-party) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
