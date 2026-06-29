# CI Conformance Kapıları — Kapı Kataloğu

Sürüm: 1.0 — 2026-06-29
Durum: Kanonik. `.github/workflows/deploy.yml` içindeki bloklayıcı kapıların referans kataloğu.

---

## Önsöz

Mühendislik standardı yazılı ama uygulanmıyorsa "ölü metin"dir; sahte güven üretir. ADR-0027 bu nedenle her standardı bir CI kapısına bağlar: standart yalnızca makine-okunur sözleşme olduğu için kapı onu denetleyebilir. Bu doküman, `.github/workflows/deploy.yml` içinde tanımlı bloklayıcı kapıların tam kataloğudur.

Tüm kapılar `deploy` iş akışının `build` job'ında, `node tools/agents/<kapı>.mjs` olarak çalışır. Herhangi biri sıfırdan farklı çıkış kodu döndürürse build durur ve GitHub Pages dağıtımı yapılmaz. Bu nedenle her kapı **bloklayıcı**dır.

Bu katalog iki gruba ayrılır: ADR-0026/0027 ile gelen yeni standart/yönetişim kapıları ve daha önce var olan içerik/veri/yürütme kapıları. evidence ve Definition of Ready (DoR) için **ayrı yeni kapı yoktur**; bunlar mevcut kapılarca kapsanır (bkz. Bölüm 3).

---

## 1. Standart ve Yönetişim Kapıları (ADR-0026 / ADR-0027)

Bu yedi kapı, standardRefs / applicability / waivers / kısa-kod / bağımlılık / UI standartları / tech-profile katmanını zorlar. Her kapı `.github/workflows/deploy.yml` içinde ayrı bir adım olarak tanımlıdır.

### check-tech-profile

- Ne zorlar: Frontend stack manifesti (ADR-0026). Headless kilidi (stillenmiş bileşen kiti yasak), global yasak-lib listesi (next, redux, flowbite, antd, MUI, Chakra, Mantine ...) ve her yüzeyin geçerli bir `techProfileRef` taşıması. Yasak-lib üç repoda taranır.
- Dosya yolu: `tools/agents/check-tech-profile.mjs`
- Yeşil koşul: Hiçbir yasak-lib bağımlılığı yok; hiçbir headless ihlali yok; her `techProfileRef` değeri `src/data/tech-profiles.json` içinde çözülüyor.
- Veri doldukça nasıl dişlenir: Yasak-lib listesi genişledikçe (ör. yeni stillenmiş kit) tarama sertleşir; yeni yüzeyler eklendikçe her biri zorunlu `techProfileRef` taşır.

### check-standards-coverage

- Ne zorlar: `standardRefs` referans bütünlüğü. Boş olmayan her `<...>Ref` değerinin gerçek bir hedefe çözüldüğünü doğrular (standart anahtarları → `src/data/standards/<id>.json`, `techProfileRef` → tech-profiles).
- Dosya yolu: `tools/agents/check-standards-coverage.mjs`
- Yeşil koşul: Hiçbir düğümde çözülemeyen (dangling) standart referansı yok.
- Veri doldukça nasıl dişlenir: Başlangıçta yalnız boş olmayan referanslar denetlenir (default `""` muaf). Düğümler standart referanslarını doldurdukça kapsam genişler; ileride seviye/yüzey başına zorunlu referans kümesi tanımlanarak "eksik referans" da bloklayıcı yapılabilir.

### check-dimension-applicability

- Ne zorlar: Boyut uygulanabilirliği. Bir boyut bir düğüme uygulanmıyorsa (`applicability[dimKey].applies = false`) gerekçe (`reason`) zorunludur. Gerekçesiz `applies=false` jenerik dolguyu/sessiz atlamayı engeller.
- Dosya yolu: `tools/agents/check-dimension-applicability.mjs`
- Yeşil koşul: `applies=false` olan her boyut girişinde boş olmayan bir `reason` var.
- Veri doldukça nasıl dişlenir: `applicability` haritası genişledikçe daha çok boyut "N/A + gerekçe" olarak işaretlenir; jenerik çöp içerik yerine açık "uygulanmıyor, çünkü..." kaydı çoğalır.

### check-waivers

- Ne zorlar: Waiver yaşam döngüsü. `waivers[]` içindeki her kayıt gerekçeli (`reason`), onaylı (`approvedBy`) ve süreli (`expires`) olmalıdır. Gerekçesiz / süresiz / süresi dolmuş waiver geçersizdir.
- Dosya yolu: `tools/agents/check-waivers.mjs`
- Yeşil koşul: Her waiver kaydında `reason`, `approvedBy` ve gelecek tarihli `expires` dolu; süresi geçmiş hiçbir waiver aktif değil.
- Veri doldukça nasıl dişlenir: Süre alanı sayesinde waiver'lar zamanla otomatik geçersizleşir; kalıcı bypass oluşamaz. Standartlardan sapma kayıt altına alındıkça bu kapı sürekli temizlik baskısı uygular. Ayrıntı: `docs/waiver-policy.md`.

### check-short-code

- Ne zorlar: Kısa-kod / kapsam frenleri. Dosya satır tavanı, fonksiyon boyutu, döngüsel ve bilişsel karmaşıklık eşikleri, gereksiz büyümeye karşı bütçe (`short-code` standardı).
- Dosya yolu: `tools/agents/check-short-code.mjs`
- Yeşil koşul: Hiçbir dosya/fonksiyon tanımlı tavanı aşmıyor; karmaşıklık eşikleri aşılmıyor.
- Veri doldukça nasıl dişlenir: Tavanlar `short-code.json` sözleşmesinde tek yerden ayarlanır; kod tabanı olgunlaştıkça eşikler düşürülerek kapı sıkılaştırılabilir.

### check-dependency-policy

- Ne zorlar: Bağımlılık politikası. Paket allowlist, yasak paketler, güvensiz/yasaklı sürümler, lisans politikası, lockfile commit zorunluluğu (`dependency-policy` standardı).
- Dosya yolu: `tools/agents/check-dependency-policy.mjs`
- Yeşil koşul: Yasak paket yok; güvensiz sürüm yok; lisans politikasına aykırı bağımlılık yok; lockfile tutarlı.
- Veri doldukça nasıl dişlenir: Allowlist/lisans kuralları `dependency-policy.json` içinde genişledikçe denetim kapsamı büyür; SBOM ve lisans-katman federasyonu olgunlaştıkça kapı daha çok sapmayı yakalar.

### check-ui-standards

- Ne zorlar: UI standartları. Tasarım sistemi, UI bileşen sözleşmesi ve UX etkileşim kurallarının ihlal edilmemesi; ör. emoji kullanımı ve stillenmiş kit (styled-kit) izleri yok.
- Dosya yolu: `tools/agents/check-ui-standards.mjs`
- Yeşil koşul: Emoji yok; yasaklı styled-kit deseni yok; tasarım/bileşen sözleşmesine aykırı işaret yok.
- Veri doldukça nasıl dişlenir: `design-system.json`, `ui-components.json` ve `ux-interaction.json` sözleşmelerine yeni ölçülebilir kural (token zorunluluğu, a11y bayrağı) eklendikçe kapı dişlenir.

---

## 2. Mevcut İçerik, Veri ve Yürütme Kapıları

Aşağıdaki kapılar ADR-0026/0027'den önce de vardı ve standart katmanıyla birlikte çalışmaya devam eder. Bunlar standart referans bütünlüğünü değil, içerik kalitesi / veri tutarlılığı / yürütme hazırlığı eksenini zorlar.

### check-content

- Ne zorlar: İçerik kalite kapısı (node checker — 422 düğüm). Düğüm içeriğinin kalıp/golden ölçütlerini karşılaması.
- Dosya yolu: `tools/agents/check-content.mjs`
- Yeşil koşul: Tüm düğümler içerik kalite eşiğini geçer.
- Veri doldukça nasıl dişlenir: Düğüm sayısı ve içerik beklentileri arttıkça eşik yükselir.

### check-ruleset

- Ne zorlar: ECA ruleset kataloğu bütünlüğü ve yapısal geçerliliği.
- Dosya yolu: `tools/agents/check-ruleset.mjs`
- Yeşil koşul: ECA kuralları şemaya uyar; zincir derinliği sınırı aşılmaz.
- Veri doldukça nasıl dişlenir: Yeni ECA kuralları eklendikçe yapısal denetim kapsamı genişler.

### check-surface

- Ne zorlar: Surface / Workflow kataloğu geçerliliği (yüzey sözleşmeleri).
- Dosya yolu: `tools/agents/check-surface.mjs`
- Yeşil koşul: Tüm Surface kayıtları şemaya uyar ve gerekli alanları taşır.
- Veri doldukça nasıl dişlenir: Yeni yüzeyler eklendikçe `techProfileRef` ve sözleşme alanları zorunlu kalır.

### check-data-quality

- Ne zorlar: Veri kalitesi — `owner` doluluğu, referans bütünlüğü ve `dependsOn` grafiğinin DAG (döngüsüz) olması. Faz kapısı sıralaması da burada zorlanır.
- Dosya yolu: `tools/agents/check-data-quality.mjs`
- Yeşil koşul: Dairesel bağımlılık yok; kırık referans yok; sahipsiz düğüm kuralları karşılanıyor.
- Veri doldukça nasıl dişlenir: Düğüm grafiği büyüdükçe DAG ve referans denetimi daha çok ilişkiyi kapsar.

### check-execution-readiness

- Ne zorlar: Yürütme hazırlığı — done kapısı için done-evidence, execution-readiness ve platform-traceability. **evidence bu kapıyla kapsanır.**
- Dosya yolu: `tools/agents/check-execution-readiness.mjs`
- Yeşil koşul: `done` statüsüne geçen düğümlerde gerekli evidence ve traceability kayıtları mevcut; `implementationStatus` tutarlı.
- Veri doldukça nasıl dişlenir: Düğümler ilerledikçe evidence beklentisi her faz kapısı için doğrulanır.

### check-ready-for-dev

- Ne zorlar: Definition of Ready — bir düğümün `development` fazına alınabilmesi için 10/10 hazırlık skoru. **DoR bu kapıyla kapsanır.**
- Dosya yolu: `tools/agents/check-ready-for-dev.mjs`
- Yeşil koşul: `phase = development` olan her düğüm `docs/ready-for-dev-gate.md` Bölüm 2'deki 10 alan kontrolünü 10/10 geçer.
- Veri doldukça nasıl dişlenir: Daha çok düğüm development fazına aktıkça kapı her birini tek tek 10/10 zorunlu tutar.

---

## 3. evidence ve DoR İçin Ayrı Kapı Yoktur

ADR-0027, yeni standart/yönetişim kapıları sayarken evidence ve DoR'u **kasıtlı olarak yeni kapı listesine almaz**, çünkü ikisi de mevcut kapılarca zaten kapsanır:

- **evidence** → `check-execution-readiness`. Faz kapılarının kanıtı (`evidence[]`) done-evidence denetimiyle bu kapıda zorlanır. Ayrı bir `check-evidence` kapısı yoktur ve gerekmez.
- **Definition of Ready (DoR)** → `check-ready-for-dev`. `development` fazına geçiş için 10/10 hazırlık koşulu bu kapıyla zorlanır. Ayrı bir DoR kapısı yoktur; `ready-for-dev` kapısı DoR'un tamamını kapsar.

Bu nedenle yeni eklenen kapılar yalnızca standart referansı, uygulanabilirlik, waiver, kısa-kod, bağımlılık, UI standartları ve tech-profile eksenlerini hedefler; evidence/DoR çift kapı oluşturulmaz.

---

## 4. Tüm Kapıların Özet Matrisi

| Kapı | Eksen | Dosya yolu | Grup |
|---|---|---|---|
| check-content | İçerik kalitesi | `tools/agents/check-content.mjs` | Mevcut |
| check-ruleset | ECA kataloğu | `tools/agents/check-ruleset.mjs` | Mevcut |
| check-surface | Yüzey sözleşmesi | `tools/agents/check-surface.mjs` | Mevcut |
| check-tech-profile | Tech-profile + headless | `tools/agents/check-tech-profile.mjs` | ADR-0026 |
| check-standards-coverage | standardRefs bütünlüğü | `tools/agents/check-standards-coverage.mjs` | ADR-0027 |
| check-dimension-applicability | Boyut uygulanabilirliği | `tools/agents/check-dimension-applicability.mjs` | ADR-0027 |
| check-waivers | Waiver yaşam döngüsü | `tools/agents/check-waivers.mjs` | ADR-0027 |
| check-short-code | Kısa-kod / kapsam freni | `tools/agents/check-short-code.mjs` | ADR-0027 |
| check-dependency-policy | Bağımlılık politikası | `tools/agents/check-dependency-policy.mjs` | ADR-0027 |
| check-ui-standards | UI / tasarım standartları | `tools/agents/check-ui-standards.mjs` | ADR-0027 |
| check-data-quality | Veri tutarlılığı (DAG) | `tools/agents/check-data-quality.mjs` | Mevcut |
| check-execution-readiness | evidence + yürütme | `tools/agents/check-execution-readiness.mjs` | Mevcut (evidence kapsar) |
| check-ready-for-dev | Definition of Ready | `tools/agents/check-ready-for-dev.mjs` | Mevcut (DoR kapsar) |

Kaynaklar: kapı tanımları `.github/workflows/deploy.yml`; standart sözleşmeleri `src/data/standards/*.json`; düğüm bağı `src/schemas/task.ts`; standart şema `src/schemas/standard.ts`. İlgili kararlar: `docs/adr-0026-tech-profiles.md`, `docs/adr-0027-engineering-standards.md`. Hub: `docs/engineering-standards-index.md`.
