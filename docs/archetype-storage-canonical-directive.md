# ArcheType Storage Canonical Directive — ArcheType Satır Depolamasının Tek Canonical Hükmü

**Tarih:** 2026-07-02
**Durum:** **Kilitli** (ADR-A5 · insan onayı: 2026-07-02). Canonical default = **shared tablo + JSONB + physical-promotion** (Model c). Bu doküman artık bağlayıcı canonical hükümdür; `archetype-eav-directive`, `archetype-variant-attribute-family-directive` (VAF-10) ve `archetype-uretim-spec §4` bu hükme uyar — üçlü storage çelişkisi kapandı (JSONB default, fiziksel tablo = onaylı terfi istisnası).
**Kaynak/bağlam:** `archetype-uretim-spec.md §4` (migration & veri koruma), `archetype-uretim-spec.md §12.B` (attribute-set/EAV, runtime + ayrı indeks), `archetype-eav-directive.md §6` (ilişkili tablo vs JSONB kararı), `archetype-variant-attribute-family-directive.md` VAF-10 (runtime öznitelik, şema-migration yok), `core-contract-pack.md §2.6` (Archetype Registry), `core-contract-pack.md §2.8` (Migration Policy), `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `adr-K1-kernel-kimlik.md` (Kernel = metadata-driven ArcheType motoru), `k-storage-dam-directive.md` (kardeş 17-bölüm deseni), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman `k-storage-dam-directive.md` ile **karıştırılmamalıdır**. `k-storage` binary/medya varlığını (görsel, video, PDF) object storage'da tutar; **bu** doküman ArcheType kayıt *satırlarının* (structured veri: alanlar, öznitelikler, ilişkiler) hangi fiziksel şekilde — shared JSONB tablo mu, ArcheType-başına fiziksel tablo mu — tutulacağını hükme bağlar. İki eksen ortogonaldir: bir ArcheType satırı bir `digital_asset.id` referansı taşıyabilir; satırın *kendisi* burada, referans verdiği binary orada. Bu doküman **kod yazmaz**; ArcheType storage stratejisinin davranış sözleşmesini normatif tarif eder. Makine-okunur karşılığı (SQLAlchemy 2.0 modeli, Alembic migration, promotion motoru) ilgili ADR kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, platformdaki her ArcheType kayıt satırının **tek bir canonical depolama hükmüne** bağlanmasını sabitler. Bugün korpus üç farklı depolama felsefesini aynı anda barındırıyor (§4 çelişki tespiti) ve bu, her istemi ilk okuyan ajanın **üç farklı mimari** üretmesine yol açıyor — biri Alembic migration'lı fiziksel tablo, biri "migration yok / runtime JSONB", biri karma. Hedef: bu üçlemeyi tek bir varsayılan ile kapatmak, istisnayı (fiziksel tabloya terfi) **deterministik bir kurala** bağlamak ve terfi kararını insan onayına almak. Aktör-açık ifade: *ajan* depolama stratejisi veya migration **önermez-uygulamaz-değiştiremez**; yalnız aday ArcheType için terfi *taslağı* önerir (draft); *insan* terfiyi onaylar; *motor* onaylı kararı deterministik ve geri-alınabilir uygular. Bu, `adr-K1`'in "Kernel = metadata-driven ArcheType motoru" kimliğini korur: default runtime-tanımlı kalır, fiziksel tablo bir istisnadır.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) ArcheType satırının **default depolama modeli** (shared tablo + JSONB payload); (2) **promotion (terfi) kuralı** — bir ArcheType'ın fiziksel tabloya ne zaman terfi edeceğinin eşiği (sorgu-sıcaklığı + ölçek); (3) migration üretim ve güvenlik disiplini (motor draft → insan onay; expand-contract + dolu downgrade); (4) RLS seviyesi (her satır `tenant_id`, ikinci bariyer PostgreSQL RLS); (5) JSONB index stratejisi (GIN + sıcak alan için generated column); (6) **storage-agnostik API** (generated API storage detayını gizler); (7) üç modelin karşılaştırması ve önerilen default'un gerekçesi; (8) WBS düğüm yerleşimi; (9) AI-guardrail sınırları; (10) reconcile — `archetype-uretim-spec`, `k-fieldtypes` (fieldtypes), `archetype-eav-directive` ile ilişki. Backend (SQLAlchemy 2.0 + Alembic), test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Binary/medya depolaması — bu `k-storage-dam-directive.md`'nin işidir; farklı eksendir. (2) Öznitelik (attribute) değer katmanının iç modeli (`product_attribute_value` tipli kolonlar) — onun kararı `archetype-eav-directive.md`'de verilir; bu doküman EAV'ı *tüketir*, yeniden tanımlamaz (§14 reconcile). (3) Alan tipi tanımları (money/measure/i18n-text/geo) — bunlar `k-fieldtypes`'ın işidir. (4) Read-model/projeksiyon motoru — okuma darboğazının denormalize çözümü ayrı bir sözleşmedir (`event-replay-projection-contract.md`); bu doküman yalnız **yazma-tarafı canonical satır** depolamasını hükme bağlar. (5) Serbest kodla şema değiştirme — hiçbir app ve hiçbir AI doğrudan `CREATE TABLE` / `ALTER TABLE` çağıramaz; şema değişimi yalnız onaylı migration'dan geçer. (6) Nihai ADR kararının *kendisi* — bu doküman öneri sunar; kilidi insan atar.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** ArcheType Storage Canonical Directive, bir ArcheType kayıt satırının fiziksel veritabanı temsilini (shared JSONB tablo → fiziksel tabloya terfi) tek bir canonical hükümde birleştiren ve bu hükmü ihlal eden çoklu-mimari üretimini yasaklayan normatif depolama sözleşmesidir. Çekirdek gerçek: aynı korpusta bugün üç depolama modeli yaşıyor ve bu belirsizlik ajan-üretimini böler.

**Ne yapar:** Bir ArcheType satırını varsayılan olarak **shared tabloda + JSONB payload** ile tutar (runtime-tanımlı, migration'sız yeni alan); satırın her zaman `tenant_id` + kimlik + sistem kolonlarını fiziksel kolon olarak taşımasını zorunlu kılar; sık-sorgulanan/yüksek-ölçekli ArcheType için **fiziksel tabloya terfi (promotion)** yolunu deterministik bir eşikle açar; sıcak JSONB alanını GIN + generated column ile indekslenebilir kılar; migration'ı motorun *taslak* olarak üretip insanın onayladığı bir akışa bağlar; storage detayını generated API'nin *arkasına* gizler (API storage-agnostik).

**Ne yapmaz:** Depolama modelini veya migration'ı **AI'nın kendi başına seçmesine/uygulamasına izin vermez** (AI yalnız terfi taslağı önerir; §11). Satırı fiziksel silmez (append-only + expand-contract; alan delete/rename doğrudan yapılmaz — `archetype-uretim-spec §4`). Storage biçimini generated API'ye sızdırmaz (istemci bir alanın JSONB'de mi fiziksel kolonda mı olduğunu bilemez). Öznitelik değer modelini yeniden tanımlamaz (o `archetype-eav-directive`'in işi). Geçmiş satırı geriye dönük yeniden yazmaz (terfi bir kopya-üstünde-geçiş migration'ıdır; kaynak veri korunur). Fiziksel tabloyu default yapmaz (default JSONB; fiziksel tablo istisna ve onay-gerektirir).

## 5. Çelişki tespiti (kanıtla adlandırma)

Aşağıdaki tablodan önce çelişkinin somut kanıtı: aynı `actionplan/docs` korpusunda üç ayrı doküman, ArcheType satır depolaması için **üç farklı ve uzlaşmamış** hüküm veriyor. Bir ajan hangi dokümanı önce okursa o mimariyi üretir; sonuç, aynı platformda yan yana yaşayan üç uyumsuz şema stratejisidir (para/stok/uyum yüzeyinde en pahalı hata sınıfı).

Bu tablo korpustaki üç çelişkili depolama sinyalini kaynağıyla listeler.

| Sinyal | Kaynak (kanıt) | İmâ ettiği mimari |
|---|---|---|
| "Değer tipli kolonla tutulur; ilişkili tablo vs JSONB ikisi de yan yana yaşayabilir; kaynak daima normalize kalır" | `archetype-eav-directive.md §6` | Table-per-type eğilimli hibrit; normalize ilişkili tablo default |
| "Runtime öznitelik ekleme — JSONB, **şema-migration yok**" | `archetype-variant-attribute-family-directive.md` VAF-10 (P0) | Shared/JSONB, migration'sız |
| "Varsayılan migration policy: append-only, expand-contract, deprecated/alias/backfill; Alembic downgrade CI'da test edilir" | `archetype-uretim-spec.md §4` + `core-contract-pack.md §2.8` | Fiziksel tablo + Alembic migration disiplini |
| "Kernel = metadata-driven ArcheType motoru (runtime kayıt tipi tanımlama)" | `adr-K1-kernel-kimlik.md` | Runtime-tanımlı (fiziksel tablo değil) vizyon |

Tehlike net: "migration yok" (VAF-10) ile "her değişiklik expand-contract migration" (§4) **aynı anda** doğru olamaz; birinin *default*, diğerinin *istisna* olduğu söylenmeden korpus tutarsız kalır. Bu doküman tam olarak bu ayrımı yapar: **default migration'sız JSONB; fiziksel tablo (dolayısıyla migration) terfiyle gelen istisna.**

## 6. Üç modelin karşılaştırması (güvenli / riskli / enterprise / pratik ekseninde)

Aşağıdaki tablodan önce eksenlerin tanımı: **Güvenli** = veri kaybı/çoklu-mimari riski düşük mü; **Riskli** = başlıca risk sınıfı ne; **Enterprise** = yüksek-ölçek/denetim ihtiyacını karşılıyor mu; **Pratik** = 50 app × runtime ArcheType üretiminde günlük iş yükü ne. Üç model karşılaştırılır; hiçbiri "kolay oldu diye" seçilmez.

Bu tablo üç depolama modelini dört eksende karşılaştırır.

| Model | Güvenli | Riskli | Enterprise | Pratik |
|---|---|---|---|---|
| (a) **Shared tablo + JSONB** (payload bir JSONB kolonda, `tenant_id`+kimlik fiziksel kolon) | Yüksek: yeni alan migration istemez, çoklu-mimari riski yok | Zayıf tip-doğrulaması JSONB içinde; indekssiz alanda p95 deler; büyük payload update ağır | Orta: tek başına yüksek-hacim filtre/sorguyu karşılamaz (GIN + generated column ile kısmen) | Yüksek: runtime ArcheType üretimi migration'sız; `adr-K1` vizyonuna birebir uyar |
| (b) **Table-per-ArcheType + Alembic** (her ArcheType kendi fiziksel tablosu, her alan kolon) | Orta: tip güvenli ama her alan değişimi migration → veri-kaybı yüzeyi artar | Migration patlaması (50 app × N ArcheType × alan değişimi); AI migration üretirse en tehlikeli yüzey | Yüksek: kesin tip + B-tree/GIN indeks + planlanabilir sorgu | Düşük: her yeni alan/ArcheType bir migration; runtime-tanımlı vizyonu kırar (`adr-K1` ile çelişir) |
| (c) **Hybrid (JSONB default + physical promotion)** | Yüksek: default JSONB güvenli, terfi kontrollü ve onaylı | Terfi migration'ı yanlış üretilirse riskli — bu yüzden motor-draft + insan-onay + downgrade testi zorunlu | Yüksek: sıcak/ölçekli ArcheType fiziksel tabloya terfi ederek enterprise sorgu bütçesini karşılar | Yüksek: gündelik iş migration'sız (default JSONB); yalnız kanıtlı-sıcak ArcheType terfi eder (nadir, onaylı) |

Sonuç: (a) pratik ama enterprise ölçekte tek başına yetmez; (b) enterprise ama pratik değil ve `adr-K1` runtime vizyonunu kırar; (c) her iki dünyanın iyisini alır — default'un güvenliği + istisnanın enterprise ölçeği. Bu yüzden önerilen default (c)'dir.

## 7. Önerilen default (net hüküm önerisi)

Aşağıdaki hüküm 2026-07-02'de **ADR-A5 olarak KİLİTLENDİ** (insan onayı); artık canonical default'tur (öneri değil). Karşılaştırmanın (§6) ve korpus vizyonunun (`adr-K1`, `archetype-uretim-spec §12.B` "runtime + ayrı indeks") mantıksal sonucudur.

**Önerilen canonical hüküm: Shared tablo + JSONB + promotion (Model c).**

- **Default depolama:** Her ArcheType satırı varsayılan olarak **tek bir shared tabloda** tutulur. Satırın kimlik ve sistem kolonları (`id`, `tenant_id`, `archetype_key`, `status`, `created_at`, `updated_at`, versiyon) **fiziksel kolondur**; ArcheType'a özgü alanlar tek bir `payload` **JSONB** kolonunda yaşar. Yeni alan eklemek şema-migration istemez (VAF-10 "migration yok" burada *default* olarak doğrulanır) — `adr-K1` metadata-driven vizyonu korunur, `archetype-uretim-spec §4` append-only ruhu JSONB içinde deprecated/alias ile sürer.
- **İstisna — fiziksel tabloya terfi:** Sık-sorgulanan veya yüksek-ölçekli bir ArcheType, §8 promotion kuralı sağlandığında **kendi fiziksel tablosuna terfi eder** (payload alanları kolonlaşır). Bu bir istisnadır, default değil; onay-gerektirir (§11).
- **Gerekçe:** Bu hüküm Frappe-DocType ruhuna (runtime-tanımlı kayıt tipi) ve `adr-K1` metadata-driven ArcheType motoru kimliğine uygundur; gündelik ArcheType üretimini migration yükünden kurtarır (50 app × N ArcheType ölçeğinde migration patlamasını önler), ama para/stok/yüksek-hacim filtre yollarını fiziksel tabloya terfi ederek enterprise sorgu bütçesine (`archetype-eav-directive` PIM-v2 NFR: 100k+ ürün, p95<300ms) taşır. Kısaca: **güvenli default + enterprise kaçış yolu, ikisi de tek hükümde.**
- **Karar kilidi:** Bu öneri ADR-A5 (önerilen ad) olarak insan onayına sunulur; `PENDING-HUMAN-FIXES-2026-07-01.md` C2 deseninde "Taslak → Kilitli" terfisi **insan** eliyle yapılır. AI yalnız bu gerekçe taslağını sunabilir, statüyü terfi ettiremez.

## 8. Cevaplanması gereken sorular (net hükümle)

Aşağıdaki tablodan önce: bu bölüm, çelişkiyi kapatmak için mutlaka bir hükme bağlanması gereken altı soruyu tek tek net cevapla listeler. Her hüküm bir öneridir (insan ADR onayı saklı) ama belirsizlik bırakmaz — ajan bu tablodan tek bir mimari türetebilmelidir.

Bu tablo altı canonical soruyu ve önerilen net hükmü eşler.

| Soru | Net hüküm (öneri) |
|---|---|
| **Default storage modeli nedir?** | Shared tablo + JSONB payload. Kimlik/sistem kolonları fiziksel; ArcheType alanları `payload` JSONB'de. Yeni alan migration istemez. |
| **Physical table ne zaman açılır (promotion kuralı)?** | İki eşikten **biri** aşılınca terfi *adayı* olur: (1) **sorgu-sıcaklığı** — ArcheType'ın alanları üzerinde filtre/sıralama sorgu hacmi eşik-üstü ve JSONB+GIN p95 bütçeyi (300ms) aşıyor; (2) **ölçek** — satır sayısı eşik-üstü (öneri: ~1M satır, `core-contract-pack §2.8` "büyük tablo" eşiğiyle hizalı). Aday, insan onayıyla fiziksel tabloya terfi eder (§11). Eşiğin kesin sayısı ADR'de sabitlenir. |
| **Migration'ı kim üretir?** | **Motor draft üretir → insan onaylar → motor uygular.** AI migration'ı doğrudan üretemez-uygulayamaz. AI-migration güvenliği zorunlu: **expand-contract** (tek migration'da hem ekle hem sil yasak) + **dolu downgrade** (CI'da `alembic downgrade -1`, boş downgrade yasak) + immutable snapshot + rollback planı + dry-run + data-impact (`archetype-uretim-spec §4`, `core-contract-pack §2.8`). |
| **RLS hangi seviye?** | **Her zaman row-level `tenant_id`.** Her satır (default JSONB tabloda da, terfi etmiş fiziksel tabloda da) `tenant_id` fiziksel kolonu taşır; fail-closed. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Cross-tenant erişim `TenantViolationError` + audit. Terfi RLS'i *değiştirmez*; fiziksel tablo da aynı RLS politikasını miras alır. |
| **JSONB index stratejisi nedir?** | **GIN + sıcak alan için generated column.** JSONB payload'a GIN indeksi (`USING GIN (payload jsonb_path_ops)`) içerik-içi aramayı (`@>`, `?`) karşılar; **filtre/sıralama yolundaki sıcak alan** bir **generated column** (`GENERATED ALWAYS AS ((payload->>'x')::type) STORED`) ile JSONB'den türetilip B-tree indekslenir. Böylece terfi *öncesi* bile sıcak alan indekslenir; indekssiz JSONB filtre yasaktır (p95 deler). |
| **Generated API storage detayını saklar mı?** | **EVET — storage-agnostik API.** Generated GraphQL/REST yüzeyi, bir alanın JSONB payload'da mı yoksa fiziksel kolonda mı (terfi sonrası) tutulduğunu **gizler**; istemci aynı alanı aynı sözleşmeyle okur. Terfi bir *iç* değişimdir; API sözleşmesi değişmez (kırıcı-olmayan). Storage detayı sızarsa çoklu-mimari geri gelir — bu yasaktır. |

## 9. WBS / kernel yerleşimi

ArcheType storage stratejisi ayrı bir kernel `module` düğümü açmaz; ArcheType motorunun (`k-schema`) altında bir `archetype`-seviyesi düğümde kod olarak teslim edilir — kardeş `k-archetype-relation` (`archetype-tree-relation-directive.md`) deseniyle aynı. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `k-archetype-storage` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-archetype-storage` | archetype | `k-schema`, `k-tenancy` | kernel |

`dependsOn` gerekçesi: satır depolaması şema temeline (`k-schema` — alan/ArcheType tanımı) ve kiracı bağlamına (`k-tenancy` — RLS/`tenant_id`) teknik olarak bağlıdır; ikisi hazır olmadan bir ArcheType satırı yazılamaz (satır kiracısız ve şemasız var olamaz). `related` ile (karar üretmeden) `k-fieldtypes` (alan tipi doğrulama), `archetype-eav-directive` (öznitelik değer katmanı), `k-search` (GIN/faset indeksi), `event-replay-projection-contract` (okuma-tarafı denormalizasyon) ve `k-storage` (kardeş eksen ayrımı) düğümlerine bağlanır. Promotion motoru ve migration draft'ı kendi `dependsOn`'unda bu düğümü ve `k-migration-bridge`'i listeler.

## 10. Migration ve promotion mekaniği (motor draft → insan onay)

Aşağıdaki gereksinimler `archetype-uretim-spec §4` ve `core-contract-pack §2.8` migration disiplinini ArcheType terfi bağlamına uygular; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir.

- **Terfi bir expand-contract migration'ıdır:** Fiziksel tabloya terfi, tek adımda değil, expand-contract ile yapılır: (1) expand — yeni fiziksel tablo/kolonlar oluşturulur, motor JSONB'den fiziksel kolona **backfill** eder ve bir süre *her ikisine* yazar; (2) contract — tüm okuma fiziksel kolona geçtiği doğrulandıktan sonra JSONB'deki karşılık deprecated/alias ile kapatılır. Tek migration'da hem ekle hem sil **yasaktır**.
- **Draft'ı motor üretir, insan onaylar:** Migration/terfi taslağını **motor** üretir (`archetype-uretim-spec §5` ADMIN_FLOW: `prompt → draft → validation → diff → data-impact → migration-dry-run → preview → approval → apply`). AI yalnız terfi *adayını işaretler* (bkz. §11); migration SQL'ini AI serbest yazmaz. Uygulama (`apply`) yalnız insan `approval_ref`'i (onaylayan + zaman + gerekçe) ile mümkündür; onaysız apply `ApprovalRequiredError` fırlatır ve audit'lenir (`core-contract-pack §3.0.1`).
- **AI-migration güvenliği:** Her terfi migration'ı için **dolu downgrade** zorunlu; CI'da `alembic upgrade head && alembic downgrade -1` veri kaybetmeden çalışır (boş downgrade yasak). Immutable snapshot + rollback planı + dry-run + data-impact raporu üretilir. Veri-kaybı riski olan değişiklik yalnız platform owner + açık risk onayıyla mümkündür (`archetype-uretim-spec §4`).
- **Geri-alınabilirlik ve idempotency:** Backfill idempotenttir (aynı satır iki kez taşınırsa aynı sonuç); yarım kalan terfi güvenle tekrar başlatılabilir. Terfi başarısızsa otomatik rollback tetiklenir, default JSONB durumu bozulmaz.
- **API kırıcı-olmama:** Terfi generated API sözleşmesini değiştirmez (§8). Terfi bir iç depolama değişimidir; istemci fark etmez.
- **Hata/log:** Hata formatı `{code, message, trace_id, details}` (`core-contract-pack §3.1`); `get_logger()` kullanılır, `print()` yasak; her terfi/backfill/migration audit'lenir (append-only).

## 11. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) AI depolama modelini/migration'ını **üretemez-uygulayamaz-değiştiremez**; promotion kararı insanındır.

Bu tablo `k-archetype-storage` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Terfi adayı *işaretleme* | `draft` | AI, sorgu-sıcaklığı/ölçek telemetrisinden "bu ArcheType terfi adayı" *taslağı* önerir (`PromotionProposal`); doğrudan terfi ettiremez |
| Migration/terfi SQL üretimi | onay-zorunlu | Motor draft üretir; `apply` yalnız insan `approval_ref`'iyle; onaysız apply `ApprovalRequiredError` |
| Default storage modeli değişimi | `none` | Shared-JSONB vs fiziksel default kararı canonical hüküm/ADR işidir; AI değiştiremez |
| RLS seviyesi / `tenant_id` politikası | `none` | Row-level tenant zorunlu; AI gevşetemez |
| Index stratejisi (GIN/generated column) değişimi | `draft` | AI eksik/önerilen indeks taslağı sunabilir; şema değişimi migration onayından geçer |
| ADR statü terfisi (Öneri → Kilitli) | `none` | Canon değişikliği; `PENDING-HUMAN-FIXES` C2 gereği **insan** yapar; AI yalnız gerekçe taslağı |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez-güncelleyemez; ruleset/policy override edemez; doğrudan `CREATE TABLE`/`ALTER TABLE`/prod şema yazamaz; kanıtsız "bitti" diyemez. Promotion kararı **insan** onayıyla; AI yalnız aday işaretler ve gerekçe taslağı sunar.

## 12. Test stratejisi

Aşağıdaki testler `core-contract-pack` DoD'unu ve bu dokümanın canonical hükmünü karşılar; hepsi test-önce (önce kırmızı) yazılır.

Bu tablo `k-archetype-storage` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Default: yeni alan JSONB payload'a **migration'sız** eklenip okunuyor | Entegrasyon |
| 2 | GIN: JSONB payload içi filtre (`@>`, `?`) indeksten çözülüyor, tam-tarama yok | Entegrasyon (perf) |
| 3 | Generated column: sıcak alan JSONB'den türetilip B-tree'den filtreleniyor (p95 bütçe) | Entegrasyon (perf) |
| 4 | Promotion: terfi adayı fiziksel tabloya expand-contract ile taşınıyor, veri kaybı yok | Entegrasyon |
| 5 | Storage-agnostik API: terfi öncesi/sonrası aynı GraphQL sorgusu aynı sonucu döndürüyor (kırıcı-olmama) | Contract |
| 6 | Tenant izolasyonu: A tenant B'nin satırını (JSONB ve fiziksel tabloda) okuyamıyor (≥10 negatif case) | Entegrasyon (negatif) |
| 7 | Migration downgrade: terfi migration'ı `alembic downgrade -1` ile veri kaybetmeden geri alınıyor | CI |
| 8 | AI-guardrail: AI terfiyi/migration'ı `approval_ref` olmadan uygulayamıyor (`ApprovalRequiredError`) | Entegrasyon |
| 9 | Backfill idempotency: terfi backfill'i iki kez koşunca aynı sonuç | Birim |
| 10 | GraphQL koruması: her resolver `permission_classes` taşıyor | Contract |

## 13. Acceptance criteria

- Yeni ArcheType alanı default olarak JSONB payload'a **şema-migration'sız** eklenir ve okunur (VAF-10 default olarak doğrulanır).
- Sıcak alan generated column + B-tree ile, serbest JSONB alanı GIN ile indekslenir; indekssiz JSONB filtre yolu yoktur; filtre p95 bütçesi (300ms, 100k+ satır) karşılanır.
- Terfi adayı sorgu-sıcaklığı/ölçek eşiğiyle işaretlenir; fiziksel tabloya terfi expand-contract + backfill ile, veri kaybı olmadan yapılır.
- Terfi öncesi ve sonrası generated API sözleşmesi aynıdır (storage-agnostik; kırıcı-olmayan).
- Her satır (JSONB ve fiziksel tabloda) `tenant_id` taşır; RLS ikinci bariyer aktif; cross-tenant en az 10 negatif case ile reddedilir ve audit'lenir.
- AI terfiyi/migration'ı yalnız `draft`/aday olarak önerir; `approval_ref` olmadan apply reddedilir; promotion kararı insanındır.
- Terfi migration'ı dolu downgrade ile CI'da geri alınabilir; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.
- ADR-A5 (önerilen) insan onayıyla "Kilitli" statüsüne alınır; `k-archetype-storage` düğümü WBS'te doğru `dependsOn` (`k-schema`, `k-tenancy`) ile mevcut.

## 14. Reconcile (referans — karar üretmeden)

Aşağıdaki tablodan önce: bu bölüm, bu canonical hükmün korpustaki üç ilgili dokümanla **nasıl uzlaştığını** referansla verir; yeni karar üretmez, yalnız bu dokümanı onların üzerine oturtur. Amaç, çelişki tespitinde (§5) adlandırılan üç sinyali tek hükmün altında hizalamaktır.

Bu tablo üç reconcile hedefini ve bu hükmün onlarla ilişkisini tanımlar.

| Reconcile hedefi | İlişki (bu hüküm ne der) |
|---|---|
| `archetype-uretim-spec.md` (§4 migration, §12.B attribute-set) | §4 expand-contract/downgrade disiplini **terfi migration'ına** aynen uygulanır; §12.B "runtime + ayrı indeks" bu hükmün *default JSONB + GIN/generated column* kararının kaynağıdır. "migration yok" default'tur; migration terfiyle gelen istisnadır — çelişki bu ayrımla kapanır. |
| `k-fieldtypes` (fieldtypes; ör. `archetype-eav-directive` başlığındaki `k-fieldtypes`) | Alan *tipi* (money/measure/i18n-text/geo) doğrulaması `k-fieldtypes`'ta kalır; bu doküman değeri *nerede* (JSONB/fiziksel kolon) tuttuğunu hükme bağlar, *tip*ini değil. JSONB payload'daki değer yine `k-fieldtypes` tip kurallarıyla doğrulanır (string birim/float-para yasağı sürer). |
| `archetype-eav-directive.md` (§6 ilişkili tablo vs JSONB) | EAV `product_attribute_value` yüksek-kardinaliteli, filtrelenen öznitelik için ayrı ilişkili tablo deseni **korunur**; bu ayrı bir eksendir (öznitelik değer katmanı). Bu doküman ArcheType *gövde* satırının depolamasını hükme bağlar; öznitelik demeti EAV'a devreder. İkisi çelişmez: EAV = öznitelik değer satırı; bu = ArcheType kayıt satırı. Filtre-yolu öznitelik yine indekslidir (§8 GIN/generated column ile hizalı). |

## 15. Definition of Done

- §12'deki 10 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks + migration uyumu sağlandı; `check-core-contract.mjs` yeşil (tenant guard, resolver koruması, dolu downgrade, indeks).
- Terfi migration'ı dolu downgrade ile CI'da geri alınabilir; expand-contract deseni ihlal edilmiyor.
- Default JSONB akışı (migration'sız alan) ve terfi akışı (fiziksel tabloya expand-contract) uçtan-uca çalışır; generated API her iki durumda aynı sözleşmeyi döndürür (storage-agnostik kanıtı).
- ADR-A5 (önerilen) statüsü: `PENDING-HUMAN-FIXES-2026-07-01.md` C2 deseninde insan onayına sunulmuş; "Öneri" iken bu doküman default'u tarif eder, "Kilitli" olunca canonical hüküm bağlayıcıdır. AI statü terfisi yapmaz.
- `k-archetype-storage` düğümü ve altındaki promotion/migration teslimatı WBS'te doğru `dependsOn` (`k-schema`, `k-tenancy`) ile mevcut.
- AI-guardrail testi: `draft`/aday-dışı doğrudan terfi/migration reddediliyor; promotion kararı insan onayına bağlı.
- §5 çelişki tespitindeki üç sinyal (`archetype-eav §6`, VAF-10, `archetype-uretim-spec §4`) tek hükmün altında hizalandı (§14 reconcile); korpusta artık tek canonical storage kararı var.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, §4 nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. Anti-patterns

- **Çoklu-mimari üretimi:** Aynı korpusta ArcheType satırını kimi yerde fiziksel tabloya, kimi yerde JSONB'ye, kimi yerde EAV'a yazmak — YASAK; tek canonical hüküm (default JSONB + terfi) geçerlidir.
- **AI'ın storage/migration kararı:** AI'nın depolama modelini seçmesi veya migration'ı doğrudan üretip uygulaması — YASAK; AI yalnız terfi adayı/gerekçe taslağı önerir, insan onaylar.
- **Fiziksel tabloyu default yapma:** Her ArcheType'ı doğrudan kendi fiziksel tablosuyla açmak (table-per-type default) — YASAK; `adr-K1` runtime vizyonunu kırar, migration patlaması doğurur. Default JSONB.
- **İndekssiz JSONB filtre:** Sıcak alanı GIN/generated column olmadan JSONB içinden filtrelemek — YASAK; tam-tarama, p95 bütçesini deler.
- **Row-level tenant atlama:** Bir satırı (JSONB veya fiziksel) `tenant_id` fiziksel kolonu ve RLS olmadan yazmak — YASAK; izolasyon her zaman row-level.
- **API'ye storage sızdırma:** Generated API'nin bir alanın JSONB'de mi fiziksel kolonda mı olduğunu istemciye göstermesi — YASAK; API storage-agnostik.
- **Boş downgrade / tek-adım migration:** Terfi migration'ında `downgrade()` boş bırakmak veya tek migration'da hem ekle hem sil — YASAK; expand-contract + dolu downgrade zorunlu.
- **Geçmiş satırı yeniden yazma:** Terfi sırasında kaynak satırı geriye dönük silme/bozma — YASAK; backfill kopya-üstünde, idempotent, geri-alınabilir.
- **AI'ın onaysız terfisi:** `approval_ref`'siz apply — YASAK; `ApprovalRequiredError`.

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| AS-01 | Default depolama: shared tablo + JSONB payload; yeni alan migration'sız | Backend/Data | P0 | Integration | Yeni alan migration'sız yazılır/okunur | kernel-team |
| AS-02 | Kimlik/sistem kolonları (`id`,`tenant_id`,`archetype_key`,`status`,`created_at`) fiziksel | Backend/Data | P0 | Integration | Sistem kolonları fiziksel; RLS `tenant_id`'ye dayanır | kernel-team |
| AS-03 | Promotion kuralı: sorgu-sıcaklığı VEYA ölçek eşiğiyle terfi adayı | Backend/Data | P1 | Integration | Eşik aşan ArcheType aday işaretlenir | kernel-team |
| AS-04 | Terfi expand-contract + backfill; veri kaybı yok | Backend/DevOps | P0 | Integration | Fiziksel tabloya geçiş veri kaybetmez | kernel-team |
| AS-05 | Storage-agnostik generated API (terfi öncesi/sonrası aynı sözleşme) | Backend/API | P0 | Contract | API storage detayını gizler; kırıcı-olmayan | kernel-team |
| AS-06 | Row-level `tenant_id` + RLS ikinci bariyer (JSONB ve fiziksel tabloda) | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| AS-07 | JSONB GIN indeksi (`jsonb_path_ops`) içerik araması | Backend/DB | P1 | Performans | JSONB filtre GIN'den çözülür, tam-tarama yok | kernel-team |
| AS-08 | Sıcak alan generated column + B-tree (p95<300ms, 100k+) | Backend/DB | P1 | Performans | Sıcak alan indeksli filtre bütçeyi karşılar | kernel-team |
| AS-09 | Terfi migration'ı motor-draft; `apply` insan `approval_ref`'iyle | AI-Governance | P0 | Integration | approval_ref'siz apply reddedilir | governance |
| AS-10 | AI storage modeli/migration üretemez-uygulayamaz (autonomy none/draft) | AI-Governance | P0 | Unit | AI storage/migration kararı veremez | governance |
| AS-11 | Promotion kararı insan onayı (AI yalnız aday + gerekçe taslağı) | AI-Governance | P0 | Integration | AI tek başına terfi ettiremez | governance |
| AS-12 | Terfi migration'ı dolu downgrade; `alembic downgrade -1` veri kaybetmez | Backend/DevOps | P1 | CI | Boş downgrade yok; geri-alınabilir | kernel-team |
| AS-13 | Backfill idempotency (iki kez koşum aynı sonuç) | Backend/Data | P1 | Unit | Yarım terfi güvenle tekrar başlar | kernel-team |
| AS-14 | Strawberry resolver `permission_classes` zorunlu | Backend/API | P1 | Contract | Korumasız resolver yok | kernel-team |
| AS-15 | Çelişki kapanışı: tek canonical storage hükmü (çoklu-mimari yok) | Governance | P0 | Contract | Korpusta tek storage kararı; §14 reconcile hizalı | pmo |
| AS-16 | ADR-A5 (önerilen) statü: Öneri → insan onayıyla Kilitli | Governance | P1 | Doc-review | C2 deseninde insan onayına sunuldu | pmo |
| AS-17 | `k-archetype-storage` WBS düğümü doğru dependsOn (k-schema, k-tenancy) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
