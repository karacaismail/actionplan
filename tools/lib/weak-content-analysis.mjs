import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nodeSemanticFindings } from "./dimension-semantics.mjs";
import { auditNode, isDimensionApplicable } from "./score.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

// Dolu boyut kartı → beklenen standardRef eşlemesi (dimension-contract-17.md §1).
const DIM_REF = {
  observability: "observabilityRef",
  testing: "testingStandardRef",
  codeOptimization: "codingStandardRef",
  integration: "dataApiContractRef",
  aiAgents: "aiGovernanceRef",
  deployment: "releasePolicyRef",
};

const ACTION = {
  "short-items": "maddeleri ölçü/eşik/kanıtla genişlet (≥35 karakter, sayfaya-özgü)",
  generic: "jenerik kalıbı sayfaya-özgü ölçülü içerikle değiştir",
  "empty-but-not-na": "kartı doldur VEYA gerekçeli applicability=false yaz",
  "missing-evidence": "evidence[] alanına test/deploy/audit kanıtı bağla",
  "missing-ref": "dolu kartı ilgili tek-kaynak standardına bağla (standardRefs)",
  "rollback-gap": "düğüme özgü rollback planı yaz",
  "semantic-warn": "kartın must/anyOf kavramlarını içerecek gerçek içerik ekle",
};

/** Kapı (check-weak-content.mjs) için de kullanılan çekirdek analiz. */
export function computeWeakStats(topLimit = 100) {
  const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
  const rows = [];
  const byDim = {};
  const byLevel = {};
  const byCluster = {};
  const totals = {
    shortItems: 0,
    measuredShort: 0,
    generic: 0,
    emptyButNotNa: 0,
    missingEvidence: 0,
    missingRef: 0,
    rollbackGap: 0,
    semanticWarn: 0,
    consciousNa: 0,
  };

  for (const f of files) {
    const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
    const a = auditNode(n);
    const flags = new Set();
    for (const d of a.dimensions) {
      if (d.measuredShort > 0) {
        totals.measuredShort++;
        byDim[d.key] = byDim[d.key] ?? {
          short: 0,
          measuredShort: 0,
          generic: 0,
          empty: 0,
          warn: 0,
        };
        byDim[d.key].measuredShort++;
      }
      if (d.flags.includes("short-items")) {
        totals.shortItems++;
        flags.add("short-items");
        byDim[d.key] = byDim[d.key] ?? {
          short: 0,
          measuredShort: 0,
          generic: 0,
          empty: 0,
          warn: 0,
        };
        byDim[d.key].short++;
      }
      if (d.flags.includes("generic")) {
        totals.generic++;
        flags.add("generic");
        byDim[d.key] = byDim[d.key] ?? {
          short: 0,
          measuredShort: 0,
          generic: 0,
          empty: 0,
          warn: 0,
        };
        byDim[d.key].generic++;
      }
    }
    for (const [k, dim] of Object.entries(n.dimensions ?? {})) {
      const empty = !dim || dim.status === "skeleton" || !(dim.items ?? []).length;
      const na = n.applicability?.[k]?.applies === false;
      if (empty && na) totals.consciousNa++;
      else if (empty && isDimensionApplicable(n, k)) {
        totals.emptyButNotNa++;
        flags.add("empty-but-not-na");
        byDim[k] = byDim[k] ?? {
          short: 0,
          measuredShort: 0,
          generic: 0,
          empty: 0,
          warn: 0,
        };
        byDim[k].empty++;
      }
      if (!empty && DIM_REF[k] && !(n.standardRefs?.[DIM_REF[k]] ?? "").trim()) {
        totals.missingRef++;
        flags.add("missing-ref");
      }
    }
    if (!(n.evidence ?? []).length) {
      totals.missingEvidence++;
      flags.add("missing-evidence");
    }
    const relFilled =
      n.dimensions?.reliability &&
      n.dimensions.reliability.status !== "skeleton" &&
      (n.dimensions.reliability.items ?? []).length > 0;
    if (relFilled && !(n.rollback ?? "").trim()) {
      totals.rollbackGap++;
      flags.add("rollback-gap");
    }
    const sem = nodeSemanticFindings(n);
    totals.semanticWarn += sem.warnings.length;
    if (sem.warnings.length) flags.add("semantic-warn");
    for (const w of sem.warnings) {
      const k = w.split(".")[1]?.split(":")[0] ?? "?";
      byDim[k] = byDim[k] ?? {
        short: 0,
        measuredShort: 0,
        generic: 0,
        empty: 0,
        warn: 0,
      };
      byDim[k].warn++;
    }

    const row = {
      id: n.id,
      title: n.title,
      level: n.level,
      cluster: n.source?.cluster ?? "",
      score: a.score,
      weakestDimension: a.weakest,
      flags: [...flags].sort(),
      suggestedActions: [...flags].sort().map((fl) => ACTION[fl] ?? fl),
    };
    rows.push(row);
    byLevel[n.level] = byLevel[n.level] ?? { count: 0, scoreSum: 0 };
    byLevel[n.level].count++;
    byLevel[n.level].scoreSum += a.score;
    const cl = row.cluster || "(yok)";
    byCluster[cl] = byCluster[cl] ?? { count: 0, scoreSum: 0 };
    byCluster[cl].count++;
    byCluster[cl].scoreSum += a.score;
  }

  rows.sort((x, y) => x.score - y.score);
  const top = rows.slice(0, topLimit);
  const top40 = rows.slice(0, 40);
  const top40Avg = top40.reduce((s, r) => s + r.score, 0) / top40.length;

  const dimTable = Object.entries(byDim)
    .map(([k, v]) => ({
      key: k,
      ...v,
      toplam: v.short + v.measuredShort + v.generic + v.empty + v.warn,
    }))
    .sort((a, b) => b.toplam - a.toplam);

  const out = {
    generatedAt: new Date().toISOString().slice(0, 10),
    nodeCount: files.length,
    totals,
    top40AvgScore: Number(top40Avg.toFixed(3)),
    byDimension: dimTable,
    byLevel: Object.fromEntries(
      Object.entries(byLevel).map(([k, v]) => [
        k,
        { count: v.count, avg: Number((v.scoreSum / v.count).toFixed(2)) },
      ]),
    ),
    byCluster: Object.fromEntries(
      Object.entries(byCluster).map(([k, v]) => [
        k,
        { count: v.count, avg: Number((v.scoreSum / v.count).toFixed(2)) },
      ]),
    ),
    weakestNodes: top,
    top40,
  };
  return out;
}
