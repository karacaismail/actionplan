# ArcheType Ledger Yönergesi — Çift-Taraflı Muhasebe Metamodeli

**Sürüm:** 1.0 · **Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor) — insan onayı ile kilitlenecek. 2026-07-02.
**Gerekçe:** Kernel/archetype katmanında çift-taraflı defter (double-entry bookkeeping — her hareketi borç ve alacak olarak iki tarafa aynı anda yazan muhasebe yöntemi) metamodeli **yoktur** (grep sonucu: 0 eşleşme). Accounting (Parasut-benzeri ürün), MRP costing (`archetype-uretim-spec.md` §12.D — "costing değişimi yalnız yeni dönem açar" ifadesi zaten dönem-kapatma modelini varsayar) ve HRMS payroll (bordro) hepsi yapısal olarak bir defter ister; her ürün kendi implementasyonunu icat ederse kernel'in "50 app × ortak sözleşme, 50× tekrar-icat değil" felsefesi ihlal olur (bkz. `gap-2026-07-02-02-archetype.md` §4 G-A2, P0). Ön şart: gerçek `Money` atomu (değer+kur+precision+rounding dörtlüsü) — düz `currency` string'i veya `float` para **kabul edilmez** (`atomic-types-directive.md` §5.4, §14 "Float ile para" anti-pattern'i).
**Kapsam:** Hesap planı (chart of accounts), yevmiye fişi (journal entry), borç/alacak satırı (journal line), muhasebe dönemi (accounting period), dönem-kapatma (period close), ters kayıt (reversal), çok-para-birimi/kur (multi-currency / FX) yönü.
**Aktörler:** Muhasebeci/mali işler sorumlusu (insan — hesap planını tanımlar, fişi onaylar, dönemi kapatır), AI öneri motoru (fiş taslağı önerir, `autonomy: draft`), Motor (platform runtime — denge/dönem-kilidi/append-only kurallarını deterministik uygular), CI (GitHub Actions — conformance kapıları), tüketici uygulama (Accounting, MRP costing, HRMS payroll, CLM ödeme takibi).

---

## 1. Amaç

Para hareketi yazan her enterprise ürün (muhasebe, üretim maliyeti, bordro, sözleşme ödeme takibi) aynı temel doğruluğa muhtaçtır: **her hareketin iki tarafı vardır ve toplamları eşittir.** Bu, 1494'ten beri (Luca Pacioli) değişmeyen bir muhasebe aksiyomudur — borç (debit) toplamı, alacak (credit) toplamına eşit olmadan bir fiş "doğru" sayılmaz. Bugün bu metamodel platformda **hiç yoktur**; her ürün kendi para-hareketi tablosunu yeniden icat ederse (a) denge hatası tespiti üründen ürüne değişir, (b) dönem-kapatma sonrası geriye yazma engeli garanti edilmez, (c) düzeltme "sil-yeniden yaz" ile yapılır ve denetim izi (audit trail) kaybolur. Bu yönerge, çift-taraflı defteri **tek kanonik metamodel** olarak sabitler: borç=alacak, kapalı döneme yazma yok, kayıtlı fişte UPDATE/DELETE yok (yalnız ters kayıt/reversal) üç değişmezini (invariant) veri şeması + motor kuralı + CI kapısı üçlüsüyle zorlar. Aktör-açık ifade: *insan* hesap planını tanımlar ve fişi onaylar; *AI* yalnız fiş **taslağı** önerir; *motor* denge/dönem/append-only kurallarını deterministik uygular; hiçbir aktör kayıtlı bir fişi geriye dönük değiştiremez.

## 2. Kapsam

Bu yönerge kapsar: (a) `account` (hesap planı kaydı — kod, tip, hiyerarşi), (b) `journal_entry` (yevmiye fişi — başlık, tarih, dönem referansı), (c) `journal_line` (borç/alacak satırı — hesap referansı, `Money` tipli borç/alacak tutarı), (d) `accounting_period` (muhasebe dönemi — açık/kapanıyor/kapalı durumu), (e) dönem-kapatma prosedürü, (f) ters kayıt (reversal) mekanizması, (g) çok-para-birimi/FX (foreign exchange — kur çevrimi) yönü. Bir *yönergedir* (mimari tarif) — implementasyon kodunu ajanlar ayrı bir `plan` promptuyla yazar; bu doküman şema/tablo iskeleti verir, çalışan kod değil.

### Non-goals (kapsam dışı)

- **Vergi hesabı yapmaz.** KDV/stopaj/ÖTV tutarının nasıl hesaplanacağı (oran, muafiyet, yargı-bölgesi kuralı) `k-computation`'ın (Computation/Derivation — türetilmiş alan üreten saf ifade grafiği) işidir; bu yönerge yalnız hesaplanmış tutarın **satıra nasıl yazılacağını** tanımlar, tutarı üretmez.
- **E-fatura/e-arşiv entegrasyonu yapmaz.** GİB (Gelir İdaresi Başkanlığı) e-fatura/e-arşiv gönderimi bir provider/app entegrasyon işidir (`k-provider-adapter` deseni); ledger yalnız muhasebe kaydını tutar, dış idareye iletimi üstlenmez.
- **Finansal rapor UI'si üretmez.** Bilanço/gelir tablosu/mizan ekranı Surface'in (kullanıcı arayüzü sözleşmesi) işidir; bu yönerge yalnız raporun **okuyacağı** kaynak veriyi (journal_line toplamları) tanımlar, ekranı çizmez.
- **Ödeme tahsilatı yapmaz.** Kredi kartı/banka tahsilatı `k-provider-adapter` + `scale-invariant-directive.md` (`financial` etiketi) işidir; ledger, tahsilat **sonucunu** bir yevmiye fişi olarak kaydeder, tahsilatı kendisi yürütmez.
- **BOM/routing/reçete üretmez.** MRP maliyet hesaplaması (BOM-graph patlaması) `archetype-uretim-spec.md` §12.D'nin işidir; ledger yalnız costing-policy'nin ürettiği tutarı dönem-kapsamlı bir fişe yazar.
- **Serbest kod çalıştırmaz.** Denge/dönem-kilidi kuralı yapısal veri kısıtıdır (DB constraint + motor kuralı); "if account == 'cash'" tarzı gömülü mantık yasaktır.

## 3. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Ledger (defter) = bir tenant'ın tüm para hareketlerini **çift-taraflı** (double-entry) ve **değişmez** (immutable, append-only — yalnız ekleme, geriye dönük değiştirme yok) biçimde tutan metamodeldir. Yevmiye fişi (journal entry) = tek bir ekonomik olayı temsil eden, en az iki satırdan (journal line) oluşan kayıt demeti. Hesap planı (chart of accounts) = hesapların (varlık/borç/özkaynak/gelir/gider) hiyerarşik listesidir; her satır bir hesaba borç veya alacak yazar.

**Ne yapar:**
- Her fişte **borç toplamı = alacak toplamı** değişmezini tanım-anında (fiş kaydedilmeden önce) zorlar; dengesiz fiş reddedilir.
- **Kapalı döneme yazma** girişimini reddeder; bir dönem kapandıktan sonra o döneme ait yeni fiş veya değişiklik `PeriodClosedError` fırlatır.
- Kayıtlı bir fişin **UPDATE/DELETE**'ini veritabanı seviyesinde engeller (`REVOKE UPDATE, DELETE`); düzeltme yalnız **ters kayıt** (reversal — orijinal fişin borç/alacak taraflarını ters çevirerek net etkiyi sıfırlayan yeni fiş) ile yapılır.
- Çok-para-birimli işlemleri `Money` atomunun kur alanıyla taşır; raporlama para birimine çevrim ayrı bir FX-rate kaydıyla izlenebilir tutulur.
- Dönem yaşam döngüsünü (`open` → `closing` → `closed`) typed action ile yönetir; generated CRUD dönem durumunu doğrudan yazamaz.

**Ne yapmaz:**
- Vergi/indirim/BOM maliyet tutarını **hesaplamaz** (girdi olarak alır, üretmez — o Computation'ın işi).
- Kayıtlı fişi **düzeltmez/silmez**; yalnız ters kayıt ekler (append-only ruhu).
- Hesap planı **tasarımını** dayatmaz (sektöre göre hesap planı tenant/işletmeci tanımlar); yalnız hesap planının **yapısını** (kod, tip, hiyerarşi) sözleşmeye bağlar.
- Ödeme tahsilatını **tetiklemez/yürütmez**; yalnız sonucu fiş olarak kaydeder.
- Raporlama ekranı **üretmez**; yalnız raporun okuyacağı kaynağı (journal_line) tanımlar.

## 4. Sözleşme şekli (alan | tip | amaç)

Backend yığını: **PostgreSQL + SQLAlchemy 2.0 / SQLModel + Alembic + FastAPI.** Aşağıdaki tablolar veri modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek (mock) vermez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. **Ortak alanlar (her tabloda, tekrar yazılmaz):** `id` (UUID PK), `tenant_id` (UUID, indexed NOT NULL — RLS izolasyonu, v1 §2.1 fail-closed zorunluluğu), `created_at` (TIMESTAMPTZ NOT NULL — audit; `updated_at` bilinçli olarak **yoktur**, çünkü kayıtlı satır güncellenmez).

### 4.1 `account` — Hesap planı kaydı

Bir hesap planı satırını (varlık/borç/özkaynak/gelir/gider hiyerarşisinde tek düğüm) tanımlar; ağaç yapısı `parent_id` ile kurulur.

| Alan | Tip | Amaç |
|---|---|---|
| `code` | string (unique/tenant) | Makine-okur hesap kodu (ör. muhasebe hesap kod planı numarası) |
| `name` | I18nText | Çok-dilli hesap adı (`atomic-types-directive.md` §5.2 `I18nText`) |
| `account_type` | enum(asset, liability, equity, income, expense) | Hesap sınıfı; borç/alacak normal-bakiye yönünü belirler |
| `parent_id` | UUID \| null (FK → self) | Üst hesap; hiyerarşik hesap planı ağacı |
| `currency` | string (ISO-4217) \| null | Hesabın işlevsel para birimi; null = çok-para-birimli hesap |
| `is_postable` | bool | Doğrudan fiş satırı alabilir mi (yaprak hesap) mı yoksa yalnız gruplama düğümü mü |
| `status` | enum(active, archived) | Yaşam döngüsü; silme yerine arşivleme (append-only ruhu) |

### 4.2 `journal_entry` — Yevmiye fişi (başlık)

Tek bir ekonomik olayı temsil eden fiş başlığını tanımlar; satırları (`journal_line`) toplu olarak gruplar. **Append-only**: kaydedildikten sonra hiçbir alanı değiştirilemez.

| Alan | Tip | Amaç |
|---|---|---|
| `entry_number` | string (unique/tenant, sequence-backed) | İnsan-okur fiş numarası; boşluksuz artan sıra |
| `period_id` | UUID (FK → accounting_period) | Fişin ait olduğu muhasebe dönemi; kapalı dönem yazımını engelleyen çapa |
| `entry_date` | date | Ekonomik olayın gerçekleştiği tarih (dönem içinde olmalı) |
| `description` | I18nText | Fişin çok-dilli açıklaması |
| `source_ref` | JSONB \| null | Kaynak belge referansı (fatura/ödeme/bordro id'si — hangi olay bu fişi doğurdu) |
| `reversal_of_id` | UUID \| null (FK → self) | Bu fiş bir ters-kayıtsa, ters çevirdiği orijinal fişin id'si |
| `posted_by` | UUID (FK → user) | Fişi kaydeden insan aktör; AI doğrudan `posted_by` olamaz |
| `posted_at` | TIMESTAMPTZ | Kayıt (posting) zamanı; audit için |

### 4.3 `journal_line` — Borç/alacak satırı

Bir fişin tek bir hesaba yazılan borç veya alacak satırını tanımlar; her fiş en az iki satır taşır. **`debit` ve `credit`'ten yalnız biri sıfırdan farklı olabilir** — aynı satırda ikisi birden dolu olamaz.

| Alan | Tip | Amaç |
|---|---|---|
| `entry_id` | UUID (FK → journal_entry) | Ait olduğu fiş |
| `account_id` | UUID (FK → account, `is_postable=true`) | Yazılan hesap; yalnız yaprak hesaplar postalanabilir |
| `debit` | Money (`atomic-types-directive.md` §5.2, precision+rounding+currency) | Borç tutarı; boşsa 0, ama empty≠zero ayrımı Money atomunda korunur |
| `credit` | Money | Alacak tutarı; `debit` ile `credit` karşılıklı dışlayıcıdır (biri > 0 ise diğeri = 0) |
| `fx_rate` | decimal(18,8) \| null | İşlem kurunun raporlama para birimine çevrim oranı (çok-para-birimi durumunda) |
| `memo` | I18nText \| null | Satıra özel çok-dilli not |
| `line_order` | integer | Fiş içi satır sırası (görüntüleme; iş mantığı üretmez) |

### 4.4 `accounting_period` — Muhasebe dönemi

Bir muhasebe döneminin (ay/çeyrek/yıl) yaşam döngüsünü tutar; `journal_entry.period_id` bu tabloya bağlanarak "kapalı döneme yazma yok" değişmezinin çapasını oluşturur.

| Alan | Tip | Amaç |
|---|---|---|
| `label` | I18nText | Dönemin çok-dilli görünen adı (ör. dönem etiketi) |
| `start_date` / `end_date` | date / date | Dönemin kapsadığı tarih aralığı (`Range<date>` atomu, `atomic-types-directive.md` §16) |
| `status` | enum(open, closing, closed) | Yaşam döngüsü; `journal_entry` yalnız `open` durumundaki döneme yazılabilir |
| `closed_by` | UUID \| null (FK → user) | Dönemi kapatan insan aktör; AI dönem kapatamaz (bölüm 6) |
| `closed_at` | TIMESTAMPTZ \| null | Kapatma zamanı |
| `closing_balance_snapshot_ref` | UUID \| null | Kapatma anındaki bakiye özetinin (snapshot) referansı; sonraki dönemin açılış bakiyesi buradan türer |

Değişmezler (invariant) özet: **(1)** her `journal_entry` için `SUM(journal_line.debit) = SUM(journal_line.credit)` (aynı para biriminde); **(2)** `journal_entry.period_id`'nin işaret ettiği `accounting_period.status` mutlaka `open` olmalı; **(3)** kayıtlı `journal_entry`/`journal_line` satırı üzerinde `UPDATE`/`DELETE` veritabanı seviyesinde reddedilir — düzeltme yalnız `reversal_of_id` dolu yeni bir `journal_entry` ile yapılır.

## 5. WBS / bağımlılık

Aşağıdaki tablo `archetype-ledger` düğümünün WBS (İş Kırılım Yapısı — hiyerarşik görev ağacı) yerleşimini ve bağımlılığını verir. `dependsOn` = teknik/yürütme sırası (kritik yol, `wbs-field-semantics.md`); `blocks` = bu düğüm bitmeden başlayamayan işler (dependsOn'un tersi); `related` = yalnız gezinme, karar üretmez.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `archetype-ledger` | archetype | `Money` atomu (`atomic-types-directive.md` AT-03), `k-computation` (FX/bakiye türetimi), `scale-invariant` (`financial` etiketi) | archetype |

`dependsOn` gerekçesi: **(1) Money atomu** — `journal_line.debit`/`credit` `Money` tipindedir; `Money⟨currency,precision,rounding⟩` kilitlenmeden (float-para yasağı, kur-karışımı reddi) ledger güvenle kurulamaz — bu yönergenin ön şartıdır (bölüm 1). **(2) k-computation** — bakiye (hesap toplamı) ve FX çevrimi türetilmiş değerlerdir; ledger ham satırı tutar, toplamı/çevrimi Computation türetir. **(3) scale-invariant** — para yazan her akış `financial` etiketi taşımak zorundadır (`scale-invariant-directive.md` §2); yevmiye fişi kaydı transactional outbox + idempotency + tamper-evident audit zarfı olmadan yazılamaz; ledger bu zarfı **tüketir**, kendisi yeniden icat etmez.

`blocks` (bu düğüm bitmeden başlayamayan işler): Accounting app (P0 — muhasebe modülünün temeli), MRP costing (P0 — `archetype-uretim-spec.md` §12.D "costing değişimi yalnız yeni dönem açar" ledger'ın dönem modelini varsayar), HRMS payroll (P0 — bordro net ödeme fişi bu metamodele yazar).

`related` (yalnız gezinme): `archetype-order-line-item-directive.md` (sipariş onayı sonrası muhasebe fişi oluşturabilir, ama order ledger'a `dependsOn` vermez — ayrı aggregate), CLM ödeme takibi (sözleşme bedeli tahsilatı bir fişe yazılabilir).

## 6. Multi-tenant + AI guardrail

**Multi-tenant:** Her `account`/`journal_entry`/`journal_line`/`accounting_period` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Cross-tenant erişim girişimi `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. RLS **zorunludur** — uygulama katmanı filtresi tek başına yeterli sayılmaz (çift bariyer).

**AI guardrail:** Dört-aktör iş bölümü (`core-contract-pack.md` §3.0.1) değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.**

| İşlem | Autonomy | Kural |
|---|---|---|
| Fiş taslağı önerme | `draft` | AI kaynak belgeden (fatura/ödeme/bordro) bir `journal_entry` taslağı üretebilir; `posted_at` boş kalır, kaydedilmemiş sayılır |
| Fişi kaydetme (posting) | onay-zorunlu | Kayıt (posting) yalnız **typed action** (`post_journal_entry`) ile ve insan `approval_ref`'i ile olur; generated CRUD ile doğrudan satır yazılamaz |
| Dönem kapatma | `none` | AI dönem kilidini **açamaz/kapatamaz**; `accounting_period.status` geçişi yalnız insan `closed_by` ile typed action üzerinden |
| Ters kayıt (reversal) önerme | `draft` | AI hatalı fişi tespit edip ters-kayıt taslağı önerebilir; kaydı insan onaylar |
| Hesap planı değişikliği | onay-zorunlu | Yeni hesap ekleme/hiyerarşi değişikliği şema-benzeri bir karardır; insan onayı gerekir |

Mutlak sınırlar: AI kayıtlı bir `journal_entry`/`journal_line`'ı **UPDATE/DELETE edemez** (veritabanı zaten `REVOKE` ile engeller — AI için ayrıcalıklı yol yoktur); AI main branch'e push edemez; app/module düğümü üretemez; ruleset override edemez; kapalı döneme yazma denemesi (AI dahil hiçbir aktör) `PeriodClosedError` ile reddedilir ve audit'lenir.

## 7. Test stratejisi (test-önce, negatif testler dahil)

Test-önce zorunludur (önce kırmızı, sonra yeşil). Aşağıdaki tablo test senaryosunu türüyle eşler; negatif testler (reddedilmesi gereken durumlar) özellikle vurgulanır çünkü ledger'ın değeri "neyi engellediği"dir.

| # | Senaryo | Beklenen | Tür |
|---|---|---|---|
| 1 | Dengesiz fiş: `SUM(debit) != SUM(credit)` olan fiş kaydedilmeye çalışılıyor | Reddedilir (tanım-anında, DB constraint + motor kuralı) | Unit (negatif) |
| 2 | Kapalı döneme yazma: `accounting_period.status=closed` iken o döneme yeni fiş ekleniyor | `PeriodClosedError` | Integration (negatif) |
| 3 | Kayıtlı fişte UPDATE: mevcut bir `journal_entry`/`journal_line` alanı değiştirilmeye çalışılıyor | Veritabanı seviyesinde reddedilir (`REVOKE UPDATE`) | Unit (negatif) |
| 4 | Kayıtlı fişte DELETE: mevcut bir fiş silinmeye çalışılıyor | Veritabanı seviyesinde reddedilir (`REVOKE DELETE`) | Unit (negatif) |
| 5 | Ters kayıt: hatalı bir fişe `reversal_of_id` ile ters kayıt eklenip net etkinin sıfırlandığı doğrulanıyor | Orijinal fiş korunur; ters kayıt bakiyeyi netler | Integration |
| 6 | Çok-para-birimi: farklı kurdaki iki `Money` aynı satıra toplanmaya çalışılıyor | `CurrencyMismatchError` (Money atomunun kendi kuralı) | Unit (negatif) |
| 7 | Dönem geçişi: `open` → `closing` → `closed` sırası dışında bir geçiş deneniyor (ör. doğrudan `open`→`closed`) | Typed action guard reddeder | Unit (negatif) |
| 8 | AI doğrudan posting: `approval_ref` olmadan AI'ın `post_journal_entry` çağırması | `ApprovalRequiredError` | Integration (negatif) |
| 9 | AI dönem kilidi: AI'ın `accounting_period.status`'u değiştirmeye çalışması | Reddedilir; yalnız insan `closed_by` ile | Integration (negatif) |
| 10 | Çapraz-tenant erişim: A tenant'ın B tenant'ın hesap planını/fişini görmesi/yazması (≥10 negatif case) | `TenantViolationError` + audit | Integration (negatif) |
| 11 | Fiş numarası tekilliği: aynı tenant içinde `entry_number` çakışması | Reddedilir (unique constraint) | Unit (negatif) |
| 12 | Yaprak-olmayan hesaba postalama: `is_postable=false` hesaba doğrudan satır yazılması | Reddedilir | Unit (negatif) |

## 8. Kabul kriterleri + Anti-patterns + DoD

### Acceptance criteria

- AC-1: Her `journal_entry` kaydında borç toplamı = alacak toplamı; dengesiz fiş tanım-anında reddediliyor.
- AC-2: Kapalı döneme (`accounting_period.status=closed`) yeni fiş yazımı `PeriodClosedError` ile reddediliyor.
- AC-3: Kayıtlı `journal_entry`/`journal_line` üzerinde UPDATE/DELETE veritabanı seviyesinde imkansız; düzeltme yalnız ters kayıtla yapılıyor.
- AC-4: Çok-para-birimi fişlerde kur-karışımı `CurrencyMismatchError` ile reddediliyor; `Money` atomu float içermiyor.
- AC-5: Dönem yaşam döngüsü (`open`→`closing`→`closed`) yalnız insan onaylı typed action ile ilerliyor; AI dönem kilidini açamıyor.
- AC-6: Fiş kaydı (posting) yalnız insan `approval_ref`'i ile typed action üzerinden oluyor; AI doğrudan posting yapamıyor.
- AC-7: Cross-tenant erişim ≥10 negatif case ile reddediliyor; RLS ikinci bariyer olarak doğrulanıyor.
- AC-8: `financial` etiketi taşıyan her yazma `scale-invariant-directive.md`'nin outbox+idempotency+audit zarfını taşıyor.

### Anti-patterns (yasak desenler)

- **Tek-taraflı yazma:** Yalnız borç veya yalnız alacak satırı olan bir fiş kaydetmek; çift-taraflılık ihlali, yasak.
- **Float ile Money:** `debit`/`credit`'i `float` veya düz `number` ile tutmak; `Money⟨currency,precision,rounding⟩` zorunlu (`atomic-types-directive.md` §14).
- **Sil-yeniden-yaz düzeltme:** Hatalı fişi silip doğrusunu yeniden eklemek; append-only ihlali — yalnız ters kayıt.
- **Sessiz dönem-kilidi bypass'ı:** Kapalı döneme "acil düzeltme" bahanesiyle backdoor yazma; `PeriodClosedError` istisnasız.
- **AI'ın doğrudan posting'i:** `approval_ref`'siz AI fiş kaydı; `ApprovalRequiredError`.
- **Kur-karışımı toplama:** Farklı para birimindeki `Money` değerlerini doğrudan toplamak; `CurrencyMismatchError` zorunlu.
- **Yaprak-olmayan hesaba postalama:** Gruplama düğümü hesabına (`is_postable=false`) doğrudan satır yazmak; yalnız yaprak hesap postalanabilir.
- **Ham `INSERT` ile audit atlama:** `scale-invariant`'ın outbox/audit zarfını atlayıp doğrudan tabloya yazmak; `financial` etiketli her yazma zarflı olmalı.

### DoD (Definition of Done)

- §7'deki 12 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil belgeli); özellikle 10 negatif senaryo (dengesiz fiş, kapalı dönem, UPDATE/DELETE reddi, kur-karışımı, dönem-geçiş sırası, AI posting/dönem-kilidi, cross-tenant, tekillik, yaprak-olmayan hesap) kanıtlanmış.
- `account`/`journal_entry`/`journal_line`/`accounting_period` şeması SQLAlchemy 2.0 + Alembic ile tanımlı; `journal_entry`/`journal_line` tablolarında `REVOKE UPDATE, DELETE` uygulanmış.
- `Money` atomu (`atomic-types-directive.md` AT-03) kilitlenmiş ve `journal_line.debit`/`credit` bu atomu kullanıyor.
- RLS politikası her dört tabloda aktif; cross-tenant testler yeşil.
- `scale-invariant-directive.md`'nin `financial` etiketi ve `scaled_write` zarfı `post_journal_entry`/`close_period` typed action'larında uygulanmış; `check-scale-invariant` yeşil.
- AI-guardrail testi: AI'ın doğrudan posting'i ve dönem-kilidi açması reddediliyor; yalnız `draft` taslak önerisi kabul ediliyor.
- Accounting app, MRP costing, HRMS payroll bu metamodeli tüketiyor (`blocks` ilişkisi kanıtlı — bölüm 5).
- Doküman `icerik-kalite-sozlesmesi.md` biçim kurallarına uyuyor (emoji yok, aktör açık, her bölümde nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok).
- İnsan onayı ile "Kilitli" statüsüne geçiyor (bugünkü statü: taslak).

## 9. Not — scale-invariant ilişkisi

`scale-invariant-directive.md`'deki `financial` etiketi (§2) ile bu yönergenin ilişkisi **kapsayan-kapsanan** değil, **zarf-içerik**tir: scale-invariant, para yazan **her** akışın (yalnız ledger değil — ödeme, iade, mutabakat da dahil) etrafına outbox+idempotency+tamper-evident-audit zarfını sarar; ledger bu zarfın **içindeki** veri modelini (hesap planı, fiş, satır, dönem) tanımlar. Bir `post_journal_entry` typed action'ı hem bu yönergenin denge/dönem/append-only kurallarına **hem de** scale-invariant'ın `financial` etiketli `scaled_write` zarfına aynı anda tabidir — biri veri şeklini, diğeri yazma güvenliğini garanti eder. Aksiyom: **ledger'sız scale-invariant** "ne yazıldığını" bilmeden "nasıl yazıldığını" güvenli kılar (eksik); **scale-invariant'sız ledger** doğru şemayı tanımlar ama çift-tahsilat/kayıp-olay riskine açık kalır (eksik). İkisi birlikte tam korumayı oluşturur.

---

*Kaynak yönergeler: `gap-2026-07-02-02-archetype.md` §4 G-A2 (P0 boşluk tespiti), `atomic-types-directive.md` (Money atomu ön şartı), `archetype-uretim-spec.md` §12.D (MRP costing dönem-kapatma invariant'ı), `scale-invariant-directive.md` (`financial` etiketi, outbox/idempotency/audit zarfı). Kardeş sözleşmeler: `archetype-order-line-item-directive.md` (sipariş onayı sonrası fiş oluşturabilir, ayrı aggregate), `archetype-eav-directive.md` ve `archetype-variant-attribute-family-directive.md` (aynı normatif şablon: Amaç→Kapsam→Non-goals→nedir/yapar/yapmaz→sözleşme şekli→WBS→tenant→AI guardrail→test→AC→anti-pattern→DoD). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız yönerge metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez (AI-DRAFT).*
