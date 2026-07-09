# PR-01 Blocker Report Template — 2026-07-09

Durum: docs-only blocker report template
Queue item: `PR-01`
Related dispatch: `docs/platform-pr01-implementation-dispatch-2026-07-09.md`
Evidence intake: `docs/platform-pr01-evidence-intake-template-2026-07-09.md`
Remote verification evidence report template: `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md`
Agent pack: `docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
WBS node'ları: `platform-cicd`, `platform-factory`

Bu belge product code üretmez, remote yapılandırmaz ve PR-01'i kapatmaz. Amaç, PR-01 implementation operatörü stop koşuluna takılırsa uydurma PR/CI evidence yerine actionplan'a dönecek blocker paketini standartlaştırmaktır.

## Mevcut Salt-Okunur Gözlem

2026-07-09 kontrolünde `platform` checkout'u şu durumda görüldü:

| Kontrol | Sonuç |
|---|---|
| Yol | `/Users/karaca/DEV/mimari/platform` |
| Branch | `master` |
| Worktree | temiz |
| Remote | `git remote -v` boş |
| Workflow dosyaları | `.github/workflows/ci.yml`, `.github/workflows/deploy-backend.yml` mevcut |
| Kanıt durumu | PR URL, merge SHA, CI run URL, branch protection evidence yok |

Bu gözlem tek başına implementation blocker raporu değildir; operatör PR-01'e başlarken aynı komutları tekrar çalıştırır ve gerçek çıktıyı döner.
Bu gözlemin mevcut komut çıktılarıyla kayıtlı örneği `docs/platform-pr01-current-blocker-report-2026-07-09.md` dosyasındadır.

## Blocker Ne Zaman Yazılır?

Şu durumlardan biri varsa operatör product code'a ilerlemez:

- `git remote -v` boş veya gerçek GitHub remote göstermiyor.
- Default branch GitHub tarafında doğrulanamıyor.
- `gh run list --workflow ci.yml --limit 5` workflow/run bilgisi döndüremiyor.
- Branch protection / required checks endpoint'i erişilemiyor.
- Remote, branch veya GitHub permission bilgisi olmadan PR açılamıyor.
- Remote verification evidence report `blocked` veya `rejected-output` sınıflandırmasıyla dönüyor.
- PR-01 hedefi product feature kodu değiştirmeyi gerektiriyor gibi görünüyorsa.
- CI yeşili ancak test silme, `skip` veya zayıflatma ile mümkün oluyorsa.

## Zorunlu Blocker Alanları

Operatör blocker dönerse şu alanlar eksiksiz olmalıdır:

| Alan | Kabul kuralı |
|---|---|
| `blockerType` | `missing-remote`, `default-branch-unknown`, `ci-run-inaccessible`, `branch-protection-inaccessible`, `permission-blocker`, `workflow-trigger-mismatch` veya `scope-conflict` |
| `observedAt` | Tarih/saat ve timezone |
| `workspace` | `/Users/karaca/DEV/mimari/platform` |
| `branchEvidence` | `git status --short --branch` ve `git branch --show-current` çıktısı |
| `remoteEvidence` | `git remote -v` çıktısı; boşsa açıkça boş çıktıyı belirtir |
| `workflowEvidence` | `.github/workflows/ci.yml` ve `deploy-backend.yml` var/yok sonucu |
| `githubEvidence` | `gh repo view`, `gh run list` veya erişim hatası çıktısı |
| `remoteVerificationEvidenceReport` | Varsa `remote-verified`, `blocked` veya `rejected-output` sınıflandırma çıktısı |
| `proposedUnblocker` | Hangi insan/owner girdisi gerektiği |
| `noChangeStatement` | Product code, tests ve actionplan status ilerletilmedi beyanı |
| `nextAttemptCommand` | Blocker giderildikten sonra çalıştırılacak ilk komut |

## İlk Komut Seti

Operatör blocker raporu üretmeden önce şu komutları çalıştırır:

```bash
cd /Users/karaca/DEV/mimari/platform
git status --short --branch
git branch --show-current
git remote -v
find .github/workflows -maxdepth 1 -type f | sort
gh repo view --json nameWithOwner,url,defaultBranchRef
gh run list --workflow ci.yml --limit 5
```

`gh` komutları permission veya remote eksikliği nedeniyle çalışmıyorsa bu hata çıktısı blocker evidence olarak döner. Hata çıktısı yerine varsayılan repo URL'si yazılmaz.

## Blocker Rapor JSON Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "PR-01",
  "status": "blocked-on-implementation-input",
  "blockerReport": {
    "blockerType": "missing-remote",
    "observedAt": "<iso-or-local-timestamp>",
    "workspace": "/Users/karaca/DEV/mimari/platform",
    "branchEvidence": "<git-status-and-branch-output>",
    "remoteEvidence": "<git-remote-v-output>",
    "workflowEvidence": "<workflow-file-list>",
    "githubEvidence": "<gh-output-or-error>",
    "proposedUnblocker": "Repository owner must provide or authorize the real GitHub remote/default branch before PR-01 can proceed.",
    "noChangeStatement": "No product code, tests, generated actionplan status, or queue progression changed.",
    "nextAttemptCommand": "git remote -v && gh repo view --json nameWithOwner,url,defaultBranchRef"
  }
}
```

## Actionplan Writeback Kuralı

Blocker paketi kabul edilirse:

1. `PR-01` queue item'ı `verified` yapılmaz.
2. `PR-02` ve sonraki item'lar açılmaz.
3. `platform-cicd` traceability alanına gerçek blocker evidence linki eklenir.
4. `platform-factory` yalnız PR-01 dispatch/evidence zincirini etkilediği ölçüde güncellenir.
5. `npm run gen:reindex` ve `npm run qa:ci` geçmeden actionplan geri-yazımı tamam sayılmaz.

Blocker paketi kabul edilmezse operatöre eksik alan listesiyle geri döner; actionplan status ilerlemez.

## Red Koşulları

Şu blocker raporları reddedilir:

- Komut çıktısı yerine yorum içeriyor.
- Remote URL, PR URL veya CI URL uyduruyor.
- Product code diff'i olduğunu saklıyor.
- Testleri zayıflatma gereğini blocker yerine çözüm gibi sunuyor.
- `observedAt`, workspace veya branch kanıtı yok.
- PR-01 dışı tenant/authz/event/audit/capability/SDK/Customer işi öneriyor.

## Template Done Kapısı

Bu template actionplan tarafında tamam sayılırsa:

- PR-01 stop koşulu fake evidence'e dönüşmeden raporlanabilir.
- Dispatch, evidence intake ve queue JSON blocker template'ine bağlanmıştır.
- Mevcut gözlemde remote boşluğu görünür kalır.
- PR-01 hala gerçek remote/PR/CI evidence bekler.
- Yazılım geliştirilmiş veya meta-framework tamamlanmış sayılmaz.
