// Semantik boyut sözleşmesi (gap-2026-07-02-06, tur 3) — TEK KAYNAK.
// Hem CI kapısı (tools/agents/check-dimension-semantics.mjs) hem vitest
// (tests/content/dimensionSemantics.test.ts) hem backfill self-check bu modülü
// import eder; kural çiftlenmez.
//
// Yapı (tur 3): must + anyOf.
//   - must: bu kavramların TÜMÜ içerikte geçmeli (ör. observability SLO'suz OLAMAZ).
//   - anyOf: bu aileden EN AZ 1 kavram geçmeli (derinlik kanıtı).
// Tur 2'nin "herhangi 2 kavram" kuralı yeterli değildi: SLO'suz observability,
// PII'siz dataLifecycle, failure-mode'suz reliability geçebiliyordu.
// Ne yapmaz? Boş/iskelet boyutu ZORLAMAZ (lazy migration) ve miras 14 boyuta karışmaz.

export const SEMANTIC_RULES = {
  dataLifecycle: {
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

/**
 * Bir boyutun içeriğini (items + notes) must+anyOf sözleşmesine karşı değerlendirir.
 * ok = tüm must'lar VE en az 1 anyOf. missing: "must: <kavram>" / "anyOf: (a | b | c)".
 * Yalnız DOLU boyut için çağrılmalı.
 */
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

/** Kapı/test/backfill ortak yardımcısı: düğümdeki dolu semantik boyut ihlallerini döner. */
export function nodeSemanticViolations(node) {
  const out = [];
  for (const key of SEMANTIC_KEYS) {
    const dim = node.dimensions?.[key];
    if (!dim || dim.status === "skeleton" || (dim.items ?? []).length === 0) continue;
    const r = evaluateDimensionSemantics(key, dim);
    if (!r.ok) out.push(`${node.id}.${key}: eksik → ${r.missing.join("; ")}`);
  }
  return out;
}
