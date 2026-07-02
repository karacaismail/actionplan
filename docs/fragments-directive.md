# Fragment Yönergesi — Mini-ArcheType Kademesi ve `platform_fragments` Kanonik Fragment Kütüphanesi

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §13 DoD, ADR-F1). AI-DRAFT: **davranış sözleşmesi yazar; implementasyon kodu ve kanonik şema yazmaz.** Fragment kademesinin sözleşmesini normatif tanımlar; `FragmentSchema` zenginleştirmesini yalnızca **önerir** (insan onayı → motor uygular).
**Kaynak/bağlam:** `docs/atomik-netlestirme-2026-07-01.md` (nihai model — U1 kararı: Address=Fragment §1, üç kademe §2, `platform_fragments` §6, motor muamelesi + storage kuralı §7). ANA KAYNAK. `src/schemas/archetype.ts` (`FieldSchema`, `FragmentSchema` — satır 93-113, mevcut `{id, label, fields[]}`). `k-storage-dam-directive.md` (17-bölüm yapı şablonu; kardeş kernel-primitif deseni). `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı).
**İlişki:** Bu doküman `atomic-types-directive`'in (atom kademesi, `platform_fieldtypes`) **kardeşidir**: o "bölünemez değer nedir, motor ondan 13 boyutu nasıl türetir?" sorusunu, bu doküman "çok-alanlı kimliksiz kayıt (Fragment) nedir, `platform_fragments` nasıl kanonikleşir, motor onu nasıl türetir?" sorusunu yanıtlar. Fragment, atom ile ArcheType **arasındaki** kademedir (netleştirme §2). Bu doküman **kod yazmaz**; Fragment kademesinin davranış sözleşmesini sabitler. Makine-okunur karşılığı (Zod şema terfisi, SQLAlchemy türetimi, Alembic göçü, Strawberry tipi) ADR-F1 kilitlendiğinde ajan-draft + insan-onay ile ilgili repolarda üretilir.

---

## 1. Amaç

Bu sözleşme, çok-alanlı ve alt-alanları bağımsız anlamlı olan yeniden-kullanılabilir değer-kayıtlarının (Address, PersonName, ContactPoint) tek bir kanonik platform tanımında (`platform_fragments`) yaşamasını sabitler. Hedef: 50 uygulamanın hiçbirinin kendi Address'ini, kendi PersonName'ini veya kendi ContactPoint'ini yeniden uydurmaması (netleştirme §6: "PIM/HRMS/CLM aynı Address'i üç farklı biçimde uydurur" sorunu); her app aynı Fragment'i tüketmesi; Fragment'in atom (opak bütün-değer) gibi görülüp form/validasyon/arama türetiminin kaybedilmemesi, `json` gibi görülüp motorun büsbütün körleşmemesi (U1 gerekçesi §1). Aktör-açık ifade: *ajan* Fragment tanımı, cross-field kuralı veya storage stratejisi **önerir** (draft); *insan* onaylar; *motor* onaylı Fragment'ten iç-içe nesneyi, bileşik widget'ı, per-alan index'i ve embedded/normalize DB şemasını deterministik ve geri-alınabilir türetir.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) Fragment kademesinin kesin (testable) tanımı — atom'dan ve ArcheType'tan farkı (§4); (2) `platform_fragments` kanonik fragment kütüphanesi kavramı (netleştirme §6); (3) üç kanonik Fragment sözleşme-şekli — Address, PersonName, ContactPoint (§5, alan+tip+amaç); (4) mevcut `FragmentSchema`'nın (archetype.ts:108) dört noktada zenginleştirme **önerisi** — cross-field validation, storage stratejisi beyanı, per-alan i18n + per-alan PII-sınıfı, reusability (§5, §7); (5) Fragment storage kararı — embedded JSONB vs normalize alt-tablo (netleştirme §7.1); (6) motor türetimi — kademe başına DB/API/Surface/index farkı (§7); (7) Fragment↔ArcheType terfisi — kimlik testi (§4, §11); (8) `check-fragments` CI kapısı önerisi (§12, §13); (9) çok-kiracılı izolasyon ve audit'in Fragment gömülü olduğunda üst-kayda düşmesi (§9); (10) WBS yerleşimi (§6). Backend, frontend, test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) Atom kademesi — bölünemez değer, `platform_fieldtypes`, 13 sözleşme boyutu, `Range<T>` `atomic-types-directive`'in işidir; Fragment atom-tipli alanlardan *oluşur* ama atomu tanımlamaz (netleştirme §5). (2) ArcheType kademesi — kimlik/yaşam-döngüsü/ilişki/izin `archetype.ts` `ArchetypeContractSchema`'nın işidir; Fragment'in kimliği yoktur (§4, §11). (3) Kanonik şema/kod yazımı — bu doküman `FragmentSchema` (Zod) değişikliğini yalnız **önerir**; kesin değişiklik ADR-F1 kilidinden sonra insan-onaylı yapılır (§5). (4) Fragment içindeki alanların *fiziksel binary'si* — bir Fragment bir görsele referans verirse bu `k-storage`'ın işidir; Fragment yalnız `asset_id` bağlar, binary tutmaz. (5) Serbest kodla cross-field kural — Fragment'in alanlar-arası kuralı yapısal ifadedir (`ValidationRuleSchema.expr` deseni), serbest çalıştırılan kod değildir (§5). (6) Fragment'e kimlik verme — bir Fragment'e id/tenant/RLS eklemek onu ArcheType'a **terfi** ettirir; bu artık Fragment kapsamı değildir (§11).

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Fragment (mini-archetype), atom-tipli alanlardan oluşan, **yeniden kullanılabilir** ve **kimliksiz** bir kayıttır (netleştirme §2). Kod tabanında karşılığı mevcut `FragmentSchema`'dır (archetype.ts:108 — "yeniden kullanılabilir alan grubu, composable"); bu sözleşme onun `platform_fragments` kanonik kütüphanesine **yükseltilmesini** tanımlar. Ayrım cümlesi (netleştirme §2): **atom bir değerdir; Fragment kimliksiz bir kayıttır; ArcheType kimlikli bir varlıktır.**

**Ne yapar:** Çok-alanlı bir değer-nesnesini (Address, PersonName, ContactPoint) tek platform tanımında toplar; her app aynı Fragment'i tüketir (kendi kopyasını açmaz); alt-alanlarını atom tipleriyle taşır (Address.country → EnumType/ISO-3166 atomu, ContactPoint.value → her kanal kendi atom tipi); alanlar-arası kuralı beyan eder (Address: posta-kod ülkeye bağlı); storage stratejisini beyan eder (`embedded|normalized`); per-alan i18n (Address label'ları) ve per-alan PII-sınıfı (PersonName PII-orta) taşır; kimlik gerekince ArcheType'a terfi eder (kimlik testi). Motor bu tanımdan API'de iç-içe nesne, surface'te bileşik widget, DB'de embedded JSONB veya normalize join, arama'da per-alan index türetir (§7).

**Ne yapmaz:** Kimlik taşımaz — kendi id'si, yaşam döngüsü, ilişkisi ve izin sınırı **yoktur** (netleştirme §6: "Fragment'in kimliği yoktur"). Bağımsız yaşamaz — yalnız bir ArcheType veya başka bir Fragment içine **gömülür** (embedded). Başka kayıtlar ona referans **veremez** — hiçbir kayıt bir Fragment'e `PartyRef` gibi bağlanamaz (o zaman ArcheType olur, §11). Atom değildir — alt-alanları bağımsız anlamlıdır (ayrı sorgu/doğrulama/facet), değerin parametresi/ucu değildir (netleştirme §3 kural: Address'in city'si bağımsız iş-alanı ≠ Money'nin currency'si parametre). ArcheType değildir — kimlik/yaşam-döngüsü/ilişki/izin yoktur. Kalıcılığı tek başına kararlaştırmaz — gömülü olduğu üst-kaydın tenant/RLS/audit bağlamına tabidir (§9).

## 5. Sözleşme şekli (Fragment şeması + kanonik Fragment'ler)

Aşağıdaki tablolar Fragment kademesinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Alan tipleri atom kademesi tipleridir (netleştirme §5: Fragment atom-tipli alanlardan oluşur); standartlar (ISO-3166, UCUM, E.164) **referansla** anılır, sözleşmeye kopyalanmaz.

### 5.1 `FragmentSchema` zenginleştirme önerisi (kanonik — insan onayı → motor uygular)

Mevcut `FragmentSchema` (archetype.ts:109 — `{id, label, fields[]}`) `platform_fragments` rolünü üstlenmek için dört noktada zenginleştirilmelidir (netleştirme §6: üç zenginleştirme + reusability'nin platform-katman paylaşımı). Bu bir **öneridir**; kanonik Zod değişikliği ADR-F1 kilidinden sonra insan-onaylı yapılır. Aşağıdaki tablo önerilen ek alanları *alan+tip+amaç* olarak verir.

| Önerilen alan | Tip | Amaç |
|---|---|---|
| `crossFieldRules` | `ValidationRuleSchema[]` (alan-üstü) | Alanlar-arası kural (Address: posta-kod ülkeye bağlı doğrulanır); bugün `FieldSchema` yalnız tek-alan doğrular — Fragment'e alanlar-arası kural gerekir (netleştirme §6). Yapısal ifade, serbest kod değil. |
| `storage` | Enum(embedded, normalized) | Fragment gömülü mü (JSONB tek kolon) yoksa normalize mi (ayrı alt-tablo, join)? Karar kuralı §7.1; Fragment tanımı beyan eder, motor ona göre türetir (netleştirme §7.1). |
| `field.i18n` | per-alan I18nText beyanı | Fragment platform-katman paylaşılır; alan label'ları per-alan çok-dilli (Address label'ları) taşır (netleştirme §6). |
| `field.piiClass` | per-alan Enum(none, low, medium, high) | Alan-düzeyi güvenlik-sınıfı (PersonName PII-orta, Address PII-orta); mevcut `FieldSchema.pii` boolean'ının sınıf-ölçeğine genişletilmesi (netleştirme §6, U10 açığı). |
| `reusableFrom` | Enum(platform, app) | Fragment'in kanonik (`platform_fragments`) mi yoksa app-özel mi olduğu; platform-katman paylaşım kaynağını işaretler (netleştirme §6, §12). |

### 5.2 Kanonik Fragment: `Address`

Address bir mini-archetype'tır (netleştirme §1, U1 kararı); alt-alanları bağımsız anlamlıdır — şehre göre sorgu, ülkeye-bağlı posta-kod doğrulama, ülkeye göre facet, ülkeye göre i18n adres-düzeni. Bu tablo Address Fragment'inin alanlarını *alan+tip+amaç* olarak tanımlar.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `street` | string (per-alan i18n) | Sokak/cadde satırı; ülkeye göre adres-düzeni sırasında yer alır |
| `city` | string (facet'lenir) | Şehir; bağımsız sorgu/facet ekseni ("İstanbul'daki tüm taraflar", netleştirme §7.1-b) |
| `postal` | string (cross-field doğrulanır) | Posta kodu; formatı `country`'ye bağlı doğrulanır (cross-field kural, netleştirme §6) |
| `region` | string (nullable) | İl/eyalet/bölge; ülkeye göre opsiyonel/zorunlu |
| `country` | EnumType (ISO-3166-1 alpha-2 referansı) | Ülke; kanonik değer kümesi ISO-3166 standardına referans; posta-kod ve adres-düzeni bu alana bağlıdır |

Cross-field kural (beyan): `postal` alanı `country`'ye bağlı doğrulanır (ISO-3166 ülkesine göre posta-kod formatı); tek-alan doğrulama bunu ifade edemez, bu yüzden `crossFieldRules`'ta yaşar (§5.1). Storage varsayılanı: `embedded` (Address genelde tek üst-kayda ait ve bağımsız sorgulanmaz — netleştirme §7.1-a); `city` facet gerekirse generated-column index (§7.1-b).

### 5.3 Kanonik Fragment: `PersonName`

PersonName bir Fragment'tir (netleştirme §4): given/family bağımsız anlamlıdır (family'ye göre sırala, given göster, i18n ad-düzeni). Netleştirme kontrastı: `PersonName` **Fragment** ama düz `full_name` **Atom** (`string`) — fark, parçaların bağımsız anlamlı olmasıdır. Bu tablo PersonName Fragment'inin alanlarını tanımlar.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `given` | string (per-alan i18n) | Ad; gösterimde öne çıkar; i18n ad-düzenine göre sıralanır |
| `family` | string (sıralama anahtarı) | Soyad; family-bazlı sıralama/gruplama ekseni (bağımsız anlamlı) |
| `middle` | string (nullable) | Orta ad/ikinci ad; ülke/kültüre göre opsiyonel |
| `prefix` | string (nullable) | Unvan öneki (Dr., Prof. — sabit metin değil, alan); i18n'e tabi |

Ad-düzeni kuralı (beyan): gösterim sırası (given-family vs family-given) locale'e bağlıdır; per-alan i18n bunu taşır (§5.1). PII-sınıf: `medium` (netleştirme §6). Storage varsayılanı: `embedded` (Party ArcheType'ına gömülü).

### 5.4 Kanonik Fragment: `ContactPoint`

ContactPoint bir Fragment'tir (netleştirme §4): alanlar bağımsız; her kanal kendi atom tipini taşır. Bu tablo ContactPoint Fragment'inin alanlarını tanımlar.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `kind` | EnumType (email, phone, url, …) | Kanal türü; `value`'nun hangi atom tipiyle doğrulanacağını belirler |
| `value` | polimorfik atom (kanal-bağlı) | İletişim değeri; `kind=email`→Email atomu, `kind=phone`→Phone atomu (E.164 referansı), `kind=url`→URL atomu (netleştirme §4: her kanal kendi atom tipini taşır) |
| `priority` | integer | Öncelik/sıra; birden çok ContactPoint arasında tercih sırası |

Cross-field kural (beyan): `value` alanının atom-tipi `kind`'e bağlıdır (kanal-bağlı doğrulama); `crossFieldRules`'ta yaşar. ContactPoint bir ArcheType'a `ContactPoint[]` olarak (çokluk) gömülür (netleştirme §9: `Party.contacts[]`).

## 6. WBS / kernel yerleşimi

`platform_fragments`, kernel/layer0 kümesine `platform_fieldtypes`'ın (atom kütüphanesi) **kardeşi** olarak eklenir (netleştirme §6: "atom kütüphanesinin kardeşi olan bir `platform_fragments`"); atom kütüphanesine teknik olarak bağlıdır çünkü Fragment atom-tipli alanlardan oluşur (Fragment'in alanları atom tiplerini kullanır — netleştirme §5). Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `platform_fragments` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `platform_fragments` | module | `platform_fieldtypes` | kernel/layer0 |

`dependsOn` gerekçesi: `platform_fragments` atom kütüphanesine (`platform_fieldtypes`) teknik olarak bağlıdır — bir Fragment atom tipleri hazır olmadan tanımlanamaz (Address.country bir EnumType atomu, ContactPoint.value bir Email/Phone atomu). `related` ile (karar üretmeden) `atomic-types-directive` (kardeş atom kademesi), `archetype.ts` (Fragment'in gömüldüğü ArcheType), `k-storage` (bir Fragment görsel referansı taşırsa `asset_id` bağlar) düğümlerine bağlanır. Fragment'i tüketen her ArcheType düğümü kendi `dependsOn`'unda `platform_fragments`'ı listeler — yani Fragment kütüphanesi önce gelir, ArcheType Fragment'i gömer.

## 7. Backend gereksinimleri (motor türetimi + storage kararı)

Aşağıdaki gereksinimler netleştirme §7 (motor muamelesi — kademe başına türetim farkı) ve §7.1 (storage kararı) hükümlerini bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Stack: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL.

- **Motor türetimi (kademe-farkında):** Motor Fragment'i atom'dan ve ArcheType'tan **farklı** türetir (netleştirme §7). Fragment → API'de iç-içe nesne (nested object); surface'te bileşik widget (adres bloğu, per-alan); DB'de embedded JSONB **veya** normalize alt-tablo/join (§7.1); arama'da per-alan index (city facet, country filter). Motor bu türetimi Fragment tanımından okur — Fragment'i opak bütün-değer (atom) veya kör `json` gibi türetmek **yasak** (netleştirme §1 U1 gerekçesi).
- **Storage kararı (`embedded` vs `normalized`):** Fragment gömülü (JSONB) mü yoksa normalize (alt-tablo) mi saklanır? Karar kuralı (netleştirme §7.1): (a) Fragment **tek bir üst-kayda ait** ve **bağımsız sorgulanmıyorsa** → gömülü JSONB (Address genelde budur); (b) Fragment **çok sayıda** olabiliyor ve **bağımsız sorgulanıyor/facet'leniyorsa** ("İstanbul'daki tüm taraflar") → normalize alt-tablo veya generated-column index; (c) karar Fragment tanımında `storage: embedded|normalized` ile **beyan edilir**, motor ona göre türetir. Bu, "her şeyi JSONB'ye göm" ile "her şeyi tablo yap" ikilisinin ortasıdır. "Önce JSONB, sonra normalize et" göçü Alembic expand-contract ile geri-alınabilir yapılır.
- **Cross-field validation:** Fragment'in alanlar-arası kuralı (Address: posta-kod `country`'ye bağlı) motor tarafında `crossFieldRules`'tan türetilir; tek-alan doğrulamanın (`FieldSchema`) ötesindedir (netleştirme §6). Yapısal ifade değerlendirilir, serbest kod çalıştırılmaz.
- **Standart referansı (kopyalama yok):** Ülke kümesi ISO-3166'ya, telefon E.164'e, ölçü UCUM'a **referansla** doğrulanır; standart tablosu sözleşmeye gömülmez, registry-sürümüne bağlanır (netleştirme §5 params + katalog §7).
- **Async ağır iş:** Normalize Fragment'in toplu re-index'i veya "JSONB→normalize" göçü backfill'i ağır işse worker'a (Celery/ARQ) offload edilir; senkron istek yolunda değil.
- **Audit + hata formatı:** Fragment mutasyonu gömülü olduğu üst-kaydın audit'ine düşer (§9); `get_logger()` kullanılır, `print()` yasak; hata `{code, message, trace_id, details}`.

## 8. Frontend gereksinimleri

Aşağıdaki gereksinimler Vite + React + TanStack + React Hook Form/Zod yığınına ve config-driven surface ilkesine uyar; motorun Fragment→bileşik-widget türetimini (netleştirme §7 surface satırı) bağlar. Stil SCSS + token; ikon Phosphor (`ph-*`).

- **Bileşik widget (adres bloğu):** Fragment surface'te tek bir bileşik widget olarak render edilir (adres bloğu, isim bloğu) — alanları ayrı ayrı serpiştirilmez; per-alan alt-input'lar bir Fragment bloğu içinde gruplanır (netleştirme §7 surface satırı). Widget config-driven'dır; Fragment tanımından türetilir, hardcoded alan listesi **yasak**.
- **Per-alan doğrulama + cross-field:** RHF/Zod ile her alt-alan kendi atom-tipiyle, alanlar-arası kural (posta-kod ülke) Fragment düzeyinde doğrulanır; ülke değişince posta-kod formatı yeniden değerlendirilir.
- **i18n adres-düzeni:** Fragment alan sırası/etiketi locale'e bağlıdır (given-family vs family-given, ülkeye göre adres satır sırası); metin `I18nText` üzerinden, ham string gömülmez.
- **Erişilebilirlik:** WCAG 2.2 AA taban; her alt-input etiketli (Fragment per-alan i18n label'ından); dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1.
- **PII gösterimi:** `piiClass` yüksek alanlar surface'te maskeleme/erişim-sınırı ile gösterilir (PersonName/Address PII-orta); ham PII gereksiz yere serilmez.

## 9. Multi-tenant / RLS

Fragment'in **kendi tenant satırı yoktur** çünkü kimliği yoktur (§4); izolasyon gömülü olduğu üst-kayıttan gelir. İki durum: (1) `storage: embedded` — Fragment üst ArcheType satırının JSONB kolonundadır; üst satırın `tenant_id` + RLS'i (`USING (tenant_id = current_setting('app.current_tenant')::uuid)`) Fragment'i de kapsar; ayrı bariyer gerekmez. (2) `storage: normalized` — Fragment normalize alt-tabloya taşınırsa alt-tablo `tenant_id` taşır ve fail-closed RLS uygular (bağlam yoksa istek reddedilir); ayrıca üst-kayda FK ile bağlı kalır ve üst-kaydın tenant'ıyla tutarlılığı doğrulanır (cross-tenant Fragment satırı **yasak**). Fragment ArcheType'a **terfi ederse** (§11) artık tam ArcheType tenant/RLS sözleşmesine (`TenantIsolationSchema`) tabidir. Fragment mutasyonu (embedded) üst-kaydın audit'ine, normalize ise kendi + üst-kayıt audit'ine append-only düşer.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`)

Bu tablo Fragment kademesi üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Fragment tanımı *önerme* | `draft` | AI yeni Fragment veya kanonik Fragment'e alan önerir (`FragmentDraft`); doğrudan `platform_fragments`'a yazamaz |
| Cross-field kural önerme | `draft` | AI alanlar-arası kural (posta-kod ülke) önerir; insan onaylar, kanonik kurala ham yazamaz |
| Storage stratejisi (`embedded`↔`normalized`) değişimi | onay-zorunlu | Fragment storage kararı ve göçü (JSONB→normalize) veri-şekli değişimi; `approval_ref` (insan) olmadan `ApprovalRequiredError` |
| `FragmentSchema` kanonik değişimi | `none` | Zod kanonik şema değişimi (§5.1 önerisi) çekirdek ekip PR'ı; AI değiştiremez |
| Fragment→ArcheType terfisi | onay-zorunlu | Kimlik verme kararı (§11) yaşam-döngüsü/RLS ekler; yalnız insan onayıyla |
| per-alan PII-sınıf düşürme | onay-zorunlu | PII-sınıfı düşürmek (medium→low) veri-gizlilik riski; insan onayı zorunlu |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez |

Mutlak sınırlar (netleştirme §0 + `core-contract-pack`): AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; `platform_fragments` kanonik kütüphanesini doğrudan değiştiremez (yalnız draft önerir); ruleset override edemez; kanıtsız "bitti" diyemez; Fragment'e kimlik verip ArcheType'a terfiyi tek başına yapamaz.

## 11. Bağlama (Fragment↔ArcheType terfisi; motor türetimi; kanonik kütüphane paylaşımı)

**Fragment→ArcheType terfisi (kimlik testi):** Fragment kimliksizdir ve yalnız gömülür; ama kimlik gerekince ArcheType'a **terfi eder** (netleştirme §6). Örnek: bir müşterinin adresi Party ArcheType'ına gömülü bir Address Fragment'idir; fakat bağımsız "Adresler tablosu" gerekiyorsa (adres paylaşımı — birden çok Party aynı adresi paylaşır; adres geçmişi — adresin zamanla değişimi izlenir) o zaman Address bir ArcheType'a terfi eder. Terfi kriteri **kimlik testidir** (netleştirme §3 test-1): kendi id'si, yaşam döngüsü, ilişkileri ve izin sınırı gerekiyor mu? Evet → ArcheType. Bu karar insan-onaylıdır (§10).

**Motor kademe-türetimi bağlama:** Motor Fragment'i üç kademeden farklı türetir (netleştirme §7): atom → tek kolon + tek widget; **Fragment → iç-içe nesne (API) + bileşik widget (surface) + per-alan index (arama) + embedded JSONB veya normalize join (DB)**; ArcheType → kaynak + endpoint'ler + sayfa/liste/detay + kendi tablosu. Fragment türetiminin ayırt edici yanı: çok-alanlı ama kimliksiz — bu yüzden nested object ama resource değil.

**Kanonik kütüphane paylaşımı (netleştirme §6):** `platform_fragments` gap'i kapatır — PIM/HRMS/CLM aynı Address'i üç farklı biçimde uydurmaz; hepsi kanonik Address Fragment'ini tüketir. CLM eşlemesi (netleştirme §9): `Party.address`→Fragment Address, `Party.name`→Fragment PersonName, `Party.contacts[]`→Fragment ContactPoint[]; `Party.tax_id`→Atom (Fragment değil, tek-değer kimlik). Fragment ArcheType'a gömülür (netleştirme §9), ArcheType Fragment'i **açmaz**.

**ArcheType embed bağlama:** Bir ArcheType Fragment'i gömerken kendi Address'ini tanımlamaz; kanonik `platform_fragments` Address'ini referansla gömer (`FragmentSchema.id` ile). `archetype.ts` `ArchetypeContractSchema.fragments: FragmentSchema[]` bu embed noktasıdır; kanonik terfiden sonra bu alan `platform_fragments`'tan çözülür.

## 12. Test stratejisi

Aşağıdaki testler Fragment kademesi sözleşmesini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır. Bu tablo Fragment için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Kademe ayrımı: çok-alanlı+bağımsız-anlamlı yapı Fragment'e, tek-değer atom'a, kimlikli ArcheType'a sınıflanıyor (netleştirme §3 kural) | Birim |
| 2 | Cross-field: Address posta-kodu `country`'ye bağlı doğrulanıyor; yanlış ülke-posta çifti reddediliyor | Birim |
| 3 | Storage embedded: Fragment üst-kaydın JSONB kolonundan iç-içe nesne olarak API'ye türetiliyor | Entegrasyon |
| 4 | Storage normalized: `city` facet için Fragment normalize/generated-column index'ten çözülüyor ("İstanbul'daki taraflar") | Entegrasyon |
| 5 | Kanonik paylaşım: iki farklı ArcheType aynı `platform_fragments` Address'ini tüketiyor (kopya açmıyor) | Contract |
| 6 | Terfi: kimlik gereken Address (adres paylaşımı/geçmişi) ArcheType'a terfi ediyor; kimlik testi geçiyor | Birim |
| 7 | Tenant izolasyonu (normalize): normalize Fragment satırı üst-kayıt tenant'ıyla tutarlı; cross-tenant reddediliyor | Entegrasyon (negatif) |
| 8 | Motor türetimi: Fragment API'de nested object, surface'te bileşik widget, arama'da per-alan index üretiyor | Contract |
| 9 | ContactPoint polimorfik: `value` atom-tipi `kind`'e bağlı çözülüyor (email→Email, phone→Phone/E.164) | Birim |
| 10 | `check-fragments` CI: kanonik Fragment kopyası, kimliksizlik ihlali, storage-beyansız Fragment yakalanıyor | CI (data-quality) |
| 11 | Migration downgrade: `alembic downgrade -1` (JSONB↔normalize göçü) veri kaybetmeden çalışıyor | CI |

## 13. Acceptance criteria

- Bir çok-alanlı+bağımsız-anlamlı yapı (Address, PersonName, ContactPoint) Fragment'e, tek-değer bütün-değer atom'a, kimlikli varlık ArcheType'a deterministik sınıflanıyor (netleştirme §3 kural).
- İki farklı app/ArcheType aynı kanonik `platform_fragments` Address'ini tüketiyor; hiçbiri kendi Address'ini açmıyor (netleştirme §6 gap kapanışı).
- Address posta-kodu `country`'ye bağlı (cross-field) doğrulanıyor; standart ISO-3166'ya **referansla** çözülüyor, sözleşmeye kopyalanmıyor.
- Fragment `storage: embedded|normalized` beyanına göre motor iç-içe nesne + embedded JSONB veya per-alan index + normalize join türetiyor (netleştirme §7.1).
- ContactPoint `value` atom-tipi `kind`'e bağlı polimorfik çözülüyor (her kanal kendi atom tipi).
- Kimlik gereken Address (adres paylaşımı/geçmişi) ArcheType'a terfi ediyor; kimlik testi (netleştirme §3 test-1) bunu belirliyor; terfi insan-onaylı.
- Normalize Fragment satırı üst-kayıt tenant'ıyla tutarlı; cross-tenant Fragment reddediliyor ve audit'leniyor.
- AI Fragment tanımını/kuralını yalnız `draft` öneriyor; `FragmentSchema` kanonik değişimi ve storage göçü insan-onaylı; AI kimlik verip terfiyi tek başına yapamıyor.
- Alembic migration downgrade (JSONB↔normalize) otomatik test geçiyor; `check-fragments` (kanonik kopya, kimliksizlik, storage-beyanı) yeşil.

## 14. Anti-patterns

- **App-özel Fragment kopyası:** PIM/HRMS/CLM'nin kendi Address'ini açması — YASAK; kanonik `platform_fragments` Address'i zorunlu (netleştirme §6).
- **Fragment'i atom yapma:** Address'i tek opak bütün-değer (atom) gibi türetmek — YASAK; motor çok-alanlı yapıyı tek değer görürse form/validasyon/arama türetilemez (netleştirme §1 U1 gerekçesi).
- **Fragment'i kör `json` yapma:** Address'i `json` alanına gömüp motoru büsbütün körleştirmek — YASAK; per-alan index/facet/i18n kaybolur (netleştirme §1).
- **Fragment'e kimlik verme:** Bir Fragment'e id/tenant/RLS ekleyip kimlik vermek ama Fragment demeye devam etmek — YASAK; kimlik gerekiyorsa ArcheType'a **terfi** (netleştirme §6, §11).
- **Fragment'e referans verme:** Başka bir kaydın bir Fragment'e `PartyRef` gibi bağlanması — YASAK; referans alınan şey ArcheType olmalı (netleştirme §6).
- **Storage-beyansız Fragment:** `storage: embedded|normalized` beyan etmeden Fragment tanımlamak — YASAK; motor türetimi belirsizleşir (netleştirme §7.1-c).
- **Her şeyi JSONB / her şeyi tablo:** Facet'lenen çok-sayılı Fragment'i JSONB'ye gömmek ya da tek-üst-kayıt Fragment'ini gereksiz tabloya bölmek — YASAK; karar kuralı §7.1'e uyulur.
- **Standardı kopyalama:** ISO-3166/E.164/UCUM tablosunu sözleşmeye gömmek — YASAK; registry-sürümüne **referans** (netleştirme §5).
- **Tek-alan kuralla cross-field:** Posta-kod ülke bağımlılığını tek-alan doğrulamayla ifade etmeye çalışmak — YASAK; `crossFieldRules` gerekir (netleştirme §6).
- **Cross-tenant Fragment satırı:** Normalize Fragment satırını üst-kayıt tenant'ından farklı tenant'a yazmak — YASAK; tutarlılık zorunlu (§9).
- **AI'ın doğrudan kanonik değişimi:** AI'ın `platform_fragments`'a ham yazması veya terfiyi tek başına yapması — YASAK; `draft` + insan onayı (§10).

## 15. Definition of Done

- §12'deki 11 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- Üç kanonik Fragment (Address, PersonName, ContactPoint) `platform_fragments`'ta *alan+tip+amaç* sözleşmesiyle tanımlı; mock veri yok.
- `FragmentSchema` zenginleştirme (§5.1: cross-field, storage, per-alan i18n+PII, reusability) **öneri** olarak kayıtlı; kanonik Zod değişimi ADR-F1 kilidine bağlı, insan-onaylı.
- Fragment storage kararı (`embedded|normalized`) beyan ediliyor; motor türetimi (nested object + JSONB/normalize + per-alan index + bileşik widget) çalışıyor (netleştirme §7, §7.1).
- Fragment→ArcheType terfisi kimlik testiyle (netleştirme §3 test-1) çözülüyor; insan-onaylı.
- `check-fragments` CI kapısı test-önce yazılmış ve yeşil (kanonik kopya, kimliksizlik ihlali, storage-beyansız Fragment, cross-tenant Fragment yakalanıyor).
- Alembic migration downgrade (JSONB↔normalize) CI'da çalışıyor.
- AI-guardrail testi: `draft`-dışı doğrudan kanonik değişim/terfi/storage-göçü reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (Türkçe, emoji yok, aktör-açık, §4'te nedir/yapar/yapmaz, her tablodan önce açıklama, şema tablolarında mock değer yok, standart referansla).

## 16. CLM + PIM + HRMS karşılığı

Aşağıdaki tablo, bu sözleşmenin CLM/PIM/HRMS'te aynı çok-alanlı değer-nesnesinin nasıl tek kanonik Fragment'e indiğini gösterir; her satır üç domaindeki bir yeteneği kanonik Fragment'e bağlar (netleştirme §6 gap: "aynı Address'i üç farklı biçimde uydurma" sorununun kapanışı; netleştirme §9 CLM eşlemesi).

| Domain yeteneği | Kanonik Fragment karşılığı |
|---|---|
| CLM: `Party.address` (taraf adresi) | §5.2 Fragment `Address` (`platform_fragments`), embedded (netleştirme §9) |
| CLM: `Party.name` (taraf adı) | §5.3 Fragment `PersonName`, given/family bağımsız (netleştirme §9) |
| CLM: `Party.contacts[]` (iletişim noktaları) | §5.4 Fragment `ContactPoint[]`, kanal-bağlı polimorfik value (netleştirme §9) |
| CLM: `Party.tax_id` / `national_id` | **Atom** (Fragment değil — tek-değer kimlik + PII-sınıf; netleştirme §9) |
| PIM: tedarikçi/marka adresi | Aynı §5.2 Fragment `Address` — PIM kendi adresini açmaz (gap kapanışı §6) |
| PIM: üretici iletişim kanalı | Aynı §5.4 Fragment `ContactPoint` — PIM kendi ContactPoint'ini açmaz |
| HRMS: çalışan adı | Aynı §5.3 Fragment `PersonName` — HRMS kendi ad-yapısını açmaz; i18n ad-düzeni ortak |
| HRMS: çalışan ev/iş adresi | Aynı §5.2 Fragment `Address` — çokluk (ev/iş) `Address[]` embed |
| Üçü ortak: adres paylaşımı/geçmişi gerektiğinde | Address **ArcheType'a terfi** (kimlik testi, §11; netleştirme §6) |
| Üçü ortak: posta-kod ülke doğrulaması | Ortak `crossFieldRules` (ISO-3166 referansı, §5.2) — üç domainde tek kural |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| FR-01 | Fragment kademesi kesin sınıflama (çok-alanlı+bağımsız-anlamlı+kimliksiz) | Data/Contract | P0 | Unit | Kademe ayrımı deterministik (netleştirme §3) | kernel-team |
| FR-02 | `platform_fragments` kanonik kütüphane; app kopya açmaz | Data | P0 | Contract | İki app aynı Fragment'i tüketir | kernel-team |
| FR-03 | Kanonik `Address` Fragment (street/city/postal/region/country) | Data | P0 | Unit | Alan+tip+amaç sözleşmesi mevcut | kernel-team |
| FR-04 | Kanonik `PersonName` Fragment (given/family/middle/prefix) | Data | P1 | Unit | i18n ad-düzeni + family sıralama | kernel-team |
| FR-05 | Kanonik `ContactPoint` Fragment (kind/value/priority) | Data | P1 | Unit | value atom-tipi kind'e bağlı | kernel-team |
| FR-06 | Cross-field validation (posta-kod ülke bağlı) | Backend | P0 | Unit | Yanlış ülke-posta çifti reddedilir | kernel-team |
| FR-07 | Storage stratejisi beyanı (`embedded|normalized`) + motor türetimi | Backend/Data | P0 | Integration | Beyan edilen storage'a göre türetilir (netleştirme §7.1) | kernel-team |
| FR-08 | Motor kademe-türetimi (nested object + bileşik widget + per-alan index) | Backend/API | P1 | Contract | Fragment atom/ArcheType'tan farklı türetilir (netleştirme §7) | kernel-team |
| FR-09 | Per-alan i18n + per-alan PII-sınıf | Backend/Data | P2 | Unit | Alan-düzeyi i18n label + PII-sınıf | kernel-team |
| FR-10 | Fragment→ArcheType terfisi (kimlik testi) | Governance/Data | P1 | Unit | Kimlik gerekince terfi; insan-onaylı | pmo |
| FR-11 | Tenant tutarlılığı (normalize Fragment üst-kayıt tenant'ı) | Security | P0 | Integration(neg) | Cross-tenant Fragment reddedilir | security-team |
| FR-12 | `FragmentSchema` zenginleştirme (kanonik değişim önerisi) | Data/Contract | P1 | Contract | §5.1 önerisi kayıtlı, ADR-F1 kilidine bağlı | kernel-team |
| FR-13 | `check-fragments` CI kapısı (kopya/kimliksizlik/storage-beyanı) | Governance/WBS | P1 | CI(data-quality) | Kanonik kopya + kimliksizlik ihlali yakalanır | pmo |
| FR-14 | Alembic downgrade (JSONB↔normalize) veri kaybetmez | Backend/DevOps | P1 | CI | `alembic downgrade -1` güvenli | kernel-team |
| FR-15 | Standart referansı (ISO-3166/E.164/UCUM kopyalamaz) | Backend/Data | P2 | Unit | Standart registry-sürümüne referanslı | kernel-team |
| FR-16 | Frontend bileşik widget (adres/isim bloğu) config-driven | Frontend | P1 | E2E | Widget Fragment tanımından türetilir, hardcoded yok | ui-team |
| FR-17 | WCAG 2.2 AA + i18n adres-düzeni + PII maskeleme | Frontend/A11y | P2 | A11y(axe) | axe critical=0; PII-orta maskelenir | ui-team |
| FR-18 | AI Fragment `draft` + kanonik değişim/terfi/storage-göçü onay-zorunlu | AI-Governance | P0 | Integration | draft-dışı doğrudan kanonik değişim reddedilir | governance |
| FR-19 | `platform_fragments` WBS düğümü doğru dependsOn (`platform_fieldtypes`) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |
