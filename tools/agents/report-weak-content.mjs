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
import { computeWeakStats } from "../lib/weak-content-analysis.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const topArg = process.argv.indexOf("--top");
const TOP = topArg > -1 ? Number(process.argv[topArg + 1]) : 100;

const out = computeWeakStats(TOP);
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
fs.writeFileSync(
  path.join(ROOT, "docs", "weak-content-17-report.md"),
  `${md.join("\n").trimEnd()}\n`,
);

console.log(`Zayıf içerik raporu — ${out.nodeCount} node tarandı.`);
console.log(`Sınıflar: ${JSON.stringify(totals)}`);
console.log(`Top-40 ortalama: ${top40Avg.toFixed(3)}`);
console.log("Yazıldı: reports/weak-content-17.json + docs/weak-content-17-report.md");
