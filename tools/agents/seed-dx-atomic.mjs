#!/usr/bin/env node
/**
 * seed-dx-atomic — Faz B17+B18 (Cowork tek-ajan). dx (Geliştirici Deneyimi: CLI/marketplace/API gateway/
 * dev portal/workflow/dış servisler) ve atomic (Atomik Tipler temeli) kümelerinin 8 ŞABLON düğümüne ELLE
 * yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Doğrula: node tools/agents/check-content.mjs dx && node tools/agents/check-content.mjs atomic
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");
const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const CONTENT = {
  "app-dx": {
    featureDefs: [
      "Geliştirici Deneyimi (DX) ürün ailesi: ArcheType üretimini hızlandıran araçlar — CLI, marketplace, API gateway, dev portal, iş akışı",
      "Geliştiricinin yereldeki ArcheType taslağından prod'a giden yolu kolaylaştırır",
      "Son kullanıcıya değil platformu kullanan geliştiriciye/iş ortağına hizmet eder",
    ],
    security: [
      "DX araçları geliştirici kimlik doğrulamasına tabi; üretim sırrı araca sızmaz",
      "Yerel araç prod kimlik bilgisini saklamaz; geçici/dar kapsamlı token",
      "Marketplace yayını imza + inceleme gerektirir",
    ],
    codeOptimization: [
      "Araçlar tipli sözleşmeyi paylaşır (CLI/portal aynı şemadan üretir)",
      "Scaffolding şablonları tek kaynaktan; tekrar azaltılır",
      "Araç çıktısı deterministik (yeniden-üretilebilir)",
    ],
    securityOptimization: [
      "Geliştirici token en-az-ayrıcalık + kısa ömür",
      "Marketplace paketi imzalı (tedarik zinciri)",
      "Araç güncellemesi sürümlü + denetim izi",
    ],
    performance: [
      "CLI komutları hızlı geri-bildirim (yerel)",
      "Portal dokümanı statik/önbellekli",
      "Marketplace araması indeksli",
    ],
    mobileApps: [
      "DX çoğunlukla masaüstü/CLI; portal mobilde okunur",
      "Dev portal dokümanı dar ekranda erişilebilir",
      "Mobil onay (marketplace) push ile",
    ],
    wcag: [
      "Dev portal WCAG 2.2 AAA; dokümantasyon erişilebilir",
      "Kod örneği yüksek kontrast + metin alternatifi",
      "Portal gezinme klavye erişimli",
    ],
    deployment: [
      "DX servisleri (portal/gateway) standart; CLI npm/binary dağıtımı",
      "Marketplace CDN; sürüm kayıt defteri",
      "Shared hosting'de portal statik barındırma",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni modül yayınlandı → marketplace indeksle + portal dokümanı güncelle (idempotent, zincir ≤6)",
      "Olay: imzasız paket yüklendi → reddet + geliştiriciyi uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI scaffolding/dokümantasyon taslağı üretir; yayın ve API sözleşmesi kararını geliştirici/çekirdek ekip verir",
    ],
    testing: [
      "CLI/scaffolding çıktı + portal/gateway entegrasyon testleri",
      "İmzasız paket reddi + token kapsam negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Software and Data Integrity: marketplace imza doğrulama",
      "A01 Access Control: geliştirici token kapsamı",
      "A09 Logging: yayın/araç kullanımı iz",
    ],
    integration: [
      "DX, k-mod-l (modül kayıt), k-plugin (eklenti), CI/CD ile entegre",
      "ArcheType üretim hattının geliştirici-yüzü",
      "Dış servisler (services) ile",
    ],
    moduleUsage: [
      "Geliştirici Deneyimi app'i platform üzerinde geliştirme yapanlara araç sağlar",
      "ArcheType/modül geliştiren herkes bu araçları kullanır",
    ],
  },

  "dx-api-gateway": {
    featureDefs: [
      "API Gateway + Developer Portal: dış isteklerin tek giriş noktası + geliştirici dokümantasyon portalı",
      "Kimlik doğrulama, hız sınırı (rate limit), yönlendirme ve API anahtarı yönetimi",
      "İnteraktif API dokümanı (OpenAPI) ve deneme konsolu",
    ],
    security: [
      "Gateway her isteği kimlik+yetki kontrolünden geçirir (kenar koruması)",
      "API anahtarı kapsamlı + iptal edilebilir; sır portala sızmaz",
      "Hız sınırı + WAF benzeri filtre ile kötüye kullanım daraltılır",
    ],
    codeOptimization: [
      "Gateway ince/durumsuz; yetki kararı k-authz'a delege",
      "OpenAPI tek kaynaktan portal+istemci SDK üretir",
      "Yönlendirme yapılandırması bildirimsel",
    ],
    securityOptimization: [
      "API anahtarı en-az-ayrıcalık + rotasyon",
      "Hız sınırı tenant/anahtar başına; ani yük (burst) korumalı",
      "İstek imza/doğrulama kenar katmanında",
    ],
    performance: [
      "Gateway düşük gecikme; yetki kararı önbellekli",
      "Hız sınırı sayacı bellek-içi hızlı",
      "Portal dokümanı statik/CDN",
    ],
    mobileApps: [
      "Gateway mobil istemci API trafiğini de yönetir",
      "Mobil için yanıt sıkıştırma/alan-projeksiyonu gateway'de",
      "Portal mobilde okunur (doküman)",
    ],
    wcag: [
      "Developer portal WCAG 2.2 AAA; API dokümanı erişilebilir",
      "Deneme konsolu klavye erişimli; hata metinle",
      "Kod bloğu yüksek kontrast",
    ],
    deployment: [
      "Gateway yüksek erişilebilir + bölgesel; portal statik",
      "Yapılandırma sürümlü + kademeli dağıtım",
      "Shared hosting'de hafif reverse-proxy ile",
    ],
    eca: [
      ECA_BOUND,
      "Olay: hız sınırı aşıldı → isteği reddet (429) + anahtar sahibini uyar (idempotent, zincir ≤6)",
      "Olay: API sözleşmesi değişti → portal dokümanı + SDK yeniden üret (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI API kullanım anomali/sınır önerisi üretir; gateway yönlendirme ve sözleşme kararını çekirdek ekip verir",
    ],
    testing: [
      "Yönlendirme + kimlik/yetki + hız sınırı entegrasyon testleri",
      "Anahtar iptali + aşırı yük (rate limit) + sahte istek negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: kenar yetki kontrolü",
      "A04 Insecure Design: hız sınırı + güvenli-varsayılan",
      "A09 Logging: API erişimi/red kenar katmanında iz",
    ],
    integration: [
      "API Gateway, k-identity/k-authz (kimlik/yetki), tüm dış API yüzeyi ile entegre",
      "OpenAPI portal+SDK üretimi ile",
      "İzleme/uyarı altyapısıyla",
    ],
    moduleUsage: [
      "API Gateway + Developer Portal DX taşı; dış API'nin tek kapısı",
      "Dış istemci/iş ortağı entegrasyonu gereken her şey bu gateway'i kullanır",
    ],
  },

  "dx-cli": {
    featureDefs: [
      "Module CLI + Scaffolding: komut satırından modül/ArcheType iskeleti üretme ve yerel geliştirme",
      "Şablondan dosya/klasör yapısı, test iskeleti ve manifest üretimi",
      "Yerel çalıştırma, doğrulama ve yayın-öncesi kontrol komutları",
    ],
    security: [
      "CLI prod kimlik bilgisi saklamaz; geçici/dar kapsamlı token kullanır",
      "Scaffolding güvenli-varsayılan üretir (deny-by-default yetki şablonu)",
      "Yayın komutu imza + inceleme akışına bağlanır",
    ],
    codeOptimization: [
      "Scaffolding şablonları tek kaynaktan; üretilen kod tipli",
      "CLI komutları bileşik/öngörülebilir; çıktı deterministik",
      "Üretilen test iskeleti çalışır halde",
    ],
    securityOptimization: [
      "Token kısa ömür + en-az-ayrıcalık",
      "Üretilen şablon en-az-ayrıcalık yetki içerir",
      "CLI sürümü imzalı dağıtım",
    ],
    performance: [
      "CLI komutları hızlı (yerel, ağ-bağımsız çoğunlukla)",
      "Şablon üretimi anlık",
      "Doğrulama artımlı (yalnız değişen)",
    ],
    mobileApps: [
      "CLI masaüstü aracı; mobil kapsam dışı",
      "Üretilen ArcheType mobil-hazır iskelet içerir",
      "Mobil ön-izleme üst araçlarda",
    ],
    wcag: [
      "CLI çıktısı erişilebilir terminal metni (renk-bağımsız anlam)",
      "Hata/uyarı metinle ayırt edilir (yalnız renk değil)",
      "Üretilen UI iskeleti WCAG 2.2 AAA varsayılanı taşır",
    ],
    deployment: [
      "CLI npm/binary olarak dağıtılır; sürümlü",
      "Yayın komutu CI'ya bağlanır",
      "Shared hosting bağımsız (geliştirici makinesinde çalışır)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: scaffold üretildi → manifest doğrula + test iskeleti oluştur (idempotent, zincir ≤6)",
      "Olay: yayın-öncesi doğrulama başarısız → yayını engelle + rapor (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI komut/scaffold şablonu önerir; üretilen kodun yayınını ve sözleşmesini geliştirici onaylar",
    ],
    testing: [
      "Scaffolding çıktı doğruluğu + manifest geçerliliği testleri",
      "Üretilen iskeletin testlerinin çalışması + güvenli-varsayılan kontrolü",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: CLI dağıtımı imzalı",
      "A04 Insecure Design: scaffold güvenli-varsayılan",
      "A09 Logging: yayın komutları iz",
    ],
    integration: [
      "CLI, k-mod-l (manifest), k-schema (şema), CI/CD ile entegre",
      "Üretilen ArcheType platform sözleşmelerine uyar",
      "dx-workflow akışının ilk adımı",
    ],
    moduleUsage: [
      "Module CLI + Scaffolding DX modülü; geliştirici aracı",
      "Yeni modül/ArcheType başlatan her geliştirici bu CLI'yı kullanır",
    ],
  },

  "dx-marketplace": {
    featureDefs: [
      "Marketplace + Versioning: modül/eklentilerin yayınlandığı, keşfedildiği ve sürümlendiği pazar yeri",
      "Yayın (publish), sürüm (semver), bağımlılık ve kurulum yönetimi",
      "İş ortağı/üçüncü-taraf paket dağıtımı ve inceleme",
    ],
    security: [
      "Yayınlanan paket imzalı + inceleme/onaydan geçer (kötü-amaçlı paket engeli)",
      "Kurulum izin talebi en-az-ayrıcalık denetiminden geçer",
      "Sürüm değiştirilemez (immutable); yeniden-yayın yeni sürüm",
    ],
    codeOptimization: [
      "Semver çözümleme deterministik; bağımlılık DAG (döngüsüz)",
      "Paket metadata indeksli; keşif hızlı",
      "Sürüm kilidi (lock) yeniden-üretilebilir kurulum",
    ],
    securityOptimization: [
      "Tedarik zinciri: imza + SBOM + güvenlik açığı taraması",
      "Yayıncı kimliği doğrulanır; sahte yayıncı engeli",
      "Geri-çekme (yanking) güvenli + bildirimli",
    ],
    performance: [
      "Paket indirme CDN; metadata önbellek",
      "Arama indeksli; sayfalı sonuç",
      "Bağımlılık çözümleme bir kez (kurulumda)",
    ],
    mobileApps: [
      "Marketplace mobilde keşif/okuma (kurulum masaüstü/CI)",
      "Mobil onay (yayın inceleme) push ile",
      "Dar ekranda paket kartı",
    ],
    wcag: [
      "Marketplace UI WCAG 2.2 AAA; paket sayfası erişilebilir",
      "Sürüm/durum renk dışında metinle",
      "Arama/filtre klavye erişimli",
    ],
    deployment: [
      "Marketplace servisi + CDN; sürüm kayıt defteri",
      "Yayın hattı imza doğrulamalı",
      "Shared hosting'de kısıtlı yerel paket deposu",
    ],
    eca: [
      ECA_BOUND,
      "Olay: paket yayınlandı → imza+SBOM+güvenlik taraması, geçerse indeksle (idempotent, zincir ≤6)",
      "Olay: güvenlik açığı bulundu → etkilenen sürümü işaretle + kullanıcıları uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI paket güvenlik/uyumluluk riski ve sürüm önerisi üretir; yayın onayı ve geri-çekme kararını ekip verir",
    ],
    testing: [
      "Yayın + semver çözümleme + bağımlılık kurulum testleri",
      "İmzasız/açıklı paket reddi + sürüm değişmezliği negatif testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Software and Data Integrity: imza + SBOM + tedarik zinciri",
      "A06 Vulnerable Components: güvenlik açığı taraması",
      "A09 Logging: yayın/geri-çekme iz",
    ],
    integration: [
      "Marketplace, k-mod-l/k-plugin (kayıt), dx-cli (yayın), güvenlik taraması ile entegre",
      "Paket→modül/eklenti kurulumu ile",
      "CI yayın hattı ile",
    ],
    moduleUsage: [
      "Marketplace + Versioning DX modülü; paket dağıtım merkezi",
      "Modül/eklenti yayınlayan/kuran herkes marketplace'i kullanır",
    ],
  },

  "dx-workflow": {
    featureDefs: [
      "Geliştirici İş Akışı (Uçtan Uca): yerel taslaktan PR→CI→inceleme→prod'a giden akışın boşluklarını kapatır",
      "Yerel geliştirme, doğrulama kapıları, PR şablonu ve dağıtım adımlarının tanımı",
      "ArcheType prod-güncellemesi için insan-onaylı akış (ADMIN_FLOW)",
    ],
    security: [
      "Prod'a doğrudan yazım yok; değişiklik PR→inceleme→onay→merge'den geçer",
      "AI önerisi insan onayı olmadan main'e push edemez",
      "Dağıtım sırrı CI kasasında; logda görünmez",
    ],
    codeOptimization: [
      "Akış adımları bildirimsel (CI yapılandırması); tekrar-üretilebilir",
      "Doğrulama kapıları artımlı (yalnız değişen)",
      "PR şablonu tutarlı kalite kontrol listesi",
    ],
    securityOptimization: [
      "Kapılar bloklayıcı (yeşil değilse merge yok)",
      "Onay görev ayrılığı (yazan ≠ onaylayan)",
      "Dağıtım geri-alınabilir (rollback planı)",
    ],
    performance: [
      "CI artımlı + önbellekli (hızlı geri-bildirim)",
      "Paralel kapılar (typecheck/test/lint eşzamanlı)",
      "Dağıtım kademeli (canary)",
    ],
    mobileApps: [
      "Akış geliştirici-merkezli; mobilde PR/onay görüntüleme",
      "Mobil push ile CI sonucu/onay bildirimi",
      "Dar ekranda PR durumu",
    ],
    wcag: [
      "Akış arayüzleri (PR/CI panel) erişilebilir (üst araçlarda)",
      "Kapı durumu (geçti/kaldı) renk dışında metinle",
      "Onay aksiyonu klavye erişimli",
    ],
    deployment: [
      "GitHub Actions → kademeli dağıtım; Pages/sunucu hedefi",
      "Geri-alma (rollback) tanımlı; runbook",
      "Shared hosting (Hetzner/Debian) hedefi destekli",
    ],
    eca: [
      ECA_BOUND,
      "Olay: PR açıldı → kapıları çalıştır (test/tip/lint/a11y); hepsi yeşilse merge'e izin (idempotent, zincir ≤6)",
      "Olay: prod-güncelleme önerisi → ADMIN_FLOW (diff→veri-etki→dry-run→onay) (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kod/PR iyileştirme önerir ve PR açabilir; main'e merge ve prod dağıtım kararını insan verir (enterprise: AI main'e doğrudan push etmez)",
    ],
    testing: [
      "Uçtan uca akış (yerel→PR→CI→dağıtım) entegrasyon testi",
      "Bloklayıcı kapı + görev ayrılığı + rollback testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: imzalı/onaylı dağıtım hattı",
      "A01 Access Control: merge/dağıtım yetkisi (görev ayrılığı)",
      "A09 Logging: PR/merge/dağıtım kararları iz",
    ],
    integration: [
      "Workflow, dx-cli (yerel), GitHub (PR/CI), ADMIN_FLOW/AI_FIX_LOOP ile entegre",
      "Kalite kapıları (typecheck/test/axe) ile",
      "Dağıtım hedefi (Pages/Hetzner) ile",
    ],
    moduleUsage: [
      "Geliştirici İş Akışı DX modülü; üretim hattının orkestrasyonu",
      "Kod gönderen/dağıtan her geliştirici bu akışı izler",
    ],
  },

  "services": {
    featureDefs: [
      "Services (Dış Sağlayıcılar): ödeme/e-posta/SMS/depolama gibi dış servisleri tipli adaptörle platforma bağlar",
      "Sağlayıcı-bağımsız arayüz (port) + sağlayıcıya özel adaptör (örn. ödeme için birden çok sağlayıcı)",
      "Sağlayıcı değişiminde uygulama kodunu etkilemeyen soyutlama",
    ],
    security: [
      "Sağlayıcı kimlik bilgisi (API key) kasada; kodda/loglarda görünmez",
      "Dış çağrı en-az-ayrıcalık; yanıt doğrulanır (güvenilmez girdi)",
      "Webhook imzası doğrulanır (sahte geri-çağrı engeli)",
    ],
    codeOptimization: [
      "Port/adaptör deseni: arayüz sabit, sağlayıcı değişebilir",
      "Yeniden-deneme + devre kesici (circuit breaker) ortak sarmalda",
      "Adaptör tipli; sağlayıcı yanıtı normalize edilir",
    ],
    securityOptimization: [
      "Sır rotasyonu desteklenir; sağlayıcı anahtarı dar kapsamlı",
      "Webhook imza + zaman damgası (replay engeli)",
      "Dış yanıt şema doğrulamadan geçer",
    ],
    performance: [
      "Dış çağrı zaman aşımı + yeniden-deneme (üstel geri-çekilme)",
      "Devre kesici ile çağlayan hatayı önleme",
      "Yanıt önbellek (uygun olduğunda)",
    ],
    mobileApps: [
      "Services UI içermez; mobil akışlar (ödeme/SMS) bu adaptörleri kullanır",
      "Mobil ödeme akışı sağlayıcı SDK'sıyla köprülenir",
      "Bildirim (push/SMS) bu katmandan",
    ],
    wcag: [
      "Doğrudan UI yok; sağlayıcı hatası üst UI'de erişilebilir metne çevrilir",
      "Ödeme/dış akış durumu renk dışında metinle (üst UI)",
      "Hata mesajı kullanıcıya anlaşılır iletilir",
    ],
    deployment: [
      "Adaptörler yapılandırma ile seçilir; sır kasada (env/KMS)",
      "Sağlayıcı sağlık izleme + yedek sağlayıcı (failover)",
      "Shared hosting'de dış servis çağrısı (giden) desteklenir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: dış servis hata/zaman aşımı → yeniden-dene, eşikte devre kes + uyar (idempotent, zincir ≤6)",
      "Olay: webhook geldi → imza doğrula, geçersizse reddet (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sağlayıcı seçimi/yeniden-deneme deseni önerir; kimlik bilgisi ve sağlayıcı sözleşmesi kararını insan verir",
    ],
    testing: [
      "Adaptör sözleşme + yeniden-deneme/devre kesici + webhook imza testleri",
      "Sahte webhook reddi + sır-sızıntısı + sağlayıcı failover testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A02 Cryptographic Failures: sağlayıcı sırrı kasada + webhook imza",
      "A10 SSRF: dış çağrı hedefi doğrulanır",
      "A09 Logging: dış çağrı/webhook iz (sır maskeli)",
    ],
    integration: [
      "Services, finance (ödeme), comms (e-posta/SMS), file (depolama) ile entegre",
      "Dış sağlayıcı (Stripe/iyzico/SMTP/SMS/S3 benzeri) ile",
      "Port/adaptör ile sağlayıcı değiştirilebilir",
    ],
    moduleUsage: [
      "Services (Dış Sağlayıcılar) modülü; dış dünya ile tipli köprü",
      "Dış servis (ödeme/e-posta/SMS/depolama) çağıran her şey bu adaptörleri kullanır",
    ],
  },

  "app-atomic": {
    featureDefs: [
      "Atomic — platformun en küçük, bölünemez tip ve değer nesnelerinin (value object) temeli (Faz 0)",
      "Para, e-posta, kimlik, tarih-aralığı gibi ilkel domain tiplerini tanımlar",
      "Üstteki tüm katmanların güvendiği değişmez (immutable) yapı taşları",
    ],
    security: [
      "Değer nesneleri kendi kendini doğrular (geçersiz durum oluşamaz)",
      "Hassas tipler (örn. TCKN) maskeleme/eşitlik kuralını içinde taşır",
      "Değişmezlik yan-etki/kurcalama riskini azaltır",
    ],
    codeOptimization: [
      "Değer nesneleri saf/değişmez; eşitlik değere göre",
      "Doğrulama yapıcıda (constructor) bir kez; sonrası güvenli",
      "Hafif/serileştirilebilir; her katmanda paylaşılır",
    ],
    securityOptimization: [
      "Geçersiz değer hiç oluşmaz (parse, don't validate)",
      "Hassas tip log'da otomatik maskeli",
      "Tip sınırı enjeksiyonu daraltır (örn. doğrulanmış e-posta)",
    ],
    performance: [
      "Değer nesneleri hafif; tahsis maliyeti düşük",
      "Doğrulama bir kez (yapıcıda)",
      "Serileştirme kompakt",
    ],
    mobileApps: [
      "Atomik tipler UI içermez; mobil/masaüstü aynı tipleri paylaşır",
      "Mobil form doğrulaması aynı değer nesnelerinden",
      "Tutarlı tip → platformlar arası uyum",
    ],
    wcag: [
      "Doğrudan UI yok; tip doğrulama hatası üst UI'de erişilebilir metne çevrilir",
      "Biçim hatası (örn. e-posta) kullanıcıya anlaşılır iletilir",
      "Para/tarih biçimi yerelleştirme (i18n) ile erişilebilir",
    ],
    deployment: [
      "Atomik tipler kütüphane olarak her serviste gömülü",
      "Sürümlü; kırıcı değişiklik nadir + migration ile",
      "Shared hosting dahil her ortamda çalışır (bağımlılıksız)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: geçersiz değer oluşturulmaya çalışıldı → yapıcıda reddet (sınırda hata) (idempotent, zincir ≤6)",
      "Olay: tip sözleşmesi değişti → bağımlı katmanlara migration sinyali (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI yeni değer nesnesi/doğrulama kuralı taslağı önerir; atomik tip sözleşmesi kararını çekirdek ekip verir",
    ],
    testing: [
      "Değer nesnesi doğrulama + değişmezlik + eşitlik birim testleri (en yüksek kapsam)",
      "Geçersiz değer reddi + hassas tip maskeleme testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: tip sınırı doğrulanmış değer (parse, don't validate)",
      "A04 Insecure Design: geçersiz durum temsil edilemez",
      "A02 Cryptographic Failures: hassas tip maskeli",
    ],
    integration: [
      "Atomic, layer0 (en alt) dahil tüm katmanlarca tüketilir; aşağı bağımlılığı yok",
      "Şema (k-schema) bu tipleri kullanır",
      "Tüm ArcheType alanları bu ilkellerden kurulur",
    ],
    moduleUsage: [
      "Atomic app'i platformun en küçük yapı taşlarını sağlar; bağımsız ürün değil",
      "Her katman ve ArcheType bu atomik tipleri kullanır",
    ],
  },

  "atomic-types": {
    featureDefs: [
      "Faz 0 — Atomik Tipler: ilk kurulan, bölünemez domain ilkellerinin somut kataloğu (Money, Email, TenantId, DateRange, ...)",
      "Her tipin doğrulama kuralı, biçimi ve eşitlik tanımı",
      "Üst tüm fazların (Faz 1+) güvendiği değişmez temel",
    ],
    security: [
      "Her tip kendi doğrulamasını taşır; geçersiz örnek oluşamaz",
      "Hassas tip (TCKN/IBAN) maskeleme + eşitlik kuralı içinde",
      "Para tipi yuvarlama/para birimi hatasını yapısal önler",
    ],
    codeOptimization: [
      "Tipler saf/değişmez; küçük ve test edilebilir",
      "Doğrulama yapıcıda; yan etki yok",
      "Ortak davranış (serialize/eşitlik) paylaşılan temelde",
    ],
    securityOptimization: [
      "Parse-etme-doğrulama deseni (geçersiz değer hiç var olmaz)",
      "Hassas tip log maskeleme varsayılan",
      "Para tipi tam-sayı kuruş (kayan-nokta hatası yok)",
    ],
    performance: [
      "Hafif tahsis; doğrulama bir kez",
      "Kompakt serileştirme",
      "Sık kullanılan tip örnekleri yeniden-kullanılabilir",
    ],
    mobileApps: [
      "Aynı tipler mobil istemcide de kullanılır (tutarlılık)",
      "Mobil form/doğrulama bu tiplerden türer",
      "Yerelleştirilmiş biçim (para/tarih) mobilde",
    ],
    wcag: [
      "UI yok; biçim/doğrulama hatası üst UI'de erişilebilir metne dönüşür",
      "Para/tarih yerel biçimi erişilebilir gösterilir",
      "Geçersiz giriş anlaşılır mesajla",
    ],
    deployment: [
      "Kütüphane olarak gömülü; sıfır dış bağımlılık hedefi",
      "Sürümlü; kırıcı değişiklik migration ile",
      "Her ortamda (shared hosting dahil) çalışır",
    ],
    eca: [
      ECA_BOUND,
      "Olay: geçersiz Money/Email oluşturulmaya çalışıldı → yapıcıda reddet (idempotent, zincir ≤6)",
      "Olay: tip kuralı güncellendi → bağımlı şema/migration sinyali (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI yeni atomik tip/doğrulama kuralı taslağı önerir; tip kataloğu kararını çekirdek ekip verir",
    ],
    testing: [
      "Her tip için doğrulama/değişmezlik/eşitlik + biçim birim testleri",
      "Geçersiz değer reddi + para yuvarlama + hassas maskeleme testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: doğrulanmış tip sınırı",
      "A04 Insecure Design: geçersiz durum temsil edilemez",
      "A02 Cryptographic Failures: hassas tip maskeli + para tam-sayı",
    ],
    integration: [
      "Atomik Tipler, app-atomic temeli; k-schema ve tüm ArcheType alanlarınca tüketilir",
      "Aşağı bağımlılığı yok (en temel katman)",
      "Tüm doğrulama/biçim tek kaynaktan",
    ],
    moduleUsage: [
      "Faz 0 Atomik Tipler modülü; platformun ilk ve en temel yapı taşları",
      "Money/Email/TenantId gibi tip gereken her şey bu katalogdan kullanır",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-dx-atomic] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-dx-atomic] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
