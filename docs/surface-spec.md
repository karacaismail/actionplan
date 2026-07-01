# Surface Sözleşme Spesifikasyonu — Yüzey Katmanının Kanonik Tanımı

Sürüm: 1.0 — 2026-07-01
Durum: Kanonik. Surface (yüzey) katmanının bağlayıcı sözleşme dokümanı. Çelişen her tanımı geçersiz kılar.
Kaynak: `src/schemas/surface.ts`, `k-surface`, `k-surface-consumer`, `k-control-planes`, `geo-map-surface`, ADR-0026 (tech-profiles), ADR-0027 (mühendislik standartları) · Eleştiri temeli: `elestiri-03-surface-2026-07-01.md`, `mrp-surface-2026-07-01.md`.

Bu doküman **plan+sözleşme** katmanına aittir. Yüzeyleri **çizmez** (wireframe/ASCII yok); her yüzey tipini **bileşen + davranış + sözleşme** olarak tanımlar. Ürün kodu `platform` reposunda yazılır; burada ne yazılacağının normatif kuralı belirlenir.

Kapsam sınırı (mutlak): stack Vite + React + TanStack Router/Query + FastAPI'dir. **Next.js, Supabase, Prisma yasaktır.** Bu doküman bu araçlara referans vermez; SSR/edge/streaming gibi kavramlar araç-nötr sözleşme olarak, mevcut stack üstünde (Vite SSR/prerender + FastAPI) tanımlanır.

---

## 1. Surface nedir · ne yapar · ne yapmaz

**Bu nedir?** Surface, bir ArcheType'ın kullanıcıya gösterilen **projeksiyonudur** (izdüşümü). ArcheType = platformun tek bir varlık/kayıt tanımı (veri + iş kuralı); Surface o tanımın ekrandaki yüzüdür: liste, detay, form, board, dashboard, wizard, report, timeline. Surface ArcheType'tan **ayrı versiyonlanır** — yüzeyi veriden bağımsız evrimleştirmek için.

**Ne işe yarar?** Aynı ekran desenini (ör. "liste görünümü") birçok ArcheType'a yeniden uygulamayı sağlar. Bir kez bir ArcheType tanımlanınca liste/detay/form yüzeyleri otomatik türeyebilir. Bu, iç panellerde (yönetim ekranları) yüksek üretkenlik demektir.

**Ne yapar?** `SurfaceContractSchema` bir **sözleşme** taşır: tip, projekte ettiği ArcheType referansı (`archetypeRef`), gösterilen elemanlar (`elements`), tipli aksiyonlar (`actions`), filtreler, layout, responsive davranış, erişilebilirlik (`a11y`), izinler (`permissions`) ve bağlı tech-profil referansı (`techProfileRef`). Yüzeyin **davranışı** (çok-adımlı durum makinesi) ayrı bir sözleşmede — Workflow — taşınır.

**Ne yapmaz?** Surface **UI kodu değildir**; sözleşmedir. **İş mantığı taşımaz** (o ArcheType'ta yaşar). Kendi başına **serbest bileşen render etmez**; render eden taraf sözleşmeyi okur.

**SDUI (server-driven UI = sunucu-güdümlü arayüz).** Surface'in çalışma modeli budur: **sunucudaki sözleşme neyin görüneceğini söyler, istemci onu çizer.** Panel (render eden taraf) `SurfaceContract`'ı okur ve ekranı üretir. Avantajı: yüzey, kod dağıtımı beklemeden sözleşme değişimiyle güncellenebilir. Sınırı: şema-render her zaman **jenerik** kalır — marka-özel, performans-ayarlı bespoke deneyim saf SDUI ile üretilemez (bunun çözümü Bölüm 5, `renderStrategy: custom`).

**Aktör açıklığı.** *Sistem* sözleşmeyi sunar; *istemci/panel* çizer; *kullanıcı* etkileşir; *AI* (Bölüm 12'de) taslak önerir/önizler; *insan* onaylar; *CI* (Bölüm 6'da) performans ve erişilebilirlik bütçelerini ölçüp bloklar. Bu ayrım doküman boyunca korunur.

---

## 2. Admin-Surface tipleri (mevcut 8)

Admin-Surface, iç yönetim ve CRUD (create/read/update/delete = oluştur/oku/güncelle/sil) yüzeyidir. Kullanıcısı: operasyon ekibi, geliştirici paneli (`k-boyut2`), tenant yöneticisi (`k-boyut3`) — yani fare + klavye + geniş ekran + sabit bağlantı bağlamı. Bu sekiz tip bir *kaydı yönetmenin* sekiz yoludur ve `SurfaceTypeSchema` içinde bugün tanımlıdır. Hepsi SDUI/projeksiyon olarak, yani jenerik render ile üretilir (`renderStrategy: projected`).

Aşağıdaki tablo her tipi bileşen/davranış olarak özetler; çizim değil, sözleşme tanımıdır.

| Tip | Ne yapar (bileşen + davranış) | Tipik layout |
|---|---|---|
| `list` | Kayıt kümesini kolonlu gösterir; sıralama, filtre (facet), sayfalama, toplu aksiyon | table / cards |
| `detail` | Tek kaydın alanlarını ve ilişkilerini gösterir; tipli aksiyonlar kenarda | split |
| `form` | Alan doğrulamalı giriş/düzenleme; RHF + Zod; bağımlı-alan görünürlüğü | split |
| `board` | Kayıtları durum kolonlarına dizer; sürükle-bırak durum geçişi | grid |
| `dashboard` | Metrik/KPI kartları + grafikler; kırılım filtreleri | chart / grid |
| `wizard` | Çok-adımlı akış; adım doğrulama; ilerleme/geri-dönüş | stepper |
| `report` | Toplu/gruplu veri; dışa aktarım; yazdırılabilir düzen | table / chart |
| `timeline` | Zaman-eksenli olay/durum akışı; kronolojik gruplandırma | chart |

Bu sekizi iç panel için olgun ve yeterlidir. Yetersiz kaldıkları yer tüketici ve üretim yüzeyleridir — sıradaki iki bölüm bunları ayrı **tip aileleri** olarak tanımlar. Sebep: "bir kaydın iç projeksiyonu" ile "bir tüketici ürün-yüzeyi" farklı disiplinlerdir; ikisini tek şemaya sıkıştırmak yüzey kalitesini düşürür.

---

## 3. Consumer-Surface tip ailesi (yeni)

Consumer-Surface, dış kullanıcıya bakan, yüksek-trafik, gerçek-zaman ve dönüşüm-odaklı yüzey ailesidir. `k-control-planes` dördüncü düzlemi (Public/Frontpages) bu ailenin *var olduğunu* zaten tanır; bu bölüm ona **birinci-sınıf tip** verir. Admin-Surface'ten farkı: kullanıcısı anonim/geniş kitle olabilir, performans ve erişilebilirlik pazarlık konusu değildir, ve çoğu zaman `renderStrategy: custom` (Bölüm 5) ile bespoke render ister.

Her tip kısa bir **davranış sözleşmesi** taşır — yani "ne gösterir" değil, "nasıl davranır". Çizim yok; davranış tanımı var.

| Tip | Davranış sözleşmesi (özet) |
|---|---|
| `feed` | Sonsuz kaydırma; sıralama/ranking kuralı; gerçek-zaman öğe ekleme; cursor-sayfalama + sanallaştırma zorunlu |
| `media-room` | WebRTC (tarayıcıda eşler-arası ses/görüntü); ekran paylaşımı; ızgara/konuşmacı görünümü; katılım (presence) durumu |
| `map-live` | Hareketli konum akışı; rota + ETA; `scale-gis` MVT tile + zoom-LOD tüketir; `geo-map-surface` bunun custom örneğidir; tablo-fallback zorunlu |
| `conversation` | Thread; okundu-bilgisi; yazıyor-göstergesi; presence; mesaj optimistic-gönderim ve yeniden-deneme |
| `page-builder` | Sürükle-bırak blok editörü (WYSIWYG); blok şeması; taslak/yayın durumu; içerik versiyonlama |
| `data-grid` | Hücre-düzenleme; formül; kopyala-yapıştır; sanallaştırılmış satır/kolon; toplu doğrulama |
| `storefront-plp` | Ürün liste (PLP = product listing page); facet filtre; SEO-kritik (sunucu-render); dönüşüm-odaklı sıralama |
| `storefront-pdp` | Ürün detay (PDP = product detail page); varyant seçimi; sepete-ekle optimistic; SEO + zengin-sonuç meta |

**Aktör açıklığı.** *Geliştirici* Consumer-Surface tipini ve davranış parametrelerini beyan eder; *sistem* gerçek-zaman öğelerini (feed ekleme, presence) akıtır; *CI* performans/erişilebilirlik bütçesini ölçer. `map-live` ve `media-room` gibi WebGL/WebRTC yüzeyleri erişilemez olabileceğinden **erişilebilir eşdeğer** (tablo/liste, metin) Bölüm 8 gereği zorunludur.

---

## 4. Shop-Surface tip ailesi (üretim)

Shop-Surface, fabrika sahasına (shop-floor) bakan üretim yüzeyi ailesidir. Kullanıcısı ofis kullanıcısından **temelden farklıdır**: eldiven, dokunmatik, parlak/tozlu ortam, barkod/QR tarayıcı, tek elle çalışma, bağlantı kesintisi, ve hata pahalıdır (yanlış lot = geri-çağırma). Bu aile MRP/MES (üretim yürütme) yüzeyini karşılar. Fabrika-bağlamı sözleşmesi Bölüm 10'da (`factoryContext`), endüstriyel erişilebilirlik Bölüm 8'de ayrıca tanımlanır.

Bu yüzeyler yüksek oranda `renderStrategy: custom` olur (offline kuyruk, barkod-öncelikli giriş, gerçek-zaman SLA jenerik render'a sığmaz) — ama yönetişimi (izin/audit/i18n) korurlar.

| Tip | Davranış sözleşmesi (özet) |
|---|---|
| `terminal` | Üretime başla/durdur/tamamle, malzeme tüket, fire gir; **offline-first** (kuyruk + çakışma-çözüm); **barkod öncelikli** giriş; **tek-el** ergonomi; "onaysız devam etme" kilidi |
| `andon` | Canlı hat durumu (yeşil/sarı/kırmızı + duruş nedeni); **2 saniye** tazeleme; renk-körü-güvenli (renk + şekil); kopukluk davranışı beyanlı |
| `gantt-schedule` | APS (advanced planning & scheduling = ileri çizelgeleme) çıktısı: iş merkezi × zaman; sürükle-bırak yeniden-çizelge; kilit/dondurma penceresi |
| `kanban-flow` | Üretim akış panosu; WIP (work-in-progress) kolonları; çekme (pull) sinyali; kolon kapasite sınırı |
| `oee-dashboard` | OEE (overall equipment effectiveness = genel ekipman etkinliği) = availability × performance × quality; hat/vardiya/makine kırılımı; formül-bağlı; canlı |
| `work-instruction` | Dijital iş talimatı viewer; adım-adım görsel/video; onay-imza; **versiyon-kilitli** (yayınlanan talimat değişmez) |

**Aktör açıklığı.** *Operatör* terminalde üretim kaydı girer (çoğu zaman offline); *sistem* online olunca idempotent senkron + çakışma-çözümü uygular ve sonucu operatöre gösterir; *andon sistemi* hat olayını 2 saniye içinde ekrana yansıtır. Bu aile için "web a11y" değil "endüstriyel HMI (human-machine interface = insan-makine arayüzü) ergonomisi" geçerlidir (Bölüm 8).

---

## 5. renderStrategy — projeksiyon ve custom kaçış kapısı

Surface'in kritik eksiği, SDUI'ın "jenerik tavanı" ile "sözleşme-dışına kaçış" arasında orta yol olmamasıydı: her yüzey ya jenerik projeksiyondu ya da katalog-dışı bir kenar bileşeni (yönetişimi kaybederek). `renderStrategy` bu ikiliyi çözer.

**`projected`** — SDUI/jenerik. Panel `SurfaceContract`'ı okuyup yüzeyi otomatik çizer. Admin-Surface'in varsayılanıdır. Hız ve tutarlılık verir; marka-özel/performans-özel cila veremez.

**`custom`** — elle-yazılan bespoke bileşen. Render kodu geliştirici tarafından yazılır (ör. `geo-map-surface` = deck.gl + MapLibre sarmalayıcısı). Ama şu **kritik invariant korunur**:

> Jenerik render'dan kaçmak, yönetişimden kaçmak değildir.

Yani `custom` bir yüzey de aynı ArcheType kontratına uyar: aynı **izinler** (`permissions`), aynı **audit** (denetim izi), aynı **i18n** (Bölüm 7), aynı tipli aksiyonlar. Custom yüzey "kenar" değil, **birinci-sınıf custom-surface**tir. Böylece `geo-map-surface` gibi örnekler katalog-dışı olmaktan çıkıp yönetişim kapsamına girer.

**Aktör açıklığı.** *Geliştirici* `renderStrategy: custom` beyan eder ve render'ı yazar; *sistem/CI* yine izin, audit, i18n ve erişilebilirlik kapılarını (Bölüm 6, 8) bu yüzeye de uygular. Custom render, denetimden muaf değildir.

Karar kuralı: iç panel ve standart CRUD → `projected`. Tüketici/üretim yüzeyi, marka-özel deneyim, WebGL/WebRTC, gerçek-zaman SLA → `custom` (yönetişim korunarak).

---

## 6. Render / performans sözleşmesi

"Yüksek performanslı" iddiası **ölçülemezse** anlamsızdır. Surface bu nedenle hangi render/cache/performans stratejisini seçtiğini **beyan eder**; CI bunu ölçüp bloklar. Bu blok özellikle Consumer-Surface (vitrin, feed) ve Shop-Surface (canlı pano) için zorunludur.

Terimler ilk geçişte: SSR (server-side rendering = sunucuda çizip HTML gönderme, SEO ve ilk-boya için) · CSR (client-side rendering = istemcide çizme) · edge (kullanıcıya yakın kenar düğümünde çizme) · static (önceden üretilmiş sabit HTML) · streaming (sayfayı parça parça gönderme) · cache-tag (önbellek etiketi; veri değişince o etikete bağlı önbellek geçersizleşir) · revalidate (önbelleğin tazelenme süresi/koşulu) · cursor-pagination (imleç-tabanlı sayfalama, büyük listede offset'ten sağlam) · virtualization (yalnız görünür satırları render etme) · CWV (Core Web Vitals = Google'ın çekirdek kullanıcı deneyimi metrikleri).

`rendering` bloğu şu alanları taşır:

| Alan | Ne beyan eder |
|---|---|
| `mode` | ssr / csr / edge / static (yüzey nerede çizilir) |
| `streaming` | Parça-parça render açık mı (bool) |
| `cacheTags[]` + `revalidate` | Hangi etiketler; ne zaman/ne sıklıkta tazelenir |
| `pagination` | offset / cursor / virtualized |
| `imageStrategy` | Görsel boyutlama/format/lazy yükleme kuralı |
| `cwvBudget` | LCP / INP / CLS hedefleri (bkz. aşağı) |

CWV bütçesi (`cwvBudget`) üç metrikten oluşur: **LCP** (Largest Contentful Paint = en büyük içeriğin boyanma süresi; "iyi" ≤ 2.5 sn), **INP** (Interaction to Next Paint = etkileşimden sonraki boyaya gecikme; "iyi" ≤ 200 ms), **CLS** (Cumulative Layout Shift = kümülatif düzen kayması; "iyi" ≤ 0.1). Sayısal hedefler yüzey başına bütçelenir.

**Aktör açıklığı.** *Geliştirici* `rendering` stratejisini beyan eder; *CI* CWV bütçesini **Lighthouse** (sayfa performans denetleyicisi) ve **Playwright** (uçtan-uca tarayıcı testi) ile ölçer ve bütçe aşılırsa **bloklar**; *sistem* ArcheType yazımında `cacheTags`'i geçersizleştirir (outbox → cache). Böylece performans "umut" değil, kapılı bir sözleşme olur.

---

## 7. i18n / RTL / locale sözleşmesi

Global ürün için i18n (internationalization = uluslararasılaştırma) **zorunludur**; opsiyon değildir. HRMS, e-posta, CMS, ticaret yüzeyleri farklı dil/bölge/yön altında doğru davranmalıdır. Surface bu davranışı **beyan eder**; jenerik render onu uygular.

Terimler ilk geçişte: locale (dil + bölge birleşimi, ör. `tr-TR`, `ar-EG`) · CLDR (Common Locale Data Repository = Unicode'un locale biçimlendirme veri tabanı; tarih/para/sayı biçimleri) · RTL (right-to-left = Arapça/İbranice gibi sağdan-sola yazım yönü) · ICU MessageFormat (çoğul/cinsiyet/seçim kurallarını taşıyan mesaj biçimi standardı) · pseudo-localization (sahte-yerelleştirme = metni yapay olarak uzatıp aksanlayarak taşma/kırılma bulan test tekniği).

`i18n` bloğu şu davranışları beyan eder:

| Alan | Ne beyan eder |
|---|---|
| `localeFormatting` | Tarih/para/sayı locale-farkında biçimlenir (CLDR tabanlı) |
| `rtl` | auto / true / false (yön; `auto` = locale'den türet) |
| `pluralRules` | Çoğul-kuralı ICU MessageFormat ile (dilde 1/2/çok farkı) |
| `pseudoLocaleTest` | Pseudo-localization testi açık mı (taşma/kırılma yakalar) |

Enum ve etiket çevirileri Surface'te tekrar yazılmaz; **ArcheType'ın i18n-text alanıyla bağlanır** (tek-kaynak çeviri). Böylece bir durum/etiket bir kez çevrilir, tüm yüzeyler o çeviriyi tüketir; çeviri drift'i (aynı terimin farklı yerde farklı çevrilmesi) engellenir.

**Aktör açıklığı.** *Geliştirici* i18n davranışını beyan eder; *sistem* locale'e göre biçimlendirir ve yönü çevirir; *CI* pseudo-localization testiyle taşan/kırılan yüzeyi yakalar. Çeviri içeriğinin sahibi ArcheType i18n-text alanıdır.

---

## 8. Erişilebilirlik (a11y)

Erişilebilirlik taban seviyesi **WCAG 2.2 AA zorunludur**. WCAG (Web Content Accessibility Guidelines = web içeriği erişilebilirlik kılavuzu) üç uyum seviyesi tanımlar: A < AA < AAA.

**Neden AA taban, AAA değil?** AAA çoğu tüketici/marka yüzeyinde **ulaşılamaz**: 7:1 kontrast (marka renkleri çoğu zaman geçmez), metin-içeren-görsel kısıtı, video için işaret-dili zorunluluğu, hiçbir zaman-sınırı olmaması. WCAG'in kendisi "AAA tüm içerik için genel politika olarak zorunlu tutulamaz" der. AAA'yı global varsayılan yapmak conformance kapısını çökertir: her tüketici yüzeyi kendi kapıdan geçemez → ya kapı devre dışı bırakılır (kötü) ya sürekli waiver yazılır (gürültü). AA ayrıca çoğu bölgede **yasal tabandır** (EN 301 549, ADA).

Karar: varsayılan `wcag: "2.2-AA"` (yasal + uygulanabilir taban). AAA yüzey-bazında `aspirational` (hedef) alanı olarak beyan edilir — conformance kapısı AA'yı **zorlar**, AAA'yı **raporlar** (bloklamaz). Not: mevcut `src/schemas/surface.ts` varsayılanı bugün `2.2-AAA`'dır; bu doküman onu AA tabana indirmeyi normatif karar olarak sabitler (bkz. Bölüm 13, ADR-S5).

**Endüstriyel HMI (shop-floor) — a11y'nin fabrika versiyonu.** Shop-Surface için "web a11y" yetmez; endüstriyel ergonomi gerekir:

- **Kontrast AA-üstü** — parlak/tozlu ortamda okunabilirlik (AA eşiğinin ötesi).
- **Dokunma hedefi ~64px** — eldivenli parmak için (web'in ~44px hedefinin çok üstü).
- **Renk-körü-güvenli andon** — durum yalnız renkle değil **renk + şekil** ile (kırmızı/yeşil ayrımı renk-körü operatörde çökmemeli).
- Gürültüde **sesli-değil-görsel** geri-bildirim önceliği.

**Aktör açıklığı.** *Geliştirici* yüzeyin WCAG seviyesini ve (Shop-Surface'te) HMI profilini beyan eder; *CI* AA ihlallerini axe (erişilebilirlik denetleyicisi) + Playwright ile bloklar, AAA'yı raporlar. WebGL/WebRTC yüzeyleri (map-live, media-room) için erişilebilir eşdeğer (tablo/metin) zorunludur.

---

## 9. Etkileşim / durum sözleşmesi

UX, **ne gösterildiği kadar nasıl davrandığıdır**; kalitenin büyük kısmı durum-geçişlerindedir. Surface bugün "ne gösterileceğini" (`elements`) ve "hangi aksiyonu" (`actions`) taşır ama durum davranışını beyan etmez. Bu bölüm o boşluğu kapatır: durum davranışı **sözleşmedir**, stil değil — böylece tenant/edition başına tutarlı UX garanti edilir.

`states` bloğu her yüzeyin şu durumlardaki davranışını tanımlar (metin + afordans; çizim değil):

| Durum | Beklenen davranış |
|---|---|
| `empty` | Boş-durum: neden boş, ne yapılabilir (afordans), yönlendirici metin |
| `loading` | Yükleniyor: skeleton (içerik iskeleti) veya ilerleme; içerik-kayması yok (CLS korunur) |
| `error` | Hata: ne oldu + yeniden-deneme yolu; metinsel (yalnız renkle değil) |
| `optimistic` | İyimser-güncelleme: aksiyon sonucu beklemeden ekranda; başarısızsa geri-al |

Ek davranış sözleşmeleri: **mikro-etkileşim** (küçük geri-bildirim animasyonu; `prefers-reduced-motion` = kullanıcının hareket-azaltma tercihini onurlandırır), **odak-yönetimi** (klavye odağı mantıksal sırada; modal açılınca odak tuzağı, kapanınca geri-dönüş), **bağımlı-alan görünürlüğü** (bir alanın değeri diğerini gösterir/gizler).

**Aktör açıklığı.** *Geliştirici* durum davranışını beyan eder; *istemci* optimistic güncellemeyi TanStack Query ile uygular ve başarısızlıkta geri-alır (rollback); *kullanıcı* her durumda ne olduğunu metinden anlar (renk-bağımsız).

---

## 10. factoryContext (shop-floor bağlamı)

Shop-Surface yüzeyleri fabrika sürekliliğini garanti etmek için ek bir bağlam sözleşmesi taşır: `factoryContext`. Bu, Bölüm 4'teki tiplerin *nasıl* çalışacağını (offline, gerçek-zaman, giriş) beyan eder.

Terimler ilk geçişte: idempotency (aynı işlemin tekrarı tek etki yaratır; offline kuyruk iki kez gönderirse çift kayıt olmaz) · realtime SLA (service level agreement = olaydan ekrana izin verilen azami gecikme) · çakışma-çözüm (aynı kaydı iki kaynak değiştirince hangisi kazanır ve operatöre nasıl gösterilir).

| Alan | Ne beyan eder |
|---|---|
| `offline` | Yüzey offline çalışır mı; hangi aksiyonlar kuyruklanır; senkronda çakışma nasıl çözülür; idempotency anahtarı |
| `realtimeSLA` | Olay → ekran azami gecikme (ms); tazeleme sıklığı; kopukluk davranışı (ör. andon 2 sn) |
| `inputMode` | Giriş önceliği: barcode / touch / keyboard (fabrikada barkod öncelik) |

**Aktör açıklığı.** *Operatör* offline'da kayıt girer; *sistem* online olunca idempotent senkron + çakışma-çözümü uygular ve **sonucu operatöre gösterir** (hangi kayıt kazandı); *andon sistemi* olayı `realtimeSLA` içinde ekrana yansıtır. Offline üretilen kayıt ArcheType migration-policy (append-only) ile çelişirse çözüm burada beyan edilir.

---

## 11. white-label / tenant-tema

Boyut-3 tenant'ları kendi markalarını ister (white-label = markasız/marka-değiştirilebilir ürün). Surface bu nedenle tenant-başına **tema/token override** (varsayılan tasarım değerini tenant değeriyle değiştirme) sözleşmesi taşır. Token = tek-kaynak tasarım değeri (renk, boşluk, tipografi ölçeği, yarıçap, gölge, hareket); `design-system` standardında (ADR-0027) tanımlıdır ve SCSS ile yazılır.

`theming` bloğu tenant'ın override edebileceği token setini beyan eder. Kritik kural — **kontrast kapısı**:

> Tema-override, erişilebilirlik-kontrast kapısını tetikler. Tenant güzel ama **erişilemez** tema seçemez.

Yani tenant marka rengini değiştirdiğinde, seçilen renk WCAG AA kontrast eşiğini (Bölüm 8) düşürüyorsa **override reddedilir/uyarılır**. Bu, white-label esnekliğini erişilebilirlik tabanının altına inmeden verir.

**Aktör açıklığı.** *Tenant yöneticisi* token override seçer; *sistem/CI* seçilen tema-token'ının AA kontrastını doğrular ve ihlalde bloklar; *geliştirici* override edilebilir token setini `theming`'de sınırlar (her token serbest değildir).

---

## 12. AI-first yüzey tipleri

AI-first, platformun #1 önceliğidir; ama kullanıcının AI ile **temas ettiği yüzey** katalogda birinci-sınıf olmalıdır. ArcheType tarafındaki AI politikası (`aiPolicy`, `ADMIN_FLOW`) bir *düzenleme akışıdır*; bir *yüzey tipi* değildir. Bu bölüm AI-yüzey tiplerini tanımlar.

Bu yüzeylerin tümü tek bir **invariant**a bağlıdır — actionplan'ın çekirdek AI güvenlik ilkesi:

> Kullanıcı niyet söyler → AI önizler/önerir (uygulamaz) → insan onaylar → motor uygular.

| Tip | Davranış sözleşmesi (özet) |
|---|---|
| `assistant` | Gömülü copilot; bağlam = `archetypeRef` (yüzeyin ArcheType'ını bilir); soru-cevap + eylem önerisi |
| `command-palette` | Her yüzeyde ⌘K (komut paleti); eylem + arama + navigasyon; klavye-öncelikli |
| `nl-query` | Doğal-dil → yapısal sorgu ("geçen ay geciken siparişler"); PDP-farkında (izin-simülasyonu ile yalnız yetkili veri) |
| `generative-view` | AI bir yüzey/pano taslağı **önerir** → ADMIN_FLOW ile **insan onayı** → uygulanır |

Terim: PDP (permission decision point = izin karar noktası; bir sorgunun/aksiyonun yetkili olup olmadığını çalıştırmadan simüle eder). `nl-query` doğal dilden ürettiği sorguyu PDP'den geçirir; kullanıcı yetkisiz veriyi doğal dille de isteyemez.

**Aktör açıklığı (bu ailenin özü).** *Kullanıcı* niyeti doğal dille söyler; *AI* taslak/önizleme üretir ama **uygulamaz**; *insan* onaylar; *motor* uygular. `generative-view` bu invariant'ın görünen yüzüdür: AI yalnız **öneren** seviyesinde kalır (teşhis/öneri sınırında), asla doğrudan main'e/veriye yazan seviyede değil. Konuşma yüzeyi güçlü ama tehlikelidir (kullanıcı doğal dille yıkıcı şey isteyebilir); bu yüzden ADMIN_FLOW + PDP + insan onayı zorunludur.

---

## 13. Kilitlenecek ADR taslakları

Aşağıdaki kararlar bu spesifikasyondan türer ve ayrı ADR (Architecture Decision Record) olarak kilitlenmelidir. Her biri kısa; öneri sütunu bu dokümanın normatif duruşudur.

| ADR | Karar | Öneri |
|---|---|---|
| ADR-S1 | Admin / Consumer / Shop yüzeyleri tek tipe mi, ayrı tip ailelerine mi ait? | Ayrı üç aile (Bölüm 2-4) |
| ADR-S2 | `renderStrategy: projected \| custom`; custom yönetişimi (izin/audit/i18n) korur mu? | Evet, korur (Bölüm 5) |
| ADR-S3 | Surface render/cache/CWV beyan eder mi; CI (Lighthouse/Playwright) ölçer mi? | Evet, kapılı (Bölüm 6) |
| ADR-S4 | AI-first yüzey tipleri (assistant/command-palette/nl-query/generative-view) kataloğa girer mi? | Evet, PDP + ADMIN_FLOW + insan onayına bağlı (Bölüm 12) |
| ADR-S5 | WCAG taban seviyesi AAA mı AA mı? | AA zorunlu + AAA yüzey-bazında `aspirational` (Bölüm 8) |
| ADR-S6 | i18n/RTL/locale + white-label tema Surface sözleşmesine mi girer? | Evet, a11y-kontrast kapısıyla korumalı (Bölüm 7, 11) |
| ADR-S7 | Shop-Surface `factoryContext` (offline/realtimeSLA/inputMode) + endüstriyel HMI profili sözleşmeye mi girer? | Evet (Bölüm 4, 8, 10) |

---

## 14. Risk keşfi — unknown-unknowns

- **Surface ↔ ArcheType versiyon kayması:** Surface v2 bir alan bekler, ArcheType v1 henüz eklememişse render ne yapar? (Ayrı versiyonlamanın gölge yüzü — fail-safe davranış beyanı gerekir.)
- **SDUI güven sınırı:** sunucu-güdümlü UI istemciye "ne render edeceğini" söyler; ele-geçirilmiş/kötü sözleşme XSS/clickjacking vektörü olabilir. Surface sözleşmesi de bir saldırı yüzeyidir; render eden taraf sözleşmeyi doğrulamalı.
- **Data-viz erişilebilirliği:** grafik/dashboard için tablo-fallback her yüzeyde zorunlu mu? Görme-engelli için grafik = erişilemez ada (`geo-map-surface` iyi örnek).
- **White-label kontrast tuzağı:** tenant markası AA kontrastı düşürürse tema-override a11y-kapısı tetiklenmeli (Bölüm 11 bunu sabitler).
- **Offline çakışma × append-only:** `terminal` offline kaydı ArcheType migration-policy (append-only) ile çelişirse çözüm `factoryContext.offline`'da beyanlı olmalı.
- **Doküman/print + e-posta-HTML yüzeyi:** fatura yazdırma (sayfa-kırma) ve transactional mail (Outlook table-based, CSS-kısıtlı düşman ortam) bu katalogda birinci-sınıf tip değil; nerede modellenecek — açık soru.
- **Custom render denetim kaçağı:** `renderStrategy: custom` yönetişimi koruma sözü verir; CI custom yüzeylerde de izin/audit/i18n/a11y'yi gerçekten zorluyor mu — kapı kapsamı doğrulanmalı.

---

*Bağlı dokümanlar: `elestiri-03-surface-2026-07-01.md` (bu spesifikasyonun analiz temeli) · `mrp-surface-2026-07-01.md` (Shop-Surface gerekçesi) · ADR-0026 (tech-profiles; `techProfileRef`) · ADR-0027 (mühendislik standartları; design-system/ux-interaction/ui-components) · `docs/ci-conformance-gates.md` (CI kapıları) · `docs/adr-geo-visualization.md` (`map-live` / `geo-map-surface` custom örneği). Bağlı düğümler: `k-surface`, `k-surface-consumer`, `k-control-planes`, `geo-map-surface`.*
