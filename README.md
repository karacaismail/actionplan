# Eylem Planı — Stratejik WBS & Görev Yönetimi

Çok-ürünlü (28 app düğümü; hedef portföy 50+) AI-first SaaS framework'ünün **enterprise-grade
waterfall** geliştirme sürecini planlayan, WBS tabanlı stratejik eylem planı ve görev yönetimi çerçevesi.

- **Mimari:** Frontend-only, JSON-as-DB (tüm veri `src/data/generated/**.json`), `engine` JSON'u render eder.
- **Hiyerarşi (doğa metaforu, 7 seviye):** app(dağ) → module(kaya) → archetype(büyük taş) → stone(orta taş) → molecule(küçük taş) → element(toz) → atom.
- **Her düğüm bir görevdir** ve bir WBS kırılımı + 14 üretim boyutu + 7 waterfall faz taşır.
- **Stack (bu araç = tooling):** React 19 + Vite + TS, Tailwind + headless Radix (özel bileşenler; shadcn/ui değil), TanStack Router/Query/Table, React Hook Form, Zod, ECharts, React Flow (@xyflow) + ELK.js. **Ürün/platform stack'i AYRIDIR:** SCSS + CSS token, headless Radix, Tailwind YOK (bkz. ADR-0026).
- **Export/Import:** Görevler JSON ve CSV olarak dışa/içe aktarılabilir.

## Dokümanlar

Tüm kanonik dokümanların kategorili dizini: **[docs/README.md](docs/README.md)** — ADR'ler, sözleşmeler, mühendislik standartları (ADR-0027), planlar/yol haritaları, rehberler/runbook'lar, denetim & boşluk raporları.

## Komutlar

| Komut | İş |
|---|---|
| `npm run ingest` | Eski korpusları (oldatas + content-source) parse edip `src/data/generated` üretir |
| `npm run dev` | Geliştirme sunucusu |
| `npm run typecheck` | TS tip denetimi |
| `npm test` | Vitest (şema, veri bütünlüğü, engine) |
| `npm run test:e2e` | Playwright + axe (AAA) |
| `npm run build` | ingest → typecheck → vite build → SPA 404 |

## Test-önce

Geliştirme test-önce yürür: önce şema + veri-bütünlüğü testleri, sonra engine birim
testleri, sonra E2E/erişilebilirlik. Bkz. `tests/`.

## Yayın

`main`'e push → GitHub Actions → GitHub Pages (`/actionplan/`).
