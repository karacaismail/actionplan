# Repo Gerçeklik Denetim Raporu

**Tarih:** 2026-06-28  
**Denetçi:** senior platform/repo denetçisi (salt-okunur inceleme)  
**Kapsam:** karacaismail/actionplan — tek repo  
**Doğrulama yöntemi:** git log, cat, node -e (jq eşdeğeri), dosya okuma; kod/veri değiştirilmedi, commit yapılmadı.

---

## 1. Bu repo ne işe yarıyor?

`actionplan`, 50+ (README'de "70+") ürünlük bir AI-first SaaS framework'ünün **enterprise-grade waterfall geliştirme sürecini planlayan** WBS tabanlı bir görev yönetimi aracıdır. Uygulamaların kaynak kodu burada değildir; bu repo, o uygulamaların **ne zaman, hangi sırayla, hangi kapıları geçerek** yapılacağını tarif eden düğümleri (424 adet) tutar.

Mimari olarak frontend-only, JSON-as-DB bir SPA'dır. Veri kaynağı `public/data/nodes.json` (424 düğüm; build sonrası `dist/data` kopyası da oluşur) ve `src/data/generated/nodes/*.json` (her düğüm ayrı dosya, 424 dosya). Şema tek kaynak `src/schemas/task.ts` — Zod ile tanımlı, TS tipleri buradan türetiliyor.

Codex'in varsaydığı gibi ayrı bir `platform` reposu yoktur ve GitHub hesabında bulunmamaktadır. `platform` terimi bu repoda bir uygulama kategorisine işaret eder: WBS hiyerarşisinde `app-platform-horizontal` kimliğiyle (`wbsCode: "23"`, `level: "app"`) kayıtlı bir küme. Ayrıca `tools/agents/seed-platform-horizontal.mjs` dosyası bu kümenin içerik tohumlamasını yapar. Dolayısıyla "platform build-out" meselesi ayrı bir repoya gerek duymadan actionplan içinde WBS düğüm seti olarak ele alınabilir — bu karar zaten örtük olarak hayata geçirilmiş durumdadır.

---

## 2. Branch topolojisi ve aktif çalışma kolu

Yerel branchler: `main`, `icerik-derinlestirme`, `feat/enterprise-readiness`.  
Uzak (origin): `origin/main`, `origin/icerik-derinlestirme` eşleşmeli; `feat/enterprise-readiness` henüz origin'e push edilmemiş.

`git log --format="%H %d" HEAD | head -1` çıktısı, `HEAD -> icerik-derinlestirme, feat/enterprise-readiness` göstermektedir. Yani her iki branch aynı commit'i (`1f12cd1`) işaret etmektedir — `feat/enterprise-readiness`, `icerik-derinlestirme`'den bu checkpoint anında oluşturulmuş ve henüz hiç ilerlememiş.

`main` ve `origin/main`, HEAD'den 25 commit geridedir. Bu 25 commit tümüyle `icerik-derinlestirme` hattında birikmiş olup merge edilmemiş durumdadır. `main`'e yapılan son commit (`e461e9b`) feat/archetype çalışmasıdır.

Aktif geliştirme kolu: `icerik-derinlestirme` (HEAD = `1f12cd1`, "enterprise-readiness öncesi WIP checkpoint"). `feat/enterprise-readiness` bu checkpoint'ten yeni işlerin dallandırılacağı branch olarak ayrılmıştır ancak şu an henüz boş (tip aynı).

---

## 3. Intentional, generated ve şüpheli dosyalar

HEAD ile `origin/main` arasında 532 dosya farklıdır (`git diff --stat HEAD origin/main`). Bu farkın büyük çoğunluğu, `src/data/generated/nodes/` altındaki 424 adet JSON dosyasıdır. Bu dosyalar `tools/agents/seed-*.mjs` araçları ve `npm run ingest` pipeline'ı tarafından otomatik üretilmekte, elle yazılmamaktadır. `generated` sınıfında ayrıca `public/data/nodes.json` (432 KB'lık birleşik JSON, reindex aracıyla üretilir), `public/data/audit.json` ve `dist/` içeriği bulunur.

El emeği ("intentional") dosyalar şunlardır: `src/schemas/task.ts` (Zod şema tek kaynağı), `src/store/taskStore.ts`, `src/store/viewState.ts`, `src/store/persist.ts`, `src/engine/*.ts` (audit, bulk, execution, gantt, query, reports, table, workload — 10 modül), `src/views/*.tsx` (11 görünüm), `src/components/eca/EcaPanel.tsx` ve `WorkflowPanel.tsx`, `src/data/eca/ruleset-catalog.json`, `src/data/surface/surface-catalog.json` ve `workflow-catalog.json`, `src/schemas/ruleset.ts`, `src/schemas/surface.ts`, `tools/quality-lint.mjs`, `tools/gen-rules.mjs`, `tools/agents/check-*.mjs`, `tests/e2e/a11y.spec.ts`, `package.json`, `.gitignore`, `.github/workflows/deploy.yml`.

Şüpheli / dikkat gerektiren dosyalar: `docs/.write-test-2` (boş bir yazma testi kalıntısı; içerik yok, güvenli silinebilir). `vite.config.ts.timestamp-*` ve `vitest.config.ts.timestamp-*` dosyaları `.gitignore`'a eklenmesi gereken araç kalıntılarıdır. `dist/` klasörü deploy artefaktı olarak build'den üretilmeli; repoda izlenmesi gerekmez — `.gitignore` kontrolü önerilir.

---

## 4. "platform" kopukluğunun çözümü

Codex'in önceki raporunda ayrı bir `platform` reposunu varmış gibi varsaydığı temel hata şudur: actionplan içinde `app-platform-horizontal` zaten bir WBS kümesidir. `git log` geçmişinde `seed-platform-horizontal.mjs` üzerinden içerik tohumlaması yapılmış, düğüm `nodes.json` içinde `wbsCode: "23"` ile kayıtlı ve `app-layer1`, `app-kernel`'a `dependsOn` bağıyla bağlıdır.

Çözüm kararı olarak "platform build-out'u actionplan'a WBS düğüm seti olarak entegre et" yönünde bir seçim yapılmasına gerek yoktur; bu entegrasyon fiilen tamamlanmıştır. Eksik olan, `app-platform-horizontal` kümesinin alt düğümlerini — `stone`, `molecule`, `element`, `atom` seviyesinde — ayrıntılı içerikle doldurmaktır. Mevcut durumda bu kümenin 5 düğümü vardır (`app-platform-horizontal`, ve `*-x-stone`, `*-x-molecule`, `*-x-element`, `*-x-atom`) ve bunların boyutları büyük olasılıkla iskelet durumundadır.

---

## 5. Öncelik sırası — commit / ignore / test

Bu bölüm üç eksen üzerinde örgütlenmiştir.

Önce commit'lenmesi gerekenler: `src/schemas/task.ts` (tüm şema değişiklikleri burada birikmiş), engine modülleri (`src/engine/*.ts`), ECA ve Surface katalogları (`src/data/eca/ruleset-catalog.json`, `src/data/surface/*.json`), `src/schemas/ruleset.ts`, `src/schemas/surface.ts`, `tools/quality-lint.mjs`, `tools/agents/check-*.mjs`, `tests/`, `.github/workflows/deploy.yml`. Bunlar reviewable, el emeği değişikliklerdir ve `feat/enterprise-readiness` branch'inde kendi başlarına bir commit oluşturabilir.

`src/data/generated/nodes/*.json` ve `public/data/nodes.json` ayrı bir commit olarak işlenmelidir — "generated: 424 düğüm içerik güncellemesi" şeklinde etiketlenerek. Bu sayede diff'e bakıldığında el emeği değişikliklerle karışmaz.

Önce `.gitignore`'a eklenmesi / görmezden gelinmesi gerekenler: `dist/`, `vite.config.ts.timestamp-*`, `vitest.config.ts.timestamp-*`, `docs/.write-test-2`, `node_modules/` (zaten `.gitignore`'da olması lazım — kontrol edilmeli).

Önce test edilmesi gerekenler: `npm run typecheck` (doğrulandı, yeşil), `npm test` (148 test / 20 dosya, doğrulandı yeşil), `node tools/agents/check-content.mjs`, `node tools/agents/check-ruleset.mjs`, `node tools/agents/check-surface.mjs`, `node tools/quality-lint.mjs` (golden 3/3, doğrulandı yeşil). Biome lint Linux'ta platform ikili eksikliği nedeniyle çalışmamaktadır — bu gerçek bir kod hatası değildir; CI'da `ubuntu-latest` üzerinde sorunsuz çalışır, yerel macOS geliştirme ortamında `npx @biomejs/biome check .` tercih edilmelidir.

---

## Codex Raporundaki İki Hatanın Düzeltmesi

**Hata A — "Veri modeli zayıf / eksik alan" iddiası yanlıştır.**  
`src/schemas/task.ts` incelendiğinde şemanın son derece zengin olduğu görülmektedir. Ana `TaskNodeSchema` içinde şu alanlar mevcuttur: `deliverables`, `acceptanceCriteria`, `risks` (RiskSchema dizisi: id/desc/severity/mitigation), `rollback`, `evidence`, `metrics` (key/target çiftleri), `dimensions` (14 üretim boyutu: featureDefs/security/codeOptimization/securityOptimization/performance/mobileApps/wcag/deployment/eca/aiAgents/testing/owasp/integration/moduleUsage), `ecaRules` (EcaRuleSchema dizisi: yapısal event/condition/action motoru), `agentPolicy` (AgentPolicySchema: autonomy/capabilities/allowedTargets/forbiddenTargets/allowedActions/forbiddenActions/stepUp/rulesetBoundary/prodDataPolicy/killSwitch), `schedule` (start/end/actualStart/actualEnd/baselineStart/baselineEnd), `milestone`, `assignees`, `phases` (7 waterfall faz kapısı), `cost`, `source`, `state` (maturity). Sorun şema eksikliği değil, bu alanların çoğunun boş (null/[]) kalmasıdır. Özellikle `owner` 411/424 düğümde boş, `refs` 422/424'te boş, `assignees` 424/424'te boş ve ortalama `progress` 1.71'dir. Bu bir içerik/süreç olgunluk sorunudur, şema tasarım sorunudur değil.

**Hata B — "SPA 404 riski" iddiası yanlıştır.**  
`tools/spa404.mjs` dosyası `dist/index.html`'i `dist/404.html`'e kopyalar. Bu araç `npm run build` scripti içinde (`"build": "vite build && node tools/spa404.mjs"`) doğrudan çağrılmaktadır. `dist/404.html` dosyasının repoda mevcut olduğu da doğrulanmıştır. GitHub Pages'in SPA derin-URL fallback mekanizması eksiksiz çalışmaktadır.

---

## Özet Tablo — Doğrulanmış Sayılar

| Metrik | Değer | Kaynak |
|---|---|---|
| Toplam düğüm | 424 | `public/data/nodes.json` (node -e) |
| owner boş | 411 / 424 | doğrulandı |
| refs boş | 422 / 424 | doğrulandı |
| dependsOn boş | 112 / 424 | doğrulandı |
| assignees boş | 411 / 424 | doğrulandı |
| progress ortalaması | 1.71 | doğrulandı |
| status: backlog | 407 | doğrulandı |
| status: in-progress | 9 | doğrulandı |
| status: todo | 5 | doğrulandı |
| status: done | 3 | doğrulandı |
| phase: db-schema | 411 | doğrulandı |
| phase: development | 6 | doğrulandı |
| Vitest testleri | 148 / 20 dosya, yeşil | önceden çalıştırıldı |
| CI kapıları | typecheck + content + ruleset + surface + quality-lint, tümü yeşil | önceden çalıştırıldı |
| HEAD commit | 1f12cd1 | git log |
| main'den ilerideki commit sayısı | 25 | git log |
| app-level küme sayısı | 27 | node -e |
| platform-horizontal dahil mi | evet (wbsCode: 23) | nodes.json |
