# Implementation Workspace Manifest

Sürüm: 1.0 - 2026-07-08
Durum: Kanonik

---

## Amaç

Bu doküman, actionplan görev exportlarının hangi implementation workspace'e yönleneceğini tanımlar. actionplan uygulama kodu üretmez; geliştirici veya AI ajanı kod gerekiyorsa burada tanımlanan ayrı checkout'ta çalışır.

Makine-okunur kaynak: `src/data/workspace-manifest.json`

---

## Birincil Workspace

| Alan | Değer |
|---|---|
| id | `platform` |
| ad | `Meta Platform` |
| rol | `primary-implementation-repo` |
| yerel yol | `/Users/karaca/DEV/mimari/platform` |
| repo durumu | `local-checkout-no-remote-configured` |
| varsayılan branch | `main` |
| çalışma branch deseni | `task/<task-id>-<slug>` |

Bu checkout'ta uzak GitHub remote'u kanıtlanmadığı için exportlar repo URL'si uydurmaz. Bir ajan veya geliştirici bu bilgiyi değiştirmeden önce gerçek `git remote -v` çıktısıyla doğrulamalıdır.

---

## Repo Kökleri

| Kök | Kullanım |
|---|---|
| `apps/api` | FastAPI + GraphQL backend |
| `apps/web` | Vite + React frontend |
| `packages/sdk` | Kernel public sözleşmelerinden türeyen typed SDK ve generator çıktıları |
| `packages/ui` | Paylaşılan UI paketleri |
| `infra` | Altyapı ve çalışma ortamı dosyaları |

Task exportlarında `traceability.repoPath` boşsa kod yazmaya başlanmaz. Önce ilgili kök altında gerçek hedef yol belirlenir ve Evidence Patch veya plan verisi güncellenir.

Teknik teslim sırası için `docs/kernel-sdk-app-delivery-sequence.md` esas alınır: kernel hazır olmadan SDK, SDK hazır olmadan app-core, app-core hazır olmadan app module development başlatılmaz.

---

## Stack Sınırı

Backend:

- FastAPI
- GraphQL
- PostgreSQL
- SQLAlchemy 2.0
- SQLModel
- Alembic

Frontend:

- Vite
- React 19
- TypeScript
- TanStack Router
- Radix
- SCSS

Tooling:

- pnpm 9.12.3
- Python 3.12
- uv
- pytest
- Docker Compose

Yasak stack:

- Next.js
- Supabase
- Prisma
- Redux
- Flowbite

Bu liste Agent Prompt ve Vobecoder Card exportlarında doğrudan yer alır. Ajan, görev metni aksini ima etse bile bu sınırın dışına çıkamaz.

---

## Komutlar

Kurulum:

```bash
corepack enable
pnpm install
```

Backend testi:

```bash
cd apps/api
uv run --python 3.12 pytest -q
```

Frontend testleri:

```bash
pnpm test:tokens
pnpm test:smoke
pnpm test:surface
pnpm test:storefront
```

Lokal full-stack doğrulama:

```bash
make up
make health
```

Varsayılan doğrulama:

```bash
make test
pnpm test
```

Görev düzeyindeki `traceability.testCommand` bu varsayılanlardan daha spesifikse, geliştirici önce görev komutunu, sonra gerekiyorsa workspace varsayılan doğrulamasını çalıştırır.

---

## Evidence Beklentisi

Bir implementation görevi `done` sayılmadan önce aşağıdaki kanıtlar actionplan'a geri yazılır:

- `pull-request-url`
- `ci-run-url`
- `test-log`
- `manual-check-note`

Geri-yazma rehberi: `docs/evidence-update-runbook.md`

Evidence Patch exportu bu alanları doldurmak için taslak JSON patch üretir. Taslak, kanıtın yerine geçmez; gerçek PR, CI ve test çıktısı ile tamamlanmalıdır.
