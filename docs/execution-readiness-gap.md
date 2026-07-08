# Execution Readiness Gap Analizi

**Tarih:** 2026-06-28
**Kapsam:** actionplan nodes.json — eski snapshot
**Soru:** Bu plan neden execution-ready değil? Enterprise execution-ready olmak için ne gerekiyor?

---

## 1. Temel Kavram: "Node Var" ile "Enterprise Execution-Ready" Farkı

Eski snapshot'ta WBS hiyerarşisi çizilmiş, schemaVersion 1.0.0, title/summary/wbsCode dolu, risks/acceptanceCriteria/deliverables alanları vardı. Bu "WBS kataloğu var" anlamına gelir.

Enterprise execution-ready olmak farklı bir durumdur. Bir planı execution-ready yapan şey şudur: herhangi bir düğümü alan bir ekip, o düğümden bağımsız olarak şu soruların yanıtını düğümün içinde bulabilmeli:

1. Kim sorumlu ve kime raporlanır?
2. Bu iş ne zaman başlıyor, ne zaman bitiyor?
3. Bu iş bitmeden hangi başka işler başlayamaz?
4. Hangi belgeler, testler, PR'lar tamamlandığında bu iş done sayılır?
5. Bu işin durumu bugün itibarıyla gerçekte nedir?

Eski snapshot'ta bu soruların büyük çoğunluğu yanıtsızdı.

---

## 2. Neden Execution-Ready Değil: Boşlukların Etkisi

### 2.1 Owner Yok — Sorumluluk Yok

Eski snapshot'ın büyük çoğunluğunda `owner` boştu. Bu şu anlama gelir: bir düğüm "backlog" kaldığında onu ilerletmekle yükümlü kimse yok. Proje yönetim sistemlerinde "atanmamış iş" kategorik olarak ilerlemeyen iştir. Bir CI kapısı olmadan bu durum sonsuz backlog üretir.

Daha kritik olanı: app-level düğümlerin çoğunda owner boştu. Uygulamaların sahipliği tanımlanmamışken modül ve alt düzey sahipliği atamak anlamsız; sahiplik hiyerarşi boyunca yukarıdan aşağıya türetilmek zorunda.

Eski durum: sadece CRM zinciri ve birkaç archetype düğümü atanmıştı; geri kalan büyük çoğunluk yetimdi.

### 2.2 Refs Yok — Kaynak İzlenemiyor

`refs` alanı bir düğümün dayandığı teknik artefaktları (ADR, şema dosyası, archetype sözleşmesi, PR, confluence sayfası) tutar. Eski snapshot'ta büyük çoğunlukta boştu.

Sonuç: bir düğümün gerekliliği sorgulandığında hangi karardan kaynaklandığı bilinmiyor. Audit veya değişim yönetimi sırasında bir düğümü değiştirmek istediğinizde etkinin nereden kaynaklandığını izleyemezsiniz. "Neden bu düğüm var?" sorusu yanıtsız kalıyor.

### 2.3 Bağımlılık Eksik — Sıralama Belirsiz

Eski snapshot'ta çok sayıda düğümde `dependsOn` boştu. Bu düğümler için hangi işlerin tamamlanması gerektiği bilinmiyordu. Kritik olan şu: component/work_unit/micro_step seviyesinde dependsOn boşluğu, teorik olarak en sıkı bağlı olması gereken katmanlarda sıralama belirsizliği üretir.

dependsOn dolu olan eski snapshot düğümlerinde kırık referans yoktu (iyi haber). Ancak dolu olması, içeriğin doğru sıralamayı yansıttığını garanti etmiyor — bu ayrı bir insan doğrulaması gerektirir.

### 2.4 Schedule Yok — Zaman Çizelgesi Yok

Eski snapshot'ın büyük çoğunluğunda `schedule.start` ve `schedule.end` null idi. Kritik yolun ne zaman tamamlanacağı hesaplanamıyordu. Sprint planlaması, kaynak dengeleme, milestone takibi yapılamıyordu.

3 düğümde tarih dolu (atom-crm-email-regex, molekul-crm-score-field-validator, atom-crm-score-range-check) — bunlar zaten `done`, yani geçmişe dair tarih girilmiş.

### 2.5 Evidence Yok — Tamamlanma İspat Edilemiyor

Eski snapshot'ta `evidence` boştu. DoD (enterprise-dod.md) her katman için ölçülebilir kanıt belgesi gerektiriyor: test sonuçları, PR linkleri, erişilebilirlik raporu, şema kayıt belgesi.

"done" işaretli 3 düğüm bile evidence içermiyor. Bu düğümlerin gerçekten tamamlandığını doğrulayacak kanıt yok — status manuel atanmış, desteksiz.

### 2.6 Progress 1.71 / 100 — Fiili İlerleme Neredeyse Sıfır

Eski snapshot'ta ortalama progress neredeyse sıfırdı. Done olan az sayıdaki düğüm bu ortalamayı zaten maksimize ediyordu.

Yorumu: plan var, içerik iskelet olarak girilmiş, ama gerçek iş %0'a yakın.

---

## 3. Yapısal Sorunlar

### 3.1 Phase Marker Olarak Kullanılıyor

Eski snapshot'ın büyük çoğunluğu `phase: db-schema` idi. Bu faz WBS'de "şema tasarımı" fazını temsil etmeli; ancak kullanım biçimine bakıldığında başlangıç marker'ı gibi davranıyordu. Gerçek fazlardan geçmemiş her düğüm db-schema'ya atanmıştı. Bu, faz raporlamasını anlamsız kılıyordu.

### 3.2 Boilerplate İçerik Kalite Sinyalini Bastırıyor

Eski snapshot'ın büyük çoğunluğunda risks aynı iki kalıp cümleyi, deliverables ilk kalemi "Testler + dokümantasyon" metnini, acceptanceCriteria ise "KVKK + AAA erişilebilirlik kapıları geçti" kalıbını taşıyordu. Bu boilerplate varlığı içeriğin dolu görünmesini sağlıyor; ancak içerik düğüme özgü değil.

### 3.3 59 Scaffold Düğüm Temizlenmemiş

"Örnek dal" etiketli 59 düğüm gerçek iş tanımı taşımıyor. Bunların raporlarda görünmesi toplam sayıyı şişiriyor. Kanonik mi, temizlenecek mi, yoksa gerçek düğümlerle mi doldurulacak belirsiz.

### 3.4 Eğitim Duplikasyonu

`app-edu` ve `app-egitim` aynı uygulama kategorisini temsil ediyor. Hangisi kanonik? Birinde 10 archetype, diğerinde hiç yok. Bu belirsizlik devam ettiğinde iki kolda ayrı iş yapılır, biri kaybolur.

---

## 4. Enterprise Execution-Ready Olması İçin Gerekenler

Aşağıdaki maddeler öncelik sırasına göre verilmiştir. Her madde bir ön koşul; altındaki adım üstteki tamamlanmadan başlanamaz.

**Seviye 1 — Sahiplik (owner/assignees)**
Her app-level düğüme bir ekip (veya yük taşıyan) atanmalı. Atama yukarıdan aşağıya miras yoluyla veya generator ile yapılabilir; ancak içerik doğrulaması insan onayı gerektirir. Owner olmadan ne CI kapısı ne de progress takibi işe yarar.

**Seviye 2 — Kaynak referansları (refs)**
Her düğüm dayandığı ADR veya şema sözleşmesine en az bir ref içermeli. Minimum: app-level düğümler için ADR linki, module düğümler için archetype sözleşmesi yolu. 467 düğüm için tam doluluk hedeflenmeli; öncelik app + module katmanı.

**Seviye 3 — Bağımlılık zinciri tamamlanması**
Boş dependsOn düğümleri, özellikle component/work_unit/micro_step katmanında, bağımlılık zincirine bağlanmalı. Bu yapılmadan sprint sıralama ve paralel iş planlama mümkün değil.

**Seviye 4 — Zaman çizelgesi**
Her düğüme en azından sprint veya çeyrek bazında `schedule.start` / `schedule.end` girilmeli. Bu yokken teslim tarihi verilemez, gecikmeler ölçülemiyor.

**Seviye 5 — Evidence altyapısı**
`evidence` alanı doldurulmaya başlanabilmesi için önce sistemin kanıt üretmesi gerekiyor: CI test çıktıları, erişilebilirlik tarama raporları, PR linkleri. Bu alan şu an hiç kullanılmamış.

**Seviye 6 — Boilerplate temizliği**
risks, deliverables, acceptanceCriteria alanlarında düğüme özgü içerik yazılmalı. Kalıp cümleler silinmemeli; üzerine özgün içerik eklenmeli. Bu insan işi; generator ile üretilemiyor.

**Seviye 7 — Scaffold kararı**
59 "örnek dal" düğümü için karar: ya gerçek içerikle doldur ya da ayrı bir "template" etiketiyle raporlardan dışarıda tut.

---

## 5. Özet Tablo

| Boyut | Şu an | Execution-ready için gerekli |
|---|---|---|
| Sorumluluk | eski snapshot'ta düşük owner doluluğu | 467/467 dolu (generator + insan onayı) |
| Kaynak izlenebilirlik | eski snapshot'ta düşük refs doluluğu | 467/467 dolu (önce app+module) |
| Bağımlılık zinciri | eski snapshot'ta kısmi doluluk, alt seviye boşlukları | 467/467 dolu, tüm seviyelerde geçerli |
| Zaman hedefi | eski snapshot'ta düşük tarih doluluğu | 467/467 dolu (sprint veya çeyrek granülerliğinde) |
| Tamamlanma kanıtı | eski snapshot'ta evidence yok | CI entegrasyonu + 467/467 doluluk |
| İçerik özgünlüğü | Boilerplate hakimiyeti | Düğüme özgü risks/deliverables/AC |
| Sahte düğüm | 59 scaffold | Temizle veya etiketle |
| İlerleme | eski snapshot'ta çok düşük | Fonksiyonel milestone; en az bir app uçtan uca |
