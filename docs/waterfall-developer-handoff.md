# Waterfall Developer Handoff — Go/No-Go

Tarih: 2026-07-08  
Durum: Kanonik  
Kapsam: actionplan reposu, 467 WBS düğümü, 17 üretim boyutu.

## Karar

Bu repo ürün uygulaması değildir. Bu repo başka projenin enterprise-grade waterfall yol haritası, WBS iş tanımları, faz kapıları ve geliştiriciye devredilecek iş paketlerini tutar.

Geliştirici waterfall çalışmasına başlayabilir. Başlama blocker'ı yoktur.

Bu kararın makine karşılığı:

```bash
npm run qa:waterfall
```

Komut yeşilse her düğüm geliştiriciye devredilebilir plan tanımı taşır: sahip, takvim, faz kriterleri, teslimatlar, kabul kriterleri, risk, rollback, referanslar ve 17 boyut doludur.

## Yanlış Beklenti

Bu aşamada `evidence[]`, `traceability.repoPath` ve `traceability.testCommand` alanlarının büyük ölçüde boş olması blocker değildir.

Neden:

- `evidence[]` gerçek PR, CI, test, deploy, audit veya smoke-test çıktısıdır. Requirements/backlog aşamasında sahte kanıt yazılmaz.
- `repoPath` ve `testCommand` test-plan/development fazında netleşir. Requirements fazında her node için uydurma repo yolu yazmak geliştiriciyi yanlış yönlendirir.
- Bütün düğümlerin `status=backlog`, `phase=requirements` olması plan başlangıç durumudur; waterfall tamamlanmadı anlamına gelir, ama plan tanımıyla işe başlamayı engellemez.

## Başlama İçin Gerekli Minimum Paket

Her WBS düğümü şu alanları taşımalıdır:

| Alan | Neden gerekli |
|---|---|
| `owner` | Karar ve takip sahibi belli olur |
| `schedule.start/end` + baseline | Waterfall takvimi görülebilir |
| `phases[*].criteria` | Her fazın kapatma koşulu açık olur |
| `deliverables[]` | Ne teslim edilecek netleşir |
| `acceptanceCriteria[]` | Kabul neye göre yapılacak netleşir |
| `risks[]` | Enterprise risk kaydı baştan görünür |
| `rollback` | Geri alma disiplini baştan yazılır |
| `refs[]` | Geliştirici hangi sözleşmelere bakacağını bilir |
| 17 `dimensions` | Fonksiyon, güvenlik, kalite, operasyon ve day-2 kapsamı eksik kalmaz |

`check-waterfall-handoff.mjs` bu paketi zorlar.

## Waterfall Bitene Kadar Geliştirici Akışı

Faz sırası atlanmaz.

| Faz | Geliştirici çıktısı | Kod beklenir mi? |
|---|---|---|
| requirements | Kapsam, dahil/dahil değil, AC, risk, rollback, bağımlılık netliği | Hayır |
| test-plan | Test stratejisi, test dosyası taslağı, evidence beklentisi, `testCommand` | Üretim kodu hayır |
| db-schema | Veri modeli, migration/rollback kararı, API sözleşmesi, N/A gerekçesi | Sadece şema/migration taslağı |
| development | Test-önce kod, branch, PR, CI | Evet |
| test-qa | E2E, güvenlik, performans, a11y, regresyon kanıtları | Yeni özellik hayır |
| verification | Staging/smoke doğrulama, deploy hedefi, evidence geri yazma | Hayır |
| release-maintenance | Prod yayın, rollback testi, runbook, izleme | Operasyonel değişiklik olabilir |

## Code-Start Kapısı

Waterfall-start ile code-start aynı şey değildir.

Kod yazmaya başlanması için düğümün `phase=development` olması ve `check-ready-for-dev.mjs` kapısından geçmesi gerekir. O kapı şunları zorlar:

- `traceability.repoPath`
- `traceability.testCommand`
- `traceability.implementationStatus != not-started`

Bu alanlar requirements aşamasında zorlanmaz.

## Teknik Teslim Sırası Kapısı

Code-start yalnız faza bakmaz; platformun doğum sırasına da uyar. Bağlayıcı sıra:

1. Kernel.
2. SDK.
3. App'e özgü core module.
4. App'in ihtiyacı olan diğer module'ler.
5. App assembly / release train.

Bu sıra `docs/kernel-sdk-app-delivery-sequence.md` içinde kanoniktir. Kernel sözleşmesi hazır değilse SDK development başlatılmaz. SDK hazır değilse app-core production kodu yazılmaz. App-core hazır değilse app'in diğer module'leri development'a alınmaz. App düğümü doğrudan kod yazma yeri değildir; app assembly yalnız hazır module'leri paketler. Bu teknik sıranın operasyonel PR kuyruğu `docs/meta-framework-implementation-development-plan.md` içinde tutulur.

## Done Kapısı

Bir düğüm `done` sayılmadan önce `check-execution-readiness.mjs` kapısından geçer. Bu kapı kanıtsız tamamlanmayı engeller:

- `status=done` ise `evidence[]` dolu olmalıdır.
- verification fazı geçmiş olmalıdır.
- dev+ fazdaki düğümler owner, refs, schedule, AC ve rollback taşımalıdır.

## Geliştiricinin İlk 30 Dakikası

1. `docs/developer-guide.md` oku.
2. `docs/task-to-code-contract.md` içindeki seviye/faz tablosunu oku.
3. Uygulamada Execution veya Gantt görünümünden sıradaki düğümü aç.
4. Düğümün `phase` değerine bak.
5. Requirements ise kapsamı ve kabul kriterlerini netleştir.
6. Test-plan ise test stratejisi ve kanıt beklentisini yaz.
7. Development ise `repoPath` + `testCommand` + branch kuralıyla implementation reposuna geç.

## No-Go Koşulları

Aşağıdaki durumlardan biri varsa geliştirici başlamaz:

- `npm run qa:waterfall` kırmızı.
- Düğümün `acceptanceCriteria[]`, `deliverables[]`, `risks[]` veya `rollback` alanı boş.
- Faz kriterleri boş.
- Düğüm `blocked` ve bloklayan bağımlılık çözülmemiş.
- Kod yazılacak ama düğüm `phase=development` değil.
- Kod yazılacak ama `check-ready-for-dev.mjs` kırmızı.

Bu koşullar dışında actionplan tarafında geliştirici başlangıcını engelleyen açık yoktur.
