# Platform CI/CD Readiness Gap — 2026-07-09

Durum: W0.2 salt-okunur readiness gap kaydı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-cicd`

Bu rapor implementation kodu üretmez. Amaç, W0.2 `platform-cicd` adımının gerçek checkout'taki CI/CD yüzeyini belgelemek ve code-start öncesi eksik kanıtları görünür yapmaktır.

## Özet

`platform` checkout'unda CI/CD dosyaları mevcuttur: `.github/workflows/ci.yml` ve `.github/workflows/deploy-backend.yml`. Bu nedenle eksik "workflow dosyası yok" değildir. Eksik olan, bu workflow'ların uzak GitHub reposunda çalıştığını gösteren remote, branch policy, CI run URL'si, secrets varlık kanıtı ve deploy/rollback smoke kanıtıdır.

Yerel checkout `master` branch'indedir; deploy workflow'u ise yalnız `main` branch push'unda çalışacak şekilde tanımlıdır. Bu branch sözleşmesi netleştirilmeden CI/CD done sayılamaz.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Yerel yol | `/Users/karaca/DEV/mimari/platform` |
| Git branch | `master` |
| Git worktree | temiz |
| Git remote | boş; remote/PR/CI run kanıtı yok |
| CI workflow | `.github/workflows/ci.yml` mevcut |
| Deploy workflow | `.github/workflows/deploy-backend.yml` mevcut |
| Root test script | `pnpm test`, `pnpm test:tokens`, `pnpm test:smoke`, `pnpm test:surface`, `pnpm test:storefront` |
| Makefile test | `make test` -> `cd apps/api && uv run --python 3.12 pytest -q` |

## Mevcut CI Davranışı

`.github/workflows/ci.yml`:

- `push` ve `pull_request` olaylarında tetiklenir.
- Backend job PostgreSQL 16 service ile çalışır.
- Backend adımları: `ruff check`, `pyright`, `pytest -q`, `docker build apps/api`.
- `pyright` adımı `continue-on-error: true` olduğu için tip kontrolü henüz bloklayıcı değildir.
- Frontend adımları: pnpm 9, Node 20, `pnpm install --frozen-lockfile=false`, `pnpm -r --if-present test`.

`.github/workflows/deploy-backend.yml`:

- Yalnız `main` branch push'unda tetiklenir.
- GHCR'a API image push eder.
- `SERVER_HOST`, `SSH_KEY`, `GHCR_TOKEN` secret isimlerini bekler.
- SSH ile `~/platform` altında `docker compose -f infra/docker-compose.yml pull api` ve `up -d api` çalıştırır.

## Code-Start Blocker'ları

- `git remote -v` boş; GitHub remote ve PR akışı kanıtlanmış değil.
- CI workflow dosyaları yerelde var ama run URL'si yok.
- Branch sözleşmesi çelişkili: checkout `master`, deploy trigger `main`.
- Branch protection, required checks ve review policy kanıtı yok.
- Deploy secret değerleri değil, yalnız varlık/scope kanıtı gerekiyor; bu kanıt yok.
- Rollback smoke veya başarısız deploy senaryosu kanıtı yok.
- `pyright` bloklayıcı değil; bu bilinçli geçici waiver ise actionplan'a açıkça yazılmalı, değilse W0.2 kapsamında bloklayıcı hale getirilmeli.

## PR-01 / W0.2 Çıkış Eşiği

İlk implementation PR'ı ürün özelliği yazmamalıdır. Çıkış eşiği:

- GitHub remote eklenmiş ve `git remote -v` çıktısıyla kanıtlanmış.
- Varsayılan branch ile deploy trigger branch'i hizalanmış.
- `.github/workflows/ci.yml` pull request üzerinde çalışmış ve CI run URL'si üretilmiş.
- Required checks ve branch protection ekranı veya API çıktısı kanıtlanmış.
- Backend ve frontend test komutları CI içinde bloklayıcı çalışmış.
- Deploy workflow için required secret isimleri ve ortam ayrımı belgelenmiş.
- Rollback/smoke komutu veya runbook'u deploy evidence formatına bağlanmış.

## Actionplan Etkisi

- `platform-cicd` refs listesine bu rapor eklenir.
- `platform-cicd` `status`, `phase`, `evidence` ve `implementationStatus` alanları ilerletilmez.
- `traceability.repoPath` ve `traceability.testCommand`, yalnız handoff hedefini gösterecek şekilde doldurulabilir; bu alanlar completion kanıtı değildir.
- Evidence ancak gerçek PR/CI/test/deploy çıktısı oluştuğunda `docs/evidence-update-runbook.md` ile geri yazılır.
