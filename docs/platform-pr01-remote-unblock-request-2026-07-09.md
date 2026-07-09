# PR-01 Remote Unblock Request — 2026-07-09

Durum: docs-only owner unblock request
Queue item: `PR-01`
Current blocker: `docs/platform-pr01-current-blocker-report-2026-07-09.md`
Blocker type: `missing-remote`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
WBS node'ları: `platform-cicd`, `platform-factory`

Bu belge product code üretmez, Git remote eklemez, branch açmaz ve PR-01'i kapatmaz. Amaç, mevcut `missing-remote` blocker'ını açmak için repo owner veya yetkili operatörden gereken net girdileri tek yerde toplamaktır.

## Neden Gerekli?

Mevcut salt-okunur gözlemde:

- `git remote -v` boş.
- `gh repo view --json nameWithOwner,url,defaultBranchRef` çıktısı `no git remotes found`.
- `gh run list --workflow ci.yml --limit 5` çıktısı `failed to determine base repo: no git remotes found`.
- `.github/workflows/ci.yml` ve `.github/workflows/deploy-backend.yml` yerelde var, fakat remote CI run URL'si yok.

Bu durumda implementation operatörü gerçek PR URL, merge SHA, CI run URL veya branch protection evidence üretemez. Remote URL uydurmak yasaktır.

## Owner'dan Gereken Girdiler

| Girdi | Kabul kuralı |
|---|---|
| Canonical GitHub remote URL | Gerçek `https://github.com/<owner>/<repo>.git` veya `git@github.com:<owner>/<repo>.git` değeri |
| Remote adı | Varsayılan `origin` mı, farklı ad mı kullanılacağı |
| Default branch | GitHub default branch adı; `master`/`main` çelişkisi açık kapatılır |
| PR branch izni | `task/platform-cicd-ci-baseline` branch'i ile PR açma izni |
| GitHub Actions erişimi | `gh run list --workflow ci.yml --limit 5` çalışacak repo/action read izni |
| Branch protection erişimi | Required checks / branch protection okumak için API veya ekran kanıtı erişimi |
| Required checks listesi | PR-01 sonrası zorunlu olacak check isimleri veya henüz yoksa açık blocker notu |
| Deploy trigger kararı | `deploy-backend.yml` default branch ile hizalanacak mı, yoksa deploy PR-01 dışı mı kalacak |
| Secret kanıt kapsamı | Secret değerleri değil, yalnız varlık/scope kanıtının nasıl verileceği |
| Review policy | PR-01 için insan review gereksinimi ve CODEOWNER/reviewer bilgisi |

## Owner Yanıt Formatı

Owner veya yetkili operatör şu formatla yanıt döner:

```json
{
  "queueItem": "PR-01",
  "remoteUrl": "<real-github-remote-url>",
  "remoteName": "origin",
  "defaultBranch": "<main-or-master-or-other>",
  "prBranchAllowed": true,
  "actionsReadAllowed": true,
  "branchProtectionReadAllowed": true,
  "requiredChecks": ["<check-name-or-empty-with-blocker-note>"],
  "deployTriggerDecision": "<align-with-default-branch-or-defer>",
  "secretEvidencePolicy": "<names-and-scope-only-no-secret-values>",
  "reviewPolicy": "<required-reviewers-or-manual-review-note>"
}
```

Placeholder, örnek domain veya sözlü "var" beyanı yeterli değildir.
Yanıt geldiğinde kabul/red kontrolü `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md` ile yapılır.

## Unblock Sonrası İlk Komutlar

Remote bilgisi yetkilendirildikten sonra implementation operatörü önce yalnız doğrulama yapar:

```bash
cd /Users/karaca/DEV/mimari/platform
git remote -v
gh repo view --json nameWithOwner,url,defaultBranchRef
gh run list --workflow ci.yml --limit 5
gh api repos/<owner>/<repo>/branches/<default-branch>/protection
```

`git remote add` veya remote değiştirme yalnız owner tarafından açıkça yetkilendirildiyse yapılır. Bu actionplan belgesi remote ekleme yetkisi değildir.

## Kabul Edilen Unblock Kanıtı

PR-01 blocker ancak şu kanıtlarla açılabilir:

- `git remote -v` gerçek remote gösterir.
- `gh repo view` gerçek `nameWithOwner`, URL ve default branch döndürür.
- Default branch ile local branch/deploy trigger çelişkisi belgelenir veya giderilir.
- Branch protection / required checks kanıtı alınır ya da erişim blocker'ı ayrı raporlanır.
- PR-01 branch/PR akışı başlatılabilir hale gelir.

Bu kanıtlar geldikten sonra bile PR-01 `verified` olmaz; yalnız implementation operatörü PR-01 CI baseline PR'ını açabilir hale gelir.
Owner yanıtı kabul edilse bile gerçek PR URL, merge SHA ve CI run URL gelmeden queue ilerlemez.

## Red Koşulları

Şu yanıtlar unblock sayılmaz:

- Remote URL placeholder veya örnek değer.
- Default branch belirsiz.
- `gh` erişimi yok ama blocker notu da yok.
- Branch protection erişimi yok ama required checks için varsayım yazılıyor.
- Secret değerleri paylaşılması isteniyor.
- PR-01 yerine tenant/authz/event/audit/capability/SDK/Customer işi öneriliyor.
- Product code değişikliği remote unblock önkoşulu gibi sunuluyor.

## Actionplan Etkisi

- `PR-01` queue item'ı `next-actionable` kalır.
- `PR-02` ve sonraki item'lar açılmaz.
- `platform-cicd` ve `platform-factory` node'ları bu unblock request ref'ini taşır.
- Bu dosya evidence değildir; yalnız owner input sözleşmesidir.
- Yazılım geliştirilmiş veya meta-framework tamamlanmış sayılmaz.
