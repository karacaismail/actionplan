# Panel-Tier Sözleşmesi — Üç Panel Katmanı + Counterparty Sınıfı

Sürüm: 1.0 — 2026-07-02
Durum: **Taslak sözleşme (kilitlenmeyi bekliyor) — insan onayı ile kilitlenecek.**
Kaynak: `docs/surface-spec.md` (kanonik Surface spesifikasyonu), `docs/surface-v2-directive.md` (§4 taksonomi, §6 şema değişiklikleri, §11 test stratejisi biçimi), `docs/surface-counterparty-portal-addendum.md` (dördüncü aktör sınıfı — counterparty), `docs/gap-2026-07-02-03-surface.md` (§4 G-S1, G-S2 — bu dokümanın doğrudan gerekçesi), `src/schemas/surface.ts` (mevcut `SurfaceContractSchema` — 8 tip, düz `permissions[]`), `docs/drafts/panel-tier-contract.md` (önceki taslak iskelet; bu doküman onu tam sözleşmeye genişletir).

**Gerekçe.** `gap-2026-07-02-03-surface.md §4 G-S1` şunu tespit eder: kullanıcının kritik gereksinimi üç panel katmanıdır — (1) developer/kernel admin, (2) SaaS müşterisinin süper-admin paneli, (3) o müşterinin kendi son kullanıcıları (rol gruplarıyla; WordPress'in "kur-çalıştır" deneyimine benzer şekilde her tenant kendi rol/kullanıcı setini yönetir). Bugün `src/schemas/surface.ts`'te bu üç katmanı ayıran **birinci sınıf alan yoktur**; tek erişim kontrolü düz `permissions[]` — string dizisi, katman-farkında değil, hangi panelin hangi kullanıcı sınıfına ait olduğunu bilmez. `surface-spec.md:31` bu personaları yalnızca düzyazıda anar (`k-boyut2`, `k-boyut3`); şemada karşılığı yoktur. Bu, gap analizinin **P0 kurucu boşluk** sınıflandırdığı bir eksikliktir: alan olmadan platformun 18 ürünü (HRMS, CRM, PMS, MRP, CLM, PIM, e-ticaret, vb.) kendi "panel katmanı" konvansiyonunu ayrı ayrı icat eder, kernel'in yeniden-kullanım vaadi ürün-ürün ayrışarak çöker.

Bu doküman *sözleşme/mimari tarif* verir — ürün kodu `platform` reposunda yazılır. Panel **çizmez** (ASCII/wireframe yok); her kavramı alan + tip + amaç + davranış olarak **tanımlar**. Stack: Vite + React + TanStack Router/Query (headless — bileşen kütüphanesi/tasarım kararı bu dokümanın konusu değildir, kullanıcı tercihidir); **Next.js, Supabase, Prisma yasaktır**.

---

## 1. Amaç / Kapsam / Non-goals

### 1.1 Amaç

Her `SurfaceContract` örneğinin **hangi panel katmanına ait olduğunu** birinci sınıf, şema-düzeyinde bir alanla sabitlemek; her katmanın kendi rol-grubu modelini ve izin-sürümlü (permission-aware) navigasyonunu tanımlamak. Amaç, bugün yalnız düzyazıda var olan "developer paneli / süper-admin paneli / son-kullanıcı paneli" ayrımını, 18 ürün ekibinin ayrı ayrı yeniden icat etmesini önleyecek tek bir kanonik sözleşmeye dönüştürmektir.

### 1.2 Kapsam

Bu doküman şunları kapsar: (a) `panelTier` alanı — dört değerli enum (`developer`, `tenant-admin`, `tenant-enduser`, `counterparty`); (b) `roleGroups` — tenant-scoped rol grubu modeli; (c) `navigation` — izin-sürümlü menü ağacı modeli; (d) bu üç alanın `check-surface` CI kapısına önerilen etkisi; (e) çok-kiracılı (multi-tenant) izolasyon ve AI guardrail kuralları; (f) test stratejisi ve kabul kriterleri.

### 1.3 Non-goals (KRİTİK)

Aşağıdaki iki sınır bu dokümanın **en kritik uyarısıdır**; doküman boyunca tekrar edilir çünkü ihlali bir güvenlik açığına dönüşür:

> **`panelTier` bir SUNUM (presentation) katmanı alanıdır; bir GÜVENLİK SINIRI DEĞİLDİR.** Asıl yetki kararı **PDP**'de (permission decision point = izin karar noktası; `docs/adr-P1-pdp.md`) verilir. `panelTier`, bir kullanıcının hangi paneli/menüyü *görmesi beklendiğini* beyan eder — hangi veriye/aksiyona *erişebileceğini* değil. Bu iki şey PDP tarafından bağımsız olarak, yüzeyden habersiz şekilde yeniden doğrulanır.

> **Alan gizleme ≠ yetki gizleme.** Bir menü düğümünün veya form alanının `panelTier`/`navigation` sözleşmesi gereği istemcide görünmemesi, o veriye erişimin backend'de reddedildiği anlamına gelmez ve onun yerine geçmez. Görünmeyen bir düğüm arkasındaki API endpoint'i, istemci onu hiç render etmese bile PDP tarafından ayrıca korunmalıdır. Bu doküman bu ilkeyi ihlal eden hiçbir tasarımı onaylamaz.

Ek non-goals: bu doküman gerçek yetki/izin **karar mantığını** tanımlamaz (PDP'nin işi — `docs/adr-P1-pdp.md`); rol-tabanlı erişim kontrolünün (RBAC) backend uygulamasını tanımlamaz (IAM katmanının işi); iş mantığı taşımaz; UI bileşen kütüphanesi/tasarım sistemi seçmez (bileşen/prop/davranış tanımlar, çizim yapmaz — nihai görsel karar kullanıcı tercihidir); mevcut 8 Admin-Surface tipini, `renderStrategy`'yi veya Consumer/Shop/counterparty-portal ailelerini değiştirmez (bunlar `surface-spec.md`, `surface-v2-directive.md`, `surface-counterparty-portal-addendum.md`'de tanımlıdır ve bu doküman onlara **eklenir**, onları geçersiz kılmaz); yeni bir kimlik doğrulama (authentication) mekanizması tanımlamaz (mevcut oturum/IAM katmanını tüketir).

---

## 2. Nedir / ne yapar / ne yapmaz

**Nedir?** Panel-tier, bir `SurfaceContract` örneğine "bu yüzey hangi aktör sınıfı için tasarlandı" bilgisini ekleyen, ve o aktör sınıfının kendi rol-grubu ile izin-sürümlü navigasyonunu taşıyan sözleşme genişlemesidir. Dört aktör sınıfı ayrılır; her biri farklı bir erişim modeline, farklı bir veri kapsamına ve farklı bir kullanıcı deneyimi beklentisine sahiptir.

**Aktör açıklığı (dört sınıf).**

- **developer** — *tenant-üstü* (cross-tenant) aktör. Platformun kendi geliştirici/kernel-admin ekibi. Tüm tenant'ları görebilir/yönetebilir bağlamı vardır (ör. tenant provisioning, global feature flag, sistem sağlığı). En geniş ve en riskli kapsam; bu yüzden en katı audit ve en dar kullanıcı sayısı beklenir.
- **tenant-admin** — *tenant-scoped* aktör. SaaS müşterisinin kendi süper-admin'i (ör. bir HRMS müşterisinin İK departman yöneticisi, bir CRM müşterisinin satış operasyon lideri). Kendi tenant'ının verisini, rol atamalarını ve tenant-içi yapılandırmasını yönetir; başka tenant'ı asla göremez.
- **tenant-enduser** — *tenant-içi rol-scoped* aktör. O tenant'ın son kullanıcısı; kendi rol grubunun tanımladığı dar bir kesitte çalışır (ör. bir çalışan kendi izin talebini görür, bir satış temsilcisi kendi fırsatlarını görür). WordPress benzetmesi burada geçerlidir: tenant-admin platformu "kurar" (rol/kullanıcı tanımlar), tenant-enduser onu "çalıştırır" (günlük iş yapar) — ikisi aynı üründe farklı deneyimlerdir.
- **counterparty** — *harici/davetli* aktör; tenant'ın **dışında** ama belirli bir kayda (ör. bir sözleşmenin karşı tarafı) davet edilmiş, kimliği bilinen, kapsamı katı sınırlı aktör. Bu sınıf `surface-counterparty-portal-addendum.md`'de zaten ayrıntılı tanımlıdır (`counterparty-portal` surface ailesi, `CounterpartyPortalShell` ve beş alt bileşen); bu doküman onu **tekrar tanımlamaz**, yalnızca `panelTier` enum'ının dördüncü, komşu ama ayrı değeri olarak tanır ve üç iç katmanla aynı çapraz-katman-izolasyon disiplinine tabi tutar (§6).

**Ne yapar?** `panelTier`, bir Surface örneğinin ait olduğu aktör sınıfını beyan eder. `roleGroups`, bir tenant içinde tanımlanabilen rol gruplarını (id, etiket, izin listesi) modelleyerek tenant-admin'in kendi son-kullanıcı rollerini "kurmasını" (WordPress benzeri) mümkün kılar. `navigation`, her panelin göreceği menü ağacını, her düğümün hangi izne bağlı olduğunu beyan ederek **izin-sürümlü menü** üretir — yani bir kullanıcının izni olmayan bir menü düğümü ilke olarak render edilmez (ama bu, §1.3'teki uyarı gereği, arkasındaki veriyi korumaz; yalnızca sunumu düzenler).

**Ne yapmaz?** `panelTier` yetki kararı vermez (PDP verir). `roleGroups` küresel/platform-çapında bir rol kataloğu değildir — her rol grubu bir tenant'a **scoped**'dır (bkz. §6); bir tenant'ın rol grubu başka bir tenant'ta görünmez veya kullanılmaz. `navigation` bir yüzeyin *içindeki* alan/kolon düzenini yönetmez (o iş `SurfaceContractSchema.elements`/`layout`'ta kalır); yalnız yüzeyler-arası kabuk navigasyonunu (ekranlar arası menü) tanımlar. Tek bir panel örneği asla iki katmanı karıştırmaz — bir Surface ya `developer` ya `tenant-admin` ya `tenant-enduser` ya `counterparty`dir, ikisi birden olamaz.

---

## 3. Sözleşme şekli — şema (Zod, `src/schemas/surface.ts` genişletmesi)

Bu bölüm alan-adı + tip + amaç verir; implementasyon kodu değildir. Aşağıdaki üç alan `SurfaceContractSchema`'ya **opsiyonel-varsayılanlı** olarak eklenir (geriye-dönük uyum: mevcut 8 tip ve mevcut alanlar bozulmaz — `surface-v2-directive.md §6`'daki aynı disiplin).

### 3.1 `panelTier`

| Alan | Tip | Amaç |
|---|---|---|
| `panelTier` | `z.enum(["developer","tenant-admin","tenant-enduser","counterparty"])` | Surface'in hangi aktör sınıfı için tasarlandığını beyan eder. Zorunlu alan (varsayılansız) — her yeni Surface bunu açıkça seçmelidir; sessiz varsayılan, yanlışlıkla yanlış katmana surface eklenmesini gizler. |

Neden zorunlu, neden varsayılansız: `permissions[]` gibi "boşsa ArcheType'a devret" davranışı burada **kasıtlı olarak reddedilir**. Panel katmanı belirsiz bırakılabilecek bir alan değildir; bir Surface'in hangi kullanıcı sınıfı için var olduğu tasarım zamanında bilinir ve açıkça yazılmalıdır.

### 3.2 `roleGroups`

Tenant-scoped rol grubu modeli — tenant-admin'in kendi tenant-enduser rollerini tanımlamasını (WordPress'in rol/yetenek modeline benzer şekilde) birinci sınıf yapar.

| Alan | Tip | Amaç |
|---|---|---|
| `roleGroups` | `z.array(RoleGroupSchema).default([])` | Bu Surface'in (veya onu barındıran tenant-admin panelinin) tanımlayabileceği rol grupları listesi. |
| `RoleGroupSchema.id` | `z.string()` | Rol grubunun tenant-içi benzersiz kimliği (ör. `"ik-uzmani"`, `"satis-temsilcisi"`). |
| `RoleGroupSchema.label` | `z.string()` | İnsan-okunur etiket; i18n-text alanına bağlanabilir (bkz. `surface-v2-directive §9` — tek-kaynak çeviri ilkesiyle aynı disiplin: etiket burada tekrar çevrilmez). |
| `RoleGroupSchema.permissions` | `z.array(z.string()).default([])` | Bu rol grubuna atanan izin anahtarları. **Bu liste PDP'nin izin kataloğuna referans verir; PDP'nin kendisi değildir** — yani burada bir izin adının bulunması otomatik yetki vermez, PDP kendi kaydında bu izni ayrıca tanımlamış ve kararını bağımsız vermiş olmalıdır (§1.3). |
| `RoleGroupSchema.tenantScope` | `z.string()` (zorunlu, boş olamaz) | Bu rol grubunun ait olduğu tenant kimliği. Boş/joker (`"*"`) **yasaktır** — bir rol grubu asla tüm tenant'lara birden ait olamaz (bkz. §6 çapraz-katman izolasyonu). |

Neden mevcut `permissions[]` yetmiyor: `permissions[]` düz bir string dizisidir — hangi tenant'a ait olduğunu, hangi kullanıcı sınıfı için tanımlandığını, insan-okunur bir etiketi olup olmadığını bilmez. Bir tenant-admin "yeni bir rol tanımla" dediğinde, bugünkü şemada bunun karşılığı yoktur; `roleGroups`, bu eylemi (rol oluşturma, etiketleme, izin atama) tenant-scoped birinci sınıf bir varlık yaparak WordPress benzeri "kur-çalıştır" deneyimini şema düzeyinde mümkün kılar. `permissions[]` alanı **kaldırılmaz** — `roleGroups[].permissions` onu tenant-scoped bir grup içinde yeniden kullanır; geriye dönük kırılma yoktur.

### 3.3 `navigation`

İzin-sürümlü (permission-aware) menü ağacı — panelin kabuk navigasyonunu (ekranlar-arası menü/sidebar) tanımlar. `gap-2026-07-02-03-surface.md §4 G-S2`'nin tespit ettiği "navigasyon/IA hiç yok" boşluğunu kapatır.

| Alan | Tip | Amaç |
|---|---|---|
| `navigation` | `z.array(NavNodeSchema).default([])` | Bu Surface'i barındıran panelin menü ağacı (kök düğümler listesi). |
| `NavNodeSchema.label` | `z.string()` | Menü düğümünün insan-okunur etiketi; i18n tek-kaynak ilkesine tabi. |
| `NavNodeSchema.route` | `z.string()` | TanStack Router rotası (ör. `/hrms/izin-talepleri`). Bu alan bir React bileşeni/prop tanımlamaz — yalnızca hangi rotanın hangi düğüme bağlı olduğunu beyan eder. |
| `NavNodeSchema.requiredPermission` | `z.string()` | Bu düğümün görünmesi için gereken izin anahtarı. **Sunum kuralıdır**: izin yoksa düğüm istemcide render edilmez. Arkasındaki rota/veri PDP tarafından ayrıca ve bağımsız korunur (§1.3, §5). |
| `NavNodeSchema.children` | `z.array(NavNodeSchema).default([])` (kendine-referanslı/recursive) | Alt menü düğümleri; aynı `requiredPermission` disiplinine tabi, iç içe geçebilir. |

Bir menünün "izin-sürümlü" olması şu anlama gelir: aynı panelTier'e ait iki farklı rol grubu, aynı `navigation` ağacından **farklı bir görünür alt-küme** türetebilir — çünkü her düğüm kendi `requiredPermission`'ını taşır ve render eden taraf (istemci) bu ağacı kullanıcının izin kümesiyle süzer. Bu süzme işlemi bir **kolaylık**tır (kullanıcıya erişemeyeceği bir menüyü göstermemek, kafa karışıklığını azaltır); bir **güvenlik kontrolü değildir** — bu, dokümanın en kritik tekrarıdır (§1.3, §7).

### 3.4 Neden mevcut `permissions[]` tek başına yetmiyor — özet

`permissions[]` üç sorunu birden çözemez: (1) **katman-körlüğü** — bir izin adının hangi panel katmanına (developer mi, tenant-enduser mi) ait olduğunu bilmiyor; aynı izin adı yanlışlıkla iki farklı katmanda paylaşılabilir. (2) **tenant-körlüğü** — bir rol/izin setinin hangi tenant'a scoped olduğunu bilmiyor; bugünkü şema bunu zorlamıyor, bu yüzden çapraz-tenant sızıntı riskini şema düzeyinde **önlemiyor**, yalnızca insan disiplinine bırakıyor. (3) **navigasyon-körlüğü** — bir Surface'in ekranlar-arası menüde nerede durduğunu hiç bilmiyor; her ürün ekibi kendi menü mekanizmasını icat ediyor. `panelTier` + `roleGroups` + `navigation` üçlüsü bu üç körlüğü birlikte kapatır; üçü ayrı ayrı yeterli değildir, birlikte bir sözleşme oluşturur.

### 3.5 Frontend teknoloji notu

Render eden taraf Vite + React + TanStack Router/Query'dir; **headless** yaklaşım benimsenir — yani `navigation`/`roleGroups` şeması bir bileşen kütüphanesi veya görsel tasarım kararı dayatmaz (hangi sidebar bileşeni, hangi renk, hangi genişlik — bunlar kullanıcı/ürün tercihidir, bu dokümanın kapsamı dışındadır). Şema yalnız *veri* + *davranış sözleşmesi* (hangi düğüm hangi izne bağlı, hangi rota) verir; render'ı üstlenen taraf bu veriyi kendi bileşen setiyle çizer. Bu, `surface-spec.md §1`'deki SDUI ilkesiyle (sunucudaki sözleşme neyin görüneceğini söyler, istemci çizer) birebir uyumludur.

---

## 4. CI kapısı etkisi (önerilen)

> Bu bölümdeki her madde **önerilen** davranıştır — bugün `check-surface.mjs`'de **çalışan** bir kural değildir. `gap-2026-07-02-03-surface.md §5` bunu doğrular: kapının bugün gerçekten zorladığı tek şey workflow/ECA durum-makinesi tutarlılığıdır; tip/layout allowlist'i eski 8/6 değerine sabittir ve `archetypeRef` çapraz-referansı hiç denetlenmez. Aşağıdaki öneriler bu boşluğu **kapatma planıdır**, mevcut durumun tarifi değildir.

`check-surface` genişletmesi için önerilen üç kural:

| # | Önerilen kural | Ne kapatır |
|---|---|---|
| 1 | Her Surface `panelTier` taşımalı (zorunlu alan; §3.1 gereği varsayılansız) | Sessizce panelTier'siz bırakılmış Surface'lerin CI'dan geçmesini engeller |
| 2 | `navigation[].requiredPermission` gerçek bir izne (rol/permission kataloğuna) çözülmeli — kataloğu olmayan bir izin adına referans veren düğüm reddedilir | Yazım hatalı/var-olmayan izin adına bağlı "hayalet" menü düğümlerini engeller |
| 3 | `archetypeRef` çapraz-referansı doğrulanmalı — bugün `techProfileRef` çapraz-kontrol ediliyor ama `archetypeRef` **edilmiyor** (`gap-2026-07-02-03-surface.md §4 P1`: "sessiz izlenebilirlik deliği") | Silinmiş/yazım-hatalı ArcheType id'sine işaret eden Surface'in CI'dan sessizce geçmesini engeller |

Ek önerilen kural (§6 ile bağlı): tenant-scoped bir `roleGroups[].tenantScope` değeri, aynı Surface örneğinde birden fazla farklı tenant kimliği taşıyamaz — bu, çapraz-tenant rol grubu karışmasının şema/CI düzeyinde erken yakalanmasını sağlar.

Bu dört madde şu an **tasarım önerisidir**; `check-surface.mjs`'e uygulanana kadar bağlayıcı bir kapı değildir. Bu doküman kilitlendiğinde (insan onayı), bu bölüm ayrı bir implementasyon görevine (issue/PR) dönüştürülmelidir.

---

## 5. Multi-tenant + AI guardrail

### 5.1 Multi-tenant izolasyon

- **developer** paneli tenant-üstüdür (cross-tenant) — bu, platformun kendi ekibi için **kasıtlı bir istisnadır**, tenant-admin veya tenant-enduser için asla geçerli değildir.
- **tenant-admin** paneli tenant-scoped'dır — yalnız kendi tenant'ının verisini/rollerini görür/yönetir; başka tenant asla görünmez.
- **tenant-enduser** paneli tenant-içi **rol-scoped**'dır — kendi tenant'ı içinde dahi, yalnız kendi `roleGroup`'unun izin verdiği kesitte çalışır. İki farklı rol grubundaki iki tenant-enduser, aynı tenant'ta bile farklı menü/veri görebilir.
- **counterparty** en dar kapsamdır — tenant'ın dışındadır, yalnız davet edildiği tek kayda (`surface-counterparty-portal-addendum.md §6`'daki PDP-gated limited-scope + iç-veri-sızıntısı-yok invariantı) erişir. Bu doküman o invariant'ı **tekrar tanımlamaz**, yalnızca `panelTier: "counterparty"` değerinin aynı dört-katman ayrımına dördüncü komşu sınıf olarak dahil olduğunu sabitler.

Bu dört seviye **hiyerarşik değildir** yalnızca genişlik/dar bakımından sıralı görünür (developer en geniş, counterparty en dar) — ama gerçek yetki kararı her zaman PDP'nindir; `panelTier` bu hiyerarşiyi **uygulamaz**, yalnız betimler.

### 5.2 AI guardrail

`panelTier`/`roleGroups`/`navigation` alanları da actionplan'ın çekirdek AI güvenlik invariant'ına tabidir (`surface-v2-directive §7`, `surface-counterparty-portal-addendum §7` ile aynı disiplin):

> Kullanıcı niyet söyler → AI önizler/önerir (uygulamaz) → insan onaylar → motor uygular.

Somut kural: AI bir tenant-admin için **menü taslağı** veya **rol grubu taslağı** önerebilir (ör. "bu ürün için tipik bir İK rol seti şöyle olabilir: İK Uzmanı, İK Yöneticisi, Çalışan"). Ancak bu taslağın **yetki etkisi** — yani önerilen rol grubuna hangi gerçek izinlerin bağlanacağı — PDP'nin kendi kaydında tanımlanmalı ve **insan onayı** olmadan uygulanmamalıdır. AI asla: (a) doğrudan bir `roleGroups[].permissions` değerini canlı sisteme yazamaz, (b) bir `navigation` düğümünü insan onayı olmadan yayına alamaz, (c) `panelTier` değerini kendi kararıyla değiştiremez (bu, bir Surface'in hangi aktör sınıfına ait olduğunu belirleyen temel karardır, geri dönüşü riskli bir karardır — daima insan onaylı). Bu, `surface-spec §12`'deki `generative-view` invariant'ının (AI öneren seviyede kalır, main'e/veriye doğrudan yazan seviyede değil) panel-tier bağlamına uygulanmasıdır.

---

## 6. Test stratejisi (test-ÖNCE negatif testler)

Aşağıdaki testler, `check-surface` kapısına (§4'teki önerilen kurallarla birlikte) uygulanana kadar **hedef tanımıdır**; test-önce disiplini gereği önce bu testler yazılır, sonra implementasyon bu testleri yeşile taşır. Odak, üç eksende **negatif** kanıttır: sızıntı reddi, görünmezlik, ve alan-gizlemenin güvenlik sınırı OLARAK KULLANILMADIĞININ kanıtı.

| # | Test | Ne doğrular |
|---|---|---|
| 1 | Zorunlu alan | `panelTier` alanı olmayan bir Surface tanımı şema-validasyonundan geçmez (varsayılansız zorunlu alan; §3.1) |
| 2 | Çapraz-katman sızıntı reddi (tenant-enduser → developer) | Bir `tenant-enduser` paneli oturumu, `panelTier: "developer"` olan bir Surface'in navigasyon veya veri kaynağına erişim **istediğinde** reddedilir — hem istemci-navigasyonda görünmez hem backend/PDP bağımsız olarak reddeder (≥1 negatif case her yön için) |
| 3 | Çapraz-katman sızıntı reddi (tenant-admin → başka tenant) | Bir tenant-admin oturumu, kendi `tenantScope`'u dışındaki bir `roleGroups` kaydına veya Surface'e erişemez; joker (`"*"`) `tenantScope` değeri şema-validasyonunda reddedilir |
| 4 | Çapraz-katman sızıntı reddi (counterparty → iç panel) | `panelTier: "counterparty"` oturumu, `tenant-admin`/`tenant-enduser`/`developer` navigasyon ağacının hiçbir düğümüne erişemez (`surface-counterparty-portal-addendum §6` invariant'ıyla tutarlı) |
| 5 | İzinsiz menü düğümü görünmezliği | Bir kullanıcının izin kümesinde `requiredPermission`'ı karşılanmayan bir `NavNode`, render edilen menüde **görünmez** (istemci-tarafı süzme testi) |
| 6 | **Alan-gizleme güvenlik-sınırı-DEĞİL kanıtı (kritik)** | Test 5'teki gizlenen menü düğümünün arkasındaki rota/API, düğüm menüde görünmese bile, kullanıcı doğrudan URL/istek ile erişmeyi denediğinde **PDP tarafından bağımsız olarak reddedilir**. Bu test, istemci-tarafı gizlemenin tek başına yeterli olmadığını — yani "menüde yok = korunuyor" varsayımının **yanlış** olduğunu — kanıtlamak için özellikle yazılır. Test, önce navigasyon-gizlemeyi devre dışı bırakıp (düğümü zorla render ettirip) backend'in yine de reddettiğini göstererek ispat gücünü artırır. |
| 7 | Rol grubu tenant-scope zorunluluğu | Boş veya joker `tenantScope` içeren bir `RoleGroupSchema` kaydı şema-validasyonundan geçmez |
| 8 | `roleGroups[].permissions` → PDP referans testi | Bir rol grubunun izin listesindeki her anahtar, PDP izin kataloğunda gerçekten var olmalı — kataloğu olmayan bir izin adı testte yakalanır (bkz. §4 önerilen kural 2'nin test karşılığı) |
| 9 | AI guardrail | AI'ın önerdiği bir `roleGroups`/`navigation` taslağı, insan onayı olmadan canlı sisteme yazılmaya çalışıldığında reddedilir; `panelTier` değeri AI tarafından tek başına değiştirilemez |
| 10 | `archetypeRef` çapraz-referans (§4 önerilen kural 3'ün test karşılığı) | Var olmayan/silinmiş bir `archetypeRef`'e işaret eden Surface CI'dan geçmez |

**Aktör açıklığı (test bağlamında).** *Geliştirici* Surface'i `panelTier` ile tanımlar; *sistem/istemci* navigasyonu izin-kümesiyle süzer (Test 5); *PDP* her isteği yüzeyden bağımsız olarak yeniden değerlendirir (Test 6 — bunun ispatı); *CI* Test 1-10'u `check-surface` kapısında zorunlu tutar; *insan* AI'ın taslak önerilerini onaylar (Test 9).

---

## 7. Kabul kriterleri

1. `SurfaceContractSchema`'ya `panelTier` (zorunlu enum), `roleGroups` (varsayılan boş dizi) ve `navigation` (varsayılan boş dizi) alanları eklendi; mevcut 8 tip ve mevcut alanlar (`permissions[]` dahil) geriye-dönük bozulmadı.
2. `RoleGroupSchema` (`id`, `label`, `permissions[]`, `tenantScope` — zorunlu, joker yasak) ve `NavNodeSchema` (`label`, `route`, `requiredPermission`, `children[]` — recursive) ayrı şema tanımları olarak mevcut.
3. `panelTier` dört değeri (developer/tenant-admin/tenant-enduser/counterparty) enum'da tanımlı; `counterparty` değeri `surface-counterparty-portal-addendum.md`'deki tanımla çelişmiyor, ona referans veriyor.
4. §6'daki 10 test yeşil; özellikle Test 6 (alan-gizleme ≠ güvenlik sınırı kanıtı) ve Test 2-4 (çapraz-katman sızıntı reddi) negatif-case olarak kanıtlı.
5. §4'teki üç CI kuralı (panelTier zorunluluğu, navigation izin-çözümlemesi, archetypeRef çapraz-referansı) **implementasyon görevi olarak açıldı** (bu doküman kilitlendiğinde hemen ardından); bu bölüm "önerilen" ibaresini taşıdığı sürece kabul kriteri "kod çalışıyor" değil "görev açıldı ve tasarım net" anlamına gelir.
6. §1.3'teki non-goal uyarısı (panelTier sunum katmanı, PDP güvenlik sınırı) hem bu dokümanda hem türetilecek ADR'de birebir korunuyor.
7. İnsan onayı (kilit) verildi; taslak durumu kaldırıldı.

---

## 8. Anti-patterns

Aşağıdakiler bu sözleşmenin yasakladığı desenlerdir; CI veya review bunları reddeder.

- **Alan-gizlemeyi güvenlik sanmak.** Bir menü düğümünü veya form alanını `navigation`/`panelTier` ile gizleyip, arkasındaki API'yi PDP'den bağımsız korumamak (§1.3, §6 Test 6). Bu dokümanın en kritik yasağıdır.
- **`panelTier`'i yetki motoru gibi kullanmak.** `if panelTier === 'developer'` gibi istemci-tarafı bir dallanmayı tek başına yetki kararı yerine geçirmek; gerçek karar her zaman PDP'den gelmelidir.
- **Joker/boş `tenantScope`.** Bir rol grubunu tüm tenant'lara birden bağlamak (`"*"` veya boş); her rol grubu tam olarak bir tenant'a scoped olmalıdır.
- **Sessiz varsayılan `panelTier`.** Alanı opsiyonel/varsayılanlı bırakıp yeni Surface'lerin yanlışlıkla yanlış katmana (veya hiçbir katmana) düşmesine izin vermek — bu yüzden alan §3.1 gereği zorunlu ve varsayılansızdır.
- **counterparty'yi iç katmanla karıştırmak.** `panelTier: "counterparty"` bir Surface'e `tenant-enduser` navigasyon ağacından düğüm sızdırmak veya tersi (§6 Test 4).
- **AI'a doğrudan rol/izin yazdırmak.** AI'ın önerdiği bir rol grubu veya menü taslağının insan onayı beklemeden canlıya yazılması (§5.2).
- **Ürün-ekibi başına ayrı konvansiyon.** Bu sözleşmeyi atlayıp kendi "panel katmanı" alanını icat etmek — bu, dokümanın çözmeye çalıştığı P0 boşluğun ta kendisidir.
- **`if module === 'x' else` tarzı koda-gömülü dallanma.** Navigasyon/rol davranışı config-driven olmalı, kaynak koduna gömülü özel-durum dallanmasıyla değil (repo-geneli anti-pattern, burada da geçerli).

---

## 9. DoD (Definition of Done)

Şema genişledi (`panelTier` + `roleGroups` + `navigation`, §3) + §6'daki 10 test yeşil + §4'teki üç CI kuralı en azından implementasyon görevi olarak açık (kilitlenme anında "önerilen"den "planlı"ya geçti) + §7'deki 7 kabul kriteri karşılandı + insan onayı (kilit) verildi + bu doküman durumu "Taslak" etiketinden çıkarıldı. Mevcut 8 Admin-Surface tipi, `renderStrategy`, ve `counterparty-portal` ailesi (addendum) geriye-dönük bozulmadı. §1.3'teki non-goal uyarısı (panelTier ≠ güvenlik sınırı) ADR olarak ayrıca kilitlenmek üzere işaretlendi.

---

## 10. Ürün etkisi

Platformun 18 ürünü (HRMS, CRM, PMS, MRP, CLM, PIM, e-ticaret ve diğerleri) **her biri** üç panel katmanı gereksinimiyle karşı karşıyadır: kendi developer/kernel-admin görünümü, kendi müşteri süper-admin paneli, kendi son-kullanıcı deneyimi (rol gruplarıyla). Bu sözleşme kilitlenmeden her ürün ekibi bu üçlü ayrımı kendi başına, kendi adlandırmasıyla, kendi tutarlılık seviyesiyle inşa eder — sonuç, `gap-2026-07-02-03-surface.md`'nin uyardığı gibi, 18 farklı konvansiyondur ve kernel'in "bir kez tanımla, her yerde yeniden kullan" vaadi ürün-ürün ayrışarak fiilen çöker. Bu doküman kilitlendiğinde, her ürün ekibi aynı üç (dört, counterparty ile) alanı, aynı isimle, aynı test disipliniyle kullanır; panel katmanı bir kere kernel'de çözülür, 18 kez değil.

---

*Bağlı dokümanlar: `docs/surface-spec.md` (kanonik Surface spesifikasyonu) · `docs/surface-v2-directive.md` (şema-hizalama direktifi; §7 AI-guardrail, §9 i18n tek-kaynak ilkesiyle aynı disiplin) · `docs/surface-counterparty-portal-addendum.md` (dördüncü aktör sınıfının kaynak tanımı; bu doküman onu tekrar tanımlamaz) · `docs/gap-2026-07-02-03-surface.md` (§4 G-S1, G-S2 — bu dokümanın doğrudan gerekçesi) · `docs/adr-P1-pdp.md` (PDP; §1.3, §5, §6 Test 6'nın güvenlik temeli) · `docs/ci-conformance-gates.md` (`check-surface` kapısı; §4'ün hedef entegrasyon noktası) · `docs/drafts/panel-tier-contract.md` (önceki taslak iskelet; bu doküman onu genişletti). Şema hedefi: `src/schemas/surface.ts` (`SurfaceContractSchema` += `panelTier`, `roleGroups`, `navigation`).*
