# 30 Günlük Execution Planı — actionplan Veri Kalitesi ve Execution Readiness

**Tarih:** 2026-06-28
**Kapsam:** P3-impl (owner/refs/deps otomatik doldurma + CI kapısı) ekseninde, daha geniş enterprise-readiness sıralamasıyla 30 günlük iş planı.
**Çerçeve:** Test-önce (kırmızı → yeşil → commit). Her hafta bir kapı; kapıyı geçmeden sonraki haftaya geçilmez.
**Prompt sırası (Codex'in önerisi):** P1 → P2 → P3 → P7 → P4 → P5 → P6
**Aktörler:** Sistem = yerel generator toolları + CI. Kullanıcı/Admin = insan onayı. AI ajan = swarm (Claude CLI, yerel). CI = GitHub Actions.

---

## Önkoşul Kontrolü (Başlamadan Önce)

P1 (repo gerçeklik denetim raporu) ve P2 (Enterprise DoD + TaskNode şema-boşluk haritası) tamamlanmış kabul edilir. Bu iki çıktı 30 günlük planın dayandığı referans belgelerdir. Tamamlanmamışsa önce onları bitir; bu plan P3'ten başlıyor.

---

## Hafta 1 (Gün 1–7) — P3-impl: Owner/Refs/Deps Otomatik Doldurma + CI Kapısı

Bu hafta çıktısı: 424 düğümün tamamında owner/assignees alanı dolu, refs alanında minimum referans var, dependsOn molecule/element/atom seviyesinde tamamlanmış, CI bu üç alanı kontrol eden bloklayıcı kapı çalışıyor.

### Gün 1 — Test Önce (KIRMIZI YAKMAK)

Kim: Kullanıcı/Admin.

`tests/dataCompleteness.test.ts` dosyası yazılır. Başta KIRMIZI yanmalı (423 düğümde owner boş). Test şunları doğrular:

- Her düğümde `owner` boş değil (boş string veya null reddedilir).
- Her app-level düğümde `refs` en az 1 eleman içeriyor.
- Her molecule/element/atom düğümde `dependsOn` en az 1 eleman içeriyor.
- `assignees` dizisi, `owner` değerini içeriyor (owner atanmışsa assignees boş olamaz).

Bu test `npm test` komutunun içine eklenir; başka testleri bozmadan ayrı dosyada yüklü çalışır. İnsan onayı: testi yazan kişi test mantığını inceler, commit eder.

### Gün 2 — Owner Generator Geliştirme

Kim: Sistem (generator tool).

`tools/gen-assignees.mjs` üzerindeki mevcut mantık genişletilir. Mevcut araç sadece `owner` varsa `assignees` dolduruyor; yetersiz. Genişletilecek kapsam:

Cluster-to-owner eşlemesi eklenir (statik tablo, `tools/lib/owner-map.mjs`). Her app-id için bir ekip adı atanır. Örnek eşlemeler:

- `app-core-operations`, `app-customer-revenue`, `s-crm` dizisi → `crm-ekibi`
- `app-finance` → `finans-ekibi`
- `app-kernel`, `app-layer0`, `app-layer1` → `kernel-ekibi`
- `app-data-intelligence` → `veri-zeka-ekibi`
- `app-platform-horizontal`, `app-sus`, `app-scale` → `platform-ekibi`
- `app-edu`, `app-egitim` → `egitim-ekibi`
- `app-build`, `app-dx` → `devops-ekibi`
- `app-hr` → `ik-ekibi`
- `app-supply-chain` → `tedarik-ekibi`
- `app-frontend` → `frontend-ekibi`
- `app-kararlar`, `app-meta` → `mimari-ekibi`
- Atanamamış olanlar → `platform-ekibi` (fallback)

Owner atama kuralı: app-level node doğrudan map'ten alır. Module/stone/archetype/molecule/element/atom düğümleri `parentId` zinciri yukarı çekilerek en yakın app'in owner'ını miras alır. Zaten dolu (bespoke) owner'lara dokunulmaz.

Araç çalıştırıldığında generator log yazar: kaç düğüm güncellendi, kaçı atlandı (bespoke).

İnsan onayı: Gün 2 sonunda `node tools/gen-assignees.mjs --dry-run` çıktısı gözden geçirilir, owner-map tablosu onaylanır. Onaydan sonra gerçek çalıştırma yapılır.

### Gün 3 — Refs Backfill

Kim: Sistem (generator) + Kullanıcı.

`tools/gen-refs.mjs` (yeni araç, mevcut değil) yazılır. Kural:

- App-level düğümler: `refs` = `["docs/enterprise-dod.md", "adr/<app-id>"]` formatında en az bir referans. ADR düğümü varsa (app-kararlar altındaki app'ler için be-kararlar vb.) bağlantı eklenir.
- Module-level düğümler: `refs` = `["src/data/generated/nodes/<id>.json"]` (kendi kaynak dosyasının yolu) + app-level ref'i miras.
- Stone/archetype düğümleri: en az `["src/data/generated/nodes/<parentId>.json"]` eklenir.
- Molecule/element/atom: parent zincirini referans olarak taşır.
- Zaten dolu refs (customer, product) korunur.

Bu refs içerik olarak "gerçek ADR bağlantısı" değil; en azından düğümün kaynak dosyasını işaret eden izlenebilir bir referans verir. Gerçek ADR bağlantıları sonraki haftada insan tarafından eklenir.

İnsan onayı: Backfill sonrası `customer` ve `product` düğümlerinin refs'i değişmedi mi kontrol edilir.

### Gün 4 — DependsOn Tamamlama (Molecule/Element/Atom)

Kim: Sistem (`tools/derive-deps.mjs`) + kontrol.

`derive-deps.mjs` zaten mevcut ve cluster-katman omurgasını kullanıyor. Ancak molecule/element/atom seviyesinde dependsOn hâlâ boş (18+18+19=55 düğüm). Generator'ın bu seviyeleri neden doldurmadığı incelenir.

Beklenen davranış: molecule, bağlı olduğu stone'a dependsOn içeriyor olmalı. Eğer derive-deps bu seviyeyi atlıyorsa, araç içine ek kural eklenir: bir molecule/element/atom düğümünün dependsOn boşsa, `parentId` zincirinden bir üst seviyenin id'si varsayılan dependsOn olarak atanır.

Kırık referans yoktu (önceden doğrulandı), bu yüzden mevcut 312 dolu dependsOn bozulmaz; sadece 112 boş olana ekleme yapılır.

İnsan onayı: `node tools/derive-deps.mjs --dry-run` çıktısında beklenmedik bağlantı var mı incelenir.

### Gün 5 — CI Kapısı

Kim: Sistem (CI YAML) + İnsan onayı.

`.github/workflows/data-quality-gate.yml` dosyası yazılır. İçeriği:

Her push ve PR'da çalışır. Adımlar: `npm ci` → `npm run typecheck` → `npm test` (dataCompleteness.test.ts dahil). dataCompleteness testi başarısızsa CI kırmızı olur ve PR merge edilemez.

Ek bir script (`tools/qa-gate.mjs` veya `tools/quality-lint.mjs` genişletilir) şu sayısal eşikleri kontrol eder ve FAIL durumunda sıfır-olmayan exit code döndürür:

- owner boş düğüm sayısı ≥ 50 → fail
- refs boş olan app+module düğüm sayısı ≥ 100 → fail
- molecule/element/atom dependsOn boş sayısı ≥ 10 → fail

Eşikler bu hafta sonundaki gerçekçi hedeflere göre ayarlanır; hafta 3'te sıkılaştırılır.

İnsan onayı: CI YAML'ı incelenir, test eşikleri onaylanır, feature branch'e push yapılır, PR açılır.

### Gün 6–7 — Entegrasyon + Kırmızı/Yeşil Kapanış

Kim: Kullanıcı (koşturma) + CI.

Tüm generator'lar sırayla koşturulur: `gen-assignees` → `gen-refs` → `derive-deps`. Ardından `npm test` çalıştırılır. dataCompleteness testi yeşil yanmalı. CI de yeşil yanmalı.

Beklenen son durum Hafta 1 sonunda:

- owner boş: 411'den < 30'a düşmeli (bespoke + edge-case'ler hariç).
- refs boş: 422'den < 200'e düşmeli.
- molecule/element/atom dependsOn boş: 55'ten < 10'a düşmeli.
- CI kapısı aktif ve bloklayıcı.

İnsan onayı: PR açılır, diff incelenir, test çıktıları kontrol edilir. Merge: insan onayı.

---

## Hafta 2 (Gün 8–14) — P7: Lint + SPA404 + A11y Düzeltme

Bu hafta çıktısı: Biome lint sıfır hata, SPA 404 sorunsuz, Playwright/axe AAA erişilebilirlik testi geçiyor. Veri değişikliği yok; sadece araç/UI katmanı.

### Gün 8 — Lint Taban Çizgisi

Kim: Sistem + Kullanıcı.

`npm run lint` çalıştırılır, mevcut hata sayısı kaydedilir. `biome.json` konfigürasyonu incelenir; kritik kurallar (no-unused-vars, no-explicit-any, format) kontrol edilir.

Test önce: `tests/lint.test.ts` yazılması önerilmez (lint CI'a aittir); bunun yerine lint CI adımına hata sayısı eşiği eklenir: `biome check . --max-diagnostics=0` sıfır hatayla geçmeli.

### Gün 9–10 — Lint Düzeltmeleri

Kim: Kullanıcı/Admin (veya AI ajan öneri modunda).

AI ajan lint hatalarını listeler ve auto-fix önerileri üretir. Kullanıcı `biome format --write .` komutunu çalıştırır (formatlamayı otomatik düzeltir). Mantıksal lint uyarıları elle düzeltilir. Değişiklikler commit edilir.

İnsan onayı: diff incelenir, istenmeyen format değişikliği var mı kontrol edilir.

### Gün 11 — SPA 404 Doğrulama

Kim: Sistem + Kullanıcı.

`npm run build` sonrası `tools/spa404.mjs` çalıştırılır. GitHub Pages için `404.html` oluşturulduğu doğrulanır. Playwright testi: `/actionplan/olmayan-rota` adresine girildiğinde 404 yerine SPA yükleniyor mu kontrol edilir.

Eğer test yoksa `tests/routing.spec.ts` (Playwright) yazılır: geçersiz URL → SPA ana sayfaya yönlendirir → 200 döner.

### Gün 12–14 — A11y (AAA) Düzeltmeleri

Kim: Kullanıcı + Sistem (axe çıktısı).

`npm run test:e2e` çalıştırılır. axe-core AAA ihlalleri listelenir. Yüksek etkili ihlaller (renk kontrastı, ARIA etiketleri, klavye gezinme) düzeltilir. Her düzeltme sonrası test tekrar koşulur.

İnsan onayı: test:e2e yeşil olduğunda PR hazır.

---

## Hafta 3 (Gün 15–21) — P4: Platform WBS Düğümlerini Güncelle + Boilerplate Temizliği

Bu hafta çıktısı: app-platform-horizontal kümesi güncel ve derin, scaffold "örnek dal" düğümleri işaretlenmiş veya temizlenmiş, boilerplate risks/deliverables/AC oranı azalmış.

### Gün 15–16 — Scaffold Düğüm Kararı

Kim: Kullanıcı/Admin.

59 "örnek dal" düğümü için karar alınır. İki seçenek:

Seçenek A: Her "örnek dal" düğümüne `tags` alanına `"scaffold"` etiketi eklenir ve `summary` başına `[ŞABLON]` ibaresi konulur. CI kapısı bu düğümleri raporlardan dışarıda tutar, ancak şemadan silmez.

Seçenek B: Gerçek içerikle doldurulacak düğümler belirlenir (önce `app-backend-x-*` ve `app-build-x-*`), diğerleri kaldırılır.

Test önce: seçilen strateji için `tests/dataCompleteness.test.ts` güncellenir (scaffold etiketli düğümler AC'dan muaf tutulur veya sayılmaz).

İnsan onayı: karar onaylanır, uygulama yapılır.

### Gün 17 — app-edu / app-egitim Duplikasyonu

Kim: Kullanıcı/Admin.

`app-edu` kanonik olarak seçilir (10 archetype, daha zengin). `app-egitim`'in 5 alt düğümü `app-edu`'ya taşınır veya `app-egitim`'e `deprecated` etiketi eklenir. Hiçbir düğüm silinmeden önce `dependsOn`/`related`/`blocks` referansları kontrol edilir.

Test önce: `tests/dataIntegrity.test.ts`'ye duplicate app check eklenir (aynı title'a sahip iki app-level düğüm → fail).

### Gün 18–19 — gen-items ile Boilerplate Azaltma

Kim: Sistem (`tools/gen-items.mjs`).

`gen-items.mjs` zaten bespoke olmayan düğümlere düğüm-özel içerik üretiyor. Bu hafta araç çalıştırılır ve risks/deliverables/acceptanceCriteria alanlarındaki boilerplate oranı ölçülür. Hedef: risks'te kalıp cümle oranı %96'dan < %60'a düşmesi.

Test önce: `tests/contentQuality.test.ts` (veya dataCompleteness genişletmesi) şunu kontrol eder: bir düğümün risks dizisinde her iki eleman da aynı kalıp cümle ise fail.

İnsan onayı: gen-items çıktısı 10 rastgele düğüm için gözden geçirilir; içerik mantıklı görünüyor mu?

### Gün 20–21 — Platform WBS (app-platform-horizontal) Güncelleme

Kim: AI ajan (seed-platform-horizontal.mjs) + Kullanıcı onayı.

`app-platform-horizontal` kümesinin mevcut durumu incelenir: 14 alt düğüm var (0 module, 1 stone, 9 archetype, mol/el/at iskelet). Bu hafta:

- Stone katmanı gerçek platform servisleri için doldurulur (API Gateway, Auth Service, Observability, Feature Flags vb.).
- Her stone için en az 1 archetype girilir (iskelet değil, gerçek içerik).
- `tools/agents/seed-platform-horizontal.mjs` güncellenerek çalıştırılır.

İnsan onayı: PR açılır, platform kümesinin içeriği teknik olarak doğrulanır.

---

## Hafta 4 (Gün 22–30) — P5 + P6: Şema İzlenebilirlik + Governance

Bu hafta çıktısı: `evidence` alanı UI'da görünür, 3 pilot düğümde dolu; governance dosyaları (`CODEOWNERS`, `CONTRIBUTING.md`, ADR-XX) var; CI required checks ayarlanmış.

### Gün 22–23 — P5-schema: Evidence Alanı Altyapısı

Kim: Sistem (şema) + Kullanıcı.

`src/schemas/task.ts` incelenir. `evidence` alanı zaten var ama 424/424 boş ve UI'da gösterilmiyor. Bu aşamada:

Test önce: `tests/evidenceDisplay.spec.ts` (Playwright) yazılır — CRM zincirindeki `el-crm-score-field-validator` düğümü için evidence verisi fixture'a eklenir; UI'da `evidence` bölümü görünür ve veri doğru render ediliyor mu kontrol edilir.

3 pilot düğüm için evidence doldurulur (manuel): `el-crm-score-field-validator`, `at-crm-email-regex`, `at-crm-score-range-check`. Evidence içeriği: test sonuç linki, PR referansı, erişilebilirlik raporu tarihi.

### Gün 24–25 — P5-impl: UI Evidence Yüzeyi

Kim: Kullanıcı/Admin (UI geliştirme).

Görev detay panelinde evidence dizisi görüntülenir. Yeni alan eklemek için "Kanıt Ekle" formu (modal) yapılır. Test: pilot düğümlerde kanıt görünüyor mu, form submit sonrası kaydediliyor mu.

İnsan onayı: UI gözden geçirilir, erişilebilirlik testi tekrar koşulur.

### Gün 26–27 — P6: Governance Dosyaları

Kim: Kullanıcı/Admin.

Şu dosyalar oluşturulur:

`.github/CODEOWNERS`: `src/data/generated/nodes/app-*` ve `public/data/nodes.json` için `@<insan-reviewer>` atanır. Her PR'da data dosyaları değişiyorsa otomatik review request gider.

`CONTRIBUTING.md`: Katkı akışı (fork → feature branch → npm test → PR → insan incelemesi → merge). main'e doğrudan push yasağı yazılır.

`docs/adr-data-quality-policy.md` (ADR): owner/refs/evidence boş düğümün merge edilemeyeceğine dair teknik karar kaydedilir. Bu ADR, tüm app-level düğümlerin `refs` alanına eklenir.

### Gün 28–29 — P6-impl: CI Required Checks

Kim: Sistem (GitHub repo ayarları) + Kullanıcı.

GitHub branch protection kuralı aktifleştirilir: main branch için `data-quality-gate` CI jobı required check olarak eklenir. Bu adımdan sonra test kırmızıyken hiçbir PR merge edilemez.

CI kapısındaki eşikler bu noktada sıkılaştırılır:

- owner boş ≥ 30 → fail (Hafta 1'de < 30 hedefleniyordu, şimdi < 20 hedeflenir).
- refs boş olan app düğümleri ≥ 5 → fail.
- evidence boş olan `done` düğümleri > 0 → fail.

### Gün 30 — Doğrulama ve PR Hazırlığı

Kim: Kullanıcı/Admin.

Son sayımlar alınır (`node -e` ile teyit): owner boş kaç? refs boş kaç? evidence dolu kaç? Tüm testler (`npm run typecheck && npm test && npm run test:e2e`) yeşil olmalı. CI kapısı yeşil olmalı.

`feat/enterprise-readiness` branch'inden PR açılır. PR'da şu başarı kriterleri belirtilir: owner doluluk oranı, CI kapısının aktifliği, 3 pilot evidence, governance dosyaları.

Main'e push YOK — merge insan onayıyla.

---

## Özet: Haftalık Kilometre Taşları

| Hafta | Odak | Başarı Kriteri | İnsan Onayı Noktaları |
|---|---|---|---|
| 1 | Owner/refs/deps + CI kapısı | owner boş < 30; CI bloklayıcı aktif | owner-map onayı; dry-run incelemesi; CI YAML onayı; PR merge |
| 2 | Lint + SPA404 + A11y | Biome sıfır hata; test:e2e yeşil | diff incelemesi; axe ihlal kararları |
| 3 | Scaffold temizliği + Platform + Boilerplate | Scaffold işaretlenmiş; risks kalıp < %60; platform stone dolu | scaffold kararı; gen-items çıktı incelemesi; platform içerik doğrulama |
| 4 | Evidence UI + Governance + CI required | 3 pilot evidence dolu; CODEOWNERS aktif; CI required check ayarlandı | evidence UI; ADR kararı; branch protection ayarı; PR |

---

## Risk ve Azaltma

Owner generator eksik eşlem yapabilir: dry-run çıktısı onaylanmadan gerçek koşturma yapılmaz. Yanlış atama bulunursa owner-map güncellenir ve tekrar koşturulur.

gen-refs "kaynak referans" içeriği gerçek ADR'ye işaret etmeyebilir: refs şimdilik dosya yolu düzeyinde başlar; gerçek ADR bağlantıları Hafta 3-4'te eklenir. Refs alanının "dolu" olması izlenebilirliğin başlangıcıdır, tamamlanması değil.

59 scaffold düğüm kararı gecikirse Hafta 3 kayar: Gün 15'te karar alınmazsa gün 15-16 bloke olur. Gecikmede fallback: tüm scaffold'lara `"scaffold"` etiketi eklenir (Seçenek A), karar ertelenmez.

CI kapısı eşikleri çok sıkı ayarlanırsa hiçbir PR geçemez: Hafta 1'de eşikler mevcut durumdan biraz daha iyi bir hedefle başlar, Hafta 4'te sıkılaştırılır. Ani sıkılaştırma yapılmaz.
