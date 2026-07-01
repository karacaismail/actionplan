# Enterprise-Readiness Master Checklist — Tüm Standartlar Tek Kapıda

**Sürüm:** 1.0 — 2026-07-01
**Statü:** Master checklist (ADR-0027 + ADR-D3 katmanı). **Rolü:** 15 mevcut makine-standardı + eklenen anlatı standartları (01-13) + `enterprise-dod.md` 18 katmanını **tek denetlenebilir liste** hâlinde toplar. Yeni standart üretmez; hepsine referans verir ("reference, don't duplicate" — `00-standards-index.md` §1).
**Hizalama:** `core-enterprise-maturity-ladder.md` L1 (Core) / L2 (Growth) / L3 (Enterprise) kademeleriyle satır-satır hizalıdır.
**Bağlam:** `00-standards-index.md` (standart hub), `ci-conformance-gates.md` (kapı kataloğu), `enterprise-standards-audit-2026-07-01.md` (kapsam/boşluk), `enterprise-dod.md` (18 katman L3-DoD).

---

## 1. Bu nedir / nasıl okunur

**Bu nedir?** Bir app'in "core mu, growth mu, enterprise mi?" sorusunu tek bakışta yanıtlayan denetim listesi. Her satır bir standardı (veya DoD katmanını) alır ve dört sütunla işaretler: **P0-P3 önceliği**, **CI kapısı** (hangi makine-kontrolü zorlar), **durum alanı** (app-başı doldurulan kanıt/işaret), ve **kademe** (L1/L2/L3 — hangi olgunlukta zorunlu olduğu).

**Nasıl okunur?** Bir app'in kademesi belliyse (manifest/WBS `maturity_level`), o kademeye kadar olan tüm satırlar (kademeler eklemelidir — L2 L1'i, L3 L2'yi kapsar) "durum" sütununda yeşil olmalıdır. Bir satır kırmızıysa o app o kademede done sayılmaz; graduation (terfi) başlatılamaz (`core-enterprise-maturity-ladder.md` §6).

**Durum alanı ne demek?** App-başı doldurulan makine-okunur işaret: `evidence[]` kaydı, `standardRefs` referansı, ilgili `check-*` kapısının o app için yeşil olması, veya (kanıt gereken yerde) belge/rapor yolu. "PASS" = kapı yeşil + kanıt var; "N/A + gerekçe" = `check-dimension-applicability` gereği gerekçeli muafiyet; "TODO" = henüz karşılanmadı.

Bu doküman **kod yazmaz** ve hiçbir standardın kuralını **kopyalamaz**; her satır ilgili standarda/DoD katmanına referans verir. Katkısı: dağınık 15+13+18 kaleme tek master kapı ve L1/L2/L3 hizalaması getirmektir.

---

## 2. Kademe eşiği — hangi satır hangi kademede zorunlu

Master checklist kademelere göre okunur ve şu şekilde uygulanır: her standart/DoD-katmanı bir minimum-kademe taşır; app o kademeye ulaştığında o satır zorunlu-yeşil olur. Aşağıdaki tablo üç kademenin ne demek olduğunu ve DoD kaynağını özetler (ayrıntı: `core-enterprise-maturity-ladder.md`).

| Kademe | Tek cümle | Ticari anlam | DoD kaynağı |
|---|---|---|---|
| L1 — Core | Bağımsız satılabilir MVP: basit multi-tenant, CRUD+workflow, RBAC, i18n-hazır, temel audit, compose deploy, temel test | App satılmaya başlanabilir | maturity-ladder §3 |
| L2 — Growth | Capability-gate, ReBAC/ABAC (PDP), SSO, observability+SLO, backup/restore, çok-dil+RTL, marketplace-listelenebilir | App ölçeklenir, çoklu müşteri + global | maturity-ladder §4 |
| L3 — Enterprise | `enterprise-dod.md` 18 katman + residency + DR + tam SDK + çok-bölge + compliance (KVKK/GDPR/SOC2) | Kurumsal/regüle müşteriye satılır | `enterprise-dod.md` + maturity-ladder §5 |

Kademeler eklemelidir: L3'teki bir app L1 ve L2 satırlarını da karşılar. Her app kendi kademesindedir (portföy tek-hız dayatmaz).

---

## 3. Mevcut 15 Makine-Standardı — Master Checklist

Aşağıdaki tablo reponun bugün var olan 15 makine-standardını (`src/data/standards/*.json`) master checklist satırı olarak listeler ve şu şekilde uygulanır: her satır standardı, önceliğini, zorlayan CI kapısını, app-başı durum alanını ve minimum kademesini verir. "Durum" app-başı doldurulur (bu tabloda alan-tanımı gösterilir).

| # | Standart (id) | Aile | P | CI kapısı | Durum alanı (app-başı) | Kademe |
|---|---|---|---|---|---|---|
| S-01 | architecture | engineering | P0 | check-standards-coverage | `standardRefs.architectureRef` + PASS | L1 |
| S-02 | coding-standards | engineering | P0 | check-standards-coverage | `standardRefs` + PASS | L1 |
| S-03 | short-code | engineering | P1 | check-short-code | kapı yeşil (tavan aşımı yok) | L1 |
| S-04 | quality-gates | testing | P0 | check-standards-coverage | `phases[test-qa].passed` + evidence | L1 |
| S-05 | design-system | design | P1 | check-ui-standards | kapı yeşil (token/emoji) | L1 |
| S-06 | ui-components | design | P1 | check-ui-standards | kapı yeşil | L1 |
| S-07 | ux-interaction | design | P1 | check-ui-standards | kapı yeşil | L1 |
| S-08 | data-api-contract | data | P0 | check-standards-coverage | contract test + schema-diff yeşil | L1 |
| S-09 | state-management | engineering | P1 | check-standards-coverage | `standardRefs` + PASS | L1 |
| S-10 | observability | devops | P0 | check-standards-coverage | RED/USE + SLO + trace evidence | L2 |
| S-11 | testing-strategy | testing | P1 | check-standards-coverage | test raporu (unit/integration/E2E) | L1 |
| S-12 | release-versioning | devops | P1 | check-standards-coverage | SemVer + blue-green/canary evidence | L2 |
| S-13 | ai-governance | ai | P1 | check-standards-coverage | prompt registry + eval + kill-switch | L2 |
| S-14 | i18n-standards | engineering | P2 | check-i18n (yazıldı) | i18n-text + locale + RTL beyanı | L1 (hazır) / L2 (aktif) |
| S-15 | dependency-policy | governance | P1 | check-dependency-policy | lockfile + yasak-paket + lisans yeşil | L1 |

Not (2026-07-01 güncellendi): `check-i18n` artık `tools/agents/check-i18n.mjs` olarak **yazıldı** ve `deploy.yml`'e eklendi; S-14'ün tam-zorlaması aktiftir. `check-observability` ayrı yoktur; o11y kanıtı `evidence[]`'a bırakılır.

---

## 4. Eklenen Anlatı Standartları (01-13) — Master Checklist

Aşağıdaki tablo `00-standards-index.md` §3'teki eklenen anlatı standartlarını (`docs/standards/01-13`) master satır olarak listeler ve şu şekilde uygulanır: her biri bir *yeni* makine-sözleşmesi (`src/data/standards/<id>.json`) hedefler. "Makine-kontratı" sütunu 2026-07-01 RECONCILE edilmiştir (güncellendi): on üç sözleşmenin **tamamı VAR** (`g11n`, `a11y`, `authz-rbac-abac`, `c13n`, `data-normalization`, `i14y`, `c12n`, `p13n`, `sso`, `mfa`, `oidc`, `edge-security`, `iac`). Numaralandırma `00-standards-index.md` ile birebir aynıdır.

| # | Standart (planlanan id) | Aile | P | CI kapısı (hedef) | Makine-kontratı | Durum alanı | Kademe |
|---|---|---|---|---|---|---|---|
| N-01 | g11n (globalization) | governance | P2 | check-i18n (yazıldı) | VAR (`g11n.json`) | ortogonal locale/currency/tax/residency beyanı | L2 |
| N-02 | c13n (canonicalization) | data | P1 | check-data-quality | VAR (`c13n.json`) | normalize idempotent + unique constraint | L2 |
| N-03 | n6n (normalization) | data | P1 | check-data-quality | VAR (`data-normalization.json`) | 3NF + duplicate DB-constraint yakalanır | L2 |
| N-04 | d10n (denormalization) | data | P3 | check-data-quality | VAR (`data-normalization.json` içinde) | read-model senkron kaynak tetikleyici | L3 |
| N-05 | i14y (interoperability) | data | P1 | check-core-contract (yazıldı) | VAR (`i14y.json`) | webhook imzalı+retry + idempotency-key | L2 |
| N-06 | c12n (customization) | design | P1 | check-standards-coverage | VAR (`c12n.json`) | tenant tema-token + feature-flag çözüm | L2 |
| N-07 | p13n (personalization) | design | P2 | check-standards-coverage | VAR (`p13n.json`) | user-preference + saved-view izole | L2 |
| N-08 | sso (single sign-on) | engineering | P1 | check-standards-coverage | VAR (`sso.json` + `oidc.json`) | OIDC/SAML IdP → yerel session | L2 |
| N-09 | mfa (multi-factor auth) | engineering | P1 | check-standards-coverage | VAR (`mfa.json`) | TOTP/WebAuthn 2. faktör zorunlu | L2 |
| N-09b | authz-rbac-abac (yetki/PDP) | engineering | P0 | check-standards-coverage | VAR (`authz-rbac-abac.json`) | RBAC+ABAC matris + PDP default-deny | L2 |
| N-09c | a11y (accessibility) | design | P1 | check-ui-standards | VAR (`a11y.json`) | axe WCAG 2.2 AA 0 kritik | L1 |
| N-10 | e2ee (end-to-end encryption) | engineering | P2 | check-standards-coverage | VAR (`edge-security.json` içinde) | plaintext DB'de asla yok | L3 (opsiyonel) |
| N-11 | v12n (virtualization) | devops | P2 | check-execution-readiness | VAR (`iac.json` içinde) | reproducible container image | L2 |
| N-12 | iac (infrastructure as code) | devops | P1 | check-execution-readiness | VAR (`iac.json`) | Compose baz + env-validation + secret-free | L2 |
| N-13 | edge-security (WAF/DDoS/CDN/DNS) | devops | P1 | check-execution-readiness | VAR (`edge-security.json`) | rate-limit header + CORS + security headers | L2 |

Not (2026-07-01 güncellendi): N-05 (i14y) ve N-01 (g11n) sözleşmeleri VAR ve `check-core-contract`, `check-i18n` kapıları **yazıldı** (`tools/agents/` altında mevcut, `deploy.yml`'e eklendi); tam-zorlama aktiftir. v12n (N-11) ayrı `v12n.json` üretmez; `iac.json` içinde kural olarak taşınır (bkz. `12-devops-infrastructure-standard.md` §5) — `iac.json` artık VAR.

---

## 5. `enterprise-dod.md` 18 Katmanı — L3 Master Checklist

Aşağıdaki tablo `enterprise-dod.md`'nin 18 katmanını master satır olarak listeler ve şu şekilde uygulanır: bu katmanlar L3 (Enterprise) kademesinin çekirdeğidir; L1/L2 bir alt kümesini *daha düşük olgunlukta* karşılar, L3'te **tamamı tam kanıtla** yeşil olur. Bu tablo 18 katmanı tekrar yazmaz; `enterprise-dod.md`'ye referans verir.

| # | DoD katmanı | P | CI kapısı / kanıt | Durum alanı | L1 | L2 | L3 |
|---|---|---|---|---|---|---|---|
| E-01 | Tenant (multi-tenant/RLS) | P0 | tenant izolasyon testi | `tenantStrategy` + izolasyon testi | basit RLS | RLS + kanıt | tam izolasyon + pen-test |
| E-02 | Auth / Authz | P0 | check (OWASP) + RBAC matris testi | `dimensions.security` + evidence | RBAC | +ABAC/PDP | +SSO/MFA tam |
| E-03 | DB şema + migration | P0 | check-data-quality + downgrade testi | Alembic upgrade/downgrade + snapshot | var | expand-contract | +DR snapshot |
| E-04 | API sözleşmesi | P0 | schema-diff + contract test | GraphQL SDL + golden response | var | versiyonlu | +tam SDK |
| E-05 | UI surface | P1 | Playwright + check-ui-standards | `acceptanceCriteria[]` + evidence | temel | responsive | +tam a11y |
| E-06 | Audit log | P1 | append-only test | `auditLogRef` + immutability testi | temel | tam | compliance-hazır |
| E-07 | Import / Export | P1 | idempotency + duplicate-safety testi | E2E rapor | — | var | +GDPR taşınabilirlik |
| E-08 | Observability | P0 | o11y evidence (SLO/alert) | `metrics[]` + trace evidence | — | SLO+alert | tam dashboard |
| E-09 | Unit testler | P0 | check (coverage %80+) | coverage raporu | kritik | %80+ | +mutation %70 |
| E-10 | Integration testler | P1 | check (container test) | integration rapor | — | var | tam |
| E-11 | E2E testler | P1 | E2E + axe | Playwright rapor | happy-path | +sad-path | çoklu-viewport |
| E-12 | a11y (WCAG 2.2) | P1 | E2E + axe (AA) | axe rapor 0 kritik | — | AA | AA + manuel SR |
| E-13 | Deployment | P1 | check-execution-readiness | CI/CD log + `/health` | compose | +staging | +çok-bölge |
| E-14 | Rollback | P0 | downgrade testi | `rollback` dolu + test logu | downgrade | +restore | +DR tatbikatı |
| E-15 | Docs / Runbook | P2 | — (review) | `refs[]` + runbook yolu | temel | var | tam runbook |
| E-16 | Owner | P0 | check-data-quality (owner) | `owner` non-null + `assignees[]` | var | var | +escalation |
| E-17 | Risk kaydı | P1 | — (review) | `risks[]` ≥3 kayıt | temel | var | kapatılmış |
| E-18 | Dependency | P1 | check-dependency-policy | `dependsOn[]` DAG + CVE=0 | var | var | +SBOM |

Kaynak: `enterprise-dod.md` §2 (davranışsal kriter + kanıt), §5 (faz haritası). L3'te 18 katmanın tamamı tam-kanıtla yeşil olmalıdır; bu, merdivenin en üst basamağıdır.

---

## 6. L3 Ek Kriterleri (18 katmanın üstüne)

`enterprise-dod.md` 18 katmanı verir ama "önce core sonra enterprise" modelinin en üstü birkaç ek yetenek ister ve şu şekilde uygulanır: aşağıdaki beş kriter 18 katmanın üstüne eklenir (kaynak `core-enterprise-maturity-ladder.md` §5.3). Bunlar yalnız L3'te zorunludur.

| # | L3 ek kriteri | P | Kanıt | Durum alanı |
|---|---|---|---|---|
| L3-1 | Veri-residency (bölge/jurisdiction) | P1 | `k-jurisdiction` residency ekseni | query-layer zorlama testi |
| L3-2 | DR tatbikatı | P1 | RTO/RPO ölçülü, runbook doğrulanmış | DR tatbikat raporu |
| L3-3 | Tam SDK | P1 | OpenAPI/GraphQL → typed client yayınlı | SDK/codegen runbook |
| L3-4 | Çok-bölge | P1 | K8s topolojisi + residency tutarlı | çok-bölge deploy doğrulama |
| L3-5 | Compliance (KVKK/GDPR/SOC2) | P1 | rıza/DSR/silme/ihlal-bildirimi | compliance checklist |

---

## 7. Graduation kapısı — CI-yeşil + insan-onay

Master checklist bir terfi kapısıdır ve şu şekilde uygulanır: bir app bir kademeden üste geçerken o kademenin tüm satırları CI'da yeşil olmalı (makine) **ve** release owner terfiyi imzalamalıdır (insan). Aşağıdaki tablo üç graduation kapısını, CI koşulunu ve insan-onay sorumlusunu verir (kaynak `core-enterprise-maturity-ladder.md` §3.3/§4.3/§5.4).

| Graduation | CI koşulu (kademe-DoD yeşil) | İnsan onayı |
|---|---|---|
| L1 → L2 | S-01..S-09, S-11, S-15 + E-01..E-05,E-09,E-11,E-16,E-18 (L1 sütunu) yeşil; tenant izolasyon + RBAC + standalone compose + manifest | Release owner: "bağımsız satılabilir + L1-DoD tamam" imzası |
| L2 → L3 | L1 tümü + S-10,S-12,S-13,S-14 + N-01,N-02,N-03,N-05,N-06,N-07,N-08,N-09,N-11,N-12,N-13 + E-06,E-07,E-08,E-10,E-12,E-13(staging),E-14(restore),E-17 (L2 sütunu) yeşil | Release owner: "growth kriterleri + L3'e hazır" imzası |
| L3 (enterprise-ready) | `enterprise-dod.md` 18 katman kapıları tam yeşil + L3-1..L3-5 + N-04,N-10 (gerekirse) kanıtlı | Release owner + (regüle satışta) compliance sorumlusu imzası |

Kural: CI graduation'ı **onaylamaz**, yalnız kriterlerin karşılandığını doğrular; terfi kararı insanındır. Bir kademe kapısı kırmızıysa graduation başlatılamaz.

---

## 8. Hayalet kapılar ve boşluklar (bilinçli izlenen)

Bu checklist mevcut boşlukları gizlemez; şu şekilde uygulanır: yazılmamış ama doküman-atıflı kapılar açıkça işaretlenir ki "yeşil sanılıp" sahte-güven üretmesin. Aşağıdaki tablo bilinen boşlukları, etkisini ve düzeltmeyi verir (kaynak `enterprise-standards-audit-2026-07-01.md` §3/C7).

| Boşluk | Etki | Düzeltme | Priority |
|---|---|---|---|
| `check-i18n` yazılmamış (2026-07-01 doğrulandı: dosya yok) | S-14/N-01 deklare + `g11n.json` sözleşmesi VAR, ama kapı zorlamıyor | `check-i18n.mjs` yaz + `deploy.yml`'e ekle | P1 |
| `check-core-contract` yazılmamış (2026-07-01 doğrulandı: dosya yok) | N-05 (i14y) sözleşmesi VAR ama zorlanmıyor | kapı yaz veya atıfları düzelt | P1 |
| `check-scale-invariant` yazılmamış (2026-07-01 doğrulandı: dosya yok) | `scale-invariant-directive.md` atıflı ama outbox/idempotency zorlanmıyor | `check-scale-invariant.mjs` yaz + `deploy.yml`'e ekle | P1 |
| `check-secrets`/gitleaks koşmuyor | secret sızıntısı sessiz geçebilir | gitleaks kapısı ekle | P0 |
| restore-drill CI job yok | L2 backup/restore kanıtsız | periyodik restore-drill job | P1 |
| Beş primitif şemada yok (C6) | Mode-Profile/Capability/PDP modellenemez | ADR + `archetype.ts` şeması (`plan-01` D1) | P0 |
| `AGENTS.md:82` Prisma (C1) | ajan yanlış-üretim riski | insan elle SQLAlchemy'ye düzeltir (bkz. `PENDING-HUMAN-FIXES-2026-07-01.md`) | P0 |

Bu satırlar kapatılana kadar ilgili master satırları "PASS" değil "TODO (kapı yok)" işaretlenir; bir app o standarda dayanıyorsa waiver (`waiver-policy.md`: gerekçe+onay+süre) ile geçici geçebilir.

RECONCILE notu (2026-07-01, güncellendi): Bu paketin **sözleşme** boşlukları kapandı — 13 sözleşmenin tamamı (`g11n`, `a11y`, `authz-rbac-abac`, `c13n`, `data-normalization`, `i14y`, `c12n`, `p13n`, `sso`, `mfa`, `oidc`, `edge-security`, `iac`) artık `src/data/standards/*.json`'da VAR. Üç eksik **CI kapısı** (`check-i18n`, `check-core-contract`, `check-scale-invariant`) de **yazıldı** ve `deploy.yml`'e eklendi. Genel ilke bakidir: yazılmamış bir kapı (ör. gitleaks) "yeşil sanılmaz" (§12 anti-pattern).

---

## 9. AI guardrail

Master checklist'in kendisi de dört-aktör kuralına tabidir ve şu şekilde uygulanır: **AI önerir → insan onaylar → motor uygular.** AI bir app'in durum alanlarını *öneri* olarak doldurabilir (`autonomy: draft`) ve eksik satırları raporlayabilir; ama graduation'ı onaylayamaz, "PASS" imzalayamaz, waiver açamaz, main branch'e push edemez, `check-*` kapısını devre-dışı bırakamaz. Terfi ve waiver kararı insan release owner'ındır; regüle L3'te compliance sorumlusu da imzalar.

---

## 10. Kullanım — bir app'i nasıl denetlersin

Bu checklist app-başı bir denetim ritüelidir ve şu şekilde uygulanır: sırayla aşağıdaki adımlar izlenir. Aşağıdaki tablo denetim akışını adım-adım verir.

| Adım | Ne yapılır | Çıktı |
|---|---|---|
| 1 | App'in hedef kademesini belirle (manifest/WBS `maturity_level`) | L1 / L2 / L3 |
| 2 | O kademeye kadar tüm satırları (§3-§6) topla (eklemeli) | zorunlu satır listesi |
| 3 | Her satırın CI kapısını çalıştır + durum alanını doldur | PASS / N/A+gerekçe / TODO |
| 4 | Kırmızı/TODO satırları listele; waiver veya iş kalemi aç | boşluk listesi |
| 5 | Tüm zorunlu satırlar yeşilse graduation kapısını (§7) aç | terfi önerisi |
| 6 | Release owner (regüle L3'te +compliance) imzalar | kademe terfisi |

Bu ritüel her app için ayrı çalışır; portföy görünümü `core-enterprise-maturity-ladder.md` §6.2'deki app×kademe tablosuyla izlenir.

---

## 11. Acceptance criteria

- AC-1: Her master satırı bir standarda/DoD-katmanına referans veriyor; hiçbir satır kuralı kopyalamıyor.
- AC-2: Her satır P0-P3, CI kapısı, durum alanı ve kademe (L1/L2/L3) taşıyor.
- AC-3: Kademe eşiği eklemeli: L2 app'i L1 satırlarını da karşılıyor; L3 app'i L1+L2'yi.
- AC-4: Graduation kapısı ikili: CI-yeşil (makine) + insan-onay; CI tek başına terfi ettirmiyor.
- AC-5: `check-i18n` ve `check-core-contract` artık yazıldı; kalan yazılmamış kapılar (ör. gitleaks) açıkça "TODO" işaretli, "PASS" sayılmıyor.
- AC-6: `core-enterprise-maturity-ladder.md` L1/L2/L3 tanımlarıyla çelişki yok.

---

## 12. Anti-patterns (yasak desenler)

- **Kural kopyalama:** Bir standardın kuralını bu listeye tekrar yazmak — drift üretir; yalnız referans ver.
- **Hayalet kapıyı yeşil saymak:** Yazılmamış kapıyı "PASS" işaretlemek — sahte güven; "TODO" işaretle.
- **Kademe atlama:** L2 karşılanmadan L3 satırlarını zorunlu tutmak/atlamak — eklemeli ilke bozulur.
- **CI ile terfi:** Graduation'ı yalnız CI-yeşil ile onaylamak — insan-onay kapısını atlar.
- **Süresiz waiver:** Gerekçesiz/süresiz muafiyetle kırmızı satırı gizlemek — `waiver-policy.md` ihlali.
- **AI'ın imzalaması:** AI'ın "PASS"/graduation imzalaması — fail-closed ihlali.

---

## 13. DoD (Definition of Done)

15 makine-standardı (§3) + 13 anlatı standardı (§4) + 18 DoD katmanı (§5) + 5 L3 ek kriteri (§6) master satır olarak listelendi; her satır P0-P3 + CI kapısı + durum alanı + kademe taşıyor; graduation kapıları (§7) `core-enterprise-maturity-ladder.md` ile hizalı; hayalet kapılar (§8) açıkça işaretli; hiçbir standart kuralı kopyalanmadı (yalnız referans); `check-standards-coverage` bu dokümanın atıfladığı ref anahtarlarını çözebiliyor; PR açıldı, insan reviewer merge etti.

---

## 14. Requirement-ID tablosu

Aşağıdaki tablo bu master checklist'in kendi izlenebilir gereksinimlerini kimliklendirir; her satır bir gereksinim, katmanı, önceliği, test türü, ilgili acceptance criteria ve sahibiyle eşlenir.

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| ERC-01 | 15 makine-standardı master satır olarak (P+kapı+durum+kademe) | Governance | P0 | Review | AC-1 | Enterprise architect |
| ERC-02 | 13 anlatı standardı (01-13) master satır olarak | Governance | P0 | Review | AC-2 | Enterprise architect |
| ERC-03 | 18 DoD katmanı L1/L2/L3 sütunlu master satır | Governance | P0 | Review | AC-2 | Enterprise architect |
| ERC-04 | 5 L3 ek kriteri (residency/DR/SDK/çok-bölge/compliance) | Governance | P1 | Review | AC-2 | Enterprise architect |
| ERC-05 | Kademe eşiği eklemeli (L2⊇L1, L3⊇L2) | Governance | P0 | Review | AC-3 | Enterprise architect |
| ERC-06 | Graduation kapısı ikili (CI-yeşil + insan-onay) | Governance | P0 | Review | AC-4 | Release owner |
| ERC-07 | Hayalet kapılar açıkça TODO işaretli | Governance | P1 | Review | AC-5 | Enterprise architect |
| ERC-08 | maturity-ladder L1/L2/L3 ile çelişki yok | Governance | P0 | Review | AC-6 | Enterprise architect |
| ERC-09 | Hiçbir standart kuralı kopyalanmadı (referans) | Governance | P0 | check-standards-coverage | AC-1 | Enterprise architect |
| ERC-10 | App-başı denetim ritüeli (§10) tanımlı | Governance | P1 | Review | AC-2 | Release owner |
| ERC-11 | Durum alanı makine-okunur (evidence/ref/kapı) | Governance | P1 | Review | AC-2 | Enterprise architect |
| ERC-12 | Waiver ile geçici geçiş `waiver-policy.md`'ye bağlı | Governance | P2 | check-waivers | AC-5 | Release owner |

---

*Kaynaklar: `00-standards-index.md` (15+13 standart), `ci-conformance-gates.md` (kapı kataloğu), `enterprise-dod.md` (18 katman L3-DoD), `core-enterprise-maturity-ladder.md` (L1/L2/L3 + graduation), `enterprise-standards-audit-2026-07-01.md` (kapsam/boşluk/hayalet-kapı), `waiver-policy.md` (muafiyet), `release-policy.md` (tag/release). Kardeş standartlar: `10-business-model-switching-standard.md` (capability), `12-devops-infrastructure-standard.md` (IaC/v12n). Bu doküman hiçbir kod/şema/JSON dosyasına dokunmaz ve hiçbir standardın kuralını kopyalamaz; yalnız referanslı master checklist'tir. Çelişki halinde `core-enterprise-maturity-ladder.md` (kademe) ve `enterprise-dod.md` (18 katman) önceliklidir; bu doküman hizalanır. Değiştirme yetkisi yalnız insan onayındadır.*
