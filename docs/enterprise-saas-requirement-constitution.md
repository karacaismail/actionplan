# Enterprise SaaS — Requirement Constitution (Phase 2)

**Rol:** Claude SLAVE worker. Codex MASTER + nihai otorite.
**Faz:** 2 (requirement constitution). Faz 0/1 çıktılarına ve iki untracked girdiye dokunulmadı; **Faz 3'e geçilmez**.
**Tarih:** 2026-07-13 · **Durum:** ÖNERİ — Codex bağımsız doğrulamadan tamamlanmış sayılmaz.

> Bu belge **normatif sözleşmedir**, requirement/backlog/node/app/module/queue/schema/gate DEĞİL.
> Araştırma metni ve sayıları ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §1,
> [`matrix`](./enterprise-saas-source-normalization-matrix.md)) **kanonik değildir**. Bu overlay **yeni bir
> TaskNode şeması değildir** ve TaskNode `phase/status/state` otoritesiyle **yarışmaz**
> ([`../src/schemas/task.ts`](../src/schemas/task.ts), [`AGENTS.md`](../AGENTS.md) §7).

## Execution record

Task/sub-agent mekanizması bu ortamda **MEVCUT DEĞİL** (yalnız Bash/Read/Grep/Glob/Edit). 14 iş **SIRALI**
yürütüldü; paralellik/sub-agent iddiası yok. Tek yazar/entegrasyon adımı yalnız bu dosyadır.

| # | İş | Kapsam | Yerleştiği bölüm |
|---|---|---|---|
| A1 | identity/provenance | id, canonicalName, statement, sourceRefs, sourceType, confidence | Candidate record contract |
| A2 | stakeholder/RACI | buyer/user/admin/operator/auditor + approver/validationAuthority | Authority and scope |
| A3 | authority/lifecycle | dataAuthority, lifecycleAuthority, tekil sahiplik | Pre-WBS lifecycle |
| A4 | NFR/risk | riskTier, NFRBudgets, jurisdictions | Candidate record contract |
| A5 | acceptance/evidence | acceptanceCriteria, testLevel, evidenceExpected | Acceptance and evidence contract |
| A6 | migration/rollout | rollout, rollback, migration, observability, support, cost, provider | Migration and rollout |
| A7 | baseline/change-control | freeze, changeRequest, CCB, impact, revalidation, supersede | Baseline and change control |
| V1 | TaskNode field mapping | 41 overlay alanı → gerçek alan / overlay-only | TaskNode mapping |
| V2 | lifecycle non-conflict | overlay sözlüğü ≠ status/phase/state token | Pre-WBS lifecycle · Deterministic checks |
| V3 | required-field stop gate | 17 listelenen alan + statement kuralı = 18 minimum kontrol; unresolved = block | Definition of Ready and Done delta |
| V4 | solution-independent statement | tek outcome + falsifiable; valid/invalid örnek | Requirement statement rules |
| V5 | evidence taxonomy | evidenceExpected ≠ evidence[] (actual) | Acceptance and evidence contract |
| V6 | link/allowed-files | relative link + tek izinli dosya | Deterministic checks |
| V7 | claim/phase-boundary | kanıtsız "tamam" yok; Faz 3 açılmaz | Phase decision |

- Yürütülen iş sayısı: **14/14** · Mod: **sequential (mechanism unavailable)** · Hepsi READ-ONLY analiz + tek yazar.
- Girdi commit/kaynak: HEAD `6900d38`, branch `codex/enterprise-saas-requirements-2026-07-13`; okunan kanon
  [`../src/schemas/task.ts`](../src/schemas/task.ts), [`./task-to-code-contract.md`](./task-to-code-contract.md),
  [`./evidence-taxonomy.md`](./evidence-taxonomy.md), [`./enterprise-dod.md`](./enterprise-dod.md),
  [`./ready-for-dev-gate.md`](./ready-for-dev-gate.md), [`./waterfall-developer-handoff.md`](./waterfall-developer-handoff.md),
  [`./release-policy.md`](./release-policy.md).

## Authority and scope

Bu overlay yalnız **provenance + karar + validasyon** boşluğunu taşır; TaskNode alanlarını yeniden tanımlamaz
([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §5). Değişmez sınırlar:

- **Overlay ≠ şema:** hiçbir TaskNode alanı eklenmez/çoğaltılmaz; overlay-only alanlar pre-WBS karar kaydında yaşar.
- **Otorite yarışması yok:** overlay `status` (candidate…) TaskNode `phase/status/state` ile **çakışmaz**; baseline
  sonrası kanonik lifecycle **yalnız** TaskNode'dadır.
- **Tekil sahiplik:** her aday için `dataAuthority` ve `lifecycleAuthority` **tek** sahibe atanır; iki sahip = kırmızı
  (authority conflict, [`directive`](./enterprise-saas-waterfall-claude-multi-agent-directive.md) §3 Ownership).
- **İnsan onayı zorunlu:** hiçbir `status` **AI tarafından otomatik ilerletilemez**; `validated/approved/baselined`
  yalnız açık **insan approver/validationAuthority** kararıyla değişir (AGENTS §4.4; `agentPolicy.autonomy="suggest"`).

**Stakeholder/RACI (A2)** — aday kayıt en az beş paydaş sınıfını ayırır; çatışan ihtiyaç kaydedilir (`conflicts`):

| Paydaş | R/A/C/I (lifecycle boyunca) | Overlay alanı |
|---|---|---|
| Buyer (satın alan) | C (candidate) → I | `stakeholder` |
| User (kullanıcı) | C → I | `stakeholder` |
| Admin/Owner | **A** (approve baseline) | `owner`, `approver` |
| Operator (ops/support) | C (rollout/support) | `supportModel`, `stakeholder` |
| Auditor/Counsel | **C** (risk/jurisdiction/validation) | `validationAuthority`, `jurisdictions` |

Verification (spec'e göre mi yaptık?) ≠ Validation (doğru ürünü mü?). `validationAuthority` **insandır**; TaskNode
`phases["verification"]` verification'dır, validation değildir.

## Candidate record contract

Aday kayıt (pre-WBS) alanları ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §5 birebir):

```text
id, canonicalName, statement, rationale, sourceRefs, sourceType, confidence, status,
owner, approver, stakeholder, productFamily, scopeClass, level, maturityTier, edition,
tenantConfigurability, dataAuthority, lifecycleAuthority, dependencies, conflicts, assumptions,
jurisdictions, riskTier, NFRBudgets, acceptanceCriteria, testLevel, evidenceExpected, rollout,
rollback, migration, observability, supportModel, costDriver, buyBuildPartnerDecision,
baselineVersion, changeRequest, impactAnalysis, validationAuthority, supersedes
```

- **A1 identity/provenance:** `id` kebab-case; `canonicalName` dedup anahtarına (`concept+owner+dataAuthority+
  lifecycleAuthority+consumer+outcome`, [`matrix`](./enterprise-saas-source-normalization-matrix.md)) bağlanır;
  `sourceRefs` işaret eder (kopyalamaz); `sourceType ∈ {interview, regulation, data, assumption, benchmark,
  repo-evidence}`; `confidence ∈ {L, M, H}`. Kanıtsız sayı `sourceType=benchmark` + `confidence=L` ile işaretlenir,
  hedef sayılmaz.
- **A4 NFR/risk:** `riskTier ∈ {low, medium, high, critical}`; `NFRBudgets` ölçülebilir bütçe (SLI/SLO, RTO/RPO,
  p95, cost); `jurisdictions` hukuk/mevzuat yorumu gerektirir → counsel (`validationAuthority`).

## TaskNode mapping

**V1** — her yeniden kullanılabilir alan gerçek [`../src/schemas/task.ts`](../src/schemas/task.ts) alanına eşlenir;
karşılığı yoksa **overlay-only** (şema alanı **icat edilmez**; AGENTS §7).

| Overlay alanı | TaskNode karşılığı | Durum |
|---|---|---|
| id | `id` (kebab-case) | existing |
| canonicalName | `title` / `slug` (+ dedup registry) | partial |
| statement | `summary` (yakın; outcome semantiği farklı) | partial |
| rationale | — | overlay-only |
| sourceRefs | `source` (corpus/originalId/cluster) + `refs[]` | partial |
| sourceType | `source.corpus` (content-source/oldatas/merged/synthetic) | partial |
| confidence | — (`state`=Maturity **değil**) | overlay-only |
| status (candidate…) | — (**asla** `status`/`state`/`phase`) | overlay-only |
| owner | `owner` | existing |
| approver | — (**otorite alanı yok**; `phases[*].notes` yalnız TaskNode oluştuktan **sonra** referans taşıyabilir, onay otoritesi **değildir**) | overlay-only |
| stakeholder | — (`assignees[]` farklı anlam) | overlay-only |
| productFamily | `tags[]` (zayıf); app-node sonra | overlay-only |
| scopeClass | — (14-sınıf sözlüğü, matrix) | overlay-only |
| level | `level` (WbsLevelSchema; baseline'da) | partial |
| maturityTier | — (`state` enterprise tier **değil**) | overlay-only |
| edition | — | overlay-only |
| tenantConfigurability | — (`traceability.tenantStrategy`=izolasyon, farklı) | overlay-only |
| dataAuthority | — | overlay-only |
| lifecycleAuthority | — | overlay-only |
| dependencies | `dependsOn[]` (+`blocks`) | existing |
| conflicts | — (`related` yalnız gezinme) | overlay-only |
| assumptions | — | overlay-only |
| jurisdictions | — (`standardRefs.privacyRef/i18nRef` bağlam) | overlay-only |
| riskTier | `risks[].severity` (per-risk); node-tier | partial |
| NFRBudgets | `metrics[]` {key,target} + dimensions perf/reliability | partial |
| acceptanceCriteria | `acceptanceCriteria[]` | existing |
| testLevel | `phases["test-plan"]` + `dimensions.testing` + `traceability.testCommand` | partial |
| evidenceExpected | — (**≠** `evidence[]`; §Acceptance) | overlay-only |
| rollout | `dimensions.deployment` | partial |
| rollback | `rollback` | existing |
| migration | `agentPolicy.prodDataPolicy.migrationModes[]` + `dimensions.dataLifecycle` | partial |
| observability | `dimensions.observability` + `metrics[]` + `standardRefs.observabilityRef` | existing |
| supportModel | — | overlay-only |
| costDriver | `cost` {budget,resources} | partial |
| buyBuildPartnerDecision | — | overlay-only |
| baselineVersion | — (`schedule.baseline*`=takvim; `schemaVersion`=şema, farklı) | overlay-only |
| changeRequest | — | overlay-only |
| impactAnalysis | — | overlay-only |
| validationAuthority | — (`phases["verification"]`=verification, farklı) | overlay-only |
| supersedes | `aliases[]` (eski id çözümü) | partial |

## Pre-WBS lifecycle

**A3** — pre-WBS aday lifecycle **yalnız** provenance/karar içindir. Tam durum kümesi ve geçişler:

```text
candidate → validated → approved → baselined
   │            │            │
   └────────────┴────────────┴──────► rejected   (candidate|validated|approved erişilebilir)
baselined ─(değişiklik)─► change request (§Baseline); yeni baselineVersion
```

- `baselined` **terminaldir** (bu sözlükte). Sonrası `planned/implemented/verified` **yeni sözlükte değildir**;
  kanonik TaskNode `phase` (requirements…release-maintenance) / `status` / `state` alanlarındadır.
- `rejected` terminaldir; `baselined` sonrası doğrudan `rejected` **yoktur** — supersede/change request gerekir.
- **Otomatik ilerletme yok:** her ileri geçiş açık insan `approver`/`validationAuthority` onayı ister; AI yalnız
  changeset **önerir** (`agentPolicy.autonomy="suggest"`, `forbiddenActions` includes `direct-prod-write`).

**V2 non-conflict** — overlay sözlüğü TaskNode enum'larıyla **token paylaşmaz** (çakışma yok):

| Namespace | Değerler |
|---|---|
| Overlay `status` | candidate · validated · approved · baselined · rejected |
| TaskNode `status` | backlog · todo · in-progress · blocked · review · done |
| TaskNode `phase` | requirements · test-plan · db-schema · development · test-qa · verification · release-maintenance |
| TaskNode `state` | taslak · aday · incelemede · dogrulanmis |

Kesişim = **∅**. `approved/baselined` yalnız insan kararıyla **tek** aday TaskNode'a eşlenir; ondan sonra otorite
TaskNode'dadır ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §5).

## Baseline and change control

**A7** — `baselineVersion` semver'e uyar ([`./release-policy.md`](./release-policy.md)); TaskNode `schemaVersion`
veya `schedule.baseline*`'dan **ayrıdır**.

- **Freeze:** `approved → baselined` anında aday dondurulur; `baselineVersion` atanır; artık serbest düzenlenemez.
- **Change request:** dondurulmuş adayın her değişikliği CR açar (`changeRequest`); gerekçe + kaynak zorunlu.
- **CCB (Change Control Board):** CR'ı insan `approver` + `validationAuthority` onaylar; AI **onaylayamaz**.
- **Impact analysis:** `impactAnalysis` etkilenen aday/bağımlılık/AC/testLevel'i sayar; boşsa CR onaylanamaz.
- **Revalidation:** etkilenen `acceptanceCriteria`/`testLevel`/`evidenceExpected` **yeniden onaylanır**; eski kanıt
  otomatik taşınmaz (baseline drift, [`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §6).
- **Supersede:** eskiyen aday `supersedes`/`aliases[]` ile yeni sürüme bağlanır; sessiz silme yok.

## Requirement statement rules

**V4** — `statement` **tek outcome**, **çözümden bağımsız**, **falsifiable** (test edilebilir) olmalı; teknoloji
seçimi ayrı ADR'dir ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §5).

- **Geçerli:** "Kabul edilmiş olaylar kaybolmadan işlenir ve tekrar teslimde **tek** etki üretir." (tek outcome,
  vendor-bağımsız, ölçülebilir/negatif-test edilebilir).
- **Geçerli:** "Tenant A verisi Tenant B'ye hiçbir yolla görünmez." (falsifiable; cross-tenant sızıntı = red).
- **Geçersiz:** "Kafka kullanılmalı." (çözüm adı, outcome değil → ADR'ye ait).
- **Geçersiz:** "Sistem hızlı ve güvenli olmalı." (ölçülemez + çok-outcome → NFRBudgets'e bölünür).
- **Geçersiz:** "Audit + export + SSO eklenir." (üç outcome → üç aday).

## Acceptance and evidence contract

**A5/V5** — `acceptanceCriteria` her biri **tek falsifiable** kriterdir (`acceptanceCriteria[]`'a eşlenir).

**evidenceExpected ≠ evidence (actual).** `evidenceExpected` **planlanan** kanıt türüdür (overlay-only); TaskNode
`evidence[]` **geçmiş çalıştırmanın** kaydıdır ([`./evidence-taxonomy.md`](./evidence-taxonomy.md) §1,§3). Bir aday
**asla** `implemented`/`verified`/`done` ilan edilmez — o TaskNode fazının işidir ve gerçek kanıt ister.

**Test oracle seviyeleri (`testLevel`)** — risk-bazlı, gate kodu eklemeden:

| testLevel | Ne doğrular | evidenceExpected türü (plan) |
|---|---|---|
| property | değişmezler (clock-skew, ordering, DST) | test dosyası yolu |
| contract | API/event sözleşmesi, golden response | contract raporu |
| negative | yetkisiz/limit/abuse reddi | test dosyası yolu |
| chaos | region/key-loss, provider outage | drill logu |
| security | ASVS/OWASP, SoD | tarama çıktısı |
| accessibility | axe 0 ihlal + klavye | axe raporu |
| migration | expand-contract + downgrade | migration + rollback logu |
| restore | clean-room restore, RTO/RPO | restore drill logu |

**Stop-gate'ler (gate KODU eklenmez, sözleşme):**
- Test oracle (`testLevel`) yoksa → aday `approved` olamaz, development önerilemez ([`./task-to-code-contract.md`](./task-to-code-contract.md) §6 Uyarı 2/4).
- `evidenceExpected` planı `evidence[]` (actual) yerine geçmez; kanıtsız `passed` yasak ([`./evidence-taxonomy.md`](./evidence-taxonomy.md) §3).
- `sourceRefs`/`owner`/`acceptanceCriteria`/`evidenceExpected` olmayan kayıt **onaylanamaz**.

## Migration and rollout

**A6** — dönüşüm/rollout kararları aday kayıtta zorunludur ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §4):

- **rollout:** aşamalı strateji (canary/blue-green/feature-flag) `dimensions.deployment`'a; strateji outcome değil,
  policy'dir ([`matrix`](./enterprise-saas-source-normalization-matrix.md) L16-rel).
- **rollback:** `rollback` (TaskNode) dolu; geri-alma adımı + kim karar verir (`owner`).
- **migration:** `migrationMode ∈ {append-only, expand-contract, reversible-backfill}` (`prodDataPolicy`); legacy
  import/cutover/coexistence + rehearsal kanıtı `evidenceExpected`'ta; downgrade zorunlu.
- **observability:** `dimensions.observability` + `metrics[]` + `standardRefs.observabilityRef`; support-bundle/
  diagnose edilebilirlik.
- **supportModel:** service owner, runbook, escalation, on-call (overlay-only; `refs[]`'e runbook bağı).
- **costDriver:** COGS/kaynak sürücüsü (`cost`); marj/noisy-neighbor.
- **buyBuildPartnerDecision:** build/buy/provider + `provider` sınırı (P0 #5); OCR/imza/tax/vector/PSP/AI provider
  concentration + exit/portability drill'i `evidenceExpected`'ta.

## Definition of Ready and Done delta

**V3** — bu overlay, repo code-start DoR'undan **önce** gelen bir **"baseline'a hazır" (Ready-to-Baseline)** kapısı
ekler. Repo [`./ready-for-dev-gate.md`](./ready-for-dev-gate.md) `phase=development` code-start'ı; bu overlay ise
`candidate→approved→baselined` onayını yönetir. İkisi **yarışmaz**; overlay TaskNode'dan **önce** durur.

**Minimum onay kontrolleri — 17 listelenen alan + `statement` kuralı = 18 kontrol; biri `unresolved` ise `approved` BLOK:**
`sourceRefs, sourceType, confidence, owner, approver, stakeholder, productFamily, scopeClass, level, dataAuthority,
lifecycleAuthority, riskTier, acceptanceCriteria, testLevel, evidenceExpected, baselineVersion, validationAuthority`
(= **17 listelenen alan**) **+ 18. kontrol:** `statement` §Requirement statement rules'a göre geçerli (tek outcome, falsifiable).

| Kapı | Sahibi | Overlay Ready-to-Baseline deltası |
|---|---|---|
| Ready (baseline) | insan approver | 17 alan çözülü + `statement` (18. kontrol) falsifiable + tekil authority |
| DoR code-start ([`./ready-for-dev-gate.md`](./ready-for-dev-gate.md)) | TaskNode `phase=development` | değişmez; overlay eklemez |
| DoD done ([`./enterprise-dod.md`](./enterprise-dod.md), [`./evidence-taxonomy.md`](./evidence-taxonomy.md)) | TaskNode verification+evidence | değişmez; `evidenceExpected` **actual** kanıtı karşılamaz |

## Deterministic checks

| Kontrol | Tür | Sonuç |
|---|---|---|
| Required H2 (12, sırayla) | AUTO (oracle metin taraması) | 12/12 mevcut — reviewer/CI teyidine açık |
| Relative link target | MANUAL/CHANGESET | tüm link repo-relative; hedef varlık Codex teyidine açık |
| Lifecycle non-conflict (V2) | AUTO | overlay∩(status/phase/state) = ∅ |
| Minimum-field stop gate (V3) | MANUAL/CHANGESET | 17 alan + statement = 18 kontrol sözleşmede; makine gate önerilmez |
| evidenceExpected ≠ evidence[] (V5) | MANUAL | taksonomi türevi; aday asla verified değil |
| TaskNode field non-invention (V1) | AUTO | yalnız task.ts'de var olan alanlara eşleme; overlay-only işaretli |
| Claim/phase-boundary (V7) | MANUAL | kanıtsız "tamam/enterprise" yok; Faz 3 açılmadı |
| Allowed-files (V6) | AUTO (`git status` Codex'te) | tek yazılan dosya; girdiler değişmedi |

Not: Repo CI kapıları (`qa:*`, `npm test`, e2e) bu worker tarafından **koşulmadı**; Codex'in bağımsız
doğrulamasına aittir. Yeni makine gate/test/kod **yazılmadı** (kapsam dışı).

## Phase decision

- Bu çıktı **normatif requirement constitution**'dır; requirement/backlog/node/app/module/queue/schema/gate/kod/test
  DEĞİL. Araştırma **kanonik değildir**; hiçbir sayı otomatik hedef değildir.
- Stop-gate (source/owner/AC/evidenceExpected'siz kayıt onaylanamaz): **sözleşmeye yazıldı**, ihlal yok.
- Overlay TaskNode `phase/status/state` ile **yarışmaz**; baseline sonrası otorite TaskNode'dadır.
- Yazılan tek izinli dosya: `docs/enterprise-saas-requirement-constitution.md`. Faz 0/1 çıktıları ve 2 untracked
  girdi **değişmedi**. Commit/push/PR/deploy **yapılmadı**.
- **İnsan kararı gerekenler:** P0 kuyruğu ([`gap`](./enterprise-saas-requirements-unknown-unknowns-gap-2026-07-13.md) §8)
  — ilk 3 product family/ICP, shared-vs-owned authority sınırı, maturity tier, ilk jurisdiction, build/buy/provider.
- **Faz 2 GO/NO-GO → Codex'e ait.** Bu worker Faz 2'yi tamamladı ve **durur**; **Faz 3 (capability ontology)
  açılmaz** — yalnız Codex onayıyla ayrı, yetkili bir dalgada başlar.
