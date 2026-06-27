#!/usr/bin/env node
/**
 * seed-layer0 — Faz B16 (Cowork tek-ajan). layer0 (platformun en alt/atomik katmanı: identity, authz, tenancy,
 * schema/metadata motoru, event bus, module/plugin registry, archetype storage, SSO, sharding) kümesinin 11
 * ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Bu katman güvenlik/çok-kiracılık omurgasıdır; üstteki tüm ArcheType'lar buna dayanır.
 * Doğrula: node tools/agents/check-content.mjs layer0  (+ npm run typecheck)
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

const CONTENT = {
  "app-layer0": {
    featureDefs: [
      "Layer 0 — platformun en alt katmanı: kimlik, yetkilendirme, çok-kiracılık, şema motoru, olay yolu ve kayıt defterleri",
      "Üstteki tüm App/Module/ArcheType bu atomik tiplere dayanır; doğrudan kullanıcıya değil platforma hizmet eder",
      "Güvenlik ve izolasyon omurgası; sözleşmeleri değişmeye en kapalı katman",
    ],
    security: [
      "Tüm güvenlik ilkellerinin (kimlik/yetki/tenant) tanımlandığı katman; en yüksek koruma",
      "Tenant izolasyonu burada kök bulur (tenant_id + RLS); sızıntı tüm platformu etkiler",
      "Değişiklik yalnız çekirdek ekip + tam denetim izi ile",
    ],
    codeOptimization: [
      "Atomik tipler saf/yan-etkisiz; tüm üst katmanlarca paylaşılır",
      "Sözleşmeler tipli ve sürümlü; kırıcı değişiklik migration ile",
      "Sıcak yol (kimlik/yetki kontrolü) düşük gecikmeli",
    ],
    securityOptimization: [
      "En-az-ayrıcalık tüm üst katmana buradan dayatılır",
      "Kimlik/yetki sıcak yolu sabit-zamanlı (timing sızıntısı yok)",
      "Sözleşme değişikliği yürürlük tarihli + geriye uyumlu",
    ],
    performance: [
      "Kimlik/yetki kararı önbelleklenir (kısa TTL + iptal)",
      "Şema/metadata bellek-içi indeks",
      "Olay yolu düşük gecikme + sırt basıncı (backpressure)",
    ],
    mobileApps: [
      "Layer 0 UI içermez; mobil oturum/token doğrulama ilkellerini sağlar",
      "Mobil istemci kimlik/yenileme akışını bu katmandan tüketir",
      "Cihaz oturumu bu katmanda izlenir",
    ],
    wcag: [
      "Doğrudan UI yok; üst katmana erişilebilir hata kodları/mesaj sözleşmesi verir",
      "Kimlik/yetki hataları üst UI'de erişilebilir metne çevrilir",
      "Oturum süre uyarısı üst UI'ye sinyal olarak iletilir",
    ],
    deployment: [
      "Layer 0 servisleri en kritik; yüksek erişilebilirlik + çoğaltma",
      "Kimlik/yetki servisi bölgesel düşük gecikme",
      "Shared hosting'de tek süreç içinde gömülü çalışabilir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tenant oluşturuldu/silindi → izolasyon kaynaklarını kur/temizle (idempotent, zincir ≤6)",
      "Olay: kimlik/yetki değişti → ilgili önbellekleri geçersiz kıl (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bu katmana asla yazamaz; yalnız şema/sözleşme iyileştirme taslağı önerir, çekirdek ekip uygular",
    ],
    testing: [
      "Kimlik/yetki/tenant izolasyon sözleşme testleri (en yüksek kapsam)",
      "Çapraz-tenant sızıntı + yetki yükseltme (privilege escalation) negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Broken Access Control: yetki/tenant kararının kök katmanı",
      "A04 Insecure Design: güvenli-varsayılan ilkeller burada tanımlanır",
      "A09 Logging: katman değişiklikleri tam forensic iz",
    ],
    integration: [
      "Layer 0, üstteki kernel/scale/tüm dikeyler tarafından tüketilir; aşağı bağımlılığı yoktur",
      "Veritabanı (PostgreSQL RLS) ve olay altyapısıyla doğrudan",
      "Tüm ArcheType'lar şema/kimlik/yetki sözleşmesini buradan alır",
    ],
    moduleUsage: [
      "Layer 0 atomik tipleri bağımsız ürün değil; tüm platformun temelidir",
      "Her App/Module bu katmanın sözleşmelerini zorunlu tüketir",
    ],
  },

  "k-archetype-storage": {
    featureDefs: [
      "ArcheType Depolama (Hibrit Model): ArcheType tanımı (metadata) ilişkisel, esnek alanlar JSONB; veri+şema birlikte saklanır",
      "Metadata-tanımlı alanların fiziksel kolon mu JSONB mı olacağına karar veren depolama stratejisi",
      "Sürüm/migration ile şema evrimi ve geriye dönük okuma",
    ],
    security: [
      "Depolanan ArcheType verisi tenant_id + RLS ile izole; hassas alan kolon-düzeyi şifreli",
      "Şema değişikliği yetki + denetim izi gerektirir",
      "JSONB enjeksiyonu parametreli sorgu + şema doğrulama ile engellenir",
    ],
    codeOptimization: [
      "Sık sorgulanan alan fiziksel kolona terfi (JSONB'den); GIN indeks esnek alanlar için",
      "Okuma/yazma tipli erişim katmanı (Prisma); ham SQL sınırlı",
      "Sürümler arası okuma adaptörle (lazy upcast)",
    ],
    securityOptimization: [
      "Kolon-düzeyi şifreleme hassas alanlar için; anahtar kasada",
      "Şema migration dry-run + geri-alma planı",
      "Veri-etki analizi (kaç kayıt etkilenir) migration öncesi",
    ],
    performance: [
      "GIN indeks + kısmi indeks esnek JSONB sorgusu için",
      "Sıcak alan kolona terfi → indeksli hızlı sorgu",
      "Büyük JSONB sıkıştırma (TOAST) farkındalığı",
    ],
    mobileApps: [
      "Depolama UI içermez; mobile küçük serileştirilmiş ArcheType verisi döner",
      "Mobil için alan-projeksiyonu (yalnız gerekli alanlar)",
      "Offline önbellek için sürüm damgalı veri",
    ],
    wcag: [
      "Doğrudan UI yok; üst katmana yapılandırılmış veri/alan-meta verir",
      "Alan etiketleri/yardım metni metadata'dan üst UI'ye taşınır",
      "Hata (şema uyumsuzluk) erişilebilir mesaja çevrilebilir",
    ],
    deployment: [
      "PostgreSQL (JSONB + RLS) birincil; okuma replikası ölçek için",
      "Migration CI'da dry-run; prod'a kontrollü uygulama",
      "Shared hosting'de tek PostgreSQL örneği",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ArcheType şeması değişti → migration planı + veri-etki raporu üret (idempotent, zincir ≤6)",
      "Olay: kayıt yazıldı → şema doğrula, geçersizse sınırda reddet (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alan→kolon terfi veya indeks önerisi üretir; şema/migration kararını çekirdek ekip onaylar",
    ],
    testing: [
      "Hibrit okuma/yazma + sürümler-arası geriye uyum testi",
      "Migration dry-run + geri-alma + tenant izolasyon testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: depolanan veri tenant kapsamlı",
      "A03 Injection: JSONB/SQL parametreli + şema doğrulamalı",
      "A08 Integrity: şema migration imzalı/sürümlü",
    ],
    integration: [
      "ArcheType Depolama, k-schema (metadata), k-tenancy (izolasyon), PostgreSQL/Prisma ile entegre",
      "Üstteki tüm ArcheType verisini saklar",
      "Migration aracı ve CI ile",
    ],
    moduleUsage: [
      "ArcheType Depolama Layer 0 modülü; bağımsız sunulmaz",
      "ArcheType tutan her şey bu depolama sözleşmesini kullanır",
    ],
  },

  "k-authz": {
    featureDefs: [
      "Authorization (Yetkilendirme): kimin neye erişebileceğine karar veren motor — ReBAC (ilişki) + ABAC (öznitelik)",
      "Politika değerlendirme (izin/red), rol/ilişki çözümleme ve karar önbelleği",
      "Alan/satır düzeyi (tenant + sahiplik) yetki kapsamı",
    ],
    security: [
      "Yetki kararı güvenli-varsayılan deny; açıkça izin verilmeyen reddedilir",
      "Karar tenant + ilişki kapsamlı; çapraz-tenant erişim imkânsız",
      "Yetki yükseltme (escalation) yolları kapalı; her karar izlenebilir",
    ],
    codeOptimization: [
      "Politika değerlendirme saf fonksiyon; karar önbelleklenebilir",
      "İlişki grafiği (ReBAC) verimli çözümlenir (sınırlı derinlik)",
      "Sıcak yol düşük gecikmeli; toplu kontrol desteklenir",
    ],
    securityOptimization: [
      "Karar sabit-zamanlı (timing ile yetki sızıntısı yok)",
      "Politika değişikliği sürümlü + denetim izi",
      "Önbellek iptali yetki değişiminde anında",
    ],
    performance: [
      "Yetki kararı kısa-TTL önbellek + değişimde iptal",
      "İlişki çözümleme derinlik-sınırlı (sonsuz döngü yok)",
      "Toplu yetki kontrolü tek geçişte",
    ],
    mobileApps: [
      "Yetki UI içermez; mobile izin/red kararı ve görünür-aksiyon listesi döner",
      "Mobil UI yetkiye göre aksiyonları gizler/gösterir",
      "Karar offline önbellekte kısa süre tutulabilir",
    ],
    wcag: [
      "Doğrudan UI yok; üst UI yetkisiz durumu erişilebilir metinle gösterir",
      "Yetki reddi renk dışında metinle iletilir",
      "Devre dışı aksiyon nedeni ekran okuyucuya bildirilir",
    ],
    deployment: [
      "Authz servisi düşük gecikme; karar yerele yakın",
      "Politika dağıtımı sürümlü + kademeli",
      "Shared hosting'de gömülü kütüphane olarak çalışabilir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: rol/ilişki değişti → ilgili yetki önbelleklerini geçersiz kıl (idempotent, zincir ≤6)",
      "Olay: yetkisiz erişim denendi → reddet + güvenlik olayını logla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI politika boşluğu/aşırı-geniş izin tespiti önerir; yetki politikası değişikliğini güvenlik ekibi onaylar",
    ],
    testing: [
      "İzin/red matris + ReBAC ilişki + ABAC öznitelik testleri",
      "Yetki yükseltme + çapraz-tenant negatif testi (en yüksek kapsam)",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Broken Access Control: bu modülün birincil sorumluluğu",
      "A04 Insecure Design: güvenli-varsayılan deny",
      "A09 Logging: yetki kararları/red forensic iz",
    ],
    integration: [
      "Authz, k-identity (kimlik), k-tenancy (kapsam), tüm ArcheType permissions ile entegre",
      "ArcheType ReBAC/ABAC sözleşmesini bu motor değerlendirir",
      "GraphQL/API katmanı her isteği buradan geçirir",
    ],
    moduleUsage: [
      "Authorization Layer 0 modülü; bağımsız sunulmaz",
      "Erişim kontrolü gereken her şey bu motoru kullanır",
    ],
  },

  "k-bus": {
    featureDefs: [
      "Event Bus + Polyglot Runtime Bridge: olayları yayınlar/dağıtır ve farklı çalışma zamanları (Python/Node) arasında köprü kurar",
      "ECA kurallarının tetiklendiği olay omurgası; yayıncı/abone (pub/sub) deseni",
      "Çalışma-zamanları arası tipli mesaj geçişi ve sıralama garantileri",
    ],
    security: [
      "Olay mesajı tenant damgalı; abone yalnız yetkili tenant olaylarını alır",
      "Mesaj bütünlüğü (imza/şema doğrulama); sahte olay enjeksiyonu engellenir",
      "Köprüden geçen veri en-az-ayrıcalık ilkesiyle filtrelenir",
    ],
    codeOptimization: [
      "Olaylar tipli + sürümlü şema; abone gevşek bağlı",
      "Sırt basıncı (backpressure) ile aşırı yük yönetimi",
      "Idempotent tüketici; tekrar-teslim güvenli",
    ],
    securityOptimization: [
      "Olay şeması doğrulanır (zehirli mesaj reddi)",
      "Köprü en-az-ayrıcalık; yalnız izinli olay türleri geçer",
      "Mesaj saklama/silme politikası (PII içeren olay)",
    ],
    performance: [
      "Düşük gecikmeli yayın; toplu/akış tüketim",
      "Sırt basıncı + kuyruk derinliği izleme",
      "Bölümleme (partition) ile yatay ölçek",
    ],
    mobileApps: [
      "Bus UI içermez; mobile gerçek-zamanlı olay (bildirim/güncelleme) iletebilir",
      "Mobil abone yalnız ilgili kanalı dinler (pil/veri tasarrufu)",
      "Bağlantı kopunca olaylar tekrar-teslim edilir",
    ],
    wcag: [
      "Doğrudan UI yok; üst UI olay-tetikli güncellemeyi erişilebilir biçimde sunar",
      "Gerçek-zamanlı güncelleme ekran okuyucuya nazik (aria-live politely) iletilir",
      "Olay hatası üst UI'de erişilebilir metne çevrilir",
    ],
    deployment: [
      "Olay altyapısı (kuyruk/akış) yüksek erişilebilir + çoğaltma",
      "Polyglot köprü ayrı süreç; sağlık izlemeli",
      "Shared hosting'de bellek-içi/küçük kuyruk ile çalışabilir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: domain olayı yayınlandı → eşleşen ECA kurallarını tetikle (idempotent, zincir ≤6)",
      "Olay: zincir derinliği 6'ya ulaştı → durdur + döngü-kırıcı uyarısı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI olay akış darboğazı/yeniden-deneme deseni önerir; bus topoloji değişikliğini çekirdek ekip onaylar",
    ],
    testing: [
      "Pub/sub teslim + idempotent tüketim + sıralama testleri",
      "Sahte olay reddi + tenant izolasyon + sırt basıncı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: olay şeması doğrulanır (zehirli mesaj reddi)",
      "A04 Insecure Design: idempotent + döngü-kırıcı tasarım",
      "A09 Logging: olay akışı izlenir (forensic)",
    ],
    integration: [
      "Event Bus, eca motoru, k-tenancy (damga), tüm ArcheType eca-bindings ile entegre",
      "Python/Node çalışma zamanları arası köprü",
      "Domain olaylarını yayan tüm modüller buraya bağlanır",
    ],
    moduleUsage: [
      "Event Bus Layer 0 modülü; bağımsız sunulmaz",
      "Olay/ECA kullanan her şey bu yolu kullanır",
    ],
  },

  "k-identity": {
    featureDefs: [
      "Identity (Kimlik): kullanıcı/aktör (principal) kimliği, kimlik doğrulama, oturum ve token yönetimi",
      "Parola/MFA, oturum yaşam döngüsü ve token yenileme",
      "Aktör kimliğinin tenant ve role bağlanması (authz'a girdi)",
    ],
    security: [
      "Parola güçlü hash (argon2/bcrypt); MFA desteklenir",
      "Oturum/token kısa ömürlü + yenileme; çalınmaya karşı iptal",
      "Kimlik bilgisi sızıntısına karşı brute-force/rate-limit + kilit",
    ],
    codeOptimization: [
      "Kimlik doğrulama saf + sabit-zamanlı karşılaştırma",
      "Token imzalı (JWT/opaque) + sürümlü anahtar",
      "Oturum durumu verimli (yenileme dönen token)",
    ],
    securityOptimization: [
      "Anahtar rotasyonu desteklenir; eski token kademeli geçersiz",
      "Sabit-zamanlı doğrulama (kullanıcı-var-mı sızıntısı yok)",
      "MFA zorlama hassas işlemde step-up",
    ],
    performance: [
      "Token doğrulama yerel/önbellekli (her istekte DB yok)",
      "Oturum araması indeksli; yenileme hafif",
      "Kilit/rate-limit sayacı bellek-içi hızlı",
    ],
    mobileApps: [
      "Mobil güvenli token saklama (keychain/keystore) sözleşmesi",
      "Biyometrik + yenileme token akışı mobil için",
      "Cihaz oturumu listelenir/iptal edilebilir",
    ],
    wcag: [
      "Kimlik UI içermez; üst giriş UI'sine erişilebilir hata sözleşmesi verir",
      "Giriş hatası renk dışında metinle iletilir",
      "MFA adımı ekran okuyucu uyumlu (üst UI)",
    ],
    deployment: [
      "Identity servisi yüksek erişilebilir; anahtar kasada (KMS)",
      "Oturum deposu hızlı (Redis benzeri) + çoğaltma",
      "Shared hosting'de gömülü oturum tablosu ile çalışabilir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: şüpheli giriş/çok-başarısız → hesabı kilitle + kullanıcıyı uyar (idempotent, zincir ≤6)",
      "Olay: parola değişti → tüm oturumları iptal et (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI anormal giriş deseni/risk skoru önerir; hesap kilidi ve kimlik politikası kararını güvenlik ekibi/insan verir",
    ],
    testing: [
      "Kimlik doğrulama + MFA + oturum/yenileme/iptal testleri",
      "Brute-force kilidi + token çalınma iptali negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A07 Identification and Authentication Failures: bu modülün birincil sorumluluğu",
      "A02 Cryptographic Failures: parola hash + token imza",
      "A09 Logging: giriş/iptal olayları forensic iz",
    ],
    integration: [
      "Identity, k-authz (kimlik→yetki), k-sso (federasyon), k-tenancy (kapsam) ile entegre",
      "Token doğrulama API/GraphQL katmanına girdi",
      "Tüm oturum-gerektiren modüller buraya bağlanır",
    ],
    moduleUsage: [
      "Identity Layer 0 modülü; bağımsız sunulmaz",
      "Kimlik doğrulama gereken her şey bu modülü kullanır",
    ],
  },

  "k-mod-l": {
    featureDefs: [
      "Module Registry + Manifest: modüllerin kaydı, manifest şeması (yetenek/bağımlılık/sürüm) ve keşfi",
      "Modülün hangi ArcheType/yetenekleri sunduğunu bildiren manifest sözleşmesi",
      "Sürüm/uyumluluk çözümleme ve modül yaşam döngüsü",
    ],
    security: [
      "Modül kaydı yetki + imza gerektirir; sahte modül engellenir",
      "Manifest doğrulanır (şema + izin talebi denetimi)",
      "Modülün talep ettiği izinler en-az-ayrıcalık denetiminden geçer",
    ],
    codeOptimization: [
      "Manifest tipli + sürümlü; bağımlılık grafiği döngüsüz (DAG)",
      "Modül keşfi indeksli; tembel yükleme",
      "Sürüm çözümleme deterministik",
    ],
    securityOptimization: [
      "Modül imzası doğrulanır (tedarik zinciri güvenliği)",
      "İzin talebi onay akışından geçer (otomatik genişleme yok)",
      "Sürüm kilidi (lock) yeniden-üretilebilir kurulum",
    ],
    performance: [
      "Manifest önbelleklenir; keşif hızlı",
      "Bağımlılık çözümleme bir kez (kurulumda)",
      "Tembel modül yükleme (ilk-kullanımda)",
    ],
    mobileApps: [
      "Registry UI içermez; mobile yalnız aktif modül yetenek listesi döner",
      "Mobil özellik bayrağı modül uygunluğuna göre",
      "Modül güncellemesi mobil istemciye sürüm sinyali",
    ],
    wcag: [
      "Doğrudan UI yok; yönetim UI'si modül listesini erişilebilir sunar (üst katman)",
      "Modül durumu (aktif/pasif) renk dışında metinle",
      "Manifest hatası erişilebilir mesaja çevrilir",
    ],
    deployment: [
      "Registry servisi sürümlü; modül dağıtımı kademeli",
      "Manifest doğrulama CI'da kapı",
      "Shared hosting'de yapılandırma-tabanlı modül listesi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: modül kaydedildi/güncellendi → manifest doğrula + bağımlılık çöz (idempotent, zincir ≤6)",
      "Olay: uyumsuz sürüm talep edildi → reddet + uyumlu sürüm öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI modül bağımlılık çakışması/sürüm önerisi üretir; modül kaydı ve izin onayını çekirdek ekip verir",
    ],
    testing: [
      "Manifest doğrulama + bağımlılık (DAG) çözümleme + sürüm uyum testleri",
      "Sahte/imzasız modül reddi + aşırı izin talebi negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Software and Data Integrity: modül imza doğrulama",
      "A01 Access Control: modül izin talebi denetimi",
      "A09 Logging: modül kayıt/güncelleme iz",
    ],
    integration: [
      "Module Registry, k-plugin (eklenti), k-schema (yetenek şeması), lifecycle ile entegre",
      "Modüllerin sunduğu ArcheType'lar buradan keşfedilir",
      "CI manifest doğrulama kapısı ile",
    ],
    moduleUsage: [
      "Module Registry Layer 0 modülü; bağımsız sunulmaz",
      "Modül yükleyen/keşfeden her şey bu kayıt defterini kullanır",
    ],
  },

  "k-plugin": {
    featureDefs: [
      "Plugin Registry + Manifest: eklentilerin kaydı, manifest (yetenek/izin/sürüm) ve izole çalıştırma",
      "Üçüncü-taraf/tenant eklentisinin sınırlı (sandbox) yürütülmesi",
      "Eklenti yaşam döngüsü (kur→etkinleştir→güncelle→kaldır) ve uyumluluk",
    ],
    security: [
      "Eklenti izole çalışır (sandbox); platform çekirdeğine doğrudan erişemez",
      "Eklenti imzalı + manifest izin talebi denetimli; en-az-ayrıcalık",
      "Eklenti tenant kapsamında; başka tenant verisine erişemez",
    ],
    codeOptimization: [
      "Eklenti tipli API yüzeyi üzerinden konuşur; iç API gizli",
      "Manifest sürümlü; uyumsuz eklenti yüklenmez",
      "Eklenti kaynak (CPU/bellek) kotalı",
    ],
    securityOptimization: [
      "Sandbox kaçışına karşı yetenek-tabanlı erişim (capability)",
      "Eklenti imza + tedarik zinciri doğrulama",
      "Kota/zaman aşımı ile kötü-niyetli eklenti sınırlanır",
    ],
    performance: [
      "Eklenti tembel yüklenir; sıcak yol dışında",
      "Kaynak kotası ile gürültülü-komşu etkisi sınırlı",
      "Manifest/yetenek önbellekli",
    ],
    mobileApps: [
      "Plugin altyapısı UI içermez; mobile yalnız aktif eklenti yetenekleri yansır",
      "Mobil eklenti UI'si üst katmanda render edilir (izole veri)",
      "Eklenti güncellemesi mobil istemciye sürüm sinyali",
    ],
    wcag: [
      "Doğrudan UI yok; eklenti UI'si üst katman erişilebilirlik kurallarına tabi",
      "Eklenti durumu renk dışında metinle (yönetim UI)",
      "Eklenti hatası erişilebilir mesaja çevrilir",
    ],
    deployment: [
      "Plugin sandbox ayrı yürütme bağlamı; sağlık izlemeli",
      "Eklenti dağıtımı imza doğrulamalı + kademeli",
      "Shared hosting'de eklenti sayısı/kaynak sınırlı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: eklenti kuruldu → imza+manifest doğrula, sandbox kotası ata (idempotent, zincir ≤6)",
      "Olay: eklenti kotayı aştı/hata verdi → izole et + devre dışı bırak (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI eklenti uyumluluk/güvenlik riski önerisi üretir; eklenti onayı ve sandbox politikasını çekirdek ekip verir",
    ],
    testing: [
      "Eklenti kayıt + sandbox izolasyon + kota/zaman aşımı testleri",
      "Sandbox kaçışı + imzasız eklenti + çapraz-tenant negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Software and Data Integrity: eklenti imza doğrulama",
      "A04 Insecure Design: sandbox + yetenek-tabanlı erişim",
      "A09 Logging: eklenti kayıt/devre-dışı iz",
    ],
    integration: [
      "Plugin Registry, k-mod-l (modül), k-authz (yetki), sandbox runtime ile entegre",
      "Eklentilerin sunduğu ArcheType uzantıları buradan keşfedilir",
      "CI imza/manifest doğrulama kapısı ile",
    ],
    moduleUsage: [
      "Plugin Registry Layer 0 modülü; bağımsız sunulmaz",
      "Eklenti yükleyen/çalıştıran her şey bu kayıt defterini kullanır",
    ],
  },

  "k-schema": {
    featureDefs: [
      "Schema/Metadata Engine (ArcheType): ArcheType alan/ilişki/doğrulama tanımını yöneten ve çalışma zamanında uygulayan motor",
      "Metadata-tanımlı alanlardan form/sorgu/doğrulama türeten merkez",
      "Şema sürümleme ve geriye uyumlu evrim",
    ],
    security: [
      "Şema değişikliği yetki + denetim izi; rastgele alan eklenemez",
      "Doğrulama kuralları sunucuda zorlanır (istemciye güvenilmez)",
      "Hassas alan işareti (PII) şemada taşınır → alt katman maskeler",
    ],
    codeOptimization: [
      "Şema bellek-içi indeks; doğrulama derlenmiş (hızlı)",
      "Metadata→Zod/doğrulayıcı tek kaynaktan türetilir",
      "Sürümler arası alan eşleme adaptörle",
    ],
    securityOptimization: [
      "Doğrulama sunucu-otoritesi; istemci doğrulaması yalnız UX",
      "Şema migration dry-run + geriye uyum kontrolü",
      "PII/duyarlılık etiketi şemadan zorunlu",
    ],
    performance: [
      "Derlenmiş doğrulayıcı + şema önbellek",
      "Alan projeksiyonu (yalnız gerekli alanlar)",
      "Büyük şema tembel çözümlenir",
    ],
    mobileApps: [
      "Schema UI içermez; mobile alan-meta (etiket/tip/doğrulama) sağlar",
      "Mobil form bu metadata'dan üretilir (tutarlılık)",
      "Şema sürümü mobil önbellek geçersizleme için damgalı",
    ],
    wcag: [
      "Alan metadata'sı etiket/yardım/hata metnini taşır → üst UI erişilebilir form üretir",
      "Zorunlu/hatalı alan işareti renk dışında metinle (üst UI)",
      "Alan açıklaması ekran okuyucuya bağlanır",
    ],
    deployment: [
      "Schema motoru çekirdekle dağıtılır; şema deposu PostgreSQL",
      "Şema migration CI dry-run kapısı",
      "Shared hosting'de gömülü çalışır",
    ],
    eca: [
      ECA_BOUND,
      "Olay: şema tanımı değişti → doğrulayıcıyı yeniden derle + etkilenen formları işaretle (idempotent, zincir ≤6)",
      "Olay: geçersiz veri yazımı → şema doğrulamada sınırda reddet (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alan/doğrulama kuralı taslağı önerir; şema tanımı ve migration kararını çekirdek ekip onaylar",
    ],
    testing: [
      "Metadata→doğrulayıcı türetme + sürümler-arası geriye uyum testi",
      "Sunucu-otoritesi doğrulama + PII etiket zorlama testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: sunucu-tarafı şema doğrulama",
      "A04 Insecure Design: metadata-tanımlı güvenli-varsayılan",
      "A08 Integrity: şema sürümlü/imzalı evrim",
    ],
    integration: [
      "Schema Engine, k-archetype-storage (depolama), tüm ArcheType fields/validation ile entegre",
      "Form/sorgu/doğrulama üst katmanlara buradan türetilir",
      "Migration aracı ve CI ile",
    ],
    moduleUsage: [
      "Schema/Metadata Engine Layer 0 modülü; bağımsız sunulmaz",
      "ArcheType alan/doğrulama tanımı gereken her şey bu motoru kullanır",
    ],
  },

  "k-sso": {
    featureDefs: [
      "SSO + Federation: kurumsal tek-oturum (SAML/OIDC) ile dış kimlik sağlayıcılardan giriş",
      "Kullanıcının kurum hesabıyla (Azure AD/Google/Okta) platforma girmesi",
      "Kimlik federasyonu, öznitelik eşleme ve tenant'a bağlama",
    ],
    security: [
      "SSO yanıtı (assertion) imza + süre + hedef (audience) doğrulanır",
      "Federasyon tenant kapsamlı; yanlış-tenant eşleşmesi engellenir",
      "Tekrar (replay) ve token enjeksiyonuna karşı koruma",
    ],
    codeOptimization: [
      "SAML/OIDC akışı standart kütüphane; öznitelik eşleme bildirimsel",
      "Sağlayıcı meta verisi önbellekli; anahtar rotasyonuna duyarlı",
      "Federe kimlik yerel principal'e tipli eşlenir",
    ],
    securityOptimization: [
      "Assertion imza zinciri + süre + audience zorunlu kontrol",
      "Sağlayıcı anahtarı (JWKS) periyodik yenilenir",
      "JIT (just-in-time) provizyon en-az-ayrıcalıkla",
    ],
    performance: [
      "Sağlayıcı meta/JWKS önbellek (kısa TTL)",
      "Federasyon kararı yerel oturuma dönüştürülür (tekrar dış çağrı yok)",
      "Giriş akışı düşük gecikme",
    ],
    mobileApps: [
      "Mobil SSO (uygulama-arası/tarayıcı sekmesi) akışı; güvenli geri-dönüş",
      "iOS/Android'de kurumsal giriş yönlendirmesi",
      "Federe oturum mobil token akışına bağlanır",
    ],
    wcag: [
      "SSO yönlendirme UI'si erişilebilir; geri-dönüş hatası metinle",
      "Sağlayıcı seçimi klavye erişimli (üst UI)",
      "Giriş hatası renk dışında metinle iletilir",
    ],
    deployment: [
      "SSO servisi yüksek erişilebilir; sağlayıcı meta yönetimi",
      "Çoklu sağlayıcı (tenant başına) yapılandırma",
      "Shared hosting'de tek sağlayıcı federasyon",
    ],
    eca: [
      ECA_BOUND,
      "Olay: SSO girişi başarılı → JIT provizyon + yerel oturum aç (idempotent, zincir ≤6)",
      "Olay: federasyon sağlayıcı erişilemez → güvenli geri-dönüş + kullanıcıyı bilgilendir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI federasyon yapılandırma/öznitelik eşleme önerisi üretir; SSO sağlayıcı ve güven politikası kararını yönetici verir",
    ],
    testing: [
      "SAML/OIDC akışı + assertion imza/süre/audience + JIT provizyon testleri",
      "Replay + yanlış-tenant + sahte assertion negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A07 Authentication Failures: federe kimlik doğrulama",
      "A08 Integrity: assertion imza/bütünlük",
      "A09 Logging: SSO giriş/federasyon olayları iz",
    ],
    integration: [
      "SSO, k-identity (yerel oturum), k-tenancy (kapsam), kurumsal IdP (Azure AD/Okta) ile entegre",
      "OIDC/SAML dış sağlayıcı ile",
      "Federe principal authz'a girdi",
    ],
    moduleUsage: [
      "SSO + Federation Layer 0 taşı; k-identity'ye bağlı, bağımsız sunulmaz",
      "Kurumsal tek-oturum gereken tenant'lar bu yeteneği kullanır",
    ],
  },

  "k-tenancy": {
    featureDefs: [
      "Tenancy (Çok-kiracılık): her tenant'ın verisini mantıksal olarak izole eden temel; tenant_id + satır-düzeyi güvenlik (RLS)",
      "Tenant yaşam döngüsü (oluştur→yapılandır→askıya al→sil) ve kaynak sınırları",
      "Tenant bağlamının (context) her isteğe taşınması",
    ],
    security: [
      "Tenant izolasyonu PostgreSQL RLS ile veritabanı düzeyinde zorlanır (uygulama hatası sızdırmasın)",
      "Her sorgu tenant_id kapsamlı; çapraz-tenant erişim imkânsız",
      "Tenant silme verisini güvenli ve geri-döndürülemez temizler",
    ],
    codeOptimization: [
      "Tenant bağlamı istek başına tek yerde çözülür; aşağıya örtük taşınır",
      "RLS politikası merkezi; her tabloya tutarlı uygulanır",
      "Tenant-yapılandırması önbellekli",
    ],
    securityOptimization: [
      "RLS varsayılan-deny; politika eksikse erişim yok",
      "Tenant bağlamı sahteleştirilemez (imzalı/sunucu-tarafı)",
      "Tenant kaynak kotası (gürültülü-komşu önleme)",
    ],
    performance: [
      "tenant_id bileşik indeksin ilk kolonu (tüm sorgular kapsamlı)",
      "Tenant-yapılandırma önbellek (kısa TTL)",
      "Büyük tenant için sharding'e (k-tenancy-deep) köprü",
    ],
    mobileApps: [
      "Tenancy UI içermez; mobil oturumu doğru tenant bağlamına bağlar",
      "Çok-tenant kullanıcı için mobilde tenant değiştirme",
      "Tenant kotası mobil kullanımı da kapsar",
    ],
    wcag: [
      "Doğrudan UI yok; tenant seçimi üst UI'de erişilebilir sunulur",
      "Aktif tenant göstergesi renk dışında metinle",
      "Tenant değiştirme klavye erişimli (üst UI)",
    ],
    deployment: [
      "Tenancy çekirdekle dağıtılır; RLS PostgreSQL'de",
      "Tenant sağlama (provisioning) otomatik + kotalı",
      "Shared hosting'de tek-tenant veya küçük çok-tenant",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tenant oluşturuldu → RLS politikası + varsayılan yapılandırma + kota kur (idempotent, zincir ≤6)",
      "Olay: tenant silindi/askıya alındı → erişimi kes + verisini güvenli temizle/dondur (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tenant kullanım/kota anomali önerisi üretir; tenant sağlama ve izolasyon politikası kararını çekirdek ekip verir",
    ],
    testing: [
      "RLS izolasyon + tenant bağlamı + kota testleri (en yüksek kapsam)",
      "Çapraz-tenant sızıntı + sahte tenant bağlamı negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Broken Access Control: tenant izolasyonu birincil sorumluluk",
      "A04 Insecure Design: RLS varsayılan-deny",
      "A09 Logging: tenant yaşam döngüsü olayları forensic iz",
    ],
    integration: [
      "Tenancy, k-authz (kapsam), k-archetype-storage (RLS), tüm ArcheType tenant-isolation ile entegre",
      "PostgreSQL RLS ile doğrudan",
      "Her modül tenant bağlamını buradan alır",
    ],
    moduleUsage: [
      "Tenancy Layer 0 modülü; bağımsız sunulmaz",
      "Çok-kiracılı her şey bu izolasyon sözleşmesini zorunlu kullanır",
    ],
  },

  "k-tenancy-deep": {
    featureDefs: [
      "Sharding (Yatay Bölme): çok büyük ölçekte veriyi parçalara (shard) bölerek dağıtma; tek tenant tek DB'ye sığmadığında",
      "Shard anahtarı (tenant/bölge) ile yönlendirme ve shard-arası sorgu stratejisi",
      "Yeniden dengeleme (rebalancing) ve shard taşıma",
    ],
    security: [
      "Tenant izolasyonu shard'lar arasında da korunur (tenant tek shard'da)",
      "Shard yönlendirme tenant kapsamlı; yanlış-shard erişimi engellenir",
      "Shard taşıma sırasında veri bütünlüğü + erişim sürekliliği",
    ],
    codeOptimization: [
      "Shard anahtarı kararı erken; sorgu doğru shard'a yönlenir",
      "Shard-arası sorgu (gerekirse) saçıl-topla (scatter-gather) sınırlı",
      "Yönlendirme tablosu önbellekli",
    ],
    securityOptimization: [
      "Shard yönlendirme sahteleştirilemez (sunucu-tarafı)",
      "Yeniden dengeleme kademeli + geri-alınabilir",
      "Shard başına kota/izolasyon",
    ],
    performance: [
      "Tek-shard sorgu çoğunlukta (saçıl-topla istisna)",
      "Shard başına bağlantı havuzu",
      "Yeniden dengeleme arka planda, sıcak yolu engellemez",
    ],
    mobileApps: [
      "Sharding UI içermez; mobil için şeffaf (yönlendirme sunucuda)",
      "Mobil sorgu doğru shard'a otomatik yönlenir",
      "Shard taşıma mobil kullanıcıya kesintisiz",
    ],
    wcag: [
      "Doğrudan UI yok; yönetim panelinde shard durumu erişilebilir (üst katman)",
      "Shard sağlığı renk dışında metinle",
      "Yeniden dengeleme ilerleme göstergesi erişilebilir",
    ],
    deployment: [
      "Çok shard'lı PostgreSQL topolojisi; yönlendirici katman",
      "Yeniden dengeleme kontrollü; izlemeli",
      "Shared hosting'de sharding gereksiz (tek DB yeterli) → kapalı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tenant eşiği aştı → yeni shard'a taşıma planla (idempotent, zincir ≤6)",
      "Olay: shard dengesiz → kademeli yeniden dengeleme tetikle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI shard dağılımı/yeniden dengeleme zamanı önerisi üretir; sharding topoloji kararını çekirdek ekip verir",
    ],
    testing: [
      "Shard yönlendirme + tek-shard sorgu + saçıl-topla testleri",
      "Yeniden dengeleme sırasında izolasyon + veri bütünlüğü + süreklilik testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: shard'lar arası tenant izolasyonu korunur",
      "A04 Insecure Design: kademeli/geri-alınabilir yeniden dengeleme",
      "A09 Logging: shard taşıma/dengeleme olayları iz",
    ],
    integration: [
      "Sharding, k-tenancy (izolasyon), k-archetype-storage (depolama), PostgreSQL topolojisi ile entegre",
      "Çok büyük tenant'ları yatay bölerek ölçekler",
      "İzleme/uyarı altyapısı ile",
    ],
    moduleUsage: [
      "Sharding Layer 0 taşı; k-tenancy'ye bağlı, yalnız büyük ölçekte devreye girer",
      "Tek DB'ye sığmayan tenant'lar için bu yetenek kullanılır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) =>
  fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-layer0] atlandı (dosya yok): ${id}`);
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
  `[seed-layer0] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`,
);
