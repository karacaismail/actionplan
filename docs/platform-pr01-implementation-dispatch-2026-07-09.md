# PR-01 Implementation Dispatch — 2026-07-09

Durum: docs-only dispatch handoff
Next actionable item: `PR-01`
Agent pack: `docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md`
Implementation workspace: `/Users/karaca/DEV/mimari/platform`
Branch: `task/platform-cicd-ci-baseline`
WBS node'ları: `platform-cicd`, `platform-factory`

Bu belge product code üretmez. Amaç, 37 parçalık execution queue hazırlandıktan sonra implementation operatörünün sıradaki tek açılabilir işi yanlış sıraya sapmadan başlatması için tek sayfalık dispatch sözleşmesi vermektir.

## Queue Gerçeği

Şu anda açılabilir tek item `PR-01`dir. Diğer 36 item şu yüzden kapalıdır:

- `PR-02..PR-11`: PR-01 merge + CI evidence yok.
- `CUST-01..CUST-06`: PR-11 hello-platform verified yok.
- `W2-01..W2-06`: CUST-06 verified yok.
- `W3-01..W3-07`: W2-06 repeatability diff verified yok.
- `W4-01..W4-07`: W3-07 enterprise DoD verified yok.

Bu dispatch, blocked item'ları açmaz. Sırayı yalnız gerçek PR/CI/test/deploy evidence değiştirir.

## Operatörün Açacağı Dosyalar

Operatör `/Users/karaca/DEV/mimari/platform` içinde çalışmadan önce şu actionplan dosyalarını okur:

1. `docs/implementation-workspace-manifest.md`
2. `docs/platform-implementation-execution-queue-2026-07-09.md`
3. `reports/platform-implementation-execution-queue-2026-07-09.json`
4. `docs/platform-initial-11-pr-execution-handoff-2026-07-09.md`
5. `docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md`
6. `docs/evidence-update-runbook.md`
7. `docs/platform-pr01-evidence-intake-template-2026-07-09.md`
8. `docs/platform-pr01-blocker-report-template-2026-07-09.md`
9. `docs/platform-pr01-current-blocker-report-2026-07-09.md`
10. `docs/platform-pr01-remote-unblock-request-2026-07-09.md`
11. `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md`
12. `docs/platform-pr01-remote-verification-runbook-2026-07-09.md`
13. `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md`

Bu dosyalar implementation izni değil, scope ve evidence sınırıdır.

## İlk Komutlar

Operatör PR-01'i başlatırsa önce yalnız durum tespiti yapar:

```bash
cd /Users/karaca/DEV/mimari/platform
git status --short --branch
git remote -v
gh run list --workflow ci.yml --limit 5
```

`git remote -v` boşsa remote URL uydurulmaz. Blocker raporu üretilir ve PR-01 product code'a ilerlemez.
Mevcut `missing-remote` blocker'ını açmak için owner girdileri `docs/platform-pr01-remote-unblock-request-2026-07-09.md` içinde listelenmiştir.
Owner yanıtı geldiğinde kabul/red kontrolü `docs/platform-pr01-remote-unblock-response-intake-2026-07-09.md` ile yapılır.
Owner yanıtı kabul edilirse remote/default branch doğrulaması `docs/platform-pr01-remote-verification-runbook-2026-07-09.md` ile yürütülür.
Remote doğrulama çıktıları `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` formatıyla `remote-verified`, `blocked` veya `rejected-output` olarak sınıflandırılır.

## İzinli Değişiklik Sınırı

PR-01 yalnız CI/remote/default-branch baseline kapsamındadır:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-backend.yml`
- branch/default-branch uyumu
- CI run ve branch protection evidence
- rollback/manual-review notu

Şu alanlar PR-01 kapsamında değildir:

- tenant/authz/event/audit/capability/SDK kodu
- Customer, OrderOps, Inventory veya Product feature kodu
- database schema veya migration implementation
- UI/product surface geliştirmesi
- testleri silerek CI yeşili üretme

## Stop Koşulları

Şu koşullardan biri varsa operatör kod değişikliğini durdurur ve blocker evidence döner:

- `git remote -v` gerçek GitHub remote göstermiyor.
- Default branch bilinmiyor veya GitHub tarafında doğrulanamıyor.
- `gh run list --workflow ci.yml --limit 5` workflow bulunmadığını veya erişim olmadığını gösteriyor.
- Branch protection endpoint'i repo/permission nedeniyle okunamıyor.
- Değişiklik product code diff'i doğuruyor.

Stop koşulu actionplan'da `done` veya `verified` anlamına gelmez; yalnız PR-01'in neden açılamadığını belgeler.
Stop koşulu oluşursa operatör `docs/platform-pr01-blocker-report-template-2026-07-09.md` içindeki alanlarla blocker paketi döner; remote, PR URL veya CI URL uydurmaz.
Mevcut gözlemdeki remote boşluğu `docs/platform-pr01-current-blocker-report-2026-07-09.md` içinde komut çıktılarıyla kayıtlıdır.
Remote unblock owner girdisi gelmeden implementation operatörü remote eklemez, PR açmaz ve CI evidence uydurmaz.
Owner girdisi geldikten sonra da gerçek PR/CI evidence oluşmadan actionplan queue ilerlemez.
Remote verification geçse bile PR URL, merge SHA ve CI run URL oluşmadan PR-01 `verified` yapılmaz.
Remote verification raporu yalnız PR-01 CI baseline çalışmasına geçiş önkoşuludur; PR-01 completion evidence değildir.

## Geri Dönecek Kanıt Paketi

PR-01 tamamlanırsa operatör actionplan'a şu paketi döner:

- PR URL
- merge commit SHA
- CI run URL
- `git remote -v` kanıtı
- default branch kanıtı
- branch protection / required checks kanıtı
- test log veya CI summary
- rollback note
- manual-review note

Bu paket olmadan `platform-cicd` veya `platform-factory` node'larında `implementationStatus=verified` yazılmaz.

## Actionplan Writeback Sınırı

Actionplan geri-yazımı yalnız `docs/evidence-update-runbook.md` ile yapılır:

1. Gerçek PR merge edilir.
2. CI/deploy/smoke doğrulaması biter.
3. Remote verification output'u geldiyse önce `docs/platform-pr01-remote-verification-evidence-report-template-2026-07-09.md` ile sınıflandırılır.
4. `docs/platform-pr01-evidence-intake-template-2026-07-09.md` kabul/red kurallarına göre kanıt paketi doğrulanır; stop koşulu geldiyse `docs/platform-pr01-blocker-report-template-2026-07-09.md` alanlarıyla blocker olarak işlenir.
5. `src/data/generated/nodes/platform-cicd.json` ve gerekiyorsa `platform-factory.json` gerçek `refs`, `evidence`, `traceability` alanlarıyla güncellenir.
6. `npm run gen:reindex` çalışır.
7. `npm run qa:ci` yeşil geçer.
8. Queue JSON'da PR-01 `verified`, PR-02 `next-actionable` yapılır.

Bu dispatch dosyası tek başına evidence değildir. PR-01'i başlatır ama kapatmaz.

## Dispatch Done Kapısı

Bu dispatch actionplan tarafında tamam sayılırsa:

- 37 agent pack'in tamamı queue JSON'da bağlıdır.
- PR-01 tek `next-actionable` item olarak görünür.
- PR-01 operatör giriş dosyaları ve stop koşulları tek yerde yazılıdır.
- Product/meta-framework implementation yapılmamıştır.
- Gerçek PR/CI evidence olmadan hiçbir queue item ilerletilmemiştir.
