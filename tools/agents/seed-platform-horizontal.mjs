#!/usr/bin/env node
/**
 * seed-platform-horizontal — Faz B10 (Cowork tek-ajan). platform-horizontal (yatay platform servisleri:
 * IAM, BPM, Studio, GRC, iPaaS, RPA, i18n, audit, AI governance) kümesinin 14 ŞABLON düğümüne
 * ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular (provenance="swarm").
 * Doğrula: node tools/agents/check-content.mjs platform-horizontal  (+ npm run typecheck)
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
    `${P} üst ArcheType'ın alt-detayı; tek sorumluluk`,
    `${P} örnek dal — granülerlikteki yerini gösterir`,
  ],
  security: [
    `${P} üst ArcheType tenant izolasyonuna uyar`,
    `${P} girdisi sınırda doğrulanır`,
    `${P} hassas veri üst katmanda maskelenir`,
  ],
  codeOptimization: [
    `${P} saf/idempotent tasarlanır`,
    `${P} üst seviyeyle tipli arayüz`,
    `${P} tekrar eden mantık paylaşılan yardımcıya`,
  ],
  securityOptimization: [
    `${P} en az ayrıcalıkla çalışır`,
    `${P} girdi normalizasyonu ile enjeksiyon daraltılır`,
    `${P} değişikliği sürümlü`,
  ],
  performance: [
    `${P} çıktısı önbelleklenebilir`,
    `${P} tembel başlatılır`,
    `${P} küçük serileştirilebilir çıktı`,
  ],
  mobileApps: [
    `${P} UI'si varsa mobilde tek sütun`,
    `${P} iOS/Android içinde bağımsız çalışabilir`,
    `${P} dar ekranda okunur`,
  ],
  wcag: [
    `${P} etkileşimi klavye erişimli ve adlandırılmış`,
    `${P} durumu metinle bildirilir (kontrast 7:1)`,
    `${P} hata mesajı ilişkilendirilmiş`,
  ],
  deployment: [
    `${P} üst ArcheType ile dağıtılır`,
    `${P} üst yetenekle ölçeklenir`,
    `${P} shared hosting'de istemci-içi çalışabilir`,
  ],
  eca: [
    ECA_BOUND,
    `${P} girdisi geçersiz → sınırda reddet + üst akışa hata (idempotent, zincir ≤6)`,
    `${P} bağımsız otomasyon tutmaz; üst kurala bağlanır`,
  ],
  aiAgents: [AI_B1, AI_B2, `${P} tarifini AI önerebilir; üst ArcheType/app'i kendisi üretemez`],
  testing: [
    `${P} için birim + üst sözleşme entegrasyon testi`,
    `${P} sınır/erişilebilirlik mikro-yolculuğu`,
    "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
  ],
  owasp: [
    `${P}: A03 girdi sınırda doğrulanır`,
    `${P}: A04 en-az-ayrıcalık tasarım`,
    `${P}: kabul/red izlenir`,
  ],
  integration: [
    `${P} üst ArcheType'a tipli arayüzle bağlanır`,
    `${P} sözleşmeyi tüketir`,
    `${P} çıktısı üst akışta kullanılır`,
  ],
  moduleUsage: [`${P} bağımsız sunulmaz; üst ArcheType içinde kullanılır`],
});

const CONTENT = {
  "app-platform-horizontal": {
    featureDefs: [
      "Platform & Yatay ürün ailesi: IAM, iş akışı (BPM), Studio, GRC, entegrasyon (iPaaS), RPA, i18n",
      "Tüm app'leri yatay kesen platform servisleri; bir kez kurulur, herkes kullanır",
      "Yönetişim, kimlik ve otomasyon çekirdeği",
    ],
    security: [
      "Yatay servisler merkezî güvenlik/yetki politikasını uygular (IAM tabanlı)",
      "Servis erişimi rol/ReBAC; her servis kendi yetki kapsamı",
      "Politika değişikliği yetkili+sürümlü+izli",
    ],
    codeOptimization: [
      "Yatay servisler ara-katman/sözleşme olarak; iş koduna sızmaz",
      "Tek kaynak: IAM/i18n/BPM tekrar yazılmaz",
      "Servis arayüzü dar ve kararlı",
    ],
    securityOptimization: [
      "Servisler deny-by-default; gereksiz olan kapalı",
      "GRC kontrolleri sürekli izlenir",
      "Entegrasyon (iPaaS) allowlist'li",
    ],
    performance: [
      "Yetki/i18n çözümleme önbellekli; sıcak yolu yavaşlatmaz",
      "BPM/RPA asenkron yürütülür",
      "Servisler bağımsız ölçeklenir",
    ],
    mobileApps: [
      "Yatay servis yüzeyleri (onay/kimlik) mobil-uyumlu",
      "iOS/Android'de MFA/onay akışı",
      "Dar ekranda yönetim yüzeyleri uyarlanır",
    ],
    wcag: [
      "Platform UI'ları WCAG 2.2 AAA ortak bileşenleriyle",
      "Durum/aksiyon renk dışında metinle; kontrast 7:1",
      "Klavye + ekran okuyucu erişimi servis genelinde",
    ],
    deployment: [
      "Yatay servisler ayrı ölçek; IAM/iPaaS merkezî",
      "BPM/RPA worker'ları ayrı",
      "Shared hosting'de temel IAM/i18n (gelişmiş RPA degrade)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: politika/rol değişti → etkilenen app'lere yetki güncellemesi yay (idempotent, zincir ≤6)",
      "Olay: GRC kontrolü ihlal → uyar + risk kaydı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI politika/otomasyon önerir; IAM/GRC/ruleset kuralını kendisi değiştiremez",
    ],
    testing: [
      "Her yatay servis için sözleşme + entegrasyon testi",
      "IAM yetki + BPM akış kullanıcı yolculuğu",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control + A07 Auth: IAM çekirdek",
      "A05 Misconfiguration: servisler güvenli varsayılan",
      "A09 Logging: politika/yetki kararları forensic iz",
    ],
    integration: [
      "Platform & Yatay, tüm app'lere kimlik/otomasyon/entegrasyon sağlar",
      "Kernel ve crosscut ile politika paylaşır",
      "iPaaS dış sistemleri bağlar",
    ],
    moduleUsage: [
      "Platform & Yatay app'i yatay servisleri barındırır",
      "Tüm app'ler IAM/BPM/i18n gibi servisleri buradan tüketir",
    ],
  },

  "app-platform-horizontal-x-stone": xdim(
    "Platform Yatay Taşı",
    "bir yatay servisin alt-parça tarifi (ör. yetki kontrolü)",
  ),
  "app-platform-horizontal-x-molecule": xdim(
    "Platform Yatay Molekülü",
    "birkaç yatay kuralı birleştiren bileşen (ör. rol-izin eşlemesi)",
  ),
  "app-platform-horizontal-x-element": xdim(
    "Platform Yatay Elementi",
    "tek bir yatay alan/kural (ör. izin kodu)",
  ),
  "app-platform-horizontal-x-atom": xdim(
    "Platform Yatay Atomu",
    "bölünemez yatay ilkel (ör. rol kimliği değer nesnesi)",
  ),

  "s-iam": {
    featureDefs: [
      "Kimlik & Erişim (IAM): kullanıcı, rol, izin, SSO ve çok-faktörlü kimlik doğrulama",
      "RBAC/ReBAC/ABAC, kullanıcı yaşam döngüsü (provisioning) ve oturum yönetimi",
      "SSO (SAML/OIDC), MFA ve ayrıcalıklı erişim (PAM)",
    ],
    security: [
      "Kimlik verisi tenant_id RLS; parola/sır kasada (hash+salt)",
      "MFA/step-up yüksek-riskli işlemde zorunlu",
      "Yetki değişimi audit'li; en-az-ayrıcalık",
    ],
    codeOptimization: [
      "Yetki kararı merkezî policy engine; uygulamalar çağırır",
      "Token (JWT) imza-doğrulamalı; oturum yönetimi standart",
      "Rol-izin eşlemesi bildirimsel",
    ],
    securityOptimization: [
      "Deny-by-default; izin keşfi (privilege creep) periyodik gözden geçirilir",
      "SSO oturumu kısa ömürlü + yenileme; uzaktan iptal",
      "Ayrıcalıklı erişim zaman-sınırlı (JIT)",
    ],
    performance: [
      "Yetki kontrolü önbellekli (kısa TTL); sıcak yol hızlı",
      "Token doğrulama yerel (imza)",
      "Provisioning toplu/asenkron",
    ],
    mobileApps: [
      "Mobilde biyometrik + güvenli token (Keychain/Keystore)",
      "iOS/Android SSO ve MFA akışı",
      "Oturum süresi/uzaktan iptal",
    ],
    wcag: [
      "Giriş/MFA akışı klavye+okuyucu erişimli",
      "Hata mesajı bilgi sızdırmaz ama erişilebilir; kontrast 7:1",
      "Rol/izin yönetimi erişilebilir tablo",
    ],
    deployment: [
      "IAM merkezî servis; her serviste yetki ara-katmanı",
      "SSO sağlayıcı (SAML/OIDC) entegrasyonu",
      "Shared hosting'de temel auth (PAM/JIT kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: anormal giriş/şüpheli oturum → step-up iste veya oturumu sonlandır (idempotent, zincir ≤6)",
      "Olay: kullanıcı ayrıldı (deprovision) → tüm erişimleri iptal et (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI erişim anomali/izin-fazlalığı önerir; rol/izin kararını yetkili insan verir",
    ],
    testing: [
      "Yetkilendirme (deny-by-default) + MFA/step-up testi",
      "Provisioning/deprovisioning yaşam döngüsü testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control + A07 Auth Failures: IAM çekirdek",
      "A02 Cryptographic Failures: parola/sır güvenli",
      "A09 Logging: kimlik/yetki kararları forensic iz",
    ],
    integration: [
      "IAM, tüm app/ArcheType'ların yetki temelidir",
      "SSO dış kimlik sağlayıcılarla; audit modülüyle",
      "Crosscut güvenlik modeliyle hizalı",
    ],
    moduleUsage: [
      "IAM ArcheType'ı Platform & Yatay'da kimlik/yetki sağlar",
      "Tüm app'ler erişim kararını IAM'den alır",
    ],
  },

  "s-bpm": {
    featureDefs: [
      "İş Akışı / BPM Motoru: görsel süreç tasarımı, insan görevi, otomatik adım ve karar (gateway)",
      "BPMN-benzeri akış, SLA, eskalasyon ve süreç örnekleri",
      "İş kuralları (DMN) ve süreç analizi",
    ],
    security: [
      "Süreç tanımı/örneği tenant_id RLS; adım yetkileri rol bazlı",
      "Süreç değişikliği sürümlü+onaylı",
      "Otomatik adım action allowlist (serbest kod yok)",
    ],
    codeOptimization: [
      "Süreç durum makinesi; gateway/karar bildirimsel (DMN)",
      "Uzun süreç kalıcı (durable) ve devam-edilebilir",
      "İş kuralları tablodan",
    ],
    securityOptimization: [
      "Adım action allowlist; loop-breaker (maks 6)",
      "Step-up onay yüksek-riskli adımda",
      "Süreç sürümleme (çalışan örnekler eski sürümle)",
    ],
    performance: [
      "Süreç örnekleri asenkron; bekleyenler verimli saklanır",
      "Karar değerlendirme hızlı",
      "SLA zamanlayıcısı ölçeklenir",
    ],
    mobileApps: [
      "Mobilde insan görevi onay/red; süreç durumu",
      "iOS/Android push ile bekleyen görev/SLA",
      "Dar ekranda süreç adım ilerlemesi",
    ],
    wcag: [
      "Süreç tasarımcısına klavye alternatifi; görev formu erişilebilir",
      "Adım durumu renk dışında metin+ikonla; kontrast 7:1",
      "SLA/eskalasyon uyarısı sesli",
    ],
    deployment: [
      "BPM motoru dayanıklı worker; durum kalıcı depoda",
      "Karar (DMN) backend'de",
      "Shared hosting'de basit/kısa süreçler (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: süreç olayı + koşul → tanımlı adımı yürüt (allowlist, idempotent, zincir ≤6)",
      "Olay: SLA aşıldı → eskalasyon + sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI süreç/karar kuralı önerir ve simüle eder; çalışan süreci kendisi değiştiremez",
    ],
    testing: [
      "Durum makinesi/gateway + DMN karar testi",
      "SLA/eskalasyon + loop-breaker (maks 6) testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A04 Insecure Design: action allowlist + loop-breaker",
      "A01 Access Control: adım/onay yetkisi",
      "A09 Logging: süreç/karar kararları iz",
    ],
    integration: [
      "BPM, tüm app'lere süreç otomasyonu sağlar (workflow modülüyle yakın)",
      "İnsan görevleri bildirim/UI ile",
      "Karar (DMN) iş kurallarına",
    ],
    moduleUsage: [
      "BPM ArcheType'ı Platform & Yatay'da süreç motorunu sağlar",
      "Süreç gerektiren tüm app'ler BPM'i kullanır",
    ],
  },

  "s-studio": {
    featureDefs: [
      "Low-code Studio: görsel uygulama/sayfa oluşturucu, veri bağlama ve mantık tasarımı",
      "Sürükle-bırak UI, ArcheType'a bağlı form/liste ve otomasyon",
      "Şablon, önizleme ve yayın akışı",
    ],
    security: [
      "Studio ArcheType taslağı/yapılandırma üretir; prod onaylı",
      "Üretilen UI XSS-güvenli (sanitize); serbest kod sınırlı",
      "Studio yetkisi developer/admin rolüyle",
    ],
    codeOptimization: [
      "Görsel tasarım bildirimsel şemaya çevrilir (kod üretimi sınırlı)",
      "Bileşenler ortak kütüphaneden; tekrar yok",
      "Önizleme artımlı",
    ],
    securityOptimization: [
      "Üretilen mantık action allowlist (serbest JS yok)",
      "Yayın migration güvenlik kapısından geçer",
      "Şablon enjeksiyonu engellenir",
    ],
    performance: [
      "Tasarım önizleme hızlı; üretilen UI tembel yüklenir",
      "Şema doğrulama anlık",
      "Yayın asenkron",
    ],
    mobileApps: [
      "Studio masaüstü öncelikli; üretilen uygulamalar mobil-uyumlu",
      "iOS/Android'de üretilen UI duyarlı",
      "Mobil önizleme",
    ],
    wcag: [
      "Üretilen UI WCAG 2.2 AAA bileşenlerini miras alır",
      "Studio tasarımcısına klavye alternatifi; kontrast 7:1",
      "Üretilen form alan-etiketli (zorunlu)",
    ],
    deployment: [
      "Studio kernel ArcheType'a yazar; ortam ayrımı (draft/prod)",
      "Üretilen uygulama standart dağıtım",
      "Shared hosting'de üretilen statik UI (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tasarım kaydedildi → validation + diff + dry-run akışı (idempotent, zincir ≤6)",
      "Olay: yayın istendi → migration güvenlik kapısı + onay (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sayfa/akış önerir ve admin'e quiz sorar; app/module üretemez, yayını insan onaylar",
    ],
    testing: [
      "Tasarım→şema dönüşüm doğruluk testi",
      "Üretilen UI XSS + erişilebilirlik testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: üretilen UI/şablon sanitize",
      "A01 Access Control: ortam-bazlı yayın yetkisi",
      "A08 Integrity: tasarım sürümlü",
    ],
    integration: [
      "Studio, kernel (ArcheType), bpm (akış), iam (yetki) ile entegre",
      "Builder stack'i kullanır",
      "Üretilen UI Surface sözleşmesiyle",
    ],
    moduleUsage: [
      "Low-code Studio ArcheType'ı Platform & Yatay'da görsel oluşturucu sağlar",
      "Hızlı uygulama yapan app'ler Studio'yu kullanır",
    ],
  },

  "s-ai-governance": {
    featureDefs: [
      "AI Yönetişimi / Model Risk: model envanteri, değerlendirme, izleme ve sorumlu-AI politikası",
      "Model kartı, önyargı (bias)/adillik testi, açıklanabilirlik ve onay akışı",
      "EU AI Act benzeri risk sınıflandırma ve denetim izi",
    ],
    security: [
      "Model/değerlendirme verisi tenant_id RLS; karar izli",
      "Model dağıtımı onaylı (risk sınıfına göre); prompt/yanıt audit",
      "Hassas eğitim verisi PII korumalı",
    ],
    codeOptimization: [
      "Model envanteri sürümlü; değerlendirme metrikleri yapılandırılmış",
      "Risk sınıflandırma kural-temelli (bildirimsel)",
      "İzleme (drift/bias) projeksiyondan",
    ],
    securityOptimization: [
      "Yüksek-risk model insan-gözetimi zorunlu (human-in-the-loop)",
      "Model sürümü pinlenir; onaysız dağıtım deny",
      "Bias/adillik eşiği aşımı bloklar",
    ],
    performance: [
      "İzleme akış-temelli; değerlendirme toplu",
      "Model envanteri sorgusu indeksli",
      "Drift hesabı zamanlanmış",
    ],
    mobileApps: [
      "Mobilde model risk/onay durumu",
      "iOS/Android push ile drift/bias uyarısı",
      "Dar ekranda model kartı özeti",
    ],
    wcag: [
      "Model kartı/metrik klavye+okuyucu erişimli",
      "Risk sınıfı renk dışında metinle; kontrast 7:1",
      "Açıklanabilirlik çıktısı yapılandırılmış",
    ],
    deployment: [
      "AI governance ara-katman; model çıkarımının önünde",
      "Değerlendirme/izleme worker",
      "Shared hosting'de temel envanter (gelişmiş izleme kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: model dağıtım istendi → risk sınıfı + değerlendirme + onay kapısı (idempotent, zincir ≤6)",
      "Olay: drift/bias eşiği aştı → modeli işaretle + insan incelemesi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI değerlendirme/risk analizi önerir; model dağıtım/onay kararını insan verir (sorumlu-AI)",
    ],
    testing: [
      "Bias/adillik + açıklanabilirlik değerlendirme testi",
      "Risk sınıflandırma + onay kapısı testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "OWASP LLM Top 10: model risk yönetimi çerçevesi",
      "A08 Integrity: model/veri sürümlü, soyağacı izli",
      "A09 Logging: model kararları forensic iz",
    ],
    integration: [
      "AI governance, ai-stack (çıkarım), predictive (model), audit ile entegre",
      "Tüm AI tüketen ArcheType'lar bu yönetişime tabi",
      "GRC/compliance ile uyum",
    ],
    moduleUsage: [
      "AI Yönetişimi ArcheType'ı Platform & Yatay'da sorumlu-AI sağlar",
      "AI kullanan tüm app'ler bu yönetişimden geçer",
    ],
  },

  "s-audit": {
    featureDefs: [
      "Audit / Uyumluluk: değişmez denetim izi, uyum kanıtı ve denetim raporlaması",
      "Forensic kayıt (actor/agent/before-after), saklama ve sorgulanabilir iz",
      "Denetçi erişimi ve uyum kanıt paketi",
    ],
    security: [
      "Audit kaydı değişmez (append-only); hash zinciri",
      "Audit erişimi denetçi rolüyle + kendisi audit'li (meta-audit)",
      "Forensic alanlar eksiksiz (actor/agent/model/hash)",
    ],
    codeOptimization: [
      "Audit yazımı asenkron (outbox); ana işlemi yavaşlatmaz",
      "Olay şeması sürümlü; kayıt yapılandırılmış",
      "Sorgu zaman+aktör indeksli",
    ],
    securityOptimization: [
      "Değişmezlik kriptografik; kurcalama tespit edilir",
      "Saklama politikası yasal süreye uyar",
      "Yetkisiz audit erişimi engellenir+izlenir",
    ],
    performance: [
      "Yüksek-yazım append-only; eski kayıt soğuk arşive",
      "Sorgu indeksli; rapor projeksiyondan",
      "Kanıt paketi asenkron üretilir",
    ],
    mobileApps: [
      "Mobilde denetim olayı/uyum durumu (salt-okuma)",
      "iOS/Android push ile kritik uyum uyarısı",
      "Dar ekranda denetim özeti",
    ],
    wcag: [
      "Audit akışı klavye+okuyucu erişimli; kayıtlar yapılandırılmış",
      "Aktör tipi (insan/AI) renk dışında etiketle; kontrast 7:1",
      "Filtre/zaman aralığı erişilebilir",
    ],
    deployment: [
      "Audit deposu append-only; arşiv soğuk katman",
      "Audit yazıcı worker (outbox tüketici)",
      "Shared hosting'de DB-temelli audit",
    ],
    eca: [
      ECA_BOUND,
      "Olay: herhangi bir kayıt değişti → değişmez audit girdisi (hash, idempotent, zincir ≤6)",
      "Olay: denetim talebi → kanıt paketini üret (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI denetim özeti/anomali tespiti üretir; audit kaydını kendisi yazamaz/değiştiremez (değişmez)",
    ],
    testing: [
      "Audit değişmezlik + hash zinciri kurcalama testi",
      "Uyum kanıt paketi üretim testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A09 Security Logging: değişmez forensic iz çekirdek",
      "A01 Access Control: audit erişimi denetçi rolüyle",
      "A08 Integrity: hash zinciri ile bütünlük",
    ],
    integration: [
      "Audit, tüm ArcheType değişikliklerini olay veriyolundan toplar (l1-audit ile yakın)",
      "AI aksiyonları forensic alanlara",
      "GRC/compliance audit'i kaynak alır",
    ],
    moduleUsage: [
      "Audit / Uyumluluk ArcheType'ı Platform & Yatay'da denetim izini sağlar",
      "Tüm app'ler değişiklikleri için audit'i kullanır",
    ],
  },

  "s-cyber-grc": {
    featureDefs: [
      "Siber GRC: NIS2/DORA/SOC2/ISO 27001 uyum yönetimi, kontrol, risk ve olay (incident)",
      "Kontrol kütüphanesi, risk değerlendirme ve uyum durumu (continuous compliance)",
      "Güvenlik olay yönetimi ve düzenleyici bildirim",
    ],
    security: [
      "GRC/risk verisi tenant_id RLS; kontrol kanıtı değişmez",
      "Güvenlik olayı (incident) audit'li; bildirim süre takibi",
      "Hassas zafiyet bilgisi kısıtlı erişim",
    ],
    codeOptimization: [
      "Kontrol→standart eşlemesi (çoktan-çoğa); risk skoru türetilir",
      "Continuous compliance: kanıt otomatik toplanır",
      "Olay yaşam döngüsü durum makinesi",
    ],
    securityOptimization: [
      "Eksik kontrol uyarı/risk; sessiz uyumsuzluk olmaz",
      "Olay bildirim süresi (NIS2/DORA) takipli",
      "Kanıt bütünlüğü (hash)",
    ],
    performance: [
      "Uyum durumu projeksiyondan; kanıt toplama zamanlanmış",
      "Risk matrisi indeksli",
      "Olay korelasyonu gözlemlenebilirlikten",
    ],
    mobileApps: [
      "Mobilde risk/uyum durumu ve olay onayı",
      "iOS/Android push ile kritik güvenlik olayı/bildirim süresi",
      "Dar ekranda uyum skoru",
    ],
    wcag: [
      "Risk matrisi/kontrol tablosu klavye+okuyucu erişimli",
      "Risk/uyum durumu renk dışında metin+ikonla; kontrast 7:1",
      "Olay detayı yapılandırılmış",
    ],
    deployment: [
      "GRC servisi standart; kanıt toplama + olay worker",
      "Gözlemlenebilirlik/SIEM entegrasyonu",
      "Shared hosting'de temel GRC (SIEM kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: güvenlik olayı tespit → incident aç + sınıflandır + bildirim süresi başlat (idempotent, zincir ≤6)",
      "Olay: kontrol ihlali → risk kaydı + sorumluya uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI risk/kontrol boşluğu ve olay önceliği önerir; uyum/incident kararını güvenlik ekibi verir",
    ],
    testing: [
      "Kontrol→standart eşleme + uyum durumu testi",
      "Olay yaşam döngüsü + bildirim süresi testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "OWASP Top 10 + güvenlik çerçeveleri (SOC2/ISO) eşlemesi",
      "A09 Logging: incident/kontrol kararları forensic iz",
      "A08 Integrity: kanıt hash + değişmezlik",
    ],
    integration: [
      "Cyber GRC, audit (kanıt), observability (olay), compliance-matrix ile entegre",
      "Risk kurumsal risk defterine",
      "Olay bildirim/SIEM ile",
    ],
    moduleUsage: [
      "Siber GRC ArcheType'ı Platform & Yatay'da güvenlik yönetişimi sağlar",
      "Düzenlemeye tabi tüm app'ler GRC'yi kullanır",
    ],
  },

  "s-i18n": {
    featureDefs: [
      "i18n / Yerelleştirme: çeviri yönetimi, çok-dilli içerik, yerel biçim ve çeviri iş akışı",
      "Çeviri belleği, bağlam ve dil-geri-düşme (fallback); TMS entegrasyonu",
      "Yerel sayı/tarih/para ve RTL desteği",
    ],
    security: [
      "Çeviri/yerel veri tenant_id RLS; çeviri kaynak erişimi rol bazlı",
      "Çeviri içeriği sanitize (enjeksiyon)",
      "Dil tercihi kullanıcıya ait",
    ],
    codeOptimization: [
      "Çeviriler tek kaynaktan (ICU); yerel veri CLDR'den",
      "Eksik çeviri güvenli fallback",
      "Çeviri paketleri tembel + önbellekli",
    ],
    securityOptimization: [
      "Çeviri format-string enjeksiyonu engellenir",
      "Çeviri değişikliği sürümlü; onay akışı",
      "RTL/bidi güvenli işleme",
    ],
    performance: [
      "Çeviri paketi tembel yükleme; önbellek",
      "Yerel biçimleme önbellekli",
      "Kullanılmayan dil yüklenmez",
    ],
    mobileApps: [
      "Mobilde cihaz dili/yerel otomatik; RTL düzen",
      "iOS/Android yerel tarih/sayı/para",
      "Dil değişimi anında",
    ],
    wcag: [
      "Sayfa dili (lang) doğru; ekran okuyucu telaffuzu doğru",
      "RTL düzen tam erişilebilir; kontrast 7:1",
      "Dil seçici klavye erişilebilir",
    ],
    deployment: [
      "Çeviri paketleri statik/CDN; TMS entegrasyonu",
      "Çeviri derleme build/runtime",
      "Shared hosting'de statik çeviri (uyumlu)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: içerik eklendi/değişti → çeviri iş emri oluştur + eksikleri raporla (idempotent, zincir ≤6)",
      "Olay: çeviri onaylandı → ilgili paketi yayınla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI çeviri/yerelleştirme önerir; çeviri yayınını insan onaylar (kalite/bağlam)",
    ],
    testing: [
      "ICU çoğul/biçim + RTL render testi",
      "Eksik çeviri fallback testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A03 Injection: çeviri format-string/bidi enjeksiyonu engellenir",
      "A05 Misconfiguration: dil güvenli varsayılan",
      "Erişilebilirlik (lang) doğru",
    ],
    integration: [
      "i18n, tüm UI/içerik metnine uygulanır (crosscut i18n standartlarıyla)",
      "strings/çeviri katmanı bu servisi kullanır",
      "TMS dış çeviri sağlayıcılarıyla",
    ],
    moduleUsage: [
      "i18n / Yerelleştirme ArcheType'ı Platform & Yatay'da çeviri yönetimi sağlar",
      "Çok-dilli tüm app'ler i18n'i kullanır",
    ],
  },

  "s-ipaas": {
    featureDefs: [
      "Entegrasyon Hub'ı (iPaaS): konnektör, akış (flow), eşleme (mapping) ve API orkestrasyonu",
      "Hazır konnektörler, dönüşüm ve hata yönetimi; webhook ve zamanlama",
      "Entegrasyon izleme ve yeniden-deneme",
    ],
    security: [
      "Konnektör kimlik bilgileri kasada; akış tenant-izole",
      "Dış çağrı allowlist (SSRF önleme); webhook imzalı",
      "Veri akışı hassas alan maskeli",
    ],
    codeOptimization: [
      "Konnektör ortak arayüz; akış bildirimsel (low-code)",
      "Eşleme (mapping) yapılandırılmış; dönüşüm saf",
      "Hata kuyruğu (DLQ) + yeniden-deneme",
    ],
    securityOptimization: [
      "Dış uç allowlist + iç-IP reddi (SSRF)",
      "Akış oran-sınırlı; aşağı sistem korunur",
      "Kimlik bilgisi rotasyonu",
    ],
    performance: [
      "Akış asenkron; yüksek hacim kuyrukla",
      "Konnektör çağrısı geri-baskılı",
      "Eşleme önbellekli",
    ],
    mobileApps: [
      "iPaaS backend; akış izleme mobilde salt-okuma",
      "iOS/Android push ile akış hatası uyarısı",
      "Dar ekranda entegrasyon sağlık özeti",
    ],
    wcag: [
      "Akış tasarımcısına klavye alternatifi; izleme erişilebilir",
      "Akış durumu renk dışında metinle; kontrast 7:1",
      "Hata detayı yapılandırılmış",
    ],
    deployment: [
      "iPaaS worker'ları ayrı ölçek; konnektör başına oran-sınırı",
      "Webhook alıcısı + DLQ",
      "Shared hosting'de temel entegrasyon (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kaynak olayı → eşle + dönüştür + hedefe ilet (idempotent, zincir ≤6)",
      "Olay: entegrasyon hatası → yeniden-dene; tükenince DLQ + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI eşleme/konnektör önerir; akış yapılandırmasını/kimlik bilgisini insan onaylar",
    ],
    testing: [
      "Eşleme/dönüşüm doğruluk + SSRF reddi testi",
      "Yeniden-deneme + DLQ testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A10 SSRF: dış çağrı allowlist/iç-IP reddi",
      "A08 Integrity: webhook imza + idempotency",
      "A09 Logging: akış/hata kararları iz",
    ],
    integration: [
      "iPaaS, tüm app'leri dış sistemlere bağlar (channel-hub/webhook ile)",
      "Konnektörler MCP/registry'den olabilir",
      "Akışlar workflow/BPM ile tetiklenebilir",
    ],
    moduleUsage: [
      "Entegrasyon Hub'ı ArcheType'ı Platform & Yatay'da dış entegrasyonu sağlar",
      "Dış sistem bağlayan tüm app'ler iPaaS'ı kullanır",
    ],
  },

  "s-rpa": {
    featureDefs: [
      "Hibrit / Tarayıcı-tabanlı RPA-lite: API'siz sistemler için UI otomasyonu (bot) ve görev tekrarı",
      "Adım kaydetme (recorder), seçici (selector) dayanıklılığı ve insan-devri (attended)",
      "Bot zamanlama, kuyruk ve hata kurtarma",
    ],
    security: [
      "Bot kimlik bilgileri kasada; bot eylemleri audit'li",
      "Bot yetkisi en-az-ayrıcalık; hassas ekranda maskeleme",
      "Attended modda insan onayı",
    ],
    codeOptimization: [
      "Bot akışı bildirimsel; seçiciler dayanıklı (self-healing selector)",
      "Adımlar idempotent; başarısızlıkta güvenli kurtarma",
      "API varsa RPA yerine API tercih (RPA son çare)",
    ],
    securityOptimization: [
      "Bot yetkisi dar; ekran kaydı PII maskeli",
      "Hassas işlemde attended (insan onayı)",
      "Bot eylem oran-sınırlı",
    ],
    performance: [
      "Bot kuyruğu; eşzamanlı oturum sınırı",
      "Seçici bekleme akıllı (gereksiz bekleme yok)",
      "Hata kurtarma hızlı",
    ],
    mobileApps: [
      "RPA backend/masaüstü; izleme mobilde salt-okuma",
      "iOS/Android push ile bot hatası/onay uyarısı",
      "Dar ekranda bot durumu",
    ],
    wcag: [
      "Bot yönetim ekranı klavye+okuyucu erişimli",
      "Bot durumu renk dışında metinle; kontrast 7:1",
      "Hata detayı yapılandırılmış",
    ],
    deployment: [
      "Bot çalıştırıcı izole ortam; tarayıcı otomasyonu sandbox",
      "Bot zamanlayıcı + kuyruk",
      "Shared hosting RPA için uygun değil (degrade/dış runner)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tetik (zamanlama/olay) → botu kuyruğa al + çalıştır (idempotent, zincir ≤6)",
      "Olay: bot başarısız (seçici kırıldı) → kurtar/yeniden-dene; tükenince insana devret (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bot akışı/seçici onarımı önerir; bot çalıştırmayı/yetkisini insan onaylar",
    ],
    testing: [
      "Bot akışı + seçici dayanıklılık (self-healing) testi",
      "Idempotent adım + hata kurtarma testi",
      "Test döngüsü: başarısız test en fazla 6 kez yeniden çalıştırılır, sonra raporlanır",
    ],
    owasp: [
      "A01 Access Control: bot en-az-ayrıcalık",
      "A09 Logging: bot eylemleri forensic iz",
      "A04 Insecure Design: hassas işlemde attended onay",
    ],
    integration: [
      "RPA, API'siz dış sistemleri otomatikleştirir (iPaaS tamamlayıcısı)",
      "Bot akışları workflow/BPM ile tetiklenir",
      "API mevcutsa iPaaS tercih edilir",
    ],
    moduleUsage: [
      "RPA-lite ArcheType'ı Platform & Yatay'da UI otomasyonu sağlar",
      "Eski/API'siz sistemle çalışan app'ler RPA'yı kullanır",
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
    console.warn(`[seed-platform-horizontal] atlandı (dosya yok): ${id}`);
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
  `[seed-platform-horizontal] ${applied} düğüm derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`,
);
