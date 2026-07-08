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
- [developer-workflow-gap-analysis.md](developer-workflow-gap-analysis.md) — Geliştirici akışı boşluk analizi.
- [kernel-sdk-app-sequence-gap-report-2026-07-08.md](kernel-sdk-app-sequence-gap-report-2026-07-08.md) — Kernel → SDK → app-core → app module sırası gap raporu ve uygulanan düzeltme.
- [doc-maintainer-boundary-gap-report-2026-07-08.md](doc-maintainer-boundary-gap-report-2026-07-08.md) — Codex/doc-maintainer rol sınırı denetimi ve uygulanan dokümantasyon düzeltmeleri.
- [implementation-prompt-boundary-gap-report-2026-07-08.md](implementation-prompt-boundary-gap-report-2026-07-08.md) — Claude/Cursor/vibecoding prompt dokümanlarındaki kalan rol sınırı riskleri ve düzeltmeleri.
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
