#!/usr/bin/env node
/**
 * seed-core-operations — Faz B1 (Cowork tek-ajan, swarm yerine).
 * core-operations kümesinin 14 ŞABLON e-ticaret/operasyon düğümüne ELLE yazılmış, sayfaya-özel
 * 14 boyut içeriği uygular (provenance="swarm"); 11 CRM/app bespoke düğümünü provenance="human" damgalar.
 * Doğrula: node tools/agents/check-content.mjs core-operations  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");
const HUMAN = ["app-core-operations", "s-crm", "m-crm-sales", "st-crm-lead-mgmt", "mol-crm-lead-scoring", "mol-crm-lead-dedup", "at-crm-email-regex", "at-crm-domain-blocklist", "at-crm-score-range-check", "el-crm-score-field-validator", "el-crm-score-weight-config"];

const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const CONTENT = {
  "s-sales": {
    featureDefs: [
      "Satış/Sipariş ArcheType'ı: teklif→sipariş→sevkiyat→fatura akışını ve sipariş kalemlerini yönetir",
      "Fiyatlandırma, indirim, vergi ve para birimi kuralları sipariş satırında çözülür",
      "Sipariş durumları (taslak/onaylı/sevk/iptal) ve kısmi sevkiyat desteklenir",
    ],
    security: [
      "Sipariş tablolarında tenant_id RLS; satış temsilcisi yalnız kendi portföyünü görür",
      "Fiyat/indirim değişikliği yetki eşiğine bağlı; eşik üstü onay + değişmez iz",
      "Müşteri iletişim ve ödeme referansı maskelenir; ham kart verisi tutulmaz",
    ],
    codeOptimization: [
      "Sipariş toplamı saf hesap fonksiyonu; satır değişiminde artımlı yeniden hesap",
      "Fiyatlandırma motoru kurallar tablosundan; kod içine gömülü fiyat yok",
      "Sipariş yazımı tek işlemde (transaction); kalemler atomik kaydedilir",
    ],
    securityOptimization: [
      "İndirim yetkisi rol+eşik allowlist'i; keyfi sıfır-fiyat reddedilir",
      "Sipariş API'si idempotency anahtarıyla; tekrar gönderimde çift sipariş oluşmaz",
      "Vergi/fiyat kuralı değişikliği sürümlenir ve geriye dönük etki analiziyle uygulanır",
    ],
    performance: [
      "Sipariş listesi tenant+tarih bileşik indeksiyle; büyük hacimde sayfalı çekim",
      "Sipariş özet panosu okuma-modelinden beslenir, yazma yolundan ayrık",
      "Toplu sipariş içe aktarımı kuyruğa alınır; eşzamanlı kilitlenme önlenir",
    ],
    mobileApps: [
      "Saha satış için mobil sipariş girişi; zayıf bağlantıda taslak kuyruğu",
      "iOS/Android'de barkod/QR ile ürün ekleme",
      "Sipariş onayı dar ekranda tek akışta tamamlanır",
    ],
    wcag: [
      "Sipariş formunda her alan etiketli; tutar değişimi metinle de duyurulur",
      "Sipariş tablosu sıralanabilir ve klav/screen-reader erişimli; kontrast 7:1",
      "Hata (stok yok/fiyat değişti) alanla ilişkili ve sesli bildirilir",
    ],
    deployment: [
      "Sipariş servisi yatay ölçeklenir (Swarm/Kubernetes); pik kampanya yüküne HPA",
      "Sipariş olayları outbox ile yayınlanır; teslim garantisi korunur",
      "Shared hosting profilinde tek-düğüm sipariş + zamanlanmış senkron",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sipariş onaylandı → stok rezervasyonu oluştur + sevkiyat görevi aç (idempotent, zincir ≤6)",
      "Olay: ödeme başarısız → siparişi beklemeye al + müşteriye bildirim (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sipariş anomalisi (anormal indirim/miktar) işaretler ve öneri verir; siparişi kendisi onaylayamaz",
    ],
    testing: [
      "Sipariş toplam/vergi hesabı için sınır-değer birim testleri",
      "Teklif→sipariş→sevkiyat kullanıcı yolculuğu (Playwright); düzelene dek en çok 6 tur",
      "Eşzamanlı stok rezervasyonu yarış-durumu testi",
    ],
    owasp: [
      "A01 Access Control: portföy bazlı sipariş erişimi deny-by-default",
      "A04 Insecure Design: indirim/fiyat manipülasyonu eşik+onayla engellenir",
      "A09 Logging: fiyat/indirim değişiklikleri forensic audit'e",
    ],
    integration: [
      "Sales, Inventory (stok rezervasyonu) ve Payment ile sözleşme üzerinden entegre",
      "Fatura için Finance ledger'a olay yayınlar",
      "CRM ile müşteri/fırsat bağı (s-crm referansı)",
    ],
    moduleUsage: [
      "Sales/Order ArcheType'ı Çekirdek Operasyon app'inde sipariş yönetimini sağlar",
      "E-ticaret, POS ve B2B app'leri bu sipariş sözleşmesini tüketir",
    ],
  },

  "s-purchase": {
    featureDefs: [
      "Satınalma ArcheType'ı: talep→sipariş→mal kabul→fatura eşleştirme (3-way match) akışı",
      "Tedarikçi, satınalma siparişi ve mal kabul belgeleri yönetilir",
      "Bütçe kontrolü ve onay hiyerarşisi talep aşamasında uygulanır",
    ],
    security: [
      "Satınalma tablolarında tenant_id RLS; bütçe sahibi onayı zorunlu",
      "Tedarikçi banka/IBAN bilgisi maskeli; değişiklik step-up onay gerektirir",
      "3-way match uyuşmazlığı otomatik bloklanır ve denetime düşer",
    ],
    codeOptimization: [
      "Satınalma onay zinciri durum makinesiyle; her adım tek sorumluluk",
      "3-way match karşılaştırması saf hesap; belge değişiminde yeniden değerlendirme",
      "Tedarikçi araması indeksli; tekrar eden tedarikçi tekilleştirilir",
    ],
    securityOptimization: [
      "Onay eşikleri rol allowlist'iyle; bütçe aşımı sessizce geçemez",
      "Tedarikçi değişikliği (banka) çift onay + soğuma süresiyle korunur",
      "Fatura eşleştirme toleransı sürümlü; keyfi tolerans reddedilir",
    ],
    performance: [
      "Satınalma listesi tedarikçi+durum indeksiyle sayfalanır",
      "Mal kabul toplu girişinde kuyruk; eşzamanlı stok güncellemesi serileştirilir",
      "Bütçe sorgusu özet okuma-modelinden",
    ],
    mobileApps: [
      "Mobil onay: bütçe sahibi talebi telefondan onaylar/reddeder",
      "iOS/Android'de mal kabulde fotoğraf/irsaliye ekleme",
      "Dar ekranda onay kuyruğu öncelikli",
    ],
    wcag: [
      "Onay aksiyonları klavye erişimli ve geri-alınamaz onay için açık uyarı",
      "3-way match farkları renk+işaret+metinle gösterilir; kontrast 7:1",
      "Tedarikçi formu alan-etiket ilişkili ve hata bildirimli",
    ],
    deployment: [
      "Satınalma servisi Swarm/Kubernetes; onay bildirimi ayrı worker",
      "Mal kabul olayları outbox ile stok/finans servislerine",
      "Shared hosting'de temel talep-onay; eşleştirme zamanlanmış",
    ],
    eca: [
      ECA_BOUND,
      "Olay: 3-way match uyuşmazlığı → faturayı beklemeye al + denetçiye bildir (idempotent, zincir ≤6)",
      "Olay: bütçe eşiği aşıldı → onay yükselt (step-up) (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tedarikçi/fiyat anomalisi tespit edip öneri sunar; satınalma siparişini kendisi açamaz",
    ],
    testing: [
      "3-way match doğruluk testi (uyumlu/uyumsuz senaryolar)",
      "Talep→onay→mal kabul kullanıcı yolculuğu; en çok 6 düzeltme turu",
      "Bütçe eşiği step-up tetik testi",
    ],
    owasp: [
      "A01 Access Control: bütçe/onay yetkisi rol bazlı",
      "A04 Insecure Design: 3-way match ile sahte fatura tasarımca engellenir",
      "A09 Logging: tedarikçi banka değişikliği forensic iz",
    ],
    integration: [
      "Purchase, Inventory (mal kabul→stok) ve Finance (fatura→ledger) ile entegre",
      "Tedarikçi kaydı paylaşılan parti (party) sözleşmesinden",
      "Onay akışı Approval Escalation ruleset paketine bağlı",
    ],
    moduleUsage: [
      "Purchase ArcheType'ı Çekirdek Operasyon'da tedarik sürecini sağlar",
      "MRP ve Inventory app'leri satınalma sözleşmesini tüketir",
    ],
  },

  "s-inventory": {
    featureDefs: [
      "Envanter/Stok ArcheType'ı: çoklu depo, lot/seri takibi, stok hareketi ve sayım",
      "Rezervasyon, transfer ve negatif-stok politikası yönetilir",
      "Stok değerleme (FIFO/ortalama) ve düşük-stok uyarısı sağlanır",
    ],
    security: [
      "Stok tablolarında tenant_id RLS; depo bazlı erişim yetkisi",
      "Stok düzeltmesi (sayım farkı) gerekçe+onay ister; değişmez iz tutulur",
      "Transfer iki-adımlı (çıkış/giriş) onayla; tek-taraflı kayıp engellenir",
    ],
    codeOptimization: [
      "Stok bakiyesi olay-temelli türetilir (hareket toplamı); anlık tutar önbellekli",
      "Rezervasyon mantığı saf; aşırı-rezervasyon hesapta engellenir",
      "Lot/seri eşleştirmesi indeksli sorguyla",
    ],
    securityOptimization: [
      "Negatif stok yalnız izinli politikada; aksi halde işlem reddi",
      "Sayım düzeltme toleransı eşikli; eşik üstü ikinci onay",
      "Stok hareketi idempotent; tekrar tetikte çift hareket oluşmaz",
    ],
    performance: [
      "Stok hareketi yüksek hacimli; append-only defter + periyodik bakiye anlık görüntüsü",
      "Depo+ürün bileşik indeksiyle hızlı bakiye sorgusu",
      "Toplu sayım içe aktarımı kuyrukla; kilitlenme önlenir",
    ],
    mobileApps: [
      "El terminali/telefonla barkod okutarak sayım ve transfer",
      "iOS/Android offline sayım; bağlantı gelince senkron",
      "Düşük-stok uyarısı mobil bildirim",
    ],
    wcag: [
      "Stok sayım ekranı klavye+okuyucu erişimli; miktar değişimi sesli",
      "Düşük/negatif stok yalnız renkle değil ikon+metinle; kontrast 7:1",
      "Transfer onayı açık ve geri-alınamaz uyarılı",
    ],
    deployment: [
      "Stok servisi yatay ölçek; depo bazlı bölümleme (sharding) opsiyonu",
      "Stok olayları outbox ile sipariş/satınalma servislerine",
      "Shared hosting'de tek-depo basit stok profili",
    ],
    eca: [
      ECA_BOUND,
      "Olay: stok eşik altına düştü → yeniden sipariş önerisi + satınalma talebi taslağı (idempotent, zincir ≤6)",
      "Olay: lot son-kullanma yaklaştı → karantina/uyarı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI talep tahmini ve yeniden-sipariş önerisi üretir; stok düzeltmesini kendisi uygulayamaz",
    ],
    testing: [
      "Stok bakiyesi türetme doğruluk testi (hareketlerden)",
      "Eşzamanlı rezervasyon yarış-durumu + aşırı-rezervasyon testi",
      "Sayım→düzeltme kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: depo bazlı stok erişimi",
      "A04 Insecure Design: negatif stok/aşırı-rezervasyon tasarımca engellenir",
      "A09 Logging: stok düzeltmeleri forensic iz",
    ],
    integration: [
      "Inventory, Sales (rezervasyon) ve Purchase (mal kabul) ile entegre",
      "MRP üretim emirleri için stok tüketimini bildirir",
      "Stok değerleme Finance'a aktarılır",
    ],
    moduleUsage: [
      "Inventory ArcheType'ı Çekirdek Operasyon'da stok otoritesidir",
      "E-ticaret, POS, WMS ve MRP app'leri stok sözleşmesini tüketir",
    ],
  },

  "s-pos": {
    featureDefs: [
      "Point of Sale ArcheType'ı: hızlı satış ekranı, vardiya/kasa yönetimi, çevrimdışı satış",
      "Ödeme (nakit/kart/cüzdan), iade ve fiş yönetimi",
      "Vardiya açılış/kapanış ve kasa mutabakatı",
    ],
    security: [
      "POS oturumu vardiya+kasiyer kimliğine bağlı; tenant_id RLS",
      "İade/iptal yetki eşiğine bağlı; eşik üstü yönetici onayı",
      "Kart verisi POS'ta tutulmaz; ödeme sağlayıcı token'ı kullanılır",
    ],
    codeOptimization: [
      "POS satış yolu çevrimdışı-öncelikli; yerel kuyruk + sonradan senkron",
      "Fiş hesabı saf; sepet değişiminde artımlı toplam",
      "Ürün arama yerel önbellekli; ağ gecikmesi satışı durdurmaz",
    ],
    securityOptimization: [
      "Çevrimdışı satışlar imzalı kuyrukta; senkronda çift-kayıt idempotent engellenir",
      "İade nedeni allowlist'i; keyfi iade reddedilir",
      "Kasa açığı eşiği uyarısı + audit",
    ],
    performance: [
      "POS ekranı düşük gecikme hedefler; satış işlemi yerel, senkron asenkron",
      "Ürün katalogu cihazda önbellek; arama anında",
      "Vardiya kapanış raporu özet okuma-modelinden",
    ],
    mobileApps: [
      "Tablet/telefon POS; dokunmatik hızlı sepet",
      "iOS/Android çevrimdışı satış + otomatik senkron",
      "Barkod/QR ve makbuz paylaşımı (e-fiş)",
    ],
    wcag: [
      "POS tuşları büyük dokunma hedefi ve yüksek kontrast (7:1)",
      "Tutar/iade onayı sesli ve metinle bildirilir",
      "Klavye/okuyucu erişimi engelli kasiyer için",
    ],
    deployment: [
      "POS uç cihaz + edge senkron; merkez Swarm/Kubernetes'te toplar",
      "Çevrimdışı dayanıklılık: cihaz yerel deposu + outbox senkron",
      "Shared hosting'de tek-mağaza POS profili",
    ],
    eca: [
      ECA_BOUND,
      "Olay: vardiya kapandı → kasa mutabakatı oluştur + fark uyarısı (idempotent, zincir ≤6)",
      "Olay: çevrimdışı satış senkronlandı → stok ve ciroyu güncelle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kasa açığı/iade anomalisi işaretler; satış veya iadeyi kendisi gerçekleştiremez",
    ],
    testing: [
      "Çevrimdışı satış→senkron idempotency testi (çift-kayıt yok)",
      "Vardiya açılış→satış→kapanış kullanıcı yolculuğu; en çok 6 tur",
      "İade yetki eşiği testi",
    ],
    owasp: [
      "A01 Access Control: iade/iptal yetki eşiği",
      "A02 Cryptographic Failures: kart verisi token'la, ham tutulmaz",
      "A09 Logging: kasa farkları ve iadeler iz bırakır",
    ],
    integration: [
      "POS, Inventory (stok düşümü) ve Payment (tahsilat) ile entegre",
      "Ciro Finance'a, satış CRM'e yansır",
      "Ürün/fiyat Commerce/PIM sözleşmesinden",
    ],
    moduleUsage: [
      "POS ArcheType'ı Çekirdek Operasyon'da mağaza satışını sağlar",
      "Perakende ve restoran app'leri POS sözleşmesini tüketir",
    ],
  },

  "s-commerce": {
    featureDefs: [
      "Commerce Stack: vitrin, sepet, sipariş, kampanya ve katalog yeteneklerini birleştiren ArcheType",
      "Çok-kanallı satış (web/mobil/pazar yeri) tek sipariş havuzunda",
      "Kampanya/kupon ve fiyatlandırma kuralları katalog üzerinde",
    ],
    security: [
      "Sepet/sipariş tenant_id RLS; misafir sepeti oturuma bağlı, PII minimal",
      "Kupon kötüye kullanımı oran-sınırı + tekrar kontrolüyle engellenir",
      "Ödeme adımı PCI kapsamı dışına itilir (sağlayıcı token)",
    ],
    codeOptimization: [
      "Sepet hesabı saf ve önbelleklenebilir; kampanya kuralları kural tablosundan",
      "Katalog okuması okuma-modelinden; yazma nadir, okuma yoğun",
      "Vitrin bileşenleri tembel yüklenir",
    ],
    securityOptimization: [
      "Kupon/indirim kuralı sürümlü; keyfi sıfır-fiyat reddi",
      "Sepet→sipariş geçişi idempotent; çift sipariş engellenir",
      "Bot/stok-kapma için oran-sınır + doğrulama",
    ],
    performance: [
      "Katalog/vitrin CDN+önbellek; yüksek okuma hacmine ölçeklenir",
      "Sepet işlemleri düşük gecikme; kampanya hesabı artımlı",
      "Kampanya zirvesinde okuma-replikası + kuyruk",
    ],
    mobileApps: [
      "Mobil-öncelikli vitrin/sepet; PWA ile çevrimdışı tarama",
      "iOS/Android tek-dokunuş ödeme cüzdan entegrasyonu",
      "Push ile sepet hatırlatma",
    ],
    wcag: [
      "Vitrin/sepet klavye+okuyucu erişimli; fiyat ve stok metinle",
      "Kampanya rozetleri renk dışında metinle de; kontrast 7:1",
      "Ödeme akışı odak sırası ve hata bildirimi erişilebilir",
    ],
    deployment: [
      "Commerce yatay ölçek; vitrin edge/CDN, sipariş merkezde",
      "Kampanya zirvesi için HPA + kuyruk (Kubernetes)",
      "Shared hosting'de statik vitrin + JSON sipariş kuyruğu",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sepet terk edildi → hatırlatma akışı (kişisel veri iznine bağlı, idempotent, zincir ≤6)",
      "Olay: stok tükendi → vitrinde 'tükendi' + bekleme listesi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ürün öneri/kişiselleştirme üretir; fiyat veya kampanya kuralını kendisi değiştiremez",
    ],
    testing: [
      "Sepet→ödeme→sipariş kullanıcı yolculuğu (Playwright); en çok 6 tur",
      "Kupon kötüye kullanım/oran-sınır testi",
      "Yük testi: kampanya zirvesi sepet işlemleri",
    ],
    owasp: [
      "A01 Access Control: misafir/üye sepet izolasyonu",
      "A04 Insecure Design: kupon/stok-kapma bot koruması tasarımda",
      "A03 Injection: vitrin girdileri güvenli render",
    ],
    integration: [
      "Commerce, Inventory (stok), Payment (tahsilat) ve Sales (sipariş) ile entegre",
      "Katalog PIM'den, müşteri CRM'den beslenir",
      "Kampanya olayları pazarlama app'ine yayılır",
    ],
    moduleUsage: [
      "Commerce Stack Çekirdek Operasyon'da e-ticaret çekirdeğini sağlar",
      "Pazar yeri, dropshipping ve abonelik app'leri bu stack'i tüketir",
    ],
  },

  "s-mrp": {
    featureDefs: [
      "MRP/Üretim ArcheType'ı: ürün ağacı (BOM), üretim emri, malzeme ihtiyaç planlama, kapasite",
      "Üretim emri yaşam döngüsü ve yarı-mamul takibi",
      "Tedarik/üretim önerileri talep+stok+temin süresinden hesaplanır",
    ],
    security: [
      "Üretim verisi tenant_id RLS; reçete (BOM) gizliliği rol bazlı",
      "Üretim emri değişikliği onay+iz; başlamış emir kısıtlı düzenlenir",
      "Maliyet/reçete bilgisi maskeli; dışa aktarım denetlenir",
    ],
    codeOptimization: [
      "MRP hesabı toplu/zamanlanmış; çok seviyeli BOM açılımı verimli",
      "Üretim emri durum makinesi; her geçiş tek sorumluluk",
      "Kapasite planı önbellekli; girdi değişiminde yeniden hesap",
    ],
    securityOptimization: [
      "MRP çalıştırması idempotent; tekrar koşuda çift emir oluşmaz",
      "Reçete değişikliği sürümlü + onaylı; aktif emirler eski sürümle korunur",
      "Maliyet manipülasyonu eşik+iz ile engellenir",
    ],
    performance: [
      "Çok seviyeli BOM açılımı için bellek-içi graf + budama",
      "MRP koşusu büyük veri için parçalı/asenkron",
      "Kapasite sorgusu özet okuma-modelinden",
    ],
    mobileApps: [
      "Atölye terminalinde üretim emri ilerlemesi mobil giriş",
      "iOS/Android offline üretim kaydı + senkron",
      "Malzeme eksikliği uyarısı mobil bildirim",
    ],
    wcag: [
      "BOM ağacı klavye+okuyucu erişimli (aria-tree)",
      "Emir durumu renk dışında metin+ikonla; kontrast 7:1",
      "Üretim kaydı formu etiketli ve hata bildirimli",
    ],
    deployment: [
      "MRP koşusu ayrı worker/CronJob; çevrimiçi yolu yavaşlatmaz",
      "Üretim olayları outbox ile stok/satınalma servislerine",
      "Shared hosting'de basit BOM + manuel planlama",
    ],
    eca: [
      ECA_BOUND,
      "Olay: malzeme ihtiyacı açığı → satınalma talebi/üretim emri önerisi (idempotent, zincir ≤6)",
      "Olay: üretim emri tamamlandı → mamul stoğunu artır + maliyet kapat (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI talep tahmini ve plan önerisi üretir; üretim emrini kendisi açamaz/değiştiremez",
    ],
    testing: [
      "Çok seviyeli BOM açılım doğruluk testi",
      "MRP idempotency testi (tekrar koşu çift emir üretmez)",
      "Üretim emri yaşam döngüsü kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: reçete/maliyet gizliliği rol bazlı",
      "A08 Integrity: reçete sürümleme ile bütünlük",
      "A09 Logging: maliyet/reçete değişikliği iz",
    ],
    integration: [
      "MRP, Inventory (malzeme), Purchase (tedarik) ve Sales (talep) ile entegre",
      "Maliyet Finance'a aktarılır",
      "Kapasite/iş emri saha (FSM) app'ine bağlanabilir",
    ],
    moduleUsage: [
      "MRP ArcheType'ı Çekirdek Operasyon'da üretim planlamayı sağlar",
      "Üretim ve tedarik zinciri app'leri MRP sözleşmesini tüketir",
    ],
  },

  "s-fraud-trust": {
    featureDefs: [
      "Sahtecilik/Chargeback/Trust ArcheType'ı: risk skorlama, kural+model ile şüpheli işlem tespiti",
      "Chargeback yaşam döngüsü ve itiraz dosyası yönetimi",
      "Güven sinyalleri (cihaz, davranış, geçmiş) ile karar",
    ],
    security: [
      "Risk verisi tenant_id RLS; karar gerekçesi değişmez iz",
      "Manuel inceleme yetkisi dar rol; karar değişikliği çift onay",
      "Hassas sinyaller (cihaz/PII) en-az-ayrıcalıkla erişilir",
    ],
    codeOptimization: [
      "Risk skoru kural+model birleşik; saf skorlayıcı, açıklanabilir özellikler",
      "Karar eşiği yapılandırılabilir; kod içine gömülü eşik yok",
      "Yüksek hacimli işlem için akış (stream) skorlama",
    ],
    securityOptimization: [
      "Eşik/kural değişikliği sürümlü+onaylı; sessiz gevşetme engellenir",
      "Skorlama idempotent; aynı işlem tekrar skorlanınca tutarlı",
      "Model girdisi doğrulanır; zehirli sinyal reddi",
    ],
    performance: [
      "Gerçek-zaman skorlama düşük gecikme; ağır model asenkron zenginleştirme",
      "Kural değerlendirmesi indeksli; sıcak yol hızlı",
      "Karar geçmişi zaman-serisi deposunda",
    ],
    mobileApps: [
      "İnceleme kuyruğu mobil; analist telefondan onay/red",
      "iOS/Android push ile yüksek-risk uyarı",
      "Dar ekranda risk gerekçesi özetli",
    ],
    wcag: [
      "Risk göstergeleri renk dışında etiket+metinle; kontrast 7:1",
      "İnceleme kararı klavye erişimli ve geri-alınamaz onay uyarılı",
      "Gerekçe listesi okuyucuya yapılandırılmış sunulur",
    ],
    deployment: [
      "Skorlama servisi yatay ölçek; model ayrı çıkarım servisi",
      "Karar olayları outbox ile sipariş/ödeme servislerine",
      "Shared hosting'de yalnız kural-temelli hafif skorlama",
    ],
    eca: [
      ECA_BOUND,
      "Olay: risk skoru eşiği aştı → işlemi beklet + manuel incelemeye gönder (idempotent, zincir ≤6)",
      "Olay: chargeback açıldı → itiraz dosyası + kanıt toplama görevi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI risk skoru/öneri üretir (açıklanabilir); işlemi bloklama/serbest bırakma kararını insan/eşik verir",
    ],
    testing: [
      "Risk skorlama sınır-değer + açıklanabilirlik testi",
      "Chargeback yaşam döngüsü kullanıcı yolculuğu; en çok 6 tur",
      "Eşik değişiminin etkisi için regresyon testi",
    ],
    owasp: [
      "A04 Insecure Design: reward-hacking/eşik gevşetme tasarımca izlenir",
      "A01 Access Control: inceleme/karar yetkisi dar",
      "A09 Logging: tüm risk kararları forensic iz",
    ],
    integration: [
      "Fraud/Trust, Commerce/POS (işlem) ve Payment (chargeback) ile entegre",
      "Karar sinyalleri CRM müşteri güven profiline yansır",
      "Approval Escalation ruleset paketiyle yüksek-risk onay akışı",
    ],
    moduleUsage: [
      "Fraud/Trust ArcheType'ı Çekirdek Operasyon'da risk korumasını sağlar",
      "E-ticaret, ödeme ve pazar yeri app'leri bu risk sözleşmesini tüketir",
    ],
  },

  "s-classifieds": {
    featureDefs: [
      "İlan/eşleştirme pazaryeri: ilan oluşturma, kategori, arama ve alıcı-satıcı eşleştirme (lead-gen)",
      "İlan moderasyonu, öne çıkarma (promotion) ve mesajlaşma yetenekleri",
      "Lead kalitesi ve dönüşüm takibi pazaryeri metrikleri",
    ],
    security: [
      "İlan ve mesaj verisi tenant_id RLS; iletişim bilgisi maskeli paylaşılır",
      "Sahte ilan/dolandırıcılık için moderasyon kuyruğu + bildirim",
      "Spam/oran-sınırı ile kötüye kullanım engellenir",
    ],
    codeOptimization: [
      "İlan araması arama servisinden (index); liste sorgusu okuma-modelinden",
      "Kategori ağacı önbellekli; ilan kartı tembel görsel yükler",
      "Mesajlaşma akışı olay-temelli, sayfalama imleçli",
    ],
    securityOptimization: [
      "İletişim açığa çıkarma oran-sınırlı; toplu kazıma (scraping) engellenir",
      "İlan içeriği güvenli render; bağlantı/iletişim enjeksiyonu temizlenir",
      "Öne çıkarma ödemesi idempotent; çift tahsilat önlenir",
    ],
    performance: [
      "İlan arama düşük gecikme; filtre+coğrafi sorgu indeksli",
      "Liste sonsuz kaydırma imleç tabanlı",
      "Popüler kategoriler önbellek; yazma nadir okuma yoğun",
    ],
    mobileApps: [
      "Mobil-öncelikli ilan verme; kameradan çoklu fotoğraf",
      "iOS/Android push ile mesaj/eşleşme bildirimi",
      "Konum tabanlı arama mobilde",
    ],
    wcag: [
      "İlan formu ve arama filtreleri klavye+okuyucu erişimli",
      "İlan durumu (aktif/moderasyonda) renk dışında metinle; kontrast 7:1",
      "Mesaj balonları okuyucuya sıra ve gönderenle sunulur",
    ],
    deployment: [
      "Arama servisi ayrı ölçek; ilan medyası nesne deposu+CDN",
      "Moderasyon işleri ayrı worker (Kubernetes)",
      "Shared hosting'de temel ilan listesi + harici arama",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ilan şüpheli işaretlendi → moderasyon kuyruğuna al + yayını beklet (idempotent, zincir ≤6)",
      "Olay: alıcı-satıcı eşleşti → lead kaydı oluştur + bildirim (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ilan kalitesi/spam skorlar ve kategori önerir; ilanı kendisi yayınlayamaz/silemez",
    ],
    testing: [
      "İlan ver→ara→eşleş→mesajlaş kullanıcı yolculuğu; en çok 6 tur",
      "Spam/oran-sınır ve scraping koruması testi",
      "Moderasyon kuyruğu durum testi",
    ],
    owasp: [
      "A01 Access Control: ilan sahibi/moderatör yetki ayrımı",
      "A03 Injection: ilan/mesaj içerikleri güvenli işlenir",
      "A04 Insecure Design: scraping/spam tasarımca sınırlanır",
    ],
    integration: [
      "Classifieds, mesajlaşma (comms) ve ödeme (öne çıkarma) ile entegre",
      "Lead'ler CRM'e aktarılır (s-crm referansı)",
      "Trust/fraud sinyalleriyle şüpheli ilan tespiti",
    ],
    moduleUsage: [
      "Classifieds module'ü Çekirdek Operasyon'da lead-gen pazaryerini sağlar",
      "Emlak, oto ve genel ilan app'leri bu eşleştirme sözleşmesini tüketir",
    ],
  },

  "s-ecommerce-models": {
    featureDefs: [
      "E-ticaret iş modelleri: capability-flag mimarisiyle B2C/B2B/pazaryeri/abonelik/dropshipping aynı çekirdekten",
      "Bayrak kombinasyonu hangi yeteneklerin açık olduğunu belirler (kod çatallaması yok)",
      "Model geçişi (B2C→pazaryeri) bayrak değişimiyle, yeniden yazım olmadan",
    ],
    security: [
      "Bayrak değişimi yetki+onaya bağlı; iş modeli kilidi sessizce değişmez",
      "Her model kendi tenant izolasyon kapsamını korur",
      "Bayrak kombinasyonu güvenli; çelişen model bayrakları reddedilir",
    ],
    codeOptimization: [
      "Capability flag'leri tek kaynaktan; koşullar bayrak okur, kod çatallamaz",
      "Kapalı yetenekler tembel; açık olmayan model kodu yüklenmez",
      "Bayrak çözümlemesi derleme/başlangıçta sabitlenir",
    ],
    securityOptimization: [
      "Bayrak değişikliği sürümlü+audit; geçiş geriye dönük etki analizli",
      "Yetkisiz model yükseltme (örn. pazaryeri açma) deny",
      "Bayrak tutarlılığı conformance testiyle korunur",
    ],
    performance: [
      "Bayrak okuması O(1); model kararı sıcak yolu yavaşlatmaz",
      "Kapalı yetenek kod yolu hiç çalışmaz (ölü-yol elenmez, hiç girilmez)",
      "Model özetleri önbellekli",
    ],
    mobileApps: [
      "Model bayrak yönetimi mobilde salt-okuma; değişiklik yetkili panelde",
      "Açık yeteneklere göre mobil arayüz uyarlanır",
      "iOS/Android'de aktif model rozetle gösterilir",
    ],
    wcag: [
      "Bayrak listesi anahtarları etiketli ve durum metinli",
      "Aktif model renk dışında metin+ikonla; kontrast 7:1",
      "Model geçiş onayı erişilebilir ve açık uyarılı",
    ],
    deployment: [
      "Bayrak yapılandırması imaja/konfige gömülü; tüm profillerde tutarlı",
      "Model bazlı ölçek: pazaryeri açıksa ek servisler devreye",
      "Shared hosting'de sınırlı model seti (statik bayrak)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: iş modeli bayrağı değişti → bağlı yetenekleri etkinleştir/pasifleştir + uyumluluk kontrolü (idempotent, zincir ≤6)",
      "Olay: çelişen bayrak kombinasyonu → değişikliği reddet + uyarı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI uygun iş modeli/bayrak önerir; capability bayrağını kendisi açıp kapatamaz",
    ],
    testing: [
      "Bayrak kombinasyonu conformance testi (çelişen model reddi)",
      "Model geçiş (B2C→pazaryeri) kullanıcı yolculuğu; en çok 6 tur",
      "Kapalı yeteneğin erişilemezliği testi",
    ],
    owasp: [
      "A05 Misconfiguration: model bayrakları denetlenir, güvenli varsayılan",
      "A01 Access Control: model yükseltme yetkisi sınırlı",
      "A08 Integrity: bayrak değişimi sürümlü ve izli",
    ],
    integration: [
      "E-commerce-models, Commerce stack ve ilgili dikey app'lere bayrak sözleşmesi sağlar",
      "Dropshipping/abonelik/sosyal ticaret bu bayraklarla açılır",
      "Bayrak değişimi kontrol düzlemi panellerinden yönetilir",
    ],
    moduleUsage: [
      "E-commerce-models module'ü Çekirdek Operasyon'da iş modeli esnekliğini sağlar",
      "Tüm ticaret app'leri yeteneklerini bu bayrak mimarisinden açar",
    ],
  },

  "s-dropshipping": {
    featureDefs: [
      "Stoksuz satış (dropshipping) capability'si: tedarikçi kataloğu, sipariş yönlendirme, kâr marjı",
      "Sipariş tedarikçiye otomatik iletilir; stok satıcıda tutulmaz",
      "Tedarikçi stok/fiyat senkronu ve teslim takibi",
    ],
    security: [
      "Tedarikçi entegrasyon anahtarı kasada; sipariş verisi tenant_id RLS",
      "Marj/fiyat bilgisi maskeli; tedarikçi maliyeti müşteriye sızmaz",
      "Sipariş yönlendirme imzalı; sahte yönlendirme engellenir",
    ],
    codeOptimization: [
      "Tedarikçi senkronu olay-temelli; fiyat/stok değişimi artımlı yansır",
      "Sipariş yönlendirme idempotent kuyruk; tekrar gönderimde çift sipariş yok",
      "Katalog eşleme tablosu indeksli",
    ],
    securityOptimization: [
      "Tedarikçi API hatası geri-çekilmeli (retry/backoff); sonsuz döngü yok",
      "Marj kuralı sürümlü; negatif marj satış reddi",
      "Tedarikçi değişimi onaylı; tek tedarikçiye kilitlenme izlenir",
    ],
    performance: [
      "Stok/fiyat senkronu toplu+zamanlanmış; çevrimiçi sipariş etkilenmez",
      "Tedarikçi yanıt gecikmesi asenkron; müşteri akışı bloklanmaz",
      "Katalog eşleme önbellekli",
    ],
    mobileApps: [
      "Mobilde tedarikçi sipariş durumu izleme",
      "iOS/Android push ile teslim/gecikme bildirimi",
      "Dar ekranda marj/sipariş özet kartı",
    ],
    wcag: [
      "Tedarikçi/sipariş tabloları klavye+okuyucu erişimli",
      "Senkron durumu (güncel/gecikmiş) renk dışında metinle; kontrast 7:1",
      "Hata (tedarikçi stok yok) alanla ilişkili ve sesli",
    ],
    deployment: [
      "Tedarikçi entegrasyonu ayrı worker; oran-sınırına uyumlu",
      "Sipariş yönlendirme outbox ile garantili teslim",
      "Shared hosting'de tek-tedarikçi basit dropshipping",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sipariş alındı → tedarikçiye yönlendir + teslim takibi başlat (idempotent, zincir ≤6)",
      "Olay: tedarikçi stoğu bitti → ürünü pasifleştir + alternatif öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tedarikçi/fiyat/marj önerisi üretir; siparişi tedarikçiye kendisi yönlendiremez",
    ],
    testing: [
      "Sipariş→tedarikçi yönlendirme idempotency testi",
      "Stok/fiyat senkron tutarlılık testi",
      "Teslim takibi kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: tedarikçi maliyet/marj gizliliği",
      "A10 SSRF: tedarikçi API çağrıları allowlist'li ve doğrulanır",
      "A09 Logging: yönlendirme ve marj kararları iz",
    ],
    integration: [
      "Dropshipping, Commerce (sipariş) ve tedarikçi entegrasyon (ipaas) ile çalışır",
      "Stok satıcıda tutulmadığından Inventory yerine tedarikçi senkronu",
      "E-commerce-models bayrağıyla etkinleşir",
    ],
    moduleUsage: [
      "Dropshipping bir capability (orta taş); Commerce stack içinde stoksuz satışı açar",
      "Pazaryeri ve perakende app'leri bu yeteneği bayrakla kullanır",
    ],
  },

  "s-payment-methods": {
    featureDefs: [
      "Yerel ödeme yöntemleri: SEPA, iDEAL, Pix, UPI, BKM Taksit gibi bölgesel yöntemler tek soyutlamada",
      "Yöntem seçimi ülke/para birimi/tutara göre dinamik sunulur",
      "Taksit, anlık ve hesap-tabanlı ödeme akışları desteklenir",
    ],
    security: [
      "Ödeme verisi PCI kapsamı dışında; sağlayıcı token'ı ve idempotency",
      "Yöntem yapılandırması tenant bazlı; sağlayıcı anahtarı kasada",
      "İade/iptal yetki+iz; çift tahsilat idempotency ile önlenir",
    ],
    codeOptimization: [
      "Her yöntem ortak ödeme arayüzünü uygular (adaptör deseni)",
      "Yöntem seçimi kural tablosundan; kod içine gömülü ülke listesi yok",
      "Webhook işleme idempotent ve imza-doğrulamalı",
    ],
    securityOptimization: [
      "Sağlayıcı webhook imzası doğrulanır; sahte bildirim reddi",
      "Yöntem etkinleştirme onaylı; riskli yöntem varsayılan kapalı",
      "Tutar/para birimi sınırı yöntem bazında allowlist",
    ],
    performance: [
      "Ödeme başlatma düşük gecikme; sağlayıcı çağrısı zaman-aşımı korumalı",
      "Webhook kuyruğu ile asenkron mutabakat",
      "Yöntem listesi önbellekli (ülke/tutar bazlı)",
    ],
    mobileApps: [
      "Mobilde yerel cüzdan/banka uygulaması derin-bağ ile ödeme",
      "iOS/Android'de yöntem ikonları ve taksit seçimi net",
      "Ödeme dönüşü (return URL) mobilde sorunsuz",
    ],
    wcag: [
      "Ödeme yöntemi seçimi klavye+okuyucu erişimli ve adlandırılmış",
      "Taksit/tutar bilgisi metinle; yalnız ikon değil; kontrast 7:1",
      "Ödeme hatası açık, eyleme dönük ve sesli bildirilir",
    ],
    deployment: [
      "Ödeme adaptörleri eklenti olarak; yeni yöntem dağıtımı izole",
      "Webhook alıcısı ayrı ölçeklenir (Kubernetes)",
      "Shared hosting'de sınırlı yöntem + barındırılan ödeme sayfası",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ödeme webhook'u doğrulandı → siparişi öde + makbuz (idempotent, imza-doğrulamalı, zincir ≤6)",
      "Olay: ödeme zaman-aşımı → beklemeye al + yeniden deneme önerisi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tutar/ülkeye uygun yöntem önerir; ödeme yöntemini kendisi etkinleştiremez",
    ],
    testing: [
      "Webhook imza doğrulama + idempotency testi (çift tahsilat yok)",
      "Yöntem seçim kuralı (ülke/tutar) testi",
      "Ödeme→dönüş→mutabakat kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A02 Cryptographic Failures: ödeme token'la, imza doğrulanır",
      "A08 Integrity: webhook imzası ile bütünlük",
      "A09 Logging: ödeme/iade kararları forensic iz",
    ],
    integration: [
      "Payment-methods, Commerce/POS (tahsilat) ve Finance (mutabakat) ile entegre",
      "Fraud/Trust ile yüksek-risk ödeme kontrolü",
      "Sağlayıcılar ipaas/adaptör katmanından",
    ],
    moduleUsage: [
      "Payment-methods (orta taş) Çekirdek Operasyon'da bölgesel ödeme yeteneğini sağlar",
      "E-ticaret, abonelik ve POS app'leri bu ödeme soyutlamasını tüketir",
    ],
  },

  "s-pmo": {
    featureDefs: [
      "Proje Portföy & PMO ArcheType'ı: proje, program, portföy hiyerarşisi ve kaynak/bütçe yönetimi",
      "Aşama-kapı (stage-gate), risk ve fayda takibi",
      "Portföy önceliklendirme ve kapasite planlama",
    ],
    security: [
      "Portföy/bütçe verisi rol bazlı; gizli proje görünürlüğü kısıtlı (tenant_id RLS)",
      "Bütçe/onay değişikliği eşik+iz; kapı geçişi yetkiye bağlı",
      "Kaynak atama kişisel veri minimizasyonuyla",
    ],
    codeOptimization: [
      "Portföy rollup'ı (proje→program→portföy) artımlı hesap",
      "Kapı durum makinesi; her geçiş tek sorumluluk",
      "Kapasite hesabı saf; atama değişiminde yeniden değerlendirme",
    ],
    securityOptimization: [
      "Kapı atlama (gate skip) yalnız yetkili+gerekçeli; sessiz atlama engellenir",
      "Bütçe değişikliği sürümlü; geçmiş tahmin korunur",
      "Önceliklendirme kriteri şeffaf ve denetlenebilir",
    ],
    performance: [
      "Portföy panosu özet okuma-modelinden; büyük portföyde hızlı",
      "Kaynak çakışma analizi indeksli sorgu",
      "Gantt/zaman çizelgesi tembel render",
    ],
    mobileApps: [
      "Mobilde portföy sağlık özeti ve kapı onayları",
      "iOS/Android push ile risk/gecikme uyarısı",
      "Dar ekranda proje kartı + durum",
    ],
    wcag: [
      "Portföy tabloları klavye+okuyucu erişimli ve sıralanabilir",
      "Proje sağlığı (kırmızı/sarı/yeşil) renk dışında metin+ikonla; kontrast 7:1",
      "Kapı onayı açık ve geri-alınamaz uyarılı",
    ],
    deployment: [
      "PMO servisi standart yatay ölçek; rapor üretimi ayrı worker",
      "Portföy olayları outbox ile bağlı sistemlere",
      "Shared hosting'de tek-portföy temel PMO",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kapı kriteri sağlanmadı → geçişi blokla + sorumluya bildir (idempotent, zincir ≤6)",
      "Olay: bütçe aşımı → portföy yöneticisine yükselt (step-up) (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI risk/öncelik analizi ve kaynak önerisi üretir; kapı geçişini veya bütçeyi kendisi onaylayamaz",
    ],
    testing: [
      "Portföy rollup doğruluk testi (proje→portföy)",
      "Stage-gate geçiş kuralı testi (kriter sağlanmadan geçilemez)",
      "Bütçe/kaynak kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: portföy/bütçe görünürlüğü rol bazlı",
      "A04 Insecure Design: gate-skip tasarımca kısıtlı",
      "A09 Logging: kapı/bütçe kararları iz",
    ],
    integration: [
      "PMO, HR (kaynak), Finance (bütçe) ve görev/iş yönetimi ile entegre",
      "Proje görevleri WBS/granülerlik sözleşmesiyle hizalı",
      "Risk verisi kurumsal risk defterine yansır",
    ],
    moduleUsage: [
      "PMO ArcheType'ı Çekirdek Operasyon'da proje/portföy yönetimini sağlar",
      "Profesyonel hizmet ve inşaat app'leri PMO sözleşmesini tüketir",
    ],
  },

  "s-social-commerce": {
    featureDefs: [
      "Sosyal ticaret capability'si: sosyal medya kanallarında (Instagram/TikTok vb.) satış ve katalog senkronu",
      "Kanal sipariş toplama, mesaj/yorumdan satış ve influencer takibi",
      "Tek katalog, çoklu sosyal kanal yayını",
    ],
    security: [
      "Kanal erişim token'ı kasada; sipariş verisi tenant_id RLS",
      "Sosyal mesajdan toplanan PII minimal ve izinli işlenir",
      "Kanal webhook'u imza-doğrulamalı",
    ],
    codeOptimization: [
      "Kanal adaptörleri ortak arayüzle; yeni kanal eklemek izole",
      "Katalog→kanal senkronu olay-temelli artımlı",
      "Sipariş toplama idempotent kuyruk",
    ],
    securityOptimization: [
      "Token yenileme otomatik+güvenli; süresi dolan token sessizce başarısız olmaz",
      "Kanal oran-sınırına uyum; engellenme (ban) riski izlenir",
      "Yorum/mesaj içeriği güvenli işlenir (enjeksiyon temizliği)",
    ],
    performance: [
      "Kanal senkronu toplu+zamanlanmış; oran-sınırına saygılı",
      "Sipariş webhook'ları asenkron işlenir",
      "Katalog yayını fark-temelli (yalnız değişen ürün)",
    ],
    mobileApps: [
      "Mobilde sosyal sipariş kuyruğu ve hızlı yanıt",
      "iOS/Android push ile yeni sosyal sipariş bildirimi",
      "Dar ekranda kanal bazlı satış özeti",
    ],
    wcag: [
      "Kanal yönetim ekranı klavye+okuyucu erişimli",
      "Kanal durumu (bağlı/kopuk) renk dışında metinle; kontrast 7:1",
      "Mesaj/sipariş listesi okuyucuya yapılandırılmış",
    ],
    deployment: [
      "Kanal entegrasyonu ayrı worker; her kanal kendi oran-sınırında",
      "Webhook alıcısı ölçeklenir; outbox ile sipariş garantisi",
      "Shared hosting'de sınırlı kanal + manuel senkron",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sosyal kanaldan sipariş geldi → merkezi sipariş havuzuna ekle + stok düş (idempotent, zincir ≤6)",
      "Olay: kanal token'ı süresi doldu → yenile + başarısızsa yöneticiye bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sosyal yorum/mesajdan satış niyeti tespit eder ve yanıt önerir; siparişi kendisi oluşturamaz",
    ],
    testing: [
      "Kanal sipariş toplama idempotency testi (çift sipariş yok)",
      "Token yenileme ve oran-sınır davranışı testi",
      "Sosyal sipariş→merkezi havuz kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A02 Cryptographic Failures: kanal token'ı güvenli saklanır/yenilenir",
      "A10 SSRF: kanal API çağrıları allowlist'li",
      "A03 Injection: yorum/mesaj içeriği güvenli işlenir",
    ],
    integration: [
      "Social-commerce, Commerce (sipariş havuzu) ve Inventory (stok) ile entegre",
      "Sosyal kanallar ipaas/adaptör katmanından",
      "Lead/etkileşim CRM'e yansır",
    ],
    moduleUsage: [
      "Social-commerce (orta taş) Çekirdek Operasyon'da sosyal kanal satışını açar",
      "E-ticaret ve pazarlama app'leri bu yeteneği bayrakla kullanır",
    ],
  },

  "s-subscription-commerce": {
    featureDefs: [
      "Abonelik tabanlı e-ticaret capability'si: plan, döngü (aylık/yıllık), yenileme ve fatura döngüsü",
      "Deneme süresi, yükseltme/düşürme (proration) ve duraklatma",
      "Churn/yenileme takibi ve abonelik yaşam döngüsü",
    ],
    security: [
      "Abonelik ve ödeme yetkilendirmesi token'la; veri tenant_id RLS",
      "Plan/fiyat değişikliği mevcut aboneleri korur (grandfathering)",
      "İptal/iade yetki+iz; istem dışı yenileme engellenir",
    ],
    codeOptimization: [
      "Yenileme döngüsü zamanlanmış iş; proration saf hesap",
      "Abonelik durumu (deneme/aktif/duraklı/iptal) durum makinesi",
      "Fatura üretimi idempotent; çift fatura önlenir",
    ],
    securityOptimization: [
      "Plan değişimi sürümlü; geçmiş fiyat sözleşmesi korunur",
      "Başarısız ödeme için dunning (yeniden deneme) sınırlı ve izli",
      "İptal akışı net onaylı; karanlık desen (dark pattern) yok",
    ],
    performance: [
      "Toplu yenileme parçalı/asenkron; pik fatura gününde kuyruk",
      "Abonelik panosu özet okuma-modelinden",
      "Proration hesabı anlık ve önbelleklenebilir",
    ],
    mobileApps: [
      "Mobilde abonelik yönetimi (yükselt/duraklat/iptal) self-servis",
      "iOS/Android push ile yenileme/ödeme hatırlatma",
      "App store abonelik köprüsü (gerekirse)",
    ],
    wcag: [
      "Plan seçimi ve iptal akışı klavye+okuyucu erişimli",
      "Fiyat/döngü bilgisi metinle açık; kontrast 7:1",
      "İptal kolay bulunur ve erişilebilir (karanlık desen yok)",
    ],
    deployment: [
      "Yenileme/dunning ayrı worker/CronJob; çevrimiçi yolu etkilemez",
      "Fatura olayları outbox ile Finance'a",
      "Shared hosting'de temel abonelik + zamanlanmış yenileme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yenileme tarihi geldi → ödeme al + fatura kes; başarısızsa dunning başlat (idempotent, zincir ≤6)",
      "Olay: deneme bitti → ücretli plana geçir veya pasifleştir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI churn riski tahmin eder ve elde tutma önerir; aboneliği kendisi iptal/yenileyemez",
    ],
    testing: [
      "Proration ve yenileme hesabı sınır-değer testleri",
      "Dunning (başarısız ödeme yeniden deneme) akış testi",
      "Abonelik yaşam döngüsü kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: istem dışı yenileme/karanlık desen engellenir",
      "A02 Cryptographic Failures: ödeme yetkisi token'la",
      "A09 Logging: plan/iptal/yenileme kararları iz",
    ],
    integration: [
      "Subscription-commerce, Payment (yinelenen tahsilat) ve Finance (gelir tanıma) ile entegre",
      "Abone CRM müşteri kaydıyla ilişkili",
      "Plan/fiyat Commerce katalogundan",
    ],
    moduleUsage: [
      "Subscription-commerce (orta taş) Çekirdek Operasyon'da abonelik satışını açar",
      "SaaS, içerik ve kutu-abonelik app'leri bu yaşam döngüsü sözleşmesini tüketir",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);

let stamped = 0;
for (const id of HUMAN) {
  const n = load(id);
  for (const k of Object.keys(n.dimensions || {})) if (n.dimensions[k]) n.dimensions[k].provenance = "human";
  save(id, n);
  stamped++;
}

let applied = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  const n = load(id);
  for (const [k, items] of Object.entries(dims)) {
    if (!n.dimensions?.[k]) continue;
    n.dimensions[k].items = items;
    n.dimensions[k].status = "filled";
    n.dimensions[k].provenance = "swarm";
  }
  save(id, n);
  applied++;
}

console.log(`[seed-core-operations] ${applied}/14 şablon düğüm derinleştirildi (swarm); ${stamped} CRM/app human damgalandı.`);
