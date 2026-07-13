# Enterprise SaaS — Faz 8 Standart/Control Crosswalk

**Rol:** Claude SLAVE writer. Codex MASTER + nihai otorite ve doğrulayıcı.
**Faz:** Faz 8 standart/control crosswalk ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 8; [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 8). Faz 7 traceability readiness **tasarımı** → yalnız docs-only Faz 8 GO sonrası ([`traceability`](./enterprise-saas-phase-7-traceability-baseline.md) §Phase decision).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> **Kritik dürüstlük.** Bu belge bir **standart→aday crosswalk referansıdır**, uyumluluk/sertifika/GA iddiası DEĞİLDİR. Standarda **atıf uyumluluk kanıtı değildir** ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 8). Hiçbir satır `compliant/certified/pass` işaretlenmez; tüm `status` yalnız **NOT-ASSESED / NOT-RUN / UNRESOLVED**'dır. Lisanslı standart metni **kopyalanmaz/alıntılanmaz**; yalnız kategori/control **referans kimliği** verilir. Mevzuat yorumu (KVKK/residency) **Türkiye counsel** insan yetkisindedir; AI hukuki karar vermez. `requirementId` yalnız mevcut Faz 5 aday (`C-5x-nn`) veya Faz 6 probe (`P6-nn`) kimliğine referanstır; **yeni requirement/node/kod üretilmez**. Bu worker JSON/node/queue/schema/gate/kod/test üretmez, commit/push/merge yapmaz; yalnız bu tek dosyayı yazar ([`AGENTS.md`](../AGENTS.md)).

## Execution record

Gerçek concurrency kullanılmadı; dosya-sahipliği çakışmasını önlemek için işler **sıralı** yürütüldü, paralellik iddiası yoktur. Aşağıdaki **8 yeni bounded sıralı görev** her biri direktifin bir zorunlu lane'ini kapsar (X8-01..X8-08). Hiçbiri paralel koşmadı; hiçbir lane başka lane'e yetki vermez.

| Görev | Lane (Faz 8) | Kapsam | Crosswalk bölümü |
|---|---|---|---|
| `X8-01` | ISO 25010 | ürün kalite modeli kategorileri → aday | §X8-01 |
| `X8-02` | NIST CSF / SSDF | siber çerçeve + güvenli geliştirme pratikleri → aday | §X8-02 |
| `X8-03` | OWASP ASVS | uygulama doğrulama gereksinim aileleri → aday | §X8-03 |
| `X8-04` | privacy / residency | gizlilik/veri-yerleşimi governance → aday (counsel-gated) | §X8-04 |
| `X8-05` | NIST AI RMF | AI risk yönetimi fonksiyonları → aday | §X8-05 |
| `X8-06` | accessibility | WCAG 2.2 erişilebilirlik başarı kriterleri → aday | §X8-06 |
| `X8-07` | reliability | ISO 25010 güvenilirlik/performans + D5/D6 evidence → aday | §X8-07 |
| `X8-08` | supply-chain | SSDF + SBOM/provenance kanıt → aday | §X8-08 |

## Resmî kaynak referansları (HTTPS, Codex-teyitli sürümler · 2026-07-13)

Standart metni kopyalanmadan yalnız kanonik sürüm ve resmî bağlantı verilir:

- **ISO/IEC 25010:2023** (edition 2, ürün kalite modeli) — <https://www.iso.org/standard/78176.html>
- **NIST CSF 2.0** (2024) — <https://www.nist.gov/cyberframework> · <https://doi.org/10.6028/NIST.CSWP.29>
- **NIST SP 800-218 SSDF v1.1** (2022) — <https://csrc.nist.gov/pubs/sp/800/218/final>
- **OWASP ASVS v5.0.0** (yayın 2025-05-30) — <https://owasp.org/www-project-application-security-verification-standard/>
- **ISO/IEC 27001:2022** (bilgi güvenliği yönetimi; sertifika iddiası yok) — <https://www.iso.org/standard/27001>
- **NIST AI RMF 1.0 / NIST AI 100-1** (2023, **resmî sayfada revizyon altında**) — <https://www.nist.gov/itl/ai-risk-management-framework> · <https://doi.org/10.6028/NIST.AI.100-1>
- **WCAG 2.2** (W3C Recommendation, güncelleme 2024-12-12) — <https://www.w3.org/TR/WCAG22/> · ISO/IEC 40500:2025 katalog-notu (conformance iddiası yok) — <https://www.iso.org/>
- **Supply chain kanıt formatları** (SBOM/provenance) — SPDX <https://spdx.dev> · CycloneDX <https://cyclonedx.org> · SLSA <https://slsa.dev>. Bu formatların repo-teyitli sürümü **yok** → `source-version TBD`; uydurulmaz.

Lokal kanıt kaynakları (relative): [`5a`](./enterprise-saas-phase-5a-strategy-commercial-candidates.md) · [`5c`](./enterprise-saas-phase-5c-data-metadata-candidates.md) · [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md) · [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) · [`5f`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md) · [`5g`](./enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md) · [`5h`](./enterprise-saas-phase-5h-ai-data-science-candidates.md) · [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) · [`traceability`](./enterprise-saas-phase-7-traceability-baseline.md).

## Crosswalk satır sözleşmesi

Her satır sekiz **boş-olmayan** alan taşır: `standard` · `version` · `controlId` · `applicability` · `requirementId` · `evidence` · `waiver` · `status`. `controlId` yalnız resmî kategori/pratik/başarı-kriteri **kimliğidir** (metin değil). ASVS için leaf gereksinim seçimi güvenlik-review'a bırakılır; sürüm-nitelikli `V5.0.0` başlık kimliği verilir, uydurma leaf numarası yazılmaz. `status` yalnız NOT-ASSESED/NOT-RUN/UNRESOLVED. `waiver` ya insan owner + expiry/review taşır ya da `none; evidence required` der; **sessiz waiver yoktur**.

### §X8-01 · ISO 25010

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| ISO/IEC 25010 | 2023 (ed.2) | Security → Confidentiality | çok-tenant gizlilik; cross-tenant sızıntı kapsamı | C-5D-02 · P6-01 | tenant-escape negatif suite raporu (impl-repo TBD); [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md)·[`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) | none; evidence required (impl-repo drill) | NOT-RUN |
| ISO/IEC 25010 | 2023 (ed.2) | Performance efficiency → Time behaviour | komşu tenant p95; noisy-neighbor izolasyonu | C-5E-03 · P6-02 | load-isolation + per-tenant p95 raporu (impl-repo TBD); [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) | none; evidence required (ölçülmemiş; aday hedef) | NOT-RUN |
| ISO/IEC 25010 | 2023 (ed.2) | Interaction capability → Operability | operator/admin yüzeyi kullanılabilirliği | C-5G-02 | operator-workbench a11y/usability smoke (impl-repo TBD); [`5g`](./enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md) | none; evidence required | NOT-ASSESED |

### §X8-02 · NIST CSF / SSDF

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| NIST CSF | 2.0 (2024) | PR.AA (Identity/Auth/Access Control) | ayrıcalıklı erişim + görev ayrımı | C-5D-11 | duty-matrix/toxic-combination policy kanıtı (impl-repo TBD); [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md) | owner: security/SoD owner; review: Faz 9 öncesi (owner unresolved) | UNRESOLVED |
| NIST CSF | 2.0 (2024) | RS.MA (Incident Management) | olay müdahale/eskalasyon | C-5E-06 | incident runbook + eskalasyon kaydı (impl-repo TBD); [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) | none; evidence required | NOT-ASSESED |
| NIST SP 800-218 SSDF | v1.1 (2022) | PW.4 (well-secured components reuse) | plugin/bağımlılık güven zinciri | C-5D-06 · P6-06 | exfiltration negatif + SBOM/imza raporu (impl-repo TBD); [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) | none; evidence required | NOT-RUN |

### §X8-03 · OWASP ASVS

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| OWASP ASVS | v5.0.0 (2025-05-30) | Authorization (chapter; leaf-req selection-TBD) | deny-by-default yetkilendirme; cross-tenant erişim reddi | C-5D-02 · P6-01 | authz negatif suite raporu (impl-repo TBD); leaf vX.Y.Z güvenlik-review seçer | owner: security review; review: leaf seçiminde | NOT-RUN |
| OWASP ASVS | v5.0.0 (2025-05-30) | Cryptography (chapter; leaf-req selection-TBD) | anahtar yaşam döngüsü; key-loss fail-closed | C-5D-05 · P6-05 | key-loss/rotation drill raporu (impl-repo TBD); [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md) | owner: ops/DR + recovery/escrow authority (unresolved); review: P6-05 çözümünde | UNRESOLVED |
| OWASP ASVS | v5.0.0 (2025-05-30) | Authentication (chapter; leaf-req selection-TBD) | kimlik doğrulama; federation/machine identity | C-5B-02 · C-5B-03 | authn kontrol kanıtı (impl-repo TBD); [`5b`](./enterprise-saas-phase-5b-identity-tenant-org-candidates.md)·[`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) | none; evidence required | NOT-ASSESED |

### §X8-04 · privacy / residency

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| ISO/IEC 27001 | 2022 | A.5.34 (privacy & PII protection) | erasure × legal-hold × retention çatışması | C-5D-09 · P6-09 | conflict-resolution matrisi + hold/erasure kanıtı (impl-repo TBD); [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) | owner: Türkiye counsel (D4) + data owner; review: counsel gate açık | UNRESOLVED |
| ISO/IEC 27001 | 2022 | A.5.14 (information transfer / residency) | jurisdiction/residency drift; counsel gate | C-5C-08 · P6-12 | boundary table + residency-lineage audit (impl-repo TBD); [`5c`](./enterprise-saas-phase-5c-data-metadata-candidates.md) | owner: Türkiye counsel (D4); review: Faz 9 öncesi (KVKK yorumu insan) | UNRESOLVED |

### §X8-05 · NIST AI RMF

NIST AI RMF 1.0 / AI 100-1 (2023) resmî sayfada **revizyon altındadır**; kimlikler mevcut sürüm içindir, sonraki sürümde değişebilir.

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| NIST AI RMF | 1.0 (2023; under revision) | MEASURE (2.x eval/drift) | model eval regression / silent-failure/drift | C-5H-06 · P6-07 | golden/adversarial eval + drift/abstain/override kanıtı (impl-repo TBD); [`5h`](./enterprise-saas-phase-5h-ai-data-science-candidates.md) | none; evidence required | NOT-RUN |
| NIST AI RMF | 1.0 (2023; under revision) | MANAGE (4.x incident/override) | agent/ECA runaway; human-stop/kill-switch | C-5H-12 · P6-08 | ECA runaway negatif suite (depth/forbidden/human-stop) (impl-repo TBD); [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) | none; evidence required | NOT-RUN |

### §X8-06 · accessibility

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| WCAG | 2.2 (W3C Rec, 2024-12-12) | SC 2.1.1 Keyboard (Level A) | klavye-erişilebilir domain akışları | C-5G-08 | axe 0-ihlal + klavye smoke raporu (impl-repo TBD); [`5g`](./enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md) | none; evidence required | NOT-ASSESED |
| WCAG | 2.2 (W3C Rec, 2024-12-12) | SC 3.3.1 Error Identification (Level A) | erişilebilir hata/exception UX | C-5G-03 | error-UX a11y smoke raporu (impl-repo TBD); [`5g`](./enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md) | none; evidence required | NOT-ASSESED |

ISO/IEC 40500:2025 WCAG'ı benimseyen ISO katalog kaydı olarak **not edilir**; burada conformance/uyumluluk iddiası **yoktur**.

### §X8-07 · reliability (ISO 25010:2023 + D5/D6 evidence)

Uydurma control ID kullanılmaz; ISO/IEC 25010:2023 güvenilirlik/performans kategorilerine ve D5/D6 evidence-control adaylarına eşlenir.

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| ISO/IEC 25010 | 2023 (ed.2) | Reliability → Recoverability | clean-room restore; RPO/RTO (D5/D6) | C-5E-04 · P6-04 | restore drill + ölçülen RPO/RTO raporu (impl-repo TBD); [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) | none; evidence required (aday hedef, ölçülmemiş) | NOT-RUN |
| ISO/IEC 25010 | 2023 (ed.2) | Reliability → Fault tolerance | provider outage degraded-mode/exit (D6) | C-5E-12 · P6-03 | failover + degraded-mode + exit-portability raporu (impl-repo TBD); [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) | none; evidence required | NOT-RUN |
| ISO/IEC 25010 | 2023 (ed.2) | Reliability → Availability | SLI/SLO/error-budget (D6 %99.9 bağlamlı) | C-5E-01 | SLO/error-budget ölçüm raporu (impl-repo TBD); [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) | none; evidence required (ölçülmemiş) | NOT-ASSESED |

### §X8-08 · supply-chain

| standard | version | controlId | applicability | requirementId | evidence | waiver | status |
|---|---|---|---|---|---|---|---|
| NIST SP 800-218 SSDF | v1.1 (2022) | PS.3 (provenance / SBOM) | plugin/artifact provenance; SBOM üretimi | C-5D-06 · P6-06 | SBOM + provenance + imza raporu (impl-repo TBD; SBOM format `source-version TBD`); [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) | none; evidence required (SBOM/SLSA sürümü repo-teyitsiz) | NOT-RUN |
| NIST SP 800-218 SSDF | v1.1 (2022) | RV.1 (vulnerability identification) | bağımlılık/vuln yönetimi | C-5D-07 | dependency/vuln tarama çıktısı (impl-repo TBD); [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md) | owner: security owner; review: Faz 9 öncesi (owner unresolved) | UNRESOLVED |

## Eksik kontrol aileleri (kanıtsız/atanmamış)

- **Ödeme/kart (PCI DSS):** regulated settlement provider entegrasyonudur ([`integration`](./enterprise-saas-phase-5-integration-decision.md)); PCI kapsamı bu crosswalk'a **atanmadı** → NOT-ASSESED, provider/counsel sınırı.
- **Gizlilik yönetim sistemi (ISO/IEC 27701):** privacy governance için aday değildir; KVKK yorumu counsel-gated → eklenmedi, `source-version TBD`.
- **SBOM/provenance sürümü (SPDX/CycloneDX/SLSA):** repo-teyitli sürüm yok → `source-version TBD`; leaf uyum eşlemesi yapılmadı.
- **ASVS leaf gereksinimleri (vX.Y.Z):** sürüm-nitelikli başlık verildi; leaf seçimi güvenlik-review'a bırakıldı, uydurulmadı.
- **SOC 2 / denetim attestation:** attestation iddiası **yoktur**; bu docs reposunda audit kanıtı üretilemez.

## Counsel / lisanslı-metin sınırı

- Lisanslı standart metni (ISO/W3C/OWASP/NIST tam gereksinim ifadeleri) **kopyalanmadı/alıntılanmadı**; yalnız kategori/pratik/SC **kimlikleri** kullanıldı.
- Mevzuat yorumu gerektiren satırlar (privacy/residency: C-5D-09, C-5C-08; jurisdiction: C-5D-14/P6-12) **Türkiye counsel** insan yetkisindedir; bu satırlar hiçbir koşulda `passed/compliant` değildir.
- AI hukuki karar üretmez; counsel gate açık kaldıkça status = UNRESOLVED.

## Red-to-green kontroller (checklist, executable gate değil)

| Kontrol | Tür | Red koşulu |
|---|---|---|
| 8 lane bölümü (X8-01..X8-08) mevcut | AUTO (metin taraması) | 8'den az lane |
| ≥16 crosswalk satırı, lane başına ≥2 | AUTO | herhangi lane'de <2 satır |
| Her satırda 8 zorunlu alan dolu | AUTO | boş `standard..status` hücresi |
| status ∈ {NOT-ASSESED, NOT-RUN, UNRESOLVED} | AUTO | `compliant/certified/pass/validated` iddiası |
| waiver = human owner+expiry/review veya "none; evidence required" | MANUAL | sessiz/boş waiver |
| Standart metni kopyalanmadı | MANUAL | lisanslı tam-metin alıntısı |
| requirementId yalnız mevcut C-5x/P6 kimliği | MANUAL | yeni requirement/node icadı |
| Resmî HTTPS + relative kanıt link hedefleri | AUTO (`git`/reviewer) | kırık/absolute link |
| Allowed-files (yalnız bu dosya) | AUTO (`git status` Codex'te) | başka dosya değişikliği |

## Stop-gate'ler

1. Standarda **atıf uyumluluk iddiası DEĞİLDİR** ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 8 stop-gate); hiçbir satır `compliant/certified/pass`.
2. Counsel-gated satırlarda (privacy/residency/jurisdiction) hukuki sonuç AI tarafından **üretilemez**; Türkiye counsel gate açık.
3. `source-version TBD` (SBOM/SLSA/ISO 40500 leaf) uydurulmaz; teyit yoksa TBD kalır.
4. Faz 7 zinciri açık: 14/14 probe NOT-RUN/UNRESOLVED; bu crosswalk **kanıt değil hazırlık haritasıdır**.
5. Bu worker JSON/node/queue/schema/gate/kod/test üretmez, commit/push/merge yapmaz; kirli worktree'ye yazmaz.

## Phase decision

**Faz 8 standart/control crosswalk **referansı** tamamlandı (docs-only) → GO yalnız docs-only Faz 9 (tutarlılık/dedup/adversarial review) kapısına.** Hiçbir uyumluluk/sertifika/GA iddiası yoktur; tüm status NOT-ASSESED/NOT-RUN/UNRESOLVED. **Yayın (publication) ve development açılmaz**; requirement baseline, app/module promotion, generated JSON, queue/node/schema/gate kapalı kalır ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 9–11). Bu belge **crosswalk tasarımıdır, koşulmuş kanıt/audit değildir**; Codex bağımsız doğrulamadan tamamlanmış sayılmaz.
