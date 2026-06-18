# Eylem Planı — actionplan İçerik Derinleştirme ve Sözleşme Tamamlama (Master Plan)

Sürüm: 1.0 · Tarih: 2026-06-18 · Hedef repo/klasör: `actionplan/` · Temel commit: `e461e9b`

Bu doküman, `actionplan` projesinin denetiminde tespit edilen eksiklerin kapatılması için hazırlanmış, uçtan uca uygulanabilir bir eylem planıdır. Doküman bir **planlama yönergesidir**; doğrudan implementasyon kodu içermez. Her faz; ne yapılacağını, kimin yapacağını, hangi testin önce yazılacağını, hangi dosyaların sorumlu olacağını, kabul kriterlerini ve riskleri tanımlar.

---

## 0. Önsöz — bu plan neyi çözüyor

### 0.1 Bağlam (kısa)

`actionplan` iki katmandan oluşur ve bu plan ikisini **bilinçle ayrı tutar**:

- **Araç (panel):** `src/` altındaki React/Vite/TanStack uygulaması. Jira/ClickUp benzeri bir WBS + görev yönetim panelidir. Görev tanımlarını okur, ağaç/pano/grafik olarak gösterir, JSON/CSV dışa-içe aktarır. Bu katman çalışan koddur ve canlıdadır.
- **Plan içeriği (görev tanımları):** `src/data/generated/nodes/**` altındaki 422 JSON düğümü. Her düğüm bir görevin/sayfanın TANIMIDIR — gelecekteki ürünün (`platform/`) nasıl yapılması gerektiğini anlatan yönergedir. Bu katman veridir; çalışan ürün kodu değildir.

Bu planın asıl konusu **plan içeriğinin derinliği** ve **sözleşme katmanlarının tamamlanmasıdır**. `platform/` ürün implementasyonu bu planın kapsamı dışındadır (non-goal).

### 0.2 Çözülecek eksikler (denetim sonucu)

1. **İçerik derinliği (birincil):** 422 görev sayfasının 407'sinde 14 boyutun maddeleri kalıptan üretilmiş (tema-kelime ikamesi); gerçek, sayfaya-özel, derin "enterprise" içerik değil. Yalnız 15 sayfa (CRM + kernel) zengin.
2. **Hazır ECA/ruleset paket kataloğu yok:** Kurallar sayfa-başı üretiliyor; yeniden kullanılabilir paketler (ArcheType update safety, field rename migration, tenant isolation breach, prompt injection guard, approval escalation) tanımlı değil.
3. **Surface ve Workflow zayıf tanımlı:** ArcheType'tan ayrı, ayrı versiyonlanan sözleşmeler olmaları gerekirken yalnız referans (ref+version) düzeyinde anılıyor; Product/Customer gibi ayrı şema/fixture seviyesinde tanımlı değil.
4. **Panel görünürlüğü (ikincil):** Görev detayında yapısal `ecaRules`, `agentPolicy`, riskler/teslimatlar/kabul kriterleri gösterilmiyor; "kuralı simüle et" yok.
5. **Minör sapma:** `shadcn/ui` yerine özel Radix-tabanlı bileşenler kullanılmış.

### 0.3 Kapsam dışı (non-goals)

- `platform/` gerçek ürün implementasyonu.
- CI'da kodu otomatik düzeltip main'e push eden ajan ("3b").
- Test veya güvenlik kapılarını zayıflatmak.
- AI'a app/module üretme yetkisi vermek.

---

## 1. Nasıl kullanılır

Doküman dört seviyeli bir hiyerarşi kullanır:

- **Küme (A–F):** Büyük çalışma alanı. Doğa metaforuyla "dağ silsilesi" — birbirine yakın fazların ailesi.
- **Faz (ör. B7):** Bir kümenin içindeki, başı-sonu belli iş bloğu. Metafor: "dağ".
- **Eylem (ör. E-B7.2):** Bir fazın içindeki somut çalışma adımı. Metafor: "kaya".
- **Görev seti (ör. T-B7.2.3):** Bir eylemin içindeki, tek oturuşta yapılabilir, onay kutulu işler. Metafor: "taş".

Her faz aynı şablonu izler ve **test-önce sıralamayı** uygular:

1. **Test planı** (önce yazılır; başta kırmızı yanar).
2. **Veri modeli / şema etkisi.**
3. **Geliştirme yaklaşımı** (eylemler + görev setleri + dosya sorumlulukları).
4. **Edge case ve riskler** (azaltmayla birlikte).
5. **Kabul kriterleri (DoD = Definition of Done = bitti tanımı).**

Görev setleri onay kutuludur (`- [ ]`); tamamladıkça işaretle. Her fazın sonunda DoD karşılanmadan sonraki faza geçme (waterfall kapısı).

### 1.1 Uygulama döngüsü (her görev seti için)

`testleri yaz (kırmızı) → değişikliği yap → testleri koş → yeşil değilse en çok 6 tur düzelt → hâlâ kırmızıysa raporla ve dur → yeşilse commit (dal) → faz DoD'si dolunca PR → insan inceler → merge`.

AI ajan (swarm) yalnız içerik/öneri üretir; **main'e doğrudan push yoktur**; merge insan onayıyla olur.

---

## 2. Aktör sözlüğü (kim ne yapar)

Belirsizliği önlemek için her eylemde aktör açıkça yazılır.

- **Sistem (araç/panel):** `src/` uygulaması. Görev tanımlarını okur, gösterir, doğrular, export/import eder. Karar vermez, içerik üretmez.
- **Kullanıcı / Admin:** Sen. Planı uygular, görev tanımlarını yazar/onaylar, swarm'ı Mac'inde koşar, PR'ları merge eder.
- **AI ajan (swarm):** `tools/agents/` altındaki yerel ajanlar (Claude CLI). Sayfa içeriği üretir/önerir. Yalnız öneri/draft; app/module üretemez, ruleset override edemez, main'e push edemez.
- **CI:** GitHub Actions. Push'ta testleri (typecheck/unit/e2e/axe) koşar; kırmızıysa deploy etmez. Kod değiştirmez.
- **Platform Owner:** Veri kaybı riski olan değişikliklerde son onay mercii (plan içinde tanımlı rol; gerçek ürün için).
- **İnsan onayı (gate):** PR incelemesi + merge. Otomatik atlanamaz.

---

## 3. Terim sözlüğü (ilk geçtikleri yerde teknik karşılık)

- **App = dağ:** Bir ürün ailesi (ör. Çekirdek Operasyon); birden çok module barındırır.
- **Module = kaya:** Sınırlı bağlam (bounded context = tek bir iş alanına kapalı sınır); birden çok ArcheType barındırır.
- **ArcheType = büyük taş:** Frappe DocType'a benzeyen ama gelişmiş, bir module'ü oluşturan ana bileşen. Tek dosya değil; çok-parçalı sözleşme ailesi.
- **Surface = projeksiyon:** ArcheType'ın UI/API/tablo izdüşümü; ArcheType'tan ayrı ve ayrı versiyonlanır.
- **Workflow = davranış:** ArcheType'ın durum makinesi/süreç tanımı; ArcheType'tan ayrı ve ayrı versiyonlanır.
- **field = alan:** En küçük veri birimi.
- **ECA = Event-Condition-Action:** "Şu olay olunca + şu koşul sağlanınca → şu eylemi yap" biçiminde yapısal otomasyon kuralı. Serbest kod (JS/SQL/shell) değildir.
- **Ruleset = kural seti:** Bir veya birden çok ECA kuralının yetki katmanıyla paketlenmiş hali (system/platform/tenant).
- **Provenance = köken:** Bir içerik parçasının nereden geldiği: `template` (kalıp), `swarm` (AI), `human` (insan).
- **contentQuality kapısı:** İçeriğin gerçekten sayfaya-özel ve dolu olup olmadığını ölçen otomatik test.
- **swarm = sürü:** Çok sayıda AI ajanını paralel koşturup sayfa-başı içerik üreten yerel araç.
- **conformance test = uygunluk testi:** Bir verinin/sözleşmenin şemaya ve politikalara uyduğunu doğrulayan test.
- **gate'i kandırma (reward hacking):** Testi gerçekten karşılamak yerine içeriği sığlaştırıp yine de geçirmek. Bu plan bunu benzerlik + özgüllük kapılarıyla engeller.
- **unknown unknowns = bilinmeyen bilinmeyenler:** Sistemin şu an fark etmediği risk sınıfı. Checklist/risk keşfiyle ele alınır (Ek C).

---

## 4. Genel kurallar (tüm fazlarda geçerli)

- **Test-önce:** Hiçbir içerik/şema değişikliği, onu doğrulayan test yazılmadan yapılmaz.
- **AI yetki sınırı:** AI yalnız ArcheType/içerik draft'ı/önerisi üretir; app/module üretemez/güncelleyemez; ruleset override edemez; doğrudan production write yapamaz.
- **Migration güvenliği:** field delete/rename/type-change doğrudan yapılmaz; önce deprecated + alias + backfill. Veri kaybı riski → platform owner onayı + snapshot + rollback.
- **main'e doğrudan push yok:** AI öneri verir / PR açar; insan inceler; sonra merge.
- **Mount git kuralı:** Yerel `actionplan` klasöründe git kilitleri takılırsa silme izni gerekir; git komutlarını Mac'te yorumsuz ve kesme işaretsiz çalıştır.
- **Dil:** Tüm içerik Türkçe; teknik terim ilk geçtiği yerde açıklanır.
- **Yazım kalitesi:** Belirsiz zamir yok ("bu/şu/o" yerine nesne adı); belirsiz sıfat yerine teknik kriter ("güçlü" yerine "deny-by-default + audit + rollback + conformance").

---

## 5. 14 boyut kalite rubriği (içerik derinliğinin ÖLÇÜTÜ)

Bu rubrik, "derin enterprise içerik" iddiasını ölçülebilir kritere çevirir. Küme B'deki her sayfa, her boyut için bu kritere göre yazılır ve `contentQuality` kapısıyla denetlenir. Her boyut için: **ne sorar**, **derin içerik ne içerir**, **zayıf (kalıp) örnek**, **kabul kriteri**.

### 5.1 featureDefs — Özellik tanımları
- Ne sorar: Bu görev/ArcheType ne yapar, sınırı nedir?
- Derin içerik: işlevsel sınır + ana yetenekler + girdi/çıktı sözleşmesi + kapsam-dışı; ürün muadilleriyle (ör. Salesforce/HubSpot) kıyas.
- Zayıf örnek: "X için net işlevsel sınır (ArcheType tanımı)".
- Kabul: 3-5 madde, en az 2'si sayfaya-özel somut yetenek; jenerik kalıp ifadesi yok.

### 5.2 security — Güvenlik önlemleri
- Ne sorar: Hangi somut güvenlik kontrolleri?
- Derin içerik: tenant izolasyonu (PostgreSQL RLS), PII sınıflandırma+maskeleme, rol bazlı erişim (least-privilege), değişmez audit, alan-bazlı yetki.
- Zayıf örnek: genel "tenant_id RLS + maskeleme" tek cümle.
- Kabul: en az bir kontrol bu sayfanın gerçek verisine/alanına atıfta bulunur.

### 5.3 codeOptimization — Kod optimizasyonu
- Ne sorar: Kod tarafında hangi optimizasyon desenleri?
- Derin içerik: modülerlik sınırı, tip güvenliği, ölü-kod/duplikasyon önleme, lazy/memoization, bundle etkisi.
- Kabul: sayfanın seviyesine (app/module/archetype/…) uygun en az 1 somut desen.

### 5.4 securityOptimization — Güvenlik optimizasyonu
- Ne sorar: Güvenliği zayıflatmadan nasıl iyileştiririz?
- Derin içerik: secret yönetimi, en-az-yetki sıkılaştırma, saldırı yüzeyi azaltma, supply-chain (bağımlılık) denetimi.
- Kabul: "deny-by-default + audit + rollback" ölçütüne bağlı en az 1 madde.

### 5.5 performance — Performans optimizasyonu
- Ne sorar: Gecikme/ölçek hedefleri ve yöntemleri?
- Derin içerik: indeks/sorgu deseni, N+1 önleme, önbellek, p95 hedefi + ölçüm; sayfa türüne özel.
- Kabul: en az 1 ölçülebilir hedef (ör. "liste p95 < 200ms").

### 5.6 mobileApps — Mobil/çoklu istemci uyumu
- Ne sorar: iOS/Android/Chrome eklenti uyumu?
- Derin içerik: responsive/touch hedef boyutu, offline/PWA, platform-özel kısıt, API uyumu.
- Kabul: mobile-first somut karar; jenerik "mobil uyumlu" yasak.

### 5.7 wcag — WCAG 2.2 AAA
- Ne sorar: Erişilebilirlik kuralları?
- Derin içerik: kontrast ≥7:1, klavye gezinme, ARIA/etiket eşleşmesi, odak sırası, ekran okuyucu.
- Kabul: bu sayfanın gerçek bileşenine (form/tablo/grafik) bağlı en az 1 kural.

### 5.8 deployment — Swarm/Kubernetes + shared hosting
- Ne sorar: Hangi dağıtım profillerinde çalışır?
- Derin içerik: container/Swarm/K8s desenleri ve shared hosting (WordPress benzeri) kısıtları + degrade modu.
- Kabul: en az 2 profil ve her birinde sayfaya-özel kısıt/uyum notu.

### 5.9 eca — Otomatik ECA kuralları (içerik)
- Ne sorar: Bu özellikte hangi otomasyon kuralları olmalı?
- Derin içerik: olay→koşul→eylem üçlüleri; idempotency; zincir derinliği ≤6; hangi ruleset paketinden gelir (Küme C'ye bağ).
- Kabul: en az 1 kural Event-Condition-Action biçiminde yazılı + bir hazır pakete referans.

### 5.10 aiAgents — Varsayılan AI ajan davranışı
- Ne sorar: AI burada nasıl davranır, sınırı nedir?
- Derin içerik: otonomi seviyesi (suggest/draft); izinli/yasak aksiyonlar; step-up onay; maliyet/oran sınırı.
- Kabul: "ne yapar / ne yapmaz" ayrımı açık; yasak listede app/module/ruleset-override var.

### 5.11 testing — Testler
- Ne sorar: Hangi test türleri ve döngüsü?
- Derin içerik: unit + e2e + kullanıcı yolculuğu (Playwright); testing-loop (max 6); golden fixture; otonom QA.
- Kabul: en az 1 sayfaya-özel kullanıcı yolculuğu senaryosu.

### 5.12 owasp — OWASP & güvenlik standartları
- Ne sorar: Hangi OWASP riskleri ve karşılıkları?
- Derin içerik: OWASP Top 10 / API Top 10'dan ilgili maddeler + bu özelliğe özel karşı önlem.
- Kabul: en az 1 OWASP maddesi ada/koda atıfla (ör. "A01 Broken Access Control → ReBAC").

### 5.13 integration — Kernel/Core/modules/apps entegrasyonu
- Ne sorar: Hangi çekirdek/diğer app'lerle nasıl entegre olur?
- Derin içerik: bağımlılık yönü, sözleşme (event/bus/API), entegre olmalı mı kararı + gerekçe.
- Kabul: en az 1 somut entegrasyon noktası + yön.

### 5.14 moduleUsage — Module ise diğer app'lerin kullanımı
- Ne sorar: Bu module'ü hangi app'ler nasıl kullanır?
- Derin içerik: tüketici app'ler, sağlanan yetenek, paylaşılan sözleşme, sürüm uyumu.
- Kabul: module seviyesindeki sayfalarda en az 2 tüketici senaryosu (app seviyesinde "uygulanmaz" denebilir).

---

## 6. Master İçindekiler (küme → faz)

- **Küme A — Temel ve Yönetişim:** A1 kalite sözleşmesi · A2 contentQuality kapısı · A3 provenance veri modeli · A4 swarm sıkılaştırma · A5 otomasyon iskeleti (opsiyonel).
- **Küme B — İçerik Derinleştirme (407 sayfa):** B0 pilot · B1–B27 node-cluster fazları · B28 doc/ADR düğümleri · B29 çapraz-tutarlılık konsolidasyonu.
- **Küme C — ECA/Ruleset Hazır Paket Kataloğu:** C1 paket şeması · C2–C6 beş çekirdek güvenlik paketi · C7 operasyonel paketler · C8 conformance+bağlama · C9 katalog gösterim.
- **Küme D — Surface ve Workflow Sözleşmeleri:** D1 Surface şema · D2 Workflow şema · D3 Product fixture · D4 Customer fixture · D5 ilişki+versiyon+conformance.
- **Küme E — Panel Görünürlük ve Simülasyon (ikincil):** E1 ECA gösterimi · E2 agentPolicy/çelik duvar · E3 simülasyon · E4 risk/teslimat/kabul · E5 shadcn hizalama.
- **Küme F — Doğrulama, Yayın, Süreklilik:** F1 conformance matrisi · F2 CI gate · F3 yayın+Pages · F4 süreklilik+unknown-unknowns.
- **Ekler:** Ek A komut referansı · Ek B DoD master checklist · Ek C unknown-unknowns risk keşfi · Ek D risk defteri · Ek E node-cluster sayım tablosu.

---

# KÜME A — Temel ve Yönetişim

Bu küme, içerik derinleştirme başlamadan önce kurulması gereken ölçüm, kapı ve izlenebilirlik altyapısını tanımlar. Amaç: "derin içerik" iddiasının ölçülebilir olması ve AI ajan (swarm) çıktısının kapıdan geçmeden kabul edilmemesi. Bu küme bittikçe Küme B güvenle başlatılabilir.

## Faz A1 — İçerik kalite sözleşmesi (Definition of Deep)

**Amaç:** Bölüm 5'teki 14 boyut rubriğini, makinenin ve insanın aynı şekilde uygulayabileceği bir sözleşmeye bağlamak. "Derin enterprise içerik" öznel olmaktan çıkar, ölçütlü olur.

**Bağımlılık:** Yok (ilk faz).

**Aktörler:** Kullanıcı sözleşmeyi onaylar; Sistem ileride bu sözleşmeyi `contentQuality` kapısında uygular; AI ajan içerik üretirken bu sözleşmeyi girdi alır.

1. **Test planı (önce):** Sözleşmenin kendisi için değil ama "altın örnek" için test. `s-crm` (zaten zengin) referans alınır; bir `golden/` fixture olarak işaretlenir ve `contentQuality` ileride bu örneği %100 geçmeli.
2. **Veri modeli / şema etkisi:** Şema değişmez; yalnız `docs/icerik-kalite-sozlesmesi.md` adında bir yan-doküman + boyut başına eşik tablosu (min madde, min sayfaya-özel madde, yasak kalıp listesi).
3. **Geliştirme yaklaşımı:**
   - **E-A1.1 — Boyut eşik tablosu.**
     - [ ] T-A1.1.1: 14 boyut için min/maks madde sayısı, min "sayfaya-özel" madde sayısı belirle.
     - [ ] T-A1.1.2: Yasak jenerik kalıp listesi çıkar (ör. "net işlevsel sınır (ArcheType tanımı)", boş tema-ikamesi imzaları).
     - [ ] T-A1.1.3: Boyut başına 1 "iyi" + 1 "kötü" örnek yaz (rubrik somutlaşsın).
   - **E-A1.2 — Altın referans seçimi.**
     - [ ] T-A1.2.1: `s-crm`, `k-surface`, `k-control-planes` gibi zengin 15 düğümü "altın" listele.
     - [ ] T-A1.2.2: Bu 15 düğümün hangi boyutlarının gerçekten örnek-kalite olduğunu işaretle (hepsi olmayabilir).
4. **Edge case / riskler:** Eşik çok katı → meşru ortak terimler (RLS, audit) reddedilir; azaltma: alan-bazlı istisna listesi. Eşik çok gevşek → kalıp içerik geçer; azaltma: çapraz-düğüm benzerlik kapısı (A2).
5. **DoD:** `docs/icerik-kalite-sozlesmesi.md` mevcut; 14 boyut için eşik + yasak kalıp + örnekler dolu; 15 altın düğüm listesi onaylı.

## Faz A2 — contentQuality test kapısı (çelik duvar)

**Amaç:** İçeriğin gerçekten sayfaya-özel ve dolu olduğunu otomatik ölçen test. Bu kapı, AI ajanın "gate'i kandırmasını" (içeriği sığlaştırıp yine de geçmesini) engeller.

**Bağımlılık:** A1.

**Aktörler:** Sistem kapıyı koşar; CI kapıyı bloklayıcı yapar (Faz F2); AI ajan çıktısı kapıdan geçmeden kabul edilmez; İnsan örneklem denetimi yapar.

1. **Test planı (önce):** `tests/contentQuality.test.ts` yazılır ve **başta KIRMIZI** yanar (407 düğüm jenerik). Doğruladıkları:
   - Yasak kalıp imzası hiçbir maddede yok (A1 listesi).
   - Düğüm-özgüllüğü: her boyutun en az N maddesi düğümün title/tags/summary'sinden bir terim içerir.
   - Çapraz-düğüm benzerlik tavanı: iki düğümün aynı boyuttaki maddeleri Jaccard benzerliği eşiği aşmaz (kopya/şablon yakalama).
   - Biçim: boyut başına 3-5 madde, Türkçe, boş değil.
2. **Veri modeli / şema etkisi:** Yok (test sadece okur).
3. **Geliştirme yaklaşımı:**
   - **E-A2.1 — Kapı testi.**
     - [ ] T-A2.1.1: Yasak-kalıp tarayıcı.
     - [ ] T-A2.1.2: Düğüm-özgüllüğü kontrolü (terim eşleşmesi).
     - [ ] T-A2.1.3: Çapraz-düğüm benzerlik (shingle/Jaccard) kontrolü + eşik.
     - [ ] T-A2.1.4: Biçim/sayım kontrolü.
   - **E-A2.2 — İstisna ve eşik ayarı.**
     - [ ] T-A2.2.1: Alan istisna listesi (ortak meşru terimler) + eşik kalibrasyonu altın düğümlerle.
4. **Edge case / riskler:** Türkçe kök/çekim farkları terim eşleşmesini şaşırtır → normalize (küçük harf, ek-toleransı). Benzerlik kapısı yavaş (422×14) → boyut-bazlı grupla, O(n²) yerine imza-kümeleme.
5. **DoD:** `contentQuality.test.ts` mevcut; altın 15 düğüm geçiyor; 407 düğüm bilinçli olarak KIRMIZI (bu beklenen başlangıç); eşikler kalibre.

## Faz A3 — Provenance ve izlenebilirlik veri modeli

**Amaç:** Her boyut içeriğinin kökenini (template/swarm/human) ve son güncellemesini izlemek; swarm'ın zaten iyi olan içeriği ezmesini önlemek.

**Bağımlılık:** A1.

**Aktörler:** Sistem alanı okur/gösterir; AI ajan ürettiğinde `swarm` damgalar; Kullanıcı elle düzenlediğinde `human` damgalar.

1. **Test planı (önce):** `tests/schema.test.ts`'e provenance alanı için durum: eski düğümler (alan yoksa) `template` varsayılır (geriye uyumluluk); yeni üretim `swarm`/`human` taşır.
2. **Veri modeli / şema etkisi:** `DimensionSchema`'ya geriye uyumlu eklemeler: `provenance: "template" | "swarm" | "human"` (default `template`), `promptVersion: string` (opsiyonel), `lastReviewed: string` (opsiyonel). `.strict()` korunur; default'lar eski JSON'ları bozmaz.
3. **Geliştirme yaklaşımı:**
   - **E-A3.1 — Şema genişletme.**
     - [ ] T-A3.1.1: `provenance/promptVersion/lastReviewed` ekle, default ver.
     - [ ] T-A3.1.2: `dataIntegrity.test.ts` + conformance güncelle (alanlar opsiyonel/uyumlu).
   - **E-A3.2 — Geriye dönük damgalama.**
     - [ ] T-A3.2.1: Mevcut 407 düğümü `template`, 15 altın düğümü `human` damgala (tek seferlik script — yalnız veri, kod değil).
4. **Edge case / riskler:** `.strict()` şema bilinmeyen alanı reddeder → ekleme şart; migration güvenliği: yeni alan append-only (silme/rename yok). 
5. **DoD:** Şema yeni alanları taşıyor; tüm 422 düğüm geçerli; provenance dağılımı `meta.json`'a yansıyor (407 template / 15 human başlangıç).

## Faz A4 — Swarm sıkılaştırma (içerik üretim motoru)

**Amaç:** `tools/agents/run-swarm.mjs`'i, sayfa-başı derin içerik üretip yerel kalite kapısından geçirecek, bütçeli ve idempotent hale getirmek. Bu motor **kullanıcının Mac'inde** koşar (Cowork'te socket-drop nedeniyle değil).

**Bağımlılık:** A2, A3.

**Aktörler:** AI ajan (swarm) içerik üretir; Sistem (yerel kapı) doğrular; Kullanıcı Mac'te koşar; CI sonradan doğrular.

1. **Test planı (önce):** `tools/agents/`'a dry-run test: bir düğüm için bağlam paketi doğru kuruluyor mu; üretilen çıktı `contentQuality` mantığından geçiyor mu (mock LLM ile); bütçe/retry sınırları uygulanıyor mu.
2. **Veri modeli / şema etkisi:** Yok (mevcut Dimension'a yazar; provenance=swarm damgalar).
3. **Geliştirme yaklaşımı:**
   - **E-A4.1 — Bağlam paketi.**
     - [ ] T-A4.1.1: Her düğüm için title/summary/tags/cluster/level/parent-zinciri + boyut prompt'unu paketleyen kurucu.
     - [ ] T-A4.1.2: Altın komşu örneklerini (aynı cluster'dan human/swarm) "few-shot" girdi olarak ekle.
   - **E-A4.2 — Yerel kalite kapısı + döngü.**
     - [ ] T-A4.2.1: Üretim sonrası `contentQuality` mantığını lokal koş; geçmezse 1-3 tur düzelt; 6'da raporla-atla.
     - [ ] T-A4.2.2: provenance=swarm, promptVersion, lastReviewed damgala; yalnız `provenance!=="human"` düğümleri işle (altınları ezme).
   - **E-A4.3 — Bütçe ve dayanıklılık.**
     - [ ] T-A4.3.1: Maks token/düğüm, maks retry, koşu başına düğüm tavanı.
     - [ ] T-A4.3.2: Her düğümden sonra diske yaz (kısmi koşu güvenli); shard-bazlı resume.
4. **Edge case / riskler:** Determinizm yok (LLM) → promptVersion sakla, yeniden koşu yalnız flag'li düğümlerde. Maliyet patlaması → bütçe tavanı + atla. Paralel ajan çakışması → düğüm-başı izole dosya yazımı (aynı dosyaya iki ajan yazmaz).
5. **DoD:** `npm run agents:swarm -- --cluster=<x> --dry-run` çalışıyor; dry-run kapıdan geçiyor; bütçe/retry/resume kanıtlı; altın düğümler korunuyor.

## Faz A5 — Otomasyon iskeleti (opsiyonel, OpenClaw + n8n)

**Amaç:** Swarm → test → raporla → tekrar döngüsünü, manuel takip azaltacak şekilde orkestre etmek. Bu faz **opsiyoneldir**; düz `npm` script + `test-loop.mjs` da yeterlidir.

**Bağımlılık:** A4.

**Aktörler:** n8n iş akışı shard'ları tetikler ve sonuçları toplar; OpenClaw ajan-orkestrasyonunu yönetir; Kullanıcı bütçe/eşik belirler ve onaylar; CI nihai doğrulayıcıdır.

1. **Test planı (önce):** İş akışının kuru çalışması (gerçek LLM çağrısı olmadan) shard sırası + rapor toplama + bütçe-durdurma mantığını doğrular.
2. **Veri modeli / şema etkisi:** Yok (orkestrasyon dışsal; repo'ya yazım hâlâ swarm script'i üzerinden).
3. **Geliştirme yaklaşımı:**
   - **E-A5.1 — n8n akışı.**
     - [ ] T-A5.1.1: "Shard tetikle → swarm koş → contentQuality koş → başarısızları rapora düş → bütçe aşımında dur" akışı.
     - [ ] T-A5.1.2: Bildirim (rapor özeti) + insan onay düğümü (merge öncesi).
   - **E-A5.2 — Sınırlar.**
     - [ ] T-A5.2.1: n8n yalnız tetikler/raporlar; main'e yazmaz; merge insan onayında kalır.
4. **Edge case / riskler:** Orkestratör main'e otomatik push'a evrilirse 3b riskine kayar → akışta "push/merge insan onayı" düğümü zorunlu. Socket-drop → her shard bağımsız ve resume edilebilir.
5. **DoD:** Akış kuru-çalışıyor; main'e otomatik yazım yok; rapor + onay düğümü mevcut. (Bu faz atlanabilir; atlanırsa Küme B düz script'le yürür.)

---

# KÜME B — İçerik Derinleştirme (407 sayfa × 14 boyut)

Bu küme planın ağırlık merkezidir. 407 zayıf (kalıp) sayfanın 14 boyutunu, Bölüm 5 rubriğine ve Küme A kapısına göre gerçek, sayfaya-özel, derin içeriğe çevirir. Çalışma **node-cluster bazlı fazlara** bölünür; her faz tek bir küme (ör. finance) ile sınırlıdır ki paralel ajanlar çakışmasın ve PR'lar incelenebilir kalsın.

### B kümesi ortak faz şablonu (her Bx fazı bunu izler)

1. **Test planı (önce):** O cluster'ın tüm düğümleri için `contentQuality` kapısı koşulur; başta KIRMIZI. Faz sonunda yeşil olmalı.
2. **Veri modeli:** Şema değişmez; yalnız ilgili düğümlerin `dimensions.*.items/notes/prompt` alanları + `provenance=swarm/human` güncellenir.
3. **Geliştirme yaklaşımı:** `npm run agents:swarm -- --cluster=<küme>` küçük partilerle (2-3 eşzamanlı, socket-drop'a karşı) koşulur; çıktı yerel kapıdan geçer; geçen düğümler PR'a girer.
4. **Edge case/risk:** Domain-özel (her fazda ayrı yazılı) + ortak: jenerik kayma, benzerlik ihlali, altın düğümü ezme.
5. **DoD:** Cluster'ın tüm düğümleri `contentQuality` yeşil + en az %15 düğümde insan örneklem-denetimi + çapraz-benzerlik eşiği altında.

### Parti (batch) kuralı

Her cluster, 6-8 düğümlük partilere bölünür (görev setleri = partiler). Bir parti tek oturuşta üretilir, kapıdan geçer, commit edilir; sonraki partiye geçilir. Büyük cluster'lar (aday 36, edu 31) daha çok parti içerir.

### Faz sırası gerekçesi

Önce çekirdek ve yüksek-değerli iş alanları (kernel, core-operations, finance, data-intelligence), sonra yatay/ölçek katmanları, en son doküman/karar kümeleri. Çekirdek önce gelir çünkü diğer sayfaların entegrasyon/integration boyutları çekirdeğe atıf yapar.

## Faz B0 — Pilot (kernel, 15 sayfa) — uçtan uca doğrulama

**Amaç:** Tüm Küme A altyapısını tek küçük cluster üzerinde uçtan uca kanıtlamak; üretim hattı (swarm → kapı → PR) çalışıyor mu görmek. Kernel seçilir çünkü 4 düğümü zaten altın (`k-surface`, `k-control-planes`, `k-agent-runtime`, `k-sozlesme`) — kıyas için referans var.

**Bağımlılık:** A2, A3, A4.

**Aktörler:** AI ajan üretir; Sistem kapıyı koşar; Kullanıcı Mac'te koşar + örneklem denetler; CI doğrular.

1. **Test planı (önce):** kernel 15 düğümün `contentQuality`'si KIRMIZI (11 zayıf), 4 altın YEŞİL kalmalı (ezilmemeli).
2. **Veri modeli:** kernel düğümlerinin boyut alanları; altın 4'ü `human` korunur, 11'i `swarm`.
3. **Geliştirme yaklaşımı:**
   - **E-B0.1 — Pilot koşusu.**
     - [ ] T-B0.1.1: `agents:swarm -- --cluster=kernel --concurrency=2` koş.
     - [ ] T-B0.1.2: 11 zayıf düğümün 14 boyutu derinleşti mi, kapı yeşil mi?
     - [ ] T-B0.1.3: 4 altın düğüm değişmedi mi (provenance=human korundu)?
   - **E-B0.2 — Kalite ayarı.**
     - [ ] T-B0.2.1: Çıktıyı altın komşularla kıyasla; prompt/eşik ayarı gerekiyorsa Küme A'ya geri besle.
     - [ ] T-B0.2.2: İnsan örneklem (en az 4 düğüm) elle oku, onayla.
4. **Edge case/risk:** Pilot zayıf çıkarsa → durdur, A1/A4'ü düzelt, tekrar koş (Küme B'yi pilot yeşilleşmeden yayma). Bu, en pahalı dersin en ucuz yerde alınmasıdır.
5. **DoD:** 15 kernel düğümü yeşil; altınlar korunmuş; insan örneklem onaylı; üretim hattı kanıtlanmış. **Bu DoD karşılanmadan B1+ başlamaz (waterfall kapısı).**

## Faz B1–B27 — Cluster bazlı derinleştirme

Aşağıdaki her faz, ortak şablonu (yukarıda) izler. Her fazda **Odak** satırı, o iş alanı için "derin içerik"in ne demek olduğunu somutlar; **Partiler** görev setleridir.

### Faz B1 — core-operations (25 sayfa, feature)
- **Odak:** CRM/satış/operasyon ArcheType'ları. En yüksek değerli boyutlar: featureDefs (muadil kıyas), security (PII+RLS), eca (lead/görev otomasyonu), integration (kernel+finance). `s-crm` zaten altın → komşu referans.
- **Partiler:** [ ] B1-p1 (8 düğüm) · [ ] B1-p2 (8) · [ ] B1-p3 (9).
- **DoD:** 25 düğüm yeşil; CRM dalının (s-crm, mol-/at-/el-crm-*) tutarlılığı korunmuş.

### Faz B2 — aday (36 sayfa, feature/aday ArcheType)
- **Odak:** Aday servis ArcheType'ları (s-* muhasebe, BI, helpdesk, inventory, vb.). featureDefs (muadil + kapsam), deployment (çok profil), moduleUsage (hangi app tüketir), owasp. En büyük cluster → en çok parti.
- **Partiler:** [ ] B2-p1..p5 (her biri ~7-8 düğüm).
- **DoD:** 36 düğüm yeşil; benzer servisler (s-billing vs s-subscription-analytics) arası benzerlik eşiği altında.

### Faz B3 — layer1 (24 sayfa, feature/yatay yetenek)
- **Odak:** Yatay platform yetenekleri (audit, notification, search, workflow, export/import). integration (çekirdeğe bağ), eca, security, performance.
- **Partiler:** [ ] B3-p1..p3 (8'er).
- **DoD:** 24 düğüm yeşil; yatay yeteneklerin "diğer app'lerden nasıl tüketilir" (moduleUsage) net.

### Faz B4 — crosscut (22 sayfa, feature/kesişen)
- **Odak:** Kesişen kaygılar (i18n, gözlemlenebilirlik, gizlilik, uyum, kimlik). security, owasp, wcag, deployment. KVKK/uyum derinliği önemli.
- **Partiler:** [ ] B4-p1..p3.
- **DoD:** 22 düğüm yeşil; uyum/gizlilik maddeleri jurisdiction-özel.

### Faz B5 — scale (19 sayfa, feature/ölçek)
- **Odak:** Ölçek desenleri (cache, outbox, saga, streaming, multiregion). performance (p95+yöntem), deployment (Swarm/K8s), codeOptimization, integration.
- **Partiler:** [ ] B5-p1..p3.
- **DoD:** 19 düğüm yeşil; her desende ölçülebilir performans hedefi var.

### Faz B6 — data-intelligence (18 sayfa, feature)
- **Odak:** Veri/BI/AI ArcheType'ları. featureDefs, aiAgents (sınır+otonomi), security (veri yönetişimi), eca. Bu cluster'da bazı bespoke içerik mevcut → referans.
- **Partiler:** [ ] B6-p1..p3.
- **DoD:** 18 düğüm yeşil; AI boyutları "ne yapar/ne yapmaz" ayrımıyla.

### Faz B7 — finance (17 sayfa, feature)
- **Odak:** Muhasebe/finans ArcheType'ları. security (denetim izi, SoD=görev ayrılığı), owasp, eca (onay eşikleri), integration (ledger). Finansal doğruluk + audit ağırlıklı.
- **Partiler:** [ ] B7-p1..p2 (8-9'ar).
- **DoD:** 17 düğüm yeşil; her finans düğümünde değişmez audit + onay akışı maddesi.

### Faz B8 — customer-revenue (15 sayfa, feature)
- **Odak:** Gelir/abonelik/müşteri ArcheType'ları. `customer.json` fixture ile hizalı; security (PII+KVKK), eca (yaşam döngüsü), moduleUsage.
- **Partiler:** [ ] B8-p1..p2.
- **DoD:** 15 düğüm yeşil; Customer fixture ile terim tutarlılığı.

### Faz B9 — content-collaboration (14 sayfa, feature)
- **Odak:** İçerik/işbirliği (CMS, wiki, drive, esign). security (paylaşım yetkisi), wcag, integration, moduleUsage.
- **Partiler:** [ ] B9-p1..p2.
- **DoD:** 14 düğüm yeşil.

### Faz B10 — frontend (14 sayfa, feature/FE)
- **Odak:** FE mimari kararları (monorepo, tema, mobil, CDN, anti-pattern). codeOptimization, performance (bundle), wcag, mobileApps. (Bu cluster kararla yakın; jenerik kaçınması kritik.)
- **Partiler:** [ ] B10-p1..p2.
- **DoD:** 14 düğüm yeşil; FE kararları stack yasaklarıyla tutarlı (Next.js/Supabase yok).

### Faz B11 — platform-horizontal (14 sayfa, feature)
- **Odak:** Yatay platform servisleri. integration, deployment, security, moduleUsage.
- **Partiler:** [ ] B11-p1..p2.
- **DoD:** 14 düğüm yeşil.

### Faz B12 — supply-chain (14 sayfa, feature)
- **Odak:** Tedarik/lojistik (WMS, TMS, MRP, procurement). eca (stok/sipariş tetikleri), integration, performance.
- **Partiler:** [ ] B12-p1..p2.
- **DoD:** 14 düğüm yeşil.

### Faz B13 — backend (12 sayfa, feature/BE)
- **Odak:** BE kararları (deploy profilleri, SDK, destek matrisi, API). deployment, security, integration, owasp.
- **Partiler:** [ ] B13-p1..p2.
- **DoD:** 12 düğüm yeşil; Hetzner/Debian/EPYC ortamına uygun deployment notları.

### Faz B14 — hr (12 sayfa, feature)
- **Odak:** İK ArcheType'ları (HRMS, payroll, ATS, performance). security (hassas çalışan verisi), owasp, eca (onboarding/izin akışı).
- **Partiler:** [ ] B14-p1..p2.
- **DoD:** 12 düğüm yeşil.

### Faz B15 — vertical (12 sayfa, feature/dikey)
- **Odak:** Dikey çözümler (clinic, education, restaurant, property, legal). featureDefs (dikey muadil), deployment (shared hosting dahil), integration.
- **Partiler:** [ ] B15-p1..p2.
- **DoD:** 12 düğüm yeşil; her dikeyin shared-hosting (WordPress benzeri) uyum notu.

### Faz B16 — layer0 (11 sayfa, feature/temel katman)
- **Odak:** En alt platform katmanı. integration (çekirdek), security, deployment.
- **Partiler:** [ ] B16-p1..p2.
- **DoD:** 11 düğüm yeşil.

### Faz B17 — dx (6 sayfa, feature/geliştirici deneyimi)
- **Odak:** Geliştirici deneyimi (CLI, API gateway, marketplace, workflow). integration, codeOptimization, moduleUsage.
- **Partiler:** [ ] B17-p1.
- **DoD:** 6 düğüm yeşil.

### Faz B18 — atomic (2 sayfa, feature/atom tipleri)
- **Odak:** Atom tip tanımları. featureDefs (tip sözleşmesi), codeOptimization.
- **Partiler:** [ ] B18-p1.
- **DoD:** 2 düğüm yeşil.

### Faz B19 — sus (21 sayfa, karar/mimari spec)
- **Odak:** Sürdürülebilir mimari/spec düğümleri (conformance, versioning, declarative, codemod, lisans). Bunlar feature değil; **doküman-kalite** varyantı uygulanır: featureDefs→"karar özeti", integration, testing, owasp; alakasız boyutlarda "uygulanmaz + gerekçe".
- **Partiler:** [ ] B19-p1..p3.
- **DoD:** 21 düğüm yeşil (doküman-kalite kriteriyle); "uygulanmaz" işaretli boyutlar gerekçeli.

### Faz B20 — build (22 sayfa, süreç/yol haritası)
- **Odak:** İnşa süreci/yol haritası/risk defteri düğümleri. Doküman-kalite varyantı: featureDefs→"süreç tanımı", testing, integration; çoğu teknik boyut "uygulanmaz + gerekçe".
- **Partiler:** [ ] B20-p1..p3.
- **DoD:** 22 düğüm yeşil (doküman-kalite).

### Faz B21 — kararlar / ADR (26 sayfa, karar kaydı)
- **Odak:** Mimari Karar Kayıtları (ADR). Doküman-kalite: her ADR için bağlam/karar/sonuç netliği + ilgili ArcheType/feature'a bağ (integration). 14 boyut yerine ADR-özel kriter.
- **Partiler:** [ ] B21-p1..p4.
- **DoD:** 26 ADR'de bağlam-karar-sonuç dolu + çapraz-bağlar mevcut.

### Faz B22 — edu (31 sayfa, eğitim/müfredat)
- **Odak:** Vibecoding eğitim üniteleri. Doküman-kalite: öğrenme hedefi + adımlar + örnek prompt + alıştırma. En büyük doc cluster → çok parti.
- **Partiler:** [ ] B22-p1..p4.
- **DoD:** 31 ünite yeşil (eğitim-kalite kriteriyle); her ünitede uygulanabilir alıştırma.

### Faz B23 — landx (8 sayfa, landing/anlatı)
- **Odak:** Tanıtım/anlatı katmanı. Doküman-kalite: değer önermesi netliği; teknik boyutlar çoğunlukla "uygulanmaz".
- **Partiler:** [ ] B23-p1.
- **DoD:** 8 düğüm yeşil (anlatı-kalite).

### Faz B24 — egitim (6 sayfa, eğitim)
- **Odak:** Ek eğitim düğümleri. edu ile aynı doküman-kalite kriteri.
- **Partiler:** [ ] B24-p1.
- **DoD:** 6 düğüm yeşil.

### Faz B25 — meta (4 sayfa, üst-bilgi)
- **Odak:** Proje üst-bilgi/genel bakış düğümleri. Doküman-kalite: özet doğruluğu + güncel sayımlar.
- **Partiler:** [ ] B25-p1.
- **DoD:** 4 düğüm yeşil + meta sayımlar gerçek veriyle tutarlı.

### Faz B26 — genel (2 sayfa, genel)
- **Odak:** Genel/sınıflandırılmamış düğümler. Doküman-kalite veya uygun cluster'a taşıma kararı.
- **Partiler:** [ ] B26-p1.
- **DoD:** 2 düğüm yeşil veya doğru cluster'a taşınmış.

### Faz B27 — Kalan/yeni düğümler (x-stone/x-molecule/x-element/x-atom kırılımları)
- **Odak:** `expand-depth.mjs` ile üretilmiş alt-seviye kırılım düğümleri (app-*-x-stone/molecule/element/atom). Bunlar üst ArcheType'ın alt-detayıdır; içerik üst düğümle tutarlı ama daha granüler olmalı (codeOptimization, testing, performance ağırlıklı).
- **Partiler:** [ ] B27-p1..p6 (çok sayıda; cluster'a göre grupla).
- **DoD:** Tüm kırılım düğümleri yeşil; üst-alt tutarlılık (parent ile çelişki yok).

## Faz B28 — Çapraz-tutarlılık konsolidasyonu

**Amaç:** Tüm cluster'lar bittikten sonra bütünsel tutarlılık: benzer sayfalar birbirini tekrar etmesin, terimler tutarlı olsun, üst-alt düğümler çelişmesin.

**Bağımlılık:** B0–B27.

**Aktörler:** Sistem benzerlik/tutarlılık kapısını koşar; Kullanıcı çatışmaları çözer; AI ajan önerir.

1. **Test planı (önce):** Global çapraz-düğüm benzerlik kapısı (tüm 422 düğüm, boyut-bazlı); terim tutarlılık kontrolü (App/Module/ArcheType/field kullanımı); üst-alt çelişki kontrolü.
2. **Veri modeli:** Yok (okur + nokta düzeltme).
3. **Geliştirme yaklaşımı:**
   - **E-B28.1 — Global benzerlik taraması.** [ ] T-B28.1.1: Eşik üstü çiftleri raporla. [ ] T-B28.1.2: Tekrarları farklılaştır.
   - **E-B28.2 — Terim/sözlük tutarlılığı.** [ ] T-B28.2.1: Sözlük dışı/yanlış terim kullanımını düzelt.
   - **E-B28.3 — Üst-alt tutarlılık.** [ ] T-B28.3.1: parent-child çelişkilerini gider.
4. **Edge case/risk:** Aşırı farklılaştırma yapay çeşitlilik üretir → insan denetimi. 
5. **DoD:** Global benzerlik eşiği altında; terim tutarlı; üst-alt çelişki yok; 422/422 `contentQuality` yeşil; `meta.json` provenance dağılımı güncel (hedef: template ≈ 0, swarm+human = 422).

---

# KÜME C — ECA/Ruleset Hazır Paket Kataloğu

Bu küme, sayfa-başı tekil ECA kurallarının ötesine geçip **yeniden kullanılabilir ruleset paketleri** tanımlar. Paket = belirli bir riski/akışı kapsayan, yetki katmanlı (system/platform/tenant), parametreli ve conformance-testli ECA kümesi. Bu paketler **tanımdır** (gelecekteki ürünün backend ruleset engine'inin kullanacağı sözleşme); planlama aracında JSON-as-DB olarak saklanır ve sayfaların `eca` boyutundan referansla bağlanır.

### Ortak paket anatomisi (her C paketi bunu taşır)
`id` · `name` · `layer` (system/platform/tenant) · `immutable` (system için true) · `triggers` (olay listesi) · `rules` (Event-Condition-Action üçlüleri, maxChainDepth≤6, idempotent) · `params` (tenant-editable güvenli parametreler) · `steelWallRefs` (bağlı çelik duvarlar) · `conformance` (assert listesi) · `version`.

## Faz C1 — Ruleset paket şeması + katman modeli

**Amaç:** Paketlerin tek tip, doğrulanabilir bir şemaya oturması; 3 yetki katmanının (system kilitli / platform / tenant güvenli-param) makinece zorlanması.

**Bağımlılık:** Mevcut `EcaRuleSchema`, `RulesetLayerSchema`, `RulesetBindingSchema`.

**Aktörler:** Sistem şemayı doğrular; Platform Owner platform paketlerini yönetir; Tenant Admin yalnız güvenli parametreleri düzenler; AI ajan paket override edemez.

1. **Test planı (önce):** `tests/rulesetCatalog.test.ts` — paket şeması conformance; system paketi `immutable=true`; tenant katmanı yalnız `tenantEditableParams` ile düzenlenebilir; her kuralda `maxChainDepth≤6` + idempotency işareti.
2. **Veri modeli:** `src/schemas/ruleset.ts` → `RulesetPackageSchema` (yukarıdaki anatomi). `src/data/rulesets/` klasörü (JSON-as-DB).
3. **Geliştirme yaklaşımı:**
   - **E-C1.1 — Paket şeması.** [ ] T-C1.1.1: `RulesetPackageSchema` (.strict). [ ] T-C1.1.2: katman + immutable zorlaması. [ ] T-C1.1.3: conformance test iskeleti (kırmızı).
4. **Edge case/risk:** Tenant'ın güvensiz parametre düzenlemesi → allowlist dışı param reddedilir. Paketler arası kural çakışması → öncelik/katman sırası tanımı (system > platform > tenant).
5. **DoD:** Şema mevcut; katman/immutable testleri yeşil; `src/data/rulesets/` hazır.

## Faz C2 — Paket: ArcheType Update Safety Ruleset (system, immutable)

**Amaç:** ArcheType güncellemelerinin veri kaybı olmadan, geçmiş korunarak yapılmasını zorlayan kilitli paket.
- **Katman:** system (immutable).
- **Tetikleyiciler:** `ai.archetype.update.requested`, `archetype.update.requested`.
- **Kurallar (E-C-A):** güncelleme `historyPreserved=false` ise → **deny**; `snapshot/rollback/compat` eksikse → **deny + admin'e bildir**; migration modu izinli değilse (`append-only`/`expand-contract`/`reversible-backfill` dışı) → **deny**.
- **Params (tenant):** yok (system kilitli).
- **Çelik duvar bağı:** migration-safety, rollback-snapshot-gates, audit-forensic-log.
1. **Test (önce):** prod update geçmiş-koru gate'i; eksik snapshot/rollback deny; izinsiz migration modu deny. (`evaluateAgentPolicy` ile hizalı.)
2-3. **Yaklaşım:** [ ] T-C2.1: paket JSON'u yaz. [ ] T-C2.2: conformance assert. [ ] T-C2.3: `prodDataPolicy` ile tutarlılık.
4. **Risk:** Acil düzeltmede paket fazla katı → "platform owner + açık risk onayı" istisna yolu (yine de snapshot zorunlu).
5. **DoD:** Paket immutable; tüm deny senaryoları yeşil; `migrationPolicy` ile çelişki yok.

## Faz C3 — Paket: Field Rename Migration Ruleset (system, immutable)

**Amaç:** Alan (field) yeniden adlandırmanın doğrudan yapılmasını engelleyip deprecated→alias→backfill yolunu zorlamak.
- **Katman:** system. **Tetikleyiciler:** `archetype.field.rename.requested`, `archetype.field.delete.requested`, `archetype.field.typechange.requested`.
- **Kurallar:** doğrudan rename/delete/type-change → **deny**; yalnız `deprecated=true` + `alias` eklenmiş + `backfill planı` varsa → **allow (gated)**.
- **Çelik duvar bağı:** migration-safety, protected-fields-rules-archetypes.
1. **Test (önce):** doğrudan rename deny; alias+backfill yolu allow; protected field her hâlükârda owner onayı.
2-3. [ ] T-C3.1: paket JSON. [ ] T-C3.2: `FieldSchema.protected/alias/deprecated` ile hizala. [ ] T-C3.3: conformance.
4. **Risk:** Backfill yarıda kalırsa eski+yeni alan tutarsız → dual-write + tutarlılık kontrolü maddesi.
5. **DoD:** Doğrudan değişiklik deny; alias yolu allow; testler yeşil.

## Faz C4 — Paket: Tenant Isolation Breach Ruleset (system, immutable)

**Amaç:** Kiracı (tenant) sınırının ihlalini tespit edip bloklamak ve adli iz bırakmak.
- **Katman:** system. **Tetikleyiciler:** `data.access.requested`, `query.executed`, `export.requested`.
- **Kurallar:** istek `tenant_id` bağlamı taşımıyorsa → **deny**; çapraz-tenant erişim denemesi → **deny + audit + step-up**; toplu export tenant filtresi yoksa → **deny**.
- **Çelik duvar bağı:** tenant-isolation, audit-forensic-log, rate-cost-abuse-limits.
1. **Test (önce):** tenant_id eksik deny; çapraz-tenant deny+audit; filtresiz export deny.
2-3. [ ] T-C4.1: paket JSON. [ ] T-C4.2: `TenantIsolationSchema` (rls/tenantField) ile hizala. [ ] T-C4.3: conformance.
4. **Risk:** Platform-düzeyi (cross-tenant) meşru işler (raporlama) → ayrı platform-owner rolü + explicit allowlist.
5. **DoD:** İhlal senaryoları deny+audit; meşru platform işleri allowlist'le ayrık; testler yeşil.

## Faz C5 — Paket: Prompt Injection Guard Ruleset (system, immutable)

**Amaç:** AI ajana gelen alt-prompt/kullanıcı girdisinin güvenilmez sayılması ve yetki yükseltme/komut enjeksiyonunun engellenmesi.
- **Katman:** system. **Tetikleyiciler:** `ai.generation.requested`, `ai.update.requested`, `ai.ruleset.override.requested`.
- **Kurallar:** alt-prompt güvenilmez (`subPromptUntrusted=true`); ruleset override talebi → **her zaman deny**; yetki dışı aksiyon talebi → **deny + audit**; şüpheli kalıp (talimat enjeksiyonu) → **karantina + admin'e bildir**.
- **Çelik duvar bağı:** prompt-injection-guard, immutable-ruleset-boundary, action-allowlist.
1. **Test (önce):** override talebi deny (mevcut `evaluateAgentPolicy` ile birebir); allowlist dışı aksiyon deny; enjeksiyon kalıbı karantina.
2-3. [ ] T-C5.1: paket JSON. [ ] T-C5.2: `AgentPolicy.subPromptUntrusted/forbiddenActions` ile hizala. [ ] T-C5.3: conformance.
4. **Risk:** Aşırı agresif filtre meşru içeriği keser → karantina (silme değil) + insan inceleme.
5. **DoD:** Override/enjeksiyon senaryoları engellenir; meşru içerik karantinayla korunur; testler yeşil.

## Faz C6 — Paket: Approval Escalation Ruleset (platform, parametreli)

**Amaç:** Riskli aksiyonlarda otomatik onay yükseltme (step-up) — kim, hangi eşikte onaylar.
- **Katman:** platform (tenant yalnız eşik parametrelerini ayarlar). **Tetikleyiciler:** `action.requested` (riskLevel high/critical), `archetype.publish.requested`.
- **Kurallar:** riskLevel≥high → **step-up onay**; veri-kaybı riski → **platform owner onayı**; onaysız ilerleme → **deny**.
- **Params (tenant):** onay eşiği (hangi riskLevel'den itibaren), onaylayıcı rol — yalnız güvenli aralıkta.
- **Çelik duvar bağı:** rollback-snapshot-gates, audit-forensic-log.
1. **Test (önce):** high risk step-up; data-loss owner onayı; onaysız deny; tenant param yalnız güvenli aralıkta.
2-3. [ ] T-C6.1: paket JSON. [ ] T-C6.2: `TypedActionSchema.riskLevel/requiresApproval` ile hizala. [ ] T-C6.3: conformance.
4. **Risk:** Onay zinciri kilitlenirse iş durur → zaman aşımı + yedek onaylayıcı (yine audit'li).
5. **DoD:** Step-up senaryoları doğru; tenant param güvenli; testler yeşil.

## Faz C7 — Ek operasyonel paketler

**Amaç:** Çekirdek 5 güvenlik paketinin yanına sık kullanılan operasyonel paketler eklemek.
- **Paketler:** Rate/Cost/Abuse Limit (AI maliyet + oran sınırı), Audit/Forensic Log (actor/agent/model/promptVersion/before-after-hash), Lifecycle Transition Guard (durum makinesi geçiş koruması), Notification/SLA (eşik aşımı bildirimi), Idempotency/Loop-Breaker (zincir≤6 + tekrar koruması).
1. **Test (önce):** her paket için temel allow/deny + sınır senaryosu.
2-3. [ ] T-C7.1..T-C7.5: beş paketi JSON + conformance.
4. **Risk:** Paket sayısı arttıkça çakışma → C1 katman/öncelik sırası uygulanır.
5. **DoD:** 5 operasyonel paket conformance yeşil.

## Faz C8 — Katalog conformance + ArcheType bağlama

**Amaç:** Tüm paketlerin bütünsel doğrulanması ve ArcheType/sayfa `eca` boyutlarından referansla bağlanması.

1. **Test (önce):** her sayfanın `eca` boyutu en az 1 hazır pakete referans veriyor mu (Faz B ile entegre); paket id'leri çözülüyor mu; ölü referans yok.
2-3. **Yaklaşım:** [ ] T-C8.1: paket↔sayfa bağ haritası. [ ] T-C8.2: Product/Customer fixture'larının `rulesetBindings`'ini paketlere bağla. [ ] T-C8.3: ölü-referans kapısı.
4. **Risk:** Sayfa yanlış pakete bağlanır → conformance + insan denetimi.
5. **DoD:** Tüm paketler conformance yeşil; fixture'lar paketlere bağlı; ölü referans yok.

## Faz C9 — Katalog gösterim (JSON-as-DB + panel listesi)

**Amaç:** Paket kataloğunu panelde okunur kılmak (yalnız gösterim; düzenleme gelecekte).

1. **Test (önce):** e2e — katalog sayfası paketleri listeler; bir paketin kuralları/katmanı görünür.
2-3. **Yaklaşım:** [ ] T-C9.1: `src/views`'a katalog görünümü (read-only). [ ] T-C9.2: router + nav. [ ] T-C9.3: a11y (WCAG AAA) + mobile-first.
4. **Risk:** Düzenleme yüzeyi eklenirse yetki sınırı gerekir → bu fazda yalnız read-only.
5. **DoD:** Katalog görünümü canlı; paketler listeleniyor; e2e+axe yeşil.

---

# KÜME D — Surface ve Workflow Sözleşmeleri

Bu küme, şu an yalnız referans (ref+version) olarak anılan Surface ve Workflow'u, Product/Customer gibi **ayrı şema + fixture** seviyesinde güçlü tanımlar. İlke: Surface (projeksiyon) ve Workflow (davranış) ArcheType'tan **ayrı** ve **ayrı versiyonlanır**, ama ArcheType ile ilişkilidir.

## Faz D1 — Surface contract şeması (ayrı, versiyonlu)

**Amaç:** ArcheType'ın UI/API/tablo izdüşümünü tanımlayan bağımsız sözleşme.

1. **Test (önce):** `tests/surface.test.ts` — Surface şema conformance; bağlı ArcheType ref+version çözülüyor; alan projeksiyonları ArcheType field'larına atıfta tutarlı.
2. **Veri modeli:** `src/schemas/surface.ts` → `SurfaceContractSchema`: `identity` (id/name/version), `kind` (ui/api/table), `boundArchetype` (ref+version), `fieldProjections` (hangi field görünür/gizli/salt-okuma), `permissionsView`, `layoutHints`, `linkedWorkflows`.
3. **Yaklaşım:** [ ] T-D1.1: şema. [ ] T-D1.2: ArcheType field referans doğrulama. [ ] T-D1.3: versiyon alanı + uyumluluk.
4. **Risk:** Surface, ArcheType'tan kopuk versiyonlanırsa uyumsuzluk → D5 uyumluluk kapısı.
5. **DoD:** Şema mevcut; conformance yeşil; ArcheType ile referans bütünlüğü.

## Faz D2 — Workflow contract şeması (ayrı, versiyonlu)

**Amaç:** ArcheType'ın durum makinesi/süreç davranışını tanımlayan bağımsız sözleşme.

1. **Test (önce):** `tests/workflow.test.ts` — durum/geçiş conformance; başlangıç durumu geçerli; geçişlerde guard + actor; ECA/approval paketleriyle bağ.
2. **Veri modeli:** `src/schemas/workflow.ts` → `WorkflowContractSchema`: `identity`, `boundArchetype` (ref+version), `states`, `transitions` (from/to/guard/actor), `slas`, `escalation` (Approval Escalation paketine bağ), `version`.
3. **Yaklaşım:** [ ] T-D2.1: şema. [ ] T-D2.2: geçiş guard'ları + actor. [ ] T-D2.3: SLA/escalation ruleset bağı.
4. **Risk:** Erişilemez durum/ölü geçiş → durum makinesi tutarlılık kontrolü (ulaşılabilirlik).
5. **DoD:** Şema mevcut; conformance yeşil; durum makinesi tutarlı.

## Faz D3 — Product Surface + Workflow fixture

**Amaç:** Product ArcheType için gelişmiş Surface + Workflow örneği (Product.json ile hizalı).
1. **Test (önce):** Product Surface+Workflow şemaya uyar; Product ArcheType field/lifecycle'ına tutarlı bağlanır.
2-3. [ ] T-D3.1: `src/data/surfaces/product.json`. [ ] T-D3.2: `src/data/workflows/product.json`. [ ] T-D3.3: ArcheType↔Surface↔Workflow bağ.
4. **Risk:** Fixture ArcheType'la sürüm uyumsuzluğu → D5.
5. **DoD:** İki fixture conformance yeşil + Product ArcheType ile tutarlı.

## Faz D4 — Customer Surface + Workflow fixture

**Amaç:** Customer ArcheType için gelişmiş Surface + Workflow örneği (PII/KVKK akışlarıyla).
1. **Test (önce):** Customer Surface PII alanlarını doğru projekte eder (maskeleme/gizli); Workflow KVKK anonimleştirme/step-up taşır.
2-3. [ ] T-D4.1: `src/data/surfaces/customer.json`. [ ] T-D4.2: `src/data/workflows/customer.json`. [ ] T-D4.3: PII projeksiyon + onay akışı.
4. **Risk:** PII alanı yanlış projekte edilirse sızıntı → field-level yetki conformance.
5. **DoD:** İki fixture yeşil + PII/KVKK akışları doğru.

## Faz D5 — ArcheType ↔ Surface ↔ Workflow ilişki + versiyon uyumluluğu

**Amaç:** Üç sözleşmenin ayrı versiyonlanırken uyumlu kalmasını zorlamak.
1. **Test (önce):** `boundArchetype.version` ile gerçek ArcheType `versioning.version` uyumu; `compatibleWith` zinciri; uyumsuz çift → kapı kırmızı.
2-3. [ ] T-D5.1: versiyon uyumluluk kapısı. [ ] T-D5.2: ArcheType `linkedSurfaces/linkedWorkflows` ref'lerini gerçek fixture'lara bağla. [ ] T-D5.3: ölü/uyumsuz referans kapısı.
4. **Risk:** Versiyon kayması (ArcheType v2, Surface v1) → expand-contract benzeri uyum penceresi tanımı.
5. **DoD:** Üçlü referans bütünlüğü + versiyon uyumu yeşil; ölü referans yok.

---

# KÜME E — Panel Görünürlük ve Simülasyon (ikincil)

Bu küme, araç (panel) tarafında bir iyileştirmedir; planın ana eksiği değildir. Amaç: görev tanımındaki yapısal kuralları (ECA), AI politikasını ve kalite/risk alanlarını görev detayında **göstermek** ve yazılan kuralı **simüle etmek**. Hiçbir görev yürütülmez; yalnız tanım görselleştirilir ve sınanır. Bu küme Küme B-D'den sonra yapılmalıdır (içerik olgunlaşmadan UI gösterimi erken olur).

## Faz E1 — Görev detayında ECA gösterimi

**Amaç:** `TaskDetailView`'a düğümün `ecaRules` (yapısal) listesini okunur biçimde eklemek.
1. **Test (önce):** e2e — ECA taşıyan bir görevde kurallar (event/when/then/maxChainDepth) görünür; taşımayanda boş-durum.
2. **Veri modeli:** Yok (mevcut `ecaRules` okunur).
3. **Yaklaşım:** [ ] T-E1.1: ECA kartı bileşeni. [ ] T-E1.2: event/condition/action okunur format. [ ] T-E1.3: a11y + mobile-first.
4. **Risk:** Kalabalık görünüm → katlanır/özetli kart.
5. **DoD:** ECA kuralları detayda görünür; e2e+axe yeşil.

## Faz E2 — agentPolicy + çelik duvar göstergesi

**Amaç:** Düğümün `agentPolicy`'sini (otonomi, izinli/yasak aksiyon, çelik duvarlar) görünür kılmak; "ne yapar / ne yapmaz" ayrımını UI'da açık göstermek.
1. **Test (önce):** e2e — agentPolicy taşıyan görevde otonomi + yasak aksiyon listesi + çelik duvar rozetleri görünür.
2-3. [ ] T-E2.1: politika kartı. [ ] T-E2.2: yasak/izinli ayrımı görsel. [ ] T-E2.3: çelik duvar rozet listesi.
4. **Risk:** Politika karmaşık → "ne yapar/ne yapmaz" iki sütun.
5. **DoD:** agentPolicy + çelik duvarlar görünür; e2e+axe yeşil.

## Faz E3 — "Kuralı simüle et" düğmesi (evaluateEca)

**Amaç:** Yazılan ECA kuralını panelde sınamak: kullanıcı bir olay+bağlam girer, `evaluateEca` "tetiklenir/tetiklenmez + neden" döndürür. Hiçbir şey yürütmez; yalnız tanımı değerlendirir.
1. **Test (önce):** unit — `evaluateEca` zaten test-li; e2e — simülasyon formu sonucu (fired/reason) gösteriyor.
2. **Veri modeli:** Yok (saf değerlendirme, yan etkisiz).
3. **Yaklaşım:** [ ] T-E3.1: simülasyon formu (olay + bağlam alanları). [ ] T-E3.2: `evaluateEca` çağrısı + sonuç gösterimi. [ ] T-E3.3: zincir-derinliği/maxChainDepth görünür.
4. **Risk:** Kullanıcı "simüle = çalıştır" sanır → net etiket: "Bu yalnız tanımı sınar, hiçbir görev yürütmez."
5. **DoD:** Simülasyon sonucu doğru (unit ile tutarlı); yan etki yok; e2e yeşil; net "yürütmez" uyarısı.

## Faz E4 — Risk/teslimat/kabul/metrik gösterimi

**Amaç:** Şemada olan ama detayda gösterilmeyen `risks`, `deliverables`, `acceptanceCriteria`, `metrics` alanlarını görünür kılmak.
1. **Test (önce):** e2e — bu alanları taşıyan görevde dört bölüm görünür; boşsa gizli.
2-3. [ ] T-E4.1: dört bölüm bileşeni. [ ] T-E4.2: boş-durum yönetimi. [ ] T-E4.3: a11y.
4. **Risk:** Detay sayfası uzar → sekmeli/akordeon düzen.
5. **DoD:** Dört alan görünür; e2e+axe yeşil.

## Faz E5 — shadcn hizalama / bileşen standardı (minör)

**Amaç:** Listede istenen `shadcn/ui`'ye hizalanma kararı: ya mevcut özel Radix bileşenlerini shadcn deseniyle standartlaştır, ya da bilinçli "shadcn-bağımsız" kararını dokümante et.
1. **Test (önce):** mevcut bileşen testleri korunur; görsel regresyon yoksa davranış testleri yeşil kalmalı.
2-3. [ ] T-E5.1: karar — shadcn CLI'a geç mi, özel kalsın mı (gerekçeli). [ ] T-E5.2: seçime göre ya shadcn bileşenleri ekle ya da `docs`'a sapma gerekçesi yaz.
4. **Risk:** shadcn'e geçiş regresyon getirir → kademeli, test korumalı.
5. **DoD:** Karar dokümante; seçilen yol uygulanmış; testler yeşil.

---

# KÜME F — Doğrulama, Yayın, Süreklilik

Bu küme, tüm üretilen içeriğin ve sözleşmelerin bütünsel doğrulanması, CI'da kapıya bağlanması, yayınlanması ve sürdürülmesidir.

## Faz F1 — Bütünsel conformance + regresyon matrisi

**Amaç:** Tüm kapıların (dataIntegrity, contentQuality, archetype, ruleset, surface, workflow, engine) tek koşuda yeşil olduğunu kanıtlamak.
1. **Test (önce):** `npm test` tüm suite + kapsam raporu; regresyon matrisi (hangi test hangi gereksinimi karşılar) çıkarılır.
2-3. [ ] T-F1.1: tüm testleri tek koşuda yeşile getir. [ ] T-F1.2: gereksinim→test izlenebilirlik matrisi (`docs`). [ ] T-F1.3: kapsam eşiği belirle.
4. **Risk:** Flaky test → `test-loop.mjs` (max 6) + karantina listesi.
5. **DoD:** Tüm suite yeşil; izlenebilirlik matrisi mevcut; flaky yok.

## Faz F2 — CI'da contentQuality kapısını bloklayıcı yap

**Amaç:** İçerik kalitesini CI'da zorunlu kılmak ki gelecekte kalıp içerik geri sızmasın.
1. **Test (önce):** CI'da `contentQuality` kırmızıysa deploy olmamalı (job-log'dan `outcome` doğrula, `conclusion`'a güvenme).
2-3. [ ] T-F2.1: `deploy.yml`'a contentQuality adımı (bloklayıcı). [ ] T-F2.2: eşikleri CI ortamına göre ayarla. [ ] T-F2.3: yeşil/kırmızı kanıtı job-log'dan.
4. **Risk:** Çok katı kapı meşru PR'ı bloklar → eşik + istisna listesi gözden geçirilebilir.
5. **DoD:** contentQuality CI'da bloklayıcı; kırmızıda deploy durur (kanıtlı).

## Faz F3 — Yayın + Pages doğrulama

**Amaç:** İçerik+sözleşmeler merge edilince Pages'in güncel commit'i yayınladığını doğrulamak.
1. **Test (önce):** deploy sonrası canlı site erişilebilir; sürüm/commit teyidi (Actions run + site).
2-3. [ ] T-F3.1: PR→main merge (insan onayı). [ ] T-F3.2: Actions deploy yeşil + Pages canlı. [ ] T-F3.3: deploy edilen commit = main HEAD teyidi.
4. **Risk:** SPA derin-link 404 → `spa404.mjs` (404.html) korunur.
5. **DoD:** Pages güncel commit'i yayınlıyor; derin-link çalışıyor; deploy commit teyitli.

## Faz F4 — Süreklilik, bakım, unknown-unknowns risk keşfi

**Amaç:** Planı tek seferlik değil sürdürülebilir kılmak; fark edilmeyen risk sınıflarını (bilinmeyen bilinmeyenler) checklist'le keşfetmek.
1. **Test (önce):** Yeni düğüm eklendiğinde tüm kapıların otomatik koşması (regresyon); Ek C checklist'inin periyodik gözden geçirimi.
2-3. [ ] T-F4.1: "yeni sayfa eklendiğinde" akışı (contentQuality + conformance otomatik). [ ] T-F4.2: çeyreklik unknown-unknowns gözden geçirimi (Ek C). [ ] T-F4.3: provenance dağılımı izleme (template geri sızdı mı).
4. **Risk:** İçerik zamanla bayatlar → `lastReviewed` + periyodik tazeleme.
5. **DoD:** Yeni-sayfa akışı kapıları otomatik koşuyor; Ek C gözden geçirim takvimi var; provenance izleniyor.

---

# EKLER

## Ek A — Komut referansı (Mac'te koşulur)

Üretim/test hattı:
- `npm run typecheck` — tip denetimi (mount'ta da çalışır).
- `npm test` — tüm vitest suite (contentQuality dahil).
- `npm run test:e2e` — Playwright + axe (WCAG 2.2).
- `npm run build` — Vite üretim derlemesi + SPA 404.
- `npm run agents:swarm -- --cluster=<küme> --concurrency=2 [--dry-run]` — içerik üretim sürüsü (yalnız Mac).
- `npm run gen:reindex` — düğüm eklenince index/nav/meta + wbsCode yeniden kurar.

Git (yorumsuz, kesme işaretsiz — zsh quote kilidi olmasın):
- `git checkout -b <faz-dali>`
- `git add -A`
- `git commit -m "feat: <faz>"`
- `git push -u origin <faz-dali>` (sonra PR; main'e insan merge eder)

Mount kilidi takılırsa (yalnız sandbox sorunu, Mac'te olmaz): `rm -f $(find .git -name "*.lock")`.

## Ek B — DoD master checklist (küme kapıları)

- [ ] Küme A: kalite sözleşmesi + contentQuality kapısı + provenance + swarm sıkılaştırma hazır; altın 15 düğüm yeşil.
- [ ] Küme B: 422/422 `contentQuality` yeşil; global benzerlik eşiği altında; provenance template≈0.
- [ ] Küme C: paket şeması + 5 çekirdek + operasyonel paketler conformance yeşil; sayfa `eca` boyutları paketlere bağlı; ölü referans yok.
- [ ] Küme D: Surface/Workflow şema + Product/Customer fixture + versiyon uyumu yeşil.
- [ ] Küme E: ECA/agentPolicy/risk gösterimi + simülasyon; e2e+axe yeşil; "yürütmez" uyarısı net.
- [ ] Küme F: tüm suite yeşil; contentQuality CI'da bloklayıcı; Pages güncel commit; süreklilik akışı kurulu.

Genel kapı: Her faz kendi DoD'si dolmadan sonraki faza geçilmez (waterfall). main'e her giriş PR + insan onayıyla.

## Ek C — Unknown-unknowns (bilinmeyen bilinmeyenler) risk keşfi checklist

Tanım: sistemin şu an fark etmediği risk sınıfı. Periyodik (çeyreklik) sor:
- [ ] İçerik: AI üretimi sessizce sığlaşıyor mu (kapıyı geçen ama değersiz içerik)?
- [ ] Güvenlik: yeni bir ECA paketi başka paketin denylist'ini delebiliyor mu (katman çakışması)?
- [ ] Migration: bir alias/backfill yarıda kalıp eski+yeni alan tutarsızlığı bırakıyor mu?
- [ ] Tenant: yeni bir export/rapor yolu tenant filtresini atlıyor mu?
- [ ] Prompt injection: alt-prompt yeni bir kanaldan (örn. fixture içeriği) yetki yükseltebiliyor mu?
- [ ] Versiyon: Surface/Workflow, ArcheType'tan sessizce sürüm kaçırıyor mu?
- [ ] Maliyet: swarm yeniden koşuları bütçe tavanını aşıyor mu?
- [ ] Determinizm: aynı düğüm farklı koşularda çok farklı içerik üretip tutarlılığı bozuyor mu?
- [ ] Erişilebilirlik: yeni görünüm (katalog/simülasyon) WCAG AAA'dan düşüyor mu?
- [ ] Süreklilik: `lastReviewed` eskiyen düğümler birikiyor mu (bayat içerik)?

## Ek D — Risk defteri (özet)

- **R1 — Gate'i kandırma (yüksek):** AI kapıyı geçen ama sığ içerik üretir. Azaltma: benzerlik + özgüllük kapısı + insan örneklem.
- **R2 — Maliyet patlaması (orta):** flaky üretimde sınırsız LLM çağrısı. Azaltma: retry/bütçe tavanı + raporla-atla.
- **R3 — Altın içeriğin ezilmesi (orta):** swarm zengin düğümü yeniden yazar. Azaltma: provenance=human atla.
- **R4 — Ruleset katman çakışması (yüksek):** paketler birbirini deler. Azaltma: system>platform>tenant öncelik + conformance.
- **R5 — Surface/Workflow sürüm kayması (orta):** uyumsuz versiyon. Azaltma: D5 uyumluluk kapısı.
- **R6 — Determinizm yok (orta):** tekrarlanamaz içerik. Azaltma: promptVersion + yalnız flag'li yeniden koşu.
- **R7 — UI "simüle = çalıştır" yanılgısı (düşük):** Azaltma: net "yürütmez" etiketi.
- **R8 — Mount git tuzağı (düşük):** kilit takılır. Azaltma: Ek A lock temizleme; git Mac'te.

## Ek E — Node-cluster sayım tablosu (toplam 422)

| Küme | Sayfa | Tip | İlgili Faz |
|---|---|---|---|
| aday | 36 | feature | B2 |
| edu | 31 | doküman | B22 |
| kararlar | 26 | karar/ADR | B21 |
| core-operations | 25 | feature | B1 |
| layer1 | 24 | feature | B3 |
| build | 22 | süreç | B20 |
| crosscut | 22 | feature | B4 |
| sus | 21 | karar/spec | B19 |
| scale | 19 | feature | B5 |
| data-intelligence | 18 | feature | B6 |
| finance | 17 | feature | B7 |
| customer-revenue | 15 | feature | B8 |
| kernel | 15 | feature | B0 (pilot) |
| content-collaboration | 14 | feature | B9 |
| frontend | 14 | feature | B10 |
| platform-horizontal | 14 | feature | B11 |
| supply-chain | 14 | feature | B12 |
| backend | 12 | feature | B13 |
| hr | 12 | feature | B14 |
| vertical | 12 | feature | B15 |
| layer0 | 11 | feature | B16 |
| dx | 6 | feature | B17 |
| egitim | 6 | doküman | B24 |
| meta | 4 | üst-bilgi | B25 |
| atomic | 2 | feature | B18 |
| genel | 2 | genel | B26 |
| (x-kırılım düğümleri) | — | alt-detay | B27 |

Not: x-kırılım düğümleri (app-*-x-stone/molecule/element/atom) yukarıdaki feature cluster'larının altına dağılmıştır; B27 bunları topluca ele alır.

---

## Kapanış

Bu plan, denetimde bulunan tüm eksikleri (içerik derinliği, ECA ruleset kataloğu, Surface/Workflow sözleşmeleri, panel görünürlüğü, shadcn) küme→faz→eylem→görev seti hiyerarşisinde, test-önce ve enterprise-grade kurallarla kapsar. Uygulama sırası: **Küme A → B → C → D → (E) → F**. Her faz kendi DoD'siyle kapanır; main'e her giriş insan onaylı PR ile olur; AI ajan yalnız öneri/draft üretir.

