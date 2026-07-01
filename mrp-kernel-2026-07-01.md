# MRP OS — Rapor 2: Kernel Katmanı + Geliştirme Çerçevesi (Üretim Merceği)

**Soru:** SaaS MRP OS geliştirmek için **kernel yeterli mi?** Ve daha derini: **kernel geliştirme süreci/çerçevesi** bir MRP OS üretebilir mi?
**Tarih:** 2026-07-01 · **Kaynak:** `k-*`, `scale-*`, `s-mrp`, `s-iot`, `scale-timeseries/streaming`, `k-agent-runtime`, meta-model (`task.ts` — 7-seviye WBS, 14 boyut, generator hattı) · **Mercekler:** yüksek-trafik (ağır), AI-First (ağır), UX (düşük).

---

## 0. Tek cümlelik cevap

> Kernel **içerik olarak** MRP OS'a yetmez (altı çekirdek üretim primitifi yok: APS-solver, ISA-95 edge, KPI-registry, sequence, üretim-takvimi/kapasite, genealogy-graf); ama daha kritik olan şu: **kernel geliştirme çerçevesi MRP OS üretmek için yapısal olarak yanlış hedeflenmiş** — 7-seviye WBS + 14-boyut-düz-yazı + generator hattı, "SaaS CRUD uygulaması planlamak" için optimize; oysa MRP'nin kalbi *algoritma, fizik, sayısal doğruluk ve saha entegrasyonu*dır ve çerçevede bunların ne sözleşme yeri ne doğrulama kapısı var.

İki ayrı yetersizlik var, ikisini ayrı ele alıyorum: **(A) içerik/primitif** (§1-2) ve **(B) çerçeve/süreç** (§3). B, sizin "farkettim" dediğiniz asıl sorun.

---

## 1. Adil değerlendirme — MRP için kernel'de zaten ne var

`scale-timeseries` (IoT/TimescaleDB, saniyede 100K sensör), `scale-streaming` (Kafka, 1M olay/sn), `s-iot` (sensör/eşik-alarm/enerji), `k-bus` (olay omurgası) — bunlar MES/IoT tarafının *veri toplama* katmanını karşılar. `k-agent-runtime` AI-planner için doğru zemin. Bu turda eklenen `k-archetype-computation` (BOM-patlaması hesap hattı), `k-archetype-fieldtypes` (measure/UoM, EAV), `scale-invariant` (idempotency zorunlu — çift-üretim-emri önler) MRP'ye doğrudan hizmet ediyor.

Yani kernel *veri + olay + hesap-hattı + AI-runtime* tarafında MRP'ye hazırlanıyor. Eksik olan, üretimin **fiziksel ve algoritmik** çekirdeği.

---

## 2. İçerik zayıflığı — eksik üretim primitifleri (hepsi tarama ile doğrulandı: YOK)

### 2.1 APS / finite-capacity solver (scale-seviyesi)
MRP net-ihtiyaç *deterministik hesap*tır (computation karşılar). Ama **APS/finite-capacity çizelgeleme** bir *kısıt-optimizasyon* problemidir: iş merkezi kapasitesi, alternatif rota, öncelik, teslim-tarihi, darboğaz. Bu bir *solver* (OR-Tools sınıfı) ister — `k-archetype-computation`'ın saf-deterministik ifade grafiği bunu ifade edemez. **Kernel'de solver primitifi yok** → sonlu kapasite planlama, what-if senaryo, darboğaz tespiti imkânsız. Bu, MRP II/APS iddiasının çekirdeği.

### 2.2 ISA-95 edge gateway (OPC-UA / MQTT / PLC) + offline-first
Terminoloji: **ISA-95** = kurumsal (ERP) ↔ üretim-kontrol (PLC/SCADA) katman standardı; **OPC-UA/MQTT** = makine-veri protokolleri; **edge** = fabrikadaki yerel düğüm. Kernel'de bu katman **tamamen yok**. FastAPI backend doğrudan PLC konuşmamalı (ChatGPT haklı: ISA-95 Level 3 ile Level 1/2 ayrılır); arada bir **edge connector** olmalı: yerel veri yakalama, OPC-UA/MQTT köprüsü, internet kesilince offline üretim kaydı, sonra çakışma-çözümlü senkron. Bu primitif olmadan MES/shop-floor gerçek fabrikada çalışmaz.

### 2.3 KPI registry (ISO 22400) — formül-tabanlı
Terminoloji: **OEE** = Overall Equipment Effectiveness (availability×performance×quality); **ISO 22400** = üretim KPI'larını (formül, birim, zaman-davranışı) tanımlayan standart. Kernel'de KPI **rastgele dashboard** olarak değil, **versiyonlu, formül-tabanlı, sektör-bağımsız registry** olarak olmalı (aynı OEE formülü her yerde aynı hesaplansın). Şu an yok — her ürün kendi KPI'sını yeniden tanımlar (drift riski).

### 2.4 Sequence / gap-free numaralandırma
Üretim emri no, iş emri no, lot no — **concurrent-safe, boşluksuz (gap-free)** üretilmeli (yasal belge + izlenebilirlik). Önceki kernel raporunda flag'ledim, hâlâ yok. Bu bir kernel primitifi (tüm belgeler ister).

### 2.5 Üretim takvimi + iş-merkezi kapasitesi + business-time
Vardiya, tatil, planlı duruş, iş-merkezi kapasite takvimi — APS ve teslim-tarihi hesabının girdisi. `s-workforce` vardiyayı *ürün* olarak biliyor ama **kernel-seviyesi takvim/kapasite/business-time primitifi** yok. "3 iş günü sonra" hesabı bu primitifi ister.

### 2.6 Genealogy graph (lot/seri soyağacı)
ArcheType raporundan devir: milyonlarca kenarlı lot/seri soyağacı bir **graf primitifi**dir (izlenebilirlik yasal, geri-çağırma kritik). `RelationSchema` düz FK'leriyle ölçekte çöker; kernel-seviyesi graf-sorgu primitifi gerekir.

---

## 3. Çerçeve/süreç zayıflığı — asıl mesele (siz "farkettim" dediniz)

Bu bölüm, "kernel'de ne eksik" değil, **"kerneli üreten çerçeve MRP OS üretebilir mi"** sorusudur. Cevap: bugünkü hâliyle **yapısal olarak yetersiz**, çünkü çerçeve yanlış şeyi optimize ediyor.

### 3.1 Çerçeve "planlama/dokümantasyon" üretiyor, "çalışan motor" değil
Meta-sistem her düğümü **14 boyut düz-yazı + prompt** olarak modelliyor (featureDefs, security, wcag, mobileApps...). Bu, bir **SaaS CRUD uygulamasını planlamak** için mükemmel. Ama MRP'nin kalbi CRUD değil: *MRP net-ihtiyaç algoritması*, *BOM patlaması*, *APS çizelgeleme*, *OEE formülü*, *maliyet rollup* — bunlar **algoritma + sayısal doğruluk**tır. 14 boyutun hiçbirinde "referans algoritma", "test vektörü (girdi→beklenen çıktı)", "korunum invariant'ı (malzeme dengesi)", "sayısal hassasiyet/yuvarlama", "fiziksel/edge entegrasyon" yok. Yani çerçeve, MRP'nin *zor kısmını* ne tanımlıyor ne doğruluyor.

### 3.2 "Bitti" tanımı yanlış hedefte
Bir düğümün DoD'si (Definition of Done) = 14 boyut dolu + conformance/lint/schema kapıları yeşil. Ama bu, **"MRP hesabı doğru" demek değil**. Bir `s-mrp` düğümü tüm boyutları dolu, tüm kapıları yeşil olabilir — ve arkasında **tek satır çalışan MRP matematiği olmayabilir**. Çerçeve "içerik tamlığı"nı ölçüyor (avg 2.81, 0 zayıf), "algoritmik doğruluğu" değil. MRP'de bir sayı yanlışsa (yuvarlama, birim, net-ihtiyaz) ürün çöp; çerçevenin bunu yakalayacak kapısı yok.

### 3.3 Generator hattı jenerik düz-yazı üretir; motor üretemez
`fill-dimensions` cluster/seviye-duyarlı **şablon prose** üretir (geçen tur bunu gördük: jenerik içerik contentQuality kapısını kırdı). Bu, bir "iş tarifi" için yeterli ama bir **APS solver**'ı ya da **OEE formül registry**'sini üretemez. `provenance` (template/swarm/human) *yazının kim yazdığını* izler; *algoritmanın doğrulandığını* değil. Yani hat, dokümanı ölçekler, matematiği değil.

### 3.4 ISA-95 katmanlaması çerçevede yok
MRP OS'un mimari omurgası ISA-95'tir (Level 4 ERP / Level 3 MES / Level 2 SCADA / Level 1 PLC / Level 0 fiziksel). Çerçevenin 7-seviye doğa-metaforu (dağ→atom) **iş-kırılımı** hiyerarşisidir, **ISA-95 kontrol-katmanı** hiyerarşisi değil. Bir düğüm "hangi ISA-95 seviyesinde çalışır, hangi seviyeyle konuşur" beyan edemez → edge/gerçek-zaman/güvenlik sınırları modellenemez.

### 3.5 Çerçeve fiziksel dünyayı ve gerçek-zamanı modellemez
SaaS CRUD'da "kayıt" soyutlaması yeter. Üretimde makine durur, sensör yanlış okur, internet kesilir, operatör yanlış lot okutur. Çerçevede **fiziksel güvenilmezlik** (edge offline, sensör gürültüsü, çakışma-çözümü) ve **gerçek-zaman kısıtı** (andon 2 sn içinde) birinci-sınıf değil. 14 boyutun "deployment"ı Docker/K8s der; OPC-UA/edge/offline demez.

**Sonuç (çerçeve):** Mevcut çerçeveyle 445 değil 4450 düğüm de üretseniz, sonuç *çok iyi belgelenmiş bir MRP planı* olur; *çalışan bir MRP OS* olmaz — çünkü çerçeve, üretimin zor çekirdeğini (algoritma+fizik+sayısal doğruluk+edge) ne yakalıyor ne doğruluyor.

---

## 4. Önerilen tasarım — içerik + çerçeve

### 4.1 Eksik primitifleri ekle (bu turda düğüm olarak ekleniyor)
`scale-aps` (finite-capacity solver), `k-edge-gateway` (ISA-95/OPC-UA/MQTT/offline), `k-kpi-registry` (ISO 22400 formül), `k-sequence` (gap-free), `k-calendar-capacity` (takvim+kapasite+business-time), `k-genealogy-graph` (lot/seri soyağacı).

### 4.2 Çerçeveyi "engine node" kavramıyla genişlet (asıl düzeltme)
İki düğüm sınıfı ayır: **CRUD-node** (mevcut 14 boyut yeter) ve **Engine-node** (MRP/APS/OEE/costing). Engine-node için **yeni zorunlu boyutlar**:
- **referenceAlgorithm**: hangi standart/algoritma (MRP II regeneratif, DDMRP, ISO 22400 OEE formülü).
- **testVectors**: girdi→beklenen-çıktı golden vektörleri (DoD = bunları geçmek).
- **invariants**: korunum kuralları (giren malzeme = çıkan + fire + stok; kapasite ≤ mevcut).
- **numericPolicy**: birim, hassasiyet, yuvarlama (banker's), para/measure.
- **isaLevel**: ISA-95 katmanı + hangi katmanla konuşur.
**Kritik:** engine-node DoD'si "14 boyut dolu" değil, "**test vektörleri yeşil + invariant'lar korunuyor**" olmalı. Bu, çerçeveyi "doküman üretir"den "doğrulanmış motor üretir"e çevirir.

### 4.3 ISA-95 eksenini WBS'ye ekle
7-seviye iş-kırılımına **dik** bir `isaLevel` etiketi (0-4). Böylece "bu düğüm Level 3 MES, edge ile Level 2'ye bağlanır" beyan edilir; güvenlik/gerçek-zaman/offline sınırları buradan türer.

---

## 5. Üç mercek — MRP Kernel özelinde

### 5.1 Yüksek-trafik (en ağır)
Shop-floor + IoT üretim sistemin en yüksek-yazımlı yeridir (makine olayı, barkod, sensör). `scale-timeseries`/`streaming`/`counter` zemini var. Eksik: **edge'de yerel tampon + offline kuyruk + çakışma-çözümlü senkron** (`k-edge-gateway`) ve **APS-run'ın p95 süresi** (Dynamics'in "MRP run hızlı olmalı" vurgusu). APS bir batch-compute; kaç üründe kaç saniyede biter — SLO tanımlı değil.

### 5.2 AI-First
ChatGPT'nin ajanları (Production Planner, MRP Exception, Cost Variance, Maintenance Prediction) `k-agent-runtime`'a oturur. **Kritik güvenlik sınırı:** AI plan/öneri üretir; "üretim emrini serbest bırak", "tedarikçi değiştir", "maliyet standardını güncelle" gibi **kritik üretim komutlarını doğrudan yapmaz** — approval-workflow + `agentPolicy` (autonomy:suggest/draft, forbiddenActions) uygular. Bu, sizin invariant'ınızla ve ChatGPT'nin "AI önerir, insan onaylar, yetki motoru uygular" kuralıyla birebir. Ek gap: AI-planner'ın önerisi **simülasyon** (what-if) ister — bu da APS-solver'a bağlı (yoksa AI "hayal eder", doğrulayamaz).

### 5.3 UX (düşük)
Kernel'in MRP-UX teması `k-control-planes`: shop-floor operatörü ayrı bir "kitle/düzlem"dir (read-mostly değil, hızlı-yazım; eldivenli, barkodlu). Bu, dördüncü düzlemin bir alt-türü olarak tanınmalı — Surface raporunda işleniyor.

---

## 6. Unknown-unknowns — kernel/çerçeve

- **APS determinizmi:** solver aynı girdiye aynı planı mı verir? (Non-deterministik solver, audit/tekrarlanabilirlik sorunu.)
- **Edge güven sınırı:** offline üretilen kayıt online olunca `scale-invariant` idempotency ile çakışırsa hangi kazanır? Sensör sahte veri gönderirse?
- **KPI formül sürüm çakışması:** OEE tanımı değişince geçmiş KPI'lar yeniden mi hesaplanır? (Bitemporal KPI.)
- **Çerçeve öz-değerlendirme yanılgısı:** çerçeve "0 zayıf düğüm" diyor ama bu içerik-prose skoru; MRP doğruluğu ölçülmüyor — **çerçeve kendi yeterliliğini yanlış metrikle ölçüyor** (en tehlikeli unknown).
- **Regeneratif vs net-change MRP:** `s-mrp` "regeneratif" diyor; büyük veride her run tam-patlama pahalı — net-change'e ne zaman geçilir, SLO nedir?
- **Sequence + multi-region:** gap-free numara iki bölgede aynı anda üretilirse boşluk/çakışma? (CAP tuzağı.)

---

## 7. Kilitlenecek ADR taslakları

- **ADR-M-K1 — APS solver primitifi.** `scale-aps` (finite-capacity). Öneri: ayrı batch-compute primitifi, computation'dan bağımsız.
- **ADR-M-K2 — Edge/ISA-95 gateway.** `k-edge-gateway` (OPC-UA/MQTT/offline). Öneri: primitif olarak ekle; FastAPI PLC konuşmaz.
- **ADR-M-K3 — KPI registry.** ISO 22400 formül-registry. Öneri: versiyonlu, sektör-bağımsız.
- **ADR-M-K4 — Sequence.** Gap-free numaralandırma. Öneri: kernel primitifi.
- **ADR-M-K5 — Engine-node çerçeve genişletmesi (asıl karar).** Engine-node için testVectors/invariants/numericPolicy/isaLevel zorunlu; DoD = vektör-yeşil. Öneri: evet — çerçevenin MRP'yi üretebilmesi buna bağlı.
- **ADR-M-K6 — ISA-95 ekseni.** WBS'ye dik isaLevel etiketi. Öneri: evet.

---

## 8. Öncelikli aksiyonlar (MRP Kernel + Çerçeve)

1. **ADR-M-K5'i kilitle (çerçeve)** — en yüksek getiri: "engine-node + test-vektör DoD" olmadan diğer her şey doküman kalır.
2. **6 primitifi ekle** (bu turda düğüm olarak yapılıyor): `scale-aps`, `k-edge-gateway`, `k-kpi-registry`, `k-sequence`, `k-calendar-capacity`, `k-genealogy-graph`.
3. **ISA-95 eksenini** meta-modele ekle (ADR-M-K6).
4. **Bir engine-node'u kanıtla:** MRP net-ihtiyaç hesabını referans test-vektörleriyle (SAP/Odoo örnek verisi) çalışır göster — çerçevenin motor üretebildiğini ispatla.
5. **APS SLO'su + edge offline-senkron** conformance testi.

---

*Bağlı: MRP ArcheType (`mrp-archetype`) — BOM/routing/effectivity sözleşmeleri; MRP Surface (`mrp-surface`) — shop-floor/Gantt/OEE; Kernel-JSON talimatı (`mrp-kernel-json-guncelleme`) — hangi düğüm nasıl güncellenir.*
