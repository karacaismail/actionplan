# App Enterprise Definition Contract — JSON + Waterfall + SDK

**Sürüm:** 1.0.0
**Tarih:** 2026-07-14
**Durum:** NORMATİF — ADR-0032 insan kararı altında
**Kapsam:** `actionplan` app/module JSON sözleşmesi ve geliştirici handoff'u
**Karar:** `docs/adr-0032-enterprise-sdk-app-identity.md`
**Runtime durumu:** Bu belge çalışan app/module kodu, deploy veya doğrulanmış release iddiası kurmaz.

---

## 1. Amaç

Bu sözleşme bir app'in yalnız başlık, etiket veya genel 17 boyut kartıyla “tanımlanmış” sayılmasını engeller. Her bağımsız ticari çözümün enterprise waterfall kapsamını ve SDK-only module kompozisyonunu makine-okunur JSON içinde zorunlu kılar.

`distribution`, sektör paketi, vertical, stack, edition, suite, hub ve content-filled solution ayrı varlık türleri değildir. Ticari bağımsızlığı sağlıyorlarsa app'tir; bu ifadeler yalnız app classification metadata'sıdır.

---

## 2. Uygulanabilirlik

### 2.1 App

Bir düğüm bağımsız satılabilir, lisanslanabilir, paketlenebilir ve kurulabilir bir çözümü temsil ediyorsa:

- `level` değeri `app` olur;
- `parentId` runtime WBS içinde başka bir app'i gösteremez;
- `appDefinition` zorunludur;
- tam yedi waterfall fazı zorunludur;
- en az bir app-core module zorunludur.

### 2.2 Module

Bir düğüm app'i oluşturan çalışan yazılım birimini temsil ediyorsa:

- `level` değeri `module` olur;
- `moduleDefinition` zorunludur;
- owning app çözülebilir olmalıdır;
- SDK contract ve version range zorunludur.

### 2.3 App olmayan kayıtlar

Kernel, SDK, portfolio, category, governance, ADR, katalog görünümü ve karar kuyruğu app değildir. Bunlar runtime app/module kontratı taşımaz; neden app olmadıkları insan-onaylı classification registry'sinde açıkça yazılır.

---

## 3. `appDefinition` Sözleşmesi

Aşağıdaki biçim normatif alan setini gösterir. Alan adları şema implementasyonunda aynı semantiği korumalıdır.

```json
{
  "appDefinition": {
    "artifactKind": "sellable-app",
    "commercialUnit": "independent-app",
    "productSlug": "s-clinic",
    "canonicalName": "Health / Clinic",
    "classification": {
      "primaryCategory": "sector-app",
      "portfolioRefs": ["vertical"],
      "sectorProfiles": ["s-clinic"],
      "distributionProfiles": [],
      "stackProfiles": [],
      "editionProfiles": []
    },
    "commercialModel": {
      "licensingModel": "enterprise-subscription",
      "entitlementModel": "capability-based-entitlements",
      "packagingModel": "independently-deployable-versioned-app",
      "salesMotion": "enterprise-contract-and-tenant-provisioning",
      "supportModel": "enterprise-sla-with-release-maintenance",
      "entitlementIds": ["s-clinic.core"]
    },
    "valueProposition": "Klinik operasyonlarını uçtan uca ve denetlenebilir biçimde yönetir.",
    "targetOrganizations": ["Klinik süreçlerini yöneten kurumsal organizasyonlar"],
    "buyerRoles": ["Clinic Executive Sponsor", "Clinic Process Owner", "IT and Security Owner"],
    "userRoles": ["Klinik operasyon kullanıcısı", "Tenant Administrator", "Auditor"],
    "businessOutcomes": ["Randevudan tahsilata kadar tek doğruluk kaynağı"],
    "coreJourneys": ["Hasta kabulünden faturalandırmaya uçtan uca yolculuk"],
    "nonGoals": ["Kernel internallerine veya başka app koduna doğrudan bağlanmak"],
    "capabilityIds": ["s-clinic.core"],
    "appCoreModuleId": "s-clinic-core",
    "requiredModuleIds": ["s-clinic-core"],
    "optionalModuleIds": [],
    "jurisdictions": ["tenant-configured", "jurisdiction-policy-enforced"],
    "dataClasses": ["regulated-health-data", "tenant-business-data", "audit-metadata"],
    "manifest": {
      "appVersion": "1.0.0",
      "kernelRange": ">=1.0.0 <2.0.0",
      "sdkRange": ">=1.0.0 <2.0.0",
      "kernelPrimitiveIds": ["k-tenancy", "k-authz", "k-capability", "k-bus", "k-policy-pdp"],
      "requiredCapabilityIds": ["s-clinic.core"],
      "optionalCapabilityIds": [],
      "publishedEventTypes": ["s-clinic.lifecycle.changed.v1"],
      "subscribedEventTypes": ["tenant.lifecycle.changed.v1"],
      "locales": ["tr-TR", "en-US"],
      "residencyClass": "jurisdiction-bound",
      "deploymentProfiles": ["single-tenant", "multi-tenant"]
    },
    "sdkDelivery": {
      "required": true,
      "sdkContractRef": "sdk-public-contract",
      "sdkRange": ">=1.0.0 <2.0.0",
      "templateRef": "sdk-app-core-template",
      "generatorContractRef": "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
      "deterministic": true,
      "generatedHeaderRequired": true,
      "manualEditAllowed": false,
      "publicPortsOnly": true,
      "kernelInternalsAllowed": false,
      "directAppImportsAllowed": false,
      "compatibilityTestRefs": ["tests/appModuleCatalogMaterialization.test.ts"],
      "negativeTestRefs": ["tests/appDefinitionSchema.test.ts"],
      "templateKind": "app-core-and-assembly"
    },
    "enterpriseDelivery": {
      "targetGrade": "enterprise",
      "deliveryPolicy": "enterprise-only",
      "mvpAllowed": false,
      "baselineVersion": "1.0.0",
      "baselineStatus": "draft",
      "approvalRef": "docs/adr-0032-enterprise-sdk-app-identity.md",
      "riskTier": "high",
      "owners": {
        "product": "Clinic Product Owner", "architecture": "Enterprise Application Architect",
        "security": "Application Security Owner", "data": "Clinic Data Owner",
        "ux": "Clinic UX Owner", "qa": "Clinic QA Owner", "operations": "Clinic Service Owner",
        "compliance": "Clinic Compliance Owner", "release": "Clinic Release Owner"
      },
      "nfrBudgets": {
        "availability": "monthly SLO >= 99.9%", "latency": "interactive API p95 <= 400 ms",
        "throughput": "approved peak x2", "scalability": "horizontal scale at peak x2",
        "rto": "<= 60 minutes", "rpo": "<= 15 minutes",
        "retention": "data-class and jurisdiction policy", "cost": "approved FinOps guardrail"
      },
      "controlRefs": ["enterprise-delivery", "sdk-development"],
      "evidence": {
        "expected": [{
          "id": "s-clinic-requirements-evidence", "criterionId": "s-clinic-requirements-gate",
          "phase": "requirements", "kind": "approval",
          "locatorPattern": "evidence/apps/s-clinic/requirements/**",
          "owner": "Clinic requirements owner", "required": true
        }],
        "actual": []
      }
    }
  }
}
```

Örnek okunabilirlik için yalnız requirements expectation satırını gösterir; materializer gerçek app JSON'unda yedi fazın yedisini üretir.

`planned-not-resolved` ve `decision-required` yalnız açık blocker durumudur; release readiness değildir. Bu değerler gerçek karar verilmeden tahmin uydurulmasını engeller.

### 3.1 App kimliği

- `productSlug` global benzersiz, kebab-case ve kalıcıdır.
- Legacy kimlikler TaskNode `aliases[]` alanında tutulur ve başka canonical app slug/id ile çakışamaz.
- `enterpriseDelivery.targetGrade` yalnız `enterprise`, `mvpAllowed` yalnız `false` olabilir.
- `manifest.appVersion` kernel sürümünden bağımsızdır; tanım sürümü runtime readiness iddiası değildir.

### 3.2 App sınırı

- `targetOrganizations`, buyer/user rolleri, business outcomes, core journeys ve `nonGoals` boş bırakılarak app complete sayılamaz.
- Portfolio/sector/stack/edition app sınırı değildir; yalnız classification facet'idir.
- Aynı iş problemini temsil eden legacy kayıtlar duplikasyon kararı olmadan ayrı app olarak yayınlanamaz.

### 3.3 Kompozisyon

- `appCoreModuleId` zorunludur.
- `requiredModuleIds[0]` her zaman `appCoreModuleId` ile aynıdır.
- Bütün required/optional module ID'leri gerçek `level=module` düğümüne çözülür.
- App assembly yalnız manifest/release-train kompozisyonudur; yeni domain mantığı içermez.

### 3.4 Runtime ve ticari sözleşme

- Kernel version range, primitive bağı, capabilities ve event namespace açıkça beyan edilir.
- App A, App B'nin internal module/paketini runtime dependency olarak gösteremez.
- App'ler arası bağ versioned public API/event contract ile tanımlanır.
- Lisans ve entitlement davranışı capability setiyle uyumlu olur.
- Tenant isolation, residency, locale ve veri yaşam döngüsü kararı release öncesi zorunludur.

---

## 4. `moduleDefinition` Sözleşmesi

```json
{
  "moduleDefinition": {
    "artifactKind": "app-core-module",
    "moduleId": "s-clinic-core",
    "moduleSlug": "clinic-core",
    "appId": "s-clinic",
    "appCoreModuleId": "s-clinic-core",
    "boundedContext": "s-clinic.core",
    "ownedData": ["s-clinic.tenant-configuration", "s-clinic.application-state"],
    "lifecycleAuthority": ["s-clinic.installation", "s-clinic.configuration"],
    "providedPorts": ["s-clinic.core.public-api.v1"],
    "consumedPorts": ["kernel.tenancy.v1", "kernel.authorization.v1"],
    "publishedEvents": ["s-clinic.lifecycle.changed.v1"],
    "subscribedEvents": ["tenant.lifecycle.changed.v1"],
    "capabilityIds": ["s-clinic.core"],
    "permissionIds": ["s-clinic.admin", "s-clinic.operate", "s-clinic.audit"],
    "routeContributions": ["/s-clinic"],
    "directAppImportsAllowed": false,
    "directModuleImportsAllowed": false,
    "kernelInternalsAllowed": false,
    "crossContextWritesAllowed": false,
    "healthContract": {
      "healthPath": "/health", "readinessPath": "/ready", "exposesTenantOrDomainData": false
    },
    "versioning": {
      "moduleVersion": "1.0.0", "contractVersion": "1.0.0",
      "compatibilityPolicy": "backward-compatible-within-major"
    },
    "migration": {
      "authority": "s-clinic-core migration owner", "mode": "expand-contract", "downgradeRequired": true
    },
    "sdkDelivery": {
      "required": true,
      "sdkContractRef": "sdk-public-contract",
      "sdkRange": ">=1.0.0 <2.0.0",
      "templateRef": "sdk-module-template",
      "generatorContractRef": "docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md",
      "deterministic": true,
      "generatedHeaderRequired": true,
      "manualEditAllowed": false,
      "publicPortsOnly": true,
      "kernelInternalsAllowed": false,
      "directAppImportsAllowed": false,
      "compatibilityTestRefs": ["tests/appModuleCatalogMaterialization.test.ts"],
      "negativeTestRefs": ["tests/moduleDefinitionSchema.test.ts"],
      "templateKind": "module"
    },
    "enterpriseDelivery": {
      "targetGrade": "enterprise", "deliveryPolicy": "enterprise-only", "mvpAllowed": false,
      "baselineVersion": "1.0.0", "baselineStatus": "draft",
      "approvalRef": "docs/adr-0032-enterprise-sdk-app-identity.md", "riskTier": "high",
      "owners": {
        "product": "Clinic Core Product Owner", "architecture": "Enterprise Application Architect",
        "security": "Application Security Owner", "data": "Clinic Core Data Owner",
        "ux": "Clinic Core UX Owner", "qa": "Clinic Core QA Owner",
        "operations": "Clinic Core Service Owner", "compliance": "Clinic Core Compliance Owner",
        "release": "Clinic Core Release Owner"
      },
      "nfrBudgets": {
        "availability": "monthly SLO >= 99.9%", "latency": "interactive API p95 <= 400 ms",
        "throughput": "approved peak x2", "scalability": "horizontal scale at peak x2",
        "rto": "<= 60 minutes", "rpo": "<= 15 minutes",
        "retention": "data-class and jurisdiction policy", "cost": "approved FinOps guardrail"
      },
      "controlRefs": ["enterprise-delivery", "sdk-development"],
      "evidence": {
        "expected": [{
          "id": "s-clinic-core-requirements-evidence",
          "criterionId": "s-clinic-core-requirements-gate", "phase": "requirements",
          "kind": "approval", "locatorPattern": "evidence/apps/s-clinic-core/requirements/**",
          "owner": "Clinic Core requirements owner", "required": true
        }],
        "actual": []
      }
    }
  }
}
```

Her gerçek app/module materyalizasyonu yedi fazın yedisini `evidence.expected[]` içinde üretir; örnek yalnız bir expectation satırını gösterir ve `actual[]` gerçek doğrulama gelene kadar boştur.

Kurallar:

- `appId` gerçek bir sellable app'e çözülür.
- `artifactKind` yalnız `app-core-module` veya `app-module` olabilir.
- Her app'te tam bir `app-core` module bulunur.
- Module SDK public yüzeyini kullanır; kernel internal importu ve başka app internal importu yasaktır.
- Generated SDK artefaktı elle değiştirilmez.
- Migration, compatibility, negative test ve rollback planı bulunmadan module enterprise-ready sayılamaz.

---

## 5. Alt Görev Teslimat Bağlamı

Archetype ve altındaki her runtime görev kendi JSON içeriğinde çözülebilir teslimat bağlamı taşır:

```json
{
  "deliveryContext": {
    "applicability": "runtime",
    "appRef": "clinic",
    "moduleRef": "clinic-core",
    "sdkRequired": true,
    "sdkContractRef": "sdk-public-contract",
    "contractRefs": ["docs/app-enterprise-definition-contract.md", "enterprise-delivery", "sdk-development"]
  }
}
```

Runtime olmayan kayıt tam ters dalı taşır: `{"applicability":"not-applicable","reason":"..."}`. Boş veya örtük N/A kabul edilmez.

- App/module/SDK standardının tam metni alt görevlere kopyalanmaz.
- Alt görev kendi kapsamına özgü acceptance criteria, test oracle, evidence türü ve rollback etkisini taşır.
- Runtime işi olmayan governance/docs task'ı gerekçeli `not-applicable` kararı taşır; generic SDK dolgusu almaz.

---

## 6. Enterprise Waterfall İçerik Zorunlulukları

### 6.1 Requirements

- Ürün sınırı, aktörler, işler, kapsam ve non-goal'lar
- Capability, entitlement, lisans ve tenant sınırı
- Regülasyon, privacy, residency ve veri sınıflandırması
- SLO, RTO, RPO, ölçek, erişilebilirlik ve destek beklentisi
- App/module composition ve exact predecessor grafiği

### 6.2 Test Plan

- Önce yazılmış unit, contract, integration ve E2E test planı
- Tenant isolation, authz deny, capability deny ve app isolation negatif oracle'ları
- SDK version compatibility ve forbidden internal import testi
- Performance/load/soak, security, accessibility ve disaster-recovery testleri
- Upgrade, downgrade ve rollback doğrulaması

### 6.3 DB Schema

- Typed schema, indeks ve constraint kararları
- PII sınıflandırma, retention, silme ve audit bağı
- Expand-contract migration ve backward compatibility
- Event/outbox/idempotency etkisi
- App'ler arası doğrudan tablo/JOIN yasağı

### 6.4 Development

- Kernel → SDK → app-core → module → app assembly sırası
- SDK-only allowed surface ve yasak internal yollar
- Capability-gated route/API/UI composition
- UI varsa Storybook/Master Component ve gerçek ürün E2E planı
- Allowed-files ve en az bir non-goal

### 6.5 Test/QA

- Bütün test planı sonuçları ve negatif senaryolar
- SAST/dependency/secret taraması
- Tenant, capability ve app isolation testi
- Migration/compatibility matrix
- Performance, a11y, failure-mode ve recovery sonucu

### 6.6 Verification

- Gerçek PR/commit/CI/test artefaktlarına çözülebilir referans
- Bağımsız güvenlik, privacy, operasyon ve ürün kabulü
- Manifest ile gerçek module/primitive/capability kullanım parity'si
- Uydurma, NOT-RUN veya docs-only kanıtla PASS yasağı

### 6.7 Release/Maintenance

- Ayrı paket/lisans/deploy doğrulaması
- Semver ve kernel/SDK compatibility range
- SBOM, runbook, alarm/SLO ve support ownership
- Backup/restore ve DR drill
- Upgrade/downgrade/rollback ve deprecation politikası

Her fazın en az bir app'e özgü kriteri bulunur. Jenerik “testler geçti” veya “enterprise hazır” ifadesi tek başına kriter değildir.

---

## 7. Standard Referansları

App/module düğümü ilgili standartları `standardRefs` ile çözer. En az şu aileler uygulanabilirlik kararına girer:

- architecture ve SDK/module contract
- testing strategy ve quality gates
- data/API contract
- tenancy, authz, privacy ve security
- observability, reliability ve release/versioning
- i18n/g11n/a11y ve global market readiness
- finance/search/decision-grade gibi domain overlay'leri

Standart kuralı `dimensions.items`, notes veya prompt içine kopyalanmaz. Uygulanmayan boyut `applicability.applies=false` ve somut gerekçe taşır. Sapma yalnız gerekçeli, onaylı ve süreli waiver ile mümkündür.

---

## 8. Migration, Alias ve Duplikasyon

1. Bütün legacy node'lar insan-onaylı decision registry'sinde sınıflandırılır.
2. Keyword/tag otomatik app kararı veremez.
3. Canonical app seçilmeden duplike kayıt silinmez veya birleştirilmez.
4. Eski `id`, `slug` ve task URL'leri `aliases`/redirect ile çözülmeye devam eder.
5. App ile app-core aynı atomic shard'da migration olur.
6. Rename, destructive delete ve legacy cleanup ayrı expand-contract fazlarıdır.
7. Public node aggregate, index, navigation ve meta canonical source ile parity taşır.
8. İkinci generator koşusunda byte drift sıfır olmalıdır.

---

## 9. Evidence Doğruluğu

- Plan, prompt, Markdown veya JSON sözleşmesi implementation evidence değildir.
- Gerçek repo path/test command bilinmiyorsa alan uydurulmaz; blocker açık bırakılır.
- `evidence[]` yalnız çözülebilir gerçek artefakt içerir.
- Önceki fazlar kanıtla geçmeden sonraki faz active/passed olamaz.
- `implementationStatus=implemented|verified`, `status=done` ve release iddiası gerçek implementation writeback'i gerektirir.
- Enterprise tanımı tamamlanmış ama uygulanmamış app `requirements/backlog/not-started` kalabilir.

---

## 10. Rollback

- Her migration cohort'u bağımsız ve normal `git revert` ile geri alınabilir olmalıdır.
- Şema migration'ı expand-contract ilerler; okuyucular legacy ve yeni sözleşmeyi geçiş boyunca güvenli ayrıştırır.
- Alias kaldırma ancak bütün canlı route ve consumer doğrulandıktan sonra ayrı onayla yapılır.
- Hatalı materialization sonrasında canonical JSON kaynağı düzeltilir; generated dosya elle yamalanmaz.
- Revert sonrası schema, app/module graph, SDK coverage, standards, WBS, DAG, content, idempotence, E2E ve Pages route parity kapıları tekrar çalışır.

---

## 11. Bloklayıcı Kabul Metrikleri

- Canonical app'lerde `appDefinition`: %100
- App'lerde `deliveryGrade=enterprise-waterfall`: %100
- App'lerde çözülebilir app-core: %100
- App module'lerinde `moduleDefinition` ve SDK contract: %100
- SDK'sız app/module: 0
- Çözülmemiş canonical slug/alias duplikasyonu: 0
- Doğrudan app-internal bağı: 0
- Eksik yedi-faz kriteri: 0
- Kırık standard/module/event/capability ref'i: 0
- Generator byte drift'i: 0
- Legacy task route kaybı: 0
- Kanıtsız passed/done/verified kaydı: 0

---

## 12. Yetki ve Implementation Sınırı

Bu sözleşme, Kullanıcı/Admin'in 2026-07-14 tarihli açık app kimliği, enterprise waterfall ve SDK-only kararını makine-okunur planlama gereğine dönüştürür.

Belge AI'ya platform ürün kodu, test, migration, app/module runtime, branch, commit, push, merge veya release üretme yetkisi vermez. `actionplan` yalnız plan, sözleşme, JSON task içeriği, CI kapısı ve insan geliştirici handoff'u üretir. Runtime implementation ve kanıt writeback'i yetkili insan geliştiricinin sorumluluğudur.
