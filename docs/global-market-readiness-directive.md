# Global Pazar Hazırlığı Yönergesi (ödeme, moderasyon, coğrafya, dağıtım, destek)

**Durum:** AI-DRAFT — CPO onayı bekler.
**Makine kontratı:** `src/data/standards/global-market-readiness.json` (kapı: `check-market-readiness`) — kural değerleri orada yaşar; bu doküman gerekçe ve kapsamı anlatır.
**Statü:** ürün-katmanı sözleşmesi (Metaframer/EVM ürün katmanı); kernel primitifi değildir. **Kapsama kanıtı:** `tests/globalReadiness.test.ts` (test-önce; kırmızı→yeşil).
**Neden var:** `standards/01-i18n-l10n-g11n-standard.md` temsil ve biçimlendirmeyi (dil, locale, format, çeviri operasyonu) çözer; fakat "çeviri bitti" hiçbir pazarda "pazar açıldı" demek değildir. Ödeme kabulü, içerik moderasyonu, coğrafya politikası, keşfedilebilirlik ve destek taahhüdü i18n standardının kapsamı dışındadır ve başka bir yönergeye de pragmatik sığmaz. Bu yönerge bu beş pazar-operasyonel alanın tek sözleşmesidir; kapsamadığı komşu alanların sahipleri §10 devir haritasındadır.

---

## 1. Amaç

Bir hedef pazarda ürünün **gerçekten çalışır** sayılması için gereken beş pazar-operasyonel alanı — (1) ödeme yöntemleri ve ödeme regülasyonu, (2) UGC/içerik moderasyonu ve güven politikaları, (3) coğrafya ve politik hassasiyetler, (4) dağıtım/keşfedilebilirlik/SEO, (5) müşteri desteği/satış/operasyon — tek bağlayıcı sözleşmede toplamak. Ana kural: **pazar hazırlığı bir çeviri görevi değil, pazar başına verilecek operasyonel kararlar kümesidir.** Her alan bölümündeki liste hedef pazar başına eksiksiz değerlendirilir; "değerlendirilmedi" ile "uygulanamaz (N/A, gerekçeli)" ayrı kayıtlardır.

## 2. Kapsam

| Alan | Bölüm | Neyi bağlar |
|---|---|---|
| Ödeme yöntemleri ve ödeme regülasyonu | §5 | Pazar başına ödeme yöntemi seti, checkout mimarisi, başarısız-akış test zorunluluğu |
| UGC, içerik moderasyonu ve güven | §6 | Dil/pazar başına moderasyon politikası, AI özelliklerinin locale-bazlı değerlendirmesi |
| Coğrafya ve politik hassasiyetler | §7 | Ülke/bölge/harita/bayrak politikası, IP geolocation sınırları, coğrafi veri katmanı |
| Dağıtım, keşfedilebilirlik ve SEO | §8 | hreflang/canonical, app store varlığı, pazara özgü landing page, bot erişimi |
| Müşteri desteği, satış ve operasyon | §9 | Dil-bazlı hizmet taahhüdü, status page, escalation, yerel tatil/SLA kararları |

Bu yönerge **Metaframer/EVM ürün katmanı** içindir; hedef pazara açılan her ürün yüzeyi için geçerlidir.

## 3. Non-goals

Aşağıdakiler kasıtlı kapsam dışıdır; her birinin sahibi §10 devir haritasında tektir.

| Yapmaz | Sahibi |
|---|---|
| Dil/locale veri modeli, çeviri operasyonu, font/rendering tanımlamaz | `standards/01-i18n-l10n-g11n-standard.md` |
| URL grameri tanımlamaz (kanonik URL kuralları tek dosyada) | `url-policy.md` |
| Vergi/fatura/para modeli kurmaz | `financial-state-model-contract.md` |
| Hukuk/gizlilik/veri bölgesi kararı vermez | `privacy-retention-decision-matrix.md` |
| Kimlik/auth/hesap kurtarma tasarlamaz | `standards/03-authn-authz-iam-standard.md` |
| Fiyat/paket stratejisi belirlemez | `standards/10-business-model-switching-standard.md` |

## 4. Tanım — nedir / ne yapar / ne yapmaz

**Nedir:** i18n standardının kapsamadığı, pazar başına karar isteyen beş operasyonel alanın (ödeme, moderasyon, coğrafya, dağıtım, destek) bağlayıcı tek sözleşmesi.
**Ne yapar:** Her alan için pazar başına değerlendirilecek tam listeyi verir; normatif kuralları (başarısız-akış test zorunluluğu, IP sınırı, bağımsız sürümleme, dil taahhüdü hizalaması) koyar; kapsam dışı komşu alanları devir haritasıyla tek sahibe bağlar.
**Ne yapmaz:** Biçimlendirme/çeviri kuralı koymaz; URL grameri, vergi modeli, hukuk kararı, kimlik akışı veya arama collation tanımlamaz; hedef pazar seçimi (hangi pazara girileceği) yapmaz — o strateji kararıdır ve bu yönergenin girdisidir.

## 5. Ödeme yöntemleri ve ödeme regülasyonu

**"Kredi kartı kabul ediyoruz" ≠ global ödeme desteği.** Birçok pazarda baskın ödeme aracı kart değildir; kartın yaygın olduğu pazarlarda da yerel ağ, doğrulama ve regülasyon farkları ödeme başarı oranını belirler.

**5.1 Her hedef pazar için değerlendirilecekler (tamamı; atlanamaz):**

1. yerel kart ağları;
2. banka transferleri;
3. direct debit sistemleri;
4. dijital cüzdanlar;
5. gerçek zamanlı ödeme ağları;
6. taksit ve sonra-öde modelleri;
7. yerel acquiring ve ödeme başarı oranı;
8. 3-D Secure ve güçlü müşteri doğrulaması;
9. recurring payment mandate gereksinimleri;
10. abonelik yenileme bildirimleri;
11. dunning ve ödeme tekrar deneme stratejisi;
12. chargeback ve itiraz süreçleri;
13. iade süreleri ve kısmi iade kuralları;
14. settlement para birimi ve banka maliyetleri;
15. ödeme sağlayıcısının ülke/sektör/ürün kısıtları.

**5.2 Doğrulama mimarisi.** EMV 3-D Secure, kartsız (card-not-present) işlemde kimlik doğrulama ve dolandırıcılık azaltma amaçlıdır; Avrupa'da güçlü müşteri doğrulaması ayrıca düzenleyici gerekliliktir. Bunlar biçimlendirme değil **checkout mimarisi** konusudur: akışa ek doğrulama adımı, yönlendirme ve istisna yönetimi ekler; checkout tasarımı bu adımları baştan içermelidir (kaynak: https://www.emvco.com/emv-technologies/3-d-secure/).

**5.3 NORMATİF:** Ödeme akışlarının yalnız başarılı senaryosu değil; **doğrulama, reddedilme, bekleyen işlem, gecikmiş bildirim, çift bildirim, geri ödeme ve chargeback** senaryoları her hedef pazarda test edilir. Yalnız happy-path kanıtıyla bir pazar "ödeme-hazır" sayılmaz.

## 6. UGC, içerik moderasyonu ve güven politikaları

**Moderasyon, dili çevirmekten zordur.** Kural kümesi dil bilgisi değil kültür ve bağlam bilgisidir; pazar başına yeniden değerlendirilir.

**6.1 Her dil/pazar için ayrı değerlendirilecekler (tamamı):**

1. hakaret ve nefret ifadeleri;
2. dolaylı veya kodlanmış söylemler;
3. yerel argo;
4. tarihsel ve siyasi referanslar;
5. dolandırıcılık kalıpları;
6. taciz ve tehdit biçimleri;
7. telefon/e-posta/kimlik verisi tespiti;
8. yasal olarak kaldırılması gereken içerikler;
9. itiraz ve inceleme süreçleri;
10. moderatör güvenliği ve eğitimleri;
11. yanlış pozitif/negatif oranları.

**6.2 Bağlam kuralı.** Aynı sözcük bir dilde saldırgan, başka bağlamda kişi adı veya teknik terim olabilir. **İngilizce merkezli kural kümesinin makine çevirisiyle diğer dillere uygulanması ciddi hata üretir** — hem yanlış pozitif (meşru içeriğin silinmesi) hem yanlış negatif (zararlı içeriğin kaçırılması) yönünde.

**6.3 AI özelliği varsa (tamamı zorunlu):**

1. model kalitesi dil ve lehçe bazında ölçülür;
2. güvenlik testleri yalnız İngilizce yapılmaz;
3. prompt injection ve politika aşımı farklı dillerde denenir;
4. kullanıcı girdisinin sessizce başka dile çevrilip çevrilmediği belirtilir;
5. dil fallback davranışı görünür olur;
6. model, moderasyon ve retrieval bileşenleri ayrı ayrı locale bazında değerlendirilir;
7. konuşma özellikleri aksan, lehçe, konuşma hızı ve engellilik açısından test edilir.

AI sınırlarının genel çerçevesi için çapraz referans: `ai-governance-master.md`.

## 7. Coğrafya ve politik hassasiyetler

**Ülke/bölge listesi yalnız teknik veri değildir** — ürün politikasıdır; yanlış yönetimi pazar kaybettirir.

**7.1 Ürün politikası gerektirenler (tamamı):**

1. tartışmalı bölge adları;
2. harita sınırları;
3. ülke bayrakları;
4. resmî ve yerel isimler;
5. tarihsel isim değişiklikleri;
6. bağımlı bölgeler;
7. ülke kodlarının değiştirilmesi;
8. hizmet verilmeyen bölgeler;
9. yaptırım kapsamındaki bölgeler;
10. kullanıcının seçtiği ülke ile IP ülkesinin uyuşmaması;
11. seyahat, VPN ve kurumsal ağlar.

**7.2 NORMATİF — IP sınırı.** IP geolocation kullanıcının uyruğu, vergi mukimliği, fatura ülkesi veya hukuki yetki alanı **değildir**. IP'ye göre otomatik yönlendirme yapılabilir; fakat kullanıcı seçimi engellenmez ve hukuki kararlar yalnız IP verisine dayandırılmaz.

**7.3 NORMATİF — coğrafi veri katmanı.** Ülke adları ve haritalar için translation release **beklenmez**: merkezi, sürümlü ve politika kontrollü coğrafi veri katmanı kullanılır. Bir bölge adının veya sınırının değişimi çeviri işi değil, politika kontrollü veri sürümü işidir. Harita/görselleştirme sınırı için çapraz referans: `adr-geo-visualization.md`.

## 8. Dağıtım, keşfedilebilirlik ve SEO

**Yerelleştirilmiş olmak ≠ hedef pazarda bulunabilir olmak.** Çeviri tek başına pazarda görünürlük üretmez.

**8.1 Dikkate alınacaklar (tamamı):**

1. yerelleştirilmiş URL yapısı — kanonik kurallar `url-policy.md` dosyasındadır; **bu yönerge URL grameri tanımlamaz**, yalnız pazarlama/keşif kararlarını ekler;
2. canonical ve dil alternatifleri (hreflang);
3. yerel sayfa başlıkları ve açıklamalar;
4. yerel anahtar kelime araştırması;
5. arama motoru ve uygulama mağazası tercihleri (pazarda baskın motor/mağaza farklı olabilir);
6. yerel alan adı veya alt dizin stratejisi;
7. sosyal paylaşım görselleri;
8. app store metadata ve ekran görüntüleri;
9. pazara özgü landing page;
10. yerel referanslar ve müşteri hikâyeleri;
11. botların ve crawler'ların dil seçimine erişebilmesi;
12. IP bazlı zorunlu yönlendirmelerin önlenmesi (yönlendirme öneri olabilir, dayatma olamaz — §7.2 ile tutarlı).

**8.2 NORMATİF:** Ürün içi dil ile pazarlama sitesi dili **bağımsız sürümlenebilir**; kullanıcı pazarlama sitesinden ürüne (veya tersine) geçtiğinde dil/pazar bağlamı korunur.

## 9. Müşteri desteği, satış ve operasyon

**Bir dili menüye eklemek, o dilde hizmet taahhüdü anlamına gelebilir.** Taahhüt bilinçli verilir; sessiz varsayımla oluşmaz.

**9.1 Pazar açılmadan önce açık olması gereken kararlar (tamamı):**

1. hangi dilde destek veriliyor;
2. destek hangi saatlerde (ve hangi saat diliminde) veriliyor;
3. acil olay iletişimi hangi dillerde;
4. status page hangi dillerde;
5. fatura itirazları hangi dilde işlenecek;
6. hesap kurtarma hangi dilde;
7. güvenlik olayları hangi dilde bildirilecek;
8. satış ve onboarding desteği var mı;
9. yardım merkezi ve geliştirici dokümanları güncel mi;
10. yerel tatillerde destek/SLA nasıl çalışacak;
11. İngilizce escalation'a geçildiğinde kullanıcı bilgilendirilecek mi;
12. hukuki veya teknik destek sırasında çeviri hizmeti kullanılacak mı.

**9.2 NORMATİF:** Desteklenmeyen dilde kritik güvenlik, ödeme veya veri kaybı mesajı göstermek **operasyonel risk yaratır**: kullanıcı mesajı anlamadan onaylar veya yok sayar. Kritik mesaj sınıfı, destek taahhüdü verilen dillerle hizalanır; hizalanamıyorsa kayıtlı karar (kim, neden, hangi risk) zorunludur.

## 10. Devir haritası (zorunlu bölüm)

Bu yönergenin **kapsamadığı**, sahibi başka yönergelerde yaşayan alanlar. Çakışma halinde sahip dosya kazanır; bu yönerge güncellenir.

| Alan | Sahip yönerge |
|---|---|
| Temel ayrım (dil/locale) + veri modeli + kültürel ürün uyumu + font/rendering + l10n operasyonu | `standards/01-i18n-l10n-g11n-standard.md` |
| Hukuk / gizlilik / veri bölgesi / sözleşme sürümleme | `privacy-retention-decision-matrix.md` |
| Vergi / fatura / para modeli | `financial-state-model-contract.md` |
| Zaman / takvim / iş günü | `atomic-types-directive.md` |
| Kişi adı / adres / telefon | `actor-party-contract.md` |
| Unicode identifier güvenliği + global auth / hesap kurtarma | `standards/03-authn-authz-iam-standard.md` |
| Arama / collation / transliteration | `k-search-directive.md` |
| Erişilebilirlik × i18n kesişimi | `standards/02-a11y-accessibility-standard.md` |
| Altyapı / veri bölgesi ölçümü (CDN, latency, failover) | `standards/12-devops-infrastructure-standard.md` |
| Fiyatlandırma / paketleme | `standards/10-business-model-switching-standard.md` |
| Analitik boyutları (dil/locale/pazar boyutlu ölçüm) | `decision-grade-data-contract.md` |
| Global launch kapısı (go/no-go soruları) | `standards/14-enterprise-readiness-checklist.md` |
| URL / SEO grameri (kanonik URL kuralları) | `url-policy.md` |

## 11. i18n'in güçlü/zayıf alan özeti (kapanış)

i18n standartlarının güçlü olduğu alan **temsil ve biçimlendirmedir**; zayıf veya kapsam dışı kaldığı alanlar: **anlam, iş kuralı, hukuk, vergi, ödeme, kimlik, güvenlik, erişilebilirlik, kültür, altyapı, operasyon, destek, analitik, pazar stratejisi.** Bu yönerge bu boşluğun beş pazar-operasyonel parçasını (ödeme, moderasyon, coğrafya, dağıtım, destek) kapatır; kalan parçaların sahipleri §10 devir haritasındadır.

## 12. Test stratejisi

- **Kapsama probe'ları:** `tests/globalReadiness.test.ts` bu yönergenin kapsama probe'larını taşır (test-önce; kırmızı→yeşil kanıtıyla yazıldı). Beş probe grubu (ödeme-pazarı, UGC-moderasyon, coğrafya-politik, dağıtım-SEO, destek-satış-operasyon) bu dosyayı; entegrasyon disiplini README kataloğunu, §10 devir haritasını ve yasak desen korumasını doğrular.
- **Ödeme senaryo matrisi:** §5.3'teki yedi senaryo (doğrulama, reddedilme, bekleyen işlem, gecikmiş bildirim, çift bildirim, geri ödeme, chargeback) hedef pazar başına koşulur; yalnız happy-path yeşili kabul edilmez.
- **Moderasyon kalitesi:** yanlış pozitif/negatif oranları dil bazında ölçülür; İngilizce dışı en az bir dilde prompt injection ve politika aşımı denemesi kanıtlanır (§6.3).
- **Coğrafi veri sürümü:** politika kontrollü coğrafi veri katmanında bir bölge adı değişikliğinin translation release olmadan yayınlanabildiği gösterilir (§7.3).
- **Keşif smoke:** hreflang/canonical çıktısı ve botların dil seçimine IP bazlı zorunlu yönlendirme olmadan erişebildiği doğrulanır (§8.1).
- **Destek taahhüdü:** pazar başına dil taahhüdü kaydı ile kritik mesaj sınıfının dil kapsamı karşılaştırılır (§9.2).

## 13. Acceptance criteria

- §5.1, §6.1, §6.3, §7.1, §8.1 ve §9.1 listelerinin tamamı hedef pazar başına değerlendirilmiş ve kayıt altına alınmıştır; "N/A" yalnız gerekçeyle geçerlidir.
- §5.3, §7.2, §7.3, §8.2 ve §9.2 normatif kuralları ihlalsizdir; istisna yalnız kayıtlı kararla (kim/neden/hangi risk) olur.
- `tests/globalReadiness.test.ts` yeşildir (beş probe grubu + entegrasyon disiplini).
- **14 launch sorusu (`standards/14-enterprise-readiness-checklist.md`) bu yönergedeki alanlara bağlanmıştır**; global launch kapısı bu yönergeden bağımsız "yeşil" ilan edilemez.
- §10 devir haritası tamdır; bu yönerge sahip dosyaların alanına kural yazmamıştır.

## 14. Anti-patterns

| Anti-pattern | Neden yanlış | Doğrusu |
|---|---|---|
| "Kredi kartı kabul ediyoruz, pazar hazır" | Birçok pazarda baskın araç kart değil; başarı oranı yerel acquiring ister | §5.1 listesi pazar başına eksiksiz değerlendirilir |
| Yalnız happy-path ödeme testi | Reddedilme, gecikmiş bildirim ve çift bildirim üretimde ortaya çıkar | §5.3 yedi senaryo zorunlu |
| İngilizce moderasyon kurallarını makine çevirisiyle taşımak | Bağlam kaybolur; yanlış pozitif ve yanlış negatif birlikte artar | Dil/pazar başına kural + yerel uzman değerlendirmesi (§6.2) |
| AI güvenlik testini yalnız İngilizce koşmak | Prompt injection çok dillidir; koruma tek dilde kalır | §6.3 çok dilli test zorunluluğu |
| IP geolocation'dan uyruk/vergi/hukuk çıkarmak | IP bir konum sinyalidir, hukuki statü değildir | §7.2: seçim kullanıcının, hukuki karar ayrı veriden |
| Ülke adlarını/haritaları çeviri dosyasında tutmak | Politik değişiklik translation release'e takılır | §7.3 merkezi, sürümlü coğrafi veri katmanı |
| IP bazlı zorunlu yönlendirme | Kullanıcı ve crawler dil seçimine erişemez; keşif ve güven kaybı | §8.1: öneri gösterilir, dayatma yapılmaz |
| Menüye dil ekleyip destek vermemek | Zımni hizmet taahhüdü doğar; kritik mesaj anlaşılmaz kalır | §9.1 karar listesi + §9.2 hizalama |

## 15. Definition of Done

- `docs/global-market-readiness-directive.md` yazıldı; `docs/README.md` kataloğuna işlendi.
- `tests/globalReadiness.test.ts` bu dosyayı hedefleyen beş probe grubu + entegrasyon disiplini yeşil (kırmızı→yeşil kanıtı korunur).
- §10 devir haritasındaki 13 sahip dosya referansı geçerli (dosyalar mevcut; alan çakışması yok).
- Yasak desen taraması temiz: eski kimlik grameri veya numaralı route önerisi yok; URL kuralı yazılmadı (`url-policy.md` tek otorite).
- CPO onayı: bu doküman AI-DRAFT'tır; pazar-alan kararları (özellikle §7 politika hücreleri ve §9 taahhüt seviyeleri) insan kaynaklı gerçek kanıt ve onay olmadan "implemented/verified/done" sayılmaz.

## 16. Requirement-ID tablosu

| ID | Gereksinim | Zorlayan |
|---|---|---|
| GMR-1 | Pazar başına §5.1 ödeme değerlendirmesi eksiksizdir; happy-path dışı yedi senaryo test edilir | `tests/globalReadiness.test.ts` + §5.3 |
| GMR-2 | Moderasyon kuralları dil/pazar başınadır; makine çevirisiyle kural taşınmaz | §6.1–6.2 |
| GMR-3 | AI özellikleri locale bazında değerlendirilir; güvenlik testleri çok dillidir | §6.3 + `ai-governance-master.md` |
| GMR-4 | IP geolocation hukuki statü kaynağı değildir; kullanıcı seçimi engellenmez | §7.2 |
| GMR-5 | Coğrafi adlar/haritalar sürümlü, politika kontrollü veri katmanından gelir | §7.3 + `adr-geo-visualization.md` |
| GMR-6 | hreflang/canonical + bot erişimi sağlanır; IP bazlı zorunlu yönlendirme yapılmaz | §8.1 |
| GMR-7 | Ürün dili ile pazarlama dili bağımsız sürümlenir; geçişte bağlam korunur | §8.2 |
| GMR-8 | Dil bazlı destek taahhüdü açıktır; kritik mesaj sınıfı taahhütle hizalıdır | §9.1–9.2 |
| GMR-9 | Devir haritası tek-sahip disiplinini korur; alan çakışması yasaktır | §10 |

---

*Bağlı: `standards/01-i18n-l10n-g11n-standard.md` (temsil/biçimlendirme tabanı — bu yönergenin kapsamadığı taban); `standards/14-enterprise-readiness-checklist.md` (global launch kapısı — 14 launch sorusu bu yönergedeki alanlara bağlanmıştır); `tests/globalReadiness.test.ts` (kapsama probe'ları); `ai-governance-master.md` (AI sınırları); `adr-geo-visualization.md` (harita/görselleştirme sınırı); §10 devir haritasındaki sahip dosyalar. Bu doküman AI-DRAFT'tır — CPO onayı bekler; AI bu dosyayı kanonik ilan edemez.*
