# Surum Politikasi

Bu belge `karacaismail/actionplan` reposunda surumleme, changelog, etiketleme (tag)
ve deploy iliskisini tanimlar.

---

## Semantic Versioning (semver)

Repo `MAJOR.MINOR.PATCH` formatini kullanir.

| Degisiklik turu | Semver carpi |
|---|---|
| Geriye uyumsuz sema degisikligi (Zod semalari veya JSON-as-DB yapisi) | MAJOR |
| Geriye uyumlu yeni islevsellik (yeni gorunum, yeni alan, yeni kapi) | MINOR |
| Hata duzeltme, belge guncellemesi, CI iyilestirme | PATCH |

Sema ornekleri:
- `src/schemas/` altinda yeni alan eklenmesi, default degeriyle — MINOR
- Var olan alanin kaldirilmasi veya yeniden adlandirilmasi — MAJOR
- `src/data/` JSON'larinda icerik guncellemesi (yapı degismez) — PATCH

Mevcut surum `0.1.0`'dir. `v0.x` serisinde API kararsiz sayilir; MAJOR yukselme
erken yapilmaz, bunun yerine MINOR artirilir.

---

## Changelog — Keep a Changelog formati

Her release icin `CHANGELOG.md` guncellenmeli; format:
[Keep a Changelog](https://keepachangelog.com/tr/1.0.0/) standardidir.

Buyuk PR'larda `## [Unreleased]` bolumune giris yapilir; merge oncesi hedef surume terfi ettirilir.

Giris yapisi:

```
## [0.2.0] - 2026-07-xx
### Added
- query engine; SavedView; assignees; people.json
### Changed
- ...
### Fixed
- ...
```

Izin verilen alt basliklar: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

---

## Roadmap milestone eslesmesi

| Surum | Roadmap fazi | Kapsam |
|---|---|---|
| v0.2 | Faz 0 | query engine, SavedView, assignees, people |
| v0.3 | Faz 1 | tablo gorunumu, filtre DSL, kayitli gorunumler |
| v0.4 | Faz 2 | toplu duzenleme (bulk edit) |
| v0.5 | Faz 3 + 4 | Gantt/zaman cizelgesi + kapasite |
| v0.6 | Faz 5 | milestone/faz/efor/akis raporlari |
| v0.7 | Faz 6 | takvim, hedef rollup, aktivite gunlugu |
| v1.0 | Faz 0-6 | PM paritesi; kararsiz API yok; production-ready |
| v1.1 | Faz 7 | AI ajan koprusu; ECA what-if; ArcheType editor |

---

## Tag ve deploy iliskisi

Deploy akisi deploy.yml ile `push: branches: [main]` tetikleyicisine baglidir.
Tag atmak CI'yi tekrar tetiklemez; tag yalnizca izleme ve GitHub Releases icin kullanilir.

Adim adim surum akisi:

1. Feature branch'ten PR ac; CI kapilari yesil olsun.
2. Insan PR'i inceler ve merge eder — `main` guncellenir.
3. `deploy.yml` otomatik tetiklenir: tum kapılar yesil olursa `build` job tamamlanir,
   `deploy` job GitHub Pages'e yukler.
4. Yayın oncesi surum etiketi insan tarafindan atilir:
   ```
   git tag v0.2.0
   git push origin v0.2.0
   ```
5. GitHub Release notu olusturulur; aciklama CHANGELOG'daki ilgili surumden kopyalanir.

Kurallar:
- Etiket yalnizca `main` uzerindeki bir commit'e atilir; baska branch'e tag atilmaz.
- `v0.x` serisinde deploy her `main` push'ta gerceklesir; yayın notu sonradan da eklenebilir.
- `v1.0` ve sonrasinda surum etiketi olmayan commit yayinda kalir ama "tagged release"
  sayilmaz; release notu GitHub Releases arabiriminde eksik gorunur.

---

## Pages / SPA404 notu

`npm run build` komutu `vite build && node tools/spa404.mjs` seklinde tanimlidir.

`spa404.mjs` `dist/` icine GitHub Pages'in `404.html` SPA fallback mekanizmasiyla uyumlu
bir yonlendirme dosyasi uretir. Bu dosya olmadan SPA'nin deep-link'leri
(ornegin `/actionplan/node/abc`) GitHub Pages'te 404 ile sonuclanir.

Policy kurali: `spa404.mjs` build adiminin zorunlu parcasidir; kaldirilamaz veya devre disi
birakilamaz. Build adimi bu script'i calistirmadan `dist/` tamamlanmaz, Pages artifact'i
yuklenemez; dolayli olarak CI kapisi `Uretim derlemesi` tarafindan dogrulanir.

Uretim derlemesi `BASE_PATH=/actionplan/` env degiskeniyle calistirilir (deploy.yml'de
tanimlidir). Bu deger `vite.config.ts` icindeki `base` ayariyla uyumlu olmalidir;
eslesme bozulursa statik varliklar 404 verir.

`npm run preview` yalnizca lokal test icin kullanilir; CI veya deploy akisinda yer almaz.

---

## Surum politikasinin guncellemesi

Bu belgedeki degisiklikler `docs/release-policy.md` dosyasini etkileyen PR uzerinden
gerceklesir; CODEOWNERS kurali geregi `@karacaismail` incelemesi zorunludur.
