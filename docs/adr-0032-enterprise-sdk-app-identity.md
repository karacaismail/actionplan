# ADR-0032 — Enterprise SDK App Kimliği ve Ürün Sınırı

**Tarih:** 2026-07-14
**Durum:** KABUL EDİLDİ — insan/kullanıcı tarafından açıkça yetkilendirildi
**Karar sahibi:** Kullanıcı/Admin
**Kapsam:** `actionplan` planlama ve sözleşme katmanındaki app/module kimliği, WBS sınıflandırması ve geliştirici handoff'u
**İlişkili sözleşme:** `docs/app-enterprise-definition-contract.md`
**Runtime durumu:** Bu ADR platform kodunun yazıldığını, app'lerin geliştirildiğini veya herhangi bir sürümün yayınlandığını iddia etmez.

---

## 1. Bağlam

Korpusta bağımsız ticari çözümler farklı adlarla temsil edilmektedir: `distribution`, sektör/dikey paket, stack, edition, suite, hub, platform veya içeriği önceden doldurulmuş paket. Bu adlar bazı kayıtlarda WBS seviyesi veya varlık türü gibi kullanıldığı için aynı ticari ürün bir yerde app, başka bir yerde module/archetype ya da paket olarak görülebilmektedir.

Bu belirsizlik üç temel soruna yol açar:

1. Ayrı satılabilir, lisanslanabilir ve kurulabilir çözümlerin app kimliği kaybolur.
2. App ile app'i oluşturan module arasındaki SDK geliştirme sınırı denetlenemez.
3. Basit bir paket veya MVP anlatısı, enterprise waterfall teslimat sözleşmesi yerine geçebilir.

Kullanıcı/Admin bu belirsizliği kapatmak üzere aşağıdaki kararı açıkça vermiştir:

> Bağımsız ticari distribution, sektör çözümü, stack, edition veya içeriği doldurulmuş çözüm bir app'tir. Her app MVP değil enterprise-grade waterfall seviyesinde tanımlanır. App artefaktı ve app'in bütün module'leri SDK ile geliştirilir.

Bu insan kararı, app/module kapsamını değiştirme yetkisinin kaynağıdır. AI veya otomasyon bu kapsamı kendi başına genişletemez.

---

## 2. Karar

### 2.1 Tek ticari varlık türü: app

Aşağıdaki dört şartı birlikte sağlayan her çözüm `app` olarak tanımlanır:

- bağımsız bir ticari/problem alanı sınırı taşır;
- ayrı lisanslanabilir veya entitlement ile açılıp kapatılabilir;
- ayrı paketlenebilir ve kurulabilir;
- başka bir app'in internal koduna bağımlı olmadan kernel/SDK/public contract üzerinden çalışabilir.

Bir çözümün bugün `distribution`, sektör paketi, vertical, stack, edition, suite, hub, platform veya content-filled package olarak adlandırılması app olma niteliğini değiştirmez. Bu terimler yalnız sınıflandırma, pazar konumlandırması, capability kompozisyonu veya kurulum profili metadata'sıdır.

### 2.2 App olmayanlar

Aşağıdaki varlıklar app değildir:

- Kernel ve kernel primitifleri: ortak foundation/runtime sözleşmesidir.
- SDK: kernel public contract'larının geliştirici yüzeyi ve üretim aracıdır.
- Portfolio, ürün ailesi ve kategori: app'leri gruplar; kendi başına satılabilir runtime değildir.
- Governance, ADR, standart, karar kuyruğu ve katalog görünümü: planlama/yönetişim artefaktıdır.
- App'i oluşturan module: kendi app'i içinde SDK ile geliştirilen çalışma birimidir.

Bir düğümün mevcut `level=app` olması, bu ticari app şartlarını otomatik karşıladığı anlamına gelmez. Portfolio/kategori/governance kökleri app gibi davranamaz; migration karar kaydında açıkça yeniden sınıflandırılır.

### 2.3 Enterprise waterfall zorunluluğu

Her app ilk tanımından itibaren enterprise-grade waterfall sözleşmesi taşır:

1. `requirements`
2. `test-plan`
3. `db-schema`
4. `development`
5. `test-qa`
6. `verification`
7. `release-maintenance`

`MVP`, `minimum viable product`, `proof of concept`, `demo yeterliliği` veya daha sonra enterprise'a tamamlama app teslimat sınıfı olamaz. Aşamalı uygulama yapılabilir; ancak app tanımı baştan sona enterprise kapsamını, negatif testleri, operasyonu, güvenliği, uyumu ve geri alma yöntemini eksiksiz planlar.

Planın enterprise-grade olması runtime'ın uygulanmış olduğu anlamına gelmez. Gerçek kanıt yoksa app `requirements/backlog` durumunda kalır; hiçbir faz `passed`, hiçbir implementation `verified` ve hiçbir release `done` gösterilemez.

### 2.4 SDK-only geliştirme

Bağlayıcı sıra şöyledir:

1. Kernel public contract'ları tanımlanır ve doğrulanır.
2. Bu public contract'lardan SDK geliştirilir.
3. SDK ile app'e özgü zorunlu `app-core` module geliştirilir.
4. SDK ile app'in diğer module'leri geliştirilir.
5. App artefaktı, app-core ve module'lerin manifest/release-train assembly'si olarak paketlenir.

Kurallar:

- Her app tam bir `app-core` module referansı taşır.
- Her app module'u `sdkRequired=true` ve çözülebilir SDK contract/version referansı taşır.
- App assembly katmanında yeni domain iş mantığı yazılmaz.
- App veya module kernel internal paketlerine doğrudan bağlanmaz.
- Bir app başka app'in internal backend/frontend/module kodunu import etmez.
- App'ler arası iletişim yalnız kernel, SDK, versioned public API veya event contract üzerinden kurulur.

### 2.5 Hedef WBS

Runtime ürün ayrıştırmasının hedef zinciri değişmez:

`app (ada) → module (dağ) → archetype (kaya) → feature (taş) → component (kum) → work_unit (molekül) → micro_step (atom)`

- App ticari ve dağıtılabilir köktür.
- Module app'in SDK ile geliştirilen çalışma birimidir.
- Daha alt seviyeler module içinde uygulanabilir işi parçalar.
- Portfolio, kategori ve governance bu runtime hiyerarşisinin app kökü olarak kullanılmaz; ayrı indeks/facet/projection olarak tutulur.

---

## 3. Geçersiz Kılınan İfadeler

Bu ADR ile çeliştiği ölçüde aşağıdaki ifade sınıfları geçersizdir:

- “Distribution yalnız bir paket/konfigürasyondur, app değildir.”
- “Sektör/dikey çözümü app değil, önceden doldurulmuş içerik paketidir.”
- “Stack, edition, suite veya hub bağımsız app kimliği taşıyamaz.”
- “Önce MVP/core tanımlanır, enterprise gerekleri daha sonra app tanımına eklenir.”
- “Bazı app module'leri SDK'yı kullanmadan doğrudan kernel internal'larına bağlanabilir.”
- “App assembly aşamasında yeni iş mantığı geliştirilebilir.”
- “Kernel veya SDK, ticari app/module envanterinin bir üyesidir.”
- “Portfolio, kategori, aday havuzu veya governance kökü, ticari app olarak sayılır.”
- “Mevcut level/tag/title tek başına app kimliğinin kanıtıdır.”

Tarihsel belgeler silinmez; ancak bu ADR'ye aykırı cümleler kanonik karar olarak kullanılamaz. Sonraki migration, ilgili belgelere superseded/not-applicable işareti veya bu ADR referansı eklemelidir.

---

## 4. Zorunlu Makine-Okunur Karşılık

Kanonik JSON-as-DB içinde:

- Her ticari app düğümü `level=app` ve `appDefinition` taşır.
- Her app module düğümü `level=module` ve `moduleDefinition` taşır.
- Her alt görev çözülebilir app/module/SDK teslimat bağlamı taşır.
- `distribution`, `sector`, `stack`, `edition` ve benzeri değerler varlık türü değil metadata/facet olarak tutulur.
- Standard metni task içine kopyalanmaz; `standardRefs` ile çözülür.
- Node içinde yalnız node'a özgü kapsam, kabul, test, evidence beklentisi ve rollback bulunur.

Zorunlu alanların ayrıntısı `docs/app-enterprise-definition-contract.md` içindedir.

---

## 5. Migration ve Kimlik Kuralları

1. 496 düğümlük source snapshot değişmez; türetilmiş/materialized snapshot ayrı sayılır.
2. Kullanıcının bağlayıcı “ürünleştirilmiş çözüm paketlerinin hepsi app” kararı 99 `s-*` kaydı, distribution/stack/edition adayları ve Landx üzerinde registry kararı olarak uygulanır; keyword/tag eşleşmesi tek başına yetki kaynağı değildir.
3. Duplike görünen kayıtlar canonical app, ayrı app veya legacy alias olarak açık karara bağlanır.
4. Eski task id ve URL'leri silinmez; `aliases` veya deterministik redirect ile canonical app'e çözülür.
5. Rename ve destructive delete aynı migration dalgasında yapılmaz.
6. App ve zorunlu app-core module aynı atomik migration shard'ında tanımlanır.
7. WBS kodu değişimi ilgisiz düğümleri yeniden numaralamamalıdır; stable identity/ordinal korunur.
8. Public aggregate, navigation, index ve canonical node dosyaları aynı üretim koşusunda güncellenir ve byte-idempotence ile doğrulanır.

2026-07-14 immutable pre-D01 snapshot sonucu:

- 121 canonical `sellable-app`;
- 121 zorunlu `app-core-module`;
- 7 sahipliği açık `app-module`;
- 5 canonical app'e yönelen `legacy-alias` tombstone;
- 617 fiziksel JSON node ve aliaslar hariç 612 aktif WBS kaydı;
- app/module tarafında 249 typed enterprise definition.

Current-live fiziksel node toplamı bu tarihsel snapshot'tan kopyalanmaz;
`resolveD01NodeUniverse` ile kanonik handoff ve live node kayıtlarından doğrulanır.

Sentetik Finans, İK, Tedarik Zinciri, Veri & Zekâ ve benzeri kökler portfolio olarak kalır; Kernel/SDK/Platform Factory foundation'dır. ADR, eğitim, katalog ve build kayıtları executable module sayılmaz; governance veya delivery-task olarak sınıflandırılır.

---

## 6. Evidence ve Faz Doğruluğu

- Plan içeriği actual runtime evidence değildir.
- `evidence[]`, `traceability.repoPath`, `testCommand`, PR URL, CI run veya deploy URL uydurulamaz.
- `passed`, `done`, `implemented` veya `verified` yalnız çözülebilir gerçek kanıtla yazılır.
- Docs-only değişiklik platform implementation kanıtı sayılamaz.
- Backlog/requirements app'inin enterprise tanımı tam olabilir; implementation durumu yine `not-started` kalır.

---

## 7. Rollback

- Şema ve veri migration'ı expand-contract uygulanır: yeni alan → çift okuyucu → cohort materialization → hard gate → legacy temizliği.
- Her shard öncesi canonical node, karar registry'si ve generated aggregate hash'i kaydedilir.
- Hatalı cohort normal `git revert` ile geri alınır; geçmiş rewrite edilmez.
- Revert sonrasında materializer, reindex, referans bütünlüğü, DAG, WBS, içerik ve Pages route parity yeniden çalıştırılır.
- Canlı Pages geri alımı son sağlıklı commit'in normal workflow ile yeniden yayınlanmasıdır.

---

## 8. Yetki ve Sınırlar

Bu ADR'nin ürün/app kimliği kararı Kullanıcı/Admin tarafından 2026-07-14 tarihinde açıkça verilmiştir. Bu provenance app/module kapsam kararının insan yetkisini gösterir; AI'ya platform ürün kodu yazma, branch/commit/push/merge/release yapma veya runtime evidence üretme yetkisi vermez.

Bu ADR yalnız `actionplan` içinde plan, sözleşme, JSON task içeriği, doğrulama kapısı ve geliştirici handoff'u tanımlar. Platform implementation'ını yalnız yetkili insan geliştirici gerçekleştirir ve gerçek kanıtı ayrıca writeback eder.
