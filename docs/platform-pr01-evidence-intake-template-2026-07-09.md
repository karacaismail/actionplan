# PR-01 Evidence Intake Template — 2026-07-09

Durum: docs-only evidence intake template
Queue item: `PR-01`
Related dispatch: `docs/platform-pr01-implementation-dispatch-2026-07-09.md`
Agent pack: `docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md`
Remote verification evidence report template: `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
WBS node'ları: `platform-cicd`, `platform-factory`

Bu belge product code üretmez ve PR-01'i kapatmaz. Amaç, implementation operatöründen gerçek PR/CI paketi döndüğünde actionplan tarafında hangi kanıtların kabul edileceğini, hangilerinin reddedileceğini ve hangi dosyalara geri yazılacağını netleştirmektir.

## Intake Amacı

PR-01 için gelen kanıt paketi şu soruyu yanıtlamalıdır:

> Remote/default branch/CI baseline gerçekten platform reposunda çalıştı mı, yoksa yalnız plan/handoff dokümanı mı üretildi?

Yanıt yalnız gerçek URL, commit, run ve doğrulama çıktılarıyla verilir. Yerel log, placeholder URL veya sözlü beyan PR-01'i `verified` yapmaz.
Remote verification evidence raporu PR-01'in önkoşul kanıtıdır; PR URL, merge SHA ve CI run URL yerine geçmez.

## Zorunlu Kanıt Alanları

Implementation operatörü actionplan'a şu alanları döner:

| Alan | Kabul kuralı |
|---|---|
| `prUrl` | Gerçek GitHub PR URL'si; placeholder veya örnek domain olamaz |
| `mergeCommitSha` | Merge commit SHA; kısa açıklama değil gerçek SHA |
| `ciRunUrl` | PR-01 sonrası yeşil GitHub Actions run URL'si |
| `remoteEvidence` | `git remote -v` çıktısı veya eşdeğer doğrulanabilir remote kanıtı |
| `defaultBranchEvidence` | GitHub default branch adı ve workflow trigger uyumu |
| `branchProtectionEvidence` | Required checks / branch protection API çıktısı, ekran kanıtı veya erişim blocker notu |
| `testSummary` | CI summary, test logu veya check run özeti |
| `rollbackNote` | CI/default branch değişikliğinin nasıl geri alınacağı |
| `manualReviewNote` | İnsan review veya review blocker notu |
| `productCodeDiffNote` | PR-01'in product feature koduna dokunmadığını gösteren diff özeti |
| `remoteVerificationEvidenceReport` | Varsa `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` formatındaki pre-PR remote verification sınıflandırması |

## Red Koşulları

Aşağıdakilerden biri varsa PR-01 actionplan'da `verified` yapılmaz:

- PR URL, CI URL veya branch protection kanıtı placeholder içeriyor.
- `mergeCommitSha` yok veya PR merge edilmemiş.
- CI run URL yok, kırmızı veya ilgili branch/commit ile eşleşmiyor.
- `remoteEvidence` boş ya da gerçek GitHub remote göstermiyor.
- Default branch ile workflow trigger'ı çelişiyor.
- Branch protection erişilemediyse blocker notu yok.
- PR product feature kodu, tenant/authz/event/audit/capability/SDK/Customer kodu veya UI geliştirmesi içeriyor.
- Testler silinmiş, zayıflatılmış veya `skip` ile yeşile çekilmiş.
- Evidence paketi actionplan writeback dosyalarını elle yeşil göstermeye çalışıyor.

## Kabul Edilirse Geri Yazım

Kanıt paketi kabul edilirse actionplan writeback şu sırayla yapılır:

1. `src/data/generated/nodes/platform-cicd.json` gerçek PR/commit/CI/branch protection refs ve evidence ile güncellenir.
2. `src/data/generated/nodes/platform-factory.json` yalnız PR-01'in factory-level CI/dispatch/evidence bağlantısı gerektiriyorsa güncellenir.
3. `reports/platform-implementation-execution-queue-2026-07-09.json` içinde `PR-01` `verified`, `PR-02` `next-actionable` yapılır.
4. `docs/platform-implementation-execution-queue-2026-07-09.md` insan-okunur queue gerçekliğiyle hizalanır.
5. `npm run gen:reindex` çalıştırılır.
6. `npm run qa:ci` yeşil geçer.

Bu adımlar yalnız gerçek evidence geldiğinde uygulanır. Bu template'in eklenmesi queue statüsünü ilerletmez.

## Kabul Edilmezse Geri Yazım

Kanıt paketi eksikse PR-01 açık kalır:

- Queue JSON'da `PR-01` `next-actionable` kalır.
- Eksik evidence veya blocker notu ilgili node `traceability` alanına yazılır.
- Stop koşulu varsa `docs/platform-pr01-blocker-report-template-2026-07-09.md` zorunlu alanlarıyla blocker paketi istenir.
- PR-02 ve sonraki item'lar açılmaz.
- Product/meta-framework completion iddiası yazılmaz.

## Platform-cicd Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-cicd",
  "refs": [
    "docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md",
    "docs/platform-pr01-implementation-dispatch-2026-07-09.md",
    "docs/platform-pr01-evidence-intake-template-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "branch-protection:<api-or-screenshot-ref>"
  ],
  "evidence": [
    "PR-01 CI baseline verified: <github-actions-run-url>",
    "Default branch verified: <main-or-master>; evidence:<ref>",
    "Branch protection verified: <ref>",
    "Rollback note: <rollback-note>",
    "Product code diff note: <no-product-code-diff-ref>"
  ],
  "traceability": {
    "implementationStatus": "verified",
    "queueStatus": "verified:PR-01",
    "verifiedQueueItem": "PR-01",
    "verifiedPrUrl": "<real-pr-url>",
    "verifiedCiRunUrl": "<github-actions-run-url>",
    "verifiedMergeCommitSha": "<merge-commit-sha>"
  }
}
```

## Queue Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "items": [
    {
      "id": "PR-01",
      "status": "verified",
      "evidence": {
        "prUrl": "<real-pr-url>",
        "mergeCommitSha": "<merge-commit-sha>",
        "ciRunUrl": "<github-actions-run-url>",
        "branchProtectionEvidence": "<ref>",
        "manualReviewNote": "<ref>"
      }
    },
    {
      "id": "PR-02",
      "status": "next-actionable",
      "blockedBy": []
    }
  ]
}
```

## Intake Done Kapısı

Bu template actionplan tarafında tamam sayılırsa:

- PR-01 gerçek evidence geldiğinde kabul/red kuralları tek dosyadadır.
- Dispatch, agent pack ve queue JSON intake dosyasına bağlanmıştır.
- `platform-cicd` ve `platform-factory` node'ları evidence intake ref'ini taşır.
- PR-01 hala gerçek PR/CI/test evidence bekler.
- Yazılım geliştirilmiş veya meta-framework tamamlanmış sayılmaz.
