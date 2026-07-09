# PR-01 Remote Unblock Response Intake — 2026-07-09

Durum: docs-only owner response intake
Queue item: `PR-01`
Remote unblock request: `docs/platform-pr01-remote-unblock-request-2026-07-09.md`
Current blocker: `docs/platform-pr01-current-blocker-report-2026-07-09.md`
Blocker type: `missing-remote`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
WBS node'ları: `platform-cicd`, `platform-factory`

Bu belge product code üretmez, Git remote eklemez, PR açmaz ve PR-01'i kapatmaz. Amaç, owner veya yetkili operatör `docs/platform-pr01-remote-unblock-request-2026-07-09.md` formatıyla yanıt döndüğünde bu yanıtın actionplan tarafında nasıl kabul/red edileceğini kilitlemektir.

## Intake Amacı

Owner yanıtı şu soruyu kanıtla cevaplamalıdır:

> PR-01 operatörü gerçek GitHub remote ve default branch üzerinde güvenli biçimde CI baseline PR'ı açabilir mi?

Yanıt yalnız gerçek remote URL, default branch, izin ve policy kanıtlarıyla kabul edilir. Placeholder, örnek domain veya sözlü onay kabul edilmez.

## Zorunlu Yanıt Alanları

| Alan | Kabul kuralı |
|---|---|
| `remoteUrl` | Gerçek GitHub remote URL; placeholder veya örnek domain olamaz |
| `remoteName` | `origin` veya kullanılacak gerçek remote adı |
| `defaultBranch` | GitHub default branch adı; `master`/`main` çelişkisi açık kapatılır |
| `prBranchAllowed` | `task/platform-cicd-ci-baseline` branch'i için açık izin |
| `actionsReadAllowed` | `gh run list --workflow ci.yml --limit 5` için repo/actions read izni |
| `branchProtectionReadAllowed` | Branch protection / required checks kanıtı okuma izni veya erişim blocker notu |
| `requiredChecks` | Zorunlu check listesi ya da henüz yoksa açık policy blocker notu |
| `deployTriggerDecision` | `deploy-backend.yml` default branch ile hizalanacak mı, yoksa PR-01 dışında mı kalacak |
| `secretEvidencePolicy` | Secret değerleri değil, yalnız isim/scope kanıtı nasıl verilecek |
| `reviewPolicy` | PR-01 için insan review, CODEOWNER veya manual-review notu |

## Kabul Koşulları

Owner yanıtı ancak şu koşullarda kabul edilir:

- `remoteUrl` gerçek GitHub repo adresidir.
- `defaultBranch` tek değer olarak belirtilmiştir.
- Local `master` ile remote default branch farkı varsa nasıl hizalanacağı yazılmıştır.
- `actionsReadAllowed` ve branch protection erişimi gerçek komutla doğrulanabilir durumdadır veya erişim eksikliği ayrı blocker olarak belirtilmiştir.
- Required checks için varsayım değil, gerçek policy veya açık eksik-policy blocker'ı vardır.
- Secret değerleri paylaşılmaz; yalnız secret isimlerinin/scope'unun nasıl kanıtlanacağı tarif edilir.
- PR-01 kapsamı yalnız remote/default branch/CI baseline ile sınırlıdır.

## Red Koşulları

Aşağıdakilerden biri varsa yanıt reddedilir:

- Remote URL boş, placeholder veya owner/repo bilinmiyor.
- Default branch belirsiz ya da local/remote branch çelişkisi göz ardı ediliyor.
- `gh` erişimi yokken CI/branch protection varmış gibi yazılıyor.
- Required checks listesi yok ve blocker notu da yok.
- Secret değerleri isteniyor veya paylaşılıyor.
- Product feature, tenant/authz/event/audit/capability/SDK/Customer işi PR-01 unblock önkoşulu gibi sunuluyor.
- Remote ekleme veya PR açma yetkisi belgesiz varsayılıyor.

## Kabul Edilirse Sonraki Adım

Yanıt kabul edilirse actionplan yalnız şu kapıyı açar:

1. PR-01 operatörü `/Users/karaca/DEV/mimari/platform` içinde remote/default branch doğrulama komutlarını çalıştırabilir.
2. `docs/platform-pr01-remote-verification-runbook-2026-07-09.md` içindeki komutlarla `git remote -v`, `gh repo view`, `gh run list` ve branch protection evidence tekrar alınır.
3. Yeni remote verification çıktıları `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` ile `remote-verified`, `blocked` veya `rejected-output` olarak sınıflandırılır.
4. Sınıflandırma `remote-verified` ise PR-01 CI baseline çalışması başlayabilir; gerçek PR/CI paketi ayrıca `docs/platform-pr01-evidence-intake-template-2026-07-09.md` kabul/red kurallarına gider.
5. PR-01 hala `verified` olmaz; gerçek PR URL, merge SHA ve CI run URL gelmeden queue ilerlemez.

## Queue Etkisi

- `PR-01` `next-actionable` kalır.
- `PR-02` `blocked` kalır.
- `remoteUnblockRequests.status` yalnız owner cevabı beklediğini gösterir.
- `remoteUnblockResponseIntakes.status` bu dosyanın hazır olduğunu gösterir.
- Bu dosya implementation evidence değildir.

## Intake JSON Taslağı

Gerçek owner yanıtı gelmeden uygulanmaz:

```json
{
  "id": "PR-01",
  "remoteUnblockResponse": {
    "status": "accepted-or-rejected",
    "remoteUrl": "<real-github-remote-url>",
    "remoteName": "origin",
    "defaultBranch": "<main-or-master-or-other>",
    "actionsReadAllowed": true,
    "branchProtectionReadAllowed": true,
    "requiredChecks": ["<check-name>"],
    "reviewPolicy": "<manual-review-or-codeowner-note>",
    "decisionNote": "<why-accepted-or-rejected>"
  }
}
```

## Done Kapısı

Bu intake dosyası actionplan tarafında tamam sayılırsa:

- Owner remote unblock yanıtının kabul/red kuralları tek yerde yazılıdır.
- Queue JSON ve ilgili WBS node'ları bu intake ref'ini taşır.
- Kabul sonrası doğrulama runbook'u `docs/platform-pr01-remote-verification-runbook-2026-07-09.md` ile bağlıdır.
- Remote verification çıktıları `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` ile sınıflandırılır.
- PR-01 hala gerçek owner yanıtı ve PR/CI evidence bekler.
- Yazılım geliştirilmiş veya meta-framework tamamlanmış sayılmaz.
