# Enterprise SaaS — Source Claim Normalization Matrix (Phase 1)

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 1 (kaynak iddia normalizasyonu). Faz 0 girdilerine ve iki untracked girdiye dokunulmadı; Faz 2'ye geçilmez.
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> **Araştırma metni KANONİK DEĞİLDİR.** Kaynak ([`pasted-text`], Faz 0'da import edilen 2 doc) bir aday
> capability sözlüğüdür; requirement, backlog, node, app veya module değildir. Bu matris **sınıflandırmadır**,
> backlog/node üretimi DEĞİLDİR. Hiçbir sayı otomatik hedeftir. Hiçbir vendor/protokol module'e terfi etmez.
> Prefix/aile disposition'ı **item kabulü değildir**; item-level triyaj sonraki (insan-onaylı) dalganın işidir.

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). Bu nedenle **16 iş
SIRALI** yürütüldü; paralellik/sub-agent iddiası yok. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

- Yürütülen iş sayısı: **16/16** · Mod: **sequential (mechanism unavailable)** · Analistler READ-ONLY.
- I0 (integration stub): fan-out öncesi `canonicalConcept + provisionalOwner` stub'ı; her kavram **tek** lane'e atandı.

| # | İş | Kapsam | Sonuç |
|---|---|---|---|
| I0 | integration stub | canonicalConcept + provisionalOwner ranges | aşağıdaki stub tablosu; her kavram tek lane |
| A1 | platform/kernel | L0, kernel-expansion aileleri | 19 satır sınıflandı |
| A2 | identity/tenant/org | L1–L3 | 4 satır; protokoller demote |
| A3 | metadata/workflow/automation | L4–L6, KX-Metadata | 4 satır |
| A4 | integration/data | L7, KX-Extension, Data Platform | 6 satır; MCP=protokol, Kafka/RabbitMQ=broker, iPaaS=vendor demote |
| A5 | AI | L8, KX-AI Core | 3 satır; infra vs governance ayrık |
| A6 | operations/governance/security | L16, L17, CL security/governance | 5 satır; release-strategy = policy |
| A7 | experience/collab/document/search/analytics/globalization | L9–L12, L18, L19, Notification | 7 satır |
| A8 | commerce/product-family/marketplace/developer | L13–L15, KX-Dev, 100-app, ECRM, framework attrs, vendor benchmarks | 9 satır; L13/L14 module'e terfi ETTİRİLMEDİ |
| V1 | class vocabulary | 14 sınıf sabiti uygulandı | tam |
| V2 | vendor/protocol demotion | Zapier/Make/n8n→provider(iPaaS); Kafka/RabbitMQ→provider(broker); REST/GraphQL/gRPC/SOAP/Webhooks/**MCP**→integration/protocol; 24 vendor-benchmark→research input | hiçbiri module değil |
| V3 | duplicate/alias | KX/ECRM/CL katmanları pyramid'e duplicateOf | ledger'de |
| V4 | repoMatch evidence | node + kanonik doc kanıtı | Repo matches §legend |
| V5 | count-claim rejection | tüm sayılar research-only | Rejected numeric targets |
| V6 | coverage completeness | CL, L0–L19, Notification, 100-app, ECRM, kernel-expansion, framework attrs | Source coverage index: 7/7 |
| V7 | allowed-files/links | tek dosya; relative link | Deterministic checks |

**I0 — canonicalConcept + provisionalOwner stub (her kavram tek lane):**

| Concept range | provisionalOwner | Lane |
|---|---|---|
| Foundation/kernel primitifleri | Platform Kernel | A1 |
| Identity/Tenant/Org | Identity·Tenant·Org Platform | A2 |
| Metadata/Workflow/Automation | Metadata·Workflow/ECA | A3 |
| Integration/Data/Extension | Integration Platform + EXT | A4 |
| AI infra + AI governance | AI Platform | A5 |
| Ops/Observability/Governance/Security | Operations·Governance | A6 |
| Collab/Doc/Search/Analytics/Notification/i18n/UX | Experience Platforms | A7 |
| Commerce/Marketplace/Developer/Product families | Commerce OS BC + Developer Platform | A8 |

## Classification vocabulary

Sınıf sözlüğü (sabit, tam 14): `platform capability | product-family/app | module/BC | archetype | feature |
workflow | policy | integration/protocol | provider | reporting surface | AI use-case | configuration/edition |
NFR | research input`.

Disposition (sabit, tam 8): `existing | partial | missing | conflicting | duplicate | uncertain | research-only |
provider-integration`.

`level`: `platform-primitive` (tüketilir, inşa edilmez) · `module` · `archetype` · `feature` · `policy/config` ·
`research`. Tekilleştirme anahtarı ad değil: `canonicalConcept + owner + dataAuthority + lifecycleAuthority +
consumer + outcome` ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §3).

## Source coverage index

Kaynağın her adlı ailesi ve numaralı bölümü kapsandı (V6). Sessiz düşürme yok; her leaf ilgili satırın
`normalizedName` hücresinde açıkça listelenir (gruplama yalnız tüm leaf'ler yazıldığında yapıldı).

| Kaynak bölümü | sourceId aralığı | Kapsandı |
|---|---|---|
| Capability-layer tablosu (15 katman + sayılar) | CL-* | ✔ (duplicate→pyramid) |
| Capability Pyramid L0–L19 | L0…L19 | ✔ 20/20 |
| Notification alt-capability (20 leaf) | NP | ✔ |
| Kernel-expansion aileleri (26 alt-platform) | KX-* | ✔ (çoğu duplicate) |
| 100-app / ürün-aileleri (CRM…RPA…) | PF | ✔ (research-only) |
| ECRM referans-model iskeleti (L0 Platform…L7 SCM…) | EC | ✔ (duplicate) |
| Per-capability framework attributes (Amaç…KPIs) | FR | ✔ (research-only) |
| Vendor/benchmark adları (SAP, Salesforce, … Atlassian Platform; 24 ad) | VEND | ✔ (research-only, module değil) |
| Tüm sayısal iddialar | NUM (Rejected §) | ✔ (research-only) |

## Normalized decision matrix

`sourceId | normalizedName (leaf'ler açık) | class | level | probableOwner | duplicateOf | repoMatch | confidence | disposition`.
repoMatch = Repo matches §legend anahtarı. duplicateOf = başka sourceId veya `—`.

| sourceId | normalizedName (leaves) | class | level | probableOwner | duplicateOf | repoMatch | conf | disposition |
|---|---|---|---|---|---|---|---|---|
| L0 | Foundation: Runtime, Configuration, DI, Plugin Loader, Event Bus, Command Bus, Query Bus, Scheduler, Queue, Background Jobs, Cache, Distributed Lock, Feature Registry, Capability Registry, Service Discovery, Secret Management, Environment Management, Health Checks, Startup Validation, Diagnostics, Observability Hooks | platform capability | platform-primitive | Platform Kernel | — | rm-kernel | M | partial |
| KX-runtime | Runtime, Service/Worker/Job/Plugin/AI/Event/Workflow/Script/Sandbox/Edge/Background/Queue Runtime | platform capability | platform-primitive | Platform Kernel | L0 | rm-kernel | M | duplicate |
| KX-config | Config, Global/Tenant/User/Environment/Runtime/Secret/Override Config, Config Validation/Versioning/History | platform capability | platform-primitive | Platform Kernel | L0 | rm-kernel | M | duplicate |
| KX-feature | Feature Flag, Kill Switch, Canary, Progressive Rollout, Experiment, Beta Program, Entitlement, Capability Toggle, License Feature | configuration/edition | policy/config | Platform Kernel | L16-rel, L13 | rm-ops | M | partial |
| KX-module | Module Registry/Loader/Installer/Updater/Marketplace/Dependencies/Version/Health/Isolation | platform capability | platform-primitive | Platform Kernel | L14 | rm-kernel | M | partial |
| KX-plugin | Plugin SDK/Registry/Sandbox/Permissions/Lifecycle/API/Versioning | platform capability | platform-primitive | Extension Runtime (EXT) | KX-ext | rm-integ | M | partial |
| KX-package | Package Registry/Manager/Repository/Version/Signing/Distribution | platform capability | platform-primitive | Platform Kernel | — | none | L | uncertain |
| KX-event | Event Bus (capability); **sub-feature/policy**: Event Registry, Domain/Internal/External Events, Event Replay, Dead Letter Queue, Event Subscription, Ordering, Versioning, Metadata | feature | feature | Platform Kernel (Event) | L0 | rm-event | M | partial |
| KX-command | Command Bus (cap); sub-feature: Command Registry/Validation/Retry/Audit | feature | feature | Platform Kernel | L0 | rm-kernel | M | partial |
| KX-query | Query Bus (cap); sub-feature: Projection, CQRS, Cached Query, Distributed Query | feature | feature | Platform Kernel | L0 | rm-kernel | M | partial |
| KX-scheduler | Scheduler (cap); sub-feature: Cron, Calendar/Retry Scheduler, Delayed/Priority Jobs | feature | feature | Platform Kernel | L0 | rm-kernel | M | duplicate |
| KX-queue | Queue (cap); sub-feature: Priority/Distributed/Retry/Delayed Queue, Dead Queue (=DLQ) | feature | feature | Platform Kernel | L0 | rm-kernel | M | duplicate |
| KX-cache | Cache (cap); sub-feature: Memory/HTTP/CDN/Distributed Cache; Redis Cache=provider | feature | feature | Platform Kernel | L0 | rm-kernel | M | duplicate |
| KX-resource | Asset, Resource, Media, Binary, Blob, CDN, Storage | platform capability | platform-primitive | Platform Kernel (Resource) | — | rm-kernel | L | partial |
| KX-storage | File/Object/Local/Cloud/Version/Archive Storage | platform capability | platform-primitive | Platform Kernel (Storage) | KX-resource | rm-kernel | L | duplicate |
| KX-licensing | License, Plan, Subscription, Entitlement, Usage Meter | configuration/edition | policy/config | Commerce/Entitlement | L13 | rm-commerce | M | duplicate |
| KX-logging | Structured/Audit/Security/AI/Business Logging | platform capability | platform-primitive | Operations·Observability | L16 | rm-ops | M | duplicate |
| KX-monitoring | Metrics, Health, Tracing, Alerts, Profiling | platform capability | platform-primitive | Operations·Observability | L16 | rm-ops | M | duplicate |
| KX-diagnostics | Self Test, Diagnostics, Support Bundle, Crash Dump | platform capability | platform-primitive | Operations·Observability | L0 | rm-ops | L | partial |
| L1-feat | Identity features: MFA, Passkey, WebAuthn, Device Fingerprinting, Risk Login, Conditional Access, Delegated Admin, Session Broker, Device Trust, Login Policies, Access Reviews, Machine Identity, API Identity, Secret Rotation | feature | feature | Identity Platform | — | rm-id | M | existing |
| L1-proto | Identity standards/protocols: SCIM, SAML, OAuth Provider, OAuth Client, OIDC, Identity Federation | integration/protocol | policy/config | Identity Platform | — | rm-id | M | provider-integration |
| L2 | Tenant: Provisioning, Migration, Backup, Restore, Cloning, Isolation, Region, Encryption Keys, Branding, Domains, Routing, Lifecycle, Quotas, Billing, Feature Policies | platform capability | platform-primitive | Tenant Platform | — | rm-tenant | H | existing |
| L3 | Organization, Company, Branch, Subsidiary, Division, Business Unit, Department, Team, Cost Center, Legal Entity, Matrix Organization, Cross Organization Sharing | platform capability | platform-primitive | Org Platform | — | rm-id | M | partial |
| L4 | Metadata: Dynamic Entity/Field/Relation/Validation/Workflow/Screen/API/Permission/Layout/Navigation/Search/Report | platform capability | platform-primitive | Metadata Platform | L5, L11, L12 | rm-meta | M | partial |
| KX-meta | Entity/Property/Metadata Registry, Metadata Validation/Versioning/Migration/API | platform capability | platform-primitive | Metadata Platform | L4 | rm-meta | M | duplicate |
| L5 | Workflow: BPMN, State Machine, Approval Engine, Escalation, SLA, Compensation, Saga, Human Tasks, Parallel Tasks, Event Driven Workflow, Long Running Workflow | workflow | feature | Workflow/ECA | — | rm-wf | M | partial |
| L6 | Automation: Rule Engine, Trigger Engine, Action Engine, Conditions, Time Based Automation, AI Automation, No-code Automation, Scheduled Automation, External Events | workflow | feature | Workflow/ECA | L5, L8 | rm-wf | M | partial |
| L7-proto | Integration protocols: API Gateway, GraphQL, REST, gRPC, SOAP, Webhooks, FTP, SFTP, Email Parser, ETL, CDC, Event Streaming | integration/protocol | policy/config | Integration Platform | — | rm-integ | M | partial |
| L7-broker | Message brokers (altyapı sağlayıcı seçimi): Kafka, RabbitMQ | provider | policy/config | Integration Platform | — | rm-integ | M | provider-integration |
| L7-mcp | MCP (Model Context Protocol) | integration/protocol | policy/config | Integration Platform | L8-infra | rm-integ | M | partial |
| L7-ipaas | iPaaS vendors: Zapier, Make, n8n | provider | policy/config | Integration Platform | — | rm-integ | M | provider-integration |
| KX-ext | Extensions, Connectors, Drivers, Adapters, Providers | platform capability | platform-primitive | Extension/Ports (EXT) | L7-proto | rm-integ | M | partial |
| DATA | Data Platform (katman adı; kaynak leaf saymaz) | platform capability | platform-primitive | Data Platform | L4 | rm-meta | L | uncertain |
| L8-infra | AI infra: LLM Router, Model/Prompt/Agent/Tool Registry, Prompt Versioning, Vector DB, Embeddings, Memory, RAG, MCP | platform capability | platform-primitive | AI Platform | — | rm-ai | M | partial |
| L8-gov | AI governance capabilities: AI Policies, AI Budget, AI Cost Tracking, AI Audit, AI Evaluation, Human Review, Safety Layer | policy | policy/config | AI Platform | — | rm-ai | M | partial |
| KX-ai | Prompt/Tool/Model/Agent/Memory Registry | platform capability | platform-primitive | AI Platform | L8-infra | rm-ai | M | duplicate |
| L16-obs | Ops observability: Monitoring, Alerting, Logging, Tracing, Profiling, Deployment | platform capability | platform-primitive | Operations·Observability | — | rm-ops | H | existing |
| L16-rel | Release strategies: Canary, Blue/Green, Feature Flags, Kill Switch | policy | policy/config | Operations (release) | KX-feature | rm-ops | M | partial |
| L17 | Governance: Policy Engine, Retention, Audit, Compliance, SoD, Data Classification, Data Residency, Legal Hold | policy | policy/config | Governance Platform | — | rm-gov | M | partial |
| CL-sec | CL layer: Identity & Security | research input | research | Identity·Governance | L1-feat, L17 | rm-id | L | duplicate |
| CL-gov | CL layer: Governance & Compliance | research input | research | Governance Platform | L17 | rm-gov | L | duplicate |
| L9 | Collaboration: Chat, Comments, Threads, Presence, Whiteboard, Shared Editing, Video, Audio, Notifications, Activity Feed | feature | feature | Collaboration | NP | rm-collab | L | partial |
| L10 | Document: OCR, PDF, Office, Watermark, Merge, Templates, Digital Signature, Version Control, Retention, Comparison | feature | feature | Document (provider-backed) | L17 | rm-std | L | provider-integration |
| L11 | Search: Full-text, Faceted, Semantic, Hybrid, Vector, Saved Searches, Suggestions, Synonyms, Ranking Rules, Search Analytics | platform capability | platform-primitive | Search Platform | L8-infra | rm-search | M | existing |
| L12 | Analytics: OLAP, Cube, Pivot, Dashboard, KPI, Drilldown, Scheduled Reports, Data Warehouse, BI Connectors | reporting surface | feature | Analytics Platform | — | rm-analytics | M | partial |
| NP | Notification: Templates, Routing, Channel Selection, User Preferences, Quiet Hours, Delivery Retry, Delivery Tracking, Read Receipts, Notification Center, Push/SMS/Email Gateway, Webhook/Digest/Scheduled Notifications, Priority Rules, Escalation Rules, Localization, A/B Testing, Analytics | platform capability | platform-primitive | Notification Platform | L12, L18, L19 | rm-notif | M | partial |
| L18 | Globalization: Locale/Address/Currency/Tax/Timezone/Holiday/Calendar Engine, Transliteration, Slug Engine, Phone Formatting, Regional Rules, Regulatory Packs | platform capability | platform-primitive | Globalization Platform | — | rm-i18n | M | partial |
| L19 | Experience: Theme Engine, Layout Engine, Personalization, Command Palette, Walkthrough, A/B Testing, Experimentation, Accessibility, Responsive Engine | platform capability | platform-primitive | UX/Experience Platform | — | rm-ux | M | partial |
| L13 | Commerce: Subscription, Usage Billing, Credits, Wallet, Marketplace Billing, Affiliate, Revenue Sharing | feature | feature | Commerce OS (aday BC, terfi etmez) | KX-licensing | rm-commerce | L | uncertain |
| L14 | Marketplace platform variants/features: App/Extension/Plugin/Template/Theme/Connector/AI Marketplace | platform capability | feature | Marketplace Platform (terfi etmez) | KX-module | rm-market | L | uncertain |
| L15 | Developer: SDK, CLI, Local Runtime, Mock Server, Sandbox, Code Generator, API Explorer, Extension SDK, Testing SDK, Migration SDK | platform capability | platform-primitive | Developer Platform | — | rm-dev | M | partial |
| KX-dev | CLI, SDK, Codegen, Sandbox, Mock Server | platform capability | platform-primitive | Developer Platform | L15 | rm-dev | M | duplicate |
| PF | Product families: CRM, ERP, HRMS, MRP, SCM, WMS, TMS, CMS, DMS, LMS, E-Commerce, PLM, PIM, DAM, CLM, ITSM, SIEM, IAM, MES, QMS, CMMS, POS, Help Desk, Procurement, Payroll, Accounting, Marketing Automation, CDP, CPQ, Project Management, Knowledge Management, RPA, AI Platform | product-family/app | research | Ürün aileleri (aday) | L1-feat, L8-infra, L13 | rm-pf | L | research-only |
| CL | CL capability-layer tablosu: Identity & Security, Tenant & Organization, Platform Core, Integration, AI Platform, Developer Platform, Operations, Governance & Compliance, Collaboration, Analytics & BI, Customization & Extensibility, UX Platform, Commerce Platform, Globalization, Data Platform | research input | research | (pyramid'e eşlenir) | L0…L19 | rm-std | L | duplicate |
| EC | ECRM iskeleti: L0 Platform, L1 Identity, L2 Tenant, L3 Organization, L4 Commerce, L5 CRM, L6 ERP, L7 SCM, … | research input | research | (pyramid + PF) | L0, L1-feat, L2, L3, L13, PF | rm-std | L | duplicate |
| FR | Framework attributes: Amaç, Business value, User stories, Alt capability, Feature listesi, API, Events, Permissions, Workflow, Automation, AI, Reports, Dashboard, Notifications, Integrations, Extension points, Metadata, Configurations, KPIs | research input | research | (TaskNode alanları/standardRefs) | — | rm-std | L | research-only |
| VEND | Vendor/benchmark adları (requirement/module DEĞİL): SAP, Salesforce, ServiceNow, Microsoft Dynamics 365, Atlassian Cloud, Workday, Oracle Fusion, Adobe Experience Cloud, Shopify Plus, Google Workspace, Microsoft 365, Drupal, Odoo, Zoho, Frappe, Mendix, OutSystems, Appian, Microsoft Power Platform, SAP Business Technology Platform, Oracle Fusion Platform, Salesforce Platform, Shopify Platform, Atlassian Platform | research input | research | — (benchmark; owner yok) | — | none | L | research-only |

## Duplicate and granularity ledger

Granülerlik kuralı ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §3, [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §3): **Event Bus bir capability'dir; Event Replay / DLQ / Ordering / Versioning / Subscription onun ALT-FEATURE'ıdır, peer module DEĞİL.** Aynı şekilde Command/Query/Scheduler/Queue/Cache "Platform"ları L0 primitiflerinin alt-feature setidir.

| Duplicate küme | Canonical | Katlanan (folds) | Kural |
|---|---|---|---|
| Event | L0 Event Bus | KX-event (Replay/DLQ/Ordering/Versioning), L6 External Events | alt-feature, peer module değil |
| Kernel primitifleri | L0 | KX-runtime/config/command/query/scheduler/queue/cache/diagnostics | araştırma genişletmesi = aynı primitif |
| Metadata | L4 | KX-meta | tek metadata otoritesi |
| AI infra | L8-infra | KX-ai | tek registry seti |
| Observability | L16-obs | KX-logging, KX-monitoring, KX-diagnostics | tek gözlemlenebilirlik |
| Developer | L15 | KX-dev | tek SDK yüzeyi |
| Entitlement/License | L13 | KX-licensing, KX-feature (Entitlement/License Feature) | ticari model tek otorite |
| Katman tabloları | L0…L19 pyramid | CL (15), EC (ECRM), CL-sec, CL-gov | isim eşleme; yeni katman değil |
| Search vector | L11 / L8-infra | L4 Dynamic Search, NP yok | vektör arama AI+Search paylaşır |
| Identity | L1-feat/proto | PF:IAM, EC:L1, CL-sec | IAM ürün-ailesi kimlik platformunu tüketir |

**Sahte-örtüşme (birleştirilmez):** L7-proto / L7-mcp (protokol) ≠ L7-broker (Kafka/RabbitMQ = altyapı sağlayıcı seçimi) ≠ L7-ipaas (Zapier/Make/n8n = vendor); Retention (L17 governance) ≠ Retention (L10 document sürüm-saklama farklı bağlam); A/B Testing (L19) ≠ NP A/B (bildirim varyantı) — ayrı outcome.

## Repo matches

Kanıt salt-okunur; relative link. `repoMatch` anahtarları → repo otoriteleri (kanon = şema/standart/node; araştırma değil):

- **rm-kernel** — [`core-contract-pack.md`](./core-contract-pack.md) §2, [`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md); cluster `kernel/layer0` ([`meta.json`](../src/data/generated/meta.json))
- **rm-id** — [`k-identity.json`](../src/data/generated/nodes/k-identity.json), [`cc-identity-models.json`](../src/data/generated/nodes/cc-identity-models.json), core-contract-pack §2 (identity)
- **rm-tenant** — [`core-contract-pack.md`](./core-contract-pack.md) §2.1 Tenant Context, [`k-boyut3-tenant-panel.json`](../src/data/generated/nodes/k-boyut3-tenant-panel.json)
- **rm-meta** — [`sus-metadata.json`](../src/data/generated/nodes/sus-metadata.json), [`app-meta.json`](../src/data/generated/nodes/app-meta.json)
- **rm-wf** — [`l1-workflow.json`](../src/data/generated/nodes/l1-workflow.json), [`dx-workflow.json`](../src/data/generated/nodes/dx-workflow.json)
- **rm-integ** — [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md) (EXT/DAT2 REUSE), core-contract-pack §1
- **rm-event** — [`s-event.json`](../src/data/generated/nodes/s-event.json)
- **rm-ai** — [`s-ai-governance.json`](../src/data/generated/nodes/s-ai-governance.json), [`s-ai-catalog.json`](../src/data/generated/nodes/s-ai-catalog.json), `standards/ai-governance.json` via [`engineering-standards-index.md`](./engineering-standards-index.md)
- **rm-ops** — [`platform-observability.json`](../src/data/generated/nodes/platform-observability.json), [`s-observability.json`](../src/data/generated/nodes/s-observability.json)
- **rm-gov** — [`cc-security.json`](../src/data/generated/nodes/cc-security.json), [`engineering-standards-index.md`](./engineering-standards-index.md) (governance/observability)
- **rm-search** — [`k-search.json`](../src/data/generated/nodes/k-search.json), [`l1-search.json`](../src/data/generated/nodes/l1-search.json)
- **rm-analytics** — [`l1-analytics.json`](../src/data/generated/nodes/l1-analytics.json)
- **rm-notif** — [`l1-notification.json`](../src/data/generated/nodes/l1-notification.json), [`cc-notification-consent.json`](../src/data/generated/nodes/cc-notification-consent.json)
- **rm-commerce** — [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md), [`s-commerce.json`](../src/data/generated/nodes/s-commerce.json), [`s-subscription-commerce.json`](../src/data/generated/nodes/s-subscription-commerce.json)
- **rm-market** — [`s-marketplace.json`](../src/data/generated/nodes/s-marketplace.json), [`dx-marketplace.json`](../src/data/generated/nodes/dx-marketplace.json)
- **rm-dev** — [`be-sdk.json`](../src/data/generated/nodes/be-sdk.json), [`k-boyut2-developer-panel.json`](../src/data/generated/nodes/k-boyut2-developer-panel.json)
- **rm-i18n** — [`s-i18n.json`](../src/data/generated/nodes/s-i18n.json), [`cc-i18n-standards.json`](../src/data/generated/nodes/cc-i18n-standards.json)
- **rm-ux** — [`engineering-standards-index.md`](./engineering-standards-index.md) (design-system, ux-interaction)
- **rm-collab** — [`app-content-collaboration.json`](../src/data/generated/nodes/app-content-collaboration.json)
- **rm-pf** — [`meta.json`](../src/data/generated/meta.json) (467 node, app 28), [`tas-crm-lead-mgmt.json`](../src/data/generated/nodes/tas-crm-lead-mgmt.json)
- **rm-std** — [`engineering-standards-index.md`](./engineering-standards-index.md); **none** — repo karşılığı bulunmadı (KX-package)

## Rejected numeric targets

Aşağıdaki sayılar kanıtsız tahmindir; **kapsam veya başarı metriği DEĞİL** (`research input`, `research-only`).
Kanıtlı portföy ihtiyacı doğrulanana kadar hiçbiri hedeftir ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §1, §7):

- CL tablosu satır aralıkları (150–250, 80–150, 200–350, … 150–300) ve toplam **2.000–4.000 capability**.
- Pyramid içi tahminler: L1 "≈200", L7 "≈300", "600 kernel capability".
- Kernel-expansion `≈NN` sayıları (Runtime ≈60, Config ≈80, Feature ≈120, Module ≈150, Event ≈250, Metadata ≈300, … AI ≈200, Developer ≈180) ve **800–1200 / 5000 feature / 25000 AC**.
- İkinci ölçek tablosu: Platform Kernel 1.000–1.500 … toplam **8.000–12.000**; domain ekiyle **20.000–30.000**.
- ECRM piramidi: **500 ana → 5.000 alt → 15.000 feature → 50.000 acceptance criteria**.
- Üretim planı: **150–250 bölüm**; "Bölüm N — X (600/800/1.500/2.000/1.800/1.200 capability)".
- "100 (enterprise) SaaS app" ve "10.000–20.000 benzersiz capability".

## Unresolved research inputs

`uncertain` / insan kararı gereken girdiler (Faz 2+ ve P0 kuyruğuna bağlı, [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §8):

- **DATA (Data Platform):** kaynak leaf saymaz; L4 metadata mı ayrı veri-otoritesi mi belirsiz → `uncertain`.
- **KX-package:** repo karşılığı yok (`none`); package-signing/distribution supply-chain kapsamı insan kararı.
- **Provider sınırı:** L10 OCR/Digital Signature, L18 Tax Engine, L7 broker/iPaaS, L11 Vector DB — build/buy/provider ve COGS/SLO kararı (P0 #5).
- **L18 Regulatory Packs / L17 Compliance/Residency/Legal Hold:** hukuk/mevzuat yorumu → counsel; otomatik "uyumlu" iddiası yasak.
- **PF ürün-aileleri:** ilk 3 product family + ICP insan kararı (P0 #1); 100-app kapsam değildir.
- **L13 (commerce) / L14 (marketplace) module/BC terfisi:** leaf'ler `uncertain` bırakıldı; module/BC'ye **terfi ETTİRİLMEDİ**. [`commerce-os-capability-classification.md`](./commerce-os-capability-classification.md) §6 module-promotion kapısı (tek data authority + bağımsız lifecycle + yayınlanan domain event + no cross-context write + satılabilir değer) geçilene kadar seviye feature/platform capability kalır.
- **VEND (24 vendor/benchmark adı):** yalnız kıyas/benchmark; owner yok, repo karşılığı yok (`none`); asla requirement/module/app değildir.
- **Agentic (kaynakta ima):** AI otonom işlem AGT — AI yetki kilidine tabi ([`AGENTS.md`](../AGENTS.md) §4.4).

## Deterministic checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 headings (10) | AUTO (oracle metin taraması) | 10/10 mevcut, tam sırada — reviewer/CI teyidine açık |
| Class vocabulary (14 sabit) | AUTO | matris yalnız izinli 14 sınıfı kullanır |
| Disposition (8 sabit) | AUTO | yalnız izinli 8 disposition |
| Vendor/protocol demotion (V2) | MANUAL/CHANGESET | Zapier/Make/n8n→provider(iPaaS); Kafka/RabbitMQ→provider(broker); REST/GraphQL/gRPC/SOAP/Webhooks/**MCP**/SAML/SCIM→integration/protocol; 24 vendor-benchmark→research input; **hiçbiri module değil** |
| Retry/DLQ ≠ Event Bus peer module | MANUAL | KX-event alt-feature olarak sınıflandı (ledger) |
| Numeric = target? | MANUAL/CHANGESET | tüm sayılar `research-only` (Rejected §); hedef yok — makine oracle yok, reviewer teyidi |
| Coverage (V6) | MANUAL/CHANGESET | 7/7 kaynak bölümü; leaf'ler normalizedName'de listeli — makine oracle yok, reviewer teyidi |
| Relative link target | MANUAL/CHANGESET | repoMatch linkleri repo-relative; hedef varlık Codex teyidine açık |
| Dedup/DAG registry | MANUAL/CHANGESET | makine registry yok; ledger metinsel |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız doğrulamasına aittir.

## Phase decision

- Bu çıktı **sınıflandırma matrisidir**; requirement/backlog/node/app/module/queue/schema/gate DEĞİL. Araştırma **kanonik değildir**.
- Stop-gate (vendor/protokol/feature → module): **İHLAL YOK** (V2/ledger).
- Yazılan tek izinli dosya: `docs/enterprise-saas-source-normalization-matrix.md`. Faz 0 girdileri ve 2 untracked girdi değişmedi.
- Disposition özeti (57 satır): existing 4 · partial 26 · duplicate 16 · provider-integration 4 · research-only 3 · uncertain 4 · missing 0 · conflicting 0. `AI use-case` sınıfı **kullanılmadı** (kaynakta adlı use-case yok); leaf triyajı beklemede.
- **Faz 1 GO/NO-GO → Codex'e ait.** Bu worker Faz 1'i tamamladı ve **durur**; Faz 2 (requirement constitution) yalnız Codex onayıyla ayrı, yetkili bir dalgada başlar.
