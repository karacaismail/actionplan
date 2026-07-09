# PR-01 Remote Verification Runbook — 2026-07-09

Durum: docs-only remote verification runbook
Queue item: `PR-01`
Remote unblock response intake: `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md`
Remote verification evidence report template: `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md`
Remote unblock request: `docs/platform-pr01-remote-unblock-request-2026-07-09.md`
Current blocker: `docs/platform-pr01-current-blocker-report-2026-07-09.md`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
WBS node'ları: `platform-cicd`, `platform-factory`

Bu belge product code üretmez, Git remote eklemez, PR açmaz ve PR-01'i kapatmaz. Amaç, owner remote unblock yanıtı kabul edildikten sonra implementation operatörünün remote/default branch/Actions/branch-protection doğrulamasını hangi komutlarla ve hangi stop koşullarıyla yapacağını tanımlamaktır.

## Önkoşul

Bu runbook yalnız şu koşullar sağlandıktan sonra kullanılır:

- Owner veya yetkili operatör `docs/platform-pr01-remote-unblock-request-2026-07-09.md` formatıyla yanıt vermiştir.
- Yanıt `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md` kurallarına göre kabul edilmiştir.
- Remote URL, default branch, PR branch izni, Actions read izni, branch-protection okuma durumu, required checks ve review policy netleşmiştir.

Bu koşullar yoksa operatör bu runbook'u uygulamaz; `missing-remote` blocker açık kalır.

## Doğrulama Komutları

Operatör `/Users/karaca/DEV/mimari/platform` içinde yalnız doğrulama amacıyla şu komutları çalıştırır:

```bash
cd /Users/karaca/DEV/mimari/platform
git status --short --branch
git remote -v
gh repo view --json nameWithOwner,url,defaultBranchRef
gh run list --workflow ci.yml --limit 5
gh api repos/<owner>/<repo>/branches/<default-branch>/protection
```

Remote henüz local checkout'a eklenmemişse `git remote add` veya `git remote set-url` yalnız owner yanıtında açık yetki varsa yapılır. Bu runbook tek başına remote değiştirme yetkisi değildir.

## Kabul Edilecek Kanıtlar

| Kanıt | Kabul kuralı |
|---|---|
| `git status --short --branch` | PR-01 branch hazırlığı öncesi worktree durumunu açık gösterir |
| `git remote -v` | Owner yanıtındaki canonical remote URL ile eşleşir |
| `gh repo view` | `nameWithOwner`, `url`, `defaultBranchRef` gerçek repo bilgisi döndürür |
| `gh run list` | `ci.yml` workflow erişimini veya gerçek erişim blocker'ını gösterir |
| Branch protection API | Required checks / protection durumunu döndürür veya permission blocker'ını açık gösterir |
| Default branch kararı | Local `master` ile remote default branch uyumu veya migration kararı belgelenir |
| Deploy trigger kararı | `deploy-backend.yml` branch trigger'ı default branch ile hizalanır ya da PR-01 dışına ertelenir |

## Stop Koşulları

Aşağıdakilerden biri oluşursa PR-01 implementation'a ilerlemez:

- Remote URL owner yanıtıyla eşleşmiyor.
- `gh repo view` repo/default branch bilgisini döndürmüyor.
- Default branch belirsiz veya local/remote branch çelişkisi çözümsüz.
- `gh run list --workflow ci.yml --limit 5` erişim hatası veriyor ve blocker notu yok.
- Branch protection endpoint'i erişilemiyor ve permission blocker notu yok.
- Required checks listesi yok ve policy eksikliği açık blocker olarak yazılmamış.
- Remote doğrulama sırasında product code diff'i oluşuyor.

Stop koşulu oluşursa `docs/platform-pr01-blocker-report-template-2026-07-09.md` formatıyla yeni blocker raporu döner.
Stop koşulu oluşmadan komutlar tamamlanırsa çıktılar önce `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` ile raporlanır; bu rapor PR-01'i `verified` yapmaz.

## Verification Output Taslağı

Gerçek komut çıktıları gelmeden uygulanmaz. Nihai sınıflandırma `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` içindeki rapor formatıyla yapılır:

```json
{
  "id": "PR-01",
  "remoteVerification": {
    "status": "verified-or-blocked",
    "remoteUrl": "<verified-remote-url>",
    "defaultBranch": "<verified-default-branch>",
    "repoViewEvidence": "<gh-repo-view-output-ref>",
    "ciWorkflowEvidence": "<gh-run-list-output-ref>",
    "branchProtectionEvidence": "<gh-api-output-or-blocker-ref>",
    "deployTriggerDecision": "<aligned-or-deferred>",
    "nextStep": "open PR-01 CI baseline branch only after verification passes"
  }
}
```

## Queue Etkisi

- Remote verification runbook hazır olsa bile `PR-01` `next-actionable` kalır.
- `PR-02` `blocked` kalır.
- Bu runbook ancak owner response kabul edildikten sonra kullanılabilir.
- Remote verification geçse bile PR-01 `verified` olmaz; gerçek PR URL, merge SHA ve CI run URL gerekir.
- Remote verification output'u ayrıca `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` ile kabul/red sınıflandırmasına girer.
- Yazılım geliştirilmiş veya meta-framework tamamlanmış sayılmaz.
