# k-kms Yönergesi — Sır / Anahtar Yönetimi Kernel Primitifi (Key Management Service)

**Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor) — insan onayı ile kilitlenecek. 2026-07-02.
**Gerekçe:** `k-provider-adapter-directive.md §5` (`secret_ref` alanı) ve `k-provider-adapter-directive.md §9` ("Secret izolasyonu ek katmandır… KMS erişim politikası tenant sınırını uygular") "secret_ref, asla satır-içi (inline)" değişmezini bir KMS (Key Management Service — anahtar/sır yönetim hizmeti) primitifine dayandırır; `marketplace-module-security-directive.md` üçüncü-taraf modülün ham sırra erişemeyeceğini aynı temele oturtur. Ancak bu primitif (yönerge + WBS düğümü) bugüne kadar **yoktu**. Boşluk `gap-2026-07-02-01-kernel.md §4 G-K1`'de P0 (bloklayıcı kurucu boşluk) olarak kayıtlıdır: "`k-kms` primitifi hiç yok… Rotation, envelope encryption, tenant-başına KMS kapsamı, HSM desteği — hepsi tanımsız. E-posta, CRM, PIM, HRMS payroll, Ecommerce PSP dahil üçüncü-taraf kimlik bilgisi kullanan her ürünü etkiler." Bu doküman o boşluğu kapatan tam sözleşmedir; önceki `docs/drafts/k-kms-directive.md` iskeleti bunun taslak öncülüdür ve bu doküman kilitlendiğinde iskelet arşivlenir.
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `k-provider-adapter-directive.md` (secret_ref tüketicisi, kardeş primitif deseni), `k-storage-dam-directive.md` (kardeş primitif deseni, sözleşme biçimi örneği), `k-signature-trust-directive.md` (kardeş primitif deseni, sözleşme biçimi örneği), `marketplace-module-security-directive.md` (üçüncü-taraf modülün güvensiz özne varsayımı), `gap-2026-07-02-01-kernel.md §4 G-K1` (bu primitifin gerekçesi ve önceliği), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `k-provider-adapter`'ın **temelidir**, kardeşi değil: `k-provider-adapter` "hangi somut sağlayıcı, hangi config?" sorusunu yanıtlarken sağlayıcı kimlik bilgisini asla kendi tablosunda tutmaz — yalnız `secret_ref` taşır; o referansın gerçek gizli değere **nasıl** çözüleceği bu dokümanın konusudur. `k-kms` `k-storage`'ın da **dolaylı temelidir**: `k-storage`'ın provider kimlik bilgisi (S3/GCS erişim anahtarı) de aynı `secret_ref` deseninden geçer. Bu doküman **kod yazmaz**; `k-kms` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0/SQLModel modeli, Alembic migration, Vault/age/cloud-KMS adaptör soyutlaması, FastAPI servis katmanı) ADR-KMS1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir. Gerçek gizli değerin (API anahtarı, özel anahtar, parola) **kendisi bu repoda hiçbir zaman bulunmaz** — bu doküman yalnız referans/kapsam/rotasyon sözleşmesini tarif eder.

---

## 1. Amaç

Bu sözleşme, platformdaki her sırrın (API anahtarı, veritabanı parolası, imza özel anahtarı, OAuth client secret, webhook imzalama anahtarı, şifreleme anahtarı) tek bir kernel soyutlamasında çözümlenmesini sabitler. Hedef: 50 uygulamanın hiçbirinin kendi ortam değişkeni dosyasına, kendi `.env`'ine veya kendi kod-içi sabitine sır yazmaması; her sırrın bir `secret_binding` kaydıyla tanımlanıp gerçek gizli değerin yalnızca çalışma-zamanında (runtime), yalnızca bellek-içi ve yalnızca yetkili çağıran için, harici bir kasa arka-ucundan (Vault / `age` / bulut-KMS) çözülmesi; sırrın hiçbir zaman kod deposunda, konfigürasyon dosyasında, günlükte (log) veya API yanıtında satır-içi (inline) görünmemesi. Aktör-açık ifade: *ajan* rotasyon zamanlaması veya sır-taşıma (migration) önerir (draft); *insan* yeni sır tanımını, rotasyon politikasını ve arka-uç değişimini onaylar; *motor* onaylı rotasyonu deterministik ve geri-alınabilir uygular. AI hiçbir aşamada ham sır **değerini** göremez — yalnız `secret_ref` kimliğini (bir metin etiketi) görebilir; bu mutlak bir sınırdır, autonomy seviyesi ile gevşetilemez.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `secret_binding` çekirdek kaydı (bir sırrın hangi tenant'a, hangi arka-uca, hangi sürüme, hangi rotasyon politikasına bağlı olduğu — gizli değerin **kendisi olmadan**), (2) `SecretPort` arayüzü (resolve/rotate/revoke — standart port deseni, `k-provider-adapter §7` ile aynı desen), (3) envelope encryption (zarf şifreleme — veri anahtarının bir ana anahtarla sarılması) modeli, (4) tenant-başına kapsam ve izolasyon, (5) rotasyon (rotation) yaşam döngüsü ve sürüm geçersizleştirme, (6) arka-uç soyutlaması (Vault / `age` / AWS KMS / GCP KMS / Azure Key Vault), (7) erişim denetimi PDP entegrasyonu (kim bir `secret_ref`'i çözebilir), (8) audit (denetim izi) — sır değeri **hariç**, yalnız erişim olayı, (9) `k-kms` düğümünün WBS yerleşimi, (10) çok-kiracılı izolasyon ve AI guardrail zorunlulukları. Backend (async port çağrıları), frontend (write-only sır girişi yüzeyi), test ve CI-kapı önerisi ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) TLS sertifika yaşam döngüsü — sertifika üretimi/yenileme/iptal (Let's Encrypt/ACME, kurumsal CA) ayrı bir operasyonel endişedir; `k-kms` bir TLS özel anahtarını **saklayabilir** (bir `secret_binding` kaydı olarak) ama sertifika *yaşam döngüsünü* (yenileme takvimi, CA entegrasyonu) yönetmez — bu ayrı bir `k-tls-lifecycle` (varsa) veya altyapı-ekibi sorumluluğudur. (2) İş-verisi alan şifreleme (field-level encryption) — bir müşteri kaydındaki TC kimlik no veya IBAN alanının veritabanında nasıl şifreleneceği, hangi alanın maskeleneceği kararı `k-kms`'in değil, ilgili archetype'ın ve veri-sınıflandırma politikasının işidir; `k-kms` yalnız *anahtarı* üretir/saklar/rotate eder, alan-seviyesi şifreleme *stratejisini* dayatmaz. (3) HSM (Hardware Security Module — donanımsal güvenlik modülü) donanımının kendisinin sağlanması/işletilmesi — HSM, `k-kms`'in **opsiyonel bir arka-ucudur** (bulut-KMS'lerin çoğu zaten HSM-destekli); `k-kms` bir HSM satın almaz/kurmaz, yalnız `SecretPort` arayüzü üzerinden bir HSM-destekli arka-uca (AWS KMS, GCP Cloud KMS, Azure Key Vault Managed HSM) bağlanabilir. (4) Sağlayıcı kimlik doğrulama akışının kendisi (OAuth authorization-code akışı, SSO protokol detayı) — bu `k-provider-adapter`'ın ve kimlik-sağlayıcı entegrasyonunun işidir; `k-kms` yalnız akış sonunda üretilen *token/secret'ı* saklar. (5) Yetki/izin kararı — bir aktörün bir `secret_ref`'i çözüp çözemeyeceği kararı PDP'nindir (`k-policy-pdp`); `k-kms` yalnız PDP izniyle çözümleme yapar, izni kendisi vermez. (6) Serbest kodla sır erişimi — hiçbir app doğrudan `hvac.Client()` (Vault istemcisi), `boto3.client("kms")` veya ortam değişkeninden ham anahtar okuyamaz; erişim yalnız bu primitifin `SecretPort` sözleşmesinden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-kms`, platformdaki her sırrı (API anahtarı, parola, özel anahtar, OAuth secret) tek bir `secret_binding` referans katmanında temsil eden, gerçek gizli değeri asla veritabanında tutmayan, çözümlemeyi yalnızca çalışma-zamanında harici bir kasa arka-ucundan (Vault/`age`/bulut-KMS) yapan ve rotasyon/iptal yaşam döngüsünü yöneten kernel sır-yönetimi primitifidir. `k-provider-adapter`'ın `secret_ref` alanının **çözümleme motorudur**.

**Ne yapar:** Bir sırrı bir kez tanımlar (`secret_binding` — yalnız referans/metadata, gizli değer değil); `SecretPort.resolve(ref)` çağrısıyla gerçek gizli değeri çalışma-zamanında, yetkili çağıran için, bellek-içi ve kısa-ömürlü olarak çözer; `SecretPort.rotate(ref)` ile yeni sürüm üretir ve eskiyi kademeli geçersizleştirir; `SecretPort.revoke(ref)` ile bir sürümü anında iptal eder; envelope encryption ile veri-anahtarını bir ana-anahtarla sarar (ana-anahtar hiçbir zaman uygulama katmanına çıkmaz); tenant-başına kapsamı PDP ve RLS ile iki katmanlı uygular; her `resolve`/`rotate`/`revoke` çağrısını audit'ler (sır değeri **hariç**, yalnız olay + çağıran + zaman); arka-ucu (Vault/`age`/AWS KMS/GCP KMS/Azure Key Vault) config ile değiştirilebilir kılar (kod değişmeden).

**Ne yapmaz:** Gizli değeri veritabanı satırında **tutmaz** (`secret_binding` yalnız referans taşır; gerçek değer daima harici arka-ucta). Gizli değeri log'a, hata mesajına veya API yanıtına **yazmaz** (log/response'ta yalnız `secret_ref` kimliği görünür, ham değer asla). AI ajanına ham sır **göstermez** (AI yalnız `secret_ref` metnini görebilir; `resolve()` çağrısı AI'ın erişemeyeceği bir çalışma-zamanı bağlamında, insan-onaylı bir servis içinde yapılır). Yetki kararı **vermez** — bunu PDP yapar; `k-kms` yalnız PDP izniyle çözümler. TLS sertifika yaşam döngüsünü **yönetmez** (§3 non-goal). İş-verisi alan şifreleme stratejisini **dayatmaz** (§3 non-goal). Sağlayıcı-özel API'yi (örn. yalnız AWS KMS'e özgü bir özellik) sözleşmeye **sızdırmaz** — `SecretPort` ortak alt küme sunar, satıcı-spesifik ekstra özellik `config` üzerinden opt-in kalır (aynı desen `k-provider-adapter §4`).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki tablo ve arayüz tanımı, `k-kms` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 (veya SQLModel) karşılıklarıdır. **Kritik ve mutlak invariant: sırrın gerçek değeri hiçbir zaman bu tabloda, hiçbir kolonda, hiçbir JSONB alanında tutulmaz.** Tablo yalnız referansı, kapsamı, sürümü ve rotasyon politikasını taşır; gizli değerin kendisi daima harici kasa arka-ucunda (Vault/`age`/cloud-KMS) yaşar. Bu, `k-provider-adapter §5`'teki "`config` yalnız KMS referansı barındırır, ham API anahtarı/özel anahtar/token içermez" invariantının kaynağıdır — `k-provider-adapter`'ın `secret_ref` alanı bu tablonun `ref` alanına işaret eder.

Bu tablo `secret_binding` çekirdek kaydının alanlarını tanımlar; bir kayıt "bu referans hangi tenant'a, hangi arka-uca, hangi sürüme, hangi rotasyon politikasına bağlı?" sorusunu yanıtlar — "gizli değer nedir?" sorusunu **asla** yanıtlamaz.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Binding kaydının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu (bir sır asla tenant'sız var olamaz) |
| `ref` | Text (unique, indexed) | Sır referans anahtarı (`secret_ref`); `k-provider-adapter.provider_binding.secret_ref` bu alana işaret eder |
| `purpose` | Enum(provider_credential, db_password, signing_key, oauth_client_secret, webhook_signing_key, encryption_dek, tls_private_key, other) | Sırrın kullanım amacı; erişim politikası ve rotasyon sıklığı bunu ayırır |
| `backend` | Enum(vault, age, aws_kms, gcp_kms, azure_keyvault, local_dev_only) | Gerçek gizli değerin tutulduğu harici kasa arka-ucu; `local_dev_only` yalnız geliştirme ortamında, prod'da **yasak** |
| `backend_locator` | Text | Arka-uçtaki gerçek konum adresi (Vault path, KMS key ARN, Key Vault URI); **kendisi bir sır değildir**, yalnız adres |
| `version` | Integer (NOT NULL) | Aktif sürüm numarası; rotasyonda artar, eski sürüm `superseded` olur |
| `rotation_policy` | Enum(manual, days_30, days_60, days_90, days_180, days_365) | Rotasyon periyodu; `manual` yalnız insan tetiklemesiyle döner |
| `last_rotated_at` | TIMESTAMPTZ (nullable) | Son rotasyon zamanı; politika ile karşılaştırılıp gecikme tespit edilir |
| `next_rotation_due_at` | TIMESTAMPTZ (nullable) | Bir sonraki rotasyonun beklendiği zaman; `k-worker` bu alanı izler |
| `status` | Enum(active, rotating, superseded, revoked, draft) | Binding yaşam döngüsü; yalnız `active` çözümlemede kullanılır, `draft` insan onayı bekler |
| `envelope_key_id` | Text (nullable) | Bu sırrı saran ana-anahtarın (KEK — Key Encryption Key) kimliği; envelope encryption zincirini izlemek için |
| `allowed_scopes` | JSONB | Bu sırrı çözebilecek yetenek/rol/servis kapsamı (PDP ile birlikte değerlendirilir; sır her çağırana açık değildir) |
| `approval_ref` | UUID (nullable) | Onaylayan insan + zaman + gerekçe (yeni sır tanımı, rotasyon politikası değişimi veya arka-uç değişimi ise zorunlu) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

`SecretPort` arayüzü — arka-uç adaptörlerinin (Vault/`age`/AWS KMS/GCP KMS/Azure Key Vault) gerçeklediği standart port; şema, kod değil, arayüz **iskeleti**dir (aynı desen `k-provider-adapter §7`):

```
SecretPort:
  resolve(ref: SecretRef, caller_scope: Scope) -> SecretValue   # yalnız çalışma-zamanı, bellek-içi, kısa-ömürlü
  rotate(ref: SecretRef, approval: ApprovalRef) -> RotationResult  # yeni sürüm üretir, eskiyi kademeli geçersizleştirir
  revoke(ref: SecretRef, approval: ApprovalRef) -> RevocationResult  # sürümü anında iptal eder
  # SecretValue asla serileştirilmez (JSON/log/response'a yazılamaz); yalnız çağıran fonksiyon kapsamında yaşar
```

**Envelope encryption modeli (özet):** Her sır bir veri-anahtarı (DEK — Data Encryption Key) ile şifrelenir; DEK'in kendisi bir ana-anahtar (KEK — Key Encryption Key) ile sarılır (`envelope_key_id`). KEK yalnız arka-uçta (HSM veya bulut-KMS'in kendi güvenli sınırında) yaşar ve uygulama katmanına asla çıkmaz. Bu iki-katmanlı yapı, bir DEK sızsa bile KEK olmadan çözülemez olmasını sağlar; DEK rotasyonu KEK'i etkilemeden yapılabilir (ucuz rotasyon), KEK rotasyonu (nadir, insan-onaylı) tüm DEK'leri yeniden sarar.

## 6. WBS / kernel yerleşimi

`k-kms`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-tenancy`, `k-policy-pdp` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü (port arayüzü + arka-uç adaptörleri + rotasyon worker'ı) durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme; `blocks` = bu düğüm hazır olmadan aşağı-akış düğümleri ilerleyemez (tersine bağımlılık, gezinme amaçlı beyan).

Bu tablo `k-kms` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | blocks | Küme |
|---|---|---|---|---|
| `k-kms` | module | `k-tenancy`, `k-policy-pdp` | `k-provider-adapter`, e-posta primitifi, PSP/ödeme adaptörü, `k-signature` | kernel/layer0 |

`dependsOn` gerekçesi: `k-kms` kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır; her `secret_binding` tenant-kapsamlıdır ve tenant hazır olmadan bir sır tanımlanamaz. `k-policy-pdp`'ye bağlıdır çünkü bir `secret_ref`'in **kim tarafından** çözülebileceği kararı PDP'nindir; PDP hazır olmadan `resolve()` çağrısı kimin yetkili olduğunu bilemez (fail-closed — karar yoksa çözümleme reddedilir). `blocks` gerekçesi: `k-provider-adapter §6`'nın kendi `dependsOn`'unda zaten `k-kms`'i listelediği doğrulanmıştır ("`secret_ref` çözümlemesi KMS/secret-manager hazır olmadan yapılamaz"); bu doküman o ilişkiyi `k-kms` tarafından da teyit eder ve ayrıca e-posta taşıma (SMTP kimlik bilgisi), PSP/ödeme adaptörü (API anahtarı) ve `k-signature` (sağlayıcı kimlik bilgisi, `k-signature-trust-directive.md §11` "k-provider-adapter bağlama") gibi kimlik-bilgisi tüketen tüm aşağı-akış primitiflerinin `k-kms` olmadan ilerleyemeyeceğini açıkça işaretler. `related` ile (karar üretmeden) `k-storage` (provider erişim anahtarı da bu deseni kullanır), `marketplace-module-security` (üçüncü-taraf modülün ham sırra erişememesi) düğümlerine bağlanır.

## 7. Backend gereksinimleri (port/adapter + envelope encryption + async)

Aşağıdaki gereksinimler `k-provider-adapter §7`'deki port/adapter desenini sır-yönetimine özelleştirir; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Yığın: PostgreSQL + SQLAlchemy 2.0/SQLModel + Alembic + FastAPI (repo-genel backend standardı, `k-storage §7`/`k-signature §7` ile tutarlı).

- **Standart port arayüzü:** Tek `SecretPort` arayüzü (`resolve`/`rotate`/`revoke`) arka-uç-agnostik; Vault/`age`/AWS KMS/GCP KMS/Azure Key Vault aynı arayüzü gerçekleyen ayrı adaptörlerdir. App yalnız porta çağırır; somut arka-uç istemcisini (`hvac.Client()`, `boto3.client("kms")`) asla import etmez. Doğrudan arka-uç SDK çağrısı app'te **yasak**; erişim yalnız `SecretPort` sözleşmesinden.
- **Çözümleme (resolve) kısıtları:** `resolve(ref, caller_scope)` yalnız çalışma-zamanında çağrılır; dönen `SecretValue` asla serileştirilmez (JSON'a, log'a, response'a yazılamaz), asla diske yazılmaz, asla önbelleğe (Redis/disk cache) alınmaz — yalnız çağıran fonksiyonun bellek kapsamında (in-process, kısa-ömürlü) yaşar ve fonksiyon dönünce referans bırakılır (garbage-collect edilebilir olması beklenir). `caller_scope` `allowed_scopes` ve PDP kararıyla çapraz doğrulanır; ikisi de izin vermiyorsa fail-closed reddedilir.
- **Rotasyon (rotate) yaşam döngüsü:** `rotate(ref, approval)` yeni bir `version` üretir, `status=rotating` geçişiyle başlar; yeni sürüm arka-uçta hazır olduğunda eski sürüm `superseded` olur ve **kademeli** geçersizleşir (bir geçiş penceresi boyunca her iki sürüm de çözülebilir kalabilir — sıfır-kesinti rotasyonu için; pencere kapanınca eski sürüm çözümlemede reddedilir). Rotasyon `approval_ref` olmadan **başlatılamaz** (insan onayı zorunlu, §10).
- **İptal (revoke) — anında etki:** `revoke(ref, approval)` bir sürümü **anında** ve **kademesiz** geçersiz kılar (sızıntı/ihlal şüphesi senaryosu için — rotasyonun aksine geçiş penceresi yoktur); iptal edilen sürümle yapılan her `resolve()` çağrısı derhal `SecretRevokedError` fırlatır.
- **Envelope encryption:** Her sır bir DEK ile şifrelenir, DEK bir KEK (`envelope_key_id`) ile sarılır; KEK arka-uçta kalır, uygulama katmanına çıkmaz. DEK rotasyonu ucuz ve sık olabilir; KEK rotasyonu nadir ve insan-onaylıdır (tüm bağlı DEK'lerin yeniden sarılmasını gerektirir, bu işlem `k-worker`'a offload edilir — büyük DEK sayısında senkron yapılamaz).
- **Tenant-başına kapsam:** Bir arka-uç birden çok tenant'a hizmet edebilir (paylaşımlı Vault kümesi) ama her `secret_binding.tenant_id` ile arka-uçtaki `backend_locator` **tenant-prefix'li** olmalı (Vault path'i `tenant_id/…` ile başlar; KMS key policy tenant'a özel). Cross-tenant `backend_locator` çözümleme girişimi `TenantViolationError` fırlatır.
- **AI-erişim engeli (mimari zorunluluk):** `resolve()` çağrısı yalnız insan-onaylı, sınırlı bir servis katmanından (örn. sağlayıcı adaptörünün kendi runtime'ı) yapılabilir; bir AI-ajan sürecinin bu servise doğrudan erişimi **mimari olarak** engellenir (ayrı süreç/servis sınırı, ayrı kimlik bilgisi, ayrı ağ segmenti önerilir — somut izolasyon mekanizması ADR-KMS1'de detaylandırılır). AI yalnız `secret_ref` metnini okuyabilen bir API'ye erişebilir; `SecretValue` döndüren API'ye AI kimliğiyle **hiçbir zaman** erişilemez.
- **Rotasyon zamanlayıcı (worker):** `next_rotation_due_at` geçmiş `active` binding'leri periyodik worker tarar; süresi geçmiş rotasyon `RotationOverdueDraft` olarak insan/AI'a **önerilir** (draft), otomatik uygulanmaz (rotasyon her zaman `approval_ref` gerektirir, §10). Ağır kriptografik işlem (KEK rotasyonu, toplu DEK yeniden-sarma) worker'da, istek yolunda değil.
- **Async I/O:** Arka-uç çağrıları (Vault/KMS ağ I/O) event loop'u bloklamaz; senkron istemciler thread pool'a (`run_in_executor`) veya async adaptöre offload edilir.
- **Audit — sır değeri hariç:** Her `resolve`/`rotate`/`revoke`/binding-değişimi `AuditLogger.log()` ile `actor` + `resource=secret_binding` + `ref` (kimlik, değer değil) yazılır (v1 §2.5). **Gizli değerin kendisi hiçbir koşulda audit kaydına yazılmaz** — bu mutlak bir invariant, ihlali güvenlik olayıdır.
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak; hata mesajı **hiçbir zaman** gizli değeri veya değerin bir parçasını (örn. "anahtar `sk-abc...` geçersiz" gibi) içermez — yalnız `ref` kimliği ve hata kodu.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; sır tanımlama/rotasyon yönetim yüzeyini bağlar (`k-provider-adapter §8`'deki "Secret girişi (write-only)" deseninin genel kaynağı).

- **Write-only sır girişi:** Yeni sır tanımlama veya mevcut sırrı değiştirme ekranı yalnız **yazma** kabul eder (masked input); kaydedilen değer doğrudan arka-uca (`backend`) gider, hiçbir zaman uygulama veritabanına veya UI durumuna (state) geçmez; ekranda ham sır **hiçbir zaman** geri gösterilmez — kayıt sonrası yalnız `ref` kimliği ve "tanımlı/tanımsız" durumu görünür.
- **Binding yönetim listesi:** Yönetici `secret_binding` listesini `purpose`/`backend`/`status`/`rotation_policy` ile filtreler; liste verisi TanStack Query ile çekilir, **hiçbir satır gizli değer alanı içermez** (API zaten `SecretValue` döndürmez, bu UI kısıtı değil backend garantisidir — §7).
- **Rotasyon durumu görünürlüğü:** `next_rotation_due_at` geçmiş binding'ler uyarı rozetiyle ayrışır ("rotasyon gecikti"); `status=rotating` geçiş penceresi ilerlemesini gösterir; `revoked` sürüm geri-alınamaz olarak işaretlenir (UI bu durumdan "geri al" aksiyonu sunmaz).
- **Onay akışı entegrasyonu:** Yeni sır tanımı, rotasyon başlatma ve arka-uç değişimi taleplerinin `approval_ref` durumu (bekliyor/onaylandı/reddedildi) görünür; AI-önerili `RotationOverdueDraft` "AI önerisi — onay bekliyor" olarak insan-onaylı kayıttan görsel olarak ayrışır.
- **Erişilebilirlik:** WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; durum rozetleri renk-dışı işaretle (ikon/metin) de ayrışır (özellikle "gecikmiş rotasyon" ve "iptal edildi" durumları).
- **i18n:** Amaç/arka-uç/durum/hata metinleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 9. Multi-tenant / RLS (tenant-scoped secret_ref)

Her `secret_binding` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). İzolasyon üç katmanlıdır — `k-storage §9` ve `k-provider-adapter §9`'daki iki-katmanlı desenin bir katman daha güçlendirilmiş halidir (sır, en yüksek hassasiyetli veri sınıfı olduğu için): (1) Metadata satırında PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. (2) Arka-uç seviyesinde `backend_locator` tenant-prefix'lidir (Vault path `tenant_id/…`, KMS key policy tenant'a özel IAM/erişim kuralıyla sınırlı); bir tenant'ın `ref`'i başka tenant'ın `backend_locator`'ına asla çözülemez. (3) PDP çapraz-doğrulama: `resolve()` çağrısı yalnız RLS ve `backend_locator` eşleşmesi *yeterli* değildir — ayrıca `allowed_scopes` + PDP kararı çağıranın o tenant bağlamında o `purpose`'a yetkili olduğunu doğrulamalıdır; üç katmandan biri eksikse çağrı fail-closed reddedilir. Cross-tenant `resolve`/`rotate`/`revoke` girişimi `TenantViolationError` fırlatır ve audit'lenir (audit kaydı yine sır değeri içermez, yalnız `ref` + ihlal olayı). Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`). Bu primitifte kritik ek invariant: **AI ham sır değerini hiçbir koşulda göremez/okuyamaz/loglayamaz** — bu, autonomy seviyesi ne olursa olsun gevşetilemeyen mutlak bir sınırdır (diğer primitiflerdeki `none` autonomy bir *iş kararı* sınırıyken, buradaki sınır bir *veri erişimi* sınırıdır ve daha köktendir).

Bu tablo `k-kms` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Rotasyon zamanlaması / gecikme *önerme* | `draft` | AI `next_rotation_due_at` geçmiş binding'i tespit edip `RotationOverdueDraft` üretir; doğrudan rotate edemez |
| Sır-taşıma (migration) *önerme* | `draft` | AI bir arka-uçtan diğerine taşıma planı önerir (örn. `local_dev_only`'den `vault`'a); insan onaylar, doğrudan taşımaz |
| Yeni sır tanımlama (`secret_binding` oluşturma) | onay-zorunlu | `approval_ref` (insan) olmadan yeni binding `active` olamaz; AI en fazla `draft` statüde önerir |
| Rotasyon başlatma (`rotate()` çağrısı) | onay-zorunlu | `approval_ref` olmadan `rotate()` `ApprovalRequiredError` fırlatır; AI tek başına rotate edemez |
| İptal (`revoke()` çağrısı) | onay-zorunlu (acil istisna insan-tetikli) | `approval_ref` olmadan `revoke()` reddedilir; acil ihlal senaryosunda dahi tetikleyici bir insan (güvenlik operatörü) olmalıdır, AI değil |
| Arka-uç (`backend`) değişimi | `none` | Vault/KMS/age arka-uç kararı çekirdek güvenlik ekibi PR'ı; AI değiştiremez |
| `allowed_scopes` / erişim kapsamı değişimi | onay-zorunlu | Kapsam genişletme insan onayı; AI kapsamı kendi lehine genişletemez |
| `resolve()` çağrısı (ham değer okuma) | **AI'a mimari olarak kapalı** | AI kimliğiyle `SecretValue` döndüren API'ye erişim yoktur; bu bir onay meselesi değil, erişim yüzeyinin kendisinin AI'a sunulmamasıdır |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez; audit'te zaten sır değeri yoktur (§7) |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "rotasyon tamamlandı/güvenli" diyemez; **ham sır değerini hiçbir yolla (doğrudan çağrı, log okuma, hata mesajı ayrıştırma, yan-kanal) elde edemez**; kendi çalıştığı sağlayıcının (`k-provider-adapter` üzerinden erişilen AI/LLM binding'i) kimlik bilgisini değiştiremez veya görüntüleyemez (`k-provider-adapter §10`'daki self-modifying yasağıyla tutarlı, buradaki kısıt daha da temeldir: AI kendi kimlik bilgisinin *var olduğunu* bilir ama *değerini asla göremez*). PDP kararı erişimi belirler; AI PDP kararını override edemez.

## 11. Bağlama (k-provider-adapter temelidir; k-signature/k-storage/marketplace-module-security tüketir)

**`k-provider-adapter` bağlama (temel ilişki):** `k-provider-adapter §5`'teki `provider_binding.secret_ref` alanı doğrudan bu dokümanın `secret_binding.ref` alanına işaret eder; `k-provider-adapter §7`'deki "Secret çözümleme (inline değil)" gereksinimi bu dokümanın `SecretPort.resolve()` çağrısını kullanır. `k-provider-adapter` kendisi bir kasa değildir — sağlayıcı config'ini tutar ama gizli kısmı her zaman `k-kms`'e devreder. Bu ilişki tek yönlüdür: `k-provider-adapter` `k-kms`'e bağımlıdır (`dependsOn`), tersi değildir.

**`k-signature` bağlama:** `k-signature-trust-directive.md §11`'deki "k-provider-adapter bağlama (BYO)" ifadesi zincirleme olarak `k-kms`'e uzanır: bir QTSP/ESHS sağlayıcısının API kimlik bilgisi `k-provider-adapter` binding'inde `secret_ref` olarak tutulur, gerçek değer `k-kms`'ten çözülür. İmza özel anahtarının kendisi (varsa, yerel/aracı senaryoda) de aynı desenle `purpose=signing_key` bir `secret_binding`'tir.

**`k-storage` bağlama:** `k-storage-dam-directive.md §7`'deki sağlayıcı-agnostik `StorageBackend`'in provider kimlik bilgisi (S3/GCS erişim anahtarı, MinIO secret key) `k-provider-adapter` üzerinden `k-kms`'e uzanan aynı `secret_ref` zincirini kullanır; `k-storage` kendi tablosunda hiçbir zaman ham erişim anahtarı tutmaz.

**`marketplace-module-security` bağlama:** Üçüncü-taraf (pazaryeri) modülü güvensiz özne (untrusted actor) varsayımıyla çalışır; böyle bir modülün platform sırlarına (DB parolası, iç API anahtarı) erişimi **mimari olarak** engellenmelidir — bu engelleme `k-kms`'in AI-erişim-engeli (§10) ile aynı desendir: üçüncü-taraf modül süreci `resolve()` API'sine erişemeyen bir izolasyon sınırında çalışır; yalnız kendi tanımladığı ve kendi kapsamına `allowed_scopes` ile sınırlanmış sırlara (varsa) erişebilir.

**`e-posta`/`PSP`/`HRMS payroll`/`CRM`/`PIM` bağlama (aşağı-akış tüketiciler):** `gap-2026-07-02-01-kernel.md §4 G-K1`'de sayılan tüm ürünler (e-posta taşıma SMTP kimlik bilgisi, Ecommerce PSP API anahtarı, HRMS payroll banka entegrasyon kimlik bilgisi, CRM/PIM üçüncü-taraf entegrasyon anahtarı) `k-provider-adapter` zincirinden `k-kms`'e bağlanır; hiçbiri kendi sır saklama mekanizmasını icat etmez.

**Tüketim yönü:** Tüm tüketiciler (`k-provider-adapter` ve onun üzerinden `k-signature`, `k-storage`, e-posta, PSP, vb.) somut gizli değere değil `secret_ref`'e sahiptir; gerçek değeri yalnız yetkili çalışma-zamanı servisi `k-kms.SecretPort.resolve()` ile alır.

## 12. Test stratejisi (test-önce, negatif-ağırlıklı)

Aşağıdaki testler `core-contract-pack` DoD'unu ve sır-güvenliği kabul kriterlerini karşılar; hepsi test-önce (önce kırmızı) yazılır. Bu primitifte **negatif testler asıl kanıttır** — bir sır primitifinin doğruluğu, "doğru sırrı verdi mi" kadar "yanlış bağlamda hiçbir şey vermedi mi / hiçbir yerde sızdırmadı mı" ile ölçülür.

Bu tablo `k-kms` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Arka-uç-agnostik: aynı `SecretPort` kodu Vault ve `age`/stub arka-uca resolve/rotate/revoke yapıyor (config farkı) | Entegrasyon |
| 2 | Satır-içi sır tespiti: kod tabanında/`config` JSONB'de/commit geçmişinde ham secret pattern'i (API-key formatı, PEM header) bulunmuyor | Statik analiz (negatif) |
| 3 | Tenant izolasyonu: A tenant B'nin `ref`'ini çözemiyor, `backend_locator`'ına erişemiyor (≥10 negatif case) | Entegrasyon (negatif) |
| 4 | Rotasyon: `rotate()` yeni sürüm üretiyor, geçiş penceresinde her iki sürüm çözülüyor, pencere kapanınca eski sürüm `SecretRevokedError`/reddediliyor | Entegrasyon |
| 5 | İptal: `revoke()` sonrası aynı sürümle `resolve()` anında ve kademesiz reddediliyor | Entegrasyon (negatif) |
| 6 | Log/response sızıntı taraması: hata mesajları, audit kayıtları, API yanıtları hiçbir gizli değer parçası içermiyor (fuzz + regex tarama) | Contract + Statik analiz |
| 7 | AI-erişim engeli: AI kimlikli çağıran `resolve()` API'sine erişemiyor; yalnız `ref` metnini döndüren salt-okunur API'ye erişebiliyor | Entegrasyon (negatif) |
| 8 | Envelope encryption: DEK rotasyonu KEK'i etkilemiyor; KEK rotasyonu bağlı tüm DEK'leri yeniden sarıyor (worker'da, senkron değil) | Entegrasyon |
| 9 | PDP çapraz-doğrulama: `allowed_scopes` uygun ama PDP reddediyorsa (veya tersi) çözümleme reddediliyor (üç katmandan biri eksikse fail-closed) | Entegrasyon (negatif) |
| 10 | AI-guardrail: `approval_ref`'siz yeni binding/rotate/revoke/arka-uç değişimi reddediliyor | Entegrasyon (negatif) |
| 11 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor (yalnız metadata, gizli değer zaten DB'de değil) | CI |
| 12 | GraphQL/API koruması: her resolver `permission_classes` taşıyor | Contract |

## 13. Acceptance criteria

- Bir sır tanımlanır (`secret_binding`, `status=draft`) → insan onaylar (`approval_ref`) → `active` olur → yalnız yetkili çalışma-zamanı servisi `resolve()` ile gerçek değeri çalışma-zamanında, bellek-içi alır; değer hiçbir zaman veritabanına, log'a, response'a yazılmaz.
- Aynı `SecretPort` kodu Vault, `age`, AWS KMS, GCP KMS, Azure Key Vault için yalnız config (`backend`) değişimiyle çalışıyor; app doğrudan arka-uç SDK'sını çağırmıyor.
- Rotasyon kademeli ve sıfır-kesinti çalışıyor (geçiş penceresi); iptal anında ve kademesiz çalışıyor.
- Cross-tenant `secret_ref` çözümleme en az 10 negatif test case ile reddediliyor ve audit'leniyor (audit kaydı sır değeri içermiyor).
- Statik analiz taraması (satır-içi sır tespiti) kod tabanında, config dosyalarında ve commit geçmişinde ham secret bulmuyor.
- AI kimlikli hiçbir çağıran `resolve()` sonucu `SecretValue`'ya erişemiyor; AI yalnız `secret_ref` kimliğini görebiliyor.
- Envelope encryption çalışıyor: DEK/KEK ayrımı doğrulanmış, KEK uygulama katmanına hiç çıkmıyor.
- AI yeni sır tanımlama/rotasyon/iptal/arka-uç değişimini yalnız `draft` olarak öneriyor; `approval_ref` olmadan hiçbiri uygulanmıyor.
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Satır-içi sır:** API anahtarını/parolayı kod içine, `.env` dosyasına (versiyonlanan), `config` JSONB'ye veya WBS/migration dosyasına ham yazmak — YASAK; yalnız `secret_ref` (bkz. `k-provider-adapter §14`'teki aynı yasak, buradaki kaynak kural).
- **Doğrudan arka-uç SDK çağrısı:** App'te `hvac.Client()`/`boto3.client("kms")`/benzeri doğrudan çağırmak — YASAK; erişim yalnız `SecretPort` sözleşmesinden.
- **Sır'ı DB'de tutma:** `secret_binding` tablosuna gerçek gizli değeri (şifreli de olsa uygulama-seviyesinde yönetilen bir kolon olarak) yazmak — YASAK; gerçek değer daima harici kasa arka-ucunda, DB yalnız referans/metadata taşır.
- **Log/response'a sır sızdırma:** Hata mesajında, debug log'unda veya API yanıtında ham gizli değerin bir parçasını (kısmi anahtar, maskesiz token) göstermek — YASAK; yalnız `ref` kimliği.
- **AI'a ham sır verme:** AI-ajanına `resolve()` sonucunu (veya sonucun bir türevini, örn. "anahtarın son 4 hanesi") göstermek — YASAK; AI yalnız `secret_ref` metnini görebilir.
- **Önbelleğe alma:** `SecretValue`'yu Redis/disk cache/uzun-ömürlü process belleğine yazmak — YASAK; yalnız kısa-ömürlü, çağıran fonksiyon kapsamında.
- **Onaysız rotasyon/iptal:** `approval_ref`'siz `rotate()`/`revoke()` çağırmak — YASAK; `ApprovalRequiredError`.
- **Tenant sınırı atlama:** Cross-tenant `ref`/`backend_locator` çözmek — YASAK; `TenantViolationError`.
- **Sessiz rotasyon gecikmesi:** `next_rotation_due_at` geçmiş bir binding'i sessizce görmezden gelmek — YASAK; `RotationOverdueDraft` insan/AI'a görünür önerilir.
- **`local_dev_only` arka-ucun prod'da kalması:** Geliştirme-amaçlı yerel arka-ucu üretim ortamında kullanmak — YASAK; prod'da yalnız `vault`/`age`/bulut-KMS arka-uçları.
- **Tek-katmanlı izolasyon:** Yalnız RLS'e güvenip `backend_locator` tenant-prefix'ini veya PDP çapraz-doğrulamasını atlamak — YASAK; üç katmanın **tümü** zorunlu (§9).

## 15. Definition of Done

- §12'deki 12 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli); negatif testler (satır-içi sır tespiti, çapraz-tenant reddi, rotasyon-sonrası eski sürüm geçersizliği, log/response sızıntı taraması) özellikle kanıtlı.
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor.
- Arka-uç-agnostik `SecretPort` en az iki arka-uçla (biri gerçek Vault/cloud-KMS, biri stub) uçtan-uca çalışıyor; envelope encryption (DEK/KEK ayrımı) entegrasyon kanıtıyla doğrulanmış.
- `k-provider-adapter`'ın `secret_ref` çözümlemesi bu primitife bağlanmış durumda çalışıyor (entegrasyon kanıtı: `k-provider-adapter` binding'i `k-kms.resolve()` çağırıyor).
- ADR-KMS1 "Kilitli" statüsünde (insan onayı); `k-kms` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, `k-policy-pdp`) ve `blocks` (`k-provider-adapter` ve aşağı-akış primitifler) ile mevcut.
- AI-guardrail testi: AI'ın `resolve()` API'sine erişimi olmadığı mimari olarak kanıtlı (izolasyon testi); `draft`-dışı doğrudan yeni-binding/rotate/revoke/arka-uç-değişimi reddediliyor.
- Önceki `docs/drafts/k-kms-directive.md` iskeleti bu dokümanla değiştirildiği not edilmiş (taslak arşivlendi).
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, şema tablolarında mock değer yok).

## 16. CI kapısı (önerilen — henüz çalışmıyor)

**Not — bu bölüm bir öneridir, mevcut bir garantinin tarifi değildir.** `gap-2026-07-02-01-kernel.md §7` "test/kapı planı" adımında `check-secrets` kapısının "AI taslak → insan onay → CI bağla" sırasıyla yazılması gerektiğini belirtir; bugün itibarıyla böyle bir kapı bu repoda **mevcut değildir** ve hiçbir CI adımına bağlı değildir. Aşağıdaki tarif, kapı yazıldığında neyi doğrulaması *gerektiğinin* önerisidir — "çalışıyor" değil, "önerilen" olarak okunmalıdır.

- **Önerilen kapsam:** `check-secrets` adlı bir CI kapısı, değişen dosyalarda (diff bazlı, tüm repo taraması değil — performans için) bilinen sır kalıplarını (API-anahtarı formatları, PEM/private-key header'ları, yüksek-entropi rastgele string'ler, bilinen bulut-sağlayıcı token formatları) arar; bu iş için gitleaks (veya eşdeğer açık-kaynak tarayıcı) + repo-özel regex kural seti önerilir (gitleaks tek başına Türkçe/özel format kalıplarını bilmez, ek regex katmanı gerekir).
- **Önerilen tetikleyici:** Her PR'da (pull request) diff'e karşı çalışır; bulgu varsa PR kırmızıya düşer, merge engellenir.
- **Önerilen kapsam-dışı:** Gerçek gizli değerin **hiçbir zaman** bu repoda bulunmayacağı zaten mimari bir garanti olduğundan (§5 "sır değeri tabloda tutulmaz"), bu kapı asıl olarak *yanlışlıkla* eklenmiş sızıntıları (geliştiricinin test için geçici olarak gerçek bir anahtarı commit etmesi, `.env` dosyasının yanlışlıkla eklenmesi) yakalamayı hedefler — `k-kms`'in kendi mimari doğruluğunun **yerine geçmez**, ek bir güvenlik ağıdır.
- **İlişki netliği:** `check-secrets` kapısı **yazılana kadar**, bu dokümanın §12 madde 2 (satır-içi sır tespiti) ve §14 (satır-içi sır anti-pattern'i) testleri **manuel review** ve `k-kms` mimarisinin kendisiyle (sır asla DB'ye/koda yazılamayacak şekilde tasarlanmış olmasıyla) karşılanır; otomatik CI garantisi olarak sunulmaz. Bu doküman kilitlendiğinde (`ADR-KMS1`), `check-secrets` kapısının yazılması ayrı bir iş kalemi (`gap-2026-07-02-01-kernel.md §7` madde 1a) olarak izlenir, bu dokümanın DoD'una (§15) dahil **değildir** — kapı primitifin kendisinden sonra, ayrı bir CI-altyapı teslimatı olarak gelir.

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| KMS-01 | `secret_binding` çekirdek kaydı tenant-kapsamlı, gizli değer tabloda yok | Backend/Data | P0 | Integration + Contract | Binding tenant izolasyonlu yazılır/okunur, DB'de ham değer yok | security-team |
| KMS-02 | Arka-uç-agnostik `SecretPort` (Vault/age/AWS KMS/GCP KMS/Azure Key Vault) | Backend | P0 | Integration | Aynı kod config ile çoklu arka-uca çalışır | kernel-team |
| KMS-03 | Doğrudan arka-uç SDK app'te yasak; erişim `SecretPort`'tan | Backend | P0 | Contract | Korumasız arka-uç erişimi yok | kernel-team |
| KMS-04 | `resolve()` yalnız çalışma-zamanı, bellek-içi, önbelleksiz | Backend/Security | P0 | Integration + Negatif | SecretValue asla persist/cache edilmiyor | security-team |
| KMS-05 | Rotasyon (kademeli, sıfır-kesinti) + iptal (anında) yaşam döngüsü | Backend | P0 | Integration | Rotasyon penceresi + iptal anlık çalışır | security-team |
| KMS-06 | Envelope encryption (DEK/KEK ayrımı) | Backend/Security | P0 | Integration | KEK uygulama katmanına çıkmaz | security-team |
| KMS-07 | Tenant-scoped secret_ref + üç-katmanlı izolasyon (RLS + backend-prefix + PDP) | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| KMS-08 | Satır-içi sır tespiti (statik analiz) | Security | P0 | Static analysis | Kod/config/commit geçmişinde ham secret yok | security-team |
| KMS-09 | Log/response sızıntı taraması (sır değeri hiçbir çıktıda yok) | Security | P0 | Contract + Fuzz | Hata/audit/API yanıtında ham değer yok | security-team |
| KMS-10 | AI'ın `resolve()` API'sine mimari erişimsizliği | AI-Governance | P0 | Integration(neg) | AI kimlikli çağıran SecretValue alamaz | governance |
| KMS-11 | AI yeni-binding/rotate/revoke/arka-uç-değişimi yapamaz (onay-zorunlu/none) | AI-Governance | P0 | Integration(neg) | approval_ref'siz işlem reddedilir | governance |
| KMS-12 | Binding çözümleme/rotasyon/iptal audit (append-only, sır değeri yok) | Security | P0 | Integration | Değişim audit'e düşer, ham değer audit'te yok | security-team |
| KMS-13 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| KMS-14 | Strawberry/API resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| KMS-15 | Async I/O + ağır kriptografik iş (KEK rotasyonu) worker'da | Backend/Perf | P1 | Integration | Arka-uç çağrısı isteği bloklamaz | kernel-team |
| KMS-16 | Rotasyon-gecikme tespiti `draft` öneri (worker) | Backend/Ops | P2 | Integration | Gecikmiş rotasyon RotationOverdueDraft üretir | kernel-team |
| KMS-17 | Frontend write-only sır girişi + binding yönetim yüzeyi | Frontend | P1 | E2E | UI ham değeri asla göstermez, hardcoded arka-uç yok | ui-team |
| KMS-18 | WCAG 2.2 AA + i18n + durum rozeti renk-dışı işaret | Frontend/A11y | P2 | A11y(axe) | axe critical=0; durum renk-dışı ayrışır | ui-team |
| KMS-19 | `k-provider-adapter.secret_ref` çözümlemesinin bu primitife bağlanması | Integration | P0 | Integration | k-provider-adapter binding'i k-kms.resolve() çağırır | kernel-team |
| KMS-20 | `check-secrets` CI kapısı ile ilişki (önerilen, henüz bağlı değil) | Governance/CI | P1 | (öneri — henüz yok) | Kapı yazıldığında diff-bazlı sızıntı taraması yapar | security-team |
| KMS-21 | `k-kms` WBS düğümü doğru dependsOn (k-tenancy, k-policy-pdp) + blocks (k-provider-adapter ve aşağı-akış) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
