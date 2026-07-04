#!/usr/bin/env node
/**
 * report-weak-content — 17-boyut zayıf-halka raporu (salt-okur analiz + rapor dosyaları).
 *
 * Ne ölçer? Audit motorunun (tools/lib/score.mjs) skoru İÇERİK ZENGİNLİĞİ ölçer:
 *   concreteness (0.45: kısa/jenerik/token'sız madde cezası) + completeness (0.25:
 *   madde sayısı/notes/prompt) + applicability (0.30: prompt kalitesi + ölçü işareti).
 *   Yani "zayıf" çoğunlukla içerik fakirliği/derinlik eksikliğidir; şema ihlali DEĞİLDİR
 *   (şema ihlali dataIntegrity, kavram ihlali semantik kapıdadır).
 *
 * Sınıflar: short-items | generic | empty-but-not-na | missing-evidence |
 *           missing-ref | rollback-gap | semantic-warn | conscious-na | measured-short
 *
 * Çıktılar: reports/weak-content-17.json (makine) + docs/weak-content-17-report.md (insan)
 * Kullanım: node tools/agents/report-weak-content.mjs [--top N]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nodeSemanticFindings } from "../lib/dimension-semantics.mjs";
import { auditNode, isDimensionApplicable } from "../lib/score.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const topArg = process.argv.indexOf("--top");
const TOP = topArg > -1 ? Number(process.argv[topArg + 1]) : 100;

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
export function computeWeakStats() {
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
  const top = rows.slice(0, TOP);
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

const out = computeWeakStats();
const { totals, top40AvgScore } = out;
const top = out.weakestNodes;
const top40 = out.top40;
const top40Avg = top40AvgScore;
const dimTable = out.byDimension;

fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "reports", "weak-content-17.json"),
  `${JSON.stringify(out, null, 2)}\n`,
);

const md = [];
md.push(`# Zayıf İçerik Raporu — 17 Boyut (${out.generatedAt})`);
md.push("");
md.push(
  "Zayıflık = audit motorunun içerik-zenginliği skoru (concreteness 0.45 + completeness 0.25 + applicability 0.30). Şema/kavram ihlali değildir; onlar ayrı kapılardadır. Üretici: `node tools/agents/report-weak-content.mjs`.",
);
md.push("");
md.push("## Toplam sınıf dağılımı");
md.push("");
md.push(
  `short-items kartı: ${totals.shortItems} · generic kartı: ${totals.generic} · empty-but-not-na: ${totals.emptyButNotNa} · missing-evidence (node): ${totals.missingEvidence} · missing-ref (kart): ${totals.missingRef} · rollback-gap: ${totals.rollbackGap} · semantic-warn: ${totals.semanticWarn} · bilinçli N/A: ${totals.consciousNa}`,
);
md.push(`ölçülü-kısa kartı: ${totals.measuredShort}`);
md.push("");
md.push(`Top-40 zayıf node ortalama skoru: **${top40Avg.toFixed(3)}**`);
md.push("");
md.push("## Boyut bazlı zayıflık (short/measuredShort/generic/empty/warn)");
md.push("");
md.push("| boyut | short | measuredShort | generic | empty | warn | toplam |");
md.push("|---|---|---|---|---|---|---|");
for (const d of dimTable)
  md.push(
    `| ${d.key} | ${d.short} | ${d.measuredShort} | ${d.generic} | ${d.empty} | ${d.warn} | ${d.toplam} |`,
  );
md.push("");
md.push("## Seviye / küme ortalamaları");
md.push("");
for (const [k, v] of Object.entries(out.byLevel)) md.push(`- ${k}: ${v.count} node, ort. ${v.avg}`);
md.push("");
const worstClusters = Object.entries(out.byCluster)
  .sort(([, a], [, b]) => a.avg - b.avg)
  .slice(0, 8);
md.push(`En zayıf kümeler: ${worstClusters.map(([k, v]) => `${k} (${v.avg})`).join(", ")}`);
md.push("");
md.push(`## En zayıf ${TOP} node`);
md.push("");
md.push("| skor | id | seviye | küme | en zayıf boyut | bayraklar |");
md.push("|---|---|---|---|---|---|");
for (const r of top)
  md.push(
    `| ${r.score.toFixed(2)} | ${r.id} | ${r.level} | ${r.cluster} | ${r.weakestDimension} | ${r.flags.join(", ")} |`,
  );
md.push("");
md.push("## Top-40 önerilen aksiyon planı");
md.push("");
for (const r of top40)
  md.push(
    `- **${r.id}** (${r.score.toFixed(2)}, ${r.weakestDimension}): ${r.suggestedActions.join("; ") || "içerik derinleştirme"}`,
  );
md.push("");
fs.writeFileSync(path.join(ROOT, "docs", "weak-content-17-report.md"), `${md.join("\n")}\n`);

console.log(`Zayıf içerik raporu — ${out.nodeCount} node tarandı.`);
console.log(`Sınıflar: ${JSON.stringify(totals)}`);
console.log(`Top-40 ortalama: ${top40Avg.toFixed(3)}`);
console.log("Yazıldı: reports/weak-content-17.json + docs/weak-content-17-report.md");
