# Rapor 2 — Kernel Katmanı Eleştirisi

**Tarih:** 2026-07-01 · **Kaynak:** `k-identity`, `k-authz`, `k-tenancy(-deep)`, `k-bus`, `k-schema`, `k-mod-l`, `k-plugin`, `k-agent-runtime`, `k-control-planes`, `k-sozlesme`, `scale-*` (15 düğüm), `platform-db-schema`, `platform-authn-authz`, `platform-tenancy` · **Mercekler:** yüksek-trafik (ağır), AI-First (ağır), UX (düşük).

---

## 1. Kernel nedir / ne yapar / ne yapmaz

**Bu nedir?** Kernel, sisteminizin "kalbi" (sizin `k-terminoloji` tanımınız): tüm app'lerin paylaştığı Layer-0 çekirdek hizmetler. Dikey bir ürün değil; diğer app'lere çekirdek hizmet veren altyapı. Muadilleri: Frappe framework çekirdeği, Salesforce platform katmanı, Directus/Strapi çekirdeği.

**Ne işe yarar?** Her app'in sıfırdan yazmak zorunda kalmayacağı ortak yetenekleri tek yerde toplar: "kim bu istek?" (identity), "ne yapabilir?" (authz), "hangi müşterinin verisi?" (tenancy), "kayıt tipi nasıl tanımlanır?" (schema/ArcheType motoru), "modüller nasıl konuşur?" (bus), "eklenti nasıl yüklenir?" (plugin/module registry).

**Ne yapar?** Somut kernel modülleri: `k-identity` (principal/oturum/MFA/token), `k-authz` (ReBAC+ABAC query-layer'a örülü), `k-tenancy` (tenant_id + RLS day-1; `k-tenancy-deep` sharding), `k-schema` (ArcheType metadata motoru), `k-bus` (event bus + Python/Node polyglot köprü), `k-mod-l`/`k-plugin` (registry+manifest+sandbox), `k-agent-runtime` (MCP tool kaydı + ajan belleği + orkestrasyon), `k-control-planes` (dört düzlem: Ops/Developer/Tenant/Public). Ölçek yetenekleri ayrı bir aile: `scale-*` (cache/outbox/saga/projections/idempotency/realtime/ratelimit/gis/streaming/timeseries/workers...).

**Ne yapmaz?** Kernel domain iş mantığı taşımaz (o app'lerde), UI render etmez (o Surface'te). Bu ayrım doğru. Bu raporun tezi: kernel **altyapı primitiflerinde güçlü, "iş-evreni primitiflerinde" (aktör, yetenek, hesap) ve "zorunlu ölçek-invariantlarında" eksik**; ayrıca iki altyapı (medya düzlemi, mail transport) *modüle gömülü ama paylaşılan primitife terfi edilmemiş*.

---

## 2. Adil değerlendirme — neyi gerçekten iyi yapıyor

`k-authz`'ın felsefesi doğru: "application-level if-check yetmez → yetki query-layer'a örülür." Bu, satır/alan düzeyi güvenliğin uygulama kodunda unutulma riskini kapatır. Çoğu ürün authz'ı controller'da yapar (sızdırır); siz sorgu katmanına indirmişsiniz.

`k-tenancy` "day-1'den tenant_id her satırda" + RLS (Row-Level Security = veritabanının satır bazında erişim kısıtı). `k-tenancy-deep` sharding'i (yatay bölme) ayrı düşünmüş. `platform-tenancy` bağlamı ContextVar ile taşıyor (parametre-zinciri yok). Bu, çok-kiracılığın en sık hatasını (tenant sızıntısı) sistematik kapatıyor.

`scale-*` ailesi beklediğimden **kapsamlı**: outbox (dual-write çözümü), saga+compensation, CQRS projections, idempotency, sharded hot-counter (HyperLogLog ile yaklaşık sayım!), PostGIS+MVT, timeseries, streaming (ve dürüstçe "Kafka nadiren gerekli" notu). Bu envanter, yüksek-trafik için doğru desen kütüphanesi. Gap analizinin "PostGIS/realtime yok" iddiası bu yüzden yanlıştı.

`k-agent-runtime` gerçek bir farklılaşma: ArcheType action'larını MCP (Model Context Protocol = LLM'lerin araçlara standart erişim protokolü) tool'u olarak servis etmek, "AI-native platform" iddiasını somutlaştırıyor. Çoğu rakip bunu sonradan yamalıyor.

Yani kernel iskeleti sağlam. Sorun, aşağıdaki beş kök sebep.

---

## 3. Zayıflık nedenleri — kök sebep analizi

### 3.1 Kernel tanımı: kriz değil, ADR-kilidi + doküman hijyeni sorunu

Gap analizi "3 canlı kernel tanımı" diye dramatize ediyor. Gerçek daha sakin: `platform-db-schema` ve `platform-authn-authz` düğümleri **Python/FastAPI/SQLAlchemy 2.0/Alembic/PostgreSQL**'de açıkça uzlaşmış (JWT RS256, expand-contract migration, RLS). Yani implementasyon yönü **belli**. Kalıntı çelişki iki şeyden ibaret: (1) `kernel-START-HERE.md`'nin TS/Prisma demesi — bu **bayat bir doküman**, silinmeli/güncellenmeli; (2) GitHub `atonota/kernel`'in "CI/CD çekirdeği" olması — bu muhtemelen *ayrı bir repo/kavram*, ArcheType motoruyla karıştırılmamalı.

Ama daha derin, henüz sorulmamış bir soru var: **Kernel = yalnız ArcheType/DocType motoru mu, yoksa aynı zamanda bir "iş çalıştırıcı" (job runner) mı?** `scale-workers` + `k-agent-runtime` orkestrasyonu + GitHub repo'nun CI/CD doğası, kernel'in ikinci bir yüzü olduğunu ima ediyor. Bu netleşmezse, "kernel" kelimesi iki farklı şeyi (metadata motoru + orkestrasyon motoru) örter ve ekip yanlış anlar. **Aktör açıklığı:** hangi bileşen ArcheType'ı çözümler (schema engine), hangisi işleri zamanlar (worker/orchestrator), hangisi ajanı yönetir (agent-runtime) — üçü ayrı sorumluluk, tek "kernel" adı altında bulanıklaşmamalı.

### 3.2 Kök sebep: "İş-evreni primitifleri" kernel'de değil

Kernel altyapı primitiflerini (identity/authz/tenancy/bus) içeriyor ama **her app'in ortak iş-primitiflerini** ya Layer-1'e itmiş ya hiç koymamış. Bunlar app-özel değil; 16 app'in de ortak ihtiyacı — yani tanım gereği kernel-komşusu:

- **Actor/Party** → `l1-party` (Layer-1). Her app'te aktör var; kimlik (`k-identity`, authentication) ile iş-aktörü (Party) arasında kernel-köprü olmalı. (ArcheType raporu §5.1 ile bağ.)
- **Capability/Entitlement** → hiç yok (sadece `k-boyut3`'te cümle). Lisans/plan/feature-gate kernel-seviyesi; her app kendi feature-flag'ini yazarsa kaos olur.
- **Policy Decision Point (PDP)** → `k-authz` var ama *ArcheType'a gömülü accessPolicy* + query-layer. Eksik olan: **tek, çapraz-kesen karar noktası** — policy-as-data dili (Cedar/OPA/Zanzibar sınıfı), karar-logu, ve **izin simülasyonu** ("bu kullanıcı bu kaydı görebilir mi? neden?"). ChatGPT ve gap analizi ikisi de bunu istedi; ikisi de haklı.
- **Hesaplama servisleri** → dağınık/eksik: **sequence generator** (gap-free fatura/sipariş no — concurrent-safe; gap analizi haklı, hâlâ yok), **money/FX** (`l1-misc`'te "money" ama *misc* olarak), **unit-of-measure** (yok — MRP/PIM için kritik), **business-calendar/çalışma-takvimi** (yok — SLA/vardiya/termin hesabı için), **i18n/l10n** (`l1-misc`). Bunlar "çeşitli yardımcı" değil; yanlış yuvarlama/numara-boşluğu **yasal** sorundur, kernel-grade olmalı.

### 3.3 Kök sebep: Ölçek primitifleri "opt-in bayrak" — bazıları zorunlu-invariant olmalı

`app-scale` düğümü açıkça diyor: "her primitif yeniden-kullanılabilir yetenek; app'ler bunları **bayrakla açar**." Yüksek-trafik/enterprise için bu tehlikeli bir varsayılan. Bazı primitifler *tercih* değil, *doğruluk şartı*dır:

- **Idempotency** kapalıysa → webhook/ödeme retry'ında çift-tahsilat. Bu bir "ölçek özelliği" değil, para-doğruluğu.
- **Transactional outbox** kapalıysa → "kayıt yazıldı ama olay yayınlanmadı" (dual-write) → sipariş var, stok düşmedi.
- **Tenant-aware rate-limit** kapalıysa → bir tenant komşusunu boğar (noisy neighbor).

**Güvenli / riskli / enterprise / sizin durumunuz:** Güvenli görünen = her şeyi opt-in yapıp app'e bırakmak (esnek). Riskli olan = bir app idempotency'yi açmayı unutur, prod'da çift-tahsilat. Enterprise-doğru = bu üçünü (idempotency, outbox, tenant-rate-limit) **para/veri yazan her ArcheType için zorunlu-invariant** yapmak (kapatmak için gerekçeli waiver — sizde `WaiverSchema` zaten var!). Sizin durumunuz: `WaiverSchema`'yı bu invariantlara bağlayın; "kapalı" bilinçli+onaylı+süreli olsun.

### 3.4 Kök sebep: Medya ve mail *primitife terfi edilmemiş* (modül var, primitif yok)

Burada hem gap analizini hem kendi ilk taslağımı düzelttim — çünkü ikimiz de aynı hataya düştük. Gerçek: Teams-benzeri (`s-comms`, "Jitsi arkada — Meet/Zoom/Teams + Slack/Mattermost + Chatwoot") ve Email Suite (`s-mail`, "Mailcow + PowerDNS — Exchange/Gmail Business alternatifi, SPF/DKIM/DMARC") **modül olarak tasarlanmış**. Yani "ürün/altyapı yok" iddiası yanlış. Ama gerçek boşluk daha ince ve hâlâ kernel-seviyesi:

Bu iki altyapı **birinci-sınıf, yeniden-kullanılabilir primitif değil**. Karşılaştırın: PostGIS'e ayrı bir `scale-gis` primitifi verilmiş (birçok app tüketir, ölçek düğümü olarak sertleşmiş). Ama medya düzlemi (WebRTC/SFU/TURN) yalnızca `s-comms`'un dağıtım boyutunda *"Medya/sinyal sunucusu ayrı ölçek (WebRTC)"* notuyla, mail transport ise `s-mail`'in içinde "Mailcow" olarak geçiyor — yani *modüle gömülü*, *paylaşılan primitif değil*. İki sonuç:

- **Ölçek/güvenlik kanıtlanmamış:** SFU'nun kaç eşzamanlı katılımcıya ölçeklendiği, TURN rölesinin coğrafyası/maliyeti; mail'in teslim-edilebilirliği (deliverability), IP-reputation, bounce yönetimi, DR'ı — hiçbiri `scale-*` primitifi sertliğinde ele alınmamış. `be-mail-zinciri` (sağlayıcı-zinciri failover) iyi bir başlangıç ama transport-seviyesi değil, sağlayıcı-seviyesi.
- **Yeniden-kullanım kaybı:** yarın "canlı yayın" (Social) veya "video destek görüşmesi" (CRM) WebRTC isterse, `s-comms`'a gömülü çözümü sıfırdan tekrar üretir.

Doğru okuma: bu **primitife terfi + ölçek/güvenlik sertleştirme** işidir, "sıfırdan ürün yapma" değil. (Terminoloji: SFU = Selective Forwarding Unit, çok-katılımcılı videoyu tek sunucudan seçerek dağıtan bileşen; TURN = NAT-arkası medya rölesi; deliverability = mailin spam'e düşmeden ulaşması.)

### 3.5 Kök sebep: Dağıtık tutarlılık SLA'sı ve bus garantileri belgesiz

`k-bus` "sıralama garantileri" iddia ediyor ama polyglot (Python/Node) köprü + fan-out'ta sıralama ve exactly-once zordur; nasıl sağlandığı belgesiz. Daha kritik: **hangi işlem güçlü-tutarlı (ACID), hangisi nihai-tutarlı (eventual)?** `scale-outbox`+`scale-projections` nihai-tutarlıdır (yazma→projeksiyon arası gecikme var). Ama muhasebe defteri, stok rezervasyonu, ödeme mutabakatı **anlık doğruluk** ister. Kernel bu sınırı (p95/p99 projeksiyon gecikmesi, saga telafi penceresi, hangi ArcheType'ın hangi tutarlılık sınıfında olduğu) **beyan etmiyor**. Bu, yüksek-trafikte "ekranda para tuttu ama defterde yok" hatalarının kaynağıdır.

### 3.6 Kök sebep: Agent-runtime bir farklılaşma ama güvenliği kanıtsız

`k-agent-runtime` kernel'de olması **doğru** (AI-first için). Ama güvenlik yüzeyi teorik: prompt-injection (kullanıcı verisinin ajan talimatına dönüşmesi), tenant-context kaybı (ajan yanlış tenant'ın verisini görmesi), tool-quota/maliyet-limiti, ajan-vs-insan audit ayrımı — hiçbiri test edilmemiş. Sizin `AgentPolicySchema`'nız (`subPromptUntrusted`, `killSwitch`, `forbiddenActions`) doğru *niyeti* taşıyor; ama kernel'de bunların *enforcement*'ı ve *conformance testi* yok. Bir AI-first platformda ajan güvenliği kernel-grade güvenlik sorunudur, sonradan eklenemez.

---

## 4. Gap analizi — önceliklendirilmiş

Sade özet: kernel boşlukları üç sınıfa ayrılır — (a) *yanlış katman* (Actor/Capability/hesap → L1'den kernel'e terfi), (b) *yanlış varsayılan* (scale opt-in → zorunlu-invariant), (c) *primitife terfi edilmemiş* (WebRTC, mail transport — modül var, primitif yok) ve *gerçek yokluk* (PDP dili, tutarlılık SLA).

| # | Boşluk | Sınıf | Öncelik | Bloke ettiği |
|---|---|---|---|---|
| 1 | Actor/Party kernel-primitifi | Yanlış katman | P0 | Tüm app'ler |
| 2 | Capability/Entitlement + lisans | Gerçek yokluk | P0 | SaaS paketleme, tüm app'ler |
| 3 | Zorunlu scale-invariant (idempotency/outbox/rate-limit) | Yanlış varsayılan | P0 | Para/veri yazan her app |
| 4 | Dağıtık tutarlılık SLA + tutarlılık-sınıfı beyanı | Gerçek yokluk | P0 | Muhasebe, MRP, ödeme, stok |
| 5 | WebRTC/SFU medya düzlemini primitife terfi + ölçek kanıtı | Primitife terfi | P1 | Teams (`s-comms` var), canlı yayın, video-destek |
| 6 | Mail transport'u primitife terfi + deliverability/DR | Primitife terfi | P1 | Email (`s-mail` var), teslim-edilebilirlik |
| 7 | Merkezî PDP + policy-as-data + izin-simülasyonu | Kısmi (authz var) | P1 | Enterprise güvenlik, denetim |
| 8 | Hesaplama primitifleri (sequence/money/UoM/calendar) | Dağınık/yok | P1 | Muhasebe, MRP, PIM, HRMS |
| 9 | Agent-runtime güvenlik enforcement + conformance | Kanıtsız | P1 | AI-first iddiası |
| 10 | Bus sıralama/exactly-once garantisi belgesi | Belgesiz | P2 | Olay-güdümlü doğruluk |

---

## 5. Önerilen tasarım (mimari tarif)

### 5.1 Kernel primitif haritası — neyi kernel'e terfi, neyi Layer-1'de bırak
Karar kuralı (basit): *"16 app'in ≥%70'i bunu kullanıyor ve yanlış yapılırsa yasal/güvenlik sorunu mu?"* → evet ise kernel. Buna göre:

- **Kernel'e terfi:** Actor/Party (kimlikle köprülü), Capability/Entitlement, sequence generator, money/FX, unit-of-measure, business-calendar, PDP. (Hepsi her app'te + doğruluk-kritik.)
- **Kernel'de zaten doğru:** identity, authz-engine, tenancy, bus, schema, agent-runtime.
- **Layer-1'de kalabilir:** notification, search, file, import/export, SEO ailesi. (App-seçici; doğruluk-kritik değil.)

### 5.2 Scale-invariant sözleşmesi
`scale-*`'ı üçe ayırın: **(a) zorunlu-invariant** (idempotency, outbox, tenant-rate-limit) — para/veri yazan ArcheType'ta default-on, kapatmak `WaiverSchema` ile; **(b) opt-in-desen** (cache, projections, streaming, timeseries) — bayrakla; **(c) domain-adaptör** (gis→Fleetx, counter→Social). Böylece "unuttum, çift-tahsilat oldu" sınıfı hata sözleşme düzeyinde imkânsızlaşır.

### 5.3 Tutarlılık-sınıfı beyanı
Her ArcheType'a `consistencyClass`: `strong` (ACID, tek-DB transaction — defter/stok/ödeme) veya `eventual` (outbox+projection — rapor/feed/arama). Kernel, `eventual` için p95/p99 gecikme SLO'su ve saga telafi penceresi yayınlar. **Aktör açıklığı:** *sistem* tutarlılık-sınıfını enforce eder; *geliştirici* ArcheType'ta beyan eder; *CI* "strong beyan edildi ama event-driven yol kullanılmış" çelişkisini bloke eder.

### 5.4 Medya + mail'i modülden çıkarıp primitife terfi et
`s-comms` (Jitsi) ve `s-mail` (Mailcow) modül olarak **var**; eksik olan, içlerindeki altyapıyı **paylaşılan primitife** çıkarmak: `scale-media` (WebRTC/SFU/TURN sinyalleşme + kayıt + eşzamanlı-katılımcı ölçek profili) ve `k-mail-transport` (SMTP/IMAP daemon + DKIM/SPF/DMARC + mailbox store + deliverability/IP-reputation/DR). Böylece yarın Social'ın canlı-yayını veya CRM'in video-desteği aynı `scale-media`'yı tüketir; `s-comms`'a gömülü çözüm tekrar üretilmez. `scale-gis` bu terfinin hazır şablonudur (bir domain ihtiyacı, birçok app'in tükettiği ölçek-primitifine dönüşmüş).

### 5.5 PDP terfisi
`k-authz`'ı merkezî PDP'ye yükseltin: policy-as-data (yapısal, serbest-kod-değil — sizin felsefenizle uyumlu), her kararın audit-log'u, ve **izin-simülasyonu** yüzeyi (Boyut 2 developer paneline). Bu, gap analizinin "permission simulation" ve ChatGPT'nin "policy engine" isteğini tek yerde karşılar; üstelik ArcheType.accessPolicy'yi bu PDP'nin *girdisi* yapar (çelişki değil, besleme).

---

## 6. Üç mercek — Kernel özelinde

### 6.1 Yüksek-trafik (bu raporun en ağır merceği)
Envanter iyi (scale-*). Eksik olan üç şey **operasyonel sertlik**: (1) zorunlu-invariant (§5.2) — yoksa ölçek "özellik" kalır, "garanti" olmaz; (2) tutarlılık-SLA (§5.3) — yoksa "hızlı ama yanlış" olur; (3) `scale-multiregion` var ama **DR tatbikatı** (RTO/RPO'yu düzenli test etme, gap analizi haklı) süreç olarak yok — KVKK yükümlülüğü. Ayrıca `k-tenancy-deep` sharding'i tanımlıyor ama **cross-shard sorgu** (bir tenant'ın raporu iki shard'a yayılırsa) ve **rebalancing** operasyonel olarak en pahalı kısım; bunlar plan-seviyesinde, kanıt-seviyesinde değil.

### 6.2 AI-First
Kernel'de agent-runtime olması stratejik-doğru. Ama AI-first, kernel-güvenlik yüzeyini genişletir: ajan bir *aktör* (Actor) olmalı (kendi kimliği, kendi capability tavanı, kendi audit kanalı — `k-control-planes`'te "Agent" düzlemi zaten var, iyi). Öneri: agent'ı Actor sözleşmesine (ArcheType §5.1) bağlayıp, tool-quota + maliyet-limiti + prompt-injection guard'ı **conformance testiyle** zorunlu kılın. "Sadece öneren / değiştiren / PR açan / main'e yazan" ayrımınızda ajan **kernel seviyesinde en fazla 'öneren+PR-açan'** olmalı; main'e insan onayı olmadan yazmamalı — bu, `ciAutoPush:false` invariant'ınızla uyumlu ve doğru.

### 6.3 UX (düşük ama sıfır değil)
Kernel'in UX'e tek doğrudan teması `k-control-planes`: dört düzlem (Ops/Developer/Tenant/Public) ayrı yetki-tavanı + ayrı audit kanalı. Bu ayrım UX için sağlıklı (her kitleye kendi yüzeyi). Eksik: **izin-simülasyonu** ve **karar-açıklama** ("neden bu kaydı göremiyorum?") bir UX özelliğidir; PDP terfisi (§5.5) bunu besler.

---

## 7. Unknown-unknowns — risk keşif checklist'i

- **Polyglot bus başarısızlık modu:** Python tarafı ayakta, Node köprüsü düşükken olaylar nereye gider? Sıra korunur mu, kaybolur mu?
- **Kernel sözleşme evrimi 16 app'e yayılırken:** bir kernel kontratı (ör. Actor) değişirse hangi app'ler kırılır? "Değişiklik → etkilenen app matrisi" yok (gap analizi de flagledi).
- **Cold-start/bootstrap sırası:** kernel modülleri hangi sırayla ayağa kalkar? authz, identity'den önce açılırsa? Bağımlılık döngüsü var mı?
- **Tenant başına ölçek profili çatışması:** aynı kernel, hem "muhasebe" (düşük yazım, güçlü tutarlılık) hem "social feed" (yüksek yazım, nihai tutarlılık) app'ini taşıyor. Tek tenancy/tutarlılık varsayımı ikisine de uymaz — tiered tenancy gerekebilir.
- **Kapalı-çekirdek lisans enforcement:** kernel "kapalı çekirdek" ise, self-host eden tenant lisansı nasıl doğrulanır/gate'lenir? (Capability sözleşmesiyle bağ.)
- **Agent-runtime maliyet patlaması:** kötü bir prompt zinciri (chain) tool-quota'yı aşarsa fatura kim öder? FinOps atıfı (gap analizi) + ajan maliyet-limiti kesişimi.
- **Veri residency + failover çelişkisi:** "TR verisi TR'de" derken multi-region failover İrlanda'ya geçerse KVKK ihlali? Failover'da residency-gate belgesiz.

---

## 8. Kilitlenecek ADR taslakları

- **ADR-K1 — Kernel kimliği ve sınırı.** Karar: kernel = ArcheType motoru mu, + orkestrasyon/job-runner mı? `atonota/kernel` (CI/CD) repo'sunun rolü? `kernel-START-HERE.md` (TS/Prisma) statüsü? Öneri: stack=Python/FastAPI kilitle, bayat dokümanı sil, üç sorumluluğu (schema/worker/agent) ayrı adlandır.
- **ADR-K2 — İş-primitiflerinin katmanı.** Karar: Actor/Capability/sequence/money/UoM/calendar/PDP kernel'e mi? Öneri: evet (§5.1 kuralı).
- **ADR-K3 — Scale-invariant zorunluluğu.** Karar: idempotency/outbox/tenant-rate-limit opt-in mi, para/veri-yazan ArcheType'ta zorunlu mu? Öneri: zorunlu + Waiver.
- **ADR-K4 — Tutarlılık-sınıfı sözleşmesi.** Karar: ArcheType strong/eventual beyan eder mi, SLO yayınlanır mı? Öneri: evet; CI çelişki-gate.
- **ADR-K5 — Medya/mail primitife terfi.** Karar: `s-comms`/`s-mail` içindeki WebRTC ve SMTP altyapısı `scale-media`/`k-mail-transport` primitifine çıkarılsın mı, modülde mi kalsın? Öneri: terfi (çünkü ≥3 app tüketecek — Teams/Social/CRM ve Email/bildirim); `scale-gis` şablonu.
- **ADR-K6 — Agent-runtime güvenlik enforcement.** Karar: prompt-injection/quota/tenant-context conformance testi zorunlu mu? Öneri: evet, kernel-grade.

---

## 9. Öncelikli aksiyonlar (Kernel)

1. **ADR-K1'i kilitle** (blocker): stack + kernel-sınırı + bayat doküman temizliği. Tek günlük iş, her şeyi açar.
2. **Scale-invariant kararını ver (ADR-K3)** ve para/veri-yazan ArcheType'lara default-on yap — en yüksek "sessiz felaket" önleme getirisi.
3. **Tutarlılık-sınıfı beyanını (ADR-K4)** ilk dikey dilimde uygula (muhasebe fişi = strong, feed = eventual).
4. **İş-primitiflerini (ADR-K2)** kernel yol haritasına al; sequence + money ile başla (yasal doğruluk).
5. **Medya + mail (ADR-K5)** için karar: `s-comms`/`s-mail` içindeki altyapıyı primitife terfi et — ölçek/deliverability kanıtı burada başlar.
6. **Agent-runtime güvenlik conformance'ı (ADR-K6)** yaz; AI-first iddiasının güvenlik borcu budur.

---

*Bağlı raporlar: ArcheType (`elestiri-01`) — iş-primitiflerinin sözleşme tasarımı; Surface (`elestiri-03`) — kontrol düzlemlerinin ve realtime'ın yüzeye yansıması.*
