# ADR-0026 — Tech Profilleri: Frontend Stack'in Makine-Okunur, Şema-Bağlı, CI-Zorlamalı Kesinleştirilmesi

Statü: kabul · ADR-0025'i **genişletir** (supersede etmez). Kaynak doğrulaması: `platform/README.md`
(ürün stack'i = Vite+React19+TS+TanStack+Radix+**SCSS**, Next/Redux/Flowbite yasak) + `projector/tests/yasaklar.test.ts`.

## 1. Sorun (doğrulanmış)

Frontend stack üç yerde dağınık ve makine-okunur değil: çalışan kod (`package.json`), karar düğümleri
(`fe-locked`, `adr-0025`), ve docs. Üç ayrı repo var ve karıştırılıyordu: **`platform` = ürün**
(SCSS+Radix+TanStack, headless), `projector`/`actionplan` = **iç araçlar** (tooling, Tailwind/none).
Eksik olan: (a) tek makine-okunur manifest, (b) şemada tech-binding alanı, (c) çapraz-repo CI kapısı.
`antd`/MUI/Chakra şu an gerçek bağımlılık DEĞİL — bunlar **gelecekteki yasak-liste** maddesi.

## 2. Karar

- **KİLİT — tüm ürün frontend'i headless.** Stillenmiş bileşen kiti (antd, Ant Design Pro, MUI, Chakra,
  Mantine, Flowbite) ürüne giremez. Headless primitive = **Radix** çekirdek (+ React Aria zor-a11y'de).
- Tek doğruluk kaynağı = **`src/data/tech-profiles.json`** (manifest). "stack" sözcüğü ürün-Stack/Edition
  taksonomisiyle çakıştığı için isim **tech-profile**.
- Profiller (yüzey başına, archetype başına DEĞİL):
  - **saas-app** (ürün): React19+Vite+TS, Radix headless, **SCSS+token**, TanStack Router/Query/Table,
    RHF+Zod form, viz tembel (ECharts/deck.gl/React Flow).
  - **static-frontpage** (ilan/ürün/blog detay, sadece frontend): **Alpine.js** + TS + SCSS, React YOK.
  - **data-viz**: ECharts/deck.gl/React Flow tembel; AntV ancak yetmediğinde.
  - **tooling** (actionplan/projector): ürün değil → **Tailwind serbest**, yine headless + Next/Redux yasak.
- **Yasak global**: next, redux, @reduxjs/toolkit, flowbite, antd, @ant-design/pro-components,
  @mui/material, @chakra-ui/react, @mantine/core, react-markdown, markdown-it.

## 3. Teknoloji ↔ ilişki (bağlama modeli)

- Teknoloji **Surface seviyesinde** bağlanır: her Surface bir `techProfileRef` taşır (Faz 2,
  `SurfaceContractSchema`). ArcheType, Surface'ı `linkedSurfaces` ile miras alır; **archetype kendisi
  tech seçmez**. Sayfa = Surface; sayfanın teknolojisi = profili.
- Manifest `fe-tech-profiles` WBS düğümünde izlenir; `fe-locked` ona referans verir.

## 4. Sınırlar

- **TypeScript** = zemin/kilit (fallback değil, her şeyin altında).
- **SCSS** = ürün token sisteminin yazım dili (Tailwind ürün için değil; "utility yetmediğinde/istenmediğinde SCSS+token").
- **Alpine** = yalnız static-frontpage yüzeyi (SaaS app'te yok).
- **antd/Refine/MUI** = ürün/SDK'da yasak; bir distribution izole sınırında hız için kullanırsa kendi AAA'sını garanti eder, paylaşılan SDK'ya giremez.
- **Viz** = yalnız tembel-yüklü, ana pakete girmez.

## 5. Zorlama (enforcement)

- Birim: `tests/techProfiles.test.ts` (manifest şema + headless kilit + global yasak).
- CI (Faz 3): `tools/agents/check-tech-profile.mjs` — yasak-lib üç repoda taranır; her Surface geçerli
  `techProfileRef`; headless ihlali bloklar. `deploy.yml`'e bloklayıcı adım.

## 6. Unknown-unknowns

headless ≠ erişilebilir (Surface AAA-fallback bildirmeli) · "stack" kelime çakışması (tech-profile adı) ·
çapraz-repo yasak tek kapıda toplanmalı · form motoru kesinleşmemiş (RHF vs TanStack Form) ·
SSR/prerender × headless × Alpine hidrasyon sınırı.

## 7. Non-goals

Yeni antd tartışması (iptal). Araçları (actionplan/projector) SCSS'e zorlamak (tooling Tailwind serbest).
ADR-0025'i geçersiz kılmak (genişletir).
