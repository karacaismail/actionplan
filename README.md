# meta-framer — Stratejik WBS & Görev Yönetimi

**Proje adı:** `metaframer` · **Marka:** meta-framer · **Teknik sınıf:** meta-framework

**Alan adları:** [metaframer.net](https://metaframer.net) · [metaframer.com](https://metaframer.com)

Çok-ürünlü (28 app düğümü; hedef portföy 50+) AI-first SaaS framework'ünün **enterprise-grade
waterfall** geliştirme sürecini planlayan, WBS tabanlı stratejik eylem planı ve görev yönetimi çerçevesi.

- **Mimari:** Frontend-only, JSON-as-DB (tüm veri `src/data/generated/**.json`), `engine` JSON'u render eder.
- **Hiyerarşi (doğa metaforu, 7 seviye):** app(ada) → module(dağ) → archetype(kaya) → feature(taş) → component(kum) → work_unit(molekül) → micro_step(atom).
- **Her düğüm bir görevdir** ve bir WBS kırılımı + 17 üretim boyutu + 7 waterfall faz taşır.
- **Rol sınırı:** Bu repo proje/ürün kodu geliştirme yeri değildir. AI ajanları yalnız dokümantasyon, yönerge, gap raporu ve handoff kalitesini iyileştirir; platform ürün kodunu yalnız insan geliştirici yazar.
- **Platform yazma yasağı:** Codex, Claude, Cursor ve diğer AI ajanları platformda yalnız `read-only-audit` yapar; ürün kodu yazarı `human-developer-only`dır. Kanonik hüküm: `docs/platform-product-code-write-prohibition-directive.md`.
- **Stack (bu araç = tooling):** React 19 + Vite + TS, Tailwind + headless Radix (özel bileşenler; shadcn/ui değil), TanStack Router/Query/Table, React Hook Form, Zod, ECharts, React Flow (@xyflow) + ELK.js. **Ürün/platform stack'i AYRIDIR:** SCSS + CSS token, headless Radix, Tailwind YOK (bkz. ADR-0026).
- **Export/Import:** Görevler Raw JSON, Developer Brief, Agent Prompt, Evidence Patch ve Vobecoder Card olarak dışa aktarılır; CSV/JSON import-export ayrı PM veri akışını destekler.
- **URL politikası:** Kanonik gerekçe `docs/url-policy.md`, makine sözleşmesi `src/data/url-policy/registry.json`, standart `src/data/standards/url-policy.json`dır; generated corpus'un tamamı `standardRefs.urlPolicyRef = "url-policy"` bağını merkezi olarak miras alır.
- **URL implementation handoff:** `docs/url-policy-implementation-directive.md` + `src/data/url-policy/implementation-program.json` + `urlp-00`–`urlp-16` WBS atomları; `qa:url-policy-implementation` execution-ready bütünlüğünü bloklayıcı olarak doğrular.

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
