# Enterprise SaaS — Product Family and Portfolio Composition (Phase 4)

**Güncel durum:** Commerce OS ilk product family olarak kabul edildi; D1–D13 CLOSED. Bu kompozisyon **instruction-ready**, fakat implementasyon/runtime/pilot/GA kanıtı değildir.

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 4 (ürün ailesi ve portföy kompozisyonu) — Faz 4.5 karar kapanışıyla senkronize. Faz 0/1/2/3 çıktılarına, iki untracked girdiye ve sibling worktree'ye dokunulmadı. D2–D6 bağlayıcı insan kararıyla CLOSED ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions); **ilk aile = Commerce OS**. Karar kapanışı **kart-baseline veya implementation kanıtı üretmez**; Faz 5 yalnız docs-only candidate analizidir ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 4.5/5).
**Tarih:** 2026-07-13 · **Durum:** ACCEPTED COMPOSITION BOUNDARY — provisional yüzeyler kanıt bekler.

> Bu belge **karar-aday kompozisyonudur**, requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve **implementasyon kanıtı değildir**. Araştırma metni ve sayıları ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §1, [`matrix`](./enterprise-saas-source-normalization-matrix.md)) **kanonik değildir**; hiçbir sayı otomatik hedeftir. "100 app" ve capability sayıları araştırma adayı kalır; **hiçbiri module/app'e terfi ettirilmez** ([`ontology`](./enterprise-saas-capability-ontology.md) §Promotion). Yeni TaskNode alanı/level/faz icat edilmez ([`../src/schemas/task.ts`](../src/schemas/task.ts), [`../AGENTS.md`](../AGENTS.md) §4.4, §7).

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit; Task/subagent tool yok). Bu nedenle **16 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **16/16** · Mod: **sequential (mechanism unavailable)** · Analiz READ-ONLY + tek yazar.
- Girdi/HEAD: `6900d38`, branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon [`../AGENTS.md`](../AGENTS.md), [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`preflight`](./enterprise-saas-requirement-program-preflight.md), [`matrix`](./enterprise-saas-source-normalization-matrix.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md), [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md), [`commerce-os-product-scope`](./commerce-os-product-scope.md), [`commerce-os-bounded-context-map`](./commerce-os-bounded-context-map.md).
- **Sibling kanıt (salt-okunur, düzenlenmedi):** `actionplan-reoc-boundary` worktree'sindeki `adr-0029-product-family-boundary.md`, `reoc-product-scope.md`, `reoc-bounded-context-map.md`. **Bunlar kabul edilmiş insan-sınır kanıtıdır, fakat bu branch'te İZLENMEZ (untracked / not part of this branch).** Bu yüzden onlara Markdown link verilmez (kırık link üretmemek için); yalnız ada göre atıf yapılır.

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| A1 | product strategy/ICP | analyst | thesis/JTBD/kill-criterion, ICP boşluğu | Cards · Authority and candidate status |
| A2 | shared platform | analyst | tüketilen primitifler (tenancy…extension) | Shared versus owned matrix |
| A3 | product-family/app boundary | analyst | 3 ayrı ada; runtime/satış bağımsızlığı | Portfolio boundary model |
| A4 | edition/package | analyst | edition/config-pack ≠ module | Edition tenant and provider rules |
| A5 | tenant/workspace | analyst | tenant/workspace/Arsam ayrımı | Edition tenant and provider rules |
| A6 | provider/integration | analyst | düzenlenmiş yürütme = sağlayıcı | Edition tenant and provider rules · Cards |
| A7 | monetization | analyst | commercial model + unit-economics kategorisi | Cards |
| A8 | operating model | analyst | ownership/support/exit; SLO/NFR bütçe kategorisi | Cards · Portfolio sequencing and exit criteria |
| V1 | EVM boundary | validate | ADR-0029 onaylı ama in-branch decision-grade kart yok | Card §4 |
| V2 | REOC boundary | validate | sibling ADR-0029 kabul; sibling in-branch değil | Card §5 |
| V3 | Commerce OS boundary | validate | ADR-0030 in-branch ACCEPTED; kalan scope draft | Card §6 |
| V4 | shared-vs-owned | validate | cross-write yok; tek data/lifecycle authority | Shared versus owned matrix |
| V5 | authority/lifecycle | validate | tekil sahiplik + supersede | Authority and candidate status |
| V6 | jurisdiction/SLO | validate | ölçülebilir placeholder bütçe; sayı uydurulmaz | Cards |
| V7 | link/terminology | validate | in-branch relative link; sibling link'siz | Deterministic checks |
| V8 | allowed-files/claims | validate | tek dosya; kanıtsız "tamam" yok | Deterministic checks · Phase decision |

## Authority and candidate status

Ayrım (bağlayıcı — üç seviye ayrı tutulur):

1. **Üç ailenin sınır-kimliği (boundary identity) insan-onaylıdır.** Sibling ADR-0029 EVM ve REOC'u ayrı aile olarak kabul eder; in-branch [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) Commerce OS'u kabul eder (branch-konum çekinceleriyle: EVM/REOC kanıtı sibling'te ve bu branch'te izlenmez, Commerce OS in-branch). **"İlk üç aile onaysız" DENMEZ.**
2. **Ürün kararları (D2–D6) artık insan tarafından CLOSED'dır:** ilk aile Commerce OS + Türkiye ICP, platform vs Commerce-OS authority, ilk jurisdiction Türkiye, Controlled Paid Enterprise Pilot tier ve build/buy/provider + SLO/COGS bütçesi karara bağlandı ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions). "ICP/jurisdiction/maturity/build-buy çözülmemiştir" ifadesi **artık geçersizdir**.
3. **Bu Faz 4 kompozisyon kartları yine de `candidate` / baselined-değildir** ([`constitution`](./enterprise-saas-requirement-constitution.md) §Pre-WBS lifecycle). Karar kapanışı **implementation/baseline kanıtı değildir**; baseline hâlâ Faz 5 candidate validation + probe/traceability/counsel/evidence-control kanıtı ister. **Faz 4.5 GO yalnız Faz 5 docs-only candidate analizi içindir** ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 4.5).

| Aile | In-branch sınır kanıtı | Status | Otorite notu |
|---|---|---|---|
| Enterprise Venture Management (EVM) | **YOK** (in-branch decision-grade scope/card yok) | `candidate` (boundary-approved, scope-unresolved) | Sibling `adr-0029` insan-onaylı sınır; modül/ICP/jurisdiction/ticari detay **in-branch çözülmemiş, insan-kararına bağlı** |
| Real Estate Operating Cloud (REOC) | **YOK** in-branch; sibling'te kanonik | `candidate` (sibling-accepted, not-in-this-branch) | Sibling `adr-0029`/`reoc-*` kabul; **bu branch'e dahil değil** — status/evidence bunu birebir söyler |
| Commerce Operating System (Commerce OS) | [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) **ACCEPTED** | `candidate` (boundary-accepted, remaining-scope-draft) | Sınır in-branch kabul; kalan BC/scope **draft/provisional** |

Değişmez: her aile için `owner`/`dataAuthority`/`lifecycleAuthority` **tek** sahiptir; iki sahip = kırmızı ([`ontology`](./enterprise-saas-capability-ontology.md) §Ownership). AI otomatik terfi/onay yapamaz; yalnız changeset **önerir** ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Portfolio boundary model

- **Metaframer = platform/meta-framework**, satılabilir dikey ürün ailesi **değildir**. Kernel, SDK, yatay capability ve app-factory sağlar; aileler onu **tüketir** ([`kernel-sdk-app-delivery-sequence`](./kernel-sdk-app-delivery-sequence.md); sibling `adr-0029` §2 aynı terim).
- **EVM, REOC, Commerce OS = ayrı ada (app/product-family) adaylarıdır.** Üçü **runtime'da veya satış için birbirine bağımlı değildir**: biri diğerinin paketini/module'ünü/tablosunu/iç sembolünü **import etmez**; izinli ilişki yalnız sürümlü **event/API/webhook/connector/import-export sözleşmesidir** ([`ontology`](./enterprise-saas-capability-ontology.md) §Dependency; sibling `adr-0029` §3.3–3.4).
- **Ortak ihtiyaç app-to-app import ile değil, shared platform capability'sine inerek karşılanır** (§Shared versus owned matrix).
- **Arsam** yalnız **tenant/workspace/reference/dogfood** bağlamıdır; **hiçbir zaman generic aile değildir**. Arsam'a özgü alan/policy/varsayım/workflow generic aile sözleşmesine gömülemez (sibling `adr-0029` §5).
- **"100 app" reddi:** portföy 3 aday aile ile sınırlıdır; kalan aday aileler ([`matrix`](./enterprise-saas-source-normalization-matrix.md) PF: CRM/ERP/HRMS…) **research-only** kalır ve bu belgeyle app/module'e **terfi ETMEZ**.

## Product Family Card — Enterprise Venture Management

- **Thesis:** Girişim/venture yaşam döngüsünü (fikir → portföy → yönetişim → çıkış) tek ada üzerinde yöneten generic, bağımsız satılabilir aile. *In-branch tez cümlesi decision-grade değildir; insan kararına bağlıdır.*
- **Buyer/user:** UNRESOLVED — in-branch ICP/buyer/user kanıtı yok; sibling `adr-0029` yalnız sınırı onaylar, persona vermez → insan-karar gated (P0 #1).
- **JTBD:** UNRESOLVED (in-branch); job/problem kanıtı ve kill-criterion insan discovery'sine bağlı ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §6 "yanlış müşteri problemi").
- **Boundary:** EVM, REOC/Commerce OS kurulumu veya lisansı olmadan satılabilir/çalışabilir; onların paketini import etmez (sibling `adr-0029` §3).
- **Owned data/lifecycle:** UNRESOLVED — **modül icat edilmez.** EVM veri otoriteleri ve state machine'leri in-branch tanımlı değildir; tek-writer + no cross-write kuralı ([`ontology`](./enterprise-saas-capability-ontology.md) §Ownership) sınır olarak geçerli, içerik insan-kararına bağlı.
- **Consumed platform capabilities:** shared platform (§Shared versus owned matrix) tüketilir, kopyalanmaz; liste ortaktır, EVM-özel değildir.
- **Modules/BC candidates:** **NONE listed (invented modules forbidden).** BC seti insan-onaylı ayrı dalganın işidir; bu kart module açmaz.
- **Editions:** UNRESOLVED — edition = paketleme (§Edition tenant and provider rules), module değildir; içerik insan-kararına bağlı.
- **Commercial model:** UNRESOLVED — plan/entitlement/metering/COGS ve unit-economics in-branch yok (P0 #5).
- **Jurisdictions:** UNRESOLVED — ilk jurisdiction ve regulated-action sınırı insan+counsel kararı (P0 #4).
- **SLO/NFR budgets:** ölçülebilir **placeholder kategorileri** (değerler insan-kararı; sayı uydurulmaz): availability SLO, p95 latency, error budget, RTO/RPO, per-tenant cost/noisy-neighbor bütçesi.
- **Non-goals:** REOC/Commerce OS işlevini yeniden üretmek; Arsam kuralını generic sözleşmeye gömmek; düzenlenmiş yürütmeyi ürün içinde yapmak; platform primitifini kopyalamak.
- **Exit criteria:** ICP+JTBD kanıtı, tek-writer BC seti, ilk jurisdiction, maturity tier ve build/buy/provider kararı insan tarafından kapanana dek EVM `candidate` kalır; kapanmazsa NO-GO (kill-criterion).
- **Evidence/status:** `candidate` — sibling `adr-0029` (untracked, **not in this branch**) sınırı onaylar; **in-branch decision-grade card yok**; scope/ICP/jurisdiction/ticari **insan-karar gated**.

## Product Family Card — Real Estate Operating Cloud

- **Thesis:** Gayrimenkulün kalıcı kimliği, kaynağı, sunumu, müsaitliği, güven kararı ve teklif/işlem zincirini **ayrı authority'lerle** yöneten generic operating cloud (sibling `reoc-product-scope` §1). *Kaynak: sibling, bu branch'te izlenmez.*
- **Buyer/user:** ilan platformları, broker/ofis ağları, proje/kurumsal portföy satış ekipleri, kendi markasıyla gayrimenkul marketplace işleten tenant'lar; Arsam yalnız ilk reference tenant/marka (sibling `reoc-product-scope` §1, §7).
- **JTBD:** doğrulanabilir property→listing→transaction zinciri sunmak (yeni ilan-sitesi kopyası değil).
- **Boundary:** REOC, EVM kurulumu/lisansı olmadan satılır/çalışır; EVM'e bağımlı değildir; iç sembol import etmez, yalnız sürümlü event/API tüketir (sibling `adr-0029` §3).
- **Owned data/lifecycle:** sibling `reoc-bounded-context-map` her BC için tek-writer authority + state machine tanımlar (ör. Property Registry `candidate→identified→verified→…`); **cross-context write yok.** *Bu kanıt sibling'tedir; bu branch'e dahil değildir.*
- **Consumed platform capabilities:** tenancy, identity/party, authz/PDP, entitlement, audit/evidence, files/media, MDM/provenance, workflow/SLA, event/outbox, notification/comms, search, geo, billing/metering, observability, localization/policy versioning; generic CRM ayrı authority (import edilmez) (sibling `reoc-product-scope` §4).
- **Modules/BC candidates:** sibling'te 8 BC adayı (Property Registry, Real Estate Classification, Listing Supply, Discovery, Listing Trust & Verification, Brokerage Engagement, Offer & Transaction Workspace, Marketplace Governance) — **sibling kanıtı olarak alıntılanır; bu branch'te module açılmaz.**
- **Editions:** sonraki edition/ayrı-aile adayları (Residential Leasing, CRE, Development & New Sales, Investment/Fund, IWMS, ESG, Institutional Disposal) — paketleme, module değil; ilk dilim dışı (sibling `reoc-product-scope` §5).
- **Commercial model:** in-branch UNRESOLVED (sibling ticari detayı vermez) → insan-karar gated (P0 #5).
- **Jurisdictions:** UNRESOLVED — counsel + ülke/mevzuat doğrulaması (sibling `adr-0029` §10.4; P0 #4).
- **SLO/NFR budgets:** placeholder kategorileri (değer insan-kararı): availability SLO, p95, error budget, RTO/RPO, per-tenant cost/noisy-neighbor; sayı uydurulmaz.
- **Non-goals:** EVM işlevini yeniden üretmek; Arsam kuralını gömmek; MLS/co-broker/referral/commission'ı ilk dilime almak; regulated (payment/escrow/mortgage/e-notary/tapu) işlemi lisanslı kurum gibi yürütmek; platform capability kopyalamak (sibling `reoc-product-scope` §3).
- **Exit criteria:** sibling `reoc-product-scope` §9 DoR (8 BC owner/authority/state onayı, çevrimsiz dependency, Arsam sınırı, regulated adapter) — bu branch'e **taşınmadan** REOC in-branch `approved` olamaz.
- **Evidence/status:** `candidate` — sibling `adr-0029`/`reoc-product-scope`/`reoc-bounded-context-map` **insan-kabul kanıtı fakat bu branch'te İZLENMEZ (not part of this branch)**; in-branch decision-grade card yok.

## Product Family Card — Commerce Operating System

- **Thesis:** Ticaret iş modellerinin ortak omurgası (katalog/fiyat/sipariş/ödeme-orchestrasyonu/kanal/uyum) tek kompozisyon yüzeyinde; her model edition+mode bileşimi; düzenlenmiş yürütme orchestrate edilir, üstlenilmez ([`commerce-os-product-scope`](./commerce-os-product-scope.md) §1).
**Commerce OS, insan kararıyla ilk aile ve ilk ICP'dir** (D2 CLOSED, [`ledger`](./enterprise-saas-human-decision-queue.md)). Aşağıdaki alanlar iletilen bağlayıcı insan kararından birebir alınmıştır; worker ICP/sayı/jurisdiction/provider uydurmamıştır. Kart yine de `candidate`; implementation kanıtı değildir.

- **ICP (D2 CLOSED):** Türkiye merkezli veya Türkiye'de faaliyet gösteren **mid-market/enterprise ticaret işletmeleri**; çok marka/kanal/tenant/seller işletir ve **B2C/D2C/B2B/marketplace'ten en az ikisini** yürütür; **artı** bunlara platform kuran sistem entegratörleri.
- **Buyer/user (D2 CLOSED):** ekonomik alıcı = CTO/CIO/CDO/VP-Head of Commerce/platform product manager. Birincil kullanıcılar = commerce ops, catalog ops, marketplace ops, product/platform ekipleri, entegrasyon geliştiricileri.
- **JTBD (D2 CLOSED):** dağınık Magento/Drupal-benzeri katalog/fiyat/checkout/order/fulfillment/marketplace/extension/integration operasyonlarını **authority-tanımlı, composable, API/event, tenant-safe Commerce OS** üzerinde konsolide etmek.
- **Boundary:** [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) ile **ayrı ada**; EVM/REOC'a runtime/satış bağımlılığı yok; iç iş alanları **dağ (module/BC)**, hiçbiri "app" değil.
- **Owned data/lifecycle (core 7 BC, D3 CLOSED):** tek-writer authority + lifecycle: Catalog Governance, Offer & Pricing, Cart & Checkout, Order Orchestration, Inventory & Availability, Fulfillment & Returns, Payment & Adjustment Orchestration; **cross-context write yok, yalnız versioned command/API/event/outbox** ([`commerce-os-bounded-context-map`](./commerce-os-bounded-context-map.md) §2). Payment & Adjustment Orchestration provider command / auth-capture-refund isteği / reconciliation-evidence lifecycle sahibidir; **payment execution DEĞİL**.
- **Consumed platform capabilities:** tenancy, identity/authz/PDP, capability/entitlement, workflow/mode, audit, ledger, search, storage, event bus, extension runtime — tüketilir, kopyalanmaz (§Authority allocation).
- **Modules/BC candidates:** core 7 kesindir. Marketplace governance, Subscription ve Auction `KEEP PROVISIONAL`; Recommerce `KEEP PROVISIONAL — later edition, core evidence'a kadar blocked`; B2B, Service, Channel, Promotions, Supplier integration, Settlement, Compliance ve Classifieds `DEMOTE` ([`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md)). `KEEP PROVISIONAL` module terfisi değildir; owner/data/lifecycle/independent-policy kanıtı ve probe ister. Marketplace connector/webhook **integration yüzeyi** platform runtime'a demote edilirken marketplace **governance lifecycle** provisional kalabilir; bunlar aynı granülerlik değildir.
- **Editions:** Core ilk satılabilir sınırdır. Marketplace ve Subscription kanıta bağlı adaydır. Enterprise-B2B, Channel/Omnichannel ve Classifieds/Lead-Gen yalnız mevcut capability'ler üzerinde **entitlement + policy/workflow/integration/configuration paketi** olabilir; module/BC üretmez ([`commerce-os-product-scope`](./commerce-os-product-scope.md) §6). Classifieds REOC'a ait Property Registry/Listing Supply authority'sini Commerce OS'a taşıyamaz. Auction ve Recommerce sonraki edition adaylarıdır ve core evidence kapanmadan açılamaz.
- **Commercial model / maturity (D5 CLOSED):** hedef tier = **Controlled Paid Enterprise Pilot** (full enterprise GA değil); edition satın alma → BC seti açma; §Pilot evidence controls kanıtlanmadan **enterprise-ready/GA iddiası yok**.
- **Jurisdictions (D4 CLOSED):** ilk jurisdiction = **Türkiye**. Bu hukuki uyum ispatı değildir; **Türkiye-yetkili counsel zorunlu pre-production/pre-sale gate**'tir (§Turkey regulated boundary).
- **Build/buy (D6 CLOSED):** §Build/buy split; provider asla canonical authority değildir.
- **SLO/COGS (D6 CLOSED):** §Pilot SLO/COGS budget (bağlamlı).
- **Non-goals:** düzenlenmiş yürütücü olmak; platform primitifi yeniden yazmak; Drupal/Magento'yu runtime bağımlılık yapmak; storefront/shopper UI üretmek; feature-sayısı hedefi; yeni app/module düğümü açmak ([`commerce-os-product-scope`](./commerce-os-product-scope.md) §4).
- **Exit criteria:** karar kapanışı baseline değildir; [`commerce-os-product-scope`](./commerce-os-product-scope.md) §9 DoR + Faz 5 candidate validation + probe/traceability/counsel/evidence-control kanıtı kapanana dek `candidate`.
- **Evidence/status:** ürün sınırı ve D1–D13 kararları **ACCEPTED/CLOSED**; V0–V16 handoff **instruction-ready**. Provisional BC'ler hâlâ kanıt bekler; **implementasyon/runtime/pilot/GA kanıtı yoktur**.

### Authority allocation (D3 CLOSED)

Aynı 6-tuple iki owner alamaz; cross-write yok; yalnız versioned command/API/event/outbox ([`ontology`](./enterprise-saas-capability-ontology.md) §Ownership).

| Katman | Sahip | Kapsam |
|---|---|---|
| Platform (shared, tüketilir) | platform/kernel | tenancy/workspace isolation; identity/party; authn; authz/PDP; entitlement/grants; metadata/extensible-schema; workflow/ECA runtime; event/outbox/webhook runtime; audit/evidence; secrets/key; object/file; observability; localization; integration; extension/plugin; generic notification delivery; generic CRM contact/lead/conversation |
| Commerce OS (owned, core 7 BC) | Commerce OS | Catalog Governance; Offer & Pricing; Cart & Checkout; Order Orchestration; Inventory & Availability; Fulfillment & Returns; Payment & Adjustment Orchestration (orchestration, **execution değil**) |

### Turkey regulated boundary (D4 CLOSED)

Sahiplenilmeyen regulated execution → **dış lisanslı sağlayıcı**: payment/custody, escrow, MoR, kredi/mortgage, sigorta underwriting, KYC/AML execution, tax filing/authority, e-sign trust service, e-notary/notary, tapu (title deed), düzenlenmiş e-invoice/e-document delivery, banking/financial accounting execution. Commerce OS yalnız **orchestration/policy selection/command/status/reconciliation/calculation snapshot/evidence** yapar. **Calculation, regulated execution, settlement, accounting posting ayrıktır.** Türkiye-yetkili counsel doğrulaması zorunlu pre-production/pre-sale gate'tir ([`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §7).

### Pilot evidence controls (D5 CLOSED)

Kanıt olmadan enterprise-ready/GA iddiası yok: tenant isolation; RBAC/ABAC/PDP; immutable audit/decision history; idempotency/retry/compensation; backup/restore drill; tenant export/portability; provider exit/failover; monitoring/alerts/distributed trace; incident/escalation; vulnerability/dependency mgmt; classification/retention/deletion workflow; rollback/migration rehearsal; API/event versioning; load/noisy-neighbor; accessibility/localization baseline; support runbook; human security/privacy/legal review.

### Build/buy split (D6 CLOSED)

- **Build (Commerce OS):** domain authority, canonical data/lifecycle, policy/orchestration, provider-neutral ports, reconciliation, evidence, tenant-safe config, extension governance.
- **Buy/provider:** payment execution, KYC/AML, tax calculation/filing, regulated e-doc delivery, e-sign trust, email/SMS/push, geo/map, fraud data, external search (gerekirse), CDN/object infra, observability infra (gerekirse). Provider asla canonical authority değil; her provider **portability/export/replay/reconciliation/degraded-mode/circuit-breaker/exit drill** ister.

### Pilot SLO/COGS budget (D6 CLOSED)

Değerler **workload/region/tenant/provider bağlamı zorunlu** kabul eşiğidir (SLA/target kanıtı değil); gerçek yük altında ölçüm residual validation'dır.

| Bütçe | Eşik |
|---|---|
| Paid core API availability (aylık) | ≥ %99.9 (error budget türetilir) |
| p95 read latency | ≤ 500 ms |
| p95 mutation latency (provider hariç) | ≤ 1000 ms |
| RPO / RTO | ≤ 15 dk / ≤ 4 sa |
| Noisy-neighbor p95 degradation | ≤ %20 |
| Variable COGS | ≤ %25 recognized revenue |
| Platform infra + observability | ≤ %12 |
| Provider cost | görünür / pass-through |
| Long-term gross margin | ≥ %75 |

## Shared versus owned matrix

Kural: satır = shared platform primitifi (tüketilir, inşa/kopyalanmaz); her aile **consume** eder, **owns** etmez. Aile-owned davranış primitifi çağırır, **cross-write yapmaz** ([`ontology`](./enterprise-saas-capability-ontology.md) §Reuse, §Ownership). Platform primitifleri: tenancy, identity/authz/PDP, entitlement, metadata, workflow/ECA, event bus, audit, observability, search, storage, localization, integration, extension runtime.

| Platform capability (SHARED — owner: platform/kernel) | EVM | REOC | Commerce OS | Ailenin OWNED davranışı (örnek sınır) |
|---|---|---|---|---|
| Tenancy / izolasyon | consume | consume | consume | tenant-scoped kayıtlar (kendi BC verisi) |
| Identity / authz / PDP | consume | consume | consume | rol/policy kararı tüketir; kendi authz yazmaz |
| Entitlement / capability | consume | consume | consume | edition→capability açma (packaging) |
| Metadata / schema | consume | consume | consume | domain schema (aile-owned aggregate) |
| Workflow / ECA / mode | consume | consume | consume | domain state machine (BC lifecycle) |
| Event bus | consume | consume | consume | domain event yayını (tek yönlü) |
| Audit / evidence | consume | consume | consume | karar izini audit'e yazdırır |
| Observability | consume | consume | consume | metrics/SLO bütçe (aile-owned hedef) |
| Search & discovery | consume | consume | consume | projeksiyon/indeks (source değil) |
| Storage / object | consume | consume | consume | media/asset ref |
| Localization / i18n | consume | consume | consume | jurisdiction pack seçimi |
| Integration / protocol | consume | consume | consume | connector/port sözleşmesi |
| Extension runtime | consume | consume | consume | kanal/sağlayıcı eklentisi |

**Owned data/lifecycle (açık, cross-write yasak):** EVM = UNRESOLVED (modül icat edilmez); REOC = sibling 8 BC (tek-writer, sibling kanıtı, in-branch değil); Commerce OS = in-branch core 7 BC tek-writer ([`commerce-os-bounded-context-map`](./commerce-os-bounded-context-map.md) §1 "cross-context write yok").

**Kesin sahiplik kuralı (overbroad değil):** aynı **kanonik 6-tuple** (`concept + owner + dataAuthority + lifecycleAuthority + consumer + outcome`) **iki sahibe** sahip olamaz — bu authority conflict'tir ([`ontology`](./enterprise-saas-capability-ontology.md) §Ownership, §Duplicate). Ancak **aynı-adlı** kavramlar `owner`/`dataAuthority`/`lifecycleAuthority`/`consumer`/`outcome` bileşenlerinden en az biri farklıysa **ayrı ailelerde ayrı-owned kalabilir** (sahte-örtüşme; ad tekillik/duplicate kanıtı değildir). **Yalnızca** gerçekten yatay (horizontal), **ortak sözleşmeli ve paylaşılan authority'li** davranış platform capability'sine terfi eder; benzer-ama-farklı-authority davranış terfi etmez. Duplikasyon yok, cross-write yok kuralı korunur.

## Edition tenant and provider rules

- **Edition/config-pack = paketleme, module DEĞİL.** Aynı module/BC seti + pazara-çıkış paketi; entitlement (policy/config) açar. Paketleme yüzünden module/BC doğmaz ([`ontology`](./enterprise-saas-capability-ontology.md) §Reuse; [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) Kavram ayrımı).
- **Tenant ≠ workspace ≠ edition ≠ provider ≠ family:** tenant = izolasyon birimi (her tenant her capability'yi almaz); workspace = tenant'a ait izole çalışma/konfigürasyon bağlamı; edition = ticari ambalaj; mode = runtime davranış bileşimi; provider = dış lisanslı entegrasyon; family/app = satış sınırı. Karıştırılmaz (sibling `adr-0029` §2; [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md)).
- **Arsam** = tenant/workspace/reference/dogfood; generic aile değil; kuralı sözleşmeye gömülemez (sibling `adr-0029` §5).
- **Provider sınırı:** düzenlenmiş yürütme (ödeme/escrow/MoR/kredi/sigorta/vergi-hesaplama/KYC-AML/e-imza/noter/tapu/mortgage) **dış lisanslı sağlayıcı entegrasyonudur**; aile orchestrate eder, lisanslı yürütücü olmaz — **aksi bir insan kararı olana dek** ([`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §7; sibling `adr-0029` §5). Provider komutu idempotent reference taşır; sonuç reconciliation + evidence ile alınır.

## Portfolio sequencing and exit criteria

- **Faz 4.5 kararları CLOSED → GO (docs-only).** İlk aile Commerce OS + Türkiye ICP, authority tahsisi, ilk jurisdiction Türkiye, Controlled Paid Enterprise Pilot ve build/buy/provider + SLO/COGS bütçesi insan tarafından karara bağlandı; **Faz 4.5 GO yalnız Faz 5 docs-only candidate analizi içindir** — requirement/queue/node/schema/gate/implementation açılmaz ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 4.5/5; [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §8; [`ledger`](./enterprise-saas-human-decision-queue.md)).
- **Teslim sırası (bağımsızlıktan bağımsız):** kernel→SDK→app-core→module→app; alt katman üste bağımlı olamaz ([`kernel-sdk-app-delivery-sequence`](./kernel-sdk-app-delivery-sequence.md)). Aileler arası runtime/satış bağımlılığı bu sıralama ile karıştırılmaz.
- **Aile bazlı durum:** Commerce OS için ICP/authority/jurisdiction/maturity/build-buy kararları CLOSED; aile yine `candidate` çünkü baseline Faz 5 candidate validation + probe/traceability/counsel/evidence-control ister. **EVM/REOC ilk satışı bloklamaz** ve bu changeset onlara scope/module icat etmez; kendi ICP/jurisdiction'ları için ayrı, insan-onaylı karar bekler. Baselined sonrası değişiklik CR+impact+revalidation ister ([`constitution`](./enterprise-saas-requirement-constitution.md) §Baseline).
- **Reuse kanıtı = kompozisyon (bu matris), sayı değil:** "100 app" reuse kanıtı değildir; kalan aday aileler research-only kalır.

## Deterministic checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (11, sırayla) | AUTO (oracle metin taraması) | 11/11 mevcut, tam sırada — reviewer/CI teyidine açık |
| 3 Product Family Card × 14 alan | AUTO | thesis/buyer-user/JTBD/boundary/owned-data-lifecycle/consumed/modules-BC/editions/commercial/jurisdictions/SLO-NFR/non-goals/exit/evidence-status her kartta mevcut |
| Shared-vs-owned matrix | AUTO | 13 shared satır × 3 aile; cross-write yasağı yazılı |
| tenant/workspace/edition/provider ayrımı | AUTO | §Edition tenant and provider rules'ta ayrık tanım |
| No 100-app promotion | AUTO | kalan aileler research-only; terfi yok |
| Decision-closed ≠ card-baselined | AUTO/MANUAL | D1–D6 insan-CLOSED; kompozisyon kartları `candidate`; Faz 4.5 GO yalnız Faz 5 docs-only candidate analizi; baseline/implementation kanıtı yok |
| Line budget ≤ 300 | AUTO | bu dosya ≤ 300 satır |
| Ownership rule not overbroad | AUTO | yasak = aynı 6-tuple iki owner; aynı-ad farklı-authority ayrı-owned kalabilir; yalnız yatay+ortak-sözleşme+paylaşılan-authority platforma terfi |
| No new app/module/node/schema/gate | AUTO | yalnız bu md; TaskNode alanı/level/faz icat edilmedi |
| In-branch relative link target | MANUAL/CHANGESET | tüm in-branch link repo-relative; Glob ile hedef varlık doğrulandı; Codex teyidine açık |
| Sibling no broken link | AUTO | sibling docs link'siz, yalnız ada göre atıf (untracked/not-in-branch) |
| Numeric = target? / SLO fabrication | AUTO | tüm sayılar research-only; SLO yalnız placeholder kategori, değer yok |
| Allowed-files (V8) | AUTO (`git status` Codex'te) | tek yazılan dosya; girdiler ve sibling değişmedi |
| Line budget ≤ 300 | AUTO | bu dosya ≤ 300 satır |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** ([`task-to-code-contract`](./task-to-code-contract.md), [`ready-for-dev-gate`](./ready-for-dev-gate.md), [`engineering-standards-index`](./engineering-standards-index.md)).

## Phase decision

- Bu çıktı **ürün-ailesi/portföy kompozisyon adaylarıdır**; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve implementasyon kanıtı değildir.
- **Metaframer** platform/meta-framework'tür, satılabilir aile değildir. **EVM/REOC/Commerce OS** ayrı ada adaylarıdır; runtime'da veya satış için birbirine bağımlı değildir. **Arsam** yalnız tenant/workspace/reference'tır.
- **Sınır-kimliği vs kart ayrımı (bağlayıcı):** üç ailenin **sınır-kimliği insan-onaylıdır** (sibling ADR-0029 EVM/REOC; in-branch [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) Commerce OS) — "ilk üç aile onaysız" DENMEZ. **D1–D6 artık bağlayıcı insan kararıyla CLOSED**'dır (ICP, jurisdiction, maturity, ticari model, build/buy/provider Commerce OS için karara bağlandı; [`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions). Bu Faz 4 kompozisyon kartları **yine de** `candidate`/**baselined-değildir**: karar kapanışı baseline/implementation kanıtı üretmez; baseline hâlâ Faz 5 candidate validation + probe/traceability/counsel/evidence-control kanıtı ister. **D1–D6 CLOSED → Faz 4.5 GO, fakat yalnız Faz 5 docs-only candidate analizi içindir.** EVM in-branch decision-grade card taşımaz (modül icat edilmedi); REOC kanıtı **sibling'tedir ve bu branch'e dahil değildir**; Commerce OS sınırı in-branch ACCEPTED fakat kalan scope draft.
- Stop-gate ihlali: **yok** (sayı hedefi yapılmadı; vendor/protokol module olmadı; cross-write yazılmadı; app/module açılmadı).
- Yazılan tek izinli dosya: `docs/enterprise-saas-product-family-composition.md`. Faz 0/1/2/3 çıktıları, 2 untracked girdi ve **sibling worktree değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 4 GO/NO-GO → Codex'e ait.** Bu worker Faz 4'ü tamamladı ve **durur**; **Faz 4.5 kararları (D1–D6) CLOSED ve Faz 4.5 GO yalnız Faz 5 docs-only candidate analizi içindir** — requirement/queue/node/schema/gate/implementation açılmaz; Faz 5 yalnız Codex onayıyla ayrı, yetkili bir dalgada başlar.
