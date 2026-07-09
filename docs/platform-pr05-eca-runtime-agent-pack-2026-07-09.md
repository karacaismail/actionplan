# PR-05 ECA Runtime Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `PR-05`
Branch: `task/l1-workflow-eca-runtime`
WBS node'u: `l1-workflow`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-04`

Bu belge product code üretmez. Amaç, PR-04 Event/Outbox kanıtı kapandıktan sonra açılacak PR-05 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-05 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-04 event envelope + transactional outbox + idempotent consumer verified evidence
- PR-04 replay/DLQ note
- `k-bus` actionplan writeback'i

Bu kanıtlar yoksa PR-05 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-05'in tek amacı backend-only ECA runtime skeleton kurmaktır:

- ECA trigger yalnız event/outbox envelope üzerinden çalışır.
- Rule match/no-match deterministik test edilir.
- Disabled rule hiçbir action üretmez.
- Safe action allowlist yoksa action deny edilir.
- Max chain depth 6 eşiğinde loop-breaker devreye girer.
- Step-up veya human approval gerektiren action otomatik koşmaz.

## Non-Goal

PR-05 şunları yapmaz:

- Visual workflow designer veya drag-drop workflow UI yazmaz.
- Customer-specific workflow/ruleset üretmez.
- Serbest JS, SQL, shell veya arbitrary code execution motoru eklemez.
- Audit log implementation yazmaz.
- Scheduler, SLA engine veya long-running approval workflow başlatmaz.
- Tenant-level ruleset override veya system ruleset disable yetkisi açmaz.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-04 evidence kapandıktan sonra kullanır:

```text
Görev: PR-05 ECA Runtime.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/l1-workflow-eca-runtime
WBS nodes: l1-workflow
Prerequisite: PR-01 CI baseline, PR-02 tenant context, PR-03 Authz/PDP, PR-04 Event/Outbox evidence verified in actionplan.

Amaç:
1. ECA trigger'ı yalnız event/outbox envelope üzerinden çalışacak şekilde kur.
2. Ruleset schema, disabled flag ve owner/scope katmanlarını tanımla.
3. Rule match/no-match davranışını deterministik test et.
4. Safe action allowlist yoksa action deny davranışını test et.
5. Max chain depth 6 loop-breaker testini kur.
6. Step-up veya human approval gereken action'ın otomatik koşmadığını test et.

Mutlak sınırlar:
- PR-04 evidence yoksa kod yazma; blocker raporu üret.
- Visual workflow designer, drag-drop UI veya workflow ekranı yazma.
- Customer-specific workflow/ruleset üretme.
- Serbest JS/SQL/shell/arbitrary code execution ekleme; bunları negatif testle deny et.
- Audit log implementation yazma; yalnız audit-compatible execution fields gerekiyorsa not düş.
- Scheduler/SLA/long-running approval engine başlatma.
- Tenant ruleset override veya system ruleset disable yetkisi açma.
- ECA negatif testlerini silme, zayıflatma veya yalnız happy-path match ile geçirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01/PR-02/PR-03/PR-04 evidence referansları
- eca/workflow/ruleset/trigger/action/scheduler arama sonucu
- mevcut GitHub Actions workflow izlerinin ürün içi ECA runtime kanıtı olmadığını not et
- mevcut event/outbox envelope contract referansı

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/eca.py veya repo yapısına uygun ECA evaluator modülü
- apps/api/src/meta_api/workflow.py veya repo yapısına uygun state transition contract modülü
- apps/api/src/meta_api/rulesets.py veya repo yapısına uygun ruleset schema/scope modülü
- apps/api/tests/test_eca_runtime.py
- apps/api/tests/test_eca_action_allowlist.py
- apps/api/tests/test_eca_chain_guard.py
- apps/api/tests/test_workflow_state.py

Test-first sıra:
1. Rule match produces only allowlisted action.
2. Rule no-match produces no action.
3. Disabled rule produces no action.
4. Free JS/SQL/shell action is denied.
5. Max chain depth 6 stops recursive action generation.
6. Human approval or step-up action does not run automatically.
7. Invalid state transition is denied and idempotent retry is stable.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_eca_runtime.py tests/test_eca_action_allowlist.py tests/test_eca_chain_guard.py tests/test_workflow_state.py

Çıkış:
- PR URL
- CI run URL
- unauthorized action deny test logu
- max-chain guard test logu
- disabled rule/no-match test logu
- safe action allowlist fixture
- rollback note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] PR-01, PR-02, PR-03 ve PR-04 evidence actionplan'da doğrulandı.
- [ ] Branch `task/l1-workflow-eca-runtime` olarak açıldı.
- [ ] İlk commit kırmızı forbidden action veya max-chain testi taşıyor.
- [ ] Rule match/no-match testleri var.
- [ ] Disabled rule no-action testi var.
- [ ] Safe action allowlist testi var.
- [ ] Serbest JS/SQL/shell deny testleri var.
- [ ] Max chain depth 6 loop-breaker testi var.
- [ ] Human approval/step-up action otomatik koşmuyor.
- [ ] Visual designer, Customer workflow, scheduler ve audit implementation diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Unauthorized action deny test logu alındı.
- [ ] Max-chain guard test logu alındı.
- [ ] Disabled rule/no-match test logu alındı.
- [ ] Safe action allowlist fixture alındı.
- [ ] Merge commit SHA alındı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "l1-workflow",
  "refs": [
    "docs/platform-pr05-eca-runtime-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<eca-runtime-test-log-ref>"
  ],
  "evidence": [
    "PR-05 ECA Runtime geçti: <github-actions-run-url>",
    "Rule match/no-match ve disabled rule testleri geçti: <test-log-ref>",
    "Forbidden JS/SQL/shell action deny testleri geçti: <test-log-ref>",
    "Max chain depth 6 loop-breaker testi geçti: <test-log-ref>",
    "Safe action allowlist fixture üretildi: <fixture-ref>",
    "Rollback note: ECA runtime wiring revert edilebilir; visual designer/Customer workflow kodu eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "queueStatus": "verified:PR-05"
  }
}
```

## PR-05 Done Kapısı

PR-05 ancak şu koşullarla kapanır:

- PR-01, PR-02, PR-03 ve PR-04 evidence daha önce verified durumdadır.
- ECA trigger yalnız event/outbox envelope üzerinden çalışır.
- Rule match/no-match deterministik testlidir.
- Disabled rule hiçbir action üretmez.
- Serbest JS, SQL ve shell action denemeleri deny edilir.
- Max chain depth 6 loop-breaker testle doğrulanır.
- Step-up veya human approval gerektiren action otomatik koşmaz.
- `l1-workflow` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-06 Audit Envelope başlamaz.
