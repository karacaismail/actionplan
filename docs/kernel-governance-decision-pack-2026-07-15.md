# Kernel Governance Decision Pack

Tarih: 2026-07-15  
Durum: DIRECTIVE-ONLY; runtime NO-GO  
Yetki zinciri: Codex → PM → uzman ajanlar → Claude workers/slaves

## Kısa Durum

Kernel hazır değildir. Actionplan içinde sözleşme, WBS ve kalite kapısı çalışması
yapılabilir; platform runtime, SDK-ready ve app-buildable iddiaları için gerçek kod,
veritabanı, PR, CI ve deploy kanıtı yoktur. Nihai karar Codex'tedir. PM ardıl
koordinatördür; mimari karar mercii değildir. Platform uygulaması human-developer-only
kapsamındadır.

## Repo Gerçeği

| Kaynak | Doğrulanan durum | Sonuç |
|---|---|---|
| actionplan | 617 düğüm, 41 k-* düğümü, 787 SP; kernel evidence sayısı 0 | Plan ve sözleşme katmanı; runtime kanıtı değil |
| platform | FastAPI health/ping ve UI SurfaceRenderer iskeleti; DB, migration, kernel paketi ve SDK yok | Runtime NO-GO |
| atonota/kernel | Yerel ve origin/main aynı committe; 2 test yeşil | Metawork/pipeline spike'ı; metaframer runtime kernel değildir ve uzak repo boş değildir |
| metaframer-kernel | Kanonik workspace manifestindeki hedefte doğrulanmış checkout yok | Ayrı bir runtime kanıtı kabul edilmez |

## Ajan Bazlı Bulgular

- PM: yalnız PR-01 sıradaki uygulanabilir queue adayıdır; KDP overlay sıralama
  yetkisine sahip değildir.
- Backend/kernel integrator: PR-02, PR-04, PR-06 ve PR-07 kalıcı veri/transaction
  davranışı isterken ilk açık DB/ORM/Alembic zemini PR-08'dedir.
- QA/QASP: readiness kapıları 0 done ve 0 development adayında boş-küme yeşili
  üretebilir; bu kernel-ready anlamına gelmez.
- Graph denetimi: 35 düğüm üzerinde 46 çelişkili kenar vardır. Bunların 5 kernel
  düğümü üzerinde 8 çelişkili kenarı bulunur.
- ADR denetimi: E1, M1, S1, X1 ve A5/ADR-0022 kimlikleri çakışır veya aynı kararı
  birden fazla otoriteyle taşır.
- WBS denetimi: direktiflerin iddia ettiği 13 hayalet WBS kimliği kanonik node
  kümesinde yoktur.
- Security/rollback: yanlış runtime readiness, yanlış ADR approval_ref ve legacy
  writer yan etkisi fail-closed ele alınmalıdır.

## İnsan Kararı Paketi

Bu belge aşağıdaki seçenekleri seçmez; etkiyi görünür kılar ve kararı User/Admin'e
bırakır. Bütün seçenekler pending/unselected durumundadır.

### KGA-D06 — Kalıcı Veri Zemini ve Queue

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

1. early-minimal-db-substrate: PR-01 sonrasında küçük, açık bir DB/Alembic/transaction/RLS
   zemini eklenir; PR-02..07 gerçek kalıcılık üzerinde doğrulanır.
2. provisional-contract-only: mevcut sıra korunur; PR-02..07 yalnız provisional
   contract olarak işaretlenir ve PR-08 sonrasında persistence testleri yeniden oynatılır.

Birinci seçenek teknik olarak daha doğrudan görünse de bu bir seçim veya onay değildir.
Base queue insan kararı olmadan değiştirilmez.

### KGA-D07 — Dependency/Blocks Semantiği

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

35 düğüm, 46 çelişkili kenar ve kernel alt kümesindeki 5 kernel düğümü, 8 çelişkili
kenar için blocks yönü, reciprocity ve birleşik precedence anlamı kararlaştırılmalıdır.
Bu ölçüm yalnız aynı node içindeki dependsOn ∩ blocks kesişimidir. Karar gelmeden
otomatik edge düzeltmesi yapılmaz.

### KGA-D08 — ADR Kimlikleri

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

E1, M1, S1, X1 ve A5/ADR-0022 için tekil topic, status, owner, alias ve supersession
kararı gerekir. Bu kimlikler ambiguous kalır ve machine consumer'ları açmamalıdır.

### KGA-D09 — Hayalet WBS Kimlikleri

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

13 hayalet WBS, bu auditin doğrudan doğrulanmış eksik-node setidir; tüm aday/alias
envanteri değildir. Her biri için tek tek create / alias / fold / reject kararı gerekir.
Bu paket node üretmez, module parent değiştirmez ve DoD tamamlandı iddiası yazmaz.

### KGA-D10 — Tenancy Fiziksel Stratejisi

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

PostgreSQL RLS deny-by-default kabul edilmiş invarianttır; fakat ortak şema, tenant
başına şema veya hybrid seçiminde physicalStrategy = null durumundadır. ADR-0026
frontend teknoloji profilleridir; tenancy kararı olarak kullanılamaz.

## P0 Bağlayıcı Ledger'lar

Aşağıdaki üç P0 envanteri D08/D09/D10 pending/unselected durumunu makine-okunur snapshot
olarak bağlar; runtime NO-GO sürer ve bu ledger'lar kanonik ADR topic, WBS owner/disposition
veya tenancy topolojisini seçmez.

| Karar | P0 ledger | Durum |
|---|---|---|
| KGA-D08 | reports/kernel-adr-collision-source-bindings-2026-07-15.json | pending; ADR kimlikleri ambiguous, canonicalTopic null |
| KGA-D09 | reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json | pending; 13 hayalet binding candidate-unselected |
| KGA-D10 | reports/kernel-tenancy-authority-inventory-2026-07-15.json | pending; physicalStrategy null, mandatory RLS korunur |

## Uygulanan Güvenli Sıra

1. Weak-content analizini import sırasında rapor yazmayan saf kütüphaneye ayır.
2. Üç eski platform writer'ını fail-closed karantinaya al.
3. Kernel governance sayımlarını ve runtime NO-GO sonucunu machine-readable kapıya bağla.
4. Açık insan kararlarını bu paketle görünür kıl; WBS, queue, ADR veya tenancy
   kararlarını otomatik uygulama.

## Riskler

- Docs green, runtime green değildir.
- Boş aday kümesinde PASS, gerçek readiness'i yanlış temsil edebilir.
- Queue değiştirilmeden gerçek persistence beklentileri karşılanamaz.
- Çakışan graph/ADR kimlikleri yanlış işi veya yanlış approval_ref'i açabilir.
- Repo dışı ingest kaynakları olmadan tüm canonical üretim upstream'den yeniden
  üretilebilir değildir.

## Doğrulama ve Test Planı

- Saf import testi, tracked raporların hash ve içerik olarak değişmediğini doğrular.
- Legacy writer negatif testleri doğrudan çalıştırma ve import yollarının exit 2 ile
  kapandığını doğrular.
- Governance testi node/SP/status/evidence ve graph/queue sayılarını canlı kanonik veriden;
  ADR ve hayalet WBS envanterini denetimli snapshot'tan doğrular.
- Karar paketi testi bu belgenin seçenek sunduğunu, karar almadığını ve gap raporuyla
  machine-readable ek arasında bağ kurduğunu doğrular.
- Runtime kernel yalnız gerçek Postgres RLS, transaction/outbox/audit, PR/CI ve
  rollback drill evidence ile yeniden değerlendirilir.

## Rollback

Her tooling shard'ı ayrı commit olarak geri alınabilir. Karar paketi shard'ı belge,
classification, matrix, source-node traceability ref'i, generated/public aggregate ve
integration sayımlarını birlikte revert eder. Governance raporu yalnız checker/lib/test/
workflow/package ile tam governance shard rollback'inde geri alınır. Base queue, WBS
kimliği/parent/edge, ADR kimlikleri ve tenancy stratejisi değişmediği için semantic data
rollback gerekmez. Runtime safhasında veri oluşursa destructive geri alma yerine route
kapatma ve additive forward-fix uygulanır.

## Codex Nihai Kararı

Runtime kernel için NO-GO sürer. Actionplan tarafında yalnız fail-closed tooling,
kanıtlı gap kaydı ve insan-karar paketi uygulanabilir. Şu anda yalnız PR-01
next-actionable konumundadır. PR-01 next-actionable bir code-start izni değildir;
KGA-D06..D10 kapanmadan kernel-ready, SDK-ready veya app-buildable kararı verilmez.
