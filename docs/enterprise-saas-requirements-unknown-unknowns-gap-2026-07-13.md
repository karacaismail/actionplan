# Enterprise SaaS Gereksinimleri — Gap ve Unknown-Unknowns Analizi

**Tarih:** 2026-07-13
**Durum:** DRAFT — karar girdisi; kanonik ürün kapsamı veya implementation kanıtı değildir.
**Kaynak:** Kullanıcı araştırma metni + repo kanıtı. Araştırmadaki ürün adları ve sayısal büyüklükler gereksinim değildir.

## 1. Yönetici kararı

Kaynak metin enterprise gereksinim analizi değildir; geniş bir **aday capability sözlüğüdür**. Metin dedup, ECRM hiyerarşisi ve capability/feature ayrımını hedeflediğini doğru biçimde söyler; fakat bunu karar-kaliteli hale getirecek kanıt, authority, lifecycle ve ölçülebilir outcome katmanını kurmaz. Doğrudan backlog, app, module veya node üretmek için kullanılamaz. Üç temel kusuru vardır:

1. Capability, feature, platform primitifi, ürün ailesi, entegrasyon, protokol, teknoloji ve vendor aynı seviyede listelenmiştir.
2. `2.000–30.000 capability` ve `50.000 acceptance criteria` sayıları kanıtsız tahmindir; kapsam veya başarı metriği olamaz.
3. Kim için, hangi problemde, hangi ticari ve hukuki sınırda, hangi kanıtla gerekli olduğu belirtilmemiştir.

Doğru sonraki adım daha uzun bir özellik listesi değil; **kanıtlı requirement constitution + tekilleştirilmiş capability ontology + ürün ailesi kompozisyon matrisi + unknown-unknown probe programı** üretmektir.

## 2. Repo gerçekliği

Repo önemli bir teslim disiplini zaten sağlar:

- Yedi Waterfall fazı ve test-plan-before-development: [`enterprise-dod.md`](./enterprise-dod.md), [`task-to-code-contract.md`](./task-to-code-contract.md).
- Plan-start / code-start / done ayrımı: [`waterfall-developer-handoff.md`](./waterfall-developer-handoff.md), [`ready-for-dev-gate.md`](./ready-for-dev-gate.md).
- Owner, takvim, faz kriteri, deliverable, AC, risk, rollback, referans ve 17 üretim boyutu.
- Kernel → SDK → app-core → module → assembly sırası: [`kernel-sdk-app-delivery-sequence.md`](./kernel-sdk-app-delivery-sequence.md).
- Enterprise DoD, evidence ve portföy sertleştirme paketleri.

Bunlar **işin yürütülebilirliğini** güçlendirir; fakat gereksinimin doğru, gerekli, tekil ve ürün sınırına uygun olduğunu tek başına kanıtlamaz.

## 3. Kaynak metindeki sınıflandırma hataları

| Örnek | Doğru sınıf | Neden |
|---|---|---|
| Tenant isolation, audit, policy | platform capability/primitive | Birçok app tarafından ortak tüketilir. |
| CRM, ERP, HRMS, commerce | product family/app | Tek capability değildir. |
| Event replay, DLQ, ordering | event capability alt-feature/policy | Event Bus ile aynı granülerlikte değildir. |
| REST, GraphQL, SFTP, Kafka | integration protocol/adapter | Ürün modülü değildir. |
| Zapier, Make, n8n | optional connector/provider | Vendor adı kanonik requirement olamaz. |
| Passkey, SAML, SCIM | identity feature/standard profile | Kimlik platformuna aittir. |
| Blue/green, canary | release strategy | Ürün capability'si olarak sayılmamalı. |
| OCR, digital signature | provider-backed capability | Hukuk, güven ve sağlayıcı sınırı gerekir. |
| “600 kernel capability” | araştırma tahmini | Sayı hedefi ürün değerini veya tamlığı kanıtlamaz. |

Tekilleştirme anahtarı ad değil, şu tuple olmalıdır: `canonicalConcept + owner + dataAuthority + lifecycleAuthority + consumer + outcome`.

## 4. Kaynak metinde eksik gereksinim katmanları

Aşağıdaki eksikler **kaynak metne** ilişkindir. Repo bunların bir bölümünü `standardRefs`, 17 boyut, Enterprise DoD ve L1/L2/L3 checklist ile zaten kısmen veya tamamen kapsar. Yeni requirement üretmeden önce [`engineering-standards-index.md`](./engineering-standards-index.md), [`enterprise-dod.md`](./enterprise-dod.md) ve [`standards/14-enterprise-readiness-checklist.md`](./standards/14-enterprise-readiness-checklist.md) karşılığı aranır; mevcut kanon yeniden yazılmaz. Özellikle observability, a11y, i18n/g11n, AI governance, residency, DR, compliance ve SBOM mevcut standarda referans vermelidir.

| Gap | Kaynakta eksik olan | Zorunlu çıktı / kapı |
|---|---|---|
| Ürün stratejisi | ICP, JTBD, problem kanıtı, alternatifler | Product thesis, measurable outcome, kill criterion |
| Ürün sınırı | platform/app/module/edition/tenant ayrımı | İnsan-onaylı boundary ADR |
| Requirement provenance | Kaynak, görüşme, mevzuat, veri, varsayım | Requirement ID + source + confidence + owner |
| Baseline/change control | Freeze, CCB, change request ve etki analizi yok | Sürümlü baseline + approval + impact/revalidation |
| Stakeholder modeli | Buyer, user, admin, operator, auditor ayrımı | Stakeholder/RACI ve conflicting-needs kaydı |
| Capability ontology | Alias, parent, owner, lifecycle, dedup yok | Canonical ID, alias registry, disposition |
| Veri otoritesi | System-of-record ve write ownership yok | Data authority, retention, lineage, classification |
| Lifecycle | State, geçiş, terminal ve compensation yok | State model + event contract + invariant |
| Ticari model | Paket, entitlement, metering, COGS yok | Edition/plan/meter/billing + unit economics |
| Operasyon modeli | Support, incident, on-call, admin tooling yok | Service ownership, runbook, escalation, staffing |
| Hizmet seviyesi | SLI/SLO/SLA, RTO/RPO ve kapasite yok | Ölçülebilir NFR budget'ları |
| Güvenlik | Threat model, abuse case, supply chain, key lifecycle yok | Risk-tier + controls + negative tests |
| Privacy/legal | Jurisdiction, purpose, consent, residency, legal hold yok | Legal basis/control mapping; insan hukuk kararı |
| Globalization | Locale dışında takvim, adres, vergi, hukuk profili yok | Jurisdiction pack ve fallback politikası |
| AI yönetişimi | Use-case risk, eval, override, data boundary yok | AI impact assessment + TEVV + human stop |
| Entegrasyon | Failure semantics, versioning, idempotency, exit yok | Provider/port contract + degraded mode |
| Migration/transition | Legacy import, cutover, coexistence, rollback yok | Transition requirements + rehearsal evidence |
| Portföy tekrar kullanımı | 100 app iddiasının reuse kanıtı yok | App-family × shared capability matrisi |
| UX/human factors | Accessibility dışında learnability/error recovery ve adoption yok | Kritik journey + usability/accessibility + training evidence |
| Analytics | Metrik semantiği, lineage, reconciliation yok | Metric dictionary + source authority + freshness |
| Decommission/exit | Tenant export, contract exit, data destruction yok | Offboarding, portability, deletion evidence |

## 5. Requirement constitution — TaskNode öncesi aday kayıt overlay'i

Bu alanlar yeni bir `TaskNode` şeması değildir. `owner`, `acceptanceCriteria`, `dependsOn`, `risks`, `rollback`, `evidence` ve `standardRefs` mevcut [`src/schemas/task.ts`](../src/schemas/task.ts) alanlarına eşlenir; tekrar tanımlanmaz. Aşağıdaki pre-WBS aday kayıt yalnız provenance, karar ve validasyon boşluğunu taşır. Her aday requirement bu alanlara sahip olmadan backlog'a veya node'a dönüşemez:

```text
id, canonicalName, statement, rationale, sourceRefs, sourceType,
confidence, status, owner, approver, stakeholder, productFamily,
scopeClass, level, maturityTier, edition, tenantConfigurability,
dataAuthority, lifecycleAuthority, dependencies, conflicts, assumptions,
jurisdictions, riskTier, NFRBudgets, acceptanceCriteria, testLevel,
evidenceExpected, rollout, rollback, migration, observability,
supportModel, costDriver, buyBuildPartnerDecision, baselineVersion,
changeRequest, impactAnalysis, validationAuthority, supersedes
```

Normatif requirement cümlesi çözüm adı değil, doğrulanabilir sonuç içermelidir. “Kafka olmalı” geçersizdir; “kabul edilmiş olaylar kaybolmadan, tekrar teslimde tek etki üreterek işlenmeli” test edilebilir requirement'tır. Teknoloji seçimi ayrı ADR'dir. Pre-WBS durumları TaskNode `phase/status/state` otoritesiyle yarışmaz; yalnız `approved + baselined` aday insan kararıyla TaskNode'a eşlenir, sonra kanonik lifecycle TaskNode'dadır.

## 6. Unknown unknowns — probe kataloğu

| Bilinmeyen alan | Görünmeyen başarısızlık | Zorunlu probe |
|---|---|---|
| Yanlış müşteri problemi | Teknik olarak güçlü, satılmayan ürün | 5+ hedef müşteri discovery; ödeme/alternatif sinyali |
| Cross-product identity | Aynı kişi/şirket farklı app'lerde parçalanır | Kimlik, party, org ve account ayrım atölyesi |
| Entitlement semantiği | Paket açılır ama veri/işlem sınırı belirsiz | Plan→capability→action negatif test matrisi |
| Noisy-neighbor economics | Bir tenant diğerini yavaşlatır; marj erir | Load isolation + per-tenant cost attribution testi |
| Veri silme çatışması | Erasure, audit, finans ve legal hold çakışır | Veri sınıfı × retention conflict simulation |
| Upgrade blast radius | Metadata/plugin değişimi 100 app'i kırar | Compatibility matrix + canary + rollback rehearsal |
| Extension supply chain | İmzalı görünen plugin veri sızdırır | Permission diff, no-egress, malicious update testleri |
| Provider concentration | Tek PSP/AI/search sağlayıcısı kesilince ürün durur | Portability, failover ve exit drill |
| AI silent failure | Model doğru görünerek hatalı karar üretir | Golden/adversarial eval, drift, abstain, human override |
| Offline/clock disorder | Çift yazma, yanlış sıra, zaman dilimi hatası | Clock-skew, replay, conflict, DST property tests |
| Legal classification drift | Ürün istemeden regulated role üstlenir | Counsel review + regulated-action boundary table |
| Supportability | Özellik var ama operatör teşhis edemez | Support-bundle ve incident game-day |
| Accessibility at scale | Dinamik metadata erişilemez UI üretir | Generated-surface axe + keyboard + screen-reader probe |
| Reporting disagreement | Aynı KPI farklı app'lerde farklı hesaplanır | Metric semantic contract + reconciliation test |
| Data sovereignty | Backup, log veya AI prompt yanlış bölgeye gider | End-to-end residency lineage audit |
| Abuse/business logic | Yetkili kullanıcı limiti sistematik istismar eder | Abuse-case workshop + fraud/rate/SoD tests |
| Disaster dependency | Control plane çökünce tenant restore yapılamaz | Region-loss, key-loss, restore-from-clean-room drill |
| Customer exit | Export eksik veya yeniden içe alınamaz | Round-trip portability + deletion certificate test |
| Organizational adoption | Ürün doğru olsa da süreç/rol değişimi reddedilir | Pilot, training, adoption KPI ve rollback-to-old-process |
| Baseline drift | Onaylı requirement sessizce değişir; test eski kalır | Change-request impact ve bidirectional trace audit |
| Agent/ECA runaway | Zincir derinliği, forbidden target veya human-stop bypass edilir | Depth>6, app/module write, kill-switch ve step-up negatif testleri |

Unknown unknown “daha çok liste” ile kapanmaz. Her probe bir hipotez, owner, süre, kanıt ve `confirmed/rejected/unresolved` sonucu taşır.

## 7. Dış referans seti

Reference listesi requirement yerine geçmez; yalnız completeness ve test tasarımında kontrol kaynağıdır:

- ISO/IEC 25010:2023 — ürün kalite modelinin dokuz karakteristiği.
- NIST CSF 2.0 ve NIST SP 800-218 SSDF 1.1 — yönetişim ve güvenli SDLC.
- OWASP ASVS 5.0.0 — sürümlü uygulama güvenliği requirement kimlikleri.
- NIST AI RMF 1.0 + GenAI Profile — Govern/Map/Measure/Manage ve AI lifecycle riskleri.

Her dış referans `version + controlId + applicability + evidence` ile bağlanır; standart metni node'lara kopyalanmaz.

## 8. Öncelik ve insan kararları

P0 karar kuyruğu:

1. İlk üç product family ve hedef ICP nedir? “100 app” kapsam değildir.
2. Shared platform ile her app'in data/lifecycle authority sınırı nedir?
3. Enterprise hedef seviyesi ve ilk satış için zorunlu maturity tier nedir?
4. İlk jurisdiction ve regulated-action sınırı nedir?
5. Build/buy/provider politikası ile kabul edilebilir COGS/SLO bütçesi nedir?

Bu beş karar kapanmadan binlerce capability üretimi **NO-GO**'dur.

**Güncelleme — Faz 4.5 kapanışı (tarihsel P0 kuyruğu korunur):** Yukarıdaki beş soru + NO-GO çerçevesi **tarihsel kayıttır**; altı ledger kaydı (D1–D6) artık **bağlayıcı insan kararıyla CLOSED**'dır ([`ledger`](./enterprise-saas-human-decision-queue.md) §Closed decisions / §Newly closed decisions; [`composition`](./enterprise-saas-product-family-composition.md) §Authority and candidate status). **Karar kapanışı uyum/implementation kanıtı DEĞİLDİR**; kalan iş residual validation kanıtıdır.

| Ledger | Karar | P0 | Status | Residual validation (kanıt açık) |
|---|---|---|---|---|
| D1 | İlk üç aile sınır-kimliği | — | **CLOSED** | Faz 5 authority candidate analizi (EVM/REOC ayrı, in-branch değil) |
| D2 | İlk aile Commerce OS + ICP | #1 | **CLOSED** | ≥5 hedef müşteri discovery + ödeme/alternatif sinyali |
| D3 | Platform vs Commerce OS authority | #2 | **CLOSED** | item-level BC `owner`/`dataAuthority`/`lifecycleAuthority` matrisi + traceability |
| D4 | İlk jurisdiction = Türkiye | #4 | **CLOSED** | Türkiye-yetkili counsel + residency-lineage denetimi |
| D5 | Controlled Paid Enterprise Pilot | #3 | **CLOSED** | evidence-control drill'leri (restore/exit/a11y/security review) |
| D6 | Build/buy/provider + SLO/COGS | #5 | **CLOSED** | provider exit/failover/portability drill + gerçek yük altında ölçülmüş SLO/COGS |

**Faz 4.5 GO yalnız Faz 5 docs-only candidate analizi içindir**; requirement/backlog/node/schema/gate/implementation açılmaz. "Karar CLOSED" ≠ uyum/implementation kanıtı.

## 9. Nihai değerlendirme

Kaynak metin yön gösterici fakat sığdır: kapsam büyüklüğünü anlatır, karar kalitesini sağlamaz. Repo ise yürütme disiplininde güçlü ama requirement doğruluğu ve ontology kalitesini henüz yeterince zorlamaz. Bir sonraki dalga, sayıya değil **kanıt, tekillik, authority, lifecycle, ölçülebilir sonuç ve insan kararına** optimize edilmelidir.

**Faz 4.5 notu:** D1–D6 artık insan kararıyla CLOSED; bu **karar kapanışıdır, uyum/implementation kanıtı değildir**. Bir sonraki iş residual validation kanıtıdır: **Türkiye-yetkili counsel, Faz 5 authority candidate analizi, unknown-unknown probe'ları, traceability, provider exit/failover drill'leri ve gerçek yük altında ölçülmüş SLO/COGS.** §6 probe kataloğu ve §8 tarihsel P0 kuyruğu **korunur** (yeniden açılmaz).
