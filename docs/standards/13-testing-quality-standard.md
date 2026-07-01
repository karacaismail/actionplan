# 13 — Test & Kalite Standardı

Sürüm: 1.0 — 2026-07-01
Durum: Anlatı standardı. İki mevcut makine kontratını *tamamlar*, yerlerini almaz.
Makine kontratları (MEVCUT, zorlanır):
- `src/data/standards/testing-strategy.json` — 8 kural (pyramid, test-first red→green, coverage-threshold, e2e+axe, contract-schema-parity, factory-isolation, mutation+load, no-skip-no-only).
- `src/data/standards/quality-gates.json` — 8 kapı (typecheck-0, lint-0, coverage-threshold, e2e+axe-0, perf-budget, build-green, security-scan, DoD-checklist).
Aile: `testing` · Öncelik: P0 (quality-gates) / P1 (testing-strategy) · CI kapıları: `check-standards-coverage` + bloklayıcı test/lint/e2e işleri.

---

## 0. Bu Standart İki Kontratı Nasıl Köprüler

Reponun test disiplini iki ayrı ama tamamlayıcı sözleşmede yaşar: `testing-strategy.json` *nasıl test yazılır* (piramit, test-önce, factory, mutation, contract-parity) sorusunu, `quality-gates.json` ise *merge öncesi hangi kapılar bloklar* (typecheck/lint/coverage/e2e/perf/build/security/DoD) sorusunu cevaplar. Bu anlatı ikisinin kural değerlerini yeniden yazmaz; ikisinin nasıl birlikte çalıştığını, stack karşılığını (Vitest/Playwright/axe + pytest) ve `dimensions.testing` boyutuyla ilişkisini açıklar. E2E boyutu ayrıca `dimensions.testing`'de düğüm-bazlı yaşar (`enterprise-dod.md` §2.11); bu doküman o boyutu tekrar tanımlamaz, sözleşmelere köprüler.

Aşağıdaki tablo bu dokümandaki her konunun sahibini ayırır.

| Konu | Sahibi | Bu dokümanda |
|---|---|---|
| Test piramidi (unit/integration/e2e) dağılımı | `testing-strategy.json` (`test-pyramid-distribution`) | Referans — §2, a11y ekseni eklenir |
| Test-önce red→green ritüeli | `testing-strategy.json` (`test-first-red-green`) | Referans — §3 |
| Coverage eşiği (line/branch, ratchet) | `testing-strategy.json` + `quality-gates.json` | Referans — §5, iki eşik uzlaştırılır |
| E2E (Playwright) + axe (0 ihlal) | `testing-strategy.json` (`test-e2e-playwright-axe`) + `quality-gates.json` (`gate-e2e-axe-zero`) | Referans — §4 |
| Contract test + şema-parite | `testing-strategy.json` (`test-contract-schema-parity`) | Referans — §7 |
| Factory + tenant izolasyon + determinizm | `testing-strategy.json` (`test-data-factory-isolation`) | Referans — §6 |
| Flaky-test politikası | `testing-strategy.json` (`test-data-factory-isolation`, `test-no-skip-no-only`) | Anlatı toplar — §8 |
| Merge kapıları (typecheck/lint/build/security/perf) | `quality-gates.json` | Referans — §9 |
| a11y test ekseni (WCAG 2.2) | `dimensions.wcag` + `ui-components` + iki kontrat | §4 — köprülenir |

---

## 1. Neden Test & Kalite İki Öncelik Taşır

`quality-gates` P0'dır (sistemsiz çalışmaz): bir kapı kırmızıysa merge yasaktır — typecheck, lint, coverage, e2e+axe, perf, build, security. `testing-strategy` P1'dir (enterprise müşteride zorunlu): testin *nasıl* yazıldığını (piramit, test-önce, factory) kilitler. İkisi ayrı önceliktedir çünkü kapılar *ne olursa olsun* bloklar (P0), test-yazım disiplini ise kaliteyi *ölçeklenebilir* kılar (P1). `numeronym-siniflandirma.md` E2E'yi `testing`/must/P1, CI/CD'yi (kapılar) `devops`/must/P0 olarak sınıflar; bu doküman ikisini tek anlatıda köprüler.

---

## 2. Test Piramidi — unit / integration / e2e / a11y

Test dağılımı piramidi takip eder: unit ≥ %70, integration ~ %20, e2e ≤ %10 (sayı bazında); bu `test-pyramid-distribution` (referans) kuralının tanımıdır. Buz-kütlesi anti-deseni (ağır e2e, az unit) reddedilir. Bu anlatı piramide dördüncü bir *çapraz-kesen* ekseni ekler: a11y — erişilebilirlik testi ayrı bir katman değil, e2e katmanına gömülü zorunlu bir eksendir (§4). Katmanlar net ayrılır: engine saf birim testi (DOM yok), integration engine↔veri/sözleşme sınırını, e2e gerçek tarayıcıda kullanıcı akışını test eder.

Aşağıdaki tablo dört ekseni ve araçlarını verir.

| Eksen | Hedef pay | Ne test eder | Araç (FE / BE) |
|---|---|---|---|
| Unit | ≥ %70 | Tekil fonksiyon/modül (engine, validator, hesap) | Vitest / pytest |
| Integration | ~ %20 | Sınır: resolver↔DB, sözleşme, çapraz-servis | Vitest + test container / pytest + testcontainer |
| E2E | ≤ %10 | Gerçek tarayıcıda kullanıcı akışı | Playwright |
| a11y (çapraz-kesen) | Her e2e sayfası | WCAG ihlali (§4) | @axe-core/playwright |

---

## 3. Test-Önce Ritüeli (red → green → refactor)

Test-önce zorunludur: her davranış için önce başarısız (red) test yazılır, sonra geçiren minimum kod (green), sonra refactor; bu `test-first-red-green` (referans) kuralının tanımıdır. İş sırası kilitlidir: test → db-schema → development (bu `data-api-contract`'ın `data-test-first-migration-order` kuralıyla aynı ritüeldir). PR'da uygulama kodu, onu doğrulayan testten önce eklenemez; hata düzeltmeleri önce hatayı yeniden üreten regresyon testi içerir.

Uygulama şu şekilde yapılır: bir davranış eklenirken önce beklenen sonucu iddia eden test yazılır ve çalıştırılıp *kırmızı* olduğu görülür (testin gerçekten bir şeyi doğruladığının kanıtı); ardından testi *yeşile* getiren en küçük kod yazılır; sonra davranış değişmeden refactor edilir. Testi "geçsin diye" zayıflatmak yasaktır — bir kapıyı kandırmak standardı düşürmektir (`plan-02` ORTAK-GUARDRAIL). Bu ritüelin waterfall karşılığı `enterprise-dod.md` §1'deki test-önce faz sırasıdır (`test-plan` fazı `development`'tan önce kapanır).

---

## 4. E2E (Playwright) + axe (WCAG 2.2)

Uçtan-uca akışlar Playwright ile gerçek tarayıcıda test edilir ve her e2e sayfası @axe-core/playwright ile taranır; erişilebilirlik ihlali = test başarısızlığı (uyarı değil). Bu, `test-e2e-playwright-axe` (testing-strategy) ve `gate-e2e-axe-zero` (quality-gates) kurallarının (referans) birleşik anlamıdır. İki kontrat WCAG hedefinde uzlaştırılır: quality-gates AA+AAA/0-ihlal + kontrast ≥ 7:1'i *merge kapısı* olarak zorlar; `dimensions.wcag` ve Surface a11y'de taban AA'dır (audit C3 sonrası), AAA yüzey-bazlı hedeftir. Bu doküman değeri değiştirmez; e2e'nin a11y eksenini nasıl taşıdığını bağlamlar.

Uygulama şu şekilde yapılır: kritik kullanıcı yolları (WBS düğüm CRUD, board, graph gibi) en az bir Playwright e2e ile kaplanır; testler staging ortamına karşı (mock değil, gerçek API — `enterprise-dod.md` §2.11) ve çoklu viewport (mobile 375px / tablet 768px / desktop 1280px) koşar; her sayfa `axe.analyze()` ile taranır ve `violations.length === 0` iddia edilir. Klavye-only navigasyon ve görünür odak otomatik doğrulanır.

Aşağıdaki tablo e2e+axe kapısının koşullarını verir.

| Koşul | Değer | Sahibi |
|---|---|---|
| Tarayıcı | chromium + webkit | `test-e2e-playwright-axe` |
| axe ihlali | `violations.length === 0` | `test-e2e-playwright-axe` + `gate-e2e-axe-zero` |
| Kontrast (merge kapısı) | ≥ 7:1 | `gate-e2e-axe-zero` |
| WCAG taban (yüzey) | 2.2 AA (AAA yüzey-hedefi) | `dimensions.wcag` (audit C3) |
| Viewport | 375 / 768 / 1280 | `enterprise-dod.md` §2.11 |
| Kritik yol kapsamı | happy + kritik sad path | `test-e2e-playwright-axe` |

---

## 5. Coverage Eşiği ve Ratchet

İki kontrat coverage eşiğini iki bağlamda tanımlar ve bu doküman ikisini uzlaştırır. `quality-gates.json` (`gate-coverage-threshold`) *merge kapısı* olarak line/branch ≥ %80, değişen dosyalarda (patch) ≥ %90 zorlar. `testing-strategy.json` (`test-coverage-threshold`) *strateji hedefi* olarak global ≥ %85, `engine/` için ≥ %95 ve ratchet (kapsam asla gerilemez) kuralını koyar. İkisi çelişmez: %80 mutlak alt-sınır (merge bloklayıcı), %85/%95 strateji-hedefidir; ratchet toplamın zamanla erozyonunu önler.

Aşağıdaki tablo iki eşiği ayırır; her ikisi de aynı yönde (yükseğe) çalışır.

| Ölçüt | Değer | Kaynak | Rol |
|---|---|---|---|
| Global line/branch | ≥ %80 | `gate-coverage-threshold` | Merge bloklayıcı (mutlak taban) |
| Patch (değişen dosya) | ≥ %90 | `gate-coverage-threshold` | Merge bloklayıcı |
| Global hedef | ≥ %85 | `test-coverage-threshold` | Strateji hedefi |
| `engine/` | ≥ %95 | `test-coverage-threshold` | Kritik-mantık hedefi |
| Ratchet | asla gerilemez | `test-coverage-threshold` | Erozyon koruması |

Uygulama şu şekilde yapılır: Vitest `coverage.thresholds` ile taban zorlanır (backend'de pytest-cov eşiği); kasıtlı muafiyet satır-içi gerekçeli (`/* c8 ignore */`) + review onayı ister; kapsam toplamı bir ratchet kontrolüyle (Codecov veya eşdeğer) düşürülemez.

---

## 6. Test Verisi — Factory, Tenant İzolasyonu, Determinizm

Test verisi elle değil factory/builder ile üretilir; sabit-kodlanmış paylaşılan mutable fixture yasaktır. Çok-kiracılı testlerde her test kendi tenant'ını izole kurar ve cross-tenant okuma (sızıntı) negatif test ile kanıtlanır. Testler deterministiktir: zaman (sahte saat), rastgelelik (sabit seed) ve sıra bağımlılığı enjekte edilir. Bu, `test-data-factory-isolation` (referans) kuralının tanımıdır ve `data-api-contract`'ın RLS tenant izolasyonuyla (`data-rls-tenant-isolation`) doğrudan köprülüdür: RLS'in çalıştığı bir negatif test (tenant A, tenant B verisini göremez) bu kural altında yaşar.

Aşağıdaki tablo test verisi disiplinini verir.

| Kural | Uygulama | Zorlama |
|---|---|---|
| Factory/builder | Override'lı varsayılan nesne | review |
| Tenant izolasyonu | Her test kendi tenant'ı + cross-tenant negatif test | RLS conformance testi (ref: data-rls-tenant-isolation) |
| Deterministik zaman | Sahte saat/clock | review; gerçek `Date`/`datetime.now` yasak |
| Deterministik rastgelelik | Sabit seed | review; `Math.random`/`random` yasak |

---

## 7. Contract Test ve Şema-Parite

Her Zod şeması ile onu tüketen JSON-as-DB verisi arasında parite testi bulunur: tüm `src/data/**/*.json` ilgili şemayla parse edilir ve hata = test başarısızlığı; bu `test-contract-schema-parity` (referans) kuralının tanımıdır. Bu, bu paketin *kendi* çıktısını da kapsar: bu anlatının hedeflediği `src/data/standards/*.json` sözleşmeleri `StandardContractSchema`'ya (`src/schemas/standard.ts`) uymak zorundadır ve şema-parite testi bunu doğrular. API yüzeyinde contract test tüketici beklentisini üretici çıktısına karşı doğrular (i14y §2 OpenAPI diff, GraphQL schema diff).

Uygulama şu şekilde yapılır: `standards.test.ts` (veya eşdeğer) her `src/data/standards/*.json`'u `StandardContractSchema.parse()` ile doğrular; şema değişince eski veriyi kıran migration aynı PR'da gelir. API contract testleri her kritik query/mutation için golden response tutar (`enterprise-dod.md` §2.4).

---

## 8. Flaky-Test Politikası

Flaky (kararsız, bazen geçen bazen kalan) test yasaktır ve iki kaynaktan kesilir: determinizm (§6) ve `no-skip-no-only` disiplini. Bu doküman iki kontrattaki ilgili kuralları tek politikada toplar. Ana dala (main) `it.only`/`describe.only` ile gelinemez; `.skip` yalnız issue referanslı (`// skip: #123`) ve geçici olabilir. Testler ağa/dış servise gerçek çağrı yapmaz (mock/stub/MSW) ve kapatılmamış kaynak (timer/handle) bırakmaz. Flaky-lik determinizm enjeksiyonuyla (sahte saat, sabit seed, sıra bağımsızlığı) kökten kesilir.

Uygulama şu şekilde yapılır: CI testleri `--shuffle`/`--repeat` ile koşarak sıra-bağımlılığı ve flaky-lik tespit edilir; sızan `only`/`skip` bir grep taraması + `biome (noFocusedTests)` ile bloklanır; dış çağrı MSW/mock ile kesilir. Bir test flaky bulunursa quarantine yerine kök-neden (genellikle zaman/rastgelelik/sıra) düzeltilir.

Aşağıdaki tablo flaky-kaynaklarını ve kesme yolunu verir.

| Flaky kaynağı | Kesme | Zorlama |
|---|---|---|
| Gerçek zaman/rastgelelik | Sahte saat + sabit seed | review (ref: test-data-factory-isolation) |
| Sıra bağımlılığı | Bağımsız test + `--shuffle` | CI flake tespiti |
| Gerçek ağ çağrısı | MSW/mock/stub | CI taraması (ref: test-no-skip-no-only) |
| Sızan `only`/`skip` | Grep + lint | biome noFocusedTests |
| Kapatılmamış kaynak | Timer/handle temizliği | review |

---

## 9. Merge Kapıları (quality-gates köprüsü)

Merge öncesi sekiz kapı bloklar; bunlar `quality-gates.json`'da (referans) tanımlıdır ve bu doküman değerlerini tekrar etmez, test-yazım disipliniyle (testing-strategy) ilişkisini gösterir. Herhangi bir kapı kırmızıysa merge yasaktır. Piramit (§2), test-önce (§3), e2e+axe (§4) ve coverage (§5) bu kapıların *girdisidir*: iyi yazılmış testler kapıları yeşil geçirir.

Aşağıdaki tablo sekiz kapıyı ve girdisini verir.

| Kapı | Koşul | Girdi |
|---|---|---|
| `gate-typecheck-zero` | `tsc --noEmit` 0 hata | tip disiplini |
| `gate-lint-zero` | `biome check` 0 hata/uyarı | lint/format |
| `gate-coverage-threshold` | line/branch ≥ %80, patch ≥ %90 | §5 coverage |
| `gate-e2e-axe-zero` | Playwright yeşil + axe 0 ihlal | §4 e2e+axe |
| `gate-perf-budget` | p95 ≤ 200ms, render ≤ 2500ms, bundle ≤ 250KB | perf testi |
| `gate-build-green` | `vite build` + Alembic diff temiz | build + migration |
| `gate-security-scan` | high/critical 0 + yasak paket yok | güvenlik taraması |
| `gate-dod-checklist` | DoD maddeleri işaretli | §3 test-önce + doküman |

---

## 10. Mutation ve Load Test (should)

Yüksek satır kapsamı zayıf testleri gizleyebilir; bu yüzden `engine/` kritik mantığı için mutasyon testi (Stryker) koşar ve mutasyon skoru ≥ %70 hedeflenir. Performans-duyarlı uçlar için yük/performans testi bir bütçe (ör. 1000 düğüm render < 200ms) iddia eder ve regresyonda bloklar. Bu `test-mutation-and-load` (referans) kuralının tanımıdır; severity `should` olduğundan eşik-altı raporlanır ve PR'da gerekçelendirilir, ama build'i her zaman bloklamaz. Yük bütçesi `gate-perf-budget` (§9) ile hizalıdır.

---

## 11. Stack Yasakları ve Güvenlik Kapısı

Test/kalite kapıları stack yasaklarını da zorlar: `gate-security-scan` (referans) yasak paketi (next, redux, supabase, antd, @mui/material vb.) ve `dangerouslySetInnerHTML`'i merge'de bloklar. Bu, `plan-02` ORTAK-GUARDRAIL'in (Next.js/Supabase/Prisma yasak) test-tarafı karşılığıdır ve `dependency-policy` standardıyla köprülüdür. Backend tarafında bağımlılık denetimi (pip-audit) ve OWASP odaklı statik tarama aynı kapıda koşar.

---

## 12. FastAPI + React + SQLAlchemy Karşılıkları

Aşağıdaki tablo bu standardın somut stack karşılıklarını verir; Next.js/Supabase/Prisma referansı yasaktır.

| Test/kalite kuralı | React/Vite (FE) | FastAPI (BE) | SQLAlchemy / PostgreSQL |
|---|---|---|---|
| Unit | Vitest | pytest | in-memory/fixture model |
| Integration | Vitest + MSW | pytest + testcontainer | test container PostgreSQL |
| E2E + axe | Playwright + @axe-core/playwright | (staging API'ye karşı) | seed/fixture veri |
| Contract/şema-parite | `standards.test.ts` (Zod parse) | schemathesis/golden response | JSON-as-DB parse |
| Factory + tenant izolasyon | test factory builder | factory + tenant fixture | RLS negatif test (ref: data-rls-tenant-isolation) |
| Determinizm | sahte saat + sabit seed | `freezegun` + seed | — |
| Coverage | Vitest `coverage.thresholds` | pytest-cov eşiği | — |
| Mutation | Stryker | mutmut (opsiyonel) | — |
| Merge kapıları | biome + tsc + build | ruff/mypy + build | Alembic diff |

---

## 13. Waterfall Fazlarıyla İlişki

Test & kalite disiplini `enterprise-dod.md`'nin waterfall fazlarına oturur: `test-plan` fazında test listesi + a11y kriterleri + coverage eşiği yazılır (test-önce), `development` fazında testle paralel implementasyon yapılır, `test-qa` fazında tüm testler + axe + coverage raporu yeşil olur, `verification` fazında e2e + a11y kapı geçişi zorunludur. Bir faz `phases[<faz>].passed === true` olmadan bir sonraki başlamaz.

Aşağıdaki tablo test eksenlerinin faz karşılığını verir.

| Eksen | Açılış fazı | Kapanış fazı |
|---|---|---|
| Test listesi + eşik | `test-plan` | `test-qa` |
| Unit/integration | `test-plan` → `development` | `test-qa` |
| E2E + axe | `test-qa` | `verification` |
| a11y (WCAG 2.2) | `test-plan` | `verification` |
| Merge kapıları | `development` | `test-qa` |

---

## 14. İlgili Kanonik Dokümanlar

| Doküman | Yol | Rolü |
|---|---|---|
| Test Stratejisi (makine) | `src/data/standards/testing-strategy.json` | *nasıl test yazılır*: piramit, test-önce, factory, contract, mutation |
| Kalite Kapıları (makine) | `src/data/standards/quality-gates.json` | *merge öncesi hangi kapılar bloklar*: 8 kapı |
| Veri & API Sözleşmesi (makine) | `src/data/standards/data-api-contract.json` | test-önce migration sırası + RLS tenant izolasyon testi köprüsü |
| Enterprise DoD | `docs/enterprise-dod.md` | §2.9-2.12 test katmanları + §1 test-önce waterfall |
| Numeronym sınıflandırması | `docs/standards/numeronym-siniflandirma.md` | E2E `testing`/must/P1; CI/CD `devops`/must/P0 |
| UI Bileşen standardı (makine) | `src/data/standards/ui-components.json` | a11y ekseninin bileşen-tarafı zorunluluğu |

---

## 15. Requirement-ID Tablosu

Aşağıdaki tablo test & kalite kurallarını izlenebilir Requirement-ID'lere döker; "Layer" sütununda kaynak kontrat kural-id'siyle işaretlidir (testing-strategy `test-*`, quality-gates `gate-*`). Öncelik P0 (merge-bloklayıcı, sistemsiz çalışmaz) → P3 (opsiyonel).

| ID | Requirement | Layer | Priority | TestType | AC | Owner |
|---|---|---|---|---|---|---|
| TQ-01 | Test piramidi: unit ≥%70, integration ~%20, e2e ≤%10 | testing | P1 | unit | Suite sayımı piramidi tutar; buz-kütlesi yok (ref: test-pyramid-distribution) | qa-platform |
| TQ-02 | Test-önce red→green: test kodu uygulama kodundan önce (sıra test→db-schema→dev) | testing | P0 | review | Commit sırası test önce; red kanıtı var (ref: test-first-red-green) | qa-platform |
| TQ-03 | Hata düzeltmesi önce regresyon testi içerir | testing | P1 | unit | Düzeltmede hatayı üreten test var (ref: test-first-red-green) | qa-platform |
| TQ-04 | E2E Playwright (chromium+webkit) + her sayfa axe 0 ihlal | testing | P0 | e2e | `violations.length===0`; ihlal = başarısızlık (ref: test-e2e-playwright-axe) | qa-platform |
| TQ-05 | E2E çoklu viewport (375/768/1280) + gerçek staging API | testing | P1 | e2e | Üç viewport yeşil; mock değil (ref: enterprise-dod §2.11) | qa-platform |
| TQ-06 | Kontrast ≥ 7:1 + klavye erişimi + görünür odak (merge kapısı) | quality-gate | P0 | e2e | axe + klavye/odak otomatik doğrulanır (ref: gate-e2e-axe-zero) | qa-platform |
| TQ-07 | WCAG taban 2.2 AA yüzeyde; AAA yüzey-hedefi | design | P1 | e2e | Tüketici yüzeyde AA geçilir (ref: dimensions.wcag, audit C3) | frontend-platform |
| TQ-08 | Coverage merge kapısı: line/branch ≥%80, patch ≥%90 | quality-gate | P0 | unit | Eşik-altı merge bloklu (ref: gate-coverage-threshold) | qa-platform |
| TQ-09 | Coverage strateji: global ≥%85, engine/ ≥%95, ratchet | testing | P1 | unit | Kapsam gerilemesi bloklanır (ref: test-coverage-threshold) | qa-platform |
| TQ-10 | Contract/şema-parite: her src/data/**/*.json şemayla parse | testing | P0 | contract | Parse hatası = başarısızlık (ref: test-contract-schema-parity) | qa-platform |
| TQ-11 | API contract test: kritik query/mutation golden response | testing | P1 | contract | Golden response uyumsuzluğu bloklar (ref: enterprise-dod §2.4) | api-platform |
| TQ-12 | Test verisi factory/builder; paylaşılan mutable fixture yok | testing | P1 | review | Elle fixture yok (ref: test-data-factory-isolation) | qa-platform |
| TQ-13 | Tenant izolasyon negatif test (cross-tenant okuma engellenir) | testing | P0 | integration | Tenant A, B verisini göremez (ref: data-rls-tenant-isolation) | security-platform |
| TQ-14 | Deterministik test: sahte saat + sabit seed + sıra bağımsız | testing | P1 | review | Gerçek Date/random yok; `--shuffle` yeşil (ref: test-data-factory-isolation) | qa-platform |
| TQ-15 | Flaky yasağı: only/skip main'e gelmez; skip yalnız issue-referanslı | testing | P0 | review | biome noFocusedTests + grep temiz (ref: test-no-skip-no-only) | qa-platform |
| TQ-16 | Testler gerçek ağ/dış servise çağrı yapmaz (MSW/mock) | testing | P1 | review | Gerçek ağ çağrısı yok (ref: test-no-skip-no-only) | qa-platform |
| TQ-17 | typecheck 0 (tsc --noEmit strict) | quality-gate | P0 | unit | Tek tip hatası merge bloklar (ref: gate-typecheck-zero) | platform-eng |
| TQ-18 | lint 0 (biome check, 0 hata/uyarı) | quality-gate | P0 | unit | Format/lint ihlali bloklar (ref: gate-lint-zero) | platform-eng |
| TQ-19 | build green (vite build + Alembic diff temiz) | quality-gate | P0 | integration | Kırmızı build/şema-diff bloklar (ref: gate-build-green) | platform-eng |
| TQ-20 | perf bütçesi: p95 ≤200ms, render ≤2500ms, bundle ≤250KB | quality-gate | P1 | e2e | Bütçe aşımı bloklar (ref: gate-perf-budget) | frontend-platform |
| TQ-21 | security scan: high/critical 0 + yasak paket yok | quality-gate | P0 | integration | Yasak paket/yüksek CVE bloklar (ref: gate-security-scan) | security-platform |
| TQ-22 | Mutation skoru ≥%70 (engine/) + yük bütçesi | testing | P2 | unit | Eşik-altı raporlanır+gerekçe; yük regresyonu bloklar (ref: test-mutation-and-load) | qa-platform |
| TQ-23 | DoD checklist tüm maddeleri işaretli | quality-gate | P1 | review | Eksik madde bloklar (ref: gate-dod-checklist) | qa-platform |

Bu dosya bir anlatı standardıdır; kural değerlerini `src/data/standards/testing-strategy.json` ve `src/data/standards/quality-gates.json` sözleşmelerinden devralır veya onlara referans verir, kopyalamaz. Kurallar değişince yalnız JSON güncellenir; anlatı aynı sözleşmeleri işaret ettiği için tutarlı kalır.
