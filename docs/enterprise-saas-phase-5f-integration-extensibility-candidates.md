# Enterprise SaaS — Phase 5F Integration/Extensibility Candidate Completeness Matrix

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 5F (integration/extensibility candidate completeness). Faz 4.5 D3 (platform vs Commerce OS authority tahsisi) + D6 (build/buy/provider + bağlamlı SLO/COGS bütçesi) CLOSED çerçevesinde açıldı ([`ledger`](./enterprise-saas-human-decision-queue.md) §Newly closed decisions). Bu **onaylanabilir candidate set / domain-completeness** dokümanıdır; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 5).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **aday tamlık matrisidir** (integration/extensibility yüzeyi), requirement listesi/backlog/connector-metni/schema değildir. **Kritik invariant:** API/GraphQL runtime, event/outbox/webhook delivery runtime, extension/plugin sandbox runtime, provider-adapter binding runtime, quota/rate-limit ve versiyon-uyum kernel primitifi **platform/kernel + shared infra owned**'dır; Commerce OS **core 7 BC** yalnız **provider-neutral domain port sözleşmesini, domain event/command kontratını, policy/reconciliation'ı, import/export mapping'ini ve extension governance'ı** tanımlar — provider'ın canonical verisini veya execution'ını **tanımlamaz/sahiplenmez** ([`ledger`](./enterprise-saas-human-decision-queue.md) D3/D6; [`composition`](./enterprise-saas-product-family-composition.md) §Shared versus owned matrix, §Build/buy split; [`k-provider-adapter`](./k-provider-adapter-directive.md); [`app-distribution`](./app-distribution-contract.md)). Cross-context write yok; erişim yalnız **versioned command/API/event/outbox/webhook/connector/import-export** sözleşmesi ([`ontology`](./enterprise-saas-capability-ontology.md) §Dependency). **Provider asla canonical authority değildir; her provider portability/export/replay/reconciliation/degraded-mode/circuit-breaker/exit drill ister** (D6). Owner/authority belirsizse satır `unresolved`; drill/attestation gereken satır (provider exit · plugin exfiltration · replay) `passed` işaretlenemez. **Enterprise-ready/GA iddiası yok** (D5). **Hiçbir provider/vendor adı requirement DEĞİLDİR** ([`ontology`](./enterprise-saas-capability-ontology.md) §provider). Hiçbir aday app/module/BC düğümüne terfi ETMEZ ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). Bu nedenle **2 iş SIRALI** yürütüldü; **paralellik/sub-agent iddiası yok**. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **2/2** · Mod: **sequential (mechanism unavailable)** · READ-ONLY analiz + tek yazar.
- Girdi/HEAD: branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon (salt-okunur) [`../AGENTS.md`](../AGENTS.md), [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md), [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md), [`ledger`](./enterprise-saas-human-decision-queue.md) (D3/D6), [`composition`](./enterprise-saas-product-family-composition.md), [`constitution`](./enterprise-saas-requirement-constitution.md), [`ontology`](./enterprise-saas-capability-ontology.md), [`app-distribution`](./app-distribution-contract.md), [`k-provider-adapter`](./k-provider-adapter-directive.md), [`event-replay`](./event-replay-projection-contract.md), [`bus-outbox-gap`](./k-bus-event-outbox-readiness-gap-2026-07-09.md), [`pr04-event-outbox`](./platform-pr04-event-outbox-agent-pack-2026-07-09.md), [`pr10-sdk-contract`](./platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md), [`entitlement`](./capability-entitlement-contract.md), [`bc-map`](./commerce-os-bounded-context-map.md), [`adr-0030`](./adr-0030-commerce-operating-system-boundary.md).

| # | İş | Tür | Kapsam | Yerleştiği bölüm |
|---|---|---|---|---|
| A5F | integration/extensibility analyst | analyst | 12 aday: API contract/versioning/idempotency, event/outbox/webhook delivery/replay, provider-neutral port/adapter, provider registration/health/circuit-breaker, extension sandbox/permission, plugin supply-chain/exfiltration, quota/rate-limit, compatibility/deprecation, connector observability, import/export mapping, provider portability/exit/degraded-mode, extension governance/admin-UI injection boundary | Candidate completeness matrix |
| V5F | integration/extensibility reviewer | reviewer | authority/dedup/fold, platform runtime owner vs Commerce OS provider-neutral port tüketici, 3 zorunlu oracle (provider exit · plugin exfiltration · replay/idempotency), provisional BC promotion re-pass/demote, ambiguous→unresolved, no vendor-as-requirement, no GA claim, no cross-write, no module promotion, link/field/claim | Port and extension authority profile · Provisional BC promotion tests · Red to green checks |

Sıra: **A5F → V5F** (sıralı, aynı dosya). İki iş de aynı tek dosyaya yazdı; başka lane'e paralel yazım yok.

## Lane boundary

- **scope:** integration/extensibility yüzeyinin candidate completeness'ı — platform API/event/outbox/webhook/plugin-sandbox/provider-adapter **runtime'ının** authority sınırı ve Commerce OS core-7-BC'nin **provider-neutral port + domain kontrat + policy/reconciliation + extension governance** rolü. owner/authority/lifecycle/riskTier/testOracle belirsizse `unresolved`; drill/attestation gerektiren satır (provider exit/plugin exfiltration/replay) `passed` olamaz.
- **inputs:** yukarıdaki kanon; D3 authority tahsisi + D6 build/buy/provider + provider-neutral port/exit-drill zorunluluğu **bağlayıcı insan kararı** ([`ledger`](./enterprise-saas-human-decision-queue.md)).
- **allowed-files:** yalnız `docs/enterprise-saas-phase-5f-integration-extensibility-candidates.md`. Başka dosya, JSON/node/schema/gate/kod/test yok.
- **non-goals:** requirement/backlog/module/app üretmek; API/event/outbox/webhook/plugin-sandbox/provider-adapter **runtime primitifini** yeniden yazmak veya Commerce OS-owned yapmak; `k-provider-adapter`/`event-replay`/`app-distribution` sözleşme metnini **kopyalamak**; provider/vendor adını **requirement** yapmak; provider'ı canonical veri/execution otoritesi yapmak; provider exit/plugin exfiltration/replay drill'ini **koşmuş** saymak; `passed`/`enterprise-ready`/`GA` iddiası; concrete provider/connector/quota **uydurmak**; module terfisi; cross-context write.
- **checks:** §Red to green checks (deterministik metin/link taraması; otomatik gate yoksa `MANUAL/CHANGESET`).
- **output:** ≥10 aday satır + **3 zorunlu oracle** (provider exit · plugin exfiltration · replay/idempotency) + port/extension authority profili + provisional BC promotion testi + red/green.
- **blockers:** import/export mapping authority (Commerce OS domain vs platform data) + PII/residency scope; extension admin-UI injection boundary owner + review authority; quota-authority ile 5A metering sınırı — contract'ta net owner/lifecycle yok → `unresolved` (blocker alanında).

## Candidate completeness matrix

Alan sözleşmesi (her aday): `candidateId · outcome · owner · dataAuthority · lifecycleAuthority · scopeClass · riskTier · testOracle · evidenceExpected · status · blocker` ([`constitution`](./enterprise-saas-requirement-constitution.md) §Candidate record contract). scopeClass 14-sınıf sözlüğü [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §1. Bir alan çözülemezse satır `unresolved` + `blocker`. Integration/extension primitifleri owner=platform/kernel; Commerce OS domain kaydı provider-neutral port/event kontratını tanımlar fakat runtime'ı **tüketir**, kopyalamaz.

| candidateId | scopeClass | riskTier | status |
|---|---|---|---|
| `C-5F-01-api-contract-versioning-idempotency` | integration/protocol | high | candidate |
| `C-5F-02-event-outbox-webhook-delivery-replay` | platform capability (consumed) | high | candidate |
| `C-5F-03-provider-neutral-port-adapter` | integration/protocol | high | candidate |
| `C-5F-04-provider-registration-health-circuit-breaker` | platform capability (consumed) | high | candidate |
| `C-5F-05-extension-sandbox-permission` | platform capability (consumed) | critical | candidate |
| `C-5F-06-plugin-supply-chain-exfiltration` | platform capability (consumed) | critical | candidate |
| `C-5F-07-quota-rate-limit` | NFR | high | unresolved |
| `C-5F-08-compatibility-versioning-deprecation` | policy | high | candidate |
| `C-5F-09-connector-observability` | platform capability (consumed) | medium | candidate |
| `C-5F-10-import-export-mapping` | integration/protocol | high | unresolved |
| `C-5F-11-provider-portability-exit-degraded-mode` | integration/protocol | high | candidate |
| `C-5F-12-extension-governance-admin-ui-injection-boundary` | policy | high | unresolved |

Detaylı alanlar (aynı authority'yi referansla, kopyalamaz):

**`C-5F-01-api-contract-versioning-idempotency`**
- outcome: Core-7-BC dış yüzeyi **versioned API/command kontratı**: her mutating komut idempotency-key taşır, aynı anahtar tek etki üretir; kontrat kırılmadan geriye-uyumlu evrilir ([`pr10-sdk-contract`](./platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md); [`event-replay`](./event-replay-projection-contract.md) §6). API runtime platform; kontrat **objesi** Commerce OS domain.
- owner: platform API/SDK runtime (aday) + Commerce OS domain command kontratı · dataAuthority: platform API/idempotency-store · lifecycleAuthority: API kontrat versiyon lifecycle (insan-onaylı)
- testOracle: contract/idempotency — aynı idempotency-key ile tekrar isteği çift etki üretmez; kontratsız/versiyonsuz yüzey `validated` olamaz (MANUAL) · evidenceExpected: idempotency replay testi + kontrat versiyon matrisi
- blocker: yok (yaklaşım net); per-BC command şeması item-level residual, uydurulmaz.

**`C-5F-02-event-outbox-webhook-delivery-replay`**
- outcome: Domain olayları outbox üzerinden **at-least-once** teslim; consumer `event_id` ile idempotent tekilleştirir; webhook dış teslimde retry+DLQ; replay/rebuild `policy_version` ile deterministik ([`event-replay`](./event-replay-projection-contract.md) §4/§6; [`pr04-event-outbox`](./platform-pr04-event-outbox-agent-pack-2026-07-09.md); [`bus-outbox-gap`](./k-bus-event-outbox-readiness-gap-2026-07-09.md)). Runtime platform; event kontratı Commerce OS domain.
- owner: platform event/outbox/webhook runtime (`k-bus`) · dataAuthority: platform event/outbox/DLQ store · lifecycleAuthority: event kontrat/replay lifecycle
- testOracle: **zorunlu — replay/idempotency:** at-least-once teslimde duplicate `event_id` tek projeksiyon etkisi; replay `policy_version` ile deterministik; poison olay DLQ'ya düşer, sessiz kayıp yok ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 13) · evidenceExpected: duplicate-delivery + replay determinism + DLQ testi
- blocker: yok (event runtime=platform authority, D3); readiness gap açık ([`bus-outbox-gap`](./k-bus-event-outbox-readiness-gap-2026-07-09.md)) — hazır iddiası değil.

**`C-5F-03-provider-neutral-port-adapter`**
- outcome: Domain **provider-neutral port** tanımlar (capability sınıfı + alt-özellik pazarlığı); somut provider adapter'a bağlanır; provider-özel exception domain'e sızmaz, standart port hatasına normalize edilir ([`k-provider-adapter`](./k-provider-adapter-directive.md) §7). Port **objesi** Commerce OS domain (D6 build); adapter runtime platform.
- owner: Commerce OS provider-port sahibi (provider-neutral) + platform adapter runtime · dataAuthority: platform provider-binding/capability-map · lifecycleAuthority: port kontrat + binding lifecycle
- testOracle: contract — provider binding değişince domain kodu değişmez; desteklenmeyen alt-özellikte `CapabilityUnavailableError`, sessiz düşürme yok (MANUAL) · evidenceExpected: provider-swap kontrat testi + capability-negotiation testi
- blocker: yok (provider-neutral port bağlayıcı, D6); vendor adı requirement DEĞİL.

**`C-5F-04-provider-registration-health-circuit-breaker`**
- outcome: Provider kayıt/çözümleme: health probu, `circuit_state` (closed/open/half_open), threshold-üstü hatada fallback zinciri (idempotent), audit'li binding değişimi ([`k-provider-adapter`](./k-provider-adapter-directive.md) §5/§7). Sağlık kontrolü worker'da (scale-invariant), istek yolunda değil.
- owner: platform provider-adapter runtime (`k-provider-adapter`) · dataAuthority: platform provider-binding/health store · lifecycleAuthority: binding/circuit lifecycle (eşik değişimi insan-onaylı)
- testOracle: contract/negative — art arda hata `circuit_state=open` yapar ve fallback tetikler; non-idempotent yetenekte idempotency-key olmadan fallback çift-etki üretmez; tüm zincir açıksa `ProviderUnavailableError` (MANUAL) · evidenceExpected: circuit-breaker + fallback idempotency testi
- blocker: yok (adapter runtime=platform authority); concrete provider/eşik uydurulmaz.

**`C-5F-05-extension-sandbox-permission`**
- outcome: Extension/plugin **sandbox** içinde çalışır; yalnız manifest'te **beyan edilen capability/permission scope**'a erişir; beyan-dışı primitif/tenant erişimi fail-closed reddedilir ([`app-distribution`](./app-distribution-contract.md) §2.3/§4; [`entitlement`](./capability-entitlement-contract.md)). Runtime platform (`k-plugin`); governance objesi Commerce OS.
- owner: platform extension/plugin runtime (`k-plugin`) · dataAuthority: platform plugin-manifest/permission store · lifecycleAuthority: plugin install/activate lifecycle
- testOracle: negative — extension beyan-dışı capability çağırırsa PDP fail-closed reddeder; cross-tenant primitif erişimi engellenir (MANUAL) · evidenceExpected: sandbox permission negatif suite + beyan-vs-kullanım denetimi
- blocker: yok (extension runtime=platform authority, D3); item-level permission taksonomisi residual.

**`C-5F-06-plugin-supply-chain-exfiltration`**
- outcome: Plugin tedarik-zinciri güveni + veri-sızıntı savunması: imzalı/attested artefakt (provenance/SBOM), imzasız/doğrulanmamış plugin reddedilir; sandbox yetkisiz egress ve cross-tenant okumayı engeller; audit'te secret **değeri** değil `secret_ref` ([`app-distribution`](./app-distribution-contract.md) §7; [`k-provider-adapter`](./k-provider-adapter-directive.md) §Audit).
- owner: platform extension runtime + supply-chain/security (aday) · dataAuthority: platform plugin-provenance/attestation store · lifecycleAuthority: plugin doğrulama/revocation lifecycle
- testOracle: **zorunlu — plugin exfiltration:** imzasız/tamper plugin reddedilir; sandbox içinden yetkisiz veri egress'i / cross-tenant read bloklanır; sızıntı denemesi audit + fail-closed ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 6) · evidenceExpected: provenance/imza doğrulama + egress/cross-tenant exfiltration negatif drill
- blocker: yok (yaklaşım net); gerçek exfiltration drill Faz 6 residual, `passed` uydurulmaz.

**`C-5F-07-quota-rate-limit`**
- outcome: Per-tenant + per-connector kota/rate-limit: fair-use, over-limit throttle (sessiz drop değil), retry-after; scale-invariant zarf ([`k-provider-adapter`](./k-provider-adapter-directive.md) §5 `limits`; 5E noisy-neighbor ile hizalı). Metering/billing ile sınır 5A.
- owner: **belirsiz** — tenant-izolasyon bütçesi + quota **policy** platform **tenancy**'e ait (5E `C-5E-03`, D3), fakat jenerik **rate-limit runtime + teknik store item-level owner** (integration runtime mı tenancy mi) contract'ta tekil değil · dataAuthority: **belirsiz** — jenerik rate-limit runtime/teknik store item-level authority net değil · lifecycleAuthority: **belirsiz**
- testOracle: negative — kota aşımı fail-closed throttle + retry-after döndürür, sessiz drop yok; bir connector kotası komşu tenant'ı bozamaz (MANUAL) · evidenceExpected: rate-limit throttle + fair-use izolasyon testi
- blocker: **jenerik rate-limit runtime/teknik store item-level owner** contract'ta tekil değil → `unresolved`; tenant-izolasyon/quota **policy** owner (platform tenancy, D3) ayrıktır ve **ikinci owner icat edilmez**; metering/billing muhasebe sınırı 5A `C-5A-06/07` ile cross-ref, concrete quota **uydurulmaz**.

**`C-5F-08-compatibility-versioning-deprecation`**
- outcome: Uyumluluk/deprecation: kırıcı değişim → yeni sürüm + deprecation penceresi + **etkilenen-consumer matrisi**; `kernel_range` dışı app kurulmaz/başlamaz; app kendi semver'i kernel'den bağımsız ([`app-distribution`](./app-distribution-contract.md) §6; [`pr10-sdk-contract`](./platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md)).
- owner: platform kernel versiyon kontratı + Commerce OS API deprecation policy · dataAuthority: platform version/compat-matrix · lifecycleAuthority: version/deprecation lifecycle (MAJOR insan-onaylı)
- testOracle: contract — kırıcı değişim yeni sürüm + deprecation penceresi olmadan yayınlanamaz; `kernel_range` mismatch deploy-zamanı bloklar (MANUAL/CHANGESET) · evidenceExpected: compat-matris + deprecation-window kaydı + kernel_range kontrolü
- blocker: yok (version kontratı=kernel authority); concrete deprecation süresi item-level residual.

**`C-5F-09-connector-observability`**
- outcome: Connector/integration gözlemlenebilirliği: metrics + trace/correlation-id propagation + structured log (PII masking); connector hatası yüzeye çıkar, sessiz yutulmaz. Primitif platform observability (5E `C-5E-08` ile hizalı), Commerce OS **tüketir**.
- owner: platform observability (`platform-observability`) + Commerce OS connector kaydı · dataAuthority: platform metrics/trace/log store · lifecycleAuthority: platform observability lifecycle
- testOracle: contract — connector çağrısı trace/correlation-id yayar, hata alert'e düşer; log PII masking'siz alan sızdırmaz (MANUAL) · evidenceExpected: connector trace/metrics smoke + PII-masking log testi
- blocker: yok (observability=platform authority); Commerce OS-owned yapılmaz, primitif tüketilir.

**`C-5F-10-import-export-mapping`**
- outcome: İçe/dışa aktarım eşleme: canonical kimlik/semantik-koruyan round-trip export→import; eşleme hataları raporlanır, sessiz düşürülmez; tenant portability ile hizalı (D5 export/portability). Mapping authority (Commerce OS domain vs platform data) + PII/residency scope net değil.
- owner: Commerce OS domain (mapping objesi) + platform data/portability (aday) · dataAuthority: **belirsiz** — import/export mapping + PII/residency scope authority net değil · lifecycleAuthority: **belirsiz**
- testOracle: contract/migration — export→import round-trip canonical kimliği korur; eşlenemeyen alan hata olarak raporlanır, sessiz veri kaybı RED ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 11) · evidenceExpected: round-trip export/import + mapping-error raporu
- blocker: **mapping authority + PII/residency scope** contract'ta net değil → `unresolved`; concrete mapping/scope uydurulmaz.

**`C-5F-11-provider-portability-exit-degraded-mode`**
- outcome: Provider portability/exit/degraded-mode: outage'ta circuit-breaker + degraded-mode fallback; **exit/portability drill** ile canonical veri korunur (replay/reconciliation), provider kilitlemesi yok; provider asla canonical authority değil ([`k-provider-adapter`](./k-provider-adapter-directive.md) §7; D6). 5E `C-5E-12` reliability lensiyle hizalı (fold DEĞİL).
- owner: Commerce OS provider-port sahibi + platform integration (aday) · dataAuthority: platform provider-adapter/reconciliation kaydı · lifecycleAuthority: provider integration/exit lifecycle
- testOracle: **zorunlu — provider outage / exit:** outage'ta circuit-breaker + degraded-mode; exit'te portability/replay/reconciliation ile canonical veri korunur, provider lock-in yok ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §probe 3) · evidenceExpected: provider outage + exit/portability/reconciliation drill logu
- blocker: yok (provider-neutral port + exit drill bağlayıcı, D6); her provider için gerçek exit drill residual, `passed` uydurulmaz.

**`C-5F-12-extension-governance-admin-ui-injection-boundary`**
- outcome: Extension governance + **admin/UI injection boundary**: extension UI/hook enjeksiyonu PDP-gated, tenant-scoped, cross-tenant okuma/yetki-yükseltme yapamaz; install/approve/review lifecycle. Injection boundary owner (platform extension governance vs Commerce OS admin) + review authority net değil.
- owner: platform extension governance + Commerce OS admin (aday) · dataAuthority: **belirsiz** — UI-injection boundary + review scope authority net değil · lifecycleAuthority: **belirsiz**
- testOracle: negative — enjekte extension UI cross-tenant veri gösteremez / yetki yükseltemez; onaysız extension aktive edilemez (MANUAL) · evidenceExpected: injection-boundary negatif suite + approval/review izi
- blocker: **admin-UI injection boundary owner + review authority** contract'ta net değil → `unresolved`; concrete boundary/matris uydurulmaz.

## Port and extension authority profile

- **Commerce OS owns (D3/D6 build):** provider-neutral domain **port kontratı**, domain event/command kontratı, policy/orchestration, reconciliation, import/export mapping **objesi**, extension governance kararı — hepsi core-7-BC otoritesi içinde, tek-writer ([`composition`](./enterprise-saas-product-family-composition.md) §Build/buy split; [`bc-map`](./commerce-os-bounded-context-map.md)).
- **Platform/kernel owns (consumed):** API/SDK runtime, event/outbox/webhook delivery runtime, extension/plugin **sandbox runtime**, provider-adapter binding/health/circuit runtime, quota/rate-limit, versiyon-uyum kernel primitifi — Commerce OS bunları **tüketir**, yeniden yazmaz/kopyalamaz ([`ledger`](./enterprise-saas-human-decision-queue.md) D3; [`app-distribution`](./app-distribution-contract.md)).
- **Provider (buy) — never canonical:** payment execution, KYC/AML, tax, e-doc/e-sign, comms, geo, fraud, CDN/object/observability infra dış lisanslı **entegrasyondur**; provider'ın verisi/execution'ı canonical DEĞİL; **her provider portability/export/replay/reconciliation/degraded-mode/circuit-breaker/exit drill ister** (D6). **Vendor adı requirement değildir** ([`ontology`](./enterprise-saas-capability-ontology.md) §provider).
- **Drill/attestation-bekleyen satırlar `passed` değil:** provider exit (`C-5F-11`), plugin exfiltration (`C-5F-06`), replay/idempotency (`C-5F-02`) gerçek drill/attestation ister; bu belge hiçbirini `passed`/`validated` işaretlemez.

## Provisional BC promotion tests

Integration/extensibility lensinden ilgili provisional BC'ler (`*`) tekil `owner`/`dataAuthority`/`lifecycleAuthority`/independent-policy testine sokuldu; connector/adapter yüzeyi **BC değil platform integration/extension runtime tüketimidir** ([`composition`](./enterprise-saas-product-family-composition.md) §Commerce OS Card; [`ledger`](./enterprise-saas-human-decision-queue.md) D3).

| Provisional BC (integration lensi) | Independent-policy testi | Sonuç |
|---|---|---|
| Channel* | Kanal-sync yalnız connector/adapter mı, yoksa Catalog/Offer'dan bağımsız kanal-policy/lifecycle mi? | Connector kısmı → **DEMOTE** platform integration runtime; bağımsız policy kanıtsız → provisional/`unresolved` |
| Supplier* | Supplier onboarding EDI/connector mı, yoksa Inventory'den bağımsız supplier-master/lifecycle mi? | Integration yüzeyi → **DEMOTE** platform integration/extension; master/lifecycle 5C data lensi (cross-ref, fold DEĞİL) |
| Marketplace | Seller webhook/connector yüzeyi ayrı BC mi, yoksa event/outbox+extension runtime tüketimi mi? | Integration yüzeyi → **DEMOTE** platform event/plugin runtime; marketplace governance BC adaylığı ayrı lens, integration burada module açmaz |

Sonuç: integration/extensibility lensinde **hiçbir provisional BC yeni module/BC düğümü açmaz**; connector/webhook/adapter yüzeyi platform runtime'a demote edilir, domain-policy yüzeyi ilgili owning lane'e cross-ref edilir. Bağımsız-policy kanıtı olmayan kalemler `unresolved`/provisional bırakılır — canonical owner **uydurulmaz** ([`../AGENTS.md`](../AGENTS.md) §4.4).

## Red to green checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (7, sırayla) | AUTO (metin taraması) | 7/7 mevcut, sırada — reviewer/CI teyidine açık |
| Aday satır ≥ 10 | AUTO | 12 aday (`C-5F-01…12`) |
| Her satır 11 alan **veya** `unresolved`+`blocker` | AUTO/MANUAL | tüm satırlar 11 alan; `unresolved` (07/10/12) blocker taşır |
| Zorunlu provider-exit oracle | AUTO | `C-5F-11` (circuit-breaker, degraded-mode, exit/portability/reconciliation, no lock-in) |
| Zorunlu plugin-exfiltration oracle | AUTO | `C-5F-06` (imza/provenance, sandbox egress/cross-tenant block, fail-closed) |
| Zorunlu replay/idempotency oracle | AUTO | `C-5F-02` (at-least-once + idempotent `event_id`, deterministik replay, DLQ) |
| Provisional BC promotion re-pass/demote | AUTO/MANUAL | §Provisional BC promotion tests: Channel/Supplier/Marketplace integration yüzeyi DEMOTE; module açılmadı |
| No vendor/provider as requirement | AUTO | provider = build/buy entegrasyonu; vendor adı requirement yapılmadı ([`ontology`](./enterprise-saas-capability-ontology.md) §provider) |
| Provider never canonical authority | AUTO/MANUAL | §Port authority profile: her provider exit/portability drill; canonical değil (D6) |
| Ambiguous authority → unresolved | AUTO | jenerik rate-limit runtime/store item-level owner (`C-5F-07`), import/export mapping+PII scope, admin-UI injection boundary → `unresolved` |
| Drill/attestation satırı `passed` DEĞİL | AUTO/MANUAL | provider-exit/plugin-exfiltration/replay `passed` işaretlenmedi |
| Enterprise-ready/GA iddiası yok | AUTO | drill/attestation bekler; "enterprise-ready/GA" iddiası yok (D5) |
| Platform runtime tüketilir, owned değil | AUTO/MANUAL | §matrix owner=platform/kernel; Commerce OS port/kontrat tüketici; cross-write yok (D3) |
| Sadece 2 sıralı iş (A5F, V5F), paralel iddia yok | AUTO | Execution record: 2/2 sequential |
| No module/app creation | AUTO | §Provisional BC "no module"; TaskNode alanı/level/faz icat edilmedi |
| In-branch relative link target | MANUAL/CHANGESET | tüm link repo-relative; hedef Glob/Read ile doğrulandı; Codex teyidine açık |
| Line budget ≤ 220 | AUTO | bu dosya ≤ 220 satır |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** (kapsam dışı).

## Lane decision

- Bu çıktı **Phase 5F integration/extensibility candidate completeness matrisidir**; requirement/backlog/node/app/module/queue/schema/gate/kod/test DEĞİL ve implementasyon/baseline/attestation kanıtı değildir.
- 12 aday üretildi; API/event/outbox/webhook/plugin-sandbox/provider-adapter/quota/version-compat **runtime primitifleri platform + kernel owned**, Commerce OS core-7-BC yalnız **provider-neutral port + domain event/command kontratı + policy/reconciliation + import/export mapping + extension governance** tanımlar ve runtime'ı **tüketir** — hiçbir primitif Commerce OS-owned yapılmadı (D3 birebir), cross-write yazılmadı.
- Owner/authority belirsiz olanlar (jenerik rate-limit runtime/store item-level owner — tenant-izolasyon/quota **policy** platform tenancy'e ait, D3/5E `C-5E-03`, ikinci owner icat edilmedi; import/export mapping + PII/residency scope; admin-UI injection boundary + review authority) `unresolved`+`blocker` bırakıldı — canonical owner, concrete mapping/boundary **uydurulmadı**, promote edilmedi.
- **3 zorunlu oracle** karşılandı: provider exit (`C-5F-11`), plugin exfiltration (`C-5F-06`), replay/idempotency (`C-5F-02`).
- **Provider asla canonical authority değil; vendor adı requirement değil** (D6; [`ontology`](./enterprise-saas-capability-ontology.md) §provider); provisional BC integration yüzeyi platform runtime'a demote edildi, module açılmadı; drill-bekleyen satırlar `passed` işaretlenmedi; enterprise-ready/GA iddiası yapılmadı (D5).
- Stop-gate ihlali: **yok** (sayı hedefi yapılmadı; integration/extension runtime primitifi Commerce OS-owned yapılmadı; cross-write/primitif kopyası yok; app/module açılmadı; provider/connector/quota uydurulmadı; drill `passed` denmedi; vendor requirement yapılmadı).
- Yazılan tek izinli dosya: `docs/enterprise-saas-phase-5f-integration-extensibility-candidates.md`. Diğer 5A–5H shard'ları, kanon dokümanlar ve sibling worktree **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **Faz 5F GO/NO-GO ve kalan dalgalar → Codex'e ait.** Bu worker 5F candidate matrisini üretti ve **durur**; Codex bağımsız doğrulamadan bu çıktı tamamlanmış sayılmaz.
