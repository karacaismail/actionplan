# W3-01 Enterprise Security Gates Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W3-01`
Branch: `task/enterprise-security-gates`
WBS node'ları: `cc-security`, `k-authz`, `k-tenancy`, `l1-audit`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W2-06`

Bu belge product code üretmez. Amaç, W2-06 SDK Repeatability Diff Report kanıtı kapandıktan sonra açılacak W3-01 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W3-01 yalnız şu kanıtlar geldikten sonra başlar:

- PR-01..PR-11 Foundation zinciri verified evidence
- CUST-01..CUST-06 Customer vertical slice verified evidence
- W2-01..W2-06 repeatability verified evidence
- Customer, OrderOps ve Inventory PR/CI/test/e2e evidence writeback'leri
- `packages/sdk/docs/repeatability-report.md` ve copy-code threshold report evidence

Bu kanıtlar yoksa W3-01 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W3-01'in tek amacı enterprise security gate kanıtını üretmektir:

- Security CI workflow veya job'ı OWASP/ZAP ya da eşdeğer security report üretir.
- Authz bypass negative suite deny-by-default politikasını kanıtlar.
- Tenant escape negative suite cross-tenant veri sızıntısını reddeder.
- Audit deny, immutability ve tamper evidence güvenlik olaylarını kanıtlar.
- Secret scan logu gerçek sır sızıntısı olmadığını gösterir.
- Critical/high security bulgu varsa release-candidate kapısı kapanmaz.

## Non-Goal

W3-01 şunları yapmaz:

- Product feature, yeni domain veya UI redesign üretmez.
- Performance, accessibility, reliability, observability veya release governance işlerini başlatmaz; bunlar W3-02..W3-06 kapsamıdır.
- Authz/tenant/audit guard'larını test geçsin diye zayıflatmaz.
- Security report'u elle uydurmaz veya high/critical bulguları waiver'sız görmezden gelmez.
- Secret scan sonucunu gerçek tarama olmadan "temiz" yazmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W2-06 evidence kapandıktan sonra kullanır:

```text
Görev: W3-01 Enterprise Security Gates.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/enterprise-security-gates
WBS nodes: cc-security, k-authz, k-tenancy, l1-audit
Prerequisite: W2-06 verified evidence in actionplan.

Amaç:
1. Security CI workflow/job veya equivalent script'i OWASP/ZAP ya da eşdeğer report üretecek şekilde ekle.
2. Authz bypass negative suite'i deny-by-default policy decision ve capability matrix ile bağla.
3. Tenant escape negative suite'i cross-tenant data access ve client tenant override reddiyle kanıtla.
4. Audit deny, immutability ve tamper/security-event evidence testlerini kur.
5. Secret scan'i CI ve local gate'e bağla.
6. Critical/high bulgu varsa PR çıkışını fail-closed yap.
7. PR/CI/test/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W2-06 evidence yoksa kod yazma; blocker raporu üret.
- Product feature, yeni domain, performance/a11y/reliability/observability/release governance işi başlatma.
- Authz bypass veya tenant escape testini skip/xfail/allowlist ile gizleme.
- Audit tamper veya deny event testini yalnız happy path log ile geçirme.
- OWASP/ZAP ya da eşdeğer security report üretmeden security gate'i kapatma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W2-06 repeatability evidence referansları
- mevcut security workflow/job var/yok durumu
- mevcut authz bypass ve tenant escape testleri var/yok durumu
- audit immutability/tamper/security-event testleri var/yok durumu
- secret scan gate durumu
- product feature diff'i olmadığını gösteren note

Beklenen minimum değişiklikler:
- .github/workflows/security.yml
- apps/api/tests/security/test_authz_bypass.py
- apps/api/tests/security/test_tenant_escape.py
- apps/api/tests/security/test_security_headers.py
- apps/api/tests/test_policy_decision.py
- apps/api/tests/test_audit_immutability.py
- apps/api/tests/test_audit_tamper_detection.py
- apps/api/tests/test_security_event_audit.py
- reports/security/owasp-zap.md
- reports/security/secret-scan.md
- reports/security/security-gate-summary.md

Test-first sıra:
1. Authz bypass negative test önce kırmızı olur.
2. Tenant escape negative test cross-tenant erişimi reddederek yeşile döner.
3. Audit deny event, immutability ve tamper detection testleri geçer.
4. Secret scan gate gerçek tarama çıktısıyla geçer.
5. OWASP/ZAP veya eşdeğer report critical/high bulgu = 0 sonucunu taşır.
6. Security workflow/job CI evidence üretir.
7. Product feature eklenmediği diff note ile kanıtlanır.

Zorunlu doğrulama:
cd apps/api && uv run --python 3.12 pytest -q tests/security tests/test_policy_decision.py tests/test_audit_immutability.py
node tools/agents/check-secrets.mjs

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- OWASP/ZAP veya eşdeğer security report ref'i
- authz bypass negative test logu
- tenant escape negative test logu
- audit deny/immutability/tamper test logu
- secret scan logu
- critical/high finding = 0 veya blocker note
- rollback/smoke note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W2-06 evidence actionplan'da doğrulandı.
- [ ] Branch `task/enterprise-security-gates` olarak açıldı.
- [ ] İlk commit kırmızı authz bypass, tenant escape veya audit security testi taşıyor.
- [ ] Security workflow/job OWASP/ZAP veya eşdeğer report üretir.
- [ ] Authz bypass negative suite deny-by-default policy ile bağlı.
- [ ] Tenant escape negative suite cross-tenant erişimi reddeder.
- [ ] Audit deny/immutability/tamper/security-event evidence testli.
- [ ] Secret scan gate CI/local çalışır.
- [ ] Critical/high finding varsa PR çıkışı blocker olur.
- [ ] Product feature, yeni domain veya diğer Wave 3 işleri diff'te yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Security report ref'i alındı.
- [ ] Authz bypass negative test logu alındı.
- [ ] Tenant escape negative test logu alındı.
- [ ] Audit deny/immutability/tamper test logu alındı.
- [ ] Secret scan logu alındı.
- [ ] Critical/high finding status yazıldı.
- [ ] Rollback/smoke note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "cc-security",
    "refs": [
      "docs/platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<security-report-ref>"
    ],
    "evidence": [
      "W3-01 Enterprise Security Gates geçti: <github-actions-run-url>",
      "OWASP/ZAP veya eşdeğer security report critical/high=0: <report-ref>",
      "Secret scan geçti: <secret-scan-log-ref>",
      "Rollback note: security workflow/test/report değişiklikleri revert edilebilir; product feature eklenmedi"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "securityEvidenceStatus": "verified",
      "queueStatus": "verified:W3-01"
    }
  },
  {
    "id": "k-authz",
    "refs": [
      "docs/platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<authz-bypass-test-log-ref>"
    ],
    "evidence": [
      "Authz bypass negative suite geçti: <test-log-ref>",
      "Deny-by-default policy decision security gate içinde doğrulandı: <test-log-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "authzEvidenceStatus": "verified:security-gate",
      "queueStatus": "verified:W3-01"
    }
  },
  {
    "id": "k-tenancy",
    "refs": [
      "docs/platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<tenant-escape-test-log-ref>"
    ],
    "evidence": [
      "Tenant escape negative suite geçti: <test-log-ref>",
      "Client tenant override ve cross-tenant data access reddi kanıtlandı: <test-log-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "tenantEvidenceStatus": "verified:security-gate",
      "queueStatus": "verified:W3-01"
    }
  },
  {
    "id": "l1-audit",
    "refs": [
      "docs/platform-w3-01-enterprise-security-gates-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "ci:<github-actions-run-url>",
      "test:<audit-security-test-log-ref>"
    ],
    "evidence": [
      "Audit deny, immutability ve tamper detection testleri geçti: <test-log-ref>",
      "Security event audit evidence üretildi: <test-log-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "auditEvidenceStatus": "verified:security-gate",
      "queueStatus": "verified:W3-01"
    }
  }
]
```

## W3-01 Done Kapısı

W3-01 ancak şu koşullarla kapanır:

- W2-06 evidence daha önce verified durumdadır.
- Security workflow/job gerçek report üretir.
- OWASP/ZAP veya eşdeğer report critical/high bulgu = 0 gösterir ya da blocker note yazar.
- Authz bypass negative suite geçer.
- Tenant escape negative suite geçer.
- Audit deny, immutability, tamper ve security-event evidence testleri geçer.
- Secret scan logu temizdir.
- Product feature, yeni domain veya diğer Wave 3 işleri eklenmemiştir.
- `cc-security`, `k-authz`, `k-tenancy` ve `l1-audit` node'larına PR/CI/test/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W3-02 Performance Gates başlamaz.
