# Platform Repo Reality Audit — 2026-07-09

Durum: W0.1 salt-okunur audit tamamlandı
Kapsam: `/Users/karaca/DEV/mimari/platform`
İlgili WBS node: `platform-factory`

Bu rapor implementation kodu üretmez. Amaç, `docs/meta-framework-implementation-development-plan.md` içindeki W0.1 adımının gerçek checkout durumunu belgelemek ve code-start öncesi blocker'ları görünür yapmaktır.

## Özet

`platform` checkout'u yerelde mevcuttur ve çalışma ağacı temizdir. Ancak `git remote -v` boş döndüğü için GitHub remote, PR akışı, branch protection ve CI run URL'si kanıtlanmış değildir. Bu nedenle implementation coding agent'a ürün kodu görevi verilmeden önce remote/CI gerçekliği tamamlanmalıdır.

## Salt-Okunur Bulgular

| Kontrol | Sonuç |
|---|---|
| Yerel yol | `/Users/karaca/DEV/mimari/platform` |
| Git branch | `master` |
| Git worktree | temiz |
| Git remote | boş; remote kanıtı yok |
| Root package | `package.json` mevcut, `name=meta-platform`, `packageManager=pnpm@9.12.3` |
| Workspace | `pnpm-workspace.yaml` mevcut |
| Backend | `apps/api` mevcut; FastAPI + Strawberry GraphQL + pytest |
| Frontend | `apps/web` mevcut; Vite + React 19 + TanStack Router + Radix |
| Shared UI | `packages/ui` mevcut; token testleri var |
| Infra | `infra/docker-compose.yml`, `infra/.env.example`, deploy README'leri mevcut |
| Docker stack | PostgreSQL 16 + API service; Redis/S3 bilinçli olarak yok |
| CI/CD workflow | `.github/workflows/ci.yml` ve `.github/workflows/deploy-backend.yml` mevcut; run URL'si remote olmadığı için kanıtlanmadı |

## Mevcut Test Komutları

Root `package.json`:

```bash
pnpm test
pnpm test:tokens
pnpm test:smoke
pnpm test:surface
pnpm test:storefront
```

Root `Makefile`:

```bash
make up
make health
make test
```

Backend `apps/api/README.md` ve `Makefile`:

```bash
cd apps/api
uv run --python 3.12 pytest -q
```

Frontend `apps/web/package.json`:

```bash
pnpm --filter @platform/web run test
pnpm --filter @platform/web run test:smoke
pnpm --filter @platform/web run test:surface
pnpm --filter @platform/web run test:storefront
pnpm --filter @platform/web run e2e
```

UI package `packages/ui/package.json`:

```bash
pnpm --filter @platform/ui run test
pnpm --filter @platform/ui run test:tokens
```

## Code-Start Durumu

Code-start için no-go:

- GitHub remote kanıtı yok.
- CI workflow/run URL'si kanıtı yok.
- Branch protection veya PR review politikası kanıtı yok.
- `platform-factory` node'unda `traceability.repoPath` ve `traceability.testCommand` hâlâ boş tutulmalıdır; bu alanlar remote/CI ve hedef path kesinleşmeden sahte doldurulmaz.

Bu durum plan eksikliği değil, implementation repo bootstrap blocker'ıdır. Sıradaki doğru iş `platform-cicd` / PR-01 kapsamına remote + CI baseline kanıtının eklenmesidir. W0.2 ayrıntısı `docs/platform-cicd-readiness-gap-2026-07-09.md` içinde tutulur.

## Actionplan Etkisi

- `platform-factory` refs listesine bu rapor eklenir.
- `platform-factory` `status`, `phase`, `evidence`, `traceability.repoPath`, `traceability.testCommand` ve `implementationStatus` alanları ilerletilmez.
- Evidence ancak gerçek PR/CI/test/deploy çıktısı oluştuğunda `docs/evidence-update-runbook.md` ile geri yazılır.
