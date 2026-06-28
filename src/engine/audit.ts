import { DIMENSION_KEYS, type Dimension, type DimensionKey, type TaskNode } from "@/schemas";

/**
 * Denetim (audit) motoru — JSON içeriğinin kalitesini ölçer.
 * Her boyut 0-3 ölçeğinde üç eksende puanlanır; bileşik = ağırlıklı ortalama:
 *   - concreteness (somutluk + benzersizlik) 0.45
 *   - completeness  (tamlık)                 0.25
 *   - applicability (uygulanabilirlik)       0.30
 * Tek doğruluk kaynağıdır: hem uygulama-içi denetim görünümü hem de
 * offline rapor üreticisi (tools/lib/score.mjs) bu mantığı birebir yansıtır
 * (tests/audit-parity.test.ts ile sapma engellenir).
 */

export const AUDIT_WEIGHTS = {
  concreteness: 0.45,
  completeness: 0.25,
  applicability: 0.3,
} as const;

/** Düşük puana iten kalıp ifadeler (merkezî generator/placeholder izleri). */
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

const SHORT_ITEM = 35;
const VAGUE_ITEM = 60;

export interface DimensionScore {
  key: DimensionKey;
  concreteness: number;
  completeness: number;
  applicability: number;
  score: number;
  flags: string[];
}

export interface NodeAudit {
  id: string;
  level: string;
  title: string;
  cluster: string;
  provenance: "template" | "swarm" | "human" | "mixed" | "none";
  score: number;
  filled: number;
  weakest: DimensionKey | null;
  dimensions: DimensionScore[];
  flags: string[];
}

export interface AuditSummary {
  total: number;
  scored: number;
  avg: number;
  bands: { strong: number; ok: number; weak: number; missing: number };
  byProvenance: Record<string, number>;
  weakest: { id: string; title: string; score: number }[];
}

const clamp = (n: number, lo = 0, hi = 3) => Math.max(lo, Math.min(hi, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Düğümün kimlik/etiket/özetinden alan-jetonları (benzersizlik sinyali). */
export function domainTokens(
  node: Pick<TaskNode, "id" | "title" | "tags" | "summary">,
): Set<string> {
  const raw = [node.id, node.title, node.summary, ...(node.tags ?? [])].join(" ").toLowerCase();
  const out = new Set<string>();
  for (const w of raw.split(/[^a-zçğıöşü0-9]+/i)) if (w.length >= 4) out.add(w);
  return out;
}

const hasGeneric = (s: string) => {
  const low = s.toLowerCase();
  return GENERIC_MARKERS.some((m) => low.includes(m));
};

export function scoreDimension(dim: Dimension, tokens: Set<string>): DimensionScore {
  const flags: string[] = [];
  const items = dim.items ?? [];
  const key = dim.key;

  if (dim.status === "skeleton" || items.length === 0) {
    if (dim.status === "skeleton") flags.push("skeleton");
    return { key, concreteness: 0, completeness: 0, applicability: 0, score: 0, flags };
  }

  // concreteness + benzersizlik
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

  // completeness
  const itemsScore = Math.min(1, items.length / 3) * 1.8;
  const notesScore = (dim.notes ?? "").trim() ? 0.6 : 0;
  const promptScore = (dim.prompt ?? "").trim() ? 0.6 : 0;
  const completeness = clamp(itemsScore + notesScore + promptScore);
  if (completeness < 2) flags.push("incomplete");

  // applicability — prompt bloğu bir ajana verilse işe yarar mı + ölçülebilirlik
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

function rollupProvenance(dims: Dimension[]): NodeAudit["provenance"] {
  const set = new Set(dims.filter((d) => d.status !== "skeleton").map((d) => d.provenance));
  if (set.size === 0) return "none";
  if (set.size === 1) return [...set][0] as NodeAudit["provenance"];
  return "mixed";
}

export function auditNode(node: TaskNode): NodeAudit {
  const tokens = domainTokens(node);
  const dims = DIMENSION_KEYS.map((k) => node.dimensions?.[k]).filter((d): d is Dimension =>
    Boolean(d),
  );
  const scores = dims.map((d) => scoreDimension(d, tokens));
  const filled = dims.filter((d) => d.status !== "skeleton").length;
  const score = scores.length ? round2(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
  let weakest: DimensionKey | null = null;
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

export function auditAll(nodes: TaskNode[]): NodeAudit[] {
  return nodes.map(auditNode);
}

export function summarize(audits: NodeAudit[], weakestN = 20): AuditSummary {
  const bands = { strong: 0, ok: 0, weak: 0, missing: 0 };
  const byProvenance: Record<string, number> = {};
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
