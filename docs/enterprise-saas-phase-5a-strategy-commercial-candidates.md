# Enterprise SaaS — Phase 5A Strategy/Commercial Candidate Completeness Matrix

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 5A (strategy/commercial candidate completeness). Faz 4.5 D1–D6 CLOSED çerçevesinde açıldı ([`ledger`](./enterprise-saas-human-decision-queue.md)). Bu **onaylanabilir candidate set / domain-completeness** dokümanıdır; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **aday tamlık matrisidir**, requirement listesi/backlog/module değildir. Kapsam yalnız **Commerce OS ilk aile + Türkiye ICP** strategy/commercial domenidir (D2/D4/D5/D6 CLOSED, iletilen bağlayıcı **insan** kararı; [`ledger`](./enterprise-saas-human-decision-queue.md)). Somut ICP/sayı/jurisdiction/provider **uydurulmaz**; hepsi iletilen insan kararından birebir alınır. Paylaşılan platform authority'leri **yeniden yazılmaz, referansla tüketilir** ([`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix). Hiçbir aday app/module düğümüne **terfi ETMEZ** ([`../AGENTS.md`](../AGENTS.md) §4.4; [`../src/schemas/task.ts`](../src/schemas/task.ts)). EVM/REOC scope **icat edilmez**.

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). Bu nedenle **2 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **2/2** · Mod: **sequential (mechanism unavailable)** · READ-ONLY analiz + tek yazar.
- Girdi/HEAD: `6900d38`, branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon [`../AGENTS.md`](../AGENTS.md), [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`ledger`](./enterprise-saas-human-decision-queue.md), [`composition`](./enterprise-saas-product-family-composition.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md), [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md), [`commerce-os-product-scope`](./commerce-os-product-scope.md), [`commerce-os-bounded-context-map`](./commerce-os-bounded-context-map.md), [`commerce-os-capability-classification`](./commerce-os-capability-classification.md), [`capability-entitlement-contract`](./capability-entitlement-contract.md).

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| A5A | strategy/commercial analyst | analyst | 10 aday: market evidence, ICP qual, packaging/edition, pricing, entitlement, metering, unit-economics, procurement/contracts, pilot conversion, provider pass-through | Candidate completeness matrix |
| V5A | strategy/commercial reviewer | reviewer | authority/dedup/fold, provider-not-canonical, legal/accounting mark, no module promotion, link/field/claim | Duplicate and authority notes · Red to green checks |

Sıra: **A5A → V5A** (sıralı, aynı dosya). İki iş de aynı tek dosyaya yazdı; başka lane'e paralel yazım yok.

## Lane boundary

- **scope:** yalnız Commerce OS ilk ICP strategy/commercial candidate completeness; owner/authority/riskTier/testOracle belirsizse `unresolved`.
- **inputs:** yukarıdaki kanon; D2/D5/D6 sayıları + ICP **bağlayıcı insan kararı** ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions).
- **allowed-files:** yalnız `docs/enterprise-saas-phase-5a-strategy-commercial-candidates.md`. Başka dosya, JSON/node/schema/gate/kod/test yok.
- **non-goals:** requirement/backlog/module/app üretmek; EVM/REOC scope icat etmek; platform entitlement/PDP/ledger/metering'i yeniden yazmak; somut price/ICP/sayı uydurmak; provider'ı canonical authority yapmak; module terfisi.
- **checks:** §Red to green checks (deterministik metin/link taraması; otomatik gate yoksa `MANUAL/CHANGESET`).
- **output:** ≥8 aday satır + duplicate/authority notları + red/green.
- **blockers:** market/pricing/procurement adayları insan discovery/counsel/finans kararına bağlı → `unresolved` (aşağıda blocker alanında).

## Candidate completeness matrix

Alan sözleşmesi (her aday): `candidateId · statement/outcome · owner · dataAuthority · lifecycleAuthority · scopeClass · riskTier · testOracle · evidenceExpected · status · blocker` ([`constitution`](./enterprise-saas-requirement-constitution.md) §Candidate record contract). scopeClass sözlüğü [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §1. Bir alan çözülemezse satır `unresolved` + `blocker`. Owner=rol; provider **asla** canonical authority. Özet:

| candidateId | scopeClass | riskTier | status |
|---|---|---|---|
| `C-5A-01-market-problem-evidence` | research input | high | unresolved |
| `C-5A-02-icp-qualification` | policy | high | candidate |
| `C-5A-03-packaging-edition` | configuration/edition | medium | candidate |
| `C-5A-04-commercial-pricing-policy` | policy | medium | unresolved |
| `C-5A-05-entitlement-boundary` | platform capability (consumed) | high | candidate |
| `C-5A-06-metering-usage-attribution` | platform capability (consumed) | high | candidate |
| `C-5A-07-unit-economics-cogs-margin` | NFR (commercial budget) | high | unresolved |
| `C-5A-08-enterprise-procurement-contracts` | policy | high | unresolved |
| `C-5A-09-pilot-conversion-exit` | policy | high | unresolved |
| `C-5A-10-provider-cost-passthrough` | provider (integration) | high | candidate |

Detaylı alanlar (aynı authority'yi referansla, kopyalamaz):

**`C-5A-01-market-problem-evidence`**
- statement/outcome: ICP'nin dağınık katalog/fiyat/sipariş/marketplace konsolidasyon acısı **gerçek alıcı discovery'siyle kanıtlanır**, varsayılmaz.
- owner: Admin/Owner (product) + discovery · dataAuthority: n/a — research input (owned runtime data yok) · lifecycleAuthority: n/a — research input
- testOracle: reviewer matrisi — ≥5 discovery + ödeme/alternatif sinyali mevcut (MANUAL) · evidenceExpected: interview notları + ödeme sinyali (`sourceType=interview`, `confidence=L`)
- blocker: **D2 residual** — discovery/payment-signal kanıtı henüz toplanmadı ([`ledger`](./enterprise-saas-human-decision-queue.md) D2 residual).

**`C-5A-02-icp-qualification`**
- statement/outcome: Prospect **iff** Türkiye merkezli/faaliyet gösteren mid-market/enterprise ticaret, **B2C/D2C/B2B/marketplace'ten ≥2**, çok marka/kanal/tenant/seller, **artı** platform kuran SI ise ICP sayılır (D2 birebir).
- owner: Admin/Owner (product) · dataAuthority: platform CRM contact/lead (consumed, Commerce OS-owned değil) · lifecycleAuthority: sales/discovery qualification (human)
- testOracle: negative — rubriğe uymayan prospect reddedilir (MANUAL) · evidenceExpected: qualification rubric + kill-criterion
- blocker: tanım D2 CLOSED; residual = discovery doğrulaması (`C-5A-01`).

**`C-5A-03-packaging-edition`**
- statement/outcome: Commerce OS aynı BC setini paketleyen edition'larla (Core/Marketplace/Subscription/Enterprise-B2B/Advanced-Network/Classifieds) satılır; edition **yeni module/BC doğurmaz** ([`commerce-os-product-scope`](./commerce-os-product-scope.md) §6).
- owner: Commerce OS product (packaging) · dataAuthority: platform entitlement/capability (consumed; edition→capability) · lifecycleAuthority: platform entitlement grants
- testOracle: contract — edition değişimi yalnız entitlement toggle; yeni BC node yok (MANUAL/CHANGESET) · evidenceExpected: edition→capability eşlemesi ([`capability-entitlement-contract`](./capability-entitlement-contract.md))
- blocker: edition seti `candidate`/sabit değil; item-level entitlement eşlemesi ayrı insan-onaylı dalga.

**`C-5A-04-commercial-pricing-policy`**
- statement/outcome: Commerce OS'un ICP'ye **SaaS fiyatı** = edition subscription + metered usage tier; fiyat **authority-owned ticari policy**, provider maliyetinden decouple.
- owner: RevOps/product + finance (human commercial authority) · dataAuthority: platform ledger/billing (consumed); price book = commercial policy kaydı · lifecycleAuthority: commercial policy governance (human approver)
- testOracle: reviewer/contract — fiyat modeli D6 unit-economics bütçesiyle reconcile (MANUAL) · evidenceExpected: price book + D6 marj reconciliation
- blocker: somut fiyat noktaları **insan ticari kararı** (uydurulmaz); Faz 10 human gate → `unresolved`.

**`C-5A-05-entitlement-boundary`**
- statement/outcome: Ödeyen tenant'ın ne yapabildiği **platform entitlement/PDP authority** ile karara bağlanır; Commerce OS grant'ı tüketir, **kendi authz'unu yazmaz**.
- owner: platform/kernel entitlement (shared) · dataAuthority: platform entitlement/capability grants · lifecycleAuthority: platform entitlement lifecycle
- testOracle: negative/security — entitlement'sız aksiyon PDP'de reddedilir; BC-local authz bypass yok · evidenceExpected: PDP decision log + negative test yolu ([`capability-entitlement-contract`](./capability-entitlement-contract.md))
- blocker: edition→entitlement item eşlemesi ayrı yetkili dalga; Commerce OS reimplement etmez (platform capability'ye fold).

**`C-5A-06-metering-usage-attribution`**
- statement/outcome: Faturalanabilir kullanım tenant/edition başına **idempotent, reconcilable** sayaçlarla platform observability/ledger'dan ölçülür; **provider faturasından değil**.
- owner: platform metering (observability/ledger, shared); Commerce OS domain usage event yayar · dataAuthority: platform ledger/metering (**canonical usage** — çözülü candidate owner) · lifecycleAuthority: platform metering lifecycle
- testOracle: property — metering idempotent + ledger'a reconcile; KPI reconciliation probe (Faz 6 #10) · evidenceExpected: metering→ledger reconciliation raporu
- blocker: **provider asla canonical usage authority değil**; reconciliation drill residual (D6). **Canonical usage metering (bu satır, çözülü candidate owner) ≠ cost-attribution/COGS/AI-spend allocation authority** — ikincisi hâlâ `unresolved` (`C-5A-07`, 5E `C-5E-10`, 5H AI-spend); ayrımı fold etme.

**`C-5A-07-unit-economics-cogs-margin`**
- statement/outcome: Pilot variable COGS **≤%25** recognized revenue, platform infra+observability **≤%12**, long-term gross margin **≥%75**; belirtilen workload/region/tenant/provider bağlamında ölçülür (D6 birebir).
- owner: Admin/Owner + finance/operating · dataAuthority: platform ledger/cost attribution (consumed) · lifecycleAuthority: finance/operating governance
- testOracle: gerçek yük ölçümü — COGS/margin ledger+cost attribution'dan hesaplanır (drill, target değil) · evidenceExpected: bağlam etiketli ölçülmüş COGS/margin raporu
- blocker: sayılar **kabul eşiği**, kanıt değil; gerçek-yük ölçümü residual (D6) → `unresolved`. **Cost-attribution/COGS/AI-spend allocation authority** (kullanım→maliyet eşlemesini tenant/provider/AI ekseninde hangi owner yapar) contract'ta tekil değil → `unresolved` (5E `C-5E-10` cost-attribution + 5H AI-spend ile hizalı); **canonical usage metering (`C-5A-06`) ayrı ve çözülü candidate owner taşır** — D6 hedef sayıları (%25/%12/%75) değişmez.

**`C-5A-08-enterprise-procurement-contracts`**
- statement/outcome: Enterprise anlaşma GA-benzeri taahhütten önce security/legal/procurement incelemesinden (DPA, SLA, exit/portability, order form) geçer; sözleşme Türkiye counsel gate'ine bağlanır.
- owner: Admin/Owner + legal counsel (`validationAuthority`) · dataAuthority: legal/contract sistemi (consumed; **counsel-owned**, Commerce OS canonical değil) · lifecycleAuthority: legal/counsel (human, `validationAuthority`)
- testOracle: reviewer checklist — DPA/SLA/exit maddeleri + counsel sign-off (MANUAL/CHANGESET) · evidenceExpected: imzalı order form + counsel inceleme kaydı
- blocker: Türkiye counsel incelemesi pre-sale gate (D4 residual); **hukuki uyum ispatı değil** → `unresolved`.

**`C-5A-09-pilot-conversion-exit`**
- statement/outcome: Controlled Paid Enterprise Pilot yalnız D5 evidence-control seti (isolation, restore, exit, a11y, security review…) **kanıtlandığında** genişlemeye döner; aksi halde kill-criteria pilotu bitirir (D5 birebir).
- owner: Admin/Owner (product + operating) · dataAuthority: n/a — commercial karar kaydı (D5 kontrollerine referans; owned runtime data yok) · lifecycleAuthority: pilot governance (human)
- testOracle: reviewer gate — her D5 kontrolü conversion iddiasından önce **koşulmuş drill kanıtı** taşır (MANUAL) · evidenceExpected: her D5 kontrolünü drill kanıtına eşleyen conversion scorecard
- blocker: D5 kontrolleri plan, koşulmadı; drill kanıtı olmadan **GA/enterprise-ready iddiası yasak** → `unresolved`.

**`C-5A-10-provider-cost-passthrough`**
- statement/outcome: Provider yürütme maliyeti (PSP/tax/KYC/e-doc/comms) **görünür ve pass-through**; provider **asla** canonical pricing/usage authority değil (D6 birebir).
- owner: RevOps/finance + Payment & Adjustment Orchestration (provider cost sinyali) · dataAuthority: platform ledger (canonical cost); provider = source sinyali · lifecycleAuthority: reconciliation lifecycle (provider komut için Payment & Adjustment Orchestration; cost için ledger)
- testOracle: contract/property — provider cost ledger'a reconcile; provider outage/exit drill (Faz 6 #3) · evidenceExpected: provider cost reconciliation + pass-through beyanı
- blocker: provider exit/failover drill residual (D6); provider canonical authority değil.

## Duplicate and authority notes

- **Pricing ayrımı (fold DEĞİL):** `C-5A-04` (SaaS monetization pricing) ≠ Commerce OS **Offer & Pricing BC** (merchant katalog fiyatı, [`commerce-os-bounded-context-map`](./commerce-os-bounded-context-map.md) §2). Kanonik 6-tuple (`concept+owner+dataAuthority+lifecycleAuthority+consumer+outcome`) farklı (owner/consumer/outcome ayrık) → **sahte-örtüşme, duplicate değil**, fold edilmez, ikisi de yeni module doğurmaz ([`ontology`](./enterprise-saas-capability-ontology.md) §Duplicate).
- **Entitlement ↔ edition fold:** `C-5A-05` ve `C-5A-03` ortak **platform entitlement authority**'yi paylaşır; edition = paketleme, entitlement'ı tüketir. Ayrı "entitlement module" **AÇILMAZ**; davranış platform capability'ye **fold** ([`composition`](./enterprise-saas-product-family-composition.md) §Edition tenant and provider rules).
- **Ledger üçlüsü (tek authority, üç outcome):** `C-5A-06` (usage attribution), `C-5A-07` (margin), `C-5A-10` (provider cost) hepsi **platform ledger/metering** authority'sini okur; outcome'lar ayrık, cross-write yok, tek owner → duplicate ownership değil ([`ontology`](./enterprise-saas-capability-ontology.md) §Ownership).
- **Canonical metering ≠ cost/COGS/AI-spend allocation (bağlayıcı ayrım):** **canonical usage metering** authority `C-5A-06`'da **çözülü candidate owner** (platform ledger/metering) taşır; buna karşılık **cost-attribution/COGS (`C-5A-07`) + AI-spend allocation (5H)** authority'si hâlâ `unresolved` (5E `C-5E-10` ile hizalı). İkisi fold edilmez ve **ikinci owner icat edilmez**; metering'in çözülü olması COGS/AI-spend allocation'ı çözülü saymaz.
- **Legal/accounting authority:** sözleşme/DPA authority `C-5A-08` **counsel/legal**'e ait; accounting posting ve regulated execution **ayrıktır** — Commerce OS yalnız calculation snapshot/reconciliation/evidence yapar, posting/settlement lisanslı sağlayıcı/accounting authority'sine kalır ([`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §7; [`composition`](./enterprise-saas-product-family-composition.md) §Turkey regulated boundary).
- **Provider hiçbir zaman canonical:** `C-5A-06`/`C-5A-10`'da provider yalnız **source sinyali**; canonical usage/cost/pricing authority platform ledger'dır (D6).
- **No module promotion:** 10 adayın hiçbiri app/module/BC düğümü açmaz; her biri paylaşılan platform authority'sine veya mevcut core-7 BC'ye referans verir ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Red to green checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (6, sırayla) | AUTO (oracle metin taraması) | 6/6 mevcut, sırada — reviewer/CI teyidine açık |
| Aday satır ≥ 8 | AUTO | 10 aday (`C-5A-01…10`) |
| Her satır 11 alan dolu **veya** `unresolved`+`blocker` | AUTO/MANUAL | tüm satırlar 11 alan taşır; `unresolved` satırlar (01/04/07/08/09) blocker taşır |
| Sadece 2 sıralı iş (A5A, V5A), paralel iddia yok | AUTO | Execution record: 2/2 sequential; sub-agent/paralel iddiası yok |
| D2/D4/D5/D6 sayı + ICP birebir | AUTO/MANUAL | ICP/≥2 model/%99.9-türevi/%25/%12/%75 iletilen insan kararından alındı; uydurma yok |
| Provider ≠ canonical authority | AUTO | `C-5A-06`/`C-5A-10` + §notes'ta yazılı |
| Legal/accounting authority işaretli | AUTO/MANUAL | `C-5A-08` counsel-owned; accounting/settlement ayrık |
| No module/app creation | AUTO | §notes "No module promotion"; TaskNode alanı/level/faz icat edilmedi |
| Shared authority referansla (kopya yok) | AUTO/MANUAL | entitlement/PDP/ledger/metering consume; reimplement yok |
| In-branch relative link target | MANUAL/CHANGESET | tüm link repo-relative; hedef Glob ile doğrulandı; Codex teyidine açık |
| Claim (kanıtsız "tamam/GA") | AUTO | pilot conversion/margin drill kanıtı bekler; GA iddiası yok |
| Line budget ≤ 220 | AUTO | bu dosya ≤ 220 satır |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** (kapsam dışı).

## Lane decision

- Bu çıktı **Phase 5A strategy/commercial candidate completeness matrisidir**; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve implementasyon/baseline kanıtı değildir.
- Kapsam Commerce OS ilk aile + Türkiye ICP ile sınırlandı (D2/D4/D5/D6 CLOSED); somut ICP/sayı/jurisdiction/provider **uydurulmadı**, iletilen insan kararından birebir alındı.
- 10 aday üretildi; owner/authority/riskTier/testOracle belirsiz olanlar (market evidence, commercial pricing, unit-economics, procurement, pilot conversion) `unresolved`+`blocker` bırakıldı — promote edilmedi.
- Paylaşılan platform authority'leri (entitlement/PDP/ledger/metering) **referansla tüketildi**, yeniden yazılmadı; provider **canonical authority yapılmadı**; legal/accounting authority ayrık işaretlendi; hiçbir aday module/app'e terfi etmedi.
- Stop-gate ihlali: **yok** (sayı hedefi yapılmadı; vendor/protokol module olmadı; cross-write yazılmadı; EVM/REOC scope icat edilmedi; app/module açılmadı).
- Yazılan tek izinli dosya: `docs/enterprise-saas-phase-5a-strategy-commercial-candidates.md`. Diğer 5A shard'ları (5B–5H), Faz 0–4 kanonu, 2 untracked girdi ve sibling worktree **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 5A GO/NO-GO ve kalan dalgalar → Codex'e ait.** Bu worker 5A candidate matrisini üretti ve **durur**; Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.