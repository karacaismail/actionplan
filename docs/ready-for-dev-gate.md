# Definition of Ready — Code-Start Kapısı

Sürüm: 1.1 — 2026-07-08
Durum: Kanonik

## Genel Bakış

Bu doküman, bir TaskNode'un **kod yazma aşamasına** geçmeden önce karşılaması gereken zorunlu koşulları tanımlar.

Önemli ayrım:

- `check-waterfall-handoff.mjs`: tüm düğümlerin geliştiriciye devredilebilir waterfall plan tanımı taşıdığını kontrol eder.
- `check-ready-for-dev.mjs`: yalnız `phase=development` düğümlerinde code-start koşullarını kontrol eder.
- `check-execution-readiness.mjs`: dev+ ve done aşamalarında kanıt ve yürütme koşullarını kontrol eder.

Bu yüzden requirements/backlog aşamasında `evidence[]`, `repoPath` veya `testCommand` boşluğu blocker değildir. Bu alanlar ancak gerçek test-plan/development yürütmesi başladığında doldurulur.

## 1. Code-Start Zorunlu Alanları

Bir düğüm `phase=development` olduğunda aşağıdaki alanlar zorunludur:

| Alan | TaskNode yolu | Kural |
|---|---|---|
| Repo yolu | `traceability.repoPath[]` | Implementation reposu içindeki hedef yol veya yollar dolu olmalı |
| Test komutu | `traceability.testCommand[]` | Bu düğümü doğrulayacak komut veya komutlar dolu olmalı |
| Uygulama durumu | `traceability.implementationStatus` | `not-started` olamaz; `scaffolded`, `in-progress`, `implemented` veya `verified` olmalı |

`repoPath` gerçek dosya sisteminde var mı kontrolü actionplan CI'ının işi değildir; bu kontrol implementation reposunun CI'ında yapılır. actionplan yalnızca plan düğümünün code-start için yeterli izlenebilirlik taşımasını zorlar.

## 2. Makine Kapısı

Komut:

```bash
node tools/agents/check-ready-for-dev.mjs
```

Kapsam:

- `phase != development` olan düğümler atlanır.
- `phase=development` olan her düğüm için üç zorunlu alan kontrol edilir.
- En az bir ihlal varsa exit code `1` döner ve CI kırılır.

Örnek çıktı:

```text
[ready-for-dev] development fazı: 0 düğüm · ihlal: 0
SONUÇ: YEŞİL ✓ — development düğümleri repoPath+testCommand+implementationStatus taşıyor.
```

Development fazında düğüm yoksa bu sonuç doğrudur. Bu durum "ürün kodu tamamlandı" anlamına gelmez; yalnızca henüz code-start fazına alınmış düğüm olmadığını gösterir.

## 3. Waterfall-Start İle Farkı

Geliştiricinin waterfall çalışmasına başlaması için code-start kapısı gerekmez. Requirements, test-plan ve db-schema fazlarında geliştirici şunları üretir:

- kapsam ve dahil/dahil değil kararı
- kabul kriterleri
- risk ve rollback netliği
- test stratejisi
- şema/migration kararı
- evidence beklentisi

Bu plan-start koşulları `check-waterfall-handoff.mjs` ile korunur.

## 4. Done Kapısıyla Farkı

Bu kapı "başlanabilir mi?" sorusunu yanıtlar. "Bitti mi?" sorusunu yanıtlamaz.

Bir düğüm `status=done` olduğunda `check-execution-readiness.mjs` devreye girer ve şunları zorlar:

- `evidence[]` dolu
- verification fazı geçmiş
- dev+ fazlarda owner, refs, schedule, AC ve rollback dolu

Kanıtsız done yasaktır; fakat requirements aşamasında kanıt boşluğu doğaldır.

## 5. Go/No-Go

Kod yazmaya başla:

- Düğüm `phase=development`.
- `check-ready-for-dev.mjs` yeşil.
- Bağımlılık veya blocked durumu yok.

Kod yazmaya başlama:

- Düğüm requirements, test-plan veya db-schema fazında.
- `repoPath` veya `testCommand` eksik.
- `implementationStatus=not-started`.
- Düğüm blocked.

Bu karar, `docs/waterfall-developer-handoff.md` içindeki plan-start kararıyla birlikte okunmalıdır.
