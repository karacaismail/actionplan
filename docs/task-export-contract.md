# Task Export Sözleşmesi

Sürüm: 1.2 — 2026-07-13
Durum: Kanonik / uygulanmış

---

## Genel Bakış

actionplan'daki görev detay ekranı bir TaskNode'u beş ayrı artifact olarak dışa aktarır: Raw JSON, Developer Brief, Agent Prompt, Evidence Patch ve Vobecoder Card.

Raw JSON tam veri taşıyan kanonik girdidir. Diğer dört artifact aynı veriyi geliştirici, AI ajanı, kanıt geri-yazımı ve kısa vibecoding/vobecoding operasyonu için biçimlendirir. Export katmanı veritabanı şemasını veya implementation reposu kodunu değiştirmez; yalnızca görev sözleşmesini indirilebilir hale getirir.

## Aktör Sınırı

Yetki zinciri **Codex → PM → uzman ajanlar → Claude workers/slaves** biçimindedir. Export önce
PM'nin evidence paketine, sonra Codex'in kararına gider; yalnız Codex sınırlı worker çağrısı yapar.

Bu sözleşmedeki Agent Prompt, Developer Brief ve Vobecoder Card çıktıları `DIRECTIVE-ONLY` insan handoff'udur. Codex, Claude, Cursor ve diğer AI ajanları bu artifact'leri platformda uygulamaz; erişimleri `read-only-audit`, ürün kodu yazarı `human-developer-only`dır.

AI'nın görevi export sözleşmesini, alan açıklamalarını, yasakları, kabul ölçütlerini ve kanıt beklentisini çelişkisiz hale getirmektir. Platform branch'i, kodu, testi, migration'ı ve PR'ı yalnız insan geliştirici üretir. Kanonik yasak: `docs/platform-product-code-write-prohibition-directive.md`.

## UI Delivery Beyanı (tüm export modları)

Developer Brief, Agent Prompt ve Vobecoder Card, düğümün `uiDelivery` sözleşmesini (varsa) taşır (`docs/storybook-master-component-integration-directive.md` §11): UI impact + gerekçesi, componentKind (master/pattern/surface-composition/local/none), masterComponentRefs, story/test/evidence beklentisi (storyRefs, requiredStoryStates/Viewports/Locales/Themes, interaction/a11y/e2e refs), story path'lerinin allowed-files bağı ve insan review gereği (reviewer + reviewStatus). Export üretici kör kelime eşlemesi yapmaz; `tools/lib/ui-impact.mjs` sınıflandırıcısının sonucunu taşır. UI etkisi yoksa export alanı sessizce boş bırakılmaz — açıkça `Storybook: N/A — <somut gerekçe>` yazılır. Gerçek URL/CI evidence yokken `storybookUrl` uydurulmaz.

---

## Mod 1 — Developer Brief Export (İnsan için Markdown)

### Ne zaman kullanılır

Bir geliştirici görevi teslim almadan önce bağlamı hızlıca kavramak istediğinde; kod yazmadan önce ne yapılacağını, ne yapılmayacağını ve tamamlanma ölçütlerini net anlamak istediğinde kullanılır. Ayrıca görev sahibinin görevi başkasına devrettiği veya ekip içi teknik incelemede paylaştığı durumlara uygundur.

### İçerik şablonu

Aşağıdaki bölümleri sırayla içerir.

**Görev özeti**

`title`, `level`, `phase`, `status`, `owner` alanlarından oluşan tek paragraflık özet. `level` ve `phase` değerlerine göre yorumlama notları (aşağıya bakınız) eklenir.

Seviye/faz yorumlama kuralları:

| level | doğa metaforu | phase | Yapılır | Yapılmaz |
|---|---|---|---|---|
| app | ada | requirements/backlog | Ürün adası, kapsam ve sınır netleştirilir | Kod yazılmaz, alt seviye sözleşmeler atlanmaz |
| module | dağ | requirements/db-schema | Modül dağı, domain ve entegrasyon sınırı çıkarılır | Doğrudan UI/API implementasyonuna atlanmaz |
| archetype | kaya | requirements/test-plan | Kaya sözleşmesi, veri modeli ve davranış kuralları netleştirilir | Yeni app/module üretilmez |
| feature | taş | development | Belirtilen kullanıcı akışı veya yetenek için repoPath'te çalışılır | Kapsam dışı feature değiştirilmez |
| component | kum | development | UI/API/parça düzeyi test-önce implementasyon yapılır | Başka component'ların davranışı kırılmaz |
| work_unit | molekül | development/test-qa | İnce yürütme dilimi tamamlanır, test + evidence üretilir | Kanıt olmadan done yapılmaz |
| micro_step | atom | test-plan/development | Atomik kontrol, test veya küçük değişiklik yapılır | Bir atomdan daha geniş refactor yapılmaz |

**Bağımlılıklar**

`dependsOn` dizisindeki her girdinin id, title, status üçlüsü tablo olarak listelenir. Durumu `done` olmayan bağımlılıklar "Bekleyen" olarak işaretlenir.

**Yapılacaklar / Yapılmayacaklar**

`deliverables` listesinden türetilen "Yapılacaklar" ile görevin `level` ve `phase` kombinasyonuna göre üretilen kapsam-dışı öğeleri listeleyen "Yapılmayacaklar" bölümü yan yana tabloda gösterilir.

**Test planı**

`traceability.testCommand` ile `acceptanceCriteria` listesi eşleştirilir. Her kriter için hangi test komutu veya senaryonun onu doğruladığı belirtilir.

**Acceptance kriterleri — test eşlemesi**

| Kriter | Doğrulama yöntemi | Test komutu |
|---|---|---|
| `acceptanceCriteria[n]` metni | unit / integration / e2e | `traceability.testCommand` |

**Evidence checklist**

`evidence` alanındaki mevcut kayıtlar listelenir. Eksik olan evidence türleri (done kapısı için gerekli olanlar) "Eksik" etiketi ile gösterilir.

### Örnek çıktı başlığı

```
# Developer Brief — [task.title]

Seviye: feature / taş | Faz: development | Sahip: [owner] | Durum: in-progress

Bu görev implementation repo'da [repoPath] yolundaki feature/component dilimini etkiler.
Yapılmayacaklar: başka tenant modüllerine dokunulmaz, migration dışı DDL çalıştırılmaz.
```

---

## Mod 2 — Agent Prompt Export (`DIRECTIVE-ONLY` insan handoff'u)

### Ne zaman kullanılır

Bir görev PM üzerinden Codex'e verildiğinde, Codex'in yetkilendirdiği dar uzman/worker çıktısının platformu değiştirmeden insan geliştirici directive'i üretmesini sağlar. Platform path'leri yalnız okunur; yazılabilir dosya listesi değildir.

### İçerik şablonu

**Görev kimliği ve sürümü**

`id`, `title`, `phase`, `level`, export tarihi sabit başlık olarak yer alır.

**İnsan geliştiricinin hedef dosyaları**

`traceability.repoPath` + `deliverables` listesinden türetilir. AI bunları yalnız salt-okunur inceler; insan geliştirici directive onaylandıktan sonra değiştirir.

| Yol | AI erişimi | İnsan erişimi |
|---|---|---|
| `traceability.repoPath` | Salt-okunur audit | Onaylı branch'te okuma + yazma |
| Test dosyaları (`testCommand`'dan türetilir) | Yalnız test planı üretme | Onaylı branch'te okuma + yazma |

**Yasak dosyalar**

Açıkça listelenir. Aşağıdaki öğeler her zaman yasaktır ve görev içeriğinden bağımsızdır:

| Yasak kategori | Açıklama |
|---|---|
| Platformun tamamı | AI ürün kodu, test, migration, Storybook/config veya generated output yazamaz |
| Git işlemleri | AI branch, commit, tag, push veya pull request oluşturamaz |
| Ana dal | İnsan geliştirici de `main`/`master` branch'e doğrudan push yapamaz |
| Ruleset ve konfigürasyon | `.eslintrc`, `biome.json`, `pyproject.toml`, CI workflow dosyaları değiştirilemez |
| Diğer task'lara ait dosyalar | `dependsOn` listesindeki görevlerin sahip olduğu yollar salt okunurdur |
| AI uygulama veya modül üretimi | Kapsam dışı yeni uygulama veya modül oluşturulamaz |

**Beklenen çıktı**

| Alan | Değer |
|---|---|
| Format | `DIRECTIVE-ONLY` implementation yönergesi |
| Hedef branch | İnsan geliştirici için öneri: `task/<task-id>-<slug>` |
| Kod çıktısı | Yasak; patch/diff/source dosyası üretilmez |

**Zorunlu testler**

`traceability.testCommand` insan geliştiricinin çalıştıracağı komuttur. AI kırmızı test dosyasını yazmaz; test adı, assertion, fixture ve beklenen failure reason'ı tarif eder.

**Maksimum iterasyon**

Varsayılan: 5 iterasyon. `notes.prompt` veya `items` içinde özel bir sınır belirtilmişse o değer geçerlidir. Bu sınıra ulaşıldığında ajan durur ve o ana kadar yapılanı raporlar.

**Evidence formatı**

AI yalnız evidence beklentisi taslağı üretir. Evidence kaydı ancak insan geliştiricinin gerçek PR/CI/test çıktısından alınır:

```json
{
  "type": "human-implementation-run",
  "ref": "İnsan geliştiricinin gerçek PR veya commit URL'si",
  "testResult": "pass | fail",
  "iterations": 3,
  "timestamp": "ISO 8601"
}
```

**Durdurma koşulları**

Ajan aşağıdaki koşullardan herhangi biri gerçekleştiğinde durdurulur ve insan onayı beklenir:

- Herhangi bir platform dosyasına yazma gereği
- Test, migration, Storybook/config veya generated output üretme gereği
- Branch, commit, push veya PR oluşturma gereği
- İnsan ürünü gerçek evidence olmadan status ilerletme isteği
- Kapsam, güvenlik veya migration kararının insan onayı gerektirmesi

**AI ajana mutlak sınırlar**

Bu sınırlar görev içeriğinden bağımsız olarak geçerlidir ve hiçbir koşulda geçersiz kılınamaz:

- Ajan hiçbir platform ürün kodu, test, uygulama veya modül üretemez.
- Ajan, proje ruleset'ini (lint kuralları, CI pipeline adımları, güvenlik politikaları) override edemez.
- Ajan branch/commit/push/PR oluşturamaz; yalnız insan geliştiriciye branch önerir.
- Ajan, insan kaynaklı evidence olmadan görevi tamamlanmış olarak işaretleyemez.

### Örnek çıktı başlığı

```
# Agent Directive Contract — [task.id] — DIRECTIVE-ONLY

İnsan hedef dosyaları: apps/api/src/... ve apps/api/tests/...
AI erişimi: read-only-audit
Ürün kodu yazarı: human-developer-only
İnsan test komutu: pytest tests/... -x
Durdurma koşulu: platform yazma, branch/commit/PR veya gerçek-evidence eksikliği
```

---

## Mod 3 — Evidence Update Export (Geri yazma JSON patch taslağı)

### Ne zaman kullanılır

İnsan geliştirici görevi tamamladıktan sonra kanıtları ve izlenebilirlik bilgilerini TaskNode'a geri yazmak için kullanılır. AI yalnız taslak üretir; ref/testResult/timestamp değerlerini uyduramaz.

### İçerik şablonu

Aşağıdaki alanları patch işlemi olarak içerir:

| Patch yolu | Kaynak | Açıklama |
|---|---|---|
| `/evidence/-` | İnsan geliştirici/reviewer girişi | PR linki, commit hash, test sonucu |
| `/traceability/repoPath/-` | Gerçek repo yolu | Uygulama sırasında netleşen repo-içi yol |
| `/traceability/testCommand/-` | Çalışan komut | Doğrulanmış test komutu |
| `/traceability/implementationStatus` | `implemented` / `verified` | Uygulama durumu |
| `/schedule/actualStart` | ISO 8601 | Gerçek başlangıç tarihi |
| `/schedule/actualEnd` | ISO 8601 | Gerçek bitiş tarihi |
| `/status` | `done` / `in-progress` | Yeni durum |

**Faz kapısı notları**

`phase` değeri `development` iken `done` kapısına giriliyorsa aşağıdaki ek alanlar da patch'e eklenir:

| Patch yolu | Beklenen değer |
|---|---|
| `/evidence` | done kapısı için en az 1 kayıt |
| `/traceability/implementationStatus` | `verified` |
| `/traceability/deployTarget` | Hedef ortam |

**Taslak patch formatı**

```json
[
  { "op": "add",     "path": "/evidence/-",
    "value": "PR geçti: https://github.com/org/platform/pull/42; ci:https://github.com/org/platform/actions/runs/11234567890" },
  { "op": "replace", "path": "/traceability/implementationStatus", "value": "verified" },
  { "op": "add", "path": "/traceability/repoPath/-", "value": "platform/apps/customer" },
  { "op": "add", "path": "/traceability/testCommand/-", "value": "pytest platform/apps/customer/tests -x" },
  { "op": "replace", "path": "/schedule/actualEnd", "value": "2026-06-29" },
  { "op": "replace", "path": "/status",               "value": "done" }
]
```

### Örnek senaryo

Geliştirici `platform/apps/customer/models.py` değişikliğini tamamladı, PR #42 açıldı, testler geçti. Evidence Update Export bu JSON patch taslağını üretir; geliştirici yalnızca `ref` ve `timestamp` değerlerini doldurur, geri kalan alanlar mevcut TaskNode içeriğinden otomatik önerilir.

---

## Mod 4 — Vobecoder Card Export (Kısa yapıştırılabilir kart)

### Ne zaman kullanılır

Vibecoding/vobecoding akışında AI'nın platform kodu üretmeden kısa bir insan uygulama directive'i hazırlaması için kullanılır. Bu kart kod yürütme komutu veya yazma yetkisi değildir.

### İçerik şablonu

Kart aşağıdaki alanları taşır:

| Alan | Açıklama |
|---|---|
| Yapıştırılacak prompt | Görev başlığı, actionplan URL'si, workspace kökü, hedef yol, test komutu |
| Kurallar | `DIRECTIVE-ONLY`, read-only-audit, insan test-önce sırası, yasak stack |
| Beklenen dosyalar | `traceability.repoPath` değerleri |
| Çalıştırılacak test | Birincil `traceability.testCommand` |
| Red flag | AI platforma yazıyorsa, patch/branch/commit/PR üretiyorsa veya insan evidence'ı uyduruyorsa reddet |

`repoPath` veya `testCommand` eksikse kart açık biçimde `NO-GO` üretir. Bu sinyal kod yazmaya başlama izni değildir; eksik traceability alanlarının tamamlanması gerekir.

---

## Ham JSON Export ile ilişki

Raw JSON butonu TaskNode'un tam ham JSON'unu indirir. Developer Brief, Agent Prompt, Evidence Patch ve Vobecoder Card aynı ham veriyi girdi olarak kullanır; ham JSON hiçbir zaman kaldırılmaz.

Ham JSON, özellikle otomasyon pipeline'larında ve CI adımlarında girdi olarak kullanılmaya devam edebilir.
