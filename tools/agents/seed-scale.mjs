#!/usr/bin/env node
/**
 * seed-scale — Faz B4 (Cowork tek-ajan). scale kümesinin 19 ŞABLON düğümüne ELLE yazılmış,
 * desene-özel 14 boyut içeriği uygular (provenance="swarm"). Backend ölçek primitifleri.
 * Doğrula: node tools/agents/check-content.mjs scale  (+ npm run typecheck)
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
  "app-scale": {
    featureDefs: [
      "Scale Primitifleri ürün ailesi: önbellek, kuyruk, outbox, saga, CQRS, rate-limit gibi ölçek desenleri",
      "Her primitif yeniden kullanılabilir altyapı yeteneği; app'ler bunları bayrakla açar",
      "Dayanıklılık, tutarlılık ve yüksek hacim için ortak desen kütüphanesi",
    ],
    security: [
      "Ölçek primitifleri tenant-izolasyonu korur; kuyruk/önbellek anahtarı tenant-kapsamlı",
      "Mesaj yükü doğrulanır; zehirli mesaj (poison) karantinaya",
      "Altyapı erişimi ops düzlemi yetkisiyle; değişiklik izli",
    ],
    codeOptimization: [
      "Primitifler bildirimsel yapılandırılır; uygulama kodu altyapıya sızmaz",
      "Idempotency ve yeniden-deneme desenleri tek kaynaktan",
      "Geri-baskı (backpressure) varsayılan; kaynak tükenmesi önlenir",
    ],
    securityOptimization: [
      "Tüm tetik zincirleri loop-breaker (maks 6) ile korunur",
      "Rate-limit ve kota suistimali sınırlar",
      "Mesaj imzası/şema doğrulaması ile bütünlük",
    ],
    performance: [
      "Yüksek hacim için yatay ölçek; primitifler durum-bilgisiz tasarlanır",
      "Sıcak yol önbellekli; soğuk yol asenkron kuyrukta",
      "Gecikme ve throughput bütçeleri her primitif için izlenir",
    ],
    mobileApps: [
      "Ölçek primitifleri backend'dir; yönetim/izleme yüzeyi mobilde salt-okuma",
      "iOS/Android push ile kuyruk birikme/gecikme uyarısı",
      "Dar ekranda primitif sağlık özeti",
    ],
    wcag: [
      "İzleme panoları klavye+okuyucu erişimli; durum metinle",
      "Sağlık/hata göstergesi renk dışında ikon+metinle; kontrast 7:1",
      "Grafiklere veri tablosu alternatifi",
    ],
    deployment: [
      "Primitifler Swarm/Kubernetes'te ayrı ölçeklenir; kuyruk/önbellek yönetilen servis",
      "Sağlık/hazırlık kontrolleriyle dayanıklı dağıtım",
      "Shared hosting'de çoğu primitif degrade (tek-düğüm, zamanlanmış)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kuyruk birikti/gecikme arttı → ops uyarısı + ölçek önerisi (idempotent, zincir ≤6)",
      "Olay: zehirli mesaj → karantinaya al + yeniden-deneme durdur (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ölçek/kapasite önerisi ve anomali tespiti üretir; altyapı yapılandırmasını insan onayı olmadan değiştiremez",
    ],
    testing: [
      "Her primitif için idempotency ve yeniden-deneme testi",
      "Yük/dayanıklılık (chaos) testi; geri-baskı doğru çalışır",
      "Zehirli mesaj karantina kullanıcı/operasyon yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: geri-baskı ve loop-breaker tasarımca",
      "A05 Misconfiguration: primitif güvenli varsayılanlar",
      "A09 Logging: altyapı olayları izlenir",
    ],
    integration: [
      "Scale primitifleri tüm app'lere dayanıklılık/ölçek yeteneği sağlar",
      "Kernel ve layer1 yetenekleri bu primitifleri kullanır",
      "Gözlemlenebilirlik ile metrik/uyarı entegrasyonu",
    ],
    moduleUsage: [
      "Scale app'i tüm aileye ölçek/dayanıklılık primitiflerini sağlar",
      "Diğer app'ler kuyruk/outbox/saga gibi primitifleri bayrakla kullanır",
    ],
  },

  "scale-cache": {
    featureDefs: [
      "Önbellek (caching) katmanı: okuma-yoğun veriyi hızlandırma, desen + geçersizleştirme (invalidation)",
      "Cache-aside, write-through ve TTL stratejileri; tenant-kapsamlı anahtar",
      "Önbellek ısıtma (warm-up) ve damga (stampede) koruması",
    ],
    security: [
      "Önbellek anahtarı tenant_id ile kapsamlı; çapraz-tenant okuma engellenir",
      "Hassas veri önbellekte maskeli veya hiç tutulmaz",
      "Önbellek zehirlemesi (poisoning) için kaynak doğrulama",
    ],
    codeOptimization: [
      "Cache-aside deseni tek kaynaktan; uygulama kodu doğrudan store'a gitmez",
      "Geçersizleştirme olay-tetikli; yazma sonrası ilgili anahtar düşürülür",
      "Singleflight ile cache stampede önlenir",
    ],
    securityOptimization: [
      "TTL + sürüm anahtarı ile bayat veri sınırlı",
      "Önbellek doldurma oran-sınırlı (stampede koruması)",
      "Negatif önbellekleme kontrollü (DoS önleme)",
    ],
    performance: [
      "Okuma gecikmesi düşürülür; isabet oranı (hit ratio) izlenir",
      "Sıcak anahtarlar için yerel + dağıtık iki katman",
      "Geçersizleştirme dalgası kademeli yayılır",
    ],
    mobileApps: [
      "Önbellek backend; izleme panosu mobilde salt-okuma",
      "iOS/Android push ile düşük isabet oranı uyarısı",
      "Dar ekranda hit/miss özeti",
    ],
    wcag: [
      "Önbellek metrik panosu klavye+okuyucu erişimli",
      "İsabet/ıskalama renk dışında metinle; kontrast 7:1",
      "Grafiklere veri tablosu alternatifi",
    ],
    deployment: [
      "Yönetilen önbellek (Redis benzeri) ayrı servis; Kubernetes'te ölçek",
      "Çok-bölge için yerel önbellek + merkez geçersizleştirme",
      "Shared hosting'de süreç-içi önbellek (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kaynak veri değişti → ilgili önbellek anahtarını geçersizleştir (idempotent, zincir ≤6)",
      "Olay: isabet oranı düştü → ısıtma tetikle + ops uyarısı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI önbellek stratejisi/TTL önerir; önbellek yapılandırmasını kendisi prod'a alamaz",
    ],
    testing: [
      "Geçersizleştirme doğruluk testi (bayat veri dönmez)",
      "Stampede koruması (singleflight) testi",
      "Yük altında isabet oranı testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: stampede/negatif-cache DoS koruması",
      "A01 Access Control: tenant-kapsamlı anahtar",
      "A05 Misconfiguration: güvenli TTL varsayılanı",
    ],
    integration: [
      "Cache, okuma-yoğun ArcheType'ların önüne katman",
      "Geçersizleştirme outbox/olay veriyolundan tetiklenir",
      "İsabet metrikleri gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Caching (orta taş) Scale app'inde okuma hızlandırma yeteneğini sağlar",
      "Tüm okuma-yoğun app'ler önbellek desenini bayrakla kullanır",
    ],
  },

  "scale-outbox": {
    featureDefs: [
      "Transactional Outbox: veritabanı işlemiyle atomik olay yayını; en-az-bir-kez teslim",
      "Olay tablosu + relay; çift-yazım (dual-write) sorununu çözer",
      "Sıralı ve idempotent tüketim için olay kimliği",
    ],
    security: [
      "Outbox olayları tenant-etiketli; yük doğrulanır",
      "Relay kimliği dar yetki; olay içeriği şemaya uyar",
      "Hassas yük maskeli yayınlanır",
    ],
    codeOptimization: [
      "Olay aynı transaction'da yazılır; ayrı yayın yoktur (atomiklik)",
      "Relay polling/CDC ile; yayınlanan işaretlenir",
      "Olay şeması sürümlü",
    ],
    securityOptimization: [
      "En-az-bir-kez + tüketicide idempotency → çift işlem yok",
      "Yayınlanamayan olay yeniden-deneme + ölü-mektup kuyruğu (DLQ)",
      "Relay oran-sınırlı; aşağı sistem korunur",
    ],
    performance: [
      "Relay toplu yayın; gecikme bütçesi izlenir",
      "Outbox tablosu temizleme (yayınlananlar arşiv)",
      "Yüksek hacimde bölümleme",
    ],
    mobileApps: [
      "Outbox backend; gecikme/DLQ izleme mobilde salt-okuma",
      "iOS/Android push ile DLQ birikme uyarısı",
      "Dar ekranda yayın gecikme özeti",
    ],
    wcag: [
      "Outbox/DLQ panosu klavye+okuyucu erişimli",
      "Durum renk dışında metin+ikonla; kontrast 7:1",
      "DLQ olay detayı yapılandırılmış",
    ],
    deployment: [
      "Relay ayrı worker; sağlık ve gecikme izlenir",
      "Çok-bölge için bölge-yerel outbox",
      "Shared hosting'de zamanlanmış relay (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: işlem commit oldu → outbox olayını relay yayınlar (en-az-bir-kez, idempotent, zincir ≤6)",
      "Olay: yayın tekrar tekrar başarısız → DLQ'ya al + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI DLQ kök-neden analizi önerir; outbox relay yapılandırmasını kendisi değiştiremez",
    ],
    testing: [
      "Atomiklik testi (olay ve veri birlikte ya hep ya hiç)",
      "En-az-bir-kez + tüketici idempotency testi (çift işlem yok)",
      "DLQ ve yeniden-deneme testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: dual-write sorunu tasarımca çözülür",
      "A08 Integrity: olay şeması sürümlü ve doğrulanır",
      "A09 Logging: yayın/DLQ kararları izlenir",
    ],
    integration: [
      "Outbox, durum değiştiren tüm ArcheType'ların olay yayını omurgası",
      "Tüketiciler (projeksiyon, webhook, arama) outbox'tan beslenir",
      "DLQ gözlemlenebilirlikle izlenir",
    ],
    moduleUsage: [
      "Transactional Outbox (orta taş) Scale app'inde güvenilir olay yayınını sağlar",
      "Olay yayan tüm app'ler bu deseni kullanır",
    ],
  },

  "scale-saga": {
    featureDefs: [
      "Saga + Telafi (compensation): dağıtık işlemi adımlara böler, başarısızlıkta geri-alır",
      "Orkestrasyon/koreografi modları; uzun-süren iş akışı",
      "Her adımın telafi (rollback) eylemi tanımlı",
    ],
    security: [
      "Saga durumu tenant-izole; adım yetkileri kontrollü",
      "Telafi eylemleri yetkili ve izli",
      "Adım yükü doğrulanır",
    ],
    codeOptimization: [
      "Saga durum makinesi açık; her adım + telafi tanımlı",
      "Idempotent adımlar; tekrar çalıştırmada güvenli",
      "Orkestratör durumu kalıcı (durable)",
    ],
    securityOptimization: [
      "Telafi her zaman mümkün; tamamlanamayan saga güvenli durur",
      "Adım zaman-aşımı + loop-breaker (maks 6)",
      "Kısmi başarı tutarlı sonlandırılır (ya tamam ya telafi)",
    ],
    performance: [
      "Uzun-süren saga asenkron; adımlar paralel olabilir",
      "Durum kalıcılığı verimli; bekleyen saga ölçeklenir",
      "Adım gecikmesi izlenir",
    ],
    mobileApps: [
      "Saga durumu izleme mobilde salt-okuma",
      "iOS/Android push ile başarısız/telafi bildirimi",
      "Dar ekranda saga adım ilerlemesi",
    ],
    wcag: [
      "Saga adım çizelgesi klavye+okuyucu erişimli",
      "Adım durumu (tamam/telafi/bekliyor) renk dışında metinle; kontrast 7:1",
      "Hata detayı yapılandırılmış",
    ],
    deployment: [
      "Orkestratör dayanıklı worker; durum kalıcı depoda",
      "Adım servisleri bağımsız ölçek",
      "Shared hosting'de basit/kısa saga (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: saga adımı başarısız → önceki adımların telafisini çalıştır (idempotent, zincir ≤6)",
      "Olay: adım zaman-aşımı → yeniden-dene veya telafi + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI saga tasarımı/telafi önerir; çalışan saga durumunu kendisi değiştiremez",
    ],
    testing: [
      "Telafi doğruluk testi (başarısızlıkta tutarlı geri-alma)",
      "Adım idempotency ve zaman-aşımı testi",
      "Uzun-süren saga uçtan uca testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: telafi ile tutarlılık garantisi",
      "A08 Integrity: saga durumu kalıcı ve izli",
      "A09 Logging: adım/telafi kararları iz",
    ],
    integration: [
      "Saga, çok-servisli iş akışlarını (sipariş→ödeme→sevkiyat) koordine eder",
      "Outbox/olay veriyolu ile adımları tetikler",
      "Durum gözlemlenebilirlikle izlenir",
    ],
    moduleUsage: [
      "Saga (orta taş) Scale app'inde dağıtık işlem tutarlılığını sağlar",
      "Çok-adımlı süreç içeren app'ler saga desenini kullanır",
    ],
  },

  "scale-projections": {
    featureDefs: [
      "CQRS Projeksiyonları: olaylardan materyalize okuma modelleri; yazma/okuma ayrımı",
      "Olay akışından türetilen, sorguya optimize görünümler",
      "Yeniden-oynatma (replay) ile projeksiyon yeniden kurma",
    ],
    security: [
      "Projeksiyon tenant-izole; okuma yetkisi rol bazlı",
      "Olay kaynağı doğrulanır; projeksiyon salt-türetilmiş",
      "Hassas alan projeksiyonda maskeli",
    ],
    codeOptimization: [
      "Projeksiyon olaylardan saf türetilir; durum yan-kanaldan gelmez",
      "Artımlı güncelleme; olay başına idempotent işleme",
      "Replay ile şema değişiminde yeniden kurma",
    ],
    securityOptimization: [
      "Projeksiyon yeniden-kurulabilir (kaynak olaylar değişmez)",
      "Geç kalan projeksiyon (lag) izlenir; tutarlılık penceresi açık",
      "Yetkisiz okuma engellenir (RLS projeksiyona da uygulanır)",
    ],
    performance: [
      "Okuma sorguları projeksiyondan; yazma yolundan ayrık, hızlı",
      "Projeksiyon güncelleme akış-temelli; lag bütçesi",
      "Replay paralel/parçalı",
    ],
    mobileApps: [
      "Projeksiyon okuma modeli; mobil sorgular hızlı yanıtlanır",
      "iOS/Android'de düşük gecikmeli liste/pano",
      "Lag uyarısı (eventual consistency) gösterilebilir",
    ],
    wcag: [
      "Projeksiyon-temelli listeler klavye+okuyucu erişimli",
      "Tutarlılık/lag durumu metinle bildirilir; kontrast 7:1",
      "Veri tablosu erişilebilir",
    ],
    deployment: [
      "Projeksiyon işleyici ayrı worker; replay ayrı iş",
      "Okuma modeli ölçeklenebilir depoda",
      "Shared hosting'de senkron projeksiyon (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alan olayı geldi → ilgili projeksiyonu artımlı güncelle (idempotent, zincir ≤6)",
      "Olay: projeksiyon lag eşiği aştı → uyar + gerekirse replay (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI projeksiyon tasarımı/sorgu önerir; projeksiyonu kendisi yeniden-kuramaz (replay insan onaylı)",
    ],
    testing: [
      "Projeksiyon idempotency testi (olay tekrarı çift saymaz)",
      "Replay ile yeniden-kurma doğruluk testi",
      "Lag/tutarlılık penceresi testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: projeksiyona RLS uygulanır",
      "A08 Integrity: projeksiyon kaynak olaylardan türetilir",
      "A09 Logging: replay/güncelleme kararları iz",
    ],
    integration: [
      "Projeksiyonlar, olay-kaynağından (event store/outbox) beslenir",
      "BI ve liste/arama yüzeyleri projeksiyonu tüketir",
      "Lag gözlemlenebilirlikle izlenir",
    ],
    moduleUsage: [
      "CQRS Projeksiyonları (orta taş) Scale app'inde okuma-modeli yeteneğini sağlar",
      "Okuma-yoğun ve raporlayan app'ler projeksiyon desenini kullanır",
    ],
  },

  "app-scale-x-stone": {
    featureDefs: [
      "Scale kırılımının Taş örneği: bir ölçek primitifinin alt-yetenek tarifi",
      "Taş, bir ölçek ArcheType'ı içindeki çalışabilir alt-yetenek",
      "Örnek dal; ölçek yeteneğinin granülerlikteki yeri",
    ],
    security: [
      "Alt-yetenek üst primitifin tenant izolasyonuna uyar",
      "Mesaj/girdi sınırda doğrulanır",
      "Hassas yük üst katmanda maskelenir",
    ],
    codeOptimization: [
      "Ölçek taşı saf/idempotent; durum-bilgisiz tasarlanır",
      "Üst primitifle tipli arayüz",
      "Tekrar eden mantık paylaşılan yardımcıya",
    ],
    securityOptimization: [
      "Loop-breaker (maks 6) ile zincir korunur",
      "Geri-baskı (backpressure) sınırda",
      "En az ayrıcalık",
    ],
    performance: [
      "Taş durum-bilgisiz; yatay ölçeklenir",
      "Çıktı serileştirilebilir, küçük",
      "Tembel başlatma",
    ],
    mobileApps: [
      "Yeteneğin izleme yüzeyi mobilde salt-okuma",
      "iOS/Android push ile sağlık uyarısı",
      "Dar ekranda metrik özeti",
    ],
    wcag: ["İzleme klavye+okuyucu erişimli", "Durum metinle; kontrast 7:1", "Hata yapılandırılmış"],
    deployment: [
      "Ölçek taşı üst primitifle dağıtılır ve ölçeklenir",
      "Sağlık kontrolleriyle dayanıklı",
      "Shared hosting'de degrade",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alt-yetenek hata/birikme → üst primitif akışına sinyal + uyarı (idempotent, zincir ≤6)",
      "Taş bağımsız otomasyon tutmaz; üst primitif kuralına bağlanır",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bu ölçek yeteneğinin tarifini önerebilir; üst primitif/app'i kendisi üretemez",
    ],
    testing: [
      "Ölçek taşı idempotency + geri-baskı testi",
      "Üst primitif entegrasyon testi",
      "Yük sınır mikro-testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: geri-baskı/loop-breaker",
      "A01 Access Control: en-az-ayrıcalık",
      "Olaylar izlenir",
    ],
    integration: [
      "Ölçek taşı üst primitife (ör. outbox/saga) tipli arayüzle bağlanır",
      "Olay veriyolunu tüketir/yayınlar",
      "Metrikler gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Ölçek taşı bir alt-yetenektir; bağımsız sunulmaz, üst primitif içinde kullanılır",
    ],
  },

  "app-scale-x-molecule": {
    featureDefs: [
      "Scale kırılımının Molekül örneği: birkaç ölçek kuralını birleştiren bileşen",
      "Molekül, ölçek alt-yeteneğinin çalışabilir en küçük bileşeni (ör. yeniden-deneme politikası)",
      "Örnek dal; ölçek bileşeninin granülerlikteki yeri",
    ],
    security: [
      "Molekül girdi doğrulamasını sınırda yapar",
      "Yalnız kapsamındaki kaynağa erişir",
      "Tenant bağlamına bağlı",
    ],
    codeOptimization: [
      "Ölçek molekülü saf; yeniden-deneme/backoff politikası açık",
      "Tipli arayüz",
      "Paylaşılan yardımcıya çıkarım",
    ],
    securityOptimization: [
      "Yeniden-deneme üst sınırı (maks 6) + jitter",
      "Geri-baskı bilinçli",
      "En az ayrıcalık",
    ],
    performance: [
      "Molekül durum-bilgisiz; ölçeklenir",
      "Önbelleklenebilir çıktı",
      "Tembel başlatma",
    ],
    mobileApps: [
      "İzleme yüzeyi mobilde salt-okuma",
      "iOS/Android push ile yeniden-deneme tükenme uyarısı",
      "Dar ekranda özet",
    ],
    wcag: [
      "İzleme klavye erişimli; durum metinle; kontrast 7:1",
      "Hata ilişkilendirilmiş",
      "Veri tablosu alternatifi",
    ],
    deployment: [
      "Molekül üst primitifle dağıtılır",
      "Üst yetenekle ölçek",
      "Shared hosting'de degrade",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeniden-deneme tükendi → DLQ/üst akışa sinyal (idempotent, zincir ≤6)",
      "Molekül üst seviye kurala bağlanır",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI politika (backoff/retry) önerir; üst primitif/app'i kendisi üretemez",
    ],
    testing: [
      "Yeniden-deneme/backoff doğruluk testi",
      "Üst yetenek entegrasyon testi",
      "Sınır mikro-testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: retry üst sınırı + jitter",
      "A01 Access Control: en-az-ayrıcalık",
      "İzlenir",
    ],
    integration: [
      "Molekül üst taş/primitife tipli arayüzle bağlanır",
      "Olay veriyolunu kullanır",
      "Metrikler gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Ölçek molekülü bir bileşendir; bağımsız sunulmaz, üst yetenek içinde kullanılır",
    ],
  },

  "app-scale-x-element": {
    featureDefs: [
      "Scale kırılımının Element örneği: tek bir ölçek alanı/kuralı (ör. yeniden-deneme sayısı)",
      "Element, ölçek sözleşmesindeki en küçük anlamlı alan/kural",
      "Örnek dal; ölçek alan kuralının granülerlikteki yeri",
    ],
    security: [
      "Yapılandırma alanı doğrulaması sunucuda; sınır değerleri zorlanır",
      "Yetkisiz yapılandırma değişimi reddi",
      "Alan değişimi izli",
    ],
    codeOptimization: [
      "Ölçek kuralı (eşik/sayı) saf doğrulayıcı",
      "Tip Zod ile; geçersiz değer reddi",
      "Tek kaynaktan",
    ],
    securityOptimization: [
      "Allowlist temelli; tehlikeli değer (sınırsız retry) reddi",
      "Maks 6 zorlanır",
      "Field-level yetki",
    ],
    performance: ["O(1) doğrulama", "Önbelleklenebilir", "Toplu doğrulama"],
    mobileApps: [
      "Yapılandırma alanı mobilde salt-okuma",
      "iOS/Android'de geçerli değer gösterimi",
      "Dar ekranda net",
    ],
    wcag: [
      "Alan etiketli; geçersiz değer metinle bildirilir; kontrast 7:1",
      "Hata alanla bağlı",
      "Okuyucuya anlamlı",
    ],
    deployment: [
      "Ölçek kuralı altyapı şemasının parçası",
      "Her profilde doğrulanır",
      "Shared hosting'de de geçerli",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yapılandırma alanı sınır dışı → üst molekül kuralı reddeder (idempotent, zincir ≤6)",
      "Element tek başına otomasyon yazmaz",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ölçek alanı/eşiği önerir; güvenlik sınırını (maks retry) kendisi gevşetemez",
    ],
    testing: [
      "Sınır-değer doğrulama testi (sınırsız retry reddi)",
      "Tip doğrulama testi",
      "Yapılandırma erişilebilirlik mikro-testi",
    ],
    owasp: [
      "A04 Insecure Design: tehlikeli yapılandırma reddi",
      "A05 Misconfiguration: güvenli sınır varsayılanı",
      "Değişiklik izli",
    ],
    integration: [
      "Element üst molekül ve primitif sözleşmesine bağlanır",
      "Altyapı şema doğrulamasına dahil",
      "Yapılandırma kontrol düzleminden",
    ],
    moduleUsage: [
      "Ölçek elementi bir alan/kuraldır; bağımsız sunulmaz, primitif yapılandırmasının parçası",
    ],
  },

  "app-scale-x-atom": {
    featureDefs: [
      "Scale kırılımının Atom örneği: bölünemez ölçek ilkeli (ör. idempotency anahtarı değer nesnesi)",
      "Atom, ölçek sözleşmesinin daha alt parçaya ayrılmayan ilkel birimi",
      "Örnek dal; ölçek atomunun granülerlik tabanındaki yeri",
    ],
    security: [
      "Ölçek atomu değişmez; mutasyon engellenir",
      "Değer sınırda doğrulanır (geçerli anahtar/sayaç)",
      "Hassas atom üst katmanda korunur",
    ],
    codeOptimization: [
      "Idempotency anahtarı/sayaç atomu değer nesnesi",
      "Sabit tip; geçersiz değer reddi",
      "Paylaşılır",
    ],
    securityOptimization: ["En dar biçim doğrulaması", "Güvenli serileştirme", "Bağımlılıksız"],
    performance: ["Sabit zaman doğrulama", "İnternalize değer", "Ucuz karşılaştırma"],
    mobileApps: ["Atom değeri mobilde özetli", "Offline doğrulanabilir", "Taşmaz"],
    wcag: ["Atom etiketli; hata metinle; kontrast 7:1", "Biçim ipuçlu", "Okuyucuya anlamlı"],
    deployment: [
      "Ölçek atom tipi şema çekirdeğinde",
      "Her profilde aynı doğrulama",
      "Shared hosting dahil",
    ],
    eca: [
      ECA_BOUND,
      "Atom otomasyon tetiklemez; üst kurallara değer sağlar",
      "Olay: anahtar/sayaç geçersiz → üst element reddeder (idempotent)",
    ],
    aiAgents: [AI_B1, AI_B2, "AI ölçek atom tipi önerebilir; ilkel sözleşmeyi tek başına yazamaz"],
    testing: ["Atom biçim/sınır testi", "Değişmezlik testi", "Serileştirme testi"],
    owasp: ["A03 Injection: değer biçim-doğrulanır", "A08 Integrity: atom değişmez", "İzlenebilir"],
    integration: [
      "Ölçek atomu element ve field tanımlarının yapı taşı",
      "Tip sistemine dahil",
      "Üst seviyeler birleştirir",
    ],
    moduleUsage: [
      "Ölçek atomu bölünemez birimdir; bağımsız sunulmaz, üst tip tanımlarında kullanılır",
    ],
  },

  "scale-counter": {
    featureDefs: [
      "Hot Counter: yüksek-yazımlı sayaç (görüntüleme/beğeni); parçalı (sharded) toplama",
      "Yaklaşık ve kesin sayım modları; periyodik birleştirme (flush)",
      "Aşırı-sıcak anahtar için shard dağıtımı",
    ],
    security: [
      "Sayaç anahtarı tenant-kapsamlı; çapraz-tenant artırım engellenir",
      "Sahte artırım (bot) oran-sınırlı",
      "Sayaç sıfırlama yetki+iz ister",
    ],
    codeOptimization: [
      "Yazım shard'lara dağıtılır; okuma shard toplamı",
      "Birleştirme asenkron; sıcak yol kilitlemesiz (atomic incr)",
      "Yaklaşık sayım için olasılıksal yapı (HLL) opsiyonu",
    ],
    securityOptimization: [
      "Artırım idempotent (event-id) ile çift sayım önlenir",
      "Sayaç taşması/negatif kontrolü",
      "Sıcak anahtar başına oran-sınırı (DoS önleme)",
    ],
    performance: [
      "Sharding ile yazım darboğazı (hot key) dağıtılır",
      "Okuma önbellekli; kesin sayım gerektiğinde birleştir",
      "Yüksek throughput hedefi izlenir",
    ],
    mobileApps: [
      "Sayaç backend; pano mobilde salt-okuma",
      "iOS/Android'de canlı sayaç gösterimi",
      "Dar ekranda sayaç özeti",
    ],
    wcag: [
      "Sayaç değeri metinle okunur; canlı güncelleme aria-live",
      "Trend renk dışında metinle; kontrast 7:1",
      "Pano klavye erişimli",
    ],
    deployment: [
      "Sayaç deposu (Redis benzeri) ayrı; shard'lar bölgelere dağılır",
      "Birleştirme worker'ı zamanlanmış",
      "Shared hosting'de tek-düğüm sayaç (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sayaç eşiği aştı (ör. viral) → ölçek/uyarı tetikle (idempotent, zincir ≤6)",
      "Olay: birleştirme zamanı → shard toplamını kalıcı sayaca yaz (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI sayaç anomalisi (bot artışı) işaretler; sayaç sıfırlama/yapılandırmayı kendisi yapamaz",
    ],
    testing: [
      "Eşzamanlı artırım doğruluk testi (kayıp sayım yok)",
      "Idempotent artırım testi (çift sayım yok)",
      "Sıcak anahtar yük testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: bot/DoS için oran-sınırı",
      "A01 Access Control: tenant-kapsamlı sayaç",
      "A09 Logging: sıfırlama kararları iz",
    ],
    integration: [
      "Counter, içerik/etkileşim ArcheType'larına sayım yeteneği verir",
      "Olay veriyolundan artırım tüketir",
      "Metrikler gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Hot Counter (orta taş) Scale app'inde yüksek-yazım sayaç yeteneğini sağlar",
      "İçerik, sosyal ve analitik app'ler sayacı kullanır",
    ],
  },

  "scale-gis": {
    featureDefs: [
      "PostGIS coğrafi veri: konum saklama, yakınlık/alan sorguları, rota ve coğrafi indeks",
      "Nokta/çokgen geometri, mesafe ve içinde-mi sorguları",
      "Coğrafi sınır (geofence) ve harita katmanları",
    ],
    security: [
      "Konum verisi tenant_id RLS; hassas konum (PII) maskeli/bulanıklaştırılır",
      "Coğrafi sorgu yetkisi rol bazlı",
      "Konum paylaşımı izinli (consent)",
    ],
    codeOptimization: [
      "Coğrafi sorgu GiST/SP-GiST indeksiyle; yakınlık hızlı",
      "Geometri tipleri tutarlı (SRID); dönüşüm tek noktada",
      "Karmaşık çokgen sorgusu sadeleştirme (simplify)",
    ],
    securityOptimization: [
      "Hassas konum kaba grid'e yuvarlanır (gizlilik)",
      "Coğrafi sorgu yarıçapı sınırlı (kötüye kullanım)",
      "Konum geçmişi saklama süresi sınırlı",
    ],
    performance: [
      "Coğrafi indeks ile yakınlık sorgusu düşük gecikme",
      "Yoğun bölge için grid önbellekleme",
      "Toplu coğrafi hesap asenkron",
    ],
    mobileApps: [
      "Mobilde konum tabanlı arama ve harita (en kritik kanal)",
      "iOS/Android GPS izni ve doğruluk yönetimi",
      "Dar ekranda harita + yakındakiler",
    ],
    wcag: [
      "Haritaya metin/liste alternatifi (yakındakiler tablosu)",
      "Konum işaretleri renk dışında etiketle; kontrast 7:1",
      "Harita kontrolleri klavye erişimli",
    ],
    deployment: [
      "PostGIS uzantılı PostgreSQL; coğrafi sorgu ayrı okuma-replikası",
      "Harita karoları (tiles) CDN'den",
      "Shared hosting'de PostGIS varsa temel sorgu, yoksa degrade",
    ],
    eca: [
      ECA_BOUND,
      "Olay: nesne geofence'e girdi/çıktı → bildirim/aksiyon tetikle (idempotent, zincir ≤6)",
      "Olay: konum hassas bölgede → maskele + erişim kısıtla (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI rota/konum optimizasyon önerir; konum verisi erişim kuralını kendisi gevşetemez",
    ],
    testing: [
      "Yakınlık/içinde-mi sorgu doğruluk testi",
      "Geofence tetik testi",
      "Konum gizlilik (bulanıklaştırma) testi; en çok 6 tur",
    ],
    owasp: [
      "LLM06/A02: hassas konum maskeleme",
      "A01 Access Control: coğrafi sorgu yetkisi",
      "A04 Insecure Design: yarıçap/sıklık sınırı",
    ],
    integration: [
      "GIS, saha (FSM), lojistik (TMS) ve emlak app'lerine coğrafi yetenek verir",
      "Harita sağlayıcı entegrasyonu",
      "Geofence olayları otomasyona",
    ],
    moduleUsage: [
      "PostGIS (orta taş) Scale app'inde coğrafi veri yeteneğini sağlar",
      "Lojistik, saha ve konum-temelli app'ler GIS'i kullanır",
    ],
  },

  "scale-idempotency": {
    featureDefs: [
      "Idempotency Keys: aynı isteğin tekrarında tek-sefer etki; güvenli yeniden-deneme",
      "İstemci anahtarı + sonuç önbelleği; çift işlemi engeller",
      "Anahtar yaşam süresi ve çakışma yönetimi",
    ],
    security: [
      "Idempotency anahtarı tenant-kapsamlı; çapraz-tenant tekrar engellenir",
      "Anahtar tahmin edilemez; çakışma güvenli yönetilir",
      "Saklanan sonuç hassas veri içermez (referans)",
    ],
    codeOptimization: [
      "Anahtar→sonuç eşlemesi; aynı anahtar aynı yanıtı döndürür",
      "İlk istek işlenirken kilit; eşzamanlı tekrar bekletilir",
      "Anahtar TTL ile temizlenir",
    ],
    securityOptimization: [
      "Eşzamanlı aynı anahtar yarışı güvenli (tek işlenir)",
      "Anahtar yeniden-kullanım farklı yükle reddedilir (çakışma)",
      "Yeniden-deneme güvenli (yan etki tekrarlanmaz)",
    ],
    performance: [
      "Anahtar arama O(1); sonuç önbellekli",
      "Kilit kısa ömürlü; darboğaz önlenir",
      "Temizleme zamanlanmış",
    ],
    mobileApps: [
      "Mobil istemci zayıf ağda güvenle yeniden gönderir (aynı anahtar)",
      "iOS/Android'de istek anahtarı yerel üretilir",
      "Çift işlem riski mobilde ortadan kalkar",
    ],
    wcag: [
      "Idempotency backend; ilgili hata mesajı (çakışma) erişilebilir",
      "Tekrar gönderim sonucu metinle bildirilir; kontrast 7:1",
      "Durum okuyucuya anlamlı",
    ],
    deployment: [
      "Anahtar deposu dağıtık; çok-bölge için bölge-yerel + senkron",
      "Kilit yönetimi dayanıklı",
      "Shared hosting'de DB-temelli idempotency (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: aynı idempotency anahtarıyla tekrar istek → önceki sonucu döndür, yeniden işleme (idempotent, zincir ≤6)",
      "Olay: anahtar çakışması (farklı yük) → reddet + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI idempotency kapsamı/TTL önerir; anahtar yönetimini kendisi değiştiremez",
    ],
    testing: [
      "Tekrar istek tek-etki testi (çift işlem yok)",
      "Eşzamanlı aynı anahtar yarış testi",
      "Çakışma (farklı yük, aynı anahtar) reddi testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: güvenli yeniden-deneme tasarımca",
      "A01 Access Control: tenant-kapsamlı anahtar",
      "A09 Logging: çakışma kararları iz",
    ],
    integration: [
      "Idempotency, ödeme/sipariş gibi yan-etkili API'lerin önünde katman",
      "Outbox/webhook tüketiminde tekrar koruması",
      "Tüm yazma API'leri bu deseni kullanabilir",
    ],
    moduleUsage: [
      "Idempotency Keys (orta taş) Scale app'inde güvenli yeniden-deneme sağlar",
      "Ödeme, sipariş ve webhook tüketen app'ler bu deseni kullanır",
    ],
  },

  "scale-multiregion": {
    featureDefs: [
      "Çok-bölge + Felaket Kurtarma (DR): coğrafi yedeklilik, yük dağıtımı ve failover",
      "Aktif-aktif/aktif-pasif topoloji; veri replikasyonu",
      "RPO/RTO hedefleri ve düzenli failover tatbikatı",
    ],
    security: [
      "Bölgeler-arası trafik şifreli; veri ikamet (residency) kuralına uyar",
      "Replikasyon kimlik bilgileri kasada",
      "Failover yetkili ve izli işlem",
    ],
    codeOptimization: [
      "Uygulama bölge-bilgisiz (stateless); durum replike depoda",
      "Çakışma çözümü (CRDT/son-yazan) açık",
      "Yönlendirme en yakın sağlıklı bölgeye",
    ],
    securityOptimization: [
      "Veri ikamet: belirli veri yalnız izinli bölgede",
      "Failover idempotent ve geri-alınabilir",
      "Replikasyon gecikmesi (lag) izlenir (split-brain önleme)",
    ],
    performance: [
      "Yönlendirme gecikmeyi düşürür (en yakın bölge)",
      "Replikasyon asenkron; kritik veri senkron opsiyon",
      "Failover RTO hedefiyle ölçülür",
    ],
    mobileApps: [
      "Mobil istemci en yakın bölgeye yönlendirilir (düşük gecikme)",
      "iOS/Android'de failover şeffaf (yeniden bağlanma)",
      "Bölge durumu gerekirse gösterilir",
    ],
    wcag: [
      "DR/bölge durum panosu klavye+okuyucu erişimli",
      "Bölge sağlığı renk dışında metin+ikonla; kontrast 7:1",
      "Failover onayı açık uyarılı",
    ],
    deployment: [
      "Çok-bölge Kubernetes/altyapı; global yük dengeleyici",
      "Veri replikasyonu yönetilen servis",
      "Shared hosting çok-bölge sağlamaz (degrade, tek-bölge)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: bölge sağlıksız → trafiği sağlıklı bölgeye yönlendir + uyar (idempotent, zincir ≤6)",
      "Olay: replikasyon lag eşiği aştı → senkron moda geç/uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kapasite/failover senaryosu önerir; failover'ı kendisi tetikleyemez (insan onaylı)",
    ],
    testing: [
      "Failover tatbikatı (RTO/RPO) testi",
      "Split-brain/çakışma çözümü testi",
      "Veri ikamet uyum testi; en çok 6 tur",
    ],
    owasp: [
      "A02 Cryptographic Failures: bölgeler-arası trafik şifreli",
      "A04 Insecure Design: split-brain önleme",
      "A09 Logging: failover kararları iz",
    ],
    integration: [
      "Multi-region, tüm durum-bilgili servislerin dağıtım topolojisini etkiler",
      "Veri katmanı replikasyonu ile",
      "Gözlemlenebilirlik bölge sağlığını izler",
    ],
    moduleUsage: [
      "Multi-region/DR (orta taş) Scale app'inde coğrafi dayanıklılığı sağlar",
      "Yüksek-erişilebilirlik gerektiren app'ler bu topolojiyi kullanır",
    ],
  },

  "scale-ratelimit": {
    featureDefs: [
      "Rate Limit + Kota: istek hızını ve kullanım kotasını sınırlama; adil paylaşım",
      "Token-bucket/sliding-window; tenant/kullanıcı/IP bazlı",
      "Aşım yanıtı (429) ve geri-çekilme (Retry-After)",
    ],
    security: [
      "Limit anahtarı tenant/kullanıcı bazlı; çapraz-tenant etki yok",
      "Kötüye kullanım/brute-force rate-limit ile sınırlanır",
      "Limit yapılandırması yetkili+izli",
    ],
    codeOptimization: [
      "Token-bucket sayacı atomik; dağıtık sayaç deposu",
      "Limit kontrolü ara katman (middleware); kodu kirletmez",
      "Sliding-window verimli (yaklaşık) sayım",
    ],
    securityOptimization: [
      "Aşımda 429 + Retry-After; istemci geri çekilir",
      "Limit deny-by-default güvenli varsayılan",
      "Adil paylaşım (tek tenant tüm kapasiteyi yutamaz)",
    ],
    performance: [
      "Limit kontrolü düşük ek-yük; dağıtık sayaç hızlı",
      "Sıcak limit anahtarı yerel önbellekli",
      "Aşağı sistem korunur (yük zirvesi düzlenir)",
    ],
    mobileApps: [
      "Mobil istemci 429'da Retry-After'a uyar (üstel geri-çekilme)",
      "iOS/Android'de kota durumu gösterilebilir",
      "Dar ekranda limit uyarısı net",
    ],
    wcag: [
      "Limit/kota uyarısı açık, eyleme dönük ve sesli; kontrast 7:1",
      "Kalan kota metinle bildirilir",
      "Yönetim ekranı klavye erişimli",
    ],
    deployment: [
      "Dağıtık limit sayacı (Redis benzeri); ara katman her serviste",
      "Global ve servis-bazlı limitler",
      "Shared hosting'de süreç-içi limit (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kota eşiği yaklaştı → kullanıcıya uyarı + yükseltme önerisi (idempotent, zincir ≤6)",
      "Olay: ani aşırı istek (saldırı) → sıkı limit + ops uyarısı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI anomali/limit önerisi üretir; limit yapılandırmasını veya AI kendi kotasını kendisi gevşetemez",
    ],
    testing: [
      "Limit doğruluk testi (aşımda 429)",
      "Adil paylaşım testi (tek tenant kapasiteyi yutmaz)",
      "Geri-çekilme (Retry-After) testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: brute-force/DoS limiti",
      "LLM10 Model DoS: AI çağrı limiti",
      "A09 Logging: aşım/saldırı olayları iz",
    ],
    integration: [
      "Rate-limit, tüm dış API'ler ve AI çağrılarının önünde katman",
      "Kota faturalama/abonelik planına bağlı",
      "Aşım olayları gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Rate Limit + Kota (orta taş) Scale app'inde adil-paylaşım ve koruma sağlar",
      "Tüm API ve AI tüketen app'ler limit desenini kullanır",
    ],
  },

  "scale-realtime": {
    featureDefs: [
      "Gerçek-zaman Backend: WebSocket + SSE ile canlı güncelleme, kanal/abonelik yönetimi",
      "Sunum (presence), yayın (broadcast) ve yetki-farkında kanal",
      "Yeniden bağlanma ve mesaj sırası garantisi",
    ],
    security: [
      "Kanal aboneliği yetki-farkında (tenant + rol); yetkisiz kanal reddi",
      "Mesaj yükü doğrulanır; injection engellenir",
      "Bağlantı kimlik-doğrulamalı; token yenileme",
    ],
    codeOptimization: [
      "Bağlantı durumu hafif; yayın fan-out verimli",
      "SSE basit tek-yön; WebSocket çift-yön için",
      "Mesaj sırası kanal başına korunur",
    ],
    securityOptimization: [
      "Kanal başına oran-sınırı (flood önleme)",
      "Yeniden bağlanmada kayıp mesaj telafisi (sıra numarası)",
      "Bağlantı sayısı kotası (DoS önleme)",
    ],
    performance: [
      "Yatay ölçek için yayın katmanı (pub/sub) arkada",
      "Bağlantı başına düşük bellek; çok-bağlantı ölçeği",
      "Geri-baskı: yavaş istemci yayını bloklamaz",
    ],
    mobileApps: [
      "Mobilde canlı bildirim/sohbet; arka planda bağlantı yönetimi",
      "iOS/Android ağ değişiminde otomatik yeniden bağlanma",
      "Pil dostu (gerektiğinde bağlan)",
    ],
    wcag: [
      "Canlı güncelleme aria-live ile uygun sıklıkta duyurulur",
      "Bağlantı durumu (canlı/kopuk) renk dışında metinle; kontrast 7:1",
      "Canlı içerik klavye erişilebilir",
    ],
    deployment: [
      "Gerçek-zaman katmanı yatay ölçek; pub/sub (Redis/NATS) arkada",
      "Yapışkan oturum veya durum-bilgisiz token",
      "Shared hosting'de SSE veya kısa-yoklama (WebSocket kısıtlı olabilir)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alan verisi değişti → ilgili kanal abonelerine yayınla (yetki-farkında, idempotent, zincir ≤6)",
      "Olay: yavaş istemci geride kaldı → mesaj birleştir/at + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kanal/yayın optimizasyonu önerir; kanal yetki kuralını kendisi değiştiremez",
    ],
    testing: [
      "Yetki-farkında abonelik testi (yetkisiz kanal mesaj almaz)",
      "Yeniden bağlanma + mesaj sırası testi",
      "Çok-bağlantı yük + geri-baskı testi; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: yetki-farkında kanal aboneliği",
      "A04 Insecure Design: flood/bağlantı kotası",
      "A03 Injection: mesaj yükü doğrulanır",
    ],
    integration: [
      "Realtime, sohbet/bildirim/canlı-pano yüzeylerini besler",
      "Outbox/olay veriyolundan yayın tetiklenir",
      "Sunum (presence) işbirliği app'lerinde",
    ],
    moduleUsage: [
      "Real-time Backend (orta taş) Scale app'inde canlı iletişim yeteneğini sağlar",
      "Sohbet, bildirim ve işbirliği app'leri gerçek-zaman kanalını kullanır",
    ],
  },

  "scale-streaming": {
    featureDefs: [
      "Streaming: Kafka benzeri olay akışı, gerçek-zaman toplama (aggregation) ve akış işleme",
      "Konu (topic)/bölüm (partition), tüketici grubu ve pencere (windowing)",
      "Tam-bir-kez/en-az-bir-kez işleme semantiği",
    ],
    security: [
      "Konu erişimi tenant/rol bazlı; yük şema-doğrulamalı",
      "Akış kimlik bilgileri kasada",
      "Hassas alan akışta maskeli",
    ],
    codeOptimization: [
      "Akış işleme durum-bilgisi checkpoint'li; yeniden başlatmada kaldığı yerden",
      "Pencere (windowing) toplama verimli",
      "Tüketici grubu ile paralel işleme",
    ],
    securityOptimization: [
      "Tam-bir-kez (exactly-once) veya en-az-bir-kez + idempotent tüketim",
      "Geride kalan tüketici (lag) izlenir",
      "Zehirli mesaj DLQ'ya",
    ],
    performance: [
      "Yüksek throughput; bölümleme ile paralellik",
      "Geri-baskı: tüketici hızına saygı",
      "Toplama penceresi gecikmesi izlenir",
    ],
    mobileApps: [
      "Streaming backend; toplama sonucu mobil panoda",
      "iOS/Android push ile akış-temelli uyarı",
      "Dar ekranda canlı metrik",
    ],
    wcag: [
      "Akış-temelli pano klavye+okuyucu erişimli; canlı aria-live",
      "Toplama sonucu metinle; kontrast 7:1",
      "Veri tablosu alternatifi",
    ],
    deployment: [
      "Akış platformu (Kafka benzeri) yönetilen; işleyici ayrı ölçek",
      "Checkpoint deposu dayanıklı",
      "Shared hosting akış sağlamaz (degrade, toplu işleme)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: akış toplaması eşiği aştı → uyarı/aksiyon tetikle (idempotent, zincir ≤6)",
      "Olay: tüketici lag arttı → ölçek önerisi + uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI akış toplama/anomali önerir; akış işleyiciyi kendisi prod'a alamaz",
    ],
    testing: [
      "Tam-bir-kez/idempotent işleme testi",
      "Checkpoint/yeniden başlatma testi",
      "Pencere toplama doğruluk testi; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: yük şema-doğrulamalı, işleme idempotent",
      "A01 Access Control: konu erişim yetkisi",
      "A09 Logging: işleme/lag kararları iz",
    ],
    integration: [
      "Streaming, yüksek-hacim olayları (IoT, tıklama) toplar",
      "Tahmin/BI gerçek-zaman akıştan beslenir",
      "Outbox akışa köprülenebilir",
    ],
    moduleUsage: [
      "Streaming (orta taş) Scale app'inde gerçek-zaman akış işlemeyi sağlar",
      "Analitik, IoT ve tahmin app'leri akışı kullanır",
    ],
  },

  "scale-timeseries": {
    featureDefs: [
      "Zaman-Serisi: IoT/metrik/sensör verisi için optimize saklama, downsampling ve sorgu",
      "Yüksek-yazım, zaman-pencereli toplama ve saklama politikası",
      "Sürekli sorgu (continuous aggregate) ve alarm",
    ],
    security: [
      "Zaman-serisi tenant-etiketli; cihaz kimliği doğrulanır",
      "Sensör verisi PII içeriyorsa korunur",
      "Yazım yetkisi cihaz/servis kimliğiyle",
    ],
    codeOptimization: [
      "Zaman-bazlı bölümleme (partition); eski veri sıkıştırılır",
      "Downsampling ile uzun-vade saklama",
      "Sürekli toplama önceden hesaplar",
    ],
    securityOptimization: [
      "Saklama politikası: ham veri TTL, toplanan uzun-vade",
      "Yüksek-kardinalite etiket sınırı (maliyet/DoS)",
      "Yazım oran-sınırlı (cihaz başına)",
    ],
    performance: [
      "Zaman-serisi deposu yüksek-yazım optimize",
      "Sorgu için downsample + indeks",
      "Toplama önceden hesaplanmış",
    ],
    mobileApps: [
      "Mobilde sensör/metrik canlı grafik",
      "iOS/Android push ile eşik-aşım alarmı",
      "Dar ekranda zaman-serisi özeti",
    ],
    wcag: [
      "Zaman-serisi grafiğine veri tablosu/metin alternatifi",
      "Alarm durumu renk dışında metin+ikonla; kontrast 7:1",
      "Zaman aralığı seçimi klavye erişimli",
    ],
    deployment: [
      "Zaman-serisi DB (Timescale benzeri); ingest ayrı ölçek",
      "Downsampling/saklama zamanlanmış iş",
      "Shared hosting'de sınırlı zaman-serisi (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: metrik eşiği aştı → alarm üret + aksiyon tetikle (idempotent, zincir ≤6)",
      "Olay: saklama süresi doldu → downsample + ham veri arşivle/sil (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI zaman-serisi anomali/tahmin önerir; saklama politikasını kendisi değiştiremez",
    ],
    testing: [
      "Toplama/downsampling doğruluk testi",
      "Yüksek-yazım yük testi",
      "Eşik alarm tetik testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: kardinalite/oran sınırı (DoS)",
      "A01 Access Control: cihaz/servis yazım yetkisi",
      "A09 Logging: alarm/saklama kararları iz",
    ],
    integration: [
      "Time-series, IoT ve gözlemlenebilirlik (metrik) verisini saklar",
      "Tahmin ve BI zaman-serisini tüketir",
      "Alarm bildirimine yayılır",
    ],
    moduleUsage: [
      "Time-Series (orta taş) Scale app'inde sensör/metrik saklama sağlar",
      "IoT, izleme ve analitik app'leri zaman-serisini kullanır",
    ],
  },

  "scale-webhook": {
    featureDefs: [
      "Giden Webhook: dış sisteme olay yollama; abonelik, imza, yeniden-deneme ve teslim takibi",
      "Olay filtresi, payload şablonu ve hedef yönetimi",
      "Teslim günlüğü ve ölü-mektup (DLQ)",
    ],
    security: [
      "Webhook hedefi allowlist/doğrulama (SSRF önleme)",
      "Payload imzalı (HMAC); alıcı doğrular",
      "Abonelik yetkisi tenant bazlı",
    ],
    codeOptimization: [
      "Teslim asenkron kuyruk; yeniden-deneme üstel geri-çekilme",
      "Payload şablonu bildirimsel",
      "İmza üretimi tek noktada",
    ],
    securityOptimization: [
      "SSRF: özel/iç IP'lere webhook reddi",
      "En-az-bir-kez teslim + alıcı idempotency",
      "Yeniden-deneme üst sınırı (maks 6) sonra DLQ",
    ],
    performance: [
      "Teslim paralel kuyruk; yavaş hedef diğerlerini bloklamaz",
      "Toplu/sıralı teslim opsiyonu",
      "Teslim gecikmesi izlenir",
    ],
    mobileApps: [
      "Webhook backend; teslim/DLQ izleme mobilde salt-okuma",
      "iOS/Android push ile teslim hatası uyarısı",
      "Dar ekranda hedef sağlık özeti",
    ],
    wcag: [
      "Teslim günlüğü/DLQ panosu klavye+okuyucu erişimli",
      "Teslim durumu renk dışında metinle; kontrast 7:1",
      "Hata detayı yapılandırılmış",
    ],
    deployment: [
      "Teslim worker'ı ayrı ölçek; oran-sınırlı (hedef başına)",
      "DLQ ve yeniden-gönderim yüzeyi",
      "Shared hosting'de zamanlanmış teslim (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: abone olunan iş olayı oldu → filtreye uyanları imzala + teslim et (idempotent, zincir ≤6)",
      "Olay: teslim tekrar başarısız → DLQ'ya al + aboneye uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI teslim hatası kök-neden önerir; webhook hedefi/imza yapılandırmasını kendisi değiştiremez",
    ],
    testing: [
      "İmza doğrulama + SSRF reddi testi",
      "Yeniden-deneme + DLQ testi",
      "En-az-bir-kez + idempotency testi; en çok 6 tur",
    ],
    owasp: [
      "A10 SSRF: hedef allowlist/iç-IP reddi",
      "A08 Integrity: payload HMAC imzası",
      "A09 Logging: teslim kararları iz",
    ],
    integration: [
      "Webhook, iş olaylarını dış sistemlere (entegrasyon) iletir",
      "Outbox/olay veriyolundan beslenir",
      "Teslim metrikleri gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Outbound Webhook (orta taş) Scale app'inde dış-sistem olay iletimini sağlar",
      "Entegrasyon ve bildirim gerektiren app'ler webhook'u kullanır",
    ],
  },

  "scale-workers": {
    featureDefs: [
      "Workers + Zamanlayıcı: arka plan işleri, kuyruk tüketimi ve zamanlanmış görevler",
      "İş önceliği, eşzamanlılık ve yeniden-deneme yönetimi",
      "İş durumu izleme ve manuel yeniden-çalıştırma",
    ],
    security: [
      "İş yükü tenant-etiketli; işçi en-az-ayrıcalıkla çalışır",
      "İş tetikleme yetkisi kontrollü",
      "Hassas iş verisi maskeli loglanır",
    ],
    codeOptimization: [
      "İşler idempotent; yeniden-çalıştırma güvenli",
      "Eşzamanlılık ve öncelik kuyruğu yapılandırılabilir",
      "Uzun iş parçalı/devam-edilebilir",
    ],
    securityOptimization: [
      "Yeniden-deneme üst sınırı (maks 6) + DLQ",
      "Zehirli iş karantinaya",
      "İş başına zaman-aşımı (kaynak koruması)",
    ],
    performance: [
      "İşçi havuzu yatay ölçek; kuyruk derinliği izlenir",
      "Öncelikli kuyruk ile kritik iş öne",
      "Geri-baskı: kuyruk dolunca üretici yavaşlar",
    ],
    mobileApps: [
      "İş durumu izleme mobilde salt-okuma",
      "iOS/Android push ile başarısız iş uyarısı",
      "Dar ekranda kuyruk sağlık özeti",
    ],
    wcag: [
      "İş kuyruğu panosu klavye+okuyucu erişimli",
      "İş durumu renk dışında metin+ikonla; kontrast 7:1",
      "Yeniden-çalıştır aksiyonu erişilebilir",
    ],
    deployment: [
      "İşçi havuzu Kubernetes'te ölçek (kuyruk derinliğine göre HPA)",
      "Zamanlayıcı dayanıklı; tekil tetik garantisi",
      "Shared hosting'de cron-temelli işler (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kuyruk derinliği arttı → işçi sayısını ölçekle/uyar (idempotent, zincir ≤6)",
      "Olay: iş tekrar başarısız → DLQ'ya al + sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI iş hatası kök-neden ve kapasite önerir; işi kendisi yeniden-çalıştıramaz (insan onaylı)",
    ],
    testing: [
      "İş idempotency ve yeniden-deneme testi",
      "Öncelik/eşzamanlılık doğruluk testi",
      "Kuyruk yük + DLQ testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: zaman-aşımı/retry sınırı",
      "A01 Access Control: iş tetikleme yetkisi",
      "A09 Logging: iş/DLQ kararları iz",
    ],
    integration: [
      "Workers, tüm asenkron işleri (e-posta, rapor, ETL) çalıştırır",
      "Kuyruk/zamanlayıcı diğer primitiflerle (outbox) entegre",
      "İş metrikleri gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Workers + Scheduler (orta taş) Scale app'inde arka-plan işleme sağlar",
      "Asenkron iş gerektiren tüm app'ler işçi havuzunu kullanır",
    ],
  },

  "scale-workers-deep": {
    featureDefs: [
      "Arka Plan İşleri (derin): cron, gecikmeli, tekrarlayan ve öncelikli iş desenleri",
      "Zamanlanmış (cron), gecikmeli (delay), tekrarlayan (recurring) iş tipleri",
      "İş zinciri, fan-out/fan-in ve iş grupları",
    ],
    security: [
      "İş tanımı tenant-etiketli; cron yetkisi kontrollü",
      "İş yükü doğrulanır; hassas veri maskeli",
      "Tekrarlayan iş kaçağı (runaway) sınırlı",
    ],
    codeOptimization: [
      "İş tipleri ortak arayüz; cron/delay/recurring tek soyutlama",
      "İş zinciri (chain) açık tanımlı; idempotent adımlar",
      "Fan-out/fan-in paralel + birleştirme",
    ],
    securityOptimization: [
      "Cron tekil tetik (dağıtık kilit); çift çalıştırma yok",
      "Tekrarlayan iş üst sınırı + loop-breaker",
      "Gecikmeli iş zaman-aşımı",
    ],
    performance: [
      "Öncelikli kuyruk; düşük-öncelik kritiği bloklamaz",
      "Fan-out paralel; birleştirme verimli",
      "Zamanlanmış iş dağıtık tetik",
    ],
    mobileApps: [
      "Zamanlanmış iş takvimi mobilde görüntülenir",
      "iOS/Android push ile başarısız cron uyarısı",
      "Dar ekranda iş zinciri durumu",
    ],
    wcag: [
      "İş zinciri/takvim klavye+okuyucu erişimli",
      "İş tipi/durumu renk dışında metinle; kontrast 7:1",
      "Yeniden-çalıştır erişilebilir",
    ],
    deployment: [
      "Zamanlayıcı dayanıklı (dağıtık kilit); işçiler ölçeklenir",
      "İş zinciri durumu kalıcı",
      "Shared hosting'de sistem cron'u (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: cron zamanı geldi → işi tekil tetikle (dağıtık kilit, idempotent, zincir ≤6)",
      "Olay: iş zinciri adımı başarısız → zinciri durdur + telafi/uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI zamanlama/iş-zinciri optimizasyonu önerir; cron/iş tanımını kendisi prod'a alamaz",
    ],
    testing: [
      "Cron tekil tetik (çift çalıştırma yok) testi",
      "İş zinciri/fan-in doğruluk testi",
      "Tekrarlayan iş runaway koruması testi; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: tekil tetik + runaway sınırı",
      "A01 Access Control: cron tanımı yetkisi",
      "A09 Logging: iş zinciri kararları iz",
    ],
    integration: [
      "Workers-deep, periyodik ve zincirli işleri (raporlama, hatırlatma) çalıştırır",
      "Workers/Scheduler primitifini derinleştirir",
      "İş metrikleri gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "Background Jobs (orta taş) Scale app'inde gelişmiş zamanlama desenlerini sağlar",
      "Periyodik/zincirli iş gerektiren app'ler bu desenleri kullanır",
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
    console.warn(`[seed-scale] atlandı (dosya yok): ${id}`);
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
  `[seed-scale] ${applied} ölçek düğümü derinleştirildi (swarm)${skipped ? `, ${skipped} atlandı` : ""}.`,
);
