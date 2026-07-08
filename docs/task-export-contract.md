# Task Export Sözleşmesi

Sürüm: 1.1 — 2026-07-08
Durum: Kanonik / uygulanmış

---

## Genel Bakış

actionplan'daki görev detay ekranı bir TaskNode'u beş ayrı artifact olarak dışa aktarır: Raw JSON, Developer Brief, Agent Prompt, Evidence Patch ve Vobecoder Card.

Raw JSON tam veri taşıyan kanonik girdidir. Diğer dört artifact aynı veriyi geliştirici, AI ajanı, kanıt geri-yazımı ve kısa vibecoding/vobecoding operasyonu için biçimlendirir. Export katmanı veritabanı şemasını veya implementation reposu kodunu değiştirmez; yalnızca görev sözleşmesini indirilebilir hale getirir.

## Aktör Sınırı

Bu sözleşmedeki Agent Prompt, Developer Brief ve Vobecoder Card çıktıları implementation geliştiricisinin veya onun yönettiği coding ajanının tüketmesi içindir. actionplan üzerinde çalışan Codex/doc-maintainer bu artifact'leri uygulayıp platform, kernel, SDK, app-core, module veya app kodu yazmaz.

Doc-maintainer'ın görevi export sözleşmesini, alan açıklamalarını, yasakları, kabul ölçütlerini ve kanıt beklentisini çelişkisiz hale getirmektir. Export'un kod üretim tarafı ayrı implementation repo/branch'inde, geliştirici sorumluluğunda yürütülür.

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

## Mod 2 — Agent Prompt Export (AI ajana sıkı sözleşme)

### Ne zaman kullanılır

Bir görev otomatik kodlama ajanına (örneğin Claude Code, Aider, Cursor Agent) verildiğinde kullanılır. Ajan bu export'u sistem promptu olarak alır; izin verilen dosyaların ve durdurma koşullarının dışına çıkamaz.

### İçerik şablonu

**Görev kimliği ve sürümü**

`id`, `title`, `phase`, `level`, export tarihi sabit başlık olarak yer alır.

**İzin verilen dosyalar**

`traceability.repoPath` + `deliverables` listesinden türetilir. Ajan yalnızca bu yolları değiştirebilir.

| Yol | İzin türü |
|---|---|
| `traceability.repoPath` | Okuma + yazma |
| Test dosyaları (`testCommand`'dan türetilir) | Okuma + yazma |

**Yasak dosyalar**

Açıkça listelenir. Aşağıdaki öğeler her zaman yasaktır ve görev içeriğinden bağımsızdır:

| Yasak kategori | Açıklama |
|---|---|
| Ana dal | `main`/`master` branch'e doğrudan push yapılamaz |
| Ruleset ve konfigürasyon | `.eslintrc`, `biome.json`, `pyproject.toml`, CI workflow dosyaları değiştirilemez |
| Diğer task'lara ait dosyalar | `dependsOn` listesindeki görevlerin sahip olduğu yollar salt okunurdur |
| AI uygulama veya modül üretimi | Kapsam dışı yeni uygulama veya modül oluşturulamaz |

**Beklenen çıktı**

| Alan | Değer |
|---|---|
| Format | unified diff / patch dosyası |
| Hedef branch | `task/<task-id>-<slug>` |
| Commit mesajı formatı | `[task.id] [task.title]: kısa açıklama` |

**Zorunlu testler**

`traceability.testCommand` değeri ajanın çalıştırması gereken komuttur. Testler geçmeden patch teslim edilemez.

**Maksimum iterasyon**

Varsayılan: 5 iterasyon. `notes.prompt` veya `items` içinde özel bir sınır belirtilmişse o değer geçerlidir. Bu sınıra ulaşıldığında ajan durur ve o ana kadar yapılanı raporlar.

**Evidence formatı**

Ajandan beklenen evidence kaydı biçimi (Mod 3 ile uyumlu):

```json
{
  "type": "agent-run",
  "ref": "PR veya commit URL",
  "testResult": "pass | fail",
  "iterations": 3,
  "timestamp": "ISO 8601"
}
```

**Durdurma koşulları**

Ajan aşağıdaki koşullardan herhangi biri gerçekleştiğinde durdurulur ve insan onayı beklenir:

- Yasak dosyalar listesindeki bir dosyaya yazma girişimi
- `testCommand` başarısız ve 5 iterasyon tükenmiş
- `deliverables` dışında yeni dosya oluşturma girişimi
- Kapsam dışı modül, uygulama veya servis üretme girişimi
- Ruleset veya CI konfigürasyonu değiştirme girişimi

**AI ajana mutlak sınırlar**

Bu sınırlar görev içeriğinden bağımsız olarak geçerlidir ve hiçbir koşulda geçersiz kılınamaz:

- Ajan, kapsam tanımında yer almayan yeni uygulama veya modül üretemez.
- Ajan, proje ruleset'ini (lint kuralları, CI pipeline adımları, güvenlik politikaları) override edemez.
- Ajan, `main` branch'e push yapamaz; her çıktı bir feature branch'e yönlendirilmelidir.
- Ajan, evidence kaydı oluşturmadan görevi tamamlanmış olarak işaretleyemez.

### Örnek çıktı başlığı

```
# Agent Task Contract — [task.id]

İzin verilen dosyalar: platform/apps/customer/models.py, platform/apps/customer/tests/test_models.py
Yasak: main branch push, ruleset değişikliği, yeni modül üretimi
Maks iterasyon: 5
Test komutu: pytest platform/apps/customer/tests -x
Durdurma koşulu: yasak dosya yazımı, test başarısızlığı + iterasyon bitti
```

---

## Mod 3 — Evidence Update Export (Geri yazma JSON patch taslağı)

### Ne zaman kullanılır

Geliştirici veya ajan görevi tamamladıktan sonra, kanıtları ve izlenebilirlik bilgilerini TaskNode'a geri yazmak için kullanılır. Bu export, doğrudan veritabanına veya JSON dosyasına uygulanabilecek bir RFC 6902 JSON Patch taslağı üretir.

### İçerik şablonu

Aşağıdaki alanları patch işlemi olarak içerir:

| Patch yolu | Kaynak | Açıklama |
|---|---|---|
| `/evidence/-` | Geliştirici/ajan girişi | PR linki, commit hash, test sonucu |
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

Vibecoding/vobecoding akışında geliştiricinin veya operatörün uzun Developer Brief yerine kısa, tek ekranlık bir görev kartı yapıştırması gerektiğinde kullanılır. Bu kart tam sözleşmenin yerine geçmez; hızlı yürütme komutudur.

### İçerik şablonu

Kart aşağıdaki alanları taşır:

| Alan | Açıklama |
|---|---|
| Yapıştırılacak prompt | Görev başlığı, actionplan URL'si, workspace kökü, hedef yol, test komutu |
| Kurallar | Test-önce, küçük değişiklik, yasak stack, main/master push yasağı |
| Beklenen dosyalar | `traceability.repoPath` değerleri |
| Çalıştırılacak test | Birincil `traceability.testCommand` |
| Red flag | Test yoksa, negatif test yoksa, hedef dışı dosya varsa veya AI yalnız açıklama yazdıysa reddet |

`repoPath` veya `testCommand` eksikse kart açık biçimde `NO-GO` üretir. Bu sinyal kod yazmaya başlama izni değildir; eksik traceability alanlarının tamamlanması gerekir.

---

## Ham JSON Export ile ilişki

Raw JSON butonu TaskNode'un tam ham JSON'unu indirir. Developer Brief, Agent Prompt, Evidence Patch ve Vobecoder Card aynı ham veriyi girdi olarak kullanır; ham JSON hiçbir zaman kaldırılmaz.

Ham JSON, özellikle otomasyon pipeline'larında ve CI adımlarında girdi olarak kullanılmaya devam edebilir.
