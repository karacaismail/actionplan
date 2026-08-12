# Docs Korpusu → JSON Yönerge/İçerik Entegrasyonu — Tam Kapsam Raporu

**Tarih:** 2026-07-13
**Durum:** UYGULANDI — sınıflandırılan docs korpusu WBS'ten erişilebilir; 10 sahiplik kararı insan onayı bekliyor. App kimlik kaynağı olan 496 düğümlük snapshot korunur; current-live materialized katalog kanonik `resolveD01NodeUniverse` çıktısıyla doğrulanır. DIRECTIVE-ONLY — bu rapor platform ürün kodu yazdırmaz.
**Soru (kullanıcı):** Pages'ta görünen `docs/` dokümanlarından (1) hangileri JSON yönergelerine aktarılmalı, (2) hangileri için yeni JSON + yeni sayfa gerekir, (3) hangileri mevcut JSON-tabanlı içerik sayfalarına (WBS düğümleri) entegre olmalı, (4) hangileri her yere / her feature'a / her sayfaya entegre olmalı?
**İlişki:** `json-standards-integration-gap-report-2026-07-13.md` aynı sorunun **standartlar eksenini** bugün yanıtladı; bu rapor onu **yeniden yazmaz**, referans verir ve kalan eksenleri tamamlar: WBS düğüm ekseni (refs), archetype-contract registry ekseni, kernel-primitif düğüm ekseni, storybook/surface makine katmanı ekseni, medya ailesi ve "aktarılmayacaklar" sınırı. İkisi birlikte tam cevaptır.
**Kaynaklar:** `AGENTS.md §2` (Altın Kural: kuralı kopyalama, referans ver), `adr-0027-engineering-standards.md`, `dimension-contract-17.md`, `standards-applicability-matrix.md`, `engineering-standards-index.md`, `icerik-kalite-sozlesmesi.md`, `core-enterprise-maturity-ladder.md`, `media-file-manager-maturity-codex-directive-2026-07-13.md`, `src/schemas/task.ts`, `src/data/*` kayıtları.

---

## 0. Uygulama sonucu — tarihsel pre-D01 snapshot ve current-live bağ

Bu tablo 2026-07-14 app kimlik materialization'ı sonrasındaki immutable pre-D01 snapshot'tır. Aşağıdaki
§1-§9 bölümleri ilk 225-belge/117-orphan denetiminin tarihsel planlama baseline'ını korur;
kapsam sayıları için bu bölümün tarihsel ölçümleri üstündür. `496`, app kimlik karar kaydının yeniden
üretilebilir kaynak girdisidir; pre-D01 node snapshot'ıyla aynı metriğin eski/yeni değeri değildir.
2026-07-15 kernel governance karar paketi reference-only gap-audit olarak eklenmiş,
archetype-storage-contract refs hattına bağlanmış ve aşağıdaki kaynak sayımları yenilenmiştir.
Current-live toplam `resolveD01NodeUniverse` ile doğrulanır; tablo live-count authority değildir.

| Ölçüm | Değer |
|---|---|
| Entegrasyon sınıflandırmasındaki Markdown kaynağı | 296 |
| Task içeriğine materyalize edilen | 218 |
| İnsan sahiplik kararı bekleyen | 10 |
| Canonical standard / arşiv / kök indeks kaynağı | 68 |
| Sınıfsız / erişilemeyen | 0 |
| App kimlik kaynak snapshot'ı | 496 |
| Tarihsel pre-D01 materialized fiziksel WBS JSON'u / görev sayfası | 617 |
| Tarihsel pre-D01 aktif WBS kaydı (legacy alias hariç) | 612 |
| Legacy alias / yönlendirme kaydı | 5 |
| Source-specific materyalizasyon kuralı | 250 |
| Canonical standard sözleşmesi | 39 |
| Çözülmüş standard / tech-profile ref | 9.474 |

2026-07-13 refs/materialization dalgasındaki `290/290` executable raw projection,
`206/206` korumalı app/module projection, `2.426/2.426` rule×task eşliği ve
`327/327` task-source bağı (76 sayfa) **496 düğümlük kaynak snapshot'ın tarihsel
projeksiyon baseline'ıdır**. Bu sayılar current-live materialized katalog toplamları gibi
kullanılmaz; yeni app-core kayıtları ve legacy alias'lar ayrı kimlik/materialization
sözleşmeleriyle izlenir.

`catalog:` bağı belgenin docs-hub üzerinden bulunmasını sağlar fakat semantik sahiplik iddiası
kurmaz. `decision:` bağı ise doğru feature/archetype sahibinin bulunmadığını ve yeni app/module
kararının insan yetkisinde kaldığını açıkça gösterir. Dinamik Vitest kapısı sınıflandırılan her Markdown'ın
en az bir WBS `refs[]` bağından erişilmesini, catalog/decision sınıflarının ayrılmasını ve exact path
sınırını zorlar; public aggregate `npm run gen:reindex` ile kanonik node refs'leriyle eşlenir.
Task-materialize ve human-decision sınıflarının yürütülebilir yönergeleri yalnız `refs[]` olarak
bırakılmaz: ilgili executable görevin 17-boyut JSON kartındaki `items` ve `prompt` alanlarına
task-specific clause olarak yazılır. App ve app-module kayıtlarındaki enterprise/SDK yükümlülükleri
generic prose kopyasıyla değil, typed app/module sözleşmeleri ve kaynak-bağlı effective directive
projeksiyonuyla sayfa, export ve agent prompt'unda görünür.

İnsan sahiplik kararı bekleyen 10 belge şunlardır: `archetype-venture-core-directive.md`,
`drafts/k-kms-directive.md`, yedi kernel primitifi (`k-evidence-seal`, `k-kms`,
`k-legal-hold-retention`, `k-migration-bridge`, `k-obligation-commitment`, `k-provider-adapter`,
`k-signature-trust`) ve `reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md`. Son belge için
tek düğüm yeterli değildir: generic EVM, ayrı Arsam marketplace ürün sınırı ve venture-core
archetype'ı insan changeset'iyle kararlaştırılmalıdır.

---

## 1. Tarihsel yöntem ve sayısal envanter (uygulama öncesi baseline)

İlk denetim 2026-07-13'te salt-okunur yapıldı: o anda 225 `docs/*.md` dosyası tarandı; 485 WBS düğümünün (`src/data/generated/nodes/*.json`) tamamının `refs[]` alanı çıkarıldı; `src/data` altındaki makine katmanları listelendi. Bu paragraf tarihsel baseline'dır; güncel kapanış §0'dadır.

Bu tablo envanterin sayısal özetini verir.

| Ölçüm | Değer |
|---|---|
| `docs/*.md` toplam | 225 |
| En az bir düğümün `refs[]`'inde geçen doküman | 108 |
| Hiçbir düğümden referans almayan (orphan) doküman | **117** |
| WBS düğümü (JSON içerik sayfası) | 485 — app 28, module 178, archetype 105, feature 101, component 18, work_unit 19, micro_step 36 |
| Makine standart sözleşmesi (`src/data/standards/*.json`) | 31 |
| Registry/policy JSON katmanları | `archetypes/` (yalnız 3: customer, order, product), `storybook/` (16), `surface/` (2), `eca/` (1), `url-policy/` (2), `atom-definition-registry.json`, `platform-product-code-write-policy.json`, `tech-profiles.json` |
| En çok referans alan dokümanlar | `task-to-code-contract.md` (89), `dimension-contract-17.md` (87), `engineering-standards-index.md` (87) |

Kritik teşhis: **orphan olmak tek başına gap değildir.** Bir doküman dört farklı mekanizmayla "entegre" olabilir; doğru soru "hangi mekanizmayla entegre olmalıydı da değil?" sorusudur. Bu yüzden 117 orphan'ın tamamı §3-§7'de kovalara atanmıştır; sınıfsız doküman kalmamıştır.

## 2. Entegrasyon mekanizmaları — "JSON'a aktarmak" ne demek

Bu repoda bir `.md` yönergesinin JSON dünyasına bağlanmasının beş yolu vardır; rapor boyunca kovalar bu mekanizmalara işaret eder.

| Mekanizma | Nerede | Ne zaman doğru |
|---|---|---|
| M1 — Düğüm `refs[]` bağı | `src/data/generated/nodes/*.json` | Doküman bir düğümün gerekçe/sözleşme kaynağıysa (içerik sayfasında "kaynaklar" olarak görünür) |
| M2 — Standart sözleşmesi + `standardRefs` anahtarı | `src/data/standards/<id>.json` + `task.ts` | Kural CI-zorlanabilir değer taşıyorsa (eşik, yasak, zorunlu alan) |
| M3 — Registry/policy JSON | `src/data/` altındaki archetypes, storybook, surface, eca, url-policy kayıtları | Doküman makine-okunur katalog/kayıt gerektiriyorsa (şema, story, kural kataloğu) |
| M4 — Şema alanı (her düğümde yaşayan) | `dimensions`, `applicability`, `waivers`, `evidence[]`, `uiDelivery`, fazlar | Kural her düğümün kendi verisinde beyan istiyorsa |
| M5 — Kapı (gate) | `tools/agents/check-*.mjs` + vitest + deploy.yml | Kuralın ihlali otomatik yakalanacaksa |

Altın Kural burada da geçerlidir: Markdown'ın tamamı current-live materialized sayfalara körlemesine kopyalanmaz; kural
tek JSON registry kaydında yaşar, ilgili görevlerin `items` ve `prompt` alanlarına task-specific
clause olarak materyalize edilir ve kaynak bağı korunur (`AGENTS.md §2`, ADR-0027).

## 3. KOVA A — Yeni JSON yönergesi + yeni sayfa gerekenler

### 3.1 Standart sözleşmeleri (delege — bugünkü kardeş rapor)

`json-standards-integration-gap-report-2026-07-13.md §1` beş P0/P1 + iki P2 yeni sözleşmeyi zaten tanımladı: `global-market-readiness` (P0), `finance-money-model` (P0), `identity-data` (P1), `search-quality` (P1), `decision-grade-data` (P1), `capability-entitlement` (P2), `venture-core` (P2) + atom-registry zaman tipleri. Bu rapor listeyi tekrarlamaz; tek ekleme şudur: her yeni sözleşme sayfası, kaynağı olan `.md`'ye **geri-referans** vermeli ve kaynak `.md` anlatıya dönüşmelidir (çift-otorite yasağı).

### 3.2 Archetype directive'leri → archetype-contract registry + WBS düğümleri

Kanıt: `src/data/archetypes/` altında yalnız 3 kayıt var (customer, order, product) ve bu üçünün hem registry JSON'u hem WBS düğümü hem `archetype-contract:` ref deseni mevcut — **desen kurulmuş, kapsam doldurulmamış.** Aşağıdaki 15 archetype directive'i orphan ve registry'siz:

`archetype-eav`, `archetype-taxonomy`, `archetype-tree-relation`, `archetype-ledger`, `archetype-order-line-item`, `archetype-inventory-stock`, `archetype-listing`, `archetype-messaging-thread`, `archetype-org-employment`, `archetype-budget-plan`, `archetype-document-composition`, `archetype-agreement-lifecycle-negotiation`, `archetype-variant-attribute-family`, `archetype-venture-core`, `archetype-uretim-spec` (+ hüküm dokümanı `archetype-storage-canonical`).

Gereken (her biri için): (a) `src/data/archetypes/<id>.json` sözleşme kaydı (alan adı+tip+amaç düzeyinde; mock değersiz), (b) ilgili WBS `archetype` düğümü — **yeni düğüm insan onaylı** (AGENTS §4.4 module/app yasağı archetype için kapsam-onayı ister; changeset olarak sunulur), (c) düğüm `refs[]` → directive `.md` bağı (M1), (d) `check-archetype-relation.mjs` (drafts'ta mevcut taslak) kapıya terfi (M5). `archetype-storage-canonical` ayrıca `k-archetype-storage` düğümüne ref olarak bağlanır; kendisi registry değil hüküm dokümanıdır.

### 3.3 Kernel primitif directive'leri → düğümsüz 7 sözleşme

Kanıt: aşağıdaki 7 kernel directive'inin semantik sahibi olacak **WBS module düğümü yoktur**. Güncel durumda belgeler kaybolmaz; `std-docs.refs[]` içindeki `decision:` bağlarıyla insan karar kuyruğundan erişilir:

| Doküman | Önerilen düğüm | Not |
|---|---|---|
| `k-kms-directive.md` (drafts kopyası da var — teke indirilmeli) | `k-kms` (module, app-layer0) | Anahtar yönetimi; k-storage şifreleme bağı |
| `k-legal-hold-retention-directive.md` | `k-legal-hold` (module) | Medya ailesi C4 gereksinimi buna bağlanır |
| `k-provider-adapter-directive.md` | `k-provider-adapter` (module) | Storage/mail/SMS sağlayıcı deseni |
| `k-signature-trust-directive.md` | `k-signature-trust` (module) | s-esign tüketicisi |
| `k-evidence-seal-directive.md` | `k-evidence-seal` (module) | DoD evidence zinciriyle ilişkili |
| `k-migration-bridge-directive.md` | `k-migration-bridge` (module) | expand-contract köprüsü |
| `k-obligation-commitment-directive.md` | `k-obligation` (module) | CLM/agreement bağı |

Gereken: insan-onaylı module-düğüm changeset paketi + her yeni düğümün doğrudan semantik `refs[]` bağı. Düğüm doğana kadar `decision:` sınıfı korunur; belge Pages ve WBS docs-hub'dan erişilebilir, fakat implemented/owned sayılmaz.

### 3.4 Medya ailesi (dünkü yönergeye delege)

`media-file-manager-maturity-codex-directive-2026-07-13.md` İş-1..İş-10 planını verdi: 8 yeni/güncel doküman + `l1-media` düğümü + `l1-file.dependsOn` düzeltmesi (İş-10, insan onaylı). JSON tarafı ekleri: kota capability tanımı (`k-capability` verisine), rendition spec registry (M3 sınıfı, `src/data/` altına — İş-5 dokümanı şeklini tanımlar), `asset` surface'inin url-policy registry'de zaten mevcut satırıyla bağ.

### 3.5 Makine-karşılığı önerilen iki destek kaydı (P2-P3)

(a) `standards-applicability-matrix.md` bugün yalnız anlatı; Z/Ö/N-A matrisi makine-okunur olursa `check-standards-coverage` seviye-bazlı zorlayabilir (P2 — ADR-0027 uzantısı, insan kararı). (b) Üç `*-numeronym-eslemesi.md` haritası tek bir `naming-map` JSON'una inebilir (P3; yalnız tutarlılık lint'i için).

## 4. KOVA B — Mevcut JSON içerik sayfalarına entegre edilecekler (M1 refs turu)

Bu sınıfta yeni JSON açılmaz; orphan doküman, halihazırda var olan düğümlerin `refs[]`'ine bağlanır. Not: module/app düğümü güncellemek kapsam-onayı istediğinden bu tur **tek toplu changeset önerisi** olarak insana sunulur; içerik (hangi düğüme hangi ref) aşağıdadır.

| Doküman (orphan) | Bağlanacağı mevcut düğüm(ler) |
|---|---|
| `adr-A1-actor-party.md` / `adr-A2-capability.md` / `adr-A3-mode-profile.md` / `adr-A4-computation.md` / `adr-K1-kernel-kimlik.md` / `adr-P1-pdp.md` / `adr-0026-tech-profiles.md` / `adr-0028-olculu-kisa-taslak.md` | Sırasıyla `k-party`/`k-actor`, `k-capability`, `k-mode`, `k-computation`, `k-schema`+`app-kernel`, `k-policy-pdp`, `fe-eng-standards`, `app-kararlar` |
| `actor-party-contract.md`, `capability-entitlement-contract.md`, `pdp-policy-contract.md`, `computation-derivation-contract.md` | `k-party`, `k-capability`, `k-policy-pdp`, `k-computation` |
| `surface-spec.md`, `surface-v2-directive.md`, 3 × `surface-*-addendum.md`, `surface-numeronym-eslemesi.md` | `k-surface`, `k-surface-consumer` (+ ilgili dist-* aday düğümleri) — makine katmanı (`surface-catalog.json`, `schemas/surface.ts`) zaten var; kopan yalnız M1 bağı |
| `storybook-implementation.md`, `storybook-master-component-integration-directive.md`, `storybook-governance-pack.md` | `fe-eng-standards`, `platform-ui-surface`, `k-surface-consumer` — `src/data/storybook/` (16 JSON) + `uiDelivery` alanı zaten canlı; refs eksik |
| `scale-invariant-directive.md` | `k-worker` (+ medya İş-5 dokümanı yayınlanınca oradan da) |
| `event-replay-projection-contract.md` | `k-bus`, `k-computation` |
| `kernel-execution-contract-matrix.md`, `execution-context-envelope-directive.md` | `app-kernel`, `k-agent-runtime` |
| `claude-ai-archetype-eca-directive.md` | `k-schema` + ECA makine kataloğu `eca/ruleset-catalog.json` (delta varsa J-turunda) |
| `privacy-retention-decision-matrix.md` | Risk-sinyalli düğümlerin `dataLifecycle` boyut atıfları + `privacy.json` deltası (kardeş rapor §2'ye delege) |
| `core-enterprise-maturity-ladder.md` | 121 `sellable-app` düğümü — ama doğru mekanizma refs değil **alan**dır; bkz. §5.3 |
| `pim-ozellik-yonerge-kapsama.md`, `pim-product-archetype-referans.md` | `s-pim` |
| `agreement-clm-app-referans.md`, `kapsama-matrisi-agreement-clm-2026-07-01.md` | agreement/CLM düğümleri (`s-esign`, ilgili archetype düğümü doğunca) |
| `kapsama-matrisi-kernel-archetype-surface-2026-07-01.md`, `kapsama-matrisi-arsam-panel-2026-07-12.md`, `kume-e-panel-eca-plan.md`, `panel-tier-contract.md` (drafts) | `app-kernel`, `k-control-planes`, boyut-panel düğümleri (`k-boyut1..3`) |
| `dod-evidence-schema-directive.md`, `evidence-taxonomy.md` | `dx-workflow` + `platform-factory` (evidence[] alanının anlatı kaynağı olarak) |
| `k-storage-dam-directive` medya ekleri (İş-1..İş-9 çıktıları) | `k-storage`, `l1-file` (İş-10 changeset'iyle) |
| `i18n-standard.md` (kök) | **Duplikasyon riski:** `standards/01-i18n-l10n-g11n-standard.md` ile çift-otorite; teke indirilip diğeri yönlendirme olmalı (insan kararı) |
| `icerik-kalite-sozlesmesi.md`, `wbs-field-semantics.md`, `waiver-policy.md`, `release-policy.md`, `ai-governance-master.md`, `doc-maintainer-operating-boundary.md`, `platform-product-code-write-prohibition-directive.md`, `ci-conformance-gates.md`, `dimension-migration-runbook.md`, `prompt-template-library.md`, `vibecoding-prompt-playbook.md`, `workflow-directive.md` | Makine/kapı karşılıkları zaten var (contentQuality testi, check-waivers, release-versioning.json, ai-governance.json, write-policy.json, deploy.yml, workflow-catalog.json). Düğüm-refs zorunlu değil; yalnız `engineering-standards-index.md`/`docs/README.md` indeks bağları eksiksiz tutulur. Orphan olmaları kabul edilebilir. |

## 5. KOVA C — "Her yere" entegrasyon: üç ayrı soruya üç ayrı cevap

"Heryere entegre olmalı" tek mekanizma değildir; kardeş raporun ilkesi geçerli: **yeni alan icat edilmez, kural JSON'a girer, doğrulanmış current-live materialized sayfalar raw/effective referansla veya açık N/A gerekçesiyle sözleşmeye bağlanır.** Kopyalama anti-pattern'dir. Kaynak kimlik snapshot'ı 496 olarak ayrı tutulur.

### 5.1 Her current-live düğüme / her materialized sayfaya — global sözleşmeler + açık kararlar

Zaten her sayfada yaşayanlar (kanıt: şema + kapılar): 17 boyut (`dimension-contract-17` ↔ `dimension-semantics.mjs`), `standardRefs` + `applicability` + `waivers`, `evidence[]`, 7 waterfall fazı (`task-to-code-contract`, 89 düğümde açık ref + şema herkese uygular), AI yetki sınırı (`platform-product-code-write-policy.json` + her düğümün `aiAgents` boyutu), içerik-kalite kapısı. **Bunlar için yapılacak yayılım işi yoktur.**

Açık iki konu:

1. **`maturity_level` alanı (L1/L2/L3)** — ADR-D3.1 insan kararı kilitlenmeden 121 `sellable-app` için değer uydurulmaz; bu kaynak `human-decision` blocker olarak ilgili görevlerde görünür. Karar sonrası app-seviyesi değer alt düğümlerce miras alınır.
2. **Kaynak-geri-bağı:** J2-J3 standartları applicability overlay'leriyle tamamlandı; ilgili düğümler ref'i otomatik çözer. Elle tüm current-live JSON'lara aynı standart metni kopyalamak yerine görev sayfası sözleşmenin tam kuralını gösterir.

### 5.2 Her feature'a (100 feature + 18 component)

Kardeş rapor §3.2 ref terfileri geçerlidir: `financeModelRef`/`identityDataRef`/`searchQualityRef` yalnız ilgili veri sınıfına dokunan feature'larda Z; `i18nRef` feature-Z terfisi CPO kararı bekliyor. Bu raporun eki: **`uiDelivery`** UI-etkili her feature/component'te zaten zorunlu mekanizmadır (`check-ui-delivery` + ratchet); storybook üçlüsünün "her feature'a entegrasyonu" bu alandan geçer, yeni mekanizma kurulmaz. Medya ailesinden tek feature-genel kural: görsel taşıyan her feature'ın `wcag` boyutunda alt-text beyanı (medya yönergesi O1) — bu da boyut içeriğidir, yeni alan değildir.

### 5.3 Her UI sayfasına (UI yüzeyi olan düğümler)

`wcag` + `mobileApps` boyutları UI'lı düğümlerde zaten zorunlu (N/A ancak gerekçeli). Eklenecekler: (a) a11y×i18n deltaları `a11y.json`'a girince tüm UI sayfaları miras alır (kardeş rapor §2); (b) Surface şemasına locale/market beyan alanı (kardeş rapor §3.3); (c) medya tüketen surface'lerde responsive tüketim kuralı (medya yönergesi S4) — `design-system.json`/`ui-components.json` deltası olarak tek yerden.

### 5.4 Bilinçli olarak yayılmayacaklar

Launch-gate (app+release seviyesi), `venture-core` (yalnız EVM), moderasyon kuralları (yalnız UGC-dokunan düğümler), tüm KOVA D. Gerekçe: alakasız düğüme yayılan kural gürültüdür ve içerik-kalite kapısının "sayfaya-özel madde" ilkesini bozar.

## 6. KOVA D — ilk orphan denetiminin tarihsel reference-only alt kümesi

Raporlar, denetimler, planlar ve örnek/not dosyaları **karar günlüğü/evidence** sınıfıdır; JSON yönergesine çevrilmez (çevrilirse tarih dondurulmuş analiz "kural" gibi davranır — drift). İlk 117-orphan denetimindeki tarihsel alt küme (39) aşağıdadır; güncel kanonik `reference-only` toplamı §0'da 64'tür:

`PENDING-HUMAN-FIXES-2026-07-01`, `README` (docs indeksi), `atom-archetype-bagi-clm-ornegi-2026-07-01`, `atom-micro-step-gap-unknown-unknowns-report-2026-07-12`, `atomik-primitif-katman-gap-2026-07-01`, `audit-report`, `data-quality-report`, `doc-maintainer-boundary-gap-report-2026-07-08`, `execution-readiness-gap`, `gap-2026-07-02-00..06` (6 dosya), `golden-node-examples` (eğitim örneği), `governance-plan`, `historical-gap-report-freshness-gap-report-2026-07-08`, `implementation-prompt-boundary-gap-report-2026-07-08`, `implementation-workspace-reality-gap-report-2026-07-08`, `json-standards-integration-gap-report-2026-07-13` (kardeş rapor — kendisi de bu sınıfta), `kernel-sdk-app-sequence-gap-report-2026-07-08`, `kume-e-panel-eca-plan`, `micro-step-atom-gap-claude-vibecoding-2026-07-02`, `next-30-days-plan`, `node.md` (çalışma notu — temizlik adayı), `platform-implementation-advanced-gap-report-2026-07-09`, `repo-reality-audit`, `rewrite-debt-cleanup-plan`, `short-items-wave2/3-plan` (2), `storybook-root-integration-gap-report`, `storybook-unknown-unknowns-gap-report`, `storybook_gap`, `wave4-plan`, `wave4-review-map`, `weak-content-17-report`, `work-unit-molecule-gap-claude-vibecoding-2026-07-02`, `yapi-content-celiski-denetimi-2026-07-08`.

İki not: (1) Düğümlerden zaten referans alan rapor/plan dokümanları (ör. `wave2/3/4-*-readiness-gap`, `kernel-dokuman-gap`, `platform-repo-reality-audit`) doğaları gereği yine bu sınıftadır; ek iş gerektirmezler çünkü M1 bağları kurulmuş durumdadır. (2) Bu raporun kendisi de D sınıfına girer. Güncel-durum denetimleri ilgili düğümlere **evidence/refs** olarak bağlanabilir (mevcut desen: `platform-factory` ← reality-audit).

## 7. Tarihsel sayısal kapanış — ilk 117 orphan'ın kova dağılımı

Bu tablo ilk denetimin planlama dağılımıdır; güncel sınıflandırma kapanışı §0'da 292/218/10/64 olarak verilmiştir.

| Kova | Adet | İçerik |
|---|---|---|
| A2 — archetype registry + düğüm | 16 | 14 registry-aday archetype directive + `archetype-uretim-spec` (üst spec) + `archetype-storage-canonical` (hüküm; ref-bağ) |
| A3 — kernel düğümü eksik | 7 | k-kms, k-legal-hold-retention, k-provider-adapter, k-signature-trust, k-evidence-seal, k-migration-bridge, k-obligation-commitment |
| A1/A4/A5 — standart/registry ekseni | 7 | global-market-readiness, financial-state-model, decision-grade-data, capability-entitlement, core-enterprise-maturity-ladder (alan), i18n-standard (tekilleştirme), media yönergesi (İş planına delege). Not: `atomic-types-directive` düğüm-referanslı olduğundan orphan sayımına girmez; registry işi kardeş raporda tanımlı |
| B — mevcut düğüme refs | 48 | §4 tablosundaki doc-ADR'ler (8), sözleşmeler, surface ailesi (6), storybook üçlüsü, PIM/CLM/panel eşlemeleri, numeronym haritaları (3), kanonik-yönetişim seti (12) |
| D — aktarılmaz | 39 | §6 listesi |
| **Toplam** | **117** | — |

## 8. Tarihsel uygulama sırası ve kalan insan kapıları

Bu tablo ilk denetimin uygulama planını korur. Makineye aktarılabilen içerik güncel rule registry ve owner-leaf görevleriyle materyalize edilmiştir; şema değeri veya silme/tekilleştirme kararı isteyen satırlar insan kapısı olarak kalır. Aktörler: *Codex* doküman/registry taslağı üretir, *CI* kapıları doğrular, *insan* düğüm/şema/ADR kararlarını onaylar.

| Faz | İş | İnsan kapısı |
|---|---|---|
| E1 | KOVA B refs turu — tek changeset önerisi (36 doküman → düğüm eşlemesi, §4 tablosu birebir) | Evet: module/app düğüm `refs[]` mutasyonu kapsam-onayı ister |
| E2 | Archetype registry doldurma: 15 `src/data/archetypes/<id>.json` taslağı (test-önce: registry şema testi) + archetype düğüm changeset'i | Evet: yeni archetype düğümleri |
| E3 | Kernel 7'lisi düğüm changeset'i + refs | Evet: yeni module düğümleri |
| E4 | Medya İş-1..İş-10 (kendi yönergesindeki sırayla) | Evet: İş-10 + ADR-S1 |
| E5 | `maturity_level` alanı: ADR-D3.1 taslağı + `task.ts` şema değişikliği (test-önce) + 121 `sellable-app` kaydına insan-onaylı değer ataması | Evet: ADR-D3.1 + şema |
| E6 | Temizlik: `i18n-standard.md` ve `k-kms` drafts/docs çift kopyalarının teke indirilmesi; `node.md`/`zz-scratch` arşivi | Evet: silme kararı |

Sıra gerekçesi: E1 ucuz ve navigasyonu hemen onarır; E2-E3 içerik sayfası sayısını büyüttüğü için içerik-kalite kapasitesine bağlıdır; E5 şema migration'ı içerdiğinden test-önce zorunludur (`AGENTS.md §3`).

## 9. Dört soruya bire bir özet

1. **Yeni JSON yönerge + yeni sayfa:** standart ekseni kardeş raporun 5+2 sözleşmesi; bu rapordan: 16 archetype dokümanı (14 registry kaydı + uretim-spec/storage-canonical bağları) ve düğümleri, 7 kernel module düğümü, medya ailesinin İş-planı çıktıları, `maturity_level` alanı (ADR-D3.1), P2 aday olarak applicability-matrix ve naming-map makineleşmesi.
2. **Mevcut JSON içerik sayfalarına entegre:** 228 aktif/human-decision kaynak 250 rule'a ayrıldı. Kaynak snapshot'ın `290` executable görev / `2.426` rule×task projeksiyonu tarihsel baseline'dır; current-live materialized kayıtların app/module kimlik ve typed sözleşme kapsamı ayrı sayılır.
3. **Her yere / her feature / her sayfa:** Doğrulanmış current-live materialized sayfalar standard ref sözleşmesine bağlıdır; typed app/module sözleşmeleri source-owned directive'leri sayfa, export ve agent prompt'una taşır. `496`, bu toplamın alt kümesi değil kimlik göçünün sabit kaynak snapshot'ıdır.
4. **Aktarılmayacaklar:** 64 `reference-only` rapor/plan/denetim (§0; §6 ilk tarihsel alt kümeyi listeler) — bunlar evidence katmanıdır; JSON yönergesine çevrilmesi bilinçli olarak reddedilir.

---

*Kardeş doküman: `json-standards-integration-gap-report-2026-07-13.md` (standart ekseni). Bu rapor `icerik-kalite-sozlesmesi` biçim kurallarına uyar: aktör-açık, emoji yok, her tablodan önce açıklama, kural kopyası yerine referans.*
