# W3-06 Enterprise Release + Governance Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `W3-06`
Branch: `task/enterprise-release-governance`
WBS node'ları: `std-ci-gates`, `deploy-yap`, `build-risk-defteri`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Queue status: `blocked-by-W3-05`

Bu belge product code üretmez. Amaç, W3-05 Enterprise Observability Gates kanıtı kapandıktan sonra açılacak W3-06 işini implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Önkoşul

W3-06 yalnız şu kanıtlar geldikten sonra başlar:

- W2-06 repeatability verified evidence
- W3-01 security gates verified evidence
- W3-02 performance gates verified evidence
- W3-03 accessibility gates verified evidence
- W3-04 reliability gates verified evidence
- W3-05 observability gates verified evidence

Bu kanıtlar yoksa W3-06 prompt'u kod ajanına verilmez; yalnız hazırlık/handoff dokümanı olarak kalır.

## Amaç

W3-06'nın tek amacı enterprise release ve governance kanıtını üretmektir:

- Staging/prod separation gerçek deploy/runbook kanıtıyla belgelenir.
- Deploy logu ve rollback drill logu alınır.
- CODEOWNERS ve PR template repo içinde referanslanır.
- Branch protection, required checks ve review policy evidence alınır.
- Release/governance riski `build-risk-defteri` üstünden kanıta bağlı kapanır.

## Non-Goal

W3-06 şunları yapmaz:

- Product feature, domain davranışı veya UI redesign işi başlatmaz.
- W3-07 Enterprise DoD evidence pack'i tamamlandı gibi göstermez.
- W4 app factory, marketplace, portfolio regression veya evidence dashboard işini başlatmaz.
- Branch protection veya CI required checks kanıtını local workflow varlığıyla ikame etmez.
- Deploy/rollback evidence olmadan release-ready iddiası yazmaz.
- Actionplan evidence/status alanlarını gerçek PR/CI/deploy/test kanıtı olmadan ilerletmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde, yalnız W3-05 evidence kapandıktan sonra kullanır:

```text
Görev: W3-06 Enterprise Release + Governance.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/enterprise-release-governance
WBS nodes: std-ci-gates, deploy-yap, build-risk-defteri
Prerequisite: W3-05 verified evidence in actionplan.

Amaç:
1. Staging/prod separation, deploy logu ve rollback drill evidence üret.
2. CODEOWNERS, PR template, branch protection ve required checks evidence üret.
3. CI/deploy workflow run referanslarını gerçek remote evidence olarak al.
4. Release/governance risk register ve closure evidence üret.
5. PR/CI/deploy/report evidence ve actionplan writeback patch'ini hazırla.

Mutlak sınırlar:
- W3-05 evidence yoksa kod yazma; blocker raporu üret.
- Product feature, domain UI/API davranışı, W3-07 DoD pack veya W4 portfolio işine atlama.
- Local workflow dosyasını branch protection veya remote CI evidence yerine koyma.
- CODEOWNERS/PR template olmadan governance done yazma.
- Deploy/rollback logu olmadan release ready yazma.
- Actionplan'da status/progress/evidence alanlarını gerçek PR/CI/deploy/test kanıtı olmadan ilerletme.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- W3-05 observability evidence referansları
- git remote -v
- mevcut CODEOWNERS var/yok durumu
- mevcut PR template var/yok durumu
- branch protection API sonucu veya erişim blocker'ı
- ci.yml ve deploy-backend.yml son run listesi
- staging/prod health smoke sonucu
- rollback drill log var/yok durumu

Beklenen minimum değişiklikler:
- .github/CODEOWNERS
- .github/PULL_REQUEST_TEMPLATE.md
- .github/workflows/ci.yml
- .github/workflows/deploy-backend.yml
- infra/README-deploy.md
- infra/runbooks/rollback-drill.md
- reports/release/staging-prod-separation.md
- reports/release/deploy-rollback-log.md
- reports/governance/branch-protection.md
- reports/governance/required-checks.md
- reports/governance/review-policy.md
- reports/governance/release-risk-register.md
- reports/release/release-governance-summary.md

Test/evidence-first sıra:
1. Branch protection ve required checks evidence yokluğu önce blocker olarak görünür.
2. CODEOWNERS ve PR template referansları repo policy ile eşleşir.
3. CI ve deploy workflow run listesi gerçek remote run referansı verir.
4. Staging/prod separation note gerçek environment/URL ayrımını taşır.
5. Deploy logu ve rollback drill logu alınır.
6. Product feature veya W4 kapsamına taşma olmadığı diff note ile kanıtlanır.

Zorunlu doğrulama:
gh api repos/<owner>/<repo>/branches/<default-branch>/protection
gh run list --workflow ci.yml --limit 5
gh run list --workflow deploy-backend.yml --limit 5
curl -fsS <staging-url>/healthz
curl -fsS <production-url>/healthz

Çıkış:
- PR URL
- CI run URL
- merge commit SHA
- staging/prod separation note
- deploy logu
- rollback drill logu
- CODEOWNERS file reference
- PR template reference
- branch protection evidence
- required checks evidence
- review policy note
- product-feature/W4 non-goal diff note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] W3-05 evidence actionplan'da doğrulandı.
- [ ] Branch `task/enterprise-release-governance` olarak açıldı.
- [ ] Branch protection ve required checks evidence yokluğu veya sonucu raporlandı.
- [ ] CODEOWNERS referansı var.
- [ ] PR template referansı var.
- [ ] CI/deploy workflow run referansları var.
- [ ] Staging/prod separation note var.
- [ ] Deploy logu ve rollback drill logu var.
- [ ] Release/governance risk register var.
- [ ] Product feature, W3-07 DoD pack veya W4 portfolio diff'i yok.
- [ ] PR body WBS node, scope, non-goal, tests, rollback ve evidence patch içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Deploy workflow run URL alındı.
- [ ] Staging/prod health smoke sonucu alındı.
- [ ] Branch protection evidence alındı.
- [ ] Required checks evidence alındı.
- [ ] CODEOWNERS ve PR template referansları alındı.
- [ ] Rollback drill logu alındı.
- [ ] Release/governance risk closure note yazıldı.
- [ ] Merge commit SHA alındı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
[
  {
    "id": "std-ci-gates",
    "refs": [
      "docs/platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md",
      "pr:<real-pr-url>",
      "commit:<merge-commit-sha>",
      "ci:<github-actions-run-url>",
      "report:<branch-protection-evidence-ref>"
    ],
    "evidence": [
      "W3-06 branch protection evidence alındı: <branch-protection-evidence-ref>",
      "Required checks evidence alındı: <required-checks-ref>",
      "CODEOWNERS ve PR template referansları doğrulandı: <governance-report-ref>"
    ],
    "traceability": {
      "implementationStatus": "verified",
      "governanceEvidenceStatus": "verified",
      "requiredChecksEvidenceStatus": "verified",
      "queueStatus": "verified:W3-06"
    }
  },
  {
    "id": "deploy-yap",
    "refs": [
      "docs/platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md",
      "report:<deploy-rollback-log-ref>",
      "report:<staging-prod-separation-ref>"
    ],
    "evidence": [
      "Staging/prod separation evidence alındı: <staging-prod-separation-ref>",
      "Deploy logu alındı: <deploy-log-ref>",
      "Rollback drill logu alındı: <rollback-drill-log-ref>"
    ],
    "traceability": {
      "releaseEvidenceStatus": "verified",
      "rollbackDrillEvidenceStatus": "verified"
    }
  },
  {
    "id": "build-risk-defteri",
    "refs": [
      "docs/platform-w3-06-enterprise-release-governance-agent-pack-2026-07-09.md",
      "report:<release-risk-register-ref>"
    ],
    "evidence": [
      "Release/governance risk register evidence alındı: <release-risk-register-ref>",
      "Kanıtsız risk closure yapılmadı: <risk-closure-note-ref>"
    ],
    "traceability": {
      "riskEvidenceStatus": "verified"
    }
  }
]
```

## W3-06 Done Kapısı

W3-06 ancak şu koşullarla kapanır:

- W3-05 evidence daha önce verified durumdadır.
- Staging/prod separation ve deploy logu gerçek evidence taşır.
- Rollback drill logu gerçek evidence taşır.
- CODEOWNERS ve PR template referansları vardır.
- Branch protection ve required checks evidence alınmıştır.
- Product feature, W3-07 DoD pack veya W4 portfolio işi eklenmemiştir.
- `std-ci-gates`, `deploy-yap` ve `build-risk-defteri` node'larına PR/CI/deploy/evidence geri yazılmıştır.

Bu done kapısı kapanmadan W3-07 Enterprise DoD Evidence Pack başlamaz.
