# ArcheType EAV Yönergesi — Dinamik Öznitelik Modeli (Entity-Attribute-Value)

**Sürüm:** 1.0 · **Tarih:** 2026-07-01
**Durum:** Taslak yönerge (kilitlenmeyi bekliyor). AI-DRAFT: bu doküman ajan taslağıdır; kilitleme insan onayına bağlıdır.
**Kapsam:** `attribute-set / EAV` FieldType'ının (`archetype-uretim-spec.md` §12.B) normatif yönergesi: ArcheType'ın **dinamik** özniteliklerinin şema migration'ı gerektirmeden, tipli ve locale-aware biçimde tutulması. PIM-v2 karşılığı: Özellik 5 (EAV öznitelik sistemi, Faz 1, P0).
**Kaynak/bağlam:** `archetype-uretim-spec.md` §12.B, `elestiri-01-archetype-2026-07-01.md` §3.5, `src/schemas/archetype.ts` (`FieldTypeSchema`), `core-contract-pack.md` §3.6 (`platform_fieldtypes.AttributeSet`), `docs/reference/PIM-v2-Gereksinim-Analizi.md` §4 + §NFR.
**Aktörler:** Öznitelik sahibi (insan — PIM/veri ekibi), AI öneri motoru (draft), Motor (platform runtime), CI (GitHub Actions), tüketici uygulama (PIM/Commerce).

---

## 1. Amaç

Akeneo-sınıfı bir PIM'de ürün ailesi yüzlerce özniteliği (renk, beden, malzeme, voltaj…) ve varyant eksenini taşır; bu küme **tenant'a ve aileye göre değişir** ve sürekli genişler. Her biri sabit `fields` dizisine kolon konursa yeni öznitelik bir şema migration'ı (`archetype-uretim-spec.md` §4 riski) doğurur — sürdürülemez. Bu yönerge, dinamik öznitelikleri **şemaya değil veriye** yazan ama string'e sıkıştırmak yerine **tipli** (string/number/bool/date/enum/measure) tutan EAV modelini sabitler: yeni öznitelik eklemek migration değil veri işlemidir; değer tip-güvenli, çok-dilli ve aranabilir kalır.

## 2. Kapsam

Bu yönerge kapsar: (a) `product_attribute_value` (kısaca PAV) veri modelinin alan yapısı, (b) tipli değer kolonları vs JSONB depolama kararı, (c) GIN indeksleme, (d) locale-aware çözümleme, (e) `measure`/`money` tipli değerin `k-fieldtypes`'a bağı, (f) family/variant öznitelik miras zinciriyle bağlama. Bir *yönerge* (mimari tarif) verir; implementasyon kodunu ajanlar `plan-01` promptuyla yazar.

## 3. Non-goals (kapsam dışı)

Bu yönerge şunları **yapmaz**: **(1)** Sabit-şema alanlarını EAV'a taşımaz — EAV **yalnız dinamik/isteğe-bağlı öznitelik** içindir; ArcheType kimliği, ilişkileri, çekirdek alanları normal `fields` (fiziksel kolon) kalır. **(2)** Öznitelik *tanımını* (attribute/attribute-group/attribute-type kataloğu) bu doküman tanımlamaz; PIM ArcheType kataloğunun işidir — burada yalnız **değer** (value) katmanı vardır. **(3)** Türetilmiş/hesaplanmış değer üretmez — o `k-computation`'ın işidir (EAV girdi olabilir, hesap değil). **(4)** Kimlik/kanonik-anahtar üretmez — enum değeri temizliği `c13n` (`05-c13n`) hattındadır. **(5)** Serbest kodla öznitelik mantığı çalıştırmaz; değer veridir, kural yapısaldır.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** EAV = Entity-Attribute-Value = "varlık-nitelik-değer". Niteliklerin ArcheType şemasına kolon olarak değil, **veri satırı** olarak yazıldığı esnek modeldir. `attribute-set` FieldType, bir ArcheType alanını "bu alan dinamik öznitelik kümesi taşır" diye işaretler.

**Ne yapar:** Runtime'da (şema migration'ı gerektirmeden) yeni öznitelik ekletir; her değeri **tipli** tutar (string/number/bool/date/enum/measure); aynı özniteliğin **locale'e göre** farklı değerini taşır (i18n-text köprüsü); ölçü/para değerini `k-fieldtypes`'ın `Measure`/`Money` tipiyle güvenli tutar; değeri ana tablodan **ayrı indeksleyerek** (GIN) arama/filtreyi ölçekte çalıştırır.

**Ne yapmaz:** Sabit-şema alanını EAV'a taşımaz (EAV yalnız dinamik). Değeri float ile tutmaz (para/ölçü tipli). Öznitelik tanımını yönetmez (yalnız değer). Değeri koda gömmez (`if attribute == "color"` yasak; sorgu). Migration'ı tetikleyecek kolon ekleme/silme yapmaz; genişleme veri işlemidir.

## 5. Sözleşme şekli (alan | tip | amaç)

Aşağıdaki tablo `product_attribute_value` (EAV değer satırı) modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek (mock) vermez. Tipler PostgreSQL / SQLAlchemy 2.0 karşılıklarıdır. Değer, **tipli kolon** deseniyle tutulur (aşağıdaki `value_*` kolonlarından yalnız biri dolu olur, `value_type` hangisi olduğunu söyler); yüksek-hacimli, kalıpsız öznitelik demetleri için alternatif JSONB deseni §6'da karşılaştırılır.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Değer satırı benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `entity_id` | UUID (FK → hedef ArcheType kaydı) | Özniteliğin ait olduğu varlık (product/variant); EAV'ın "Entity"si |
| `attribute_id` | UUID (FK → attribute kataloğu) | Hangi öznitelik; EAV'ın "Attribute"ı (tanım PIM kataloğunda) |
| `value_type` | Enum(string, number, bool, date, enum, measure) | Dolu olan tipli kolonu ve doğrulamayı belirler |
| `value_string` | Text (nullable) | `value_type=string/enum` değeri (enum kanonik makine-kodu) |
| `value_number` | Numeric (nullable) | `value_type=number` değeri (float değil; Numeric) |
| `value_bool` | Boolean (nullable) | `value_type=bool` değeri |
| `value_date` | TIMESTAMPTZ (nullable) | `value_type=date` değeri (timezone-aware) |
| `value_measure` | JSONB (nullable) | `value_type=measure`: `k-fieldtypes.Measure` (value+unit+canonical) — boyut-güvenli |
| `unit` | Text (nullable) | `measure` için UCUM birimi (dönüşüm `k-fieldtypes`'ta; string birim yasağı) |
| `locale` | Text (nullable) | Çevrilebilir öznitelik için `locale` (BCP-47); NULL = locale-bağımsız değer |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

Benzersizlik kısıtı `(tenant_id, entity_id, attribute_id, locale)` üzerinedir: bir varlık, bir öznitelik, bir locale için tek değer. `measure`/`money` gibi bileşik tipler `k-fieldtypes`'ın tip tanımına bağlanır; para değeri **asla** `value_number` ile tutulmaz — `Money` (value+currency+precision+rounding, `06-n6n` N6N-06) zorunludur.

## 6. Depolama kararı (ilişkili tablo vs JSONB)

Aşağıdaki tablo iki depolama desenini karşılaştırır; karar öznitelik profiline göre verilir, "kolay oldu diye" seçilmez (`06-n6n` §7 kontrollü-denormalizasyon ruhu). İkisi de aynı ArcheType'ta yan yana yaşayabilir.

| Desen | Ne zaman | Avantaj | Bedel |
|---|---|---|---|
| İlişkili tablo (tipli `value_*` kolonlu PAV, satır-başı-öznitelik) | Yüksek-kardinaliteli, filtrelenen, tip-doğrulaması kritik öznitelik (renk, beden, voltaj) | Tip güvenliği + satır-bazlı GIN/B-tree indeks + kesin filtre | Satır patlaması; okuma JOIN maliyeti |
| JSONB demet (bir alanda `{attr: value}` kümesi) | Seyrek sorgulanan, birlikte okunan, kalıpsız/serbest öznitelik demeti | Tek okuma, esnek şekil, GIN (`jsonb_path_ops`) ile içerik araması | Zayıf tip-doğrulaması; büyük demet güncellemesi ağır |

Kural: **filtrelenen ve tip-doğrulaması gereken öznitelik ilişkili tablo (tipli kolon)**; **birlikte okunan seyrek demet JSONB**. Karar ArcheType'ın `attribute-set` alan beyanında belgelenir; PIM-v2 NFR (100k+ ürün, p95<300ms, N+1 yasak) gereği filtre yolundaki öznitelik daima indeksli ilişkili tablo olur. Yüksek-hacimde okuma darboğazı ölçülürse read-model/projection (`06-n6n` §8, `scale-projections`) ile denormalize edilir — kaynak daima normalize PAV kalır.

## 7. Index (GIN)

EAV'ın arama/filtre performansı ana tablodan **bağımsız** indekse dayanır (`archetype-uretim-spec.md` §12.B "ayrı indekslenir"). İlişkili-tablo deseninde `(tenant_id, attribute_id, value_string)` ve `(tenant_id, attribute_id, value_number)` bileşik B-tree indeksleri kesin/aralık filtresini; JSONB öznitelik demeti için PostgreSQL **GIN** indeksi (`USING GIN (attributes jsonb_path_ops)`) içerik-içi aramayı (`@>`, `?`) karşılar. `k-search` bu indeksleri tam-metin/fasetli aramaya bağlar. GIN olmadan JSONB öznitelik sorgusu tam-tarama olur ve NFR p95 bütçesini deler — bu yönergede GIN, JSONB öznitelik yolunda zorunludur.

## 8. WBS / archetype yerleşimi

Bu yönerge `k-fieldtypes` primitifinin `attribute-set` tipini normatifleştirir; kendisi ayrı bir kernel `module` düğümü açmaz, mevcut `k-fieldtypes` altındaki `archetype` düğümünde kod olarak teslim edilir. Aşağıdaki tablo bağı ve bağımlılığı verir; `dependsOn` = teknik/yürütme sırası, `related` = yalnız gezinme (`wbs-field-semantics`).

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `k-fieldtypes` (attribute-set/EAV yönü) | module | `k-schema`, `k-tenancy` | kernel |

`dependsOn` gerekçesi: EAV değer katmanı şema temeline (`k-schema`) ve kiracı bağlamına (`k-tenancy`) teknik olarak bağlıdır; ikisi hazır olmadan PAV yazılamaz. `related` ile `k-search` (indeks), `k-computation` (measure girdi) ve PIM `product`/`variant` ArcheType'larına bağlanır (karar üretmez).

## 9. Backend

SQLAlchemy 2.0 (`Mapped[...]`) `product_attribute_value` modeli; her satır `tenant_id` ve `(tenant_id, entity_id, attribute_id, locale)` benzersiz kısıtı taşır. Filtre kolonları (§7) indekslenir; JSONB demet GIN alır. Alembic **expand-contract** migration; `downgrade()` dolu ve CI'da `alembic downgrade -1` ile test edilir (boş downgrade yasak). `measure`/`money` değeri `k-fieldtypes` tipleriyle **tanım anında** doğrulanır — hatalı boyut/kur karışımı `DimensionMismatchError`. Strawberry GraphQL resolver'ları `Depends(require_tenant)` + `RequirePermission(...)` ile korunur; bir varlığın öznitelikleri N+1'e düşmeden DataLoader ile tek batch'te çekilir. Hata formatı `{code, message, trace_id, details}`; `get_logger()` kullanılır, `print()` yasak. Öznitelik tanım/şema değişiklikleri audit'lenir; her değer yazımı hacim gereği toplu audit'lenir (`AuditLogger`).

## 10. Multi-tenant

Her PAV satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Cross-tenant sorgu girişimi `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. Öznitelik *tanım* kataloğu tenant'a göre genişleyebilir; bir tenant'ın öznitelik seti diğerine sızmaz. Platform-tanımlı sistem öznitelikleri (varsa) yalnız işletmecice tanımlanır; tenant onları genişletemez, yalnız kendi öznitelik demetini ekler.

## 11. AI guardrail

Dört-aktör iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** AI, ham/kaynak veriden öznitelik değeri veya *tipi* **taslağı** önerebilir (ör. "bu serbest-metin kolon aslında `measure` tipinde, birimi mm"); ancak öznitelik *tanımı* eklemek veya tip değiştirmek bir şema/kural işidir ve v1 §2.8 Migration Policy + insan `approval_ref`'inden geçer. AI aktif değeri prod'a doğrudan yazamaz (`autonomy: draft`); değer motorun tip kurallarıyla yazılır. AI yeni öznitelik *anahtarı* icat edemez (katalog PR'ı gerekir), main branch'e push edemez, app/module düğümü üretemez, ruleset override edemez.

## 12. Bağlama

- **Variant/family (`archetype-uretim-spec.md` §12.B/§12.C):** PAV, family → product → variant öznitelik **miras zinciriyle** çözülür; variant kendi eksenini (renk×beden) EAV değeri olarak taşır, ailede tanımlı ortak öznitelikleri miras alır (PIM-v2 Faz 1 "öznitelik miras zinciri").
- **i18n (`01-i18n` I18N-04):** Çevrilebilir öznitelik `locale`-aware çözülür (`locale` kolonu); enum değeri kanonik makine-kodu (`c13n`), gösterim etiketi alias/`i18n-text`. Locale çözüm sırası i18n standardındaki zincire uyar.
- **c13n (`05-c13n`) / n6n (`06-n6n`):** Değer depolama öncesi normalize edilir (trim + NFC + case-fold), enum kanonikleşir; para tam-sayı/`Money` (N6N-06), birim tipli (string birim yasağı).
- **search (`k-search`):** GIN + faset indeksi EAV değerini fasetli/tam-metin aramaya bağlar; filtre yolundaki öznitelik indekslidir.

## 13. Test stratejisi

Test-önce zorunludur (önce kırmızı, sonra yeşil). Aşağıdaki tablo test senaryosunu türüyle eşler.

| # | Senaryo | Tür |
|---|---|---|
| 1 | Tipli değer doğrulama: `value_type`'a uymayan değer (ör. number kolona metin) reddediliyor | Unit |
| 2 | Runtime öznitelik ekleme: yeni öznitelik değeri şema migration'ı olmadan yazılıyor | Integration |
| 3 | Locale: aynı öznitelik iki locale'de farklı değer taşıyor; çözüm sırası doğru | Integration |
| 4 | `measure`/`money`: boyut/kur uyumsuzluğu tanım anında reddediliyor (float para yasağı) | Unit |
| 5 | Benzersizlik: `(tenant,entity,attribute,locale)` tekil; çift kayıt reddediliyor | Integration |
| 6 | Performans: 100k+ ürün × yüzlerce öznitelikte filtreli liste p95 < 300ms (GIN/indeks) | Performans |
| 7 | Cross-tenant izolasyon: A tenant B'nin öznitelik değerini göremiyor (≥10 negatif case) | Integration (negatif) |
| 8 | Miras: family/product/variant öznitelik çözümü doğru katmandan geliyor | Integration |
| 9 | Migration downgrade: `alembic downgrade -1` veri kaybetmeden çalışıyor | CI |

## 14. Acceptance criteria

- AC-1: Yeni dinamik öznitelik, şema migration'ı olmadan (runtime) eklenip tipli değerle yazılabiliyor.
- AC-2: Her değer `value_type`'ına göre doğrulanıyor; tip-dışı değer reddediliyor (para/ölçü float ile tutulmuyor).
- AC-3: Çevrilebilir öznitelik locale-aware çözülüyor; locale çözüm sırası i18n standardına uyuyor.
- AC-4: Filtreli öznitelik araması GIN/indeks üzerinden NFR p95 bütçesini karşılıyor (N+1 yok).
- AC-5: `(tenant,entity,attribute,locale)` benzersiz; cross-tenant erişim ≥10 negatif case ile reddediliyor.
- AC-6: family→product→variant miras zinciri doğru çözülüyor.
- AC-7: AI değeri/tipi yalnız `draft` öneriyor; `approval_ref` olmadan tanım/tip değişimi reddediliyor.

## 15. Anti-patterns (yasak desenler)

- **EAV her yerde:** Sabit-şema çekirdek alanı (kimlik, ilişki, zorunlu alan) EAV'a taşımak; sorguyu/tip-güvenliğini yok eder — EAV yalnız dinamik öznitelik içindir.
- **Tipsiz değer:** Her değeri tek `value_string`'e sıkıştırmak; sayı/tarih/ölçü karşılaştırması bozulur (`value_type` + tipli kolon zorunlu).
- **Float ile para:** Öznitelik parasını `value_number` ile tutmak; `k-fieldtypes.Money` zorunlu (`06-n6n` N6N-06).
- **String birim:** `measure` birimini serbest string tutmak (kg vs lb toplanır); UCUM + `k-fieldtypes.Measure` dönüşümü zorunlu.
- **İndekssiz JSONB filtre:** GIN olmadan JSONB öznitelik sorgusu; tam-tarama, p95 deler.
- **Locale gömme:** Çevrilebilir değeri tek-dil kolonda tutmak; `locale` kolonu + i18n-text zorunlu (`01-i18n` I18N-04).
- **Öznitelik anahtarını koda gömme:** `if attribute == "color"`; öznitelik veridir, sorgudur.
- **AI'ın doğrudan tanım/tip değişimi:** `approval_ref`'siz öznitelik tanımı/tip değişimi; `ApprovalRequiredError`.

## 16. DoD (Definition of Done)

- §13'teki 9 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil belgeli).
- Tipli değer doğrulama, locale çözümü ve performans (GIN, p95<300ms) invariant'ları kanıtlandı.
- Alembic migration downgrade CI'da çalışıyor (`alembic downgrade -1`).
- `core-contract-pack` tenant + audit + indeks uyumu sağlandı; `check-core-contract` yeşil.
- PIM `product`/`variant` ArcheType'ı bu EAV modelini tüketiyor (Özellik 5 kanıtı); family miras zinciri çözülüyor.
- AI-guardrail testi: `draft`-dışı doğrudan tanım/tip değişimi reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok).

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu yönergenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme. PIM-v2 karşılığı: Özellik 5 (EAV, Faz 1, P0).

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| EAV-01 | `product_attribute_value` şeması (entity/attribute/value_type + tipli kolonlar) | Backend/Data | P0 | Unit | AC-1 | kernel-team |
| EAV-02 | Tipli değer doğrulama (`value_type`'a uygunluk; tip-dışı reddi) | Backend | P0 | Unit | AC-2 | kernel-team |
| EAV-03 | Runtime öznitelik ekleme (şema migration'ı gerektirmez) | Backend/Data | P0 | Integration | AC-1 | kernel-team |
| EAV-04 | `measure`/`money` tip güvenliği (float para yasağı, boyut uyumu) | Backend | P0 | Unit | AC-2 | kernel-team |
| EAV-05 | Locale-aware değer + çözüm sırası (i18n köprüsü) | Backend/Data | P1 | Integration | AC-3 | data-team |
| EAV-06 | Depolama kararı: ilişkili tablo vs JSONB profile göre | Backend/Data | P1 | Integration | AC-4 | kernel-team |
| EAV-07 | GIN + bileşik indeks; filtreli arama NFR p95<300ms, N+1 yok | Backend/DB | P0 | Performans | AC-4 | data-team |
| EAV-08 | `(tenant,entity,attribute,locale)` benzersiz kısıt | DB | P1 | Integration | AC-5 | kernel-team |
| EAV-09 | Tenant izolasyonu + RLS ikinci bariyer (≥10 negatif case) | Security | P0 | Integration(neg) | AC-5 | security-team |
| EAV-10 | family→product→variant öznitelik miras çözümü | Backend | P1 | Integration | AC-6 | data-team |
| EAV-11 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | AC-1 | kernel-team |
| EAV-12 | AI değer/tip önerisi `draft` + `approval_ref` zorunlu | AI-Governance | P0 | Integration | AC-7 | governance |
| EAV-13 | Enum kanonik + c13n/n6n değer normalizasyonu | Backend/Data | P2 | Unit | AC-2 | data-team |

---

*Kaynak yönerge: `archetype-uretim-spec.md` §12.B. Kardeş sözleşmeler: `computation-derivation-contract.md`, `actor-party-contract.md`, `capability-entitlement-contract.md`. Bağlı standartlar: `docs/standards/01-i18n-l10n-g11n-standard.md`, `docs/standards/05-c13n-canonicalization-standard.md`, `docs/standards/06-data-normalization-standard.md`. PIM-v2 karşılığı: Özellik 5 (EAV öznitelik sistemi, Faz 1, P0). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız yönerge metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
