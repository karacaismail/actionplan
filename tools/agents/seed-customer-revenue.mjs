#!/usr/bin/env node
/**
 * seed-customer-revenue — Faz B8 (Cowork tek-ajan). customer-revenue kümesinin 15 ŞABLON düğümüne
 * ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Doğrula: node tools/agents/check-content.mjs customer-revenue  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");
const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

// Yaprak/örnek kırılım düğümleri için kompakt yardımcı (P-önekli → benzersiz).
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
  integration: [`${P} üst ArcheType'a tipli arayüzle bağlanır`, `${P} ledger/sözleşmeyi tüketir`, `${P} çıktısı üst akışta kullanılır`],
  moduleUsage: [`${P} bağımsız sunulmaz; üst ArcheType içinde kullanılır`],
});

const CONTENT = {
  "app-customer-revenue": {
    featureDefs: [
      "Müşteri & Gelir ürün ailesi: pazarlama, CRM, teklif (CPQ), sözleşme, sadakat ve gelir zekâsı",
      "Müşteri yaşam döngüsünü (edinme→dönüşüm→elde tutma) kapsayan ArcheType'lar",
      "Ortak müşteri (party) ve gelir sözleşmesini paylaşan dikey",
    ],
    security: [
      "Müşteri verisi tenant_id RLS; iletişim izinli (KVKK)",
      "Gelir/teklif verisi rol bazlı; indirim yetki eşiğine bağlı",
      "Müşteri PII maskeli + erişim audit'li",
    ],
    codeOptimization: [
      "Müşteri & Gelir ArcheType'ları ortak party/gelir sözleşmesini paylaşır",
      "Pazarlama/CRM/CPQ bildirimsel bağlanır; kod tekrarı yok",
      "Gelir hesapları okuma-modelinden",
    ],
    securityOptimization: [
      "İndirim/fiyat yetkisi rol allowlist'i",
      "İletişim izin/opt-out kontrolü gönderim öncesi",
      "Gelir kuralı değişikliği sürümlü",
    ],
    performance: [
      "Müşteri 360 görünümü projeksiyonlardan; tek sorgu",
      "Kampanya/segment hesabı toplu/asenkron",
      "Pipeline sorgusu indeksli",
    ],
    mobileApps: [
      "Saha satış/pazarlama mobil-öncelikli",
      "iOS/Android offline aktivite + senkron",
      "Dar ekranda müşteri kartı + sonraki aksiyon",
    ],
    wcag: [
      "Müşteri/gelir ekranları WCAG 2.2 AAA ortak bileşenleriyle",
      "Pipeline/segment renk dışında metinle; kontrast 7:1",
      "Klavye + ekran okuyucu erişimi",
    ],
    deployment: [
      "Müşteri & Gelir servisleri yatay ölçek; kampanya zirvesinde HPA",
      "Gelir olayları outbox ile finance'a",
      "Shared hosting'de temel CRM (gelişmiş analitik degrade)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: müşteri dönüşümü → gelir kaydı + elde-tutma akışı başlat (idempotent, zincir ≤6)",
      "Olay: churn riski yüksek → elde-tutma kampanyası öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI müşteri içgörüsü/sonraki-aksiyon önerir; teklif/fiyat/iletişim kararını satışçı verir",
    ],
    testing: [
      "Müşteri 360 + gelir hesabı doğruluk testi",
      "İzin/opt-out kontrolü + pipeline kullanıcı yolculuğu",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: müşteri/gelir erişimi rol+portföy bazlı",
      "A04 Insecure Design: indirim/fiyat manipülasyonu eşik+onay",
      "A09 Logging: gelir/iletişim kararları forensic iz",
    ],
    integration: [
      "Müşteri & Gelir, party (müşteri), finance (gelir), notification (iletişim) ile entegre",
      "Çekirdek operasyon (CRM/satış) ile yakın",
      "Gelir zekâsı data-intelligence'a beslenir",
    ],
    moduleUsage: [
      "Müşteri & Gelir app'i müşteri yaşam döngüsü ArcheType'larını barındırır",
      "Satış/pazarlama app'leri bu gelir sözleşmesini tüketir",
    ],
  },

  "app-customer-revenue-x-stone": xdim("Müşteri & Gelir Taşı", "bir gelir yeteneğinin alt-parça tarifi (ör. indirim hesabı)"),
  "app-customer-revenue-x-molecule": xdim("Müşteri & Gelir Molekülü", "birkaç gelir kuralını birleştiren bileşen (ör. teklif satırı)"),
  "app-customer-revenue-x-element": xdim("Müşteri & Gelir Elementi", "tek bir gelir alanı/kuralı (ör. indirim oranı)"),
  "app-customer-revenue-x-atom": xdim("Müşteri & Gelir Atomu", "bölünemez gelir ilkeli (ör. para tutarı değer nesnesi)"),

  "s-marketing": {
    featureDefs: [
      "Marketing + CRM Stack: kampanya, segment, lead besleme (nurture) ve çok-kanal pazarlama",
      "Lead→MQL→SQL hunisi, e-posta/SMS otomasyonu ve atıf",
      "Müşteri segmentasyonu ve kişiselleştirme",
    ],
    security: [
      "Pazarlama/iletişim verisi tenant_id RLS; izin (consent) zorunlu",
      "Segment PII maskeli; opt-out her zaman saygı görür",
      "Kampanya gönderimi izin-bazlı + audit",
    ],
    codeOptimization: [
      "Segment hesabı kurallardan; nurture akışı durum makinesi",
      "Atıf modeli yapılandırılabilir; kampanya bildirimsel",
      "Lead skorlama saf",
    ],
    securityOptimization: [
      "Frekans sınırı + sessiz saatler (bildirim yorgunluğu)",
      "İzinsiz pazarlama gönderimi deny",
      "Kampanya bütçe/oran sınırı",
    ],
    performance: [
      "Segment üyeliği projeksiyondan; büyük listede önbellek",
      "Kampanya gönderimi parçalı kuyruk",
      "Atıf hesabı asenkron",
    ],
    mobileApps: [
      "Mobilde kampanya durumu ve onay",
      "iOS/Android push kampanyaları (izinli)",
      "Dar ekranda huni/KPI özeti",
    ],
    wcag: [
      "Kampanya/segment ekranı klavye+okuyucu erişimli",
      "Huni grafiğine veri tablosu alternatifi; kontrast 7:1",
      "E-posta şablonu erişilebilir (alt-metin, yapı)",
    ],
    deployment: [
      "Gönderim worker'ı ayrı; sağlayıcı oran-sınırı",
      "Segment/atıf hesabı ayrı worker",
      "Shared hosting'de temel e-posta kampanyası",
    ],
    eca: [
      ECA_BOUND,
      "Olay: lead segment kriterine girdi → nurture akışına ekle (izinli, idempotent, zincir ≤6)",
      "Olay: lead MQL eşiğini geçti → satışa devret (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI segment/içerik ve gönderim-zamanı önerir; kampanya gönderimini insan onaylar (izin)",
    ],
    testing: [
      "İzin/opt-out kontrolü testi (izinsiz gönderim yok)",
      "Segment üyelik + nurche akışı kullanıcı yolculuğu",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: izin-bazlı gönderim",
      "A04 Insecure Design: frekans/oran ile suistimal önleme",
      "A09 Logging: gönderim/segment kararları iz",
    ],
    integration: [
      "Marketing, crm (lead), notification (kanal), analytics (atıf) ile entegre",
      "Lead'ler satış pipeline'ına devredilir",
      "İzin consent modülüyle",
    ],
    moduleUsage: [
      "Marketing + CRM Stack pazarlama ekiplerine kampanya/segment sağlar",
      "Müşteri edinen tüm app'ler pazarlama modülünü kullanır",
    ],
  },

  "s-cpq": {
    featureDefs: [
      "CPQ (Configure-Price-Quote): ürün yapılandırma, fiyatlandırma kuralları ve teklif üretimi",
      "Karmaşık ürün/paket yapılandırma, indirim onay ve teklif belgesi",
      "Fiyat listesi, kademe ve sözleşme fiyatı",
    ],
    security: [
      "Teklif/fiyat verisi tenant_id RLS; portföy bazlı erişim",
      "İndirim yetki eşiğine bağlı; eşik üstü onay + audit",
      "Maliyet/marj bilgisi maskeli (müşteriye sızmaz)",
    ],
    codeOptimization: [
      "Yapılandırma kuralları (geçerli kombinasyon) bildirimsel motor",
      "Fiyat hesabı saf; kademe/indirim deterministik",
      "Teklif belgesi şablondan",
    ],
    securityOptimization: [
      "Geçersiz yapılandırma engellenir (kural motoru)",
      "İndirim onay zinciri; sıfır-fiyat reddi",
      "Fiyat kuralı sürümlü",
    ],
    performance: [
      "Yapılandırma çözümleme bellekte; büyük katalogda budama",
      "Fiyat hesabı anlık",
      "Teklif üretimi asenkron (PDF)",
    ],
    mobileApps: [
      "Saha satışta mobil teklif oluşturma",
      "iOS/Android offline yapılandırma + senkron",
      "Dar ekranda teklif özeti",
    ],
    wcag: [
      "Yapılandırma sihirbazı adım adım, klavye erişimli",
      "Fiyat/indirim metinle; kontrast 7:1",
      "Geçersiz kombinasyon hatası açık",
    ],
    deployment: [
      "CPQ motoru standart ölçek; teklif PDF worker",
      "Fiyat olayları finance/sales ile",
      "Shared hosting'de temel teklif (karmaşık config kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: teklif oluştu → indirim eşiği kontrol; aşımda onaya yükselt (idempotent, zincir ≤6)",
      "Olay: teklif kabul edildi → siparişe/sözleşmeye dönüştür (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ürün/fiyat önerisi (guided selling) üretir; teklifi/indirimi satışçı onaylar",
    ],
    testing: [
      "Yapılandırma geçerlilik + fiyat hesabı doğruluk testi",
      "İndirim onay eşiği testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: teklif/fiyat erişimi portföy bazlı",
      "A04 Insecure Design: indirim manipülasyonu eşik+onayla engellenir",
      "A09 Logging: fiyat/indirim kararları iz",
    ],
    integration: [
      "CPQ, sales (sipariş), clm (sözleşme), pim (ürün) ile entegre",
      "Teklif finance'a (gelir), müşteri crm'e",
      "Fiyat listesi commerce ile tutarlı",
    ],
    moduleUsage: [
      "CPQ ArcheType'ı Müşteri & Gelir'de teklif üretimini sağlar",
      "Karmaşık ürün satan app'ler CPQ'yu kullanır",
    ],
  },

  "s-clm": {
    featureDefs: [
      "Sözleşme Yönetimi (CLM): sözleşme yaşam döngüsü, şablon, müzakere, imza ve yenileme",
      "Madde kütüphanesi, sürüm/kırmızı-çizgi (redline) ve onay akışı",
      "Yükümlülük takibi ve yenileme uyarısı",
    ],
    security: [
      "Sözleşme verisi tenant_id RLS; gizlilik (taraf-bazlı erişim)",
      "İmzalı sözleşme değişmez (hash); değişiklik izli",
      "Madde/şablon yetkili yönetilir",
    ],
    codeOptimization: [
      "Sözleşme durum makinesi (taslak→müzakere→imza→aktif→yenileme)",
      "Madde kütüphanesi yeniden-kullanılır; sürüm/redline diff",
      "Yükümlülük çıkarımı yapılandırılmış",
    ],
    securityOptimization: [
      "İmza sonrası değişiklik yeni sürüm gerektirir (değişmezlik)",
      "Onay zinciri; yetkisiz aktifleştirme reddi",
      "Gizli madde maskeleme opsiyonu",
    ],
    performance: [
      "Sözleşme araması full-text; yenileme takvimi indeksli",
      "Redline diff anlık",
      "Yükümlülük takibi zamanlanmış",
    ],
    mobileApps: [
      "Mobilde sözleşme onayı ve imza",
      "iOS/Android push ile yenileme/yükümlülük uyarısı",
      "Dar ekranda sözleşme özeti + maddeler",
    ],
    wcag: [
      "Sözleşme/redline görünümü klavye+okuyucu erişimli",
      "Değişiklik (ekle/çıkar) renk dışında işaretle; kontrast 7:1",
      "Onay aksiyonu açık, geri-alınamaz uyarılı",
    ],
    deployment: [
      "CLM servisi standart; belge şifreli depo + DR",
      "Yenileme/yükümlülük worker",
      "Shared hosting'de temel sözleşme (redline kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sözleşme imzalandı → yükümlülükleri çıkar + yenileme tarihini planla (idempotent, zincir ≤6)",
      "Olay: yenileme/yükümlülük yaklaştı → sorumluya uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI madde/risk analizi ve özet üretir; sözleşme onayını/aktifleştirmeyi insan verir",
    ],
    testing: [
      "Sözleşme durum makinesi + değişmezlik testi",
      "Yükümlülük çıkarımı + yenileme uyarısı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: imzalı sözleşme hash + sürümleme",
      "A01 Access Control: taraf-bazlı gizlilik",
      "A09 Logging: sözleşme kararları forensic iz",
    ],
    integration: [
      "CLM, cpq (teklif→sözleşme), esign (imza), dms (belge) ile entegre",
      "Yükümlülük finance/operasyona, yenileme crm'e",
      "Doc-matching sözleşme çıkarımına",
    ],
    moduleUsage: [
      "CLM ArcheType'ı Müşteri & Gelir'de sözleşme yönetimini sağlar",
      "Sözleşmeli iş yapan app'ler CLM'i kullanır",
    ],
  },

  "s-helpdesk": {
    featureDefs: [
      "Helpdesk + Bilgi Bankası: destek talebi (ticket), SLA, kuyruk yönetimi ve self-servis bilgi",
      "Çok-kanal (e-posta/sohbet/portal) ticket, atama ve eskalasyon",
      "Bilgi makalesi ve AI-destekli yanıt önerisi",
    ],
    security: [
      "Ticket/müşteri verisi tenant_id RLS; ajan rol yetkisi",
      "Müşteri PII maskeli; ekler anti-virüs taramalı",
      "SLA/eskalasyon kararları audit'li",
    ],
    codeOptimization: [
      "Ticket durum makinesi; SLA zamanlayıcısı",
      "Kuyruk/atama kuralları bildirimsel",
      "Bilgi makalesi arama (RAG opsiyon)",
    ],
    securityOptimization: [
      "SLA aşımı otomatik eskalasyon",
      "Self-servis yetki-farkında (müşteri yalnız kendi ticket'ı)",
      "Yanıt şablonu sanitize",
    ],
    performance: [
      "Ticket kuyruğu indeksli; SLA hesabı anlık",
      "Bilgi araması hibrit (BM25+vektör)",
      "Yoğun saatte kuyruk önceliklendirme",
    ],
    mobileApps: [
      "Mobilde ajan ticket yanıtı ve müşteri self-servis",
      "iOS/Android push ile yeni ticket/SLA uyarısı",
      "Dar ekranda ticket kuyruğu",
    ],
    wcag: [
      "Ticket/bilgi ekranı klavye+okuyucu erişimli",
      "SLA/öncelik renk dışında metinle; kontrast 7:1",
      "Yanıt editörü erişilebilir",
    ],
    deployment: [
      "Helpdesk servisi ölçeklenir; kanal alıcıları ayrı",
      "Bilgi araması ayrı servis",
      "Shared hosting'de temel ticket (AI yanıt kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ticket geldi → kuyruğa al + uygun ajana ata + SLA başlat (idempotent, zincir ≤6)",
      "Olay: SLA aşıldı → eskalasyon + yöneticiye bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI yanıt taslağı/bilgi önerisi üretir (RAG); ticket çözümünü ajan onaylar",
    ],
    testing: [
      "Ticket atama/SLA + eskalasyon testi",
      "Self-servis yetki testi (başka müşteri ticket'ı görünmez)",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: ticket erişimi müşteri/ajan bazlı",
      "LLM01 Prompt Injection: AI yanıtında girdi muhafazası",
      "A09 Logging: SLA/eskalasyon kararları iz",
    ],
    integration: [
      "Helpdesk, party (müşteri), comms (kanal), rag (bilgi) ile entegre",
      "Ticket CRM müşteri kaydıyla; bilgi wiki'den",
      "SLA gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Helpdesk + Knowledge ArcheType'ı Müşteri & Gelir'de destek sağlar",
      "Müşteri destek veren tüm app'ler helpdesk'i kullanır",
    ],
  },

  "s-loyalty": {
    featureDefs: [
      "Loyalty & Referral: puan, kademe (tier), ödül ve arkadaş-getir (referral) programı",
      "Puan kazanma/harcama kuralları, kademe ilerleme ve kampanya",
      "Referral takibi ve ödül dağıtımı",
    ],
    security: [
      "Puan/üye verisi tenant_id RLS; puan bakiyesi audit'li",
      "Puan manipülasyonu (sahte kazanım) engellenir + izli",
      "Referral suistimali (self-referral) tespit",
    ],
    codeOptimization: [
      "Puan bakiyesi hareketlerden türetilir; kazanma/harcama saf kural",
      "Kademe ilerleme deterministik",
      "Kampanya kuralları bildirimsel",
    ],
    securityOptimization: [
      "Puan kazanım idempotent (çift kazanım yok)",
      "Referral döngüsü/sahteciliği oran-sınırı + kontrol",
      "Ödül dağıtımı onaylı",
    ],
    performance: [
      "Puan bakiyesi projeksiyondan anlık",
      "Kademe hesabı önbellekli",
      "Kampanya zirvesinde kuyruk",
    ],
    mobileApps: [
      "Mobilde puan/kademe ve ödül cüzdanı",
      "iOS/Android push ile puan/ödül bildirimi",
      "Dar ekranda referral paylaşımı",
    ],
    wcag: [
      "Puan/kademe ekranı klavye+okuyucu erişimli",
      "Kademe durumu renk dışında metinle; kontrast 7:1",
      "Ödül kullanımı erişilebilir",
    ],
    deployment: [
      "Loyalty servisi standart ölçek; kampanya worker",
      "Puan olayları outbox ile finance'a (yükümlülük)",
      "Shared hosting'de temel puan programı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: nitelikli işlem → puan kazandır + kademe kontrol (idempotent, zincir ≤6)",
      "Olay: referral tamamlandı → ödül dağıt (sahtecilik kontrollü) (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ödül/kampanya optimizasyon önerir; puan kuralını/dağıtımı insan onaylar",
    ],
    testing: [
      "Puan kazanma/harcama + idempotency testi",
      "Referral sahtecilik (self-referral) reddi testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A04 Insecure Design: puan/referral suistimal önleme",
      "A01 Access Control: puan bakiyesi erişimi",
      "A09 Logging: puan/ödül kararları iz",
    ],
    integration: [
      "Loyalty, commerce/pos (işlem), party (üye), marketing (kampanya) ile entegre",
      "Puan yükümlülüğü finance'a",
      "Referral müşteri edinme hunisine",
    ],
    moduleUsage: [
      "Loyalty & Referral ArcheType'ı Müşteri & Gelir'de sadakat programı sağlar",
      "Perakende/e-ticaret app'leri loyalty'yi kullanır",
    ],
  },

  "s-marketplace": {
    featureDefs: [
      "Marketplace Management: çok-satıcılı pazaryeri — satıcı onboarding, komisyon, ödeme dağıtımı (split)",
      "Satıcı yönetimi, ürün onayı ve sipariş yönlendirme",
      "Komisyon hesabı ve satıcı ödemesi (payout)",
    ],
    security: [
      "Satıcı/sipariş verisi tenant + satıcı izolasyonu (çapraz-satıcı yok)",
      "Komisyon/ödeme audit'li; satıcı banka bilgisi kasada",
      "Ürün onayı yetkili (moderasyon)",
    ],
    codeOptimization: [
      "Ödeme dağıtımı (split) saf hesap; komisyon kuralından",
      "Satıcı bakiyesi hareketlerden; payout zamanlanmış",
      "Sipariş yönlendirme satıcıya idempotent",
    ],
    securityOptimization: [
      "Payout onaylı + eşik; sahte satıcı/ürün moderasyonu",
      "Komisyon kuralı sürümlü",
      "Çapraz-satıcı veri sızıntısı engellenir",
    ],
    performance: [
      "Satıcı/ürün listesi indeksli; sipariş yönlendirme hızlı",
      "Payout toplu/asenkron",
      "Komisyon hesabı projeksiyondan",
    ],
    mobileApps: [
      "Satıcı mobil paneli (ürün/sipariş/bakiye)",
      "iOS/Android push ile yeni sipariş/payout bildirimi",
      "Dar ekranda satıcı özet",
    ],
    wcag: [
      "Satıcı/komisyon ekranı klavye+okuyucu erişimli",
      "Bakiye/komisyon metinle; kontrast 7:1",
      "Onay/payout aksiyonu açık",
    ],
    deployment: [
      "Marketplace servisi ölçeklenir; payout worker",
      "Ödeme dağıtımı (split) sağlayıcıyla",
      "Shared hosting'de küçük pazaryeri (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sipariş geldi → satıcıya yönlendir + komisyon hesapla (idempotent, zincir ≤6)",
      "Olay: payout dönemi → satıcı bakiyesini öde (onaylı) (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI satıcı/ürün kalitesi ve komisyon önerir; payout/onayı insan verir",
    ],
    testing: [
      "Komisyon/split hesap doğruluk testi",
      "Çapraz-satıcı izolasyon testi (başka satıcı verisi görünmez)",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: satıcı izolasyonu",
      "A04 Insecure Design: sahte satıcı/ürün moderasyonu",
      "A09 Logging: komisyon/payout kararları iz",
    ],
    integration: [
      "Marketplace, commerce (sipariş), payment (split), party (satıcı) ile entegre",
      "Komisyon finance'a; ürün pim'den",
      "Channel-hub ile dış pazaryerleri",
    ],
    moduleUsage: [
      "Marketplace Management ArcheType'ı Müşteri & Gelir'de çok-satıcılı pazaryeri sağlar",
      "Pazaryeri kuran app'ler bu ArcheType'ı kullanır",
    ],
  },

  "s-pim": {
    featureDefs: [
      "PIM (Product Information Management): merkezî ürün verisi, varyant, zenginleştirme ve kanal yayını",
      "Ürün özniteliği, kategori, medya ve çok-dilli içerik",
      "Veri kalitesi (tamlık) skoru ve kanal-özel yayın",
    ],
    security: [
      "Ürün verisi tenant_id RLS; yayın yetkisi rol bazlı",
      "Fiyat/maliyet alanları erişim-kontrollü",
      "Medya kaynağı güvenli (file modülü)",
    ],
    codeOptimization: [
      "Ürün modeli varyant-farkında; öznitelik bildirimsel",
      "Zenginleştirme pipeline'ı; tamlık skoru türetilir",
      "Kanal yayını fark-temelli",
    ],
    securityOptimization: [
      "Eksik/düşük-kalite ürün yayını engellenir (tamlık eşiği)",
      "Yayın sürümlü; geri-alınabilir",
      "Çok-dilli içerik sanitize",
    ],
    performance: [
      "Ürün araması indeksli; medya CDN",
      "Toplu içe aktarma/zenginleştirme asenkron",
      "Kanal yayını yalnız değişen ürün",
    ],
    mobileApps: [
      "Mobilde ürün düzenleme ve medya yükleme",
      "iOS/Android'de tamlık skoru görüntüleme",
      "Dar ekranda ürün kartı",
    ],
    wcag: [
      "Ürün formu alan-etiket ilişkili; medyaya alt-metin zorunlu",
      "Tamlık skoru metinle; kontrast 7:1",
      "Çok-dilli sekmeler klavye erişimli",
    ],
    deployment: [
      "PIM servisi standart; zenginleştirme worker; medya CDN",
      "Kanal yayını outbox ile commerce/channel'a",
      "Shared hosting'de temel ürün yönetimi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ürün güncellendi → tamlık skoru hesapla + kanallara yayınla (idempotent, zincir ≤6)",
      "Olay: tamlık eşiği altı → yayını engelle + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ürün açıklaması/öznitelik zenginleştirme önerir; yayını insan onaylar",
    ],
    testing: [
      "Varyant/öznitelik doğruluk + tamlık skoru testi",
      "Kanal yayını (fark-temelli) tutarlılık testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: fiyat/maliyet alanı erişimi",
      "A03 Injection: çok-dilli içerik sanitize",
      "A09 Logging: ürün/yayın kararları iz",
    ],
    integration: [
      "PIM, commerce (katalog), channel-hub (kanal), file (medya) ile entegre",
      "Ürün feed (product-feed) PIM'den beslenir",
      "AI-catalog üretilen görseli PIM'e",
    ],
    moduleUsage: [
      "PIM ArcheType'ı Müşteri & Gelir'de merkezî ürün verisini sağlar",
      "Ürün satan tüm app'ler PIM'i tüketir",
    ],
  },

  "s-product-feed": {
    featureDefs: [
      "Product Feed: merchant/katalog besleme — Google/Meta/pazaryeri için ürün akışı üretimi",
      "Kanal-özel feed formatı (XML/CSV), eşleme ve doğrulama",
      "Feed zamanlama, hata raporu ve onay durumu takibi",
    ],
    security: [
      "Feed yalnız yayınlanabilir ürün verisini içerir (fiyat/maliyet kontrollü)",
      "Kanal kimlik bilgisi kasada",
      "Feed URL'i yetkili/imzalı erişim",
    ],
    codeOptimization: [
      "Feed üretimi PIM verisinden; kanal-özel eşleme bildirimsel",
      "Artımlı feed (yalnız değişen ürün)",
      "Format adaptörü (XML/CSV) ortak veri",
    ],
    securityOptimization: [
      "Geçersiz/eksik ürün feed'e girmez (doğrulama)",
      "Feed üretimi idempotent",
      "Kanal politikası (yasaklı ürün) filtreli",
    ],
    performance: [
      "Büyük katalog feed'i akışlı/parçalı üretim",
      "Feed önbellekli + CDN",
      "Zamanlanmış yenileme",
    ],
    mobileApps: [
      "Mobilde feed durumu ve hata izleme (salt-okuma)",
      "iOS/Android push ile feed hatası uyarısı",
      "Dar ekranda kanal feed özeti",
    ],
    wcag: [
      "Feed yönetim ekranı klavye+okuyucu erişimli",
      "Feed durumu (onaylı/hatalı) renk dışında metinle; kontrast 7:1",
      "Hata raporu yapılandırılmış",
    ],
    deployment: [
      "Feed üretici worker; çıktı CDN/nesne deposu",
      "Kanal gönderimi/zamanlama scheduler ile",
      "Shared hosting'de temel feed (zamanlanmış)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ürün/fiyat değişti → ilgili kanal feed'lerini yenile (idempotent, zincir ≤6)",
      "Olay: kanal feed'i reddetti → hata raporla + sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI feed eşleme/optimizasyon (başlık/kategori) önerir; feed yayınını insan onaylar",
    ],
    testing: [
      "Feed format/eşleme doğruluk testi (kanal şeması)",
      "Artımlı feed tutarlılık testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: feed fiyat/maliyet kontrollü",
      "A04 Insecure Design: yasaklı ürün filtresi",
      "A09 Logging: feed üretim/hata kararları iz",
    ],
    integration: [
      "Product-feed, pim (ürün), channel-hub (kanal) ile entegre",
      "Feed dış kanallara (Google/Meta/pazaryeri)",
      "Analytics ile feed performansı",
    ],
    moduleUsage: [
      "Product Feed (modül) ürün akışını dış kanallara besler",
      "E-ticaret/pazaryeri app'leri feed modülünü kullanır",
    ],
  },

  "s-retail-execution": {
    featureDefs: [
      "Saha Satış & Perakende Yürütme: saha temsilcisi ziyaret, raf denetimi, sipariş ve planogram uyumu",
      "Ziyaret rotası, raf payı (share of shelf) ve anket/foto denetimi",
      "Saha sipariş alımı ve perakende KPI takibi",
    ],
    security: [
      "Saha/müşteri verisi tenant_id RLS; temsilci rol yetkisi",
      "Saha konumu/foto izinli ve geçici",
      "Sipariş/denetim kaydı audit'li",
    ],
    codeOptimization: [
      "Ziyaret planı/rota optimizasyonu; raf denetimi yapılandırılmış",
      "Saha verisi çevrimdışı-öncelikli senkron",
      "KPI hesabı projeksiyondan",
    ],
    securityOptimization: [
      "Sahte ziyaret (konum doğrulama) tespiti",
      "Çevrimdışı senkron idempotent (çift kayıt yok)",
      "Foto/denetim manipülasyonu izli",
    ],
    performance: [
      "Saha verisi çevrimdışı; bağlantıda senkron",
      "Rota optimizasyon asenkron",
      "KPI panosu önbellekli",
    ],
    mobileApps: [
      "Saha temsilcisi mobil-öncelikli (en kritik kanal)",
      "iOS/Android offline ziyaret/denetim/sipariş + senkron",
      "Konum + foto ile raf denetimi",
    ],
    wcag: [
      "Saha formu/anket klavye+okuyucu erişimli",
      "Planogram uyumu renk dışında metin+işaretle; kontrast 7:1",
      "Çevrimdışı durum açık bildirilir",
    ],
    deployment: [
      "Saha mobil + merkez bulut; senkron worker",
      "Rota optimizasyon ayrı servis",
      "Shared hosting'de temel saha (offline kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ziyaret tamamlandı → denetim/sipariş senkronla + KPI güncelle (idempotent, zincir ≤6)",
      "Olay: raf payı düştü → satış ekibine uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI rota/öncelik ve raf-denetim analizi (foto) önerir; siparişi temsilci onaylar",
    ],
    testing: [
      "Çevrimdışı→senkron idempotency testi",
      "Konum doğrulama (sahte ziyaret) testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: saha verisi temsilci/bölge bazlı",
      "A04 Insecure Design: sahte ziyaret/foto manipülasyon önleme",
      "A09 Logging: ziyaret/denetim kararları iz",
    ],
    integration: [
      "Retail-execution, sales (sipariş), gis (rota), inventory (raf stok) ile entegre",
      "Foto file'a, KPI analytics'e",
      "Saha siparişi commerce/sales'e",
    ],
    moduleUsage: [
      "Saha Satış & Perakende Yürütme ArcheType'ı Müşteri & Gelir'de saha operasyonu sağlar",
      "FMCG/dağıtım app'leri bu ArcheType'ı kullanır",
    ],
  },

  "s-revenue-copilot": {
    featureDefs: [
      "AI Satış Zekâsı / Revenue Copilot: görüşme zekâsı, fırsat skorlama ve sonraki-en-iyi-aksiyon",
      "Çağrı/e-posta analizi, risk/fırsat tespiti ve satış koçluğu önerileri",
      "Pipeline tahmini ve gelir öngörüsü",
    ],
    security: [
      "Görüşme/müşteri verisi tenant_id RLS; kayıt onamı",
      "AI çıktısı (skorlama) açıklanabilir + audit",
      "Hassas görüşme içeriği maskeli; injection muhafızası",
    ],
    codeOptimization: [
      "Skorlama kural+model; açıklanabilir özellikler",
      "Görüşme analizi asenkron (transkript→içgörü)",
      "Sonraki-aksiyon kuralları bildirimsel",
    ],
    securityOptimization: [
      "AI önerisi öneri olarak işaretli (otomatik aksiyon değil)",
      "Skorlama eşiği sürümlü; reward-hacking izlenir",
      "Maliyet/oran sınırı",
    ],
    performance: [
      "Skorlama akış/toplu; sıcak özellik önbellekli",
      "Görüşme analizi arka planda",
      "Tahmin projeksiyondan",
    ],
    mobileApps: [
      "Mobilde satış koçluğu önerileri ve fırsat skoru",
      "iOS/Android push ile risk-fırsat uyarısı",
      "Dar ekranda sonraki-aksiyon kartı",
    ],
    wcag: [
      "Skor/öneri renk dışında metinle; kontrast 7:1",
      "Açıklama (neden bu skor) okuyucuya yapılandırılmış",
      "Öneri aksiyonları klavye erişimli",
    ],
    deployment: [
      "Çıkarım AI Stack üzerinden ayrı ölçek",
      "Görüşme analizi worker (medya→transkript)",
      "Shared hosting AI için kısıtlı (kural-temelli degrade)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: görüşme tamamlandı → transkript analiz + fırsat skoru güncelle (idempotent, zincir ≤6)",
      "Olay: fırsat riski yükseldi → satışçıya sonraki-aksiyon öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI skorlama/koçluk ve sonraki-aksiyon önerir (açıklanabilir); fırsat/teklif kararını satışçı verir",
    ],
    testing: [
      "Fırsat skorlama + açıklanabilirlik testi",
      "Görüşme zekâsı (transkript→içgörü) doğruluk testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "LLM01 Prompt Injection: görüşme içeriği muhafazalı",
      "LLM09 Overreliance: öneri insan onayı gerektirir",
      "A09 Logging: skorlama/öneri kararları iz",
    ],
    integration: [
      "Revenue Copilot, crm (fırsat), comms (görüşme), ai-stack (çıkarım) ile entegre",
      "Tahmin fp&a/analytics'e",
      "Skorlama predictive ile",
    ],
    moduleUsage: [
      "Revenue Copilot ArcheType'ı Müşteri & Gelir'de satış zekâsı sağlar",
      "Satış ekibi app'leri revenue copilot'u kullanır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-customer-revenue] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-customer-revenue] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
