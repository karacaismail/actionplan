# PR-06 Audit Envelope Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `PR-06`
Branch: `task/l1-audit-envelope`
WBS node'u: `l1-audit`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-PR-05`

Bu belge product code üretmez. Amaç, PR-05 ECA Runtime kanıtı kapandıktan sonra açılacak PR-06 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

PR-06 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01 remote/default-branch/CI baseline verified evidence
- PR-02 tenant context + tenant isolation verified evidence
- PR-03 Authz/PDP deny-by-default verified evidence
- PR-04 event/outbox durability verified evidence
- PR-05 ECA safe action allowlist + max-chain verified evidence
- `l1-workflow` actionplan writeback'i

Bu kanıtlar yoksa PR-06 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

PR-06'nın tek amacı append-only audit envelope ve activity projection ayrımını kurmaktır:

- `AuditEvent` actor, tenant, action, resource, before/after hash ve correlation id taşır.
- Audit log append-only çalışır; update/delete denemesi reddedilir.
- Hash chain bozulursa tamper detection testi yakalar.
- Deny kararları audit-compatible fixture üretir.
- Activity feed audit log'dan türetilir; compliance audit kaydını mutasyona uğratmaz.
- Audit erişimi meta-audit kaydı üretir.

## Non-Goal

PR-06 şunları yapmaz:

- Reporting UI, dashboard veya analytics ekranı yazmaz.
- Customer/domain-specific audit event üretmez.
- SIEM export, retention/legal hold veya enterprise export pack başlatmaz.
- Audit storage migration kapsamını PR-08 DB/migration baseline'ını aşacak şekilde büyütmez.
- Activity feed'i compliance audit kaydının yerine koymaz.
- Container/app loglarını audit trail kanıtı gibi sunmaz.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız PR-05 evidence kapandıktan sonra kullanır:

```text
Görev: PR-06 Audit Envelope.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/l1-audit-envelope
WBS nodes: l1-audit
Prerequisite: PR-01 CI baseline, PR-02 tenant context, PR-03 Authz/PDP, PR-04 Event/Outbox, PR-05 ECA Runtime evidence verified in actionplan.

Amaç:
1. AuditEvent envelope sözleşmesini actor/tenant/action/resource/beforeHash/afterHash/correlationId alanlarıyla kur.
2. Append-only audit writer davranışını test et.
3. Update/delete/tamper denemelerini negatif testle reddet.
4. Hash chain veya eşdeğer tamper detection stratejisini testle kanıtla.
5. Activity feed projection'ı compliance audit log'dan ayır.
6. Audit erişiminin meta-audit kaydı üretmesini test et.

Mutlak sınırlar:
- PR-05 evidence yoksa kod yazma; blocker raporu üret.
- Reporting UI, dashboard veya analytics ekranı yazma.
- Customer/domain-specific audit event üretme.
- SIEM/export/legal-hold/retention enterprise pack başlatma.
- Container/app loglarını audit trail evidence gibi sunma.
- Activity feed'i compliance audit kaydının yerine koyma.
- Audit negatif testlerini silme, zayıflatma veya yalnız happy-path append ile geçirme.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- PR-01/PR-02/PR-03/PR-04/PR-05 evidence referansları
- audit/activity/hash/tamper/meta-audit arama sonucu
- deploy runbook container loglarının audit trail kanıtı olmadığını not et
- tenant/actor envelope kaynaklarını PR-02 ve PR-03'e bağla

Beklenen minimum değişiklikler:
- apps/api/src/meta_api/audit.py veya repo yapısına uygun AuditEvent/writer modülü
- apps/api/src/meta_api/activity.py veya repo yapısına uygun activity projection modülü
- apps/api/tests/test_audit_envelope.py
- apps/api/tests/test_audit_immutability.py
- apps/api/tests/test_audit_tamper_detection.py
- apps/api/tests/test_activity_feed.py
- apps/api/tests/test_security_event_audit.py

Test-first sıra:
1. AuditEvent requires actor/tenant/action/resource/correlationId.
2. Audit append succeeds but update/delete is denied.
3. Hash chain tamper is detected.
4. Deny decision produces audit-compatible fixture.
5. Activity feed is derived from audit but cannot mutate audit.
6. Audit read/access produces meta-audit record.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/test_audit_envelope.py tests/test_audit_immutability.py tests/test_audit_tamper_detection.py tests/test_activity_feed.py tests/test_security_event_audit.py

Çıkış:
- PR URL
- CI run URL
- immutable audit test logu
- tamper detection test logu
- deny-audit fixture
- activity/audit separation test logu
- rollback note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] PR-01, PR-02, PR-03, PR-04 ve PR-05 evidence actionplan'da doğrulandı.
- [ ] Branch `task/l1-audit-envelope` olarak açıldı.
- [ ] İlk commit kırmızı immutability veya tamper detection testi taşıyor.
- [ ] AuditEvent actor/tenant/action/resource/correlationId alanlarıyla testleniyor.
- [ ] Append-only update/delete deny testi var.
- [ ] Hash chain veya eşdeğer tamper detection testi var.
- [ ] Deny kararları audit-compatible fixture üretiyor.
- [ ] Activity feed audit log'u mutasyona uğratmıyor.
- [ ] Audit erişimi meta-audit kaydı üretiyor.
- [ ] Reporting UI, Customer audit, SIEM/export ve retention/legal-hold diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Immutable audit test logu alındı.
- [ ] Tamper detection test logu alındı.
- [ ] Deny-audit fixture alındı.
- [ ] Activity/audit separation test logu alındı.
- [ ] Merge commit SHA alındı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "l1-audit",
  "refs": [
    "docs/platform-pr06-audit-envelope-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "test:<audit-envelope-test-log-ref>"
  ],
  "evidence": [
    "PR-06 Audit Envelope geçti: <github-actions-run-url>",
    "AuditEvent actor/tenant/action/resource/correlationId alanlarıyla kanıtlandı: <test-log-ref>",
    "Append-only update/delete deny testleri geçti: <test-log-ref>",
    "Tamper detection testi geçti: <test-log-ref>",
    "Deny-audit fixture üretildi: <fixture-ref>",
    "Activity feed audit log'u mutasyona uğratmadan türetildi: <test-log-ref>",
    "Rollback note: audit/activity wiring revert edilebilir; reporting UI/Customer audit kodu eklenmedi"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "auditEvidenceStatus": "verified",
    "queueStatus": "verified:PR-06"
  }
}
```

## PR-06 Done Kapısı

PR-06 ancak şu koşullarla kapanır:

- PR-01, PR-02, PR-03, PR-04 ve PR-05 evidence daha önce verified durumdadır.
- AuditEvent actor, tenant, action, resource ve correlation id taşır.
- Audit log append-only davranır; update/delete denemesi reddedilir.
- Tamper detection testle doğrulanır.
- Deny kararları audit-compatible fixture üretir.
- Activity feed compliance audit log'u mutasyona uğratmaz.
- Audit erişimi meta-audit kaydı üretir.
- `l1-audit` node'una PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan PR-07 Capability Registry başlamaz.
