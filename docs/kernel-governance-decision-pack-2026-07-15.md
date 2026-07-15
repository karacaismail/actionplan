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

## Birleşik Karar Dizini

Kanonik görünürlük kaydı
`reports/kernel-governance-decision-registry-2026-07-15.json`, aşağıdaki iki kaynak
decision array'ini tekil ve sıralı biçimde keşfeder; kaynakların yerine geçmez:

- `reports/kernel-gap-inventory-2026-07-14.json`: KGA-D01..D05
- `reports/kernel-governance-gap-addendum-2026-07-15.json`: KGA-D06..D10

| Karar | Konu | Kaynak | Durum |
|---|---|---|---|
| KGA-D01 | Code-bearing descendant seçimi | Base gap inventory | pending/unselected |
| KGA-D02 | k-surface dependency ve SDK sırası | Base gap inventory | pending/unselected |
| KGA-D03 | PR-07 capability / module-registry sahipliği | Base gap inventory | pending/unselected |
| KGA-D04 | Sahipsiz kernel directive kimlikleri | Base gap inventory | pending/unselected |
| KGA-D05 | PR-10 / PR-11 exit semantiği | Base gap inventory | pending/unselected |
| KGA-D06 | Kalıcı DB zemini ve queue | Governance addendum | pending/unselected |
| KGA-D07 | dependsOn / blocks semantiği | Governance addendum | pending/unselected |
| KGA-D08 | ADR kimliği ve supersession | Governance addendum | pending/unselected |
| KGA-D09 | Hayalet WBS disposition | Governance addendum | pending/unselected |
| KGA-D10 | Tenancy fiziksel stratejisi | Governance addendum | pending/unselected |

## İnsan Kararı Paketi

Bu belge aşağıdaki seçenekleri seçmez; etkiyi görünür kılar ve kararı User/Admin'e
bırakır. Bütün seçenekler pending/unselected durumundadır.

### KGA-D01 — Code-bearing Descendant Seçimi

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

38 kernel module parent'ın yalnız beşinde archetype veya daha alt seviyede code-bearing
descendant vardır. Kalan 33 parent için gerçek uygulama ve test kanıtını taşıyacak
descendant kimlikleri seçilmelidir. `k-control-planes` yalnız üç module child taşıdığı için
code-bearing kapsama sayılmaz. Bu paket node üretmez, parent seviyesini değiştirmez ve
code-start açmaz.

Makine-okunur `reports/kernel-code-bearing-descendant-handoff-2026-07-15.json`, canlı
graph'taki 38/6/5/33 ölçümünü ve 33 pending parent'ı bağlar. Aday listeleri boştur;
selection, rationale ve approval alanları null'dır. Bu kayıt karar formudur, karar değildir.

### KGA-D02 — k-surface Dependency ve SDK Sırası

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

`k-surface`, `be-sdk` ve `stack-editions` arasındaki sıra/döngü için dependency yönü ve
minimum provisional contract sınırı seçilmelidir. Karar gelmeden edge veya queue değişmez.

### KGA-D03 — PR-07 Registry Sahipliği

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

PR-07'nin `k-capability` ile `k-mod-l` arasındaki module-registry sorumluluğu
ayrıştırılmalıdır. Bu paket iki modülü birleştirmez ve owner atamaz.

### KGA-D04 — Sahipsiz Kernel Directive Kimlikleri

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

Base envanterdeki yedi directive adayı için mevcut owner'a bağlama veya yeni WBS kimliği
kararı gerekir. Geniş hayalet-WBS ledger'ı D09 altında kalır; bu bölüm node oluşturmaz.

### KGA-D05 — PR-10 / PR-11 Exit Semantiği

Karar sahibi: User/Admin · Koordinatör: PM · Teslim yetkilisi: Codex

SDK port iskeletinin ve API/UI walking skeleton'ının hangi kanıtla scaffold-only durumundan
çıktığı tanımlanmalıdır. Bu iki adım kernel-ready, SDK-ready veya app-buildable kanıtı değildir.

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

Aşağıdaki dört P0 ledger D01/D08/D09/D10 pending/unselected durumunu makine-okunur snapshot
olarak bağlar; runtime NO-GO sürer ve bu ledger'lar kanonik ADR topic, WBS owner/disposition
veya tenancy topolojisini seçmez. D01 handoff ayrıca code-bearing descendant seçmez.

| Karar | P0 ledger | Durum |
|---|---|---|
| KGA-D01 | reports/kernel-code-bearing-descendant-handoff-2026-07-15.json | pending; 33 parent, candidate listeleri boş, selection null |
| KGA-D08 | reports/kernel-adr-collision-source-bindings-2026-07-15.json | pending; ADR kimlikleri ambiguous, canonicalTopic null |
| KGA-D09 | reports/kernel-ghost-wbs-directive-bindings-2026-07-15.json | pending; 13 hayalet binding candidate-unselected |
| KGA-D10 | reports/kernel-tenancy-authority-inventory-2026-07-15.json | pending; physicalStrategy null, mandatory RLS korunur |

## P1 Karar ve Yerleşim Handoff'ları

- `reports/kernel-crosscut-handoff-2026-07-15.json`: GraphQL otoritesi, kontrol düzlemi,
  erişilebilirlik, performans, deploy, i18n ve dependency yönü seçimlerini pending bırakır.
- `reports/kernel-missing-doc-ref-placement-2026-07-15.json`: 17 docs-ref boşluğunu
  14 candidate-unselected ve 3 canonical-source-missing olarak bağlar; ref uygulamaz.

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
- Birleşik registry testi D01..D10 sırasını, kaynak parity'sini, kimlik benzersizliğini,
  seçilmemiş seçenekleri ve fail-closed code-start durumunu doğrular.
- D01 handoff testi canlı graph'tan 38 module parent, 6 doğrudan-child sahibi, 5 covered
  ve 33 pending ölçümünü yeniden üretir; boş aday/seçim alanlarını ve NO-GO sınırını zorlar.
- Runtime kernel yalnız gerçek Postgres RLS, transaction/outbox/audit, PR/CI ve
  rollback drill evidence ile yeniden değerlendirilir.

## Rollback

Her tooling shard'ı ayrı commit olarak geri alınabilir. Karar paketi shard'ı belge,
classification, matrix, source-node traceability ref'i, generated/public aggregate ve
integration sayımlarını birlikte revert eder. Governance raporu yalnız checker/lib/test/
workflow/package ile tam governance shard rollback'inde geri alınır. Base queue, WBS
kimliği/parent/edge, ADR kimlikleri ve tenancy stratejisi değişmediği için semantic data
rollback gerekmez. Crosscut ve missing-doc-ref shard'ları önce tüketen governance
integration shard'ı, sonra ilgili report+test çifti geri alınarak atomik kapatılır. Runtime
safhasında veri oluşursa destructive geri alma yerine route kapatma ve additive
forward-fix uygulanır.
KGA-D01 handoff shard'ı report/test dosyaları ile registry, decision pack ve named-gate
bağlantıları tek committe geri alınarak kapatılır; generated node veya runtime veri etkisi yoktur.

## Codex Nihai Kararı

Runtime kernel için NO-GO sürer. Actionplan tarafında yalnız fail-closed tooling,
kanıtlı gap kaydı ve insan-karar paketi uygulanabilir. Şu anda yalnız PR-01
next-actionable konumundadır. PR-01 next-actionable bir code-start izni değildir;
KGA-D01..D10 kapanmadan kernel-ready, SDK-ready veya app-buildable kararı verilmez.
