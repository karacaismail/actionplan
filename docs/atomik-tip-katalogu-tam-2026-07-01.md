# Tam Atomik Tip Katalogu — 4 Katman × Per-Tip Gereksinim Analizi

**Tarih:** 2026-07-01
**Durum:** AI-DRAFT (insan onayı bekler). Analiz + gereksinim kataloğu; **kod ve kanonik şema yazmaz** — atomik tip katmanının tam envanterini ve per-tip sözleşme ihtiyacını tanımlar.
**Kapsam:** `docs/atomik-primitif-katman-gap-2026-07-01.md` raporunun tamamlayıcısı. O rapor "haklı mısın?" sorusunu ve dört-katman modelini kanıtladı; bu belge dört katmanı **tip tip** açar (~42 tip) ve her tipin ArcheType engine'e vermesi gereken sözleşmeyi listeler.
**Kaynak:** `src/schemas/archetype.ts` (`FieldTypeSchema`, `FieldSchema`), `core-contract-pack.md §3.6/§3.15`, `archetype-uretim-spec.md §12.B/§12.C/§12.E`.

---

## 0. Bu belge nedir / ne yapar / ne yapmaz

**Nedir:** ArcheType engine'i besleyen atomik primitiflerin tam kataloğu ve her birinin gereksinim analizi.

**Ne yapar:** Dört katmanı (A taban skaler, B semantik değer, C referans-değer, D value-object) tip tip enumere eder; her tip için taşıdığı parametreyi, motorun ondan türetmesi gereken kritik davranışı, bugünkü durumunu (VAR/KISMİ/EKSİK) ve onu en çok isteyen app'i verir; sonra cross-cutting özellikleri, registry bağımlılıklarını, test-vektörü taslağını ve inşa sırasını tanımlar.

**Ne yapmaz:** TypeDecorator kodu yazmaz; `FieldTypeSchema`'yı (kanonik) değiştirmez — yalnız değişiklik gereksinimini gösterir. Yeni app/module düğümü üretmez. Standardı kopyalamaz; bağlar.

## 0.1 Okuma kuralı

Durum sütunu üç değer alır: **VAR** (`FieldTypeSchema`'da birinci-sınıf), **KISMİ** (sözleşmede vaat ama şemada yok, ya da `string`/`json`'a sıkışık), **EKSİK** (hiçbir yerde tipli değil). "Motor türetimi" sütunu, metadata-driven engine'in o tipten deterministik üretebilmesi için tipin beyan etmesi gereken **en kritik** davranışları verir (tam 13 boyut gap raporunun §5'indedir). Parametre = tipi somutlaştıran zorunlu alan(lar); parametresiz atom (ör. düz `number`) motor için belirsizdir.

---

## 1. Dört katman — bir cümlelik hatırlatma

- **Katman A — Taban skalerler:** bölünemez, DB kolonuna doğrudan eşlenen ilkeller. Motorun fiziksel temeli.
- **Katman B — Semantik değer tipleri:** Katman A üstüne kurulu, iş anlamı taşıyan kompozit değerler (Money = decimal + kur + yuvarlama). Kurumsal doğruluğun taşıyıcısı.
- **Katman C — Referans-değer tipleri:** değeri başka bir kayda/varlığa işaret eden atomlar. Grafik (agreement/BOM/org) bunlarla kurulur.
- **Katman D — Kompozit değer nesneleri:** çok-alanlı ama tek-anlamlı yapılar (Address). Atom mı / mini-archetype mı sınırı (U1) buradadır.

---

## 2. Katman A — Taban skalerler (13 tip)

Bu katman motorun fiziksel temelidir; her tip bir PostgreSQL kolon tipine eşlenir ve karşılaştırma/sıralama/null davranışını netleştirir. Aşağıdaki tablo her taban skaleri, taşıması gereken parametreyi ve durumunu verir.

| Tip | Parametre | Motor türetimi (kritik) | Durum | İsteyen |
|---|---|---|---|---|
| `string` | maxLength, collation | varchar(n); trim/NFC normalize; locale-collation sıralama; btree/trgm index | KISMİ (parametresiz) | tümü |
| `text` | — (uzunluk yok) | text; full-text (gin/tsvector) index; length-cap yok | VAR | CMS, tümü |
| `decimal` | precision, scale, rounding | numeric(p,s); **float YASAK**; kesin aritmetik; Money/Measure/Percentage tabanı | **EKSİK** (yalnız düz `number`) | muhasebe, finans, MRP |
| `integer` | min, max | int4; aralık kısıtı | VAR | tümü |
| `bigint` | — | int8; sayaç/dizi (sequence) hedefi | KISMİ (`number`) | kernel, tümü |
| `boolean` | nullable? (3-durum) | bool; true/false/**null=bilinmiyor** ayrımı | KISMİ (null-semantiği yok) | tümü |
| `uuid` | version (v4/v7) | uuid; PK/FK kimliği; string'e sıkıştırma yasak | **EKSİK** (string'e sıkışık) | kernel (tüm id/tenant), tümü |
| `timestamptz` | timezone, precision | timestamptz; **tz-aware instant**; UTC saklama + tz sunum | KISMİ (`datetime`, tz beyanı yok) | tümü, takvim, audit |
| `date` | — | date; takvim günü (tz-siz); "doğum günü" gibi | VAR | HRMS, CLM |
| `time` | — | time; günün saati (tz opsiyonel) | EKSİK | takvim, fleet |
| `duration` | unit-base | interval / ISO-8601 duration; "60 gün", "2 yıl"; aritmetik güvenli | **EKSİK** | CLM (vade), MRP, HRMS |
| `bytea-ref` | storage-provider | **binary DB'de değil**; k-storage `digital_asset.id` + checksum referansı | KISMİ (düz `file`) | drive, PIM, CLM |
| `json/jsonb` | schema-ref? | jsonb; **kaçış kapısı** — yapısal değer için Katman D tercih edilir | VAR (ama aşırı-kullanım riski) | esnek meta |

Kritik not (decimal): Katman A'daki en tehlikeli boşluk `decimal`'in olmayışıdır. Şemadaki düz `number` hem tam sayıyı hem ondalığı hem parayı temsil edebilir — bu, `§3.6`'nın "float ile para tutan her app bir gün yuvarlama hatasıyla para kaybeder" uyarısını mümkün kılan tam açıktır. `decimal(precision, scale, rounding)` Katman B'deki Money/Measure/Percentage'ın **taban**ıdır; o olmadan B katmanı sağlam kurulamaz.

---

## 3. Katman B — Semantik değer tipleri (18 tip)

Bu katman kurumsal doğruluğun taşıyıcısıdır: iş anlamını (para, ölçü, kimlik, süre) tipe gömer ki motor onu tek biçimde doğrulasın/biçimlendirsin/karşılaştırsın. Aşağıdaki tablo her semantik tipi, taşıdığı bileşenleri ve durumunu verir; en zor beşi (Money, Measure, I18nText, temporal üçlü, Enum) tablodan sonra derinleştirilir.

| Tip | Taşıdığı | Motor türetimi (kritik) | Durum | İsteyen |
|---|---|---|---|---|
| `Money` | değer(decimal)+kur(ISO-4217)+precision+rounding | float yasağı; kur ayrılamaz; empty≠zero; kur-karışımı tanım-anında reddedilir | KISMİ (düz `currency`) | muhasebe, CLM, e-ticaret, CRM |
| `Measure` | değer+birim(UCUM)+dönüşüm | boyut-güvenli çarpım; `kg+lb` güvenli, `uzunluk+kütle`→hata | KISMİ (sözleşmede, şemada yok) | MRP, PIM, fleet |
| `Percentage` | oran(decimal)+precision+taban(100?) | faiz/ceza/iskonto; yuvarlama; 0-1 vs 0-100 belirsizliği çözülür | EKSİK | CLM, muhasebe, KPI |
| `I18nText` | locale→değer (JSONB) | çevrilebilir; yeni locale şema değiştirmez; fallback zinciri (jurisdiction) | KISMİ (sözleşmede, şemada yok) | global 16 app |
| `Email` | adres+normalize | RFC 5322 doğrulama; lowercase canonical; MDM eşitlik | KISMİ (doğrulama zayıf) | CRM, HRMS, tümü |
| `URL` | şema+host+yol | RFC 3986; şema whitelist (https); SSRF sınırı | EKSİK | CMS, CRM |
| `PhoneNumber` | E.164+ülke | E.164 normalize; ülke kodu; MDM eşitlik | KISMİ (düz `phone`) | CRM, HRMS |
| `PersonName` | given/family/middle/prefix | yapılı ad; sıralama (family-first?); i18n ad-düzeni | EKSİK (`string`) | HRMS, CRM |
| `GeoPoint` | koordinat+SRID (PostGIS) | yakınlık/kapsama sorgusu; SRID zorunlu; gist index | KISMİ (sözleşmede, şemada yok) | fleet, IBYS, e-ticaret |
| `Color` | hex/token | tasarım-token bağı; kontrast a11y | EKSİK | CMS, PIM |
| `TaxId` | değer+jurisdiction | VKN/vergi-no; jurisdiction-bağlı format; checksum | EKSİK | muhasebe, IBYS, CLM |
| `IBAN` | değer | ISO 13616 checksum; ülke prefix; PII-orta | EKSİK | muhasebe, HRMS |
| `NationalId` | değer+jurisdiction | TCKN/SSN; **PII-yüksek** (encrypt/mask); checksum | EKSİK | HRMS, IBYS |
| `Identifier` | değer+şema(GTIN/GLN/SKU) | GS1 checksum; şema-bağlı format; dedup anahtarı | EKSİK | PIM, e-ticaret, MRP |
| `DateRange` | başlangıç+bitiş+uç-açıklık | çakışma/kapsama sorgusu; açık/kapalı uç; effectivity alan-değeri | KISMİ (ilişki §12.C, alan yok) | CLM, MRP, HRMS |
| `Term` | süre+birim (sözleşme vadesi) | "2 yıl"/"60 gün"; yenileme hesabı; duration üstü semantik | EKSİK | CLM, abonelik |
| `Recurrence` | RRULE (RFC 5545) | tekrar üretimi; yenileme/hatırlatma takvimi | EKSİK | CLM, takvim, obligation |
| `EnumType` | değerler+alias+i18n+sıra+lifecycle | teknik-kimlik sabit, etiket alias'ta yerelleşir (§12.E); deprecate | KISMİ (`enumValues` düz dizi) | tümü |

**Money (derin).** Para tek sayı değildir; `değer + kur + kesinlik + yuvarlama` dörtlüsüdür. Motor türetimi: (a) DB'de `numeric` + ayrı `currency` kolonu ya da kompozit tip; (b) iki farklı kurdaki tutarın toplanması **tanım anında** reddedilir; (c) `empty` (bilinmiyor) ile `0` (bedelsiz) ayrı saklanır — muhasebe/CLM'de bu ayrım para hatası kaynağıdır; (d) yuvarlama kuralı (HALF_UP/HALF_EVEN) alanın tanımında sabittir. Şemadaki düz `currency` bunların hiçbirini taşımaz — düzeltme: `currency → Money`.

**Measure (derin).** Ölçü `değer + birim + dönüşüm` taşır (UCUM = birim kodlama standardı). Motor: hesap-hattı (Computation §12.A.4) çarpım/toplamı **boyut-güvenli** yapar; `adet ↔ koli ↔ palet`, `kg ↔ g` dönüşümü tipe bağlıdır, tabloya değil; farklı boyut (uzunluk vs kütle) toplanınca `DimensionMismatchError`. MRP miktar patlatması ve PIM ürün ölçüsü bunsuz güvenli çarpamaz.

**I18nText (derin).** Çok-dilli metin `locale → değer` eşlemesidir (JSONB). Motor: yeni dil eklemek **şema değiştirmez** (append); çözümleme istenen locale yoksa jurisdiction/fallback zincirini izler; hangi alanın çevrilebilir olduğu ArcheType'ta **zorunlu beyan**dır (§12.E) — beyansız ArcheType conformance'tan geçemez. Serbest metin burada, sabit enum etiketleri alias'ta yerelleşir.

**Temporal üçlü (derin: DateRange + Term + Recurrence).** CLM, MRP ve obligation üç ayrı zaman kavramı ister ve bugün yalnız `date/datetime` var: (a) `DateRange` = başlangıç-bitiş penceresi (sözleşme geçerliliği, çakışma sorgusu); (b) `Term` = süre-uzunluğu semantiği ("2 yıl münhasırlık"); (c) `Recurrence` = RRULE ile tekrar (yıllık yenileme, aylık rapor). U8 (temporal ayrım) bu üçlünün çözülmemiş halidir.

**EnumType (derin).** Enum bir "string dizisi" değil, birinci-sınıf atom olmalı: teknik kimlik (`SHIPPED`) koda/veriye yazılır, kullanıcıya gösterilen etiket **alias tablosundan** dile göre gelir (§12.E). Ayrıca sıralama (ordinal), deprecation (değer emekliye ayırma, silme değil) ve i18n etiket taşır. Şemadaki düz `enumValues: string[]` yalnız değer listesini tutar; alias/i18n/lifecycle yok.

---

## 4. Katman C — Referans-değer tipleri (6 tip)

Bu katman grafiği kurar: değeri "başka bir kayda işaret eden" alanlar. `relation` (entity ilişkisi) ile karıştırılmamalı — buradaki tipler bir **alan-değeridir** (kolonda bir pointer), ilişki-şeması değil. U3 (referans-değer vs relation ayrımı) tam da bu katmanın netleştirilmesidir.

| Tip | İşaret ettiği | Motor türetimi (kritik) | Durum | İsteyen |
|---|---|---|---|---|
| `EntityRef` | hedef archetype kaydı | FK; onDelete politikası; PDP-gated okuma | VAR (`relation`) | tümü |
| `AssetRef` | `digital_asset.id` (k-storage) | binary değil referans; checksum; rendition çözümü; pre-signed URL | KISMİ (düz `file`) | drive, PIM, CLM, CMS |
| `PartyRef` | `k-party` (aktör/taraf) | tipli taraf referansı (müşteri/tedarikçi/çalışan); rol bağlamı | EKSİK | CLM, CRM, muhasebe |
| `ClauseRef` | clause-library maddesi | sözleşme maddesine referans; sürüm; standart/alternatif | EKSİK | CLM |
| `EnumAliasRef` | enum alias tablosu | dile-özel etiket çözümü (§12.E) | EKSİK | tümü |
| `ExternalId` | dış sistem kimliği | migration/i14y kimlik eşleme; idempotent import anahtarı | EKSİK | entegrasyon, migration |

Not: `AssetRef`, `PartyRef`, `ClauseRef` üçü de bugün ya `relation` ya `string`/`json`'a sıkışıyor. CLM'in agreement-graph'ı (Contract → Party/Clause/Signature/Evidence) doğrudan bu üç tipe dayanır; tipli olmadıkları için her CLM archetype'ı referansı kendi içinde ad-hoc çözmek zorunda kalır.

---

## 5. Katman D — Kompozit değer nesneleri (4 tip) + sınır kararı (U1)

Bu katman çok-alanlı ama tek-anlamlı yapıları içerir. En kritik unknown-unknown (U1) burada yaşar: bir `Address` **atom mu** (tek kolon/JSONB, motor bir bileşik-widget türetir), **mini-archetype mi** (ayrı tablo, kendi alanları), yoksa opak **`json`** mu (motor hiçbir şey türetemez)? Bu karar verilmeden aynı yapı üç app'te üç farklı biçimde modellenir ve çelişir.

| Tip | Bileşenleri | Karar sorusu | Durum | İsteyen |
|---|---|---|---|---|
| `Address` | sokak/şehir/posta/bölge/ülke(ISO-3166) | atom mı, mini-archetype mı? posta-kod doğrulama ülkeye bağlı | EKSİK (`json`) | HRMS, CRM, CMS, fleet, CLM |
| `ContactPoint` | tip(email/phone/…)+değer+öncelik | çok-kanal iletişim; her kanal kendi Katman B tipini taşır | EKSİK (`json`) | CRM, HRMS |
| `MonetaryRange` | min(Money)+max(Money)+uç | bütçe/fiyat-aralığı; aynı kur kısıtı | EKSİK | CLM, CRM, e-ticaret |
| `QuantityRange` | min(Measure)+max(Measure) | min-sipariş/kapasite aralığı; boyut-güvenli | EKSİK | MRP, e-ticaret |

**U1 karar önerisi (güvenli/enterprise):** Katman D tipleri **parametreli value-object atom** olarak modellenmeli — tek JSONB kolonunda saklanır ama motor için **tipli** (bileşen alanları, per-bileşen doğrulama, bileşik-widget türetimi). Opak `json` yasak (motor türetemez); ayrı mini-archetype ise aşırı ağır (her adres bir tablo değildir). Bu, U1'i kapatır ve U2 (parametreli tip meta-modeli) ile birlikte çözülür. *Riskli olan*, bu kararı ertelemek — her app kendi Address'ini uydurdukça sonradan birleştirme pahalı olur.

---

## 6. Cross-cutting atom özellikleri (tek tipe değil, tümüne dokunur)

Bazı davranışlar tek bir atoma değil, birçok atoma birden dokunur; bunlar tip-tip tekrar edilmek yerine **cross-cutting özellik** olarak tanımlanmalıdır. Aşağıdaki tablo bu özellikleri ve etkilediği tipleri verir.

| Özellik | Ne yapar | Etkilediği tipler | Bugün |
|---|---|---|---|
| **precision/rounding** | kesinlik + yuvarlama politikası | Money, Measure, Percentage, Duration | yalnız Money'de (dağınık) |
| **null/empty/unknown/N-A** | dört-durum ayrımı | tüm tipler (özellikle Money, boolean) | yalnız `required` boolean |
| **PII/PHI/PCI sınıfı** | alan-düzeyi şifreleme/maskeleme | NationalId, IBAN, Email, Address, PersonName | yalnız `pii` boolean |
| **canonicalization/collation** | normalize + locale-sıralama | string, Email, PersonName, Address | yok |
| **equality/fuzzy-match** | dedup eşitlik + bulanık eşleşme | PersonName, Address, Email, Identifier | yok (k-mdm ister) |
| **versioning/type-change** | tip terfisi sözleşmesi | tüm tipler (string→enum, Money precision) | yalnız `protected` bayrağı |

Bu tablo, gap raporunun U9/U10/U11 unknown-unknowns'unu somutlaştırır: bu altı özellik atom sözleşmesinin **ortak başlığı** olmalı, yoksa her tip onu kendi içinde eksik/tutarsız uydurur.

---

## 7. Registry bağımlılıkları — atomun veri bağımlılığı (U5)

Bazı semantik tipler, doğrulama/dönüşüm için **dış standart kayıt tablolarına** dayanır. Bunlar tipin "veri bağımlılığıdır" ve ayrı primitif olarak yönetilmeli (kernel `k-mdm`/`reference-data` adayı). Aşağıdaki tablo hangi registry'nin hangi tipi beslediğini verir.

| Registry | Standart | Beslediği tip |
|---|---|---|
| Para birimleri | ISO-4217 (+ minor-units) | Money |
| Ölçü birimleri | UCUM | Measure |
| Ülke/bölge | ISO-3166 | Address, TaxId, NationalId |
| Dil etiketleri | BCP-47 (+ CLDR biçim) | I18nText, tüm locale-format |
| Zaman dilimi | IANA tz database | timestamptz, time |
| Telefon | E.164 / libphonenumber | PhoneNumber |
| Ürün kodu | GS1 (GTIN/GLN) | Identifier |

Karar: bu registry'ler **versiyonlanır** (ör. UCUM/CLDR güncellenir); atomun doğrulaması registry sürümüne bağlanmalı ki "geçmişte geçerli, bugün geçersiz" durumu izlenebilsin. Bu, U5'in çözümüdür.

---

## 8. Test-vektörü taslağı (test-önce disiplini)

Senin yazılım kuralın "önce test, sonra şema, sonra geliştirme" der. Atom katmanı yazılmadan önce her kritik atom için **kırmızı** test-vektörü tanımlanmalı; aşağıdaki tablo en yüksek-değerli senaryoları verir (kod değil, senaryo).

| Atom | Test senaryosu (kenar dahil) | Beklenen |
|---|---|---|
| `Money` | 10.00 USD + 10.00 TRY toplanır | tanım-anında `CurrencyMismatchError` |
| `Money` | empty vs 0 ayrımı | ikisi farklı; toplama boş≠sıfır |
| `Measure` | `kg` + `lb` / `uzunluk` + `kütle` | ilki dönüşür, ikincisi `DimensionMismatchError` |
| `decimal` | 0.1 + 0.2 finansal alanda | 0.30 (float değil; kesin) |
| `I18nText` | `tr` yok, jurisdiction fallback | fallback zinciriyle çözülür, hata yok |
| `string` | Türkçe `İ/ı` sıralama | locale-collation ile doğru sıra |
| `DateRange` | çakışan iki pencere | çakışma sorgusu doğru; açık/kapalı uç |
| `Recurrence` | RRULE yıllık yenileme | doğru sonraki tarih üretilir |
| `NationalId` | PII maskeleme + checksum | maskeli sunum; geçersiz checksum reddi |
| `AssetRef` | binary DB'ye yazılmaz | yalnız `digital_asset.id`+checksum referansı |

Ek olarak yeni bir CI kapısı önerisi: `check-atomic-types` — her `FieldType`'ın 13 sözleşme boyutunu (gap raporu §5) beyan ettiğini ve registry bağımlılığını çözdüğünü zorlar; beyansız tip yeşil geçemez.

---

## 9. İnşa sırası (bağımlılık-farkında) + archetype bağı

Atomlar birbirine bağımlıdır; sıra kritik yolu izler. Sade özet: taban skalerler (özellikle `decimal`) önce; onların üstüne semantik değerler; referans ve value-object en son; her katman bir öncekine `dependsOn` verir.

1. **Katman A — `decimal`, `uuid`, `timestamptz`, `duration`** (taban açığı; Money/Measure/temporal bunlara dayanır).
2. **Katman B — Money, Measure, I18nText, Percentage, temporal üçlü, EnumType** (kurumsal doğruluk + global; en çok kaldıraç).
3. **Katman B — kimlik tipleri** (TaxId/IBAN/NationalId/Identifier + registry bağı §7).
4. **Katman C — AssetRef/PartyRef/ClauseRef/ExternalId** (grafik; CLM ve migration açar).
5. **Katman D — Address/ContactPoint/Range** (U1 kararından sonra).
6. **Cross-cutting (§6) + `check-atomic-types` kapısı** her katmana paralel zorlanır.

Archetype bağı: her ArcheType alanı bir atomik tipe `dependsOn` verir; `archetype-agreement` (CLM) PartyRef/ClauseRef/Term/DateRange/Money/Percentage'a, `k-obligation` Duration/Recurrence/DateRange'e, PIM AttributeSet/Measure/Identifier'a bağlanır. **Atom katmanı bu haliyle kilitlenmeden hiçbir enterprise archetype sağlam kurulamaz** — kataloğun ana tezi budur.

---

## 10. Özet sayım + tek cümlelik sonraki adım

Katalog ~42 anlamlı atomik tip tanımlar: Katman A (13), B (18), C (6), D (4) + cross-cutting (6) + registry (7). Durum dağılımı kabaca: **VAR ~6, KISMİ ~12, EKSİK ~24** — yani atom katmanının büyük çoğunluğu ya sıkışık ya yok.

**Sonraki adım (öneri):** Bu katalog + gap raporu birlikte, bir `atomic-types-directive` (dört katman + 13 boyut + registry + `check-atomic-types` kapısı) ve `currency→Money` şema-terfi önerisi için yeterli zemindir; onayınla test-önce üretilir, ardından CLM archetype fleet'i bu sağlam atom zemini üstünde koşar.
