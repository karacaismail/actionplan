# Kernel -> SDK -> App-Core -> App-Modules -> App Delivery Sequence

Tarih: 2026-07-08
Durum: Kanonik, baglayici
Kapsam: actionplan handoff dokumanlari, implementation workspace yonlendirmesi, vibecoding/vobecoding ajan sozlesmeleri.

Bu dokuman `docs/task-to-code-contract.md` sozlesmesini tamamlar. `task-to-code-contract.md` seviye/faz karar agacinin master kaynagidir; bu dokuman ise platform urununun hangi teknik sirayla dogacagini kilitler.

## Karar

Teslim sirasi zorunludur:

1. Kernel gelistirilir.
2. Kernelin public sozlesmelerinden SDK gelistirilir.
3. SDK ile app'e ozgu core module gelistirilir.
4. App-core sonrasinda app'in ihtiyac duydugu diger module'ler gelistirilir.
5. App, module'lerin release train/kompozisyon etiketi olarak paketlenir.

Bu sirada app dugumu kod yazma yeri degildir. App, hangi module'lerin hangi surumlerle ve hangi capability/entitlement sinirlariyla birlikte satilacagini ve deploy edilecegini tanimlar. Gercek kod `platform` implementation reposundadir.

## Terimler

| Terim | Anlam | Implementation hedefi |
|---|---|---|
| Kernel | Tum app'lerin paylastigi runtime primitifleri: tenant, authz, audit, event/outbox, observability, registry, module SDK, policy, capability. | `apps/api/src/meta_api/kernel/**` ve ilgili `infra` sozlesmeleri |
| SDK | Kernelin public API/GraphQL/OpenAPI/typed-port sozlesmelerini saran, app ve module gelistiricisinin kullandigi tipli arac katmani. | `packages/sdk` |
| App-core module | Tek bir app'in kalbi. App'e ozgu domain sozlugu, capability map, routing/composition, default policy, event isim alani ve module baglama sozlesmesini tutar. | `apps/api/src/meta_api/apps/<app_slug>/**` composition root + `apps/web/src/apps/<app_slug>` kabugu |
| App module | App-core'a baglanan, tek bounded context veya ozellik ailesini uygulayan calisan module. | `apps/api/src/meta_api/apps/<app_slug>/<module_slug>/**` ve ilgili frontend projection |
| App | Satilabilir/deploy edilebilir urun/release train etiketi. Kodun kendisi degil; manifest, lisans, capability, module listesi ve paketleme sozlesmesidir. | app manifest + packaging/deploy artefakti |

**Legacy QA marker:** `apps/api/platform_<app_slug>_core` eski delivery-sequence kontrolünün aradığı uyumluluk belirtecidir; yeni implementasyon hedef yolu değildir. Gerçek checkout kökü ve V0–V3 hedefi `apps/api/src/meta_api/apps/<app_slug>/**` olarak yukarıda sabitlenmiştir. Marker kaldırılması, bu docs-only dalganın dışında checker migration changeset'i gerektirir.

## Zorunlu Sira Kapilari

### 0. Kernel ready olmadan SDK yok

SDK, kernelin public sozlesmelerinden turetilir. Kernelde asagidakiler net degilse SDK yazilmaz:

- tenant/context envelope
- authn/authz ve policy decision zarfi
- audit ve observability zarfi
- event/outbox sozlesmesi
- module registry ve `AppModule` arayuzu
- API hata formati ve versioning kurali

Kernel ic isimleri app/module tarafina sizdirilmaz. App gelistiricisi kernel internals yerine SDK veya kernelin public portlarini kullanir.

### 1. SDK ready olmadan app-core yok

App-core module, SDK uzerinden kernel ile konusur. SDK hazir degilse app-core yalnizca requirements/test-plan/db-schema seviyesinde kalir; production kodu baslamaz.

SDK icin minimum ready paketi:

- public API/GraphQL/OpenAPI sozlesmesi surumlu
- typed client veya typed port uretimi deterministik
- forbidden stack uretmeme kuralini tasiyor
- kernel capability/authz/audit/tenant zarflarini saklamadan disari aciyor
- codegen veya generator ciktisi elle duzenlenmiyor

### 2. App-core ready olmadan diger app module'leri yok

Her app once kendi app-core module'unu alir. App-core module sunlari tanimlamadan diger module'ler development fazina gecemez:

- app slug ve module namespace
- app capability listesi (`<app>:core`, opsiyonel capability'ler)
- app event namespace'i
- app-local domain sozlugu ve ortak aggregate isimleri
- route/menu/surface composition kural seti
- diger module'lerin kullanacagi app-level policy varsayilanlari
- standalone deploy manifestinin minimum module listesi

App-core generic kernel degildir. Kernel herkesindir; app-core tek app'e aittir.

### 3. App module'leri app-core + SDK uzerinden gelisir

App'in ihtiyac duydugu diger module'ler app-core'dan sonra gelisir. Bu module'ler:

- app-core'u kendi app siniri icinde import edebilir
- kernel internals veya baska app module'unu dogrudan import edemez
- SDK/public port uzerinden kernel capability kullanir
- kendi `AppModule` kaydini ve healthz/ready davranisini tasir
- acceptance criteria ve test kanitini kendi WBS dugumunde biriktirir

Iki app arasinda dogrudan import yoktur. App-to-app haberlesme yalniz kernel sozlesmesi, public API veya event bus uzerinden olur.

### 4. App assembly en son yapilir

App assembly, app-core ve gerekli module'ler hazir oldugunda yapilir. Assembly ciktisi:

- app manifest
- required/optional module listesi
- capability/entitlement listesi
- standalone deploy paketi
- release train versiyonu
- rollback/runbook

App assembly asamasinda yeni is mantigi yazilmaz. Eksik is mantigi varsa ilgili app module dugumune geri donulur.

## WBS Seviyelerine Ceviri

| WBS seviyesi | Dogru yorum |
|---|---|
| app / ada | Satilabilir urun/release train. Kod yazma yeri degil. |
| module / dag | Kernel, SDK, app-core veya app module gibi bounded context sozlesmesi. Kod ancak alt archetype ve daha kucuk dugumlere indiginde yazilir. |
| archetype / kaya | Domain/API/storage sozlesmesinin ilk calisir kod birimi. |
| feature / tas | Kullanici/developer degeri olan tek ozellik. |
| component / kum | Feature icindeki tek bilesen veya servis parcasi. |
| work_unit / molekul | Tek fonksiyon/test/validator gibi kucuk is. |
| micro_step / atom | En kucuk degisiklik veya fixture. |

## AI/Vibecoding Kural Seti

Kod ajani veya vibecoder su sinirlari asamaz:

- Kernel hazir degilse SDK veya app-core kodu uretmez; eksik readiness patch onerir.
- SDK hazir degilse app-core production kodu uretmez.
- App-core hazir degilse app'in diger module'lerini development'a almaz.
- App dugumunden dogrudan kod yazmaz; archetype/feature/component/work_unit/micro_step seviyesine iner.
- Baska app'in ic module'unu import etmez.
- Forbidden stack kullanmaz: Next.js, Supabase, Prisma, Redux, Flowbite.
- Generated SDK veya codegen ciktisini elle duzenlemez; sozlesmeyi degistirip generator'u tekrar calistirir.

## Kanit Beklentisi

Her asama kendi kanitini tasir:

| Asama | Kanit |
|---|---|
| Kernel | `core-contract-pack.md` primitifleri, contract testleri, `check-core-contract` yesil |
| SDK | codegen/check komutu, typed client/port testleri, forbidden stack taramasi |
| App-core | app slug/capability/event namespace testi, app manifest taslagi, app-core healthz |
| App module | module-level AC testleri, app-core baglantisi, `AppModule` registry testi |
| App assembly | standalone deploy manifesti, module listesi, capability gate, rollback/runbook |

## No-Go Kosullari

Gelistirici veya ajan su durumda kod baslatmaz:

- Kernel sozlesmesi eksik veya `check-core-contract` kirmizi.
- SDK hedefi ve public sozlesme yolu yok.
- App-core module tanimlanmadan app module development isteniyor.
- App dugumu uzerinden dogrudan implementation kodu isteniyor.
- `traceability.repoPath` veya `traceability.testCommand` eksik.
- WBS fazi `development` degil.

## Bagli Kaynaklar

- `docs/task-to-code-contract.md` — seviye/faz master sozlesmesi.
- `docs/core-contract-pack.md` — kernel ve module SDK sozlesmesi.
- `docs/implementation-workspace-manifest.md` — implementation checkout ve kok dizinler.
- `docs/meta-framework-implementation-development-plan.md` — bu teknik siranin wave/PR/evidence kuyrugu.
- `docs/app-distribution-contract.md` — bagimsiz satilabilir app sozlesmesi.
- `docs/waterfall-developer-handoff.md` — plan-start/code-start ayrimi.

## Commerce Operating System Profili (Addendum)

Tarih: 2026-07-13 · Kaynak yetki: [`adr-0030-commerce-operating-system-boundary.md`](./adr-0030-commerce-operating-system-boundary.md)

Bu addendum yukaridaki kanonik sirayi degistirmez; onu `commerce-operating-system` app'i (ada, kisa kod `commerce-os`) icin ozellestirir. Kapsam yalniz dokumantasyon: **bu addendum app/module dugumu acmaz, kod/implementation iddiasi tasimaz** ([`AGENTS.md`](../AGENTS.md) §0, §4.4). BC/kapsam kaynagi: [`commerce-os-bounded-context-map.md`](./commerce-os-bounded-context-map.md), [`commerce-os-product-scope.md`](./commerce-os-product-scope.md); primitif boslugu: [`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md).

### App-core sorumlulugu ve namespace

- App slug `commerce-operating-system`, module namespace `commerce_os_*`, event namespace `commerce-os.*`.
- App-core (Kapi 2) sunlari tanimlar, **is mantigi yazmaz**: BC (dag) listesi, edition/mode kompozisyon kurallari ([`mode-profile-contract.md`](./mode-profile-contract.md)), ortak commerce sozlugu, app-level policy varsayilanlari, tuketilen platform primitifi bagi (kopya yok).
- App-core generic kernel degildir; kernel herkesindir, app-core yalniz Commerce OS'a aittir (yukari §2).

### Minimum BC hazirlik sirasi (satilabilir en kucuk dilim)

[`commerce-os-product-scope.md`](./commerce-os-product-scope.md) §3 yedi core BC'yi tanımlar. Build sırası [`task packets`](./commerce-os-vibecoder-task-packets.md)'e tabidir: V0–V4 sonrasında **Wave A'da Catalog + Offer + Inventory + Payment ayrı writer lane'lerinde**, ardından Cart → Order → Fulfillment sıralı yürür ve V12'de birleşir. Bu build/test sırası runtime saga akışı veya BC→BC import sırası değildir. Her BC bir `module`'dur (dag), app degil; app-core hazir olmadan hicbiri development'a gecmez (§2).

### App-core/module oncesi zorunlu SDK portlari

Asagidaki portlar SDK'da (Kapi 1) hazir olmadan commerce-os app-core/modul production kodu baslamaz ([`be-sdk-readiness-gap-2026-07-09.md`](./be-sdk-readiness-gap-2026-07-09.md) Cikis Esigi): tenant/context zarfi, PDP/policy karar zarfi, audit+outbox/event zarfi, capability/entitlement ([`capability-entitlement-contract.md`](./capability-entitlement-contract.md)), workflow/state ([`workflow-directive.md`](./workflow-directive.md)), provider-port ([`k-provider-adapter-directive.md`](./k-provider-adapter-directive.md)), search projeksiyon ([`k-search-directive.md`](./k-search-directive.md)), storage/DAM ([`k-storage-dam-directive.md`](./k-storage-dam-directive.md)), ledger ([`archetype-ledger-directive.md`](./archetype-ledger-directive.md)). Gap direktifinde **EXTEND/SDK-PORT/DEFER** isaretli yatay motorlar (odeme/vergi port sinifi, acting-context, availability, out-of-process health) app-core'u bloklamaz ama ilgili module oncesi §8 insan kararina baglanir.

### Test-onceligi ve kanit kapilari

Yukaridaki "Kanit Beklentisi" tablosu aynen gecerlidir. Commerce OS eki: her BC module'u once kirmizi sozlesme testi tasir (multi-tenant izolasyon, idempotency/replay, provider-failure, negatif-test, version-compat, evidence ciktisi — [`commerce-os-kernel-sdk-gap-directive.md`](./commerce-os-kernel-sdk-gap-directive.md) §6, [`kernel-execution-contract-matrix.md`](./kernel-execution-contract-matrix.md) §9, §12). Kanitsiz "yapildi" gecersizdir.

### No-go kosullari (yukaridaki §No-Go'ya ek)

- ADR-0030 slug/kisa-kod ve BC ayrimi insan onayindan gecmeden app-core development.
- Yedi core BC'den once opsiyonel edition/advanced-network module'u (BC-map Grup B/C) development'a alinmasi.
- Tuketilecek platform primitifi (§Tekrar-etme listesi) kopyalanarak BC icinde yeniden yazilmasi.
- Bir commerce-os module'unun baska app'i veya baska commerce-os module'unu **dogrudan** import etmesi; kernel internals import etmesi. Haberlesme yalniz SDK/public port veya event bus uzerinden.
- Duzenlenmis yurutmenin (odeme/escrow/MoR/vergi) app icinde insan karari olmadan yerlestirilmesi (ADR-0030 §7; saglayici sinirinda kalir).

Bu addendum yeni app/module dugumu **acmaz** ve hicbir implementasyonun mevcut oldugunu **iddia etmez**; yalniz commerce-os teslim sirasini kanonik sozlesmeye baglar.

## ADR-0031 Teslim Sirasi Guncellemesi (Addendum — yukaridaki dogrudan sira imalarini override eder)

Tarih: 2026-07-13 · Kaynak yetki: [`adr-0031-commerce-os-vibecoder-handoff-decisions.md`](./adr-0031-commerce-os-vibecoder-handoff-decisions.md) (ACCEPTED, insan-yetkili; [`ledger`](./enterprise-saas-human-decision-queue.md) §ADR-0031 kapanış addendum). Yalniz dokumantasyon: app/module dugumu acmaz, kod/implementation iddiasi tasimaz.

Yukaridaki §Minimum BC hazirlik sirasi bir teslim/hazirlik sirasidir; **BC'ler arasi dogrudan bagimlilik/import sirasi degildir.** ADR-0031 D7/D10 bu imayi netlestirir ve override eder:

- **D7 — neutral versionlu integration-contract paketleri:** App-core ve core BC'ler (Catalog, Offer, Cart&Checkout, Order, Inventory, Payment, Fulfillment) **birbirini dogrudan import etmez.** Producer ve consumer yalnizca **neutral, versionlu commerce integration-contract paketlerine + public SDK portlarina** bagimlidir (`import order from cart` / `import cart from order` kenari yasak). Design-time paket bagimliligi **DAG**'tir; "async'tir" demek bir dongu cozumu degildir. Contract paketleri hicbir business BC'ye bagimli degildir (DAG koku). Bu paket katmani, yukaridaki §App-core/module oncesi zorunlu SDK portlari listesiyle birlikte, BC development'indan **once** yerlesir.
- **D10 — `CheckoutSubmitted` + tek-yazar Order saga:** **Cart & Checkout** cart/checkout session sahibidir ve yalnizca **`CheckoutSubmitted`** (purchase intent) yayinlar; order yazmaz. **Order Orchestration order state'in tek yazaridir** ve saga/process manager'dir (reserve→commit→release; authorize→capture→refund; fulfillment start→cancel). Inventory/Payment/Fulfillment kendi state'ini yazar ve outcome'u versionlu contract ile doner; **cross-context write yok**, tum saga komutlari idempotent.
- **V0 clean worktree + packet katalogu:** Implementasyon **V0 clean sibling worktree preflight**'i ile baslar (kaydedilmis temiz base commit; kullanicinin dirty tree'sine dokunmaz) ve [`commerce-os-vibecoder-task-packets.md`](./commerce-os-vibecoder-task-packets.md) V0…V16 katalogunu izler. RED test aileleri [`commerce-os-contract-test-plan.md`](./commerce-os-contract-test-plan.md), veri/otorite siniri [`commerce-os-data-migration-contract.md`](./commerce-os-data-migration-contract.md), talimat-hazirlik kapilari [`commerce-os-vibecoder-readiness-oracles.md`](./commerce-os-vibecoder-readiness-oracles.md)'dedir. Master handoff: [`commerce-os-test-first-parallel-handoff.md`](./commerce-os-test-first-parallel-handoff.md).
- **Paket-ozel test komutlari:** Yukaridaki §Kanit Beklentisi tablosu gecerlidir; ancak integration-contract paketi ve BC-ozel komutlar bir packet **scaffold ettikten sonra** gecerli olur — **expected-after-scaffold (su an mevcut degil)**; koşulmuş test olarak sunulamaz. Mevcut gercek komutlar yalniz platform reposundadir.

**instruction-ready ≠ runtime/GA-ready.** Bu addendum V0…V16 icin talimat sirasini kilitler; runtime/pilot/GA hala 14 probe, build-enforced DAG check, saga/drill kaniti ve counsel'a baglidir. Yeni app/module dugumu acilmaz; commit/push/merge yapilmaz.
