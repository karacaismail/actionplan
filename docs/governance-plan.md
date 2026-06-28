# Repo Governance Planı — actionplan

Statü: tasarım belgesi · Tarih: 2026-06-28 · Uygulama: Prompt 6-impl'de yapılacak.

Bu belge `karacaismail/actionplan` reposunun yönetim kurallarını tanımlar. Kapsam: branch protection,
required status checks, sahiplik haritası (CODEOWNERS), PR/issue şablonları, etiket seti, kilometre
taşları, sürüm politikası, deploy politikası ve GitHub API uygulama referansı. Dosyaları bu belgede
taslak olarak vermek, gerçek dosyaları yazmak değildir; gerçek dosyalar Prompt 6-impl'de oluşturulacak.

---

## 1. Branch Protection — main

### Temel kural: AI main'e doğrudan push edemez

Enterprise güvenlik politikası gereği, hiçbir AI sistemi (GitHub Actions dahil) `main` branch'ine insan
onayı olmadan doğrudan kod yazamaz. Güvenli akış kesinlikle şudur:

```
AI kod önerir veya feature branch'e push eder
    --> PR açılır
        --> insan inceler, kapı geçiyor mu denetler
            --> insan merge eder
```

Bu kural branch protection ile teknik olarak da zorlanır. Settings → Branches → main kuralı:

| Ayar | Değer | Gerekce |
| --- | --- | --- |
| Require a pull request before merging | Acik | Her degisiklik PR uzerinden gecer |
| Required approvals | 1 | Tek sorumlu repo'da minimum insan onay sayisi |
| Dismiss stale reviews when new commits are pushed | Acik | PR'a ek commit gelirse eski onay iptal olur |
| Require review from code owners | Acik | CODEOWNERS'taki sahip blok'unu devreye alir |
| Require status checks to pass before merging | Acik | CI kapilari gecmeden merge yok |
| Require branches to be up to date before merging | Acik | Basedeki regresyon riski engellenir |
| Require conversation resolution before merging | Acik | Yorumlar kapatilmadan merge yapilmaz |
| Do not allow bypassing the above settings | Acik | Admin dahil kimse kurali atlayamaz |
| Allow force pushes | Kapali | Tarih yeniden yazimi yasak |
| Allow deletions | Kapali | main silinemez |
| Restrict who can push to matching branches | Kapali dogrudan; sadece botlar PR acar, insan merge eder |

`workflow_dispatch` ile tetiklenen el ile deploy istisna degildir; o da kapilari gercekten calistirmak
icin vardir (CI'yi atlatmaz, tekrar calistirir).

---

## 2. Required Status Checks — tam liste

Asagidaki kapilarin tamami `main`'e merge oncesi yesillemek zorundadir. Bu liste `deploy.yml`'deki
gercek `run:` komutlarindan turetilmistir; takma ad veya uydurma isim yoktur.

| Check adi (GitHub'a yazilacak) | Tetikleyen komut | Ne dogruluyor |
| --- | --- | --- |
| `Tip denetimi` | `npm run typecheck` | TypeScript derleyici hatasi sifir olmali |
| `Icerik kalite kapisi (node checker)` | `node tools/agents/check-content.mjs` | 422 dusumun hicbiri kalip imzasina veya capraz-tekrara geri donmemeli |
| `Icerik kalite kapisi (vitest)` | `npm run test:content` | `vitest.content.config.ts` altindaki kanonik icerik testleri yesil |
| `ECA ruleset katalogu kapisi` | `node tools/agents/check-ruleset.mjs` | system-layer dugumleri AI-degistirilemez; maxChainDepth <= 6; layer/category gecerli |
| `Surface/Workflow katalogu kapisi` | `node tools/agents/check-surface.mjs` | Durum makinesi tutarli (initial/terminal/transition); Workflow'un referans ettigi ECA paketi mevcut |
| `Kalite kapisi (audit)` | `node tools/quality-lint.mjs` | Golden dugumler (product/customer/s-crm) >= 2.3 skorunda; 14 boyut dolu; swarm kokeni iddiasi esik altina dusmemis |
| `Birim testleri` | `npm test` | `vitest run` (vitest.config.ts) altindaki tum birim testleri yesil |
| `E2E + axe` | `npm run test:e2e` | Playwright + axe-core; WCAG 2.2 ihlali yok; dev-server tabanli |
| `Uretim derlemesi` | `npm run build` | Vite build + spa404.mjs tamamlanmali; dist/ uretilmeli |
| `Lint` | `npm run lint` | Biome check; kod stili/format ihlali olmamali |

"build" job'un basarili bitmesi `deploy` job'unu otomatik tetikler (`needs: build` bagimi). Required
status check listesine sadece `build` adli GitHub job eklense yeterlidir; icindeki adimlar birbirini
sirali olarak kapatiyor. Ancak bazi ekipler adimlari ayri check olarak da kayit edebilir; bu tercih
Prompt 6-impl'de sekillenir.

---

## 3. CODEOWNERS — onerilen icerik

CODEOWNERS dosyasi `.github/CODEOWNERS` konumunda olacak. Her satir bir glob kalibini bir veya bircok
sahibe esler; PR'daki degisiklik o kalibe giriyorsa ilgili sahip otomatik review istegine eklenir.

Asagidaki taslak, tek moderatorlu repoyu yansitir. `@karacaismail` her sey icin birincil sahip;
ileride ekip buyurse ek kullanici satirlara eklenir.

```
# Varsayilan — eslesmeyenler buraya duser
*                          @karacaismail

# Zod semalari (dogrudan degistirilirse tip denetimi kopyasi bozulabilir)
src/schemas/               @karacaismail

# Veri dosyalari (JSON-as-DB; yasadisi duzenleme icerik kapısını kirabilir)
src/data/                  @karacaismail

# AI uretim araclari (swarm/agent/ingest; yan etki yuklu)
tools/                     @karacaismail

# CI/CD workflow'lari (branch protection bypass riski)
.github/                   @karacaismail

# Governance ve politika belgeleri
docs/                      @karacaismail
```

Ek not: `src/data/` altindaki JSON dosyalari `check-content.mjs`, `check-ruleset.mjs` ve
`check-surface.mjs` kapilariyla da korunuyor. CODEOWNERS katmani buna ek bir insan onayi kapidir.

---

## 4. PR Template — taslak

Asagidaki taslak `.github/PULL_REQUEST_TEMPLATE.md` konumuna yazilacak.

```markdown
## Amac

Bu PR neyi degistiriyor ve neden gerekli?

## Degisiklik tipi (birden fazla isaretlenebilir)

- [ ] Hata duzeltme (bug fix)
- [ ] Yeni ozellik (feature)
- [ ] Veri guncellemesi (src/data/ veya docs/)
- [ ] Sema guncellemesi (src/schemas/)
- [ ] Arac/script (tools/)
- [ ] Yapilandirma / CI (*.config.*, .github/)
- [ ] Dokumantasyon
- [ ] Refactor (davranis degismez)

## Test kanitlari

Lokal olarak ne calistirdin ve sonuclari neler?

```
npm run typecheck
npm run lint
npm test
npm run test:content
npm run test:e2e
```

(Ciktiyi buraya yapistir veya "CI yesildir" yaz.)

## CI kapisi kontrol listesi

- [ ] `typecheck` yesil
- [ ] `lint` (biome) yesil
- [ ] `test:content` (422 dugum icerik kapisi) yesil
- [ ] `check-ruleset` (ECA katalog) yesil
- [ ] `check-surface` (Surface/Workflow katalog) yesil
- [ ] `quality-lint` (audit golden + koken) yesil
- [ ] `test` (birim testler) yesil
- [ ] `test:e2e` (Playwright + axe WCAG 2.2) yesil
- [ ] `build` yesil

## Risk ve geri alma plani

Bu degisiklik hangi riski tasıyor? Bozulursa nasil geri alinir?

## Ekran goruntusu / link (opsiyonel)

UI degisikliklerinde once/sonra gorsel ekle.

## AI-uretim notu (varsa)

Bu degisiklik AI tarafindan onerildi mi? Insan hangi adimi denetledi?
```

---

## 5. Issue Template'leri — taslaklar

Uc sablona ihtiyac var: hata bildirimi, ozellik istegi ve actionplan'a ozel "yeni WBS dugumu onerisi".
Her sablon `.github/ISSUE_TEMPLATE/` klasorune yazilacak.

### 5a. bug.yml

```yaml
name: Hata bildirimi
description: Bozuk davranis veya beklenmedik sonuc icin
labels: ["type:bug"]
body:
  - type: textarea
    id: summary
    attributes:
      label: "Ozet"
      description: "Ne bozuk?"
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: "Yeniden uretme adimlari"
      placeholder: "1. ... 2. ... 3. ..."
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: "Beklenen davranis"
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: "Gercek davranis"
    validations:
      required: true
  - type: input
    id: env
    attributes:
      label: "Ortam (tarayici, OS, node surumu)"
  - type: textarea
    id: logs
    attributes:
      label: "Konsol ciktisi / ekran goruntusu (opsiyonel)"
```

### 5b. feature.yml

```yaml
name: Ozellik istegi
description: Yeni islevsellik veya iyilestirme onerisi
labels: ["type:feature"]
body:
  - type: textarea
    id: problem
    attributes:
      label: "Cozulmek istenen sorun"
      description: "Bu eksiklik/surtunme sizi nasil etkiliyor?"
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: "Onerilen cozum"
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: "Dusundugunuz alternatifler"
  - type: dropdown
    id: phase
    attributes:
      label: "Ilgili roadmap faziyla uyumu"
      options:
        - "Faz 0 — sorgu/filtre altyapisi"
        - "Faz 1 — tablo + kayitli gorunumler"
        - "Faz 2 — toplu duzenleme"
        - "Faz 3 — Gantt / zaman cizelgesi"
        - "Faz 4 — workload / kapasite"
        - "Faz 5 — raporlar"
        - "Faz 6 — takvim + portfoy"
        - "Faz 7 — AI ajan koprusu"
        - "Belirli bir faz yok"
```

### 5c. wbs-node.yml (actionplan'a ozel)

```yaml
name: Yeni WBS dugumu onerisi
description: src/data/ agacina yeni bir TaskNode eklenmesi veya mevcut dugumun duzenlenmesi
labels: ["type:wbs-node", "area:data"]
body:
  - type: input
    id: title
    attributes:
      label: "Dugum basligi"
    validations:
      required: true
  - type: dropdown
    id: level
    attributes:
      label: "WBS seviyesi"
      options:
        - "app (dag)"
        - "module (kaya)"
        - "archetype (buyuk tas)"
        - "stone (orta tas)"
        - "molecule (kucuk tas)"
        - "element (toz tanesi)"
        - "atom"
    validations:
      required: true
  - type: dropdown
    id: phase
    attributes:
      label: "Baslangic faziyla iliskisi"
      options:
        - "requirements"
        - "test-plan"
        - "db-schema"
        - "development"
        - "test-qa"
        - "verification"
        - "release-maintenance"
  - type: dropdown
    id: priority
    attributes:
      label: "Oneri onceligi"
      options:
        - "low"
        - "medium"
        - "high"
        - "critical"
  - type: textarea
    id: rationale
    attributes:
      label: "Neden eklenmeli? (roadmap/enterprise uyumu)"
    validations:
      required: true
  - type: textarea
    id: dimensions
    attributes:
      label: "Hangi 14 boyut etkilenecek?"
      placeholder: "featureDefs, security, wcag ... (bos birakabilirsiniz)"
  - type: checkboxes
    id: quality_gate
    attributes:
      label: "Icerik kalite on kontrolu (onerici doldurur)"
      options:
        - label: "Kalip imzasi icermiyor (orijinal icerik)"
        - label: "Capraz-tekrar yok"
        - label: "Audit skoru >= 2.0 bekleniyor"
```

---

## 6. Labels — onerilen etiket seti

Etiketler dort eksende gruplanir: tip (ne), oncelik (ne kadar acil), faz (nerede) ve alan (nerede repo'da).
Bu gruplar `src/schemas/task.ts` icindeki enum'larla hizalidir.

Tip — degisikligin niteligini anlatir.

| Etiket | Renk (hex) | Aciklama |
| --- | --- | --- |
| type:bug | #d73a49 | Hata veya bozuk davranis |
| type:feature | #0075ca | Yeni islevsellik |
| type:wbs-node | #e4e669 | Yeni WBS dugumu onerisi |
| type:refactor | #cfd3d7 | Davranis degismeyen yeniden yapilandirma |
| type:docs | #0075ca | Dokumantasyon degisikligi |
| type:ci | #e99695 | CI/CD veya workflow degisikligi |
| type:schema | #f9d0c4 | Zod sema degisikligi |
| type:data | #fef2c0 | src/data/ JSON degisikligi |
| type:security | #d93f0b | Guvenlik ile ilgili |

Oncelik — `PRIORITY_LIST` enum'uyla (`low`, `medium`, `high`, `critical`) bire-bir eslenir.

| Etiket | Renk (hex) | Aciklama |
| --- | --- | --- |
| priority:low | #e4e669 | Dusuk oncelik |
| priority:medium | #fbca04 | Orta oncelik |
| priority:high | #e99695 | Yuksek oncelik |
| priority:critical | #b60205 | Kritik; bloklayici |

Faz — `WATERFALL_PHASES` ile eslenir; issue'nun hangi waterfall kapısında oldugunu gosterir.

| Etiket | Renk (hex) | Aciklama |
| --- | --- | --- |
| phase:requirements | #c2e0c6 | Gereksinim fazinda |
| phase:test-plan | #c2e0c6 | Test planlama fazinda |
| phase:db-schema | #c2e0c6 | Sema tasarim fazinda |
| phase:development | #0052cc | Gelistirme fazinda |
| phase:test-qa | #0052cc | Test/QA fazinda |
| phase:verification | #0052cc | Dogrulama fazinda |
| phase:release | #5319e7 | Yayin/bakim fazinda |

Alan — repo'nun hangi bolumunu etkiler.

| Etiket | Renk (hex) | Aciklama |
| --- | --- | --- |
| area:data | #fef2c0 | src/data/ JSON'lari |
| area:schema | #f9d0c4 | src/schemas/ |
| area:engine | #bfd4f2 | src/engine/ (hesap/mantik) |
| area:ui | #bfd4f2 | src/components/, src/views/ |
| area:tools | #c5def5 | tools/ uretim araclari |
| area:ci | #e99695 | .github/workflows/ |
| area:docs | #cfd3d7 | docs/ |
| area:eca | #d4c5f9 | ECA/ruleset katalog |
| area:surface | #d4c5f9 | Surface/Workflow katalog |

Durum etiketleri — triage ve is akisi icin.

| Etiket | Renk (hex) | Aciklama |
| --- | --- | --- |
| status:triage | #ededed | Henuz siniflandirilmadi |
| status:blocked | #e4e669 | Baska bir issue bekliyor |
| status:wont-fix | #cfd3d7 | Yapilmayacak |
| status:duplicate | #cfd3d7 | Yinelenen |
| status:ai-suggested | #0075ca | AI tarafindan onerilen (insan onaylanacak) |

`status:ai-suggested` etiketi kurumsal kural acısından onemlidir: AI'nin acip kapattigi issue'lar
izlenebilir olur; insan onay akisi gozlemlenebilir hale gelir.

---

## 7. Milestones — kilometre taslari

Kilometre taslari `docs/roadmap-pm-paritesi.md`'daki faz haritasiyla hizalidir. Her milestone
bir GitHub Milestone olarak tanimlanir; PR'lar ve issue'lar ilgili milestone'a atanir.

| Milestone | Kapsam (roadmap faziyla eslesmesi) | Hedef ufuk |
| --- | --- | --- |
| v0.2 — Sorgu & Gorunum Altyapisi | Faz 0: query engine, SavedView, assignees, people | Yakin |
| v0.3 — Tablo & Filtre DSL | Faz 1: tablo gorunumu, filtre DSL, kayitli gorunumler | Yakin |
| v0.4 — Toplu Duzenleme | Faz 2: bulk edit | Yakin |
| v0.5 — Gantt & Workload | Faz 3 + 4: Gantt/zaman cizelgesi + kapasite | Yakin |
| v0.6 — Raporlar | Faz 5: milestone/faz/efor/akis raporlari | Yakin |
| v0.7 — Takvim & Portfolyo | Faz 6: takvim, hedef rollup, aktivite gunlugu | Orta |
| v1.0 — PM Paritesi | Faz 0-6 tamamlandi; kararsiz API yok; production-ready | Orta |
| v1.1 — AI Ajan Koprusu | Faz 7: audit-guidumlü kuyruk, ECA what-if, ArcheType editor | Uzak |

Mevcut `package.json` surumu `0.1.0`'dir. v0.2'ye gecis ilk milestone merge'idir.

---

## 8. Release Policy — surumleme, changelog, tag, deploy

### Surumleme

Repo Semantic Versioning (semver) kullanir: `MAJOR.MINOR.PATCH`.

- MAJOR: geriye uyumsuz sema degisikligi (Zod semalari, JSON-as-DB yapisi).
- MINOR: geriye uyumlu yeni islevsellik (yeni gorunum, yeni alan, yeni kapı).
- PATCH: hata duzeltme, belge guncellemesi, CI iyilestirme.

Sema degisiklikleri (src/schemas/) MINOR veya MAJOR'dir; yeni alan eklenmesi default degeriyle
MINOR'dir, alan kaldirma/yeniden adlandirma MAJOR'dir.

### Changelog

Her release icin `CHANGELOG.md` guncellenmeli; format: Keep a Changelog. Buyuk PR'larda
`## [Unreleased]` bolumu girilir; merge oncesi tasinan surume terfi ettirilir.

Giris formati:

```
## [0.2.0] - 2026-07-xx
### Added
- query engine; SavedView; assignees; people.json
### Changed
- ...
### Fixed
- ...
```

### Tag & deploy iliskisi

1. PR main'e merge edilir.
2. CI `deploy.yml` otomatik tetiklenir (push: main).
3. Tum kapılar yesil olursa `build` job tamamlanir, `deploy` job Pages'e yukler.
4. Yayın oncesi sürüm etiketi (`git tag vX.Y.Z`) insan tarafindan atilir; GitHub Release notu
   CHANGELOG'dan kopyalanir.
5. Tag, CI'yi tekrar tetiklemez (sadece `push: branches: [main]` tetikler); tag yalnizca izleme
   ve GitHub Releases arabirim icin vardir.

Kurallar:
- Tag `main` uzerindeki bir commit'e atilir; baska branch'e tag atilmaz.
- `v0.x` serisinde deploy her push'ta olur; yayın notu sonradan da eklenebilir.
- `v1.0` ve sonrasinda sürüm etiketi olmayan commit yayinda kalir ama "tagged release" sayilmaz.

---

## 9. Pages / Deploy Politikasi

### Hangi branch deploy eder

Sadece `main` branch deploy eder. `deploy.yml`'deki `on.push.branches: [main]` bunu zorunlu kilar.
Baska branch'ler (feature, fix, ai/*) asla deploy etmez.

### spa404.mjs'nin policy'deki yeri

`npm run build` komutu `vite build && node tools/spa404.mjs` seklinde tanimlidir. `spa404.mjs`
dist/ icine GitHub Pages'in `404.html` sca fallback mekanizmasiyla uyumlu bir yonlendirme dosyasi
uretir. Bu dosya olmadan SPA'nin deep-link'leri (orn. `/actionplan/node/abc`) GitHub Pages'te
404 ile sonuclanir.

Policy kurali: `spa404.mjs` build adiminin zorunlu parcasidir; kaldirilamaz veya devredisi birakilamaz.
Bu aracin ciktisi CI kapilari tarafindan dolaylı olarak dogrulanır: build adimi bu script'i calistirmadan
`dist/` tamamlanmaz, Pages artifact'ı yuklenemez.

### Base path

Uretim derlemesi `BASE_PATH=/actionplan/` env degiskeniyle calistirilir. Bu deger `vite.config.ts`
icindeki `base` ayariyla eslesmeli; eslesme bozulursa statik varliklar 404 verir.

### Preview degil, production

`npm run preview` lokal test icin kullanilir; CI veya deploy akisinda yer almaz. CI uretim
derlemesi yalnizca `npm run build`'dir.

---

## 10. Branch Protection'i Uygulamak icin GitHub API Referansi

Bu bolum Prompt 6-impl adiminda calistirilacak API cagrilarini belgelemektedir. Burada sadece
"ne cagirilacak" ve hangi parametreler gecilecek yazilir; calistirilmaz.

### 10.1 Branch protection kuralini olusturma/guncelleme

```
PUT /repos/{owner}/{repo}/branches/{branch}/protection

owner : karacaismail
repo  : actionplan
branch: main
```

Gonderi govdesi (JSON):

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "build"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
```

Not: `contexts` listesinde GitHub, bir workflow icindeki job adini gorur. `deploy.yml`'de job adi
`build`'dir; bu deger GitHub Required Status Checks arabiriminde gosterilen isimle eslesmeli.
Workflow ilk kez calistiktan sonra GitHub bu job adini otomatik tanimlar.

### 10.2 Branch protection kuralini okuma (dogrulama)

```
GET /repos/{owner}/{repo}/branches/{branch}/protection
```

### 10.3 Label olusturma

Her etiket icin:

```
POST /repos/{owner}/{repo}/labels

{ "name": "type:bug", "color": "d73a49", "description": "..." }
```

Var olan etiketi guncelleme:

```
PATCH /repos/{owner}/{repo}/labels/{name}
```

### 10.4 Milestone olusturma

```
POST /repos/{owner}/{repo}/milestones

{ "title": "v0.2 — Sorgu & Gorunum Altyapisi", "state": "open", "description": "..." }
```

### 10.5 Gerekli kimlik dogrulama

Tum API cagirilari `Authorization: Bearer <GITHUB_TOKEN>` basligini gerektirir. Token'in
`repo` ve `admin:repo_hook` kapsamlari olmali; eger Organizations araciligıyla yonetiliyorsa
`admin:org` da gerekebilir.

Prompt 6-impl'de bu cagrilar bir kabuk scripti veya GitHub CLI (`gh`) komutu olarak uygulanacak.
Ornek `gh` karsiligi:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/karacaismail/actionplan/branches/main/protection \
  --input branch-protection.json
```

---

## Aktörler ozeti

Bir degisikligin yasam dongusunu tanimlamak icin aktörlerin sorumluluklarini acikca belirtmek
gerekir:

CI (GitHub Actions) ne yapar: deploy.yml'deki tum sekiz kapıyı calistirir; hepsi yesil olursa
deploy eder; herhangi biri kirmiziysn deploy durur; CI asla main'e dogrudan push etmez.

Insan ne yapar: feature branch'ini denetler; CI ciktisini okur; PR'i acip review eder; branch
protection uyarinca tek onaylayan olarak merge tiklarina basar; release etiketini atar; CODEOWNERS
araciligiyla kritik alanlarda zorunlu onaylayicidir.

AI ne yapar: feature branch'inde (asla main'de) kod onerir veya commit yapar; PR acabilir ancak
merge edemez; issue onerisi `status:ai-suggested` etiketiyle isaretlenir; ana veri/sema
degisikliklerini insan onaysiz main'e ulastiramaz.

---

*Bu belge salt tasarim/referans amaclidir. Dosyalarin gercek olusturulmasi (CODEOWNERS,
PULL_REQUEST_TEMPLATE.md, ISSUE_TEMPLATE/*.yml, CONTRIBUTING.md, SECURITY.md) ve branch
protection API cagrisi Prompt 6-impl adiminda yapilacak.*
