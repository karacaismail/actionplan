// Semantik boyut sözleşmesi (dimension-contract-17.md'nin MAKİNE kaynağı) — TEK KAYNAK.
// Kapı (check-dimension-semantics.mjs), vitest (dimensionSemantics.test.ts) ve backfill
// aynı modülü import eder; kural çiftlenmez.
//
// Yapı: must (TÜMÜ geçmeli) + anyOf (≥1 geçmeli) + enforce ("fail" | "warn").
// enforce kademesi (2026-07-02 kalibrasyon ölçümü — 467 node):
//   - day-2 üçlüsü (dataLifecycle/observability/reliability): FAIL. İçerikleri
//     kavram-taşıyıcı üretildi; 1296 kart bu sözleşmeden geçiyor.
//   - miras 14: WARN-ratchet. Mevcut zengin içerik sayfaya-özgü domain diliyle
//     yazılmış (içerik kalite sözleşmesi jenerik kalıp cümleyi YASAKLAR); kelime
//     zorunluluğunu FAIL yapmak ya 3000+ kartı ezmeyi ya kuralı sulandırmayı
//     gerektirirdi. WARN sayılır, raporlanır; FAIL'e çevirme insan kararıdır
//     (içerik swarm turu ile birlikte).
// Ne yapmaz? Boş/iskelet boyutu zorlamaz (lazy migration).

export const SEMANTIC_RULES = {
  /* ---- miras 14 (enforce: warn — ratchet) ---- */
  featureDefs: {
    enforce: "warn",
    must: {
      "kapsam/işlev sınırı":
        /kapsam|sınır|scope|non.?goal|işlev|görünüm|birleştir|sağlar|gösterir/i,
    },
    anyOf: {
      "girdi/çıktı": /girdi|çıktı|input|output/i,
      "durum/akış": /durum|state|akış|yaşam döngüsü/i,
      "hata yolu": /hata|error|istisna/i,
      "sözleşme/kabul": /sözleşme|contract|kabul/i,
    },
  },
  security: {
    enforce: "warn",
    must: {
      "erişim/tenant/PII/yetki": /tenant|erişim|access|\bpii\b|yetki|authz|\brls\b|kimlik|rol/i,
    },
    anyOf: {
      "audit/deny": /audit|denetim|deny/i,
      "izolasyon/en-az-ayrıcalık": /izolasyon|en az ayrıcalık|least/i,
      "maskeleme/şifreleme/secret": /maskele|şifrele|secret|sır/i,
    },
  },
  codeOptimization: {
    enforce: "warn",
    must: {
      "kod sağlığı ekseni":
        /\btip\b|type|modüler|karmaşıklık|complexity|ölü kod|dead.?code|bölme|split|refactor/i,
    },
    anyOf: {
      "lint/kapı": /lint|kapı|gate/i,
      "bütçe/eşik": /bütçe|eşik|tavan|≤|sınır/i,
      ayrıştırma: /engine|ayrım|katman|soc/i,
    },
  },
  securityOptimization: {
    enforce: "warn",
    must: {
      "sertleştirme ekseni":
        /secret|sır|ayrıcalık|privilege|sertleş|harden|rotasyon|csp|rate.?limit/i,
    },
    anyOf: {
      "bağımlılık/SBOM": /bağımlılık|sbom|tarama|pin/i,
      "allowlist/imza": /allowlist|imza|signed/i,
      "egress/yüzey": /egress|yüzey|kapalı/i,
    },
  },
  performance: {
    enforce: "warn",
    must: { "ölçülebilir hedef": /\d+ ?ms|p9[59]|%\s?\d|\bslo\b|\d+ (sn|saniye|dk|rps)|hedef/i },
    anyOf: {
      "indeks/önbellek": /index|indeks|önbellek|cache/i,
      sayfalama: /sayfalama|pagination|keyset|cursor/i,
      "N+1/yük": /n\+1|yük test|load/i,
    },
  },
  mobileApps: {
    enforce: "warn",
    must: { "mobil yüzey": /mobil|pwa|extension|responsive|ios|android|capacitor|cihaz/i },
    anyOf: {
      offline: /offline|senkron/i,
      "dokunma hedefi": /dokunma|44|touch/i,
      "köprü/paketleme": /köprü|bridge|paket/i,
    },
  },
  wcag: {
    enforce: "warn",
    must: {
      "erişilebilirlik ekseni": /klavye|keyboard|odak|focus|kontrast|contrast|aria|erişilebilir/i,
    },
    anyOf: {
      "ekran okuyucu": /ekran okuyucu|screen.?reader/i,
      "axe/AAA kanıtı": /axe|aaa|wcag/i,
      "hedef boyutu": /44|hedef boyutu/i,
    },
  },
  deployment: {
    enforce: "warn",
    must: {
      "çalışma hedefi":
        /swarm|kubernetes|k8s|shared|pages|docker|compose|container|hosting|dağıtım/i,
    },
    anyOf: {
      "health/probe": /health|sağlık|liveness|readiness/i,
      rollback: /rollback|geri.?al/i,
      "config/sır": /config|sır|env/i,
    },
  },
  eca: {
    enforce: "warn",
    must: { "olay-eylem": /olay|event|tetikle/i },
    anyOf: {
      "zincir/döngü sınırı": /döngü|zincir|derinlik|maks 6|maxchain/i,
      idempotency: /idempoten/i,
      "onay/deny": /onay|approval|deny/i,
    },
  },
  aiAgents: {
    enforce: "warn",
    must: {
      "izin/yasak sınırı":
        /yasak|izin|deny|allowed|forbidden|üretemez|değiştiremez|sınır|mutasyon/i,
    },
    anyOf: {
      "insan onayı/step-up": /onay|step.?up|insan/i,
      "kill-switch": /kill.?switch/i,
      "sub_prompt güvensiz": /sub_prompt|güvenilmez|redaksiyon/i,
    },
  },
  testing: {
    enforce: "warn",
    must: { "test türü": /unit|e2e|entegrasyon|integration|journey|playwright|birim/i },
    anyOf: {
      "negatif senaryo": /negatif|negative/i,
      "kanıt/fixture": /kanıt|evidence|golden|fixture/i,
      "loop/QA": /loop|döngü|qa/i,
    },
  },
  owasp: {
    enforce: "warn",
    must: {
      "tehdit sınıfı": /injection|access control|ssrf|owasp|\ba0?\d\b|llm|tehdit|prompt injection/i,
    },
    anyOf: {
      "ASVS/NIST/SBOM": /asvs|nist|sbom/i,
      "girdi doğrulama": /doğrulama|validation/i,
      "denetim izi": /denetim izi|loglama/i,
    },
  },
  integration: {
    enforce: "warn",
    must: { "sözleşmeli bağ": /kernel|core|modül|sözleşme|contract/i },
    anyOf: {
      "olay veriyolu": /olay|event|bus|veriyolu/i,
      "bağımlılık yönü": /bağımlılık|yön/i,
      "tipli arayüz/API": /arayüz|api|tipli/i,
    },
  },
  moduleUsage: {
    enforce: "warn",
    must: { "tüketim yolu": /tüket|kullan|consume|api|olay|capability|ürün ailesi/i },
    anyOf: {
      "doğrudan-DB yasağı": /doğrudan (db|tablo|veritabanı)/i,
      "Contract kapısı": /contract|kapı|sözleşme/i,
      "panel/entegrasyon": /panel|entegre/i,
    },
  },

  /* ---- day-2 üçlüsü (enforce: fail) ---- */
  dataLifecycle: {
    enforce: "fail",
    must: {
      "retention/saklama": /retention|saklama süre|saklama takvimi/i,
      "PII/KVKK-GDPR/veri sınıfı": /kvkk|gdpr|\bpii\b|kişisel veri|veri sınıf/i,
    },
    anyOf: {
      "silme/anonimleştirme (DSAR)": /\bsil(me|inir|inecek)|anonim|dsar|unutulma/i,
      "yedek/restore": /yedek|backup|restore|geri yükle/i,
      "migration modu": /migration|göç|append-only|expand-contract/i,
    },
  },
  observability: {
    enforce: "fail",
    must: {
      "SLI/SLO/error-budget": /\bslo\b|\bsli\b|error.?budget/i,
      metrik: /metrik|metric/i,
    },
    anyOf: {
      "alarm/alert": /alarm|alert/i,
      runbook: /runbook|müdahale adım/i,
      "log/trace": /yapısal log|structured log|trace|\blog\b/i,
      "on-call": /on.?call|nöbet/i,
    },
  },
  reliability: {
    enforce: "fail",
    must: {
      "failure mode": /failure mode|hata modu|arıza modu/i,
      idempotency: /idempoten/i,
    },
    anyOf: {
      "retry/backoff": /retry|backoff|yeniden dene/i,
      "DLQ/dead-letter": /\bdlq\b|dead.?letter/i,
      "circuit breaker": /circuit|devre kesici/i,
      "RTO/RPO": /\brto\b|\brpo\b/i,
      "degrade davranışı": /degrade|kademeli/i,
    },
  },
};

export const SEMANTIC_KEYS = Object.keys(SEMANTIC_RULES);

/** must+anyOf değerlendirmesi. ok = tüm must + ≥1 anyOf. Yalnız DOLU boyut için çağrılır. */
export function evaluateDimensionSemantics(key, dim) {
  const rules = SEMANTIC_RULES[key];
  if (!rules) return { ok: true, found: [], missing: [] };
  const text = [...(dim.items ?? []), dim.notes ?? ""].join(" \n ");
  const found = [];
  const missing = [];
  for (const [label, re] of Object.entries(rules.must)) {
    if (re.test(text)) found.push(`must: ${label}`);
    else missing.push(`must: ${label}`);
  }
  let anyHit = false;
  for (const [label, re] of Object.entries(rules.anyOf)) {
    if (re.test(text)) {
      anyHit = true;
      found.push(`anyOf: ${label}`);
    }
  }
  if (!anyHit) missing.push(`anyOf: (${Object.keys(rules.anyOf).join(" | ")})`);
  const mustOk = Object.keys(rules.must).every((label) => found.includes(`must: ${label}`));
  return { ok: mustOk && anyHit, found, missing };
}

/** Düğümdeki dolu boyutları tarar; {violations (fail-kademesi), warnings (warn-kademesi)} döner. */
export function nodeSemanticFindings(node) {
  const violations = [];
  const warnings = [];
  for (const key of SEMANTIC_KEYS) {
    const dim = node.dimensions?.[key];
    if (!dim || dim.status === "skeleton" || (dim.items ?? []).length === 0) continue;
    const r = evaluateDimensionSemantics(key, dim);
    if (r.ok) continue;
    const msg = `${node.id}.${key}: eksik → ${r.missing.join("; ")}`;
    if (SEMANTIC_RULES[key].enforce === "fail") violations.push(msg);
    else warnings.push(msg);
  }
  return { violations, warnings };
}

/** Geriye uyumlu: yalnız FAIL-kademesi ihlalleri (day-2 üçlüsü). Backfill self-check bunu kullanır. */
export function nodeSemanticViolations(node) {
  return nodeSemanticFindings(node).violations;
}
