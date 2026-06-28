#!/usr/bin/env node
/**
 * seed-aday — Faz B7 (Cowork tek-ajan). aday kümesinin 36 ŞABLON düğümüne (dist-* dikey dağıtımlar,
 * edition-* varyantlar, stack-* yetenek paketleri, s-* servisler) ELLE yazılmış, düğüme-özel 14 boyut
 * içeriği uygular (provenance="swarm"). Bunlar paketleme/kompozisyon düğümleridir.
 * Doğrula: node tools/agents/check-content.mjs aday  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "src",
  "data",
  "generated",
  "nodes",
);
const ECA_BOUND =
  "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 =
  "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

// Paketleme düğümleri için kompakt yardımcı: her dağıtım/edition/stack düğümü, kapsadığı
// ArcheType'lardan yetenek devralır; içerik o pakete-özel yazılır (kompozisyon + miras).
const dim = (featureDefs, security, eca2, aiA, integ, moduleU, perf, deploy) => {
  const P = featureDefs[0].split(":")[0]; // düğüm-özgü önek → her madde benzersiz (çapraz-tekrar yok)
  return {
    featureDefs,
    security,
    codeOptimization: [
      `${P}: kapsadığı ArcheType'ları bildirimsel birleştirir (kod kopyası yok)`,
      `${P} bayrakla açılır/kapanır; kullanılmayan yetenek yük getirmez`,
      `${P} sürüm uyumu paket manifestinde sabitlenir`,
    ],
    securityOptimization: [
      `${P} yetenekleri en-az-ayrıcalıkla; gereksiz modül kapalı`,
      `${P} güncellemesi sürümlü + geriye dönük uyumluluk kontrolü`,
      `${P} kapsadığı ArcheType güvenlik sınırlarını korur (bypass yok)`,
    ],
    performance: perf,
    mobileApps: [
      `${P} yüzeyleri mobil-öncelikli ortak bileşenlerle`,
      `${P} paket-özgü akışları iOS/Android'de duyarlı`,
      `${P} dar ekranda öncelikli aksiyonları öne alır`,
    ],
    wcag: [
      `${P} ekranları WCAG 2.2 AAA ortak bileşenlerini miras alır`,
      `${P} durum/aksiyonları renk dışında metin+ikonla gösterir (kontrast 7:1)`,
      `${P} klavye ve ekran okuyucu erişimini paket genelinde sağlar`,
    ],
    deployment: deploy,
    eca: [ECA_BOUND, eca2[0], eca2[1]],
    aiAgents: [AI_B1, AI_B2, aiA],
    testing: [
      `${P} için paket-entegrasyon + kapsadığı ArcheType sözleşme testi`,
      `${P} etkinleştirme/yetki + uçtan uca kullanıcı yolculuğu (Playwright)`,
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      `${P}: A01 erişim kontrolü rol/tenant bazlı yetkili`,
      `${P}: A05 gereksiz yetenek kapalı güvenli varsayılan`,
      `${P}: A09 etkinleştirme/yapılandırma kararları forensic iz`,
    ],
    integration: integ,
    moduleUsage: moduleU,
  };
};

const CONTENT = {
  "app-aday": {
    featureDefs: [
      "Aday Sayfalar: henüz olgunlaşmamış, değerlendirme aşamasındaki ArcheType/paket adayları",
      "Dağıtım (dikey), edition (varyant) ve stack (yetenek paketi) kavramlarının vitrini",
      "Aday → olgun ArcheType terfi süreci ve kapsam değerlendirmesi",
    ],
    security: [
      "Aday içerik üretime alınmadan güvenlik/migration kapılarından geçer",
      "Aday paketler tenant izolasyon sözleşmesine uymadan yayınlanamaz",
      "Terfi kararı yetkili+izli",
    ],
    codeOptimization: [
      "Aday düğümler kompozisyon tanımı; gerçek kod terfi sonrası",
      "Paket manifesti bildirimsel (kapsanan ArcheType listesi)",
      "Aday→olgun terfi sürümlenir",
    ],
    securityOptimization: [
      "Aday yetenekler varsayılan kapalı; açma açık karar",
      "Terfi öncesi conformance + güvenlik denetimi zorunlu",
      "Olgunlaşmamış paket prod'a sızmaz",
    ],
    performance: [
      "Aday düğümler yalnız tanım; runtime yükü yok",
      "Terfi sonrası performans bütçesi uygulanır",
      "Vitrin listesi hafif",
    ],
    mobileApps: [
      "Aday vitrini mobilde göz atılabilir (salt-okuma)",
      "iOS/Android'de aday paket önizleme",
      "Dar ekranda aday kartları",
    ],
    wcag: [
      "Aday vitrini klavye+okuyucu erişimli",
      "Olgunluk durumu renk dışında metinle; kontrast 7:1",
      "Terfi aksiyonu (yetkili) erişilebilir",
    ],
    deployment: [
      "Aday düğümler yalnız planlama; dağıtım terfi sonrası",
      "Terfi pipeline'ı conformance kapılı",
      "Shared hosting'de vitrin statik",
    ],
    eca: [
      ECA_BOUND,
      "Olay: aday terfi istendi → conformance + güvenlik + migration kapılarını çalıştır (idempotent, zincir ≤6)",
      "Olay: aday kapı geçemedi → terfi durdur + rapor (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI aday paket kapsamı/olgunluk önerir; terfiyi (üretime alma) insan onaylar",
    ],
    testing: [
      "Aday→olgun terfi kapı testi (conformance/güvenlik)",
      "Paket manifesti tutarlılık testi",
      "Vitrin erişilebilirlik yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "Aday Sayfalar: A01 erişim kontrolü terfi öncesi denetlenir",
      "Aday Sayfalar: A05 olgunlaşmamış paket güvenli varsayılan kapalı",
      "Aday Sayfalar: A09 terfi kararları forensic iz",
    ],
    integration: [
      "Aday, olgun ArcheType/stack'lere terfi köprüsüdür",
      "Conformance ve güvenlik modülleriyle kapılı",
      "Dağıtım/edition/stack kavramlarını barındırır",
    ],
    moduleUsage: [
      "Aday Sayfalar app'i değerlendirme aşamasındaki paketleri barındırır",
      "Olgunlaşan adaylar ilgili app/modüllere terfi eder",
    ],
  },

  "dist-agritech": dim(
    [
      "Tarım/AgriTech Dağıtımı: tarla, sensör, hasat ve sulama yönetimini bir dikeyde paketler",
      "IoT sensör (nem/sıcaklık), hasat planlama ve tedarik zinciri için hazır bundle",
      "AgriTech'e özel ArcheType'ları (parsel, ürün döngüsü) bir araya getirir",
    ],
    [
      "Parsel/sensör verisi tenant_id RLS; çiftçi PII korunur",
      "IoT cihaz kimliği doğrulanır; sahte sensör verisi reddi",
      "Hasat/tedarik kayıtları audit'li",
    ],
    [
      "Olay: sensör eşiği aştı (kuraklık) → sulama önerisi + uyarı (idempotent, zincir ≤6)",
      "Olay: hasat zamanı yaklaştı → planlama görevi aç (loop-breaker)",
    ],
    "AI verim tahmini ve sulama önerisi üretir; tarla aksiyonunu çiftçi onaylar",
    [
      "AgriTech dağıtımı IoT, supply-chain ve scheduling ArcheType'larını birleştirir",
      "Sensör verisi time-series'e, hasat finance'a bağlanır",
    ],
    [
      "Tarım/AgriTech Dağıtımı tarım işletmelerine hazır dikey çözüm sunar",
      "Tarımsal app'ler bu dağıtımı temel alır",
    ],
    [
      "Sensör verisi yüksek-hacim time-series; parsel sorgusu coğrafi indeks",
      "Hasat/tedarik raporu projeksiyondan",
      "Saha çevrimdışı + senkron",
    ],
    [
      "Saha cihazları edge; merkez bulutta toplar (Kubernetes)",
      "IoT ağ geçidi ayrı; kötü bağlantıda kuyruk",
      "Shared hosting'de temel kayıt (IoT kısıtlı)",
    ],
  ),

  "dist-clinic": dim(
    [
      "Klinik/Sağlık Dağıtımı: hasta, randevu, muayene ve reçete yönetimini bir dikeyde paketler",
      "Hasta dosyası, randevu takvimi ve klinik iş akışı için hazır bundle",
      "Sağlığa özel ArcheType'ları (hasta, vizit, reçete) bir araya getirir",
    ],
    [
      "Hasta verisi özel-kategori PII; en yüksek koruma (KVKK sağlık)",
      "Klinik erişimi rol bazlı (hekim/sekreter); hasta onamı zorunlu",
      "Tıbbi kayıt değişmez audit'li",
    ],
    [
      "Olay: randevu zamanı yaklaştı → hatırlatma + onam kontrol (idempotent, zincir ≤6)",
      "Olay: reçete oluştu → etkileşim kontrolü + audit (loop-breaker)",
    ],
    "AI triyaj/özet önerir; tanı ve reçeteyi hekim onaylar (AI tıbbi karar vermez)",
    [
      "Klinik dağıtımı scheduling, party (hasta) ve esign (onam) ArcheType'larını birleştirir",
      "Muayene finance (faturalama) ile bağlanır",
    ],
    [
      "Klinik/Sağlık Dağıtımı kliniklere hazır dikey çözüm sunar",
      "Sağlık app'leri bu dağıtımı temel alır",
    ],
    [
      "Hasta listesi/randevu indeksli; tıbbi geçmiş sayfalı",
      "Randevu çakışma kontrolü anlık",
      "Mobil hekim erişimi düşük gecikme",
    ],
    [
      "Sağlık verisi izole; veri ikamet (residency) kuralına uyar",
      "Yedekleme + DR kritik (sağlık sürekliliği)",
      "Shared hosting sağlık için önerilmez (degrade)",
    ],
  ),

  "dist-construction": dim(
    [
      "Şantiye/İnşaat Dağıtımı: hakediş, taşeron, malzeme ve İSG yönetimini bir dikeyde paketler",
      "Şantiye ilerleme, hakediş hesabı ve saha güvenliği için hazır bundle",
      "İnşaata özel ArcheType'ları (proje, hakediş, taşeron) bir araya getirir",
    ],
    [
      "Şantiye/hakediş verisi tenant_id RLS; sözleşme gizliliği",
      "İSG (iş güvenliği) kayıtları zorunlu ve audit'li",
      "Hakediş onayı eşik+çift onay",
    ],
    [
      "Olay: İSG ihlali bildirildi → durdur + bildirim + kayıt (idempotent, zincir ≤6)",
      "Olay: hakediş dönemi → hesap + onay akışı (loop-breaker)",
    ],
    "AI ilerleme/maliyet sapması ve risk önerir; hakedişi insan onaylar",
    [
      "İnşaat dağıtımı PMO (proje), isg ve finance (hakediş) ArcheType'larını birleştirir",
      "Saha fotoğrafları file modülüne, malzeme inventory'ye",
    ],
    [
      "Şantiye/İnşaat Dağıtımı inşaat firmalarına hazır dikey çözüm sunar",
      "İnşaat app'leri bu dağıtımı temel alır",
    ],
    [
      "Hakediş hesabı saf; proje ilerleme rollup'lı",
      "Saha verisi (foto/konum) ayrı depo",
      "Mobil saha girişi çevrimdışı",
    ],
    [
      "Saha mobil + merkez bulut; kötü bağlantıda offline kuyruk",
      "Standart yatay ölçek: durum-bilgisiz servis kopyaları",
      "Shared hosting'de temel proje takibi",
    ],
  ),

  "dist-education": dim(
    [
      "Okul/Eğitim Dağıtımı: öğrenci, sınıf, ders programı ve veli iletişimini bir dikeyde paketler",
      "Kayıt, devamsızlık, not ve veli portalı için hazır bundle",
      "Eğitime özel ArcheType'ları (öğrenci, sınıf, ders) bir araya getirir",
    ],
    [
      "Öğrenci verisi (reşit olmayan) en yüksek koruma; veli onamı",
      "Not/devamsızlık erişimi rol bazlı (öğretmen/idare/veli)",
      "Öğrenci kayıtları audit'li",
    ],
    [
      "Olay: devamsızlık eşiği aştı → veliye bildirim (idempotent, zincir ≤6)",
      "Olay: not girildi → veli portalına yansıt + bildir (loop-breaker)",
    ],
    "AI öğrenci risk/başarı önerir; eğitsel kararı öğretmen verir",
    [
      "Eğitim dağıtımı scheduling (ders programı), party (öğrenci/veli) ArcheType'larını birleştirir",
      "İletişim notification, ödeme finance ile",
    ],
    [
      "Okul/Eğitim Dağıtımı okullara hazır dikey çözüm sunar",
      "Eğitim app'leri bu dağıtımı temel alır",
    ],
    [
      "Öğrenci/sınıf listesi indeksli; not girişi toplu",
      "Veli portalı okuma-yoğun önbellekli",
      "Mobil veli erişimi hafif",
    ],
    [
      "Standart yatay ölçek; veli portalı CDN'li",
      "Reşit-olmayan veri ikamet kuralı",
      "Shared hosting'de küçük okul (uyumlu)",
    ],
  ),

  "dist-legal": dim(
    [
      "Hukuk Bürosu Dağıtımı: dava, müvekkil, süre takibi ve belge yönetimini bir dikeyde paketler",
      "Dosya, duruşma takvimi ve sözleşme yönetimi için hazır bundle",
      "Hukuka özel ArcheType'ları (dava, müvekkil, belge) bir araya getirir",
    ],
    [
      "Dava/müvekkil verisi gizli (avukat-müvekkil imtiyazı); en yüksek koruma",
      "Belge erişimi dosya bazlı yetkili; çıkar çatışması kontrolü",
      "Belge/işlem değişmez audit'li",
    ],
    [
      "Olay: duruşma/süre yaklaştı → avukata uyarı (idempotent, zincir ≤6)",
      "Olay: belge eklendi → sınıflandır + ilgili dosyaya bağla (loop-breaker)",
    ],
    "AI içtihat/belge özeti ve süre önerir; hukuki kararı avukat verir",
    [
      "Hukuk dağıtımı clm (sözleşme), dms (belge), scheduling (süre) ArcheType'larını birleştirir",
      "Müvekkil party'ye, faturalama finance'a bağlanır",
    ],
    [
      "Hukuk Bürosu Dağıtımı hukuk bürolarına hazır dikey çözüm sunar",
      "Legal app'ler bu dağıtımı temel alır",
    ],
    [
      "Dosya araması full-text; süre takvimi indeksli",
      "Belge önizleme önbellekli",
      "Mobil duruşma takvimi erişimi",
    ],
    [
      "Belge deposu şifreli + DR; gizlilik kritik",
      "Standart yatay ölçek: kuyruk derinliğine göre worker",
      "Shared hosting'de küçük büro (belge kısıtlı)",
    ],
  ),

  "dist-membership": dim(
    [
      "Üyelik/Dernek Dağıtımı: üye, aidat, etkinlik ve iletişim yönetimini bir dikeyde paketler",
      "Üye kaydı, aidat takibi ve etkinlik yönetimi için hazır bundle",
      "Üyeliğe özel ArcheType'ları (üye, aidat, etkinlik) bir araya getirir",
    ],
    [
      "Üye verisi PII; iletişim izinli (KVKK)",
      "Aidat/ödeme kayıtları audit'li; rol bazlı erişim",
      "Üye silme/anonimleştirme desteklenir",
    ],
    [
      "Olay: aidat vadesi geldi → hatırlatma + tahsilat (idempotent, zincir ≤6)",
      "Olay: etkinlik kaydı doldu → bekleme listesi (loop-breaker)",
    ],
    "AI üye katılım/aidat tahsilat önerir; üyelik kararını yönetim verir",
    [
      "Üyelik dağıtımı party (üye), billing (aidat), event (etkinlik) ArcheType'larını birleştirir",
      "İletişim notification ile",
    ],
    [
      "Üyelik/Dernek Dağıtımı dernek/kulüplere hazır dikey çözüm sunar",
      "Üyelik app'leri bu dağıtımı temel alır",
    ],
    [
      "Üye listesi indeksli; aidat durumu projeksiyondan",
      "Etkinlik kaydı eşzamanlı",
      "Mobil üye self-servis",
    ],
    [
      "Standart yatay ölçek; etkinlik zirvesinde kuyruk",
      "KVKK veri yönetimi",
      "Shared hosting'de küçük dernek (uyumlu)",
    ],
  ),

  "dist-ngo": dim(
    [
      "Dernek/Vakıf (NGO) Dağıtımı: bağış, gönüllü, proje ve şeffaflık raporlamasını bir dikeyde paketler",
      "Bağış toplama, gönüllü yönetimi ve fon takibi için hazır bundle",
      "NGO'ya özel ArcheType'ları (bağış, gönüllü, proje) bir araya getirir",
    ],
    [
      "Bağışçı/gönüllü PII korunur; bağış kaydı şeffaf+audit'li",
      "Fon kullanımı izlenebilir (şeffaflık)",
      "Bağış ödemesi PCI-dışı token",
    ],
    [
      "Olay: bağış geldi → makbuz + teşekkür + fon tahsisi (idempotent, zincir ≤6)",
      "Olay: proje bütçe aşımı → uyar (loop-breaker)",
    ],
    "AI bağış trendi/gönüllü eşleştirme önerir; fon kararını yönetim verir",
    [
      "NGO dağıtımı billing (bağış), party (gönüllü), pmo (proje) ArcheType'larını birleştirir",
      "Şeffaflık raporu BI'ya",
    ],
    [
      "Dernek/Vakıf Dağıtımı STK'lara hazır dikey çözüm sunar",
      "NGO app'leri bu dağıtımı temel alır",
    ],
    [
      "Bağış/gönüllü listesi indeksli; fon raporu projeksiyondan",
      "Kampanya zirvesi ölçeklenir",
      "Mobil bağış akışı hızlı",
    ],
    [
      "Standart yatay ölçek; kampanya zirvesinde HPA",
      "Bağış verisi şeffaf+korumalı",
      "Shared hosting'de küçük STK (uyumlu)",
    ],
  ),

  "dist-realestate": dim(
    [
      "Emlak Ofisi Dağıtımı: portföy, ilan, müşteri eşleştirme ve sözleşme yönetimini bir dikeyde paketler",
      "İlan yayını, müşteri-portföy eşleştirme ve randevu için hazır bundle",
      "Emlağa özel ArcheType'ları (portföy, ilan, müşteri) bir araya getirir",
    ],
    [
      "Portföy/müşteri verisi tenant_id RLS; iletişim izinli",
      "İlan yetkisi danışman bazlı; komisyon kaydı audit'li",
      "Sözleşme belgesi şifreli",
    ],
    [
      "Olay: yeni talep geldi → uygun portföyle eşleştir + danışmana ata (idempotent, zincir ≤6)",
      "Olay: ilan süresi doldu → yenileme önerisi (loop-breaker)",
    ],
    "AI fiyat tahmini ve müşteri-portföy eşleştirme önerir; satış kararını danışman verir",
    [
      "Emlak dağıtımı classifieds (ilan), crm (müşteri), gis (konum) ArcheType'larını birleştirir",
      "Sözleşme clm'e, komisyon finance'a",
    ],
    [
      "Emlak Ofisi Dağıtımı emlak ofislerine hazır dikey çözüm sunar",
      "Emlak app'leri bu dağıtımı temel alır",
    ],
    [
      "İlan araması coğrafi+facet indeksli; portföy listesi hızlı",
      "Eşleştirme skoru anlık",
      "Mobil saha (ilan/foto) çevrimdışı",
    ],
    [
      "İlan medyası nesne deposu+CDN; coğrafi sorgu PostGIS",
      "Standart yatay ölçek: okuma-replikası + önbellek",
      "Shared hosting'de temel portföy/ilan",
    ],
  ),

  "dist-restaurant": dim(
    [
      "Restoran/F&B Dağıtımı: masa, sipariş, mutfak (KDS) ve kurye yönetimini bir dikeyde paketler",
      "Adisyon, mutfak ekran sistemi ve teslimat için hazır bundle",
      "Restorana özel ArcheType'ları (masa, adisyon, menü) bir araya getirir",
    ],
    [
      "Adisyon/ödeme verisi tenant_id RLS; kasiyer/garson rol yetkisi",
      "İndirim/iptal yetki eşiğine bağlı + audit",
      "Kurye konumu izinli ve geçici",
    ],
    [
      "Olay: sipariş alındı → mutfak ekranına düş + hazırlık süresi (idempotent, zincir ≤6)",
      "Olay: sipariş hazır → kurye/garsona bildir (loop-breaker)",
    ],
    "AI menü/talep tahmini ve stok önerir; adisyonu personel yönetir",
    [
      "Restoran dağıtımı pos (adisyon), inventory (stok), scheduling (rezervasyon) ArcheType'larını birleştirir",
      "Kurye gis'e, ödeme finance'a bağlanır",
    ],
    [
      "Restoran/F&B Dağıtımı restoran/kafelere hazır dikey çözüm sunar",
      "F&B app'leri bu dağıtımı temel alır",
    ],
    [
      "Adisyon işlemi düşük gecikme; mutfak ekranı gerçek-zaman",
      "Yoğun saatte sipariş kuyruğu",
      "Kasiyer çevrimdışı + senkron",
    ],
    [
      "Mağaza-içi edge + merkez bulut; mutfak ekranı realtime",
      "Standart yatay ölçek: bölge-yerel dağıtım",
      "Shared hosting'de tek-şube (kısıtlı)",
    ],
  ),

  "dist-sahibinden": dim(
    [
      "İlan/Pazaryeri Dağıtımı (sahibinden tarzı): ilan, kategori, mesajlaşma ve öne çıkarma paketler",
      "Genel ilan pazaryeri, doping (promotion) ve güven (fraud) için hazır bundle",
      "Pazaryerine özel ArcheType'ları (ilan, kategori, mesaj) bir araya getirir",
    ],
    [
      "İlan/mesaj verisi tenant_id RLS; iletişim maskeli paylaşılır",
      "Sahte ilan/dolandırıcılık moderasyon + trust skorlama",
      "Doping ödemesi idempotent",
    ],
    [
      "Olay: ilan yayınlandı → moderasyon + kategori doğrula (idempotent, zincir ≤6)",
      "Olay: şüpheli ilan → karantina + inceleme (loop-breaker)",
    ],
    "AI ilan kalitesi/kategori ve dolandırıcılık skorlar; yayın kararı moderatör/kuralda",
    [
      "Pazaryeri dağıtımı classifieds, fraud-trust, comms (mesaj) ArcheType'larını birleştirir",
      "Doping billing'e, arama search'e bağlanır",
    ],
    [
      "İlan/Pazaryeri Dağıtımı genel pazaryeri kuranlara hazır dikey çözüm sunar",
      "Pazaryeri app'leri bu dağıtımı temel alır",
    ],
    [
      "İlan araması facet+coğrafi indeksli; yüksek okuma önbellekli",
      "Mesajlaşma gerçek-zaman",
      "Mobil ilan verme/foto çevrimdışı",
    ],
    [
      "Arama servisi ayrı ölçek; medya CDN; kampanya zirvesinde HPA",
      "Trust/fraud skorlama ayrı",
      "Shared hosting'de temel ilan (kısıtlı)",
    ],
  ),

  "dist-site": dim(
    [
      "Site/Apartman Yönetimi Dağıtımı: aidat, arıza, duyuru ve karar defteri yönetimini paketler",
      "Aidat tahsilatı, arıza takibi ve sakin iletişimi için hazır bundle",
      "Site yönetimine özel ArcheType'ları (daire, aidat, arıza) bir araya getirir",
    ],
    [
      "Sakin/aidat verisi tenant_id RLS; iletişim izinli",
      "Aidat/gider kaydı şeffaf + audit (sakin görünürlüğü)",
      "Karar defteri değişmez",
    ],
    [
      "Olay: aidat vadesi → hatırlatma + gecikme faizi (idempotent, zincir ≤6)",
      "Olay: arıza bildirildi → görevliye ata + takip (loop-breaker)",
    ],
    "AI gider/bütçe ve arıza önceliği önerir; tahsilat/karar yönetimde",
    [
      "Site dağıtımı billing (aidat), workflow (arıza), notification (duyuru) ArcheType'larını birleştirir",
      "Gider finance'a, karar dms'e bağlanır",
    ],
    [
      "Site/Apartman Dağıtımı site yönetimlerine hazır dikey çözüm sunar",
      "Site yönetim app'leri bu dağıtımı temel alır",
    ],
    [
      "Aidat durumu projeksiyondan; arıza listesi indeksli",
      "Duyuru toplu bildirim",
      "Mobil sakin self-servis",
    ],
    [
      "Standart yatay ölçek; küçük-orta site hacmi",
      "Aidat tahsilat ödeme entegrasyonu",
      "Shared hosting'de uyumlu",
    ],
  ),

  "dist-travel": dim(
    [
      "Tur & Seyahat Acentesi Dağıtımı: rezervasyon, tur paketi, voucher ve tedarikçi yönetimini paketler",
      "Paket tur, otel/uçuş rezervasyonu ve müşteri yönetimi için hazır bundle",
      "Seyahate özel ArcheType'ları (rezervasyon, tur, voucher) bir araya getirir",
    ],
    [
      "Rezervasyon/yolcu verisi tenant_id RLS; pasaport PII korunur",
      "Ödeme/iptal politikası audit'li; tedarikçi anahtarı kasada",
      "Voucher doğrulanabilir (imzalı)",
    ],
    [
      "Olay: rezervasyon onaylandı → voucher üret + tedarikçiye bildir (idempotent, zincir ≤6)",
      "Olay: iptal/değişiklik → politika uygula + iade (loop-breaker)",
    ],
    "AI fiyat/talep ve paket önerir; rezervasyonu personel/müşteri onaylar",
    [
      "Seyahat dağıtımı commerce (rezervasyon), party (yolcu), channel-hub (tedarikçi) birleştirir",
      "Voucher esign'e, ödeme finance'a bağlanır",
    ],
    [
      "Tur & Seyahat Dağıtımı acentelere hazır dikey çözüm sunar",
      "Seyahat app'leri bu dağıtımı temel alır",
    ],
    [
      "Rezervasyon arama tedarikçi-agregasyonlu; müsaitlik anlık",
      "Voucher üretimi asenkron",
      "Mobil rezervasyon akışı",
    ],
    [
      "Tedarikçi entegrasyonu (GDS) ayrı; rezervasyon merkezi",
      "Sezon zirvesinde HPA",
      "Shared hosting'de küçük acente (kısıtlı)",
    ],
  ),

  "dist-veteriner": dim(
    [
      "Veteriner/Hayvan Sağlığı Dağıtımı: hasta (hayvan), sahip, aşı takvimi ve muayene yönetimini paketler",
      "Hayvan dosyası, aşı hatırlatma ve klinik iş akışı için hazır bundle",
      "Veterinere özel ArcheType'ları (hayvan, sahip, vizit) bir araya getirir",
    ],
    [
      "Hayvan/sahip verisi tenant_id RLS; sahip iletişim izinli",
      "Tıbbi kayıt audit'li; rol bazlı erişim",
      "Reçete/aşı kaydı doğrulanır",
    ],
    [
      "Olay: aşı zamanı yaklaştı → sahibe hatırlatma (idempotent, zincir ≤6)",
      "Olay: randevu alındı → takvime + onay (loop-breaker)",
    ],
    "AI tanı/triyaj önerir; tıbbi kararı veteriner verir",
    [
      "Veteriner dağıtımı scheduling (randevu), party (sahip), notification (aşı hatırlatma) birleştirir",
      "Muayene finance'a, dosya file'a bağlanır",
    ],
    [
      "Veteriner/Hayvan Sağlığı Dağıtımı kliniklere hazır dikey çözüm sunar",
      "Veteriner app'leri bu dağıtımı temel alır",
    ],
    [
      "Hayvan/sahip listesi indeksli; aşı takvimi sorgusu hızlı",
      "Randevu çakışma anlık",
      "Mobil saha/ev ziyareti çevrimdışı",
    ],
    [
      "Standart yatay ölçek; klinik hacmi",
      "Yedekleme (tıbbi süreklilik)",
      "Shared hosting'de küçük klinik (uyumlu)",
    ],
  ),

  "edition-creator": dim(
    [
      "Creator Edition: içerik üreticileri için içerik, abonelik, üyelik ve gelir paylaşımı varyantı",
      "İçerik yayını, üyelik katmanı ve bağış/abonelik için hazır edition",
      "Creator'a uygun ArcheType setini (içerik, abonelik, ödeme) paketler",
    ],
    [
      "İçerik/abone verisi tenant_id RLS; üyelik erişimi katman bazlı",
      "Gelir paylaşımı şeffaf + audit; ödeme token'la",
      "Telif/içerik koruması",
    ],
    [
      "Olay: yeni içerik → abonelere bildir + erişim ver (idempotent, zincir ≤6)",
      "Olay: abonelik yenilendi → erişimi sürdür (loop-breaker)",
    ],
    "AI içerik önerisi/etiketleme üretir; yayını creator onaylar",
    [
      "Creator Edition cms (içerik), billing (abonelik), commerce (satış) ArcheType'larını birleştirir",
      "Üyelik party'ye, gelir finance'a bağlanır",
    ],
    [
      "Creator Edition içerik üreticilerine uygun stack varyantı sunar",
      "İçerik/medya app'leri bu edition'ı kullanır",
    ],
    [
      "İçerik teslimi CDN; abone erişim kontrolü hızlı",
      "Üyelik katmanı kontrolü O(1)",
      "Mobil içerik tüketimi öncelikli",
    ],
    [
      "İçerik CDN + medya depo; standart ölçek",
      "Ödeme/abonelik entegrasyonu",
      "Shared hosting'de temel içerik (medya kısıtlı)",
    ],
  ),

  "edition-departman-copilot": dim(
    [
      "Departman AI Copilot Edition: bir departmana (satış/İK/finans) özel AI asistanı varyantı",
      "Departman verisine yetki-farkında RAG asistanı ve görev otomasyonu",
      "Copilot'a uygun ArcheType setini (RAG, workflow, audit) paketler",
    ],
    [
      "Copilot yalnız departmanın yetkili verisine erişir (ReBAC)",
      "Prompt/yanıt audit'li; injection muhafızası",
      "Hassas departman verisi maskeli",
    ],
    [
      "Olay: departman sorusu → yetki-farkında RAG ile yanıt + kaynak (idempotent, zincir ≤6)",
      "Olay: yüksek-riskli aksiyon istendi → insana devret (loop-breaker)",
    ],
    "AI departman görevlerinde öneri/taslak üretir; aksiyonu yetkili insan onaylar",
    [
      "Departman Copilot rag, workflow (otomasyon), audit ArcheType'larını birleştirir",
      "AI Stack guardrail'ını kullanır; departman verisine bağlanır",
    ],
    [
      "Departman AI Copilot Edition departman-özel asistan varyantı sunar",
      "Departman app'leri (CRM/HR/finans) copilot edition'ı kullanır",
    ],
    [
      "RAG yanıtı düşük gecikme; yetki filtresi arama-seviyesinde",
      "Embedding önbellekli",
      "Mobil copilot akış yanıt",
    ],
    [
      "Çıkarım AI Stack üzerinden ayrı ölçek; departman verisi izole",
      "Maliyet bütçe tavanı",
      "Shared hosting AI için kısıtlı (degrade)",
    ],
  ),

  "edition-onmuhasebe": dim(
    [
      "Ön Muhasebe Edition: KOBİ için fatura, tahsilat, gider ve basit raporlama varyantı",
      "e-Fatura, cari hesap ve nakit takibi için sadeleştirilmiş edition",
      "Ön muhasebeye uygun ArcheType setini (fatura, cari, kasa) paketler",
    ],
    [
      "Mali kayıt tenant_id RLS; KOBİ kullanıcı rol yetkisi",
      "e-Fatura imza kasada; GİB uyumu",
      "Cari/kasa hareketi audit'li",
    ],
    [
      "Olay: fatura kesildi → e-fatura + cari güncelle (idempotent, zincir ≤6)",
      "Olay: tahsilat geldi → cariyi kapat + kasa güncelle (loop-breaker)",
    ],
    "AI gider sınıflandırma/mutabakat önerir; kayıtları kullanıcı onaylar",
    [
      "Ön Muhasebe Edition accounting, billing, tax-compliance ArcheType'larının sade alt-setini birleştirir",
      "e-Fatura GİB ile; cari party ile",
    ],
    [
      "Ön Muhasebe Edition KOBİ'lere sade muhasebe varyantı sunar",
      "Küçük işletme app'leri bu edition'ı kullanır",
    ],
    [
      "Cari/kasa sorgusu indeksli; rapor basit projeksiyon",
      "e-Fatura gönderim kuyruğu",
      "Mobil fatura/tahsilat",
    ],
    [
      "Standart yatay ölçek; GİB gönderici worker",
      "TR veri uyumu",
      "Shared hosting'de KOBİ için uyumlu",
    ],
  ),

  "edition-people": dim(
    [
      "People Edition (HR): işe alımdan bordroya çalışan yaşam döngüsü varyantı",
      "Özlük, izin, bordro ve performans için hazır İK edition'ı",
      "İK'ya uygun ArcheType setini (özlük, bordro, izin) paketler",
    ],
    [
      "Özlük/SGK verisi en yüksek koruma (çalışan PII); rol bazlı",
      "Bordro/maaş gizli; erişim dar + audit",
      "İzin/performans kayıtları izli",
    ],
    [
      "Olay: izin talebi → onay akışı + bakiye güncelle (idempotent, zincir ≤6)",
      "Olay: bordro dönemi → hesap + onay (loop-breaker)",
    ],
    "AI özlük/bordro anomali ve aday eşleştirme önerir; İK kararını insan verir",
    [
      "People Edition hrms, payroll, ats, performance ArcheType'larını birleştirir",
      "Çalışan party'ye, geri ödeme finance'a bağlanır",
    ],
    [
      "People Edition (HR) şirketlere çalışan yönetim varyantı sunar",
      "İK app'leri bu edition'ı kullanır",
    ],
    [
      "Bordro hesabı toplu/asenkron; özlük sorgusu indeksli",
      "İzin bakiyesi anlık",
      "Mobil çalışan self-servis (izin/bordro)",
    ],
    [
      "Standart yatay ölçek; bordro dönem-sonu worker",
      "SGK/KVKK veri uyumu",
      "Shared hosting'de küçük şirket (uyumlu)",
    ],
  ),

  "edition-randevu": dim(
    [
      "Randevu Edition: randevu-temelli işletmeler (kuaför/klinik/danışman) için takvim+müşteri varyantı",
      "Online randevu, hatırlatma ve müşteri kartı için hazır edition",
      "Randevuya uygun ArcheType setini (takvim, müşteri, hizmet) paketler",
    ],
    [
      "Randevu/müşteri verisi tenant_id RLS; iletişim izinli",
      "Çift-rezervasyon engellenir; iptal politikası audit'li",
      "Online ödeme token'la",
    ],
    [
      "Olay: randevu alındı → çakışma kontrol + hatırlatma planla (idempotent, zincir ≤6)",
      "Olay: randevu yaklaştı → müşteriye hatırlatma (loop-breaker)",
    ],
    "AI doluluk/no-show tahmini önerir; randevuyu müşteri/personel onaylar",
    [
      "Randevu Edition scheduling, crm (müşteri), notification ArcheType'larını birleştirir",
      "Ödeme finance'a bağlanır",
    ],
    [
      "Randevu Edition randevu-temelli işletmelere varyant sunar",
      "Hizmet app'leri bu edition'ı kullanır",
    ],
    [
      "Takvim/müsaitlik sorgusu anlık; çakışma kontrolü O(1)",
      "Hatırlatma kuyruğu",
      "Mobil online randevu öncelikli",
    ],
    [
      "Standart yatay ölçek; hatırlatma worker",
      "Online ödeme entegrasyonu",
      "Shared hosting'de uyumlu",
    ],
  ),

  "edition-salescrm": dim(
    [
      "Sales CRM Edition: satış ekipleri için fırsat, pipeline ve aktivite yönetimi varyantı",
      "Lead→fırsat→teklif→kazan/kayıp pipeline ve satış aktivitesi için hazır edition",
      "Satış CRM'e uygun ArcheType setini (lead, fırsat, aktivite) paketler",
    ],
    [
      "Fırsat/müşteri verisi tenant_id RLS; portföy bazlı erişim",
      "İndirim/teklif yetki eşiğine bağlı + audit",
      "Müşteri iletişim izinli",
    ],
    [
      "Olay: fırsat aşaması değişti → aktivite/görev öner (idempotent, zincir ≤6)",
      "Olay: fırsat uzun süre durağan → hatırlat (loop-breaker)",
    ],
    "AI lead skorlama/sonraki-aksiyon önerir; fırsat kararını satışçı verir",
    [
      "Sales CRM Edition crm, cpq (teklif), analytics ArcheType'larını birleştirir",
      "Teklif finance'a, iletişim notification'a bağlanır",
    ],
    ["Sales CRM Edition satış ekiplerine varyant sunar", "Satış app'leri bu edition'ı kullanır"],
    [
      "Pipeline sorgusu indeksli; aktivite akışı sayfalı",
      "Skorlama anlık",
      "Mobil saha satış (offline aktivite)",
    ],
    [
      "Standart yatay ölçek; raporlama okuma-replikası",
      "E-posta/takvim entegrasyonu",
      "Shared hosting'de uyumlu",
    ],
  ),

  "edition-storefront": dim(
    [
      "Storefront Edition: çevrimiçi mağaza (vitrin+sepet+ödeme) için hazır e-ticaret varyantı",
      "Katalog, sepet, ödeme ve sipariş takibi için hazır edition",
      "Storefront'a uygun ArcheType setini (katalog, sepet, sipariş) paketler",
    ],
    [
      "Sepet/sipariş tenant_id RLS; ödeme PCI-dışı token",
      "Kupon kötüye kullanımı oran-sınırlı",
      "Misafir sepeti oturuma bağlı, PII minimal",
    ],
    [
      "Olay: sipariş verildi → stok düş + ödeme + onay (idempotent, zincir ≤6)",
      "Olay: sepet terk → hatırlatma (izinli) (loop-breaker)",
    ],
    "AI ürün öneri/kişiselleştirme üretir; fiyat/kampanyayı işletme belirler",
    [
      "Storefront Edition commerce, payment-methods, inventory ArcheType'larını birleştirir",
      "Sipariş finance'a, katalog pim'e bağlanır",
    ],
    [
      "Storefront Edition çevrimiçi satıcılara varyant sunar",
      "E-ticaret app'leri bu edition'ı kullanır",
    ],
    [
      "Vitrin/katalog CDN+önbellek; sepet düşük gecikme",
      "Kampanya zirvesinde HPA",
      "Mobil-öncelikli vitrin/ödeme",
    ],
    [
      "Vitrin edge/CDN; sipariş merkezi; kampanya HPA",
      "Ödeme entegrasyonu",
      "Shared hosting'de statik vitrin + JSON sipariş",
    ],
  ),

  "s-channel-hub": dim(
    [
      "Pazaryeri Entegratör Hub'ı: çoklu pazaryeri (Trendyol/Hepsiburada/Amazon) ürün, sipariş, stok senkronu",
      "Tek panelden çoklu kanal listeleme, sipariş toplama ve stok eşitleme",
      "Kanal-özel ArcheType'ları (kanal listing, kanal sipariş) bir araya getirir",
    ],
    [
      "Kanal API anahtarı kasada; sipariş/ürün tenant-izole",
      "Fiyat/stok eşitleme idempotent (çift güncelleme yok)",
      "Kanal webhook imza-doğrulamalı",
    ],
    [
      "Olay: kanaldan sipariş → merkezi havuza ekle + stok düş (idempotent, zincir ≤6)",
      "Olay: stok değişti → tüm kanallara eşitle (loop-breaker)",
    ],
    "AI fiyat/kanal optimizasyon önerir; listelemeyi işletme onaylar",
    [
      "Channel Hub commerce (sipariş), inventory (stok), pim (ürün) ile entegre",
      "Kanallar ipaas/adaptörden; webhook scale-webhook ile",
    ],
    [
      "Pazaryeri Entegratör Hub'ı çok-kanal satıcılara entegrasyon sağlar",
      "E-ticaret/pazaryeri app'leri hub'ı kullanır",
    ],
    [
      "Kanal senkronu olay-temelli artımlı; oran-sınırına uyum",
      "Sipariş webhook asenkron",
      "Çoklu kanal paralel eşitleme",
    ],
    [
      "Kanal entegrasyonu ayrı worker (her kanal oran-sınırı)",
      "Standart yatay ölçek: durum-bilgisiz servis kopyaları",
      "Shared hosting'de az-kanal (kısıtlı)",
    ],
  ),

  "s-comms": dim(
    [
      "Meet & Comms Hub: görüntülü görüşme, sesli arama ve ekip mesajlaşması için iletişim merkezi",
      "Video toplantı, kanal/DM mesajlaşma ve dosya paylaşımı için hazır servis",
      "İletişime özel ArcheType'ları (toplantı, kanal, mesaj) bir araya getirir",
    ],
    [
      "Mesaj/görüşme verisi tenant_id RLS; uçtan-uca şifreleme opsiyonu",
      "Toplantı erişimi yetki/davet bazlı; kayıt onamı",
      "Dosya paylaşımı anti-virüs taramalı",
    ],
    [
      "Olay: toplantı başladı → katılımcılara bildir + kayıt onamı (idempotent, zincir ≤6)",
      "Olay: mesajda bahsetme (mention) → bildir (loop-breaker)",
    ],
    "AI toplantı özeti/transkript üretir (onamlı); iletişimi kullanıcı yönetir",
    [
      "Comms Hub realtime (mesaj), file (paylaşım), notification ile entegre",
      "Medya ayrı servis; kimlik security model'den",
    ],
    [
      "Meet & Comms Hub ekiplere iletişim/toplantı sağlar",
      "İşbirliği app'leri comms hub'ı kullanır",
    ],
    [
      "Mesaj gerçek-zaman düşük gecikme; medya ayrı işleyici",
      "Çok-katılımcı toplantı ölçeği",
      "Mobil görüşme/mesaj öncelikli",
    ],
    [
      "Medya/sinyal sunucusu ayrı ölçek (WebRTC); mesaj realtime",
      "Eşzamanlı toplantı için HPA",
      "Shared hosting görüşme için kısıtlı",
    ],
  ),

  "s-esign": dim(
    [
      "E-İmza & Onay: belge imzalama akışı, imza sırası, kimlik doğrulama ve denetlenebilir kayıt",
      "Çoklu imzacı, imza sırası ve yasal-geçerli e-imza için hazır servis",
      "İmzaya özel ArcheType'ları (imza isteği, imzacı, belge) bir araya getirir",
    ],
    [
      "İmzalı belge değişmez (hash); imzacı kimliği doğrulanır",
      "İmza kanıtı (audit trail) yasal-geçerli ve saklanır",
      "Belge erişimi imzacı bazlı yetkili",
    ],
    [
      "Olay: imza isteği oluştu → imzacılara sırayla gönder + hatırlat (idempotent, zincir ≤6)",
      "Olay: tüm imzalar tamam → belgeyi kilitle + tarafları bilgilendir (loop-breaker)",
    ],
    "AI belge/imza alanı tespiti önerir; imza yetkisini insan verir (AI imzalamaz)",
    [
      "E-İmza, dms (belge), party (imzacı), notification ile entegre",
      "Belge file'a, kimlik security model'e bağlanır",
    ],
    [
      "E-İmza & Onay tüm app'lere yasal imza yeteneği sağlar",
      "Sözleşme/onay gerektiren app'ler e-imzayı kullanır",
    ],
    [
      "İmza akışı durum makinesi; belge hash doğrulama hızlı",
      "Çoklu imzacı paralel/sıralı",
      "Mobil imza (parmak/çizim) erişimli",
    ],
    [
      "İmza servisi standart; belge şifreli depo + DR",
      "Yasal saklama süresi",
      "Shared hosting'de temel imza (kısıtlı)",
    ],
  ),

  "s-iot": dim(
    [
      "IoT & Sensör Platformu: cihaz yönetimi, telemetri toplama, komut gönderme ve alarm",
      "Cihaz kayıt, sensör verisi (MQTT) ve uzaktan komut için hazır platform",
      "IoT'ye özel ArcheType'ları (cihaz, telemetri, alarm) bir araya getirir",
    ],
    [
      "Cihaz kimliği güçlü (sertifika); telemetri tenant-izole",
      "Komut gönderme yetkili + imzalı; sahte cihaz reddi",
      "Cihaz erişimi en-az-ayrıcalık",
    ],
    [
      "Olay: sensör eşiği aştı → alarm üret + aksiyon/uyarı (idempotent, zincir ≤6)",
      "Olay: cihaz çevrimdışı → durum güncelle + uyar (loop-breaker)",
    ],
    "AI telemetri anomali/bakım tahmini önerir; cihaz komutunu insan onaylar",
    [
      "IoT platformu time-series (telemetri), streaming, notification (alarm) ile entegre",
      "Cihaz kimliği security model'den; komut audit'li",
    ],
    [
      "IoT & Sensör Platformu cihaz-bağlı işletmelere altyapı sağlar",
      "Endüstriyel/akıllı-bina app'leri IoT platformunu kullanır",
    ],
    [
      "Telemetri yüksek-hacim akış; zaman-serisi deposu",
      "Komut düşük gecikme",
      "Mobil cihaz izleme/komut",
    ],
    [
      "MQTT broker + ingest ayrı ölçek; cihaz edge",
      "Çok-bölge cihaz yönetimi",
      "Shared hosting IoT için kısıtlı (degrade)",
    ],
  ),

  "s-isg": dim(
    [
      "İSG / EHS Yönetimi: iş sağlığı-güvenliği, risk değerlendirme, olay/kaza ve eğitim takibi",
      "Risk analizi, ramak-kala bildirimi ve İSG eğitim takibi için hazır servis",
      "İSG'ye özel ArcheType'ları (risk, olay, eğitim) bir araya getirir",
    ],
    [
      "İSG/sağlık verisi hassas; rol bazlı + KVKK koruması",
      "Olay/kaza kaydı değişmez audit'li (yasal)",
      "Eğitim/sertifika kayıtları doğrulanır",
    ],
    [
      "Olay: ramak-kala/kaza bildirildi → kayıt + soruşturma görevi (idempotent, zincir ≤6)",
      "Olay: İSG eğitimi süresi doldu → hatırlatma (loop-breaker)",
    ],
    "AI risk skorlama/olay sınıflandırma önerir; İSG kararını uzman verir",
    [
      "İSG/EHS workflow (soruşturma), party (çalışan), notification ile entegre",
      "Eğitim lms'e, kayıt audit'e bağlanır",
    ],
    [
      "İSG/EHS Yönetimi iş güvenliği gereken işletmelere servis sağlar",
      "İnşaat/üretim app'leri İSG modülünü kullanır",
    ],
    [
      "Risk/olay listesi indeksli; eğitim takvimi sorgusu",
      "Raporlama projeksiyondan",
      "Mobil saha olay bildirimi (foto)",
    ],
    [
      "Standart yatay ölçek; yasal raporlama worker",
      "Yasal saklama + audit",
      "Shared hosting'de temel İSG (uyumlu)",
    ],
  ),

  "s-kvkk": dim(
    [
      "KVKK Uyum Paketi: veri envanteri, VERBİS, aydınlatma, açık rıza ve ihlal yönetimi (TR)",
      "Kişisel veri işleme envanteri, rıza ve veri-öznesi talepleri için hazır paket",
      "KVKK'ya özel ArcheType'ları (envanter, rıza, ihlal) bir araya getirir",
    ],
    [
      "Kişisel veri sınıflandırılır; işleme amaç-sınırlı + audit",
      "Açık rıza kaydı değişmez; geri çekme geçerli",
      "İhlal bildirimi (72 saat) takipli",
    ],
    [
      "Olay: veri-öznesi talebi (silme/erişim) → akış başlat + süre takip (idempotent, zincir ≤6)",
      "Olay: ihlal tespit → kayıt + bildirim süresi başlat (loop-breaker)",
    ],
    "AI veri envanteri/PII tespiti ve risk önerir; uyum kararını DPO/insan verir",
    [
      "KVKK Paketi privacy, audit, jurisdiction (TR) ile entegre",
      "Envanter data-catalog'dan; talepler party/CRM ile",
    ],
    [
      "KVKK Uyum Paketi TR'de faaliyet gösteren tüm işletmelere uyum sağlar",
      "Kişisel veri işleyen tüm app'ler KVKK paketini kullanır",
    ],
    [
      "Envanter sorgusu indeksli; talep takibi projeksiyondan",
      "Silme/export arka plan işi",
      "Mobil rıza/talep self-servis",
    ],
    [
      "Standart yatay ölçek; TR veri ikameti",
      "Yasal saklama + ihlal süre takibi",
      "Shared hosting'de temel KVKK (uyumlu)",
    ],
  ),

  "s-mail": dim(
    [
      "Mail Suite: kurumsal e-posta gönderim/alım, şablon, teslim edilebilirlik (deliverability) ve takip",
      "Toplu/işlemsel e-posta, SPF/DKIM/DMARC ve açılma/tıklama takibi için hazır servis",
      "E-postaya özel ArcheType'ları (kampanya, şablon, teslim) bir araya getirir",
    ],
    [
      "E-posta/alıcı verisi tenant_id RLS; izin (opt-out) zorunlu",
      "SPF/DKIM/DMARC ile kimlik doğrulama (spoofing önleme)",
      "Bounce/şikayet yönetimi (deliverability korur)",
    ],
    [
      "Olay: e-posta gönderildi → teslim/açılma takibi + bounce işle (idempotent, zincir ≤6)",
      "Olay: şikayet/bounce arttı → gönderimi kıs + uyar (loop-breaker)",
    ],
    "AI konu/içerik ve gönderim-zamanı önerir; gönderimi insan onaylar",
    [
      "Mail Suite notification (kanal), party (alıcı), analytics (takip) ile entegre",
      "Şablon i18n ile; izin consent modülüyle",
    ],
    [
      "Mail Suite tüm app'lere e-posta gönderim altyapısı sağlar",
      "E-posta gönderen tüm app'ler mail suite'i kullanır",
    ],
    [
      "Toplu gönderim parçalı kuyruk; oran-sınırına uyum",
      "Teslim takibi asenkron",
      "Mobilde kampanya durumu",
    ],
    [
      "Gönderim worker'ı ayrı; SMTP/sağlayıcı adaptörü",
      "IP ısıtma/itibar yönetimi",
      "Shared hosting'de temel e-posta (kısıtlı)",
    ],
  ),

  "s-scheduling": dim(
    [
      "Randevu & Takvim: müsaitlik, rezervasyon, kaynak (oda/personel) ve çakışma yönetimi",
      "Takvim, müsaitlik kuralları ve çift-rezervasyon önleme için hazır servis",
      "Takvime özel ArcheType'ları (randevu, kaynak, müsaitlik) bir araya getirir",
    ],
    [
      "Randevu/takvim verisi tenant_id RLS; kaynak erişimi yetkili",
      "Çift-rezervasyon kilitle engellenir (eşzamanlı)",
      "İptal/değişiklik politikası audit'li",
    ],
    [
      "Olay: rezervasyon → müsaitlik kilitle + çakışma kontrol (idempotent, zincir ≤6)",
      "Olay: randevu yaklaştı → hatırlatma (loop-breaker)",
    ],
    "AI optimal slot/doluluk önerir; rezervasyonu kullanıcı/personel onaylar",
    [
      "Scheduling notification (hatırlatma), party (müşteri), workflow ile entegre",
      "Birçok dikey (klinik/randevu) bu servisi tüketir",
    ],
    [
      "Randevu & Takvim tüm app'lere zamanlama altyapısı sağlar",
      "Randevu-temelli tüm app'ler scheduling'i kullanır",
    ],
    [
      "Müsaitlik sorgusu anlık; çakışma kontrolü eşzamanlı-güvenli",
      "Hatırlatma kuyruğu",
      "Mobil takvim erişimi",
    ],
    [
      "Standart yatay ölçek; hatırlatma worker",
      "Takvim senkron (CalDAV opsiyon)",
      "Shared hosting'de uyumlu",
    ],
  ),

  "stack-builder": dim(
    [
      "Builder Stack: az-kodla (low-code) ArcheType/Surface/Workflow oluşturma yetenek paketi",
      "Görsel tasarımcı, şema editörü ve önizleme için yetenek bundle'ı",
      "Builder'a uygun ArcheType setini (tasarımcı, şablon) paketler",
    ],
    [
      "Builder ArcheType taslağı üretir; prod'a geçiş onay+migration güvenliği",
      "Şema değişikliği locked system ruleset'e tabi",
      "Builder yetkisi developer rolüyle",
    ],
    [
      "Olay: tasarım kaydedildi → validation + diff + dry-run akışı (idempotent, zincir ≤6)",
      "Olay: prod'a yayın istendi → migration güvenlik kapısı (loop-breaker)",
    ],
    "AI şema/akış önerir ve admin'e quiz sorar; app/module üretemez, taslak insan onaylı",
    [
      "Builder Stack developer-panel, conformance, migration ArcheType'larını birleştirir",
      "Kernel ArcheType sözleşmesini kullanır",
    ],
    [
      "Builder Stack platforma az-kodla genişletme sağlar",
      "Geliştirici/admin app'leri builder stack'i kullanır",
    ],
    [
      "Tasarım önizleme artımlı; şema doğrulama hızlı",
      "Diff hesabı anlık",
      "Builder masaüstü öncelikli (mobil önizleme)",
    ],
    [
      "Builder kernel'e yazar; ortam ayrımı (draft/prod)",
      "Standart yatay ölçek: kuyruk derinliğine göre worker",
      "Shared hosting'de tanım dışa-aktarımı",
    ],
  ),

  "stack-channel": dim(
    [
      "Channel Stack — Pazaryeri & Kanal: çok-kanal satış yetenek paketi (pazaryeri, sosyal, kanal)",
      "Kanal listeleme, sipariş toplama ve stok eşitleme yetenek bundle'ı",
      "Kanala uygun ArcheType setini (channel-hub, social-commerce) paketler",
    ],
    [
      "Kanal anahtarları kasada; sipariş/stok tenant-izole",
      "Eşitleme idempotent; kanal webhook imzalı",
      "Fiyat/stok tutarlılığı korunur",
    ],
    [
      "Olay: kanaldan sipariş → merkezi havuza + stok düş (idempotent, zincir ≤6)",
      "Olay: stok değişti → kanallara eşitle (loop-breaker)",
    ],
    "AI kanal/fiyat optimizasyon önerir; listelemeyi işletme onaylar",
    [
      "Channel Stack channel-hub, social-commerce, commerce ArcheType'larını birleştirir",
      "Webhook scale primitifiyle; ödeme finance'a",
    ],
    [
      "Channel Stack çok-kanal satış yeteneğini paketler",
      "E-ticaret/pazaryeri app'leri channel stack'i kullanır",
    ],
    ["Kanal senkronu artımlı; oran-sınırlı", "Sipariş asenkron toplama", "Mobilde kanal durumu"],
    [
      "Kanal entegrasyon worker'ları; her kanal oran-sınırı",
      "Standart yatay ölçek: okuma-replikası + önbellek",
      "Shared hosting'de az-kanal (kısıtlı)",
    ],
  ),

  "stack-compliance": dim(
    [
      "Compliance Stack (TR): KVKK, GİB e-belge, e-imza ve yerel mevzuat uyum yetenek paketi",
      "TR yasal uyum (vergi/veri/imza) için bir araya getirilmiş yetenek bundle'ı",
      "Uyuma uygun ArcheType setini (kvkk, tax, esign) paketler",
    ],
    [
      "Uyum verisi/kanıtları korumalı + audit; TR veri ikameti",
      "e-Belge imza kasada; KVKK rıza yönetimi",
      "Mevzuat kuralları sürümlü",
    ],
    [
      "Olay: yasal olay (fatura/talep) → uygun uyum akışını tetikle (idempotent, zincir ≤6)",
      "Olay: mevzuat son-tarihi → sorumluyu uyar (loop-breaker)",
    ],
    "AI uyum boşluğu/risk önerir; uyum kararını DPO/mali müşavir onaylar",
    [
      "Compliance Stack kvkk, tax-compliance, cc-tr, esign ArcheType'larını birleştirir",
      "Jurisdiction resolver TR eksenini kullanır",
    ],
    [
      "Compliance Stack (TR) TR pazarı için yasal uyum paketi sunar",
      "TR'de faaliyet gösteren tüm app'ler compliance stack'i kullanır",
    ],
    [
      "Uyum durumu projeksiyondan; e-belge gönderim kuyruğu",
      "Talep takibi indeksli",
      "Mobilde uyum/talep durumu",
    ],
    [
      "GİB/e-imza gönderici worker; TR veri ikameti",
      "Standart yatay ölçek: bölge-yerel dağıtım",
      "Shared hosting'de temel uyum (uyumlu)",
    ],
  ),

  "stack-editions": dim(
    [
      "Edition Kavramı — Stack Varyantları: bir stack'in hedef-kitleye göre paketlenmiş varyantları",
      "Aynı çekirdek yeteneklerin farklı edition'lar (people/storefront/creator) olarak sunumu",
      "Edition tanımı: hangi yeteneklerin hangi varyantta açık olduğu",
    ],
    [
      "Edition yapılandırması yetkili; capability bayrak kombinasyonu güvenli",
      "Varyant değişimi sürümlü + uyumluluk",
      "Edition yetenekleri tenant izolasyonunu korur",
    ],
    [
      "Olay: edition seçildi → uygun capability bayraklarını aç (idempotent, zincir ≤6)",
      "Olay: çelişen edition kombinasyonu → reddet (loop-breaker)",
    ],
    "AI uygun edition/bayrak önerir; capability'yi insan etkinleştirir",
    [
      "Stack Editions, e-commerce-models (bayrak) ve tüm edition-* düğümleriyle entegre",
      "Capability flag mimarisini kullanır",
    ],
    [
      "Edition Kavramı stack'lerin hedef-kitle varyantlarını tanımlar",
      "Tüm edition-* düğümleri bu kavramı temel alır",
    ],
    [
      "Edition çözümleme bayrak okuma O(1)",
      "Varyant geçişi anlık",
      "Mobilde aktif edition göstergesi",
    ],
    [
      "Edition yapılandırması imaja/konfige gömülü; tutarlı",
      "Standart yatay ölçek: durum-bilgisiz servis kopyaları",
      "Shared hosting'de sınırlı edition seti",
    ],
  ),

  "stack-messaging": dim(
    [
      "Mesajlaşma Ticareti Stack (WhatsApp): WhatsApp/Instagram üzerinden sohbetle satış ve destek",
      "Mesajlaşma kanalı, otomatik yanıt ve sohbette sipariş için yetenek bundle'ı",
      "Mesajlaşma ticaretine uygun ArcheType setini (sohbet, kanal, sipariş) paketler",
    ],
    [
      "Sohbet/iletişim verisi tenant_id RLS; kanal token kasada",
      "WhatsApp şablon/izin politikasına uyar",
      "Hassas işlemde kimlik+step-up",
    ],
    [
      "Olay: sohbette sipariş niyeti → sepet/sipariş oluştur (idempotent, zincir ≤6)",
      "Olay: AI çözemedi → insana devret (loop-breaker)",
    ],
    "AI sohbet yanıtı/öneri üretir; ödeme/onayı doğrulamalı akış veya insan tamamlar",
    [
      "Messaging Stack conversational, commerce, channel-hub ArcheType'larını birleştirir",
      "WhatsApp API ipaas'tan; sipariş finance'a",
    ],
    [
      "Mesajlaşma Ticareti Stack sohbet-temelli satışı paketler",
      "E-ticaret/destek app'leri messaging stack'i kullanır",
    ],
    [
      "Sohbet yanıtı düşük gecikme; webhook asenkron",
      "Eşzamanlı sohbet ölçeği",
      "Mobil-doğal (mesajlaşma zaten mobil)",
    ],
    [
      "Kanal webhook alıcısı ayrı; çıkarım AI Stack'ten",
      "Standart yatay ölçek: kuyruk derinliğine göre worker",
      "Shared hosting'de temel (kısıtlı)",
    ],
  ),

  "stack-service": dim(
    [
      "Service Stack: saha servisi (FSM) — iş emri, ekip atama, rota ve yedek parça yetenek paketi",
      "Saha iş emri, teknisyen atama ve mobil saha uygulaması için yetenek bundle'ı",
      "Servise uygun ArcheType setini (iş emri, teknisyen, parça) paketler",
    ],
    [
      "İş emri/müşteri verisi tenant_id RLS; teknisyen rol yetkisi",
      "Saha konumu izinli; iş kaydı audit'li",
      "Parça/stok tüketimi izlenir",
    ],
    [
      "Olay: iş emri oluştu → uygun teknisyene ata + rota (idempotent, zincir ≤6)",
      "Olay: iş tamamlandı → fatura + müşteri onayı (loop-breaker)",
    ],
    "AI atama/rota optimizasyon ve arıza tahmini önerir; iş emrini dispeçer onaylar",
    [
      "Service Stack workflow (iş emri), gis (rota), inventory (parça) ArcheType'larını birleştirir",
      "Fatura finance'a, teknisyen party'ye",
    ],
    [
      "Service Stack saha servisi işletmelerine yetenek paketler",
      "Saha hizmet app'leri service stack'i kullanır",
    ],
    [
      "İş emri/atama indeksli; rota optimizasyon asenkron",
      "Saha senkron",
      "Mobil saha (offline iş emri) öncelikli",
    ],
    [
      "Saha mobil + merkez bulut; rota servisi ayrı",
      "Standart yatay ölçek: okuma-replikası + önbellek",
      "Shared hosting'de temel iş emri",
    ],
  ),

  "stack-workspace": dim(
    [
      "Workspace Stack (TR): dosya, doküman, wiki ve ekip işbirliği yetenek paketi",
      "Belge yönetimi, ortak çalışma ve bilgi tabanı için yetenek bundle'ı",
      "Workspace'e uygun ArcheType setini (belge, wiki, klasör) paketler",
    ],
    [
      "Belge/içerik tenant_id RLS; paylaşım yetkisi ReBAC",
      "Sürümleme + erişim audit'li",
      "Hassas belge şifreli + erişim kontrollü",
    ],
    [
      "Olay: belge paylaşıldı → erişim ver + bildir (idempotent, zincir ≤6)",
      "Olay: belge değişti → sürüm + ilgilileri bilgilendir (loop-breaker)",
    ],
    "AI belge özeti/arama (RAG) önerir; erişim/yayını insan yönetir",
    [
      "Workspace Stack dms, wiki, drive, file ArcheType'larını birleştirir",
      "Arama search'e, paylaşım notification'a bağlanır",
    ],
    [
      "Workspace Stack (TR) ekiplere işbirliği/bilgi yönetimi paketler",
      "İçerik/işbirliği app'leri workspace stack'i kullanır",
    ],
    [
      "Belge araması full-text/RAG; sürüm geçmişi sayfalı",
      "Eşzamanlı düzenleme (CRDT opsiyon)",
      "Mobil belge erişimi",
    ],
    [
      "Belge nesne deposu + CDN; arama ayrı servis",
      "Standart yatay ölçek + DR",
      "Shared hosting'de temel belge (kısıtlı)",
    ],
  ),
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) =>
  fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-aday] atlandı (dosya yok): ${id}`);
    skipped++;
    continue;
  }
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
console.log(
  `[seed-aday] ${applied} aday düğümü derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`,
);
