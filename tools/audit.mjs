#!/usr/bin/env node
/**
 * audit — tüm düğümleri skorlar, public/data/audit.json (skor kartı) +
 * docs/audit-report.md (özet rapor) üretir. Skorlama tools/lib/score.mjs'ten gelir
 * (uygulama-içi denetim görünümüyle aynı mantık).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditAll, summarize } from "./lib/score.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const OUT_JSON = path.join(ROOT, "public", "data", "audit.json");
const OUT_MD = path.join(ROOT, "docs", "audit-report.md");

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const audits = auditAll(nodes);
const summary = summarize(audits, 25);

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(
  OUT_JSON,
  `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), summary, nodes: audits }, null, 2)}\n`,
);

const pct = (n) => `${Math.round((n / summary.total) * 100)}%`;
const flagCounts = {};
for (const a of audits) for (const f of a.flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;

const md = [
  "# Denetim Raporu (audit)",
  "",
  `Üretim: ${new Date().toISOString().slice(0, 10)} · Kaynak: \`tools/audit.mjs\` · Skorlama: \`tools/lib/score.mjs\` (uygulama ile ortak).`,
  "",
  "Her boyut 0-3: **somutluk+benzersizlik (0.45)**, **tamlık (0.25)**, **uygulanabilirlik (0.30)** ağırlıklı bileşik. Düğüm skoru = 14 boyutun ortalaması.",
  "",
  "## Özet",
  "",
  `- Toplam düğüm: **${summary.total}** · skorlanan (en az 1 dolu boyut): **${summary.scored}**`,
  `- Ortalama düğüm skoru: **${summary.avg} / 3**`,
  `- Güçlü (≥2.3): **${summary.bands.strong}** (${pct(summary.bands.strong)}) · Orta (1.5-2.3): **${summary.bands.ok}** (${pct(summary.bands.ok)}) · Zayıf (<1.5): **${summary.bands.weak}** (${pct(summary.bands.weak)}) · Boş: **${summary.bands.missing}**`,
  "",
  "### Köken dağılımı (provenance)",
  "",
  ...Object.entries(summary.byProvenance).map(([k, v]) => `- ${k}: ${v}`),
  "",
  "### Bayrak dağılımı (en sık kalite sorunları)",
  "",
  ...Object.entries(flagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- \`${k}\`: ${v} düğümde`),
  "",
  `## En zayıf ${summary.weakest.length} düğüm (öncelikli zenginleştirme)`,
  "",
  "| Skor | id | Başlık |",
  "| ---: | --- | --- |",
  ...summary.weakest.map((w) => `| ${w.score} | \`${w.id}\` | ${w.title} |`),
  "",
  "## Yorum",
  "",
  "Güçlü banttaki düğümler (CRM, veri-zekâ, kernel) golden çıtayı temsil eder; zayıf bant",
  "merkezî generator ile doldurulmuş ve benzersiz/somut içerikle zenginleştirilmeyi bekleyen",
  "düğümlerdir. Kalite kapısı (`tools/quality-lint.mjs`) golden düğümlerin gerilemesini ve",
  "yeni eklenen düğümlerin eşik altı kalmasını engeller.",
  "",
].join("\n");
fs.writeFileSync(OUT_MD, md);

console.log(
  `[audit] ${summary.total} düğüm skorlandı · ortalama ${summary.avg}/3 · güçlü ${summary.bands.strong} / orta ${summary.bands.ok} / zayıf ${summary.bands.weak}.`,
);
console.log(`[audit] yazıldı: public/data/audit.json, docs/audit-report.md`);
