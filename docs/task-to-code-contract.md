# Task-to-Code Sözleşmesi — WBS Düğümünün Yazılım-Teslimat Karşılığı

**Sürüm:** 1.0 · **Tarih:** 2026-06-29  
**Durum:** Kanonik, bağlayıcı — bu dokümanla çelişen her yönerge geçersizdir.  
**Kapsam:** actionplan'daki her WBS düğümü + 7 waterfall fazı.  
**Aktörler:** Kullanıcı/Admin (insan), AI ajan (swarm), CI (GitHub Actions), Geliştirici.

---

## Önsöz — Bu Sözleşme Neden Var

actionplan bir WBS planlayıcısıdır; kod actionplan'da değil, `platform` monoreposundadır. Bu iki dünya arasındaki köprü kurulmadığında şu yanlış anlaşılma kaçınılmaz olur: geliştirici bir görev sayfası açar, sayfada "Customer Veri Modeli" yazar, ne yapacağını bilemez. Kod mu yazacak? Toplantı mı? PR mi açacak?

Bu sözleşme şunu netleştirir: bir düğümün hangi seviyede olduğu ve o anda hangi waterfall fazında bulunduğu, geliştiricinin atacağı sonraki adımı tek satırla belirler. Tahmin yoktur, soru işareti yoktur.

Temel ayrımı baştan koy: app ve module düğümleri kapsam ve sözleşme yöneticisidir, kod yazan değil. archetype ve altı somut kod + test görevidir.

---

## 1. Seviye → Teslimat Anlamı

Her WBS seviyesinin doğa metaforu bir büyüklük/soyutluk sinyalidir; gerçek yazılım karşılığı ise aşağıdaki tabloda.

Tablo okunuşu: "Kod yazılır mı?" sütunu platform monoreposuna gerçek kod commit edilip edilmeyeceğini gösterir. actionplan JSON'larını düzenlemek kod değil, veri güncellemesidir; o sütunun dışındadır.

| Seviye | Metafor | Yazılım karşılığı | Kod yazılır mı? | Branch açılır mı? | PR/merge? | Deploy? | Evidence zorunlu mu? |
|---|---|---|---|---|---|---|---|
| app | dağ | Ürün ailesi / portföy. Bir release train'in tepe düğümü. Altındaki tüm modülleri kapsayan tek bir deployment birimi tanımlar. | Hayır | Hayır | Hayır | Release train tamamlandığında | Yalnızca kapsam, ADR ve ilk dikey dilim çıktısı |
| module | kaya | Bounded context / paket. Tek bir iş alanına kapalı sınır; ayrı paket kökü, kendi contract'ı ve bağımlılık listesi. PR/merge burada anlam kazanır. | Yalnızca sözleşme dosyaları (şema, ADR, test stratejisi) | Opsiyonel (contract-module/...) | Evet; contract değişikliği PR gerektirir | Modül kendi başına deploy edilemez; app'in release train'inde gider | Contract, bağımlılık matrisi, test strateji belgesi |
| archetype | büyük taş | Domain model + sözleşme projeksiyonu. Entity tanımı, API yüzeyi (GraphQL tipi), UI bileşen haritası ve migration şeması bir arada. | Evet; skeleton model, şema taslağı, Alembic migration | Evet (archetype/...) | Evet; en az 1 reviewer | Staging'e deploy edilebilir birim başlar | DB migration, GraphQL şema dosyası, Playwright smoke testi |
| stone | orta taş | Somut özellik. Tek bir kullanıcı hikayesini ya da servis metodunu karşılayan, bağımsız test edilebilir kod parçası. | Evet | Evet (stone/...) | Evet | Staging | Birim + entegrasyon test raporu |
| molecule | küçük taş | Alt özellik / bileşen. Bir stone'un ayrıştırılmış parçası; tek bir sınıf, resolver, hook veya UI bileşeni. | Evet | Evet (molecule/...) | Evet (önce stone ile birleştirilebilir) | Stone tamamlanınca | Birim test geçti kanıtı |
| element | toz tanesi | Tekil işlev / test. Bir fonksiyon, bir Pydantic doğrulayıcı, bir CSS kuralı. | Evet | Evet (element/... veya üst branch'te) | Üst PR'a dahil | Molecule/stone tamamlanınca | İlgili test geçti |
| atom | atom | En küçük bölünemez adım. Tek satır değişiklik, tek fixture, tek sabit. | Evet | Üst branch'te | Üst PR'a dahil | Molecule/stone tamamlanınca | Hayır (üst kanıt yeterli) |

### Önemli notlar

Branch açma kuralı: atom ve element için ayrı branch açmak gerekli değildir; bunlar molecule veya stone branch'i içinde yaşar. archetype ve üzeri her biri kendi branch'ini alır.

PR/merge kuralı: bir düğüm "done" sayılabilmesi için ilgili waterfall fazının kapısını geçmiş olmak zorundadır. PR açmak kapıyı geçmek değildir; faz kanıtı (`phases[<faz>].passed === true`) olmadan merge edilmez.

deploy kuralı: app düğümü tek başına deploy birimi değildir; o, altındaki tüm modüllerin tamamlanmasıyla oluşan release train'in etiketidir. Gerçek deploy birimi staging → prod geçişi yapabilen en küçük bağımsız katman olan archetype'tır.

---

## 2. Faz → Eylem

Her waterfall fazı geliştiriciye "şu anda ne yapıyorsun, ne yapmıyorsun" sorusunu yanıtlar.

Faz sırası zorunludur; `phases[<önceki_faz>].passed === true` olmadan sonraki fazın statüsü `active` olamaz.

| Faz | Geliştirici ne yapar | Geliştirici ne YAPMAZ |
|---|---|---|
| requirements | Kabul kriterlerini (`acceptanceCriteria[]`) yazar. `owner` atar, `assignees[]` doldurur. Risk kaydını (`risks[]`) açar. Kapsam sınırını net çizer: neyin içinde, neyin dışında olduğunu. `deliverables[]` listesini oluşturur. | Kod yazar. Şema değişikliği yapar. Branch açar. Test dosyası oluşturur. |
| test-plan | Test dosyalarını oluşturur — önce boş/kırmızı. `testCommand` alanını doldurur. `repoPath` belirler. `acceptanceCriteria[]` maddelerini test senaryolarına bire bir eşler. Test stratejisini (unit/integration/e2e/a11y) belgeler. | Production kodu yazar. Migration oluşturur. UI bileşeni geliştirir. |
| db-schema | Alembic migration dosyasını yazar (`upgrade()` + `downgrade()`). SQLAlchemy/SQLModel modelini tanımlar. RLS politikasını ve tenant izolasyon kararını belgeler. `prodDataPolicy` ve `migrationMode` alanlarını doldurur. `rollback` alanını yazar. | Frontend kodu yazar. API resolver geliştirir. Uygulamayı çalıştırır. |
| development | Branch açar (archetype/stone/molecule düzeyinde). Test-önce: önce testi kırmızı yak, sonra kodu yaz, sonra yeşile getir. FastAPI endpoint / GraphQL resolver / React bileşen / hook yazar. Birim ve integration testleri tamamlanmış olmalıdır bu faz kapanmadan. | Test yazmadan ilerlemeye çalışır. Migration değiştirir (db-schema fazına aittir). Deployment yapar. |
| test-qa | E2E (Playwright) testlerini çalıştırır ve kanıtı `evidence[]`'a ekler. Güvenlik taraması (OWASP ZAP), performans testi (p95 < hedef), a11y taraması (axe-core 0 ihlal) çalıştırır. Her kanıt URL veya rapor olarak kaydedilir. | Yeni özellik ekler. Şema değişikliği yapar. Eksik testi görmezden gelir. |
| verification | Staging deploy'unu doğrular. `deployTarget` üzerinde smoke testini çalıştırır. Evidence tamamlığını kontrol eder. Güvenlik ve WCAG kriterlerinin karşılandığını onaylar. Faz kapısını geçirir (`phases["verification"].passed = true`). | Yeni kod ekler. Testi atlar. Eksik kanıtla kapıyı geçirir. |
| release-maintenance | Prod deploy'u gerçekleştirir. Audit log ve rollback prosedürünü test eder. Runbook'u günceller. Bağımlılık güvenlik taramasını çalıştırır (npm audit / pip-audit). On-call rotasyonunu belgeler. | Önceki fazlarda yapılmamış işleri burada tamamlamaya çalışır. |

### Faz kapısı nedir

Her faz kapısı (`PhaseGate`) şu koşulların tamamını karşılamalıdır:

- `status: "passed"` ve `passed: true`
- `criteria` dizisi boş değil; her madde doğrulanmış
- `notes` alanı dolu; kimin ne zaman geçirdiği yazıyor

Bir faz, bir öncekinin kapısı geçilmeden `active` yapılamaz. Bu kural UI panelinde ve `check-data-quality.mjs` CI kapısında otomatik olarak zorlanır.

---

## 3. "Bu Sayfada Şimdi Ne Yapılır?" Karar Ağacı

Bu karar ağacı UI panelinin de mantığıdır; kurallar kesindir.

Girdi üçlüsü: `level`, `phase`, `status`.

Çıktı: tek cümlelik yönerge.

Adım 1 — Definition of Ready kontrolü: Düğümde `owner` boşsa ya da `acceptanceCriteria[]` dizisi boşsa, hiçbir faza geçilmez. Yönerge: "Önce requirements tamamlanmalı: owner ata ve en az bir kabul kriteri yaz."

Adım 2 — Önceki faz kapısı kontrolü: `phases[<önceki_faz>].passed !== true` ise mevcut fazda çalışılamaz. Yönerge: "Faz kapısı açık değil: [önceki_faz] fazının tüm kriterleri geçirilmeli."

Adım 3 — Seviye + faz + status birleşimi:

| Level | Faz | Status | Yönerge |
|---|---|---|---|
| app veya module | requirements | backlog veya todo | Kapsam belgesini yaz: deliverables, acceptanceCriteria, risks, owner, milestone. Kod yok. |
| app veya module | requirements | in-progress | Kapsam yazılıyor; henüz kod yazmaya başlama. |
| app veya module | test-plan | todo veya in-progress | Test stratejisi dosyasını yaz; testCommand ve repoPath doldur. Kod yok. |
| app veya module | db-schema | todo veya in-progress | ADR yaz; migration şemasını taslakla. Uygulama kodu yok. |
| app veya module | development | herhangi | UYARI: Bu seviyede doğrudan development fazı yanlıştır. Alt düğümlere (archetype ve aşağısı) in; orada branch aç. |
| archetype | test-plan | todo | Test dosyasını oluştur (kırmızı). repoPath ve testCommand doldur. |
| archetype | db-schema | todo | Alembic migration yaz (up + down). SQLAlchemy modelini tanımla. |
| archetype | development | todo | Branch aç, testi kırmızı yak, kodu yaz, yeşile getir. |
| archetype | development | in-progress | Kodu geliştirmeye devam et; CI yeşil olduğunda test-qa hazırlığı yap. |
| archetype | test-qa | todo | E2E, güvenlik, a11y ve performans kanıtlarını topla; evidence[] doldur. |
| archetype | verification | todo | Staging'de smoke testini çalıştır; faz kapısını geçir. |
| stone / molecule / element / atom | herhangi | backlog | Üst stone veya molecule henüz başlamadı; bekle veya üst düğümü başlat. |
| stone / molecule / element | test-plan | todo | Birim test dosyasını yaz (kırmızı). |
| stone / molecule / element | development | todo | Branch aç (molecule düzeyi yeterli); kodu yaz; testi yeşile getir. |
| herhangi | herhangi | blocked | Bloklayan düğümü bul (dependsOn veya blocks alanı); önce onu tamamla. |
| herhangi | herhangi | done | Bu sayfada yapılacak iş kalmadı; bir üst düğüme veya bağımlı düğüme geç. |

---

## 4. Branch, PR, Deploy ve Evidence — Hangi Seviyede, Ne Zaman

### Branch

Branch yalnızca platform monoreposunda açılır; actionplan'da veri/docs değişiklikleri için ayrı branch gerekmez (main branch koruması uygulanır, PR zorunludur).

Platform monoreposunda kural:

- archetype: `archetype/<slug>` (ör. `archetype/platform-customer-model`)
- stone: `stone/<slug>`
- molecule: `molecule/<slug>` veya üst stone branch'i içinde
- element ve atom: molecule ya da stone branch'i içinde

app ve module için platform monoreposunda branch açılmaz; bu seviyeler sözleşme ve kapsam belgesi taşır.

### PR ve Merge

PR zorunlu olduğu seviyeler: archetype ve üzeri (module, app). Ancak app ve module için PR içeriği yalnızca sözleşme/belge değişikliklerini kapsar; uygulama kodu içermez.

stone, molecule ve alt seviyeler için PR, üst archetype veya stone PR'ına dahil edilebilir. Bağımsız küçük PR da kabul edilir; tercihen küçük tutulur.

Merge koşulu: tüm CI kapıları yeşil + ilgili waterfall fazı kapısı geçilmiş + en az 1 human reviewer onayı.

### Deploy

| Seviye | Deploy birimi mü? | Ne zaman deploy edilir? |
|---|---|---|
| app | Hayır (release train etiketi) | Tüm kritik path modüller tamamlandığında, release train olarak |
| module | Hayır | app release train'inde |
| archetype | Evet (en küçük deploy birimi) | verification fazı kapısı geçildikten sonra staging'e; release-maintenance fazında prod'a |
| stone ve altı | Hayır | Üst archetype deploy'unda |

### Evidence

Evidence (`evidence[]` alanı), bir faz kapısının geçilebilmesi için zorunlu ölçülebilir kanıttır; metin iddiaları değil, URL veya dosya referansıdır.

| Faz | Zorunlu evidence |
|---|---|
| test-plan | Test dosyası yolu (repoPath + testCommand) |
| db-schema | Alembic migration dosyası yolu; rollback test logu |
| development | CI pipeline URL (yeşil) |
| test-qa | Playwright HTML raporu URL; axe-core 0 ihlal raporu; güvenlik tarama çıktısı |
| verification | Staging smoke test logu; deployTarget URL |
| release-maintenance | Prod deploy logu; rollback test logu; bağımlılık audit çıktısı |

---

## 5. dependsOn (WBS) → Kod Bağımlılığına Çeviri

actionplan'daki `dependsOn` alanı WBS yürütme sırasını tanımlar. Bu sıranın kod dünyasındaki karşılığı dört farklı türdedir ve karıştırılmamalıdır.

### 5.1 Tür Haritası

| dependsOn türü | Kod dünyasındaki karşılığı | Örnek |
|---|---|---|
| Aynı seviye, aynı bounded context | Paket import / modül import | `platform-customer-graphql` → `platform-customer-model`'e `dependsOn` — resolver, modeli import eder |
| Farklı bounded context | Servis bağımlılığı / API çağrısı | `platform-graphql-api` → `platform-authn-authz`'a `dependsOn` — GraphQL resolver, auth middleware'i çağırır |
| DB şema bağımlılığı | Migration sırası | `platform-customer-model` → `platform-tenancy`'ye `dependsOn` — `customers` tablosu `tenants` tablosunu FK olarak referans eder; tenants migration'ı önce çalışmalı |
| Deploy sırası | Docker Compose / Kubernetes bağımlılık | `platform-cicd` → `platform-observability`'ye `dependsOn` — CI/CD pipeline, Prometheus'un hazır olmasına bağlıdır |

### 5.2 Bağımlılık Türünü Yanlış Yorumlamak

`dependsOn` bir WBS yürütme sırasıdır; her zaman doğrudan kod import'u anlamına gelmez. Örneğin `platform-seed-data` → `platform-authn-authz` bağımlılığı, seed script'in auth kütüphanesini import ettiği anlamına gelmez; fixture kullanıcılarının roller tablosuna ihtiyaç duyması nedeniyle auth migration'ının önce tamamlanması gerektiği anlamına gelir (migration sırası bağımlılığı).

### 5.3 Kurallar

Dairesel bağımlılık yasaktır. `dependsOn` grafiği DAG (yönlü döngüsüz çizge) olmak zorundadır. `check-data-quality.mjs` bunu CI kapısında otomatik kontrol eder.

`blocks` çoğunlukla `dependsOn`'un tersidir ve türetilir. A → B `dependsOn` varsa B "blocks A"yı içerir. Elle blok eklenebilir; ancak otomatik türetim kural olarak kabul edilir.

`related` nedensellik veya sıralama taşımaz; yalnızca gezinme içindir. Kritik yol veya deploy sırası hesabında `related` kullanılmaz.

---

## 6. Yanlış Akış Uyarıları

Bu uyarılar panelde de gösterilir; geliştirici bu sinyalleri görünce durup karar vermeli.

**Uyarı 1: app veya module sayfasından doğrudan kod yazmaya başlamak yanlıştır.**  
app ve module düğümleri kapsam ve sözleşme belgesi taşır. Bu sayfadan "development" fazını aktif yapıp branch açmak, sınırsız büyüklükte bir bağlamda çalışmak anlamına gelir. Doğru yol: archetype veya daha küçük bir alt düğüm aç, oradan development fazına geç.

**Uyarı 2: test-plan fazını atlamak yanlıştır.**  
"Önce kodu yazayım, testleri sonra eklerim" yaklaşımı bu sözleşmede geçersizdir. test-plan fazı kapısı geçilmeden development fazı başlatılamaz. Faz kapısı CI tarafından da zorlanır.

**Uyarı 3: db-schema fazı atlanarak development'a geçmek yanlıştır.**  
Migration dosyası ve rollback prosedürü olmadan yazılan kod, test ortamında çalışsa bile production'da güvensizdir. db-schema fazı özellikle archetype ve üzeri düğümler için zorunludur.

**Uyarı 4: evidence olmadan faz kapısı geçirmek yanlıştır.**  
"Bu test çalıştı, güven" ifadesi yeterli değildir. Her faz kapısı için URL veya dosya referansı olarak somut kanıt `evidence[]` alanına girilmelidir. Kanıtsız `passed: true` geçişi bir sonraki fazda keşfedilecek risk demektir.

**Uyarı 5: atom / element'i bağımsız PR olarak açmak gereksizdir.**  
Bu küçük değişiklikler için ayrı PR overhead yaratmak pratiği yavaşlatır. Bunlar molecule veya stone branch'ine dahil edilir.

**Uyarı 6: blocked status'taki düğümde çalışmaya devam etmek yanlıştır.**  
`status: "blocked"` olan bir düğümde geliştirici zaman harcamamalıdır. `dependsOn` veya `blocks` alanındaki engelleyen düğümü bul; önce onu ilerlet.

**Uyarı 7: actionplan JSON'larını platform kodu sanmak yanlıştır.**  
actionplan'daki tüm `.json` dosyaları görev tanımı/planlama verisidir; çalışan platform kodu değildir. "platform-customer-model.json dosyasında migration var" derken kasıt, o migration'ın `platform/backend/alembic/` altında yazılması gerektiğidir.

---

## 7. Kanonik Örnek — Customer Dikey Dilimi

Bu örnek, platform-customer-* kümesinin sözleşmeyi nasıl uyguladığını somutlaştırır. Dikey dilim, tüm seviyelerin ve fazların aynı anda görülebileceği öğretici örnektir.

### Düğüm ağacı ve seviyeler

```
platform-factory          (app — dağ)
└── platform-db-schema    (module — kaya)
    └── platform-customer-model  (archetype — büyük taş)

platform-factory          (app — dağ)
└── platform-graphql-api  (module — kaya)
    └── platform-customer-graphql  (archetype — büyük taş)

platform-factory          (app — dağ)
└── platform-ui-surface   (module — kaya)
    └── platform-customer-ui  (archetype — büyük taş)
```

### Doğru akış (kısaltılmış)

1. platform-factory `requirements` fazı: kapsam belgesi, ADR, release train tanımı. Kod yok.
2. platform-db-schema `requirements` fazı: migration politikası, expand-contract kararı, rollback kuralı. Kod yok.
3. platform-customer-model `test-plan` fazı: `tests/customer/test_model.py` dosyası oluşturulur, testler kırmızı. `repoPath` ve `testCommand` doldurulur.
4. platform-customer-model `db-schema` fazı: Alembic migration yazılır; `upgrade()` + `downgrade()` ikisi de dolu. SQLAlchemy model tanımı. RLS politikası.
5. platform-customer-model `development` fazı: `archetype/platform-customer-model` branch açılır. Testler yeşile getirilir. CI kapıları yeşil.
6. platform-customer-model `test-qa` fazı: Integration test çalıştırılır; cross-tenant izolasyon kanıtı `evidence[]`'a eklenir.
7. platform-customer-model `verification` fazı: Staging smoke testi; faz kapısı geçirilir.
8. Aynı sıra `platform-customer-graphql` için (dependsOn: platform-customer-model tamamlanmış olmalı) ve `platform-customer-ui` için (dependsOn: platform-customer-graphql) tekrarlanır.

### Yanlış akış (önce yakala)

Hatalı: platform-factory sayfasını açıp `development` fazını aktif yap, `platform/backend/` klasörüne kod yaz. Bu, app seviyesinde development fazı demektir; sözleşme bunu yasaklar. archetype alt düğümü açılmadan hiçbir kod yazılmaz.

---

## 8. Alan Referansı — Karar Ağacında Kullanılan Alanlar

Bu tablo karar ağacının kullandığı `TaskNode` alanlarını ve nasıl yorumlandıklarını özetler. Tüm alan adları `src/schemas/task.ts`'den alınmıştır.

| Alan | Tip | Karar ağacındaki rolü |
|---|---|---|
| `level` | enum | Seviye → teslimat anlamı tablosunu seç |
| `phase` | string | Güncel aktif faz |
| `phases[<faz>].passed` | boolean | Kapı açık mı? |
| `phases[<faz>].criteria` | string[] | Faz kapısı kriterleri listesi |
| `status` | enum | Düğümün çalışma durumu (blocked mu?) |
| `owner` | string | DoR kontrolü: boşsa requirements tamamlanmamış |
| `acceptanceCriteria` | string[] | DoR kontrolü: boşsa requirements tamamlanmamış |
| `dependsOn` | string[] | Hangi düğüm önce bitmeli? (kritik yol) |
| `blocks` | string[] | Bu düğüm hangi düğümleri bekletiyor? |
| `evidence` | string[] | Faz kanıtları; URL veya dosya referansı |
| `repoPath` | string | Platform monoreposundaki dosya/dizin yolu |
| `testCommand` | string | CI'da çalıştırılacak test komutu |
| `deployTarget` | string | Staging/prod ortam URL veya Kubernetes namespace |
| `rollback` | string | Geri-alma komutu veya runbook referansı |

---

## Çelişki Bildirimi

Bu dokümanın hazırlandığı tarih itibarıyla mevcut actionplan dokümanlarıyla çelişen bir madde saptanmamıştır. Bununla birlikte, herhangi bir doküman bu sözleşmeyle farklı bir kural içeriyorsa bu sözleşme önceliklidir; çelişkili doküman güncellenmeli veya bu sözleşmeye atıfla geçersiz sayılmalıdır.

Sözleşmeyi değiştirme yetkisi: yalnızca Kullanıcı/Admin (insan onayı); AI ajan bu dosyayı doğrudan güncelleyemez.

---

*Son güncelleme: 2026-06-29. Bir sonraki güncelleme yalnızca şema sürüm değişikliği veya yeni waterfall fazı eklendiğinde yapılmalıdır.*
