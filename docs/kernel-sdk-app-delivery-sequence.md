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
| Kernel | Tum app'lerin paylastigi runtime primitifleri: tenant, authz, audit, event/outbox, observability, registry, module SDK, policy, capability. | `apps/api/platform_*` ve ilgili `infra` sozlesmeleri |
| SDK | Kernelin public API/GraphQL/OpenAPI/typed-port sozlesmelerini saran, app ve module gelistiricisinin kullandigi tipli arac katmani. | `packages/sdk` |
| App-core module | Tek bir app'in kalbi. App'e ozgu domain sozlugu, capability map, routing/composition, default policy, event isim alani ve module baglama sozlesmesini tutar. | `apps/api/platform_<app_slug>_core` + `apps/web/src/apps/<app_slug>` kabugu |
| App module | App-core'a baglanan, tek bounded context veya ozellik ailesini uygulayan calisan module. | `apps/api/platform_<app_slug>_<module_slug>` ve ilgili frontend projection |
| App | Satilabilir/deploy edilebilir urun/release train etiketi. Kodun kendisi degil; manifest, lisans, capability, module listesi ve paketleme sozlesmesidir. | app manifest + packaging/deploy artefakti |

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
- `docs/app-distribution-contract.md` — bagimsiz satilabilir app sozlesmesi.
- `docs/waterfall-developer-handoff.md` — plan-start/code-start ayrimi.
