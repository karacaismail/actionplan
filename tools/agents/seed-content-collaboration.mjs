#!/usr/bin/env node
/**
 * seed-content-collaboration — Faz B12 (Cowork tek-ajan). content-collaboration (içerik & işbirliği:
 * CMS, DMS, wiki, drive, community, event, survey, social) kümesinin 14 ŞABLON düğümüne
 * ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Doğrula: node tools/agents/check-content.mjs content-collaboration  (+ npm run typecheck)
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
  security: [`${P} üst ArcheType tenant izolasyonuna uyar`, `${P} girdisi sınırda doğrulanır`, `${P} hassas/paylaşım verisi yetkiyle`],
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
  "app-content-collaboration": {
    featureDefs: [
      "İçerik & İşbirliği ürün ailesi: CMS, belge (DMS), wiki, drive, topluluk, etkinlik ve anket",
      "İçerik üretimi, paylaşım, sürümleme ve ekip işbirliği",
      "Ortak belge/erişim (ReBAC) ve arama sözleşmesini paylaşan dikey",
    ],
    security: [
      "İçerik/belge tenant_id RLS; paylaşım ReBAC (sahip/ekip/bağlantı)",
      "Hassas belge şifreli; erişim audit'li",
      "İçerik moderasyonu (topluluk/yorum)",
    ],
    codeOptimization: [
      "İçerik ArcheType'ları ortak belge/erişim sözleşmesini paylaşır",
      "Sürümleme + arama (search) modülüyle",
      "Medya file modülünden",
    ],
    securityOptimization: [
      "Paylaşım bağlantısı süre-sınırlı + yetkili",
      "İçerik enjeksiyonu (XSS) sanitize",
      "Erişim değişikliği izli",
    ],
    performance: [
      "İçerik okuma-yoğun; CDN + önbellek",
      "Arama hibrit (BM25+vektör)",
      "Eşzamanlı düzenleme (CRDT) opsiyon",
    ],
    mobileApps: [
      "Mobilde içerik tüketimi/düzenleme ve dosya",
      "iOS/Android offline taslak + senkron",
      "Dar ekranda içerik/paylaşım",
    ],
    wcag: [
      "İçerik editörü ve görüntüleyici WCAG 2.2 AAA",
      "Medyaya alt-metin zorunlu; kontrast 7:1",
      "Klavye + ekran okuyucu erişimi",
    ],
    deployment: [
      "İçerik servisleri ölçeklenir; medya nesne deposu+CDN",
      "Arama ayrı servis",
      "Shared hosting'de temel CMS/belge (arama kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: içerik paylaşıldı → erişim ver + ilgilileri bildir (idempotent, zincir ≤6)",
      "Olay: içerik değişti → sürüm + arama indeksi güncelle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI içerik özeti/öneri (RAG) üretir; yayını/erişimi insan yönetir",
    ],
    testing: [
      "Paylaşım/erişim (ReBAC) + sürümleme kullanıcı yolculuğu",
      "İçerik XSS + erişilebilirlik testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: ReBAC paylaşım yetkisi",
      "A03 Injection: içerik render-güvenli",
      "A09 Logging: erişim/paylaşım kararları forensic iz",
    ],
    integration: [
      "İçerik & İşbirliği, file (medya), search (arama), notification (paylaşım) ile entegre",
      "RAG kurumsal bilgi için içeriği kullanır",
      "Belge esign (imza) ile",
    ],
    moduleUsage: [
      "İçerik & İşbirliği app'i içerik/belge ArcheType'larını barındırır",
      "İçerik üreten/paylaşan tüm app'ler bu sözleşmeyi tüketir",
    ],
  },

  "app-content-collaboration-x-stone": xdim("İçerik & İşbirliği Taşı", "bir içerik yeteneğinin alt-parça tarifi (ör. sürüm farkı)"),
  "app-content-collaboration-x-molecule": xdim("İçerik & İşbirliği Molekülü", "birkaç içerik kuralını birleştiren bileşen (ör. paylaşım izni)"),
  "app-content-collaboration-x-element": xdim("İçerik & İşbirliği Elementi", "tek bir içerik alanı/kuralı (ör. erişim seviyesi)"),
  "app-content-collaboration-x-atom": xdim("İçerik & İşbirliği Atomu", "bölünemez içerik ilkeli (ör. belge kimliği değer nesnesi)"),

  "s-cms": {
    featureDefs: [
      "CMS Stack: yapısal içerik (içerik tipi/alan), çok-kanal yayın ve sürümleme (headless)",
      "İçerik modelleme, taslak/yayın iş akışı ve önizleme",
      "Çok-dilli içerik ve planlı yayın",
    ],
    security: [
      "İçerik tenant_id RLS; yayın yetkisi rol bazlı",
      "Önizleme bağlantısı süre-sınırlı + token",
      "İçerik enjeksiyonu (XSS) sanitize",
    ],
    codeOptimization: [
      "İçerik tipi şema-temelli (headless API); çok-kanal yayın",
      "Taslak/yayın durum makinesi; sürümleme",
      "İçerik teslimi CDN+önbellek",
    ],
    securityOptimization: [
      "Yayın onaylı; planlı yayın izli",
      "Çok-dilli içerik sanitize",
      "Önizleme yetkisiz erişime kapalı",
    ],
    performance: [
      "İçerik okuma CDN'den; yayın fark-temelli",
      "Önizleme anlık; arama indeksli",
      "Görsel responsive/optimize",
    ],
    mobileApps: [
      "Mobilde içerik düzenleme/onay",
      "iOS/Android'de yayın durumu",
      "Dar ekranda içerik kartı",
    ],
    wcag: [
      "İçerik editörü erişilebilir; medyaya alt-metin zorunlu",
      "Yayın durumu renk dışında metinle; kontrast 7:1",
      "Üretilen sayfa WCAG AAA",
    ],
    deployment: [
      "Headless CMS API + CDN; önizleme ayrı",
      "Çok-kanal yayın (web/mobil/AEO)",
      "Shared hosting'de SSG yayın (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: içerik yayınlandı → kanallara dağıt + sitemap/SEO güncelle (idempotent, zincir ≤6)",
      "Olay: planlı yayın zamanı → otomatik yayınla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI içerik taslağı/SEO/çeviri önerir; yayını editör onaylar",
    ],
    testing: [
      "İçerik tipi/şema + yayın iş akışı testi",
      "Önizleme yetki + XSS testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: yayın/önizleme yetkisi",
      "A03 Injection: içerik render-güvenli",
      "A09 Logging: yayın kararları iz",
    ],
    integration: [
      "CMS, seo/sitemap (keşfedilebilirlik), file (medya), i18n ile entegre",
      "Programmatic SEO içeriği CMS'ten",
      "Çok-kanal AEO ile",
    ],
    moduleUsage: [
      "CMS Stack ArcheType'ı İçerik & İşbirliği'nde içerik yönetimini sağlar",
      "Web/içerik app'leri CMS'i kullanır",
    ],
  },

  "s-dms": {
    featureDefs: [
      "Belge Yönetimi (DMS): belge depolama, sürümleme, sınıflandırma ve yaşam döngüsü (retention)",
      "Klasör/etiket, tam-metin arama, onay ve saklama politikası",
      "Belge erişim kontrolü ve denetim izi",
    ],
    security: [
      "Belge tenant_id RLS + ReBAC; hassas belge şifreli (at-rest)",
      "Erişim/indirme audit'li; süre-sınırlı paylaşım",
      "Saklama/silme politikası (KVKK)",
    ],
    codeOptimization: [
      "Belge sürümleme + metadata; tam-metin arama (search)",
      "Sınıflandırma (PII/gizli) bayrakla; retention bildirimsel",
      "Büyük belge parçalı (file modülü)",
    ],
    securityOptimization: [
      "Sınıflandırma erişim politikasını belirler",
      "Saklama süresi sonu otomatik silme/arşiv",
      "Paylaşım bağlantısı dar kapsam + süre",
    ],
    performance: [
      "Belge araması full-text indeksli",
      "Önizleme/küçük-resim asenkron",
      "İndirme CDN/nesne deposundan",
    ],
    mobileApps: [
      "Mobilde belge görüntüleme/yükleme/imza",
      "iOS/Android offline belge önbelleği",
      "Dar ekranda belge önizleme",
    ],
    wcag: [
      "Belge listesi/önizleme klavye+okuyucu erişimli",
      "Sınıflandırma renk dışında metinle; kontrast 7:1",
      "PDF erişilebilir etiketlerle",
    ],
    deployment: [
      "DMS belge nesne deposu (şifreli) + arama servisi",
      "Retention/silme worker",
      "Shared hosting'de temel belge (arama kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: belge yüklendi → sınıflandır + indeksle + retention ayarla (idempotent, zincir ≤6)",
      "Olay: saklama süresi doldu → arşivle/sil (politika) (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI belge sınıflandırma/özet (doc-matching/RAG) önerir; erişim/saklama kuralını insan yönetir",
    ],
    testing: [
      "Sınıflandırma + retention/silme akış testi",
      "Erişim (ReBAC) + paylaşım yetki testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: belge erişimi ReBAC",
      "A02 Cryptographic Failures: hassas belge at-rest şifreli",
      "A09 Logging: erişim/indirme forensic iz",
    ],
    integration: [
      "DMS, file (depo), search (arama), esign (imza), doc-matching (çıkarım) ile entegre",
      "RAG kurumsal bilgi için belgeleri kullanır",
      "Retention privacy (KVKK) ile",
    ],
    moduleUsage: [
      "DMS ArcheType'ı İçerik & İşbirliği'nde belge yönetimini sağlar",
      "Belge tutan tüm app'ler DMS'i kullanır",
    ],
  },

  "s-wiki": {
    featureDefs: [
      "Wiki / Bilgi Bankası: yapılandırılmış bilgi, sayfa hiyerarşisi, sürümleme ve işbirlikçi düzenleme",
      "Bağlantılı sayfalar, etiket, arama ve onaylı/topluluk içeriği",
      "Bilgi tabanı (KB) ve self-servis destek",
    ],
    security: [
      "Wiki sayfası tenant_id RLS; düzenleme/görüntüleme yetkisi",
      "Sürüm geçmişi değişmez; içerik sanitize",
      "Gizli alan (space) erişim kontrollü",
    ],
    codeOptimization: [
      "Sayfa sürümleme + diff; bağlantı grafı",
      "Eşzamanlı düzenleme (CRDT) opsiyon",
      "Arama hibrit (BM25+vektör) + RAG",
    ],
    securityOptimization: [
      "İçerik enjeksiyonu (XSS) sanitize",
      "Düzenleme onayı (gerekirse); vandalizm geri-alma",
      "Erişim değişikliği izli",
    ],
    performance: [
      "Wiki okuma-yoğun; CDN+önbellek",
      "Arama indeksli; bağlantı grafı budamalı",
      "Diff anlık",
    ],
    mobileApps: [
      "Mobilde wiki okuma + hızlı düzenleme",
      "iOS/Android offline okuma önbelleği",
      "Dar ekranda sayfa/arama",
    ],
    wcag: [
      "Wiki içeriği başlık hiyerarşisiyle (okuyucu); klavye gezinme",
      "Bağlantılar adlandırılmış; kontrast 7:1",
      "Diff renk dışında işaretle",
    ],
    deployment: [
      "Wiki servisi + arama; içerik CDN",
      "RAG için vektör indeks",
      "Shared hosting'de temel wiki",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sayfa değişti → sürüm + arama/RAG indeksi güncelle (idempotent, zincir ≤6)",
      "Olay: vandalizm/spam tespit → geri-al + işaretle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bilgi özeti/RAG yanıtı ve eksik-içerik önerir; yayını insan onaylar",
    ],
    testing: [
      "Sürümleme/diff + bağlantı grafı testi",
      "Erişim/düzenleme yetki + RAG kalite testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: space/sayfa erişimi",
      "A03 Injection: wiki içeriği sanitize",
      "A09 Logging: düzenleme/geri-alma iz",
    ],
    integration: [
      "Wiki, search (arama), rag (bilgi yanıtı), helpdesk (KB) ile entegre",
      "İçerik file (medya) ile",
      "RAG kurumsal bilgi asistanına kaynak",
    ],
    moduleUsage: [
      "Wiki / KB ArcheType'ı İçerik & İşbirliği'nde bilgi tabanını sağlar",
      "Bilgi paylaşan tüm app'ler wiki'yi kullanır",
    ],
  },

  "s-drive": {
    featureDefs: [
      "Drive + İşbirliği Stack: dosya/klasör paylaşımı, eşzamanlı çalışma ve yorum",
      "Paylaşılan sürücü, sürüm, paylaşım bağlantısı ve çevrimdışı senkron",
      "Belge önizleme ve birlikte düzenleme",
    ],
    security: [
      "Dosya/klasör tenant_id RLS + ReBAC; paylaşım bağlantısı süre-sınırlı",
      "Hassas dosya şifreli; erişim audit'li",
      "Dış paylaşım yetkili + izlenebilir",
    ],
    codeOptimization: [
      "Senkron çakışma çözümü (son-yazan/CRDT); sürümleme",
      "Önizleme/küçük-resim asenkron",
      "Büyük dosya parçalı (file modülü)",
    ],
    securityOptimization: [
      "Paylaşım bağlantısı dar kapsam + iptal edilebilir",
      "Dosya türü allowlist + anti-virüs",
      "Erişim seviyesi (görüntüle/yorum/düzenle) net",
    ],
    performance: [
      "Dosya CDN; senkron fark-temelli (delta)",
      "Önizleme önbellekli",
      "Eşzamanlı düzenleme düşük gecikme",
    ],
    mobileApps: [
      "Mobilde dosya/klasör + kameradan yükleme",
      "iOS/Android offline senkron",
      "Dar ekranda dosya/paylaşım",
    ],
    wcag: [
      "Dosya yönetimi klavye+okuyucu erişimli",
      "Paylaşım durumu renk dışında metinle; kontrast 7:1",
      "Önizleme erişilebilir alternatifle",
    ],
    deployment: [
      "Drive nesne deposu + CDN; senkron servisi",
      "Çevrimdışı servis-worker",
      "Shared hosting'de temel dosya paylaşımı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: dosya paylaşıldı → erişim ver + bildir (idempotent, zincir ≤6)",
      "Olay: dış paylaşım süresi doldu → erişimi kapat (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI dosya sınıflandırma/özet önerir; paylaşım/erişimi insan yönetir",
    ],
    testing: [
      "Paylaşım/erişim (ReBAC) + senkron çakışma testi",
      "Dosya türü/anti-virüs + süreli bağlantı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: dosya paylaşımı ReBAC",
      "A04 Insecure Design: dosya türü/AV tarama",
      "A09 Logging: paylaşım/erişim iz",
    ],
    integration: [
      "Drive, file (depo), dms (belge), notification (paylaşım) ile entegre",
      "Arama search ile; imza esign ile",
      "Eşzamanlı düzenleme realtime ile",
    ],
    moduleUsage: [
      "Drive + İşbirliği ArcheType'ı İçerik & İşbirliği'nde dosya paylaşımını sağlar",
      "Dosya paylaşan tüm app'ler drive'ı kullanır",
    ],
  },

  "s-community": {
    featureDefs: [
      "Topluluk / Forum: üye tartışması, konu/yanıt, oylama (upvote) ve moderasyon",
      "Kategori, etiket, itibar (reputation) ve bildirim",
      "Soru-cevap ve bilgi paylaşımı",
    ],
    security: [
      "Üye/gönderi verisi tenant_id RLS; iletişim izinli",
      "İçerik moderasyonu (spam/taciz); raporlama",
      "Gönderi sanitize (XSS)",
    ],
    codeOptimization: [
      "Konu/yanıt akışı sayfalı; oylama saf hesap",
      "İtibar (reputation) kurallardan",
      "Moderasyon kuyruğu",
    ],
    securityOptimization: [
      "Spam/bot oran-sınırı + moderasyon",
      "Taciz/uygunsuz içerik raporlama + aksiyon",
      "İtibar manipülasyonu (oy şişirme) tespiti",
    ],
    performance: [
      "Forum okuma-yoğun; CDN+önbellek",
      "Akış sonsuz kaydırma (imleç)",
      "Arama indeksli",
    ],
    mobileApps: [
      "Mobilde forum okuma/yanıt + bildirim",
      "iOS/Android push ile yanıt/bahsetme",
      "Dar ekranda konu akışı",
    ],
    wcag: [
      "Forum akışı klavye+okuyucu erişimli (yapılandırılmış)",
      "Oylama/itibar metinle; kontrast 7:1",
      "Yanıt editörü erişilebilir",
    ],
    deployment: [
      "Topluluk servisi ölçeklenir; moderasyon worker",
      "Bildirim notification ile",
      "Shared hosting'de temel forum",
    ],
    eca: [
      ECA_BOUND,
      "Olay: gönderi şüpheli işaretlendi → moderasyon kuyruğuna al (idempotent, zincir ≤6)",
      "Olay: yanıt/bahsetme → ilgiliye bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI spam/taciz skorlama ve yanıt önerisi üretir; moderasyon kararını insan/kural verir",
    ],
    testing: [
      "Oylama/itibar + moderasyon akış testi",
      "Spam/oran-sınır + sanitize testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: gönderi sanitize",
      "A04 Insecure Design: spam/oy-şişirme önleme",
      "A09 Logging: moderasyon kararları iz",
    ],
    integration: [
      "Community, party (üye), notification, search ile entegre",
      "Bilgi wiki/helpdesk ile",
      "İçerik moderasyonu crosscut ile",
    ],
    moduleUsage: [
      "Topluluk / Forum ArcheType'ı İçerik & İşbirliği'nde tartışma sağlar",
      "Topluluk gerektiren app'ler bu ArcheType'ı kullanır",
    ],
  },

  "s-event": {
    featureDefs: [
      "Etkinlik Yönetimi: etkinlik oluşturma, kayıt (registration), bilet ve katılımcı yönetimi",
      "Ajanda/oturum, check-in, sanal/hibrit etkinlik ve yoklama",
      "Bilet satışı ve katılımcı iletişimi",
    ],
    security: [
      "Etkinlik/katılımcı verisi tenant_id RLS; iletişim izinli",
      "Bilet doğrulanabilir (QR + imza); çift-kullanım engellenir",
      "Ödeme PCI-dışı token",
    ],
    codeOptimization: [
      "Kayıt/bilet durum makinesi; kontenjan kontrolü",
      "Check-in QR idempotent (çift giriş yok)",
      "Ajanda/oturum yapılandırılmış",
    ],
    securityOptimization: [
      "Bilet QR imzalı; sahte bilet reddi",
      "Kontenjan eşzamanlı-güvenli (overbooking yok)",
      "İletişim izin-bazlı",
    ],
    performance: [
      "Kayıt zirvesinde kuyruk; bilet üretimi asenkron",
      "Check-in düşük gecikme",
      "Katılımcı listesi indeksli",
    ],
    mobileApps: [
      "Mobilde bilet (cüzdan) + check-in tarama",
      "iOS/Android push ile etkinlik hatırlatma",
      "Dar ekranda ajanda",
    ],
    wcag: [
      "Kayıt/ajanda klavye+okuyucu erişimli",
      "Bilet QR'a metin alternatifi; kontrast 7:1",
      "Check-in erişilebilir",
    ],
    deployment: [
      "Etkinlik servisi ölçeklenir (kayıt zirvesi HPA)",
      "Bilet/QR üretici worker; sanal etkinlik medya",
      "Shared hosting'de temel etkinlik",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kayıt tamamlandı → bilet üret + onay/hatırlatma (idempotent, zincir ≤6)",
      "Olay: kontenjan doldu → bekleme listesi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI katılım tahmini/ajanda önerir; kayıt/bilet kararını organizatör/katılımcı verir",
    ],
    testing: [
      "Kontenjan eşzamanlı (overbooking yok) + bilet QR testi",
      "Check-in idempotency (çift giriş yok) testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: etkinlik/katılımcı erişimi",
      "A08 Integrity: bilet QR imzalı",
      "A09 Logging: kayıt/check-in iz",
    ],
    integration: [
      "Event, party (katılımcı), payment (bilet), notification ile entegre",
      "Sanal etkinlik comms ile",
      "Bilet finance'a (gelir)",
    ],
    moduleUsage: [
      "Etkinlik Yönetimi ArcheType'ı İçerik & İşbirliği'nde etkinlik sağlar",
      "Etkinlik düzenleyen app'ler bu ArcheType'ı kullanır",
    ],
  },

  "s-pms": {
    featureDefs: [
      "PMS Stack — portal/yayın yönetimi: intranet/portal, sayfa düzeni, widget ve kişiselleştirilmiş içerik",
      "Rol-bazlı portal, duyuru/akış ve içerik bileşenleri (widget)",
      "Çok-kitle portal varyantları",
    ],
    security: [
      "Portal içeriği tenant_id RLS; rol-bazlı görünürlük",
      "Widget veri kaynağı yetkili; içerik sanitize",
      "Kişiselleştirme PII-min",
    ],
    codeOptimization: [
      "Portal düzeni bildirimsel (widget grid); kişiselleştirme kurallardan",
      "Widget veri tembel/önbellekli",
      "Sayfa kompozisyonu yapılandırılmış",
    ],
    securityOptimization: [
      "Widget allowlist; üçüncü-taraf widget sandbox",
      "Rol-bazlı içerik sızıntısı engellenir",
      "Portal yapılandırma sürümlü",
    ],
    performance: [
      "Portal sayfası önbellekli; widget paralel yüklenir",
      "Kişiselleştirme anlık (rol/segment)",
      "İlk-yük bütçesi",
    ],
    mobileApps: [
      "Mobil portal duyarlı; widget tek sütun",
      "iOS/Android'de portal akışı",
      "Dar ekranda öncelikli widget",
    ],
    wcag: [
      "Portal/widget klavye+okuyucu erişimli; landmark'lı",
      "Widget durumu renk dışında metinle; kontrast 7:1",
      "Kişiselleştirme erişilebilirliği bozmaz",
    ],
    deployment: [
      "Portal servisi standart; widget veri kaynakları entegrasyonlu",
      "İçerik CDN",
      "Shared hosting'de temel portal",
    ],
    eca: [
      ECA_BOUND,
      "Olay: duyuru yayınlandı → ilgili kitleye portal akışında göster + bildir (idempotent, zincir ≤6)",
      "Olay: rol değişti → portal görünürlüğünü güncelle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI içerik/widget kişiselleştirme önerir; portal yapılandırmasını insan onaylar",
    ],
    testing: [
      "Rol-bazlı görünürlük + widget veri testi",
      "Kişiselleştirme + erişilebilirlik testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: rol-bazlı portal içeriği",
      "A03 Injection: widget içeriği sanitize",
      "A05 Misconfiguration: widget allowlist",
    ],
    integration: [
      "PMS portal, cms (içerik), iam (rol), notification (duyuru) ile entegre",
      "Widget'lar diğer ArcheType verisini gösterir (yetkili)",
      "Kişiselleştirme analytics ile",
    ],
    moduleUsage: [
      "PMS Stack ArcheType'ı İçerik & İşbirliği'nde portal/intranet sağlar",
      "Portal/intranet gerektiren app'ler bu ArcheType'ı kullanır",
    ],
  },

  "s-social": {
    featureDefs: [
      "Social Stack: kurum-içi sosyal akış, profil, takip, beğeni ve paylaşım",
      "Aktivite akışı, bahsetme (mention) ve grup/ekip etkileşimi",
      "İç iletişim ve tanıma (recognition)",
    ],
    security: [
      "Profil/gönderi tenant_id RLS; görünürlük ayarı",
      "İçerik moderasyonu; gönderi sanitize",
      "İletişim izinli",
    ],
    codeOptimization: [
      "Aktivite akışı fan-out; sayfalı (imleç)",
      "Beğeni/takip saf hesap",
      "Bildirim olay-temelli",
    ],
    securityOptimization: [
      "Spam/taciz oran-sınırı + moderasyon",
      "Görünürlük (genel/ekip/özel) net",
      "Bahsetme suistimali sınırlı",
    ],
    performance: [
      "Akış önbellekli; fan-out verimli",
      "Beğeni/takip sayacı (hot counter)",
      "Gerçek-zaman güncelleme",
    ],
    mobileApps: [
      "Mobilde sosyal akış + bildirim (mobil-doğal)",
      "iOS/Android push ile etkileşim",
      "Dar ekranda akış",
    ],
    wcag: [
      "Akış klavye+okuyucu erişimli; canlı aria-live",
      "Beğeni/etkileşim metinle; kontrast 7:1",
      "Gönderi editörü erişilebilir",
    ],
    deployment: [
      "Social servisi ölçeklenir; akış fan-out worker",
      "Gerçek-zaman realtime ile",
      "Shared hosting'de temel akış",
    ],
    eca: [
      ECA_BOUND,
      "Olay: gönderi/bahsetme → ilgililere bildir + akışa düş (idempotent, zincir ≤6)",
      "Olay: uygunsuz içerik → moderasyona al (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI içerik özeti/moderasyon skorlama önerir; gönderi/moderasyon kararını insan/kural verir",
    ],
    testing: [
      "Akış fan-out + bildirim testi",
      "Görünürlük + moderasyon/spam testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: gönderi sanitize",
      "A01 Access Control: görünürlük ayarı",
      "A09 Logging: moderasyon kararları iz",
    ],
    integration: [
      "Social, party (profil), notification, realtime ile entegre",
      "Tanıma (recognition) İK (people) ile",
      "Arama search ile",
    ],
    moduleUsage: [
      "Social Stack ArcheType'ı İçerik & İşbirliği'nde kurum-içi sosyal akışı sağlar",
      "İç iletişim gerektiren app'ler social'ı kullanır",
    ],
  },

  "s-survey": {
    featureDefs: [
      "Anket / Geri Bildirim: anket oluşturma, dağıtım, yanıt toplama ve analiz",
      "Soru tipleri, koşullu mantık (skip logic) ve NPS/CSAT",
      "Yanıt analizi ve raporlama",
    ],
    security: [
      "Anket/yanıt verisi tenant_id RLS; anonim yanıt opsiyonu",
      "Yanıtlayan PII izinli; anonimlik korunur",
      "Yanıt manipülasyonu (çoklu gönderim) sınırlı",
    ],
    codeOptimization: [
      "Soru/koşullu mantık (skip logic) bildirimsel",
      "Yanıt toplama idempotent; analiz projeksiyondan",
      "NPS/CSAT hesabı saf",
    ],
    securityOptimization: [
      "Anonim yanıt gerçekten anonim (kimlik bağı yok)",
      "Çoklu gönderim oran-sınırı/token",
      "Yanıt verisi gizlilik eşikli toplulaştırma",
    ],
    performance: [
      "Anket dağıtımı toplu kuyruk; yanıt yüksek-hacim",
      "Analiz projeksiyondan",
      "Sonuç önbellekli",
    ],
    mobileApps: [
      "Mobilde anket doldurma (kısa form)",
      "iOS/Android push ile anket daveti",
      "Dar ekranda soru akışı",
    ],
    wcag: [
      "Anket formu klavye+okuyucu erişimli; soru-tipi etiketli",
      "İlerleme metinle; kontrast 7:1",
      "Koşullu mantık erişilebilir (odak yönetimi)",
    ],
    deployment: [
      "Anket servisi standart; dağıtım/analiz worker",
      "Yanıt toplama ölçeklenir",
      "Shared hosting'de temel anket",
    ],
    eca: [
      ECA_BOUND,
      "Olay: anket tamamlandı → analiz güncelle + düşük NPS'te uyar (idempotent, zincir ≤6)",
      "Olay: anket süresi doldu → kapat + rapor (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI soru/analiz (açık-uçlu yanıt teması) önerir; anketi/aksiyonu insan yönetir",
    ],
    testing: [
      "Koşullu mantık (skip logic) + idempotent yanıt testi",
      "Anonimlik + NPS/CSAT hesap testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: yanıt erişimi/anonimlik",
      "A04 Insecure Design: çoklu-gönderim önleme",
      "A09 Logging: anket kararları iz (anonimlik korumalı)",
    ],
    integration: [
      "Survey, party (yanıtlayan), notification (davet), analytics (sonuç) ile entegre",
      "NPS/CSAT crm/helpdesk ile",
      "Açık-uçlu analiz data-intelligence ile",
    ],
    moduleUsage: [
      "Anket / Geri Bildirim ArcheType'ı İçerik & İşbirliği'nde anket sağlar",
      "Geri bildirim toplayan tüm app'ler survey'i kullanır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-content-collaboration] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-content-collaboration] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
