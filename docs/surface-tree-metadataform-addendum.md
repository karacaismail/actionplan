# Surface v2 Eki — tree-navigator + metadata-form + completeness/quality Deseni

Sürüm: 1.0 — 2026-07-01 · Durum: `surface-v2-directive.md`'yi genişleten normatif ek; çelişen tanımı geçersiz kılmaz, iki eksik tip/deseni ekler.
Kaynak: `docs/surface-v2-directive.md`, `docs/surface-spec.md`, `src/schemas/surface.ts`, `docs/reference/PIM-v2-Gereksinim-Analizi.md` (§2.2 metadata-driven form motoru + ağaç görünüm; Faz 1/3/4). Bu doküman *sözleşme/mimari tarif* verir — ürün kodu `platform` reposunda yazılır. Yüzey **çizmez** (ASCII/wireframe yok); her yüzeyi bileşen + prop + state + davranış + token olarak **tanımlar**. Stack: Vite + React + TanStack Router/Query/Table + RHF/Zod; **Next.js, Supabase, Prisma yasaktır**.

---

## 1. Amaç

Surface v2 kataloğu 22 tip taşır ama PIM-v2'nin iki çekirdek desenini birinci-sınıf tip olarak adlandırmaz: (a) kategori/aile/taksonomi **ağaç gezgini** (`PIM-v2 §Faz 1/3` — kategori/family ağaç görünümü, taksonomi ağaç gezgini), (b) sunucu şemasından **metadata-driven dinamik form** (`PIM-v2 §2.2` — herhangi bir varlığı sunucu şemasından render eden form motoru). Ayrıca completeness (tamlık) skoru rozeti + kalite gauge deseni (`PIM-v2 §Faz 4`) bir yüzey tipi değil, tiplere gömülen bir **desen**dir. Amaç: bu ikisini `SurfaceTypeSchema`'ya iki yeni tip olarak eklemek, üçüncüyü paylaşılan desen olarak sabitlemek — davranış sözleşmesi, a11y, i18n/RTL, state ve WBS yerleşimiyle.

## 2. Kapsam

İki yeni Admin-Surface tipi (`tree-navigator`, `metadata-form`) + bir paylaşılan desen (`completeness-badge` + `quality-gauge`). Her ikisi de `renderStrategy: projected` varsayılanıdır (jenerik projeksiyon yeterli; custom kaçış kapısı açık kalır). PIM-v2 karşılığı: Özellik 6 (kategori & aile ağaçları) + Özellik 13 (taksonomi) → `tree-navigator`; Özellik 7 (metadata-driven dinamik form motoru) → `metadata-form`; Özellik 15 (kalite skorlama & completeness) → `completeness-badge`/`quality-gauge` deseni.

## 3. Non-goals

Yeni bir `renderStrategy`, `i18n`, `perf` veya `aiSurface` bloğu **eklemez** — mevcut `SurfaceContractSchema` alanlarını tüketir. Ağaç düzenleme iş mantığını (nested-set/`ltree` yeniden-ebeveynleme, döngü koruması) tanımlamaz; o ArcheType/backend tarafında yaşar, yüzey yalnız beyan eder. Form validation kurallarının *içeriğini* yazmaz; sunucu şemasından türetilen alan→bileşen eşlemesini tanımlar. Completeness skorunun *hesabını* (ağırlık/boyut formülü) tanımlamaz; o `quality_scorer` portundadır, yüzey yalnız görselleştirir.

## 4. tree-navigator surface

**Nedir?** Hiyerarşik kayıt kümesinin (kategori, ürün ailesi, taksonomi düğümü) genişletilebilir ağaç gezgini. **Ne yapar?** Düğüm seç → sağ panele/rotaya bağla; genişlet-daralt, sürükle-taşı ile yeniden-ebeveynle (optimistic), derin ağaçta lazy-load, klavyeyle tam gezinim. **Ne yapmaz?** Ağaç bütünlüğünü doğrulamaz (döngü/derinlik ArcheType kuralı); serbest render etmez (sözleşme okunur).

| Eksen | Sözleşme (bileşen / prop / state / davranış) |
|---|---|
| Bileşen | `TreeNavigatorSurface` — TanStack Query ile lazy düğüm getirir; sanallaştırılmış (görünür düğüm penceresi) |
| Prop | `rootRef` (kök ArcheType düğümü), `childField` (parent→child kenarı), `labelField`, `draggable:bool`, `lazyLoad:bool`, `selectionMode` (`single`/`multi`) |
| State | `expandedIds[]`, `selectedIds[]`, `dragState` (kaynak/hedef/geçerli-mi), `loadingIds[]` (lazy açılan düğüm) |
| Etkileşim | genişlet-daralt (ok/klik); sürükle-taşı → `onReparent` mutation (optimistic + başarısızlıkta rollback); lazy-load (düğüm açılınca çocukları çek); klavye: ↑↓ gez, →/← aç/kapa, `Home`/`End` uç, tip-ahead ile ada atla |
| renderStrategy | `projected` (varsayılan) — panel ağacı sözleşmeden çizer; büyük/özel ağaç (10K+ düğüm, özel drag görselleştirme) `custom`, yönetişim korunarak |
| a11y (WCAG 2.2 AA) | `role="tree"` + düğüm `role="treeitem"` + `aria-expanded`/`aria-level`/`aria-selected`; tek tab-stop + ok-tuşu roving-tabindex; sürükle-taşıya **klavye eşdeğeri** (kes-yapıştır/taşı komutu) zorunlu; odak taşımada görünür-kalır |
| i18n / RTL | düğüm etiketi `messagesRef` tek-kaynak; `rtl:auto` → ağaç girinti + genişlet-oku yön-çevrilir (sağdan-sola indent); tip-ahead locale-collation ile |
| state (empty/loading/error) | `empty`: "kök boş, düğüm ekle" afordansı; `loading`: kök iskeleti (skeleton), lazy düğümde satır-içi spinner, CLS yok; `error`: "ağaç yüklenemedi + yeniden-dene" (`onRetry`, renk-bağımsız metin) |

## 5. metadata-form surface

**Nedir?** Sunucu metadata endpoint'inden (`/api/v1/meta/{entity}`) alınan alan şemasını RHF + Zod dinamik formuna çeviren yüzey. **Ne yapar?** Alan-tipi → bileşen eşler, sunucu şemasından Zod resolver türetir, koşullu alan görünürlüğü uygular, i18n etiketi bağlar. **Ne yapmaz?** Alanları elle sabitlemez (şema-güdümlü); validation kuralını uydurmaz (şemadan türetir); iş mantığı taşımaz.

| Eksen | Sözleşme (bileşen / prop / state / davranış) |
|---|---|
| Bileşen | `MetadataFormSurface` — `metaRef` şemasını okur; RHF `useForm` + `zodResolver` (şemadan türetilmiş Zod) |
| Prop | `metaRef` (sunucu şema endpoint'i), `archetypeRef`, `fieldMap` (alan-tipi→bileşen override tablosu), `mode` (`create`/`edit`), `localeField` (locale-aware EAV değeri) |
| Alan→bileşen | `text`→Input · `number/measure`→NumberInput+birim · `bool`→Switch · `enum/option`→Select · `multi-option`→MultiSelect · `date`→DatePicker · `money`→MoneyInput · `richtext`→Editor · `ref`→EntityPicker · `media`→AssetPicker (eşleme config-driven; `if type X` koda-gömülü dallanma **yasak**) |
| Validation | Zod resolver şemadan türetilir (required/min-max/regex); alan-düzeyi + form-düzeyi hata; sunucu 422'si alan hatasına map'lenir |
| Koşullu alan | `visibleWhen` ifadesi (başka alanın değeri) → bağımlı-alan göster/gizle; gizli alan validation'dan düşer |
| i18n / RTL | alan etiketi/placeholder/hata `messagesRef` tek-kaynak (Surface'te çeviri tekrar yazılmaz); `rtl:auto` → alan hizası + yön çevrilir; sayı/para/tarih CLDR-locale biçimli |
| renderStrategy | `projected` (varsayılan) — şema-render tam da SDUI'ın güçlü olduğu yer; marka-özel form deneyimi gerekirse `custom` |
| a11y (WCAG 2.2 AA) | her alan `<label for>` bağlı; hata `aria-describedby` + `aria-invalid`; hata özeti odaklanır; klavyeyle tam doldurulabilir; zorunlu alan yalnız `*` renkle değil metinle de |
| state (empty/loading/error) | `empty`: (yalnız `create`) temiz form + yönlendirici metin; `loading`: şema/veri gelene dek alan iskeleti, CLS yok; `error`: şema çekilemezse "form yüklenemedi + yeniden-dene"; submit hatası alan-altı + form-üstü metinsel |

## 6. completeness-badge + quality-gauge deseni

**Nedir?** Bir tip değil, `list`/`detail`/`metadata-form` yüzeylerine gömülen paylaşılan desen: tamlık skoru rozeti (liste hücresi/detay başlığı) + kalite gauge (detayda daire/yay göstergesi) + eksik-alan raporu. **Ne yapar?** `quality_scorer` çıktısını (yüzde + alt-skor + eksik-alan listesi) görselleştirir, remediation'a bağlar. **Ne yapmaz?** Skoru hesaplamaz (backend portu); yayını kendi engellemez (publish-öncesi kapı ArcheType kuralı, desen yalnız uyarır).

| Eksen | Sözleşme (bileşen / prop / state / token) |
|---|---|
| Bileşen | `CompletenessBadge` (kompakt rozet) + `QualityGauge` (yay/daire gösterge) + `MissingFieldsReport` (eksik zorunlu alan listesi → alana derin-link) |
| Prop | `scoreRef` (ProductScore kaynağı), `dimensions[]` (içerik/medya/SEO/çeviri/öznitelik/pazar alt-skorları), `threshold` (yayın eşiği; altındaysa uyarı stili) |
| Token | skor bandı **renk + şekil/etiket** ile (renk-körü-güvenli); `gauge-track`/`gauge-fill`/`badge-radius`/`motion` token'ları; eşik-altı bandı yalnız renkle ayrılmaz |
| a11y (WCAG 2.2 AA) | gauge `role="meter"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` + `aria-label`; skor metinle de okunur ("%72, eşik %80 altında"); eksik-alan raporu liste-semantiği + klavye-erişilebilir link |
| i18n / RTL | skor/yüzde locale-biçimli; boyut adları `messagesRef`; `rtl:auto` → gauge yay yönü + rozet hizası çevrilir |
| state (empty/loading/error) | `empty`: "henüz skorlanmadı" (yeni ürün); `loading`: gauge iskeleti/indeterminate, CLS yok; `error`: "skor alınamadı + yeniden-dene", metinsel |

## 7. WBS / surface yerleşimi

İki tip Admin-Surface ailesine girer (`renderStrategy: projected`); desen tiplere gömülüdür. WBS düğümleri surface primitif ailesi altında doğar; PIM-v2 domain düğümü `s-pim` (level `archetype`, parent `app-customer-revenue`) bunları `linkedSurfaces` ile tüketir. Yeni düğümler: `k-surface-tree` ve `k-surface-metadata-form` (seviye `archetype`, `parentId: k-surface`, `dependsOn: k-surface`); desen ayrı düğüm değil, `k-surface`'ın alt-yeteneği (`refines`). `SurfaceTypeSchema` enum'ı `tree-navigator` + `metadata-form` ile genişler (24 tip); `layout` enum'ına `tree` eklenir; mevcut 22 tip ve alanlar geriye-dönük korunur.

## 8. Test

| # | Test | Ne doğrular |
|---|---|---|
| 1 | Tip-şema uyumu | `tree-navigator` + `metadata-form` `SurfaceTypeSchema`'ya uyar; katalog validasyonu yeşil |
| 2 | Ağaç ARIA + klavye | `role="tree"`/`treeitem`/`aria-expanded` doğru; ok-tuşu gezinim + sürükle klavye-eşdeğeri çalışır (axe + Playwright) |
| 3 | Metadata alan eşleme | her sunucu alan-tipi doğru bileşene eşlenir; `fieldMap` config-driven (koda-gömülü `if type` yok) |
| 4 | Zod türetme + koşul | şemadan Zod resolver türer; `visibleWhen` gizli alanı validation'dan düşürür; 422 alan hatasına map'lenir |
| 5 | Optimistic reparent | sürükle-taşı optimistic uygular, backend reddinde rollback yapar (TanStack mutation) |
| 6 | Completeness a11y | gauge `role="meter"` + skor metinle okunur; renk-körü-güvenli band; eksik-alan link klavye-erişilebilir |
| 7 | i18n / RTL | `rtl:auto` ağaç indent + gauge yay + form hiza yön-çevirir; pseudo-loc taşmayı yakalar |
| 8 | State davranışı | üç yüzeyde de empty/loading/error beyanlı; CLS yok; lazy-load iskeleti çalışır |

## 9. Acceptance criteria

(1) `SurfaceTypeSchema` `tree-navigator` + `metadata-form` ile 24 tipe genişledi, `layout` enum'ına `tree` eklendi; (2) üç yüzey de `renderStrategy: projected` varsayılanıyla, `a11y.wcag: 2.2-AA` tabanıyla tanımlı; (3) §8'deki 8 test yeşil; (4) `tree-navigator` sürükle-taşıya klavye-eşdeğeri + `role="tree"` ARIA sağlıyor; (5) `metadata-form` alan-tipi→bileşen eşlemesi config-driven ve Zod resolver sunucu şemasından türüyor; (6) `completeness`/`quality` deseni skoru renk-körü-güvenli + `role="meter"` ile görselleştiriyor, eksik-alan raporu derin-linkli; (7) mevcut 22 tip + alanlar geriye-dönük bozulmadı; (8) PIM-v2 Özellik 6/7/13/15 karşılığı izlenebilir.

## 10. Anti-patterns

Alan-tipi→bileşen eşlemesini `if type === 'x'` ile koda gömmek (config/`fieldMap`-driven olmalı). Sürükle-taşıyı yalnız fare ile sunmak (klavye-eşdeğeri zorunlu; WCAG 2.5.7). Ağacı `<div>` yığınıyla çizip `role="tree"` semantiğini atlamak. Metadata-form validation'ını istemcide elle sabitleyip sunucu şemasından ayırmak (drift). Completeness skorunu yalnız renkle bandlamak (renk-körü çöker; renk + şekil/etiket). Skoru yüzeyde yeniden-hesaplamak (backend `quality_scorer` tek-kaynak). Alan etiketini Surface'te çevirmek (`messagesRef` tek-kaynak; drift). Lazy-load'da içerik-kayması (CLS; iskelet ile yer tutulur).

## 11. DoD (Definition of Done)

`SurfaceTypeSchema` 24 tipe + `layout` `tree`'ye genişledi; iki tip + bir desen sözleşmesi bu ekle tanımlı; §8'deki 8 test yeşil; `check-surface` kapısı yeni tipleri + ağaç-ARIA + metadata-eşleme + completeness-a11y'yi zorluyor; `tree-navigator` klavye-eşdeğeri + `role="tree"`, `metadata-form` config-driven eşleme + Zod türetme, desen `role="meter"` + renk-körü-güvenli band kanıtlı; WBS düğümleri (`k-surface-tree`, `k-surface-metadata-form`) `k-surface` altında açıldı, `s-pim` `linkedSurfaces` ile bağlandı; mevcut 22 tip geriye-dönük bozulmadı; PIM-v2 §Faz 1/3/4 karşılığı izlenebilir.

## 12. Requirement-ID tablosu

| ID | Requirement | Layer | Priority | TestType | AcceptanceCriteria | PIM-v2 | Owner |
|---|---|---|---|---|---|---|---|
| SRF2T-01 | `SurfaceTypeSchema` += `tree-navigator`,`metadata-form` (24 tip); `layout` += `tree` | schema | P0 | unit (Zod) | Katalog validasyonu 24 tip için yeşil | Öz. 6/7 | Ajan PR → İnsan |
| SRF2T-02 | `tree-navigator`: genişlet-daralt + lazy-load + sürükle-taşı (optimistic) | surface | P1 | integration | Test-5 yeşil; reparent rollback çalışır | Öz. 6/13 | Ajan PR → İnsan |
| SRF2T-03 | Ağaç ARIA (`role=tree`/`treeitem`/`aria-expanded`) + klavye + sürükle-eşdeğeri | a11y | P0 | axe + Playwright | Test-2 yeşil; WCAG 2.5.7 klavye-eşdeğeri var | Öz. 6/13 | Ajan PR → İnsan |
| SRF2T-04 | `metadata-form`: sunucu şemasından RHF+Zod dinamik form | surface | P0 | integration | Test-4 yeşil; Zod resolver şemadan türer | Öz. 7 | Ajan PR → İnsan |
| SRF2T-05 | Alan-tipi→bileşen eşlemesi config-driven (`fieldMap`; `if type` yasak) | surface | P0 | unit | Test-3 yeşil; koda-gömülü dallanma yok | Öz. 7 | Ajan PR → İnsan |
| SRF2T-06 | Koşullu alan (`visibleWhen`) + 422 alan-hata map | surface | P1 | integration | Test-4 yeşil; gizli alan validation'dan düşer | Öz. 7 | Ajan PR → İnsan |
| SRF2T-07 | `completeness-badge` + `quality-gauge` + eksik-alan raporu deseni | pattern | P1 | integration | Test-6 yeşil; skor görselleşir, derin-link | Öz. 15 | Ajan PR → İnsan |
| SRF2T-08 | Skor a11y (`role=meter` + metin) + renk-körü-güvenli band | a11y | P0 | axe | Test-6 yeşil; renk + şekil/etiket | Öz. 15 | Ajan PR → İnsan |
| SRF2T-09 | i18n/RTL: ağaç indent + gauge yay + form hiza yön-çevirir | i18n | P1 | pseudo-loc | Test-7 yeşil; `rtl:auto` doğru türer | Öz. 7/13/15 | Ajan PR → İnsan |
| SRF2T-10 | State (empty/loading/error) üç yüzeyde beyanlı; CLS yok | ux | P1 | integration | Test-8 yeşil; lazy iskelet çalışır | Öz. 6/7/15 | Ajan PR → İnsan |
| SRF2T-11 | WBS: `k-surface-tree`,`k-surface-metadata-form` `k-surface` altında; `s-pim` bağlı | wbs | P1 | review | Düğümler açık; `linkedSurfaces` bağı mevcut | Faz 1/3/4 | Ajan PR → İnsan |

---

*Bağlı dokümanlar: `docs/surface-v2-directive.md` (genişletilen yönerge) · `docs/surface-spec.md` (kanonik spec) · `docs/reference/PIM-v2-Gereksinim-Analizi.md` (§2.2 + Faz 1/3/4; Özellik 6/7/13/15) · `docs/ci-conformance-gates.md` (`check-surface` kapısı). Bağlı düğümler: `k-surface`, `k-surface-consumer`, `k-surface-tree`, `k-surface-metadata-form`, `s-pim`. Şema hedefi: `src/schemas/surface.ts` (`SurfaceTypeSchema` += 2 tip, `layout` += `tree`).*
