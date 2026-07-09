# Wave 4 Portfolio Scale Readiness Gap — 2026-07-09

Durum: W4 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node'ları: `platform-factory`, `dx-workflow`, `dx-marketplace`, `build-referans-uygulama`, `build-enterprise-readiness`, `build-risk-defteri`, `deploy-yap`, `std-ci-gates`, `platform-cicd`, `customer`, `product`

Bu rapor implementation kodu üretmez. Amaç, 50+ uygulama vizyonunun "tek seferlik demo" değil, portföy ölçeğinde tekrar edilebilir app/module üretimi, paketleme, evidence ve operasyon modeline dönüşmesi için eksik kanıtları netleştirmektir.

## Özet

`platform` checkout'unda ready-to-code queue artifact, app assembly manifest, capability/entitlement release train, module marketplace signing/SBOM/permission diff/sandbox guardrail, Customer+OrderOps+Inventory regression matrix, evidence dashboard veya incident/rollback/migration/tenant-support runbook seti yoktur. Bu nedenle Wave 4 için doğru durum "portfolio-scale meta-framework tamamlandı" değil, "portfolio scale evidence ve operating model boşlukları kaydedildi"dir.

Wave 4, Wave 0-Wave 3 tamamlanmadan başlatılmaz. Özellikle Wave 2'de Customer + OrderOps + Inventory aynı SDK/app-core deseniyle kanıtlanmadan regression suite veya app factory release train anlamlı değildir.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Ready-to-code queue artifact | Yok |
| App assembly manifest | Yok |
| Capability/entitlement release train | Yok |
| Module marketplace signing | Yok |
| SBOM/provenance artifact | Yok |
| Permission diff gate | Yok |
| Sandbox/no-egress module guard | Yok |
| Customer/OrderOps/Inventory regression matrix | Yok |
| Evidence dashboard | Yok |
| Done-without-evidence blocker | Actionplan kapıları tanımlı; platform evidence geri-yazımı yok |
| Incident runbook | Yok |
| Rollback drill runbook | Yok |
| Migration support runbook | Yok |
| Tenant support runbook | Yok |

## Wave 4 No-Go Kapıları

- Wave 3 enterprise evidence tamamlanmadan portfolio-scale release train başlatılmaz.
- App assembly manifest olmadan app factory release train yapılmaz.
- Capability/entitlement listesi olmadan bağımsız satılabilir app iddiası yazılmaz.
- Module signing, SBOM, permission diff ve sandbox evidence olmadan marketplace açılmaz.
- Customer + OrderOps + Inventory regression matrix yeşil olmadan yeni app üretimi tekrarlanabilir sayılmaz.
- PR/CI/deploy/test evidence olmayan node `done` yapılamaz.
- Incident, rollback, migration ve tenant support runbook'u yoksa production operations ready sayılmaz.

## Handoff Hedefleri

| İş | Minimum implementation path / artifact | Minimum test veya kanıt |
|---|---|---|
| Ready-to-code queue | `reports/ready-to-code-queue.json` | blocker/evidence durumları machine-readable rapor |
| App factory release train | `apps/manifests/*.app.json`, `infra/app-assembly/` | manifest schema + package smoke |
| Module marketplace guardrails | `packages/marketplace/`, `tools/marketplace/check-module-security.ts` | signing, SBOM, permission diff, sandbox tests |
| Regression suite | `apps/web/e2e/regression-matrix.spec.ts`, `apps/api/tests/test_regression_matrix.py` | Customer/OrderOps/Inventory smoke matrix |
| Evidence dashboard | `reports/evidence-dashboard.json`, `apps/web/src/apps/evidence/` | done-without-evidence blocker + dashboard smoke |
| Operational runbooks | `infra/runbooks/incident.md`, `rollback.md`, `migration.md`, `tenant-support.md` | drill logs + owner/review date |

## Kabul Kanıtı

Wave 4 done sayılmaz; aşağıdakilerin tamamı actionplan'a gerçek evidence olarak geri yazılmalıdır:

- Ready-to-code queue exportu; her item blocker/evidence durumunu taşır.
- En az Customer, OrderOps ve Inventory için app assembly manifestleri.
- Capability/entitlement listeleri ve license gate smoke.
- Module signing, SBOM, permission diff ve sandbox/no-egress test logları.
- Customer/OrderOps/Inventory regression matrix CI run URL'si.
- Evidence dashboard smoke; evidence olmayan done claim'i kırmızı gösterilir.
- Incident, rollback, migration ve tenant support drill logları.
- Yeni app/module üretimi için PR/CI/deploy/test evidence geri-yazma örneği.

## Actionplan Etkisi

- Portfolio-scale ile ilişkili node'ların refs listesine bu rapor eklenir.
- `traceability.repoPath` ve `traceability.testCommand` alanları release train, marketplace, regression ve runbook hedefleriyle doldurulur.
- `status`, `phase`, `progress`, `evidence` ve `implementationStatus` ilerletilmez.
- Bu rapor 50+ app meta-framework'ünün geliştirildiği anlamına gelmez; eksik operating model ve evidence setini kapatma sözleşmesidir.
