// Semantik boyut sözleşmesi (gap-2026-07-02-06, tur 2) — TEK KAYNAK.
// Hem CI kapısı (tools/agents/check-dimension-semantics.mjs) hem vitest
// (tests/content/dimensionSemantics.test.ts) bu modülü import eder; kural çiftlenmez.
//
// Ne yapar? Yeni 3 boyutun DOLU içeriğinde zorunlu kavramların (retention, SLO,
// idempotency...) geçtiğini denetler. "2-5 madde var" (biçim) yetmez; madde konuyu
// gerçekten kapsamalı (anlam). Eşik: her boyutta en az MIN kavram ailesi.
// Ne yapmaz? Boş/iskelet boyutu ZORLAMAZ (lazy migration) ve miras 14 boyuta karışmaz.

export const SEMANTIC_RULES = {
  dataLifecycle: {
    min: 2,
    concepts: {
      "retention/saklama": /retention|saklama süre/i,
      "silme/anonimleştirme (DSAR)": /\bsil(me|inir|inecek)|anonim|dsar|unutulma/i,
      "yedek/restore": /yedek|backup|restore|geri yükle/i,
      "migration modu": /migration|göç|append-only|expand-contract/i,
      "PII/KVKK-GDPR": /kvkk|gdpr|\bpii\b|kişisel veri/i,
    },
  },
  observability: {
    min: 2,
    concepts: {
      "SLI/SLO/error-budget": /\bslo\b|\bsli\b|error.?budget/i,
      metrik: /metrik|metric/i,
      "alarm/alert": /alarm|alert/i,
      runbook: /runbook|müdahale adım/i,
      "log/trace": /yapısal log|structured log|trace/i,
      "on-call": /on.?call|nöbet/i,
    },
  },
  reliability: {
    min: 2,
    concepts: {
      idempotency: /idempoten/i,
      "retry/backoff": /retry|backoff|yeniden dene/i,
      "circuit breaker": /circuit|devre kesici/i,
      "DLQ/dead-letter": /\bdlq\b|dead.?letter/i,
      "RTO/RPO": /\brto\b|\brpo\b/i,
      "failure mode": /failure mode|hata modu|arıza modu/i,
      "degrade davranışı": /degrade|kademeli/i,
    },
  },
};

export const SEMANTIC_KEYS = Object.keys(SEMANTIC_RULES);

/**
 * Bir boyutun içeriğini (items + notes) semantik sözleşmeye karşı değerlendirir.
 * Dönen: { ok, found[], missing[] }. Yalnız DOLU boyut için çağrılmalı.
 */
export function evaluateDimensionSemantics(key, dim) {
  const rules = SEMANTIC_RULES[key];
  if (!rules) return { ok: true, found: [], missing: [] };
  const text = [...(dim.items ?? []), dim.notes ?? ""].join(" \n ");
  const found = [];
  const missing = [];
  for (const [label, re] of Object.entries(rules.concepts)) {
    if (re.test(text)) found.push(label);
    else missing.push(label);
  }
  return { ok: found.length >= rules.min, found, missing };
}

/** Kapı/test ortak yardımcısı: düğümdeki dolu semantik boyutların ihlallerini döner. */
export function nodeSemanticViolations(node) {
  const out = [];
  for (const key of SEMANTIC_KEYS) {
    const dim = node.dimensions?.[key];
    if (!dim || dim.status === "skeleton" || (dim.items ?? []).length === 0) continue;
    const r = evaluateDimensionSemantics(key, dim);
    if (!r.ok)
      out.push(
        `${node.id}.${key}: ${r.found.length} kavram (< ${SEMANTIC_RULES[key].min}); eksik: ${r.missing.slice(0, 3).join(", ")}`,
      );
  }
  return out;
}
