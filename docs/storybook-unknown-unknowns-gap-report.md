# Storybook + Master Component — Unknown-Unknowns ve Ölümcül Gap Raporu

**Proje:** `metaframer` · marka: meta-framer · teknik sınıf: meta-framework  
**Tarih:** 2026-07-12  
**Durum:** Risk keşfi ve yönetişim raporu; implementation yapmaz.  
**İncelenen karar:** Storybook'un bütün UI sürecinde zorunlu kullanılması ve ortak UI bileşenlerinin Master Component olarak yönetilmesi.  
**Bağlı belgeler:** `storybook-implementation.md`, `storybook-master-component-integration-directive.md`.

## 1. Yönetici hükmü

Storybook'u UI teslimat ontolojisine dönüştürmek doğru bir yönelimdir; ancak üç ölümcül risk henüz yeterince tanımlanmamıştır:

1. **Kombinasyon patlaması:** state × variant × theme × locale × RTL × viewport × density × permission × veri hacmi matrisi kontrol edilmezse Storybook kataloğu ve CI sürdürülemez hale gelir.
2. **Fixture gerçeği yanılsaması:** İzole story doğru görünürken gerçek API, PDP, tenant, router, portal, global CSS, concurrency ve yüksek veri hacmi altında ürün yanlış davranabilir.
3. **Baseline otoritesi:** Visual baseline'ı kimin, hangi kanıtla ve hangi süre içinde onayladığı tanımlanmazsa regresyonlar “kasıtlı değişiklik” diye kabul edilerek sistematik biçimde gizlenebilir.

Storybook'un kendisi kalite garantisi değildir. Story; kaynak component, gerçek veri sözleşmesi, bağımsız test, insan review'u ve ürün E2E'sine bağlandığında güvenilir kanıt olur.

## 2. Resmî yetenek sınırlarından çıkan riskler

Storybook'un resmî dokümantasyonu aşağıdaki sınırları doğrular:

- Story'ler render ve component testlerine dönüştürülebilir; karmaşık davranışlar interaction/play testleri ister.
- Vitest tabanlı addon Vite uyumuna bağlıdır; alternatif test-runner farklı yetenek ve çalışma modeline sahiptir.
- Görsel testler baseline screenshot karşılaştırmasına dayanır ve resmî bulut entegrasyonu olarak Chromatic öne çıkar.
- Storybook a11y addon'u axe-core kullanır; otomatik kontrol WCAG sorunlarının tamamını yakalayamaz.
- Package composition yayınlanan Storybook ile consumer Storybook arasında güvenli entegrasyon ve sürüm eşleşmesi gerektirir.

Bu nedenle “Storybook var” aşağıdaki iddiaların hiçbirini tek başına kanıtlamaz:

- tüm tarayıcılarda doğru davranış,
- gerçek uygulama entegrasyonu,
- tam WCAG uyumu,
- yetkilendirmenin güvenli olması,
- production ölçeğinde performans,
- visual baseline'ın doğru olması,
- consumer ürünün doğru component sürümünü kullandığı.

## 3. P0 — Ölümcül unknown-unknowns

### U0 — Kombinasyon patlaması

Bir DataGrid için örnek matris:

```text
7 state
× 4 density/size
× 3 theme
× 3 locale
× 2 direction
× 3 viewport
× 4 permission state
× 5 data shape
= 30.240 kombinasyon
```

Her kombinasyonu ayrı story ve visual test yapmak sürdürülemez. Yapılmazsa da “tam kapsam” söylemi yanlış olur.

**Gerekli karar:** Story coverage, exhaustive Cartesian product değil risk-temelli pairwise/representative matristir. P0 invariant kombinasyonları exhaustive; stil ve sunum varyasyonları pairwise; düşük-risk varyasyonlar manuel/rotasyonlu olabilir.

**Kapanma kanıtı:** Component başına story/test bütçesi, risk sınıfı, pairwise generator veya açık örnekleme politikası.

### U1 — Story fixture'ı gerçek veri değildir

Fixture'lar genellikle temiz, küçük ve deterministiktir. Gerçek veri ise:

- eksik,
- bozuk,
- çok uzun,
- eski schema sürümünde,
- cross-tenant sınırında,
- gecikmeli,
- tekrar eden,
- sıra dışı locale/para/tarih biçiminde,
- milyonlarca satırlık olabilir.

Story doğru görünürken gerçek ürün veri kaybı, yanlış truncation, sonsuz loading veya yetkisiz alan sızıntısı yaşayabilir.

**Gerekli karar:** Fixture'lar versioned contract factory'den üretilmeli; happy-path yanında malformed, partial, stale, permission-filtered, high-volume ve migration-old-version fixture aileleri bulunmalıdır.

### U2 — Visual baseline'ı kabul etmek regresyonu meşrulaştırabilir

Visual test sistemi piksel farkını gösterir; farkın doğru olup olmadığını söylemez. Büyük PR, font değişimi veya token güncellemesi binlerce diff üretirse reviewer “accept all” davranışına kayabilir.

**Gerekli karar:** Baseline onayı component owner + design reviewer ayrılığı, değişiklik nedeni, task/ADR ref ve etki kapsamı ister. Toplu kabul ayrı yüksek-riskli aksiyondur.

### U3 — Storybook yetkilendirme testi güvenlik sınırı değildir

Story'de `readonly`, `hidden` veya `denied` görünümünü göstermek, backend PDP'nin gerçekten erişimi engellediğini kanıtlamaz. Bir butonun gizlenmesi güvenlik değildir.

**Gerekli karar:** Permission story yalnız projection kanıtıdır. Her kritik permission durumu backend authorization integration testi ve cross-tenant negatif E2E ile eşlenir.

### U4 — Yayınlanan Storybook hassas bilgi sızdırabilir

Preview URL'leri şunları açığa çıkarabilir:

- henüz yayınlanmamış ürün özellikleri,
- müşteri/tenant markaları,
- fixture içine yanlışlıkla konmuş PII,
- finansal veri,
- iç route ve feature flag adları,
- API endpoint'leri,
- erişim tokenları veya environment değerleri.

**Gerekli karar:** Public/private publish sınıfı, erişim kontrolü, fixture sanitization, secret scan, retention ve preview silme politikası zorunludur.

### U5 — Master Component merkezi darboğaza dönüşebilir

Her UI değişikliğinin design-system ekibinden geçmesi:

- ürün ekiplerini yavaşlatabilir,
- local ihtiyacı aşırı genelleştirebilir,
- prop bombardımanı üretebilir,
- domain davranışını ortak componente sızdırabilir.

**Gerekli karar:** Master promotion eşiği, local-first kuralı, contribution SLA, owner federation ve escape-hatch review süreci.

### U6 — Gerçek uygulama ortamı Storybook'tan farklı olabilir

İzolasyonda görünmeyen farklar:

- global CSS ve reset sırası,
- stacking context ve z-index,
- portal container,
- router ve nested layout,
- React provider sırası,
- error boundary,
- suspense/streaming,
- CSP,
- shadow DOM/iframe,
- browser extension etkisi,
- production minification/tree-shaking.

**Gerekli karar:** Storybook preview provider'ları production composition root ile ortak factory tüketmeli; kritik Surface'ler gerçek app-shell harness ve E2E ile doğrulanmalıdır.

### U7 — Monorepo sürüm kayması

Master Component paketi v3 story'si geçerken consumer app v2 kullanıyor olabilir. Composed Storybook doğru sürümü göstermiyorsa review edilen UI ile yayınlanan UI farklıdır.

**Gerekli karar:** Storybook preview, package version, commit SHA, consumer lockfile ve component contract fingerprint birlikte görünmelidir. Package composition sürüm çözümleme testi gerektirir.

### U8 — Araç/vendor bağımlılığı kontrol düzlemini ele geçirebilir

Visual testing, preview hosting veya package composition belirli bir bulut servisine bağlanırsa:

- maliyet story sayısıyla büyür,
- data residency sorunu çıkabilir,
- servis kesintisi merge'leri durdurabilir,
- geçmiş baseline dışarı taşınamayabilir,
- vendor değişimi büyük migration yaratabilir.

**Gerekli karar:** Vendor-neutral evidence sözleşmesi, export/retention, maliyet bütçesi, outage davranışı ve alternatif/self-hosted yol.

## 4. P1 — Yüksek etkili unknown-unknowns

### U9 — Story/Test API sürüm değişimi

Storybook test ekosisteminde addon, runner, Vitest/browser-mode ve portable story yaklaşımları sürüme göre değişebilir. Deneysel veya hızla değişen API'yi doğrudan kanonik sözleşmeye gömmek sürekli migration doğurur.

**Önlem:** Kanonik belgede ürün gereksinimini tanımla; kesin addon/paket/version seçimini toolchain ADR + lockfile'a bırak.

### U10 — Browser ve ortam flakiness'i

Font rendering, scrollbar, device pixel ratio, timezone, locale, animation, random ID ve tarih görsel diff üretebilir.

**Önlem:** Sabit browser image, font preload, timezone/locale clock freeze, animation disable, deterministic ID/seed ve retry yerine root-cause politikası.

### U11 — Axe sonucu tam erişilebilirlik değildir

Otomatik a11y taraması önemli ama sınırlıdır. Screen reader anlamı, bilişsel yük, klavye akışının kullanılabilirliği ve canlı bölge zamanlaması tamamen otomatik yakalanamaz.

**Önlem:** Kritik Master Component ve Surface için manuel klavye, screen-reader ve zoom/reflow review matrisi; otomatik sonuç yalnız ilk bariyer.

### U12 — Data-sense component'ler küçük fixture ile yanlış güven verir

DataGrid, chart, tree veya kanban; 20 satırda düzgün, 100 bin satırda kullanılamaz olabilir. Storybook visual testi performans ve bellek davranışını kanıtlamaz.

**Önlem:** Hacim profilleri, virtualization story'si, performance budget, interaction latency ölçümü ve gerçek tarayıcı load test.

### U13 — Container query ve gerçek layout farkı

Viewport story'si ekran genişliğini değiştirir; component gerçek uygulamada dar parent container içinde olabilir. Viewport geçip container kırılabilir.

**Önlem:** Container-width fixtures, nested panel/split-view story'leri ve container-query matrisi.

### U14 — Async ve race condition görünmezliği

Mock response anlık ve sıralıysa gerçek network'teki out-of-order response, cancellation, retry, stale cache ve optimistic conflict görünmez.

**Önlem:** Latency/jitter/error/retry/out-of-order mock profilleri; fake timer ile değil gerektiğinde browser/network katmanında test.

### U15 — Story'ler dokümantasyon çöplüğüne dönüşebilir

Component kaldırılır fakat story kalır; story copy-paste olur; fixture artık gerçek API'ye uymaz; katalog araması kullanılamaz hale gelir.

**Önlem:** Orphan story, duplicate story, broken import, unused/deprecated consumer ve story freshness kapıları.

### U16 — Coverage metriği oyunlaştırılabilir

“Her componentte story var” hedefi yalnız default render story'leriyle karşılanabilir. Yüksek story sayısı gerçek state/interaction kapsamı anlamına gelmez.

**Önlem:** Sayı değil risk/state/interaction/contract coverage; story kalite skoru ve negatif senaryo oranı.

### U17 — Figma/design kaynağı ile kod Storybook'u ayrışabilir

Storybook kod gerçeğini, tasarım aracı tasarım niyetini taşır. İki ayrı Master Component kataloğu oluşursa isim, variant ve token drift eder.

**Önlem:** Component kimliği ve token isimleri ortak registry; design↔code linki; değişiklikte iki taraflı review. Figma'nın runtime doğruluk kaynağı olmadığı açık kalmalı.

### U18 — Tema ve tenant çoğalması

Her tenant theme'i visual baseline'a girerse test sayısı patlar. Girmezse tenant-specific kontrast, logo veya token hataları kaçabilir.

**Önlem:** Canonical theme sınıfları + risk-temelli tenant örnekleri; her tenant yerine token constraint testleri ve seçilmiş visual probes.

### U19 — Localization matrisi patlaması

Her locale'i her story'de test etmek sürdürülemez; yalnız İngilizce/Türkçe test etmek de RTL, çoğul ve uzun-metin sorunlarını kaçırır.

**Önlem:** Representative locale seti: default, Turkish casing, pseudo-long, RTL, complex plural; locale-specific iş kuralları ayrıca test edilir.

### U20 — Component API aşırı genelleşebilir

Master Component her ürün ihtiyacını karşılamak için onlarca boolean prop ve callback taşıyabilir. Bu, ortaklık değil gizli bir framework içinde framework üretir.

**Önlem:** Composition-first, variant budget, prop count/complexity gate, domain-specific pattern'i Master primitive'e taşımama.

## 5. P2 — Operasyonel ve organizasyonel unknown-unknowns

### U21 — Review kapasitesi ve SLA

Her PR görsel/a11y/design review isterse reviewer kuyruğu kritik yol olur.

**Karar ihtiyacı:** Risk tabanlı reviewer seviyesi, otomatik geçiş sınırı, ekip başına owner, review SLA ve escalation.

### U22 — Acil hotfix davranışı

Storybook/visual vendor kesikken kritik production hotfix bloke olabilir.

**Karar ihtiyacı:** Break-glass yetkisi, sonradan evidence tamamlama süresi, audit ve kötüye kullanım kontrolü.

### U23 — Maliyet ve CI süresi

Binlerce story'nin browser ve visual testi merge süresini ve bulut maliyetini büyütür.

**Karar ihtiyacı:** Changed-story selection, shard, cache, nightly full matrix, PR budget ve aylık maliyet alarmı.

### U24 — Story ownership kaybı

Component owner ekipten ayrılır veya modül kapanırsa baseline/review kararı sahipsiz kalabilir.

**Karar ihtiyacı:** CODEOWNERS, yedek owner, orphan ownership gate ve deprecation sorumlusu.

### U25 — Tasarım kararı ile bug fix ayrımı

Bir visual diff bazen bug fix, bazen rebrand, bazen tarayıcı farkıdır. Tek review akışı hepsine uymaz.

**Karar ihtiyacı:** Diff taxonomy: bugfix, intentional-design, token-wide, environment-noise, content-only.

### U26 — Preview retention ve denetlenebilirlik

PR preview silinirse geçmiş release kanıtı kaybolabilir; hiç silinmezse veri ve maliyet birikir.

**Karar ihtiyacı:** Release baseline kalıcı, PR preview süreli, evidence manifesti append-only; hassas preview erken silinebilir ama audit ref korunur.

### U27 — Test verisi telif ve gizlilik riski

Gerçek müşteri görseli, ilan fotoğrafı, rapor veya marka varlığı fixture'a kopyalanabilir.

**Karar ihtiyacı:** Sentetik veri/fotoğraf politikası, lisans/provenance alanı, PII/secret/media scan.

### U28 — Addon supply-chain riski

Storybook addon'ları build ve browser bağlamında kod çalıştırır. Kontrolsüz addon eklemek supply-chain ve veri sızıntısı riski yaratır.

**Karar ihtiyacı:** Addon allowlist, dependency review, lockfile, provenance/SBOM ve network egress politikası.

### U29 — MDX ve dokümantasyon güvenliği

MDX/docs içeriği interaktif kod çalıştırabilir veya güvensiz HTML/link barındırabilir.

**Karar ihtiyacı:** Trusted-author sınırı, sanitization, CSP ve dış embed/iframe politikası.

### U30 — Storybook erişilebilir ama ürün erişilemez olabilir

Storybook iframe ve izole DOM, ürünün gerçek navigation landmarks, skip-link, page title ve focus restoration davranışını kapsamaz.

**Karar ihtiyacı:** Page/Surface a11y yalnız story ile kapanmaz; app-shell E2E zorunlu.

## 6. Doğa metaforu ve üretim zincirine özgü bilinmeyenler

### Ada — Katalog sürümü uyumsuzluğu

Bir Ada hangi Master Component catalog sürümünü tükettiğini kilitlemezse aynı ürün ailesinde farklı UI sözleşmeleri çalışabilir.

### Dağ — Domain fork riski

Modül ekipleri ortak component'i fork edip küçük farklarla çoğaltabilir. Duplicate tespiti yalnız isimle değil davranış/API benzerliğiyle yapılmalıdır.

### Kaya — ArcheType projection drift'i

Field type `surfaceProjection` değişir fakat ArcheType form/list/detail story'leri güncellenmezse generated UI sessizce bozulur.

### Taş — Journey parçalanması

Feature story'si component'leri doğru gösterebilir fakat çok-adımlı journey, permission veya transaction sınırı E2E olmadan kaybolur.

### Kum — Master/local yanlış sınıflandırması

Local component erken Master yapılırsa API donar; gerçek ortak component local bırakılırsa kopyalar çoğalır.

### Molekül — Hook gerçeği

Hook work_unit story içinde mock provider ile geçer fakat gerçek cache/router/form provider birleşiminde farklı davranabilir.

### Atom — Mikro değişiklik, makro visual diff

Tek token atomu yüzlerce story'yi değiştirir. WBS küçüklüğü etki küçüklüğü değildir; visual blast-radius ayrıca ölçülmelidir.

### Atomik değer tipi — Widget paritesi

Money/Range/Identifier sözleşme fingerprint'i değişir fakat story fixture eski serializer'ı kullanırsa frontend/backend paritesi sahte görünür.

### Fragment — Cross-field state patlaması

Address veya ContactPoint'in alt alan kombinasyonları story sayısını hızla artırır; pairwise ve invariant bazlı seçim gerekir.

### Surface — Story ile gerçek veri sorgusu ayrımı

Composition story veri getirme, pagination, permissions, cache invalidation ve URL state'i mock'lar; bunlar gerçek Surface E2E'de ayrıca kanıtlanmalıdır.

## 7. Yeni gerekli sözleşmeler

Önceki yönergelere aşağıdaki sözleşmeler eklenmelidir:

| Sözleşme | Kapatılan risk |
|---|---|
| Story Coverage Budget | kombinasyon patlaması ve CI maliyeti |
| Fixture Fidelity Contract | mock/gerçek veri drift'i |
| Visual Baseline Governance | yanlış diff kabulü |
| Storybook Security & Publishing | PII/secret/preview erişimi |
| Master Component Federation | merkezi darboğaz ve ownership |
| Consumer Version Parity | monorepo/package sürüm kayması |
| Deterministic Rendering | visual flakiness |
| Manual Accessibility Review | axe'in kapsamadığı sorunlar |
| Performance Story Profile | yüksek veri hacmi ve virtualization |
| Addon Allowlist & Supply Chain | addon/MDX güvenliği |
| Preview Retention & Evidence | geçmiş kanıt ve maliyet dengesi |
| Break-glass UI Delivery | vendor/CI kesintisinde hotfix |

## 8. Risk-temelli story kapsam modeli

Her component için risk puanı şu eksenlerden türetilmelidir:

- finansal/PII/güvenlik etkisi,
- kullanım yaygınlığı,
- state sayısı,
- interaction karmaşıklığı,
- theme/locale/RTL etkisi,
- veri yoğunluğu,
- permission projection,
- external side-effect,
- geçmiş regresyon sıklığı.

| Risk | Story/test kapsamı |
|---|---|
| Critical | exhaustive invariant states + pairwise presentation + manual a11y + cross-browser + E2E |
| High | tüm davranış state'leri + pairwise theme/locale/viewport + visual/a11y/E2E |
| Medium | zorunlu states + representative theme/locale/viewport + interaction/a11y |
| Low | render + temel state + consumer integration testi |

Bu model olmadan “tam kapsam” ya sahte bir iddia ya da sürdürülemez bir test matrisi olur.

## 9. Yeni CI sonuçları ve kalite sinyalleri

Mevcut `PASS/FAIL/NO_CANDIDATES/REVIEW_REQUIRED` durumlarına ek rapor sinyalleri gerekir:

- `BASELINE_STALE`
- `FIXTURE_DRIFT`
- `VERSION_MISMATCH`
- `OWNER_MISSING`
- `SECURITY_REVIEW_REQUIRED`
- `BUDGET_EXCEEDED`
- `FLAKY_QUARANTINED`
- `MANUAL_A11Y_REQUIRED`

Bu sinyallerin bazıları merge bloklar, bazıları warning/ratchet olur; sınıfı risk politikasında tanımlanır.

## 10. Önce yazılması gereken kırmızı testler

1. Story matrisi Cartesian bütçeyi aşınca kapı kırılır.
2. Fixture contract fingerprint gerçek schema'dan farklıysa kırılır.
3. Visual baseline owner/reason/task ref olmadan güncellenemez.
4. Public preview PII/secret fixture ile publish edilemez.
5. Permission story backend authorization test ref'i olmadan critical done olamaz.
6. Consumer lockfile ile composed Storybook component sürümü farklıysa kırılır.
7. Deterministik olmayan tarih/random/font/animation story'si tespit edilir.
8. A11y `off/todo` critical componentte kabul edilmez; bloklayıcı mod gerekir.
9. Deprecated Master Component replacement ve consumer migration olmadan retire edilemez.
10. UI hotfix break-glass kullanırsa audit ve telafi evidence görevi otomatik açılır.
11. Story owner bulunmuyorsa baseline approve edilemez.
12. Büyük veri componenti performance profile olmadan stable olamaz.

## 11. Karar bekleyen sorular

1. Visual regression hizmeti cloud mu self-hosted mı olacak?
2. Preview'lar public, organization-private veya VPN-only mı?
3. Hangi story ve release evidence ne kadar saklanacak?
4. Critical componentlerde hangi browser matrisi zorunlu?
5. Master Component onay yetkisi merkezi mi federated mı?
6. PR başına story/visual test zaman ve maliyet bütçesi nedir?
7. Hangi locale/theme/tenant seti representative kabul edilecek?
8. Manuel screen-reader review kim tarafından ve hangi sıklıkta yapılacak?
9. Emergency hotfix break-glass yetkisi kimde olacak?
10. Addon allowlist ve yeni addon onay süreci kimde olacak?
11. Figma/design registry ile code component registry nasıl eşlenecek?
12. Story fixture factory'nin schema ve privacy owner'ı kim olacak?

## 12. Öncelikli kapanış planı

### Wave UU-0 — Güvenlik ve kapsam bütçesi

- Story Coverage Budget,
- Storybook Security & Publishing,
- fixture sanitization,
- addon allowlist,
- visual baseline governance.

### Wave UU-1 — Gerçeklik paritesi

- fixture/schema fingerprint,
- production provider factory,
- consumer version parity,
- app-shell harness,
- permission backend-test linkage.

### Wave UU-2 — Determinizm ve maliyet

- font/time/random/motion freeze,
- changed-story selection,
- shard/cache/nightly full matrix,
- cost/CI budget dashboard.

### Wave UU-3 — İnsan review ve erişilebilirlik

- manual a11y matrix,
- owner federation,
- review SLA,
- baseline diff taxonomy,
- break-glass workflow.

### Wave UU-4 — Legacy ve ölçek

- orphan/duplicate/freshness audit,
- data-dense performance profiles,
- tenant/theme/locale representative matrix,
- deprecation/consumer migration closure.

## 13. Kabul kriterleri

Bu unknown-unknown analizi ancak aşağıdaki kontrol mekanizmaları oluştuğunda kapanmış sayılır:

- Story kapsamı Cartesian ürün yerine risk bütçesiyle yönetiliyor.
- Fixture'lar gerçek schema ve privacy sözleşmesine fingerprint ile bağlı.
- Visual baseline tek kişinin gerekçesiz toplu kabulüne kapalı.
- Published Storybook secret/PII ve erişim sınıfı kapısından geçiyor.
- Permission story backend güvenlik testine bağlı.
- Component/story/consumer package sürümleri aynı release kanıtında görünüyor.
- Critical UI gerçek app-shell ve E2E ile doğrulanıyor.
- A11y otomasyon yanında manuel review taşıyor.
- Büyük veri bileşenlerinde performance/virtualization profili var.
- Addon, MDX ve preview supply-chain sınırı tanımlı.
- CI maliyeti ve süresi ölçülüyor; budget aşımı görünür.
- Break-glass kullanımı audit ve telafi işi üretiyor.

## 14. Nihai hüküm

Şimdiye kadar konuşulan model Storybook'u Metaframer'ın UI çalışma ve kanıt yüzeyi yapıyor. Eksik olan, bu yüzeyin kendisini güvenilir ve sürdürülebilir kılacak ikinci seviye yönetişimdir.

En tehlikeli yanlış inanç şudur:

> “Her şeyin story'si varsa UI kontrol altındadır.”

Doğru ifade:

> “Risk-temelli story kapsamı; gerçek schema fixture'ı, deterministik test ortamı, bağımsız baseline review'u, backend güvenlik testi ve ürün E2E'siyle birleşirse UI kontrol altındadır.”

Storybook'un başarısı story sayısıyla değil; kaç gerçek regresyonu erken yakaladığı, kaç sahte güveni engellediği, CI maliyetini ne kadar sürdürülebilir tuttuğu ve gerçek ürünle ne kadar parite koruduğuyla ölçülmelidir.

## 15. Resmî kaynaklar

- [Storybook UI testing](https://storybook.js.org/docs/writing-tests)
- [Storybook accessibility testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Storybook Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index)
- [Storybook interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Storybook visual testing](https://storybook.js.org/docs/writing-tests/visual-testing)
- [Storybook package composition](https://storybook.js.org/docs/sharing/package-composition)
