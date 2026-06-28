# Enterprise-Ready App — Definition of Done (DoD)

**Tarih:** 2026-06-28
**Kapsam:** 50+ enterprise-grade app fabrikası için ortak DoD standartı.
**Platform stack (hedef):** FastAPI + GraphQL + PostgreSQL (SQLAlchemy 2.0/SQLModel + Alembic) + React/Vite/TanStack.
**actionplan stack:** Vite + React 19 + TypeScript + TanStack + Tailwind + Radix + Zod + Vitest + Playwright/axe + Biome.
**Şema referansı:** `src/schemas/task.ts` — gerçek alan adları doğrulanmış (uydurma yok).

---

## 1. Genel Prensip: Test-Önce Waterfall

Bu DoD, actionplan'ın 7 waterfall fazını (`WATERFALL_PHASES`) temel alır. Her katmanın kapı kriteri, faz sırasına göre yerleştirilmiştir. Bir önceki fazın `phases[<faz>].passed === true` olmadan bir sonraki faz başlatılamaz.

Faz sırası (şemadan doğrulanmış):

1. `requirements` — Gereksinim
2. `test-plan` — Test planı (test-önce)
3. `db-schema` — DB / şema tasarımı
4. `development` — Geliştirme
5. `test-qa` — Test / QA
6. `verification` — Doğrulama
7. `release-maintenance` — Yayın / Bakım

Her kapı (`PhaseGate`): `status: "passed"`, `passed: true`, `criteria` dizisi dolu, `notes` alanı dolu.

---

## 2. Enterprise DoD — Katman Katman Kriterler

Aşağıdaki her katman şu yapıyla tanımlanmıştır:

- **Ne zaman DONE sayılır:** davranışsal, test edilebilir kriter.
- **Hangi kanıt (evidence) gerekir:** görevün `evidence[]` alanına girilecek ölçülebilir belge.

Her katman, hangi waterfall fazında kapandığını ayrıca belirtir.


### 2.1 Tenant (Çok-Kiracılık)

Bu katman, platformun aynı veritabanı ve uygulama katmanı üzerinde birden fazla müşteriyi yalıtılmış biçimde barındırma yeteneğini kapsar. Multi-tenant olmadan üretimde çalışan hiçbir app enterprise-ready sayılmaz.

**Ne zaman DONE sayılır:**
- Her API çağrısı `tenant_id` bağlamını taşır; `tenant_id` olmayan istek 401/403 döner.
- PostgreSQL satır düzeyi güvenliği (RLS) veya şema-ayrımı stratejisi uygulanmış ve Alembic migration'larında belgelenmiş.
- Bir tenant'ın verisi başka bir tenant'a asla görünmez (çapraz-tenant sızıntısı = blocker).
- Tenant silme işlemi, ilgili tüm veriyi geri dönülemez biçimde kaldırır (GDPR right-to-erasure).

**Hangi kanıt gerekir:**
- `tenant_isolation_test.py` — çapraz-tenant erişim denemelerinin tümünün 403 döndüğünü kanıtlayan otomatik test raporu.
- Alembic migration dosyası: RLS policy veya şema ayrımı.
- Manuel pen-test özeti (en az 2 senaryo).

**Kapandığı faz:** `db-schema` (şema kararı) → `test-qa` (sızıntı testleri) → `verification` (kapı geçer).


### 2.2 Auth / Authz (Kimlik Doğrulama ve Yetkilendirme)

Auth, kimlik doğrulamayı (sen kimsin?) kapsar; authz ise yetki denetimini (ne yapabilirsin?). Her ikisi de ayrı teste tabi tutulmalıdır.

**Ne zaman DONE sayılır:**
- JWT / OAuth2 token akışı uygulanmış; refresh token rotasyonu mevcut.
- RBAC (role-based access control) veya ABAC modeli şemaya işlenmiş; her endpoint `@require_permission("X")` ile korunuyor.
- Password politikası (min uzunluk, hashing algoritması: bcrypt/argon2) belgelenmiş.
- Session timeout, concurrent session sınırı uygulanmış.
- OWASP Top 10'dan auth kaynaklı riskler (A01, A07) test kapsamında.

**Hangi kanıt gerekir:**
- OWASP ZAP veya eşdeğer araç raporu (kritik bulgu = 0).
- Birim testler: RBAC matrisinin her hücresini (rol x işlem) kapsar.
- Token süresi dolmuş istek → 401 dönüşünü gösteren Playwright testi.

**Kapandığı faz:** `test-plan` (test matrisi) → `development` (implementasyon) → `test-qa` (OWASP tarama) → `verification`.


### 2.3 DB Şema + Migration

Veritabanı şeması, uygulamanın sözleşmesidir. Migration stratejisi olmadan schema drift enterprise ortamda felakete dönüşür. Platform stack'i PostgreSQL + Alembic'i zorunlu kılmaktadır.

**Ne zaman DONE sayılır:**
- SQLModel/SQLAlchemy modelleri `ProdDataPolicy`'ye uygun: `append-only` veya `expand-contract` modunda.
- Her DDL değişikliği Alembic migration dosyasına karşılık gelir (migration = deployment unit).
- Migration'lar CI'da otomatik çalışır, rollback adımı (`downgrade()`) dolu.
- Production'da doğrudan DDL yasak; tüm değişiklik migration üzerinden geçer.
- `requireSnapshot: true` — migration öncesi DB snapshot kanıtı.

**Hangi kanıt gerekir:**
- Alembic migration dosyaları listesi (her migration: `upgrade()` + `downgrade()` dolu).
- CI pipeline log: migration'ın boş DB'ye ve mevcut prod sürümüne karşı başarıyla uygulandığı.
- Rollback testi: `alembic downgrade -1` sonrası uygulama çalışmaya devam ediyor.

**Kapandığı faz:** `db-schema` kapısında tamamlanır; `verification`'da snapshot kanıtı eklenir.


### 2.4 API Sözleşmesi (GraphQL Şema / Contract)

Platform GraphQL API sunar. Şema kırılmayan (non-breaking) değişiklik politikası olmadan, 50+ app fabrikasında sözleşme uyumsuzluğu kaçınılmazdır.

**Ne zaman DONE sayılır:**
- GraphQL şeması versiyonlanmış; her kırılgan değişiklik deprecation + migration notu taşır.
- Otomatik schema diffing CI'da çalışır (örn. graphql-inspector); kırıcı değişiklik = build fail.
- Her mutation için input validation (Pydantic/Zod eşdeğeri) ve hata tipleri (`UserError` vs `SystemError`) standart.
- Playground / introspection production'da devre dışı; yalnızca staging'de açık.

**Hangi kanıt gerekir:**
- GraphQL şema dosyası (SDL) versiyonlanmış depoda.
- graphql-inspector veya eşdeğer CI çıktısı: kırıcı değişiklik yoksa yeşil.
- Contract test raporu: her kritik query/mutation için golden response.

**Kapandığı faz:** `test-plan` (contract tanımı) → `development` (implementasyon) → `test-qa` (contract testler).


### 2.5 UI Surface (Kullanıcı Arayüzü)

UI, kullanıcının doğrudan temas ettiği yüzeydir. "Bitti" demek ekranın render olması değil; kararlaştırılan use case akışlarının tamamının işlemesi ve test edilmesidir.

**Ne zaman DONE sayılır:**
- Tüm `deliverables[]` listelenen UI ekranları tamamlanmış.
- `acceptanceCriteria[]` dizisindeki her kriter bir Playwright testi ile karşılanmış.
- Tasarım tokenları (Tailwind + Radix) kullanılmış; hardcoded renk/boyut yok.
- Responsive: 320px — 1920px arası kırılmıyor (Playwright viewport testleri).
- Error boundary ve loading state her rotada mevcut.

**Hangi kanıt gerekir:**
- Playwright test raporu: tüm `acceptanceCriteria` senaryoları geçmiş.
- Storybook veya visual regression snapshot (opsiyonel ama önerilen).
- Lighthouse performans skoru: LCP < 2.5s, CLS < 0.1.

**Kapandığı faz:** `development` → `test-qa`.


### 2.6 Audit Log (Denetim Kaydı)

Enterprise müşteriler için denetim izi yasal zorunluluktur (SOC 2, ISO 27001, KVKK/GDPR). Her veri mutasyonu izlenebilir ve değiştirilemez olmalıdır.

**Ne zaman DONE sayılır:**
- Her CREATE/UPDATE/DELETE işlemi `actor_id`, `tenant_id`, `timestamp`, `resource_type`, `resource_id`, `diff` alanlarıyla kaydedilir.
- Audit kayıtları uygulama kodu tarafından değiştirilemez (append-only tablo veya immutable log store).
- Belirli zaman aralığı için audit raporu üretilebilir (API veya UI).
- Log tutma süresi politikası tanımlanmış (örn. 7 yıl).

**Hangi kanıt gerekir:**
- Audit log tablosu migration dosyası.
- Otomatik test: kayıt oluştur → audit logda görün → kaydı sil → audit logda hala görün.
- Log export dosyası örneği (JSON/CSV).

**Kapandığı faz:** `db-schema` (tablo tasarımı) → `test-qa` (immutability testi).


### 2.7 Import / Export

Veri taşınabilirliği hem müşteri güveni hem de GDPR data portability maddesi için zorunludur.

**Ne zaman DONE sayılır:**
- En az bir standart format desteklenir: CSV, JSON, veya XLSX (domain'e göre).
- Import işlemi idempotent: aynı dosya iki kez yüklendiğinde duplicate oluşmaz.
- Import sırasında validation hatası, kısmi başarı veya tam hata raporlanır.
- Export dosyası şifreli aktarım (HTTPS) ile indirilir; geçici URL en fazla 15 dakika geçerlidir.
- Büyük veri seti için async export + webhook/email bildirim akışı mevcut.

**Hangi kanıt gerekir:**
- Import/export uçtan-uca Playwright veya API testi (5k+ satır ile test edilmiş).
- Duplicate-safety testi raporu.
- Export URL expire testi.

**Kapandığı faz:** `development` → `test-qa`.


### 2.8 Observability (Log / Metrik / Trace)

Bir sistemin production'da ne yaptığını bilmeden destek veremezsiniz. Observability, üç sütuna dayanır: structured log, metrik ve distributed trace.

**Ne zaman DONE sayılır:**
- Structured JSON logging (correlation_id, tenant_id, user_id, request_id her log satırında).
- Her endpoint için latency, error rate, throughput metrikleri Prometheus/OpenMetrics formatında yayılıyor.
- Distributed trace (OpenTelemetry) uygulanmış; kritik akışların trace'i görünür.
- Alert kuralları tanımlanmış: p99 > 1s veya error rate > 1% → uyarı.
- Log seviyesi runtime'da değiştirilebilir (production'da DEBUG'ı açabilmek için).

**Hangi kanıt gerekir:**
- Örnek Grafana/dashboard screenshot (CI'da değil, staging kanıtı yeterli).
- Alert kuralı dosyası (YAML/JSON).
- Trace ID ile request-to-response akışını gösteren örnek trace.

**Kapandığı faz:** `development` (enstrümantasyon) → `verification` (alert ve dashboard doğrulama).


### 2.9 Unit Testler

Birim testler, tekil fonksiyon ve modül davranışlarını izole eder. Platform backend için pytest, frontend için Vitest kullanılır.

**Ne zaman DONE sayılır:**
- Kritik iş mantığı (servis katmanı, validator, hesaplama) %80+ satır kapsamı.
- Her `acceptanceCriteria[]` maddesi için en az bir birim test yazılmış.
- Test süresi < 60s (CI'da).
- Mutation testing (mutmut/stryker) çalıştırılmış; mutation skoru > %70.

**Hangi kanıt gerekir:**
- Coverage raporu (HTML veya XML) artifact olarak CI'da saklı.
- Mutation test özet raporu.

**Kapandığı faz:** `test-plan` (test listesi yazılır) → `development` (implementasyonla paralel) → `test-qa` (final rapor).


### 2.10 Integration / API Testleri

Birim testler yeterli değildir; bileşenler arası sözleşmelerin test edilmesi gerekir.

**Ne zaman DONE sayılır:**
- Her GraphQL mutation ve kritik query için integration testi mevcut (gerçek DB — test container).
- Çapraz-servis sözleşme testleri: consumer-driven contract (Pact veya eşdeğeri) veya API test suite.
- Hata senaryoları (DB timeout, üçüncü taraf servis başarısızlığı) da test kapsamında.
- Test'ler CI'da izole container ortamında çalışır (production DB'ye dokunmaz).

**Hangi kanıt gerekir:**
- CI artifact: integration test HTML raporu.
- Container-based test infrastructure dosyası (docker-compose.test.yml veya pytest fixtures).

**Kapandığı faz:** `test-plan` (senaryo listesi) → `test-qa` (tüm testler geçmeli).


### 2.11 End-to-End (E2E) Testler

E2E testler, gerçek kullanıcı akışlarını uçtan uca doğrular. Platform frontend'i için Playwright kullanılır.

**Ne zaman DONE sayılır:**
- En az happy path ve en kritik sad path her önemli akış için Playwright testinde kapsamlı.
- Testler staging ortamına karşı çalışır (mock değil, gerçek API).
- Çoklu viewport (mobile 375px, tablet 768px, desktop 1280px) testleri geçer.
- Test sonuçları CI artifact olarak saklanır (video + screenshot on failure).

**Hangi kanıt gerekir:**
- Playwright HTML raporu (tüm testler yeşil).
- CI artifact: failure screenshot'ları (hiç failure yoksa bildirilmiş).

**Kapandığı faz:** `test-qa` → `verification` (kapı geçişi için Playwright raporu zorunlu).


### 2.12 Erişilebilirlik — a11y (WCAG 2.2)

WCAG 2.2 AA uyumluluğu, 50+ app fabrikasında her app için taban çizgisidir. Axe-core entegrasyonu actionplan'ın mevcut Playwright + axe stack'iyle doğrudan çalışır.

**Ne zaman DONE sayılır:**
- axe-core otomatik taraması: kritik ve serious ihlal = 0.
- Klavye navigasyonu: her interaktif element Tab sırasıyla erişilebilir, focus halkası görünür.
- ARIA etiketleri: her form alanı, ikon butonu, modal doğru aria-label/role taşır.
- Renk kontrastı: AA seviyesi minimum (4.5:1 metin, 3:1 UI bileşen).
- Screen reader: NVDA veya VoiceOver ile kritik akış okunabilir (manuel test notu).

**Hangi kanıt gerekir:**
- axe-core Playwright raporu: 0 kritik/serious ihlal.
- Manuel a11y test notu (screen reader + klavye turu).
- WCAG 2.2 AA checklist (en az kritik bölümler işaretli).

**Kapandığı faz:** `test-plan` (a11y kriterleri `acceptanceCriteria[]`'ya girer) → `test-qa` (axe raporu) → `verification`.


### 2.13 Deployment

Deployment, tekrarlanabilir, izlenebilir ve geri alınabilir olmalıdır. Platform stack'i için hedef: Docker + Kubernetes (Swarm uyumlu) veya shared hosting senaryosu.

**Ne zaman DONE sayılır:**
- Dockerfile ve docker-compose üretimde test edilmiş.
- CI/CD pipeline: main'e merge → otomatik build → otomatik staging deploy.
- Environment variable yönetimi: sır (secret) kod deposunda yok; vault veya env-injection kullanılıyor.
- Zero-downtime deployment: rolling update veya blue-green stratejisi uygulanmış.
- Health check endpoint (`/health`) mevcut ve load balancer tarafından kullanılıyor.

**Hangi kanıt gerekir:**
- CI/CD pipeline başarı log'u (son deploy).
- Dockerfile lint raporu (hadolint).
- Health check endpoint çıktısı (JSON, status: "ok").

**Kapandığı faz:** `development` (Dockerfile) → `verification` (staging deploy doğrulama) → `release-maintenance` (prod deploy).


### 2.14 Rollback

Rollback planı olmadan hiçbir deploy enterprise-grade değildir. Hem uygulama hem de veritabanı katmanında ayrı rollback prosedürü zorunludur.

**Ne zaman DONE sayılır:**
- `rollback` alanı dolu: uygulama katmanı rollback adımları düz dil açıklamayla yazılmış.
- Alembic `downgrade()` prosedürü test edilmiş ve çalışır durumda.
- Rollback süresi SLA'ya dahil: "N dakika içinde önceki sürüme dönülür" taahhüdü verilmiş.
- Rollback kararı kimin vereceği `owner` alanına işlenmiş.

**Hangi kanıt gerekir:**
- Rollback testi logu: staging'de deploy → rollback → önceki sürüm çalışıyor.
- Alembic downgrade testi logu.
- Runbook'ta rollback bölümü.

**Kapandığı faz:** `db-schema` (Alembic downgrade) → `release-maintenance` (prod rollback prosedürü).


### 2.15 Docs / Runbook

Belgeleme, bir özelliğin operasyonel tesliminin parçasıdır. "Çalışıyor ama kimse bilmiyor" enterprise'ta done sayılmaz.

**Ne zaman DONE sayılır:**
- API referansı: her endpoint/mutation için parametre, örnek istek/yanıt, hata kodları.
- Runbook: en az şu başlıklar var: "Nasıl çalıştırılır", "Nasıl izlenir", "Hata senaryoları ve çözümleri", "Rollback".
- ADR (Architecture Decision Record): önemli teknik kararlar `refs[]` alanında bağlantılı.
- Onboarding rehberi: yeni geliştirici ilk gün dev ortamını kurabilir.

**Hangi kanıt gerekir:**
- `refs[]` dizisinde belge linkleri mevcut.
- Runbook dosyası depoda mevcut (doğrulanmış yol).
- Yeni geliştirici walkthrough notu (en az bir kez test edilmiş).

**Kapandığı faz:** `verification` → `release-maintenance`.


### 2.16 Owner (Sahip)

Her enterprise görev ve özelliğin tek, sorumlu sahibi olmalıdır. Sahipsiz özellik üretimde bakımsız kalır.

**Ne zaman DONE sayılır:**
- `owner` alanı dolu (null değil); `assignees[]` dizisi rollere göre dolu.
- Escalation path tanımlanmış: owner müsait değilse kim devralır.
- Review kapılarında owner onayı alınmış (`phases[<faz>].passed === true`).

**Hangi kanıt gerekir:**
- `owner` alanı non-null değer içeriyor.
- `assignees[]` dizisi boş değil.
- Her faz kapısında `notes` alanında onay kaydı.

**Kapandığı faz:** `requirements` (sahip atanır, kapı açılmaz).


### 2.17 Risk Kaydı

Risk yönetimi tepkisel değil, proaktif olmalıdır. Her risk tanımlanmış, değerlendirilmiş ve azaltma planı olan bir kayıt olarak tutulur.

**Ne zaman DONE sayılır:**
- `risks[]` dizisi dolu: her risk `id`, `desc`, `severity`, `mitigation` alanlarına sahip.
- Kritik severity'deki riskler `criticalPath: true` olan düğümlerle bağlantılı.
- Risk azaltma aksiyonları `ecaRules[]` veya `acceptanceCriteria[]` ile otomasyona bağlanmış.
- Review toplantısında risk gündemde yer almış (`phases[<faz>].notes` içinde kaydedilmiş).

**Hangi kanıt gerekir:**
- `risks[]` dizisinde en az 3 kayıt (uygulama büyüklüğüne göre ölçekli).
- Kritik severity risklerin `phases["verification"].notes`'ta kapatılmış olması.

**Kapandığı faz:** `requirements` → sürekli güncelleme → `verification`'da tümü kapatılmış veya kabul edilmiş.


### 2.18 Dependency (Bağımlılık Yönetimi)

Bağımlılıklar hem teknik (kütüphane/servis) hem de organizasyonel (başka ekip/app) boyutundadır. Her ikisi de izlenebilir olmalıdır.

**Ne zaman DONE sayılır:**
- `dependsOn[]` ve `blocks[]` dizileri güncel; dairesel bağımlılık yok.
- Teknik bağımlılıklar (npm, pip paketleri): kilit dosyası (`package-lock.json`, `requirements.txt`) versiyonlanmış.
- Güvenlik açığı taraması CI'da çalışır: kritik CVE = 0 (npm audit / pip-audit).
- Üçüncü taraf servis bağımlılıkları `refs[]` ile SLA belgelerine bağlanmış.

**Hangi kanıt gerekir:**
- `npm audit --audit-level=critical` veya `pip-audit` çıktısı: 0 kritik.
- `dependsOn[]` ve `blocks[]` dizilerinde dangling ID yok (orphan check).

**Kapandığı faz:** `requirements` → `release-maintenance` (audit otomasyonu sürekli).

---

## 3. Şema-Boşluk Haritası

Her DoD katmanını mevcut `TaskNode` şemasına eşleyen bu tablo, hangi ihtiyacın mevcut alanlarla karşılandığını, hangisinin eksik olduğunu ve ne önerildiğini gösterir. "EKSİK" olarak işaretlenen alanlar, mevcut şemada tanımlanmamıştır; bunlar Prompt 5 kapsamında yeni şema alanı önerisi olarak bağlamlandırılır.

| DoD Katmanı | Mevcut Şema Alanı | Durum | Öneri |
|---|---|---|---|
| Tenant izolasyonu | `tags[]`, `dimensions["security"]` | KISMI | `tenantStrategy: "rls" | "schema" | "db"` yeni alan önerisi |
| Auth / Authz | `dimensions["security"]`, `dimensions["owasp"]`, `acceptanceCriteria[]` | VAR | `dimensions["security"].items` + `acceptanceCriteria[]` yeterli; OWASP testi için `evidence[]` kullanılır |
| DB şema + migration | `phases["db-schema"]`, `rollback`, `source` | VAR | `migrationMode` için `agentPolicy.prodDataPolicy.migrationModes[]` mevcut; migration dosya yolu için `repoPath` yeni alan önerisi |
| API sözleşmesi | `refs[]`, `dimensions["integration"]`, `acceptanceCriteria[]` | VAR | Contract dosya URL'i `refs[]`'e girilir; `schemaVersion` contract sürümüne karşılık gelir |
| UI surface | `deliverables[]`, `acceptanceCriteria[]`, `dimensions["featureDefs"]`, `dimensions["mobileApps"]` | VAR | Viewport breakpoint listesi `dimensions["mobileApps"].items`'a yazılabilir |
| Audit log | `evidence[]`, `dimensions["security"]` | KISMI | Audit log endpoint veya tablo yolunu tutacak `auditLogRef` yeni alan önerisi |
| Import / Export | `deliverables[]`, `acceptanceCriteria[]` | VAR | Format listesi `deliverables[]`'a; async export akışı `ecaRules[]` ile modellenebilir |
| Observability | `metrics[]`, `dimensions["eca"]`, `evidence[]` | KISMI | `metrics[].key` log/trace metrik adını, `metrics[].target` SLO'yu taşır; dashboard URL için `deployTarget` yeni alan önerisi |
| Unit testler | `phases["test-plan"]`, `phases["test-qa"]`, `evidence[]`, `dimensions["testing"]` | VAR | Coverage eşiği `phases["test-plan"].criteria[]`'ya, rapor URL'i `evidence[]`'a girer |
| Integration / API testler | `phases["test-qa"]`, `evidence[]`, `dimensions["testing"]` | VAR | `testCommand` yeni alan önerisi: CI'da çalıştırılacak komut satırını makine-okunur tutar |
| E2E testler | `phases["test-qa"]`, `phases["verification"]`, `evidence[]`, `dimensions["testing"]` | VAR | Playwright rapor arşiv URL'i `evidence[]`'a; `deployTarget` staging URL'ini taşır |
| a11y (WCAG 2.2) | `dimensions["wcag"]`, `acceptanceCriteria[]`, `evidence[]` | VAR | axe-core rapor URL'i `evidence[]`'a; WCAG kontrol listesi `dimensions["wcag"].items`'a |
| Deployment | `phases["release-maintenance"]`, `dimensions["deployment"]`, `rollback` | VAR | CI/CD pipeline URL'i `refs[]`'e; `deployTarget` yeni alan önerisi: prod/staging ortam URL'ini makine-okunur tutar |
| Rollback | `rollback`, `phases["db-schema"]`, `agentPolicy.prodDataPolicy.requireRollback` | VAR | `rollback` alanı düz metin; Alembic komut satırı `rollback`'e yazılabilir |
| Docs / Runbook | `refs[]`, `deliverables[]` | VAR | Runbook dosya yolu `refs[]`'e; ADR linkleri zaten `refs[]`'de |
| Owner | `owner`, `assignees[]`, `phases[*].notes` | VAR | Hiçbir ek alan gerekmez; `owner` null kontrolü governance rule olarak `ecaRules[]`'e eklenebilir |
| Risk kaydı | `risks[]` (`id`, `desc`, `severity`, `mitigation`) | VAR | `risks[]` yapısı eksiksiz; `criticalPath` ile ilişkilendirme mevcut |
| Dependency | `dependsOn[]`, `blocks[]`, `refs[]`, `related[]` | VAR | Güvenlik açığı tarama raporu URL'i `evidence[]`'a girer |

---

## 4. Önerilen Yeni Alan Sınıflandırması

Tabloda "yeni alan önerisi" olarak işaretlenen alanlar, mevcut şemada eksiktir. Aşağıdaki tablo her önerilen alan için yönetim türünü belirtir.

"MANUEL governance": insan el ile doldurur, otomasyon doğrulayabilir.
"GENERATED": CI veya AI süreci üretir, insan onaylar.
"Yeni şema alanı": `TaskNodeSchema`'ya eklenmesi önerilen alan.

| Önerilen Alan | Tür | Açıklama |
|---|---|---|
| `repoPath` | Yeni şema alanı — MANUEL governance | Migration dosyaları, Dockerfile, test komutlarının depo kökünden göreli yolu. `string` veya `string[]`. |
| `testCommand` | Yeni şema alanı — GENERATED | CI'da çalıştırılacak test komut satırı (ör. `"pytest tests/ -x -v"`). Ajan bu alanı öneri olarak üretebilir, insan onaylar. |
| `deployTarget` | Yeni şema alanı — GENERATED | Staging ve prod ortam URL'leri veya Kubernetes namespace. Deployment otomasyonu için makine-okunur referans. |
| `tenantStrategy` | Yeni şema alanı — MANUEL governance | `"rls" | "schema" | "db"` enum. Çok-kiracılık izolasyon kararını şemada standart hale getirir. |
| `auditLogRef` | Yeni şema alanı — GENERATED | Audit log tablosunun veya log servisinin referansı (tablo adı veya URL). |
| `implementationStatus` | Yeni şema alanı — GENERATED | Mevcut `status` enum (`backlog | todo | in-progress | blocked | review | done`) üzerine ek: teknik debt, deprecated gibi platform-özgü değerler gerekirse genişletilebilir; aksi hâlde `status` yeterlidir. |

> Not: `implementationStatus`, mevcut `status` (`TaskStatusSchema`) değerlerinin büyük çoğunluğu için yeterlidir. Yalnızca "deprecated" veya "frozen" gibi platform-özgü lifecycle değerleri gerektiğinde yeni alan eklenmelidir.

---

## 5. DoD — Waterfall Fazları İlişki Haritası

Her DoD katmanının hangi waterfall fazında açıldığı, hangi fazda kapandığı aşağıda özetlenmiştir. Faz geçişi için `phases[<faz>].passed === true` ve `phases[<faz>].criteria` dizisi boş olmamalıdır.

| DoD Katmanı | Açılış Fazı | Kapanış Fazı | Kapı Kriteri Alanı |
|---|---|---|---|
| Tenant izolasyonu | `db-schema` | `verification` | `phases["db-schema"].criteria` + `evidence[]` |
| Auth / Authz | `test-plan` | `verification` | `phases["test-plan"].criteria` + `dimensions["security"]` |
| DB şema + migration | `db-schema` | `verification` | `phases["db-schema"].passed` + `rollback` dolu |
| API sözleşmesi | `test-plan` | `test-qa` | `phases["test-plan"].criteria` + `refs[]` |
| UI surface | `development` | `test-qa` | `deliverables[]` + `acceptanceCriteria[]` |
| Audit log | `db-schema` | `test-qa` | `phases["db-schema"].criteria` + `evidence[]` |
| Import / Export | `development` | `test-qa` | `deliverables[]` + `evidence[]` |
| Observability | `development` | `verification` | `metrics[]` + `evidence[]` |
| Unit testler | `test-plan` | `test-qa` | `phases["test-plan"].criteria` + `evidence[]` |
| Integration testler | `test-plan` | `test-qa` | `phases["test-qa"].criteria` + `evidence[]` |
| E2E testler | `test-qa` | `verification` | `phases["test-qa"].passed` + `evidence[]` |
| a11y (WCAG 2.2) | `test-plan` | `verification` | `dimensions["wcag"]` + `evidence[]` |
| Deployment | `development` | `release-maintenance` | `phases["release-maintenance"].criteria` + `refs[]` |
| Rollback | `db-schema` | `release-maintenance` | `rollback` dolu + `phases["release-maintenance"].notes` |
| Docs / Runbook | `verification` | `release-maintenance` | `refs[]` + `deliverables[]` |
| Owner | `requirements` | `requirements` | `owner` non-null + `assignees[]` boş değil |
| Risk kaydı | `requirements` | `verification` | `risks[]` boş değil + `phases["verification"].notes` |
| Dependency | `requirements` | `release-maintenance` | `dependsOn[]` geçerli IDs + `evidence[]` |

---

## 6. Sonuç ve Çelişki Notları

**Genel bulgu:** `src/schemas/task.ts`'in mevcut `TaskNode` şeması, 18 DoD katmanının büyük çoğunluğunu karşılamaktadır. `acceptanceCriteria[]`, `deliverables[]`, `risks[]`, `rollback`, `evidence[]`, `metrics[]`, `dimensions`, `phases`, `ecaRules[]` ve `agentPolicy` birlikte enterprise governance için güçlü bir temel oluşturur.

**Gerçek eksikler:** Şemada makine-okunur olarak bulunmayan beş alan önerilmiştir: `repoPath`, `testCommand`, `deployTarget`, `tenantStrategy`, `auditLogRef`. Bu beş alan, mevcut `evidence[]` ve `refs[]` içinde düz metin olarak tutulabilir; ancak otomasyon (CI entegrasyonu, AI ajan hedefleme) için ayrı şema alanı olmaları avantaj sağlar.

**Prompt 5 bağlantısı:** Önerilen beş yeni alan, Prompt 5 platform WBS düğümü oluşturma aşamasında `TaskNode` şemasına eklenmek üzere tasarlanmıştır. Bu dosya tasarım raporudur; hiçbir kod veya veri dosyasına dokunulmamıştır.

**Çelişki yok:** Şemadan okunan tüm alan adları (`wbsCode`, `level`, `phases`, `WATERFALL_PHASES`, `DIMENSION_KEYS`, `acceptanceCriteria`, `deliverables`, `risks`, `rollback`, `evidence`, `metrics`, `dimensions`, `ecaRules`, `agentPolicy`, `criticalPath`, `state`, `owner`, `assignees`, vb.) `src/schemas/task.ts` gerçek içeriğiyle tam uyumludur. Uydurulmuş alan adı kullanılmamıştır.
