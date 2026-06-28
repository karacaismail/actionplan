# Veri Kalitesi Raporu — actionplan nodes.json

**Tarih:** 2026-06-28
**Kapsam:** public/data/nodes.json — 424 düğüm
**Yöntem:** salt-okunur node -e analizi; kod veya veri değiştirilmedi.
**Schema versiyonu:** 1.0.0 (tüm 424 düğümde)

> **Güncelleme (P3-impl + P4 sonrası):** Bu rapor iyileştirme ÖNCESİ taban-çizgisidir (424 düğüm). P3-impl ile owner boşluğu 411→0 (artık %100 dolu), 327 düğüme köken-refs eklendi ve dependsOn döngüleri kırıldı (DAG). P4 ile 13 platform düğümü eklendi (toplam 437). Güncel durum bloklayıcı `check-data-quality` kapısı + `npm test` invariantlarıyla korunur. Bu belge tarihsel kayıt olarak bırakılmıştır.

---

## 1. Temel Boşluk Özeti

424 düğümün neredeyse tamamı iki temel bilgi açısından boş: kim sorumlu (owner/assignees) ve nereden kaynaklanıyor (refs). Bu iki boşluk, planın "var" ile "takip edilebilir" arasındaki farkı tanımlar.

| Alan | Dolu | Boş | Doluluk |
|---|---|---|---|
| owner | 13 | 411 | %3 |
| assignees | 13 | 411 | %3 |
| refs | 2 | 422 | %0,5 |
| dependsOn | 312 | 112 | %74 |
| blocks | 187 | 237 | %44 |
| related | 325 | 99 | %77 |
| evidence | 0 | 424 | %0 |
| schedule (tarih dolu) | 3 | 421 | %0,7 |
| criticalPath = true | 8 | 416 | %2 |
| assignee (tekil alan) | 0 | 424 | %0 |

Not: `milestone`, `acceptanceCriteria`, `deliverables`, `risks`, `agentPolicy`, `dimensions`, `ecaRules`, `wbsCode` alanlarının tamamı 424/424 dolu; ancak içerik kalitesi aşağıda ele alınmaktadır.

---

## 2. Boşluk Kırılımı: Seviye ve Uygulama

### 2.1 Seviye (level) Bazında Owner / Refs / DependsOn Boşluğu

Her seviyede owner ve refs neredeyse tamamen boş. DependsOn en kötü noktası molecule/element/atom seviyesinde: bu üç seviye derinlik gerektirdiği halde bağımlılık zinciri hiç girilmemiş.

| level | Toplam | owner boş | refs boş | dependsOn boş |
|---|---|---|---|---|
| app | 27 | 26 | 27 | 8 |
| module | 149 | 148 | 149 | 18 |
| stone | 94 | 93 | 94 | 17 |
| archetype | 99 | 96 | 97 | 14 |
| molecule | 18 | 16 | 18 | 18 |
| element | 18 | 16 | 18 | 18 |
| atom | 19 | 16 | 19 | 19 |

App seviyesinde bile 26/27 owner boş. Üst düzey sahiplik tanımlanmamışken alt seviyelerde sorumlu ataması beklemek anlamsız. molecule/element/atom seviyesinde dependsOn %100 boş; bu seviyelerin birbirine sırası bağlı olması gerektiği düşünüldüğünde kritik eksik.

### 2.2 Uygulama (App) Bazında Boşluk

Owner ve refs doluluk oranı her uygulamada sıfıra yakın. Doluluk yalnızca CRM ekseninde gerçek değer taşıyor.

| app_prefix | Toplam | owner_dolu | refs_dolu |
|---|---|---|---|
| s (archetype katmanı) | 99 | 1 | 0 |
| app (app node'ları) | 87 | 1 | 0 |
| edu | 35 | 0 | 0 |
| adr | 25 | 0 | 0 |
| k (kernel) | 21 | 0 | 0 |
| l1 (layer1) | 20 | 0 | 0 |
| cc (content-collab) | 18 | 0 | 0 |
| sus | 17 | 0 | 0 |
| scale | 15 | 0 | 0 |
| dist | 13 | 0 | 0 |
| at (crm atomları) | 3 | 3 | 0 |
| mol (crm) | 2 | 2 | 0 |
| customer | 1 | 1 | 1 |
| product | 1 | 1 | 1 |

Sadece `at`, `mol`, `customer`, `product` ve CRM zincirinde (toplam ~13 düğüm) owner atanmış; refs ise yalnızca `customer` ve `product` düğümlerinde (2/424) dolu.

---

## 3. Phase / Status Tutarsızlığı

407 düğüm `phase: db-schema` + `status: backlog` kombinasyonunu taşıyor. Bu teknik olarak tutarsız değil; ancak 407 düğümün aynı anda "şema tasarım aşamasında" gösterilmesi fazın içeriğini boşaltır; fase geçiş kapısı işlevsiz.

Gerçek tutarsızlıklar şunlardır:

| Kombinasyon | Sayı | Sorun |
|---|---|---|
| db-schema + in-progress | 2 | Faz db-schema, status aktif — kim ne yapıyor? |
| db-schema + todo | 2 | Faz db-schema, status todo — bu faz mı yoksa status mı yanlış? |
| development + in-progress | 6 | Tutarlı, CRM zinciri |
| test-plan + todo | 3 | Tutarlı, test hazırlığı |
| release-maintenance + done | 3 | Tutarlı, CRM atomları tamamlandı |
| test-qa + in-progress | 1 | Tutarlı, lead-scoring |

`db-schema + in-progress` olan iki düğüm (`k-control-planes`, `k-surface`) Kernel modülüne ait; bunlar için phase'in `development`'a güncellenmesi veya in-progress durumunun açıklanması gerekiyor. Bunlar aynı zamanda owner boş.

Büyük tablo yorumu: 411 düğüm `db-schema` fazında — bu faz "henüz tasarlanmamış" anlamında bir başlangıç marker'ı gibi kullanılmış. Bu bir tasarım kararı olabilir, ancak fazın anlamını aşındırıyor; tüm plandaki gerçek ilerleme `db-schema` kisvesi altında görünmez hale geliyor.

---

## 4. Duplicate / Generic İçerik

### 4.1 Risks Şablonu

407 düğümde (`%96`) risks alanı iki adet kalıp cümle içeriyor:

- "varlık/işlem/kayıt sözleşmesi/şeması üst katmanla uyumsuzlaşabilir"
- "liste sorgusu ölçek altında yavaşlayabilir"

Bu cümleler otomatik üretilmiş; her düğümün gerçek operasyonel riskini yansıtmıyor. Bir CRM lead-scoring kuralı ile bir e-fatura modülü aynı risk metnini paylaşıyor.

### 4.2 Deliverables Şablonu

411/424 düğümde deliverables dizisinin ilk elemanı "Testler + dokümantasyon" — toplam 861 deliverable kaleminin 411'i (%48) bu tek cümle. Gerçek teslimat içeriğini taşımıyor.

### 4.3 AcceptanceCriteria Şablonu

861 acceptance criteria kaleminin 407'si (%47) "KVKK + AAA erişilebilirlik kapıları geçti" kalıbını içeriyor. Bu kriter kategorik olarak doğru ancak düğüme özgü değil; bir atom-seviye regex validatör ile bir app-level modül için aynı kriter yazılmış.

### 4.4 Scaffold (İskelet) Düğümler

59 düğüm "örnek dal" ibaresi taşıyan summary ile üretilmiş (app-backend-x-archetype, app-backend-x-stone vb.). Bu düğümler gerçek iş tanımlaması değil; WBS hiyerarşisinin iskeletini göstermek için oluşturulmuş yer tutuculardır. Hepsi `phase: db-schema`, `status: backlog`.

### 4.5 Eğitim Uygulaması Duplikasyonu

`app-edu` (Eğitim) ve `app-egitim` (Egitim) iki ayrı app-level düğüm olarak kayıtlı — aynı uygulama iki farklı slug/id ile iki kez var. `app-edu` 35 alt düğüme sahip; `app-egitim` 5 alt düğüme sahip ve hiç archetype içermiyor. Hangisinin kanonik olduğu belirsiz.

---

## 5. Kapsam Dengesi

27 app-level düğüm var; bunların bazıları tam derinlikte (module/stone/archetype/molecule/element/atom), çoğu yalnızca module katmanına kadar girilmiş.

| App | module | stone | archetype | mol | el | atom | Değerlendirme |
|---|---|---|---|---|---|---|---|
| app-core-operations | 4 | 5 | 11 | 2 | 2 | 3 | En derin; CRM zinciri burada |
| app-finance | 1 | 1 | 12 | 1 | 1 | 1 | Archetype zengin, alt katman iskelet |
| app-data-intelligence | 0 | 1 | 13 | 1 | 1 | 1 | Archetype zengin, alt katman iskelet |
| app-kararlar | 25 | 0 | 0 | 0 | 0 | 0 | Sadece module; ADR düğümleri |
| app-aday | 30 | 0 | 0 | 0 | 0 | 0 | Sadece module; aday listesi |
| app-atomic | 1 | 0 | 0 | 0 | 0 | 0 | Tek module, tamamen boş derinlik |
| app-genel | 1 | 0 | 0 | 0 | 0 | 0 | Tek module |
| app-meta | 3 | 0 | 0 | 0 | 0 | 0 | Sadece module |
| app-dx | 3 | 1 | 0 | 0 | 0 | 0 | Geliştiriciye özgü, zayıf derinlik |
| app-edu | 3 | 17 | 10 | 0 | 0 | 0 | Stone + archetype var, alt boş |

`app-scale` (15 stone, archetype yok), `app-sus` (14 stone, archetype yok), `app-crosscut` (15 stone, archetype yok) — bu üç app stone katmanı dolu ama archetype/molecule/element/atom hiç girilmemiş.

---

## 6. Kritik Yol ve Zaman Çizelgesi Durumu

8 düğüm `criticalPath: true` işaretli. Tamamı CRM zinciri: `app-core-operations -> m-crm-sales -> s-crm -> st-crm-lead-mgmt -> mol-crm-lead-scoring -> el-crm-score-field-validator -> at-crm-email-regex / at-crm-score-range-check`. Bu 8 düğümün 3'ü done, 1'i test-qa/in-progress, gerisinde development devam ediyor. Kritik yol gerçek iş içeriyor.

Ancak 421/424 düğümde `schedule.start` ve `schedule.end` null — hiçbir zaman hedefi yok. Kritik yolun ne zaman tamamlanacağı hesaplanamaz.

---

## 7. Ground-Truth Doğrulama

Görevde verilen başlangıç metrikleri kendi hesaplarımla karşılaştırıldı:

| Metrik | Verilen | Hesaplanan | Durum |
|---|---|---|---|
| owner boş | 411/424 | 411/424 | Uyuşuyor |
| refs boş | 422/424 | 422/424 | Uyuşuyor |
| dependsOn boş | 112/424 | 112/424 | Uyuşuyor |
| assignee boş | 424/424 | 424/424 (tekil alan) + 411/424 (assignees dizisi) | Uyuşuyor; şemada iki alan var |
| backlog | 407 | 407 | Uyuşuyor |
| in-progress | 9 | 9 | Uyuşuyor |
| todo | 5 | 5 | Uyuşuyor |
| done | 3 | 3 | Uyuşuyor |
| progress ort. | 1.71 | 1.71 | Uyuşuyor |
| db-schema | 411 | 411 | Uyuşuyor |
| development | 6 | 6 | Uyuşuyor |

Başlangıç metriklerinde çelişki yok. Ek bulgular:

- `evidence` alanı 424/424 boş (görevde belirtilmemişti).
- `schedule` tarihleri 421/424 tamamen null (görevde belirtilmemişti).
- 59 scaffold "örnek dal" düğümü (görevde belirtilmemişti).
- `app-edu` / `app-egitim` duplikasyonu (görevde belirtilmemişti).
- `blocks` alanı 187/424 dolu; `related` alanı 325/424 dolu (görevde belirtilmemişti).
- `dependsOn` referanslarında kırık bağlantı yok (tüm 312 referans geçerli id'lere işaret ediyor).
