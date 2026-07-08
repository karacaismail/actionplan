# Veri Kalitesi Raporu — actionplan nodes.json

**Tarih:** 2026-06-28
**Kapsam:** public/data/nodes.json — eski snapshot
**Yöntem:** salt-okunur node -e analizi; kod veya veri değiştirilmedi.
**Schema versiyonu:** 1.0.0 (eski snapshot)

> **Güncelleme (2026-07-08):** Bu rapor iyileştirme öncesi taban çizgisidir. Güncel canonical gerçeklik 467 düğüm, 17 üretim boyutu, exact-17 içerik kapısı ve bloklayıcı `check-data-quality` / `qa:content` / `qa:dimensions` zinciridir. Bu belge tarihsel kayıt olarak bırakılmıştır; güncel metrik yerine kullanılmaz.

---

## 1. Temel Boşluk Özeti

Eski snapshot'ın neredeyse tamamı iki temel bilgi açısından boştu: kim sorumlu (owner/assignees) ve nereden kaynaklanıyor (refs). Bu iki boşluk, planın "var" ile "takip edilebilir" arasındaki farkını tanımlamak için kayda geçirildi.

| Alan | Dolu | Boş | Doluluk |
|---|---|---|---|
| owner | 13 | 411 | %3 |
| assignees | 13 | 411 | %3 |
| refs | tarihsel düşük | tarihsel yüksek | düşük |
| dependsOn | 312 | 112 | %74 |
| blocks | 187 | 237 | %44 |
| related | 325 | 99 | %77 |
| evidence | yok | snapshot tamamı | %0 |
| schedule (tarih dolu) | 3 | 421 | %0,7 |
| criticalPath = true | 8 | 416 | %2 |
| assignee (tekil alan) | yok | snapshot tamamı | %0 |

Not: `milestone`, `acceptanceCriteria`, `deliverables`, `risks`, `agentPolicy`, `dimensions`, `ecaRules`, `wbsCode` alanları eski snapshot'ta doluydu; ancak içerik kalitesi aşağıda ele alınmaktadır.

---

## 2. Boşluk Kırılımı: Seviye ve Uygulama

### 2.1 Seviye (level) Bazında Owner / Refs / DependsOn Boşluğu

Her seviyede owner ve refs neredeyse tamamen boş. DependsOn en kötü noktası component/work_unit/micro_step seviyesinde: bu üç seviye derinlik gerektirdiği halde bağımlılık zinciri hiç girilmemiş.

| level | Toplam | owner boş | refs boş | dependsOn boş |
|---|---|---|---|---|
| app | 27 | 26 | 27 | 8 |
| module | 149 | 148 | 149 | 18 |
| feature | 94 | 93 | 94 | 17 |
| archetype | 99 | 96 | 97 | 14 |
| component | 18 | 16 | 18 | 18 |
| work_unit | 18 | 16 | 18 | 18 |
| atom | 19 | 16 | 19 | 19 |

App seviyesinde bile 26/27 owner boş. Üst düzey sahiplik tanımlanmamışken alt seviyelerde sorumlu ataması beklemek anlamsız. component/work_unit/micro_step seviyesinde dependsOn %100 boş; bu seviyelerin birbirine sırası bağlı olması gerektiği düşünüldüğünde kritik eksik.

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
| micro_step (crm atomları) | 3 | 3 | 0 |
| component (crm) | 2 | 2 | 0 |
| customer | 1 | 1 | 1 |
| product | 1 | 1 | 1 |

Sadece `micro_step`, `component`, `customer`, `product` ve CRM zincirinde az sayıda owner atanmış; refs ise yalnızca `customer` ve `product` düğümlerinde doluydu.

---

## 3. Phase / Status Tutarsızlığı

Eski snapshot'ta çok sayıda düğüm `phase: db-schema` + `status: backlog` kombinasyonunu taşıyordu. Bu teknik olarak tutarsız değil; ancak çok sayıda düğümün aynı anda "şema tasarım aşamasında" gösterilmesi fazın içeriğini boşaltır; faz geçiş kapısı işlevsizleşir.

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

Büyük tablo yorumu: eski snapshot'ın büyük çoğunluğu `db-schema` fazındaydı — bu faz "henüz tasarlanmamış" anlamında bir başlangıç marker'ı gibi kullanılmıştı. Bu bir tasarım kararı olabilir, ancak fazın anlamını aşındırıyor; tüm plandaki gerçek ilerleme `db-schema` kisvesi altında görünmez hale geliyor.

---

## 4. Duplicate / Generic İçerik

### 4.1 Risks Şablonu

Eski snapshot'ın büyük çoğunluğunda risks alanı iki adet kalıp cümle içeriyordu:

- "varlık/işlem/kayıt sözleşmesi/şeması üst katmanla uyumsuzlaşabilir"
- "liste sorgusu ölçek altında yavaşlayabilir"

Bu cümleler otomatik üretilmiş; her düğümün gerçek operasyonel riskini yansıtmıyor. Bir CRM lead-scoring kuralı ile bir e-fatura modülü aynı risk metnini paylaşıyor.

### 4.2 Deliverables Şablonu

Eski snapshot'ın büyük çoğunluğunda deliverables dizisinin ilk elemanı "Testler + dokümantasyon" idi. Gerçek teslimat içeriğini taşımıyordu.

### 4.3 AcceptanceCriteria Şablonu

Eski snapshot'ta çok sayıda acceptance criteria kalemi "KVKK + AAA erişilebilirlik kapıları geçti" kalıbını içeriyordu. Bu kriter kategorik olarak doğru ancak düğüme özgü değildi; bir atom-seviye regex validatör ile bir app-level modül için aynı kriter yazılmıştı.

### 4.4 Scaffold (İskelet) Düğümler

59 düğüm "örnek dal" ibaresi taşıyan summary ile üretilmiş (app-backend-x-kaya, app-backend-x-tas vb.). Bu düğümler gerçek iş tanımlaması değil; WBS hiyerarşisinin iskeletini göstermek için oluşturulmuş yer tutuculardır. Hepsi `phase: db-schema`, `status: backlog`.

### 4.5 Eğitim Uygulaması Duplikasyonu

`app-edu` (Eğitim) ve `app-egitim` (Egitim) iki ayrı app-level düğüm olarak kayıtlı — aynı uygulama iki farklı slug/id ile iki kez var. `app-edu` 35 alt düğüme sahip; `app-egitim` 5 alt düğüme sahip ve hiç archetype içermiyor. Hangisinin kanonik olduğu belirsiz.

---

## 5. Kapsam Dengesi

27 app-level düğüm var; bunların bazıları tam derinlikte (module/archetype/feature/component/work_unit/micro_step), çoğu yalnızca module katmanına kadar girilmiş.

| App | module | archetype | feature | component | work_unit | micro_step | Değerlendirme |
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
| app-edu | 3 | 17 | 10 | 0 | 0 | 0 | Feature + archetype var, alt boş |

`app-scale` (15 feature, archetype yok), `app-sus` (14 feature, archetype yok), `app-crosscut` (15 feature, archetype yok) — bu üç app feature/taş katmanı dolu ama archetype/component/work_unit/micro_step hiç girilmemiş.

---

## 6. Kritik Yol ve Zaman Çizelgesi Durumu

8 düğüm `criticalPath: true` işaretli. Tamamı CRM zinciri: `app-core-operations -> m-crm-sales -> s-crm -> tas-crm-lead-mgmt -> kum-crm-lead-scoring -> molekul-crm-score-field-validator -> atom-crm-email-regex / atom-crm-score-range-check`. Bu 8 düğümün 3'ü done, 1'i test-qa/in-progress, gerisinde development devam ediyor. Kritik yol gerçek iş içeriyor.

Ancak eski snapshot'ın büyük çoğunluğunda `schedule.start` ve `schedule.end` null idi — zaman hedefi yoktu. Kritik yolun ne zaman tamamlanacağı hesaplanamıyordu.

---

## 7. Ground-Truth Doğrulama

Görevde verilen başlangıç metrikleri kendi hesaplarımla karşılaştırıldı:

| Metrik | Verilen | Hesaplanan | Durum |
|---|---|---|---|
| owner boş | tarihsel yüksek | tarihsel yüksek | Uyuşuyor |
| refs boş | tarihsel yüksek | tarihsel yüksek | Uyuşuyor |
| dependsOn boş | tarihsel orta | tarihsel orta | Uyuşuyor |
| assignee boş | tarihsel tam | tarihsel tam | Uyuşuyor; şemada iki alan var |
| backlog | tarihsel yüksek | tarihsel yüksek | Uyuşuyor |
| in-progress | 9 | 9 | Uyuşuyor |
| todo | 5 | 5 | Uyuşuyor |
| done | 3 | 3 | Uyuşuyor |
| progress ort. | 1.71 | 1.71 | Uyuşuyor |
| db-schema | 411 | 411 | Uyuşuyor |
| development | 6 | 6 | Uyuşuyor |

Başlangıç metriklerinde çelişki yok. Ek bulgular:

- `evidence` alanı eski snapshot'ta tamamen boştu (görevde belirtilmemişti).
- `schedule` tarihleri eski snapshot'ta büyük ölçüde null idi (görevde belirtilmemişti).
- 59 scaffold "örnek dal" düğümü (görevde belirtilmemişti).
- `app-edu` / `app-egitim` duplikasyonu (görevde belirtilmemişti).
- `blocks` ve `related` alanları eski snapshot'ta kısmen doluydu (görevde belirtilmemişti).
- `dependsOn` referanslarında kırık bağlantı yok (tüm 312 referans geçerli id'lere işaret ediyor).
