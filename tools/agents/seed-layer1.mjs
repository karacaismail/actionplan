#!/usr/bin/env node
/**
 * seed-layer1 — Faz B5 (Cowork tek-ajan). layer1 (yatay platform yetenekleri / in-tree modüller)
 * kümesinin 24 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Doğrula: node tools/agents/check-content.mjs layer1  (+ npm run typecheck)
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
  "app-layer1": {
    featureDefs: [
      "Layer 1 / In-tree Modüller: audit, bildirim, arama, iş akışı, dosya, party gibi yatay yetenekler",
      "Her app'in paylaştığı, ArcheType'a bağlanan ortak modül kütüphanesi",
      "Tek seferde yazılır, tüm app'lerden tüketilir (kod tekrarı yok)",
    ],
    security: [
      "Yatay modüller tenant izolasyonunu üst ArcheType'tan devralır",
      "Modül erişimi rol/ReBAC ile; her modül kendi yetki kapsamı",
      "Modüller-arası çağrı sözleşmeli; serbest erişim yok",
    ],
    codeOptimization: [
      "Yatay modüller bildirimsel bağlanır; ArcheType bayrağıyla açılır",
      "Ortak modül tek sürüm; app'ler aynı yeteneği paylaşır",
      "Modül arayüzü dar ve kararlı",
    ],
    securityOptimization: [
      "Modül etkinleştirme yetkili; gereksiz yetenek kapalı (saldırı yüzeyi)",
      "Modüller-arası bağ allowlist'li",
      "Her modül kendi oran/kota sınırını taşır",
    ],
    performance: [
      "Modüller bağımsız ölçeklenir; ağır olanlar (arama) ayrı servis",
      "Tembel yükleme; kullanılmayan modül yük getirmez",
      "Ortak okuma yolları önbellekli",
    ],
    mobileApps: [
      "Yatay modüllerin UI parçaları mobil-uyumlu (bildirim, arama)",
      "iOS/Android'de modül yetenekleri ortak bileşenlerle",
      "Dar ekranda modül yüzeyleri uyarlanır",
    ],
    wcag: [
      "Modül UI parçaları WCAG 2.2 AAA ortak bileşenleri kullanır",
      "Durum/aksiyon renk dışında metinle; kontrast 7:1",
      "Klavye+okuyucu erişimi modül başına",
    ],
    deployment: [
      "Yatay modüller in-tree (çekirdekle dağıtılır); ağır olanlar ayrı servis",
      "Kubernetes'te modül-bazlı ölçek",
      "Shared hosting'de hafif modüller, ağırlar degrade",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ArcheType modülü etkinleştirdi → yatay yeteneği bağla + yapılandır (idempotent, zincir ≤6)",
      "Olay: modül hatası → ilgili app'i degrade et + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI hangi yatay modülün uygun olduğunu önerir; modülü kendisi etkinleştiremez/yapılandıramaz",
    ],
    testing: [
      "Her yatay modül için sözleşme + entegrasyon testi",
      "Modül etkinleştirme/yetki testi",
      "Modüller-arası bağ kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: modül başına yetki kapsamı",
      "A05 Misconfiguration: gereksiz modül kapalı varsayılan",
      "A09 Logging: modül etkinleştirme kararları iz",
    ],
    integration: [
      "Layer1 modülleri tüm app'lere ortak yetenek (audit/arama/bildirim) sağlar",
      "ArcheType'a bayrak/sözleşme ile bağlanır",
      "Kernel ve scale primitiflerini kullanır",
    ],
    moduleUsage: [
      "Layer1 app'i yatay modül kütüphanesini barındırır",
      "Tüm dikey app'ler audit/arama/bildirim gibi modülleri buradan tüketir",
    ],
  },

  "l1-audit": {
    featureDefs: [
      "Audit + Activity ArcheType'ı: değişmez denetim izi, aktivite akışı ve forensic kayıt",
      "Kim/ne/ne zaman/öncesi-sonrası; aktör (insan/AI/sistem) ayrımı",
      "Sorgulanabilir aktivite zaman çizelgesi ve dışa aktarım",
    ],
    security: [
      "Audit kaydı değişmez (append-only); silme/değiştirme yok",
      "Audit verisi tenant_id RLS; erişim dar rol (denetçi)",
      "Forensic alanlar: actor/agent/model/promptVersion/öncesi-sonrası hash",
    ],
    codeOptimization: [
      "Audit yazımı asenkron (outbox); ana işlemi yavaşlatmaz",
      "Olay şeması sürümlü; kayıt yapılandırılmış",
      "Aktivite akışı projeksiyondan türetilir",
    ],
    securityOptimization: [
      "Değişmezlik kriptografik (hash zinciri); kurcalama tespit edilir",
      "Audit erişimi de audit'lenir (meta-audit)",
      "Saklama politikası yasal süreye uyar",
    ],
    performance: [
      "Yüksek-yazım append-only; zaman+aktör indeksiyle sorgu",
      "Eski kayıt soğuk depoya arşivlenir",
      "Aktivite akışı sayfalı",
    ],
    mobileApps: [
      "Mobilde aktivite akışı görüntüleme (salt-okuma)",
      "iOS/Android push ile kritik aktivite uyarısı",
      "Dar ekranda aktivite zaman çizelgesi",
    ],
    wcag: [
      "Aktivite akışı klavye+okuyucu erişimli; kayıtlar yapılandırılmış",
      "Aktör tipi (insan/AI) renk dışında etiketle; kontrast 7:1",
      "Filtre ve zaman aralığı erişilebilir",
    ],
    deployment: [
      "Audit deposu append-only; arşiv ayrı soğuk katman",
      "Audit yazıcı ayrı worker (outbox tüketici)",
      "Shared hosting'de DB-temelli audit",
    ],
    eca: [
      ECA_BOUND,
      "Olay: herhangi bir kayıt değişti → değişmez audit girdisi oluştur (öncesi-sonrası hash, idempotent, zincir ≤6)",
      "Olay: şüpheli aktivite deseni → güvenlik ekibine uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI aktivite özeti/anomali tespiti üretir; audit kaydını kendisi yazamaz/değiştiremez (değişmez)",
    ],
    testing: [
      "Audit değişmezlik testi (geçmiş kayıt değiştirilemez)",
      "Hash zinciri kurcalama tespit testi",
      "Aktivite akışı sorgu/erişim kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A09 Security Logging: değişmez forensic iz çekirdek",
      "A01 Access Control: audit erişimi denetçi rolüyle",
      "A08 Integrity: hash zinciri ile bütünlük",
    ],
    integration: [
      "Audit, tüm ArcheType'ların değişikliklerini olay veriyolundan toplar",
      "AI aksiyonları audit forensic alanlarına yazılır",
      "Uyumluluk/raporlama audit'i kaynak alır",
    ],
    moduleUsage: [
      "Audit modülü tüm app'lere değişmez denetim izi sağlar",
      "Her ArcheType değişiklikleri için audit modülünü kullanır",
    ],
  },

  "l1-notification": {
    featureDefs: [
      "Notification ArcheType'ı: çok-kanallı bildirim (e-posta/SMS/push/in-app), şablon ve tercih yönetimi",
      "Bildirim toplama (digest), sessiz saatler ve teslim takibi",
      "Olay→bildirim eşlemesi ve kullanıcı abonelik tercihleri",
    ],
    security: [
      "Bildirim ve iletişim verisi tenant_id RLS; izin (consent) zorunlu",
      "Kanal sağlayıcı anahtarı kasada; içerik PII maskeli loglanır",
      "Abonelikten çıkma (opt-out) her zaman saygı görür",
    ],
    codeOptimization: [
      "Şablon motoru çok-dilli; kanal-bağımsız içerik + kanal render'ı",
      "Teslim asenkron kuyruk; sağlayıcı hatası geri-çekilmeli",
      "Tercih çözümleme tek noktada",
    ],
    securityOptimization: [
      "Sessiz saatler + frekans sınırı (bildirim yorgunluğu)",
      "Opt-out/izin kontrolü gönderim öncesi zorunlu",
      "Sağlayıcı hatası yeniden-deneme (maks 6) + DLQ",
    ],
    performance: [
      "Toplu bildirim parçalı kuyruk; sağlayıcı oran-sınırına uyum",
      "Digest ile bildirim birleştirme (hacim azaltma)",
      "Teslim durumu izlenir",
    ],
    mobileApps: [
      "Push bildirimi iOS/Android (APNs/FCM); in-app bildirim merkezi",
      "Mobilde bildirim tercihleri self-servis",
      "Sessiz saatler cihaz saat dilimine göre",
    ],
    wcag: [
      "In-app bildirim merkezi klavye+okuyucu erişimli; aria-live",
      "Bildirim önem düzeyi renk dışında metinle; kontrast 7:1",
      "Tercih ekranı erişilebilir",
    ],
    deployment: [
      "Bildirim gönderici ayrı worker; kanal başına oran-sınırı",
      "Sağlayıcı entegrasyonu (e-posta/SMS/push) adaptör",
      "Shared hosting'de e-posta + in-app (push kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: iş olayı tetikledi → tercih+izin kontrol + uygun kanaldan bildir (idempotent, zincir ≤6)",
      "Olay: sessiz saatler aktif → bildirimi ertele/digest'e ekle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bildirim içeriği/zamanlama önerir; kullanıcı izin/tercihini kendisi değiştiremez",
    ],
    testing: [
      "İzin/opt-out kontrolü testi (izinsiz gönderim yok)",
      "Sessiz saatler + frekans sınırı testi",
      "Çok-kanal teslim + DLQ testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: izin/abonelik bazlı gönderim",
      "A04 Insecure Design: frekans/sessiz-saat ile suistimal önleme",
      "A09 Logging: gönderim kararları iz (PII maskeli)",
    ],
    integration: [
      "Notification, tüm app'lerin olaylarını bildirime çevirir",
      "Kanal sağlayıcıları ipaas/adaptörden",
      "Tercih/izin gizlilik (KVKK) süreçleriyle uyumlu",
    ],
    moduleUsage: [
      "Notification modülü tüm app'lere çok-kanallı bildirim sağlar",
      "Her app olaylarını bu bildirim sözleşmesine yayınlar",
    ],
  },

  "l1-search": {
    featureDefs: [
      "Search (Hibrit) ArcheType'ı: BM25 anahtar-kelime + vektör arama, yeniden-sıralama ve facet",
      "Yetki-farkında arama; tenant ve rol filtreli sonuç",
      "Otomatik tamamlama, eş-anlamlı ve yazım düzeltme",
    ],
    security: [
      "Arama yetki-farkında: kullanıcı yalnız erişimli kayıtları görür (tenant + ReBAC)",
      "İndeks tenant-izole; çapraz-tenant sonuç sızmaz",
      "Hassas alan indekslenirken maskelenir",
    ],
    codeOptimization: [
      "Hibrit skor (BM25 + vektör) birleşik; yeniden-sıralama (rerank)",
      "İndeksleme olay-temelli artımlı; kayıt değişince güncellenir",
      "Facet/filtre indeks-yan hesaplanır",
    ],
    securityOptimization: [
      "Erişim filtresi arama seviyesinde (yetkisiz kayıt skora girmez)",
      "Sorgu oran-sınırlı (kazıma önleme)",
      "İndeks yeniden-kurulabilir (kaynak veriden)",
    ],
    performance: [
      "Arama gecikme bütçeli; sık sorgu önbellekli",
      "Vektör için ANN indeksi; anahtar-kelime için ters indeks",
      "Büyük indeks bölümlenir",
    ],
    mobileApps: [
      "Mobilde otomatik tamamlama ve facet arama",
      "iOS/Android'de sesli arama opsiyonu",
      "Dar ekranda facet katlanır",
    ],
    wcag: [
      "Arama kutusu ve sonuçlar klavye+okuyucu erişimli",
      "Sonuç sayısı/facet metinle bildirilir; kontrast 7:1",
      "Otomatik tamamlama aria ile duyurulur",
    ],
    deployment: [
      "Arama motoru ayrı servis (OpenSearch/vektör); ayrı ölçek",
      "İndeksleme worker'ı olay tüketir",
      "Shared hosting'de DB-temelli basit arama (degrade)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kayıt değişti → arama indeksini artımlı güncelle (idempotent, zincir ≤6)",
      "Olay: indeks lag arttı → yeniden-indeksleme/uyarı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sorgu anlama/eş-anlamlı önerir; arama yetki filtresini kendisi gevşetemez",
    ],
    testing: [
      "Yetki-farkında arama testi (yetkisiz kayıt dönmez)",
      "Hibrit skor/rerank kalite testi",
      "İndeks artımlı güncelleme tutarlılık testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: yetki-farkında arama (ReBAC)",
      "A04 Insecure Design: sorgu oran-sınırı (kazıma)",
      "LLM06: vektör indekste hassas içerik koruması",
    ],
    integration: [
      "Search, tüm aranabilir ArcheType'ların indeksini tutar",
      "Olay veriyolundan kayıt değişimi alır",
      "RAG, vektör aramasını bu modülden kullanabilir",
    ],
    moduleUsage: [
      "Search modülü tüm app'lere hibrit arama sağlar",
      "Aranabilir kayıt içeren app'ler arama modülünü kullanır",
    ],
  },

  "l1-workflow": {
    featureDefs: [
      "Workflow + ECA ArcheType'ı: durum makinesi, onay akışı ve olay-koşul-eylem otomasyonu",
      "Görsel akış tasarımı (şemalı), SLA ve eskalasyon",
      "İnsan görevi (task) ve otomatik adım karışımı",
    ],
    security: [
      "Akış tanımı/örneği tenant_id RLS; adım yetkileri rol bazlı",
      "ECA backend'de çalışır; serbest JS/SQL/shell yok",
      "Akış değişikliği sürümlü+onaylı",
    ],
    codeOptimization: [
      "Durum makinesi açık; geçişler guard'lı ve idempotent",
      "ECA kuralları yapısal (event/when/then); zincir ≤6 loop-breaker",
      "Uzun akış kalıcı (durable) ve devam-edilebilir",
    ],
    securityOptimization: [
      "ECA action allowlist; yalnız izinli aksiyonlar",
      "Step-up onay yüksek-riskli adımda",
      "Sonsuz tetik zinciri loop-breaker ile kırılır",
    ],
    performance: [
      "Akış örnekleri asenkron; bekleyenler verimli saklanır",
      "ECA değerlendirme indeksli/hızlı",
      "SLA zamanlayıcısı ölçeklenir",
    ],
    mobileApps: [
      "Mobilde insan görevi onay/red; akış durumu görüntüleme",
      "iOS/Android push ile bekleyen görev/SLA uyarısı",
      "Dar ekranda akış adım ilerlemesi",
    ],
    wcag: [
      "Akış tasarımcısına klavye alternatifi; görev formu erişilebilir",
      "Adım durumu renk dışında metin+ikonla; kontrast 7:1",
      "SLA/eskalasyon uyarısı sesli",
    ],
    deployment: [
      "Workflow motoru dayanıklı worker; durum kalıcı depoda",
      "ECA değerlendirme backend'de (UI yalnız yönetim)",
      "Shared hosting'de basit/kısa akışlar (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: akış olayı + koşul sağlandı → tanımlı eylemi yürüt (allowlist, idempotent, zincir ≤6)",
      "Olay: SLA aşıldı → eskalasyon + sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI akış/ECA kuralı önerir ve simüle eder; çalışan ECA otoritesini veya akışı kendisi değiştiremez",
    ],
    testing: [
      "Durum makinesi geçiş + guard testi",
      "ECA tetikleme + loop-breaker (maks 6) testi",
      "SLA/eskalasyon kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: ECA allowlist + loop-breaker",
      "A01 Access Control: adım/onay yetkisi",
      "A09 Logging: akış/ECA kararları iz",
    ],
    integration: [
      "Workflow, tüm ArcheType'lara durum makinesi + otomasyon sağlar",
      "ECA kuralları olay veriyolunu dinler",
      "İnsan görevleri bildirim/UI ile",
    ],
    moduleUsage: [
      "Workflow + ECA modülü tüm app'lere süreç otomasyonu sağlar",
      "Onay/süreç gerektiren app'ler bu modülü kullanır",
    ],
  },

  "l1-file": {
    featureDefs: [
      "File & Storage ArcheType'ı: dosya yükleme, sürümleme, önizleme ve güvenli erişim (presigned)",
      "Anti-virüs tarama, tip/boyut doğrulama ve depolama soyutlaması",
      "Dosya-kayıt ilişkilendirme ve erişim audit'i",
    ],
    security: [
      "Dosya erişimi presigned URL + süre sınırlı; tenant-izole bucket/prefix",
      "Yüklemede tip/boyut doğrulama + anti-virüs tarama",
      "Hassas dosya şifreli (at-rest); erişim audit'li",
    ],
    codeOptimization: [
      "Depolama soyutlaması (S3 benzeri); sağlayıcı-bağımsız",
      "Büyük dosya parçalı (multipart) yükleme",
      "Önizleme/küçük-resim asenkron üretilir",
    ],
    securityOptimization: [
      "Presigned URL dar kapsam + kısa süre",
      "Yüklenen dosya türü allowlist; çalıştırılabilir reddi",
      "Anti-virüs temiz olmadan erişim yok",
    ],
    performance: [
      "Doğrudan-istemci (presigned) yükleme; sunucu aktarımı baypas",
      "CDN ile dağıtım; küçük-resim önbellekli",
      "Parçalı yükleme paralel",
    ],
    mobileApps: [
      "Mobilde kameradan/galeriden yükleme; arka plan yükleme",
      "iOS/Android offline yükleme kuyruğu",
      "Dar ekranda dosya önizleme",
    ],
    wcag: [
      "Dosya yükleme alanı klavye erişimli; ilerleme metinle",
      "Dosyaya açıklama (alt/metin) zorunlu alan",
      "Hata (boyut/tip) açık ve sesli; kontrast 7:1",
    ],
    deployment: [
      "Nesne deposu (S3 benzeri) + CDN; tarama worker'ı ayrı",
      "Çok-bölge için bölge-yerel bucket",
      "Shared hosting'de yerel disk + boyut sınırı (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: dosya yüklendi → anti-virüs tara + küçük-resim üret; temizse erişime aç (idempotent, zincir ≤6)",
      "Olay: zararlı dosya tespit → karantina + yükleyiciye uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI dosya içeriği sınıflandırma/etiketleme önerir; erişim/saklama kuralını kendisi değiştiremez",
    ],
    testing: [
      "Tip/boyut doğrulama + anti-virüs karantina testi",
      "Presigned URL kapsam/süre testi (yetkisiz erişim yok)",
      "Parçalı yükleme + sürüm kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: tip allowlist + AV tarama",
      "A01 Access Control: presigned dar kapsam",
      "A02 Cryptographic Failures: hassas dosya at-rest şifreli",
    ],
    integration: [
      "File, tüm ArcheType'lara dosya ekleme yeteneği verir",
      "Belge işleme (doc-matching) dosyaları buradan alır",
      "Erişim audit modülüne yazılır",
    ],
    moduleUsage: [
      "File & Storage modülü tüm app'lere dosya yönetimi sağlar",
      "Dosya eki olan tüm ArcheType'lar bu modülü kullanır",
    ],
  },

  "app-layer1-x-molecule": {
    featureDefs: [
      "Layer1 kırılımının Molekül örneği: bir yatay yeteneğin bileşen düzeyi tarifi",
      "Molekül, bir layer1 modülünün çalışabilir en küçük bileşeni",
      "Örnek dal; yatay yetenek bileşeninin granülerlikteki yeri",
    ],
    security: [
      "Molekül girdi doğrulamasını sınırda yapar; modül yetki kapsamına uyar",
      "Yalnız kapsamındaki kaynağa erişir",
      "Tenant bağlamına bağlı",
    ],
    codeOptimization: [
      "Yatay molekül saf fonksiyon; modül sözleşmesine uyumlu",
      "Tipli arayüz",
      "Paylaşılan yardımcıya çıkarım",
    ],
    securityOptimization: [
      "En az ayrıcalık",
      "Girdi normalizasyonu",
      "Loop-breaker (maks 6) zincirde",
    ],
    performance: ["Saf ve önbelleklenebilir", "Tembel başlatma", "Küçük çıktı"],
    mobileApps: [
      "Molekül UI'si mobilde uyumlu",
      "iOS/Android içinde çağrılabilir",
      "Dar ekranda özetli",
    ],
    wcag: [
      "Etkileşim klavye erişimli ve adlandırılmış",
      "Durum metinle; kontrast 7:1",
      "Hata ilişkilendirilmiş",
    ],
    deployment: ["Üst modülle dağıtılır", "Modülle ölçeklenir", "Shared hosting'de degrade"],
    eca: [
      ECA_BOUND,
      "Olay: molekül girdisi geçersiz → sınırda reddet + üst modüle hata (idempotent, zincir ≤6)",
      "Molekül üst modül kuralına bağlanır",
    ],
    aiAgents: [AI_B1, AI_B2, "AI molekül tarifini önerebilir; üst modül/app'i kendisi üretemez"],
    testing: [
      "Molekül birim testi",
      "Üst modül entegrasyon testi",
      "Erişilebilirlik mikro-yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: girdi sınırda doğrulanır",
      "A04 Insecure Design: en-az-ayrıcalık",
      "İzlenir",
    ],
    integration: [
      "Molekül üst layer1 modülüne tipli arayüzle bağlanır",
      "Modül sözleşmesini tüketir",
      "Çıktısı üst yetenek akışında",
    ],
    moduleUsage: ["Yatay molekül bir bileşendir; bağımsız sunulmaz, üst modül içinde kullanılır"],
  },

  "app-layer1-x-element": {
    featureDefs: [
      "Layer1 kırılımının Element örneği: tek bir yatay alan/kural (ör. bildirim kanalı tercihi)",
      "Element, yatay modül sözleşmesindeki en küçük anlamlı alan/kural",
      "Örnek dal; yatay alan kuralının granülerlikteki yeri",
    ],
    security: [
      "Alan doğrulaması sunucuda; yetki/izin kuralı uygulanır",
      "Hassas alan maskeleme/şifreleme",
      "Alan yazımı tenant+rol yetkisiyle",
    ],
    codeOptimization: ["Yatay kural saf doğrulayıcı", "Tip Zod ile", "Tek kaynaktan"],
    securityOptimization: [
      "Allowlist temelli doğrulama",
      "Field-level yetki",
      "Güvenli varsayılan",
    ],
    performance: ["O(1) doğrulama", "Önbelleklenebilir", "Toplu doğrulama"],
    mobileApps: [
      "Alan mobilde uygun girdiyle",
      "Offline doğrulanabilir",
      "Hata dar ekranda okunur",
    ],
    wcag: [
      "Alan etiketi ilişkili; hata sesli; kontrast 7:1",
      "Zorunluluk metin/ikonla",
      "Okuyucuya anlamlı",
    ],
    deployment: [
      "Kural yatay modül şemasının parçası",
      "Her profilde doğrulanır",
      "Shared hosting'de de geçerli",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alan değeri kuralı ihlal etti → üst molekül kuralına sinyal (idempotent, zincir ≤6)",
      "Element tek başına otomasyon yazmaz",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alan/kural önerebilir; yetki/maskeleme kuralını kendisi gevşetemez",
    ],
    testing: [
      "Sınır-değer doğrulama testi",
      "Hassas alan maskeleme testi",
      "Erişilebilirlik mikro-testi",
    ],
    owasp: [
      "A03 Injection: allowlist doğrulama",
      "A02 Cryptographic Failures: hassas alan korumalı",
      "Değişiklik izli",
    ],
    integration: [
      "Element üst molekül ve ArcheType field sözleşmesine bağlanır",
      "Yatay modül şema doğrulamasına dahil",
      "Surface görünürlüğü bu kurala göre",
    ],
    moduleUsage: [
      "Yatay element bir alan/kuraldır; bağımsız sunulmaz, modül field tanımının parçası",
    ],
  },

  "app-layer1-x-atom": {
    featureDefs: [
      "Layer1 kırılımının Atom örneği: bölünemez yatay ilkel (ör. kanal kimliği değer nesnesi)",
      "Atom, yatay modül sözleşmesinin daha alt parçaya ayrılmayan ilkel birimi",
      "Örnek dal; yatay atomun granülerlik tabanındaki yeri",
    ],
    security: [
      "Atom değişmez; mutasyon engellenir",
      "Değer sınırda doğrulanır",
      "Hassas atom üst katmanda korunur",
    ],
    codeOptimization: [
      "Atom değer nesnesi; eşitlik değere göre",
      "Sabit tip; geçersiz değer reddi",
      "Paylaşılır",
    ],
    securityOptimization: ["En dar biçim doğrulaması", "Güvenli serileştirme", "Bağımlılıksız"],
    performance: ["Sabit zaman doğrulama", "İnternalize değer", "Ucuz karşılaştırma"],
    mobileApps: ["Atom değeri mobilde özetli", "Offline doğrulanabilir", "Taşmaz"],
    wcag: ["Atom etiketli; hata metinle; kontrast 7:1", "Biçim ipuçlu", "Okuyucuya anlamlı"],
    deployment: [
      "Atom tipi yatay şema çekirdeğinde",
      "Her profilde aynı doğrulama",
      "Shared hosting dahil",
    ],
    eca: [
      ECA_BOUND,
      "Atom otomasyon tetiklemez; üst kurallara değer sağlar",
      "Olay: değer geçersiz → üst element reddeder (idempotent)",
    ],
    aiAgents: [AI_B1, AI_B2, "AI yatay atom tipi önerebilir; ilkel sözleşmeyi tek başına yazamaz"],
    testing: ["Atom biçim/sınır testi", "Değişmezlik testi", "Serileştirme testi"],
    owasp: ["A03 Injection: değer biçim-doğrulanır", "A08 Integrity: atom değişmez", "İzlenebilir"],
    integration: [
      "Yatay atom element ve field tanımlarının yapı taşı",
      "Tip sistemine dahil",
      "Üst seviyeler birleştirir",
    ],
    moduleUsage: [
      "Yatay atom bölünemez birimdir; bağımsız sunulmaz, üst tip tanımlarında kullanılır",
    ],
  },

  "l1-party": {
    featureDefs: [
      "Party / Contact ArcheType'ı: kişi ve kurum kayıtlarını birleştiren ortak iletişim modeli",
      "Rol (müşteri/tedarikçi/çalışan), ilişki ve iletişim kanalı yönetimi",
      "Tekilleştirme ve birleştirme (merge); altın kayıt (golden record)",
    ],
    security: [
      "Party verisi tenant_id RLS; PII (iletişim) maskeli ve izinli",
      "Birleştirme/silme yetki+iz; KVKK silme talebi desteklenir",
      "İletişim izni (consent) kanal bazında tutulur",
    ],
    codeOptimization: [
      "Kişi/kurum tek model (party) + rol; tekrar yok",
      "Tekilleştirme bulanık eşleştirme skorlu",
      "İlişki grafı verimli sorgulanır",
    ],
    securityOptimization: [
      "Birleştirme geri-alınabilir (audit + önceki kayıt)",
      "Düşük-güven eşleşme insana; otomatik birleştirme yüksek-güvende",
      "KVKK: unutulma hakkı için anonimleştirme akışı",
    ],
    performance: [
      "Party araması indeksli; ilişki sorgusu sınırlı derinlik",
      "Altın kayıt önbellekli",
      "Toplu içe aktarımda tekilleştirme parçalı",
    ],
    mobileApps: [
      "Mobilde kişi/kurum arama ve hızlı iletişim",
      "iOS/Android rehber entegrasyonu (izinli)",
      "Dar ekranda party kartı",
    ],
    wcag: [
      "Party formu alan-etiket ilişkili; birleştirme onayı erişilebilir",
      "İlişki türü renk dışında metinle; kontrast 7:1",
      "Arama sonuçları okuyucuya yapılandırılmış",
    ],
    deployment: [
      "Party servisi standart ölçek; tekilleştirme ayrı worker",
      "İletişim olayları diğer modüllere outbox ile",
      "Shared hosting'de temel party yönetimi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni party girildi → tekilleştirme dene + düşük-güveni incelemeye al (idempotent, zincir ≤6)",
      "Olay: KVKK silme talebi → anonimleştirme akışını başlat (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI party eşleştirme/zenginleştirme önerir; birleştirmeyi insan onaylar, AI tek başına yapmaz",
    ],
    testing: [
      "Tekilleştirme doğruluk + geri-alınabilirlik testi",
      "KVKK anonimleştirme akış testi",
      "İletişim izni kontrolü testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: party PII erişimi rol bazlı",
      "A02 Cryptographic Failures: iletişim verisi korumalı",
      "A09 Logging: birleştirme/silme kararları iz",
    ],
    integration: [
      "Party, CRM/HR/tedarikçi gibi tüm kişi-kurum tutan ArcheType'lara temel sağlar",
      "İletişim izni bildirim modülüyle paylaşılır",
      "Tekilleştirme veri-temizleme ile",
    ],
    moduleUsage: [
      "Party/Contact modülü tüm app'lere birleşik kişi/kurum modeli sağlar",
      "Kişi/kurum tutan tüm ArcheType'lar party modülünü kullanır",
    ],
  },

  "l1-export": {
    featureDefs: [
      "Veri Dışa Aktarma: CSV/Excel/PDF formatında, yetki-farkında ve büyük-veri akışlı dışa aktarım",
      "Şablon, sütun seçimi ve zamanlanmış/anlık export",
      "Büyük export için arka plan iş + indirme bağlantısı",
    ],
    security: [
      "Export yalnız kullanıcının yetkili olduğu veriden (RLS uygulanır)",
      "PII içeren export onay/iz ister; indirme bağlantısı süre-sınırlı",
      "Export audit'lenir (kim neyi dışa aktardı)",
    ],
    codeOptimization: [
      "Büyük export akışlı (streaming); bellekte tutmaz",
      "Format render'ı (CSV/Excel/PDF) ortak veri + format adaptörü",
      "Sütun/şablon bildirimsel",
    ],
    securityOptimization: [
      "Export oran-sınırlı (toplu veri sızıntısı önleme)",
      "İndirme presigned + kısa süre",
      "Hassas sütun maskeleme opsiyonu",
    ],
    performance: [
      "Akışlı export bellek-dostu; büyük veri arka planda",
      "Format üretimi asenkron worker",
      "İndirme CDN/nesne deposundan",
    ],
    mobileApps: [
      "Mobilde export iste + hazır olunca indir/paylaş",
      "iOS/Android push ile export hazır bildirimi",
      "Dar ekranda format seçimi",
    ],
    wcag: [
      "Export ekranı klavye erişimli; format/sütun seçimi etiketli",
      "İlerleme metinle bildirilir; kontrast 7:1",
      "PDF export erişilebilir etiketlerle",
    ],
    deployment: [
      "Export worker'ı ayrı ölçek; çıktı nesne deposunda",
      "Zamanlanmış export scheduler ile",
      "Shared hosting'de senkron küçük export (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: export istendi → yetki-filtreli veriyi arka planda üret + indirme bağlantısı (idempotent, zincir ≤6)",
      "Olay: büyük/hassas export → onay + audit; tamamlanınca süre-sınırlı bağlantı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI export şablonu/sütun önerir; yetki filtresini veya veriyi kendisi dışa aktaramaz",
    ],
    testing: [
      "Yetki-filtreli export testi (yetkisiz veri çıkmaz)",
      "Büyük veri akışlı export bellek testi",
      "Format (CSV/Excel/PDF) doğruluk testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: export RLS ile filtreli",
      "A04 Insecure Design: oran-sınırı (toplu sızıntı)",
      "A09 Logging: export kararları forensic iz",
    ],
    integration: [
      "Export, tüm tablo/liste yüzeylerine dışa aktarım sağlar",
      "Görev/ArcheType verisi (JSON/CSV) export sözleşmesini kullanır",
      "İndirme dosya modülü/nesne deposundan",
    ],
    moduleUsage: [
      "Veri Dışa Aktarma (orta taş) tüm app'lere export yeteneği sağlar",
      "Liste/rapor içeren tüm ArcheType'lar export modülünü kullanır",
    ],
  },

  "l1-import": {
    featureDefs: [
      "Veri İçe Aktarma: CSV yükleme, alan eşleme, doğrulama ve kuru-çalıştırma (dry-run)",
      "Hata raporu, kısmi içe aktarma ve geri-alma",
      "Şablon indirme ve eşleme hafızası",
    ],
    security: [
      "İçe aktarılan veri tenant_id'ye yazılır; yetki kontrollü",
      "Yükleme tip/boyut doğrulama + zararlı içerik taraması",
      "Toplu yazma idempotent (tekrar yüklemede çift kayıt yok)",
    ],
    codeOptimization: [
      "Dry-run önce doğrular; yazma yalnız onaydan sonra",
      "Alan eşleme bildirimsel ve yeniden-kullanılır",
      "Büyük dosya parçalı işlenir",
    ],
    securityOptimization: [
      "Doğrulama allowlist'li; bozuk satır karantinaya, yazılmaz",
      "Kısmi içe aktarma geri-alınabilir (audit + iş kimliği)",
      "İçe aktarma oran-sınırlı",
    ],
    performance: [
      "Toplu içe aktarma kuyrukla; ilerleme izlenir",
      "Doğrulama akışlı; bellek-dostu",
      "Hata raporu sayfalı",
    ],
    mobileApps: [
      "Mobilde dosya seç + içe aktar + sonuç görüntüle",
      "iOS/Android push ile içe aktarma tamamlandı bildirimi",
      "Dar ekranda hata özeti",
    ],
    wcag: [
      "İçe aktarma sihirbazı adım adım ve klavye erişimli",
      "Hata raporu satır+sütunla yapılandırılmış (okuyucu)",
      "Başarılı/başarısız renk dışında metinle; kontrast 7:1",
    ],
    deployment: [
      "İçe aktarma worker'ı ayrı; dosya nesne deposunda",
      "Doğrulama + yazma aşamalı",
      "Shared hosting'de senkron küçük içe aktarma",
    ],
    eca: [
      ECA_BOUND,
      "Olay: dosya yüklendi → dry-run doğrula + hata raporu üret (idempotent, zincir ≤6)",
      "Olay: içe aktarma onaylandı → geçerli satırları yaz, bozukları karantinaya (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alan eşleme/temizleme önerir; içe aktarmayı kendisi onaylayıp yazamaz",
    ],
    testing: [
      "Dry-run doğrulama + hata raporu testi",
      "Idempotent içe aktarma testi (çift kayıt yok)",
      "Kısmi içe aktarma geri-alma testi; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: içe aktarılan veri doğrulanır/sanitize",
      "A01 Access Control: hedef yazma yetkisi",
      "A09 Logging: içe aktarma kararları iz",
    ],
    integration: [
      "Import, tüm ArcheType'lara toplu veri girişi sağlar",
      "Doğrulama ArcheType şemasını kullanır",
      "Geri-alma audit modülüne bağlı",
    ],
    moduleUsage: [
      "Veri İçe Aktarma (orta taş) tüm app'lere toplu veri girişi sağlar",
      "Veri yükleme gerektiren tüm ArcheType'lar import modülünü kullanır",
    ],
  },

  "l1-webhook-in": {
    featureDefs: [
      "Inbound Webhook: dış sistemden gelen olayı alma, doğrulama ve iç olaya çevirme",
      "İmza doğrulama, idempotency ve olay eşleme",
      "Tekrar gönderim toleransı ve hata kuyruğu",
    ],
    security: [
      "Gelen webhook imza-doğrulamalı (HMAC); sahte istek reddi",
      "Kaynak IP/uç allowlist; tenant eşlemesi güvenli",
      "Yük doğrulanır; beklenmeyen alan reddi",
    ],
    codeOptimization: [
      "Alım hızlı yanıt (202) + asenkron işleme",
      "Idempotency anahtarıyla tekrar gönderim tek-sefer işlenir",
      "Olay eşleme bildirimsel",
    ],
    securityOptimization: [
      "İmza zorunlu; imzasız/yanlış imza anında reddedilir",
      "Tekrar oynatma (replay) penceresi + nonce",
      "Alım oran-sınırlı",
    ],
    performance: [
      "Alım uç noktası hafif; işleme kuyrukta",
      "Yüksek hacimde tampon + geri-baskı",
      "İşleme idempotent ve paralel",
    ],
    mobileApps: [
      "Inbound webhook backend; gelen olay izleme mobilde salt-okuma",
      "iOS/Android push ile başarısız alım uyarısı",
      "Dar ekranda kaynak sağlık özeti",
    ],
    wcag: [
      "Gelen olay günlüğü klavye+okuyucu erişimli",
      "Alım durumu renk dışında metinle; kontrast 7:1",
      "Hata detayı yapılandırılmış",
    ],
    deployment: [
      "Alım uç noktası ölçeklenir; işleme worker ayrı",
      "Hata kuyruğu (DLQ) ve yeniden işleme",
      "Shared hosting'de temel alım (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: webhook geldi → imza doğrula + idempotent kabul + iç olaya çevir (zincir ≤6)",
      "Olay: imza/şema geçersiz → reddet + kaynağa 4xx + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI gelen olay eşleme/anomali önerir; webhook doğrulama kuralını kendisi gevşetemez",
    ],
    testing: [
      "İmza doğrulama + replay reddi testi",
      "Idempotent kabul testi (tekrar gönderim tek-işlem)",
      "Geçersiz yük reddi testi; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: HMAC imza doğrulama",
      "A04 Insecure Design: replay penceresi + nonce",
      "A09 Logging: alım kararları iz",
    ],
    integration: [
      "Inbound webhook, dış sistemleri iç olay veriyoluna bağlar",
      "İç olaylar workflow/ArcheType'ları tetikler",
      "Idempotency primitifini kullanır",
    ],
    moduleUsage: [
      "Inbound Webhook (orta taş) dış-sistem olay alımını sağlar",
      "Dış entegrasyon gerektiren app'ler bu modülü kullanır",
    ],
  },

  "l1-redirect": {
    featureDefs: [
      "Redirect & URL Yönetimi: 301/302 yönlendirme, kısa link ve URL geçmişi",
      "Toplu yönlendirme içe aktarma ve döngü tespiti",
      "Eski URL'lerin korunması (SEO bozulmadan)",
    ],
    security: [
      "Yönlendirme hedefi allowlist/doğrulama (açık-yönlendirme önleme)",
      "Yönetim yetkisi rol bazlı; değişiklik izli",
      "Kısa link kötüye kullanımı oran-sınırlı",
    ],
    codeOptimization: [
      "Yönlendirme tablosu önbellekli; arama O(1)",
      "Döngü tespiti (a→b→a) kayıtta engellenir",
      "URL normalleştirme tek noktada",
    ],
    securityOptimization: [
      "Açık-yönlendirme: dış hedef onaylı/allowlist",
      "Yönlendirme zinciri sınırlı (loop-breaker)",
      "Toplu içe aktarma doğrulanır",
    ],
    performance: [
      "Yönlendirme edge/CDN seviyesinde (düşük gecikme)",
      "Sık linkler önbellekli",
      "Tablo değişimi anında yayılır",
    ],
    mobileApps: [
      "Yönlendirme şeffaf (kullanıcı fark etmez)",
      "Yönetim mobilde salt-okuma/temel",
      "Dar ekranda link listesi",
    ],
    wcag: [
      "Yönetim ekranı klavye+okuyucu erişimli",
      "Yönlendirme tipi (301/302) metinle; kontrast 7:1",
      "Hata (döngü) açık bildirilir",
    ],
    deployment: [
      "Yönlendirme edge/CDN veya gateway'de; tablo paylaşımlı",
      "Yönetim servisi standart",
      "Shared hosting'de .htaccess/uygulama yönlendirme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: URL değişti/silindi → eski URL'i yeni hedefe yönlendir + SEO koru (idempotent, zincir ≤6)",
      "Olay: yönlendirme döngüsü tespit → engelle + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI yönlendirme önerisi (kırık link) üretir; yönlendirme tablosunu kendisi değiştiremez",
    ],
    testing: [
      "Açık-yönlendirme reddi testi",
      "Döngü tespiti testi",
      "Toplu içe aktarma doğrulama testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: yönetim yetkisi",
      "A04 Insecure Design: açık-yönlendirme önleme",
      "A09 Logging: yönlendirme değişiklikleri iz",
    ],
    integration: [
      "Redirect, SEO ve URL değişikliklerini yönetir",
      "Sitemap/SEO modülleriyle tutarlı",
      "URL geçmişi audit'e bağlı",
    ],
    moduleUsage: [
      "Redirect & URL (modül) içerik/sayfa URL'lerini yönetir",
      "Web içerikli app'ler yönlendirme modülünü kullanır",
    ],
  },

  "l1-sitemap": {
    featureDefs: [
      "Sitemap & Robots: indekslenebilirlik motoru; XML sitemap, robots.txt ve canonical yönetimi",
      "Büyük site için sitemap indeksi ve otomatik güncelleme",
      "Sayfa öncelik/değişim sıklığı ve indeksleme kuralı",
    ],
    security: [
      "Yalnız herkese-açık sayfalar sitemap'te; özel sayfa sızmaz",
      "Robots kuralları yetkili yönetilir",
      "Sitemap üretimi tenant-izole",
    ],
    codeOptimization: [
      "Sitemap olay-temelli güncellenir; sayfa değişince yenilenir",
      "Büyük site için sitemap indeksi (bölünmüş)",
      "Canonical tek kaynaktan",
    ],
    securityOptimization: [
      "Özel/taslak sayfa indekslenmez (noindex)",
      "Sitemap boyut/sayfa sınırına uyar",
      "Robots değişimi izli",
    ],
    performance: [
      "Sitemap önceden üretilmiş ve önbellekli/CDN",
      "Artımlı güncelleme; tam yeniden-üretim nadir",
      "Büyük site bölünmüş sitemap",
    ],
    mobileApps: [
      "Sitemap/robots backend (SEO altyapısı)",
      "Yönetim mobilde salt-okuma",
      "Dar ekranda indeksleme durumu",
    ],
    wcag: [
      "İndeksleme yönetim ekranı klavye+okuyucu erişimli",
      "Sayfa indeks durumu metinle; kontrast 7:1",
      "Kural listesi yapılandırılmış",
    ],
    deployment: [
      "Sitemap üretici worker; çıktı CDN'den servis",
      "Robots.txt edge'de",
      "Shared hosting'de dosya-temelli sitemap",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sayfa yayınlandı/değişti → sitemap'i güncelle + arama motoruna ping (idempotent, zincir ≤6)",
      "Olay: sayfa özel/silindi → sitemap'ten çıkar + noindex (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI indeksleme/öncelik önerir; robots/sitemap kurallarını kendisi değiştiremez",
    ],
    testing: [
      "Özel sayfa sızıntı testi (sitemap'te yok)",
      "Büyük site sitemap indeksi testi",
      "Artımlı güncelleme tutarlılık testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: yalnız açık sayfalar indekslenir",
      "A05 Misconfiguration: robots güvenli varsayılan",
      "A09 Logging: indeksleme kural değişiklikleri iz",
    ],
    integration: [
      "Sitemap, SEO ve içerik yayınıyla entegre",
      "Redirect/canonical ile tutarlı",
      "Programmatic SEO sayfalarını kapsar",
    ],
    moduleUsage: [
      "Sitemap & Robots (modül) indekslenebilirliği yönetir",
      "Web/içerik app'leri SEO altyapısı için bu modülü kullanır",
    ],
  },

  "l1-seo": {
    featureDefs: [
      "Keşfedilebilirlik / SEO Motoru: meta etiket, yapısal veri (schema.org), canonical ve sosyal kart",
      "Sayfa-bazlı SEO yapılandırma ve içerik analizi",
      "Open Graph/Twitter kart ve çok-dilli hreflang",
    ],
    security: [
      "SEO yapılandırma yetkili; enjekte meta engellenir",
      "Yapısal veri doğrulanır (geçerli schema.org)",
      "Çok-dilli içerik tenant-izole",
    ],
    codeOptimization: [
      "SEO meta sayfa modelinden türetilir; tek kaynak",
      "Yapısal veri şablonu ArcheType'tan",
      "Render sunucu-tarafı (SSR/SSG) SEO için",
    ],
    securityOptimization: [
      "Meta/etiket içeriği sanitize (XSS önleme)",
      "Canonical döngüsü engellenir",
      "hreflang tutarlılığı doğrulanır",
    ],
    performance: [
      "SEO meta önbellekli; sayfa yükünü artırmaz",
      "Yapısal veri önceden üretilmiş",
      "Core Web Vitals hedefli render",
    ],
    mobileApps: [
      "Mobil SEO (responsive, hız) öncelikli",
      "Sosyal kart önizleme mobilde",
      "AMP/hafif sayfa opsiyonu",
    ],
    wcag: [
      "SEO erişilebilirlikle örtüşür: başlık hiyerarşisi, alt-metin",
      "Yapılandırma ekranı klavye erişimli; kontrast 7:1",
      "Meta alanları etiketli",
    ],
    deployment: [
      "SEO render SSR/SSG; meta CDN'den",
      "Yapısal veri üretici build/runtime",
      "Shared hosting'de SSG çıktısı (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: içerik yayınlandı → SEO meta + yapısal veri üret + sitemap'e ekle (idempotent, zincir ≤6)",
      "Olay: eksik/zayıf SEO tespit → içerik sahibine öneri (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI meta/anahtar-kelime ve içerik iyileştirme önerir; yayını insan onaylar",
    ],
    testing: [
      "Yapısal veri geçerlilik testi (schema.org)",
      "Meta enjeksiyon (XSS) reddi testi",
      "hreflang/canonical tutarlılık testi; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: meta içeriği sanitize",
      "A05 Misconfiguration: canonical/robots tutarlı",
      "Erişilebilirlik SEO ile örtüşür",
    ],
    integration: [
      "SEO, içerik/sayfa ArcheType'larına keşfedilebilirlik sağlar",
      "Sitemap ve redirect modülleriyle tutarlı",
      "Programmatic SEO ve AEO ile",
    ],
    moduleUsage: [
      "SEO Motoru (modül) tüm web içeriğine keşfedilebilirlik sağlar",
      "Web/pazarlama app'leri SEO modülünü kullanır",
    ],
  },

  "l1-pseo": {
    featureDefs: [
      "Programmatic SEO: ArcheType verisinden toplu sayfa üretimi (şablon × veri = binlerce sayfa)",
      "Sayfa şablonu, veri kaynağı ve kalite eşiği (ince-içerik önleme)",
      "Toplu üretim, indeksleme ve performans takibi",
    ],
    security: [
      "Üretilen sayfa yetki-uygun (yalnız açık veri); tenant-izole",
      "Şablon enjeksiyonu engellenir (sanitize)",
      "Toplu üretim oran-sınırlı",
    ],
    codeOptimization: [
      "Şablon × veri üretimi idempotent; veri değişince sayfa güncellenir",
      "İnce-içerik (thin content) kalite eşiğiyle elenir",
      "Statik üretim (SSG) ölçek için",
    ],
    securityOptimization: [
      "Düşük-kalite sayfa indekslenmez (spam/ceza önleme)",
      "Üretim hacmi kontrollü; ani binlerce sayfa kademeli",
      "Veri kaynağı doğrulanır",
    ],
    performance: [
      "Statik üretim + CDN; binlerce sayfa hızlı servis",
      "Artımlı yeniden-üretim (yalnız değişen)",
      "Üretim arka planda parçalı",
    ],
    mobileApps: [
      "Üretilen sayfalar mobil-öncelikli ve hızlı",
      "Yönetim mobilde üretim durumu",
      "Dar ekranda sayfa kalite özeti",
    ],
    wcag: [
      "Üretilen sayfalar WCAG AAA şablonundan miras alır",
      "Başlık hiyerarşisi ve alt-metin şablonda zorunlu",
      "Kontrast 7:1 şablon-garantili",
    ],
    deployment: [
      "Toplu üretim worker; çıktı SSG + CDN",
      "Artımlı build pipeline",
      "Shared hosting'de SSG dağıtımı (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kaynak veri eklendi/değişti → ilgili sayfaları üret/güncelle + sitemap'e ekle (idempotent, zincir ≤6)",
      "Olay: sayfa kalite eşiğini geçemedi → indeksleme + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sayfa şablonu/içerik zenginleştirme önerir; toplu üretimi insan onaylı tetikler, AI tek başına yayınlamaz",
    ],
    testing: [
      "Şablon × veri üretim doğruluk testi",
      "İnce-içerik kalite eşiği testi",
      "Toplu üretim performans/indeksleme testi; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: şablon/veri sanitize",
      "A04 Insecure Design: spam/ince-içerik önleme",
      "A09 Logging: toplu üretim kararları iz",
    ],
    integration: [
      "pSEO, ArcheType verisini SEO sayfalarına dönüştürür",
      "SEO/sitemap modülleriyle entegre",
      "Veri kaynağı ilgili ArcheType'lardan",
    ],
    moduleUsage: [
      "Programmatic SEO (modül) ArcheType→toplu sayfa üretir",
      "Veri-yoğun web app'leri (emlak/ilan) pSEO modülünü kullanır",
    ],
  },

  "l1-aeo": {
    featureDefs: [
      "AEO / GEO / LLMO: AI motorlarına (ChatGPT/Perplexity) görünürlük; yapılandırılmış, alıntılanabilir içerik",
      "Soru-cevap formatı, kaynak güveni ve makine-okunur özetler",
      "AI tarama (crawl) izni ve içerik atfı yönetimi",
    ],
    security: [
      "AI motorlarına yalnız açık içerik; özel veri sunulmaz",
      "Tarama izni (robots/AI-specific) yetkili yönetilir",
      "İçerik atfı/kaynak doğrulanır",
    ],
    codeOptimization: [
      "Makine-okunur özet (yapısal) içerikten türetilir",
      "Soru-cevap bloğu şablondan; tek kaynak",
      "AI-crawl uçları önbellekli",
    ],
    securityOptimization: [
      "AI tarama oran-sınırlı; içerik kazıma kontrollü",
      "Yanlış-atıf/halüsinasyon için kaynak işaretleme",
      "Özel içerik AI'ya kapalı (noindex benzeri)",
    ],
    performance: [
      "AI-okunur uçlar hafif ve önbellekli",
      "Yapısal özet önceden üretilmiş",
      "Düşük gecikme (AI crawl dostu)",
    ],
    mobileApps: [
      "AEO backend; görünürlük metrikleri mobil panoda",
      "iOS/Android'de AI-atıf raporu",
      "Dar ekranda görünürlük özeti",
    ],
    wcag: [
      "Soru-cevap içeriği erişilebilir (başlık/yapı)",
      "Yapısal veri ekran okuyucuyla uyumlu; kontrast 7:1",
      "Yönetim ekranı klavye erişimli",
    ],
    deployment: [
      "AEO uçları SSR/SSG + CDN; AI-crawl dostu",
      "Görünürlük ölçümü ayrı worker",
      "Shared hosting'de statik AEO içeriği (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: içerik yayınlandı → makine-okunur özet + soru-cevap üret (idempotent, zincir ≤6)",
      "Olay: AI motoru içeriği alıntıladı → atfı izle/raporla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI içerik AEO-iyileştirme önerir; yayını/erişim iznini insan onaylar",
    ],
    testing: [
      "Yapısal özet geçerlilik testi",
      "Özel içerik AI'ya sızmaz testi",
      "AI-crawl oran-sınır testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: yalnız açık içerik AI'ya",
      "A04 Insecure Design: kazıma oran-sınırı",
      "A09 Logging: AI-atıf izlenir",
    ],
    integration: [
      "AEO, SEO ve içerik yayınıyla entegre (AI motorları için)",
      "Yapısal veri SEO modülünden",
      "Atıf metrikleri analitiğe",
    ],
    moduleUsage: [
      "AEO/GEO/LLMO (modül) içeriği AI motorlarına görünür kılar",
      "İçerik/pazarlama app'leri AEO modülünü kullanır",
    ],
  },

  "l1-analytics": {
    featureDefs: [
      "Pazarlama Ölçümü / Analytics + Deney: olay toplama, dönüşüm hunisi, atıf ve kohort",
      "Sunucu-taraflı ölçüm (çerez-az), gizlilik-dostu analytics",
      "Deney (A/B) sonuç analizi ve KPI panosu",
    ],
    security: [
      "Analytics verisi tenant-izole; PII'siz/anonim ölçüm tercih",
      "İzin (consent) yönetimi; izinsiz izleme yok",
      "Ham olay erişimi rol bazlı",
    ],
    codeOptimization: [
      "Olay şeması sürümlü; sunucu-taraflı toplama",
      "Huni/kohort hesabı projeksiyondan",
      "Atıf modeli yapılandırılabilir",
    ],
    securityOptimization: [
      "Gizlilik-dostu (IP anonimleştirme, çerez-az)",
      "İzin reddi durumunda yalnız anonim toplam",
      "Toplulaştırma gizlilik eşikli",
    ],
    performance: [
      "Olay alımı yüksek-hacim; akış-temelli toplama",
      "Pano metrikleri önceden hesaplanmış",
      "Ham olay soğuk depoya arşiv",
    ],
    mobileApps: [
      "Mobil olay toplama SDK (gizlilik-dostu)",
      "iOS/Android push ile dönüşüm/anomali uyarısı",
      "Dar ekranda KPI panosu",
    ],
    wcag: [
      "Analytics panosu grafiklerine veri tablosu alternatifi",
      "Trend renk dışında ok+metinle; kontrast 7:1",
      "Filtre klavye erişimli",
    ],
    deployment: [
      "Olay toplayıcı ayrı ölçek; toplama worker",
      "Sunucu-taraflı ölçüm (tag manager ile)",
      "Shared hosting'de temel sayfa-görüntüleme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: dönüşüm gerçekleşti → huniyi güncelle + hedef-aşımı uyar (idempotent, zincir ≤6)",
      "Olay: deney anlamlı sonuca ulaştı → kazananı işaretle + öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI içgörü/anomali açıklaması üretir; ölçüm/izin yapılandırmasını kendisi değiştiremez",
    ],
    testing: [
      "Olay toplama doğruluk + izin kontrolü testi",
      "Huni/atıf hesabı testi",
      "A/B sonuç anlamlılık testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: ham olay erişimi rol bazlı",
      "LLM06/A02: PII anonimleştirme",
      "A09 Logging: ölçüm yapılandırma değişiklikleri iz",
    ],
    integration: [
      "Analytics, tüm app olaylarını ölçer; deney modülüyle entegre",
      "Tag manager ile ölçüm dağıtımı",
      "KPI'lar BI'ya beslenir",
    ],
    moduleUsage: [
      "Analytics + Deney (modül) tüm app'lere ölçüm sağlar",
      "Pazarlama/ürün app'leri analytics modülünü kullanır",
    ],
  },

  "l1-experiment": {
    featureDefs: [
      "Experiment & CRO: A/B, çok-değişkenli (MVT) test ve özellik bayrağı (feature-flag)",
      "Hedefleme, kademeli yayın (rollout) ve istatistiksel anlamlılık",
      "Bayrak yaşam döngüsü ve temizleme (flag debt)",
    ],
    security: [
      "Deney/bayrak yapılandırma yetkili; tenant-izole",
      "Hedefleme PII'siz segment tercih",
      "Bayrak değişimi izli",
    ],
    codeOptimization: [
      "Bayrak değerlendirmesi düşük gecikme (yerel önbellek)",
      "Deney atama deterministik (hash); tutarlı",
      "Bayrak temizleme (eski deney) süreci",
    ],
    securityOptimization: [
      "Kademeli yayın geri-alınabilir (kill-switch)",
      "Bayrak override yetkili ve izli",
      "Anlamlılık eşiği manipülasyona kapalı",
    ],
    performance: [
      "Bayrak değerlendirme O(1); akış güncellemesi",
      "Deney metrikleri projeksiyondan",
      "Yüksek-trafik yayın kademeli",
    ],
    mobileApps: [
      "Mobil SDK ile bayrak/deney (offline değerlendirme)",
      "iOS/Android'de kademeli yayın",
      "Dar ekranda deney sonuç özeti",
    ],
    wcag: [
      "Deney yönetim ekranı klavye+okuyucu erişimli",
      "Varyant/sonuç renk dışında metinle; kontrast 7:1",
      "Anlamlılık göstergesi açık",
    ],
    deployment: [
      "Bayrak servisi düşük-gecikme; SDK her istemcide",
      "Deney analizi ayrı worker",
      "Shared hosting'de temel bayrak (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: deney anlamlı sonuca ulaştı → kazanan varyantı öner + yayını kademelendir (idempotent, zincir ≤6)",
      "Olay: kademeli yayında metrik bozuldu → kill-switch + geri-al (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI deney hipotezi/segment önerir; bayrağı/yayını kendisi açamaz (insan onaylı)",
    ],
    testing: [
      "Deterministik atama tutarlılık testi",
      "Kill-switch/geri-alma testi",
      "İstatistiksel anlamlılık hesabı testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: bayrak/deney yetkisi",
      "A04 Insecure Design: kill-switch ile güvenli yayın",
      "A09 Logging: bayrak değişiklikleri iz",
    ],
    integration: [
      "Experiment, tüm app'lere özellik bayrağı + A/B sağlar",
      "Analytics ile sonuç ölçümü",
      "Kademeli yayın deploy ile",
    ],
    moduleUsage: [
      "Experiment & CRO (modül) tüm app'lere deney/bayrak sağlar",
      "Ürün/pazarlama app'leri deney modülünü kullanır",
    ],
  },

  "l1-tagmanager": {
    featureDefs: [
      "Tag Manager: etiket konteyneri (sunucu-taraflı öncelikli); ölçüm/pazarlama etiketleri yönetimi",
      "Tetikleyici, değişken ve etiket sürümleme; önizleme",
      "Çerez/izin entegrasyonu ve veri sızıntısı kontrolü",
    ],
    security: [
      "Etiket konteyneri yetkili yönetilir; rastgele script enjekte edilemez",
      "Sunucu-taraflı etiketleme PII sızıntısını azaltır",
      "Üçüncü-taraf etiket allowlist'li",
    ],
    codeOptimization: [
      "Etiketler sürümlü; yayın öncesi önizleme",
      "Sunucu-taraflı konteyner ile istemci yükü azalır",
      "Tetikleyici/değişken bildirimsel",
    ],
    securityOptimization: [
      "İzin (consent) durumuna göre etiket ateşlenir/ateşlenmez",
      "Üçüncü-taraf etiket CSP/sandbox ile sınırlı",
      "Veri katmanı PII filtreli",
    ],
    performance: [
      "Sunucu-taraflı etiketleme istemci performansını korur",
      "Etiket yükleme asenkron; render bloklamaz",
      "Konteyner önbellekli",
    ],
    mobileApps: [
      "Mobil SDK ile sunucu-taraflı etiketleme",
      "Mobilde izin durumuna saygı",
      "Dar ekranda etiket sağlık özeti",
    ],
    wcag: [
      "Etiketler erişilebilirliği bozmaz (görünmez ölçüm)",
      "Yönetim ekranı klavye+okuyucu erişimli; kontrast 7:1",
      "İzin arayüzü erişilebilir",
    ],
    deployment: [
      "Sunucu-taraflı konteyner ayrı servis; istemci hafif",
      "Etiket sürümü yayın pipeline'ı",
      "Shared hosting'de istemci-taraflı konteyner (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: izin verildi → ilgili ölçüm etiketlerini etkinleştir (idempotent, zincir ≤6)",
      "Olay: izin reddedildi → ilgili etiketleri ateşleme + anonim moda geç (loop-breaker)",
    ],
    aiAgents: [AI_B1, AI_B2, "AI etiket/tetikleyici önerir; konteyner yayınını insan onaylar"],
    testing: [
      "İzin-bazlı etiket ateşleme testi",
      "Üçüncü-taraf etiket allowlist/CSP testi",
      "Sunucu-taraflı etiketleme doğruluk testi; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: rastgele script enjeksiyonu engellenir",
      "A08 Integrity: etiket sürümlü ve önizlemeli",
      "LLM06/A02: PII sızıntısı (veri katmanı) kontrollü",
    ],
    integration: [
      "Tag Manager, analytics ve pazarlama etiketlerini dağıtır",
      "İzin yönetimi (consent) ile entegre",
      "Sunucu-taraflı ölçüm analytics'e",
    ],
    moduleUsage: [
      "Tag Manager (modül) ölçüm/pazarlama etiketlerini yönetir",
      "Web/pazarlama app'leri tag manager modülünü kullanır",
    ],
  },

  "l1-search-deep": {
    featureDefs: [
      "Arama Derinleştirme: otomatik tamamlama, faceted arama, 'bunu mu demek istediniz' ve eş-anlamlı",
      "Sıralama ayarı (boosting), arama analitiği ve sıfır-sonuç yönetimi",
      "Kişiselleştirilmiş ve bağlamsal arama iyileştirmeleri",
    ],
    security: [
      "Derin arama de yetki-farkında (temel Search ile aynı izolasyon)",
      "Otomatik tamamlama yetkisiz veri önermez",
      "Arama sorgu logu PII-dikkatli",
    ],
    codeOptimization: [
      "Otomatik tamamlama önek-indeksi; düşük gecikme",
      "Facet sayımı indeks-yan; eş-anlamlı sözlükten",
      "Yazım düzeltme (did-you-mean) mesafe-tabanlı",
    ],
    securityOptimization: [
      "Otomatik tamamlama oran-sınırlı (kazıma)",
      "Sıfır-sonuç enjeksiyonu temizlenir",
      "Kişiselleştirme PII-min ve izinli",
    ],
    performance: [
      "Otomatik tamamlama <100ms hedefi; önek önbellekli",
      "Facet sayımı önceden hesaplanmış",
      "Eş-anlamlı sözlük bellekte",
    ],
    mobileApps: [
      "Mobilde otomatik tamamlama ve sesli arama",
      "iOS/Android'de facet katlanır",
      "Dar ekranda 'bunu mu demek istediniz'",
    ],
    wcag: [
      "Otomatik tamamlama aria ile duyurulur; klavye gezinme",
      "Facet sayıları metinle; kontrast 7:1",
      "Sıfır-sonuç açık ve eyleme dönük mesaj",
    ],
    deployment: [
      "Derin arama, Search motoru servisinin üstünde",
      "Otomatik tamamlama ayrı düşük-gecikme uç",
      "Shared hosting'de temel otomatik tamamlama (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sıfır-sonuç sorgusu sık → eş-anlamlı/içerik boşluğu öner (idempotent, zincir ≤6)",
      "Olay: arama trendi değişti → boosting/öneri ayarla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI eş-anlamlı/sıralama ve sıfır-sonuç önerir; arama yetki filtresini kendisi gevşetemez",
    ],
    testing: [
      "Otomatik tamamlama yetki + gecikme testi",
      "Did-you-mean/eş-anlamlı doğruluk testi",
      "Sıfır-sonuç yönetimi kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: yetki-farkında otomatik tamamlama",
      "A04 Insecure Design: oran-sınırı (kazıma)",
      "A03 Injection: sorgu/sonuç sanitize",
    ],
    integration: [
      "Search-deep, temel Search modülünü iyileştirir",
      "Arama analitiği analytics'e",
      "Eş-anlamlı sözlük içerik/katalogdan",
    ],
    moduleUsage: [
      "Arama Derinleştirme (orta taş) Search yeteneğini güçlendirir",
      "Arama-yoğun app'ler bu iyileştirmeleri kullanır",
    ],
  },

  "l1-quiet-hours": {
    featureDefs: [
      "Quiet Hours / Sessiz Saatler: kullanıcı saat dilimine göre bildirim erteleme penceresi",
      "Kanal-bazlı sessizlik, acil-geçiş (override) ve digest'e toplama",
      "Tatil/çalışma saati takvimi entegrasyonu",
    ],
    security: [
      "Sessiz saat tercihi kullanıcıya ait; tenant-izole",
      "Acil bildirim geçişi yetkili (kötüye kullanım önleme)",
      "Saat dilimi/konum izinli kullanılır",
    ],
    codeOptimization: [
      "Sessiz pencere saf hesap (saat dilimi-farkında)",
      "Erteleme kuyruğu; pencere bitince gönder",
      "Digest birleştirme",
    ],
    securityOptimization: [
      "Acil-geçiş allowlist'li olay tipleriyle sınırlı",
      "Sessiz saat suistimali (sürekli geçiş) izlenir",
      "Varsayılan güvenli (gece sessiz)",
    ],
    performance: [
      "Pencere kontrolü gönderim öncesi hızlı",
      "Ertelenen bildirimler verimli zamanlanır",
      "Digest toplu üretilir",
    ],
    mobileApps: [
      "Mobilde sessiz saat ayarı (cihaz saat dilimi)",
      "iOS/Android Rahatsız Etme (DND) ile uyum",
      "Dar ekranda pencere ayarı",
    ],
    wcag: [
      "Sessiz saat ayarı klavye erişimli ve etiketli",
      "Pencere/durum metinle; kontrast 7:1",
      "Acil-geçiş açıkça işaretli",
    ],
    deployment: [
      "Sessiz saat mantığı bildirim modülü içinde",
      "Erteleme zamanlayıcısı ile",
      "Shared hosting'de cron-temelli erteleme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: bildirim sessiz pencerede → ertele veya digest'e ekle (idempotent, zincir ≤6)",
      "Olay: acil olay (allowlist) → sessizliği geç + hemen gönder (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI optimal sessiz pencere önerir; kullanıcı tercihini kendisi değiştiremez",
    ],
    testing: [
      "Saat dilimi-farkında pencere doğruluk testi",
      "Acil-geçiş allowlist testi",
      "Digest toplama testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: acil-geçiş suistimal önleme",
      "A01 Access Control: tercih kullanıcıya ait",
      "A09 Logging: geçiş kararları iz",
    ],
    integration: [
      "Quiet Hours, Notification modülünün parçası/eklentisi",
      "Takvim/çalışma saati ile entegre",
      "Digest bildirimle birlikte",
    ],
    moduleUsage: [
      "Quiet Hours (orta taş) bildirim zamanlamasını yumuşatır",
      "Bildirim gönderen tüm app'ler sessiz-saat desenini kullanır",
    ],
  },

  "l1-misc": {
    featureDefs: [
      "Çeşitli yatay yardımcılar: i18n (çok-dil), Money (para/kur), Realtime, Webhook, API Gateway, Cron",
      "Küçük ama yaygın kullanılan ortak yetenekler tek modülde",
      "Her yardımcı bağımsız etkinleştirilebilir",
    ],
    security: [
      "Her yardımcı kendi yetki/izolasyon kuralına uyar",
      "API Gateway kimlik-doğrulama + oran-sınırı uygular",
      "Para/kur işlemleri denetlenebilir",
    ],
    codeOptimization: [
      "i18n anahtarları tek kaynaktan; Money ondalık tip",
      "API Gateway ortak ara-katman (auth/limit/log)",
      "Cron dağıtık tekil tetik",
    ],
    securityOptimization: [
      "Gateway: kimlik + oran + şema doğrulama tek kapıda",
      "Money: yuvarlama/para birimi tutarlılığı zorunlu",
      "i18n: çeviri enjeksiyonu sanitize",
    ],
    performance: [
      "Gateway düşük ek-yük; i18n önbellekli",
      "Money hesabı hafif",
      "Cron dağıtık ve verimli",
    ],
    mobileApps: [
      "i18n mobilde dil/yerel biçim; Money yerel para",
      "Realtime mobil canlı güncelleme",
      "Gateway mobil API'leri korur",
    ],
    wcag: [
      "i18n ile çok-dilli erişilebilirlik (yön/RTL dahil)",
      "Para/tarih yerel biçimde ve metinle; kontrast 7:1",
      "Dil seçimi klavye erişilebilir",
    ],
    deployment: [
      "API Gateway kenarda; diğer yardımcılar in-tree",
      "Cron dağıtık zamanlayıcı",
      "Shared hosting'de çoğu yardımcı çalışır (Gateway basit)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: API isteği geldi → Gateway kimlik+limit+şema doğrula, sonra yönlendir (idempotent, zincir ≤6)",
      "Olay: kur değişti → Money dönüşüm tablosunu güncelle (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI çeviri/yapılandırma önerir; Gateway/para kurallarını kendisi değiştiremez",
    ],
    testing: [
      "API Gateway kimlik+limit testi",
      "i18n/Money biçim doğruluk testi",
      "Cron tekil tetik testi; en çok 6 tur",
    ],
    owasp: [
      "A07 Auth Failures: Gateway kimlik doğrulama",
      "A04 Insecure Design: Gateway oran-sınırı + şema",
      "A03 Injection: i18n/girdi sanitize",
    ],
    integration: [
      "Misc yardımcılar tüm app'lere ortak küçük yetenekler verir",
      "API Gateway dış erişimin tek kapısı",
      "Money/i18n tüm para/dil içeren ArcheType'larda",
    ],
    moduleUsage: [
      "Misc (modül) i18n/Money/Gateway/Cron gibi yaygın yardımcıları sağlar",
      "Neredeyse tüm app'ler bu yardımcılardan birini kullanır",
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
    console.warn(`[seed-layer1] atlandı (dosya yok): ${id}`);
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
  `[seed-layer1] ${applied} yatay modül düğümü derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`,
);
