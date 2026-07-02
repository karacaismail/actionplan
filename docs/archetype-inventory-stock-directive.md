# ArcheType Envanter / Stok Yönergesi — Depo, Stok Kalemi, Lot, Seri No, Rezervasyon, Stok Hareketi Metamodeli

**Sürüm:** 1.0 · **Tarih:** 2026-07-02
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor) — insan onayı ile kilitlenecek. 2026-07-02.
**Gerekçe:** `gap-2026-07-02-02-archetype.md` §4 **G-A4** şunu saptar: `product.json` fixture'ı yalnız `stock: integer` taşır; depo, rezervasyon, stok hareketi (append-only ledger-benzeri kayıt) modeli **hiç yoktur**. EAV yönergesi (`archetype-eav-directive.md` §19) bu alanı açıkça kapsam dışı bırakır — dinamik öznitelik değeri ile fiziksel stok miktarı farklı eksenlerdir. MRP (üretim planlama), ecommerce (e-ticaret) ve Fleetx depo modülü **bu metamodele bağımlıdır (P0)**; bu üçü olmadan sipariş karşılama, üretim malzeme tüketimi ve kargo/yemek depo operasyonu yeniden icat edilir (kernel'in "50 app × kendi implementasyonu = 50× hata" felsefesine aykırı).
**Kaynak/bağlam:** `gap-2026-07-02-02-archetype.md` §4 G-A4/G-A5, `archetype-uretim-spec.md` (23-parçalı sözleşme ailesi + §12 v2 uzantıları), `archetype-eav-directive.md` (kardeş yönerge, ton/yapı referansı; non-goals sınırı), `archetype-tree-relation-directive.md` (kardeş yönerge, `ltree`/WBS deseni referansı), `atomic-types-directive.md` (Measure atomu — boyut-güvenli ölçü), `k-worker-taskqueue-directive.md` (rezervasyon süre-aşımı/otomatik-serbest bırakma arka-plan işi), `drafts/archetype-order-line-item-directive.md` (taslak; sipariş bu metamodeli çağırır), `docs/drafts/archetype-ledger-directive.md` (taslak; stok değeri/maliyet ayrı ledger işidir).
**Aktörler:** Depo sorumlusu (insan — operasyon/lojistik ekibi), AI öneri motoru (draft; ör. düzeltme/sayım anomalisi), Motor (platform runtime), CI (GitHub Actions), tüketici uygulama (MRP, ecommerce, Fleetx depo, PIM).

---

## 1. Amaç

Fiziksel malın nerede, ne kadar, hangi lot/parti veya seri numarasıyla, kime rezerve edildiği ve hangi hareketle o duruma geldiği sorusu **50 uygulamanın en az üçünde (MRP, ecommerce, Fleetx depo)** aynı çekirdek yapıyı ister. Bugün `product.json` bu soruyu tek bir `stock: integer` alanına sıkıştırır — çok-depolu senaryo, lot/seri izlenebilirliği, rezervasyon çakışması ve "neden stok değişti" sorusunun yanıtı (audit) yoktur. Bu yönerge, stok miktarını **tek bir kaynak-of-truth append-only harekete** (`stock_movement`) bağlayan, anlık bakiyeyi bu hareketlerin toplamından türeten bir metamodel sabitler: stok miktarı elle güncellenen bir sayaç değil, hareketlerin **muhasebe defteri gibi** biriken sonucudur (`archetype-uretim-spec.md`'nin append-only migration felsefesiyle aynı ruh). Aktör-açık ifade: *AI* düzeltme/sayım anomalisi **önerir** (draft); *insan* stok düzeltmesini ve negatif-stok politikasını onaylar; *motor* hareketi deterministik uygular ve bakiyeyi türetir; *CI* append-only ihlalini ve çift-rezervasyonu bloklar.

## 2. Kapsam

Bu yönerge kapsar: (1) `warehouse` (depo/lokasyon) veri modeli, (2) `stock_item` (bir ürünün bir depodaki stok kaydı) veri modeli, (3) `lot` (parti/seri-dışı toplu izlenebilirlik birimi) veri modeli, (4) `serial` (tekil seri numarası izlenebilirlik birimi) veri modeli, (5) `reservation` (rezervasyon — gelecekteki bir talep için stok ayırma) veri modeli, (6) `stock_movement` (giriş/çıkış/transfer/düzeltme append-only hareket kaydı) veri modeli ve bunun `qty` alanının `Measure` atomuna bağı, (7) anlık bakiyenin hareketlerden türetilme kuralı, (8) negatif stok politikasının beyan zorunluluğu, (9) WBS/bağımlılık yerleşimi, (10) multi-tenant/RLS, (11) AI guardrail, (12) test stratejisi. Bir *yönerge* (mimari tarif) verir; implementasyon kodunu ajanlar `plan-01` promptuyla yazar.

## 3. Non-goals (kapsam dışı)

Bu yönerge şunları **yapmaz**: **(1) Fiyat/maliyet hesabı** — bir stok hareketinin parasal değeri (FIFO/LIFO/ağırlıklı-ortalama maliyet, stok değerleme) `docs/drafts/archetype-ledger-directive.md` (çift-taraflı muhasebe) ve `k-computation`'ın işidir; bu yönerge yalnız **miktar** (`Measure`) hareketini tanımlar, parasal değeri taşımaz. **(2) Fiziksel taşıma/lojistik yürütme** — bir transfer hareketinin gerçekte hangi kamyonla, hangi rotada taşındığı `app` katmanının (Fleetx, WMS entegrasyonu) işidir; bu yönerge yalnız transferin **veri sonucunu** (kaynak depo azaldı, hedef depo arttı) tanımlar. **(3) Talep tahmini / yeniden-sipariş noktası hesaplama** — MRP'nin planlama algoritmasıdır (`archetype-uretim-spec.md §12.D`); bu yönerge yalnız mevcut bakiyeyi ve rezervasyonu doğru tutar, tahmin üretmez. **(4) BOM patlaması/malzeme tüketim planı** — `archetype-tree-relation-directive.md` (`graph`/BOM-graph) ve Computation'ın işidir; bu yönerge yalnız tüketimin *sonucu* olan `stock_movement` kaydını tüketir, planı üretmez. **(5) Kimlik/kanonik-anahtar üretimi** — ürün/SKU kanonikleşmesi `c13n` (`05-c13n`) hattındadır; bu yönerge `stock_item`'ı var olan bir ürün/varyant kimliğine referans verir, kimlik üretmez. **(6) Barkod/QR fiziksel tarama donanımı** — cihaz entegrasyonu `app` katmanının işidir; bu yönerge yalnız tarama *sonucunda* yazılan `stock_movement`/`serial` kaydını tanımlar.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Envanter/stok metamodeli, fiziksel malın depo-bazlı miktarını, lot/seri izlenebilirliğini ve rezervasyon durumunu, **tek kaynak-of-truth append-only hareket defterinden** (`stock_movement`) türeten sözleşmedir. "Envanter" (inventory) = bir tenant'ın elinde bulunan, depo(lar)a dağılmış, izlenebilir fiziksel/dijital-stoklu malın toplamıdır; "stok hareketi" (stock movement) = bu toplamı değiştiren, geri alınamaz (yalnız ters-kayıtla düzeltilen) tekil olaydır.

**Ne yapar:** Bir ürün/varyantın **birden çok depoda** ayrı ayrı miktarını taşır (`stock_item`); giriş/çıkış/transfer/düzeltme hareketlerini **append-only** (satır silinmez/güncellenmez) kaydeder ve anlık bakiyeyi bu hareketlerin toplamından türetir; lot/parti (toplu, aynı üretim/parti numarasıyla izlenen) ve seri no (tekil, bir-bir izlenen) birimlerini ayrı iki izlenebilirlik modeliyle taşır; gelecekteki bir talep için stoku **rezerve eder** (`reservation`) ve rezerve edilmiş miktarı kullanılabilir bakiyeden düşer; her hareketi `tenant_id` + `actor` + `reason` ile audit'ler; negatif stok politikasını (izin-ver / reddet / onayla) ArcheType düzeyinde **açık beyan** ister — sessiz varsayım yasaktır.

**Ne yapmaz:** Stok miktarını doğrudan `UPDATE stock_item SET quantity = ...` ile değiştirmez — her değişiklik bir `stock_movement` satırı **olmak zorundadır** (generated CRUD'un bu alanı doğrudan yazması yasaktır, `archetype-uretim-spec.md`'nin typed-action ayrımı). Parasal değer taşımaz (§3). Fiziksel taşımayı yürütmez (§3). Rezervasyonu sessizce iptal etmez — süre-aşımı (`expires_at`) veya açık iptal hareketi gerekir. Lot/seri izlenebilirliğini isteğe bağlı bir "not alanı" gibi ele almaz — izlenebilirlik zorunlu FK zinciridir (`stock_movement.lot_ref`/`serial_ref`). Negatif stok politikasını koda gömmez (`if quantity < 0` yasak; politika ArcheType alanında beyan edilir, motor onu okur).

## 5. Sözleşme şekli — backend PostgreSQL + SQLAlchemy 2.0/SQLModel + Alembic + FastAPI

Aşağıdaki altı tablo, envanter metamodelinin veri şeklini alan adı + tip + amaç olarak tarif eder; dolu örnek/mock değer verilmez. Tipler PostgreSQL/SQLAlchemy 2.0 karşılıklarıdır. Stack: FastAPI + SQLAlchemy 2.0/SQLModel + Alembic + PostgreSQL; Next.js/Supabase/Prisma yasaktır (repo-genel stack kısıtı). RLS her tabloda zorunludur (§9).

### 5.1 `warehouse` (depo)

Bir tenant'ın fiziksel veya sanal (ör. "iade karantina") stok tutma lokasyonudur.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Depo benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu; v1 §2.1 fail-closed zorunluluğu |
| `code` | Text (NOT NULL, unique per tenant) | Kısa makine-kodu (ör. depo-kısaltması); insan-okunur `name` ayrı |
| `name` | I18nText | Çok-dilli görünen ad (`atomic-types-directive.md` I18nText atomu) |
| `kind` | Enum(physical, virtual, transit) | Fiziksel depo / sanal (karantina, hasarlı) / transit (yoldaki stok) |
| `address_ref` | UUID (FK → Address Fragment, nullable) | Fiziksel adres; sanal depoda NULL olabilir |
| `parent_warehouse_id` | UUID (FK → self, nullable) | Depo-içi alt-lokasyon (raf/bölge) hiyerarşisi; `archetype-tree-relation-directive.md` `tree` kind'ına opsiyonel bağ |
| `status` | Enum(active, inactive, archived) | Yaşam döngüsü; silme yerine arşivleme |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

### 5.2 `stock_item` (stok kalemi)

Bir ürün/varyantın **bir depodaki** anlık bakiye özetidir; kaynak-of-truth değildir (bakiye `stock_movement`'tan türer), **okuma-performansı için tutulan denormalize özet**tir (`06-n6n` kontrollü-denormalizasyon ruhu).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Stok kalemi benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `warehouse_id` | UUID (FK → warehouse) | Hangi depoda |
| `product_ref` | UUID (FK → Product/Variant ArcheType) | Hangi ürün/varyant; kimlik üretmez, var olana referans verir |
| `quantity_on_hand` | `Measure` (JSONB; value+unit+canonical) | Fiziksel elde bulunan miktar; `atomic-types-directive.md` Measure atomu, boyut-güvenli |
| `quantity_reserved` | `Measure` (JSONB) | Aktif rezervasyonların toplamı; `stock_movement`'tan değil `reservation`'dan türer |
| `quantity_available` | `Measure` (generated/computed, JSONB) | `quantity_on_hand - quantity_reserved`; hesaplanan sütun veya view, doğrudan yazılmaz |
| `reorder_policy_ref` | UUID (nullable) | Yeniden-sipariş politikası referansı (MRP planlama girdisi; bu yönerge üretmez, §3) |
| `negative_stock_policy` | Enum(deny, allow, allow-with-approval) | Bu depo+ürün kombinasyonunda negatif bakiyeye izin kuralı; **zorunlu beyan**, varsayılan `deny` |
| `last_movement_id` | UUID (FK → stock_movement, nullable) | Bakiyeyi son güncelleyen hareket; audit iz sürme kolaylığı |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

Benzersizlik kısıtı `(tenant_id, warehouse_id, product_ref)` üzerinedir: bir depoda bir ürünün tek özet satırı olur; lot/seri kırılımı ayrı tablolarda (§5.3/§5.4) tutulur, `stock_item` toplam özetidir.

### 5.3 `lot` (parti/lot)

Aynı üretim partisi/lot numarasıyla **toplu** izlenen stok birimidir (ör. gıda son-kullanma tarihi, kimyasal parti numarası). Bireysel birimler ayrım gerektirmez — miktar bazlı izlenir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Lot benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `product_ref` | UUID (FK → Product/Variant ArcheType) | Hangi ürün/varyant |
| `lot_number` | Text (NOT NULL) | Üretici/tedarikçi lot numarası (insan-okunur, iş anahtarı) |
| `manufactured_at` | TIMESTAMPTZ (nullable) | Üretim tarihi |
| `expires_at` | TIMESTAMPTZ (nullable) | Son kullanma/geçerlilik tarihi; FEFO (first-expire-first-out) sıralamasının girdisi |
| `quantity_remaining` | `Measure` (JSONB) | Bu lottan kalan miktar; `stock_movement.lot_ref` toplamından türer (özet) |
| `status` | Enum(active, quarantine, expired, exhausted) | Lot yaşam döngüsü |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

Benzersizlik kısıtı `(tenant_id, product_ref, lot_number)` üzerinedir.

### 5.4 `serial` (seri no)

**Tekil** (bir-bir) izlenen stok birimidir (ör. seri numaralı elektronik cihaz, araç şasi no). Her `serial` satırı tam olarak bir fiziksel birimi temsil eder ve herhangi bir anda **tek bir depoda ve tek bir durumda** olabilir.

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Seri kaydı benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `product_ref` | UUID (FK → Product/Variant ArcheType) | Hangi ürün/varyant |
| `serial_number` | Text (NOT NULL) | Fiziksel seri numarası (insan-okunur, iş anahtarı) |
| `current_warehouse_id` | UUID (FK → warehouse, nullable) | Şu an hangi depoda; NULL = depodan çıkmış (satılmış/sevk edilmiş) |
| `status` | Enum(in-stock, reserved, shipped, returned, scrapped) | Seri birimin yaşam döngüsü |
| `lot_ref` | UUID (FK → lot, nullable) | Üretildiği lota bağ (ikisi birlikte de kullanılabilir: lot + tekil seri) |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

Benzersizlik kısıtı `(tenant_id, product_ref, serial_number)` üzerinedir. `serial`, `stock_item`'ın miktar-bazlı modelinden farklı olarak **her zaman miktar=1** taşır; `stock_movement` seri-izlenen üründe `qty=1 unit` + `serial_ref` dolu satır üretir.

### 5.5 `reservation` (rezervasyon)

Gelecekteki bir talep (sipariş, üretim emri, transfer talebi) için stoku **şimdiden ayırma** kaydıdır; fiziksel hareket değildir, bakiyeyi düşürmez ama `quantity_available`'ı düşürür (§5.2).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Rezervasyon benzersiz kimliği |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `stock_item_id` | UUID (FK → stock_item) | Hangi depo+ürün kombinasyonu rezerve edildi |
| `quantity` | `Measure` (JSONB) | Rezerve edilen miktar |
| `lot_ref` / `serial_ref` | UUID (nullable) / UUID (nullable) | Belirli lot/seriye kilitli rezervasyon (opsiyonel daraltma) |
| `demand_ref` | UUID (FK → talep eden kayıt, ör. order_line) | Rezervasyonun nedeni; polymorphic referans (order/production-order/transfer-request) |
| `status` | Enum(active, fulfilled, released, expired) | Rezervasyon yaşam döngüsü |
| `expires_at` | TIMESTAMPTZ (nullable) | Süre-aşımında otomatik `released`'e döner (§7 k-worker bağı); NULL = süresiz |
| `created_by` | UUID (FK → actor) | Rezervasyonu yapan aktör (insan veya sistem) |
| `created_at` / `updated_at` | TIMESTAMPTZ (NOT NULL) | Audit alanları |

**Çift-rezervasyon reddi:** Aynı `(stock_item_id, lot_ref, serial_ref)` kombinasyonunda, `status=active` rezervasyonların toplam `quantity`'si `stock_item.quantity_on_hand`'i aşamaz; motor her yeni rezervasyon isteğinde bu toplamı **transaction içinde** (satır kilidi, `SELECT ... FOR UPDATE`) kontrol eder ve aşım durumunda `InsufficientStockError` fırlatır (negatif-stok politikası `allow`/`allow-with-approval` değilse).

### 5.6 `stock_movement` (stok hareketi — append-only ledger-benzeri)

Bu yönergenin **kaynak-of-truth** tablosudur. Her satır geri alınamaz bir olaydır; düzeltme yeni bir ters-kayıt satırıyla yapılır, mevcut satır **asla** UPDATE/DELETE edilmez (append-only, `archetype-uretim-spec.md`'nin migration felsefesiyle aynı desen — burada veri satırı düzeyinde uygulanır).

| Alan | Tip | Amaç |
|---|---|---|
| `id` | UUID (PK) | Hareket benzersiz kimliği; audit iz sürme anahtarı |
| `tenant_id` | UUID (indexed, NOT NULL) | Kiracı izolasyonu |
| `stock_item_id` | UUID (FK → stock_item) | Hangi depo+ürün kombinasyonu etkilendi |
| `type` | Enum(inbound, outbound, transfer, adjustment) | Hareket türü: giriş / çıkış / transfer / düzeltme |
| `qty` | `Measure` (JSONB; value+unit+canonical) | Hareket miktarı; **her zaman pozitif büyüklük**, yön `type`+`direction` ile ayrılır (float/çıplak `number` yasak — `atomic-types-directive.md` §3.6 float-yasağı) |
| `direction` | Enum(in, out) | Bu satırın bakiyeye etkisi: `in` = artırır, `out` = azaltır; `transfer` iki satır (kaynak `out` + hedef `in`) üretir |
| `transfer_pair_id` | UUID (nullable, self-FK) | `type=transfer` iken kaynak/hedef satırını eşleştiren ortak kimlik |
| `lot_ref` / `serial_ref` | UUID (nullable) / UUID (nullable) | İzlenebilirlik zinciri; lot/seri-izlenen üründe zorunlu dolu |
| `reservation_ref` | UUID (nullable, FK → reservation) | Bu hareket bir rezervasyonu karşılıyorsa bağ |
| `reason` | Enum(purchase, sale, production-consume, production-yield, transfer, return, damage, count-correction, other) | Hareketin iş nedeni; serbest metin değil kapalı kümedir |
| `reason_note` | Text (nullable) | `reason=other` veya ek bağlam gerektiğinde serbest açıklama |
| `reversed_movement_id` | UUID (nullable, self-FK) | Bu satır bir önceki satırın **ters-kaydıysa** o satırı işaret eder; düzeltme mekanizması budur |
| `actor_id` | UUID (FK → actor) | Hareketi tetikleyen aktör (insan, AI-draft-onaylı, veya `system` arka-plan işi) |
| `source_ref` | UUID (nullable) | Hareketi doğuran kaynak kayıt (order_line, production_order, manual-count) — polymorphic |
| `occurred_at` | TIMESTAMPTZ (NOT NULL) | Hareketin iş-anlamı gerçekleştiği an (backfill'de `created_at`'tan farklı olabilir) |
| `created_at` | TIMESTAMPTZ (NOT NULL) | Satırın veritabanına yazıldığı an; **immutable**, hiçbir zaman güncellenmez |

**Değişmezler (invariant):**
- **Append-only:** `stock_movement` tablosunda `UPDATE`/`DELETE` veritabanı düzeyinde reddedilir (`REVOKE UPDATE, DELETE ON stock_movement FROM application_role`); düzeltme yalnız `reversed_movement_id` dolu yeni bir satırla yapılır.
- **Bakiye türetimi:** `stock_item.quantity_on_hand`, o `stock_item_id` için `direction=in` toplamı eksi `direction=out` toplamına **eşit olmak zorundadır**; bu eşitlik bir CI/test invariantıdır (§8, senaryo 3), `stock_item.quantity_on_hand` asla doğrudan yazılmaz — yalnız hareket-sonrası motor tarafından yeniden hesaplanır/senkronize edilir.
- **Negatif stok politikası:** Bir `outbound`/`transfer`-kaynak hareketi, işlem-sonrası bakiyeyi negatife düşürecekse `stock_item.negative_stock_policy` okunur: `deny` → hareket reddedilir (`NegativeStockError`); `allow` → hareket kaydedilir ve negatif bakiye görünür kalır; `allow-with-approval` → hareket `pending-approval` durumunda kuyruklanır, insan onayı (`approval_ref`) olmadan uygulanmaz.

## 6. WBS / bağımlılık (dependsOn / related)

Bu yönerge `archetype-inventory` düğümünü kernel/layer0'ın archetype kümesinde açar; `wbs-field-semantics.md`'ye uyar: `dependsOn` = teknik/yürütme sırası (kritik yol, DAG), `related` = yalnız gezinme (karar üretmez). Aşağıdaki tablo düğüm yerleşimini ve bağımlılığını tanımlar.

| Düğüm | Seviye | dependsOn | Küme |
|---|---|---|---|
| `archetype-inventory` | archetype | `atomic-types` (Measure), `k-schema`, `k-tenancy`, `archetype-order-line-item` (talep kaynağı, taslak) | archetype |

`dependsOn` gerekçesi: (1) **Measure atomu** (`atomic-types-directive.md`) — `stock_movement.qty` ve `stock_item.quantity_*` boyut-güvenli ölçü taşımak zorundadır (adet, kg, litre birbirine karışamaz); Measure atomu kilitlenmeden (`ADR-AT1`) bu yönerge kod düzeyinde tipsiz kalır. (2) `k-schema`/`k-tenancy` — her tablo şema temeline ve tenant kolonuna bağlıdır. (3) `archetype-order-line-item` (taslak, `drafts/archetype-order-line-item-directive.md`) — rezervasyonun `demand_ref`'i tipik olarak bir sipariş satırıdır; Order ArcheType kilitlenmeden bu bağ sarkan referans kalır (gap G-A3 ile aynı risk).

**`related` (karar üretmeden gezinme):** `k-worker` (rezervasyon süre-aşımı arka-plan işi, §7), `archetype-tree-relation-directive` (`warehouse.parent_warehouse_id` opsiyonel `tree`), `docs/drafts/archetype-ledger-directive.md` (stok değerinin parasal karşılığı — bu yönerge miktarı, ledger değeri taşır), `k-search` (stok/lot/seri arama-indeksi).

**Archetype-order (`archetype-order-order-produces-inventory` bağı):** MRP ve ecommerce sipariş onayı tipik akışta `reservation` oluşturur, sevk/üretim-tüketimi `stock_movement(type=outbound, reason=sale|production-consume)` üretir. Bu akış — sipariş → rezervasyon → hareket — bu yönergenin **tüketici** tarafıdır; Order ArcheType kendi `dependsOn`'unda `archetype-inventory`'yi listeler (ters yön değil).

**Scale-invariant [inventory]:** Stok hareketi yazımı **idempotent** olmalıdır — aynı kaynak olayının (ör. worker retry, webhook tekrar teslimi) iki kez `stock_movement` satırı üretmesi çift-sayım riskidir. `stock_movement`, `k-worker`'ın `idempotency_key` mekanizmasını (`k-worker-taskqueue-directive.md` §5.1) veya eşdeğer bir `(source_ref, reason, occurred_at)` tekillik kısıtını taşır; bu, scale-invariant ailesinin (çift-tahsilat/çift-stok sınıfı) envanterdeki somut karşılığıdır.

## 7. Multi-tenant + AI guardrail

**Multi-tenant:** Her tablo (`warehouse`, `stock_item`, `lot`, `serial`, `reservation`, `stock_movement`) `tenant_id` taşır ve fail-closed çalışır (bağlam yoksa istek reddedilir, v1 §2.1). Cross-tenant sorgu/hareket girişimi `TenantViolationError` fırlatır ve audit'lenir. İkinci bariyer PostgreSQL RLS: `USING (tenant_id = current_setting('app.current_tenant')::uuid)` her altı tabloda etkindir. Bir tenant'ın deposu başka tenant'ın ürününe hareket üretemez — `stock_movement.stock_item_id` çözümlenirken `stock_item.tenant_id` de doğrulanır (çift kontrol, transfer/join hatasına karşı).

**Rezervasyon süre-aşımı (k-worker bağı):** `reservation.expires_at` dolan kayıtları `released`'e çeviren zamanlanmış iş, `k-worker-taskqueue-directive.md` §2 `sync` türünde tenant-scoped bir `Schedule` olarak koşar (§2.1 fail-closed, §8 tenant-adalet ile aynı zarf); rezervasyon süre-aşımı işini app'in kendi cron'unu açması yasaktır (k-worker anti-pattern'i).

**AI guardrail:** Dört-aktör iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.**

| İşlem | Autonomy | Kural |
|---|---|---|
| Stok düzeltme (`adjustment`) hareketi **önerme** | `draft` | AI, sayım anomalisi/tutarsızlık tespit edip düzeltme hareketi taslağı (`FieldTypeSuggestion`-benzeri) önerir; doğrudan yazamaz |
| Stok düzeltme **uygulama** (`stock_movement type=adjustment` kaydı) | onay-zorunlu | `approval_ref` (insan) olmadan `ApprovalRequiredError`; typed action ile yazılır, generated CRUD ile değil |
| `negative_stock_policy=allow-with-approval` altında outbound hareket | onay-zorunlu | Negatif bakiyeye düşürecek hareket insan onayına düşer; AI tek başına uygulayamaz |
| Rezervasyon oluşturma (sipariş akışından) | otomatik (motor) | Rezervasyon **AI kararı değil** motor kararıdır (sipariş onayının deterministik sonucu); AI yalnız sipariş taslağını önerir, rezervasyonu motor typed-action ile üretir |
| Lot/seri kaydı silme veya `stock_movement` UPDATE/DELETE | `none` | Append-only invariant; AI dahil hiçbir aktör mevcut hareket satırını değiştiremez, yalnız ters-kayıt önerebilir |

Mutlak sınırlar: AI main branch'e push edemez; `warehouse`/`stock_item` şemasını genişletemez (yeni alan = migration = insan onaylı PR); append-only kısıtını (`REVOKE UPDATE/DELETE`) devre dışı bırakamaz; negatif-stok politikasını sessizce `deny`'den `allow`'a çeviremez; kanıtsız "stok senkronize edildi" diyemez.

## 8. Test stratejisi (test-önce, negatif testler dahil)

Test-önce zorunludur (önce kırmızı, sonra yeşil). Aşağıdaki tablo test senaryosunu türüyle eşler; negatif testler bu yönergenin invariant setinin CI kapısıdır.

| # | Senaryo | Tür |
|---|---|---|
| 1 | Negatif stok reddi: `negative_stock_policy=deny` iken bakiyeyi negatife düşürecek `outbound` hareketi `NegativeStockError` ile reddediliyor | Unit (negatif) |
| 2 | Negatif stok politika-onaylı yol: `allow-with-approval` iken hareket `pending-approval`'da kuyruklanıyor, `approval_ref` olmadan uygulanmıyor | Integration |
| 3 | Bakiye türetimi: `stock_item.quantity_on_hand` = `Σ(direction=in) - Σ(direction=out)` eşitliği her hareket sonrası doğrulanıyor | Integration (invariant) |
| 4 | Çift-rezervasyon reddi: aynı `stock_item`'da toplam aktif rezervasyon `quantity_on_hand`'i aşınca yeni rezervasyon `InsufficientStockError` ile reddediliyor | Integration (negatif) |
| 5 | Eşzamanlı rezervasyon yarışı: iki eşzamanlı istek aynı son birimi rezerve etmeye çalışınca yalnız biri başarılı (satır kilidi/`FOR UPDATE` doğrulanıyor) | Integration (concurrency, negatif) |
| 6 | Hareket append-only: `stock_movement` satırına `UPDATE`/`DELETE` denemesi veritabanı düzeyinde reddediliyor (`REVOKE`) | Unit (negatif, DB) |
| 7 | Ters-kayıt (reversal): hatalı bir hareket yeni bir `reversed_movement_id` dolu satırla düzeltiliyor; orijinal satır değişmeden kalıyor | Integration |
| 8 | Transfer bütünlüğü: `type=transfer` iki satır (`out`+`in`, ortak `transfer_pair_id`) atomik yazılıyor; yalnız biri başarısız olursa transaction geri alınıyor | Integration |
| 9 | Lot/seri izlenebilirlik: seri-izlenen üründe `serial_ref` boş hareket reddediliyor; lot-izlenen üründe FEFO sıralaması `expires_at`'e göre doğru | Unit + Integration |
| 10 | Rezervasyon süre-aşımı: `expires_at` geçen `reservation` k-worker zamanlanmış işiyle `released`'e dönüyor, `quantity_available` geri açılıyor | Integration |
| 11 | İdempotent hareket yazımı: aynı `(source_ref, reason, occurred_at)` ile worker-retry iki kez tetiklenince tek `stock_movement` satırı oluşuyor (çift-sayım yok) | Integration (scale-invariant) |
| 12 | Cross-tenant izolasyon: A tenant'ı B tenant'ının deposuna/stok kalemine hareket üretemiyor veya göremiyor (≥10 negatif case) | Integration (negatif) |
| 13 | AI-guardrail: `approval_ref`'siz `adjustment` hareketi ve append-only ihlali reddediliyor | Integration |

## 9. Kabul kriterleri (Acceptance criteria)

- AC-1: `warehouse`/`stock_item`/`lot`/`serial`/`reservation`/`stock_movement` §5 tablolarıyla uyumlu; `qty`/`quantity_*` alanları `Measure` atomu (float/çıplak `number` yok).
- AC-2: `stock_item.quantity_on_hand` hiçbir yolla doğrudan yazılamıyor; yalnız `stock_movement` toplamından türüyor (§8 senaryo 3 kanıtlı).
- AC-3: `stock_movement`'a `UPDATE`/`DELETE` veritabanı düzeyinde imkânsız; düzeltme yalnız `reversed_movement_id` ile ters-kayıt (§8 senaryo 6-7 kanıtlı).
- AC-4: Negatif stok politikası (`deny`/`allow`/`allow-with-approval`) her `stock_item`'da açıkça beyanlı; beyansız alan varsayılan `deny` ile güvenli tarafta (§8 senaryo 1-2).
- AC-5: Çift-rezervasyon ve eşzamanlı rezervasyon yarışı reddediliyor; satır kilidi kanıtlı (§8 senaryo 4-5).
- AC-6: Lot/seri izlenebilirlik zinciri zorunlu FK ile korunuyor; seri-izlenen üründe `serial_ref` atlanamıyor (§8 senaryo 9).
- AC-7: Hareket yazımı idempotent; worker-retry çift-sayım üretmiyor (§8 senaryo 11, scale-invariant uyumu).
- AC-8: Cross-tenant erişim ≥10 negatif case ile reddediliyor (§8 senaryo 12).
- AC-9: AI yalnız düzeltme/onay-gerektiren hareketi `draft` önerir; `approval_ref` olmadan uygulanmıyor (§8 senaryo 13).

## 10. Anti-patterns (yasak desenler)

- **Stoku çıplak sayaç yapmak:** `stock_item.quantity_on_hand`'i doğrudan `UPDATE` ile artırıp/azaltmak — YASAK; her değişiklik bir `stock_movement` satırıdır, bakiye türetilir.
- **Float/çıplak `number` ile miktar:** `qty` alanını `float`/plain `number` tutmak, birim (adet/kg/litre) karışımını önlememek — YASAK; `Measure` atomu zorunlu (`atomic-types-directive.md` §3.6 float-yasağı).
- **Sessiz negatif stok:** `negative_stock_policy` beyan etmeden negatif bakiyeye izin vermek ya da sessizce reddetmek — YASAK; politika açık alan, varsayılan `deny`.
- **Hareket satırını düzeltmek:** Hatalı `stock_movement` satırını `UPDATE`'lemek — YASAK; yalnız `reversed_movement_id` ile yeni ters-kayıt.
- **Rezervasyonsuz "sanal" ayırma:** Uygulama-katmanında bellek içi/geçici bir "bu ürün X'e ayrıldı" notu tutup veritabanına yazmamak — YASAK; her ayırma bir `reservation` satırıdır, çift-satış riskini önler.
- **Lot/seri'yi serbest metin notu yapmak:** Parti/seri numarasını `stock_movement.reason_note`'a yazmak — YASAK; `lot_ref`/`serial_ref` zorunlu FK.
- **Transferi tek satır yapmak:** Bir transferi kaynak-hedef eşleşmesi olmayan tek `stock_movement` satırıyla temsil etmek — YASAK; `type=transfer` her zaman `transfer_pair_id` ile eşleşen iki satır üretir.
- **Worker-retry'de çift hareket:** Aynı kaynak olayının retry'de ikinci kez `stock_movement` yazmasına izin vermek — YASAK; idempotency kısıtı zorunlu (§6 scale-invariant).
- **AI'ın doğrudan düzeltme yazması:** `approval_ref`'siz `adjustment` hareketi — YASAK; `ApprovalRequiredError`.
- **Tenant sınırını join ile aşma:** `stock_movement`→`stock_item` join'inde tenant kontrolünü tek katmana bırakmak — YASAK; her iki tarafta da `tenant_id` doğrulanır.

## 11. DoD (Definition of Done)

- §8'deki 13 test senaryosu yeşil (test-önce kanıtı: kırmızı→yeşil belgeli).
- Append-only invariant (`REVOKE UPDATE, DELETE`), bakiye-türetimi eşitliği ve negatif-stok politikası kanıtlanmış (§8 senaryo 1-3, 6-7).
- Çift-rezervasyon ve eşzamanlı rezervasyon yarışı testleri (satır kilidi) yeşil (§8 senaryo 4-5).
- Alembic migration downgrade CI'da çalışıyor (`alembic downgrade -1`), `ltree` gerektiren `warehouse.parent_warehouse_id` opsiyonel genişleme geriye-uyumlu.
- `core-contract-pack` tenant + audit + RLS uyumu sağlandı; ≥10 cross-tenant negatif case yeşil.
- `Measure` atomu (`atomic-types-directive.md` ADR-AT1) kilitli veya bu yönergenin `qty`/`quantity_*` alanları en azından Measure'ın 13 sözleşme boyutuna referans veren tipli placeholder ile kilitlenmiş (Measure'sız prod-implementasyon yasak).
- MRP/ecommerce/Fleetx tüketici akışlarından en az biri (sipariş → rezervasyon → hareket) uçtan uca kanıtlanmış (Order ArcheType kilitlendiğinde).
- AI-guardrail testi: `draft`-dışı doğrudan düzeltme/append-only ihlali reddediliyor.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar (emoji yok, her başlıkta nedir/yapar/yapmaz, her tablodan önce açıklama, mock veri yok).

## 12. Requirement-ID tablosu

Aşağıdaki tablo, bu yönergenin izlenebilir gereksinimlerini kimlik + katman + öncelik (P0–P3) + test türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| INV-01 | `warehouse`/`stock_item`/`lot`/`serial`/`reservation`/`stock_movement` şeması (§5) | Backend/Data | P0 | Unit | AC-1 | kernel-team |
| INV-02 | `qty`/`quantity_*` alanları `Measure` atomu; float/çıplak `number` yasak | Backend/Data | P0 | Unit | AC-1 | kernel-team |
| INV-03 | Bakiye türetimi: `quantity_on_hand` doğrudan yazılamaz, hareket toplamından türer | Backend | P0 | Integration | AC-2 | kernel-team |
| INV-04 | Append-only: `stock_movement` UPDATE/DELETE veritabanı düzeyinde reddedilir | DB/Security | P0 | Unit(neg) | AC-3 | kernel-team |
| INV-05 | Ters-kayıt (`reversed_movement_id`) düzeltme mekanizması | Backend | P0 | Integration | AC-3 | kernel-team |
| INV-06 | Negatif stok politikası (`deny`/`allow`/`allow-with-approval`) zorunlu beyan | Backend/Data | P0 | Unit | AC-4 | kernel-team |
| INV-07 | Çift-rezervasyon reddi + eşzamanlı yarış kontrolü (satır kilidi) | Backend | P0 | Integration(neg) | AC-5 | kernel-team |
| INV-08 | Lot izlenebilirlik (FEFO sıralaması, `expires_at`) | Backend/Data | P1 | Unit | AC-6 | data-team |
| INV-09 | Seri izlenebilirlik (tekil, zorunlu `serial_ref`) | Backend/Data | P1 | Unit | AC-6 | data-team |
| INV-10 | Transfer bütünlüğü: `transfer_pair_id` eşleşen iki satır atomik | Backend | P1 | Integration | — | kernel-team |
| INV-11 | Hareket yazımı idempotent (scale-invariant, worker-retry çift-sayım yok) | Backend | P0 | Integration | AC-7 | kernel-team |
| INV-12 | Rezervasyon süre-aşımı k-worker zamanlanmış iş ile `released` | Backend | P1 | Integration | — | kernel-team |
| INV-13 | Tenant izolasyonu + RLS ikinci bariyer (≥10 negatif case) | Security | P0 | Integration(neg) | AC-8 | security-team |
| INV-14 | AI düzeltme/onay-gerektiren hareket `draft` + `approval_ref` zorunlu | AI-Governance | P0 | Integration | AC-9 | governance |
| INV-15 | Alembic expand-contract + dolu downgrade | Backend/DevOps | P1 | CI | — | kernel-team |
| INV-16 | `archetype-inventory` WBS düğümü doğru `dependsOn` (Measure, k-schema, k-tenancy) | Governance/WBS | P1 | CI(data-quality) | — | pmo |

---

*Kaynak yönerge: `gap-2026-07-02-02-archetype.md` §4 G-A4. Kardeş sözleşmeler: `archetype-eav-directive.md` (dinamik öznitelik — bu yönerge miktarı taşır, özniteliği taşımaz), `archetype-tree-relation-directive.md` (`warehouse` alt-lokasyon hiyerarşisi için opsiyonel `tree` deseni), `docs/drafts/archetype-order-line-item-directive.md` (taslak; talep kaynağı), `docs/drafts/archetype-ledger-directive.md` (taslak; parasal değer). Bağlı primitifler: `atomic-types-directive.md` (Measure atomu, ADR-AT1), `k-worker-taskqueue-directive.md` (rezervasyon süre-aşımı zamanlanmış iş). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz; yalnız yönerge metnidir. Çelişki halinde `core-contract-pack.md` (kernel runtime) önceliklidir. Sözleşmeyi değiştirme yetkisi yalnız insan onayındadır; AI bu dosyayı doğrudan güncelleyemez.*
