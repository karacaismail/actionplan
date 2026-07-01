# actionplan — Doküman Dizini

Bu klasördeki tüm kanonik dokümanların tek-bakışta haritası. (GitHub `docs/` klasörünü açınca bu sayfayı gösterir.) Amaç: hiçbir doküman "fark edilmemiş" kalmasın. Toplam 38 doküman + repo kökünde 4 dosya.

**Okuma sırası önerisi (yeni gelen):** `developer-guide.md` → `task-to-code-contract.md` → `engineering-standards-index.md` → ilgili plan/sözleşme.

---

## 1. Kararlar (ADR — Architecture Decision Record)

Mimari kararların kayıt defteri. (Not: 25 numaralı ADR ayrıca WBS'te `app-kararlar` kümesinde düğüm olarak izlenir; buradakiler doküman-ADR'lerdir.)

- [adr-0026-tech-profiles.md](adr-0026-tech-profiles.md) — Frontend stack'in makine-okunur, şema-bağlı, headless-kilitli tek-kaynak tanımı (tech-profiles).
- [adr-0027-engineering-standards.md](adr-0027-engineering-standards.md) — Mühendislik standardı işletim katmanı: sözleşme + referans (standardRefs) + applicability + waivers + CI kapıları.
- [adr-geo-visualization.md](adr-geo-visualization.md) — Coğrafi görselleştirme sınırı: deck.gl + MapLibre (iş grafikleri ECharts'ta kalır).

## 2. Kanonik Sözleşmeler (bağlayıcı kurallar)

Projedeki "doğru"yu tanımlayan, çelişen her şeyi geçersiz kılan bağlayıcı belgeler.

- [task-to-code-contract.md](task-to-code-contract.md) — Bir WBS düğümünün yazılım-teslimat karşılığı: seviye→teslimat, faz→eylem, "şimdi ne yapılır" karar ağacı.
- [task-export-contract.md](task-export-contract.md) — Görev/JSON dışa aktarım sözleşmesi (tam içerik + çözülmüş bağımlılık URL'leri).
- [core-contract-pack.md](core-contract-pack.md) — Çekirdek sözleşme paketi v1 (kapsamlı temel sözleşmeler).
- [app-distribution-contract.md](app-distribution-contract.md) — Uygulama dağıtım sözleşmesi: global app'in izole/SDK sınırı, paylaşım ve dağıtım kuralları.
- [icerik-kalite-sozlesmesi.md](icerik-kalite-sozlesmesi.md) — İçerik kalitesi tanımı ("Definition of Deep"): bir boyut ne zaman "yeterli".
- [wbs-field-semantics.md](wbs-field-semantics.md) — WBS ilişki alanlarının (dependsOn/blocks/related) anlam sözleşmesi.
- [ready-for-dev-gate.md](ready-for-dev-gate.md) — Definition of Ready: development fazına geçiş kapısı (10/10).
- [release-policy.md](release-policy.md) — Sürüm/yayın politikası (semver, changelog, rollback).
- [waiver-policy.md](waiver-policy.md) — Standarttan bilinçli sapmanın (waiver) yaşam döngüsü: gerekçe + onay + süre.

## 3. Mühendislik Standartları (ADR-0027 katmanı)

15 tek-kaynak standardı + bağlayan dokümanlar. Başlangıç: dizin sayfası.

- [engineering-standards-index.md](engineering-standards-index.md) — **HUB**: üç-grup modeli + 15 standardın tablosu + standardRef eşlemesi.
- [i18n-standard.md](i18n-standard.md) — 15. mühendislik standardı: çok-dil/locale/RTL/currency/timezone/tax-legal-localization/data-residency + çeviri iş-akışı + fallback.
- [ci-conformance-gates.md](ci-conformance-gates.md) — CI conformance kapıları kataloğu (her kapı ne zorlar, hangi dosya).
- [standards-applicability-matrix.md](standards-applicability-matrix.md) — Hangi standart/boyut hangi WBS seviyesine uygulanır (N/A disiplini).
- [dimension-migration-runbook.md](dimension-migration-runbook.md) — Lazy migration: default'lu alan yazımı + 445 düğüm güvenliği.
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
- [evidence-update-runbook.md](evidence-update-runbook.md) — Kanıt (evidence) güncelleme adım adım runbook.

## 6. Denetim & Boşluk (Gap) Raporları

Durum tespiti ve eksik analizleri (zaman damgalı; tarihsel olabilir).

- [audit-report.md](audit-report.md) — İçerik denetim (audit) raporu.
- [data-quality-report.md](data-quality-report.md) — Veri kalitesi raporu (nodes.json).
- [repo-reality-audit.md](repo-reality-audit.md) — Repo gerçeklik denetimi (plan vs gerçek kod).
- [developer-workflow-gap-analysis.md](developer-workflow-gap-analysis.md) — Geliştirici akışı boşluk analizi.
- [execution-readiness-gap.md](execution-readiness-gap.md) — Execution readiness boşluk analizi.
- [enterprise-dod.md](enterprise-dod.md) — Enterprise-ready uygulama "Definition of Done".
- [core-enterprise-maturity-ladder.md](core-enterprise-maturity-ladder.md) — Çekirdek kurumsal olgunluk merdiveni: enterprise-hazırlık seviyeleri ve geçiş kapıları.

## 7. AI Yönergeleri

- [claude-ai-archetype-eca-directive.md](claude-ai-archetype-eca-directive.md) — AI ArcheType + backend ECA güvenlik sınırları yönergesi.

## 8. Repo Kökü

- [../README.md](../README.md) — proje girişi.
- [../AGENTS.md](../AGENTS.md) — AI ajan çalışma sözleşmesi (test-önce, headless, standardRefs referansı).
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — katkı kuralları.
- [../SECURITY.md](../SECURITY.md) — güvenlik politikası.

---

*Bu dizin elle güncellenir. Yeni doküman eklerken ilgili kategoriye bir satır ekle (boşluk kalmasın).*
