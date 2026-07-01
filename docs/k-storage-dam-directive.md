# k-storage / DAM Yönergesi — Object Storage ve Dijital Varlık Yönetimi Kernel Primitifi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §13 DoD, ADR-S1)
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `PIM-v2-Gereksinim-Analizi.md §Faz 8` (Medya / DAM & Depolama), `actor-party-contract.md` (kardeş primitif deseni), `scale-invariant-directive.md` (ölçek-değişmez medya işleri), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `actor-party-contract.md` ve `capability-entitlement-contract.md`'nin kardeşidir: onlar "kim / hangi yetki?" sorularını, `k-storage` "binary/medya varlığı nerede, hangi türevlerle, hangi URL ile?" sorusunu yanıtlar. `k-storage` **object storage / DAM** primitifidir; `k-archetype-storage` (ArcheType satırlarının JSONB/fiziksel-tablo depolama stratejisi) ile **karıştırılmamalıdır** — o structured veri depolamasıdır, bu binary/asset depolamasıdır. Bu doküman **kod yazmaz**; `k-storage` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy modeli, Alembic migration, boto3 soyutlama, Strawberry tipi) ADR-S1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, platformdaki her binary/medya varlığının (görsel, video, PDF, doküman, 3B model) tek bir kernel soyutlamasında tutulmasını sabitler. Hedef: 50 uygulamanın hiçbirinin kendi S3 istemcisini, kendi bucket adlandırmasını veya kendi pre-signed URL üretimini yeniden yazmaması; her varlığın tek bir `digital_asset` kaydında tanımlanıp fiziksel binary'nin sağlayıcı-agnostik object storage'da (S3/MinIO/Spaces/Wasabi/B2/GCS) tutulması, türevlerinin (`asset_rendition`) *veri* olarak yönetilmesi ve erişimin süreli imzalı URL veya CDN üzerinden verilmesi. Aktör-açık ifade: *ajan* varlık işlemi (varyant üretimi, meta-çıkarım, temizlik) önerir (draft); *insan* onaylar; *motor* onaylı işi deterministik ve geri-alınabilir uygular.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `digital_asset` çekirdek varlık kaydı (metadata + storage referansı), (2) `asset_rendition` ile aynı orijinalin çoklu türevi (thumbnail, kanal-özel varyant, WebP/AVIF, transcode), (3) sağlayıcı-agnostik object storage soyutlaması (boto3 S3-uyumlu backend + GCS), (4) büyük dosya için multipart upload, (5) süreli erişim için pre-signed URL, (6) EXIF/IPTC/XMP metadata çıkarımı, (7) CDN/CloudFront dağıtım katmanı, (8) tenant-kapsamlı bucket/prefix izolasyonu, (9) `k-storage` düğümünün WBS yerleşimi, (10) çok-kiracılı izolasyon ve audit zorunlulukları. Backend (boto3 + async), frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Görsel *işleme* algoritması (resize/crop/WebP kernel'i) — bunu `image_variants` işi (PIM Faz 8, `scale-invariant-directive.md` ölçek-değişmez işler) yapar; `k-storage` yalnız üretilen türevi *saklar/servis eder*, üretmez. (2) ArcheType structured veri depolaması (JSONB/fiziksel tablo) — bu `k-archetype-storage`'ın işidir; farklı bir eksendir. (3) İzin/yetki kararı — bir varlığa kimin eriştiği kararı PDP'nindir (`k-policy-pdp`); `k-storage` yalnız imzalı URL'nin *ömrünü ve kapsamını* uygular. (4) İçerik dağıtım ağının (CDN) *kendisi* — CloudFront/Fastly bir dış hizmettir; `k-storage` yalnız origin ve invalidation sözleşmesini tutar. (5) Serbest kodla storage erişimi — hiçbir app doğrudan `boto3.client("s3")` çağıramaz; erişim yalnız bu primitifin sözleşmeli servisinden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-storage`, sistemdeki her binary/medya varlığını tek bir soyutlamada temsil eden, fiziksel binary'yi sağlayıcı-agnostik object storage'da tutan ve bu varlıklara metadata + çoklu türev bağlayan kernel kayıt defteri ve DAM (Digital Asset Management) katmanıdır.

**Ne yapar:** Bir varlığı bir kez tanımlar (`digital_asset`); binary'yi tenant-kapsamlı bucket/prefix altına yükler (küçük dosya tek PUT, büyük dosya multipart); EXIF/IPTC/XMP metadata çıkarır ve kayda yazar; aynı orijinalin çoklu türevini (`asset_rendition`) ilişkilendirir; erişimi süreli pre-signed URL veya CDN URL ile verir; her varlık mutasyonunu audit'ler; provider'ı (S3/MinIO/Spaces/Wasabi/B2/GCS) config ile değiştirilebilir kılar (kod değişmeden).

**Ne yapmaz:** Görsel/video *işlemez* (resize/transcode `image_variants` işidir; `k-storage` sonucu saklar). Storage istemcisini app'e sızdırmaz (`boto3` doğrudan çağrısı yasak; erişim sözleşmeli servisten). Yetki kararı vermez — bunu PDP yapar. Binary'yi kalıcı public yapmaz (varsayılan private + süreli imzalı erişim; public opt-in ve audit'li). Bir varlığı fiziksel silmez (soft-delete + arşiv; kalıcı temizlik ayrı, onaylı retention işi). Sağlayıcı-özel API'yi (örn. AWS-only özellik) sözleşmeye sızdırmaz — S3-uyumlu ortak alt küme kullanılır.

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki iki tablo, `k-storage` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. Fiziksel binary veritabanında değil object storage'da tutulur; tablo yalnız referansı ve metadata'yı taşır.

Bu tablo `digital_asset` çekirdek varlık kaydının alanlarını tanımlar.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Varlığın benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `kind` | Enum(image, video, document, audio, model3d, other) | Varlık türü; işleme/servis politikasını ayırır |
| `provider` | Enum(s3, minio, spaces, wasabi, b2, gcs) | Fiziksel binary'nin bulunduğu backend; sağlayıcı-agnostik soyutlama |
| `bucket` | Text | Tenant-kapsamlı bucket adı (provider tarafında) |
| `object_key` | Text | Bucket içi tam anahtar; `tenant_id/…` prefix'iyle izole |
| `filename` | Text | Orijinal dosya adı (insan-okur, indirme adı) |
| `content_type` | Text | MIME tipi (image/webp, video/mp4, application/pdf, …) |
| `size_bytes` | BigInteger | Binary boyutu; kota ve multipart eşiği için |
| `checksum` | Text | İçerik hash'i (SHA-256/ETag); dedup ve bütünlük doğrulama |
| `exif` | JSONB (nullable) | EXIF metadata (kamera, çözünürlük, GPS strip'li) |
| `iptc` | JSONB (nullable) | IPTC metadata (başlık, anahtar kelime, telif) |
| `xmp` | JSONB (nullable) | XMP metadata (Adobe/DAM alanları, düzenleme geçmişi) |
| `visibility` | Enum(private, signed, public) | Erişim modu; varsayılan private/signed, public opt-in + audit |
| `cdn_enabled` | Boolean | CDN (CloudFront/Fastly) origin'i açık mı |
| `status` | Enum(uploading, ready, archived, quarantined) | Varlık yaşam döngüsü; silme yerine arşiv |
| `upload_id` | Text (nullable) | Devam eden multipart upload oturumu (tamamlanınca temizlenir) |
| `approval_ref` | UUID (nullable) | Onaylayan insan + zaman + gerekçe (AI-draft varlık işlemi ise zorunlu) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo `asset_rendition`'ın aynı orijinalden türetilen varyantlarını tanımlar; bir `digital_asset` çok sayıda türev taşır (thumbnail, kanal-özel görsel, transcode).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Türevin benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `asset_id` | UUID (FK → digital_asset.id) | Türetildiği orijinal varlık |
| `rendition_kind` | Text | Türev anahtarı (thumbnail, trendyol_1200, webp_hero, mp4_720p, …) |
| `object_key` | Text | Türevin object storage anahtarı |
| `content_type` | Text | Türevin MIME tipi (image/webp, image/avif, video/mp4) |
| `width` | Integer (nullable) | Görsel/video genişliği (piksel) |
| `height` | Integer (nullable) | Görsel/video yüksekliği (piksel) |
| `size_bytes` | BigInteger | Türev boyutu |
| `spec_ref` | Text (nullable) | Üreten spesifikasyon referansı (kanal spec kimliği; üretimi `image_variants` yapar) |
| `status` | Enum(pending, ready, failed) | Türev üretim durumu; async iş sonucu |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

## 6. WBS / kernel yerleşimi

`k-storage`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-party`, `k-tenancy` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-storage` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-storage` | module | `k-tenancy` | kernel/layer0 |

`dependsOn` gerekçesi: `k-storage` kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır; tenant-kapsamlı bucket/prefix ve RLS hazır olmadan varlık yazılamaz (bir varlık kiracısız var olamaz). `related` ile (karar üretmeden) `k-archetype-storage` (kardeş depolama ekseni ayrımı), PIM Faz 8 medya düğümleri ve `scale-invariant` medya işleri düğümüne bağlanır. `image_variants` iş düğümü kendi `dependsOn`'unda `k-storage`'ı listeler — yani storage önce gelir, varyant üretimi sonucu buraya yazar.

## 7. Backend gereksinimleri (boto3 soyutlama + async)

Aşağıdaki gereksinimler PIM Faz 8 `s3_storage` portunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **Sağlayıcı-agnostik soyutlama:** Tek `StorageBackend` arayüzü (put/get/delete/presign/multipart) boto3 S3-uyumlu istemci üstünde; S3/MinIO/Spaces/Wasabi/B2 aynı istemci (endpoint + kimlik farkı), GCS ayrı adaptör aynı arayüzde. Provider config'ten seçilir; app kod değişmeden backend değişir. Doğrudan `boto3.client("s3")` app'te **yasak**.
- **Async I/O:** Büyük binary yükleme/indirme event loop'u bloklamaz; boto3 senkron olduğundan çağrılar thread pool'a (`run_in_executor`) veya `aioboto3` benzeri async adaptöre offload edilir. Ağır varyant üretimi Celery/ARQ worker'a taşınır (senkron istek yolunda değil).
- **Multipart upload:** `size_bytes` eşiği üstündeki dosyalar için multipart oturumu (`upload_id` kayda yazılır); parça tamamlanınca birleştirilir, yarım kalan oturum retention işiyle temizlenir (orphan multipart maliyet yaratır).
- **Pre-signed URL:** Yükleme (PUT) ve indirme (GET) için süreli imzalı URL üretilir; süre config'li (varsayılan kısa TTL), kapsam tek nesne. İmzalı URL üretimi PDP'nin "bu aktör bu varlığa erişebilir mi?" kararından *sonra* çağrılır.
- **Metadata çıkarımı:** Upload sonrası EXIF/IPTC/XMP async çıkarılır ve `exif/iptc/xmp` JSONB'ye yazılır; GPS/konum EXIF'i varsayılan strip'lenir (PII, v1 gizlilik). Çıkarım worker işidir.
- **CDN entegrasyonu:** `cdn_enabled` varlıklar için origin object storage, dağıtım CloudFront/Fastly; içerik değişiminde invalidation sözleşmesi (path bazlı). CDN URL public erişimde imzasız, `signed` görünürlükte imzalı-cookie/URL ile korunur.
- **Audit:** Her upload/delete/visibility-değişimi/rendition-ekleme `AuditLogger.log()` ile `actor` + `resource=digital_asset` yazılır (v1 §2.5).
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; PIM Faz 8 medya galerisini bağlar.

- **Doğrudan yükleme:** Tarayıcı pre-signed PUT URL ile binary'yi doğrudan object storage'a yükler (backend proxy'lemez; büyük dosya backend'i tıkamaz); ilerleme çubuğu multipart parçalarından türetilir.
- **Medya galerisi:** Sürükle-bırak yükleme, varyant önizleme, primary/rol atama; asset ve rendition verisi TanStack Query ile çekilir, hardcoded provider/bucket referansı **yasak** (her şey runtime endpoint'inden).
- **Türev görünürlüğü:** `asset_rendition` listesi kanal-özel varyantları gösterir; `status=pending` türev "üretiliyor" olarak, `failed` yeniden-deneme aksiyonuyla ayrışır.
- **Erişilebilirlik:** WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; her görselde alt-text alanı zorunlu (IPTC başlığından ön-doldurulur).
- **i18n:** Varlık türü/rol/hata metinleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 9. Multi-tenant / RLS (tenant-scoped bucket/prefix)

Her `digital_asset` ve `asset_rendition` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Fiziksel izolasyon iki katmanlıdır: (1) `object_key` her zaman `tenant_id/…` prefix'iyle başlar; bir tenant'ın anahtarı diğerinin prefix'ine yazamaz; büyük tenant için ayrık bucket opsiyonu (`bucket` alanı tenant'a özel). (2) Metadata satırında PostgreSQL RLS ikinci bariyer: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Pre-signed URL üretimi tenant sınırını *genişletemez*: imzalanan anahtar mutlaka aktif tenant prefix'inde olmalı; cross-tenant anahtar imzalama girişimi `TenantViolationError` fırlatır ve audit'lenir. CDN origin erişimi de tenant-prefix kapsamıyla sınırlanır (path-scoped signed access). Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`)

Bu tablo `k-storage` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Varyant/temizlik *önerme* | `draft` | AI eksik varyant, orphan medya, kalitesiz görsel önerir (`AssetJobDraft`); doğrudan uygulayamaz |
| Varlık silme / retention | onay-zorunlu | `approval_ref` (insan) olmadan kalıcı silme `ApprovalRequiredError` fırlatır |
| Görünürlük public'e çevirme | onay-zorunlu | `visibility=public` yalnız insan onayıyla; AI tek başına public yapamaz (veri sızıntısı riski) |
| Metadata otomatik-etiketleme | `draft` | AI IPTC anahtar kelime/alt-text önerir; insan onaylar, ham yazamaz |
| Provider/bucket politikası değişimi | `none` | Storage backend/bucket kararı çekirdek ekip PR'ı; AI değiştiremez |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; doğrudan prod object storage'a yazamaz (yalnız draft iş önerir). PDP kararı erişimi belirler; AI PDP kararını override edemez.

## 11. Bağlama (image_variants tüketir; PIM Faz 8; scale-invariant medya işleri)

**`image_variants` bağlama:** `image_variants` işi (30+ pazaryeri spesifikasyonu, resize/crop/WebP, PIM Faz 8) görsel *işlemeyi* yapar ve sonucu `k-storage`'a `asset_rendition` olarak *yazar*. `k-storage` üretmez, saklar/servis eder; iş kendi `dependsOn`'unda `k-storage`'ı listeler. `asset_rendition.spec_ref` üreten kanal spesifikasyonunu işaret eder.

**PIM Faz 8 bağlama:** PIM-v2 §Faz 8 (Medya / DAM & Depolama) `s3_storage` portu + `DigitalAsset`/`AssetRendition` + EXIF/IPTC/XMP + CloudFront gereksinimleri birebir `k-storage`'a düşer; PIM bu primitifi kernel'den tüketir, kendi S3 istemcisini açmaz.

**Scale-invariant medya işleri:** Varyant üretimi, metadata çıkarımı, orphan temizliği ölçek-değişmez arka plan işleridir (`scale-invariant-directive.md`): tek görselde de, 100k görselde de aynı sözleşme; iş worker'a offload, idempotent (aynı asset+spec tekrar üretilirse aynı anahtar), retry+backoff, dead-letter.

**ArcheType bağlama:** ArcheType'lar kendi medya tablosunu **açmaz**; bir görsele referans verirken `digital_asset.id` bağlar. Bir Product ArcheType'ının "ana görseli" bir `asset_id` + `rendition_kind` bağlamıdır, gömülü URL değil.

## 12. Test stratejisi

Aşağıdaki testler PIM Faz 8 kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-storage` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Sağlayıcı-agnostik: aynı kod S3 ve MinIO backend'e put/get yapıyor (config farkı) | Entegrasyon |
| 2 | Multipart: eşik-üstü dosya parçalı yüklenip birleşiyor; yarım oturum temizleniyor | Entegrasyon |
| 3 | Pre-signed URL: süreli imzalı GET/PUT çalışıyor, süre dolunca reddediliyor | Entegrasyon |
| 4 | Tenant izolasyonu: A tenant B'nin object_key'ini imzalayamıyor (≥10 negatif case) | Entegrasyon (negatif) |
| 5 | Metadata: EXIF/IPTC/XMP çıkarılıyor, GPS strip'leniyor | Birim |
| 6 | Rendition: bir asset'e çoklu türev bağlanıyor, kanal-özel varyant çözülüyor | Entegrasyon |
| 7 | Audit: upload/delete/visibility-değişimi audit'e düşüyor, append-only korunuyor | Entegrasyon |
| 8 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 9 | GraphQL koruması: her resolver `permission_classes` taşıyor | Contract |

## 13. Acceptance criteria

- Görsel yüklenir → kanal spesifikasyonlarına göre varyantları arka planda üretilir (`image_variants`) → `asset_rendition` olarak bağlanır → CDN/imzalı URL döner (PIM Faz 8 kabul kriteri).
- Aynı backend kodu S3, MinIO, Spaces, Wasabi, B2 ve GCS için yalnız config değişimiyle çalışıyor; app doğrudan `boto3` çağırmıyor.
- Büyük dosya multipart ile yükleniyor; yarım kalan multipart oturumu temizleniyor.
- Pre-signed URL süreli ve tek-nesne kapsamlı; süre dolunca erişim reddediliyor.
- Cross-tenant object_key imzalama en az 10 negatif test case ile reddediliyor ve audit'leniyor.
- EXIF/IPTC/XMP çıkarılıyor; GPS konum EXIF'i strip'leniyor.
- AI varlık işlemini yalnız `draft` olarak öneriyor; `approval_ref` olmadan kalıcı silme/public yapma reddediliyor.
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Doğrudan boto3:** App'te `boto3.client("s3")` çağırmak — YASAK; erişim yalnız `StorageBackend` sözleşmeli servisinden.
- **App-özel medya tablosu:** Bir ArcheType'ın kendi `product_images` tablosunu açması — YASAK; `digital_asset` referansı zorunlu.
- **Binary'yi DB'ye gömme:** Görseli/videoyu `bytea` kolonuna yazmak — YASAK; binary object storage'da, DB'de yalnız referans.
- **Kalıcı public varsayılan:** Varlığı varsayılan public yapmak — YASAK; varsayılan private/signed, public opt-in + audit + insan onayı.
- **Tenant-prefix atlama:** `object_key`'i `tenant_id` prefix'i olmadan yazmak — YASAK; izolasyon prefix'le başlar.
- **Sağlayıcı-özel API sızdırma:** AWS-only özelliği sözleşmeye gömmek — YASAK; S3-uyumlu ortak alt küme.
- **Storage'da görsel işleme:** `k-storage` içinde resize/transcode yapmak — YASAK; işleme `image_variants`, storage yalnız saklar.
- **Senkron ağır iş:** Varyant üretimini/metadata çıkarımını istek yolunda yapmak — YASAK; worker'a offload.
- **AI'ın doğrudan public/silme:** `approval_ref`'siz public yapma veya kalıcı silme — YASAK; `ApprovalRequiredError`.
- **Sessiz silme:** Varlığı fiziksel silmek — YASAK; `status=archived` + onaylı retention işi.

## 15. Definition of Done

- §12'deki 9 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor.
- `image_variants` üretimi `k-storage`'a `asset_rendition` yazabiliyor (entegrasyon kanıtı); PIM Faz 8 uçtan-uca akış (yükle → varyant → CDN URL) çalışıyor.
- ADR-S1 "Kilitli" statüsünde (insan onayı); `k-storage` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`) ile mevcut.
- AI-guardrail testi: `draft`-dışı doğrudan public/silme reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama).

## 16. PIM-v2 karşılığı

Aşağıdaki tablo, bu sözleşmenin PIM-v2-Gereksinim-Analizi §Faz 8 gereksinimlerini `k-storage` sözleşme öğelerine nasıl eşlediğini gösterir; her satır PIM-v2'deki bir yeteneği kernel primitifine bağlar.

| PIM-v2 §Faz 8 gereksinimi | k-storage karşılığı |
|---|---|
| `s3_storage` portu (S3/MinIO/Spaces/Wasabi/B2/GCS) | §7 sağlayıcı-agnostik `StorageBackend`, `digital_asset.provider` |
| Multipart, pre-signed URL | §7 multipart oturumu (`upload_id`), süreli imzalı URL |
| CloudFront CDN | §7 CDN entegrasyonu, `digital_asset.cdn_enabled` |
| `DigitalAsset` (+ `AssetRendition`) | §5 `digital_asset` + `asset_rendition` şeması |
| EXIF/IPTC/XMP metadata | §5 `exif/iptc/xmp` JSONB, §7 çıkarım + GPS strip |
| `image_variants` portu (30+ pazaryeri, resize/crop/WebP, batch+async) | §11 bağlama: iş üretir → `asset_rendition` yazar (kernel dışı işleme) |
| Celery `generate_pending_variants`, `cleanup_orphan_media` | §7/§11 async worker; scale-invariant idempotent iş |
| Frontend: medya galerisi, sürükle-bırak, varyant önizleme, primary/rol atama | §8 frontend gereksinimleri |
| Kabul: yükle → varyant → CDN URL | §13 acceptance criteria (1. madde) |
| Tenant izolasyon (PIM-v2 §6 satır-düzeyi + RLS) | §9 tenant-scoped bucket/prefix + RLS ikinci bariyer |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| KS-01 | `digital_asset` çekirdek varlık kaydı tenant-kapsamlı | Backend/Data | P0 | Integration | Varlık tenant izolasyonlu yazılır/okunur | kernel-team |
| KS-02 | Sağlayıcı-agnostik `StorageBackend` (S3/MinIO/Spaces/Wasabi/B2/GCS) | Backend | P0 | Integration | Aynı kod config ile çoklu provider'a çalışır | kernel-team |
| KS-03 | Doğrudan `boto3` app'te yasak; erişim sözleşmeli servisten | Backend | P0 | Contract | Korumasız storage erişimi yok | kernel-team |
| KS-04 | Multipart upload (eşik-üstü dosya) | Backend | P1 | Integration | Parçalı yükleme + birleşme + orphan temizlik | kernel-team |
| KS-05 | Pre-signed URL (süreli, tek-nesne kapsamlı) | Backend/Security | P0 | Integration | Süre dolunca erişim reddedilir | security-team |
| KS-06 | `asset_rendition` çoklu türev (kanal-özel varyant) | Backend/Data | P1 | Integration | Bir asset'e çoklu türev bağlanır/çözülür | kernel-team |
| KS-07 | EXIF/IPTC/XMP metadata çıkarımı + GPS strip | Backend | P2 | Unit | Metadata çıkar, konum strip'lenir | kernel-team |
| KS-08 | CDN/CloudFront entegrasyonu + invalidation | Backend/Infra | P2 | Integration | CDN URL döner, değişimde invalidation | kernel-team |
| KS-09 | Tenant-scoped bucket/prefix + RLS ikinci bariyer | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| KS-10 | Varlık mutasyonu audit (append-only) | Security | P0 | Integration | upload/delete/visibility audit'e düşer | security-team |
| KS-11 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| KS-12 | Strawberry resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| KS-13 | Async I/O (I/O event loop'u bloklamaz, ağır iş worker'da) | Backend/Perf | P1 | Integration | Büyük dosya isteği bloklamaz | kernel-team |
| KS-14 | AI varlık işlemi `draft` + `approval_ref` (silme/public onay-zorunlu) | AI-Governance | P0 | Integration | approval_ref'siz silme/public reddedilir | governance |
| KS-15 | AI provider/bucket politikası değiştiremez (autonomy none) | AI-Governance | P0 | Unit | AI storage backend kararı veremez | governance |
| KS-16 | Frontend medya galerisi (doğrudan yükleme, varyant önizleme) config-driven | Frontend | P1 | E2E | UI storage verisinden türetilir, hardcoded provider yok | ui-team |
| KS-17 | WCAG 2.2 AA + i18n + alt-text (IPTC ön-doldurma) | Frontend/A11y | P2 | A11y(axe) | axe critical=0; alt-text zorunlu | ui-team |
| KS-18 | `image_variants` → `k-storage` rendition yazımı (PIM Faz 8 uçtan-uca) | Integration | P1 | Integration | Yükle → varyant → CDN URL akışı çalışır | kernel-team |
| KS-19 | `k-storage` WBS düğümü doğru dependsOn (k-tenancy) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
