#!/usr/bin/env node
/**
 * seed-supply-chain — Faz B9 (Cowork tek-ajan). supply-chain (tedarik zinciri & lojistik)
 * kümesinin 14 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Doğrula: node tools/agents/check-content.mjs supply-chain  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");
const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const xdim = (P, what) => ({
  featureDefs: [`${P}: ${what}`, `${P} üst ArcheType'ın alt-detayı; tek sorumluluk`, `${P} örnek dal — granülerlikteki yerini gösterir`],
  security: [`${P} üst ArcheType tenant izolasyonuna uyar`, `${P} girdisi sınırda doğrulanır`, `${P} hassas veri üst katmanda maskelenir`],
  codeOptimization: [`${P} saf/idempotent tasarlanır`, `${P} üst seviyeyle tipli arayüz`, `${P} tekrar eden mantık paylaşılan yardımcıya`],
  securityOptimization: [`${P} en az ayrıcalıkla çalışır`, `${P} girdi normalizasyonu ile enjeksiyon daraltılır`, `${P} değişikliği sürümlü`],
  performance: [`${P} çıktısı önbelleklenebilir`, `${P} tembel başlatılır`, `${P} küçük serileştirilebilir çıktı`],
  mobileApps: [`${P} UI'si varsa mobilde tek sütun`, `${P} iOS/Android içinde bağımsız çalışabilir`, `${P} dar ekranda okunur`],
  wcag: [`${P} etkileşimi klavye erişimli ve adlandırılmış`, `${P} durumu metinle bildirilir (kontrast 7:1)`, `${P} hata mesajı ilişkilendirilmiş`],
  deployment: [`${P} üst ArcheType ile dağıtılır`, `${P} üst yetenekle ölçeklenir`, `${P} shared hosting'de istemci-içi çalışabilir`],
  eca: [ECA_BOUND, `${P} girdisi geçersiz → sınırda reddet + üst akışa hata (idempotent, zincir ≤6)`, `${P} bağımsız otomasyon tutmaz; üst kurala bağlanır`],
  aiAgents: [AI_B1, AI_B2, `${P} tarifini AI önerebilir; üst ArcheType/app'i kendisi üretemez`],
  testing: [`${P} için birim + üst sözleşme entegrasyon testi`, `${P} sınır/erişilebilirlik mikro-yolculuğu`, "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır"],
  owasp: [`${P}: A03 girdi sınırda doğrulanır`, `${P}: A04 en-az-ayrıcalık tasarım`, `${P}: kabul/red izlenir`],
  integration: [`${P} üst ArcheType'a tipli arayüzle bağlanır`, `${P} sözleşmeyi tüketir`, `${P} çıktısı üst akışta kullanılır`],
  moduleUsage: [`${P} bağımsız sunulmaz; üst ArcheType içinde kullanılır`],
});

const CONTENT = {
  "app-supply-chain": {
    featureDefs: [
      "Tedarik Zinciri & Lojistik ürün ailesi: depo (WMS), taşıma (TMS), satınalma, bakım, kalite ve izlenebilirlik",
      "Uçtan uca akış: tedarik→depo→sevkiyat→saha servisi; talep planlama ile",
      "Ortak lokasyon/stok/sevkiyat sözleşmesini paylaşan dikey",
    ],
    security: [
      "Lojistik verisi tenant_id RLS; lokasyon/taşıyıcı bilgisi korunur",
      "Sevkiyat/stok hareketi audit'li; rol bazlı erişim",
      "Tedarikçi/taşıyıcı entegrasyon anahtarı kasada",
    ],
    codeOptimization: [
      "Lojistik ArcheType'ları ortak lokasyon/stok sözleşmesini paylaşır",
      "WMS/TMS/satınalma bildirimsel bağlanır",
      "Stok/sevkiyat olay-temelli",
    ],
    securityOptimization: [
      "Hareket idempotent (çift sayım yok)",
      "Tedarikçi/taşıyıcı değişimi onaylı",
      "Sevkiyat doğrulama (barkod) zorunlu",
    ],
    performance: [
      "Stok/sevkiyat sorgusu indeksli; yüksek hacim",
      "Rota/planlama optimizasyonu asenkron",
      "Saha verisi çevrimdışı + senkron",
    ],
    mobileApps: [
      "Depo/saha el terminali mobil-öncelikli (barkod)",
      "iOS/Android offline işlem + senkron",
      "Dar ekranda sevkiyat/iş emri",
    ],
    wcag: [
      "Lojistik ekranları WCAG 2.2 AAA ortak bileşenleriyle",
      "Sevkiyat/stok durumu renk dışında metinle; kontrast 7:1",
      "Klavye + ekran okuyucu (engelli depo personeli)",
    ],
    deployment: [
      "Tedarik servisleri yatay ölçek; edge (depo/saha) + merkez",
      "Stok/sevkiyat olayları outbox ile",
      "Shared hosting'de temel stok/sevkiyat (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sipariş onaylandı → tedarik/sevkiyat zincirini tetikle (idempotent, zincir ≤6)",
      "Olay: stok/teslim sorunu → ilgili ekibe uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI talep/rota/stok optimizasyonu önerir; sevkiyat/sipariş kararını operasyon onaylar",
    ],
    testing: [
      "Uçtan uca tedarik→sevkiyat akış testi",
      "Stok/sevkiyat idempotency + barkod doğrulama testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: lojistik erişimi rol/lokasyon bazlı",
      "A04 Insecure Design: hareket idempotency + doğrulama",
      "A09 Logging: sevkiyat/stok kararları forensic iz",
    ],
    integration: [
      "Tedarik Zinciri, inventory (stok), sales/purchase (sipariş), finance (maliyet) ile entegre",
      "Talep planlama tahmine (predictive) bağlı",
      "Saha gis (rota) ile",
    ],
    moduleUsage: [
      "Tedarik Zinciri & Lojistik app'i lojistik ArcheType'larını barındırır",
      "Üretim/perakende/dağıtım app'leri bu lojistik sözleşmesini tüketir",
    ],
  },

  "app-supply-chain-x-stone": xdim("Tedarik Zinciri Taşı", "bir lojistik yeteneğinin alt-parça tarifi (ör. rota hesabı)"),
  "app-supply-chain-x-molecule": xdim("Tedarik Zinciri Molekülü", "birkaç lojistik kuralını birleştiren bileşen (ör. sevkiyat kalemi)"),
  "app-supply-chain-x-element": xdim("Tedarik Zinciri Elementi", "tek bir lojistik alanı/kuralı (ör. lot numarası)"),
  "app-supply-chain-x-atom": xdim("Tedarik Zinciri Atomu", "bölünemez lojistik ilkeli (ör. SKU değer nesnesi)"),

  "s-wms": {
    featureDefs: [
      "Depo Yönetimi (WMS): mal kabul, yerleştirme (putaway), toplama (picking), paketleme ve sayım",
      "Lokasyon/raf yönetimi, dalga (wave) toplama ve görev optimizasyonu",
      "Lot/seri/SKU takibi ve depo KPI",
    ],
    security: [
      "Depo/stok verisi tenant_id RLS; lokasyon-bazlı yetki",
      "Stok düzeltmesi gerekçe+onay; değişmez iz",
      "El terminali oturumu personel kimliğiyle",
    ],
    codeOptimization: [
      "Toplama rotası optimizasyonu; görev kuyruğu",
      "Stok bakiyesi hareketlerden; lokasyon-SKU indeksli",
      "Dalga (wave) planlama bildirimsel",
    ],
    securityOptimization: [
      "Negatif stok yalnız izinli; aksi reddi",
      "Sayım farkı eşik+onay",
      "Görev tamamlama idempotent (çift toplama yok)",
    ],
    performance: [
      "Lokasyon-SKU bileşik indeks; yüksek-yazım hareket",
      "Toplama rotası kısa-yol optimize",
      "Toplu sayım parçalı",
    ],
    mobileApps: [
      "El terminali/telefon barkod toplama (en kritik kanal)",
      "iOS/Android offline toplama + senkron",
      "Sesli toplama (pick-by-voice) opsiyonu",
    ],
    wcag: [
      "El terminali ekranı yüksek kontrast (7:1) + büyük hedef",
      "Görev durumu renk dışında metin+sesle",
      "Engelli personel için sesli/klavye erişim",
    ],
    deployment: [
      "WMS edge (depo) + merkez; el terminali offline dayanıklı",
      "Stok olayları outbox ile sipariş/finance'a",
      "Shared hosting'de tek-depo basit WMS",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sipariş toplama emri → rota optimize + görev ata (idempotent, zincir ≤6)",
      "Olay: stok eşik altı → yeniden-sipariş önerisi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI yerleştirme/rota optimizasyonu önerir; stok düzeltmesini personel onaylar",
    ],
    testing: [
      "Toplama rotası + görev idempotency testi",
      "Stok bakiyesi türetme doğruluk testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: depo/lokasyon yetkisi",
      "A04 Insecure Design: negatif stok/çift-toplama önleme",
      "A09 Logging: stok düzeltmeleri forensic iz",
    ],
    integration: [
      "WMS, inventory (stok otoritesi), sales (sipariş), tms (sevkiyat) ile entegre",
      "Mal kabul purchase'tan; sevkiyat tms'e",
      "Lot/seri traceability'ye",
    ],
    moduleUsage: [
      "WMS ArcheType'ı Tedarik Zinciri'nde depo operasyonunu sağlar",
      "Depolu tüm app'ler WMS'i kullanır",
    ],
  },

  "s-tms": {
    featureDefs: [
      "Taşıma Yönetimi (TMS): sevkiyat planlama, rota optimizasyonu, taşıyıcı seçimi ve teslim takibi",
      "Yük konsolidasyonu, navlun hesabı ve POD (teslim kanıtı)",
      "Taşıyıcı entegrasyonu ve gerçek-zaman izleme",
    ],
    security: [
      "Sevkiyat/taşıyıcı verisi tenant_id RLS; konum izinli",
      "Navlun/sözleşme bilgisi audit'li",
      "POD imzalı/doğrulanabilir",
    ],
    codeOptimization: [
      "Rota optimizasyonu (VRP) asenkron; konsolidasyon kuralları",
      "Navlun hesabı saf; taşıyıcı tarifesi tablodan",
      "Teslim durumu olay-temelli",
    ],
    securityOptimization: [
      "Taşıyıcı seçimi kural/skor bazlı (manipülasyon değil)",
      "Sevkiyat değişimi izli",
      "Teslim doğrulama (POD) zorunlu",
    ],
    performance: [
      "Rota optimizasyonu arka planda; sevkiyat sorgusu indeksli",
      "Gerçek-zaman izleme akış-temelli",
      "Navlun hesabı anlık",
    ],
    mobileApps: [
      "Sürücü mobil uygulaması (rota/teslim/POD)",
      "iOS/Android offline teslim + senkron; konum izleme",
      "Dar ekranda sevkiyat listesi",
    ],
    wcag: [
      "Sürücü ekranı sürüş-güvenli (büyük hedef, sesli yönlendirme)",
      "Teslim durumu renk dışında metinle; kontrast 7:1",
      "POD imza erişilebilir",
    ],
    deployment: [
      "TMS servisi ölçeklenir; rota optimizasyon ayrı servis",
      "Taşıyıcı entegrasyonu + izleme",
      "Shared hosting'de temel sevkiyat (rota opt. kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sevkiyat hazır → rota optimize + taşıyıcı ata + izleme başlat (idempotent, zincir ≤6)",
      "Olay: teslim gecikti/sorun → müşteri+operasyona uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI rota/taşıyıcı/konsolidasyon optimizasyonu önerir; sevkiyatı operasyon onaylar",
    ],
    testing: [
      "Rota optimizasyonu + navlun hesap doğruluk testi",
      "Teslim/POD doğrulama testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: sevkiyat/taşıyıcı yetkisi",
      "A02 Cryptographic Failures: POD imzalı",
      "A09 Logging: sevkiyat/teslim kararları iz",
    ],
    integration: [
      "TMS, wms (sevkiyat çıkışı), sales (sipariş), gis (rota) ile entegre",
      "Navlun finance'a; izleme müşteriye (notification)",
      "Taşıyıcılar ipaas'tan",
    ],
    moduleUsage: [
      "TMS ArcheType'ı Tedarik Zinciri'nde taşıma yönetimini sağlar",
      "Sevkiyat yapan tüm app'ler TMS'i kullanır",
    ],
  },

  "s-procurement": {
    featureDefs: [
      "Satınalma/Tedarik (Procurement): tedarikçi yönetimi, RFQ/ihale, sözleşme ve harcama analizi",
      "Tedarikçi değerlendirme, teklif karşılaştırma ve onay hiyerarşisi",
      "Stratejik tedarik (sourcing) ve harcama (spend) görünürlüğü",
    ],
    security: [
      "Tedarikçi/teklif verisi tenant_id RLS; teklif gizliliği (RFQ kapalı)",
      "Tedarikçi banka değişimi step-up onay + audit",
      "Onay eşikleri rol bazlı",
    ],
    codeOptimization: [
      "RFQ→teklif→değerlendirme→sözleşme durum makinesi",
      "Teklif karşılaştırma saf skor; tedarikçi tekilleştirme",
      "Harcama analizi projeksiyondan",
    ],
    securityOptimization: [
      "Teklif açılışı kontrollü (mühürlü teklif); favoritizm engellenir",
      "Tedarikçi değişimi soğuma + çift onay",
      "Onay zinciri bütçe-bağlı",
    ],
    performance: [
      "Tedarikçi/teklif araması indeksli",
      "Harcama analizi (kategori/tedarikçi) küpten",
      "RFQ dağıtımı asenkron",
    ],
    mobileApps: [
      "Mobilde teklif onayı ve tedarikçi değerlendirme",
      "iOS/Android push ile onay bekleyen RFQ bildirimi",
      "Dar ekranda teklif karşılaştırma",
    ],
    wcag: [
      "RFQ/teklif tabloları klavye+okuyucu erişimli",
      "Teklif karşılaştırma renk dışında metinle; kontrast 7:1",
      "Onay aksiyonu açık",
    ],
    deployment: [
      "Procurement servisi standart; RFQ dağıtım worker",
      "Sözleşme clm'e, sipariş purchase'a",
      "Shared hosting'de temel satınalma",
    ],
    eca: [
      ECA_BOUND,
      "Olay: RFQ kapandı → teklifleri karşılaştır + öner (idempotent, zincir ≤6)",
      "Olay: tedarikçi riski (performans düştü) → uyar + alternatif öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tedarikçi/teklif analizi ve tasarruf fırsatı önerir; tedarikçi seçimini insan onaylar",
    ],
    testing: [
      "Teklif karşılaştırma + onay eşiği testi",
      "Mühürlü teklif (zamanından önce açılmaz) testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: teklif gizliliği + onay yetkisi",
      "A04 Insecure Design: favoritizm/mühür ihlali önleme",
      "A09 Logging: tedarikçi/teklif kararları iz",
    ],
    integration: [
      "Procurement, purchase (sipariş), clm (sözleşme), finance (bütçe) ile entegre",
      "Tedarikçi party'ye; harcama BI'ya",
      "Kalite (s-quality) tedarikçi değerlendirmeye",
    ],
    moduleUsage: [
      "Procurement ArcheType'ı Tedarik Zinciri'nde stratejik tedariği sağlar",
      "Satınalma yapan tüm app'ler procurement'ı kullanır",
    ],
  },

  "s-cmms": {
    featureDefs: [
      "Bakım Yönetimi (CMMS): varlık/ekipman, planlı bakım, arıza iş emri ve yedek parça",
      "Önleyici/kestirimci bakım takvimi, arıza kök-neden ve MTBF/MTTR",
      "Yedek parça stoğu ve bakım maliyeti",
    ],
    security: [
      "Varlık/bakım verisi tenant_id RLS; teknisyen rol yetkisi",
      "Bakım kaydı audit'li (yasal/garanti)",
      "Kritik ekipman erişimi kısıtlı",
    ],
    codeOptimization: [
      "Bakım iş emri durum makinesi; takvim kuralları bildirimsel",
      "Sayaç/kullanım-tabanlı tetik (kestirimci)",
      "Yedek parça tüketimi inventory ile",
    ],
    securityOptimization: [
      "Planlı bakım kaçırma uyarısı (uyum/garanti riski)",
      "İş emri tamamlama idempotent",
      "Kritik varlık değişimi onaylı",
    ],
    performance: [
      "Varlık/iş emri listesi indeksli; bakım takvimi sorgusu",
      "MTBF/MTTR projeksiyondan",
      "Sensör-tetikli (IoT) kestirimci bakım akışı",
    ],
    mobileApps: [
      "Teknisyen mobil iş emri (saha bakım)",
      "iOS/Android offline iş emri + foto + senkron",
      "Dar ekranda varlık geçmişi",
    ],
    wcag: [
      "İş emri/varlık ekranı klavye+okuyucu erişimli",
      "Bakım durumu renk dışında metinle; kontrast 7:1",
      "Saha formu erişilebilir",
    ],
    deployment: [
      "CMMS servisi standart; IoT tetikli bakım için stream",
      "İş emri olayları inventory (parça)/finance (maliyet) ile",
      "Shared hosting'de temel bakım takibi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: bakım zamanı/sayaç eşiği → iş emri oluştur + teknisyen ata (idempotent, zincir ≤6)",
      "Olay: kritik arıza → acil iş emri + eskalasyon (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kestirimci bakım/arıza tahmini önerir; iş emrini operasyon onaylar",
    ],
    testing: [
      "Bakım takvimi/tetik + iş emri idempotency testi",
      "MTBF/MTTR hesap doğruluk testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: kritik varlık erişimi",
      "A04 Insecure Design: bakım kaçırma/uyum riski izlenir",
      "A09 Logging: bakım kararları forensic iz",
    ],
    integration: [
      "CMMS, inventory (parça), iot (sensör tetik), fsm (saha) ile entegre",
      "Maliyet finance'a; varlık fixed-assets ile",
      "Arıza kalite (s-quality) ile",
    ],
    moduleUsage: [
      "CMMS ArcheType'ı Tedarik Zinciri'nde bakım yönetimini sağlar",
      "Ekipman/tesis işleten app'ler CMMS'i kullanır",
    ],
  },

  "s-demand-planning": {
    featureDefs: [
      "Talep Planlama / S&OP: talep tahmini, satış-operasyon dengeleme ve stok hedefi",
      "İstatistiksel + AI tahmin, senaryo planlama ve tahmin doğruluğu (forecast accuracy)",
      "Tedarik-talep dengeleme ve güvenlik stoğu",
    ],
    security: [
      "Tahmin/satış verisi tenant_id RLS; rol bazlı erişim",
      "Tahmin varsayımları sürümlü ve izli",
      "Hassas satış verisi maskeli",
    ],
    codeOptimization: [
      "Tahmin modeli (istatistik+ML); senaryo türetimi artımlı",
      "Talep-tedarik dengeleme saf hesap",
      "Tahmin doğruluğu projeksiyondan",
    ],
    securityOptimization: [
      "Tahmin override izli; manuel ayar gerekçeli",
      "Model sürümlü; drift izlenir",
      "S&OP onay akışı",
    ],
    performance: [
      "Tahmin koşusu toplu/asenkron; büyük SKU sayısı parçalı",
      "Senaryo karşılaştırma anlık",
      "Talep küpü önbellekli",
    ],
    mobileApps: [
      "Mobilde tahmin/S&OP özeti ve onay",
      "iOS/Android push ile tahmin sapması uyarısı",
      "Dar ekranda KPI/doğruluk kartı",
    ],
    wcag: [
      "Tahmin grafiklerine veri tablosu alternatifi",
      "Sapma renk dışında ok+metinle; kontrast 7:1",
      "Senaryo seçimi klavye erişimli",
    ],
    deployment: [
      "Tahmin motoru ayrı worker (ML); S&OP servisi standart",
      "Tahmin stok/satınalma planına besler",
      "Shared hosting'de temel tahmin (ML kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni satış verisi → tahmini yenile + sapma kontrol (idempotent, zincir ≤6)",
      "Olay: talep-tedarik dengesizliği → S&OP uyarısı + öneri (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI talep tahmini/senaryo önerir; planı (S&OP) insan onaylar",
    ],
    testing: [
      "Tahmin doğruluk (backtesting) testi",
      "Talep-tedarik dengeleme + güvenlik stoğu testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: tahmin modeli/varsayım sürümlü",
      "A01 Access Control: tahmin/satış verisi erişimi",
      "A09 Logging: tahmin override/karar iz",
    ],
    integration: [
      "Demand Planning, sales (geçmiş talep), inventory (stok), procurement (tedarik) ile entegre",
      "Tahmin predictive/analytics ile",
      "Üretim mrp'ye besler",
    ],
    moduleUsage: [
      "Talep Planlama / S&OP ArcheType'ı Tedarik Zinciri'nde planlamayı sağlar",
      "Stok/üretim yöneten app'ler demand planning'i kullanır",
    ],
  },

  "s-fleet": {
    featureDefs: [
      "Filo Yönetimi (Fleet): araç, sürücü, yakıt, bakım ve telematik takibi",
      "Araç atama, kullanım/yakıt analizi ve sürücü davranışı",
      "Bakım takvimi ve maliyet (TCO)",
    ],
    security: [
      "Araç/sürücü verisi tenant_id RLS; konum izinli ve geçici",
      "Sürücü PII korunur; telematik veri maskeli toplulaştırma",
      "Yakıt/maliyet kaydı audit'li",
    ],
    codeOptimization: [
      "Telematik akış-temelli; kullanım/yakıt türetilir",
      "Bakım takvimi araç-bazlı (km/saat)",
      "Atama optimizasyonu",
    ],
    securityOptimization: [
      "Yakıt sahteciliği (anomali) tespiti",
      "Konum verisi saklama süresi sınırlı (gizlilik)",
      "Sürücü davranış skoru şeffaf",
    ],
    performance: [
      "Telematik yüksek-hacim time-series",
      "Araç listesi/atama indeksli",
      "Maliyet (TCO) projeksiyondan",
    ],
    mobileApps: [
      "Sürücü mobil (görev/yakıt/araç durumu)",
      "iOS/Android konum + araç ön-kontrol (inspection)",
      "Dar ekranda araç/filo özeti",
    ],
    wcag: [
      "Filo panosu klavye+okuyucu erişimli",
      "Araç durumu renk dışında metinle; kontrast 7:1",
      "Sürücü formu erişilebilir",
    ],
    deployment: [
      "Telematik ingest ayrı (IoT); filo servisi standart",
      "Bakım cmms ile; maliyet finance ile",
      "Shared hosting'de temel filo (telematik kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: araç bakım km/saat eşiği → bakım iş emri öner (idempotent, zincir ≤6)",
      "Olay: yakıt/konum anomali → uyar + incele (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI rota/yakıt/bakım optimizasyonu önerir; araç atama/bakımı operasyon onaylar",
    ],
    testing: [
      "Telematik türetme (yakıt/kullanım) doğruluk testi",
      "Yakıt anomali tespiti testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A02 Cryptographic Failures: konum/sürücü PII korunur",
      "A04 Insecure Design: yakıt sahteciliği tespiti",
      "A09 Logging: araç/yakıt kararları iz",
    ],
    integration: [
      "Fleet, iot (telematik), cmms (bakım), tms (sevkiyat aracı) ile entegre",
      "Maliyet finance'a; sürücü party'ye",
      "Rota gis ile",
    ],
    moduleUsage: [
      "Filo Yönetimi ArcheType'ı Tedarik Zinciri'nde araç filosunu yönetir",
      "Lojistik/saha app'leri fleet'i kullanır",
    ],
  },

  "s-fsm": {
    featureDefs: [
      "Saha Servisi (FSM): iş emri, teknisyen atama/çizelge, rota ve yedek parça",
      "Müşteri randevusu, mobil saha uygulaması ve ilk-seferde-çözüm (FTFR)",
      "SLA, garanti ve servis sözleşmesi",
    ],
    security: [
      "İş emri/müşteri verisi tenant_id RLS; teknisyen rol yetkisi",
      "Saha konumu izinli; iş kaydı audit'li",
      "Parça/garanti kaydı izlenir",
    ],
    codeOptimization: [
      "İş emri durum makinesi; çizelge/atama optimizasyonu",
      "Rota gis ile; parça inventory ile",
      "SLA zamanlayıcısı",
    ],
    securityOptimization: [
      "Sahte iş tamamlama (konum/imza doğrulama)",
      "SLA aşımı eskalasyon",
      "Garanti sahteciliği kontrolü",
    ],
    performance: [
      "İş emri/çizelge indeksli; rota optimizasyon asenkron",
      "Saha offline; senkron",
      "FTFR/SLA KPI projeksiyondan",
    ],
    mobileApps: [
      "Teknisyen mobil-öncelikli (en kritik kanal): iş emri/parça/imza",
      "iOS/Android offline iş + foto + müşteri imzası + senkron",
      "Konum + rota navigasyon",
    ],
    wcag: [
      "Saha iş emri formu klavye+okuyucu erişimli",
      "İş durumu renk dışında metinle; kontrast 7:1",
      "Müşteri imzası erişilebilir alternatifle",
    ],
    deployment: [
      "FSM saha mobil + merkez; rota optimizasyon servisi",
      "İş emri olayları inventory/finance ile",
      "Shared hosting'de temel iş emri (rota kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: servis talebi → uygun teknisyene ata + randevu + rota (idempotent, zincir ≤6)",
      "Olay: SLA aşıldı → eskalasyon + müşteriye bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI atama/rota ve arıza-çözüm önerisi üretir; iş emrini dispeçer/teknisyen onaylar",
    ],
    testing: [
      "Atama/çizelge + SLA eskalasyon testi",
      "Saha offline→senkron + konum doğrulama testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: iş emri/müşteri erişimi",
      "A04 Insecure Design: sahte tamamlama/garanti önleme",
      "A09 Logging: iş emri/SLA kararları iz",
    ],
    integration: [
      "FSM, scheduling (randevu), inventory (parça), gis (rota), cmms (varlık) ile entegre",
      "Müşteri crm'e; fatura finance'a",
      "Garanti clm (sözleşme) ile",
    ],
    moduleUsage: [
      "Saha Servisi ArcheType'ı Tedarik Zinciri'nde saha operasyonunu sağlar",
      "Servis/bakım veren app'ler FSM'i kullanır",
    ],
  },

  "s-quality": {
    featureDefs: [
      "Kalite Yönetimi (QC/QA): muayene planı, uygunsuzluk (NCR), CAPA ve denetim",
      "Gelen/üretim/son muayene, örnekleme ve kalite kaydı",
      "Düzeltici/önleyici faaliyet (CAPA) ve kalite KPI",
    ],
    security: [
      "Kalite/uygunsuzluk verisi tenant_id RLS; denetim izli",
      "Kalite kaydı değişmez (yasal/sertifika)",
      "CAPA onay yetkili",
    ],
    codeOptimization: [
      "Muayene planı/örnekleme bildirimsel; NCR durum makinesi",
      "CAPA iş akışı; kök-neden yapılandırılmış",
      "Kalite KPI projeksiyondan",
    ],
    securityOptimization: [
      "Muayene atlama (skip) kontrollü; kritik muayene zorunlu",
      "NCR/CAPA kapatma onaylı",
      "Kalite kaydı manipülasyonu izli",
    ],
    performance: [
      "Muayene/NCR listesi indeksli",
      "Örnekleme hesabı anlık",
      "Kalite trend projeksiyondan",
    ],
    mobileApps: [
      "Saha/hat muayenesi mobil (foto + ölçüm)",
      "iOS/Android offline muayene + senkron",
      "Dar ekranda NCR/CAPA durumu",
    ],
    wcag: [
      "Muayene/NCR formu klavye+okuyucu erişimli",
      "Uygun/uygunsuz renk dışında metin+işaretle; kontrast 7:1",
      "Ölçüm girişi erişilebilir",
    ],
    deployment: [
      "Kalite servisi standart; muayene IoT/cihaz entegrasyonu opsiyon",
      "NCR/CAPA olayları üretim/tedarikçiye",
      "Shared hosting'de temel kalite kaydı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: muayene başarısız → NCR aç + lotu karantinaya al (idempotent, zincir ≤6)",
      "Olay: tekrarlayan uygunsuzluk → CAPA tetikle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kalite anomali/kök-neden ve muayene-foto analizi önerir; NCR/CAPA kararını kalite uzmanı verir",
    ],
    testing: [
      "Muayene/örnekleme + NCR akış testi",
      "CAPA kapatma + kayıt değişmezlik testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: kalite kaydı değişmez + izli",
      "A01 Access Control: CAPA/NCR yetkisi",
      "A09 Logging: kalite kararları forensic iz",
    ],
    integration: [
      "Quality, wms (gelen muayene), mrp (üretim), procurement (tedarikçi kalite) ile entegre",
      "NCR traceability'ye; CAPA workflow'a",
      "Tedarikçi değerlendirme procurement'a",
    ],
    moduleUsage: [
      "Kalite Yönetimi ArcheType'ı Tedarik Zinciri'nde QC/QA sağlar",
      "Üretim/tedarik app'leri quality'yi kullanır",
    ],
  },

  "s-traceability": {
    featureDefs: [
      "İzlenebilirlik (Traceability): lot/seri bazlı ileri-geri izleme, geri çağırma (recall) ve köken",
      "Hammadde→ürün→sevkiyat zinciri, parti takibi ve menşe",
      "Geri çağırma kapsamı ve düzenleyici raporlama",
    ],
    security: [
      "İzleme verisi tenant_id RLS; geri çağırma audit'li",
      "Köken/sertifika kaydı değişmez",
      "Tedarik zinciri verisi paylaşımı kontrollü",
    ],
    codeOptimization: [
      "İzleme grafı (lot→lot) olaylardan; ileri/geri sorgu",
      "Parti bağlantıları indeksli",
      "Recall kapsamı graf-yürüyüşüyle",
    ],
    securityOptimization: [
      "İzleme zinciri kopması tespit edilir (eksik bağ)",
      "Köken sahteciliği için imzalı kayıt",
      "Recall idempotent",
    ],
    performance: [
      "Lot izleme grafı budamalı; derin zincirde hızlı",
      "Recall kapsamı paralel graf-yürüyüşü",
      "Köken sorgusu önbellekli",
    ],
    mobileApps: [
      "Mobilde lot/seri tarama (barkod/QR) ve izleme",
      "iOS/Android'de geri çağırma bildirimi",
      "Dar ekranda izleme zinciri",
    ],
    wcag: [
      "İzleme grafiğine metin/tablo alternatifi (okuyucu)",
      "Recall durumu renk dışında metinle; kontrast 7:1",
      "Lot arama klavye erişimli",
    ],
    deployment: [
      "İzlenebilirlik servisi standart; graf deposu",
      "İzleme olayları wms/mrp/tms'ten beslenir",
      "Shared hosting'de temel lot takibi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kalite/güvenlik sorunu → etkilenen lotları izle + recall kapsamı hesapla (idempotent, zincir ≤6)",
      "Olay: recall başlatıldı → etkilenen tarafları bilgilendir + raporla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI recall kapsamı/risk analizi önerir; geri çağırma kararını yetkili verir",
    ],
    testing: [
      "İleri/geri izleme doğruluk testi (lot zinciri)",
      "Recall kapsamı hesap testi (eksik bağ tespiti)",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: köken/sertifika kaydı değişmez+imzalı",
      "A01 Access Control: tedarik zinciri veri paylaşımı",
      "A09 Logging: recall kararları forensic iz",
    ],
    integration: [
      "Traceability, wms (lot), mrp (üretim partisi), tms (sevkiyat), quality (NCR) ile entegre",
      "Recall notification'a; köken müşteriye",
      "Düzenleyici raporlama compliance'a",
    ],
    moduleUsage: [
      "İzlenebilirlik ArcheType'ı Tedarik Zinciri'nde lot/seri izlemeyi sağlar",
      "Gıda/ilaç/üretim app'leri traceability'yi kullanır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-supply-chain] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-supply-chain] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
