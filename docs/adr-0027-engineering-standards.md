# ADR-0027 — Mühendislik Standardı İşletim Katmanı: Sözleşme + Referans + Uygulanabilirlik + Kapı

Statü: kabul · ADR-0026'yı (tech-profiles) **genelleştirir**. Kaynak: ChatGPT Codex gap-analizi + iç unknown-unknowns analizi (boyut ontolojisi, "sözleşme-değil-içerik", per-node applicability, CI kapısı, çapraz-repo).

Güncellik notu (2026-07-08): ADR-0027 ilk kararı miras üretim boyutu seti üzerinde kurulmuştu. Güncel üretim seti ADR-0028/day-2 genişlemesiyle 17 boyuttur (`dataLifecycle`, `observability`, `reliability` eklendi); standart referans, applicability, waiver ve aileleme ilkeleri 17 boyutun tamamına uygulanır.

## 1. Sorun (doğrulanmış)

17 üretim boyutunun büyük kısmı **çalışma-zamanı/ürün/operasyon** ekseninde; "**hangi mühendislik standardıyla üretilecek?**" ekseni (coding standards, SOLID, kısa-kod, design-system, UI/UX, data/API, state, quality-gate, observability, release, AI-governance) ayrıca sözleşmeye bağlanmak zorunda. Dört yapısal boşluk: (a) boyut **ontolojisi yoksa** güvenlik ve optimizasyon kartları dağılır; (b) standartlar **içerik** olarak düğüme yazılırsa **drift+çelişki** üretir (Faz 4'te bir düğüm "Tailwind", diğeri "SCSS" diyordu); (c) **per-node uygulanabilirlik yoksa** her boyut her düğüme doldurulup jenerik çöp üretir; (d) standart **CI kapısı değilse sahte güven**.

## 2. Karar — "kart ekle" değil, işletim katmanı kur

- **Standart = tek-kaynak sözleşme, düğüm REFERANS verir.** 12+ yeni serbest-metin boyut kartı EKLENMEZ (UI şişer + drift). Bunun yerine her standart `src/data/standards/<ad>.json` tek-kaynak sözleşmedir; düğüm `standardRefs.<ad>Ref` ile bağlanır. tech-profiles deseninin (ADR-0026) genelleştirilmesi.
- **Üç grup (ChatGPT modeli):** (1) mevcut 17 üretim boyutu = **Product/Runtime/Operations**; (2) yeni sözleşmeler = **Engineering Standards** (referans, boyut değil); (3) **Governance & Evidence** = applicability + waivers + evidence.
- **Boyut ailesi ontolojisi:** 17 üretim boyutu altı aileye atanır (`functional / runtime-quality / engineering / operations / automation / verification`) → UI gruplama + örtüşme/boşluk görünür.
- **Per-node applicability:** `applicability[dimKey] = {applies, reason}`; `applies=false` ise gerekçe zorunlu (CI kapısı zorlar). Uygulanmayan boyut "N/A" gösterilir, jenerik doldurulmaz.
- **Waiver yaşam döngüsü:** standarttan sapma `waivers[]` ile gerekçeli + onaylı + süreli kaydedilir; gerekçesiz/süresiz waiver geçersiz (CI kapısı).

## 3. Şema (ADR-0027 alanları — hepsi geriye uyumlu default'lu)

`TaskNodeSchema` (`.strict()`) eklenenler: `standardRefs` (`StandardRefsSchema`, default ""), `applicability` (record, default {}), `waivers` (array, default []). **Migration GEREKMEZ:** default'lar `safeParse`'ta dolar; mevcut generated data dosyaya dokunmadan parse olur (**lazy migration** — dosya yalnız değer atanınca yazılır). `evidence[]`/`traceability`/`acceptanceCriteria` ZATEN var; çoğaltılmaz, genişletilir.

## 4. P0 standart sözleşmeleri (ST-2)

techProfile (var) · architecture · coding-standards · short-code · design-system · ui-components · ux-interaction · data-api-contract · state-management · quality-gates · observability · release-versioning · ai-governance. Her biri: Zod şema + katalog JSON + conformance test.

## 5. CI kapıları (ST-3, hepsi BLOKLAYICI)

check-standards-coverage (her ref çözülür) · check-dimension-applicability (applies=false ⇒ gerekçe) · check-waivers (gerekçe+onay+süre) · check-short-code (PR/karmaşıklık bütçesi) · check-dependency-policy (allowlist/lisans/lockfile) · check-ui-standards · check-agent-prompt-contract. `deploy.yml`'e eklenir.

## 6. Unknown-unknowns

Standart yazılı ama uygulanmıyorsa ölü metin (→ CI kapısı zorunlu) · generated node migration tehlikesi (→ default'lu lazy migration) · applicability yoksa jenerik dolgu (→ N/A alanı) · çapraz-repo senkron (platform/actionplan/projector aynı sözleşmeyi okumalı → check çapraz tarar) · design standardı ölçülemezse anlamsız (→ token + conformance) · AI çıktısı eval'siz ölçülemez (→ ai-governance eval seti) · waiver yaşam döngüsü yoksa kalıcı bypass (→ süreli waiver).

## 7. Non-goals

Mevcut 17 üretim boyutunu silmek/yeniden adlandırmak. Standartları serbest-metin boyut kartı yapmak. ADR-0026'yı geçersiz kılmak (genelleştirir). platform/projector'a kod yazmak (actionplan plan+sözleşme katmanıdır).

## Sahip anlayışı ve teknoloji kanıtı sözleşmesi (AP-OC1)

Statü: kabul · normatif · §2'nin "standart = tek-kaynak sözleşme, düğüm REFERANS verir" kararının
raporlama ve teknoloji-kanıtı eksenine uygulanması. Bu bölüm insan-okunur kanonik metindir;
makine-zorlamalı eşi `src/data/standards/ai-governance.json` (`owner-*` ve `tech-evidence-*`
kuralları). Platform yazma sınırı değişmez: `docs/platform-product-code-write-prohibition-directive.md`
(AI erişimi `read-only-audit`, ürün kodu yazarı `human-developer-only`). Kanonik çapa:
`docs/adr-0027-engineering-standards.md#sahip-anlayışı-ve-teknoloji-kanıtı-sözleşmesi-ap-oc1`.

Bu bölüm teknik doğruluğu **gevşetmez**; üzerine ikinci bir zorunluluk ekler: aynı gerçek, sade
Türkçe ve somut bir SaaS kullanıcı yolculuğuyla da anlatılır. Sahip yazılım mühendisi değildir;
ASGI / Uvicorn / Hypercorn / FastAPI turunda anlaşma yedi ve üzeri açıklama turu aldı, ancak
invariant tek cümleye indirildiğinde kuruldu:

> Bir CRM veya HRMS kullanıcısı formu gönderdiğinde istek **yetkilendirildi mi**, **işlendi mi**
> (commit) ve her seferinde **aynı şekilde mi kaydedildi**?

Kayıp bilgi eksikliği değil çeviri eksikliğiydi: doğru teknik cümle, sahibin karar verebileceği
bir cümleye çevrilmemişti. Bu bölüm o çeviriyi zorunlu ve denetlenebilir yapar.

### Zorunlu beş alan

Her önemli mimari karar ve her faz/nihai rapor şu beş alanı sade Türkçe taşır. Alan anahtarı
makine, başlık insan tarafıdır; ikisi de atlanamaz.

| Alan anahtarı | Başlık | Ne yazılır |
|---|---|---|
| `once` | ÖNCE | Bu adımdan önce ne yapılamıyordu veya neyi garanti edemiyorduk. |
| `simdi` | ŞİMDİ | Bu adımdan sonra ne yapılabiliyor veya ne garanti ediliyor. |
| `fark` | FARK | Bir önceki aşamaya göre gerçek fark; fark yoksa "fark yok" yazılır. |
| `kullaniciYolculugu` | KULLANICI YOLCULUĞU | Somut SaaS yolculuğu: CRM, HRMS, e-ticaret, ilan, iş birliği, gerektiğinde PWA. |
| `kalanEngel` | KALAN ENGEL | Hâlâ yapılamayan ve kalan blokaj; boş bırakılamaz, "yok" ancak kanıtla yazılır. |

Teknik terim kullanılabilir, fakat aynı cümlede kullanıcı yolculuğuna bağlanmadan tek başına
bırakılamaz.

### Metafor — açıklar, yerine geçmez

Kanonik örnek **garson → mutfak → kasa** zinciridir: garson siparişi alır (protokol katmanı),
mutfak işi yapar (uygulama), kasa kaydı kapatır (kalıcılık/commit); sipariş kâğıdı değişmedikçe
garsonun kim olduğu yemeği değiştirmez. Metafor normatif değildir: yalnız açıklar; invariant'ın,
sözleşmenin veya testin yerine geçmez. Bir metafor ile bir test çeliştiğinde test kazanır ve
metafor düzeltilir veya atılır; metafor kabul ölçütü, kanıt veya kapı olarak kullanılamaz.

### `capability delta = NONE` nasıl anlatılır

Bir paket yönetişim, sözleşme, test veya doküman değiştirip çalışan üründe yeni bir yetenek
açmıyorsa `capability delta = NONE` yazılır ve hemen ardından çevirisi verilir.
**Sade Türkçesi:** "Bu paket çalışan üründe yeni bir şey açmadı; yalnız kuralı, sözleşmeyi veya
kanıtı yazılı ve denetlenebilir hâle getirdi. Kullanıcı ekranında bugün hiçbir şey değişmez."
`NONE` bir başarı ilanı değildir ve **yeni bir runtime/ürün yeteneği olarak sunulmaz**; readiness,
release veya tamamlanma iddiasına da çevrilemez.

### Karar sınırı — sahibe ne sorulur, ne sorulmaz

Değerlendiremeyeceği, geri alınabilir teknik uygulama ayrıntıları sahibe onaylatılmaz. Seçim
güvenlik kontrolü gibi görünür, değildir: kararı kanıtı olan tarafa bırakmak yerine kanıtı olmayan
tarafa taşır. Teknik otorite bunları kendi çözer ve gerekçesini kaydeder; karar kaynakları
`repo gerçekliği`, mevcut sözleşme ve testlerin davranışı, en yakın doğru örnek,
`küçük geri alınabilir deney` ve gerektiğinde `bağımsız review`. Sahibe yalnız şunlar sorulur:
**ürün/marka kapsamı** (ne satılıyor, ne vaat ediliyor), **geri alınamaz etki** (geri dönüşü
olmayan veri, yayın veya taahhüt), **dış maliyet** (ücretli servis, abonelik, dış bağımlılık) ve
**güvenlik risk iştahı**. Bu dört başlık dışında bir seçim sahibe sorulduğunda soru kapsam
dışıdır ve teknik otoriteye geri döner.

### Teknoloji seçimi — yedi kanıt boyutu

Popülerlik (yıldız sayısı, indirme, trend, anket) tek başına kanıt değildir. Bir teknoloji için
`küresel ölçekte kanıtlı` denebilmesi, aşağıdaki yedi boyutun **kaydedilmiş** olmasına bağlıdır.

| Boyut anahtarı | Ne kaydedilir |
|---|---|
| `populariteKanitDegil` | İddianın popülerlik metriğine dayanmadığı; hangi kanıta dayandığı. |
| `bagimsizUretimKullanimi` | Birbirinden bağımsız birden çok organizasyonda ciddi production kullanımı veya eşdeğer, kamuya açık küresel ölçek kanıtı. |
| `aktifBakimVeGuvenlikYaniti` | Sürüm kadansı, açık issue/PR akışı, güvenlik açığı bildirim ve yanıt süreci. |
| `performansVeOperasyonKaniti` | Ölçülmüş performans ve gerçek operasyon kanıtı: yük davranışı, sürüm yükseltme, olay/postmortem deneyimi. |
| `standartBirlikteCalisabilirlik` | Açık standart/protokol uyumu; başka bir uygulama ile değiştirilebilirlik. |
| `saglayiciBagimsizligi` | Tek satıcıya/tek yönetime kilitlenmeme; yönetişim ve lisans durumu. |
| `cikisVeRollbackStratejisi` | Vazgeçme yolu: hangi sözleşme sınırında, hangi maliyetle, hangi kanıtla geri dönülür. |

Kanıt yoksa iddia da yoktur: teknoloji `deneysel` veya `koşullu` etiketlenir;
ölçek iddiası uydurulmaz, tahmin kanıt yerine geçmez. Yeni veya niş teknoloji yasak değildir;
`sözleşme arkasında izole` edilir (arayüz sabit, bağımlılık tek noktada) ve kabulünden önce bir
`rollback deneyi` ile geri dönüşün gerçekten çalıştığı gösterilir.

### Bu bölümün sınırı

Bu bölüm bir tamamlanma, hazırlık (readiness) veya yayın iddiası değildir; yalnız raporlama ve
teknoloji kanıtı yükümlülüğünü kayıt altına alır. Kapsam, rollback, Git ve teslim kararı yetkili
MASTER'ındır; ürün, marka, geri alınamaz etki, dış maliyet ve güvenlik kararları sahibindir.
