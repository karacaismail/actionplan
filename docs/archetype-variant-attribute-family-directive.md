# ArcheType Varyant + Öznitelik-Ailesi + Öznitelik-Mirası Yönergesi — Akeneo-sınıfı PIM Grafiği

**Sürüm:** 1.0 · **Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. `elestiri-01-archetype-2026-07-01.md` §5.5 / ADR-A5 alan-tipi genişletme).
**Kapsam:** ArcheType v2'nin **varyant (product variant)** + **öznitelik-ailesi (product family / attribute template)** + **öznitelik-mirası (attribute inheritance chain)** yeteneğinin normatif sözleşmesi: bir ürün ailesinin yüzlerce özniteliği, varyant eksenlerini (renk × beden) ve family → product → variant miras zincirini şema-migration'ı gerektirmeden, tip-güvenli ve tenant-tanımlı biçimde taşıması.
**Kaynak/bağlam:** `docs/archetype-uretim-spec.md` §12.B (`attribute-set / EAV` FieldType), `plan-03-yeni-yonergeler-2026-07-01.md` §3 (kernel primitif deseni), `elestiri-01-archetype-2026-07-01.md` §3.3/§3.5/§5.5 (ilişki/alan-tipi eksikleri), `src/schemas/archetype.ts` (mevcut `FieldType` + `RelationSchema`), `core-contract-pack.md` §3.6 Field-Types (`AttributeSet`/`Money`/`Measure`/`I18nText`), `docs/reference/PIM-v2-Gereksinim-Analizi.md` §4 + Faz 1/3.
**Aktörler:** Ürün/katalog yöneticisi (insan — aile/şablon/öznitelik tanımlar), AI öneri motoru (swarm — öznitelik/varyant-ekseni taslağı önerir), Motor (platform runtime — miras çözer, varyant üretir), CI (GitHub Actions — conformance), tüketici uygulama (Commerce varyant, PIM/Akeneo muadili).

---

## 1. Amaç

Portföyün PIM iddiası ("Akeneo-sınıfı PIM") bugün teknik olarak boştur: `src/schemas/archetype.ts` bir ArcheType'ı sabit bir `fields` dizisiyle tanımlar; oysa bir Akeneo-ailesi (tişört ailesi → beden × renk varyantları) yüzlerce **çalışma-zamanı özniteliğini**, varyant eksenlerini ve bir **miras zincirini** ister. Bunu sabit `fields` dizisiyle ifade etmek imkânsızdır — her yeni öznitelik bir şema-migration'ı (bölüm 4 riski) doğurur. Bu sözleşme, ArcheType'a üç yeteneği ekler: (1) **öznitelik-ailesi** (family + attribute template) = bir ürün grubunun ortak öznitelik iskeleti; (2) **varyant** = tek bir ürünün eksen-kombinasyonlarına (renk × beden) açılması; (3) **öznitelik-mirası** = family düzeyinde tanımlı bir özniteliğin product ve variant düzeyine deterministik olarak inmesi/geçersiz kılınması. Böylece "kod yazmadan module üretmek" farkı, PIM'in kalbi olan öznitelik grafiğine kadar uzanır.

## 2. Kapsam

Bu sözleşme kapsar: (a) `ProductFamily` / `AttributeTemplate` / `Attribute` / `AttributeGroup` / `AttributeOption` / `AttributeType` / `ProductVariant` ve `variant-axis` veri modellerinin alan yapısını (bölüm 5); (b) öznitelik miras zincirini (family → product → variant, en fazla 3-seviye eksen — bölüm 6); (c) WBS/archetype yerleşimini (bölüm 7); (d) backend depolamayı (SQLAlchemy 2.0 + JSONB, `AttributeSet` tip — bölüm 8); (e) metadata-driven form davranışını (bölüm 9); (f) multi-tenant izolasyonu (bölüm 10); (g) AI guardrail'ı (bölüm 11); (h) ArcheType v2 / Computation / PIM Faz 1/3 bağlamasını (bölüm 12). Bir **yönerge** (mimari tarif) verir; implementasyon kodunu ajanlar `plan-01` Dalga 1 promptuyla yazar.

## 3. Non-goals (kapsam dışı)

Bu sözleşme şunları **yapmaz**: **(1)** Yeni `FieldType` **tanımlamaz** — `attribute-set`/`money`/`measure`/`i18n-text` tiplerini `k-fieldtypes` (`core-contract-pack` §3.6) sağlar; bu sözleşme onları **kullanır**. **(2)** Öznitelik **değeri hesaplamaz** — türetilmiş öznitelik (ör. hacim = en×boy×yükseklik) `k-computation`'ın (ADR-A4) işidir; bu sözleşme değeri **saklar/miras eder**, üretmez. **(3)** Kategori/taksonomi ağacı **değildir** — family bir öznitelik-iskeletidir, sınıflandırma değil; taksonomi (ETIM/UNSPSC) PIM Faz 3'ün ayrı konusudur. **(4)** Fiyatlandırma/kanal-eşleme **yapmaz** — varyant SKU'ya fiyat/kanal bağı Commerce/kanal-adapter işidir. **(5)** Şema-migration ile öznitelik eklemez — öznitelik **veriye** yazılır (EAV), şemaya değil; yeni öznitelik migration doğurmaz. **(6)** Serbest kod çalıştırmaz — validation/varsayılan yapısal ifadedir (bölüm 7 ilkesi, `archetype-uretim-spec` §7).

## 4. Tanım (nedir / yapar / yapmaz)

**Nedir:** ArcheType'ın, bir ürünü tek bir sabit kayıt yerine, **ortak bir öznitelik ailesinden miras alan ve varyant eksenleriyle çoğalan bir grafik** olarak tanımlamasını sağlayan yetenek kümesi. Family = "aile" = bir ürün grubunun paylaştığı öznitelik iskeleti (ör. "giyim" ailesi: beden, renk, kumaş). Variant = "varyant" = tek ürünün eksen-kombinasyonlarına açılmış SKU'su (ör. "Kırmızı / L"). Attribute inheritance = "öznitelik mirası" = üst seviyede tanımlı özniteliğin alt seviyeye deterministik inmesi.

**Yapar:**
- Bir ürün ailesini **öznitelik şablonu** olarak tanımlar: hangi öznitelikler ortak, hangileri zorunlu, hangileri varyantı ayıran eksen.
- Bir ürünü **varyant eksenlerine** açar: eksen değerlerinin kartezyen kombinasyonundan SKU-düzeyi varyantlar üretir (ör. 3 renk × 4 beden = 12 varyant).
- **Miras zincirini** çözer: bir öznitelik değeri önce variant'ta, yoksa product'ta, yoksa family'de aranır (en-yakın-kazanır); alt seviye üst seviyeyi **geçersiz kılabilir** (override) ama silemez.
- Öznitelikleri **çalışma-zamanında** (runtime) tanımlar: yeni öznitelik eklemek şema değiştirmez, `AttributeSet`/JSONB'ye veri yazar; **ayrı indekslenir** (arama/filtre performansı için).

**Yapmaz:**
- Öznitelik **değeri türetmez** (o `k-computation`); yalnız statik değeri saklar ve miras eder.
- Öznitelik **tipini** icat etmez (o `k-fieldtypes`); `AttributeType` yalnız mevcut tiplere referans verir.
- Sınıflandırma/kategori ağacı **değildir**; family öznitelik-iskeletidir, taksonomi değil.
- 3-seviyeden derin **varyant ekseni** kurmaz (bölüm 6 sınırı); daha derin ihtiyaç ayrı ürün/ilişki ister.

## 5. Sözleşme şekli (alan | tip | amaç)

Aşağıdaki tablolar veri modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek veri (mock) vermez. Tipler SQLAlchemy 2.0 / SQLModel karşılığına eşlenir. **Ortak alanlar (her tabloda, tekrar yazılmaz):** `id` (UUID PK), `tenant_id` (UUID FK → tenants; RLS izolasyonu, v1 §2.1 zorunlu), `created_at`/`updated_at` (datetime audit). Aşağıda yalnız her varlığın **ayırt edici** alanları listelenir.

`ProductFamily` — bir ürün grubunun ortak öznitelik iskeletini ve varyant eksenlerini tanımlar (ağaç; `parent_id` ile `extends`):
| Alan | Tip | Amaç |
|---|---|---|
| `code` | string (unique/tenant) | Makine-okur aile kimliği (ör. `apparel`) |
| `label` | I18nText | Kullanıcıya görünen çok-dilli ad |
| `parent_id` | UUID \| null (FK → self) | Üst aile; `extends` (öznitelik iskeleti miras alma) |
| `attribute_template_id` | UUID (FK → attribute_template) | Bu ailenin öznitelik şablonu |
| `variant_axes` | list[string] | Varyantı ayıran eksen öznitelik kodları (ör. `[color, size]`, en fazla 3) |
| `status` | enum(draft\|active\|deprecated) | Yaşam döngüsü; deprecated silinmez, kapanır |
| `version` | string | Aile sürümü; miras/eksen değişimi denetimi için monoton |

`AttributeTemplate` — bir aileye bağlı öznitelik demeti; hangi özniteliklerin geçerli olduğunu ve zorunluluk/eksen rolünü belirler (PIM Faz 3):
| Alan | Tip | Amaç |
|---|---|---|
| `family_id` | UUID (FK → product_family) | Ait olduğu aile |
| `attribute_id` | UUID (FK → attribute) | Şablona dahil öznitelik |
| `required` | bool | Bu ailede zorunlu mu (publish kapısı girdisi) |
| `is_variant_axis` | bool | Bu öznitelik varyantı ayıran eksen mi |
| `inheritable` | bool | Alt seviye (product/variant) bu değeri miras alır mı |
| `order` | integer | Form/görüntü sırası |

`Attribute` — tek bir özniteliğin tanımı (tip/birim/lokalize/doğrulama); değeri taşımaz, **tanımı** taşır:
| Alan | Tip | Amaç |
|---|---|---|
| `code` | string (unique/tenant) | Makine-okur öznitelik kimliği (ör. `color`) |
| `label` | I18nText | Çok-dilli görünen ad |
| `attribute_type_id` | UUID (FK → attribute_type) | Veri tipi referansı (k-fieldtypes köprüsü) |
| `attribute_group_id` | UUID \| null (FK → attribute_group) | Görsel/mantıksal gruplama |
| `localizable` | bool | Değer locale'e göre değişir mi (i18n-text davranışı) |
| `scopable` | bool | Değer kanal/scope'a göre değişir mi |
| `unit` | string \| null | Ölçü birimi (measure tipi ile; ör. `cm`, `kg`) |
| `validation` | JSONB | Yapısal doğrulama (regex/min/max/enum) — serbest kod DEĞİL |
| `deprecated` | bool | Silme yerine kapatma (append-only) |

`AttributeGroup` — özniteliklerin mantıksal/görsel demeti (form sekmesi); yalnız sunum amaçlı → `code` (string, grup kimliği), `label` (I18nText, çok-dilli ad), `order` (integer, form içi sıra).

`AttributeOption` — enum/çoklu-seçim öznitelik için izinli değer kümesi; her değer teknik kimlik + lokalize etiket taşır (`archetype-uretim-spec` §12.E alias ruhu):
| Alan | Tip | Amaç |
|---|---|---|
| `attribute_id` | UUID (FK → attribute) | Ait olduğu öznitelik |
| `code` | string | Teknik değer kimliği (koda/veriye yazılan; ör. `red`) |
| `label` | I18nText | Kullanıcıya gösterilen çok-dilli etiket (dil eklemek veriyi değiştirmez) |
| `order` | integer | Görüntü sırası |
| `deprecated` | bool | Seçeneği kapatma (append-only; alias ile) |

`AttributeType` — bir özniteliğin veri tipini `k-fieldtypes`'a bağlayan referans; **yeni tip icat etmez**, köprüdür:
| Alan | Tip | Amaç |
|---|---|---|
| `code` | enum | `k-fieldtypes` tipine referans: `text\|i18n-text\|number\|measure\|money\|boolean\|date\|enum\|multi-enum\|file\|geo` |
| `storage_hint` | enum(jsonb\|column) | Depolama ipucu; yüksek-hacim opt-in fiziksel kolona terfi (`k-archetype-storage`) |
| `indexable` | bool | Ayrı indekslenir mi (arama/filtre performansı) |

`ProductVariant` — tek ürünün eksen-kombinasyonuna açılmış SKU-düzeyi kaydı; kendi öznitelik override'larını JSONB'de taşır:
| Alan | Tip | Amaç |
|---|---|---|
| `product_id` | UUID (FK → product) | Ait olduğu ana ürün (parent) |
| `sku` | string (unique/tenant) | Varyant stok kodu |
| `axis_values` | JSONB | Bu varyantı belirleyen eksen değerleri (ör. `{color: red, size: L}`) |
| `attributes` | AttributeSet (JSONB) | Variant-seviyesi öznitelik değerleri (product/family'yi override eder) |
| `status` | enum(draft\|active\|deprecated) | Yaşam döngüsü |

`variant-axis` — bir ailenin varyant eksenini (öznitelik + izinli değerler) tanımlayan görünüm; family `variant_axes` + `AttributeOption` birleşiminden çözülür:
| Alan | Tip | Amaç |
|---|---|---|
| `family_id` | UUID (FK → product_family) | Eksenin ait olduğu aile |
| `attribute_id` | UUID (FK → attribute) | Eksen özniteliği (ör. `size`) |
| `level` | integer (1..3) | Eksen derinliği; en fazla 3 (bölüm 6 sınırı) |
| `allowed_option_ids` | list[UUID] | Bu eksende izinli seçenek kümesi (kartezyen üretim girdisi) |

`Attribute` **tanımdır**, değer değildir; değer `Product`/`ProductVariant`'ın `attributes` (`AttributeSet`/JSONB) alanında yaşar; miras zinciri (bölüm 6) hangi değerin geçerli olduğunu çözer.

## 6. Öznitelik miras zinciri (family → product → variant; en fazla 3-seviye eksen)

Miras, en-yakın-seviye-kazanır (nearest-wins) kuralıyla çözülür. Bir öznitelik değeri istendiğinde motor şu sırayı izler:

1. **variant** düzeyi — `ProductVariant.attributes` içinde varsa o kullanılır (en spesifik).
2. yoksa **product** düzeyi — `Product.attributes` içinde varsa o kullanılır.
3. yoksa **family** düzeyi — `AttributeTemplate` üzerinden ailenin **varsayılanı** (`inheritable=true` ise) kullanılır.
4. hiçbiri yoksa öznitelik **çözümsüz**; `required=true` ise publish kapısı (PIM Faz 4) engeller, değilse boş kalır.

**Override, silme değildir:** alt seviye üst değeri geçersiz kılabilir (override) ama üst seviyeyi **değiştirmez/silmez** — üst seviye başka varyantlar için geçerli kalır (append-only ruhu, `archetype-uretim-spec` §4). Miras **okuma-zamanı çözümdür**, kopyalama değil: family değeri değişince onu override etmeyen tüm alt kayıtlar yeni değeri otomatik görür.

**Eksen (axis) derinliği en fazla 3:** varyantı ayıran eksen sayısı `variant_axes` içinde **en fazla 3** olabilir (ör. `color × size × material`). Neden sınır: kartezyen kombinasyon patlar (5×5×5×5 = 625 varyant/ürün) ve UX/performans bozulur; 3-seviye pratik üst sınırdır (PIM Faz 1: "varyant eksen doğrulama, max 3 seviye"). Daha derin farklılaşma ayrı ürün/ilişki (bölüm 12 `tree`) ister. Eksen doğrulama **tanım anında** yapılır: 4. eksen `VariantAxisDepthError` fırlatır.

| Seviye | Değer kaynağı | Override edebilir mi | Not |
|---|---|---|---|
| family | AttributeTemplate varsayılanı (`inheritable`) | — (en üst) | tüm ürünlere ortak taban |
| product | Product.attributes | family'yi override eder | ürüne özel değer |
| variant | ProductVariant.attributes | product+family'yi override eder | SKU'ya özel değer |
| eksen | variant_axes (max 3) | — | kartezyen SKU üretiminin girdisi |

## 7. WBS/archetype yerleşimi

Bu yetenek, ArcheType v2'nin bir **uzantısıdır** — ayrı kernel primitifi değildir; ArcheType şemasının varyant/öznitelik-grafiği taşıyacak alanlarıdır. `plan-03` §5 kernel kümesinde `k-fieldtypes` (`AttributeSet` tipi) ve `k-archetype-storage` (JSONB depolama) düğümlerine bağlanır. PIM tarafında ise Faz 1 `module` düğümü altında **`archetype` düğümü** olarak asıl kod-teslimatını taşır.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-fieldtypes` | module | `k-schema` | kernel (AttributeSet tipini sağlar) |
| `k-archetype-storage` | module | `k-schema` | kernel (JSONB + opt-in kolon) |
| `pim-attribute-graph` | archetype | `k-fieldtypes`, `k-archetype-storage`, `k-computation` | PIM Faz 1 (asıl kod) |

`dependsOn` teknik sırayı verir: öznitelik grafiği, `AttributeSet` tipi (`k-fieldtypes`) ve JSONB depolama (`k-archetype-storage`) olmadan kurulamaz; türetilmiş öznitelik için `k-computation`'a bağlanır. `related` ile Commerce varyant ve kanal-eşleme düğümlerine bağlanır (karar üretmez, gezinme). `task-to-code-contract` gereği yerleşim bir `archetype` düğümüdür; kod orada yazılır, sözleşme/şema burada tarif edilir.

## 8. Backend (SQLAlchemy 2.0 + JSONB)

Öznitelik değerleri `AttributeSet` tipiyle (`core-contract-pack` §3.6 `platform_fieldtypes.AttributeSet`) **JSONB** kolonunda tutulur — tablo-per-tip YOK, dinamik DDL YOK (`k-archetype-storage` kararı); yeni öznitelik şema-migration'ı gerektirmez, veriye yazılır. `ProductFamily`/`AttributeTemplate`/`Attribute`/`AttributeGroup`/`AttributeOption`/`AttributeType` ilişkisel tablolardır (tanım katmanı); `Product.attributes` ve `ProductVariant.attributes` JSONB'dir (değer katmanı). **Ayrı indeksleme zorunlu:** yüksek-hacim (milyon ürün × yüz öznitelik) sorgu çökmesini önlemek için `indexable=true` öznitelikler GIN indeksi ve/veya materialized attribute tablosuyla ana tablodan bağımsız indekslenir (`elestiri-01` §6.2). `storage_hint=column` olan çok yüksek-hacimli öznitelikler opt-in fiziksel kolona terfi eder. Miras çözümü motor tarafında `AttributeResolver.resolve(product_id, variant_id, attr_code, locale, scope)` ile yapılır; **serbest Python evaluate YASAK**, çözüm deterministik sıra tablosudur (bölüm 6). Alembic expand-contract migration (downgrade zorunlu). Öznitelik/aile **tanım** değişiklikleri `AuditLogger.log()` ile yazılır; değer hacmi audit'lenmez. Hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasaktır. `Money`/`Measure`/`I18nText` değerleri tip-güvenli tutulur; hatalı birim/kur/locale karışımı **tanım anında** reddedilir.

## 9. Frontend (metadata-driven form)

Form, hangi özniteliklerin gösterileceğini/zorunlu olacağını **runtime konfigürasyonundan** (metadata endpoint `/api/v1/meta/{entity}`) okur; kodda öznitelik-öznitelik `if` dalı yazılmaz (PIM Faz 1 "metadata-driven dinamik form motoru"). Kullanıcı bir **aile + tip** seçer; form seçilen ailenin `AttributeTemplate`'inden zorunlu/opsiyonel öznitelikleri, gruplarını (`AttributeGroup` → sekme) ve varyant eksenlerini üretir. Miras edilen (family/product'tan gelen) değerler **salt-okunur "inherited" rozetiyle** gösterilir; kullanıcı override etmedikçe düzenlenemez, override edince variant/product düzeyine yazılır. Varyant üretimi eksen değerlerinin kartezyen kombinasyonundan yapılır; eksen > 3 ise UI eklemeyi engeller (bölüm 6). Çok-dilli (`i18n-text`) alanlar locale sekmeleriyle, enum alanlar `AttributeOption` lokalize etiketleriyle render edilir. React + Vite + TanStack Query + React Hook Form + Zod stack'i sabittir; render `projected` (şema-render) stratejisiyle çalışır.

## 10. Multi-tenant

Her aile/şablon/öznitelik/değer `tenant_id` ile izole edilir (v1 §2.1 fail-closed): A tenant B'nin öznitelik ailesini, seçeneklerini veya varyantlarını göremez. Öznitelik-set şeması **tenant katmanında tanımlıdır** (`core-contract-pack` §3.6: "attribute-set şeması tenant katmanında"); yani her tenant kendi öznitelik grafiğini kurar, platform ona şema dayatmaz — ama tenant `k-fieldtypes` tip kümesini (Money/Measure/I18nText/AttributeSet) genişletemez, yalnız kullanır. RLS politikası + repository/dependency filtresi (her sorgu `WHERE tenant_id = :current_tenant`) çift savunma hattı sağlar. Industry template (PIM Faz 2) idempotent şekilde sektöre uygun aile/öznitelik üretebilir ama bu da tenant kapsamında yazılır.

## 11. AI guardrail

Dört-aktör iş bölümü (`core-contract-pack` §3.0.1) burada değiştirilemez biçimde uygulanır: **AI önerir → insan onaylar → motor uygular.** AI mevcut ürün verisinden **öznitelik-ekseni veya öznitelik-şablonu taslağı önerebilir** (ör. "bu ürün grubu için `size` ve `color` eksen olmalı", "bu ailede `material` özniteliği eksik") ve örnek üründe varyant matrisi önizlemesi gösterebilir (`autonomy: draft`); ancak aktif `ProductFamily`/`AttributeTemplate`/`Attribute` tanımını **değiştiremez**. Aile/şablon/eksen yayımı insan `approval_ref`'i ister; onaysız apply `ApprovalRequiredError` fırlatır ve audit'lenir. AI **app/module üretemez**, yalnız ArcheType-seviyesi taslak önerir (`allowedTargets=["archetype"]`, `forbiddenTargets=["app","module"]`, `archetype-uretim-spec` §3). AI'ın **3'ten derin varyant ekseni önermesi testte engellenir** (bölüm 6 sınırı). AI öznitelik **değerini** prod veriye doğrudan yazamaz; miras/varyant motoru çözer, insan şablonu onaylar. AI main branch'e push edemez, ruleset override edemez (`ADMIN_FLOW` + `AI_FIX_LOOP` + `ciAutoPush:false` aynen geçerli).

## 12. Bağlama

**ArcheType v2 uzantısı:** Bu yetenek `archetype-uretim-spec` §12.B'deki `attribute-set / EAV` FieldType'ının ArcheType-seviyesi kullanımıdır; ayrı primitif değil, ArcheType şemasının varyant/öznitelik-grafiği alanlarıdır. `RelationSchema` `tree` genişletmesini (`archetype-uretim-spec` §12.C, `elestiri-01` §3.3) kullanabilir: family ağacı (`extends`) özyinelemeli ilişkidir.
**Computation ile türetilmiş öznitelik:** Türetilmiş öznitelik (ör. `volume = width × depth × height`, `weight-per-unit`) bu sözleşmede **hesaplanmaz**; `k-computation`'a (ADR-A4) `derived` işaretiyle bağlanır. Öznitelik grafiği girdi alanlarını sağlar; Computation çıktıyı üretir; miras zinciri türetilmiş değeri de aynı sıra tablosuyla çözer.
**PIM Faz 1/3:** Faz 1 (MVP çekirdeği) `Product`/`ProductVariant`/`Attribute`/`AttributeType`/`AttributeGroup`/`AttributeOption`/`ProductAttributeValue` (EAV) + varyant üretimi (axis, max 3) + miras zinciri + metadata endpoint teslimatını içerir. Faz 3 (gelişmiş öznitelik) `AttributeTemplate` (+ TemplateAttribute) product-type başına şablon + `attribute_resolver` portu + çoklu-seçim/birimli/lokalize öznitelik tiplerini içerir. Bu sözleşme her ikisinin ortak veri modelini ve invariant'larını kilitler.

## 13. Test stratejisi

Test-önce zorunludur (önce kırmızı, sonra yeşil).

| # | Test | Tür |
|---|---|---|
| 1 | Miras çözümü: variant > product > family sırası doğru (nearest-wins) | Unit |
| 2 | Override: alt seviye üst değeri geçersiz kılar ama üst seviyeyi değiştirmez | Unit |
| 3 | Miras yayılımı: family değeri değişince override etmeyen alt kayıtlar yeni değeri görür | Integration |
| 4 | Axis doğrulama: 3-seviyeye kadar kabul, 4. eksen `VariantAxisDepthError` | Unit |
| 5 | Varyant üretimi: eksen kombinasyonlarından doğru kartezyen SKU kümesi (3×4=12) | Integration |
| 6 | Runtime öznitelik ekleme: yeni öznitelik şema-migration'ı olmadan JSONB'ye yazılıyor | Integration |
| 7 | Zorunlu öznitelik: `required=true` çözümsüz kalınca publish kapısı engelliyor | Integration |
| 8 | Enum lokalize: `AttributeOption` code sabit, label locale'e göre değişiyor; dil eklemek veriyi değiştirmiyor | Unit |
| 9 | Ayrı indeks: `indexable=true` öznitelik GIN/materialized ile ana tablodan bağımsız sorgulanıyor | Integration |
| 10 | Cross-tenant izolasyon: A tenant B'nin ailesini/seçeneğini/varyantını göremiyor | Integration |

## 14. Acceptance criteria

- AC-1: Kullanıcı bir aile + tip seçip zorunlu öznitelikleri doldurarak ürün ve varyantlarını oluşturabiliyor (PIM Faz 1 kabul kriteri).
- AC-2: Öznitelik değeri variant > product > family sırasıyla çözülüyor; en-yakın-seviye kazanıyor.
- AC-3: Alt seviye üst seviyeyi override edebiliyor ama üst değer başka kayıtlar için korunuyor (silme yok).
- AC-4: Varyant ekseni en fazla 3 seviye; 4. eksen reddediliyor.
- AC-5: Eksen kombinasyonlarından doğru sayıda SKU-düzeyi varyant üretiliyor.
- AC-6: Yeni öznitelik şema-migration'ı olmadan (runtime, JSONB) eklenebiliyor ve ayrı indeksleniyor.
- AC-7: `required` öznitelik çözümsüzse publish engelleniyor; enum etiketleri veriyi değiştirmeden lokalize ediliyor.
- AC-8: Aile/şablon/eksen tanımını yalnız insan onayı değiştiriyor; AI draft + 3-eksen sınırıyla kısıtlı.

## 15. Anti-patterns (yasak desenler)

- **Öznitelik-per-kolon:** Her yeni öznitelik için şema-migration/DDL; EAV/`AttributeSet` yerine sabit kolon açmak — şema patlaması üretir, yasak.
- **Miras kopyalama:** Family değerini alt kayıtlara fiziksel kopyalamak; üst değer değişince alt kayıtlar bayatlar. Miras okuma-zamanı çözümdür, kopyalama değil.
- **Override ile silme:** Alt seviye override'ı üst seviye değeri sildi sanmak; üst değer başka varyantlar için geçerli kalır.
- **4+ eksen:** 3'ten derin varyant ekseni; kartezyen patlama + UX/performans çökmesi, `VariantAxisDepthError`.
- **Değeri hesaplamak:** Türetilmiş özniteliği bu sözleşmede hesaplamak; o `k-computation`'ın işidir (validation/computation ayrımı).
- **Enum etiketini veriye gömmek:** `AttributeOption` teknik `code` yerine lokalize etiketi koda/veriye yazmak; dil eklemek veriyi bozar (alias ruhu ihlali).
- **İndekssiz EAV sorgusu:** `indexable` özniteliği ana tabloya GIN/materialized indeks olmadan sorgulamak; yüksek-hacimde sorgu çöker.
- **Tenant'ın tip kümesini genişletmesi:** Tenant'ın `k-fieldtypes` dışında yeni bir öznitelik-tipi icat etmesi; katman yalnız kullanır, genişletmez.

## 16. DoD (Definition of Done)

§13'teki 10 testin tamamı yeşil; migration downgrade otomatik test geçti; miras çözümü (nearest-wins) ve axis-derinlik (max 3) invariant'ları kanıtlandı; runtime öznitelik ekleme şema-migration'sız doğrulandı; ayrı indeksleme (GIN/materialized) yüksek-hacim testinde p95 bütçesini tuttu; `check-core-contract`, `check-short-code`, `check-dependency-policy` yeşil; PIM Faz 1 ürün/varyant/öznitelik akışı ve Faz 3 şablon/resolver bu sözleşmeyi tüketiyor; PR açıldı, insan reviewer merge etti (main'e doğrudan push yok).

## 17. Requirement-ID tablosu

İzlenebilir gereksinimler; her satır: gereksinim + katman + öncelik + test türü + acceptance criteria + sahip.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| VAF-01 | `ProductFamily` şeması (variant_axes/attribute_template/extends) | Backend | P0 | Unit | AC-1 | PIM geliştirici |
| VAF-02 | `AttributeTemplate` (required/is_variant_axis/inheritable) | Backend | P0 | Unit | AC-1 | PIM geliştirici |
| VAF-03 | `Attribute` + `AttributeType` (k-fieldtypes köprüsü) | Backend | P0 | Unit | AC-1 | PIM geliştirici |
| VAF-04 | `AttributeGroup` + `AttributeOption` (lokalize etiket) | Backend | P1 | Unit | AC-7 | PIM geliştirici |
| VAF-05 | `ProductVariant` + `axis_values` + `attributes` (AttributeSet) | Backend | P0 | Unit | AC-5 | PIM geliştirici |
| VAF-06 | Miras çözümü: variant > product > family (nearest-wins) | Backend | P0 | Unit | AC-2 | PIM geliştirici |
| VAF-07 | Override üst değeri silmez; miras yayılımı | Backend | P0 | Integration | AC-3 | PIM geliştirici |
| VAF-08 | Axis derinlik en fazla 3; 4. eksen reddi | Backend | P0 | Unit | AC-4 | PIM geliştirici |
| VAF-09 | Varyant kartezyen üretimi (eksen kombinasyonu) | Backend | P0 | Integration | AC-5 | PIM geliştirici |
| VAF-10 | Runtime öznitelik ekleme (JSONB, şema-migration yok) | Backend | P0 | Integration | AC-6 | PIM geliştirici |
| VAF-11 | Zorunlu öznitelik çözümsüzse publish kapısı engeli | Backend | P1 | Integration | AC-7 | PIM geliştirici |
| VAF-12 | Ayrı indeksleme (GIN/materialized) yüksek-hacim | Backend | P1 | Integration | AC-6 | PIM geliştirici |
| VAF-13 | Cross-tenant izolasyon (aile/seçenek/varyant) | Multi-tenant | P0 | Integration | AC-1 | PIM geliştirici |
| VAF-14 | Metadata-driven form; inherited rozet + config-driven | Frontend | P1 | Statik analiz | AC-1 | Frontend geliştirici |
| VAF-15 | Aile/şablon/eksen yalnız insan onayı; AI draft + 3-eksen engeli | Governance | P0 | Integration | AC-8 | PIM geliştirici |

## 18. PIM-v2 karşılığı (Özellik 4, 5, 12)

Sözleşmeyi `docs/reference/PIM-v2-Gereksinim-Analizi.md` §8 Özellik Seti Matrisi'ne eşler:

| PIM-v2 # | Özellik | Faz | Öncelik | Bu sözleşmenin karşılığı |
|---|---|---|---|---|
| 4 | Varyant yönetimi (çok seviyeli) | 1 | P0 | `ProductVariant` + `variant-axis` + kartezyen üretim + axis max 3 (bölüm 5, 6); miras zinciriyle variant override |
| 5 | EAV öznitelik sistemi | 1 | P0 | `Attribute`/`AttributeType`/`AttributeGroup`/`AttributeOption` + `AttributeSet` (JSONB, runtime, ayrı indeks) (bölüm 5, 8) |
| 12 | Öznitelik şablonları | 3 | P1 | `AttributeTemplate` (family başına, required/is_variant_axis/inheritable) + `attribute_resolver` miras çözümü (bölüm 5, 6) |

İz sürme: Faz 1 kabul kriteri (aile+tip seçip zorunlu öznitelikle ürün+varyant oluşturma) = AC-1; Faz 1 "varyant üretimi + eksen doğrulama (max 3)" = AC-4/AC-5; Faz 1 "öznitelik miras zinciri" = AC-2/AC-3; Faz 3 "`attribute_resolver` çözümleme" = bölüm 6.

---

*Kaynak yönergeler: `docs/archetype-uretim-spec.md` §12.B, `plan-03-yeni-yonergeler-2026-07-01.md` §3, `elestiri-01-archetype-2026-07-01.md` §3.3/§3.5/§5.5. Kardeş sözleşmeler: `computation-derivation-contract.md` (türetilmiş öznitelik), `core-contract-pack.md` §3.6 (Field-Types — AttributeSet/Money/Measure/I18nText). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) ve `archetype-uretim-spec.md` (ArcheType canon) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez (AI-DRAFT).*
