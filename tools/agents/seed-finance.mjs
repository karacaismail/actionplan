#!/usr/bin/env node
/**
 * seed-finance — Faz B2 (Cowork tek-ajan, swarm yerine).
 * finance kümesinin 17 ŞABLON düğümüne ELLE yazılmış, sayfaya-özel 14 boyut içeriği uygular
 * (provenance="swarm"). finance'te bespoke düğüm yok; tümü derinleştirilir.
 * Doğrula: node tools/agents/check-content.mjs finance  (+ npm run typecheck)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "data", "generated", "nodes");

const ECA_BOUND = "Backend ECA ruleset AI app/module mutasyon ve ruleset override denemesini deny eder";
const AI_B1 = "AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir";
const AI_B2 = "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny";

const CONTENT = {
  "app-finance": {
    featureDefs: [
      "Finans & Muhasebe ürün ailesi: defter, fatura, tahsilat/ödeme, vergi ve raporlamayı kapsar",
      "TR mevzuatı (GİB e-fatura, KDV beyanı) ve çok-para-birimi desteklenir",
      "Tüm finans ArcheType'ları ortak ledger ve hesap planı sözleşmesini paylaşır",
    ],
    security: [
      "Mali kayıtlar tenant_id RLS; görev ayrılığı (SoD) ile kaydeden ≠ onaylayan",
      "Banka/IBAN ve vergi kimliği maskeli; değişiklik step-up onay gerektirir",
      "Tüm finansal hareket değişmez audit izi tutar (kim/ne/öncesi-sonrası)",
    ],
    codeOptimization: [
      "Ledger çift-taraflı kayıt değişmezdir; düzeltme ters-kayıtla yapılır",
      "Hesap bakiyesi olaylardan türetilir; dönem-sonu anlık görüntü önbellekli",
      "Para birimi/yuvarlama tek kaynaktan; finansal hesap kayan-nokta değil ondalık",
    ],
    securityOptimization: [
      "Onay eşikleri rol allowlist'i; eşik üstü ödeme çift onay",
      "Dönem kapanışı sonrası geriye dönük kayıt kilitli; açma yetki+iz ister",
      "Vergi/oran tabloları sürümlü; geriye dönük değişiklik etki analizli",
    ],
    performance: [
      "Büyük defter sorgusu hesap+dönem indeksiyle; rapor okuma-modelinden",
      "Dönem-sonu toplu işlemler asenkron kuyrukta",
      "Mizan/bilanço özet projeksiyonlardan anlık çekilir",
    ],
    mobileApps: [
      "Mobilde onay (fatura/ödeme) ve özet finansal pano",
      "iOS/Android push ile onay bekleyen kalem bildirimi",
      "Masraf fişi mobilde fotoğrafla yakalanır",
    ],
    wcag: [
      "Finansal tablolar klavye+okuyucu erişimli, sıralanabilir; tutarlar metinle",
      "Borç/alacak ve negatif tutar renk dışında işaret+metinle; kontrast 7:1",
      "Onay aksiyonları açık ve geri-alınamaz uyarılı",
    ],
    deployment: [
      "Finans servisi yatay ölçek; dönem-sonu işleri ayrı worker (Kubernetes)",
      "Ledger olayları outbox ile rapor/konsolidasyon servislerine",
      "Shared hosting'de tek-şirket temel muhasebe profili",
    ],
    eca: [
      ECA_BOUND,
      "Olay: fatura kesildi → ledger kaydı oluştur + KDV hesapla + e-fatura kuyruğuna al (idempotent, zincir ≤6)",
      "Olay: dönem kapandı → geriye dönük kaydı kilitle + mizan anlık görüntüsü al (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI mutabakat/anomali tespiti ve sınıflandırma önerir; ledger kaydını veya dönem kapanışını kendisi yapamaz",
    ],
    testing: [
      "Çift-taraflı kayıt dengesi (borç=alacak) için değişmezlik testi",
      "KDV/vergi hesabı sınır-değer testleri",
      "Fatura→ledger→beyan kullanıcı yolculuğu; düzelene dek en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: görev ayrılığı (SoD) ve onay yetkisi rol bazlı",
      "A09 Logging: değişmez finansal audit izi",
      "A04 Insecure Design: dönem kilidi ve ters-kayıt ile bütünlük",
    ],
    integration: [
      "Finance, Sales/Purchase (fatura olayları) ve Treasury (tahsilat) ile entegre",
      "Vergi otoritesi (GİB) entegrasyonu e-fatura/beyan için",
      "Konsolidasyon ve FP&A bu ledger'ı tüketir",
    ],
    moduleUsage: [
      "Finans & Muhasebe app'i tüm ürün ailesine ledger ve mali raporlama sağlar",
      "Diğer app'ler gelir/gider olaylarını bu finans sözleşmesine yayınlar",
    ],
  },

  "s-accounting": {
    featureDefs: [
      "Muhasebe ArcheType'ı (TR): hesap planı, yevmiye, mizan, e-fatura ve KDV beyanı",
      "Çift-taraflı kayıt, dönem yönetimi ve resmi defter çıktıları",
      "Odoo/Logo muadili; GİB e-fatura/e-arşiv entegrasyonu çekirdek",
    ],
    security: [
      "Yevmiye kayıtları tenant_id RLS; SoD ile kayıt/onay ayrımı",
      "Resmi defter değişmez; düzeltme yalnız ters-kayıtla ve izli",
      "Vergi kimliği/IBAN maskeli; e-fatura imza anahtarı kasada",
    ],
    codeOptimization: [
      "Yevmiye kalemi değişmez; bakiye hesap+dönem üzerinden türetilir",
      "Hesap planı ağacı önbellekli; mizan artımlı toplanır",
      "Tutarlar ondalık (decimal) tip; yuvarlama tek noktada",
    ],
    securityOptimization: [
      "Dönem kapanışı kayıtları kilitler; açma platform owner onayı + iz",
      "KDV oran tablosu sürümlü; geçmiş beyan dokunulmaz",
      "e-Fatura gönderimi idempotent; çift gönderim engellenir",
    ],
    performance: [
      "Mizan/bilanço hesap-dönem bileşik indeksiyle hızlı",
      "Yevmiye listesi sayfalı; büyük hacimde imleç tabanlı",
      "Beyan üretimi dönem projeksiyonundan",
    ],
    mobileApps: [
      "Mobilde onay ve özet mali pano; tam muhasebe masaüstü",
      "iOS/Android'de e-fatura durumu görüntüleme",
      "Dar ekranda kritik onay kuyruğu",
    ],
    wcag: [
      "Yevmiye/mizan tabloları klavye+okuyucu erişimli; borç/alacak metinle",
      "Negatif/kırmızı bakiye renk dışında işaretle; kontrast 7:1",
      "Beyan formu alan-etiket ilişkili ve hata bildirimli",
    ],
    deployment: [
      "Muhasebe servisi yatay ölçek; e-fatura gönderici ayrı worker",
      "Beyan/defter olayları outbox ile arşiv ve raporlamaya",
      "Shared hosting'de tek-şirket muhasebe + zamanlanmış beyan",
    ],
    eca: [
      ECA_BOUND,
      "Olay: yevmiye kaydı onaylandı → mizanı güncelle + KDV birikimini işle (idempotent, zincir ≤6)",
      "Olay: KDV dönemi geldi → beyan taslağı üret + sorumluya gönder (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI hesap kodu/sınıflandırma ve mutabakat önerir; yevmiye kaydını veya beyanı kendisi onaylayamaz",
    ],
    testing: [
      "Borç=alacak denge değişmezliği testi",
      "KDV beyan hesabı dönem-bazlı doğruluk testi",
      "e-Fatura gönderim idempotency + imza testi",
    ],
    owasp: [
      "A01 Access Control: SoD ve dönem kilidi yetkisi",
      "A08 Integrity: resmi defter değişmezliği + imza",
      "A09 Logging: tüm muhasebe kayıtları forensic iz",
    ],
    integration: [
      "Accounting, Sales/Purchase fatura olaylarını ledger'a alır",
      "GİB e-fatura/e-arşiv ile entegre",
      "Konsolidasyon ve raporlama bu defteri tüketir",
    ],
    moduleUsage: [
      "Accounting ArcheType'ı Finans app'inde resmi muhasebe otoritesidir",
      "Diğer app'ler mali olaylarını bu muhasebe sözleşmesine yansıtır",
    ],
  },

  "s-billing": {
    featureDefs: [
      "Faturalama/Abonelik ArcheType'ı: kullanım/abonelik bazlı ücretlendirme, fatura döngüsü, tahsilat",
      "Plan, fiyatlandırma, kupon ve proration; SaaS gelir altyapısı",
      "Stripe/Chargebee muadili; yinelenen tahsilat ve dunning",
    ],
    security: [
      "Fatura/abonelik tenant_id RLS; ödeme token'la (PCI dışı)",
      "Fiyat/plan değişikliği mevcut aboneleri korur ve izlenir",
      "İade/iptal yetki+iz; istem dışı tahsilat engellenir",
    ],
    codeOptimization: [
      "Ücret hesabı (kullanım×fiyat) saf; proration anlık hesap",
      "Fatura üretimi idempotent; döngü zamanlanmış iş",
      "Fiyatlandırma kuralları tablodan; kod içine gömülü fiyat yok",
    ],
    securityOptimization: [
      "Dunning (başarısız ödeme yeniden deneme) sınırlı + izli",
      "Plan sürümleme ile geçmiş fiyat sözleşmesi korunur",
      "Webhook imza-doğrulamalı; sahte ödeme bildirimi reddi",
    ],
    performance: [
      "Toplu fatura üretimi pik günde kuyruk + parçalı işleme",
      "Kullanım toplama (metering) akış temelli, yüksek hacme ölçeklenir",
      "Abonelik panosu özet okuma-modelinden",
    ],
    mobileApps: [
      "Mobilde abonelik self-servis (yükselt/iptal) ve fatura görüntüleme",
      "iOS/Android push ile ödeme/yenileme hatırlatma",
      "Dar ekranda fatura özeti net",
    ],
    wcag: [
      "Plan/fatura ekranı klavye+okuyucu erişimli; tutarlar metinle",
      "İptal akışı kolay bulunur (karanlık desen yok); kontrast 7:1",
      "Ödeme hatası açık ve eyleme dönük bildirilir",
    ],
    deployment: [
      "Faturalama servisi ölçeklenir; metering ayrı akış işleyici",
      "Fatura/ödeme olayları outbox ile muhasebe/gelir-tanımaya",
      "Shared hosting'de basit abonelik + zamanlanmış fatura",
    ],
    eca: [
      ECA_BOUND,
      "Olay: fatura döngüsü geldi → kullanımı topla + fatura kes + tahsil et (idempotent, zincir ≤6)",
      "Olay: ödeme başarısız → dunning başlat; tükenince aboneliği askıya al (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI fiyatlandırma/churn önerisi ve fatura anomalisi tespit eder; tahsilatı veya plan değişimini kendisi yapamaz",
    ],
    testing: [
      "Proration ve kullanım-bazlı ücret sınır-değer testleri",
      "Dunning akışı (başarısız ödeme yeniden deneme) testi",
      "Abonelik döngüsü kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: istem dışı yenileme/karanlık desen engellenir",
      "A02 Cryptographic Failures: ödeme token'la, webhook imzalı",
      "A09 Logging: fatura/iade/plan kararları iz",
    ],
    integration: [
      "Billing, Payment (tahsilat) ve Revenue Recognition (gelir) ile entegre",
      "Abone CRM müşteri kaydıyla ilişkili",
      "Fatura muhasebe ledger'ına yansır",
    ],
    moduleUsage: [
      "Billing ArcheType'ı Finans app'inde yinelenen gelir altyapısını sağlar",
      "SaaS, abonelik-ticaret ve hizmet app'leri bu faturalama sözleşmesini tüketir",
    ],
  },

  "s-treasury": {
    featureDefs: [
      "Hazine/Nakit Akışı ArcheType'ı: banka hesapları, nakit pozisyonu, likidite ve ödeme yürütme",
      "Banka mutabakatı, nakit tahmini ve borç/yatırım takibi",
      "Çok-banka, çok-para-birimi nakit yönetimi",
    ],
    security: [
      "Banka hesabı/IBAN tenant_id RLS + maskeleme; erişim dar rol",
      "Ödeme yürütme çift onay + step-up; tek kişi tek başına gönderemez",
      "Banka entegrasyon anahtarı kasada; mutabakat değişmez izli",
    ],
    codeOptimization: [
      "Nakit pozisyonu hareketlerden türetilir; tahmin saf model",
      "Banka mutabakatı eşleştirme algoritması; eşleşmeyen kuyruğa",
      "Para birimi dönüşümü tek kaynak kurdan",
    ],
    securityOptimization: [
      "Ödeme dosyası imzalı; değiştirilmiş dosya reddi",
      "Onay limitleri rol+tutar allowlist'i",
      "Banka API hatası geri-çekilmeli; çift ödeme idempotency ile önlenir",
    ],
    performance: [
      "Mutabakat toplu/asenkron; büyük ekstrede parçalı eşleştirme",
      "Nakit pozisyonu özet projeksiyondan anlık",
      "Tahmin hesabı önbellekli, girdi değişiminde yenilenir",
    ],
    mobileApps: [
      "Mobilde ödeme onayı (yüksek tutar step-up) ve nakit özeti",
      "iOS/Android push ile likidite uyarısı",
      "Dar ekranda onay bekleyen ödeme kuyruğu",
    ],
    wcag: [
      "Nakit/banka tabloları klavye+okuyucu erişimli; tutarlar metinle",
      "Pozitif/negatif likidite renk dışında metin+ikonla; kontrast 7:1",
      "Ödeme onayı açık, geri-alınamaz uyarılı",
    ],
    deployment: [
      "Hazine servisi banka entegrasyonu ayrı worker; oran-sınırlı",
      "Ödeme/mutabakat olayları outbox ile muhasebeye",
      "Shared hosting'de tek-banka temel nakit takibi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: banka ekstresi geldi → otomatik mutabakat + eşleşmeyeni incelemeye al (idempotent, zincir ≤6)",
      "Olay: likidite eşik altına düştü → hazine sorumlusuna uyarı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI nakit tahmini ve mutabakat eşleştirme önerir; ödeme yürütmeyi kendisi yapamaz",
    ],
    testing: [
      "Banka mutabakat eşleştirme doğruluk testi",
      "Ödeme idempotency testi (çift ödeme yok)",
      "Onay limiti step-up tetik testi",
    ],
    owasp: [
      "A01 Access Control: ödeme yürütme çift onay + limit",
      "A08 Integrity: ödeme dosyası imzası",
      "A09 Logging: tüm ödeme/mutabakat kararları iz",
    ],
    integration: [
      "Treasury, Accounting (mutabakat) ve Payment (tahsilat) ile entegre",
      "Banka API'leri ipaas/adaptör katmanından",
      "Nakit tahmini FP&A bütçesini besler",
    ],
    moduleUsage: [
      "Treasury ArcheType'ı Finans app'inde nakit/likidite otoritesidir",
      "Muhasebe ve FP&A app'leri hazine verisini tüketir",
    ],
  },

  "s-tax-compliance": {
    featureDefs: [
      "Vergi Uyumu / e-Fatura ArcheType'ı: KDV/ÖTV hesaplama, e-fatura/e-arşiv, beyan ve mutabakat",
      "GİB entegrasyonu, vergi kodları ve istisna yönetimi",
      "Çok-yargı-bölgesi vergi kuralları yapılandırılabilir",
    ],
    security: [
      "Vergi verisi tenant_id RLS; mükellef bilgisi maskeli",
      "e-Fatura imza anahtarı kasada; gönderim değişmez izli",
      "Vergi oran/kural değişikliği yetki+sürümle korunur",
    ],
    codeOptimization: [
      "Vergi hesabı kural motorundan; ülke/kategori bazlı oran tablosu",
      "Beyan toplama dönem projeksiyonundan; artımlı",
      "İstisna/muafiyet kuralları bildirimsel (declarative)",
    ],
    securityOptimization: [
      "Geçmiş dönem beyanı dokunulmaz; düzeltme beyanı ayrı izli",
      "Oran tablosu sürümlü; yürürlük tarihiyle uygulanır",
      "GİB gönderimi idempotent; çift gönderim reddi",
    ],
    performance: [
      "Yüksek hacimli e-fatura için kuyruk + toplu gönderim",
      "Beyan hesabı dönem indeksiyle hızlı",
      "Vergi kuralı değerlendirmesi önbellekli",
    ],
    mobileApps: [
      "Mobilde beyan durumu ve e-fatura gönderim takibi",
      "iOS/Android push ile beyan son-tarih uyarısı",
      "Dar ekranda vergi özeti",
    ],
    wcag: [
      "Vergi/beyan formları alan-etiket ilişkili ve hata bildirimli",
      "Tutar/oran metinle; yalnız renk değil; kontrast 7:1",
      "Beyan tabloları klavye+okuyucu erişimli",
    ],
    deployment: [
      "e-Fatura gönderici ayrı worker; GİB oran-sınırına uyumlu",
      "Beyan olayları outbox ile muhasebeye",
      "Shared hosting'de temel KDV + manuel beyan",
    ],
    eca: [
      ECA_BOUND,
      "Olay: fatura oluştu → vergi hesapla + e-fatura/e-arşiv gönderimine al (idempotent, zincir ≤6)",
      "Olay: beyan dönemi geldi → beyan taslağı üret + son-tarih hatırlat (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI vergi kodu/istisna sınıflandırması önerir; beyanı veya e-fatura gönderimini kendisi onaylayamaz",
    ],
    testing: [
      "KDV/ÖTV hesabı çok-senaryo doğruluk testi",
      "e-Fatura gönderim idempotency + imza testi",
      "Beyan dönem-kapanış kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: beyan/e-fatura imza ve değişmezlik",
      "A01 Access Control: vergi kuralı değişikliği yetkisi",
      "A09 Logging: vergi kararları forensic iz",
    ],
    integration: [
      "Tax-compliance, Accounting (vergi kayıtları) ve Sales (fatura) ile entegre",
      "GİB e-fatura/e-arşiv/e-defter ile entegre",
      "Çok-yargı bölgesi için jurisdiction resolver'a bağlı",
    ],
    moduleUsage: [
      "Tax-compliance ArcheType'ı Finans app'inde vergi otoritesidir",
      "Ticaret ve muhasebe app'leri vergi hesabını bu sözleşmeden alır",
    ],
  },

  "app-finance-x-stone": {
    featureDefs: [
      "Finans kırılımının Taş (alt-yetenek) seviyesi örneği: bir muhasebe yeteneğinin alt-parça tarifi",
      "Taş, bir ArcheType'ın içindeki çalışabilir alt-yetenektir (ör. mutabakat motoru)",
      "Örnek dal; finans yeteneğinin granülerlik içindeki yerini gösterir",
    ],
    security: [
      "Taş seviyesi yetenek üst ArcheType'ın tenant izolasyonuna uyar",
      "Finansal alt-yetenek girdi doğrulaması sınırda yapılır",
      "Hassas mali alan üst katmanda maskelenir",
    ],
    codeOptimization: [
      "Finans taşı tek sorumluluk; saf hesap çekirdeği",
      "Üst ArcheType ile tipli arayüz; gevşek bağ",
      "Tekrar eden mali mantık paylaşılan yardımcıya",
    ],
    securityOptimization: [
      "Alt-yetenek en az ayrıcalıkla; gereksiz mali erişim talep etmez",
      "Girdi normalizasyonu ile finansal enjeksiyon yüzeyi daraltılır",
      "Yetenek değişikliği sürümlü",
    ],
    performance: [
      "Finans taşı hesabı önbelleklenebilir; tekrar hesaplanmaz",
      "Tembel başlatma; kullanılmadıkça yük yok",
      "Çıktı küçük ve serileştirilebilir",
    ],
    mobileApps: [
      "Yeteneğin UI'si varsa mobilde tek sütun ve okunur",
      "iOS/Android içinde bağımsız çalışabilir",
      "Dar ekranda mali özet kartı",
    ],
    wcag: [
      "Alt-yetenek etkileşimi klavye erişimli ve adlandırılmış",
      "Mali durum metinle de bildirilir; kontrast 7:1",
      "Hata mesajı ilişkilendirilmiş ve sesli",
    ],
    deployment: [
      "Finans taşı üst ArcheType ile birlikte dağıtılır",
      "Swarm/Kubernetes'te üst yetenekle ölçeklenir",
      "Shared hosting'de istemci-içi çalışabilir",
    ],
    eca: [
      ECA_BOUND,
      "Olay: alt-yetenek girdisi geçersiz → sınırda reddet + üst finans akışına hata yay (idempotent, zincir ≤6)",
      "Taş kendi başına otomasyon tutmaz; üst ArcheType kuralına bağlanır",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI bu finans yeteneğinin tarifini önerebilir; üst muhasebe ArcheType'ını kendisi üretemez",
    ],
    testing: [
      "Finans taşı birim testi (mali hesap girdi/çıktı tablosu)",
      "Üst ArcheType sözleşme entegrasyon testi",
      "UI varsa erişilebilirlik mikro-yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A03 Injection: mali girdi sınırda doğrulanır",
      "A04 Insecure Design: alt-yetenek en-az-ayrıcalık",
      "Hatalar audit'e bağlanır",
    ],
    integration: [
      "Finans taşı üst ArcheType'a (ör. Accounting) tipli arayüzle bağlanır",
      "Ledger sözleşmesini tüketir; doğrudan DB'ye yazmaz",
      "Çıktısı üst finans akışında kullanılır",
    ],
    moduleUsage: [
      "Finans taşı bir alt-yetenektir; bağımsız sunulmaz, üst ArcheType içinde kullanılır",
    ],
  },

  "app-finance-x-molecule": {
    featureDefs: [
      "Finans kırılımının Molekül seviyesi örneği: birkaç mali alanı/kuralı birleştiren bileşen",
      "Molekül, finans alt-yeteneğinin çalışabilir en küçük bileşenidir (ör. vergi satırı hesabı)",
      "Örnek dal; finans bileşeninin granülerlik içindeki yeri",
    ],
    security: [
      "Molekül mali girdi doğrulamasını bileşen sınırında yapar",
      "Yalnız kapsamındaki mali alanlara erişir",
      "Tenant bağlamına bağlı; bağlamsız çağrı reddi",
    ],
    codeOptimization: [
      "Finans molekülü saf fonksiyon; yan etki kenarda",
      "Girdi/çıktı tipli; ondalık tutar tipi",
      "Tekrar eden mantık paylaşılan yardımcıya",
    ],
    securityOptimization: [
      "En az ayrıcalık; gereksiz mali capability talep etmez",
      "Girdi normalizasyonuyla enjeksiyon daraltılır",
      "Bağımlılık minimal ve denetli",
    ],
    performance: [
      "Mali hesap önbelleklenebilir saf molekül",
      "Tembel başlatma",
      "Küçük serileştirilebilir çıktı",
    ],
    mobileApps: [
      "Molekül UI'si mobilde tek sütun",
      "iOS/Android offline hesaplanabilir",
      "Dar ekranda mali alan net",
    ],
    wcag: [
      "Bileşen etkileşimi klavye erişimli ve adlandırılmış",
      "Mali durum metinle; kontrast 7:1",
      "Hata ilişkilendirilmiş ve sesli",
    ],
    deployment: [
      "Finans molekülü üst yetenekle dağıtılır",
      "Üst ArcheType ile ölçeklenir",
      "Shared hosting'de istemci-içi",
    ],
    eca: [
      ECA_BOUND,
      "Olay: molekül mali girdisi geçersiz → sınırda reddet + üst yeteneğe hata (idempotent, zincir ≤6)",
      "Molekül üst seviye kurala bağlanır; bağımsız tetikleyici tutmaz",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI molekül mali tarifini önerebilir; üst ArcheType veya app'i kendisi üretemez",
    ],
    testing: [
      "Mali molekül birim testi (girdi/çıktı tablosu)",
      "Üst yetenek entegrasyon testi",
      "UI varsa erişilebilirlik mikro-yolculuğu",
    ],
    owasp: [
      "A03 Injection: mali girdi sınırda doğrulanır",
      "A04 Insecure Design: en-az-ayrıcalık tasarım",
      "Hatalar izlenir",
    ],
    integration: [
      "Finans molekülü üst taş/ArcheType'a tipli arayüzle bağlanır",
      "Ledger/vergi sözleşmesini tüketir",
      "Çıktısı üst finans akışında",
    ],
    moduleUsage: [
      "Finans molekülü bir bileşendir; bağımsız sunulmaz, üst yetenek içinde kullanılır",
    ],
  },

  "app-finance-x-element": {
    featureDefs: [
      "Finans kırılımının Element (alan/kural) seviyesi: tek bir mali alan veya doğrulama kuralı",
      "Element, finans sözleşmesindeki en küçük anlamlı alan/kural (ör. KDV oranı alanı)",
      "Örnek dal; mali alan kuralının granülerlikteki yeri",
    ],
    security: [
      "Mali alan doğrulaması sunucuda zorunlu; istemci yeterli değil",
      "Hassas mali alan (IBAN/tutar) maskeleme/yetki kuralına tabi",
      "Alan yazımı tenant+rol yetkisiyle sınırlı",
    ],
    codeOptimization: [
      "Mali alan kuralı saf doğrulayıcı; tek sorumluluk",
      "Tutar tipi ondalık; Zod şemasıyla doğrulanır",
      "Tekrar eden mali kural paylaşılan doğrulayıcıya",
    ],
    securityOptimization: [
      "Allowlist temelli doğrulama; beklenmeyen mali girdi reddi",
      "Tutar/biçim sınırıyla taşma daraltılır",
      "Hassas alan için field-level yetki",
    ],
    performance: [
      "Mali alan doğrulaması O(1) saf hesap",
      "Önbelleklenebilir; tekrar çalışmaz",
      "Toplu doğrulamada vektörel",
    ],
    mobileApps: [
      "Mali alan mobilde doğru klavye/maske (tutar)",
      "iOS/Android offline doğrulanabilir",
      "Hata durumu dar ekranda okunur",
    ],
    wcag: [
      "Mali alan etiketi alanla programatik ilişkili",
      "Hata alanla bağlı ve sesli; kontrast 7:1",
      "Zorunluluk metin/ikonla",
    ],
    deployment: [
      "Mali alan kuralı finans şemasının parçası",
      "Her profilde istemci+sunucu doğrulaması",
      "Shared hosting'de çift doğrulama",
    ],
    eca: [
      ECA_BOUND,
      "Olay: mali alan eşiği aştı (ör. limit) → üst molekül kuralına sinyal (idempotent, zincir ≤6)",
      "Element tek başına otomasyon yazmaz; üst kurala girdi sağlar",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI mali alan/kural önerebilir; maskeleme veya yetki kuralını kendisi değiştiremez",
    ],
    testing: [
      "Mali alan sınır-değer birim testleri",
      "Hassas alan maskeleme testi (ham değer sızmaz)",
      "Form bağlamında alan-erişilebilirlik mikro-yolculuğu",
    ],
    owasp: [
      "A03 Injection: mali alan allowlist ile doğrulanır",
      "A02 Cryptographic Failures: hassas mali alan maskeli/şifreli",
      "Alan değişikliği izli",
    ],
    integration: [
      "Mali element, üst molekül ve ArcheType field sözleşmesine bağlanır",
      "Finans şema doğrulamasına dahil",
      "Surface projeksiyonunda alan görünürlüğü bu kurala göre",
    ],
    moduleUsage: [
      "Mali element bir alan/kuraldır; bağımsız sunulmaz, ArcheType field tanımının parçası",
    ],
  },

  "app-finance-x-atom": {
    featureDefs: [
      "Finans kırılımının Atom seviyesi: bölünemez mali ilkel (ör. para tutarı değer nesnesi)",
      "Atom, finansta daha alt parçaya ayrılmayan ilkel sözleşme birimi",
      "Örnek dal; mali atomun granülerlik tabanındaki yeri",
    ],
    security: [
      "Mali atom değişmez (immutable); beklenmeyen mutasyon engellenir",
      "Atom değeri sınırda doğrulanır (geçerli para/tutar)",
      "Hassas mali atom üst katmanda maskelenir",
    ],
    codeOptimization: [
      "Para tutarı atomu değer nesnesi; eşitlik değere göre",
      "Ondalık tip; kayan-nokta finansal hata önlenir",
      "Atomlar paylaşılır, kopya yerine referans",
    ],
    securityOptimization: [
      "En dar biçim doğrulaması; fazlalık girdi reddi",
      "Güvenli serileştirme; enjekte edilebilir biçim üretmez",
      "Bağımlılıksız; saldırı yüzeyi minimal",
    ],
    performance: [
      "Mali atom doğrulaması sabit zaman",
      "Değer internalize edilir; bellek tekrarı az",
      "Karşılaştırma ucuz",
    ],
    mobileApps: [
      "Mali atom girdisi mobilde doğru klavye/maske",
      "iOS/Android offline doğrulanabilir",
      "Tutar gösterimi taşmaz",
    ],
    wcag: [
      "Mali atom girdisi etiketli ve biçim ipuçlu",
      "Hata metinle; kontrast 7:1",
      "Değer okuyucuya anlamlı sunulur",
    ],
    deployment: [
      "Mali atom tipi finans şema çekirdeğinde",
      "Her profilde aynı doğrulama",
      "Shared hosting dahil istemci-içi",
    ],
    eca: [
      ECA_BOUND,
      "Atom seviyesi otomasyon tetiklemez; üst kurallara mali değer sağlar",
      "Olay: tutar tanımlı aralık dışında → üst element kuralı reddeder (idempotent)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI mali atom tipi önerebilir; ilkel sözleşmeyi tek başına yazamaz, insan onayı gerekir",
    ],
    testing: [
      "Mali atom biçim/sınır birim testleri",
      "Değişmezlik testi; mutasyon başarısız",
      "Tutar serileştirme/round-trip testi",
    ],
    owasp: [
      "A03 Injection: tutar değeri biçim-doğrulanır",
      "A08 Integrity: mali atom değişmez ve doğrulanmış",
      "Kabul/red izlenebilir",
    ],
    integration: [
      "Mali atom, element ve field tanımlarının yapı taşı",
      "Finans tip sistemine dahil",
      "Üst seviyeler atomu birleştirir",
    ],
    moduleUsage: [
      "Mali atom bölünemez birimdir; bağımsız sunulmaz, üst mali tip tanımlarında kullanılır",
    ],
  },

  "s-ap-automation": {
    featureDefs: [
      "AP Otomasyonu ArcheType'ı: tedarikçi faturası yakalama (OCR), kodlama, 3-way match ve ödeme",
      "Onay akışı ve istisna kuyruğu; faturadan ödemeye uçtan uca",
      "Tedarikçi portalı ve erken-ödeme indirimi takibi",
    ],
    security: [
      "Fatura/tedarikçi verisi tenant_id RLS; banka değişimi step-up onay",
      "OCR çıktısı insan-doğrulamasına tabi; otomatik ödeme eşik+çift onay",
      "Sahte fatura için tedarikçi doğrulama + duplicate kontrolü",
    ],
    codeOptimization: [
      "OCR→alan eşleme pipeline'ı aşamalı; her aşama tek sorumluluk",
      "3-way match karşılaştırması saf; belge değişiminde yeniden değerlendirme",
      "Tedarikçi tekilleştirme indeksli eşleştirmeyle",
    ],
    securityOptimization: [
      "Otomatik ödeme yalnız yüksek-güven eşleşmede; düşük güven insana",
      "Duplicate fatura tespiti (numara+tutar+tedarikçi) ile çift ödeme önlenir",
      "Tedarikçi banka değişimi soğuma süresi + çift onay",
    ],
    performance: [
      "Toplu fatura işleme kuyrukla; OCR asenkron",
      "Eşleştirme sıcak yolu indeksli; istisnalar ayrı kuyruk",
      "Tedarikçi bakiye özeti projeksiyondan",
    ],
    mobileApps: [
      "Mobilde fatura onayı ve istisna çözümü",
      "iOS/Android'de faturayı fotoğrafla yakalama",
      "Push ile onay bekleyen fatura bildirimi",
    ],
    wcag: [
      "Fatura/eşleştirme ekranı klavye+okuyucu erişimli; tutarlar metinle",
      "Eşleşme durumu (uyumlu/uyumsuz) renk dışında işaretle; kontrast 7:1",
      "Onay aksiyonu açık ve geri-alınamaz uyarılı",
    ],
    deployment: [
      "OCR servisi ayrı çıkarım worker'ı; AP servisi yatay ölçek",
      "Ödeme olayları outbox ile hazine/muhasebeye",
      "Shared hosting'de manuel kodlama + temel eşleştirme",
    ],
    eca: [
      ECA_BOUND,
      "Olay: fatura yakalandı → OCR + kodla + 3-way match dene (idempotent, zincir ≤6)",
      "Olay: eşleşme uyuşmazlığı → istisna kuyruğuna al + sorumluya bildir (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI fatura alanlarını çıkarır/kodlar ve eşleştirme önerir; ödemeyi kendisi yürütemez",
    ],
    testing: [
      "OCR→kodlama→eşleştirme doğruluk testi (örnek fatura seti)",
      "Duplicate fatura tespiti testi (çift ödeme yok)",
      "Fatura→onay→ödeme kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: duplicate/sahte fatura tasarımca engellenir",
      "A01 Access Control: ödeme/onay yetkisi rol bazlı",
      "A09 Logging: fatura/ödeme kararları forensic iz",
    ],
    integration: [
      "AP-automation, Purchase (sipariş), Treasury (ödeme) ve Accounting (kayıt) ile entegre",
      "OCR/tedarikçi portal harici servislerle",
      "Erken-ödeme indirimi hazine nakit planına yansır",
    ],
    moduleUsage: [
      "AP-automation ArcheType'ı Finans app'inde borç-hesapları otomasyonunu sağlar",
      "Satınalma ve muhasebe app'leri bu fatura-işleme sözleşmesini tüketir",
    ],
  },

  "s-consolidation": {
    featureDefs: [
      "Çok-para-birimi Konsolidasyon ArcheType'ı: çoklu şirket mali tablolarını tek raporda birleştirir",
      "Şirketler-arası eliminasyon, FX çevrimi ve azınlık payı",
      "Grup mizanı, konsolide bilanço ve gelir tablosu",
    ],
    security: [
      "Şirket bazlı erişim; grup konsolidasyonu yalnız yetkili rol (tenant_id RLS)",
      "FX kurları ve eliminasyon kuralları sürümlü+izli",
      "Konsolide rapor dönem kilidiyle korunur",
    ],
    codeOptimization: [
      "Konsolidasyon hesabı şirket→grup artımlı toplama",
      "FX çevrimi tek kaynak kurdan; çevrim farkı ayrı hesapta",
      "Eliminasyon kuralları bildirimsel tablodan",
    ],
    securityOptimization: [
      "Eliminasyon/FX kuralı değişimi onaylı; geçmiş konsolidasyon dokunulmaz",
      "Kur kaynağı güvenilir+imzalı; manipülasyon izlenir",
      "Konsolidasyon koşusu idempotent",
    ],
    performance: [
      "Grup konsolidasyonu toplu/asenkron; büyük grup için parçalı",
      "Konsolide özet projeksiyondan anlık",
      "Şirketler-arası eşleştirme indeksli",
    ],
    mobileApps: [
      "Mobilde konsolide grup özeti ve uyarılar",
      "iOS/Android'de dönem kapanış durumu",
      "Dar ekranda şirket bazlı katkı kartı",
    ],
    wcag: [
      "Konsolide tablolar klavye+okuyucu erişimli; tutarlar metinle",
      "Çevrim farkı/eliminasyon renk dışında işaretle; kontrast 7:1",
      "Dönem seçimi ve şirket filtresi erişilebilir",
    ],
    deployment: [
      "Konsolidasyon koşusu ayrı worker; dönem-sonu yoğun",
      "Konsolide olaylar outbox ile raporlamaya",
      "Shared hosting'de sınırlı şirket sayısı",
    ],
    eca: [
      ECA_BOUND,
      "Olay: tüm şirket dönemleri kapandı → konsolidasyon koşusunu başlat + eliminasyon uygula (idempotent, zincir ≤6)",
      "Olay: şirketler-arası bakiye uyuşmazlığı → uyarı + mutabakat görevi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI şirketler-arası eşleştirme ve eliminasyon önerir; konsolidasyon koşusunu kendisi kilitleyemez",
    ],
    testing: [
      "FX çevrimi ve eliminasyon doğruluk testi",
      "Şirketler-arası bakiye mutabakat testi",
      "Konsolidasyon koşusu idempotency testi",
    ],
    owasp: [
      "A01 Access Control: grup konsolidasyon yetkisi dar",
      "A08 Integrity: FX/eliminasyon kuralı sürümlü+imzalı",
      "A09 Logging: konsolidasyon kararları iz",
    ],
    integration: [
      "Consolidation, her şirketin Accounting ledger'ını ve FX kaynağını tüketir",
      "Grup raporları FP&A ve yönetim raporlamasına",
      "Çok-yargı bölgesi vergi/mevzuat ile uyumlu",
    ],
    moduleUsage: [
      "Consolidation ArcheType'ı Finans app'inde grup raporlamayı sağlar",
      "Çok-şirketli holdingler bu konsolidasyon sözleşmesini tüketir",
    ],
  },

  "s-expenses": {
    featureDefs: [
      "Masraf & Seyahat ArcheType'ı: masraf fişi yakalama, politika kontrolü, onay ve geri ödeme",
      "Seyahat talebi, avans ve harcama politikası uygulaması",
      "Kart entegrasyonu ve makbuz eşleştirme",
    ],
    security: [
      "Masraf/çalışan verisi tenant_id RLS; kişisel harcama PII korunur",
      "Politika dışı harcama otomatik işaretlenir + onaya düşer",
      "Geri ödeme yetki+iz; sahte fiş için duplicate kontrolü",
    ],
    codeOptimization: [
      "Politika motoru kural tablosundan; masraf kategorisi bazlı limit",
      "Makbuz OCR→tutar eşleme; saf doğrulama",
      "Onay zinciri durum makinesi",
    ],
    securityOptimization: [
      "Limit/politika sürümlü; değişiklik geriye dönük etki analizli",
      "Duplicate makbuz tespiti ile çift geri ödeme önlenir",
      "Kart işlemi-makbuz eşleşmesi zorunlu (eşsiz harcama işaretli)",
    ],
    performance: [
      "Masraf listesi çalışan+dönem indeksiyle",
      "Toplu geri ödeme kuyrukla",
      "Politika değerlendirmesi anlık ve önbellekli",
    ],
    mobileApps: [
      "Mobil-öncelikli masraf: yoldayken fişi fotoğrafla + gönder",
      "iOS/Android offline masraf taslağı + senkron",
      "Push ile onay/red bildirimi",
    ],
    wcag: [
      "Masraf formu alan-etiket ilişkili ve hata bildirimli",
      "Politika ihlali renk dışında metin+ikonla; kontrast 7:1",
      "Onay aksiyonu klavye erişimli",
    ],
    deployment: [
      "Masraf servisi yatay ölçek; OCR ayrı worker",
      "Geri ödeme olayları outbox ile bordro/muhasebeye",
      "Shared hosting'de temel masraf + manuel onay",
    ],
    eca: [
      ECA_BOUND,
      "Olay: masraf gönderildi → politika kontrolü + makbuz eşleştir; ihlalde onaya yükselt (idempotent, zincir ≤6)",
      "Olay: masraf onaylandı → geri ödeme/bordro kuyruğuna al (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI fiş okuma/kategorize ve politika-ihlali işaretler; geri ödemeyi kendisi onaylayamaz",
    ],
    testing: [
      "Politika limiti ve kategori doğruluk testi",
      "Duplicate makbuz tespiti testi",
      "Fiş→onay→geri ödeme kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A04 Insecure Design: duplicate/politika-aşımı engellenir",
      "A01 Access Control: onay/geri ödeme yetkisi",
      "A09 Logging: masraf/geri ödeme kararları iz",
    ],
    integration: [
      "Expenses, HR (çalışan), Payroll (geri ödeme) ve Accounting (gider) ile entegre",
      "Kart sağlayıcı entegrasyonuyla işlem eşleştirme",
      "Politika kuralları kurumsal harcama politikasından",
    ],
    moduleUsage: [
      "Expenses ArcheType'ı Finans app'inde masraf/seyahat yönetimini sağlar",
      "İK ve muhasebe app'leri bu masraf sözleşmesini tüketir",
    ],
  },

  "s-fixed-assets": {
    featureDefs: [
      "Sabit Kıymet/Amortisman ArcheType'ı: varlık kaydı, amortisman hesabı, değer düşüklüğü ve elden çıkarma",
      "Çoklu amortisman yöntemi (doğrusal/azalan) ve vergi-defter ayrımı",
      "Varlık yaşam döngüsü ve envanter eşleştirme",
    ],
    security: [
      "Varlık/değer verisi tenant_id RLS; elden çıkarma yetki+iz",
      "Amortisman yöntemi değişikliği onaylı ve sürümlü",
      "Değer düşüklüğü kaydı çift onay gerektirir",
    ],
    codeOptimization: [
      "Amortisman hesabı saf fonksiyon (yöntem bazlı); dönem-bazlı çalışır",
      "Varlık durumu (aktif/atıl/elden çıkarılmış) durum makinesi",
      "Vergi ve defter amortismanı ayrı izlenir",
    ],
    securityOptimization: [
      "Amortisman koşusu idempotent; tekrar koşuda çift kayıt yok",
      "Yöntem değişimi geçmiş dönemleri korur (ileriye dönük)",
      "Elden çıkarma kâr/zarar hesabı denetlenir",
    ],
    performance: [
      "Toplu amortisman dönem-sonu asenkron",
      "Varlık listesi kategori+durum indeksiyle",
      "Amortisman tablosu önbellekli",
    ],
    mobileApps: [
      "Mobilde varlık sayımı (barkod/QR) ve durum güncelleme",
      "iOS/Android offline sayım + senkron",
      "Dar ekranda varlık özeti",
    ],
    wcag: [
      "Varlık/amortisman tabloları klavye+okuyucu erişimli; tutarlar metinle",
      "Değer düşüklüğü renk dışında işaretle; kontrast 7:1",
      "Elden çıkarma onayı açık uyarılı",
    ],
    deployment: [
      "Amortisman koşusu ayrı worker/CronJob",
      "Varlık olayları outbox ile muhasebeye",
      "Shared hosting'de temel varlık + manuel amortisman",
    ],
    eca: [
      ECA_BOUND,
      "Olay: dönem geldi → amortisman koşusu çalıştır + ledger'a kaydet (idempotent, zincir ≤6)",
      "Olay: varlık elden çıkarıldı → kâr/zarar hesapla + kaydı kapat (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI varlık sınıflandırma ve amortisman yöntemi önerir; amortisman koşusunu kendisi çalıştıramaz",
    ],
    testing: [
      "Amortisman hesabı (yöntem bazlı) doğruluk testi",
      "Amortisman koşusu idempotency testi",
      "Varlık yaşam döngüsü kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: elden çıkarma/yöntem değişimi yetkisi",
      "A08 Integrity: amortisman koşusu sürümlü ve izli",
      "A09 Logging: varlık/değer kararları iz",
    ],
    integration: [
      "Fixed-assets, Accounting (amortisman kaydı) ve Inventory (envanter eşleştirme) ile entegre",
      "Vergi amortismanı tax-compliance ile",
      "Satınalma mal kabulünden varlık oluşturma",
    ],
    moduleUsage: [
      "Fixed-assets ArcheType'ı Finans app'inde sabit kıymet yönetimini sağlar",
      "Muhasebe ve vergi app'leri amortisman verisini tüketir",
    ],
  },

  "s-fpa": {
    featureDefs: [
      "Bütçe & Tahmin (FP&A) ArcheType'ı: bütçe hazırlama, tahmin (forecast), senaryo ve varyans analizi",
      "Sürücü-temelli (driver-based) planlama ve gerçekleşen-bütçe karşılaştırma",
      "Versiyonlu bütçe ve rolling forecast",
    ],
    security: [
      "Bütçe verisi rol bazlı görünürlük (tenant_id RLS); gizli senaryo kısıtlı",
      "Bütçe onayı eşik+iz; kilitli bütçe değişmez",
      "Tahmin varsayımları sürümlü ve izlenir",
    ],
    codeOptimization: [
      "Bütçe hesabı sürücü-temelli saf model; senaryo türetimi artımlı",
      "Varyans (gerçekleşen-bütçe) anlık hesap",
      "Çok-boyutlu bütçe küpü için verimli toplama",
    ],
    securityOptimization: [
      "Bütçe sürümü kilitlenir; geçmiş plan korunur",
      "Senaryo değişimi izli; yetkisiz revizyon reddi",
      "Gerçekleşen veri salt-okuma kaynaktan (ledger)",
    ],
    performance: [
      "Bütçe küpü özet projeksiyondan; büyük boyutta önbellek",
      "Senaryo karşılaştırma anlık",
      "Rolling forecast zamanlanmış yenilenir",
    ],
    mobileApps: [
      "Mobilde bütçe onayı ve varyans uyarısı",
      "iOS/Android'de senaryo özeti görüntüleme",
      "Dar ekranda KPI/varyans kartı",
    ],
    wcag: [
      "Bütçe/varyans tabloları klavye+okuyucu erişimli; tutarlar metinle",
      "Olumlu/olumsuz varyans renk dışında işaretle; kontrast 7:1",
      "Senaryo seçimi erişilebilir",
    ],
    deployment: [
      "FP&A hesap motoru ölçeklenir; senaryo koşusu ayrı worker",
      "Bütçe/forecast olayları okuma-modeli besler",
      "Shared hosting'de temel bütçe + tek senaryo",
    ],
    eca: [
      ECA_BOUND,
      "Olay: gerçekleşen veri geldi → varyansı yeniden hesapla + eşik aşımında uyar (idempotent, zincir ≤6)",
      "Olay: forecast dönemi geldi → rolling forecast taslağı üret (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI tahmin/senaryo ve varyans açıklaması önerir; bütçeyi kendisi kilitleyemez/onaylayamaz",
    ],
    testing: [
      "Sürücü-temelli bütçe hesabı doğruluk testi",
      "Varyans hesabı (gerçekleşen-bütçe) testi",
      "Bütçe→onay→varyans kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: bütçe görünürlüğü ve onay yetkisi",
      "A08 Integrity: bütçe sürümleme ve kilit",
      "A09 Logging: bütçe/senaryo kararları iz",
    ],
    integration: [
      "FP&A, Accounting (gerçekleşen) ve Treasury (nakit tahmini) ile entegre",
      "İK/PMO kaynak planı bütçeye girer",
      "Konsolide veriden grup bütçesi",
    ],
    moduleUsage: [
      "FP&A ArcheType'ı Finans app'inde planlama ve analizi sağlar",
      "Yönetim ve PMO app'leri bütçe/varyans verisini tüketir",
    ],
  },

  "s-kyc-aml": {
    featureDefs: [
      "KYC/AML Vaka Yönetimi ArcheType'ı: kimlik doğrulama, yaptırım/PEP tarama, şüpheli işlem ve vaka",
      "Risk bazlı müşteri inceleme (CDD/EDD) ve sürekli izleme",
      "Düzenleyici raporlama (SAR/STR) ve vaka iş akışı",
    ],
    security: [
      "Kimlik/risk verisi tenant_id RLS + güçlü erişim kısıtı (yüksek hassasiyet)",
      "Tarama sonucu ve karar değişmez izli; karar değişikliği çift onay",
      "PII en-az-ayrıcalık; ham belge erişimi denetimli",
    ],
    codeOptimization: [
      "Tarama (yaptırım/PEP) listelerle eşleştirme; saf skorlayıcı",
      "Vaka durum makinesi; eskalasyon kuralları bildirimsel",
      "Sürekli izleme akış-temelli",
    ],
    securityOptimization: [
      "Eşik/kural değişimi sürümlü+onaylı; sessiz gevşetme engellenir",
      "Yanlış-pozitif/negatif izlenir; karar gerekçesi zorunlu",
      "Liste güncellemeleri imzalı kaynaktan",
    ],
    performance: [
      "Gerçek-zaman tarama düşük gecikme; toplu yeniden-tarama asenkron",
      "Eşleştirme indeksli; aday eşleşmeler kuyrukta",
      "Vaka geçmişi zaman-serisi deposunda",
    ],
    mobileApps: [
      "İnceleme kuyruğu mobil; analist telefondan karar",
      "iOS/Android push ile yüksek-risk vaka uyarısı",
      "Dar ekranda risk gerekçesi özetli",
    ],
    wcag: [
      "Risk/karar göstergeleri renk dışında etiket+metinle; kontrast 7:1",
      "Vaka kararı klavye erişimli ve geri-alınamaz onay uyarılı",
      "Gerekçe/kanıt listesi okuyucuya yapılandırılmış",
    ],
    deployment: [
      "Tarama servisi ölçeklenir; liste güncelleme ayrı worker",
      "Vaka/rapor olayları outbox ile düzenleyici raporlamaya",
      "Shared hosting'de yalnız temel kural-tarama",
    ],
    eca: [
      ECA_BOUND,
      "Olay: müşteri/işlem risk eşiğini aştı → vaka aç + işlemi beklet + incelemeye gönder (idempotent, zincir ≤6)",
      "Olay: yaptırım eşleşmesi → anında blokla + step-up + SAR/STR taslağı (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI risk skoru/eşleşme önerir ve vaka özeti çıkarır; bloklama/serbest bırakma kararını insan/eşik verir",
    ],
    testing: [
      "Yaptırım/PEP eşleştirme doğruluk + yanlış-pozitif testi",
      "Vaka eskalasyon iş akışı testi",
      "Yüksek-risk işlem→blokla→incele kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: KYC/AML verisine sıkı erişim",
      "A04 Insecure Design: eşik gevşetme/reward-hacking izlenir",
      "A09 Logging: tüm tarama/karar forensic iz (düzenleyici kanıt)",
    ],
    integration: [
      "KYC/AML, müşteri kaydı (CRM/party) ve ödeme/işlem akışıyla entegre",
      "Yaptırım/PEP liste sağlayıcılarıyla",
      "Fraud/Trust sinyalleriyle ortak risk görünümü",
    ],
    moduleUsage: [
      "KYC/AML ArcheType'ı Finans app'inde uyum/risk vaka yönetimini sağlar",
      "Ödeme, bankacılık ve pazaryeri app'leri bu uyum sözleşmesini tüketir",
    ],
  },

  "s-revenue-recognition": {
    featureDefs: [
      "Gelir Tanıma ArcheType'ı: ASC 606 / IFRS 15 uyumlu performans yükümlülüğü ve gelir dağıtımı",
      "Sözleşme bazlı gelir programı, ertelenmiş gelir ve tahakkuk",
      "Çok-eleman düzenleme (bundle) ve değişiklik (modification) yönetimi",
    ],
    security: [
      "Gelir/sözleşme verisi tenant_id RLS; tanıma kuralı değişimi onaylı",
      "Gelir programı dönem kilidiyle korunur; değişmez izli",
      "Ertelenmiş gelir hesabı denetlenebilir",
    ],
    codeOptimization: [
      "Gelir dağıtımı (allocation) saf hesap; performans yükümlülüğü bazlı",
      "Gelir programı türetilir; değişiklikte yeniden değerlendirme",
      "Bundle ayrıştırma kural tablosundan",
    ],
    securityOptimization: [
      "Tanıma kuralı sürümlü; geçmiş tanıma dokunulmaz",
      "Sözleşme değişikliği (modification) izli ve onaylı",
      "Gelir koşusu idempotent",
    ],
    performance: [
      "Gelir tanıma koşusu dönem-sonu asenkron",
      "Sözleşme bazlı program indeksli",
      "Ertelenmiş gelir özeti projeksiyondan",
    ],
    mobileApps: [
      "Mobilde gelir özeti ve dönem kapanış durumu",
      "iOS/Android'de tanıma onayı (yetkili)",
      "Dar ekranda ertelenmiş gelir kartı",
    ],
    wcag: [
      "Gelir programı tabloları klavye+okuyucu erişimli; tutarlar metinle",
      "Tahakkuk/ertelenmiş ayrımı renk dışında metinle; kontrast 7:1",
      "Dönem seçimi ve onay erişilebilir",
    ],
    deployment: [
      "Gelir tanıma koşusu ayrı worker; dönem-sonu yoğun",
      "Gelir olayları outbox ile muhasebe/konsolidasyona",
      "Shared hosting'de temel tanıma + manuel program",
    ],
    eca: [
      ECA_BOUND,
      "Olay: sözleşme imzalandı → performans yükümlülüklerini ayrıştır + gelir programı oluştur (idempotent, zincir ≤6)",
      "Olay: dönem geldi → tanınacak geliri hesapla + ledger'a kaydet (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI performans yükümlülüğü ayrıştırma ve dağıtım önerir; gelir tanıma koşusunu kendisi kilitleyemez",
    ],
    testing: [
      "Gelir dağıtımı (ASC606/IFRS15) çok-senaryo doğruluk testi",
      "Sözleşme değişikliği yeniden-değerlendirme testi",
      "Sözleşme→program→tanıma kullanıcı yolculuğu; en çok 6 tur",
    ],
    owasp: [
      "A08 Integrity: tanıma kuralı sürümlü, dönem kilitli",
      "A01 Access Control: tanıma onay yetkisi",
      "A09 Logging: gelir kararları forensic iz",
    ],
    integration: [
      "Revenue-recognition, Billing (sözleşme/fatura) ve Accounting (gelir kaydı) ile entegre",
      "Abonelik analitiğine gelir verisi sağlar",
      "Konsolidasyona grup geliri",
    ],
    moduleUsage: [
      "Revenue-recognition ArcheType'ı Finans app'inde standart-uyumlu gelir tanımayı sağlar",
      "SaaS/faturalama ve muhasebe app'leri bu gelir sözleşmesini tüketir",
    ],
  },

  "s-subscription-analytics": {
    featureDefs: [
      "Abonelik Analitiği ArcheType'ı: MRR/ARR, churn, NRR, kohort ve LTV metrikleri",
      "Abonelik hareketleri (yeni/yükseltme/düşürme/iptal) ayrıştırması",
      "Tahmin ve sağlık skoru ile gelir öngörüsü",
    ],
    security: [
      "Analitik verisi tenant_id RLS; müşteri kırılımı yetki bazlı",
      "Metrik tanımı sürümlü; tanım değişimi izli",
      "Ham abonelik verisi maskeli toplulaştırma",
    ],
    codeOptimization: [
      "MRR/ARR hareket-temelli türetilir; kohort artımlı",
      "Metrikler okuma-modeli/projeksiyondan; ağır hesap önceden",
      "Churn/NRR saf hesap, dönem bazlı",
    ],
    securityOptimization: [
      "Metrik tanımı tek kaynaktan; tutarsız tanım engellenir",
      "Geçmiş metrik snapshot'ı dokunulmaz (denetlenebilir)",
      "Toplulaştırma k-anonimlik benzeri eşikle korunur",
    ],
    performance: [
      "Metrik panosu önceden hesaplanmış projeksiyondan anlık",
      "Kohort matrisi büyük veride parçalı hesap",
      "Akış-temelli MRR güncellemesi",
    ],
    mobileApps: [
      "Mobilde MRR/churn KPI panosu",
      "iOS/Android push ile churn/anomali uyarısı",
      "Dar ekranda kohort özeti",
    ],
    wcag: [
      "Metrik grafikleri için metin alternatifi/veri tablosu (okuyucu)",
      "Trend yönü renk dışında ok+metinle; kontrast 7:1",
      "Pano filtreleri klavye erişimli",
    ],
    deployment: [
      "Analitik hesap motoru ayrı worker; pano okuma-modelinden",
      "Metrik olayları zamanlanmış yenilenir",
      "Shared hosting'de temel MRR/churn",
    ],
    eca: [
      ECA_BOUND,
      "Olay: abonelik hareketi oldu → MRR/ARR'yi güncelle + kohorta yansıt (idempotent, zincir ≤6)",
      "Olay: churn eşiği aşıldı → gelir ekibine uyarı + risk listesi (loop-breaker)",
    ],
    aiAgents: [
      AI_B1,
      AI_B2,
      "AI churn tahmini ve metrik anomali açıklaması üretir; metrik tanımını kendisi değiştiremez",
    ],
    testing: [
      "MRR/ARR/churn hesabı doğruluk testi (hareketlerden)",
      "Kohort/NRR tutarlılık testi",
      "Metrik pano kullanıcı yolculuğu + axe AAA; en çok 6 tur",
    ],
    owasp: [
      "A01 Access Control: müşteri kırılımı yetki bazlı",
      "A08 Integrity: metrik tanımı sürümlü ve snapshot'lı",
      "Toplulaştırma gizlilik eşikli",
    ],
    integration: [
      "Subscription-analytics, Billing (abonelik hareketleri) ve Revenue Recognition ile entegre",
      "CRM müşteri sağlık skoruna besleme",
      "FP&A gelir tahminine girdi",
    ],
    moduleUsage: [
      "Subscription-analytics ArcheType'ı Finans app'inde abonelik gelir analitiğini sağlar",
      "SaaS, faturalama ve gelir ekibi app'leri bu metrik sözleşmesini tüketir",
    ],
  },
};

const load = (id) => JSON.parse(fs.readFileSync(path.join(NODES, `${id}.json`), "utf8"));
const save = (id, n) => fs.writeFileSync(path.join(NODES, `${id}.json`), `${JSON.stringify(n, null, 2)}\n`);

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
console.log(`[seed-finance] ${applied} finans düğümü derinleştirildi (swarm).`);
