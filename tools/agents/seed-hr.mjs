#!/usr/bin/env node
/**
 * seed-hr — Faz B14 (Cowork tek-ajan). hr (İnsan Kaynakları: HRMS, payroll, ATS, performance, LMS,
 * onboarding, workforce) kümesinin 12 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği
 * uygular (provenance="swarm"). Hassas çalışan PII + SGK/KVKK vurgulu.
 * Doğrula: node tools/agents/check-content.mjs hr  (+ npm run typecheck)
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
  security: [`${P} üst ArcheType tenant izolasyonuna uyar`, `${P} çalışan PII sınırda korunur`, `${P} hassas özlük verisi üst katmanda maskelenir`],
  codeOptimization: [`${P} saf/idempotent tasarlanır`, `${P} üst seviyeyle tipli arayüz`, `${P} tekrar eden mantık paylaşılan yardımcıya`],
  securityOptimization: [`${P} en az ayrıcalıkla çalışır`, `${P} girdi normalizasyonu ile enjeksiyon daraltılır`, `${P} değişikliği sürümlü`],
  performance: [`${P} çıktısı önbelleklenebilir`, `${P} tembel başlatılır`, `${P} küçük serileştirilebilir çıktı`],
  mobileApps: [`${P} UI'si varsa mobilde tek sütun`, `${P} iOS/Android içinde bağımsız çalışabilir`, `${P} dar ekranda okunur`],
  wcag: [`${P} etkileşimi klavye erişimli ve adlandırılmış`, `${P} durumu metinle bildirilir (kontrast 7:1)`, `${P} hata mesajı ilişkilendirilmiş`],
  deployment: [`${P} üst ArcheType ile dağıtılır`, `${P} üst yetenekle ölçeklenir`, `${P} shared hosting'de istemci-içi çalışabilir`],
  eca: [ECA_BOUND, `${P} girdisi geçersiz → sınırda reddet + üst akışa hata (idempotent, zincir ≤6)`, `${P} bağımsız otomasyon tutmaz; üst kurala bağlanır`],
  aiAgents: [AI_B1, AI_B2, `${P} tarifini AI önerebilir; İK kararını insan verir`],
  testing: [`${P} için birim + üst sözleşme entegrasyon testi`, `${P} sınır/erişilebilirlik mikro-yolculuğu`, "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır"],
  owasp: [`${P}: A03 girdi sınırda doğrulanır`, `${P}: A04 en-az-ayrıcalık tasarım`, `${P}: kabul/red izlenir`],
  integration: [`${P} üst ArcheType'a tipli arayüzle bağlanır`, `${P} sözleşmeyi tüketir`, `${P} çıktısı üst akışta kullanılır`],
  moduleUsage: [`${P} bağımsız sunulmaz; üst ArcheType içinde kullanılır`],
});

const CONTENT = {
  "app-hr": {
    featureDefs: [
      "İnsan Kaynakları ürün ailesi: özlük (HRMS), bordro, işe alım (ATS), performans, eğitim (LMS), vardiya",
      "Çalışan yaşam döngüsü: işe alım→onboarding→gelişim→ayrılış",
      "Ortak çalışan (party) ve organizasyon sözleşmesini paylaşan dikey",
    ],
    security: [
      "Çalışan verisi özel-kategori PII; en yüksek koruma (tenant_id RLS + maskeleme)",
      "Bordro/maaş gizli; erişim dar rol + audit",
      "SGK/KVKK uyumu; çalışan onam/erişim hakları",
    ],
    codeOptimization: [
      "İK ArcheType'ları ortak çalışan/org sözleşmesini paylaşır",
      "Bordro hesabı saf; performans/izin durum makinesi",
      "Org şeması (hiyerarşi) verimli sorgulanır",
    ],
    securityOptimization: [
      "Maaş/özlük erişimi en-az-ayrıcalık (yöneticilik kapsamı)",
      "Hassas işlem step-up onay; değişiklik izli",
      "KVKK: çalışan veri-hakları (erişim/silme) akışı",
    ],
    performance: [
      "Bordro toplu/asenkron (dönem-sonu)",
      "Çalışan/org sorgusu indeksli",
      "İzin/devam projeksiyondan",
    ],
    mobileApps: [
      "Çalışan self-servis mobil (izin/bordro/talep)",
      "iOS/Android push ile onay/hatırlatma",
      "Dar ekranda çalışan kartı",
    ],
    wcag: [
      "İK ekranları WCAG 2.2 AAA; form label↔input",
      "Durum (onay/red) renk dışında metinle; kontrast 7:1",
      "Klavye + ekran okuyucu (engelli çalışan erişimi)",
    ],
    deployment: [
      "İK servisleri yatay ölçek; bordro dönem-sonu worker",
      "SGK/e-bildirge entegrasyonu",
      "Shared hosting'de küçük şirket İK (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: işe alım tamamlandı → onboarding akışı + hesap/erişim oluştur (idempotent, zincir ≤6)",
      "Olay: çalışan ayrıldı → erişimleri iptal + offboarding (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI aday eşleştirme/özlük anomali önerir; İK kararını (işe alım/maaş) insan verir",
    ],
    testing: [
      "Çalışan yaşam döngüsü (işe alım→ayrılış) kullanıcı yolculuğu",
      "Bordro hesap + maaş gizliliği erişim testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: özlük/maaş erişimi rol bazlı",
      "A02 Cryptographic Failures: çalışan PII korunur",
      "A09 Logging: İK kararları forensic iz",
    ],
    integration: [
      "İK, party (çalışan), finance (bordro/geri ödeme), expenses (masraf) ile entegre",
      "LMS eğitim, ats işe alım ile",
      "İzin/devam scheduling ile",
    ],
    moduleUsage: [
      "İnsan Kaynakları app'i çalışan yaşam döngüsü ArcheType'larını barındırır",
      "Çalışan yöneten tüm app'ler bu İK sözleşmesini tüketir",
    ],
  },

  "app-hr-x-stone": xdim("İK Taşı", "bir İK yeteneğinin alt-parça tarifi (ör. izin bakiyesi hesabı)"),
  "app-hr-x-molecule": xdim("İK Molekülü", "birkaç İK kuralını birleştiren bileşen (ör. bordro kalemi)"),
  "app-hr-x-element": xdim("İK Elementi", "tek bir İK alanı/kuralı (ör. SGK gün sayısı)"),
  "app-hr-x-atom": xdim("İK Atomu", "bölünemez İK ilkeli (ör. çalışan kimliği değer nesnesi)"),

  "s-hrms": {
    featureDefs: [
      "HRMS Stack (TR): özlük, organizasyon şeması, izin/devam ve bordro-öncesi veri (TR mevzuat)",
      "SGK/e-bildirge uyumu, çalışan self-servis ve İK iş akışları",
      "İzin türleri, devam takibi ve özlük belgeleri",
    ],
    security: [
      "Özlük verisi (TCKN/SGK) özel-kategori PII; en yüksek koruma + maskeleme",
      "Erişim rol+yönetim kapsamı; değişmez audit",
      "KVKK çalışan veri-hakları desteklenir",
    ],
    codeOptimization: [
      "Org şeması hiyerarşik; izin/devam durum makinesi",
      "TR mevzuat kuralları (SGK gün) bildirimsel",
      "Özlük belgeleri file modülünde",
    ],
    securityOptimization: [
      "Özlük değişimi onaylı+izli",
      "Maaş bilgisi ayrı erişim katmanı",
      "SGK verisi şifreli + saklama politikası",
    ],
    performance: [
      "Çalışan/org sorgusu indeksli",
      "İzin bakiyesi anlık (projeksiyon)",
      "Toplu özlük işlemi asenkron",
    ],
    mobileApps: [
      "Çalışan self-servis (izin talebi/bakiye/belge) mobil",
      "iOS/Android push ile onay/hatırlatma",
      "Dar ekranda izin/devam",
    ],
    wcag: [
      "Özlük/izin formu alan-etiket ilişkili; hata bildirimli",
      "İzin durumu renk dışında metinle; kontrast 7:1",
      "Org şeması erişilebilir (klavye/okuyucu)",
    ],
    deployment: [
      "HRMS servisi standart; SGK/e-bildirge entegrasyonu",
      "TR veri ikameti (gerekiyorsa)",
      "Shared hosting'de küçük şirket HRMS",
    ],
    eca: [
      ECA_BOUND,
      "Olay: izin talebi → onay akışı + bakiye güncelle (idempotent, zincir ≤6)",
      "Olay: SGK bildirim dönemi → e-bildirge taslağı üret (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI özlük anomali/izin önerisi üretir; İK kararını insan verir",
    ],
    testing: [
      "İzin/devam hesap + onay akışı testi",
      "SGK gün/mevzuat doğruluk testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: özlük/maaş erişimi",
      "A02 Cryptographic Failures: SGK/TCKN korunur",
      "A09 Logging: özlük değişiklikleri forensic iz",
    ],
    integration: [
      "HRMS, payroll (bordro), party (çalışan), scheduling (izin) ile entegre",
      "SGK/e-bildirge dış servisle",
      "Belgeler dms/file ile",
    ],
    moduleUsage: [
      "HRMS Stack ArcheType'ı İK'da özlük/org yönetimini sağlar",
      "Çalışan tutan tüm app'ler HRMS'i temel alır",
    ],
  },

  "s-payroll": {
    featureDefs: [
      "Bordro (Payroll): maaş hesabı, kesinti/ek ödeme, vergi/SGK ve bordro çıktısı (TR)",
      "Dönem bordrosu, ücret bordrosu (payslip) ve banka ödeme dosyası",
      "Gelir vergisi, SGK primi ve yasal kesinti hesabı",
    ],
    security: [
      "Bordro/maaş en gizli veri; çok dar erişim + değişmez audit",
      "Ödeme dosyası imzalı; banka bilgisi kasada",
      "Bordro dönemi kilidi (sonradan değişmez)",
    ],
    codeOptimization: [
      "Bordro hesabı saf (vergi/SGK kuralları tablodan); ondalık tutar",
      "Dönem durum makinesi (taslak→onay→kapanış)",
      "Toplu hesap asenkron",
    ],
    securityOptimization: [
      "Bordro onayı SoD (görev ayrılığı); hesaplayan ≠ onaylayan",
      "Vergi/SGK oranı sürümlü (yürürlük tarihli)",
      "Geçmiş dönem dokunulmaz",
    ],
    performance: [
      "Toplu bordro dönem-sonu parçalı/asenkron",
      "Payslip üretimi asenkron (PDF)",
      "Bordro sorgusu indeksli",
    ],
    mobileApps: [
      "Çalışan mobilde payslip görüntüleme (güvenli)",
      "iOS/Android'de bordro bildirimi",
      "Dar ekranda maaş özeti",
    ],
    wcag: [
      "Payslip erişilebilir (yapılandırılmış); tutarlar metinle",
      "Kesinti/ek renk dışında işaretle; kontrast 7:1",
      "Bordro onayı klavye erişimli",
    ],
    deployment: [
      "Bordro hesap motoru worker; banka/SGK entegrasyonu",
      "TR veri ikameti; payslip şifreli depo",
      "Shared hosting'de temel bordro",
    ],
    eca: [
      ECA_BOUND,
      "Olay: bordro dönemi → hesapla + onaya gönder; onayda payslip+ödeme dosyası (idempotent, zincir ≤6)",
      "Olay: bordro kapandı → ledger'a + SGK bildirimine (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bordro anomali/kontrol önerir; bordroyu/ödemeyi insan onaylar (SoD)",
    ],
    testing: [
      "Maaş/vergi/SGK hesabı çok-senaryo doğruluk testi",
      "SoD (hesaplayan≠onaylayan) + dönem kilidi testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: bordro/maaş çok dar erişim + SoD",
      "A02 Cryptographic Failures: ödeme dosyası imzalı",
      "A09 Logging: bordro kararları forensic iz",
    ],
    integration: [
      "Payroll, hrms (özlük), finance (ledger/ödeme), treasury (banka) ile entegre",
      "SGK/GİB ile vergi bildirimi",
      "Masraf (expenses) geri ödemesi bordroya",
    ],
    moduleUsage: [
      "Payroll ArcheType'ı İK'da bordro hesabını sağlar",
      "Maaş ödeyen tüm app'ler payroll'u kullanır",
    ],
  },

  "s-ats": {
    featureDefs: [
      "İşe Alım / ATS: ilan, aday havuzu, başvuru hunisi, mülakat ve teklif yönetimi",
      "Aday değerlendirme, mülakat planlama ve işe alım iş akışı",
      "Kariyer sayfası ve aday iletişimi",
    ],
    security: [
      "Aday verisi PII; izinli işleme + saklama süresi (KVKK)",
      "Değerlendirme erişimi rol bazlı; önyargı kayıtları izli",
      "Aday silme/anonimleştirme desteklenir",
    ],
    codeOptimization: [
      "Başvuru hunisi durum makinesi; mülakat planlama scheduling ile",
      "Aday eşleştirme skor (açıklanabilir)",
      "Kariyer sayfası içerik (CMS) ile",
    ],
    securityOptimization: [
      "Aday değerlendirme adil/şeffaf; önyargı (bias) izlenir",
      "Aday verisi saklama süresi sonunda anonimleştirilir",
      "Teklif gizli; erişim dar",
    ],
    performance: [
      "Aday havuzu araması indeksli",
      "Başvuru zirvesinde kuyruk",
      "Mülakat takvimi çakışma kontrolü",
    ],
    mobileApps: [
      "Mobilde başvuru ve mülakat değerlendirme",
      "iOS/Android push ile aday/mülakat bildirimi",
      "Dar ekranda aday kartı",
    ],
    wcag: [
      "Kariyer sayfası/başvuru formu WCAG 2.2 AAA (aday erişilebilirliği)",
      "Aday durumu renk dışında metinle; kontrast 7:1",
      "Değerlendirme formu erişilebilir",
    ],
    deployment: [
      "ATS servisi standart; kariyer sayfası CDN",
      "İş ilanı dağıtımı (kanal/feed)",
      "Shared hosting'de temel ATS",
    ],
    eca: [
      ECA_BOUND,
      "Olay: başvuru geldi → ön-eleme + ilgili işe alımcıya ata (idempotent, zincir ≤6)",
      "Olay: aday reddedildi → KVKK saklama/anonimleştirme planla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI aday eşleştirme/özet önerir (açıklanabilir, önyargı-denetimli); işe alım kararını insan verir",
    ],
    testing: [
      "Başvuru hunisi + mülakat planlama kullanıcı yolculuğu",
      "Önyargı (bias) denetim + KVKK saklama testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: aday verisi/teklif erişimi",
      "LLM/Bias: AI eşleştirmede önyargı denetimi",
      "A09 Logging: işe alım kararları iz (adil süreç)",
    ],
    integration: [
      "ATS, hrms (işe alım→özlük), onboarding, party (aday) ile entegre",
      "Kariyer sayfası cms ile; ilan dağıtımı feed/channel ile",
      "Mülakat scheduling/comms ile",
    ],
    moduleUsage: [
      "Recruitment / ATS ArcheType'ı İK'da işe alımı sağlar",
      "İşe alım yapan tüm app'ler ATS'i kullanır",
    ],
  },

  "s-lms": {
    featureDefs: [
      "Eğitim Yönetimi (LMS): kurs/içerik kataloğu, atama, ilerleme takibi ve sertifika",
      "Çalışan gelişim planı, zorunlu eğitim ve değerlendirme/sınav",
      "Eğitim içeriği (video/doküman) ve tamamlama izleme",
    ],
    security: [
      "Eğitim ilerleme/sonuç çalışan PII; tenant izolasyonu",
      "Sertifika doğrulanabilir (imzalı); sahtecilik engellenir",
      "Zorunlu eğitim (uyum) kaydı denetlenebilir",
    ],
    codeOptimization: [
      "Kurs ilerleme durum makinesi; içerik file/cms ile",
      "Atama kuralları (rol/departman) bildirimsel",
      "Sertifika üretimi şablon-tabanlı",
    ],
    securityOptimization: [
      "Sınav/değerlendirme bütünlüğü (kopya engelleme makul ölçüde)",
      "Sertifika imzalı + doğrulama uç noktası",
      "İçerik erişimi yetki kapsamlı",
    ],
    performance: [
      "Video içerik CDN/stream; ilerleme periyodik kayıt",
      "Katalog araması indeksli",
      "Toplu atama asenkron",
    ],
    mobileApps: [
      "Mobilde kurs izleme + offline indirme",
      "iOS/Android push ile eğitim hatırlatma",
      "Dar ekranda kurs/ilerleme",
    ],
    wcag: [
      "Kurs içeriği WCAG 2.2 AAA (altyazı/transkript)",
      "İlerleme/sonuç renk dışında metinle; kontrast 7:1",
      "Sınav klavye erişimli; zaman uzatma seçeneği",
    ],
    deployment: [
      "LMS servisi standart; video transcode worker + CDN",
      "İçerik depo (object storage)",
      "Shared hosting'de temel LMS (dış video)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kurs tamamlandı → sertifika üret + İK kaydına işle (idempotent, zincir ≤6)",
      "Olay: zorunlu eğitim süresi doldu → çalışana+yöneticiye hatırlat (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kişiselleştirilmiş öğrenme yolu önerir; eğitim atamasını İK/yönetici onaylar",
    ],
    testing: [
      "Kurs atama→ilerleme→sertifika kullanıcı yolculuğu",
      "Sertifika imza/doğrulama + zorunlu eğitim izleme testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: içerik/sonuç erişimi rol bazlı",
      "A08 Integrity: sertifika imza ile korunur",
      "A09 Logging: zorunlu eğitim tamamlama iz",
    ],
    integration: [
      "LMS, hrms (gelişim planı), performance (yetkinlik), party (çalışan) ile entegre",
      "İçerik cms/file ile; video dış stream ile",
      "Onboarding zorunlu eğitimi LMS'ten",
    ],
    moduleUsage: [
      "LMS ArcheType'ı İK'da eğitim/gelişimi sağlar",
      "Eğitim veren tüm app'ler LMS'i kullanır",
    ],
  },

  "s-onboarding": {
    featureDefs: [
      "İşe Başlatma (Onboarding): yeni çalışan görev listesi, hesap/erişim açma ve oryantasyon",
      "Belge toplama (sözleşme/özlük), ekipman tahsisi ve zorunlu eğitim atama",
      "İlk gün/ilk hafta akışı ve sorumlu atamaları",
    ],
    security: [
      "Onboarding belgeleri (sözleşme/TCKN) hassas PII; korumalı",
      "Erişim açma en-az-ayrıcalık (rol bazlı provizyon)",
      "Belge onam/saklama KVKK uyumlu",
    ],
    codeOptimization: [
      "Onboarding görev şablonu (rol/departman) bildirimsel",
      "Görev durum makinesi; ECA ile tetiklenir",
      "Provizyon (hesap/erişim) idempotent",
    ],
    securityOptimization: [
      "Erişim provizyonu onaylı + izli (kim neye erişti)",
      "Belge yükleme doğrulanır (tür/boyut/tarama)",
      "Ekipman tahsisi varlık (asset) kaydına",
    ],
    performance: [
      "Görev listesi şablondan hızlı türetilir",
      "Provizyon adımları asenkron/kuyruklu",
      "İlerleme anlık (projeksiyon)",
    ],
    mobileApps: [
      "Yeni çalışan mobilde onboarding görevleri/belgeleri",
      "iOS/Android push ile görev hatırlatma",
      "Dar ekranda kontrol listesi",
    ],
    wcag: [
      "Onboarding kontrol listesi erişilebilir; durum metinle",
      "Belge yükleme klavye erişimli; hata bildirimli",
      "İlerleme göstergesi kontrast 7:1",
    ],
    deployment: [
      "Onboarding orkestrasyonu standart; provizyon worker",
      "Belge depo (şifreli object storage)",
      "Shared hosting'de temel onboarding",
    ],
    eca: [
      ECA_BOUND,
      "Olay: işe alım tamam → onboarding görevleri+hesap/erişim+zorunlu eğitim oluştur (idempotent, zincir ≤6)",
      "Olay: belge eksik/süre doldu → çalışana+İK'ya hatırlat (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI rol-bazlı onboarding listesi taslağı önerir; erişim/provizyonu İK/IT onaylar",
    ],
    testing: [
      "İşe alım→onboarding→provizyon kullanıcı yolculuğu",
      "Erişim en-az-ayrıcalık + belge doğrulama testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: provizyon en-az-ayrıcalık",
      "A04 Insecure Design: onboarding akışı güvenli varsayılan",
      "A09 Logging: erişim açma kararları iz",
    ],
    integration: [
      "Onboarding, ats (işe alım), hrms (özlük), lms (eğitim), iam (erişim) ile entegre",
      "Ekipman asset/inventory ile; belge dms/file ile",
      "Görev/bildirim scheduling/comms ile",
    ],
    moduleUsage: [
      "Onboarding ArcheType'ı İK'da işe başlatmayı sağlar",
      "Yeni çalışan alan tüm app'ler onboarding'i kullanır",
    ],
  },

  "s-performance": {
    featureDefs: [
      "Performans & Yetkinlik: hedef (OKR/KPI), değerlendirme döngüsü ve geri bildirim",
      "Yetkinlik modeli, 360 derece değerlendirme ve gelişim planı",
      "Performans dönemi ve kalibrasyon",
    ],
    security: [
      "Performans/değerlendirme verisi hassas; erişim dar (çalışan+yönetici+İK)",
      "Geri bildirim gizliliği (360 anonimlik) korunur",
      "Kalibrasyon kararları izli (adil süreç)",
    ],
    codeOptimization: [
      "Değerlendirme döngüsü durum makinesi; hedef hiyerarşisi",
      "Yetkinlik modeli bildirimsel (rol-bazlı)",
      "Geri bildirim toplama (360) asenkron",
    ],
    securityOptimization: [
      "Değerlendirme erişimi rol+ilişki kapsamlı (kimin kimi gördüğü)",
      "Anonim geri bildirim ayrıştırılamaz tutulur",
      "Kalibrasyon değişikliği izli",
    ],
    performance: [
      "Hedef/değerlendirme sorgusu indeksli",
      "Dönem-sonu toplu hesap asenkron",
      "Geri bildirim toplama kuyruklu",
    ],
    mobileApps: [
      "Mobilde hedef takip + geri bildirim verme",
      "iOS/Android push ile değerlendirme hatırlatma",
      "Dar ekranda hedef/ilerleme",
    ],
    wcag: [
      "Değerlendirme formu erişilebilir; alan-etiket ilişkili",
      "Skor/derece renk dışında metinle; kontrast 7:1",
      "Geri bildirim girişi klavye erişimli",
    ],
    deployment: [
      "Performans servisi standart; dönem-sonu worker",
      "Bildirim/hatırlatma scheduling ile",
      "Shared hosting'de temel performans",
    ],
    eca: [
      ECA_BOUND,
      "Olay: değerlendirme dönemi açıldı → ilgililere değerlendirme görevi ata (idempotent, zincir ≤6)",
      "Olay: değerlendirme tamam → gelişim planı/LMS atama öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI geri bildirim özeti/gelişim önerisi üretir; performans kararını yönetici+İK verir",
    ],
    testing: [
      "Hedef→değerlendirme→kalibrasyon kullanıcı yolculuğu",
      "360 anonimlik + erişim kapsamı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: değerlendirme erişimi ilişki kapsamlı",
      "A02 Cryptographic Failures: anonim geri bildirim korunur",
      "A09 Logging: kalibrasyon kararları iz (adil süreç)",
    ],
    integration: [
      "Performance, hrms (özlük), lms (gelişim), party (çalışan) ile entegre",
      "Hedef (OKR) strateji/proje ile hizalanır",
      "Sonuç payroll (prim) için girdi olabilir (insan onaylı)",
    ],
    moduleUsage: [
      "Performance & Competency ArcheType'ı İK'da performans yönetimini sağlar",
      "Performans değerlendiren tüm app'ler bunu kullanır",
    ],
  },

  "s-workforce": {
    featureDefs: [
      "Vardiya & İş Gücü Planlama: vardiya takvimi, kapsama (coverage) ve devam (attendance)",
      "Vardiya değişim/talep, fazla mesai ve yasal çalışma süresi kuralları (TR)",
      "İş gücü talebine göre çizelgeleme",
    ],
    security: [
      "Vardiya/devam verisi çalışan PII; tenant izolasyonu",
      "Konum/giriş-çıkış verisi (varsa) korunur",
      "Fazla mesai/çalışma süresi yasal denetlenebilir",
    ],
    codeOptimization: [
      "Çizelgeleme kısıt-tabanlı (kapsama/yasal limit); scheduling ile",
      "Devam durum makinesi; vardiya değişim akışı",
      "Yasal çalışma kuralı (TR) bildirimsel",
    ],
    securityOptimization: [
      "Vardiya onayı rol kapsamlı (yönetici)",
      "Giriş-çıkış kaydı değişmez (audit)",
      "Fazla mesai limiti zorlanır (yasal)",
    ],
    performance: [
      "Çizelge hesabı asenkron (kısıt çözücü)",
      "Devam/vardiya sorgusu indeksli",
      "Kapsama projeksiyondan anlık",
    ],
    mobileApps: [
      "Mobilde vardiya görüntüleme + değişim talebi + giriş-çıkış",
      "iOS/Android push ile vardiya hatırlatma",
      "Dar ekranda vardiya takvimi",
    ],
    wcag: [
      "Vardiya takvimi erişilebilir (klavye/okuyucu)",
      "Vardiya durumu renk dışında metinle; kontrast 7:1",
      "Değişim talebi formu erişilebilir",
    ],
    deployment: [
      "Workforce servisi standart; çizelge çözücü worker",
      "Giriş-çıkış (terminal/mobil) entegrasyonu",
      "Shared hosting'de temel vardiya",
    ],
    eca: [
      ECA_BOUND,
      "Olay: vardiya değişim talebi → onay akışı + kapsama yeniden kontrol (idempotent, zincir ≤6)",
      "Olay: fazla mesai limiti aşıldı → uyarı + onay gerektir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI talep tahmini/optimum çizelge önerir; vardiya kararını yönetici onaylar",
    ],
    testing: [
      "Çizelgeleme + vardiya değişim + devam kullanıcı yolculuğu",
      "Yasal çalışma süresi/fazla mesai limit testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: vardiya/devam erişimi rol bazlı",
      "A04 Insecure Design: yasal limit güvenli varsayılan",
      "A09 Logging: giriş-çıkış/vardiya değişmez iz",
    ],
    integration: [
      "Workforce, hrms (özlük), payroll (mesai→bordro), scheduling (takvim) ile entegre",
      "Devam verisi payroll'a girdi",
      "Talep tahmini operasyon/satış ile",
    ],
    moduleUsage: [
      "Shift/Workforce Planning ArcheType'ı İK'da vardiya/çizelgeyi sağlar",
      "Vardiyalı çalışan yöneten tüm app'ler bunu kullanır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-hr] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-hr] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
