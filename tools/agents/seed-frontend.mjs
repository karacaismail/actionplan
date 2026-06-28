#!/usr/bin/env node
/**
 * seed-frontend — Faz B11 (Cowork tek-ajan). frontend (FE mimari kararları) kümesinin 14 ŞABLON
 * düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Stack: React + Vite + TanStack + Radix (Next.js/Supabase YASAK — proje kararı).
 * Doğrula: node tools/agents/check-content.mjs frontend  (+ npm run typecheck)
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

const xdim = (P, what) => ({
  featureDefs: [
    `${P}: ${what}`,
    `${P} üst FE kararının alt-detayı; tek sorumluluk`,
    `${P} örnek dal — granülerlikteki yerini gösterir`,
  ],
  security: [
    `${P} istemci durumu güvenli; sır istemcide tutulmaz`,
    `${P} girdi/çıktı XSS-güvenli render`,
    `${P} hassas veri sunucuda kalır`,
  ],
  codeOptimization: [
    `${P} saf bileşen/fonksiyon; tipli (TS)`,
    `${P} tembel yüklenir; bundle etkisi izlenir`,
    `${P} tekrar eden mantık paylaşılan hook/yardımcıya`,
  ],
  securityOptimization: [
    `${P} CSP/XSS sertleştirme`,
    `${P} bağımlılık minimal ve denetli`,
    `${P} değişikliği sürümlü`,
  ],
  performance: [
    `${P} ilk-yük bütçesine dahil; kod bölme`,
    `${P} gereksiz render önlenir (memo)`,
    `${P} ölçüm (Web Vitals) izlenir`,
  ],
  mobileApps: [
    `${P} mobil-öncelikli ve duyarlı`,
    `${P} dokunma hedefleri uygun`,
    `${P} Capacitor köprüsünde çalışır`,
  ],
  wcag: [
    `${P} klavye erişimli ve adlandırılmış`,
    `${P} durumu metinle (kontrast 7:1)`,
    `${P} hata mesajı ilişkilendirilmiş`,
  ],
  deployment: [
    `${P} Vite üretim derlemesine girer`,
    `${P} statik asset CDN'den`,
    `${P} shared hosting'de SPA olarak çalışır`,
  ],
  eca: [
    ECA_BOUND,
    `${P} build/CI olayında doğrulanır (idempotent, zincir ≤6)`,
    `${P} bağımsız backend otomasyonu tutmaz`,
  ],
  aiAgents: [AI_B1, AI_B2, `${P} bileşen/desen önerisini AI verebilir; FE kararını insan onaylar`],
  testing: [
    `${P} için bileşen testi + e2e (Playwright)`,
    `${P} erişilebilirlik (axe) mikro-yolculuğu`,
    "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
  ],
  owasp: [
    `${P}: A03 XSS/injection render-güvenli`,
    `${P}: A05 güvenli FE yapılandırma`,
    `${P}: istemci hataları izlenir`,
  ],
  integration: [
    `${P} engine/veri katmanıyla tipli arayüz`,
    `${P} üst FE kararının parçası`,
    `${P} API sözleşmesini tüketir`,
  ],
  moduleUsage: [`${P} bağımsız sunulmaz; üst FE kararının içinde kullanılır`],
});

const CONTENT = {
  "app-frontend": {
    featureDefs: [
      "Frontend ürün ailesi: React + Vite + TanStack (Router/Query/Table) + Radix tabanlı FE mimarisi",
      "Monorepo, tema (theme), mobil (Capacitor), CDN ve dağıtım kararları",
      "Tüm app'lerin paylaştığı FE çekirdeği, durum (state) ve API katmanı",
    ],
    security: [
      "İstemci sır tutmaz; token güvenli saklama + kısa ömür",
      "Tüm girdi/çıktı XSS-güvenli; CSP sıkı",
      "Yetki kararı backend'de; FE yalnız gösterir",
    ],
    codeOptimization: [
      "React 19 + Vite; TanStack ile veri/rota/tablo (Next.js YOK — proje kararı)",
      "Kod bölme (manualChunks) + tembel görünüm; bundle bütçesi",
      "Tipli (TS strict) + Zod ile çalışma-zamanı doğrulama",
    ],
    securityOptimization: [
      "Sıkı CSP + Trusted Types; bağımlılık taraması (supply-chain)",
      "Üçüncü-taraf script sandbox/allowlist",
      "Sır/anahtar istemci paketine girmez",
    ],
    performance: [
      "İlk-yük JS bütçesi (gzip hedefli); ağır kütüphane lazy",
      "Core Web Vitals (LCP/INP/CLS) izlenir",
      "Veri tembel/önbellekli (TanStack Query)",
    ],
    mobileApps: [
      "Mobil-öncelikli tasarım; Capacitor ile iOS/Android",
      "Chrome eklentisi uyumlu yüzeyler",
      "Offline/PWA kabiliyeti",
    ],
    wcag: [
      "WCAG 2.2 AAA: kontrast ≥7:1, klavye, ARIA, odak yönetimi",
      "Radix erişilebilir primitifler temel",
      "Ekran okuyucu + i18n (RTL) uyumu",
    ],
    deployment: [
      "Vite üretim derlemesi → statik SPA + CDN (GitHub Pages benzeri)",
      "Mobil OTA + store rollout; web kademeli yayın",
      "Shared hosting'de statik SPA + JSON (sunucu gerekmez)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: build/PR → tip + test + axe + bundle bütçe kapıları (idempotent, zincir ≤6)",
      "Olay: bundle bütçesi aşıldı → CI uyar/blokla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bileşen/desen ve erişilebilirlik iyileştirme önerir; FE kararını/yayını insan onaylar",
    ],
    testing: [
      "Bileşen (Testing Library) + e2e (Playwright) + axe (WCAG)",
      "Görsel/erişilebilirlik regresyon kullanıcı yolculuğu",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: XSS önleme (render-güvenli + CSP)",
      "A05 Misconfiguration: güvenli FE varsayılanları",
      "A08 Integrity: bağımlılık imza/SBOM (tedarik zinciri)",
    ],
    integration: [
      "Frontend, engine (veri/JSON-as-DB) ve API sözleşmesini tüketir",
      "Tüm app'ler ortak FE çekirdeğini paylaşır",
      "Tema/i18n crosscut ile",
    ],
    moduleUsage: [
      "Frontend app'i FE çekirdeği ve mimari kararlarını barındırır",
      "Tüm app'ler UI'larını bu FE temelinden kurar",
    ],
  },

  "app-frontend-x-molecule": xdim(
    "Frontend Molekülü",
    "birkaç UI kuralını birleştiren bileşen (ör. form alanı + doğrulama)",
  ),
  "app-frontend-x-element": xdim("Frontend Elementi", "tek bir UI alanı/kuralı (ör. tema token'ı)"),
  "app-frontend-x-atom": xdim(
    "Frontend Atomu",
    "bölünemez UI ilkeli (ör. renk token değer nesnesi)",
  ),

  "fe-core-ui": {
    featureDefs: [
      "FE Çekirdek + UI + State + API: React bileşen mimarisi, durum yönetimi ve veri katmanı",
      "TanStack Query (sunucu durumu) + hafif istemci durumu; Radix + Tailwind UI",
      "Tipli API istemcisi (Zod doğrulamalı) ve hata/loading yönetimi",
    ],
    security: [
      "API yanıtı Zod ile doğrulanır; güvenilmez veri render edilmez",
      "Token bellekte/güvenli saklama; istek araya CSRF koruması",
      "Yetki UI'da gizler ama backend zorlar",
    ],
    codeOptimization: [
      "Sunucu durumu TanStack Query'de (önbellek/invalidation); istemci durumu minimal",
      "Bileşenler saf + memo; gereksiz render yok",
      "API istemcisi tek katman; tipli uçlar",
    ],
    securityOptimization: [
      "Hata mesajı bilgi sızdırmaz; güvenli boş-durum",
      "Veri normalize; XSS-güvenli render",
      "Bağımlılık minimal",
    ],
    performance: [
      "Query önbellek + stale-while-revalidate; gereksiz istek yok",
      "Liste sanal-liste (büyük veri); kod bölme",
      "İlk-yük bütçesine dahil",
    ],
    mobileApps: [
      "Çekirdek UI mobil-öncelikli; dokunma hedefleri uygun",
      "Capacitor'da aynı çekirdek",
      "Offline query önbelleği",
    ],
    wcag: [
      "Radix erişilebilir primitifler; form label↔input",
      "Loading/hata aria-live; kontrast 7:1",
      "Klavye gezinme tam",
    ],
    deployment: [
      "Çekirdek Vite derlemesinde; ortak chunk",
      "API tabanı ortam değişkeniyle",
      "Shared hosting'de statik + JSON/API",
    ],
    eca: [
      ECA_BOUND,
      "Olay: API hatası → tipli hata + yeniden-deneme (idempotent UI, zincir ≤6)",
      "Olay: yetkisiz yanıt → oturum yenile/çıkış (loop-breaker)",
    ],
    aiAgents: [AI_B1, AI_B2, "AI bileşen/hook önerir; çekirdek mimari kararını insan onaylar"],
    testing: [
      "Bileşen + hook birim testi; API istemcisi sözleşme testi",
      "Loading/hata/boş-durum e2e + axe",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: render-güvenli + Zod doğrulama",
      "A07 Auth: token güvenli + oturum yönetimi",
      "A05 Misconfiguration: güvenli API/CSP varsayılanı",
    ],
    integration: [
      "Core UI, engine (JSON-as-DB) ve backend API ile tipli arayüz",
      "Durum/veri tüm görünümlerce paylaşılır",
      "Tema/i18n ile",
    ],
    moduleUsage: [
      "FE Çekirdek (orta taş) tüm UI'ların temel bileşen/veri katmanını sağlar",
      "Tüm görünümler çekirdek UI üzerine kurulur",
    ],
  },

  "fe-monorepo": {
    featureDefs: [
      "Monorepo İskeleti: tek depoda app'ler + paylaşılan paketler (UI, engine, tipler)",
      "Workspace yönetimi, paylaşılan bağımlılık ve sürümleme",
      "Build önbelleği ve etkilenen-proje (affected) testi",
    ],
    security: [
      "Paylaşılan paket sürümlü; tedarik zinciri (SBOM) izlenir",
      "Workspace bağımlılığı allowlist; bilinmeyen paket reddi",
      "CI sır yönetimi (workspace-bazlı)",
    ],
    codeOptimization: [
      "Paylaşılan UI/engine/tipler tek kaynak; kod tekrarı yok",
      "Build önbelleği + etkilenen-proje (affected) hedefleme",
      "Tip paylaşımı uçtan uca (FE↔sözleşme)",
    ],
    securityOptimization: [
      "Bağımlılık tek sürümde (drift önleme)",
      "Paket sınırları (boundary) zorlanır",
      "Supply-chain: lockfile + imza",
    ],
    performance: [
      "Affected build/test ile CI hızı",
      "Paylaşılan chunk; tekrar derleme az",
      "İlk-yük ortak paket optimize",
    ],
    mobileApps: [
      "Mobil app de monorepo'da; paylaşılan UI/engine",
      "iOS/Android build aynı workspace'ten",
      "Tek tip kaynağı tüm platformlara",
    ],
    wcag: [
      "Paylaşılan UI paketi WCAG 2.2 AAA garanti eder",
      "Erişilebilirlik tek yerde; tüm app'ler miras alır",
      "Kontrast/klavye standardı paket-düzeyinde",
    ],
    deployment: [
      "Her app bağımsız dağıtılır; paylaşılan paket sürümlü",
      "Affected deploy (yalnız değişen app)",
      "Shared hosting'de app statik SPA olarak",
    ],
    eca: [
      ECA_BOUND,
      "Olay: PR → affected proje testleri koşulur (idempotent, zincir ≤6)",
      "Olay: paylaşılan paket değişti → bağımlı app'leri yeniden test et (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI paket/sınır düzenleme önerir; monorepo yapı kararını insan onaylar",
    ],
    testing: [
      "Affected test grafı doğruluk testi",
      "Paket sınırı (import boundary) ihlal testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: lockfile + SBOM (tedarik zinciri)",
      "A05 Misconfiguration: workspace güvenli yapılandırma",
      "A09 Logging: build/CI kararları iz",
    ],
    integration: [
      "Monorepo, tüm app + paylaşılan UI/engine/tipleri barındırır",
      "Build sistemi (Vite + workspace) ile",
      "CI affected hedefleme ile",
    ],
    moduleUsage: [
      "Monorepo İskeleti (orta taş) tüm FE'nin yapı temelini sağlar",
      "Tüm app/paketler bu iskelet içinde yaşar",
    ],
  },

  "fe-locked": {
    featureDefs: [
      "FE Kilitli Kararlar: değiştirilmesi PR + gerekçe gerektiren temel FE seçimleri",
      "React/Vite/TanStack/Radix/Tailwind kilidi; Next.js/Supabase yasağı",
      "Kilitli kararların gerekçesi ve değişim süreci",
    ],
    security: [
      "Kilitli kararlar güvenlik temelini korur (CSP, token, Zod)",
      "Kilit değişimi yetkili PR + gerekçe + izli",
      "Yasak stack (güvenlik/belirsizlik riski) reddedilir",
    ],
    codeOptimization: [
      "Kilit: React 19 + Vite + TanStack; deterministik + AI-dostu seçimler",
      "Next.js YASAK (server/client sınırı belirsizliği); Vite tercih",
      "Kararlar tek yerde dokümante",
    ],
    securityOptimization: [
      "Kilitli güvenli varsayılanlar (deny-by-default CSP)",
      "Stack sapması CI'da yakalanır",
      "Yasak bağımlılık (Supabase vb.) reddi",
    ],
    performance: [
      "Kilitli kararlar bundle/performans bütçesini korur",
      "Ağır framework kilidi yok (Vite hafif)",
      "Performans bütçesi kilitli kararlarla uyumlu",
    ],
    mobileApps: [
      "Kilitli mobil kararı: Capacitor (tek kod tabanı)",
      "iOS/Android için tutarlı stack",
      "Mobil-first kilitli",
    ],
    wcag: [
      "Kilitli erişilebilirlik standardı (WCAG 2.2 AAA)",
      "Radix kilidi erişilebilirliği garanti eder",
      "Kontrast/klavye kilitli kararlarda",
    ],
    deployment: [
      "Kilitli dağıtım: statik SPA + CDN",
      "Kilit değişimi migration/uyum analizi gerektirir",
      "Shared hosting uyumu kilitli kararla korunur",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yasak stack (Next.js/Supabase) eklendi → CI reddet + uyar (idempotent, zincir ≤6)",
      "Olay: kilitli karar değişikliği → gerekçe+onay kapısı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kilitli kararı öneremez/değiştiremez; yalnız kilit dışı alanlarda öneri verir",
    ],
    testing: [
      "Yasak stack/bağımlılık tespit (CI lint) testi",
      "Kilitli karar gerekçe-dokümanı tutarlılık testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A05 Misconfiguration: kilitli güvenli varsayılanlar",
      "A08 Integrity: stack kilidi + bağımlılık denetimi",
      "A04 Insecure Design: belirsiz framework (Next.js) tasarımca dışlanır",
    ],
    integration: [
      "Kilitli kararlar tüm FE'yi (monorepo, core-ui, theme) kapsar",
      "CI bu kilitleri zorlar",
      "Stack yasakları proje genelinde",
    ],
    moduleUsage: [
      "FE Kilitli Kararlar (orta taş) FE temel seçimlerini sabitler",
      "Tüm FE çalışması bu kilitlere uyar",
    ],
  },

  "fe-theme": {
    featureDefs: [
      "Tema — Sunum Buildable'ı: token tabanlı tasarım sistemi (renk/tipografi/aralık), SDK üçüncü artefakt",
      "Açık/koyu + yüksek-kontrast tema; marka uyarlama (white-label)",
      "Tema build çıktısı (CSS değişken/token) bağımsız dağıtılabilir",
    ],
    security: [
      "Tema token'ı yalnız sunum; veri/sır içermez",
      "White-label tema tenant-izole",
      "Tema kaynağı güvenli (enjeksiyon yok)",
    ],
    codeOptimization: [
      "Tema CSS değişkenleri (token) tek kaynaktan; sabit-renk yok",
      "Tema build edilebilir artefakt (SDK ile paylaşılır)",
      "Tema değişimi runtime maliyetsiz (değişken)",
    ],
    securityOptimization: [
      "Tema enjeksiyonu (kötü CSS) sanitize",
      "Tema sürümlü; white-label izole",
      "Üçüncü-taraf tema allowlist",
    ],
    performance: [
      "Tema CSS değişkeniyle anlık; yeniden-derleme yok",
      "Token önbellekli; tema değişimi hızlı",
      "Tema chunk küçük",
    ],
    mobileApps: [
      "Tema mobilde sistem temasıyla (dark/light) uyumlu",
      "iOS/Android'de yüksek-kontrast/dinamik boyut",
      "Capacitor'da aynı token",
    ],
    wcag: [
      "Tema token'ları kontrast ≥7:1 garanti eder (AAA)",
      "Yüksek-kontrast tema seçeneği zorunlu",
      "Renk-bağımsız durum (ikon+metin) tema-düzeyinde",
    ],
    deployment: [
      "Tema bağımsız artefakt; CDN'den; SDK ile dağıtılır",
      "White-label tema müşteriye özel build",
      "Shared hosting'de statik tema CSS",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tema güncellendi → token'ları yeniden derle + dağıt (idempotent, zincir ≤6)",
      "Olay: kontrast ihlali (yeni token) → CI reddet (loop-breaker)",
    ],
    aiAgents: [AI_B1, AI_B2, "AI tema/token önerir; markayı/temayı insan onaylar"],
    testing: [
      "Token kontrast (AAA) otomatik testi",
      "Açık/koyu/yüksek-kontrast görsel + axe testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: tema CSS sanitize",
      "A05 Misconfiguration: güvenli tema varsayılanı",
      "Erişilebilirlik (kontrast) garanti",
    ],
    integration: [
      "Tema, core-ui ve tüm bileşenlerce tüketilir",
      "i18n (RTL) ile uyumlu",
      "SDK üçüncü artefakt olarak dış tüketicilere",
    ],
    moduleUsage: [
      "Theme (modül) tüm UI'a token tabanlı tasarım sistemi sağlar",
      "Tüm app'ler temayı (ve white-label) bu modülden alır",
    ],
  },

  "fe-cdn": {
    featureDefs: [
      "CDN Stratejisi: statik asset, görsel ve SPA'nın uçta (edge) dağıtımı; önbellek ve invalidation",
      "Sürüm-bazlı asset (cache-busting), edge önbellek ve coğrafi yakınlık",
      "Görsel optimizasyon (responsive/format) ve önbellek politikası",
    ],
    security: [
      "Asset bütünlüğü (SRI); CDN üzerinden zehirleme engellenir",
      "Özel içerik CDN'de değil; yalnız genel asset",
      "CORS/CSP CDN ile uyumlu",
    ],
    codeOptimization: [
      "Sürüm-hash asset; uzun önbellek + immutable",
      "Yayında atomik geçiş (eski sürüm kırılmaz)",
      "Görsel format (AVIF/WebP) otomatik",
    ],
    securityOptimization: [
      "SRI (subresource integrity) ile asset doğrulama",
      "CDN yapılandırması güvenli (imzalı URL gerekirse)",
      "Önbellek zehirleme önleme",
    ],
    performance: [
      "Edge önbellek; düşük gecikme global",
      "Immutable asset uzun TTL; deploy'da yeni hash",
      "Görsel responsive + lazy",
    ],
    mobileApps: [
      "Mobil asset CDN'den; düşük gecikme",
      "iOS/Android için optimize görsel boyutu",
      "Offline için kritik asset önbelleği",
    ],
    wcag: [
      "Görsele alt-metin (asset değil içerik düzeyinde)",
      "CDN gecikme erişilebilirliği bozmaz (skeleton)",
      "Düşük bant genişliğinde de erişilebilir",
    ],
    deployment: [
      "Deploy'da yeni hash'li asset CDN'e; eski kademeli düşer",
      "Çok-bölge CDN; kenar önbellek",
      "Shared hosting'de basit CDN/önbellek başlıkları",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni sürüm deploy → CDN önbelleğini yeni hash'e yönlendir (idempotent, zincir ≤6)",
      "Olay: kritik asset hatası → eski sürüme düş + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI önbellek/görsel stratejisi önerir; CDN yapılandırmasını insan onaylar",
    ],
    testing: [
      "Cache-busting + atomik sürüm geçiş testi",
      "SRI bütünlük testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: SRI ile asset bütünlüğü",
      "A05 Misconfiguration: güvenli CDN/CORS",
      "A02: özel içerik CDN'de tutulmaz",
    ],
    integration: [
      "CDN, build çıktısını (Vite asset) ve görsel/medyayı dağıtır",
      "Deploy pipeline ile sürüm-hash",
      "Tema/asset ile",
    ],
    moduleUsage: [
      "CDN Stratejisi (orta taş) tüm statik içeriğin dağıtımını sağlar",
      "Tüm web app'leri asset'lerini CDN üzerinden sunar",
    ],
  },

  "fe-deploy": {
    featureDefs: [
      "FE Deploy + OTA + Store Rollout: web kademeli yayın, mobil OTA güncelleme ve app store dağıtımı",
      "Kanarya/yüzde-bazlı web yayın; mobil OTA (anlık) + store sürüm",
      "Geri-alma (rollback) ve sürüm yönetimi",
    ],
    security: [
      "Deploy yetkili + imzalı; OTA paket imzalı",
      "Store kimlik bilgileri kasada",
      "Rollback güvenli (önceki imzalı sürüm)",
    ],
    codeOptimization: [
      "Web kademeli yayın (feature flag/CDN); atomik",
      "Mobil OTA yalnız JS/asset (native değişmez); store native için",
      "Sürüm-hash + immutable",
    ],
    securityOptimization: [
      "Kademeli yayın + metrik izleme → otomatik geri-alma",
      "OTA imza doğrulama (sahte güncelleme reddi)",
      "Deploy izli",
    ],
    performance: [
      "Atomik deploy; kullanıcı kesintisiz",
      "OTA fark-temelli (küçük indirme)",
      "Yayın metrikleri gerçek-zaman",
    ],
    mobileApps: [
      "iOS/Android OTA (Capacitor) + store rollout (kademeli)",
      "Store inceleme uyumu; native sürüm ayrı",
      "OTA ile hızlı düzeltme (native gerektirmeyen)",
    ],
    wcag: [
      "Deploy/yayın yönetim ekranı klavye+okuyucu erişimli",
      "Yayın durumu renk dışında metinle; kontrast 7:1",
      "Geri-alma aksiyonu açık",
    ],
    deployment: [
      "Web CI→CDN; mobil OTA servisi + store pipeline",
      "Çok-ortam (staging/prod) ayrımı",
      "Shared hosting'de statik deploy (OTA yok)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yayın aşaması ilerledi → yüzdeyi artır + metrik izle (idempotent, zincir ≤6)",
      "Olay: yayında hata oranı arttı → otomatik geri-al (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI yayın hızı/metrik analizi önerir; deploy/rollback kararını insan onaylar (kritik)",
    ],
    testing: [
      "Kademeli yayın + otomatik geri-alma testi",
      "OTA imza + fark-güncelleme testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: deploy/OTA imza",
      "A01 Access Control: deploy yetkisi",
      "A09 Logging: yayın/rollback kararları iz",
    ],
    integration: [
      "Deploy, CI (GitHub Actions), CDN ve mobil OTA ile entegre",
      "Rollout crosscut rollout modülüyle",
      "Sürüm metrikleri observability'ye",
    ],
    moduleUsage: [
      "FE Deploy (orta taş) web+mobil yayın stratejisini sağlar",
      "Tüm FE app'leri bu deploy akışını kullanır",
    ],
  },

  "fe-mobile": {
    featureDefs: [
      "Capacitor Mobil + KYC/KYB: web kod tabanından iOS/Android; native köprü (kamera/biyometri/push)",
      "Tek kod tabanı (Capacitor); native eklenti köprüsü ve KYC/KYB akışı",
      "Offline-first ve mobil-özel UX",
    ],
    security: [
      "Mobilde güvenli saklama (Keychain/Keystore); biyometrik kilit",
      "KYC/KYB belge/biyometri PII en yüksek koruma",
      "Native köprü izinleri en-az-ayrıcalık",
    ],
    codeOptimization: [
      "Tek kod tabanı (web→Capacitor); native eklenti köprüsü",
      "Offline-first (yerel önbellek + senkron)",
      "Platform-özel kod minimal",
    ],
    securityOptimization: [
      "Sertifika sabitleme (pinning) opsiyonu",
      "KYC/KYB veri sunucuda; cihazda kalıcı tutulmaz",
      "Native izinler runtime istenir + gerekçeli",
    ],
    performance: [
      "Mobil başlatma/jank bütçesi izlenir",
      "Offline kuyruk + arka plan senkron",
      "Görsel/asset mobil-optimize",
    ],
    mobileApps: [
      "iOS/Android Capacitor; kamera/biyometri/push native köprü",
      "App store uyumu + OTA",
      "Offline-first kullanım",
    ],
    wcag: [
      "Mobil erişilebilirlik (VoiceOver/TalkBack)",
      "Dinamik yazı boyutu + kontrast 7:1",
      "Dokunma hedefi ve hareket alternatifi",
    ],
    deployment: [
      "Capacitor build iOS/Android; OTA + store",
      "Native eklentiler sürümlü",
      "Shared hosting mobil-build sağlamaz (web PWA degrade)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: KYC/KYB belgesi yüklendi → doğrulama akışı + sonuç (idempotent, zincir ≤6)",
      "Olay: offline işlem senkronlandı → sunucu doğrula + çakışma çöz (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI KYC belge/biyometri ön-kontrol önerir; kimlik onayını insan/yetkili akış verir",
    ],
    testing: [
      "Offline→senkron + çakışma çözümü testi",
      "KYC/KYB akış + biyometrik kilit testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A02 Cryptographic Failures: güvenli saklama + KYC PII korunur",
      "A07 Auth: biyometrik + sertifika pinning",
      "Mobil OWASP MASVS hizalaması",
    ],
    integration: [
      "Mobil, core-ui/engine (paylaşılan) ve KYC sağlayıcı ile entegre",
      "Push notification modülüyle",
      "Native köprü kamera/konum (gis) ile",
    ],
    moduleUsage: [
      "Capacitor Mobil (orta taş) tek kod tabanından mobil app sağlar",
      "Mobil gerektiren tüm app'ler bu yaklaşımı kullanır",
    ],
  },

  "fe-ai-rt": {
    featureDefs: [
      "FE AI + Realtime + Offline: istemcide AI yardımcı, canlı (WebSocket/SSE) güncelleme ve offline çalışma",
      "Akış (streaming) AI yanıtı, gerçek-zaman senkron ve çevrimdışı kuyruk",
      "Optimistik UI ve çakışma çözümü",
    ],
    security: [
      "AI çağrısı backend guardrail'dan geçer; istemci sırrı yok",
      "Realtime kanal yetki-farkında; offline veri tenant-izole",
      "Optimistik UI sunucu doğrulamasına bağlı",
    ],
    codeOptimization: [
      "AI yanıtı akış (streaming) render; offline kuyruk + senkron",
      "Realtime abonelik yönetimi (yeniden bağlanma)",
      "Optimistik güncelleme + sunucu uzlaşma",
    ],
    securityOptimization: [
      "AI girdisi backend'de prompt-injection muhafazasından geçer",
      "Offline veri şifreli (cihazda); senkronda doğrulama",
      "Realtime flood/oran sınırı",
    ],
    performance: [
      "AI akış düşük gecikme; realtime hafif",
      "Offline-first; bağlantıda senkron",
      "Optimistik UI anlık geri-bildirim",
    ],
    mobileApps: [
      "Mobilde AI asistanı + canlı + offline (en kritik)",
      "iOS/Android arka plan senkron",
      "Zayıf bağlantıda zarif düşme",
    ],
    wcag: [
      "Akan AI yanıtı aria-live; durdur/yeniden başlat",
      "Realtime güncelleme okuyucuya uygun sıklıkta; kontrast 7:1",
      "Offline durumu açık bildirilir",
    ],
    deployment: [
      "AI çıkarım backend (AI Stack); realtime katmanı ayrı",
      "Offline servis-worker (PWA)",
      "Shared hosting'de SSE/kısa-yoklama (WebSocket kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: offline işlem birikti → bağlantıda senkronla + çakışma çöz (idempotent, zincir ≤6)",
      "Olay: realtime bağlantı koptu → yeniden bağlan + kayıp mesaj telafi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI istemci-yardımcı öneri üretir (backend guardrail'lı); aksiyonu kullanıcı onaylar",
    ],
    testing: [
      "Offline→senkron + optimistik UI çakışma testi",
      "Realtime yeniden bağlanma + mesaj sırası testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "LLM01 Prompt Injection: AI girdisi backend muhafazalı",
      "A01 Access Control: yetki-farkında realtime",
      "A02: offline veri şifreli",
    ],
    integration: [
      "FE AI/RT, ai-stack (çıkarım), realtime (kanal), core-ui ile entegre",
      "Offline PWA servis-worker ile",
      "Senkron engine/API ile",
    ],
    moduleUsage: [
      "FE AI + Realtime + Offline (orta taş) modern istemci yeteneklerini sağlar",
      "AI/canlı/offline gerektiren app'ler bu yetenekleri kullanır",
    ],
  },

  "fe-tooling": {
    featureDefs: [
      "FE Test + Tooling + Observability + Security: test altyapısı, linter, RUM ve istemci güvenliği",
      "Vitest/Playwright/axe, Biome lint, kaynak-harita ve gerçek-kullanıcı izleme (RUM)",
      "İstemci hata izleme ve performans bütçesi (CI gate)",
    ],
    security: [
      "RUM/hata izleme PII'siz (redakte); kaynak-harita korumalı",
      "Bağımlılık güvenlik taraması (CI)",
      "İstemci hata mesajı sır sızdırmaz",
    ],
    codeOptimization: [
      "Lint/format (Biome) + tip (TS strict) kapıları",
      "Bundle analizi + performans bütçesi CI'da",
      "Test altyapısı paylaşılan (Vitest/Playwright)",
    ],
    securityOptimization: [
      "CI: bağımlılık (SCA) + sır tarama",
      "Kaynak-harita yalnız yetkili erişim",
      "Performans bütçesi regresyon kapısı",
    ],
    performance: [
      "RUM (Web Vitals) gerçek kullanıcıdan; regresyon yakalanır",
      "Bundle bütçesi CI gate",
      "Lint/test hızlı (affected)",
    ],
    mobileApps: [
      "Mobil RUM (başlatma/jank/crash) izlenir",
      "iOS/Android crash raporlama (PII'siz)",
      "Mobil performans bütçesi",
    ],
    wcag: [
      "axe (WCAG) testi CI'da zorunlu",
      "Erişilebilirlik regresyon kapısı",
      "Test kapsamında AAA kriterleri",
    ],
    deployment: [
      "Tooling CI'da; RUM ajanı üretimde (hafif)",
      "Kaynak-harita ayrı/korumalı dağıtım",
      "Shared hosting'de temel hata izleme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: PR → lint + tip + test + axe + bundle bütçe kapıları (idempotent, zincir ≤6)",
      "Olay: performans/erişilebilirlik regresyonu → CI blokla + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI test/lint düzeltme önerir; CI gate'lerini kendisi gevşetemez (gate'i kandırma yasak)",
    ],
    testing: [
      "CI gate (lint/tip/test/axe/bundle) bütünlük testi",
      "RUM/hata izleme PII-redaksiyon testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A09 Logging: istemci hata/RUM (PII redakte)",
      "A06 Vulnerable Components: SCA bağımlılık taraması",
      "A05 Misconfiguration: güvenli tooling varsayılanı",
    ],
    integration: [
      "Tooling, CI (GitHub Actions), tüm FE paketleriyle entegre",
      "RUM observability'ye",
      "Performans bütçesi deploy kapısına",
    ],
    moduleUsage: [
      "FE Tooling (orta taş) test/kalite/izleme altyapısını sağlar",
      "Tüm FE app'leri bu tooling kapılarından geçer",
    ],
  },

  "fe-anti": {
    featureDefs: [
      "FE Anti-Stack + Çelişki Kararları: kullanılmayacak teknolojiler ve neden-olmaz gerekçeleri",
      "Next.js, Supabase gibi yasaklar; çelişen seçimlerin çözümü",
      "Anti-pattern listesi ve alternatif",
    ],
    security: [
      "Anti-stack güvenlik/belirsizlik riskini azaltır (yasaklar gerekçeli)",
      "Yasak teknoloji CI'da yakalanır",
      "Çelişki çözümü dokümante + izli",
    ],
    codeOptimization: [
      "Next.js YASAK (server/client sınırı + sık değişim belirsizliği); Vite tercih",
      "Supabase YASAK; PostgreSQL + Prisma (veri stack kararı)",
      "Anti-pattern yerine deterministik/AI-dostu alternatif",
    ],
    securityOptimization: [
      "Yasak bağımlılık reddi (CI lint)",
      "Çelişen karar tek gerekçeyle çözülür (drift yok)",
      "Anti-pattern güvenlik riski belgelenir",
    ],
    performance: [
      "Anti-stack ağır/belirsiz framework'leri eler (performans korunur)",
      "Hafif stack (Vite) bütçeye uygun",
      "Anti-pattern (gereksiz re-render vb.) yasak",
    ],
    mobileApps: [
      "Mobil anti-pattern (ağır web view) yerine Capacitor",
      "Yasak mobil yaklaşımlar gerekçeli",
      "Mobil performans anti-pattern listesi",
    ],
    wcag: [
      "Erişilebilirlik anti-pattern (yalnız-renk, div-buton) yasak",
      "Anti-liste WCAG ihlallerini önler",
      "Alternatif erişilebilir desen önerilir",
    ],
    deployment: [
      "Yasak dağıtım yaklaşımları (örn. SSR-zorunlu) elenir",
      "Statik SPA tercih (shared hosting uyumu)",
      "Anti-stack deploy karmaşıklığını azaltır",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yasak teknoloji/anti-pattern eklendi → CI reddet + gerekçe göster (idempotent, zincir ≤6)",
      "Olay: çelişen karar tespit → tek karara zorla + dokümante (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI yasak stack öneremez; anti-pattern tespit edip alternatif önerir (karar insanın)",
    ],
    testing: [
      "Yasak bağımlılık/anti-pattern tespit (CI lint) testi",
      "Çelişki çözüm dokümanı tutarlılık testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A04 Insecure Design: riskli/belirsiz framework dışlanır",
      "A06 Vulnerable Components: yasak/riskli bağımlılık reddi",
      "A05 Misconfiguration: anti-pattern önleme",
    ],
    integration: [
      "Anti-stack, fe-locked (kilitli kararlar) ile birlikte FE seçimlerini sınırlar",
      "CI bu yasakları zorlar",
      "Veri stack kararı (PostgreSQL/Prisma) ile tutarlı",
    ],
    moduleUsage: [
      "FE Anti-Stack (orta taş) kullanılmayacakları ve gerekçelerini sabitler",
      "Tüm FE çalışması anti-listeye uyar",
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
    console.warn(`[seed-frontend] atlandı (dosya yok): ${id}`);
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
  `[seed-frontend] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`,
);
