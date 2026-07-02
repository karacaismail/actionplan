# ArcheType Order/Line-Item Yönergesi — Sipariş + Satır Kalemleri + Fulfillment Metamodeli

**Sürüm:** 1.0 · **Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor) — insan onayı ile kilitlenecek. 2026-07-02.
**Gerekçe:** `src/data/archetypes/customer.json` `relations` dizisinde `{"name":"orders","kind":"one-to-many","target":"order","onDelete":"restrict"}` beyanı vardır ama **Order ArcheType tanımsızdır** — yani bugün platformda zaten sarkan (dangling) bir FK hedefi taşınıyor; `customer.json`'un `semanticRules`'ında da `openOrders == 0` ifadesi geçer, bu da yine tanımsız bir kavrama referans verir. Ecommerce, Fleetx (kargo/yemek teslimat), MRP satış-siparişi ürünlerinin hepsi yapısal olarak sipariş+satır+karşılama (fulfillment) modeline dayanır; bu model olmadan üçü de temelsiz kalır (bkz. `gap-2026-07-02-02-archetype.md` §4 G-A3, P0).
**Kapsam:** Sipariş başlığı (order header), satır kalemleri (order line — ürün, miktar, birim fiyat, indirim, vergi), karşılama/sevkiyat (fulfillment — kısmi teslim dahil), iptal/iade yönü.
**Aktörler:** Satış/sipariş yöneticisi (insan — siparişi onaylar, iptal/iade kararı verir), müşteri/sipariş veren (insan — siparişi oluşturur, `draft` durumunda), AI öneri motoru (sipariş taslağı önerir, `autonomy: draft`), Motor (platform runtime — toplam/durum-geçiş/stok-kontrolü kurallarını deterministik uygular), CI (GitHub Actions — conformance kapıları), tüketici uygulama (Ecommerce, Fleetx, MRP satış, CRM — `customer.json`'un `orders` ilişkisi).

---

## 1. Amaç

Bir sipariş, tek bir kayıt değil bir **aggregate**'tir (toplu bütünlük sınırı — başlık ve satırların birlikte tutarlı kalması gereken bütün): sipariş başlığının toplam tutarı, satır kalemlerinin toplamıyla **her zaman** eşleşmelidir; onaylanmış bir siparişin satırı sessizce değiştirilirse toplam ile gerçeklik ayrışır ve finansal/operasyonel tutarsızlık doğar. Bugün bu metamodel platformda **hiç yoktur** — `customer.json`'daki `orders` ilişkisi (bölüm gerekçesi) boşta bir referanstır; her ürün (Ecommerce, Fleetx, MRP satış) kendi sipariş tablosunu yeniden icat ederse (a) "order total = satırların toplamı" değişmezi üründen ürüne farklı biçimde (ya da hiç) uygulanır, (b) onaylı siparişte satır değişikliği engeli garanti edilmez, (c) stok yetersizken sipariş onaylanmasının önüne geçilmez. Bu yönerge, sipariş+satır+fulfillment'ı **tek kanonik metamodel** olarak sabitler: order-total = satır toplamı, onaylı siparişte doğrudan satır yazma yok (yalnız typed action) iki değişmezini veri şeması + motor kuralı + CI kapısı üçlüsüyle zorlar. Aktör-açık ifade: *insan* (müşteri/sipariş veren) siparişi oluşturur ve onaylar; *AI* yalnız sipariş **taslağı** önerir; *motor* toplam/durum-geçiş/stok kontrolünü deterministik uygular; hiçbir aktör onaylı bir siparişin satırını sessizce değiştiremez.

## 2. Kapsam

Bu yönerge kapsar: (a) `order` (sipariş başlığı — taraf referansı, tarih, durum, para birimi, toplam), (b) `order_line` (satır kalemi — ürün referansı, miktar, birim fiyat, indirim, vergi), (c) `fulfillment` (karşılama — sevkiyat/kısmi teslim durumu), (d) durum makinesi (`draft`→`confirmed`→`fulfilled`→`closed`) ve iptal/iade yönü. Bir *yönergedir* (mimari tarif) — implementasyon kodunu ajanlar ayrı bir `plan` promptuyla yazar; bu doküman şema/tablo iskeleti verir, çalışan kod değil.

### Non-goals (kapsam dışı)

- **Fiyat/indirim kuralı hesaplamaz.** Kademeli indirim, kampanya, indirim-yığma sırası `k-computation`'ın (Computation/Derivation — türetilmiş alan üreten saf ifade grafiği) işidir; bu yönerge yalnız **hesaplanmış** birim fiyat/indirim/vergi tutarının satıra nasıl yazılacağını tanımlar, tutarı üretmez.
- **Ödeme işlemi yapmaz.** Kredi kartı/banka tahsilatı `k-provider-adapter` (ödeme sağlayıcı entegrasyonu) işidir; bu yönerge yalnız siparişin ödeme **durumunu** (ödendi/beklemede referansı) taşır, tahsilatı yürütmez. Muhasebe fişi (ödeme sonucu) `archetype-ledger-directive.md`'nin işidir.
- **Stok düşümü yapmaz, sahiplenmez.** Envanter rezervasyonu/düşümü ayrı bir inventory (stok) archetype'ının işidir; sipariş onayı stok kontrolünü **çağırır** (dependsOn), stok hareketini kendisi yürütmez/sahiplenmez.
- **Kargo/lojistik rota planlamaz.** Sevkiyat rotası/taşıyıcı seçimi Fleetx'in kendi domain mantığıdır; `fulfillment` yalnız "ne kadarı, ne zaman teslim edildi" durumunu tutar, rota hesaplamaz.
- **Serbest kod çalıştırmaz.** Toplam/durum-geçiş kuralı yapısal veri kısıtıdır (DB constraint + motor kuralı + typed action guard); "if status == 'confirmed'" tarzı gömülü mantık yasaktır.

## 3. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Order (sipariş) aggregate'i = bir tarafın (customer/party) belirli ürünleri belirli miktar ve fiyatla talep ettiği, başlık (order) ve satır kalemlerinden (order line) oluşan bütünlük sınırıdır. Fulfillment (karşılama) = onaylanmış bir siparişin fiziksel/dijital olarak teslim edilme sürecidir; kısmi teslim (bir siparişin birden çok sevkiyatla tamamlanması) dahildir.

**Ne yapar:**
- **Order-total = satır toplamı** değişmezini tanım-anında (kaydedilmeden önce) zorlar; `order.total` ile `SUM(order_line.line_total)` uyuşmazlığı reddedilir.
- **Onaylı siparişte** (`status != draft`) satıra **doğrudan** (generated CRUD) UPDATE/DELETE'i engeller; satır değişikliği yalnız typed action (ör. `amend_order`) ile ve durum-uygun geçişle yapılır.
- Durum geçişini (`draft`→`confirmed`→`fulfilled`→`closed`, iptal/iade dallarıyla) workflow/lifecycle guard'a bağlar; guard koşulu (ör. stok yeterliliği) sağlanmadan geçiş engellenir.
- Kısmi teslimi `fulfillment` satırlarıyla izler; bir siparişin toplam sevk edilen miktarı satır miktarını aşamaz.
- Miktarı `Measure` atomu (birim+dönüşüm), birim fiyatı `Money` atomu (değer+kur+precision+rounding) ile tip-güvenli tutar.

**Ne yapmaz:**
- Fiyat/indirim/vergi tutarını **hesaplamaz** (girdi olarak alır, üretmez — o Computation'ın işi).
- Ödemeyi **tahsil etmez**; yalnız ödeme durumu referansını taşır.
- Stoğu **düşürmez/rezerve etmez**; inventory archetype'ını **çağırır**, o işlemi sahiplenmez.
- Kargo rotası **planlamaz**; yalnız fulfillment durumunu tutar.
- Onaylı siparişte satırı **sessizce değiştirmez**; her değişiklik typed action + audit izi bırakır.

## 4. Sözleşme şekli (alan | tip | amaç)

Backend yığını: **PostgreSQL + SQLAlchemy 2.0 / SQLModel + Alembic + FastAPI.** Aşağıdaki tablolar veri modelini alan-alan tanımlar; alan adı + tip + amaç verir, dolu örnek (mock) vermez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. **Ortak alanlar (her tabloda, tekrar yazılmaz):** `id` (UUID PK), `tenant_id` (UUID, indexed NOT NULL — RLS izolasyonu, v1 §2.1 fail-closed zorunluluğu), `created_at`/`updated_at` (TIMESTAMPTZ NOT NULL — audit alanları).

### 4.1 `order` — Sipariş başlığı

Bir siparişin başlık bilgisini tutar; `customer.json`'daki `orders` ilişkisinin (`target: "order"`) hedefidir — bu tablo o sarkan referansı çözer.

| Alan | Tip | Amaç |
|---|---|---|
| `order_number` | string (unique/tenant, sequence-backed) | İnsan-okur sipariş numarası; boşluksuz artan sıra |
| `party_id` | UUID (FK → customer/party) | Siparişi veren taraf; `customer.json` `orders` ilişkisinin karşı-ucu |
| `currency` | string (ISO-4217) | Siparişin para birimi; tüm satırların `unit_price.currency`'si buna uymalı |
| `status` | enum(draft, confirmed, fulfilled, closed, cancelled) | Yaşam döngüsü durumu; typed action ile ilerler (bölüm 3) |
| `total` | Money (`atomic-types-directive.md` §5.2) | Sipariş toplamı; `SUM(order_line.line_total)`'a eşit olmak **zorunda** (bölüm 3 değişmezi) |
| `placed_at` | TIMESTAMPTZ | Siparişin oluşturulma zamanı |
| `confirmed_at` | TIMESTAMPTZ \| null | Onaylanma zamanı; `status=confirmed` geçişiyle dolar |
| `payment_ref` | JSONB \| null | Ödeme durumu referansı (ödeme sonucu fişi `archetype-ledger`'a yazılabilir, ama bu alan yalnız referans taşır) |
| `cancel_reason` | I18nText \| null | İptal edilmişse çok-dilli gerekçe |

### 4.2 `order_line` — Satır kalemi

Bir siparişin tek bir ürün/miktar/fiyat kombinasyonunu tutar; her sipariş en az bir satır taşır.

| Alan | Tip | Amaç |
|---|---|---|
| `order_id` | UUID (FK → order) | Ait olduğu sipariş |
| `product_id` | UUID (FK → product) | Sipariş edilen ürün referansı (`product.json` ArcheType'ına bağlanır) |
| `quantity` | Measure (`atomic-types-directive.md` §5.2, birim+dönüşüm) | Sipariş edilen miktar; boyut-güvenli (adet/kg/lt vb.) |
| `unit_price` | Money | Birim fiyat; hesaplanmış (Computation çıktısı) değeri **taşır**, üretmez |
| `discount` | Money \| null | Satıra uygulanan indirim tutarı (hesaplanmış; üretilmez) |
| `tax` | Money \| null | Satıra uygulanan vergi tutarı (hesaplanmış; üretilmez) |
| `line_total` | Money | `(unit_price * quantity) - discount + tax` türetilmiş toplamı; `order.total`'ın bileşeni |
| `line_order` | integer | Sipariş içi satır sırası (görüntüleme; iş mantığı üretmez) |

### 4.3 `fulfillment` — Karşılama/sevkiyat

Onaylanmış bir siparişin teslim sürecini tutar; bir sipariş birden çok `fulfillment` kaydına (kısmi teslim) sahip olabilir.

| Alan | Tip | Amaç |
|---|---|---|
| `order_id` | UUID (FK → order, `status IN (confirmed, fulfilled)`) | Ait olduğu sipariş; yalnız onaylanmış siparişler fulfillment alabilir |
| `order_line_id` | UUID (FK → order_line) | Hangi satırın karşılandığı |
| `shipped_quantity` | Measure | Bu sevkiyatta gönderilen miktar; `SUM(shipped_quantity) <= order_line.quantity` |
| `carrier_ref` | JSONB \| null | Taşıyıcı/sevkiyat sağlayıcı referansı (Fleetx entegrasyonu; rota bu tabloda hesaplanmaz) |
| `shipped_at` | TIMESTAMPTZ \| null | Sevk edilme zamanı |
| `delivered_at` | TIMESTAMPTZ \| null | Teslim edilme zamanı |
| `status` | enum(pending, shipped, delivered, returned) | Bu sevkiyat kaydının kendi durumu |

Değişmezler (invariant) özet: **(1)** `order.total = SUM(order_line.line_total)` (aynı para biriminde) — kaydedilmeden önce doğrulanır; **(2)** `order.status IN (confirmed, fulfilled, closed, cancelled)` iken `order_line`'a **doğrudan** (generated CRUD) UPDATE/DELETE reddedilir — düzeltme yalnız typed action (`amend_order`, durum-uygun) ile yapılır; **(3)** `order.status` `draft`→`confirmed` geçişi, ilgili ürünlerin stok yeterliliği (inventory archetype çağrısı) doğrulanmadan gerçekleşemez.

## 5. WBS / bağımlılık

Aşağıdaki tablo `archetype-order` düğümünün WBS (İş Kırılım Yapısı) yerleşimini ve bağımlılığını verir. `dependsOn` = teknik/yürütme sırası (kritik yol, `wbs-field-semantics.md`); `blocks` = bu düğüm bitmeden başlayamayan işler; `related` = yalnız gezinme, karar üretmez.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `archetype-order` | archetype | `Money` + `Measure` atomları (`atomic-types-directive.md` AT-03/AT-04), `k-computation` (satır/başlık toplamı türetimi), `archetype-inventory` (stok yeterliliği kontrolü), `workflow` (durum-geçiş motoru), `scale-invariant` (`order` etiketi) | archetype |

`dependsOn` gerekçesi: **(1) Money + Measure atomları** — `order_line.unit_price`/`discount`/`tax`/`line_total` `Money`, `quantity`/`fulfillment.shipped_quantity` `Measure` tipindedir; ikisi kilitlenmeden (float-para yasağı, boyut-güvenli miktar) sipariş metamodeli güvenle kurulamaz. **(2) k-computation** — satır toplamı ve başlık toplamı türetilmiş değerlerdir; order/order_line ham girdiyi tutar, toplamı Computation türetir. **(3) archetype-inventory** — `draft`→`confirmed` geçişi stok yeterliliğini **çağırır**; inventory archetype'ı henüz yazılmamışsa (`gap-2026-07-02-02-archetype.md` §4 G-A4) bu bağımlılık bir bekleyen ön-koşuldur, sipariş onayı stoğu sahiplenmeden yalnız sorar. **(4) workflow** — durum makinesi (`draft`→`confirmed`→`fulfilled`→`closed`, iptal/iade dalları) `workflow-directive.md`'nin genel motoruna bağlanır; basit `LifecycleSchema` yetmez çünkü paralel dal (kısmi teslim) ve guard (stok kontrolü) gerekir. **(5) scale-invariant** — sipariş durumu yazan her akış `order` etiketi taşımak zorundadır (`scale-invariant-directive.md` §2); sipariş onay/iptal typed action'ı transactional outbox + idempotency + tamper-evident audit zarfı olmadan yazılamaz.

`blocks` (bu düğüm bitmeden başlayamayan işler): Ecommerce (P0 — sipariş akışının temeli), Fleetx (P0 — kargo/yemek teslimatı `order`+`fulfillment` üzerine kurulur), MRP satış-siparişi (P0 — üretim planlaması satış siparişinden tetiklenir).

`related` (yalnız gezinme): `archetype-ledger-directive.md` (sipariş onayı/ödeme sonucu bir muhasebe fişi doğurabilir, ama order ledger'a `dependsOn` vermez — ayrı aggregate, `payment_ref` yalnız referans taşır), CRM `customer.json` (`orders` ilişkisinin kaynak-ucu; bu yönerge o ilişkinin hedef-ucunu tanımlayarak sarkan FK'yı çözer).

## 6. Multi-tenant + AI guardrail

**Multi-tenant:** Her `order`/`order_line`/`fulfillment` satırı `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Cross-tenant erişim girişimi `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)`. RLS **zorunludur** — uygulama katmanı filtresi tek başına yeterli sayılmaz (çift bariyer).

**AI guardrail:** Dört-aktör iş bölümü (`core-contract-pack.md` §3.0.1) değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.**

| İşlem | Autonomy | Kural |
|---|---|---|
| Sipariş taslağı önerme | `draft` | AI müşteri talebinden/geçmiş davranıştan bir `order` + `order_line` taslağı üretebilir; `status=draft` kalır, onaylanmamış sayılır |
| Sipariş onaylama (`draft`→`confirmed`) | onay-zorunlu | Onay yalnız **typed action** (`confirm_order`) ile ve insan `approval_ref`'i ile olur; generated CRUD ile `status` doğrudan yazılamaz |
| Onaylı siparişte satır değişikliği | onay-zorunlu | AI değişiklik **önerebilir** (`amend_order` taslağı) ama uygulama insan onayı ister; sessiz satır değişikliği yasak |
| Sipariş kapatma/iptal | onay-zorunlu | `closed`/`cancelled` geçişi insan onaylı typed action; AI tek başına kapatamaz |
| Fulfillment kaydı oluşturma | `draft` | AI sevkiyat taslağı önerebilir; gerçek sevkiyat kaydı operasyon insanı/entegrasyon tarafından onaylanır |

Mutlak sınırlar: AI onaylı bir `order_line`'ı **doğrudan UPDATE/DELETE edemez** (yalnız typed action önerisiyle, insan onayına tabi); AI main branch'e push edemez; app/module düğümü üretemez; ruleset override edemez; stok yetersizken `confirmed` geçişi (AI dahil hiçbir aktör) inventory kontrolü geçmeden gerçekleşemez.

## 7. Test stratejisi (test-önce, negatif testler dahil)

Test-önce zorunludur (önce kırmızı, sonra yeşil). Aşağıdaki tablo test senaryosunu türüyle eşler; negatif testler (reddedilmesi gereken durumlar) özellikle vurgulanır.

| # | Senaryo | Beklenen | Tür |
|---|---|---|---|
| 1 | Order-total uyuşmazlığı: `order.total != SUM(order_line.line_total)` olan sipariş kaydedilmeye çalışılıyor | Reddedilir (tanım-anında) | Unit (negatif) |
| 2 | Onaylı siparişte doğrudan satır UPDATE: `status=confirmed` bir siparişin `order_line`'ı generated CRUD ile değiştiriliyor | Reddedilir; yalnız `amend_order` typed action | Unit (negatif) |
| 3 | Onaylı siparişte doğrudan satır DELETE: `status=confirmed` bir siparişin satırı silinmeye çalışılıyor | Reddedilir | Unit (negatif) |
| 4 | Stok yetersizken onay: `draft`→`confirmed` geçişi istenen miktar mevcut stoktan fazlayken deneniyor | Reddedilir (inventory guard) | Integration (negatif) |
| 5 | Durum sırası ihlali: `draft`→`fulfilled` gibi ara adımı atlayan geçiş deneniyor | Typed action guard reddeder | Unit (negatif) |
| 6 | Kısmi teslim toplamı: `SUM(fulfillment.shipped_quantity) > order_line.quantity` olacak sevkiyat ekleniyor | Reddedilir | Unit (negatif) |
| 7 | Para birimi tutarsızlığı: `order.currency != order_line.unit_price.currency` olan satır ekleniyor | `CurrencyMismatchError` | Unit (negatif) |
| 8 | AI doğrudan onay: `approval_ref` olmadan AI'ın `confirm_order` çağırması | `ApprovalRequiredError` | Integration (negatif) |
| 9 | AI'ın sessiz satır değişikliği: AI'ın onaylı siparişte insan onayı olmadan satır değiştirmesi | Reddedilir | Integration (negatif) |
| 10 | Çapraz-tenant erişim: A tenant'ın B tenant'ın siparişini/satırını görmesi/yazması (≥10 negatif case) | `TenantViolationError` + audit | Integration (negatif) |
| 11 | Sipariş numarası tekilliği: aynı tenant içinde `order_number` çakışması | Reddedilir (unique constraint) | Unit (negatif) |
| 12 | Boş sipariş: hiçbir `order_line` taşımayan siparişin `confirmed`'a geçmesi | Reddedilir (en az 1 satır zorunlu) | Unit (negatif) |

## 8. Kabul kriterleri + Anti-patterns + DoD

### Acceptance criteria

- AC-1: Her `order` kaydında `total = SUM(order_line.line_total)`; uyuşmazlık tanım-anında reddediliyor.
- AC-2: Onaylı (`confirmed`/`fulfilled`/`closed`) siparişte `order_line`'a doğrudan (generated CRUD) UPDATE/DELETE reddediliyor; düzeltme yalnız typed action ile.
- AC-3: `draft`→`confirmed` geçişi stok yeterliliği doğrulanmadan gerçekleşmiyor (inventory guard).
- AC-4: Kısmi teslim toplamı satır miktarını aşmıyor; `fulfillment` kayıtları tutarlı.
- AC-5: Para birimi tutarsızlığı (`order.currency` vs `order_line.unit_price.currency`) reddediliyor.
- AC-6: Sipariş onay/kapatma/iptal yalnız insan onaylı typed action ile ilerliyor; AI doğrudan yazamıyor.
- AC-7: Cross-tenant erişim ≥10 negatif case ile reddediliyor; RLS ikinci bariyer olarak doğrulanıyor.
- AC-8: `order` etiketi taşıyan her yazma `scale-invariant-directive.md`'nin outbox+idempotency+audit zarfını taşıyor.
- AC-9: `customer.json`'daki `orders` ilişkisi (`target: "order"`) artık gerçek bir ArcheType'a çözülüyor; sarkan FK kalmıyor.

### Anti-patterns (yasak desenler)

- **Toplam-satır ayrışması:** `order.total`'ı satır toplamından bağımsız serbestçe yazmak; değişmez ihlali, yasak.
- **Sessiz satır mutasyonu:** Onaylı siparişte satırı generated CRUD ile "hızlı düzeltme" bahanesiyle değiştirmek; yalnız typed action + audit.
- **Float ile Money:** `unit_price`/`discount`/`tax`/`line_total`'ı `float`/düz `number` ile tutmak; `Money` atomu zorunlu.
- **Serbest string miktar:** `quantity`'yi birimsiz sayı olarak tutmak (kg ile adet karışır); `Measure` atomu zorunlu.
- **Stok kontrolünü atlama:** Sipariş onayını inventory kontrolü olmadan geçirmek; "belki stok vardır" varsayımı yasak.
- **AI'ın doğrudan onayı:** `approval_ref`'siz AI sipariş onayı; `ApprovalRequiredError`.
- **Durum sırası atlama:** `draft`'tan doğrudan `fulfilled`'a veya `closed`'a geçmek; workflow guard sırayı zorlar.
- **Fulfillment'ta rota hesaplama:** Kargo rotasını `fulfillment` tablosunda hesaplamaya çalışmak; rota Fleetx'in kendi domain işidir, bu tablo yalnız durumu tutar.

### DoD (Definition of Done)

- §7'deki 12 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil belgeli); özellikle 10 negatif senaryo (toplam uyuşmazlığı, onaylı-satır UPDATE/DELETE reddi, stok-yetersiz onay reddi, kısmi-teslim aşımı, para-birimi tutarsızlığı, durum-sırası ihlali, AI onay/mutasyon reddi, cross-tenant, tekillik, boş-sipariş) kanıtlanmış.
- `order`/`order_line`/`fulfillment` şeması SQLAlchemy 2.0 + Alembic ile tanımlı; onaylı sipariş satırında doğrudan UPDATE/DELETE'i engelleyen kural (typed-action-only) uygulanmış.
- `Money` ve `Measure` atomları (`atomic-types-directive.md` AT-03/AT-04) kilitlenmiş ve bu şema tarafından kullanılıyor.
- RLS politikası her üç tabloda aktif; cross-tenant testler yeşil.
- `scale-invariant-directive.md`'nin `order` etiketi ve `scaled_write` zarfı `confirm_order`/`amend_order`/`cancel_order` typed action'larında uygulanmış; `check-scale-invariant` yeşil.
- `workflow-directive.md`'nin durum makinesi motoru `order.status` geçişlerini yönetiyor (kısmi-teslim paralel dalı dahil).
- AI-guardrail testi: AI'ın doğrudan onay/mutasyon/kapatması reddediliyor; yalnız `draft` taslak önerisi kabul ediliyor.
- Ecommerce, Fleetx, MRP satış-siparişi bu metamodeli tüketiyor (`blocks` ilişkisi kanıtlı — bölüm 5); `customer.json`'daki sarkan `order` referansı çözülmüş (gerçek fixture ile doğrulanmış).
- Doküman `icerik-kalite-sozlesmesi.md` biçim kurallarına uyuyor (emoji yok, aktör açık, her bölümde nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok).
- İnsan onayı ile "Kilitli" statüsüne geçiyor (bugünkü statü: taslak).

## 9. Not — scale-invariant ilişkisi

`scale-invariant-directive.md`'deki `order` etiketi (§2) ile bu yönergenin ilişkisi **kapsayan-kapsanan** değil, **zarf-içerik**tir: scale-invariant, sipariş/rezervasyon durumu yazan **her** akışın (yalnız order değil — sipariş iptal/iade, rezervasyon değişikliği de dahil) etrafına outbox+idempotency+tamper-evident-audit zarfını sarar; bu yönerge zarfın **içindeki** veri modelini (başlık, satır, fulfillment) tanımlar. Bir `confirm_order` typed action'ı hem bu yönergenin toplam/durum-geçiş kurallarına **hem de** scale-invariant'ın `order` etiketli `scaled_write` zarfına aynı anda tabidir — biri veri şeklini ve iş kuralını, diğeri yazma güvenliğini (çift-onay, kayıp-olay riski) garanti eder. Ayrıca sipariş çoğu zaman `inventory` (stok, henüz yazılmamış — G-A4) ile birlikte hem `order` hem `inventory` etiketini taşıyabilir (ör. onay anında hem sipariş durumu hem stok miktarı aynı transaction'da değişir); bu durumda zarf her iki etiketin gerektirdiği korumayı da uygular.

---

*Kaynak yönergeler: `gap-2026-07-02-02-archetype.md` §4 G-A3 (P0 boşluk tespiti, sarkan `order` FK'sı), `atomic-types-directive.md` (Money + Measure atomu ön şartı), `archetype-uretim-spec.md` §12.B (Measure/measure FieldType), `scale-invariant-directive.md` (`order` etiketi, outbox/idempotency/audit zarfı), `docs/drafts/workflow-directive.md` (durum-geçiş motoru bağımlılığı). Kardeş sözleşmeler: `archetype-ledger-directive.md` (sipariş ödeme sonucu fiş oluşturabilir, ayrı aggregate), `archetype-eav-directive.md` ve `archetype-variant-attribute-family-directive.md` (aynı normatif şablon: Amaç→Kapsam→Non-goals→nedir/yapar/yapmaz→sözleşme şekli→WBS→tenant→AI guardrail→test→AC→anti-pattern→DoD). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız yönerge metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez (AI-DRAFT).*
