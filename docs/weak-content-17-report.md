# Zayıf İçerik Raporu — 17 Boyut (2026-07-04)

Zayıflık = audit motorunun içerik-zenginliği skoru (concreteness 0.45 + completeness 0.25 + applicability 0.30). Şema/kavram ihlali değildir; onlar ayrı kapılardadır. Üretici: `node tools/agents/report-weak-content.mjs`.

## Toplam sınıf dağılımı

short-items kartı: 59 · generic kartı: 0 · empty-but-not-na: 0 · missing-evidence (node): 460 · missing-ref (kart): 0 · rollback-gap: 0 · semantic-warn: 1983 · bilinçli N/A: 44
ölçülü-kısa kartı: 1

Top-40 zayıf node ortalama skoru: **2.859**

## Boyut bazlı zayıflık (short/measuredShort/generic/empty/warn)

| boyut | short | measuredShort | generic | empty | warn | toplam |
|---|---|---|---|---|---|---|
| featureDefs | 0 | 0 | 0 | 0 | 234 | 234 |
| testing | 0 | 0 | 0 | 0 | 232 | 232 |
| codeOptimization | 0 | 0 | 0 | 0 | 232 | 232 |
| securityOptimization | 29 | 0 | 0 | 0 | 197 | 226 |
| owasp | 0 | 0 | 0 | 0 | 205 | 205 |
| performance | 0 | 0 | 0 | 0 | 188 | 188 |
| mobileApps | 0 | 0 | 0 | 0 | 185 | 185 |
| deployment | 0 | 0 | 0 | 0 | 146 | 146 |
| integration | 30 | 0 | 0 | 0 | 99 | 129 |
| security | 0 | 0 | 0 | 0 | 92 | 92 |
| wcag | 0 | 1 | 0 | 0 | 84 | 85 |
| eca | 0 | 0 | 0 | 0 | 45 | 45 |
| moduleUsage | 0 | 0 | 0 | 0 | 32 | 32 |
| aiAgents | 0 | 0 | 0 | 0 | 12 | 12 |

## Seviye / küme ortalamaları

- module: 178 node, ort. 2.91
- app: 28 node, ort. 2.88
- archetype: 105 node, ort. 2.91
- micro_step: 19 node, ort. 2.92
- work_unit: 18 node, ort. 2.92
- component: 18 node, ort. 2.92
- feature: 101 node, ort. 2.9

En zayıf kümeler: atomic (2.86), aday (2.88), backend (2.88), dx (2.88), finance (2.88), edu (2.89), egitim (2.89), genel (2.89)

## En zayıf 100 node

| skor | id | seviye | küme | en zayıf boyut | bayraklar |
|---|---|---|---|---|---|
| 2.76 | app-backend | app | backend | deployment | missing-evidence |
| 2.79 | app-frontend | app | frontend | securityOptimization | missing-evidence |
| 2.79 | app-layer1 | app | layer1 | wcag | missing-evidence |
| 2.81 | cc-security | feature | crosscut | wcag | missing-evidence |
| 2.85 | app-data-intelligence-x-stone | feature | data-intelligence | wcag | missing-evidence |
| 2.85 | atomic-types | module | atomic | deployment | missing-evidence |
| 2.85 | s-pos | archetype | core-operations | mobileApps | missing-evidence |
| 2.86 | app-customer-revenue | app | customer-revenue | mobileApps | missing-evidence |
| 2.86 | app-finance-x-stone | feature | finance | mobileApps | missing-evidence |
| 2.86 | app-supply-chain | app | supply-chain | codeOptimization | missing-evidence |
| 2.86 | l1-search | module | layer1 | security | missing-evidence |
| 2.86 | s-ai-voice | archetype | data-intelligence | codeOptimization | missing-evidence |
| 2.87 | adr-0023 | module | kararlar | securityOptimization | missing-evidence, semantic-warn, short-items |
| 2.87 | adr-0024 | module | kararlar | securityOptimization | missing-evidence, semantic-warn, short-items |
| 2.87 | adr-0025-frontend-stack-uzlastirma | module | kararlar | securityOptimization | missing-evidence, semantic-warn, short-items |
| 2.87 | app-aday | app | aday | testing | missing-evidence, semantic-warn |
| 2.87 | app-atomic | app | atomic | deployment | missing-evidence |
| 2.87 | app-finance-x-molecule | component | finance | security | missing-evidence, semantic-warn |
| 2.87 | app-hr | app | hr | wcag | missing-evidence |
| 2.87 | app-kernel-x-molecule | component | kernel | testing | missing-evidence, semantic-warn |
| 2.87 | cc-content-jurisdiction | feature | crosscut | wcag | missing-evidence, semantic-warn |
| 2.87 | cc-graphql-guvenlik | module | crosscut | owasp | missing-evidence, semantic-warn |
| 2.87 | cc-i18n-standards | feature | crosscut | wcag | missing-evidence, semantic-warn |
| 2.87 | cc-notification-consent | feature | crosscut | security | missing-evidence, semantic-warn |
| 2.87 | cc-obs-deep | feature | crosscut | securityOptimization | missing-evidence, semantic-warn |
| 2.87 | cc-privacy | feature | crosscut | mobileApps | missing-evidence, semantic-warn |
| 2.87 | dist-clinic | module | aday | integration | missing-evidence, semantic-warn |
| 2.87 | dist-legal | module | aday | deployment | missing-evidence, semantic-warn |
| 2.87 | dist-membership | module | aday | security | missing-evidence, semantic-warn |
| 2.87 | dx-api-gateway | feature | dx | deployment | missing-evidence |
| 2.87 | dx-cli | module | dx | wcag | missing-evidence, semantic-warn |
| 2.87 | dx-marketplace | module | dx | securityOptimization | missing-evidence, semantic-warn |
| 2.87 | edition-departman-copilot | module | aday | deployment | missing-evidence, semantic-warn |
| 2.87 | edition-onmuhasebe | module | aday | deployment | missing-evidence, semantic-warn |
| 2.87 | edition-people | module | aday | deployment | missing-evidence, semantic-warn |
| 2.87 | edition-salescrm | module | aday | deployment | missing-evidence, semantic-warn |
| 2.87 | el-crm-score-weight-config | work_unit | core-operations | mobileApps | missing-evidence, semantic-warn |
| 2.87 | fe-ai-rt | feature | frontend | deployment | missing-evidence, semantic-warn |
| 2.87 | fe-cdn | feature | frontend | wcag | missing-evidence, semantic-warn |
| 2.87 | fe-core-ui | feature | frontend | eca | missing-evidence, semantic-warn |
| 2.87 | fe-tooling | feature | frontend | performance | missing-evidence, semantic-warn |
| 2.87 | k-agent-runtime | module | kernel | owasp | missing-evidence |
| 2.87 | k-authz | module | layer0 | wcag | missing-evidence |
| 2.87 | k-bus | module | layer0 | deployment | missing-evidence, semantic-warn |
| 2.87 | k-schema | module | layer0 | wcag | missing-evidence, semantic-warn |
| 2.87 | k-sozlesme | module | kernel | performance | missing-evidence, semantic-warn |
| 2.87 | k-surface | module | kernel | performance | missing-evidence |
| 2.87 | l1-experiment | module | layer1 | wcag | missing-evidence, semantic-warn |
| 2.87 | l1-import | feature | layer1 | wcag | missing-evidence, semantic-warn |
| 2.87 | l1-party | module | layer1 | wcag | missing-evidence |
| 2.87 | l1-pseo | module | layer1 | deployment | missing-evidence, semantic-warn |
| 2.87 | landx-l1 | module | landx | integration | missing-evidence, semantic-warn, short-items |
| 2.87 | s-ai | archetype | data-intelligence | wcag | missing-evidence, semantic-warn |
| 2.87 | s-ap-automation | archetype | finance | deployment | missing-evidence, semantic-warn |
| 2.87 | s-billing | archetype | finance | integration | missing-evidence, semantic-warn |
| 2.87 | s-channel-hub | module | aday | deployment | missing-evidence, semantic-warn |
| 2.87 | s-clinic | archetype | vertical | wcag | missing-evidence, semantic-warn |
| 2.87 | s-clm | archetype | customer-revenue | owasp | missing-evidence, semantic-warn |
| 2.87 | s-comms | module | aday | security | missing-evidence, semantic-warn |
| 2.87 | s-data-catalog | archetype | data-intelligence | codeOptimization | missing-evidence, semantic-warn |
| 2.87 | s-doc-matching | archetype | data-intelligence | deployment | missing-evidence, semantic-warn |
| 2.87 | s-ecommerce-models | module | core-operations | testing | missing-evidence, semantic-warn |
| 2.87 | s-education | archetype | vertical | wcag | missing-evidence, semantic-warn |
| 2.87 | s-esign | module | aday | security | missing-evidence, semantic-warn |
| 2.87 | s-etl | archetype | data-intelligence | codeOptimization | missing-evidence, semantic-warn |
| 2.87 | s-expenses | archetype | finance | integration | missing-evidence, semantic-warn |
| 2.87 | s-incentive | archetype | vertical | security | missing-evidence, semantic-warn |
| 2.87 | s-inventory | archetype | core-operations | codeOptimization | missing-evidence, semantic-warn |
| 2.87 | s-kyc-aml | archetype | finance | security | missing-evidence, semantic-warn |
| 2.87 | s-onboarding | archetype | hr | featureDefs | missing-evidence, semantic-warn |
| 2.87 | s-payment-methods | feature | core-operations | security | missing-evidence, semantic-warn |
| 2.87 | s-procurement | archetype | supply-chain | owasp | missing-evidence, semantic-warn |
| 2.87 | s-property | archetype | vertical | security | missing-evidence, semantic-warn |
| 2.87 | s-rag | archetype | data-intelligence | deployment | missing-evidence, semantic-warn |
| 2.87 | s-restaurant | archetype | vertical | security | missing-evidence, semantic-warn |
| 2.87 | s-scheduling | module | aday | security | missing-evidence, semantic-warn |
| 2.87 | s-social-commerce | feature | core-operations | performance | missing-evidence, semantic-warn |
| 2.87 | s-studio | archetype | platform-horizontal | codeOptimization | missing-evidence, semantic-warn |
| 2.87 | s-subscription-commerce | feature | core-operations | wcag | missing-evidence, semantic-warn |
| 2.87 | s-tms | archetype | supply-chain | owasp | missing-evidence, semantic-warn |
| 2.87 | s-traceability | archetype | supply-chain | deployment | missing-evidence, semantic-warn |
| 2.87 | s-workforce | archetype | hr | performance | missing-evidence, semantic-warn |
| 2.87 | scale-multiregion | feature | scale | codeOptimization | missing-evidence, semantic-warn |
| 2.87 | scale-ratelimit | feature | scale | codeOptimization | missing-evidence, semantic-warn |
| 2.87 | services | module | dx | wcag | missing-evidence, semantic-warn |
| 2.88 | app-crosscut | app | crosscut | performance | missing-evidence, semantic-warn |
| 2.88 | app-data-intelligence | app | data-intelligence | mobileApps | missing-evidence, semantic-warn |
| 2.88 | app-dx | app | dx | performance | missing-evidence |
| 2.88 | app-finance-x-element | work_unit | finance | security | missing-evidence, semantic-warn |
| 2.88 | app-layer0 | app | layer0 | securityOptimization | missing-evidence |
| 2.88 | app-platform-horizontal | app | platform-horizontal | wcag | missing-evidence |
| 2.88 | app-scale | app | scale | securityOptimization | missing-evidence, semantic-warn |
| 2.88 | be-sdk | module | backend | security | missing-evidence, semantic-warn |
| 2.88 | be-v1-kapsam-disi | module | backend | integration | missing-evidence, semantic-warn |
| 2.88 | cc-fx-ledger | feature | crosscut | securityOptimization | missing-evidence, semantic-warn |
| 2.88 | cc-tr | feature | crosscut | wcag | missing-evidence, semantic-warn |
| 2.88 | dist-agritech | module | aday | deployment | missing-evidence, semantic-warn |
| 2.88 | dist-ngo | module | aday | deployment | missing-evidence, semantic-warn |
| 2.88 | dist-restaurant | module | aday | deployment | missing-evidence, semantic-warn |
| 2.88 | fe-mobile | feature | frontend | securityOptimization | missing-evidence, semantic-warn |

## Top-40 önerilen aksiyon planı

- **app-backend** (2.76, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-frontend** (2.79, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-layer1** (2.79, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **cc-security** (2.81, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-data-intelligence-x-stone** (2.85, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **atomic-types** (2.85, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **s-pos** (2.85, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-customer-revenue** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-finance-x-stone** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-supply-chain** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla
- **l1-search** (2.86, security): evidence[] alanına test/deploy/audit kanıtı bağla
- **s-ai-voice** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla
- **adr-0023** (2.87, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **adr-0024** (2.87, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **adr-0025-frontend-stack-uzlastirma** (2.87, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-aday** (2.87, testing): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **app-atomic** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-finance-x-molecule** (2.87, security): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **app-hr** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-kernel-x-molecule** (2.87, testing): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **cc-content-jurisdiction** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **cc-graphql-guvenlik** (2.87, owasp): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **cc-i18n-standards** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **cc-notification-consent** (2.87, security): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **cc-obs-deep** (2.87, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **cc-privacy** (2.87, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dist-clinic** (2.87, integration): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dist-legal** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dist-membership** (2.87, security): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dx-api-gateway** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **dx-cli** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **dx-marketplace** (2.87, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **edition-departman-copilot** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **edition-onmuhasebe** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **edition-people** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **edition-salescrm** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **el-crm-score-weight-config** (2.87, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **fe-ai-rt** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **fe-cdn** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle
- **fe-core-ui** (2.87, eca): evidence[] alanına test/deploy/audit kanıtı bağla; kartın must/anyOf kavramlarını içerecek gerçek içerik ekle

