# Metaframer Storybook Kök-Entegrasyon Gap Analizi

**Tarih:** 2026-07-12  
**Durum:** Repo gerçekliği üzerinden doğrulanmış gap raporu  
**Kapsam:** `actionplan` içerik/veri tabanı, Metaframer doğa metaforları, Storybook + Master Component yönetişimi ve `platform` implementation sınırı

## 1. Yönetici kararı

Claude'un yaptığı çalışma iyi bir **yönerge ve ilk conformance iskeleti** oluşturuyor; fakat Storybook henüz Metaframer'ın genlerine, atomlarına ve içerik tabanına yerleşmiş değildir. Bugünkü durum “Storybook bütünleşti” değil, “Storybook bütünleşmesini tarif eden belgeler ve ilk aday bulucu eklendi” durumudur.

En ölümcül açık şudur:

> `check-ui-delivery.mjs`, 467 düğümün 83'ünü UI adayı buluyor; 83'ünün tamamında `uiDelivery` eksik olmasına rağmen hepsini baseline ile legacy warning'e çeviriyor ve **exit 0 / PASS** veriyor. Geri kalan 384 düğümde açık `uiDelivery: N/A` beyanı da yoktur. Böylece sıfır sözleşmeli corpus yeşil görünmektedir.

Bu bir “migration henüz bitmedi” ayrıntısı değildir. Yeni ve farklı kelimeler kullanan bir UI işi classifier tarafından bulunmazsa sessizce `none` sayılır. Baseline listesine yeni ID eklemeyi teknik olarak engelleyen bir koruma da yoktur. Bu nedenle mevcut yeşil sonuç, Storybook kapsam kanıtı değildir.

## 2. Ölçülen repo gerçekliği

| Ölçüm | Gerçek sonuç | Anlamı |
|---|---:|---|
| `src/data/generated/nodes/*.json` | 467 | Güncel content-base düğüm sayısı |
| `uiDelivery` taşıyan düğüm | 0 / 467 | Corpus'a sözleşme gömülmemiş |
| Classifier'ın UI-impact adayı | 83 / 467 | Yalnız metin sinyaliyle yakalananlar |
| Baseline'a alınan legacy ihlal | 83 / 83 | Bütün bulunan ihlaller susturulmuş |
| Gate sonucu | PASS, exit 0 | Sıfır gerçek uyuma rağmen sahte yeşil |
| Storybook registry JSON'u | 0 | Master Component/story/surface kataloğu yok |
| `docs/storybook-governance-pack.md` | Yok | Çok sayıda canlı referans kırık |
| `platform` içinde `.storybook` / `*.stories.*` | Yok | Implementation henüz başlamamış |
| `uiDelivery` kullanan ürün/render/export kodu | Yok | Şema ve gate dışında tüketici yok |

Classifier'ın bulduğu 83 adayın seviye dağılımı da kök entegrasyon olmadığını gösterir:

| Teknik seviye | Toplam | UI adayı | Kör kalan |
|---|---:|---:|---:|
| `app` / Ada | 28 | 5 | 23 |
| `module` / Dağ | 178 | 38 | 140 |
| `archetype` / Kaya | 105 | 9 | 96 |
| `feature` / Taş | 101 | 27 | 74 |
| `component` / Kum | 18 | 1 | 17 |
| `work_unit` / Molekül | 18 | 2 | 16 |
| `micro_step` / Atom | 19 | 1 | 18 |

Özellikle yalnız 1 Kum, 2 Molekül ve 1 Atomun yakalanması, “atomlara kadar yayıldı” iddiasıyla bağdaşmaz.

## 3. Claude neyi eksik yaptı?

### G0 — Belgede zorunlu, şemada yok

Belgeler aşağıdaki alanları zorunlu ya da gate tarafından denetlenen alanlar olarak anlatıyor; gerçek `UiDeliverySchema` bunların hiçbirini taşımıyor:

- `riskClass`
- `coverageBudget`
- `fixtureContract` ve schema fingerprint
- `baselineGovernance`
- `ownerRef`
- `securityLinkage` / backend authorization evidence
- `manualA11yReviewRef`
- `performanceProfileRef`
- `breakGlass`
- data-density ve yüksek hacim profili
- addon/provenance ve publish classification
- browser/version/federation uyumluluğu

Sonuç olarak `BUDGET_EXCEEDED`, `OWNER_MISSING`, `SECURITY_REVIEW_REQUIRED` ve `MANUAL_A11Y_REQUIRED` gibi belgelerde ilan edilen sinyallerin üretilebileceği veri yoktur. `quality-gates.json` ve `ui-components.json`, uygulanmayan bir kontratı uygulanıyormuş gibi anlatmaktadır.

### G0 — Olmayan governance pack'e canlı referans

`docs/README.md`, `docs/ci-conformance-gates.md`, `docs/engineering-standards-index.md`, Storybook belgeleri ve standart JSON'ları `docs/storybook-governance-pack.md` dosyasına referans veriyor. Dosya yoktur. Bu yalnız kırık link değil; risk bütçesi, fixture güvenliği, baseline kabulü, federation ve ek CI sinyallerinin tek tarif edilen otoritesi kayıptır.

### G0 — Corpus migration yapılmadı

`uiDelivery`, `TaskNode` şemasına opsiyonel eklenmiş; 467 JSON'un hiçbirine işlenmemiştir. “Lazy migration” ifadesi, kapsama kararını sonsuza kadar erteleyebilen bir kaçış kapısıdır. UI ile ilgili her düğümde uygulanabilir sözleşme; ilgisiz her düğümde ise gerekçeli, makine-okunur N/A bulunmalıdır.

Generated JSON'lar elle yamalanmamalıdır. Alan, corpus'un kanonik kaynağına ve generator/migration zincirine eklenmeli; generated çıktılar deterministik yeniden üretilmelidir.

### G0 — Classifier yanlış problemi çözüyor

Classifier yalnız şu alanları tarıyor:

- `title`
- `summary`
- `tags`
- `deliverables`
- `acceptanceCriteria`
- üç `standardRefs` alanı

Şunları kullanmıyor:

- parent/child ve dependency grafı
- `dimensions` ve applicability
- archetype/fragment/surface kontratları
- FieldType `surfaceProjection`
- dosya kapsamı ve package ownership
- consumer/producer ilişkileri
- kaynak şema değişiminin UI'ya yayılımı
- gerçek codebase diff'i

Kelime geçirmek ile UI üretmek birbirine karıştırılmıştır. Bir ADR “Storybook” dediği için doğrudan UI teslimatı sayılabilir; yeni bir UI işi “presentation layer” gibi sözlükte olmayan terim kullandığı için kaçabilir.

Sözleşme şu rolleri ayrı modellemelidir:

```text
produces-ui
changes-ui-contract
governs-ui
consumes-ui
no-ui
```

`impact` tek başına bu ayrımı taşıyamaz.

### G0 — Ratchet delinmeye açık

Baseline notunda “listeye yeni ID eklemek yasaktır” yazıyor; fakat bunu zorlayan immutable snapshot, diff check, approval kaydı veya checksum yoktur. Bir ajan yeni ihlali baseline JSON'una ekleyerek gate'i yeniden yeşile çevirebilir.

Ayrıca iki ayrı baseline dosyası vardır:

- `tools/agents/ui-delivery-baseline.json`
- `reports/ui-delivery-ratchet-baseline.json`

Gate yalnız ilkini tüketir. İkinci dosya kolayca drift eden rapor kopyasıdır. Tek kanonik baseline, migration owner'ı, son tarih, wave ve azaltım monotonluğu bulunmalıdır.

### G1 — Şema yalnız TaskNode'a takıldı; Metaframer köklerine inmedi

Storybook ilişkisi aşağıdaki esas kontratlara bağlanmamıştır:

- FieldType / Value Atom → widget projection
- Fragment → atom kompozisyon story'si
- Archetype → Master Component/pattern kontratı
- Surface → composition story + route/E2E
- Feature/Component/Work Unit/Micro Step → yukarıdaki kontratların teslimat/evidence parçaları
- App/Module → katalog, composition, theme ve ownership sınırı

Yani bugün `uiDelivery`, ağacın yapısal genine değil, yalnız görev düğümünün opsiyonel bir uzantısına eklenmiştir.

### G1 — Export vaadi kodda yok

`task-export-contract.md`, Developer Brief/Agent Prompt/Vobecoder Card içine Storybook kararının taşınacağını söylüyor. Repo aramasında `uiDelivery` tüketen export/render kodu bulunmadı. Kullanıcı veya ajan görevi açtığında sözleşme görünmeyecek; yalnız belge bunu vaat edecektir.

### G1 — Master Component kimliği yok

Bir component'in “master” olduğuna dair benzersiz ID, owner, package export'u, kaynak dosya, sürüm, maturity, consumer listesi ve replacement graph'ı yoktur. `masterComponentRefs` serbest string dizisidir. Var olmayan component'e referans, duplicate master ve iki farklı package'ta aynı master gate'ten geçebilir.

### G1 — Çalışan Storybook yok

`platform` içinde doğrulanan `.storybook`, story dosyası veya Storybook bağımlılığı yoktur. Bu actionplan için doğal olarak implementation-repo sınırıdır; ancak belgeler readiness ile implementation gerçekliğini net ayırmalıdır. Actionplan gate'i “plan sözleşmesi mevcut” kanıtı sunabilir, “Storybook çalışıyor” kanıtı sunamaz.

### G2 — Komut ve geliştirici deneyimi eksik

Workflow doğrudan `node tools/agents/check-ui-delivery.mjs` çalıştırıyor; fakat `package.json` içinde adlandırılmış `qa:ui-delivery` komutu yoktur. Bu CI yokluğu değildir, ama lokal/ajan/CI komutlarının drift etmesine açık bir DX boşluğudur.

## 4. Önceki analizlerde benim düşünemediğim noktalar

Önceki raporlarım Storybook'un felsefe, doğa metaforu, atomik DoD ve unknown-unknown alanlarını tarif etti; ancak aşağıdaki somut sistem sorunlarını yeterince öne çıkarmadı:

1. **467 JSON'un tamamında explicit karar gereği:** Yalnız UI adaylarını doldurmayı düşündüm; oysa sessiz `undefined`, classifier false-negative'ini görünmez kılar. Her düğüm graph-derived karar veya gerekçeli N/A taşımalıdır.
2. **Sözlük değil ilişki grafı:** UI etkisini kelimeden çıkarmak yerine Atom → Fragment → Archetype → Surface ve consumer graph üzerinden yaymak gerekir.
3. **Master Component referans bütünlüğü:** `masterComponentRefs` için hedef registry ve foreign-key kapısı tarif etmedim.
4. **Governance alanlarının şema paritesi:** Unknown-unknown raporundaki riskleri yazdım; aynı alanların Zod şeması, JSON registry ve gate'e birebir girmesini yeterince kilitlemedim.
5. **Baseline bypass tehdidi:** “Ratchet olsun” demek yetmiyor; baseline'ın genişletilmesini teknik ve insan onaylı bir kapıya bağlamak gerekiyor.
6. **UI producer ile UI governance ayrımı:** Storybook'u anlatan belgenin UI artifact ürettiği varsayımını önleyecek rol modeli eksikti.
7. **Generated corpus provenance:** Generated JSON'a elle alan eklemek yerine kanonik kaynak + migration + deterministic generation zincirini açıkça zorunlu kılmadım.
8. **Satılabilir SaaS için tenant/brand isolation:** Storybook preview'larında tenant theme, feature flag, permission ve fixture izolasyonunun veri sızıntısı tehdidini daha açık bağlamadım.
9. **Data-sense doğruluk oracle'ı:** Görsel doğru görünürken freshness, confidence, aggregation, currency/timezone ve rounding semantiğinin yanlış olabileceğini Storybook evidence modeline yeterince bağlamadım.
10. **Composition/version drift:** Bir Master Component story'sinin geçmesi, onu kullanan Surface'in güncel component sürümüyle geçtiğini kanıtlamaz; consumer lock/fingerprint gerekir.

## 5. Eksik JSON aileleri

Aşağıdaki adlar önerilen kanonik kontratlardır. Ayrı dosya sayısını artırmak amaç değildir; tek kaynak ve referential integrity korunabiliyorsa bazıları birleşebilir. Ancak bu veri türlerinin hiçbiri bugün mevcut değildir.

| Önerilen JSON | Zorunlu içerik | Neyi önler? |
|---|---|---|
| `src/data/storybook/master-components.json` | component ID, owner, package/export, source, version, maturity, replacement | Sahte/duplicate master |
| `src/data/storybook/story-catalog.json` | story ID, component/surface ref, state, interaction, source path | Serbest ve doğrulanmayan storyRef |
| `src/data/storybook/ui-artifact-roles.json` | node ID → produces/changes/governs/consumes/no-ui | Kelime temelli yanlış sınıflama |
| `src/data/storybook/surface-component-map.json` | Surface → Archetype → Fragment → Atom → Master graphı | Kökten uca kopukluk |
| `src/data/storybook/field-widget-map.json` | FieldType/surfaceProjection → widget/master/story | Atomların UI karşılığının kaybı |
| `src/data/storybook/component-consumers.json` | master version → app/module/surface consumers | Sessiz breaking change |
| `src/data/storybook/story-coverage-policy.json` | risk class, mandatory states, pairwise budget, browser/theme/locale/density | Kontrolsüz Cartesian patlama veya eksik kapsam |
| `src/data/storybook/fixture-contracts.json` | factory, schema fingerprint, volume, malformed/stale/partial/permission profiles, PII flag | Sahte ve güvensiz fixture |
| `src/data/storybook/evidence-manifest.json` | task/PR/commit, build, interaction, a11y, visual, E2E, reviewer refs | Uydurma URL/evidence |
| `src/data/storybook/visual-baseline-governance.json` | baseline fingerprint, owner, approver, reason, diff class, expiry | Accept-all ve baseline aklama |
| `src/data/storybook/publish-security-policy.json` | public/private, auth, tenant/PII rules, retention, CSP/egress | Preview veri sızıntısı |
| `src/data/storybook/addon-allowlist.json` | addon/version/source/permissions/egress/approval | Supply-chain riski |
| `src/data/storybook/version-compatibility.json` | Storybook/builder/runtime/component/consumer fingerprints | Lokal-CI ve federation drift'i |
| `src/data/storybook/deprecation-migrations.json` | old/new component, codemod/migration story, consumer completion | Sonsuz deprecated component |
| `src/data/storybook/ownership.json` | domain owner, design reviewer, a11y reviewer, SLA/fallback | Owner'sız katalog |
| `src/data/storybook/legacy-ratchet.json` | tek baseline, owner, wave, deadline, immutable origin | Baseline bypass ve çift kaynak |

### 5.1 467 TaskNode için gereken alan

Yukarıdaki registry'lere ek olarak her kanonik TaskNode kaynağı şu kararı üretmelidir:

```json
{
  "uiArtifactRole": "produces-ui | changes-ui-contract | governs-ui | consumes-ui | no-ui",
  "uiDelivery": {
    "applies": true,
    "impact": "direct",
    "reason": "graph ve kontrat temelli gerekçe",
    "masterComponentRefs": ["mc.data-grid"],
    "storyRefs": ["stories/data-grid.stories.tsx"]
  }
}
```

`no-ui` için de alan tamamen kaybolmamalı; somut gerekçe ve karar kaynağı saklanmalıdır. Bu 467 dosyaya manuel kopyala-yapıştır yapılmamalı, generator tarafından üretilmelidir.

### 5.2 Eksik WBS düğüm aileleri

Registry JSON'ları yetmez; işi sahiplenen plan düğümleri de eksiktir. İnsan onayıyla şu aileler app→atom ağacında modellenmelidir:

- Storybook foundation ve static build
- Master Component catalog/ownership
- story interaction + accessibility
- visual regression ve baseline review
- fixture contract factories
- preview publishing/security/retention
- composition/federation/version parity
- addon supply-chain governance
- legacy corpus migration
- data-dense performance ve high-volume stories
- tenant/theme/locale/permission isolation
- deprecation/codemod/consumer migration

Her aile Dağ/Kaya seviyesinde kalmamalı; gerçek Molekül ve Atomlara parçalanmalıdır.

## 6. Doğa metaforlarına doğru yayılım modeli

```text
Ada (app)
  Storybook composition, tenant/theme sınırı, publish politikası
    ↓
Dağ (module)
  domain katalogu, ownership, fixture namespace
    ↓
Kaya (archetype)
  reusable interaction/data contract + Master/Pattern bağı
    ↓
Taş (feature)
  kullanıcı akışı ve Surface composition acceptance'ı
    ↓
Kum (component)
  component API, variants, states, a11y ve deprecation
    ↓
Molekül (work_unit)
  story + fixture + interaction/a11y/visual evidence paketi
    ↓
Atom (micro_step)
  tek doğrulanabilir değişiklik: bir state, interaction, fixture veya assertion
```

Yayılım iki yönlü olmalıdır:

- **Aşağı doğru:** App/Module politikası her Atomun required matrix ve evidence beklentisini türetir.
- **Yukarı doğru:** Atom/Molekül evidence'ı Feature/Surface readiness'ine, oradan App readiness'ine roll-up olur.

Bir ebeveynin Storybook durumu, çocukların metninde “storybook” kelimesi geçip geçmemesinden hesaplanmamalıdır.

## 7. Unknown unknowns — hâlâ açık tehditler

1. **Semantik visual false-positive:** Saat, random ID, locale, font ve animasyon deterministik değilse diff gürültüsü gerçek hatayı saklar.
2. **Authorization tiyatrosu:** Story'de disabled/hidden görünüm göstermek backend yetkisinin uygulandığını kanıtlamaz.
3. **Data-sense semantik hatası:** Doğru render edilen yanlış aggregation/CAC/ROAS/kur dönüşümü görsel testten geçer.
4. **Yüksek hacim yanılsaması:** 20 satırlık fixture geçen DataGrid, 100 bin satırda erişilebilirlik/performance/virtualization açısından bozulabilir.
5. **Tenant sızıntısı:** Preview linkinde gerçek marka, personel, maaş veya finans fixture'ı açığa çıkabilir.
6. **Font ve screenshot lisansı:** Görsel baseline artefact'larının dağıtım/lisans statüsü belirsiz kalabilir.
7. **Addon exfiltration:** Üçüncü taraf addon preview argümanlarını veya fixture'ı dışarı gönderebilir.
8. **Builder farkı:** Vite/Webpack/Next/runtime farklılıkları story'nin ürün içindeki davranışını değiştirebilir.
9. **CSS/container farkı:** İzole story geçerken gerçek shell stacking-context, portal, overflow ve container query davranışı kırılabilir.
10. **Time-travel fixture:** “as-of” finans/HR verisi bugünün master parametresiyle yanlış hesaplanabilir.
11. **Review kapasitesi:** Her diff'e insan onayı gerekirse reviewer kuyruğu delivery'yi kilitleyebilir; risk sınıflı SLA gerekir.
12. **AI baseline laundering:** Ajan component, story ve baseline'ı birlikte değiştirerek hatayı normalleştirebilir.
13. **Orphan story:** Component silinir veya taşınır, katalog story'si ve consumer map yetim kalır.
14. **Master proliferation:** Her lokal bileşeni master ilan etmek catalogue'u kullanılamaz hale getirir.
15. **Story as product fork:** Story için ayrı davranış kodu yazılırsa ürün ile story iki implementation'a dönüşür.

## 8. Kapatma planı

### P0 — Sahte yeşili durdur

1. Eksik `storybook-governance-pack.md` dosyasını gerçek kontrat olarak oluştur veya bütün kırık vaatleri geri çek.
2. Belge/JSON/Zod/gate alan paritesi testi ekle.
3. `uiArtifactRole` modelini ekle; “UI hakkında konuşuyor” ile “UI üretiyor”u ayır.
4. Ratchet baseline'ını tek kaynağa indir; yeni ID eklemeyi approval + monotonic diff kapısıyla engelle.
5. 467 düğüm için graph-assisted sınıflama raporu üret; insan review'ünden sonra kanonik kaynağa migrate et.
6. Migration tamamlanana kadar gate sonucunu `PASS` değil `MIGRATION_INCOMPLETE`/`REVIEW_REQUIRED` olarak raporla.

### P1 — Kök kontratları kur

1. Master Component, story catalog, Field→Widget ve Surface→Component registry'lerini ekle.
2. ID'leri serbest string olmaktan çıkar; foreign-key ve orphan/duplicate gate ekle.
3. FieldType, Fragment, Archetype ve Surface şemalarına Storybook projection bağlarını ekle.
4. Generator'a `uiDelivery`/role üretimini ekle; generated JSON'a elle dokunma.
5. Export, task detail, search/filter ve agent prompt üreticilerinin alanı gerçekten tüketmesini sağla.

### P2 — Implementation evidence'ı bağla

1. `platform` içinde `.storybook`, stories, fixture factory ve static build'i kur.
2. Actionplan refs ile implementation path/commit/test evidence arasında resolver ekle.
3. Interaction, a11y, visual, E2E ve preview publish sonuçlarını evidence manifest'e yaz.
4. Risk/coverage/fixture/baseline/security alanlarını gerçek şema ve gate'te uygula.
5. Lokal ve CI için tek `qa:ui-delivery`/`storybook-ci` giriş noktası oluştur.

### P3 — Sürekli bütünlük

1. Orphan, duplicate master, consumer version drift ve stale baseline kontrollerini bloklayıcı yap.
2. Corpus coverage dashboard'u oluştur: seviye, rol, owner, migration wave, evidence freshness.
3. Yeni UI terimlerine bağlı kalmayan graph/diff classifier'ı gold dataset ile precision/recall testine al.
4. Her yeni FieldType/Archetype/Surface için Storybook projection eksikliğini creation-time'da reddet.

## 9. Tamamlanma tanımı

Storybook entegrasyonu ancak aşağıdaki koşullar birlikte sağlanınca “köklerine kadar yayılmış” sayılır:

- 467/467 düğümde açık, doğrulanmış UI rolü vardır.
- UI üreten/değiştiren her düğüm tipli `uiDelivery` taşır; `no-ui` gerekçelidir.
- Master/story/surface/field referansları registry foreign-key kapısından geçer.
- Belge, JSON standardı, Zod şeması ve gate aynı alanları tanır.
- Baseline genişletilemez; yalnız azalır ve owner/deadline taşır.
- Atom→Surface ve Surface→Atom roll-up deterministik çalışır.
- Export ve ajan promptları gerçek sözleşmeyi taşır.
- `platform` Storybook build/test/evidence üretir; actionplan bu evidence'ı doğrular.
- Sıfır sözleşmeli corpus hiçbir koşulda PASS vermez.
- Storybook'tan söz eden backend/governance işi yanlışlıkla UI artifact producer sayılmaz.

## 10. Son hüküm

Claude'un çıktısı çöpe atılmamalıdır; doğru bir başlangıçtır. Ancak şu anki haliyle **doküman-ağırlıklı, şema-eksik, corpus'a uygulanmamış ve baseline tarafından tamamen susturulmuş** bir başlangıçtır. En büyük hata daha fazla Storybook kuralı yazmamak değil; kuralların tekil IDs, graph ilişkileri, kanonik JSON verisi, generator, runtime consumer ve delinemez gate üzerinden birbirine bağlanmamasıdır.

Öncelik yeni prose eklemek değil, `467 → açık karar`, `0 registry → referential graph`, `PASS → dürüst migration durumu` dönüşümüdür.
