# Task Export Sözleşmesi

Sürüm: 1.0 — 2026-06-29
Durum: Kanonik

---

## Genel Bakış

actionplan'daki "Export this task" işlevi bugün bir TaskNode'un ham JSON dump'ını indirmektedir. Bu sözleşme o ham JSON'u, üç farklı tüketicinin ihtiyacına göre biçimlendirilmiş üç export moduna dönüştüren kuralları tanımlar. Ham JSON bu üç modun ortak ham girdisidir; sözleşme veritabanı şemasına veya uygulama koduna dokunmaz.

UI'ya üç export seçeneği eklenmesi ayrı bir iş olarak planlanmalıdır (bkz. DX4 görev kaydı). Bu doküman o işin gereksinimleri için bağlayıcı referanstır.

---

## Mod 1 — Developer Brief Export (İnsan için Markdown)

### Ne zaman kullanılır

Bir geliştirici görevi teslim almadan önce bağlamı hızlıca kavramak istediğinde; kod yazmadan önce ne yapılacağını, ne yapılmayacağını ve tamamlanma ölçütlerini net anlamak istediğinde kullanılır. Ayrıca görev sahibinin görevi başkasına devrettiği veya ekip içi teknik incelemede paylaştığı durumlara uygundur.

### İçerik şablonu

Aşağıdaki bölümleri sırayla içerir.

**Görev özeti**

`title`, `level`, `phase`, `status`, `owner` alanlarından oluşan tek paragraflık özet. `level` ve `phase` değerlerine göre yorumlama notları (aşağıya bakınız) eklenir.

Seviye/faz yorumlama kuralları:

| level | phase | Yapılır | Yapılmaz |
|---|---|---|---|
| epic | backlog | Kapsam netleştirilir, bağımlılıklar belirlenir | Kod yazılmaz, mimari kararlar verilmez |
| epic | development | Implementasyon sırası belirlenir, sprint planlanır | Alt görevler atlanarak doğrudan üretime geçilmez |
| feature | development | Belirtilen repoPath'te belirtilen dosyalara dokunulur | Kapsam dışı modüller değiştirilmez |
| task | development | Birim + entegrasyon testi yazılır, AC karşılanır | Başka task'ların testleri kırılmaz |
| task | test-plan | Test senaryoları yazılır, veri hazırlanır | Üretim kodu değiştirilmez |

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

Seviye: task | Faz: development | Sahip: [owner] | Durum: in-progress

Bu görev platform monorepo'da [repoPath] yolundaki modülü etkiler.
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
| Hedef branch | `feature/[task.id]-[slug]` |
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
| `/traceability/repoPath` | Gerçek repo yolu | Uygulama sırasında netleşen yol |
| `/traceability/testCommand` | Çalışan komut | Doğrulanmış test komutu |
| `/traceability/implementationStatus` | `partial` / `complete` | Uygulama durumu |
| `/schedule/actualStart` | ISO 8601 | Gerçek başlangıç tarihi |
| `/schedule/actualEnd` | ISO 8601 | Gerçek bitiş tarihi |
| `/status` | `done` / `in-progress` | Yeni durum |

**Faz kapısı notları**

`phase` değeri `development` iken `done` kapısına giriliyorsa aşağıdaki ek alanlar da patch'e eklenir:

| Patch yolu | Beklenen değer |
|---|---|
| `/evidence` | done kapısı için en az 1 kayıt |
| `/traceability/implementationStatus` | `complete` |
| `/traceability/deployTarget` | Hedef ortam |

**Taslak patch formatı**

```json
[
  { "op": "add",     "path": "/evidence/-",
    "value": { "type": "pr", "ref": "https://github.com/org/platform/pull/42",
               "timestamp": "2026-06-29T14:00:00Z" } },
  { "op": "replace", "path": "/traceability/implementationStatus", "value": "complete" },
  { "op": "replace", "path": "/traceability/repoPath",  "value": "platform/apps/customer" },
  { "op": "replace", "path": "/traceability/testCommand", "value": "pytest platform/apps/customer/tests -x" },
  { "op": "replace", "path": "/schedule/actualEnd",    "value": "2026-06-29T18:00:00Z" },
  { "op": "replace", "path": "/status",               "value": "done" }
]
```

### Örnek senaryo

Geliştirici `platform/apps/customer/models.py` değişikliğini tamamladı, PR #42 açıldı, testler geçti. Evidence Update Export bu JSON patch taslağını üretir; geliştirici yalnızca `ref` ve `timestamp` değerlerini doldurur, geri kalan alanlar mevcut TaskNode içeriğinden otomatik önerilir.

---

## Ham JSON Export ile ilişki

Mevcut "Export this task" butonu TaskNode'un tam ham JSON'unu indirir. Bu üç modun tümü o ham JSON'u girdi olarak kullanır; ham JSON hiçbir zaman kaldırılmaz. UI'ya eklenecek üç seçenek (Developer Brief, Agent Prompt, Evidence Update) ham JSON download'un yanına eklenir, onu değiştirmez.

Ham JSON, özellikle otomasyon pipeline'larında ve CI adımlarında girdi olarak kullanılmaya devam edebilir.
