# Platform Implementation Execution Queue — 2026-07-09

> **AUTHORITY-LOCK:** `Codex → PM → uzman ajanlar → Claude workers/slaves`.
> Codex nihai karar merciidir; PM ardıl koordinasyon yetkilisidir. AI erişimi
> `read-only-audit`, platform yürütücüsü `human-developer-only`dır. Claude yalnız Codex'in
> sınırlandırılmış çağrısıyla çalışır; aksi durum fail-closed durur.

Durum: docs-only execution queue
Kapsam: `/Users/karaca/DEV/mimari/platform`
Makine-okunur çıktı: `reports/platform-implementation-execution-queue-2026-07-09.json`

Bu belge product code üretmez. Amaç, daha önce kilitlenen PR handoff zincirlerini tek bir yürütme kuyruğuna toplamak ve sıradaki açılabilir PR ile kapalı PR'ların blocker'larını açık göstermektir.

## Queue Kuralı

Kuyruk lineerdir. Bir item `verified` evidence almadan sonraki item açılmaz. Her item şu evidence setini ister:

- PR URL
- merge commit SHA
- CI run URL
- test log veya rapor
- rollback/smoke notu
- manual review notu

Kanıt yoksa `done` yoktur. `reports/platform-implementation-execution-queue-2026-07-09.json` içindeki `status` alanı product gerçekliği değildir; actionplan'ın son salt-okunur gözlemine göre yürütme kapısı durumudur.

## Aşamalar

| Aşama | Aralık | Başlama kapısı | Çıkış kapısı |
|---|---|---|---|
| Foundation | PR-01..PR-11 | PR-01 remote/CI baseline işi | PR-11 hello-platform smoke evidence |
| Customer | CUST-01..CUST-06 | PR-11 verified | Customer e2e/evidence writeback |
| Wave 2 Repeatability | W2-01..W2-06 | Customer CUST-06 verified | repeatability diff report |
| Wave 3 Enterprise | W3-01..W3-07 | W2-06 verified | enterprise DoD evidence pack |
| Wave 4 Portfolio | W4-01..W4-07 | W3-07 verified | portfolio scale exit report |

## Sıradaki Açılabilir İş

Şu anki actionplan gerçekliğine göre tek sıradaki iş:

| Queue | Branch | WBS node | Neden |
|---|---|---|---|
| PR-01 | `task/platform-cicd-ci-baseline` | `platform-cicd`, `platform-factory` | Remote/default branch/CI baseline evidence yok; diğer tüm PR'lar buna bağlı |

Dispatch handoff: `docs/platform-pr01-implementation-dispatch-2026-07-09.md`

Evidence intake template: `docs/platform-pr01-evidence-intake-template-2026-07-09.md`

Blocker report template: `docs/platform-pr01-blocker-report-template-2026-07-09.md`

Current blocker report: `docs/platform-pr01-current-blocker-report-2026-07-09.md`

Remote unblock request: `docs/platform-pr01-remote-unblock-request-2026-07-09.md`

Remote unblock response intake: `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md`

Remote verification runbook: `docs/platform-pr01-remote-verification-runbook-2026-07-09.md`

Remote verification evidence report template: `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md`

PR-01 tamamlanmadan PR-02, Customer, Wave 2, Wave 3 veya Wave 4 başlatılmaz.

## Kapalı Kuyruklar

| Aralık | Status | Blocker |
|---|---|---|
| PR-02..PR-11 | blocked | PR-01 merge + CI evidence yok |
| CUST-01..CUST-06 | blocked | PR-11 hello-platform verified yok |
| W2-01..W2-06 | blocked | Customer CUST-06 verified yok |
| W3-01..W3-07 | blocked | Wave 2 W2-06 repeatability diff verified yok |
| W4-01..W4-07 | blocked | Wave 3 W3-07 enterprise DoD verified yok |

## Hazır Agent Pack'ler

Handoff paketleri product code üretmez; insan geliştiriciye verilecek kapsam, checklist ve evidence patch sözleşmesidir. AI aktörleri paketleri yalnız `read-only-audit` amacıyla inceler.

| Queue | Agent pack | Durum |
|---|---|---|
| PR-01 | `docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md` | `next-actionable` |
| PR-02 | `docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md` | `blocked-by-PR-01` |
| PR-03 | `docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md` | `blocked-by-PR-02` |
| PR-04 | `docs/platform-pr04-event-outbox-agent-pack-2026-07-09.md` | `blocked-by-PR-03` |
| PR-05 | `docs/platform-pr05-eca-runtime-agent-pack-2026-07-09.md` | `blocked-by-PR-04` |
| PR-06 | `docs/platform-pr06-audit-envelope-agent-pack-2026-07-09.md` | `blocked-by-PR-05` |
| PR-07 | `docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md` | `blocked-by-PR-06` |
| PR-08 | `docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md` | `blocked-by-PR-07` |
| PR-09 | `docs/platform-pr09-observability-agent-pack-2026-07-09.md` | `blocked-by-PR-08` |
| PR-10 | `docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md` | `blocked-by-PR-09` |
| PR-11 | `docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md` | `blocked-by-PR-10` |
| CUST-01 | `docs/platform-cust01-customer-app-core-agent-pack-2026-07-09.md` | `blocked-by-PR-11` |
| CUST-02 | `docs/platform-cust02-customer-model-agent-pack-2026-07-09.md` | `blocked-by-CUST-01` |
| CUST-03 | `docs/platform-cust03-customer-graphql-agent-pack-2026-07-09.md` | `blocked-by-CUST-02` |
| CUST-04 | `docs/platform-cust04-customer-ui-agent-pack-2026-07-09.md` | `blocked-by-CUST-03` |
| CUST-05 | `docs/platform-cust05-customer-seed-agent-pack-2026-07-09.md` | `blocked-by-CUST-04` |
| CUST-06 | `docs/platform-cust06-customer-e2e-evidence-agent-pack-2026-07-09.md` | `blocked-by-CUST-05` |
| W2-01 | `docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md` | `blocked-by-CUST-06` |
| W2-02 | `docs/platform-w2-02-sdk-module-template-agent-pack-2026-07-09.md` | `blocked-by-W2-01` |
| W2-03 | `docs/platform-w2-03-sdk-generator-guardrails-agent-pack-2026-07-09.md` | `blocked-by-W2-02` |
| W2-04 | `docs/platform-w2-04-orderops-vertical-slice-agent-pack-2026-07-09.md` | `blocked-by-W2-03` |
| W2-05 | `docs/platform-w2-05-inventory-vertical-slice-agent-pack-2026-07-09.md` | `blocked-by-W2-04` |
| W2-06 | `docs/platform-w2-06-sdk-repeatability-diff-report-agent-pack-2026-07-09.md` | `blocked-by-W2-05` |
| W3-01 | `docs/platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md` | `blocked-by-W2-06` |
| W3-02 | `docs/platform-w3-02-enterprise-performance-gates-agent-pack-2026-07-09.md` | `blocked-by-W3-01` |
| W3-03 | `docs/platform-w3-03-enterprise-accessibility-gates-agent-pack-2026-07-09.md` | `blocked-by-W3-02` |
| W3-04 | `docs/platform-w3-04-enterprise-reliability-gates-agent-pack-2026-07-09.md` | `blocked-by-W3-03` |
| W3-05 | `docs/platform-w3-05-enterprise-observability-gates-agent-pack-2026-07-09.md` | `blocked-by-W3-04` |
| W3-06 | `docs/platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md` | `blocked-by-W3-05` |
| W3-07 | `docs/platform-w3-07-enterprise-dod-evidence-pack-agent-pack-2026-07-09.md` | `blocked-by-W3-06` |
| W4-01 | `docs/platform-w4-01-ready-to-code-queue-export-agent-pack-2026-07-09.md` | `blocked-by-W3-07` |
| W4-02 | `docs/platform-w4-02-app-factory-release-train-agent-pack-2026-07-09.md` | `blocked-by-W4-01` |
| W4-03 | `docs/platform-w4-03-module-marketplace-guardrails-agent-pack-2026-07-09.md` | `blocked-by-W4-02` |
| W4-04 | `docs/platform-w4-04-portfolio-regression-matrix-agent-pack-2026-07-09.md` | `blocked-by-W4-03` |
| W4-05 | `docs/platform-w4-05-evidence-dashboard-blockers-agent-pack-2026-07-09.md` | `blocked-by-W4-04` |
| W4-06 | `docs/platform-w4-06-operations-runbook-drills-agent-pack-2026-07-09.md` | `blocked-by-W4-05` |
| W4-07 | `docs/platform-w4-07-portfolio-scale-exit-report-agent-pack-2026-07-09.md` | `blocked-by-W4-06` |

## Queue Dosyası

Makine-okunur queue dosyası şu alanları taşır:

```json
{
  "id": "PR-01",
  "stage": "foundation",
  "branch": "task/platform-cicd-ci-baseline",
  "wbsNodes": ["platform-cicd", "platform-factory"],
  "status": "next-actionable",
  "blockedBy": [],
  "handoffRef": "docs/platform-initial-11-pr-execution-handoff-2026-07-09.md",
  "agentPackRef": "docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md",
  "dispatchRef": "docs/platform-pr01-implementation-dispatch-2026-07-09.md",
  "evidenceIntakeRef": "docs/platform-pr01-evidence-intake-template-2026-07-09.md",
  "blockerReportRef": "docs/platform-pr01-blocker-report-template-2026-07-09.md",
  "currentBlockerReportRef": "docs/platform-pr01-current-blocker-report-2026-07-09.md",
  "remoteUnblockRequestRef": "docs/platform-pr01-remote-unblock-request-2026-07-09.md",
  "remoteUnblockResponseIntakeRef": "docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md",
  "remoteVerificationRunbookRef": "docs/platform-pr01-remote-verification-runbook-2026-07-09.md",
  "remoteVerificationEvidenceReportTemplateRef": "docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md"
}
```

Bu queue dosyası implementation ajanına product code izni vermez. Ajan yalnız ilgili handoff dosyasında tanımlı repo, branch, non-goal, test ve evidence sınırlarıyla çalışır.

## Güncelleme Prosedürü

Bir implementation PR'ı gerçek evidence ile kapandığında:

1. İlgili WBS node'una `refs`, `evidence`, `traceability.implementationStatus=verified` yazılır.
2. `npm run gen:reindex` çalıştırılır.
3. `reports/platform-implementation-execution-queue-2026-07-09.json` içindeki kapanan item `verified`, bir sonraki item `next-actionable` yapılır.
4. `npm run qa:ci` geçmeden queue güncellemesi merge edilmez.

Queue güncellemesi product implementation yerine geçmez; yalnız actionplan'ın evidence gerçekliğini yansıtır.
