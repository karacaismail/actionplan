# MRP OS — Rapor 1: ArcheType Katmanı (Üretim Merceği)

**Soru:** SaaS MRP OS (SAP PP / Odoo Manufacturing / Dynamics SCM sınıfı) geliştirmek için **ArcheType sözleşmesi yeterli mi?**
**Tarih:** 2026-07-01 · **Kaynak:** `src/schemas/archetype.ts`, `s-mrp`, `s-demand-planning`, `s-traceability`, `product`, `k-archetype-computation`, `k-archetype-fieldtypes` · **Mercekler:** UX, AI-First, yüksek-trafik.

---

## 0. Tek cümlelik cevap

> Hayır — bugünkü hâliyle yetmez, ama uzak da değil. ArcheType bir **kayıt tipini** (Fatura, Sipariş, Ürün) sınıf-lider modelliyor; fakat üretimin dört çekirdek nesnesi — **zaman-etkili reçete (effectivity-dated BOM), operasyon-kaynak-zaman-maliyet dörtlüsü (routing), lot/seri soyağacı (genealogy) ve kısıt-tabanlı çizelge (APS)** — "alan + kural + ilişki" kalıbına sığmıyor. Bunlar *graf*, *zaman-boyutu* ve *optimizasyon* ister; ArcheType sözleşmesinde üçünün de sözleşme yeri yok.

Terminoloji (ilk geçtiği yerde): **BOM** = ürün reçetesi/malzeme ağacı; **routing** = üretim rotası (hangi operasyon, hangi iş merkezinde, ne kadar sürede); **APS** = Advanced Planning & Scheduling, kapasite kısıtlı çizelgeleme; **effectivity-dating** = bir reçete/rotanın hangi tarih aralığında geçerli olduğu; **genealogy** = hangi hammadde lotu hangi mamul lotuna/müşteriye gitti izi.

---

## 1. Adil değerlendirme — MRP için neyi zaten karşılıyor

Haksızlık etmemek için: üretim tarafı boş değil.

`s-mrp` düğümü ("SAP PP, Odoo Manufacturing muadili; bağımlı talep + regeneratif plan") MRP ürününü *planlı ürün* olarak tanımlıyor. `s-demand-planning` (S&OP), `s-traceability`, `s-quality`, `s-workforce` (vardiya), `s-cmms` (bakım), `s-iot` de üretim etrafındaki ürünleri kapsıyor. Yani "üretim yok" demek yanlış olur.

Meta-model tarafında da iki güçlü kazanım var, ikisi de bu turda eklendi: `k-archetype-computation` **BOM-patlamasını** açıkça "hesap hattı" olarak işaretliyor (validationRule/semanticRule assertion; BOM/tax/bordro derivation); `k-archetype-fieldtypes` **measure/unit-of-measure** ve **attribute-set/EAV**'yi getiriyor — ikisi de MRP/PIM için zorunlu (birim dönüşümü olmadan MRP çalışmaz). Yani doğru yöne birkaç adım atılmış.

Sorun "üretim düşünülmemiş" değil; sorun ArcheType sözleşmesinin **üretime-özgü dört yapıyı taşıyacak parçasının olmaması** ve bunların app düzeyinde (s-mrp) tekil çözülmeye bırakılması — oysa BOM/routing/genealogy 16 üründen birçoğunun (MRP, PIM, QMS, maliyet, izlenebilirlik) ortak omurgasıdır.

---

## 2. Zayıflık nedenleri — kök sebep

### 2.1 Zaman-etkililik (effectivity/temporal) sözleşmede yok
`RelationSchema` ve `FieldSchema` zaman-boyutu taşımaz. Ama üretimde her şey tarihlidir: "bu reçete 01.09'dan itibaren geçerli", "bu revizyon şu seri numarasından sonra". `k-archetype-bayraklari` bitemporal *bayrağını* biliyor ama bu, **alan seviyesinde tek kaydın geçmişi** içindir; **ilişki/reçete seviyesinde geçerlilik penceresi** (effectivity) değil. Engineer-to-order ve otomotiv yedek parça için bu tek başına bloke edicidir.

### 2.2 BOM bir *graf*, ArcheType ise *kayıt* düşünüyor
BOM çok-seviyeli, phantom (görünmez ara montaj), alternatifli, versiyonlu bir **yönlü asiklik graf**tır. ArcheType `RelationSchema` düz kardinalite (1-N/N-N) + `onDelete` taşır; özyinelemeli graf, seviye-patlaması, döngü-tespiti, "aynı bileşen iki dalda" senaryosu birinci-sınıf değil. `k-archetype-computation` patlamayı *hesap* olarak işaretliyor ama patlamanın üzerinde çalıştığı **graf yapısının kendisi** (BOM-as-graph) sözleşmede yok — hesap motoru, olmayan bir veri yapısını gezmeye çalışır.

### 2.3 Routing = operasyon × kaynak × zaman × maliyet; bu dörtlü modellenmemiş
Bir rota adımı aynı anda: bir operasyondur, bir iş merkezine/makineye/operatöre bağlıdır, setup+run+queue+wait+move sürelerine sahiptir, ve işçilik+makine+enerji maliyeti üretir. ArcheType tek bir kaydı iyi tutar ama bu **dört-eksenli birleşik nesneyi** (operation-resource-time-cost) sözleşmesel olarak tanımlamaz. Bunu s-mrp içinde ad-hoc kurarsanız, kapasite planlama ve maliyet rollup'ı aynı veriyi iki kez modeller.

### 2.4 Lot/seri soyağacı bir *kenar-yoğun graf*, relation modeli buna dar
"Hangi hammadde lotu → hangi yarı-mamul → hangi mamul lotu → hangi müşteri sevkiyatı" sorusu tek-tık cevaplanmalı (gıda/kimya/otomotiv/medikal yasal zorunluluk). Bu, milyonlarca kenarlı bir **genealogy grafı**dır; `RelationSchema`'nın düz FK'leriyle kurulunca sorgu (recursive CTE) her seferinde elle yazılır ve ölçekte çöker.

### 2.5 APS bir *optimizasyon*, `derivation` ise *deterministik hesap*
`k-archetype-computation` saf, yan-etkisiz, deterministik ifade grafiği tanımlıyor (fiyat = f(girdiler)). Bu MRP net-ihtiyaç hesabı için doğru. Ama **APS/finite-capacity çizelgeleme** bir *kısıt-tatmin/optimizasyon* problemidir (darboğaz, alternatif rota, öncelik, teslim-tarihi vs. kapasite). Bu, "türetilmiş alan" değil; bir *solver*'dır. ArcheType/computation bunu ifade edemez — ayrı bir motor primitifi gerekir (bkz. Kernel raporu).

### 2.6 Maliyet değerleme (costing) yöntem-bağımlı ve zamanlıdır
Standard/actual/moving-average/FIFO maliyet, operasyon-bazlı rollup, varyans analizi — bunlar hem *hesap* hem *muhasebe-politikası* hem *dönemsel* nesnelerdir. `derivation` hesabı yapar ama "hangi değerleme yöntemi, hangi dönem, hangi varyans defterine" kararı bir **costing-policy sözleşmesi** ister; şu an yok.

---

## 3. Gap analizi — önceliklendirilmiş

Sade özet: eksiklerin çoğu "yeni alan tipi" değil, **ArcheType'a komşu yeni yan-sözleşmeler** (BOM-graph, Routing, Genealogy, Effectivity, Costing-policy) — Surface/Workflow'un ayrı versiyonlandığı gibi.

| # | Boşluk | Öncelik | Bloke ettiği | Neden ArcheType-komşusu |
|---|---|---|---|---|
| 1 | Effectivity/temporal ilişki (tarih-geçerli reçete/rota) | P0 | ETO, otomotiv, revizyon yönetimi | Zaman-penceresi ilişki seviyesinde, tek-kayıt bitemporal'da değil |
| 2 | BOM-as-graph sözleşmesi (çok-seviye/phantom/alt/versiyon) | P0 | MRP, maliyet, planlama | Graf yapısı + döngü/patlama; düz relation yetmez |
| 3 | Routing (operation×resource×time×cost) | P0 | MES, kapasite, maliyet | Dört-eksenli birleşik nesne |
| 4 | Lot/seri genealogy grafı | P0 | İzlenebilirlik (yasal), geri-çağırma | Kenar-yoğun graf, ölçekli sorgu |
| 5 | Costing-policy sözleşmesi (yöntem+dönem+varyans) | P1 | Maliyet, finans kapanışı | Politika + dönem + hesap birleşimi |
| 6 | Konfigürasyon/CTO kural sözleşmesi (varyant kuralı) | P1 | Configure-to-order, otomotiv | Ürün-konfigüratör mantığı |
| 7 | Alternatif/eşdeğer malzeme + tedarikçi-ürün eşleme | P2 | Tedarik esnekliği | Çok-hedefli ikame ilişkisi |

---

## 4. Önerilen sözleşme/şema tasarımı (mimari tarif — kod değil)

Sizin kurallarınızla test-önce: her yeni yan-sözleşme için önce conformance testi/gate, sonra veri modeli.

### 4.1 Effectivity sözleşmesi (ilişkiye zaman penceresi)
`RelationSchema`'ya opsiyonel `effectivity: { validFrom, validTo, revision, unitFrom, unitTo }`. Böylece bir BOM-line "şu tarihten / şu seri numarasından itibaren" geçerli olur. **Test-önce:** "belirli tarih + seri için doğru reçete versiyonu çözülüyor mu" golden-testi.

### 4.2 BOM-graph yan-sözleşmesi
ArcheType'tan ayrı versiyonlanan bir **Bom** sözleşmesi: `nodes[]` (bileşen + miktar + fire% + phantom bayrağı + alternatif grup), `edges[]` (parent→child + effectivity), `explosionPolicy` (regenerative/net-change), `cycleGuard`. `k-archetype-computation` bu grafı *tüketir* (patlama = graf gezme + miktar toplama). **Yüksek-trafik notu:** patlama sonucu `scale-projections`'a materialize edilir (her planlamada yeniden gezme pahalı).

### 4.3 Routing yan-sözleşmesi
`operations[]` (sıra + operasyon tipi + iş-merkezi ref + setup/run/queue/wait/move + paralel/alternatif rota + kalite/bakım kontrol noktası + operasyon-bazlı malzeme tüketimi + maliyet öğeleri). Kapasite planlama ve maliyet rollup bu tek sözleşmeyi okur — çift-modelleme biter.

### 4.4 Genealogy grafı → Kernel primitifine devret
Lot/seri soyağacı ArcheType-komşusu değil, **kernel-seviyesi graf primitifidir** (birçok ürün ister); Kernel raporu §4'e taşındı (`k-genealogy-graph`). ArcheType tarafı yalnız "bu alan lot/seri-izlenir" bayrağını taşır.

### 4.5 Costing-policy sözleşmesi
`method` (standard/actual/moving-avg/FIFO), `period`, `rollupBasis` (BOM/routing), `varianceAccount`, `revaluationTrigger`. `derivation` hesabı yapar; policy *hangi hesap, hangi dönem, nereye* kararını verir.

---

## 5. Üç mercek — MRP ArcheType özelinde

### 5.1 AI-First
İyi zemin: `aiPolicy` + `ADMIN_FLOW` var. MRP'ye özel fırsat: **AI BOM/routing taslağı önerir** (ChatGPT'nin "BOM Normalizer Agent"ı), ama **üretim/maliyet kaydını asla doğrudan yazmaz** — sizin invariant'ınız (AI önerir, insan onaylar, motor uygular) burada hayati. Effectivity/costing gibi *geçmiş-veri-kutsal* alanlarda AI yalnız *yeni dönem/yeni revizyon* önerebilir; geçmiş üretim/maliyet transaction'ı immutable kalmalı (ChatGPT de bunu vurguladı, doğru).

### 5.2 Yüksek-trafik
BOM patlaması ve genealogy sorgusu ölçekte en pahalı iki iştir. Tasarım kararı: patlama sonucu ve soyağacı **materialize** (CQRS `scale-projections`) + `k-archetype-computation`'ın "yaz-anı vs sorgu-anı" beyanı. Aksi halde her MRP-run tüm grafı yeniden gezer (regeneratif plan = O(ürün×seviye)).

### 5.3 UX
ArcheType'ın MRP-UX'e katkısı `typedActions` → afordans (üretim emri "serbest bırak", "kapat" butonları risk-seviyeli). Eksik: alan `uiHints` (birim gösterimi, lot-seçici, BOM-ağaç editörü) — Surface raporu ile bağlı.

---

## 6. Unknown-unknowns — üretim risk keşfi

- **Reçete-rota effectivity çakışması:** reçete v2 01.09'da, rota v3 15.09'da geçerliyse, 05.09 üretim emri hangi kombinasyonu kullanır? (Cross-effectivity çözümü tanımsız.)
- **Phantom BOM + maliyet:** görünmez ara montaj maliyeti nereye rollup olur? (Çift-sayım riski.)
- **Retroaktif BOM değişimi:** açık üretim emirleri varken reçete değişirse, WIP'teki emirler eski mi yeni mi reçeteyle kapanır? (Enterprise'da geçmiş transaction kutsal — ChatGPT vurgusu.)
- **Genealogy geri-çağırma patlaması:** tek hammadde lotu 10.000 mamule dağıldıysa, geri-çağırma sorgusu ne kadar sürer? (Ölçek testi yok.)
- **Birim dönüşüm hassasiyeti:** kg↔adet↔palet zincirinde yuvarlama birikimi fire hesabını bozar mı? (`measure` tipi eklendi ama dönüşüm-hassasiyeti test edilmedi.)
- **Alternatif malzeme + kalite onayı:** ikame malzeme kalite-onaysızsa APS onu seçmemeli — kısıt olarak modellenmiş mi?

---

## 7. Kilitlenecek ADR taslakları

- **ADR-M-A1 — Effectivity modeli.** İlişkiye zaman/seri penceresi eklenir mi? Öneri: evet, `RelationSchema.effectivity`.
- **ADR-M-A2 — BOM-graph yan-sözleşmesi.** BOM ArcheType alanı mı, ayrı graf sözleşmesi mi? Öneri: ayrı (Surface/Workflow gibi), computation tüketir.
- **ADR-M-A3 — Routing sözleşmesi.** operation×resource×time×cost birleşik nesne. Öneri: ayrı yan-sözleşme.
- **ADR-M-A4 — Costing-policy.** Değerleme yöntemi + dönem + varyans sözleşmesi. Öneri: policy nesnesi + derivation ayrımı.
- **ADR-M-A5 — Geçmiş transaction değişmezliği.** Effectivity/costing değişimi yalnız yeni dönem/revizyon; WIP koruması. Öneri: immutable + expand-contract.

---

## 8. Öncelikli aksiyonlar (MRP ArcheType)

1. **ADR-M-A1..A5'i kilitle** (effectivity + BOM-graph + routing en kritik üçlü).
2. **Tek dikey dilim:** "2-seviyeli BOM + routing + net-ihtiyaç + maliyet rollup" — effectivity, BOM-graph, routing, computation'ı birlikte kanıtlar (geçen turki `build-ilk-dikey-dilim` Money→OrderOps'un üretim karşılığı).
3. **BOM-graph + Routing yan-sözleşmelerini** `s-mrp`'den çıkarıp ArcheType-komşusu yap (yeniden-kullanım: PIM/QMS/maliyet de tüketir).
4. **Genealogy'yi kernel primitifine** devret (Kernel raporu).
5. **measure dönüşüm-hassasiyeti** ve **BOM döngü-tespiti** için conformance testleri yaz.

---

*Bağlı: MRP Kernel (`mrp-kernel`) — APS/edge/KPI/sequence/calendar/genealogy primitifleri + çerçeve eleştirisi; MRP Surface (`mrp-surface`) — shop-floor/Gantt/OEE yüzeyleri.*
