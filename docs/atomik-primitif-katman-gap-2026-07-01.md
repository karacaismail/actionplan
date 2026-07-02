# Atomik Primitif Katmanı — Gap, Gereksinim ve Unknown-Unknowns Analizi

**Tarih:** 2026-07-01
**Durum:** AI-DRAFT (insan onayı bekler — kod yazmaz, atomik tip sözleşmesini ve boşluğunu teşhis eder).
**Kapsam:** "ArcheType engine'i besleyen atomik primitifler (Field'ın altındaki tip katmanı/katmanları) yeterince mimari temelde tanımlı mı?" sorusunun kanıtlı cevabı + gereksinim analizi + bu aşamadaki bilinmeyen-bilinmeyenler (unknown-unknowns).
**Kanıt/kaynak:** `src/schemas/archetype.ts:77` (`FieldTypeSchema`), `docs/core-contract-pack.md §3.6` (`platform_fieldtypes`), `docs/archetype-uretim-spec.md §12.B` (FieldType genişletme), `src/data/generated/nodes/atomic-types.json` (durum: backlog), `src/data/generated/nodes/k-archetype-fieldtypes.json`.

---

## 0. Tek cümlelik teşhis + "haklı mısın?" cevabı

**Evet, haklısın.** Atomik tip katmanı üç ayrı yerde tanımlı ama **üçü birbiriyle çelişiyor**, **katmansız ve parametresiz**, ve motorun (ArcheType engine) bir tipten form/tablo/API/DB/validasyon/arama türetmek için ihtiyaç duyduğu **per-tip davranış sözleşmesi yok**; üstelik bu boşluğu kapatması gereken katalog düğümü (`atomic-types.json`) `backlog` durumunda, yani ilan edilmiş ama yazılmamış. Sonuç: atom zayıf olduğu için üstüne kurulacak **her** ArcheType (CLM sözleşme grafiği dahil) aynı zayıflığı miras alır.

---

## 1. Bu rapor nedir / ne yapar / ne yapmaz

**Nedir:** ArcheType engine'in girdisi olan atomik tip katmanının durum tespiti, gereksinim sözleşmesi ve görülemeyen risklerinin (unknown-unknowns) analizi.

**Ne yapar:** Üç mevcut kaynağı yan yana koyup çelişkileri kanıtla adlandırır; metadata-driven bir motorun bir atomdan ne türetmesi gerektiğini (13 sözleşme boyutu) tanımlar; portföyün (16 app) ve CLM probunun ihtiyaç duyduğu atomik tipleri listeler; sıralı bir düzeltme önerisi verir.

**Ne yapmaz:** Kod yazmaz; TypeDecorator kütüphanesini implemente etmez (o `platform` reposu + insan onayı işidir). Yeni app/module düğümü üretmez (AGENTS.md sınırı). Standart metnini düğüme kopyalamaz; yalnız sözleşme boşluğunu işaret eder.

---

## 2. Mevcut durum — kanıtla (üç kaynak, üç farklı gerçek)

Atomik katman tek bir yerde değil, üç yerde ve **üç farklı biçimde** tanımlı. Aşağıdaki tablo her kaynağın ne söylediğini ve durumunu verir; asıl sorun tabloyu takip eden çelişki listesindedir.

| Kaynak | Ne tanımlar | Kaç tip | Biçim | Durum |
|---|---|---|---|---|
| `src/schemas/archetype.ts:77` `FieldTypeSchema` | Motorun fiilen kabul ettiği alan tipleri | **14** | Düz `z.enum` (katmansız, parametresiz) | Canlı (şema = gerçek) |
| `core-contract-pack.md §3.6` `platform_fieldtypes` | Kurumsal kompozit değer tipleri | **5** | `TypeDecorator` (Money/Measure/I18nText/Geo/AttributeSet) | Sözleşme taslağı |
| `archetype-uretim-spec.md §12.B` | Aynı 5 tipi FieldType kümesine "ekler" | **5** | Anlatı + tablo | Sözleşme taslağı |
| `atomic-types.json` (düğüm) | "Field'ın altındaki tip katmanı" katalogu | 0 (vaat) | 3 bullet başlık | **backlog** (yazılmamış) |

Şemadaki 14 tip aynen şudur: `string, text, number, integer, boolean, date, datetime, enum, json, relation, currency, email, phone, file`. `FieldSchema` bir alanın taşıdığı meta olarak yalnız şunları tutar: `type, required, unique, pii, alias, deprecated, protected, enumValues, relationTo`.

**Kanıtlı çelişkiler (en yüksek değerli bulgu — kod yazmadan önce düzeltilmeli):**

- **A1 — `currency` ≠ `Money`.** Şemada `currency` diye düz bir tip var; oysa `§3.6` doğru biçimde **para = değer + kur + kesinlik + yuvarlama** dörtlüsü diyor. `currency` tek başına belirsizdir: ISO kur kodu (bir string) mu, yoksa parasal tutar mı? Şema, sözleşmenin "float para yasak, kesinlik/yuvarlama tipin parçası" invariantını **taşımıyor**. Bu, muhasebe/finans/CLM ödeme alanlarında sessiz para hatası kaynağıdır.
- **A2 — Sözleşme-implementasyon sapması.** `§3.6` ve `§12.B` beş kompozit tip (money, measure, i18n-text, geo, attribute-set) **vaat ediyor**; şemadaki 14-tip enum'da bunların **hiçbiri yok** (yalnız düz `currency`). Yani "sözleşmede var, motorda yok". `k-archetype-fieldtypes.json` bunu kendisi itiraf ediyor: *"FieldType 14 tiple kapalı ve enterprise-eksik."*
- **A3 — Katalog ilan edilmiş ama boş.** `atomic-types.json` düğümünün özeti birebir senin cümlen: *"ArcheType engine'i besleyen atomik primitive'ler. Field'ın altındaki tip katmanı."* Ama `status: backlog` ve `featureDefs` yalnız üç başlık ("katalog (Money, Email, TenantId, DateRange, ...)", "her tipin doğrulama/biçim/eşitlik", "üst fazların güvendiği temel"). Yani **katalogun kendisi bir yapılacak-iş**, tanımlı bir varlık değil.

---

## 3. Neden bu bir sorun — metadata-driven engine ne ister

**Bağlam (jargon):** ArcheType engine = tek bir metadata tanımından form + tablo + API + DB şeması + validasyon + arama **türeten** motor. Bu türetmenin tamamı, alanın **tipinin sözleşmesine** dayanır. Motor bir alanı "sadece number" olarak biliyorsa; hangi PostgreSQL kolonuna yazacağını, nasıl doğrulayacağını, nasıl sıralayacağını, hangi input widget'ını üreteceğini, PII olup olmadığını **deterministik türetemez**. Atom ne kadar zayıfsa, motorun türetimi o kadar tahmine dayalı olur.

Olması gereken, şu an olmayan **dört katmanlı** atomik model (mevcut yapı tek düz katman):

- **Katman A — Taban skalerler (asıl atomlar):** `string, text, decimal, integer, bigint, boolean, uuid, timestamptz, date, time, duration/interval, bytea-ref, json`. Her biri: DB kolon eşlemesi + karşılaştırma/sıralama + null davranışı + indekslenebilirlik.
- **Katman B — Semantik değer tipleri (kompozit atomlar, Katman A üstüne kurulu):** `Money, Measure, Percentage, I18nText, Email, URL, PhoneNumber, PersonName, Address, GeoPoint, Color, TaxId, IBAN, NationalId, Identifier (GTIN/GLN), DateRange, Term/Duration, Recurrence (RRULE)`. Her biri kendi doğrulama + kanonik form + biçimlendirme davranışını taşır.
- **Katman C — Referans-değer tipleri:** `EntityRef (relation), AssetRef (file→digital_asset), PartyRef, ClauseRef, EnumAliasRef, ExternalId`. Değeri "başka bir kayda işaret eden" alanlar. Şu an `relation` ve `file` var ama tipli/kapsamlı değil.
- **Katman D — Kompozit / gömülü değer nesneleri:** `Address, ContactPoint, MonetaryRange` gibi çok-alanlı ama tek-anlamlı yapılar. **Sınırı tanımsız:** bunlar atom mu, mini-archetype mı, yoksa opak `json` mu? (Bu belirsizlik §6'daki en kritik unknown-unknown'dır.)

Bugünkü 14-tip düz enum, bu dört katmanı tek seviyede eziyor: gerçek skalerler (`string/number/boolean`), temporal (`date/datetime`), yapısal (`json/relation`) ve semantik (`currency/email/phone`) hepsi **yan yana, ayrımsız** duruyor. `json` ise bir tip değil, bir kaçış kapısıdır — yapısal değer (Address, contact) `json`'a gömülürse motor ondan form/validasyon/arama türetemez; bu, sözleşmenin kendisinin uyardığı "her şeyi string'e sıkıştırma" anti-desenidir ama şema onu mümkün kılıyor.

---

## 4. Gap analizi — var olan vs gereken (portföy + CLM probe)

Aşağıdaki tablo, 16-app portföyünün ve CLM probunun fiilen ihtiyaç duyduğu atomik tipleri ve mevcut durumunu verir. "Durum": **VAR** (şemada birinci-sınıf), **KISMİ** (sözleşmede vaat ama şemada yok, ya da `json`/`string`'e sıkışık), **EKSİK** (hiçbir yerde tipli değil). Bu liste dolgu değil; her satır gerçek bir app/probe gereksinimidir.

| Atomik tip | Katman | Durum | En çok isteyen app/probe |
|---|---|---|---|
| string / text / integer / boolean | A | VAR | hepsi |
| number → **decimal(precision,scale)** | A | KISMİ (parametresiz `number`) | muhasebe, finans, MRP |
| uuid / bigint | A | EKSİK (string'e sıkışık) | kernel (tenant/id), tümü |
| date / datetime → **timestamptz + tz** | A | KISMİ (tz beyanı yok) | tümü, takvim |
| time / **duration/interval/term** | A | EKSİK | CLM (vade), MRP (rota süresi), HRMS |
| **Money (değer+kur+precision+rounding)** | B | KISMİ (düz `currency`) | muhasebe, CLM, e-ticaret, CRM |
| **Measure (birim+dönüşüm, UCUM)** | B | KISMİ (sözleşmede, şemada yok) | MRP, PIM, fleet |
| **Percentage / Ratio** | B | EKSİK | CLM (faiz/ceza), muhasebe, KPI |
| **I18nText (locale→değer)** | B | KISMİ (sözleşmede, şemada yok) | global 16 app |
| **Geo / GeoPoint (PostGIS)** | B | KISMİ (sözleşmede, şemada yok) | fleet, IBYS, e-ticaret |
| email / phone | B | VAR (ama doğrulama/format sözleşmesi zayıf) | CRM, HRMS, tümü |
| **URL / Color / PersonName / Address** | B | EKSİK (`string`/`json`) | HRMS, CRM, CMS |
| **TaxId / IBAN / NationalId** | B | EKSİK | muhasebe, HRMS, IBYS, CLM |
| **Identifier (GTIN/GLN/SKU)** | B | EKSİK | PIM, e-ticaret, MRP |
| **DateRange / EffectivityWindow** | B | KISMİ (ilişki olarak §12.C, alan-değer olarak yok) | CLM, MRP, HRMS |
| **Recurrence (RRULE)** | B | EKSİK | CLM (yenileme), takvim, obligation |
| **AttributeSet / EAV** | B/D | KISMİ (sözleşmede, şemada yok) | PIM (Akeneo-sınıfı) |
| relation (EntityRef) | C | VAR | tümü |
| **AssetRef (file→digital_asset)** | C | KISMİ (düz `file`) | drive, PIM, CLM, CMS |
| **PartyRef / ClauseRef / ExternalId** | C | EKSİK | CLM, entegrasyon |
| enum → **enum+alias+i18n+lifecycle** | B | KISMİ (`enumValues` düz string dizi) | tümü (§12.E alias vaat ediyor) |
| **Address / ContactPoint (value object)** | D | EKSİK (`json`) | HRMS, CRM, CMS, fleet |

Özet sayım: portföy ~35 anlamlı atomik tip ister; bunların **~6'sı VAR**, ~12'si KISMİ (sözleşmede söz verilmiş ama motorda yok veya sıkışık), ~17'si EKSİK. Yani sorun "birkaç tip eksik" değil, **atom katmanının sistematik olarak yarım** olması.

---

## 5. Gereksinim analizi — her atomun taşıması gereken sözleşme

Metadata-driven motorun bir atomdan güvenle türetebilmesi için, her atomik tip aşağıdaki **13 davranış boyutunu** beyan etmelidir. Tablo, boyutun ne için gerektiğini ve bugün `FieldSchema`'nın onu taşıyıp taşımadığını verir.

| # | Sözleşme boyutu | Ne için gerekli | Bugün var mı? |
|---|---|---|---|
| 1 | **storage-mapping** (PG kolon / JSONB şekli) | DB şeması türetimi | Kısmen (tip→kolon örtük) |
| 2 | **validation** (constraint/format/range) | Form + API + DB doğrulama | Zayıf (`required/unique` dışında yok) |
| 3 | **parameterization** (precision, length, unit, currency) | `decimal(12,2)`, `string(50)`, `measure<kg>` | **YOK** (düz enum) |
| 4 | **canonicalization / collation** (normalize, locale-sıralama) | c13n, arama, MDM, i18n sıralama | **YOK** |
| 5 | **compare / order** (sıralama semantiği) | tablo sıralama, aralık sorgusu | **YOK** |
| 6 | **equality / identity** (eşitlik + fuzzy) | dedup, MDM golden-record | **YOK** |
| 7 | **indexability** (btree/gin/gist/trgm/vector, facetable) | arama/filtre performansı | **YOK** |
| 8 | **i18n behavior** (translatable? locale-format?) | çok-dil, tarih/para/sayı biçimi | Kısmen (`§12.E` vaat, şema yok) |
| 9 | **null/empty/unknown/N-A** (dört-durum) | validasyon, arama, MDM, fallback | **YOK** (yalnız `required`) |
| 10 | **serialization** (JSON/OpenAPI temsili) | headless API, SDK codegen | Örtük |
| 11 | **surface-projection** (widget/mask/a11y) | form üretimi, erişilebilirlik | Surface'e devredilmiş, tip-bağı yok |
| 12 | **security-classification** (PII/PHI/PCI, encrypt/mask) | alan-düzeyi şifreleme, KVKK/GDPR | Kısmen (`pii` boolean, sınıf yok) |
| 13 | **versioning / migration** (type-change sözleşmesi) | tip terfisi (string→enum, precision değişimi) | Kısmen (`protected` bayrağı, sözleşme yok) |

Sonuç: `FieldSchema` bugün 13 boyuttan yalnız ~3'ünü (kısmen tip, `required/unique`, `pii` bayrağı) taşıyor. Motorun geri kalanı **koda gömülü varsayımlarla** çalışıyor — ki bu tam da "yeterince mimari temelde tanımlanmış veri yok" gözleminin teknik karşılığıdır.

---

## 6. Unknown-Unknowns — bu aşamada göremediğimiz riskler

Bunlar "eksik olduğunu bildiğimiz" şeyler değil; **atom katmanını gerçekten yazmaya başlayınca patlayacak, şu an belirsiz** kararlardır. Her biri, sonradan bulunursa çok pahalıya mal olur.

- **U1 — Değer-nesnesi sınırı (en kritik):** `Address` bir atom mu (Katman D), bir mini-archetype mı, yoksa opak `json` mu? Bu sınır tanımlanmadan hem PIM hem HRMS hem CLM aynı yapıyı üç farklı biçimde modelleyip **çelişir**. Karar ertelendikçe maliyet katlanır.
- **U2 — Parametreli tip meta-modeli:** `string(50)` ayrı bir tip mi, yoksa `string` + kısıt parametresi mi? Motor parametreyi nasıl saklayıp doğrulayacak? (precision/scale/length/unit/currency hepsi buraya bağlı.)
- **U3 — Referans-değer vs ilişki ayrımı:** Değeri `asset_id`/`party_id` olan bir alan, bir **FieldType (Reference)** mi yoksa bir **relation (§12.C)** mı? İkisi de "başka kayda işaret eder" ama farklı türetilir. CLM'in agreement-graph'ı bu belirsizliği akut hale getirir.
- **U4 — Locale-farkında collation:** Türkçe `İ/ı`, Almanca `ß`, sıralama ve eşitlik locale'e bağlıdır. Atomun `compare` davranışı locale parametresi almazsa çok-dilli sıralama sessizce yanlış olur.
- **U5 — Registry bağımlılıkları:** `Money` → ISO-4217 (+ minor-units), `Measure` → UCUM birim tablosu, `Address` → ISO-3166 ülke/bölge. Bu **kayıt tabloları (registry)** atomun veri bağımlılığıdır; ayrı primitif mi, yoksa atomun içinde mi? Tanımsız.
- **U6 — Per-tip eşitlik/fuzzy eşleşme:** `k-mdm` golden-record dedup için isim fonetik (Soundex/Metaphone), adres normalize, e-posta canonical eşleşme ister. Bu eşleşme fonksiyonu **atomun sözleşmesinde** yaşamalı; şu an hiç yok.
- **U7 — Tip versiyonlama/terfi:** Bir `Money` alanının precision'ı değişince ya da `string` bir alan `enum`'a terfi edince atom-düzeyi migration sözleşmesi nedir? (Genel migration var ama tip-terfisi özel değil.)
- **U8 — Temporal ayrım zenginliği:** `instant` (zaman noktası) ≠ `date` ≠ `time` ≠ `duration` ≠ `interval` ≠ `recurrence (RRULE)` ≠ `business-day` (iş günü). CLM (vade + yenileme), MRP (rota), obligation (hatırlatma) hepsi bunları **ayrı** ister; bugün yalnız `date/datetime` var.
- **U9 — Empty ≠ zero:** `Money=0` (bedelsiz) ile `Money=boş` (bilinmiyor) farklı anlamlardır; ayrım yoksa muhasebe/CLM'de yanlış toplama olur. Bu, U4'ün null-semantiğiyle (boyut #9) birleşir.
- **U10 — Security-as-type:** Alan-düzeyi şifreleme (field-level encryption) ve maskeleme, tipin bir özelliği mi olmalı (PII→encrypt), yoksa ayrı politika mı? KVKK/GDPR field-level erasure bu karara bağlı.
- **U11 — Precision/rounding'in genelleştirilmesi:** `Money` yuvarlama taşıyor ama `Measure`, `Percentage`, `Duration` da yuvarlama/kesinlik ister. Bu, tek tipe değil **cross-cutting bir atom özelliğine** işaret ediyor.

---

## 7. CLM probunun atomik ihtiyacı — atom neden önce gelmeli

Senin sezgin ("archetype yaratmadan önce atomik primitifler bulunmalıydı, çünkü archetype üretirken fazlaca ihtiyaç duyulacak") CLM probunda birebir doğrulanıyor. Aşağıdaki tablo, önceki turda planladığım CLM archetype yönergelerinin hangi atomik tipe dayandığını ve o tipin bugünkü durumunu verir.

| CLM archetype/primitif | İhtiyaç duyduğu atomik tip | Bugünkü durum |
|---|---|---|
| `archetype-agreement` (sözleşme grafiği) | PartyRef, ClauseRef, Term/Duration, DateRange, Money(precision), Percentage, EnumAlias, LegalReference | EKSİK / KISMİ |
| `k-obligation` (yükümlülük) | Duration, Recurrence (RRULE), DateRange, Money, instant+business-day | EKSİK |
| `k-signature` (imza) | SignatureField, hash/cert (bytea-ref), timestamp (instant) | EKSİK |
| `archetype-document-composition` | I18nText, EnumAlias, conditional-değişken tipleri | KISMİ |

Yani atom katmanı tanımlanmadan CLM archetype'ları **sağlam kurulamaz**; kurulursa her biri eksik atomu kendi içinde ad-hoc uydurur (string/json'a sıkıştırır) ve az önce §2'de gördüğümüz üç-kaynak-çelişkisini büyütür. Bu yüzden atom katmanı, CLM directive'lerinin **önkoşuludur** — CLM fleet'ini bu rapor için bilinçli olarak beklettim.

---

## 8. Öneri + sıralama (test-önce → şema → geliştirme)

Aktör-açık akış: **insan** atom katalogunu ve tip terfilerini onaylar (kanonik karar); **ajan** directive + şema taslağı + test-vektörü önerir (draft); **CI** yeni bir atom-conformance kapısıyla her tipin 13 boyutu beyan ettiğini zorlar; **motor** yalnız onaylı, parametreli tipi türetir.

Sıra (senin yazılım kuralın: önce test, sonra şema, sonra geliştirme):

1. **Atomik-tip CONTRACT directive yaz** (`docs/atomic-types-directive.md` veya `k-fieldtype-directive.md`): dört katman (A/B/C/D) + her tip için 13 sözleşme boyutu + registry bağımlılıkları (ISO-4217/UCUM/ISO-3166). Bu, `atomic-types.json`'ı `backlog`'tan gerçek spesifikasyona çıkarır.
2. **Test-önce (kırmızı):** her atom için conformance test-vektörü — Money yuvarlama/precision, Measure boyut-uyuşmazlığı (`kg`+`lb` → hata), I18nText fallback zinciri, locale collation sırası (`İ/ı`), null≠empty≠zero. Test önce yazılır, sonra tip yeşile getirilir.
3. **Şema terfisi:** `FieldTypeSchema` düz 14-enum'dan **katmanlı + parametreli** tip modeline geçer (geriye-uyumlu: eski enum değerleri alias olarak korunur, `protected`/expand-contract ile). `FieldSchema`'ya per-tip parametre alanı eklenir. Çelişki A1 düzeltilir: `currency` → `Money`.
4. **Geliştirme (platform reposu, bu repo değil):** TypeDecorator kütüphanesi + registry'ler; her tip test-önce yeşil.
5. **Ancak bundan SONRA** archetype üretimi (CLM dahil) sağlam zemine oturur.

**Güvenli vs riskli:** *Riskli* olan, atom katmanını atlayıp archetype'lara (CLM) devam etmek — her archetype eksik atomu ad-hoc uydurur, drift ve para hatası birikir. *Güvenli/enterprise* olan, atom sözleşmesini test-önce kilitleyip archetype'ları ona bağlamak. *Pratik öneri (senin durumun):* bu raporu onayla → 1-2. adımları bu ortamda üreteyim (directive + test-vektörü + şema taslağı, hepsi mevcut CI yeşil kalacak) → sonra CLM fleet'i bu zemin üstünde koşsun.

---

## 9. `atomic-types.json` düğümüne ne yazılmalı (backlog → spec)

Düğüm bugün üç başlık taşıyor; olması gereken: (a) dört-katmanlı tip kataloğu (A/B/C/D), (b) her tip için 13 sözleşme boyutunun beyanı, (c) registry bağımlılıkları, (d) `check-atomic-types` conformance kapısı referansı, (e) `standardRefs` ile c13n/i18n/security standartlarına bağ (kural kopyalanmaz, bağlanır). Bu yapıldığında düğüm `backlog`'tan `requirements→test-plan` fazına geçebilir ve üstündeki tüm archetype'lar ona `dependsOn` verir.

---

## 10. Tek cümlelik sıradaki adım

**Atom katmanını (dört katman + 13 boyut + registry'ler) test-önce bir directive olarak kilitle; `currency→Money` çelişkisini düzelt; ancak sonra CLM dahil archetype üretimine dön** — çünkü archetype'ın gücü, altındaki atomun sözleşmesinden fazlası olamaz.
