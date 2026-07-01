# Üç Katman Eleştiri Raporu — İndeks ve Girdi Denetimi

**Tarih:** 2026-07-01 · **Kapsam:** `actionplan/` meta-model (`src/schemas/*.ts`, 445 düğüm), yüklenen `kernel-gap-analizi-2026-07-01.md`, ChatGPT'nin commerce-stack cevabı · **Mercekler:** UX, AI-First, yüksek-trafikli mimari.

Bu paket üç ayrı rapordan oluşur:

- **`elestiri-01-archetype-2026-07-01.md`** — ArcheType (veri/domain sözleşmesi) katmanı.
- **`elestiri-02-kernel-2026-07-01.md`** — Kernel (Layer 0 çekirdek hizmetler) katmanı.
- **`elestiri-03-surface-2026-07-01.md`** — Surface (yüzey/UI/API projeksiyonu) katmanı.

Her rapor aynı iskeleti izler: bu katman nedir/ne yapar/ne yapmaz → adil güçlü-yön değerlendirmesi → zayıflık nedenleri → gap analizi → önerilen sözleşme/şema tasarımı → unknown-unknowns → kilitlenecek ADR taslakları → öncelikli aksiyonlar. Kod yazılmadı; her çözüm **mimari tarif** düzeyindedir.

Bu indeks dosyası iki iş yapar: (1) üç raporun ortak tezini tek yerde verir, (2) elinizdeki iki girdi belgesini — gap analizi ve ChatGPT cevabı — eleştirel süzgeçten geçirir. Siz "her şeye eleştirel yaklaş" dediğiniz için, kendi raporlarımın dayandığı girdileri de denetliyorum.

---

## 1. Tek cümlelik ortak teşhis

> Meta-model **kayıt + projeksiyon + otomasyon** üçlüsünü (ArcheType / Surface / Workflow + ECA) sınıfının en iyileri düzeyinde modelliyor; ama **aktör + yetenek (capability) + iş-modeli modu + hesaplama (computation) + tüketici yüzeyi** eksenlerinde eksik. Yani hissettiğiniz zayıflık gerçek, fakat adı "kernel çöp" değil: model **CRUD-tam ama davranış/aktör/mod-eksik**.

Bunu somutlaştıran üç cümle, üç rapora karşılık gelir:

- **ArcheType** bir *kayıt tipini* (Frappe DocType'ın gelişmişi) mükemmel tarif eder; ama bir *aktörün bağlama göre değişen rolünü*, bir *yeteneğin açılıp kapanmasını* ve bir *fiyat/vergi/BOM hesabını* tarif edecek sözleşme parçasına sahip değildir.
- **Kernel** kimlik/yetki/tenant/bus/şema primitiflerini içerir; ama *aktör (party)*, *yetenek/lisans (entitlement)* ve *hesaplama servisleri (sequence/para/ölçü-birimi)* ya Layer-1'e itilmiş ya da hiç yok; ölçek primitifleri ise "opt-in bayrak" — enterprise'da bazıları zorunlu-invariant olmalı.
- **Surface** iç yönetim (admin/CRUD) yüzeyini olağanüstü modeller; ama *tüketici ve yüksek-trafik yüzeylerini* (feed, video, harita, sohbet, sayfa-kurucu, ızgara) ve *AI-first/gerçek-zaman* yüzeylerini katalogunda barındırmaz.

---

## 2. Girdi denetimi — bu iki belgeye neden körü körüne güvenmemeliyiz

### 2.1 Yüklenen gap analizi: doğru teşhisler + birkaç maddi hata

Terminoloji: **gap analizi** = "ne eksik" raporu. Elinizdeki `kernel-gap-analizi-2026-07-01.md` iyi bir belge ama üç yerde **abartıyor veya yanılıyor**; bunları düzeltmek, sizin gerçek önceliklerinizi netleştiriyor.

Aşağıdaki tablo öncesinde sade özet: gap analizinin "yok" dediği bazı primitifler kod tabanında **var**; sadece beklediği yerde değil. Bu fark önemli, çünkü "yok" ile "yanlış katmanda" tamamen farklı iş kalemleridir — birincisi sıfırdan yapım, ikincisi taşıma/terfi.

| Gap analizinin iddiası | Gerçek durum (düğüm kanıtı) | Doğru okuma |
|---|---|---|
| PostGIS / geospatial yok | `scale-gis` var: PostGIS, mesafe, geofence, `ST_AsMVT` vektör-tile, H3 | Primitif **var**; eksik olan onu *tüketen ürün* (Fleetx domaini), primitif değil |
| Gerçek-zaman konum/realtime yok | `scale-realtime` (WS+SSE), `scale-counter` (sharded, HLL) var | Realtime omurga **var**; eksik olan telematik/OBD-II *domain adaptörü* |
| Actor/Party modeli yok | `l1-party` var: "Customer/Supplier/Employee yazma — Party yaz" | Party **var** ama **Layer-1'de ve contact-merkezli**; kernel-seviyesi aktör-polimorfizmi değil |
| Workflow "sadece basit state machine" | `l1-workflow`: onay zinciri, SLA, eskalasyon, görsel tasarımcı, insan+ECA karışık | Workflow **trivial değil**; BPMN'e göre eksik olan alt-süreç/paralel-gateway |
| "Kernel kimlik krizi: 3 canlı tanım" | `platform-db-schema`/`platform-authn-authz` **Python/FastAPI/SQLAlchemy 2.0/Alembic**'te uzlaşmış | Kriz **abartılı**: TS/Prisma bir *bayat doküman*, CI/CD repo *ayrı bir şey*; gerçek iş = ADR kilidi + bayat dokümanı silmek |
| "5 ürün tamamen eksik: PIM, IBYS, Email, Teams, Fleetx" | Hepsi modül olarak **var**: `s-pim` (Akeneo muadili) + `product` ArcheType, `s-isg` (İSG-KATİP bildirimleri), `s-mail` (Mailcow+PowerDNS), `s-comms` (Jitsi), `s-fleet` (Samsara muadili) + `s-tms` (kargo) | Gap analizinin **en büyük hatası**: portföy kapsama yanlış-negatifi; 445 düğüm 16+ ürünü zaten sayıyor |

Sonuç: gap analizinin **en ağır yanılgısı** "5 ürün tamamen eksik" bölümüdür — beşi de (`s-pim`, `s-isg`, `s-mail`, `s-comms`, `s-fleet`) tasarımda var. Bu hata bir deseni ele veriyor: gap analizi **"kod olarak henüz yazılmadı" ile "tasarlanmadı"yı sürekli karıştırıyor**. Gerçek boşluk *ürün kapsamı* değil; meta-model primitifleri (aktör/yetenek/mod/hesap) ve *primitife terfi* (medya/mail). Gap analizini yalnız "operasyon/yönetişim" bölümleri (DR, SLO, FinOps, lisans, sandbox enforcement) için okuyun — orada haklı; primitif/ürün "yok" iddialarının çoğu yanlış-negatiftir.

### 2.2 ChatGPT'nin commerce cevabı: doğru sinyal, yanlış reçete

ChatGPT'nin cevabı iki katmanı karıştırıyor: **doğru mimari sinyal** ile **sizin felsefenize aykırı stack reçetesi**.

Doğru ve değerli sinyal — üç raporun da omurgası budur: **iş modeli (B2C/B2B/C2C/D2C/B4B) kod değil konfigürasyon olmalı**; bunun için *Actor Model*, *Capability Engine*, *Policy Engine*, *Mode Profile* birinci-sınıf olmalı. Bu teşhis doğru ve sizin ArcheType/Surface/Workflow modelinizde bu dört kavramın **sözleşme karşılığı yok** (detay: ArcheType raporu §3, Kernel raporu §3).

Ama aynı cevap dört yerde yanıltıcı:

Birincisi, **stack şişkinliği**. ChatGPT OpenSearch + NATS/Kafka + Temporal + GraphQL facade öneriyor. Bu, sizin kendi `scale-streaming` düğümünüzle çelişir: orada açıkça *"Modüler monolith için Kafka NADİREN gerekli"* yazıyor. Sizin tercihiniz determinizm-öncelikli (Vite/React/TanStack, FastAPI, PostgreSQL, SQLAlchemy) — ChatGPT'nin dört ağır altyapı bileşenini day-1 önermesi bu felsefeye aykırı. **Güvenli yaklaşım:** bu bileşenleri "ölçek kanıtı gelince aç" bayrağı arkasında tutmak (zaten `scale-*` mimariniz böyle). **Riskli yaklaşım:** ChatGPT'nin listesini day-1 kurmak — operasyon yükü ekibi boğar.

İkincisi, **sadece commerce**. Cevap 16 üründen yalnız birini (e-ticaret) çözer. "Actor/Capability/Policy" fikri doğru ama ChatGPT bunları commerce'e özel sunuyor; sizin ihtiyacınız bu dördünü **kernel-seviyesi, tüm app'lerce paylaşılan** primitif yapmak. Aksi halde her app kendi aktör/yetki modelini yeniden yazar.

Üçüncüsü, **mevcut olanı yeniden icat**. ChatGPT'nin "Policy Engine — koddaki if/else yerine JSON kural" önerisi, sizde zaten **ECA + ruleset katmanı** (`src/schemas/ruleset.ts`, system/platform/tenant katmanları) olarak var. ChatGPT bunu bilmeden yeniden tarif ediyor. Gerçek boşluk "policy engine yok" değil; "policy engine *tek bir kayıt tipine gömülü* (ArcheType.accessPolicy), *çapraz-kesen bağımsız bir karar noktası* (PDP) değil."

Dördüncüsü, **shared-hosting hayali**. ChatGPT "WordPress gibi paylaşımlı hostinge kurulsun" fikrini gündeme getirip sonra kendisi geri çekiyor. Sizin hedef ortamınız Hetzner/Debian/Docker; bu doğru olan. Shared-hosting'i ciddiye almayın — FastAPI + PostgreSQL + worker + realtime bu ortamda çalışmaz.

Özet: ChatGPT'den **fikri** alın (Actor/Capability/Mode/Policy birinci-sınıf), **reçeteyi** (stack sprawl, commerce-özel, shared-hosting) reddedin.

---

## 3. Üç emsal mercek — nerede işleniyor

Belirttiğiniz üç öncelik, üç rapora şöyle dağılıyor (her mercek her raporda ayrı bir alt-başlık olarak var; ağırlık merkezi aşağıdaki gibi):

Sade özet: **UX** ağırlıklı Surface raporunda, **yüksek-trafik** ağırlıklı Kernel raporunda, **AI-First** ise üçüne de yayılıyor çünkü AI-first bir "modül" değil, üç katmanı birden kesen bir davranış sözleşmesidir (ArcheType'ta `aiPolicy`, Kernel'de `agent-runtime`, Surface'te "generatif/konuşma yüzeyi").

| Mercek | ArcheType raporu | Kernel raporu | Surface raporu |
|---|---|---|---|
| UX | Orta (typed-action → afordans) | Düşük | **Ağır** (asıl yer) |
| AI-First | **Ağır** (aiPolicy, üretim döngüsü) | **Ağır** (agent-runtime güvenliği) | **Ağır** (generatif/konuşma yüzeyi) |
| Yüksek-trafik | Orta (depolama/EAV/PIM) | **Ağır** (scale-invariant, tutarlılık SLA) | Orta (render/cache sözleşmesi) |

---

## 4. Üç rapor tek bakışta — en kritik on bulgu

Aşağıdakiler üç raporun en yüksek-öncelikli (P0/P1) bulgularının birleştirilmiş listesidir; her biri ilgili raporda gerekçe + çözüm + ADR taslağıyla açılır.

1. **Aktör (Party) kernel-primitifi değil.** `l1-party` var ama Layer-1 ve contact-merkezli; "aynı kişi/kurum bağlama göre buyer+seller+employee" polimorfizmi sözleşmede yok. (Kernel §3, ArcheType §4)
2. **Capability/Entitlement sözleşmesi yok.** "user ∩ capability ∩ plan" cümlesi `k-boyut3`'te geçiyor ama `capability.ts` diye versiyonlanan bir kontrat yok; lisans/feature-gate burada. (Kernel §3, ArcheType §4)
3. **Mode-Profile (iş modeli anahtarı) yok.** Editions *paketleme* varyantı; ChatGPT'nin tarif ettiği "tek tıkla B2C→B2B, validation+rollback ile" *runtime mod recomposition* değil. (ArcheType §4)
4. **Hesaplama sözleşmesi yok.** ArcheType'ta `validationRule`/`semanticRule` var ama fiyat/vergi/BOM-patlaması/bordro *hesap hattı* (derivation graph) modellenemez. (ArcheType §4)
5. **Policy tek kayıt tipine gömülü.** Merkezî bir Policy Decision Point (PDP) + policy-as-data dili + karar-logu + izin-simülasyonu yok. (Kernel §3)
6. **Scale primitifleri opt-in.** Outbox/idempotency/tenant-rate-limit "bayrakla açılır"; enterprise'da bunlar zorunlu-invariant olmalı (unutulursa çift-tahsilat). (Kernel §4)
7. **Medya (WebRTC/SFU) ve mail transport primitife terfi edilmemiş.** Teams (`s-comms`, Jitsi) ve Email (`s-mail`, Mailcow) *modül olarak var*; ama bu iki altyapı `scale-gis` gibi yeniden-kullanılabilir primitif değil — modüle gömülü, ölçek/deliverability kanıtı eksik. (Kernel §3.4)
8. **Surface kataloğu admin-merkezli.** 8 tip (list/detail/form/...) iç panelleri harika, tüketici yüzeyini (feed/video/harita/sohbet/page-builder/grid) modellemez. (Surface §3)
9. **SDUI tavanı + kaçış kapısı yok.** Şema-render "Facebook kapsamlı, YouTube stream" cilasını üretemez; sözleşmeye-bağlı ama elle-yazılan "custom surface" yolu yok. (Surface §4)
10. **WCAG 2.2 AAA varsayılanı aşırı-iddia.** AAA (7:1 kontrast, metin-görsel yasağı, video işaret-dili) tüketici/marka yüzeyinde çoğunlukla ulaşılamaz; kendi conformance gate'inizde kalırsınız. Doğrusu: AA zorunlu, AAA yüzey-bazında hedef. (Surface §5)

---

## 5. Nasıl okunur / sıradaki adım

Üç raporu şu sırayla okuyun: önce **ArcheType** (çünkü aktör/capability/mode/hesaplama boşluğu kökten oradan başlar), sonra **Kernel** (bu primitiflerin hangi katmana ait olduğu), en son **Surface** (kullanıcının gördüğü yüzeyin UX/AI-first/perf sözleşmesi).

Sonraki adım olarak (siz seçin, ben üreteyim): (a) buradaki ADR taslaklarını (Actor, Capability, Mode-Profile, Computation, PDP, Scale-invariant) tam ADR dosyalarına açmak; (b) tek bir dikey dilim için (ör. Commerce'te "B2C→B2B mod anahtarı") uçtan-uca sözleşme tasarımı; (c) Surface kataloğunu tüketici-yüzeyleriyle genişleten yeni `surface.ts` tasarımı. Her üçü de kod değil, sözleşme/ADR düzeyinde kalır.
