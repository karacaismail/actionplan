# Repo Gerçeklik Denetim Raporu

**Tarih:** 2026-06-28  
**Denetçi:** senior platform/repo denetçisi (salt-okunur inceleme)  
**Kapsam:** karacaismail/actionplan — tek repo  
**Doğrulama yöntemi:** git log, cat, node -e (jq eşdeğeri), dosya okuma; kod/veri değiştirilmedi, commit yapılmadı.

> Güncel kullanım notu (2026-07-08): Bu rapor tarihsel bir repo snapshot'ıdır. Güncel implementation workspace otoritesi `implementation-workspace-manifest.md` ve makine-okunur `src/data/workspace-manifest.json` dosyalarıdır. Bugünkü doğrulanmış gerçek: actionplan içinde `app-platform-horizontal` bir WBS kümesidir; ayrıca yerelde `/Users/karaca/DEV/mimari/platform` adında ayrı bir implementation checkout'u vardır, branch'i `master` ve remote'u yoktur. Bu iki gerçek çelişmez: actionplan plan/sözleşme katmanıdır, platform checkout'u ise geliştirici veya implementation ajan operatörünün kod yazacağı ayrı alandır.

---

## 1. Bu repo ne işe yarıyor?

`actionplan`, 50+ (README'de "70+") ürünlük bir AI-first SaaS framework'ünün **enterprise-grade waterfall geliştirme sürecini planlayan** WBS tabanlı bir görev yönetimi aracıdır. Uygulamaların kaynak kodu burada değildir; bu repo, o uygulamaların **ne zaman, hangi sırayla, hangi kapıları geçerek** yapılacağını tarif eden düğümleri (467 adet) tutar.

Mimari olarak frontend-only, JSON-as-DB bir SPA'dır. Veri kaynağı `public/data/nodes.json` (467 düğüm; build sonrası `dist/data` kopyası da oluşur) ve `src/data/generated/nodes/*.json` (her düğüm ayrı dosya). Şema tek kaynak `src/schemas/task.ts` — Zod ile tanımlı, TS tipleri buradan türetiliyor.

2026-06-28 denetiminde GitHub remote'u olan ayrı bir `platform` reposu kanıtlanamamıştı. 2026-07-08 itibarıyla bu ifade implementation workspace kararı olarak okunmamalıdır. Güncel ayrım şudur:

- `app-platform-horizontal` actionplan içindeki WBS kümesidir; platform kapsamını, sırasını ve görev sözleşmelerini tarif eder.
- `/Users/karaca/DEV/mimari/platform` yerel implementation checkout'udur; gerçek kod gerekiyorsa geliştirici veya implementation ajan operatörü burada çalışır.
- Bu checkout'un remote'u yoktur ve branch'i `master` olarak doğrulanmıştır; actionplan exportları repo URL'si uydurmaz.

Dolayısıyla "platform build-out" actionplan içinde yalnız WBS/dokümantasyon ve handoff sözleşmesi olarak ele alınır. Kernel, SDK, app-core, module veya app kodu actionplan'da yazılmaz; code-start için `implementation-workspace-manifest.md`, `task-to-code-contract.md` ve `kernel-sdk-app-delivery-sequence.md` birlikte okunur.

---

## 2. Branch topolojisi ve aktif çalışma kolu

Yerel branchler: `main`, `icerik-derinlestirme`, `feat/enterprise-readiness`.  
Uzak (origin): `origin/main`, `origin/icerik-derinlestirme` eşleşmeli; `feat/enterprise-readiness` henüz origin'e push edilmemiş.

`git log --format="%H %d" HEAD | head -1` çıktısı, `HEAD -> icerik-derinlestirme, feat/enterprise-readiness` göstermektedir. Yani her iki branch aynı commit'i (`1f12cd1`) işaret etmektedir — `feat/enterprise-readiness`, `icerik-derinlestirme`'den bu checkpoint anında oluşturulmuş ve henüz hiç ilerlememiş.

`main` ve `origin/main`, HEAD'den 25 commit geridedir. Bu 25 commit tümüyle `icerik-derinlestirme` hattında birikmiş olup merge edilmemiş durumdadır. `main`'e yapılan son commit (`e461e9b`) feat/archetype çalışmasıdır.

Aktif geliştirme kolu: `icerik-derinlestirme` (HEAD = `1f12cd1`, "enterprise-readiness öncesi WIP checkpoint"). `feat/enterprise-readiness` bu checkpoint'ten yeni işlerin dallandırılacağı branch olarak ayrılmıştır ancak şu an henüz boş (tip aynı).

---

## 3. Intentional, generated ve şüpheli dosyalar

Bu bölüm 2026-06-28 tarihli branch snapshot'ını anlatır; güncel main gerçeği 467 generated node ve 17 üretim boyutudur. `src/data/generated/nodes/` altındaki JSON dosyaları `tools/agents/seed-*.mjs` araçları ve `npm run gen:reindex` pipeline'ı tarafından otomatik üretilmekte, elle yazılmamaktadır. `generated` sınıfında ayrıca `public/data/nodes.json` (birleşik JSON, reindex aracıyla üretilir), `public/data/audit.json` ve `dist/` içeriği bulunur.

El emeği ("intentional") dosyalar şunlardır: `src/schemas/task.ts` (Zod şema tek kaynağı), `src/store/taskStore.ts`, `src/store/viewState.ts`, `src/store/persist.ts`, `src/engine/*.ts` (audit, bulk, execution, gantt, query, reports, table, workload — 10 modül), `src/views/*.tsx` (11 görünüm), `src/components/eca/EcaPanel.tsx` ve `WorkflowPanel.tsx`, `src/data/eca/ruleset-catalog.json`, `src/data/surface/surface-catalog.json` ve `workflow-catalog.json`, `src/schemas/ruleset.ts`, `src/schemas/surface.ts`, `tools/quality-lint.mjs`, `tools/gen-rules.mjs`, `tools/agents/check-*.mjs`, `tests/e2e/a11y.spec.ts`, `package.json`, `.gitignore`, `.github/workflows/deploy.yml`.

Şüpheli / dikkat gerektiren dosyalar: `docs/.write-test-2` (boş bir yazma testi kalıntısı; içerik yok, güvenli silinebilir). `vite.config.ts.timestamp-*` ve `vitest.config.ts.timestamp-*` dosyaları `.gitignore`'a eklenmesi gereken araç kalıntılarıdır. `dist/` klasörü deploy artefaktı olarak build'den üretilmeli; repoda izlenmesi gerekmez — `.gitignore` kontrolü önerilir.

---

## 4. "platform" kopukluğunun çözümü

Güncel çözüm iki ayrı kavramı ayırmaktır: actionplan'daki platform WBS kümesi ve yerel platform implementation checkout'u.

actionplan içinde `app-platform-horizontal` zaten bir WBS kümesidir. `git log` geçmişinde `seed-platform-horizontal.mjs` üzerinden içerik tohumlaması yapılmış, düğüm `nodes.json` içinde `wbsCode: "23"` ile kayıtlı ve `app-layer1`, `app-kernel`'a `dependsOn` bağıyla bağlıdır. Bu, platform kapsamının plan katmanında temsil edildiğini gösterir.

Yerel `/Users/karaca/DEV/mimari/platform` checkout'u ise ayrı implementation alanıdır. 2026-07-08 doğrulamasında branch `master`, remote boş olarak görülmüştür. Bu nedenle actionplan exportları remote URL'si uydurmaz; yalnız workspace path, branch paterni, kök dizinler ve test komutlarını verir.

Eksik olan şey "platform kodunu actionplan içinde yazmak" değildir. Eksik kalırsa tamamlanacak şey, `app-platform-horizontal` ve alt düğümlerinin geliştiriciye yeterli `repoPath`, `testCommand`, acceptance criteria, evidence ve waterfall faz bilgisi taşımasıdır. Gerçek kernel/SDK/app-core/module/app kodu, code-start koşulları sağlandıktan sonra implementation checkout'unda geliştirilir.

---

## 5. Öncelik sırası — commit / ignore / test

Bu bölüm üç eksen üzerinde örgütlenmiştir.

Önce commit'lenmesi gerekenler: `src/schemas/task.ts` (tüm şema değişiklikleri burada birikmiş), engine modülleri (`src/engine/*.ts`), ECA ve Surface katalogları (`src/data/eca/ruleset-catalog.json`, `src/data/surface/*.json`), `src/schemas/ruleset.ts`, `src/schemas/surface.ts`, `tools/quality-lint.mjs`, `tools/agents/check-*.mjs`, `tests/`, `.github/workflows/deploy.yml`. Bunlar reviewable, work_unit emeği değişikliklerdir ve `feat/enterprise-readiness` branch'inde kendi başlarına bir commit oluşturabilir.

`src/data/generated/nodes/*.json` ve `public/data/nodes.json` ayrı bir commit olarak işlenmelidir — "generated: 467 düğüm içerik güncellemesi" şeklinde etiketlenerek. Bu sayede diff'e bakıldığında work_unit emeği değişikliklerle karışmaz.

Önce `.gitignore`'a eklenmesi / görmezden gelinmesi gerekenler: `dist/`, `vite.config.ts.timestamp-*`, `vitest.config.ts.timestamp-*`, `docs/.write-test-2`, `node_modules/` (zaten `.gitignore`'da olması lazım — kontrol edilmeli).

Önce test edilmesi gerekenler: `npm run typecheck` (doğrulandı, yeşil), `npm test` (148 test / 20 dosya, doğrulandı yeşil), `node tools/agents/check-content.mjs`, `node tools/agents/check-ruleset.mjs`, `node tools/agents/check-surface.mjs`, `node tools/quality-lint.mjs` (golden 3/3, doğrulandı yeşil). Biome lint Linux'ta platform ikili eksikliği nedeniyle çalışmamaktadır — bu gerçek bir kod hatası değildir; CI'da `ubuntu-latest` üzerinde sorunsuz çalışır, yerel macOS geliştirme ortamında `npx @biomejs/biome check .` tercih edilmelidir.

---

## Codex Raporundaki İki Hatanın Düzeltmesi

**Hata A — "Veri modeli zayıf / eksik alan" iddiası yanlıştır.**  
`src/schemas/task.ts` incelendiğinde şemanın son derece zengin olduğu görülmektedir. Ana `TaskNodeSchema` içinde şu alanlar mevcuttur: `deliverables`, `acceptanceCriteria`, `risks` (RiskSchema dizisi: id/desc/severity/mitigation), `rollback`, `evidence`, `metrics` (key/target çiftleri), `dimensions` (17 üretim boyutu: featureDefs/security/codeOptimization/securityOptimization/performance/mobileApps/wcag/deployment/eca/aiAgents/testing/owasp/integration/moduleUsage/dataLifecycle/observability/reliability), `ecaRules` (EcaRuleSchema dizisi: yapısal event/condition/action motoru), `agentPolicy` (AgentPolicySchema: autonomy/capabilities/allowedTargets/forbiddenTargets/allowedActions/forbiddenActions/stepUp/rulesetBoundary/prodDataPolicy/killSwitch), `schedule` (start/end/actualStart/actualEnd/baselineStart/baselineEnd), `milestone`, `assignees`, `phases` (7 waterfall faz kapısı), `cost`, `source`, `state` (maturity). Sorun şema eksikliği değil, bu alanların çoğunun plan/handoff olgunluğuna göre faz kapılarıyla doldurulması gereğidir; exact-17 üretim boyutu artık production kapısıyla korunur.

**Hata B — "SPA 404 riski" iddiası yanlıştır.**  
`tools/spa404.mjs` dosyası `dist/index.html`'i `dist/404.html`'e kopyalar. Bu araç `npm run build` scripti içinde (`"build": "vite build && node tools/spa404.mjs"`) doğrudan çağrılmaktadır. `dist/404.html` dosyasının repoda mevcut olduğu da doğrulanmıştır. GitHub Pages'in SPA derin-URL fallback mekanizması eksiksiz çalışmaktadır.

---

## Özet Tablo — Doğrulanmış Sayılar

| Metrik | Değer | Kaynak |
|---|---|---|
| Toplam düğüm | 467 | `public/data/nodes.json` / `src/data/generated/meta.json` |
| üretim boyutu | 17 | `src/schemas/task.ts` |
| exact-17 ihlali | 0 | `npm run qa:content` / `npm run qa:dimensions` |
| contentQuality | 467 / 467 yeşil | `npm run qa:content` |
| weak-content generic | 0 | `npm run qa:dimensions` |
| semantic FAIL/WARN | 0 / 0 | `npm run qa:dimensions` |
| Vitest testleri | yeşil | CI ve lokal QA |
| CI kapıları | typecheck + content + ruleset + surface + quality-lint, tümü yeşil | önceden çalıştırıldı |
| HEAD commit | 1f12cd1 | git log |
| main'den ilerideki commit sayısı | 25 | git log |
| app-level küme sayısı | 27 | node -e |
| platform-horizontal dahil mi | evet (wbsCode: 23) | nodes.json |
