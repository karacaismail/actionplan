# ArcheType Listing Yönergesi — İlan (Classified Listing) Metamodeli

**Sürüm:** 0.2 · **Tarih:** 2026-07-12 · **Durum:** AI-DRAFT (insan onayı bekler)
**KONUM (v0.2 düzeltmesi):** Bu archetype **arsam-marketplace** ürününe (Ada #2, ayrı backlog) aittir; **EVM'in P0 çekirdeği DEĞİLDİR.** EVM bu domain'i tanımaz — yalnız marketplace'in yayınladığı olayları (member.activated, sale.completed, doping.purchased) managed-system verisi olarak tüketir (`drafts/adr-product-boundary.md`). Marketplace'i olmayan EVM tenant'ları aynı veriyi connector/import ile sağlar.
**Kapatır:** `kapsama-matrisi-arsam-panel-2026-07-12.md` marketplace backlog satırı (#1 ilan yönetimi)
**Probe bağı:** `docs/reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md` §3.1 (Listing Graph), §5.2 (consumer modülleri)
**Compose ettiği mevcut yönergeler:** `archetype-taxonomy-directive` (kategori ağacı), `archetype-eav-directive` + `archetype-variant-attribute-family-directive` (dinamik öznitelik), `archetype-messaging-thread-directive` (ilan-bağlamlı mesaj), `workflow-directive` (moderasyon), `adr-geo-visualization` (konum/parsel), `k-storage-dam-directive` (medya), `k-search-directive` (arama/faset).

---

## 1. Amaç

İlanı "başlık+fiyat+açıklama" düz kaydından çıkarıp; kategoriye göre dinamik öznitelik taşıyan, durum makinesiyle yaşayan, fiyat geçmişi biriktiren, moderasyondan geçen, haritada parseliyle görünen, aranabilen ve doping (öne çıkarma) geliri üreten **işletilebilir bir veri varlığına** çevirmek. Bu archetype yeni altyapı icat etmez; yedi mevcut yönergeyi tek domain kökü altında compose eder.

## 2. Kapsam

Listing kökü + PriceRecord (geçmiş) + DopingOrder (durum) + ModerationCase bağı + arama/faset sözleşmesi + yayın penceresi ECA'ları. Gayrimenkul dikeyi ilk tüketicidir; metamodel dikey-bağımsızdır (kategori ağacı + öznitelik seti tenant-verisidir).

### Non-goals (kapsam dışı)

- Ödeme tahsilatı ve PSP akışı (doping *siparişinin para tarafı* `archetype-order-line-item` + provider port'una devreder; burada yalnız doping durumu yaşar).
- Emlak ofisi CRM'i, portföy yönetimi, müşteri takibi.
- ML tabanlı öneri/sıralama motoru (v1 sıralaması kurallıdır: filtre + tarih + doping boost).
- Tapu/imar resmî veri entegrasyonu.
- Kategori ağacının ve öznitelik setlerinin *içeriği* (tenant-verisi; şema değil).

## 3. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** İlan yaşam döngüsünün domain metamodeli; kök varlık `listing`, alt kayıtları `price_record`, `doping_order`, bağları taxonomy/EAV/messaging/workflow/geo/storage.

**Ne yapar:** Durum makinesini zorlar (geçersiz geçiş reddedilir); fiyat değişimini append-only geçmişe yazar; kategori seçiminden öznitelik formunu türetir (variant-family şablonu); moderasyon kararını workflow'a devreder ve sonucunu duruma yansıtır; yayın penceresi dolunca pasifleştirir (ECA); `listing.published`, `listing.price_changed`, `doping.purchased` olaylarını outbox'tan yayınlar; arama indeksine faset sözleşmesiyle beslenir.

**Ne yapmaz:** Para tahsil etmez; moderasyon kararını kendisi vermez (insan moderatör verir); öznitelik doğrulamasını kendi icat etmez (atomik tip kataloğu + EAV yönergesi doğrular); sıralama skorunu gizli tutmaz (boost kuralı deklaratif ve denetlenebilirdir).

## 4. Sözleşme şekli (alan | tip | amaç)

### 4.1 `listing` — kök

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik + RLS izolasyonu |
| `title` | `I18nText` | Başlık; arama ağırlıklı alan |
| `category_ref` | `EntityRef` → taxonomy düğümü | Öznitelik setini + fasetleri belirler |
| `status` | `EnumType` | §4.2 durum makinesi |
| `attribute_values` | EAV (JSONB+GIN) | Kategoriye göre dinamik alanlar; her değer atomik tiple doğrulanır; sık sorgulanan öznitelik fiziksel kolona terfi eşiğine tabidir (`archetype-eav §terfi`) |
| `price` | `Money` | Güncel fiyat; kur ayrık; float yasak |
| `location` | `GeoPoint` | Pin; parsel poligonu ayrı geo kaydında (`adr-geo-visualization`) |
| `media` | `AssetRef[]` | Görsel/video; binary `k-storage`'da; sıralama + kapak işareti |
| `owner_ref` | `PartyRef` | İlan sahibi; ReBAC "kendi ilanı" kapsamının öznesi |
| `published_range` | `DateRange` | Yayın penceresi; bitişte E8 pasifleştirme |
| `doping_state` | `EnumType` + `DateRange` | Aktif doping türü/penceresi (denormalize görünüm; kaynak `doping_order`) |
| `moderation_case_ref` | `EntityRef` → workflow case | Moderasyon bağı |
| `search_boost` | türetilmiş (`k-computation`) | Deklaratif boost: doping türü × ağırlık tablosu; ham skor saklanmaz, kuraldan türetilir |
| `created_at`, `updated_at` | `timestamptz` | Audit |

### 4.2 Durum makinesi

`draft → in_moderation → published → passive → archived` ana hattı; `in_moderation → rejected (→ draft'a düzeltme)` ve `published → expired (→ passive)` yan yolları. Kurallar: (1) `published`'a geçiş YALNIZ moderasyon onayıyla (insan kararı; workflow-directive); (2) `archived` terminal — geri dönüş yeni ilan; (3) her geçiş audit + olay üretir; (4) geçiş yetkisi PDP'de (`listing_owner` kendi ilanını `draft→in_moderation` itebilir, `published→passive` çekebilir; `moderator` onay/red verir; kimse `draft→published` atlayamaz — negatif test zorunlu).

### 4.3 `price_record` — fiyat geçmişi (append-only)

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id`, `listing_ref` | `uuid`, `EntityRef` | Bağ |
| `price` | `Money` | O andaki fiyat |
| `recorded_at` | `timestamptz` | Değişim anı |
| `source` | `EnumType` (owner_update / correction) | Kaynak; correction bile eski kaydı SİLMEZ |

Değişmez: `listing.price` güncellenirken aynı transaksiyonda `price_record` append edilir; UPDATE/DELETE fiziksel olarak yok (RLS + trigger bariyeri). "Fiyat düştü" rozeti ve m²-fiyat analitiği bu tablodan türetilir.

### 4.4 `doping_order` — öne çıkarma kaydı

| Alan | Tip | Amaç |
|---|---|---|
| `id`, `tenant_id`, `listing_ref`, `buyer_ref` | `uuid`, `EntityRef`, `PartyRef` | Bağ |
| `doping_kind` | `EnumType` (öne-çıkar / vitrin / acil rozeti / üst-sıra) | Tür; ağırlık tablosunun anahtarı |
| `active_range` | `DateRange` | Doping penceresi; bitişte boost düşer (ECA) |
| `order_ref` | `EntityRef` → order-line-item | Paranın yaşadığı yer (non-goal sınırı) |
| `status` | `EnumType` (pending_payment / active / expired / refunded) | Ödeme onayı gelmeden boost AKTİFLEŞMEZ |

### 4.5 Arama / faset sözleşmesi

Kategori düğümü hangi özniteliklerin faset (filtrelenebilir), hangilerinin sıralanabilir olduğunu bildirir (`facetable[]`, `sortable[]` — variant-family şablonunda). `k-search` indeks beslemesi: title (ağırlıklı), kategori yolu, faset öznitelikler, fiyat (kur-ayrık aralık), konum (geo-index), doping boost. Sıralama: `relevance × recency × search_boost` — formül deklaratif, denetlenebilir; boost asla filtre sonuçlarına sonuç EKLEMEZ, yalnız sıralar (negatif test: dopingli ama filtreye uymayan ilan görünmez).

## 5. WBS / bağımlılık

Seviye: `archetype` (kaya). Bağımlılık yönü yalnız aşağı/ortak: taxonomy, EAV, variant-family, messaging-thread, workflow, geo ADR, k-storage, k-search, k-bus (outbox), k-policy-pdp. `dependsOn` pending: atom şema terfisi (Money/DateRange/GeoPoint/EnumType — Görev #16), `k-computation` (boost türetimi). Tüketici app: arsam-marketplace; EVM yalnız OLAY tüketir (`app-distribution-contract` — modül import yok).

## 6. Multi-tenant + AI guardrail

Tenant: her tabloda `tenant_id` + RLS; komşu-tenant ilan listeleme/okuma/arama sonucu 0 satır (negatif test zorunlu). PII: owner iletişimi listing'e KOPYALANMAZ (`PartyRef` çözümü + maskeleme); mesajlaşma tarafında telefon/e-posta maskesi messaging-thread yönergesine tabidir.

AI sınırı: AI ilan açıklaması taslağı, öznitelik çıkarım önerisi (fotoğraftan/metinden) ve moderasyon ÖN-sınıflandırması üretebilir — hepsi `draft` + güven skoru; yayın kararı insan moderatörde kalır. AI fiyat DEĞİŞTİREMEZ, ilan YAYINLAYAMAZ, doping AKTİFLEŞTİREMEZ, moderasyon kararı VEREMEZ. `forbiddenTargets` varsayılanı geçerli; ECA zincir derinliği ≤ 6.

## 7. Test stratejisi (test-önce, negatif testler dahil)

Sıra: önce test planı, sonra db-schema, sonra development (`task-to-code-contract`).

- **Durum makinesi:** izinli tüm geçişler + yasak geçişlerin tamamı (`draft→published` doğrudan = hata); geçiş×rol matrisi (owner/moderator/anonim) PDP testleriyle.
- **Fiyat geçmişi:** fiyat güncelle → aynı tx'te price_record append; record UPDATE/DELETE girişimi reddedilir; 3 değişiklik sonrası geçmiş sıralı ve eksiksiz.
- **EAV doğrulama:** kategoriye tanımlı olmayan öznitelik reddedilir; yanlış atomik tip (m² alanına metin) reddedilir; terfi eşiği senaryosu.
- **Arama:** faset filtre + kur-ayrık fiyat aralığı; **negatif:** dopingli-ama-filtre-dışı ilan sonuçta yok; komşu-tenant ilanı sonuçta yok (0 satır).
- **Doping:** `pending_payment`'ta boost yok; `active_range` bitince boost düşer (ECA e2e); refund'da boost geri alınır.
- **Moderasyon:** submit → kuyruk → onay/red → durum + olay; SLA sayacı.
- **Olaylar:** `listing.published` / `price_changed` / `doping.purchased` outbox'a idempotency anahtarıyla düşer; tekrar teslimde çift kayıt yok.
- **Journey (e2e):** ilan ver → modere et → yayınla → fiyat düşür → mesaj al → doping satın al → pencere dolunca pasifleş.

## 8. Kabul kriterleri + Anti-patterns + DoD

### Acceptance criteria

1. İlan, kategori seçimiyle doğru öznitelik formunu alır; atomik tip ihlali kayıt öncesi reddedilir.
2. Durum makinesi dışı hiçbir geçiş mümkün değildir; `published` yalnız insan moderatör onayıyla.
3. Fiyat her değişimde geçmişe append olur; geçmiş değiştirilemez.
4. Doping yalnız ödeme onayı sonrası boost üretir; boost filtre sonucuna ilan eklemez.
5. Komşu tenant hiçbir yüzeyden (liste/detay/arama/harita) ilan göremez.
6. Üç olay outbox'tan idempotent yayınlanır; EVM tüketimi şemayı bozmadan okur.

### Anti-patterns (yasak desenler)

- Fiyatı `listing` üzerinde overwrite edip geçmişi log dosyasına bırakmak.
- Öznitelikleri kategori başına ayrı tablo/kolon olarak elle açmak (EAV+terfi disiplini yerine).
- Doping boost'unu arama sonucuna satır enjekte eden gizli kural yapmak.
- Moderasyonu `status` alanına düz UPDATE ile geçmek (workflow case atlanır).
- Owner iletişim bilgisini ilana denormalize kopyalamak.
- Company-os'un listing tablosuna doğrudan SQL/import erişimi (yalnız olay).

### DoD (Definition of Done)

17 boyut kartı dolu (UI'sız alt kayıtlarda `wcag`/`mobileApps` gerekçeli N/A); `ecaRules[]` yapısal (E7/E8 + doping bitişi); standardRefs bağlı (dataApiContractRef, tenancyRef, authzRef, testingStandardRef); §7 testleri kırmızı→yeşil kanıtlı; probe §5.2 kabul kriterleriyle eşleşme; `ready-for-dev-gate` 10/10.

## 9. Not — scale-invariant ilişkisi

İlk gün 1k ilanla da 1M ilanla da aynı sözleşme geçerlidir (`scale-invariant-directive`): EAV→fiziksel terfi eşiği, keyset pagination, geo-index ve projeksiyonlar hacim `VERİ BEKLİYOR` (probe §4 D9) değerleriyle kalibre edilir; sözleşme değişmez, fizik ayarı değişir.
