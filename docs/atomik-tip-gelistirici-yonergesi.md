# Atomik Tip Geliştirici Yönergesi — Atom / Fragment / ArcheType Seçimi

**Tarih:** 2026-07-01
**Durum:** AI-DRAFT (insan onayı bekler). Eyleme-dönük geliştirici/ajan rehberi; **kanonik şema veya standart yazmaz** — bir alanı/varlığı tasarlarken kademeyi nasıl seçeceğini ve nasıl beyan edeceğini adım adım gösterir.
**Kapsam:** Bir geliştirici veya AI ajanı bir ArcheType alanı tasarlarken karşılaştığı tek soruyu çözer: *"Bu alan atom mu, fragment mi, archetype mı ve nasıl beyan ederim?"*
**Kaynak sözleşmeler (REFERANS — kopyalama):** `docs/atomik-netlestirme-2026-07-01.md` (3 kademe, 5-test, atomicity checklist §11, sınır tabloları — ANA KAYNAK), `docs/atom-archetype-bagi-clm-ornegi-2026-07-01.md` (CLM worked örneği), `AGENTS.md` (test-önce, referans-ver, kısa-kod), ileride `docs/atomic-types-directive.md` + `docs/fragments-directive.md` (kanonik atom/fragment sözleşmeleri; bu yönerge onlara işaret eder).

---

## 1. Bu rehber nedir / ne yapar / ne yapmaz

**Nedir:** Bir alanı/varlığı tasarlarken kademe (atom/fragment/archetype) seçme ve beyan etme prosedürü. Kararı 5-testlik deterministik bir akışa, beyanı ise atomun 13 sözleşme boyutuna ve fragmentin storage/cross-field beyanına bağlar.

**Ne yapar:** Karar akışını metin-tabanlı adım adım verir; her kademe için hangi bilgiyi beyan edeceğini listeler; iki worked örnek (CLM Agreement, PIM Product) üstünden kararı gösterir; anti-pattern'leri ve test-önce çıkarımı somutlaştırır; ArcheType alanının atom/fragment'e `dependsOn` bağını ve CI kapısını netleştirir.

**Ne yapmaz:** Yeni atom/fragment kataloğu tanımlamaz (kanonik katalog `atomic-types-directive.md`/`fragments-directive.md`'de yaşar). `FieldTypeSchema`/`FragmentSchema`'yı değiştirmez. Yeni `app`/`module` üretmez. Kanonik sözleşme JSON'larını yeniden yazmaz — yalnız onlara nasıl bağlanacağını gösterir (bkz. `AGENTS.md §2`, §7). İmplementasyon kodu yazmaz; kod örnekleri minimal tutulur, asıl vurgu **karar ve beyandır**.

**Aktörler.** *İnsan* kademe kararını ve yeni fragment/atom önerisini onaylar; *ajan* alan taslağını ve `dependsOn` bağını önerir; *motor* atom/fragment sözleşmesinden DB/API/Surface/index/i18n projeksiyonunu deterministik türetir; *CI* (`check-atomic-types`/`check-fragments`) beyanın eksiksizliğini zorlar. Sen (geliştirici/ajan) bu rehberde **karar veren ve beyan eden**sin; kanonik sözleşmeyi yazan değil.

---

## 2. Karar prosedürü — 5-test adım adım

Bir alanın kademesi beş ortogonal testin sırayla uygulanmasıyla belirlenir. Testleri **verilen sırada** uygula; ilk "evet" kademeyi kilitler ve dur. Sıra önemlidir: kimlik ayrıştırmadan, ayrıştırma bütün-değerden önce gelir — çünkü kimlikli bir varlık aynı zamanda çok-alanlıdır, ama doğru cevap ArcheType'tır, Fragment değil. Kaynak: `atomik-netlestirme §3` ve atomicity checklist `§11`.

Aşağıdaki akış, her adımda "evet ise ne olur / hayır ise nereye gidersin" biçiminde ilerler. ASCII/kutu çizimi yoktur; akış metinle tanımlıdır.

**Adım 1 — Kimlik testi.**
Soru: Bu şeyin kendi kimliği (id), yaşam döngüsü (durum geçişleri), ilişkileri ve izin sınırı (RLS/tenant) olması gerekiyor mu? Bağımsız yaşıyor ve başka kayıtlar ona **referans veriyor** mu?
- **Evet →** kademe **ArcheType**. Dur. (Bölüm 5'e git: kimlik/ilişki/izin/yaşam-döngüsü beyanı.)
- **Hayır →** Adım 2'ye geç.

**Adım 2 — Ayrıştırma testi.**
Soru: Birden çok, **bağımsız anlamlı** alt-alanı var mı? "Bağımsız anlamlı" testi: alt-alan ayrı sorgulanıyor, ayrı doğrulanıyor veya ayrı facet'leniyor mu? (Örn. Address'in `city`'si tek başına filtrelenir; posta-kodu ülkeye bağlı doğrulanır.)
- **Evet →** kademe **Fragment**. Dur. (Bölüm 4'e git: platform_fragments'tan tüketim veya yeni fragment önerisi + cross-field + storage beyanı.)
- **Hayır →** Adım 3'e geç.

**Adım 3 — Bütün-değer testi.**
Soru: Tek anlamı olan, bir bütün olarak (değer semantiğiyle) karşılaştırılan/eşitlenen, kanonik formu olan bir değer mi?
- **Evet →** kademe **Atom** (adaydır; Adım 4 ve 5 bunu doğrular/reddeder). Bölüm 3'e git.
- **Hayır →** modelleme hatası: alan ne kimlikli, ne çok-alanlı, ne de kanonik bir değer. Ya alan gereksizdir ya da tanım eksiktir. İnsana geri dön; tahminle atom deme.

**Adım 4 — Operasyon testi (atomu doğrular).**
Soru: Bütün-değer üstünde anlamlı işlemleri var mı (aritmetik, çakışma/kapsama, mesafe, üretim)? İç parçaları bu işlemin **parametresi/ucu** mu (Money'nin currency'si, Range'in başlangıç/bitişi, GeoPoint'in SRID'si, decimal'in precision'ı)?
- **Evet →** sağlam **Atom**. Bölüm 3'te parametrelerini ve 13 boyutu beyan et.
- **Hayır (işlemi yok ama tek kanonik değer) →** yine Atom, ama muhtemelen Katman A/B taban değeri (string, uuid, Email gibi) — parametreleri daha sadedir.

**Adım 5 — Genişletme testi (fragment/archetype'ı doğrular).**
Soru: Tenant bu şeye alan ekleyebiliyor mu? Alanları per-alan i18n / per-alan izin (PII-sınıf) taşıyor mu?
- **Evet →** bu bir Atom değildir. Kimliği varsa (Adım 1'e geri dön) **ArcheType**, yoksa **Fragment**. Atom yaptıysan geri al.
- **Hayır →** Atom kararı sağlamdır.

**Kısa sezgi (tüm akışın özeti).** *"Parçaları parametre mi, alan mı?"* — Parçalar değerin parametresi/ucuysa (Money.currency, Range uçları) → **atom**. Parçalar kendi başına sorgulanan iş-alanıysa (Address.city) → **fragment**. Kendi kimliği varsa → **archetype**. Bu tek cümle beş testi kapsar; sınırda kaldığında `atomik-netlestirme §4` sınır tablosuna bak.

**Netleştirici kontrast (sık karışan çiftler).**

| Görünen ikili | Doğru kademe | Ayıran test |
|---|---|---|
| `full_name` (düz metin) vs `PersonName` (given/family) | Atom vs **Fragment** | Ayrıştırma: parçalar bağımsız anlamlı mı |
| `effective_range` (aralık) vs "başvuru + karar tarihi" (iki alan) | **Atom** `Range<date>` vs iki ayrı Atom | Bütün-değer: uçlar bir aralığın iki ucu mu, yoksa iki bağımsız olay mı |
| `Address` (gömülü) vs "Adresler tablosu" (paylaşılan/geçmişli) | **Fragment** vs **ArcheType** | Kimlik: başkası ona referans veriyor mu |

---

## 3. Atom seçtiysen: katman + parametre + 13 boyut

Adım 3-4 seni Atom'a getirdiyse üç şeyi beyan edersin: (a) hangi katman, (b) hangi tip-parametreleri, (c) 13 sözleşme boyutundan hangileri. Katman, atomun rolünü belirler; parametre, atomu somutlaştırır ve motor türetimini yönlendirir; 13 boyut, motorun DB→Surface projeksiyonunu deterministik üretmesini sağlar.

**Katman seçimi.** Atom üç katmandan birine oturur (`atomik-netlestirme §12`):

| Katman | Ne için | Örnekler | Ne zaman seçersin |
|---|---|---|---|
| **A — taban skaler** | DB-yakın ilkel değer | string, decimal, uuid, timestamptz, date, boolean, integer, bytea-ref | Semantiği yok, sadece tipli bir ilkel gerekiyor |
| **B — semantik değer** | İş anlamı taşıyan değer | Money, Measure, Percentage, I18nText, Email, Identifier, EnumType, `Range<T>`, Term, Recurrence | Değerin kuralı/birimi/formatı var |
| **C — referans-değer** | Başka bir varlığa tipli işaret | EntityRef, PartyRef, AssetRef, ClauseRef, ExternalId | Alan başka bir kaydı/varlığı gösteriyor (ilişki değil, değer olarak) |

Kural: Semantiği olan bir değeri Katman A'ya düşürme (parayı `decimal` yapma); referansı Katman B'ye sıkıştırma (PartyRef'i `string` yapma). Yanlış katman = kayıp sözleşme.

**Parametre beyanı.** Atom düz enum değil, **parametreli değer tipidir** (`atomik-netlestirme §5`). Parametreler `FieldSchema`'nın per-tip `params` alanına yazılır; `string(50)` ayrı bir tip değil, `string` + `{maxLength:50}`'dir. Aşağıdaki tablo en sık kullanılan atomların zorunlu parametrelerini verir; motor bunları okuyup türetir.

| Atom | Beyan edeceğin parametreler | Motor bununla ne türetir |
|---|---|---|
| `string⟨maxLength, collation, pattern⟩` | `{maxLength, collation?, pattern?}` | `varchar(n)` + collation sıralama + regex doğrulama |
| `decimal⟨precision, scale, rounding⟩` | `{precision, scale, rounding}` | `numeric(p,s)` + kesin aritmetik |
| `Money⟨currency-set, precision, rounding⟩` | `{currencies:[...], precision, rounding}` | izinli kur kümesi + minor-units + yuvarlama |
| `Measure⟨dimension, unit-system⟩` | `{dimension, unitSystem:"UCUM"}` | boyut-guard + birim dönüşümü |
| `Range⟨T, bound-closure⟩` | `{element:T, bounds:"[]"\|"[)"\|"()"}` | T'nin operatörleri + uç-açıklık |
| `EnumType⟨values, alias-ref, ordering, lifecycle⟩` | `{values:[...], aliasRef, ordering, lifecycle}` | değer kümesi + i18n etiket + deprecate |
| `Identifier⟨scheme, checksum-algo⟩` | `{scheme:"GTIN"\|"GLN"\|..., checksum}` | şema doğrulama + checksum |
| `PartyRef⟨target-kind, onDelete, scope⟩` | `{target, onDelete, scope}` | FK + silme politikası + PDP-scope |

**13 boyut beyanı.** Atom seçtiğinde motorun türetebilmesi için 13 sözleşme boyutunu beyan edersin (`atomik-netlestirme §11.5`; `atom-archetype-bagi §7` bir Money alanı üstünden bunu uçtan uca gösterir). Boyutlar: storage-mapping, validation, parameterization, null/empty/zero, compare/order, index, i18n, serialization, surface-projection, security (PII-sınıf), equality, computation, versioning. Uygulanmayan boyut için `applicability` yaz, jenerik dolgu üretme (`AGENTS.md §2`). `check-atomic-types` eksik boyutu bloklar.

Kritik boyut hatırlatması (en sık kaçan üçü):
- **null/empty/zero:** empty (bilinmiyor) ile 0 (bedelsiz/sıfır) **farklıdır**; Money'de bunu ayırmazsan yanlış toplama olur.
- **security/PII-sınıf:** NationalId/TaxId gibi kimlikler PII-sınıfı taşımalı; yoksa alan-düzeyi şifreleme/maskeleme türetilemez (KVKK/GDPR).
- **computation:** Money/Measure için kur/boyut-guard beyan edilmezse `CurrencyMismatch`/dimension hatası çalışma anında yakalanmaz.

Minimal beyan örneği (yapıyı gösterir, kanonik değil — asıl vurgu parametre + boyut):

```
field: total_value
type: Money
params: { currencies: ["EUR","TRY","USD"], precision: 2, rounding: "half-up" }
contract: {
  nullSemantics: "empty≠zero",
  security: "low",
  computation: "currency-guard",   // farklı kur toplanamaz
  // kalan boyutlar atom sözleşmesinden miras; uygulanmayan için applicability
}
```

---

## 4. Fragment seçtiysen: tüket veya öner + cross-field + storage

Adım 2 seni Fragment'e getirdiyse önce **tüketip tüketemeyeceğine** karar verirsin. Fragment kimliksiz, yeniden-kullanılabilir, atom-tipli alanlardan oluşan bir **kayıttır** (Address, PersonName, ContactPoint). Kanonik fragment kütüphanesi `platform_fragments`'tır (`atomik-netlestirme §6`).

**Karar: tüket mi, öner mi?**
- Aradığın fragment `platform_fragments`'ta **varsa** (Address, PersonName, ContactPoint gibi) → **tüket**. Kendi Address'ini açma; app'ler arası drift'in tam kaynağı budur ("PIM/HRMS/CLM aynı Address'i üç farklı biçimde uydurur"). Alanına `Address` fragment'ini bağla.
- Yoksa ve app'e-özel çok-alanlı bir değerse → **yeni fragment öner**. Ama: **yeni platform fragment insan onayı ister** (`AGENTS.md §7` — kanonik kütüphaneyi ajan tek başına genişletemez). Ajan taslak önerir; insan onaylar. Onaya kadar alanı geçici olarak app-özel fragment olarak işaretle, platform_fragments'a yazma.

**Beyan edeceğin iki şey (fragmentte atomdan farklı olarak).** Fragment tanımı iki ek beyan taşır (`atomik-netlestirme §6, §7.1`):

| Beyan | Ne demek | Nasıl karar verirsin |
|---|---|---|
| **Cross-field validation** | Alanlar-arası kural (tek alan değil) | Address: posta-kod `country`'ye bağlı doğrulanır. Alanlar birbirine bağımlıysa kuralı fragment düzeyinde beyan et |
| **Storage stratejisi** | Gömülü (JSONB, tek kolon) mü, normalize (alt-tablo) mi | Aşağıdaki storage kararı |

**Storage kararı (`storage: embedded \| normalized`).**
- Fragment **tek bir üst kayda ait** ve **bağımsız sorgulanmıyorsa** → `embedded` (JSONB). Address genelde budur.
- Fragment **çok sayıda** olabiliyor ve **bağımsız sorgulanıyor/facet'leniyorsa** (ör. "İstanbul'daki tüm taraflar") → `normalized` (alt-tablo veya generated-column index).
- Kararı fragment tanımında **beyan et**; motor ona göre türetir. "Her şeyi JSONB'ye göm" ile "her şeyi tablo yap" ikilisinin ortası budur.

**Sınır (fragment ne değildir).** Fragment'in kimliği yoktur; başka kayıtlar ona `PartyRef` gibi **referans veremez**. Referans gerekiyorsa (adres paylaşımı, adres geçmişi) fragment bir ArcheType'a **terfi eder** — bu Adım 1 (kimlik testi) kararıdır. `check-fragments` embedded/normalized ve cross-field beyanını zorlar.

---

## 5. ArcheType seçtiysen: kimlik/ilişki/izin/yaşam-döngüsü + dependsOn

Adım 1 seni ArcheType'a getirdiyse bu bir **kimlikli varlıktır** (Party, Contract, Product). ArcheType, Fragment + kimlik + yaşam döngüsü + ilişki + izin demektir (`atomik-netlestirme §2`). Burada senin işin ArcheType'ın **kimlik/ilişki/izin/yaşam-döngüsü**ni beyan etmek ve her alanının doğru atom/fragment'e `dependsOn` vermesini sağlamaktır.

Beyan edeceğin dört ArcheType-düzeyi şey:

| Boyut | Ne beyan edersin | Örnek |
|---|---|---|
| **Kimlik** | `id` (uuid atomu), `tenant_id`, PK | `Contract.id : uuid` |
| **İlişki** | Diğer ArcheType'lara `RelationSchema` (m2m/1n) — referans-değer atomundan farklı, ilişki düzeyi | `Contract → Party` (parties) |
| **İzin** | RLS/tenant izolasyonu, PDP-scope | tenant-scoped RLS |
| **Yaşam döngüsü** | durum makinesi (`status` EnumType) + geçiş kuralları | `draft→active→renewal→terminated` |

**Kritik bağ: her alan bir atom/fragment'e `dependsOn` verir.** ArcheType'ın kendisi doğrudan DB tipi taşımaz; her alanı **altındaki atom veya fragment'in sözleşmesinden** türer (`atom-archetype-bagi §1`: "atom → field → archetype → surface"). Tez: **bir ArcheType, altındaki atomların sözleşmesinden daha güçlü olamaz.** Yani ArcheType tasarımın, alanların 2-4. bölümlerdeki kararlarının toplamıdır. Bir alan eksik atoma dayanırsa (`Money` yerine düz `number`), motor o alanı türetemez ve ArcheType'ın o kısmı sessizce çöker.

`dependsOn` ve CI bağı Bölüm 10'da detaylanır.

---

## 6. Worked örnek 1 — CLM Agreement alanları

Bu örnek, gerçek bir CLM `archetype-agreement` alanları üstünden 5-test kararını çalıştırır (kaynak: `atom-archetype-bagi §2`). Her alan için hangi teste takıldığını ve sonucu gösterir. Amaç kararı görmek; değer üretmek değil.

| Agreement alanı | Karar akışı (hangi test) | Sonuç kademe + beyan |
|---|---|---|
| `total_value` (60.000 EUR) | Adım 1 hayır (kimliksiz), Adım 2 hayır (currency parçası bağımsız değil, parametre), Adım 3 evet (bütün-değer), Adım 4 evet (toplanır, kur-guard) | **Atom** `Money⟨currencies, precision:2, rounding⟩`; boyut: empty≠zero, computation:currency-guard |
| `effective_range` (başlangıç–bitiş) | Adım 2 hayır (uçlar bir aralığın iki ucu, bağımsız iş-alanı değil), Adım 3 evet, Adım 4 evet (overlap/contains) | **Atom** `Range<date>⟨bounds:"[)"⟩` |
| `parties[]` | Adım 1: Party'nin kendi kimliği var → alan bu varlığa **referans-değer** | **Atom (Katman C)** `PartyRef⟨target:Party, onDelete, scope⟩` (Party'nin kendisi ArcheType) |
| `title` | Adım 2 hayır, Adım 3 evet (tek değer, ama çok-dilli) | **Atom** `I18nText` (fallback + dil-ekleme parametresi) |
| `address` (taraf adresi) | Adım 2 **evet** (city/postal/country bağımsız sorgulanır/doğrulanır) | **Fragment** `Address`; `platform_fragments`'tan **tüket**; storage: embedded; cross-field: posta-kod↔country |
| `renewal_rule` (yıllık auto-renew) | Adım 3 evet (tek kural), Adım 4 evet (sonraki-tarih üretimi) | **Atom** `Recurrence⟨RRULE⟩` |
| `tax_id` | Adım 2 hayır (tek kimlik değeri + checksum parametresi), Adım 3 evet | **Atom** `Identifier`/`TaxId`; boyut: security:PII-sınıf zorunlu |
| `contract_type` (NDA/satış/kira) | Adım 3 evet (tek kimlik), etiket ayrı alias | **Atom** `EnumType⟨values, aliasRef, i18n, lifecycle⟩` |

Sonuç: Agreement'ta kademeler net ayrışır — Money/Range/PartyRef/EnumType/Identifier **Atom**; Address **Fragment**; Party/Contract **ArcheType**. Hiçbir çok-alanlı yapı atoma zorlanmadı, hiçbir tekil değer gereksiz tabloya bölünmedi.

---

## 7. Worked örnek 2 — PIM Product alanları

Aynı prosedür farklı bir domaine (PIM — ürün bilgi yönetimi) uygulanır. Bu, kuralın domain'den bağımsız olduğunu gösterir. Alanlar tipik bir `archetype-product` üstünden seçildi.

| Product alanı | Karar akışı (hangi test) | Sonuç kademe + beyan |
|---|---|---|
| `price` | Adım 2 hayır (currency parametre), Adım 3 evet, Adım 4 evet (aritmetik, kur-guard) | **Atom** `Money⟨currencies, precision, rounding⟩`; empty≠zero (fiyat yok ≠ bedava) |
| `weight` | Adım 2 hayır (unit boyut parametresi), Adım 3 evet, Adım 4 evet (boyut-güvenli çarpım/dönüşüm) | **Atom** `Measure⟨dimension:mass, unitSystem:UCUM⟩` |
| `gtin` | Adım 2 hayır (tek kimlik + checksum), Adım 3 evet | **Atom** `Identifier⟨scheme:GTIN, checksum⟩` |
| `name` | Adım 3 evet (tek değer, çok-dilli) | **Atom** `I18nText⟨fallback, collation⟩` (Türkçe İ/ı collation boyutu) |
| `attributes` (renk, beden, malzeme…) | Adım 5 **evet** (tenant alan ekler, açık uçlu, per-alan i18n) → atom değil; kimliksiz → **Fragment** (veya EAV-benzeri AttributeSet fragment'i) | **Fragment** `AttributeSet`; storage: normalized (bağımsız facet'lenir: "kırmızı ürünler") |
| `dimensions` (en×boy×yükseklik) | Adım 2 kenar durum: üç Measure alanı, ama birlikte "kutu boyutu" | **Fragment** (üç `Measure` alanı) **veya** üç ayrı `Measure` atomu — bağımsız facet'leniyorsa fragment, sadece birlikte gösteriliyorsa üç atom |
| `category` | Adım 1: kategori ağacının kendi kimliği/hiyerarşisi var → alan buna **referans** | **Atom (Katman C)** `EntityRef⟨target:Category⟩` (Category ayrı ArcheType) |

Netleştirici karar (`attributes`): PIM'de açık-uçlu, tenant-genişletilebilir, per-facet sorgulanan öznitelik seti klasik **genişletme testi (Adım 5)** vakasıdır — asla atom değil. `attributes`'ı tek bir `json` alanına gömmek anti-pattern'dir (Bölüm 8); doğrusu facet'lenebilir bir Fragment'tir.

---

## 8. Anti-patterns — yapma

Aşağıdaki desenler motoru kör eder: alan görünürde çalışır ama motor sözleşmeyi türetemez, drift ve sessiz hata üretir. Her satır, yanlış kararın somut sonucunu ve doğru kademesini verir (kaynak: `atom-archetype-bagi §6`).

| Anti-pattern | Neden yanlış (somut) | Doğrusu |
|---|---|---|
| Çok-alanlı değeri tek `json`'a gömmek | Motor city facet / posta-kod doğrulama / per-alan i18n türetemez; büsbütün kör | **Fragment** (Address/AttributeSet), storage beyanıyla |
| Parayı `string` veya `number` tutmak | Kur kaybolur; 60.000 EUR + 60.000 TRY toplanır; float yuvarlama hatası; empty≠zero ayrımı yok | **Atom** `Money⟨currency, precision, rounding⟩` |
| Düz enum (alias/i18n yok) | `status` düz string; dile-özel etiket ve deprecate yok; global kullanıcı yanlış etiket görür | **Atom** `EnumType⟨values, aliasRef, lifecycle⟩` |
| Binary'yi (dosya/görsel) DB'ye gömmek | DB şişer; URL sızar; imzalanan doküman referansı çözülmez | **Atom (Katman C)** `AssetRef` — binary k-storage'da, DB'de yalnız referans+checksum |
| Address'i **atom** yapmak | Motor çok-alanlı yapıyı tek opak değer sanır; form/validasyon/arama türetilemez (U1 kararı) | **Fragment** `Address` |
| Bağımsız-sorgulanan fragment'i `embedded` saklamak | "İstanbul'daki tüm taraflar" sorgusu JSONB içinde facet'lenemez, yavaş/imkânsız | `storage: normalized` beyan et (alt-tablo/generated-column) |
| Kimlikli varlığı Fragment yapmak | Paylaşım/geçmiş/referans gerektiğinde çöker; başkası ona referans veremez | **ArcheType**'a terfi (kimlik testi) |

---

## 9. Test-önce — atomu kullanmadan önce yazılacak test-vektörü

`AGENTS.md §3`: bu repoda davranış değiştiren hiçbir şey testsiz girmez; **önce kırmızı test, sonra yeşil**. Bir atomu bir ArcheType alanında kullanmadan önce, o atomun seni koruyan test-vektörü kırmızıdan yeşile geçmelidir (`atom-archetype-bagi §9`). Sıra: testi yaz (kırmızı) → atom sözleşmesini/parametresini beyan et → yeşile getir → ancak sonra alanı ArcheType'a bağla.

Aşağıdaki tablo en sık kullanılan atomlar için yazılacak test-vektörünü ve kabul kriterini verir. Bu testler yeşil değilse alanı "hazır" sayma.

| Atom | Yazacağın test-vektörü | Kabul (yeşil) |
|---|---|---|
| `Money` (kur-karışımı) | 60.000 EUR + 60.000 TRY topla | `CurrencyMismatchError` fırlatılır (sessiz toplama yok) |
| `Money` (empty≠zero) | fiyatı olmayan vs 0 fiyatlı kayıt | ayrı saklanır, ayrı sorgulanır |
| `Range<T>` (overlap) | iki aralığın çakışması/kapsaması | doğru boolean; uç-açıklık (`[)`) doğru |
| `Measure` (boyut) | mass + length toplama denemesi | dimension-guard reddeder |
| `string`/`I18nText` (collation) | Türkçe İ/ı sıralama | locale-collation doğru sıralar |
| `Identifier` (checksum) | geçersiz GTIN | reddedilir; geçerli kabul |
| `Recurrence` (sonraki-tarih) | yıllık RRULE'dan sonraki tarih | doğru üretim |
| Fragment `Address` (cross-field) | ülkeye uymayan posta-kod | cross-field kural reddeder |

Kural: test kırmızıysa atom hazır değildir; hazır olmayan atoma dayanan alan ArcheType'a **girmez** — aksi halde motor eksik atomu türetemez ve Bölüm 8'deki kırılmalar üretime sızar.

---

## 10. Archetype yazımına bağ — dependsOn + CI kapıları

Bu rehberdeki her karar, ArcheType düğümünde tek bir bağa dönüşür: **her ArcheType alanı, seçtiği atom veya fragment'e `dependsOn` verir.** Bu bağ, motorun projeksiyon zincirini (`atom → field → archetype → surface`) kurar ve CI'ın atom/fragment-conformance'ı zorlamasını sağlar.

Bağın nasıl kurulduğu:
- Bölüm 3'te bir alanı Atom'a karar verdiysen, alanın `dependsOn` değeri o atomun kanonik id'sidir (ör. `Money`, `Range<date>`, `PartyRef`) ve parametreleri `params`'a yazılır.
- Bölüm 4'te Fragment'e karar verdiysen, `dependsOn` o fragment'in id'sidir (ör. `Address`) ve storage/cross-field fragment tanımından gelir.
- Bölüm 5'te ArcheType-düzeyi ilişki (Party→Contract) `RelationSchema`'ya yazılır — bu referans-değer atomundan (PartyRef) farklı bir katmandır.

CI kapıları (test-önce yazılır; `atomik-netlestirme §13`, `AGENTS.md §5`):

| Kapı | Ne zorlar | Kırmızıysa |
|---|---|---|
| `check-atomic-types` | Alanın dayandığı atom katalogda var; 13 boyut beyanı eksiksiz; parametreler geçerli | merge bloklanır |
| `check-fragments` | Fragment `platform_fragments`'ta çözülür; storage (embedded/normalized) ve cross-field beyan edilmiş | merge bloklanır |

Kural: Bir ArcheType alanının `dependsOn`'u çözülmüyorsa (atom/fragment yok veya beyanı eksik), o ArcheType "hazır" değildir. ArcheType üretimine başlamadan önce, dayandığı atom ve fragment'lerin katalogda tanımlı ve test-yeşil olması gerekir — bu, `atom-archetype-bagi §8-9`'un doğrudan sonucudur: **atom katmanı test-önce kilitlenmeden ArcheType fleet'i sağlam kurulmaz.**

---

## 11. Tek cümlelik sonuç

Bir alanı tasarlarken **beş testi sırayla uygula** (kimlik→ayrıştırma→bütün-değer→operasyon→genişletme): ilk "evet" kademeyi kilitler — kimlik varsa **ArcheType** (kimlik/ilişki/izin/yaşam-döngüsü + alan-başı `dependsOn`), bağımsız-anlamlı çok-alansa **Fragment** (`platform_fragments`'tan tüket veya insan-onaylı öner + storage/cross-field beyanı), tek kanonik değerse **Atom** (katman + parametre + 13 boyut); her kararı test-önce doğrula, kanonik sözleşmeye (`atomic-types-directive.md`/`fragments-directive.md`) **referans ver, kopyalama** (`AGENTS.md §2`), ve `check-atomic-types`/`check-fragments` yeşil olmadan ArcheType'ı "hazır" sayma.
