# PR-01 CI Baseline Agent Pack — 2026-07-09

Durum: docs-only implementation agent pack
Queue item: `PR-01`
Branch: `task/platform-cicd-ci-baseline`
WBS node'ları: `platform-cicd`, `platform-factory`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`

Bu belge product code üretmez. Amaç, execution queue'da tek `next-actionable` item olan PR-01'i implementation operatörünün Claude Code/Cursor/Aider gibi bir kod ajanına verebileceği sıkı prompt ve evidence sözleşmesine dönüştürmektir.

## Amaç

PR-01'in tek amacı remote/default-branch/CI baseline kanıtı üretmektir:

- `platform` reposunda gerçek GitHub remote doğrulanır veya yapılandırılır.
- Default branch tek isimle kilitlenir (`main` veya mevcut gerçek branch).
- `.github/workflows/ci.yml` gerçek remote branch üzerinde çalışır.
- Deploy workflow trigger'ı default branch ile çelişmez.
- İlk CI run URL'si actionplan'a geri yazılabilir hale gelir.
- Branch protection / required checks evidence alınır.

## Non-Goal

PR-01 şunları yapmaz:

- Product feature kodu yazmaz.
- Tenant/authz/event/audit/capability/SDK/Customer kodu başlatmaz.
- CI kapısını yeşil göstermek için testleri silmez veya zayıflatmaz.
- Uzak GitHub repo URL'si uydurmaz.
- `main` veya `master` branch'e doğrudan product code push etmez.

## Agent Prompt

Implementation operatörü aşağıdaki prompt'u `/Users/karaca/DEV/mimari/platform` içinde kullanır:

```text
Görev: PR-01 CI Baseline.

Workspace: /Users/karaca/DEV/mimari/platform
Branch: task/platform-cicd-ci-baseline
WBS nodes: platform-cicd, platform-factory

Amaç:
1. Gerçek git remote durumunu doğrula.
2. Default branch adını gerçek repo durumuna göre tekilleştir.
3. .github/workflows/ci.yml ve deploy-backend.yml trigger/default-branch çelişkilerini gider.
4. CI baseline'ın gerçek remote üzerinde çalışmasını sağla.
5. İlk CI run URL, branch protection evidence ve rollback note üret.

Mutlak sınırlar:
- Product feature kodu yazma.
- Tenant/authz/event/audit/capability/SDK/Customer koduna dokunma.
- Next.js, Supabase, Prisma, Redux, Flowbite ekleme.
- Testleri silerek veya zayıflatarak CI yeşili üretme.
- Uzak repo URL'si uydurma; git remote -v boşsa bunu blocker/evidence olarak raporla ve gerçek remote bilgisi olmadan remote set etme.
- main/master'a doğrudan push etme; branch üzerinde PR aç.

Önce kırmızı/eksik evidence'i göster:
- git status --short --branch
- git remote -v
- default branch / workflow trigger uyumu
- gh run list --workflow ci.yml --limit 5
- branch protection API sonucu

Beklenen değişiklikler:
- Yalnız CI/branch/remote baseline için gereken repo konfigürasyonu ve dokümantasyon.
- Gerekiyorsa deploy workflow trigger'ının gerçek default branch ile hizalanması.
- PR açıklamasında test/evidence/rollback/manual-review bölümleri.

Zorunlu doğrulama:
git status --short --branch
git remote -v
gh run list --workflow ci.yml --limit 5
gh api repos/<owner>/<repo>/branches/<default-branch>/protection

Çıkış:
- PR URL
- CI run URL
- branch protection evidence
- default branch evidence
- rollback note
- manual-review note
```

## Operator Checklist

PR açmadan önce:

- [ ] `git status --short --branch` alındı.
- [ ] `git remote -v` gerçek URL gösteriyor.
- [ ] Default branch adı tekilleştirildi.
- [ ] CI workflow default branch üzerinde tetikleniyor.
- [ ] Deploy workflow trigger'ı default branch ile uyumlu.
- [ ] Product code diff'i yok.
- [ ] PR body evidence checklist içeriyor.

PR merge sonrası:

- [ ] CI run URL alındı.
- [ ] Branch protection evidence alındı.
- [ ] Merge commit SHA alındı.
- [ ] Rollback note yazıldı.
- [ ] Actionplan evidence patch hazırlandı.

## Evidence Patch Taslağı

Gerçek değerler gelmeden uygulanmaz:

```json
{
  "id": "platform-cicd",
  "refs": [
    "docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md",
    "pr:<real-pr-url>",
    "commit:<merge-commit-sha>",
    "ci:<github-actions-run-url>",
    "branch-protection:<api-or-screenshot-ref>"
  ],
  "evidence": [
    "PR-01 CI baseline geçti: <github-actions-run-url>",
    "Default branch doğrulandı: <main-or-master>; evidence:<ref>",
    "Branch protection doğrulandı: <ref>",
    "Rollback note: CI/default-branch değişikliği revert edilebilir; product code değişmedi"
  ],
  "traceability": {
    "implementationStatus": "verified"
  }
}
```

## PR-01 Done Kapısı

PR-01 ancak şu koşullarla kapanır:

- Remote gerçek ve doğrulanmış.
- CI gerçek remote üzerinde yeşil koşmuş.
- Default branch ve workflow trigger'ları çelişmiyor.
- Branch protection / required checks evidence var.
- `platform-cicd` ve `platform-factory` node'larına PR/CI/evidence geri yazılmış.

Bu done kapısı kapanmadan PR-02 başlamaz.
