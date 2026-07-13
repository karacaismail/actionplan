# Meta-Framework Implementation Development Plan

Tarih: 2026-07-08
Durum: Operasyonel handoff planı
Kapsam: `platform` implementation reposunda meta-framework geliştirmesinin bitene kadar yürütülmesi.

Bu doküman `actionplan` içinde ürün kodu yazmak için değildir. `actionplan`, bu işin plan/handoff/evidence kaynağıdır. Kernel, SDK, app-core, module ve app assembly kodu yalnız `docs/implementation-workspace-manifest.md` içinde tanımlanan implementation reposunda yürütülür.

## 1. Bitti Tanımı

Meta-framework "bitti" sayılmaz; aşağıdaki eşiklerin tamamı kanıtlanana kadar yalnız "yürütülüyor" durumundadır.

| Alan | Bitti eşiği | Evidence |
|---|---|---|
| Implementation repo | `platform` checkout'u remote, branch policy, CI ve test komutlarıyla doğrulanmış | `git remote -v`, CI URL, test logu |
| Kernel | Tenant, authz, event/outbox, ECA, audit, registry, migration, observability ve Module SDK sözleşmeleri çalışır | Contract testleri, unit/integration logları |
| SDK | Kernel public contract'larından deterministik typed SDK üretilir | Codegen logu, SDK testleri, forbidden-stack taraması |
| App-core | İlk app-core module capability, route/menu, event namespace, policy ve manifest sözleşmesiyle çalışır | App-core healthz, registry testi |
| Customer dikey dilimi | DB -> API/GraphQL -> UI -> audit -> tenant izolasyonu uçtan uca çalışır | E2E, tenant negatif test, deploy/smoke logu |
| İkinci ve üçüncü app/module | Framework tekrarlanabilirliği kopya kodsuz gösterilir | 2 ayrı PR, test/evidence, framework API değişiklik notu |
| Delivery döngüsü | Her done düğümünde PR, commit, CI, test, deploy ve rollback kanıtı actionplan'a geri yazılır | Evidence Patch + `npm run gen:reindex` + QA kapıları |

Bu eşikler tamamlanmadan "meta-framework bitti" denmez.

## 2. Aktör Sınırı

| Aktör | Yapar | Yapmaz |
|---|---|---|
| actionplan doc-maintainer | Plan, handoff, acceptance criteria, evidence beklentisi, çelişki/gap düzeltmesi | `platform` içine ürün kodu yazmaz |
| İnsan geliştirici | Implementation PR'larını okur, onaylar, merge eder, gerçek kanıtı üretir | AI çıktısını körlemesine merge etmez |
| Implementation coding agent | Verilen Agent Prompt'u `platform` branch'inde uygular, testleri koşturur, PR üretir | actionplan verisini kanıtsız done yapmaz |
| CI | Test, lint, security, e2e ve evidence kapılarını bloklar | İnsan review yerine geçmez |

## 3. Kaynak Sözleşmeler

Bu plan aşağıdaki dokümanları uygulama sırasına çevirir:

- `docs/implementation-workspace-manifest.md`
- `docs/kernel-sdk-app-delivery-sequence.md`
- `docs/core-contract-pack.md`
- `docs/task-to-code-contract.md`
- `docs/task-export-contract.md`
- `docs/ready-for-dev-gate.md`
- `docs/waterfall-developer-handoff.md`
- `docs/evidence-update-runbook.md`
- `docs/enterprise-dod.md`
- `docs/deploy-separation-runbooks.md`
- `docs/storybook-implementation.md` — UI/component wave'leri için Storybook foundation bağımlılığı: herhangi bir wave'in UI teslimatı (Customer UI, Surface işleri, Master Component'ler), Storybook toolchain foundation'ı (Wave SB-1: workspace/config + decorator'lar + static build CI) ve test kapıları (Wave SB-2) kurulmadan story-evidence üretemez; UI wave planlaması bu bağımlılığı sıraya alır.
- `docs/url-policy.md` + `src/data/url-policy/registry.json` — URL/route/host/resource kimliği işleri için tek politika ve makine registry'si; platform PR'ları ilgili route/resource/profile id'lerini tüketir, yeni grameri app içinde icat etmez.
- `docs/url-policy-implementation-directive.md` + `src/data/url-policy/implementation-program.json` — URLP-00–16 için exact branch/allowed-files/non-goals/redTests/testCommands/evidence/rollback/stopConditions ve WBS `urlp-00`–`urlp-16` zinciri; predecessor verified olmadan ardıl development açılmaz.

Çelişki halinde `docs/task-to-code-contract.md`, `docs/kernel-sdk-app-delivery-sequence.md` ve `docs/doc-maintainer-operating-boundary.md` üstündür.

## 4. Sürekli Yürütme Döngüsü

Bu döngü her task için tekrarlanır. İnsan "devam et" dediğinde actionplan tarafındaki doc-maintainer bu döngünün plan/handoff kısmını kapatmaya devam eder; implementation coding agent ise ayrı repo/branch'te kod üretir.

1. Actionplan'da sıradaki düğümü seç.
2. Düğümün fazını kontrol et.
3. Kod gerekiyorsa `phase=development`, `repoPath`, `testCommand` ve implementation sırası kapıları dolu olmalı.
4. Developer Brief / Agent Prompt / Evidence Patch exportlarını al.
5. `platform` reposunda `task/<task-id>-<slug>` branch'i aç.
6. Her acceptance criterion için önce kırmızı test yaz.
7. Minimum geçer kodu yaz.
8. Unit, integration, e2e, security, a11y ve build kapılarını çalıştır.
9. PR aç; AC -> test/evidence eşlemesini PR açıklamasına yaz.
10. İnsan review sonrası merge et.
11. Deploy veya staging smoke doğrulamasını tamamla.
12. Evidence Patch'i gerçek PR/CI/test/deploy kanıtlarıyla actionplan'a geri yaz.
13. `npm run gen:reindex` sonrası evidence writeback doğrulama zincirini ve en sonda `npm run qa:ci` çalıştır.
14. Sonraki düğüme geç.

URL/route programında “sonraki düğüm” serbest seçilmez: `urlp-00` ile başlanır ve yalnız `src/data/url-policy/implementation-program.json` predecessor zinciri izlenir. `qa:url-policy-implementation` kırmızıysa URLP implementation dispatch edilmez.

## 5. No-Go Kapıları

Bu koşullardan biri varsa implementation kodu başlatılmaz; önce plan/handoff düzeltilir.

- `platform` checkout'u yok veya remote/branch gerçekliği doğrulanmamış.
- Görev app seviyesinde ve doğrudan kod yazdırıyor.
- Kernel hazır değilken SDK kodu isteniyor.
- SDK hazır değilken app-core production kodu isteniyor.
- App-core hazır değilken app module development isteniyor.
- `traceability.repoPath` veya `traceability.testCommand` boş.
- `phase` development değilken production kodu isteniyor.
- Acceptance criteria test senaryosuna çevrilmemiş.
- Rollback beklentisi yok.
- Evidence taslağı gerçek PR/CI/test/deploy kanıtı gibi sunuluyor.
- Plan işi gerçek WBS düğümüne bağlanmamış veya karşılık gelen düğüm bulunmamış.
- URL/route etkili işte `urlPolicyRef`, registry route/resource/profile kaydı veya tenant/authorization negatif testi eksik.

## 6. WBS Node Bağlama Matrisi

Bu plan, soyut bir geliştirme isteği değildir. Her implementation PR'ı en az bir gerçek WBS düğümüne bağlanır. Aşağıdaki tablo mevcut node gerçekliğini gösterir; tamamı bu dokümanın yazıldığı anda `status=backlog`, `phase=requirements` durumundadır.

| Plan alanı | Birincil WBS node | Destek/bağımlı node'lar | Şu anki traceability durumu |
|---|---|---|---|
| Platform fabrika scope | `platform-factory` | `app-platform-horizontal`, `app-backend` | W0.1/W0.12 readiness gap belgelendi; minimal API/UI shell var, remote CI/deploy/tenant smoke kanıtı yok, `implementationStatus=not-started` |
| Tenant context | `platform-tenancy` | `k-tenancy`, `k-tenancy-deep` | W0.3 readiness gap belgelendi; API Faz 0 health/ping seviyesinde, tenant code/test yok, `implementationStatus=not-started` |
| Authn/AuthZ/PDP | `platform-authn-authz` | `k-authz`, `k-policy-pdp`, `k-actor`, `k-party` | W0.4 readiness gap belgelendi; backend auth/PDP yok, frontend public/no-auth, `implementationStatus=not-started` |
| DB schema / migration policy | `platform-db-schema` | `k-schema`, `platform-customer-model`, `platform-tenancy` | W0.9 readiness gap belgelendi; PostgreSQL compose var, API DB/ORM/Alembic code/test yok, `implementationStatus=not-started` |
| Event/outbox | `k-bus` | `s-event`, `platform-graphql-api`, `scale-outbox` | W0.5 readiness gap belgelendi; platform-specific node yok, event/outbox code/test yok, implementation PR'ı `k-bus` ve ilgili platform node'una evidence yazar |
| ECA runtime / workflow | `l1-workflow` | `dx-workflow`, `k-capability`, `k-bus` | W0.6 readiness gap belgelendi; platform-specific node yok, ECA/runtime code/test yok, önce readiness patch gerekir |
| Audit log | `l1-audit` | `s-audit`, `platform-observability`, `k-bus` | W0.7 readiness gap belgelendi; platform-specific node yok, compliance audit/activity code/test yok, önce readiness patch gerekir |
| Registry / module manifest | `k-capability` | `be-sdk`, `app-distribution-contract.md`, `k-policy-pdp` | W0.8 readiness gap belgelendi; platform-specific node yok, registry/manifest/capability code/test yok |
| Observability | `platform-observability` | `cc-obs`, `s-observability`, `l1-audit` | W0.10 readiness gap belgelendi; `/healthz` var, readiness/metrics/trace/logging code/test yok, `implementationStatus=not-started` |
| CI/CD / deploy | `platform-cicd` | `dx-api-gateway`, `deploy-separation-runbooks.md` | W0.2 readiness gap belgelendi; workflow dosyaları var, remote/CI run/branch policy kanıtı yok, `implementationStatus=not-started` |
| SDK | `be-sdk` | `dx-cli`, `dx-api-gateway`, `k-capability` | W0.11 readiness gap belgelendi; `packages/sdk` yok, codegen/public contract/test yok, development öncesi patch gerekir |
| Customer model | `platform-customer-model` | `customer`, `platform-db-schema` | `repoPath/testCommand` boş, `implementationStatus=not-started` |
| Customer API | `platform-customer-graphql` | `platform-graphql-api`, `platform-authn-authz` | `repoPath/testCommand` boş, `implementationStatus=not-started` |
| Customer UI | `platform-customer-ui` | `platform-ui-surface` | `repoPath/testCommand` boş, `implementationStatus=not-started` |
| Customer fixture | `platform-customer-seed` | `platform-seed-data`, `platform-customer-model` | `repoPath/testCommand` boş, `implementationStatus=not-started` |
| Reference app teaching track | `build-referans-uygulama` | `build-ilk-dikey-dilim` | OrderOps öğretici örnektir; canlı ilk dikey dilim Customer'dır |

WBS node'u olmayan platform-specific işlerde ilk PR ürün kodu değil, readiness patch'tir: ilgili mevcut node'a `refs`, `traceability.repoPath`, `traceability.testCommand`, acceptance-test eşlemesi ve evidence beklentisi eklenir. Bu patch yine actionplan plan verisidir; implementation kodu değildir.

2026-07-09 PR-01 remote unblock zinciri: owner yanıtı gelirse önce `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md`, sonra `docs/platform-pr01-remote-verification-runbook-2026-07-09.md`, ardından `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` çalışır. Bu zincir remote/default branch/Actions/branch-protection önkoşulunu sınıflandırır; gerçek PR URL, merge SHA ve CI run URL oluşmadan PR-01 veya meta-framework tamamlanmış sayılmaz.

## 7. Wave 0 — Implementation Workspace ve Kernel

Amaç: Çalışabilir platform çekirdeğini ve ilk dikey dilime giden minimum yürütme altyapısını kurmak.

| Sıra | WBS node | İş | Implementation hedefi | Test/evidence | Çıkış kapısı |
|---|---|---|---|---|---|
| W0.1 | `platform-factory` | Repo reality audit | `/Users/karaca/DEV/mimari/platform` | `git status --short --branch`, `git remote -v`, mevcut test komutları | Remote/branch/test gerçekliği belgelendi |
| W0.2 | `platform-cicd` | CI baseline | `.github/workflows`, `Makefile`, package/test config, remote/branch policy | CI run URL, `make test`, `pnpm test`, branch protection evidence | PR kapısında test çalışıyor ve remote kanıtı var |
| W0.3 | `platform-tenancy` | Tenant context | `apps/api/src/meta_api/tenancy.py`, `apps/api/tests/test_tenancy.py` | tenant missing, invalid tenant, cross-tenant negative tests | Tenant fail-closed |
| W0.4 | `platform-authn-authz` | Authn/AuthZ/PDP | `apps/api/src/meta_api/authn.py`, `authz.py`, `pdp.py`, `apps/api/tests/test_authn_authz.py` | permission allow/deny, missing guard testleri | Resolver/endpoint yetkisiz geçmiyor |
| W0.5 | `k-bus` | Event/outbox | `apps/api/src/meta_api/events.py`, `outbox.py`, `consumers.py`, `apps/api/tests/test_events_outbox.py` | transaction + outbox persistence + consumer idempotency | Event kaybı negatif testle kapanır |
| W0.6 | `l1-workflow` | ECA runtime | `apps/api/src/meta_api/eca.py`, `workflow.py`, `rulesets.py`, `apps/api/tests/test_eca_runtime.py` | rule match/no-match, max chain, disabled rule, forbidden action tests | Kural motoru tenant scoped |
| W0.7 | `l1-audit` | Audit log | `apps/api/src/meta_api/audit.py`, `activity.py`, `apps/api/tests/test_audit_log.py` | immutable audit append, actor/tenant envelope, tamper detection | Kritik action audit yazıyor |
| W0.8 | `k-capability` | Registry/manifest | `apps/api/src/meta_api/registry.py`, `module_manifest.py`, `capabilities.py`, `apps/api/tests/test_module_registry.py` | AppModule register, duplicate slug, invalid manifest, module healthz | Module kaydı deterministik |
| W0.9 | `platform-db-schema` | Migration policy | `apps/api/src/meta_api/db.py`, `models/base.py`, `apps/api/migrations`, Alembic | upgrade/downgrade, rollback smoke, tenant schema tests | Migration geri alınabilir |
| W0.10 | `platform-observability` | Observability | `apps/api/src/meta_api/observability.py`, `logging.py`, `apps/api/tests/test_observability.py` | trace id, metrics, health/ready, PII masking | Smoke ve incident evidence üretir |
| W0.11 | `be-sdk` | Module SDK contract | `packages/sdk`, public contract source, templates | codegen determinism, SDK public API tests, forbidden-stack scan | SDK elle editlenmeden üretilir |
| W0.12 | `platform-factory` | Hello Platform | `apps/api`, `apps/web` minimal shell | API health, UI smoke, tenant request, deploy/smoke evidence | İlk boot kanıtı var |

Wave 0 çıkış eşiği: Kernel contract testleri yeşil, Hello Platform boot ediyor, actionplan'daki ilgili düğümlere PR/CI/test evidence geri yazılmış.

## 8. Wave 1 — Customer Referans Dikey Dilimi

Amaç: Framework'ün gerçek bir app dilimini taşıdığını kanıtlamak.

| Sıra | WBS node | İş | Implementation hedefi | Test/evidence | Çıkış kapısı |
|---|---|---|---|---|---|
| W1.1 | `platform-factory` + `k-capability` | Customer app-core | `apps/api/src/meta_api/customer_core.py`, `apps/web/src/apps/customer` | app slug, capability, route/menu, event namespace testleri | App-core registry'ye bağlandı |
| W1.2 | `platform-customer-model` | Customer model | `apps/api/src/meta_api/models/customer.py` + Alembic migration | model unit, migration up/down, tenant RLS | DB katmanı tenant-safe |
| W1.3 | `platform-customer-graphql` | Customer GraphQL/API | `apps/api/src/meta_api/customer_graphql.py` | create/read/update, permission, tenant isolation | API contract çalışıyor |
| W1.4 | `platform-customer-ui` | Customer UI projection | `apps/web/src/apps/customer` React route/surface | smoke, a11y, empty/loading/error states | UI route çalışıyor |
| W1.5 | `platform-customer-graphql` + `l1-audit` + `k-bus` | Audit/event integration | `customer.created/updated` event bridge | audit append, outbox event, ECA trigger | Operasyon izi var |
| W1.6 | `platform-customer-seed` | Seed/demo data | `apps/api/seed/customer_seed.py` + fixture | deterministic seed, rollback clean | Demo tekrar kurulabilir |
| W1.7 | `platform-customer-ui` + `platform-customer-graphql` | End-to-end proof | `apps/web/e2e/customer.spec.ts` full stack | Playwright: login -> customer create -> read -> cross-tenant denied | Dikey dilim production aday |
| W1.8 | ilgili tüm Customer node'ları | Evidence writeback | actionplan node patch | PR/commit/CI/deploy/test evidence | actionplan done gerçeği yansıtır |

Wave 1 çıkış eşiği: Customer uçtan uca çalışır, tenant izolasyonu negatif testle kanıtlanır, UI ve API evidence actionplan'a geri yazılır.

2026-07-09 Wave 1 readiness sonucu: `platform` checkout'unda Customer app-core/model/API/UI/seed/e2e code yoktur. Mevcut storefront testi Customer kanıtı değildir. W1.1-W1.8 boşlukları `docs/platform-customer-app-core-readiness-gap-2026-07-09.md`, `docs/platform-customer-model-readiness-gap-2026-07-09.md`, `docs/platform-customer-graphql-readiness-gap-2026-07-09.md`, `docs/platform-customer-ui-readiness-gap-2026-07-09.md`, `docs/platform-customer-seed-readiness-gap-2026-07-09.md` ve `docs/platform-customer-e2e-evidence-readiness-gap-2026-07-09.md` içinde kayıtlıdır. W0 remote/CI ve kernel evidence tamamlanmadan Customer product code başlatılmaz.

## 9. Wave 2 — SDK ve Tekrarlanabilir App Üretimi

Amaç: Customer'ın özel proje değil, framework deseni olduğunu göstermek.

| Sıra | İş | Hedef | Evidence |
|---|---|---|---|
| W2.1 | SDK app template | `packages/sdk/templates/app-core` | Yeni app-core template testi |
| W2.2 | Module template | `packages/sdk/templates/module` | Registry + healthz + permission fixture |
| W2.3 | Generator guardrails | codegen/CLI | Forbidden stack, manual edit, missing test no-go testleri |
| W2.4 | Second vertical slice | Order/Agreement seçimi | Aynı kernel/SDK ile ikinci domain PR'ı |
| W2.5 | Third vertical slice | Inventory/Document seçimi | Farklı data shape ile üçüncü PR |
| W2.6 | Pattern extraction | docs + SDK API | Customer/Order/Inventory diff raporu |

Wave 2 çıkış eşiği: En az iki ek domain aynı kernel/SDK/app-core sözleşmesiyle kopya kodsuz çalışır.

2026-07-09 Wave 2 readiness sonucu: `platform` checkout'unda `packages/sdk`, app-core template, module template, generator guardrail, OrderOps vertical slice ve Inventory vertical slice yoktur. Customer vertical slice da henüz uygulanmadığı için W2.1-W2.6 product code başlatılmaz. Sıradaki implementation hedefleri ve no-go kapıları `docs/wave2-sdk-repeatability-readiness-gap-2026-07-09.md` içinde kayıtlıdır; Wave 2 domain sırası Customer sonrası OrderOps, ardından Inventory olarak kilitlenmiştir.

2026-07-09 Wave 2 PR handoff sonucu: Customer CUST-06 verified olduktan sonra izlenecek repeatability PR sırası `docs/platform-wave2-repeatability-pr-handoff-2026-07-09.md` içinde kilitlenmiştir: W2-01 app-core template, W2-02 module template, W2-03 generator guardrails, W2-04 OrderOps, W2-05 Inventory, W2-06 repeatability diff report. W2-06 geçmeden Wave 3 enterprise readiness başlatılmaz.

## 10. Wave 3 — Enterprise Readiness

Amaç: Framework'ü demo düzeyinden enterprise delivery düzeyine çıkarmak.

| Alan | Gerekli iş | Evidence |
|---|---|---|
| Security | OWASP, authz bypass, tenant escape, secret scan | Security CI logu |
| Performance | p95 hedefleri, N+1 sorgu tespiti, cache policy | Load test raporu |
| Accessibility | WCAG 2.2 AAA hedefi, keyboard, focus, contrast | axe/playwright raporu |
| Reliability | retry/idempotency, DLQ, migration rollback | Failure injection logu |
| Observability | trace, metrics, structured logs, dashboards | Dashboard/smoke kanıtı |
| Release | staging/prod separation, rollback drill | Deploy + rollback logu |
| Governance | CODEOWNERS, review policy, PR template | Branch protection evidence |

Wave 3 çıkış eşiği: Customer + iki app/module enterprise DoD kapısından geçer.

2026-07-09 Wave 3 readiness sonucu: `platform` checkout'unda local CI/deploy workflow dosyaları vardır; ancak remote/branch protection evidence, CODEOWNERS, PR template, security CI logu, load test raporu, failure injection logu, observability dashboard smoke, staging/prod ayrımı ve rollback drill kanıtı yoktur. Wave 0-Wave 2 gerçek PR/CI/test evidence tamamlanmadan Wave 3 release/enterprise claim başlatılmaz. Eksik kanıt seti `docs/wave3-enterprise-readiness-gap-2026-07-09.md` içinde kayıtlıdır.

2026-07-09 Wave 3 PR handoff sonucu: Wave 2 W2-06 verified olduktan sonra izlenecek enterprise PR sırası `docs/platform-wave3-enterprise-pr-handoff-2026-07-09.md` içinde kilitlenmiştir: W3-01 security, W3-02 performance, W3-03 accessibility, W3-04 reliability, W3-05 observability, W3-06 release/governance, W3-07 enterprise DoD evidence pack. W3-07 geçmeden Wave 4 portfolio scale başlatılmaz.

## 11. Wave 4 — Portfolio Scale

Amaç: 50+ uygulama vizyonunu framework ölçeğinde sürdürülebilir hale getirmek.

| İş | Kriter |
|---|---|
| Ready-to-code queue | actionplan'da implementation sırası, blocker ve evidence durumları görünür |
| App factory release train | app assembly manifestleri ve capability/entitlement listeleri üretilebilir |
| Module marketplace guardrails | signing, SBOM, permission diff, sandbox kararları uygulanır |
| Regression suite | Customer + ikinci/üçüncü app için smoke matrix çalışır |
| Evidence dashboard | Done iddiaları PR/CI/deploy/test kanıtına bağlıdır |
| Operational runbooks | Incident, rollback, migration, tenant support akışları vardır |

Wave 4 çıkış eşiği: Yeni app/module üretimi tekrarlanabilir, evidence'sız done mümkün değildir, regression suite framework kırılmalarını yakalar.

2026-07-09 Wave 4 readiness sonucu: `platform` checkout'unda ready-to-code queue artifact, app assembly manifest, capability/entitlement release train, module marketplace signing/SBOM/permission diff/sandbox guardrail, Customer+OrderOps+Inventory regression matrix, evidence dashboard veya incident/rollback/migration/tenant-support runbook seti yoktur. Wave 0-Wave 3 gerçek evidence tamamlanmadan portfolio-scale claim başlatılmaz. Eksik operating model ve kanıt seti `docs/wave4-portfolio-scale-readiness-gap-2026-07-09.md` içinde kayıtlıdır.

2026-07-09 Wave 4 PR handoff sonucu: Wave 3 W3-07 verified olduktan sonra izlenecek portfolio PR sırası `docs/platform-wave4-portfolio-pr-handoff-2026-07-09.md` içinde kilitlenmiştir: W4-01 ready-to-code queue, W4-02 app factory release train, W4-03 marketplace guardrails, W4-04 regression matrix, W4-05 evidence dashboard, W4-06 operations runbook drills, W4-07 portfolio scale exit report. W4-07 geçmeden "meta-framework portfolio scale tamamlandı" iddiası yazılmaz.

## 12. İlk 11 PR Sırası

Geliştirme başlatılacaksa ilk PR'lar bu sırayı izler. Bu liste, "nereden başlayalım?" sorusunu tekrar sormamak için kilitli başlangıç kuyruğudur. Branch formatı `task/<wbs-node-id>-<slug>` olmalıdır; WBS node id'si branch adında görünmeden PR açılmaz.

| PR | Branch | WBS node | Amaç | Non-goal |
|---|---|---|---|---|
| PR-01 | `task/platform-cicd-ci-baseline` | `platform-cicd` + `platform-factory` | GitHub remote, default branch hizası, CI baseline, ilk CI run URL'si | Ürün özelliği kodlama |
| PR-02 | `task/platform-tenancy-context` | `platform-tenancy` | Tenant context + fail-closed testleri | Authz ve UI |
| PR-03 | `task/platform-authz-pdp` | `platform-authn-authz` | Authn/AuthZ/PDP minimal contract | Customer domain |
| PR-04 | `task/k-bus-outbox-events` | `k-bus` | Event/outbox + idempotent consumer | ECA action çeşitleri |
| PR-05 | `task/l1-workflow-eca-runtime` | `l1-workflow` | ECA runtime + safe action allowlist | Visual workflow designer |
| PR-06 | `task/l1-audit-envelope` | `l1-audit` | Audit envelope + append-only log | Raporlama UI |
| PR-07 | `task/k-capability-registry` | `k-capability` | Module registry + manifest validation | Marketplace güvenliği |
| PR-08 | `task/platform-db-schema-migrations` | `platform-db-schema` | Alembic policy + rollback drill | Customer schema |
| PR-09 | `task/platform-observability` | `platform-observability` | health/ready/trace/metrics skeleton | Dashboard tasarımı |
| PR-10 | `task/be-sdk-public-contract` | `be-sdk` | SDK public ports + codegen guard | Full generator CLI |
| PR-11 | `task/platform-factory-hello-platform` | `platform-factory` | API + UI minimal boot smoke | Customer CRUD |

PR-11 geçmeden Customer dikey dilimi başlamaz.

PR-11 tamamlandıktan sonra Customer vertical slice PR sırası `docs/platform-customer-pr-execution-handoff-2026-07-09.md` ile kilitlidir: CUST-01 app-core, CUST-02 model, CUST-03 GraphQL/API, CUST-04 UI, CUST-05 seed, CUST-06 e2e/evidence writeback. CUST-06 evidence geri yazılmadan Wave 2 OrderOps/Inventory repeatability başlatılmaz.

W0.1 salt-okunur audit sonucu `docs/platform-repo-reality-audit-2026-07-09.md` içinde kayıtlıdır: checkout mevcuttur, branch `master`, worktree temizdir; ancak `git remote -v` boştur ve remote/CI kanıtı yoktur. W0.2 readiness gap sonucu `docs/platform-cicd-readiness-gap-2026-07-09.md` içinde kayıtlıdır: CI/deploy workflow dosyaları yerelde vardır, fakat remote, branch protection ve CI run kanıtı yoktur. W0.3 readiness gap sonucu `docs/platform-tenancy-readiness-gap-2026-07-09.md` içinde kayıtlıdır: API yalnız health/ping seviyesindedir, tenant code/test yoktur ve `k-tenancy` dependency henüz done değildir. W0.4 readiness gap sonucu `docs/platform-authn-authz-readiness-gap-2026-07-09.md` içinde kayıtlıdır: backend auth/PDP yoktur, frontend yalnız public/no-auth route taşır ve `k-authz`/`k-policy-pdp` dependency'leri done değildir. W0.5 readiness gap sonucu `docs/k-bus-event-outbox-readiness-gap-2026-07-09.md` içinde kayıtlıdır: event/outbox/consumer code yoktur ve `scale-outbox` dependency done değildir. W0.6 readiness gap sonucu `docs/l1-workflow-eca-readiness-gap-2026-07-09.md` içinde kayıtlıdır: ürün içi ECA/runtime yoktur; görülen workflow izleri yalnız GitHub Actions deploy dokümantasyonudur. W0.7 readiness gap sonucu `docs/l1-audit-readiness-gap-2026-07-09.md` içinde kayıtlıdır: audit/activity code yoktur; görülen log izleri yalnız container log runbook komutlarıdır. W0.8 readiness gap sonucu `docs/k-capability-registry-readiness-gap-2026-07-09.md` içinde kayıtlıdır: module registry/manifest/capability code yoktur; mevcut `/healthz` yalnız platform API healthz'dir. W0.9 readiness gap sonucu `docs/platform-db-schema-readiness-gap-2026-07-09.md` içinde kayıtlıdır: PostgreSQL compose var, ancak API DB/ORM/Alembic/migration code yoktur. W0.10 readiness gap sonucu `docs/platform-observability-readiness-gap-2026-07-09.md` içinde kayıtlıdır: `/healthz` vardır, ancak readiness/metrics/trace/structured logging code yoktur. W0.11 readiness gap sonucu `docs/be-sdk-readiness-gap-2026-07-09.md` içinde kayıtlıdır: `packages/sdk` yoktur, codegen/public contract/template/test yoktur. W0.12 readiness gap sonucu `docs/platform-hello-platform-readiness-gap-2026-07-09.md` içinde kayıtlıdır: minimal API/UI shell ve local smoke dosyaları vardır, fakat tenant request, remote CI, deploy/smoke ve PR evidence yoktur. Bu nedenle PR-01'in sıradaki işi remote + CI baseline kanıtını üretmektir; W0.3-W0.12 product code PR-01 geçmeden başlamaz.

2026-07-09 PR kuyruğu handoff sonucu: İlk 11 PR'ın branch, WBS node, önkoşul, non-goal, minimum implementation hedefi, test komutu ve evidence seti `docs/platform-initial-11-pr-execution-handoff-2026-07-09.md` içinde tek tek kilitlenmiştir. Bu belge product code üretildiği anlamına gelmez; implementation ajanının sırayı bozmasını, PR-01 geçmeden product code'a atlamasını ve evidence'sız done iddiasını engeller.

2026-07-09 execution queue sonucu: Foundation, Customer, Wave 2, Wave 3 ve Wave 4 PR zincirleri tek makine-okunur kuyruk olarak `reports/platform-implementation-execution-queue-2026-07-09.json` dosyasında ve insan-okunur olarak `docs/platform-implementation-execution-queue-2026-07-09.md` belgesinde birleştirilmiştir. Mevcut gerçekliğe göre tek `next-actionable` item PR-01 `task/platform-cicd-ci-baseline`dır; diğer tüm item'lar önceki verified evidence'e bağlıdır.

2026-07-09 PR-01 dispatch sonucu: 37 agent pack hazırlandıktan sonra implementation operatörünün sıradaki tek açılabilir işi yanlış sıraya sapmadan başlatması için `docs/platform-pr01-implementation-dispatch-2026-07-09.md` eklendi. Bu dispatch PR-01 operatör giriş dosyalarını, ilk durum tespiti komutlarını, stop koşullarını ve evidence writeback sınırını tek sayfada toplar; product code üretmez ve gerçek PR/CI/test kanıtı olmadan queue ilerletmez.

2026-07-09 PR-01 evidence intake sonucu: PR-01 implementation operatörü gerçek PR/CI paketi döndürdüğünde actionplan tarafında kabul/red yapılacak zorunlu alanlar ve queue writeback sırası `docs/platform-pr01-evidence-intake-template-2026-07-09.md` içinde kilitlendi. Bu template PR-01'i kapatmaz; placeholder URL, eksik merge SHA, kırmızı CI, doğrulanmamış remote/default branch veya product code diff'i varsa PR-01 `verified` yapılmaz ve PR-02 açılmaz.

2026-07-09 PR-01 blocker report sonucu: PR-01 operatörü remote/default branch/CI/permission stop koşuluna takılırsa fake PR/CI evidence yazmadan döneceği zorunlu blocker alanları `docs/platform-pr01-blocker-report-template-2026-07-09.md` içinde kilitlendi. Mevcut salt-okunur gözlemde `platform` branch'i `master`, `git remote -v` boş ve workflow dosyaları yereldedir; bu durum PR-01'i kapatmaz, yalnız gerçek remote/CI evidence gereksinimini görünür tutar.

2026-07-09 PR-01 current blocker sonucu: `/Users/karaca/DEV/mimari/platform` içinde `pwd`, `git status --short --branch`, `git branch --show-current`, `git remote -v`, workflow listesi ve `gh repo/run` hata çıktıları `docs/platform-pr01-current-blocker-report-2026-07-09.md` içinde kayıt altına alındı. Güncel blocker `missing-remote`dır; PR URL, merge SHA, CI run URL ve branch protection evidence yoktur, bu nedenle PR-01 `verified` yapılmadı ve PR-02 açılmadı.

2026-07-09 PR-01 remote unblock sonucu: `missing-remote` blocker'ını açmak için repo owner veya yetkili operatörden gereken canonical GitHub remote URL, default branch, PR branch izni, Actions/branch-protection okuma izni, required checks, deploy trigger kararı, secret evidence kapsamı ve review policy girdileri `docs/platform-pr01-remote-unblock-request-2026-07-09.md` içinde kilitlendi. Bu belge remote eklemez, PR açmaz ve PR-01'i verified yapmaz; yalnız unblock için gereken owner input sözleşmesini verir.

2026-07-09 PR-01 remote unblock response intake sonucu: Owner veya yetkili operatör remote unblock yanıtı döndürdüğünde placeholder/varsayım içermediğini, default branch/permission/check/review bilgilerinin kabul edilebilir olduğunu ve queue'nun kanıtsız ilerlemeyeceğini doğrulamak için `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md` eklendi. Bu intake owner yanıtını doğrular; remote eklemez, PR açmaz, CI çalıştırmaz ve PR-01'i verified yapmaz.

2026-07-09 PR-01 remote verification runbook sonucu: Owner unblock yanıtı kabul edilirse implementation operatörünün `git remote -v`, `gh repo view`, `gh run list` ve branch protection API kanıtlarını hangi sırayla alacağını ve hangi stop koşullarında yeni blocker döneceğini `docs/platform-pr01-remote-verification-runbook-2026-07-09.md` içinde kilitlendi. Bu runbook remote eklemez, PR açmaz, CI çalıştırmaz ve gerçek PR/CI evidence olmadan PR-01'i verified yapmaz.

2026-07-09 PR-01 agent pack sonucu: Sıradaki tek açılabilir item olan PR-01 için implementation operatörünün kullanacağı sıkı Agent Prompt, operator checklist ve evidence patch taslağı `docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack remote URL uydurmayı, product code'a atlamayı ve CI/test zayıflatmayı yasaklar.

2026-07-09 PR-02 agent pack sonucu: PR-01 verified olduktan sonra açılacak tenancy context işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-01 evidence yokken kod yazmayı, authz/PDP'ye veya Customer/UI/domain işine atlamayı ve tenant isolation testlerini zayıflatmayı yasaklar; queue statüsü PR-01 kapanana kadar `blocked-by-PR-01` kalır.

2026-07-09 PR-03 agent pack sonucu: PR-02 verified olduktan sonra açılacak Authz/PDP işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-02 evidence yokken kod yazmayı, Customer/billing/UI işine atlamayı, event/outbox veya audit implementation başlatmayı ve deny-by-default negatif testlerini zayıflatmayı yasaklar; queue statüsü PR-02 kapanana kadar `blocked-by-PR-02` kalır.

2026-07-09 PR-04 agent pack sonucu: PR-03 verified olduktan sonra açılacak Event/Outbox işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr04-event-outbox-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-03 evidence yokken kod yazmayı, ECA runtime/workflow designer/Customer/UI işine atlamayı, harici broker eklemeyi ve exactly-once iddiası kurmayı yasaklar; queue statüsü PR-03 kapanana kadar `blocked-by-PR-03` kalır.

2026-07-09 PR-05 agent pack sonucu: PR-04 verified olduktan sonra açılacak ECA Runtime işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr05-eca-runtime-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-04 evidence yokken kod yazmayı, visual workflow designer/Customer workflow/scheduler/audit implementation başlatmayı ve serbest JS/SQL/shell action çalıştırmayı yasaklar; queue statüsü PR-04 kapanana kadar `blocked-by-PR-04` kalır.

2026-07-09 PR-06 agent pack sonucu: PR-05 verified olduktan sonra açılacak Audit Envelope işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr06-audit-envelope-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-05 evidence yokken kod yazmayı, reporting UI/Customer audit/SIEM export/retention işine atlamayı, container loglarını audit trail gibi sunmayı ve activity feed'i compliance audit yerine koymayı yasaklar; queue statüsü PR-05 kapanana kadar `blocked-by-PR-05` kalır.

2026-07-09 PR-07 agent pack sonucu: PR-06 verified olduktan sonra açılacak Capability Registry işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-06 evidence yokken kod yazmayı, marketplace security/app-store UI/Customer app-core/SDK generator işine atlamayı ve dynamic plugin runtime açmayı yasaklar; queue statüsü PR-06 kapanana kadar `blocked-by-PR-06` kalır.

2026-07-09 PR-08 agent pack sonucu: PR-07 verified olduktan sonra açılacak DB Schema/Migrations işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-07 evidence yokken kod yazmayı, Customer/domain schema başlatmayı, Prisma/Supabase eklemeyi ve rollback/downgrade testi olmayan migration üretmeyi yasaklar; queue statüsü PR-07 kapanana kadar `blocked-by-PR-07` kalır.

2026-07-09 PR-09 agent pack sonucu: PR-08 verified olduktan sonra açılacak Observability işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr09-observability-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-08 evidence yokken kod yazmayı, dashboard product UI/Customer observability/incident platformu işine atlamayı, PII loglamayı ve yüksek kardinalite metrics label'ları üretmeyi yasaklar; queue statüsü PR-08 kapanana kadar `blocked-by-PR-08` kalır.

2026-07-09 PR-10 agent pack sonucu: PR-09 verified olduktan sonra açılacak SDK Public Contract işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-09 evidence yokken kod yazmayı, full generator CLI/app template/Customer CRUD işine atlamayı, nondeterministic codegen üretmeyi ve generated-output guard testlerini zayıflatmayı yasaklar; queue statüsü PR-09 kapanana kadar `blocked-by-PR-09` kalır.

2026-07-09 PR-11 agent pack sonucu: PR-10 verified olduktan sonra açılacak Hello Platform Boot Smoke işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-10 evidence yokken kod yazmayı, Customer CRUD/OrderOps/Inventory işine atlamayı, local smoke'u remote CI evidence yerine koymayı ve Foundation complete iddiasını kanıtsız yazmayı yasaklar; queue statüsü PR-10 kapanana kadar `blocked-by-PR-10` kalır.

2026-07-09 CUST-01 agent pack sonucu: PR-11 verified olduktan sonra açılacak Customer App-Core işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-cust01-customer-app-core-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack PR-11 evidence yokken kod yazmayı, Customer model/API/UI/seed işine atlamayı, route/menu shell'i capability guard olmadan public göstermeyi ve `customer.*` namespace collision testini atlamayı yasaklar; queue statüsü PR-11 kapanana kadar `blocked-by-PR-11` kalır.

2026-07-09 CUST-02 agent pack sonucu: CUST-01 verified olduktan sonra açılacak Customer Model işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-cust02-customer-model-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack CUST-01 evidence yokken kod yazmayı, GraphQL/API/UI/seed işine atlamayı, tenant_id olmayan Customer modeli kurmayı ve downgrade testlenmeyen migration üretmeyi yasaklar; queue statüsü CUST-01 kapanana kadar `blocked-by-CUST-01` kalır.

2026-07-09 CUST-03 agent pack sonucu: CUST-02 verified olduktan sonra açılacak Customer GraphQL/API işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-cust03-customer-graphql-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack CUST-02 evidence yokken kod yazmayı, UI/seed/e2e işine atlamayı, tenant guard olmadan resolver açmayı ve audit/outbox evidence testlerini atlamayı yasaklar; queue statüsü CUST-02 kapanana kadar `blocked-by-CUST-02` kalır.

2026-07-09 CUST-04 agent pack sonucu: CUST-03 verified olduktan sonra açılacak Customer UI işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-cust04-customer-ui-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack CUST-03 evidence yokken kod yazmayı, backend schema/model/API/seed değiştirmeyi, capability guard olmadan navigation açmayı ve generic Surface/Vitrin smoke'u Customer UI kanıtı gibi sunmayı yasaklar; queue statüsü CUST-03 kapanana kadar `blocked-by-CUST-03` kalır.

2026-07-09 CUST-05 agent pack sonucu: CUST-04 verified olduktan sonra açılacak Customer Seed işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-cust05-customer-seed-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack CUST-04 evidence yokken kod yazmayı, gerçek müşteri verisi/production PII eklemeyi, UI/API/model/migration değiştirmeyi ve idempotency testini atlamayı yasaklar; queue statüsü CUST-04 kapanana kadar `blocked-by-CUST-04` kalır.

2026-07-09 CUST-06 agent pack sonucu: CUST-05 verified olduktan sonra açılacak Customer E2E + Evidence Writeback işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-cust06-customer-e2e-evidence-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack CUST-05 evidence yokken kod yazmayı, OrderOps/Inventory/Wave 2 işine atlamayı, fake PR/CI/deploy/test kanıtı yazmayı ve gerçek evidence olmadan Customer node'larını verified yapmayı yasaklar; queue statüsü CUST-05 kapanana kadar `blocked-by-CUST-05` kalır.

2026-07-09 W2-01 agent pack sonucu: CUST-06 verified olduktan sonra açılacak SDK App-Core Template işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack `packages/sdk/templates/app-core` manifest/route/menu/capability/event skeleton ve deterministic render kanıtını ister; SDK module template, full generator CLI, Customer/OrderOps/Inventory domain code ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W2-02 agent pack sonucu: W2-01 verified olduktan sonra açılacak SDK Module Template işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack `packages/sdk/templates/module` manifest, healthz fixture, permission fixture ve deterministic render kanıtını ister; generator guardrails, marketplace runtime, OrderOps/Inventory domain code ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W2-03 agent pack sonucu: W2-02 verified olduktan sonra açılacak SDK Generator Guardrails işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack manual-edit guard, forbidden-stack guard, missing-test no-go, byte-stable output ve deterministik guardrail report kanıtını ister; Customer/OrderOps/Inventory domain code, marketplace runtime ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W2-04 agent pack sonucu: W2-03 verified olduktan sonra açılacak OrderOps Vertical Slice işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w2-04-orderops-vertical-slice-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack OrderOps model/migration, GraphQL/authz/audit/outbox, UI capability gate, e2e smoke ve tenant negative kanıtını ister; Inventory, marketplace runtime, Customer rewrite ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W2-05 agent pack sonucu: W2-04 verified olduktan sonra açılacak Inventory Vertical Slice işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w2-05-inventory-vertical-slice-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack Inventory model/migration, farklı data shape invariant, GraphQL/authz/audit/outbox, UI capability gate, e2e smoke ve tenant negative kanıtını ister; marketplace, dördüncü domain, W2-06 final diff report ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W2-06 agent pack sonucu: W2-05 verified olduktan sonra açılacak SDK Repeatability Diff Report işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack Customer/OrderOps/Inventory repeatability report, copy-code threshold, üç domain backend/web e2e regression, generator/template evidence refs ve manual review kanıtını ister; yeni domain, Wave 3 feature ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W3-01 agent pack sonucu: W2-06 verified olduktan sonra açılacak Enterprise Security Gates işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack OWASP/ZAP veya eşdeğer security report, authz bypass, tenant escape, audit deny/immutability/tamper ve secret scan kanıtını ister; product feature, yeni domain, diğer Wave 3 işleri ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W3-02 agent pack sonucu: W3-01 verified olduktan sonra açılacak Enterprise Performance Gates işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w3-02-enterprise-performance-gates-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack p95 load report, N+1 detection, cache policy ve threshold pass/fail kanıtını ister; security/tenant/authz/audit guard bypass, yeni domain, feature work ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W3-03 agent pack sonucu: W3-02 verified olduktan sonra açılacak Enterprise Accessibility Gates işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack Customer/OrderOps/Inventory axe, keyboard, focus ve contrast kanıtını ister; UI redesign, feature work, diğer Wave 3 işleri ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W3-04 agent pack sonucu: W3-03 verified olduktan sonra açılacak Enterprise Reliability Gates işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w3-04-enterprise-reliability-gates-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack retry/idempotency, DLQ/failure injection ve migration rollback drill kanıtını ister; workflow designer, observability dashboard, W3-06 release governance, domain feature work ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W3-05 agent pack sonucu: W3-04 verified olduktan sonra açılacak Enterprise Observability Gates işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w3-05-enterprise-observability-gates-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack metrics smoke, trace propagation, structured log PII masking ve dashboard smoke kanıtını ister; analytics product, incident platform, W3-06 release governance, domain feature work ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W3-06 agent pack sonucu: W3-05 verified olduktan sonra açılacak Enterprise Release + Governance işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack staging/prod separation, deploy/rollback logu, CODEOWNERS, PR template, branch protection, required checks ve release risk register kanıtını ister; product feature, W3-07 DoD pack, W4 portfolio work ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W3-07 agent pack sonucu: W3-06 verified olduktan sonra açılacak Enterprise DoD Evidence Pack işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w3-07-enterprise-dod-evidence-pack-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack `reports/enterprise-readiness.md`, Customer/OrderOps/Inventory Enterprise DoD matrix, W3-01..W3-06 evidence links bundle ve actionplan evidence patch kanıtını ister; W4 portfolio scale, product feature ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W4-01 agent pack sonucu: W3-07 verified olduktan sonra açılacak Ready-To-Code Queue Export işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w4-01-ready-to-code-queue-export-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack `reports/ready-to-code-queue.json`, blocker/evidence status validation logu ve ready queue summary kanıtını ister; product feature, W4-02 app factory, W4-05 evidence dashboard ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W4-02 agent pack sonucu: W4-01 verified olduktan sonra açılacak App Factory Release Train işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack Customer/OrderOps/Inventory app manifest, capability/entitlement list ve compose config smoke kanıtını ister; marketplace, fourth domain, Product CRUD ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W4-03 agent pack sonucu: W4-02 verified olduktan sonra açılacak Module Marketplace Guardrails işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w4-03-module-marketplace-guardrails-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack signing verification, SBOM/provenance artifact, permission diff report, sandbox/no-egress testleri ve `tools/check-module-marketplace-security.mjs` CI gate kanıtını ister; public marketplace launch, commercial storefront, AI module approval/quarantine lift/sandbox loosen ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W4-04 agent pack sonucu: W4-03 verified olduktan sonra açılacak Portfolio Regression Matrix işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w4-04-portfolio-regression-matrix-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack Customer/OrderOps/Inventory smoke, tenant/authz/audit regression matrix ve web e2e regression evidence ister; dördüncü domain, yeni app, yeni feature ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W4-05 agent pack sonucu: W4-04 verified olduktan sonra açılacak Evidence Dashboard Blockers işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w4-05-evidence-dashboard-blockers-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack `reports/evidence-dashboard.json`, done-without-evidence blocker test, stale/placeholder evidence blocker ve dashboard smoke kanıtını ister; yeni app/module/product feature ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W4-06 agent pack sonucu: W4-05 verified olduktan sonra açılacak Operations Runbook Drills işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w4-06-operations-runbook-drills-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack incident, rollback, migration ve tenant-support runbook dosyaları, drill logları, owner/review date ve risk register evidence ister; canlı deploy, yeni product feature ve gerçek evidence olmadan actionplan status ilerletmeyi yasaklar.

2026-07-09 W4-07 agent pack sonucu: W4-06 verified olduktan sonra açılacak Portfolio Scale Exit Report işi için implementation operatör prompt'u, checklist ve evidence patch taslağı `docs/platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md` içinde kilitlenmiştir. Bu pack W4-01..W4-06 gerçek evidence linkleri, portfolio-scale exit report, actionplan evidence patch, manual-review note ve meta-framework-not-done note ister; gerçek PR/CI/test/deploy/drill evidence olmadan portfolio scale verified veya meta-framework bitti iddiası yazmayı yasaklar.

## 13. Readiness Patch Formatı

Implementation başlamadan önce ilgili WBS node'u development'a alınacaksa aşağıdaki plan patch'i hazırlanır. Bu patch gerçek kod değildir; kod başlamadan önce developer handoff'u makine-okunur hale getirir.

```json
{
  "id": "<wbs-node-id>",
  "refs": [
    "docs/meta-framework-implementation-development-plan.md",
    "docs/core-contract-pack.md",
    "docs/kernel-sdk-app-delivery-sequence.md"
  ],
  "traceability": {
    "repoPath": [
      "apps/api/<package-or-module>",
      "tests/<test-path>"
    ],
    "testCommand": [
      "<exact command>"
    ],
    "deployTarget": "staging or local smoke target",
    "implementationStatus": "scaffolded"
  }
}
```

Readiness patch sonrası node/evidence doğrulama zinciri çalışır. Bu kapılar yeşil değilse implementation agent'a kod görevi verilmez.

## 14. Actionplan'a Geri Yazılacak Kanıt

Her implementation PR'ı bitince ilgili node için şu evidence seti zorunludur:

- `pr:<url>`
- `commit:<sha>`
- `ci:<url>`
- `test-log:<url-or-path>`
- `deploy:<url-or-env>` veya `smoke:<log>`
- `rollback:<log-or-note>`
- `manual-review:<reviewer/date>`

Geri yazma `docs/evidence-update-runbook.md` ile yapılır. Kanıt yoksa `status=done` yazılmaz.

## 15. Doğrulama Zincirleri

Docs-only plan/handoff değişikliklerinde:

```bash
npm run qa:waterfall
npm run qa:content
npm run test:content
npm run lint
npm run qa:ready
npm run qa:exec
npm run qa:delivery-sequence
npm run qa:vibecoding
node tools/agents/check-secrets.mjs
```

Node/evidence geri yazımında:

```bash
npm run gen:reindex
npm run qa:data
npm run qa:exec
npm run qa:ready
npm run qa:waterfall
npm run qa:content
npm run qa:dimensions
npm run qa:vibecoding
npm run test:content
npm run lint
node tools/agents/check-secrets.mjs
npm run qa:ci
```

Geniş veri veya schema değişikliğinde:

```bash
npm run qa:ci
```

`--write-baseline` veya benzeri ratchet kilitleme komutları bu zincirlere dahil değildir. Bunlar yalnız bilinçli baseline iyileştirmesi olduğunda ayrı review ile çalıştırılır.

## 16. Ritim

Bu plan "tek büyük proje" gibi değil, küçük PR dizisi gibi işletilir.

- Günlük: Sıradaki en küçük PR, kırmızı test, yeşil test, PR.
- Her PR sonunda: Evidence Patch, actionplan reindex, ilgili QA kapıları.
- Her wave sonunda: Wave exit report, kalan blocker listesi, yeni risk/rollback güncellemesi.
- Her no-go'da: Kod durur, actionplan handoff eksikliği düzeltilir.

## 17. Şu Anki Gerçek Durum

Bu dokümanın eklendiği anda actionplan tarafı plan/handoff katmanındadır. Meta-framework implementation'ın bittiği veya yazılımın geliştirildiği iddia edilmez. Bu plan, vizyonu gerçek yazılıma çevirmek için gereken implementation backlog'unu ve kanıt kapılarını açık hale getirir.
