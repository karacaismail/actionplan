# Media & File-Manager Modül Ailesi — Maturity-Level Gereksinim Analizi + Codex Doküman-Güncelleme Yönergesi

**Tarih:** 2026-07-13
**Durum:** AI-DRAFT (insan onayı bekliyor) · **DIRECTIVE-ONLY** — bu doküman ürün kodu yazdırmaz; yalnız `actionplan/docs` dokümantasyonunun güncellenme planını ve normatif gereksinim matrisini verir.
**Rol modeli (aktör-açık):** *Codex* = master doc-maintainer — bu yönergedeki D-işlerini sıralar, shard'lara böler, kapıları koşturur, sonucu insan onayına sunar. *Claude (terminal)* = slave yazar — Codex'in verdiği tek shard'ın `allowed-files` listesindeki dokümanı yazar/günceller, başka dosyaya dokunmaz. *İnsan* = onay mercii — ADR kilidi, WBS `app/module` düğüm mutasyonu, kanonik doküman değişikliği ve kabul kararı yalnız insandadır. Hiçbir ajan `platform` reposuna yazmaz (`docs/platform-product-code-write-prohibition-directive.md`, `AGENTS.md §0/§4.4`).
**Kaynak/bağlam:** `k-storage-dam-directive.md` (kernel DAM taslağı), `archetype-storage-canonical-directive.md` (ortogonal eksen — satır depolaması), `reference/PIM-v2-Gereksinim-Analizi.md §Faz 8`, `scale-invariant-directive.md`, `core-enterprise-maturity-ladder.md` (L1/L2/L3), `enterprise-dod.md` (18 katman), `dimension-contract-17.md`, `icerik-kalite-sozlesmesi.md`, `url-policy.md` (asset surface), `privacy-retention-decision-matrix.md`, `cc-compliance-matrix` (KVKK/DSAR), `standards/05-c13n-canonicalization-standard.md`, `storybook-master-component-integration-directive.md`, WBS düğümleri: `k-storage`, `l1-file`, `l1-seo/l1-pseo/l1-aeo/l1-sitemap/l1-redirect`, `k-search`, `l1-search`, `k-worker`, `k-agent-runtime`, `k-capability`, `k-tenancy`, `k-policy-pdp`, `k-jurisdiction`, `s-dms`, `s-drive`, `s-pim`.
**İlişki:** Bu yönerge `k-storage-dam-directive.md`'yi **yeniden yazmaz**; onu çekirdek kabul eder, üstüne modül ailesini (file-manager, media-manager, processing engine) ve enterprise-maturity gereksinimlerini bağlar. `archetype-storage-canonical-directive.md` ile karıştırılmamalıdır: o ArcheType *satır* depolamasıdır, bu binary/medya eksenidir.

---

## 1. Amaç

Platformdaki ~28 app kümesi ve 178 modülün neredeyse tamamı (PIM, CMS, LMS, CRM, DMS, Drive, ilan, e-ticaret, İK…) dosya ve medya tüketir; buna karşılık korpus bugün yalnız **tek bir kernel primitifi taslağı** (`k-storage`, ADR-S1 kilitsiz) ve **içeriği boş bir WBS düğümü** (`l1-file`, requirements=pending, dependsOn boş) taşıyor. "Media-manager" adında bir modül hiç yok; işleme motoru (resize/crop/transcode) yalnız PIM Faz 8'e gömülü. Bu yönergenin amacı: (1) enterprise-maturity hedefli, MVP-olmayan tam gereksinim matrisini tek yerde sabitlemek; (2) korpustaki gap ve çelişkileri kanıtla adlandırmak; (3) unknown-unknowns (öngörülmemiş risk sınıfları) defterini açmak; (4) Codex'in yürüteceği doküman-güncelleme iş planını (İş-1–İş-10) shard, kapı ve insan-onay noktalarıyla vermek. Aktör-açık ifade: *Codex/Claude* yalnız doküman üretir-günceller; *insan geliştirici* platform kodunu yazar; *insan onayı* olmadan hiçbir ADR kilitlenmez ve hiçbir WBS `module` düğümü eklenmez/değiştirilmez.

## 2. Kapsam ve Non-goals

**Kapsam:** Media/file modül ailesinin gereksinim envanteri (depolama, kimlik/zaman/adlandırma, durum makinesi, güvenlik, erişim, kota, organizasyon, sizes engine, convert engine, metadata/kategorizasyon/arama, kullanım eşleme, CRUD/bulk, yedek/DR, SEO ailesi, erişilebilirlik, AI-agent/MCP, gözlemlenebilirlik, frontend sözleşmeleri); mevcut-durum gap analizi; çelişki tespiti; unknown-unknowns; Codex iş planı; kapsama kanıtı.

**Non-goals:** (1) Ürün kodu, migration, test implementasyonu, Storybook implementasyonu — `human-developer-only`. (2) `k-storage` şemasını burada yeniden tanımlamak — şema evi `k-storage-dam-directive.md`'dir; bu yönerge oraya *eklenecek* alanları İş-1 kapsamında tarif eder. (3) ArcheType satır depolaması — `archetype-storage-canonical-directive.md`'nin işi. (4) Mock/örnek veri üretimi — yalnız yapı ve alan tanımı. (5) WBS `module` düğümü fiilen eklemek — AI yasak; yalnız insan-onaylı changeset önerisi (İş-10). (6) CDN hizmetinin kendisi — dış hizmettir; yalnız origin/invalidation sözleşmesi.

## 3. Salt-okunur denetim bulguları (kanıt — ezber değil)

### 3.1 Platform reposu gerçekliği (2026-07-13 denetimi)

Aşağıdaki bulgular `/Users/karaca/DEV/mimari/platform` checkout'unun bugünkü salt-okunur taramasından gelir; `platform-repo-reality-audit-2026-07-09.md` ile tutarlıdır.

| Kontrol | Sonuç |
|---|---|
| Git durumu | Tek commit: "Faz 0 + Faz 1 temeli" (monorepo + FastAPI healthz + UI token + Surface render) |
| Backend | `apps/api` yalnız `meta_api/app.py`; bağımlılıklar: fastapi, strawberry, uvicorn, httpx — **SQLAlchemy yok, boto3 yok, DB modeli yok** |
| Frontend | `apps/web` yalnız Landing + SurfaceRenderer; upload/galeri/dosya bileşeni yok |
| Media/file kodu | `upload / media / storage / s3 / boto` anahtar taraması ürün kodunda **0 eşleşme** (yalnız site-packages içi) |
| Sonuç | Media/file yeteneğinin tamamı doküman seviyesindedir; kod-gerçekliği sıfırdır. Bu yönerge tam da bu yüzden yalnız dokümantasyonu hedefler. |

### 3.2 Actionplan korpus envanteri

Bu tablo media/file eksenine dokunan mevcut varlıkları ve durumlarını listeler.

| Varlık | Konum | Durum |
|---|---|---|
| `k-storage` DAM sözleşmesi (digital_asset + asset_rendition, KS-01..19) | `docs/k-storage-dam-directive.md` | Taslak; ADR-S1 **kilitsiz** |
| `k-storage` WBS düğümü (module, app-layer0, dependsOn: k-tenancy) | `src/data/generated/nodes/k-storage.json` | Var |
| `l1-file` WBS düğümü ("File & Storage — Driver pattern: Local/S3/R2/Azure/GCS. Versioning, signed URL, lifecycle"; 13 modülü bloklar) | `src/data/generated/nodes/l1-file.json` | Backlog; requirements pending; **dependsOn boş**; directive dokümanı **yok** |
| Media-manager modülü | — | **Hiç yok** (düğüm de doküman da) |
| Görsel işleme (`image_variants`, 30+ pazaryeri, resize/crop/WebP) | `reference/PIM-v2-Gereksinim-Analizi.md §Faz 8` + `scale-invariant-directive.md` | Yalnız PIM bağlamında; bağımsız engine sözleşmesi yok |
| SEO ailesi (l1-seo, l1-pseo, l1-aeo, l1-sitemap, l1-redirect) | WBS düğümleri | Var; **media bağlaması yazılmamış** (image/video sitemap, ImageObject şeması, asset redirect) |
| Arama (k-search FTS+facet; l1-search BM25+vector) | WBS düğümleri | Var; asset indeksleme sözleşmesi yok |
| Worker (k-worker: retry+backoff, DLQ, circuit) | WBS düğümü | Var; media işleri ona bağlanacak |
| Agent/MCP (k-agent-runtime: MCP tool registry, bellek, orkestrasyon) | WBS düğümü | Var; media MCP tool sözleşmesi yok |
| URL/asset yüzeyi (`asset` surface, `/assets` kanonik path, indexability) | `docs/url-policy.md` | Var; asset URL şeması media directive'ine bağlanmalı |
| Retention/privacy karar matrisi (k-legal-hold-retention, DSAR) | `docs/privacy-retention-decision-matrix.md` | Var; §11 k-storage'a bağlanıyor; media-özel muamele satırları eksik |
| Olgunluk merdiveni (L1 Core / L2 Growth / L3 Enterprise) | `docs/core-enterprise-maturity-ladder.md` + `enterprise-dod.md` | Var; media ailesi kademe eşlemesi yok |
| Kota/lisans (k-capability, edition kavramı) | WBS + `capability-entitlement-contract.md` | Var; storage kota capability'si tanımsız |
| c13n (canonicalization — slug/dosya adı normalizasyonu) | `standards/numeronym-siniflandirma.md` | **EKSİK işaretli** (standart dosyası yok) |
| DMS / Drive tüketicileri (s-dms: sürümleme+e-imza+retention; s-drive) | WBS düğümleri | Var; l1-file/l1-media ile sınır çizilmemiş |

### 3.3 Çelişki tespiti (kanıtla adlandırma)

Aşağıdaki tablo, ajanların farklı mimariler üretmesine yol açacak somut çelişkileri kaynaklarıyla listeler; D-işleri bunları kapatır.

| # | Çelişki | Kanıt | Kapatma işi |
|---|---|---|---|
| Ç1 | Provider seti uyuşmazlığı: `l1-file` "Local/S3/R2/Azure/GCS" der; `k-storage.provider` enum'unda `local`, `r2`, `azure` **yok** (s3/minio/spaces/wasabi/b2/gcs) | `l1-file.json summary` ↔ `k-storage-dam-directive §5` | İş-1 |
| Ç2 | `l1-file.dependsOn = []` — dosya modülü hiçbir şeye bağlı görünmüyor; oysa `k-storage` ve `k-tenancy` olmadan var olamaz (DAG eksik) | `l1-file.json` | İş-10 (insan-onaylı WBS changeset) |
| Ç3 | Versioning: `l1-file` özeti "Versioning" vaat eder; `k-storage` şemasında dosya-versiyon kavramı yok | `l1-file.json` ↔ `k-storage-dam-directive §5` | İş-1 + İş-3 |
| Ç4 | Sorumluluk sınırı çizilmemiş: k-storage (primitif) ↔ l1-file (dosya yönetimi) ↔ media-manager (yok) ↔ s-dms/s-drive (tüketici) — hangisi klasörü, paylaşımı, galeriyi, kotayı sahiplenir, yazılı değil | §3.2 envanteri | §4 hükmü + İş-3/İş-4 |
| Ç5 | İşleme motoru PIM'e gömülü: `image_variants` yalnız PIM Faz 8 gereksinimi olarak yaşıyor; 28 app'in ortak convert/sizes engine sözleşmesi yok | `PIM-v2 §Faz 8` ↔ `k-storage §3 non-goal (1)` | İş-5 |
| Ç6 | SEO ailesi medyayı görmüyor: l1-sitemap "ArcheType kayıtlarından sitemap" der; image/video sitemap, asset indexability ve signed-URL noindex garantisi hiçbir dokümanda yok | l1-sitemap/l1-seo özetleri ↔ `url-policy.md §asset` | İş-6 |

## 4. Modül ailesi ekseni — sorumluluk ayrımı hükmü (öneri)

Tablodan önce sade açıklama: kullanıcı istemi "file-manager + media-manager, hemen hemen tüm app'lerde kullanılabilir" diyor. Korpus deseni (kernel primitif → Layer-1 in-tree modül → tüketici app) korunarak aile dört sorumluluğa ayrılır; her satır "ne yapar / ne yapmaz" ayrımını verir. Bu hüküm ADR-S1 ailesiyle insan tarafından kilitlenene kadar öneridir.

| Bileşen | Seviye | Ne yapar | Ne yapmaz |
|---|---|---|---|
| `k-storage` (var, güçlendirilecek) | kernel primitif (app-layer0) | Binary'yi sağlayıcı-agnostik tutar; `digital_asset`+`asset_rendition`+versiyon kaydı; pre-signed URL; tenant prefix+RLS; audit; kota *enforcement noktası* | Klasör/paylaşım/galeri UI'ı yönetmez; görsel işlemez; yetki kararı vermez (PDP) |
| `l1-file` → **file-manager** (directive yazılacak) | Layer-1 in-tree modül | Sanal klasör ağacı, ad/taşıma/kopyalama, dosya versiyonları, paylaşım linki, çöp kutusu (soft-delete UX), bulk işlemler, kota görünürlüğü, kullanım eşleme UI | Binary depolamaz (k-storage'a delege); medya-özel işleme/galeri/SEO yapmaz; DMS iş akışı (e-imza, resmi retention) kurmaz — o `s-dms` |
| **`l1-media` → media-manager (YENİ — insan onayı gerekir)** | Layer-1 in-tree modül | Medya kütüphanesi/koleksiyonlar, galeri+picker sözleşmesi, rendition/sizes tüketimi, focal point + kırpma *talebi*, alt-text/caption yönetimi (çok-dilli), media SEO bağlaması, AI-draft etiket/alt önerisi akışı | Dosya sisteminin genel ağacını sahiplenmez (l1-file); işlemenin kendisini yapmaz (engine); depolamaz (k-storage) |
| **Media processing engine (sizes + convert; directive yazılacak)** | k-worker üzerinde iş ailesi | Rendition spec registry'den türev üretir (resize/crop/format/transcode/preview); EXIF strip politikasını uygular; idempotent, retry+DLQ'lu, tenant-adil kuyruk | Spec kararını vermez (spec registry + insan onayı); sonucu kendisi yayınlamaz (k-storage'a rendition yazar); senkron istek yolunda çalışmaz |
| Tüketiciler (s-dms, s-drive, s-pim, CMS/LMS/ilan…) | app/module | Aileyi capability-scoped API'den tüketir; kendi iş akışını ekler | Kendi S3 istemcisini/medya tablosunu açamaz (`k-storage §14` anti-pattern) |

Kritik yasak (AGENTS.md §4.4): AI `l1-media` düğümünü WBS'e **ekleyemez** ve `l1-file` düğümünü **güncelleyemez**. Bu iki mutasyon İş-10'da insan-onaylı changeset olarak paketlenir; onaya kadar tüm yeni içerik yalnız `docs/*.md` dosyalarında yaşar.

## 5. Maturity hükmü — MVP değil

Kullanıcı istemi açık: hedef MVP değil, maturity seviyesidir. Korpusun kendi merdiveni (`core-enterprise-maturity-ladder.md`) üç kademe tanımlar; bu yönerge her gereksinimi bir kademeye bağlar ama şu hükümle: **kademeler kapsam düşürme aracı değil, sıralama aracıdır.** Modül ailesinin hedef kademesi **L3 (Enterprise)**'dir; L1/L2 etiketi yalnız "hangi kriter hangi graduation kapısında kanıtlanır" sorusunu yanıtlar. Hiçbir P0/P1 gereksinim "MVP'de gerekmez" gerekçesiyle düşürülemez; düşürme yalnız insan-onaylı, süreli waiver ile olur (`waiver-policy.md`). 18-katman bitiş çizgisi `enterprise-dod.md`'dir; bu aile L3'te o katmanların tamamını kanıtla karşılar.

## 6. Gereksinim matrisi (gap analiziyle birleşik)

Okuma anahtarı: **Durum** = korpustaki bugünkü karşılık (VAR = yazılı ve yeterli; KISMEN = anılıyor ama normatif değil/eksik; YOK = hiçbir dokümanda yok). **Hedef** = gereksinimi normatif hale getirecek işin (İş-N, §8) hedef dokümanı (KSv2 = `k-storage-dam-directive` v2 güncellemesi; THR = upload tehdit modeli; L1F = file-manager directive; L1M = media-manager directive; ENG = processing engine directive; SEO = media-SEO addendum; BCK = backup/DR runbook; MCP = media MCP tool sözleşmesi; REC = reconcile turu; WBS = insan-onaylı WBS changeset). **Kademe** = kanıtın istendiği graduation kapısı (L1/L2/L3, §5 hükmüyle). Öncelik: P0 bloklayıcı invariant, P1 çekirdek, P2 önemli, P3 iyileştirme.

### 6.A Depolama ve sağlayıcı (S3 + local + CDN opsiyonel)

Bu tablo depolama backend'i ve dağıtım katmanı gereksinimlerini verir; Ç1 çelişkisini kapatır.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| A1 | Canonical provider seti tek listede birleştirilir: `s3, minio, r2, azure_blob, spaces, wasabi, b2, gcs, local_fs`; `l1-file` özeti ile `k-storage` enum'u aynı kaynağa bağlanır | KISMEN | KSv2 | L1 | P0 |
| A2 | `local_fs` driver sözleşmesi: tek-node disk sınırı açık yazılır (multi-node'da paylaşımlı volume veya S3'e geçiş zorunlu); local→S3 göç runbook'u; aynı `StorageBackend` arayüzü | YOK | KSv2+BCK | L1 | P1 |
| A3 | CDN opsiyonel katman: `cdn_enabled` başına invalidation sözleşmesi (silme/değişimde ≤ 5 dk hedef), signed-cookie/URL korumalı dağıtım, hotlink koruması (Referer/token) | KISMEN | KSv2 | L2 | P1 |
| A4 | Lifecycle tiering: erişim sıklığına göre hot→warm→cold sınıf geçişi veri olarak tanımlı; arşiv sınıfından geri çağırma gecikmesi UI'da görünür | YOK | KSv2 | L3 | P2 |
| A5 | Residency/çok-bölge: asset bölgesi `k-jurisdiction` ile zorlanır; CDN edge kopyalarının residency yorumu açık belgelenir (bkz. UU-M25) | YOK | KSv2 | L3 | P2 |

### 6.B Kimlik, zaman formatı, adlandırma, enumeration

Bu tablo "file data time format", "isimlendirme" ve "enumeration" istemlerini normatif gereksinime çevirir.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| B1 | Kimlik: UUID PK korunur; public yüzeye sıralı/tahmin-edilebilir kimlik sızmaz; URL'de yalnız opak kimlik + imza | KISMEN | KSv2 | L1 | P0 |
| B2 | Zaman hükmü: tüm sistem zamanları TIMESTAMPTZ **UTC**; API temsili ISO-8601 (`Z` son ekli); görüntüleme locale/timezone'u yalnız UI katmanında | KISMEN | KSv2 | L1 | P0 |
| B3 | `captured_at` ayrımı: EXIF çekim zamanı (yerel saat, DST belirsizliği taşır) sistem `created_at`'inden ayrı, ham haliyle saklanır; sıralama hangi alanla yapılırsa açık yazılır | YOK | KSv2 | L2 | P2 |
| B4 | `object_key` deseni: `{tenant_id}/{yyyy}/{mm}/{rastgele-entropi}/{normalize-ad}` — tarih bölümlemesi UTC'ye göre; çakışma-dirençli; anahtar asla kullanıcı girdisinden türetilmez | KISMEN | KSv2 | L1 | P1 |
| B5 | Dosya adı normalizasyonu: Unicode NFC, kontrol/bidi-override karakter temizliği, uzunluk ≤ 255 bayt, `../` ve null-byte reddi, rezerve ad denetimi; normalizasyon idempotent | YOK | KSv2+THR | L1 | P0 |
| B6 | Görünen ad ↔ fiziksel anahtar ayrımı: yeniden adlandırma yalnız metadata değişimidir, binary taşınmaz | YOK | L1F | L1 | P1 |
| B7 | SEO'ya açılan medya adı c13n (canonicalization) standardına göre slug'lanır; c13n standart dosyasının eksikliği İş-9'da kayda geçer | YOK | SEO+REC | L2 | P2 |
| B8 | Enumeration direnci: bucket listing kapalı; imzalı URL tek-nesne; ardışık isteklerle koleksiyon çıkarımı yapılamaz; var/yok ayrımı sızdırılmaz (yetkisizde tutarlı 404) | KISMEN | THR | L1 | P0 |

### 6.C Dosya durumları ve yaşam döngüsü (file states, soft/hard delete)

Bu tablo durum makinesini ve silme yaşam döngüsünü tanımlar; mevcut 4-durumlu enum'u genişletir.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| C1 | Durum makinesi: `uploading → scanning → ready` ana hattı + `infected/quarantined`, `archived`, `soft_deleted`, `purged` uçları; `scanning` bitmeden hiçbir yüzeyden servis edilmez; geçiş tablosu ve izinli geçişler normatif yazılır | KISMEN | KSv2 | L1 | P0 |
| C2 | Soft delete: çöp kutusu + geri alma penceresi (varsayılan 30 gün, tenant-config); çöpteki varlık kota saymaya devam eder | KISMEN | KSv2+L1F | L1 | P1 |
| C3 | Hard delete (purge): onaylı retention işi; silme kapsamı = orijinal + tüm rendition'lar + CDN kopyaları (invalidation kanıtı) + arama indeksi kaydı | KISMEN | KSv2+BCK | L2 | P0 |
| C4 | Legal hold: hold'lu varlık purge edilemez; DSAR-silme ↔ hold çatışması `privacy-retention-decision-matrix` kurallarına delege edilir, media-özel satırlar oraya eklenir | KISMEN | KSv2+REC | L3 | P1 |
| C5 | Dosya versiyonları: versiyon zinciri (current + geçmiş), geri yükleme, versiyon-başı kota; rendition'lar current versiyona bağlı | YOK | KSv2+L1F | L2 | P1 |
| C6 | Kilitleme/checkout: eşzamanlı düzenleme çakışmasına karşı opsiyonel kilit; resmi DMS iş akışı `s-dms` sınırında kalır (non-goal beyanı) | YOK | L1F | L3 | P3 |

### 6.D Güvenlik (upload tehdit modeli + mimetypes)

Bu tablo dosya yüklemenin saldırı yüzeyini kapatır; İş-2'nin (tehdit modeli dokümanı) çekirdek girdisidir.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| D1 | MIME allowlist: tenant-policy'li izinli tip listesi; listede olmayan tip deny-by-default reddedilir; tip→işleme/servis politikası eşlemesi veri olarak | YOK | THR+KSv2 | L1 | P0 |
| D2 | Magic-byte doğrulama: beyan edilen `content_type` ↔ gerçek dosya imzası eşleşmeli; uyuşmazlık `quarantined`'a düşer ve audit'lenir; uzantı-imza-header üçlüsü tutarlı | YOK | THR | L1 | P0 |
| D3 | SVG/aktif içerik: SVG script/foreignObject/event-attribute temizliği veya rasterize; inline servis yalnız sanitize edilmiş kopyadan; sıkı CSP başlığı | YOK | THR | L1 | P0 |
| D4 | Bomba savunması: arşiv açma derinlik/oran limiti, görsel piksel limiti (≤ 80 MP varsayılan), PDF sayfa limiti; limitler config, aşım karantina | YOK | THR | L1 | P0 |
| D5 | Antivirüs taraması: async AV (ClamAV sınıfı) durum makinesine bağlı; imza güncelleme operasyon sözleşmesi; tarama kapasitesi SLO'su (p95 ≤ 60 sn) | YOK | THR+ENG | L2 | P0 |
| D6 | Upload rate-limit: kullanıcı ve tenant başına eşzamanlı upload + istek/dk sınırı; anonim public form yüzeylerinde daha sıkı profil | YOK | THR | L1 | P1 |
| D7 | Pre-signed sertleştirme: indirme TTL varsayılan ≤ 15 dk, yükleme ≤ 60 dk (config); PUT policy'de content-type + max boyut koşulu; imza tek-nesne | KISMEN | KSv2+THR | L1 | P0 |
| D8 | Servis başlıkları: `X-Content-Type-Options: nosniff`; kullanıcı yüklemeleri ayrı origin/subdomain'den servis; indirilebilir tiplerde `Content-Disposition: attachment` | YOK | THR | L1 | P1 |
| D9 | EXIF PII politikası: GPS varsayılan strip (mevcut hüküm korunur) + "tam strip" tenant opsiyonu + telif/IPTC koruma istisnası; orijinalin strip'siz kopyasının tutulup tutulmayacağı politika alanı | KISMEN | KSv2+ENG | L1 | P1 |
| D10 | OWASP/ASVS eşleme: dosya yükleme tehditleri ASVS V12 + File Upload Cheat Sheet hizasında tablolanır; 17-boyut `owasp` kartlarının kaynağı bu tablo olur | YOK | THR | L2 | P1 |
| D11 | İçerik moderasyonu (UGC yüzeyleri): NSFW/yasadışı içerik tespiti AI-draft + insan karar; yayın-öncesi kapı opsiyonu; yanlış-pozitif itiraz akışı | YOK | L1M+MCP | L3 | P2 |

### 6.E Erişim ve auth (public/private)

Bu tablo erişim modelini PDP'ye bağlar ve paylaşım yüzeyini tanımlar.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| E1 | Yetki kararı yalnız PDP'de (`k-policy-pdp`); imza üretimi karardan *sonra*; media modülleri kendi izin tablosu açamaz | VAR | KSv2 | L1 | P0 |
| E2 | Görünürlük üçlüsü `private/signed/public`; public opt-in + insan onayı + audit (mevcut hüküm korunur) | VAR | KSv2 | L1 | P0 |
| E3 | Paylaşım linkleri: süreli, opsiyonel parolalı, indirme-limitli, tek tıkla iptal; oluşturma/iptal/kullanım audit'li | YOK | L1F | L2 | P1 |
| E4 | Klasör izin kalıtımı: ağaçta devralma + düğüm override; karar yine PDP'de, hiyerarşi yalnız kaynak-ağacı girdisi | YOK | L1F | L2 | P1 |
| E5 | Erişim logu: indirme/önizleme olayları (aktör, kanal, zaman) audit'ten ayrı access-log akışında, kendi retention'ıyla | YOK | KSv2 | L2 | P1 |
| E6 | Yetki iptali penceresi: revoke sonrası açık imzalı URL'lerin en fazla TTL kadar yaşadığı açık belgelenir; hassas veri sınıfında proxy-servis (anlık iptal) opsiyonu | YOK | THR | L3 | P2 |

### 6.F Tenant kota ve limitler

Bu tablo kota motorunu tanımlar ve lisans katmanına bağlar.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| F1 | Kota boyutları: toplam bayt, dosya sayısı, tekil dosya max boyutu, aylık egress, rendition-üretim bütçesi — hepsi tenant-başı veri olarak | YOK | KSv2 | L1 | P0 |
| F2 | Kota kaynağı `k-capability`/edition'dan çözülür; kod içinde sabit limit yasak; limit değişimi audit'li | YOK | KSv2+REC | L2 | P0 |
| F3 | Atomik rezervasyon: eşzamanlı upload'larda kota aşımı (TOCTOU) engellenir — rezerv → commit/rollback deseni | YOK | KSv2 | L2 | P1 |
| F4 | Aşım davranışı: %80/%95 soft uyarı; %100 hard blok (yeni upload reddi, mevcut erişim sürer); tenant-admin panel görünürlüğü | YOK | KSv2+L1F | L1 | P1 |
| F5 | Maliyet görünürlüğü: tenant-başı depolama+egress+işleme maliyet metriği; faturalamaya veri sağlar | YOK | KSv2 | L3 | P2 |

### 6.G Klasör/dizin yapısı ve organizasyon

Bu tablo sanal organizasyon modelini fiziksel anahtardan ayırır.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| G1 | Sanal klasör ağacı metadata'dır; `object_key`'den bağımsız; taşıma/yeniden adlandırma fiziksel kopya tetiklemez; ağaç deseni `archetype-tree-relation-directive` tüketilerek kurulur | YOK | L1F | L1 | P0 |
| G2 | Koleksiyon/albüm: bir asset birden çok koleksiyonda olabilir; koleksiyon ≠ klasör hükmü açık yazılır (klasör tekil konum, koleksiyon çoklu üyelik) | YOK | L1M | L2 | P1 |
| G3 | Dedup: tenant-içi checksum eşleşmesinde referans-artırımlı saklama (opsiyonel politika); çapraz-tenant dedup yasak (UU-M09 sızıntı riski) | KISMEN | KSv2 | L2 | P2 |

### 6.H Sizes engine (responsive · fluid · adaptive)

Bu tablo "media sizes engine" ve "responsive/fluid/adaptive odaklı resize" istemini sözleşmeye çevirir.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| H1 | Rendition spec registry: adlandırılmış spec (en/boy, fit modu, format, kalite, dpi çarpanı) veri olarak; app kendi ölçüsünü hardcode edemez; spec değişikliği insan onaylı | KISMEN | ENG | L1 | P0 |
| H2 | Responsive türetme: her public görsel için srcset/sizes kurmaya yeten türev merdiveni + zorunlu `width/height` metadata (CLS ≤ 0.1 bütçesi); fluid/adaptive tüketim kuralı S4'te | YOK | ENG+L1M | L1 | P0 |
| H3 | Focal point: `focal_x/focal_y` insan seçimi (AI draft önerebilir); tüm otomatik kırpımlar focal'a saygılı; art-direction istisna sözleşmesi | YOK | KSv2+ENG | L2 | P1 |
| H4 | Kullanıcı kırpma (crop): UI'dan kırpma yeni-rendition talebidir; orijinal binary immutable kalır; kırpım parametreleri spec olarak saklanır (yeniden üretilebilir) | YOK | L1M+ENG | L1 | P1 |
| H5 | Placeholder: LQIP/blurhash + dominant renk üretimi ve alanları (algısal yükleme, iskelet ekran) | YOK | ENG | L2 | P2 |
| H6 | Eager ↔ on-demand kararı: hangi spec'ler upload'da üretilir, hangileri ilk istekte; on-the-fly transform açılırsa imzalı parametre + cache anahtarı sözleşmesi | YOK | ENG | L2 | P1 |

### 6.I Convert engine (format dönüşümü + transcode + önizleme)

Bu tablo "media convert engine" istemini kapsar; motorun evi k-worker'dır.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| I1 | Görsel format dönüşümü: WebP/AVIF hedef formatları, kalite politikası, ICC renk profili koru/sRGB-normalize kararı | KISMEN | ENG | L1 | P1 |
| I2 | Video pipeline: transcode profilleri (720p/1080p sınıfı), poster/thumbnail + sprite, süre/codec/bitrate metadata, HLS yayın opsiyonu (L3) | YOK | ENG | L2 | P1 |
| I3 | Ses: waveform görseli + süre metadata; transcript bağı O4'e delege | YOK | ENG | L3 | P3 |
| I4 | Doküman önizleme: PDF ilk-sayfa thumbnail; office→PDF dönüşüm sözleşmesi (araç seçimi insan ADR'si) | YOK | ENG | L2 | P2 |
| I5 | EXIF strip'in uygulanma yeri engine'dir; k-storage yalnız politika alanını taşır (sorumluluk ayrımı) | KISMEN | ENG | L1 | P1 |
| I6 | İdempotens + kuyruk adaleti: aynı (asset, spec) aynı anahtarı üretir; tenant-adil zamanlama (tek tenant kuyruğu dolduramaz); retry+backoff+DLQ `k-worker`'dan devralınır | KISMEN | ENG | L2 | P0 |

### 6.J Metadata, kategorizasyon, arama ve filtreleme

Bu tablo manuel/otomatik kategorizasyon ile arama-filtreleme istemlerini kapsar.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| J1 | Teknik metadata genişletme: `duration, codec, bitrate, page_count, color_profile, dominant_color, blurhash` alanları şemaya eklenir | YOK | KSv2 | L2 | P1 |
| J2 | EXIF/IPTC/XMP çıkarımı + GPS strip mevcut hükmü korunur | VAR | KSv2 | L1 | P1 |
| J3 | Manuel kategorizasyon: serbest etiket + kurumsal taksonomi bağı (`archetype-taxonomy-directive` tüketilir, yeniden tanımlanmaz) | YOK | L1M | L1 | P1 |
| J4 | Otomatik kategorizasyon: AI-draft etiket/sınıflandırma; insan onayı olmadan görünür olmaz; **yüz tanıma yasak** (biyometrik veri, KVKK) | YOK | L1M+MCP | L2 | P1 |
| J5 | Arama: `k-search`'e asset indeksi (ad, alt, etiket, seçili EXIF/IPTC alanları; tenant-scoped); indeks purge'da temizlenir | YOK | L1M+REC | L1 | P0 |
| J6 | Filtreleme: tip/boyut/tarih/etiket/klasör/durum/kullanım facet'leri + kayıtlı görünümler; facet sayıları tenant-scoped | YOK | L1F+L1M | L1 | P1 |
| J7 | Semantik arama: `l1-search` vektör tarafına görsel/metin embedding opsiyonu; maliyet sınırı P5'e bağlı | YOK | L1M | L3 | P3 |

### 6.K Kullanım eşleme (use mapping) ve bütünlük

Bu tablo "use mapping" istemini ve veri bütünlüğü denetimlerini kapsar.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| K1 | `asset_usage` kaydı: hangi ArcheType/surface/alan hangi asset'i kullanıyor; kullanan taraf kayıt düşer/kaldırır; kernel yalnız kayıt defterini tutar | YOK | KSv2 | L1 | P0 |
| K2 | Silme koruması: kullanımda olan asset soft-delete'te uyarır, purge'ı bloklar; override yalnız insan onayıyla ve audit'li | YOK | KSv2+L1F | L1 | P0 |
| K3 | Orphan raporu: kullanımsız asset + yarım multipart + failed rendition periyodik raporlanır; temizlik AI-draft → insan onay → motor uygular | KISMEN | ENG | L2 | P1 |
| K4 | Fixity denetimi: periyodik checksum örneklemi (aylık ≥ %10) ile sessiz bozulma tespiti; uyuşmazlık alarm + karantina | YOK | BCK | L3 | P2 |

### 6.L CRUD, bulk operasyonlar, import/export

Bu tablo CRUD ve toplu işlem sözleşmesini verir.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| L1 | CRUD yüzeyi: upload/list/get/metadata-update/soft-delete GraphQL sözleşmesi; her resolver `permission_classes` (KS-12 genişler) | KISMEN | L1F | L1 | P0 |
| L2 | Bulk işlemler: çoklu upload/taşı/etiketle/sil/görünürlük; kısmi-başarı sözleşmesi (öğe-başı sonuç; all-or-nothing değil) + idempotency anahtarı | YOK | L1F | L1 | P1 |
| L3 | Bulk geri alma: bulk soft-delete işlem-grubu kimliğiyle tek adımda geri alınabilir | YOK | L1F | L2 | P2 |
| L4 | Import/export: tenant medya envanteri export'u (metadata + binary manifest); DSAR export'una veri sağlar | YOK | L1F+BCK | L2 | P1 |

### 6.M Yedekleme ve DR (file-manager + media-manager content backup)

Bu tablo iki content-backup istemini tek tutarlılık modeline bağlar.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| M1 | İki-katman yedek hükmü: metadata (PostgreSQL) ↔ binary (object storage) ayrı mekanizmalarla yedeklenir; **tutarlılık noktası** tanımı zorunlu (hangi DB snapshot hangi binary durumuyla eşleşir; şüphede binary-önce kuralı) | YOK | BCK | L2 | P0 |
| M2 | Binary yedek stratejisi: bucket versioning + ikinci hedefe (farklı provider/bölge) replikasyon; L3'te object-lock/WORM (silinemez pencere) opsiyonu | YOK | BCK | L2 | P0 |
| M3 | Restore tatbikatı: örneklem asset+rendition+metadata restore provası; hedef RTO ≤ 4 saat / RPO ≤ 24 saat (media sınıfı; insan revize edebilir); tatbikat kanıtı evidence'a | YOK | BCK | L2 | P1 |
| M4 | DSAR/purge ↔ yedek: silinen varlığın yedekte kalma süresi beyan edilir; restore anında tombstone ile yeniden-silme kuralı | YOK | BCK+REC | L3 | P1 |
| M5 | Sağlayıcı göçü: provider değişiminde checksum-doğrulamalı toplu taşıma runbook'u; kesinti ve URL sürekliliği planı | YOK | BCK | L3 | P2 |

### 6.N SEO ailesi (SEO · pSEO · AEO ve diğerleri)

Bu tablo "seo, aseo, pseo ve diğer seo'lar" istemini l1-seo ailesine bağlar; yalnız public yüzey kapsamdadır.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| N1 | Asset URL şeması `url-policy` `asset` surface'ine bağlanır; public asset kanonik URL + cache politikası; **imzalı URL'ler daima noindex/no-store** | KISMEN | SEO | L2 | P0 |
| N2 | Image/video sitemap: public medya `l1-sitemap`'e image/video uzantılarıyla girer; private/signed asla girmez; sitemap büyüklük bölme kuralı | YOK | SEO | L2 | P1 |
| N3 | Yapılandırılmış veri: ImageObject/VideoObject JSON-LD üretim kuralı; lisans/telif alanları IPTC'den beslenir; `l1-seo` tüketir | YOK | SEO | L2 | P1 |
| N4 | pSEO bağı: `l1-pseo` şablon sayfalarında görsel seçim + alt kuralı + sayfa-başı medya kalite kapısı (eksik-alt sayfayı bloklar) | YOK | SEO | L3 | P2 |
| N5 | AEO/GEO/LLMO: alt/caption/transcript'in AI motorlarına görünür semantik HTML kuralı; `llms.txt` medya politikası satırı | YOK | SEO | L3 | P3 |
| N6 | URL değişiminde `l1-redirect`: public medya taşınır/yeniden adlanırsa 301 + eski-URL envanteri; link-equity korunur | YOK | SEO | L2 | P2 |
| N7 | Public medya adı c13n slug'lı + alt zorunlu; CDN cache anahtarına locale sızmaz (görsel dil-bağımsız) | YOK | SEO | L2 | P2 |

### 6.O Erişilebilirlik (a11y) ve i18n

Bu tablo accessibility istemini medya-özel yükümlülüklere çevirir.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| O1 | Alt-text zorunlu: UI/public'te kullanılan her görselde alt; IPTC'den ön-doldurma + insan onayı; dekoratif işaretleme (`alt=""`) bilinçli istisna | KISMEN | L1M | L1 | P0 |
| O2 | Çok-dilli metadata: alt/caption/başlık `I18nText` ile; ham string gömme yasak | KISMEN | L1M | L2 | P1 |
| O3 | Video altyazı: WebVTT caption alanı + oynatıcı sözleşmesi; altyazısız video "eksik" bayrağı taşır ve public kalite kapısında sayılır | YOK | L1M+ENG | L2 | P1 |
| O4 | Transcript: ses/video transkripti (AI-draft + insan onay); a11y ve AEO (N5) çift kullanım | YOK | L1M+MCP | L3 | P2 |
| O5 | Galeri/picker/file-manager WCAG 2.2: tam klavye gezinme, görünür odak, kontrast ≥ 7:1 hedefi, 44×44 px dokunmatik hedef alanı, axe kanıtı; korpus UI kilidiyle hizalı | KISMEN | L1M+L1F | L1 | P1 |

### 6.P AI-agent ve MCP gereksinimleri

Bu tablo "ai agent gereksinimleri" ve "mcp gereksinimleri" istemlerini `k-agent-runtime`'a bağlar. MCP (Model Context Protocol): AI ajanının araçları keşfedip çağırmasını sağlayan protokol.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| P1 | Autonomy matrisi genişletme: `k-storage §10` file/media-manager eylemlerini de kapsar — bulk silme/taşıma = onay-zorunlu; etiket/alt/kırpım önerisi = draft; kota/policy/provider = none | KISMEN | MCP | L1 | P0 |
| P2 | MCP tool seti: `media.search`, `media.get`, `media.get_url` (PDP-sonrası, süreli), `media.upload_draft`, `media.suggest_alt_text`, `media.suggest_tags`, `media.request_rendition`, `media.report_orphans` — hepsi tenant-scoped, audit'li, `k-agent-runtime` kayıtlı | YOK | MCP | L2 | P0 |
| P3 | Exfiltration önlemi: ajan-başı imzalı-URL/indirme hız sınırı (varsayılan ≤ 50/dk, config); toplu export MCP aracından verilmez; anomali alarmı | YOK | MCP | L2 | P0 |
| P4 | Prompt-injection karantinası: dosya adı/EXIF/IPTC/OCR metni ajan bağlamına **güvensiz veri** etiketiyle girer (sub_prompt karantina deseni); araç açıklamaları bu alanlardan beslenmez | YOK | MCP | L2 | P1 |
| P5 | Maliyet sınırı: AI görüntü analizi/embedding/transcript işleri tenant-başı aylık bütçe kapılı; aşımda draft kuyruğu durur, insan bilgilendirilir | YOK | MCP | L3 | P2 |

### 6.R Observability ve operasyon

Bu tablo işletme metriklerini ve denetim genişletmesini verir.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| R1 | Metrik + SLO seti: upload başarı ≥ %99.5; rendition tamamlama %95 ≤ 5 dk; presign p95 ≤ 150 ms; tenant-başı depolama/egress sayaçları | YOK | KSv2+ENG | L2 | P1 |
| R2 | Liste sorgu bütçesi: keyset pagination; liste ucu p95 ≤ 300 ms; `(tenant_id, folder_id, created_at)` bileşik indeks beklentisi şemada not edilir | KISMEN | L1F | L1 | P1 |
| R3 | Alarm + runbook: kuyruk birikmesi, AV imza bayatlaması, CDN invalidation hatası, kota-yakın tenant listesi için belirti→teşhis→müdahale runbook'u | YOK | BCK | L2 | P1 |
| R4 | Audit genişletme: KS-10 üstüne paylaşım-link yaşam döngüsü, bulk işlemler, kota değişimi, moderasyon kararları eklenir; append-only korunur | KISMEN | KSv2 | L1 | P0 |

### 6.S Frontend sözleşmeleri (yalnız sözleşme — implementation insan geliştiricide)

Bu tablo UI teslimatını çizmez, tanımlar; Master Component sözleşmeleri `storybook-master-component-integration-directive` desenine yazılır.

| ID | Gereksinim | Durum | Hedef | Kademe | Öncelik |
|---|---|---|---|---|---|
| S1 | File-manager yüzey sözleşmesi: ağaç+liste/grid, sürükle-bırak, çoklu seçim, 10k+ öğede sanal kaydırma, klavye kısayol haritası | YOK | L1F | L1 | P1 |
| S2 | Media picker Master Component sözleşmesi: tüm app'lerin kullandığı tek seçici (filtre, çoklu seçim, rendition seçimi, inline-upload); app-özel picker yasak | YOK | L1M | L1 | P0 |
| S3 | Upload deneyimi: doğrudan pre-signed PUT (mevcut hüküm), parça-bazlı ilerleme, duraklat/devam, hata sınıfları + yeniden deneme telemetrisi | KISMEN | L1F | L1 | P1 |
| S4 | Responsive tüketim kuralı: `srcset/sizes` + `<picture>` art-direction; `width/height` zorunlu (CLS ≤ 0.1); lazy-load varsayılan, LCP adayında eager istisnası | YOK | L1M | L1 | P1 |
| S5 | Galeri/koleksiyon görünümleri + rendition durum rozetleri (`pending` üretiliyor, `failed` yeniden-dene) | KISMEN | L1M | L2 | P2 |

## 7. Unknown-unknowns defteri (UU-M)

Numaralandırma `storybook-unknown-unknowns-gap-report.md` desenini izler. Her madde: risk (neden öngörülmez) + panzehir (hangi gereksinim/işle kapanır). P0 = tasarım kararına girmezse ileride mimari kırar; P1 = yüksek etkili işletme riski.

### 7.1 P0 — Ölümcül

- **UU-M01 — SVG bir görsel değil, programdır.** "image/*" diye kabul edilen SVG, script taşıyıp aynı origin'de XSS çalıştırır; galeri önizlemesi saldırı yüzeyi olur. Panzehir: D3 (sanitize/rasterize + ayrı origin + CSP).
- **UU-M02 — Polyglot dosyalar.** Aynı bayt dizisi hem geçerli görsel hem geçerli arşiv/script olabilir; yalnız uzantı/beyan kontrolü aldatılır. Panzehir: D2 (magic-byte) + D8 (nosniff) + D1 (allowlist).
- **UU-M03 — Dekompresyon/piksel bombaları.** 100 KB'lık dosya açılınca 10 GB RAM isteyebilir (zip bomb, 500 MP JPEG, derin PDF); işleme worker'ı OOM ile çöker, kuyruk kilitlenir. Panzehir: D4 (limitler) + I6 (izole worker + DLQ).
- **UU-M04 — Tarama bitmeden servis penceresi.** AV tarama async ise, `uploading→ready` arasında dosya servis edilirse zararlı içerik dağıtılmış olur. Panzehir: C1 (scanning durumu servis-engelli; state machine normatif).
- **UU-M05 — İmzalı URL bir yetki anlık görüntüsüdür.** Yetki geri alınsa da URL, TTL bitene dek çalışır; log/referrer/mesajlaşmaya sızan URL erişim demektir. Panzehir: D7 (kısa TTL) + E6 (iptal penceresi beyanı + hassas sınıfta proxy).
- **UU-M06 — CDN silinen içeriği yaşatır.** Purge edilen asset CDN edge'lerde günlerce kalabilir; KVKK silme talebinde "sildik" beyanı yanlışlanır. Panzehir: C3 (silme kapsamına CDN invalidation kanıtı dahil) + A3 (invalidation SLA ≤ 5 dk).
- **UU-M07 — Kota TOCTOU.** İki eşzamanlı upload aynı anda "kota müsait" görür; tenant limiti sessizce aşılır, faturalama/kapasite şaşar. Panzehir: F3 (atomik rezervasyon).
- **UU-M08 — Kullanım eşlemesi yoksa her silme rus ruletidir.** Yayındaki ürün/sayfa görselinin silinmesi ancak müşteri şikayetiyle fark edilir. Panzehir: K1+K2 (asset_usage + silme koruması).
- **UU-M09 — Global dedup bir orakldür.** Çapraz-tenant checksum dedup'ı, "bu dosya sistemde var mı?" sorusuna yan-kanal cevap verir (belge sızıntısı doğrulama saldırısı). Panzehir: G3 (dedup yalnız tenant-içi).
- **UU-M10 — Soft-delete ↔ KVKK silme hakkı çelişir.** Çöp kutusu + yedek + rendition + CDN kopyaları varken "kişisel veriyi sildik" iddiası zincirin tamamı kapsanmadan doğru olmaz. Panzehir: C3+C4+M4 (purge kapsam tanımı + legal hold + yedek tombstone).
- **UU-M11 — Metadata ile binary'nin yedeği ayrışır.** DB restore edilir ama binary snapshot başka andaysa: kayıt var-dosya yok (kırık) veya dosya var-kayıt yok (hayalet, kota dışı). Panzehir: M1 (tutarlılık noktası hükmü; şüphede binary-önce).
- **UU-M12 — Rendition kombinasyon patlaması.** N asset × M spec × K format × L dpi çarpımı depolamayı ve kuyruğu katlar; "her spec eager" kararı maliyeti sessizce 10× yapar. Panzehir: H6 (eager/lazy kararı) + F1 (rendition bütçesi) + F5 (maliyet görünürlüğü).
- **UU-M13 — Tek tenant kuyruğu boğar.** 100k görsel import eden tenant, diğer herkesin thumbnail'ını saatlerce bekletir (noisy neighbor). Panzehir: I6 (tenant-adil zamanlama) + D6 (upload hız sınırı).
- **UU-M14 — MCP araçları veri-sızdırma kanalıdır.** Meşru `media.get_url` aracı, ele geçirilmiş/enjekte edilmiş bir ajanda toplu dışa aktarım pompasına döner. Panzehir: P3 (hız sınırı + toplu export yok) + P4 (injection karantinası) + P1 (autonomy sınırı).

### 7.2 P1 — Yüksek etkili

- **UU-M15 — Dosya adı bir saldırı yüzeyidir.** Bidi-override ile "gpj.exe" görünümü, homoglyph, `../`, NUL, 255-bayt taşması, case-insensitive çakışma. Panzehir: B5 (normalizasyon) + B6 (ad ↔ anahtar ayrımı).
- **UU-M16 — EXIF saati yerel, sistem saati UTC.** Çekim zamanına göre sıralama DST/saat-dilimi yüzünden karışır; tarih-bölümlemeli anahtar yanlış aya düşer. Panzehir: B2+B3 (UTC hükmü + captured_at ham ayrı alan).
- **UU-M17 — Focal point yoksa otomatik kırpım yüz keser.** Kanal-özel oranlarda merkez-kırpım ürün/yüz dışarıda bırakır; markalar bunu manuel fark eder. Panzehir: H3 (focal point) + H4 (kırpım = yeni rendition).
- **UU-M18 — EXIF temizliği telif kanıtını da silebilir.** GPS strip doğru; ama IPTC telif/creator alanlarını da silmek yasal ihtilafta aleyhe döner. Panzehir: D9 (katmanlı strip politikası: PII ayrı, provenance ayrı).
- **UU-M19 — AI otomatik etiket biyometriye kayar.** "Otomatik kategorizasyon" yüz tanımaya uzanırsa KVKK'da özel-nitelikli veri işlenmiş olur. Panzehir: J4 (yüz tanıma yasak; draft+onay).
- **UU-M20 — Sitemap private URL sızdırır.** Sitemap üretimi görünürlük filtresinden geçmezse imzalı/private URL'ler arama motoruna beyan edilir ve cache'lenir. Panzehir: N1+N2 (yalnız public; signed daima noindex/no-store).
- **UU-M21 — Bulk işlemin yarısı olur.** 500 dosyalık taşımada 200. öğede hata: kalan 300'ün durumu tanımsızsa kullanıcı veri kaybı algılar. Panzehir: L2 (öğe-başı sonuç sözleşmesi) + L3 (grup geri-alma).
- **UU-M22 — local_fs yatay ölçekte kırılır.** Tek-node diske yazan driver ikinci app node'u gelince "dosya bende yok" üretir; geliştirme-üretim farkı sessiz bug olur. Panzehir: A2 (sınır beyanı + göç runbook'u).
- **UU-M23 — Sessiz bit çürümesi.** Yıllar içinde nadiren okunan binary bozulur; fark edildiğinde yedek rotasyonu da bozuk kopyayı taşımıştır. Panzehir: K4 (fixity örneklemi) + M2 (versioning/WORM).
- **UU-M24 — Orphan multipart ve failed rendition faturası.** Yarım kalan oturumlar ve başarısız türev artıkları görünmez maliyet biriktirir. Panzehir: K3 (periyodik rapor + onaylı temizlik).
- **UU-M25 — Residency ile CDN çelişir.** "TR verisi TR'de" hükmü, global CDN edge cache'iyle yorum gerektirir; belgelenmezse compliance denetiminde açık çıkar. Panzehir: A5 (edge-kopya yorumunun açık beyanı; gerekirse bölge-kilitli dağıtım).
- **UU-M26 — Hotlink/egress kötüye kullanımı.** Public görsele dışarıdan gömme (hotlink) veya kazıma, egress maliyetini tenant habersiz patlatır. Panzehir: A3 (hotlink koruması) + F1 (egress kotası) + R1 (sayaç/alarm).
- **UU-M27 — Aynı ada eşzamanlı yazma.** İki kullanıcı aynı klasöre aynı adla yükler/taşır; son-yazan-kazanır sessiz veri kaybı üretir. Panzehir: L2 idempotency + G1 (ağaç işlemlerinde çakışma kuralı: benzersizlik + otomatik son-ek önerisi, sözleşmede).
- **UU-M28 — Görüntü içi talimat ajan bağlamına girer.** OCR/EXIF içine gömülü "ignore previous instructions" metni, medyayı okuyan ajanı yönlendirebilir. Panzehir: P4 (güvensiz-veri etiketi + araç tanımlarının kullanıcı verisinden beslenmemesi).
- **UU-M29 — Versiyon ↔ rendition tutarsızlığı.** Dosyanın v2'si yüklenir ama türevler v1'den kalır; kullanıcı eski thumbnail görür, hata bildirilemez. Panzehir: C5 (rendition'lar current versiyona bağlanır; versiyon geçişi türev geçersizleştirme kuralı taşır).
- **UU-M30 — "Diğer SEO'lar" belirsizliği kapsam sürüklenmesi üretir.** SEO ailesi sınırsız genişleyebilir (GEO, VSO, ASO…); her tur yeni doküman doğurur. Panzehir: N-grubu kapsamı l1-seo ailesindeki beş modülle sınırlandı; yeni SEO türü önce insan-onaylı kapsam kararı ister.

## 8. Codex iş planı — doküman güncelleme WBS'i (İş-1–İş-10)

Okuma anahtarı: her iş **yalnız doküman üretir/günceller**; `allowed-files` dışına dokunmak ihlaldir (AGENTS.md §6). Bağımlılık sütunu, içerik tutarlılığı içindir (önce çekirdek şema hükümleri, sonra tüketici dokümanlar). Her işin PR'ı küçük tutulur (≤ 400 net satır hedefi aşılıyorsa iş bölünür); her PR en az bir non-goal beyan eder.

| İş | Çıktı dosyası (allowed-files) | Kapsam (bu yönergeden beslenen gereksinimler) | Bağımlılık | İnsan kapısı |
|---|---|---|---|---|
| İş-1 | `docs/k-storage-dam-directive.md` (v2 güncelleme) | A1-A5, B1-B4, C1-C5, D7, D9(politika alanı), E1-E2, E5, F1-F5, G3, H3(alan), J1-J2, K1-K2, R1, R4 — şema alan ekleri (`version`, `focal_x/y`, `captured_at`, kota/usage/access-log tabloları) yalnız *alan adı+tip+amaç* düzeyinde; KS-20+ requirement satırları eklenir | — | ADR-S1 kilidi (v2 içeriğiyle birlikte insan onayına sunulur) |
| İş-2 | `docs/media-upload-threat-model.md` (yeni) | B5, B8, D1-D8, D10, E6 + UU-M01..M05, M14, M15, M28'in normatif hali; OWASP/ASVS eşleme tablosu | İş-1 ile paralel | Yok (AI-DRAFT statüde yayımlanır) |
| İş-3 | `docs/l1-file-manager-directive.md` (yeni; `k-storage` 17-bölüm kardeş deseni) | B6, C2, C5-C6, E3-E4, F4(UI), G1, J6, L1-L4, R2, S1, S3 | İş-1 | Yok |
| İş-4 | `docs/l1-media-manager-directive.md` (yeni; aynı desen) | D11, G2, H2(tüketim), H4, J3-J5, J7, O1-O5, S2, S4-S5 | İş-1 | Modülün WBS'e girişi İş-10'a bağlı (doküman önce yazılır, düğüm insan onayıyla doğar) |
| İş-5 | `docs/media-processing-engine-directive.md` (yeni; aynı desen) | H1-H6, I1-I6, D5(tarama işi), K3; `scale-invariant-directive` + `k-worker` + PIM Faz 8 `image_variants` bağlaması — PIM'e gömülü tanım genelleştirilir (Ç5) | İş-1 | Yok |
| İş-6 | `docs/media-seo-binding-addendum.md` (yeni) | B7, N1-N7; `url-policy` asset surface + l1-seo/pseo/aeo/sitemap/redirect bağları (Ç6) | İş-1, İş-4 | Yok |
| İş-7 | `docs/media-backup-restore-runbook.md` (yeni) | A2(göç), C3(purge kanıtı), K4, M1-M5, R3 | İş-1 | RTO/RPO hedef onayı |
| İş-8 | `docs/media-mcp-tools-contract.md` (yeni) | P1-P5; `k-agent-runtime` bağlaması; autonomy matrisi; UU-M14/M28 panzehirlerinin normatif hali | İş-1, İş-4 | Yok |
| İş-9 | Reconcile turu: `docs/privacy-retention-decision-matrix.md` (media satırları), `docs/README.md` (indeks), `docs/kapsama-matrisi-kernel-archetype-surface-2026-07-01.md` (aile kaydı), c13n eksikliğinin `standards/00-standards-index.md`'ye not düşülmesi | Ç1-Ç6 kapanış kanıtı + çapraz referans onarımı; hiçbir kanonik-listeli dosya yeniden yazılmaz, yalnız ekleme/indeks | İş-1–İş-8 | `privacy-retention-decision-matrix` kanonik ise changeset olarak sunulur |
| İş-10 | İnsan-onay changeset paketi (ayrı öneri dokümanı: `docs/media-module-wbs-changeset-proposal-2026-07-13.md`) | (1) `l1-media` module düğümü önerisi (parent `app-layer1`, dependsOn `k-storage`+`l1-file`); (2) `l1-file.dependsOn = [k-storage]` düzeltmesi (Ç2); (3) `k-storage` refs listesine yeni dokümanlar; (4) kota capability tanım önerisi; (5) ADR-S1/ADR-D3 kilit talebi | İş-1–İş-9 | **Tamamı insan onayı** — AI, WBS `app/module` düğümünü üretemez/güncelleyemez (AGENTS.md §4.4) |

Yürütme kuralları: (1) işler doküman-only olduğundan çekirdek kapılar (`pnpm typecheck`, `pnpm test`, `pnpm lint`) yeşil kalmalı; içerik `icerik-kalite-sozlesmesi.md` yasak-imza listesine takılmamalı (jenerik kalıp yok, sayılar somut). (2) Her yeni doküman şu meta-satırları taşır: Tarih, Durum=AI-DRAFT (insan onayı bekliyor), Kaynak/bağlam, İlişki, ve "Bu doküman kod yazmaz" beyanı. (3) 17-bölüm kardeş deseni (Amaç → Kapsam → Non-goals → Tanım nedir/yapar/yapmaz → Sözleşme şekli → WBS yerleşimi → Backend → Frontend → Multi-tenant/RLS → AI guardrail → Bağlama → Test stratejisi → Acceptance criteria → Anti-patterns → DoD → PIM/tüketici karşılığı → Requirement-ID tablosu) İş-3/İş-4/İş-5 için zorunludur. (4) Her tablodan önce bir açıklama cümlesi; aktör-açık dil; emoji yok; teknik terim ilk geçişte açıklanır.

## 9. Claude (terminal, slave) çalışma protokolü

Codex her işi (İş-N) Claude'a şu zarf ile verir; Claude zarfın dışına çıkamaz:

1. **Shard tanımı:** tek iş (İş-N), tek `allowed-files` listesi, en az bir non-goal. Claude başka dosyaya yazmaz, başka ajanın shard'ına dokunmaz.
2. **Girdi seti:** bu yönergenin ilgili §6 grupları + §7 UU maddeleri + hedef dokümanın kardeş deseni (`k-storage-dam-directive.md` şablon örneği).
3. **Yasaklar (her zarfta tekrar edilir):** platform reposuna yazma yok; kod/migration/test implementasyonu yok; mock/örnek veri yok (yalnız alan adı+tip+amaç); WBS `app/module` düğüm mutasyonu yok; kanonik dosya yeniden yazımı yok; "bitti" beyanı kanıtsız olmaz.
4. **Teslim kanıtı:** değişen dosya listesi + satır sayısı + bu yönergedeki hangi gereksinim ID'lerinin karşılandığının eşleme tablosu. Codex eşlemeyi §10 kapsama tablosuyla çaprazlar; eksik ID varsa shard iade edilir.
5. **Eskalasyon:** Claude bir gereksinimde çelişki bulursa (örn. mevcut dokümanla uyuşmazlık) kendi kararıyla çözmez; Ç-notu ekler ve Codex'e döner; Codex gerekirse insana taşır.

## 10. Kapsama kanıtı — istem maddesi → gereksinim eşlemesi

Bu tablo, kullanıcının istem listesindeki her maddenin bu yönergede nerede karşılandığını kanıtlar; boş satır kalması "gap" demektir ve kabul engelidir.

| İstem maddesi | Karşılık |
|---|---|
| S3 + local storage + CDN opsiyonel | A1, A2, A3 |
| File data time format | B2, B3, B4 |
| Güvenlik gereksinimleri | 6.D grubu (D1-D11), B5, B8, E6 |
| Public/private files | E2, N1 |
| Auth | E1, E4 (PDP: `k-policy-pdp`) |
| Crop | H3, H4 (+ engine I-grubu) |
| Tenant bazlı limitler / kota | F1-F5 |
| Klasör ve dizin yapısı | G1, B4 (fiziksel ↔ sanal ayrımı) |
| İsimlendirme | B5, B6, B7 |
| Enumeration | B1, B8 |
| SEO / AEO / pSEO / diğer | N1-N7 (l1-seo ailesi; kapsam sınırı UU-M30) |
| AI agent gereksinimleri | P1, P4, P5, J4, D11 |
| MCP gereksinimleri | P2, P3 (+ `k-agent-runtime` bağı) |
| File-manager content backup | M1-M5, L4 |
| Media-manager content backup | M1-M5 (aynı tutarlılık modeli; rendition kapsamı C3) |
| Mimetypes | D1, D2 |
| Media sizes engine | H1-H6 |
| Media convert engine | I1-I6 |
| EXIF metadata temizleme | D9, I5 (+ UU-M18 telif istisnası) |
| Accessibility | O1-O5 |
| Kategorizasyon (manuel/otomatik) | J3, J4 |
| Arama ve filtreleme | J5, J6, J7 |
| CRUD işlemleri | L1 |
| Use mapping | K1, K2 |
| Bulk operations | L2, L3 |
| File states | C1 |
| Soft/hard delete | C2, C3 (+ C4 legal hold) |
| Logging, audit | R4, E5 |
| Responsive/fluid/adaptive media resize | H2, S4 |
| "Başka neler lazım?" (istemde olmayan eklemeler) | A4-A5 tiering/residency; C4-C6 legal hold/versiyon/kilit; D5 AV, D8 başlıklar, D10 OWASP, D11 moderasyon; E3 paylaşım linki, E5-E6; F3/F5; G2-G3 koleksiyon/dedup; H5-H6 placeholder/on-demand; I2-I4 video/ses/doküman; J1/J7 teknik metadata/semantik arama; K3-K4 orphan/fixity; L3-L4; M-grubu DR bütünü; N2-N7; O3-O4 altyazı/transcript; P3-P5 exfiltration/injection/maliyet; R1-R3; S2 picker; §7'nin 30 UU maddesi |

## 11. Bu yönergenin Definition of Done'ı

- İş-1–İş-9 dokümanları yazılmış/güncellenmiş; her biri AI-DRAFT statülü, meta-satırlı ve 17-bölüm desenine (İş-3/İş-4/İş-5) uygun.
- §6'daki her gereksinim ID'si tam olarak bir hedef dokümanda normatif karşılık bulmuş; Codex'in çapraz eşleme raporu eksiksiz (ID → doküman§bölüm).
- Ç1-Ç6 çelişkileri kapanmış veya İş-10 changeset'inde insan kararına bağlanmış; hiçbir çelişki sessiz bırakılmamış.
- §7'deki her UU maddesinin panzehiri bir gereksinim ID'sine bağlı (bu dokümanda sağlandı; hedef dokümanlar bağlantıyı korur).
- `docs/README.md` indeksi yeni dokümanları listeliyor; çekirdek kapılar (`pnpm typecheck`, `pnpm test`, `pnpm lint`) yeşil.
- İş-10 changeset paketi insan onayına sunulmuş; **onay gelmeden** `l1-media` düğümü yok sayılır, `l1-file` düğümüne dokunulmamıştır, ADR-S1 "Taslak" kalır.
- Hiçbir aşamada platform reposuna yazılmamış; hiçbir ürün kodu/migration/test üretilmemiş; hiçbir iş kanıtsız "implemented/verified/done" işaretlenmemiştir.

## 12. Non-goals (tekrar, bağlayıcı)

Bu yönerge ve ondan doğan işler: platform ürün kodu yazmaz; SQLAlchemy modeli/Alembic migration/Strawberry resolver/React bileşeni üretmez; Storybook implementasyonu yapmaz (yalnız sözleşme); branch/commit/PR'ı platform reposunda açmaz; WBS `app/module` düğümü eklemez/güncellemez (yalnız İş-10 önerisi); kanonik sözleşmeleri yeniden yazmaz; mock veri üretmez. Platform ürün kodunun tek yazarı insan geliştiricidir.

---

*Kardeş dokümanlar: `k-storage-dam-directive.md` (çekirdek şema evi), `archetype-storage-canonical-directive.md` (ortogonal satır-depolama ekseni), `core-enterprise-maturity-ladder.md` (kademe kapıları), `privacy-retention-decision-matrix.md` (silme/retention çatışma kuralları). Bu doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar: aktör-açık, emoji yok, her tablodan önce açıklama, jenerik kalıp yok.*
