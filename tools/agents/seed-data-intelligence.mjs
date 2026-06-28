#!/usr/bin/env node
/**
 * seed-data-intelligence — Faz B3 (Cowork tek-ajan, swarm yerine).
 * data-intelligence kümesinin 18 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği
 * uygular (provenance="swarm"). AI/veri alanı: aiAgents + OWASP LLM Top 10 derinliği vurgulu.
 * Doğrula: node tools/agents/check-content.mjs data-intelligence  (+ npm run typecheck)
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
  "app-data-intelligence": {
    featureDefs: [
      "Veri & Zeka (AI-first) ürün ailesi: ETL, BI, RAG, tahmin ve AI ajan yeteneklerini barındırır",
      "Veri yönetişimi (governance), lineage ve model yaşam döngüsü çekirdek",
      "Tüm AI yetenekleri ortak model kayıt ve gözlemlenebilirlik sözleşmesini paylaşır",
    ],
    security: [
      "Veri kümeleri tenant_id RLS; eğitim/çıkarım verisinde PII sınıflandırma + maskeleme",
      "Model erişimi rol bazlı; hassas veriye dayalı çıktı maskeleme",
      "Prompt/yanıt değişmez audit; veri soyağacı (lineage) izlenir",
    ],
    codeOptimization: [
      "Veri pipeline'ları bildirimsel (declarative); dönüşümler yeniden çalıştırılabilir",
      "Model çıkarımı toplu/akış; sıcak yol önbellekli embedding",
      "Özellik (feature) hesabı tek kaynaktan; eğitim/çıkarım tutarlı",
    ],
    securityOptimization: [
      "Prompt injection muhafızası tüm AI girdilerinde varsayılan açık",
      "Model/veri sürümleme ile tekrarlanabilirlik; sessiz model değişimi izlenir",
      "Çıkarım maliyeti oran-sınırlı; suistimal bütçe tavanıyla durur",
    ],
    performance: [
      "Vektör arama için ANN indeksi; gecikme bütçesi izlenir",
      "Çıkarım kuyruğu geri-baskılı; toplu istek birleştirme",
      "BI sorguları okuma-modeli/küp üzerinden",
    ],
    mobileApps: [
      "Mobilde AI sohbet ve BI özet panosu",
      "iOS/Android push ile anomali/tahmin uyarısı",
      "Dar ekranda model çıktısı okunur özetli",
    ],
    wcag: [
      "Grafik/dashboard için metin alternatifi ve veri tablosu (okuyucu)",
      "AI yanıtları akarken aria-live ile uygun aralıkta duyurulur; kontrast 7:1",
      "Sohbet arayüzü klavye erişimli ve adlandırılmış",
    ],
    deployment: [
      "Model çıkarımı ayrı GPU/CPU servisi; Kubernetes'te ayrı havuz",
      "Pipeline'lar zamanlanmış/olay-tetikli worker'lar",
      "Shared hosting'de yalnız hafif kural-temelli yetenekler (degrade)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni veri geldi → pipeline çalıştır + kalite kontrolü + indeks güncelle (idempotent, zincir ≤6)",
      "Olay: model çıktısı düşük güven → insan incelemesine yönlendir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI ajanları veri/model üzerinde öneri ve özet üretir; veri pipeline'ı veya model dağıtımını insan onayı olmadan değiştiremez",
    ],
    testing: [
      "Pipeline çıktısı için golden veri kümesi karşılaştırma testi",
      "Prompt injection saldırı senaryosu testi (girdi enjeksiyonu reddi)",
      "RAG/çıkarım için değerlendirme (eval) seti; en çok 6 düzeltme turu",
    ],
    owasp: [
      "OWASP LLM Top 10: LLM01 prompt injection muhafızası varsayılan",
      "LLM06 hassas bilgi sızıntısı: çıktı PII redaksiyonu",
      "A09 Logging: prompt/yanıt ve veri erişimi forensic iz",
    ],
    integration: [
      "Data-intelligence, tüm app'lerin olaylarını veri gölü/pipeline'a alır",
      "Kernel agent-runtime ile AI ajan orkestrasyonu",
      "BI/tahmin çıktıları diğer app panolarına beslenir",
    ],
    moduleUsage: [
      "Veri & Zeka app'i tüm aileye AI/analitik yetenek sağlar",
      "Diğer app'ler tahmin/RAG/BI'yı bu veri sözleşmesi üzerinden tüketir",
    ],
  },

  "s-ai": {
    featureDefs: [
      "AI Stack ArcheType'ı: model kayıt, prompt yönetimi, çıkarım yönlendirme ve ajan orkestrasyonu",
      "Çoklu sağlayıcı (LLM) soyutlaması ve maliyet/kalite yönlendirme",
      "Prompt sürümleme, değerlendirme (eval) ve guardrail katmanı",
    ],
    security: [
      "Prompt/yanıt tenant_id RLS; sağlayıcı anahtarı kasada",
      "sub_prompt güvenilmez; injection muhafızası tüm çağrılarda",
      "Model çıktısında PII redaksiyon + erişim audit'i",
    ],
    codeOptimization: [
      "Sağlayıcı adaptörleri ortak arayüz; yönlendirme kural tablosundan",
      "Embedding/yanıt önbelleği; aynı prompt tekrar çağrılmaz",
      "Prompt şablonları sürümlü ve test-edilebilir",
    ],
    securityOptimization: [
      "Guardrail (girdi/çıktı filtre) varsayılan açık; kapatma yetki+iz",
      "Maliyet bütçe tavanı; aşımda çağrı durur + uyarı",
      "Model sürümü pinlenir; sessiz değişim tekrarlanabilirliği bozmasın",
    ],
    performance: [
      "Çıkarım kuyruğu geri-baskılı; akış (streaming) yanıt",
      "Sıcak prompt'lar için yanıt önbelleği",
      "Toplu embedding üretimi",
    ],
    mobileApps: [
      "Mobilde AI asistanı akış yanıtla; offline kuyruk",
      "iOS/Android push ile uzun-iş tamamlanma bildirimi",
      "Dar ekranda yanıt + kaynak atıfları",
    ],
    wcag: [
      "Akan yanıt aria-live ile duyurulur; durdur/yeniden başlat erişilebilir",
      "Kaynak atıfları bağlantılı ve klavye erişimli; kontrast 7:1",
      "Hata/limit mesajı açık ve eyleme dönük",
    ],
    deployment: [
      "AI Stack çıkarım servisi ayrı ölçek; sağlayıcı oran-sınırına uyumlu",
      "Guardrail ara katmanı her çağrıda; bypass yok",
      "Shared hosting'de yalnız hafif sağlayıcı çağrısı (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: AI çağrısı geldi → guardrail uygula + maliyet kontrol + yönlendir (idempotent, zincir ≤6)",
      "Olay: bütçe eşiği aşıldı → çağrıyı reddet + admin'e uyar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI Stack ajanları öneri/taslak üretir; ruleset/guardrail veya model dağıtımını kendisi değiştiremez",
    ],
    testing: [
      "Guardrail (injection/jailbreak) saldırı senaryosu testi",
      "Prompt sürümü için değerlendirme (eval) regresyon testi",
      "Maliyet bütçe-durdurma testi; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: girdi muhafızası + sub_prompt untrusted",
      "LLM02 Insecure Output Handling: çıktı sanitizasyonu",
      "LLM10 Model DoS: oran/maliyet sınırı",
    ],
    integration: [
      "AI Stack, kernel agent-runtime ve tüm AI tüketen app'lerle entegre",
      "Sağlayıcılar ipaas/adaptör katmanından",
      "Prompt/yanıt gözlemlenebilirliğe (observability) yayılır",
    ],
    moduleUsage: [
      "AI Stack ArcheType'ı Veri & Zeka app'inde AI altyapısını sağlar",
      "Tüm app'ler LLM yeteneğini bu guardrail'lı stack üzerinden kullanır",
    ],
  },

  "s-rag": {
    featureDefs: [
      "Kurumsal RAG Asistanı ArcheType'ı: belge alma (retrieval) + üretim; kaynaklı, izlenebilir yanıt",
      "Doküman ingest, parçalama (chunk), embedding ve yetki-farkında arama",
      "Kaynak atıfı (citation) ve güven skoru ile yanıt",
    ],
    security: [
      "Arama yetki-farkında: kullanıcı yalnız erişimli belgelerden yanıt alır (tenant_id + ReBAC)",
      "Belge PII sınıflandırması; hassas içerik yanıtta maskeli",
      "Prompt injection (belge içeriğinden) muhafızası",
    ],
    codeOptimization: [
      "Chunk/embedding pipeline'ı idempotent; belge değişiminde yalnız fark yeniden indekslenir",
      "Hibrit arama (vektör + anahtar kelime); yeniden sıralama (rerank)",
      "Yanıt şablonu kaynak atıflarını zorunlu kılar",
    ],
    securityOptimization: [
      "Belge içeriğindeki gizli talimat (indirect injection) etkisizleştirilir",
      "Erişim filtresi arama seviyesinde; yetkisiz belge skora bile girmez",
      "Embedding deposu tenant-izole",
    ],
    performance: [
      "ANN vektör indeksi; arama gecikme bütçesi",
      "Sık sorular için yanıt önbelleği",
      "Toplu ingest asenkron kuyrukta",
    ],
    mobileApps: [
      "Mobilde RAG sohbet; kaynak belgeye derin-bağ",
      "iOS/Android offline soru kuyruğu + senkron",
      "Dar ekranda yanıt + katlanır kaynaklar",
    ],
    wcag: [
      "Yanıt ve kaynak atıfları okuyucuya yapılandırılmış; akış aria-live",
      "Kaynak bağlantıları klavye erişimli; kontrast 7:1",
      "Düşük-güven yanıt metinle işaretli (yalnız renk değil)",
    ],
    deployment: [
      "Vektör deposu + çıkarım ayrı servis; Kubernetes'te ölçek",
      "Ingest pipeline'ı olay-tetikli worker",
      "Shared hosting'de küçük korpus + harici embedding (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: belge eklendi/değişti → parçala + embed + indeksle (idempotent, zincir ≤6)",
      "Olay: yanıt güveni düşük → 'emin değilim' + insan/kaynak öner (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "RAG ajanı yalnız erişimli kaynaklardan yanıtlar ve atıf verir; yetki sınırını aşan belgeye erişemez",
    ],
    testing: [
      "Yetki-farkında arama testi (yetkisiz belge yanıta sızmaz)",
      "Indirect prompt injection (belgeden) saldırı testi",
      "RAG kalite (groundedness/citation) eval seti; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: doğrudan ve dolaylı (belge) injection muhafızası",
      "LLM06 Sensitive Disclosure: yetki filtresi + PII redaksiyon",
      "A01 Access Control: ReBAC ile belge erişimi",
    ],
    integration: [
      "RAG, içerik/belge app'lerinden (DMS/wiki) korpus alır",
      "AI Stack guardrail ve çıkarımını kullanır",
      "Kaynak izleri gözlemlenebilirliğe",
    ],
    moduleUsage: [
      "RAG ArcheType'ı Veri & Zeka app'inde kurumsal bilgi asistanını sağlar",
      "Destek, satış ve bilgi yönetimi app'leri RAG'i tüketir",
    ],
  },

  "s-etl": {
    featureDefs: [
      "Veri Pipeline / ETL ArcheType'ı: kaynak bağlama, dönüşüm, yükleme ve zamanlama",
      "Bildirimsel dönüşüm, şema evrimi ve veri kalite kontrolü",
      "Toplu ve akış (stream) modları; backfill desteği",
    ],
    security: [
      "Kaynak kimlik bilgileri kasada; veri tenant-izole",
      "Hassas alan pipeline'da maskelenir/tokenize edilir",
      "Pipeline değişikliği sürümlü ve izli",
    ],
    codeOptimization: [
      "Dönüşümler bildirimsel ve saf; yeniden çalıştırılabilir (idempotent)",
      "Artımlı işleme (CDC); yalnız değişen veri",
      "Şema evrimi expand-contract ile geriye uyumlu",
    ],
    securityOptimization: [
      "Backfill izli; yanlış backfill geri-alınabilir",
      "Kaynak erişimi en-az-ayrıcalık; salt-okuma tercih",
      "Veri kalite kapısı: bozuk veri karantinaya, akışa girmez",
    ],
    performance: [
      "Akış işleme geri-baskılı; toplu işleme parçalı",
      "Paralel dönüşüm; kaynak oran-sınırına saygılı",
      "Hedef yükleme toplu (bulk) ve idempotent",
    ],
    mobileApps: [
      "Mobilde pipeline durumu ve hata uyarısı izleme",
      "iOS/Android push ile başarısız iş bildirimi",
      "Dar ekranda pipeline sağlık kartı",
    ],
    wcag: [
      "Pipeline durum panosu klavye+okuyucu erişimli",
      "Başarılı/başarısız durum renk dışında metin+ikonla; kontrast 7:1",
      "Hata detayı yapılandırılmış sunulur",
    ],
    deployment: [
      "Pipeline worker'ları ayrı ölçek; zamanlayıcı (scheduler) merkezde",
      "Akış işleyici dayanıklı (checkpoint); yeniden başlatmada kaldığı yerden",
      "Shared hosting'de yalnız zamanlanmış toplu ETL",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kaynak verisi değişti → ilgili pipeline'ı tetikle + kalite kontrolü (idempotent, zincir ≤6)",
      "Olay: kalite eşiği başarısız → veriyi karantinaya al + sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI eşleme/dönüşüm önerisi ve anomali tespiti üretir; pipeline'ı kendisi prod'a alamaz",
    ],
    testing: [
      "Dönüşüm doğruluk testi (golden girdi/çıktı)",
      "Idempotency ve backfill geri-alınabilirlik testi",
      "Şema evrimi geriye uyumluluk testi; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: dönüşüm sürümlü, veri soyağacı izli",
      "A01 Access Control: kaynak erişimi en-az-ayrıcalık",
      "A09 Logging: pipeline çalıştırma ve kalite kararları iz",
    ],
    integration: [
      "ETL, tüm kaynak app'lerden veri çekip veri gölü/ambarına yükler",
      "BI, tahmin ve RAG bu pipeline çıktısını tüketir",
      "Veri kataloğu/lineage ile entegre",
    ],
    moduleUsage: [
      "ETL ArcheType'ı Veri & Zeka app'inde veri entegrasyon omurgasını sağlar",
      "Analitik ve AI app'leri temiz veriyi bu pipeline'dan alır",
    ],
  },

  "s-bi": {
    featureDefs: [
      "BI / Dashboard ArcheType'ı: veri modeli, ölçüler (metric), pano ve self-servis keşif",
      "Sürümlü metrik tanımı (semantic layer) ve drill-down",
      "Zamanlanmış rapor ve uyarı (alert)",
    ],
    security: [
      "Pano/veri satır-seviyesi güvenlik (RLS) ile tenant+rol bazlı",
      "Metrik tanımı sürümlü; yetkisiz değişiklik reddi",
      "Dışa aktarım izli; hassas kırılım maskeli",
    ],
    codeOptimization: [
      "Metrikler tek semantic katmandan; tutarlı tanım",
      "Sorgular okuma-modeli/küpten; ağır hesap önceden",
      "Pano bileşenleri tembel ve önbellekli",
    ],
    securityOptimization: [
      "Satır-seviyesi güvenlik sorguya gömülü; atlanamaz",
      "Metrik snapshot'ı denetlenebilir (geçmiş değer)",
      "Toplulaştırma gizlilik eşikli",
    ],
    performance: [
      "Önceden hesaplanmış küp/projeksiyon; pano anlık",
      "Drill-down sorguları indeksli",
      "Eşzamanlı pano yükünde okuma-replikası",
    ],
    mobileApps: [
      "Mobil pano: kritik KPI öncelikli, dokunmayla drill-down",
      "iOS/Android push ile uyarı (alert) bildirimi",
      "Dar ekranda grafik yerine özet kart seçeneği",
    ],
    wcag: [
      "Her grafik için veri tablosu/metin alternatifi (okuyucu)",
      "Trend yönü renk dışında ok+metinle; kontrast 7:1",
      "Filtre ve drill-down klavye erişimli",
    ],
    deployment: [
      "BI sorgu motoru okuma-replikasından; yatay ölçek",
      "Zamanlanmış rapor üretimi ayrı worker",
      "Shared hosting'de temel pano + statik rapor",
    ],
    eca: [
      ECA_BOUND,
      "Olay: metrik eşik aştı → uyarı gönder + ilgili panoya bağ (idempotent, zincir ≤6)",
      "Olay: zamanlanmış rapor günü → raporu üret + dağıt (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI doğal-dil sorgu ve içgörü açıklaması üretir; metrik tanımını veya RLS'i kendisi değiştiremez",
    ],
    testing: [
      "Metrik hesabı doğruluk testi (semantic layer)",
      "Satır-seviyesi güvenlik testi (kullanıcı yetkisiz veriyi görmez)",
      "Pano kullanıcı yolculuğu + axe AAA; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: satır-seviyesi güvenlik (RLS)",
      "A08 Integrity: metrik tanımı sürümlü ve snapshot'lı",
      "Toplulaştırma gizlilik eşikli (re-identification koruması)",
    ],
    integration: [
      "BI, ETL/veri ambarı çıktısını tüketir",
      "Uyarılar bildirim app'ine yayılır",
      "Metrikler diğer app panolarına gömülebilir",
    ],
    moduleUsage: [
      "BI ArcheType'ı Veri & Zeka app'inde analitik/raporlamayı sağlar",
      "Tüm app'ler kendi KPI panolarını bu semantic katmandan kurar",
    ],
  },

  "app-data-intelligence-x-stone": {
    featureDefs: [
      "Veri & Zeka kırılımının Taş (alt-yetenek) örneği: bir AI/veri yeteneğinin alt-parça tarifi",
      "Taş, bir ArcheType içindeki çalışabilir alt-yetenek (ör. embedding üretici)",
      "Örnek dal; AI yeteneğinin granülerlikteki yeri",
    ],
    security: [
      "Alt-yetenek üst ArcheType'ın tenant izolasyonu ve PII kuralına uyar",
      "AI girdisinde injection muhafızası sınırda",
      "Hassas veri üst katmanda maskelenir",
    ],
    codeOptimization: [
      "AI taşı saf/idempotent; embedding/çıkarım önbelleklenebilir",
      "Üst ArcheType ile tipli arayüz",
      "Tekrar eden AI mantığı paylaşılan yardımcıya",
    ],
    securityOptimization: [
      "En az ayrıcalık; gereksiz veri/model erişimi yok",
      "Girdi normalizasyonu ile injection daraltılır",
      "Model/embedding sürümlü",
    ],
    performance: [
      "AI taşı çıktısı önbelleklenebilir",
      "Tembel başlatma; ağır model yalnız gerekince",
      "Toplu çıkarıma uygun",
    ],
    mobileApps: [
      "Yeteneğin UI'si varsa mobilde özetli",
      "iOS/Android içinde bağımsız çağrılabilir",
      "Dar ekranda AI çıktısı okunur",
    ],
    wcag: [
      "Alt-yetenek etkileşimi klavye erişimli ve adlandırılmış",
      "AI durumu metinle bildirilir; kontrast 7:1",
      "Hata mesajı ilişkilendirilmiş ve sesli",
    ],
    deployment: [
      "AI taşı üst ArcheType ile dağıtılır; çıkarım gerekirse ayrı havuz",
      "Kubernetes'te üst yetenekle ölçek",
      "Shared hosting'de hafif/kural-temelli degrade",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alt-yetenek girdisi geçersiz/şüpheli → sınırda reddet + üst akışa hata (idempotent, zincir ≤6)",
      "Taş bağımsız otomasyon tutmaz; üst ArcheType kuralına bağlanır",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bu veri yeteneğinin tarifini önerebilir; üst ArcheType veya app'i kendisi üretemez",
    ],
    testing: [
      "AI taşı için golden çıktı karşılaştırma testi",
      "Üst ArcheType sözleşme entegrasyon testi",
      "Injection sınır testi; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: girdi sınırda muhafazalı",
      "A04 Insecure Design: en-az-ayrıcalık",
      "Çıktı/karar izlenir",
    ],
    integration: [
      "AI taşı üst ArcheType'a (ör. RAG/AI Stack) tipli arayüzle bağlanır",
      "AI Stack guardrail'ını tüketir",
      "Çıktısı üst veri akışında",
    ],
    moduleUsage: ["AI taşı bir alt-yetenektir; bağımsız sunulmaz, üst ArcheType içinde kullanılır"],
  },

  "app-data-intelligence-x-molecule": {
    featureDefs: [
      "Veri & Zeka kırılımının Molekül örneği: birkaç AI/veri kuralını birleştiren bileşen",
      "Molekül, AI alt-yeteneğinin çalışabilir en küçük bileşeni (ör. yeniden-sıralama)",
      "Örnek dal; AI bileşeninin granülerlikteki yeri",
    ],
    security: [
      "Molekül AI girdi doğrulamasını sınırda yapar (injection muhafızası)",
      "Yalnız kapsamındaki veriye erişir",
      "Tenant bağlamına bağlı; bağlamsız çağrı reddi",
    ],
    codeOptimization: [
      "AI molekülü saf fonksiyon; çıkarım kenarda",
      "Girdi/çıktı tipli; embedding önbellekli",
      "Tekrar eden mantık paylaşılan yardımcıya",
    ],
    securityOptimization: [
      "En az ayrıcalık model/veri erişimi",
      "Girdi normalizasyonuyla injection daraltılır",
      "Bağımlılık minimal ve denetli",
    ],
    performance: [
      "AI hesabı önbelleklenebilir molekül",
      "Tembel başlatma",
      "Küçük serileştirilebilir çıktı",
    ],
    mobileApps: [
      "Molekül UI'si mobilde özetli",
      "iOS/Android offline çağrı kuyruğu",
      "Dar ekranda AI sonucu net",
    ],
    wcag: [
      "Bileşen etkileşimi klavye erişimli ve adlandırılmış",
      "AI durumu metinle; kontrast 7:1",
      "Hata ilişkilendirilmiş ve sesli",
    ],
    deployment: [
      "AI molekülü üst yetenekle dağıtılır",
      "Üst ArcheType ile ölçeklenir",
      "Shared hosting'de hafif degrade",
    ],
    eca: [
      ECA_BOUND,
      "Olay: molekül AI girdisi şüpheli → sınırda reddet + üst yeteneğe hata (idempotent, zincir ≤6)",
      "Molekül üst seviye kurala bağlanır; bağımsız tetikleyici tutmaz",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI molekül tarifini önerebilir; üst ArcheType veya app'i kendisi üretemez",
    ],
    testing: [
      "AI molekülü golden çıktı testi",
      "Üst yetenek entegrasyon testi",
      "Injection sınır mikro-yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: sınırda muhafaza",
      "A04 Insecure Design: en-az-ayrıcalık",
      "Çıktı izlenir",
    ],
    integration: [
      "AI molekülü üst taş/ArcheType'a tipli arayüzle bağlanır",
      "AI Stack guardrail'ını tüketir",
      "Çıktısı üst veri akışında",
    ],
    moduleUsage: ["AI molekülü bir bileşendir; bağımsız sunulmaz, üst yetenek içinde kullanılır"],
  },

  "app-data-intelligence-x-element": {
    featureDefs: [
      "Veri & Zeka kırılımının Element örneği: tek bir veri alanı veya AI kuralı (ör. güven eşiği)",
      "Element, AI/veri sözleşmesindeki en küçük anlamlı alan/kural",
      "Örnek dal; AI alan kuralının granülerlikteki yeri",
    ],
    security: [
      "Veri alanı doğrulaması sunucuda; AI çıktısı için güven eşiği kuralı",
      "Hassas alan (PII) sınıflandırma bayrağı + maskeleme",
      "Alan yazımı tenant+rol yetkisiyle",
    ],
    codeOptimization: [
      "AI kuralı (eşik) saf doğrulayıcı; tek sorumluluk",
      "Alan tipi Zod şemasıyla",
      "Tekrar eden kural paylaşılan doğrulayıcıya",
    ],
    securityOptimization: [
      "Allowlist temelli; beklenmeyen AI çıktısı/girdi reddi",
      "Güven eşiği altı çıktı insana yönlendirilir",
      "PII alanı için field-level yetki",
    ],
    performance: [
      "Eşik/doğrulama O(1) saf hesap",
      "Önbelleklenebilir",
      "Toplu doğrulamada vektörel",
    ],
    mobileApps: [
      "Alan/eşik mobilde okunur gösterilir",
      "iOS/Android offline doğrulanabilir",
      "Düşük-güven uyarısı dar ekranda",
    ],
    wcag: [
      "Alan etiketi programatik ilişkili; güven durumu metinle",
      "Hata alanla bağlı ve sesli; kontrast 7:1",
      "Eşik göstergesi yalnız renk değil metin+ikon",
    ],
    deployment: [
      "Alan/eşik kuralı veri şemasının parçası",
      "Her profilde istemci+sunucu doğrulaması",
      "Shared hosting'de çift doğrulama",
    ],
    eca: [
      ECA_BOUND,
      "Olay: AI çıktısı güven eşiğini geçemedi → üst molekül kuralına sinyal (idempotent, zincir ≤6)",
      "Element tek başına otomasyon yazmaz; üst kurala girdi sağlar",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI alan/eşik kuralı önerebilir; güven eşiğini veya maskeleme kuralını kendisi gevşetemez",
    ],
    testing: [
      "Güven eşiği ve alan sınır-değer testleri",
      "PII alanı maskeleme testi",
      "Form bağlamında erişilebilirlik mikro-yolculuğu",
    ],
    owasp: [
      "LLM02 Insecure Output Handling: güven eşiği + sanitizasyon",
      "A02 Cryptographic Failures: hassas alan maskeli",
      "Alan/eşik değişikliği izli",
    ],
    integration: [
      "Element, üst molekül ve ArcheType field sözleşmesine bağlanır",
      "Veri şema doğrulamasına dahil",
      "Surface projeksiyonunda görünürlük bu kurala göre",
    ],
    moduleUsage: [
      "AI elementi bir alan/kuraldır; bağımsız sunulmaz, ArcheType field tanımının parçası",
    ],
  },

  "app-data-intelligence-x-atom": {
    featureDefs: [
      "Veri & Zeka kırılımının Atom örneği: bölünemez ilkel (ör. embedding vektörü değer nesnesi)",
      "Atom, veride daha alt parçaya ayrılmayan ilkel sözleşme birimi",
      "Örnek dal; veri atomunun granülerlik tabanındaki yeri",
    ],
    security: [
      "Veri atomu değişmez; beklenmeyen mutasyon engellenir",
      "Atom değeri sınırda doğrulanır (geçerli vektör/skor)",
      "Hassas atom üst katmanda maskelenir",
    ],
    codeOptimization: [
      "Embedding/skor atomu değer nesnesi; eşitlik değere göre",
      "Sabit boyut/tip; geçersiz vektör reddi",
      "Atomlar paylaşılır, referans tutulur",
    ],
    securityOptimization: [
      "En dar biçim doğrulaması; fazlalık reddi",
      "Güvenli serileştirme",
      "Bağımlılıksız; saldırı yüzeyi minimal",
    ],
    performance: [
      "Atom doğrulaması sabit zaman",
      "Değer internalize; bellek tekrarı az",
      "Vektör karşılaştırma optimize",
    ],
    mobileApps: [
      "Atom değeri mobilde özetli gösterilir",
      "iOS/Android offline doğrulanabilir",
      "Gösterim taşmaz",
    ],
    wcag: [
      "Atom etiketli ve biçim ipuçlu",
      "Hata metinle; kontrast 7:1",
      "Değer okuyucuya anlamlı",
    ],
    deployment: [
      "Veri atom tipi şema çekirdeğinde",
      "Her profilde aynı doğrulama",
      "Shared hosting dahil istemci-içi",
    ],
    eca: [
      ECA_BOUND,
      "Atom seviyesi otomasyon tetiklemez; üst kurallara veri değeri sağlar",
      "Olay: vektör/skor geçersiz → üst element kuralı reddeder (idempotent)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI veri atom tipi önerebilir; ilkel sözleşmeyi tek başına yazamaz, insan onayı gerekir",
    ],
    testing: [
      "Veri atomu biçim/sınır birim testleri",
      "Değişmezlik testi",
      "Serileştirme/round-trip testi",
    ],
    owasp: [
      "A03 Injection: değer biçim-doğrulanır",
      "A08 Integrity: atom değişmez ve doğrulanmış",
      "Kabul/red izlenebilir",
    ],
    integration: [
      "Veri atomu, element ve field tanımlarının yapı taşı",
      "Veri tip sistemine dahil",
      "Üst seviyeler atomu birleştirir",
    ],
    moduleUsage: [
      "Veri atomu bölünemez birimdir; bağımsız sunulmaz, üst veri tip tanımlarında kullanılır",
    ],
  },

  "s-ai-catalog": {
    featureDefs: [
      "B2B AI Katalog / Görsel Üretim ArcheType'ı: ürün görseli/metni AI ile üretir, marka kurallı katalog",
      "Şablon, marka kiti ve toplu üretim; insan onaylı yayın",
      "Üretilen varlıkların telif/kaynak ve sürüm takibi",
    ],
    security: [
      "Üretilen varlık ve prompt tenant_id RLS; marka kiti erişimi rol bazlı",
      "Telif/uygunsuz içerik filtresi; yayın öncesi insan onayı",
      "Model/sağlayıcı anahtarı kasada; injection muhafızası",
    ],
    codeOptimization: [
      "Görsel üretim kuyruğu asenkron; üretilen varlık nesne deposunda",
      "Marka kuralları şablon olarak; üretim bunları uygular",
      "Yeniden üretim için prompt+seed sürümlenir",
    ],
    securityOptimization: [
      "Üretim maliyeti bütçe tavanı; toplu iş oran-sınırlı",
      "Uygunsuz içerik için çıktı sınıflandırma + karantina",
      "Yayın insan onayı; AI tek başına yayınlamaz",
    ],
    performance: [
      "Toplu görsel üretimi paralel kuyruk; geri-baskılı",
      "Önizleme düşük çözünürlük, onayda tam çözünürlük",
      "Varlık CDN'den servis",
    ],
    mobileApps: [
      "Mobilde üretim isteği ve onay; varlık önizleme",
      "iOS/Android push ile üretim tamamlandı bildirimi",
      "Dar ekranda marka-uyum kontrolü",
    ],
    wcag: [
      "Üretilen görsele zorunlu alternatif metin (alt); okuyucu erişimi",
      "Onay/red aksiyonu klavye erişimli; kontrast 7:1",
      "Üretim durumu metinle bildirilir",
    ],
    deployment: [
      "Görsel üretim GPU servisi ayrı havuz (Kubernetes)",
      "Varlık deposu nesne-storage + CDN",
      "Shared hosting'de yalnız metin üretimi (görsel kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: katalog üretim isteği → marka kuralıyla üret + uygunsuz içerik filtresi (idempotent, zincir ≤6)",
      "Olay: üretim onaylandı → kataloğa yayınla + sürüm kaydı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI görsel/metin üretir ve marka-uyum önerir; kataloğa yayını insan onayı yapar",
    ],
    testing: [
      "Marka kuralı uygulama doğruluk testi",
      "Uygunsuz içerik filtre testi (karantina)",
      "Üretim→onay→yayın kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: üretim prompt'u muhafazalı",
      "LLM09 Overreliance: yayın insan onayı zorunlu",
      "A09 Logging: üretim/yayın kararları iz",
    ],
    integration: [
      "AI-catalog, PIM/Commerce kataloğuna varlık sağlar",
      "AI Stack üretim/guardrail'ını kullanır",
      "Marka kiti içerik app'inden",
    ],
    moduleUsage: [
      "AI-catalog ArcheType'ı Veri & Zeka app'inde AI varlık üretimini sağlar",
      "E-ticaret ve pazarlama app'leri üretilen kataloğu tüketir",
    ],
  },

  "s-ai-voice": {
    featureDefs: [
      "AI Voice Agent ArcheType'ı: telefon/ses kanalında STT→LLM→TTS ile doğal görüşme",
      "Niyet tanıma, görev yürütme ve insana devretme (handoff)",
      "Görüşme kaydı, özet ve kalite skoru",
    ],
    security: [
      "Ses kaydı/transkript tenant_id RLS; biyometrik/PII korumalı",
      "Kayıt için onay (consent); injection (sesli) muhafızası",
      "Hassas işlemde insana devir + kimlik doğrulama",
    ],
    codeOptimization: [
      "STT/TTS akış-temelli; düşük gecikme diyalog döngüsü",
      "Niyet→aksiyon eşlemesi kural+model; saf yönlendirme",
      "Görüşme durumu durum makinesi",
    ],
    securityOptimization: [
      "Sesli sosyal mühendislik için yüksek-risk aksiyonda step-up",
      "Transkript PII redaksiyonu; kayıt saklama süresi sınırlı",
      "Maliyet/dakika bütçe tavanı",
    ],
    performance: [
      "Diyalog gecikmesi düşük hedefli; akış STT/TTS",
      "Eşzamanlı çağrı ölçeği; medya ayrı işleyici",
      "Sık niyetler için önbellekli yanıt",
    ],
    mobileApps: [
      "Mobil uygulama içi sesli asistan (in-app voice)",
      "iOS/Android mikrofon izinleri ve gürültü bastırma",
      "Çağrı özeti dar ekranda metinle",
    ],
    wcag: [
      "Sesli etkileşime metin alternatifi (canlı transkript)",
      "İşitme engelli için tam metin diyalog; kontrast 7:1",
      "Devretme/iptal aksiyonu erişilebilir",
    ],
    deployment: [
      "Medya/STT/TTS ayrı servis; telefon ağ geçidi entegrasyonu",
      "Eşzamanlı çağrı için yatay ölçek (Kubernetes)",
      "Shared hosting uygun değil; en az hafif bulut çıkarım gerekir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yüksek-risk niyet (ödeme/iptal) → kimlik doğrula + insana devret (idempotent, zincir ≤6)",
      "Olay: görüşme bitti → transkript özetle + kalite skoru + PII redakte (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "Ses ajanı bilgi verir ve düşük-riskli görev yapar; yüksek-riskli işlemi insana devreder, kendisi tamamlamaz",
    ],
    testing: [
      "Niyet tanıma doğruluk + yanlış-niyet testi",
      "Yüksek-risk devretme/step-up testi",
      "Sesli injection (sosyal mühendislik) saldırı testi; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: sesli girdi muhafazalı",
      "LLM06 Sensitive Disclosure: transkript PII redaksiyon",
      "A07 Auth Failures: hassas işlemde kimlik doğrulama",
    ],
    integration: [
      "AI-voice, telefon ağ geçidi ve CRM (çağrı kaydı) ile entegre",
      "AI Stack çıkarım/guardrail'ını kullanır",
      "Yüksek-risk işlemleri ilgili ArcheType'a devreder",
    ],
    moduleUsage: [
      "AI-voice ArcheType'ı Veri & Zeka app'inde sesli ajan kanalını sağlar",
      "Destek, satış ve randevu app'leri sesli kanalı tüketir",
    ],
  },

  "s-conversational": {
    featureDefs: [
      "Konuşma Ticareti / Chatbot ArcheType'ı: web/WhatsApp/sosyal kanalda sohbetle satış ve destek",
      "Niyet akışı, ürün önerisi ve sepet/sipariş işlemleri sohbette",
      "İnsana devretme ve görüşme bağlamı korunur",
    ],
    security: [
      "Sohbet/iletişim verisi tenant_id RLS; kanal token'ı kasada",
      "Sohbet injection muhafızası; hassas işlemde kimlik+step-up",
      "PII paylaşımı maskeli ve izinli",
    ],
    codeOptimization: [
      "Diyalog durumu durum makinesi; niyet→aksiyon kural+model",
      "Kanal adaptörleri ortak arayüz",
      "Sık akışlar için yanıt önbelleği",
    ],
    securityOptimization: [
      "Yüksek-risk aksiyon (ödeme) için doğrulama + step-up",
      "Bot oran-sınırı; spam/suistimal engellenir",
      "Görüşme bağlamı tenant-izole",
    ],
    performance: [
      "Düşük gecikme yanıt; akış (streaming)",
      "Eşzamanlı sohbet ölçeği; webhook asenkron",
      "Bağlam penceresi yönetimi (özetleme)",
    ],
    mobileApps: [
      "Mobil sohbet widget'ı; offline mesaj kuyruğu",
      "iOS/Android push ile yanıt bildirimi",
      "Dar ekranda ürün kartı + hızlı aksiyon",
    ],
    wcag: [
      "Sohbet klavye erişimli; mesajlar okuyucuya sıralı sunulur",
      "Akan yanıt aria-live; kontrast 7:1",
      "Hızlı yanıt butonları adlandırılmış",
    ],
    deployment: [
      "Sohbet servisi yatay ölçek; kanal webhook'ları ayrı alıcı",
      "Çıkarım AI Stack üzerinden",
      "Shared hosting'de yalnız web widget (kısıtlı)",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sohbette sipariş niyeti → ürün öner + sepet oluştur (idempotent, zincir ≤6)",
      "Olay: AI çözemedi/yüksek-risk → insana devret + bağlamı aktar (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "Sohbet ajanı bilgi/öneri verir ve düşük-riskli işlem yapar; ödeme/iptali insan veya doğrulamalı akış tamamlar",
    ],
    testing: [
      "Niyet akışı ve devretme kullanıcı yolculuğu",
      "Sohbet injection/jailbreak saldırı testi",
      "Sepet/sipariş işlemi doğruluk testi; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: sohbet girdisi muhafazalı",
      "LLM02 Insecure Output Handling: çıktı sanitizasyonu",
      "A01 Access Control: hassas işlemde yetki/doğrulama",
    ],
    integration: [
      "Conversational, Commerce (sepet/sipariş) ve CRM (müşteri) ile entegre",
      "Kanallar (WhatsApp/web) ipaas/adaptör katmanından",
      "AI Stack çıkarım/guardrail'ını kullanır",
    ],
    moduleUsage: [
      "Conversational ArcheType'ı Veri & Zeka app'inde sohbet kanalını sağlar",
      "E-ticaret ve destek app'leri sohbet ticaretini tüketir",
    ],
  },

  "s-data-catalog": {
    featureDefs: [
      "Veri Kataloğu / Lineage / Governance ArcheType'ı: veri varlıkları, soyağacı ve sahiplik",
      "Şema kayıt, etiketleme (PII/sınıflandırma) ve veri sözlüğü",
      "Erişim politikası ve veri kalitesi göstergeleri",
    ],
    security: [
      "Katalog metadata tenant_id RLS; hassas varlık erişimi rol bazlı",
      "PII/sınıflandırma etiketleri politikayı belirler",
      "Sahiplik ve erişim kararları izli",
    ],
    codeOptimization: [
      "Lineage grafı olaylardan türetilir; pipeline çalıştıkça güncel",
      "Şema kayıt sürümlü; uyumluluk kontrolü",
      "Arama indeksli (varlık/etiket)",
    ],
    securityOptimization: [
      "Sınıflandırma değişimi onaylı; aşağı-doğru etki analizi",
      "Erişim politikası deny-by-default; istisna izli",
      "Hassas varlık keşfi yetkiyle sınırlı",
    ],
    performance: [
      "Lineage grafı büyük; budama + önbellek",
      "Katalog araması indeksli",
      "Kalite göstergeleri zamanlanmış hesap",
    ],
    mobileApps: [
      "Mobilde varlık arama ve sahiplik görüntüleme",
      "iOS/Android push ile kalite/erişim uyarısı",
      "Dar ekranda lineage özet kartı",
    ],
    wcag: [
      "Lineage grafiği için metin/tablo alternatifi (okuyucu)",
      "Sınıflandırma etiketi renk dışında metinle; kontrast 7:1",
      "Arama ve filtre klavye erişimli",
    ],
    deployment: [
      "Katalog servisi standart ölçek; lineage toplama ayrı worker",
      "Metadata olayları pipeline'lardan",
      "Shared hosting'de temel katalog",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni veri varlığı/pipeline → kataloğa kaydet + lineage güncelle (idempotent, zincir ≤6)",
      "Olay: PII tespit edildi → varlığı sınıflandır + erişim politikasını sıkılaştır (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI varlık etiketleme/sınıflandırma ve sahiplik önerir; erişim politikasını kendisi değiştiremez",
    ],
    testing: [
      "Lineage doğruluk testi (kaynak→hedef izlenir)",
      "PII sınıflandırma ve politika uygulama testi",
      "Katalog arama/erişim kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: katalog erişim politikası deny-by-default",
      "LLM06 Sensitive Disclosure: PII etiketi + maskeleme",
      "A09 Logging: erişim/sınıflandırma kararları iz",
    ],
    integration: [
      "Data-catalog, ETL/pipeline'lardan metadata ve lineage alır",
      "BI/RAG/tahmin yetkili veriyi katalogdan keşfeder",
      "Gizlilik (KVKK) süreçlerine veri envanteri sağlar",
    ],
    moduleUsage: [
      "Data-catalog ArcheType'ı Veri & Zeka app'inde veri yönetişimini sağlar",
      "Tüm veri tüketen app'ler varlıkları katalogdan keşfeder",
    ],
  },

  "s-data-cleansing": {
    featureDefs: [
      "Veri Temizleme Otomasyonu ArcheType'ı: tekilleştirme, normalleştirme, zenginleştirme ve doğrulama",
      "Kural+AI ile kirli veriyi düzeltme; insan-onaylı eşik",
      "Temizleme geçmişi ve geri-alınabilir dönüşüm",
    ],
    security: [
      "Temizlenen veri tenant_id RLS; PII işleme izli",
      "Zenginleştirme dış kaynak allowlist'i; SSRF korumalı",
      "Otomatik düzeltme eşik üstü insan onayı",
    ],
    codeOptimization: [
      "Temizleme kuralları bildirimsel pipeline; idempotent",
      "Tekilleştirme bulanık eşleştirme (fuzzy) skorlu",
      "Dönüşüm geri-alınabilir (audit + önceki değer)",
    ],
    securityOptimization: [
      "Düşük-güven eşleşme insana; otomatik birleştirme yüksek-güvende",
      "Zenginleştirme kaynağı doğrulanır; zehirli veri reddi",
      "Geri-alma (rollback) her toplu işlem için",
    ],
    performance: [
      "Toplu temizleme parçalı/asenkron",
      "Bulanık eşleştirme bloklama (blocking) ile ölçeklenir",
      "Kural değerlendirmesi vektörel",
    ],
    mobileApps: [
      "Mobilde temizleme istisna kuyruğu ve onay",
      "iOS/Android push ile düşük-güven eşleşme bildirimi",
      "Dar ekranda öncesi/sonrası karşılaştırma",
    ],
    wcag: [
      "Öncesi/sonrası diff renk dışında işaret+metinle; kontrast 7:1",
      "Onay/red aksiyonu klavye erişimli",
      "Eşleşme adayları okuyucuya yapılandırılmış",
    ],
    deployment: [
      "Temizleme pipeline'ı worker; zenginleştirme dış çağrı oran-sınırlı",
      "Sonuç olayları katalog/hedefe outbox ile",
      "Shared hosting'de temel kural-temizleme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: kirli veri tespit → temizleme kuralı uygula + düşük-güveni incelemeye al (idempotent, zincir ≤6)",
      "Olay: yanlış birleştirme bildirildi → dönüşümü geri al + kuralı düzelt (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI eşleştirme/normalleştirme önerir; düşük-güven birleştirmeyi insan onaylar, AI tek başına uygulamaz",
    ],
    testing: [
      "Tekilleştirme/normalleştirme doğruluk testi (golden)",
      "Geri-alınabilirlik (rollback) testi",
      "Düşük-güven eşleşme insan-onay akışı; en çok 6 tur",
    ],
    owasp: [
      "A10 SSRF: zenginleştirme dış çağrıları allowlist'li",
      "A08 Integrity: dönüşüm geri-alınabilir ve izli",
      "A09 Logging: temizleme kararları iz",
    ],
    integration: [
      "Data-cleansing, ETL pipeline'ı içinde kalite aşaması",
      "Temiz veri katalog/ambar ve CRM'e",
      "Zenginleştirme dış servisleri ipaas'tan",
    ],
    moduleUsage: [
      "Data-cleansing ArcheType'ı Veri & Zeka app'inde veri kalitesini sağlar",
      "CRM, analitik ve ETL app'leri temizleme yeteneğini tüketir",
    ],
  },

  "s-doc-matching": {
    featureDefs: [
      "Belge Sınıflandırma & Eşleştirme ArcheType'ı: gelen belgeyi türüne ayırır, alan çıkarır, kayıtla eşleştirir",
      "OCR + sınıflandırma + varlık çıkarımı (NER); fatura/sözleşme/kimlik",
      "Düşük-güven sonuç insan kuyruğuna",
    ],
    security: [
      "Belge ve çıkarılan veri tenant_id RLS; hassas belge maskeli",
      "Belge içeriğinden injection muhafızası",
      "Eşleştirme kararı izli; yanlış eşleşme düzeltilebilir",
    ],
    codeOptimization: [
      "OCR→sınıflandırma→çıkarım pipeline'ı aşamalı, idempotent",
      "Eşleştirme skoru saf; eşik bazlı yönlendirme",
      "Şablon/model sürümlü",
    ],
    securityOptimization: [
      "Yüksek-güven otomatik eşleştirme; düşük-güven insana",
      "Belge kaynağı doğrulanır; zararlı dosya taranır",
      "Çıkarılan PII redaksiyon kuralına tabi",
    ],
    performance: [
      "Toplu belge işleme kuyrukla; OCR asenkron",
      "Eşleştirme indeksli aday arama",
      "Önbellekli şablon eşleştirme",
    ],
    mobileApps: [
      "Mobilde belge fotoğrafla + sınıflandırma sonucu",
      "iOS/Android push ile düşük-güven inceleme bildirimi",
      "Dar ekranda çıkarılan alanlar düzenlenebilir",
    ],
    wcag: [
      "Çıkarılan alanlar etiketli ve düzeltilebilir (klavye)",
      "Güven düzeyi renk dışında metinle; kontrast 7:1",
      "Belge önizleme okuyucuya açıklamalı",
    ],
    deployment: [
      "OCR/çıkarım GPU/CPU servisi ayrı; sınıflandırma ölçeklenir",
      "Sonuç olayları ilgili ArcheType'a outbox ile",
      "Shared hosting'de yalnız temel kural-sınıflandırma",
    ],
    eca: [
      ECA_BOUND,
      "Olay: belge geldi → sınıflandır + alan çıkar + kayıtla eşleştir (idempotent, zincir ≤6)",
      "Olay: eşleştirme güveni düşük → insan kuyruğuna gönder (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI belge sınıflandırır ve alan çıkarır; düşük-güven eşleştirmeyi insan onaylar, AI tek başına bağlamaz",
    ],
    testing: [
      "Sınıflandırma/çıkarım doğruluk testi (etiketli belge seti)",
      "Eşleştirme eşiği ve insan-kuyruk testi",
      "Belge→çıkarım→eşleştirme kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "LLM01 Prompt Injection: belge içeriği muhafazalı",
      "A08 Integrity: çıkarım model sürümlü",
      "A09 Logging: sınıflandırma/eşleştirme kararları iz",
    ],
    integration: [
      "Doc-matching, AP-automation (fatura) ve CLM (sözleşme) gibi tüketicilere alan sağlar",
      "AI Stack çıkarım/guardrail'ını kullanır",
      "Belge depo (DMS) ile entegre",
    ],
    moduleUsage: [
      "Doc-matching ArcheType'ı Veri & Zeka app'inde belge anlama yeteneğini sağlar",
      "Finans, hukuk ve operasyon app'leri belge çıkarımını tüketir",
    ],
  },

  "s-esg": {
    featureDefs: [
      "ESG / Sürdürülebilirlik Raporlama ArcheType'ı: çevre/sosyal/yönetişim metrikleri toplama ve raporlama",
      "Emisyon (kapsam 1/2/3) hesabı, hedef takibi ve standart uyumu (GRI/CSRD)",
      "Kanıt (evidence) yönetimi ve denetlenebilir raporlama",
    ],
    security: [
      "ESG verisi tenant_id RLS; kanıt belgeleri erişim kontrollü",
      "Metrik/hesap kuralları sürümlü ve izli",
      "Rapor onayı yetki+iz (yanlış beyan riski)",
    ],
    codeOptimization: [
      "Emisyon hesabı faktör tablosundan; saf hesap",
      "Metrik toplama kaynaklardan olay-temelli",
      "Standart eşlemesi (GRI/CSRD) bildirimsel",
    ],
    securityOptimization: [
      "Faktör/kural sürümleme ile geçmiş rapor korunur",
      "Kanıt belgesi değişmez (hash); sahtecilik izlenir",
      "Hesap metodolojisi şeffaf ve denetlenebilir",
    ],
    performance: [
      "Emisyon toplama dönem-sonu toplu",
      "Rapor üretimi özet projeksiyondan",
      "Büyük tedarik zinciri (kapsam 3) için parçalı hesap",
    ],
    mobileApps: [
      "Mobilde ESG KPI ve hedef ilerleme",
      "iOS/Android'de kanıt fotoğrafı/belge yükleme",
      "Dar ekranda emisyon özet kartı",
    ],
    wcag: [
      "ESG grafikleri için veri tablosu/metin alternatifi",
      "Hedef durumu renk dışında metin+ikonla; kontrast 7:1",
      "Rapor bölümleri başlıkla landmark'lı",
    ],
    deployment: [
      "ESG hesap motoru standart ölçek; rapor üretimi ayrı worker",
      "Metrik olayları kaynak app'lerden",
      "Shared hosting'de temel metrik + manuel rapor",
    ],
    eca: [
      ECA_BOUND,
      "Olay: dönem geldi → emisyon/metrik topla + standart rapor taslağı üret (idempotent, zincir ≤6)",
      "Olay: hedef sapması → sorumluya uyarı + aksiyon önerisi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI veri boşluğu/sapma tespiti ve rapor taslağı önerir; resmi raporu insan onaylar",
    ],
    testing: [
      "Emisyon (kapsam 1/2/3) hesap doğruluk testi",
      "Standart (GRI/CSRD) eşleme uyum testi",
      "Veri-toplama→rapor kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: kanıt belgesi hash + metodoloji sürümlü",
      "A01 Access Control: rapor onay yetkisi",
      "A09 Logging: ESG hesap/rapor kararları iz",
    ],
    integration: [
      "ESG, tedarik zinciri/operasyon app'lerinden veri toplar",
      "Finansal raporlama (CSRD) ile entegre",
      "Kanıt belgeleri DMS'ten",
    ],
    moduleUsage: [
      "ESG ArcheType'ı Veri & Zeka app'inde sürdürülebilirlik raporlamayı sağlar",
      "Kurumsal raporlama ve tedarik zinciri app'leri ESG metriklerini tüketir",
    ],
  },

  "s-observability": {
    featureDefs: [
      "Observability ArcheType'ı: log/metrik/iz (trace) toplama, uyarı ve SLO/SLI takibi",
      "Dağıtık iz korelasyonu ve kök-neden analizi yüzeyi",
      "Gösterge panoları ve olay (incident) ilişkilendirme",
    ],
    security: [
      "Telemetri tenant_id ile etiketli; log'da PII redaksiyon",
      "Gözlem verisine erişim rol bazlı (ops düzlemi)",
      "Uyarı kuralı değişimi izli",
    ],
    codeOptimization: [
      "Telemetri toplama düşük ek-yük (sampling)",
      "İz korelasyonu trace-id ile; sorgu indeksli",
      "SLO hesabı saf; hata bütçesi türetilir",
    ],
    securityOptimization: [
      "Log redaksiyonu varsayılan; sır/token log'a yazılmaz",
      "Yüksek-kardinalite etiket sınırı (maliyet/DoS koruması)",
      "Uyarı eşiği sürümlü",
    ],
    performance: [
      "Zaman-serisi deposu yüksek-yazma; sorgu için downsampling",
      "İz örnekleme (sampling) ile hacim yönetimi",
      "Pano sorguları önceden toplanmış",
    ],
    mobileApps: [
      "Mobil on-call: uyarı + olay durumu + onay",
      "iOS/Android push ile kritik uyarı",
      "Dar ekranda SLO/hata-bütçesi kartı",
    ],
    wcag: [
      "Uyarı önem düzeyi renk dışında metin+ikonla; kontrast 7:1",
      "Grafikler için veri tablosu/metin alternatifi",
      "Olay zaman çizelgesi klavye+okuyucu erişimli",
    ],
    deployment: [
      "Toplama ajanları her serviste; depolama ayrı ölçek",
      "Uyarı yöneticisi ayrı worker; bildirim entegrasyonu",
      "Shared hosting'de temel log + basit uyarı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: SLO ihlali/hata-bütçesi tükendi → uyarı + olay aç + runbook bağı (idempotent, zincir ≤6)",
      "Olay: anomali tespit → ilgili ekibe yükselt (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI kök-neden analizi ve olay özeti önerir; otomatik düzeltme/dağıtım aksiyonunu insan onaylar",
    ],
    testing: [
      "İz korelasyonu ve SLO hesabı doğruluk testi",
      "Uyarı tetik ve gürültü (alert fatigue) ayar testi",
      "Olay→runbook kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "LLM06/A09: log redaksiyonu (sır/PII sızmaz)",
      "A01 Access Control: gözlem verisi ops düzlemi yetkisi",
      "A05 Misconfiguration: telemetri güvenli varsayılan",
    ],
    integration: [
      "Observability, tüm app/servislerden telemetri toplar",
      "Ops kontrol düzlemi (Boyut 1) panellerini besler",
      "Olaylar bildirim/on-call ile entegre",
    ],
    moduleUsage: [
      "Observability ArcheType'ı Veri & Zeka app'inde sistem gözlemlenebilirliğini sağlar",
      "Tüm app'ler kendi telemetrisini bu sözleşmeye yayınlar",
    ],
  },

  "s-predictive": {
    featureDefs: [
      "Tahminsel Analitik ArcheType'ı: talep/churn/risk gibi tahmin modelleri ve skorlama",
      "Özellik mühendisliği, model eğitim/değerlendirme ve dağıtım (serving)",
      "Tahmin izleme, drift tespiti ve yeniden eğitim",
    ],
    security: [
      "Eğitim/skorlama verisi tenant_id RLS; PII özellikleri korumalı",
      "Model dağıtımı onaylı; sürüm ve veri soyağacı izli",
      "Tahmin çıktısı erişimi rol bazlı",
    ],
    codeOptimization: [
      "Özellik hesabı tek kaynaktan (eğitim/çıkarım tutarlı)",
      "Skorlama toplu/akış; sıcak özellik önbellekli",
      "Model kayıt sürümlü; A/B karşılaştırma",
    ],
    securityOptimization: [
      "Model sürümü pinlenir; sessiz değişim tekrarlanabilirliği bozmasın",
      "Drift tespiti otomatik; eşik aşımında yeniden eğitim önerisi",
      "Skorlama maliyeti/oranı sınırlı",
    ],
    performance: [
      "Çıkarım düşük gecikme; toplu skorlama asenkron",
      "Özellik deposu (feature store) önbellekli",
      "Model çıkarımı ayrı ölçek",
    ],
    mobileApps: [
      "Mobilde tahmin skorları ve risk uyarıları",
      "iOS/Android push ile yüksek-risk tahmin bildirimi",
      "Dar ekranda tahmin + açıklama (explainability) özeti",
    ],
    wcag: [
      "Tahmin/skor grafikleri için veri tablosu/metin alternatifi",
      "Risk düzeyi renk dışında metin+ikonla; kontrast 7:1",
      "Açıklama (feature importance) okuyucuya yapılandırılmış",
    ],
    deployment: [
      "Model serving ayrı servis; eğitim ayrı toplu iş (Kubernetes)",
      "Tahmin olayları tüketici app'lere outbox ile",
      "Shared hosting'de yalnız önceden-eğitilmiş hafif model",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yeni veri/özellik → drift kontrolü; eşik aşımında yeniden eğitim önerisi (idempotent, zincir ≤6)",
      "Olay: yüksek-risk skor → ilgili ArcheType'a sinyal + insan incelemesi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI özellik/model önerir ve tahmin açıklar; modeli prod'a kendisi alamaz, dağıtım insan onaylı",
    ],
    testing: [
      "Model değerlendirme (eval) ve drift tespiti testi",
      "Eğitim/çıkarım özellik tutarlılığı testi",
      "Tahmin→aksiyon kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: model/veri sürümlü, soyağacı izli",
      "LLM06: tahmin çıktısında hassas çıkarım koruması",
      "A09 Logging: model dağıtım/tahmin kararları iz",
    ],
    integration: [
      "Predictive, feature store ve veri ambarını tüketir",
      "Tahminler CRM (churn), tedarik (talep) gibi app'lere beslenir",
      "Gözlemlenebilirlik ile model izleme",
    ],
    moduleUsage: [
      "Predictive ArcheType'ı Veri & Zeka app'inde tahmin yeteneğini sağlar",
      "CRM, tedarik zinciri ve finans app'leri tahmin skorlarını tüketir",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) =>
  fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);

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
console.log(`[seed-data-intelligence] ${applied} düğüm derinleştirildi (swarm).`);
