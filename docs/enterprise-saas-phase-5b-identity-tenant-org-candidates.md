# Enterprise SaaS — Phase 5B Identity/Tenant/Org Candidate Completeness Matrix

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 5B (identity/tenant/org candidate completeness). Faz 4.5 D3 (platform vs Commerce OS authority) + D5 (Controlled Paid Enterprise Pilot) CLOSED çerçevesinde açıldı ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions). Bu **onaylanabilir candidate set / domain-completeness** dokümanıdır; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **aday tamlık matrisidir** (identity/tenant/org yüzeyi), requirement listesi/backlog/module değildir. **Kritik invariant:** identity, authn/federation, machine identity, delegated admin, org/legal-entity graph, tenant/workspace lifecycle+isolation, tenant routing/region/key-ref, quota, cross-org sharing, generic party/contact/lead/conversation ve session/device trust'ın **kanonik kayıt sahibi platform/kernel'dir** (D3 birebir); Commerce OS bu authority'lerin **hiçbir canonical record'una sahip değildir**, yalnız versioned contract/API/event ile **tüketir** ([`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix). Generic CRM (contact/lead/conversation) Commerce OS'a **kopyalanmaz** (D3 platform authority). Hiçbir aday app/module/BC düğümüne **terfi ETMEZ** ([`../AGENTS.md`](../AGENTS.md) §4.4). Owner/authority belirsizse satır `unresolved`.

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). Bu nedenle **2 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **2/2** · Mod: **sequential (mechanism unavailable)** · READ-ONLY analiz + tek yazar.
- Girdi/HEAD: branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon [`../AGENTS.md`](../AGENTS.md), [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`ledger`](./enterprise-saas-human-decision-queue.md) (D3/D5), [`composition`](./enterprise-saas-product-family-composition.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md), [`actor-party-contract`](./actor-party-contract.md), [`adr-A1`](./adr-A1-actor-party.md), [`adr-K1`](./adr-K1-kernel-kimlik.md), [`core-contract-pack`](./core-contract-pack.md), [`capability-entitlement-contract`](./capability-entitlement-contract.md), [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md), [`commerce-os-bounded-context-map`](./commerce-os-bounded-context-map.md).

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| A5B | identity/tenant/org analyst | analyst | 11 aday: identity proofing, authn/federation, machine/service identity, delegated admin, org/legal-entity graph, tenant/workspace lifecycle+isolation, tenant routing/region/key-ref, quota, cross-org sharing, generic party/CRM authority, session/device trust | Candidate completeness matrix |
| V5B | identity/tenant/org reviewer | reviewer | authority/dedup/fold, platform-owned canonical (Commerce OS consumer-only), cross-tenant leak negative oracle, no-CRM-copy, ambiguous→unresolved, no module promotion, link/field/claim | Duplicate and authority notes · Red to green checks |

Sıra: **A5B → V5B** (sıralı, aynı dosya). İki iş de aynı tek dosyaya yazdı; başka lane'e paralel yazım yok.

## Lane boundary

- **scope:** yalnız Commerce OS'un **tüketeceği** identity/tenant/org contract yüzeyinin candidate completeness'ı; canonical record ownership değil (o platform/kernel'de). owner/authority/riskTier/testOracle belirsizse `unresolved`.
- **inputs:** yukarıdaki kanon; D3 authority allocation + D5 pilot control listesi **bağlayıcı insan kararı** ([`ledger`](./enterprise-saas-human-decision-queue.md)).
- **allowed-files:** yalnız `docs/enterprise-saas-phase-5b-identity-tenant-org-candidates.md`. Başka dosya, JSON/node/schema/gate/kod/test yok.
- **non-goals:** requirement/backlog/module/app üretmek; k-identity/k-party/k-tenancy/authz/PDP/entitlement/KMS'i yeniden yazmak; generic CRM'i Commerce OS'a kopyalamak; identity/tenant kaydını Commerce OS-owned yapmak; regulated KYC/AML execution'ı üstlenmek (provider, D4); module terfisi.
- **checks:** §Red to green checks (deterministik metin/link taraması; otomatik gate yoksa `MANUAL/CHANGESET`).
- **output:** ≥9 aday satır + **zorunlu cross-tenant leak negative oracle** + duplicate/authority notları + red/green.
- **blockers:** machine identity, delegated-admin lifecycle, region/residency, quota authority, cross-org sharing, session/device trust — contract'ta net owner/lifecycle yok → `unresolved` (blocker alanında).

## Candidate completeness matrix

Alan sözleşmesi (her aday): `candidateId · outcome · owner · dataAuthority · lifecycleAuthority · scopeClass · riskTier · testOracle · evidenceExpected · status · blocker` ([`constitution`](./enterprise-saas-requirement-constitution.md) §Candidate record contract). scopeClass sözlüğü [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §1. Bir alan çözülemezse satır `unresolved` + `blocker`. Owner=platform/kernel rolü; Commerce OS **consumer**, canonical authority değil.

| candidateId | scopeClass | riskTier | status |
|---|---|---|---|
| `C-5B-01-identity-proofing-assurance` | platform capability (consumed) | high | unresolved |
| `C-5B-02-authentication-federation` | platform capability (consumed) | high | candidate |
| `C-5B-03-machine-service-identity` | platform capability (consumed) | high | unresolved |
| `C-5B-04-delegated-admin` | platform capability (consumed) | high | unresolved |
| `C-5B-05-org-legal-entity-graph` | platform capability (consumed) | medium | candidate |
| `C-5B-06-tenant-workspace-lifecycle-isolation` | platform capability (consumed) | high | candidate |
| `C-5B-07-tenant-routing-region-key-ref` | policy | high | unresolved |
| `C-5B-08-tenant-quota-noisy-neighbor` | NFR | medium | unresolved |
| `C-5B-09-cross-org-sharing` | platform capability (consumed) | high | unresolved |
| `C-5B-10-generic-party-crm-authority` | platform capability (consumed) | medium | candidate |
| `C-5B-11-session-device-trust` | platform capability (consumed) | high | unresolved |

Detaylı alanlar (aynı authority'yi referansla, kopyalamaz):

**`C-5B-01-identity-proofing-assurance`**
- outcome: Kimlik ispat/assurance seviyesi (onboarding doğrulama gücü) contract'tan **tüketilir**; Commerce OS assurance-level'i okur, kendi proofing'ini yazmaz.
- owner: platform `k-identity` · dataAuthority: `k-identity` (assurance record) · lifecycleAuthority: platform identity lifecycle
- testOracle: reviewer/contract — düşük-assurance aktör yüksek-assurance aksiyonu yapamaz (MANUAL) · evidenceExpected: assurance-level → aksiyon eşlemesi
- blocker: **proofing ≠ regulated KYC/AML execution** (o provider, D4); assurance vs KYC-execution authority ayrımı contract'ta net değil → `unresolved`.

**`C-5B-02-authentication-federation`**
- outcome: Login/SSO/federation (OIDC/SAML/IdP broker) platform authn'dır; Commerce OS oturumu doğrulanmış subject olarak **tüketir**, parola/token tutmaz ([`actor-party-contract`](./actor-party-contract.md) §3).
- owner: platform `k-identity` (authn) · dataAuthority: `k-identity` credential/federation kaydı · lifecycleAuthority: platform authn lifecycle
- testOracle: negative/security — geçersiz/expired federation assertion reddedilir; BC-local authn bypass yok · evidenceExpected: federation config + negative authn test yolu
- blocker: yok (authority D3'te net platform); IdP-per-tenant config item-level eşlemesi ayrı dalga.

**`C-5B-03-machine-service-identity`**
- outcome: Servis/M2M principal (service account, client-credential, workload identity) contract'tan tüketilir; Commerce OS BC'leri makine kimliğini PDP subject olarak alır.
- owner: platform `k-identity` (aday; contract explicit değil) · dataAuthority: **belirsiz** — party/identity contract machine principal kaydını netlemiyor · lifecycleAuthority: **belirsiz**
- testOracle: negative — kimliksiz/scope-dışı servis çağrısı reddedilir + audit · evidenceExpected: service-principal → scope eşlemesi + negative test
- blocker: machine/service identity **canonical owner/lifecycle contract'ta yok** (party = person/organization) → `unresolved`; icat edilmez.

**`C-5B-04-delegated-admin`**
- outcome: Delege yönetim (tenant-admin'in kısıtlı yetkiyi devretmesi, break-glass) authz/PDP + `party_relation`(represents) ile modellenir; Commerce OS karar sonucunu tüketir.
- owner: platform authz/PDP + `k-party` (represents kenarı) · dataAuthority: PDP grant + `party_relation` · lifecycleAuthority: **belirsiz** — delegation grant/expiry lifecycle owner net değil
- testOracle: negative — devredilmemiş/expired delegation aksiyonu reddedilir; scope genişletme yok · evidenceExpected: delegation grant + expiry + audit izi
- blocker: delegated-admin **lifecycle authority** (grant/revoke/expiry) contract'ta netlenmemiş → `unresolved`.

**`C-5B-05-org-legal-entity-graph`**
- outcome: Organizasyon/tüzel kişi grafiği (parent/subsidiary/employs/owns/represents) `k-party`+`party_relation`'da yaşar; Commerce OS "bu belgenin tarafı" derken `party_id`+role'e bağlanır, kendi org tablosunu açmaz ([`actor-party-contract`](./actor-party-contract.md) §11).
- owner: platform `k-party` · dataAuthority: `party` + `party_relation` (organization type) · lifecycleAuthority: platform party lifecycle (AI-draft→insan-onay→motor)
- testOracle: contract — Commerce OS BC'si `party` referansı taşır, app-özel org tablosu yok (MANUAL/CHANGESET) · evidenceExpected: BC→party referans haritası
- blocker: yok; legal-entity ↔ tax/VKN referansı PII/tip kurallarında (external_ref), item-level ayrı dalga.

**`C-5B-06-tenant-workspace-lifecycle-isolation`**
- outcome: Tenant/workspace provizyon/suspend/archive + fail-closed izolasyon (RLS ikinci bariyer) platform `k-tenancy`'de; Commerce OS her kaydı tenant-scoped yazar, izolasyonu **tanımlamaz** ([`actor-party-contract`](./actor-party-contract.md) §9; [`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix).
- owner: platform `k-tenancy` · dataAuthority: `k-tenancy` (tenant/workspace kaydı) · lifecycleAuthority: platform tenancy lifecycle
- testOracle: **negative (zorunlu) — cross-tenant leak:** A tenant B'nin kaydını göremez/yazamaz; bağlamsız istek `TenantViolationError` + audit (≥10 negatif case; [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §probes cross-tenant leak) · evidenceExpected: fail-closed + RLS negatif test raporu
- blocker: yok (authority net); schema-per-tenant vs RLS eşiği ADR-0026 residual.

**`C-5B-07-tenant-routing-region-key-ref`**
- outcome: Tenant→region/residency yönlendirme + tenant key referansı (envelope/KMS ref, provider değil) platform tenancy+KMS'te; Commerce OS region/key-ref'i **okur**, key material tutmaz.
- owner: platform `k-tenancy` + `k-kms` (key ref) · dataAuthority: tenancy routing + KMS key referansı · lifecycleAuthority: platform key/region lifecycle
- testOracle: negative — yanlış region/key-ref ile veri erişimi reddedilir; region/key loss probe · evidenceExpected: region-lineage + key-ref rotation kaydı
- blocker: **residency-lineage denetimi D4 residual** (counsel gate + lineage); somut region/jurisdiction uydurulmaz → `unresolved`.

**`C-5B-08-tenant-quota-noisy-neighbor`**
- outcome: Per-tenant kota/oran/kaynak bütçesi (noisy-neighbor koruması) contract'tan tüketilir; Commerce OS kotayı okur, kendi kota otoritesini yazmaz.
- owner: platform tenancy/entitlement (aday) · dataAuthority: **belirsiz** — kota authority entitlement mı, tenancy mi, metering mi net değil · lifecycleAuthority: **belirsiz**
- testOracle: property/negative — kota aşımı reddedilir/throttle; noisy-neighbor probe ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §probes) · evidenceExpected: kota→enforcement noktası + ölçülmüş bütçe
- blocker: kota **canonical authority** (entitlement/tenancy/metering) çözülmemiş; somut sayı insan/NFR kararı → `unresolved`.

**`C-5B-09-cross-org-sharing`**
- outcome: Org'lar/tenant'lar arası kontrollü paylaşım (counterparty portal, delegated access) authz/PDP + tenancy ile sınırlı; **varsayılan deny**, paylaşım açık grant ile.
- owner: platform authz/PDP + `k-tenancy` (aday) · dataAuthority: **belirsiz** — cross-org share grant kaydının sahibi net değil · lifecycleAuthority: **belirsiz**
- testOracle: **negative (zorunlu) — cross-tenant leak:** grant'sız cross-org erişim reddedilir; paylaşım tenant sınırını genişletmez (context yalnız daraltır) · evidenceExpected: share-grant + negatif leak testi
- blocker: cross-org sharing **authority/lifecycle contract'ta yok** → `unresolved`; icat edilmez.

**`C-5B-10-generic-party-crm-authority`**
- outcome: Generic party/contact/lead/conversation **platform authority'dir** (D3 birebir); Commerce OS bunu **tüketir, kopyalamaz**. Commerce OS domain'i "buyer party" derken referans verir, kendi contact/lead/conversation defterini **açmaz** ([`ledger`](./enterprise-saas-human-decision-queue.md) D3; [`actor-party-contract`](./actor-party-contract.md) §3 non-goals).
- owner: platform generic CRM + `k-party` · dataAuthority: platform CRM (contact/lead/conversation) · lifecycleAuthority: platform CRM lifecycle
- testOracle: contract/negative — Commerce OS BC'sinde contact/lead/conversation tablosu yok; CRM referansla tüketilir (MANUAL/CHANGESET) · evidenceExpected: no-CRM-copy taraması + party referans haritası
- blocker: yok (D3 net); CRM ↔ Commerce OS party köprüsü item-level ayrı dalga. **Copy-into-Commerce-OS yasak.**

**`C-5B-11-session-device-trust`**
- outcome: Oturum/cihaz güveni (session binding, device posture, step-up) platform identity'de; Commerce OS oturum güven sinyalini PDP girdisi olarak tüketir.
- owner: platform `k-identity` (aday) · dataAuthority: **belirsiz** — session/device trust kaydının sahibi contract'ta net değil · lifecycleAuthority: **belirsiz**
- testOracle: negative — güvensiz/expired oturum hassas aksiyonda step-up ister/reddeder; replay/idempotency probe · evidenceExpected: session-trust → step-up eşlemesi + negatif test
- blocker: session/device trust **canonical owner/lifecycle contract'ta yok** → `unresolved`.

## Commerce OS consumption profile

- **Consumer-only invariant:** 11 adayın **hiçbirinde** Commerce OS canonical record sahibi değildir; her satırda owner platform/kernel (`k-identity`/`k-party`/`k-tenancy`/authz-PDP/entitlement/KMS/CRM) ve Commerce OS **consume** eder ([`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix; D3).
- **Tüketim yüzeyi:** yalnız **versioned command/API/event/outbox** (cross-write yasak, D3). Commerce OS BC'si `party_id`+role, tenant context, PDP kararı, assurance/session sinyalini **okur**; identity/tenant satırını **yazmaz**.
- **Regulated ayrım:** identity proofing'in KYC/AML **execution**'ı Commerce OS'ta değil (provider, D4); Commerce OS yalnız assurance selection/orchestration/evidence yapar.
- **CRM ayrım:** generic contact/lead/conversation platform-owned; Commerce OS import/copy **etmez** (D3) — bu lane'in en yüksek drift riski.

## Duplicate and authority notes

- **Party ↔ identity ayrı authority (fold DEĞİL):** `k-party` "kim ve hangi rolde?" (subject), `k-identity` "login doğrulandı mı?" (authn) — ayrı 6-tuple, ayrı owner; `C-5B-02` (authn) ve `C-5B-05` (party graph) fold edilmez ([`actor-party-contract`](./actor-party-contract.md) §3; [`ontology`](./enterprise-saas-capability-ontology.md) §Duplicate).
- **Tenancy tek authority, üç outcome:** `C-5B-06` (isolation), `C-5B-07` (region/key-ref), `C-5B-08` (quota) hepsi platform **tenancy** yüzeyini okur; outcome'lar ayrık, cross-write yok → duplicate ownership değil ([`ontology`](./enterprise-saas-capability-ontology.md) §Ownership).
- **CRM ≠ Commerce OS domain party:** `C-5B-10` generic CRM platform-owned; Commerce OS'un "buyer/seller" kavramı `party_role`'e referanstır, ayrı CRM module **AÇILMAZ** ve CRM Commerce OS'a kopyalanmaz (D3).
- **Ambiguous authority = unresolved (icat yasak):** `C-5B-01/03/04/07/08/09/11` owner veya lifecycle contract'ta net olmadığı için `unresolved`+`blocker`; canonical owner/lifecycle **uydurulmaz** ([`../AGENTS.md`](../AGENTS.md) §4.4).
- **Cross-tenant leak negative oracle zorunlu:** `C-5B-06` ve `C-5B-09`'da açık negatif leak oracle'ı taşınır ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §probes cross-tenant leak).
- **No module promotion:** 11 adayın hiçbiri app/module/BC düğümü açmaz; her biri paylaşılan platform/kernel authority'sine referans verir.

## Red to green checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (7, sırayla) | AUTO (metin taraması) | 7/7 mevcut, sırada — reviewer/CI teyidine açık |
| Aday satır ≥ 9 | AUTO | 11 aday (`C-5B-01…11`) |
| Her satır 11 alan **veya** `unresolved`+`blocker` | AUTO/MANUAL | tüm satırlar 11 alan; `unresolved` (01/03/04/07/08/09/11) blocker taşır |
| Cross-tenant leak negative oracle zorunlu | AUTO | `C-5B-06`/`C-5B-09` + §notes'ta yazılı |
| Ambiguous authority → unresolved | AUTO | machine/delegated-lifecycle/region/quota/cross-org/session belirsiz → `unresolved` |
| Sadece 2 sıralı iş (A5B, V5B), paralel iddia yok | AUTO | Execution record: 2/2 sequential |
| Platform-owned canonical; Commerce OS consumer-only | AUTO/MANUAL | her satır owner=platform/kernel; §Commerce OS consumption profile |
| Generic CRM Commerce OS'a kopyalanmaz | AUTO | `C-5B-10` + §notes no-CRM-copy |
| D3/D5 birebir; owner/authority uydurma yok | AUTO/MANUAL | D3 authority listesi + D5 pilot residual iletilen insan kararından |
| Shared authority referansla (kopya yok) | AUTO/MANUAL | k-identity/k-party/k-tenancy/authz/entitlement/KMS consume; reimplement yok |
| No module/app creation | AUTO | §notes "No module promotion"; TaskNode alanı/level/faz icat edilmedi |
| In-branch relative link target | MANUAL/CHANGESET | tüm link repo-relative; hedef Glob ile doğrulandı; Codex teyidine açık |
| Claim (kanıtsız "tamam/GA") | AUTO | negatif oracle/drill kanıtı bekler; GA iddiası yok |
| Line budget ≤ 220 | AUTO | bu dosya ≤ 220 satır |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** (kapsam dışı).

## Lane decision

- Bu çıktı **Phase 5B identity/tenant/org candidate completeness matrisidir**; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve implementasyon/baseline kanıtı değildir.
- 11 aday üretildi; identity/tenant/org yüzeyinin **kanonik kayıt sahibi platform/kernel** olarak işaretlendi, Commerce OS **consumer-only** — hiçbir satırda Commerce OS canonical record sahibi yapılmadı (D3 birebir).
- Owner/authority veya lifecycle belirsiz olanlar (machine identity, delegated-admin lifecycle, region/residency, quota, cross-org sharing, session/device trust) `unresolved`+`blocker` bırakıldı — canonical owner **uydurulmadı**, promote edilmedi.
- Cross-tenant leak **negative oracle zorunluluğu** karşılandı (`C-5B-06`/`C-5B-09`); generic CRM (contact/lead/conversation) Commerce OS'a **kopyalanmadı**; regulated KYC/AML execution provider'a (D4) bırakıldı.
- Stop-gate ihlali: **yok** (sayı hedefi yapılmadı; identity/tenant kaydı Commerce OS-owned yapılmadı; cross-write yazılmadı; CRM kopyalanmadı; app/module açılmadı).
- Yazılan tek izinli dosya: `docs/enterprise-saas-phase-5b-identity-tenant-org-candidates.md`. Diğer 5A–5H shard'ları, Faz 0–4 kanonu ve sibling worktree **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 5B GO/NO-GO ve kalan dalgalar → Codex'e ait.** Bu worker 5B candidate matrisini üretti ve **durur**; Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.
