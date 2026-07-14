# Zayıf İçerik Raporu — 17 Boyut (2026-07-14)

Zayıflık = audit motorunun içerik-zenginliği skoru (concreteness 0.45 + completeness 0.25 + applicability 0.30). Şema/kavram ihlali değildir; onlar ayrı kapılardadır. Üretici: `node tools/agents/report-weak-content.mjs`.

## Toplam sınıf dağılımı

short-items kartı: 56 · generic kartı: 0 · empty-but-not-na: 0 · missing-evidence (node): 610 · missing-ref (kart): 0 · rollback-gap: 0 · semantic-warn: 0 · bilinçli N/A: 44
ölçülü-kısa kartı: 1

Top-40 zayıf node ortalama skoru: **2.862**

## Boyut bazlı zayıflık (short/measuredShort/generic/empty/warn)

| boyut | short | measuredShort | generic | empty | warn | toplam |
|---|---|---|---|---|---|---|
| integration | 30 | 0 | 0 | 0 | 0 | 30 |
| securityOptimization | 26 | 0 | 0 | 0 | 0 | 26 |
| wcag | 0 | 1 | 0 | 0 | 0 | 1 |

## Seviye / küme ortalamaları

- module: 267 node, ort. 2.96
- app: 148 node, ort. 2.91
- micro_step: 36 node, ort. 2.96
- archetype: 29 node, ort. 2.95
- component: 18 node, ort. 2.95
- work_unit: 19 node, ort. 2.93
- feature: 100 node, ort. 2.91

En zayıf kümeler: atomic (2.86), aday (2.89), backend (2.89), landx (2.89), meta (2.89), vertical (2.89), dx (2.9), edu (2.9)

## En zayıf 100 node

| skor | id | seviye | küme | en zayıf boyut | bayraklar |
|---|---|---|---|---|---|
| 2.80 | app-backend | app | backend | mobileApps | missing-evidence |
| 2.83 | app-build-x-kum | component | build | codeOptimization | missing-evidence |
| 2.83 | app-layer1 | app | layer1 | mobileApps | missing-evidence |
| 2.85 | app-data-intelligence-x-tas | feature | data-intelligence | wcag | missing-evidence |
| 2.85 | app-frontend | app | frontend | security | missing-evidence |
| 2.85 | atomic-types | module | atomic | deployment | missing-evidence |
| 2.85 | s-pos | app | core-operations | mobileApps | missing-evidence |
| 2.86 | app-customer-revenue | app | customer-revenue | mobileApps | missing-evidence |
| 2.86 | app-finance-x-tas | feature | finance | mobileApps | missing-evidence |
| 2.86 | app-supply-chain | app | supply-chain | codeOptimization | missing-evidence |
| 2.86 | cc-security | feature | crosscut | deployment | missing-evidence |
| 2.86 | l1-search | module | layer1 | security | missing-evidence |
| 2.86 | s-ai-voice | app | data-intelligence | codeOptimization | missing-evidence |
| 2.86 | s-workforce | app | hr | performance | missing-evidence |
| 2.86 | stack-editions | module | aday | security | missing-evidence |
| 2.87 | app-atomic | app | atomic | deployment | missing-evidence |
| 2.87 | app-hr | app | hr | wcag | missing-evidence |
| 2.87 | app-sus-x-atom | micro_step | sus | featureDefs | missing-evidence |
| 2.87 | app-sus-x-molekul | work_unit | sus | featureDefs | missing-evidence |
| 2.87 | app-sus | app | sus | mobileApps | missing-evidence |
| 2.87 | app-vertical-x-molekul | work_unit | vertical | featureDefs | missing-evidence |
| 2.87 | cc-i18n-standards | feature | crosscut | wcag | missing-evidence |
| 2.87 | dx-api-gateway | feature | dx | deployment | missing-evidence |
| 2.87 | dx-workflow | module | dx | deployment | missing-evidence |
| 2.87 | fe-ai-rt | feature | frontend | deployment | missing-evidence |
| 2.87 | fe-cdn | feature | frontend | wcag | missing-evidence |
| 2.87 | fe-core-ui | feature | frontend | eca | missing-evidence |
| 2.87 | k-agent-runtime | module | kernel | owasp | missing-evidence |
| 2.87 | k-authz | module | layer0 | wcag | missing-evidence |
| 2.87 | k-bus | module | layer0 | deployment | missing-evidence |
| 2.87 | k-schema | module | layer0 | wcag | missing-evidence |
| 2.87 | k-sozlesme | module | kernel | performance | missing-evidence |
| 2.87 | k-surface | module | kernel | performance | missing-evidence |
| 2.87 | l1-party | module | layer1 | wcag | missing-evidence |
| 2.87 | l1-pseo | module | layer1 | deployment | missing-evidence |
| 2.87 | l1-webhook-in | feature | layer1 | testing | missing-evidence |
| 2.87 | landx-l1 | module | landx | integration | missing-evidence, short-items |
| 2.87 | s-ai | app | data-intelligence | wcag | missing-evidence |
| 2.87 | s-clinic | app | vertical | wcag | missing-evidence |
| 2.87 | s-clm | app | customer-revenue | owasp | missing-evidence |
| 2.87 | s-data-catalog | app | data-intelligence | codeOptimization | missing-evidence |
| 2.87 | s-education | app | vertical | wcag | missing-evidence |
| 2.87 | s-etl | app | data-intelligence | codeOptimization | missing-evidence |
| 2.87 | s-incentive | app | vertical | security | missing-evidence |
| 2.87 | s-kyc-aml | app | finance | security | missing-evidence |
| 2.87 | s-procurement | app | supply-chain | owasp | missing-evidence |
| 2.87 | s-property | app | vertical | security | missing-evidence |
| 2.87 | s-rag | app | data-intelligence | deployment | missing-evidence |
| 2.87 | s-studio | app | platform-horizontal | codeOptimization | missing-evidence |
| 2.87 | s-subscription-commerce | app | core-operations | wcag | missing-evidence |
| 2.87 | s-tms | app | supply-chain | owasp | missing-evidence |
| 2.87 | s-traceability | app | supply-chain | deployment | missing-evidence |
| 2.87 | scale-cache | feature | scale | owasp | missing-evidence |
| 2.87 | scale-ratelimit | feature | scale | codeOptimization | missing-evidence |
| 2.87 | scale-workers-deep | feature | scale | performance | missing-evidence |
| 2.88 | adr-0025-frontend-stack-uzlastirma | module | kararlar | integration | missing-evidence, short-items |
| 2.88 | app-crosscut | app | crosscut | performance | missing-evidence |
| 2.88 | app-data-intelligence | app | data-intelligence | mobileApps | missing-evidence |
| 2.88 | app-dx | app | dx | performance | missing-evidence |
| 2.88 | app-hr-x-kum | component | hr | security | missing-evidence |
| 2.88 | app-layer0 | app | layer0 | securityOptimization | missing-evidence |
| 2.88 | app-platform-horizontal | app | platform-horizontal | wcag | missing-evidence |
| 2.88 | app-scale | app | scale | securityOptimization | missing-evidence |
| 2.88 | be-deploy-profilleri | module | backend | deployment | missing-evidence |
| 2.88 | be-sdk | module | backend | security | missing-evidence |
| 2.88 | cc-cultural-ux | feature | crosscut | deployment | missing-evidence |
| 2.88 | cc-fx-ledger | feature | crosscut | securityOptimization | missing-evidence |
| 2.88 | cc-tr | feature | crosscut | wcag | missing-evidence |
| 2.88 | dist-restaurant | module | aday | deployment | missing-evidence |
| 2.88 | edition-departman-copilot | app | aday | deployment | missing-evidence |
| 2.88 | edition-onmuhasebe | app | aday | deployment | missing-evidence |
| 2.88 | fe-mobile | feature | frontend | securityOptimization | missing-evidence |
| 2.88 | fe-monorepo | feature | frontend | codeOptimization | missing-evidence |
| 2.88 | k-archetype-storage | module | layer0 | mobileApps | missing-evidence |
| 2.88 | k-boyut1-ops-panel | module | kernel | featureDefs | missing-evidence |
| 2.88 | k-boyut2-developer-panel | module | kernel | wcag | missing-evidence |
| 2.88 | k-boyut3-tenant-panel | module | kernel | mobileApps | missing-evidence |
| 2.88 | k-control-planes | module | kernel | wcag | missing-evidence |
| 2.88 | k-identity | module | layer0 | wcag | missing-evidence |
| 2.88 | k-wbs | feature | kernel | mobileApps | missing-evidence |
| 2.88 | l1-export | feature | layer1 | wcag | missing-evidence |
| 2.88 | l1-file | module | layer1 | codeOptimization | missing-evidence |
| 2.88 | l1-misc | module | layer1 | featureDefs | missing-evidence |
| 2.88 | l1-quiet-hours | feature | layer1 | mobileApps | missing-evidence |
| 2.88 | l1-search-deep | feature | layer1 | mobileApps | missing-evidence |
| 2.88 | l1-sitemap | module | layer1 | wcag | missing-evidence |
| 2.88 | l1-tagmanager | module | layer1 | owasp | missing-evidence |
| 2.88 | molekul-crm-score-weight-config | work_unit | core-operations | mobileApps | missing-evidence |
| 2.88 | s-accounting | app | finance | codeOptimization | missing-evidence |
| 2.88 | s-audit | app | platform-horizontal | wcag | missing-evidence |
| 2.88 | s-commerce | app | core-operations | security | missing-evidence |
| 2.88 | s-comms | app | aday | security | missing-evidence |
| 2.88 | s-conversational | app | data-intelligence | owasp | missing-evidence |
| 2.88 | s-cyber-grc | app | platform-horizontal | deployment | missing-evidence |
| 2.88 | s-esg | app | data-intelligence | wcag | missing-evidence |
| 2.88 | s-esign | app | aday | security | missing-evidence |
| 2.88 | s-iam | app | platform-horizontal | security | missing-evidence |
| 2.88 | s-membership | app | vertical | security | missing-evidence |
| 2.88 | s-restaurant | app | vertical | security | missing-evidence |
| 2.88 | s-revenue-copilot | app | customer-revenue | deployment | missing-evidence |

## Top-40 önerilen aksiyon planı

- **app-backend** (2.80, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-build-x-kum** (2.83, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-layer1** (2.83, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-data-intelligence-x-tas** (2.85, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-frontend** (2.85, security): evidence[] alanına test/deploy/audit kanıtı bağla
- **atomic-types** (2.85, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **s-pos** (2.85, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-customer-revenue** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-finance-x-tas** (2.86, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-supply-chain** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla
- **cc-security** (2.86, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **l1-search** (2.86, security): evidence[] alanına test/deploy/audit kanıtı bağla
- **s-ai-voice** (2.86, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla
- **s-workforce** (2.86, performance): evidence[] alanına test/deploy/audit kanıtı bağla
- **stack-editions** (2.86, security): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-atomic** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-hr** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-sus-x-atom** (2.87, featureDefs): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-sus-x-molekul** (2.87, featureDefs): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-sus** (2.87, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla
- **app-vertical-x-molekul** (2.87, featureDefs): evidence[] alanına test/deploy/audit kanıtı bağla
- **cc-i18n-standards** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **dx-api-gateway** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **dx-workflow** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **fe-ai-rt** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **fe-cdn** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **fe-core-ui** (2.87, eca): evidence[] alanına test/deploy/audit kanıtı bağla
- **k-agent-runtime** (2.87, owasp): evidence[] alanına test/deploy/audit kanıtı bağla
- **k-authz** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **k-bus** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **k-schema** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **k-sozlesme** (2.87, performance): evidence[] alanına test/deploy/audit kanıtı bağla
- **k-surface** (2.87, performance): evidence[] alanına test/deploy/audit kanıtı bağla
- **l1-party** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **l1-pseo** (2.87, deployment): evidence[] alanına test/deploy/audit kanıtı bağla
- **l1-webhook-in** (2.87, testing): evidence[] alanına test/deploy/audit kanıtı bağla
- **landx-l1** (2.87, integration): evidence[] alanına test/deploy/audit kanıtı bağla; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-ai** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **s-clinic** (2.87, wcag): evidence[] alanına test/deploy/audit kanıtı bağla
- **s-clm** (2.87, owasp): evidence[] alanına test/deploy/audit kanıtı bağla
