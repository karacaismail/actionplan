# actionplan — Doküman Dizini

Bu klasördeki tüm kanonik dokümanların tek-bakışta haritası. (GitHub `docs/` klasörünü açınca bu sayfayı gösterir.) Amaç: hiçbir doküman "fark edilmemiş" kalmasın.

**Okuma sırası önerisi (yeni gelen):** `developer-guide.md` → `doc-maintainer-operating-boundary.md` → `task-to-code-contract.md` → `kernel-sdk-app-delivery-sequence.md` → `engineering-standards-index.md` → ilgili plan/sözleşme.

---

## 1. Kararlar (ADR — Architecture Decision Record)

Mimari kararların kayıt defteri. (Not: 25 numaralı ADR ayrıca WBS'te `app-kararlar` kümesinde düğüm olarak izlenir; buradakiler doküman-ADR'lerdir.)

- [adr-0026-tech-profiles.md](adr-0026-tech-profiles.md) — Frontend stack'in makine-okunur, şema-bağlı, headless-kilitli tek-kaynak tanımı (tech-profiles).
- [adr-0027-engineering-standards.md](adr-0027-engineering-standards.md) — Mühendislik standardı işletim katmanı: sözleşme + referans (standardRefs) + applicability + waivers + CI kapıları.
- [adr-geo-visualization.md](adr-geo-visualization.md) — Coğrafi görselleştirme sınırı: deck.gl + MapLibre (iş grafikleri ECharts'ta kalır).

## 2. Kanonik Sözleşmeler (bağlayıcı kurallar)

Projedeki "doğru"yu tanımlayan, çelişen her şeyi geçersiz kılan bağlayıcı belgeler.

- [task-to-code-contract.md](task-to-code-contract.md) — Bir WBS düğümünün yazılım-teslimat karşılığı: seviye→teslimat, faz→eylem, "şimdi ne yapılır" karar ağacı.
- [doc-maintainer-operating-boundary.md](doc-maintainer-operating-boundary.md) — actionplan üzerinde çalışan Codex/doc-maintainer için dokümantasyon bakım rolü ile implementation coding rolünü ayıran bağlayıcı sınır.
- [kernel-sdk-app-delivery-sequence.md](kernel-sdk-app-delivery-sequence.md) — Kernel → SDK → app-core → app module → app assembly teknik teslim sırası.
- [task-export-contract.md](task-export-contract.md) — Görev/JSON dışa aktarım sözleşmesi (tam içerik + çözülmüş bağımlılık URL'leri).
- [implementation-workspace-manifest.md](implementation-workspace-manifest.md) — Görev exportlarının yönleneceği implementation checkout'u, repo kökleri, komutlar ve yasak stack sınırı.
- [core-contract-pack.md](core-contract-pack.md) — Çekirdek sözleşme paketi v1 (kapsamlı temel sözleşmeler).
- [app-distribution-contract.md](app-distribution-contract.md) — Uygulama dağıtım sözleşmesi: global app'in izole/SDK sınırı, paylaşım ve dağıtım kuralları.
- [icerik-kalite-sozlesmesi.md](icerik-kalite-sozlesmesi.md) — İçerik kalitesi tanımı ("Definition of Deep"): bir boyut ne zaman "yeterli".
- [wbs-field-semantics.md](wbs-field-semantics.md) — WBS ilişki alanlarının (dependsOn/blocks/related) anlam sözleşmesi.
- [ready-for-dev-gate.md](ready-for-dev-gate.md) — Definition of Ready: development fazına geçiş kapısı (10/10).
- [waterfall-developer-handoff.md](waterfall-developer-handoff.md) — Geliştirici başlayabilir mi sorusunun go/no-go cevabı; plan-start ile code-start ayrımı.
- [release-policy.md](release-policy.md) — Sürüm/yayın politikası (semver, changelog, rollback).
- [waiver-policy.md](waiver-policy.md) — Standarttan bilinçli sapmanın (waiver) yaşam döngüsü: gerekçe + onay + süre.

## 3. Mühendislik Standartları (ADR-0027 katmanı)

15 tek-kaynak standardı + bağlayan dokümanlar. Başlangıç: dizin sayfası.

- [engineering-standards-index.md](engineering-standards-index.md) — **HUB**: üç-grup modeli + 15 standardın tablosu + standardRef eşlemesi.
- [i18n-standard.md](i18n-standard.md) — 15. mühendislik standardı: çok-dil/locale/RTL/currency/timezone/tax-legal-localization/data-residency + çeviri iş-akışı + fallback.
- [ci-conformance-gates.md](ci-conformance-gates.md) — CI conformance kapıları kataloğu (her kapı ne zorlar, hangi dosya).
- [standards-applicability-matrix.md](standards-applicability-matrix.md) — Hangi standart/boyut hangi WBS seviyesine uygulanır (N/A disiplini).
- [dimension-migration-runbook.md](dimension-migration-runbook.md) — Tarihsel lazy migration runbook'u; güncel 17-boyut sözleşmesi için `dimension-contract-17.md` ve `src/schemas/task.ts` esas alınır.
- [evidence-taxonomy.md](evidence-taxonomy.md) — Kanıt taksonomisi: ne kanıt sayılır, ne sayılmaz.
- [prompt-template-library.md](prompt-template-library.md) — Boyut üretim prompt şablonları (vibecoding).
- [golden-node-examples.md](golden-node-examples.md) — Altın düğüm referans deseni (tüm standardRefs dolu örnek).

## 4. Planlar & Yol Haritaları

- [roadmap-pm-paritesi.md](roadmap-pm-paritesi.md) — PM paritesi (Jira/ClickUp boşluğu) + AI-üretim fazlı yol haritası.
- [platform-wbs-plan.md](platform-wbs-plan.md) — Platform build-out WBS düğüm ağacı spec'i (en kapsamlı plan).
- [meta-framework-implementation-development-plan.md](meta-framework-implementation-development-plan.md) — `platform` implementation reposunda meta-framework'ün bitene kadar hangi PR/wave/evidence sırasıyla geliştirileceğini tanımlayan operasyonel handoff planı.
- [next-30-days-plan.md](next-30-days-plan.md) — 30 günlük execution planı (veri kalitesi + execution readiness).
- [eylem-plani-derinlestirme-master.md](eylem-plani-derinlestirme-master.md) — İçerik derinleştirme + sözleşme tamamlama master planı.
- [archetype-uretim-spec.md](archetype-uretim-spec.md) — ArcheType üretim/düzenleme spec'i (AI-first, güvenli, admin-yönetimli).
- [surface-spec.md](surface-spec.md) — Surface (yüzey) spec'i: SurfaceContract, techProfileRef bağı, sayfa=Surface modeli, i18n/locale taşıma.
- [kume-e-panel-eca-plan.md](kume-e-panel-eca-plan.md) — Küme E: panel ECA görünürlük + simülasyon mimari planı.
- [governance-plan.md](governance-plan.md) — Repo governance planı (CODEOWNERS, branch koruma, kapılar).

## 5. Rehberler & Runbook'lar

- [developer-guide.md](developer-guide.md) — **Geliştirici rehberi (buradan başla)**: repo nasıl çalışır, akış.
- [waterfall-developer-handoff.md](waterfall-developer-handoff.md) — Waterfall geliştirici handoff kapısı ve başlangıç koşulları.
- [evidence-update-runbook.md](evidence-update-runbook.md) — Kanıt (evidence) güncelleme adım adım runbook.

## 6. Denetim & Boşluk (Gap) Raporları

Durum tespiti ve eksik analizleri (zaman damgalı; tarihsel olabilir).

- [audit-report.md](audit-report.md) — İçerik denetim (audit) raporu.
- [data-quality-report.md](data-quality-report.md) — Veri kalitesi raporu (nodes.json).
- [repo-reality-audit.md](repo-reality-audit.md) — Repo gerçeklik denetimi (plan vs gerçek kod).
- [platform-repo-reality-audit-2026-07-09.md](platform-repo-reality-audit-2026-07-09.md) — `platform` implementation checkout'u için W0.1 salt-okunur gerçeklik denetimi; remote/CI blocker'larını görünür yapar.
- [platform-cicd-readiness-gap-2026-07-09.md](platform-cicd-readiness-gap-2026-07-09.md) — `platform-cicd` için W0.2 readiness gap kaydı; CI dosyaları mevcutken eksik remote, branch policy ve CI run kanıtlarını ayırır.
- [platform-tenancy-readiness-gap-2026-07-09.md](platform-tenancy-readiness-gap-2026-07-09.md) — `platform-tenancy` için W0.3 readiness gap kaydı; mevcut API'nin tenant code/test taşımadığını ve fail-closed handoff hedeflerini belgeler.
- [platform-authn-authz-readiness-gap-2026-07-09.md](platform-authn-authz-readiness-gap-2026-07-09.md) — `platform-authn-authz` için W0.4 readiness gap kaydı; backend auth/PDP eksikliğini, public frontend durumunu ve default-deny test hedeflerini belgeler.
- [k-bus-event-outbox-readiness-gap-2026-07-09.md](k-bus-event-outbox-readiness-gap-2026-07-09.md) — `k-bus` için W0.5 readiness gap kaydı; event/outbox kodu yokken transactional outbox ve idempotent consumer handoff hedeflerini belgeler.
- [l1-workflow-eca-readiness-gap-2026-07-09.md](l1-workflow-eca-readiness-gap-2026-07-09.md) — `l1-workflow` için W0.6 readiness gap kaydı; ürün içi ECA/runtime yokken safe action allowlist ve max-chain test hedeflerini belgeler.
- [l1-audit-readiness-gap-2026-07-09.md](l1-audit-readiness-gap-2026-07-09.md) — `l1-audit` için W0.7 readiness gap kaydı; compliance audit/activity kodu yokken append-only log ve tamper detection handoff hedeflerini belgeler.
- [k-capability-registry-readiness-gap-2026-07-09.md](k-capability-registry-readiness-gap-2026-07-09.md) — `k-capability` için W0.8 readiness gap kaydı; module registry/manifest kodu yokken duplicate slug, module healthz ve entitlement test hedeflerini belgeler.
- [platform-db-schema-readiness-gap-2026-07-09.md](platform-db-schema-readiness-gap-2026-07-09.md) — `platform-db-schema` için W0.9 readiness gap kaydı; PostgreSQL compose mevcutken API DB/ORM/Alembic ve reversible migration boşluklarını belgeler.
- [platform-observability-readiness-gap-2026-07-09.md](platform-observability-readiness-gap-2026-07-09.md) — `platform-observability` için W0.10 readiness gap kaydı; `/healthz` mevcutken readiness, metrics, trace ve structured logging boşluklarını belgeler.
- [be-sdk-readiness-gap-2026-07-09.md](be-sdk-readiness-gap-2026-07-09.md) — `be-sdk` için W0.11 readiness gap kaydı; `packages/sdk` yokken public contract, deterministic codegen ve SDK test hedeflerini belgeler.
- [platform-hello-platform-readiness-gap-2026-07-09.md](platform-hello-platform-readiness-gap-2026-07-09.md) — `platform-factory` için W0.12 readiness gap kaydı; minimal API/UI shell mevcutken tenant request, remote CI ve deploy/smoke evidence boşluklarını belgeler.
- [platform-customer-app-core-readiness-gap-2026-07-09.md](platform-customer-app-core-readiness-gap-2026-07-09.md) — Wave 1 Customer app-core için registry, capability, route/menu ve event namespace boşluklarını belgeler.
- [platform-customer-model-readiness-gap-2026-07-09.md](platform-customer-model-readiness-gap-2026-07-09.md) — Customer model için tenant-aware model, migration ve constraint test hedeflerini belgeler.
- [platform-customer-graphql-readiness-gap-2026-07-09.md](platform-customer-graphql-readiness-gap-2026-07-09.md) — Customer GraphQL/API ve audit/event integration boşluklarını belgeler.
- [platform-customer-ui-readiness-gap-2026-07-09.md](platform-customer-ui-readiness-gap-2026-07-09.md) — Customer React route/surface/form ve a11y test hedeflerini belgeler.
- [platform-customer-seed-readiness-gap-2026-07-09.md](platform-customer-seed-readiness-gap-2026-07-09.md) — Customer deterministic seed/golden fixture boşluklarını belgeler.
- [platform-customer-e2e-evidence-readiness-gap-2026-07-09.md](platform-customer-e2e-evidence-readiness-gap-2026-07-09.md) — Customer end-to-end proof ve evidence writeback boşluklarını belgeler.
- [wave2-sdk-repeatability-readiness-gap-2026-07-09.md](wave2-sdk-repeatability-readiness-gap-2026-07-09.md) — Wave 2 SDK template/generator tekrar üretilebilirliği ile OrderOps ve Inventory vertical slice no-go kapılarını belgeler.
- [wave3-enterprise-readiness-gap-2026-07-09.md](wave3-enterprise-readiness-gap-2026-07-09.md) — Wave 3 security/performance/a11y/reliability/observability/release/governance enterprise evidence boşluklarını belgeler.
- [wave4-portfolio-scale-readiness-gap-2026-07-09.md](wave4-portfolio-scale-readiness-gap-2026-07-09.md) — Wave 4 app factory release train, marketplace guardrails, regression matrix, evidence dashboard ve operasyon runbook boşluklarını belgeler.
- [platform-initial-11-pr-execution-handoff-2026-07-09.md](platform-initial-11-pr-execution-handoff-2026-07-09.md) — İlk 11 implementation PR'ının branch, önkoşul, test, non-goal ve evidence sözleşmesini tek tek kilitler.
- [platform-customer-pr-execution-handoff-2026-07-09.md](platform-customer-pr-execution-handoff-2026-07-09.md) — PR-11 sonrası Customer vertical slice PR sırasını app-core, model, API, UI, seed ve e2e/evidence aşamalarıyla kilitler.
- [platform-wave2-repeatability-pr-handoff-2026-07-09.md](platform-wave2-repeatability-pr-handoff-2026-07-09.md) — Customer sonrası SDK template/generator, OrderOps, Inventory ve repeatability diff PR sırasını kilitler.
- [platform-wave3-enterprise-pr-handoff-2026-07-09.md](platform-wave3-enterprise-pr-handoff-2026-07-09.md) — Wave 3 security, performance, accessibility, reliability, observability, release/governance ve enterprise DoD evidence PR sırasını kilitler.
- [platform-wave4-portfolio-pr-handoff-2026-07-09.md](platform-wave4-portfolio-pr-handoff-2026-07-09.md) — Wave 4 ready queue, app factory, marketplace, regression, evidence dashboard, operations drills ve portfolio exit PR sırasını kilitler.
- [platform-implementation-execution-queue-2026-07-09.md](platform-implementation-execution-queue-2026-07-09.md) — Foundation, Customer, Wave 2, Wave 3 ve Wave 4 PR zincirlerini tek execution queue ve blocker/evidence görünümünde birleştirir.
- [platform-pr01-implementation-dispatch-2026-07-09.md](platform-pr01-implementation-dispatch-2026-07-09.md) — 37 agent pack hazırlandıktan sonra tek next-actionable item olan PR-01 için operatör giriş dosyalarını, ilk komutları, stop koşullarını ve evidence writeback sınırını tek sayfada verir.
- [platform-pr01-evidence-intake-template-2026-07-09.md](platform-pr01-evidence-intake-template-2026-07-09.md) — PR-01 gerçek implementation evidence geldiğinde PR URL, merge SHA, CI URL, remote/default branch/branch protection, rollback/manual-review ve queue writeback kabul/red kurallarını verir.
- [platform-pr01-blocker-report-template-2026-07-09.md](platform-pr01-blocker-report-template-2026-07-09.md) — PR-01 operatörü remote/default branch/CI/permission stop koşuluna takılırsa fake evidence üretmeden hangi komut çıktılarıyla blocker raporu döneceğini kilitler.
- [platform-pr01-current-blocker-report-2026-07-09.md](platform-pr01-current-blocker-report-2026-07-09.md) — Mevcut salt-okunur platform checkout'unda `git remote -v` boş olduğu için PR-01'in neden gerçek PR/CI evidence üretemediğini komut çıktılarıyla kaydeder.
- [platform-pr01-remote-unblock-request-2026-07-09.md](platform-pr01-remote-unblock-request-2026-07-09.md) — PR-01 `missing-remote` blocker'ını açmak için owner/operatörden gereken gerçek remote URL, default branch, Actions/branch-protection permission ve review/check girdilerini tanımlar.
- [platform-pr01-remote-unblock-response-intake-2026-07-09.md](platform-pr01-remote-unblock-response-intake-2026-07-09.md) — Owner remote unblock yanıtı geldiğinde placeholder/varsayım içermediğini, default branch/permission/check/review bilgilerinin kabul edilebilir olduğunu doğrulama kurallarını verir.
- [platform-pr01-remote-verification-runbook-2026-07-09.md](platform-pr01-remote-verification-runbook-2026-07-09.md) — Owner yanıtı kabul edilirse remote/default branch/Actions/branch-protection doğrulamasının hangi komutlarla ve hangi stop koşullarıyla yapılacağını verir.
- [platform-pr01-remote-verification-evidence-report-template-2026-07-09.md](platform-pr01-remote-verification-evidence-report-template-2026-07-09.md) — Remote verification komut çıktılarının `remote-verified`, `blocked` veya `rejected-output` olarak nasıl raporlanacağını ve PR-01 evidence intake'e nasıl yönleneceğini kilitler.
- [platform-pr01-ci-baseline-agent-pack-2026-07-09.md](platform-pr01-ci-baseline-agent-pack-2026-07-09.md) — Queue'daki tek next-actionable item olan PR-01 için implementation ajan promptu, operator checklist ve evidence patch taslağını verir.
- [platform-pr02-tenancy-context-agent-pack-2026-07-09.md](platform-pr02-tenancy-context-agent-pack-2026-07-09.md) — PR-01 verified olduktan sonra açılacak PR-02 tenancy context işi için fail-closed tenant promptu, operator checklist ve evidence patch taslağını verir.
- [platform-pr03-authz-pdp-agent-pack-2026-07-09.md](platform-pr03-authz-pdp-agent-pack-2026-07-09.md) — PR-02 verified olduktan sonra açılacak PR-03 Authz/PDP işi için deny-by-default promptu, operator checklist ve evidence patch taslağını verir.
- [platform-pr04-event-outbox-agent-pack-2026-07-09.md](platform-pr04-event-outbox-agent-pack-2026-07-09.md) — PR-03 verified olduktan sonra açılacak PR-04 Event/Outbox işi için transactional outbox, idempotent consumer ve at-least-once evidence taslağını verir.
- [platform-pr05-eca-runtime-agent-pack-2026-07-09.md](platform-pr05-eca-runtime-agent-pack-2026-07-09.md) — PR-04 verified olduktan sonra açılacak PR-05 ECA Runtime işi için safe action allowlist, max-chain guard ve forbidden action evidence taslağını verir.
- [platform-pr06-audit-envelope-agent-pack-2026-07-09.md](platform-pr06-audit-envelope-agent-pack-2026-07-09.md) — PR-05 verified olduktan sonra açılacak PR-06 Audit Envelope işi için append-only audit, tamper detection ve activity/audit separation evidence taslağını verir.
- [platform-pr07-capability-registry-agent-pack-2026-07-09.md](platform-pr07-capability-registry-agent-pack-2026-07-09.md) — PR-06 verified olduktan sonra açılacak PR-07 Capability Registry işi için manifest validation, duplicate slug ve entitlement gate evidence taslağını verir.
- [platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md](platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md) — PR-07 verified olduktan sonra açılacak PR-08 DB Schema/Migrations işi için Alembic baseline, downgrade ve tenant schema evidence taslağını verir.
- [platform-pr09-observability-agent-pack-2026-07-09.md](platform-pr09-observability-agent-pack-2026-07-09.md) — PR-08 verified olduktan sonra açılacak PR-09 Observability işi için health/ready, metrics, trace propagation ve structured logging evidence taslağını verir.
- [platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md](platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md) — PR-09 verified olduktan sonra açılacak PR-10 SDK Public Contract işi için public API snapshot, deterministic codegen ve generated-output guard evidence taslağını verir.
- [platform-pr11-hello-platform-agent-pack-2026-07-09.md](platform-pr11-hello-platform-agent-pack-2026-07-09.md) — PR-10 verified olduktan sonra açılacak PR-11 Hello Platform Boot Smoke işi için API/UI/tenant/SDK smoke ve Foundation exit evidence taslağını verir.
- [platform-cust01-customer-app-core-agent-pack-2026-07-09.md](platform-cust01-customer-app-core-agent-pack-2026-07-09.md) — PR-11 verified olduktan sonra açılacak CUST-01 Customer App-Core işi için app slug, capability route/menu guard ve `customer.*` namespace evidence taslağını verir.
- [platform-cust02-customer-model-agent-pack-2026-07-09.md](platform-cust02-customer-model-agent-pack-2026-07-09.md) — CUST-01 verified olduktan sonra açılacak CUST-02 Customer Model işi için tenant-aware model, migration round-trip ve constraint evidence taslağını verir.
- [platform-cust03-customer-graphql-agent-pack-2026-07-09.md](platform-cust03-customer-graphql-agent-pack-2026-07-09.md) — CUST-02 verified olduktan sonra açılacak CUST-03 Customer GraphQL/API işi için tenant-filtered query, permission, audit ve event evidence taslağını verir.
- [platform-cust04-customer-ui-agent-pack-2026-07-09.md](platform-cust04-customer-ui-agent-pack-2026-07-09.md) — CUST-03 verified olduktan sonra açılacak CUST-04 Customer UI işi için route render, capability-hidden navigation, form state ve a11y/focus evidence taslağını verir.
- [platform-cust05-customer-seed-agent-pack-2026-07-09.md](platform-cust05-customer-seed-agent-pack-2026-07-09.md) — CUST-04 verified olduktan sonra açılacak CUST-05 Customer Seed işi için idempotent seed, golden fixture, tenant-separated seed ve rollback/clean evidence taslağını verir.
- [platform-cust06-customer-e2e-evidence-agent-pack-2026-07-09.md](platform-cust06-customer-e2e-evidence-agent-pack-2026-07-09.md) — CUST-05 verified olduktan sonra açılacak CUST-06 Customer E2E + Evidence Writeback işi için full vertical slice smoke, tenant negative suite ve actionplan evidence patch taslağını verir.
- [platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md](platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md) — CUST-06 verified olduktan sonra açılacak W2-01 SDK App-Core Template işi için app-core template, deterministic render ve forbidden-stack evidence taslağını verir.
- [platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md](platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md) — W2-01 verified olduktan sonra açılacak W2-02 SDK Module Template işi için module manifest, healthz fixture, permission fixture ve deterministic render evidence taslağını verir.
- [platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md](platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md) — W2-02 verified olduktan sonra açılacak W2-03 SDK Generator Guardrails işi için manual-edit, forbidden-stack, missing-test no-go ve byte-stable output evidence taslağını verir.
- [platform-w2-04-orderops-vertical-slice-agent-pack-2026-07-09.md](platform-w2-04-orderops-vertical-slice-agent-pack-2026-07-09.md) — W2-03 verified olduktan sonra açılacak W2-04 OrderOps Vertical Slice işi için model/API/UI/e2e, tenant negative ve Inventory non-goal evidence taslağını verir.
- [platform-w2-05-inventory-vertical-slice-agent-pack-2026-07-09.md](platform-w2-05-inventory-vertical-slice-agent-pack-2026-07-09.md) — W2-04 verified olduktan sonra açılacak W2-05 Inventory Vertical Slice işi için farklı data shape, model/API/UI/e2e ve marketplace non-goal evidence taslağını verir.
- [platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md](platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md) — W2-05 verified olduktan sonra açılacak W2-06 SDK Repeatability Diff Report işi için Customer/OrderOps/Inventory diff, copy-code threshold ve Wave 3 no-go evidence taslağını verir.
- [platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md](platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md) — W2-06 verified olduktan sonra açılacak W3-01 Enterprise Security Gates işi için OWASP/security CI, authz bypass, tenant escape, audit deny ve secret scan evidence taslağını verir.
- [platform-w3-02-enterprise-performance-gates-agent-pack-2026-07-09.md](platform-w3-02-enterprise-performance-gates-agent-pack-2026-07-09.md) — W3-01 verified olduktan sonra açılacak W3-02 Enterprise Performance Gates işi için p95 load, N+1 detection ve cache policy evidence taslağını verir.
- [platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md](platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md) — W3-02 verified olduktan sonra açılacak W3-03 Enterprise Accessibility Gates işi için Customer/OrderOps/Inventory axe, keyboard, focus ve contrast evidence taslağını verir.
- [platform-w3-04-enterprise-reliability-gates-agent-pack-2026-07-09.md](platform-w3-04-enterprise-reliability-gates-agent-pack-2026-07-09.md) — W3-03 verified olduktan sonra açılacak W3-04 Enterprise Reliability Gates işi için retry/idempotency, DLQ/failure injection ve migration rollback drill evidence taslağını verir.
- [platform-w3-05-enterprise-observability-gates-agent-pack-2026-07-09.md](platform-w3-05-enterprise-observability-gates-agent-pack-2026-07-09.md) — W3-04 verified olduktan sonra açılacak W3-05 Enterprise Observability Gates işi için metrics smoke, trace propagation, structured log PII masking ve dashboard smoke evidence taslağını verir.
- [platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md](platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md) — W3-05 verified olduktan sonra açılacak W3-06 Enterprise Release + Governance işi için staging/prod separation, deploy/rollback, CODEOWNERS, PR template, branch protection ve required checks evidence taslağını verir.
- [platform-w3-07-enterprise-dod-evidence-pack-agent-pack-2026-07-09.md](platform-w3-07-enterprise-dod-evidence-pack-agent-pack-2026-07-09.md) — W3-06 verified olduktan sonra açılacak W3-07 Enterprise DoD Evidence Pack işi için enterprise readiness report, üç domain DoD matrix, evidence links bundle ve actionplan evidence patch taslağını verir.
- [platform-w4-01-ready-to-code-queue-export-agent-pack-2026-07-09.md](platform-w4-01-ready-to-code-queue-export-agent-pack-2026-07-09.md) — W3-07 verified olduktan sonra açılacak W4-01 Ready-To-Code Queue Export işi için queue artifact, blocker/evidence status validation ve ready queue summary evidence taslağını verir.
- [platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md](platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md) — W4-01 verified olduktan sonra açılacak W4-02 App Factory Release Train işi için Customer/OrderOps/Inventory manifest, capability/entitlement list ve compose config smoke evidence taslağını verir.
- [platform-w4-03-module-marketplace-guardrails-agent-pack-2026-07-09.md](platform-w4-03-module-marketplace-guardrails-agent-pack-2026-07-09.md) — W4-02 verified olduktan sonra açılacak W4-03 Module Marketplace Guardrails işi için signing, SBOM/provenance, permission diff, sandbox/no-egress ve marketplace security gate evidence taslağını verir.
- [platform-w4-04-portfolio-regression-matrix-agent-pack-2026-07-09.md](platform-w4-04-portfolio-regression-matrix-agent-pack-2026-07-09.md) — W4-03 verified olduktan sonra açılacak W4-04 Portfolio Regression Matrix işi için Customer/OrderOps/Inventory smoke, tenant/authz/audit matrix ve web e2e regression evidence taslağını verir.
- [platform-w4-05-evidence-dashboard-blockers-agent-pack-2026-07-09.md](platform-w4-05-evidence-dashboard-blockers-agent-pack-2026-07-09.md) — W4-04 verified olduktan sonra açılacak W4-05 Evidence Dashboard Blockers işi için dashboard JSON, done-without-evidence blocker ve dashboard smoke evidence taslağını verir.
- [platform-w4-06-operations-runbook-drills-agent-pack-2026-07-09.md](platform-w4-06-operations-runbook-drills-agent-pack-2026-07-09.md) — W4-05 verified olduktan sonra açılacak W4-06 Operations Runbook Drills işi için incident/rollback/migration/tenant-support runbook, drill log ve owner/review date evidence taslağını verir.
- [platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md](platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md) — W4-06 verified olduktan sonra açılacak W4-07 Portfolio Scale Exit Report işi için W4-01..W4-06 kanıtlarını, evidence patch'i ve meta-framework-not-done notunu bağlayan exit evidence taslağını verir.
- [developer-workflow-gap-analysis.md](developer-workflow-gap-analysis.md) — Geliştirici akışı boşluk analizi.
- [kernel-sdk-app-sequence-gap-report-2026-07-08.md](kernel-sdk-app-sequence-gap-report-2026-07-08.md) — Kernel → SDK → app-core → app module sırası gap raporu ve uygulanan düzeltme.
- [doc-maintainer-boundary-gap-report-2026-07-08.md](doc-maintainer-boundary-gap-report-2026-07-08.md) — Codex/doc-maintainer rol sınırı denetimi ve uygulanan dokümantasyon düzeltmeleri.
- [implementation-prompt-boundary-gap-report-2026-07-08.md](implementation-prompt-boundary-gap-report-2026-07-08.md) — Claude/Cursor/vibecoding prompt dokümanlarındaki kalan rol sınırı riskleri ve düzeltmeleri.
- [implementation-workspace-reality-gap-report-2026-07-08.md](implementation-workspace-reality-gap-report-2026-07-08.md) — `platform` WBS kümesi ile yerel implementation checkout'u arasındaki ayrım, branch/remote gerçekliği ve uygulanan düzeltmeler.
- [historical-gap-report-freshness-gap-report-2026-07-08.md](historical-gap-report-freshness-gap-report-2026-07-08.md) — Tarihsel gap/audit raporlarının güncel kapı, standart ve workspace gerçekliğiyle çelişmemesi için yapılan düzeltmeler.
- [execution-readiness-gap.md](execution-readiness-gap.md) — Execution readiness boşluk analizi.
- [enterprise-dod.md](enterprise-dod.md) — Enterprise-ready uygulama "Definition of Done".
- [core-enterprise-maturity-ladder.md](core-enterprise-maturity-ladder.md) — Çekirdek kurumsal olgunluk merdiveni: enterprise-hazırlık seviyeleri ve geçiş kapıları.
- [gap-2026-07-02-00-index.md](gap-2026-07-02-00-index.md) — 2026-07-02 çok-ajan gap denetimi ana indeksi ve P0/P1 bulgu özeti.
- [gap-2026-07-02-01-kernel.md](gap-2026-07-02-01-kernel.md) — Kernel katmanı boşluk raporu: KMS, tenant lifecycle, metering, provider ve kod-köprüsü eksikleri.
- [gap-2026-07-02-02-archetype.md](gap-2026-07-02-02-archetype.md) — ArcheType katmanı boşluk raporu: workflow, ledger, order, inventory, messaging ve fixture eksikleri.
- [gap-2026-07-02-03-surface.md](gap-2026-07-02-03-surface.md) — Surface katmanı boşluk raporu: panel tier, archetypeRef çapraz-kontrolü ve eksik yüzey tipleri.
- [gap-2026-07-02-05-uygulama-raporu.md](gap-2026-07-02-05-uygulama-raporu.md) — 2026-07-02 uygulama raporu: eklenen yönergeler, kapılar, fixture ve kalan insan-kararı işleri.
- [work-unit-molecule-gap-claude-vibecoding-2026-07-02.md](work-unit-molecule-gap-claude-vibecoding-2026-07-02.md) — Tarihsel Work unit / molekül yürütülebilirlik gap raporu; güncel handoff için Raw JSON, Developer Brief, Agent Prompt, Evidence Patch ve Vobecoder Card exportları kullanılır.
- [micro-step-atom-gap-claude-vibecoding-2026-07-02.md](micro-step-atom-gap-claude-vibecoding-2026-07-02.md) — Tarihsel Micro step / atom yürütülebilirlik gap raporu; güncel handoff için Raw JSON, Developer Brief, Agent Prompt, Evidence Patch ve Vobecoder Card exportları kullanılır.

## 7. AI Yönergeleri

- [claude-ai-archetype-eca-directive.md](claude-ai-archetype-eca-directive.md) — AI ArcheType + backend ECA güvenlik sınırları yönergesi.

## 8. Repo Kökü

- [../README.md](../README.md) — proje girişi.
- [../AGENTS.md](../AGENTS.md) — AI ajan çalışma sözleşmesi (test-önce, headless, standardRefs referansı).
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — katkı kuralları.
- [../SECURITY.md](../SECURITY.md) — güvenlik politikası.

## 9. Atomik Katman — Atom / Fragment / ArcheType

ArcheType engine'i besleyen değer-tipi tabanının yönergeleri ve analizleri. Okuma sırası (yeni gelen): netleştirme → yönergeler → geliştirici rehberi.

- [atomic-types-directive.md](atomic-types-directive.md) — Atom kademesi (`platform_fieldtypes`): üç kademe modeli, Katman A/B/C katalog, parametreli value-type, `Range<T>`, 13 sözleşme boyutu, `check-atomic-types`.
- [fragments-directive.md](fragments-directive.md) — Fragment (mini-archetype) kademesi: `platform_fragments` kanonik kütüphane (Address/PersonName/ContactPoint), cross-field validation, storage kuralı, `check-fragments`.
- [atomik-tip-gelistirici-yonergesi.md](atomik-tip-gelistirici-yonergesi.md) — Geliştirici rehberi: alan tasarımında atom/fragment/archetype seçimi (5-test), param beyanı, CLM+PIM worked örnekleri, anti-pattern'ler.
- [atomik-netlestirme-2026-07-01.md](atomik-netlestirme-2026-07-01.md) — Nihai netleştirme: üç kademe + 5-test karar kuralı + U1 kararı (Address = Fragment) + çözülen unknown-unknowns.
- [atomik-primitif-katman-gap-2026-07-01.md](atomik-primitif-katman-gap-2026-07-01.md) — Gap + gereksinim + unknown-unknowns raporu (üç-kaynak çelişkisi, 13 boyut).
- [atomik-tip-katalogu-tam-2026-07-01.md](atomik-tip-katalogu-tam-2026-07-01.md) — Tam katalog (~42 tip): Katman A/B/C/D + cross-cutting + registry + test-vektörü.
- [atom-archetype-bagi-clm-ornegi-2026-07-01.md](atom-archetype-bagi-clm-ornegi-2026-07-01.md) — Atom→archetype bağı CLM örneğiyle: agreement/obligation/signature alanları → atomlar.

## 10. Agreement OS / CLM — Sözleşme Yaşam Döngüsü (Probe)

CLM ürün fikri, kernel/archetype/surface yönergelerinin stres-testidir (probe). Üretilen yeni primitif yönergeleri **jeneriktir** — HRMS/satınalma/e-ticaret sözleşmeleri de kullanır.

- [reference/Agreement-CLM-Gereksinim-Analizi.md](reference/Agreement-CLM-Gereksinim-Analizi.md) — CLM ürün gereksinim analizi (agreement graph, 12 modül, e-imza seviyeleri, AI-first, fazlar, deployment).
- [kapsama-matrisi-agreement-clm-2026-07-01.md](kapsama-matrisi-agreement-clm-2026-07-01.md) — CLM yeteneği × kernel/archetype/surface kapsama matrisi (VAR/KISMİ/EKSİK) + atom bağı.
- [agreement-clm-app-referans.md](agreement-clm-app-referans.md) — üç katmanın CLM ürününe kompozisyonu (12 modül → primitif eşleme + uçtan-uca akış).
- **Kernel:** [k-signature-trust-directive.md](k-signature-trust-directive.md) (e-imza/eIDAS/5070/PAdES-XAdES-CAdES) · [k-evidence-seal-directive.md](k-evidence-seal-directive.md) (kriptografik kanıt/LTV/WORM) · [k-obligation-commitment-directive.md](k-obligation-commitment-directive.md) (yükümlülük/yenileme/gelir-kaçağı) · [k-provider-adapter-directive.md](k-provider-adapter-directive.md) (BYO sağlayıcı port) · [k-migration-bridge-directive.md](k-migration-bridge-directive.md) (audit-koruyan import) · [k-legal-hold-retention-directive.md](k-legal-hold-retention-directive.md) (legal hold/retention/e-discovery).
- **Archetype:** [archetype-agreement-lifecycle-negotiation-directive.md](archetype-agreement-lifecycle-negotiation-directive.md) (agreement graph + müzakere) · [archetype-document-composition-directive.md](archetype-document-composition-directive.md) (şablon→madde→montaj→render).
- **Surface:** [surface-esign-document-addendum.md](surface-esign-document-addendum.md) (doküman/imza yüzeyi) · [surface-counterparty-portal-addendum.md](surface-counterparty-portal-addendum.md) (dış-taraf portal).

## 11. Execution-Contract Katmanı — "AI üretti, nasıl güvenirim?"

Kernel kararlarını **çalıştırılabilir sözleşme + negatif test + kanıt + gate** seviyesine indiren yönergeler (P0 eleştirisine yanıt; mevcut sözleşmeleri UZLAŞTIRIR, çelişki eklemez). Atom-disiplinini kernel execution'a taşır.

- [kernel-execution-contract-matrix.md](kernel-execution-contract-matrix.md) — her action'da zorunlu actor/tenant/idempotency/audit/policy/side-effect/rollback + typed-action vs generated-CRUD sınırı ("AI üretti, production-ready mi?" matrisi).
- [execution-context-envelope-directive.md](execution-context-envelope-directive.md) — ActorContext/TenantContext/PolicyContext tek canonical envelope; gateway-header-trust yasağı; her yolda (request/job/event/webhook/import/AI) aynı zarf.
- [archetype-storage-canonical-directive.md](archetype-storage-canonical-directive.md) — storage çelişkisini kapatan canonical hüküm (öneri: shared-tablo+JSONB+promotion; ADR-A5 insan onayı bekler).
- [event-replay-projection-contract.md](event-replay-projection-contract.md) — at-least-once + idempotent consumer + ordering (aggregate_version) + DLQ + replay + zorunlu negatif testler; "exactly-once" dili yasak.
- [privacy-retention-decision-matrix.md](privacy-retention-decision-matrix.md) — 8 veri sınıfı × 9 muamele matrisi + çatışma kuralları (silme hakkı ⟂ değişmez audit/finansal ⟂ bitemporal ⟂ legal-hold); `k-legal-hold` genişletmesi.
- [dod-evidence-schema-directive.md](dod-evidence-schema-directive.md) — high-risk düğümde makine-kontrol DoD + kanıt şeması + AI sahte-yeşil test tespit ritüeli + 60+ ekip reddetme checklist'i.
- [deploy-separation-runbooks.md](deploy-separation-runbooks.md) — docs-viewer / local product / Hetzner production 3 ayrı runbook (GitHub Pages ≠ product production deploy).

## 12. Güvenlik + Vibecoding Operasyonu (P1)

Portföy güvenliği ve 60+ yaş, 3 kişilik ekip için AI-üretim operasyonu.

- [marketplace-module-security-directive.md](marketplace-module-security-directive.md) — dış modül güvenlik yaşam döngüsü: module signing, SBOM/provenance, permission-diff, malicious-update karantina, sandbox (ağ/dosya/process default-deny), modül-tablo RLS, exfiltration testleri.
- [vibecoding-prompt-playbook.md](vibecoding-prompt-playbook.md) — her görevde kopyalanabilir prompt → beklenen dosyalar → test yeşil → negatif test kırmızı→yeşil → manuel kontrol → **reddetme kriteri**; örnek domain (Customer→Order) adım adım büyür.

## 13. 2026-07-02 Gap Kapatma Yönergeleri

Araştırma turunda eksik bulunan kernel / archetype / surface sözleşmelerini tamamlayan üst seviye yönergeler.

- [workflow-directive.md](workflow-directive.md) — Workflow motoru: durum, geçiş, onay, SLA, fork/join, tenant izolasyonu ve AI sınırları.
- [k-kms-directive.md](k-kms-directive.md) — Kernel KMS primitifi: `secret_ref`, envelope encryption, rotasyon, tenant kapsamı ve sır sızıntısı kapıları.
- [panel-tier-contract.md](panel-tier-contract.md) — Surface panel katmanları, roleGroups ve navigasyon sözleşmesi.
- [archetype-ledger-directive.md](archetype-ledger-directive.md) — Çift-taraflı muhasebe ledger metamodeli.
- [archetype-order-line-item-directive.md](archetype-order-line-item-directive.md) — Sipariş / satır kalemi / vergi / indirim / ödeme durumu metamodeli.
- [archetype-inventory-stock-directive.md](archetype-inventory-stock-directive.md) — Envanter, depo, lot, seri no, rezervasyon ve stok hareketi metamodeli.
- [archetype-messaging-thread-directive.md](archetype-messaging-thread-directive.md) — Mesajlaşma, thread, feed, participant, delivery state ve moderation metamodeli.

---

*Bu dizin elle güncellenir. Yeni doküman eklerken ilgili kategoriye bir satır ekle (boşluk kalmasın).*
