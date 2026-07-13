# Enterprise SaaS — Human Decision Queue (Phase 4.5 Decision Ledger)

**Güncel durum:** **13 CLOSED (D1–D13), 0 OPEN.** Üstteki Faz 4.5 ve ortadaki Faz 10 OPEN kayıtları tarihsel snapshot'tır; bağlayıcı kapanış bu dosyanın ADR-0031 addendum'undadır. Runtime probe/counsel kanıtları karar değil, açık evidence gate'tir.

**Rol:** Claude SLAVE writer. Codex MASTER + nihai otorite.
**Faz:** 4.5 (erken insan ürün kararı — kapanış turu). Faz 0/1/2/3/4 çıktılarına, iki untracked girdiye ve sibling worktree'ye dokunulmadı. D2–D6 bağlayıcı **insan** kararıyla KAPANDI; **Faz 4.5 GO** yalnız **Faz 5 docs-only candidate analizi** için verilir — implementation/queue/node/schema/gate **açılmaz** ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 4.5/5).
**Tarih:** 2026-07-13 · **Durum:** KARAR LEDGER'I GÜNCEL — runtime/GA kanıtı değildir.

> Bu belge **insan-karar defteridir** (decision ledger), requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve implementasyon kanıtı değildir. İnsan-only seçimler burada **yerime karar verilerek kapatılmaz**; yalnız kaydedilir, önerilen varsayılan/ölçüt verilir ve unblock koşulu yazılır. Hiçbir ICP, sayı, jurisdiction, provider veya seçim **uydurulmaz**. Araştırma sayıları ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §1) kanonik değildir; hiçbiri otomatik hedeftir. Yeni TaskNode alanı/level/faz icat edilmez ([`../src/schemas/task.ts`](../src/schemas/task.ts), [`../AGENTS.md`](../AGENTS.md) §4.4, §7).

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit; Task/subagent tool yok). Bu nedenle **10 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **10/10** · Mod: **sequential (mechanism unavailable)** · Analiz READ-ONLY + tek yazar.
- Girdi/HEAD: `6900d38`, branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon [`../AGENTS.md`](../AGENTS.md), [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`preflight`](./enterprise-saas-requirement-program-preflight.md), [`matrix`](./enterprise-saas-source-normalization-matrix.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`composition`](./enterprise-saas-product-family-composition.md), [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md), [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md), [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md).
- Kararlar **Codex MASTER'ın ilettiği bağlayıcı insan kararlarıdır** (öneri değil); bu worker onları yalnız kaydeder ve tutarlılığını doğrular. Yeni ICP/sayı/jurisdiction/provider **uydurulmadı**; hepsi iletilen insan kararından birebir alındı.
- **Sibling kanıt (salt-okunur, düzenlenmedi, bu branch'te İZLENMEZ):** `actionplan-reoc-boundary` worktree'sindeki `adr-0029` / `reoc-product-scope` / `reoc-bounded-context-map`. Bunlar insan-kabul sınır kanıtıdır fakat bu branch'e dahil değildir; kırık link üretmemek için **yalnız düz metin** olarak anılır, Markdown link verilmez.

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| T1 | D2 closure | record | ilk aile Commerce OS + ICP/buyer/user/JTBD kaydı | Newly closed decisions |
| T2 | D3 closure | record | platform vs Commerce OS core-7-BC authority tahsisi | Newly closed decisions |
| T3 | D4 closure | record | ilk jurisdiction Türkiye + regulated-execution sınırı | Newly closed decisions |
| T4 | D5 closure | record | Controlled Paid Enterprise Pilot + evidence control listesi | Newly closed decisions |
| T5 | D6 closure | record | build/buy/provider + bağlamlı SLO/COGS bütçesi | Newly closed decisions |
| T6 | impact analysis | analyst | kart-baseline, stop-gate, downstream dalga etkisi | Stop gate and downstream impact |
| T7 | red-oracle design | analyst | Faz 5–11 red/green kabul iskeleti ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md)) | Deterministic checks |
| T8 | terminology validation | validate | authority/edition/mode/tenant/provider sözleşme terimleri | Deterministic checks |
| T9 | link validation | validate | in-branch relative link; sibling düz metin | Deterministic checks |
| T10 | allowed-file validation | validate | yalnız 4 izinli dosya; kod/schema/gate yok | Deterministic checks · Claude worker statement |

## Decision semantics

- **Status kümesi:** `CLOSED` (insan tarafından onaylanmış/kapanmış) · `OPEN` (insan kararı beklenir, çözülmemiş) · `DEFERRED` (bilinçli ertelenmiş; default-if-deferred yürürlükte). Bu ledger'de kayıtlı kararların **hiçbiri AI tarafından kapatılamaz**; `CLOSED` yalnız önceden verilmiş **insan** kararını yansıtır ([`../AGENTS.md`](../AGENTS.md) §4.4, `agentPolicy.autonomy="suggest"`).
- **Alan sözleşmesi:** her karar kaydı **id, Status, Decision owner, Evidence, Alternatives, Codex recommendation, Consequence, Unblock condition** taşır. Eksik alan = kırmızı (reviewer teyidine açık).
- **Decision owner = insan rol** (Admin/Owner approver; hukuk için counsel/`validationAuthority`). AI owner olamaz.
- **Codex recommendation ≠ karar:** öneri, karar-kaliteli **varsayılan veya seçim ölçütüdür**; somut ICP/jurisdiction/provider/sayı **seçmez** — o insan yetkisidir ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §8, [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 10 "recommended evidence").
- **Karar-kapanışı vs kart-baseline / implementation ayrımı (bağlayıcı):** D1 sınır-kimliği ve D2–D6 ürün kararları artık **insan tarafından CLOSED**'dır; fakat Faz 4 kompozisyon kartları hâlâ `candidate`/**baselined-değildir** ve **implementation/baseline kanıtı YOKTUR** ([`composition`](./enterprise-saas-product-family-composition.md) §Authority and candidate status). Karar kapanışı; item-level authority tahsisini, test-önce delivery'yi, counsel doğrulamasını ve evidence-control kanıtını **üretilmiş saymaz** — bunlar residual validation olarak açık kalır.

## Closed decisions

**D1 — İlk üç product family sınır-kimliği**
- **id:** `D1-first-three-family-boundary-identity`
- **Status:** **CLOSED** (insan-onaylı sınır-kimliği).
- **Decision owner:** insan Admin/Owner (bağlayıcı ürün yönü; [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §Kaynak yetki).
- **Evidence:** Commerce OS sınırı **in-branch** [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) **ACCEPTED**. EVM ve REOC sınırı sibling `adr-0029`/`reoc-*` tarafından insan-kabul edilmiştir **fakat bu branch'te İZLENMEZ (untracked, not in this branch)** — kanıt-çekincesi: EVM/REOC decision-grade kartı in-branch **yoktur** ([`composition`](./enterprise-saas-product-family-composition.md) §Authority and candidate status V1/V2/V3).
- **Alternatives:** (a) her feature-ID ailesini ayrı app saymak — reddedildi (dağ→app terfisi, sayısal-hedef tuzağı); (b) korpusu doğrudan backlog kabul etmek — reddedildi; (c) "100 app" portföyü — reddedildi, kalan aileler research-only ([`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §Alternatifler; [`composition`](./enterprise-saas-product-family-composition.md) §Portfolio boundary model).
- **Codex recommendation:** kimlik-kapanışını KABUL et; fakat kompozisyon kartlarını `candidate` bırak. EVM/REOC için sibling kanıtı bu branch'e **taşınana** (item-level, insan-onaylı) dek in-branch scope üretme; yeni app/module açma.
- **Consequence:** dağınık commerce/venture/real-estate parçaları için **her aile ayrı, bağımsız satılabilir sınır/kimlik** kazanır (tek birleşik sınır değil); üçü runtime/satış için birbirine bağımlı olmaz ve birbirinin paketini/module'ünü import etmez (yalnız sürümlü event/API). Kimlik kapansa da scope açık kalır.
- **Unblock condition:** yok — bu kimlik kararı **kapalıdır**. D2–D6 de artık CLOSED olduğundan kart-baseline'ı bu kararlara bağlı **değildir**; kompozisyon kartlarının baseline'ı hâlâ **Faz 5 candidate validation + probe/traceability/counsel/evidence-control** kanıtına bağlıdır (karar kapanışı bu kanıtı üretmez; §Newly closed decisions residual validation).

## Newly closed decisions

Aşağıdaki beş karar **Codex MASTER üzerinden iletilen bağlayıcı insan kararıdır** (öneri/varsayılan değil). `Unblock condition` alanı artık **Residual validation**'dır: kapanan kararı **yeniden açmaz**, yalnız kapanıştan bağımsız olarak hâlâ üretilmesi gereken counsel/evidence/probe işini işaret eder.

**D2 — İlk aile ve ilk ICP**
- **id:** `D2-first-family-first-icp`
- **Status:** **CLOSED** (bağlayıcı insan kararı).
- **Decision owner:** insan Admin/Owner (product).
- **Evidence (human, birebir):** İlk aile = **Commerce OS**. ICP = **Türkiye merkezli veya Türkiye'de faaliyet gösteren mid-market/enterprise ticaret işletmeleri**; çok marka/kanal/tenant/seller işletir ve **B2C/D2C/B2B/marketplace'ten en az ikisini** yürütür; **artı** bunlara platform kuran sistem entegratörleri. Ekonomik alıcı: CTO/CIO/CDO/VP-Head of Commerce/platform product manager. Birincil kullanıcılar: commerce ops, catalog ops, marketplace ops, product/platform ekipleri, entegrasyon geliştiricileri. JTBD = dağınık Magento/Drupal-benzeri katalog/fiyat/checkout/order/fulfillment/marketplace/extension/integration operasyonlarını **authority-tanımlı, composable, API/event, tenant-safe Commerce OS** üzerinde konsolide etmek. EVM/REOC ayrı kalır ama ilk satışı **bloklamaz**; onlara scope/module **icat edilmez** ([`composition`](./enterprise-saas-product-family-composition.md) §Commerce OS Card).
- **Alternatives:** (a) EVM/REOC-first — ertelendi; (b) üç aile için eş-zamanlı ICP — reddedildi (odak); (c) yatay çok-persona — reddedildi.
- **Codex recommendation:** kapanış kabul; ICP kill-criterion'lu discovery ile doğrulanmalı; EVM/REOC'a scope üretme.
- **Consequence:** Faz 5 docs-only candidate analizi Commerce OS + bu ICP çerçevesinde **açılabilir**; requirement/backlog/node/implementation değil.
- **Residual validation:** ≥5 hedef müşteri discovery + ödeme/alternatif sinyali kanıtı ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §6) — karar açık değil, kanıt açık.

**D3 — Platform vs Commerce OS authority tahsisi**
- **id:** `D3-platform-vs-commerce-os-authority`
- **Status:** **CLOSED** (bağlayıcı insan kararı).
- **Decision owner:** insan Admin/Owner + platform authority sahibi.
- **Evidence (human, birebir):** **Platform authority** = tenancy/workspace isolation; identity/party; authn; authz/PDP; entitlement/grants; metadata/extensible-schema; workflow/ECA runtime; event/outbox/webhook runtime; audit/evidence; secrets/key; object/file; observability; localization; integration; extension/plugin; generic notification delivery; generic CRM contact/lead/conversation. **Commerce OS authority** = tam **core 7 BC**: Catalog Governance; Offer & Pricing; Cart & Checkout; Order Orchestration; Inventory & Availability; Fulfillment & Returns; Payment & Adjustment Orchestration. Payment orchestration provider command / auth-capture-refund isteği / reconciliation-evidence lifecycle sahibidir; **payment execution DEĞİL**. Aynı 6-tuple iki owner alamaz; cross-write yok; yalnız **versioned command/API/event/outbox**. Faz 5 provisional BC'ler owner/data/lifecycle/independent-policy testini yeniden geçmeli, yoksa **demote** ([`ontology`](./enterprise-saas-capability-ontology.md) §Ownership; [`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix).
- **Alternatives:** (a) her ihtiyacı platforma indirmek; (b) domain davranışını Commerce OS'ta owned tutmak — seçilen sınır ikisini 6-tuple ile ayırır.
- **Codex recommendation:** kapanış kabul; item-level BC eşlemesi ayrı, insan-onaylı, test-önce dalgaya kalır.
- **Consequence:** shared-vs-owned matris ve core-7-BC allocation kart düzeyinde netleşir; cross-write/iki-sahip yasağı bağlayıcıdır.
- **Residual validation:** her BC için tekil `owner`/`dataAuthority`/`lifecycleAuthority` **item-level** matrisi ve provisional BC re-pass/demote kanıtı.

**D4 — İlk jurisdiction (Türkiye) ve regulated-execution sınırı**
- **id:** `D4-first-jurisdiction-turkey`
- **Status:** **CLOSED** (bağlayıcı insan kararı).
- **Decision owner:** insan Admin/Owner + counsel (`validationAuthority`).
- **Evidence (human, birebir):** İlk jurisdiction = **Türkiye**. Bu **hukuki uyum ispatı DEĞİLDİR**; **Türkiye-yetkili counsel zorunlu pre-production/pre-sale validation gate**'tir. Sahiplenilmeyen regulated execution: payment/custody, escrow, MoR, kredi/mortgage, sigorta underwriting, KYC/AML execution, tax filing/authority, e-sign trust service, e-notary/notary, tapu (title deed), düzenlenmiş e-invoice/e-document delivery, banking/financial accounting execution → **lisanslı sağlayıcı**. Commerce OS yalnız orchestration/policy selection/command/status/reconciliation/calculation snapshot/evidence yapar. **Calculation, regulated execution, settlement, accounting posting ayrık** ([`adr-0030`](./adr-0030-commerce-operating-system-boundary.md) §7; [`composition`](./enterprise-saas-product-family-composition.md) §Edition tenant and provider rules).
- **Alternatives:** (a) çok-jurisdiction day-1 — reddedildi; (b) regulated yürütmeyi üstlenmek — reddedildi (lisans/uyum).
- **Codex recommendation:** kapanış kabul; counsel gate ürün/satış öncesi zorunlu tutulur.
- **Consequence:** ilk dilim tek jurisdiction + açık regulated-action sınır tablosuyla ilerler; "istemeden regulated role" riski sınır tablosuyla kapatılır.
- **Residual validation:** Türkiye-yetkili counsel incelemesi + residency-lineage denetimi ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §6) — karar değil, kanıt açık.

**D5 — Hedef maturity tier: Controlled Paid Enterprise Pilot**
- **id:** `D5-controlled-paid-enterprise-pilot`
- **Status:** **CLOSED** (bağlayıcı insan kararı).
- **Decision owner:** insan Admin/Owner (product + operating).
- **Evidence (human, birebir):** Tier = **Controlled Paid Enterprise Pilot** (full enterprise GA **değil**). Minimum evidence controls: tenant isolation; RBAC/ABAC/PDP; immutable audit/decision history; idempotency/retry/compensation; backup/restore drill; tenant export/portability; provider exit/failover; monitoring/alerts/distributed trace; incident/escalation; vulnerability/dependency mgmt; classification/retention/deletion workflow; rollback/migration rehearsal; API/event versioning; load/noisy-neighbor; accessibility/localization baseline; support runbook; human security/privacy/legal review. Kanıt olmadan **enterprise-ready/GA iddiası yok** ([`composition`](./enterprise-saas-product-family-composition.md) §Commerce OS Card; [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §7).
- **Alternatives:** (a) full enterprise GA day-1 — reddedildi (kapsam patlaması); (b) ücretsiz POC — reddedildi (ödeme sinyali yok).
- **Codex recommendation:** kapanış kabul; her kontrol Enterprise DoD/evidence taksonomisine referansla ölçülür, yeni tier icat edilmez.
- **Consequence:** ilk satış için zorunlu kontrol kümesi bağlayıcıdır; bu kontroller kanıtlanmadan GA dili yasaktır.
- **Residual validation:** her kontrol için gerçek drill/evidence (restore, exit, a11y, security review) — plan değil, koşulmuş kanıt.

**D6 — Build/buy/provider politikası + bağlamlı SLO/COGS bütçesi**
- **id:** `D6-build-buy-provider-slo-cogs`
- **Status:** **CLOSED** (bağlayıcı insan kararı).
- **Decision owner:** insan Admin/Owner + finans/operating.
- **Evidence (human, birebir) — Build:** Commerce OS domain authority, canonical data/lifecycle, policy/orchestration, provider-neutral ports, reconciliation, evidence, tenant-safe config, extension governance. **Buy/provider:** payment execution, KYC/AML, tax calculation/filing, regulated e-doc delivery, e-sign trust, email/SMS/push, geo/map, fraud data, external search (gerekirse), CDN/object infra, observability infra (gerekirse). **Provider asla canonical authority değildir**; her provider portability/export/replay/reconciliation/degraded-mode/circuit-breaker/exit drill ister. **Pilot bütçesi (workload/region/tenant/provider bağlamı zorunlu):** paid core API availability **≥%99.9 aylık**; error budget türetilir; p95 read **≤500ms**; p95 mutation (provider hariç) **≤1000ms**; RPO **≤15dk**; RTO **≤4sa**; noisy-neighbor etki **≤%20 p95 degradation**; variable COGS **≤%25 recognized revenue**; platform infra+observability **≤%12**; provider cost görünür/pass-through; long-term gross margin **≥%75** ([`composition`](./enterprise-saas-product-family-composition.md) §Commerce OS Card SLO/COGS; [`constitution`](./enterprise-saas-requirement-constitution.md) §Migration and rollout).
- **Alternatives:** (a) regulated yürütmeyi in-house build — reddedildi; (b) provider'ı canonical kaynak yapmak — reddedildi.
- **Codex recommendation:** kapanış kabul; bütçe değerleri **hedef/SLA kanıtı değil**, pilot kabul eşiğidir; her provider için exit/failover/portability drill zorunlu.
- **Consequence:** provider-neutral port + exit drill bağlayıcı; sayılar bağlam olmadan geçerli sayılmaz (workload/region/tenant/provider notu zorunlu).
- **Residual validation:** her provider için koşulmuş exit/failover drill + gerçek yük altında SLO/COGS ölçümü ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §6).

## Recommended decision order

Kararlar kapandı; bu, kapanış-sonrası **residual validation** sırasıdır (insan sırayı değiştirebilir).

1. **D2 (Commerce OS + ICP)** kapandı → Faz 5 docs-only candidate analizi bu çerçevede açılır.
2. **D3 (authority tahsisi)** kapandı → item-level BC/authority eşlemesi ayrı, insan-onaylı, test-önce dalgaya kalır.
3. **D4 (Türkiye)** kapandı → counsel pre-sale gate ve regulated-action sınır tablosu residual kalır.
4. **D5 (Pilot tier)** kapandı → evidence-control kanıtı (drill'ler) residual kalır.
5. **D6 (build/buy/provider + SLO/COGS)** kapandı → provider exit drill + gerçek ölçüm residual kalır. **D1** zaten CLOSED.

## Stop gate and downstream impact

- **Faz 4.5 kapısı:** D1 ve D2–D6 **insan tarafından CLOSED** → **Faz 4.5 GO**, fakat yalnız **Faz 5 docs-only candidate analizi** için ([`composition`](./enterprise-saas-product-family-composition.md) §Portfolio sequencing and exit criteria; [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 4.5).
- **Faz 5 kapsam sınırı:** GO **yalnız** onaylanabilir candidate-set/domain-completeness dokümanınadır; requirement/backlog/**queue/node/schema/gate/kod/test veya implementation AÇILMAZ** ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5 "requirement listesi değil … onaylanabilir candidate set").
- **Downstream (artık çerçevesi net):** D2 → 5A strategy/commercial Commerce OS+ICP çerçevesinde; D3 → 5B identity + 5C data core-7-BC authority ile; D4 → 5D security/privacy + 5G globalization Türkiye + counsel gate ile; D5 → DoR/DoD alt-kümesi Pilot control listesiyle; D6 → 5E reliability + 5F integration provider-neutral port + SLO/COGS bütçesiyle sınırlanır; **D3+D5+D6 → 5H AI/data science** (model/data authority D3 core-7-BC + platform data ile, AI silent-failure/drift evidence-control D5 ile, AI provider/build-buy + AI-spend allocation D6 ile — AI-spend allocation authority `unresolved`) sınırlanır ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
- **Kart-baseline / implementation etkisi:** karar kapanışı **kart-baseline veya implementation kanıtı üretmez.** Kompozisyon kartları `candidate` kalır; baseline yalnız item-level authority + counsel + evidence-control + test-önce delivery kanıtı üretildiğinde, insan onayıyla olur; sonraki değişiklik CR+impact+revalidation ister ([`constitution`](./enterprise-saas-requirement-constitution.md) §Baseline and change control).

## Deterministic checks — Phase 4.5 snapshot

Bu tablo Phase 10 addendum'undan **önceki** Phase 4.5 kapanış zarfını ölçer: o anda 9 H2 ve D1–D6 olmak üzere 6 karar kaydı vardı. Addendum sonrasında dosyanın toplamı 10 H2 ve 13 karar kaydına çıktı (D1–D6 CLOSED; D7–D13 Faz 10'da OPEN açıldı, **sonra ADR-0031 ile CLOSED** — bkz. §ADR-0031 kapanış addendum, güncel toplam **13 CLOSED / 0 OPEN**); aşağıdaki tarihsel oracle geriye dönük değiştirilmez.

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (9, sırayla) | AUTO (oracle metin taraması) | 9/9 mevcut, tam sırada (2. bölüm adı "Newly closed decisions") — reviewer/CI teyidine açık |
| Karar kaydı sayısı ≤ 7 | AUTO | 6 kayıt (D1 + D2–D6) **hepsi CLOSED** |
| Her kayıtta 8 alan | AUTO | id/Status/Decision owner/Evidence/Alternatives/Codex recommendation/Consequence/Residual(=Unblock) her kayıtta |
| D2–D6 CLOSED + human evidence birebir | AUTO/MANUAL | Commerce OS/ICP/Türkiye/Pilot/build-buy/SLO-COGS iletilen insan kararından birebir yazıldı |
| Faz 4.5 GO (docs-only) | AUTO | GO yalnız Faz 5 candidate-set dokümanı için; queue/node/schema/gate/implementation kapalı |
| Karar ≠ implementation/baseline | AUTO/MANUAL | kartlar `candidate`; kapanış baseline/kanıt üretmedi; residual validation yazılı |
| No fabricated ICP/number/jurisdiction/provider | AUTO/MANUAL | somut değerler **iletilen insan kararından** alındı; worker uydurmadı |
| Terminology (authority/edition/mode/tenant/provider) | MANUAL/CHANGESET | terimler ontology/ADR-0030 sözleşmesiyle uyumlu; reviewer teyidine açık |
| In-branch relative link target | MANUAL/CHANGESET | tüm in-branch link repo-relative; `oracles` linki eklendi; Codex teyidine açık |
| Sibling no broken link | AUTO | `adr-0029`/`reoc-*` düz metin; link verilmedi (untracked/not-in-branch) |
| Allowed-files | AUTO (`git status` Codex'te) | yalnız 4 izinli dosya; kod/schema/gate yok |
| Line budget ≤ 300 | AUTO | bu dosya ≤ 300 satır |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** (kapsam dışı).

## Claude worker statement

- Ben Claude SLAVE writer'ım; bu ledger bir **öneridir**, Codex bağımsız doğrulamadan tamamlanmış sayılmaz.
- **D2–D6 kararlarını ben kapatmadım:** bunlar Codex MASTER üzerinden iletilen **bağlayıcı insan kararlarıdır**; ben yalnız birebir kaydettim, tutarlılığını doğruladım ve residual validation işini işaretledim. Yeni ICP/sayı/jurisdiction/provider **uydurmadım**.
- Kapanışı **implementation/baseline/geçti** olarak sunmadım; kartlar `candidate`, kontroller kanıt-bekler kaldı.
- Yalnız 4 izinli dosya düzenlendi; JSON/schema/gate/node/app/module/kod/test yok. Commit/push/PR/merge **yapılmadı**. Sibling `adr-0029` düzenlenmedi ve link verilmedi.

## Phase decision

- Bu çıktı **Phase 4.5 insan-karar defteridir**; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve implementasyon kanıtı değildir.
- **D1 CLOSED** (Commerce OS in-branch ACCEPTED; EVM/REOC sibling, not-in-branch). **D2–D6 CLOSED** — bağlayıcı insan kararı; worker kapatmadı, kaydetti.
- **Faz 4.5 GO → yalnız Faz 5 docs-only candidate analizi.** requirement/backlog/queue/node/schema/gate/kod/test/implementation **açılmaz**.
- Stop-gate ihlali: **yok** (worker ICP/sayı/jurisdiction/provider uydurmadı; app/module açmadı; kart baseline'a terfi etmedi; kod/schema/gate yazmadı).
- Yazılan izinli dosyalar: `enterprise-saas-human-decision-queue.md`, `enterprise-saas-product-family-composition.md`, `enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md`, `enterprise-saas-phase-5-11-acceptance-oracles.md`. Faz 0/1/2/3 kanonu, 2 untracked girdi ve **sibling worktree değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 4.5 GO/NO-GO ve Faz 5 açılışı → Codex'e ait.** Bu worker defteri güncelledi ve **durur**.

## Phase 10 tarihsel addendum — karar anında açık D7–D13

**Faz:** 10 insan karar kapısı tarihsel snapshot'ı. Bu tablo karar anındaki **OPEN** durumunu korur; güncel ve bağlayıcı durum hemen alttaki ADR-0031 kapanış addendum'unda **13 CLOSED / 0 OPEN** olarak kayıtlıdır.

| id | Karar (özet) | Sınıf | Default-if-deferred | Owner / validationAuthority | Status |
|---|---|---|---|---|---|
| D7 | Design-time cycle çözümü: contract-extraction / dependency-inversion / authority-event redesign | architecture | **yayın BLOKE (NO-GO)** | platform + Commerce OS architecture (D3) + Codex | **OPEN · publication blocker** |
| D8 | Canonical tenant export/portability bundle + deletion/disposition attestation owner: platform vs domain vs explicit-split | authority | export/disposition baselineable değil | data/exit owner + Türkiye counsel (D4) | **OPEN** |
| D9 | Metadata-upgrade gate + backup/restore consistency & crypto-shred authority (irreversibility farklıysa **split** önerilir) | authority | gate owner'sız blast radius sınırsız | migration owner + data/DR authority | **OPEN** |
| D10 | Lifecycle compensation/event semantic contract: cancellation, reservation expiry/release, refund/adjustment consumers, Cart intent vs Order event owner | architecture | lifecycle semantiği tanımsız | Commerce OS domain authority (D3) + Codex | **OPEN** |
| D11 | Provisional BC yönü Channel/Classifieds/Recommerce (Classifieds REOC Property/Listing authority alamaz) | authority | üçü `UNRESOLVED`, promote yok | Admin/Owner + platform/Commerce OS authority | **OPEN** |
| D12 | AI yüksek-risk human-review eşik matrisi + accountable owner (budget-stop settled; cost-attribution ayrık `unresolved`) | governance | accountable owner yok | AI governance owner + human override + Codex | **OPEN** |
| D13 | D6 hedefleri için pilot doğrulama zarfı (workload/region/tenant/provider/window) — **D6 sayılarını değiştirmez** | commercial/governance | sayılar bağlamsız, ölçülemez | reliability/ops + finans/operating + product | **OPEN** |

Her kararın tam alanları (**options · trade-off · affected candidates/docs · default-if-deferred · irreversible cost · recommended evidence · owner/validationAuthority**) [`phase10-audit`](./enterprise-saas-phase-10-human-decision-audit.md) §Açık kararlar bölümündedir. **Karar-dışı (evidence gate, yeni karar değil):** Türkiye counsel validation (D4) ve 14/14 runtime probe sonucu ([`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md)); cost/COGS/AI-spend allocation owner **folded/ayrık `unresolved`**'dır.

**Phase 10 kararı (addendum):** docs-only Faz 11 **blocked-readiness** raporu **GO** (yalnız yayın blocker'larını raporlar); **publication ve development NO-GO** kalır (D7 açık, 14/14 probe NOT-RUN/UNRESOLVED). Bu worker JSON/node/queue/schema/gate/kod/test üretmedi, commit/push/merge yapmadı; D1–D6 CLOSED metin/status değişmedi. Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

## ADR-0031 kapanış addendum — D7–D13 CLOSED (güncel; Faz 10 OPEN kaydını supersede eder)

**Tarih:** 2026-07-13 · **Durum:** güncel kapanış; yukarıdaki Faz 10 addendum'u **tarihsel snapshot** olarak korunur, geriye dönük silinmez.

- **İnsan yetki delegasyonu (bağlayıcı):** İnsan (Owner/Admin), Faz 9 adversarial review + Faz 10 karar denetimi analizini **uygulama ve D7–D13'ü kapatma** yetkisini açıkça **Codex MASTER'a devretti**; bu kapanış [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) **ACCEPTED** kaydında insan-yetkilidir. **Claude SLAVE writer karar vermedi**; D2–D6'da olduğu gibi yalnız iletilen insan-yetkili kapanışı kaydeder ve tutarlılığını doğrular. AI bir insan kararını kapatamaz; burada AI-kapatma iddiası yoktur.
- **D1–D6 değişmedi:** yukarıdaki CLOSED kayıtların metni/statüsü aynen korunur; bu addendum yalnız D7–D13'ü kapatır.
- **Bu karar-setinin güncel sayısı: 13 CLOSED (D1–D13), 0 OPEN.**
- **Karar-dışı (open evidence, ürün kararı değil):** Türkiye counsel validation (D4) ve 14/14 runtime probe **açık evidence gate** olarak kalır; cost/COGS/AI-spend allocation folded owner ayrık. D7–D13 kapanışı bu kanıtları **koşmaz/üretmez**; **instruction-ready ≠ runtime/GA-ready**.

| id | Status | Decision owner (insan/otorite) | Consequence (kapanan yön) | Evidence / residual |
|---|---|---|---|---|
| D7 | **CLOSED** (ADR-0031, insan-yetkili) | Architecture authority (platform + Commerce OS D3) | Business BC'ler birbirini import etmez; her iki taraf **neutral, sürümlü commerce integration-contract paketleri + public SDK portlarına** bağlanır; design-time bağımlılık **DAG**. Yayın blocker'ı **dokümantasyon/tasarım düzeyinde** temizlendi. | [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) §D7; build-enforced DAG + yayınlanmış contract paketleri **residual** (koşulmadı) |
| D8 | **CLOSED** (ADR-0031, insan-yetkili) | Platform + domain + governance + audit (explicit split) | Envelope/manifest/crypto/streaming/import-verify = platform; payload schema/semantic = her domain; retention/disposition = governance; attestation = evidence/audit; provider asla canonical değil. | §D8; export round-trip + import-verify + counsel disposition attestation **residual** |
| D9 | **CLOSED** (ADR-0031, insan-yetkili) | Üç isimli authority (metadata/schema-evolution · data-resilience · key-management) | Tek belirsiz owner yok; crypto-shred KMS'te yürütülür fakat governance/counsel **yetkilendirir**; key loss fail-closed. | §D9; backup/restore RPO/RTO + rotation/revocation/crypto-shred drill **residual** |
| D10 | **CLOSED** (ADR-0031, insan-yetkili) | Commerce OS domain/architecture authority (D3) | **Cart & Checkout** cart/checkout session sahibi → **`CheckoutSubmitted`** (purchase intent), order yazmaz; **Order Orchestration tek yazar** + saga/process manager; cross-context write yok; saga komutları idempotent. | §D10; cancellation/reservation-expiry/refund/replay saga testleri **residual** |
| D11 | **CLOSED** (ADR-0031, insan-yetkili) | Admin/Owner + Catalog/CRM authority | **Channel DEMOTE** (integration/projection/config); **Classifieds DEMOTE** (Catalog/Offer/CRM/Entitlement üzeri opsiyonel edition, REOC Property/Listing authority alamaz); **Recommerce KEEP PROVISIONAL** (later-edition, ilk core dilim dışı). | §D11; provisional re-pass/demote kanıtı **residual** |
| D12 | **CLOSED** (ADR-0031, insan-yetkili) | Central AI Governance (accountable) + domain use-case owner | Yüksek-risk AI aksiyonu öncesi **zorunlu insan onayı** (para/erişim/legal/PII/cross-tenant/geri-alınamaz yayın/permission genişleme); yalnız abstain/degrade/kill-switch otomatik; model rollback insan-gated; budget-stop platform güvenlik primitifi, cost-attribution FinOps ayrık. | §D12; human-approval workflow + kill-switch drill **residual** |
| D13 | **CLOSED** (ADR-0031, insan-yetkili) | Commercial/governance + platform | **Tek parametreli referans doğrulama zarfı**; D6 sayısal hedefleri **değişmedi**; varsayılan engineering fixture kontrat kanıtı değildir; pilot zarf değerleri validation'dan önce kaydedilir. | §D13; kaydedilmiş zarf + ölçülen D6 hedefleri **residual** |

**Kapanış kararı (addendum):** Karar-seti **13 CLOSED / 0 OPEN**; Commerce OS handoff **instruction-ready / READY FOR VIBECODER INSTRUCTION**'a taşındı ([`task-packets`](./commerce-os-vibecoder-task-packets.md) V0…V16). **Runtime/pilot/GA hâlâ NO-GO**: V0–V16 kanıtı, 14 probe ve counsel açık. Bu worker JSON/node/queue/schema/gate/kod/test üretmedi, commit/push/merge yapmadı; D1–D6 metin/status değişmedi. Codex bağımsız doğrulamadan tamamlanmış sayılmaz.
