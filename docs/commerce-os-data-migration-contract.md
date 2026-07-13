# Commerce Operating System — Data / Migration Contract (Talimat)

**Durum:** DRAFT / APPROVED-INSTRUCTION — 2026-07-13 · **Kaynak yetki:** [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) (D8/D9 + folded key-recovery), [`bounded-context map`](./commerce-os-bounded-context-map.md), [`readiness oracles`](./commerce-os-vibecoder-readiness-oracles.md) O8, [`../AGENTS.md`](../AGENTS.md) §0/§4.4.
**Kapsam:** Yalnız dokümantasyon **sözleşme sınırı**. Bu dosya **şema tanımlamaz/implemente etmez**, kod/JSON/queue/node/gate üretmez, hiçbir migration/restore koşmaz ([`AGENTS.md`](../AGENTS.md) §0–§1). Şema alan-adları örnek/sözleşmedir, çalışan tanım değildir.

> **instruction-ready ≠ runtime-ready.** Burada yalnız **kim neyi sahiplenir, hangi sınır tutulur, hangi RED test önce yazılır** ilan edilir. Round-trip yeşil, ölçülmüş RPO/RTO, koşulmuş rotation drill **gelecekteki iştir** ve **var olduğu iddia edilmez** ([`Faz-6`](./enterprise-saas-phase-6-unknown-unknown-probes.md) §Stop gate; [`Faz-7`](./enterprise-saas-phase-7-traceability-baseline.md) §Phase decision). Contract-test aileleri: [`contract-test plan`](./commerce-os-contract-test-plan.md) F10/F11/F12.

## 1. D8 / D9 kararı ve authority / RACI

D8/D9 tek "data platform sahibi" reddeder; **isimli bölünmüş otorite** kullanır ([`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) §D8/§D9).

| Alan | Accountable (A) | Responsible (R) | Consulted (C) | Informed (I) |
|---|---|---|---|---|
| Export envelope/manifest/crypto/streaming/import-verify runtime | Platform | Platform data-portability | Domain payload sahipleri | Governance/audit |
| Payload şema + semantic completeness | İlgili domain (BC-01..BC-07) | Domain owner | Platform (envelope sözleşmesi) | Governance |
| Retention / disposition policy | Data governance | Governance ops | Türkiye counsel (D4) | Evidence/audit |
| Export/disposition attestation | Evidence/audit | Audit | Governance | Domain |
| Schema-evolution (expand→contract, canary, rollback) | Metadata/schema-evolution authority | Migration owner | Etkilenen tüketiciler | Platform |
| Backup/restore + RPO/RTO drill | Data-resilience authority | Ops/DR | Platform | Governance |
| Key rotation/revocation/crypto-shred **yürütmesi** | Key-management authority (KMS) | KMS + DR (joint) | — | Governance |
| Irreversible erasure **yetkisi** (crypto-shred authorize) | Governance/counsel | Türkiye counsel (D4) | Key-management | Audit |

**Provider hiçbir satırın Accountable'ı değildir.** Provider export bir **girdi**dir, system-of-record değil (D8).

## 2. Platform export envelope vs domain payload sınırı

- **Platform envelope** sahiplenir: taşıyıcı zarf, manifest, şifreleme/imza, streaming/chunking, checksum ve **import/verification runtime**. Envelope payload semantiğini **yorumlamaz**.
- **Domain payload** sahiplenir: kendi versiyonlu payload şeması + dilimin **semantic completeness**'i. Domain envelope crypto/transport'unu yeniden yazmaz.
- İki sınır **birbirine yazmaz**: envelope opak payload taşır; completeness domain'e aittir; attestation evidence/audit'e aittir.

## 3. Versiyonlu manifest / payload sınırı (şema DEĞİL, sözleşme)

Zorunlu **sözleşme alanları** (implementation-repo'da şema olur; burada tanımlanmaz):
- **manifestVersion** + **payloadSchemaVersion(lar)** — semver; geriye-uyum kuralı §5.
- **tenantIdentity** — export tek tenant'a bağlı; cross-tenant karışım fail-closed reddedilir (F3).
- **checksums** — chunk + bütün-set bütünlük özeti.
- **signatures** — imza + publisher; imzasız/kurcalanmış set fail-closed reddedilir.
- **tombstones / retention flags** — silinen/legal-hold/retention işaretli kayıtlar; sessiz silme yok.
- **completenessReport** — beklenen vs dahil kayıt sayımı + eksik-dilim listesi; boş rapor = RED.
Bu liste **alan sözleşmesidir**; JSON/DDL/migration burada üretilmez.

## 4. Round-trip tanımı ve semantic equivalence

- **Round-trip:** tam export → temiz/izole ortama import → geri-diff. **Kabul:** anlamlı diff = ∅.
- **Semantic equivalence:** byte-eşitlik değil **anlam-eşitliği**: kimlik, ilişki, durum-makinesi konumu, para/miktar, zaman-damgası anlamı korunur; türetilmiş/geçici alanlar diff-dışıdır.
- **Tenant portability:** import başka ortamda tenant'ı yeniden kurabilmeli; provider'a bağlı olmayan taşınabilirlik.
- **Attestation:** silme/disposition iddiası **retention/legal-hold yönetişimine bağlı**; "deletion-certificate" tek başına authority-resolved gibi **sunulmaz** ([`Faz-6`](./enterprise-saas-phase-6-unknown-unknown-probes.md) P6-11).

## 5. Metadata lifecycle — expand → migrate → contract

Metadata/schema-evolution authority sahibidir (D9). Zorunlu sıra:
1. **expand** — geriye-uyumlu ekleme; eski okuyucu kırılmaz.
2. **dual-read / dual-write / backfill** — hem eski hem yeni yol; eski veri yeni şekle taşınır.
3. **verify** — canary + geriye-uyum matrisi; tüketici sürüm-pin'i korunur.
4. **contract** — eski yol ancak verify sonrası kaldırılır.
- **Rollback:** her adım deterministik geri-alınabilir olmalı; downgrade yolu tanımlı.
- **Irreversible gate:** contract adımı (eski-yol silme) ve crypto-shred **geri-alınamaz**dır → ayrı, isimli, insan-onaylı gate arkasında; canary/verify yeşil **iddia edilmeden** geçilmez. Geriye-uyumsuz değişim işaretlenir (major bump, F2/F11).

## 6. Backup / restore tutarlılığı + RPO/RTO

- Data-resilience authority sahibidir (D9). **Clean-room restore** kirli/kısmi yedeği **reddeder**; bütünlük doğrulanır.
- **RPO/RTO** bağlamlı-**aday hedef**tir (ölçülene kadar): D6/pilot envelope'a bağlı; sayı **uydurulmaz** ([`Faz-6`](./enterprise-saas-phase-6-unknown-unknown-probes.md) P6-04; [`Faz-7`](./enterprise-saas-phase-7-traceability-baseline.md)).
- **Evidence:** restore drill raporu + ölçülen RPO/RTO; plan actual yerine geçmez.

## 7. Key rotation / revocation / crypto-shred yetkisi

- **Yürütme** key-management authority (KMS), **joint KMS + DR** (folded key-recovery, [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) §Folded); **irreversible erasure yetkisi** governance/counsel'a aittir (D9).
- **Yalnız yetkili KMS redundancy/recovery** kabul edilir. **Product-level escrow / plaintext fallback / bypass yasak** — kayıp anahtar ürün özelliğiyle kurtarılamaz.
- **Key loss = fail-closed:** kayıp anahtarla veri tasarımca kurtarılamaz; sessiz plaintext fallback üretilmez ([`Faz-6`](./enterprise-saas-phase-6-unknown-unknown-probes.md) P6-05; escrow authority `unresolved` iken politika uydurulmaz → **BLOCK VALIDATION**).
- Rotation/revoke deterministik; crypto-shred yalnız governance/counsel authorize edince yürür.

## 8. Deletion / legal-hold / counsel gate

- Erasure isteği **legal-hold**'u override **etmez**; çatışma deterministik çözülür, **hold-öncelikli** ([`Faz-6`](./enterprise-saas-phase-6-unknown-unknown-probes.md) P6-09; [`Faz-7`](./enterprise-saas-phase-7-traceability-baseline.md)).
- Retention × veri-sınıfı × legal-hold çatışma-önceliği ve hukuki sonuç **Türkiye counsel'a** aittir (D4); AI hukuki karar **vermez**; counsel gate açıkken karar **BLOCK VALIDATION**.
- Disposition attestation retention/legal-hold yönetişimine bağlı kalır (§4).

## 9. Provider exit / replay / degraded-mode

- Provider outage'da port/adapter arkasında **degraded-mode** + circuit-breaker; exit'te **veri taşınabilir** (round-trip, §4). Somut provider adı **yok** ([`Faz-6`](./enterprise-saas-phase-6-unknown-unknown-probes.md) P6-03).
- **Replay/idempotency:** export/import ve outbox/webhook replay tek-etki üretir; duplicate/out-of-order terminal state üstüne yazmaz (P6-13; [`contract-test plan`](./commerce-os-contract-test-plan.md) F9).

## 10. Zorunlu RED testler (önce kırmızı)

Komutlar yer tutucudur: `implementation-repo command TBD; packet must replace before development`.

| RED test | Beklenen fail-closed | Trace |
|---|---|---|
| export/import round-trip diff | diff ≠ ∅ veya eksik completeness → RED | P6-11 · D8 · F10 |
| manifest/imza/checksum doğrulama | imzasız/kurcalanmış/cross-tenant → reddedilir | D8 · F3 |
| expand→migrate→contract + rollback provası | geriye-uyum kırılır veya rollback deterministik değil → RED | P6-14 · D9 · F11 |
| irreversible gate (contract/crypto-shred) | onaysız irreversible adım → reddedilir | D9 · F11 |
| clean-room restore + RPO/RTO | kirli/kısmi restore veya hedef dışı → RED | P6-04 · F12 |
| key/region-loss fail-closed + rotation | sessiz plaintext fallback → RED | P6-05 · F12 |
| deletion vs legal-hold | erasure hold'u override eder → RED | P6-09 · D4 |
| provider exit/degraded-mode | outage'da veri kilitli/taşınamaz → RED | P6-03 · F16 |

## 11. Evidence ve stop-condition'lar

- **Evidence (beklenen, koşulmuş değil):** round-trip diff raporu, disposition attestation (counsel-review kaydına bağlı), compatibility matrisi + canary + rollback drill, restore + ölçülen RPO/RTO, key-loss/rotation drill, conflict-resolution matrisi. `evidenceExpected` (plan) **actual** yerine geçmez ([`Faz-7`](./enterprise-saas-phase-7-traceability-baseline.md) §DoD).
- **Stop-conditions:**
  1. Şema/migration/DDL bu docs reposunda **üretilmez**; sınır burada durur ([`Faz-7`](./enterprise-saas-phase-7-traceability-baseline.md) §Stop-gate).
  2. `unresolved` authority (escrow P6-05, COGS P6-10, counsel P6-09/P6-12) çözülene kadar **BLOCK VALIDATION**; sayı/politika uydurulmaz.
  3. Yer tutucu komut değiştirilmeden hiçbir alan "hazır/passed" ilan edilmez.
  4. Bu worker JSON/node/queue/schema/gate/kod/test üretmez, commit/push/merge yapmaz; yalnız bu dosyayı yazar.

## İlgili doküman

- [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) · [`bounded-context map`](./commerce-os-bounded-context-map.md) · [`readiness oracles`](./commerce-os-vibecoder-readiness-oracles.md) · [`delivery sequence`](./kernel-sdk-app-delivery-sequence.md)
- [`contract-test plan`](./commerce-os-contract-test-plan.md) · [`Faz-6 probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) · [`Faz-7 traceability`](./enterprise-saas-phase-7-traceability-baseline.md) · [`../AGENTS.md`](../AGENTS.md)
