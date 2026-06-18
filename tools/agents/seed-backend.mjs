#!/usr/bin/env node
/**
 * seed-backend — Faz B13 (Cowork tek-ajan). backend (BE mimari/karar: deploy profilleri, SDK,
 * destek matrisi, karar defteri) kümesinin 12 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut
 * içeriği uygular (provenance="swarm"). Veri stack: PostgreSQL (Supabase YASAK — proje kararı).
 * Doğrula: node tools/agents/check-content.mjs backend  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");
const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const xdim = (P, what) => ({
  featureDefs: [`${P}: ${what}`, `${P} üst Backend kararının alt-detayı; tek sorumluluk`, `${P} örnek dal — granülerlikteki yerini gösterir`],
  security: [`${P} tenant izolasyonuna (RLS) uyar`, `${P} girdisi sunucuda doğrulanır`, `${P} sır kasada; en-az-ayrıcalık`],
  codeOptimization: [`${P} saf/idempotent tasarlanır`, `${P} üst seviyeyle tipli sözleşme`, `${P} tekrar eden mantık paylaşılan servise`],
  securityOptimization: [`${P} deny-by-default yetki`, `${P} girdi normalizasyonu ile enjeksiyon daraltılır`, `${P} değişikliği sürümlü`],
  performance: [`${P} sorgu indeksli; N+1 önlenir`, `${P} sıcak yol önbellekli`, `${P} gecikme ölçülür`],
  mobileApps: [`${P} API mobil istemciye uyumlu (JSON sözleşme)`, `${P} mobil oran-sınırı`, `${P} offline-uyumlu uçlar`],
  wcag: [`${P} API hata yapısı erişilebilir UI'ı destekler (alan-eşlemeli)`, `${P} hata kodları i18n-edilebilir`, `${P} durum kodları anlamlı`],
  deployment: [`${P} container olarak Swarm/Kubernetes`, `${P} sağlık/hazırlık kontrolü`, `${P} shared hosting'de degrade profil`],
  eca: [ECA_BOUND, `${P} olayında doğrulama + idempotency (zincir ≤6)`, `${P} bağımsız ruleset override edemez`],
  aiAgents: [AI_B1, AI_B2, `${P} tasarımını AI önerebilir; BE kararını/şemayı insan onaylar`],
  testing: [`${P} için birim + sözleşme + entegrasyon testi`, `${P} yük/sınır testi`, "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır"],
  owasp: [`${P}: A01 erişim kontrolü deny-by-default`, `${P}: A03 girdi doğrulama`, `${P}: A09 olay loglama`],
  integration: [`${P} kernel/servis sözleşmesiyle entegre`, `${P} olay veriyolunu kullanır`, `${P} API katmanına bağlanır`],
  moduleUsage: [`${P} bağımsız sunulmaz; üst Backend kararının içinde kullanılır`],
});

const CONTENT = {
  "app-backend": {
    featureDefs: [
      "Backend ürün ailesi: API katmanı, servisler, veri (PostgreSQL), kimlik ve dağıtım profilleri",
      "ArcheType sözleşmesini çalıştıran runtime; ruleset/ECA engine ve yetki",
      "SDK ve deploy profilleri (Swarm/K8s/shared hosting)",
    ],
    security: [
      "Tüm veri PostgreSQL RLS ile tenant-izole; Supabase YOK (proje kararı)",
      "Yetki backend'de zorlanır (deny-by-default); sır kasada (vault)",
      "ECA/ruleset backend otoritesi; serbest JS/SQL/shell yok",
    ],
    codeOptimization: [
      "Servis sınırları net; ArcheType sözleşmesi tipli",
      "Sorgu indeksli + N+1 önleme; okuma-modeli (CQRS)",
      "İdempotent yazımlar; outbox ile olay yayını",
    ],
    securityOptimization: [
      "Deny-by-default + en-az-ayrıcalık; sır rotasyonu",
      "Girdi doğrulama (şema) tüm uçlarda",
      "Tedarik zinciri: bağımlılık imza + SBOM",
    ],
    performance: [
      "API p95 hedefi + ölçüm; okuma-replikası",
      "Önbellek (cache) + outbox + projeksiyon",
      "Yük altında geri-baskı",
    ],
    mobileApps: [
      "API JSON sözleşmesi mobil/Chrome eklenti uyumlu",
      "Mobil için oran-sınırı + offline-uyumlu uçlar",
      "Push/realtime backend desteği",
    ],
    wcag: [
      "API yanıtı erişilebilir UI'ı destekler (alan-eşlemeli hata)",
      "Hata kodları i18n-edilebilir; durum kodları anlamlı",
      "Backend a11y sözleşmesi (cc-a11y-backend) ile",
    ],
    deployment: [
      "Container; Docker Swarm + Kubernetes (HPA/probe/limit)",
      "Hetzner/Debian/AMD EPYC ortamına uygun (proje ortamı)",
      "Shared hosting (WordPress sınıfı) için degrade profil",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ArcheType işlemi → ruleset/ECA değerlendir + idempotent uygula (zincir ≤6)",
      "Olay: ruleset override denemesi → deny + audit (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI backend şema/servis tasarımı önerir; app/module üretemez, prod yazımı insan onaylı",
    ],
    testing: [
      "API sözleşme + entegrasyon + yük testi",
      "Yetki (deny-by-default) + ECA/ruleset testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "OWASP Top 10 + API Top 10 kapsamlı (A01/A03/A07)",
      "A08 Integrity: tedarik zinciri (SBOM/imza)",
      "A09 Logging: backend kararları forensic iz",
    ],
    integration: [
      "Backend, kernel (ArcheType), tüm servisler ve FE API'sini sağlar",
      "Olay veriyolu (outbox) ile asenkron",
      "iPaaS/webhook ile dış entegrasyon",
    ],
    moduleUsage: [
      "Backend app'i API/servis/runtime'ı barındırır",
      "Tüm app'ler backend sözleşmesi üzerinden veri/işlem yapar",
    ],
  },

  "app-backend-x-archetype": xdim("Backend ArcheType örneği", "bir backend ArcheType'ının çok-parçalı sözleşme örneği (fields/relations/policy)"),
  "app-backend-x-stone": xdim("Backend Taşı", "bir backend yeteneğinin alt-parça tarifi (ör. yetki kontrolü servisi)"),
  "app-backend-x-molecule": xdim("Backend Molekülü", "birkaç backend kuralını birleştiren bileşen (ör. doğrulama zinciri)"),
  "app-backend-x-element": xdim("Backend Elementi", "tek bir backend alanı/kuralı (ör. validation rule)"),
  "app-backend-x-atom": xdim("Backend Atomu", "bölünemez backend ilkeli (ör. tenant_id değer nesnesi)"),

  "be-deploy-profilleri": {
    featureDefs: [
      "Deploy Profilleri & Entegrasyon Matrisi: hangi özelliğin hangi dağıtımda (Swarm/K8s/shared) çalıştığı",
      "Profil-özellik matrisi, degrade modu ve minimum gereksinimler",
      "Self-host ve yönetilen dağıtım seçenekleri",
    ],
    security: [
      "Her profil güvenlik tabanını korur (RLS/yetki); degrade güvenliği düşürmez",
      "Profil sırları kasada; ortam ayrımı",
      "Profil değişikliği izli",
    ],
    codeOptimization: [
      "Özellik-profil matrisi bildirimsel; bayrak-temelli yetenek",
      "Degrade modu açık (ağır yetenek kapalı)",
      "Profil-özel yapılandırma tek kaynaktan",
    ],
    securityOptimization: [
      "Shared hosting profilinde tehlikeli yetenek kapalı (güvenli varsayılan)",
      "Profil uyumsuzluğu CI'da yakalanır",
      "Minimum güvenlik gereksinimi her profilde",
    ],
    performance: [
      "Profil-bazlı kaynak limiti; K8s'te HPA",
      "Shared hosting'de hafif profil (düşük kaynak)",
      "Profil performans bütçesi",
    ],
    mobileApps: [
      "Mobil API tüm profillerde aynı sözleşme",
      "Profil-bazlı özellik kullanılabilirliği mobilde gösterilir",
      "Offline degrade her profilde",
    ],
    wcag: [
      "Profil yönetim ekranı klavye+okuyucu erişimli",
      "Profil-özellik matrisi tablo (okuyucu); kontrast 7:1",
      "Degrade durumu açık bildirilir",
    ],
    deployment: [
      "Profiller: Docker Swarm, Kubernetes (tam), shared hosting (degrade)",
      "Hetzner/Debian/EPYC referans ortamı",
      "Matris hangi özelliğin nerede çalıştığını netler",
    ],
    eca: [
      ECA_BOUND,
      "Olay: profil seçildi → uyumlu yetenekleri etkinleştir + uyumsuzu degrade (idempotent, zincir ≤6)",
      "Olay: profil minimum gereksinimi karşılanmadı → uyar/blokla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI profil/kaynak önerir; dağıtım profilini insan seçer/onaylar",
    ],
    testing: [
      "Profil-özellik matrisi tutarlılık testi",
      "Degrade modu (ağır yetenek kapalı) testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A05 Misconfiguration: profil güvenli varsayılan",
      "A01 Access Control: profil sırları/yetki",
      "A09 Logging: profil değişiklikleri iz",
    ],
    integration: [
      "Deploy profilleri, tüm app'lerin dağıtım uyumunu belirler",
      "CI/CD ile profil doğrulama",
      "Scale/crosscut (multi-region) ile",
    ],
    moduleUsage: [
      "Deploy Profilleri (modül) tüm app'lere dağıtım matrisini sağlar",
      "Her app hangi profilde nasıl çalışacağını buradan alır",
    ],
  },

  "be-sdk": {
    featureDefs: [
      "SDK Tasarımı — Vibecoding-Uyumlu App Üretimi: AI/geliştiricinin ArcheType-temelli app üretmesini sağlayan SDK",
      "Tipli API istemcisi, kod üretimi (scaffold) ve sözleşme-bağlı yardımcılar",
      "Deterministik, AI-dostu API yüzeyi",
    ],
    security: [
      "SDK üretilen kod güvenli varsayılan (RLS/yetki); sır gömülmez",
      "SDK API anahtarı kasada; en-az-ayrıcalık",
      "Üretilen kod ruleset sınırına uyar",
    ],
    codeOptimization: [
      "SDK tipli (TS) + sözleşme-bağlı; deterministik üretim",
      "Scaffold şablondan; AI-dostu (belirsizlik düşük)",
      "Sürüm uyumu semantik versiyonla",
    ],
    securityOptimization: [
      "Üretilen kod güvenlik kapılarından geçer (lint/test)",
      "SDK yasak desen (Next.js/Supabase) üretmez",
      "Sürüm sabitleme (reproducible)",
    ],
    performance: [
      "SDK çağrıları tipli + önbellekli; gereksiz istek yok",
      "Scaffold hızlı; üretilen kod bundle-bütçesine uyar",
      "SDK hafif",
    ],
    mobileApps: [
      "SDK mobil (Capacitor) app üretimini destekler",
      "iOS/Android için tipli istemci",
      "Offline-uyumlu üretim",
    ],
    wcag: [
      "SDK üretilen UI WCAG 2.2 AAA bileşenlerini kullanır",
      "Üretilen form alan-etiketli (zorunlu)",
      "Erişilebilirlik üretim varsayılanı",
    ],
    deployment: [
      "SDK paketi sürümlü; tüm deploy profillerinde çalışır",
      "Üretilen app standart dağıtım",
      "Shared hosting'de SDK üretimi statik SPA",
    ],
    eca: [
      ECA_BOUND,
      "Olay: SDK ile app taslağı üretildi → güvenlik/sözleşme kapılarından geçir (idempotent, zincir ≤6)",
      "Olay: yasak desen üretimi → reddet + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI SDK ile şema/scaffold önerir; app/module üretemez, üretilen kod insan onayından geçer",
    ],
    testing: [
      "SDK tipli istemci + scaffold doğruluk testi",
      "Üretilen kod güvenlik/lint kapısı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: SDK sürümlü + üretilen kod denetli",
      "A05 Misconfiguration: güvenli üretim varsayılanı",
      "A06 Vulnerable Components: yasak/riskli bağımlılık üretilmez",
    ],
    integration: [
      "SDK, kernel ArcheType sözleşmesini ve backend API'sini sarmalar",
      "Vibecoding/Studio (builder) ile",
      "CI üretilen kodu doğrular",
    ],
    moduleUsage: [
      "SDK (modül) vibecoding-uyumlu app üretimini sağlar",
      "Geliştirici/AI app üretiminde SDK'yı kullanır",
    ],
  },

  "be-kararlar": {
    featureDefs: [
      "Backend Karar Defteri (24/24): tüm BE mimari kararları, gerekçe ve sonuçlarıyla kayıtlı",
      "Karar → gerekçe → sonuç → alternatifler; değişim süreci",
      "Kilitli kararlar ve revizyon geçmişi",
    ],
    security: [
      "Karar defteri değişmez kayıt (sürümlü); değişiklik izli",
      "Güvenlik kararları (RLS/yetki/sır) net dokümante",
      "Karar erişimi rol bazlı",
    ],
    codeOptimization: [
      "Kararlar tek kaynaktan; kod onlara atıf yapar (ADR bağı)",
      "Karar değişimi codemod/etki analizi gerektirir",
      "Karar-kod tutarlılığı izlenir",
    ],
    securityOptimization: [
      "Güvenlik kararı değişimi gerekçe+onay",
      "Geçmiş kararlar dokunulmaz (denetlenebilir)",
      "Yasak kararlar (Supabase vb.) net",
    ],
    performance: [
      "Karar defteri statik; runtime maliyeti yok",
      "Karar arama indeksli",
      "Karar-kod bağı hızlı çözülür",
    ],
    mobileApps: [
      "Karar defteri mobilde okunur (salt-okuma)",
      "iOS/Android'de karar geçmişi",
      "Dar ekranda karar kartı",
    ],
    wcag: [
      "Karar defteri klavye+okuyucu erişimli (yapılandırılmış)",
      "Karar durumu (aktif/revize) metinle; kontrast 7:1",
      "Gerekçe/alternatif okunur",
    ],
    deployment: [
      "Karar defteri docs/ ile dağıtılır (statik)",
      "Tüm profillerde aynı kararlar geçerli",
      "Shared hosting'de de erişilebilir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: backend kararı değişti → etkilenen kod/ADR'lere gözden-geçir görevi (idempotent, zincir ≤6)",
      "Olay: karara aykırı kod (örn. yasak stack) → CI uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI karar/alternatif önerir; backend kararını insan verir (kilitli kararları değiştiremez)",
    ],
    testing: [
      "Karar-kod tutarlılık (karara aykırı kod yok) testi",
      "Karar defteri bütünlük (gerekçe/sonuç dolu) testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A08 Integrity: karar defteri sürümlü ve izli",
      "A01 Access Control: karar değişim yetkisi",
      "A09 Logging: karar değişiklikleri iz",
    ],
    integration: [
      "Karar defteri, tüm backend kodu ve ADR (kararlar cluster) ile bağlı",
      "CI karar-aykırılığını yakalar",
      "FE kilitli kararlarıyla tutarlı",
    ],
    moduleUsage: [
      "Backend Karar Defteri (modül) tüm BE kararlarını sabitler",
      "Tüm backend çalışması bu kararlara uyar",
    ],
  },

  "be-destek-matrisi": {
    featureDefs: [
      "Destek Matrisi: hangi teknoloji/özelliğin desteklenen, deneysel veya yasak olduğu",
      "Olgunluk seviyesi (GA/beta/deneysel/yasak) ve destek taahhüdü",
      "Sürüm uyumu ve kullanımdan kaldırma (deprecation) takvimi",
    ],
    security: [
      "Yasak teknoloji (güvenlik riski) net işaretli + CI'da reddi",
      "Deneysel özellik üretimde uyarılı",
      "Matris değişimi yetkili+izli",
    ],
    codeOptimization: [
      "Destek durumu bayrakla; deneysel özellik bayrak-arkasında",
      "Kullanımdan kaldırma uyarısı kademeli",
      "Matris tek kaynaktan",
    ],
    securityOptimization: [
      "Yasak bağımlılık/özellik CI lint ile engellenir",
      "Deneysel özellik prod onayı gerektirir",
      "Deprecation güvenli geçiş penceresi",
    ],
    performance: [
      "Matris statik; runtime maliyeti yok",
      "Destek sorgusu hızlı",
      "Matris değişimi anında yayılır",
    ],
    mobileApps: [
      "Destek matrisi mobilde okunur",
      "iOS/Android'de özellik durumu",
      "Dar ekranda matris özeti",
    ],
    wcag: [
      "Destek matrisi tablosu klavye+okuyucu erişimli",
      "Durum (GA/beta/yasak) renk dışında metinle; kontrast 7:1",
      "Deprecation uyarısı açık",
    ],
    deployment: [
      "Matris docs/config ile; CI bunu zorlar",
      "Tüm profillerde geçerli",
      "Shared hosting destek durumu matriste",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yasak teknoloji eklendi → CI reddet + matris göster (idempotent, zincir ≤6)",
      "Olay: deprecation tarihi yaklaştı → kullanıcıları uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alternatif/geçiş önerir; destek durumu kararını insan verir",
    ],
    testing: [
      "Yasak teknoloji tespit (CI) testi",
      "Deneysel/deprecation bayrak davranış testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A06 Vulnerable Components: yasak/riskli bileşen reddi",
      "A05 Misconfiguration: destek durumu net",
      "A08 Integrity: matris sürümlü",
    ],
    integration: [
      "Destek matrisi, karar defteri ve CI ile entegre",
      "FE/BE anti-stack (yasaklar) ile tutarlı",
      "Deprecation tüm app'lere yayılır",
    ],
    moduleUsage: [
      "Destek Matrisi (modül) teknoloji/özellik olgunluğunu netler",
      "Tüm app'ler destek durumunu matristen kontrol eder",
    ],
  },

  "be-mail-zinciri": {
    featureDefs: [
      "Mail Provider Chain — Çalıştır ve Unut: birincil/yedek e-posta sağlayıcı zinciri ve otomatik geçiş",
      "Sağlayıcı failover, kuyruk ve teslim garantisi (en-az-bir-kez)",
      "Bounce/şikayet yönetimi ve sağlayıcı sağlığı",
    ],
    security: [
      "Sağlayıcı anahtarları kasada; e-posta içeriği PII maskeli loglanır",
      "Gönderim izin-bazlı (opt-out); spoofing önleme (SPF/DKIM/DMARC)",
      "Sağlayıcı değişimi izli",
    ],
    codeOptimization: [
      "Sağlayıcı zinciri adaptör deseni; failover otomatik",
      "Gönderim asenkron kuyruk (çalıştır-unut)",
      "Bounce/şikayet işleme bildirimsel",
    ],
    securityOptimization: [
      "Birincil sağlayıcı düşerse yedeğe geçiş (idempotent, çift gönderim yok)",
      "Şikayet/bounce oranı izlenir; itibar korunur",
      "Gönderim oran-sınırı",
    ],
    performance: [
      "Kuyruk ile yüksek hacim; sağlayıcı oran-sınırına uyum",
      "Failover hızlı; teslim gecikmesi izlenir",
      "Toplu gönderim parçalı",
    ],
    mobileApps: [
      "Mail zinciri backend; teslim izleme mobilde salt-okuma",
      "iOS/Android push ile gönderim hatası uyarısı",
      "Dar ekranda sağlayıcı sağlık özeti",
    ],
    wcag: [
      "Mail yönetim ekranı klavye+okuyucu erişimli",
      "Sağlayıcı/teslim durumu renk dışında metinle; kontrast 7:1",
      "Hata detayı yapılandırılmış",
    ],
    deployment: [
      "Mail gönderici worker; sağlayıcı adaptörleri",
      "IP itibar/ısıtma yönetimi",
      "Shared hosting'de tek sağlayıcı (zincir kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: e-posta gönderilecek → birincil sağlayıcıyla dene; başarısızsa yedeğe geç (idempotent, zincir ≤6)",
      "Olay: tüm sağlayıcılar başarısız → DLQ + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sağlayıcı/teslim-edilebilirlik önerisi üretir; sağlayıcı yapılandırmasını insan onaylar",
    ],
    testing: [
      "Sağlayıcı failover (idempotent, çift gönderim yok) testi",
      "Bounce/şikayet işleme testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A02 Cryptographic Failures: sağlayıcı anahtarı güvenli; SPF/DKIM",
      "A04 Insecure Design: failover + idempotency",
      "A09 Logging: gönderim kararları iz (PII maskeli)",
    ],
    integration: [
      "Mail zinciri, notification (e-posta kanalı) ve mail suite ile entegre",
      "Sağlayıcılar ipaas/adaptörden",
      "Teslim metrikleri observability'ye",
    ],
    moduleUsage: [
      "Mail Provider Chain (modül) güvenilir e-posta teslimini sağlar",
      "E-posta gönderen tüm app'ler bu zinciri kullanır",
    ],
  },

  "be-v1-kapsam-disi": {
    featureDefs: [
      "v1 Teslim Profili: tek varsayılan kurulum ve v1'de kapsam-dışı (non-goal) özellikler",
      "Minimum uygulanabilir backend (MVP) sınırı ve sonraya bırakılanlar",
      "v1 kabul kriterleri ve kapsam kontrolü",
    ],
    security: [
      "v1 güvenlik temeli tam (RLS/yetki/audit); kısıntı güvenlikten olmaz",
      "Kapsam-dışı özellik güvenlik açığı bırakmaz (kapalı)",
      "v1 sınır kararı izli",
    ],
    codeOptimization: [
      "v1 tek varsayılan profil; karmaşıklık ertelenir",
      "Kapsam-dışı özellik bayrak-kapalı (kod yük getirmez)",
      "MVP sınırı net",
    ],
    securityOptimization: [
      "Kapsam daraltma güvenliği zayıflatmaz (güvenli varsayılan kalır)",
      "v1'de deneysel/riskli özellik yok",
      "Kapsam genişlemesi onaylı",
    ],
    performance: [
      "v1 sade profil; performans bütçesi net",
      "Kapsam-dışı ağır özellik yok (hızlı v1)",
      "MVP ölçek hedefi",
    ],
    mobileApps: [
      "v1 mobil kapsam net (temel akışlar)",
      "Kapsam-dışı mobil özellik sonraya",
      "v1 mobil-first temel",
    ],
    wcag: [
      "v1'de erişilebilirlik (WCAG AAA) kapsam-içi (kısılmaz)",
      "v1 akışları tam erişilebilir; kontrast 7:1",
      "Erişilebilirlik non-goal değildir",
    ],
    deployment: [
      "v1 tek varsayılan dağıtım profili (basit)",
      "Karmaşık çok-bölge v1 kapsam-dışı (sonra)",
      "Shared hosting v1 uyumu hedeflenir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: v1 kapsam-dışı özellik istendi → bilgilendir + sonraki sürüme not (idempotent, zincir ≤6)",
      "Olay: v1 kabul kriteri karşılanmadı → teslim durdur (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI v1 kapsam/öncelik önerir; kapsam kararını (in/out) insan verir",
    ],
    testing: [
      "v1 kabul kriteri (DoD) doğrulama testi",
      "Kapsam-dışı özellik kapalı (sızmıyor) testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A04 Insecure Design: v1 güvenlik temeli tam",
      "A05 Misconfiguration: kapsam-dışı güvenli kapalı",
      "A09 Logging: kapsam kararları iz",
    ],
    integration: [
      "v1 profili, deploy profilleri ve karar defteri ile tutarlı",
      "Kapsam-dışı özellikler build risk defterine",
      "v1 DoD bütünsel doğrulamaya (Küme F) bağlı",
    ],
    moduleUsage: [
      "v1 Teslim Profili (modül) MVP sınırını ve kapsam-dışını netler",
      "Tüm backend çalışması v1 kapsamına göre önceliklenir",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);
let applied = 0;
let skipped = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
  if (!fs.existsSync(path.join(NODES, `${id}.json`))) {
    console.warn(`[seed-backend] atlandı (dosya yok): ${id}`);
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
console.log(`[seed-backend] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`);
