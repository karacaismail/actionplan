# Atomik Tip Sistemi Yönergesi — `platform_fieldtypes` (Değer-Tipi Tabanı / ArcheType Engine Besleyici)

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-AT1)
**Kaynak/bağlam:** `docs/atomik-netlestirme-2026-07-01.md` (nihai atom tanımı, 3-kademe modeli, 5-test karar kuralı, `Range<T>`, parametreli atom — **ana kaynak**), `docs/atomik-tip-katalogu-tam-2026-07-01.md` (~42 tip katalog, per-tip gereksinim, registry bağımlılıkları), `src/schemas/archetype.ts` (`FieldTypeSchema` `:77`, `FieldSchema`, `FragmentSchema`), `core-contract-pack.md §3.6/§3.15` (float-yasağı, atom sözleşmesi), `k-storage-dam-directive.md` (kardeş primitif yapı şablonu), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman, üç-kademe kompozisyon zincirinin (**Atom / Fragment / ArcheType**) yalnız **Atom** kademesini normatif tanımlar. Atom = `FieldType` = tek kanonik temsili ve bütün-değer semantiği olan bölünemez değer tipi; kod tabanı karşılığı `FieldTypeSchema` (`platform_fieldtypes`). Fragment kademesi (mini-archetype, Address/PersonName/ContactPoint; `platform_fragments`) **ayrı bir yönergede** (`fragments-directive`) tanımlanır; bu yönerge Fragment'i yalnız sınır (atom-değildir) olarak referans verir. ArcheType kademesi (Party/Contract, kimlik+yaşam-döngüsü+ilişki+izin) `archetype-uretim-spec` kapsamındadır. Bu doküman **kod ve kanonik şema yazmaz**; `k-storage`'ın kardeşidir. Makine-okunur karşılığı (SQLAlchemy 2.0 TypeDecorator, Alembic migration, Zod/Strawberry tip) ADR-AT1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir.

---

## 1. Amaç

Bu sözleşme, platformdaki her alan-değerinin tek bir kanonik atomik tip tabanına (`platform_fieldtypes`) oturmasını ve ArcheType engine'in bu tabandan 13 sözleşme boyutunu deterministik türetmesini sabitler. Hedef: 50 uygulamanın hiçbirinin parayı `float`/düz `currency`, ölçüyü serbest `number`, süreyi `string`, kimliği `string`, çok-dilli metni tek-dilli kolon ile yeniden uydurmaması; her değerin tek kanonik temsili, tek doğrulama kuralı, tek kanonikleştirme/sıralama davranışı olan bir **atomda** yaşaması. Aktör-açık ifade: *AI* bir kolonun hangi atom olması gerektiğini **önerir** (draft: "bu kolon `Money` olmalı"); *insan* tip kararını ve migrasyonunu onaylar; *motor* onaylı atom sözleşmesinden DB kolonunu, doğrulamayı, formu ve indeksi deterministik türetir. Atomun kesin (testable) tanımı netleştirme belgesi §11'dedir: *tek kanonik temsili ve bütün-değer semantiği olan, iç bileşenleri bağımsız iş-alanı değil değerin parametresi/ucu olan, kimliği/yaşam-döngüsü/ilişkisi olmayan bölünemez değer tipi.*

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) üç-kademe modelinin **Atom** kademesi (FieldType, bütün-değer semantiği, parametreli); (2) "atom mı, fragment mı, archetype mı?" için **5-test karar kuralı** (kimlik→ayrıştırma→bütün-değer→operasyon→genişletme); (3) atom kataloğunun üç katmanı — **Katman A** taban skaler (~12 tip), **Katman B** semantik değer (~16 tip, `Range<T>` dahil), **Katman C** referans-değer (~6 tip); (4) **parametreli atom** modeli (`Money⟨currency,precision,rounding⟩`, `Range⟨T,bound-closure⟩`, `string⟨maxLength,collation⟩`, `Measure⟨dimension,unit⟩`) ve `FieldSchema`'ya per-tip `params` alanı önerisi; (5) her atomun beyan etmesi gereken **13 sözleşme boyutu** (storage-mapping, validation, parameterization, canonicalization/collation, compare/order, equality/fuzzy, indexability, i18n, null/empty/unknown/NA, serialization, surface-projection, security-class, versioning); (6) atom katmanının WBS/kernel yerleşimi (`atomic-types` düğümü, kernel/layer0); (7) SQLAlchemy 2.0 TypeDecorator ve versiyonlu registry bağımlılıkları (ISO-4217, UCUM, ISO-3166, BCP-47, IANA-tz, E.164, GS1); (8) `check-atomic-types` CI kapısı; (9) AI tip-öneri guardrail'i ve tip-migrasyon (şema değişikliği → insan onayı) politikası; (10) `currency→Money` çelişki düzeltmesi **önerisi**. Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) **Fragment kademesi** — Address/PersonName/ContactPoint gibi çok-alanlı, parçaları bağımsız anlamlı kayıtlar; bunlar `fragments-directive` + `platform_fragments`'ın işidir. Bu yönerge Fragment'i yalnız "atom değildir" sınırı olarak anar. (2) **ArcheType kademesi** — kimlik/yaşam-döngüsü/ilişki/izin taşıyan varlıklar (Party/Contract); `archetype-uretim-spec`'in işidir. (3) **Görsel/binary depolama** — `AssetRef` bir atomdur (referans-değer, Katman C) ama binary'nin kendisi `k-storage`'ın işidir; atom yalnız `digital_asset.id` referansını taşır. (4) **Registry verisinin kendisi** — ISO-4217 para kodu tablosu, UCUM birim tablosu bir referans-data primitifidir (`k-mdm`/`reference-data` adayı); atom yalnız o registry'ye **versiyonlu bağlanır**, tabloyu içermez. (5) **Standart metnin kopyalanması** — RFC 5322 / ISO 13616 / RFC 5545 gibi standartların içeriği bu belgeye gömülmez; atom yalnız standarda **referans** verir. (6) **Kanonik şema mutasyonu** — bu belge `FieldTypeSchema`'yı (`archetype.ts:77`) değiştirmez; yalnız değişiklik gereksinimini ve göç yolunu **önerir** (§5, §10). (7) **MDM golden-record/survivorship** — dedup fuzzy-eşitlik atomun bir boyutudur (`equality/fuzzy`), ama kayıt-birleştirme kararı `k-mdm`'in işidir. (8) **Mock veri** — bu belge hiçbir tabloda dolu/örnek değer vermez; yalnız alan adı + tip + amaç.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Atomik tip sistemi (`platform_fieldtypes`), üç-kademe kompozisyon zincirinin en alt kademesidir: **tek kanonik temsili ve bütün-değer semantiği olan, iç bileşenleri bağımsız iş-alanı değil değerin parametresi/ucu olan, kimliği/yaşam-döngüsü/ilişkisi olmayan bölünemez değer tiplerinin** kanonik kütüphanesidir. Kod tabanı karşılığı `FieldTypeSchema`'dır (`archetype.ts:77`). Atom, düz bir enum değil **parametreli bir değer tipidir** (`Money⟨currency,precision,rounding⟩`); parametrelerle somutlaşır ve motor ondan 13 sözleşme boyutunu deterministik türetir.

**Ne yapar:** Bir değeri tek kanonik biçimde temsil eder (Money = değer+kur+precision+rounding; `Range<date>` = iki uç + uç-açıklık); bütün-değer semantiğiyle karşılaştırır/eşitler (Money değer+kur bir bütün, DateRange iki uç bir aralık); kanonik form ve locale-collation uygular (Türkçe İ/ı sıralama); parametrelerini beyan eder ve motor türetimini bu parametreden okur (`string(50)` = `string` + `{maxLength:50}`); registry'ye versiyonlu bağlanır (Money → ISO-4217, Measure → UCUM); her atom 13 sözleşme boyutunu (storage/validation/params/c13n/compare/equality/index/i18n/null/serialize/surface/security/versioning) beyan eder ki motor DB kolonunu, doğrulamayı, formu, indeksi deterministik üretebilsin.

**Ne yapmaz:** Kimlik/yaşam-döngüsü/ilişki **taşımaz** (o zaman ArcheType olur — 5-test, test 1). Bağımsız anlamlı çok-alanlı kayıt **değildir** (o zaman Fragment olur — test 2); `PersonName`/`Address` atom değil Fragment'tir. İç parçalarını bağımsız iş-alanı olarak **açmaz** — Money'nin currency'si, DateRange'in uçları değerin parametresi/ucudur, ayrı sorgulanan alan değil. Parayı `float` ile **tutmaz** (float yasağı, `§3.6`); Money `decimal` tabanlıdır. İki farklı kurdaki Money'yi **toplamaz** (tanım-anında `CurrencyMismatchError`). Kanonik şemayı (`FieldTypeSchema`) doğrudan **değiştirmez** — AI yalnız önerir, insan onaylar. Standart metni **kopyalamaz** — referans verir.

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki tablolar, atomik tip sisteminin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. Kanonik şema `src/schemas/archetype.ts:77` `FieldTypeSchema`'dır; bu belge onu değiştirmez, yalnız aşağıdaki yapıyı ve iki düzeltmeyi **önerir** (insan onayı gerekir).

### 5.1 FieldType kayıt yapısı (öneri)

Bu tablo bir atomik tipin (`platform_fieldtypes` bir satırı) beyan etmesi gereken alanları tanımlar; bir atom bu alanlarla somutlaşır ve motor türetimi tümünü okur.

| Alan | Tip | Amaç |
|---|---|---|
| `type_id` | Text (PK, ör. `Money`, `Range`, `uuid`) | Atomun kanonik teknik kimliği; kataloğa yazılır |
| `layer` | Enum(A, B, C) | Katman: A taban skaler, B semantik değer, C referans-değer |
| `base_kind` | Enum(scalar, semantic, reference, generic) | Motorun temel muamele sınıfı (`Range<T>` = generic) |
| `params_schema` | JSONB | Per-tip parametre şeması (`§5.2`); atomu somutlaştıran zorunlu meta |
| `storage_mapping` | Text | PostgreSQL kolon tipi kuralı (numeric/uuid/timestamptz/jsonb) |
| `registry_ref` | Text (nullable) | Bağlı standart registry (ISO-4217/UCUM/…) ve sürüm kilidi |
| `security_class` | Enum(none, PII, PHI, PCI) | Alan-düzeyi güvenlik sınıfı (NationalId=PII-yüksek) |
| `null_semantics` | JSONB | Dört-durum: null/empty/unknown/NA ayrımının beyanı |
| `dimensions_declared` | JSONB | 13 sözleşme boyutunun (§5.3) beyan durumu; `check-atomic-types` bunu zorlar |
| `version` | Text | Atom sözleşmesinin sürümü; tip-terfi/migrasyon izlenebilirliği |
| `status` | Enum(active, deprecated) | Atom yaşam döngüsü; silme yerine deprecate |

### 5.2 FieldSchema per-tip `params` alanı (öneri — U2 çözümü)

Bugün `FieldSchema` düz enum tipi taşır (parametresiz); netleştirme §5, atomun **parametreli değer tipi** olduğunu sabitler. Aşağıdaki tablo, alan tanımına eklenmesi önerilen per-tip `params` alanının hangi atoma hangi parametreyi taşıdığını verir; parametre, atomu somutlaştıran ve motor türetimini yönlendiren zorunlu meta'dır. `string(50)` ayrı bir tip değil, `string` + `{maxLength:50}` parametresidir — bu, kataloğu tip-patlamasından korur.

| Atom | Tip-parametreleri (`params`) | Amaç (motor bununla ne türetir) |
|---|---|---|
| `string` | maxLength, collation, pattern | varchar(n) + locale-collation sıralama + regex doğrulama |
| `decimal` | precision, scale, rounding | numeric(p,s) + kesin aritmetik (float yasak) |
| `Money` | currency-set, precision, rounding | izinli kur kümesi + minor-units + yuvarlama politikası |
| `Measure` | dimension, unit-system (UCUM) | boyut-guard + birim dönüşümü |
| `Range` | element-type T, bound-closure | T'nin operatörleri (overlap/contains) + uç-açıklık (`[]`,`[)`,`()`) |
| `EnumType` | values, alias-ref, ordering, lifecycle | değer kümesi + i18n alias etiket + deprecate |
| `Identifier` | scheme (GTIN/GLN/SKU), checksum-algo | şema-bağlı format + checksum doğrulama |
| `EntityRef`/`PartyRef`/`AssetRef` | target-kind, onDelete, scope | FK + silme politikası + PDP-scope |

### 5.3 13 sözleşme boyutu (her atom beyan eder)

Aşağıdaki tablo, her atomik tipin `check-atomic-types` kapısından geçmek için beyan etmesi gereken 13 sözleşme boyutunu tanımlar; beyansız bir boyut yeşil geçmez (§12). Bu boyutlar netleştirme §11 ve katalog §6/§8'in cross-cutting özelliklerini birleştirir.

| # | Boyut | Ne beyan eder | Örnek atomlarda |
|---|---|---|---|
| 1 | **storage-mapping** | PostgreSQL kolon tipi + fiziksel temsil | Money→numeric+currency; uuid→uuid; Range→range/jsonb |
| 2 | **validation** | Bütün-değer doğrulama kuralı + standart referansı | Email→RFC 5322; IBAN→ISO 13616 checksum |
| 3 | **parameterization** | Taşıdığı zorunlu tip-parametreleri (§5.2) | Money→currency-set; Range→element-type T |
| 4 | **canonicalization/collation** | Normalize + locale-sıralama davranışı | string→NFC+collation; Email→lowercase canonical |
| 5 | **compare/order** | Sıralama semantiği (bütün-değer) | decimal→sayısal; string→locale (Türkçe İ/ı) |
| 6 | **equality/fuzzy** | Eşitlik + bulanık eşleşme (dedup) | Money→değer+kur; Identifier→canonical eşleşme |
| 7 | **indexability** | Tip-farkında index stratejisi | string→btree/trgm; GeoPoint→gist; Money→minor-units |
| 8 | **i18n** | Çevrilebilirlik / locale-format | I18nText→locale→değer; EnumType→alias i18n |
| 9 | **null/empty/unknown/NA** | Dört-durum ayrımı | Money→empty≠zero; boolean→3-durum (null=bilinmiyor) |
| 10 | **serialization** | Kanonik serileştirme (API/OpenAPI) | Money→{amount,currency}; Range→{lower,upper,bounds} |
| 11 | **surface-projection** | Türetilen form-widget | Money→para-input; Range→aralık-widget; EnumType→select |
| 12 | **security-class** | PII/PHI/PCI sınıfı + maske/şifre | NationalId→PII-yüksek; IBAN→PII-orta; Email→PII-düşük |
| 13 | **versioning** | Tip-terfi/precision-değişimi sözleşmesi | string→enum terfi; Money precision değişimi |

### 5.4 Önerilen iki kanonik düzeltme (AI önerir, insan onaylar)

Aşağıdaki iki düzeltme kanonik şemayı (`archetype.ts:77` `FieldTypeSchema`) etkiler; bu belge onları **yalnız önerir** — AI doğrudan değiştiremez, tip-migrasyon insan onayı + Migration Policy gerektirir (§10). (1) **`currency → Money`:** bugünkü düz `currency` yalnız kur kodunu tutar; değer+kur+precision+rounding dörtlüsünü taşımaz. Öneri: `currency` atomunu `Money⟨currency-set,precision,rounding⟩` ile değiştirmek — float yasağı, kur-karışımı reddi, empty≠zero ancak bununla sağlanır. (2) **`FieldSchema.params` alanı:** bugün alan tanımı parametresizdir (düz enum); öneri, §5.2'deki per-tip `params` alanını eklemek. Her iki öneri de ADR-AT1 kararına ve tip-migrasyon onayına bağlıdır.

## 6. WBS / kernel yerleşimi

`atomic-types`, kernel/layer0 kümesine (`k-*` kardeşi) `module`-seviyesi bir düğüm olarak eklenir; `k-schema`, `k-tenancy` ile aynı `app-layer0` altındadır. Atom katmanı her ArcheType/Fragment alanının **taban**ıdır; bu haliyle kilitlenmeden hiçbir enterprise archetype sağlam kurulamaz (katalog §9 ana tezi). Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `atomic-types` düğümünün WBS yerleşimini ve bağımlılığını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `atomic-types` | module | `k-schema` | kernel/layer0 |

`dependsOn` gerekçesi: atomik tip sistemi şema-motorunun (`k-schema` — `FieldTypeSchema`/`FieldSchema` tanımı ve doğrulaması) üstüne kurulur; atom bir `FieldType` kaydıdır, dolayısıyla şema katmanı hazır olmadan atom tanımlanamaz. `related` ile (karar üretmeden) `fragments` (Fragment kademesi — atomu tüketir), `k-mdm`/`reference-data` (registry bağımlılıkları §7), `archetype-uretim-spec` (ArcheType alanları atoma `dependsOn` verir) düğümlerine bağlanır. Atom düğümü altında asıl kod-teslimatı olan en az bir `archetype` düğümü (TypeDecorator kütüphanesi) durur.

Aşağıdaki tablo, netleştirme §12 ve katalog §9'a göre en yüksek-kaldıraç atomların inşa sırasını verir; sıra kritik yolu izler — taban skalerler önce, çünkü semantik değerler onlara dayanır.

| Sıra | Atom(lar) | Katman | Neden önce |
|---|---|---|---|
| 1 | `decimal`, `uuid`, `timestamptz`, `duration` | A | Taban açığı; Money/Measure/temporal bunlara dayanır; `decimal` en tehlikeli boşluk (float-para riski) |
| 2 | `EnumType`, `Money`, `Measure`, `I18nText`, `Range<T>`, `Percentage` | B | Kurumsal doğruluk + global; en çok kaldıraç (`EnumType` tümü, `Money` muhasebe/CLM/e-ticaret) |
| 3 | `TaxId`, `IBAN`, `NationalId`, `Identifier` | B | Kimlik tipleri + registry bağı §7 + PII sınıfı |
| 4 | `EntityRef`, `AssetRef`, `PartyRef`, `ClauseRef`, `ExternalId` | C | Grafik; CLM agreement-graph ve migration açar |

## 7. Backend gereksinimleri (SQLAlchemy 2.0 TypeDecorator + versiyonlu registry)

Aşağıdaki gereksinimler her atomu tipli hale getirir; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Backend yığını: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL.

- **Per-atom TypeDecorator:** Her semantik/referans atom (Money, Measure, `Range<T>`, EnumType, Identifier, PartyRef…) bir SQLAlchemy 2.0 `TypeDecorator` ile tanımlanır; `bind`/`result` dönüşümü atomu kanonik DB temsiline eşler (Money→`numeric`+`currency` ya da kompozit; Range→PostgreSQL `range` tipleri/`jsonb`; uuid→`uuid`, string'e sıkıştırma yasak). Serbest `number`/`string`/`json` ile para/ölçü/süre/kimlik temsili **yasak**.
- **`decimal` tabanı:** Katman B'nin (Money/Measure/Percentage) tabanı `numeric(precision, scale)`'dir; **float YASAK** (`§3.6`). Kesin aritmetik zorunlu; `0.1 + 0.2` finansal alanda `0.30` (float değil) döner.
- **Versiyonlu registry bağımlılıkları:** Doğrulama/dönüşüm için dış standart registry'lere bağlı atomlar, registry'ye **sürüm-kilitli** bağlanır (registry verisinin kendisi `k-mdm`/`reference-data` primitifidir, §3). Aşağıdaki tablo bağımlılığı verir.

Bu tablo hangi versiyonlu registry'nin hangi atomu beslediğini ve standart referansını verir; registry sürümlenir (ör. UCUM/CLDR güncellenir), atom doğrulaması sürüme bağlanır ki "geçmişte geçerli, bugün geçersiz" izlenebilsin.

| Registry | Standart (referans) | Beslediği atom |
|---|---|---|
| Para birimleri | ISO-4217 (+ minor-units) | `Money` |
| Ölçü birimleri | UCUM | `Measure` |
| Ülke/bölge | ISO-3166 | `TaxId`, `NationalId` (jurisdiction) |
| Dil etiketleri | BCP-47 (+ CLDR biçim) | `I18nText`, tüm locale-format |
| Zaman dilimi | IANA tz database | `timestamptz`, `time` |
| Telefon | E.164 / libphonenumber | `Phone` |
| Ürün kodu | GS1 (GTIN/GLN) | `Identifier` |

- **Bütün-değer doğrulama:** Doğrulama atomun bütününde çalışır (Money→kur+değer; Measure→boyut+birim; IBAN→checksum+ülke prefix); kur-karışımı/boyut-uyuşmazlığı **tanım anında** reddedilir (`CurrencyMismatchError`/`DimensionMismatchError`).
- **Alembic migration + tip-terfi:** Atom sürüm değişimi (string→enum, Money precision) bir tip-migrasyonudur; expand-contract + dolu downgrade zorunlu (`alembic downgrade -1` veri kaybetmez). Tip-migrasyon Migration Policy'ye tabidir (§10).
- **Hata formatı + logger:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; atomun `surface-projection` boyutu (§5.3, boyut 11) her atom için bir form-widget türetir. Ürün CSS = SCSS + token; ikon Phosphor (`ph-*`). Next.js/Redux/antd/MUI/Chakra/Mantine/Flowbite/react-markdown **yasak**.

- **Atom-türetimli widget:** Her atom kanonik bir form-widget'a projekte edilir (Money→para+kur girişi, `Range<T>`→aralık girişi açık/kapalı uç seçimiyle, EnumType→alias-etiketli select, I18nText→per-locale metin, date/time/timestamptz→tarih/saat seçici). Widget atomun `params`'ından türer; hardcoded tip-varsayımı **yasak** (her şey runtime FieldType tanımından).
- **Doğrulama paritesi:** İstemci doğrulaması RHF + Zod ile atomun `validation` boyutunu **yansıtır** (backend'in tek doğruluk kaynağı olması korunur; istemci yalnız erken geri-bildirim). Money kur-karışımı, Measure boyut-uyuşmazlığı, Range uç-tersliği istemcide de erken uyarılır.
- **i18n + collation duyarlı sunum:** EnumType etiketleri alias'tan dile göre gelir; I18nText fallback zinciriyle çözülür; string sıralama/filtre locale-collation'a saygı gösterir (Türkçe İ/ı). Ham string gömülmez; tüm etiket/hata `I18nText` üzerinden.
- **Güvenlik-sınıfı sunum:** `security-class` PII/PHI/PCI atomlar (NationalId, IBAN) sunumda maskeli gösterilir; ham değer yalnız PDP-yetkili görünümde.
- **Erişilebilirlik:** WCAG 2.2 AA taban; dokunmatik hedef ≥ 44x44px; kontrast ≥ 4.5:1; her atom-widget'ında etiket + hata bağlaması zorunlu.

## 9. Multi-tenant / RLS

Atomik tip sistemi iki farklı kapsamda yaşar ve tenant sınırını her ikisinde de korur. Aşağıdaki ayrım aktör-açık verilir çünkü atom hem platform-katman kanonik kütüphane hem tenant-verisi taşıyıcısıdır.

- **Katalog kapsamı (platform-katman):** `platform_fieldtypes` kanonik atom kütüphanesidir; **tüm tenant'lar aynı atom tabanını paylaşır** (Money, uuid, `Range<T>` tenant'a özel değildir). Katalog mutasyonu (yeni atom, tip-terfi) çekirdek ekip PR'ıdır (§10, autonomy `none`); tenant atom **ekleyemez/değiştiremez** — yalnız atomu ArcheType/Fragment alanında **tüketir**.
- **Veri kapsamı (tenant-verisi):** Atom-tipli değerleri **taşıyan** her ArcheType/Fragment satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1); RLS bariyeri o satırdadır (`USING (tenant_id = current_setting('app.current_tenant')::uuid)`). Atomun kendisi kimliksizdir (değer semantiği), dolayısıyla `tenant_id` taşımaz; ama atom-değeri barındıran kayıt taşır.
- **Referans-değer tenant sınırı:** Katman C atomları (`EntityRef`/`PartyRef`/`AssetRef`) bir kayda işaret eder; işaret edilen kayıt **aynı tenant'ta** olmalı — cross-tenant referans `TenantViolationError` fırlatır ve audit'lenir. PDP-scope atomun `parameterization`'ında (`scope`) beyan edilir; erişim kararı PDP'nindir, atom yalnız scope'u taşır.
- **Güvenlik-sınıfı + RLS:** `security-class` PII/PHI/PCI atomlar (NationalId, IBAN) satır-düzeyi şifreleme/maskeleme taşır; bu RLS'e ek bir alan-düzeyi bariyerdir (katalog §6, U10 boyutu).

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Atom katmanında kritik nokta şudur: **tip değişimi bir şema değişikliğidir** — `FieldTypeSchema` (`archetype.ts:77`) kanoniktir; AI bir kolonun hangi atom olması gerektiğini **önerir** (draft: "bu kolon `Money` olmalı, `currency` değil"), ama tipi doğrudan **değiştiremez**; migrasyon insan onayı + Migration Policy gerektirir.

Bu tablo `atomic-types` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Kolon-tip *önerme* | `draft` | AI "bu kolon `Money`/`Range<date>`/`EnumType` olmalı" önerir (`FieldTypeSuggestion`); doğrudan uygulayamaz |
| 13 boyut beyan *taslağı* | `draft` | AI eksik boyut beyanını (validation, collation, security-class) önerir; insan onaylar, ham yazamaz |
| Tip migrasyonu (string→enum, `currency→Money`) | onay-zorunlu | Tip değişimi şema değişikliğidir; `approval_ref` (insan) + Migration Policy olmadan `ApprovalRequiredError` |
| Kanonik şema (`FieldTypeSchema`) değişimi | `none` | Atom kataloğu mutasyonu çekirdek ekip PR'ı; AI değiştiremez (`archetype.ts:77` kanonik) |
| Registry sürüm-kilidi değişimi | onay-zorunlu | UCUM/CLDR/ISO sürüm yükseltmesi doğrulamayı etkiler; insan onayı + geriye-uyum testi |
| Security-class düşürme (PII→none) | `none` | Güvenlik sınıfı düşürmek veri sızıntısı riski; AI tek başına yapamaz |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "bitti" diyemez; doğrudan prod'a (kanonik atom kataloğuna) yazamaz — yalnız draft tip-önerisi sunar. Tip-migrasyon her zaman insan-onaylı ve Migration Policy'ye bağlıdır; `currency→Money` gibi çelişki düzeltmeleri (§5.4) yalnız **öneri**dir.

## 11. Bağlama (Fragment / ArcheType / registry / CLM)

**Fragment bağlama:** Fragment (mini-archetype, `fragments-directive`) **atom-tipli alanlardan** oluşur; bir Address Fragment'inin `postal_code` alanı bir `string` atomu, `country` alanı bir `EnumType`/ISO-3166 atomudur. Atom Fragment'in yapı-taşıdır; Fragment atomu tüketir, atom Fragment'i bilmez. Sınır: atom bölünemez tek değer, Fragment bağımsız-anlamlı çok-alanlı kayıt (netleştirme §2, test 2).

**ArcheType bağlama:** Her ArcheType alanı bir atomik tipe `dependsOn` verir; motor alandan atomu okuyup 13 boyutu türetir. `archetype-agreement` (CLM) `PartyRef`/`ClauseRef`/`Term`/`Range<date>`/`Money`/`Percentage`'a; `k-obligation` `Duration`/`Recurrence`/`Range<date>`'e; PIM `Measure`/`Identifier`'a bağlanır. ArcheType atomu tüketir, kendi tip mantığını uydurmaz.

**Registry bağlama:** Bazı atomlar (§7) versiyonlu registry'ye bağlanır; registry verisi ayrı bir referans-data primitifidir (`k-mdm`/`reference-data`). Atom yalnız registry'ye **sürüm-kilitli** referans verir; registry tablosunu içermez (§3).

**`k-storage` bağlama:** `AssetRef` atomu (Katman C) `k-storage`'ın `digital_asset.id`'sine referans verir; binary'nin kendisi `k-storage`'ın işidir, atom yalnız referans + checksum çözümünü taşır (gömülü URL değil).

**CLM karşılığı:** U1 sonrası CLM'de kademeler net ayrışır — Party/Contract **ArcheType**; Address/PersonName/ContactPoint **Fragment**; `Money`/`Range<T>`/`PartyRef`/`EnumType`/`Term` **Atom**. Bu yönerge yalnız son grubu (Atom) tanımlar; ilk ikisi ilgili yönergelerin işidir.

## 12. Test stratejisi

Aşağıdaki testler netleştirme §11 checklist'ini ve katalog §8 test-vektörünü karşılar; hepsi test-önce (önce kırmızı) yazılır. Yeni bir CI kapısı önerilir: **`check-atomic-types`** — her `FieldType`'ın 13 sözleşme boyutunu (§5.3) beyan ettiğini ve registry bağımlılığını sürüm-kilitli çözdüğünü zorlar; beyansız tip yeşil geçemez.

Bu tablo atomik tip sistemi için zorunlu test senaryolarını, beklentiyi ve türünü tanımlar; senaryolar kenar-durum dahildir (kod değil, senaryo).

| # | Atom | Senaryo (kenar dahil) | Beklenen | Test türü |
|---|---|---|---|---|
| 1 | `Money` | 10.00 USD + 10.00 TRY toplanır | Tanım-anında `CurrencyMismatchError` | Birim |
| 2 | `Money` | empty (bilinmiyor) vs 0 (bedelsiz) ayrımı | İkisi farklı; boş≠sıfır | Birim |
| 3 | `Measure` | `kg`+`lb` / `uzunluk`+`kütle` | İlki dönüşür, ikinci `DimensionMismatchError` | Birim |
| 4 | `decimal` | 0.1 + 0.2 finansal alanda | 0.30 (float değil; kesin) | Birim |
| 5 | `I18nText` | `tr` yok, jurisdiction fallback | Fallback zinciriyle çözülür, hata yok | Birim |
| 6 | `string` | Türkçe İ/ı sıralama (collation) | Locale-collation ile doğru sıra | Birim |
| 7 | `Range<T>` | Çakışan/bitişik iki aralık (overlap) | Çakışma sorgusu doğru; açık/kapalı uç saygılı | Birim |
| 8 | `Recurrence` | RRULE yıllık yenileme | Doğru sonraki tarih üretilir | Birim |
| 9 | `NationalId` | PII maskeleme + geçersiz checksum | Maskeli sunum; geçersiz checksum reddi | Birim |
| 10 | `AssetRef` | Binary DB'ye yazılmaz | Yalnız `digital_asset.id`+checksum referansı | Birim |
| 11 | (tümü) | 13 boyut beyanı eksik bir FieldType | `check-atomic-types` kırmızı (yeşil geçemez) | Contract (CI) |
| 12 | (registry) | Sürüm-kilidi olmayan Money/Measure | Registry-sürüm beyanı zorunlu; reddedilir | Contract (CI) |
| 13 | `Money` | Tip-migrasyon `currency→Money` downgrade | `alembic downgrade -1` veri kaybetmez | CI |

## 13. Acceptance criteria

- Her semantik/referans atom bir SQLAlchemy 2.0 `TypeDecorator` ile tipli; para `float`/düz `currency`, ölçü serbest `number`, süre/kimlik `string` ile temsil edilmiyor.
- `decimal` tabanı `numeric(p,s)`; `0.1 + 0.2` finansal alanda kesin (`0.30`) döner; float hiçbir para/ölçü alanında yok.
- İki farklı kurdaki `Money` tanım-anında `CurrencyMismatchError`; farklı boyutta `Measure` `DimensionMismatchError` fırlatıyor; `Money` empty≠zero ayrımı korunuyor.
- `Range<T>` tek parametreli atom (`Range<date>`/`Range<Money>`/`Range<Measure>`) overlap/contains/adjacent operatörlerini uç-açıklığına saygılı çözüyor.
- Her `FieldType` 13 sözleşme boyutunu (§5.3) beyan ediyor; `check-atomic-types` beyansız tipe kırmızı veriyor.
- Registry-bağımlı atomlar (Money/Measure/I18nText/Phone/Identifier) sürüm-kilitli registry'ye bağlı; sürüm beyanı olmayan atom yeşil geçmiyor.
- I18nText fallback zinciriyle çözülüyor; EnumType etiketi alias'tan dile göre geliyor; string sıralama locale-collation'a (Türkçe İ/ı) saygılı.
- `security-class` PII/PHI/PCI atomlar (NationalId, IBAN) maskeli sunuluyor; ham değer yalnız PDP-yetkili görünümde.
- AI tipi yalnız `draft` öneriyor; tip-migrasyon (`currency→Money`, string→enum) `approval_ref` + Migration Policy olmadan reddediliyor; AI kanonik `FieldTypeSchema`'yı değiştiremiyor.
- Alembic tip-migrasyon downgrade CI'da veri kaybetmeden geçiyor; `check-atomic-types` yeşil.

## 14. Anti-patterns

- **Float ile para:** Parayı/ölçüyü `float` ya da düz `number` ile tutmak — YASAK; `decimal(p,s)` tabanı + `Money`/`Measure` atomu (`§3.6`).
- **Düz `currency`:** Parayı tek kur koduyla (`currency`) temsil edip değer+precision+rounding'i düşürmek — YASAK; `Money⟨currency,precision,rounding⟩` (§5.4 düzeltme önerisi).
- **Kur-karışımı toplamı:** İki farklı kurdaki `Money`'yi toplamak — YASAK; tanım-anında `CurrencyMismatchError`.
- **String'e sıkıştırma:** `uuid`/`decimal`/`duration`/`Identifier`'ı `string`/`json`'a sıkıştırmak — YASAK; her biri kendi tipli atomu.
- **Tip-patlaması:** Her uzunluk için ayrı tip (`string50`, `string100`) — YASAK; `string` + `{maxLength}` parametresi (§5.2).
- **Çok-alanlı yapıyı atoma zorlama:** Address/PersonName'i atom yapmak — YASAK; onlar Fragment (netleştirme test 2; bu yönergenin kapsamı dışı, §3).
- **Tekil değeri gereksiz tabloya bölme:** `full_name`/`total_value` gibi tek değeri ayrı tabloya normalize etmek — YASAK; onlar atom.
- **13 boyut beyanını atlama:** Boyut beyan etmeden `FieldType` eklemek — YASAK; `check-atomic-types` reddeder.
- **Registry sürüm-kilidi atlama:** Money/Measure'ı sürümsüz registry'ye bağlamak — YASAK; sürüm-kilitli referans zorunlu.
- **AI'ın doğrudan tip değişimi:** AI'ın `FieldTypeSchema`'yı değiştirmesi ya da onaysız tip-migrasyon çalıştırması — YASAK; `ApprovalRequiredError` + Migration Policy.
- **Standart kopyalama:** RFC/ISO/UCUM metnini belgeye/koda gömmek — YASAK; referans ver.
- **Opak `json` kaçışı:** Yapısal değeri `json`'a atıp motoru kör etmek — YASAK; tipli atom (ya da Fragment) tercih.

## 15. Definition of Done

- §12'deki 13 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- En yüksek-kaldıraç atomlar (§6 sıra: `decimal`/`uuid`/`timestamptz`/`duration` → `EnumType`/`Money`/`Measure`/`I18nText`/`Range<T>`/`Percentage`) TypeDecorator ile tipli ve kilitli.
- Her `FieldType` 13 sözleşme boyutunu beyan ediyor; `check-atomic-types` CI kapısı yeşil; beyansız/sürümsüz tip kırmızı.
- `core-contract-pack` float-yasağı + atom sözleşmesi uyumu sağlandı; Alembic tip-migrasyon downgrade CI'da çalışıyor.
- ADR-AT1 "Kilitli" statüsünde (insan onayı); `atomic-types` düğümü ve altındaki `archetype` (TypeDecorator kütüphanesi) düğümü WBS'te doğru `dependsOn` (`k-schema`) ile mevcut.
- `currency→Money` ve `FieldSchema.params` şema-terfi önerileri (§5.4) insan onayına **sunuldu** (AI uygulamadı); Migration Policy tanımlı.
- AI-guardrail testi: AI'ın kanonik `FieldTypeSchema` değişimi ve onaysız tip-migrasyonu reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok, standart referansla).

## 16. CLM + PIM karşılığı

Aşağıdaki tablo, bu sözleşmenin CLM (Contract Lifecycle Management) ve PIM (Product Information Management) gereksinimlerini atomik tip öğelerine nasıl eşlediğini gösterir; her satır bir kurumsal ihtiyacı atom tabanına bağlar. Bu, netleştirme §9 CLM yeniden-eşlemesi ve katalog §9 archetype bağının atom-katmanı karşılığıdır.

| CLM/PIM ihtiyacı | Atomik tip karşılığı |
|---|---|
| `Agreement.total_value` (sözleşme bedeli) | **Atom** `Money⟨currency,precision,rounding⟩` (§5.2); float yasak, kur-karışımı reddi |
| `Agreement.effective_range` (geçerlilik penceresi) | **Atom** `Range<date>` (§5.2); overlap/contains + açık/kapalı uç |
| `Agreement.payment_range` (ödeme aralığı) | **Atom** `Range<Money>`; aynı kur kısıtı |
| `Agreement.term` (vade "2 yıl") | **Atom** `Term` (duration üstü semantik); yenileme hesabı |
| `Agreement.renewal` (yıllık yenileme) | **Atom** `Recurrence` (RRULE, RFC 5545 referans) |
| `Agreement.parties[]` / `clauses[]` | **Atom** `PartyRef` / `ClauseRef` (Katman C referans-değer) |
| `Agreement.discount` (iskonto/ceza) | **Atom** `Percentage` (0-1 vs 0-100 belirsizliği çözülür) |
| Party `tax_id` / `national_id` | **Atom** `TaxId` / `NationalId` (jurisdiction + checksum + PII-sınıf) |
| Sözleşme durumu (`DRAFT`/`SIGNED`) | **Atom** `EnumType` (alias i18n + lifecycle; §5.2) |
| PIM ürün ölçüsü (ağırlık/boyut) | **Atom** `Measure⟨dimension,unit⟩` (UCUM; boyut-güvenli çarpım) |
| PIM ürün kodu (GTIN/SKU) | **Atom** `Identifier⟨scheme,checksum⟩` (GS1; dedup anahtarı) |
| PIM çok-dilli ürün adı/açıklama | **Atom** `I18nText` (locale→değer; fallback zinciri) |
| PIM/CLM ürün/madde görseli | **Atom** `AssetRef` (`k-storage` `digital_asset.id` referansı) |
| Party `address` / `name` / `contacts[]` | **Fragment** (atom değil — bu yönerge dışı, `fragments-directive`; §3, §11) |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| AT-01 | Atom = parametreli bütün-değer tipi; 3-kademe Atom kademesi tanımlı | Data/Contract | P0 | Contract | Atom tanımı 5-test ve 13 boyutla tutarlı | kernel-team |
| AT-02 | `decimal` tabanı `numeric(p,s)`; float YASAK | Backend/Data | P0 | Unit | `0.1+0.2` kesin; para/ölçü float içermez | kernel-team |
| AT-03 | `Money⟨currency,precision,rounding⟩` atomu (per-atom TypeDecorator) | Backend/Data | P0 | Unit | Kur-karışımı reddi; empty≠zero | kernel-team |
| AT-04 | `Measure⟨dimension,unit⟩` boyut-güvenli (UCUM) | Backend/Data | P1 | Unit | `kg+lb` dönüşür; boyut-uyuşmazlığı hata | kernel-team |
| AT-05 | `Range<T>` jenerik atom (date/Money/Measure) + bound-closure | Backend/Data | P1 | Unit | overlap/contains/adjacent açık-kapalı uç saygılı | kernel-team |
| AT-06 | `EnumType` alias + i18n + ordering + lifecycle | Backend/Data | P1 | Unit | Etiket alias'tan dile göre; deprecate | kernel-team |
| AT-07 | `I18nText` locale→değer + fallback zinciri | Backend/Data | P1 | Unit | Yeni locale şema değiştirmez; fallback çözer | kernel-team |
| AT-08 | Kimlik atomları (`TaxId`/`IBAN`/`NationalId`/`Identifier`) checksum + jurisdiction | Backend/Data | P1 | Unit | Geçersiz checksum reddi; jurisdiction format | kernel-team |
| AT-09 | Katman C referans-değer (`EntityRef`/`AssetRef`/`PartyRef`/`ClauseRef`/`ExternalId`) | Backend/Data | P1 | Unit | FK + onDelete + PDP-scope; cross-tenant reddi | kernel-team |
| AT-10 | `FieldSchema.params` per-tip parametre (öneri; tip-patlaması önler) | Data/Contract | P1 | Contract | `string(50)` = `string`+`{maxLength}`; öneri sunuldu | kernel-team |
| AT-11 | Her `FieldType` 13 sözleşme boyutu beyanı | Data/Contract | P0 | Contract | Beyansız tip `check-atomic-types` kırmızı | kernel-team |
| AT-12 | `check-atomic-types` CI kapısı (13 boyut + registry sürüm) | DevOps/CI | P0 | CI | Beyansız/sürümsüz tip yeşil geçmez | kernel-team |
| AT-13 | Versiyonlu registry bağımlılığı (ISO-4217/UCUM/ISO-3166/BCP-47/IANA-tz/E.164/GS1) | Backend/Data | P1 | Contract | Atom sürüm-kilitli registry'ye bağlı | kernel-team |
| AT-14 | `security-class` PII/PHI/PCI alan-düzeyi maske/şifre | Security | P0 | Unit | NationalId/IBAN maskeli; PDP-yetkili ham | security-team |
| AT-15 | Tenant sınırı: katalog paylaşımlı, veri tenant-scoped, referans same-tenant | Security | P0 | Integration(neg) | Cross-tenant referans reddedilir + audit | security-team |
| AT-16 | Alembic tip-migrasyon (string→enum, `currency→Money`) + downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| AT-17 | AI tip yalnız `draft` önerir; migrasyon onay-zorunlu + Migration Policy | AI-Governance | P0 | Integration | Onaysız tip-migrasyon `ApprovalRequiredError` | governance |
| AT-18 | AI kanonik `FieldTypeSchema` (`archetype.ts:77`) değiştiremez (autonomy none) | AI-Governance | P0 | Unit | AI atom kataloğu mutasyonu yapamaz | governance |
| AT-19 | Frontend atom-türetimli widget config-driven (RHF/Zod parite) | Frontend | P1 | E2E | Widget FieldType'tan türer; hardcoded tip yok | ui-team |
| AT-20 | Frontend i18n + collation duyarlı sunum (Phosphor ikon, SCSS token) | Frontend/A11y | P2 | A11y(axe) | axe critical=0; İ/ı sıralama; alias etiket | ui-team |
| AT-21 | `atomic-types` WBS düğümü doğru dependsOn (`k-schema`) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
| AT-22 | `currency→Money` çelişki düzeltmesi öneri olarak sunuldu (AI uygulamadı) | Data/Governance | P1 | Contract | Öneri insan onayına düştü; kanonik değişmedi | kernel-team |
