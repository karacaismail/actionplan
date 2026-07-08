# Kernel -> SDK -> App-Core -> App-Modules Sira Gap Raporu

Tarih: 2026-07-08
Durum: Uygulandi
Kapsam: kernel gelistirme, SDK gelistirme, app'e ozgu core module, app module'leri ve app assembly handoff sirasi.

## Soru

Gelistirici once kernel, sonra SDK, sonra SDK ile app'e ozgu core module, sonra app'in ihtiyaci olan diger module'ler ve en sonda app assembly sirasi ile calisabilecek kadar acik bir yonergeye sahip mi?

## Bulgu

Kismi olarak vardi, tek kanonik sira olarak yoktu.

Mevcut guclu taraflar:

- `docs/task-to-code-contract.md` app/module seviyesinde dogrudan kod yazilmamasi gerektigini soyluyordu.
- `docs/core-contract-pack.md` kernel primitifi ve Module SDK sozlesmesini tasiyordu.
- `docs/app-distribution-contract.md` app izolasyonu, manifest ve bagimsiz satilabilir app sinirini anlatiyordu.
- `docs/implementation-workspace-manifest.md` implementation reposu ve yasak stack sinirini veriyordu.
- `qa:waterfall`, `qa:ready`, `qa:vibecoding` ve `check-core-contract` code-start oncesi bircok yanlis guveni kapatiyordu.

Eksik kalan taraflar:

- Kernel -> SDK -> app-core -> app module -> app assembly sirasi tek baglayici dokumanda yazmiyordu.
- App'e ozgu core module'un generic kernelden farki acik degildi.
- SDK'nin app-core oncesi zorunlu ara katman oldugu developer guide'da net degildi.
- App assembly'nin yeni is mantigi yazma yeri olmadigi yeterince gorunur degildi.
- Workspace manifest `apps/api` / `apps/web` koklerini verirken bazi dokumanlarda eski `backend/` / `frontend/apps/` dili kaliyordu.
- Bu sira dokumanlardan dusse CI'da yakalayacak ozel bir kapisi yoktu.

## Uygulanan Duzeltme

- `docs/kernel-sdk-app-delivery-sequence.md` eklendi ve sira kanonik hale getirildi.
- `docs/task-to-code-contract.md`, `docs/developer-guide.md`, `docs/waterfall-developer-handoff.md`, `docs/core-contract-pack.md` ve `docs/app-distribution-contract.md` yeni sira sozlesmesine baglandi.
- `docs/implementation-workspace-manifest.md` ve `src/data/workspace-manifest.json` SDK kokunu `packages/sdk` olarak acikca tanimladi.
- `tools/agents/check-delivery-sequence.mjs` eklendi.
- `qa:delivery-sequence`, `qa:ci` ve GitHub Pages workflow zincirine eklendi.
- `docs/ci-conformance-gates.md` ve `docs/README.md` yeni kapiyi ve dokumani gosterir hale getirildi.

## Sonuc

Bu turdan sonra gelistirici icin kural sudur:

`kernel -> SDK -> <app>-core module -> app module'leri -> app assembly`

Bu sira app/module seviyesindeki WBS soyutlugunu bozmaz. App hala kod yazma yeri degildir; kod archetype ve daha kucuk dugumlerde, implementation reposunda ve workspace manifestte tanimli koklerde yazilir.

## Kalan Bilincli Sinir

Bu repo platform kodunu uretmez. Bu nedenle `packages/sdk`, `apps/api/platform_<app_slug>_core` veya `apps/web/src/apps/<app_slug>` dizinleri actionplan icinde olusturulmaz. Bu repo yalniz yol haritasi, handoff, sozlesme ve CI ile dogrulanabilir plan tanimini tutar.
