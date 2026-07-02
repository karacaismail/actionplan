# k-evidence / Seal Yönergesi — Kriptografik Kanıt ve Delil Kasası Kernel Primitifi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §13 DoD, ADR-E1)
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `k-storage-dam-directive.md` (kardeş primitif deseni: referans-tut, binary'yi sızdırma), `atomik-netlestirme-2026-07-01.md` (atom kademesi: `EnumType`, `bytea-ref`, `timestamptz`, `Identifier` atomları; hash bir bütün-değer atomudur), `actor-party-contract.md` (kardeş kernel deseni), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `k-storage`'ın kardeşidir: o "binary/medya varlığı nerede?" sorusunu, `k-evidence` "bu varlığın/olayın **kurcalanamaz kriptografik kanıtı** nedir, hangi hash-zinciriyle mühürlendi, hangi zaman-damgası ve sertifika zinciriyle **hukuken doğrulanabilir**?" sorusunu yanıtlar. `k-evidence` bir **delil kasası (evidence vault)** primitifidir; genel uygulama audit-log'u (`AuditLogger`) ile **karıştırılmamalıdır** — o operasyonel gözlemlenebilirlik / erişim izidir, bu **hukuki delil değeri olan, WORM (write-once-read-many), hash-zincirli kanıt** kaydıdır. Bu doküman **kod yazmaz**; `k-evidence` kernel primitifinin davranış sözleşmesini normatif tanımlar. Makine-okunur karşılığı (SQLAlchemy 2.0 modeli, Alembic migration, RFC 3161 TSA istemci soyutlaması, doğrulama servisi, Strawberry tipi) ADR-E1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, platformda hukuki delil değeri taşıyan her kanıtın (imza sertifikası, zaman-damgası, doküman hash'i, onam kaydı, mühür) tek bir kernel soyutlamasında, kurcalanamaz biçimde tutulmasını sabitler. Hedef: 50 uygulamanın hiçbirinin kendi hash-zincirini, kendi TSA istemcisini veya kendi delil defterini yeniden yazmaması; her kanıtın tek bir `evidence_record` kaydında, bir öncekinin hash'ine bağlanarak (hash-chain) mühürlenmesi; kaydın **append-only** (yalnız ekleme; update/delete yok) olması; ve talep hâlinde makinece doğrulanabilir bir `audit_certificate` (PDF + doğrulama URL'i) üretilmesi. Kaydın hukuki değeri iki şeyden gelir: (1) **tamper-evidence** — herhangi bir geçmiş kaydın değiştirilmesi zincirin geri kalanını geçersiz kılar ve tespit edilir; (2) **LTV (Long-Term Validation)** — sertifika zinciri + iptal kanıtı (CRL/OCSP) + güvenilir zaman-damgası birlikte gömülür, böylece imzalayanın sertifikası ileride sona erse/iptal edilse bile kanıt "imza atıldığı anda geçerliydi" biçiminde doğrulanabilir kalır. Aktör-açık ifade: *ajan* kanıtı **yalnız okur/özetler/doğrular** (yazamaz, değiştiremez); *insan/motor* (imza motoru, onam akışı) kanıtı yazar; kayıt bir kez yazıldıktan sonra **hiç kimse** (insan dâhil) onu değiştiremez — yalnızca yeni kayıt eklenir.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `evidence_record` çekirdek delil kaydı (kanıt türü + doküman hash referansı + zaman-damgası + sertifika zinciri + imzalayan kimliği + zincir bağı), (2) **hash-chain** (her kayıt bir öncekinin hash'ini taşır; tamper-evident ledger), (3) **WORM append-only** garantisi (update/delete YOK; DB + uygulama + politika üç katmanda zorlanır), (4) **RFC 3161** güvenilir zaman-damgası (TSA sağlayıcısından `timestamp_token`), (5) **LTV** mühürleme (sertifika zinciri + CRL/OCSP iptal kanıtı + zaman-damgası birlikte saklanır), (6) `audit_certificate` üretimi (insan-okur PDF + makine-doğrulanabilir `verification_url`), (7) tenant-kapsamlı delil izolasyonu ve kanıt-doğrulama servisi, (8) `k-evidence` düğümünün WBS yerleşimi, (9) çok-kiracılı izolasyon ve doğrulama zorunlulukları. Backend (TSA istemci soyutlaması + doğrulama), frontend (kanıt görünürlüğü + sertifika indirme), test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) **İmza orkestrasyonu** — imzacı davet etme, imza sırası, imza alanı yerleştirme, e-imza sağlayıcı entegrasyonu (`k-signature`'ın işidir); `k-evidence` yalnız imzanın **kanıtını** (sertifika + zaman-damgası + hash) *mühürler*, imzayı yönetmez/toplamaz. (2) **Genel uygulama audit-log'u** — kim neye ne zaman erişti/değiştirdi türü operasyonel iz `AuditLogger`/`k-audit`'in işidir; bu ayrı bir eksendir (operasyonel gözlemlenebilirlik ≠ hukuki delil). Bir işlem hem `AuditLogger`'a hem — hukuki değer taşıyorsa — `k-evidence`'a düşebilir, ama ikisi karıştırılmaz. (3) **Binary saklama** — imzalı PDF/dokümanın fiziksel binary'si `k-storage`'da tutulur; `k-evidence` yalnız o binary'nin **hash'ini** (`document_hash` bytea-ref) ve mührünü saklar, binary'yi kopyalamaz. (4) **PKI/CA işletme** — sertifika üretme, anahtar yönetimi, HSM işletimi dış hizmettir; `k-evidence` yalnız verilen sertifika zincirini *doğrular ve mühürler*. (5) **Yasal saklama kararı** — bir kaydın ne kadar tutulacağı/dondurulacağı kararı `k-legal-hold`'undur; `k-evidence` kilidi *uygular* (append-only zaten silmeye izin vermez), retention politikasını *üretmez*. (6) Serbest kodla delil yazımı — hiçbir app doğrudan delil tablosuna `INSERT` çalıştıramaz; yazım yalnız bu primitifin sözleşmeli mühürleme servisinden geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `k-evidence`, sistemdeki hukuki delil değeri taşıyan her kanıtı (imza sertifikası, güvenilir zaman-damgası, doküman hash'i, onam, mühür) tek bir soyutlamada temsil eden; kayıtları bir hash-zinciriyle birbirine bağlayarak **kurcalanamaz (tamper-evident)** ve **append-only (WORM)** kılan; talep hâlinde makinece doğrulanabilir sertifika üreten kernel **delil kasası (evidence vault)** katmanıdır.

**Ne yapar:** Bir kanıtı bir kez mühürler (`evidence_record`); doküman binary'sinin hash'ini (`k-storage` binary + burada SHA-256/512 referans) ve varsa imza sertifika zincirini + imzalayan kimliğini kaydeder; RFC 3161 TSA'dan güvenilir bir `timestamp_token` alıp gömer; her yeni kaydı bir öncekinin hash'ine (`prev_hash`) bağlar (hash-chain); LTV için sertifika zinciri + CRL/OCSP iptal kanıtı + zaman-damgasını birlikte saklar; kaydı `sealed_at` ile mühürler; talep hâlinde zinciri baştan sona doğrular ve bir `audit_certificate` (PDF + `verification_url`) üretir; her mühürleme olayını (yazma değil, olayın *kendisi* kanıttır) tenant-kapsamlı tutar.

**Ne yapmaz:** Kanıt kaydını **güncellemez/silmez** — WORM append-only; bir kayıt yazıldıktan sonra `UPDATE`/`DELETE` mümkün değildir (yalnız yeni kayıt eklenir). İmza *toplamaz/orkestre etmez* (bunu `k-signature` yapar; `k-evidence` sonucu mühürler). Genel operasyonel audit-log tutmaz (bunu `AuditLogger`/`k-audit` yapar). Doküman binary'sini saklamaz (bunu `k-storage` yapar; burada yalnız hash). Sertifika *üretmez* / anahtar *yönetmez* (PKI dış hizmet; burada yalnız doğrulama + mühürleme). Retention/hold *kararı* vermez (bunu `k-legal-hold` yapar). AI'ın kanıt *yazmasına/değiştirmesine* izin vermez (autonomy `none`; AI yalnız okur/doğrular/özetler — §10).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki tablo, `k-evidence` primitifinin veri şeklini yalnızca *alan adı + tip (atom kademesiyle) + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır ve `atomik-netlestirme` kademe modeline uyar: her alan bir **atom**dur (bütün-değer semantiği; `EnumType`, `bytea-ref`, `timestamptz`, `Identifier`, hash-değeri). Fiziksel doküman binary'si bu tabloda değil `k-storage`'da tutulur; tablo yalnız **hash referansını** ve mühür meta'sını taşır. Tablonun tamamı append-only'dir: her satır bir kez yazılır, hiç güncellenmez.

Bu tablo `evidence_record` çekirdek delil kaydının alanlarını atomlarıyla tanımlar.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | `uuid` (PK) | Kanıt kaydının benzersiz kimliği |
| `tenant_id` | `uuid` (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `kind` | `EnumType(signature_certificate, timestamp, hash, consent, audit_seal)` | Kanıt türü; doğrulama ve delil-değeri politikasını ayırır |
| `subject_ref` | `EntityRef` (target-kind, scope) | Kanıtın kime/neye ait olduğu (sözleşme, doküman, onam olayı) — referans-değer atom |
| `document_hash` | `bytea-ref` (SHA-256/512) | Kanıtlanan doküman binary'sinin içerik hash'i; `k-storage`'daki binary'ye bağ, bütünlük mührü |
| `hash_algorithm` | `EnumType(sha256, sha512)` | `document_hash`'in üretim algoritması; doğrulamada birebir kullanılır |
| `timestamp_token` | `bytea-ref` (RFC 3161 TST) | Güvenilir zaman-damgası jetonu (TSA imzalı); "bu hash bu andan önce vardı" kanıtı |
| `tsa_provider` | `Identifier` (scheme=TSA-URI) | Zaman-damgasını üreten TSA otoritesinin kimliği; doğrulama kök-güveni için |
| `cert_chain` | `bytea-ref` (X.509 chain, DER) | İmzalayan → ara CA → kök CA sertifika zinciri; imza doğrulamanın güven yolu |
| `revocation_proof` | `bytea-ref` (CRL/OCSP response) (nullable) | LTV: imza anındaki iptal-durumu kanıtı (CRL veya OCSP yanıtı) — sonradan doğrulanabilirlik |
| `signer_identity` | `Fragment` (PersonName + subject DN + email) (nullable) | İmzalayanın kimlik özeti (sertifikadan çıkarılan) — kimliksiz kayıt, gömülü |
| `prev_hash` | `bytea-ref` (SHA-256/512) (nullable) | **Hash-chain bağı**: bir önceki `evidence_record`'un hash'i; ilk kayıtta null (genesis) |
| `record_hash` | `bytea-ref` (SHA-256/512) | Bu kaydın kanonik serileştirmesinin hash'i; sonraki kaydın `prev_hash`'i buna eşit olur |
| `sealed_at` | `timestamptz` (NOT NULL) | Mühürleme anı; append-only kaydın oluşturulma (ve tek) zamanı |
| `sealed_by_ref` | `PartyRef` (nullable) | Mührü tetikleyen aktör (imza motoru / onam akışı / sistem) — AI **olamaz** (§10) |

Not: Tabloda `updated_at` **yoktur** — WORM append-only olduğu için bir kayıt hiç güncellenmez; `sealed_at` hem oluşturma hem tek-ve-son zamandır. Zincir bütünlüğü `prev_hash → record_hash` bağıyla sağlanır: herhangi bir geçmiş satırın herhangi bir alanı değişirse o satırın `record_hash`'i (dolayısıyla sonraki satırın `prev_hash` beklentisi) tutmaz ve doğrulama zinciri kopuk raporlar (tamper-evidence).

## 6. WBS / kernel yerleşimi

`k-evidence`, kernel/layer0 kümesine (`k-*`) `module`-seviyesi bir düğüm olarak eklenir; `k-storage`, `k-party`, `k-tenancy` ile aynı `app-layer0` altındadır. Altında asıl kod-teslimatı olan en az bir `archetype` düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-evidence` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-evidence` | module | `k-tenancy`, `k-storage` | kernel/layer0 |

`dependsOn` gerekçesi: `k-evidence` (1) kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır — bir kanıt kiracısız var olamaz; tenant-kapsam ve RLS hazır olmadan delil yazılamaz. (2) `k-storage`'a bağlıdır — kanıtladığı doküman binary'si `k-storage`'da yaşar, `k-evidence` yalnız onun **hash referansını** (`document_hash`) tutar; storage önce gelir, evidence o binary'nin hash'ini mühürler. `related` ile (karar üretmeden) `k-signature` (imzayı toplar, kanıtı buraya yazar), `k-legal-hold` (kilit uygular), `AuditLogger`/`k-audit` (kardeş ama ayrı eksen) ve CLM Evidence Vault düğümüne bağlanır. `k-signature` iş/module düğümü kendi `dependsOn`'unda `k-evidence`'ı listeler — yani delil kasası önce gelir, imza sonucu buraya kanıt yazar.

## 7. Backend gereksinimleri (TSA istemci soyutlaması + hash-chain + WORM)

Aşağıdaki gereksinimler CLM Evidence Vault kabul kriterlerini ve `core-contract-pack` DoD'unu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **Hash-chain (tamper-evident ledger):** Her yeni `evidence_record`, o tenant'ın son kaydının `record_hash`'ini `prev_hash` olarak alır; kaydın kanonik serileştirmesi (deterministik, alan-sıralı) hash'lenip `record_hash`'e yazılır. İlk kayıt genesis'tir (`prev_hash = null`). Zincir bütünlüğü tek yönde büyür; herhangi bir geçmiş kaydın değişmesi zinciri geçersiz kılar. Serileştirme kanonikliği (alan sırası, kodlama) sözleşmedir — aynı içerik daima aynı hash'i verir.
- **WORM append-only (üç katman):** Delil kaydı **yalnız eklenir**. (1) **DB katmanı:** `UPDATE`/`DELETE` DB-seviyesi tetikleyici/kural ile reddedilir (append-only tablo); yalnız `INSERT` izinlidir. (2) **Uygulama katmanı:** ORM'de update/delete metodu yok; repository yalnız `append()` sunar. (3) **Politika katmanı:** rol ne olursa olsun (admin dâhil) mutasyon `WormViolationError` fırlatır ve — kanıt olduğu için — ayrıca bir `audit_seal` kaydı olarak zincire yazılır. Fiziksel silme yalnız tüm-tenant purge (yasal/GDPR, ayrı onaylı süreç) ile mümkündür ve tekil kayıt silmeyi kapsamaz.
- **RFC 3161 zaman-damgası:** Doküman hash'i bir TSA'ya (RFC 3161 TimeStamp Protocol) gönderilir; dönen imzalı `timestamp_token` (TST) `timestamp_token`'a, otorite `tsa_provider`'a yazılır. TSA sağlayıcı-agnostik bir `TsaClient` arayüzünden çağrılır (birden çok TSA config ile; app doğrudan TSA endpoint'i çağıramaz). TST'nin TSA sertifikasıyla imza-doğrulaması mühürlemede yapılır; geçersiz TST reddedilir.
- **LTV (Long-Term Validation):** İmza kanıtı için sertifika zinciri (`cert_chain`) + zaman-damgası (`timestamp_token`) + iptal kanıtı (`revocation_proof`: imza anındaki CRL veya OCSP yanıtı) **birlikte** gömülür. Amaç: imzalayanın sertifikası ileride sona erse/iptal edilse bile "imza atıldığı anda geçerli ve iptal edilmemişti" biçiminde doğrulanabilirlik. LTV üç bileşenin de mühürde bulunmasını zorlar; eksikse kanıt "LTV-incomplete" işaretlenir.
- **Doğrulama servisi:** `verify(record | chain)` idempotent, yan-etkisiz bir okuma işlemidir: (a) hash-chain'i genesis'ten hedefe yeniden hesaplar (her `prev_hash` bir öncekinin `record_hash`'ine eşit mi), (b) her TST'yi TSA kök-güvenine karşı doğrular, (c) her `cert_chain`'i kök CA'ya kadar zincirler ve `revocation_proof` ile iptal-durumunu kontrol eder, (d) `document_hash`'i (talep hâlinde `k-storage` binary'sinden yeniden hesaplayıp) karşılaştırır. Sonuç: `{valid, broken_at?, reasons[]}`.
- **audit_certificate üretimi:** Doğrulama sonucundan insan-okur bir **PDF sertifika** + makine-doğrulanabilir bir `verification_url` üretilir. PDF; kanıt türü, hash, TSA, imzalayan, mühür anı ve zincir-durumunu insan-okur listeler; `verification_url` üçüncü tarafın zinciri bağımsız doğrulamasını sağlar. Sertifika üretimi bir okuma-türevidir (yeni delil yaratmaz).
- **Audit vs evidence ayrımı:** `k-evidence`'a yazmak `AuditLogger.log()`'u **ikame etmez**; erişim/okuma izleri hâlâ `AuditLogger`'a (v1 §2.5) düşer. `k-evidence` yalnız hukuki delil değeri olan kanıtı tutar; ikisi ayrı sistemdir.
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına, SCSS + token + Phosphor ikon setine ve config-driven surface ilkesine uyar; CLM Evidence Vault yüzeyini bağlar. Frontend kanıtı **yalnız gösterir/doğrular/indirir**; asla yazamaz/değiştiremez (append-only yüzeye yansır).

- **Kanıt zaman-çizelgesi (evidence timeline):** Bir sözleşme/dokümanın delil kayıtları hash-zincir sırasıyla salt-okunur listelenir; her kayıt kanıt türü (`kind`), mühür anı (`sealed_at`), imzalayan ve zincir-durumu (bağlı/kopuk) ile gösterilir. Veri TanStack Query ile çekilir; hardcoded TSA/CA referansı **yasak** (her şey runtime endpoint'inden).
- **Zincir bütünlük göstergesi:** Doğrulama sonucu (`valid`/`broken_at`) görsel bir bütünlük rozetiyle (zincir sağlam / kırık) gösterilir; kopuk zincirde kırılma noktası (`broken_at`) ve gerekçe (`reasons[]`) insana açık ayrışır. Kayıt düzenleme/silme aksiyonu yüzeyde **yoktur** (WORM).
- **Sertifika indirme:** `audit_certificate` PDF indirilebilir; `verification_url` kopyalanabilir/paylaşılabilir buton olarak sunulur (üçüncü-taraf bağımsız doğrulama için).
- **Erişilebilirlik:** WCAG 2.2 AA taban (AAA yüzey-bazlı opt-in); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; bütünlük durumu yalnız renkle değil ikon+metinle de bildirilir (renk-körü erişilebilirliği).
- **i18n:** Kanıt türü/durum/hata metinleri `I18nText` üzerinden çok-dilli; ham string gömülmez.

## 9. Multi-tenant / RLS (tenant-kapsamlı delil izolasyonu)

Her `evidence_record` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Hash-chain **tenant başına** ayrıdır: bir tenant'ın zinciri kendi genesis'inden büyür; `prev_hash` daima aynı tenant'ın son kaydına bağlanır — cross-tenant zincir bağı `TenantViolationError` fırlatır. PostgreSQL RLS ikinci bariyerdir: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Doğrulama ve sertifika üretimi tenant sınırını *genişletemez*: bir tenant başka tenant'ın kanıtını okuyamaz/doğrulayamaz. WORM append-only RLS'ten bağımsız olarak da geçerlidir — hiçbir rol (admin dâhil) başka tenant'ın kaydını değiştiremez (zaten hiçbir kaydı değiştiremez). Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar. Not: append-only tablo silmeye izin vermediğinden, tenant-purge (yasal) yalnız ayrı, çok-onaylı, tüm-tenant kapsamlı bir süreçtir ve tekil kayıt silmeyi asla açmaz.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) `k-evidence` bu invariantın en katı ucudur: kanıt **hukuki delildir**, bu yüzden AI kanıtı **hiçbir koşulda yazamaz/değiştiremez** — yalnız okur, doğrular ve özetler.

Bu tablo `k-evidence` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Kanıt kaydı yazma / mühürleme | `none` | AI `evidence_record` **yazamaz**; mühür yalnız imza motoru/onam akışı/insan tarafından tetiklenir (`sealed_by_ref` AI olamaz) |
| Kanıt değiştirme / silme | `none` | Zaten WORM append-only; AI dâhil hiçbir aktör değiştiremez; girişim `WormViolationError` |
| Zincir/hash değiştirme | `none` | `prev_hash`/`record_hash` deterministik türetilir; AI müdahale edemez |
| TSA/CA politikası değişimi | `none` | Zaman-damgası otoritesi/kök-güven kararı çekirdek ekip PR'ı; AI değiştiremez |
| Kanıt okuma / doğrulama | `read-only` | AI zinciri doğrulayabilir, `valid/broken_at` **raporlar**; sonucu değiştiremez, "geçerli" diye işaretleyemez |
| Kanıt özeti / açıklama | `draft` | AI bir delil kümesini insan için özetler/açıklar (`EvidenceSummaryDraft`); özet **kanıt değildir**, delil defterine yazılmaz |
| Sertifika üretimini *önerme* | `draft` | AI "bu sözleşme için audit_certificate üretilsin mi?" önerir; üretimi motor/insan tetikler |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; **doğrudan delil defterine yazamaz veya var olan bir kaydı değiştiremez** (yalnız okur/doğrular/özetler). AI'ın ürettiği hiçbir metin (özet, açıklama) hukuki delil sayılmaz ve zincire girmez. Doğrulama sonucu deterministik motordan gelir; AI onu "iyileştiremez"/geçersiz zinciri geçerli gösteremez.

## 11. Bağlama (k-signature yazar; k-storage binary + burası hash; k-legal-hold kilitler; audit ayrı)

**`k-signature` bağlama:** `k-signature` işi imza orkestrasyonunu yapar (imzacı davet, sıra, alan yerleştirme, e-imza sağlayıcı); imza tamamlanınca sonucunu (sertifika zinciri + zaman-damgası + doküman hash'i + imzalayan kimliği) `k-evidence`'a `evidence_record(kind=signature_certificate)` olarak **yazar**. `k-evidence` imzayı toplamaz/orkestre etmez; sonucu mühürler. `k-signature` kendi `dependsOn`'unda `k-evidence`'ı listeler.

**`k-storage` bağlama:** İmzalı doküman/PDF binary'si `k-storage`'da yaşar (`digital_asset`); `k-evidence` yalnız o binary'nin **hash'ini** (`document_hash` bytea-ref, SHA-256/512) tutar. Binary `k-storage`'da, bütünlük mührü + hukuki kanıt `k-evidence`'da — ikisi birlikte "bu tam binary bu anda vardı ve imzalandı" der. Doğrulama, talep hâlinde `k-storage` binary'sinden hash'i yeniden hesaplayıp `document_hash` ile karşılaştırır (bütünlük).

**`k-legal-hold` bağlama:** Bir kanıt/sözleşme yasal saklamaya (legal hold) alındığında `k-legal-hold` kilidi uygular; `k-evidence` zaten append-only olduğundan silme mümkün değildir, ancak legal-hold ek olarak tüm-tenant purge'ün bile o kaydı atlamamasını (istisna kilidi) zorlar. `k-legal-hold` retention/hold **kararını** üretir; `k-evidence` append-only garantiyi *sağlar*.

**Genel audit-log (ayrı):** `AuditLogger`/`k-audit` operasyonel erişim/değişim izini tutar (kim neye erişti). Bu `k-evidence`'ın **kardeşi ama ayrı eksenidir**: audit = operasyonel gözlemlenebilirlik; evidence = hukuki delil. Bir kanıt mühürlenmesi ayrıca `AuditLogger`'a "evidence sealed" olarak düşebilir, ama audit kaydı delil defterinin yerine geçmez ve delil defteri audit'in yerine geçmez.

**CLM bağlama:** CLM (sözleşme yaşam döngüsü) tarafında her imzalanan sözleşme, onam ve mühür bir `evidence_record`'a düşer; CLM "Evidence Vault" bu primitifi kernel'den tüketir, kendi delil defterini açmaz. `subject_ref` ilgili sözleşme/kloz ArcheType'ına bağlanır.

## 12. Test stratejisi

Aşağıdaki testler CLM Evidence Vault kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-evidence` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Hash-chain: art arda kayıtlar doğru `prev_hash`/`record_hash` ile bağlanıyor; genesis null | Birim |
| 2 | Tamper-evidence: geçmiş bir kaydın alanı değiştirilirse doğrulama zinciri `broken_at` raporluyor | Entegrasyon |
| 3 | WORM: `UPDATE`/`DELETE` DB + uygulama + politika üç katmanda reddediliyor (≥10 negatif case) | Entegrasyon (negatif) |
| 4 | RFC 3161: TSA'dan alınan `timestamp_token` gömülüyor, geçersiz TST reddediliyor | Entegrasyon |
| 5 | LTV: cert_chain + timestamp + revocation_proof birlikte saklanıyor; eksikse LTV-incomplete | Entegrasyon |
| 6 | Doğrulama: `verify()` sağlam zincirde `valid`, bozukta `broken_at` + `reasons` dönüyor | Entegrasyon |
| 7 | audit_certificate: PDF + `verification_url` üretiliyor, üçüncü-taraf doğrulaması geçiyor | Entegrasyon |
| 8 | Tenant izolasyonu: A tenant B'nin kanıtını okuyamıyor/doğrulayamıyor; zincir tenant-başına ayrı | Entegrasyon (negatif) |
| 9 | AI guardrail: AI kanıt yazamıyor/değiştiremiyor (autonomy none); yalnız doğrulama/özet | Entegrasyon |
| 10 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor (append-only korunur) | CI |
| 11 | GraphQL koruması: her resolver `permission_classes` taşıyor; mutasyon (write) yok, yalnız query | Contract |

## 13. Acceptance criteria

- İmza tamamlanır (`k-signature`) → sertifika zinciri + zaman-damgası + doküman hash'i `k-evidence`'a `evidence_record` olarak mühürlenir → hash-chain'e (`prev_hash`) bağlanır → talep hâlinde `audit_certificate` (PDF + verification_url) döner (CLM Evidence Vault kabul kriteri).
- Hash-chain tamper-evident: herhangi bir geçmiş kaydın değiştirilmesi doğrulamada tespit edilir (`broken_at`); en az bir kurcalama senaryosu testle kanıtlanır.
- WORM append-only: `UPDATE`/`DELETE` DB + uygulama + politika üç katmanda ve en az 10 negatif test case ile reddedilir; hiçbir rol (admin dâhil) tekil kaydı değiştiremez.
- RFC 3161 zaman-damgası TSA'dan alınıp gömülüyor; geçersiz TST reddediliyor; TSA sağlayıcı-agnostik `TsaClient`'ten çağrılıyor (app doğrudan TSA çağırmıyor).
- LTV tam: cert_chain + timestamp + revocation_proof (CRL/OCSP) birlikte saklanıyor; eksik LTV "incomplete" işaretleniyor; sertifika süresi geçmiş imza "imza anında geçerliydi" doğrulanabiliyor.
- `document_hash` `k-storage` binary'siyle eşleşiyor; doğrulama binary'den hash'i yeniden hesaplayıp karşılaştırabiliyor.
- AI kanıt yazamıyor/değiştiremiyor (autonomy none); yalnız zinciri doğruluyor/özetliyor; AI özeti hukuki delil sayılmıyor ve zincire girmiyor.
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, append-only, indeks) yeşil.

## 14. Anti-patterns

- **Kanıt güncelleme/silme:** `evidence_record`'a `UPDATE`/`DELETE` çalıştırmak — YASAK; WORM append-only, yalnız `INSERT`; girişim `WormViolationError` + `audit_seal` kaydı.
- **`updated_at`/mutasyon alanı:** Kanıt kaydına güncellenebilir alan koymak — YASAK; kayıt bir kez yazılır, `sealed_at` tek ve son zamandır.
- **Zincir bağını atlama:** Yeni kaydı `prev_hash` olmadan (zincire bağlamadan) yazmak — YASAK; tamper-evidence zincir sürekliliğine bağlıdır (genesis hariç).
- **Binary'yi delil defterine gömme:** İmzalı PDF/dokümanı `evidence_record`'a yazmak — YASAK; binary `k-storage`'da, burada yalnız `document_hash`.
- **Audit'i delil sanmak:** Genel `AuditLogger` kaydını hukuki delil yerine koymak (veya tersi) — YASAK; audit = operasyonel iz, evidence = hukuki delil; ayrı sistemler.
- **İmzayı burada orkestre etmek:** `k-evidence` içinde imzacı davet/sıra yönetmek — YASAK; orkestrasyon `k-signature`; burası yalnız sonucu mühürler.
- **LTV eksik mühür:** Sertifikayı zaman-damgası veya iptal kanıtı olmadan mühürleyip "geçerli" saymak — YASAK; LTV üç bileşeni birlikte ister.
- **Kendi hash-zinciri/TSA istemcisi:** Bir app'in kendi delil defterini veya doğrudan TSA endpoint çağrısını açması — YASAK; erişim yalnız `k-evidence` sözleşmeli servisinden.
- **Cross-tenant zincir:** Bir kaydı başka tenant'ın zincirine bağlamak — YASAK; zincir tenant-başına ayrı; `TenantViolationError`.
- **AI'ın kanıt yazması/değiştirmesi:** AI'ın `evidence_record` yazması, hash değiştirmesi veya "geçerli" işaretlemesi — YASAK; autonomy none; AI yalnız okur/doğrular/özetler.

## 15. Definition of Done

- §12'deki 11 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + append-only + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor; append-only garanti downgrade'de korunuyor.
- `k-signature` imza sonucu `k-evidence`'a `evidence_record` yazabiliyor (entegrasyon kanıtı); CLM Evidence Vault uçtan-uca akış (imza → mühür → hash-chain → audit_certificate) çalışıyor.
- Tamper-evidence testi: geçmiş kayıt değişimi `broken_at` ile tespit ediliyor; WORM `UPDATE`/`DELETE` üç katmanda reddediliyor.
- RFC 3161 zaman-damgası + LTV (cert + CRL/OCSP + timestamp) mühürleniyor ve doğrulanıyor.
- ADR-E1 "Kilitli" statüsünde (insan onayı); `k-evidence` düğümü ve altındaki `archetype` düğümü WBS'te doğru `dependsOn` (`k-tenancy`, `k-storage`) ile mevcut.
- AI-guardrail testi: AI kanıt yazma/değiştirme reddediliyor (autonomy none); yalnız doğrulama/özet çalışıyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, atomlarla alan tanımı).

## 16. CLM karşılığı (Evidence Vault + Audit Certificate + tamper-evidence + LTV)

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) Evidence Vault gereksinimlerini `k-evidence` sözleşme öğelerine nasıl eşlediğini gösterir; her satır CLM'deki bir yeteneği kernel primitifine bağlar.

| CLM Evidence Vault gereksinimi | k-evidence karşılığı |
|---|---|
| Kurcalanamaz delil defteri (evidence vault) | §5 `evidence_record` + §7 WORM append-only (üç katman) |
| Tamper-evidence (kurcalama tespiti) | §7 hash-chain (`prev_hash`/`record_hash`); §12 test 2 |
| Kriptografik hash mührü (doküman bütünlüğü) | §5 `document_hash` (bytea-ref, SHA-256/512) + `hash_algorithm` |
| Güvenilir zaman-damgası (RFC 3161) | §5 `timestamp_token` (RFC 3161 TST) + `tsa_provider`; §7 `TsaClient` |
| İmza sertifika zinciri saklama | §5 `cert_chain` (X.509 DER) + `signer_identity` |
| LTV / uzun-dönem doğrulanabilirlik | §5 `revocation_proof` (CRL/OCSP) + `cert_chain` + `timestamp_token`; §7 LTV kuralı |
| Audit Certificate (doğrulama belgesi) | §7 `audit_certificate` (PDF + `verification_url`); §8 sertifika indirme |
| Bağımsız üçüncü-taraf doğrulama | §7 doğrulama servisi + `verification_url`; §12 test 7 |
| İmza sonucu delile bağlama | §11 `k-signature` → `evidence_record(kind=signature_certificate)` |
| Doküman binary ↔ hash ayrımı | §11 `k-storage` binary + `k-evidence` hash (`document_hash`) |
| Yasal saklama / hold ile bütünleşme | §11 `k-legal-hold` kilit + append-only garanti |
| Tenant izolasyonu (delil defteri kiracı-kapsamlı) | §9 tenant-scoped hash-chain + RLS ikinci bariyer |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| KE-01 | `evidence_record` çekirdek delil kaydı tenant-kapsamlı | Backend/Data | P0 | Integration | Kanıt tenant izolasyonlu yazılır/okunur | kernel-team |
| KE-02 | Hash-chain (tamper-evident ledger; prev_hash/record_hash) | Backend/Security | P0 | Unit | Kayıtlar doğru zincir bağıyla bağlanır | security-team |
| KE-03 | Tamper-evidence: geçmiş kayıt değişimi tespit edilir | Security | P0 | Integration | Değişim doğrulamada `broken_at` raporlar | security-team |
| KE-04 | WORM append-only (DB + uygulama + politika üç katman) | Backend/Security | P0 | Integration(neg) | ≥10 UPDATE/DELETE negatif case reddedilir | security-team |
| KE-05 | RFC 3161 zaman-damgası (`timestamp_token` + `tsa_provider`) | Backend/Security | P0 | Integration | TSA'dan TST alınır, geçersiz TST reddedilir | security-team |
| KE-06 | Sağlayıcı-agnostik `TsaClient` (app doğrudan TSA çağıramaz) | Backend | P1 | Contract | Korumasız TSA erişimi yok | kernel-team |
| KE-07 | LTV (cert_chain + revocation_proof CRL/OCSP + timestamp) | Backend/Security | P0 | Integration | LTV tam saklanır; eksikse incomplete | security-team |
| KE-08 | `document_hash` bytea-ref (SHA-256/512) `k-storage` binary'sine bağ | Backend/Data | P0 | Integration | Hash binary'den yeniden hesaplanıp eşleşir | kernel-team |
| KE-09 | Doğrulama servisi (`verify` → valid/broken_at/reasons) | Backend/Security | P0 | Integration | Sağlam/bozuk zincir doğru raporlanır | security-team |
| KE-10 | `audit_certificate` (PDF + `verification_url`) | Backend/API | P1 | Integration | Sertifika üretilir, üçüncü-taraf doğrular | kernel-team |
| KE-11 | Tenant-scoped hash-chain + RLS ikinci bariyer | Security | P0 | Integration(neg) | Cross-tenant okuma/zincir reddedilir | security-team |
| KE-12 | Alembic expand-contract + dolu downgrade (append-only korunur) | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| KE-13 | Strawberry resolver `permission_classes`; write mutasyon yok | Backend/API | P1 | Contract | Korumasız/yazma resolver yok | kernel-team |
| KE-14 | AI kanıt yazamaz/değiştiremez (autonomy none) | AI-Governance | P0 | Integration | AI write/update/hash-değişimi reddedilir | governance |
| KE-15 | AI yalnız doğrular/özetler; AI özeti delil değildir | AI-Governance | P0 | Integration | AI özeti zincire yazılmaz, delil sayılmaz | governance |
| KE-16 | Frontend kanıt zaman-çizelgesi + bütünlük göstergesi config-driven | Frontend | P1 | E2E | UI delil verisinden türetilir, edit/silme yok | ui-team |
| KE-17 | WCAG 2.2 AA + i18n + renk-körü bütünlük göstergesi | Frontend/A11y | P2 | A11y(axe) | axe critical=0; durum renk+ikon+metin | ui-team |
| KE-18 | `k-signature` → `k-evidence` mühürleme (CLM uçtan-uca) | Integration | P1 | Integration | İmza → mühür → chain → certificate çalışır | kernel-team |
| KE-19 | `k-evidence` WBS düğümü doğru dependsOn (k-tenancy, k-storage) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
