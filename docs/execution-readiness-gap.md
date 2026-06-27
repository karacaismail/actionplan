# Execution Readiness Gap Analizi

**Tarih:** 2026-06-28
**Kapsam:** actionplan nodes.json — 424 düğüm
**Soru:** Bu plan neden execution-ready değil? Enterprise execution-ready olmak için ne gerekiyor?

---

## 1. Temel Kavram: "Node Var" ile "Enterprise Execution-Ready" Farkı

424 düğüm var. WBS hiyerarşisi çizilmiş, schemaVersion 1.0.0, title/summary/wbsCode dolu, risks/acceptanceCriteria/deliverables alanları var. Bu "WBS kataloğu var" anlamına gelir.

Enterprise execution-ready olmak farklı bir durumdur. Bir planı execution-ready yapan şey şudur: herhangi bir düğümü alan bir ekip, o düğümden bağımsız olarak şu soruların yanıtını düğümün içinde bulabilmeli:

1. Kim sorumlu ve kime raporlanır?
2. Bu iş ne zaman başlıyor, ne zaman bitiyor?
3. Bu iş bitmeden hangi başka işler başlayamaz?
4. Hangi belgeler, testler, PR'lar tamamlandığında bu iş done sayılır?
5. Bu işin durumu bugün itibarıyla gerçekte nedir?

Şu anda bu soruların hiçbiri 424 düğümün 411'inde yanıtsız.

---

## 2. Neden Execution-Ready Değil: Boşlukların Etkisi

### 2.1 Owner Yok — Sorumluluk Yok (411/424 düğüm)

411 düğümde `owner` boş. Bu şu anlama gelir: bir düğüm "backlog" kaldığında onu ilerletmekle yükümlü kimse yok. Proje yönetim sistemlerinde "atanmamış iş" kategorik olarak ilerlemeyen iştir. Bir CI kapısı olmadan bu durum sonsuz backlog üretir.

Daha kritik olanı: 26/27 app-level düğüm owner boş. Uygulamaların sahipliği tanımlanmamışken modül ve alt düzey sahipliği atamak anlamsız; sahiplik hiyerarşi boyunca yukarıdan aşağıya türetilmek zorunda.

Mevcut durum: sadece CRM zinciri (13 düğüm, tek ekip) ve 2 archetype düğümü (customer, product) atanmış. 411 düğüm yetim.

### 2.2 Refs Yok — Kaynak İzlenemiyor (422/424 düğüm)

`refs` alanı bir düğümün dayandığı teknik artefaktları (ADR, şema dosyası, archetype sözleşmesi, PR, confluence sayfası) tutar. 422 düğümde boş.

Sonuç: bir düğümün gerekliliği sorgulandığında hangi karardan kaynaklandığı bilinmiyor. Audit veya değişim yönetimi sırasında bir düğümü değiştirmek istediğinizde etkinin nereden kaynaklandığını izleyemezsiniz. "Neden bu düğüm var?" sorusu yanıtsız kalıyor.

### 2.3 Bağımlılık Eksik — Sıralama Belirsiz (112/424 düğüm)

112 düğümde `dependsOn` boş. Bu düğümler için hangi işlerin tamamlanması gerektiği bilinmiyor. Kritik olan şu: molecule/element/atom seviyesindeki tüm 55 düğümde dependsOn tamamen boş. Bu seviyeler teorik olarak birbirine en sıkı bağlı katmanlardır.

dependsOn dolu olan 312 düğümde kırık referans yok (iyi haber). Ancak dolu olması, içeriğin doğru sıralamayı yansıttığını garanti etmiyor — bu ayrı bir insan doğrulaması gerektirir.

### 2.4 Schedule Yok — Zaman Çizelgesi Yok (421/424 düğüm)

421 düğümde `schedule.start` ve `schedule.end` null. Kritik yolun (8 düğüm) ne zaman tamamlanacağı hesaplanamıyor. Sprint planlaması, kaynak dengeleme, milestone takibi yapılamıyor.

3 düğümde tarih dolu (at-crm-email-regex, el-crm-score-field-validator, at-crm-score-range-check) — bunlar zaten `done`, yani geçmişe dair tarih girilmiş.

### 2.5 Evidence Yok — Tamamlanma İspat Edilemiyor (424/424 düğüm)

424 düğümde `evidence` boş. DoD (enterprise-dod.md) her katman için ölçülebilir kanıt belgesi gerektiriyor: test sonuçları, PR linkleri, erişilebilirlik raporu, şema kayıt belgesi. Hiçbir düğümde bu yok.

"done" işaretli 3 düğüm bile evidence içermiyor. Bu düğümlerin gerçekten tamamlandığını doğrulayacak kanıt yok — status manuel atanmış, desteksiz.

### 2.6 Progress 1.71 / 100 — Fiili İlerleme Neredeyse Sıfır

424 düğümde ortalama progress 1.71. Done olan 3 düğüm bu ortalamayı zaten maksimize ediyor. Kalan 421 düğümün progress ortalaması ~0.

Yorumu: plan var, içerik iskelet olarak girilmiş, ama gerçek iş %0'a yakın.

---

## 3. Yapısal Sorunlar

### 3.1 Phase Marker Olarak Kullanılıyor

411/424 düğüm `phase: db-schema`. Bu faz WBS'de "şema tasarımı" fazını temsil etmeli; ancak kullanım biçimine bakıldığında başlangıç marker'ı gibi davranıyor. Gerçek fazlardan geçmemiş her düğüm db-schema'ya atanmış. Bu, faz raporlamasını anlamsız kılıyor: tüm plan "şema aşamasında" görünüyor.

### 3.2 Boilerplate İçerik Kalite Sinyalini Bastırıyor

407/424 düğümde risks aynı iki kalıp cümle. 411/424 düğümde deliverables'ın ilk kalemi "Testler + dokümantasyon". 407/424 düğümde acceptanceCriteria "KVKK + AAA erişilebilirlik kapıları geçti". Bu boilerplate varlığı içeriğin dolu görünmesini sağlıyor; ancak içerik düğüme özgü değil. Kalite kapısı bu boilerplate varlığını "dolu" olarak geçiriyor.

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
Her düğüm dayandığı ADR veya şema sözleşmesine en az bir ref içermeli. Minimum: app-level düğümler için ADR linki, module düğümler için archetype sözleşmesi yolu. 424 düğüm için tam doluluk hedeflenmeli; öncelik app + module katmanı (176 düğüm).

**Seviye 3 — Bağımlılık zinciri tamamlanması**
112 boş dependsOn düğümü, özellikle molecule/element/atom (55 düğüm), bağımlılık zinciri kurulmalı. Bu yapılmadan sprint sıralama ve paralel iş planlama mümkün değil.

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
| Sorumluluk | 13/424 owner dolu | 424/424 dolu (generator + insan onayı) |
| Kaynak izlenebilirlik | 2/424 refs dolu | 424/424 dolu (önce 176 app+module) |
| Bağımlılık zinciri | 312/424 dolu, mol/el/at boş | 424/424 dolu, tüm seviyelerde geçerli |
| Zaman hedefi | 3/424 tarih dolu | 424/424 dolu (sprint veya çeyrek granülerliğinde) |
| Tamamlanma kanıtı | 0/424 evidence | CI entegrasyonu + 424/424 doluluk |
| İçerik özgünlüğü | Boilerplate hakimiyeti | Düğüme özgü risks/deliverables/AC |
| Sahte düğüm | 59 scaffold | Temizle veya etiketle |
| İlerleme | %0.7 (3/424 done) | Fonksiyonel milestone; en az bir app uçtan uca |
