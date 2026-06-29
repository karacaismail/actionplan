#!/usr/bin/env node
/**
 * check-short-code (ADR-0027 / short-code standardı — BLOKLAYICI). "Kısa kod" frenleri:
 * hiçbir kaynak dosyası SERT tavanı (700 satır) aşamaz; 300+ satır UYARI olarak raporlanır
 * (ratchet hedefi). AI ajanın büyük-dosya/gereksiz-soyutlama eğilimine karşı en kritik fren.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const HARD = 700;
const WARN = 300;
const v = [];
const warns = [];

const stdDir = path.join(ROOT, "src", "data", "standards");
if (!fs.existsSync(path.join(stdDir, "short-code.json")))
  v.push("short-code.json standardı yok (sözleşme kaynağı eksik)");

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "data" || e.name === "node_modules") continue;
      walk(fp);
    } else if (/\.(ts|tsx)$/.test(e.name)) files.push(fp);
  }
};
walk(path.join(ROOT, "src"));

let maxLines = 0;
let maxFile = "";
for (const fp of files) {
  const lines = fs.readFileSync(fp, "utf8").split("\n").length;
  if (lines > maxLines) {
    maxLines = lines;
    maxFile = path.relative(ROOT, fp);
  }
  if (lines > HARD) v.push(`${path.relative(ROOT, fp)}: ${lines} satır > sert tavan ${HARD}`);
  else if (lines > WARN) warns.push(`${path.relative(ROOT, fp)}: ${lines} satır`);
}

console.log(
  `Kısa kod — ${files.length} dosya; en büyük ${maxFile} (${maxLines}); tavan ${HARD}, uyarı ${WARN}; ${warns.length} uyarı.`,
);
for (const w of warns.slice(0, 10)) console.log(`  ~ uyarı: ${w}`);
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} ihlal`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
