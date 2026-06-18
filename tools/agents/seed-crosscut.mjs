#!/usr/bin/env node
/**
 * seed-crosscut — Faz B6 (Cowork tek-ajan). crosscut (kesişen kaygılar: i18n, gizlilik, uyum,
 * gözlemlenebilirlik, güvenlik, jurisdiction) kümesinin 22 ŞABLON düğümüne ELLE yazılmış,
 * sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Doğrula: node tools/agents/check-content.mjs crosscut  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");
const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const CONTENT = {
  "app-crosscut": {
    featureDefs: [
      "Cross-cutting / kesişen kaygılar ailesi: i18n, gizlilik, uyum, gözlemlenebilirlik, güvenlik, jurisdiction",
      "Tüm app'leri yatay olarak kesen, tek yerde tanımlanan ortak politikalar",
      "Her kaygı bağımsız ama ArcheType/Surface'larla tutarlı uygulanır",
    ],
    security: [
      "Kesişen güvenlik politikaları (RLS, ReBAC, audit) tüm app'lere uygulanır",
      "Gizlilik/uyum kuralları merkezî; app'ler bunları bypass edemez",
      "Politika değişikliği yetkili+sürümlü+izli",
    ],
    codeOptimization: [
      "Kesişen kaygılar ara-katman/dekoratör olarak; iş koduna sızmaz",
      "Politika motoru bildirimsel; her app aynı kuralı uygular",
      "Tek kaynak: i18n/uyum/güvenlik kuralları tekrar yazılmaz",
    ],
    securityOptimization: [
      "Politikalar deny-by-default; istisna açık ve izli",
      "Uyum kuralları jurisdiction'a göre çözülür",
      "Güvenlik kontrolleri katmanlı (defense-in-depth)",
    ],
    performance: [
      "Politika çözümleme önbellekli; sıcak yolu yavaşlatmaz",
      "Gözlemlenebilirlik düşük ek-yük (sampling)",
      "i18n/biçim önbellekli",
    ],
    mobileApps: [
      "Kesişen kaygılar mobilde de uygulanır (i18n, gizlilik izni)",
      "iOS/Android'de yerel biçim ve consent yönetimi",
      "Dar ekranda uyum/izin yüzeyleri",
    ],
    wcag: [
      "Erişilebilirlik kesişen bir kaygı: tüm UI'da AAA garanti",
      "i18n ile RTL/çok-dilli erişilebilirlik; kontrast 7:1",
      "Politika yönetim ekranları klavye+okuyucu erişimli",
    ],
    deployment: [
      "Kesişen kaygılar ara-katman olarak her serviste; politika merkezî",
      "Gözlemlenebilirlik ajanları her serviste",
      "Shared hosting'de temel politikalar (gelişmiş gözlem degrade)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: jurisdiction/uyum kuralı değişti → etkilenen app'lere politika güncellemesi yay (idempotent, zincir ≤6)",
      "Olay: gizlilik ihlali riski → erişimi kısıtla + güvenlik ekibine uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI politika/uyum boşluğu önerir; gizlilik/güvenlik kuralını kendisi gevşetemez veya bypass edemez",
    ],
    testing: [
      "Her kesişen politika için uygulama testi (tüm app'lerde geçerli)",
      "Jurisdiction'a göre uyum çözümleme testi",
      "Gizlilik/güvenlik politikası ihlal-reddi testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control + A05 Misconfiguration: merkezî politika",
      "A09 Logging: politika kararları forensic iz",
      "A04 Insecure Design: deny-by-default kesişen kaygılar",
    ],
    integration: [
      "Crosscut, tüm app/ArcheType'lara yatay politika (i18n/uyum/güvenlik) uygular",
      "Kernel ve layer1 ile politika sözleşmesi paylaşır",
      "Jurisdiction resolver tüm kaygıları besler",
    ],
    moduleUsage: [
      "Cross-cutting app'i yatay politika kütüphanesini barındırır",
      "Tüm app'ler i18n/gizlilik/uyum/güvenlik politikalarını buradan tüketir",
    ],
  },

  "cc-privacy": {
    featureDefs: [
      "KVKK + GDPR somut implementasyon: rıza (consent), veri öznesi hakları, ve veri envanteri",
      "Unutulma hakkı (silme), taşınabilirlik (export) ve erişim talebi akışları",
      "Veri işleme amacı, hukuki dayanak ve saklama yönetimi",
    ],
    security: [
      "Kişisel veri sınıflandırılır; erişim amaç-sınırlı (purpose limitation)",
      "Rıza kaydı değişmez; geri çekme her zaman mümkün",
      "Veri öznesi talepleri kimlik-doğrulamalı ve izli",
    ],
    codeOptimization: [
      "Rıza durumu tek kaynaktan; işleme öncesi kontrol",
      "Silme/anonimleştirme akışı bildirimsel (ArcheType retention'a bağlı)",
      "Veri envanteri katalogdan türetilir",
    ],
    securityOptimization: [
      "Amaç dışı işleme deny; her erişim amaç+dayanak taşır",
      "Silme talebi tüm kopyalara yayılır (kaskad + doğrulama)",
      "Sınır-ötesi (cross-border) transfer jurisdiction kuralına tabi",
    ],
    performance: [
      "Rıza kontrolü hızlı (önbellekli); işlemi yavaşlatmaz",
      "Silme/export talepleri arka planda iş olarak",
      "Veri envanteri zamanlanmış güncellenir",
    ],
    mobileApps: [
      "Mobilde rıza yönetimi ve veri-hakları self-servis",
      "iOS/Android izin (ATT/permissions) ile uyum",
      "Dar ekranda gizlilik tercih merkezi",
    ],
    wcag: [
      "Rıza/gizlilik formu açık, anlaşılır ve klavye erişimli",
      "Karanlık desen yok; reddet kabul kadar kolay; kontrast 7:1",
      "Hak talebi akışı erişilebilir adımlarla",
    ],
    deployment: [
      "Gizlilik motoru kesişen ara-katman; silme/export worker",
      "Veri ikamet (residency) için bölge-farkında",
      "Shared hosting'de temel rıza + manuel talep",
    ],
    eca: [
      ECA_BOUND,
      "Olay: silme talebi geldi → ilgili kayıtları anonimleştir/sil + doğrula (idempotent, zincir ≤6)",
      "Olay: rıza geri çekildi → ilgili işlemeyi durdur + bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI veri envanteri/PII tespiti önerir; silme/işleme kararını insan onaylar, AI rıza kuralını gevşetemez",
    ],
    testing: [
      "Silme talebi kaskad doğruluk testi (tüm kopyalar)",
      "Rıza kontrolü (izinsiz işleme yok) testi",
      "Veri-hakları (export/erişim) akış testi; en çok 6 tur",
    ],
    owasp: [
      "LLM06/A02: PII koruma ve maskeleme",
      "A01 Access Control: amaç-sınırlı erişim",
      "A09 Logging: rıza/talep kararları forensic iz",
    ],
    integration: [
      "Privacy, tüm PII tutan ArcheType'lara uygulanır (retention/audit ile)",
      "Jurisdiction resolver ile bölge kuralları",
      "Party/CRM silme talepleri buraya bağlı",
    ],
    moduleUsage: [
      "Privacy (KVKK+GDPR) tüm app'lere veri koruma sağlar",
      "PII işleyen tüm ArcheType'lar gizlilik modülünü kullanır",
    ],
  },

  "cc-security": {
    featureDefs: [
      "Security Model: kimlik doğrulama, yetkilendirme (RBAC/ReBAC/ABAC), sır yönetimi ve tehdit modeli",
      "Oturum, token, MFA ve step-up; saldırı yüzeyi yönetimi",
      "Güvenlik politikası ve olay müdahale (incident) çerçevesi",
    ],
    security: [
      "Deny-by-default yetkilendirme; en-az-ayrıcalık her yerde",
      "Sırlar kasada (vault); rotasyon ve dar kapsam",
      "MFA/step-up yüksek-riskli işlemde zorunlu",
    ],
    codeOptimization: [
      "Yetki kararı merkezî policy engine'den; kod tekrarı yok",
      "Token doğrulama hızlı (imza); oturum yönetimi standart",
      "Güvenlik kontrolleri ara-katman",
    ],
    securityOptimization: [
      "Defense-in-depth: katmanlı kontroller (ağ/uygulama/veri)",
      "Tehdit modeli (STRIDE) ArcheType başına gözden geçirilir",
      "Tedarik zinciri: bağımlılık imza + SBOM",
    ],
    performance: [
      "Yetki kontrolü önbellekli; sıcak yolu yavaşlatmaz",
      "Token doğrulama yerel (imza); merkez sorgusu az",
      "Güvenlik logu asenkron",
    ],
    mobileApps: [
      "Mobilde biyometrik + güvenli token saklama (Keychain/Keystore)",
      "iOS/Android sertifika sabitleme (pinning) opsiyonu",
      "Oturum süresi ve uzaktan iptal",
    ],
    wcag: [
      "Kimlik/MFA akışı klavye+okuyucu erişimli",
      "Güvenlik uyarıları açık ve eyleme dönük; kontrast 7:1",
      "Hata mesajı bilgi sızdırmaz ama erişilebilir",
    ],
    deployment: [
      "Güvenlik ara-katmanı her serviste; sır yönetimi merkezî vault",
      "Kubernetes ağ politikaları + en-az-ayrıcalık ServiceAccount",
      "Shared hosting'de temel auth (gelişmiş kontroller kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: anormal oturum/şüpheli erişim → step-up iste veya oturumu sonlandır (idempotent, zincir ≤6)",
      "Olay: güvenlik ihlali tespit → erişimi kıs + incident aç + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tehdit/anomali tespiti ve sertleştirme önerir; yetki/güvenlik kuralını kendisi değiştiremez",
    ],
    testing: [
      "Yetkilendirme (deny-by-default) testi; yetkisiz erişim reddi",
      "MFA/step-up tetik testi",
      "Tehdit senaryosu (STRIDE) güvenlik testi; en çok 6 tur",
    ],
    owasp: [
      "OWASP Top 10:2025 kapsamlı: A01/A02/A07 çekirdek",
      "A08 Integrity: tedarik zinciri (SBOM/imza)",
      "A09 Logging: güvenlik olayları forensic iz",
    ],
    integration: [
      "Security model, tüm app/ArcheType'ların yetki temelidir",
      "Kimlik (identity) ve audit modülleriyle entegre",
      "Incident gözlemlenebilirlik/bildirimle",
    ],
    moduleUsage: [
      "Security Model tüm app'lere kimlik/yetki/güvenlik sağlar",
      "Her ArcheType yetki kararını bu modelden alır",
    ],
  },

  "cc-i18n-standards": {
    featureDefs: [
      "i18n Teknik Standartları: BCP 47 (dil etiketi), CLDR (yerel veri), ICU (çoğul/biçim), RTL",
      "Çeviri yönetimi, mesaj biçimleme ve yerel sayı/tarih/para",
      "Çok-dilli içerik ve dil-geri-düşme (fallback)",
    ],
    security: [
      "Çeviri içeriği sanitize (enjeksiyon önleme)",
      "Dil/yerel tercihi kullanıcıya ait, tenant-izole",
      "Çeviri kaynak erişimi rol bazlı",
    ],
    codeOptimization: [
      "Mesajlar ICU MessageFormat; çoğul/cinsiyet doğru",
      "Yerel veri CLDR'den; tarih/sayı/para tutarlı",
      "Dil etiketleri BCP 47 doğrulanır",
    ],
    securityOptimization: [
      "Eksik çeviri güvenli geri-düşer (fallback); boş gösterilmez",
      "Çeviri enjeksiyonu (format string) engellenir",
      "RTL/bidi güvenli işleme",
    ],
    performance: [
      "Çeviri paketleri tembel ve önbellekli",
      "Yerel biçimleme önbellekli",
      "Kullanılmayan dil yüklenmez",
    ],
    mobileApps: [
      "Mobilde cihaz dili/yerel otomatik; RTL düzen",
      "iOS/Android yerel tarih/sayı/para biçimi",
      "Dil değişimi anında uygulanır",
    ],
    wcag: [
      "Sayfa dili (lang) doğru işaretli; ekran okuyucu doğru telaffuz",
      "RTL düzen tam erişilebilir; kontrast 7:1",
      "Dil seçici klavye erişilebilir",
    ],
    deployment: [
      "Çeviri paketleri statik asset/CDN; build veya runtime yükleme",
      "Çeviri yönetimi (TMS) entegrasyonu",
      "Shared hosting'de statik çeviri paketleri (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni dil eklendi → çeviri eksiklerini raporla + fallback uygula (idempotent, zincir ≤6)",
      "Olay: çeviri kaynağı güncellendi → ilgili paketleri yeniden derle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI çeviri/yerelleştirme önerir; çeviriyi yayını insan onaylar (kalite/bağlam)",
    ],
    testing: [
      "ICU çoğul/cinsiyet ve biçim doğruluk testi",
      "RTL/bidi render testi",
      "Eksik çeviri fallback testi; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: çeviri format-string enjeksiyonu engellenir",
      "A05 Misconfiguration: dil/yerel güvenli varsayılan",
      "Erişilebilirlik (lang) doğru",
    ],
    integration: [
      "i18n standartları tüm UI/içerik metnine uygulanır",
      "strings.json/çeviri katmanı bu standartları kullanır",
      "Cultural UX ve identity-models ile tutarlı",
    ],
    moduleUsage: [
      "i18n Teknik Standartları (orta taş) tüm app'lere yerelleştirme temeli sağlar",
      "Çok-dilli tüm app'ler bu standartları kullanır",
    ],
  },

  "cc-obs": {
    featureDefs: [
      "Observability + Performance + DR: log/metrik/iz, performans bütçesi ve felaket kurtarma çerçevesi",
      "SLO/SLI, hata bütçesi ve performans regresyon takibi",
      "Yedekleme/geri-yükleme ve RPO/RTO hedefleri",
    ],
    security: [
      "Telemetride PII redaksiyon; log'a sır yazılmaz",
      "Gözlem verisine erişim ops düzlemi yetkisiyle",
      "Yedekler şifreli; geri-yükleme yetkili",
    ],
    codeOptimization: [
      "Yapısal log + trace-id korelasyonu",
      "Performans bütçesi CI'da; regresyon yakalanır",
      "Telemetri düşük ek-yük (sampling)",
    ],
    securityOptimization: [
      "Log redaksiyonu varsayılan; yüksek-kardinalite sınırı",
      "Yedek bütünlüğü doğrulanır (restore tatbikatı)",
      "DR planı düzenli test edilir",
    ],
    performance: [
      "Performans bütçeleri (Core Web Vitals/p95) izlenir",
      "Telemetri zaman-serisi deposunda; downsample",
      "DR: RPO/RTO ölçülür",
    ],
    mobileApps: [
      "Mobil performans (başlatma/jank) izlenir",
      "iOS/Android crash raporlama (PII'siz)",
      "Dar ekranda SLO özeti",
    ],
    wcag: [
      "Gözlem panoları grafiklerine veri tablosu alternatifi",
      "SLO/hata durumu renk dışında metinle; kontrast 7:1",
      "Pano klavye erişimli",
    ],
    deployment: [
      "Telemetri ajanları her serviste; depolama ayrı",
      "Yedekleme zamanlanmış; çok-bölge DR",
      "Shared hosting'de temel log + manuel yedek",
    ],
    eca: [
      ECA_BOUND,
      "Olay: SLO ihlali/performans regresyonu → uyar + olay aç (idempotent, zincir ≤6)",
      "Olay: yedek başarısız → DR sorumlusuna uyar + yeniden dene (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kök-neden/kapasite önerir; otomatik düzeltme/restore aksiyonunu insan onaylar",
    ],
    testing: [
      "SLO hesabı ve performans bütçesi (CI gate) testi",
      "Yedek geri-yükleme (restore) tatbikat testi",
      "DR failover RPO/RTO testi; en çok 6 tur",
    ],
    owasp: [
      "A09 Logging: yapısal forensic iz (PII redakte)",
      "A05 Misconfiguration: gözlem güvenli varsayılan",
      "A08 Integrity: yedek bütünlüğü doğrulanır",
    ],
    integration: [
      "Observability, tüm servislerden telemetri toplar (s-observability ile)",
      "Performans bütçesi CI/build ile",
      "DR altyapı (multi-region) ile",
    ],
    moduleUsage: [
      "Observability+Performance+DR (orta taş) tüm app'lere izlenebilirlik/dayanıklılık sağlar",
      "Tüm servisler telemetri ve yedeklemeyi bu çerçeveden alır",
    ],
  },

  "cc-tr": {
    featureDefs: [
      "Türkiye Uyum Birinci Sınıf: GİB e-fatura/e-arşiv/e-defter, KVKK, BKM, e-imza yerel gereksinimleri",
      "TR-özel kimlik (TCKN/VKN), adres ve telefon biçimleri",
      "Yerel ödeme (BKM Express, taksit) ve mevzuat takvimi",
    ],
    security: [
      "TCKN/VKN gibi TR kimlik verisi maskeli ve KVKK-korumalı",
      "GİB entegrasyon anahtarı/e-imza kasada",
      "Yerel mevzuat kaydı (saklama süresi) zorunlu",
    ],
    codeOptimization: [
      "TR biçimleri (TCKN doğrulama, IBAN, telefon) tek doğrulayıcı",
      "GİB belge formatı (UBL-TR) şablondan",
      "Mevzuat kuralları bildirimsel jurisdiction'dan",
    ],
    securityOptimization: [
      "TCKN/VKN doğrulama algoritması + maskeleme",
      "e-Belge imza zorunlu; imzasız gönderim reddi",
      "Mevzuat değişikliği sürümlü uygulanır",
    ],
    performance: [
      "TR doğrulamalar O(1); GİB gönderimi kuyrukla",
      "Mevzuat takvimi önbellekli",
      "e-Belge toplu gönderim",
    ],
    mobileApps: [
      "Mobilde TR biçimli giriş (TCKN/telefon maskesi)",
      "iOS/Android yerel ödeme (BKM/taksit) akışı",
      "Dar ekranda e-belge durumu",
    ],
    wcag: [
      "TR formları (TCKN/adres) alan-etiket ilişkili ve hata bildirimli",
      "Türkçe ekran okuyucu telaffuzu (lang=tr); kontrast 7:1",
      "Yerel biçim ipuçları erişilebilir",
    ],
    deployment: [
      "GİB entegrasyon worker'ı; TR veri ikameti (gerekiyorsa)",
      "e-Belge gönderici ayrı servis",
      "Shared hosting'de temel KVKK + manuel e-belge",
    ],
    eca: [
      ECA_BOUND,
      "Olay: TR faturası oluştu → UBL-TR üret + e-imza + GİB'e gönder (idempotent, zincir ≤6)",
      "Olay: mevzuat son-tarihi yaklaştı → sorumluyu uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI TR mevzuat boşluğu/uyum önerir; e-belge gönderimini veya kuralı insan onaylar",
    ],
    testing: [
      "TCKN/VKN/IBAN doğrulama testi",
      "UBL-TR + e-imza gönderim testi (GİB)",
      "KVKK akış testi; en çok 6 tur",
    ],
    owasp: [
      "A02 Cryptographic Failures: e-imza + TR kimlik maskeleme",
      "A08 Integrity: e-belge imza ve değişmezlik",
      "A09 Logging: TR uyum kararları iz",
    ],
    integration: [
      "TR uyum, finance (e-fatura), party (TCKN) ve privacy (KVKK) ile entegre",
      "GİB/e-imza harici servisleri",
      "Jurisdiction resolver TR eksenini besler",
    ],
    moduleUsage: [
      "Türkiye Uyum (orta taş) TR pazarı için yerel gereksinimleri sağlar",
      "TR'de faaliyet gösteren tüm app'ler bu uyum modülünü kullanır",
    ],
  },

  "app-crosscut-x-molecule": {
    featureDefs: [
      "Cross-cutting kırılımının Molekül örneği: bir kesişen kaygının bileşen düzeyi tarifi",
      "Molekül, bir kesişen politikanın çalışabilir en küçük bileşeni",
      "Örnek dal; kesişen kaygı bileşeninin granülerlikteki yeri",
    ],
    security: [
      "Molekül kesişen politikayı sınırda uygular (i18n/yetki)",
      "Yalnız kapsamındaki kaynağa erişir",
      "Tenant/jurisdiction bağlamına bağlı",
    ],
    codeOptimization: [
      "Saf fonksiyon; politika çıktısı deterministik",
      "Tipli arayüz",
      "Paylaşılan yardımcıya çıkarım",
    ],
    securityOptimization: [
      "En az ayrıcalık; deny-by-default",
      "Girdi normalizasyonu",
      "Politika sürümlü",
    ],
    performance: [
      "Önbelleklenebilir saf molekül",
      "Tembel başlatma",
      "Küçük çıktı",
    ],
    mobileApps: [
      "Molekül mobilde de uygulanır",
      "Yerel bağlam (dil/izin) farkında",
      "Dar ekranda özetli",
    ],
    wcag: [
      "Etkileşim klavye erişimli; kontrast 7:1",
      "Durum metinle",
      "Hata ilişkilendirilmiş",
    ],
    deployment: [
      "Üst kaygı ara-katmanıyla dağıtılır",
      "Her serviste uygulanır",
      "Shared hosting'de temel",
    ],
    eca: [
      ECA_BOUND,
      "Olay: molekül girdisi politikayı ihlal etti → sınırda reddet + üst kaygıya sinyal (idempotent, zincir ≤6)",
      "Molekül üst kaygı kuralına bağlanır",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI molekül politikası önerir; kesişen kuralı kendisi gevşetemez",
    ],
    testing: [
      "Politika molekülü birim testi",
      "Üst kaygı entegrasyon testi",
      "Erişilebilirlik mikro-yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: deny-by-default",
      "A04 Insecure Design: en-az-ayrıcalık",
      "İzlenir",
    ],
    integration: [
      "Molekül üst kesişen kaygıya (ör. privacy) tipli arayüzle bağlanır",
      "Jurisdiction/politika sözleşmesini tüketir",
      "Çıktısı app'lere uygulanır",
    ],
    moduleUsage: [
      "Kesişen molekül bir bileşendir; bağımsız sunulmaz, üst kaygı içinde kullanılır",
    ],
  },

  "app-crosscut-x-element": {
    featureDefs: [
      "Cross-cutting kırılımının Element örneği: tek bir kesişen alan/kural (ör. rıza bayrağı)",
      "Element, kesişen politika sözleşmesindeki en küçük anlamlı alan/kural",
      "Örnek dal; kesişen alan kuralının granülerlikteki yeri",
    ],
    security: [
      "Alan doğrulaması sunucuda; politika kuralı uygulanır",
      "Hassas alan maskeli",
      "Yazım yetki+jurisdiction'a bağlı",
    ],
    codeOptimization: [
      "Kesişen kural saf doğrulayıcı",
      "Tip Zod ile",
      "Tek kaynaktan",
    ],
    securityOptimization: [
      "Allowlist temelli; güvensiz değer reddi",
      "Field-level yetki",
      "Güvenli varsayılan",
    ],
    performance: [
      "O(1) doğrulama",
      "Önbelleklenebilir",
      "Toplu doğrulama",
    ],
    mobileApps: [
      "Alan mobilde yerel biçimle",
      "Offline doğrulanabilir",
      "Hata okunur",
    ],
    wcag: [
      "Alan etiketli; hata sesli; kontrast 7:1",
      "Zorunluluk metinle",
      "Okuyucuya anlamlı",
    ],
    deployment: [
      "Kural kesişen şema parçası",
      "Her profilde doğrulanır",
      "Shared hosting'de geçerli",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alan kuralı ihlal → üst molekül kuralına sinyal (idempotent, zincir ≤6)",
      "Element tek başına otomasyon yazmaz",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alan/kural önerebilir; politika/maskeleme kuralını kendisi gevşetemez",
    ],
    testing: [
      "Sınır-değer doğrulama testi",
      "Maskeleme testi",
      "Erişilebilirlik mikro-testi",
    ],
    owasp: [
      "A03 Injection: allowlist doğrulama",
      "A02 Cryptographic Failures: hassas alan korumalı",
      "Değişiklik izli",
    ],
    integration: [
      "Element üst molekül ve kesişen sözleşmeye bağlanır",
      "Politika şema doğrulamasına dahil",
      "Surface görünürlüğü kurala göre",
    ],
    moduleUsage: [
      "Kesişen element bir alan/kuraldır; bağımsız sunulmaz, politika field tanımının parçası",
    ],
  },

  "app-crosscut-x-atom": {
    featureDefs: [
      "Cross-cutting kırılımının Atom örneği: bölünemez kesişen ilkel (ör. dil etiketi değer nesnesi)",
      "Atom, kesişen sözleşmenin daha alt parçaya ayrılmayan ilkel birimi",
      "Örnek dal; kesişen atomun granülerlik tabanındaki yeri",
    ],
    security: [
      "Atom değişmez; mutasyon engellenir",
      "Değer sınırda doğrulanır (geçerli dil/kod)",
      "Hassas atom korunur",
    ],
    codeOptimization: [
      "Atom değer nesnesi; eşitlik değere göre",
      "Sabit tip; geçersiz değer reddi (BCP 47 vb.)",
      "Paylaşılır",
    ],
    securityOptimization: [
      "En dar biçim doğrulaması",
      "Güvenli serileştirme",
      "Bağımlılıksız",
    ],
    performance: [
      "Sabit zaman doğrulama",
      "İnternalize değer",
      "Ucuz karşılaştırma",
    ],
    mobileApps: [
      "Atom değeri mobilde özetli",
      "Offline doğrulanabilir",
      "Taşmaz",
    ],
    wcag: [
      "Atom etiketli; hata metinle; kontrast 7:1",
      "Biçim ipuçlu",
      "Okuyucuya anlamlı",
    ],
    deployment: [
      "Atom tipi kesişen şema çekirdeğinde",
      "Her profilde aynı doğrulama",
      "Shared hosting dahil",
    ],
    eca: [
      ECA_BOUND,
      "Atom otomasyon tetiklemez; üst kurallara değer sağlar",
      "Olay: değer geçersiz → üst element reddeder (idempotent)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kesişen atom tipi önerebilir; ilkel sözleşmeyi tek başına yazamaz",
    ],
    testing: [
      "Atom biçim/sınır testi (ör. BCP 47)",
      "Değişmezlik testi",
      "Serileştirme testi",
    ],
    owasp: [
      "A03 Injection: değer biçim-doğrulanır",
      "A08 Integrity: atom değişmez",
      "İzlenebilir",
    ],
    integration: [
      "Kesişen atom element ve field tanımlarının yapı taşı",
      "Tip sistemine dahil",
      "Üst seviyeler birleştirir",
    ],
    moduleUsage: [
      "Kesişen atom bölünemez birimdir; bağımsız sunulmaz, üst tip tanımlarında kullanılır",
    ],
  },

  "cc-compliance-matrix": {
    featureDefs: [
      "Uyum Matrisi: KVKK, GDPR, CCPA, LGPD, PCI gibi düzenlemeleri tek matriste eşler ve kontrol eder",
      "Kontrol→düzenleme eşlemesi, kanıt ve boşluk (gap) analizi",
      "Denetim hazırlığı ve uyum durumu raporlama",
    ],
    security: [
      "Uyum kanıtları değişmez ve erişim-kontrollü",
      "Kontrol durumu yetkili güncellenir; izli",
      "Hassas kanıt belgesi şifreli",
    ],
    codeOptimization: [
      "Kontroller tek kaynaktan; düzenlemelere çoktan-çoğa eşlenir",
      "Boşluk analizi türetilir (kontrol-düzenleme farkı)",
      "Kanıt otomatik toplanır (audit/config'den)",
    ],
    securityOptimization: [
      "Eksik kontrol deny/uyarı; sessiz uyumsuzluk olmaz",
      "Kanıt bütünlüğü (hash); kurcalama tespiti",
      "Denetim erişimi zaman-sınırlı",
    ],
    performance: [
      "Uyum durumu projeksiyondan anlık",
      "Kanıt toplama zamanlanmış",
      "Matris sorgusu indeksli",
    ],
    mobileApps: [
      "Mobilde uyum durumu ve eksik kontrol uyarısı",
      "iOS/Android'de kanıt fotoğrafı/belge yükleme",
      "Dar ekranda uyum skoru kartı",
    ],
    wcag: [
      "Uyum matrisi tablosu klavye+okuyucu erişimli",
      "Uyumlu/eksik renk dışında metin+ikonla; kontrast 7:1",
      "Boşluk detayı yapılandırılmış",
    ],
    deployment: [
      "Uyum servisi standart; kanıt toplama worker",
      "Çok-jurisdiction için bölge-farkında",
      "Shared hosting'de temel uyum takibi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kontrol durumu değişti → uyum matrisini güncelle + boşluk varsa uyar (idempotent, zincir ≤6)",
      "Olay: denetim yaklaşıyor → eksik kanıtları sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kontrol-düzenleme eşleme ve boşluk önerir; uyum durumunu/kanıtı insan onaylar",
    ],
    testing: [
      "Kontrol→düzenleme eşleme doğruluk testi",
      "Boşluk analizi testi (eksik kontrol tespit)",
      "Kanıt bütünlüğü testi; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: kanıt hash + değişmezlik",
      "A01 Access Control: uyum/kanıt erişimi",
      "A09 Logging: uyum kararları forensic iz",
    ],
    integration: [
      "Compliance matrix, privacy/security/TR uyum modüllerini birleştirir",
      "Audit'ten kanıt toplar",
      "Jurisdiction resolver ile bölge düzenlemeleri",
    ],
    moduleUsage: [
      "Uyum Matrisi (modül) tüm app'lerin düzenleyici uyumunu izler",
      "Düzenlemeye tabi tüm app'ler uyum matrisini kullanır",
    ],
  },

  "cc-jurisdiction-resolver": {
    featureDefs: [
      "Jurisdiction / Policy Resolver: 6-eksenli ortogonal politika çözümleme (ülke/dil/para/vergi/veri-ikamet/yaş)",
      "Bağlama göre uygulanacak kural setini belirler",
      "Eksen kombinasyonu çakışmasını öncelikle çözer",
    ],
    security: [
      "Çözümleme bağlamı doğrulanır; sahte jurisdiction reddi",
      "Veri-ikamet ekseni veri konumunu zorlar",
      "Politika değişimi sürümlü+izli",
    ],
    codeOptimization: [
      "6 eksen ortogonal; çözümleme deterministik ve saf",
      "Kural çakışması öncelik sırasıyla çözülür",
      "Çözüm önbellekli (bağlam anahtarı)",
    ],
    securityOptimization: [
      "Bilinmeyen eksen değeri en-kısıtlayıcı kurala düşer (güvenli)",
      "Veri-ikamet ihlali deny",
      "Çözümleme kararı izli",
    ],
    performance: [
      "Çözümleme O(1) (önbellekli); sıcak yolu yavaşlatmaz",
      "Eksen tabloları bellekte",
      "Çakışma çözümü önceden hesaplanmış",
    ],
    mobileApps: [
      "Mobilde konum/dil ekseni cihazdan (izinli)",
      "Yerel kural otomatik uygulanır",
      "Dar ekranda geçerli jurisdiction göstergesi",
    ],
    wcag: [
      "Jurisdiction yönetim ekranı klavye+okuyucu erişimli",
      "Geçerli kural seti metinle bildirilir; kontrast 7:1",
      "Eksen seçimi erişilebilir",
    ],
    deployment: [
      "Resolver kesişen ara-katman; eksen tabloları yapılandırma",
      "Bölge-farkında dağıtım (veri-ikamet)",
      "Shared hosting'de temel eksen seti",
    ],
    eca: [
      ECA_BOUND,
      "Olay: bağlam (ülke/yaş) değişti → uygulanacak politikayı yeniden çöz (idempotent, zincir ≤6)",
      "Olay: veri-ikamet ihlali → işlemi blokla + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI eksen/kural önerisi üretir; jurisdiction kuralını veya çözümlemeyi kendisi değiştiremez",
    ],
    testing: [
      "6-eksen çözümleme doğruluk testi",
      "Çakışma öncelik testi",
      "Veri-ikamet ihlal-reddi testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: jurisdiction bazlı yetki",
      "A04 Insecure Design: bilinmeyen→en-kısıtlayıcı",
      "A09 Logging: çözümleme kararları iz",
    ],
    integration: [
      "Jurisdiction resolver, privacy/TR/compliance/i18n kaygılarını besler",
      "Tüm bölge-bağımlı kararların kaynağı",
      "Veri-ikamet multi-region ile",
    ],
    moduleUsage: [
      "Jurisdiction/Policy Resolver (modül) bölgeye göre politika çözer",
      "Çok-bölge/çok-ülke tüm app'ler resolver'ı kullanır",
    ],
  },

  "cc-graphql-guvenlik": {
    featureDefs: [
      "GraphQL Güvenlik Sözleşmesi: 12 zorunlu önlem (derinlik/karmaşıklık limiti, persisted query, introspection kontrolü)",
      "Alan-seviyesi yetki, batching/aliasing kötüye kullanımı önleme",
      "Hata maskeleme ve oran-sınırı",
    ],
    security: [
      "Sorgu derinlik/karmaşıklık limiti (DoS önleme)",
      "Alan-seviyesi yetkilendirme; yetkisiz alan çözülmez",
      "Introspection prod'da kapalı/kısıtlı; persisted query",
    ],
    codeOptimization: [
      "Resolver'lar batch/dataloader ile N+1 önler",
      "Karmaşıklık skoru sorgu öncesi hesaplanır",
      "Persisted query allowlist (rastgele sorgu yok)",
    ],
    securityOptimization: [
      "Alias/batching ile karmaşıklık sömürüsü engellenir",
      "Hata mesajı maskeli (şema/iç bilgi sızmaz)",
      "Sorgu oran-sınırlı + maliyet bütçesi",
    ],
    performance: [
      "Dataloader ile N+1 ortadan kalkar",
      "Persisted query önbellekli plan",
      "Karmaşıklık limiti aşırı sorguyu erken keser",
    ],
    mobileApps: [
      "Mobil istemci persisted query kullanır (hafif + güvenli)",
      "iOS/Android'de sorgu maliyeti istemci-dostu",
      "Hata mesajı kullanıcı-dostu (iç bilgi yok)",
    ],
    wcag: [
      "GraphQL backend; hata yüzeyi erişilebilir biçimde sunulur",
      "İstemci hata mesajları açık ve eyleme dönük; kontrast 7:1",
      "Yükleme/hata durumu okuyucuya bildirilir",
    ],
    deployment: [
      "GraphQL gateway güvenlik ara-katmanlı; persisted query store",
      "Karmaşıklık/limit yapılandırması merkezî",
      "Shared hosting'de temel GraphQL (gelişmiş kısıt opsiyonel)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: karmaşıklık/derinlik limiti aşıldı → sorguyu reddet + uyar (idempotent, zincir ≤6)",
      "Olay: anormal sorgu deseni (saldırı) → oran-sınırı sıkılaştır (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sorgu optimizasyonu/güvenlik önerir; GraphQL güvenlik kurallarını kendisi gevşetemez",
    ],
    testing: [
      "Derinlik/karmaşıklık limiti testi (aşımda red)",
      "Alan-seviyesi yetki testi (yetkisiz alan çözülmez)",
      "Introspection/persisted query testi; en çok 6 tur",
    ],
    owasp: [
      "API Top 10: aşırı veri ifşası + kaynak tüketimi",
      "A01 Access Control: alan-seviyesi yetki",
      "A04 Insecure Design: karmaşıklık/maliyet limiti",
    ],
    integration: [
      "GraphQL güvenlik, API katmanının tüm ArcheType'lara açılışını korur",
      "Yetki (security model) ile alan-seviyesi",
      "Rate-limit primitifiyle",
    ],
    moduleUsage: [
      "GraphQL Güvenlik Sözleşmesi (modül) API katmanını korur",
      "GraphQL sunan tüm app'ler bu 12 önlemi uygular",
    ],
  },

  "cc-fx-ledger": {
    featureDefs: [
      "FX & Ledger: çok-para-birimli muhasebe, kur çevrimi, çevrim farkı ve raporlama para birimi",
      "İşlem/raporlama/fonksiyonel para birimi ayrımı",
      "Kur kaynağı, tarihsel kur ve yeniden-değerleme",
    ],
    security: [
      "Kur kaynağı güvenilir+imzalı; manipülasyon izlenir",
      "Para birimi/tutar verisi denetlenebilir",
      "Çevrim kuralı değişimi sürümlü",
    ],
    codeOptimization: [
      "Tutarlar ondalık; para birimiyle birlikte (Money tipi)",
      "Çevrim tek kaynak kurdan; çevrim farkı ayrı hesap",
      "Yeniden-değerleme dönem-sonu saf hesap",
    ],
    securityOptimization: [
      "Yuvarlama tutarlı (banker's rounding); kayıp/kazanç izli",
      "Kur tarihi kilitli (geçmiş işlem değişmez)",
      "Çoklu para çakışması engellenir",
    ],
    performance: [
      "Kur tablosu önbellekli; çevrim O(1)",
      "Yeniden-değerleme toplu/asenkron",
      "Çok-para rapor projeksiyondan",
    ],
    mobileApps: [
      "Mobilde yerel para birimi gösterimi; çevrim şeffaf",
      "iOS/Android'de çoklu para özet",
      "Dar ekranda kur/fark kartı",
    ],
    wcag: [
      "Para/tutar yerel biçimde ve metinle (yalnız sembol değil); kontrast 7:1",
      "Çevrim farkı işaretle (pozitif/negatif) metinle",
      "Para birimi seçimi erişilebilir",
    ],
    deployment: [
      "FX servisi kur kaynağı entegrasyonlu; muhasebeyle entegre",
      "Yeniden-değerleme worker",
      "Shared hosting'de tek/az para birimi (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kur güncellendi → açık pozisyonları yeniden değerle + çevrim farkı kaydet (idempotent, zincir ≤6)",
      "Olay: kur kaynağı kesildi → son geçerli kuru kullan + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kur/çevrim anomali önerir; çevrim kuralını veya kaydı kendisi değiştiremez",
    ],
    testing: [
      "Çok-para çevrim + yuvarlama doğruluk testi",
      "Yeniden-değerleme çevrim farkı testi",
      "Tarihsel kur kilidi testi; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: kur kaynağı imzalı, geçmiş kilitli",
      "A01 Access Control: çevrim kuralı yetkisi",
      "A09 Logging: kur/çevrim kararları iz",
    ],
    integration: [
      "FX & Ledger, finance (muhasebe) ve consolidation ile entegre",
      "Kur kaynağı harici servis",
      "Money tipi tüm para içeren ArcheType'larda",
    ],
    moduleUsage: [
      "FX & Ledger (orta taş) çok-para muhasebe temeli sağlar",
      "Finans ve çok-ülke app'leri bu modülü kullanır",
    ],
  },

  "cc-identity-models": {
    featureDefs: [
      "Global Kimlik Modelleri: ad, telefon, adres, vergi kimliği için ülke-farkında veri modelleri",
      "Esnek ad (tek/çok parça), uluslararası telefon (E.164), adres formatları",
      "Doğrulama ve normalleştirme (ülkeye göre)",
    ],
    security: [
      "Kimlik verisi PII; maskeli ve erişim-kontrollü",
      "Vergi/ulusal kimlik ülke kuralına göre doğrulanır+maskelenir",
      "Adres/telefon normalleştirme izli",
    ],
    codeOptimization: [
      "Esnek ad modeli (tek alan varsayımı yok); kültür-farkında",
      "Telefon E.164 normalleştirme; adres ülke şablonu",
      "Doğrulayıcılar ülkeye göre seçilir (jurisdiction)",
    ],
    securityOptimization: [
      "Ulusal kimlik (TCKN vb.) algoritmik doğrulama + maskeleme",
      "Adres/telefon enjeksiyonu sanitize",
      "Kültürel varsayım yok (ad sırası, soyad opsiyonel)",
    ],
    performance: [
      "Doğrulama/normalleştirme O(1) saf",
      "Ülke şablonları bellekte",
      "Toplu normalleştirme vektörel",
    ],
    mobileApps: [
      "Mobilde ülke-farkında giriş (telefon/adres maskesi)",
      "iOS/Android yerel formata uyum",
      "Dar ekranda esnek ad/adres alanları",
    ],
    wcag: [
      "Ad/adres formu kültür-kapsayıcı ve etiketli",
      "Tek-parça ad zorlamaz; hata erişilebilir; kontrast 7:1",
      "Telefon/adres ipuçları okuyucuya açık",
    ],
    deployment: [
      "Kimlik modeli kesişen şema; doğrulayıcılar ülkeye göre",
      "Her profilde geçerli",
      "Shared hosting dahil çalışır",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kimlik verisi girildi → ülke-farkında doğrula + normalleştir (idempotent, zincir ≤6)",
      "Olay: geçersiz ulusal kimlik → reddet + açıklayıcı hata (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI adres/ad normalleştirme önerir; kimlik doğrulama/maskeleme kuralını kendisi gevşetemez",
    ],
    testing: [
      "Çok-ülke ad/telefon/adres doğrulama testi",
      "Ulusal kimlik algoritma + maskeleme testi",
      "Kültürel kapsayıcılık testi (tek-parça ad); en çok 6 tur",
    ],
    owasp: [
      "A02 Cryptographic Failures: kimlik verisi maskeli/korumalı",
      "A03 Injection: adres/telefon sanitize",
      "A01 Access Control: kimlik PII erişimi",
    ],
    integration: [
      "Identity models, party/CRM/HR gibi kişi tutan ArcheType'lara temel",
      "Jurisdiction resolver ile ülke kuralları",
      "i18n/cultural-ux ile tutarlı",
    ],
    moduleUsage: [
      "Global Kimlik Modelleri (orta taş) ülke-farkında kişi verisi sağlar",
      "Kişi/iletişim tutan tüm app'ler bu modelleri kullanır",
    ],
  },

  "cc-notification-consent": {
    featureDefs: [
      "Bildirim & Consent: işlemsel (transactional) vs pazarlama (marketing) ayrımı ve izin yönetimi",
      "Kanal-bazlı izin, çift-onay (double opt-in) ve abonelikten çıkma",
      "İzin kaydı (kanıt) ve tercih merkezi",
    ],
    security: [
      "İzin kaydı değişmez (kanıt); geri çekme her zaman geçerli",
      "Pazarlama yalnız açık izinle; işlemsel ayrı",
      "İzin verisi tenant-izole ve KVKK-uyumlu",
    ],
    codeOptimization: [
      "İzin durumu tek kaynaktan; gönderim öncesi kontrol",
      "Transactional/marketing ayrımı tiplenir",
      "Çift-onay akışı bildirimsel",
    ],
    securityOptimization: [
      "İzinsiz pazarlama gönderimi deny (yasal risk)",
      "Abonelikten çıkma anında uygulanır (her mesajda link)",
      "İzin kanıtı denetlenebilir",
    ],
    performance: [
      "İzin kontrolü önbellekli; gönderimi yavaşlatmaz",
      "Tercih merkezi sorgusu hafif",
      "Toplu izin güncellemesi asenkron",
    ],
    mobileApps: [
      "Mobilde izin/tercih self-servis; push izni yönetimi",
      "iOS/Android sistem izinleriyle uyum",
      "Dar ekranda tercih merkezi",
    ],
    wcag: [
      "İzin formu açık (karanlık desen yok); klavye erişimli",
      "İşlemsel/pazarlama ayrımı metinle açık; kontrast 7:1",
      "Abonelikten çıkma kolay bulunur ve erişilebilir",
    ],
    deployment: [
      "Consent servisi bildirim modülüyle entegre",
      "İzin kaydı değişmez depoda",
      "Shared hosting'de temel izin yönetimi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: pazarlama bildirimi → izin kontrol; izin yoksa gönderme (idempotent, zincir ≤6)",
      "Olay: abonelikten çıkıldı → tüm pazarlama kanallarında uygula (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI izin segmentasyonu önerir; kullanıcı iznini kendisi değiştiremez/varsayamaz",
    ],
    testing: [
      "İzinsiz pazarlama gönderim-reddi testi",
      "Çift-onay (double opt-in) akış testi",
      "Abonelikten çıkma yayılım testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: izin-bazlı gönderim",
      "LLM06/A02: izin verisi (PII) korunur",
      "A09 Logging: izin değişiklikleri forensic iz",
    ],
    integration: [
      "Notification-consent, bildirim modülünün izin katmanı",
      "Privacy (KVKK) ile uyumlu",
      "Pazarlama/CRM app'leri izin durumunu kullanır",
    ],
    moduleUsage: [
      "Bildirim & Consent (orta taş) izin-uyumlu iletişim sağlar",
      "Bildirim/pazarlama yapan tüm app'ler izin modülünü kullanır",
    ],
  },

  "cc-i18n-deep": {
    featureDefs: [
      "i18n Derinleştirme: çoğullaştırma (pluralization), RTL/bidi, yerel biçim ve kültürel sıralama (collation)",
      "Dil-özel kurallar (cinsiyet, sayı sınıfı) ve karma yön (bidi) metin",
      "Yerel sıralama/arama (locale-aware) ve büyük/küçük harf",
    ],
    security: [
      "Çeviri/yerel veri sanitize; bidi-override saldırısı engellenir",
      "Yerel veri kaynağı (CLDR) güvenilir",
      "Dil tercihi tenant-izole",
    ],
    codeOptimization: [
      "Çoğullaştırma ICU kuralından (dil sınıfı)",
      "Sıralama (collation) locale-aware; bellek-içi",
      "Bidi algoritması standart (Unicode)",
    ],
    securityOptimization: [
      "Bidi-override (görsel sahtekarlık) tespit + temizleme",
      "Eksik dil-kuralı güvenli fallback",
      "Yerel biçim enjeksiyonu engellenir",
    ],
    performance: [
      "Çoğul/biçim kuralları önbellekli",
      "Sıralama indeksli (locale-aware)",
      "RTL render maliyeti optimize",
    ],
    mobileApps: [
      "Mobilde RTL düzen ve çoğul doğru; cihaz yereli",
      "iOS/Android bidi metin doğru render",
      "Dar ekranda yerel biçimler",
    ],
    wcag: [
      "RTL/bidi tam erişilebilir; yön doğru işaretli",
      "Çoğul mesajlar ekran okuyucuda doğru; kontrast 7:1",
      "Dil-özel telaffuz (lang) doğru",
    ],
    deployment: [
      "i18n-deep i18n standartları üstünde; CLDR verisi paketli",
      "Çeviri paketleri dile göre",
      "Shared hosting'de statik (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni dil/yerel eklendi → çoğul/sıralama/biçim kurallarını yükle (idempotent, zincir ≤6)",
      "Olay: bidi-override tespit → metni temizle + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI çoğul/yerelleştirme önerir; yerel kuralları veya çeviriyi insan onaylar",
    ],
    testing: [
      "Çoğullaştırma (dil sınıfı) doğruluk testi",
      "RTL/bidi render + bidi-override güvenlik testi",
      "Locale-aware sıralama testi; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: bidi-override + format enjeksiyonu engellenir",
      "A05 Misconfiguration: yerel güvenli fallback",
      "Erişilebilirlik (yön/lang) doğru",
    ],
    integration: [
      "i18n-deep, i18n standartlarını derinleştirir; cultural-ux ile",
      "Tüm çok-dilli UI/içerikte uygulanır",
      "Identity models (ad sıralama) ile tutarlı",
    ],
    moduleUsage: [
      "i18n Derinleştirme (orta taş) gelişmiş yerelleştirme sağlar",
      "Çok-dilli (özellikle RTL) app'ler bu modülü kullanır",
    ],
  },

  "cc-a11y-backend": {
    featureDefs: [
      "Accessibility Backend: API yanıt yapısının erişilebilirliği destekleyecek şekilde tasarlanması",
      "Anlamlı hata kodları, etiket/açıklama alanları ve dark/high-contrast meta",
      "Sunucu, istemci-erişilebilirliğini engellemeyecek sözleşmeler sunar",
    ],
    security: [
      "Erişilebilirlik meta verisi PII içermez",
      "Hata yanıtı bilgi sızdırmaz ama anlamlı (kullanıcı-dostu)",
      "A11y yapılandırma tenant-izole",
    ],
    codeOptimization: [
      "API yanıtı alan-etiketli (form üretimi için); tek sözleşme",
      "Hata kodları yapılandırılmış (i18n-edilebilir)",
      "Tema/kontrast tercihi sunucu-tarafı saklanır",
    ],
    securityOptimization: [
      "Hata mesajı sanitize ve genel (iç bilgi yok) ama erişilebilir",
      "A11y tercih değişimi izli",
      "Güvenli varsayılan (yüksek kontrast opsiyonu)",
    ],
    performance: [
      "Erişilebilirlik meta önbellekli; ek yük yok",
      "Form üretim metadata'sı hafif",
      "Tema tercihi hızlı çözülür",
    ],
    mobileApps: [
      "iOS/Android erişilebilirlik (VoiceOver/TalkBack) için yapılandırılmış yanıt",
      "Dinamik yazı boyutu ve kontrast tercihi senkron",
      "Mobil hata mesajları erişilebilir",
    ],
    wcag: [
      "Backend, WCAG 2.2 AAA'yı istemcide mümkün kılan veri sağlar (etiket/açıklama)",
      "Hata→alan eşlemesi yapısal (ekran okuyucu için); kontrast meta",
      "Dil/yön bilgisi yanıtta",
    ],
    deployment: [
      "A11y meta kesişen sözleşme; her API yanıtında",
      "Tema/tercih servisi standart",
      "Shared hosting dahil çalışır",
    ],
    eca: [
      ECA_BOUND,
      "Olay: doğrulama hatası → alan-eşlemeli yapılandırılmış hata döndür (erişilebilir, idempotent, zincir ≤6)",
      "Olay: a11y tercih değişti → sunucu-tarafı sakla + uygula (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI erişilebilirlik iyileştirme (etiket/açıklama) önerir; a11y sözleşmesini kendisi gevşetemez",
    ],
    testing: [
      "API yanıtı erişilebilirlik sözleşmesi testi (etiket/hata eşleme)",
      "Hata→alan eşleme doğruluk testi",
      "Tema/kontrast tercih testi; en çok 6 tur",
    ],
    owasp: [
      "A05 Misconfiguration: erişilebilirlik güvenli varsayılan",
      "A03 Injection: hata içeriği sanitize",
      "Hata bilgi sızdırmaz",
    ],
    integration: [
      "A11y backend, tüm API yüzeylerine erişilebilirlik sözleşmesi verir",
      "i18n ile dil/yön; cultural-ux ile",
      "Form üretimi (Surface) bu metadata'yı kullanır",
    ],
    moduleUsage: [
      "Accessibility Backend (orta taş) sunucu-tarafı erişilebilirlik desteği sağlar",
      "API/form sunan tüm app'ler bu sözleşmeyi kullanır",
    ],
  },

  "cc-content-jurisdiction": {
    featureDefs: [
      "İçerik & Ürün Jurisdiction Kuralları: bölgeye göre sansür, yaş sınırı ve ürün uygunluğu",
      "İçerik filtreleme, yaş-kapısı (age-gate) ve coğrafi kısıtlama",
      "Yasaklı ürün/içerik bölge eşlemesi",
    ],
    security: [
      "Kısıtlı içerik yetkisiz bölgede sunulmaz (jurisdiction'a göre)",
      "Yaş doğrulama gizlilik-dostu (PII-min)",
      "Kural değişimi sürümlü+izli",
    ],
    codeOptimization: [
      "İçerik uygunluğu jurisdiction resolver'dan çözülür",
      "Yaş-kapısı + coğrafi filtre bildirimsel",
      "Yasaklı liste indeksli",
    ],
    securityOptimization: [
      "Bilinmeyen bölge en-kısıtlayıcı kurala düşer",
      "Coğrafi atlatma (VPN) için ek doğrulama opsiyonu",
      "Yaş-kapısı atlatması engellenir",
    ],
    performance: [
      "Uygunluk çözümleme önbellekli (bölge+içerik)",
      "Filtre indeksli; hızlı",
      "Yasaklı liste bellekte",
    ],
    mobileApps: [
      "Mobilde bölge/yaş kuralı uygulanır (konum izinli)",
      "iOS/Android yaş-derecelendirme ile uyum",
      "Dar ekranda kısıtlama bildirimi açık",
    ],
    wcag: [
      "Yaş-kapısı/kısıtlama mesajı açık ve erişilebilir",
      "Neden gösterimi metinle (yalnız blok değil); kontrast 7:1",
      "Alternatif/itiraz yolu erişilebilir",
    ],
    deployment: [
      "İçerik jurisdiction kesişen ara-katman; coğrafi çözümleme edge",
      "Bölge kuralları yapılandırma",
      "Shared hosting'de temel filtre",
    ],
    eca: [
      ECA_BOUND,
      "Olay: içerik bölgede kısıtlı → sunma + uygun alternatif/mesaj (idempotent, zincir ≤6)",
      "Olay: yaş doğrulanmadı → yaş-kapısı uygula (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI içerik sınıflandırma/uygunluk önerir; jurisdiction kısıtlamasını kendisi gevşetemez",
    ],
    testing: [
      "Bölge-bazlı içerik kısıtlama testi (yetkisiz bölgede sunulmaz)",
      "Yaş-kapısı atlatma reddi testi",
      "Bilinmeyen bölge en-kısıtlayıcı testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: bölge/yaş bazlı içerik erişimi",
      "A04 Insecure Design: en-kısıtlayıcı varsayılan",
      "A09 Logging: kısıtlama kararları iz",
    ],
    integration: [
      "Content jurisdiction, jurisdiction resolver eksenlerini içerik/ürüne uygular",
      "Commerce (ürün uygunluğu) ve CMS ile",
      "Compliance matrix ile bölge düzenlemeleri",
    ],
    moduleUsage: [
      "İçerik & Ürün Jurisdiction (orta taş) bölgesel içerik kurallarını uygular",
      "İçerik/ürün sunan çok-bölge app'ler bu modülü kullanır",
    ],
  },

  "cc-cultural-ux": {
    featureDefs: [
      "Kültürel UX: renk anlamı, jest, font geri-düşme (fallback), ekran okuyucu ve kültürel uygunluk",
      "Bölge/kültüre göre UX uyarlaması (renk, ikon, tarih/ad sırası)",
      "Kültürel olarak uygun varsayılanlar ve geri-düşmeler",
    ],
    security: [
      "Kültürel veri/tercih tenant-izole; PII'siz",
      "Font/varlık kaynağı güvenilir (CDN allowlist)",
      "Tercih değişimi izli",
    ],
    codeOptimization: [
      "Renk/ikon semantiği token'dan; kültüre göre eşlenir",
      "Font fallback zinciri tanımlı (script kapsamı)",
      "Kültürel varsayılan jurisdiction'dan",
    ],
    securityOptimization: [
      "Kültürel varsayım yok; güvenli/nötr varsayılan",
      "Font/varlık enjeksiyonu engellenir",
      "Bölge-uygun olmayan içerik filtrelenir",
    ],
    performance: [
      "Font subset + fallback; yükleme optimize",
      "Kültürel token önbellekli",
      "Bölge-uyarlama runtime hafif",
    ],
    mobileApps: [
      "Mobilde kültür-farkında düzen (renk/jest/yön)",
      "iOS/Android sistem fontları + fallback",
      "Dar ekranda kültürel uygunluk korunur",
    ],
    wcag: [
      "Renk anlamı yalnız renge dayanmaz (metin+ikon); kontrast 7:1",
      "Font fallback okunabilirliği korur (tüm scriptler)",
      "Ekran okuyucu kültür/dil farkında",
    ],
    deployment: [
      "Kültürel UX token/varlık; CDN'den dağıtım",
      "Bölge-uyarlama yapılandırma",
      "Shared hosting'de statik varlıklar (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kullanıcı bölgesi/dili belli → kültürel varsayılanları uygula (idempotent, zincir ≤6)",
      "Olay: font/script eksik → güvenli fallback + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kültürel uyarlama önerir; kültürel/UX varsayılanını insan onaylar (hassasiyet)",
    ],
    testing: [
      "Renk-körü ve kültürel uygunluk testi",
      "Font fallback (çoklu script) render testi",
      "Ekran okuyucu kültür/dil testi; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: font/varlık kaynağı allowlist",
      "A05 Misconfiguration: nötr/güvenli varsayılan",
      "Erişilebilirlik renk-bağımsız",
    ],
    integration: [
      "Cultural UX, i18n ve a11y ile birlikte UX katmanını uyarlar",
      "Jurisdiction resolver bölge eksenini sağlar",
      "Tema token'ları (frontend) ile",
    ],
    moduleUsage: [
      "Kültürel UX (orta taş) bölge/kültüre uygun deneyim sağlar",
      "Çok-bölge/çok-kültür app'ler bu modülü kullanır",
    ],
  },

  "cc-obs-deep": {
    featureDefs: [
      "Health Check + Readiness/Liveness Probes: servis sağlık uçları ve orkestratör entegrasyonu",
      "Bağımlılık sağlığı (DB/kuyruk), graceful shutdown ve başlangıç sırası",
      "Sağlık derecelendirme (healthy/degraded/unhealthy)",
    ],
    security: [
      "Sağlık uçları iç bilgi sızdırmaz (genel durum); detay yetkili",
      "Probe uçları kimlik-doğrulamasız ama bilgi-az",
      "Sağlık metrikleri ops düzlemi yetkisiyle detaylı",
    ],
    codeOptimization: [
      "Liveness (canlı mı) ve readiness (hazır mı) ayrı uçlar",
      "Bağımlılık kontrolü timeout'lu; takılmaz",
      "Graceful shutdown sırası tanımlı",
    ],
    securityOptimization: [
      "Probe yanıtı minimal (sağlık sızıntısı yok)",
      "Readiness false iken trafik almaz (güvenli)",
      "Derecelendirme degraded'da kısmi hizmet",
    ],
    performance: [
      "Probe hafif (düşük ek-yük); sık çağrılır",
      "Bağımlılık kontrolü önbellekli (kısa TTL)",
      "Başlangıç sırası optimize",
    ],
    mobileApps: [
      "Sağlık uçları backend; istemci degrade durumunu görür",
      "Mobil istemci unhealthy'de zarif düşer",
      "Bağlantı durumu gösterilir",
    ],
    wcag: [
      "Sağlık panosu klavye+okuyucu erişimli",
      "Sağlık durumu renk dışında metin+ikonla; kontrast 7:1",
      "Degrade bildirimi açık",
    ],
    deployment: [
      "Probe uçları Kubernetes liveness/readiness ile bağlanır",
      "Graceful shutdown sinyali (SIGTERM) işlenir",
      "Shared hosting'de basit sağlık ucu",
    ],
    eca: [
      ECA_BOUND,
      "Olay: bağımlılık sağlıksız → readiness false (trafik alma) + ops uyar (idempotent, zincir ≤6)",
      "Olay: shutdown sinyali → graceful: yeni istek alma, mevcutları bitir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sağlık anomali/kök-neden önerir; probe/shutdown davranışını kendisi değiştiremez",
    ],
    testing: [
      "Liveness/readiness davranış testi (unhealthy'de trafik almaz)",
      "Graceful shutdown testi (istek kaybı yok)",
      "Bağımlılık timeout testi; en çok 6 tur",
    ],
    owasp: [
      "A05 Misconfiguration: probe bilgi-az ve güvenli",
      "A04 Insecure Design: readiness ile güvenli trafik",
      "A09 Logging: sağlık geçişleri iz",
    ],
    integration: [
      "Obs-deep, observability ve multi-region (failover) ile",
      "Orkestratör (Kubernetes) probe entegrasyonu",
      "Sağlık olayları uyarıya",
    ],
    moduleUsage: [
      "Health/Probes (orta taş) tüm servislere sağlık sözleşmesi sağlar",
      "Tüm servisler liveness/readiness için bu modülü kullanır",
    ],
  },

  "cc-resolver-ops": {
    featureDefs: [
      "Resolver Operasyonel Sertleştirme: jurisdiction resolver için migration, önbellek ve operasyon güvenliği",
      "Politika güncelleme dağıtımı, önbellek geçersizleştirme ve sürüm uyumu",
      "Kademeli politika yayını ve geri-alma",
    ],
    security: [
      "Politika güncellemesi yetkili+imzalı dağıtılır",
      "Önbellek zehirlemesi engellenir (imzalı politika)",
      "Eski/yeni politika sürüm uyumu korunur",
    ],
    codeOptimization: [
      "Politika önbelleği sürüm-anahtarlı; güncelleme atomik",
      "Migration expand-contract (eski+yeni geçiş penceresi)",
      "Geçersizleştirme olay-temelli",
    ],
    securityOptimization: [
      "Politika dağıtımı kademeli; bozulmada geri-al (kill-switch)",
      "Önbellek tutarlılığı (stale politika tespiti)",
      "Güncelleme dağıtımı izli",
    ],
    performance: [
      "Politika önbelleği düşük gecikme; güncelleme yayılımı hızlı",
      "Sıcak politikalar bellekte",
      "Geçersizleştirme dalgası kademeli",
    ],
    mobileApps: [
      "Politika güncellemesi mobil istemcilere şeffaf yansır",
      "Eski sürüm istemci güvenli fallback",
      "Dar ekranda politika sürüm göstergesi (gerekirse)",
    ],
    wcag: [
      "Resolver yönetim ekranı klavye+okuyucu erişimli",
      "Sürüm/dağıtım durumu metinle; kontrast 7:1",
      "Geri-alma aksiyonu erişilebilir",
    ],
    deployment: [
      "Resolver operasyonu kademeli dağıtım pipeline'ı",
      "Önbellek katmanı dağıtık + sürümlü",
      "Shared hosting'de basit politika yenileme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: politika güncellendi → kademeli dağıt + önbellek geçersizleştir (idempotent, zincir ≤6)",
      "Olay: dağıtımda hata oranı arttı → geri-al (kill-switch) + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI dağıtım/önbellek stratejisi önerir; politika dağıtımını insan onaylar",
    ],
    testing: [
      "Politika sürüm uyumu (expand-contract) testi",
      "Önbellek geçersizleştirme tutarlılık testi",
      "Kademeli dağıtım + geri-alma testi; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: politika imzalı, sürümlü",
      "A04 Insecure Design: kademeli + kill-switch",
      "A09 Logging: dağıtım kararları iz",
    ],
    integration: [
      "Resolver-ops, jurisdiction resolver'ın operasyonel katmanı",
      "Önbellek (scale-cache) ve rollout ile",
      "Politika değişikliği tüm kesişen kaygılara yansır",
    ],
    moduleUsage: [
      "Resolver Operasyonel Sertleştirme (orta taş) politika dağıtımını güvenli kılar",
      "Jurisdiction kullanan tüm app'ler bu operasyon katmanından yararlanır",
    ],
  },

  "cc-rollout": {
    featureDefs: [
      "Feature Flag + Kademeli Rollout: özelliği yüzde/segment bazlı kademeli açma ve geri-alma",
      "Canary, yüzde-bazlı ve segment-hedefli yayın",
      "Otomatik geri-alma (metrik bozulunca) ve kill-switch",
    ],
    security: [
      "Bayrak/rollout yapılandırma yetkili; tenant-izole",
      "Hedefleme PII'siz segment tercih",
      "Rollout değişimi izli",
    ],
    codeOptimization: [
      "Bayrak değerlendirme deterministik (hash); düşük gecikme",
      "Rollout yüzdesi kademeli artırılır",
      "Geri-alma anında (kill-switch)",
    ],
    securityOptimization: [
      "Metrik bozulunca otomatik geri-alma (guardrail)",
      "Rollout yetkili ve denetlenebilir",
      "Bayrak borcu (flag debt) temizlenir",
    ],
    performance: [
      "Bayrak değerlendirme O(1) (yerel önbellek)",
      "Rollout metrikleri gerçek-zaman izlenir",
      "Yüksek-trafik kademeli yayın",
    ],
    mobileApps: [
      "Mobil SDK ile bayrak/rollout (offline değerlendirme)",
      "iOS/Android kademeli yayın + uzaktan kill-switch",
      "Dar ekranda rollout durumu",
    ],
    wcag: [
      "Rollout yönetim ekranı klavye+okuyucu erişimli",
      "Yayın yüzdesi/durumu metinle; kontrast 7:1",
      "Geri-alma aksiyonu açık",
    ],
    deployment: [
      "Bayrak servisi düşük-gecikme; SDK istemcilerde",
      "Rollout metrik izleme worker",
      "Shared hosting'de temel bayrak (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: rollout aşaması ilerledi → yüzdeyi artır + metrikleri izle (idempotent, zincir ≤6)",
      "Olay: metrik bozuldu → otomatik geri-al (kill-switch) + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI rollout hızı/segment önerir; yayını veya geri-almayı insan onaylar (kritik)",
    ],
    testing: [
      "Deterministik bayrak atama testi",
      "Otomatik geri-alma (kill-switch) testi",
      "Kademeli yayın segment testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: rollout yetkisi",
      "A04 Insecure Design: kill-switch ile güvenli yayın",
      "A09 Logging: rollout kararları iz",
    ],
    integration: [
      "Rollout, deploy ve experiment modülleriyle entegre",
      "Metrik izleme observability'den",
      "Resolver-ops politika yayınında kullanır",
    ],
    moduleUsage: [
      "Feature Flag + Rollout (orta taş) güvenli kademeli yayın sağlar",
      "Yeni özellik yayan tüm app'ler bu modülü kullanır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-crosscut] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-crosscut] ${applied} kesişen-kaygı düğümü derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
