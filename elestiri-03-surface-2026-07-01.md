# Rapor 3 — Surface Katmanı Eleştirisi

**Tarih:** 2026-07-01 · **Kaynak:** `src/schemas/surface.ts`, `k-surface`, `k-control-planes`, `k-boyut1/2/3`, `geo-map-surface`, `fe-ai-rt`, `platform-ui-surface`, ADR-0026 (tech-profiles) · **Mercekler:** UX (ağır), AI-First (ağır), yüksek-trafik (orta).

---

## 1. Surface nedir / ne yapar / ne yapmaz

**Bu nedir?** Surface, bir ArcheType'ın kullanıcıya gösterilen **projeksiyonudur** (izdüşümü): liste, detay, form, board, dashboard, wizard, report, timeline. Sizin `k-surface` tanımınızla: "ArcheType'ın UI/API/DB projeksiyonu; tek tanımdan form+tablo+endpoint türer." ArcheType'tan **ayrı versiyonlanır** — bu doğru ve olgun bir ayrım.

**Ne işe yarar?** Aynı ekran desenini (ör. "liste görünümü") birçok ArcheType'a yeniden uygulamayı ve yüzeyi veriden bağımsız evrimleştirmeyi sağlar. Panel (Küme E) bu sözleşmeyi okuyup render eder; yani **server-driven UI (SDUI)** — sunucudaki sözleşme neyin nasıl görüneceğini söyler, istemci onu çizer.

**Ne yapar?** `SurfaceContractSchema` taşır: tip, projekte ettiği ArcheType referansı, gösterilen elemanlar, tipli aksiyonlar, filtreler, layout (table/cards/split/grid/stepper/chart), responsive (mobile: stack/scroll/hidden), a11y (WCAG 2.2-AAA, klavye, metinsel-durum), izinler, tech-profil referansı. Workflow ise davranışı (durum makinesi) ayrı taşır.

**Ne yapmaz?** Surface **UI kodu değildir** (sözleşmedir); **iş mantığı taşımaz** (ArcheType'ta); **serbest bileşen render etmez** (katalogdaki tiplerle sınırlı). Bu raporun tezi: Surface **iç yönetim (admin/CRUD) yüzeyini olağanüstü modelliyor; ama tüketici, yüksek-trafik, gerçek-zaman ve AI-first yüzeylerini katalogunda barındırmıyor** — ve sizin en çok önemsediğiniz şey (UX) tam da bu boşlukta.

---

## 2. Adil değerlendirme — neyi gerçekten iyi yapıyor

SDUI yaklaşımı, iç paneller için **hız** demektir: yeni bir ArcheType tanımlayınca liste/detay/form otomatik gelir. `k-boyut2` (developer paneli) ve `k-boyut3` (tenant paneli) için bu ideal — Directus/Frappe Desk sınıfı üretkenlik.

ArcheType'tan **ayrı versiyonlama** doğru: yüzeyi veriden bağımsız değiştirebilmek olgun bir mimari. `techProfileRef` ile teknolojinin Surface seviyesinde bağlanması (ADR-0026) — "her yüzey kendi render profilini seçebilir" — ileri görüşlü.

A11y'yi sözleşmeye gömmek (klavye navigasyonu, "durum yalnız renkle değil metinle de") **niyet olarak** çoğu üründen ileri. `geo-map-surface` (deck.gl+MapLibre, WCAG tablo-fallback, MVT/H3 tüketir) gösteriyor ki özel yüzeyler *yapılabiliyor*. `fe-ai-rt` (Vercel AI SDK, SSE+WS+Yjs CRDT, offline) gösteriyor ki AI/realtime/collaborative *frontend'de biliniyor*.

Yani yetenek var. Sorun: bu ileri örnekler (geo, ai-rt) **katalogda birinci-sınıf surface tipi değil** — tek tek, kenarda. Katalog hâlâ 8 admin-tipiyle sınırlı.

---

## 3. Zayıflık nedenleri — kök sebep analizi

### 3.1 Kök sebep: 8-tip katalog admin/CRUD-merkezli; tüketici yüzeyi yok

`SurfaceTypeSchema` = list/detail/form/board/dashboard/wizard/report/timeline. Bu sekizi bir *kaydı yönetmenin* sekiz yoludur — iç panel için harika. Ama portföyünüzün tüketici tarafı bu sekize **indirgenmez**:

- **Sosyal akış (feed)** — sonsuz kaydırma, sıralama/ranking, gerçek-zaman ekleme (Social).
- **Video/çağrı odası** — WebRTC, ekran paylaşımı, ızgara/konuşmacı görünümü (Teams-benzeri).
- **Canlı harita/filo takibi** — hareketli konum, rota, ETA (Fleetx). `geo-map-surface` var ama tek ArcheType-surface'i; *tip* değil.
- **Sohbet/gelen-kutusu** — thread, okundu-bilgisi, yazıyor-göstergesi (Email, Teams, WhatsApp-ticaret).
- **Sayfa-kurucu / WYSIWYG** — sürükle-bırak içerik, blok editörü (CMS: "Drupal gücü, WordPress basitliği").
- **Izgara/hesap-tablosu** — hücre-düzenleme, formül, kopyala-yapıştır (Muhasebe).
- **Medya galerisi / dosya-tarayıcı** — önizleme, klasör ağacı (Drive).
- **Vitrin PDP/PLP** — ürün-detay/liste, SEO-kritik, dönüşüm-odaklı (Commerce).

`k-control-planes` dördüncü düzlemi ("Public/Frontpages") tanıyor — yani tüketici yüzeyinin *var olduğunu* biliyorsunuz. Ama `surface.ts` bu düzlem için tip **sağlamıyor**. Model, "bir kaydın iç projeksiyonu" ile "bir tüketici ürün-yüzeyi"ni aynı sözleşmeye sıkıştırıyor; ikisi farklı disiplin. ChatGPT de bunu ayırmıştı (Admin API ↔ Storefront API/SDK).

### 3.2 Kök sebep: SDUI tavanı + "kaçış kapısı" yok

Server-driven UI'ın doğası: sözleşme ne kadar zenginse o kadar iyi, ama **şema-render her zaman jenerik kalır**. "Facebook kadar kapsamlı, Twitter kadar sade, YouTube kadar stream-odaklı, yüksek performanslı" dediğiniz cila, şema-render'la üretilemez — bespoke (elle-yazılmış), performans-ayarlı, marka-özel bileşen ister.

Kritik eksik: sözleşmeye **bağlı ama elle-yazılmış** bir "custom surface" yolu yok. Yani her şey ya projeksiyon (jenerik) ya da katalog-dışı (geo-map gibi kenar). Doğru desen: bir custom bileşen, ArcheType kontratına *uyar* (aynı izin/aksiyon/veri sözleşmesi), ama render'ı elle yazılır. Bu "kaçış kapısı" olmadan, tüketici UX'i ya jenerik kalır ya sözleşme-dışına kaçıp yönetişimi (izin/audit/i18n) kaybeder.

### 3.3 Kök sebep: "Sözleşme olarak UX" → jenerik-UX riski; etkileşim/durum sözleşmesi yok

Surface bugün *ne gösterileceğini* (elements) ve *hangi aksiyonların* olduğunu taşıyor. Ama UX **ne gösterildiği kadar nasıl davrandığıdır**. Sözleşmede eksik olanlar: boş-durum (empty state), yükleniyor (skeleton/loading), hata-durumu, iyimser-güncelleme (optimistic UI) davranışı, mikro-etkileşim/animasyon, odak-yönetimi, bağımlı-alan görünürlüğü. Bunlar "stil" değil; UX'in %80'i bu durum-geçişlerindedir. `platform-ui-surface` (React/Vite/TanStack) altyapıyı biliyor ama Surface *sözleşmesi* bu davranışları beyan etmiyor — yani tenant/edition başına tutarlı UX garantisi yok.

### 3.4 Kök sebep: AI-First bir "surface tipi" değil (oysa #1 önceliğiniz)

AI-first'ü ArcheType tarafında sözleşmeye gömmüşsünüz (`aiPolicy`, `ADMIN_FLOW`). Ama **kullanıcının AI ile temas ettiği yüzey** katalogda yok. Eksik AI-yüzeyleri:

- **Konuşma/agentik yüzey** — doğal dille komut ("bu tenant'ı B2B'ye çevir", "geçen ay geciken siparişleri getir"), `k-agent-runtime`'ı kullanıcıya açan panel.
- **Komut paleti (command palette)** — her yüzeyde ⌘K ile eylem/arama.
- **Generatif dashboard/rapor** — "şu KPI'yı gösteren pano üret" → AI taslak surface önerir, insan onaylar.
- **Gömülü copilot** — her surface'in yanında bağlam-farkında yardımcı.

`ADMIN_FLOW` (prompt→draft→...→apply) bir *ArcheType düzenleme akışı*; bir *surface tipi* değil. AI-first iddiasının kullanıcı-yüzü eksik. **Aktör açıklığı:** konuşma yüzeyinde *kullanıcı* niyet söyler; *AI* taslak/önizleme üretir (uygulamaz); *insan* onaylar; *motor* uygular — yani surface, sizin "AI önerir, insan onaylar" invariant'ınızın görünen yüzü olmalı.

### 3.5 Kök sebep: Render/cache/performans sözleşmesi yok (yüksek-trafik)

Surface `responsive` (mobile: stack/scroll/hidden) ve `a11y` taşıyor ama **render/performans sözleşmesi yok**: SSR mi CSR mi edge mi (sunucuda mı istemcide mi çizilecek), streaming/ISR (kısmi-render), büyük liste için sanallaştırma (virtualization) ve sayfalama sözleşmesi, görsel stratejisi, cache-tag/invalidation, Core Web Vitals bütçesi (LCP/INP/CLS hedefi). Bir vitrin PLP'si veya sosyal feed yüksek-trafikte bunları *beyan etmek* zorunda. `techProfileRef` (ADR-0026) bir kanca ama Surface'in kendisi hangi render/cache stratejisini seçtiğini söylemiyor. Bu olmadan "yüksek performanslı" iddiası ölçülemez.

### 3.6 Kök sebep: WCAG 2.2 **AAA** varsayılanı aşırı-iddia (kendi gate'inizi çökertir)

`SurfaceA11ySchema` varsayılanı `wcag: "2.2-AAA"`. Terminoloji: WCAG = web erişilebilirlik standardı; A < AA < AAA seviyeleri. **AAA gerçekçi değildir**: 7:1 kontrast (marka renkleri çoğu zaman geçmez), metin-içeren-görsel yasağı, video için işaret-dili, hiçbir zaman-sınırı — tüketici/marka yüzeyinde çoğu kriter ulaşılamaz. WCAG'in kendisi "AAA tüm içerik için genel politika olarak zorunlu tutulamaz" der.

Risk: conformance gate'iniz AAA'yı zorlarsa, **her tüketici surface'i kendi kapınızdan geçemez** — ya gate'i devre dışı bırakırsınız (kötü) ya sürekli waiver yazarsınız (gürültü). **Güvenli / riskli / enterprise / sizin durumunuz:** Güvenli = AA tabanı + AAA'yı yüzey-bazında *hedef*. Riskli = AAA'yı global varsayılan tutmak (yanlış-güvenlik + gate tıkanması). Enterprise-doğru = AA zorunlu (yasal taban çoğu bölgede AA — EN 301 549, ADA), AAA opsiyonel-hedef. Sizin durumunuz: varsayılanı `2.2-AA` yapın; AAA'yı `aspirational` alanı olarak yüzeye bırakın.

### 3.7 Kök sebep: i18n/RTL, gerçek-zaman/collaborative, white-label sözleşmede yok

- **i18n/RTL/locale:** HRMS/Email/CMS global. Surface, RTL (Arapça/İbranice sağdan-sola), CJK satır-kırma, locale-biçimlendirme (tarih/para/sayı), çoğul-kuralı davranışını **beyan etmiyor**. `l1-misc` i18n'i biliyor ama surface sözleşmesi locale-davranışı taşımıyor.
- **Gerçek-zaman/collaborative:** `fe-ai-rt` Yjs CRDT'yi (çakışmasız ortak-düzenleme) biliyor ama Surface "bu yüzey collaborative" (presence/canlı-imleç/çakışma-çözümü) diye beyan edemiyor. Drive dokümanı, CMS ortak-düzenleme bunu ister.
- **White-label/tema:** Boyut-3 tenant'ları kendi markalarını ister. Surface tenant-başına tema/token override sözleşmesi taşımıyor.

---

## 4. Gap analizi — önceliklendirilmiş

Sade özet: Surface boşlukları iki eksende — (a) *katalog dar* (tüketici/AI/collaborative tipleri yok), (b) *sözleşme sığ* (render/perf, etkileşim/durum, i18n/RTL, tema beyanı yok). İkisi birleşince "yüksek performanslı, delightful, AI-first UX" iddiası sözleşme düzeyinde desteksiz kalıyor.

| # | Boşluk | Öncelik | Mercek | Bloke ettiği |
|---|---|---|---|---|
| 1 | Tüketici surface tipleri (feed/video/harita/chat/page-builder/grid/PDP) | P0 | UX | Social, Teams, Fleetx, CMS, Commerce, Email |
| 2 | Custom-surface kaçış kapısı (kontrata-bağlı, elle-render) | P0 | UX | Tüm delightful tüketici UX |
| 3 | AI-first surface tipi (konuşma/komut-paleti/generatif) | P0 | AI-First | AI-first iddiasının kullanıcı-yüzü |
| 4 | Render/cache/perf sözleşmesi (SSR/edge/virtualization/CWV) | P0 | Yüksek-trafik | Vitrin, feed, ölçülebilir performans |
| 5 | WCAG varsayılanını AA'ya indir, AAA'yı hedef yap | P1 | UX | Conformance gate tıkanması, yasal taban |
| 6 | Etkileşim/durum sözleşmesi (empty/loading/error/optimistic/motion) | P1 | UX | Tutarlı UX kalitesi |
| 7 | i18n/RTL/locale beyanı | P1 | UX | HRMS, Email, CMS global |
| 8 | Gerçek-zaman/collaborative beyanı (presence/CRDT) | P1 | UX/AI | Drive, CMS ortak-düzenleme |
| 9 | White-label/tenant-tema sözleşmesi | P2 | UX | Boyut-3 marka ihtiyacı |
| 10 | Doküman/print + e-posta-HTML surface (fatura, transactional mail) | P2 | UX | Muhasebe, Email |

---

## 5. Önerilen tasarım (mimari tarif — sizin kuralınızla: çizim değil, tanım)

Kurallarınıza uyarak yüzeyleri **çizmiyorum**; sözleşme alanı olarak **tanımlıyorum** (bileşen listesi, hiyerarşi, davranış, stil-parametresi, token, responsive, a11y ekseninde).

### 5.1 Surface taksonomisini ikiye ayır: Admin-Surface ↔ Consumer-Surface
- **Admin-Surface** (mevcut 8 tip) — kalsın; SDUI/projeksiyon, iç paneller (Boyut 2/3).
- **Consumer-Surface** (yeni tip ailesi) — feed, media-room (WebRTC), map-live, conversation, page-builder, data-grid, storefront-plp/pdp. Her biri kendi *davranış* sözleşmesiyle (feed: sıralama+sayfalama+realtime-insert; map-live: `scale-gis` + konum-akışı; conversation: thread+presence+okundu).

### 5.2 Custom-surface kaçış kapısı (yönetişimi kaybetmeden)
Yeni `renderStrategy: "projected" | "custom"`. `custom` iken render elle yazılır **ama** kontrat (archetypeRef, izinler, aksiyonlar, i18n, audit) korunur — yani jenerikten kaçarsınız, yönetişimden kaçmazsınız. Böylece `geo-map-surface` gibi örnekler *kenar* değil, *birinci-sınıf custom-surface* olur.

### 5.3 Render/performans sözleşmesi
Surface'e `rendering` bloğu: `mode` (ssr/csr/edge/static), `streaming` (bool), `cacheTags[]` + `revalidate`, `pagination` (offset/cursor/virtualized), `imageStrategy`, `cwvBudget` (LCP/INP/CLS hedefi). **Aktör açıklığı:** *geliştirici* stratejiyi beyan eder; *CI* CWV-bütçesini Lighthouse/Playwright ile ölçüp gate'ler; *sistem* cache-tag'leri ArcheType yazımında invalidate eder (outbox→cache). Bu, "yüksek performanslı" iddiasını **ölçülebilir** yapar.

### 5.4 AI-first surface tipleri
Kataloğa: `assistant` (gömülü copilot, bağlam=archetypeRef), `command-palette`, `nl-query` (doğal-dil→yapısal sorgu, PDP-farkında), `generative-view` (AI surface taslağı önerir → ADMIN_FLOW ile insan onayı). Hepsi `k-agent-runtime`'ı tüketir ve "AI önerir/insan onaylar" invariant'ına bağlıdır.

### 5.5 Etkileşim/durum + i18n/RTL + tema sözleşmesi
- `states`: empty/loading/error/optimistic davranış tanımı (metin+afordans).
- `i18n`: `rtl` (bool/auto), locale-biçimlendirme, çoğul-kuralı; enum/etiket çevirisi ArcheType i18n-text alanıyla bağ.
- `theming`: tenant-override edilebilir token seti (Boyut-3 white-label); `min_text_size`/font/weight gibi kurallarınız burada token olarak sabitlenir.

### 5.6 WCAG hizalaması
Varsayılan `wcag: "2.2-AA"` (yasal taban), surface-bazında `wcagAspirational: "2.2-AAA"` opsiyonel. Conformance gate AA'yı zorlar, AAA'yı *raporlar* (bloke etmez). Bu, hem yasal-güvenli hem gate-uygulanabilir.

---

## 6. Üç mercek — Surface özelinde

### 6.1 UX (bu raporun en ağır merceği)
Özet: mevcut model **iç panel UX'ini** garanti eder, **tüketici UX'ini** garanti etmez. En yüksek getirili üç hamle: (1) Consumer-Surface ayrımı + custom kaçış kapısı (§5.1-5.2) — delightful UX'in önünü açar; (2) etkileşim/durum sözleşmesi (§5.5) — UX kalitesini tenant/edition başına tutarlı kılar; (3) WCAG AA'ya indirme (§5.6) — kendi gate'inizin tüketici yüzeyini boğmasını önler. "Twitter kadar sade, Facebook kadar kapsamlı" ancak custom-surface + davranış-sözleşmesiyle mümkün; saf SDUI ile değil.

### 6.2 AI-First
AI-first'ün kullanıcı-yüzü katalogda yok (§3.4). AI-surface tipleri (§5.4) bunu kapatır. Kritik: konuşma yüzeyi güçlü ama *tehlikeli* bir yüzeydir (kullanıcı doğal dille yıkıcı şey isteyebilir). Bu yüzden AI-surface, PDP (Kernel §5.5) + `ADMIN_FLOW` + `AI_FIX_LOOP`'a bağlanmalı: yüzey *önerir/önizler*, insan *onaylar*. Bu, "sadece teşhis / öneren / değiştiren / PR açan / main'e yazan" ayrımınızda yüzeyi **öneren** seviyesinde tutar.

### 6.3 Yüksek-trafik
Render/perf sözleşmesi (§5.3) olmadan yüksek-trafik surface'i "umut ederek" hızlıdır. Vitrin/feed için SSR/edge + sanallaştırma + cache-tag beyanı + CWV-bütçesi zorunlu. `scale-*` (cache, projections, realtime) motorları var; eksik olan Surface'in **hangi motoru nasıl kullandığını beyan etmesi** — motor ile yüzey arasındaki sözleşme.

---

## 7. Unknown-unknowns — risk keşif checklist'i

- **Surface↔ArcheType versiyon kayması:** Surface v2 bir alan bekler, ArcheType v1 henüz eklememişse render ne yapar? (Ayrı versiyonlamanın gölge yüzü.)
- **SDUI güven sınırı:** sunucu-güdümlü UI, istemciye "ne render edeceğini" söyler; kötü/ele-geçirilmiş sözleşme XSS/clickjacking vektörü olabilir mi? Surface sözleşmesi de bir saldırı yüzeyidir.
- **Data-viz erişilebilirliği:** ECharts grafiklerinin tablo-fallback'i var (`geo-map-surface`'te iyi örnek) ama tüm chart/dashboard için zorunlu mu? Görme-engelli için grafik = erişilemez ada.
- **E-posta-HTML düşman yüzeyi:** transactional mail Outlook'ta render olur (table-based, CSS-kısıtlı); bu bir "surface" mı, değilse fatura/bildirim nerede modellenir?
- **Print/PDF surface:** fatura yazdırma ekran-surface'inden farklı (sayfa-kırma, kenar-boşluğu); doküman-surface ayrı tip mi?
- **Offline surface çakışması:** `fe-ai-rt` offline kuyruk biliyor; offline'da yapılan değişiklik online olunca ArcheType migration-policy (append-only) ile çelişirse?
- **White-label kontrast tuzağı:** tenant kendi markasını seçince WCAG kontrastı düşerse — tema-override a11y-gate'i tetiklemeli (tenant güzel ama erişilemez tema seçemesin).

---

## 8. Kilitlenecek ADR taslakları

- **ADR-S1 — Admin-Surface / Consumer-Surface ayrımı.** Karar: tüketici yüzeyleri mevcut 8 tipe mi sığar, ayrı tip ailesi mi? Öneri: ayrı aile (§5.1).
- **ADR-S2 — Custom-surface kaçış kapısı.** Karar: `renderStrategy: projected|custom`; custom yönetişimi (izin/audit/i18n) korur mu? Öneri: evet (§5.2).
- **ADR-S3 — Render/performans sözleşmesi.** Karar: Surface SSR/edge/cache/CWV beyan eder mi, CI ölçer mi? Öneri: evet (§5.3).
- **ADR-S4 — AI-first surface tipleri.** Karar: assistant/command-palette/nl-query/generative-view kataloğa girer mi? Öneri: evet, PDP+ADMIN_FLOW'a bağlı (§5.4).
- **ADR-S5 — WCAG taban seviyesi.** Karar: varsayılan AAA mı AA mı? Öneri: AA zorunlu + AAA yüzey-bazında hedef (§5.6).
- **ADR-S6 — i18n/RTL + white-label sözleşmesi.** Karar: locale/RTL/tema Surface sözleşmesine mi girer? Öneri: evet, a11y-gate ile korumalı (§5.5).

---

## 9. Öncelikli aksiyonlar (Surface)

1. **WCAG varsayılanını AA'ya indir (ADR-S5)** — tek satırlık şema değişikliği, en hızlı "kendi gate'ini açma" kazancı; bugün yapılabilir.
2. **Admin/Consumer ayrımı + custom kaçış kapısı (ADR-S1, S2)** — delightful tüketici UX'inin kapısını açan yapısal karar.
3. **Render/perf sözleşmesi (ADR-S3)** — "yüksek performanslı" iddiasını ölçülebilir yapar; ilk vitrin/feed diliminde uygula.
4. **AI-first surface tiplerini (ADR-S4)** kataloğa ekle — #1 önceliğinizin (AI-first) kullanıcı-yüzü.
5. **Etkileşim/durum + i18n/RTL sözleşmesini (ADR-S6)** ilk consumer-surface'te pilotla (feed veya conversation).

---

*Bağlı raporlar: ArcheType (`elestiri-01`) — alan `uiHints` + i18n-text; Kernel (`elestiri-02`) — kontrol düzlemleri, realtime motoru, PDP (izin-simülasyonu).*
