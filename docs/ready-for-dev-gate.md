# Definition of Ready — Development Fazı Kapısı

Sürüm: 1.0 — 2026-06-29
Durum: Kanonik

---

## Genel Bakış

Bu doküman, bir TaskNode'un `development` fazına geçmeden önce karşılaması gereken zorunlu koşulları tanımlar. Bu koşullar üç yerde uygulanır: planlama toplantısında manuel kontrol, `check-ready-for-dev.mjs` aracıyla makine kapısı, CI pipeline'a bağlı otomatik engel.

"Hazır" tanımı olmadan geliştirme fazına alınan görevler orta sprint'te bloke olur, kapsam kayar ve faz kapıları anlamsızlaşır. Bu doküman o kaymanın önüne geçen bağlayıcı kuraldır.

---

## 1. Zorunlu Alanlar

Bir görev development fazına alınmadan aşağıdaki alanların tümü dolu olmalıdır. Tek bir eksik alan görevi geçersiz kılar.

Alanlar, TaskNode şemasındaki karşılıklarıyla listelenmektedir.

| Alan | TaskNode yolu | Kural |
|---|---|---|
| Sahip | `owner` | Boş olamaz; geçerli bir ekip üyesi kimliği olmalı |
| Repo yolu | `traceability.repoPath` | Monorepo içinde var olan bir dizin yolu olmalı |
| Test komutu | `traceability.testCommand` | Çalıştırılabilir bir komut; yerel ortamda en az bir kez geçmiş olmalı |
| Uygulama artifact | `traceability.repoPath` + `deliverables` | En az 1 somut implementasyon çıktısı (dosya, migration, endpoint vb.) |
| Kabul kriterleri | `acceptanceCriteria` | En az 1 kriter; ölçülebilir, test edilebilir ifade olmalı |
| Bağımlılıklar | `dependsOn` | Tümü `done` durumunda VEYA her biri için bilinçli "waived" kararı kayıtlı olmalı |
| Rollback | `risks` veya `notes` | Neyin nasıl geri alınacağı açıklanmış olmalı |
| Üst deliverable bağı | `phase` hiyerarşisi | Bu görevin hangi epic/feature deliverable'ına katkı sağladığı belirli olmalı |
| Branch adı önerisi | `traceability` veya `notes` | `feature/[task.id]-[slug]` formatında önerilmiş olmalı |
| Evidence checklist | `evidence` alanı | Done kapısı için beklenen evidence türleri listelenmiş olmalı |

### Bağımlılık waiver kuralı

`dependsOn` listesindeki bir görev `done` değilse, bağımlılık otomatik olarak engel oluşturur. Engelin kaldırılması için görev sahibinin `notes` alanına tarih ve gerekçesiyle birlikte "waived" kararını kaydetmesi zorunludur. Gerekçesiz waiver geçersizdir.

---

## 2. readyForDev Türetilmiş Alan ve Skor

`check-ready-for-dev.mjs` aracı her TaskNode için aşağıdaki tablodaki alanları kontrol eder ve bir toplam skor hesaplar. Her alan 1 puan değerindedir. 10 alan kontrolü yapılır; 10/10 yeşil, herhangi bir eksik kırmızıdır. Kısmi skor kabul edilmez.

| No | Kontrol edilen alan | Yeşil koşul | Kırmızı koşul |
|---|---|---|---|
| 1 | `owner` | Dolu | Boş veya null |
| 2 | `traceability.repoPath` | Dolu ve monorepo'da mevcut | Boş veya yanlış yol |
| 3 | `traceability.testCommand` | Dolu | Boş |
| 4 | `deliverables` | En az 1 öğe | Boş dizi |
| 5 | `acceptanceCriteria` | En az 1 öğe | Boş dizi |
| 6 | `dependsOn` bağımlılık durumu | Tümü done veya waived | En az 1 açık bağımlılık |
| 7 | `risks` veya `notes` rollback | Rollback içeren kayıt var | Hiç rollback bilgisi yok |
| 8 | Üst deliverable bağı | Parent epic/feature done ya da active | Orphan görev (parent yok) |
| 9 | Branch adı önerisi | `traceability` veya `notes`'ta mevcut | Hiç belirtilmemiş |
| 10 | `evidence` checklist | En az 1 beklenen evidence türü listelenmiş | Boş |

`readyForDev` alanı araç tarafından türetilir; doğrudan veritabanına yazılmaz. Her kapı çalıştırmasında hesaplanır.

---

## 3. UI "Ready to Code" Kuyruğu Önerisi

actionplan arayüzüne aşağıdaki UI öğelerinin eklenmesi önerilmektedir. Bu öneri ayrı bir iş olarak planlanmalıdır.

**Ready to Code kuyruğu:** Yalnızca `readyForDev` skoru 10/10 olan ve `phase = development` olan görevleri listeleyen bir filtreli görünüm. Geliştirici sabah çalışmaya başlarken tek bir bakışla alınabilecek işleri görür.

**Doğrudan kodlama değil uyarısı:** `phase` değeri `backlog`, `db-schema` veya `test-plan` olan görevler kuyrukta görünmez. Bu fazlardaki görevlerin kart görünümüne "Bu görev doğrudan kodlama gerektirmez — önce [phase] çıktısı tamamlanmalıdır" uyarısı eklenir.

**App/module backlog uyarısı:** Bir görevin `deliverables` listesinde "yeni uygulama" veya "yeni modül" ifadesi geçiyorsa, o görev otomatik olarak `backlog` fazında kilitlenir ve "Bu görev development fazına alınmadan mimari onay gerektirir" etiketi gösterilir. Bu kural, AI ajanın veya geliştiricinin kapsam dışı modül üretmesini önleyen UI katmanı destekçisidir.

---

## 4. Makine Kapısı — check-ready-for-dev.mjs

Bu araç `tools/agents/check-ready-for-dev.mjs` yolunda oluşturulacaktır. Mevcut `check-execution-readiness.mjs` aracının yanına eklenir; onu değiştirmez.

Araç aşağıdaki işlevi yerine getirir.

**Girdi:** Tek bir TaskNode JSON nesnesi veya `platform-content/*.json` dosyasından yüklenen düğüm listesi.

**Kontrol kapsamı:** Yalnızca `phase = development` olan düğümler değerlendirilir. Diğer fazlar atlanır; uyarı üretilmez.

**Çıktı formatı:** Her düğüm için aşağıdaki yapıda çıktı üretir.

```
[PASS] task-id: "Görev başlığı" — 10/10 hazır
[FAIL] task-id: "Görev başlığı" — 7/10 hazır
  Eksik: traceability.repoPath, acceptanceCriteria, dependsOn[1] açık
```

**Çıkış kodu:** En az bir FAIL varsa araç exit kodu 1 ile çıkar. CI bu kodu engel olarak yorumlar.

**CI bağlantısı:** Araç `npm test` ve GitHub Actions CI pipeline'ına bağlanır. Development fazına yeni düğüm ekleyen her commit bu kapıyı tetikler. Kapıyı geçemeyen commit merge edilemez.

**npm test bağlantısı:** `package.json` scripts bölümüne aşağıdaki satır eklenir:

```json
"check:ready": "node tools/agents/check-ready-for-dev.mjs"
```

Bu komut `npm test` zincirinin bir parçası haline getirilir. Yerel geliştirici de commit öncesinde aynı kapıyı çalıştırabilir.

**check-execution-readiness.mjs ile ilişki:** Mevcut araç done kapısını ve execution readiness'ı kontrol eder. Yeni araç yalnızca "geliştirmeye başlanabilir mi?" sorusunu yanıtlar. İkisi birbirini tamamlar; çakışan kontrol yoktur.

---

## 5. Faz Geçiş Kuralları

Bir görev bir fazdan bir sonrakine geçerken DoR eşiğinin karşılanmış olması beklenir. Geçiş aşağıdaki sırayı izler.

`backlog` veya `db-schema` fazındaki bir görev `test-plan` fazına geçmeden önce şunlar tamamlanmış olmalıdır: kapsam netleştirilmiş (`acceptanceCriteria` taslağı var), bağımlılıklar tanımlanmış (`dependsOn` dolu), sorumlu belirlenmiş (`owner` dolu).

`test-plan` fazındaki bir görev `development` fazına geçmeden önce Section 1'deki tüm zorunlu alanlar eksiksiz dolu olmalıdır. `check-ready-for-dev.mjs` kapısı 10/10 skoru döndürmelidir. Bu koşul sağlanmadan faz geçişi reddedilir.

`development` fazındaki bir görev `done` statüsüne geçmeden önce mevcut `check-execution-readiness.mjs` kapısı çalışır: evidence kaydı, verification linki, `implementationStatus = complete` koşulları aranır.

Faz geçiş özeti:

| Kaynak faz | Hedef faz | Gerekli eşik |
|---|---|---|
| backlog / db-schema | test-plan | owner + dependsOn tanımlı + AC taslak |
| test-plan | development | Section 1 tüm alanlar + check-ready-for-dev 10/10 |
| development | done | check-execution-readiness done kapısı |

Bu üç eşik birbirini kesmez ve sıralıdır; bir eşiği atlayarak bir sonrakine geçilemez.
