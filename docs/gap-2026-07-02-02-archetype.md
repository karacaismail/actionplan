# Gap Analizi — ARCHETYPE Katmanı (2026-07-02)

- Kapsam: `docs/archetype-*.md`, `atomic-types-directive.md`, `atomik-*.md`, `fragments-directive.md`, `golden-node-examples.md`, `dod-evidence-schema-directive.md`, `pim-*.md`, `claude-ai-archetype-eca-directive.md`, `src/schemas/archetype.ts`, `src/data/archetypes/*`.
- Durum: current. `elestiri-01-archetype-2026-07-01` dosyasını günceller.
- Şiddet ölçeği ve terimler için `gap-2026-07-02-00-index.md`.

---

## 1. Bu katman nedir, ne yapar, ne yapmaz

Archetype **nedir**: yeniden kullanılabilir alan metamodelleri katmanı. Bir ArcheType, generated CRUD'u (otomatik üretilen kayıt yönetimi) besleyen sözleşmedir (kimlik, alanlar, fragment'ler, ilişkiler, doğrulama, izin, yaşam döngüsü, typed action, arama, audit, göç, tenant, ECA, AI politikası).

Archetype **ne yapar**: domain'i veri olarak modeller; typed action + lifecycle guard ile durum geçişini kapıya bağlar; generated CRUD'un lifecycle-yönetimli alanları doğrudan yazmasını *yönergeyle* yasaklar.

Archetype **ne yapmaz**: atom tiplerini kendisi tanımlamaz (atomic-types'a devreder); imza/mühür (k-signature), yükümlülük (k-obligation), belge render (document-composition), kanıt kasası (k-evidence) çalıştırmaz — bunları *besteler*. Binary/medya saklamaz (k-storage-dam).

---

## 2. Mevcut yönergeler (envanter)

Aşağıdaki set gerçek ve iç-referanslıdır; hepsi ortak bir normatif şablon izler (Amaç→Kapsam→Non-goals→nedir/yapar/yapmaz→sözleşme şekli→WBS→backend→frontend→tenant→AI guardrail→test→AC→anti-pattern→DoD). Bu şablon tutarlılığı güçlü bir olgunluk sinyalidir.

- `archetype-uretim-spec.md` — kanonik spec; 23-parçalı sözleşme ailesi + §12 v2 uzantıları (actor/party, capability, mode-profile, computation, MRP BOM-graph/routing/costing, i18n zorunluluğu).
- `archetype-agreement-lifecycle-negotiation-directive.md` — CLM (sözleşme yaşam döngüsü), setin en derini (~335 satır).
- `archetype-document-composition-directive.md` — şablon+değişken+koşullu-madde belge birleştirme.
- `archetype-eav-directive.md` — dinamik öznitelik (EAV), JSONB vs tipli sütun karar matrisi.
- `archetype-storage-canonical-directive.md` — **KİLİTLİ (ADR-A5)**; setteki tek kilitli yönerge. 3-yönlü depolama çatışmasını çözer (JSONB varsayılan + sorgu-ısısına göre fiziksel tabloya terfi).
- `archetype-taxonomy-directive.md` — ETIM/UNSPSC/GPC + GS1 checksum.
- `archetype-tree-relation-directive.md` — tree/dag/graph/temporal ilişki türleri.
- `archetype-variant-attribute-family-directive.md` — Akeneo sınıfı PIM varyant/öznitelik.
- Atom kademesi: `atomic-types-directive.md`, `fragments-directive.md`, `atomik-netlestirme` (atom↔fragment↔archetype 3 kademe kararı), `atomik-tip-katalogu-tam`, `atomik-primitif-katman-gap`.
- Referans/kanıt: `pim-product-archetype-referans.md`, `atom-archetype-bagi-clm-ornegi`, `claude-ai-archetype-eca-directive.md`, `dod-evidence-schema-directive.md`.

Gerçek örnek ArcheType (fixture) sayısı: **yalnız 2** — `product.json` ve `customer.json`.

---

## 3. Codex raporuna göre güncel doğrulama (archetype)

Codex ekseninde archetype tarafı ilerlemiş: variant-attribute-family, eav, taxonomy, tree-relation yönergeleri yazılmış (Codex bunları eksik gördüğü dönemin sonrasında). Ancak Codex'in atomik-tip borcu tespiti **hâlâ geçerli**: tip sözlüğü geniş ama gerçek fixture'larda kullanılmıyor (aşağıda G-A6).

---

## 4. Boşluklar

Önce "isimlendirilmiş ama yazılmamış" ile "hiç yok" ayrımı: Workflow her yerde birinci sınıf kavram olarak *adlandırılır* ama yönergesi **hiç yoktur** — bu en kritik açıktır.

### P0 — kurucu boşluklar

**G-A1. Workflow yönergesi hiç yok.** `LifecycleSchema` (states/initial/transitions + guard) çekirdek şemada var ve iki fixture'da kullanılıyor; ama bu basit doğrusal durum makinesidir. `archetype-uretim-spec §2` Workflow'u Surface'in kardeşi, "ayrı versiyonlanır" birinci sınıf kavram olarak *adlandırır*; `linkedWorkflows` her yerde referanslanır — ama `workflow-directive.md` **hiç yoktur** (paralel branch, SLA timer, escalation olan gerçek iş akışı motoru tanımsız). Onay zinciri gereken her ürün (PMS, HRMS, accounting, CLM) boşta referansa güvenir.

**G-A2. Çift-taraflı muhasebe (ledger/journal) metamodeli yok.** Grep 0. Accounting + MRP costing (§12.D "costing değişimi yeni dönem açar" = dönem-kapatma varsayar) yapısal olarak ledger gerektirir; yok.

**G-A3. Order/line-item + fulfillment yok.** `customer.json` `relations`'ta `"target":"order"` referansı var ama **Order ArcheType tanımsız** — yani zaten sarkan bir FK hedefi. Ecommerce, Fleetx (kargo/yemek), MRP satış-siparişi hepsi buna dayanır.

**G-A4. Inventory/stok/lot/serial yok.** `product.json` yalnız `stock: integer` taşır; depo/rezervasyon/hareket (append-only ledger benzeri) modeli yok. EAV bunu açıkça kapsam-dışı bırakır.

**G-A5. Messaging/thread/feed yok** (sosyal+video, Teams, e-posta üçünün de yapısal temeli); **geo/location/route yalnız atom düzeyinde** (Fleetx için üstünde metamodel yok); **ticket/case/SLA yok** (QMS/CMMS, CRM, IBYS); **payroll/compensation yok** (HRMS'in çekirdeği, eksik ledger'a da bağımlı).

**G-A6. Atomik tip sözlüğü geniş ama gerçek veride kullanılmıyor (canlı conformance ihlali).** `FieldTypeSchema` money/measure/percentage/i18n-text/geo/duration/tax-id/iban içerir; ama iki fixture'da yeni tiplerin neredeyse hiçbiri kullanılmaz. `customer.json` `taxId` alanı `"string"` (tip `"tax-id"` varken); `name`/`label` `"string"` (i18n-text zorunlu iken — `archetype-uretim-spec §12.E` "beyanı olmayan ArcheType conformance'tan geçemez" der); kanonik `Address` Fragment yerine tek-alanlı ad-hoc fragment kullanılır (fragments-directive §14 bunu yasaklar). Yani ihlal, dokümanın kendi kuralına karşı, tek örnek veride canlı.

### P1 — enterprise engelleri

- **BOM/routing (MRP)**: `archetype-uretim-spec §12.D` adlandırır ve kapsar (cycle-detection, phantom/alternatif/versiyonlu BOM) ama tam yönerge (alan tabloları/test/AC) yoktur — kardeş yönergeler 300+ satırken bu ~40 satırlık spec bölümüdür.
- **Scheduling/calendar/resource-booking yok** (Recurrence atomu var, üstünde booking metamodeli yok): PMS, Teams, HRMS izin/vardiya, Fleetx sevk.
- **Media asset + rendition metamodeli** archetype katmanında bestelenmemiş (k-storage kernel'de, archetype'ta Media/Collection domain objesi yok).
- **Pricing/tax/discount**: Computation mekanizması var ama yeniden kullanılabilir Pricing/Tax kural *veri modeli* yok (kademe, indirim yığma sırası, vergi-yargı tablosu); her ürün ham Computation üstünde yeniden icat eder.
- **Assessment/survey/form** (IBYS/QMS) dedike metamodel değil; EAV yakın ama besteleyen yazılmamış.

### P2

- Generated-CRUD-vs-typed-mutation sınırı **yönerge düzyazısında** güçlü ama şema düzeyinde makine-denetlenebilir tek değişmez değil: `archetype.ts`'te hiçbir şey varsayımsal bir `PATCH /product/{id}`'in `status`'u doğrudan yazmasını engellemez; koruma `conformanceTests` disiplinine bağlı.

---

## 5. Enforcement (kapı) durumu — archetype

- `check-atomic-types` **içi-boş**: 17 tip-adı string'ini `archetype.ts`'te arar; dokümanın vaat ettiği "13 sözleşme boyutu" per-FieldType denetimini yapmaz.
- `check-fragments` **içi-boş**: şemada 3 alan-adı altstring'i arar; fragment örneğini doğrulamaz (zaten fixture'da kanonik fragment yok).
- `check-archetype-relation` **YOK** ama `archetype-tree-relation-directive.md` "zorunludur" der → P0 yanlış-güven (index §6).
- Sonuç: archetype katmanında gerçek örnek verinin (yalnız 2 fixture) conformance'ı hiçbir kapı tarafından kod-seviyesinde doğrulanmıyor.

---

## 6. Unknown-unknowns (archetype)

- Fragment→ArcheType terfi yolu hiç denenmemiş: `fragments-directive §11` temiz bir "kimlik testi" tanımlar ama göçün şema mı, veri mi, ikisi mi olduğu ve `platform` aracının var olup olmadığı belirsiz.
- `linkedWorkflows` var olmayan bir sözleşmeye işaret ediyor (G-A1); her yönergenin terminoloji bölümü Workflow'u var sayar ama teslim edilmemiştir.
- Eşzamanlı/işbirlikli düzenleme çatışması hiçbir yerde ele alınmamış (optimistic locking / CRDT / last-write-wins?) — AI ile eşzamanlı düzenleme hedefi için kör nokta.
- "2 fixture" durumu kasıtlı minimal referans mı, yoksa yürütme boşluğu mu (18 ürün onlarca archetype ister, 2 var) — hiçbir doküman "X ürünü için N archetype yazılacak" demiyor; "yolunda" ile "çok geride" ayırt edilemiyor.

---

## 7. Ne eklenmeli (test-önce sırayla)

1. **Test/kapı planı.** (a) `check-archetype-relation` kapısını yaz (cycle-detection, subtree p95, tenant izolasyonu, temporal çözümleme) — AI taslak → insan onay → CI. (b) `check-atomic-types`'ı gerçek "13 boyut" denetimine yükselt. (c) Conformance kapısı: her ArcheType'ın i18n-text/tax-id gibi zorunlu atom beyanını + kanonik Fragment kullanımını doğrula (bugün fixture'lar ihlalde).
2. **Veri modeli.** Önce Money atomunu gerçekten uygula; sonra sırayla: Workflow (durum makinesi veri modeli), Ledger/journal, Order/line-item, Inventory/stok-hareketi, Messaging/thread, Payroll. Her biri `archetype-uretim-spec` şablonunu izlesin. (Aktör: AI taslak → insan onay.)
3. **Geliştirme yaklaşımı.** v3 archetype yönergelerini "taslak"tan çıkar; 2 fixture'ı önce kurala uygun hale getir (referans örnek olmalılar), sonra ilk dikey dilim için gerçek archetype üret.
4. **Edge-case/risk.** Çapraz-ArcheType değişmezleri ("order total = satırların toplamı" satırlar ayrı aggregate iken); Mode-Profile ↔ storage-canonical terfi etkileşimi; eşzamanlı düzenleme.
5. **Adımlar.** Önce kapı + fixture düzeltmesi → Money → Workflow yönergesi → Ledger → Order → Inventory → Messaging → Payroll → BOM/routing tam yönergesi.

Bu turda doc-only olarak taşındı: `docs/workflow-directive.md`, `docs/archetype-ledger-directive.md`, `docs/archetype-order-line-item-directive.md`, `docs/archetype-inventory-stock-directive.md`, `docs/archetype-messaging-thread-directive.md` TAM yazıldı. `src/data/archetypes/order.json` fixture ve `tests/archetype.test.ts` değişikliği bu PR'a dahil edilmedi; `check-archetype-relation` main/#8 tarafında korunur, bu PR `tools/agents/` veya `deploy.yml` değiştirmez. Money atomunun gerçek uygulaması + BOM/routing/payroll yönergeleri sıradaki tur.
