# Enterprise SaaS — Faz 7 Traceability Readiness Baseline

**Güncel durum:** V0–V16 vibecoder talimat zinciri başlayabilir; bu yalnız **instruction GO** demektir. Runtime probe'ları ve uygulama kanıtı hâlâ yoktur.

**Rol:** Claude SLAVE writer. Codex MASTER + nihai otorite ve doğrulayıcı.
**Faz:** Faz 7 waterfall traceability / baseline / test planı ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 7; [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 7). Faz 5 docs-only candidate completeness → Faz 6 probe **tasarımı** sonrası ([`integration`](./enterprise-saas-phase-5-integration-decision.md) §Phase decision, [`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) §Phase decision).
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> **Kritik dürüstlük.** Bu belge bir **traceability readiness matrisidir**, requirement baseline DEĞİLDİR. Faz 5 kayıtları yalnız `candidate`/`unresolved` **adaydır** (validated requirement değil, [`integration`](./enterprise-saas-phase-5-integration-decision.md)). Faz 6 probe'larının tamamı **NOT-RUN/UNRESOLVED**'dır ([`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md) §Phase decision). Bu yüzden burada **requirement baseline, "test geçti", code-start readiness, enterprise-ready, GA veya uyumluluk iddiası YOKTUR**. Bu `actionplan` docs reposunda ürün runtime'ı yok; hiçbir test/drill burada koşulamaz. Bu worker JSON/node/queue/schema/gate/kod/test üretmez, commit/push/merge yapmaz; yalnız bu tek dosyayı yazar ([`AGENTS.md`](../AGENTS.md)).

## Execution record

Gerçek concurrency kullanılmadı; dosya-sahipliği çakışmasını önlemek için işler **sıralı** yürütüldü, paralellik iddiası yoktur. Waterfall Faz 7 zaten paralel-değil sıralı kapı zinciridir ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 7). Aşağıdaki **8 yeni bounded görev** bu changeset'e eklenen sıralı işlerdir; hiçbiri paralel koşmadı.

| Görev | Lane türü | Kapsam | Çıktı bölümü |
|---|---|---|---|
| `T7-01` | analyst | source mapping — her satırın Faz 5 aday + gap §6 kaynağını bağla | Readiness matrisi (source) |
| `T7-02` | analyst | decision mapping — D2–D6 + integration kararını bağla | Readiness matrisi (decision) |
| `T7-03` | analyst | baseline-state — her satırın baseline durumunu (NOT baselined) yaz | Readiness matrisi (baseline status) |
| `T7-04` | analyst | AC/oracle mapping — falsifiable acceptance criterion türet | Readiness matrisi (AC) |
| `T7-05` | analyst | test-level mapping — risk bazlı test seviyesi ata | Readiness matrisi (test level) + §Test seviyesi |
| `T7-06` | analyst | evidence/release mapping — evidence tipi + release/rollback + placeholder komut | Readiness matrisi (evidence, release) |
| `T7-07` | analyst | DoR/DoD reviewer — Ready/Done deltası + karşılanmayan maddeler | §DoR/DoD deltası |
| `T7-08` | writer | integration writer — bu belge, stop-gate ve phase decision | Bu dosya (tek yazar) |

## Traceability zinciri (sözleşme, koşulmuş kanıt değil)

Her aday-grup için zincir: `source → decision → candidate/probe → baseline status → acceptance criterion → test level → test command placeholder → evidence type → release/rollback → validationAuthority`. Boş hücre = RED ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 7). Zincirin her satırı **hazır-olma boşluğunu** gösterir; kanıt (drill) sayılmaz.

**Verification ≠ validation.** *Verification* = "ürünü spec'e göre yaptık mı?" (implementation-repo'da test/drill; TaskNode `phases["verification"]`). *Validation* = "doğru ürünü mü yaptık?" ve yüksek-risk için "hipotez fail-closed mi çürütüldü?" — bu **insan yetkisindedir** ([`constitution`](./enterprise-saas-requirement-constitution.md) §Authority and scope). `validationAuthority` sütunu her satırda **insan** otoritesini adlar; AI validate/approve/baseline edemez.

## Readiness matrisi — 14 probe-kancalı yüksek-risk aday grubu (P6-01..P6-14)

Her satır bir probe'a karşılık gelir; tüm sütunlar doludur. `baseline status` = **hiçbiri baselined değil**; tüm satırlar `candidate` + probe sonucu **NOT-RUN/UNRESOLVED** → **BLOCK VALIDATION** ([`probes`](./enterprise-saas-phase-6-unknown-unknown-probes.md)). Aday kimlikleri probe belgesinde tanımlı ve bağlıdır.

| Probe | source (Faz 5 lane · gap §6) | decision (D· integration) | candidate/probe | baseline status | acceptance criterion (falsifiable) | test level | test command placeholder (koşulmadı) | evidence type | release/rollback | validationAuthority (insan) |
|---|---|---|---|---|---|---|---|---|---|---|
| P6-01 tenant-leakage | [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md)·[`5b`](./enterprise-saas-phase-5b-identity-tenant-org-candidates.md)·[`5h`](./enterprise-saas-phase-5h-ai-data-science-candidates.md)·gap §6 | D3 | C-5D-02·C-5B-06·C-5C-11·C-5H-04 · P6-01 | candidate · NOT baselined · NOT-RUN | Tenant A objesi/anahtarı cache/search/projection **+ vector/embedding/RAG retrieval** dahil Tenant B'ye görünmez | negative · security | «impl-repo TBD» tenant-escape suite (RAG dahil) | tenant-escape negatif suite raporu (cache/search/projection/RAG) | fail-closed; sızıntıda release blok | security/isolation owner + Codex |
| P6-02 noisy-neighbor | [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md)·gap §6 | D6 | C-5E-03·C-5B-08·C-5F-07 · P6-02 | candidate · NOT baselined · NOT-RUN | Komşu p95 degradasyonu ≤ %20 (ölçülene kadar aday hedef) | chaos · property | «impl-repo TBD» load-isolation drill | load-isolation + per-tenant p95/cost raporu | quota throttle; capacity rollback | reliability/ops owner + Codex |
| P6-03 provider-outage-exit | [`5f`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md)·gap §6 | D6 | C-5F-11·C-5E-12·C-5F-03·C-5H-14 · P6-03 | candidate · NOT baselined · NOT-RUN | Outage'da port/adapter degraded sürer; exit'te veri taşınabilir | chaos · migration | «impl-repo TBD» failover+exit drill | failover + degraded-mode + exit-portability raporu | degraded-mode; circuit-breaker; provider exit | integration/exit owner + Codex |
| P6-04 restore-failure | [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md)·gap §6 | D5/D6 | C-5E-04·C-5C-10·C-5E-11 · P6-04 | candidate · NOT baselined · NOT-RUN | Clean-room restore RPO ≤15dk / RTO ≤4sa (aday hedef) bütünlüklü | restore | «impl-repo TBD» clean-room restore drill | restore drill + ölçülen RPO/RTO raporu | restore-from-backup; kirli yedek reddi | ops/DR owner + Codex |
| P6-05 region-key-loss | [`5e`](./enterprise-saas-phase-5e-reliability-operations-candidates.md)·[`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md)·gap §6 | D6/D4 | C-5E-05·C-5D-05·C-5B-07 · P6-05 | candidate · NOT baselined · **UNRESOLVED** (escrow authority açık) | Region/key kaybında fail-closed; sessiz plaintext fallback yok; deterministik rotation | chaos · restore | «impl-repo TBD» key/region-loss drill | key-loss/region-loss + rotation/revoke raporu | fail-closed; deterministik recovery | ops/DR owner + recovery authority (açık) |
| P6-06 plugin-exfiltration | [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md)·[`5f`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md)·gap §6 | D3 | C-5D-06·C-5F-06·C-5F-05 · P6-06 | candidate · NOT baselined · NOT-RUN | İmzasız/kapsam-dışı egress fail-closed reddedilir; permission-diff onaysız genişlemez | security · negative | «impl-repo TBD» exfiltration negatif suite | exfiltration negatif + SBOM/imza + permission-diff raporu | fail-closed; plugin disable/rollback | security/abuse owner + Codex |
| P6-07 ai-silent-failure | [`5h`](./enterprise-saas-phase-5h-ai-data-science-candidates.md)·gap §6 | D6/D5 | C-5H-06·C-5H-05·C-5H-01·C-5H-03·C-5H-07 · P6-07 | candidate · NOT baselined · NOT-RUN | Eval regression/drift **veya prompt/indirect-injection veya maskesiz PII/secret** eşiği aşılırsa release bloklanır; auto-degrade/abstain otomatik, **model/version rollback insan-gated** | property · negative | «impl-repo TBD» golden/adversarial eval + injection/PII suite | eval raporu + drift/abstain/override + injection + PII-redaction kanıtı | eval-gate; auto-degrade/abstain (oto); **model sürüm rollback = insan-gated** | AI owner + human override + Codex |
| P6-08 eca-runaway | [`5h`](./enterprise-saas-phase-5h-ai-data-science-candidates.md)·gap §6 | D3 | C-5H-12·C-5H-10·C-5H-09·C-5H-11 · P6-08 | candidate · NOT baselined · NOT-RUN | depth>6, forbidden app/module write, human-stop bypass **ve agent tool-permission escape (allow-list dışı tool/veri)** reddedilir | negative | «impl-repo TBD» ECA runaway + tool-permission negatif suite | ECA runaway negatif suite (depth/forbidden/human-stop/tool-permission) | kill-switch; step-up; halt | AI safety owner + Codex ([`AGENTS.md`](../AGENTS.md) §4.4) |
| P6-09 deletion-legalhold | [`5c`](./enterprise-saas-phase-5c-data-metadata-candidates.md)·[`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md)·gap §6 | D4 | C-5C-07·C-5D-09 · P6-09 | candidate · NOT baselined · **UNRESOLVED** (counsel + öncelik authority açık) | Legal-hold aktifken erasure override edilmez; çatışma deterministik çözülür | negative · security | «impl-repo TBD» retention-conflict simülasyon | conflict-resolution matrisi + hold/erasure kanıtı | hold-öncelikli; erasure defer | Türkiye counsel (D4) + data owner |
| P6-10 kpi-reconciliation | [`5c`](./enterprise-saas-phase-5c-data-metadata-candidates.md)·[`5a`](./enterprise-saas-phase-5a-strategy-commercial-candidates.md)·gap §6 | D6 | C-5C-12·C-5A-06·C-5E-10 · P6-10 | candidate · NOT baselined · **UNRESOLVED** (COGS allocation owner açık) | Aynı KPI ledger↔metering↔provider tolerans içinde uzlaşır; delta işaretlenir | contract · property | «impl-repo TBD» reconciliation drill | reconciliation raporu + tolerans-dışı delta listesi | freeze-on-drift; recompute | data owner + cost/COGS authority (açık) |
| P6-11 export-import-roundtrip | [`5c`](./enterprise-saas-phase-5c-data-metadata-candidates.md)·[`5f`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md)·gap §6 | D5/D4 | C-5C-09·C-5F-10·C-5A-09·C-5C-07 · P6-11 | candidate · NOT baselined · NOT-RUN | Tam export→import round-trip diff = ∅; silme/disposition **counsel/retention-yönetişimli attestation** ile doğrulanır (bare deletion-certificate authority resolved değil) | migration · property | «impl-repo TBD» round-trip diff + disposition-attestation drill | round-trip diff raporu + retention/legal-hold-yönetişimli disposition attestation | reversible-backfill; import rollback; hold-öncelikli disposition | data/exit owner + Türkiye counsel (D4) + Codex |
| P6-12 jurisdiction-drift | [`5d`](./enterprise-saas-phase-5d-security-privacy-compliance-candidates.md)·[`5g`](./enterprise-saas-phase-5g-ux-globalization-accessibility-candidates.md)·gap §6 | D4 | C-5D-14·C-5G-07·C-5C-08 · P6-12 | candidate · NOT baselined · **UNRESOLVED** (counsel gate açık) | Regulated-role/residency drift counsel gate'ini atlamaz; boundary table + jurisdiction-pack güncel | security · accessibility (jurisdiction/i18n pack) | «impl-repo TBD» boundary+residency audit | counsel-review kaydı + boundary table + residency audit | fail-closed; flag-off; counsel gate | Türkiye counsel (D4) — AI hukuki karar vermez |
| P6-13 replay-idempotency | [`5f`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md)·gap §6 | D3 | C-5F-01·C-5F-02·C-5C-11 · P6-13 | candidate · NOT baselined · NOT-RUN | Duplicate/replay/out-of-order komut-event tek etki üretir; projection tutarlı | property · contract | «impl-repo TBD» idempotency/replay property test | idempotency/replay property test raporu | idempotency-key; projection rebuild | architecture owner + Codex |
| P6-14 metadata-upgrade | [`5c`](./enterprise-saas-phase-5c-data-metadata-candidates.md)·[`5f`](./enterprise-saas-phase-5f-integration-extensibility-candidates.md)·gap §6 | D3/D6 | C-5C-03·C-5C-02·C-5E-11·C-5F-08 · P6-14 | candidate · NOT baselined · NOT-RUN | Metadata/schema upgrade geriye-uyum korur; rollback deterministik | migration · contract | «impl-repo TBD» compatibility+rollback rehearsal | compatibility matrisi + canary + rollback drill | canary; expand-contract; downgrade | migration owner + Codex |

## Test seviyesi risk ataması

Test seviyeleri risk bazlı atandı ([`constitution`](./enterprise-saas-requirement-constitution.md) §Acceptance; [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 7). Matriste sekiz seviyenin tümü kapsanır: **property** (P6-02·P6-07·P6-10·P6-11·P6-13), **contract** (P6-10·P6-13·P6-14), **negative** (P6-01·P6-06·P6-07·P6-08·P6-09), **chaos** (P6-02·P6-03·P6-05), **security** (P6-01·P6-06·P6-09·P6-12), **accessibility** (P6-12 jurisdiction/i18n-pack ve WCAG; UX-uygulanabilir yer), **migration** (P6-03·P6-11·P6-14), **restore** (P6-04·P6-05). Seviye ataması tasarımdır; koşulmuş test değildir.

## Test command placeholder açıklaması

Matristeki `«impl-repo TBD»` ile başlayan tüm komutlar **yer tutucudur**; bu docs reposunda **koşulmadı** ve **bu reponun script'i değildir**. Bunlar implementation-repo'ya (`platform`) özgü, henüz tanımlanmamış (TBD) komut niyetleridir. Hiçbir komut bu ortamda var/geçerli/koşulmuş sayılmaz; doğrulanmadan hiçbiri "mevcut" gibi sunulamaz. Placeholder komut **≠** koşulmuş test ([`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 7).

## Baseline ve değişiklik kontrolü (gelecekteki baseline için)

Bugün hiçbir aday `baselined` değildir. Bir aday **gelecekte** baseline edilirse ([`constitution`](./enterprise-saas-requirement-constitution.md) §Baseline and change control) zorunlu kural:

- **Freeze:** `approved → baselined` anında aday dondurulur ve `baselineVersion` (semver) atanır.
- **Change request:** dondurulmuş adayın her değişikliği CR açar; gerekçe + kaynak zorunlu.
- **Impact analysis:** etkilenen aday/bağımlılık/`acceptanceCriteria`/`testLevel`/probe yeniden sayılır; boşsa CR onaylanamaz.
- **Reapproval (revalidation):** etkilenen AC/testLevel/evidenceExpected **yeniden onaylanır**; eski kanıt otomatik taşınmaz; ilgili probe **yeniden koşulur**. Onay insan `approver` + `validationAuthority`; AI onaylayamaz.
- **Supersede:** eskiyen aday `supersedes`/`aliases[]` ile bağlanır; sessiz silme yok.

## Definition of Ready ve Definition of Done deltası

**DoR deltası (Ready-to-Baseline + code-start).** Repo `phase=development` DoR'undan **önce** gelen kapı ([`constitution`](./enterprise-saas-requirement-constitution.md) §DoR/DoD). **Şu an karşılanmayan maddeler (tümü BLOK):**

- Probe sonucu (gerçek drill) **yok** — 14/14 NOT-RUN/UNRESOLVED; yüksek-risk aday `validated` olamaz.
- `UNRESOLVED` authority açık: P6-05 recovery/escrow, P6-09 & P6-12 Türkiye counsel gate, P6-10 cost/COGS allocation owner.
- Ölçülmüş NFR **yok**: p95, RPO/RTO, degradasyon eşikleri hâlâ **aday hedef** (uydurulmadı).
- **test-plan** fazı + **db-schema/migration contract** üretilmedi (bu görev şema üretmez).
- Tekil `validationAuthority` insan imzası tamamlanmadı.

**DoD deltası (Done).** Değişmez ([`constitution`](./enterprise-saas-requirement-constitution.md) §DoR/DoD; [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md)). **Şu an karşılanmayan maddeler:**

- `evidenceExpected` (plan) **actual** `evidence[]` yerine geçmez; hiçbir satırda gerçek kanıt yok.
- Hiçbir aday `implemented`/`verified`/`done` ilan edilemez; "passed/geçti" yasak.
- "Enterprise-ready/GA/uyumlu" iddiası **yok** ve standarda atıf uyumluluk kanıtı değildir.

## Non-probe residual blockers (baseline edilmez)

Aşağıdaki alanlar P6 probe matrisiyle kapsanmaz fakat baseline'ı bloklar; hiçbiri baselined/validated değildir (Faz 6 §Deferred validation register ile hizalı). Bu tablo **residual blocker kaydıdır, baseline değildir**.

| Residual blocker | Aday | Neden probe-dışı | Durum |
|---|---|---|---|
| Availability SLO ≥%99.9 / error-budget | C-5E-01 | süreklilik probe'ları (P6-02/03/04/05) SLO ölçümünü kapsamaz | NOT baselined · bağlamlı, ölçülmemiş |
| Mutlak p95 (read ≤500ms / mutation ≤1000ms) + load | C-5E-02 | P6-02 relatif komşu degradasyon (≤%20) ölçer, mutlak değil | NOT baselined · ölçülmemiş |
| Incident/escalation · runbook · monitoring/trace | C-5E-06·C-5E-07·C-5E-08 | operasyonel/policy ekseni, tek kırılma-hipotezi değil | NOT baselined |
| Admin-diagnostics · cost/COGS · maintenance/change-window | C-5E-09·C-5E-13 (+C-5E-10) | authority `unresolved` (diagnostic-scope, change-window/CAB) | NOT baselined · UNRESOLVED authority |
| Accessibility (WCAG 2.2 klavye/hata-UX) | C-5G-08 | P6-12 yalnız jurisdiction/i18n-pack lensi; domain a11y ayrı | NOT baselined · NOT-ASSESED |
| AI human-review eşiği (yüksek-risk yayın-öncesi onay) | C-5H-09 | P6-07/08 drift/runaway ekseni; review-eşik matrisi item-level | NOT baselined · residual |

## Stop-gate'ler

1. **Test-plan + db-schema/migration contract geçmeden development ÖNERİLMEZ** ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 7 stop-gate). Bu görev **hiçbir şema/migration üretmez**; zincir bu kapıda durur.
2. Probe sonucu (gerçek drill) olmadan yüksek-risk aday `validated`/baselined **olamaz**; 14/14 NOT-RUN/UNRESOLVED.
3. Counsel-gated satırlarda (P6-09, P6-12) hukuki sonuç AI tarafından **üretilemez**; Türkiye counsel gate açık.
4. `UNRESOLVED` authority (P6-05 escrow, P6-10 COGS) çözülene kadar karar **BLOCK VALIDATION**; politika/sayı uydurulmaz.
5. Bu worker JSON/node/queue/schema/gate/kod/test üretmez, commit/push/merge yapmaz; kirli worktree'ye yazmaz.

## Red-to-green kontroller (checklist, executable gate değil)

| Kontrol | Tür | Red koşulu |
|---|---|---|
| 14 satır mevcut (P6-01..P6-14) | AUTO (metin taraması) | 14'ten az satır |
| Her satırda 10 zorunlu sütun dolu | AUTO | boş `source..validationAuthority` hücresi |
| Tüm baseline status = NOT baselined | AUTO | `baselined`/`validated`/`passed` iddiası |
| 8 test seviyesi kapsandı | MANUAL | eksik property/contract/negative/chaos/security/accessibility/migration/restore |
| Placeholder komut ≠ repo script | MANUAL | koşulmuş/var gibi sunulan komut |
| Verification ≠ validation + authority yazılı | MANUAL | validation authority eksik/AI-atanmış |
| Relative link hedefleri mevcut | AUTO (`git`/reviewer) | kırık/absolute link |
| Allowed-files (yalnız bu dosya) | AUTO (`git status` Codex'te) | başka dosya değişikliği |

## Phase decision

**Faz 7 traceability readiness matrisi **tasarımı** tamamlandı (docs-only) → NO-GO to development.** 14/14 probe NOT-RUN/UNRESOLVED; hiçbir aday `validated`/baselined değildir; test-plan ve db-schema/migration contract yoktur. Bu nedenle **kod başlatma önerilmez**. Faz kararı **yalnız docs-only Faz 8 (standart/control crosswalk)** kapısına GO verebilir ([`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) Faz 8; [`oracles`](./enterprise-saas-phase-5-11-acceptance-oracles.md) §Faz 8) — development, requirement baseline, app/module promotion, generated JSON, queue/node/schema/gate kapalı kalır. Bu belge **traceability readiness tasarımıdır, koşulmuş test/kanıt değildir**; Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

## ADR-0031 güncel addendum — instruction/test-first packet başlangıcı (baseline değil)

**Tarih:** 2026-07-13. Yukarıdaki matris/karar korunur; bu addendum yalnız güncel durumu ekler.

- **Test-önce girdiler artık mevcut:** [`contract-test plan`](./commerce-os-contract-test-plan.md) (F1–F16 RED test aileleri, test-önce talimat) ve [`data/migration contract`](./commerce-os-data-migration-contract.md) (D8/D9 authority + şema sınırı) artık **doküman-talimatı olarak vardır**. Bunlar §Stop-gate 1'deki "test-plan + db-schema/migration contract yok" boşluğunu **talimat düzeyinde** doldurur (koşulmuş test/uygulanmış şema **değil**).
- **D7–D13 owner'ları çözüldü:** [`ADR-0031`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) ACCEPTED (insan-yetkili; [`ledger`](./enterprise-saas-human-decision-queue.md) §ADR-0031 kapanış addendum). §Non-probe residual'daki AI human-review eşiği (D12) ve export/disposition/upgrade authority (D8/D9) owner belirsizliği kapandı.
- **Sonuç:** Instruction / test-first implementation packet'leri [`task-packets`](./commerce-os-vibecoder-task-packets.md) **V0**'dan (clean-worktree preflight) başlayabilir. Bu bir **talimat başlangıcıdır**, requirement baseline veya code-start onayı değildir.
- **Değişmeyen bloklar:** **14/14 runtime probe hâlâ NOT-RUN**; ölçülmüş NFR yok; counsel gate (D4) açık. **Release/validation BLOKE kalır**; hiçbir aday `validated`/`baselined` değildir. Bu addendum **hiçbir TaskNode'u `phase=development` veya baselined ilan etmez**; instruction-ready ≠ runtime-ready. JSON/node/queue/schema/gate/kod/test üretilmedi; Codex bağımsız doğrulamadan tamamlanmış sayılmaz.
