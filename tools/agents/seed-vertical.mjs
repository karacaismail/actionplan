#!/usr/bin/env node
/**
 * seed-vertical — Faz B15 (Cowork tek-ajan). vertical (Dikey/Sektörel ArcheType'lar: klinik, okul, SGK teşvik,
 * legaltech, üyelik, gayrimenkul, restoran) kümesinin 12 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut
 * içeriği uygular (provenance="swarm"). Her sektör yatay yetenekleri (party/finance/scheduling/file) yeniden
 * kullanan bir BİLEŞİM'dir; sektöre özel uyum (sağlık/eğitim/SGK/hukuk) vurgulu.
 * Doğrula: node tools/agents/check-content.mjs vertical  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");
const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const xdim = (P, what) => ({
  featureDefs: [`${P}: ${what}`, `${P} üst sektörel ArcheType'ın alt-detayı; tek sorumluluk`, `${P} örnek dal — granülerlikteki yerini gösterir`],
  security: [`${P} üst ArcheType tenant izolasyonuna uyar`, `${P} sektörel hassas veri sınırda korunur`, `${P} kişisel/özel-kategori veri üst katmanda maskelenir`],
  codeOptimization: [`${P} saf/idempotent tasarlanır`, `${P} üst seviyeyle tipli arayüz`, `${P} tekrar eden mantık paylaşılan yardımcıya`],
  securityOptimization: [`${P} en az ayrıcalıkla çalışır`, `${P} girdi normalizasyonu ile enjeksiyon daraltılır`, `${P} değişikliği sürümlü`],
  performance: [`${P} çıktısı önbelleklenebilir`, `${P} tembel başlatılır`, `${P} küçük serileştirilebilir çıktı`],
  mobileApps: [`${P} UI'si varsa mobilde tek sütun`, `${P} iOS/Android içinde bağımsız çalışabilir`, `${P} dar ekranda okunur`],
  wcag: [`${P} etkileşimi klavye erişimli ve adlandırılmış`, `${P} durumu metinle bildirilir (kontrast 7:1)`, `${P} hata mesajı ilişkilendirilmiş`],
  deployment: [`${P} üst ArcheType ile dağıtılır`, `${P} üst yetenekle ölçeklenir`, `${P} shared hosting'de istemci-içi çalışabilir`],
  eca: [ECA_BOUND, `${P} girdisi geçersiz → sınırda reddet + üst akışa hata (idempotent, zincir ≤6)`, `${P} bağımsız otomasyon tutmaz; üst kurala bağlanır`],
  aiAgents: [AI_B1, AI_B2, `${P} tarifini AI önerebilir; sektörel kararı insan verir`],
  testing: [`${P} için birim + üst sözleşme entegrasyon testi`, `${P} sınır/erişilebilirlik mikro-yolculuğu`, "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır"],
  owasp: [`${P}: A03 girdi sınırda doğrulanır`, `${P}: A04 en-az-ayrıcalık tasarım`, `${P}: kabul/red izlenir`],
  integration: [`${P} üst sektörel ArcheType'a tipli arayüzle bağlanır`, `${P} sözleşmeyi tüketir`, `${P} çıktısı üst akışta kullanılır`],
  moduleUsage: [`${P} bağımsız sunulmaz; üst sektörel ArcheType içinde kullanılır`],
});

const CONTENT = {
  "app-vertical": {
    featureDefs: [
      "Dikey/Sektörel ürün ailesi: belirli bir sektörün uçtan uca iş akışını paketleyen ArcheType'lar (klinik, okul, hukuk, gayrimenkul, restoran, üyelik, SGK teşvik)",
      "Her dikey, yatay yetenekleri (party/finance/scheduling/file/comms) sektöre özel kurallarla birleştirir",
      "Sektörel uyum (sağlık/eğitim/hukuk mevzuatı) ve sektöre özel terim/akış",
    ],
    security: [
      "Her dikey kendi sektörünün hassas verisini taşır (sağlık/öğrenci/müvekkil); en yüksek koruma + tenant izolasyonu",
      "Sektörel mevzuat (KVKK özel-kategori, sağlık/eğitim gizliliği) zorunlu",
      "Sektöre özel erişim rolleri (hekim/öğretmen/avukat) ve denetim izi",
    ],
    codeOptimization: [
      "Dikeyler ortak yatay ArcheType'ları (party/finance) yeniden kullanır; yalnız sektörel fark kodlanır",
      "Sektörel iş akışı durum makinesi; ortak motor paylaşılır",
      "Sektörel alan (field) ve kural eklentisi bildirimsel",
    ],
    securityOptimization: [
      "Sektörel hassas veri en-az-ayrıcalık + maskeleme",
      "Mevzuat saklama/silme politikası sektöre göre",
      "Sektörel onam (hasta/veli/müvekkil) yönetimi",
    ],
    performance: [
      "Ortak yatay yetenekler önbelleklenir; sektörel sorgu indeksli",
      "Sektörel toplu işlem (dönem/randevu) asenkron",
      "Sektörel rapor projeksiyondan",
    ],
    mobileApps: [
      "Her dikeyin saha/self-servis mobil arayüzü (hasta/öğrenci/müvekkil)",
      "iOS/Android push ile sektörel bildirim (randevu/ödev/duruşma)",
      "Dar ekranda sektörel kayıt kartı",
    ],
    wcag: [
      "Sektörel ekranlar WCAG 2.2 AAA (erişilebilirlik sektörden bağımsız zorunlu)",
      "Durum renk dışında metinle; kontrast 7:1",
      "Klavye + ekran okuyucu (engelli kullanıcı/hasta erişimi)",
    ],
    deployment: [
      "Dikey servisleri yatay ölçek; sektörel dış entegrasyon (e-okul/MERNIS/SGK/UYAP)",
      "Sektörel veri ikameti (TR sağlık/eğitim gerekiyorsa)",
      "Shared hosting'de küçük işletme dikeyi (klinik/restoran)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sektörel iş olayı (randevu/kayıt/sipariş) → ilgili akışı başlat (idempotent, zincir ≤6)",
      "Olay: mevzuat süresi (saklama/teşvik) doldu → sektörel uyarı/arşiv (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sektörel öneri (randevu/teşvik/dava özeti) üretir; sektörel kararı (teşhis/karar/atama) yetkili insan verir",
    ],
    testing: [
      "Her dikeyin uçtan uca sektörel yolculuğu (kayıt→hizmet→faturalandırma)",
      "Sektörel mevzuat uyum + hassas veri erişim testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: sektörel hassas veri rol bazlı",
      "A02 Cryptographic Failures: sağlık/müvekkil verisi korunur",
      "A09 Logging: sektörel kritik kararlar forensic iz",
    ],
    integration: [
      "Dikeyler party (müşteri/hasta/öğrenci), finance (fatura/tahsilat), scheduling (randevu) ile entegre",
      "Sektörel dış sistem (e-okul/SGK/UYAP/MERNIS) ile",
      "Belge file/dms, iletişim comms ile",
    ],
    moduleUsage: [
      "Dikey/Sektörel app'i sektöre özel ArcheType'ları barındırır",
      "Belirli sektöre hizmet veren tüm app'ler ilgili dikey sözleşmesini tüketir",
    ],
  },

  "app-vertical-x-stone": xdim("Dikey Taşı", "bir sektörel yeteneğin alt-parça tarifi (ör. randevu çakışma kontrolü)"),
  "app-vertical-x-molecule": xdim("Dikey Molekülü", "birkaç sektörel kuralı birleştiren bileşen (ör. hasta kayıt formu)"),
  "app-vertical-x-element": xdim("Dikey Elementi", "tek bir sektörel alan/kural (ör. TC kimlik doğrulama)"),
  "app-vertical-x-atom": xdim("Dikey Atomu", "bölünemez sektörel ilkel (ör. randevu zaman aralığı değer nesnesi)"),

  "s-clinic": {
    featureDefs: [
      "Sağlık/Klinik: hasta kaydı, randevu, muayene/tedavi notu, reçete ve klinik faturalandırma",
      "Hasta dosyası (anamnez/tanı/tedavi), randevu takvimi ve hekim yönetimi",
      "Klinik stok (ilaç/sarf) ve hasta iletişimi",
    ],
    security: [
      "Sağlık verisi KVKK özel-kategori; en yüksek koruma + maskeleme + tenant izolasyonu",
      "Hasta dosyasına erişim hekim-hasta ilişkisi kapsamlı; her erişim izli",
      "Hasta onamı (tedavi/veri işleme) ve veri-hakları yönetilir",
    ],
    codeOptimization: [
      "Randevu çakışma kontrolü; muayene durum makinesi (kayıt→muayene→reçete→fatura)",
      "Hasta dosyası kronolojik; ortak party/scheduling yeniden kullanılır",
      "Reçete/tanı kodları (ICD) bildirimsel",
    ],
    securityOptimization: [
      "Sağlık verisi şifreli + saklama politikası (mevzuat)",
      "Erişim en-az-ayrıcalık (hekim≠resepsiyon≠muhasebe)",
      "Hassas işlem (dosya açma) step-up + izli",
    ],
    performance: [
      "Randevu/hasta sorgusu indeksli",
      "Hasta dosyası tembel/sayfalı yükleme",
      "Klinik raporu projeksiyondan",
    ],
    mobileApps: [
      "Hasta mobilde randevu alma + sonuç görüntüleme (güvenli)",
      "iOS/Android push ile randevu hatırlatma",
      "Dar ekranda hasta/randevu kartı",
    ],
    wcag: [
      "Klinik ekranları WCAG 2.2 AAA (yaşlı/engelli hasta erişimi)",
      "Randevu/sonuç durumu renk dışında metinle; kontrast 7:1",
      "Form klavye erişimli; hata mesajı ilişkili",
    ],
    deployment: [
      "Klinik servisi standart; e-Nabız/MEDULA entegrasyonu (gerekiyorsa)",
      "TR sağlık verisi ikameti; şifreli depo",
      "Shared hosting'de küçük klinik (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: randevu alındı → onay + hatırlatma planla; muayene bitti → reçete/fatura akışı (idempotent, zincir ≤6)",
      "Olay: hasta verisi saklama süresi doldu → mevzuata göre arşiv/anonimleştir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI randevu önerisi/dosya özeti üretir; teşhis ve tedavi kararını hekim verir (klinik sorumluluk insanda)",
    ],
    testing: [
      "Hasta kayıt→randevu→muayene→fatura uçtan uca yolculuğu",
      "Sağlık verisi erişim kapsamı + onam + saklama testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: hasta dosyası hekim-hasta ilişkisi kapsamlı",
      "A02 Cryptographic Failures: sağlık verisi şifreli",
      "A09 Logging: dosya erişimleri forensic iz (kim hangi hastayı açtı)",
    ],
    integration: [
      "Klinik, party (hasta), scheduling (randevu), billing (fatura), inventory (ilaç stok) ile entegre",
      "e-Nabız/MEDULA/SGK dış sistemle (gerekiyorsa)",
      "Hasta iletişimi comms ile",
    ],
    moduleUsage: [
      "Health/Clinic ArcheType'ı sağlık hizmeti veren app'lerde kullanılır",
      "Klinik/poliklinik yöneten tüm app'ler bu dikeyi temel alır",
    ],
  },

  "s-education": {
    featureDefs: [
      "Okul Yönetimi: öğrenci kaydı, sınıf/şube, devamsızlık, not/karne ve veli iletişimi",
      "Ders programı, öğretmen yönetimi ve ödev/sınav takibi",
      "Okul ücreti (tahsilat) ve etkinlik/duyuru",
    ],
    security: [
      "Öğrenci verisi (reşit olmayan) hassas PII; ekstra koruma + tenant izolasyonu",
      "Veli erişimi yalnız kendi öğrencisi kapsamlı; her erişim izli",
      "Öğrenci/veli onamı ve veri saklama (mezuniyet sonrası) yönetilir",
    ],
    codeOptimization: [
      "Devamsızlık/not durum makinesi; ders programı çizelgeleme (scheduling)",
      "Öğrenci-sınıf-veli ilişkisi party üzerinden",
      "Not hesabı/karne şablonu bildirimsel",
    ],
    securityOptimization: [
      "Öğrenci verisi en-az-ayrıcalık (öğretmen kendi sınıfı)",
      "Veli erişimi ilişki kapsamlı; yanlış-eşleşme engellenir",
      "Hassas not/davranış kaydı erişimi dar + izli",
    ],
    performance: [
      "Öğrenci/sınıf sorgusu indeksli",
      "Dönem-sonu not/karne toplu hesap asenkron",
      "Devamsızlık raporu projeksiyondan",
    ],
    mobileApps: [
      "Veli/öğrenci mobilde devamsızlık/not/ödev görüntüleme",
      "iOS/Android push ile devamsızlık/duyuru bildirimi",
      "Dar ekranda öğrenci kartı/program",
    ],
    wcag: [
      "Okul ekranları WCAG 2.2 AAA (öğrenci/veli erişimi)",
      "Not/devamsızlık durumu renk dışında metinle; kontrast 7:1",
      "Form klavye erişimli; ekran okuyucu uyumlu",
    ],
    deployment: [
      "Okul servisi standart; e-Okul/MEB entegrasyonu (gerekiyorsa)",
      "Dönem takvimi worker; veli portalı",
      "Shared hosting'de küçük okul/kurs",
    ],
    eca: [
      ECA_BOUND,
      "Olay: devamsızlık girildi → veliye bildirim + eşik aşımında uyarı (idempotent, zincir ≤6)",
      "Olay: dönem bitti → karne üret + bir sonraki döneme geçiş (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI öğrenci başarı analizi/ders önerisi üretir; not ve disiplin kararını öğretmen/idare verir",
    ],
    testing: [
      "Öğrenci kayıt→devamsızlık→not→karne uçtan uca yolculuğu",
      "Veli erişim kapsamı (yalnız kendi öğrencisi) + reşit-olmayan koruma testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: veli yalnız kendi öğrencisini görür",
      "A02 Cryptographic Failures: öğrenci verisi korunur",
      "A09 Logging: not/devamsızlık değişiklikleri iz",
    ],
    integration: [
      "Okul, party (öğrenci/veli), scheduling (ders programı), billing (ücret) ile entegre",
      "e-Okul/MEB dış sistemle (gerekiyorsa)",
      "Veli iletişimi comms ile",
    ],
    moduleUsage: [
      "School Management ArcheType'ı eğitim kurumu app'lerinde kullanılır",
      "Okul/kurs/dershane yöneten tüm app'ler bu dikeyi temel alır",
    ],
  },

  "s-incentive": {
    featureDefs: [
      "SGK Teşvik Otomasyonu: çalışan/işveren verisinden uygun SGK teşviklerini tespit, hesap ve bildirim taslağı",
      "Teşvik uygunluk kuralları (yasal), geriye dönük tarama ve kazanç hesabı",
      "Teşvik raporu ve SGK bildirim çıktısı",
    ],
    security: [
      "Çalışan/SGK verisi (TCKN/prim) özel-kategori PII; en yüksek koruma + tenant izolasyonu",
      "Teşvik hesabı/sonucu gizli; erişim dar + değişmez audit",
      "SGK verisi saklama/silme mevzuata uygun",
    ],
    codeOptimization: [
      "Teşvik uygunluk motoru kural-tabanlı (yasal kodlar); saf/test edilebilir hesap",
      "Geriye dönük tarama deterministik; ondalık tutar",
      "Teşvik türü/yürürlük sürümlü",
    ],
    securityOptimization: [
      "Teşvik kuralı yürürlük tarihli sürümlenir (yasal değişiklik)",
      "Hesap onaylı + izli (yanlış teşvik = yasal risk)",
      "SGK kimlik bilgisi kasada; erişim en-az-ayrıcalık",
    ],
    performance: [
      "Geriye dönük tarama toplu/asenkron (worker)",
      "Teşvik hesabı önbelleklenir (dönem bazlı)",
      "Büyük çalışan kümesi parçalı işlenir",
    ],
    mobileApps: [
      "Mobilde teşvik özeti/onay görüntüleme",
      "iOS/Android push ile yeni teşvik fırsatı bildirimi",
      "Dar ekranda teşvik kartı",
    ],
    wcag: [
      "Teşvik raporu erişilebilir (yapılandırılmış tablo)",
      "Uygun/uygun-değil renk dışında metinle; kontrast 7:1",
      "Onay aksiyonu klavye erişimli",
    ],
    deployment: [
      "Teşvik motoru worker; SGK/e-bildirge entegrasyonu",
      "Yasal kural tablosu güncel tutulur (yürürlük)",
      "Shared hosting'de küçük işletme teşvik",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni işe alım/dönem → uygun teşvikleri tara + bildirim taslağı üret (idempotent, zincir ≤6)",
      "Olay: yasal teşvik kuralı değişti → etkilenen dönemleri yeniden değerlendir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI uygun teşvik/optimizasyon önerir; SGK bildirimini ve teşvik kararını yetkili insan onaylar (yasal sorumluluk insanda)",
    ],
    testing: [
      "Teşvik tespit→hesap→bildirim taslağı uçtan uca yolculuğu",
      "Yasal uygunluk kuralı + geriye dönük hesap doğruluk testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: teşvik/SGK verisi çok dar erişim",
      "A02 Cryptographic Failures: TCKN/prim verisi şifreli",
      "A09 Logging: teşvik hesap/bildirim kararları forensic iz",
    ],
    integration: [
      "Teşvik, hrms (özlük), payroll (bordro/prim), party (çalışan) ile entegre",
      "SGK/e-bildirge dış sistemle",
      "Rapor finance/accounting'e",
    ],
    moduleUsage: [
      "SGK Teşvik Otomasyonu ArcheType'ı bordro/İK app'lerinde kullanılır",
      "Türkiye'de çalışan istihdam eden app'ler bu dikeyi kullanabilir",
    ],
  },

  "s-legaltech": {
    featureDefs: [
      "Hukuk Bürosu Yönetimi: dava/dosya yönetimi, duruşma takvimi, müvekkil ve vekalet takibi",
      "Dosya belgeleri, süre/zamanaşımı takibi ve hukuki iş zaman çizelgesi (timesheet)",
      "Vekalet ücreti faturalandırma ve müvekkil iletişimi",
    ],
    security: [
      "Müvekkil/dosya verisi avukat-müvekkil gizliliği kapsamında; en yüksek koruma + tenant izolasyonu",
      "Dosyaya erişim vekalet ilişkisi kapsamlı; çıkar çatışması kontrolü; her erişim izli",
      "Belge bütünlüğü/saklama (zamanaşımı sonrası) mevzuata uygun",
    ],
    codeOptimization: [
      "Dava durum makinesi (açılış→duruşma→karar→kapanış); süre/zamanaşımı hesabı",
      "Duruşma takvimi scheduling; müvekkil/karşı taraf party üzerinden",
      "Belge sürümleme (dms) ile",
    ],
    securityOptimization: [
      "Dosya erişimi en-az-ayrıcalık (sadece ilgili avukat/asistan)",
      "Çıkar çatışması (conflict check) zorlanır",
      "Hassas belge erişimi step-up + izli",
    ],
    performance: [
      "Dosya/duruşma sorgusu indeksli",
      "Süre/zamanaşımı hesabı projeksiyondan",
      "Belge arşivi tembel/sayfalı",
    ],
    mobileApps: [
      "Avukat mobilde dosya/duruşma görüntüleme + timesheet girişi",
      "iOS/Android push ile duruşma/süre hatırlatma",
      "Dar ekranda dosya kartı",
    ],
    wcag: [
      "Hukuk ekranları WCAG 2.2 AAA; belge/dosya erişilebilir",
      "Süre/durum renk dışında metinle; kontrast 7:1",
      "Form klavye erişimli; hata mesajı ilişkili",
    ],
    deployment: [
      "Legaltech servisi standart; UYAP entegrasyonu (gerekiyorsa)",
      "Belge depo (şifreli object storage)",
      "Shared hosting'de küçük hukuk bürosu",
    ],
    eca: [
      ECA_BOUND,
      "Olay: duruşma/süre yaklaştı → ilgili avukata hatırlatma + hazırlık görevi (idempotent, zincir ≤6)",
      "Olay: zamanaşımı kritik eşiği → acil uyarı + sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI dosya özeti/emsal araştırma/dilekçe taslağı önerir; hukuki strateji ve sunum kararını avukat verir (mesleki sorumluluk insanda)",
    ],
    testing: [
      "Dosya açılış→duruşma→süre takibi→faturalandırma uçtan uca yolculuğu",
      "Vekalet erişim kapsamı + çıkar çatışması + zamanaşımı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: dosya vekalet ilişkisi kapsamlı",
      "A02 Cryptographic Failures: müvekkil/belge verisi şifreli",
      "A09 Logging: dosya erişimleri forensic iz (gizlilik)",
    ],
    integration: [
      "Legaltech, party (müvekkil), scheduling (duruşma), billing (vekalet ücreti), dms (belge) ile entegre",
      "UYAP/e-Tebligat dış sistemle (gerekiyorsa)",
      "Timesheet finance'e (faturalandırma)",
    ],
    moduleUsage: [
      "Legal Practice Management ArcheType'ı hukuk bürosu app'lerinde kullanılır",
      "Dava/dosya yöneten tüm app'ler bu dikeyi temel alır",
    ],
  },

  "s-membership": {
    featureDefs: [
      "Üyelik/Dernek Yönetimi: üye kaydı, aidat takibi, etkinlik ve üye iletişimi",
      "Üye yaşam döngüsü (başvuru→onay→aktif→pasif), aidat tahakkuk/tahsilat",
      "Etkinlik/toplantı yönetimi ve üye portalı",
    ],
    security: [
      "Üye verisi PII; tenant izolasyonu + KVKK uyumu",
      "Aidat/ödeme verisi korumalı; erişim rol bazlı",
      "Üye onamı (iletişim/veri işleme) ve veri-hakları yönetilir",
    ],
    codeOptimization: [
      "Üye durum makinesi; aidat tahakkuk periyodik (scheduling)",
      "Üye/etkinlik ilişkisi party üzerinden",
      "Aidat planı/indirim bildirimsel",
    ],
    securityOptimization: [
      "Üye verisi en-az-ayrıcalık (yönetim kurulu kapsamı)",
      "Ödeme verisi PCI-uyumlu sağlayıcıda (kart saklanmaz)",
      "Toplu iletişim onam kapsamlı (spam değil)",
    ],
    performance: [
      "Üye/aidat sorgusu indeksli",
      "Toplu aidat tahakkuk asenkron",
      "Etkinlik katılım projeksiyondan",
    ],
    mobileApps: [
      "Üye mobilde aidat ödeme + etkinlik kaydı + kart görüntüleme",
      "iOS/Android push ile aidat/etkinlik hatırlatma",
      "Dar ekranda üye kartı",
    ],
    wcag: [
      "Üyelik ekranları WCAG 2.2 AAA; üye portalı erişilebilir",
      "Aidat/üyelik durumu renk dışında metinle; kontrast 7:1",
      "Form klavye erişimli; ekran okuyucu uyumlu",
    ],
    deployment: [
      "Üyelik servisi standart; ödeme sağlayıcı entegrasyonu",
      "Aidat tahakkuk worker; üye portalı",
      "Shared hosting'de küçük dernek/kulüp",
    ],
    eca: [
      ECA_BOUND,
      "Olay: aidat dönemi → tahakkuk üret + üyeye bildirim/ödeme bağlantısı (idempotent, zincir ≤6)",
      "Olay: aidat gecikti → hatırlatma + eşikte üyeliği pasife al (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI üye katılım/etkinlik önerisi üretir; üyelik onay ve aidat politikası kararını yönetim verir",
    ],
    testing: [
      "Üye başvuru→onay→aidat→etkinlik uçtan uca yolculuğu",
      "Aidat tahakkuk doğruluk + onam kapsamı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: üye verisi/aidat rol bazlı erişim",
      "A02 Cryptographic Failures: ödeme verisi sağlayıcıda korunur",
      "A09 Logging: üyelik/aidat kararları iz",
    ],
    integration: [
      "Üyelik, party (üye), billing (aidat), scheduling (etkinlik), comms (iletişim) ile entegre",
      "Ödeme sağlayıcı dış sistemle",
      "Aidat finance/accounting'e",
    ],
    moduleUsage: [
      "Membership/Association ArcheType'ı dernek/kulüp/oda app'lerinde kullanılır",
      "Üye/aidat yöneten tüm app'ler bu dikeyi temel alır",
    ],
  },

  "s-property": {
    featureDefs: [
      "Gayrimenkul/Varlık Yönetimi: portföy (daire/işyeri), kira sözleşmesi, tahsilat ve bakım/arıza",
      "Kiracı/mülk sahibi yönetimi, sözleşme yenileme ve kira artış (yasal) hesabı",
      "Bakım talebi (arıza) ve gider/aidat takibi",
    ],
    security: [
      "Kiracı/mülk sahibi verisi PII + finansal; tenant izolasyonu + KVKK",
      "Sözleşme/ödeme verisi korumalı; erişim rol bazlı",
      "Sözleşme belge bütünlüğü/saklama mevzuata uygun",
    ],
    codeOptimization: [
      "Sözleşme durum makinesi (aktif→yenileme→fesih); kira artış kuralı (yasal/TÜFE) bildirimsel",
      "Kira tahakkuk periyodik (scheduling); mülk/kiracı party üzerinden",
      "Bakım talebi iş akışı (fsm benzeri)",
    ],
    securityOptimization: [
      "Mülk/sözleşme erişimi en-az-ayrıcalık (portföy kapsamı)",
      "Kira artış yasal sınırda (TÜFE tavanı) zorlanır",
      "Ödeme verisi PCI-uyumlu sağlayıcıda",
    ],
    performance: [
      "Portföy/kira sorgusu indeksli",
      "Toplu kira tahakkuk asenkron",
      "Doluluk/tahsilat raporu projeksiyondan",
    ],
    mobileApps: [
      "Kiracı mobilde kira ödeme + arıza bildirimi; mülk sahibi portföy görünümü",
      "iOS/Android push ile kira/bakım hatırlatma",
      "Dar ekranda mülk/sözleşme kartı",
    ],
    wcag: [
      "Gayrimenkul ekranları WCAG 2.2 AAA; portföy erişilebilir",
      "Sözleşme/ödeme durumu renk dışında metinle; kontrast 7:1",
      "Form klavye erişimli; hata mesajı ilişkili",
    ],
    deployment: [
      "Gayrimenkul servisi standart; ödeme/banka entegrasyonu",
      "Kira tahakkuk worker; sözleşme belge depo",
      "Shared hosting'de küçük emlak portföyü",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kira dönemi → tahakkuk üret + kiracıya bildirim; gecikme → hatırlatma (idempotent, zincir ≤6)",
      "Olay: sözleşme yenileme tarihi yaklaştı → yasal kira artışı hesapla + taraflara öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI fiyat/doluluk analizi ve bakım önceliği önerir; kira artışı ve sözleşme kararını mülk sahibi/yönetici verir",
    ],
    testing: [
      "Sözleşme→kira tahakkuk→tahsilat→bakım uçtan uca yolculuğu",
      "Yasal kira artış sınırı + portföy erişim kapsamı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: portföy/sözleşme rol bazlı erişim",
      "A02 Cryptographic Failures: kiracı/ödeme verisi korunur",
      "A09 Logging: sözleşme/tahsilat kararları iz",
    ],
    integration: [
      "Gayrimenkul, party (kiracı/sahip), billing (kira), cmms/fsm (bakım), dms (sözleşme) ile entegre",
      "Ödeme/banka dış sistemle",
      "Kira/gider finance/accounting'e",
    ],
    moduleUsage: [
      "Real Estate/Asset Management ArcheType'ı emlak/varlık app'lerinde kullanılır",
      "Kira/portföy yöneten tüm app'ler bu dikeyi temel alır",
    ],
  },

  "s-restaurant": {
    featureDefs: [
      "Restoran/F&B: menü, masa/sipariş, mutfak (KDS), POS tahsilat ve stok",
      "Masa yönetimi, sipariş akışı (salon/paket/online) ve mutfak ekran sistemi",
      "Reçete-bazlı stok düşümü ve gün-sonu raporu",
    ],
    security: [
      "Müşteri/ödeme verisi korumalı; tenant izolasyonu + KVKK",
      "POS/kasa erişimi rol bazlı (kasiyer≠yönetici); her işlem izli",
      "Kart verisi PCI-uyumlu sağlayıcıda (saklanmaz)",
    ],
    codeOptimization: [
      "Sipariş durum makinesi (alındı→hazırlanıyor→servis→ödendi); masa durumu",
      "Reçete-bazlı stok düşümü; menü/fiyat bildirimsel",
      "Mutfak ekranı (KDS) gerçek-zamanlı (realtime)",
    ],
    securityOptimization: [
      "Kasa/iptal işlemi yetki + izli (suistimal önleme)",
      "Fiyat/indirim değişikliği onaylı + sürümlü",
      "Stok sayım farkı denetlenir",
    ],
    performance: [
      "Sipariş/masa durumu gerçek-zamanlı (düşük gecikme)",
      "Yoğun saatte sipariş kuyruğu; KDS push",
      "Gün-sonu raporu projeksiyondan",
    ],
    mobileApps: [
      "Garson mobilde sipariş alma; müşteri QR menü/online sipariş",
      "iOS/Android push ile mutfak/servis bildirimi",
      "Dar ekranda masa/sipariş kartı",
    ],
    wcag: [
      "Menü/online sipariş WCAG 2.2 AAA (müşteri erişimi)",
      "Sipariş/masa durumu renk dışında metinle; kontrast 7:1",
      "QR menü ekran okuyucu uyumlu",
    ],
    deployment: [
      "Restoran servisi standart; POS/yazarkasa + ödeme entegrasyonu",
      "KDS gerçek-zamanlı kanal; offline-dayanıklı sipariş",
      "Shared hosting'de tek şube restoran",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sipariş verildi → mutfağa (KDS) düş + stok rezerve; ödendi → stok düş + fiş (idempotent, zincir ≤6)",
      "Olay: stok kritik eşik → satın alma önerisi + menü uygunluğu güncelle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI talep tahmini/menü-fiyat ve stok önerisi üretir; menü, fiyat ve satın alma kararını işletme verir",
    ],
    testing: [
      "Sipariş→mutfak→servis→ödeme→stok düşümü uçtan uca yolculuğu",
      "Kasa iptal yetkisi + reçete-bazlı stok doğruluk testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: POS/iptal yetki bazlı",
      "A02 Cryptographic Failures: kart verisi sağlayıcıda korunur",
      "A09 Logging: kasa/iptal işlemleri forensic iz (suistimal)",
    ],
    integration: [
      "Restoran, inventory (stok), billing/POS (tahsilat), scheduling (rezervasyon) ile entegre",
      "Ödeme/yazarkasa dış sistemle; online sipariş kanalları (feed)",
      "Satış finance/accounting'e",
    ],
    moduleUsage: [
      "Restaurant/F&B ArcheType'ı restoran/kafe app'lerinde kullanılır",
      "Sipariş/masa/stok yöneten tüm yeme-içme app'leri bu dikeyi temel alır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-vertical] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-vertical] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
