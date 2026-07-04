# Zayıf İçerik Raporu — 17 Boyut (2026-07-04)

Zayıflık = audit motorunun içerik-zenginliği skoru (concreteness 0.45 + completeness 0.25 + applicability 0.30). Şema/kavram ihlali değildir; onlar ayrı kapılardadır. Üretici: `node tools/agents/report-weak-content.mjs`.

## Toplam sınıf dağılımı

short-items kartı: 59 · generic kartı: 0 · empty-but-not-na: 0 · missing-evidence (node): 460 · missing-ref (kart): 1703 · rollback-gap: 0 · semantic-warn: 2245 · bilinçli N/A: 44
ölçülü-kısa kartı: 1

Top-40 zayıf node ortalama skoru: **2.852**

## Boyut bazlı zayıflık (short/measuredShort/generic/empty/warn)

| boyut | short | measuredShort | generic | empty | warn | toplam |
|---|---|---|---|---|---|---|
| featureDefs | 0 | 0 | 0 | 0 | 289 | 289 |
| codeOptimization | 0 | 0 | 0 | 0 | 285 | 285 |
| securityOptimization | 29 | 0 | 0 | 0 | 240 | 269 |
| testing | 0 | 0 | 0 | 0 | 240 | 240 |
| owasp | 0 | 0 | 0 | 0 | 220 | 220 |
| performance | 0 | 0 | 0 | 0 | 216 | 216 |
| mobileApps | 0 | 0 | 0 | 0 | 190 | 190 |
| deployment | 0 | 0 | 0 | 0 | 162 | 162 |
| integration | 30 | 0 | 0 | 0 | 109 | 139 |
| security | 0 | 0 | 0 | 0 | 113 | 113 |
| wcag | 0 | 1 | 0 | 0 | 91 | 92 |
| eca | 0 | 0 | 0 | 0 | 45 | 45 |
| moduleUsage | 0 | 0 | 0 | 0 | 32 | 32 |
| aiAgents | 0 | 0 | 0 | 0 | 13 | 13 |

## Seviye / küme ortalamaları

- module: 178 node, ort. 2.9
- app: 28 node, ort. 2.88
- archetype: 105 node, ort. 2.91
- micro_step: 19 node, ort. 2.92
- work_unit: 18 node, ort. 2.92
- component: 18 node, ort. 2.92
- feature: 101 node, ort. 2.9

En zayıf kümeler: atomic (2.85), kararlar (2.87), dx (2.87), landx (2.87), aday (2.88), backend (2.88), finance (2.88), vertical (2.88)

## En zayıf 100 node

| skor | id | seviye | küme | en zayıf boyut | bayraklar |
|---|---|---|---|---|---|
| 2.76 | app-backend | app | backend | deployment | missing-evidence, missing-ref |
| 2.79 | app-frontend | app | frontend | securityOptimization | missing-evidence, missing-ref |
| 2.79 | app-layer1 | app | layer1 | wcag | missing-evidence, missing-ref |
| 2.81 | cc-security | feature | crosscut | wcag | missing-evidence, missing-ref |
| 2.85 | app-atomic | app | atomic | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.85 | app-data-intelligence-x-stone | feature | data-intelligence | wcag | missing-evidence, missing-ref |
| 2.85 | atomic-types | module | atomic | deployment | missing-evidence, missing-ref |
| 2.85 | s-pos | archetype | core-operations | mobileApps | missing-evidence, missing-ref |
| 2.86 | app-customer-revenue | app | customer-revenue | mobileApps | missing-evidence, missing-ref |
| 2.86 | app-finance-x-stone | feature | finance | mobileApps | missing-evidence, missing-ref |
| 2.86 | app-supply-chain | app | supply-chain | codeOptimization | missing-evidence, missing-ref |
| 2.86 | app-sus-x-atom | micro_step | sus | featureDefs | missing-evidence, missing-ref, semantic-warn |
| 2.86 | app-sus-x-element | work_unit | sus | featureDefs | missing-evidence, missing-ref, semantic-warn |
| 2.86 | app-vertical-x-atom | micro_step | vertical | featureDefs | missing-evidence, missing-ref, semantic-warn |
| 2.86 | app-vertical-x-element | work_unit | vertical | featureDefs | missing-evidence, missing-ref, semantic-warn |
| 2.86 | be-deploy-profilleri | module | backend | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | cc-cultural-ux | feature | crosscut | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | dist-realestate | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | dist-veteriner | module | aday | security | missing-evidence, missing-ref, semantic-warn |
| 2.86 | dx-workflow | module | dx | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | edition-creator | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | fe-anti | feature | frontend | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | fe-monorepo | feature | frontend | codeOptimization | missing-evidence, missing-ref, semantic-warn |
| 2.86 | k-boyut1-ops-panel | module | kernel | codeOptimization | missing-evidence, missing-ref, semantic-warn |
| 2.86 | k-control-planes | module | kernel | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.86 | l1-party | module | layer1 | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.86 | l1-search-deep | feature | layer1 | mobileApps | missing-evidence, missing-ref, semantic-warn |
| 2.86 | l1-search | module | layer1 | security | missing-evidence, missing-ref |
| 2.86 | l1-webhook-in | feature | layer1 | testing | missing-evidence, missing-ref, semantic-warn |
| 2.86 | landx-l2 | module | landx | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.86 | landx-l3 | module | landx | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.86 | landx-l4 | module | landx | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.86 | landx-l5 | module | landx | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.86 | s-ai-catalog | archetype | data-intelligence | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-ai-governance | archetype | platform-horizontal | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-ai-voice | archetype | data-intelligence | codeOptimization | missing-evidence, missing-ref |
| 2.86 | s-bi | archetype | data-intelligence | mobileApps | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-classifieds | module | core-operations | performance | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-consolidation | archetype | finance | securityOptimization | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-conversational | archetype | data-intelligence | owasp | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-kvkk | module | aday | security | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-legaltech | archetype | vertical | integration | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-mrp | archetype | core-operations | performance | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-pmo | archetype | core-operations | performance | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-sales | archetype | core-operations | mobileApps | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-treasury | archetype | finance | codeOptimization | missing-evidence, missing-ref, semantic-warn |
| 2.86 | s-wms | archetype | supply-chain | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.86 | scale-cache | feature | scale | owasp | missing-evidence, missing-ref, semantic-warn |
| 2.86 | scale-realtime | feature | scale | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | scale-saga | feature | scale | featureDefs | missing-evidence, missing-ref, semantic-warn |
| 2.86 | scale-timeseries | feature | scale | securityOptimization | missing-evidence, missing-ref, semantic-warn |
| 2.86 | scale-workers-deep | feature | scale | performance | missing-evidence, missing-ref, semantic-warn |
| 2.86 | stack-builder | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | stack-channel | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | stack-compliance | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | stack-editions | module | aday | security | missing-evidence, missing-ref, semantic-warn |
| 2.86 | stack-messaging | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.86 | stack-service | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.87 | adr-0001 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0002 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0003 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0004 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0005 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0006 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0007 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0008 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0009 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0010 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0011 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0012 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0013 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0014 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0015 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0016 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0017 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0018 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0019 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0020 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0021 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0022 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0023 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0024 | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | adr-0025-frontend-stack-uzlastirma | module | kararlar | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.87 | app-aday | app | aday | testing | missing-evidence, missing-ref, semantic-warn |
| 2.87 | app-finance-x-molecule | component | finance | security | missing-evidence, missing-ref, semantic-warn |
| 2.87 | app-hr | app | hr | wcag | missing-evidence, missing-ref |
| 2.87 | app-kernel-x-molecule | component | kernel | testing | missing-evidence, missing-ref, semantic-warn |
| 2.87 | cc-content-jurisdiction | feature | crosscut | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.87 | cc-graphql-guvenlik | module | crosscut | owasp | missing-evidence, missing-ref, semantic-warn |
| 2.87 | cc-i18n-standards | feature | crosscut | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.87 | cc-notification-consent | feature | crosscut | security | missing-evidence, missing-ref, semantic-warn |
| 2.87 | cc-obs-deep | feature | crosscut | securityOptimization | missing-evidence, missing-ref, semantic-warn |
| 2.87 | cc-privacy | feature | crosscut | mobileApps | missing-evidence, missing-ref, semantic-warn |
| 2.87 | dist-clinic | module | aday | integration | missing-evidence, missing-ref, semantic-warn |
| 2.87 | dist-legal | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |
| 2.87 | dist-membership | module | aday | security | missing-evidence, missing-ref, semantic-warn |
| 2.87 | dx-api-gateway | feature | dx | deployment | missing-evidence, missing-ref |
| 2.87 | dx-cli | module | dx | wcag | missing-evidence, missing-ref, semantic-warn |
| 2.87 | dx-marketplace | module | dx | securityOptimization | missing-evidence, missing-ref, semantic-warn |
| 2.87 | edition-departman-copilot | module | aday | deployment | missing-evidence, missing-ref, semantic-warn |

## Top-40 önerilen aksiyon planı

- **app-backend** (2.76, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **app-frontend** (2.79, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **app-layer1** (2.79, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **cc-security** (2.81, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **app-atomic** (2.85, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **app-data-intelligence-x-stone** (2.85, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **atomic-types** (2.85, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **s-pos** (2.85, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **app-customer-revenue** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **app-finance-x-stone** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **app-supply-chain** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **app-sus-x-atom** (2.86, featureDefs): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **app-sus-x-element** (2.86, featureDefs): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **app-vertical-x-atom** (2.86, featureDefs): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **app-vertical-x-element** (2.86, featureDefs): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **be-deploy-profilleri** (2.86, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **cc-cultural-ux** (2.86, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dist-realestate** (2.86, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dist-veteriner** (2.86, security): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dx-workflow** (2.86, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **edition-creator** (2.86, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **fe-anti** (2.86, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **fe-monorepo** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **k-boyut1-ops-panel** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **k-control-planes** (2.86, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **l1-party** (2.86, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **l1-search-deep** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **l1-search** (2.86, security): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **l1-webhook-in** (2.86, testing): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **landx-l2** (2.86, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **landx-l3** (2.86, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **landx-l4** (2.86, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **landx-l5** (2.86, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-ai-catalog** (2.86, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **s-ai-governance** (2.86, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **s-ai-voice** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)
- **s-bi** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **s-classifieds** (2.86, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **s-consolidation** (2.86, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **s-conversational** (2.86, owasp): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle

