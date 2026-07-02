// Denetim skorlama — src/engine/audit.ts'in birebir JS aynası (offline rapor + lint için).
// Sapma tests/audit-parity.test.ts ile engellenir. Değişiklik ikisinde de yapılmalı.

export const AUDIT_WEIGHTS = { concreteness: 0.45, completeness: 0.25, applicability: 0.3 };
export const GENERIC_MARKERS = [
  "uygulanabilir önlemler",
  "gerekli optimizasyon",
  "ilgili standartlara uyum",
  "best practice",
  "en iyi pratik",
  "placeholder",
  "lorem",
  "todo",
  "örnek madde",
  "tanımlanacak",
  "doldurulacak",
];
export const DIMENSION_KEYS = [
  "featureDefs",
  "security",
  "codeOptimization",
  "securityOptimization",
  "performance",
  "mobileApps",
  "wcag",
  "deployment",
  "eca",
  "aiAgents",
  "testing",
  "owasp",
  "integration",
  "moduleUsage",
  "dataLifecycle",
  "observability",
  "reliability",
];

// N/A politikası — src/engine/audit.ts isDimensionApplicable'ın birebir aynası
// (seviye-bazlı varsayılan N/A + risk istisnası; açık applicability her zaman kazanır).
const DEFAULT_NA_LEVELS = new Set(["work_unit", "micro_step"]);
const DEFAULT_NA_KEYS = new Set(["dataLifecycle", "observability"]);
export const RISK_SIGNAL =
  /\bpii\b|kvkk|gdpr|kişisel veri|migration|göç|backfill|webhook|retry|idempoten|queue|kuyruk|outbox|dlq|dead.?letter|cron|\bjob\b|worker|background|yedek|backup|restore|saga|stream/i;
export function hasRiskSignal(node) {
  const hay = [node.id, node.title, node.summary, ...(node.tags ?? [])].join(" ");
  return RISK_SIGNAL.test(hay);
}
export function isDimensionApplicable(node, key) {
  const ap = node.applicability?.[key];
  if (ap) return ap.applies !== false;
  if (!(DEFAULT_NA_LEVELS.has(node.level) && DEFAULT_NA_KEYS.has(key))) return true;
  return hasRiskSignal(node);
}

const SHORT_ITEM = 35;
const VAGUE_ITEM = 60;
const clamp = (n, lo = 0, hi = 3) => Math.max(lo, Math.min(hi, n));
const round2 = (n) => Math.round(n * 100) / 100;

export function domainTokens(node) {
  const raw = [node.id, node.title, node.summary, ...(node.tags ?? [])].join(" ").toLowerCase();
  const out = new Set();
  for (const w of raw.split(/[^a-zçğıöşü0-9]+/i)) if (w.length >= 4) out.add(w);
  return out;
}
const hasGeneric = (s) => {
  const low = s.toLowerCase();
  return GENERIC_MARKERS.some((m) => low.includes(m));
};

export function scoreDimension(dim, tokens) {
  const flags = [];
  const items = dim.items ?? [];
  const key = dim.key;
  if (dim.status === "skeleton" || items.length === 0) {
    if (dim.status === "skeleton") flags.push("skeleton");
    return { key, concreteness: 0, completeness: 0, applicability: 0, score: 0, flags };
  }
  let short = 0;
  let vague = 0;
  let generic = 0;
  for (const it of items) {
    const t = it.trim();
    if (t.length < SHORT_ITEM) short++;
    const hasToken = [...tokens].some((tok) => t.toLowerCase().includes(tok));
    if (!hasToken && t.length < VAGUE_ITEM) vague++;
    if (hasGeneric(t)) generic++;
  }
  const uniq = new Set(items.map((i) => i.trim().toLowerCase()));
  const dup = items.length - uniq.size;
  if (dup > 0) flags.push("duplicate-items");
  if (generic > 0) flags.push("generic");
  if (short > 0) flags.push("short-items");
  const concreteness = clamp(3 - short * 0.4 - vague * 0.5 - dup * 0.6 - generic * 1.5);

  const itemsScore = Math.min(1, items.length / 3) * 1.8;
  const notesScore = (dim.notes ?? "").trim() ? 0.6 : 0;
  const promptScore = (dim.prompt ?? "").trim() ? 0.6 : 0;
  const completeness = clamp(itemsScore + notesScore + promptScore);
  if (completeness < 2) flags.push("incomplete");

  const p = (dim.prompt ?? "").trim();
  let app = 0;
  if (p.length > 120) app += 1;
  if (p.toLowerCase().includes("kapsa")) app += 0.6;
  if (/güvenlik sınırı|kısıt|çıktı:/i.test(p)) app += 0.6;
  if ([...tokens].some((tok) => p.toLowerCase().includes(tok))) app += 0.8;
  if (items.some((i) => /\d|%|p95|≥|<|rls|owasp|wcag/i.test(i))) app += 0.5;
  if (p.length === 0) app = Math.min(app + items.length * 0.3, 1.2);
  const applicability = clamp(app);
  if (applicability < 1.5) flags.push("low-applicability");

  const score = round2(
    concreteness * AUDIT_WEIGHTS.concreteness +
      completeness * AUDIT_WEIGHTS.completeness +
      applicability * AUDIT_WEIGHTS.applicability,
  );
  return {
    key,
    concreteness: round2(concreteness),
    completeness: round2(completeness),
    applicability: round2(applicability),
    score,
    flags,
  };
}

function rollupProvenance(dims) {
  const set = new Set(dims.filter((d) => d.status !== "skeleton").map((d) => d.provenance));
  if (set.size === 0) return "none";
  if (set.size === 1) return [...set][0];
  return "mixed";
}

export function auditNode(node) {
  const tokens = domainTokens(node);
  const dims = DIMENSION_KEYS.filter((k) => isDimensionApplicable(node, k))
    .map((k) => node.dimensions?.[k])
    .filter(Boolean);
  const scores = dims.map((d) => scoreDimension(d, tokens));
  const filled = dims.filter((d) => d.status !== "skeleton").length;
  const score = scores.length ? round2(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
  let weakest = null;
  let min = Number.POSITIVE_INFINITY;
  for (const s of scores)
    if (s.score < min) {
      min = s.score;
      weakest = s.key;
    }
  const flags = [...new Set(scores.flatMap((s) => s.flags))];
  return {
    id: node.id,
    level: node.level,
    title: node.title,
    cluster: node.source?.cluster ?? "",
    provenance: rollupProvenance(dims),
    score,
    filled,
    weakest,
    dimensions: scores,
    flags,
  };
}

export function auditAll(nodes) {
  return nodes.map(auditNode);
}

export function summarize(audits, weakestN = 20) {
  const bands = { strong: 0, ok: 0, weak: 0, missing: 0 };
  const byProvenance = {};
  let sum = 0;
  for (const a of audits) {
    sum += a.score;
    byProvenance[a.provenance] = (byProvenance[a.provenance] ?? 0) + 1;
    if (a.filled === 0) bands.missing++;
    else if (a.score >= 2.3) bands.strong++;
    else if (a.score >= 1.5) bands.ok++;
    else bands.weak++;
  }
  const weakest = [...audits]
    .sort((a, b) => a.score - b.score)
    .slice(0, weakestN)
    .map((a) => ({ id: a.id, title: a.title, score: a.score }));
  return {
    total: audits.length,
    scored: audits.filter((a) => a.filled > 0).length,
    avg: audits.length ? round2(sum / audits.length) : 0,
    bands,
    byProvenance,
    weakest,
  };
}
