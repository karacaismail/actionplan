# PR-01 Remote Verification Evidence Report Template — 2026-07-09

Durum: docs-only remote verification evidence report template
Queue item: `PR-01`
Remote verification runbook: `docs/platform-pr01-remote-verification-runbook-2026-07-09.md`
Remote unblock response intake: `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md`
Evidence intake: `docs/platform-pr01-evidence-intake-template-2026-07-09.md`
Blocker report template: `docs/platform-pr01-blocker-report-template-2026-07-09.md`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
WBS node'ları: `platform-cicd`, `platform-factory`

Bu belge product code üretmez, Git remote eklemez, PR açmaz, CI çalıştırmaz ve PR-01'i kapatmaz. Amaç, owner yanıtı kabul edildikten sonra `docs/platform-pr01-remote-verification-runbook-2026-07-09.md` komutlarından dönen çıktının actionplan tarafında nasıl raporlanacağını ve hangi kapıya yönlendirileceğini standartlaştırmaktır.

## Önkoşul

Bu template yalnız şu koşullar sağlandığında kullanılır:

- Owner yanıtı `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md` kurallarına göre kabul edilmiştir.
- Remote/default branch doğrulama komutları `docs/platform-pr01-remote-verification-runbook-2026-07-09.md` sırasıyla çalıştırılmıştır.
- Komut çıktıları gerçek output, URL, hata veya permission blocker olarak saklanmıştır.

Bu koşullar yoksa rapor üretilmez; `missing-remote` blocker açık kalır.

## Zorunlu Rapor Alanları

| Alan | Kabul kuralı |
|---|---|
| `observedAt` | Tarih/saat ve timezone |
| `workspace` | `/Users/karaca/DEV/mimari/platform` |
| `operator` | Doğrulamayı yapan kişi/ajan |
| `ownerResponseRef` | Kabul edilen owner yanıtı veya intake karar linki |
| `runbookRef` | `docs/platform-pr01-remote-verification-runbook-2026-07-09.md` |
| `gitStatusOutput` | `git status --short --branch` çıktısı |
| `remoteEvidence` | `git remote -v` çıktısı ve owner yanıtındaki remote URL ile eşleşme kararı |
| `repoViewEvidence` | `gh repo view --json nameWithOwner,url,defaultBranchRef` çıktısı |
| `ciWorkflowAccessEvidence` | `gh run list --workflow ci.yml --limit 5` çıktısı veya erişim blocker'ı |
| `branchProtectionEvidence` | Branch protection API çıktısı, required checks listesi veya permission blocker'ı |
| `defaultBranchDecision` | Local branch ile GitHub default branch hizası veya migration kararı |
| `deployTriggerDecision` | `deploy-backend.yml` trigger hizası ya da PR-01 dışına erteleme kararı |
| `productCodeDiffCheck` | Remote verification sırasında product code diff'i oluşmadığını gösteren durum |
| `classification` | `remote-verified`, `blocked`, `rejected-output` |
| `nextStep` | PR-01 CI baseline branch'e geç, blocker raporu üret veya owner yanıtını tekrar iste |

## Remote Verified Kuralı

`classification=remote-verified` ancak şu koşulların tamamı sağlanırsa yazılır:

- `git remote -v` gerçek GitHub remote'u gösterir ve owner yanıtındaki canonical URL ile eşleşir.
- `gh repo view` gerçek repo, URL ve tek default branch döndürür.
- Default branch ile local branch/PR branch stratejisi çelişkisizdir.
- `ci.yml` workflow erişimi doğrulanır veya açık policy kararıyla erişim blocker'ı PR-01 dışına ayrılmıştır.
- Branch protection/required checks kanıtı vardır veya permission blocker'ı açıkça ayrı rapora yönlendirilmiştir.
- Remote verification sırasında product code, test veya actionplan queue status diff'i oluşmamıştır.

Bu sınıflandırma PR-01'i `verified` yapmaz. Yalnız PR-01 CI baseline branch çalışmasına geçiş için önkoşul kanıtıdır.

## Blocked Kuralı

Şu koşullardan biri varsa `classification=blocked` yazılır ve `docs/platform-pr01-blocker-report-template-2026-07-09.md` formatı kullanılır:

- Remote URL owner yanıtıyla eşleşmiyor.
- `gh repo view` repo/default branch bilgisini döndürmüyor.
- CI workflow erişimi yok ve kabul edilebilir blocker notu yok.
- Branch protection/required checks erişilemiyor ve permission blocker notu yok.
- Local/remote default branch kararı çelişkili.
- Remote verification sırasında product code diff'i oluşuyor.

## Rejected Output Kuralı

Şu çıktılar actionplan tarafından kanıt olarak kabul edilmez:

- Placeholder remote, PR, CI veya branch protection URL'si.
- Komut çıktısı yerine yorum, özet veya varsayım.
- Secret değerleri.
- PR-01 dışı tenant/authz/event/audit/capability/SDK/Customer kapsamına geçen öneri.
- Queue status'u gerçek PR/CI evidence olmadan ilerleten patch.

## Report JSON Taslağı

Gerçek komut çıktıları gelmeden uygulanmaz:

```json
{
  "id": "PR-01",
  "remoteVerificationEvidenceReport": {
    "classification": "remote-verified-or-blocked-or-rejected-output",
    "observedAt": "<timestamp-with-timezone>",
    "workspace": "/Users/karaca/DEV/mimari/platform",
    "operator": "<person-or-agent>",
    "ownerResponseRef": "<accepted-owner-response-ref>",
    "runbookRef": "docs/platform-pr01-remote-verification-runbook-2026-07-09.md",
    "gitStatusOutput": "<git-status-output-ref>",
    "remoteEvidence": "<git-remote-v-output-ref>",
    "repoViewEvidence": "<gh-repo-view-output-ref>",
    "ciWorkflowAccessEvidence": "<gh-run-list-output-or-blocker-ref>",
    "branchProtectionEvidence": "<gh-api-output-or-permission-blocker-ref>",
    "defaultBranchDecision": "<aligned-or-migration-decision>",
    "deployTriggerDecision": "<aligned-or-deferred>",
    "productCodeDiffCheck": "<no-product-code-diff-ref>",
    "nextStep": "<continue-pr01-ci-baseline-or-return-blocker>"
  }
}
```

## Routing

Rapor kabul edildiğinde actionplan şu şekilde yönlendirir:

- `remote-verified`: PR-01 operatörü yalnız CI baseline branch çalışmasına geçebilir; gerçek PR URL, merge SHA ve CI run URL oluşmadan `docs/platform-pr01-evidence-intake-template-2026-07-09.md` PR-01'i kabul etmez.
- `blocked`: `docs/platform-pr01-blocker-report-template-2026-07-09.md` ile blocker raporu döner; PR-01 `next-actionable`, PR-02 `blocked` kalır.
- `rejected-output`: Owner yanıtı veya komut output'u tekrar istenir; queue ilerlemez.

## Queue Etkisi

- Bu template hazır olsa bile `PR-01` `next-actionable` kalır.
- `PR-02` `blocked` kalır.
- Remote verification evidence, PR/merge/CI evidence yerine geçmez.
- Yazılım geliştirilmiş veya meta-framework tamamlanmış sayılmaz.

## Done Kapısı

Bu template actionplan tarafında tamam sayılırsa:

- Remote verification çıktı raporu için kabul/red sınıflandırması tek dosyada yazılıdır.
- Runbook, response intake, evidence intake ve blocker report zinciri birbirine bağlıdır.
- Queue JSON ve ilgili WBS node'ları bu template ref'ini taşır.
- Gerçek remote, PR, CI veya deploy evidence oluşmuş gibi davranılmaz.
