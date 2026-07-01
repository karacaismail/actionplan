# App-Distribution & Packaging Sözleşmesi — "Bağımsız Satılabilir App"

**Tarih:** 2026-07-01
**Durum:** Taslak sözleşme (kilitlenmeyi bekliyor — bkz. §8 ADR-D2)
**Kapsam:** ~50 app'in tek `platform` monoreposunda geliştirilip **bağımsız satılabilir/dağıtılabilir** ürünler olarak paketlenmesinin normatif sözleşmesi.
**Kaynak/bağlam:** `core-contract-pack.md` (kernel runtime sözleşmesi), `kernel-dokuman-gap-2026-07-01.md` §6 (dağıtım boşluğu teşhisi), `adr-0027-engineering-standards.md` (architecture standardı — izolasyonu zorlar), `standards-applicability-matrix.md`.
**İlişki:** Bu doküman `core-enterprise-maturity-ladder.md`'nin (olgunluk merdiveni) kardeşidir; merdiven "app ne kadar olgun?" sorusunu, bu doküman "app nasıl ayrı satılır?" sorusunu yanıtlar. İkisi birlikte "önce core, sonra enterprise; hepsi bağımsız satılabilir" iş modelinin sözleşme tabanıdır.

---

## 1. Amaç ve Tanım

### 1.1 Neden bu doküman var

İş modeli net: tek bir kod deposunda (`platform` monorepo) ~50 uygulama geliştirilecek, ama her biri **ayrı bir ürün gibi satılacak, lisanslanacak ve kurulacak**. Bir müşteri yalnızca "Fatura" uygulamasını alabilmeli; "CRM" uygulamasını almadıysa onun kodu, ekranı veya API'si müşterinin kurulumunda çalışmamalı. Aynı zamanda tüm uygulamalar aynı çekirdeği (kernel) paylaşmalı ki 50 kez tenant izolasyonu, authz, audit yeniden yazılmasın.

Bu ikisi (tek repo + bağımsız ürün) gerilim yaratır. Gerilimi çözmeyen bir yapı iki hatadan birine düşer: ya uygulamalar birbirine sızar (App A doğrudan App B'nin koduna bağımlı olur; artık ikisi ayrı satılamaz), ya da her uygulama kerneli kopyalar (bakım kâbusu). Bu sözleşme, gerilimi **sözleşme + CI kapısı** ile çözer: uygulamalar monorepoda yan yana yaşar ama satışta/dağıtımda ayrıktır.

Not: Bu doküman **kod yazmaz**. `platform` reposunun paketleme/izolasyon/lisanslama davranışının ne olması gerektiğini normatif olarak tanımlar; makine-okunur karşılığı (manifest şeması, CI kapısı) ADR-D2 kilitlendiğinde `platform` reposunda üretilir.

### 1.2 Terimler (ilk geçişte açıklama)

Bu doküman boyunca kullanılan jargon, ilk geçişte açıklanır:

- **Kernel (çekirdek):** Tüm uygulamaların paylaştığı, `core-contract-pack.md`'de tanımlı runtime sözleşmesi ve primitifler kümesi (tenant context, identity/authz, event bus + outbox, audit, module SDK, archetype registry, workflow registry vb.). Kod olarak `backend/platform_*` paketleri.
- **App (uygulama / dikey dilim):** Satılabilir bir ürün birimi. Bir iş problemini uçtan uca çözer (ör. Fatura, CRM, Envanter). Bir veya birden çok **module**'den oluşur.
- **Module (modül):** Kernele bağlanan en küçük çalışan yazılım birimi. `core-contract-pack §2.10 Module SDK`'daki `AppModule` arayüzünü uygular (`slug`, `version`, `register_routes`, `register_graphql`, `on_startup`, ...). Bir app, module'lerin paketlenmiş kümesidir.
- **Kernel primitifi:** Kernelin sunduğu, her isteğin dayandığı temel yetenek. Örnekler: `k-tenancy` (kiracı bağlamı), `k-identity` + `k-authz` (kimlik + yetki), `k-capability` (yetenek/entitlement anahtarı), `k-actor` (insan/sistem/ajan ayrımı), `k-policy-pdp` (Policy Decision Point — yetki kararı motoru), `k-jurisdiction` (Locale/Currency/Tax/Timezone/Residency 6-eksen çözümleme). Bunlar app değil, kernelin parçasıdır; app **tüketir**.
- **Capability (yetenek):** `k-capability` primitifi tarafından yönetilen, "bu kurulum X yeteneğini çalıştırmaya yetkili mi?" sorusuna cevap veren adlandırılmış izin birimi. Lisanslamanın ve feature-gate'in taşıyıcısıdır.
- **k-mod-l / k-plugin:** Modül yükleme (module-loader) ve eklenti (plugin) mekanizması. Kernelin, hangi module'lerin bu kurulumda kayıtlı/aktif olduğunu belirleyen katmanı. App manifest'i bunun üstünde çalışır: manifest "hangi module'ler yüklenecek, hangi capability'ler gerekli" der; `k-mod-l` yükler; `k-plugin` çalışma zamanında bağlar.
- **Entitlement (hak sahipliği):** Bir müşterinin/tenant'ın bir capability'yi (dolayısıyla bir app'i) çalıştırma hakkı. Lisans anahtarından çözülür.
- **PDP (Policy Decision Point):** Yetki kararını veren merkezi motor (`k-policy-pdp`). "Bu actor, bu tenant'ta, bu kaynağa, bu eylemi yapabilir mi?" sorusunu ReBAC/ABAC ile yanıtlar. (ReBAC = ilişki-tabanlı erişim; ABAC = öznitelik-tabanlı erişim.)

### 1.3 "Bağımsız satılabilir app" — kanonik tanım

Bu sözleşmenin tek cümlelik çekirdek tanımı, çelişen her şeyi geçersiz kılar:

> **Bağımsız satılabilir app = ayrı paketlenebilir + ayrı lisanslanabilir + ayrı deploy edilebilir + kerneli paylaşır ama diğer app'lere DOĞRUDAN bağımlı değildir.**

Dört yükümlülüğü tek tek:

- **Ayrı paketlenebilir:** App'in tüm module'leri ve manifest'i, o app'e ait tek bir dağıtım artefaktı olarak (container imajı + compose dosyası) toplanabilir. Diğer app'lerin kodu bu pakete girmez.
- **Ayrı lisanslanabilir:** Müşteri yalnızca satın aldığı app'i çalıştırır. Lisans anahtarı → `k-capability` → app aktif. Satın alınmayan app, kurulumda kod olarak bulunsa bile çalışmaz (feature-gate kapalı).
- **Ayrı deploy edilebilir:** App tek başına `docker compose up` ile ayağa kalkar; paylaşılan kernel + yalnız o app'in module'leri. Hedef: Hetzner + Debian + Docker (K8s opsiyonel, büyük kurulumda).
- **Diğer app'lere doğrudan bağımlı değil:** App A, App B'nin Python paketini/module'ünü **import etmez**. İki app ancak kernel sözleşmesi (paylaşılan primitif) veya olay (event bus) üzerinden haberleşir. Bu kural CI ile zorlanır (§3, §7).

Bu dördü sağlanmadan bir app "bağımsız satılabilir" sayılmaz; bu, olgunluk merdiveninde (`core-enterprise-maturity-ladder.md`) **L1 graduation kapısının** ön koşuludur.

---

## 2. App Manifest — App Ne Tüketir?

### 2.1 Manifest nedir, neden zorunlu

Bir app'i bağımsız paketlemek için önce onun **ne tükettiğini** açıkça beyan etmesi gerekir: hangi kernel primitiflerine, hangi module'lere, hangi capability'lere dayanıyor ve hangi kernel sürümüyle uyumlu. Bu beyan olmadan paketleyici (§7'deki geliştirici/CI) hangi kodu pakete koyacağını, hangi capability'yi lisanslayacağını bilemez.

App manifest, `k-mod-l` (module-loader) ve `k-plugin` mekanizmasının **üstünde** çalışan bildirimsel bir sözleşmedir: manifest neyin gerekli olduğunu söyler, `k-mod-l` gerekli module'leri yükler, `k-plugin` çalışma zamanında bağlar. Manifest app'in kökünde (`frontend/apps/<app-slug>/` ve backend paket kümesinin yanında) tek dosya olarak yaşar; makine-okunur (JSON/TOML).

### 2.2 Manifest alanları

Aşağıdaki tablo, her app manifest'inin taşıması gereken zorunlu ve opsiyonel alanları tanımlar. "Zorunlu" işaretli alanlar eksikse `check-app-manifest` kapısı (§7) kırmızıdır.

| Alan | Zorunlu? | Anlamı |
|---|---|---|
| `app_slug` | Zorunlu | App'in benzersiz tanımlayıcısı (ör. `invoice`, `crm`). Satış/lisans/deploy'da birincil anahtar. |
| `app_version` | Zorunlu | App'in kendi semantik sürümü (semver). Kernel sürümünden bağımsızdır. |
| `kernel_range` | Zorunlu | Uyumlu kernel sürüm aralığı (semver aralığı, ör. `>=2.0.0 <3.0.0`). App'in çalışması için gereken kernel sürüm bandı. Bkz. §6. |
| `modules[]` | Zorunlu | App'i oluşturan module slug'ları (`AppModule.slug` değerleri). `k-mod-l` bu listeyi yükler. En az bir module. |
| `kernel_primitives[]` | Zorunlu | App'in doğrudan tükettiği kernel primitifleri (ör. `k-tenancy`, `k-authz`, `k-audit`, `k-jurisdiction`). Beyan edilmeyen primitifin çağrılması `check-primitive-usage` (§7) ile yakalanır. |
| `capabilities_required[]` | Zorunlu | App'in çalışması için gereken capability'ler (ör. `invoice:core`, `invoice:e-fatura`). Lisans/entitlement bunlardan çözülür (§4). |
| `capabilities_optional[]` | Opsiyonel | Feature-gate ile açılıp kapanabilen isteğe bağlı capability'ler (ör. `invoice:multi-currency`). Yoksa app temel modda çalışır. |
| `events_published[]` | Opsiyonel | App'in event bus'a yayınladığı olay tipleri (ör. `invoice.created`). Diğer app'ler yalnız bunlara abone olabilir; doğrudan import edemez. |
| `events_subscribed[]` | Opsiyonel | App'in abone olduğu olay tipleri. Kaynak app'in `events_published` listesinde bulunmalı (gevşek bağ; §3). |
| `i18n_locales[]` | Zorunlu | App'in sağladığı çeviri locale'leri (en az bir; ör. `tr-TR`, `en-US`). i18n standardı (bkz. `kernel-standart-kapsama-derin-2026-07-01.md`) app'ten çeviri kaynağı bekler. |
| `data_residency_class` | Opsiyonel | App'in veri-residency sınıfı (`none` \| `region-pinned` \| `jurisdiction-bound`). L3'te (enterprise) `k-jurisdiction` ile zorlanır. |

### 2.3 Manifest ne yapmaz

Manifest bir **bildirimdir**, kod değildir. Kernel primitifinin nasıl çağrılacağını tarif etmez; yalnızca hangisine bağımlı olunduğunu beyan eder. Gerçek çağrı `core-contract-pack.md`'deki imzalarla (ör. `Depends(require_tenant)`, `RequirePermission("invoice:write")`) yapılır. Manifest ile gerçek kod arasındaki tutarlılık (beyan edilen ama kullanılmayan primitif, ya da kullanılan ama beyan edilmeyen primitif) CI'da denetlenir (§7).

---

## 3. Bağımlılık İzolasyonu — App A, App B'yi Doğrudan İmport Etmez

### 3.1 Kural

Bu, bağımsız satılabilirliğin **kalbidir**. Kural tek cümle:

> Bir app, başka bir app'in Python paketini, module'ünü, frontend workspace'ini veya iç sembolünü **doğrudan import edemez**. İki app ancak (a) paylaşılan **kernel sözleşmesi** (ortak primitif) veya (b) **event bus** (yayın/abone) üzerinden haberleşir.

Neden: App A, App B'yi doğrudan import ederse, App A'yı satan müşteriye App B'nin kodu da zorunlu gelir; ikisi artık ayrı paketlenemez, ayrı lisanslanamaz. Doğrudan import, "bağımsız satılabilir" tanımını (§1.3) tek hamlede bozar.

### 3.2 İzin verilen ve yasak haberleşme

Aşağıdaki tablo, iki app arasında neyin serbest, neyin yasak olduğunu tek bakışta verir. "Yasak" satırlar `check-app-isolation` kapısı (§7) tarafından bloklanır.

| Haberleşme yolu | Durum | Açıklama |
|---|---|---|
| `from platform_crm import ...` (App A içinde) | **YASAK** | App'in başka bir app'in paketini doğrudan import etmesi. İzolasyon ihlali. |
| Frontend'de `@platform/crm-*` workspace'ini import | **YASAK** | App'in başka bir app'in frontend workspace'ini import etmesi. |
| `from platform_tenancy import require_tenant` | **Serbest** | Kernel primitifini import etmek. Kernel paylaşılır (`platform_*` çekirdek paketleri). |
| `from platform_events import EventPublisher` + `publish("invoice.created", ...)` | **Serbest** | Olay yayınlamak. Diğer app abone olarak tepki verir; kaynak app tüketiciyi bilmez. |
| `EventConsumer.subscribe("crm.customer.created", handler)` | **Serbest (koşullu)** | Olaya abone olmak. Kaynak olayın, kaynak app'in `events_published` manifest listesinde olması gerekir. |
| Paylaşılan veritabanı tablosuna App B'nin tablosundan doğrudan JOIN | **YASAK** | App'ler birbirinin şemasına doğrudan sorgu atamaz; veri paylaşımı olay veya kernel-sağlanan okuma sözleşmesi ile olur. |

### 3.3 Neden monorepo, neden yine de ayrık

`core-contract-pack §1` tek `platform` monoreposunu zorunlu kılar (ayrı repo yasak). Bu, izolasyonla çelişmez: **monorepo bir depolama kararıdır, bağımlılık kararı değildir.** Kod aynı repoda yaşar (ortak kernel, ortak CI, ortak sürümleme kolaylığı), ama derleme/paketleme sınırı app düzeyinde çizilir. İzolasyon, fiziksel repo ayrımıyla değil, **architecture standardı + CI kapısı** ile sağlanır. Bu, ADR-0027'nin "standart = CI kapısı, yoksa ölü metin" ilkesinin doğrudan uygulamasıdır: "app'ler ayrı satılır" cümlesi, `check-app-isolation` kapısı olmadan sahte güvendir.

### 3.4 Ortak ihtiyaç nereye gider

İki app'in ortak bir şeye ihtiyacı varsa (ör. ikisi de "para biçimlendirme" istiyor), çözüm App A'dan import değil, **o ortak şeyi kernele/crosscut'a terfi etmektir**. Örnek: para/FX `l1-misc` + `cc-fx-ledger`, jurisdiction `k-jurisdiction`. Kural: ortak bağımlılık aşağı (kernele/paylaşılan katmana) iner, yana (app-to-app) gitmez.

---

## 4. Per-App Entitlement / Lisans — Müşteri Yalnız Aldığını Çalıştırır

### 4.1 Amaç

Bağımsız satılabilirliğin ikinci ayağı: kod monorepoda/imajda bulunsa bile, müşteri **yalnızca lisansladığı app'i çalıştırabilmeli**. Bu, `k-capability` primitifi + lisans anahtarı üzerinden kurulur; app kodu her giriş noktasında capability kontrolü (feature-gate) yapar.

### 4.2 Zincir: lisans anahtarı → capability → app aktif

Akış, insan-okunur biçimde:

1. Müşteri "Fatura" app'ini satın alır. Satış sistemi bir **lisans anahtarı** üretir; anahtar, verilen capability'leri (`invoice:core`, opsiyonel `invoice:e-fatura`) ve geçerlilik/sınırları (süre, tenant sayısı, seat) taşır.
2. Kurulumda anahtar `k-capability` primitifine yüklenir. `k-capability`, hangi tenant'ın hangi capability'lere sahip olduğunu (entitlement) tutar.
3. Bir istek geldiğinde, app'in giriş noktası (FastAPI endpoint / GraphQL resolver) ilgili capability'yi sorar: entitlement yoksa istek **403 (feature not licensed)** döner. Bu, `k-authz`'nin (rol/izin) üstünde ayrı bir katmandır: authz "bu kullanıcı bu eylemi yapabilir mi?", entitlement "bu kurulum bu app'i çalıştırmaya yetkili mi?" sorusudur.
4. Lisanslanmayan app'in module'leri `k-mod-l` tarafından hiç yüklenmeyebilir (deploy zamanı gate) veya yüklense de capability-gate ile çalışma zamanında kapalı tutulur (runtime gate). Hangi stratejinin kullanılacağı §5'te.

### 4.3 Feature-gate katmanları

| Katman | Ne zaman uygulanır | Mekanizma |
|---|---|---|
| Deploy-zamanı gate | App'in module'leri kurulumda hiç yüklenmez | Manifest `capabilities_required` ile eşleşmeyen module `k-mod-l` tarafından atlanır (ör. tek-app standalone deploy) |
| Runtime capability gate | Module yüklü ama tenant lisanssız | Endpoint/resolver `k-capability.require("invoice:core")` çağırır; entitlement yoksa 403 |
| Opsiyonel feature gate | Alt-özellik lisansa bağlı | `capabilities_optional` (ör. `invoice:multi-currency`) entitlement varsa açık, yoksa temel mod |

### 4.4 Sınırlar

- Entitlement kontrolü **kernel primitifinin işidir**, app kendi lisans mantığını yazmaz (tıpkı authz'de olduğu gibi — `core-contract-pack §2.2`). App yalnızca `k-capability.require(...)` çağırır.
- Lisans anahtarı doğrulaması kriptografik olmalı (imzalı anahtar); app anahtarı düz metin karşılaştırmaz.
- Entitlement değişimi (yeni app satın alma, süre dolması) audit'e yazılır (`core-contract-pack §2.5`): kim, hangi tenant'a, hangi capability'yi, ne zaman verdi/aldı.

---

## 5. Standalone Deploy — Her App Tek Başına `docker compose up`

### 5.1 Hedef

Bir müşteri tek bir app aldıysa, o app tek başına ayağa kalkmalı: **paylaşılan kernel + yalnız o app'in module'leri**, tek `docker compose up` komutuyla. Hedef ortam: Hetzner + Debian + Docker. K8s yalnızca büyük/çok-tenant kurulumlarda opsiyoneldir (bkz. olgunluk merdiveni L3).

### 5.2 Standalone bileşen kümesi

Tek-app standalone kurulumun minimum bileşenleri:

| Bileşen | Rol | Kaynak |
|---|---|---|
| Kernel runtime | Tenant/authz/audit/event-bus/PDP/jurisdiction primitifleri | `backend/platform_*` (paylaşılan) |
| App module'leri | O app'in `AppModule`'leri | `modules[]` manifest listesi |
| PostgreSQL | Kalıcılık (tek üretim motoru) | `core-contract-pack §1` (Postgres dışı yasak) |
| Redis | Event bus (Redis Streams) + capability/authz önbelleği | `core-contract-pack §2.3` |
| Reverse proxy | TLS sonlandırma, `/healthz` + `/ready` yönlendirme | infra |
| Migration init | `alembic upgrade head` (init container) | `core-contract-pack §3.7` |

App'in `docker compose` dosyası, manifest'ten türetilir: `modules[]` hangi backend paketlerinin imaja gireceğini, `capabilities_required[]` hangi lisansın gerekli olduğunu belirler. Diğer app'lerin module'leri bu imaja **girmez** (izolasyon §3 + paketleme §1.3).

### 5.3 Deploy topolojisi seçenekleri

| Topoloji | Ne zaman | Açıklama |
|---|---|---|
| Tek-app standalone | Müşteri tek app aldı | Kernel + tek app module kümesi; en yalın compose; K8s gereksiz |
| Çok-app tek-kurulum | Müşteri birkaç app aldı, aynı sunucu | Kernel paylaşılır; birden çok app module kümesi aynı runtime'da; capability-gate app'leri ayırır |
| Çok-bölge / çok-tenant | Enterprise (L3) | K8s + `k-jurisdiction` residency; DR tatbikatı; bkz. olgunluk merdiveni L3 |

Kural: standalone deploy **L1 core'un zorunlu çıktısıdır** (`core-enterprise-maturity-ladder.md` L1-DoD). Bir app `docker compose up` ile tek başına kalkamıyorsa "bağımsız satılabilir" sayılmaz.

---

## 6. Marketplace + Sürüm Uyumu

### 6.1 Sorun

50 app + paylaşılan kernel = sürüm uyumsuzluğu kaçınılmaz. App X kernel v2'ye yazılmışken App Y hâlâ kernel v1'de olabilir. Marketplace (app'lerin listelendiği katalog) bir müşteriye "bu app'i mevcut kernelinle kurabilir misin?" sorusunu yanıtlayabilmeli. Bunun için iki mekanizma gerekir: **uyumluluk matrisi** ve **kırıcı-değişim → etkilenen-app matrisi**.

### 6.2 Kernel sürüm sözleşmesi

- Kernel semver kullanır (`MAJOR.MINOR.PATCH`); kernel sözleşmesindeki kırıcı değişiklik = MAJOR bump (`release-policy.md` semver kuralı).
- Her app manifest'i `kernel_range` ile uyumlu bandı beyan eder (§2.2). Bir kurulumda kernel sürümü app'in `kernel_range`'i dışındaysa app **kurulmaz/başlamaz** (deploy-zamanı kontrol).
- Kernel MINOR/PATCH geriye uyumludur; app'ler aynı MAJOR içinde MINOR yükselmelerden etkilenmez.

### 6.3 Uyumluluk matrisi

Marketplace, hangi app sürümünün hangi kernel MAJOR bandıyla uyumlu olduğunu tablo olarak tutar. Örnek biçim:

| App | App sürümü | Uyumlu kernel bandı (`kernel_range`) | Marketplace durumu |
|---|---|---|---|
| invoice | 3.1.0 | `>=2.0.0 <3.0.0` | Kernel v2 kurulumunda listelenir |
| invoice | 2.4.0 | `>=1.0.0 <2.0.0` | Yalnız kernel v1 kurulumunda listelenir (legacy) |
| crm | 1.2.0 | `>=2.0.0 <3.0.0` | Kernel v2 kurulumunda listelenir |

Marketplace bir müşteriye yalnızca **mevcut kernel MAJOR'una uyumlu** app sürümlerini gösterir. Böylece uyumsuz kurulum en baştan engellenir.

### 6.4 Kırıcı-değişim → etkilenen-app matrisi

Kernelde kırıcı bir değişiklik (MAJOR) yapılacaksa, hangi app'lerin etkilendiği kayıt altına alınmalı — yoksa kernel v2'ye geçiş 50 app'i sessizce kırar. Bu matris, her kırıcı kernel değişimini etkilediği app'lere bağlar:

| Kernel kırıcı değişim | Etkilenen primitif | Etkilenen app'ler (manifest `kernel_primitives`'e göre) | App tarafı aksiyon |
|---|---|---|---|
| `require_tenant` imza değişimi | `k-tenancy` | Tüm app'ler (evrensel primitif) | Her app `kernel_range`'i v2'ye yükseltir + entegrasyon testi |
| PDP karar API'si değişimi | `k-policy-pdp` | `k-authz`/`k-policy-pdp` tüketen app'ler | Yetki çağrılarını yeni API'ye taşı |
| Jurisdiction context şeması | `k-jurisdiction` | `data_residency_class != none` app'ler | Residency çözümlemesini güncelle |

Aktör açıklığı: kırıcı-değişim matrisini **kernel geliştiricisi** doldurur (hangi app'ler etkilenir); **CI** manifest `kernel_primitives` alanından etkilenen app kümesini otomatik türetip PR'a rapor eder; **insan** kernel MAJOR yayınını onaylar. Etkilenen bir app `kernel_range`'ini güncellemeden kernel MAJOR yayınlanamaz (release kapısı).

---

## 7. Aktör Açıklığı — Kim Paketler, Kim Bloklar, Kim Yayınlar

Bu sözleşmenin her adımında üç aktör vardır; hiçbir adım "kendiliğinden" olmaz. ADR-0027'nin aktör-açıklığı ilkesi burada da geçerlidir.

- **Geliştirici (insan):** App'i paketler. Manifest'i yazar/günceller (`modules`, `kernel_primitives`, `capabilities_required`, `kernel_range`, `i18n_locales`). App'in `docker compose` dosyasını manifest'ten türetir. Standalone kurulumu doğrular.
- **CI (makine):** İzolasyon ihlalini ve manifest tutarsızlığını **bloklar**. Aşağıdaki kapılar (`.github/workflows/deploy.yml` içinde, `core-contract-pack §6` deseniyle) bloklayıcıdır:

| Kapı | Ne zorlar | Yeşil koşul |
|---|---|---|
| `check-app-isolation` | Çapraz-app doğrudan import yasağı (§3) | Hiçbir app başka bir app'in paketini/workspace'ini import etmiyor; app-to-app JOIN yok |
| `check-app-manifest` | Manifest zorunlu alanları dolu ve geçerli (§2) | `app_slug`, `app_version`, `kernel_range`, `modules[]`, `kernel_primitives[]`, `capabilities_required[]`, `i18n_locales[]` dolu |
| `check-primitive-usage` | Kullanılan primitif = beyan edilen primitif (§2.3) | Kodda çağrılan her kernel primitifi manifest `kernel_primitives`'te var; beyan edilip kullanılmayan yok |
| `check-capability-gate` | Lisanslı giriş noktaları capability-gate taşır (§4) | `capabilities_required`'daki her app giriş noktası `k-capability.require(...)` ile korunuyor |
| `check-kernel-range` | Manifest `kernel_range` geçerli semver aralığı ve mevcut kernele uyumlu (§6) | `kernel_range` çözülüyor; kernel MAJOR yayınında etkilenen app güncellenmiş |

- **İnsan (yayıncı / release owner):** App'i veya kernel MAJOR'ını **yayınlar**. Marketplace listelemesini onaylar. Kırıcı-değişim matrisini gözden geçirip kernel MAJOR yayınını onaylar (`release-policy.md`: tag `main`'e insan tarafından atılır). CI yeşil olmadan yayın yapılmaz; ama CI yeşil olsa da yayın kararı insanındır.

Özet: **geliştirici paketler, CI izolasyon-ihlalini bloklar, insan yayınlar.** Bu üçlü, "50 bağımsız satılabilir app" vaadinin sahte güvene dönüşmesini engelleyen kontrol zinciridir.

---

## 8. Kilitlenecek ADR Taslakları

Aşağıdaki ADR'ler bu sözleşmeyi bağlayıcı hale getirir. `kernel-dokuman-gap-2026-07-01.md` §8'deki ADR-D2'nin ayrıştırılmış halidir; kilitlenince `docs/` altına ADR düğümü olarak eklenir (README §1 kategorisi).

- **ADR-D2 — App-Distribution sözleşmesi (ana karar).** Bu dokümanın kanonik sözleşme olarak kabulü + yeni `distribution` WBS kümesi (veya `platform-horizontal` altına). Öneri: **evet** (bağımsız satılabilirlik vaadinin sözleşme tabanı; bunsuz L1 graduation tanımlanamaz).
- **ADR-D2.1 — App Manifest şeması.** `app-manifest` makine-okunur şeması (`src/schemas/` veya `platform` reposunda) + zorunlu alan kümesi (§2.2). Öneri: evet.
- **ADR-D2.2 — İzolasyon CI kapıları.** `check-app-isolation` + `check-primitive-usage` + `check-app-manifest` + `check-capability-gate` + `check-kernel-range` kapılarının `deploy.yml`'e eklenmesi (§7). Öneri: evet (kapı yoksa izolasyon ölü metin — ADR-0027 ilkesi).
- **ADR-D2.3 — Capability/entitlement modeli.** `k-capability` primitifinin lisans-anahtarı → entitlement → feature-gate zinciri (§4) + audit bağı. Öneri: evet.
- **ADR-D2.4 — Marketplace uyumluluk matrisi.** Uyumluluk matrisi + kırıcı-değişim→etkilenen-app matrisi (§6) + kernel MAJOR release kapısı. Öneri: evet (kernel sürüldükçe zorunlu olur).

---

## Çelişki ve Bağlam Notları

- Bu sözleşme `core-contract-pack.md` (kernel runtime) ve `adr-0027-engineering-standards.md` (architecture standardı) türevidir; onlarla çelişen bir madde saptanırsa **kaynak dokümanlar önceliklidir** ve bu doküman güncellenir.
- Kullanılan primitif adları (`k-tenancy`, `k-identity`, `k-authz`, `k-capability`, `k-actor`, `k-policy-pdp`, `k-jurisdiction`) ve `k-mod-l`/`k-plugin` mekanizması, kernel eleştiri/gap raporlarındaki (`kernel-dokuman-gap-2026-07-01.md`, `kernel-standart-kapsama-derin-2026-07-01.md`) adlandırmayla hizalıdır. Bu primitiflerin kernel sözleşmeleri `core-contract-pack.md` v2'de (ADR-D4) yazılacaktır; bu doküman onların **var olduğunu varsayar ve tüketim tarafını tanımlar**.
- Stack kısıtı (mutlak yasak, `core-contract-pack §1` ile aynı): Next.js, Supabase, Prisma yasak; üretim DB'si yalnız PostgreSQL; ORM yalnız SQLAlchemy 2.0 / SQLModel; deploy Hetzner + Debian + Docker (K8s opsiyonel).
- Bu doküman **hiçbir kod/şema/JSON dosyasına dokunmaz**; yalnız sözleşme metnidir. Makine-okunur karşılıklar (manifest şeması, CI kapıları) ADR-D2 ailesi kilitlendiğinde ayrı iş kalemi olarak üretilir.

*Kardeş doküman: `core-enterprise-maturity-ladder.md` (core→enterprise olgunluk merdiveni). İlgili: `enterprise-dod.md` (L3 bitiş-DoD), `core-contract-pack.md` (kernel sözleşmesi), `release-policy.md` (semver/tag/deploy).*
