# Definition of Ready — Code-Start Kapısı

Sürüm: 1.2 — 2026-07-13
Durum: Kanonik

## Genel Bakış

Bu doküman, bir TaskNode'un **kod yazma aşamasına** geçmeden önce karşılaması gereken zorunlu koşulları tanımlar.

Bu kapı AI'ya platform yazma izni vermez. AI erişimi `read-only-audit`, platform ürün kodu
yazarı `human-developer-only`dır; code-start yalnız insan geliştirici için hazırlanır.
Kanonik yasak: `docs/platform-product-code-write-prohibition-directive.md`.

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

**UI development adayı için ek readiness alanları** (`docs/storybook-implementation.md` §5 requirements/test-plan kapıları): UI/Master Component kapsamına giren bir düğüm `phase=development` olmadan önce şunları da taşımalıdır — (1) **component kind kararı**: Master mı local mi (Master/local ayrımı `ui-components.json` uic-storybook-master-component; her local zorla Master yapılmaz); (2) **story planı**: zorunlu story matrisinden (uic-story-matrix-required) uygulanacak satırlar + gerekçeli hariç tutulanlar, `test-plan` fazında review edilmiş; (3) **Storybook test komutu**: `traceability.testCommand[]` içinde story interaction/a11y koşusunu içeren komut (ör. storybook test runner çağrısı). Bu üç alan eksikse UI düğümü code-start alamaz; story'siz Master Component merge edilemez.

**URL/route development adayı için ek readiness:** `standardRefs.urlPolicyRef` kanonik `url-policy` değerine çözülmeli; kullanılacak `routeId`, resource kind/prefix, HostBindingProfile, RouteProjection ve SlugProfile registry'de bulunmalı; private/public veri sınıfı açık olmalı; test-plan en az bir canonical parity ve bir tenant/authorization negatif senaryo taşımalıdır. Registry dışı route/prefix veya string URL concat code-start alamaz.

URLP program düğümlerinde ek olarak `src/data/url-policy/implementation-program.json` faz kaydı bulunmalı; `dependsOn` doğrudan predecessor WBS atomuyla eşleşmeli; allowedFiles, nonGoals, redTests, testCommands, evidenceRequirements, rollback ve stopConditions boş olmamalı; predecessor evidence ile verified değilse code-start reddedilmelidir.

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

İnsan geliştirici kod yazmaya başlar:

- Düğüm `phase=development`.
- `check-ready-for-dev.mjs` yeşil.
- Bağımlılık veya blocked durumu yok.

İnsan geliştirici kod yazmaya başlamaz:

- Düğüm requirements, test-plan veya db-schema fazında.
- `repoPath` veya `testCommand` eksik.
- `implementationStatus=not-started`.
- Düğüm blocked.

Bu karar, `docs/waterfall-developer-handoff.md` içindeki plan-start kararıyla birlikte okunmalıdır.
