# 15 — MetaFramer Delivery Sınırı Standardı

Sürüm: 1.0 — 2026-08-12
Durum: Anlatı standardı, **reference-only**. Kararın ikinci sahibi değildir; kararı insan-okur hâle getirir.
Aile: `engineering` · Düğüm `standardRef` anahtarı: **yok** (bu standarda düğüm bağlanmaz) · capability delta: **NONE**

Bağlayıcı değerlerin tek kanonik sahibi karar kaydı `reports/kernel-asgi-core-profile-decision-2026-08-11.json` ve onun doğrulayıcısı `tools/lib/kernel-asgi-core-profile.mjs`'dir. Bu doküman o değerleri ikinci kez yazmaz; ne anlama geldiklerini anlatır.

---

## 0. Kanonik zincir — bu doküman neye bağlıdır

Bu anlatı hiçbir değeri sahiplenmez. Bir sayı, rol, sürüm veya sınır merak edildiğinde okunacak yer aşağıdaki zincirdir; çelişki hâlinde kaynak kazanır ve bu doküman düzeltilir.

| Katman | Dosya | Rolü |
|---|---|---|
| Karar kaydı (kanonik) | `reports/kernel-asgi-core-profile-decision-2026-08-11.json` | Bağlayıcı değerlerin tek sahibi |
| Doğrulayıcı (fail-closed) | `tools/lib/kernel-asgi-core-profile.mjs` | Kararın pinlerini denetler; `accepted=true` ve boş hata listesi vermeden karar tüketilemez |
| Karar testi | `tests/kernelAsgiCoreProfileDecision.test.ts` | Doğrulayıcının her pini için sapma (drift) süpürmesi |
| Katalog girişi (reference-only) | `src/data/standards/kernel-delivery-boundary.json` | Standart kataloğundaki işaretçi giriş; değer kopyası taşımaz |
| Katalog testi | `tests/kernelDeliveryBoundaryStandard.test.ts` | Katalog girişinin kopya/overclaim taraması |
| Sahip anlayışı sözleşmesi | `docs/adr-0027-engineering-standards.md#sahip-anlayışı-ve-teknoloji-kanıtı-sözleşmesi-ap-oc1` | Beş alan, metafor sınırı, yedi kanıt boyutu |
| Yönetişim sözleşmesi | `src/data/standards/ai-governance.json` | `owner-*` ve `tech-evidence-*` makine kuralları |
| Bu anlatı | `docs/standards/15-kernel-delivery-boundary-standard.md` | Kararın sade anlamı; yeni kural üretmez |

Okuma kuralı `00-standards-index.md` §1 ile aynıdır: **standardı yeniden yazma, referans ver.** Bir değer burada tekrar edilirse iki kopya doğar, biri düzeltilirken diğeri eski kalır ve hangisinin bağlayıcı olduğu belirsizleşir.

---

## 1. Karar tek cümlede

MetaFramer taşıma katmanının ne olduğunu kendisi tanımlar: **MetaFramer** kendi zorunlu ASGI 3 Core Profile'ını ve kendi public developer/Delivery sözleşmesini sahiplenir. Sunucu ve web çerçevesi bu sözleşmenin altına takılan değiştirilebilir parçalardır; iş kuralı, yetki ve kayıt kararı hiçbir zaman onlarda değildir.

Bu cümlenin pratik karşılığı şudur: aynı CRM veya HRMS form eylemi hangi sunucuyla servis edilirse edilsin aynı iş sonucunu üretmek zorundadır. **Sunucu değişince iş sonucu değişmez.** Değişiyorsa belge değil mimari ya da uyumluluk uygulaması hatalıdır.

---

## 2. Roller — kim neyi sahiplenir

| Bileşen | Rolü | Sahiplendiği | Sahiplenmediği |
|---|---|---|---|
| MetaFramer | Core Profile ve sözleşme sahibi | Public developer/Delivery sözleşmesi, Application/Domain kararları | — |
| Uvicorn | **varsayılan referans** sunucu | Sadece taşıma: bağlantı, protokol, süreç yönetimi | Yetki, tenant, iş kararı, transaction, DB, outbox, audit |
| Hypercorn | **desteklenen bağımsız uyumluluk alternatifi** | Sadece taşıma; ikinci bağımsız uygulama olarak değiştirilebilirliği test edilebilir kılar | Varsayılan olmak, ikinci bir anlamsal runtime olmak |
| FastAPI | **isteğe bağlı Delivery adaptör konağı** | Sadece taşıma/çeviri; MetaFramer'ı barındırabilir veya izole biçimde MetaFramer tarafından mount edilebilir | Public API, Domain veya Application anlamı |

İki sınır özellikle karıştırılır, bu yüzden açıkça yazılır:

- FastAPI **zorunlu kernel bağımlılığı değildir**; kaldırıldığında public developer API, Domain ve Application olduğu gibi kalır çünkü hiçbiri onu import etmez.
- Uvicorn ve Hypercorn birbirinin yerine geçebilir; ikisi de bir isim üzerinden anlam dallandıramaz. `kalıcı çift runtime, çift yazma ve sunucu adına göre dallanma yoktur`.

Yetki (auth), tenant izolasyonu, iş kararı, transaction, veritabanı yazımı, outbox ve audit MetaFramer Application/Domain katmanındadır. Taşıma katmanı bunları ne yapar ne de etkiler; yalnız isteği içeri, cevabı dışarı taşır.

---

## 3. Tek iş yolu — Action Pipeline

İşe ulaşan her rota tek bir MetaFramer Action Pipeline'ını çağırır. FastAPI adaptörü de dâhil hiçbir bileşen alternatif bir iş yolu açamaz: adaptör isteği çevirir ve aynı hattı çağırır. Böylece "FastAPI ile gelen kayıt farklı doğrulanıyor" sınıfı bir sapma mimari olarak imkânsız kılınır, belge ile yasaklanmakla kalmaz.

---

## 4. Bir capability yoksa ne olur

Taşıma katmanının bir yeteneği ortamda bulunmayabilir. İki durum ayrılır ve ikisi de kullanıcı için öngörülebilirdir:

- **İsteğe bağlı capability yoksa:** `deterministik standart fallback` çalışır ve dokuz iş sonucu boyutunun tamamı aynı kalır. Kullanıcı farkı görmez; sonuç değişmez.
- **Zorunlu taşıma capability'si yoksa:** rastgele kullanıcı isteği reddedilmez. İlgili endpoint, service veya module başlangıçta `en dar kapsamda fail-closed` kapanır ve eksik yeteneği adıyla söyleyen bir `açık yapılandırma hatası` verilir. Kapanan yüzey bellidir; geri kalan formlar çalışmaya devam eder.

Ayrım önemlidir: sessizce farklı davranan bir sistem, açıkça kapanan bir sistemden daha tehlikelidir. Kapalı yüzey operatöre görünür; sessiz sapma kullanıcıya yanlış sonuç verir.

---

## 5. Dört kombinasyon — daha sonra aynı boyutlarla test edilecek

Aşağıdaki dört zorunlu kombinasyon aynı iş sonucu boyutlarıyla ayrı bir pakette test edilecektir. Bu doküman testi üretmez; yalnız neyin eşit olması gerektiğini adlandırır.

| # | Kombinasyon | Beklenen |
|---|---|---|
| 1 | MetaFramer ASGI + Uvicorn | Aynı iş sonucu |
| 2 | MetaFramer ASGI + Hypercorn | Aynı iş sonucu |
| 3 | FastAPI-hosted MetaFramer + Uvicorn | Aynı iş sonucu |
| 4 | FastAPI-hosted MetaFramer + Hypercorn | Aynı iş sonucu |

Bir kombinasyonun taşımayı kabul edip diğerinin iş işlemini reddetmesi "belgelenmiş bir fark" değil mimari kusurdur. Boyut listesinin kanonik hâli karar kaydındadır; buraya kopyalanmaz.

Node yüzeyleri bu süreçte `dondurulmuş uyumluluk referansı` olarak kalır: parity ve cutover ayrı bir pakette ayrıca kanıtlanana kadar ne çıkarma ne geçiş yapılır. Kernel'in kanonik dili bu kararla seçilmemiştir; `kanonik kernel dili kararı açıktır`.

`MCP için bugün tüketici yoktur`: bu karar hiçbir MCP config, server veya tool üretmemiştir ve kelimenin geçmesi bir tane uydurmak için gerekçe değildir. Gelecekte bir MCP yüzeyi eklenirse o da Delivery sınırında bir taşıma tüketicisidir; aynı Action Pipeline'ı çağırır ve aynı uyumluluk matrisine bağlıdır.

---

## 6. Bu paket ne üretmedi — `capability delta = NONE`

Bu karar paketi runtime, SDK, çalışan endpoint veya çalışan form üretmedi; **runtime hazır değildir** ve bu doküman onu açmaz. ADR-0027 AP-OC1 uyarınca sade Türkçesi şudur:

> Bu paket çalışan üründe yeni bir şey açmadı; yalnız kuralı, sözleşmeyi ve kanıtı yazılı ve denetlenebilir hâle getirdi. **Kullanıcı ekranında bugün hiçbir şey değişmez.**

`NONE` bir başarı ilanı değildir ve yeni bir ürün yeteneği, readiness, release veya tamamlanma iddiasına çevrilemez.

Dürüst olumsuz cümle açıkça yazılır: bu paket **production-ready değildir**, SDK hazır değildir ve çalışan endpoint yoktur. Bunlar eksiklik itirafıdır, gizlenecek bir kusur değil; iddia edilmediği sürece kimse yanlış bir readiness beklentisi kurmaz.

---

## 7. Teknoloji kanıtı — yedi boyut, dürüst etiket

Teknoloji seçimi ADR-0027 AP-OC1'in yedi kanıt boyutuyla kaydedilir. **Popülerlik tek başına kanıt değildir**; yıldız, indirme ve trend bir iddiayı taşımaz.

Bugünkü dürüst tablo şudur ve kaynağı karar kaydının `technologyEvidence` bölümüdür. Yedi boyutun **tamamı** görünür satır olarak durur; kanıtsız bırakılan boyutlar tablodan çıkarılarak değil, adıyla yazılarak taşınır.

| Boyut | Bu kararda ne yazılı |
|---|---|
| Popülerlik kanıt değil | Dördünde de iddia yayımlanmış belgeye ve kamuya açık kayda dayandırılır; yıldız, indirme veya anket trendi kanıt olarak kullanılmaz |
| Bağımsız üretim kullanımı | **Yalnız FastAPI** için resmî sitede adı geçen bağımsız organizasyon beyanları kayıtlıdır ve bu kanıt yalnız çerçeveye aittir, hiçbir sunucuya devredilmez. **ASGI, Uvicorn ve Hypercorn** için bu boyut kanıtsız bırakılmıştır; kabul edilmiş ve gizlenmeyen bir eksiktir |
| Aktif bakım ve güvenlik yanıtı | **ASGI'de kanıtın türü farklıdır:** açıkta sürümlenen ve bakımı yapılan bir **spesifikasyondur**, alt-spesifikasyonu kendi sürüm numarasını taşır. **Uvicorn, Hypercorn ve FastAPI** ise ayrı ayrı kendi kamuya açık, tarihli sürüm akışı ve açık issue/PR süreci ile kaydedilmiştir |
| Performans ve operasyon | Dördünün hiçbiri için bağımsız ölçülmüş yük rakamı **iddia edilmemiştir**; bu boyut dördünde de kanıtsız bırakılmıştır |
| Standart birlikte çalışabilirlik | En güçlü boyut: açık arayüz sözleşmesi sayesinde uyumlu her sunucu bir diğerinin yerine geçer |
| Sağlayıcı bağımsızlığı | Arayüz tek bir satıcıya ait değildir; uygulamalar açık kaynak ve topluluk bakımındadır |
| Çıkış ve rollback | Çıkış sözleşme sınırının kendisidir: Application ve Domain hiçbir sunucu veya çerçeve tipini import etmez |

İki kabul edilmiş boşluk bu yüzden tabloda açıkça durur: `bağımsız üretim kullanımı` dört teknolojinin üçünde, `performans ve operasyon` dördünde de kanıtsızdır.

Bu yüzden dört teknolojinin de kanıt etiketi `koşullu`dur, "küresel ölçekte kanıtlı" değildir; eksik boyutlar karar kaydında adlarıyla açıkça sayılır ve runtime kabulünden önce bir rollback deneyi şarttır.

---

## 8. Sahibe sade Türkçe açıklama — beş alan

ADR-0027 AP-OC1 beş alanı zorunlu kılar; teknik doğruluk yerine geçmez, üzerine eklenir.

- **ÖNCE — `once`:** Yazılı ve denetlenebilir tek bir sözleşme yoktu: MetaFramer'ın taşıma katmanında neyi sahiplendiği, FastAPI'nin zorunlu mu isteğe bağlı mı olduğu ve aynı formun farklı sunucularda aynı sonucu verip vermeyeceği garanti altında değildi; karar konuşmada ve dağınık metinlerde duruyordu.
- **ŞİMDİ — `simdi`:** Karar makineyle denetlenen tek bir kayıtta duruyor ve bu doküman onu teknik olmayan bir okuyucu için çeviriyor; kim neyi sahiplenir, hangi sunucu varsayılan, hangi çerçeve isteğe bağlı ve bir yetenek eksikse ne olur soruları tek yerden ve aynı cevapla okunuyor.
- **FARK — `fark`:** Bir önceki aşamaya göre gerçek fark yalnız okunabilirliktir: aynı karar artık sahibin doğrulayabileceği sade Türkçeyle ve iki indeksten bulunabilir biçimde yazılıdır; çalışan üründe yeni bir yetenek açılmadı, kod yazılmadı, endpoint eklenmedi.
- **KULLANICI YOLCULUĞU — `kullaniciYolculugu`:** İK yetkilisi "Yeni Personel" formunu doldurur ve Kaydet'e basar; isteği Uvicorn veya Hypercorn taşır, varsa FastAPI yalnız çevirir, sonucu aynı MetaFramer Action Pipeline üretir: auth, tenant, validation, iş kararı, transaction, DB yazımı, outbox ve audit. Bu yolculuk bugün çalışmıyor; kaydedilen şey gelecekte geçerli olacak eşitlik sözleşmesidir. Aynı beklenti CRM tarafındaki "Yeni Müşteri" formu için de birebir geçerlidir.
- **KALAN ENGEL — `kalanEngel`:** Delivery halkası hâlâ kapalıdır; runtime implementasyonu başlamamıştır, iç halka import yasağı bugün derleme ile zorlanamıyor, dört kombinasyonlu uyumluluk süiti ayrı bir paket olarak bekliyor ve kanonik kernel dili kararı verilmemiş durumda duruyor.

---

## 9. Metafor — açıklar, yerine geçmez

Garson benzetmesi yalnız kapıyı anlatır: Uvicorn, Hypercorn ve FastAPI siparişi masadan mutfağa taşıyan servis kapısıdır. Siparişin kabul edilip edilmeyeceği, stoktan düşülüp düşülmeyeceği ve hesabın kapatılması mutfağın ve kasanın işidir — yani MetaFramer Application/Domain katmanının. Garson değişince yemek değişmez; değişiyorsa mutfakta bir sorun vardır.

ADR-0027 AP-OC1 uyarınca metafor normatif değildir: bir metafor ile bir test çeliştiğinde test kazanır, metafor düzeltilir veya atılır. Metafor kabul ölçütü, kanıt veya kapı olarak kullanılamaz.

---

## 10. Kapılar

Bu doküman yeni bir CI kapısı kurmaz; mevcut kapılara bağlanır.

| Ne denetlenir | Kapı |
|---|---|
| Karar kaydının pinleri ve sapma süpürmesi | `tests/kernelAsgiCoreProfileDecision.test.ts` |
| Katalog girişinin kopya/overclaim taraması | `tests/kernelDeliveryBoundaryStandard.test.ts` |
| Bu anlatının ve iki indeksin bütünlüğü | `tests/kernelDeliveryBoundaryDocumentation.test.ts` |
| Sahip anlayışı beş alanı ve teknoloji kanıtı | `tests/ownerComprehensionContract.test.ts` + `src/data/standards/ai-governance.json` |
