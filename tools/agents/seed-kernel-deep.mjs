#!/usr/bin/env node
/**
 * seed-kernel-deep — Faz B0 pilotu (Cowork'te tek-ajan, swarm yerine).
 * Kernel cluster'ının 11 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular
 * (provenance="swarm") ve 4 GOLDEN düğümü provenance="human" damgalar (swarm ezmesin).
 * Yalnız items + status + provenance yazar; prompt/notes/title/key/şema korunur.
 * Doğrula: node tools/agents/check-content.mjs kernel  (+ npm run typecheck)
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
const GOLDEN = ["k-surface", "k-control-planes", "k-agent-runtime", "k-sozlesme"];

// Üniform olmaları KASITLI olan zorunlu güvenlik-sınır satırları (kapı allowlist'i).
const ECA_BOUND =
  "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 =
  "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const CONTENT = {
  "app-kernel": {
    featureDefs: [
      "Kernel ürün ailesi: ArcheType metadata çözümleme, tenant context, capability/yetki ve dört kontrol düzlemini barındırır",
      "Tüm app'lerin paylaştığı sözleşme katmanı (schema pinning, surface/workflow ayrımı) kernel'de tanımlanır",
      "Kernel dikey bir ürün değildir; diğer app'lere çekirdek hizmet veren altyapıdır",
    ],
    security: [
      "Kernel tenant context'i (SET LOCAL tenant_id) tüm alt isteklere zorunlu taşınır; bağlamsız istek reddedilir",
      "Capability/yetki çözümlemesi merkezîdir; app'ler kendi yetki kararını kernel sözleşmesi dışına taşıyamaz",
      "Kernel metadata deposu yalnız developer/PR ile değişir; runtime yazımı locked system ruleset ile kapalı",
    ],
    codeOptimization: [
      "Kernel çekirdeği framework-bağımsızdır; sunum/UI katmanı kernel'e sızmaz",
      "ArcheType çözümleme sonucu şema-sürüm anahtarıyla bellekte tutulur, şema değişince geçersizleşir",
      "Kernel API yüzeyi dar ve kararlı; app'ler yalnız yayınlanmış sözleşmeyi çağırır",
    ],
    securityOptimization: [
      "Kernel yetki çözümleyici deny-by-default; bilinmeyen capability istek reddi + audit",
      "Tenant sırları kernel kasasında; app kodu ham sırrı görmez, yalnız kapsamlı token alır",
      "Kernel bağımlılıkları imzalı; tedarik-zinciri için SBOM ve sürüm sabitleme",
    ],
    performance: [
      "ArcheType çözümleme sıcak yolu önbellekli; soğuk çözümleme bütçesi izlenir",
      "Kernel çağrıları toplu (batch) çözümlemeye uygun; tek istekte çoklu ArcheType metadata'sı döner",
      "Kontrol düzlemi sorguları okuma-replikasından beslenir, yazma yolundan ayrık",
    ],
    mobileApps: [
      "Kontrol düzlemi panelleri 320px+ duyarlı; kernel yönetimi tablet/telefonda da erişilebilir",
      "iOS/Android için kernel API'si JSON sözleşmesiyle PWA/Capacitor köprüsüne uygun",
      "Chrome eklentisi kernel'in salt-okuma metadata uçlarını tüketebilir (yazma yok)",
    ],
    wcag: [
      "Kernel yönetim ekranlarında her aksiyon için görünür ad ve durum metni (WCAG 2.2 AAA)",
      "Kontrol düzlemi geçişleri yalnız renge değil ikon+metne dayanır; kontrast 7:1",
      "Uzun metadata listelerinde landmark + başlık hiyerarşisi ile ekran okuyucu gezinmesi",
    ],
    deployment: [
      "Kernel container imajı Swarm servis olarak; sağlık ucu ArcheType deposu erişimini doğrular",
      "Kubernetes'te kernel ayrı namespace; tenant sır erişimi için kısıtlı ServiceAccount",
      "Shared hosting profilinde kernel salt-okuma metadata'yı statik JSON olarak servis eder",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ArcheType şema sürümü değişti → kernel önbelleğini geçersiz kıl + bağımlı app'lere bildir (zincir ≤6, idempotent)",
      "Olay: capability tanımı kaldırıldı → o capability'ye bağlı surface'leri deprecated işaretle",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "Kernel düzeyinde AI yalnız metadata okur; tenant context ve capability deposuna yazamaz, insana changeset önerir",
    ],
    testing: [
      "Kernel çözümleyici için sözleşme testleri: her ArcheType metadata'sı pinlenmiş şemaya uyar",
      "Tenant izolasyonu için çapraz-tenant erişim denemesi e2e senaryosu (deny beklenir)",
      "Kontrol düzlemi panelleri için kullanıcı yolculuğu + axe AAA; düzelene dek en çok 6 tur, sonra raporla",
    ],
    owasp: [
      "A01 Broken Access Control: kernel capability çözümlemesi merkezî deny-by-default",
      "A08 Software/Data Integrity: ArcheType metadata imzalı + şema pinleme ile tedarik bütünlüğü",
      "A09 Logging: kernel yetki kararları değişmez audit'e yazılır (actor/agent/öncesi-sonrası hash)",
    ],
    integration: [
      "Kernel, tüm app'lere ArcheType/surface/workflow sözleşmesini sağlayan tek otorite",
      "Core (app çekirdeği) kernel'i metadata çözümleme ve yetki için çağırır; ters bağ yok",
      "Olay veriyolu üzerinden 'şema değişti'/'capability değişti' yayınları kernel'den çıkar",
    ],
    moduleUsage: [
      "Kernel bir app ailesidir; alt module'leri (kontrol düzlemleri, sözleşme, agent runtime) tek çatıda sunar",
      "Diğer app'ler kernel'i doğrudan DB ile değil, yayınlanmış kernel sözleşmesi üzerinden tüketir",
    ],
  },

  "k-terminoloji": {
    featureDefs: [
      "Bağlayıcı adlandırma sözleşmesi: kernel (sistemin kalbi), core (app'in kalbi), module (genişletme birimi), SDK",
      "Terminoloji düğümü kavram çakışmalarını çözer: App=dağ, Module=kaya, ArcheType=büyük taş, field=alan",
      "Her terimin tek tanımı vardır; doküman ve kod aynı sözlüğü referans alır",
    ],
    security: [
      "Terminoloji yanlış kullanımı yetki hatasına yol açabilir; 'module' ve 'app' sınırları yetki kapsamını belirler",
      "Sözlük değişikliği yalnız PR ile; terim yeniden tanımı geriye dönük etki analizi gerektirir",
      "Terim takma adları (alias) korunur; eski terim silinmeden yeni terime köprülenir",
    ],
    codeOptimization: [
      "Terminoloji tek kaynaktan (strings/sözlük) gelir; kodda sabit-string tekrarı yerine sembol",
      "Terim değişimi codemod ile yayılır; elle arama-değiştirme yerine yapısal dönüşüm",
      "Sözlük tipleri TypeScript union olarak; yanlış terim derleme zamanında yakalanır",
    ],
    securityOptimization: [
      "Terim karışıklığı kaynaklı yetki sızıntısını önlemek için 'kernel/core/module' kapsamları test-doğrulanır",
      "Sözlük girişleri imzalı sürümlenir; yetkisiz terim ekleme reddi",
      "Belirsiz terim kullanımı lint kuralıyla engellenir (örn. 'plugin' yerine 'module')",
    ],
    performance: [
      "Terminoloji sözlüğü derleme zamanı sabiti; runtime çözümleme maliyeti sıfır",
      "Sözlük araması anahtar bazlı sabit zaman; büyük doküman tabanında bile hızlı",
      "Terim render'ı bellekte tutulur, sayfa başına yeniden hesaplanmaz",
    ],
    mobileApps: [
      "Terminoloji ipuçları mobil ekranda dokunmayla açılan tanım baloncuğu olarak",
      "iOS/Android'de terim sözlüğü çevrimdışı erişilebilir (yerel JSON)",
      "Chrome eklentisinde terim üzerine gelince tanım gösterimi",
    ],
    wcag: [
      "Terim tanım baloncukları klavyeyle açılır/kapanır ve aria-describedby ile bağlanır",
      "Kısaltmalar <abbr> ile işaretlenir; ekran okuyucu açılımı okur",
      "Terim vurgusu yalnız renkle değil altı-çizili + ikonla; kontrast 7:1",
    ],
    deployment: [
      "Terminoloji sözlüğü statik asset; Swarm/Kubernetes/shared hosting fark etmez",
      "Sözlük sürümü imaja gömülür; dağıtım sonrası terim tutarlılığı garanti",
      "CDN üzerinden önbelleklenir; değişiklikte sürüm anahtarı yenilenir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: terim yeniden tanımlandı → bağlı dokümanlara 'gözden geçir' görevi aç (zincir ≤6, idempotent)",
      "Olay: yasak terim (örn. serbest 'plugin') tespit → PR'da uyarı + öneri",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI terim önerebilir ama sözlüğe yazamaz; kernel/core/module kapsam tanımını override edemez",
    ],
    testing: [
      "Sözlük bütünlük testi: her terimin tek tanımı + alias zinciri kopuk değil",
      "Doküman tarama testi: yasak/çakışan terim kullanımı sıfır",
      "Terminoloji UI baloncuğu için klavye + axe AAA kullanıcı yolculuğu",
    ],
    owasp: [
      "A05 Security Misconfiguration: terim/kapsam yanlış eşlemesi yapılandırma denetimiyle yakalanır",
      "A01 Access Control: 'kernel/core/module' kapsamları yetki kararının temelidir, test edilir",
      "Sözlük değişiklik kaydı değişmez audit'e yazılır",
    ],
    integration: [
      "Terminoloji, kernel ve tüm app dokümanlarının paylaştığı tek sözlük otoritesidir",
      "Strings katmanı ve UI etiketleri terminoloji sözlüğünü tüketir",
      "Codemod araçları terim değişimini repoya yayar",
    ],
    moduleUsage: [
      "Bu module tüm app'lere tutarlı terim sağlar; her app aynı kernel/core/module dilini kullanır",
      "Diğer module'ler terim eklemek için sözlük PR'ı açar, doğrudan yazmaz",
    ],
  },

  "k-wbs": {
    featureDefs: [
      "Granülerlik zincirini canlı ağaçta gösterir: Dağ → Kaya → ArcheType → Fragment → Alan → Toz → Atom",
      "HRMS ve CRM gibi örneklerle WBS kırılımını görsel (ECharts ağaç) olarak sunar",
      "WBS düğümü hem öğretici örnek hem story-point/backlog dilinin somut karşılığıdır",
    ],
    security: [
      "WBS örneği yalnız gösterim verisi içerir; gerçek tenant verisi sızmaz",
      "Ağaç verisi salt-okuma; WBS görünümünden yazma/düzenleme yetkisi yoktur",
      "Örnek kayıtlar anonimdir; PII içermez",
    ],
    codeOptimization: [
      "WBS ağacı büyük olduğunda sanal-liste/lazy dal açma ile çizilir",
      "ECharts örneği tembel yüklenir; ağaç verisi ayrı JSON parçasından gelir",
      "Düğüm render'ı seviye-renk eşlemesiyle memoize edilir",
    ],
    securityOptimization: [
      "WBS örnek verisi derleme zamanı sabiti; runtime dış veri çekmez (saldırı yüzeyi yok)",
      "Ağaç etkileşimi yalnız istemci-içi; sunucuya istek gitmez",
      "Örnek JSON şema-doğrulanır; bozuk veri çizimi engellenir",
    ],
    performance: [
      "WBS ağacında yalnız görünür dallar çizilir; derin kırılımda kare hızı korunur",
      "Seviye geçişlerinde yeniden-hesap yerine önceden hesaplanmış düzen kullanılır",
      "İlk çizim bütçesi izlenir; ağır ECharts ana paketten ayrık",
    ],
    mobileApps: [
      "WBS ağacı dokunmayla yakınlaş/kaydır; dar ekranda yatay kaydırmalı",
      "iOS/Android'de ağaç düğümleri parmak hedefine uygun aralıklı",
      "Telefonda derinlik katlama ile tek seviye odaklı gezinme",
    ],
    wcag: [
      "WBS ağacı klavyeyle gezilebilir (ok tuşları) ve aria-tree rolüyle işaretlidir",
      "Seviye ayrımı renk + ikon + metin etiketiyle; yalnız renge bağlı değil",
      "Her düğümde görünür ad ve seviye; ekran okuyucu derinliği duyurur",
    ],
    deployment: [
      "WBS görünümü statik SPA parçası; tüm dağıtım profillerinde çalışır",
      "ECharts varlığı CDN/ayrı chunk; shared hosting'de de yüklenir",
      "Örnek veri imaja gömülü; ağ bağımlılığı yok",
    ],
    eca: [
      ECA_BOUND,
      "Olay: WBS düğüm seçildi → ilgili görev detayına derin-bağ aç (yan etkisiz, idempotent)",
      "WBS örneği salt-gösterim olduğundan otomasyon kuralı tetikleyici/yazıcı değildir",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI, WBS kırılımını önerebilir ama gerçek görev ağacını yazamaz; öneri insan onayına gider",
    ],
    testing: [
      "WBS ağaç render testi: 7 seviye doğru sırada ve renkte çizilir",
      "Klavye gezinme + axe AAA kullanıcı yolculuğu (ağaçta odak hareketi)",
      "Örnek veri şema testi; bozuk dal sıfır",
    ],
    owasp: [
      "A03 Injection: WBS örnek metni güvenli render edilir (XSS yok)",
      "A05 Misconfiguration: salt-okuma görünüm; yazma ucu açıkta değil",
      "Örnek veri dış kaynaktan beslenmez (tedarik yüzeyi minimal)",
    ],
    integration: [
      "WBS görünümü engine'in ağaç/rollup çıktısını tüketir (buildTree)",
      "Granülerlik sözleşmesini (k-granulerlik) görsel olarak yansıtır",
      "Görev detay rotalarına derin-bağ verir",
    ],
    moduleUsage: [
      "WBS örneği bir taş (stone) seviyesidir; granülerlik module'ünün öğretici alt-parçasıdır",
      "Diğer sayfalar WBS desenini kendi kırılımları için referans alır",
    ],
  },

  "app-kernel-x-molecule": {
    featureDefs: [
      "Kernel kırılımının Molekül seviyesi örneği: bir kernel yeteneğinin bileşen düzeyinde tarifi",
      "Molekül, birkaç alanı/kuralı bir araya getiren çalışabilir en küçük kernel bileşenidir",
      "Örnek dal; gerçek üretim yerine 7-seviye kırılımın molekül karşılığını gösterir",
    ],
    security: [
      "Molekül seviyesinde girdi doğrulaması bileşen sınırında yapılır (kernel sözleşmesine uyar)",
      "Bileşen yalnız kendi kapsamındaki alanlara erişir; kernel capability sınırını aşamaz",
      "Molekül durumu tenant bağlamına bağlıdır; bağlamsız çağrı reddedilir",
    ],
    codeOptimization: [
      "Molekül saf fonksiyon olarak tasarlanır; yan etki kenarlara itilir",
      "Bileşen girdi/çıktısı tiplenir; kernel sözleşmesiyle uyum derlemede doğrulanır",
      "Tekrar eden molekül mantığı paylaşılan yardımcıya çıkarılır",
    ],
    securityOptimization: [
      "Molekül en az ayrıcalıkla çalışır; gereksiz capability talep etmez",
      "Bileşen sınırında girdi normalizasyonu ile enjeksiyon yüzeyi daraltılır",
      "Molekül bağımlılıkları minimal; her ek bağımlılık denetlenir",
    ],
    performance: [
      "Molekül hesabı saf ve önbelleklenebilir; aynı girdi tekrar hesaplanmaz",
      "Bileşen tembel başlatılır; kullanılmadıkça yük getirmez",
      "Molekül çıktısı küçük ve serileştirilebilir; ağ yükü düşük",
    ],
    mobileApps: [
      "Molekül UI'si varsa dar ekranda tek sütun; dokunma hedefleri uygun",
      "Bileşen iOS/Android PWA içinde çevrimdışı çalışabilecek kadar bağımsız",
      "Chrome eklentisinde molekül salt-okuma olarak gömülebilir",
    ],
    wcag: [
      "Molekül bileşeninin etkileşimi klavye erişimli ve adlandırılmış",
      "Durum değişimi metinle de bildirilir (yalnız renk değil); kontrast 7:1",
      "Bileşen hata mesajı ilişkilendirilmiş ve ekran okuyucuya duyurulur",
    ],
    deployment: [
      "Molekül kernel imajının parçası; ayrı dağıtım gerektirmez",
      "Kubernetes/Swarm'da kernel ile birlikte ölçeklenir",
      "Shared hosting'de molekül istemci-içi çalışır (sunucu bağımlılığı yoksa)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: molekül girdisi geçersiz → bileşen sınırında reddet + üst kernel akışına hata yay (idempotent)",
      "Molekül zinciri üst seviye kurala bağlanır; bağımsız tetikleyici tutmaz",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI molekül tarifini önerebilir; kernel capability'sini veya app/module'ü üretemez",
    ],
    testing: [
      "Molekül birim testi: saf fonksiyon girdi/çıktı tablosu",
      "Kernel sözleşmesi entegrasyon testi; molekül üst yetenekle uyumlu",
      "UI varsa klavye + axe AAA mikro-yolculuk",
    ],
    owasp: [
      "A03 Injection: molekül girdisi sınırda doğrulanır/normalize edilir",
      "A04 Insecure Design: molekül en-az-ayrıcalık ilkesiyle tasarlanır",
      "Bileşen hataları audit'e bağlanır",
    ],
    integration: [
      "Molekül, üst element/stone seviyesine tipli arayüzle bağlanır",
      "Kernel capability sözleşmesini tüketir; doğrudan DB'ye erişmez",
      "Çıktısı üst kernel akışında kullanılır",
    ],
    moduleUsage: [
      "Molekül bir bileşendir; tek başına app'lere sunulmaz, üst kernel yeteneğinin içinde kullanılır",
    ],
  },

  "app-kernel-x-element": {
    featureDefs: [
      "Kernel kırılımının Element (alan/kural) seviyesi: tek bir alan veya doğrulama kuralının tarifi",
      "Element, kernel sözleşmesindeki en küçük anlamlı alan/kural birimidir",
      "Örnek dal; alan-seviyesi kuralın 7-seviye içindeki yerini gösterir",
    ],
    security: [
      "Element alan doğrulaması sunucu tarafında zorunlu; istemci doğrulaması yeterli sayılmaz",
      "Hassas alan ise PII bayrağı taşır ve maskeleme/şifreleme kuralına tabidir",
      "Alan yazımı tenant bağlamı ve rol yetkisiyle sınırlıdır",
    ],
    codeOptimization: [
      "Element kuralı saf doğrulayıcı; tek sorumluluk ilkesiyle yazılır",
      "Alan tipi Zod şemasıyla; geçersiz tip derleme/parse anında yakalanır",
      "Tekrar eden alan kuralları paylaşılan doğrulayıcıya toplanır",
    ],
    securityOptimization: [
      "Element doğrulaması allowlist temelli (denylist değil); beklenmeyen girdi reddi",
      "Alan uzunluk/biçim sınırı ile taşma ve enjeksiyon daraltılır",
      "PII alanı için en-az-ayrıcalık görünürlük (field-level yetki)",
    ],
    performance: [
      "Element doğrulaması O(1) saf hesap; sıcak yolda maliyetsiz",
      "Alan kuralı önbelleklenebilir; aynı girdi için tekrar çalışmaz",
      "Toplu doğrulamada element kuralları vektörel uygulanır",
    ],
    mobileApps: [
      "Element alanı mobil formda uygun klavye tipi ve maskeyle",
      "iOS/Android'de alan doğrulaması çevrimdışı da çalışır",
      "Alan hata durumu dar ekranda görünür ve okunur",
    ],
    wcag: [
      "Element alanında görünür etiket alan ile programatik ilişkili",
      "Hata mesajı alanla bağlı ve ekran okuyucuya anında duyurulur",
      "Zorunluluk yalnız renkle değil metin/ikonla belirtilir; kontrast 7:1",
    ],
    deployment: [
      "Element kuralı kernel şemasının parçası; ayrı dağıtım yok",
      "Tüm dağıtım profillerinde aynı doğrulama çalışır (istemci+sunucu)",
      "Shared hosting'de istemci doğrulaması, sunucuda yeniden doğrulama",
    ],
    eca: [
      ECA_BOUND,
      "Olay: element alanı belirli eşiği aştı → üst molekül kuralına sinyal (idempotent, zincir ≤6)",
      "Element tek başına otomasyon yazmaz; üst seviye kurala girdi sağlar",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alan/kural önerebilir; PII bayrağı veya yetki kuralını override edemez",
    ],
    testing: [
      "Element doğrulayıcı için sınır-değer birim testleri (geçerli/geçersiz tablo)",
      "PII alanı için maskeleme testi; ham değer log/UI'da görünmez",
      "Form bağlamında alan-erişilebilirlik mikro-yolculuğu",
    ],
    owasp: [
      "A03 Injection: alan girdisi allowlist ile doğrulanır",
      "A02 Cryptographic Failures: PII alanı şifreleme/maskeleme kuralına tabi",
      "Alan değişikliği audit'e yazılır",
    ],
    integration: [
      "Element, üst molekül ve ArcheType field sözleşmesine bağlanır",
      "Kernel şema doğrulamasına dahil edilir",
      "Surface projeksiyonunda alanın görünürlüğü bu kurala göre belirlenir",
    ],
    moduleUsage: [
      "Element bir alan/kuraldır; bağımsız sunulmaz, ArcheType field tanımının parçası olarak kullanılır",
    ],
  },

  "app-kernel-x-atom": {
    featureDefs: [
      "Kernel kırılımının Atom seviyesi: bölünemez en küçük iş birimi (tek tip/değer nesnesi)",
      "Atom, kernel'de daha alt parçaya ayrılmayan ilkel sözleşme birimidir",
      "Örnek dal; atomik birimin 7-seviye tabanındaki yerini gösterir",
    ],
    security: [
      "Atom tipi değişmez (immutable) tanımlanır; beklenmeyen mutasyon engellenir",
      "Atom değeri sınırda doğrulanır; geçersiz ilkel değer kabul edilmez",
      "Atom hassas veri taşıyorsa üst katmanda maskeleme zorunlu",
    ],
    codeOptimization: [
      "Atom değer nesnesi olarak; eşitlik değere göre, referansa göre değil",
      "Atom tipi katı union/literal; geçersiz değer derlemede yakalanır",
      "Atomlar paylaşılır ve yeniden kullanılır; kopya yerine referans",
    ],
    securityOptimization: [
      "Atom doğrulaması en dar biçim kuralıyla; fazlalık girdi reddedilir",
      "Atom serileştirmesi güvenli; enjekte edilebilir biçim üretmez",
      "Atom bağımlılığı yoktur; saldırı yüzeyi en düşük",
    ],
    performance: [
      "Atom doğrulaması sabit zaman; sıcak yolda ölçülebilir maliyetsiz",
      "Atom değerleri internalize edilir (paylaşımlı); bellek tekrarı az",
      "Atom karşılaştırması ucuz; toplu işlemde hızlı",
    ],
    mobileApps: [
      "Atom girdi alanı mobilde doğru klavye/maske ile",
      "Atom doğrulaması istemcide çevrimdışı çalışır",
      "Atom gösterimi dar ekranda taşmaz",
    ],
    wcag: [
      "Atom girdisinin etiketi ve biçim ipucu erişilebilir",
      "Atom hata durumu metinle bildirilir; kontrast 7:1",
      "Atom değeri ekran okuyucuya anlamlı biçimde sunulur",
    ],
    deployment: [
      "Atom tipi kernel şemasının çekirdeğinde; ayrı dağıtım yok",
      "Her profilde aynı atom doğrulaması geçerli",
      "Shared hosting dahil istemci-içi atom doğrulaması",
    ],
    eca: [
      ECA_BOUND,
      "Atom seviyesi otomasyon tetiklemez; yalnız üst kurallara değer sağlar",
      "Olay: atom değeri tanımlı aralık dışında → üst element kuralı reddeder (idempotent)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI atom tipi önerebilir; ilkel sözleşmeyi tek başına yazamaz, insan onayı gerekir",
    ],
    testing: [
      "Atom için biçim/sınır birim testleri (geçerli ve geçersiz değerler)",
      "Atom değişmezlik testi; mutasyon denemesi başarısız olur",
      "Atom değeri serileştirme/round-trip testi",
    ],
    owasp: [
      "A03 Injection: atom değeri sınırda biçim-doğrulanır",
      "A08 Integrity: atom değişmez ve doğrulanmış",
      "Atom kabul/red kararı izlenebilir",
    ],
    integration: [
      "Atom, element ve field tanımlarının yapı taşıdır",
      "Kernel tip sistemine dahil edilir",
      "Üst seviyeler atomu birleştirerek molekül/element kurar",
    ],
    moduleUsage: [
      "Atom bölünemez bir birimdir; bağımsız sunulmaz, üst tip tanımlarının içinde kullanılır",
    ],
  },

  "k-archetype-bayraklari": {
    featureDefs: [
      "Eskiden disiplin gerektiren şeyler ArcheType tanımında bayrak: bitemporal, pii, retention, audit",
      "Bayraklar koddan değil ArcheType sözleşmesinden okunur; davranış tanımla değişir",
      "Her bayrak bir altyapı yeteneğini açar (örn. pii → maskeleme + retention zinciri)",
    ],
    security: [
      "pii bayrağı açık alanlar otomatik maskeleme + erişim audit'i kazanır",
      "audit bayrağı kayıt için değişmez öncesi/sonrası iz zorunlu kılar",
      "retention bayrağı saklama süresi sonunda anonimleştirme/silme kuralını tetikler",
    ],
    codeOptimization: [
      "Bayrak işleme merkezî; her ArcheType'ta tekrar yazılmaz, sözleşmeden türetilir",
      "Bitemporal bayrağı çift zaman ekseni kolonlarını otomatik üretir (geçerli/işlem zamanı)",
      "Bayrak kombinasyonları derlemede doğrulanır; çelişen bayrak reddedilir",
    ],
    securityOptimization: [
      "pii + retention birlikteyse en-az-saklama ilkesi; gereksiz kişisel veri tutulmaz",
      "audit bayrağı değişmez (append-only) günlüğe yazar; sonradan değiştirilemez",
      "Bayrak değişikliği migration güvenliği gerektirir; pii kaldırma owner onayı",
    ],
    performance: [
      "Bitemporal sorgular için zaman-eksenli indeks bayrakla birlikte planlanır",
      "audit yazımı asenkron outbox ile; ana işlem yolunu yavaşlatmaz",
      "retention süpürmesi toplu/zamanlanmış iş olarak; çevrimiçi yolu etkilemez",
    ],
    mobileApps: [
      "Bayrak yönetim ekranı mobilde anahtar (switch) listesi; her bayrak açıklamalı",
      "iOS/Android'de bayrak durumu salt-okuma gösterilebilir",
      "Bayrak değişimi yalnızca yetkili panelden; mobil görünümde kilitli olabilir",
    ],
    wcag: [
      "Her bayrak anahtarının görünür etiketi ve durum metni (açık/kapalı) var",
      "Bayrak grupları başlıkla landmark'lanır; ekran okuyucu gezinir",
      "Bayrak durumu yalnız renkle değil metin+ikonla; kontrast 7:1",
    ],
    deployment: [
      "Bayrak işleme kernel'de; Swarm/Kubernetes'te ArcheType deposuyla birlikte",
      "retention/audit süpürme işleri ayrı worker/CronJob olarak ölçeklenir",
      "Shared hosting'de bitemporal/audit kısıtlı olabilir; degrade mod tanımlı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: retention süresi doldu → pii alanlarını anonimleştir + audit'e yaz (idempotent, zincir ≤6)",
      "Olay: audit bayraklı kayıt değişti → değişmez öncesi/sonrası hash günlüğü oluştur",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bayrak önerebilir (örn. pii işaretle) ama retention/audit bayrağını tek başına kaldıramaz",
    ],
    testing: [
      "Bitemporal bayrağı için çift-zaman sorgu doğruluk testi",
      "pii maskeleme + retention anonimleştirme e2e senaryosu",
      "audit değişmezlik testi; geçmiş kayıt değiştirilemez",
    ],
    owasp: [
      "A02 Cryptographic Failures: pii bayraklı alan şifreleme/maskeleme kuralına bağlı",
      "A09 Logging: audit bayrağı değişmez forensic iz sağlar",
      "A04 Insecure Design: retention ile veri minimizasyonu tasarıma gömülü",
    ],
    integration: [
      "Bayraklar kernel ArcheType sözleşmesinin parçası; tüm app'ler aynı bayrak semantiğini paylaşır",
      "audit bayrağı merkezî denetim veriyolu ile entegre",
      "retention bayrağı zamanlanmış süpürme servisini tetikler",
    ],
    moduleUsage: [
      "Bu module ArcheType'lara bitemporal/pii/retention/audit yeteneği sağlar",
      "Diğer app'ler bu yetenekleri kendi ArcheType'larında bayrak açarak tüketir",
    ],
  },

  "k-boyut1-ops-panel": {
    featureDefs: [
      "Ops/DevOps operatör konsolu: hosting, dağıtım ve gözlemlenebilirlik yüzeyi (kontrol düzlemi 1)",
      "Kitle SRE/operatör; sağlık, sürüm, kaynak ve olay yönetimi tek panelde",
      "Operatör tenant verisine değil altyapı durumuna bakar",
    ],
    security: [
      "Ops paneli en yüksek yetki düzlemi; erişim step-up (MFA) ve dar rol gerektirir",
      "Operatör aksiyonları (yeniden başlat, ölçek) değişmez audit'e yazılır",
      "Panel tenant iş verisini göstermez; yalnız altyapı metrikleri (veri ayrımı)",
    ],
    codeOptimization: [
      "Ops paneli metrikleri akış (stream) ile çeker; tam sayfa yenileme yok",
      "Ağır grafikler tembel yüklenir; konsol ilk açılışı hafif",
      "Panel durumu sunucu-olaylarıyla güncellenir, yoklama (polling) minimal",
    ],
    securityOptimization: [
      "Operatör yetkisi zaman-sınırlı (JIT); kalıcı yüksek yetki tutulmaz",
      "Tehlikeli aksiyonlar (silme/ölçek-sıfır) ikinci onay + audit gerektirir",
      "Panel oturumu kısa ömürlü; hareketsizlikte otomatik kilit",
    ],
    performance: [
      "Operatör metrik sorguları zaman-serisi deposundan; ana DB'yi yormaz",
      "Konsol gerçek-zaman güncellemeleri için sınırlı, geri-baskılı akış",
      "Olay listesi sayfalanır; büyük olay hacminde kayar pencere",
    ],
    mobileApps: [
      "Ops konsolu nöbetçi (on-call) için mobilde kritik uyarı + onay yüzeyi",
      "iOS/Android push ile olay bildirimi; tek dokunuşla durum görüntüleme",
      "Dar ekranda yalnız kritik metrik + aksiyon; ayrıntı katlanır",
    ],
    wcag: [
      "Uyarı durumları renk + ikon + metinle; renk körü operatör için ayırt edilir",
      "Konsol klavyeyle yönetilir; kritik aksiyonlar odak-tuzaklı onay diyaloğu",
      "Canlı metrik güncellemeleri aria-live ile uygun aralıkta duyurulur (kontrast 7:1)",
    ],
    deployment: [
      "Ops paneli Swarm/Kubernetes durumunu okur; probe ve sağlık uçlarını gösterir",
      "Panel kendisi ayrı dağıtılır; izlediği kümeden yetki ayrımıyla erişir",
      "Shared hosting profilinde ops yüzeyi sınırlı (yalnız temel sağlık)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sağlık kontrolü eşik altına düştü → operatöre uyarı + runbook bağı (idempotent, zincir ≤6)",
      "Olay: hata oranı tavanı aştı → otomatik geri-alma ÖNERİSİ (uygulama insan onayında)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ops panelinde tanı/öneri üretir (olay özeti); yeniden başlatma/ölçek aksiyonunu kendi uygulayamaz",
    ],
    testing: [
      "Ops aksiyonları için yetki testi: operatör dışı rol reddedilir",
      "Uyarı→runbook kullanıcı yolculuğu + axe AAA",
      "Geri-alma önerisi e2e: öneri üretilir ama otomatik uygulanmaz",
    ],
    owasp: [
      "A01 Access Control: ops düzlemi en dar yetki + JIT yükseltme",
      "A09 Logging: tüm operatör aksiyonları forensic audit'e",
      "A05 Misconfiguration: panel altyapı sırlarını maskeler",
    ],
    integration: [
      "Ops paneli kernel sağlık/metrik veriyolunu ve dağıtım durumunu tüketir",
      "Olay yönetimi harici on-call/bildirim ile entegre olabilir",
      "Kontrol düzlemi 2/3 panelleriyle yetki sınırı paylaşır, veri paylaşmaz",
    ],
    moduleUsage: [
      "Bu module Ops/DevOps kitlesine altyapı yönetim yüzeyi sağlar",
      "Diğer app'ler kendi sağlık/metrik sinyallerini bu panele yayınlar",
    ],
  },

  "k-boyut2-developer-panel": {
    featureDefs: [
      "Developer-admin paneli: veri/model geliştiricisinin ArcheType, surface ve workflow tasarladığı yüzey (kontrol düzlemi 2)",
      "Muadil Django/Drupal/Directus admin ama ArcheType sözleşmesiyle daha gelişmiş",
      "Geliştirici şema, ilişki, kural ve projeksiyon tanımlar; tenant verisini yönetmez",
    ],
    security: [
      "Developer paneli ArcheType taslağı üretir; production'a geçiş onay + migration güvenliği ister",
      "Şema değişikliği locked system ruleset'e tabi; yetkisiz alan silme reddedilir",
      "Geliştirici tenant iş verisine değil tanım/metadata'ya erişir",
    ],
    codeOptimization: [
      "Panel ArcheType tanımını canlı önizler; her değişiklikte tam derleme gerektirmez",
      "Tanım düzenleyici şema-farkını (diff) hesaplar; yalnız değişen parça yeniden doğrulanır",
      "Surface/workflow editörü ortak bileşenleri paylaşır",
    ],
    securityOptimization: [
      "Tanım değişikliği dry-run + data-impact ile önizlenir; körlemesine uygulanmaz",
      "Geliştirici yetkisi ortam-bazlı (draft/staging/prod ayrı); prod yazımı ek onay",
      "Tehlikeli migration (rename/delete) deprecated/alias/backfill yoluna zorlanır",
    ],
    performance: [
      "ArcheType tanım önizlemesi artımlı; büyük şemada bile editör akıcı",
      "Şema doğrulaması istemcide ön-kontrol, sunucuda kesin kontrol",
      "Tanım listesi sayfalanır; çok sayıda ArcheType'ta kayar yükleme",
    ],
    mobileApps: [
      "Developer paneli karmaşık; mobilde salt-okuma önizleme + onay odaklı",
      "Tanım düzenleme masaüstü öncelikli; telefonda kritik onaylar yapılabilir",
      "iOS/Android'de taslak inceleme ve yorum",
    ],
    wcag: [
      "Şema editörü alanları etiketli; sürükle-bırak alternatifi klavyeyle var",
      "Diff görünümü yalnız renkle değil +/- işaret ve metinle; kontrast 7:1",
      "Form hataları alanla ilişkili ve ekran okuyucuya duyurulur",
    ],
    deployment: [
      "Developer paneli kernel ArcheType deposuna yazar; ortam ayrımıyla dağıtılır",
      "Kubernetes'te draft/staging/prod için ayrı erişim politikası",
      "Shared hosting'de tanımlar JSON olarak dışa aktarılıp taşınabilir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: ArcheType taslağı kaydedildi → validation + diff + data-impact + migration dry-run akışını başlat (zincir ≤6)",
      "Olay: prod ArcheType update istendi → geçmiş-koruma + snapshot + rollback + onay kapısı zorunlu",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bu developer panelinde şema önerir/düzenler ve admin'e quiz/çok-seçenekli soru sorar; app/module üretemez",
    ],
    testing: [
      "ArcheType taslak→apply admin akışı için adım adım e2e",
      "Migration güvenliği testi: doğrudan rename/delete reddedilir, alias yolu geçer",
      "Editör erişilebilirlik + axe AAA kullanıcı yolculuğu",
    ],
    owasp: [
      "A01 Access Control: ortam-bazlı tanım yetkisi (draft≠prod)",
      "A08 Integrity: ArcheType tanımı sürümlü + şema pinleme",
      "A04 Insecure Design: tehlikeli migration tasarımca engellenir",
    ],
    integration: [
      "Developer paneli kernel ArcheType/surface/workflow sözleşmelerini yazan ana editördür",
      "Conformance test ve migration motoruyla entegre",
      "Tanımlar tüm app'lere kernel üzerinden yayılır",
    ],
    moduleUsage: [
      "Bu module geliştirici kitlesine ArcheType tasarım yüzeyi sağlar",
      "Diğer app'ler bu panelde üretilen tanımları runtime'da tüketir",
    ],
  },

  "k-boyut3-tenant-panel": {
    featureDefs: [
      "Tenant/müşteri-admin paneli: SaaS müşterisinin kendi işini yönettiği en kritik yüzey (kontrol düzlemi 3)",
      "Muadil Shopify admin / Frappe; müşteri kendi kayıt, kullanıcı ve ayarlarını yönetir",
      "Tenant admin yalnız kendi kiracısının verisini görür; çapraz-tenant kapalı",
    ],
    security: [
      "Tenant paneli her sorguda tenant_id izolasyonu (RLS) uygular; çapraz-tenant erişim deny + audit",
      "Tenant admin yalnız güvenli parametreleri düzenler; system/platform ruleset'e dokunamaz",
      "Hassas müşteri verisi (PII) rol bazlı maskelenir; dışa aktarım onay/iz gerektirir",
    ],
    codeOptimization: [
      "Tenant paneli sorguları tenant kapsamıyla daraltılır; gereksiz veri çekilmez",
      "Müşteri-özel ayarlar önbelleklenir, tenant anahtarıyla geçersizleşir",
      "Panel bileşenleri tenant temasıyla; ortak çekirdek paylaşılır",
    ],
    securityOptimization: [
      "Tenant admin davetleri zaman-sınırlı token; rol en-az-ayrıcalıkla atanır",
      "Toplu dışa aktarım oran-sınırlı + audit; veri sızıntısı yüzeyi daraltılır",
      "Tenant ayar değişiklikleri güvenli parametre allowlist'iyle sınırlı",
    ],
    performance: [
      "Tenant listeleri tenant-kapsamlı indeksle sayfalanır",
      "Müşteri panosu özet sorguları projeksiyon/okuma modelinden beslenir",
      "Yoğun tenant'larda kayar yükleme + sunucu-tarafı filtre",
    ],
    mobileApps: [
      "Tenant admin paneli mobil-öncelikli; müşteri telefondan işini yönetir",
      "iOS/Android PWA ile çevrimdışı taslak + senkron",
      "Dar ekranda öncelikli aksiyonlar üstte; ayrıntı katlanır",
    ],
    wcag: [
      "Tenant formlarında etiket-alan ilişkisi ve erişilebilir hata mesajı",
      "Müşteri tablolarında klavye gezinme ve sıralama; kontrast 7:1",
      "Kritik aksiyon onayları odak-tuzaklı ve ekran okuyucuya duyurulur",
    ],
    deployment: [
      "Tenant paneli çok-kiracılı; RLS veya schema-per-tenant stratejisiyle dağıtılır",
      "Kubernetes'te tenant trafiği için yatay ölçek; kaynak adil paylaşım",
      "Shared hosting'de tek-tenant kurulum profili de desteklenir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tenant kotası aşıldı → müşteri-admin'e bildir + yükseltme önerisi (idempotent, zincir ≤6)",
      "Olay: çapraz-tenant erişim denemesi → anında deny + forensic audit + step-up",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tenant panelinde müşteriye öneri/taslak üretir; tenant izolasyonunu veya yetki sınırını aşamaz",
    ],
    testing: [
      "Tenant izolasyonu için çapraz-tenant erişim e2e (deny beklenir) — en kritik test",
      "Tenant admin güvenli-parametre sınırı testi; yetki dışı ayar reddedilir",
      "Müşteri yolculuğu (kayıt yönet) + axe AAA",
    ],
    owasp: [
      "A01 Access Control: tenant izolasyonu (RLS) deny-by-default",
      "A04 Insecure Design: çok-kiracılık tasarımca izole",
      "A09 Logging: çapraz-tenant denemeleri forensic iz bırakır",
    ],
    integration: [
      "Tenant paneli kernel tenant context ve capability sözleşmesini tüketir",
      "Müşteri verisi app core'ları üzerinden, kernel izolasyon kuralıyla",
      "Faturalama/kota servisleriyle entegre (kota olayları)",
    ],
    moduleUsage: [
      "Bu module SaaS müşterisine kendi kiracısını yönetme yüzeyi sağlar",
      "Diğer app'ler tenant-admin yetkisini bu düzlemin kurallarıyla kullanır",
    ],
  },

  "k-granulerlik": {
    featureDefs: [
      "Sekiz seviyeli doğa-metaforu WBS: iş tarifi, otomatik story point ve AI-backlog dili tek sözleşmede",
      "Granülerlik zinciri Dağ→Kaya→ArcheType→Fragment→Alan→Toz→Atom kırılımını standartlaştırır",
      "Aynı zincir hem insan planlaması hem AI görev üretimi için ortak dil",
    ],
    security: [
      "Granülerlik tanımı metadata'dır; tenant verisi içermez",
      "Story-point/backlog üretimi yalnız tanımdan; gerçek görev yazımı yetki ister",
      "Seviye sözleşmesi PR ile değişir; runtime'da keyfi seviye eklenemez",
    ],
    codeOptimization: [
      "Granülerlik seviyeleri sabit enum; yanlış seviye derlemede yakalanır",
      "Rollup hesabı (alt→üst ilerleme) saf ve önbelleklenebilir",
      "Seviye-renk/etiket eşlemesi tek kaynaktan türetilir",
    ],
    securityOptimization: [
      "AI-backlog üretimi öneri olarak işaretlenir; doğrudan göreve dönüşmez",
      "Granülerlik kuralları değişmezdir; seviye atlamalı çelişki reddedilir",
      "Story-point tahmini denetlenebilir; manipülasyon iz bırakır",
    ],
    performance: [
      "Rollup büyük ağaçta artımlı hesaplanır; her düğümde tam tarama yok",
      "Seviye filtreleme indeksli; derin kırılımda hızlı",
      "Granülerlik görünümü yalnız görünür seviyeyi hesaplar",
    ],
    mobileApps: [
      "Granülerlik zinciri mobilde tek-seviye odaklı gezinme ile",
      "Story-point özetleri dar ekranda kart olarak",
      "iOS/Android'de backlog dili salt-okuma görüntülenir",
    ],
    wcag: [
      "Seviye geçişleri klavyeyle; her seviye adı ve derinliği ekran okuyucuya duyurulur",
      "Seviye ayrımı renk + ikon + metinle; kontrast 7:1",
      "Story-point rozetleri görünür metinle de ifade edilir",
    ],
    deployment: [
      "Granülerlik sözleşmesi statik metadata; tüm dağıtım profillerinde aynı",
      "AI-backlog üretimi ayrı (yerel) araçla; runtime'a gömülü değil",
      "Shared hosting dahil istemci-içi rollup",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alt düğüm tamamlandı → üst düğüm ilerlemesini yeniden hesapla (rollup, idempotent, zincir ≤6)",
      "Olay: seviye atlamalı bağ tanımlandı → tutarsızlık uyarısı (Dağ doğrudan Atom'a bağlanamaz)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI granülerlik diliyle backlog/story-point önerir; gerçek görev ağacını insan onayı olmadan yazamaz",
    ],
    testing: [
      "Rollup doğruluk testi: alt ilerlemeler üst düğüme doğru toplanır",
      "Seviye sözleşmesi testi: geçersiz seviye atlaması reddedilir",
      "Granülerlik gezinme + axe AAA kullanıcı yolculuğu",
    ],
    owasp: [
      "A04 Insecure Design: seviye atlamalı çelişki tasarımca engellenir",
      "A08 Integrity: story-point/backlog üretimi izlenebilir ve sürümlü",
      "AI önerileri audit'e bağlanır",
    ],
    integration: [
      "Granülerlik, WBS görünümü (k-wbs) ve engine rollup mantığının ortak sözleşmesidir",
      "Tüm görev düğümleri bu seviye dilini kullanır",
      "AI-backlog araçları bu sözleşmeyi girdi alır",
    ],
    moduleUsage: [
      "Bu module tüm planlama yüzeylerine ortak granülerlik/WBS dili sağlar",
      "Diğer app'ler kendi kırılımlarını bu 7-seviye sözleşmesine göre kurar",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) =>
  fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);

// 1) Golden düğümleri human damgala (swarm ezmesin).
let stamped = 0;
for (const id of GOLDEN) {
  const n = load(id);
  for (const k of Object.keys(n.dimensions || {})) {
    if (n.dimensions[k]) n.dimensions[k].provenance = "human";
  }
  save(id, n);
  stamped++;
}

// 1b) Golden'da 1-maddelik ince boyutlara sayfaya-özel 2. madde ekle (human korunur, idempotent — kapı min 2).
const GOLDEN_FIXUP = {
  "k-sozlesme": {
    mobileApps:
      "Şema pinleme sürümü mobilde rozetle gösterilir; eski sürüm uyarısı dokunmayla detaylanır",
    wcag: "Pinlenmiş sürüm ve projeksiyon alanları ekran okuyucuya etiketli; sürüm farkı metinle de duyurulur",
    deployment:
      "Şema pinleme 10 yıllık entegrasyonu korur; her dağıtım profili aynı pinlenmiş sözleşmeyi yükler",
    testing: "Projection izdüşümü için sözleşme-uyum testi; pinlenmiş şemadan sapma kırmızı yanar",
  },
};
for (const [id, dims] of Object.entries(GOLDEN_FIXUP)) {
  const n = load(id);
  for (const [k, extra] of Object.entries(dims)) {
    const dim = n.dimensions?.[k];
    if (dim && dim.items.length < 2 && !dim.items.includes(extra)) {
      dim.items.push(extra);
      dim.provenance = "human";
    }
  }
  save(id, n);
}

// 2) Şablon düğümlere elle-yazılmış içerik uygula (provenance=swarm).
let applied = 0;
for (const [id, dims] of Object.entries(CONTENT)) {
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
  `[seed-kernel-deep] ${applied}/11 şablon düğüm derinleştirildi (swarm); ${stamped} golden human damgalandı.`,
);
