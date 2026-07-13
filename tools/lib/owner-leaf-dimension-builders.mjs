const scoped = (node, text) => `${node.id} — ${node.title}: ${text}`;

export const OWNER_LEAF_DIMENSION_BUILDERS = {
  featureDefs: (node, p) => [
    scoped(
      node,
      `işlev ve kapsam sınırı ${p.focus}; komşu domain davranışı non-goal olarak kalır.`,
    ),
    scoped(node, `Girdi: ${p.input}. Çıktı: ${p.output}.`),
    scoped(node, `durum/akış sözleşmesinin hata yolu şudur: ${p.failure}.`),
  ],
  security: (node, p) => [
    scoped(
      node,
      `tenant, kimlik ve yetki sınırı deny-by-default çalışır; ana tehditler ${p.threat}.`,
    ),
    scoped(
      node,
      "erişim kararı actor+tenant bağlamına göre verilir; reddedilen deneme reason code ve audit izi üretir.",
    ),
    scoped(
      node,
      "PII alanı varsa maskeleme/şifreleme ve RLS izolasyonu uygulanır; secret değer JSON/prompt/evidence içine yazılmaz.",
    ),
  ],
  codeOptimization: (node) => [
    scoped(
      node,
      "tipli JSON/schema contract'ı ile modüler producer-consumer ayrımı korunur; engine ve görünüm sorumlulukları karıştırılmaz.",
    ),
    scoped(
      node,
      "codingStandardRef içindeki karmaşıklık bütçesi ve lint gate çözülür; eşik metni bu task içine kopyalanmaz.",
    ),
    scoped(
      node,
      "refactor yalnız tekrarlı projection yolunu sadeleştirir; dead-code ve spekülatif abstraction handoff kapsamına alınmaz.",
    ),
  ],
  securityOptimization: (node, p) => [
    scoped(
      node,
      `secret/privilege yüzeyi harden edilir; rate-limit ve fail-closed davranış ${p.threat} riskini büyütmez.`,
    ),
    scoped(
      node,
      "dependency pin ve SBOM taraması quality gate'te çözülür; imzasız artifact veya geniş egress allowlist'e alınmaz.",
    ),
    scoped(
      node,
      "generated prompt/export secret taşımaz; credential rotasyonu ve least-privilege sahibi insan handoff'unda belirtilir.",
    ),
  ],
  performance: (node, p) => [
    scoped(node, p.performance),
    scoped(
      node,
      "indeks/cache veya input-hash cache kararı ölçümle gerekçelendirilir; pagination ya da load-test sonucu kanıtsız optimize edilmez.",
    ),
    scoped(
      node,
      "performans çıktısı p95 hedefi, fixture hacmi, ölçüm komutu ve regresyon sonucunu ayrı alanlarda raporlar.",
    ),
  ],
  mobileApps: (node, p) => [
    scoped(node, p.mobile),
    scoped(
      node,
      "responsive consumer contract iOS/Android/PWA üzerinde 44px touch hedefini ve dar viewport durumunu doğrular.",
    ),
    scoped(
      node,
      "offline/senkron kuyruğu ile native bridge/package aynı versioned contract'ı kullanır; client trust boundary genişlemez.",
    ),
  ],
  wcag: (node) => [
    scoped(
      node,
      "consumer UI'ya taşınan durum/reason code klavye ve görünür focus akışını, ARIA adını ve erişilebilir hata metnini destekler.",
    ),
    scoped(
      node,
      "screen-reader ve axe WCAG 2.2 AAA sonucu gerçek UI surface varsa evidence'a bağlanır; backend PASS'i UI kanıtı sayılmaz.",
    ),
    scoped(
      node,
      "responsive yüzeyde 44px hedef boyutu ve contrast kararı standardRefs'ten çözülür; bu task yalnız görev-özel acceptance üretir.",
    ),
  ],
  deployment: (node, p) => [
    scoped(node, p.deployment),
    scoped(
      node,
      "Docker/Compose/Swarm/K8s/Pages hedefi ancak traceability ile doğrulanır; config/env ayrımı ve health/readiness sonucu kaydedilir.",
    ),
    scoped(
      node,
      `rollback kapısı başarısız health/smoke sonucunda şu güvenli davranışı ister: ${p.failure}.`,
    ),
  ],
  eca: (node, p) => [
    scoped(
      node,
      `event tetikleyicisi ${p.input} bağlamını doğrular; koşul sağlanmazsa aksiyon çalışmaz.`,
    ),
    scoped(
      node,
      "ECA zinciri max 6 derinlikte kesilir; dış etkili action idempotency key olmadan yeniden oynatılamaz.",
    ),
    scoped(
      node,
      `approval/deny kolu insan onayı olmadan kapsam genişletmez; failure sonucu ${p.failure}.`,
    ),
  ],
  aiAgents: (node) => [
    scoped(
      node,
      "AI izin sınırı directive-only'dir; app/module ürün kodu üretmesi veya ruleset mutation yapması forbidden/deny sonucudur.",
    ),
    scoped(
      node,
      "kapsam, traceability ya da gerçek evidence değişikliği insan approval/step-up ister; kill-switch denetçi tarafından işletilir.",
    ),
    scoped(
      node,
      "sub_prompt güvenilmez girdi sayılır; secret/PII redaksiyonu yapılır ve geçmiş test/deploy sonucu uydurulmaz.",
    ),
  ],
  testing: (node, p) => [
    scoped(
      node,
      `unit ve integration negatif testleri şu failure mode'u önce kırmızı yakalar: ${p.failure}.`,
    ),
    scoped(
      node,
      `golden fixture ve contract evidence çıktısı ${p.output} kabul kriterlerine birebir bağlanır.`,
    ),
    scoped(
      node,
      "QA loop aynı davranışsal assertion için en çok 6 kez çalışır; skipped/red veya çalıştırılmamış sonuç PASS sayılmaz.",
    ),
  ],
  owasp: (node, p) => [
    scoped(
      node,
      `OWASP A01 access-control ve A03 injection threat modeli ${p.threat} risklerini kapsar.`,
    ),
    scoped(
      node,
      "ASVS input validation ile dependency/SBOM kontrolü typed boundary öncesinde fail-closed çalışır.",
    ),
    scoped(
      node,
      "negatif güvenlik denemesi reason code, redacted log ve denetim izi üretir; planlanan test actual evidence sayılmaz.",
    ),
  ],
  integration: (node, p) => [
    scoped(node, `kernel/core/module contract bağı typed API üzerinden kurulur; ${p.consumer}.`),
    scoped(
      node,
      "dependency yönü authority owner'dan consumer'a akar; consumer internali veya veritabanı ters yönde import edilmez.",
    ),
    scoped(
      node,
      "event bus payload'ı versioned schema ve correlation id taşır; contract kırığı integration testini kırmızı yapar.",
    ),
  ],
  moduleUsage: (node, p) => [
    scoped(node, `${p.consumer}.`),
    scoped(
      node,
      "capability/contract kapısı dışından doğrudan DB, tablo veya internal module import'u ile tüketim yasaktır.",
    ),
    scoped(
      node,
      "panel/CLI/SDK entegrasyonu aynı typed API ve event reason code'larını kullanır; owner sorumluluğunu kopyalamaz.",
    ),
  ],
  dataLifecycle: (node, p) => [
    scoped(node, p.lifecycle),
    scoped(
      node,
      "PII/KVKK-GDPR veri sınıfı owner tarafından doğrulanır; retention dolunca silme/anonimleştirme veya DSAR disposition'ı çalışır.",
    ),
    scoped(
      node,
      "migration/expand-contract öncesi backup alınır; rollback sonrası restore ve reconciliation sonucu bağımsız kanıta bağlanır.",
    ),
  ],
  observability: (node, p) => [
    scoped(
      node,
      `SLI/SLO ve error-budget metrik adı ${p.performance} yükümlülüğünü actual ölçümden üretir.`,
    ),
    scoped(
      node,
      "structured log ve trace correlation id taşır; secret/PII redacted kalır ve tenant cardinality alarmı izlenir.",
    ),
    scoped(node, `alert runbook'u on-call sahibine şu failure bağlamını verir: ${p.failure}.`),
  ],
  reliability: (node, p) => [
    scoped(
      node,
      `failure mode açıkça ${p.failure}; yeniden çalıştırma idempotency ile aynı sonucu korur.`,
    ),
    scoped(
      node,
      "transient hata retry+bounded backoff kullanır; tükenen kayıt DLQ/dead-letter kuyruğunda correlation id ile karantinaya alınır.",
    ),
    scoped(
      node,
      "circuit breaker açıldığında degrade davranışı fail-closed kalır; RTO/RPO ve restore doğrulaması insan handoff'unda karara bağlanır.",
    ),
  ],
};
