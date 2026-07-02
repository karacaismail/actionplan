# Deploy Ayrımı Runbook'ları — Docs Deploy vs Product Deploy (3 Ayrı Runbook)

**Tarih:** 2026-07-02
**Durum:** Taslak runbook (kilitlenmeyi bekliyor — bkz. §15 Definition of Done)
**Kaynak/bağlam:** `core-contract-pack.md §3.7` (Release ve Deploy Standardı), `core-contract-pack.md §2.8 / §3.3` (Migration Policy, expand-contract + downgrade), `core-contract-pack.md §3.0.1` (ortak AI-güvenlik invariantı), `adr-0026-tech-profiles.md` (frontend stack profilleri; actionplan = tooling, ürün = saas-app), `.github/workflows/deploy.yml` (docs-viewer CI+Pages akışı), `release-policy.md` (semver/tag/deploy ilişkisi, SPA404 notu).
**İlişki:** Bu doküman `release-policy.md`'nin kardeşidir: o *sürümleme/etiketleme* eksenini, bu doküman *deploy hedefi/aktör/kapı/rollback* eksenini yönetir. Bu doküman **kod yazmaz**, generator/git akışı tanımlamaz; üç deploy hedefinin (docs-viewer, local generated product, Hetzner production) yürütme runbook'unu normatif olarak sabitler. En kritik netlik: **GitHub Pages bu repoda yalnız docs-viewer yayınıdır; üretilecek SaaS/ürün için GitHub Pages bir PRODUCTION DEPLOY DEĞİLDİR.** İkisini karıştırmak §14'te yasaklanır.

---

## 1. Amaç

Bu runbook seti, birbirinden farklı üç deploy hedefinin aktör-açık (kim / ne / CI / insan-onayı) yürütme adımlarını, geçiş kapılarını ve geri-alma (rollback) yollarını sabitler. Hedef: "deploy" sözcüğünün üç ayrı anlamının (dokümantasyon sitesi yayını, geliştirici makinesinde üretilen ürünü koşma, Hetzner üretimine ürün dağıtımı) tek bir akışta karışmasını önlemek. Kullanıcının gerçek ortamı temel alınır: **geliştirme = macOS (Apple M4)**, **üretim = Hetzner Debian Linux (AMD EPYC)**, **kaynak = GitHub private repo**. Aktör-açık ifade: *ajan* deploy'u öneremez-uygulayamaz düzeyinde değildir — ajan PR açar ve runbook önerir (draft); *insan* inceler ve onaylar; *CI* kapıları doğrular; *deploy motoru/operatör* onaylı sürümü deterministik ve geri-alınabilir uygular. Hiçbir deploy insan onay kapısı olmadan üretim durumunu değiştirmez.

## 2. Kapsam

Bu runbook seti şunları kapsar: (1) **Docs-viewer publish** runbook'u — actionplan sitesinin (Vite build → GitHub Actions → GitHub Pages) yayını; (2) **Local generated product run** runbook'u — geliştirici makinesinde (macOS M4) üretilen ürünün `docker compose` ile koşulması (PostgreSQL/Redis/MinIO/FastAPI/React/worker); (3) **Hetzner production deploy** runbook'u — GitHub private repo'dan Hetzner Debian üzerine Docker + Caddy (reverse proxy/TLS) + OTA ile üretim dağıtımı (secrets/KMS, migration expand-contract + downgrade, blue-green/rolling, healthcheck, rollback); (4) hangi runbook'un ne için olduğunu ve hangisinin production sayıldığını gösteren **ayrım tablosu**; (5) docs-deploy ≠ product-deploy **çelişki/yasak notu**; (6) her runbook için **AI guardrail** sınırı. Reconcile referansları (ADR-0026 stack, core-contract-pack §3.7 deploy) ilgili bölümlerde verilir.

## 3. Non-goals

Bu runbook seti şunları **kapsamaz**: (1) Kod/generator akışı — hiçbir dosya üretilmez; runbook yalnız yürütme sözleşmesini tarif eder. (2) Git dallanma/PR mekaniği detayı — o `release-policy.md` ve `ci-conformance-gates.md`'nindir; bu doküman yalnız "deploy hangi tetikleyiciyle, hangi kapıdan geçer" eksenini tutar. (3) Sürüm numaralama/changelog/tag politikası — `release-policy.md`'ye REFERANS verilir, tekrar edilmez. (4) Kernel sözleşme içeriği (tenant/authz/audit/migration primitif imzaları) — `core-contract-pack.md §2`'ye REFERANS verilir. (5) Somut altyapı sağlayıcı komut çıktısı/mock değer — çıplak örnek gösterilmez; runbook adım + aktör + kapı düzeyinde tarif edilir. (6) İzleme/gözlemlenebilirlik backend kurulumu — `core-contract-pack.md §2.9`'a bırakılır; buradaki healthcheck yalnız deploy-kapısı bağlamındadır.

## 4. Tanım (nedir / ne yapar / ne yapmaz)

**Nedir:** Bu doküman, üç ayrı deploy hedefi için üç ayrı runbook'tur. Bir runbook = belirli bir hedefe (docs-viewer / local product / Hetzner production) yönelik, aktör-açık adım dizisi + geçiş kapısı + rollback yolu.

**Ne yapar:** Her deploy hedefini kendi tetikleyicisi, aktörü, CI kapısı, insan-onay noktası ve geri-alma yoluyla ayrı tanımlar; hangi hedefin production sayıldığını tek tabloda netleştirir; docs-deploy ile product-deploy'un karışmasını yasak olarak sabitler; her hedefte AI'ın sınırını (öneri/PR evet, doğrudan deploy/secret hayır) tekrar eder.

**Ne yapmaz:** Kod/manifest üretmez; git akışı yeniden tanımlamaz; sürüm politikası yazmaz (referans verir); GitHub Pages'i ürün için bir production hedefi *olarak sunmaz* (aksine, bunu açıkça reddeder); AI'a üretime doğrudan yazma/secret görme yetkisi *vermez*; insan onayı olmayan bir yolu (özellikle `main`'e insan-onaysız push veya onaysız production apply) *açmaz*.

## 5. Aktör sözlüğü ve ortam matrisi

Aşağıdaki iki tablo, üç runbook boyunca kullanılan aktör rollerini ve hedef ortamların gerçek donanım/altyapı bağlamını sabitler; runbook adımları bu rollere ve ortamlara atıfla yazılır.

Bu tablo runbook'lardaki aktör rollerini ve her rolün deploy bağlamındaki sorumluluğunu tanımlar.

| Aktör | Rol | Deploy bağlamındaki sorumluluk |
|---|---|---|
| Geliştirici (insan) | macOS M4 üzerinde çalışan yetkili kişi | Local product'ı koşar; PR açar/onaylar; production deploy'u tetikler ve onaylar |
| Operatör (insan) | Üretim erişimi olan yetkili kişi | Hetzner production deploy'unu yürütür/onaylar; rollback kararını verir; secrets/KMS erişimine sahiptir |
| AI ajan (öneri motoru) | Öneri/taslak üretici | PR açar, runbook/diff önerir, dry-run simüle eder; deploy uygulayamaz, secret göremez, `main`'e push edemez |
| CI (GitHub Actions) | Otomatik doğrulama | Kapıları çalıştırır (docs-viewer'da 19 kapı + build; production'da migration/smoke); kırmızı kapı deploy'u bloklar |
| Docs-viewer motoru | GitHub Actions + Pages | actionplan sitesini build eder ve Pages'e yayınlar (yalnız docs) |
| Deploy motoru/pipeline | Production dağıtım hattı | Onaylı ürün sürümünü Hetzner'a Docker + Caddy + OTA ile deterministik uygular; healthcheck + rollback yürütür |

Bu tablo üç deploy hedefinin gerçek ortam/donanım/altyapı bağlamını tanımlar; her runbook kendi satırına uyar.

| Hedef | Ortam / donanım | Altyapı | Kaynak |
|---|---|---|---|
| Docs-viewer publish | GitHub Actions runner (ubuntu-latest) → GitHub Pages | Vite statik build; Pages CDN | `karacaismail/actionplan` (public docs sitesi) |
| Local generated product run | Geliştirici makinesi — macOS (Apple M4, arm64) | Docker Desktop / `docker compose` (PostgreSQL + Redis + MinIO + FastAPI + React + worker) | Üretilen ürün kaynağı (yerel çalışma kopyası) |
| Hetzner production deploy | Hetzner sunucu — Debian Linux (AMD EPYC, amd64) | Docker + Caddy (reverse proxy/TLS) + OTA; PostgreSQL/Redis/MinIO servis/managed | GitHub **private** repo (ürün monorepo) |

## 6. Runbook 1 — Docs-viewer Publish (actionplan sitesi)

**Nedir:** actionplan dokümantasyon/planlama sitesinin (WBS görüntüleyici, JSON-driven Vite+React uygulaması) GitHub Pages'e yayınıdır. **Bu bir üretim ürünü değil, bir iç araç/döküman görüntüleyicidir** (ADR-0026: actionplan = `tooling` profili).

**Ne yapar / ne yapmaz:** actionplan'ın statik build'ini Pages'e taşır; ürün/SaaS'ı deploy *etmez*, kullanıcı verisi/tenant/secret taşımaz.

**Tetikleyici ve aktör:** `main`'e push (insan merge sonrası) → CI (GitHub Actions) → docs-viewer motoru (Pages). PR'da yalnız build çalışır, deploy YOK. Kaynak gerçeği: `.github/workflows/deploy.yml`.

Bu tablo docs-viewer publish adımlarını aktör, kapı ve çıktı ile sırayla tanımlar.

| # | Adım | Aktör | Kapı (geçiş koşulu) |
|---|---|---|---|
| 1 | Feature branch'ten PR aç | Geliştirici / AI ajan (PR açabilir) | PR CI'da yalnız `build` job çalışır (deploy YOK) |
| 2 | 19 bloklayıcı kapı + build doğrula | CI | tip/lint/içerik/ruleset/surface/tech-profile/standart/i18n/kernel-sözleşme/audit/veri-kalite/yürütme-hazırlığı/DoR/scale-invariant/birim/E2E+axe hepsi yeşil |
| 3 | PR'ı incele ve `main`'e merge et | Geliştirici (insan) | İnsan onayı zorunlu; doğrudan `main` commit yasak (`release-policy §Tag/deploy`) |
| 4 | `main` push → build job (tüm kapılar tekrar) | CI | Üretim derlemesi `BASE_PATH=/actionplan/` + `spa404.mjs` tamamlanır |
| 5 | Pages artefaktını yükle + Pages'e dağıt | Docs-viewer motoru | `deploy` job yalnız `github.event_name != 'pull_request'` iken; `environment: github-pages` |
| 6 | Yayın doğrula: site açılır, deep-link 404 vermez | Geliştirici (insan) | `karacaismail.github.io/actionplan` yüklenir; SPA fallback çalışır |
| 7 | (Opsiyonel) sürüm etiketi at | Geliştirici (insan) | `release-policy §Tag`; tag CI'yi tetiklemez, izleme amaçlı |

**Geçiş kapısı özeti:** Herhangi bir kapı kırmızıysa merge ve deploy engellenir (`deploy.yml`: gateler BLOKLAYICI). `concurrency: group=pages, cancel-in-progress=false` — eşzamanlı yayınlar sıraya alınır, yarıda kesilmez.

**Rollback:** Docs-viewer'da rollback = kaynak-kontrollü. Bozuk yayın için (a) hatayı düzelten yeni PR merge edilir (ileri-onarım, tercih edilen), veya (b) sorunlu commit `git revert` ile geri alınır ve `main`'e (insan merge'iyle) push edilerek Pages otomatik yeniden yayınlanır. Pages'in kendisinde ayrı bir "önceki artefakta dön" düğmesi bu akışın parçası değildir; kaynak `main` her zaman yayının doğruluk kaynağıdır. `BASE_PATH` / `vite.config.ts base` eşleşmesi bozulursa statik varlıklar 404 verir; onarım bu eşleşmeyi düzeltir (`release-policy §Pages/SPA404`).

## 7. Runbook 2 — Local Generated Product Run (macOS M4 geliştirici makinesi)

**Nedir:** Üretilen SaaS/ürün monorepo'sunun, geliştirici makinesinde (macOS, Apple M4) `docker compose` ile ayağa kaldırılıp koşulmasıdır. **Bu bir deploy değil, yerel yürütmedir**; hiçbir dış kullanıcıya/üretime dokunmaz.

**Ne yapar / ne yapmaz:** Ürün servislerini (PostgreSQL, Redis, MinIO, FastAPI, React, worker) yerelde birlikte koşar; geliştirme/doğrulama sağlar. Üretime dağıtım *değildir*; `karacaismail.github.io/actionplan` ile ilgisi *yoktur*.

**Tetikleyici ve aktör:** Geliştirici (insan), yerel terminalden. CI zorunlu değildir (yerel); yine de commit-öncesi kapılar (birim/lint) yerelde çalıştırılabilir.

Bu tablo local product run adımlarını aktör ve doğrulama kapısı ile sırayla tanımlar.

| # | Adım | Aktör | Kapı (doğrulama) |
|---|---|---|---|
| 1 | Ürün monorepo çalışma kopyasını hazırla | Geliştirici (insan) | Doğru branch; `.env` yereldir, örnek şablondan türetilir, repoya girmez |
| 2 | Yerel secret/config'i hazırla (dev değerleri) | Geliştirici (insan) | Yerel secret'lar geliştirme-amaçlı; üretim secret'ı yerelde bulunmaz; AI bu değerleri göremez |
| 3 | `docker compose up` ile servisleri başlat | Geliştirici (insan) | PostgreSQL + Redis + MinIO + FastAPI + React + worker konteynerleri ayağa kalkar (arm64 imajlar) |
| 4 | Şema migration'ını uygula (yerel DB) | Geliştirici (insan) | `alembic upgrade head` yerel PostgreSQL'e uygulanır (`core-contract §2.8`) |
| 5 | Sağlık kontrolü | Geliştirici (insan) | `/healthz` ve `/ready` `status: ok`; MinIO/Redis erişilebilir |
| 6 | Uygulamayı yerel doğrula | Geliştirici (insan) | React arayüzü açılır; kritik GraphQL sorgusu geçerli JWT + `X-Tenant-ID` ile döner (`core-contract §4 Adım 6`) |
| 7 | Durdur / temizle | Geliştirici (insan) | `docker compose down` (gerekirse `-v` ile volume temizliği); yerel veri üretime taşınmaz |

**Not (mimari uyum):** Servis kümesi ve stack kısıtları `core-contract-pack §1` ile uyumludur (PostgreSQL zorunlu; Supabase/Next yasak). Frontend `saas-app` tech-profili (Vite+React19+TS, Radix headless, SCSS) ile üretilir (ADR-0026); yerel koşu bu profili değiştirmez.

**Rollback:** Yerelde rollback ucuzdur ve üretimi etkilemez: (a) `docker compose down` ile durdur; (b) bozuk migration için `alembic downgrade -1` (dolu `downgrade()` zorunlu — `core-contract §3.3`); (c) gerekirse volume'ları sıfırla ve temiz durumdan `up`. Yerel çöküş üretimde bir olay değildir; hiçbir kullanıcı etkilenmez.

## 8. Runbook 3 — Hetzner Production Deploy (Debian, private repo)

**Nedir:** Üretilen ürünün GitHub **private** repo'dan Hetzner sunucusuna (Debian Linux, AMD EPYC) Docker + Caddy (reverse proxy/TLS) + OTA ile üretime dağıtımıdır. **Tek gerçek production hedefi budur** (`core-contract-pack §3.7`).

**Ne yapar / ne yapmaz:** Onaylı ürün sürümünü canlıya alır; healthcheck + rollback ile korur. AI tarafından *tetiklenmez/uygulanmaz*; insan onayı olmadan production durumu *değişmez*.

**Tetikleyici ve aktör:** Operatör/geliştirici (insan) `main`'e merge ve production release'i onaylar → deploy motoru/pipeline uygular. AI ajan yalnız hazırlık PR'ı/diff önerir (draft); apply insan onayına bağlıdır.

Bu tablo Hetzner production deploy adımlarını aktör, kapı ve geri-alma bağlantısıyla sırayla tanımlar.

| # | Adım | Aktör | Kapı (geçiş koşulu) |
|---|---|---|---|
| 1 | Hazırlık PR'ı (kod/migration/compose diff) | Geliştirici / AI ajan (öneri) | PR CI yeşil; en az 1 reviewer (`core-contract §3.7`); doğrudan `main` yasak |
| 2 | `main`'e merge + production release onayı | Geliştirici/Operatör (insan) | İnsan onayı zorunlu; onay referansı (kim/zaman/gerekçe) kayıtlı (`§3.0.1 approval_ref`) |
| 3 | Image build + private registry'ye push | Deploy motoru | Docker multi-stage; üretim image ≤150 MB (`core-contract §3.7`); imaj imzalı/etiketli |
| 4 | Secrets/KMS enjeksiyonu | Deploy motoru | Secret'lar KMS/secret-store'dan runtime'a; repoya/imaja gömülmez; AI erişemez |
| 5 | Migration (expand aşaması) | Deploy motoru (init container) | `alembic upgrade head`; expand-only (yeni kolon `nullable`/default); başarısız = deploy iptal + otomatik rollback (`core-contract §2.8/§3.3`) |
| 6 | Yeni sürümü getir (blue-green / rolling) | Deploy motoru | Yeni renk/replika ayağa kalkar; Caddy trafiği henüz eski sürümde |
| 7 | Healthcheck + smoke test | Deploy motoru + CI | `/healthz` liveness + `/ready` readiness yeşil; 10 kritik GraphQL smoke sorgusu geçer (`core-contract §3.7`) |
| 8 | Trafik geçişi (cutover / canary) | Operatör (insan onayı) + deploy motoru | Caddy yeni sürüme yönlendirir; canary %5 → hata oranı >%0.1 ise otomatik rollback |
| 9 | Contract aşaması (sonraki release) | Deploy motoru | Tüm instance yeni kolondan okuyunca eski yapı kaldırılır; expand ve contract asla aynı deploy'da değil |
| 10 | OTA/yayın kaydı | Deploy motoru | Sürüm OTA kanalına işlenir; audit'e düşer (append-only) |

**Geçiş kapısı özeti (production):** Migration başarısız → deploy durur, otomatik rollback (`core-contract §2.8`). Smoke test başarısız → önceki sürüme döner (`core-contract §3.7 Smoke test`). Canary hata oranı >%0.1 → otomatik rollback (`§3.7 Canary`). TLS/reverse-proxy Caddy tarafından; secret KMS'ten; hiçbiri imaja gömülmez.

**Rollback:** İki katmanlı. (a) **Trafik katmanı:** blue-green'de Caddy önceki renge anında geri döner (yeni renk canlıya alınmadan doğrulandığı için kesintisiz); rolling'de sağlıksız replika geri sarılır. (b) **Şema katmanı:** expand-contract sayesinde eski sürüm hâlâ eski+yeni kolonu okuyabilir; acil durumda `alembic downgrade -1` (dolu `downgrade()` CI'da test edilmiş — `core-contract §3.3`) ve önceki imaja dönülür. Rollback kararı Operatör'ündür (insan); AI rollback'i öneremez-uygulayamaz düzeyinde değildir ama uygulayan insandır. Her rollback audit'lenir.

## 9. Ayrım tablosu (hangi runbook ne için — hangisi production)

Aşağıdaki tablo üç runbook'u yan yana koyar ve hangisinin production sayıldığını netleştirir; bu tablo dokümanın kritik netlik omurgasıdır ve §14 yasağının dayanağıdır.

Bu tablo üç deploy hedefini tetikleyici, aktör, kapı, rollback ve production statüsüyle karşılaştırır.

| Eksen | Runbook 1: Docs-viewer publish | Runbook 2: Local product run | Runbook 3: Hetzner production deploy |
|---|---|---|---|
| Ne yayınlar | actionplan docs sitesi (statik) | Üretilen ürün (yerel koşu) | Üretilen ürün (canlı) |
| Hedef ortam | GitHub Pages (ubuntu runner → CDN) | macOS M4 (Docker Desktop) | Hetzner Debian (AMD EPYC) |
| Kaynak | `karacaismail/actionplan` (public) | Yerel çalışma kopyası | GitHub **private** repo |
| Tetikleyici | `main` push (merge sonrası) | Geliştirici, yerel terminal | İnsan onaylı release |
| Yürütücü | Docs-viewer motoru (Actions+Pages) | Geliştirici (insan) | Deploy motoru/pipeline |
| CI kapısı | 19 bloklayıcı kapı + build | Yerel/opsiyonel (birim/lint) | Migration + smoke + canary |
| İnsan onayı | PR merge | Doğrudan çalıştıran insan | Merge + release onayı (`approval_ref`) |
| Rollback | Kaynak-kontrollü (revert/ileri-onarım) | `compose down` + `downgrade -1` (yerel) | Blue-green/canary geri + `downgrade -1` |
| Secrets/KMS | Yok (tenant/secret taşımaz) | Yerel dev değerleri | KMS/secret-store (AI erişemez) |
| **Production mu?** | **HAYIR** (docs görüntüleyici) | **HAYIR** (yerel koşu) | **EVET** (tek production hedefi) |

## 10. AI guardrail (autonomy seviyesi)

Aşağıdaki iş bölümü değiştirilemezdir: **AI önerir → insan onaylar → motor uygular.** (`core-contract-pack.md §3.0.1`). Deploy ekseni bu invariantın en hassas uygulama noktasıdır.

Bu tablo üç runbook boyunca AI'ın yapabildiği/yapamadığı sınırları deploy bağlamında tanımlar.

| İşlem | Autonomy | Kural |
|---|---|---|
| PR açma / runbook-diff önerme | `draft` | AI docs veya ürün için PR açar, deploy adımı/diff önerir; kendisi merge/deploy edemez |
| Dry-run / plan simülasyonu | `draft` | AI migration/deploy planını simüle eder, riski işaretler; canlıya uygulayamaz |
| `main`'e push | `none` | AI `main`'e insan-onaysız push edemez; merge insan kararıdır (docs ve ürün için) |
| Production'a deploy (Hetzner) | `none` | AI production deploy tetikleyemez/uygulayamaz; apply yalnız insan onayıyla deploy motoru |
| Secrets / KMS erişimi | `none` | AI secret/KMS değeri göremez/enjekte edemez; secret'lar AI bağlamına girmez |
| Rollback uygulama | `none` (öneri `draft`) | AI rollback *önerebilir*; uygulama Operatör (insan) + deploy motoru işidir |
| Pages/production ayrımını değiştirme | `none` | AI "docs Pages'i production hedefi yapalım" gibi bir öneriyle §14 yasağını gevşetemez |

Mutlak sınırlar: AI hiçbir deploy hedefinde insan onay kapısını atlayamaz; `main`'e insan-onaysız push edemez; production'a doğrudan yazamaz; secret göremez; kanıtsız "deploy edildi/bitti" diyemez. AI'ın tek üretim-yakını yetkisi öneridir: PR + runbook + dry-run çıktısı.

## 11. Bağlama (reconcile: ADR-0026 stack; core-contract-pack §3.7 deploy)

**ADR-0026 bağlama (stack ayrımı):** actionplan = `tooling` profili (Vite+React19+TS, Radix headless, Tailwind tooling'de serbest) → Runbook 1'in yayınladığı sitedir. Üretilen ürün = `saas-app` profili (Vite+React19+TS, Radix headless, SCSS+token, TanStack, i18n zorunlu) → Runbook 2/3'ün koştuğu/dağıttığı üründür. İki profilin karışması ADR-0026'da zaten yasak (headless kilit; Next/Redux/Flowbite/antd/MUI/Chakra/Mantine global yasak); bu runbook o ayrımı *deploy hedefi* eksenine taşır. REFERANS: `adr-0026-tech-profiles.md §2`.

**core-contract-pack §3.7 bağlama (deploy standardı):** Runbook 3'ün adımları (Hetzner+Debian+Docker, init container `alembic upgrade head`, `/healthz`+`/ready`, smoke test 10 GraphQL, canary %5 / >%0.1 rollback, image ≤150 MB, doğrudan `main` yasak) birebir `core-contract-pack §3.7 / §3.3 / §2.8`'den gelir; bu doküman onları tekrar üretmez, aktör-açık runbook'a dizer. REFERANS: `core-contract-pack.md §2.8, §3.3, §3.7, §3.0.1`.

**release-policy bağlama (sürüm/tag):** Runbook 1/3'ün sürüm-etiketleme ve changelog adımları `release-policy.md`'ye bağlanır (semver, tag yalnız `main` commit'ine, tag CI tetiklemez, SPA404 zorunlu). REFERANS: `release-policy.md §Tag/deploy, §Pages/SPA404`.

## 12. Test/doğrulama stratejisi

Aşağıdaki doğrulamalar her runbook'un "çalıştı" iddiasını kanıta bağlar; deploy iddiası kanıtsız kabul edilmez (`core-contract §Notlar: kanıtsız 'bitti' yasak`).

Bu tablo her runbook için zorunlu doğrulama senaryolarını ve türünü tanımlar.

| # | Senaryo | Runbook | Doğrulama türü |
|---|---|---|---|
| 1 | PR'da yalnız build çalışır, deploy YOK; `main` push'ta deploy çalışır | Docs-viewer | CI (workflow koşul kanıtı) |
| 2 | 19 kapıdan biri kırmızıyken merge/deploy bloklanır | Docs-viewer | CI (negatif) |
| 3 | Yayın sonrası deep-link 404 vermez (SPA fallback) | Docs-viewer | Manuel/E2E |
| 4 | `compose up` sonrası `/healthz` + `/ready` yeşil (yerel) | Local product | Manuel/entegrasyon |
| 5 | Yerel `alembic downgrade -1` veri kaybetmeden çalışır | Local product | Entegrasyon |
| 6 | Production migration başarısızsa deploy durur + rollback | Hetzner prod | CI/pipeline (negatif) |
| 7 | Smoke test (10 GraphQL) başarısızsa önceki sürüme döner | Hetzner prod | Pipeline |
| 8 | Canary hata oranı >%0.1 ise otomatik rollback | Hetzner prod | Pipeline (negatif) |
| 9 | AI `main`'e push / production apply / secret erişimi reddedilir | Tümü | Guardrail (negatif) |
| 10 | Docs Pages'in production ürün hedefi *olmadığı* dokümante ve zorlanır | Ayrım | Contract (doküman + review) |

## 13. Acceptance criteria

- Üç runbook (docs-viewer, local product, Hetzner production) ayrı ayrı, her biri aktör-açık (kim/ne/CI/insan-onayı) + adım + kapı + rollback ile tanımlı.
- Docs-viewer runbook'u `.github/workflows/deploy.yml` gerçeğiyle uyumlu: PR = build-only, `main` push = build + Pages deploy, 19 bloklayıcı kapı, `BASE_PATH=/actionplan/`, SPA404 zorunlu.
- Local product runbook'u macOS M4 + `docker compose` (PostgreSQL/Redis/MinIO/FastAPI/React/worker) gerçeğiyle uyumlu; yerel koşunun üretime dokunmadığı açık.
- Hetzner production runbook'u `core-contract-pack §3.7`'ye tam sadık: Debian+Docker+Caddy+OTA, KMS secret, expand-contract + `downgrade -1`, blue-green/rolling, healthcheck, smoke, canary rollback.
- Ayrım tablosu (§9) hangi runbook'un production olduğunu tek bakışta gösterir: yalnız Hetzner = EVET.
- Çelişki/yasak notu (§14) docs-deploy ≠ product-deploy'u açıkça yasaklar; GitHub Pages'in ürün için production olmadığı sabittir.
- AI guardrail (§10): AI PR açar/önerir; production'a deploy edemez, secret göremez, `main`'e insan-onaysız push edemez.
- ADR-0026 (stack) ve core-contract-pack §3.7 (deploy) REFERANS verilir, içerikleri tekrar edilmez.

## 14. Çelişki notu ve yasak (docs-deploy ≠ product-deploy)

Bu bölüm dokümanın en kritik netliğidir ve bir çelişki-önleme kaydıdır. **Çelişki:** "deploy" ve "GitHub Pages" sözcükleri, docs-viewer yayını ile üretilecek SaaS/ürün dağıtımı için aynı anda kullanıldığında karışma doğar. **Karar:** ikisi ayrı hedeflerdir ve karıştırılması yasaktır.

Bu tablo iki deploy türünün neden ayrı olduğunu ve karıştırma yasağını maddeler.

| Boyut | Docs deploy (Runbook 1) | Product deploy (Runbook 3) |
|---|---|---|
| Hedef | GitHub Pages (statik docs) | Hetzner Debian (canlı ürün) |
| İçerik | Doküman/planlama sitesi | Kullanıcı/tenant verisi işleyen SaaS |
| Secret/veri | Yok | KMS secret + üretim verisi |
| Production statüsü | Production DEĞİL | Production (tek) |

Yasaklar (mutlak):
- **GitHub Pages'i ürün için production ilan etmek — YASAK.** Pages bu repoda yalnız docs-viewer yayınıdır; üretilecek SaaS/ürün için PRODUCTION DEPLOY DEĞİLDİR.
- **Ürünü GitHub Pages'e deploy etmeye çalışmak — YASAK.** Ürün (FastAPI/PostgreSQL/worker) statik Pages'e sığmaz ve oraya konmaz; ürün hedefi Hetzner'dır.
- **İki akışın CI/tetikleyicisini birleştirmek — YASAK.** Docs `main` push → Pages; ürün → insan onaylı Hetzner pipeline; tek workflow'da karıştırılmaz.
- **"Docs deploy geçti, ürün de canlı" demek — YASAK.** Docs yayını ürün dağıtımının kanıtı değildir; her hedef kendi kapısıyla ayrı doğrulanır.
- **Secret'ı yanlış hedefe taşımak — YASAK.** Üretim secret'ı/KMS yalnız Hetzner deploy bağlamındadır; docs-viewer veya yerel koşuya üretim secret'ı girmez.

Reconcile: Bu ayrım ADR-0026'nın repo-ayrımı (tooling vs ürün) ve core-contract-pack §3.7'nin deploy standardıyla tutarlıdır; çelişki çıkarsa bu iki kaynak üstündür ve bu doküman onlara göre revize edilir.

## 15. Definition of Done

- §6/§7/§8'deki üç runbook aktör-açık, adım + kapı + rollback ile tam; her biri kendi tetikleyicisi ve yürütücüsüyle ayrık.
- Docs-viewer runbook'u `.github/workflows/deploy.yml` ile satır-uyumlu (PR build-only, `main` push deploy, 19 kapı, BASE_PATH, SPA404); sapma yok.
- Hetzner production runbook'u `core-contract-pack §3.7/§3.3/§2.8` ile satır-uyumlu (Caddy/TLS, KMS, expand-contract, downgrade, blue-green/canary, healthcheck, smoke).
- Local product runbook'u kullanıcı ortamına (macOS M4, `docker compose`, PostgreSQL/Redis/MinIO/FastAPI/React/worker) uygun; yerel koşunun production olmadığı açık.
- Ayrım tablosu (§9) ve çelişki/yasak notu (§14) docs-deploy ≠ product-deploy'u ve "Pages ürün production değil" kararını açıkça sabitler.
- AI guardrail (§10) `core-contract-pack §3.0.1` invariantını deploy eksenine tam uygular (öneri evet; deploy/secret/main-push hayır).
- ADR-0026 ve core-contract-pack REFERANS verilmiş, içerikleri tekrar edilmemiş.
- Doküman `icerik-kalite-sozlesmesi` biçim kurallarına uyar: Türkçe, emoji yok, aktör-açık, her tablodan önce açıklama, mock/çıplak-örnek yok.

## 16. Referans eşlemesi

Aşağıdaki tablo, bu runbook setinin her kritik kararını dayandığı normatif kaynağa eşler; her satır bir runbook öğesini mevcut sözleşmeye bağlar (tekrar değil, referans).

| Runbook öğesi | Dayandığı kaynak |
|---|---|
| Docs-viewer CI+Pages akışı (PR build-only, main deploy) | `.github/workflows/deploy.yml` |
| 19 bloklayıcı kapı listesi | `.github/workflows/deploy.yml` (build job adımları) |
| BASE_PATH `/actionplan/` + SPA404 zorunluluğu | `release-policy.md §Pages/SPA404` |
| Sürüm/tag/changelog ilişkisi | `release-policy.md §Semver, §Tag/deploy` |
| Hetzner+Debian+Docker, init `alembic upgrade head`, smoke, canary | `core-contract-pack.md §3.7` |
| Expand-contract + reversible downgrade + rollback | `core-contract-pack.md §2.8, §3.3` |
| AI önerir → insan onaylar → motor uygular (approval_ref) | `core-contract-pack.md §3.0.1` |
| Stack ayrımı: actionplan=tooling, ürün=saas-app; framework yasakları | `adr-0026-tech-profiles.md §2, §4` |
| Servis kümesi + PostgreSQL zorunlu, Supabase/Next yasak | `core-contract-pack.md §1` |
| `/healthz`+`/ready`, kritik GraphQL doğrulaması | `core-contract-pack.md §3.7, §4 Adım 6` |

## 17. Requirement-ID tablosu

Aşağıdaki tablo, bu runbook setinin izlenebilir gereksinimlerini kimlik + runbook + öncelik (P0–P3) + doğrulama türü + kabul + sahip ile listeler. Öncelik: P0 = bloklayıcı invariant, P1 = çekirdek, P2 = önemli, P3 = iyileştirme.

| ID | Requirement | Runbook | Priority | Verify | AC | Owner |
|---|---|---|---|---|---|---|
| DS-01 | Docs-viewer: PR build-only, `main` push build+deploy | Docs-viewer | P0 | CI | PR'da deploy yok; push'ta Pages yayını | devops |
| DS-02 | Docs-viewer: 19 kapıdan biri kırmızıysa merge/deploy bloklanır | Docs-viewer | P0 | CI(neg) | Kırmızı kapı deploy'u durdurur | devops |
| DS-03 | Docs-viewer: BASE_PATH `/actionplan/` + SPA404 zorunlu | Docs-viewer | P1 | Manuel/E2E | Deep-link 404 vermez | devops |
| DS-04 | Local product: macOS M4 `compose up` (PG/Redis/MinIO/FastAPI/React/worker) | Local product | P1 | Manuel | Servisler ayağa kalkar; `/healthz` yeşil | dev |
| DS-05 | Local product: yerel koşu üretime dokunmaz | Local product | P0 | Contract | Yerel veri/secret üretime taşınmaz | dev |
| DS-06 | Local product: yerel `alembic downgrade -1` veri kaybetmez | Local product | P1 | Integration | Downgrade temiz çalışır | dev |
| DS-07 | Hetzner: Debian+Docker+Caddy+OTA ile private repo'dan deploy | Hetzner prod | P0 | Pipeline | Onaylı sürüm canlıya alınır | devops |
| DS-08 | Hetzner: secrets/KMS runtime enjeksiyon, imaja gömme yok | Hetzner prod | P0 | Pipeline | Secret store'dan gelir; repoda yok | devops |
| DS-09 | Hetzner: migration expand-contract + reversible downgrade | Hetzner prod | P0 | CI | `downgrade -1` test geçer; expand≠contract | devops |
| DS-10 | Hetzner: blue-green/rolling + healthcheck + smoke + canary rollback | Hetzner prod | P0 | Pipeline | Sağlıksızsa/canary>%0.1 rollback | devops |
| DS-11 | Ayrım: yalnız Hetzner production; docs Pages + yerel değil | Ayrım | P0 | Contract | §9 tablosu tek production'ı işaret eder | pmo |
| DS-12 | Çelişki: docs-deploy ≠ product-deploy; Pages ürün-production değil | Yasak | P0 | Contract | §14 yasağı dokümante ve tutarlı | pmo |
| DS-13 | AI: PR açar/önerir; production deploy/secret/main-push yapamaz | Tümü | P0 | Guardrail(neg) | AI apply/secret/push reddedilir | governance |
| DS-14 | Reconcile: ADR-0026 + core-contract-pack §3.7 REFERANS (tekrar yok) | Reconcile | P1 | Review | Kaynaklar referanslı, kopyalanmamış | pmo |
| DS-15 | Rollback her hedefte tanımlı ve insan-kararı (production'da) | Tümü | P1 | Review | Üç rollback yolu belgeli; audit'li | devops |
