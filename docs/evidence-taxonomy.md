# Kanıt Taksonomisi — Ne Kanıt Sayılır, Ne Sayılmaz

**Sürüm:** 1.0 · **Tarih:** 2026-06-29
**Durum:** Kanonik, bağlayıcı. task-to-code-contract §4 (Evidence) ve `check-execution-readiness` kapısının türevidir; bu ikisiyle çelişen madde geçersizdir.
**Kapsam:** `TaskNode.evidence[]` alanı (`src/schemas/task.ts`), 7 waterfall fazının faz-başına zorunlu kanıtı ve "done" kapısının kanıt zorlaması.

---

## Önsöz — Kanıt Neden Bir Taksonomi Gerektirir

task-to-code-contract §6 Uyarı 4 tek cümlede sorunu koyar: "Bu test çalıştı, güven ifadesi yeterli değildir." Bir faz kapısını geçirmek için somut, doğrulanabilir kanıt gerekir; metin iddiası değil. Ama "somut kanıt" da belirsiz bir terimdir: bir cümle mi, bir ekran görüntüsü mü, bir URL mi? Bu taksonomi o belirsizliği kapatır: kanıt türlerini tanımlar, her fazın hangi türü zorunlu kıldığını tablolar, ve en kritiği — neyin kanıt SAYILMADIĞINI açıkça listeler.

`evidence[]` alanı düğümde ZATEN vardır (`z.array(z.string()).default([])`); bu taksonomi onu çoğaltmaz, doldurma disiplinini tanımlar. Her giriş bir string'tir ama serbest metin DEĞİL: bir URL, bir dosya yolu, bir rapor referansı veya bir log referansı olmalıdır.

---

## 1. Kanıt Türleri

Geçerli kanıt dört türden biridir. Her tür makine veya bağımsız bir insan tarafından AÇILIP doğrulanabilir olmalıdır.

| Tür | Tanım | Geçerli örnek | Neden kanıt |
|---|---|---|---|
| URL | Çalıştırılabilir/açılabilir bağlantı; CI çalıştırması, deploy edilmiş ortam, rapor sayfası. | `https://github.com/<org>/platform/actions/runs/123456` (yeşil CI); `https://staging.example.com/customers` | Tıklanır, durumu o an doğrulanır. |
| Dosya yolu | Repodaki gerçek artefakt yolu; test dosyası, migration, rapor çıktısı. | `platform/backend/alembic/versions/2026_06_29_customers.py`; `tests/customer/test_model.py` | Repoda bulunur, içeriği okunur. |
| Rapor | Bir aracın ürettiği yapılandırılmış çıktı; Playwright HTML raporu, axe-core ihlal raporu, performans p95 ölçümü. | `playwright-report/index.html` (URL veya yol); `axe: 0 ihlal` raporu çıktısı | Araç ürettiği için tekrarlanabilir ve denetlenebilir. |
| Log | Bir çalıştırmanın zaman damgalı çıktısı; rollback test logu, prod deploy logu, smoke test logu, bağımlılık audit çıktısı. | rollback test logu yolu/URL; `pip-audit` çıktısı; staging smoke test logu | Gerçekten çalıştırıldığını kanıtlar. |

Ortak kural: her dört tür de **işaret eder** (URL/yol/referans); kanıtın kendisini metne kopyalamaz. `evidence[]` girişi "kanıta giden adres"tir, kanıtın özeti değil.

---

## 2. Faz Başına Zorunlu Kanıt

Aşağıdaki tablo task-to-code-contract §4 Evidence tablosuyla BİREBİR hizalıdır; her waterfall fazı için kapının geçilebilmesi adına `evidence[]`'a girilmesi gereken minimum kanıttır. Faz sırası ve kapı kuralları o sözleşmededir; burada yalnız kanıt boyutu ele alınır.

| Faz | Zorunlu kanıt | Tür(ler) |
|---|---|---|
| requirements | (kanıt zorunluluğu yok — çıktı `acceptanceCriteria[]`/`deliverables[]`; kapı kanıtı sonraki fazlarda başlar) | — |
| test-plan | Test dosyası yolu (`repoPath` + `testCommand` ile tutarlı) — önce kırmızı testin dosyası | Dosya yolu |
| db-schema | Alembic migration dosyası yolu (`upgrade()` + `downgrade()` dolu); rollback test logu | Dosya yolu + Log |
| development | CI pipeline URL (yeşil) | URL |
| test-qa | Playwright HTML raporu URL; axe-core 0 ihlal raporu; güvenlik tarama çıktısı (OWASP ZAP); performans p95 ölçümü | Rapor + URL |
| verification | Staging smoke test logu; `deployTarget` URL | Log + URL |
| release-maintenance | Prod deploy logu; rollback test logu; bağımlılık audit çıktısı (npm audit / pip-audit) | Log |

Okuma kuralları:

- Bir faz birden fazla kanıt türü istiyorsa hepsi `evidence[]`'ta bulunmalı (ör. test-qa için hem Playwright raporu hem axe raporu).
- Kanıt fazla-yetkili değildir: development fazının yeşil CI URL'si test-qa'nın a11y kanıtını KARŞILAMAZ. Her faz kendi kanıtını ister.
- Faz sırası kanıtı da sıralar: bir fazın kanıtı, bir önceki fazın kanıtı yokken anlamsızdır (task-to-code-contract: önceki faz kapısı geçilmeden sonraki faz `active` olamaz).

---

## 3. Ne Kanıt SAYILMAZ

Bu liste task-to-code-contract §6 Uyarı 4'ün operasyonel açılımıdır. Aşağıdakiler `evidence[]`'a yazılsa bile geçerli kanıt DEĞİLdir ve faz kapısını geçiremez:

| Sayılmaz | Neden | Yerine |
|---|---|---|
| "Test geçti, güven" / "çalışıyor" gibi serbest metin iddiası | Doğrulanamaz; kimse açıp kontrol edemez. | Yeşil CI çalıştırmasının URL'si veya rapor yolu. |
| "Yarın ekleyeceğim" / planlanan kanıt | Kanıt geçmiş bir çalıştırmanın kaydıdır, gelecek vaadi değil. | Çalıştır, çıktının URL/yolunu yaz. |
| Yerel makinede "bende çalıştı" | Tekrarlanabilir/denetlenebilir değil; CI ortamında doğrulanmadı. | CI pipeline URL (yeşil). |
| Ekran görüntüsü tek başına (kaynaksız) | Bağlam/zaman damgası yok; manipüle edilebilir, tekrarlanamaz. | Raporun/URL'nin kendisi; görüntü ancak ek olur. |
| Kırmızı/atlanan (skipped) testi "geçti" saymak | Yeşil olmayan test kanıt değildir; skipped test = kanıt yok. | Testi yeşile getir, sonra çalıştırma URL'sini yaz. |
| Migration dosyası `downgrade()` boş | Rollback edilemeyen migration db-schema kanıtı sayılmaz (task-to-code-contract §6 Uyarı 3). | `upgrade()` + `downgrade()` dolu migration + rollback test logu. |
| `passed: true` ama `evidence[]` boş | Kanıtsız "passed" sahte tamamlanmadır; `check-execution-readiness` kırmızı yapar. | Faz kanıtını ekle, sonra kapıyı geçir. |
| Çözülemeyen/ölü link | Açılmayan URL kanıt değil; kanıt o an doğrulanabilir olmalı. | Kalıcı, erişilebilir artefakt URL/yolu. |

Altın kural: bir kanıt, onu yazan kişi olmadan, bağımsız bir denetçi tarafından AÇILIP doğrulanabiliyorsa kanıttır; aksi halde iddiadır.

---

## 4. check-execution-readiness Bağı — Kanıt Nasıl Zorlanır

Kanıt disiplini makineye `tools/agents/check-execution-readiness.mjs` (BLOKLAYICI; `deploy.yml` içinde) ile bağlanır. Bu kapı `src/data/generated/nodes` altındaki 445 düğümü tarar ve üç kuralı zorlar; ilki doğrudan kanıt zorlamasıdır:

| Kural | Ne zorlar | Kanıt karşılığı |
|---|---|---|
| Done Evidence | `status="done"` olan düğüm `evidence[]` (≥1) taşımalı VE `phases.verification.status === "passed"` olmalı. | Kanıtsız "done" YASAK — §3'teki "passed ama evidence boş" anti-pattern'ini bloklar. |
| Execution Readiness | `development`/`test-qa`/`verification`/`release-maintenance` fazındaki düğüm `owner` + `refs`(≥1) + `schedule.start` + `acceptanceCriteria`(≥1) + `rollback` taşımalı. | Yürütme fazındaki düğüm sahipli, planlı ve geri-alınabilir olmalı; kanıt toplanabilir hale gelmeli. |
| Platform Traceability | `id` "platform-" ile başlayan düğüm `traceability` (`implementationStatus` + `deployTarget`) taşımalı. | Kanıtın işaret ettiği gerçek deploy hedefi/uygulama durumu bağı zorunlu. |

Pratik sonuç: bir düğümü "done" yapmak için iki şart birden gerekir — en az bir geçerli `evidence[]` girişi VE verification fazının "passed" olması. Bu, §3'teki "passed ama kanıt yok" durumunu kapıda yakalar. Kanıt türü ve faz-başına zorunluluk (§1, §2) insan disiplinidir; `check-execution-readiness` ise "done" anında en az bir kanıtın ve geçmiş verification kapısının VARLIĞINI makineyle garanti eder.

İlgili runbook: kanıtın bir görev tamamlandıktan sonra actionplan'a geri yazılması prosedürü `docs/evidence-update-runbook.md`'dedir (merge + deploy doğrulandıktan sonra, insan onayıyla). Bu taksonomi "ne kanıt sayılır"ı; o runbook "kanıt nasıl/ne zaman yazılır"ı tanımlar.

---

## 5. Kanıt Yazım Deseni

Bir `evidence[]` girişi yazarken:

1. Türü belirle (§1): URL mü, dosya yolu mu, rapor mı, log mu.
2. Fazın o türü gerçekten istediğini doğrula (§2 tablosu).
3. İşaret yaz, özet değil: kanıtın adresini (URL/yol/referans) gir; "test geçti" gibi metin yazma (§3).
4. Açılabilirliği doğrula: yazdığın URL/yol gerçekten erişilebilir ve doğru durumu (yeşil/0-ihlal) gösteriyor mu.

Örnek dolu `evidence[]` (test-qa fazını geçirmiş bir frontend archetype):

```json
"evidence": [
  "https://github.com/<org>/platform/actions/runs/789012",
  "platform/frontend/playwright-report/index.html",
  "axe-core: customers sayfası 0 ihlal (rapor: platform/frontend/a11y/customers.json)",
  "perf: p95 420ms < 500ms hedef (k6 çıktısı: platform/perf/customers.txt)"
]
```

Her giriş ayrı bir doğrulanabilir artefakta işaret eder; hiçbiri serbest iddia değildir.

---

## Çelişki Bildirimi

Bu taksonomi task-to-code-contract §4 ve `check-execution-readiness` davranışının türevidir. Faz-başına zorunlu kanıt tablosu (§2) o sözleşmenin Evidence tablosuyla birebir tutulmalıdır; sözleşme değişirse bu doküman hizalanır. `evidence[]` alan tanımı tek kaynak olarak `src/schemas/task.ts`'dedir.

*Son güncelleme: 2026-06-29. Bir sonraki güncelleme yalnızca yeni waterfall fazı eklendiğinde, faz-kanıt eşlemesi değiştiğinde veya check-execution-readiness kuralları güncellendiğinde yapılmalıdır.*
