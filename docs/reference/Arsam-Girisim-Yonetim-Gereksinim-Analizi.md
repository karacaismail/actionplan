# **Enterprise Venture Management (EVM) + Arsam Marketplace — Gereksinim Analizi ve Özellik Seti (Probe)**

**Amaç:** Üç katman + iki ürünü faz faz gereksinim analizi, domain modeli, özellik seti ve veri sözlüğüyle tanımlamak. Katmanlar: **Metaframer** (ürün üreten meta-framework) → **EVM / enterprise-venture-management** (satılabilir, generic girişim yönetim SaaS'ı; Ada #1; bu belgelerde EVM = Enterprise Venture Management, earned-value-management ile karıştırılmamalı) → **Arsam Venture** (EVM'in ilk tenant'ı: workspace + venture kaydı + örnek konfigürasyon — app DEĞİL, tenant verisi). İkinci ürün: **arsam-marketplace** — gayrimenkul dikeyinde sahibinden.com rakibi ilan platformu (Ada #2); Arsam Venture'ın operasyon sistemi olarak EVM'e managed-system verisi sağlar. Ana tez: **hangi kaynaktan gelirse gelsin (manuel giriş, import, API, olay) işletme verisi decision-grade doğruluk zincirinden geçer ve otomatik rapora dönüşür.** EVM hiçbir modülünde Arsam'a özgü varsayım taşımaz; Arsam'a özgü her şey tenant konfigürasyonudur.

**Hazırlanma tarihi:** 2026-07-12 · **Revizyon:** v1.1 aynı gün — dış inceleme sonrası ürün sınırı düzeltildi (eski `arsam-company-os` adlandırması ürünü ilk müşteriye bağlıyordu; `drafts/adr-product-boundary.md`), karar-verisi doğruluk zinciri ve girişim omurgası eklendi. · **Durum:** AI-DRAFT (insan onayı bekler). Referans / gereksinim analizi — planlama dokümanı, implementasyon kodu değil.
**Kaynak:** Kullanıcı (CPO) ürün tarifi + CPO kararları (2026-07-12: marketplace birlikte-tek-kapsam; ürün adı enterprise-venture-management; U1 rotasyonlu refresh) + `kapsama-matrisi-arsam-panel-2026-07-12.md` + dış inceleme raporu · çekirdek sözleşmeler: `drafts/adr-product-boundary.md`, `archetype-venture-core-directive.md`, `decision-grade-data-contract.md`, `financial-state-model-contract.md` · emsal yöntem: `Agreement-CLM-Gereksinim-Analizi.md`.
**Konum:** Bu doküman, kernel/archetype/surface yönergelerinin **karşılaması gereken hedef ürünü** tanımlar. Yönergeler "her primitif ne yapmalı" sorusunu; bu doküman "ürün bir bütün olarak ne olmalı ve hangi primitife düşer" sorusunu yanıtlar. Çelişkide kernel runtime sözleşmesi (`core-contract-pack.md`) önceliklidir.
**Veri doldurma kuralı:** Bu belge **yapı ve mantık** aktarır; gerçek parametre değerleri (maaş rakamı, bütçe tutarı, hedef sayı) içermez. Değer gerektiren hücreler `VERİ BEKLİYOR`, insan kararı gerektiren hücreler `KARAR BEKLİYOR` etiketi taşır. Bu etiketler kapatılmadan ilgili düğüm `ready-for-dev-gate`'ten geçemez.

---

## **İçindekiler**

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [Konumlandırma: Üç Katman, İki Ada, Tek Kernel](#2-konumlandırma-üç-katman-iki-ada-tek-kernel)
3. [Domain Modeli — İki Grafik](#3-domain-modeli--iki-grafik)
4. [Fonksiyonel Olmayan Gereksinimler (NFR) + Hacim Varsayımları (D9)](#4-fonksiyonel-olmayan-gereksinimler-nfr--hacim-varsayımları-d9)
5. [Modül Matrisi (D1)](#5-modül-matrisi-d1)
6. [Aktör / Rol Envanteri + Yetki Matrisi (D3)](#6-aktör--rol-envanteri--yetki-matrisi-d3)
7. [Finansal Parametre Setleri (D4)](#7-finansal-parametre-setleri-d4)
8. [KPI / Metrik Sözlüğü (D5)](#8-kpi--metrik-sözlüğü-d5)
9. [ECA Kural Listesi (D6)](#9-eca-kural-listesi-d6)
10. [Rapor / Yayın Envanteri (D7)](#10-rapor--yayın-envanteri-d7)
11. [Oturum ve Güvenlik Politikası (D8, U1 kararı)](#11-oturum-ve-güvenlik-politikası-d8-u1-kararı)
12. [Ekip Topolojisi Kuralları (D10)](#12-ekip-topolojisi-kuralları-d10)
13. [Geliştirme Fazları](#13-geliştirme-fazları)
14. [Kernel / Archetype / Surface Eşlemesi](#14-kernel--archetype--surface-eşlemesi)
15. [Risk ve Bağımlılıklar](#15-risk-ve-bağımlılıklar)
16. [Kapsam Dışı / Sonraki Sürüm](#16-kapsam-dışı--sonraki-sürüm)

---

## **1. Yönetici Özeti**

Hedef, tek bir yatırım hikâyesi altında iki ayrı üründür; asıl satılabilir ürün EVM'dir, marketplace onun ilk gerçek veri kaynağıdır.

**EVM (enterprise-venture-management)**, girişimleri yöneten data-yoğun admin paneldir ve asıl satılabilir üründür. Solopreneur not defteri değil; 50.000.000 ₺ yatırımlı bir girişimin (ve başka tenant'ların başka girişimlerinin) yönetim işletim sistemidir. Omurgası `archetype-venture-core`'dur: her mali/örgütsel kayıt bir venture + reporting_period koordinatında yaşar; her rakam `decision-grade-data-contract` zincirinden (kaynak→doğrulama→onay→mutabakat→dönem kilidi→hesap→KPI→rapor→snapshot) geçer; her mali görünüm altı finansal gerçekten (planned/forecast/committed/accrued/actual/cash — `financial-state-model-contract`) hangisini gösterdiğini etiketler.

**arsam-marketplace**, gayrimenkul dikeyinde ilan yaşam döngüsünü yöneten tüketici platformudur: ilan verme, kategori + kategoriye göre değişen dinamik öznitelik seti, arama/filtre, harita (parsel/konum), alıcı-satıcı mesajlaşması, üyelik, moderasyon ve doping (öne çıkarma) gelir modeli. 5 yıllık vizyon, sahibinden.com ve rakiplerini bu dikeyde derinlikle geçmektir: genel-amaçlı yatay platformun gayrimenkulde veremediği veri zenginliğini (parsel poligonu, m²-fiyat analitiği, fiyat geçmişi) vermek. EVM'e bakan yüzü bir **managed system** rolüdür: `member.activated`, `sale.completed` gibi olayları yayınlar; EVM bu olayları (veya marketplace'i olmayan tenant'larda manuel/import/API eşdeğerini) atribüsyon hattında tüketir.

EVM'in işlevsel kapsamı: departman bazlı HRMS (meslek grubu × maaş parametresi, işveren maliyeti, kıdem/izin karşılıklarının mali tabloya inişi), bütçe planlama (opex/capex, plan-vs-actual), pazarlama bütçesi ve getiri atribüsyonu (kanal → harcama → edinilen üye → satış; CAC/ROAS), SaaS/tedarikçi gider takibi (kişi başına artan giderler dahil), ön-muhasebe (satınalma, alış-satış, reklam harcaması kayıtları), medya/dosya yöneticisi, Scrum odaklı ekip yönetimi (büyüyünce SAFe), yönetsel CPO kanban'ı (ekipten izole), CMS ile yönetim kurulu raporlarının public URL'de yayını ve zamanlanmış otomatik raporlar.

Ürünün ayırt edici dört ekseni: **Birincisi, karar-verisi güvenilirlik ekseni:** bu ürün dashboard değil, karar verisi ürünüdür — her rakam kaynağı (kim girdi, hangi belgeyle), onaylayanı, formül sürümü, mutabakat durumu ve güven düzeyiyle birlikte yaşar; en tehlikeli hata modu "doğru görünen yanlış rakam"dır (yanlış runway, yanlış CAC, yanlış karşılık) ve `decision-grade-data-contract` bu yüzden ürünün çekirdeğidir. **İkincisi, veri-rapor ekseni:** kullanıcı harcamayı/istihdamı/kampanyayı bir kez girer; sistem CAC, toplam işveren maliyeti, bütçe sapması ve kurul raporunu formülden türetir — rapor elle yazılmaz, üretilir. **Üçüncüsü, şeffaflık ekseni:** CEO↔CPO ve CPO↔ekip arasındaki süreç görünürlüğü Scrum'ın şeffaflık ilkesiyle hizalıdır; yönetsel gizli board bunun istisnası değil, ayrı bir yetki kapsamıdır (ReBAC scope — ilişkiye dayalı yetki). **Dördüncüsü, çok-girişim ekseni:** kanal taksonomisi, maaş parametresi, SaaS envanteri tenant-başına tanımlanır; Arsam yalnız ilk tenant'tır ve bir tenant birden çok venture yönetebilir (`archetype-venture-core`).

Aktör-açık ifadeyle: **CPO (kullanıcı)** hedef ve parametre tanımlar, yönetsel board'unu işletir; **CEO/kurul** raporları okur ve onaylar; **ekip üyeleri** kendi takım board'larında çalışır; **sistem** girilen veriden metrikleri türetir, eşik aşımında uyarır, zamanlanmış raporu üretir; **AI** yalnız taslak/öneri üretir (rapor taslağı, bütçe sapma özeti, takım bölünme önerisi) — insan onayı olmadan hiçbir mali kayıt, yetki veya yayın değişmez.

---

## **2. Konumlandırma: Üç Katman, İki Ada, Tek Kernel**

Bu bölüm ürün sınırını sabitler (`drafts/adr-product-boundary.md` — insan onayı bekleyen U4 kararı). Önce katman modeli:

| Katman | Rol |
|---|---|
| **Metaframer** | Ürün üretme meta-framework'ü (kernel + archetype + surface + 17 boyut) — ürün değil, üretim çerçevesi |
| **EVM (enterprise-venture-management)** | Satılabilir, generic girişim yönetim SaaS'ı — Ada #1, asıl ürün |
| **Arsam Venture** | EVM'in ilk tenant'ı: workspace + venture kaydı + örnek konfigürasyon + probe verisi — app DEĞİL |

İkinci ürün arsam-marketplace ayrı bir Ada'dır (#2) ve Arsam Venture'ın operasyon sistemidir. `app-distribution-contract.md` gereği iki app birbirinin modülünü import etmez; marketplace EVM'e **managed system** olarak veri sağlar: aynı Metaframer altyapısında oldukları için birinci-sınıf yol olay veriyoludur (event bus — uygulamalar arası olay taşıyan kanal), ama EVM'in veri alım sözleşmesi kaynak-bağımsızdır (connector/import/API/webhook) — marketplace'i olmayan bir tenant da aynı sözleşmeyle kendi dış sistemlerini bağlar.

| Eksen | arsam-marketplace (Ada #2) | EVM (Ada #1 — asıl ürün) |
|---|---|---|
| Birincil kullanıcı | İlan veren / arayan tüketici, moderatör | CPO, CEO/kurul, departmanlar, ekip üyeleri |
| Değer vaadi | Gayrimenkul dikeyinde en derin ilan deneyimi | Girilen işletme verisinden otomatik yönetim raporu |
| Ticari model | Doping/paket satışı (ilan geliri) | Satılabilir SaaS (tenant-başına abonelik) |
| Veri yönü | Olay ÜRETİR: `member.activated`, `listing.published`, `doping.purchased`, `sale.completed` | Olay TÜKETİR: bu olaylardan CAC/gelir metriği türetir; kendi verisini (bütçe, istihdam, harcama) manuel girişle alır |
| UI karakteri | Tüketici yüzü (arama, kart, harita) | Data-sense admin panel (yoğun tablo, dashboard, board) |
| Bağ | — | consumer'a bağımlılığı yok; herhangi bir girişimin olay/manuel verisiyle çalışır |

Kritik konumlandırma cümlesi: **EVM, Arsam'ın paneli değil; Arsam'ın da (bir tenant olarak) yönetildiği üründür — Arsam'a özgü hiçbir kavram EVM şemasına giremez, tenant konfigürasyonunda yaşar.** "10.000 USD dijital pazarlama bütçesine karşılık kaç aktif üye geldi?" sorusu, consumer'ın yayınladığı `member.activated` olayının kampanya atribüsyonuyla eşlenmesinden cevaplanır; ama aynı soru, olay yayınlamayan bir girişimde manuel dönüşüm girişiyle de cevaplanabilir. Bu ikilik (olay-beslemeli VEYA manuel-girişli) EVM'in satılabilirlik şartıdır.

Rakip karşılığı: EVM'in birleşik kapsamı tek üründe yaygın değildir — FP&A araçları (Cube, Causal), HRMS'ler (BambooHR), harcama yönetimi (Ramp), agile araçları (Jira/Linear) ve CMS'ler ayrı ayrı vardır. Ayrışma: bu düzlemlerin **tek veri modelinde** birleşmesi (istihdam planı → bütçe satırı → mali tablo karşılığı → kurul raporu tek zincir), karar-verisi güvence zinciri (lineage + mutabakat + dönem kilidi + snapshot — rakiplerin çoğunda yok) ve ilan platformu olaylarıyla kapalı-döngü pazarlama atribüsyonu.

### **2.1 Tasarım çıpası: beş yönetsel yolculuk**

Modül ve yüzey kararları şu beş yolculukla doğrulanır; bir modül bu yolculuklardan en az birine hizmet etmiyorsa kapsam sorgulanır. Her yolculuk FAZ kabul testlerinin de omurgasıdır.

1. **CEO sabahı:** CEO panele girer → venture özet görünümü: runway (cash'ten), bütçe sapması (actual+accrued vs planned), aktif üye/CAC trendi, bekleyen onayları (capex, yayın) — her rakamın yanında tazelik + güven göstergesi; şüpheli rakama tıklayınca lineage (kaynak kayıtlara iniş).
2. **CPO karar anı:** CPO yönetsel board'unu açar → kart bir karara bağlanır (`decision` kaydı: seçenekler+gerekçe) → etki simülasyonu (bütçe/ekip) → step-up onay → karar kaydı kalıcı.
3. **Finans ay kapanışı:** finance_lead kapanış sihirbazını çalıştırır → sıra: bekleyen purchase→fiş onayları → accrual fişleri (kıdem/izin) → mutabakatlar (banka↔ledger, bütçe↔ledger) → `unreconciled` kalemler çözülür/gerekçelenir → dönem kilitlenir → kurul raporu taslağı otomatik üretilir.
4. **İK parametre güncellemesi:** hr_lead yeni maaş parametresi girer (yeni as-of penceresi) → sistem ileri dönem maliyet projeksiyonunu günceller, geçmişe DOKUNMAZ → değişiklik maker-checker onayıyla yürürlüğe girer.
5. **Kurul raporu dondurma:** CPO taslağı düzenler → maskeleme taraması → CEO step-up onayı → `management_snapshot` (hash'li, sürümlü) → public URL → sonraki veri düzeltmeleri eski raporu DEĞİŞTİRMEZ (restatement yeni sürüm açar).

### **2.2 Ürünleştirme gereksinimleri (satılabilirlik şartları — P1 contract)**

EVM'in "satılabilir" sıfatı şu yeteneklerin sözleşmesini gerektirir (ayrıntı: `productization-contract` P1): tenant onboarding (self-service kurulum + örnek veri), **tenant template / sektör paketi** (Arsam konfigürasyonu "marketplace-girişimi paketi" olarak şablonlaşır), customization sınırları (taksonomi/parametre/rol tenant-özgü; şema değil), entitlement (plan-bazlı modül açma/kapama), billing (koltuk/modül bazlı abonelik), import/export + **tenant portability** (verinle gel, verinle git), sürümleme (tenant'lar farklı hızda upgrade).

---

## **3. Domain Modeli — İki Grafik**

### **3.1 Listing Graph (arsam-marketplace çekirdeği)**

Domain çekirdeği, ilanı "başlık+fiyat+açıklama" düz kaydından çıkarıp işletilebilir grafiğe çeviren `archetype-listing`'dir (yeni yönerge — bkz. `archetype-listing-directive.md`). Kök düğüm Listing'dir; kategori ağacı `archetype-taxonomy`, kategoriye göre değişen öznitelik seti `archetype-eav` + `archetype-variant-attribute-family`, mesajlaşma `archetype-messaging-thread`, moderasyon `workflow-directive`, konum/parsel `adr-geo-visualization` üzerine oturur.

```
                       ┌──────────────┐
                       │   Tenant     │
                       └──────┬───────┘
                              ▼
                     ┌─────────────────┐
        ┌────────────│     Listing     │────────────┐
        │            │ (kök; durum     │            │
        │            │  makinesi)      │            │
        ▼            └───┬────┬────┬───┘            ▼
  ┌──────────┐           │    │    │          ┌──────────┐
  │ Category │◄──────────┘    │    └─────────►│  Owner   │
  │ (taxonomy│                │               │ (k-party/│
  │  ağacı)  │                ▼               │  member) │
  └────┬─────┘        ┌──────────────┐        └──────────┘
       │              │ PriceRecord  │
       ▼              │ (geçmişli)   │
  ┌──────────┐        └──────────────┘
  │Attribute │   ┌───────────┐  ┌─────────┐  ┌────────────┐
  │Set (EAV+ │   │ Media     │  │ GeoUnit │  │ Moderation │
  │ variant- │   │ (k-storage│  │ (konum+ │  │ Case       │
  │ family)  │   │  AssetRef)│  │ parsel) │  │ (workflow) │
  └──────────┘   └───────────┘  └─────────┘  └────────────┘
       ┌────────────┐  ┌──────────┐  ┌──────────────┐
       │ MessageThread│ │ Favorite │  │ DopingOrder  │
       │ (messaging- │  │ (üye↔ilan│  │ (öne çıkarma;│
       │  thread)    │  │  bağı)   │  │  gelir olayı)│
       └────────────┘  └──────────┘  └──────────────┘
```

Aşağıdaki tablo Listing kök düğümünün alanlarını, taşıyıcı atomik tipini ve motorun ondan ne türettiğini tanımlar (alan→tip→amaç; örnek değer verilmez).

| Alan | Atomik tip | Amaç (motor türetimi) |
|---|---|---|
| `id`, `tenant_id` | `uuid` | Kimlik + kiracı izolasyonu (RLS) |
| `title` | `I18nText` | Çok-dilli ilan başlığı |
| `category_ref` | `EntityRef` → taxonomy düğümü | Kategori bağı; öznitelik setini ve arama fasetlerini belirler |
| `status` | `EnumType` | Durum makinesi: draft→in_moderation→published→passive→expired→archived (+rejected) |
| `attribute_values` | EAV (JSONB+GIN; tip başına atomik doğrulama) | Kategoriye göre dinamik öznitelik (oda sayısı, m², imar durumu…) |
| `price` | `Money` | Güncel fiyat; float yasağı; kur ayrımı |
| `price_history` | `PriceRecord[]` (Money + timestamptz, append-only) | Fiyat geçmişi; "fiyat düştü" rozeti + pazar analitiği |
| `location` | `GeoPoint` (+ parsel poligon `AssetRef`/geo kolonu) | Harita pin + parsel çizimi + hexbin/choropleth analitiği |
| `media` | `AssetRef[]` | Görsel/video; binary `k-storage`'da, DB'de referans+checksum |
| `owner_ref` | `PartyRef` | İlan sahibi (üye); ReBAC "kendi ilanını yönetir" kapsamının öznesi |
| `doping_state` | `EnumType` + `DateRange` | Aktif doping türü ve penceresi; sıralama boost girdisi |
| `published_range` | `DateRange` | Yayın penceresi; otomatik pasifleşme (`eca`) |
| `moderation_case_ref` | `EntityRef` → workflow | Moderasyon durumu; insan onayı zorunlu geçişler |
| `created_at`, `updated_at` | `timestamptz` | Audit |

### **3.2 EVM Graph (girişim yönetimi çekirdeği)**

Company-os'un çekirdeği tek archetype değil, üç yeni archetype ailesi + mevcut ledger'dır: **org-employment** (kim, hangi pozisyonda, hangi maliyetle), **budget-plan** (ne planlandı, ne gerçekleşti), **campaign-attribution** (hangi kanala ne harcandı, ne döndü). Ledger (`archetype-ledger`, VAR) gerçekleşen mali hareketin tek doğruluk kaynağıdır; karşılıklar (kıdem/izin) oraya aylık tahakkuk (accrual — henüz ödenmemiş ama doğmuş borcun dönemine kaydı) fişi olarak iner.

```
 ┌────────────┐   ┌────────────┐   ┌─────────────────┐
 │ Department │──►│  Position  │──►│ Employment      │
 │ (org ağacı)│   │ (meslek    │   │ (kişi×pozisyon× │
 └────────────┘   │  grubu)    │   │  DateRange)     │
                  └─────┬──────┘   └───────┬─────────┘
                        │                  │  aylık maliyet hesabı
                        ▼                  ▼  (k-computation)
                  ┌──────────────┐   ┌──────────────────┐
                  │ SalaryParam  │   │ EmployerCostCalc │──► Ledger accrual
                  │ (as-of       │   │ (SGK+kıdem 1/12+ │    (journal_entry)
                  │  versiyonlu) │   │  izin karşılığı) │
                  └──────────────┘   └──────────────────┘
 ┌────────────┐   ┌────────────┐   ┌──────────────┐
 │ BudgetPlan │──►│ BudgetLine │◄──│ Actuals feed │◄── Ledger + PurchaseRecord
 │ (dönem+    │   │ (opex/capex│   │ (plan-vs-    │
 │  sürüm)    │   │  ×kategori)│   │  actual)     │
 └────────────┘   └────────────┘   └──────────────┘
 ┌────────────┐   ┌────────────┐   ┌──────────────┐   ┌─────────────┐
 │ Channel    │──►│ Campaign   │──►│ SpendEntry   │──►│ Attribution │◄── consumer
 │ (taksonomi:│   │ (kanal×    │   │ (harcama     │   │ (üye/satış  │    olayları
 │ dijital/   │   │  dönem)    │   │  kaydı)      │   │  eşlemesi)  │    veya manuel
 │ ulusal…)   │   └────────────┘   └──────────────┘   └─────────────┘
 ┌──────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐
 │ SaaSSubscript│  │ Team       │  │ Board/Card   │  │ Report/      │
 │ (koltuk-başı │  │ (member[]  │  │ (kanban;     │  │ Publication  │
 │  vs sabit)   │  │  ×rol)     │  │  view types) │  │ (CMS publish)│
 └──────────────┘  └────────────┘  └──────────────┘  └──────────────┘
 ┌──────────────┐  ┌──────────────┐
 │PurchaseRecord│  │ MediaAsset   │
 │(ön-muhasebe: │  │ (dosya/medya │
 │ alış-satış)  │  │  yöneticisi) │
 └──────────────┘  └──────────────┘
```

Alan→tip sözleşmeleri üç yeni archetype yönergesinde normatif tanımlıdır (`archetype-org-employment-directive.md`, `archetype-budget-plan-directive.md`, `archetype-campaign-attribution-directive.md`); burada yalnız grafiğin bütünü ve bağları gösterilir.

### **3.3 Neden grafik: atom zayıfsa ne kırılır**

Her alan atomik tip kataloğundan (`atomik-tip-katalogu-tam-2026-07-01.md`) tip almalıdır; `string`/`json`'a kaçan alan sessiz değer kaybıdır. Aşağıdaki tablo bu bağı EVM'in para-taşıyan doğası üzerinden kanıtlar.

| Zayıf/yanlış modelleme | Ne kırılır (somut) | Kimin parası/riski |
|---|---|---|
| `salary` düz `number` (kur/precision yok) | USD-endeksli maaş + TRY maaş toplanır; işveren maliyeti yanlış | Finans — bordro hatası |
| SalaryParam "as-of" versiyonsuz | Mart maliyeti, Temmuz zammıyla yeniden hesaplanır; geçmiş rapor değişir | Kurul raporu güvenilirliği |
| Kıdem/izin karşılığı türetilmiş değil elle | Karşılık unutulur; mali tabloda sermaye eksik ayrılır | Bilanço — tazminat riski karşılıksız |
| `budget_line.amount` ledger'a köprüsüz | Plan-vs-actual elle Excel'de; sapma uyarısı imkânsız | Bütçe aşımı geç fark edilir |
| Kampanya harcaması kanal taksonomisiz | "Pazarlamaya X harcandı" var, "hangi kanal ne getirdi" yok | CAC hesaplanamaz — 10.000 USD sorusu cevapsız |
| `member.activated` olayı atribüsyon anahtarsız | Üye geldi ama hangi kampanyadan geldiği bilinmez | ROAS körlüğü |
| SaaS gideri koltuk-başı/sabit sınıfsız | Ekip 9→18 olunca maliyet projeksiyonu tutmaz | Runway (nakit ömrü) hesabı yanlış |
| `PriceRecord` append-only değil | Fiyat geçmişi ezilir; "fiyat düştü" analitiği ve pazar endeksi çöker | Consumer'ın ayrışma vaadi |
| Parsel/konum düz `string` adres | Harita/hexbin/choropleth çizilemez | Dikeyde derinlik vaadi |
| Board kartı ReBAC scope'suz | CPO'nun yönetsel notları ekibe görünür | Yönetsel gizlilik ihlali |
| Rakam kaynak zarfı / formül sürümü olmadan | "Doğru görünen yanlış runway/CAC" kurula sunulur | Ürünün bir numaralı tehdit modeli (decision-grade) |
| Rapor canlı sorgudan (snapshot'sız) | Yayınlanmış kurul raporu sonradan sessizce değişir | Kurumsal güven + hukuki risk |

### **3.4 Omurga ve doğruluk katmanı (üç çekirdek sözleşme)**

Yukarıdaki iki grafik tek başına modül yığınıdır; onları ürün yapan üç çekirdek sözleşme şudur ve TÜM EVM varlıkları bunlara bağlanır:

1. **`archetype-venture-core`** — girişim omurgası: `tenant → venture → legal_entity` hiyerarşisi + `funding_round`/`capital_allocation` (50M ₺ nereden geldi, neye tahsis edildi) + `strategic_objective → initiative → business_case → assumption` stratejik zinciri + `scenario`/`forecast_version` + `decision`/`approval` (maker-checker) + `reporting_period` (ortak dönem ekseni) + `management_snapshot` (dondurulmuş yayın). §3.2'deki HER varlık venture+dönem koordinatı taşır; koordinatsız mali kayıt reddedilir.
2. **`decision-grade-data-contract`** — doğruluk zinciri: kaynak zarfı (kim girdi, hangi belgeyle) → doğrulama → onay → mutabakat (ledger↔banka, bütçe↔ledger, dashboard↔ledger) → dönem kilidi → formül-sürümlü hesap (lineage'lı) → KPI → rapor → snapshot. Çift zaman ekseni (effective/transaction) tüm parametrelerde geçerlidir; `unverified`/`unreconciled` veri KPI hattına giremez, girerse güven-düşük etiketi zorunludur.
3. **`financial-state-model-contract`** — altı finansal gerçek: **Planned ≠ Forecast ≠ Committed ≠ Accrued ≠ Actual ≠ Cash.** Her mali görünüm hangi durumu gösterdiğini etiketler; runway CASH'ten türer, bütçe kullanılabilirliği taahhüt-farkındadır (`available = planned − committed − accrued − actual`).

---

## **4. Fonksiyonel Olmayan Gereksinimler (NFR) + Hacim Varsayımları (D9)**

NFR'ler pazarlık konusu değildir; her biri bir CI kapısına veya test-zorunlu değişmeze bağlanır. Hacim varsayımları `VERİ BEKLİYOR` etiketli satırlarda CPO girdisi bekler — bu değerler EAV→fiziksel tablo terfi eşiğini, indeks stratejisini ve p95 hedeflerinin gerçekçiliğini belirler.

| Kategori | Gereksinim |
|---|---|
| **Multi-tenancy** | Her tabloda zorunlu `tenant_id`; fail-closed; PostgreSQL RLS ikinci bariyer (`core-contract-pack §2.1`). Company-os tenant'ı = müşteri girişim; arsam ilk tenant |
| **Yetkilendirme** | RBAC + ABAC (öznitelik: "maaş alanını yalnız İK+CEO okur") + ReBAC (ilişki: "üye yalnız kendi takımının board'unu görür") — karar PDP'de (policy-as-data; `adr-P1-pdp`), UI'dan yönetilebilir |
| **Kimlik** | Magic link birincil giriş (bkz. §11); MFA/step-up hassas aksiyonlarda; oturum cihaz-kayıtlı ve uzaktan iptal edilebilir |
| **Veri hassasiyeti (U3)** | Maaş/tazminat = kişisel veri (KVKK); yatırım finansalları = ticari sır. İlgili düğümlerde `dataLifecycle` boyutu risk sinyaliyle zorunlu dolu; alan-düzeyi maskeleme |
| **Audit** | Her mutasyon append-only audit'e düşer; mali kayıtlar (ledger) ayrıca değiştirilemez — düzeltme ters fişle |
| **Karar-verisi güvencesi** | Tüm veri-taşıyan modüller `decision-grade-data-contract`'a uyar: kaynak zarfı, maker-checker, mutabakat, dönem kilidi, formül sürümü, snapshot. Doğrulanmamış/mutabakatsız veri KPI'ya etiketiz giremez |
| **Finansal durum ayrımı** | Her mali görünüm `financial-state-model-contract` durum etiketini taşır (planned/forecast/committed/accrued/actual/cash); etiketiz mali görünüm render edilemez |
| **Performans** | Panel liste uçları p95 < 300ms (cursor sayfalama, N+1 yasak); ilan arama p95 < 500ms faset filtreleriyle; dashboard agregasyonları önceden hesaplanmış projeksiyondan (`event-replay-projection-contract`) |
| **Data-sense UI yoğunluğu** | Yüksek veri yoğunluğu bilinçli tasarım: tablo-önce, satır yüksekliği kompakt, sayısal hizalama sağa, birim/kur her hücrede belirsizliğe kapalı; view types (list/kanban/table/grid) kullanıcı tercihi olarak kalıcı | 
| **Dayanıklılık** | Zamanlanmış rapor/karşılık hesabı `k-worker` kuyruğunda; retry+backoff+DLQ; idempotency anahtarı `{tenant}:{job}:{period}` |
| **Gözlemlenebilirlik** | Yapısal log + trace; metrik hattı KPI hattından ayrı (observability ≠ ürün analitiği) |
| **i18n** | TR taban + EN; para/tarih/sayı CLDR; kanal/kategori adları `EnumType` alias'lı |
| **Erişilebilirlik** | WCAG 2.2 AAA hedefi (repo kilidi): kontrast ≥7:1, tam klavye, dokunma hedefi ≥44px — data-yoğun tablolarda dahi |
| **AI güvenlik** | AI önerir → insan onaylar → motor uygular. AI mali fiş kesemez, bütçe onaylayamaz, yetki değiştiremez, rapor yayınlayamaz, ekip bölemez |

### **4.1 Data-sense UI capability sözleşmesi (görüntü kabı ≠ veri ürünü)**

Bir surface tipinin (list/board/table/dashboard) mevcut olması data-sense UI anlamına gelmez; aşağıdaki yetenekler bağımsız capability olarak tanımlanır ve `data-sense-surface-contract` (P1) ile sözleşmeye bağlanır. Dış incelemenin listesi kabul edilmiş kapsamdır:

Veri anlamı ve gezinme: boyut/metrik semantiği (her kolon bir metrik sözlüğü kaydına bağlanır), drill-down + roll-up (venture→departman→satır), pivot/group-by, zaman karşılaştırması (MoM/QoQ/YoY), plan–actual–forecast yan yana, senaryo karşılaştırması. Görünüm yönetimi: filtrelerin URL ile paylaşımı, saved view + kişisel görünüm, tablo kolon konfigürasyonu (kalıcı), virtual scrolling (yoğun veri), toplu düzenleme, import önizleme + hata düzeltme akışı. Güven katmanı (decision-grade'in UI karşılığı): veri tazelik göstergesi, kaynak/lineage görüntüleme (rakamdan kayda iniş), güven düzeyi/confidence rozeti, açıklanabilir formül (rakamın formül sürümü + girdileri), anomali/istisna görünümü, snapshot/freeze göstergesi, yorum-karar-onay bağlamı (rakamın yanında ilgili `decision`/`approval`), **export edilen dosya = ekrandaki rakam** (aynı snapshot kaynağı — ayrı sorgu yasak).

**Stack sınırı (mutlak, repo kilitleri):** Backend FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL; frontend Vite + React + TanStack Router/Query/Table; stil SCSS + token (headless: Radix/React Aria); ikon Phosphor; font Roboto ≥300 weight, taban ≥1rem. **YASAK:** Next.js, Supabase, Prisma, Redux, Flowbite, antd, MUI, Chakra, Mantine, react-markdown.

**Hacim varsayımları (D9 — VERİ BEKLİYOR):**

| Varsayım | Değer | Etkilediği karar |
|---|---|---|
| Toplam ilan (1. yıl / 5. yıl) | `VERİ BEKLİYOR` | EAV→fiziksel tablo terfi eşiği; arama indeksi |
| Eşzamanlı panel kullanıcısı | `VERİ BEKLİYOR` | Projeksiyon/cache stratejisi |
| Eşzamanlı consumer ziyaretçisi (tepe) | `VERİ BEKLİYOR` | CDN/cache + arama ölçeği |
| Parsel poligon hacmi | `VERİ BEKLİYOR` | Geo katman (deck.gl) veri servis biçimi |
| Aylık manuel kayıt girişi (harcama+satınalma) | `VERİ BEKLİYOR` | Form UX + toplu içe aktarım gereği |
| Personel sayısı yörüngesi (ay×adet) | `VERİ BEKLİYOR` | HRMS ölçeği; takım bölünme sıklığı |

---

## **5. Modül Matrisi (D1)**

Ürün, ortak kernel/archetype/surface katmanı üstünde modüllere ayrılır. Hiçbir modül kendi yetki motorunu, kuyruk sistemini, ledger'ını veya dosya deposunu yeniden yazmaz; kernel primitiflerini tüketir. Her satır: 1 cümle sınır + non-goal + kabul kriteri (CLM emsalindeki 12-modül disiplini).

### **5.1 EVM modülleri (asıl ürün — 14 modül)**

| # | Modül | Sınır (1 cümle) | Non-goal | Kabul kriteri (özet) |
|---|---|---|---|---|
| 1 | **Executive Cockpit** | CPO'nun yönetsel görev/not board'u; list/kanban/table/grid view geçişli; ekipten ReBAC ile izole | Ekip sprint board'u değildir | CPO kart oluşturur/taşır; ekip üyesi board'un varlığını dahi göremez (negatif test) |
| 2 | **HRMS & Workforce Cost** | Departman/pozisyon/istihdam kaydı + meslek grubu maaş parametresi + işveren maliyeti ve karşılıkların aylık tahakkuku | Bordro ödemesi/banka entegrasyonu yapmaz (v1) | İstihdam girilir → aylık toplam işveren maliyeti türetilir → karşılık fişi ledger'a iner |
| 3 | **Budget & FP&A** | Opex/capex bütçe satırları, dönem/sürüm, plan-vs-actual, forecast | Muhasebe kaydı üretmez; ledger'dan okur | Bütçe satırı tanımlanır → gerçekleşme ledger+satınalmadan akar → sapma %'si görünür |
| 4 | **Marketing Budget & Attribution** | Kanal taksonomisi (dijital/ulusal medya alt kırılımlı), kampanya, harcama girişi, edinim eşlemesi, CAC/ROAS | Reklam platformu API entegrasyonu v1'de yok (manuel giriş) | Harcama girilir + üye olayı/manuel dönüşüm eşlenir → kanal bazlı CAC raporu üretilir |
| 5 | **SaaS & Vendor Spend** | SaaS envanteri; koltuk-başı vs sabit gider sınıfı; ekip büyüdükçe maliyet projeksiyonu | Lisans satın alma/faturalama yapmaz | Araç+fiyat+sınıf girilir → kişi sayısı değişince projeksiyon otomatik güncellenir |
| 6 | **Pre-accounting** | Satınalma/alış-satış/harcama kayıtları (şirket içi: donanım, SaaS, AI kredisi, reklam); ledger'a fiş taslağı | Resmî muhasebe/e-fatura/vergi beyanı değildir | Kayıt girilir → kategori+bütçe satırı eşlenir → fiş taslağı İK değil finans onayıyla ledger'a düşer |
| 7 | **Team & Agile Mgmt** | Takım/üye/rol kaydı; takım board'ları (şeffaf); büyüme kuralı (bölünme önerisi); SAFe katmanı sonraki faz | Sprint metrik aracı (velocity analytics) v1'de değil | Takım kurulur → board açılır → üye yalnız kendi takımını görür; 10. üyede bölünme önerisi düşer |
| 8 | **Reporting & BI** | Metrik sözlüğünden beslenen dashboard'lar + zamanlanmış rapor üretimi (şablon→doldur→yayınla) | Serbest SQL sorgu arayüzü değildir | Ay kapanır → kurul raporu taslağı otomatik üretilir → CPO onaylar |
| 9 | **CMS & Public Publishing** | Kurul raporlarının page-builder ile düzenlenip publish workflow'la public URL'de yayını | Genel amaçlı web sitesi CMS'i değildir | Rapor yayınlanır → auth'suz URL'den okunur → iç veriler maskeli kalır (negatif test) |
| 10 | **Media & File Manager** | Şirket dosya/medya deposu (sözleşme, görsel, doküman); klasör+etiket+arama | Sürüm-kontrollü doküman işbirliği (Google Docs) değildir | Dosya yüklenir → `k-storage` AssetRef; yetkisiz rol indiremiyor |
| 11 | **IAM & Policy Admin** | Rol grupları + ABAC/ReBAC kurallarının UI'dan tanımı; izin simülasyonu ("bu rol bunu görür mü?") | Politika motoru değildir (PDP kernel'dedir); yalnız yönetim yüzeyi | Asistan rolüne kural eklenir → PDP kararı anında değişir → simülasyon doğrular |
| 12 | **Notification Center** | Kanal (in-app/e-posta), şablon, abonelik/rota kuralları; ECA eylemlerinin teslim ucu | SMS/push v1'de yok | Bütçe eşiği aşılır → CPO'ya bildirim düşer → teslim logu izlenir |
| 13 | **Venture & Strategy** | Venture/legal_entity kaydı, funding_round + capital_allocation, objective→initiative→business_case zinciri, decision/approval kayıtları (`archetype-venture-core`) | Cap table / pay defteri hukuki derinliği yapmaz (v2) | 50M ₺ round kaydedilir → allocation bütçe tavanlarına bağlanır → her stratejik değişikliğin decision kaydı vardır |
| 14 | **Scenario & Forecast Planning** | Assumption (sürümlü varsayım) + scenario + forecast_version yönetimi; senaryo karşılaştırma görünümü | Monte-Carlo/istatistiksel simülasyon v1'de yok | Varsayım güncellenir → yeni forecast sürümü türer → eski sürüm değişmez → iki senaryo yan yana karşılaştırılır |

### **5.2 arsam-marketplace modülleri (dikey dogfood — 7 modül)**

| # | Modül | Sınır (1 cümle) | Non-goal | Kabul kriteri (özet) |
|---|---|---|---|---|
| 1 | **Listing Core** | İlan CRUD + durum makinesi + fiyat geçmişi + doping durumu | Emlak ofisi CRM'i değildir | İlan taslak→moderasyon→yayın akışını tamamlar; fiyat değişimi geçmişe append olur |
| 2 | **Category & Attributes** | Gayrimenkul kategori ağacı + kategoriye göre dinamik öznitelik (EAV+variant-family) | Kategori dışı dikeyler (vasıta vb.) v1'de yok | Kategori seçilir → öznitelik formu otomatik kurulur → doğrulama atomik tiplerle |
| 3 | **Search & Discovery** | Faset filtre + sıralama (doping boost dahil) + kayıtlı arama | Öneri motoru (ML ranking) v1'de yok | Filtre kombinasyonu p95 hedefinde döner; doping'li ilan kurallı öne çıkar |
| 4 | **Geo Layer** | Harita pin, parsel poligonu, m²-fiyat choropleth, ilan yoğunluğu hexbin | Tapu/imar resmi veri entegrasyonu v1'de yok | İlan haritada parseliyle görünür; bölge analitiği çizilir |
| 5 | **Messaging** | Alıcı-satıcı ilan-bağlamlı mesaj thread'i | Genel sohbet/çağrı değildir | Üye ilan üzerinden yazar → sahibi bildirim alır → thread ilana bağlı kalır |
| 6 | **Membership & Trust** | Üyelik, profil, favori, şikâyet; `member.activated` olayı atribüsyon anahtarıyla | KYC/kimlik doğrulama v1'de minimal | Üye aktive olur → olay outbox'tan yayınlanır → EVM tüketir |
| 7 | **Moderation & Monetization** | Moderasyon kuyruğu (workflow) + doping/paket satışı + `sale.completed` olayı | Ödeme sağlayıcı çeşitliliği v1'de tek PSP | Moderatör onaylar/reddeder; doping satışı gelir olayı üretir |

---

## **6. Aktör / Rol Envanteri + Yetki Matrisi (D3)**

Roller PDP'de policy-as-data olarak tanımlanır; aşağıdaki matris politika kaynağıdır (mock değil, kural beyanı). CRUD kısaltmaları: C=oluştur, R=oku, U=güncelle, D=sil/pasifleştir. Koşul sütunu ABAC/ReBAC kuralını verir. `KARAR BEKLİYOR` satırları CPO onayıyla kesinleşir.

**Rol grupları:** `ceo`, `cpo` (kullanıcı), `board_member` (patron/kurul — çoğunlukla okuyucu), `assistant` (CPO asistanı), `hr_lead`, `finance_lead`, `marketing_lead`, `team_lead`, `team_member`, `moderator` (consumer), `listing_owner` (consumer üyesi), `public_reader` (auth'suz).

| Varlık | ceo | cpo | board | assistant | hr | finance | team_member | Koşul (ABAC/ReBAC) |
|---|---|---|---|---|---|---|---|---|
| SalaryParam + Employment.maaş alanları | R | R | — | — | CRUD | R | — | ABAC: `field.class=salary` → yalnız {hr_lead, ceo, cpo-R, finance-R}; diğer rollere alan maskeli |
| BudgetPlan / BudgetLine | R+onay | CRUD | R | R | — | CRUD | — | Capex satırı onayı: `amount > eşik` → ceo step-up onayı (eşik `VERİ BEKLİYOR`) |
| Ledger (journal) | R | R | R (özet) | — | — | CRUD | — | Kayıt düzeltme = ters fiş; U/D fiziksel yok |
| Campaign / SpendEntry | R | CRUD | R (özet) | R | — | R | — | marketing_lead: CRUD kendi kanallarında |
| Executive Board (CPO kanban) | `KARAR BEKLİYOR` | CRUD | — | R (+U `KARAR BEKLİYOR`) | — | — | — | ReBAC: scope=executive; üyelik listesi dışında görünmez |
| Team Board / Card | R | R | — | — | — | — | CRUD (kendi takımı) | ReBAC: `member ∈ team` → o takımın board'u; diğer takımlar R `KARAR BEKLİYOR` (şeffaflık genişliği) |
| Report (iç) | R | CRUD | R | R | R (İK raporları) | R (mali raporlar) | — | ABAC: rapor sınıfı × departman |
| Publication (public) | onay | CRUD | R | — | — | — | — | Publish workflow: cpo hazırlar → ceo onaylar → public_reader yalnız yayınlanmış sürümü okur |
| SaaSSubscription / PurchaseRecord | R | CRUD | R (özet) | C (kayıt girişi) | — | CRUD | — | — |
| MediaAsset | R | CRUD | — | CRUD | R | R | R (takım klasörü) | ReBAC: klasör sahipliği/paylaşımı |
| Listing / ModerationCase (consumer) | — | R (analitik) | — | — | — | — | — | moderator: moderasyon kuyruğu CRUD; listing_owner: yalnız kendi ilanı CRUD |
| IAM kuralları (PDP policy) | R | CRUD | — | — | — | — | — | Yetki değişikliği = step-up + audit zorunlu; AI'a kapalı |

Değişmez kurallar: (1) `deny-by-default` — matriste olmayan her erişim reddedilir; (2) panelTier sunumdur, güvenlik sınırı PDP'dir (`panel-tier-contract`); (3) her satır en az bir negatif testle kanıtlanır ("team_member maaş alanını çekemez → 403 + alan maskeli").

---

## **7. Finansal Parametre Setleri (D4)**

Bu bölüm parametrelerin **şemasını** tanımlar; değerler tenant-verisi olup `VERİ BEKLİYOR` durumundadır. Tüm parametre setleri **referans/master veri** sınıfındadır: versiyonlu ve as-of (belirli tarihte geçerli değeri sorgulanabilir) tutulur — geçmiş ay maliyeti o ayın parametresiyle hesaplanır, bugünün zammıyla değil.

**7.1 Meslek grubu × maaş parametresi (`SalaryParam`):** alanlar — `position_ref` (EntityRef), `gross_salary` (Money), `currency_policy` (EnumType: TRY sabit / USD-endeksli), `valid_range` (DateRange, as-of anahtarı), `revision_note`. 

**7.2 İşveren maliyet çarpanları (`EmployerCostFactor`):** alanlar — `factor_kind` (EnumType: sgk_employer, unemployment, severance_accrual, leave_accrual, other), `rate` (Percentage) veya `formula_ref` (k-computation), `valid_range` (DateRange), `legal_basis` (kaynak mevzuat notu). Kıdem karşılığı aylık 1/12 tahakkuk + izin karşılığı kullanılmamış gün üzerinden; ikisi de ay sonunda otomatik `journal_entry` taslağına döner (finance_lead onaylar).

**7.3 İstihdam planı (`HeadcountPlan`):** satır şeması — `month` (dönem), `position_ref`, `count` (adet), `planned_gross` (Money). Plan, BudgetLine (opex/personel) üretiminin girdisidir; gerçekleşen Employment kayıtlarıyla plan-vs-actual karşılaştırılır. Değerler: `VERİ BEKLİYOR` (aylık işe alım takvimi CPO'dan).

**7.4 Pazarlama kanal taksonomisi (`Channel`):** iki kök — `digital` (alt: arama/paid-search, sosyal, programatik/display, video, influencer, ASO/SEO, e-posta) ve `national_media` (alt: TV, radyo, açıkhava/OOH, basın). Taksonomi tenant-özelleştirilebilir (`archetype-taxonomy`); kanal bazlı dönem bütçeleri `VERİ BEKLİYOR`.

**7.5 SaaS envanteri (`SaaSSubscription`):** alanlar — `tool_name`, `vendor`, `cost_class` (EnumType: **per_seat** | **flat** | **usage_based**), `unit_price` (Money), `billing_period` (Recurrence), `owner_department`, `seat_count_source` (headcount bağı: hangi pozisyonlar koltuk sayar). Maliyet projeksiyonu: `flat` sabit kalır; `per_seat` işe alımla otomatik artar; `usage_based` (AI kredisi gibi) metrik-bağlı tahmin. Envanter içeriği `VERİ BEKLİYOR`.

**7.6 Gelir parametreleri (`RevenueParam`, consumer):** doping/paket fiyat listesi (Money + DateRange), komisyon/ücret kuralları. Değerler `VERİ BEKLİYOR`.

---

## **8. KPI / Metrik Sözlüğü (D5)**

Kural: **tanımsız metrik rapora giremez.** Her metrik şu şemayla kaydedilir: `metric_id`, `ad`, `formül` (kaynak alanlarla) + **`formula_version`** (formül değişince sürüm artar; eski dönem eski sürümle yeniden üretilir), `kaynak olay/tablo` + **finansal durum etiketi** (hangi durumdan türer — `financial-state-model`), `periyot`, `hedef` (VERİ BEKLİYOR), `sahip rol`, **`confidence` davranışı** (girdi hattında unverified/unreconciled kayıt varsa metrik güven-düşük işaretlenir — `decision-grade-data-contract §3.7`). Türetim `computation-derivation-contract` disiplinine uyar: kaynak + formül sürümü + as-of ile deterministik yeniden üretilebilir; düzeltme (correction) geçmiş yayını değiştirmez, restatement üretir.

| Metrik | Formül (yapı) | Kaynak | Periyot | Kritik tanım notu |
|---|---|---|---|---|
| `active_member` | `KARAR BEKLİYOR` — aday tanım: son 30 günde ≥1 oturum VE (≥1 ilan görüntüleme VEYA ≥1 mesaj) olan üye | consumer olayları | günlük | Bu tanım kesinleşmeden CAC hesaplanamaz — en yüksek öncelikli karar |
| `CAC` (kanal bazlı) | kanal dönem harcaması ÷ o kanaldan gelen yeni `active_member` | SpendEntry + Attribution | aylık | Atribüsyon penceresi `KARAR BEKLİYOR` (örn. 30 gün first-touch) |
| `ROAS` | kanaldan doğan gelir ÷ kanal harcaması | Attribution + `sale.completed` | aylık | Gelir tanımı: doping+paket satışı |
| `total_employer_cost` | Σ employment (brüt + Σ EmployerCostFactor) | HRMS + parametreler | aylık | Maaş-dışı toplam ayrıca raporlanır (kullanıcı talebi) |
| `severance_leave_accrual` | formül: kıdem 1/12 + kullanılmamış izin karşılığı | HRMS → ledger accrual | aylık | Mali tabloda karşılık hesabına iner |
| `budget_variance` | (actual − plan) ÷ plan | BudgetLine + ledger | aylık | Eşik aşımı ECA tetikler (§9) |
| `saas_cost_per_head` | Σ SaaS maliyet ÷ headcount | SaaSSubscription + HRMS | aylık | per_seat/flat kırılımıyla |
| `runway` | mutabakatlı nakit ÷ aylık net yakma | **CASH durumu** (banka-mutabakatlı; planned/budget'tan DEĞİL) | aylık | 50M ₺ bağlamında kurul metriği; mutabakatsız nakitle hesaplanan runway güven-düşük etiketlenir |
| `listing_liquidity` | yayından satış/pasife medyan gün | listing olayları | haftalık | Consumer sağlık metriği |
| `moderation_sla` | moderasyon kuyruğunda medyan bekleme | workflow olayları | günlük | Operasyon metriği |

Sözlüğün tamamı yaşayan kayıttır; yeni metrik eklemek = bu şemaya satır eklemek + kaynak/formül doğrulaması. Hedef değerler tümüyle `VERİ BEKLİYOR`.

### **8.1 Atribüsyon sözleşmesi gereksinimleri (metric-attribution contract, P1)**

"CAC = harcama ÷ yeni aktif üye" yalnız en kaba formüldür; karar-verilebilir atribüsyon şunları sözleşmeye bağlar (`archetype-campaign-attribution` + metric-attribution contract P1'in kabul kapsamı): kampanya hiyerarşisi (channel → campaign → ad_group → creative — harcama ve dönüşüm aynı seviyede eşlenmez ise roll-up kuralı), dönüşüm hunisi olayları (impression → click → lead → signup → activation → purchase; her adım ayrı olay), **anonim→kimlikli eşleme** (ilk temas anonim çerez/cihaz; üyelik sonrası kimlik birleştirme kuralı), atribüsyon penceresi (`KARAR BEKLİYOR`) ve modeli (first-touch / last-touch / çok-dokunuş — v1 modeli `KARAR BEKLİYOR`; model, metrik sözlüğünde formül sürümüyle kayıtlı), organik/direct ayrımı (atfedilemeyen edinim ayrı sınıf — kanala zorla yazılamaz), offline dönüşüm (ulusal medya → kod/anket/manuel eşleme), iade/iptalin CAC-LTV'ye geri işlenmesi, fraud/bot filtreleme (şüpheli trafik dönüşüm sayılmaz), consent/KVKK (izinsiz izleme verisi hatta giremez), **harcama mutabakatı** (girilen harcama ↔ platform faturası — decision-grade §3.5), kur+saat dilimi normalizasyonu, cohort görünümü ve LTV + payback-period metrikleri (CAC tek başına karar metriği değildir).

---

## **9. ECA Kural Listesi (D6)**

ECA (Event-Condition-Action — olay-koşul-eylem) kuralları yapısal `ecaRules[]` olarak tutulur (17 boyut #9); serbest metin değil. Zincir sınırı: maxChainDepth 6; dış-etki eylemleri (yayın, mali fiş) insan onaylı. Aşağıdaki liste v1 kural setidir; eşik değerleri `VERİ BEKLİYOR`.

| # | Olay | Koşul | Eylem | Onay |
|---|---|---|---|---|
| E1 | `team.member_added` | `team.size ≥ split_threshold` (öneri: 10) | **Organizasyon tasarım önerisi zinciri başlat** (mekanik bölme DEĞİL): alternatif topolojiler üret (5+5 dahil) + her alternatif için beceri dağılımı / domain bağı / bağımlılık / bütçe / board-migration etkisi raporu + takımın kendi önerisini iste + CPO+team_lead değerlendirme kaydı (`decision`) | İnsan kararı olmadan hiçbir bölünme uygulanmaz; onay sonrası geçiş planı + board/sorumluluk migration'ı ayrı iş akışıdır (bkz. §12) |
| E2 | `budget.actual_updated` | `actual > plan × warn_ratio` (öneri: 0.9) | Sapma uyarısı → finance_lead + CPO | — (bildirim) |
| E3 | `budget.actual_updated` | `actual > plan` | Aşım kaydı + capex/opex sahibine eskalasyon | Yeni harcama girişi finance onayına düşer `KARAR BEKLİYOR` |
| E4 | `month.closed` | her ay | Karşılık tahakkuk fişi taslağı (kıdem 1/12 + izin) + kurul raporu taslağı üret | finance_lead fişi, CPO raporu onaylar |
| E5 | `campaign.spend_entered` | `Σ spend > channel_budget` | Kanal bütçe aşım uyarısı → marketing_lead | — |
| E6 | `member.activated` (consumer) | atribüsyon anahtarı var | Attribution kaydı + CAC metriği güncelle | — (otomatik, geri-alınabilir) |
| E7 | `listing.submitted` | — | Moderasyon kuyruğuna al; SLA sayacı başlat | moderator kararı insan |
| E8 | `listing.published_range_expired` | — | İlanı `passive`'e çek + sahibine bildirim | — |
| E9 | `employment.created/ended` | SaaS `per_seat` bağıysa | SaaS maliyet projeksiyonunu güncelle | — |
| E10 | `publication.publish_requested` | hedef=public | CEO onay adımı + PII/iç-veri tarama kontrolü | CEO step-up |
| E11 | `salary_param.updated` | — | İleri dönem maliyet projeksiyonu yeniden hesap; geçmiş dönem DEĞİŞMEZ (as-of) | hr_lead |
| E12 | `report.schedule_due` | zamanlanmış rapor | Şablondan rapor üret → sahibinin onay kuyruğuna | sahip rol onaylar |
| E13 | `reconciliation.completed` | sonuç=`unreconciled` | Fark alarmı → finance_lead; ilgili KPI'lar güven-düşük etiketlenir | çözüm/gerekçe insan kaydı |
| E14 | `period.close_requested` | bekleyen onaysız fiş VEYA unreconciled kalem var | Kapanış BLOKLANIR + eksik listesi finance_lead'e | eksikler kapatılmadan kilit yok |

AI sınırı: AI bu kuralların hiçbirini kendisi tanımlayamaz/değiştiremez; yalnız yeni kural **taslağı** önerebilir (`aiAgents` boyutu, `ai-governance-master`).

---

## **10. Rapor / Yayın Envanteri (D7)**

Rapor şeması: `ad`, `veri kaynağı (metrik listesi)`, `frekans`, `format`, `görünürlük` (public URL / iç / kurul), `üretim` (otomatik taslak → onay → yayın). Zamanlanmış üretim `k-worker` + `report-scheduler` akışıyla; public yayın `cms-publish` workflow'uyla.

| Rapor | Kaynak metrikler | Frekans | Görünürlük | Üretim |
|---|---|---|---|---|
| Kurul raporu (yatırımcı/yönetim kurulu) | runway, budget_variance, total_employer_cost, CAC, active_member, gelir | aylık | **public URL** (CEO onaylı; hassas alan maskeleme kontrolü) + kurul | otomatik taslak (E4) → CPO düzenler → CEO onaylar → publish |
| Aylık işgücü maliyet raporu | total_employer_cost, severance_leave_accrual, headcount plan-vs-actual | aylık | iç: ceo, cpo, hr, finance | otomatik |
| Pazarlama performans raporu | kanal×CAC, ROAS, harcama-vs-bütçe | aylık | iç: cpo, marketing, ceo | otomatik taslak → marketing_lead onayı |
| SaaS/gider raporu | saas_cost_per_head, sınıf kırılımı, projeksiyon | aylık | iç: finance, cpo | otomatik |
| Bütçe durum raporu | budget_variance satır bazında, forecast | aylık | iç: finance, ceo, cpo | otomatik |
| Consumer sağlık raporu | active_member, listing_liquidity, moderation_sla | haftalık | iç: cpo, ops | otomatik |
| Ad-hoc yönetsel not/rapor | serbest (metrik gömme destekli) | isteğe bağlı | seçilebilir | manuel (page-builder) |

Public yayın değişmezi: yayınlanan sürüm **snapshot**'tır (yayın anındaki veriyle donar, canlı sorgu değil); sonraki düzeltme yeni sürüm yayınlar; eski URL sürüm geçmişini korur.

---

## **11. Oturum ve Güvenlik Politikası (D8, U1 kararı)**

**U1 kararı (bu probe ile kayda geçer): rotasyonlu refresh + step-up.** Talep edilen "6 ay oturum", tek uzun-ömürlü token ile DEĞİL, şu zincirle karşılanır:

1. **Giriş:** Magic link (e-postaya tek-kullanımlık, kısa-ömürlü imzalı link) birincil giriş yöntemidir; parola yoktur. Link TTL'i dakikalar mertebesinde, tek kullanımlık, cihaza bağlanır.
2. **Oturum zinciri:** Access token kısa ömürlü (15 dk, `platform-wbs-plan §2.2` ile uyumlu); refresh token **her kullanımda rotasyon** + aile-iptal (çalınan eski refresh kullanılırsa tüm zincir düşer). Zincirin toplam yaşam üst sınırı **6 ay** — kullanıcı 6 ay boyunca aktifse yeniden giriş istenmez; 6. ayın sonunda zorunlu yeniden magic link.
3. **Cihaz kaydı + uzaktan iptal:** Her zincir cihaz kaydıyla eşlenir; kullanıcı/admin panelden cihaz oturumunu düşürebilir.
4. **Step-up listesi (yeniden magic link veya ikinci faktör gerektiren aksiyonlar):** maaş verisi görüntüleme/düzenleme, bütçe/capex onayı, yetki (PDP) değişikliği, public yayın onayı, ledger fiş onayı, veri dışa aktarımı. Liste PDP'de policy-as-data; genişletme CPO+CEO onayı.
5. **Waiver kaydı:** Refresh ömrünün 7 günden 6 aya uzatılması `waiver-policy.md` uyarınca gerekçeli+süreli waiver olarak kaydedilir; yıllık yeniden değerlendirilir.

Ne yapar / ne yapmaz: bu politika oturumu 6 ay *sürdürülebilir* kılar; 6 ay *dokunulmaz* kılmaz — şüpheli IP/cihaz değişimi, rotasyon ihlali veya admin iptali zinciri anında düşürür.

---

## **12. Ekip Topolojisi Kuralları (D10)**

Kaynak ilke: Scrum'ın küçük, çapraz-fonksiyonlu takım yaklaşımı (Sutherland). Yapısal kurallar:

| Kural | Değer | Not |
|---|---|---|
| Takım büyüklük bandı | 3–9 üye | 9 üstü sağlıksız sinyal |
| Bölünme tetiği | 10. üye eklenince (E1) | Eşik yalnız TETİKTİR, karar kuralı değildir — sistem organizasyon tasarım önerisi zinciri başlatır |
| Karar girdileri (öneri raporunda zorunlu) | beceri dağılımı, ürün/domain bağı, bağımlılık yoğunluğu, takım bilişsel yükü, PO/SM-yönetici kapasitesi, roadmap, bütçe etkisi, iletişim maliyeti, bus factor (kritik bilginin tek kişide olması), teslimat metrikleri, **takımın kendi önerisi** | Sistem alternatif topolojileri bu girdilerle karşılaştırmalı sunar; tek-seçenekli dayatma yasak |
| Bölünme kararı | insan (CPO + team_lead + takım görüşü) | `decision` kaydıyla kalıcı; AI/sistem yalnız öneri + etki simülasyonu üretir |
| Geçiş planı | onay sonrası ayrı iş akışı | sorumluluk devri, board migration (kartların yeni takımlara taşınması), bütçe satırı bölüşümü, bildirimler — hiçbiri otomatik-anlık değil, planlı |
| Takım-bütçe bağı | her takım bir cost-center'a (BudgetLine grubuna) bağlanır | Bölünmede bütçe satırları yeni takımlara pay edilir; toplam korunur (değişmez) |
| Kişi-başı değişken giderler | SaaS per_seat + donanım + eğitim | E9 projeksiyonu besler |
| SAFe katmanı | sonraki aşama (kapsam dışı v1) | Çok-takım koordinasyonu; team-of-teams planlaması v2+ |

---

## **13. Geliştirme Fazları**

Önkoşul: Foundation zinciri (PR-01→PR-11: CI, tenancy, PDP, outbox, ECA runtime, audit, capability, db-schema, observability, SDK, hello-platform) arsam'dan bağımsız tamamlanır (`platform-implementation-execution-queue`). Arsam fazları o zeminin ÜZERİNE gelir; her faz kapsam→teslim→kabul taşır, `ready-for-dev-gate` 10/10 olmadan development başlamaz.

**FAZ 1 — EVM Omurgası (venture + doğruluk + kayıt + yetki):** venture-core (venture/legal_entity/reporting_period/decision/approval) + decision-grade veri zarfı (kaynak/onay/kilit temel halkaları) + org-employment + budget-plan archetype'ları (financial-state durum etiketleriyle); ledger bağı (accrual fişi taslağı); IAM & Policy Admin (D3 matrisi PDP'ye yüklenir); magic link + oturum zinciri (U1). MVP sınırı: mutabakat motoru Faz 1'de manuel-işaretleme, Faz 2'de otomatik eşleme. *Kabul:* istihdam+bütçe girilir, maliyet türetilir, karşılık fişi finance onayına düşer; maaş alanı negatif testleri geçer.
**FAZ 2 — Harcama ve Atribüsyon:** pre-accounting kayıtları; campaign-attribution archetype; SaaS metering; KPI sözlüğü motoru (D5) + dashboard'lar. *Kabul:* harcama→bütçe eşleşir; manuel dönüşümle CAC üretilir.
**FAZ 3 — Yönetsel Yüzeyler:** Executive Cockpit (view types + ReBAC izolasyon); Team & Agile Mgmt (takım board'ları + E1 bölünme önerisi); Notification Center. *Kabul:* CPO board'u ekipten izole; 10. üye bölünme önerisi tetikler.
**FAZ 4 — Rapor ve Yayın:** Reporting & BI (zamanlanmış üretim, E4/E12); CMS & Public Publishing (snapshot yayın, E10). *Kabul:* ay kapanışı kurul raporu taslağı üretir; CEO onayıyla public URL yayını.
**FAZ 5 — arsam-marketplace MVP:** listing + category/attributes + search + moderation + membership (olay yayını). *Kabul:* ilan uçtan uca yayınlanır; `member.activated` EVM'de CAC'ye düşer.
**FAZ 6 — Consumer Derinlik + Gelir:** geo layer (parsel/choropleth), messaging, doping/monetization (`sale.completed` → ROAS). *Kabul:* doping satışı ROAS raporunda görünür.

---

## **14. Kernel / Archetype / Surface Eşlemesi**

Ürün↔primitif haritasının tamamı ayrı dokümandadır: `kapsama-matrisi-arsam-panel-2026-07-12.md` (v0.3). Özet bağ: **omurga** `archetype-venture-core` + iki contract (`decision-grade-data`, `financial-state-model`); domain archetype'ları org-employment/budget-plan/campaign-attribution(P1)/listing (listing, marketplace backlog'undadır); ledger/EAV/taxonomy/variant-family/messaging-thread/tree-relation mevcut archetype'lardan tüketilir; PDP/tenancy/worker/storage/search/computation kernel'den gelir; yüzeyler `surface-spec` 8 admin tipi + consumer ailesi + `page-builder` olup data-sense capability seti ayrı sözleşmedir (`data-sense-surface-contract` P1 — surface tipi ≠ veri ürünü).

---

## **15. Risk ve Bağımlılıklar**

| Risk / bağımlılık | Etki | Azaltım |
|---|---|---|
| `active_member` tanımı gecikirse (D5) | CAC/ROAS ve kurul raporu belirsiz | Tanım FAZ 2 başlamadan CPO kararıyla kilitlenir |
| Atom şema terfisi (FieldTypeSchema) pending | Money/DateRange/Percentage alanları `string`'e kaçar; mali hesap riski | CLM matrisiyle ortak önkoşul; Görev #16 zinciri |
| `k-worker`/`k-computation` yönergeleri KISMİ | Zamanlanmış rapor, accrual hesabı, projeksiyon motorsuz kalır | İlgili contract'lar foundation Wave'inde yazılır |
| Foundation zinciri (PR-01 blocker) | Hiçbir faz koda başlayamaz | Doküman/probe işi paralel ilerler (U5) |
| KVKK: maaş/kişisel veri (U3) | Hukuki yaptırım + güven kaybı | ABAC alan maskeleme + dataLifecycle zorunlu dolu + DSAR süreci |
| Public yayında iç veri sızıntısı (E10) | Ticari sır ihlali | Snapshot + maskeleme taraması + CEO step-up onayı |
| İki-ada ayrımı ihlali (U4) | Tek şişkin app; modül sınırı erimesi | `app-distribution-contract` + `drafts/adr-product-boundary` (onay bekler); CI bağımlılık-yönü kapısı |
| Ürün sınırı erozyonu (Arsam'a özgü kavramın EVM şemasına sızması) | Generic SaaS vaadi mimariden silinir; ikinci tenant satılamaz | ADR kuralı: Arsam'a özgü her şey tenant konfigürasyonu; review checklist + ikinci-tenant CI senaryosu (boş tenant'la tüm modüller çalışır) |
| Karar-verisi zinciri kısaltması ("MVP'de mutabakat/kilit atlanır" basıncı) | Doğru görünen yanlış rakam kurula gider — en tehlikeli senaryo | decision-grade halka muafiyeti yalnız waiver'la; unverified veri KPI'ya etiketiz giremez (CI conformance) |
| P1 sözleşme borcu (planning-cube, metric-attribution, data-sense-surface, approval-governance, integration-reconciliation, productization) | İlgili modüller derinliksiz kalır | Matris v0.3 Bölüm 3 adresli listesi; her P1 kendi faz kapısına bağlı |
| Manuel veri girişi disiplinsizliği | Rapor çöp-girdi-çöp-çıktı | Zorunlu alan + atomik tip doğrulama + giriş SLA'sı ECA hatırlatması |

---

## **16. Kapsam Dışı / Sonraki Sürüm**

v1 kapsamı dışında: SAFe çok-takım katmanı (v2), reklam platformu API'lerinden otomatik harcama çekme (v1 manuel giriş + mutabakat), resmî muhasebe/e-fatura/vergi beyanı entegrasyonu (mutabakat KAYNAĞI olarak import v1'de var; entegrasyon v2), bordro ödeme/banka ödeme entegrasyonu (banka ekstresi importu v1'de mutabakat için VAR), consolidation (çok-legal-entity mali birleştirme; koordinat ilk günden taşınır, birleştirme v2), tam planning-cube pivot motoru (v1 sabit kırılımlar; tam küp P1 sözleşme + v2), Monte-Carlo/istatistiksel senaryo simülasyonu, cap table/pay defteri, ML tabanlı ilan öneri motoru, tapu/imar resmî veri entegrasyonu, SMS/push bildirim, çoklu PSP, mobil native uygulamalar (PWA ile karşılanır), gayrimenkul dışı ilan dikeyleri.

---

*Sonraki adım zinciri: `drafts/adr-product-boundary` CPO onayı → `VERİ BEKLİYOR`/`KARAR BEKLİYOR` alanlarının CPO tarafından doldurulması (en kritik: `active_member` tanımı, atribüsyon penceresi+modeli, capex eşiği) → P1 sözleşmeler (planning-cube, metric-attribution, data-sense-surface, approval-governance, integration-reconciliation, productization, campaign-attribution, team-topology, k-metering-cost, k-session-auth) → foundation zinciri (PR-01→11) → ready-for-dev.*
