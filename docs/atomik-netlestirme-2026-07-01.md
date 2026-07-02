# Atomik Katman — Netleştirme ve Derinleştirme (Atom / Fragment / ArcheType)

**Tarih:** 2026-07-01
**Durum:** AI-DRAFT (insan onayı bekler). Nihai kavramsal netleştirme; **kod ve kanonik şema yazmaz** — atomun kesin tanımını, atom/fragment/archetype kademe modelini ve U1 kararını sabitler.
**Kapsam:** `docs/atomik-primitif-katman-gap-2026-07-01.md` (gap) + `docs/atomik-tip-katalogu-tam-2026-07-01.md` (42 tip) + `docs/atom-archetype-bagi-clm-ornegi-2026-07-01.md` (CLM bağı) üçlüsünün üstüne kurulur ve onları **derinleştirir**: bu belge, "bir şey atom mudur?" sorusunu kesin bir kurala bağlar.
**Karar girdisi:** U1 = **Address atom değil, mini-archetype'tır.** (İnsan kararı, 2026-07-01.)
**Kaynak:** `src/schemas/archetype.ts` (`FieldTypeSchema`, `FieldSchema`, `FragmentSchema`), `core-contract-pack.md §3.6`, DDD value-object teorisi.

---

## 0. Bu belge nedir / ne yapar / ne yapmaz

**Nedir:** Atomun kesin (testable) tanımı + atom / fragment (mini-archetype) / archetype üç-kademe modeli + sınır tiplerinin bu modele göre nihai sınıflandırması.

**Ne yapar:** U1 kararını genel bir kurala yükseltir; "atom mı, fragment mi, archetype mı?" için beş-testlik bir karar prosedürü tanımlar; katalog Katman D'yi çözer ve `platform_fragments` (kanonik fragment kütüphanesi) kavramını tanıtır; motorun her kademeyi nasıl farklı türettiğini belirtir; CLM eşlemesini günceller; açık unknown-unknowns'ları kapatır.

**Ne yapmaz:** TypeDecorator/Fragment kodu yazmaz; `FieldTypeSchema`/`FragmentSchema`'yı (kanonik) değiştirmez — yalnız değişiklik gereksinimini ve göç yolunu **önerir**. Yeni app/module düğümü üretmez. Mock veri üretmez.

## 0.1 Tek cümle

Atom = **tek kanonik temsili ve bütün-değer semantiği olan, iç parçaları bağımsız iş-alanı değil parametre/uç olan bölünemez değer**; çok-alanlı, parçaları bağımsız anlamlı kayıtlar (Address, PersonName) ise atom değil **Fragment (mini-archetype)**'tır; kimlik + yaşam döngüsü + ilişki + izin ekleyince **ArcheType** olur.

---

## 1. U1 kararı ve kaydı

**Karar:** `Address` bir atomik tip **değildir**; bir **mini-archetype**'tır. Kod tabanında karşılığı mevcut `FragmentSchema`'dır (`archetype.ts:108` — "yeniden kullanılabilir alan grubu, composable"). Yani `Address = platform-katman kanonik Fragment`.

**Gerekçe (aktör-açık):** *İnsan* bu sınırı bilinçli çizdi. Mimari gerekçe: Address'in parçaları (`street/city/postal/region/country`) **bağımsız anlamlıdır** — şehre göre sorgu, ülkeye-bağlı posta-kod doğrulama, ülkeye göre facet, ülkeye göre i18n adres-düzeni. Bu, "tek kanonik değer" değil, **küçük bir kayıttır**. Address'i atom yapmak, motoru çok-alanlı bir yapıyı tek opak değer gibi görmeye zorlar (form/validasyon/arama türetilemez); `json` yapmak ise motoru büsbütün kör eder. Doğru kademe: **Fragment.**

**Sonuç:** Katalogun "Katman D — value-object" başlığı **çözülür**; üyeleri (Address, ContactPoint, PersonName…) atom kataloğundan çıkıp **Fragment tier**'ine taşınır. Atom kataloğu bundan böyle yalnız üç katmandır: A (taban skaler), B (semantik değer), C (referans-değer).

---

## 2. Üç kademe — kesin tanımlar

Sistem tek bir "tip" düzlemi değil, **üç kademeli** bir kompozisyon zinciridir. Her kademe bir öncekini kullanır; motor her birini farklı türetir (§7). Aşağıdaki tablo üç kademeyi ayırır.

| Kademe | Nedir | Kimliği var mı? | Şema karşılığı | Örnek |
|---|---|---|---|---|
| **Atom** (FieldType) | Tek kanonik temsili + bütün-değer semantiği olan bölünemez değer | Yok (değer semantiği) | `FieldTypeSchema` (`platform_fieldtypes`) | Money, Measure, DateRange, uuid, EnumType, PartyRef |
| **Fragment** (mini-archetype) | Atom-tipli alanlardan oluşan, yeniden kullanılabilir, kimliksiz **kayıt** | Yok (gömülü) | `FragmentSchema` (`platform_fragments` — yeni) | Address, PersonName, ContactPoint, MoneyRange* |
| **ArcheType** | Fragment + **kimlik + yaşam döngüsü + ilişki + izin** | Var (id, tenant, RLS) | `ArcheTypeSchema` | Party, Contract, Product |

Ayrım cümlesi: **Atom bir değerdir; Fragment kimliksiz bir kayıttır; ArcheType kimlikli bir varlıktır.** Fragment ile ArcheType arasındaki tek fark kimlik/yaşam-döngüsü/ilişki/izindir — Fragment gömülüdür (embedded), ArcheType bağımsız yaşar.

---

## 3. Karar kuralı — "atom mı, fragment mi, archetype mı?"

Bir veri parçasının kademesini belirlemek için beş ortogonal test sırayla uygulanır. Aşağıdaki prosedür yazarın (insan/ajan) bir alanı tasarlarken izleyeceği karar adımlarıdır; ilk "evet" kademeyi belirler.

1. **Kimlik testi:** Kendi kimliği (id), yaşam döngüsü, ilişkileri ve izin sınırı olması gerekiyor mu (bağımsız yaşıyor, başka kayıtlar ona referans veriyor)? **Evet → ArcheType.**
2. **Ayrıştırma testi:** Değilse — birden çok, **bağımsız anlamlı** (ayrı sorgulanan/doğrulanan/facet'lenen) alt-alanı var mı? **Evet → Fragment.**
3. **Bütün-değer testi:** Değilse — tek anlamı olan, bir bütün olarak (değer semantiğiyle) karşılaştırılan/eşitlenen, kanonik formu olan bir değer mi? **Evet → Atom.**
4. **Operasyon testi (atomu doğrular):** Bütün-değer üstünde anlamlı işlemleri var mı (aritmetik, çakışma/kapsama, mesafe, üretim)? İç parçaları bu işlemin **parametresi/ucu** mu (currency, unit, SRID, precision, başlangıç/bitiş)? Evet → sağlam **Atom**.
5. **Genişletme testi (fragment/archetype'ı doğrular):** Tenant ona alan ekleyebiliyor mu, alanları per-alan i18n/izin taşıyor mu? Evet → **Fragment** (kimliksizse) veya **ArcheType** (kimlikliyse); asla atom değil.

Kısa sezgi: *"Parçaları parametre mi, alan mı?"* Parçalar değerin parametresi/ucuysa (Money'nin currency'si, DateRange'in uçları) → **atom**. Parçalar kendi başına sorgulanan iş-alanıysa (Address'in city'si) → **fragment**.

---

## 4. Sınır tipleri — kural uygulanmış nihai sınıflandırma

Kuralın gücü, zor sınır durumlarını tutarlı ayırmasıdır. Aşağıdaki tablo her tartışmalı tipi beş-teste sokup nihai kademesini ve gerekçesini verir. Bu tablo kataloğun bağlayıcı sınıflandırmasıdır.

| Tip | Kademe | Belirleyici test | Gerekçe |
|---|---|---|---|
| `Money` (değer+kur+precision+rounding) | **Atom** | Bütün-değer + operasyon | Kur/precision değerin **parametresi**; tutar bir bütün olarak toplanır/karşılaştırılır; alt-parça bağımsız iş-alanı değil |
| `Measure` (değer+birim+dönüşüm) | **Atom** | Bütün-değer + operasyon | Birim bir boyut parametresi; boyut-güvenli çarpım bütün-değer işlemi |
| `Percentage` | **Atom** | Bütün-değer | Tek oran değeri + precision parametresi |
| `DateRange` (başlangıç+bitiş) | **Atom** (`Range<date>`) | Operasyon | Uçlar bir **aralığın iki ucu**; çakışma/kapsama bütün-değer işlemi; uçlar bağımsız iş-alanı değil |
| `Term` (2 yıl) | **Atom** | Bütün-değer | Tek süre değeri + birim parametresi |
| `Recurrence` (RRULE) | **Atom** | Operasyon | Tek kural + üretim işlemi; parçaları RRULE gramerinin alanları, bağımsız değil |
| `GeoPoint` (koordinat+SRID) | **Atom** | Operasyon | SRID parametre; mesafe/kapsama bütün-değer işlemi |
| `Identifier`/`TaxId`/`IBAN`/`NationalId` | **Atom** | Bütün-değer | Tek kimlik değeri + jurisdiction/checksum parametresi |
| `EnumType` (alias+i18n+lifecycle) | **Atom** | Bütün-değer | Tek kimlik; etiket ayrı alias, değerin parçası değil |
| `MonetaryRange`/`QuantityRange` | **Atom** (`Range<Money>`/`Range<Measure>`) | Operasyon | Aynı `Range<T>` jeneriği; uçlar iki Money/Measure atomu |
| `PersonName` (given/family/…) | **Fragment** | Ayrıştırma | Given/family **bağımsız anlamlı** (family'ye göre sırala, given göster, i18n ad-düzeni) → kayıt |
| `Address` (street/city/postal/country) | **Fragment** | Ayrıştırma | Alt-alanlar bağımsız sorgulanır/doğrulanır (posta-kod ülkeye bağlı) → kayıt (U1) |
| `ContactPoint` (tip+değer+öncelik) | **Fragment** | Ayrıştırma | Alanlar bağımsız; her kanal kendi atom tipini taşır |
| `Party` / `Contract` | **ArcheType** | Kimlik | Kendi id/yaşam-döngüsü/ilişki/izni var; başkaları referans verir |

Netleştirici kontrast: `PersonName` **Fragment** ama düz `full_name` **Atom** (`string`) olur — fark, parçaların bağımsız anlamlı olup olmamasıdır. Aynı şekilde `DateRange` **Atom** (aralık bir bütün) ama "başvuru tarihi + karar tarihi" **iki ayrı alan** (bağımsız) olur — bunlar bir Range değildir. Kural, bu ayrımı deterministik verir.

**Yeni jenerik atom — `Range<T>`:** DateRange, MonetaryRange, QuantityRange tek bir **parametreli aralık atomu** olur: `Range<date>`, `Range<Money>`, `Range<Measure>`. Ortak operatörler (overlap, contains, adjacent) tip-parametresinden bağımsız tanımlanır; uç-açıklığı (`[]`,`[)`,`()`) parametredir. Bu, U2'yi (parametreli tip meta-modeli) somut bir örnekle çözer.

---

## 5. Parametreli atom modeli (U2 çözümü — derinleştirme)

Atomlar düz enum değil, **parametreli değer tipleridir**. Bu, gap raporunun 3. sözleşme boyutunu (parameterization) somutlaştırır. Aşağıdaki tablo hangi atomun hangi tip-parametresini taşıdığını verir; parametre, atomu somutlaştıran ve motor türetimini yönlendiren zorunlu meta'dır.

| Atom | Tip-parametreleri | Motor bunlarla ne yapar |
|---|---|---|
| `string` | maxLength, collation, pattern | varchar(n) + collation sıralama + regex doğrulama |
| `decimal` | precision, scale, rounding | numeric(p,s) + kesin aritmetik |
| `Money` | currency-set, precision, rounding | izinli kur kümesi + minor-units + yuvarlama |
| `Measure` | dimension, unit-system (UCUM) | boyut-guard + dönüşüm |
| `Range<T>` | element-type T, bound-closure | T'nin operatörleri + uç-açıklık |
| `EnumType` | values, alias-ref, ordering, lifecycle | değer kümesi + i18n etiket + deprecate |
| `Identifier` | scheme (GTIN/GLN/SKU), checksum-algo | şema doğrulama + checksum |
| `EntityRef`/`PartyRef`/`AssetRef` | target-kind, onDelete, scope | FK + silme politikası + PDP-scope |

Karar: parametre, `FieldSchema`'ya **per-tip `params` alanı** olarak eklenir (bugün yok — düz enum). `string(50)` ayrı bir tip değil, `string` + `{maxLength:50}` parametresidir. Bu, kataloğu tip-patlamasından (her uzunluk için ayrı tip) korur ve motor türetimini parametreden okur.

---

## 6. `platform_fragments` — kanonik fragment kütüphanesi (yeni kavram)

Fragment tier'i bir boşluğu kapatır: gap raporunun işaret ettiği "PIM/HRMS/CLM aynı Address'i üç farklı biçimde uydurur" sorunu. Çözüm, `platform_fieldtypes`'ın (atom kütüphanesi) kardeşi olan bir **`platform_fragments`** (kanonik fragment kütüphanesi): Address, PersonName, ContactPoint, MoneyRange gibi çok-alanlı değer-nesneleri **tek platform tanımında** yaşar; her app aynı Fragment'i tüketir, kendi Address'ini açmaz.

Mevcut `FragmentSchema` (`{id, label, fields[]}`) bu rolü üstlenmek için üç noktada **zenginleştirilmeli** (öneri, kanonik değişiklik → insan onayı):

- **Cross-field validation:** Fragment içi alanlar-arası kural (Address: posta-kod ülkeye bağlı doğrulanır). Bugün `FieldSchema` yalnız tek-alan doğrular; Fragment'e alanlar-arası kural eklenmeli.
- **Storage stratejisi:** Fragment gömülü mü (JSONB, tek kolon) yoksa normalize mi (ayrı alt-tablo, join)? Karar kuralı §7'de; Fragment tanımı bunu beyan etmeli.
- **Reusability + i18n + PII:** Fragment platform-katman paylaşılır; alanları per-alan i18n (Address label'ları) ve per-alan PII-sınıfı (PersonName PII-orta) taşır.

Sınır (fragment ne değildir): Fragment'in **kimliği yoktur**; başka kayıtlar ona `PartyRef` gibi referans **veremez** (o zaman ArcheType olur). Fragment yalnız bir ArcheType/başka Fragment içine **gömülür**. Bir müşterinin adresi Party ArcheType'ına gömülü bir Address Fragment'idir; bağımsız "Adresler tablosu" gerekiyorsa (adres paylaşımı, adres geçmişi) o zaman Address bir ArcheType'a **terfi eder** — bu da kimlik testiyle (test 1) belirlenir.

---

## 7. Motor muamelesi — kademe başına türetim farkı (derinleştirme)

ArcheType engine üç kademeyi **farklı** türetir; netleştirmenin pratik karşılığı budur. Aşağıdaki tablo her kademe için DB/API/Surface/arama türetimini verir.

| Türetim | Atom | Fragment | ArcheType |
|---|---|---|---|
| **DB** | Tek kolon (ya da value-type kompoziti) | Gömülü JSONB **veya** normalize alt-tablo (karar §7.1) | Kendi tablosu + PK + tenant + RLS |
| **API/OpenAPI** | Skaler/kompozit tip | İç-içe nesne (nested object) | Kaynak (resource) + endpoint'ler |
| **Surface (form)** | Tek widget (para-input, tarih-aralığı) | Bileşik widget (adres bloğu, per-alan) | Sayfa/liste/detay projeksiyonu |
| **Arama/index** | Tip-farkında index (minor-units, gist) | Per-alan index (city facet, country filter) | Tam FTS + facet + relation join |
| **Doğrulama** | Bütün-değer (kur, boyut, checksum) | Alan + alanlar-arası (posta-ülke) | + iş kuralı + workflow gate |
| **Eşitlik/dedup** | Bütün-değer eşitlik + fuzzy (§8) | Alan-bazlı + normalize (adres) | Golden-record/survivorship (k-mdm) |

### 7.1 Fragment storage kararı (yeni unknown-unknown çözümü)

Bir Fragment gömülü (JSONB) mü yoksa normalize (alt-tablo) mi saklanır? Karar kuralı: (a) Fragment **tek bir üst kayda ait** ve **bağımsız sorgulanmıyorsa** → gömülü JSONB (Address genelde budur). (b) Fragment **çok sayıda** olabiliyor ve **bağımsız sorgulanıyor/facet'leniyorsa** (ör. "İstanbul'daki tüm taraflar") → normalize alt-tablo veya generated-column index. (c) Karar Fragment tanımında **beyan edilir** (`storage: embedded|normalized`), motor ona göre türetir. Bu, "her şeyi JSONB'ye göm" ile "her şeyi tablo yap" ikilisinin ortasıdır.

---

## 8. Eşitlik / kanonikleştirme — atom ve fragment (U4/U6 derinleştirme)

Netleştirme, eşitliği kademeye göre ayırır. Atom **bütün-değer** eşitliğiyle karşılaştırılır (Money: değer+kur; DateRange: iki uç); Fragment **alan-bazlı + normalize** eşitlikle (Address: normalize sokak/şehir; PersonName: fonetik given/family). k-mdm dedup'ı bu ikisini farklı kullanır: atom alanında canonical eşleşme, fragment alanında per-alan fuzzy (adres normalize, isim Metaphone). Kanonikleştirme (c13n) her atomun/fragment-alanının **sözleşme boyutudur** (gap §5, boyut 4); locale-collation (Türkçe İ/ı) atomun `compare` parametresine bağlıdır. Bu, U4 (collation) ve U6 (per-tip eşitlik) unknown-unknowns'larını kapatır.

---

## 9. CLM yeniden-eşleme — netleştirme sonrası

U1 kararı CLM bağını (önceki belge §3) günceller: Party'nin çok-alanlı değerleri artık **Fragment**, agreement'ın tekil değerleri **Atom** kalır. Aşağıdaki tablo güncellenmiş eşlemeyi verir.

| CLM yapısı | Netleştirme öncesi | Netleştirme sonrası (nihai) |
|---|---|---|
| `Party.address` | Layer D value-object | **Fragment** `Address` (platform_fragments) |
| `Party.name` | `PersonName` (Katman B?) | **Fragment** `PersonName` |
| `Party.contacts[]` | value-object | **Fragment** `ContactPoint`[] |
| `Party.tax_id` / `national_id` | Katman B | **Atom** (tek-değer kimlik + PII-sınıf) |
| `Agreement.total_value` | Money | **Atom** Money (değişmez) |
| `Agreement.effective_range` | DateRange | **Atom** `Range<date>` |
| `Agreement.payment_range` | MonetaryRange | **Atom** `Range<Money>` |
| `Agreement.parties[]` | PartyRef | **Atom** (referans-değer, Katman C) — Party bir ArcheType |

Sonuç: CLM'de kademeler net ayrışır — Party/Contract **ArcheType**; Address/PersonName/ContactPoint **Fragment**; Money/Range/PartyRef/EnumType **Atom**. Her CLM alanı artık doğru kademeye oturur; hiçbir çok-alanlı yapı atoma zorlanmaz, hiçbir tekil değer gereksiz tabloya bölünmez.

---

## 10. Çözülen unknown-unknowns (gap raporu §6'ya karşı)

Netleştirme, gap raporundaki belirsizliklerin bir kısmını **kapatır**; kalanları daraltır. Aşağıdaki tablo durumu verir.

| Kod | Unknown-unknown | Durum |
|---|---|---|
| **U1** | Value-object sınırı (Address atom mı?) | **KAPANDI** — Fragment (mini-archetype); kural §3 |
| **U2** | Parametreli tip meta-modeli | **KAPANDI** — atom = parametreli değer tipi (§5); `Range<T>` |
| **U3** | Referans-değer vs relation | **KAPANDI** — referans-değer = Katman C atom; relation = ArcheType arası ilişki |
| **U4** | Locale-collation | KAPANDI — atomun `compare` parametresi (§8) |
| **U6** | Per-tip eşitlik/fuzzy | KAPANDI — atom bütün-değer, fragment alan-bazlı (§8) |
| **U5** | Registry bağımlılıkları | Daraldı — atom parametresi registry-sürümüne bağlanır (katalog §7) |
| **U7** | Tip versiyonlama/terfi | Daraldı — Fragment↔ArcheType terfisi kimlik testiyle (§6) |
| **U8** | Temporal ayrım | KAPANDI — instant/date/time/duration atomları + `Range<date>` + Recurrence |
| **U9** | Empty≠zero | Açık — atomun null-semantiği boyutu (gap §5, boyut 9); ayrı kilitlenmeli |
| **U10** | Security-as-type | Açık — PII-sınıf atom+fragment-alan boyutu; ayrı kilitlenmeli |
| **U11** | Precision/rounding genelleştirme | KAPANDI — cross-cutting parametre (Money/Measure/Percentage/Range) |

Kalan iki açık (U9, U10) küçük ve bağımsızdır: dört-durum null-semantiği ve alan-düzeyi güvenlik-sınıfı. İkisi de atomun 13-boyut sözleşmesinde birer boyuttur; directive yazımında kilitlenir.

---

## 11. Nihai atom tanımı + atomicity checklist

**Nihai tanım (testable):** *Bir atom, tek bir kanonik temsili ve bütün-değer semantiği (değere göre karşılaştırma/eşitlik, kanonik form) olan; iç bileşenleri bağımsız iş-alanı değil değerin parametresi/ucu olan; kimliği, yaşam döngüsü ve ilişkisi olmayan bölünemez değer tipidir. Parametrelerle somutlaşır (Money⟨currency,precision⟩, Range⟨T⟩) ve motor ondan 13 sözleşme boyutunu deterministik türetir.*

**Yazarın atomicity checklist'i (bir alanı tasarlarken):**

1. Kendi kimliği/yaşam-döngüsü/ilişkisi gerekiyor mu? → Evet ise **ArcheType**, dur.
2. Birden çok bağımsız-anlamlı alt-alanı var mı (ayrı sorgu/doğrulama/facet)? → Evet ise **Fragment**, dur.
3. Bir bütün olarak değere göre karşılaştırılıyor, kanonik formu var mı? → Evet ise **Atom**.
4. Atomsa: hangi parametreleri taşır (precision/currency/unit/element-type)? Bunları beyan et.
5. Atomsa: 13 sözleşme boyutunu (storage/validation/c13n/compare/index/i18n/null/serialize/surface/security/equality/params/versioning) beyan et; `check-atomic-types` bunu zorlar.

---

## 12. Nihai kademe envanteri (katalog güncellemesi)

Netleştirme sonrası atom kataloğu üç katmandır (Katman D kalktı, Fragment ayrı tier oldu). Aşağıdaki tablo nihai envanteri özetler; sayılar önceki katalogdan (§10) güncellenmiştir.

| Kademe | Üye | Örnek |
|---|---|---|
| **Atom — Katman A** | ~12 taban skaler | string, decimal, uuid, timestamptz, date, time, duration, boolean, integer, bigint, bytea-ref, json |
| **Atom — Katman B** | ~16 semantik değer | Money, Measure, Percentage, I18nText, Email, URL, Phone, Color, TaxId, IBAN, NationalId, Identifier, Term, Recurrence, EnumType, `Range<T>` |
| **Atom — Katman C** | ~6 referans-değer | EntityRef, AssetRef, PartyRef, ClauseRef, EnumAliasRef, ExternalId |
| **Fragment** (ayrı tier) | ~4+ kanonik + app-özel | Address, PersonName, ContactPoint, `Range` olmayan çok-alanlı değerler |
| **ArcheType** | portföy varlıkları | Party, Contract, Product, Obligation… |

---

## 13. Tek cümlelik sonuç + sıra

Atom artık **kesin**: bölünemez, parametreli, bütün-değer semantiği olan değer tipi; çok-alanlı kayıtlar **Fragment** (kanonik `platform_fragments`), kimlikli varlıklar **ArcheType** — üç kademe, tek karar kuralı (kimlik→ayrıştırma→bütün-değer). Sıra: (1) bu netleştirmeyi bir `atomic-types-directive` + `fragments-directive`'e dök (4 test + 13 boyut + `Range<T>` + `platform_fragments` + storage kuralı), (2) `check-atomic-types`/`check-fragments` CI kapılarını test-önce yaz, (3) `currency→Money` ve `params`/Fragment şema-terfisini **öner** (insan onayı), (4) ancak sonra CLM dahil archetype üretimine dön.
