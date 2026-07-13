# Enterprise SaaS — Faz 6 Unknown-Unknown Probe Sözleşmesi

**Rol:** Claude SLAVE writer. Codex MASTER + nihai otorite ve doğrulayıcı.
**Faz:** Faz 6 unknown-unknown probe programı ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 6; [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 6). Faz 5 docs-only candidate completeness → GO sonrası ([`integration`](./enterprise-saas-phase-5-integration-decision.md) §Phase decision).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **probe handoff tasarımıdır (executable handoff design), koşulmuş test DEĞİLDİR.** Bu `actionplan` docs reposunda **ürün runtime'ı yoktur**; hiçbir drill burada koşulamaz. Her `result` bu nedenle **NOT-RUN** veya **UNRESOLVED**'dır; `confirmed/rejected` yalnız `platform` implementation-repo'sunda gerçek drill kanıtı üretildiğinde ve Codex doğruladığında atanır. Bu worker JSON/node/queue/schema/gate/kod/test üretmez, commit/push/merge yapmaz. Somut provider/vendor, region, hukuki sonuç veya implementation ayrıntısı **uydurulmaz** ([`AGENTS.md`](../AGENTS.md) §0–§4).

## Execution record

Gerçek concurrency kullanılmadı; dosya-sahipliği çakışmasını önlemek için işler **sıralı** yürütüldü, paralellik iddiası yoktur. Aşağıdaki 14 bounded analyst görevi bu changeset'e eklenen yeni sıralı işlerdir; her görev **bir** probe tasarlar ve tek `analyst` lane türündedir (writer/integration değil). Görevler [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 6 lane setinin legal · architecture/scale · data · security/abuse · operations/DR · AI · migration/exit risklerini probe eder. `market` lane'i D2 ile insan-kararlı discovery/ICP gate'idir; runtime breakage probe'u değildir ve on dört probe'luk sette ayrı görev almaz.

| Görev | Probe | Faz 6 lane | Çıktı |
|---|---|---|---|
| `P6-01` | probe-tenant-leakage | security/abuse | cross-tenant + cache/search/projection sızıntı probe tasarımı |
| `P6-02` | probe-noisy-neighbor | operations/DR | D6 komşu p95 ≤%20 degradasyon probe tasarımı |
| `P6-03` | probe-provider-outage-exit | migration/exit | provider kesintisi + exit portability/degraded-mode tasarımı |
| `P6-04` | probe-restore-failure | operations/DR | restore başarısızlığı + RPO/RTO hedef tasarımı |
| `P6-05` | probe-region-key-loss | operations/DR | region/key kaybı, rotation/recovery/fail-closed tasarımı |
| `P6-06` | probe-plugin-exfiltration | security/abuse | plugin exfiltration/supply-chain/imza/egress tasarımı |
| `P6-07` | probe-ai-silent-failure | AI | model drift / eval regression / silent-failure tasarımı |
| `P6-08` | probe-eca-runaway | AI | agent/ECA runaway depth/forbidden-write/human-stop tasarımı |
| `P6-09` | probe-deletion-legalhold | data | deletion-retention-legal-hold çatışma tasarımı |
| `P6-10` | probe-kpi-reconciliation | data | KPI/ledger/provider reconciliation mismatch tasarımı |
| `P6-11` | probe-export-import-roundtrip | migration/exit | export/import round-trip + tenant portability tasarımı |
| `P6-12` | probe-jurisdiction-drift | legal | jurisdiction/regulated-role drift + Türkiye counsel gate |
| `P6-13` | probe-replay-idempotency | architecture/scale | replay/idempotency/duplicate command-event tasarımı |
| `P6-14` | probe-metadata-upgrade | migration/exit | metadata upgrade/migration blast radius + rollback tasarımı |

Claude yalnız probe hipotezi, fixture, evidence tipi ve stop-gate **tasarımını** üretir. Codex gerçek diff'i bağımsız doğrular; tasarım kanıt (drill) sayılmaz.

## Probe sözleşmesi (P6-01..P6-14)

Her probe zorunlu alanları taşır: `probeId · hypothesis · trigger · blastRadius · owner · method · fixture · expectedEvidence · timebox · result · decision`. `owner` = tasarım-sahibi analyst lane (vendor/rol-atama değil). `method`/`fixture` = drill tasarımı; koşulmuş test değil. `expectedEvidence` = implementation-repo'da beklenen kanıt tipi. Tüm `result` = **NOT-RUN**/**UNRESOLVED**; yüksek-risk `decision` = **BLOCK VALIDATION**.

### P6-01 · probe-tenant-leakage · riskTier: high
- **hypothesis:** Tenant izolasyonu birincil DB path'te tutsa da cache/search index/read-model projection katmanında cross-tenant obje/anahtar sızabilir.
- **trigger:** Aynı anahtarla iki tenant; cache warm + shared search index + projection rebuild; tenant'sız context.
- **blastRadius:** Çok-tenant gizlilik ihlali; tüm izole veri sınıfları; D3 platform authority sınırı.
- **owner:** security/abuse analyst (P6-01).
- **method:** İki-tenant escape suite tasarımı; cache/search/projection okuma-yazma cross-tenant negatif senaryoları; **artı RAG/vector/embedding retrieval katmanında cross-tenant embedding/korpus sızıntısı** (bir tenant'ın vektör/embedding'i başka tenant'a dönemez) negatif senaryoları; fail-closed doğrulaması. (Tasarım; koşulmadı.)
- **fixture:** İki-tenant fixture + paylaşılan cache/search/projection **+ vector/embedding/RAG retrieval** ortamı (implementation-repo).
- **expectedEvidence:** tenant-escape negatif suite raporu (cache/search/projection **+ vector/embedding/RAG retrieval** dahil).
- **timebox:** 1 analiz-günü tasarım; drill implementation-repo'da ayrı.
- **result:** NOT-RUN (ürün runtime'ı yok).
- **decision:** **BLOCK VALIDATION** — [`C-5D-02`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md), [`C-5B-06`](./enterprise-saas-phase-5b-identity-tenant-org-candidates.md), [`C-5C-11`](./enterprise-saas-phase-5c-data-metadata-candidates.md), [`C-5H-04`](./enterprise-saas-phase-5h-ai-data-science-candidates.md) (vector/embedding/RAG tenant leakage); D3.

### P6-02 · probe-noisy-neighbor · riskTier: high
- **hypothesis:** Bir tenant'ın yük tepesi komşu tenant p95'ini eşik üstünde bozar; per-tenant cost attribution eksik marj erir.
- **trigger:** Tek tenant'ta aşırı istek/işlem hacmi; quota/isolation aktif.
- **blastRadius:** Komşu tenant SLO'su; unit-economics; D6 SLO/COGS bağlamı.
- **owner:** operations/DR analyst (P6-02).
- **method:** Load-isolation drill tasarımı: hedef **komşu p95 degradasyonu ≤ %20** (D6 bağlamlı hedef, ölçülene kadar aday); per-tenant cost attribution ölçümü. (Tasarım; koşulmadı.)
- **fixture:** Çok-tenant yük fixture + izolasyon bütçesi (implementation-repo).
- **expectedEvidence:** load-isolation raporu + per-tenant p95/cost ölçümü.
- **timebox:** 1 analiz-günü tasarım; yük drill'i ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5E-03`](./enterprise-saas-phase-5e-reliability-operations-candidates.md), [`C-5B-08`](./enterprise-saas-phase-5b-identity-tenant-org-candidates.md), [`C-5F-07`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md); D6.

### P6-03 · probe-provider-outage-exit · riskTier: high
- **hypothesis:** Tek sağlayıcı (PSP/AI/search) kesildiğinde ürün durur; exit'te portability/degraded-mode tanımsız.
- **trigger:** Sağlayıcı outage enjeksiyonu; ardından provider-exit senaryosu.
- **blastRadius:** İş sürekliliği; provider'a bağlı tüm akışlar; D6 build/buy/provider.
- **owner:** migration/exit analyst (P6-03).
- **method:** Port/adapter arkasında failover + degraded-mode + exit-portability drill tasarımı; circuit-breaker davranışı. Somut provider adı **yok**. (Tasarım; koşulmadı.)
- **fixture:** Provider-neutral port fixture + outage/exit injektörü (implementation-repo).
- **expectedEvidence:** failover + degraded-mode + exit-portability drill raporu.
- **timebox:** 1 analiz-günü tasarım; drill ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5F-11`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md), [`C-5E-12`](./enterprise-saas-phase-5e-reliability-operations-candidates.md), [`C-5F-03`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md), [`C-5H-14`](./enterprise-saas-phase-5h-ai-data-science-candidates.md); D6.

### P6-04 · probe-restore-failure · riskTier: high
- **hypothesis:** Backup var ama clean-room restore başarısız/eksik; RPO/RTO ölçülmemiş.
- **trigger:** Backup'tan clean-room restore denemesi; kısmi/kirli yedek senaryosu.
- **blastRadius:** Veri kurtarma; iş sürekliliği; D5 evidence-control drill'leri.
- **owner:** operations/DR analyst (P6-04).
- **method:** Restore-from-clean-room drill tasarımı; bağlamlı hedef **RPO ≤ 15dk / RTO ≤ 4sa** (ölçülene kadar aday, uydurulmaz); restore bütünlük doğrulaması. (Tasarım; koşulmadı.)
- **fixture:** Clean-room ortam + backup seti (implementation-repo).
- **expectedEvidence:** restore drill raporu + ölçülen RPO/RTO.
- **timebox:** 1 analiz-günü tasarım; drill ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5E-04`](./enterprise-saas-phase-5e-reliability-operations-candidates.md), [`C-5C-10`](./enterprise-saas-phase-5c-data-metadata-candidates.md), [`C-5E-11`](./enterprise-saas-phase-5e-reliability-operations-candidates.md); D5/D6.

### P6-05 · probe-region-key-loss · riskTier: high
- **hypothesis:** Region veya ana-anahtar kaybında sistem fail-closed davranmaz; rotation/recovery yolu deterministik değil.
- **trigger:** Region-loss ve key-loss/revoke enjeksiyonu.
- **blastRadius:** Şifreli tüm veri; residency; süreklilik; D6 provider + D4 residency.
- **owner:** operations/DR analyst (P6-05).
- **method:** Region-loss + key-loss/rotation/recovery drill tasarımı; kayıp anahtar sessiz plaintext fallback ÜRETMEZ; fail-closed + deterministik kurtarma. Recovery/escrow authority contract'ta belirsiz (`unresolved`), politika uydurulmaz. (Tasarım; koşulmadı.)
- **fixture:** KMS + multi-region fixture + loss injektörü (implementation-repo).
- **expectedEvidence:** key-loss/region-loss drill + rotation/revoke raporu.
- **timebox:** 1 analiz-günü tasarım; drill ayrı.
- **result:** UNRESOLVED (recovery/escrow authority tanımsız).
- **decision:** **BLOCK VALIDATION** — [`C-5E-05`](./enterprise-saas-phase-5e-reliability-operations-candidates.md), [`C-5D-05`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md), [`C-5B-07`](./enterprise-saas-phase-5b-identity-tenant-org-candidates.md); D6/D4.

### P6-06 · probe-plugin-exfiltration · riskTier: high
- **hypothesis:** İmzalı görünen plugin/supply-chain güncellemesi kapsam-dışı egress ile veri sızdırır.
- **trigger:** Sandbox'lı plugin install/enable + malicious-update + permission-diff senaryosu.
- **blastRadius:** Modül-erişimli tüm veri; tenant izolasyonu; D3 platform authority.
- **owner:** security/abuse analyst (P6-06).
- **method:** İmza/publisher fail-closed doğrulama, no-egress/sandbox, permission-diff, malicious-update negatif drill tasarımı. AI modül yükleyemez/izin veremez. (Tasarım; koşulmadı.)
- **fixture:** Sandbox modül fixture + SBOM/imza + egress monitörü (implementation-repo).
- **expectedEvidence:** exfiltration negatif suite + SBOM/imza + permission-diff raporu.
- **timebox:** 1 analiz-günü tasarım; drill ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5D-06`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md), [`C-5F-06`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md), [`C-5F-05`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md); D3.

### P6-07 · probe-ai-silent-failure · riskTier: high
- **hypothesis:** Model doğru görünerek hatalı karar üretir; drift/eval regression sessizce geçer.
- **trigger:** Golden/adversarial eval seti + model/prompt sürüm değişimi + drift sinyali.
- **blastRadius:** AI-destekli tüm kararlar; müşteri güveni; D6 provider + D5 pilot.
- **owner:** AI analyst (P6-07).
- **method:** Golden/adversarial eval, drift monitor, abstain ve human-override drill tasarımı; **artı prompt-injection / indirect (dolaylı) injection** negatif senaryoları (harici içerikteki "talimat" yürütülmez) **ve AI I/O gizlilik/PII-redaction** (girdi/çıktıda maskesiz PII/secret sızmaz) drill tasarımı; eval regression **ve injection/privacy ihlali** release'i bloklar. Auto-degrade/abstain otomatik fail-safe olabilir; **model/version rollback insan-gated** ([`C-5H-06`](./enterprise-saas-phase-5h-ai-data-science-candidates.md)). (Tasarım; koşulmadı.)
- **fixture:** Golden set + adversarial fixture + drift baseline **+ prompt/indirect-injection payload seti + PII/secret redaction fixture** (implementation-repo).
- **expectedEvidence:** eval raporu + drift/abstain/override kanıtı **+ injection negatif suite + PII/secret redaction denetimi**.
- **timebox:** 1 analiz-günü tasarım; eval drill ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5H-06`](./enterprise-saas-phase-5h-ai-data-science-candidates.md), [`C-5H-05`](./enterprise-saas-phase-5h-ai-data-science-candidates.md), [`C-5H-01`](./enterprise-saas-phase-5h-ai-data-science-candidates.md), [`C-5H-03`](./enterprise-saas-phase-5h-ai-data-science-candidates.md) (prompt/indirect-injection), [`C-5H-07`](./enterprise-saas-phase-5h-ai-data-science-candidates.md) (AI I/O privacy); D6/D5.

### P6-08 · probe-eca-runaway · riskTier: high
- **hypothesis:** Agent/ECA zinciri max derinliği aşar, forbidden target'a yazar veya human-stop'u bypass eder.
- **trigger:** Zincir derinliği **>6**, `forbiddenTargets` (app/module) write denemesi, kill-switch/step-up bypass girişimi.
- **blastRadius:** Yetki sınırı; prod bütünlük; D3 platform authority + AI yetki kilidi ([`AGENTS.md`](../AGENTS.md) §4.4).
- **owner:** AI analyst (P6-08).
- **method:** Depth>6, forbidden app/module write, kill-switch ve step-up negatif test tasarımı; **artı agent tool-permission escape** (ajan allow-list dışı tool/veri çağıramaz, deny-by-default, PDP-gated; kapsam-dışı tool/secret erişimi reddedilir) negatif test tasarımı; hepsi reddedilmeli. (Tasarım; koşulmadı.)
- **fixture:** ECA runtime fixture + ruleset + kill-switch **+ tool-permission allow-list/broker** (implementation-repo).
- **expectedEvidence:** ECA runaway negatif suite raporu (depth/forbidden/human-stop **+ tool-permission escape**).
- **timebox:** 1 analiz-günü tasarım; drill ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5H-12`](./enterprise-saas-phase-5h-ai-data-science-candidates.md), [`C-5H-10`](./enterprise-saas-phase-5h-ai-data-science-candidates.md), [`C-5H-09`](./enterprise-saas-phase-5h-ai-data-science-candidates.md), [`C-5H-11`](./enterprise-saas-phase-5h-ai-data-science-candidates.md) (agent tool-permission escape); D3.

### P6-09 · probe-deletion-legalhold · riskTier: high
- **hypothesis:** Erasure isteği audit/finans/legal-hold ile çakışır; öncelik ve sonuç belirsiz.
- **trigger:** Legal-hold altındaki kayda erasure isteği; veri-sınıfı × retention çatışması.
- **blastRadius:** Uyum + veri hakları; D4 counsel-gated jurisdiction.
- **owner:** data analyst (P6-09).
- **method:** Veri-sınıfı × retention-conflict simülasyon tasarımı; legal-hold erasure'ı override eder mi çatışma-oracle'ı; counsel yorumu insan yetkisinde. (Tasarım; koşulmadı.)
- **fixture:** Retention/legal-hold fixture + veri-sınıf kaydı (implementation-repo).
- **expectedEvidence:** conflict-resolution matrisi + hold/erasure karar kanıtı.
- **timebox:** 1 analiz-günü tasarım; simülasyon ayrı.
- **result:** UNRESOLVED (counsel yorumu + öncelik authority açık).
- **decision:** **BLOCK VALIDATION** — [`C-5C-07`](./enterprise-saas-phase-5c-data-metadata-candidates.md), [`C-5D-09`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md); D4.

### P6-10 · probe-kpi-reconciliation · riskTier: medium
- **hypothesis:** Aynı KPI ledger/metering/provider kaynakları arasında uyuşmaz; metric semantiği app'ler arası farklı.
- **trigger:** Metering, ledger ve provider raporu karşılaştırması; aynı KPI çoklu hesaplama.
- **blastRadius:** Faturalama/marj güveni; D6 SLO/COGS.
- **owner:** data analyst (P6-10).
- **method:** Metric semantic contract + reconciliation test tasarımı; ledger↔metering↔provider uzlaşması. (Tasarım; koşulmadı.)
- **fixture:** Metering/ledger/provider-usage fixture (implementation-repo).
- **expectedEvidence:** reconciliation raporu + tolerans dışı delta listesi.
- **timebox:** 1 analiz-günü tasarım; reconciliation drill ayrı.
- **result:** UNRESOLVED (cost/COGS allocation owner `unresolved`, [`integration`](./enterprise-saas-phase-5-integration-decision.md) §Cross-lane).
- **decision:** **BLOCK VALIDATION** — [`C-5C-12`](./enterprise-saas-phase-5c-data-metadata-candidates.md), [`C-5A-06`](./enterprise-saas-phase-5a-strategy-commercial-candidates.md), [`C-5E-10`](./enterprise-saas-phase-5e-reliability-operations-candidates.md); D6.

### P6-11 · probe-export-import-roundtrip · riskTier: medium
- **hypothesis:** Export eksik/yeniden içe alınamaz; tenant portability doğrulanamaz; exit'te silme/disposition **counsel/retention-yönetişimli attestation** olmadan doğrulanamaz (bare "deletion-certificate" iddiası owner'sız/emsalsizdir).
- **trigger:** Tam export → temiz ortama import → round-trip diff; ardından retention/legal-hold ile uyumlu silme/disposition attestation talebi.
- **blastRadius:** Müşteri exit hakkı; kilitlenme riski; D5 pilot exit; **silme × retention × legal-hold çatışması** (D4 counsel-gated).
- **owner:** migration/exit analyst (P6-11).
- **method:** Round-trip portability + **counsel/retention-governed deletion/disposition attestation** drill tasarımı; export bütünlük + re-import eşitliği. Silme/disposition attestation **retention/legal-hold yönetişimine tabidir** ([`C-5C-07`](./enterprise-saas-phase-5c-data-metadata-candidates.md) authority; [`C-5D-09`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md) çatışma-önceliği **unresolved/counsel-hipotez**); bare deletion-certificate authority resolved gibi **sunulmaz**; hukuki sonuç Türkiye counsel'a aittir. (Tasarım; koşulmadı.)
- **fixture:** Tenant veri seti + export/import mapping fixture **+ retention/legal-hold/disposition kaydı** (implementation-repo).
- **expectedEvidence:** round-trip diff raporu + **retention/legal-hold-yönetişimli deletion/disposition attestation kanıtı** (counsel-review kaydına bağlı).
- **timebox:** 1 analiz-günü tasarım; drill ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5C-09`](./enterprise-saas-phase-5c-data-metadata-candidates.md), [`C-5F-10`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md), [`C-5A-09`](./enterprise-saas-phase-5a-strategy-commercial-candidates.md), [`C-5C-07`](./enterprise-saas-phase-5c-data-metadata-candidates.md) (retention/disposition governance); D5/D4.

### P6-12 · probe-jurisdiction-drift · riskTier: high
- **hypothesis:** Ürün istemeden regulated role üstlenir; jurisdiction/residency drift'i Türkiye counsel gate'ini atlar.
- **trigger:** Regulated-action sınır tablosu taraması; residency-lineage denetimi; yeni akış eklenişi.
- **blastRadius:** Hukuki maruziyet; uyum; D4 Türkiye jurisdiction + counsel gate.
- **owner:** legal analyst (P6-12).
- **method:** Counsel-review + regulated-action boundary table + residency-lineage audit tasarımı. **Hukuki sonuç üretilmez**; yorum Türkiye-yetkili counsel'a aittir (D4). (Tasarım; koşulmadı.)
- **fixture:** Regulated-action envanteri + residency lineage fixture (implementation-repo).
- **expectedEvidence:** counsel-review kaydı + boundary table + residency audit.
- **timebox:** 1 analiz-günü tasarım; counsel gate insan yetkisinde.
- **result:** UNRESOLVED (counsel gate açık; AI hukuki karar vermez).
- **decision:** **BLOCK VALIDATION** — [`C-5D-14`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md), [`C-5G-07`](./enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md), [`C-5C-08`](./enterprise-saas-phase-5c-data-metadata-candidates.md); D4.

### P6-13 · probe-replay-idempotency · riskTier: high
- **hypothesis:** Duplicate/replayed command veya event çift-yazma, yanlış sıra veya bozuk read-model üretir.
- **trigger:** Aynı komut/event tekrarı; out-of-order teslim; outbox/webhook replay.
- **blastRadius:** Veri bütünlüğü; projection tutarlılığı; D3 versioned contract/event/outbox sınırı.
- **owner:** architecture/scale analyst (P6-13).
- **method:** Idempotency-key + replay + duplicate + ordering property test tasarımı; çift-etki reddedilir. (Tasarım; koşulmadı.)
- **fixture:** API/outbox/webhook fixture + replay injektörü (implementation-repo).
- **expectedEvidence:** idempotency/replay property test raporu.
- **timebox:** 1 analiz-günü tasarım; property drill ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5F-01`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md), [`C-5F-02`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md), [`C-5C-11`](./enterprise-saas-phase-5c-data-metadata-candidates.md); D3.

### P6-14 · probe-metadata-upgrade · riskTier: high
- **hypothesis:** Metadata/şema upgrade veya migration geniş blast radius üretir; rollback deterministik değil.
- **trigger:** Metadata/schema sürüm geçişi; canary + geriye-uyum senaryosu.
- **blastRadius:** Şema-bağımlı tüm tüketiciler; D3 schema-evolution + D6 change-window.
- **owner:** migration/exit analyst (P6-14).
- **method:** Compatibility matrix + canary + rollback rehearsal tasarımı; geriye-uyumsuz değişim işaretlenir. (Tasarım; koşulmadı.)
- **fixture:** Şema sürüm fixture + migration/rollback ortamı (implementation-repo).
- **expectedEvidence:** compatibility matrisi + canary + rollback drill raporu.
- **timebox:** 1 analiz-günü tasarım; rehearsal ayrı.
- **result:** NOT-RUN.
- **decision:** **BLOCK VALIDATION** — [`C-5C-03`](./enterprise-saas-phase-5c-data-metadata-candidates.md), [`C-5C-02`](./enterprise-saas-phase-5c-data-metadata-candidates.md), [`C-5E-11`](./enterprise-saas-phase-5e-reliability-operations-candidates.md), [`C-5F-08`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md); D3/D6.

## Risk-sıralı matris

| Sıra | probeId | riskTier | Faz 5 kancası | D2–D6 | result |
|---|---|---|---|---|---|
| 1 | P6-01 tenant-leakage | high | C-5D-02 · C-5B-06 · C-5C-11 | D3 | NOT-RUN |
| 2 | P6-06 plugin-exfiltration | high | C-5D-06 · C-5F-06 | D3 | NOT-RUN |
| 3 | P6-08 eca-runaway | high | C-5H-12 · C-5H-10 | D3 | NOT-RUN |
| 4 | P6-05 region-key-loss | high | C-5E-05 · C-5D-05 | D6/D4 | UNRESOLVED |
| 5 | P6-04 restore-failure | high | C-5E-04 · C-5C-10 | D5/D6 | NOT-RUN |
| 6 | P6-03 provider-outage-exit | high | C-5F-11 · C-5E-12 | D6 | NOT-RUN |
| 7 | P6-13 replay-idempotency | high | C-5F-01 · C-5F-02 | D3 | NOT-RUN |
| 8 | P6-14 metadata-upgrade | high | C-5C-03 · C-5F-08 | D3/D6 | NOT-RUN |
| 9 | P6-07 ai-silent-failure | high | C-5H-06 · C-5H-05 | D6/D5 | NOT-RUN |
| 10 | P6-09 deletion-legalhold | high | C-5C-07 · C-5D-09 | D4 | UNRESOLVED |
| 11 | P6-12 jurisdiction-drift | high | C-5D-14 · C-5G-07 | D4 | UNRESOLVED |
| 12 | P6-02 noisy-neighbor | high | C-5E-03 · C-5B-08 | D6 | NOT-RUN |
| 13 | P6-10 kpi-reconciliation | medium | C-5C-12 · C-5A-06 | D6 | UNRESOLVED |
| 14 | P6-11 export-import-roundtrip | medium | C-5C-09 · C-5F-10 | D5 | NOT-RUN |

## Önce koşulacak ilk on probe (execution order)

Sıralama = izolasyon/gizlilik/yetki bütünlüğü önce (geri dönüşü zor), sonra süreklilik/kurtarma, sonra tutarlılık/uyum. Bu **tasarım sırasıdır**, koşulmuş dizi değildir:

`P6-01 → P6-06 → P6-08 → P6-05 → P6-04 → P6-03 → P6-13 → P6-14 → P6-07 → P6-09`.

Kalan dört (P6-12, P6-02, P6-10, P6-11) ikinci dalgadır; hiçbiri drop edilmez.

## Deferred validation register (probe-dışı, açık kalan doğrulamalar)

Aşağıdaki alanlar **hiçbir P6 probe tarafından tam kapsanmaz** ve yeni probe ID **açılmadan** açık deferred-validation olarak kaydedilir (14 probe ID sabit kalır). Hepsi implementation-repo drill/ölçüm + Codex doğrulaması bekler; hiçbiri bu docs reposunda `validated` değildir.

| Deferred alan | Neden probe-dışı | İlgili Faz 5 aday | Durum |
|---|---|---|---|
| Availability / error-budget (aylık ≥%99.9) | P6-02/03/04/05 süreklilik eksenidir; **SLO/error-budget ölçümü** ayrı, bağlamlı, ölçülmemiş | [`C-5E-01`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) | DEFERRED — bağlamlı pilot eşiği, ölçülmemiş (D6) |
| Absolute p95 / load (read ≤500ms, mutation ≤1000ms) | P6-02 **komşu p95 degradasyonu (relatif ≤%20)** ölçer; **mutlak p95/throughput bütçesi** ayrı | [`C-5E-02`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) | DEFERRED — mutlak hedef ölçülmemiş, uydurulmaz |
| Non-probe reliability adayları (incident/escalation, runbook, monitoring/trace, admin-diagnostics, cost/COGS, maintenance/change-window) | Operasyonel/policy ekseni; tek bir kırılma-hipotezine probe olarak indirgenmez | [`C-5E-06`](./enterprise-saas-phase-5e-reliability-operations-candidates.md)·[`C-5E-07`](./enterprise-saas-phase-5e-reliability-operations-candidates.md)·[`C-5E-08`](./enterprise-saas-phase-5e-reliability-operations-candidates.md)·[`C-5E-09`](./enterprise-saas-phase-5e-reliability-operations-candidates.md)·[`C-5E-13`](./enterprise-saas-phase-5e-reliability-operations-candidates.md) | DEFERRED — bir kısmı authority-`unresolved` (09/13) |
| Accessibility (WCAG 2.2 klavye/hata-UX) | P6-12 yalnız jurisdiction/i18n-pack lensinde değer; **domain a11y başarı kriteri** ayrı ve probe-dışı | [`C-5G-08`](./enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md) | DEFERRED — axe/klavye drill implementation-repo'da, NOT-ASSESED |

Bu register **stop-gate genişletmesidir**, kapatma değil: probe-dışı deferred alanlar çözülene/ölçülene kadar ilgili yüksek-risk aday `validated` OLAMAZ; Faz 7'de non-probe residual blocker tablosuyla hizalıdır ([`traceability`](./enterprise-saas-phase-7-traceability-baseline.md) §Non-probe residual blockers).

## confirmed / rejected / unresolved semantiği

- **confirmed:** Implementation-repo'da gerçek drill koştu ve **hipotez doğrulandı** (sızıntı/başarısızlık gözlendi) → requirement `validated` OLAMAZ; fix + yeniden-drill zorunlu.
- **rejected:** Drill koştu ve **hipotez reddedildi** (sistem beklenen fail-closed/degrade davranışını gösterdi) → yalnız o eksen için kanıt tamam.
- **unresolved:** Owner/authority/oracle tanımsız **veya** drill koşulamadı → yüksek-risk requirement `validated` OLAMAZ.
- Bu docs reposunda tüm `result` NOT-RUN/UNRESOLVED'dır; `confirmed`/`rejected` yalnız `platform` drill kanıtı + Codex doğrulaması ile atanır. `result` **uydurulmaz**.

## Stop gate'ler

1. Probe **sonucu (gerçek drill)** olmadan yüksek-risk requirement `validated` OLAMAZ ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 6 stop-gate; [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 6).
2. `result` NOT-RUN iken "probe geçti/enterprise-ready" **yazılamaz**.
3. Counsel-gated probe'larda (P6-09, P6-12) hukuki sonuç AI tarafından **üretilemez**; Türkiye counsel gate açık kalır (D4).
4. Recovery/escrow (P6-05) ve cost/COGS allocation (P6-10) authority `unresolved` iken karar **BLOCK VALIDATION**'dır; politika/sayı uydurulmaz.
5. Bu worker JSON/node/queue/schema/gate/kod/test üretemez, commit/push/merge yapamaz; kirli worktree'ye yazamaz.

## Red-to-green kontroller (checklist, executable gate değil)

| Kontrol | Tür | Red koşulu |
|---|---|---|
| 14 probe mevcut (P6-01..P6-14) | AUTO (metin taraması) | 14'ten az probe bölümü |
| Her probe 11 zorunlu alanı taşır | MANUAL | eksik `probeId..decision` alanı |
| Tüm `result` = NOT-RUN/UNRESOLVED | AUTO | `confirmed`/`rejected` iddiası (kanıtsız) |
| Yüksek-risk `decision` = BLOCK VALIDATION | AUTO | koşulmamış high-risk için farklı karar |
| Faz 5 candidate + D2–D6 çapraz-referansı | MANUAL | eksik kanca |
| Relative link hedefleri mevcut | AUTO (`git`/reviewer) | kırık/absolute link |
| No vendor/region/legal conclusion/impl | MANUAL | somut provider/region/hukuki sonuç uydurma |
| Allowed-files (yalnız bu dosya) | AUTO (`git status` Codex'te) | başka dosya değişikliği |

## Phase decision

**Faz 6 probe **tasarımı** tamamlandı (docs-only handoff design) → NO-GO to validation.** 14 probe'un tamamı NOT-RUN/UNRESOLVED; hiçbir yüksek-risk requirement `validated` değildir. Faz 7 traceability yalnız Codex onayıyla ve implementation-repo drill kanıtı üretildikçe açılır. Bu belge **executable handoff tasarımıdır, koşulmuş test değildir**; Codex bağımsız doğrulamadan tamamlanmış sayılmaz. Requirement baseline, app/module promotion, generated JSON, queue/node/schema/gate ve implementation kapalı kalır.
