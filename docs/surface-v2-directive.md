# Surface v2 Yönergesi — Tüketici/Üretim Yüzeyleri + AI-first + WCAG AA + i18n

Sürüm: 1.0 — 2026-07-01 · Durum: Normatif yönerge; `src/schemas/surface.ts` şemasını `docs/surface-spec.md` ile hizalar, çelişen her tanımı geçersiz kılar.
Kaynak: `plan-03-yeni-yonergeler-2026-07-01.md §4`, `docs/surface-spec.md`, `src/schemas/surface.ts` (mevcut 8 tip + `2.2-AAA` + i18n-yok), `elestiri-03-surface-2026-07-01.md`. `plan-01` Dalga 0-1 bunu ADR-S1..S7 ile kilitler.
Bu doküman *sözleşme/mimari tarif* verir — ürün kodu `platform` reposunda yazılır. Yüzey **çizmez** (ASCII/wireframe yok); her yüzeyi bileşen + prop + state + davranış + token olarak **tanımlar**. Stack Vite + React + TanStack Router/Query + FastAPI; **Next.js, Supabase, Prisma yasaktır** (SSR/edge/streaming araç-nötr sözleşme olarak Vite SSR/prerender + FastAPI üstünde tanımlanır).

---

## 1. Amaç

Bu yönerge Surface katmanını, iç yönetim yüzeyinden tüketici ve üretim yüzeyine genişletir. Mevcut 8-tip katalog admin/CRUD-merkezlidir; `surface-spec` tüketici + AI-first + üretim yüzeylerini tarif eder ama şema hâlâ 8 tip + `2.2-AAA` varsayılan + i18n-alanı-yok durumundadır. Amaç: şemayı spec ile hizalayacak normatif kararları (taksonomi genişlemesi, `renderStrategy`, WCAG AA taban, i18n/perf/aiSurface blokları) ve bunların CI kapılarını, test/DoD ölçütleriyle birlikte sabitlemektir.

## 2. Kapsam

Bu yönerge şu üç aileyi ve onları taşıyan şema alanlarını kapsar: **Admin-Surface** (mevcut 8), **Consumer-Surface** (8 yeni), **Shop-Surface** (6 yeni). Ayrıca `renderStrategy` (projeksiyon/custom), `a11y.wcag` varsayılan değişimi, yeni `i18n`, `perf`, `aiSurface` blokları ve AI-first yüzey guardrail'i kapsam içindedir. *Aktör açıklığı:* geliştirici yüzey tipini + parametrelerini beyan eder; sistem/SDUI projeksiyon yüzeyini çizer; AI yalnız taslak önerir; insan onaylar; CI perf/a11y/i18n bütçelerini ölçüp bloklar.

## 3. Non-goals

Bu yönerge Workflow (durum makinesi) sözleşmesini değiştirmez — o `WorkflowContractSchema`'da kalır. Her yüzeyi SDUI/şema-render'a zorlamaz (`custom` kaçış kapısı korunur). Doküman/print ve e-posta-HTML yüzeylerini birinci-sınıf tip yapmaz (açık soru; §14 risk keşfinde işaretli). Mevcut 8 admin tipinin davranışını değiştirmez; yalnız yeni aileler + yeni bloklar ekler. Render kodu yazmaz; alan adı + tip + amaç verir, dolu mock veri vermez.

## 4. Taksonomi

Surface üç **tip ailesine** ayrılır. Ayrımın gerekçesi: "bir kaydın iç projeksiyonu", "bir tüketici ürün-yüzeyi" ve "bir shop-floor terminali" farklı disiplinlerdir; tek şemaya sıkıştırmak yüzey kalitesini düşürür. Her aile aynı `SurfaceContractSchema`'yı kullanır, yalnız `type` enum'ı ve varsayılan `renderStrategy` farklıdır.

### 4.1 Admin-Surface (mevcut 8)

Admin-Surface iç yönetim ve CRUD yüzeyidir; kullanıcısı operasyon ekibi/geliştirici/tenant yöneticisidir (fare + klavye + geniş ekran). Sekizi bir kaydı yönetmenin sekiz yoludur; varsayılan `renderStrategy: projected`.

| Tip | Nedir / ne yapar (bileşen + davranış) |
|---|---|
| `list` | Kayıt kümesini kolonlu gösterir; sıralama, facet-filtre, sayfalama, toplu aksiyon |
| `detail` | Tek kaydın alan/ilişkilerini gösterir; tipli aksiyonlar kenarda |
| `form` | Alan-doğrulamalı giriş/düzenleme; RHF + Zod; bağımlı-alan görünürlüğü |
| `board` | Kayıtları durum kolonlarına dizer; sürükle-bırak durum geçişi |
| `dashboard` | Metrik/KPI kartları + grafikler; kırılım filtreleri; tablo-fallback |
| `wizard` | Çok-adımlı akış; adım-doğrulama; ilerleme/geri-dönüş |
| `report` | Toplu/gruplu veri; dışa aktarım; yazdırılabilir düzen |
| `timeline` | Zaman-eksenli olay/durum akışı; kronolojik gruplandırma |

### 4.2 Consumer-Surface (8 yeni)

Consumer-Surface dış kullanıcıya bakan, yüksek-trafik, gerçek-zaman ve dönüşüm-odaklı yüzey ailesidir; kullanıcısı anonim/geniş kitle olabilir, performans ve erişilebilirlik pazarlık konusu değildir. Çoğu `renderStrategy: custom` (bespoke render) ister. Her tip bir davranış sözleşmesi taşır — "ne gösterir" değil, "nasıl davranır".

| Tip | Ne yapar (davranış sözleşmesi) |
|---|---|
| `feed` | Sonsuz kaydırma; ranking kuralı; gerçek-zaman öğe ekleme; cursor-sayfalama + sanallaştırma zorunlu |
| `media-room` | WebRTC eşler-arası ses/görüntü; ekran paylaşımı; ızgara/konuşmacı görünümü; presence |
| `map-live` | Hareketli konum akışı; rota + ETA; MVT tile + zoom-LOD; tablo-fallback zorunlu (`geo-map-surface` custom örnek) |
| `conversation` | Thread; okundu-bilgisi; yazıyor-göstergesi; presence; mesaj optimistic-gönderim + yeniden-deneme |
| `page-builder` | Sürükle-bırak blok editörü (WYSIWYG); blok şeması; taslak/yayın; içerik versiyonlama |
| `data-grid` | Hücre-düzenleme; formül; kopyala-yapıştır; sanallaştırılmış satır/kolon; toplu doğrulama |
| `storefront-plp` | Ürün liste (PLP); facet-filtre; SEO-kritik (ssr); dönüşüm-odaklı sıralama |
| `pdp` | Ürün detay (PDP); varyant seçimi; sepete-ekle optimistic; SEO + zengin-sonuç meta |

### 4.3 Shop-Surface (6 yeni)

Shop-Surface fabrika sahasına (shop-floor) bakan üretim yüzeyi ailesidir; kullanıcısı eldiven/dokunmatik/parlak-tozlu-ortam/barkod bağlamındadır, hata pahalıdır (yanlış lot = geri-çağırma). Çoğu `renderStrategy: custom` (offline kuyruk, barkod-öncelikli giriş, gerçek-zaman SLA jenerik render'a sığmaz) — ama yönetişimi (izin/audit/i18n) korur. Fabrika-bağlamı `factoryContext` bloğunda (`surface-spec §10`) beyan edilir.

| Tip | Ne yapar (davranış sözleşmesi) |
|---|---|
| `terminal` | Üretime başla/durdur/tamamle, malzeme tüket, fire gir; offline-first (kuyruk + çakışma-çözüm); barkod-öncelikli; tek-el ergonomi; "onaysız devam etme" kilidi |
| `andon` | Canlı hat durumu (yeşil/sarı/kırmızı + duruş nedeni); 2 sn tazeleme; renk-körü-güvenli (renk + şekil); kopukluk davranışı beyanlı |
| `gantt` | APS çıktısı: iş merkezi × zaman; sürükle-bırak yeniden-çizelge; kilit/dondurma penceresi |
| `kanban` | Üretim akış panosu; WIP kolonları; çekme (pull) sinyali; kolon kapasite sınırı |
| `oee` | OEE = availability × performance × quality; hat/vardiya/makine kırılımı; formül-bağlı; canlı |
| `work-instruction` | Dijital iş talimatı viewer; adım-adım görsel/video; onay-imza; versiyon-kilitli (yayınlanan talimat değişmez) |

## 5. renderStrategy

`renderStrategy` alanı SDUI'ın "jenerik tavanı" ile "sözleşme-dışına kaçış" arasındaki orta yolu tanımlar; iki değer taşır. **`projected`** (varsayılan): panel `SurfaceContract`'ı okuyup yüzeyi otomatik çizer; hız + tutarlılık; marka/performans cilası veremez. **`custom`**: render kodu elle yazılır (ör. `geo-map-surface` = deck.gl + MapLibre sarmalayıcısı). Kritik invariant korunur:

> Jenerik render'dan kaçmak, yönetişimden kaçmak değildir.

`custom` bir yüzey de aynı ArcheType kontratına uyar: aynı `permissions`, aynı audit, aynı `i18n`, aynı tipli aksiyonlar, aynı `a11y` kapısı. Böylece custom yüzey "kenar" değil, birinci-sınıf custom-surface olur. Karar kuralı: iç panel + standart CRUD → `projected`; tüketici/üretim, marka-özel deneyim, WebGL/WebRTC, gerçek-zaman SLA → `custom` (yönetişim korunarak). *Aktör açıklığı:* geliştirici `custom` beyan edip render'ı yazar; CI izin/audit/i18n/a11y kapılarını bu yüzeye de uygular — custom, denetimden muaf değildir.

## 6. Şema değişiklikleri

Aşağıdaki değişiklikler `src/schemas/surface.ts`'e uygulanır; her satır alan + tip + amaç verir (kod değil). `SurfaceTypeSchema` enum'ı Consumer + Shop tipleriyle genişler (toplam 22 tip). Yeni bloklar `SurfaceContractSchema`'ya opsiyonel-varsayılanlı olarak eklenir; geriye-dönük uyum için mevcut 8 tip ve alanlar korunur.

| Alan | Tip | Amaç |
|---|---|---|
| `SurfaceTypeSchema` | `enum(...)` genişler | 8 admin + 8 consumer (`feed`/`media-room`/`map-live`/`conversation`/`page-builder`/`data-grid`/`storefront-plp`/`pdp`) + 6 shop (`terminal`/`andon`/`gantt`/`kanban`/`oee`/`work-instruction`) |
| `renderStrategy` | `enum("projected","custom").default("projected")` | Jenerik projeksiyon mu, yönetişim-korumalı bespoke render mı |
| `a11y.wcag` | `string().default("2.2-AA")` | Erişilebilirlik tabanını yasal + uygulanabilir seviyeye indirir (eski varsayılan `2.2-AAA`) |
| `a11y.wcagAspirational` | `string().optional()` | Yüzey-bazlı AAA hedefi; CI raporlar, bloklamaz |
| `i18n.locales` | `array(string()).default([])` | Yüzeyin desteklediği locale listesi (ör. `tr-TR`, `ar-EG`) |
| `i18n.defaultLocale` | `string().default("tr-TR")` | Varsayılan dil/bölge |
| `i18n.rtl` | `enum("auto","true","false").default("auto")` | Yazım yönü; `auto` = locale'den türet |
| `i18n.messagesRef` | `string().default("")` | Çeviri kaynağı referansı; ArcheType i18n-text alanına bağlanır (tek-kaynak çeviri) |
| `perf.renderMode` | `enum("csr","ssr","prerender").default("csr")` | Yüzey nerede çizilir (istemci / sunucu / önceden-üretilmiş) |
| `perf.cachePolicy` | `object{cacheTags[], revalidate}` | Hangi etiketler; ne zaman/ne sıklıkta tazelenir (outbox → cache invalidation) |
| `perf.cwvBudget` | `object{lcpMs, inpMs, cls}` | Core Web Vitals hedefleri (LCP ≤ 2500ms, INP ≤ 200ms, CLS ≤ 0.1 "iyi" eşiği) |
| `aiSurface.kind` | `enum("assistant","command-palette","nl-query","generative-view").optional()` | AI-yüzey türü (opsiyonel blok; yoksa AI-yüzey değil) |
| `aiSurface.pdpGated` | `boolean()` (zorunlu `true`) | AI-yüzey PDP izin-simülasyonundan geçmeden veri/aksiyon vermez |
| `aiSurface.humanApproval` | `boolean().default(true)` | AI üretim/değişim önerisi insan onayı olmadan uygulanmaz |

## 7. AI-first surface guardrail

AI-first yüzeyler (`nl-query`, `generative-view`, `assistant`, `command-palette`) actionplan'ın çekirdek AI güvenlik invariant'ına bağlıdır:

> Kullanıcı niyet söyler → AI önizler/önerir (uygulamaz) → insan onaylar → motor uygular.

Kural: `aiSurface` bloğu tanımlı her yüzeyde `pdpGated: true` **zorunludur** (aksi halde şema-validasyon başarısız). `nl-query` ürettiği sorguyu PDP izin-simülasyonundan geçirir; kullanıcı yetkisiz veriyi doğal dille de isteyemez. `generative-view` yüzey/pano taslağı önerir → `ADMIN_FLOW` ile insan onayı → uygulanır. **AI doğrudan üretim ayarı değiştiremez** (mode-profile publish, capability/entitlement, PDP policy, tenant tema-override): AI en fazla `draft`/`preview` seviyesindedir; canlı-veri korunumu invariant'tır. `claude-ai-archetype-eca-directive` ve `surface-spec §12` ile aynı sınır.

## 8. WCAG hizalama

Erişilebilirlik tabanı **WCAG 2.2 AA zorunludur**; AAA yüzey-bazlıdır. Gerekçe: AAA çoğu tüketici/marka yüzeyinde ulaşılamaz (7:1 kontrast, metin-içeren-görsel kısıtı, video işaret-dili, zaman-sınırı yasağı); AAA'yı global varsayılan yapmak conformance kapısını çökertir (ya kapı kapatılır ya sürekli waiver). AA ayrıca çoğu bölgede yasal tabandır (EN 301 549, ADA). Karar: varsayılan `a11y.wcag = "2.2-AA"`; conformance kapısı AA'yı **zorlar**, `a11y.wcagAspirational` AAA'yı **raporlar** (bloklamaz). Shop-Surface için ek endüstriyel HMI ergonomisi (`surface-spec §8`): kontrast AA-üstü, dokunma hedefi ~64px (eldiven), renk-körü-güvenli andon (renk + şekil), gürültüde görsel-öncelikli geri-bildirim. WebGL/WebRTC yüzeyleri (`map-live`, `media-room`) için erişilebilir eşdeğer (tablo/metin) zorunludur. *Aktör açıklığı:* geliştirici seviyeyi/HMI profilini beyan eder; CI axe + Playwright ile AA'yı bloklar, AAA'yı raporlar.

## 9. i18n / RTL beyanı

Global ürün için i18n zorunludur, opsiyon değildir. `i18n` bloğu locale davranışını beyan eder: `locales[]`, `defaultLocale`, `rtl` (`auto`/`true`/`false`; `auto` locale'den türer), `messagesRef`. Tarih/para/sayı biçimi CLDR-tabanlı locale-farkında; çoğul-kuralı ICU MessageFormat ile. Kritik: enum/etiket çevirileri Surface'te tekrar yazılmaz; `messagesRef` ArcheType i18n-text alanına bağlanır (tek-kaynak) — bir terim bir kez çevrilir, tüm yüzeyler tüketir, drift engellenir. CI pseudo-localization ile taşan/kırılan yüzeyi (RTL + uzun-metin) yakalar. *Aktör açıklığı:* geliştirici beyan eder; sistem biçimlendirir + yönü çevirir; çeviri sahibi ArcheType i18n-text alanıdır.

## 10. State sözleşmesi

UX ne gösterildiği kadar nasıl davrandığıdır; kalitenin büyük kısmı durum-geçişlerindedir. Her yüzey şu dört durumdaki davranışını beyan eder (metin + afordans; çizim değil) — durum davranışı sözleşmedir, stil değil.

| State | Nedir / beklenen davranış | Prop / token bağı |
|---|---|---|
| `empty` | Boş-durum: neden boş, ne yapılabilir (afordans), yönlendirici metin | `emptyState` prop; `illustration`/`spacing` token |
| `loading` | Yükleniyor: skeleton veya ilerleme; içerik-kayması yok (CLS korunur) | `loadingMode` prop (`skeleton`/`spinner`); `motion` token |
| `error` | Hata: ne oldu + yeniden-deneme yolu; metinsel (yalnız renkle değil) | `onRetry` prop; `errorText` (renk-bağımsız) |
| `optimistic` | İyimser-güncelleme: aksiyon sonucu beklemeden ekranda; başarısızsa geri-al | TanStack Query mutation + `rollback` davranışı |

Ek davranış: mikro-etkileşim (`prefers-reduced-motion` onurlanır), odak-yönetimi (klavye odağı mantıksal sırada; modal odak-tuzağı + kapanışta geri-dönüş), bağımlı-alan görünürlüğü. *Aktör açıklığı:* geliştirici durum davranışını beyan eder; istemci optimistic'i TanStack Query ile uygular ve başarısızlıkta rollback yapar; kullanıcı her durumu metinden anlar (renk-bağımsız).

## 11. Test stratejisi

Aşağıdaki testler `check-surface` CI kapısında zorunludur; bir yüzey bunları geçmeden merge edilemez. Testler hem şema-uyumu hem yönetişim-korunumu hem AI-guardrail hem ölçülebilir-perf eksenlerini kapsar.

| # | Test | Ne doğrular |
|---|---|---|
| 1 | Tip-şema uyumu | Her yeni consumer/shop tipi `SurfaceTypeSchema`'ya uyuyor; katalog validasyonu yeşil |
| 2 | Custom yönetişim-korunumu | `renderStrategy: custom` yüzeyi `permissions` + `a11y` + `i18n` + audit alanlarını yine de zorunlu tutuyor |
| 3 | AI-surface PDP kapısı | `aiSurface` tanımlı yüzey `pdpGated: true` olmadan validasyondan geçmiyor |
| 4 | CWV bütçe beyanı | Consumer/Shop yüzeyi `perf.cwvBudget` beyan etmeden geçmiyor; Lighthouse/Playwright bütçeyi ölçüp aşımı blokluyor |
| 5 | WCAG AA gate | axe + Playwright AA ihlalini blokluyor; `wcagAspirational` AAA raporlanıyor (bloklanmıyor) |
| 6 | i18n/RTL | pseudo-localization testi taşan/kırılan yüzeyi yakalıyor; `rtl: auto` locale'den doğru türüyor |
| 7 | State davranışı | empty/loading/error/optimistic davranışları beyanlı; optimistic başarısızlıkta rollback çalışıyor |
| 8 | Versiyon-kayması fail-safe | Surface v2 alanı beklerken ArcheType v1 eksikse render fail-safe davranıyor (çökmüyor) |

## 12. Acceptance criteria

Bu yönerge şu ölçütler karşılandığında "uygulanmış" sayılır: (1) `SurfaceTypeSchema` 22 tipe genişledi (8 admin + 8 consumer + 6 shop); (2) `renderStrategy`, `perf`, `i18n`, `aiSurface` blokları şemada tanımlı ve varsayılanlı; (3) `a11y.wcag` varsayılanı `2.2-AA`, `wcagAspirational` opsiyonel; (4) §11'deki 8 test yeşil; (5) `check-surface` CI kapısı yeni tipleri + AI-PDP kapısını + CWV bütçe beyanını + AA gate'ini zorluyor; (6) `custom` renderStrategy yönetişim alanlarını (permission/audit/i18n/a11y) koruyor; (7) mevcut 8 admin tipi ve alanları geriye-dönük bozulmadı; (8) ADR-S1..S7 kilitlendi.

## 13. Anti-patterns

Aşağıdakiler bu yönergenin yasakladığı desenlerdir; CI veya review bunları reddeder. `if b2b else` gibi koda-gömülü mod dallanması (config-driven okunmalı). `custom` renderStrategy'yi yönetişimden kaçış olarak kullanmak (izin/audit/i18n/a11y atlanamaz). AAA'yı global varsayılan tutmak (conformance kapısını çökertir). AI-yüzeyi `pdpGated: false` bırakmak veya AI'a doğrudan üretim-ayarı yazdırmak (mode publish, capability, PDP policy, tema-override). CWV bütçesi beyan etmeden tüketici/üretim yüzeyi merge etmek ("umut ederek hızlı"). Enum/etiket çevirisini Surface'te tekrar yazmak (drift; `messagesRef` ile tek-kaynak). Durum-davranışını (empty/loading/error/optimistic) beyan etmeyip stile bırakmak. WebGL/WebRTC yüzeyini erişilebilir-eşdeğer olmadan yayınlamak.

## 14. DoD (Definition of Done)

Şema genişledi (22 tip + 4 yeni blok) + §11'deki 8 test yeşil + `check-surface` CI kapısı genişledi (yeni tip validasyonu, AI-PDP kapısı, CWV bütçe zorlaması, AA gate, i18n pseudo-loc). `surface-spec` ADR-S1..S7 kararları bu yönergenin normatif duruşuyla kilitlendi. Custom yüzeyde yönetişim (izin/audit/i18n/a11y) gerçekten zorlanıyor (kapı kapsamı doğrulandı). Geriye-dönük uyum: mevcut 8 admin tipi + alanları bozulmadı. AI-first yüzeyler PDP-gated + insan-onaylı (test-4 §7 ile kanıtlı). Risk keşfinde işaretli açık sorular (Surface↔ArcheType versiyon kayması fail-safe, doküman/print + e-posta-HTML yüzey konumu, SDUI güven-sınırı/XSS) takip düğümü olarak açıldı.

## 15. Requirement-ID tablosu

Aşağıdaki tablo bu yönergenin gereksinimlerini izlenebilir kılar; her satır `check-surface` kapısına ve §11 testlerine bağlanır.

| ID | Requirement | Layer | Priority | TestType | AcceptanceCriteria | Owner |
|---|---|---|---|---|---|---|
| SRF2-01 | `SurfaceTypeSchema` 22 tipe genişler (8 admin + 8 consumer + 6 shop) | schema | P0 | unit (Zod) | Katalog validasyonu 22 tip için yeşil | Ajan PR → İnsan |
| SRF2-02 | `renderStrategy: projected\|custom` (varsayılan projected) | schema | P0 | unit | Alan varsayılanlı; enum doğru | Ajan PR → İnsan |
| SRF2-03 | `custom` yönetişimi (izin/audit/i18n/a11y) korur | governance | P0 | integration | Test-2 yeşil; custom yüzey alanları atlamıyor | Ajan PR → İnsan |
| SRF2-04 | `a11y.wcag` varsayılanı `2.2-AA`; `wcagAspirational` opsiyonel | a11y | P0 | unit + axe | Varsayılan AA; AAA raporlanır, bloklanmaz | Ajan PR → İnsan |
| SRF2-05 | `i18n{locales,defaultLocale,rtl,messagesRef}` bloğu | i18n | P1 | unit + pseudo-loc | Blok tanımlı; RTL auto türer; taşma yakalanır | Ajan PR → İnsan |
| SRF2-06 | `perf{renderMode,cachePolicy,cwvBudget}` bloğu | perf | P0 | e2e (Lighthouse/Playwright) | CWV bütçesi beyanlı; aşım bloklar | Ajan PR → İnsan |
| SRF2-07 | `aiSurface{kind,pdpGated,humanApproval}`; `pdpGated=true` zorunlu | ai-guardrail | P0 | integration | Test-3 yeşil; pdpGated:false geçmiyor | Ajan PR → İnsan |
| SRF2-08 | AI doğrudan üretim-ayarı değiştiremez (draft/preview + insan onay) | ai-guardrail | P0 | integration | AI publish/capability/policy/tema yazamıyor | İnsan (canon) |
| SRF2-09 | State sözleşmesi (empty/loading/error/optimistic) beyanlı | ux | P1 | integration | Test-7 yeşil; optimistic rollback çalışıyor | Ajan PR → İnsan |
| SRF2-10 | Versiyon-kayması fail-safe (ArcheType v1 / Surface v2) | resilience | P1 | integration | Test-8 yeşil; eksik alanda render çökmüyor | Ajan PR → İnsan |
| SRF2-11 | `check-surface` CI kapısı 22 tip + AI-PDP + CWV + AA zorluyor | ci-gate | P0 | ci | Kapı kırmızı→yeşil kanıtı mevcut | Ajan PR → İnsan |
| SRF2-12 | ADR-S1..S7 kilitlendi (surface-spec §13 ile hizalı) | governance | P1 | review | 7 ADR normatif duruşla sabit | İnsan (canon) |

---

*Bağlı dokümanlar: `docs/surface-spec.md` (kanonik spec) · `plan-03-yeni-yonergeler-2026-07-01.md §4` (yönerge kaynağı) · `elestiri-03-surface-2026-07-01.md` (analiz temeli) · `docs/adr-P1-pdp.md` (PDP; `aiSurface.pdpGated` bağı) · `docs/ci-conformance-gates.md` (`check-surface` kapısı) · `claude-ai-archetype-eca-directive.md` (AI sınırı). Bağlı düğümler: `k-surface`, `k-surface-consumer`, `k-control-planes`, `geo-map-surface`. Şema hedefi: `src/schemas/surface.ts`.*
