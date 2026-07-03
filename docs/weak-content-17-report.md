# Zayıf İçerik Raporu — 17 Boyut (2026-07-03)

Zayıflık = audit motorunun içerik-zenginliği skoru (concreteness 0.45 + completeness 0.25 + applicability 0.30). Şema/kavram ihlali değildir; onlar ayrı kapılardadır. Üretici: `node tools/agents/report-weak-content.mjs`.

## Toplam sınıf dağılımı

short-items kartı: 1106 · generic kartı: 0 · empty-but-not-na: 0 · missing-evidence (node): 460 · missing-ref (kart): 1825 · rollback-gap: 0 · semantic-warn: 3178 · bilinçli N/A: 44

Top-40 zayıf node ortalama skoru: **2.716**

## Boyut bazlı zayıflık (short/generic/empty/warn)

| boyut | short | generic | empty | warn | toplam |
|---|---|---|---|---|---|
| performance | 177 | 0 | 0 | 348 | 525 |
| securityOptimization | 159 | 0 | 0 | 329 | 488 |
| codeOptimization | 76 | 0 | 0 | 396 | 472 |
| featureDefs | 16 | 0 | 0 | 394 | 410 |
| mobileApps | 130 | 0 | 0 | 274 | 404 |
| integration | 190 | 0 | 0 | 204 | 394 |
| deployment | 103 | 0 | 0 | 258 | 361 |
| testing | 49 | 0 | 0 | 291 | 340 |
| owasp | 50 | 0 | 0 | 267 | 317 |
| security | 78 | 0 | 0 | 171 | 249 |
| wcag | 78 | 0 | 0 | 154 | 232 |
| eca | 0 | 0 | 0 | 46 | 46 |
| moduleUsage | 0 | 0 | 0 | 32 | 32 |
| aiAgents | 0 | 0 | 0 | 14 | 14 |

## Seviye / küme ortalamaları

- module: 178 node, ort. 2.87
- app: 28 node, ort. 2.81
- archetype: 105 node, ort. 2.85
- micro_step: 19 node, ort. 2.85
- work_unit: 18 node, ort. 2.87
- component: 18 node, ort. 2.89
- feature: 101 node, ort. 2.84

En zayıf kümeler: atomic (2.74), backend (2.77), dx (2.79), vertical (2.79), data-intelligence (2.8), finance (2.8), supply-chain (2.8), aday (2.81)

## En zayıf 100 node

| skor | id | seviye | küme | en zayıf boyut | bayraklar |
|---|---|---|---|---|---|
| 2.59 | app-data-intelligence-x-atom | micro_step | data-intelligence | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.62 | app-finance-x-molecule | component | finance | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.65 | app-backend | app | backend | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.67 | app-layer1 | app | layer1 | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.68 | app-frontend | app | frontend | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.69 | app-data-intelligence-x-stone | feature | data-intelligence | owasp | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.69 | app-finance-x-atom | micro_step | finance | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.70 | be-v1-kapsam-disi | module | backend | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.71 | app-platform-horizontal | app | platform-horizontal | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | app-finance-x-element | work_unit | finance | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | app-hr | app | hr | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | fe-cdn | feature | frontend | owasp | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | s-tms | archetype | supply-chain | security | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | s-traceability | archetype | supply-chain | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | scale-gis | feature | scale | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | scale-ratelimit | feature | scale | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | scale-timeseries | feature | scale | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.72 | scale-workers-deep | feature | scale | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | app-customer-revenue | app | customer-revenue | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | atomic-types | module | atomic | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | l1-experiment | module | layer1 | security | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | l1-sitemap | module | layer1 | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | l1-webhook-in | feature | layer1 | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | s-ai-voice | archetype | data-intelligence | codeOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | s-audit | archetype | platform-horizontal | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | s-procurement | archetype | supply-chain | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | s-retail-execution | archetype | customer-revenue | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.73 | s-studio | archetype | platform-horizontal | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | app-atomic | app | atomic | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | app-content-collaboration | app | content-collaboration | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | app-supply-chain | app | supply-chain | codeOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | cc-a11y-backend | feature | crosscut | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | cc-fx-ledger | feature | crosscut | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | cc-jurisdiction-resolver | module | crosscut | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | dx-api-gateway | feature | dx | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | fe-deploy | feature | frontend | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | fe-mobile | feature | frontend | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | fe-monorepo | feature | frontend | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | l1-misc | module | layer1 | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | l1-tagmanager | module | layer1 | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | s-ai-governance | archetype | platform-horizontal | integration | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | s-clm | archetype | customer-revenue | owasp | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | s-conversational | archetype | data-intelligence | owasp | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | s-demand-planning | archetype | supply-chain | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | s-fsm | archetype | supply-chain | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | s-incentive | archetype | vertical | integration | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | s-workforce | archetype | hr | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.74 | scale-idempotency | feature | scale | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | app-finance-x-stone | feature | finance | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | app-hr-x-atom | micro_step | hr | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | be-mail-zinciri | module | backend | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | be-sdk | module | backend | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | cc-cultural-ux | feature | crosscut | security | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | cc-rollout | feature | crosscut | security | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | cc-security | feature | crosscut | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | cc-tr | feature | crosscut | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | l1-export | feature | layer1 | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | l1-party | module | layer1 | testing | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | l1-pseo | module | layer1 | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | l1-quiet-hours | feature | layer1 | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | l1-redirect | module | layer1 | integration | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | l1-search | module | layer1 | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-cmms | archetype | supply-chain | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-helpdesk | archetype | customer-revenue | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-membership | archetype | vertical | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-onboarding | archetype | hr | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-pos | archetype | core-operations | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-restaurant | archetype | vertical | security | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-revenue-copilot | archetype | customer-revenue | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.75 | s-subscription-analytics | archetype | finance | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | app-aday | app | aday | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | app-backend-x-atom | micro_step | backend | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | be-destek-matrisi | module | backend | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | be-kararlar | module | backend | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | cc-identity-models | feature | crosscut | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | cc-notification-consent | feature | crosscut | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | cc-obs-deep | feature | crosscut | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | dx-marketplace | module | dx | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | dx-workflow | module | dx | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | fe-ai-rt | feature | frontend | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | s-bi | archetype | data-intelligence | integration | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | s-data-catalog | archetype | data-intelligence | codeOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | s-dms | archetype | content-collaboration | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | s-event | archetype | content-collaboration | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | s-fleet | archetype | supply-chain | codeOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | s-wms | archetype | supply-chain | integration | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.76 | scale-outbox | feature | scale | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | app-build-x-atom | micro_step | build | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | app-layer0 | app | layer0 | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | be-deploy-profilleri | module | backend | integration | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | dist-ngo | module | aday | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | fe-anti | feature | frontend | security | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | l1-search-deep | feature | layer1 | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | s-ai-catalog | archetype | data-intelligence | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | s-cyber-grc | archetype | platform-horizontal | deployment | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | s-loyalty | archetype | customer-revenue | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | s-product-feed | module | customer-revenue | performance | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.77 | scale-projections | feature | scale | wcag | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.78 | app-backend-x-stone | feature | backend | securityOptimization | missing-evidence, missing-ref, semantic-warn, short-items |
| 2.78 | app-build-x-element | work_unit | build | mobileApps | missing-evidence, missing-ref, semantic-warn, short-items |

## Top-40 önerilen aksiyon planı

- **app-data-intelligence-x-atom** (2.59, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-finance-x-molecule** (2.62, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-backend** (2.65, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-layer1** (2.67, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-frontend** (2.68, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-data-intelligence-x-stone** (2.69, owasp): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-finance-x-atom** (2.69, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **be-v1-kapsam-disi** (2.70, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-platform-horizontal** (2.71, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-finance-x-element** (2.72, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-hr** (2.72, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **fe-cdn** (2.72, owasp): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-tms** (2.72, security): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-traceability** (2.72, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **scale-gis** (2.72, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **scale-ratelimit** (2.72, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **scale-timeseries** (2.72, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **scale-workers-deep** (2.72, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-customer-revenue** (2.73, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **atomic-types** (2.73, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **l1-experiment** (2.73, security): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **l1-sitemap** (2.73, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **l1-webhook-in** (2.73, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-ai-voice** (2.73, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-audit** (2.73, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-procurement** (2.73, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-retail-execution** (2.73, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **s-studio** (2.73, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-atomic** (2.74, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-content-collaboration** (2.74, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **app-supply-chain** (2.74, codeOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **cc-a11y-backend** (2.74, deployment): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **cc-fx-ledger** (2.74, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **cc-jurisdiction-resolver** (2.74, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **dx-api-gateway** (2.74, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **fe-deploy** (2.74, performance): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **fe-mobile** (2.74, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **fe-monorepo** (2.74, securityOptimization): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **l1-misc** (2.74, mobileApps): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)
- **l1-tagmanager** (2.74, wcag): evidence[] alanına test/deploy/audit kanıtı bağla; dolu kartı ilgili tek-kaynak standardına bağla (standardRefs); kartın must/anyOf kavramlarını içerecek gerçek içerik ekle; maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)

