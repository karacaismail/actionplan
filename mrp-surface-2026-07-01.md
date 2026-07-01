# MRP OS — Rapor 3: Surface Katmanı (Üretim Merceği)

**Soru:** SaaS MRP OS'un kullanıcı yüzeyi için **Surface sözleşmesi yeterli mi?**
**Tarih:** 2026-07-01 · **Kaynak:** `src/schemas/surface.ts`, `k-surface`, `k-surface-consumer` (bu turda eklendi), `k-control-planes`, `fe-ai-rt` · **Mercekler:** UX (ağır), AI-First (ağır), yüksek-trafik (orta).

---

## 0. Tek cümlelik cevap

> Hayır — ve MRP'de bu eksik en görünür yerde patlar. Surface kataloğu (list/detail/form/board/dashboard/wizard/report/timeline) ofis-kullanıcısı içindir; üretim yüzeyi ise **fabrika sahasında, eldivenli elle, barkodla, gürültüde, internet kesikken, 2 saniyede** çalışmalıdır. Geçen tur eklenen `k-surface-consumer` (feed/video/harita/render sözleşmesi) doğru yönde ama **shop-floor/Gantt/OEE/andon/iş-talimatı** yüzeylerini ve **offline-first fabrika terminalini** hâlâ modellemez.

---

## 1. Adil değerlendirme — MRP-UX için ne var

`k-control-planes` dört düzlemi ayırıyor (Ops/Developer/Tenant/Public) — shop-floor operatörü kavramsal olarak buraya oturabilir. `fe-ai-rt` (SSE+WS+Yjs CRDT+offline kuyruk) fabrika-terminalinin *teknik* zeminini biliyor. Geçen tur eklediğim `k-surface-consumer` **render/cache/CWV sözleşmesi + custom kaçış kapısı + AI-first yüzey** getirdi — bunlar shop-floor için de gerekli temel. Yani altyapı sinyali var; eksik olan üretim-yüzeyinin **birinci-sınıf sözleşmesi**.

---

## 2. Zayıflık nedenleri — üretim-UX kök sebepleri

### 2.1 Shop-floor operatörü ayrı bir "kitle", ama sözleşmesi yok
Ofis kullanıcısı: fare, klavye, geniş ekran, sabık internet, hata olursa tekrar dener. Shop-floor operatörü: **eldiven, dokunmatik, parlak/tozlu ortam, barkod/QR tarayıcı, tek elle, hata pahalı (yanlış lot = geri-çağırma)**. Surface `responsive` (stack/scroll/hidden) ve `a11y` taşıyor ama **shop-floor modu** (dev dokunma hedefleri, yüksek kontrast, barkod-öncelikli giriş, sesli/andon geri-bildirim, "onaysız devam etme" kilidi) sözleşmede yok.

### 2.2 Üretime-özel yüzey tipleri katalogda yok
8 admin tipi ve `k-surface-consumer`'ın tüketici tipleri, üretimin şu yüzeylerini karşılamaz:
- **Gantt / çizelge board** (APS çıktısı: iş merkezi × zaman, sürükle-bırak yeniden-çizelge).
- **Kanban / üretim akış panosu** (WIP kolonları, çekme sinyali).
- **Andon board** (canlı hat durumu: yeşil/sarı/kırmızı, duruş nedeni, 2 sn tazeleme).
- **OEE / KPI panosu** (availability×performance×quality, hat/vardiya/makine kırılımı).
- **Dijital iş talimatı viewer** (adım-adım, görsel/video, onay-imza, versiyon-kilitli).
- **Shop-floor terminal** (üretime başla/durdur/tamamle, malzeme tüket, fire gir, offline).

### 2.3 Offline-first bir *surface sözleşmesi*, ama beyan edilmiyor
Fabrikada internet kesilir; üretim durmamalı. `fe-ai-rt` offline kuyruğu biliyor ama Surface "bu yüzey offline-çalışır; şu aksiyonlar offline kuyruklanır; senkronda çakışma şöyle çözülür" diye **beyan edemiyor**. Offline üretilen kayıt online olunca `scale-invariant` idempotency + çakışma-çözümü UX'i gerekir (hangi kayıt kazandı, operatöre nasıl gösterilir).

### 2.4 Gerçek-zaman ve tazeleme-bütçesi yok
Andon 2 sn içinde kırmızıya dönmeli; OEE panosu canlı olmalı. `k-surface-consumer`'ın render/CWV sözleşmesi web-performansı içindir; **üretim-gerçek-zaman SLA'sı** (olay→ekran gecikmesi, tazeleme sıklığı, kopukluk davranışı) ayrı bir surface-parametresidir.

### 2.5 WCAG'in fabrika versiyonu farklı
Geçen tur WCAG'i AAA→AA'ya indirmeyi önerdim (doğru). Ama shop-floor **AA'nın da ötesinde** özel gereksinim ister: parlak ışıkta okunabilirlik (kontrast > AA), eldivenle dokunma (hedef ≥ 44px değil, ~64px), gürültüde sesli-değil-görsel geri-bildirim, renk-körü-güvenli andon (kırmızı/yeşil + şekil). Bu, "web a11y" değil "endüstriyel HMI ergonomisi" — sözleşmede yok.

---

## 3. Gap analizi — önceliklendirilmiş

Sade özet: eksik iki eksende — **üretim yüzey tipleri** (Gantt/andon/OEE/terminal) ve **fabrika-bağlam sözleşmesi** (offline/gerçek-zaman/HMI-ergonomi).

| # | Boşluk | Öncelik | Mercek | Bloke ettiği |
|---|---|---|---|---|
| 1 | Shop-floor terminal yüzeyi (offline, barkod, tek-el) | P0 | UX | MES, üretim kaydı |
| 2 | Andon board (canlı hat durumu, 2 sn) | P0 | Yüksek-trafik | Hat yönetimi |
| 3 | Gantt/çizelge board (APS çıktısı, sürükle-bırak) | P0 | UX | Çizelgeleme |
| 4 | OEE/KPI panosu (formül-bağlı, kırılımlı) | P1 | UX | Verimlilik |
| 5 | Dijital iş talimatı viewer (versiyon-kilitli, imza) | P1 | UX | Kalite/uyum |
| 6 | Offline-first surface sözleşmesi (kuyruk+çakışma UX) | P0 | UX/yüksek-trafik | Fabrika sürekliliği |
| 7 | Endüstriyel HMI ergonomi profili (kontrast/hedef/renk-körü) | P1 | UX | Saha kullanılabilirliği |
| 8 | Üretim-gerçek-zaman SLA (olay→ekran) | P1 | Yüksek-trafik | Andon/canlı pano |

---

## 4. Önerilen tasarım (mimari tarif — çizim değil, tanım)

Kuralınıza uyarak yüzeyleri **çizmiyorum**; sözleşme parametresi olarak tanımlıyorum.

### 4.1 Surface tip ailesine üretim tiplerini ekle
`k-surface-consumer`'ın Consumer-Surface ailesine paralel bir **Shop-Surface** ailesi: `terminal`, `andon`, `gantt-schedule`, `kanban-flow`, `oee-dashboard`, `work-instruction`. Her biri kendi davranış sözleşmesiyle (gantt: kaynak×zaman + sürükle→APS-yeniden-çizelge; andon: durum-akışı + tazeleme-SLA; terminal: aksiyon-kilidi + barkod-öncelik).

### 4.2 Fabrika-bağlam sözleşmesi (surface parametresi)
Surface'e `factoryContext` bloğu: `offline` (kuyruklanan aksiyonlar + çakışma-çözüm stratejisi), `realtimeSLA` (olay→ekran ms, kopukluk davranışı), `hmi` (dokunma hedefi, kontrast tabanı, renk-körü-güvenli palet, sesli/görsel geri-bildirim), `inputMode` (barcode/qr/keypad öncelik). **Aktör açıklığı:** *operatör* aksiyonu yapar; *edge* offline kuyruklar (`k-edge-gateway`); *sistem* online olunca idempotent senkronlar; *çakışma* olursa operatöre görsel karar sunar (AI değil insan çözer).

### 4.3 Custom kaçış kapısını üretimde kullan
`k-surface-consumer`'ın `renderStrategy: custom`'ı burada kritik: andon/Gantt/terminal şema-render'la değil, elle-yazılmış performans-ayarlı bileşenlerle yapılır — ama izin/audit/i18n sözleşmesini korur (yönetişimden kaçış yok).

---

## 5. Üç mercek — MRP Surface özelinde

### 5.1 UX (en ağır)
Asıl kazanç: shop-floor'u ayrı bir **kullanıcı-bağlamı** olarak tanımak (ofis ≠ saha). Üç hamle: (1) Shop-Surface tip ailesi; (2) `factoryContext` (offline+HMI+gerçek-zaman); (3) endüstriyel ergonomi profili (kontrast/hedef/renk-körü). "Odoo shop-floor tablet, Samsara canlı pano" seviyesi ancak bunlarla gelir; jenerik admin form'la gelmez.

### 5.2 AI-First
Shop-floor assistant (ChatGPT'nin "Shop Floor Assistant / SOP Assistant"ı): operatör "bu adımı nasıl yaparım", "bu fire normal mi" diye sorar; AI *iş talimatını/geçmişi* gösterir, **üretim kaydını yazmaz** (operatör onaylar). `k-surface-consumer`'ın AI-first yüzeyi (assistant/nl-query) buraya oturur; PDP-farkında + `agentPolicy` sınırlı. Kritik: fabrikada AI yanıtı **çevrimdışı da** çalışmalı (edge'de küçük model / önbellek) — yoksa internet kesikken asistan ölür.

### 5.3 Yüksek-trafik
Andon + canlı OEE panosu en yüksek tazeleme-yüküdür (yüzlerce makine, saniyelik). `scale-realtime` + `scale-counter` zemini var; eksik olan surface'in **tazeleme-SLA'sını ve kopukluk davranışını beyan etmesi** + edge'de yerel-render (bulut gecikmesine dayanmadan). Render sözleşmesi (k-surface-consumer) buna genişletilmeli.

---

## 6. Unknown-unknowns — üretim-UX risk keşfi

- **Offline çakışma UX'i:** iki operatör aynı iş emrini offline güncelledi; online olunca hangi kazanır ve diğerine ne gösterilir? (Veri kaybı vs kafa karışıklığı.)
- **Eldiven + kapasitif ekran:** endüstriyel eldiven dokunmayı bozar; hedef boyutu + stylus + fiziksel buton alternatifi test edildi mi?
- **Renk-körü andon:** kırmızı/yeşil tek başına ~%8 erkek operatörde ayırt edilemez; şekil/metin şart.
- **Vardiya devri:** yarım kalan iş emri vardiya değişince nasıl devredilir (UX + audit)?
- **Barkod hatası:** yanlış lot okutuldu; sistem yakalar mı, yoksa yanlış genealogy mi üretir? (Yüzey-seviyesi doğrulama.)
- **Panonun fabrika-TV'sinde görünürlüğü:** 5 metreden okunur mu (font/kontrast), oturum-güvenliği (herkese açık ekran) nasıl?

---

## 7. Kilitlenecek ADR taslakları

- **ADR-M-S1 — Shop-Surface tip ailesi.** terminal/andon/gantt/kanban/oee/work-instruction. Öneri: Consumer-Surface'e paralel aile.
- **ADR-M-S2 — factoryContext sözleşmesi.** offline+realtimeSLA+hmi+inputMode. Öneri: surface parametresi.
- **ADR-M-S3 — Endüstriyel HMI ergonomi profili.** Kontrast/hedef/renk-körü/geri-bildirim. Öneri: WCAG-AA üstüne saha profili.
- **ADR-M-S4 — Offline-first + çakışma UX.** Kuyruk + idempotent senkron + insan-çözümlü çakışma. Öneri: `k-edge-gateway` + `scale-invariant`'e bağla.
- **ADR-M-S5 — Üretim gerçek-zaman SLA.** Olay→ekran ms + kopukluk davranışı. Öneri: andon/OEE için zorunlu.

---

## 8. Öncelikli aksiyonlar (MRP Surface)

1. **Shop-floor terminal + andon'u** ilk iki üretim-yüzeyi olarak sözleşmele (ADR-M-S1) — en görünür UX kazancı.
2. **factoryContext (offline+HMI+gerçek-zaman)** parametresini `k-surface-consumer` üstüne ekle (ADR-M-S2/S4).
3. **Endüstriyel ergonomi profilini** (ADR-M-S3) WCAG-AA tabanının üstüne koy.
4. **Gantt board'u** `scale-aps` çıktısına bağla (Kernel raporu ile birlikte).
5. **Offline çakışma UX'i** için conformance senaryosu (iki-operatör-tek-emir).

---

*Bağlı: MRP Kernel (`mrp-kernel`) — edge/APS/realtime primitifleri + çerçeve eleştirisi; MRP ArcheType (`mrp-archetype`) — routing/genealogy sözleşmeleri.*
