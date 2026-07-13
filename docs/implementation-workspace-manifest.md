# Implementation Workspace Manifest

Sürüm: 1.1 - 2026-07-13
Durum: Kanonik

---

## Amaç

Bu doküman, actionplan görev exportlarının insan geliştirici için hangi implementation workspace'i hedeflediğini tanımlar. AI ajanları bu checkout'u yalnız `read-only-audit` modunda inceler; ürün kodunu yalnız insan geliştirici yazar (`human-developer-only`).

Bu manifest bir yönlendirme sözleşmesidir; actionplan üzerinde çalışan Codex/doc-maintainer için uygulama izni değildir. Doc-maintainer bu checkout'a geçip kernel, SDK, app-core, module veya app kodu yazmaz; yalnız workspace bilgisinin, stack sınırının, test komutlarının ve handoff beklentisinin doğru belgelenmesini sağlar.

Makine-okunur kaynak: `src/data/workspace-manifest.json`. Kanonik AI yazma yasağı: `docs/platform-product-code-write-prohibition-directive.md`.

---

## Birincil Workspace

| Alan | Değer |
|---|---|
| id | `platform` |
| ad | `Meta Platform` |
| rol | `primary-implementation-repo` |
| yerel yol | `/Users/karaca/DEV/mimari/platform` |
| repo durumu | `local-checkout-no-remote-configured` |
| varsayılan branch | `master` |
| çalışma branch deseni | `task/<task-id>-<slug>`; yalnız insan geliştirici oluşturur |
| AI erişimi | `read-only-audit` |
| ürün kodu yazarı | `human-developer-only` — yalnız insan geliştirici |

2026-07-08 salt-okunur doğrulamasında checkout mevcuttur, aktif branch `master` görünmüştür ve `git remote -v` boş dönmüştür. 2026-07-09 W0.1 audit sonucu `docs/platform-repo-reality-audit-2026-07-09.md` içinde belgelenmiştir. 2026-07-09 W0.2 readiness gap sonucu `docs/platform-cicd-readiness-gap-2026-07-09.md` içinde belgelenmiştir: CI/deploy workflow dosyaları yerelde vardır, fakat remote, branch protection ve CI run URL'si kanıtlanmış değildir. Bu checkout'ta uzak GitHub remote'u kanıtlanmadığı için exportlar repo URL'si uydurmaz. Bir ajan veya geliştirici bu bilgiyi değiştirmeden önce gerçek `git status --short --branch` ve `git remote -v` çıktısıyla doğrulamalıdır.

---

## Repo Kökleri

| Kök | Kullanım |
|---|---|
| `apps/api` | FastAPI + GraphQL backend |
| `apps/web` | Vite + React frontend |
| `packages/sdk` | Kernel public sözleşmelerinden türeyen typed SDK ve generator çıktıları |
| `packages/url-policy` | `@platform/url-policy`; ortak URL invariantları, contract, registry ve canonical generator primitive'leri. Genel SDK bunu tüketir, yeniden uygulamaz |
| `packages/ui` | Paylaşılan UI paketleri |
| `infra` | Altyapı ve çalışma ortamı dosyaları |

Task exportlarında `traceability.repoPath` boşsa kod yazmaya başlanmaz. Önce ilgili kök altında gerçek hedef yol belirlenir ve Evidence Patch veya plan verisi güncellenir.

Teknik teslim sırası için `docs/kernel-sdk-app-delivery-sequence.md` esas alınır: kernel hazır olmadan SDK, SDK hazır olmadan app-core, app-core hazır olmadan app module development başlatılmaz. Bu checkout'ta izlenecek wave/PR/evidence kuyruğu `docs/meta-framework-implementation-development-plan.md` içindedir.

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

Bu liste Agent Prompt ve Vobecoder Card exportlarında insan geliştirici hedefi olarak yer alır. AI ajanı görev metni aksini ima etse bile platforma yazamaz.

---

## Komutlar

Storybook notu: Storybook çalışma/publish komutları (yerel geliştirme, statik build, story interaction/a11y testleri, visual regression upload/compare, preview publish, component coverage raporu) **implementation reposu içinde yaşar** (`docs/storybook-implementation.md` §10); kesin yollar ve araç sürümleri implementation lockfile + ayrı toolchain ADR'siyle kilitlenir. actionplan yalnız sözleşmeyi tanımlar, komutları çalıştırmaz.

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
