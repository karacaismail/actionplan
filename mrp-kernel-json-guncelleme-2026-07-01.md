# Kernel JSON'ları — MRP OS Gap, Unknown-Unknowns ve Güncelleme Talimatı

**Amaç:** Kernel WBS düğümlerinin (`src/data/generated/nodes/k-*.json`, `scale-*.json`) bir MRP OS'u destekleyip desteklemediğini denetlemek; eksikleri kapatacak düğümleri **doğru üretim hattıyla** (testler yeşil kalacak şekilde) nasıl ekleyeceğini adım-adım vermek.
**Tarih:** 2026-07-01 · **Bağlam:** `mrp-kernel` raporu §2 (içerik) ve §3 (çerçeve) ile birlikte okunmalı.

---

## 1. Kernel JSON'ları — MRP gap analizi

Sade özet: kernel JSON'ları *veri/olay/hesap-hattı/AI-runtime* tarafında MRP'ye hazır; **üretimin fiziksel ve algoritmik çekirdeğini** taşıyan düğümler yok. Aşağıdaki tablo tarama ile doğrulandı (anahtar kelime → düğüm).

| MRP çekirdek yeteneği | Kernel JSON'da karşılığı | Durum |
|---|---|---|
| Bağımlı talep / net-ihtiyaç hesabı | `k-archetype-computation` (BOM-patlaması hesap hattı) | Kısmi — hesap-hattı var, referans-algoritma+test-vektörü yok |
| Birim dönüşümü (kg/adet/palet) | `k-archetype-fieldtypes` (measure/UoM) | Var (bu turda eklendi) |
| Çift-üretim-emri önleme | `scale-invariant` (idempotency zorunlu) | Var (bu turda eklendi) |
| IoT/sensör veri toplama | `scale-timeseries`, `s-iot` | Var |
| Yüksek-hacim olay | `scale-streaming`, `k-bus` | Var |
| **APS / finite-capacity çizelgeleme** | — | **YOK** (P0) |
| **ISA-95 edge / OPC-UA / MQTT / offline** | — | **YOK** (P0) |
| **KPI registry (ISO 22400 / OEE)** | — | **YOK** (P0) |
| **Sequence / gap-free numaralandırma** | — | **YOK** (P0) |
| **Üretim takvimi + iş-merkezi kapasitesi** | — | **YOK** (P1) |
| **Lot/seri genealogy grafı** | `s-traceability` (ürün) | **Primitif YOK** (P0) |

**Sonuç:** 6 kernel-seviyesi primitif düğümü eksik. Bunlar app değil, birçok ürünün (MRP, QMS, maliyet, izlenebilirlik, bakım) tükettiği çekirdek — bu turda ekleniyor.

---

## 2. Kernel JSON'ları — unknown-unknowns

Çerçevenin henüz sormadığı, kernel JSON'larına özgü riskler:

- **"Dolu ≠ doğru" yanılgısı:** Bir kernel düğümünün 14 boyutu dolu + kapıları yeşil olması, arkasındaki *motorun çalıştığını* göstermez. Kernel JSON'ları **niyet** taşır, **doğrulanmış algoritma** taşımaz. (En tehlikeli unknown — çerçeve kendi yeterliliğini yanlış metrikle ölçüyor; `mrp-kernel` §3.2.)
- **ISA-95 katmanı beyansız:** Hiçbir kernel düğümü "ben Level 3 MES'im, edge ile Level 2'ye bağlanırım" demiyor. Güvenlik/gerçek-zaman/offline sınırları bu beyan olmadan türetilemez.
- **Primitif-app sınırı bulanık:** `s-iot` (app) ile `scale-timeseries` (primitif) ayrımı net; ama APS/KPI/genealogy için app mi primitif mi kararı verilmemiş → her ürün kendi çözümünü yazar (drift).
- **Generator hattı motor üretemez:** `fill-dimensions` jenerik prose üretir; APS solver'ı veya OEE formül-registry'sini üretemez. Kernel düğümü eklemek ≠ motor eklemek.
- **Sequence + multi-region CAP:** gap-free numara iki bölgede eşzamanlı üretilirse boşluk/çakışma; kernel bu kararı vermemiş.
- **Bağımlılık yönü denetimi:** yeni MRP primitifleri `k-schema`/`scale-*`'a bağlanır; ters bağımlılık (kernel→app) sızarsa katman ihlali — `check-dependency-policy` bunu yakalıyor mu, MRP düğümlerinde test edilmeli.

---

## 3. Güncelleme talimatı — kernel JSON'ları nasıl güvenle güncellenir

Bu talimat, geçen turda kanıtlanan ve **tüm kapıları geçen** hattı verir. Aktör açıklığı: adımları *geliştirici/AI* uygular; *generator'lar* boilerplate doldurur; *CI/testler* doğrular; *insan* onaylar.

### 3.1 Düğüm eklemenin zorunlu kuralları (yoksa testler kırılır)
Kernel düğümü JSON'u şu kısıtlara uymalı (hepsi CI-bloklayıcı):
1. **14 boyut anahtarı + 7 faz anahtarı** her düğümde bulunmalı (`dataIntegrity.test.ts`, `schema.test.ts`). Boyutlar dolu olmak zorunda değil; skeleton olabilir.
2. **Dolu boyutlar bespoke olmalı** (`contentQuality.test.ts`): (a) 18 yasak şablon-imzasından hiçbirini içermez; (b) 5+ düğümde birebir tekrar etmez; (c) her dolu boyutta ≥1 "sınır-dışı" (sayfaya-özel) madde; (d) 2-5 madde. Zorunlu güvenlik-sınır satırları ("AI app/module...", "ArcheType taslağı...") muaftır — tekrar edilebilir.
3. **AI-deny ECA + agentPolicy** her düğümde olmalı (`engine.test.ts`) — `gen-rules.mjs` bunu ekler.
4. **owner geçerli takım** (platform-ekibi/katalog-ekibi/... — `check-data-quality`), **dependsOn/blocks/related yalnız var olan id'lere** işaret etmeli (dangling yasak), **döngü yasak**.
5. **parentId geçerli app** (kernel→`app-kernel` veya `app-layer0`; scale→`app-scale`).

### 3.2 Hat (sırayla çalıştır)
```
1) Minimal düğüm yaz: dimensions:{} boş; 5 dolu (bespoke) + 9 skeleton olacak şekilde
   featureDefs/security/eca/aiAgents/integration'ı elle doldur; diğer 9 skeleton.
   7 faz skeleton (pending). owner + parent + dependsOn (var olan id) ayarla.
2) node tools/gen-rules.mjs      → her düğüme AI-deny ECA + agentPolicy yazar (boyutlara dokunmaz)
3) node tools/gen-rollback.mjs   → eksik rollback'i doldurur
4) node tools/reindex.mjs        → wbsCode/navigation/meta/nodes.json'u yeniden kurar
5) Doğrula (hepsi yeşil olmalı):
   - npx vitest run --config vitest.content.config.ts   (contentQuality)
   - npx vitest run tests/engine.test.ts tests/dataIntegrity.test.ts tests/schema.test.ts
   - node tools/agents/check-data-quality.mjs           (qa:data)
   - npx tsc --noEmit                                    (typecheck)
```
Not: `fill-dimensions.mjs` **çalıştırılmaz** eğer boyutları elle doldurduysan (o, yalnız TÜM boyutları skeleton olan düğümleri jenerik prose ile doldurur ve o prose contentQuality kapısını kırar). Elle bespoke doldur, `fill-dimensions`'ı atla.

### 3.3 Kalıcılık uyarısı (kritik)
`ingest` kaynağı `../projector/content-source` (bu repoya kardeş, üst-korpus). Düğümü yalnız `generated/nodes/`'a eklersen `reindex` bunu destekler; ama ileride korpus mevcutken `npm run gen` (ingest) çalışırsa senkron riski olur. **Kalıcılık için aynı düğümü `projector/content-source`'a da yansıt.**

### 3.4 Çerçeve düzeltmesi (asıl talimat — sadece düğüm eklemek yetmez)
`mrp-kernel` §3-4 gereği: MRP motorları için **engine-node** kavramı eklenmeli. Kernel JSON şemasına (ileride `task.ts`) opsiyonel alanlar:
- `engineSpec: { referenceAlgorithm, testVectors[], invariants[], numericPolicy, isaLevel }`
- Engine-node **DoD'si** = "test-vektörleri yeşil + invariant korunuyor" (14-boyut-dolu değil).
Bu, ADR-M-K5/K6 ile kilitlenir. Bu düzeltme olmadan eklenen MRP düğümleri de "doküman" seviyesinde kalır.

---

## 4. Bu turda eklenen 6 MRP primitif düğümü

| id | seviye | parent | ne |
|---|---|---|---|
| `scale-aps` | stone | app-scale | Finite-capacity/kısıt-tabanlı çizelgeleme solver'ı (batch-compute) |
| `k-edge-gateway` | module | app-kernel | ISA-95 edge: OPC-UA/MQTT/PLC köprüsü + offline-first + çakışma-çözümlü senkron |
| `k-kpi-registry` | module | app-kernel | ISO 22400 formül-tabanlı, versiyonlu KPI/OEE registry |
| `k-sequence` | module | app-layer0 | Concurrent-safe, gap-free numaralandırma (üretim emri/lot no) |
| `k-calendar-capacity` | module | app-kernel | Üretim takvimi + iş-merkezi kapasitesi + business-time |
| `k-genealogy-graph` | module | app-layer0 | Lot/seri soyağacı graf primitifi (izlenebilirlik/geri-çağırma) |

Hepsi §3.2 hattıyla eklendi ve tüm kapılardan geçti. Her biri `engineSpec` gerektiren **engine-node adayıdır**; ADR-M-K5 kilitlenince test-vektörleriyle donatılmalı.

---

## 5. Önerilen sıra

1. **ADR-M-K5/K6'yı kilitle** (engine-node + isaLevel) — kernel JSON'larının "doküman"dan "doğrulanmış motor"a geçişi buna bağlı.
2. **6 primitifi** engine-node'a terfi et (test-vektörü + invariant ekle): önce `scale-aps` ve `k-sequence` (en somut doğrulanabilir).
3. **ISA-95 eksenini** meta-modele ekle.
4. **`projector/content-source` senkronu** yap (kalıcılık).
5. Bir engine-node'u (MRP net-ihtiyaç) referans veriyle çalışır kanıtla.
