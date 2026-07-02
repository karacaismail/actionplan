# archetype-document-composition Yönergesi — Doküman Kompozisyon / Montaj ArcheType ve Clause Library

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §15 DoD, ADR-DOC1)
**WBS düğümü:** `archetype-document-composition`
**Kaynak/bağlam:** `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `atomik-netlestirme-2026-07-01.md` (Atom/Fragment/ArcheType kademe modeli; `I18nText`/`EnumType`/`ClauseRef`/`AssetRef`/`EntityRef`/`Range<date>`/`Money` atomları — alan→atom bağı buradan gelir), `archetype-agreement-lifecycle-negotiation-directive.md` (ana tüketici; sözleşme grafiğini bu archetype belgeye render eder — `document` `AssetRef`), `k-signature-trust-directive.md` (render çıktısını imzaya sokan kardeş primitif; imzalanacak `AssetRef` buradan gelir), `k-storage-dam-directive.md` (render binary'sinin object storage'da tutulması; `AssetRef` hedefi), `surface-v2-directive.md §3` (non-goal: doküman/print yüzeyini birinci-sınıf tip yapmaz — bu açığı bu yönerge kapatır), `i18n-standard.md` (çok-dilli varyant / `I18nText` sözleşmesi), `PIM-v2-Gereksinim-Analizi.md §Faz 11` (`print_catalog` portu — baskı katalog #39), `wbs-field-semantics.md` (dependsOn anlamı).
**İlişki:** Bu doküman CLM'in **doküman üretim archetype'ıdır**: bir veri kaydını (sözleşme grafiği, ürün kataloğu, teklif, mektup) **şablon + değişken + koşullu madde (clause)** montajıyla değişmez, sürümlü, çok-formatlı (DOCX/PDF/HTML) bir belgeye *derler*. `archetype-agreement` (sözleşme grafiğini üreten merkez-archetype), `k-signature` (imza orkestratörü), `k-storage` (binary kütüğü) birer *tüketici/kardeş* iken `archetype-document-composition` bir *üretim-archetype'ıdır*: "hangi şablon, hangi değişkenlerle, hangi koşulla hangi maddeyi seçip nasıl monte edilerek, hangi formatta belge üretilir?" sorusunu yanıtlar. `surface-v2` yüzey (ekran) tipini tanımlar ve doküman/print üretimini bilinçli non-goal bırakır; **bu yönerge o boşluğu doldurur** — belge bir yüzey değil, bir *çıktı-artefaktıdır*. Bu doküman **kod yazmaz**; `archetype-document-composition`'ın alan yapısını, clause library sözleşmesini ve montaj/render davranışını normatif tanımlar. Makine-okunur karşılığı (ArcheType tanımı, SQLAlchemy 2.0/SQLModel modeli, Alembic migration, Strawberry tipi, render motoru adaptörü, PEP guard) ADR-DOC1 kilitlendiğinde ajan-draft + insan-onay ile `platform` reposunda üretilir; alanlar atom katmanına (`atomic-types-directive`) oturur ve o katman kilitlenmeden bu archetype "hazır" sayılmaz (bkz. §11).

**Stack:** FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL. Frontend: Vite + React + TanStack Router/Query. Biçim: SCSS + token; ikonlar Phosphor. **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

---

## 1. Amaç

Bu sözleşme, platformdaki her belgenin (sözleşme metni, teklif, mektup, sertifika, baskı kataloğu) tek bir ArcheType soyutlamasında — bir **şablon + değişken + koşullu madde montajı** olarak — üretilmesini; belgenin serbest kelime-işlemci dosyasında dağınık kalan yapısının (bölümler, değişken alanlar, seçmeli maddeler, çok-dilli varyantlar) **veri olarak** yönetilmesini; ve montaj sonucunun **değişmez, sürümlü, çok-formatlı (DOCX/PDF/HTML)** bir artefakta bağlanmasını sabitler. Hedef: 50 uygulamanın hiçbirinin kendi Word-birleştirme (mail-merge) mantığını, kendi PDF üreticisini veya kendi "if müşteri yurtdışıysa şu maddeyi ekle" koşul motorunu yeniden yazmaması; her belge şablonunun (`document_template`) bir kez tanımlanıp, değişkenlerinin (`variable_binding`) veri kaydından doldurulması, maddelerinin (`clause`) merkezi bir **clause library**'den content-block olarak seçilmesi, montaj kurallarının (`assembly_rule`) "if koşul then include clause" biçiminde veri olarak yürütülmesi ve çıktının (`rendered_document`) değişmez bir sürümle `k-storage`'a yazılması. Aktör-açık ifade: *ajan* madde/değişken taslağı, koşul önerisi ve varyant metni *önerir* (draft); *insan* (hukuk/içerik/pazarlama sahibi) maddeyi/şablonu/koşulu onaylar ve nihai belgeyi yayımlar; *motor* onaylı şablonu, değişken bağlamalarını ve montaj kurallarını deterministik ve geri-alınabilir uygular. **AI final dokümanı tek başına yayımlayamaz** — yalnız taslak önerir; şablon/madde onayı ve belge yayımı insan kararıdır.

## 2. Kapsam

Bu sözleşme şunları kapsar: (1) `document_template` çekirdek şablon kaydı (bölümler/`sections`, değişken tanımları/`variables`, montaj kuralları/koşullu clause referansları), (2) `clause` maddesi (kütüphane content-block'u: sınıf `EnumType` standart/alternatif/fallback/yasak, `I18nText` çok-dilli içerik, `ClauseRef` ile kütüphaneye bağ, sürüm), (3) `variable_binding` ile şablon değişkeninin bir veri kaynağına (kayıt alanı / sabit / türetilmiş değer) eşlenmesi, (4) `assembly_rule` ile "if koşul then include/exclude clause" koşullu montaj mantığının veri olarak tutulması, (5) `rendered_document` ile montaj çıktısının değişmez, sürümlü, checksum'lı artefaktı (`AssetRef` ile `k-storage`'a bağlı), (6) çok-formatlı render (DOCX/PDF/HTML) — aynı montajın birden çok formata çıkarımı, (7) çok-dilli varyant (`I18nText`) — aynı şablonun dile göre madde/etiket varyasyonu, (8) sürüm karşılaştırma (version diff) — iki şablon/belge sürümü arasında madde-madde fark, (9) yapılandırılmış (structured) editör — Word-benzeri ama şablon/madde sınırlarına kısıtlı düzenleme, (10) clause library yönetimi — content-block'ların kütüphanede sürümlü tutulması ve şablonlarca referansla tüketilmesi, (11) `archetype-document-composition` düğümünün WBS yerleşimi, çok-kiracılı izolasyon ve append-only audit zorunlulukları. Backend (render motoru adaptörü + async), frontend (yapılandırılmış editör), test ve AI-guardrail gereksinimleri ilgili bölümlerde tarif edilir.

## 3. Non-goals

Bu sözleşme şunları **kapsamaz**: (1) **İmza/e-mühür** — bir belgenin kim tarafından, hangi sırayla, hangi hukuki seviyede imzalanacağı `k-signature`'ın işidir; `archetype-document-composition` yalnız hazır belgeyi (`rendered_document` → `AssetRef`) üretir ve imzaya *hazır* eder, imza akışını yürütmez (bkz. `k-signature-trust-directive.md`). (2) **Sözleşme grafiği / müzakere** — sözleşmenin tarafları/değeri/tarihleri/redline'ları ve yaşam döngüsü `archetype-agreement`'ındır; `archetype-document-composition` bu grafiğin *belge render'ını* üretir, grafiği/müzakereyi *sahiplenmez* (bkz. `archetype-agreement-lifecycle-negotiation-directive.md`). (3) **Binary saklama** — render edilen DOCX/PDF/HTML binary'sinin object storage'da tutulması, türev/CDN/imzalı URL işi `k-storage`'ındır; `archetype-document-composition` çıktıyı `AssetRef` ile referanslar, binary'yi kendi tablosuna gömmez (bkz. `k-storage-dam-directive.md`). (4) **Serbest WYSIWYG / açık kelime-işlemci** — editör Word-benzeri *ama kontrollüdür*: kullanıcı şablon/madde/değişken sınırları içinde düzenler, gövdeyi keyfi HTML/serbest biçimle bozamaz; sınırsız WYSIWYG bir non-goal'dur (§8). (5) **Yetki/erişim kararı** — "bu aktör bu şablonu/maddeyi düzenleyebilir/yayımlayabilir mi?" kararı PDP'nindir (`k-policy-pdp`); `archetype-document-composition` yalnız PDP izniyle montaj/yayım yapar, yetkiyi vermez. (6) **Veri kaydının kendisi** — değişkenleri dolduran veri (sözleşme alanları, ürün verisi) kaynak archetype'ta yaşar; `variable_binding` ona *referans* verir, ana-veriyi kopyalamaz. (7) **Madde metninin hukuki geçerliliği/onayı** — bir maddenin hukuken doğru olması hukuk sahibinin sorumluluğudur; motor yalnız onaylı maddeyi monte eder, hukuki içeriği üretmez/garanti etmez. (8) Serbest kodla belge üretimi — hiçbir app doğrudan `python-docx`/PDF kütüphanesini çağırıp kendi belgesini üretemez; üretim yalnız bu archetype'ın sözleşmeli montaj servisinden ve onaylı şablondan geçer.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** `archetype-document-composition`, bir belgeyi bir **şablon (`document_template`) + değişken bağlamaları (`variable_binding`) + koşullu madde seçimi (`clause` + `assembly_rule`)** montajı olarak temsil eden; maddeleri merkezi bir **clause library**'de content-block olarak sürümlü tutan; montaj çıktısını değişmez, sürümlü, çok-formatlı (DOCX/PDF/HTML) bir artefakta (`rendered_document` → `AssetRef`) bağlayan; ve düzenlemeyi yapılandırılmış (Word-benzeri ama kontrollü) editörle sınırlayan doküman üretim archetype'ıdır. Belge serbest bir dosyada değil, tekrar-üretilebilir bir *tarif* (şablon+değişken+kural) olarak yaşar; render yalnız o tarifin bir *çıktısıdır*.

**Ne yapar:** Bir hukuk/içerik/pazarlama sahibi tanımlar (veya AI önerisini onaylar), motor uygular. Bir şablonu tanımlar (`document_template`: `sections`, `variables`, montaj kuralları); maddeleri clause library'den seçer ve şablona `ClauseRef` ile bağlar (standart/alternatif/fallback/yasak sınıflarıyla); değişkenleri bir veri kaynağına eşler (`variable_binding`: kayıt alanı / sabit / türetilmiş); montaj kurallarını "if koşul then include clause" olarak veri yürütür (`assembly_rule`); montajı deterministik gerçekleştirir (değişken doldurma + koşullu madde seçimi + bölüm sıralaması); çıktıyı çok-formatta (DOCX/PDF/HTML) render eder; sonucu değişmez, sürümlü, checksum'lı bir `rendered_document` olarak `k-storage`'a (`AssetRef`) yazar; çok-dilli varyantı `I18nText` üstünden üretir (aynı şablon, dile göre madde/etiket); iki sürüm arasında version diff üretir; her şablon/madde/kural değişimini ve her yayımı append-only audit'ler; render çıktısını imzaya `k-signature`'a hazır eder.

**Ne yapmaz:** Belgeyi *imzalamaz/mühürlemez* (`k-signature`; yalnız imzaya hazır `AssetRef` üretir). Sözleşme grafiğini/müzakereyi *sahiplenmez* (`archetype-agreement`; yalnız grafiğin render'ını üretir). Binary'yi tabloya *gömmez* (`k-storage`'da tutulur, `AssetRef` ile referanslanır). Yetki/erişim kararı *vermez* — bunu PDP yapar. Değişken verisini *kopyalamaz* — kaynak kayda referans verir. Serbest, sınırsız WYSIWYG *sunmaz* — düzenleme şablon/madde/değişken sınırına kısıtlıdır. Bir maddenin hukuki içeriğini *üretmez/garanti etmez* — onaylı maddeyi monte eder; içerik sorumluluğu insandadır. Bir belgeyi *sessizce* veya AI eliyle *yayımlamaz* — yayım insan onayıdır (`approval_ref`); yayımlanan `rendered_document` *değişmezdir* (yeniden üretim yeni sürümdür, mevcut sürüm mutasyona uğramaz).

## 5. Sözleşme şekli (alan yapısı)

Aşağıdaki beş tablo, `archetype-document-composition` primitifinin veri şeklini yalnızca *alan adı + tip + amaç* olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır ve `atomik-netlestirme-2026-07-01.md` kademe modeline bağlıdır: her semantik alan bir **atoma** (Katman A/B/C) oturur — `I18nText` (çok-dilli başlık/etiket/madde içeriği), `EnumType` (format/durum/madde-sınıfı/kaynak-tipi/koşul-operatörü), `ClauseRef` (maddenin kütüphaneye bağı, Katman C referans-değer), `AssetRef` (render çıktısı `k-storage`'da, Katman C), `EntityRef` (kaynak kayıt/şablon referansı, Katman C), `integer` (bölüm/madde sırası, sürüm no). Render edilen binary veritabanında değil `k-storage` object storage'da tutulur; tablo yalnız referansı, montaj tarifini ve sürüm/checksum metadata'sını taşır.

Bu tablo `document_template` çekirdek şablon kaydının alanlarını tanımlar. Aktör: hukuk/içerik/pazarlama sahibi tanımlar (veya AI önerisini onaylar); motor okur, montajı yürütür, sürümü sabitler.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | Şablonun benzersiz kimliği; `variable_binding`/`assembly_rule`/`rendered_document` bunu referanslar |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `key` | Text (NOT NULL) | Şablonun teknik anahtarı (ör. `nda_v1`, `print_catalog_a4`); sürümler-arası kimlik |
| `title` | `I18nText` (NOT NULL) | Çok-dilli şablon başlığı; fallback; şema değişmeden dil ekleme; ham string değil |
| `document_kind` | `EnumType`(contract, offer, letter, certificate, catalog, other) | Belge türü; montaj/render politikasını ve varsayılan formatı ayırır |
| `sections` | JSONB (bölüm ağacı) | Şablon bölümleri (başlık/sıra/içerik-yuvası); her yuva sabit metin, değişken veya clause slot taşır |
| `variables` | JSONB (değişken tanımları) | Şablonun beklediği değişkenler (ad + tip-atomu + zorunluluk + varsayılan); `variable_binding` bunları doldurur |
| `default_locale` | `EnumType`/BCP-47 | Varsayılan dil; çok-dilli varyantın taban locale'i (i18n) |
| `supported_formats` | `EnumType[]`(docx, pdf, html) | Bu şablonun render edilebildiği formatlar; en az biri zorunlu |
| `status` | `EnumType`(draft, review, published, deprecated) | Şablon yaşam döngüsü; yalnız `published` şablon belge üretebilir |
| `version_no` | integer (NOT NULL) | Şablon sürüm numarası; version diff ve `rendered_document` izlenebilirliği tabanı |
| `origin` | `EnumType`(human, ai_assisted) | Şablonun/son değişikliğin kaynağı; `ai_assisted` `approval_ref` gerektirir |
| `approval_ref` | UUID (nullable) | Şablon/madde/kural onayı ve yayımı için insan onayı (kim+zaman+gerekçe); AI dolduramaz |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/oluşturulma zamanı |
| `updated_at` | TIMESTAMPTZ (NOT NULL) | Son değişiklik zamanı |

Bu tablo `clause` maddesini (clause library content-block'u) tanımlar; bir madde bir kez kütüphanede tanımlanır, çok sayıda şablon ona `ClauseRef` ile bağlanır (kopyalama yerine referans). Aktör: hukuk/içerik sahibi maddeyi tanımlar/onaylar; motor referansı çözer, montajda içeriği yerleştirir.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | Maddenin benzersiz kimliği; `ClauseRef` bunu hedefler |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `key` | Text (NOT NULL) | Maddenin teknik anahtarı (ör. `governing_law`, `liability_cap`); sürümler-arası kimlik |
| `clause_class` | `EnumType`(standard, alternative, fallback, prohibited) | Madde sınıfı; standart (varsayılan) / alternatif (seçmeli) / fallback (geri-çekilme) / yasak (kullanılamaz, uyarı) |
| `title` | `I18nText` | Çok-dilli madde başlığı/etiketi |
| `body` | `I18nText` (NOT NULL) | Madde içeriği (çok-dilli content-block); şablon içine gömülen metin |
| `category` | `EnumType`/tag | Madde kategorisi (ör. legal, commercial, privacy); kütüphane gezinme/filtre |
| `supersedes` | `ClauseRef` (nullable) | Bu maddenin yerine geçtiği önceki sürüm (kütüphane sürüm zinciri) |
| `status` | `EnumType`(draft, review, published, deprecated) | Madde yaşam döngüsü; yalnız `published` madde şablona monte edilebilir |
| `version_no` | integer (NOT NULL) | Madde sürüm numarası; şablon hangi madde sürümünü bağladığını izler |
| `origin` | `EnumType`(human, ai_assisted) | Maddenin/son değişikliğin kaynağı; `ai_assisted` `approval_ref` gerektirir |
| `approval_ref` | UUID (nullable) | Madde içeriği onayı (insan; kim+zaman+gerekçe); AI dolduramaz |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

Bu tablo `variable_binding`'i tanımlar; bir şablon değişkenini bir veri kaynağına eşler. Aktör: içerik sahibi bağlamayı tanımlar (AI önerebilir → draft); motor montajda kaynağı çözüp değeri yerleştirir. Ana-veri kopyalanmaz — kayıt alanı bir referansla çözülür.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | Bağlamanın benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `template_id` | UUID (FK → document_template.id) | Bağlamanın ait olduğu şablon |
| `variable_key` | Text (NOT NULL) | Şablonun `variables` tanımındaki değişken adı |
| `source_kind` | `EnumType`(record_field, constant, derived) | Değerin kaynağı: kaynak-kayıt alanı / sabit / türetilmiş (`k-computation`) |
| `source_ref` | `EntityRef` (nullable) | `record_field`/`derived` için kaynak kayıt/hesap referansı (ör. agreement alanı); tenant-kapsamlı |
| `source_path` | Text (nullable) | Kaynak kayıt içindeki alan yolu (ör. `total_value`); ana-veri kopyalanmaz, çözülür |
| `constant_value` | JSONB (nullable) | `constant` kaynak için sabit değer (atom-tipli; ör. `Money`/`I18nText`) |
| `is_required` | Boolean | Zorunlu değişken mi; eksikse montaj `MissingVariableError` fırlatır |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

Bu tablo `assembly_rule`'u tanımlar; "if koşul then include/exclude clause" koşullu montaj mantığını veri olarak tutar. Aktör: içerik/hukuk sahibi kuralı tanımlar (AI önerebilir → draft); motor koşulu değerlendirip ilgili maddeyi montaja alır/çıkarır. Kural veri olduğundan denetlenebilir ve sürümlenebilir; koşul serbest kod değildir.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | Kuralın benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `template_id` | UUID (FK → document_template.id) | Kuralın ait olduğu şablon |
| `clause_ref` | `ClauseRef` (Katman C) | Koşul karşılanınca dahil/hariç edilecek madde (kütüphane referansı) |
| `effect` | `EnumType`(include, exclude) | Koşul doğruysa maddeyi montaja al (include) veya çıkar (exclude) |
| `condition_variable` | Text (NOT NULL) | Koşulun okuduğu değişken (ör. `party_country`, `contract_type`) |
| `operator` | `EnumType`(eq, neq, in, not_in, gt, lt, exists) | Koşul operatörü; serbest kod değil, sabit operatör kümesi |
| `condition_value` | JSONB (nullable) | Koşul karşılaştırma değeri (atom-tipli) |
| `priority` | integer | Kural değerlendirme sırası; çakışan include/exclude için deterministik öncelik |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit |

Bu tablo `rendered_document` montaj çıktısını tanımlar; belge üretimi sonucunda oluşan **değişmez, sürümlü** artefakttır. Aktör: motor üretir (insan yayım onayıyla); binary `k-storage`'da, burada referans + sürüm + checksum. Yayımlanan bir `rendered_document` mutasyona uğramaz — yeniden üretim yeni bir kayıttır.

| Alan | Tip (atom) | Amaç |
|---|---|---|
| `id` | UUID (PK) | Render çıktısının benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `template_id` | UUID (FK → document_template.id) | Üretildiği şablon |
| `template_version` | integer (NOT NULL) | Üretim anındaki şablon sürümü (izlenebilirlik; hangi tariften çıktı) |
| `source_ref` | `EntityRef` (nullable) | Belgenin doldurulduğu kaynak kayıt (ör. agreement); tenant-kapsamlı |
| `format` | `EnumType`(docx, pdf, html) | Çıktı formatı; aynı montaj birden çok formata ayrı `rendered_document` üretebilir |
| `locale` | `EnumType`/BCP-47 | Çıktının dili; çok-dilli varyant (I18nText) |
| `asset` | `AssetRef` (FK-scope → k-storage) | Render binary'si; `k-storage`'da tutulur, burada referans (gömme yasak) |
| `checksum` | Text (NOT NULL) | İçerik hash'i (SHA-256); değişmezlik ve bütünlük doğrulama |
| `variable_snapshot` | JSONB | Üretim anında kullanılan değişken değerlerinin anlık görüntüsü (yeniden-üretilebilirlik/audit) |
| `clause_snapshot` | JSONB | Monte edilen madde `ClauseRef`+sürüm listesi (hangi madde hangi sürümle girdi) |
| `document_version` | integer (NOT NULL) | Bu belgenin çıktı sürümü; version diff ve `k-signature`'a hangi sürümün gittiği |
| `status` | `EnumType`(rendering, ready, published, superseded, failed) | Çıktı durumu; `published` = imzaya/paylaşıma hazır, değişmez |
| `approval_ref` | UUID (nullable) | Belge yayımı için insan onayı (kim+zaman+gerekçe); AI dolduramaz |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Audit/üretim zamanı |

## 6. WBS / kernel yerleşimi

`archetype-document-composition`, ürün-archetype kümesine (`archetype-*`) bir `module`-seviyesi düğüm olarak eklenir; `archetype-agreement`, `archetype-taxonomy` ile aynı katmandadır. Altında asıl kod-teslimatı olan en az bir `archetype` (kod) düğümü durur. Bağımlılıklar `wbs-field-semantics`'e uyar: `dependsOn` = teknik/yürütme sırası (kritik yol); `related` = yalnız gezinme.

Bu tablo `archetype-document-composition` düğümünün WBS yerleşimini ve bağımlılıklarını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `archetype-document-composition` | module | `k-storage`, `k-policy-pdp`, `i18n` | archetype/ürün |

`dependsOn` gerekçesi: `archetype-document-composition` render çıktısını `k-storage`'a yazamadan (`AssetRef` hedefi) belge üretemez — bu yüzden `k-storage` önce gelir. Yetki/yayım kararı PDP'ye (`k-policy-pdp`) bağlı olduğundan montaj/yayım PDP'siz çalışamaz. Çok-dilli varyant `I18nText` sözleşmesine (`i18n`) dayanır. `related` ile (karar üretmeden) `archetype-agreement` (ana tüketici; sözleşme grafiğinin belge render'ı), `k-signature` (render çıktısını imzaya sokan tüketici), `atomic-types-directive` (madde/değişken atomları), PIM Faz 11 `print_catalog` (baskı katalog tüketicisi) düğümlerine bağlanır. `archetype-agreement` ve `k-signature` kendi `dependsOn`/`related`'ında `archetype-document-composition`'ı listeler — yani doküman üretimi imza/agreement akışının bir *önkoşul çıktısıdır*.

## 7. Backend gereksinimleri (montaj + render motoru + async)

Aşağıdaki gereksinimler CLM Document Automation + PIM `print_catalog` portunu bağlar; her biri test-önce (kırmızı→yeşil) yaşam döngüsüne tabidir. Motor tarafı `platform_document` paketinde yaşar. Çekirdek imzalar: `create_template(key, title, document_kind, sections, variables, tenant_id) -> DocumentTemplate` (şablon tanımlar; `status=draft`); `publish_template(template_id, approval_ref) -> DocumentTemplate` (şablon/madde/kural yayımı; insan onayı + PDP kontrolü, doğrudan `UPDATE status` yasak); `bind_variable(template_id, variable_key, source_kind, source_ref, source_path) -> VariableBinding` (değişkeni kaynağa eşler); `add_assembly_rule(template_id, clause_ref, effect, condition_variable, operator, condition_value) -> AssemblyRule` (koşullu madde kuralı); `assemble(template_id, source_ref, format, locale) -> RenderedDocument` (montajı yürütür: değişken doldurma + koşullu madde seçimi + bölüm sıralaması + render); `publish_document(rendered_id, approval_ref) -> RenderedDocument` (belge yayımı; insan onayı, değişmez kilit); `diff_versions(template_id, from_version, to_version) -> [ClauseDiff]` (iki sürüm arası deterministik madde-madde fark).

- **Montaj motoru (deterministik):** `assemble` şablonun `sections` ağacını gezer; her değişken yuvasını `variable_binding` üzerinden çözer (kaynak-kayıt alanı `source_ref`/`source_path` ile, sabit `constant_value` ile, türetilmiş `k-computation` ile); her clause slot için ilgili `assembly_rule`'ları `priority` sırasıyla değerlendirir (koşul doğruysa `include`, aksi `exclude`; `prohibited` sınıf madde asla monte edilmez ve uyarı üretir); sonucu deterministik olarak monte eder. Aynı şablon + aynı değişken + aynı locale her zaman aynı montajı üretir (yeniden-üretilebilirlik).
- **Koşullu madde (assembly_rule) — veri, kod değil:** Koşul serbest kod/eval **değildir**; sabit operatör kümesinden (`eq/neq/in/not_in/gt/lt/exists`) ve tenant-kapsamlı değişkenlerden kurulur. Bu, "if müşteri yurtdışıysa şu maddeyi ekle" mantığını denetlenebilir, sürümlü ve test-edilebilir veri yapar; app-özel `if` blokları **yasaktır**.
- **Değişmez çıktı (rendered_document):** `assemble` çıktısı `checksum` (SHA-256) + `variable_snapshot` + `clause_snapshot` + `template_version` + `document_version` ile bir `rendered_document` üretir; `publish_document` sonrası artefakt **değişmezdir** — mevcut binary/kayıt mutasyona uğramaz. Belgeyi "güncellemek" yeni bir montaj + yeni sürümdür (`superseded` zinciri). Bu, imza/hukuk ihtilafında "hangi belge imzalandı?" sorusunu kesin yanıtlar.
- **Çok-formatlı render (DOCX/PDF/HTML):** Tek `RenderBackend` arayüzü (assemble→docx, assemble→pdf, assemble→html) montaj sonucunu birden çok formata çıkarır; format `supported_formats`'tan seçilir; aynı montaj birden çok formatta ayrı `rendered_document` (aynı `variable_snapshot`, farklı `format`) üretir. Doğrudan `python-docx`/PDF kütüphanesi app'te **yasak**; erişim yalnız sözleşmeli `RenderBackend`'ten.
- **Çok-dilli varyant (I18nText):** Şablon `title`, madde `body`/`title` ve değişken etiketleri `I18nText`'tir; `assemble(locale=...)` istenen dilin madde içeriğini ve etiketlerini seçer, eksik dilde `default_locale` fallback uygular. Aynı şablon dile göre farklı madde varyasyonu (ör. ülkeye-özel yasal madde) taşıyabilir; ham string gömülmez.
- **Version diff:** `diff_versions` iki şablon (veya iki `rendered_document`) sürümü arasında madde-madde (eklenen/silinen/değişen madde, değişen değişken bağlaması) deterministik fark üretir; bu, "sürüm 2 sürüm 1'den nerede ayrılıyor?" sorusunu yanıtlar (redline değil — o `archetype-agreement`'ta; burası şablon/belge sürüm farkı).
- **Async render:** Ağır render (büyük baskı kataloğu, çok-sayfa PDF, toplu üretim) senkron istek yolunda **değil**, worker'a (Celery/ARQ; bkz. `k-worker`) offload edilir; `status=rendering` → tamamlanınca `ready`; hata `failed` + yeniden-deneme. Küçük belge senkron çözülebilir.
- **Clause library entegrasyonu:** Maddeler kütüphanede (`clause`) content-block olarak sürümlü tutulur; şablon maddeyi `ClauseRef` ile bağlar (kopyalamaz); `rendered_document.clause_snapshot` hangi madde sürümünün monte edildiğini sabitler. Bir madde güncellenince mevcut yayımlanmış belge etkilenmez (snapshot); yeni belge yeni sürümü alır.
- **Audit:** Her şablon/madde/kural değişimi, her yayım (`publish_template`/`publish_document`) ve her montaj `AuditLogger.log()` ile `actor` + `resource=document_template`/`rendered_document` yazılır ve append-only tutulur (v1 §2.5). Kim hangi şablonu/maddeyi ne zaman yayımladı, hangi belge hangi tariften çıktı — izli.
- **Hata formatı:** `{code, message, trace_id, details}` (v1 §3.1); `get_logger()` kullanılır, `print()` yasak.

## 8. Frontend gereksinimleri (yapılandırılmış editör)

Aşağıdaki gereksinimler Vite + React + TanStack yığınına ve config-driven surface ilkesine uyar; CLM Document Automation + PIM katalog üretim ekranını bağlar. Bileşenler SCSS + token ile biçimlenir; ikonlar Phosphor'dur. Mock veri yasaktır — her şey runtime endpoint'inden gelir. Editör **serbest WYSIWYG değil, yapılandırılmış (structured) editördür**.

- **Yapılandırılmış editör (Word-benzeri ama kontrollü):** Kullanıcı bir belgeyi şablonun `sections` ağacı üzerinden düzenler: sabit metin bloklarını, değişken yuvalarını ve clause slot'larını görür; her clause slot için kütüphaneden madde seçer (standart/alternatif/fallback) ama gövdeyi keyfi HTML/serbest biçimle *bozamaz*. `prohibited` sınıf madde seçilemez (uyarı). Düzenleme şablon/madde/değişken sınırına kısıtlıdır; sınırsız WYSIWYG (react-markdown dahil zengin-metin serbest editör) **yasaktır** (§Non-goals).
- **Clause library görünümü:** Madde kütüphanesi sınıfa (standart/alternatif/fallback/yasak), kategoriye ve dile göre filtrelenir; her maddenin sürümü ve `supersedes` zinciri gösterilir; içerik `I18nText` olarak dile göre görüntülenir; veri TanStack Query ile çekilir, hardcoded madde/şablon referansı **yasak**.
- **Değişken/bağlama paneli:** Şablonun beklediği değişkenler (`variables`) ve bağlamaları (`variable_binding`: kaynak-kayıt/sabit/türetilmiş) listelenir; eksik/zorunlu değişken (montajı bloklayan) açıkça işaretlenir; kaynak-kayıt bağlaması hedef alan yolunu (`source_path`) gösterir (ana-veri kopyalanmaz).
- **Montaj önizleme + format seçimi:** Kullanıcı montaj sonucunu (koşullu maddeler dahil çözülmüş) önizler; hangi `assembly_rule`'un hangi maddeyi neden dahil/hariç ettiği görünür; çıktı formatı (DOCX/PDF/HTML) ve locale seçilir; büyük render `status=rendering` olarak "üretiliyor", `failed` yeniden-deneme aksiyonuyla ayrışır.
- **Sürüm/diff görünümü:** İki şablon/belge sürümü (`version_no`) arası **version diff** görsel olarak (eklenen/silinen/değişen madde, değişen bağlama) gösterilir; fark yalnız renge dayanmaz (ikon/etiket ile). Yayımlanan `rendered_document` "değişmez — yayımlandı" olarak işaretlenir ve düzenlenemez.
- **AI öneri görünürlüğü (guardrail):** AI'ın ürettiği madde/değişken/koşul taslakları ve varyant metinleri "AI önerisi — onay bekliyor" rozetiyle ayrışır; yürürlükte değildir ve şablona/maddeye ham yazılmaz; insan onayı butonu (kabul/düzelt/reddet) ile karara bağlanır. AI "yayımla" aksiyonunu tetikleyemez.
- **Erişilebilirlik + i18n:** WCAG 2.2 AA taban; dokunmatik hedef ≥ 44x44px; renk kontrastı ≥ 4.5:1; diff/madde-sınıf vurgusu yalnız renge dayanmaz. Şablon/madde/durum/sınıf metinleri `I18nText`/`EnumType` alias üzerinden çok-dilli (TR/EN); ham string gömülmez; ikonlar Phosphor.

## 9. Multi-tenant / RLS (tenant-scoped şablon + clause library + çıktı)

Her `document_template`, `clause`, `variable_binding`, `assembly_rule` ve `rendered_document` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). PostgreSQL RLS ile bir tenant başka tenant'ın şablonunu/maddesini/kuralını/çıktısını göremez veya etkileyemez: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Referanslar tenant sınırını *genişletemez*: `variable_binding.source_ref` (kaynak kayıt `EntityRef`), `assembly_rule.clause_ref`/şablon-madde bağı (`ClauseRef`) ve `rendered_document.asset` (`AssetRef` → `k-storage`) mutlaka aktif tenant kapsamında çözülür; cross-tenant referans `TenantViolationError` fırlatır ve audit'lenir. Bir tenant başka tenant'ın maddesini şablonuna bağlayamaz; bir belge başka tenant'ın kaynak kaydından değişken dolduramaz. Render çıktısı `k-storage`'a yazılırken `object_key` tenant-prefix kapsamındadır (bkz. `k-storage §9`). Değişken doldurma (`variable_snapshot`) ve türetim (`k-computation`) çağrıları tenant'ı taşır. Şablon içinde PII taşınan değişkenler (ör. taraf `national_id`) kaynak archetype'ın alan-düzeyi maskeleme/şifreleme sözleşmesine tabidir; render çıktısı da bu sınıfı korur. Schema-per-tenant / RLS geçiş eşiği ADR-0026'ya uyar.

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`) Bu archetype hukuki/ticari sonuç doğuran belgeler ürettiği için (yanlış madde monte edilen bir sözleşme = hukuki risk; hatalı yayımlanan bir belge = geri-çağırma) AI'ın autonomy'si dardır: AI madde/değişken/koşul taslağı ve varyant metni *önerir* (draft) ama hiçbir şablonu/maddeyi tek başına yayımlayamaz ve **final dokümanı tek başına yayımlayamaz**; her onay ve yayım insan kararıdır.

Bu tablo `archetype-document-composition` üzerindeki AI autonomy sınırlarını tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| Madde (clause) taslağı *önerme* | `draft` | AI madde içeriği/varyantı önerir (`ai_assisted`); insan onaylar (`approval_ref`), AI **yayımlayamaz** |
| Değişken/bağlama taslağı *önerme* | `draft` | AI değişken tanımı/kaynak-eşleme önerir; insan onaylar, ham yazamaz |
| Koşul (assembly_rule) taslağı *önerme* | `draft` | AI "if koşul then include clause" kuralı önerir; insan onaylar; serbest kod üretmez |
| Çok-dilli varyant metni *önerme* | `draft` | AI madde çevirisi/varyantı önerir; dil/hukuk sahibi onaylar |
| Şablon/madde yayımlama | `none` | `publish_template`/madde `published` yalnız insan onayı + PDP; AI **yayımlayamaz** |
| Final dokümanı yayımlama | `none` | `publish_document` (imzaya/paylaşıma hazır değişmez belge) yalnız insan onayı; **AI tek başına yayımlayamaz** |
| `prohibited` maddeyi montaja alma | `none` | Yasak sınıf madde asla monte edilmez; AI bu sınırı aşamaz |
| Yayımlanmış belgeyi değiştirme | `none` | `rendered_document` yayım sonrası değişmez; AI (ve motor) mutasyona uğratamaz — yeni sürüm gerekir |
| Karar-logu / audit değişimi | `none` | Audit append-only; AI değiştiremez |

Mutlak sınırlar: AI main branch'e push edemez; app/module düğümü üretemez/güncelleyemez; ruleset override edemez; kanıtsız "yayımlandı/bitti" diyemez. En kritik sınır: **AI final dokümanı tek başına yayımlayamaz** — madde/değişken/koşul/varyant yalnız `draft`'tır; şablon/madde onayı ve belge yayımı (`publish_document`) insan kararıdır ve PDP izniyle çalışır. PDP kararı erişim/yayım yetkisini belirler; AI PDP kararını override edemez. Bir belgenin imzaya gitmesi (`k-signature`) yalnız yayımlanmış, insan-onaylı `rendered_document` üzerinden olur; AI imzaya gönderemez.

## 11. Bağlama (agreement/signature/storage'ı besler; PIM #39 tüketir)

`archetype-document-composition` bir *üretim-archetype'ıdır*: veri kaydını belgeye çevirir ve çıktıyı diğer primitiflere *besler*; imza/saklama/sözleşme-grafiği *işini yapmaz*, onları tipli referanslarla bağlar.

**`archetype-agreement` bağlama (ana tüketici):** `archetype-agreement` sözleşme grafiğini (taraflar/maddeler/değer/tarihler) *veri kaynağı* olarak tutar; imzalanacak/paylaşılacak belge (`document` `AssetRef`) bu archetype'tan üretilir. Agreement bir şablon (`document_kind=contract`) seçer, değişkenlerini grafiğinden doldurur (`variable_binding.source_ref`=agreement), maddelerini clause library'den `assembly_rule` ile koşullu monte eder; `assemble` çıktısı (`rendered_document`) agreement'ın `document` alanına `AssetRef` ile bağlanır. Grafik veri kaynağı, kompozisyon belge çıktısıdır; belge yalnız grafiğin bir *render'ıdır* (bkz. `archetype-agreement §11`).

**`k-signature` bağlama (render'ı imzaya yollar):** İmzalanacak doküman `k-signature`'a *hazır* `AssetRef` olarak verilir; `k-signature` yalnız hazır belgeyi imza akışına sokar, şablon/birleştirme yapmaz (bkz. `k-signature §3/§4`). `archetype-document-composition` `publish_document` ile **değişmez** bir `rendered_document` üretir; imza tam olarak bu sürüm üzerine atılır (`document_version`/`checksum` ile "hangi belge imzalandı?" kesin). Belge → imza yönü tek yönlüdür: kompozisyon üretir, imza tüketir.

**`k-storage` bağlama (render çıktısı):** Render edilen DOCX/PDF/HTML binary'si `k-storage` object storage'da tutulur; `rendered_document.asset` bir `AssetRef`'tir (gömme yasak). `k-storage` binary'nin türev/CDN/imzalı-URL/checksum işini yapar; `archetype-document-composition` yalnız üretir ve referanslar (bkz. `k-storage §11` — ArcheType'lar `digital_asset.id` bağlar, gömülü URL değil).

**PDP (`k-policy-pdp`) bağlama:** "Bu aktör bu şablonu/maddeyi düzenleyebilir/yayımlayabilir mi?" yetki kararı PDP'nindir; `archetype-document-composition` montaj/yayımı yalnız PDP izniyle yapar, yetkiyi vermez. Yayım (`publish_template`/`publish_document`) PDP kontrolünden geçer.

**i18n bağlama:** Çok-dilli varyant (`I18nText` madde/etiket/başlık) `i18n-standard.md` sözleşmesine oturur; `assemble(locale=...)` dile göre madde seçer, eksik dilde `default_locale` fallback uygular; ham string gömülmez.

**`k-computation` bağlama:** Türetilmiş değişken (`variable_binding.source_kind=derived`; ör. sözleşme toplam değeri, indirim oranı) `k-computation`'ın türettiği denetlenebilir değerdir; kompozisyon bunu *referanslar/çözer*, aritmetiği yapmaz.

**PIM Faz 11 (`print_catalog` — #39) bağlama:** PIM-v2 §Faz 11 `print_catalog` portu (PDF katalog, çoklu layout/dil) bu archetype'ı tüketir: ürün verisi değişken kaynağı (`variable_binding`), katalog düzeni bir şablon (`document_kind=catalog`), çok-dil `I18nText`/`locale`, çıktı `rendered_document` (`format=pdf`) → `k-storage`. PIM kendi PDF üreticisini açmaz; baskı kataloğu bu montaj/render sözleşmesinden geçer.

**Atom/Fragment bağlama:** Her alan `atomik-netlestirme §12`'deki bir atoma oturur — `I18nText` (madde/etiket içeriği), `EnumType` (format/durum/sınıf/operatör), `ClauseRef` (madde kütüphane bağı), `AssetRef` (render çıktısı), `EntityRef` (kaynak/şablon referansı). `archetype-document-composition` "hazır" sayılması için dayandığı atomların (`I18nText`/`EnumType`/`ClauseRef`/`AssetRef`/`EntityRef`) test-önce kilitlenmiş olması gerekir (bkz. `atomic-types-directive`). Eksik atom `string`/`json`'a sıkışırsa çok-dillilik/madde-referansı/çıktı-bağı sessizce çöker.

## 12. Test stratejisi

Aşağıdaki testler CLM Document Automation + PIM `print_catalog` kabul kriterlerini ve `core-contract-pack` DoD'unu karşılar; hepsi test-önce (önce kırmızı) yazılır. Kompozisyon bağları (`k-storage`/`k-signature`/`archetype-agreement`/`k-computation`) stub/sandbox adaptörle test edilir.

Bu tablo `archetype-document-composition` için zorunlu test senaryolarını ve türlerini tanımlar.

| # | Senaryo | Test türü |
|---|---|---|
| 1 | Montaj determinizmi: aynı şablon + aynı değişken + aynı locale her zaman aynı montajı/checksum'ı üretiyor | Entegrasyon |
| 2 | Değişken doldurma: `variable_binding` kaynak-kayıt/sabit/türetilmiş değeri çözüyor; zorunlu eksikte `MissingVariableError` | Entegrasyon |
| 3 | Koşullu madde: `assembly_rule` (if koşul then include/exclude) doğru maddeyi montaja alıp çıkarıyor; `priority` sırası deterministik | Entegrasyon |
| 4 | Yasak madde: `clause_class=prohibited` madde asla monte edilmiyor, uyarı üretiliyor | Contract |
| 5 | Değişmez çıktı: `publish_document` sonrası `rendered_document` binary/kayıt mutasyona uğramıyor; güncelleme yeni sürüm | Entegrasyon |
| 6 | Çok-formatlı render: aynı montaj DOCX/PDF/HTML üretiyor; doğrudan `python-docx`/PDF kütüphanesi app'te yok | Entegrasyon + Contract |
| 7 | Çok-dilli varyant: `assemble(locale)` dile göre madde/etiket seçiyor; eksik dilde `default_locale` fallback | Entegrasyon |
| 8 | Version diff: `diff_versions` iki şablon/belge sürümü arasında madde-madde deterministik fark üretiyor | Entegrasyon |
| 9 | Clause snapshot: `rendered_document.clause_snapshot` monte edilen madde sürümlerini sabitliyor; madde güncellemesi eski belgeyi etkilemiyor | Entegrasyon |
| 10 | Kompozisyon-imza: yayımlanmış `rendered_document` `k-signature`'a `AssetRef` olarak hazır ediliyor (değişmez sürüm) | Entegrasyon |
| 11 | Kompozisyon-storage: render binary'si `k-storage`'a yazılıyor, `asset` `AssetRef`; gömme yok | Entegrasyon |
| 12 | AI guardrail: AI madde/değişken/koşul/varyant yalnız `draft` öneriyor; şablon/madde/belge yayımlayamıyor | Entegrasyon |
| 13 | Yapılandırılmış editör: düzenleme şablon/madde/değişken sınırında; serbest WYSIWYG/keyfi HTML reddediliyor | E2E |
| 14 | Tenant izolasyonu: A tenant B'nin şablonunu/maddesini/çıktısını göremiyor, cross-tenant referans reddediliyor (≥10 negatif case) | Entegrasyon (negatif) |
| 15 | Audit: her şablon/madde/kural değişimi + yayım + montaj append-only audit'e düşüyor | Entegrasyon |
| 16 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |
| 17 | GraphQL/PEP koruması: her resolver/endpoint `permission_classes`/`Depends(require_tenant)` taşıyor | Contract |

## 13. Acceptance criteria

- Belge birinci-sınıf `document_template` (şablon + `sections` + `variables` + montaj kuralları) olarak tanımlanıyor; maddeler clause library'den `ClauseRef` ile bağlanıyor (kopyalanmıyor); değişkenler `variable_binding` ile kaynağa eşleniyor (CLM Document Automation kabul kriteri).
- Montaj deterministik çalışıyor: `assemble` değişkenleri dolduruyor, `assembly_rule` (if koşul then include/exclude) koşullu maddeleri seçiyor, `prohibited` madde asla monte edilmiyor; aynı girdi aynı çıktı/checksum üretiyor.
- Çıktı değişmez, sürümlü ve çok-formatlı: `rendered_document` `checksum` + `variable_snapshot` + `clause_snapshot` + `document_version` ile üretiliyor; `publish_document` sonrası değişmez; DOCX/PDF/HTML aynı montajdan çıkıyor; doğrudan `python-docx`/PDF kütüphanesi app'te yok.
- Çok-dilli varyant çalışıyor: `assemble(locale)` dile göre madde/etiket seçiyor, eksik dilde `default_locale` fallback; ham string yok.
- Version diff çalışıyor: iki şablon/belge sürümü arasında madde-madde deterministik fark üretiliyor.
- Kompozisyon çalışıyor: yayımlanmış belge `k-signature`'a `AssetRef` olarak hazır ediliyor, render binary'si `k-storage`'a yazılıyor (`asset` `AssetRef`, gömme yok), `archetype-agreement` sözleşme grafiğini `document` render'ıyla dolduruyor, türetilmiş değişken `k-computation`'dan çözülüyor.
- Yapılandırılmış editör düzenlemeyi şablon/madde/değişken sınırında tutuyor; serbest WYSIWYG/keyfi HTML reddediliyor.
- AI madde/değişken/koşul/varyant yalnız `draft` öneriyor; AI şablonu/maddeyi/final dokümanı tek başına yayımlayamıyor (test-kanıtlı); yayım insan onayı + PDP.
- Cross-tenant şablon/madde/çıktı/referans erişimi en az 10 negatif test case ile reddediliyor ve audit'leniyor.
- Her şablon/madde/kural değişimi, yayım ve montaj append-only audit'e düşüyor.
- Alembic migration downgrade otomatik test geçiyor; `check-core-contract` (tenant guard, resolver koruması, audit çağrısı, indeks) yeşil.

## 14. Anti-patterns

- **Serbest kelime-işlemci dosyası:** Belgeyi tek `.docx`/`bytea` dosyası olarak tutup şablon/değişken/madde tarifine çıkarmamak — YASAK; belge bir tariftir (şablon+değişken+kural), render yalnız çıktısıdır.
- **Doğrudan doküman kütüphanesi:** App'te `python-docx`/PDF üreticisini doğrudan çağırmak — YASAK; üretim yalnız sözleşmeli `RenderBackend` + onaylı şablondan.
- **Koşulu kodla yazma:** "if müşteri yurtdışıysa şu maddeyi ekle" mantığını app-özel `if` bloğuyla kurmak — YASAK; koşul `assembly_rule` (veri, sabit operatör) olarak tutulur.
- **Maddeyi kopyalama:** Bir maddeyi şablona gömülü metin olarak kopyalamak — YASAK; madde clause library'de content-block, şablon `ClauseRef` ile bağlar (sürüm izli).
- **Yayımlanmış belgeyi değiştirme:** `rendered_document` binary'sini/kaydını yayım sonrası mutasyona uğratmak — YASAK; değişmez; güncelleme yeni montaj + yeni sürüm.
- **Binary'yi tabloya gömme:** Render DOCX/PDF'ini `bytea` kolonuna yazmak — YASAK; binary `k-storage`'da, burada `AssetRef` referansı.
- **Serbest WYSIWYG:** Sınırsız zengin-metin editör (react-markdown dahil) ile gövdeyi keyfi biçimlemek — YASAK; yapılandırılmış editör, şablon/madde/değişken sınırı.
- **Yasak maddeyi monte etme:** `clause_class=prohibited` maddeyi belgeye almak — YASAK; asla monte edilmez, uyarı üretilir.
- **İmza/agreement/storage işini içeride yapma:** Kompozisyon içinde imza akışı yürütmek, sözleşme grafiğini sahiplenmek veya binary saklamak — YASAK; sırasıyla `k-signature`/`archetype-agreement`/`k-storage`.
- **AI'ın belge yayımı:** AI'ın bir şablonu/maddeyi/final dokümanı tek başına yayımlaması — YASAK; `autonomy: none`, insan onayı + PDP.
- **Değişken verisini kopyalama:** Kaynak kaydın ana-verisini şablona kopyalamak — YASAK; `variable_binding` referansla çözer.
- **Sessiz yayım:** Şablon/madde/belge yayımını audit'siz/`approval_ref`'siz yapmak — YASAK; kim-ne-zaman-hangi-gerekçe izli.
- **Sürüm karıştırma:** Hangi madde/şablon sürümünün monte edildiğini `clause_snapshot`/`template_version` ile sabitlememek — YASAK; "hangi belge imzalandı?" kesin yanıtlanmalı.

## 15. Definition of Done

- §12'deki 17 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil geçişi belgeli).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract.mjs` yeşil.
- Alembic migration downgrade CI'da çalışıyor; `document_template`/`clause`/`variable_binding`/`assembly_rule`/`rendered_document` şeması §5 tablolarıyla ve atom eşlemesiyle (`I18nText`/`EnumType`/`ClauseRef`/`AssetRef`/`EntityRef`) uyumlu; şablon/madde/belge yayımı ve montaj audit'i append-only.
- Montaj motoru (değişken doldurma + koşullu madde + bölüm sıralaması) deterministik; çok-formatlı render (DOCX/PDF/HTML) ve çok-dilli varyant (I18nText fallback) çalışıyor; `rendered_document` değişmez + sürümlü + checksum'lı (entegrasyon kanıtı).
- Kompozisyon bağları çalışıyor (entegrasyon kanıtı): `rendered_document`→`k-storage` (`AssetRef`), yayımlanmış belge→`k-signature` (imzaya hazır), `document`←`archetype-agreement` (grafik render'ı), türetilmiş değişken←`k-computation`, çok-dil←`i18n`, `print_catalog`←PIM Faz 11.
- CLM Document Automation uçtan-uca akış (şablon tanımla → maddeleri kütüphaneden bağla → değişkenleri eşle → montaj kurallarını kur → montaj + render → yayım (değişmez) → imzaya/paylaşıma hazır) çalışıyor.
- ADR-DOC1 "Kilitli" statüsünde (insan onayı); `archetype-document-composition` düğümü ve altındaki `archetype` (kod) düğümü WBS'te doğru `dependsOn` (`k-storage`, `k-policy-pdp`, `i18n`) ile mevcut; dayandığı atomlar (`I18nText`/`EnumType`/`ClauseRef`/`AssetRef`/`EntityRef`) test-önce kilitli.
- AI-guardrail testi: AI'ın şablon/madde/final doküman yayımı denemeleri reddediliyor; yalnız `draft` (madde/değişken/koşul/varyant) öneri üretilebiliyor; PDP override edilemiyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (aktör-açık, emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock yok).

## 16. CLM / PIM karşılığı (Document Automation + print_catalog #39)

Aşağıdaki tablo, bu sözleşmenin CLM Document Automation ve PIM baskı-katalog (#39) gereksinimlerini `archetype-document-composition` sözleşme öğelerine nasıl eşlediğini gösterir; her satır bir yeteneği üretim-archetype'ına bağlar. Bu eksen ürünün *belge üretim katmanıdır*: veri kaydını şablon+değişken+koşullu madde montajıyla değişmez, çok-formatlı bir artefakta çevirir ve `surface-v2`'nin non-goal bıraktığı doküman üretimini karşılar.

| CLM Document Automation / PIM gereksinimi | archetype-document-composition karşılığı |
|---|---|
| Belge = tekrar-üretilebilir tarif (şablon+değişken+madde), serbest dosya değil | §4 tanım; §5 `document_template`; §14 anti-pattern (serbest dosya) |
| Şablon (bölümler + değişkenler + montaj kuralları) | §5 `document_template` (`sections`/`variables`); §7 `create_template` |
| Clause library (content-block; standart/alternatif/fallback/yasak; sürüm) | §5 `clause` (`clause_class` `EnumType`, `body` `I18nText`, `supersedes`); §8 kütüphane görünümü |
| Değişken bağlama (kayıt alanı / sabit / türetilmiş) | §5 `variable_binding` (`source_kind`/`source_ref`/`source_path`); §7 `bind_variable` |
| Koşullu montaj (if koşul then include clause) | §5 `assembly_rule` (`effect`/`operator`/`condition_*`); §7 montaj motoru |
| Değişmez, sürümlü çıktı (checksum + snapshot) | §5 `rendered_document`; §7 değişmez çıktı; §14 (yayımlanmışı değiştirme) |
| Çok-formatlı render (DOCX/PDF/HTML) | §5 `supported_formats`/`format`; §7 `RenderBackend` |
| Çok-dilli varyant (I18nText) | §5 `title`/`body` `I18nText`, `locale`; §7 çok-dilli varyant; §11 i18n bağlama |
| Version diff (şablon/belge sürüm farkı) | §7 `diff_versions`; §8 sürüm/diff görünümü |
| Yapılandırılmış editör (Word-benzeri ama kontrollü) | §8 yapılandırılmış editör; §3 non-goal (serbest WYSIWYG) |
| İmzaya hazır etme (composition → signature) | §11 `k-signature` bağlama; §5 `rendered_document.asset` `AssetRef` |
| Render çıktısı saklama (composition → storage) | §11 `k-storage` bağlama; §5 `asset` `AssetRef` |
| Sözleşme grafiğinin belge render'ı (agreement tüketici) | §11 `archetype-agreement` bağlama; agreement `document` `AssetRef` |
| PIM baskı katalog (#39, `print_catalog`; PDF, çoklu layout/dil) | §11 PIM Faz 11 bağlama; `document_kind=catalog`, `format=pdf`, `locale` |
| AI madde/değişken taslağı (öner → insan onay → yayım) | §8 AI öneri görünürlüğü; §10 autonomy; §7 AI yardımı |
| Yetki/yayım kararı (PDP'ye referans) | §10 PDP; §11 PDP bağlama; §9 tenant izolasyonu |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu sözleşmenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| DOC-01 | `document_template` çekirdek şablon tenant-kapsamlı (sections/variables/montaj kuralları) | Backend/Data | P0 | Integration | Şablon tenant izolasyonlu tanımlanır/okunur | kernel-team |
| DOC-02 | `clause` clause library content-block (standart/alternatif/fallback/yasak; `I18nText`; sürüm) | Backend/Data | P0 | Integration | Madde kütüphanede sürümlü; şablon `ClauseRef` ile bağlar | kernel-team |
| DOC-03 | Alanlar atom katmanına oturur (`I18nText`/`EnumType`/`ClauseRef`/`AssetRef`/`EntityRef`) | Backend/Data | P0 | Contract | Her alan doğru atoma oturur | kernel-team |
| DOC-04 | `variable_binding` değişkeni kaynağa eşler (kayıt alanı/sabit/türetilmiş); ana-veri kopyalanmaz | Backend | P1 | Integration | Değişken kaynaktan çözülür, kopyalanmaz | kernel-team |
| DOC-05 | `assembly_rule` koşullu montaj (if koşul then include/exclude); serbest kod değil, sabit operatör | Backend | P0 | Integration | Koşullu madde deterministik seçilir | kernel-team |
| DOC-06 | Montaj determinizmi: aynı girdi → aynı çıktı/checksum | Backend | P0 | Integration | Yeniden-üretilebilir montaj | kernel-team |
| DOC-07 | `rendered_document` değişmez + sürümlü + checksum + snapshot | Backend/Data | P0 | Integration | Yayım sonrası mutasyon yok; güncelleme yeni sürüm | kernel-team |
| DOC-08 | Çok-formatlı render (DOCX/PDF/HTML) `RenderBackend`; doğrudan doküman kütüphanesi yasak | Backend | P1 | Integration+Contract | Aynı montaj çoklu formata; app'te python-docx/PDF yok | kernel-team |
| DOC-09 | Çok-dilli varyant (`I18nText`) + `default_locale` fallback | Backend/i18n | P1 | Integration | Dile göre madde/etiket; eksik dilde fallback | kernel-team |
| DOC-10 | Version diff (şablon/belge sürüm farkı) deterministik | Backend | P2 | Integration | İki sürüm madde-madde karşılaştırılır | kernel-team |
| DOC-11 | Yasak madde (`prohibited`) asla monte edilmez | Backend/Compliance | P0 | Contract | Yasak madde reddedilir, uyarı üretilir | governance |
| DOC-12 | Kompozisyon-storage: `rendered_document.asset` `AssetRef`→`k-storage`; gömme yok | Backend/Integration | P1 | Integration | Render binary `k-storage`'da, referansla | kernel-team |
| DOC-13 | Kompozisyon-imza: yayımlanmış belge `k-signature`'a `AssetRef` (değişmez sürüm) | Backend/Integration | P1 | Integration | İmzaya hazır belge; hangi sürüm imzalandı kesin | kernel-team |
| DOC-14 | Kompozisyon-agreement: `document` `archetype-agreement`'a grafik render'ı olarak sağlanır | Backend/Integration | P1 | Integration | Agreement `document` `AssetRef` alır | kernel-team |
| DOC-15 | Tenant-scoped RLS + cross-tenant şablon/madde/çıktı/referans reddi | Security | P0 | Integration(neg) | ≥10 cross-tenant negatif case reddedilir | security-team |
| DOC-16 | Şablon/madde/belge yayımı + montaj audit (append-only) | Security | P0 | Integration | Yayım/değişim/montaj audit'e düşer | security-team |
| DOC-17 | AI madde/değişken/koşul/varyant `draft`; yayım (şablon/madde/belge) `none` | AI-Governance | P0 | Integration | AI final dokümanı tek başına yayımlayamaz | governance |
| DOC-18 | Yetki/yayım kararı PDP'ye referans; kompozisyon yetki vermez | Backend/API | P1 | Integration | Yayım/erişim kararı PDP'den | kernel-team |
| DOC-19 | Yapılandırılmış editör (Word-benzeri ama kontrollü); serbest WYSIWYG yasak | Frontend | P1 | E2E | Düzenleme şablon/madde/değişken sınırında | ui-team |
| DOC-20 | Frontend clause library + değişken/bağlama + montaj önizleme config-driven | Frontend | P1 | E2E | UI runtime verisinden; hardcoded madde/şablon yok | ui-team |
| DOC-21 | WCAG 2.2 AA + i18n (durum/sınıf/format) + diff renk-dışı ayrım + Phosphor | Frontend/A11y | P2 | A11y(axe) | axe critical=0; öneri/sınıf rozeti erişilebilir | ui-team |
| DOC-22 | Async render (büyük katalog/çok-sayfa) worker'a offload | Backend/Perf | P2 | Integration | Ağır render istek yolunu bloklamaz | kernel-team |
| DOC-23 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | `alembic downgrade -1` veri kaybetmez | kernel-team |
| DOC-24 | Strawberry resolver `permission_classes` + PEP `Depends` zorunlu | Backend/API | P1 | Contract | Korumasız resolver/endpoint yok | kernel-team |
| DOC-25 | PIM baskı katalog (`print_catalog` #39): `document_kind=catalog`, PDF, çoklu layout/dil | Integration | P2 | Integration | PDF katalog montajdan üretilir/indirilebilir | kernel-team |
| DOC-26 | `archetype-document-composition` WBS düğümü doğru dependsOn (k-storage, k-policy-pdp, i18n) | Governance/WBS | P1 | CI(data-quality) | DAG geçerli, dangling yok | pmo |

---

*Kaynak yönerge: CLM Document Automation + PIM `print_catalog` (#39). Bu, CLM'in **doküman üretim archetype'ıdır**: bir veri kaydını (sözleşme grafiği, ürün kataloğu, teklif, mektup) şablon + değişken + koşullu madde (clause) montajıyla değişmez, sürümlü, çok-formatlı (DOCX/PDF/HTML) bir belgeye derler; clause library'yi content-block olarak yönetir ve `surface-v2`'nin non-goal bıraktığı doküman üretimini karşılar. Kardeş/tüketici sözleşmeler: `archetype-agreement-lifecycle-negotiation-directive.md` (ana tüketici; sözleşme grafiğinin belge render'ı — `document` `AssetRef`), `k-signature-trust-directive.md` (render çıktısını imzaya sokar; imzalanacak `AssetRef`), `k-storage-dam-directive.md` (render binary'sinin object storage kütüğü — `AssetRef`), `surface-v2-directive.md §3` (doküman/print non-goal'ünü bu yönerge kapatır), `i18n-standard.md` (çok-dilli varyant / `I18nText`), `pdp-policy-contract.md` (yetki/yayım kararı), `computation-derivation-contract.md` (türetilmiş değişken), `atomic-types-directive.md` (`I18nText`/`EnumType`/`ClauseRef`/`AssetRef`/`EntityRef` atomları), `atomik-netlestirme-2026-07-01.md` (atom/Fragment kademe modeli), `PIM-v2-Gereksinim-Analizi.md §Faz 11` (`print_catalog` #39), `core-contract-pack.md §3.0.1` (AI guardrail). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız sözleşme metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir; bu doküman güncellenir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez. Bir şablonu, bir maddeyi ve final dokümanı yayımlama yalnız insan kararıdır ve PDP izniyle çalışır; AI yalnız önerir (madde/değişken/koşul/varyant taslağı).*
